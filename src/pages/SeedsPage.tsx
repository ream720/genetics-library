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
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
} from "@mui/x-data-grid";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";
import { Edit, Delete, SaveAs, Cancel } from "@mui/icons-material";

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed, updateSeed, setSeeds } = useSeedContext();

  // Form states
  const [newSeedBreeder, setNewSeedBreeder] = React.useState("");
  const [newSeedStrain, setNewSeedStrain] = React.useState("");
  const [newSeedGeneration, setNewSeedGeneration] = React.useState("");
  const [newNumSeeds, setNewNumSeeds] = React.useState(0);
  const [newFeminized, setNewFeminized] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);

  // Row edit state
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [seedToDelete, setSeedToDelete] = React.useState<Seed | null>(null);

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (seed: Seed) => {
    setSeedToDelete(seed);
    setDeleteDialogOpen(true);
  };

  // Handle closing the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSeedToDelete(null);
  };

  // Handle confirming the delete action
  const handleConfirmDelete = () => {
    if (seedToDelete) {
      deleteSeed(seedToDelete.id!); // Call deleteSeed with the selected seed ID
    }
    handleCloseDeleteDialog(); // Close the dialog
  };

  // Handle adding a new seed
  const handleAddSeed = () => {
    if (newSeedBreeder && newSeedStrain) {
      addSeed({
        breeder: newSeedBreeder,
        strain: newSeedStrain,
        generation: newSeedGeneration,
        numSeeds: newNumSeeds,
        feminized: newFeminized,
        open: newOpen,
        dateAcquired: new Date().toISOString(),
        available: isAvailable,
      });
      setNewSeedBreeder("");
      setNewSeedStrain("");
      setNewSeedGeneration("");
      setNewNumSeeds(0);
      setNewFeminized(false);
      setNewOpen(false);
      setIsAvailable(false);
    }
  };

  // Handle row update
  const processRowUpdate = async (newRow: Seed, oldRow: Seed) => {
    console.log("processRowUpdate called:");
    console.log("New Row Data:", newRow);
    console.log("Old Row Data:", oldRow);

    try {
      let hasChanges = false;
      Object.keys(newRow).forEach((key) => {
        if (newRow[key as keyof Seed] !== oldRow[key as keyof Seed]) {
          console.log(
            `Field changed: ${key}, Old Value: ${
              oldRow[key as keyof Seed]
            }, New Value: ${newRow[key as keyof Seed]}`
          );
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        console.warn("No changes detected. Skipping Firestore update.");
        setRowModesModel({
          ...rowModesModel,
          [newRow.id!]: { mode: GridRowModes.View }, // Ensure mode resets
        });
        return oldRow;
      }

      // Update Firestore
      await updateSeed(newRow.id!, newRow);
      console.log("Firestore update successful:", newRow);

      // Optimistic Update: Update the `seeds` state
      setSeeds((prevSeeds) =>
        prevSeeds.map((seed) => (seed.id === newRow.id ? newRow : seed))
      );

      // Switch the row back to view mode
      setRowModesModel({
        ...rowModesModel,
        [newRow.id!]: { mode: GridRowModes.View },
      });

      return newRow; // Return the updated row to the DataGrid
    } catch (error) {
      console.error("Failed to update Firestore:", error);

      // Revert to the old row on error
      setRowModesModel({
        ...rowModesModel,
        [oldRow.id!]: { mode: GridRowModes.View, ignoreModifications: true },
      });

      return oldRow;
    }
  };

  // Handle row edit start
  const handleEditClick = (id: string) => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.Edit },
    });
  };

  // Handle row edit cancel
  const handleCancelClick = (id: string) => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
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
      field: "generation",
      headerName: "Generation",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 100,
      flex: 0,
    },
    {
      field: "numSeeds",
      headerName: "Seeds",
      type: "number",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 75,
      flex: 0,
    },
    {
      field: "feminized",
      headerName: "Feminized?",
      type: "boolean",
      headerAlign: "center",
      align: "center",
      editable: true,
      flex: 0,
    },
    {
      field: "open",
      headerName: "Open?",
      headerAlign: "center",
      align: "center",
      type: "boolean",
      editable: true,
      width: 75,
      flex: 0,
    },
    {
      field: "available",
      headerName: "Available?",
      headerAlign: "center",
      align: "center",
      type: "boolean",
      editable: true,
      width: 100,
      flex: 0,
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => {
        const isEditing = rowModesModel[params.id]?.mode === GridRowModes.Edit;

        return isEditing ? (
          <>
            <Tooltip title="Save">
              <IconButton
                onClick={() =>
                  setRowModesModel({
                    ...rowModesModel,
                    [params.id]: { mode: GridRowModes.View },
                  })
                }
                aria-label="save"
              >
                <SaveAs />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton
                onClick={() => handleCancelClick(params.id.toString())}
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
                onClick={() => handleEditClick(params.id.toString())}
                aria-label="edit"
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => handleDeleteClick(params.row)} // Use handleDeleteClick
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
        Manage Seeds
      </Typography>

      {/* Form Section */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={2}>
            <TextField
              label="Breeder"
              value={newSeedBreeder}
              onChange={(e) => setNewSeedBreeder(e.target.value)}
              fullWidth
            />
            <TextField
              label="Strain"
              value={newSeedStrain}
              onChange={(e) => setNewSeedStrain(e.target.value)}
              fullWidth
            />
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Generation"
              value={newSeedGeneration}
              onChange={(e) => setNewSeedGeneration(e.target.value)}
              fullWidth
            />
            <TextField
              label="# of Seeds"
              type="number"
              value={newNumSeeds}
              onChange={(e) => setNewNumSeeds(Number(e.target.value))}
              fullWidth
            />
          </Stack>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newFeminized}
                  onChange={(e) => setNewFeminized(e.target.checked)}
                />
              }
              label="Feminized"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newOpen}
                  onChange={(e) => setNewOpen(e.target.checked)}
                />
              }
              label="Open"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
              }
              label="Available?"
            />
          </Stack>
          <Stack>
            <Button
              sx={{ mt: { xs: 2, md: 5 } }}
              size="small"
              variant="contained"
              onClick={handleAddSeed}
            >
              Add Seed
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Data Grid Section */}
      <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
        <DataGrid
          rows={seeds.map((seed) => ({
            ...seed,
            id: seed.id, // Ensure each row has a unique id
          }))}
          columns={columns}
          processRowUpdate={processRowUpdate} // Ensure this is passed correctly
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
            event.defaultMuiPrevented = true; // Disable default double-click to edit behavior
          }}
        />
      </Box>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{seedToDelete?.strain}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
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

export default SeedsPage;
