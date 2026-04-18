import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Paper,
  Box,
  Snackbar,
  Alert,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  Send as SendIcon,
  AccountTree,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  BrokenImage,
  AddCircleOutline,
  RestartAlt,
  PhotoCamera,
} from "@mui/icons-material";
import {
  AI_ASSISTANT_MAX_CONTEXT_MESSAGE_CHARS,
  AI_ASSISTANT_MAX_CONTEXT_MESSAGES,
  AI_ASSISTANT_MAX_MESSAGE_CHARS,
  analyzeSeedFunc,
  getCallableErrorMessage,
} from "../lib/firebase";
import { SeedAssistantResponse } from "../schemas/seedSchemas";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  seedData?: SeedAssistantResponse;
  imageUrl?: string; // Add image URL for display
}

// Default empty seed for the preview card
const emptySeed: Seed = {
  id: "",
  breeder: "",
  strain: "",
  lineage: "",
  generation: "",
  numSeeds: 0,
  feminized: false,
  open: false,
  available: false,
  isMultiple: false,
  quantity: 1,
  dateAcquired: new Date().toISOString(),
};

// Initial welcome message
const initialMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help catalog your seeds. Tell me about a seed pack you'd like to add to your collection, or upload a photo of the seed pack.",
};

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_COMPRESSED_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_LONG_EDGE = 1600;
const IMAGE_JPEG_QUALITY = 0.75;

export default function ConversationalSeedAssistant() {
  const { addSeed } = useSeedContext();
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [previewSeed, setPreviewSeed] = useState<Seed>(emptySeed);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Reference to the chat messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);

  // Use theme for consistent spacing and breakpoints
  const theme = useTheme();

  // Only keep the isMobile breakpoint since it's the only one we're actually using
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use parent container's scrolling instead of scrollIntoView
      const chatContainer = messagesEndRef.current.parentElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  const getErrorMessage = (err: unknown, fallback: string) => {
    return err instanceof Error && err.message ? err.message : fallback;
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }

    setSelectedImage(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setCompressedSelectedImage = (file: File) => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    imagePreviewUrlRef.current = previewUrl;
    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Unable to read image data."));
          return;
        }

        const base64 = result.split(",")[1];
        if (!base64) {
          reject(new Error("Unable to read image data."));
          return;
        }

        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Unable to read image data."));
      reader.readAsDataURL(file);
    });
  };

  const loadImageElement = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to read the selected image."));
      };
      image.src = objectUrl;
    });
  };

  const getCompressedFileName = (file: File) => {
    const baseName = file.name.replace(/\.[^/.]+$/, "") || "seed-pack";
    return `${baseName}.jpg`;
  };

  const compressImageFile = async (file: File): Promise<File> => {
    const image = await loadImageElement(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Unable to read the selected image dimensions.");
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_LONG_EDGE / Math.max(sourceWidth, sourceHeight)
    );
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to prepare image compression.");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to compress image."));
          }
        },
        "image/jpeg",
        IMAGE_JPEG_QUALITY
      );
    });

    if (blob.size > MAX_COMPRESSED_IMAGE_BYTES) {
      throw new Error(
        "Image is still larger than 2 MB after compression. Try a smaller crop."
      );
    }

    return new File([blob], getCompressedFileName(file), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      clearSelectedImage();
      setSnackbar({
        open: true,
        message: "Please select a JPEG, PNG, or WebP image.",
        severity: "error",
      });
      return;
    }

    setCompressingImage(true);

    try {
      const compressedFile = await compressImageFile(file);
      setCompressedSelectedImage(compressedFile);
    } catch (err) {
      clearSelectedImage();
      setSnackbar({
        open: true,
        message: getErrorMessage(err, "Unable to prepare image."),
        severity: "error",
      });
    } finally {
      setCompressingImage(false);
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !selectedImage) || loading || compressingImage) return;

    setLoading(true);

    const submittedMessage = input.trim() || "Analyze this seed pack image";
    if (submittedMessage.length > AI_ASSISTANT_MAX_MESSAGE_CHARS) {
      setSnackbar({
        open: true,
        message: `Message must be ${AI_ASSISTANT_MAX_MESSAGE_CHARS} characters or less.`,
        severity: "error",
      });
      setLoading(false);
      return;
    }

    const imageToSubmit = selectedImage;
    let newMessages = messages;

    try {
      let base64Data: string | undefined;
      let submittedImageUrl: string | undefined;

      if (imageToSubmit) {
        base64Data = await convertImageToBase64(imageToSubmit);
        submittedImageUrl = `data:${imageToSubmit.type};base64,${base64Data}`;
      }

      const userMessage: ChatMessage = {
        role: "user",
        content: submittedMessage,
        imageUrl: submittedImageUrl,
      };

      newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");

      const contextMessages = newMessages
        .slice(-AI_ASSISTANT_MAX_CONTEXT_MESSAGES)
        .map((message) => ({
          role: message.role,
          content: message.content.slice(0, AI_ASSISTANT_MAX_CONTEXT_MESSAGE_CHARS),
        }));

      const requestData: {
        message: string;
        previousContext: string;
        imageData?: string;
        imageMimeType?: string;
      } = {
        message: submittedMessage,
        previousContext: JSON.stringify({ messages: contextMessages }),
      };

      if (imageToSubmit && base64Data) {
        requestData.imageData = base64Data;
        requestData.imageMimeType = imageToSubmit.type;
      }

      const response = await analyzeSeedFunc(requestData);

      // Update the preview seed with the extracted data
      if (response.data.seed.breeder || response.data.seed.strain) {
        setPreviewSeed((prev) => ({
          ...prev,
          breeder: response.data.seed.breeder || prev.breeder,
          strain: response.data.seed.strain || prev.strain,
          lineage: response.data.seed.lineage || prev.lineage,
          generation: response.data.seed.generation || prev.generation,
          numSeeds: response.data.seed.numSeeds || prev.numSeeds,
          feminized: response.data.seed.feminized,
          open: response.data.seed.open,
          available: response.data.seed.available,
          isMultiple: response.data.seed.isMultiple,
          quantity: response.data.seed.quantity || prev.quantity,
        }));
        setShowSeedPreview(true);
      }

      // Format assistant response
      let assistantMessage = "I've extracted information about your seeds.\n\n";

      if (response.data.seed.breeder && response.data.seed.strain) {
        assistantMessage += `I see you have ${response.data.seed.strain} from ${response.data.seed.breeder}.\n`;
      }

      if (response.data.missingInfo.length > 0) {
        assistantMessage += "\nI still need some details:\n";
        response.data.suggestedQuestions.forEach((question) => {
          assistantMessage += "- " + question + "\n";
        });
      }

      // Create a properly typed assistant message
      const assistantResponseMessage: ChatMessage = {
        role: "assistant",
        content: assistantMessage,
        seedData: response.data,
      };

      setMessages([...newMessages, assistantResponseMessage]);
      clearSelectedImage();
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: getCallableErrorMessage(
          err,
          "Sorry, I had trouble processing that. Could you try rephrasing or uploading a clearer image?"
        ),
      };

      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCatalog = async (seedData: SeedAssistantResponse) => {
    try {
      // Create a complete Seed object that satisfies the Seed type
      const newSeed: Seed = {
        id: uuidv4(), // Generate a temporary ID, Firebase will replace this
        breeder: seedData.seed.breeder,
        strain: seedData.seed.strain,
        numSeeds: seedData.seed.numSeeds,
        feminized: seedData.seed.feminized,
        open: seedData.seed.open,
        available: seedData.seed.available,
        isMultiple: seedData.seed.isMultiple,
        quantity: seedData.seed.quantity,
        dateAcquired: new Date().toISOString(),
        // Handle optional fields with default empty strings
        lineage: seedData.seed.lineage || "",
        generation: seedData.seed.generation || "",
        // userId will be added by the SeedContext
      };

      await addSeed(newSeed);
      setSnackbar({
        open: true,
        message: "Seed added to your catalog!",
        severity: "success",
      });

      // Reset the conversation after adding the seed
      resetConversation();
    } catch (err) {
      console.error("Failed to add seed:", err);
      setSnackbar({
        open: true,
        message: "Failed to add seed to catalog",
        severity: "error",
      });
    }
  };

  // New function to reset the conversation
  const resetConversation = () => {
    // Reset to initial state
    setMessages([
      {
        role: "assistant",
        content:
          "Seed added! Tell me about another seed pack you'd like to add, or upload a photo.",
      },
    ]);
    setPreviewSeed(emptySeed);
    setShowSeedPreview(false);
    clearSelectedImage();
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", md: "800px" },
        mx: "auto",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Seed Assistant Chat</Typography>
          <Tooltip title="Reset conversation">
            <IconButton
              onClick={resetConversation}
              size="small"
              color="primary"
            >
              <RestartAlt />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          {/* Chat Messages Area */}
          <Box
            sx={{
              height: { xs: "350px", md: "400px" },
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                maxHeight: "100%",
              }}
              ref={messagesEndRef}
            >
              <Stack spacing={1} sx={{ padding: 1 }}>
                {messages.map((msg, i) => (
                  <Paper
                    key={i}
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor:
                        msg.role === "assistant"
                          ? "primary.dark"
                          : "background.paper",
                      alignSelf:
                        msg.role === "assistant" ? "flex-start" : "flex-end",
                      maxWidth: { xs: "90%", sm: "80%", md: "75%" },
                      position: "relative",
                    }}
                  >
                    {msg.imageUrl && (
                      <Box sx={{ mb: 1 }}>
                        <img
                          src={msg.imageUrl}
                          alt="Seed pack"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "4px",
                          }}
                        />
                      </Box>
                    )}
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Image Preview */}
          {imagePreview && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Image compressed and ready to analyze
              </Typography>
              <IconButton
                size="small"
                onClick={clearSelectedImage}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Stack direction="row" spacing={1}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
            <Tooltip title="Upload image">
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || compressingImage}
                color="primary"
              >
                <PhotoCamera />
              </IconButton>
            </Tooltip>
            <TextField
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !loading &&
                !compressingImage &&
                handleSubmit()
              }
              placeholder="Describe your seeds or upload an image..."
              disabled={loading || compressingImage}
              inputProps={{ maxLength: AI_ASSISTANT_MAX_MESSAGE_CHARS }}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={(!input.trim() && !selectedImage) || loading || compressingImage}
              sx={{ minWidth: isMobile ? 60 : 100 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <SendIcon sx={{ mr: isMobile ? 0 : 1 }} />
                  {!isMobile && "Send"}
                </>
              )}
            </Button>
          </Stack>
        </Stack>

        {/* Seed Preview Card - Responsive Layout */}
        {showSeedPreview && (
          <>
            <Divider sx={{ margin: 2 }} />
            {/* Improved seed preview container */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Card
                variant="outlined"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  mb: 1,
                  // Responsive width for different screen sizes
                  width: { xs: "100%", sm: "80%", md: "60%" },
                  maxWidth: { xs: "100%", sm: "400px", md: "450px" },
                  minWidth: { xs: "250px", sm: "300px" },
                }}
              >
                <CardHeader
                  sx={{
                    py: 1,
                    pb: 0,
                    "& .MuiCardHeader-content": {
                      overflow: "hidden",
                      minWidth: 0,
                    },
                    "& .MuiCardHeader-action": {
                      marginTop: 0,
                      marginRight: 0,
                    },
                  }}
                  title={
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      minWidth={0}
                    >
                      <Tooltip
                        title={`${previewSeed.feminized === true ? "♀" : ""} ${
                          previewSeed.strain || "Strain Name"
                        }`}
                      >
                        <Typography
                          variant="subtitle1"
                          component="span"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                          }}
                        >
                          {`${previewSeed.feminized === true ? "♀" : ""} ${
                            previewSeed.strain || "Strain Name"
                          }`}
                        </Typography>
                      </Tooltip>
                      {previewSeed.open && (
                        <Tooltip title="Open Pack">
                          <BrokenImage
                            color="warning"
                            fontSize="small"
                            sx={{ flexShrink: 0 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  action={
                    <Box display="flex" gap={1} ml={1}>
                      {previewSeed.isMultiple && previewSeed.quantity > 1 && (
                        <Tooltip title="Number of packs available">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              bgcolor: "rgba(255, 255, 255, 0.1)",
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.25,
                              fontSize: "0.75rem",
                            }}
                          >
                            x{previewSeed.quantity}
                          </Box>
                        </Tooltip>
                      )}
                      {previewSeed.lineage && (
                        <Tooltip
                          title={
                            previewSeed.lineage || "No lineage information"
                          }
                        >
                          <AccountTree color="action" fontSize="small" />
                        </Tooltip>
                      )}

                      {previewSeed.available ? (
                        <Tooltip title="Available">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Unavailable">
                          <CancelIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
                <CardContent
                  sx={{
                    py: 0.5,
                    flex: 1,
                    px: { xs: 2, sm: 3 },
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Breeder:</strong>{" "}
                      {previewSeed.breeder || "Unknown"}
                    </Typography>
                    {previewSeed.numSeeds > 0 && (
                      <Typography variant="body2">
                        <strong>Seeds:</strong> {previewSeed.numSeeds}
                      </Typography>
                    )}
                    {previewSeed.generation && (
                      <Typography variant="body2">
                        <strong>Generation:</strong> {previewSeed.generation}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
                <CardActions
                  sx={{
                    justifyContent: "space-between",
                    py: 0.5,
                    px: { xs: 2, sm: 3 },
                    mt: "auto",
                  }}
                >
                  <Typography color="text.secondary" variant="caption">
                    Will be added today
                  </Typography>

                  {/* Add button integrated into card for better UX */}
                  <Tooltip title="Add to Collection">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        const lastSeedData = [...messages]
                          .reverse()
                          .find((msg) => msg.seedData)?.seedData;

                        if (lastSeedData) {
                          handleAddToCatalog(lastSeedData);
                        }
                      }}
                      size="small"
                    >
                      <AddCircleOutline />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          </>
        )}
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
