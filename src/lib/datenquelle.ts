// Datenzugriff der App. Zwei austauschbare Backends:
//
// 1. SupabaseDatenquelle — geteilte Datenbank, sobald in Vercel/`.env`
//    VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY gesetzt sind.
// 2. LokaleDatenquelle — Fallback ohne Konfiguration: alles landet im
//    localStorage dieses Geräts ("Test-Modus"). So bleibt die App auch
//    ohne eingerichtetes Backend voll bedienbar.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  FehlerEintrag,
  Hausaufgabe,
  HausaufgabenStatus,
  heuteIso,
  isoWoche,
  Konto,
  leererPunkteStand,
  LeitnerEintrag,
  LektionFortschritt,
  LektionInhaltUeberschreibung,
  PruefungsErgebnis,
  PunkteStand,
  RegelEintrag,
  Rolle,
  SchuelerUebersicht,
  standardCheckpointKonfig,
  StufenCheckpointErgebnis,
  StufenCheckpointKonfig,
} from "./typen";

export interface Datenquelle {
  loginOderAnlegen(username: string): Promise<Konto>;
  ladePunkte(username: string): Promise<PunkteStand>;
  speicherePunkte(username: string, stand: PunkteStand): Promise<void>;

  ladeRegeln(): Promise<RegelEintrag[]>;
  speichereRegel(eintrag: RegelEintrag): Promise<void>;
  loescheRegel(buchstabe: string): Promise<void>;

  logFehler(eintrag: FehlerEintrag): Promise<void>;
  ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]>;

  ladeLeitner(username: string): Promise<LeitnerEintrag[]>;
  speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void>;

  ladeAlleSchueler(): Promise<SchuelerUebersicht[]>;

  hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void>;
  hausaufgabeLoeschen(id: number): Promise<void>;
  ladeHausaufgaben(): Promise<Hausaufgabe[]>;
  ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]>;
  speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void>;

  pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void>;
  ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]>;

  ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]>;
  lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void>;

  ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]>;
  speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void>;
  loescheLektionUeberschreibung(zeichen: string): Promise<void>;
  bildHochladen(zeichen: string, datei: File): Promise<string>;

  ladeCheckpointKonfig(stufeId: string): Promise<StufenCheckpointKonfig>;
  speichereCheckpointKonfig(konfig: StufenCheckpointKonfig): Promise<void>;

  checkpointSpeichern(ergebnis: StufenCheckpointErgebnis): Promise<void>;
  ladeCheckpoints(username: string, stufeId: string): Promise<StufenCheckpointErgebnis[]>;
}

// ---------------------------------------------------------------------------
// Supabase-Backend
// ---------------------------------------------------------------------------

class SupabaseDatenquelle implements Datenquelle {
  constructor(private client: SupabaseClient) {}

  private async abfrage<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
  }

  async loginOderAnlegen(username: string): Promise<Konto> {
    const vorhanden = await this.abfrage<{ username: string; rolle: Rolle }[]>(
      this.client.from("accounts").select("username, rolle").eq("username", username).limit(1),
    );
    if (vorhanden && vorhanden.length > 0) {
      return { username: vorhanden[0].username, rolle: vorhanden[0].rolle };
    }
    await this.abfrage(this.client.from("accounts").insert({ username }));
    await this.abfrage(this.client.from("punkte").insert({ username }));
    return { username, rolle: "schueler" };
  }

  async ladePunkte(username: string): Promise<PunkteStand> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("punkte").select("*").eq("username", username).limit(1),
    );
    if (!zeilen || zeilen.length === 0) return leererPunkteStand();
    const z = zeilen[0];
    return {
      epGesamt: Number(z.ep_gesamt ?? 0),
      epHeute: Number(z.ep_heute ?? 0),
      heuteDatum: String(z.heute_datum ?? heuteIso()),
      streakTage: Number(z.streak_tage ?? 0),
      letzterLerntag: (z.letzter_lerntag as string | null) ?? null,
      freezeVerfuegbar: Boolean(z.freeze_verfuegbar ?? true),
      freezeWoche: String(z.freeze_woche ?? isoWoche(new Date())),
    };
  }

  async speicherePunkte(username: string, stand: PunkteStand): Promise<void> {
    await this.abfrage(
      this.client.from("punkte").upsert({
        username,
        ep_gesamt: stand.epGesamt,
        ep_heute: stand.epHeute,
        heute_datum: stand.heuteDatum,
        streak_tage: stand.streakTage,
        letzter_lerntag: stand.letzterLerntag,
        freeze_verfuegbar: stand.freezeVerfuegbar,
        freeze_woche: stand.freezeWoche,
      }),
    );
  }

  async ladeRegeln(): Promise<RegelEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("buchstaben_regeln").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      buchstabe: String(z.buchstabe),
      positionWert: z.position_wert as RegelEintrag["positionWert"],
      positionHinweis: (z.position_hinweis as string | null) ?? null,
      vomLehrerAngepasst: Boolean(z.vom_lehrer_angepasst),
    }));
  }

  async speichereRegel(eintrag: RegelEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("buchstaben_regeln").upsert({
        buchstabe: eintrag.buchstabe,
        position_wert: eintrag.positionWert,
        position_hinweis: eintrag.positionHinweis,
        vom_lehrer_angepasst: eintrag.vomLehrerAngepasst,
        aktualisiert_am: new Date().toISOString(),
      }),
    );
  }

  async loescheRegel(buchstabe: string): Promise<void> {
    await this.abfrage(this.client.from("buchstaben_regeln").delete().eq("buchstabe", buchstabe));
  }

  async logFehler(eintrag: FehlerEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("fehlerverlauf").insert({
        username: eintrag.username,
        zeichen: eintrag.zeichen,
        modus: eintrag.modus,
        richtige_antwort: eintrag.richtigeAntwort,
        gegebene_antwort: eintrag.gegebeneAntwort,
        zeitpunkt: eintrag.zeitpunkt,
      }),
    );
  }

  async ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client
        .from("fehlerverlauf")
        .select("*")
        .eq("username", username)
        .order("zeitpunkt", { ascending: false })
        .limit(limit),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      username: String(z.username),
      zeichen: String(z.zeichen),
      modus: z.modus as FehlerEintrag["modus"],
      richtigeAntwort: String(z.richtige_antwort ?? ""),
      gegebeneAntwort: String(z.gegebene_antwort ?? ""),
      zeitpunkt: String(z.zeitpunkt),
    }));
  }

  async ladeLeitner(username: string): Promise<LeitnerEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lernfortschritt").select("*").eq("username", username),
    );
    return (zeilen ?? []).map((z) => ({
      zeichen: String(z.zeichen),
      modus: z.modus as LeitnerEintrag["modus"],
      fach: Number(z.fach),
      richtigGesamt: Number(z.richtig_gesamt),
      falschGesamt: Number(z.falsch_gesamt),
    }));
  }

  async speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("lernfortschritt").upsert({
        username,
        zeichen: eintrag.zeichen,
        modus: eintrag.modus,
        fach: eintrag.fach,
        richtig_gesamt: eintrag.richtigGesamt,
        falsch_gesamt: eintrag.falschGesamt,
        zuletzt_geuebt: new Date().toISOString(),
      }),
    );
  }

  async ladeAlleSchueler(): Promise<SchuelerUebersicht[]> {
    const konten = await this.abfrage<{ username: string; rolle: Rolle }[]>(
      this.client.from("accounts").select("username, rolle").order("username"),
    );
    const punkte = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("punkte").select("*"),
    );
    const punkteNachName = new Map<string, PunkteStand>();
    for (const z of punkte ?? []) {
      punkteNachName.set(String(z.username), {
        epGesamt: Number(z.ep_gesamt ?? 0),
        epHeute: Number(z.ep_heute ?? 0),
        heuteDatum: String(z.heute_datum ?? heuteIso()),
        streakTage: Number(z.streak_tage ?? 0),
        letzterLerntag: (z.letzter_lerntag as string | null) ?? null,
        freezeVerfuegbar: Boolean(z.freeze_verfuegbar ?? true),
        freezeWoche: String(z.freeze_woche ?? ""),
      });
    }
    return (konten ?? []).map((k) => ({
      konto: { username: k.username, rolle: k.rolle },
      punkte: punkteNachName.get(k.username) ?? leererPunkteStand(),
    }));
  }

  async hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void> {
    await this.abfrage(
      this.client.from("hausaufgaben").insert({
        zugewiesen_von: h.zugewiesenVon,
        zugewiesen_an: h.zugewiesenAn,
        gruppe_id: h.gruppeId,
        soll_anzahl: h.sollAnzahl,
      }),
    );
  }

  async hausaufgabeLoeschen(id: number): Promise<void> {
    await this.abfrage(this.client.from("hausaufgaben").delete().eq("id", id));
  }

  async ladeHausaufgaben(): Promise<Hausaufgabe[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("hausaufgaben").select("*").order("erstellt_am", { ascending: false }),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      zugewiesenVon: String(z.zugewiesen_von),
      zugewiesenAn: String(z.zugewiesen_an),
      gruppeId: String(z.gruppe_id),
      sollAnzahl: Number(z.soll_anzahl),
      erstelltAm: String(z.erstellt_am),
    }));
  }

  async ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("hausaufgaben_status").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      hausaufgabeId: Number(z.hausaufgabe_id),
      username: String(z.username),
      fortschritt: Number(z.fortschritt),
      erledigtAm: (z.erledigt_am as string | null) ?? null,
    }));
  }

  async speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void> {
    await this.abfrage(
      this.client.from("hausaufgaben_status").upsert({
        hausaufgabe_id: status.hausaufgabeId,
        username: status.username,
        fortschritt: status.fortschritt,
        erledigt_am: status.erledigtAm,
      }),
    );
  }

  async pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void> {
    await this.abfrage(
      this.client.from("pruefungen").insert({
        username: ergebnis.username,
        fragen_gesamt: ergebnis.fragenGesamt,
        fehler: ergebnis.fehler,
        bestanden: ergebnis.bestanden,
        zeitpunkt: ergebnis.zeitpunkt,
      }),
    );
  }

  async ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client
        .from("pruefungen")
        .select("*")
        .eq("username", username)
        .order("zeitpunkt", { ascending: false })
        .limit(limit),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      username: String(z.username),
      fragenGesamt: Number(z.fragen_gesamt),
      fehler: Number(z.fehler),
      bestanden: Boolean(z.bestanden),
      zeitpunkt: String(z.zeitpunkt),
    }));
  }

  async ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lektion_fortschritt").select("*").eq("username", username),
    );
    return (zeilen ?? []).map((z) => ({
      username: String(z.username),
      lektionId: String(z.lektion_id),
      teil: Number(z.teil),
      abgeschlossenAm: String(z.abgeschlossen_am),
    }));
  }

  async lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_fortschritt").upsert({
        username,
        lektion_id: lektionId,
        teil,
        abgeschlossen_am: new Date().toISOString(),
      }),
    );
  }

  async ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lektion_inhalt_ueberschreibung").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      zeichen: String(z.zeichen),
      beispielwortTamil: (z.beispielwort_tamil as string | null) ?? null,
      beispielwortDeutsch: (z.beispielwort_deutsch as string | null) ?? null,
      bildUrl: (z.bild_url as string | null) ?? null,
    }));
  }

  async speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_inhalt_ueberschreibung").upsert({
        zeichen: u.zeichen,
        beispielwort_tamil: u.beispielwortTamil,
        beispielwort_deutsch: u.beispielwortDeutsch,
        bild_url: u.bildUrl,
        aktualisiert_am: new Date().toISOString(),
      }),
    );
  }

  async loescheLektionUeberschreibung(zeichen: string): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_inhalt_ueberschreibung").delete().eq("zeichen", zeichen),
    );
  }

  async bildHochladen(zeichen: string, datei: File): Promise<string> {
    const pfad = `${zeichen}-${Date.now()}.${datei.name.split(".").pop() ?? "png"}`;
    const { error } = await this.client.storage
      .from("lektion-bilder")
      .upload(pfad, datei, { upsert: true });
    if (error) throw new Error(error.message);
    return this.client.storage.from("lektion-bilder").getPublicUrl(pfad).data.publicUrl;
  }

  async ladeCheckpointKonfig(stufeId: string): Promise<StufenCheckpointKonfig> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("stufen_checkpoint_konfig").select("*").eq("stufe_id", stufeId).limit(1),
    );
    if (!zeilen || zeilen.length === 0) return standardCheckpointKonfig(stufeId);
    const z = zeilen[0];
    return {
      stufeId: String(z.stufe_id),
      toleranzProzent: Number(z.toleranz_prozent),
      anzahlVorherigeBuchstaben: Number(z.anzahl_vorherige_buchstaben),
    };
  }

  async speichereCheckpointKonfig(konfig: StufenCheckpointKonfig): Promise<void> {
    await this.abfrage(
      this.client.from("stufen_checkpoint_konfig").upsert({
        stufe_id: konfig.stufeId,
        toleranz_prozent: konfig.toleranzProzent,
        anzahl_vorherige_buchstaben: konfig.anzahlVorherigeBuchstaben,
      }),
    );
  }

  async checkpointSpeichern(ergebnis: StufenCheckpointErgebnis): Promise<void> {
    await this.abfrage(
      this.client.from("stufen_checkpoint_ergebnisse").insert({
        username: ergebnis.username,
        stufe_id: ergebnis.stufeId,
        bestanden: ergebnis.bestanden,
        richtig: ergebnis.richtig,
        gesamt: ergebnis.gesamt,
        zeitpunkt: ergebnis.zeitpunkt,
      }),
    );
  }

  async ladeCheckpoints(username: string, stufeId: string): Promise<StufenCheckpointErgebnis[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client
        .from("stufen_checkpoint_ergebnisse")
        .select("*")
        .eq("username", username)
        .eq("stufe_id", stufeId)
        .order("zeitpunkt", { ascending: false }),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      username: String(z.username),
      stufeId: String(z.stufe_id),
      bestanden: Boolean(z.bestanden),
      richtig: Number(z.richtig),
      gesamt: Number(z.gesamt),
      zeitpunkt: String(z.zeitpunkt),
    }));
  }
}

// ---------------------------------------------------------------------------
// Lokales Backend (Test-Modus ohne Supabase)
// ---------------------------------------------------------------------------

interface LokaleDb {
  accounts: Record<string, { rolle: Rolle }>;
  punkte: Record<string, PunkteStand>;
  regeln: Record<string, RegelEintrag>;
  fehler: FehlerEintrag[];
  leitner: Record<string, LeitnerEintrag[]>; // pro Benutzername
  hausaufgaben: Hausaufgabe[];
  hausaufgabenStatus: HausaufgabenStatus[];
  pruefungen: PruefungsErgebnis[];
  lektionFortschritt: LektionFortschritt[];
  lektionUeberschreibungen: Record<string, LektionInhaltUeberschreibung>;
  checkpointKonfig: Record<string, StufenCheckpointKonfig>;
  checkpointErgebnisse: StufenCheckpointErgebnis[];
  naechsteId: number;
}

const LOKAL_KEY = "tamil_lernen_db_v1";

class LokaleDatenquelle implements Datenquelle {
  private lade(): LokaleDb {
    const leer: LokaleDb = {
      accounts: {},
      punkte: {},
      regeln: {},
      fehler: [],
      leitner: {},
      hausaufgaben: [],
      hausaufgabenStatus: [],
      pruefungen: [],
      lektionFortschritt: [],
      lektionUeberschreibungen: {},
      checkpointKonfig: {},
      checkpointErgebnisse: [],
      naechsteId: 1,
    };
    try {
      const roh = localStorage.getItem(LOKAL_KEY);
      // Mit den Standardwerten mischen, damit ältere, lokal gespeicherte
      // Stände auch nach neu hinzugekommenen Feldern nicht abstürzen.
      if (roh) return { ...leer, ...(JSON.parse(roh) as Partial<LokaleDb>) };
    } catch {
      // beschädigte Daten → frisch starten
    }
    return leer;
  }

  private speichere(db: LokaleDb) {
    localStorage.setItem(LOKAL_KEY, JSON.stringify(db));
  }

  async loginOderAnlegen(username: string): Promise<Konto> {
    const db = this.lade();
    if (!db.accounts[username]) {
      // Im Test-Modus wird der Name "lehrer" automatisch Lehrer, damit sich
      // das Dashboard ohne Datenbank ausprobieren lässt.
      db.accounts[username] = {
        rolle: username.toLowerCase() === "lehrer" ? "lehrer" : "schueler",
      };
      db.punkte[username] = leererPunkteStand();
      this.speichere(db);
    }
    return { username, rolle: db.accounts[username].rolle };
  }

  async ladePunkte(username: string): Promise<PunkteStand> {
    return this.lade().punkte[username] ?? leererPunkteStand();
  }

  async speicherePunkte(username: string, stand: PunkteStand): Promise<void> {
    const db = this.lade();
    db.punkte[username] = stand;
    this.speichere(db);
  }

  async ladeRegeln(): Promise<RegelEintrag[]> {
    return Object.values(this.lade().regeln);
  }

  async speichereRegel(eintrag: RegelEintrag): Promise<void> {
    const db = this.lade();
    db.regeln[eintrag.buchstabe] = eintrag;
    this.speichere(db);
  }

  async loescheRegel(buchstabe: string): Promise<void> {
    const db = this.lade();
    delete db.regeln[buchstabe];
    this.speichere(db);
  }

  async logFehler(eintrag: FehlerEintrag): Promise<void> {
    const db = this.lade();
    db.fehler.push({ ...eintrag, id: db.naechsteId++ });
    if (db.fehler.length > 500) db.fehler = db.fehler.slice(-500);
    this.speichere(db);
  }

  async ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]> {
    return this.lade()
      .fehler.filter((f) => f.username === username)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
      .slice(0, limit);
  }

  async ladeLeitner(username: string): Promise<LeitnerEintrag[]> {
    return this.lade().leitner[username] ?? [];
  }

  async speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void> {
    const db = this.lade();
    const liste = db.leitner[username] ?? [];
    const index = liste.findIndex(
      (l) => l.zeichen === eintrag.zeichen && l.modus === eintrag.modus,
    );
    if (index >= 0) liste[index] = eintrag;
    else liste.push(eintrag);
    db.leitner[username] = liste;
    this.speichere(db);
  }

  async ladeAlleSchueler(): Promise<SchuelerUebersicht[]> {
    const db = this.lade();
    return Object.entries(db.accounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([username, konto]) => ({
        konto: { username, rolle: konto.rolle },
        punkte: db.punkte[username] ?? leererPunkteStand(),
      }));
  }

  async hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void> {
    const db = this.lade();
    db.hausaufgaben.unshift({
      ...h,
      id: db.naechsteId++,
      erstelltAm: new Date().toISOString(),
    });
    this.speichere(db);
  }

  async hausaufgabeLoeschen(id: number): Promise<void> {
    const db = this.lade();
    db.hausaufgaben = db.hausaufgaben.filter((h) => h.id !== id);
    db.hausaufgabenStatus = db.hausaufgabenStatus.filter((s) => s.hausaufgabeId !== id);
    this.speichere(db);
  }

  async ladeHausaufgaben(): Promise<Hausaufgabe[]> {
    return this.lade().hausaufgaben;
  }

  async ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]> {
    return this.lade().hausaufgabenStatus;
  }

  async speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void> {
    const db = this.lade();
    const index = db.hausaufgabenStatus.findIndex(
      (s) => s.hausaufgabeId === status.hausaufgabeId && s.username === status.username,
    );
    if (index >= 0) db.hausaufgabenStatus[index] = status;
    else db.hausaufgabenStatus.push(status);
    this.speichere(db);
  }

  async pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void> {
    const db = this.lade();
    db.pruefungen.push({ ...ergebnis, id: db.naechsteId++ });
    this.speichere(db);
  }

  async ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]> {
    return this.lade()
      .pruefungen.filter((p) => p.username === username)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
      .slice(0, limit);
  }

  async ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]> {
    return this.lade().lektionFortschritt.filter((f) => f.username === username);
  }

  async lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void> {
    const db = this.lade();
    const bereitsDa = db.lektionFortschritt.some(
      (f) => f.username === username && f.lektionId === lektionId && f.teil === teil,
    );
    if (!bereitsDa) {
      db.lektionFortschritt.push({
        username,
        lektionId,
        teil,
        abgeschlossenAm: new Date().toISOString(),
      });
      this.speichere(db);
    }
  }

  async ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]> {
    return Object.values(this.lade().lektionUeberschreibungen);
  }

  async speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void> {
    const db = this.lade();
    db.lektionUeberschreibungen[u.zeichen] = u;
    this.speichere(db);
  }

  async loescheLektionUeberschreibung(zeichen: string): Promise<void> {
    const db = this.lade();
    delete db.lektionUeberschreibungen[zeichen];
    this.speichere(db);
  }

  async bildHochladen(_zeichen: string, datei: File): Promise<string> {
    // Test-Modus ohne Storage: Bild als data:-URL direkt im localStorage.
    return await new Promise<string>((resolve, reject) => {
      const leser = new FileReader();
      leser.onload = () => resolve(String(leser.result));
      leser.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
      leser.readAsDataURL(datei);
    });
  }

  async ladeCheckpointKonfig(stufeId: string): Promise<StufenCheckpointKonfig> {
    return this.lade().checkpointKonfig[stufeId] ?? standardCheckpointKonfig(stufeId);
  }

  async speichereCheckpointKonfig(konfig: StufenCheckpointKonfig): Promise<void> {
    const db = this.lade();
    db.checkpointKonfig[konfig.stufeId] = konfig;
    this.speichere(db);
  }

  async checkpointSpeichern(ergebnis: StufenCheckpointErgebnis): Promise<void> {
    const db = this.lade();
    db.checkpointErgebnisse.push({ ...ergebnis, id: db.naechsteId++ });
    this.speichere(db);
  }

  async ladeCheckpoints(username: string, stufeId: string): Promise<StufenCheckpointErgebnis[]> {
    return this.lade()
      .checkpointErgebnisse.filter((c) => c.username === username && c.stufeId === stufeId)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
  }
}

// ---------------------------------------------------------------------------
// Auswahl des Backends
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const istLokalerModus = !supabaseUrl || !supabaseKey;

export const datenquelle: Datenquelle = istLokalerModus
  ? new LokaleDatenquelle()
  : new SupabaseDatenquelle(createClient(supabaseUrl!, supabaseKey!));
