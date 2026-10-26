# Elkoll – instruktioner för AI-assistenter

Läs `SPEC.md` för hela specifikationen. Det här är reglerna som gäller vid varje ändring.

## Projektet
- PWA för ett litet hantverkarteam (ca 4 personer): uppdrag dikteras, tolkas av AI och visas per dag.
- Ren HTML/CSS/JS **utan byggsteg**. Inga ramverk, ingen bundler. Bibliotek via CDN med låst version.
- Supabase (auth + Postgres + Edge Function `elkoll-tolka` med Gemini), GitHub Pages via Actions.

## Språk och ton
- All UI-text, felmeddelanden, kommentarer, commit-meddelanden och testnamn på **svenska**.
- Kort och praktiskt. Felmeddelanden säger vad som hände och vad man kan göra.

## Får aldrig brytas
- **Supabase-projektet delas med Jaktvind och Svampkartan.** Rör aldrig deras tabeller (`logg`, `platser`, `svamp_*`),
  auth-inställningar eller mejlmallar. Allt eget har prefixet `elkoll_` (tabeller, index, policies, funktioner).
- Schemaändringar görs i `supabase/schema.sql` och ska gå att köra flera gånger (`if not exists`, `drop policy if exists`).
- RLS på alla tabeller: bara teamets medlemmar via `elkoll_mina_team()`. `anon` får inget.
- Inga hemligheter i koden. Endast den publika publishable-nyckeln i `config.js`. Gemini-nyckeln ligger bara i Supabase.
- Ett uppdrag får aldrig gå förlorat: spara lokalt (IndexedDB via `ko.js`) först, skicka sedan.

## Vid varje ändring
1. Höj `CACHE`-versionen i `sw.js` (`elkoll-vN`) och `version` i `config.js` (samma N) när appfiler ändras, och lägg nya filer i `SHELL`.
2. Nya JS-filer: lägg till `<script>` i `index.html` och i `SHELL`.
3. Kör testerna: `npx playwright test` (lokalt räcker `--project="Android (Chromium)"` om WebKit saknas).
4. Lägg till eller uppdatera tester i `tests/`. All extern trafik mockas i `tests/mock.js`. `bild(page, 'Namn')` för skärmdumpar i rapporten.
5. Lägg till eller uppdatera testfall i `testplan/` och koppla med `{ annotation: { type: 'testfall', description: 'TC-…' } }`. Kör `npm run testplan`.
6. Uppdatera `SPEC.md` (och `README.md` vid behov).
7. Committa med beskrivande svenskt meddelande och pusha till `main`. CI testar och publicerar.

## Design
- Färgprofil **Arbetskläder** med ljust och mörkt läge via CSS-variabler i `styles.css`. Använd alltid variablerna.
- Stora tryckytor (≥ 44 px, primärknappar 56–60 px), läsbart i sol, `env(safe-area-inset-*)`.
- Generella `input`/`label`-regler begränsas till `.form`.

## Kod
- Moduler som IIFE på `window` (`ElkollUtil`, `ElkollKo`, `ElkollTeam`, `ElkollUppdrag`).
- `localStorage` alltid via `ElkollUtil.store` (try/catch). Nycklar börjar med `elkoll-`.
- Escapa all användartext som hamnar i HTML (`esc()`).

## Tester och rapport
- Playwright på iPhone 14 (WebKit) och Pixel 7 (Chromium). Rapport: https://dennishoglund.github.io/elkoll/rapport/
- Rött i WebKit men grönt i Chromium betyder oftast ett riktigt Safari-problem – fixa appen, inte testet.
