import { useEffect, useRef, useState } from "react";

export type AutosaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "retrying"
  | "saved"
  | "error";

interface UseAutosaveOptions {
  enabled: boolean;
  dirty: boolean;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  save: () => Promise<void>;
  saveKey?: string;
}

export const useAutosave = ({
  enabled,
  dirty,
  delayMs = 900,
  maxRetries = 2,
  retryDelayMs = 1200,
  save,
  saveKey,
}: UseAutosaveOptions) => {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const saveRef = useRef(save);
  const retryImmediatelyRef = useRef(false);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    if (!dirty) {
      setStatus((currentStatus) =>
        currentStatus === "saving" ? currentStatus : "saved"
      );
      return;
    }

    setStatus("dirty");
    let cancelled = false;
    let timeoutId: number;
    const saveOperation = saveRef.current;
    const initialDelayMs = retryImmediatelyRef.current ? 0 : delayMs;
    retryImmediatelyRef.current = false;

    const attemptSave = async (attempt: number) => {
      setStatus(attempt === 0 ? "saving" : "retrying");
      setError(null);

      try {
        await saveOperation();
        if (!cancelled) {
          setStatus("saved");
        }
      } catch (autosaveError) {
        if (cancelled) {
          return;
        }

        setError(autosaveError);
        if (attempt < maxRetries) {
          setStatus("retrying");
          timeoutId = window.setTimeout(
            () => void attemptSave(attempt + 1),
            retryDelayMs * 2 ** attempt
          );
        } else {
          setStatus("error");
        }
      }
    };

    timeoutId = window.setTimeout(() => void attemptSave(0), initialDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    delayMs,
    dirty,
    enabled,
    maxRetries,
    retryDelayMs,
    retryNonce,
    saveKey,
  ]);

  const retryNow = () => {
    retryImmediatelyRef.current = true;
    setRetryNonce((currentNonce) => currentNonce + 1);
  };

  return { status, error, retryNow };
};
