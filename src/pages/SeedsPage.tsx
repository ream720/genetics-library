import React from "react";
import {
  Box,
  Button,
  Chip,
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
  Tabs,
  Tab,
  Typography,
  useMediaQuery,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridRowModesModel,
  GridRowModes,
  GridEditBooleanCell,
} from "@mui/x-data-grid";
import { useSeedContext } from "../context/SeedContext";
import { Seed } from "../types";
import {
  Edit,
  Delete,
  AddCircleOutline,
  Female,
  SearchRounded,
  MoreVert,
} from "@mui/icons-material";

import { FaMagic } from "react-icons/fa";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditSeedModal from "../components/EditSeedModal";
import ConversationalSeedAssistant from "../components/ConversationalSeedAssistant";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

// Interface for the tab values
interface TabPanelProps {
  children?: React.ReactNode;
  idPrefix?: string;
  index: number;
  value: number;
}

const SEED_PAGE_TAB_MANAGE = 0;
const SEED_PAGE_TAB_ADD = 1;
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

// Custom TabPanel component for switching between modes
function TabPanel(props: TabPanelProps) {
  const { children, value, index, idPrefix = "seed-input", ...other } = props;

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

const SeedsPage: React.FC = () => {
  const { seeds, addSeed, deleteSeed, updateSeed, setSeeds } = useSeedContext();
  const isDesktopGrid = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("md")
  );

  const [seedPageTab, setSeedPageTab] = React.useState(SEED_PAGE_TAB_MANAGE);

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
  const [mobileSeedLimit, setMobileSeedLimit] = React.useState(
    MOBILE_RECORD_INITIAL_LIMIT
  );
  const [manageSeedSearch, setManageSeedSearch] = React.useState("");

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
  const [actionsMenuAnchor, setActionsMenuAnchor] =
    React.useState<HTMLElement | null>(null);
  const [actionsMenuSeed, setActionsMenuSeed] = React.useState<Seed | null>(
    null
  );

  // Handler for tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setInputMode(newValue);
  };

  const handleSeedPageTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setSeedPageTab(newValue);
  };

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    seed: Seed
  ) => {
    event.stopPropagation();
    setActionsMenuAnchor(event.currentTarget);
    setActionsMenuSeed(seed);
  };

  const handleCloseActionsMenu = () => {
    setActionsMenuAnchor(null);
    setActionsMenuSeed(null);
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

  const handleActionsEdit = () => {
    if (actionsMenuSeed) {
      handleEditClick(actionsMenuSeed);
    }

    handleCloseActionsMenu();
  };

  const handleActionsDelete = () => {
    if (actionsMenuSeed) {
      handleDeleteClick(actionsMenuSeed);
    }

    handleCloseActionsMenu();
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
      headerName: "Type",
      headerAlign: "center",
      align: "center",
      editable: true,
      width: 110,
      flex: 0,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Feminized" : "Regular"}
          size="small"
          variant={params.value ? "filled" : "outlined"}
        />
      ),
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
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 72,
      flex: 0,
      renderCell: (params) => (
        <Tooltip title="Open seed actions">
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

  const filteredManageSeeds = React.useMemo(() => {
    const normalizedQuery = manageSeedSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return seeds;
    }

    return seeds.filter((seed) =>
      [
        seed.strain,
        seed.breeder,
        seed.generation,
        seed.lineage,
        seed.feminized ? "feminized" : "regular",
        seed.open ? "open pack" : "sealed pack",
        seed.available ? "available" : "unavailable",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [manageSeedSearch, seeds]);

  React.useEffect(() => {
    setMobileSeedLimit(MOBILE_RECORD_INITIAL_LIMIT);
  }, [manageSeedSearch]);

  const displayedMobileSeeds = filteredManageSeeds.slice(0, mobileSeedLimit);
  const hasMoreMobileSeeds =
    displayedMobileSeeds.length < filteredManageSeeds.length;

  return (
    <PageContainer maxWidth="xl">
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Genetics library"
          title="Seeds"
          description={`${seeds.length} seed ${seeds.length === 1 ? "entry" : "entries"} in your private collection. Add records manually, with AI assistance, or by CSV.`}
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
            value={seedPageTab}
            onChange={handleSeedPageTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label="seed page sections"
          >
            <Tab
              id="seed-page-tab-0"
              aria-controls="seed-page-tabpanel-0"
              label="Manage"
              sx={{ minHeight: 44, fontWeight: 800 }}
            />
            <Tab
              id="seed-page-tab-1"
              aria-controls="seed-page-tabpanel-1"
              label="Add"
              sx={{ minHeight: 44, fontWeight: 800 }}
            />
          </Tabs>
        </Box>

        <TabPanel
          value={seedPageTab}
          index={SEED_PAGE_TAB_ADD}
          idPrefix="seed-page"
        >
        <SectionCard
          title="Add Seeds"
          description="Use the assistant for fast cataloging, or enter seed details manually."
          contentPadding={2.5}
        >
          <Box
            sx={(theme) => ({
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: theme.palette.surface.subtle,
              overflow: "hidden",
            })}
          >
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
          </Box>

          <TabPanel value={inputMode} index={0}>
            <ConversationalSeedAssistant />
          </TabPanel>

          <TabPanel value={inputMode} index={1}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.3fr) minmax(240px, 0.7fr)",
                  },
                  gap: 2,
                }}
              >
                <Stack spacing={2}>
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
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="# of Seeds"
                      placeholder="12"
                      type="number"
                      value={numSeeds}
                      onChange={(e) => setNumSeeds(Number(e.target.value))}
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
                  <TextField
                    label="Lineage"
                    placeholder="GMO x Rainbow Belts F1"
                    value={lineage}
                    onChange={(e) => setLineage(e.target.value)}
                    fullWidth
                  />
                </Stack>

                <Stack spacing={1}>
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
                    label="Open pack"
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isMultiple}
                        onChange={(e) => setIsMultiple(e.target.checked)}
                      />
                    }
                    label="Multiple packs"
                  />
                  {isMultiple && (
                    <TextField
                      sx={{ maxWidth: 160 }}
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
                  )}
                </Stack>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                onClick={handleAddSeed}
                sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
              >
                Add Seed
              </Button>
            </Stack>
          </TabPanel>
        </SectionCard>
        </TabPanel>

        <TabPanel
          value={seedPageTab}
          index={SEED_PAGE_TAB_MANAGE}
          idPrefix="seed-page"
        >
        <SectionCard
          title="Seed Records"
          description="Edit availability, inventory, and seed pack details."
          action={
            <Chip
              label={
                manageSeedSearch.trim()
                  ? `${filteredManageSeeds.length} of ${seeds.length}`
                  : `${seeds.length} total`
              }
              size="small"
            />
          }
          contentPadding={2.5}
        >
          <TextField
            label="Search seed records"
            placeholder="Search by strain, breeder, lineage..."
            value={manageSeedSearch}
            onChange={(event) => setManageSeedSearch(event.target.value)}
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
            {displayedMobileSeeds.length === 0 ? (
              <Box
                sx={(theme) => ({
                  border: 1,
                  borderColor: "divider",
                  borderRadius: { xs: 2, sm: 3 },
                  bgcolor: theme.palette.surface.subtle,
                  p: 2,
                })}
              >
                <Typography fontWeight={800}>No seed records found</Typography>
                <Typography color="text.secondary" variant="body2">
                  Try a different strain, breeder, or lineage search.
                </Typography>
              </Box>
            ) : (
              displayedMobileSeeds.map((seed) => (
                <Box key={seed.id} sx={mobileRecordCardSx}>
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
                          {seed.feminized ? (
                            <Tooltip title="Feminized">
                              <Female
                                color="action"
                                fontSize="small"
                                titleAccess="Feminized seed"
                              />
                            </Tooltip>
                          ) : null}
                          <Typography
                            variant="subtitle2"
                            fontWeight={900}
                            noWrap
                            sx={{ minWidth: 0 }}
                          >
                            {seed.strain}
                          </Typography>
                        </Stack>
                        <Typography color="text.secondary" variant="body2" noWrap>
                          {seed.breeder}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title="Edit seed">
                          <IconButton
                            aria-label={`Edit ${seed.strain}`}
                            onClick={() => handleEditClick(seed)}
                            size="small"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete seed">
                          <IconButton
                            aria-label={`Delete ${seed.strain}`}
                            color="error"
                            onClick={() => handleDeleteClick(seed)}
                            size="small"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      <Chip
                        label={`${seed.numSeeds} ${
                          seed.numSeeds === 1 ? "seed" : "seeds"
                        }`}
                        size="small"
                        variant="outlined"
                      />
                      {seed.isMultiple && seed.quantity > 1 ? (
                        <Chip label={`${seed.quantity} packs`} size="small" />
                      ) : null}
                      {seed.open ? (
                        <Chip label="Open pack" size="small" />
                      ) : null}
                      {seed.available ? (
                        <Chip label="Available" color="success" size="small" />
                      ) : null}
                      {seed.generation ? (
                        <Chip
                          label={`Generation: ${seed.generation}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>

                    {seed.lineage ? (
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {seed.lineage}
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>
              ))
            )}

            {hasMoreMobileSeeds ? (
              <Button
                variant="outlined"
                onClick={() =>
                  setMobileSeedLimit(
                    (currentLimit) => currentLimit + MOBILE_RECORD_INCREMENT
                  )
                }
              >
                Show next{" "}
                {Math.min(
                  MOBILE_RECORD_INCREMENT,
                  filteredManageSeeds.length - displayedMobileSeeds.length
                )}{" "}
                seeds
              </Button>
            ) : null}
          </Box>

          {isDesktopGrid ? (
            <Box sx={{ height: 600, width: "100%", overflowX: "auto" }}>
              <DataGrid
                rows={filteredManageSeeds.map((seed) => ({
                  ...seed,
                  id: seed.id,
                }))}
                columns={columns}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) =>
                  console.error("Error during row update:", error)
                }
                rowModesModel={rowModesModel}
                onRowModesModelChange={(newModel) =>
                  setRowModesModel(newModel)
                }
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
          "aria-label": actionsMenuSeed
            ? `Actions for ${actionsMenuSeed.strain}`
            : "Seed actions",
        }}
      >
        <MenuItem onClick={handleActionsEdit} disabled={!actionsMenuSeed}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionsDelete} disabled={!actionsMenuSeed}>
          <ListItemIcon>
            <Delete color="error" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
      </Stack>
    </PageContainer>
  );
};

export default SeedsPage;

