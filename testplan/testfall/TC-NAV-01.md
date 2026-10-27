[← Testplan](../index.md)

# TC-NAV-01 · Flikraden

| | |
|---|---|
| **Område** | Navigering |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/navigering.spec.js`](../../tests/navigering.spec.js#L5) – *flikraden byter mellan Uppdrag, Karta, Tid och Mer* |

## Förutsättningar

- Inloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på Uppdrag, Karta, Tid och Mer längst ner | Rätt vy visas och aktiv flik är markerad |
| 2 | Öppna Nytt uppdrag eller ett uppdragskort | Flikraden döljs så att knapparna får plats |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
