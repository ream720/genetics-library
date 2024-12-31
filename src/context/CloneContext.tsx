import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Clone } from "../types";
import { app } from "../../firebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

interface CloneContextProps {
  clones: Clone[];
  addClone: (clone: Clone) => Promise<void>;
  updateClone: (id: string, updatedClone: Partial<Clone>) => Promise<void>;
  deleteClone: (id: string) => Promise<void>;
  refetchClones: () => Promise<void>;
  setClones: React.Dispatch<React.SetStateAction<Clone[]>>;
}

const CloneContext = createContext<CloneContextProps | undefined>(undefined);

const db = getFirestore(app);
const clonesCollectionRef = collection(db, "clones");

export const CloneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [clones, setClones] = useState<Clone[]>([]);
  const { currentUser } = useAuth();

  const fetchClones = useCallback(async () => {
    try {
      if (!currentUser) {
        setClones([]);
        return;
      }
      const q = query(
        clonesCollectionRef,
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const clonesData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Clone)
      );
      setClones(clonesData);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  }, [currentUser]);

  const addClone = async (clone: Clone) => {
    console.log("addClone called");
    try {
      if (!currentUser) {
        console.error("Cannot add clone: User not logged in.");
        return; // Prevent adding clones when not logged in
      }

      const cloneData = {
        ...clone,
        userId: currentUser.uid, // Always set userId
      };

      console.log("Attempting Firestore write (addDoc)");
      const docRef = await addDoc(clonesCollectionRef, cloneData); // Let Firestore generate ID
      console.log("Firestore write successful (addDoc)");

      // Optimistic Update: Add to local state immediately, using Firestore ID
      setClones((prevClones) => [
        ...prevClones,
        { ...cloneData, id: docRef.id } as Clone, // Include Firestore ID
      ]);
    } catch (error) {
      console.error("Error adding document: ", error);

      // No rollback needed as the optimistic update includes the Firestore ID.

      throw error;
    }
  };

  const updateClone = async (id: string, updatedClone: Partial<Clone>) => {
    try {
      const cloneDocRef = doc(db, "clones", id);

      // Optimistic Update
      setClones((prevClones) =>
        prevClones.map((c) => (c.id === id ? { ...c, ...updatedClone } : c))
      );

      await updateDoc(cloneDocRef, updatedClone);
    } catch (error) {
      console.error("Error updating document: ", error);

      // Rollback
      await fetchClones();

      throw error;
    }
  };

  const deleteClone = async (id: string) => {
    try {
      // Optimistic Update
      setClones((prevClones) => prevClones.filter((c) => c.id !== id));

      await deleteDoc(doc(db, "clones", id));
    } catch (error) {
      console.error("Error deleting document: ", error);

      // Rollback
      await fetchClones();

      throw error;
    }
  };

  const refetchClones = useCallback(async () => {
    await fetchClones();
  }, [fetchClones]);

  useEffect(() => {
    fetchClones();
  }, [fetchClones]);

  return (
    <CloneContext.Provider
      value={{
        clones,
        addClone,
        updateClone,
        deleteClone,
        refetchClones,
        setClones,
      }}
    >
      {children}
    </CloneContext.Provider>
  );
};

export const useCloneContext = (): CloneContextProps => {
  const context = useContext(CloneContext);
  if (!context) {
    throw new Error("useCloneContext must be used within a CloneProvider");
  }
  return context;
};
