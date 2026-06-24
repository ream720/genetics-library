export const V2_COLLECTIONS = {
  projects: "projects",
  projectAddenda: "projectAddenda",
  projectPhotos: "projectPhotos",
  phenoGroups: "phenoGroups",
  phenotypes: "phenotypes",
  physicalPlants: "physicalPlants",
  plantStageEvents: "plantStageEvents",
  plantEvaluations: "plantEvaluations",
  washSessions: "washSessions",
  washRuns: "washRuns",
  washCycles: "washCycles",
  micronFractions: "micronFractions",
  pressRecords: "pressRecords",
} as const;

export const PROJECT_ROUTES = {
  list: "/projects",
  new: "/projects/new",
  analytics: "/project-analytics",
  detail: (projectId: string) => `/projects/${projectId}`,
  projectAnalytics: (projectId: string) => `/projects/${projectId}/analytics`,
} as const;

export const projectMediaPath = ({
  ownerId,
  projectId,
  contextType,
  contextId,
  photoId,
  extension,
}: {
  ownerId: string;
  projectId: string;
  contextType: string;
  contextId: string;
  photoId: string;
  extension: string;
}) =>
  `projectMedia/${ownerId}/${projectId}/${contextType}/${contextId}/${photoId}.${extension}`;
