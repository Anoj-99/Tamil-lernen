// Haptisches und visuelles Fehler-Feedback: Vibration (wo verfügbar, z.B.
// Android – iOS Safari unterstützt navigator.vibrate nicht) plus die
// CSS-Klasse "zittern" (siehe index.css) für das Zittern des Zeichens.
import { useCallback, useState } from "react";

export function vibriere(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}

// Liefert eine CSS-Klasse, die bei ausloeser() kurz "zittern" wird, und
// löst gleichzeitig die Geräte-Vibration aus.
export function useFehlerFeedback(): { klasse: string; ausloesen: () => void } {
  const [zittert, setZittert] = useState(false);

  const ausloesen = useCallback(() => {
    vibriere();
    setZittert(true);
    window.setTimeout(() => setZittert(false), 450);
  }, []);

  return { klasse: zittert ? "zittern" : "", ausloesen };
}
