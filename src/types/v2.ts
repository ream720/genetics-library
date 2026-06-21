export type ProjectType = "pheno_hunt" | "wash_process";

export type ProjectStatus = "planning" | "in_progress" | "complete";

export type SourceType =
  | "seed"
  | "clone"
  | "ad_hoc"
  | "phenotype"
  | "plant"
  | "harvest_batch";

export type ProjectPhotoContextType =
  | "project"
  | "plant"
  | "evaluation"
  | "wash_session"
  | "wash_run"
  | "press_record"
  | "addendum"
  | "clone";

export type ProjectPhotoContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface ProjectSourceSnapshot {
  snapshotId?: string;
  sourceType: SourceType;
  sourceId?: string;
  breeder: string;
  strain: string;
  lineage?: string;
  generation?: string;
  copiedAt: string;
  notes?: string;
}

export interface ProjectBase {
  id?: string;
  ownerId: string;
  type: ProjectType;
  name: string;
  objective: string;
  status: ProjectStatus;
  startDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  sourceSnapshots: ProjectSourceSnapshot[];
}

export interface ProjectAddendum {
  id?: string;
  ownerId: string;
  projectId: string;
  text: string;
  photoIds: string[];
  createdAt: string;
}

export interface ProjectPhoto {
  id?: string;
  ownerId: string;
  projectId: string;
  contextType: ProjectPhotoContextType;
  contextId: string;
  storagePath: string;
  downloadUrl?: string;
  contentType: ProjectPhotoContentType;
  sizeBytes: number;
  width?: number;
  height?: number;
  caption?: string;
  createdAt: string;
}

export type PlantLifecycleState =
  | "planned"
  | "failed_to_germinate"
  | "germinated"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "harvested"
  | "culled"
  | "cancelled";

export type PlantRole = "mother" | "custom";

export type FinalLabel = "keeper" | "washer" | "breeder" | "custom";

export type RatingScore = 1 | 2 | 3 | 4 | 5;

export interface PhenoComparisonGroup {
  id?: string;
  ownerId: string;
  projectId: string;
  name: string;
  breeder: string;
  strain: string;
  sourceSnapshotIds: string[];
  plantedCount: number;
  notes?: string;
  displayPrefs?: {
    showGerminated?: boolean;
    showSurviving?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Phenotype {
  id?: string;
  ownerId: string;
  projectId: string;
  groupId: string;
  displayName: string;
  originalPlantId: string;
  finalLabels: FinalLabel[];
  customFinalLabels?: string[];
  promotedCloneId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalPlant {
  id?: string;
  ownerId: string;
  projectId: string;
  groupId: string;
  phenotypeId: string;
  roundNumber: number;
  displayId: string;
  lifecycleState: PlantLifecycleState;
  roles: PlantRole[];
  customRoles?: string[];
  photoIds?: string[];
  hasUserData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlantStageEvent {
  id?: string;
  ownerId: string;
  projectId: string;
  plantId: string;
  state: PlantLifecycleState;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface PlantEvaluation {
  id?: string;
  ownerId: string;
  projectId: string;
  plantId: string;
  phenotypeId: string;
  groupId: string;
  weekNumber: number;
  scheduledDate: string;
  actualDate?: string;
  missed?: boolean;
  vigorScore?: RatingScore;
  structureTags?: string[];
  stretchScore?: RatingScore;
  floweringDays?: number;
  aromaTags?: string[];
  flavorTags?: string[];
  resinCoverageScore?: RatingScore;
  resinCharacterTags?: string[];
  dryFlowerGrams?: number;
  freshFrozenGrams?: number;
  notes?: string;
  photoIds: string[];
  customTextFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type WashRunType = "pheno_specific" | "mixed_pheno" | "mixed_cultivar";

export type MaterialType = "fresh_frozen" | "dried" | "cured";

export type WashRunStage =
  | "setup"
  | "washing"
  | "drying"
  | "pressed"
  | "complete";

export type QualityStars = 1 | 2 | 3 | 4 | 5 | 6;

export type DryHashWeightSource = "manual" | "fraction_sum";

export interface WashSession {
  id?: string;
  ownerId: string;
  projectId: string;
  date: string;
  name?: string;
  notes?: string;
  photoIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WashSource {
  sourceType: SourceType;
  sourceId?: string;
  breeder?: string;
  strain?: string;
  phenotypeId?: string;
  cloneId?: string;
  startingWeightGrams?: number;
  proportionPercent?: number;
  snapshot?: ProjectSourceSnapshot;
}

export interface WashRun {
  id?: string;
  ownerId: string;
  projectId: string;
  sessionId: string;
  runType: WashRunType;
  stage?: WashRunStage;
  cultivarGroupName?: string;
  materialType: MaterialType;
  inputWeightGrams?: number;
  sources: WashSource[];
  plannedMicronRanges?: string[];
  iceless?: boolean;
  selectedDryHashWeightSource?: DryHashWeightSource;
  manualDryHashWeightGrams?: number;
  calculatedFractionDryHashWeightGrams?: number;
  effectiveDryHashWeightGrams?: number;
  rthPercent?: number;
  resinCharacterTags?: string[];
  appearance?: string;
  qualityStars?: QualityStars;
  notes?: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WashCycle {
  id?: string;
  ownerId: string;
  projectId: string;
  runId: string;
  durationMinutes?: number;
  temperature?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MicronFraction {
  id?: string;
  ownerId: string;
  projectId: string;
  runId: string;
  label: string;
  dryWeightGrams: number;
  createdAt: string;
  updatedAt: string;
}

export interface PressRecord {
  id?: string;
  ownerId: string;
  projectId: string;
  runId: string;
  hashInputWeightGrams?: number;
  rosinOutputWeightGrams?: number;
  sourceFractionIds?: string[];
  pressTemperature?: string;
  pressDuration?: string;
  pressure?: string;
  bagMicron?: string;
  rtrPercent?: number;
  overallRosinReturnPercent?: number;
  notes?: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  pheno_hunt: "Pheno Hunt",
  wash_process: "Wash/Process",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  complete: "Complete",
};

export const PLANT_LIFECYCLE_STATE_LABELS: Record<
  PlantLifecycleState,
  string
> = {
  planned: "Planned",
  failed_to_germinate: "Failed to Germinate",
  germinated: "Germinated",
  seedling: "Seedling",
  vegetative: "Vegetative",
  flowering: "Flowering",
  harvested: "Harvested",
  culled: "Culled",
  cancelled: "Cancelled",
};

export const FINAL_LABEL_LABELS: Record<FinalLabel, string> = {
  keeper: "Keeper",
  washer: "Washer",
  breeder: "Breeder",
  custom: "Custom",
};

export const RESIN_CHARACTER_TAGS = [
  "Sticky",
  "Greasy",
  "Sandy",
  "Granular",
  "Stable",
  "Melted",
  "Chalky",
  "Oily",
  "Custom",
] as const;
