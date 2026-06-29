import {
  collection,
  deleteField,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { app } from "../../firebaseConfig";
import { removeUndefinedFields } from "../lib/v2/firestore";
import { V2_COLLECTIONS } from "../lib/v2/projectPaths";
import {
  assertCurrentUserCanWrite,
  assertUserCanWrite,
} from "./legalAcceptance";
import { Clone } from "../types";
import {
  FinalLabel,
  PhenoComparisonGroup,
  Phenotype,
  PhysicalPlant,
  PlantEvaluation,
  PlantLifecycleState,
  PlantStageEvent,
  ProjectBase,
  ProjectSourceSnapshot,
  RatingScore,
} from "../types/v2";

const db = getFirestore(app);

type PhenoSnapshot = QueryDocumentSnapshot<DocumentData>;

export interface PhenoHuntData {
  groups: PhenoComparisonGroup[];
  phenotypes: Phenotype[];
  plants: PhysicalPlant[];
  stageEvents: PlantStageEvent[];
  evaluations: PlantEvaluation[];
}

export type UpdatePhenoGroupInput = Partial<
  Pick<PhenoComparisonGroup, "name" | "notes" | "displayPrefs">
>;

interface SetPlantedCountInput {
  group: PhenoComparisonGroup;
  ownerId: string;
  plantedCount: number;
}

interface UpdatePhysicalPlantInput {
  plant: PhysicalPlant;
  displayId: string;
  lifecycleState: PlantLifecycleState;
  stageDate: string;
  stageNotes?: string;
  photoIds?: string[];
}

interface SavePlantEvaluationInput {
  evaluationId?: string;
  plant: PhysicalPlant;
  weekNumber: number;
  scheduledDate: string;
  actualDate?: string;
  missed: boolean;
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
  photoIds?: string[];
}

interface UpdatePhenotypeFinalLabelsInput {
  project: ProjectBase;
  group: PhenoComparisonGroup;
  phenotype: Phenotype;
  plant: PhysicalPlant;
  finalLabels: FinalLabel[];
  keeperRemovalCloneAction?: "delete" | "unlink";
}

const nowIsoString = () => new Date().toISOString();

const collectionRef = (collectionName: string) =>
  collection(db, collectionName);

const mapSnapshot = <T extends { id?: string }>(
  snapshot: PhenoSnapshot
): T => ({
  id: snapshot.id,
  ...snapshot.data(),
} as T);

const projectOwnerQuery = (
  collectionName: string,
  projectId: string,
  ownerId: string
) =>
  query(
    collectionRef(collectionName),
    where("projectId", "==", projectId),
    where("ownerId", "==", ownerId)
  );

const groupOwnerQuery = (
  collectionName: string,
  projectId: string,
  ownerId: string,
  groupId: string
) =>
  query(
    collectionRef(collectionName),
    where("projectId", "==", projectId),
    where("ownerId", "==", ownerId),
    where("groupId", "==", groupId)
  );

const sourceSnapshotId = (
  source: ProjectSourceSnapshot,
  index: number
): string =>
  source.snapshotId ??
  `${source.sourceType}:${source.sourceId ?? "ad-hoc"}:${index}`;

const groupKey = (breeder: string, strain: string) =>
  `${breeder.trim().toLowerCase()}::${strain.trim().toLowerCase()}`;

const createDefaultGroupName = (source: ProjectSourceSnapshot) =>
  `${source.strain} by ${source.breeder}`;

const findGroupSourceSnapshot = (
  project: ProjectBase,
  group: PhenoComparisonGroup
) =>
  project.sourceSnapshots.find((source, index) =>
    group.sourceSnapshotIds.includes(sourceSnapshotId(source, index))
  ) ??
  project.sourceSnapshots.find(
    (source) => source.breeder === group.breeder && source.strain === group.strain
  );

const createPromotedClone = ({
  project,
  group,
  phenotype,
  plant,
}: {
  project: ProjectBase;
  group: PhenoComparisonGroup;
  phenotype: Phenotype;
  plant: PhysicalPlant;
}): Clone => {
  const source = findGroupSourceSnapshot(project, group);

  return {
    breeder: source?.breeder ?? group.breeder,
    strain: source?.strain ?? group.strain,
    lineage: source?.lineage ?? "",
    cutName: phenotype.displayName || plant.displayId,
    generation: source?.generation ?? "",
    sex: "Female",
    breederCut: false,
    available: true,
    dateAcquired: nowIsoString(),
    userId: project.ownerId,
    phenoHunted: true,
    finalLabels: phenotype.finalLabels,
    sourceProjectId: project.id,
    sourcePlantId: plant.id,
    sourcePhenotypeId: phenotype.id,
  };
};

const getPlantSequence = (plant: PhysicalPlant): number => {
  const match = plant.displayId.match(/#(\d+)/);
  return match ? Number(match[1]) : 0;
};

const sortGroups = (groups: PhenoComparisonGroup[]) =>
  [...groups].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const sortPlants = (plants: PhysicalPlant[]) =>
  [...plants].sort((a, b) => {
    if (a.groupId !== b.groupId) {
      return a.groupId.localeCompare(b.groupId);
    }

    if (a.roundNumber !== b.roundNumber) {
      return a.roundNumber - b.roundNumber;
    }

    return getPlantSequence(a) - getPlantSequence(b);
  });

const sortStageEvents = (events: PlantStageEvent[]) =>
  [...events].sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);
    return dateComparison !== 0
      ? dateComparison
      : b.createdAt.localeCompare(a.createdAt);
  });

export const getPhenoHuntData = async (
  projectId: string,
  ownerId: string
): Promise<PhenoHuntData> => {
  const [
    groupSnapshots,
    phenotypeSnapshots,
    plantSnapshots,
    stageEventSnapshots,
    evaluationSnapshots,
  ] = await Promise.all([
    getDocs(projectOwnerQuery(V2_COLLECTIONS.phenoGroups, projectId, ownerId)),
    getDocs(projectOwnerQuery(V2_COLLECTIONS.phenotypes, projectId, ownerId)),
    getDocs(
      projectOwnerQuery(V2_COLLECTIONS.physicalPlants, projectId, ownerId)
    ),
    getDocs(
      projectOwnerQuery(V2_COLLECTIONS.plantStageEvents, projectId, ownerId)
    ),
    getDocs(
      projectOwnerQuery(V2_COLLECTIONS.plantEvaluations, projectId, ownerId)
    ),
  ]);

  return {
    groups: sortGroups(groupSnapshots.docs.map(mapSnapshot<PhenoComparisonGroup>)),
    phenotypes: phenotypeSnapshots.docs.map(mapSnapshot<Phenotype>),
    plants: sortPlants(plantSnapshots.docs.map(mapSnapshot<PhysicalPlant>)),
    stageEvents: sortStageEvents(
      stageEventSnapshots.docs.map(mapSnapshot<PlantStageEvent>)
    ),
    evaluations: evaluationSnapshots.docs
      .map(mapSnapshot<PlantEvaluation>)
      .sort((a, b) => a.weekNumber - b.weekNumber),
  };
};

export const initializePhenoGroupsFromProject = async (
  project: ProjectBase
): Promise<PhenoComparisonGroup[]> => {
  await assertUserCanWrite(project.ownerId);

  if (!project.id) {
    throw new Error("Project ID is required to initialize pheno groups.");
  }

  const existingGroups = (
    await getDocs(
      projectOwnerQuery(
        V2_COLLECTIONS.phenoGroups,
        project.id,
        project.ownerId
      )
    )
  ).docs.map(mapSnapshot<PhenoComparisonGroup>);
  const existingGroupKeys = new Set(
    existingGroups.map((group) => groupKey(group.breeder, group.strain))
  );

  const groupsBySource = project.sourceSnapshots.reduce<
    Record<
      string,
      Omit<PhenoComparisonGroup, "id" | "createdAt" | "updatedAt">
    >
  >((groups, source, index) => {
    const key = groupKey(source.breeder, source.strain);

    if (!groups[key]) {
      groups[key] = {
        ownerId: project.ownerId,
        projectId: project.id!,
        name: createDefaultGroupName(source),
        breeder: source.breeder,
        strain: source.strain,
        sourceSnapshotIds: [],
        plantedCount: 0,
        notes: "",
        displayPrefs: {
          showGerminated: true,
          showSurviving: true,
        },
      };
    }

    groups[key].sourceSnapshotIds.push(sourceSnapshotId(source, index));
    return groups;
  }, {});

  const timestamp = nowIsoString();
  const batch = writeBatch(db);
  let createdCount = 0;

  Object.entries(groupsBySource).forEach(([key, group]) => {
    if (existingGroupKeys.has(key)) {
      return;
    }

    const groupRef = doc(collectionRef(V2_COLLECTIONS.phenoGroups));
    batch.set(
      groupRef,
      removeUndefinedFields({
        ...group,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    );
    createdCount += 1;
  });

  if (createdCount > 0) {
    await batch.commit();
  }

  const updatedData = await getPhenoHuntData(project.id, project.ownerId);
  return updatedData.groups;
};

export const updatePhenoGroup = async (
  groupId: string,
  updates: UpdatePhenoGroupInput
) => {
  await assertCurrentUserCanWrite();

  await updateDoc(
    doc(db, V2_COLLECTIONS.phenoGroups, groupId),
    removeUndefinedFields({
      ...updates,
      updatedAt: nowIsoString(),
    })
  );
};

const getGroupPlantsAndPhenotypes = async (
  group: PhenoComparisonGroup,
  ownerId: string
) => {
  if (!group.id) {
    throw new Error("Group ID is required.");
  }

  const [plantSnapshots, phenotypeSnapshots] = await Promise.all([
    getDocs(
      groupOwnerQuery(
        V2_COLLECTIONS.physicalPlants,
        group.projectId,
        ownerId,
        group.id
      )
    ),
    getDocs(
      groupOwnerQuery(
        V2_COLLECTIONS.phenotypes,
        group.projectId,
        ownerId,
        group.id
      )
    ),
  ]);

  return {
    plants: sortPlants(plantSnapshots.docs.map(mapSnapshot<PhysicalPlant>)),
    phenotypes: phenotypeSnapshots.docs.map(mapSnapshot<Phenotype>),
  };
};

export const setPhenoGroupPlantedCount = async ({
  group,
  ownerId,
  plantedCount,
}: SetPlantedCountInput) => {
  await assertUserCanWrite(ownerId);

  if (!group.id) {
    throw new Error("Group ID is required.");
  }

  if (!Number.isInteger(plantedCount) || plantedCount < 0) {
    throw new Error("Planted count must be a whole number at least 0.");
  }

  const { plants, phenotypes } = await getGroupPlantsAndPhenotypes(
    group,
    ownerId
  );
  const firstRoundPlants = plants.filter((plant) => plant.roundNumber === 1);
  const currentCount = firstRoundPlants.length;
  const timestamp = nowIsoString();
  const batch = writeBatch(db);
  const groupRef = doc(db, V2_COLLECTIONS.phenoGroups, group.id);

  batch.update(groupRef, {
    plantedCount,
    updatedAt: timestamp,
  });

  if (plantedCount > currentCount) {
    const maxSequence = Math.max(0, ...firstRoundPlants.map(getPlantSequence));

    for (let index = 1; index <= plantedCount - currentCount; index += 1) {
      const sequence = maxSequence + index;
      const displayId = `${group.strain} #${sequence}`;
      const plantRef = doc(collectionRef(V2_COLLECTIONS.physicalPlants));
      const phenotypeRef = doc(collectionRef(V2_COLLECTIONS.phenotypes));

      batch.set(
        plantRef,
        removeUndefinedFields<PhysicalPlant>({
          id: plantRef.id,
          ownerId,
          projectId: group.projectId,
          groupId: group.id,
          phenotypeId: phenotypeRef.id,
          roundNumber: 1,
          displayId,
          lifecycleState: "planned",
          roles: [],
          photoIds: [],
          hasUserData: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      );

      batch.set(
        phenotypeRef,
        removeUndefinedFields<Phenotype>({
          id: phenotypeRef.id,
          ownerId,
          projectId: group.projectId,
          groupId: group.id,
          displayName: displayId,
          originalPlantId: plantRef.id,
          finalLabels: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      );
    }
  }

  if (plantedCount < currentCount) {
    const phenotypesById = new Map(
      phenotypes.map((phenotype) => [phenotype.id, phenotype])
    );
    const deleteCount = currentCount - plantedCount;
    const deletablePlants = firstRoundPlants
      .filter((plant) => {
        const phenotype = phenotypesById.get(plant.phenotypeId);

        return (
          !plant.hasUserData &&
          plant.lifecycleState === "planned" &&
          plant.roles.length === 0 &&
          phenotype?.originalPlantId === plant.id &&
          phenotype.finalLabels.length === 0 &&
          !phenotype.promotedCloneId
        );
      })
      .sort((a, b) => getPlantSequence(b) - getPlantSequence(a));

    if (deletablePlants.length < deleteCount) {
      throw new Error(
        "Planted count cannot be reduced because some generated plant records already contain data. Mark those plants Cancelled or Culled instead."
      );
    }

    deletablePlants.slice(0, deleteCount).forEach((plant) => {
      if (plant.id) {
        batch.delete(doc(db, V2_COLLECTIONS.physicalPlants, plant.id));
      }

      if (plant.phenotypeId) {
        batch.delete(doc(db, V2_COLLECTIONS.phenotypes, plant.phenotypeId));
      }
    });
  }

  await batch.commit();
};

export const savePlantEvaluation = async ({
  evaluationId,
  plant,
  weekNumber,
  scheduledDate,
  actualDate,
  missed,
  vigorScore,
  structureTags,
  stretchScore,
  floweringDays,
  aromaTags,
  flavorTags,
  resinCoverageScore,
  resinCharacterTags,
  dryFlowerGrams,
  freshFrozenGrams,
  notes,
  photoIds,
}: SavePlantEvaluationInput) => {
  await assertUserCanWrite(plant.ownerId);

  if (!plant.id) {
    throw new Error("Plant ID is required.");
  }

  const timestamp = nowIsoString();
  const batch = writeBatch(db);
  const evaluationRef = evaluationId
    ? doc(db, V2_COLLECTIONS.plantEvaluations, evaluationId)
    : doc(collectionRef(V2_COLLECTIONS.plantEvaluations));
  const evaluationData = removeUndefinedFields({
    ownerId: plant.ownerId,
    projectId: plant.projectId,
    plantId: plant.id,
    phenotypeId: plant.phenotypeId,
    groupId: plant.groupId,
    weekNumber,
    scheduledDate,
    actualDate: missed ? undefined : actualDate,
    missed,
    vigorScore,
    structureTags,
    stretchScore,
    floweringDays,
    aromaTags,
    flavorTags,
    resinCoverageScore,
    resinCharacterTags,
    dryFlowerGrams,
    freshFrozenGrams,
    notes: notes?.trim(),
    photoIds: photoIds ?? [],
    updatedAt: timestamp,
  });

  if (evaluationId) {
    batch.update(evaluationRef, evaluationData);
  } else {
    batch.set(evaluationRef, {
      id: evaluationRef.id,
      ...evaluationData,
      createdAt: timestamp,
    });
  }

  batch.update(doc(db, V2_COLLECTIONS.physicalPlants, plant.id), {
    hasUserData: true,
    updatedAt: timestamp,
  });

  await batch.commit();
  return evaluationRef.id;
};

export const updatePhenotypeFinalLabels = async ({
  project,
  group,
  phenotype,
  plant,
  finalLabels,
  keeperRemovalCloneAction,
}: UpdatePhenotypeFinalLabelsInput) => {
  await assertUserCanWrite(project.ownerId);

  if (!project.id) {
    throw new Error("Project ID is required.");
  }

  if (!phenotype.id) {
    throw new Error("Phenotype ID is required.");
  }

  if (!plant.id) {
    throw new Error("Plant ID is required.");
  }

  const timestamp = nowIsoString();
  const cleanFinalLabels = Array.from(new Set(finalLabels));
  const hadKeeper = phenotype.finalLabels.includes("keeper");
  const hasKeeper = cleanFinalLabels.includes("keeper");
  const phenotypeRef = doc(db, V2_COLLECTIONS.phenotypes, phenotype.id);
  const batch = writeBatch(db);
  const phenotypeUpdates: Partial<Phenotype> & {
    promotedCloneId?: string | ReturnType<typeof deleteField>;
  } = {
    finalLabels: cleanFinalLabels,
    updatedAt: timestamp,
  };

  if (hasKeeper) {
    if (phenotype.promotedCloneId) {
      batch.update(doc(db, "clones", phenotype.promotedCloneId), {
        phenoHunted: true,
        finalLabels: cleanFinalLabels,
        sourceProjectId: project.id,
        sourcePlantId: plant.id,
        sourcePhenotypeId: phenotype.id,
      });
    } else {
      const cloneRef = doc(collection(db, "clones"));
      const promotedClone = createPromotedClone({
        project,
        group,
        phenotype: {
          ...phenotype,
          finalLabels: cleanFinalLabels,
        },
        plant,
      });

      batch.set(cloneRef, removeUndefinedFields(promotedClone));
      phenotypeUpdates.promotedCloneId = cloneRef.id;
    }
  }

  if (hadKeeper && !hasKeeper && phenotype.promotedCloneId) {
    if (!keeperRemovalCloneAction) {
      throw new Error("Choose what to do with the promoted clone.");
    }

    const cloneRef = doc(db, "clones", phenotype.promotedCloneId);

    if (keeperRemovalCloneAction === "delete") {
      batch.delete(cloneRef);
    } else {
      batch.update(cloneRef, {
        phenoHunted: false,
        finalLabels: cleanFinalLabels,
        sourceProjectId: deleteField(),
        sourcePlantId: deleteField(),
        sourcePhenotypeId: deleteField(),
      });
    }

    phenotypeUpdates.promotedCloneId = deleteField();
  }

  batch.update(phenotypeRef, phenotypeUpdates);
  await batch.commit();
};

export const updatePhysicalPlant = async ({
  plant,
  displayId,
  lifecycleState,
  stageDate,
  stageNotes,
  photoIds,
}: UpdatePhysicalPlantInput) => {
  await assertUserCanWrite(plant.ownerId);

  if (!plant.id) {
    throw new Error("Plant ID is required.");
  }

  const cleanDisplayId = displayId.trim();
  if (!cleanDisplayId) {
    throw new Error("Plant ID cannot be blank.");
  }

  const timestamp = nowIsoString();
  const cleanStageNotes = stageNotes?.trim();
  const lifecycleChanged = lifecycleState !== plant.lifecycleState;
  const shouldCreateStageEvent = lifecycleChanged || Boolean(cleanStageNotes);
  if (shouldCreateStageEvent && !stageDate) {
    throw new Error("Lifecycle date is required when saving lifecycle history.");
  }

  const displayIdChanged = cleanDisplayId !== plant.displayId;
  const batch = writeBatch(db);

  batch.update(
    doc(db, V2_COLLECTIONS.physicalPlants, plant.id),
    removeUndefinedFields({
      displayId: cleanDisplayId,
      lifecycleState,
      photoIds: photoIds ?? [],
      hasUserData:
        plant.hasUserData ||
        lifecycleChanged ||
        displayIdChanged ||
        shouldCreateStageEvent,
      updatedAt: timestamp,
    })
  );

  if (plant.lifecycleState === "planned" && lifecycleState !== "planned") {
    batch.update(doc(db, V2_COLLECTIONS.projects, plant.projectId), {
      status: "in_progress",
      updatedAt: timestamp,
    });
  }

  if (displayIdChanged && plant.phenotypeId) {
    batch.update(doc(db, V2_COLLECTIONS.phenotypes, plant.phenotypeId), {
      displayName: cleanDisplayId,
      updatedAt: timestamp,
    });
  }

  if (shouldCreateStageEvent) {
    const stageEventRef = doc(collectionRef(V2_COLLECTIONS.plantStageEvents));
    batch.set(
      stageEventRef,
      removeUndefinedFields<PlantStageEvent>({
        id: stageEventRef.id,
        ownerId: plant.ownerId,
        projectId: plant.projectId,
        plantId: plant.id,
        state: lifecycleState,
        date: stageDate,
        notes: cleanStageNotes,
        createdAt: timestamp,
      })
    );
  }

  await batch.commit();
};
