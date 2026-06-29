import {
  collection,
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
import {
  calculateOverallRosinReturnPercent,
  calculateRthPercent,
  calculateRtrPercent,
  roundPercent,
  sumWeights,
} from "../lib/v2/calculations";
import { removeUndefinedFields } from "../lib/v2/firestore";
import { V2_COLLECTIONS } from "../lib/v2/projectPaths";
import { assertUserCanWrite } from "./legalAcceptance";
import {
  DryHashWeightSource,
  MaterialType,
  MicronFraction,
  PressRecord,
  ProjectBase,
  QualityStars,
  SourceType,
  WashCycle,
  WashRun,
  WashRunStage,
  WashRunType,
  WashSession,
  WashSource,
} from "../types/v2";

const db = getFirestore(app);

type WashSnapshot = QueryDocumentSnapshot<DocumentData>;

export interface WashProcessData {
  sessions: WashSession[];
  runs: WashRun[];
  cycles: WashCycle[];
  micronFractions: MicronFraction[];
  pressRecords: PressRecord[];
}

export interface SaveWashSessionInput {
  project: ProjectBase;
  sessionId?: string;
  date: string;
  name?: string;
  notes?: string;
  photoIds?: string[];
}

export interface WashCycleInput {
  durationMinutes?: number;
  temperature?: string;
  notes?: string;
}

export interface MicronFractionInput {
  label: string;
  dryWeightGrams: number;
}

export interface PressRecordInput {
  hashInputWeightGrams?: number;
  rosinOutputWeightGrams?: number;
  sourceFractionIds?: string[];
  pressTemperature?: string;
  pressDuration?: string;
  pressure?: string;
  bagMicron?: string;
  notes?: string;
  photoIds?: string[];
}

export interface SaveWashRunInput {
  project: ProjectBase;
  sessionId: string;
  runId?: string;
  runType: WashRunType;
  stage?: WashRunStage;
  cultivarGroupName?: string;
  materialType: MaterialType;
  inputWeightGrams?: number;
  sources: WashSource[];
  plannedMicronRanges?: string[];
  iceless?: boolean;
  selectedDryHashWeightSource: DryHashWeightSource;
  manualDryHashWeightGrams?: number;
  resinCharacterTags?: string[];
  appearance?: string;
  qualityStars?: QualityStars;
  notes?: string;
  photoIds?: string[];
  cycles: WashCycleInput[];
  micronFractions: MicronFractionInput[];
  pressRecord?: PressRecordInput;
}

const emptyData: WashProcessData = {
  sessions: [],
  runs: [],
  cycles: [],
  micronFractions: [],
  pressRecords: [],
};

const nowIsoString = () => new Date().toISOString();

const collectionRef = (collectionName: string) =>
  collection(db, collectionName);

const mapSnapshot = <T extends { id?: string }>(snapshot: WashSnapshot): T => ({
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

const runOwnerQuery = (
  collectionName: string,
  projectId: string,
  ownerId: string,
  runId: string
) =>
  query(
    collectionRef(collectionName),
    where("projectId", "==", projectId),
    where("ownerId", "==", ownerId),
    where("runId", "==", runId)
  );

const sortSessions = (sessions: WashSession[]) =>
  [...sessions].sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);
    return dateComparison !== 0
      ? dateComparison
      : b.createdAt.localeCompare(a.createdAt);
  });

const sortRuns = (runs: WashRun[]) =>
  [...runs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const sortCycles = (cycles: WashCycle[]) =>
  [...cycles].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const sortFractions = (fractions: MicronFraction[]) =>
  [...fractions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const cleanWashSources = (sources: WashSource[]): WashSource[] =>
  sources
    .map((source) =>
      removeUndefinedFields<WashSource>({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        breeder: source.breeder?.trim(),
        strain: source.strain?.trim(),
        phenotypeId: source.phenotypeId,
        cloneId: source.cloneId,
        startingWeightGrams: source.startingWeightGrams,
        proportionPercent: source.proportionPercent,
        snapshot: source.snapshot,
      })
    )
    .filter(
      (source) =>
        source.sourceType !== "ad_hoc" ||
        Boolean(source.breeder || source.strain || source.snapshot)
    );

export const makeAdHocWashSource = ({
  breeder,
  strain,
  sourceType = "ad_hoc",
  startingWeightGrams,
  proportionPercent,
}: {
  breeder?: string;
  strain?: string;
  sourceType?: SourceType;
  startingWeightGrams?: number;
  proportionPercent?: number;
}): WashSource =>
  removeUndefinedFields<WashSource>({
    sourceType,
    breeder: breeder?.trim(),
    strain: strain?.trim(),
    startingWeightGrams,
    proportionPercent,
  });

export const getWashProcessData = async (
  projectId: string,
  ownerId: string
): Promise<WashProcessData> => {
  if (!projectId) {
    return emptyData;
  }

  const [
    sessionSnapshots,
    runSnapshots,
    cycleSnapshots,
    fractionSnapshots,
    pressRecordSnapshots,
  ] = await Promise.all([
    getDocs(projectOwnerQuery(V2_COLLECTIONS.washSessions, projectId, ownerId)),
    getDocs(projectOwnerQuery(V2_COLLECTIONS.washRuns, projectId, ownerId)),
    getDocs(projectOwnerQuery(V2_COLLECTIONS.washCycles, projectId, ownerId)),
    getDocs(
      projectOwnerQuery(V2_COLLECTIONS.micronFractions, projectId, ownerId)
    ),
    getDocs(projectOwnerQuery(V2_COLLECTIONS.pressRecords, projectId, ownerId)),
  ]);

  return {
    sessions: sortSessions(sessionSnapshots.docs.map(mapSnapshot<WashSession>)),
    runs: sortRuns(runSnapshots.docs.map(mapSnapshot<WashRun>)),
    cycles: sortCycles(cycleSnapshots.docs.map(mapSnapshot<WashCycle>)),
    micronFractions: sortFractions(
      fractionSnapshots.docs.map(mapSnapshot<MicronFraction>)
    ),
    pressRecords: pressRecordSnapshots.docs.map(mapSnapshot<PressRecord>),
  };
};

export const saveWashSession = async ({
  project,
  sessionId,
  date,
  name,
  notes,
  photoIds,
}: SaveWashSessionInput): Promise<string> => {
  await assertUserCanWrite(project.ownerId);

  if (!project.id) {
    throw new Error("Project ID is required.");
  }

  if (!date) {
    throw new Error("Session date is required.");
  }

  const timestamp = nowIsoString();
  const sessionRef = sessionId
    ? doc(db, V2_COLLECTIONS.washSessions, sessionId)
    : doc(collectionRef(V2_COLLECTIONS.washSessions));
  const sessionData = removeUndefinedFields({
    ownerId: project.ownerId,
    projectId: project.id,
    date,
    name: name?.trim(),
    notes: notes?.trim(),
    photoIds: photoIds ?? [],
    updatedAt: timestamp,
  });

  if (sessionId) {
    await updateDoc(sessionRef, sessionData);
  } else {
    await writeBatch(db)
      .set(sessionRef, {
        id: sessionRef.id,
        ...sessionData,
        createdAt: timestamp,
      })
      .commit();
  }

  return sessionRef.id;
};

export const deleteWashSession = async (
  session: WashSession,
  data: WashProcessData
) => {
  if (!session.id) {
    return;
  }

  const sessionRuns = data.runs.filter((run) => run.sessionId === session.id);
  const runIds = new Set(sessionRuns.map((run) => run.id).filter(Boolean));
  const batch = writeBatch(db);

  data.cycles
    .filter((cycle) => cycle.id && runIds.has(cycle.runId))
    .forEach((cycle) =>
      batch.delete(doc(db, V2_COLLECTIONS.washCycles, cycle.id as string))
    );
  data.micronFractions
    .filter((fraction) => fraction.id && runIds.has(fraction.runId))
    .forEach((fraction) =>
      batch.delete(
        doc(db, V2_COLLECTIONS.micronFractions, fraction.id as string)
      )
    );
  data.pressRecords
    .filter((pressRecord) => pressRecord.id && runIds.has(pressRecord.runId))
    .forEach((pressRecord) =>
      batch.delete(
        doc(db, V2_COLLECTIONS.pressRecords, pressRecord.id as string)
      )
    );
  sessionRuns
    .filter((run) => run.id)
    .forEach((run) =>
      batch.delete(doc(db, V2_COLLECTIONS.washRuns, run.id as string))
    );
  batch.delete(doc(db, V2_COLLECTIONS.washSessions, session.id));

  await batch.commit();
};

export const deleteWashRun = async (run: WashRun) => {
  if (!run.id) {
    return;
  }

  const [cycleSnapshots, fractionSnapshots, pressRecordSnapshots] =
    await Promise.all([
      getDocs(
        runOwnerQuery(
          V2_COLLECTIONS.washCycles,
          run.projectId,
          run.ownerId,
          run.id
        )
      ),
      getDocs(
        runOwnerQuery(
          V2_COLLECTIONS.micronFractions,
          run.projectId,
          run.ownerId,
          run.id
        )
      ),
      getDocs(
        runOwnerQuery(
          V2_COLLECTIONS.pressRecords,
          run.projectId,
          run.ownerId,
          run.id
        )
      ),
    ]);

  const batch = writeBatch(db);
  cycleSnapshots.docs.forEach((snapshot) =>
    batch.delete(doc(db, V2_COLLECTIONS.washCycles, snapshot.id))
  );
  fractionSnapshots.docs.forEach((snapshot) =>
    batch.delete(doc(db, V2_COLLECTIONS.micronFractions, snapshot.id))
  );
  pressRecordSnapshots.docs.forEach((snapshot) =>
    batch.delete(doc(db, V2_COLLECTIONS.pressRecords, snapshot.id))
  );
  batch.delete(doc(db, V2_COLLECTIONS.washRuns, run.id));

  await batch.commit();
};

export const saveWashRun = async ({
  project,
  sessionId,
  runId,
  runType,
  stage,
  cultivarGroupName,
  materialType,
  inputWeightGrams,
  sources,
  plannedMicronRanges,
  iceless,
  selectedDryHashWeightSource,
  manualDryHashWeightGrams,
  resinCharacterTags,
  appearance,
  qualityStars,
  notes,
  photoIds,
  cycles,
  micronFractions,
  pressRecord,
}: SaveWashRunInput): Promise<string> => {
  await assertUserCanWrite(project.ownerId);

  if (!project.id) {
    throw new Error("Project ID is required.");
  }

  if (!sessionId) {
    throw new Error("Session is required.");
  }

  const timestamp = nowIsoString();
  const runRef = runId
    ? doc(db, V2_COLLECTIONS.washRuns, runId)
    : doc(collectionRef(V2_COLLECTIONS.washRuns));
  const currentRunId = runRef.id;
  const batch = writeBatch(db);
  const calculatedFractionDryHashWeightGrams =
    micronFractions.length > 0
      ? sumWeights(micronFractions.map((fraction) => fraction.dryWeightGrams))
      : undefined;
  const effectiveDryHashWeightGrams =
    selectedDryHashWeightSource === "fraction_sum" &&
    calculatedFractionDryHashWeightGrams !== undefined
      ? calculatedFractionDryHashWeightGrams
      : manualDryHashWeightGrams;
  const rthPercent = roundPercent(
    calculateRthPercent(effectiveDryHashWeightGrams, inputWeightGrams)
  );
  const rtrPercent = roundPercent(
    calculateRtrPercent(
      pressRecord?.rosinOutputWeightGrams,
      pressRecord?.hashInputWeightGrams
    )
  );
  const overallRosinReturnPercent = roundPercent(
    calculateOverallRosinReturnPercent(
      pressRecord?.rosinOutputWeightGrams,
      inputWeightGrams
    )
  );
  const runData = removeUndefinedFields<WashRun>({
    id: currentRunId,
    ownerId: project.ownerId,
    projectId: project.id,
    sessionId,
    runType,
    stage,
    cultivarGroupName: cultivarGroupName?.trim(),
    materialType,
    inputWeightGrams,
    sources: cleanWashSources(sources),
    plannedMicronRanges,
    iceless,
    selectedDryHashWeightSource,
    manualDryHashWeightGrams,
    calculatedFractionDryHashWeightGrams,
    effectiveDryHashWeightGrams,
    rthPercent: rthPercent ?? undefined,
    resinCharacterTags,
    appearance: appearance?.trim(),
    qualityStars,
    notes: notes?.trim(),
    photoIds: photoIds ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (runId) {
    const updatedRunData = { ...runData };
    delete (updatedRunData as Partial<WashRun>).createdAt;
    batch.update(runRef, updatedRunData);

    const [cycleSnapshots, fractionSnapshots, pressRecordSnapshots] =
      await Promise.all([
        getDocs(
          runOwnerQuery(
            V2_COLLECTIONS.washCycles,
            project.id,
            project.ownerId,
            runId
          )
        ),
        getDocs(
          runOwnerQuery(
            V2_COLLECTIONS.micronFractions,
            project.id,
            project.ownerId,
            runId
          )
        ),
        getDocs(
          runOwnerQuery(
            V2_COLLECTIONS.pressRecords,
            project.id,
            project.ownerId,
            runId
          )
        ),
      ]);

    cycleSnapshots.docs.forEach((snapshot) =>
      batch.delete(doc(db, V2_COLLECTIONS.washCycles, snapshot.id))
    );
    fractionSnapshots.docs.forEach((snapshot) =>
      batch.delete(doc(db, V2_COLLECTIONS.micronFractions, snapshot.id))
    );
    pressRecordSnapshots.docs.forEach((snapshot) =>
      batch.delete(doc(db, V2_COLLECTIONS.pressRecords, snapshot.id))
    );
  } else {
    batch.set(runRef, runData);
  }

  cycles.forEach((cycle) => {
    const cycleRef = doc(collectionRef(V2_COLLECTIONS.washCycles));
    batch.set(
      cycleRef,
      removeUndefinedFields<WashCycle>({
        id: cycleRef.id,
        ownerId: project.ownerId,
        projectId: project.id,
        runId: currentRunId,
        durationMinutes: cycle.durationMinutes,
        temperature: cycle.temperature?.trim(),
        notes: cycle.notes?.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    );
  });

  micronFractions.forEach((fraction) => {
    const fractionRef = doc(collectionRef(V2_COLLECTIONS.micronFractions));
    batch.set(
      fractionRef,
      removeUndefinedFields<MicronFraction>({
        id: fractionRef.id,
        ownerId: project.ownerId,
        projectId: project.id,
        runId: currentRunId,
        label: fraction.label.trim(),
        dryWeightGrams: fraction.dryWeightGrams,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    );
  });

  if (pressRecord) {
    const pressRecordRef = doc(collectionRef(V2_COLLECTIONS.pressRecords));
    batch.set(
      pressRecordRef,
      removeUndefinedFields<PressRecord>({
        id: pressRecordRef.id,
        ownerId: project.ownerId,
        projectId: project.id,
        runId: currentRunId,
        hashInputWeightGrams: pressRecord.hashInputWeightGrams,
        rosinOutputWeightGrams: pressRecord.rosinOutputWeightGrams,
        sourceFractionIds: pressRecord.sourceFractionIds ?? [],
        pressTemperature: pressRecord.pressTemperature?.trim(),
        pressDuration: pressRecord.pressDuration?.trim(),
        pressure: pressRecord.pressure?.trim(),
        bagMicron: pressRecord.bagMicron?.trim(),
        rtrPercent: rtrPercent ?? undefined,
        overallRosinReturnPercent: overallRosinReturnPercent ?? undefined,
        notes: pressRecord.notes?.trim(),
        photoIds: pressRecord.photoIds ?? [],
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    );
  }

  await batch.commit();
  return currentRunId;
};
