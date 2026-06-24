import { useCallback, useEffect, useMemo, useState } from "react";
import { UnsavedChangesContext } from "./UnsavedChangesContext";

export const UnsavedChangesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const confirmNavigation = useCallback(
    () =>
      !hasUnsavedChanges ||
      window.confirm(
        "Your latest project changes have not finished saving. Leave anyway?"
      ),
    [hasUnsavedChanges]
  );

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const link =
        target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.href === window.location.href
      ) {
        return;
      }

      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [confirmNavigation, hasUnsavedChanges]);

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges,
      confirmNavigation,
    }),
    [confirmNavigation, hasUnsavedChanges]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};
