// src/processes/shift/model/useShiftTimer.ts
import { useEffect, useState } from "react";

export function useShiftTimer(start: Date) {
  const [elapsed, setElapsed] = useState(() => Date.now() - start.getTime());

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Date.now() - start.getTime()),
      1_000
    );
    return () => clearInterval(id);
  }, [start]);

  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1_000);

  return { hours, minutes, seconds };
}
