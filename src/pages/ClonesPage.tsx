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
import { Edit, Delete, SaveAs, Cancel } from "@mui/icons-material";

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone, updateClone } = useCloneContext();

  // Form states
  const [newBreeder, setNewBreeder] = React.useState("");
  const [newStrain, setNewStrain] = React.useState("");
  const [newCutName, setNewCutName] = React.useState("");
  const [newGeneration, setNewGeneration] = React.useState("");
  const [newSex, setNewSex] = React.useState<"Male" | "Female">("Male");
  const [newBreederCut, setNewBreederCut] = React.useState(false);
  const [newAvailable, setNewAvailable] = React.useState(false);

  // Row edit state
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cloneToDelete, setCloneToDelete] = React.useState<Clone | null>(null);

  // Handle adding a new clone
  const handleAddClone = () => {
    if (newBreeder && newStrain) {
      addClone({
        breeder: newBreeder,
        strain: newStrain,
        cutName: newCutName,
        generation: newGeneration,
        sex: newSex,
        breederCut: newBreederCut,
        available: newAvailable,
        dateAcquired: new Date().toISOString(),
      });

      // Reset form fields
      setNewBreeder("");
      setNewStrain("");
      setNewCutName("");
      setNewGeneration("");
      setNewSex("Male");
      setNewBreederCut(false);
      setNewAvailable(false);
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
              label="Breeder"
              value={newBreeder}
              onChange={(e) => setNewBreeder(e.target.value)}
              fullWidth
            />
            <TextField
              required
              label="Strain"
              value={newStrain}
              onChange={(e) => setNewStrain(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Column 2 */}
          <Stack spacing={2}>
            <TextField
              label="Cut Name"
              value={newCutName}
              onChange={(e) => setNewCutName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Generation"
              placeholder="F1, S1, etc."
              value={newGeneration}
              onChange={(e) => setNewGeneration(e.target.value)}
              fullWidth
            />
          </Stack>

          {/* Column 3 */}
          <Stack spacing={1}>
            <FormControl fullWidth>
              <InputLabel>Sex</InputLabel>
              <Select
                value={newSex}
                onChange={(e) => setNewSex(e.target.value as "Male" | "Female")}
                label="Sex"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newBreederCut}
                  onChange={(e) => setNewBreederCut(e.target.checked)}
                />
              }
              label="Breeder Cut"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newAvailable}
                  onChange={(e) => setNewAvailable(e.target.checked)}
                />
              }
              label="Available?"
            />
          </Stack>

          {/* Column 4 */}
          <Stack>
            <Button
              sx={{ mt: { xs: 2, md: 5 } }}
              size="small"
              variant="contained"
              onClick={handleAddClone}
            >
              Add Clone
            </Button>
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
