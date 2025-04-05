import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { CultivarInfo, Seed, Clone } from "../types";
import { useNavigate } from "react-router-dom";

interface CultivarInfoFormProps {
  itemType: "seed" | "clone";
  item: Seed | Clone;
  existingInfo?: CultivarInfo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CultivarInfoForm: React.FC<CultivarInfoFormProps> = ({
  itemType,
  item,
  existingInfo,
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("CultivarInfoForm rendered with props:", {
      itemType,
      item,
      existingInfo,
    });

    if (!item || !item.id) {
      console.error("Item is missing required properties:", item);
    }
  }, [itemType, item, existingInfo]);

  // Form state
  const [growingMethod, setGrowingMethod] = useState(
    existingInfo?.growingMethod || ""
  );
  const [potSize, setPotSize] = useState(existingInfo?.potSize || "");
  const [nutrients, setNutrients] = useState(existingInfo?.nutrients || "");
  const [feedSchedule, setFeedSchedule] = useState(
    existingInfo?.feedSchedule || ""
  );
  const [notes, setNotes] = useState(existingInfo?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!currentUser) {
      setError("You must be logged in to save cultivar information");
      setLoading(false);
      return;
    }

    try {
      const cultivarData: Omit<CultivarInfo, "id"> = {
        userId: currentUser.uid,
        itemType,
        itemId: item.id,
        strain: item.strain,
        breeder: item.breeder,
        growingMethod,
        potSize,
        nutrients,
        feedSchedule,
        notes,
        createdAt: existingInfo?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingInfo?.id) {
        await updateDoc(doc(db, "cultivarInfo", existingInfo.id), cultivarData);
      } else {
        await addDoc(collection(db, "cultivarInfo"), cultivarData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error saving cultivar info:", err);
      setError("Failed to save cultivar information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add fallback rendering if item is missing
  if (!item || !item.id) {
    return (
      <Card>
        <CardContent>
          <Typography color="error" variant="h6">
            Error: Invalid item selected
          </Typography>
          <Typography color="error" paragraph>
            The selected item is missing required properties.
          </Typography>
          <Button
            variant="contained"
            onClick={onCancel || (() => navigate("/cultivar-info"))}
            sx={{ mt: 2 }}
          >
            Back to Cultivar Info
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {existingInfo ? "Edit" : "Add"} Cultivar Information
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {itemType === "seed" ? "Seed" : "Clone"}:{" "}
          <strong>{item.strain}</strong> by {item.breeder}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="growing-method-label">
                  Growing Method
                </InputLabel>
                <Select
                  labelId="growing-method-label"
                  value={growingMethod}
                  onChange={(e) => setGrowingMethod(e.target.value)}
                  label="Growing Method"
                >
                  <MenuItem value="Soil">Soil</MenuItem>
                  <MenuItem value="Coco">Coco</MenuItem>
                  <MenuItem value="Hydro">Hydro</MenuItem>
                  <MenuItem value="DWC">DWC</MenuItem>
                  <MenuItem value="RDWC">RDWC</MenuItem>
                  <MenuItem value="Aeroponics">Aeroponics</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pot Size"
                placeholder="e.g., 5 gallon, 10 liter"
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nutrients"
                placeholder="List the nutrients you're using"
                value={nutrients}
                onChange={(e) => setNutrients(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Feed Schedule"
                placeholder="Describe your feeding schedule"
                value={feedSchedule}
                onChange={(e) => setFeedSchedule(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                placeholder="Additional notes, observations, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={onCancel || (() => navigate("/cultivar-info"))}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => navigate("/cultivar-info")}
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Cultivar Info"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CultivarInfoForm;
