import React from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  Stack,
  FormControlLabel,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { DataGrid, GridColDef, GridEditBooleanCell } from "@mui/x-data-grid";
import { useCloneContext } from "../context/CloneContext";
import { Clone } from "../types";
import { Edit, Delete, AddCircleOutline, Verified } from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditCloneModal from "../components/EditCloneModal";
import CSVUpload from "../components/CSVUpload";

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone, updateClone, setClones } =
    useCloneContext();

  // Form states
  const [cloneBreeder, setCloneBreeder] = React.useState("");
  const [cloneStrain, setCloneStrain] = React.useState("");
  const [lineage, setLineage] = React.useState("");
  const [cutName, setCutName] = React.useState("");
  const [filalGeneration, setFilalGeneration] = React.useState("");
  const [isMale, setIsMale] = React.useState<"Male" | "Female">("Female");
  const [isBreederCut, setIsBreederCut] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedClone, setSelectedClone] = React.useState<Clone | null>(null);

  // Validation states
  const [breederError, setBreederError] = React.useState(false);
  const [strainError, setStrainError] = React.useState(false);

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cloneToDelete, setCloneToDelete] = React.useState<Clone | null>(null);

  const handleCSVUpload = async (clones: Partial<Clone>[]) => {
    try {
      // Add each clone from the CSV
      for (const clone of clones) {
        await addClone(clone as Clone);
      }
    } catch (error) {
      console.error("Failed to add clones from CSV:", error);
    }
  };

  // Return unique breeder names from the seeds array
  const uniqueBreeders = Array.from(
    new Set(clones.map((c) => c.breeder))
  ).sort();

  // Handle adding a new clone
  const handleAddClone = () => {
    const isBreederValid = Boolean(cloneBreeder.trim());
    const isStrainValid = Boolean(cloneStrain.trim());

    setBreederError(!isBreederValid);
    setStrainError(!isStrainValid);

    if (cloneBreeder && cloneStrain) {
      addClone({
        breeder: cloneBreeder,
        strain: cloneStrain,
        cutName: cutName,
        generation: filalGeneration,
        sex: isMale,
        breederCut: isBreederCut,
        available: isAvailable,
        dateAcquired: new Date().toISOString(),
        lineage: lineage,
      });

      // Reset form fields
      setCloneBreeder("");
      setCloneStrain("");
      setCutName("");
      setFilalGeneration("");
      setIsMale("Female");
      setIsBreederCut(false);
      setIsAvailable(false);
      setLineage("");
    }
  };

  const handleEditClick = (clone: Clone) => {
    setSelectedClone(clone);
    setEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (clone: Clone) => {
    setCloneToDelete(clone);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCloneToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (cloneToDelete) {
      deleteClone(cloneToDelete.id!); // Call deleteClone with the selected clone ID
    }
    handleCloseDeleteDialog(); // Close the dialog
  };

  const handleSaveEdit = async (updatedClone: Clone) => {
    try {
      await updateClone(updatedClone.id!, updatedClone);
      setClones((prevClones) =>
        prevClones.map((clone) =>
          clone.id === updatedClone.id ? updatedClone : clone
        )
      );
    } catch (error) {
      console.error("Failed to update clone:", error);
    }
  };

  // Define columns
  const columns: GridColDef[] = [
    {
      field: "breeder",
      headerName: "Breeder",
      headerAlign: "center",
      align: "left",
      editable: true,
      width: 150,
      flex: 0,
    },
    {
      field: "strain",
      headerName: "Strain",
      headerAlign: "center",
      align: "left",
      editable: true,
      width: 150,
      flex: 0,
    },
    {
      field: "cutName",
      headerName: "Cut Name",
      headerAlign: "center",
      align: "left",
      editable: true,
      width: 125,
      flex: 0,
    },
    {
      field: "generation",
      headerName: "Generation",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 100,
      flex: 0,
    },
    {
      field: "sex",
      headerName: "Sex",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 65,
      flex: 0,
      renderCell: (params) => {
        const sexValue = params.value;
        if (sexValue === "Female") return "♀";
        if (sexValue === "Male") return "♂";
        return ""; // fallback if unknown
      },
    },
    {
      field: "breederCut",
      headerName: "Breeder Cut",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 95,
      flex: 0,
      renderCell: (params) => {
        const hasBreederCut = params.value;
        if (hasBreederCut) {
          // If breederCut === true, show Verified icon
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <Tooltip style={{ fontSize: "1.2rem" }} title="Breeder Cut">
                <Verified />
              </Tooltip>
            </Box>
          );
        }
        return null;
      },
      renderEditCell: (params) => <GridEditBooleanCell {...params} />,
    },
    {
      field: "available",
      headerName: "Available?",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 85,
      flex: 0,
      renderCell: (params) => {
        const isAvailable = params.value;
        return (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isAvailable ? (
              <Tooltip style={{ fontSize: "1.2rem" }} title="Available">
                <CheckCircleIcon color="success" />
              </Tooltip>
            ) : (
              <Tooltip style={{ fontSize: "1.2rem" }} title="Unavailable">
                <CancelIcon color="error" />
              </Tooltip>
            )}
          </Box>
        );
      },
      renderEditCell: (params) => {
        return <GridEditBooleanCell {...params} />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      width: 100,
      flex: 0,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => handleEditClick(params.row)}
              aria-label="edit"
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => handleDeleteClick(params.row)}
              aria-label="delete"
            >
              <Delete color="error" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 3, px: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "Roboto, sans-serif",
          fontWeight: 600,
          textAlign: "center",
          marginBottom: 3,
        }}
      >
        Manage Clones
      </Typography>

      {/* CSV Upload Form */}

      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <CSVUpload onUploadSuccess={handleCSVUpload} />
      </Box>
      <Divider sx={{ mb: 2 }} />
      {/* Add Clone Form */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={1}>
            <TextField
              required
              placeholder="Candy Fumez"
              label="Strain"
              value={cloneStrain}
              onChange={(e) => setCloneStrain(e.target.value)}
              error={strainError}
              helperText={strainError ? "Strain is required" : ""}
              fullWidth
            />
            <Autocomplete
              options={uniqueBreeders}
              freeSolo
              inputValue={cloneBreeder}
              onInputChange={(_event, newInputValue) => {
                setCloneBreeder(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  placeholder="Bloom Seed Co"
                  label="Breeder"
                  value={cloneBreeder}
                  onChange={(e) => setCloneBreeder(e.target.value)}
                  error={breederError}
                  helperText={breederError ? "Breeder is required" : ""}
                  fullWidth
                />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isBreederCut}
                  onChange={(e) => setIsBreederCut(e.target.checked)}
                />
              }
              label="Breeder Cut"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
              }
              label="Available?"
            />
          </Stack>

          {/* Column 3 */}
          <Stack maxWidth={"300px"} spacing={1}>
            <Stack>
              <Box>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Optional Info</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      sx={{ mb: 1 }}
                      label="Lineage"
                      placeholder="Sherbanger x Z"
                      value={lineage}
                      onChange={(e) => setLineage(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      sx={{ mb: 1 }}
                      placeholder="Harry Palms Cut"
                      label="Tag"
                      value={cutName}
                      onChange={(e) => setCutName(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      sx={{ mb: 2 }}
                      label="Generation"
                      placeholder="F1, S1, etc."
                      value={filalGeneration}
                      onChange={(e) => setFilalGeneration(e.target.value)}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel>Sex</InputLabel>
                      <Select
                        size="small"
                        value={isMale}
                        onChange={(e) =>
                          setIsMale(e.target.value as "Female" | "Male")
                        }
                        label="Sex"
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </FormControl>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Stack>
          </Stack>
          <Stack>
            <Tooltip title="Add Clone">
              <IconButton
                sx={{ mt: { xs: 0, md: 3 }, color: "primary.main" }}
                onClick={handleAddClone}
              >
                <AddCircleOutline fontSize="large" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Column 4 */}
        </Stack>
      </Box>

      {/* Data Grid Section */}
      <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
        <DataGrid
          rows={clones.map((clone) => ({ ...clone, id: clone.id }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10, // Default page size
              },
            },
          }}
          pageSizeOptions={[10, 20, 50]} // Page size options
          disableRowSelectionOnClick // Prevent row selection on click
          onCellEditStart={(_params, event) => {
            event.defaultMuiPrevented = true;
          }}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{cloneToDelete?.strain}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <EditCloneModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedClone(null);
        }}
        clone={selectedClone}
        onSave={handleSaveEdit}
      />
    </Box>
  );
};

export default ClonesPage;
