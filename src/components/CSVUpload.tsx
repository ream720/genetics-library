import React, { useState } from "react";
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { CloudUpload, Error } from "@mui/icons-material";
import Papa, { ParseResult } from "papaparse";
import { Clone } from "../types";

interface CSVUploadProps {
  onUploadSuccess: (clones: Partial<Clone>[]) => void;
}

interface ValidationError {
  row: number;
  errors: string[];
}

interface CSVRow {
  Strain: string;
  Breeder: string;
  "Breeder Cut"?: boolean;
  Sex?: "Male" | "Female";
  Available?: boolean;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  const validateCloneData = (data: CSVRow): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!data.Strain?.trim()) errors.push("Strain is required");
    if (!data.Breeder?.trim()) errors.push("Breeder is required");

    // Sex validation
    if (data.Sex && !["Male", "Female"].includes(data.Sex)) {
      errors.push('Sex must be either "Male" or "Female"');
    }

    // Boolean field validation
    if (
      data["Breeder Cut"] !== undefined &&
      typeof data["Breeder Cut"] !== "boolean"
    ) {
      errors.push("Breeder Cut must be true/false");
    }

    if (data.Available !== undefined && typeof data.Available !== "boolean") {
      errors.push("Available must be true/false");
    }

    return errors;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const text = await file.text();

      Papa.parse<CSVRow>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<CSVRow>) => {
          const errors: ValidationError[] = [];

          // Validate each row
          results.data.forEach((row, index) => {
            const rowErrors = validateCloneData(row);
            if (rowErrors.length > 0) {
              errors.push({
                row: index + 1,
                errors: rowErrors,
              });
            }
          });

          if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationDialog(true);
            setLoading(false);
            return;
          }

          // Transform CSV data to Clone objects
          const clones = results.data.map((row) => ({
            strain: row.Strain,
            breeder: row.Breeder,
            breederCut: row["Breeder Cut"] || false,
            sex: row.Sex || "Female",
            available: row.Available || false,
            dateAcquired: new Date().toISOString(),
          }));

          onUploadSuccess(clones);
          setLoading(false);
        },
        error: (error: Error) => {
          setError("Failed to parse CSV file: " + error.message);
          setLoading(false);
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError("Failed to read file");
      setLoading(false);
    }

    // Reset file input
    event.target.value = "";
  };

  return (
    <Box>
      <input
        accept=".csv"
        style={{ display: "none" }}
        id="csv-upload-button"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="csv-upload-button">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUpload />}
          disabled={loading}
        >
          Upload CSV
          {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Button>
      </label>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Validation Errors Dialog */}
      <Dialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CSV Validation Errors</DialogTitle>
        <DialogContent>
          <Typography color="error" gutterBottom>
            Please fix the following errors in your CSV file:
          </Typography>
          <List>
            {validationErrors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Error color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={`Row ${error.row}`}
                  secondary={error.errors.join(", ")}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowValidationDialog(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CSVUpload;
