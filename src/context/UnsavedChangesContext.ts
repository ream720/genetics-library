import { createContext, useContext } from "react";

export interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
  confirmNavigation: () => boolean;
}

export const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used inside UnsavedChangesProvider."
    );
  }

  return context;
};
