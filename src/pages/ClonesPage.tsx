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
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
} from "@mui/x-data-grid";
import { useCloneContext } from "../context/CloneContext";
import { Clone } from "../types";
import {
  Edit,
  Delete,
  SaveAs,
  Cancel,
  AddCircleOutline,
} from "@mui/icons-material";

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone, updateClone } = useCloneContext();

  // Form states
  const [cloneBreeder, setCloneBreeder] = React.useState("");
  const [cloneStrain, setCloneStrain] = React.useState("");
  const [cutName, setCutName] = React.useState("");
  const [filalGeneration, setFilalGeneration] = React.useState("");
  const [isMale, setIsMale] = React.useState<"Male" | "Female">("Male");
  const [isBreederCut, setIsBreederCut] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);

  // Validation states
  const [breederError, setBreederError] = React.useState(false);
  const [strainError, setStrainError] = React.useState(false);

  // Row edit state
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cloneToDelete, setCloneToDelete] = React.useState<Clone | null>(null);

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
      });

      // Reset form fields
      setCloneBreeder("");
      setCloneStrain("");
      setCutName("");
      setFilalGeneration("");
      setIsMale("Male");
      setIsBreederCut(false);
      setIsAvailable(false);
    }
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

  // Handle row updates
  const processRowUpdate = async (newRow: Clone, oldRow: Clone) => {
    try {
      console.log("Saving changes for:", newRow);
      await updateClone(newRow.id!, newRow);

      // Switch the row back to view mode
      setRowModesModel((prevModel) => ({
        ...prevModel,
        [newRow.id!]: { mode: GridRowModes.View },
      }));

      console.log("Clone saved successfully:", newRow);
      return newRow; // Return the updated row to the DataGrid
    } catch (error) {
      console.error("Failed to update clone:", error);
      return oldRow; // Revert to the old row on error
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
    },
    {
      field: "breederCut",
      headerName: "Breeder Cut",
      headerAlign: "center",
      align: "center",
      type: "boolean",
      editable: true,
      width: 95,
      flex: 0,
    },
    {
      field: "available",
      headerName: "Available?",
      headerAlign: "center",
      align: "center",
      type: "boolean",
      editable: true,
      width: 85,
      flex: 0,
    },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      width: 100,
      flex: 0,
      renderCell: (params) => {
        const isEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        return isEditing ? (
          <>
            <Tooltip title="Save">
              <IconButton
                onClick={() =>
                  setRowModesModel((prevModel) => ({
                    ...prevModel,
                    [params.id]: { mode: GridRowModes.View },
                  }))
                }
                aria-label="save"
              >
                <SaveAs />
              </IconButton>
            </Tooltip>

            <Tooltip title="Cancel">
              <IconButton
                onClick={() =>
                  setRowModesModel({
                    ...rowModesModel,
                    [params.id]: {
                      mode: GridRowModes.View,
                      ignoreModifications: true,
                    },
                  })
                }
                aria-label="cancel"
              >
                <Cancel />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title="Edit">
              <IconButton
                onClick={() =>
                  setRowModesModel({
                    ...rowModesModel,
                    [params.id]: { mode: GridRowModes.Edit },
                  })
                }
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
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "Roboto, sans-serif",
          fontWeight: 600,
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        Manage Clones
      </Typography>

      {/* Add Clone Form */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={2}>
            <TextField
              required
              placeholder="Bloom Seed Co"
              label="Breeder"
              value={cloneBreeder}
              onChange={(e) => setCloneBreeder(e.target.value)}
              error={breederError}
              helperText={breederError ? "Breeder is required" : ""}
              fullWidth
            />
            <TextField
              required
              placeholder="Strawguava"
              label="Strain"
              value={cloneStrain}
              onChange={(e) => setCloneStrain(e.target.value)}
              error={strainError}
              helperText={strainError ? "Strain is required" : ""}
              fullWidth
            />
          </Stack>

          {/* Column 2 */}
          <Stack spacing={2}>
            <TextField
              placeholder="Harry Palms Cut"
              label="Cut Name"
              value={cutName}
              onChange={(e) => setCutName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Generation"
              placeholder="F1, S1, etc."
              value={filalGeneration}
              onChange={(e) => setFilalGeneration(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Column 3 */}
          <Stack spacing={1}>
            <FormControl fullWidth>
              <InputLabel>Sex</InputLabel>
              <Select
                size="small"
                value={isMale}
                onChange={(e) => setIsMale(e.target.value as "Male" | "Female")}
                label="Sex"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
            <Stack>
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
          </Stack>

          {/* Column 4 */}
          <Stack>
            <Tooltip title="Add Clone">
              <IconButton
                sx={{ mt: { xs: 2, md: 5 }, color: "primary.main" }}
                onClick={handleAddClone}
              >
                <AddCircleOutline fontSize="large" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Data Grid Section */}
      <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
        <DataGrid
          rows={clones.map((clone) => ({ ...clone, id: clone.id }))}
          columns={columns}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) =>
            console.error("Error during row update:", error)
          }
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
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
    </Box>
  );
};

export default ClonesPage;
