import React, { createContext, useContext, useState } from "react";
import { Seed } from "../types";

interface SeedContextProps {
  seeds: Seed[];
  addSeed: (seed: Seed) => void;
  updateSeed: (id: string, updatedSeed: Partial<Seed>) => void;
  deleteSeed: (id: string) => void;
}

const SeedContext = createContext<SeedContextProps | undefined>(undefined);

export const SeedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const addSeed = (seed: Seed) => {
    setSeeds((prev) => [...prev, seed]);
  };

  const updateSeed = (id: string, updatedSeed: Partial<Seed>) => {
    setSeeds((prev) =>
      prev.map((seed) => (seed.id === id ? { ...seed, ...updatedSeed } : seed))
    );
  };

  const deleteSeed = (id: string) => {
    setSeeds((prev) => prev.filter((seed) => seed.id !== id));
  };

  return (
    <SeedContext.Provider value={{ seeds, addSeed, updateSeed, deleteSeed }}>
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
