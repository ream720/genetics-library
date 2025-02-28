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
  Autocomplete,
  Divider,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
  GridEditBooleanCell,
} from "@mui/x-data-grid";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";
import { Edit, Delete, AddCircleOutline } from "@mui/icons-material";

import { FaMagic } from "react-icons/fa";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditSeedModal from "../components/EditSeedModal";
import ConversationalSeedAssistant from "../components/ConversationalSeedAssistant";

// Interface for the tab values
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Custom TabPanel component for switching between modes
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`seed-input-tabpanel-${index}`}
      aria-labelledby={`seed-input-tab-${index}`}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed, updateSeed, setSeeds } = useSeedContext();

  // Add state for tab selection (0 = AI Assistant, 1 = Manual Entry)
  const [inputMode, setInputMode] = React.useState(0);

  // Form states
  const [seedBreeder, setSeedBreeder] = React.useState("");
  const [seedStrain, setSeedStrain] = React.useState("");
  const [lineage, setLineage] = React.useState("");
  const [filalGeneration, setFilalGeneration] = React.useState("");
  const [numSeeds, setNumSeeds] = React.useState(0);
  const [isFeminized, setIsFeminized] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedSeed, setSelectedSeed] = React.useState<Seed | null>(null);
  const [isMultiple, setIsMultiple] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);

  // Validation states
  const [breederError, setBreederError] = React.useState(false);
  const [strainError, setStrainError] = React.useState(false);

  // Row edit state
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [seedToDelete, setSeedToDelete] = React.useState<Seed | null>(null);

  // Handler for tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setInputMode(newValue);
  };

  // Return unique breeder names from the seeds array
  const uniqueBreeders = Array.from(
    new Set(seeds.map((s) => s.breeder))
  ).sort();

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
      deleteSeed(seedToDelete.id!);
    }
    handleCloseDeleteDialog();
  };

  // Handle adding a new seed
  const handleAddSeed = () => {
    const isBreederValid = Boolean(seedBreeder.trim());
    const isStrainValid = Boolean(seedStrain.trim());

    setBreederError(!isBreederValid);
    setStrainError(!isStrainValid);

    if (seedBreeder && seedStrain) {
      addSeed({
        breeder: seedBreeder,
        strain: seedStrain,
        generation: filalGeneration,
        numSeeds: numSeeds,
        feminized: isFeminized,
        open: isOpen,
        dateAcquired: new Date().toISOString(),
        available: isAvailable,
        lineage: lineage,
        isMultiple: isMultiple,
        quantity: isMultiple ? quantity : 1,
      } as Seed);

      // Reset form fields and validation
      setSeedBreeder("");
      setSeedStrain("");
      setFilalGeneration("");
      setNumSeeds(0);
      setIsFeminized(false);
      setIsOpen(false);
      setIsAvailable(false);
      setLineage("");
      setIsMultiple(false);
      setQuantity(1);
    }
  };

  // Handle row update
  const processRowUpdate = async (newRow: Seed, oldRow: Seed) => {
    try {
      // Create an object to hold only the changed fields
      const changedFields: Partial<Seed> = {};
      let hasChanges = false;

      // Only check fields that exist in the Seed type
      const seedKeys: Array<keyof Seed> = [
        "breeder",
        "strain",
        "lineage",
        "generation",
        "numSeeds",
        "feminized",
        "open",
        "available",
        "dateAcquired",
        "isMultiple",
        "quantity",
        "id",
        "userId",
      ];

      seedKeys.forEach((key) => {
        if (newRow[key] !== oldRow[key]) {
          // Type-safe assignment using indexed access
          switch (key) {
            case "breeder":
            case "strain":
            case "lineage":
            case "generation":
            case "dateAcquired":
            case "id":
            case "userId":
              changedFields[key] = String(newRow[key]);
              break;
            case "numSeeds":
            case "quantity":
              changedFields[key] = Number(newRow[key]);
              break;
            case "feminized":
            case "open":
            case "available":
            case "isMultiple":
              changedFields[key] = Boolean(newRow[key]);
              break;
          }
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        setRowModesModel({
          ...rowModesModel,
          [newRow.id!]: { mode: GridRowModes.View },
        });
        return oldRow;
      }

      // Update Firestore with only the changed fields
      await updateSeed(newRow.id!, changedFields);

      // Optimistic Update: Update the `seeds` state
      setSeeds((prevSeeds: Seed[]) =>
        prevSeeds.map((seed) =>
          seed.id === newRow.id ? { ...seed, ...changedFields } : seed
        )
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
  const handleEditClick = (seed: Seed) => {
    setSelectedSeed(seed);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedSeed: Seed) => {
    try {
      await updateSeed(updatedSeed.id!, updatedSeed);
      setSeeds((prevSeeds: Seed[]) =>
        prevSeeds.map((seed) =>
          seed.id === updatedSeed.id ? updatedSeed : seed
        )
      );
    } catch (error) {
      console.error("Failed to update seed:", error);
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
      headerName: "Sex",
      headerAlign: "center",
      align: "center",
      editable: true,
      flex: 0,
      renderCell: (params) => {
        return params.value ? "♀" : "♂";
      },
      renderEditCell: (params) => {
        return <GridEditBooleanCell {...params} />;
      },
    },
    {
      field: "open",
      headerName: "Sealed",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 75,
      flex: 0,
      renderCell: (params) => {
        const isOpened = params.value; // boolean
        const symbol = isOpened ? "🔓" : "🔒";
        const tooltipText = isOpened ? "Open Pack" : "Sealed Pack";

        return (
          <Tooltip title={tooltipText}>
            <span style={{ fontSize: "1rem" }}>{symbol}</span>
          </Tooltip>
        );
      },
      renderEditCell: (params) => {
        return <GridEditBooleanCell {...params} />;
      },
    },
    {
      field: "available",
      headerName: "Available",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 100,
      flex: 0,
      renderCell: (params) => {
        // Type guard to ensure we're working with a boolean
        const isAvailable =
          typeof params.value === "boolean" ? params.value : false;

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
      field: "isMultiple",
      headerName: "Quantity",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 100,
      flex: 0,
      renderCell: (params) => (
        <Box>
          {params.value ? (
            <Tooltip title={`${params.row.quantity} packs available`}>
              <div>{params.row.quantity}</div>
            </Tooltip>
          ) : (
            <Tooltip title="Single pack">
              <div>1️</div>
            </Tooltip>
          )}
        </Box>
      ),
      renderEditCell: (params) => <GridEditBooleanCell {...params} />,
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
    <Box sx={{ px: 3, pb: 3 }}>
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
        Manage Seeds
      </Typography>

      {/* Mode Selection Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={inputMode}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label="seed input method tabs"
        >
          <Tab
            icon={<FaMagic size={20} />}
            label="AI Assistant"
            iconPosition="start"
            sx={{ fontWeight: "bold" }}
          />
          <Tab
            icon={<EditIcon />}
            label="Manual Entry"
            iconPosition="start"
            sx={{ fontWeight: "bold" }}
          />
        </Tabs>
      </Paper>

      {/* AI Assistant Panel */}
      <TabPanel value={inputMode} index={0}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ConversationalSeedAssistant />
        </Box>
      </TabPanel>

      {/* Manual Entry Panel */}
      <TabPanel value={inputMode} index={1}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Stack
            spacing={2}
            direction={{ xs: "column", sm: "row" }}
            alignItems="flex-start"
          >
            <Stack spacing={2} sx={{ minWidth: 300 }}>
              <Autocomplete
                options={uniqueBreeders}
                freeSolo
                inputValue={seedBreeder}
                onInputChange={(_event, newInputValue) => {
                  setSeedBreeder(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    placeholder="Archive Seed Bank"
                    label="Breeder"
                    value={seedBreeder}
                    onChange={(e) => setSeedBreeder(e.target.value)}
                    error={breederError}
                    helperText={breederError ? "Breeder is required" : ""}
                    fullWidth
                  />
                )}
              />
              <TextField
                required
                placeholder="Dark Rainbow"
                label="Strain"
                value={seedStrain}
                error={strainError}
                helperText={strainError ? "Strain is required" : ""}
                onChange={(e) => setSeedStrain(e.target.value)}
                fullWidth
              />
              <TextField
                label="# of Seeds"
                placeholder="12"
                type="number"
                value={numSeeds}
                onChange={(e) => setNumSeeds(Number(e.target.value))}
                fullWidth
              />
              <TextField
                label="Lineage"
                placeholder="GMO x Rainbow Belts F1"
                value={lineage}
                onChange={(e) => setLineage(e.target.value)}
                fullWidth
              />
              <TextField
                placeholder="F1, S1, etc."
                label="Generation"
                value={filalGeneration}
                onChange={(e) => setFilalGeneration(e.target.value)}
                fullWidth
              />
            </Stack>

            <Stack spacing={2} sx={{ minWidth: 200 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isFeminized}
                    onChange={(e) => setIsFeminized(e.target.checked)}
                  />
                }
                label="Feminized"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                  />
                }
                label="Open Pack?"
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isMultiple}
                    onChange={(e) => setIsMultiple(e.target.checked)}
                  />
                }
                label="Multiple Packs?"
              />
              {isMultiple && (
                <Stack pl={1}>
                  <TextField
                    sx={{ maxWidth: 100 }}
                    label="Quantity"
                    type="number"
                    value={quantity === 0 ? "" : quantity}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? 0
                          : Math.max(0, parseInt(e.target.value) || 0);
                      setQuantity(value);
                    }}
                  />
                </Stack>
              )}
            </Stack>

            <Box sx={{ pt: 2 }}>
              <Tooltip title="Add Seed">
                <IconButton
                  sx={{ color: "primary.main" }}
                  onClick={handleAddSeed}
                  size="large"
                >
                  <AddCircleOutline fontSize="large" />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Box>
      </TabPanel>

      <Divider sx={{ margin: 2 }} />

      {/* Data Grid Section */}
      <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
        <DataGrid
          rows={seeds.map((seed) => ({
            ...seed,
            id: seed.id,
          }))}
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
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onCellEditStart={(_params, event) => {
            event.defaultMuiPrevented = true;
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

      {/* Edit Seed Modal */}
      <EditSeedModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSeed(null);
        }}
        seed={selectedSeed}
        onSave={handleSaveEdit}
      />
    </Box>
  );
};

export default SeedsPage;
