[← Testplan](../index.md)

# TC-DOK-01 · Ta foto före

| | |
|---|---|
| **Område** | Dokumentation |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/dokumentation.spec.js`](../../tests/dokumentation.spec.js#L10) – *ta foto före laddar upp ett krympt foto* |

## Förutsättningar

- Inloggad, uppdrag finns

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Öppna uppdraget, tryck **Ta foto** under Före och fotografera | Fotot visas under Före och laddas upp krympt (≤ 250 kB) |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
