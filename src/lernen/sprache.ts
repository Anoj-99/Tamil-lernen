// Browser-eigene Sprachausgabe (Web Speech API) für Teil 1 "Vorstellung".
// Kein Server, keine Audiodateien nötig - Qualität hängt vom Gerät ab.

export const sprachausgabeVerfuegbar =
  typeof window !== "undefined" && "speechSynthesis" in window;

function utterance(text: string, rate: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ta-IN";
  u.rate = rate;
  return u;
}

// Spricht zuerst den Buchstaben (langsamer), dann das Beispielwort.
export function sprichBuchstabeUndWort(buchstabe: string, beispielwort: string): void {
  if (!sprachausgabeVerfuegbar) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance(buchstabe, 0.75));
  window.speechSynthesis.speak(utterance(beispielwort, 0.9));
}
