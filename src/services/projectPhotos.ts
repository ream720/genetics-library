import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
  updateMetadata,
} from "firebase/storage";
import { app } from "../../firebaseConfig";
import { removeUndefinedFields } from "../lib/v2/firestore";
import {
  projectMediaPath,
  V2_COLLECTIONS,
} from "../lib/v2/projectPaths";
import {
  ProjectPhoto,
  ProjectPhotoContentType,
  ProjectPhotoContextType,
} from "../types/v2";

const db = getFirestore(app);
const storage = getStorage(app);

const MAX_SOURCE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2048;
const IMAGE_QUALITY = 0.85;
const ALLOWED_CONTENT_TYPES = new Set<ProjectPhotoContentType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface ProcessedImage {
  blob: Blob;
  contentType: ProjectPhotoContentType;
  width: number;
  height: number;
}

interface UploadProjectPhotoInput {
  ownerId: string;
  projectId: string;
  contextType: ProjectPhotoContextType;
  contextId: string;
  file: File;
  caption?: string;
}

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read this image."));
    };
    image.src = objectUrl;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  contentType: ProjectPhotoContentType
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to process this image."));
        }
      },
      contentType,
      contentType === "image/png" ? undefined : IMAGE_QUALITY
    );
  });

const processProjectImage = async (file: File): Promise<ProcessedImage> => {
  if (!ALLOWED_CONTENT_TYPES.has(file.type as ProjectPhotoContentType)) {
    throw new Error("Upload a JPEG, PNG, or WebP image.");
  }

  if (file.size > MAX_SOURCE_SIZE_BYTES) {
    throw new Error("Each image must be 10 MB or smaller.");
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / image.naturalWidth,
    MAX_IMAGE_DIMENSION / image.naturalHeight
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not available in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  const contentType = file.type as ProjectPhotoContentType;

  const blob = await canvasToBlob(canvas, contentType);
  if (blob.size > MAX_SOURCE_SIZE_BYTES) {
    throw new Error(
      "The processed image is still larger than 10 MB. Try a smaller image."
    );
  }

  return {
    blob,
    contentType,
    width,
    height,
  };
};

const extensionForContentType = (contentType: ProjectPhotoContentType) => {
  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/png") {
    return "png";
  }

  return "webp";
};

const storageObjectMissing = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  String((error as { code?: unknown }).code) === "storage/object-not-found";

export const createProjectPhotoContextId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `photo-context-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const uploadProjectPhoto = async ({
  ownerId,
  projectId,
  contextType,
  contextId,
  file,
  caption,
}: UploadProjectPhotoInput): Promise<ProjectPhoto> => {
  if (!contextId) {
    throw new Error("Photo context is required.");
  }

  const processedImage = await processProjectImage(file);
  const photoRef = doc(collection(db, V2_COLLECTIONS.projectPhotos));
  const storagePath = projectMediaPath({
    ownerId,
    projectId,
    contextType,
    contextId,
    photoId: photoRef.id,
    extension: extensionForContentType(processedImage.contentType),
  });
  const imageRef = storageRef(storage, storagePath);

  await uploadBytes(imageRef, processedImage.blob, {
    contentType: processedImage.contentType,
    customMetadata: {
      photoId: photoRef.id,
      ownerId,
      projectId,
      contextType,
      contextId,
    },
  });

  const photo = removeUndefinedFields<ProjectPhoto>({
    id: photoRef.id,
    ownerId,
    projectId,
    contextType,
    contextId,
    storagePath,
    contentType: processedImage.contentType,
    sizeBytes: processedImage.blob.size,
    width: processedImage.width,
    height: processedImage.height,
    caption: caption?.trim(),
    createdAt: new Date().toISOString(),
  });

  try {
    await writeBatch(db).set(photoRef, photo).commit();
  } catch (error) {
    await deleteObject(imageRef).catch(() => undefined);
    throw error;
  }

  return photo;
};

export const getProjectPhotos = async (
  photoIds: string[],
  ownerId: string
): Promise<ProjectPhoto[]> => {
  const uniquePhotoIds = Array.from(new Set(photoIds.filter(Boolean)));
  const photos = await Promise.all(
    uniquePhotoIds.map(async (photoId) => {
      const snapshot = await getDoc(
        doc(db, V2_COLLECTIONS.projectPhotos, photoId)
      );

      if (!snapshot.exists()) {
        return null;
      }

      const photo = {
        id: snapshot.id,
        ...snapshot.data(),
      } as ProjectPhoto;

      return photo.ownerId === ownerId ? photo : null;
    })
  );

  return photos.filter((photo): photo is ProjectPhoto => photo !== null);
};

export const createProjectPhotoDisplayUrl = async (photo: ProjectPhoto) => {
  return getDownloadURL(storageRef(storage, photo.storagePath));
};

export const updateProjectPhotoCaption = async (
  photoId: string,
  caption: string
) => {
  await updateDoc(doc(db, V2_COLLECTIONS.projectPhotos, photoId), {
    caption: caption.trim(),
  });
};

export const reassignProjectPhotos = async (
  photoIds: string[],
  contextId: string
) => {
  if (!contextId || photoIds.length === 0) {
    return;
  }

  const uniquePhotoIds = Array.from(new Set(photoIds));
  const photos = (
    await Promise.all(
      uniquePhotoIds.map(async (photoId) => {
        const snapshot = await getDoc(
          doc(db, V2_COLLECTIONS.projectPhotos, photoId)
        );
        if (!snapshot.exists()) {
          return null;
        }

        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as ProjectPhoto;
      })
    )
  ).filter((photo): photo is ProjectPhoto => photo !== null);

  await Promise.all(
    photos.map((photo) =>
      updateMetadata(storageRef(storage, photo.storagePath), {
        customMetadata: {
          photoId: photo.id ?? "",
          ownerId: photo.ownerId,
          projectId: photo.projectId,
          contextType: photo.contextType,
          contextId,
        },
      })
    )
  );

  const batch = writeBatch(db);
  uniquePhotoIds.forEach((photoId) => {
    batch.update(doc(db, V2_COLLECTIONS.projectPhotos, photoId), {
      contextId,
    });
  });
  await batch.commit();
};

export const deleteProjectPhoto = async (photo: ProjectPhoto) => {
  try {
    await deleteObject(storageRef(storage, photo.storagePath));
  } catch (error) {
    if (!storageObjectMissing(error)) {
      throw error;
    }
  }

  if (photo.id) {
    await deleteDoc(doc(db, V2_COLLECTIONS.projectPhotos, photo.id));
  }
};

export const deleteProjectPhotosByIds = async (
  photoIds: string[],
  ownerId: string
) => {
  const photos = await getProjectPhotos(photoIds, ownerId);
  await Promise.all(photos.map(deleteProjectPhoto));
};
