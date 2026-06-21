import test, { after, before, beforeEach } from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getMetadata,
  ref,
  updateMetadata,
  uploadString,
} from "firebase/storage";

const PROJECT_ID = "demo-genetics-library-v2";
const OWNER_ID = "owner-user";
const OTHER_USER_ID = "other-user";
const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const firestoreRules = fs.readFileSync(
  path.join(ROOT_DIR, "firestore.rules"),
  "utf8"
);
const storageRules = fs.readFileSync(
  path.join(ROOT_DIR, "storage.rules"),
  "utf8"
);

const emulatorAddress = (environmentName, fallbackPort) => {
  const value = process.env[environmentName];
  if (!value) {
    return { host: "127.0.0.1", port: fallbackPort };
  }

  const [host, port] = value.split(":");
  return { host, port: Number(port) };
};

const firestoreEmulator = emulatorAddress("FIRESTORE_EMULATOR_HOST", 8080);
const storageEmulator = emulatorAddress(
  "FIREBASE_STORAGE_EMULATOR_HOST",
  9199
);

let testEnv;

const projectData = (status, ownerId = OWNER_ID) => ({
  ownerId,
  type: "pheno_hunt",
  name: `${status} project`,
  objective: "Rules validation",
  status,
  startDate: "2026-06-21",
  createdAt: "2026-06-21T00:00:00.000Z",
  updatedAt: "2026-06-21T00:00:00.000Z",
  sourceSnapshots: [],
});

const childData = (projectId, ownerId = OWNER_ID) => ({
  ownerId,
  projectId,
  displayId: "Test Plant #1",
  lifecycleState: "planned",
});

const photoData = ({
  projectId,
  contextType,
  contextId,
  ownerId = OWNER_ID,
}) => ({
  ownerId,
  projectId,
  contextType,
  contextId,
  storagePath: `projectMedia/${ownerId}/${projectId}/${contextType}/${contextId}/photo.jpg`,
  contentType: "image/jpeg",
  sizeBytes: 5,
  createdAt: "2026-06-21T00:00:00.000Z",
});

const storageMetadata = ({
  projectId,
  contextType,
  contextId,
  ownerId = OWNER_ID,
  photoId = "photo-1",
}) => ({
  contentType: "image/jpeg",
  customMetadata: {
    photoId,
    ownerId,
    projectId,
    contextType,
    contextId,
  },
});

const seedFirestore = async (entries) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await Promise.all(
      entries.map(([documentPath, data]) =>
        setDoc(doc(context.firestore(), documentPath), data)
      )
    );
  });
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      ...firestoreEmulator,
      rules: firestoreRules,
    },
    storage: {
      ...storageEmulator,
      rules: storageRules,
    },
  });
});

beforeEach(async () => {
  await Promise.all([testEnv.clearFirestore(), testEnv.clearStorage()]);
});

after(async () => {
  await testEnv.cleanup();
});

test("project access is private and direct project deletion is denied", async () => {
  await seedFirestore([["projects/active-project", projectData("in_progress")]]);

  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER_USER_ID).firestore();
  const anonymousDb = testEnv.unauthenticatedContext().firestore();
  const projectRef = doc(ownerDb, "projects/active-project");

  await assertSucceeds(getDoc(projectRef));
  await assertSucceeds(
    getDocs(
      query(
        collection(ownerDb, "projects"),
        where("ownerId", "==", OWNER_ID)
      )
    )
  );
  await assertSucceeds(
    updateDoc(projectRef, {
      objective: "Owner update",
      updatedAt: "2026-06-22T00:00:00.000Z",
    })
  );
  await assertFails(deleteDoc(projectRef));

  await assertFails(getDoc(doc(otherDb, "projects/active-project")));
  await assertFails(
    getDocs(
      query(
        collection(otherDb, "projects"),
        where("ownerId", "==", OWNER_ID)
      )
    )
  );
  await assertFails(getDoc(doc(anonymousDb, "projects/active-project")));
});

test("users can create only projects owned by their authenticated identity", async () => {
  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const anonymousDb = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(
    setDoc(doc(ownerDb, "projects/owned-project"), projectData("planning"))
  );
  await assertFails(
    setDoc(
      doc(ownerDb, "projects/forged-project"),
      projectData("planning", OTHER_USER_ID)
    )
  );
  await assertFails(
    setDoc(
      doc(anonymousDb, "projects/anonymous-project"),
      projectData("planning")
    )
  );
});

test("active child records are owner-writable and private", async () => {
  await seedFirestore([["projects/active-project", projectData("in_progress")]]);

  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER_USER_ID).firestore();
  const plantRef = doc(ownerDb, "physicalPlants/plant-1");

  await assertSucceeds(
    setDoc(plantRef, childData("active-project"))
  );
  await assertSucceeds(getDoc(plantRef));
  await assertSucceeds(
    updateDoc(plantRef, { lifecycleState: "vegetative" })
  );
  await assertFails(getDoc(doc(otherDb, "physicalPlants/plant-1")));
  await assertFails(
    setDoc(
      doc(otherDb, "physicalPlants/other-plant"),
      childData("active-project", OTHER_USER_ID)
    )
  );
  await assertSucceeds(deleteDoc(plantRef));
});

test("completed projects and their result records are immutable", async () => {
  await seedFirestore([
    ["projects/complete-project", projectData("complete")],
    ["physicalPlants/plant-1", childData("complete-project")],
  ]);

  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const projectRef = doc(ownerDb, "projects/complete-project");
  const plantRef = doc(ownerDb, "physicalPlants/plant-1");

  await assertSucceeds(getDoc(projectRef));
  await assertSucceeds(getDoc(plantRef));
  await assertFails(updateDoc(projectRef, { objective: "Changed" }));
  await assertFails(
    setDoc(
      doc(ownerDb, "physicalPlants/new-plant"),
      childData("complete-project")
    )
  );
  await assertFails(updateDoc(plantRef, { lifecycleState: "harvested" }));
  await assertFails(deleteDoc(plantRef));
});

test("addenda are complete-project-only and append-only", async () => {
  await seedFirestore([
    ["projects/active-project", projectData("in_progress")],
    ["projects/complete-project", projectData("complete")],
  ]);

  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const otherDb = testEnv.authenticatedContext(OTHER_USER_ID).firestore();
  const addendumRef = doc(ownerDb, "projectAddenda/addendum-1");
  const addendum = {
    ownerId: OWNER_ID,
    projectId: "complete-project",
    text: "Follow-up",
    photoIds: [],
    createdAt: "2026-06-21T00:00:00.000Z",
  };

  await assertFails(
    setDoc(doc(ownerDb, "projectAddenda/active-addendum"), {
      ...addendum,
      projectId: "active-project",
    })
  );
  await assertSucceeds(setDoc(addendumRef, addendum));
  await assertSucceeds(getDoc(addendumRef));
  await assertFails(updateDoc(addendumRef, { text: "Changed" }));
  await assertFails(deleteDoc(addendumRef));
  await assertFails(getDoc(doc(otherDb, "projectAddenda/addendum-1")));
});

test("completed-project photo metadata permits drafts then locks saved addenda", async () => {
  await seedFirestore([["projects/complete-project", projectData("complete")]]);

  const ownerDb = testEnv.authenticatedContext(OWNER_ID).firestore();
  const draftPhotoRef = doc(ownerDb, "projectPhotos/photo-1");

  await assertSucceeds(
    setDoc(
      draftPhotoRef,
      photoData({
        projectId: "complete-project",
        contextType: "addendum",
        contextId: "draft-context",
      })
    )
  );
  await assertSucceeds(updateDoc(draftPhotoRef, { caption: "Draft" }));

  await assertSucceeds(
    setDoc(doc(ownerDb, "projectAddenda/addendum-1"), {
      ownerId: OWNER_ID,
      projectId: "complete-project",
      text: "Saved addendum",
      photoIds: ["photo-1"],
      createdAt: "2026-06-21T00:00:00.000Z",
    })
  );
  await assertSucceeds(
    updateDoc(draftPhotoRef, { contextId: "addendum-1" })
  );
  await assertFails(updateDoc(draftPhotoRef, { caption: "Changed" }));
  await assertFails(deleteDoc(draftPhotoRef));
});

test("active project media is private and owner-writable", async () => {
  await seedFirestore([["projects/active-project", projectData("in_progress")]]);

  const ownerStorage = testEnv.authenticatedContext(OWNER_ID).storage();
  const otherStorage = testEnv.authenticatedContext(OTHER_USER_ID).storage();
  const anonymousStorage = testEnv.unauthenticatedContext().storage();
  const objectPath =
    "projectMedia/owner-user/active-project/plant/plant-1/photo.jpg";
  const ownerRef = ref(ownerStorage, objectPath);
  const metadata = storageMetadata({
    projectId: "active-project",
    contextType: "plant",
    contextId: "plant-1",
  });

  await assertSucceeds(uploadString(ownerRef, "photo", "raw", metadata));
  await assertSucceeds(getMetadata(ownerRef));
  await assertSucceeds(
    updateMetadata(ownerRef, {
      ...metadata,
      customMetadata: {
        ...metadata.customMetadata,
        caption: "Updated",
      },
    })
  );
  await assertFails(getMetadata(ref(otherStorage, objectPath)));
  await assertFails(deleteObject(ref(otherStorage, objectPath)));
  await assertFails(getMetadata(ref(anonymousStorage, objectPath)));
  await assertSucceeds(deleteObject(ownerRef));
});

test("completed core media is locked while addendum drafts remain usable", async () => {
  await seedFirestore([["projects/active-project", projectData("in_progress")]]);

  const ownerContext = testEnv.authenticatedContext(OWNER_ID);
  const ownerStorage = ownerContext.storage();
  const ownerDb = ownerContext.firestore();
  const corePath =
    "projectMedia/owner-user/active-project/plant/plant-1/core.jpg";
  const coreRef = ref(ownerStorage, corePath);
  const coreMetadata = storageMetadata({
    projectId: "active-project",
    contextType: "plant",
    contextId: "plant-1",
    photoId: "core-photo",
  });

  await assertSucceeds(uploadString(coreRef, "photo", "raw", coreMetadata));
  await testEnv.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), "projects/active-project"), {
      status: "complete",
    })
  );
  await assertSucceeds(getMetadata(coreRef));
  await assertFails(updateMetadata(coreRef, coreMetadata));
  await assertFails(deleteObject(coreRef));

  const draftPath =
    "projectMedia/owner-user/active-project/addendum/draft-context/addendum.jpg";
  const draftRef = ref(ownerStorage, draftPath);
  const draftMetadata = storageMetadata({
    projectId: "active-project",
    contextType: "addendum",
    contextId: "draft-context",
    photoId: "addendum-photo",
  });

  await assertSucceeds(uploadString(draftRef, "photo", "raw", draftMetadata));
  await assertSucceeds(
    setDoc(doc(ownerDb, "projectAddenda/addendum-1"), {
      ownerId: OWNER_ID,
      projectId: "active-project",
      text: "Saved addendum",
      photoIds: ["addendum-photo"],
      createdAt: "2026-06-21T00:00:00.000Z",
    })
  );
  await assertSucceeds(
    updateMetadata(draftRef, {
      ...draftMetadata,
      customMetadata: {
        ...draftMetadata.customMetadata,
        contextId: "addendum-1",
      },
    })
  );
  await assertFails(deleteObject(draftRef));
});
