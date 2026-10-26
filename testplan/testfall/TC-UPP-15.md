[← Testplan](../index.md)

# TC-UPP-15 · Kollegors uppdrag dyker upp av sig själva

| | |
|---|---|
| **Område** | Uppdrag |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/uppdrag.spec.js`](../../tests/uppdrag.spec.js#L24) – *kollegans nya uppdrag syns när appen öppnas igen* |

## Förutsättningar

- Två telefoner i samma team

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Kollegan sparar ett uppdrag till dig | Inom 30 sekunder, eller direkt när du öppnar appen igen, syns uppdraget hos dig utan att logga ut |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
