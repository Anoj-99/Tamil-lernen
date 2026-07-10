# Akaram – Struktur-Planung (Ziel-Architektur)

Stand: Juli 2026. Dieses Dokument übersetzt die Produkt-Spezifikation
(Lernpfad, Bibliothek, Daily Challenge, Rollen-Hierarchie, UX) in eine
konkrete technische Struktur und einen Umsetzungs-Fahrplan.

---

## 1. Ist-Zustand (Kurzfassung)

- React + Vite + TypeScript, Tailwind, deutschsprachige UI.
- Login nur per Benutzername (kein Passwort), Rollen `lehrer`/`schueler`.
- Supabase als Backend, localStorage-Fallback im Test-Modus
  (`src/lib/datenquelle.ts`).
- Inhalte statisch in `src/data/lektionen.ts` (Stufe → Lektion →
  Buchstaben) und `src/data/tamilSchrift.ts`.
- Übungsmodi: Erkennen, Nachzeichnen, Position-Check, Prüfung;
  Leitner-Wiederholung, Punkte/Streak/Freeze, Stufen-Checkpoints,
  einfache Hausaufgaben (Anzahl-basiert), Lehrer-Dashboard.

## 2. Ziel-Bild laut Spezifikation

| Bereich | Neu / Änderung |
|---|---|
| Lernpfad | Visuelle Sri-Lanka-Reise als Dashboard, Level-Knoten + Boss-Tests, Hausaufgaben als Abzweigung |
| Level-Logik | 1 Level = genau 3 Lektionen + Boss-Test als Gatekeeper; Fehlerfragen werden am Testende wiederholt, bis alles einmal richtig war (keine Leben) |
| Bibliothek | 247 Zeichen in klassischer Reihenfolge (Uyir → Mei → Uyirmei), später Wort-Bibliothek nach Schwierigkeit; Deep-Link zurück in die Ursprungs-Lektion |
| Daily Challenge | Eigener Modus; Quiz-Typen: Multiple Choice, Wort↔Bild, Hören→Schreiben; Punkte können gerissenen Streak freikaufen |
| Rollen | Admin → Schulleiter (Schul-Code, aggregierte Statistik) → Lehrer (eigener Code, QR-Bindung, Detail-Statistik, Hausaufgaben-Editor mit Pool + Deadlines) → Schüler (nur via QR) |
| UX | Zittern + Vibration bei Fehlern; Maskottchen mit Evolution alle 5 Level (Pfau → Affe → Tiger → Elefant) |

---

## 3. Neue Ordnerstruktur (`src/`)

Umbau vom flachen `src/lernen/`-Ordner zu Feature-Ordnern:

```
src/
  app/                 # Shell, Navigation, Routing zwischen den Bereichen
    AppShell.tsx       # Header (Logo, Punkte, Streak), Tab-/Routen-Navigation
    KontoContext.tsx   # (verschoben aus lernen/)
  features/
    pfad/              # Das visuelle Zentrum (Dashboard)
      PfadSeite.tsx        # Sri-Lanka-Pfad, Level-Knoten, Boss-Knoten
      PfadKnoten.tsx       # Lektion / Boss / Side-Quest-Knoten
      BossTest.tsx         # Level-Abschlusstest mit Fehler-Warteschlange
      useLevelFortschritt.ts
    lektion/           # Bestehende Lern-Screens (Teil 1–6)
      TeilVorstellung.tsx, TeilErkennen.tsx, TeilNachzeichnen.tsx,
      TeilVerbinden.tsx, TeilCheckpoint.tsx, useLektionInhalt.ts, …
    bibliothek/
      BibliothekSeite.tsx  # Tabs: Zeichen | Wörter
      ZeichenGitter.tsx    # 247 Zeichen, klassische Reihenfolge
      WortListe.tsx        # später: Wörter nach Schwierigkeit
    challenge/
      DailyChallenge.tsx
      quizTypen/           # MultipleChoice, WortBild, HoerenSchreiben
    hausaufgaben/
      SideQuestKnoten.tsx  # Darstellung auf dem Pfad
      useHausaufgaben.ts
    rollen/
      AdminBereich.tsx     # Schulleiter per E-Mail einladen
      SchulleiterBereich.tsx # Schul-Code + aggregierte Statistik
      LehrerBereich.tsx    # Detail-Statistik, Hausaufgaben-Editor, QR-Code
      QrRegistrierung.tsx  # Schüler-Onboarding per Lehrer-QR
    profil/
      ProfilSeite.tsx      # Punkte, Streak, Streak-Freikauf, eigener Code
  data/
    tamilSchrift.ts    # alle 247 Zeichen inkl. klassischer Sortierung
    levelPlan.ts       # Level → 3 Lektionen → Zeichen (ersetzt lektionen.ts-Stufen)
    woerter.ts         # Wort-Bibliothek (Schwierigkeitsgrad, später Themen)
    audio/             # Zuordnung Zeichen/Wort → Audio-Datei
  lib/
    typen.ts, datenquelle.ts, punkteLogik.ts (erweitert um Freikauf)
  ui/
    Maskottchen.tsx    # Zustände: idle / jubeln; Evolution alle 5 Level
    fehlerFeedback.ts  # Zitter-Animation + navigator.vibrate()
    theme/             # Sri-Lanka-Assets (Palmen, Tempel, Elefanten)
```

Migration: `src/lernen/` bleibt zunächst bestehen; Dateien wandern
schrittweise in die Feature-Ordner (pro Phase, siehe §7), damit die App
jederzeit lauffähig bleibt.

## 4. Inhalts-Modell: Level & Lektionen

```ts
// data/levelPlan.ts
interface Level {
  id: number;              // 1, 2, 3, …
  name: string;            // z.B. "Die Vokale I"
  lektionIds: [string, string, string]; // genau 3 Lektionen
  maskottchenStufe: number; // Math.floor((id - 1) / 5): 0=Pfau, 1=Affe, 2=Tiger, 3=Elefant
}
```

- Die 247 Zeichen: 12 Uyir + 1 Ayutham (ஃ) + 18 Mei + 216 Uyirmei.
- Jede Lektion lehrt 4–6 Zeichen (Uyirmei-Lektionen gruppiert pro
  Konsonantenreihe). Jedes Zeichen kennt seine `lektionId` →
  Grundlage für den Deep-Link aus der Bibliothek.
- **Boss-Test-Mechanik** (ersetzt Toleranz-Prozent des bisherigen
  Stufen-Checkpoints): Fragen über alle 3 Lektionen; falsch
  beantwortete Fragen landen in einer Warteschlange und werden am Ende
  erneut gestellt – so lange, bis jede Frage einmal richtig war. Erst
  dann wird `level_fortschritt` auf `bestanden` gesetzt und das nächste
  Level am Pfad freigeschaltet.

## 5. Datenbank-Erweiterungen (Supabase)

Neue Tabellen:

```sql
schulen        (id, name, direktor_username, schul_code, erstellt_am)
lehrer_codes   (username pk → accounts, schule_id, code, qr_aktiv)
level_fortschritt (username, level_id, status: 'offen'|'aktiv'|'bestanden',
                   bestanden_am)
boss_versuche  (id, username, level_id, fragen_gesamt, erste_runde_fehler,
                runden_bis_fertig, zeitpunkt)
daily_challenge (username, datum, punkte, quiz_typen jsonb)
```

Änderungen an bestehenden Tabellen:

- `accounts`: `rolle` erweitert auf
  `('admin','schulleiter','lehrer','schueler')`, neu: `schule_id`,
  `lehrer_username` (Bindung Schüler → Lehrer), `email` (nur
  Admin/Schulleiter-Einladung).
- `hausaufgaben`: neu `deadline timestamptz`, `thema text`,
  `aufgaben jsonb` (zusammengestelltes Übungspaket aus dem Pool),
  `pfad_level integer` (an welchem Level die Abzweigung hängt).
- `hausaufgaben_status`: neu `deadline_eingehalten boolean` (bleibt
  nach Deadline bearbeitbar; Lehrer sieht die Markierung).
- `punkte`: Streak-Freikauf – neue Funktion in `punkteLogik.ts`:
  `streakFreikaufen(kosten)` zieht Daily-Challenge-Punkte ab und stellt
  `streakTage` wieder her (Freikauf-Kosten steigen mit Streak-Länge).

**Sicherheits-Hinweis:** Mit der Rollen-Hierarchie (E-Mail-Einladung,
Schul-Codes) reicht das bisherige „anon-Key darf alles"-Modell nicht
mehr. Spätestens in Phase 4 (§7) Umstellung auf Supabase Auth
(magic-link für Admin/Schulleiter/Lehrer) + Row-Level-Security;
Schüler bleiben passwortlos, werden aber über den gescannten
Lehrer-Code an eine Schule gebunden.

## 6. Screens & Navigation

Haupt-Navigation (unten, App-artig): **Pfad · Bibliothek · Challenge · Profil**
(+ Rollen-Bereich je nach Rolle).

1. **Pfad (Dashboard):** vertikal scrollender Weg durch Sri-Lanka-Kulisse.
   Knoten-Typen: Lektion (3 pro Level), Boss-Test, Side-Quest
   (Hausaufgabe, optional – Hauptpfad läuft daran vorbei), Meilenstein
   (Maskottchen-Evolution alle 5 Level). Maskottchen läuft am aktuellen
   Knoten mit.
2. **Bibliothek:** Tab „Zeichen“ mit drei Abschnitten in klassischer
   Reihenfolge (Uyir / Mei / Uyirmei-Matrix 18×12); Tab „Wörter“
   (Phase 3+). Gelernte Zeichen farbig, ungelernte ausgegraut. Tap →
   Detail-Sheet mit Audio + Button „Zur Lektion“ (Deep-Link).
3. **Daily Challenge:** 1×/Tag, Mix aus Multiple Choice, Wort↔Bild,
   Hören→Schreiben – gespeist aus dem bisherigen Lernstand (Leitner).
   Belohnung: Challenge-Punkte (Streak-Freikauf-Währung).
4. **Profil:** Streak-Kalender, Freikauf-Button, EP/Level,
   Maskottchen-Galerie; bei Lehrern/Schulleitern zusätzlich der eigene
   Code als QR.
5. **Rollen-Bereiche:** Admin (Einladungen), Schulleiter (aggregierte
   Schul-/Klassen-Statistik, keine Einzelschüler), Lehrer
   (Klassen-Statistik + Einzelfehler-Analyse, Hausaufgaben-Editor:
   Aufgaben-Pool nach Thema → Paket schnüren → Deadline setzen).

## 7. Umsetzungs-Fahrplan (Phasen)

| Phase | Inhalt | Kern-Deliverable |
|---|---|---|
| **1** | Level-Datenmodell (`levelPlan.ts`, 1 Level = 3 Lektionen), Boss-Test mit Fehler-Warteschlange, Pfad v1 (schlichter vertikaler Pfad, noch ohne Themen-Grafik) | Spielbare Level-Schleife mit Gatekeeper |
| **2** | Bibliothek: 247 Zeichen in klassischer Reihenfolge, Lernstand-Färbung, Deep-Link in Lektionen | Nachschlagewerk |
| **3** | Daily Challenge (3 Quiz-Typen; Audio-Assets nötig!), Streak-Freikauf, Fehler-Feedback (Zittern + Vibration) | Tägliche Bindung |
| **4** | Rollen-Hierarchie: Schulen, Codes, QR-Registrierung, Supabase Auth + RLS, Hausaufgaben-Editor (Pool, Pakete, Deadlines), Side-Quests am Pfad, Schulleiter-Statistik | Schul-Betrieb |
| **5** | Sri-Lanka-Theming des Pfads (Illustrationen), Maskottchen mit Evolution + Jubel-Animationen, Wort-Bibliothek (Schwierigkeit, später Themen) | Polish & Welt |

Benötigte Assets (früh beschaffen, blockieren sonst Phase 3/5):
Audio-Aufnahmen aller 247 Zeichen (+ Wörter), Maskottchen in 4
Evolutionsstufen (idle + jubelnd), Sri-Lanka-Hintergründe (Palmen,
Tempel, Elefanten), Bild-Set für Wort↔Bild-Quiz.

## 8. Offene Entscheidungen

1. **Routing:** Bisher State-basiertes Tab-Switching in
   `TamilLernen.tsx`. Mit Deep-Links (Bibliothek → Lektion) und
   QR-Registrierungs-URLs wird `react-router` sinnvoll.
2. **QR-Scan:** Schüler scannen den Lehrer-Code mit der nativen
   Kamera-App (QR enthält Registrierungs-URL `…/beitreten?code=XYZ`) –
   kein In-App-Scanner nötig. In-App-Scanner nur, falls PWA-Anspruch
   „alles in der App“ gewünscht.
3. **Bestandsdaten:** Bisherige Stufen-/Checkpoint-Fortschritte müssen
   auf das neue Level-Modell gemappt werden (Migrations-Skript in
   Phase 1).
4. **Vibration:** `navigator.vibrate()` funktioniert nicht auf iOS
   Safari – dort nur visuelles Zittern (Zitter-Animation ist daher der
   primäre Kanal, Vibration nur Zusatz).
