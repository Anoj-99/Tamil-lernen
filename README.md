# Tamil-Schrift üben

Eigenständige Lern-App für Tamil-Konsonant-Vokal-Kombinationen
(deutschsprachige UI). Drei Übungsmodi: **Erkennen** (Multiple Choice),
**Nachzeichnen** (Canvas mit Strichfolge-Pfeilen) und **Position-Check**
(erlaubte Wortpositionen). Kein Login, kein Backend, kein Speichern –
alles läuft im Frontend-State.

Die App ist bewusst unabhängig von der TamilConnect-App: eigenes
`package.json`, eigener Build, keine gemeinsamen Abhängigkeiten.

## Lokal starten

```sh
cd tamil-lernen
npm install
npm run dev
```

## Tests / Build

```sh
npm test        # Datenschicht-Tests (vitest)
npm run build   # Typecheck + Produktions-Build nach dist/
```

## Deployment auf Vercel (eigenes Projekt, eigene Domain)

1. Auf [vercel.com](https://vercel.com) → **Add New… → Project** → das
   Repo `Anoj-99/tamilconnect` importieren (es entsteht ein **zweites**,
   von TamilConnect unabhängiges Vercel-Projekt).
2. **Root Directory** auf `tamil-lernen` setzen (Edit neben Root Directory).
3. Framework-Preset **Vite** wird automatisch erkannt – nichts weiter
   nötig, keine Environment-Variablen.
4. Projektname z.B. `tamil-lernen` → die App läuft dann unter
   `tamil-lernen.vercel.app` (Production-Deployments sind öffentlich,
   kein Vercel-Login nötig).

Hinweis: Das Production-Deployment baut vom `main`-Branch. Solange der
Branch mit dieser App noch nicht gemergt ist, in den Projekt-Settings
unter **Git → Production Branch** den Feature-Branch eintragen – oder
einfach erst nach dem Merge importieren.
