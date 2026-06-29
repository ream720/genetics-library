import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectPhotoUploader from "../v2/ProjectPhotoUploader";
import { formatProjectDate, todayLocalDateString } from "../../lib/v2/date";
import {
  getWashProcessData,
  makeAdHocWashSource,
  saveWashRun,
  saveWashSession,
  type MicronFractionInput,
  type PressRecordInput,
  type WashCycleInput,
  type WashProcessData,
} from "../../services/washProjects";
import {
  createProjectPhotoContextId,
  deleteProjectPhotosByIds,
  reassignProjectPhotos,
} from "../../services/projectPhotos";
import {
  DryHashWeightSource,
  MaterialType,
  MicronFraction,
  PressRecord,
  ProjectBase,
  QualityStars,
  WashCycle,
  WashRun,
  WashRunStage,
  WashRunType,
  WashSession,
  WashSource,
} from "../../types/v2";
import { ResponsiveDialog, SectionCard } from "../ui";

interface WashProcessSetupProps {
  project: ProjectBase;
  readOnly: boolean;
}

interface SessionDraft {
  date: string;
  name: string;
  notes: string;
  photoIds: string[];
}

interface RunDraft {
  sessionId: string;
  runType: WashRunType;
  stage: WashRunStage;
  cultivarGroupName: string;
  materialType: MaterialType;
  inputWeightGrams: string;
  sourceLines: string;
  plannedMicronRangesText: string;
  iceless: string;
  selectedDryHashWeightSource: DryHashWeightSource;
  manualDryHashWeightGrams: string;
  micronFractionsText: string;
  cyclesText: string;
  resinCharacterTags: string;
  appearance: string;
  qualityStars: string;
  notes: string;
  photoIds: string[];
  pressHashInputWeightGrams: string;
  pressRosinOutputWeightGrams: string;
  pressTemperature: string;
  pressDuration: string;
  pressure: string;
  bagMicron: string;
  pressNotes: string;
  pressPhotoIds: string[];
}

const emptyData: WashProcessData = {
  sessions: [],
  runs: [],
  cycles: [],
  micronFractions: [],
  pressRecords: [],
};

const WASH_RUN_TYPE_LABELS: Record<WashRunType, string> = {
  pheno_specific: "Pheno Specific",
  mixed_pheno: "Mixed Pheno",
  mixed_cultivar: "Mixed Cultivar",
};

const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  fresh_frozen: "Fresh Frozen",
  dried: "Dried",
  cured: "Cured",
};

const WASH_RUN_STAGE_LABELS: Record<WashRunStage, string> = {
  setup: "Setup",
  washing: "Washing",
  drying: "Drying",
  pressed: "Pressed",
  complete: "Complete",
};

const getWashRunStageChipSx = (stage: WashRunStage) => (theme: Theme) => {
  const stageColor: Record<WashRunStage, string> = {
    setup: theme.palette.text.secondary,
    washing: theme.palette.primary.main,
    drying: theme.palette.warning.main,
    pressed: theme.palette.secondary.main,
    complete: theme.palette.success.main,
  };
  const color = stageColor[stage];
  const outlined = stage === "setup";

  return {
    fontWeight: 800,
    color: outlined ? color : theme.palette.getContrastText(color),
    bgcolor: outlined ? alpha(color, 0.08) : color,
    borderColor: alpha(color, outlined ? 0.7 : 0.9),
    boxShadow: outlined ? "none" : `0 0 0 1px ${alpha(color, 0.18)}`,
  };
};

const WASH_RUN_STAGE_ORDER: WashRunStage[] = [
  "setup",
  "washing",
  "drying",
  "pressed",
  "complete",
];

const NEXT_STAGE_ACTION_LABELS: Partial<Record<WashRunStage, string>> = {
  setup: "Proceed to Washing",
  washing: "Proceed to Drying",
  drying: "Proceed to Pressing",
  pressed: "Complete Run",
};

const DRY_HASH_SOURCE_LABELS: Record<DryHashWeightSource, string> = {
  fraction_sum: "Add up the micron fraction yields",
  manual: "Enter one total dry hash weight",
};

const WASH_CYCLE_STAGES = new Set<WashRunStage>([
  "washing",
  "drying",
  "pressed",
  "complete",
]);

const DRY_RESULT_STAGES = new Set<WashRunStage>([
  "drying",
  "pressed",
  "complete",
]);

const PRESS_RESULT_STAGES = new Set<WashRunStage>(["pressed", "complete"]);

const formatPercent = (value?: number) =>
  value === undefined || !Number.isFinite(value)
    ? "Not calculated"
    : `${value.toFixed(2)}%`;

const formatWeight = (value?: number) =>
  value === undefined ? "Not recorded" : `${value} g`;

const formatTags = (tags?: string[]) => tags?.join(", ") ?? "";

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const parsePlannedMicronRanges = (value: string) =>
  value
    .split(/[\n,]/)
    .map((range) => range.trim())
    .filter(Boolean);

const formatPlannedMicronRanges = (ranges?: string[]) =>
  ranges?.join("\n") ?? "";

const buildDryYieldRowsFromPlannedRanges = (rangesText: string) =>
  parsePlannedMicronRanges(rangesText)
    .map((range) => `${range} | `)
    .join("\n");

const parseOptionalNumber = (
  value: string,
  fieldName: string,
  errors: string[]
): number | undefined => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    errors.push(`${fieldName} must be a number at least 0.`);
    return undefined;
  }

  return parsedValue;
};

const parseQualityStars = (
  value: string,
  errors: string[]
): QualityStars | undefined => {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 6) {
    errors.push("Quality must be a whole number from 1 to 6.");
    return undefined;
  }

  return parsedValue as QualityStars;
};

const parseSourceLines = (value: string, errors: string[]): WashSource[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      const startingWeightGrams = parseOptionalNumber(
        parts[2] ?? "",
        `Source ${index + 1} starting weight`,
        errors
      );
      const proportionPercent = parseOptionalNumber(
        parts[3] ?? "",
        `Source ${index + 1} proportion`,
        errors
      );

      return makeAdHocWashSource({
        breeder: parts.length > 1 ? parts[0] : undefined,
        strain: parts.length > 1 ? parts[1] : parts[0],
        startingWeightGrams,
        proportionPercent,
      });
    });

const sourceLinesFromProject = (project: ProjectBase) =>
  project.sourceSnapshots
    .map((source) => `${source.breeder} | ${source.strain}`)
    .join("\n");

const formatSourceLines = (sources: WashSource[]) =>
  sources
    .map((source) =>
      [
        source.breeder ?? source.snapshot?.breeder ?? "",
        source.strain ?? source.snapshot?.strain ?? "",
        source.startingWeightGrams ?? "",
        source.proportionPercent ?? "",
      ]
        .join(" | ")
        .replace(/( \| )+$/g, "")
    )
    .join("\n");

const parseFractionLines = (
  value: string,
  errors: string[]
): MicronFractionInput[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<MicronFractionInput[]>((fractions, line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      const label = parts[0];
      const dryWeightText = parts[1] ?? "";

      if (!label) {
        errors.push(`Micron fraction ${index + 1} needs a label.`);
        return fractions;
      }

      if (!dryWeightText) {
        return fractions;
      }

      const dryWeightGrams = parseOptionalNumber(
        dryWeightText,
        `Micron fraction ${index + 1}`,
        errors
      );

      if (dryWeightGrams === undefined) {
        return fractions;
      }

      fractions.push({
        label,
        dryWeightGrams,
      });
      return fractions;
    }, []);

const formatFractionLines = (fractions: MicronFraction[]) =>
  fractions
    .map((fraction) => `${fraction.label} | ${fraction.dryWeightGrams}`)
    .join("\n");

const parseCycleLines = (value: string, errors: string[]): WashCycleInput[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      const durationMinutes = parseOptionalNumber(
        parts[0] ?? "",
        `Cycle ${index + 1} duration`,
        errors
      );

      return {
        durationMinutes,
        temperature: parts[1],
        notes: parts[2],
      };
    });

const formatCycleLines = (cycles: WashCycle[]) =>
  cycles
    .map((cycle) =>
      [cycle.durationMinutes ?? "", cycle.temperature ?? "", cycle.notes ?? ""]
        .join(" | ")
        .replace(/( \| )+$/g, "")
    )
    .join("\n");

const buildSessionDraft = (session?: WashSession): SessionDraft => ({
  date: session?.date ?? todayLocalDateString(),
  name: session?.name ?? "",
  notes: session?.notes ?? "",
  photoIds: session?.photoIds ?? [],
});

const buildRunDraft = ({
  project,
  sessionId,
  run,
  cycles,
  fractions,
  pressRecord,
}: {
  project: ProjectBase;
  sessionId: string;
  run?: WashRun;
  cycles: WashCycle[];
  fractions: MicronFraction[];
  pressRecord?: PressRecord;
}): RunDraft => ({
  sessionId,
  runType: run?.runType ?? "pheno_specific",
  stage: run?.stage ?? "setup",
  cultivarGroupName: run?.cultivarGroupName ?? "",
  materialType: run?.materialType ?? "fresh_frozen",
  inputWeightGrams: run?.inputWeightGrams ? String(run.inputWeightGrams) : "",
  sourceLines: run ? formatSourceLines(run.sources) : sourceLinesFromProject(project),
  plannedMicronRangesText: formatPlannedMicronRanges(
    run?.plannedMicronRanges
  ),
  iceless: run?.iceless ? "yes" : "no",
  selectedDryHashWeightSource: run?.selectedDryHashWeightSource ?? "fraction_sum",
  manualDryHashWeightGrams: run?.manualDryHashWeightGrams
    ? String(run.manualDryHashWeightGrams)
    : "",
  micronFractionsText: formatFractionLines(fractions),
  cyclesText: formatCycleLines(cycles),
  resinCharacterTags: formatTags(run?.resinCharacterTags),
  appearance: run?.appearance ?? "",
  qualityStars: run?.qualityStars ? String(run.qualityStars) : "",
  notes: run?.notes ?? "",
  photoIds: run?.photoIds ?? [],
  pressHashInputWeightGrams: pressRecord?.hashInputWeightGrams
    ? String(pressRecord.hashInputWeightGrams)
    : "",
  pressRosinOutputWeightGrams: pressRecord?.rosinOutputWeightGrams
    ? String(pressRecord.rosinOutputWeightGrams)
    : "",
  pressTemperature: pressRecord?.pressTemperature ?? "",
  pressDuration: pressRecord?.pressDuration ?? "",
  pressure: pressRecord?.pressure ?? "",
  bagMicron: pressRecord?.bagMicron ?? "",
  pressNotes: pressRecord?.notes ?? "",
  pressPhotoIds: pressRecord?.photoIds ?? [],
});

const getNextWashRunStage = (stage: WashRunStage) => {
  const stageIndex = WASH_RUN_STAGE_ORDER.indexOf(stage);
  return stageIndex >= 0
    ? WASH_RUN_STAGE_ORDER[stageIndex + 1]
    : undefined;
};

const seedDryYieldRowsIfNeeded = (draft: RunDraft): RunDraft => {
  if (!DRY_RESULT_STAGES.has(draft.stage) || draft.micronFractionsText.trim()) {
    return draft;
  }

  return {
    ...draft,
    micronFractionsText: buildDryYieldRowsFromPlannedRanges(
      draft.plannedMicronRangesText
    ),
  };
};

const WashProcessSetup: React.FC<WashProcessSetupProps> = ({
  project,
  readOnly,
}) => {
  const [data, setData] = useState<WashProcessData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [savingRun, setSavingRun] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [selectedSession, setSelectedSession] = useState<WashSession | null>(
    null
  );
  const [sessionPhotoContextId, setSessionPhotoContextId] = useState<
    string | null
  >(null);
  const [sessionOriginalPhotoIds, setSessionOriginalPhotoIds] = useState<
    string[]
  >([]);
  const [runDraft, setRunDraft] = useState<RunDraft | null>(null);
  const [selectedRun, setSelectedRun] = useState<WashRun | null>(null);
  const [runEditMode, setRunEditMode] = useState(false);
  const [runPhotoContextId, setRunPhotoContextId] = useState<string | null>(
    null
  );
  const [runOriginalPhotoIds, setRunOriginalPhotoIds] = useState<string[]>([]);
  const [pressOriginalPhotoIds, setPressOriginalPhotoIds] = useState<string[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  const projectId = project.id;

  const loadData = useCallback(async (): Promise<WashProcessData | null> => {
    if (!projectId) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedData = await getWashProcessData(projectId, project.ownerId);
      setData(loadedData);
      return loadedData;
    } catch (loadError) {
      console.error("Failed to load wash data:", loadError);
      setError("Failed to load wash sessions. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [project.ownerId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runsBySessionId = useMemo(
    () =>
      data.runs.reduce<Record<string, WashRun[]>>((runsBySession, run) => {
        if (!runsBySession[run.sessionId]) {
          runsBySession[run.sessionId] = [];
        }

        runsBySession[run.sessionId].push(run);
        return runsBySession;
      }, {}),
    [data.runs]
  );

  const cyclesByRunId = useMemo(
    () =>
      data.cycles.reduce<Record<string, WashCycle[]>>((cyclesByRun, cycle) => {
        if (!cyclesByRun[cycle.runId]) {
          cyclesByRun[cycle.runId] = [];
        }

        cyclesByRun[cycle.runId].push(cycle);
        return cyclesByRun;
      }, {}),
    [data.cycles]
  );

  const fractionsByRunId = useMemo(
    () =>
      data.micronFractions.reduce<Record<string, MicronFraction[]>>(
        (fractionsByRun, fraction) => {
          if (!fractionsByRun[fraction.runId]) {
            fractionsByRun[fraction.runId] = [];
          }

          fractionsByRun[fraction.runId].push(fraction);
          return fractionsByRun;
        },
        {}
      ),
    [data.micronFractions]
  );

  const pressRecordByRunId = useMemo(
    () =>
      data.pressRecords.reduce<Record<string, PressRecord>>(
        (pressRecordsByRun, pressRecord) => {
          pressRecordsByRun[pressRecord.runId] = pressRecord;
          return pressRecordsByRun;
        },
        {}
      ),
    [data.pressRecords]
  );

  const handleSessionDraftChange = <K extends keyof SessionDraft>(
    field: K,
    value: SessionDraft[K]
  ) => {
    setSessionDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft
    );
  };

  const handleRunDraftChange = <K extends keyof RunDraft>(
    field: K,
    value: RunDraft[K]
  ) => {
    setRunDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft
    );
  };

  const handleRunStageChange = (stage: WashRunStage) => {
    setRunDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const shouldSeedDryYields =
        DRY_RESULT_STAGES.has(stage) &&
        !currentDraft.micronFractionsText.trim();

      return {
        ...currentDraft,
        stage,
        micronFractionsText: shouldSeedDryYields
          ? buildDryYieldRowsFromPlannedRanges(
              currentDraft.plannedMicronRangesText
            )
          : currentDraft.micronFractionsText,
      };
    });
  };

  const handleAddSession = () => {
    setError(null);
    setSelectedSession(null);
    setSessionDraft(buildSessionDraft());
    setSessionPhotoContextId(createProjectPhotoContextId());
    setSessionOriginalPhotoIds([]);
  };

  const handleEditSession = (session: WashSession) => {
    setError(null);
    setSelectedSession(session);
    setSessionDraft(buildSessionDraft(session));
    setSessionPhotoContextId(session.id ?? null);
    setSessionOriginalPhotoIds(session.photoIds ?? []);
  };

  const handleCloseSessionDialog = async () => {
    if (savingSession) {
      return;
    }

    const newPhotoIds =
      sessionDraft?.photoIds.filter(
        (photoId) => !sessionOriginalPhotoIds.includes(photoId)
      ) ?? [];
    if (newPhotoIds.length > 0) {
      await deleteProjectPhotosByIds(newPhotoIds, project.ownerId).catch(
        (cleanupError) =>
          console.error(
            "Failed to clean up draft session photos:",
            cleanupError
          )
      );
    }

    setSessionDraft(null);
    setSelectedSession(null);
    setSessionPhotoContextId(null);
    setSessionOriginalPhotoIds([]);
  };

  const handleSaveSession = async () => {
    if (!sessionDraft) {
      return;
    }

    setSavingSession(true);
    setError(null);

    try {
      const savedSessionId = await saveWashSession({
        project,
        sessionId: selectedSession?.id,
        date: sessionDraft.date,
        name: sessionDraft.name,
        notes: sessionDraft.notes,
        photoIds: sessionDraft.photoIds,
      });
      const removedPhotoIds = sessionOriginalPhotoIds.filter(
        (photoId) => !sessionDraft.photoIds.includes(photoId)
      );
      if (
        sessionPhotoContextId &&
        sessionPhotoContextId !== savedSessionId
      ) {
        await reassignProjectPhotos(
          sessionDraft.photoIds,
          savedSessionId
        );
      }
      if (removedPhotoIds.length > 0) {
        await deleteProjectPhotosByIds(removedPhotoIds, project.ownerId);
      }
      await loadData();
      setSessionDraft(null);
      setSelectedSession(null);
      setSessionPhotoContextId(null);
      setSessionOriginalPhotoIds([]);
    } catch (saveError) {
      console.error("Failed to save wash session:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save session. Please try again."
      );
    } finally {
      setSavingSession(false);
    }
  };

  const handleAddRun = (session: WashSession) => {
    if (!session.id) {
      return;
    }

    setError(null);
    setSelectedRun(null);
    setRunDraft(
      buildRunDraft({
        project,
        sessionId: session.id,
        cycles: [],
        fractions: [],
      })
    );
    setRunEditMode(true);
    setRunPhotoContextId(createProjectPhotoContextId());
    setRunOriginalPhotoIds([]);
    setPressOriginalPhotoIds([]);
  };

  const handleOpenRun = (run: WashRun) => {
    if (!run.id) {
      return;
    }

    setError(null);
    setSelectedRun(run);
    setRunDraft(
      buildRunDraft({
        project,
        sessionId: run.sessionId,
        run,
        cycles: cyclesByRunId[run.id] ?? [],
        fractions: fractionsByRunId[run.id] ?? [],
        pressRecord: pressRecordByRunId[run.id],
      })
    );
    setRunEditMode(false);
    setRunPhotoContextId(run.id);
    setRunOriginalPhotoIds(run.photoIds ?? []);
    setPressOriginalPhotoIds(pressRecordByRunId[run.id]?.photoIds ?? []);
  };

  const handleCloseRunDialog = async () => {
    if (savingRun) {
      return;
    }

    const newPhotoIds =
      runDraft?.photoIds.filter(
        (photoId) => !runOriginalPhotoIds.includes(photoId)
      ) ?? [];
    const newPressPhotoIds =
      runDraft?.pressPhotoIds.filter(
        (photoId) => !pressOriginalPhotoIds.includes(photoId)
      ) ?? [];

    if (newPhotoIds.length > 0 || newPressPhotoIds.length > 0) {
      await deleteProjectPhotosByIds(
        [...newPhotoIds, ...newPressPhotoIds],
        project.ownerId
      ).catch(
        (cleanupError) =>
          console.error("Failed to clean up draft wash photos:", cleanupError)
      );
    }

    setSelectedRun(null);
    setRunDraft(null);
    setRunEditMode(false);
    setRunPhotoContextId(null);
    setRunOriginalPhotoIds([]);
    setPressOriginalPhotoIds([]);
  };

  const handleSaveRun = async (nextStage?: WashRunStage) => {
    if (!runDraft) {
      return;
    }

    const draftToSave: RunDraft = {
      ...runDraft,
      stage: nextStage ?? runDraft.stage,
    };
    const errors: string[] = [];
    const inputWeightGrams = parseOptionalNumber(
      draftToSave.inputWeightGrams,
      "Input weight",
      errors
    );
    const manualDryHashWeightGrams = parseOptionalNumber(
      draftToSave.manualDryHashWeightGrams,
      "Manual dry hash weight",
      errors
    );
    const pressHashInputWeightGrams = parseOptionalNumber(
      draftToSave.pressHashInputWeightGrams,
      "Press hash input",
      errors
    );
    const pressRosinOutputWeightGrams = parseOptionalNumber(
      draftToSave.pressRosinOutputWeightGrams,
      "Rosin output",
      errors
    );
    const qualityStars = parseQualityStars(draftToSave.qualityStars, errors);
    const sources = parseSourceLines(draftToSave.sourceLines, errors);
    const micronFractions = parseFractionLines(
      draftToSave.micronFractionsText,
      errors
    );
    const cycles = parseCycleLines(draftToSave.cyclesText, errors);

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    const hasPressRecord = Boolean(
      pressHashInputWeightGrams !== undefined ||
        pressRosinOutputWeightGrams !== undefined ||
        draftToSave.pressTemperature.trim() ||
        draftToSave.pressDuration.trim() ||
        draftToSave.pressure.trim() ||
        draftToSave.bagMicron.trim() ||
        draftToSave.pressNotes.trim() ||
        draftToSave.pressPhotoIds.length > 0
    );
    const pressRecord: PressRecordInput | undefined = hasPressRecord
      ? {
          hashInputWeightGrams: pressHashInputWeightGrams,
          rosinOutputWeightGrams: pressRosinOutputWeightGrams,
          pressTemperature: draftToSave.pressTemperature,
          pressDuration: draftToSave.pressDuration,
          pressure: draftToSave.pressure,
          bagMicron: draftToSave.bagMicron,
          notes: draftToSave.pressNotes,
          photoIds: draftToSave.pressPhotoIds,
        }
      : undefined;

    setSavingRun(true);
    setError(null);

    try {
      const savedRunId = await saveWashRun({
        project,
        sessionId: draftToSave.sessionId,
        runId: selectedRun?.id,
        runType: draftToSave.runType,
        stage: draftToSave.stage,
        cultivarGroupName: draftToSave.cultivarGroupName,
        materialType: draftToSave.materialType,
        inputWeightGrams,
        sources,
        plannedMicronRanges: parsePlannedMicronRanges(
          draftToSave.plannedMicronRangesText
        ),
        iceless: draftToSave.iceless === "yes",
        selectedDryHashWeightSource: draftToSave.selectedDryHashWeightSource,
        manualDryHashWeightGrams,
        resinCharacterTags: parseTags(draftToSave.resinCharacterTags),
        appearance: draftToSave.appearance,
        qualityStars,
        notes: draftToSave.notes,
        photoIds: draftToSave.photoIds,
        cycles,
        micronFractions,
        pressRecord,
      });
      const removedPhotoIds = runOriginalPhotoIds.filter(
        (photoId) => !draftToSave.photoIds.includes(photoId)
      );
      const removedPressPhotoIds = pressOriginalPhotoIds.filter(
        (photoId) => !draftToSave.pressPhotoIds.includes(photoId)
      );
      if (runPhotoContextId && runPhotoContextId !== savedRunId) {
        await reassignProjectPhotos(draftToSave.photoIds, savedRunId);
        await reassignProjectPhotos(
          draftToSave.pressPhotoIds,
          `${savedRunId}-press`
        );
      }
      if (removedPhotoIds.length > 0 || removedPressPhotoIds.length > 0) {
        await deleteProjectPhotosByIds(
          [...removedPhotoIds, ...removedPressPhotoIds],
          project.ownerId
        );
      }
      const refreshedData = await loadData();

      if (nextStage && refreshedData) {
        const savedRun = refreshedData.runs.find(
          (run) => run.id === savedRunId
        );

        if (savedRun?.id) {
          const nextDraft = buildRunDraft({
            project,
            sessionId: savedRun.sessionId,
            run: savedRun,
            cycles: refreshedData.cycles.filter(
              (cycle) => cycle.runId === savedRun.id
            ),
            fractions: refreshedData.micronFractions.filter(
              (fraction) => fraction.runId === savedRun.id
            ),
            pressRecord: refreshedData.pressRecords.find(
              (pressRecord) => pressRecord.runId === savedRun.id
            ),
          });

          setSelectedRun(savedRun);
          setRunDraft(seedDryYieldRowsIfNeeded(nextDraft));
          setRunEditMode(true);
          setRunPhotoContextId(savedRun.id);
          setRunOriginalPhotoIds(savedRun.photoIds ?? []);
          setPressOriginalPhotoIds(
            refreshedData.pressRecords.find(
              (pressRecord) => pressRecord.runId === savedRun.id
            )?.photoIds ?? []
          );
          return;
        }
      }

      setSelectedRun(null);
      setRunDraft(null);
      setRunEditMode(false);
      setRunPhotoContextId(null);
      setRunOriginalPhotoIds([]);
      setPressOriginalPhotoIds([]);
    } catch (saveError) {
      console.error("Failed to save wash run:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save wash run. Please try again."
      );
    } finally {
      setSavingRun(false);
    }
  };

  const selectedRunCycles =
    selectedRun?.id ? cyclesByRunId[selectedRun.id] ?? [] : [];
  const selectedRunFractions =
    selectedRun?.id ? fractionsByRunId[selectedRun.id] ?? [] : [];
  const selectedRunPressRecord =
    selectedRun?.id ? pressRecordByRunId[selectedRun.id] : undefined;
  const totalCycleMinutes = selectedRunCycles.reduce(
    (total, cycle) => total + (cycle.durationMinutes ?? 0),
    0
  );
  const runDialogTitle = selectedRun
    ? `${runEditMode ? "Edit " : ""}Wash Run`
    : "Set Up Wash Run";
  const activeRunStage = runDraft?.stage ?? selectedRun?.stage ?? "setup";
  const nextRunStage = getNextWashRunStage(activeRunStage);
  const nextRunStageActionLabel = NEXT_STAGE_ACTION_LABELS[activeRunStage];
  const saveRunButtonLabel = nextRunStage ? "Save for Later" : "Save Run";
  const runStagePrompt = nextRunStage
    ? `${WASH_RUN_STAGE_LABELS[activeRunStage]} stage. ${nextRunStageActionLabel} saves this run and opens ${WASH_RUN_STAGE_LABELS[
        nextRunStage
      ].toLowerCase()} fields.`
    : "Complete stage. Save Run stores any final changes.";
  const showWashCycleFields = Boolean(
    selectedRun && WASH_CYCLE_STAGES.has(activeRunStage)
  );
  const showDryResultFields = Boolean(
    selectedRun && DRY_RESULT_STAGES.has(activeRunStage)
  );
  const showPressResultFields = Boolean(
    selectedRun && PRESS_RESULT_STAGES.has(activeRunStage)
  );

  return (
    <>
      <SectionCard
        title="Wash Sessions"
        description="Track wash dates, runs, fractions, cycles, and press results."
        contentPadding={2.5}
        action={
          !readOnly ? (
            <Button variant="contained" onClick={handleAddSession}>
              Add Session
            </Button>
          ) : undefined
        }
      >
        <Stack spacing={2}>

            {error && <Alert severity="error">{error}</Alert>}

            {loading ? (
              <Typography color="text.secondary" variant="body2">
                Loading wash sessions...
              </Typography>
            ) : (
              <>
                {data.sessions.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No wash sessions yet.
                  </Typography>
                ) : (
                  data.sessions.map((session) => {
                    const sessionRuns = session.id
                      ? runsBySessionId[session.id] ?? []
                      : [];

                    return (
                      <Card key={session.id} variant="outlined">
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Box>
                                <Typography fontWeight={700}>
                                  {session.name ||
                                    `Wash Session - ${formatProjectDate(
                                      session.date
                                    )}`}
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                >
                                  {formatProjectDate(session.date)}
                                </Typography>
                                {session.notes && (
                                  <Typography variant="body2">
                                    {session.notes}
                                  </Typography>
                                )}
                                {session.photoIds?.length ? (
                                  <Chip
                                    label={`${session.photoIds.length} photo${
                                      session.photoIds.length === 1 ? "" : "s"
                                    }`}
                                    size="small"
                                    sx={{ mt: 1 }}
                                  />
                                ) : null}
                              </Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignSelf: { sm: "flex-start" } }}
                              >
                                {!readOnly && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleEditSession(session)}
                                    sx={{ minHeight: 44 }}
                                  >
                                    Edit
                                  </Button>
                                )}
                                {!readOnly && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleAddRun(session)}
                                    sx={{ minHeight: 44 }}
                                  >
                                    Add Run
                                  </Button>
                                )}
                              </Stack>
                            </Stack>

                            {sessionRuns.length === 0 ? (
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                No runs in this session yet.
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {sessionRuns.map((run) => {
                                  const runStage = run.stage ?? "setup";
                                  const hasRthPercent = Number.isFinite(
                                    run.rthPercent
                                  );

                                  return (
                                    <Card
                                      key={run.id}
                                      variant="outlined"
                                      onClick={() => handleOpenRun(run)}
                                      sx={{ cursor: "pointer" }}
                                    >
                                      <CardContent
                                        sx={{
                                          py: 1.5,
                                          "&:last-child": { pb: 1.5 },
                                        }}
                                      >
                                        <Stack
                                          direction={{
                                            xs: "column",
                                            sm: "row",
                                          }}
                                          justifyContent="space-between"
                                          spacing={1}
                                        >
                                          <Box>
                                            <Typography fontWeight={700}>
                                              {run.cultivarGroupName ||
                                                WASH_RUN_TYPE_LABELS[
                                                  run.runType
                                                ]}
                                            </Typography>
                                            <Typography
                                              color="text.secondary"
                                              variant="body2"
                                            >
                                              {
                                                WASH_RUN_TYPE_LABELS[
                                                  run.runType
                                                ]
                                              }{" "}
                                              -{" "}
                                              {
                                                MATERIAL_TYPE_LABELS[
                                                  run.materialType
                                                ]
                                              }
                                            </Typography>
                                          </Box>
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            useFlexGap
                                            flexWrap="wrap"
                                            justifyContent={{
                                              xs: "flex-start",
                                              sm: "flex-end",
                                            }}
                                          >
                                            <Chip
                                              label={
                                                WASH_RUN_STAGE_LABELS[runStage]
                                              }
                                              size="small"
                                              variant={
                                                runStage === "setup"
                                                  ? "outlined"
                                                  : "filled"
                                              }
                                              sx={getWashRunStageChipSx(
                                                runStage
                                              )}
                                            />
                                            {hasRthPercent && (
                                              <Chip
                                                label={`RTH ${formatPercent(
                                                  run.rthPercent
                                                )}`}
                                                size="small"
                                              />
                                            )}
                                            {run.qualityStars && (
                                              <Chip
                                                label={`${run.qualityStars} star`}
                                                size="small"
                                              />
                                            )}
                                          </Stack>
                                        </Stack>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </Stack>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </>
            )}
        </Stack>
      </SectionCard>

      <ResponsiveDialog
        open={Boolean(sessionDraft)}
        onClose={handleCloseSessionDialog}
        maxWidth="sm"
        title={selectedSession ? "Edit Wash Session" : "Add Wash Session"}
        actions={
          <>
            <Button onClick={handleCloseSessionDialog} disabled={savingSession}>
              Close
            </Button>
            {!readOnly && (
              <Button
                variant="contained"
                onClick={handleSaveSession}
                disabled={savingSession}
              >
                {savingSession ? "Saving..." : "Save Session"}
              </Button>
            )}
          </>
        }
      >
        {sessionDraft && (
          <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Session date"
                type="date"
                value={sessionDraft.date}
                onChange={(event) =>
                  handleSessionDraftChange("date", event.target.value)
                }
                disabled={readOnly}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Session name"
                value={sessionDraft.name}
                onChange={(event) =>
                  handleSessionDraftChange("name", event.target.value)
                }
                disabled={readOnly}
                fullWidth
              />
              <TextField
                label="Notes"
                value={sessionDraft.notes}
                onChange={(event) =>
                  handleSessionDraftChange("notes", event.target.value)
                }
                disabled={readOnly}
                fullWidth
                multiline
                minRows={3}
              />
              {projectId && sessionPhotoContextId && (
                <ProjectPhotoUploader
                  ownerId={project.ownerId}
                  projectId={projectId}
                  contextType="wash_session"
                  contextId={sessionPhotoContextId}
                  photoIds={sessionDraft.photoIds}
                  onChange={(photoIds) =>
                    handleSessionDraftChange("photoIds", photoIds)
                  }
                  readOnly={readOnly}
                  deferDeletePhotoIds={sessionOriginalPhotoIds}
                />
              )}
          </Stack>
        )}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(runDraft)}
        onClose={handleCloseRunDialog}
        maxWidth="md"
        title={runDialogTitle}
        actions={
          <>
            <Button onClick={handleCloseRunDialog} disabled={savingRun}>
              Close
            </Button>
            {!readOnly && selectedRun && !runEditMode && (
              <Button variant="outlined" onClick={() => setRunEditMode(true)}>
                Edit
              </Button>
            )}
            {!readOnly && runEditMode && (
              <>
                <Button
                  variant={nextRunStage ? "outlined" : "contained"}
                  onClick={() => handleSaveRun()}
                  disabled={savingRun}
                >
                  {savingRun ? "Saving..." : saveRunButtonLabel}
                </Button>
                {nextRunStage && nextRunStageActionLabel && (
                  <Button
                    variant="contained"
                    onClick={() => handleSaveRun(nextRunStage)}
                    disabled={savingRun}
                  >
                    {savingRun ? "Saving..." : nextRunStageActionLabel}
                  </Button>
                )}
              </>
            )}
          </>
        }
      >
        {runDraft && (
          <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              {selectedRun && !runEditMode ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      label={WASH_RUN_STAGE_LABELS[selectedRun.stage ?? "setup"]}
                    />
                    <Chip label={WASH_RUN_TYPE_LABELS[selectedRun.runType]} />
                    <Chip
                      label={MATERIAL_TYPE_LABELS[selectedRun.materialType]}
                    />
                    {selectedRun.iceless && <Chip label="Iceless" />}
                    {selectedRun.qualityStars && (
                      <Chip label={`${selectedRun.qualityStars} star`} />
                    )}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    {[
                      ["Input", formatWeight(selectedRun.inputWeightGrams)],
                      ...(showDryResultFields
                        ? [
                            [
                              "Dry hash",
                              formatWeight(
                                selectedRun.effectiveDryHashWeightGrams
                              ),
                            ],
                            ["RTH", formatPercent(selectedRun.rthPercent)],
                          ]
                        : []),
                    ].map(([label, value]) => (
                      <Box key={label} sx={{ flex: 1 }}>
                        <Typography color="text.secondary" variant="caption">
                          {label}
                        </Typography>
                        <Typography>{value}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography fontWeight={700} gutterBottom>
                      Sources
                    </Typography>
                    {selectedRun.sources.length === 0 ? (
                      <Typography color="text.secondary" variant="body2">
                        No sources recorded.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {selectedRun.sources.map((source, index) => (
                          <Typography key={`${source.strain}-${index}`}>
                            {source.breeder ? `${source.breeder} - ` : ""}
                            {source.strain ?? source.snapshot?.strain}
                            {source.startingWeightGrams
                              ? ` (${source.startingWeightGrams} g)`
                              : ""}
                            {source.proportionPercent
                              ? ` - ${source.proportionPercent}%`
                              : ""}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Typography fontWeight={700} gutterBottom>
                      Planned Micron Ranges
                    </Typography>
                    {selectedRun.plannedMicronRanges?.length ? (
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {selectedRun.plannedMicronRanges.map((range) => (
                          <Chip key={range} label={range} size="small" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No planned ranges recorded.
                      </Typography>
                    )}
                  </Box>

                  {(showDryResultFields || selectedRunFractions.length > 0) && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>
                        Micron Fraction Dry Yields
                      </Typography>
                      {selectedRunFractions.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">
                          No dry yields recorded.
                        </Typography>
                      ) : (
                        <Stack spacing={0.5}>
                          {selectedRunFractions.map((fraction) => (
                            <Typography key={fraction.id}>
                              {fraction.label}: {fraction.dryWeightGrams} g
                            </Typography>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}

                  {(showWashCycleFields || selectedRunCycles.length > 0) && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>
                        Wash Cycles
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {selectedRunCycles.length} cycle
                        {selectedRunCycles.length === 1 ? "" : "s"}
                        {totalCycleMinutes > 0
                          ? ` - ${totalCycleMinutes} total minutes`
                          : ""}
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {selectedRunCycles.map((cycle, index) => (
                          <Typography key={cycle.id} variant="body2">
                            Cycle {index + 1}:{" "}
                            {cycle.durationMinutes
                              ? `${cycle.durationMinutes} min`
                              : "No duration"}
                            {cycle.temperature
                              ? ` - ${cycle.temperature}`
                              : ""}
                            {cycle.notes ? ` - ${cycle.notes}` : ""}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {(showPressResultFields || selectedRunPressRecord) && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>
                        Press
                      </Typography>
                      {selectedRunPressRecord ? (
                        <Stack spacing={1}>
                          <Typography>
                            Hash input:{" "}
                            {formatWeight(
                              selectedRunPressRecord.hashInputWeightGrams
                            )}
                          </Typography>
                          <Typography>
                            Rosin output:{" "}
                            {formatWeight(
                              selectedRunPressRecord.rosinOutputWeightGrams
                            )}
                          </Typography>
                          <Typography>
                            RTR:{" "}
                            {formatPercent(selectedRunPressRecord.rtrPercent)}
                          </Typography>
                          <Typography>
                            Overall rosin return:{" "}
                            {formatPercent(
                              selectedRunPressRecord.overallRosinReturnPercent
                            )}
                          </Typography>
                          {selectedRunPressRecord.notes && (
                            <Typography>
                              {selectedRunPressRecord.notes}
                            </Typography>
                          )}
                          {projectId &&
                            selectedRun.id &&
                            selectedRunPressRecord.photoIds?.length > 0 && (
                              <ProjectPhotoUploader
                                ownerId={project.ownerId}
                                projectId={projectId}
                                contextType="press_record"
                                contextId={`${selectedRun.id}-press`}
                                photoIds={selectedRunPressRecord.photoIds}
                                onChange={() => undefined}
                                readOnly
                                label="Press Photos"
                              />
                            )}
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          No press record yet.
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box>
                    <Typography fontWeight={700} gutterBottom>
                      Notes
                    </Typography>
                    <Typography whiteSpace="pre-wrap">
                      {selectedRun.notes || "Not recorded"}
                    </Typography>
                  </Box>

                  {projectId && selectedRun.id && (
                    <ProjectPhotoUploader
                      ownerId={project.ownerId}
                      projectId={projectId}
                      contextType="wash_run"
                      contextId={selectedRun.id}
                      photoIds={selectedRun.photoIds ?? []}
                      onChange={() => undefined}
                      readOnly
                    />
                  )}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Alert severity="info" variant="outlined">
                    {runStagePrompt}
                  </Alert>

                  {selectedRun && (
                    <TextField
                      label="Run stage"
                      value={runDraft.stage}
                      onChange={(event) =>
                        handleRunStageChange(event.target.value as WashRunStage)
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      {Object.entries(WASH_RUN_STAGE_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Run type"
                      value={runDraft.runType}
                      onChange={(event) =>
                        handleRunDraftChange(
                          "runType",
                          event.target.value as WashRunType
                        )
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      {Object.entries(WASH_RUN_TYPE_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                    <TextField
                      label="Material"
                      value={runDraft.materialType}
                      onChange={(event) =>
                        handleRunDraftChange(
                          "materialType",
                          event.target.value as MaterialType
                        )
                      }
                      disabled={readOnly}
                      select
                      fullWidth
                    >
                      {Object.entries(MATERIAL_TYPE_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Run name"
                      value={runDraft.cultivarGroupName}
                      onChange={(event) =>
                        handleRunDraftChange(
                          "cultivarGroupName",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      fullWidth
                      helperText="Optional. Example: Sugar Shack #1"
                    />
                    <TextField
                      label="Input grams"
                      value={runDraft.inputWeightGrams}
                      onChange={(event) =>
                        handleRunDraftChange(
                          "inputWeightGrams",
                          event.target.value
                        )
                      }
                      disabled={readOnly}
                      fullWidth
                    />
                  </Stack>

                  <TextField
                    label="Source material"
                    value={runDraft.sourceLines}
                    onChange={(event) =>
                      handleRunDraftChange("sourceLines", event.target.value)
                    }
                    disabled={readOnly}
                    fullWidth
                    multiline
                    minRows={3}
                    helperText="Prefilled from project sources. Add one source per line for blends."
                  />

                  <TextField
                    label="Planned micron ranges"
                    value={runDraft.plannedMicronRangesText}
                    onChange={(event) =>
                      handleRunDraftChange(
                        "plannedMicronRangesText",
                        event.target.value
                      )
                    }
                    disabled={readOnly}
                    fullWidth
                    multiline
                    minRows={2}
                    helperText="Examples: 45-190, or one range per line like 45-73 and 73-120."
                  />

                  <TextField
                    label="Iceless"
                    value={runDraft.iceless}
                    onChange={(event) =>
                      handleRunDraftChange("iceless", event.target.value)
                    }
                    disabled={readOnly}
                    select
                    fullWidth
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                  </TextField>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Appearance"
                      value={runDraft.appearance}
                      onChange={(event) =>
                        handleRunDraftChange("appearance", event.target.value)
                      }
                      disabled={readOnly}
                      fullWidth
                    />
                  </Stack>

                  <TextField
                    label="Resin character"
                    value={runDraft.resinCharacterTags}
                    onChange={(event) =>
                      handleRunDraftChange(
                        "resinCharacterTags",
                        event.target.value
                      )
                    }
                    disabled={readOnly}
                    fullWidth
                    placeholder="Comma separated"
                  />

                  {(showWashCycleFields ||
                    showDryResultFields ||
                    showPressResultFields) && (
                    <>
                      <Divider />

                      {showWashCycleFields && (
                        <>
                          <Typography fontWeight={700}>Wash Cycles</Typography>
                          <TextField
                            label="Wash cycles"
                            value={runDraft.cyclesText}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "cyclesText",
                                event.target.value
                              )
                            }
                            disabled={readOnly}
                            fullWidth
                            multiline
                            minRows={3}
                            helperText="Temporary format: minutes | temperature | notes"
                          />
                        </>
                      )}

                      {showDryResultFields && (
                        <>
                          <Typography fontWeight={700}>Drying Results</Typography>

                          <TextField
                            label="Micron fraction dry yields"
                            value={runDraft.micronFractionsText}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "micronFractionsText",
                                event.target.value
                              )
                            }
                            disabled={readOnly}
                            fullWidth
                            multiline
                            minRows={3}
                            helperText="Enter dried hash weights after drying. Temporary format: 73-119 | dry grams"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              handleRunDraftChange(
                                "micronFractionsText",
                                buildDryYieldRowsFromPlannedRanges(
                                  runDraft.plannedMicronRangesText
                                )
                              )
                            }
                            disabled={
                              readOnly ||
                              !runDraft.plannedMicronRangesText.trim()
                            }
                            sx={{ alignSelf: "flex-start" }}
                          >
                            Fill From Planned Ranges
                          </Button>

                          <TextField
                            label="How should total dry hash be calculated?"
                            value={runDraft.selectedDryHashWeightSource}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "selectedDryHashWeightSource",
                                event.target.value as DryHashWeightSource
                              )
                            }
                            disabled={readOnly}
                            select
                            fullWidth
                            helperText="Use fraction yields when you weighed each micron range. Use manual total when you only know one total dry hash weight."
                          >
                            {Object.entries(DRY_HASH_SOURCE_LABELS).map(
                              ([value, label]) => (
                                <MenuItem key={value} value={value}>
                                  {label}
                                </MenuItem>
                              )
                            )}
                          </TextField>

                          {runDraft.selectedDryHashWeightSource ===
                            "manual" && (
                            <TextField
                              label="Total dry hash grams"
                              value={runDraft.manualDryHashWeightGrams}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "manualDryHashWeightGrams",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                              helperText="Use this only when you are not entering dry yield per micron range."
                            />
                          )}

                          <TextField
                            label="Quality stars"
                            value={runDraft.qualityStars}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "qualityStars",
                                event.target.value
                              )
                            }
                            disabled={readOnly}
                            select
                            fullWidth
                          >
                            <MenuItem value="">Skip</MenuItem>
                            {[1, 2, 3, 4, 5, 6].map((score) => (
                              <MenuItem key={score} value={String(score)}>
                                {score}
                              </MenuItem>
                            ))}
                          </TextField>
                        </>
                      )}

                      {showPressResultFields && (
                        <>
                          <Divider />

                          <Typography fontWeight={700}>Press Record</Typography>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                          >
                            <TextField
                              label="Hash input grams"
                              value={runDraft.pressHashInputWeightGrams}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "pressHashInputWeightGrams",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                            />
                            <TextField
                              label="Rosin output grams"
                              value={runDraft.pressRosinOutputWeightGrams}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "pressRosinOutputWeightGrams",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                            />
                          </Stack>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                          >
                            <TextField
                              label="Press temp"
                              value={runDraft.pressTemperature}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "pressTemperature",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                            />
                            <TextField
                              label="Duration"
                              value={runDraft.pressDuration}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "pressDuration",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                            />
                            <TextField
                              label="Bag micron"
                              value={runDraft.bagMicron}
                              onChange={(event) =>
                                handleRunDraftChange(
                                  "bagMicron",
                                  event.target.value
                                )
                              }
                              disabled={readOnly}
                              fullWidth
                            />
                          </Stack>
                          <TextField
                            label="Pressure"
                            value={runDraft.pressure}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "pressure",
                                event.target.value
                              )
                            }
                            disabled={readOnly}
                            fullWidth
                          />
                          <TextField
                            label="Press notes"
                            value={runDraft.pressNotes}
                            onChange={(event) =>
                              handleRunDraftChange(
                                "pressNotes",
                                event.target.value
                              )
                            }
                            disabled={readOnly}
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          {projectId && runPhotoContextId && (
                            <ProjectPhotoUploader
                              ownerId={project.ownerId}
                              projectId={projectId}
                              contextType="press_record"
                              contextId={`${runPhotoContextId}-press`}
                              photoIds={runDraft.pressPhotoIds}
                              onChange={(photoIds) =>
                                handleRunDraftChange(
                                  "pressPhotoIds",
                                  photoIds
                                )
                              }
                              readOnly={readOnly}
                              deferDeletePhotoIds={pressOriginalPhotoIds}
                              label="Press Photos"
                            />
                          )}
                        </>
                      )}
                    </>
                  )}

                  <TextField
                    label="Run notes"
                    value={runDraft.notes}
                    onChange={(event) =>
                      handleRunDraftChange("notes", event.target.value)
                    }
                    disabled={readOnly}
                    fullWidth
                    multiline
                    minRows={3}
                  />

                  {projectId && runPhotoContextId && (
                    <ProjectPhotoUploader
                      ownerId={project.ownerId}
                      projectId={projectId}
                      contextType="wash_run"
                      contextId={runPhotoContextId}
                      photoIds={runDraft.photoIds}
                      onChange={(photoIds) =>
                        handleRunDraftChange("photoIds", photoIds)
                      }
                      readOnly={readOnly}
                      deferDeletePhotoIds={runOriginalPhotoIds}
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

export default WashProcessSetup;
