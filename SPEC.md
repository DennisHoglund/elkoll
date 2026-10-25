# Elkoll – specifikation

## 1. Syfte
Ett litet hantverkarföretag (ca 4 personer) får uppdrag från varandra, ofta kvällen innan via sms eller samtal.
Elkoll gör överlämningen strukturerad: man dikterar fritt, AI gör om texten till ett uppdragskort, och mottagaren
ser dagens uppdrag med allt som behövs på plats (adress, kund, telefon, portkod, material).

## 2. Stack
- PWA för iPhone (och Android), ren HTML/CSS/JS utan byggsteg. Moduler som IIFE på `window`.
- Supabase (auth, Postgres, Edge Functions) – **delat projekt** med Jaktvind och Svampkartan. Allt eget har prefixet `elkoll_`.
- Tolkning: Supabase Edge Function `elkoll-tolka` som anropar Google Gemini (`GEMINI_API_KEY` som hemlighet, modell via `GEMINI_MODEL`, standard `gemini-3.8-flash` – 2.5 är stängd för nya projekt sedan sept 2026).
- GitHub Pages via Actions. Playwright-tester med egen rapport.

## 3. Design
- Färgprofil **Arbetskläder**: bakgrund `#F4F4F2`, text `#17191C`, signalorange `#F76707` (mörkt läge: `#141517` / `#F1F1EF` / `#FF7A1A`).
- Typsnitt Archivo. Tryckytor ≥ 44 px, primärknappar 56–60 px – går att träffa med arbetshandskar och läsa i sol.
- Ikon: orange ruta med svart fält och orange blixt.
- GUI-skisser: Claude-artefakten *Hantverksappen – GUI-skisser*.

## 4. Funktioner (steg 1–3, klart)
### 4.1 Inloggning
- E-post + lösenord. Ny kollega skapar konto i appen (`signUp`). Bekräftelsemejl enligt projektets befintliga inställningar.
### 4.2 Teamet
- Första gången: gå med (någon har lagt till din e-post) eller skapa nytt team (företag, ditt namn, mobil).
- Lista med namn, mobil, e-post, ringknapp. Lägg till kollega (namn, mobil, e-post). Ta bort med två tryck – alla i teamet får ta bort andra, inte sig själva.
- Borttagen kollegas uppdrag blir otilldelade (`on delete set null`).
### 4.3 Dagens uppdrag
- Dagrad: idag + 6 dagar, prick på dagar med uppdrag. **Mina** / **Alla** (valet sparas).
- Kort per uppdrag: nummer, tid, uppgift, adress, från/kund, chips för status, mottagare (Alla), saknade uppgifter och "Väntar på täckning".
### 4.4 Nytt / ändra uppdrag
- Stort textfält för diktering med tangentbordets mikrofon. **Tolka** fyller i datum, tid, adress, kund, telefon, portkod, uppgift, material.
- Tolkningen har tidsgräns (40 s i appen, ca 30 s i funktionen) med nya försök vid 503 och reservmodell – knappen hänger aldrig.
- Fält som tolkningen inte hittade markeras orange tills de fylls i. Tilldelning med knappar per kollega (eller Ingen).
- Krav: datum, adress, uppgift. Tolkningen är frivillig – utan nät eller funktion fyller man i själv.
### 4.5 Uppdragskort
- Navigera (Apple Kartor på iPhone, annars Google Maps), Ring kund, På väg-sms, Ring avsändaren.
- Kunduppgifter, portkod i stor stil, avsändarens originaltext, materiallista att bocka av (sparas lokalt), status Planerad/Klar/Återbesök, Ändra, Ta bort (två tryck).

## 5. Datamodell (`supabase/schema.sql`)
- `elkoll_team(id, namn, skapad_av)`
- `elkoll_medlem(id, team_id, namn, telefon, epost)` – unik per team och e-post.
- `elkoll_uppdrag(id text, team_id, skapad_av, fran, tilldelad, datum, tid, adress, kund, telefon, portkod, uppgift, material[], saknas[], fritext, status, kommentar)`
- RLS: funktionen `elkoll_mina_team()` ger team där inloggningens e-post finns i `elkoll_medlem`. Allt filtreras på den. `anon` får inget.

## 6. Lagring och offline
- Uppdrag sparas först i IndexedDB-kö (`ko.js`), sedan `upsert` på id. Borttagning köas också.
- Synk vid inloggning, `online`, `visibilitychange` och var 60:e sekund. Märket "N väntar".
- Senaste team och uppdrag cachas i `localStorage` för visning utan täckning.
- Service worker: appfiler nätet först, CDN/typsnitt cache först, `/rapport/` ignoreras.

## 7. Tester
- Playwright, iPhone 14 (WebKit) och Pixel 7 (Chromium). Supabase, tolkningsfunktionen, CDN och typsnitt mockas i `tests/mock.js`.
- Testplan i `testplan/` (31 testfall, 27 automatiserade). Rapport: https://dennishoglund.github.io/elkoll/rapport/

## 8. Beslut
- Inloggning med lösenord i stället för magisk länk – delat projekt utan egen SMTP.
- Medlemskap via e-post i stället för inbjudningslänkar – enklast för fyra personer.
- Diktering via tangentbordet (ingen egen ljudinspelning) – fungerar redan överallt och kostar inget.
- Gemini för tolkning – gratisnivån räcker för ett litet team.

## 9. Kvar att göra
- Steg 4: Karta per datum (Leaflet) med numrerade nålar och geokodade adresser.
- Steg 5: Dokumentera på plats – foton före/efter (≤ 250 kB i privat bucket `elkoll-foton`), dikterade anteckningar, egenkontroll.
- Push-notis vid nytt uppdrag. Platsminne (tidigare besök på samma adress).
