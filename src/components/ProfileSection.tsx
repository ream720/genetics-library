import React, { useState, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { CloudUpload, Edit } from "@mui/icons-material";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

interface ProcessImageResult {
  blob: Blob;
  width: number;
  height: number;
}

const ProfileSection: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File): Promise<ProcessImageResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if larger than 400x400
        if (width > 400 || height > 400) {
          const ratio = Math.min(400 / width, 400 / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            resolve({ blob, width, height });
          },
          "image/jpeg",
          0.8 // Quality compression
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
        throw new Error("Please upload a JPEG, PNG, or WebP image");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 2MB");
      }

      const { blob } = await processImage(file);
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        photoURL: downloadURL,
      });

      // Update Firebase Auth user profile
      await updateUserProfile(downloadURL);

      setSuccess("Profile picture updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card raised sx={{ bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Picture
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: "600px" }}
          >
            Add or update your profile picture. Maximum file size is 2MB.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: "600px" }}
          >
            Supported formats: JPEG, PNG, WebP.
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={currentUser?.photoURL || ""}
              sx={{ width: 100, height: 100 }}
            />
            <Box>
              <input
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                onChange={handleFileSelect}
                style={{ display: "none" }}
                ref={fileInputRef}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={currentUser?.photoURL ? <Edit /> : <CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : currentUser?.photoURL
                  ? "Change Picture"
                  : "Upload Picture"}
              </Button>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: "100%" }}>
              {success}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
