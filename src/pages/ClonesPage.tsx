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
  Typography,
  Tabs,
  Tab,
  useMediaQuery,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridEditBooleanCell } from "@mui/x-data-grid";
import { useCloneContext } from "../context/CloneContext";
import { Clone } from "../types";
import {
  Edit,
  Delete,
  AddCircleOutline,
  Verified,
  Female,
  Male,
  SearchRounded,
  MoreVert,
} from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditCloneModal from "../components/EditCloneModal";
import CSVUpload from "../components/CSVUpload";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

interface TabPanelProps {
  children?: React.ReactNode;
  idPrefix?: string;
  index: number;
  value: number;
}

const CLONE_PAGE_TAB_MANAGE = 0;
const CLONE_PAGE_TAB_ADD = 1;
const MOBILE_RECORD_INITIAL_LIMIT = 12;
const MOBILE_RECORD_INCREMENT = 12;

const mobileRecordCardSx = {
  boxSizing: "border-box",
  border: 1,
  borderColor: "divider",
  borderRadius: { xs: 2, sm: 3 },
  bgcolor: "surface.subtle",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  p: 1.5,
  width: "100%",
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, idPrefix = "clone-page", ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${idPrefix}-tabpanel-${index}`}
      aria-labelledby={`${idPrefix}-tab-${index}`}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const ClonesPage: React.FC = () => {
  const { clones, addClone, deleteClone, updateClone, setClones } =
    useCloneContext();
  const isDesktopGrid = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("md")
  );

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
  const [mobileCloneLimit, setMobileCloneLimit] = React.useState(
    MOBILE_RECORD_INITIAL_LIMIT
  );
  const [manageCloneSearch, setManageCloneSearch] = React.useState("");
  const [clonePageTab, setClonePageTab] = React.useState(
    CLONE_PAGE_TAB_MANAGE
  );

  // Validation states
  const [breederError, setBreederError] = React.useState(false);
  const [strainError, setStrainError] = React.useState(false);

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cloneToDelete, setCloneToDelete] = React.useState<Clone | null>(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [actionsMenuClone, setActionsMenuClone] =
    React.useState<Clone | null>(null);

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

  const handleClonePageTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setClonePageTab(newValue);
  };

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    clone: Clone
  ) => {
    event.stopPropagation();
    setActionsMenuAnchor(event.currentTarget);
    setActionsMenuClone(clone);
  };

  const handleCloseActionsMenu = () => {
    setActionsMenuAnchor(null);
    setActionsMenuClone(null);
  };

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

  const handleActionsEdit = () => {
    if (actionsMenuClone) {
      handleEditClick(actionsMenuClone);
    }

    handleCloseActionsMenu();
  };

  const handleActionsDelete = () => {
    if (actionsMenuClone) {
      handleDeleteClick(actionsMenuClone);
    }

    handleCloseActionsMenu();
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
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 72,
      flex: 0,
      renderCell: (params) => (
        <Tooltip title="Open clone actions">
          <IconButton
            aria-label={`Open actions for ${params.row.strain}`}
            onClick={(event) => handleOpenActionsMenu(event, params.row)}
            size="small"
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const filteredManageClones = React.useMemo(() => {
    const normalizedQuery = manageCloneSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return clones;
    }

    return clones.filter((clone) =>
      [
        clone.strain,
        clone.breeder,
        clone.cutName,
        clone.generation,
        clone.lineage,
        clone.sex,
        clone.breederCut ? "breeder cut" : undefined,
        clone.phenoHunted ? "pheno hunted" : undefined,
        clone.available ? "available" : "unavailable",
        ...(clone.finalLabels ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [clones, manageCloneSearch]);

  React.useEffect(() => {
    setMobileCloneLimit(MOBILE_RECORD_INITIAL_LIMIT);
  }, [manageCloneSearch]);

  const displayedMobileClones = filteredManageClones.slice(0, mobileCloneLimit);
  const hasMoreMobileClones =
    displayedMobileClones.length < filteredManageClones.length;

  return (
    <PageContainer maxWidth="xl">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Genetics library"
          title="Clones"
          description={`${clones.length} clone ${clones.length === 1 ? "entry" : "entries"} in your private collection. Add individual records or import a CSV.`}
        />

        <Box
          sx={(theme) => ({
            border: 1,
            borderColor: "divider",
            borderRadius: 999,
            bgcolor: theme.palette.surface.subtle,
            overflow: "hidden",
            p: 0.5,
          })}
        >
          <Tabs
            value={clonePageTab}
            onChange={handleClonePageTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label="clone page sections"
          >
            <Tab
              id="clone-page-tab-0"
              aria-controls="clone-page-tabpanel-0"
              label="Manage"
              sx={{ minHeight: 44, fontWeight: 800 }}
            />
            <Tab
              id="clone-page-tab-1"
              aria-controls="clone-page-tabpanel-1"
              label="Add"
              sx={{ minHeight: 44, fontWeight: 800 }}
            />
          </Tabs>
        </Box>

        <TabPanel
          value={clonePageTab}
          index={CLONE_PAGE_TAB_ADD}
          idPrefix="clone-page"
        >
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
        </TabPanel>

        <TabPanel
          value={clonePageTab}
          index={CLONE_PAGE_TAB_MANAGE}
          idPrefix="clone-page"
        >
        <SectionCard
          title="Clone Records"
          description="Edit clone metadata, availability, and source details."
          action={
            <Chip
              label={
                manageCloneSearch.trim()
                  ? `${filteredManageClones.length} of ${clones.length}`
                  : `${clones.length} total`
              }
              size="small"
            />
          }
          contentPadding={2.5}
        >
          <TextField
            label="Search clone records"
            placeholder="Search by strain, breeder, cut..."
            value={manageCloneSearch}
            onChange={(event) => setManageCloneSearch(event.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: { xs: "grid", md: "none" },
              gap: 1.25,
              maxWidth: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {displayedMobileClones.length === 0 ? (
              <Box
                sx={(theme) => ({
                  border: 1,
                  borderColor: "divider",
                  borderRadius: { xs: 2, sm: 3 },
                  bgcolor: theme.palette.surface.subtle,
                  p: 2,
                })}
              >
                <Typography fontWeight={800}>No clone records found</Typography>
                <Typography color="text.secondary" variant="body2">
                  Try a different strain, breeder, or cut search.
                </Typography>
              </Box>
            ) : (
              displayedMobileClones.map((clone) => (
                <Box key={clone.id} sx={mobileRecordCardSx}>
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        alignItems: "flex-start",
                        columnGap: 1,
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        minWidth: 0,
                      }}
                    >
                      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          sx={{ minWidth: 0 }}
                        >
                          {clone.sex === "Female" ? (
                            <Tooltip title="Female">
                              <Female
                                color="action"
                                fontSize="small"
                                titleAccess="Female clone"
                              />
                            </Tooltip>
                          ) : clone.sex === "Male" ? (
                            <Tooltip title="Male">
                              <Male
                                color="action"
                                fontSize="small"
                                titleAccess="Male clone"
                              />
                            </Tooltip>
                          ) : null}
                          <Typography
                            variant="subtitle2"
                            fontWeight={900}
                            noWrap
                            sx={{ minWidth: 0 }}
                          >
                            {clone.strain}
                          </Typography>
                        </Stack>
                        <Typography color="text.secondary" variant="body2" noWrap>
                          {clone.breeder}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title="Edit clone">
                          <IconButton
                            aria-label={`Edit ${clone.strain}`}
                            onClick={() => handleEditClick(clone)}
                            size="small"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete clone">
                          <IconButton
                            aria-label={`Delete ${clone.strain}`}
                            color="error"
                            onClick={() => handleDeleteClick(clone)}
                            size="small"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {clone.cutName ? (
                        <Chip
                          label={clone.cutName}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {clone.phenoHunted ? (
                        <Chip label="Pheno Hunted" size="small" />
                      ) : null}
                      {clone.breederCut ? (
                        <Chip
                          icon={<Verified fontSize="small" />}
                          label="Breeder cut"
                          size="small"
                        />
                      ) : null}
                      {clone.available ? (
                        <Chip label="Available" color="success" size="small" />
                      ) : null}
                      {clone.generation ? (
                        <Chip
                          label={`Generation: ${clone.generation}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {clone.finalLabels?.map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>

                    {clone.lineage ? (
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {clone.lineage}
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>
              ))
            )}

            {hasMoreMobileClones ? (
              <Button
                variant="outlined"
                onClick={() =>
                  setMobileCloneLimit(
                    (currentLimit) => currentLimit + MOBILE_RECORD_INCREMENT
                  )
                }
              >
                Show next{" "}
                {Math.min(
                  MOBILE_RECORD_INCREMENT,
                  filteredManageClones.length - displayedMobileClones.length
                )}{" "}
                clones
              </Button>
            ) : null}
          </Box>

          {isDesktopGrid ? (
            <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
              <DataGrid
                rows={filteredManageClones.map((clone) => ({
                  ...clone,
                  id: clone.id,
                }))}
                columns={columns}
                pagination
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
          ) : null}
        </SectionCard>
        </TabPanel>

      <Menu
        anchorEl={actionsMenuAnchor}
        open={Boolean(actionsMenuAnchor)}
        onClose={handleCloseActionsMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{
          "aria-label": actionsMenuClone
            ? `Actions for ${actionsMenuClone.strain}`
            : "Clone actions",
        }}
      >
        <MenuItem onClick={handleActionsEdit} disabled={!actionsMenuClone}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionsDelete} disabled={!actionsMenuClone}>
          <ListItemIcon>
            <Delete color="error" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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

