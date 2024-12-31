import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Seed } from "../types";
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

interface SeedContextProps {
  seeds: Seed[];
  addSeed: (seed: Seed) => Promise<void>;
  updateSeed: (id: string, updatedSeed: Partial<Seed>) => Promise<void>;
  deleteSeed: (id: string) => Promise<void>;
  refetchSeeds: () => Promise<void>; // Function to manually refresh seeds
  setSeeds: React.Dispatch<React.SetStateAction<Seed[]>>; // Add this line
}

const SeedContext = createContext<SeedContextProps | undefined>(undefined);

const db = getFirestore(app);
const seedsCollectionRef = collection(db, "seeds");

export const SeedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const { currentUser } = useAuth();

  const fetchSeeds = useCallback(async () => {
    try {
      if (!currentUser) {
        setSeeds([]);
        return;
      }
      const q = query(
        seedsCollectionRef,
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const seedsData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id, // Use Firestore-generated ID
            ...doc.data(),
          } as Seed)
      );
      setSeeds(seedsData);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  }, [currentUser]);

  const addSeed = async (seed: Seed) => {
    console.log("addSeed called");
    try {
      if (!currentUser) {
        console.error("Cannot add seed: User not logged in.");
        return; // Prevent adding seeds when not logged in
      }

      const seedData = {
        ...seed,
        userId: currentUser.uid, // Always set userId
      };

      console.log("Attempting Firestore write (addDoc)");
      const docRef = await addDoc(seedsCollectionRef, seedData); // Let Firestore generate ID
      console.log("Firestore write successful (addDoc)");

      // Optimistic Update: Add to local state immediately, using Firestore ID
      setSeeds((prevSeeds) => [
        ...prevSeeds,
        { ...seedData, id: docRef.id } as Seed, // Include Firestore ID
      ]);
    } catch (error) {
      console.error("Error adding document: ", error);

      // Rollback: No need to rollback here, as we didn't add to local state yet.

      throw error;
    }
  };

  // const updateSeed = async (id: string, updatedSeed: Partial<Seed>) => {
  //   console.log("updateSeed called");
  //   try {
  //     const seedDocRef = doc(db, "seeds", id);

  //     // Optimistic Update: Update local state immediately
  //     setSeeds((prevSeeds) =>
  //       prevSeeds.map((s) => (s.id === id ? { ...s, ...updatedSeed } : s))
  //     );

  //     await updateDoc(seedDocRef, updatedSeed);
  //   } catch (error) {
  //     console.error("Error updating document: ", error);

  //     // Rollback: Revert to the original state on error
  //     // (You might need to store the original seed data temporarily for a more accurate rollback)
  //     await fetchSeeds();

  //     throw error;
  //   }
  // };

  const updateSeed = async (id: string, updatedSeed: Partial<Seed>) => {
    console.log("updateSeed called with ID:", id);
    console.log("Updated Seed Data:", updatedSeed);

    try {
      const seedDocRef = doc(db, "seeds", id);
      await updateDoc(seedDocRef, updatedSeed); // Update Firestore
      console.log("Firestore update successful for ID:", id);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  const deleteSeed = async (id: string) => {
    console.log("deleteSeed called with id: ", id); // Verify the ID
    try {
      // Optimistic Update: Remove from local state immediately
      setSeeds((prevSeeds) => prevSeeds.filter((s) => s.id !== id));

      console.log("Attempting Firestore delete with ID:", id); // Log ID right before deleteDoc
      await deleteDoc(doc(db, "seeds", id));
      console.log("Firestore delete successful"); // Log success
    } catch (error) {
      console.error("Error deleting document: ", error);

      // Rollback: Re-fetch the seeds to revert to original state on error
      await fetchSeeds();

      throw error;
    }
  };

  const refetchSeeds = useCallback(async () => {
    await fetchSeeds();
  }, [fetchSeeds]);

  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);

  return (
    <SeedContext.Provider
      value={{ seeds, addSeed, updateSeed, deleteSeed, refetchSeeds, setSeeds }}
    >
      {children}
    </SeedContext.Provider>
  );
};

export const useSeedContext = (): SeedContextProps => {
  const context = useContext(SeedContext);
  if (!context) {
    throw new Error("useSeedContext must be used within a SeedProvider");
  }
  return context;
};
