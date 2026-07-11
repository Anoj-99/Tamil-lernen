# Akaram (Tamil-lernen) – Projekt-Notizen

Deutschsprachige Lern-App für die tamilische Schrift (React + Vite +
TypeScript, Tailwind, Supabase mit localStorage-Fallback im Test-Modus).
Details zur Struktur: `docs/PLANUNG.md`, Einrichtung/Deployment: `README.md`.

## Arbeitsweise in diesem Repo

- Direkt auf `main` committen und pushen (kein PR-Workflow).
- Code, Kommentare und UI-Texte auf Deutsch.
- Vor dem Commit: `npm test` und `npm run build` müssen grün sein.

## Offene Punkte / Merkzettel

- **Domain:** Anoj holt zeitnah `akaram.study` bei **Porkbun**
  (1. Jahr ~1,54 $, danach ~31 $/Jahr; IONOS führt `.study` nicht).
  Danach: Nameserver auf Vercel (`ns1/ns2.vercel-dns.com`) stellen,
  Domain im Vercel-Projekt hinzufügen, README-Abschnitt „Eigene Domain"
  auf die Porkbun-Schritte aktualisieren. Wichtig: Domain muss stehen,
  bevor Lehrer QR-Codes drucken (QR enthält die Web-Adresse).
- **Später geplant:** native App per Capacitor (App Store / Play Store);
  Haptik dann von `fehlerFeedback.ts` auf @capacitor/haptics umstellen.
- **Assets fehlen noch:** echte Illustrationen statt
  `public/lektionen/platzhalter.svg`, Audio-Aufnahmen der 247 Zeichen
  (aktuell Web Speech API), Maskottchen-Illustrationen (aktuell Emoji).
- **Supabase:** neue Abschnitte in `supabase/schema.sql` (Level,
  Challenge, Rollen/Schulen) müssen einmalig im SQL-Editor der
  Produktions-Datenbank ausgeführt werden.
