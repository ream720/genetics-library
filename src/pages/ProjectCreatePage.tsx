import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCloneContext } from "../context/CloneContext";
import { useSeedContext } from "../context/SeedContext";
import { todayLocalDateString } from "../lib/v2/date";
import { PROJECT_ROUTES } from "../lib/v2/projectPaths";
import {
  createAdHocSourceSnapshot,
  createCloneSourceSnapshot,
  createSeedSourceSnapshot,
} from "../lib/v2/snapshots";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectStatus,
  ProjectType,
} from "../types/v2";
import { createProject } from "../services/projects";
import { PageContainer, PageHeader, SectionCard } from "../components/ui";

const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { seeds } = useSeedContext();
  const { clones } = useCloneContext();
  const [projectType, setProjectType] = useState<ProjectType>("pheno_hunt");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState(todayLocalDateString());
  const [selectedSeedIds, setSelectedSeedIds] = useState<string[]>([]);
  const [selectedCloneIds, setSelectedCloneIds] = useState<string[]>([]);
  const [seedSearchQuery, setSeedSearchQuery] = useState("");
  const [cloneSearchQuery, setCloneSearchQuery] = useState("");
  const [adHocExpanded, setAdHocExpanded] = useState(false);
  const [adHocBreeder, setAdHocBreeder] = useState("");
  const [adHocStrain, setAdHocStrain] = useState("");
  const [adHocLineage, setAdHocLineage] = useState("");
  const [adHocGeneration, setAdHocGeneration] = useState("");
  const [adHocNotes, setAdHocNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adHocHasValue = Boolean(
    adHocBreeder.trim() ||
      adHocStrain.trim() ||
      adHocLineage.trim() ||
      adHocGeneration.trim() ||
      adHocNotes.trim()
  );
  const selectedSourceCount =
    selectedSeedIds.length + selectedCloneIds.length + (adHocHasValue ? 1 : 0);

  const selectedSeeds = useMemo(
    () => seeds.filter((seed) => selectedSeedIds.includes(seed.id)),
    [seeds, selectedSeedIds]
  );

  const selectedClones = useMemo(
    () =>
      clones.filter(
        (clone) => clone.id && selectedCloneIds.includes(clone.id)
      ),
    [clones, selectedCloneIds]
  );
  const selectedSourceSummaries = useMemo(
    () => [
      ...selectedSeeds.map((seed) => ({
        key: `seed-${seed.id}`,
        label: seed.strain,
        detail: `${seed.breeder} seed`,
      })),
      ...selectedClones.map((clone) => ({
        key: `clone-${clone.id}`,
        label: clone.strain,
        detail: `${clone.breeder} clone`,
      })),
      ...(adHocHasValue
        ? [
            {
              key: "ad-hoc",
              label: adHocStrain.trim() || "Ad-hoc source",
              detail: `${adHocBreeder.trim() || "Unknown breeder"} ad-hoc`,
            },
          ]
        : []),
    ],
    [adHocBreeder, adHocHasValue, adHocStrain, selectedClones, selectedSeeds]
  );
  const filteredSeeds = useMemo(() => {
    const queryText = seedSearchQuery.trim().toLowerCase();

    return seeds.filter((seed) => {
      if (selectedSeedIds.includes(seed.id)) {
        return true;
      }

      if (!queryText) {
        return true;
      }

      return [seed.strain, seed.breeder, seed.lineage, seed.generation]
        .join(" ")
        .toLowerCase()
        .includes(queryText);
    });
  }, [seedSearchQuery, seeds, selectedSeedIds]);
  const filteredClones = useMemo(() => {
    const queryText = cloneSearchQuery.trim().toLowerCase();

    return clones.filter((clone) => {
      if (clone.id && selectedCloneIds.includes(clone.id)) {
        return true;
      }

      if (!queryText) {
        return true;
      }

      return [clone.strain, clone.breeder, clone.lineage, clone.generation]
        .join(" ")
        .toLowerCase()
        .includes(queryText);
    });
  }, [cloneSearchQuery, clones, selectedCloneIds]);

  const toggleSeed = (seedId: string) => {
    setSelectedSeedIds((currentIds) =>
      currentIds.includes(seedId)
        ? currentIds.filter((id) => id !== seedId)
        : [...currentIds, seedId]
    );
  };

  const toggleClone = (cloneId: string) => {
    setSelectedCloneIds((currentIds) =>
      currentIds.includes(cloneId)
        ? currentIds.filter((id) => id !== cloneId)
        : [...currentIds, cloneId]
    );
  };

  const handleCreateProject = async () => {
    if (!currentUser) {
      setError("You must be signed in to create a project.");
      return;
    }

    const sourceSnapshots = [
      ...selectedSeeds.map(createSeedSourceSnapshot),
      ...selectedClones.map(createCloneSourceSnapshot),
      ...(adHocBreeder.trim() && adHocStrain.trim()
        ? [
            createAdHocSourceSnapshot({
              breeder: adHocBreeder.trim(),
              strain: adHocStrain.trim(),
              lineage: adHocLineage.trim() || undefined,
              generation: adHocGeneration.trim() || undefined,
              notes: adHocNotes.trim() || undefined,
            }),
          ]
        : []),
    ];

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!objective.trim()) {
      setError("Description or objective is required.");
      return;
    }

    if (sourceSnapshots.length === 0) {
      setError("Select existing genetics or add an ad-hoc source.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const project = await createProject({
        ownerId: currentUser.uid,
        type: projectType,
        name: name.trim(),
        objective: objective.trim(),
        status,
        startDate,
        sourceSnapshots,
      });

      if (project.id) {
        navigate(PROJECT_ROUTES.detail(project.id));
      } else {
        navigate(PROJECT_ROUTES.list);
      }
    } catch (createError) {
      console.error("Failed to create project:", createError);
      setError("Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={2.5}>
        <PageHeader
          eyebrow="New private project"
          title="Create project"
          description="Choose a project type, add source genetics, and start with only the details you know today."
          backLabel="Back to projects"
          onBack={() => navigate(PROJECT_ROUTES.list)}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <SectionCard title="Basics" contentPadding={2.5}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label="Pheno Hunt"
                color={projectType === "pheno_hunt" ? "primary" : "default"}
                onClick={() => setProjectType("pheno_hunt")}
                variant={projectType === "pheno_hunt" ? "filled" : "outlined"}
              />
              <Chip
                label="Wash/Process"
                color={projectType === "wash_process" ? "primary" : "default"}
                onClick={() => setProjectType("wash_process")}
                variant={projectType === "wash_process" ? "filled" : "outlined"}
              />
            </Stack>

            <TextField
              label="Project name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description or objective"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              fullWidth
              multiline
              minRows={3}
              required
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
                select
                fullWidth
              >
                {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Source Genetics"
          description="Select seeds or clones from your library."
          action={
            <Chip
              label={`${selectedSourceCount} selected`}
              color={selectedSourceCount > 0 ? "primary" : "default"}
              variant={selectedSourceCount > 0 ? "filled" : "outlined"}
              size="small"
            />
          }
          contentPadding={2.5}
        >
          <Stack spacing={2.5}>
            {selectedSourceSummaries.length > 0 && (
              <Box
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  bgcolor: theme.palette.surface.subtle,
                  p: 1.5,
                })}
              >
                <Stack spacing={1}>
                  <Typography fontWeight={800} variant="body2">
                    Selected sources
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {selectedSourceSummaries.map((source) => (
                      <Chip
                        key={source.key}
                        label={`${source.label} - ${source.detail}`}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Stack>
              </Box>
            )}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography fontWeight={800}>Seeds</Typography>
                <Typography color="text.secondary" variant="caption">
                  {selectedSeeds.length} selected
                </Typography>
              </Stack>
              <TextField
                label="Search seeds"
                value={seedSearchQuery}
                onChange={(event) => setSeedSearchQuery(event.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              {seeds.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No seeds available.
                </Typography>
              ) : filteredSeeds.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No seeds match your search.
                </Typography>
              ) : (
                <Stack
                  spacing={0.75}
                  sx={(theme) => ({
                    maxHeight: 300,
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    p: 0.75,
                    borderRadius: 3,
                    bgcolor: theme.palette.surface.sunken,
                    scrollbarWidth: "thin",
                    scrollbarColor: `${theme.palette.primary.main} transparent`,
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 999,
                    },
                  })}
                >
                  {filteredSeeds.map((seed) => {
                    const selected = selectedSeedIds.includes(seed.id);

                    return (
                      <FormControlLabel
                        key={seed.id}
                        control={
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleSeed(seed.id)}
                          />
                        }
                        label={
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap>
                              {seed.strain}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="body2"
                              noWrap
                            >
                              {seed.breeder}
                            </Typography>
                          </Box>
                        }
                        sx={(theme) => ({
                          m: 0,
                          minHeight: 48,
                          px: 1,
                          py: 0.5,
                          border: 1,
                          borderColor: selected
                            ? theme.palette.primary.main
                            : "transparent",
                          borderRadius: 2,
                          bgcolor: selected
                            ? theme.palette.action.selected
                            : "transparent",
                          "& .MuiFormControlLabel-label": { minWidth: 0 },
                        })}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography fontWeight={800}>Clones</Typography>
                <Typography color="text.secondary" variant="caption">
                  {selectedClones.length} selected
                </Typography>
              </Stack>
              <TextField
                label="Search clones"
                value={cloneSearchQuery}
                onChange={(event) => setCloneSearchQuery(event.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              {clones.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No clones available.
                </Typography>
              ) : filteredClones.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No clones match your search.
                </Typography>
              ) : (
                <Stack
                  spacing={0.75}
                  sx={(theme) => ({
                    maxHeight: 300,
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    p: 0.75,
                    borderRadius: 3,
                    bgcolor: theme.palette.surface.sunken,
                    scrollbarWidth: "thin",
                    scrollbarColor: `${theme.palette.primary.main} transparent`,
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 999,
                    },
                  })}
                >
                  {filteredClones.map((clone) => {
                    const selected = Boolean(
                      clone.id && selectedCloneIds.includes(clone.id)
                    );

                    return (
                      <FormControlLabel
                        key={clone.id}
                        control={
                          <Checkbox
                            checked={selected}
                            onChange={() => clone.id && toggleClone(clone.id)}
                          />
                        }
                        label={
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap>
                              {clone.strain}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="body2"
                              noWrap
                            >
                              {clone.breeder}
                            </Typography>
                          </Box>
                        }
                        sx={(theme) => ({
                          m: 0,
                          minHeight: 48,
                          px: 1,
                          py: 0.5,
                          border: 1,
                          borderColor: selected
                            ? theme.palette.primary.main
                            : "transparent",
                          borderRadius: 2,
                          bgcolor: selected
                            ? theme.palette.action.selected
                            : "transparent",
                          "& .MuiFormControlLabel-label": { minWidth: 0 },
                        })}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
            </Stack>
          </Stack>
        </SectionCard>

        <Divider />

        <Accordion
          expanded={adHocExpanded}
          onChange={(_event, expanded) => setAdHocExpanded(expanded)}
          disableGutters
          sx={{
            border: 1,
            borderColor: "divider",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              useFlexGap
              flexWrap="wrap"
            >
              <Tooltip title="Add genetics not in your Genetics Library collection.">
                <Typography variant="h6">Ad-Hoc Source</Typography>
              </Tooltip>
              {adHocHasValue && <Chip label="Source entered" size="small" />}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography color="text.secondary" variant="body2">
                Optional source genetics that are not currently in your library.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Breeder"
                  value={adHocBreeder}
                  onChange={(event) => setAdHocBreeder(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Strain"
                  value={adHocStrain}
                  onChange={(event) => setAdHocStrain(event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Lineage"
                  value={adHocLineage}
                  onChange={(event) => setAdHocLineage(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Generation"
                  value={adHocGeneration}
                  onChange={(event) => setAdHocGeneration(event.target.value)}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Notes"
                value={adHocNotes}
                onChange={(event) => setAdHocNotes(event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Box
          sx={(theme) => ({
            position: { xs: "sticky", sm: "static" },
            bottom: { xs: 0, sm: "auto" },
            zIndex: 2,
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            py: { xs: 1.5, sm: 0 },
            bgcolor: { xs: theme.palette.background.default, sm: "transparent" },
            borderTop: {
              xs: `1px solid ${theme.palette.divider}`,
              sm: "none",
            },
            pb: { xs: "max(12px, env(safe-area-inset-bottom))", sm: 0 },
            display: "flex",
            justifyContent: { sm: "flex-end" },
          })}
        >
          <Button
            variant="contained"
            disabled={saving}
            onClick={handleCreateProject}
            size="large"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {saving
              ? "Creating..."
              : `Create ${PROJECT_TYPE_LABELS[projectType]} Project`}
          </Button>
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default ProjectCreatePage;
