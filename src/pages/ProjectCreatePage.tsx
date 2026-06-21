import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(PROJECT_ROUTES.list)}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Projects
        </Button>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  Create Project
                </Typography>
                <Typography color="text.secondary">
                  Create a private project using existing Genetics Library
                  entries or an ad-hoc source.
                </Typography>
              </Box>

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
                  variant={
                    projectType === "wash_process" ? "filled" : "outlined"
                  }
                />
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

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

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6">Existing Genetics</Typography>
                      <Typography color="text.secondary" variant="body2">
                        Select seeds or clones to copy into this project's
                        private source snapshots.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} gutterBottom>
                          Seeds
                        </Typography>
                        <TextField
                          label="Search seeds"
                          value={seedSearchQuery}
                          onChange={(event) =>
                            setSeedSearchQuery(event.target.value)
                          }
                          size="small"
                          fullWidth
                          sx={{ mb: 1 }}
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
                          filteredSeeds.map((seed) => (
                            <FormControlLabel
                              key={seed.id}
                              control={
                                <Checkbox
                                  checked={selectedSeedIds.includes(seed.id)}
                                  onChange={() => toggleSeed(seed.id)}
                                />
                              }
                              label={`${seed.strain} by ${seed.breeder}`}
                            />
                          ))
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} gutterBottom>
                          Clones
                        </Typography>
                        <TextField
                          label="Search clones"
                          value={cloneSearchQuery}
                          onChange={(event) =>
                            setCloneSearchQuery(event.target.value)
                          }
                          size="small"
                          fullWidth
                          sx={{ mb: 1 }}
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
                          filteredClones.map((clone) => (
                            <FormControlLabel
                              key={clone.id}
                              control={
                                <Checkbox
                                  checked={
                                    Boolean(clone.id) &&
                                    selectedCloneIds.includes(clone.id!)
                                  }
                                  onChange={() =>
                                    clone.id && toggleClone(clone.id)
                                  }
                                />
                              }
                              label={`${clone.strain} by ${clone.breeder}`}
                            />
                          ))
                        )}
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

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
                    {adHocHasValue && (
                      <Chip label="Source entered" size="small" />
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Typography color="text.secondary" variant="body2">
                      Optional source genetics that are not currently in your
                      library.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Breeder"
                        value={adHocBreeder}
                        onChange={(event) =>
                          setAdHocBreeder(event.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        label="Strain"
                        value={adHocStrain}
                        onChange={(event) =>
                          setAdHocStrain(event.target.value)
                        }
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Lineage"
                        value={adHocLineage}
                        onChange={(event) =>
                          setAdHocLineage(event.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        label="Generation"
                        value={adHocGeneration}
                        onChange={(event) =>
                          setAdHocGeneration(event.target.value)
                        }
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

              <Button
                variant="contained"
                disabled={saving}
                onClick={handleCreateProject}
              >
                {saving
                  ? "Creating..."
                  : `Create ${PROJECT_TYPE_LABELS[projectType]} Project`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default ProjectCreatePage;
