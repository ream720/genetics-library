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
} from "@mui/icons-material";
import { analyzeSeedFunc } from "../lib/firebase";
import { SeedAssistantResponse } from "../schemas/seedSchemas";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  seedData?: SeedAssistantResponse;
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

export default function ConversationalSeedAssistant() {
  const { addSeed } = useSeedContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help catalog your seeds. Tell me about a seed pack you'd like to add to your collection.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewSeed, setPreviewSeed] = useState<Seed>(emptySeed);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
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

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Add user message with explicit type
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      // Get context from previous messages
      const context = JSON.stringify({
        messages: newMessages.slice(-4), // Last 4 messages for context
      });

      const response = await analyzeSeedFunc({
        message: input,
        previousContext: context,
      });

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
          assistantMessage += "• " + question + "\n";
        });
      }

      // Create a properly typed assistant message
      const assistantResponseMessage: ChatMessage = {
        role: "assistant",
        content: assistantMessage,
        seedData: response.data,
      };

      setMessages([...newMessages, assistantResponseMessage]);
    } catch (err) {
      console.error("Error processing message:", err);

      // Create a properly typed error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Sorry, I had trouble processing that. Could you try rephrasing?",
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

      // Reset the preview after adding
      setPreviewSeed(emptySeed);
      setShowSeedPreview(false);
    } catch (err) {
      console.error("Failed to add seed:", err);
      setSnackbar({
        open: true,
        message: "Failed to add seed to catalog",
        severity: "error",
      });
    }
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
        <Typography variant="h6" gutterBottom>
          Seed Assistant Chat
        </Typography>

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
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </Typography>

                    {msg.seedData && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {/* Only show button in assistant message when no preview is shown */}
                        {!showSeedPreview && (
                          <Button
                            size="small"
                            color="warning"
                            variant="contained"
                            onClick={() => handleAddToCatalog(msg.seedData!)}
                            sx={{ fontWeight: "bold" }}
                          >
                            Add to Catalog
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>

          <Divider />

          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !loading && handleSubmit()
              }
              placeholder="Describe your seeds..."
              disabled={loading}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
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
