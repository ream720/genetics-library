import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebaseConfig";
import { removeUndefinedFields } from "../lib/v2/firestore";
import { V2_COLLECTIONS } from "../lib/v2/projectPaths";
import {
  assertCurrentUserCanWrite,
  assertUserCanWrite,
} from "./legalAcceptance";
import {
  ProjectAddendum,
  ProjectBase,
  ProjectStatus,
} from "../types/v2";

const db = getFirestore(app);
const functions = getFunctions(app);

type ProjectSnapshot =
  | QueryDocumentSnapshot<DocumentData>
  | DocumentSnapshot<DocumentData>;

export type CreateProjectInput = Pick<
  ProjectBase,
  "ownerId" | "type" | "name" | "objective" | "startDate" | "sourceSnapshots"
> & {
  status?: ProjectStatus;
};

export type UpdateProjectInput = Partial<
  Pick<ProjectBase, "name" | "objective" | "startDate" | "status">
>;

export type CreateProjectAddendumInput = Pick<
  ProjectAddendum,
  "ownerId" | "projectId" | "text"
> & {
  photoIds?: string[];
};

export const projectsCollectionRef = () =>
  collection(db, V2_COLLECTIONS.projects);

export const projectDocRef = (projectId: string) =>
  doc(db, V2_COLLECTIONS.projects, projectId);

export const userProjectsQuery = (ownerId: string) =>
  query(projectsCollectionRef(), where("ownerId", "==", ownerId));

const nowIsoString = () => new Date().toISOString();

const mapProjectSnapshot = (snapshot: ProjectSnapshot): ProjectBase | null => {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ProjectBase;
};

const mapProjectAddendumSnapshot = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): ProjectAddendum => ({
  id: snapshot.id,
  ...snapshot.data(),
} as ProjectAddendum);

export const getUserProjects = async (ownerId: string): Promise<ProjectBase[]> => {
  const snapshot = await getDocs(userProjectsQuery(ownerId));
  return snapshot.docs
    .map(mapProjectSnapshot)
    .filter((project): project is ProjectBase => project !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getProject = async (
  projectId: string
): Promise<ProjectBase | null> => {
  const snapshot = await getDoc(projectDocRef(projectId));
  return mapProjectSnapshot(snapshot);
};

export const createProject = async (
  input: CreateProjectInput
): Promise<ProjectBase> => {
  await assertUserCanWrite(input.ownerId);

  const timestamp = nowIsoString();
  const project: Omit<ProjectBase, "id"> = {
    ...input,
    status: input.status ?? "planning",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const cleanProject = removeUndefinedFields(project);
  const docRef = await addDoc(projectsCollectionRef(), cleanProject);
  return {
    ...cleanProject,
    id: docRef.id,
  };
};

export const updateProject = async (
  projectId: string,
  updates: UpdateProjectInput
) => {
  await assertCurrentUserCanWrite();

  const timestamp = nowIsoString();
  await updateDoc(
    projectDocRef(projectId),
    removeUndefinedFields({
      ...updates,
      updatedAt: timestamp,
      ...(updates.status === "complete" ? { completedAt: timestamp } : {}),
    })
  );
};

export const getProjectAddenda = async (
  projectId: string,
  ownerId: string
): Promise<ProjectAddendum[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, V2_COLLECTIONS.projectAddenda),
      where("projectId", "==", projectId),
      where("ownerId", "==", ownerId)
    )
  );

  return snapshot.docs
    .map(mapProjectAddendumSnapshot)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const createProjectAddendum = async ({
  ownerId,
  projectId,
  text,
  photoIds,
}: CreateProjectAddendumInput): Promise<ProjectAddendum> => {
  await assertUserCanWrite(ownerId);

  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Addendum text is required.");
  }

  const timestamp = nowIsoString();
  const addendum: Omit<ProjectAddendum, "id"> = {
    ownerId,
    projectId,
    text: cleanText,
    photoIds: photoIds ?? [],
    createdAt: timestamp,
  };
  const cleanAddendum = removeUndefinedFields(addendum);
  const docRef = await addDoc(
    collection(db, V2_COLLECTIONS.projectAddenda),
    cleanAddendum
  );

  return {
    ...cleanAddendum,
    id: docRef.id,
  };
};

interface DeleteProjectResult {
  deletedChildRecordCount: number;
  deletedMediaFileCount: number;
}

const deleteProjectDataCallable = httpsCallable<
  { projectId: string },
  DeleteProjectResult
>(functions, "deleteProjectData");

export const deleteProject = async (
  projectId: string
): Promise<DeleteProjectResult> =>
  (await deleteProjectDataCallable({ projectId })).data;
