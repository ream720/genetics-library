import React from "react";
import {
  Box,
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
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridEditBooleanCell } from "@mui/x-data-grid";
import { useCloneContext } from "../context/CloneContext";
import { Clone } from "../types";
import { Edit, Delete, AddCircleOutline, Verified } from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditCloneModal from "../components/EditCloneModal";
import CSVUpload from "../components/CSVUpload";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

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
      field: "phenoHunted",
      headerName: "Source",
      headerAlign: "center",
      align: "center",
      width: 130,
      flex: 0,
      renderCell: (params) =>
        params.value ? <Chip label="Pheno Hunted" size="small" /> : null,
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
      width: 92,
      flex: 0,
      renderCell: (params) => {
        const sexValue = params.value;
        if (sexValue === "Female" || sexValue === "Male") {
          return <Chip label={sexValue} size="small" variant="outlined" />;
        }
        return "";
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
    <PageContainer maxWidth="xl">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Genetics library"
          title="Clones"
          description={`${clones.length} clone ${clones.length === 1 ? "entry" : "entries"} in your private collection. Add individual records or import a CSV.`}
        />

        <SectionCard
          title="Add Clones"
          description="Add one clone manually or import a CSV when you have a batch."
          action={<CSVUpload onUploadSuccess={handleCSVUpload} />}
          contentPadding={2.5}
        >
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.2fr) minmax(260px, 0.8fr)",
                },
                gap: 2,
              }}
            >
              <Stack spacing={2}>
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    placeholder="Harry Palms Cut"
                    label="Tag"
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
                <TextField
                  label="Lineage"
                  placeholder="Sherbanger x Z"
                  value={lineage}
                  onChange={(e) => setLineage(e.target.value)}
                  fullWidth
                />
              </Stack>

              <Stack spacing={1}>
                <FormControl fullWidth>
                  <InputLabel>Sex</InputLabel>
                  <Select
                    value={isMale}
                    onChange={(e) =>
                      setIsMale(e.target.value as "Female" | "Male")
                    }
                    label="Sex"
                  >
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isBreederCut}
                      onChange={(e) => setIsBreederCut(e.target.checked)}
                    />
                  }
                  label="Breeder cut"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                    />
                  }
                  label="Available"
                />
              </Stack>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddCircleOutline />}
              onClick={handleAddClone}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Add Clone
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Clone Records"
          description="Edit clone metadata, availability, and source details."
          action={<Chip label={`${clones.length} total`} size="small" />}
          contentPadding={2.5}
        >
          <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
            <DataGrid
              rows={clones.map((clone) => ({ ...clone, id: clone.id }))}
              columns={columns}
              pagination
              initialState={{
                pagination: {
                  rowCount: clones.length,
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
        </SectionCard>

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
      </Stack>
    </PageContainer>
  );
};

export default ClonesPage;

