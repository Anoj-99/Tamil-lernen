// Haptisches und visuelles Fehler-Feedback: Vibration (Android) bzw.
// Haptik-Tick (iPhone) plus die CSS-Klasse "zittern" (siehe index.css)
// für das Zittern des Zeichens.
import { useCallback, useState } from "react";

// iOS Safari unterstützt navigator.vibrate nicht, löst aber seit iOS 17.4
// beim Umschalten eines nativen Schalters (<input type="checkbox" switch>)
// ein haptisches Feedback aus. Ein unsichtbarer Schalter, der programmatisch
// geklickt wird, erzeugt so einen kurzen Haptik-Tick. Funktioniert nur
// innerhalb einer Nutzer-Geste (unsere Aufrufe kommen aus Tap-Handlern).
let haptikSchalter: HTMLInputElement | null = null;

function iosHaptikTick(): void {
  if (typeof document === "undefined") return;
  if (!haptikSchalter || !haptikSchalter.isConnected) {
    haptikSchalter = document.createElement("input");
    haptikSchalter.type = "checkbox";
    haptikSchalter.setAttribute("switch", "");
    haptikSchalter.tabIndex = -1;
    haptikSchalter.setAttribute("aria-hidden", "true");
    haptikSchalter.style.cssText =
      "position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(haptikSchalter);
  }
  haptikSchalter.click();
}

export function vibriere(): void {
  if (typeof navigator === "undefined") return;
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    navigator.vibrate(120);
    return;
  }
  // Kein navigator.vibrate (iPhone/iPad): Haptik über den Schalter-Trick.
  iosHaptikTick();
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
