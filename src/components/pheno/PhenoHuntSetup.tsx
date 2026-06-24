import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectPhotoUploader from "../v2/ProjectPhotoUploader";
import {
  getPhenoHuntData,
  initializePhenoGroupsFromProject,
  savePlantEvaluation,
  setPhenoGroupPlantedCount,
  updatePhenotypeFinalLabels,
  updatePhysicalPlant,
  updatePhenoGroup,
  type PhenoHuntData,
} from "../../services/phenoHunts";
import {
  createProjectPhotoContextId,
  deleteProjectPhotosByIds,
  reassignProjectPhotos,
} from "../../services/projectPhotos";
import { todayLocalDateString, formatProjectDate } from "../../lib/v2/date";
import {
  FINAL_LABEL_LABELS,
  FinalLabel,
  PLANT_LIFECYCLE_STATE_LABELS,
  PhenoComparisonGroup,
  Phenotype,
  PlantEvaluation,
  PlantLifecycleState,
  PlantStageEvent,
  PhysicalPlant,
  ProjectBase,
  ProjectStatus,
  RatingScore,
} from "../../types/v2";
import { FilterBar, ResponsiveDialog, SectionCard } from "../ui";

interface PhenoHuntSetupProps {
  project: ProjectBase;
  readOnly: boolean;
  onProjectStatusChange?: (status: ProjectStatus) => void;
}

interface GroupDraft {
  name: string;
  notes: string;
  plantedCount: string;
}

interface PlantDraft {
  displayId: string;
  lifecycleState: PlantLifecycleState;
  stageDate: string;
  stageNotes: string;
  photoIds: string[];
}

interface EvaluationDraft {
  actualDate: string;
  vigorScore: string;
  structureTags: string;
  stretchScore: string;
  aromaTags: string;
  flavorTags: string;
  resinCoverageScore: string;
  resinCharacterTags: string;
  notes: string;
  photoIds: string[];
}

const emptyData: PhenoHuntData = {
  groups: [],
  phenotypes: [],
  plants: [],
  stageEvents: [],
  evaluations: [],
};

const FINAL_LABEL_OPTIONS: FinalLabel[] = ["keeper", "washer", "breeder"];

const buildGroupDrafts = (groups: PhenoComparisonGroup[]) =>
  groups.reduce<Record<string, GroupDraft>>((drafts, group) => {
    if (group.id) {
      drafts[group.id] = {
        name: group.name,
        notes: group.notes ?? "",
        plantedCount: String(group.plantedCount),
      };
    }

    return drafts;
  }, {});

const parsePlantedCount = (value: string) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
};

const GERMINATED_STATES = new Set<PlantLifecycleState>([
  "germinated",
  "seedling",
  "vegetative",
  "flowering",
  "harvested",
  "culled",
]);

const ACTIVE_STATES = new Set<PlantLifecycleState>([
  "germinated",
  "seedling",
  "vegetative",
  "flowering",
]);

type LifecycleFilter = PlantLifecycleState | "all";
type FinalLabelFilter = FinalLabel | "all";

const lifecycleTone = (state: PlantLifecycleState) => {
  if (state === "harvested") {
    return "success.main";
  }

  if (state === "failed_to_germinate" || state === "cancelled") {
    return "error.main";
  }

  if (state === "flowering") {
    return "warning.main";
  }

  if (ACTIVE_STATES.has(state)) {
    return "primary.main";
  }

  return "text.disabled";
};

const countPlantsByState = (
  plants: PhysicalPlant[],
  states: Set<PlantLifecycleState>
) => plants.filter((plant) => states.has(plant.lifecycleState)).length;

const parseDateString = (dateValue: string) => {
  const parsedDate = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatTags = (tags?: string[]) => tags?.join(", ") ?? "";

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const buildEvaluationDraft = (
  evaluation?: PlantEvaluation
): EvaluationDraft => ({
  actualDate: evaluation?.actualDate ?? todayLocalDateString(),
  vigorScore: evaluation?.vigorScore ? String(evaluation.vigorScore) : "",
  structureTags: formatTags(evaluation?.structureTags),
  stretchScore: evaluation?.stretchScore ? String(evaluation.stretchScore) : "",
  aromaTags: formatTags(evaluation?.aromaTags),
  flavorTags: formatTags(evaluation?.flavorTags),
  resinCoverageScore: evaluation?.resinCoverageScore
    ? String(evaluation.resinCoverageScore)
    : "",
  resinCharacterTags: formatTags(evaluation?.resinCharacterTags),
  notes: evaluation?.notes ?? "",
  photoIds: evaluation?.photoIds ?? [],
});

const parseOptionalRating = (value: string): RatingScore | null | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);
  return [1, 2, 3, 4, 5].includes(parsedValue)
    ? (parsedValue as RatingScore)
    : null;
};

const calculateFloweringDays = (stageEvents: PlantStageEvent[]) => {
  const floweringEvent = [...stageEvents]
    .reverse()
    .find((event) => event.state === "flowering");

  if (!floweringEvent) {
    return null;
  }

  const floweringStart = parseDateString(floweringEvent.date);
  if (!floweringStart) {
    return null;
  }

  const harvestEvent = stageEvents.find(
    (event) =>
      event.state === "harvested" &&
      parseDateString(event.date) &&
      parseDateString(event.date)! >= floweringStart
  );
  const endDate = harvestEvent
    ? parseDateString(harvestEvent.date)
    : parseDateString(todayLocalDateString());

  if (!endDate) {
    return null;
  }

  return Math.max(
    0,
    Math.round((endDate.getTime() - floweringStart.getTime()) / 86400000)
  );
};

const PhenoHuntSetup: React.FC<PhenoHuntSetupProps> = ({
  project,
  readOnly,
  onProjectStatusChange,
}) => {
  const [data, setData] = useState<PhenoHuntData>(emptyData);
  const [groupDrafts, setGroupDrafts] = useState<Record<string, GroupDraft>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [savingPlant, setSavingPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PhysicalPlant | null>(
    null
  );
  const [plantDraft, setPlantDraft] = useState<PlantDraft | null>(null);
  const [plantOriginalPhotoIds, setPlantOriginalPhotoIds] = useState<string[]>(
    []
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const [draftEvaluationNumber, setDraftEvaluationNumber] = useState<
    number | null
  >(null);
  const [evaluationDraft, setEvaluationDraft] =
    useState<EvaluationDraft | null>(null);
  const [evaluationEditMode, setEvaluationEditMode] = useState(false);
  const [evaluationPhotoContextId, setEvaluationPhotoContextId] = useState<
    string | null
  >(null);
  const [evaluationOriginalPhotoIds, setEvaluationOriginalPhotoIds] = useState<
    string[]
  >([]);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [savingFinalLabels, setSavingFinalLabels] = useState(false);
  const [keeperRemovalDraft, setKeeperRemovalDraft] = useState<{
    finalLabels: FinalLabel[];
  } | null>(null);
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LifecycleFilter>("all");
  const [finalLabelFilter, setFinalLabelFilter] =
    useState<FinalLabelFilter>("all");
  const [plantSearch, setPlantSearch] = useState("");
  const [editingGroupIds, setEditingGroupIds] = useState<
    Record<string, boolean>
  >({});
  const [plantDisplayLimits, setPlantDisplayLimits] = useState<
    Record<string, number>
  >({});
  const [error, setError] = useState<string | null>(null);

  const projectId = project.id;

  const loadData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedData = await getPhenoHuntData(projectId, project.ownerId);
      setData(loadedData);
      setGroupDrafts(buildGroupDrafts(loadedData.groups));
    } catch (loadError) {
      console.error("Failed to load pheno hunt data:", loadError);
      setError("Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [project.ownerId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const plantsByGroupId = useMemo(
    () =>
      data.plants.reduce<Record<string, PhysicalPlant[]>>(
        (plantsByGroup, plant) => {
          if (!plantsByGroup[plant.groupId]) {
            plantsByGroup[plant.groupId] = [];
          }

          plantsByGroup[plant.groupId].push(plant);
          return plantsByGroup;
        },
        {}
      ),
    [data.plants]
  );

  const phenotypesByGroupId = useMemo(
    () =>
      data.phenotypes.reduce<Record<string, Phenotype[]>>(
        (phenotypesByGroup, phenotype) => {
          if (!phenotypesByGroup[phenotype.groupId]) {
            phenotypesByGroup[phenotype.groupId] = [];
          }

          phenotypesByGroup[phenotype.groupId].push(phenotype);
          return phenotypesByGroup;
        },
        {}
      ),
    [data.phenotypes]
  );

  const phenotypesById = useMemo(
    () =>
      data.phenotypes.reduce<Record<string, Phenotype>>(
        (phenotypesByIdentifier, phenotype) => {
          if (phenotype.id) {
            phenotypesByIdentifier[phenotype.id] = phenotype;
          }

          return phenotypesByIdentifier;
        },
        {}
      ),
    [data.phenotypes]
  );

  const groupsById = useMemo(
    () =>
      data.groups.reduce<Record<string, PhenoComparisonGroup>>(
        (groupsByIdentifier, group) => {
          if (group.id) {
            groupsByIdentifier[group.id] = group;
          }

          return groupsByIdentifier;
        },
        {}
      ),
    [data.groups]
  );

  const stageEventsByPlantId = useMemo(
    () =>
      data.stageEvents.reduce<Record<string, PlantStageEvent[]>>(
        (eventsByPlant, event) => {
          if (!eventsByPlant[event.plantId]) {
            eventsByPlant[event.plantId] = [];
          }

          eventsByPlant[event.plantId].push(event);
          return eventsByPlant;
        },
        {}
      ),
    [data.stageEvents]
  );

  const evaluationsByPlantId = useMemo(
    () =>
      data.evaluations.reduce<Record<string, PlantEvaluation[]>>(
        (evaluationsByPlant, evaluation) => {
          if (!evaluationsByPlant[evaluation.plantId]) {
            evaluationsByPlant[evaluation.plantId] = [];
          }

          evaluationsByPlant[evaluation.plantId].push(evaluation);
          return evaluationsByPlant;
        },
        {}
      ),
    [data.evaluations]
  );

  const handleInitializeGroups = async () => {
    if (!projectId) {
      return;
    }

    setInitializing(true);
    setError(null);

    try {
      await initializePhenoGroupsFromProject(project);
      await loadData();
    } catch (initializeError) {
      console.error("Failed to initialize pheno groups:", initializeError);
      setError("Failed to create groups. Please try again.");
    } finally {
      setInitializing(false);
    }
  };

  const handleDraftChange = (
    groupId: string,
    field: keyof GroupDraft,
    value: string
  ) => {
    setGroupDrafts((currentDrafts) => ({
      ...currentDrafts,
      [groupId]: {
        ...currentDrafts[groupId],
        [field]: value,
      },
    }));
  };

  const handleSaveGroup = async (group: PhenoComparisonGroup) => {
    if (!group.id) {
      return;
    }

    const draft = groupDrafts[group.id];
    if (!draft) {
      return;
    }

    const plantedCount = parsePlantedCount(draft.plantedCount);
    if (plantedCount === null) {
      setError("Planted count must be a whole number at least 0.");
      return;
    }

    setSavingGroupId(group.id);
    setError(null);

    try {
      if (draft.name !== group.name || draft.notes !== (group.notes ?? "")) {
        await updatePhenoGroup(group.id, {
          name: draft.name.trim() || group.name,
          notes: draft.notes.trim(),
        });
      }

      if (plantedCount !== group.plantedCount) {
        await setPhenoGroupPlantedCount({
          group,
          ownerId: project.ownerId,
          plantedCount,
        });
      }

      await loadData();
      setEditingGroupIds((current) => ({
        ...current,
        [group.id!]: false,
      }));
    } catch (saveError) {
      console.error("Failed to save pheno group:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save comparison group. Please try again."
      );
    } finally {
      setSavingGroupId(null);
    }
  };

  const handleToggleGroupEditor = (group: PhenoComparisonGroup) => {
    if (!group.id) {
      return;
    }

    const isEditing = Boolean(editingGroupIds[group.id]);

    if (isEditing) {
      setGroupDrafts((current) => ({
        ...current,
        [group.id!]: {
          name: group.name,
          notes: group.notes ?? "",
          plantedCount: String(group.plantedCount),
        },
      }));
    }

    setEditingGroupIds((current) => ({
      ...current,
      [group.id!]: !isEditing,
    }));
  };

  const handleOpenPlant = (plant: PhysicalPlant) => {
    setSelectedPlant(plant);
    setPlantDraft({
      displayId: plant.displayId,
      lifecycleState: plant.lifecycleState,
      stageDate: todayLocalDateString(),
      stageNotes: "",
      photoIds: plant.photoIds ?? [],
    });
    setPlantOriginalPhotoIds(plant.photoIds ?? []);
    setSelectedEvaluationId(null);
    setDraftEvaluationNumber(null);
    setEvaluationDraft(null);
    setEvaluationEditMode(false);
    setEvaluationPhotoContextId(null);
    setEvaluationOriginalPhotoIds([]);
  };

  const handleClosePlant = async () => {
    if (savingPlant || savingEvaluation || savingFinalLabels) {
      return;
    }

    const newPhotoIds =
      plantDraft?.photoIds.filter(
        (photoId) => !plantOriginalPhotoIds.includes(photoId)
      ) ?? [];
    if (newPhotoIds.length > 0) {
      await deleteProjectPhotosByIds(newPhotoIds, project.ownerId).catch(
        (cleanupError) =>
          console.error("Failed to clean up draft plant photos:", cleanupError)
      );
    }

    setSelectedPlant(null);
    setPlantDraft(null);
    setPlantOriginalPhotoIds([]);
    setEvaluationDraft(null);
    setEvaluationEditMode(false);
    setSelectedEvaluationId(null);
    setDraftEvaluationNumber(null);
    setKeeperRemovalDraft(null);
  };

  const handlePlantDraftChange = <K extends keyof PlantDraft>(
    field: K,
    value: PlantDraft[K]
  ) => {
    setPlantDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft
    );
  };

  const handleSavePlant = async () => {
    if (!selectedPlant || !plantDraft) {
      return;
    }

    setSavingPlant(true);
    setError(null);

    try {
      await updatePhysicalPlant({
        plant: selectedPlant,
        displayId: plantDraft.displayId,
        lifecycleState: plantDraft.lifecycleState,
        stageDate: plantDraft.stageDate,
        stageNotes: plantDraft.stageNotes,
        photoIds: plantDraft.photoIds,
      });
      const removedPhotoIds = plantOriginalPhotoIds.filter(
        (photoId) => !plantDraft.photoIds.includes(photoId)
      );
      if (removedPhotoIds.length > 0) {
        await deleteProjectPhotosByIds(removedPhotoIds, project.ownerId);
      }
      if (
        project.status === "planning" &&
        selectedPlant.lifecycleState === "planned" &&
        plantDraft.lifecycleState !== "planned"
      ) {
        onProjectStatusChange?.("in_progress");
      }
      await loadData();
      setSelectedPlant({
        ...selectedPlant,
        displayId: plantDraft.displayId.trim(),
        lifecycleState: plantDraft.lifecycleState,
        photoIds: plantDraft.photoIds,
        hasUserData: true,
      });
      setPlantOriginalPhotoIds(plantDraft.photoIds);
      setPlantDraft({
        ...plantDraft,
        stageNotes: "",
      });
    } catch (saveError) {
      console.error("Failed to save plant:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save plant. Please try again."
      );
    } finally {
      setSavingPlant(false);
    }
  };

  const selectedPlantStageEvents =
    selectedPlant?.id ? stageEventsByPlantId[selectedPlant.id] ?? [] : [];
  const selectedPlantEvaluations =
    selectedPlant?.id ? evaluationsByPlantId[selectedPlant.id] ?? [] : [];
  const selectedPhenotype =
    selectedPlant?.phenotypeId
      ? phenotypesById[selectedPlant.phenotypeId]
      : undefined;
  const selectedPlantGroup =
    selectedPlant?.groupId ? groupsById[selectedPlant.groupId] : undefined;
  const selectedEvaluation = selectedEvaluationId
    ? selectedPlantEvaluations.find(
        (evaluation) => evaluation.id === selectedEvaluationId
      )
    : undefined;
  const floweringDays = calculateFloweringDays(selectedPlantStageEvents);

  useEffect(() => {
    if (!selectedPlant?.id) {
      return;
    }

    const refreshedPlant = data.plants.find(
      (plant) => plant.id === selectedPlant.id
    );

    if (refreshedPlant && refreshedPlant !== selectedPlant) {
      setSelectedPlant(refreshedPlant);
    }
  }, [data.plants, selectedPlant]);

  const handleSelectEvaluation = (evaluation: PlantEvaluation) => {
    setError(null);
    setSelectedEvaluationId(evaluation.id ?? null);
    setDraftEvaluationNumber(evaluation.weekNumber);
    setEvaluationDraft(buildEvaluationDraft(evaluation));
    setEvaluationEditMode(false);
    setEvaluationPhotoContextId(evaluation.id ?? null);
    setEvaluationOriginalPhotoIds(evaluation.photoIds ?? []);
  };

  const handleAddEvaluation = () => {
    const nextEvaluationNumber =
      Math.max(0, ...selectedPlantEvaluations.map((item) => item.weekNumber)) +
      1;

    setError(null);
    setSelectedEvaluationId(null);
    setDraftEvaluationNumber(nextEvaluationNumber);
    setEvaluationDraft(buildEvaluationDraft());
    setEvaluationEditMode(true);
    setEvaluationPhotoContextId(createProjectPhotoContextId());
    setEvaluationOriginalPhotoIds([]);
  };

  const handleCloseEvaluation = async () => {
    if (savingEvaluation) {
      return;
    }

    const newPhotoIds =
      evaluationDraft?.photoIds.filter(
        (photoId) => !evaluationOriginalPhotoIds.includes(photoId)
      ) ?? [];

    if (newPhotoIds.length > 0) {
      await deleteProjectPhotosByIds(
        newPhotoIds,
        project.ownerId
      ).catch((cleanupError) =>
        console.error("Failed to clean up draft evaluation photos:", cleanupError)
      );
    }

    setEvaluationDraft(null);
    setEvaluationEditMode(false);
    setEvaluationPhotoContextId(null);
    setEvaluationOriginalPhotoIds([]);
    setSelectedEvaluationId(null);
    setDraftEvaluationNumber(null);
  };

  const handleEvaluationDraftChange = <K extends keyof EvaluationDraft>(
    field: K,
    value: EvaluationDraft[K]
  ) => {
    setEvaluationDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft
    );
  };

  const handleSaveEvaluation = async () => {
    if (!selectedPlant || !evaluationDraft || !draftEvaluationNumber) {
      return;
    }

    const vigorScore = parseOptionalRating(evaluationDraft.vigorScore);
    const stretchScore = parseOptionalRating(evaluationDraft.stretchScore);
    const resinCoverageScore = parseOptionalRating(
      evaluationDraft.resinCoverageScore
    );

    if (
      vigorScore === null ||
      stretchScore === null ||
      resinCoverageScore === null
    ) {
      setError("Scores must be whole numbers from 1 to 5.");
      return;
    }

    setSavingEvaluation(true);
    setError(null);

    try {
      const savedEvaluationId = await savePlantEvaluation({
        evaluationId: selectedEvaluationId ?? undefined,
        plant: selectedPlant,
        weekNumber: draftEvaluationNumber,
        scheduledDate: evaluationDraft.actualDate,
        actualDate: evaluationDraft.actualDate,
        missed: false,
        vigorScore,
        structureTags: parseTags(evaluationDraft.structureTags),
        stretchScore,
        aromaTags: parseTags(evaluationDraft.aromaTags),
        flavorTags: parseTags(evaluationDraft.flavorTags),
        resinCoverageScore,
        resinCharacterTags: parseTags(evaluationDraft.resinCharacterTags),
        notes: evaluationDraft.notes,
        photoIds: evaluationDraft.photoIds,
      });
      const removedPhotoIds = evaluationOriginalPhotoIds.filter(
        (photoId) => !evaluationDraft.photoIds.includes(photoId)
      );
      if (
        evaluationPhotoContextId &&
        evaluationPhotoContextId !== savedEvaluationId
      ) {
        await reassignProjectPhotos(
          evaluationDraft.photoIds,
          savedEvaluationId
        );
      }
      if (removedPhotoIds.length > 0) {
        await deleteProjectPhotosByIds(removedPhotoIds, project.ownerId);
      }
      await loadData();
      setEvaluationDraft(null);
      setEvaluationEditMode(false);
      setEvaluationPhotoContextId(null);
      setEvaluationOriginalPhotoIds([]);
      setSelectedEvaluationId(null);
      setDraftEvaluationNumber(null);
    } catch (saveError) {
      console.error("Failed to save evaluation:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save evaluation. Please try again."
      );
    } finally {
      setSavingEvaluation(false);
    }
  };

  const saveFinalLabels = async (
    finalLabels: FinalLabel[],
    keeperRemovalCloneAction?: "delete" | "unlink"
  ) => {
    if (!selectedPlant || !selectedPhenotype || !selectedPlantGroup) {
      return;
    }

    setSavingFinalLabels(true);
    setError(null);

    try {
      await updatePhenotypeFinalLabels({
        project,
        group: selectedPlantGroup,
        phenotype: selectedPhenotype,
        plant: selectedPlant,
        finalLabels,
        keeperRemovalCloneAction,
      });
      await loadData();
      setKeeperRemovalDraft(null);
    } catch (saveError) {
      console.error("Failed to save final labels:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save final labels. Please try again."
      );
    } finally {
      setSavingFinalLabels(false);
    }
  };

  const handleToggleFinalLabel = (label: FinalLabel) => {
    if (!selectedPhenotype || savingFinalLabels || readOnly) {
      return;
    }

    const currentLabels = selectedPhenotype.finalLabels ?? [];
    const nextLabels = currentLabels.includes(label)
      ? currentLabels.filter((item) => item !== label)
      : [...currentLabels, label];

    if (
      label === "keeper" &&
      currentLabels.includes("keeper") &&
      selectedPhenotype.promotedCloneId
    ) {
      setKeeperRemovalDraft({ finalLabels: nextLabels });
      return;
    }

    void saveFinalLabels(nextLabels);
  };

  const plantMatchesFilters = (plant: PhysicalPlant) => {
    const normalizedSearch = plantSearch.trim().toLowerCase();
    if (
      normalizedSearch &&
      !plant.displayId.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }

    if (
      lifecycleFilter !== "all" &&
      plant.lifecycleState !== lifecycleFilter
    ) {
      return false;
    }

    if (finalLabelFilter === "all") {
      return true;
    }

    return Boolean(
      phenotypesById[plant.phenotypeId]?.finalLabels.includes(finalLabelFilter)
    );
  };

  const selectedEvaluationIndex = selectedEvaluation
    ? selectedPlantEvaluations.findIndex(
        (evaluation) => evaluation.id === selectedEvaluation.id
      )
    : -1;
  const evaluationDialogTitle =
    selectedEvaluationIndex >= 0
      ? `${evaluationEditMode ? "Edit " : ""}Evaluation ${
          selectedEvaluationIndex + 1
        }`
      : "Add Evaluation";

  return (
    <>
      <SectionCard
        title="Pheno Hunt Groups"
        description="Track and compare plants by genetic group."
        action={
          data.groups.length > 0 ? (
            <Chip
              label={`${data.groups.length} group${
                data.groups.length === 1 ? "" : "s"
              }`}
              size="small"
            />
          ) : undefined
        }
        contentPadding={2.5}
      >
        <Stack spacing={2}>
          <FilterBar>
            <TextField
              label="Search plants"
              value={plantSearch}
              onChange={(event) => setPlantSearch(event.target.value)}
              size="small"
              fullWidth
              sx={{ flex: { md: 1.4 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Lifecycle"
              value={lifecycleFilter}
              onChange={(event) =>
                setLifecycleFilter(event.target.value as LifecycleFilter)
              }
              size="small"
              select
              sx={{ flex: 1 }}
            >
              <MenuItem value="all">All stages</MenuItem>
              {Object.entries(PLANT_LIFECYCLE_STATE_LABELS).map(
                ([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                )
              )}
            </TextField>
            <TextField
              label="Final label"
              value={finalLabelFilter}
              onChange={(event) =>
                setFinalLabelFilter(event.target.value as FinalLabelFilter)
              }
              size="small"
              select
              sx={{ flex: 1 }}
            >
              <MenuItem value="all">All labels</MenuItem>
              {FINAL_LABEL_OPTIONS.map((label) => (
                <MenuItem key={label} value={label}>
                  {FINAL_LABEL_LABELS[label]}
                </MenuItem>
              ))}
            </TextField>
            {(plantSearch ||
              lifecycleFilter !== "all" ||
              finalLabelFilter !== "all") && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setPlantSearch("");
                  setLifecycleFilter("all");
                  setFinalLabelFilter("all");
                }}
                sx={{
                  alignSelf: { xs: "stretch", md: "center" },
                  minHeight: 44,
                  flexShrink: 0,
                }}
              >
                Clear filters
              </Button>
            )}
          </FilterBar>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Typography color="text.secondary" variant="body2">
              Loading groups...
            </Typography>
          ) : data.groups.length === 0 ? (
            <Stack spacing={2} alignItems="flex-start">
              <Typography color="text.secondary" variant="body2">
                No groups yet.
              </Typography>
              <Button
                variant="contained"
                onClick={handleInitializeGroups}
                disabled={
                  readOnly ||
                  initializing ||
                  project.sourceSnapshots.length === 0
                }
              >
                {initializing ? "Creating..." : "Create Groups"}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {data.groups.map((group, index) => {
                const groupId = group.id ?? "";
                const draft = groupDrafts[groupId];
                const plants = plantsByGroupId[groupId] ?? [];
                const visiblePlants = plants.filter(plantMatchesFilters);
                const plantDisplayLimit = plantDisplayLimits[groupId] ?? 30;
                const displayedPlants = visiblePlants.slice(
                  0,
                  plantDisplayLimit
                );
                const phenotypes = phenotypesByGroupId[groupId] ?? [];
                const germinatedCount = countPlantsByState(
                  plants,
                  GERMINATED_STATES
                );
                const activeCount = countPlantsByState(plants, ACTIVE_STATES);
                const isEditingGroup = Boolean(editingGroupIds[groupId]);

                return (
                  <Box
                    key={groupId}
                    sx={(theme) => ({
                      pt: index === 0 ? 0 : 2,
                      borderTop:
                        index === 0
                          ? "none"
                          : `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-start"
                          justifyContent="space-between"
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              color="text.secondary"
                              variant="overline"
                            >
                              Group {index + 1}
                            </Typography>
                            <Typography
                              fontWeight={750}
                              lineHeight={1.25}
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {group.name}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="caption"
                            >
                              {group.sourceSnapshotIds.length}{" "}
                              {group.sourceSnapshotIds.length === 1
                                ? "source"
                                : "sources"}{" "}
                              - {phenotypes.length}{" "}
                              {phenotypes.length === 1
                                ? "phenotype"
                                : "phenotypes"}
                            </Typography>
                          </Box>
                          {!readOnly && (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<EditOutlinedIcon />}
                              onClick={() => handleToggleGroupEditor(group)}
                              sx={{ flexShrink: 0, minHeight: 44 }}
                            >
                              {isEditingGroup ? "Cancel" : "Edit"}
                            </Button>
                          )}
                        </Stack>

                        <Box
                          sx={(theme) => ({
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            gap: 1,
                            py: 1.25,
                            borderTop: `1px solid ${theme.palette.divider}`,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          })}
                        >
                          {[
                            ["Planted", plants.length],
                            ["Germinated", germinatedCount],
                            ["Active", activeCount],
                          ].map(([label, value]) => (
                            <Box key={label} sx={{ minWidth: 0 }}>
                              <Typography
                                fontWeight={750}
                                sx={{ fontVariantNumeric: "tabular-nums" }}
                              >
                                {value}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                variant="caption"
                              >
                                {label}
                              </Typography>
                            </Box>
                          ))}
                        </Box>

                        {draft && isEditingGroup && (
                          <Stack spacing={1.5}>
                            <Typography fontWeight={700} variant="body2">
                              Group settings
                            </Typography>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.5}
                            >
                              <TextField
                                label="Name"
                                value={draft.name}
                                onChange={(event) =>
                                  handleDraftChange(
                                    groupId,
                                    "name",
                                    event.target.value
                                  )
                                }
                                disabled={readOnly}
                                size="small"
                                fullWidth
                              />
                              <TextField
                                label="Seeds planted"
                                type="number"
                                value={draft.plantedCount}
                                onChange={(event) =>
                                  handleDraftChange(
                                    groupId,
                                    "plantedCount",
                                    event.target.value
                                  )
                                }
                                disabled={readOnly}
                                inputProps={{ min: 0, step: 1 }}
                                size="small"
                                sx={{ minWidth: { sm: 180 } }}
                              />
                            </Stack>
                            <TextField
                              label="Notes"
                              value={draft.notes}
                              onChange={(event) =>
                                handleDraftChange(
                                  groupId,
                                  "notes",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                              multiline
                              minRows={2}
                            />
                            <Button
                              variant="outlined"
                              onClick={() => handleSaveGroup(group)}
                              disabled={
                                readOnly || savingGroupId === groupId
                              }
                              sx={{ alignSelf: "flex-start" }}
                            >
                              {savingGroupId === groupId
                                ? "Saving..."
                                : "Save Group"}
                            </Button>
                          </Stack>
                        )}

                        {plants.length > 0 ? (
                          <Stack spacing={1}>
                            <Stack
                              direction="row"
                              alignItems="baseline"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography fontWeight={700} variant="body2">
                                Plants
                              </Typography>
                              <Typography
                                color="text.secondary"
                                variant="caption"
                                sx={{ textAlign: "right" }}
                              >
                                {visiblePlants.length} matching -{" "}
                                {displayedPlants.length} shown
                              </Typography>
                            </Stack>
                            {visiblePlants.length > 0 ? (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "minmax(0, 1fr)",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    lg: "repeat(3, minmax(0, 1fr))",
                                  },
                                  gap: 0.75,
                                  minWidth: 0,
                                }}
                              >
                                {displayedPlants.map((plant) => {
                                  const finalLabels =
                                    (plant.phenotypeId &&
                                      phenotypesById[plant.phenotypeId]
                                        ?.finalLabels) ||
                                    [];

                                  return (
                                    <ButtonBase
                                      key={plant.id}
                                      onClick={() => handleOpenPlant(plant)}
                                      aria-label={`Edit ${plant.displayId}`}
                                      sx={(theme) => ({
                                        width: "100%",
                                        minWidth: 0,
                                        minHeight: 48,
                                        px: 1.25,
                                        py: 0.75,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        textAlign: "left",
                                        justifyContent: "stretch",
                                        bgcolor: theme.palette.surface.subtle,
                                        overflow: "hidden",
                                        "&:hover": {
                                          bgcolor: theme.palette.action.hover,
                                        },
                                      })}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{ width: "100%", minWidth: 0 }}
                                      >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography
                                            fontWeight={650}
                                            variant="body2"
                                            noWrap
                                          >
                                            {plant.displayId}
                                          </Typography>
                                          {finalLabels.length > 0 && (
                                            <Typography
                                              color="text.secondary"
                                              variant="caption"
                                              noWrap
                                              sx={{ display: "block" }}
                                            >
                                              {finalLabels
                                                .map(
                                                  (label) =>
                                                    FINAL_LABEL_LABELS[label]
                                                )
                                                .join(" - ")}
                                            </Typography>
                                          )}
                                        </Box>
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          spacing={0.75}
                                          sx={{
                                            flexShrink: 0,
                                            maxWidth: "48%",
                                          }}
                                        >
                                          <Box
                                            aria-hidden="true"
                                            sx={{
                                              width: 7,
                                              height: 7,
                                              flexShrink: 0,
                                              borderRadius: "50%",
                                              bgcolor: lifecycleTone(
                                                plant.lifecycleState
                                              ),
                                            }}
                                          />
                                          <Typography
                                            color="text.secondary"
                                            variant="caption"
                                            noWrap
                                          >
                                            {
                                              PLANT_LIFECYCLE_STATE_LABELS[
                                                plant.lifecycleState
                                              ]
                                            }
                                          </Typography>
                                          <KeyboardArrowRightRoundedIcon
                                            color="action"
                                            fontSize="small"
                                            sx={{ flexShrink: 0 }}
                                          />
                                        </Stack>
                                      </Stack>
                                    </ButtonBase>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                No plants match the selected filters.
                              </Typography>
                            )}
                            {displayedPlants.length <
                              visiblePlants.length && (
                              <Button
                                variant="text"
                                onClick={() =>
                                  setPlantDisplayLimits((current) => ({
                                    ...current,
                                    [groupId]: plantDisplayLimit + 30,
                                  }))
                                }
                                sx={{ alignSelf: "center" }}
                              >
                                Show{" "}
                                {Math.min(
                                  30,
                                  visiblePlants.length -
                                    displayedPlants.length
                                )}{" "}
                                more
                              </Button>
                            )}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary" variant="body2">
                            Set seeds planted and save to generate plants.
                          </Typography>
                        )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </SectionCard>

      <ResponsiveDialog
        open={Boolean(selectedPlant && plantDraft)}
        onClose={handleClosePlant}
        maxWidth="sm"
        title="Edit Plant"
        actions={
          <>
            <Button onClick={handleClosePlant} disabled={savingPlant}>
              Close
            </Button>
            {!readOnly && (
              <Button
                variant="contained"
                onClick={handleSavePlant}
                disabled={savingPlant}
              >
                {savingPlant ? "Saving..." : "Save Plant"}
              </Button>
            )}
          </>
        }
      >
        {selectedPlant && plantDraft && (
          <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Plant ID"
                value={plantDraft.displayId}
                onChange={(event) =>
                  handlePlantDraftChange("displayId", event.target.value)
                }
                disabled={readOnly}
                fullWidth
              />
              <TextField
                label="Lifecycle"
                value={plantDraft.lifecycleState}
                onChange={(event) =>
                  handlePlantDraftChange(
                    "lifecycleState",
                    event.target.value as PlantLifecycleState
                  )
                }
                disabled={readOnly}
                select
                fullWidth
              >
                {Object.entries(PLANT_LIFECYCLE_STATE_LABELS).map(
                  ([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>
              <TextField
                label="Lifecycle date"
                type="date"
                value={plantDraft.stageDate}
                onChange={(event) =>
                  handlePlantDraftChange("stageDate", event.target.value)
                }
                disabled={readOnly}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Lifecycle notes"
                value={plantDraft.stageNotes}
                onChange={(event) =>
                  handlePlantDraftChange("stageNotes", event.target.value)
                }
                disabled={readOnly}
                fullWidth
                multiline
                minRows={2}
              />

              {projectId && selectedPlant.id && (
                <ProjectPhotoUploader
                  ownerId={project.ownerId}
                  projectId={projectId}
                  contextType="plant"
                  contextId={selectedPlant.id}
                  photoIds={plantDraft.photoIds}
                  onChange={(photoIds) =>
                    handlePlantDraftChange("photoIds", photoIds)
                  }
                  readOnly={readOnly}
                  deferDeletePhotoIds={plantOriginalPhotoIds}
                />
              )}

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  Final Labels
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {FINAL_LABEL_OPTIONS.map((label) => {
                    const selected = Boolean(
                      selectedPhenotype?.finalLabels.includes(label)
                    );

                    return (
                      <Chip
                        key={label}
                        label={FINAL_LABEL_LABELS[label]}
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() => handleToggleFinalLabel(label)}
                        disabled={readOnly || savingFinalLabels}
                      />
                    );
                  })}
                </Stack>
                {selectedPhenotype?.promotedCloneId && (
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Promoted clone created from this phenotype.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  Stage History
                </Typography>
                {selectedPlantStageEvents.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No stage history yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {selectedPlantStageEvents.map((event) => (
                      <Box key={event.id}>
                        <Typography variant="body2">
                          {formatProjectDate(event.date)} -{" "}
                          {PLANT_LIFECYCLE_STATE_LABELS[event.state]}
                        </Typography>
                        {event.notes && (
                          <Typography color="text.secondary" variant="body2">
                            {event.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography fontWeight={700} gutterBottom>
                  Evaluations
                </Typography>
                <Stack spacing={2}>
                  <Stack spacing={1}>
                    {selectedPlantEvaluations.map((evaluation, index) => (
                      <Card
                        key={evaluation.id ?? evaluation.weekNumber}
                        variant="outlined"
                        onClick={() => handleSelectEvaluation(evaluation)}
                        sx={{
                          cursor: "pointer",
                          borderColor:
                            selectedEvaluationId === evaluation.id
                              ? "primary.main"
                              : undefined,
                        }}
                      >
                        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                          >
                            <Typography fontWeight={700}>
                              Evaluation {index + 1}
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                              {formatProjectDate(
                                evaluation.actualDate ??
                                  evaluation.scheduledDate
                              )}
                            </Typography>
                          </Stack>
                          <Typography color="text.secondary" variant="body2">
                            {[
                              evaluation.vigorScore
                                ? `Vigor ${evaluation.vigorScore}`
                                : null,
                              evaluation.stretchScore
                                ? `Stretch ${evaluation.stretchScore}`
                                : null,
                              evaluation.resinCoverageScore
                                ? `Resin ${evaluation.resinCoverageScore}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" - ") || "No scores"}
                          </Typography>
                          {evaluation.notes && (
                            <Typography variant="body2">
                              {evaluation.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  {!readOnly && (
                    <Button
                      variant="outlined"
                      onClick={handleAddEvaluation}
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Add Evaluation
                    </Button>
                  )}

                  {floweringDays !== null &&
                    plantDraft.lifecycleState === "flowering" && (
                      <Typography color="text.secondary" variant="body2">
                        Flowering day {floweringDays}
                      </Typography>
                    )}

                  {selectedPlantEvaluations.length === 0 && (
                    <Typography color="text.secondary" variant="body2">
                      No evaluations yet.
                    </Typography>
                  )}
                </Stack>
              </Box>
          </Stack>
        )}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(keeperRemovalDraft)}
        onClose={() => {
          if (!savingFinalLabels) {
            setKeeperRemovalDraft(null);
          }
        }}
        maxWidth="sm"
        title="Remove Keeper Label?"
        actions={
          <>
            <Button
              onClick={() => setKeeperRemovalDraft(null)}
              disabled={savingFinalLabels}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                keeperRemovalDraft &&
                saveFinalLabels(keeperRemovalDraft.finalLabels, "unlink")
              }
              disabled={savingFinalLabels}
            >
              Keep Clone
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() =>
                keeperRemovalDraft &&
                saveFinalLabels(keeperRemovalDraft.finalLabels, "delete")
              }
              disabled={savingFinalLabels}
            >
              Delete Clone
            </Button>
          </>
        }
      >
        <Typography color="text.secondary">
          This phenotype already created a clone-library entry. Choose what
          should happen to that clone before removing Keeper.
        </Typography>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(selectedPlant && evaluationDraft)}
        onClose={handleCloseEvaluation}
        maxWidth="sm"
        title={evaluationDialogTitle}
        actions={
          <>
            <Button onClick={handleCloseEvaluation} disabled={savingEvaluation}>
              Close
            </Button>
            {!readOnly && !evaluationEditMode && selectedEvaluation && (
              <Button
                variant="outlined"
                onClick={() => setEvaluationEditMode(true)}
              >
                Edit
              </Button>
            )}
            {!readOnly && evaluationEditMode && (
              <Button
                variant="contained"
                onClick={handleSaveEvaluation}
                disabled={savingEvaluation}
              >
                {savingEvaluation ? "Saving..." : "Save Evaluation"}
              </Button>
            )}
          </>
        }
      >
        {selectedPlant && evaluationDraft && (
          <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  {selectedPlant.displayId}
                </Typography>
                {floweringDays !== null &&
                  plantDraft?.lifecycleState === "flowering" && (
                    <Typography color="text.secondary" variant="body2">
                      Flowering day {floweringDays}
                    </Typography>
                  )}
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              {!evaluationEditMode && selectedEvaluation ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">
                      Evaluation date
                    </Typography>
                    <Typography>
                      {formatProjectDate(
                        selectedEvaluation.actualDate ??
                          selectedEvaluation.scheduledDate
                      )}
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    {[
                      ["Vigor", selectedEvaluation.vigorScore],
                      ["Stretch", selectedEvaluation.stretchScore],
                      ["Resin", selectedEvaluation.resinCoverageScore],
                    ].map(([label, score]) => (
                      <Box key={label} sx={{ flex: 1 }}>
                        <Typography color="text.secondary" variant="caption">
                          {label}
                        </Typography>
                        <Typography>
                          {score ? `${score}/5` : "Not recorded"}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  {[
                    ["Structure", selectedEvaluation.structureTags],
                    ["Aroma", selectedEvaluation.aromaTags],
                    ["Flavor", selectedEvaluation.flavorTags],
                    ["Resin character", selectedEvaluation.resinCharacterTags],
                  ].map(([label, tags]) => (
                    <Box key={label}>
                      <Typography color="text.secondary" variant="caption">
                        {label}
                      </Typography>
                      {Array.isArray(tags) && tags.length > 0 ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 0.5 }}
                        >
                          {tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                          ))}
                        </Stack>
                      ) : (
                        <Typography>Not recorded</Typography>
                      )}
                    </Box>
                  ))}

                  <Box>
                    <Typography color="text.secondary" variant="caption">
                      Notes
                    </Typography>
                    <Typography whiteSpace="pre-wrap">
                      {selectedEvaluation.notes || "Not recorded"}
                    </Typography>
                  </Box>

                  {projectId && selectedEvaluation.id && (
                    <ProjectPhotoUploader
                      ownerId={project.ownerId}
                      projectId={projectId}
                      contextType="evaluation"
                      contextId={selectedEvaluation.id}
                      photoIds={selectedEvaluation.photoIds ?? []}
                      onChange={() => undefined}
                      readOnly
                    />
                  )}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <TextField
                    label="Evaluation date"
                    type="date"
                    value={evaluationDraft.actualDate}
                    onChange={(event) =>
                      handleEvaluationDraftChange(
                        "actualDate",
                        event.target.value
                      )
                    }
                    disabled={readOnly}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Vigor"
                      value={evaluationDraft.vigorScore}
                      onChange={(event) =>
                        handleEvaluationDraftChange(
                          "vigorScore",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      <MenuItem value="">Skip</MenuItem>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <MenuItem key={score} value={String(score)}>
                          {score}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Stretch"
                      value={evaluationDraft.stretchScore}
                      onChange={(event) =>
                        handleEvaluationDraftChange(
                          "stretchScore",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      <MenuItem value="">Skip</MenuItem>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <MenuItem key={score} value={String(score)}>
                          {score}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Resin"
                      value={evaluationDraft.resinCoverageScore}
                      onChange={(event) =>
                        handleEvaluationDraftChange(
                          "resinCoverageScore",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      <MenuItem value="">Skip</MenuItem>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <MenuItem key={score} value={String(score)}>
                          {score}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <TextField
                    label="Structure tags"
                    value={evaluationDraft.structureTags}
                    onChange={(event) =>
                      handleEvaluationDraftChange(
                        "structureTags",
                        event.target.value
                      )
                    }
                    disabled={readOnly}
                    fullWidth
                    placeholder="Comma separated"
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Aroma tags"
                      value={evaluationDraft.aromaTags}
                      onChange={(event) =>
                        handleEvaluationDraftChange(
                          "aromaTags",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      fullWidth
                      placeholder="Comma separated"
                    />
                    <TextField
                      label="Flavor tags"
                      value={evaluationDraft.flavorTags}
                      onChange={(event) =>
                        handleEvaluationDraftChange(
                          "flavorTags",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      fullWidth
                      placeholder="Comma separated"
                    />
                  </Stack>
                  <TextField
                    label="Resin character"
                    value={evaluationDraft.resinCharacterTags}
                    onChange={(event) =>
                      handleEvaluationDraftChange(
                        "resinCharacterTags",
                        event.target.value
                      )
                    }
                    disabled={readOnly}
                    fullWidth
                    placeholder="Comma separated"
                  />
                  <TextField
                    label="Notes"
                    value={evaluationDraft.notes}
                    onChange={(event) =>
                      handleEvaluationDraftChange("notes", event.target.value)
                    }
                    disabled={readOnly}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  {projectId && evaluationPhotoContextId && (
                    <ProjectPhotoUploader
                      ownerId={project.ownerId}
                      projectId={projectId}
                      contextType="evaluation"
                      contextId={evaluationPhotoContextId}
                      photoIds={evaluationDraft.photoIds}
                      onChange={(photoIds) =>
                        handleEvaluationDraftChange("photoIds", photoIds)
                      }
                      readOnly={readOnly}
                      deferDeletePhotoIds={evaluationOriginalPhotoIds}
                    />
                  )}
                </Stack>
              )}
          </Stack>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default PhenoHuntSetup;
