// hooks/useIdleTimer.ts
import { useState, useEffect } from "react";

interface UseIdleTimerProps {
  timeout: number; // Timeout duration in milliseconds
  onIdle: () => void; // Function to call when the user becomes idle
}

function useIdleTimer({ timeout, onIdle }: UseIdleTimerProps) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleActivity = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIdle(true);
        onIdle(); // Call the onIdle callback when the timer expires
      }, timeout);
    };

    // Event listeners for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("touchmove", handleActivity); // For mobile devices

    // Initial timer setup
    timer = setTimeout(() => {
      setIdle(true);
      onIdle();
    }, timeout);

    // Cleanup function to remove listeners
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      clearTimeout(timer);
    };
  }, [timeout, onIdle]);

  return idle;
}

export default useIdleTimer;
