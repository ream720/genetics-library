import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import type { SeedAssistantResponse } from "../schemas/seedSchemas";
import type { Seed } from "../types";
import { v4 as uuidv4 } from "uuid";
import { analyzeSeedFunc } from "../lib/firebase";

const convertToSeed = (seedData: SeedAssistantResponse["seed"]): Seed => ({
  id: uuidv4(),
  breeder: seedData.breeder,
  strain: seedData.strain,
  lineage: seedData.lineage || "",
  generation: seedData.generation || "",
  numSeeds: seedData.numSeeds,
  feminized: seedData.feminized,
  open: seedData.open,
  available: seedData.available,
  dateAcquired: new Date().toISOString(),
  isMultiple: seedData.isMultiple || false,
  quantity: seedData.quantity || 1,
});

interface SeedAssistantDialogProps {
  open: boolean;
  onClose: () => void;
  onSeedExtracted: (seed: Seed) => void;
}

export default function SeedAssistantDialog({
  open,
  onClose,
  onSeedExtracted,
}: SeedAssistantDialogProps) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<SeedAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setInput("");
    setResponse(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const { data } = await analyzeSeedFunc({
        message: input,
        previousContext: response ? JSON.stringify(response) : "",
      });

      const responseData = data as SeedAssistantResponse;
      setResponse(responseData);
      setInput(""); // Reset input after successful submission
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze seed information"
      );
    } finally {
      setLoading(false);
    }
  }, [input, response]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI Seed Assistant</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ mb: 2 }}>
          Describe your seed pack and I'll help you catalog it. Include details
          like breeder, strain name, and any other information you have.
        </Typography>

        {response && (
          <Box
            sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Extracted Information:
            </Typography>
            <pre
              style={{
                fontSize: "0.875rem",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(response.seed, null, 2)}
            </pre>
            <Typography variant="caption" color="text.secondary">
              Confidence: {(response.confidence * 100).toFixed(1)}%
            </Typography>

            {response.missingInfo.length > 0 && (
              <Typography color="warning.main" variant="body2" sx={{ mt: 1 }}>
                Missing information: {response.missingInfo.join(", ")}. Would
                you like to supply any additional details or submit this seed
                pack?
              </Typography>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="E.g., I have a pack of Archive's Rainbow Belts F2, it's a sealed pack with 12 regular seeds..."
          disabled={loading}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {response && (
          <Button
            onClick={() => {
              onSeedExtracted(convertToSeed(response.seed));
              handleClose();
            }}
            color="secondary"
          >
            Use This Data
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!input.trim() || loading}
          endIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Processing..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
