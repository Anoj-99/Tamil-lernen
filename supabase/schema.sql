-- Tamil-Lernen: Datenbankschema
-- Einmalig im Supabase SQL-Editor ausführen (neues, eigenes Projekt,
-- getrennt von TamilConnect).
--
-- Hinweis Sicherheit: Die App arbeitet bewusst ohne Passwörter. Alle
-- Tabellen sind für den anon-Key les- und schreibbar. Es dürfen hier
-- also keine schützenswerten Daten liegen (tut es auch nicht: nur
-- Benutzernamen, Punkte und Übungsstatistiken).

create table accounts (
  username text primary key,
  rolle text not null default 'schueler' check (rolle in ('lehrer', 'schueler')),
  erstellt_am timestamptz not null default now()
);

create table punkte (
  username text primary key references accounts(username) on delete cascade,
  ep_gesamt integer not null default 0,
  ep_heute integer not null default 0,
  heute_datum date not null default current_date,
  streak_tage integer not null default 0,
  letzter_lerntag date,
  freeze_verfuegbar boolean not null default true,
  freeze_woche text not null default ''
);

create table buchstaben_regeln (
  buchstabe text primary key,
  position_wert text not null check (
    position_wert in ('nur_mitte', 'mitte_und_ende', 'anfang_mitte_ende')
  ),
  position_hinweis text,
  vom_lehrer_angepasst boolean not null default false,
  aktualisiert_am timestamptz not null default now()
);

create table fehlerverlauf (
  id bigint generated always as identity primary key,
  username text not null references accounts(username) on delete cascade,
  zeichen text not null,
  modus text not null,
  richtige_antwort text not null default '',
  gegebene_antwort text not null default '',
  zeitpunkt timestamptz not null default now()
);
create index fehlerverlauf_username_idx on fehlerverlauf (username, zeitpunkt desc);

create table lernfortschritt (
  username text not null references accounts(username) on delete cascade,
  zeichen text not null,
  modus text not null,
  fach integer not null default 1,
  richtig_gesamt integer not null default 0,
  falsch_gesamt integer not null default 0,
  zuletzt_geuebt timestamptz not null default now(),
  primary key (username, zeichen, modus)
);

create table hausaufgaben (
  id bigint generated always as identity primary key,
  zugewiesen_von text not null references accounts(username),
  zugewiesen_an text not null default 'alle',
  gruppe_id text not null,
  soll_anzahl integer not null default 20,
  erstellt_am timestamptz not null default now()
);

create table hausaufgaben_status (
  hausaufgabe_id bigint not null references hausaufgaben(id) on delete cascade,
  username text not null references accounts(username) on delete cascade,
  fortschritt integer not null default 0,
  erledigt_am timestamptz,
  primary key (hausaufgabe_id, username)
);

create table pruefungen (
  id bigint generated always as identity primary key,
  username text not null references accounts(username) on delete cascade,
  fragen_gesamt integer not null,
  fehler integer not null,
  bestanden boolean not null,
  zeitpunkt timestamptz not null default now()
);
create index pruefungen_username_idx on pruefungen (username, zeitpunkt desc);

-- RLS aktivieren und für anon freigeben (bewusst offen, siehe Hinweis oben).
alter table accounts enable row level security;
alter table punkte enable row level security;
alter table buchstaben_regeln enable row level security;
alter table fehlerverlauf enable row level security;
alter table lernfortschritt enable row level security;
alter table hausaufgaben enable row level security;
alter table hausaufgaben_status enable row level security;
alter table pruefungen enable row level security;

create policy "anon alles" on accounts for all to anon using (true) with check (true);
create policy "anon alles" on punkte for all to anon using (true) with check (true);
create policy "anon alles" on buchstaben_regeln for all to anon using (true) with check (true);
create policy "anon alles" on fehlerverlauf for all to anon using (true) with check (true);
create policy "anon alles" on lernfortschritt for all to anon using (true) with check (true);
create policy "anon alles" on hausaufgaben for all to anon using (true) with check (true);
create policy "anon alles" on hausaufgaben_status for all to anon using (true) with check (true);
create policy "anon alles" on pruefungen for all to anon using (true) with check (true);

-- Lehrer-Rolle vergeben (Benutzername anpassen), z.B. hier im SQL-Editor:
-- update accounts set rolle = 'lehrer' where username = 'DEIN_NAME';
