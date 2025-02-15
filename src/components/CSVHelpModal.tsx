import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import { Download } from "@mui/icons-material";

interface CSVHelpModalProps {
  open: boolean;
  onClose: () => void;
}

const CSVHelpModal: React.FC<CSVHelpModalProps> = ({ open, onClose }) => {
  const exampleData = [
    {
      Strain: "Candy Fumez",
      Breeder: "Bloom Seed Co",
      "Cut Name": "Harry Palms Cut",
      Sex: "Male",
      "Breeder Cut": "TRUE",
      Available: "TRUE",
    },
  ];

  const handleDownloadTemplate = () => {
    // Create link to download the template
    const link = document.createElement("a");
    link.href = "/src/assets/clone.csv"; // Adjust path based on your project structure
    link.download = "clone_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>CSV Upload Instructions</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info">
            Download the template CSV file to get started quickly with the
            correct format.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Required Columns:
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" component="div">
            <ul>
              <li>
                <strong>Strain</strong> - The strain name
              </li>
              <li>
                <strong>Breeder</strong> - The breeder name
              </li>
              <li>
                <strong>Breeder Cut</strong> - Must be TRUE or FALSE
              </li>
              <li>
                <strong>Available</strong> - Must be TRUE or FALSE
              </li>
              <li>
                <strong>Sex</strong> - Must be either Male or Female
              </li>
            </ul>
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Optional Columns:
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" component="div">
            <ul>
              <li>
                <strong>Cut Name</strong> - Name of the specific cut
              </li>
            </ul>
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Example Format:
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Strain</TableCell>
                <TableCell>Breeder</TableCell>
                <TableCell>Cut Name</TableCell>
                <TableCell>Sex</TableCell>
                <TableCell>Breeder Cut</TableCell>
                <TableCell>Available</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exampleData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.Strain}</TableCell>
                  <TableCell>{row.Breeder}</TableCell>
                  <TableCell>{row["Cut Name"]}</TableCell>
                  <TableCell>{row.Sex}</TableCell>
                  <TableCell>{row["Breeder Cut"]}</TableCell>
                  <TableCell>{row.Available}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Note: Column headers are case-sensitive and must match exactly as
          shown above.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownloadTemplate}
        >
          Download Example CSV
        </Button>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVHelpModal;
