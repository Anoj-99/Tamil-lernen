# Akaram (அகரம்) – Tamil-Schrift lernen

Eigenständige Lern-App für Tamil-Konsonant-Vokal-Kombinationen
(deutschsprachige UI), aufgebaut wie eine Fahrschul-Theorie-App:
Übungsmodi **Erkennen**, **Nachzeichnen**, **Position-Check** und
**Prüfungssimulation**, dazu Punkte/Level/Streak, Fehlerverlauf,
Leitner-Wiederholung und ein Lehrer-Dashboard.

Die App ist bewusst unabhängig von der TamilConnect-App: eigenes
`package.json`, eigener Build, eigene (separate) Supabase-Datenbank.

## Konten & Rollen

- Login nur mit Benutzername – kein Passwort, keine E-Mail. Ein neuer
  Name legt automatisch ein neues Schüler-Konto an.
- Rolle `lehrer` wird direkt in Supabase vergeben (Table Editor →
  `accounts` → Spalte `rolle`, oder per SQL:
  `update accounts set rolle = 'lehrer' where username = 'NAME';`).
- Ohne konfigurierte Datenbank läuft die App im **Test-Modus**: alles
  wird nur im Browser (localStorage) gespeichert. Dort bekommt der
  Benutzername `lehrer` automatisch Lehrer-Rechte zum Ausprobieren.

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
