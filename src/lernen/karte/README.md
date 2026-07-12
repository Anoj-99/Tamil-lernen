# Weltkarte – Architektur

Der Lernpfad als Reise durch Sri Lanka. Vier Ebenen, strikt getrennt in
**Logik** (PfadSeite), **Layout** (reine Daten, kein SVG) und
**Darstellung** (Ebenen-Komponenten + Symbole, austauschbar):

```
Ebene 0  weltGenerator.ts   Die Welt: Merkmale (Berge, Flüsse, Tempel,
                            Reisfelder, Dörfer, Seen), Biom-Zuordnung,
                            Atmosphäre. Kennt keine Level, kein SVG.
Ebene 1  landschaft.ts      Übersetzt Welt + Weg in Darstellungsdaten:
         biome.ts           Merkmal-Positionen (regelbasiert: Wasserfall
                            nur am Berg, Haus nur im Dorf), Füll-
                            Vegetation mit Negativraum, Wiesen, Flüsse,
                            Wegsteine/Gras/Blumen. Nur Daten.
Ebene 2  wegGenerator.ts    Der Weg: organischer Random-Walk DURCH die
                            existierende Welt (weicht Bergen/Seen aus,
                            Brücken an Fluss-Querungen), streng monoton
                            nach unten, Bogenlängen-Zugriff.
Ebene 3  kartenLayout.ts    Gameplay: ankert Lektions-/Boss-/Quest-
                            Knoten per Bogenlänge an den Weg. Erzeugt
                            in fester Reihenfolge: Welt → Weg → Anker.
```

Rendering (ersetzbar, ohne die Ebenen anzufassen): `KartenDeko.tsx`
(Symbol-Bibliothek, Platzhalter für spätere Illustrationen),
`LandschaftEbene.tsx`, `WegEbene.tsx`, `GameplayEbene.tsx`,
`AvatarFigur.tsx`. Interaktion: `useKamera.ts` (Klemmung, Kamerafahrten,
Trägheit), `useGesten.ts` (Ziehen, Pinch, Doppeltipp, Mausrad),
`useAvatarLauf.ts` (läuft entlang der Bogenlänge, nie teleportiert).
Komposition: `PfadKarte.tsx`. Konstanten: `kartenKonfig.ts` (inkl. Seed –
gleiche Daten ⇒ identische Welt). Culling: `sichtfenster.ts`.

## Erweitern

- **Neues Level:** nur in `src/data/levelPlan.ts` ergänzen – Welt, Weg
  und Karte wachsen automatisch (keine Levelanzahl-Annahmen, getestet
  bis 250+ Level).
- **Neues Biom / neue Region:** Biom in `biome.ts` definieren (Farben,
  Symbole, Dichte), Zuordnung in `weltGenerator.biomBei(bogenlaenge)`
  (dort später fließende Übergänge zwischen Regionen: Küste →
  Reisfelder → Teeplantagen → Hochland …).
- **Illustrationen austauschen:** Symbole in `KartenDeko.tsx` ersetzen
  (gleiche Ids, Fußpunkt bei y=0) bzw. Rendering in den Ebenen-
  Komponenten – Layout-Module bleiben unberührt.
- **Jahreszeiten / Feiertage / Tag-Nacht / Wetter:**
  `welt.atmosphaere` erweitern und in Biom-Farben/Symbolwahl
  berücksichtigen.
- **Ambience/Musik:** aktuelle Region ist aus der Kamera-Position
  (`weg`-Bogenlänge → `biomBei`) ableitbar.
- **Avatar-Personalisierung:** `AvatarFigur.tsx` ist die einzige Stelle,
  die den Avatar zeichnet (aktuell Emoji-Platzhalter).
