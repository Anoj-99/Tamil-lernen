# Akaram (அகரம்) – Tamil-Schrift lernen

Eigenständige Lern-App für die tamilische Schrift (deutschsprachige UI):

- **Lernpfad** durch Sri Lanka: Level mit je 3 Lektionen und einem
  Boss-Test als Gatekeeper (falsche Fragen wiederholen sich, bis alles
  sitzt), Maskottchen mit Evolution (Pfau → Affe → Tiger → Elefant)
- **Bibliothek** mit allen 247 Zeichen in klassischer Reihenfolge
  (Uyir → Ayutham → Mei → Uyirmei) + Wort-Bibliothek nach Schwierigkeit,
  Deep-Links zurück in die Ursprungs-Lektion
- **Daily Challenge** (Multiple Choice, Wort↔Bild, Hör-Fragen) mit
  Challenge-Punkten zum **Streak-Freikauf**
- Freie Übungsmodi **Erkennen**, **Nachzeichnen**, **Position-Check**,
  **Prüfungssimulation**, dazu EP/Level/Streak, Leitner-Wiederholung
- **Hausaufgaben als Side-Quest** am Pfad: Lehrer stellen Pakete aus
  einem Themen-Pool zusammen (mit Deadline)

Die App ist bewusst unabhängig von der TamilConnect-App: eigenes
`package.json`, eigener Build, eigene (separate) Supabase-Datenbank.

## Konten & Rollen

- Login nur mit Benutzername – kein Passwort. Ein neuer Name legt
  automatisch ein Schüler-Konto an (optional mit Lehrer-Code gebunden).
- Rollen-Hierarchie: **Admin** legt Schulen + Schulleiter an →
  **Schulleiter** gibt seinen Schul-Code an Lehrer weiter (sieht nur
  aggregierte Schul-Statistik) → **Lehrer** registriert sich mit dem
  Schul-Code und erhält einen eigenen Code als QR → **Schüler** scannen
  den QR-Code und werden der Klasse zugeordnet.
- Rolle `admin` wird direkt in Supabase vergeben (SQL:
  `update accounts set rolle = 'admin' where username = 'NAME';`).
- Ohne konfigurierte Datenbank läuft die App im **Test-Modus**: alles
  wird nur im Browser (localStorage) gespeichert. Dort bekommen die
  Benutzernamen `lehrer`, `schulleiter` und `admin` automatisch die
  passende Rolle zum Ausprobieren.

## Supabase einrichten (einmalig)

1. Auf [supabase.com](https://supabase.com) ein **neues Projekt**
   anlegen (getrennt von TamilConnect).
2. Im SQL-Editor den Inhalt von `supabase/schema.sql` ausführen.
3. Unter *Project Settings → API* die Werte **Project URL** und
   **anon/publishable key** kopieren.
4. Im Vercel-Projekt `tamil-lernen` unter *Settings → Environment
   Variables* eintragen und neu deployen:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = anon/publishable key

Hinweis: Die App arbeitet bewusst ohne Passwörter; die Tabellen sind
für den anon-Key offen. Es liegen dort nur Benutzernamen, Punkte und
Übungsstatistiken – keine schützenswerten Daten.

## Lokal starten

```sh
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
   Repo `Anoj-99/tamil-lernen` importieren (eigenständiges Repo, kein
   Root-Directory-Trick mehr nötig).
2. Framework-Preset **Vite** wird automatisch erkannt – nichts weiter
   nötig, Root Directory bleibt `/` (Standard).
3. Projektname z.B. `tamil-lernen` → die App läuft dann unter
   `tamil-lernen.vercel.app` (Production-Deployments sind öffentlich,
   kein Vercel-Login nötig).

Falls bisher ein Vercel-Projekt mit Root Directory `tamil-lernen` im
`tamilconnect`-Repo verbunden war: in den Projekt-Settings unter
**Git** die Repo-Verbindung auf `Anoj-99/tamil-lernen` umstellen und
Root Directory wieder auf `/` setzen – die Environment-Variablen
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) bleiben dabei
erhalten.
