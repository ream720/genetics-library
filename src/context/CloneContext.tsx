import { createContext, useState, useContext } from "react";
import { Clone } from "../types";

interface CloneContextProps {
  clones: Clone[];
  addClone: (clone: Clone) => void;
  updateClone: (id: string, updatedClone: Partial<Clone>) => void;
  deleteClone: (id: string) => void;
}

const CloneContext = createContext<CloneContextProps | undefined>(undefined);

export const CloneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [clones, setClones] = useState<Clone[]>([]);

  const addClone = (clone: Clone) => {
    setClones((prev) => [...prev, clone]);
  };

  const updateClone = (id: string, updatedClone: Partial<Clone>) => {
    setClones((prev) =>
      prev.map((clone) =>
        clone.id === id ? { ...clone, ...updatedClone } : clone
      )
    );
  };

  const deleteClone = (id: string) => {
    setClones((prev) => prev.filter((clone) => clone.id !== id));
  };

  return (
    <CloneContext.Provider
      value={{ clones, addClone, updateClone, deleteClone }}
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
