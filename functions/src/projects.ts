import { HttpsError } from "firebase-functions/v2/https";
import { adminDb, adminStorage } from "./lib/admin.js";

const PROJECT_CHILD_COLLECTIONS = [
  "projectAddenda",
  "projectPhotos",
  "phenoGroups",
  "phenotypes",
  "physicalPlants",
  "plantStageEvents",
  "plantEvaluations",
  "washSessions",
  "washRuns",
  "washCycles",
  "micronFractions",
  "pressRecords",
] as const;

interface ProjectPhotoRecord {
  storagePath?: unknown;
}

export interface DeleteProjectDataResult {
  deletedChildRecordCount: number;
  deletedMediaFileCount: number;
}

export function validateProjectId(data: unknown): string {
  const projectId =
    typeof data === "object" &&
    data !== null &&
    "projectId" in data &&
    typeof data.projectId === "string"
      ? data.projectId.trim()
      : "";

  if (!projectId || projectId.length > 200 || projectId.includes("/")) {
    throw new HttpsError("invalid-argument", "A valid project ID is required.");
  }

  return projectId;
}

async function deleteDocumentRefs(
  refs: FirebaseFirestore.DocumentReference[]
) {
  let deletedCount = 0;

  for (let index = 0; index < refs.length; index += 400) {
    const batch = adminDb.batch();
    refs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
    deletedCount += Math.min(400, refs.length - index);
  }

  return deletedCount;
}

export async function deleteOwnedProjectData(
  uid: string,
  projectId: string
): Promise<DeleteProjectDataResult> {
  const projectRef = adminDb.collection("projects").doc(projectId);
  const projectSnapshot = await projectRef.get();

  if (!projectSnapshot.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  if (projectSnapshot.get("ownerId") !== uid) {
    throw new HttpsError(
      "permission-denied",
      "You do not have access to this project."
    );
  }

  const childSnapshots = await Promise.all(
    PROJECT_CHILD_COLLECTIONS.map((collectionName) =>
      adminDb
        .collection(collectionName)
        .where("projectId", "==", projectId)
        .get()
    )
  );
  const photoSnapshot =
    childSnapshots[PROJECT_CHILD_COLLECTIONS.indexOf("projectPhotos")];
  const storagePaths = Array.from(
    new Set(
      photoSnapshot.docs
        .map((documentSnapshot) => {
          const storagePath = (
            documentSnapshot.data() as ProjectPhotoRecord
          ).storagePath;
          return typeof storagePath === "string" ? storagePath : "";
        })
        .filter(Boolean)
    )
  );

  await Promise.all(
    storagePaths.map((storagePath) =>
      adminStorage
        .bucket()
        .file(storagePath)
        .delete({ ignoreNotFound: true })
    )
  );

  let deletedChildRecordCount = 0;
  for (const snapshot of childSnapshots) {
    deletedChildRecordCount += await deleteDocumentRefs(
      snapshot.docs.map((documentSnapshot) => documentSnapshot.ref)
    );
  }

  await projectRef.delete();

  return {
    deletedChildRecordCount,
    deletedMediaFileCount: storagePaths.length,
  };
}
