# Weltkarte – Visual Prototype V1

## Ist-Analyse

- Die Ebenenarchitektur und Interaktionslogik sind bereits sauber getrennt.
- Welt, Weg und Gameplay werden deterministisch aus `levelPlan.ts` erzeugt.
- Die bisherige Darstellung wirkt flach: gleichgewichtete SVG-Symbole,
  uniforme Grundflächen, kaum atmosphärischer Abstand und Standard-UI/Emoji.
- Verbindliche Hauptreferenz: `Generiertes Bild 1.png` (vom 16.07.2026).
  Sie definiert Perspektive, Dichte, Materialtiefe, Morgenlicht und die
  Prioritaet Landschaft → Weg → Gameplay. Die Inselkontur wird nicht uebernommen.

## Referenzvergleich

- Perspektive: leicht schraege Vogelperspektive mit grossen Vordergrundformen,
  klar lesbarem Mittelgrund und kontrastaermeren Ferninseln/Bergen.
- Komposition: Vegetationswaende rahmen breite Lichtungen; Objekte stehen in
  asymmetrischen Gruppen und ueberlappen sich.
- Weg: breites, in die Erde eingelassenes Band aus verschieden grossen,
  verwitterten Natursteinen mit unregelmaessigen Luecken und weichen Kanten.
- Massstab: Gebaeude und Baumkronen sind grosse Landschaftsanker; Tiere bleiben
  seltene, gut lesbare Akzente. Levelsteine sind ungefaehr avatarhoch bis
  doppelt avatarhoch, Lektionssteine deutlich kleiner.
- Licht/Farbe: warmes Morgenlicht von rechts oben, matte olivgruene Flaechen,
  gedämpftes Petrolwasser, helle Kalk-/Sandsteine und weiche Schatten links unten.
- Hierarchie: mindestens 80 % Landschaft; Beschriftung und Steuerung liegen wie
  kleine Objekte auf der Welt und bilden keine zweite dominante UI-Ebene.

## Pilotumfang

Der Stil wird nur in der bestehenden Sri-Lanka-Region erprobt. Weltgenerator,
Pfad, Kamera, Gesten, Avatarlauf und Freischaltlogik bleiben unverändert.

## Asset-Schnittstelle

`kartenAssets.ts` ist der zentrale Katalog für austauschbare transparente
Rasterillustrationen. Solange `src` nicht gesetzt ist, verwendet die Karte die
SVG-Fallbacks aus `KartenDeko.tsx`.

Für die finale Art-Abnahme werden folgende Dateien benötigt (jeweils WebP oder
PNG mit transparentem Hintergrund, 25–30°-Vogelperspektive, matte Gouache-/
Kinderbuchtextur und einheitlichem Morgenlicht von rechts oben):

- Kokospalme: 3 Einzelvarianten und 4 Cluster mit 3–7 Palmen
- tropischer Baum: 5 Kronen-/Stammvarianten; Buschcluster: 5 Varianten
- Reisfeld: 2 mittelgroße Terrassenvarianten
- tamilischer Hindu-Tempel: 1 kleine und 1 mittlere Variante
- traditionelles Haus: 2 Varianten
- Berg-/Felskulisse: je 3 breite Hintergrund- und Mittelgrundvarianten
- Wasserfall/Felsen-Gruppe, ruhiger Teich, Flussufer und Stein-/Holzbrücke
- Elefant, Makak, Pfau und Eisvogel mit je 1–2 Idle-Frames
- Vordergrund-Farn/Fels/Blätter: 6 angeschnittene Cluster
- Naturweg-Atlas: 12–16 verwitterte Platten, Erdsaum, Moos und Kiesel

Alle Assets benötigen einen dokumentierten Fußpunkt; ihre IDs und Maße sind im
Katalog bereits vorbereitet. Die Welt-/Gameplay-Logik muss beim Austausch nicht
geändert werden.
