// src/processes/shift/ui/ShiftControl.tsx
import { useState } from "react";
import { Button, Card } from "@/shared/ui";
import { useShiftTimer } from "../model/useShiftTimer";

export function ShiftControl() {
  const [started, setStarted] = useState<Date | null>(null);
  const timer = started ? useShiftTimer(started) : null;

  return (
    <Card className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Смена</h2>
      {started ? (
        <>
          <div className="text-2xl">
            {timer!.hours.toString().padStart(2, "0")}:
            {timer!.minutes.toString().padStart(2, "0")}:
            {timer!.seconds.toString().padStart(2, "0")}
          </div>
          <Button variant="outline" onClick={() => setStarted(null)}>
            Завершить
          </Button>
        </>
      ) : (
        <Button variant="primary" onClick={() => setStarted(new Date())}>
          Начать смену
        </Button>
      )}
    </Card>
  );
}
