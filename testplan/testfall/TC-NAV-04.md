[← Testplan](../index.md)

# TC-NAV-04 · Tid-fliken

| | |
|---|---|
| **Område** | Navigering |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/navigering.spec.js`](../../tests/navigering.spec.js#L46) – *Tid-fliken visar pågående tid och min vecka* |

## Förutsättningar

- Tid pågår

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på fliken Tid | Pågående tid med uppdrag och **Stoppa**, samt Min vecka per dag. Röd prick på fliken medan tid pågår |
| 2 | Tryck **Stoppa** | Tiden sparas och pricken försvinner |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
