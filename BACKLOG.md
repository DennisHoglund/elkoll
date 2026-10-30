# Elkoll – backlog (beslutade förslag, ej byggda)

Det som är byggt står i `SPEC.md`. Här ligger det vi ska göra men inte påbörjat.
Varje punkt: bakgrund, krav, öppna frågor. Senast uppdaterad 2026-10-30.

---

## B1. Material att köpa (prio 1)

**Bakgrund.** Teamet behöver se vad som ska köpas in innan ett jobb. Stora appar (Fieldly, Mowin, ServiceTitan)
löser inköp med EDI-kopplingar mot grossister (Ahlsell, Elektroskandia, Solar, Selga m.fl.) så att inköpt material
hamnar på arbetsordern och fakturan. Ingen av dem har en enkel delad inköpslista. EDI kräver avtal per grossist och
är för stort för PoC.

**Krav**
1. Varje materialrad på ett uppdrag kan markeras **Har** eller **Köpa** (standard: Har). Stor tryckyta, ett tryck växlar.
2. Ny delad lista **Att köpa** för hela teamet (nås från Mer, ev. räknare/prick på fliken):
   - grupperad per uppdrag/datum, närmast datum först,
   - varje rad visar material, uppdrag (kund/adress) och datum,
   - bocka av → "Köpt av <namn>" + tid, syns för alla,
   - ångra köpt,
   - köpta rader döljs efter uppdragets datum eller under "Visa köpta".
3. Uppdragskortet visar köpstatus per rad (Köpa / Köpt av X).
4. Fungerar offline via kön som allt annat.
5. AI-tolkningen (när den är på) kan sätta Köpa när man säger "behöver köpa", "beställ", "saknas" o.d.

**Datamodell (förslag)**
- Antingen ny tabell `elkoll_material(id, team_id, uppdrag_id, namn, kopa bool, kopt_av, kopt_at)`
  eller utöka `material[]` till jsonb. Tabell rekommenderas (enklare RLS, avbockning per rad, historik).
- Befintlig `material text[]` migreras/läses som Har-rader.

**Öppna frågor (till Dennis/ägarna)**
- Handlar de på en eller flera grossister? Om flera: gruppera listan per grossist (fält `grossist`).
- Ska inköpt material in i fakturaunderlaget direkt eller räcker listan till en början?

---

## B2. Kvittofoto med AI-tolkning (prio 1, hör ihop med B1 och B3)

**Bakgrund.** Enklaste sättet att få inköp till fakturan utan integration: fota kvittot/följesedeln.
Så gör många ServiceTitan-användare (en materialrad med totalbelopp + kvittofoto).

**Krav**
1. Ny fototyp **Kvitto** (utöver före/efter) på uppdragskortet. Återanvänd `foto.js` och bucket `elkoll-foton`.
2. Valfritt belopp (kr, exkl. moms) och grossist per kvitto.
3. Fakturaunderlaget (`#faktura`) visar kvitton och summa per uppdrag. Bild öppnas i stort läge.
4. CSV-exporten får kolumnen `Material kr` (summa kvitton).
5. Schema: `elkoll_foto.typ` tillåter `kvitto`; ev. kolumner `belopp numeric`, `grossist text`.

**AI-tolkning av kvittot** (Handyfy har detta – vi vill ha det också)
6. Efter fotot skickas bilden till Edge Function `elkoll-kvitto` (ny, eller nytt läge i `elkoll-tolka`) som
   anropar Claude Haiku 5.5 med bilden (vision). Samma secret `ANTHROPIC_API_KEY` som B3.
7. Utdata som JSON: `grossist`, `datum`, `belopp_exkl_moms`, `moms`, `belopp_inkl_moms`, `kvittonr`,
   och `rader[]` med `artikel`, `artikelnr`, `antal`, `a_pris`, `summa`.
8. Fälten fylls i förslagsvis – användaren ser och kan rätta innan sparning. Inget sparas automatiskt utan bekräftelse.
9. Artikelrader kan bockas av mot uppdragets Köpa-rader i B1 ("Köpt av X" sätts automatiskt vid matchning).
10. Offline eller fel: fotot sparas ändå (kön), tolkningen görs när täckning finns eller fylls i för hand.
11. Bilden krymps som idag (≤ 250 kB) men med högre upplösning för text (t.ex. 1600 px långsida) innan den skickas.
12. Ingen kortinformation eller personnummer sparas – bara fälten ovan.
13. Tester: mocka `elkoll-kvitto` i `tests/mock.js` (lyckad tolkning, felaktig bild, timeout).

---

## B3. AI-tolkning via Claude (pausad, väntar på API-nyckel)

**Bakgrund.** Gemini (gratis) gav 404/503 och timeouts. Dikteringen sker fortsatt med tangentbordet; bara
tolkningen byts.

**Krav**
1. `elkoll-tolka` anropar Claude Haiku 5.5 (`claude-haiku-5-5`) i första hand.
   - Secret `ANTHROPIC_API_KEY`, valfri `TOLKA_MODELL`.
   - Strukturerad JSON-utdata med samma fält som idag.
2. Timeout 10 s mot Claude. Gemini används som reserv om Gemini-nyckel finns.
3. Klientens timeout sänks från 40 s till ca 15 s.
4. Tolkningsknappen visas igen i formuläret. Fel → tydligt meddelande, fälten kan alltid fyllas för hand.
5. Kostnadstak sätts i Anthropic Console (Billing → Limits).

**Kvar för Dennis:** skapa API-nyckel på console.anthropic.com och lägga den som secret i Supabase.

---

## B4. Före PoC hos elfirman

1. **Eget Supabase-projekt** för Elkoll (inte delat med Jaktvind/Svampkartan). Kör `schema.sql`, flytta secrets,
   byt URL/nyckel i `config.js`.
2. **Testdata**: ett demoteam med några uppdrag, kunder och tider, så att visningen ser verklig ut.
3. **Inbjudningstexten** (sms) och startsidan ska inte säga "Ny här? Skapa konto" när registrering är avstängd.
   Texten ska säga att ägaren skapar kontot och skickar lösenordet.

---

## B5. Senare / idéer

- Mejla fakturaunderlag/CSV automatiskt till ägarna (vi delar via delningsmenyn tills vidare).
- Egenkontroll: checklista per uppdragstyp.
- Push-notis vid nytt uppdrag.
- EDI-import av orderbekräftelser från grossist (som Fieldly), om firman vill ha det efter PoC.
