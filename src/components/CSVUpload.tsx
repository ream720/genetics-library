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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  "Cut Name"?: string;
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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<Clone>[]>([]);

  console.log("Component State:", {
    showPreviewDialog,
    showValidationDialog,
    previewDataLength: previewData.length,
  });

  const parseBooleanField = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const upperValue = value.trim().toUpperCase();
      if (upperValue === "TRUE") return true;
      if (upperValue === "FALSE") return false;
    }
    return false;
  };

  const validateCloneData = (data: CSVRow): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!data.Strain?.trim()) errors.push("Strain is required");
    if (!data.Breeder?.trim()) errors.push("Breeder is required");

    // Breeder Cut validation - must be TRUE or FALSE
    const breederCutValue = data["Breeder Cut"]
      ?.toString()
      .trim()
      .toUpperCase();
    if (!breederCutValue || !["TRUE", "FALSE"].includes(breederCutValue)) {
      errors.push("Breeder Cut must be either TRUE or FALSE");
    }

    // Sex validation - must be Male or Female
    const sex = data.Sex?.trim();
    if (!sex || !["Male", "Female"].includes(sex)) {
      errors.push('Sex must be either "Male" or "Female"');
    }

    // Available validation - must be TRUE or FALSE
    const availableValue = data.Available?.toString().trim().toUpperCase();
    if (!availableValue || !["TRUE", "FALSE"].includes(availableValue)) {
      errors.push("Available must be either TRUE or FALSE");
    }

    return errors;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("File Upload Started");
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setPreviewData([]);

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
            strain: row.Strain?.trim() || "",
            breeder: row.Breeder?.trim() || "",
            breederCut: parseBooleanField(row["Breeder Cut"]),
            cutName: row["Cut Name"]?.toString().trim() || "",
            sex: (row.Sex?.trim() || "Female") as "Male" | "Female",
            available: parseBooleanField(row.Available),
            dateAcquired: new Date().toISOString(),
          }));

          setPreviewData(clones);
          setShowPreviewDialog(true);
          setLoading(false);
        },
        error: (error: Error) => {
          setError("Failed to parse CSV file: " + error.message);
          setLoading(false);
        },
      });
    } catch (_err) {
      setError("Failed to read file");
      setLoading(false);
    }

    // Reset file input
    event.target.value = "";
  };

  const handleConfirmUpload = () => {
    onUploadSuccess(previewData);
    setShowPreviewDialog(false);
    setPreviewData([]);
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
      {/* Preview Dialog */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Preview Clone Import</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {`Please review the data before confirming the import. ${
              previewData.length
            } ${previewData.length === 1 ? "entry" : "entries"} found.`}
          </Alert>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Strain</TableCell>
                  <TableCell>Breeder</TableCell>
                  <TableCell>Cut Name</TableCell>
                  <TableCell>Sex</TableCell>
                  <TableCell>Breeder Cut</TableCell>
                  <TableCell>Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.strain}</TableCell>
                    <TableCell>{row.breeder}</TableCell>
                    <TableCell>{row.cutName}</TableCell>
                    <TableCell>{row.sex}</TableCell>
                    <TableCell>{row.breederCut ? "Yes" : "No"}</TableCell>
                    <TableCell>{row.available ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmUpload}
            variant="contained"
            color="primary"
          >
            Confirm Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CSVUpload;
