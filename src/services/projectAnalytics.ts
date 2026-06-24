import {
  calculateGerminationRate,
  calculateKeeperRate,
  calculateOverallRosinReturnPercent,
  calculateRthPercent,
  calculateRtrPercent,
  calculateSurvivalRate,
  roundPercent,
  sumWeights,
} from "../lib/v2/calculations";
import {
  MaterialType,
  PhenoComparisonGroup,
  PhysicalPlant,
  PlantEvaluation,
  PlantLifecycleState,
  PlantStageEvent,
  PressRecord,
  ProjectBase,
  SourceType,
  WashRun,
} from "../types/v2";
import {
  getPhenoHuntData,
  type PhenoHuntData,
} from "./phenoHunts";
import {
  getWashProcessData,
  type WashProcessData,
} from "./washProjects";
import { getUserProjects } from "./projects";

export interface TagCount {
  tag: string;
  count: number;
}

export interface PhenoGroupAnalytics {
  groupId: string;
  name: string;
  breeder: string;
  strain: string;
  plantedCount: number;
  germinatedCount: number;
  survivingCount: number;
  keeperCount: number;
  germinationRate: number | null;
  survivalRate: number | null;
  keeperRate: number | null;
}

export interface PhenoProjectAnalytics {
  type: "pheno_hunt";
  plantedCount: number;
  germinatedCount: number;
  survivingCount: number;
  keeperCount: number;
  germinationRate: number | null;
  survivalRate: number | null;
  keeperRate: number | null;
  averageFloweringDays: number | null;
  averageDryFlowerGrams: number | null;
  averageFreshFrozenGrams: number | null;
  averageVigorScore: number | null;
  averageStretchScore: number | null;
  averageResinCoverageScore: number | null;
  aromaTags: TagCount[];
  flavorTags: TagCount[];
  resinCharacterTags: TagCount[];
  groups: PhenoGroupAnalytics[];
}

export interface WashRunAnalytics {
  runId: string;
  name: string;
  runType: WashRun["runType"];
  materialType: MaterialType;
  sourceBreeders: string[];
  sourceCultivars: string[];
  sourceTypes: SourceType[];
  inputWeightGrams: number | null;
  dryHashWeightGrams: number | null;
  rosinOutputWeightGrams: number | null;
  rthPercent: number | null;
  rtrPercent: number | null;
  overallRosinReturnPercent: number | null;
  qualityStars: number | null;
  resinCharacterTags: string[];
}

export interface WashProjectAnalytics {
  type: "wash_process";
  sessionCount: number;
  runCount: number;
  totalInputWeightGrams: number | null;
  totalDryHashWeightGrams: number | null;
  totalRosinOutputWeightGrams: number | null;
  averageRthPercent: number | null;
  averageRtrPercent: number | null;
  averageOverallRosinReturnPercent: number | null;
  averageQualityStars: number | null;
  resinCharacterTags: TagCount[];
  runs: WashRunAnalytics[];
}

export type ProjectAnalytics =
  | PhenoProjectAnalytics
  | WashProjectAnalytics;

export interface PersonalProjectAnalyticsRecord {
  project: ProjectBase;
  analytics: ProjectAnalytics;
  breeders: string[];
  cultivars: string[];
  sourceTypes: SourceType[];
}

const GERMINATED_STATES = new Set<PlantLifecycleState>([
  "germinated",
  "seedling",
  "vegetative",
  "flowering",
  "harvested",
]);

const NON_SURVIVING_STATES = new Set<PlantLifecycleState>([
  "failed_to_germinate",
  "culled",
  "cancelled",
]);

const average = (
  values: Array<number | null | undefined>,
  decimals = 2
): number | null => {
  const recordedValues = values.filter(
    (value): value is number =>
      value !== null && value !== undefined && Number.isFinite(value)
  );

  if (recordedValues.length === 0) {
    return null;
  }

  const factor = 10 ** decimals;
  const result =
    recordedValues.reduce((total, value) => total + value, 0) /
    recordedValues.length;
  return Math.round(result * factor) / factor;
};

const sumRecorded = (
  values: Array<number | null | undefined>
): number | null => {
  const recordedValues = values.filter(
    (value): value is number =>
      value !== null && value !== undefined && Number.isFinite(value)
  );

  return recordedValues.length > 0 ? sumWeights(recordedValues) : null;
};

const uniqueRecordedStrings = (
  values: Array<string | null | undefined>
): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

const mostCommonTags = (
  tagGroups: Array<string[] | null | undefined>,
  limit = 5
): TagCount[] => {
  const counts = new Map<string, { display: string; count: number }>();

  tagGroups.flatMap((tags) => tags ?? []).forEach((tag) => {
    const cleanTag = tag.trim();
    if (!cleanTag) {
      return;
    }

    const key = cleanTag.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, {
      display: existing?.display ?? cleanTag,
      count: (existing?.count ?? 0) + 1,
    });
  });

  return Array.from(counts.values())
    .sort(
      (a, b) =>
        b.count - a.count || a.display.localeCompare(b.display)
    )
    .slice(0, limit)
    .map(({ display, count }) => ({ tag: display, count }));
};

const latestEvaluationsByPlant = (evaluations: PlantEvaluation[]) => {
  const latestByPlant = new Map<string, PlantEvaluation>();

  evaluations.forEach((evaluation) => {
    const current = latestByPlant.get(evaluation.plantId);
    if (
      !current ||
      evaluation.weekNumber > current.weekNumber ||
      (evaluation.weekNumber === current.weekNumber &&
        evaluation.updatedAt.localeCompare(current.updatedAt) > 0)
    ) {
      latestByPlant.set(evaluation.plantId, evaluation);
    }
  });

  return Array.from(latestByPlant.values());
};

const plantEverGerminated = (
  plant: PhysicalPlant,
  stageEvents: PlantStageEvent[]
) =>
  GERMINATED_STATES.has(plant.lifecycleState) ||
  stageEvents.some((event) => GERMINATED_STATES.has(event.state));

const calculatePlantFloweringDays = (
  plant: PhysicalPlant,
  stageEvents: PlantStageEvent[],
  latestEvaluation?: PlantEvaluation
): number | null => {
  const datedEvents = stageEvents
    .map((event) => ({
      ...event,
      timestamp: new Date(`${event.date}T00:00:00`).getTime(),
    }))
    .filter((event) => Number.isFinite(event.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
  const floweringEvent = [...datedEvents]
    .reverse()
    .find((event) => event.state === "flowering");

  if (floweringEvent) {
    const harvestEvent = datedEvents.find(
      (event) =>
        event.state === "harvested" &&
        event.timestamp >= floweringEvent.timestamp
    );

    if (harvestEvent) {
      return Math.max(
        0,
        Math.round(
          (harvestEvent.timestamp - floweringEvent.timestamp) / 86400000
        )
      );
    }
  }

  if (
    plant.lifecycleState === "harvested" &&
    latestEvaluation?.floweringDays !== undefined
  ) {
    return latestEvaluation.floweringDays;
  }

  return null;
};

const phenoGroupAnalytics = (
  group: PhenoComparisonGroup,
  data: PhenoHuntData
): PhenoGroupAnalytics => {
  const plants = data.plants.filter((plant) => plant.groupId === group.id);
  const plantIds = new Set(plants.map((plant) => plant.id).filter(Boolean));
  const stageEvents = data.stageEvents.filter((event) =>
    plantIds.has(event.plantId)
  );
  const germinatedPlants = plants.filter((plant) =>
    plantEverGerminated(
      plant,
      stageEvents.filter((event) => event.plantId === plant.id)
    )
  );
  const survivingCount = germinatedPlants.filter(
    (plant) => !NON_SURVIVING_STATES.has(plant.lifecycleState)
  ).length;
  const keeperCount = data.phenotypes.filter(
    (phenotype) =>
      phenotype.groupId === group.id &&
      phenotype.finalLabels.includes("keeper")
  ).length;

  return {
    groupId: group.id ?? "",
    name: group.name,
    breeder: group.breeder,
    strain: group.strain,
    plantedCount: group.plantedCount,
    germinatedCount: germinatedPlants.length,
    survivingCount,
    keeperCount,
    germinationRate: roundPercent(
      calculateGerminationRate(germinatedPlants.length, group.plantedCount)
    ),
    survivalRate: roundPercent(
      calculateSurvivalRate(survivingCount, germinatedPlants.length)
    ),
    keeperRate: roundPercent(
      calculateKeeperRate(keeperCount, germinatedPlants.length)
    ),
  };
};

export const calculatePhenoProjectAnalytics = (
  data: PhenoHuntData
): PhenoProjectAnalytics => {
  const groups = data.groups.map((group) =>
    phenoGroupAnalytics(group, data)
  );
  const plantedCount = groups.reduce(
    (total, group) => total + group.plantedCount,
    0
  );
  const germinatedCount = groups.reduce(
    (total, group) => total + group.germinatedCount,
    0
  );
  const survivingCount = groups.reduce(
    (total, group) => total + group.survivingCount,
    0
  );
  const keeperCount = groups.reduce(
    (total, group) => total + group.keeperCount,
    0
  );
  const latestEvaluations = latestEvaluationsByPlant(data.evaluations);
  const latestEvaluationByPlant = new Map(
    latestEvaluations.map((evaluation) => [evaluation.plantId, evaluation])
  );
  const stageEventsByPlant = data.stageEvents.reduce<
    Record<string, PlantStageEvent[]>
  >((eventsByPlant, event) => {
    if (!eventsByPlant[event.plantId]) {
      eventsByPlant[event.plantId] = [];
    }
    eventsByPlant[event.plantId].push(event);
    return eventsByPlant;
  }, {});

  return {
    type: "pheno_hunt",
    plantedCount,
    germinatedCount,
    survivingCount,
    keeperCount,
    germinationRate: roundPercent(
      calculateGerminationRate(germinatedCount, plantedCount)
    ),
    survivalRate: roundPercent(
      calculateSurvivalRate(survivingCount, germinatedCount)
    ),
    keeperRate: roundPercent(
      calculateKeeperRate(keeperCount, germinatedCount)
    ),
    averageFloweringDays: average(
      data.plants.map((plant) =>
        calculatePlantFloweringDays(
          plant,
          stageEventsByPlant[plant.id ?? ""] ?? [],
          latestEvaluationByPlant.get(plant.id ?? "")
        )
      ),
      1
    ),
    averageDryFlowerGrams: average(
      latestEvaluations.map((evaluation) => evaluation.dryFlowerGrams),
      1
    ),
    averageFreshFrozenGrams: average(
      latestEvaluations.map((evaluation) => evaluation.freshFrozenGrams),
      1
    ),
    averageVigorScore: average(
      latestEvaluations.map((evaluation) => evaluation.vigorScore),
      1
    ),
    averageStretchScore: average(
      latestEvaluations.map((evaluation) => evaluation.stretchScore),
      1
    ),
    averageResinCoverageScore: average(
      latestEvaluations.map(
        (evaluation) => evaluation.resinCoverageScore
      ),
      1
    ),
    aromaTags: mostCommonTags(
      latestEvaluations.map((evaluation) => evaluation.aromaTags)
    ),
    flavorTags: mostCommonTags(
      latestEvaluations.map((evaluation) => evaluation.flavorTags)
    ),
    resinCharacterTags: mostCommonTags(
      latestEvaluations.map(
        (evaluation) => evaluation.resinCharacterTags
      )
    ),
    groups,
  };
};

const washRunName = (run: WashRun) => {
  if (run.cultivarGroupName?.trim()) {
    return run.cultivarGroupName.trim();
  }

  const sourceNames = run.sources
    .map((source) => source.strain ?? source.snapshot?.strain)
    .filter(Boolean);
  return sourceNames.length > 0
    ? Array.from(new Set(sourceNames)).join(" + ")
    : "Unnamed run";
};

const washRunAnalytics = (
  run: WashRun,
  pressRecord?: PressRecord
): WashRunAnalytics => {
  const dryHashWeightGrams =
    run.effectiveDryHashWeightGrams ??
    run.calculatedFractionDryHashWeightGrams ??
    run.manualDryHashWeightGrams;
  const rthPercent =
    run.rthPercent ??
    roundPercent(
      calculateRthPercent(dryHashWeightGrams, run.inputWeightGrams)
    );
  const rtrPercent =
    pressRecord?.rtrPercent ??
    roundPercent(
      calculateRtrPercent(
        pressRecord?.rosinOutputWeightGrams,
        pressRecord?.hashInputWeightGrams
      )
    );
  const overallRosinReturnPercent =
    pressRecord?.overallRosinReturnPercent ??
    roundPercent(
      calculateOverallRosinReturnPercent(
        pressRecord?.rosinOutputWeightGrams,
        run.inputWeightGrams
      )
    );

  return {
    runId: run.id ?? "",
    name: washRunName(run),
    runType: run.runType,
    materialType: run.materialType,
    sourceBreeders: uniqueRecordedStrings(
      run.sources.map(
        (source) => source.breeder ?? source.snapshot?.breeder
      )
    ),
    sourceCultivars: uniqueRecordedStrings(
      run.sources.map(
        (source) => source.strain ?? source.snapshot?.strain
      )
    ),
    sourceTypes: Array.from(
      new Set(run.sources.map((source) => source.sourceType))
    ).sort(),
    inputWeightGrams: run.inputWeightGrams ?? null,
    dryHashWeightGrams: dryHashWeightGrams ?? null,
    rosinOutputWeightGrams: pressRecord?.rosinOutputWeightGrams ?? null,
    rthPercent,
    rtrPercent,
    overallRosinReturnPercent,
    qualityStars: run.qualityStars ?? null,
    resinCharacterTags: run.resinCharacterTags ?? [],
  };
};

export const calculateWashProjectAnalytics = (
  data: WashProcessData
): WashProjectAnalytics => {
  const pressRecordByRun = new Map(
    data.pressRecords.map((pressRecord) => [
      pressRecord.runId,
      pressRecord,
    ])
  );
  const runs = data.runs.map((run) =>
    washRunAnalytics(run, pressRecordByRun.get(run.id ?? ""))
  );

  return {
    type: "wash_process",
    sessionCount: data.sessions.length,
    runCount: runs.length,
    totalInputWeightGrams: sumRecorded(
      runs.map((run) => run.inputWeightGrams)
    ),
    totalDryHashWeightGrams: sumRecorded(
      runs.map((run) => run.dryHashWeightGrams)
    ),
    totalRosinOutputWeightGrams: sumRecorded(
      runs.map((run) => run.rosinOutputWeightGrams)
    ),
    averageRthPercent: average(
      runs.map((run) => run.rthPercent)
    ),
    averageRtrPercent: average(
      runs.map((run) => run.rtrPercent)
    ),
    averageOverallRosinReturnPercent: average(
      runs.map((run) => run.overallRosinReturnPercent)
    ),
    averageQualityStars: average(
      runs.map((run) => run.qualityStars),
      1
    ),
    resinCharacterTags: mostCommonTags(
      data.runs.map((run) => run.resinCharacterTags)
    ),
    runs,
  };
};

export const getProjectAnalytics = async (
  projectId: string,
  ownerId: string,
  projectType: "pheno_hunt" | "wash_process"
): Promise<ProjectAnalytics> => {
  if (projectType === "pheno_hunt") {
    return calculatePhenoProjectAnalytics(
      await getPhenoHuntData(projectId, ownerId)
    );
  }

  return calculateWashProjectAnalytics(
    await getWashProcessData(projectId, ownerId)
  );
};

export const getPersonalProjectAnalytics = async (
  ownerId: string
): Promise<PersonalProjectAnalyticsRecord[]> => {
  const completedProjects = (await getUserProjects(ownerId)).filter(
    (project) => project.status === "complete" && project.id
  );

  return Promise.all(
    completedProjects.map(async (project) => ({
      project,
      analytics: await getProjectAnalytics(
        project.id as string,
        ownerId,
        project.type
      ),
      breeders: uniqueRecordedStrings(
        project.sourceSnapshots.map((source) => source.breeder)
      ),
      cultivars: uniqueRecordedStrings(
        project.sourceSnapshots.map((source) => source.strain)
      ),
      sourceTypes: Array.from(
        new Set(
          project.sourceSnapshots.map((source) => source.sourceType)
        )
      ).sort(),
    }))
  );
};
