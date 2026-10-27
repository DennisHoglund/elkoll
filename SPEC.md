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

## 4. Funktioner (steg 1–5, klart)
### 4.1 Inloggning
- E-post + lösenord. Ny kollega skapar konto i appen (`signUp`). Bekräftelsemejl enligt projektets befintliga inställningar.
### 4.2 Teamet
- Första gången: gå med (någon har lagt till din e-post) eller skapa nytt team (företag, ditt namn, mobil).
- Lista med namn, mobil, e-post, ringknapp och **Skicka inbjudan** (öppnar sms med länk, instruktion och e-posten kollegan ska använda – appen skickar inget mejl själv). Lägg till kollega (namn, mobil, e-post). Ta bort med två tryck – alla i teamet får ta bort andra, inte sig själva.
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

### 4.12 Navigering, Tid-flik och ägare
- **Flikrad** längst ner: Uppdrag · Karta · Tid · Mer (aktiv flik svart med orange streck). Döljs på välkomstsidan, i formuläret och på uppdragskortet. **Nytt uppdrag** ligger ovanför flikraden.
- **Tid**: pågående tid (klocka, uppdrag, Stoppa) och *Min vecka* med staplar per dag; röd prick på fliken medan tid pågår. Länk till teamets tidrapport.
- **Mer**: profil, Teamet, Fakturering (bara ägare, med antal att fakturera), Tidrapport för teamet, Utseende, Logga ut, version.
- **Ägare** (`elkoll_medlem.agare`): ser Fakturering och kan utse/ta bort ägare under Teamet. Den som skapar teamet blir ägare; team utan ägare räknas som att alla är ägare tills någon utses. Obs: döljer vyn i appen – databasen skyddar på teamnivå, inte per roll.
- **Ej klart sedan tidigare**: på idag visas uppdrag från tidigare dagar som inte är Klar (t.ex. Återbesök) överst med sitt datum.

### 4.11 Fakturering (underlag)
- Mer → **Fakturering** (bara ägare): flikarna *Att fakturera (N)* och *Fakturerade*. Klara uppdrag grupperade per kund (namn, annars adress) med tid totalt och per person, material, anteckningar och **Öppna**.
- **Markera fakturerad** sätter `fakturerad_at`; **Ångra** nollställer. Uppdragskortet visar *Fakturerad {datum}*.
- **Debiteras inte** (kryssruta under Status) sätter `debiteras = false` för garanti/internt arbete – sådana uppdrag hamnar aldrig under Att fakturera.
- **Exportera underlag (CSV)**: period (Denna månad / Förra månaden / egna datum), ev. *Bara ej fakturerade*. En rad per klart uppdrag: datum, kund, adress, uppdrag, fakturastatus, timmar totalt och per person, material, anteckning, fakturerad, uppdrags-id. Semikolon, decimalkomma och BOM för svensk Excel. Öppnas i Dela-menyn (Mail, Filer, AirDrop) via Web Share, annars nedladdning.
- Elkoll gör inga fakturor eller priser; underlaget förs in i kundens bokföringsprogram. Ev. Fortnox-koppling är nästa steg.

### 4.10 Tidrapport
- På uppdragskortet: **Starta tid** / **Stoppa · 0:42** (klockan uppdateras), lista över pass (vem, när, längd) och totalt. Lägg till tid i efterhand (från–till, datum) och ta bort egna pass med två tryck.
- En pågående tid per person: startar man på ett annat uppdrag stoppas den förra. **Klar** stoppar tiden. Listan visar chipet *Tid pågår*.
- Mer → **Tidrapport för teamet**: vecka för vecka, per person totalt och per dag med uppdrag och tider.
- Tabell `elkoll_tid(id, team_id, uppdrag_id, medlem_id, start, slut)` – `slut = null` betyder pågående. Köas offline (`tid`/`tid-delete` i `ko.js`); pågående tid sparas också i `localStorage` och hämtas från servern om den startats på en annan enhet.

### 4.9 Kundregister med autofyll
- När man skriver minst 2 tecken i **Kund** eller **Adress** föreslås upp till 5 tidigare kunder/adresser (alla ord måste finnas i namn eller adress), sorterade på antal besök och senaste datum.
- Ett tryck fyller i adress, kund, telefon och portkod. Kunder byggs av teamets uppdrag (namn + gata, senaste uppgifter vinner) – ingen egen tabell.
- Historiken hämtas en gång per session (max 1000 uppdrag) och cachas för användning utan täckning.

### 4.8 Platsminne
- På uppdragskortet: *Varit här förut: N besök* (eller *N andra besök på adressen* om de är kommande). Tryck för datum, uppgift, vem, status och anteckningar; tryck på ett besök för att öppna det.
- Matchning: samma gata och nummer (delen före första kommatecknet, utan hänsyn till skiftläge och mellanslag). Står orten med i båda adresserna måste den stämma (postnummer ignoreras), så samma gatunamn i en annan ort räknas inte. Koordinater används inte – de kan vara fel för adresser utan ort.
- Hämtas från servern (hela historiken, max 30) med lokal lista som reserv utan täckning. Uppdrag äldre än 60 dagar hämtas när de öppnas.

### 4.7 Karta per datum (steg 4)
- Kartikonen bredvid avataren. Dagens uppdrag som numrerade nålar i samma ordning som listan, Mina/Alla och dagbyte delas med listan.
- Tryck på nål: kort med tid, adress, uppgift, **Navigera** och **Öppna**. Egen position (blå prick) och positionsknapp.
- Lager: Karta (OSM), Satellit (Esri), Terräng (OpenTopoMap) med Leaflets standardkontroll. Kartrutor cachas för dålig täckning.
- Adresser geokodas med OpenStreetMap Nominatim när uppdraget sparas (max 4 s) och sparas som `lat`/`lon`. Uppdrag utan plats geokodas när dagen visas på kartan; adresser som inte hittas listas som "saknar plats".

### 4.6 Dokumentation på plats (steg 5)
- På uppdragskortet: foton **Före** och **Efter** (Ta foto → kamera eller bildbibliotek), tryck för att visa stort, ta bort med två tryck.
- Foton krymps till ≤ 250 kB JPEG (max 1280 px), sparas i IndexedDB som ArrayBuffer och laddas upp till privata bucketen `elkoll-foton` under `<team>/<uppdrag>/<foto>.jpg`. Visas via signerade URL:er.
- Anteckningar (dikteras) sparas i `kommentar` på uppdraget.
- Tas uppdraget bort tas dess foton också bort.

## 5. Datamodell (`supabase/schema.sql`)
- `elkoll_team(id, namn, skapad_av)`
- `elkoll_medlem(id, team_id, namn, telefon, epost, agare)` – unik per team och e-post.
- `elkoll_uppdrag(id text, team_id, skapad_av, fran, tilldelad, datum, tid, adress, lat, lon, debiteras, fakturerad_at, kund, telefon, portkod, uppgift, material[], saknas[], fritext, status, kommentar)`
- `elkoll_tid(id text, team_id, uppdrag_id, medlem_id, start, slut)` – tidrapport.
- `elkoll_foto(id text, uppdrag_id, team_id, typ fore|efter, path, skapad_av)` + bucket `elkoll-foton` (storage-policies på första mappnivån = team).
- RLS: funktionen `elkoll_mina_team()` ger team där inloggningens e-post finns i `elkoll_medlem`. Allt filtreras på den. `anon` får inget.

## 6. Lagring och offline
- Uppdrag sparas först i IndexedDB-kö (`ko.js`), sedan `upsert` på id. Borttagning köas också.
- Synk och hämtning av kollegornas ändringar (team + uppdrag) vid inloggning, `online`, när appen öppnas igen (`visibilitychange`/`pageshow`) och var 30:e sekund medan appen syns. Märket "N väntar".
- Senaste team och uppdrag cachas i `localStorage` för visning utan täckning.
- Service worker: appfiler nätet först, CDN/typsnitt cache först, `/rapport/` ignoreras.

## 7. Tester
- Playwright, iPhone 14 (WebKit) och Pixel 7 (Chromium). Supabase, tolkningsfunktionen, CDN och typsnitt mockas i `tests/mock.js`.
- Testplan i `testplan/` (70 testfall, 62 automatiserade). Rapport: https://dennishoglund.github.io/elkoll/rapport/

## 8. Beslut
- Inloggning med lösenord i stället för magisk länk – delat projekt utan egen SMTP.
- Medlemskap via e-post i stället för inbjudningslänkar – enklast för fyra personer.
- Diktering via tangentbordet (ingen egen ljudinspelning) – fungerar redan överallt och kostar inget.
- Gemini för tolkning – gratisnivån räcker för ett litet team.

## 9. Kvar att göra
- Egenkontroll (checklista per uppdragstyp).
- Push-notis vid nytt uppdrag.
