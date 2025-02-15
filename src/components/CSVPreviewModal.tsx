import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Clone } from "../types";

interface CSVPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: Partial<Clone>[];
  onConfirm: (data: Partial<Clone>[]) => void;
}

const CSVPreviewModal: React.FC<CSVPreviewModalProps> = ({
  open,
  onClose,
  data,
  onConfirm,
}) => {
  if (!data.length) return null;

  // Get column headers from the first entry
  const columns = Object.keys(data[0]).filter(
    (key) =>
      // Exclude internal fields and ensure we only show relevant columns
      !["id", "userId", "dateAcquired"].includes(key)
  );

  const handleConfirm = () => {
    onConfirm(data);
    onClose();
  };

  const getDisplayValue = (value: unknown): string => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return value?.toString() || "";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Preview CSV Data</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {getDisplayValue(row[column as keyof Clone])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVPreviewModal;
