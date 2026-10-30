# Elkoll

Dagens uppdrag för hantverkarteamet. Diktera uppdraget, låt AI fylla i fälten, tilldela en kollega – och se allt på plats.

- **App:** https://dennishoglund.github.io/elkoll/
- **Testrapport:** https://dennishoglund.github.io/elkoll/rapport/
- **Specifikation:** [SPEC.md](SPEC.md) · **Backlog:** [BACKLOG.md](BACKLOG.md) · **Testplan:** [testplan/index.md](testplan/index.md)

## Kom igång (en gång)
1. **Databas:** Supabase → SQL Editor → New query → klistra in `supabase/schema.sql` → Run.
2. **Tolkning:** Supabase → Edge Functions → skapa funktionen `elkoll-tolka` med koden i `supabase/functions/elkoll-tolka/index.ts`.
   Lägg hemligheten `GEMINI_API_KEY` under Edge Functions → Secrets (nyckel från aistudio.google.com). Valfritt: `GEMINI_MODEL` för att byta modell utan att ändra koden (standard `gemini-3.8-flash`).
3. **GitHub Pages:** Settings → Pages → Source: **GitHub Actions**.
4. Öppna appen i Safari → Dela → Lägg till på hemskärmen.

## Filer
| Fil | Innehåll |
|---|---|
| `index.html`, `styles.css` | Vyer och färgprofil (ljust/mörkt) |
| `app.js` | Tema, inloggning, navigering, synk |
| `team.js` | Teamet: skapa, lägga till, ta bort |
| `uppdrag.js` | Lista per dag, nytt uppdrag med tolkning, uppdragskort |
| `ko.js` | Offline-kö i IndexedDB |
| `util.js`, `config.js` | Hjälpfunktioner, Supabase-inställningar |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA |
| `supabase/` | Databasschema och tolkningsfunktion |

## Tester
```bash
npm ci
npx playwright install webkit chromium
npm test
```
