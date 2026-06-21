import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  createProjectPhotoDisplayUrl,
  deleteProjectPhoto,
  getProjectPhotos,
  updateProjectPhotoCaption,
  uploadProjectPhoto,
} from "../../services/projectPhotos";
import {
  ProjectPhoto,
  ProjectPhotoContextType,
} from "../../types/v2";

interface ProjectPhotoUploaderProps {
  ownerId: string;
  projectId: string;
  contextType: ProjectPhotoContextType;
  contextId: string;
  photoIds: string[];
  onChange: (photoIds: string[]) => void;
  readOnly?: boolean;
  label?: string;
  deferDeletePhotoIds?: string[];
}

const ProjectPhotoUploader: React.FC<ProjectPhotoUploaderProps> = ({
  ownerId,
  projectId,
  contextType,
  contextId,
  photoIds,
  onChange,
  readOnly = false,
  label = "Photos",
  deferDeletePhotoIds = [],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [displayUrls, setDisplayUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const createdUrls: string[] = [];

    const loadPhotos = async () => {
      if (photoIds.length === 0) {
        setPhotos([]);
        setDisplayUrls({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedPhotos = await getProjectPhotos(photoIds, ownerId);
        const urlEntries = await Promise.all(
          loadedPhotos.map(async (photo) => {
            const url = await createProjectPhotoDisplayUrl(photo);
            createdUrls.push(url);
            return [photo.id as string, url] as const;
          })
        );

        if (active) {
          setPhotos(loadedPhotos);
          setDisplayUrls(Object.fromEntries(urlEntries));
        }
      } catch (loadError) {
        console.error("Failed to load project photos:", loadError);
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load photos. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPhotos();

    return () => {
      active = false;
      createdUrls
        .filter((url) => url.startsWith("blob:"))
        .forEach((url) => URL.revokeObjectURL(url));
    };
  }, [ownerId, photoIds]);

  const handleFilesSelected = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    const uploadedIds: string[] = [];

    try {
      for (const file of files) {
        const photo = await uploadProjectPhoto({
          ownerId,
          projectId,
          contextType,
          contextId,
          file,
        });

        if (photo.id) {
          uploadedIds.push(photo.id);
        }
      }

      onChange([...photoIds, ...uploadedIds]);
    } catch (uploadError) {
      console.error("Failed to upload project photo:", uploadError);
      if (uploadedIds.length > 0) {
        onChange([...photoIds, ...uploadedIds]);
      }
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload photo. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: ProjectPhoto) => {
    if (!photo.id) {
      return;
    }

    setDeletingId(photo.id);
    setError(null);

    try {
      if (!deferDeletePhotoIds.includes(photo.id)) {
        await deleteProjectPhoto(photo);
      }
      onChange(photoIds.filter((photoId) => photoId !== photo.id));
    } catch (deleteError) {
      console.error("Failed to delete project photo:", deleteError);
      setError("Failed to delete photo. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCaptionBlur = async (
    photo: ProjectPhoto,
    caption: string
  ) => {
    if (!photo.id || caption.trim() === (photo.caption ?? "")) {
      return;
    }

    try {
      await updateProjectPhotoCaption(photo.id, caption);
      setPhotos((currentPhotos) =>
        currentPhotos.map((currentPhoto) =>
          currentPhoto.id === photo.id
            ? { ...currentPhoto, caption: caption.trim() }
            : currentPhoto
        )
      );
    } catch (captionError) {
      console.error("Failed to update photo caption:", captionError);
      setError("Failed to update photo caption.");
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography fontWeight={700}>{label}</Typography>
        {!readOnly && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={
                uploading ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddPhotoAlternateIcon />
                )
              }
              onClick={() => inputRef.current?.click()}
              disabled={uploading || !contextId}
            >
              {uploading ? "Uploading..." : "Add Photos"}
            </Button>
          </>
        )}
      </Stack>

      {!readOnly && (
        <Typography color="text.secondary" variant="caption">
          JPEG, PNG, or WebP. Maximum 10 MB each. Images are resized
          automatically.
        </Typography>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography color="text.secondary" variant="body2">
            Loading photos...
          </Typography>
        </Stack>
      ) : photos.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No photos yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {photos.map((photo) => (
            <Card key={photo.id} variant="outlined">
              <Box
                component="img"
                src={photo.id ? displayUrls[photo.id] : undefined}
                alt={photo.caption || "Project photo"}
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block",
                  bgcolor: "action.hover",
                }}
              />
              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Stack spacing={1}>
                  {readOnly ? (
                    photo.caption && (
                      <Typography variant="body2">{photo.caption}</Typography>
                    )
                  ) : (
                    <TextField
                      defaultValue={photo.caption ?? ""}
                      label="Caption"
                      size="small"
                      fullWidth
                      onBlur={(event) =>
                        handleCaptionBlur(photo, event.target.value)
                      }
                    />
                  )}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary" variant="caption">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </Typography>
                    {!readOnly && (
                      <Tooltip title="Delete photo">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePhoto(photo)}
                            disabled={deletingId === photo.id}
                          >
                            {deletingId === photo.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
};

export default ProjectPhotoUploader;
