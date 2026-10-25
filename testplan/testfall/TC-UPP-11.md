[← Testplan](../index.md)

# TC-UPP-11 · Ta bort uppdrag

| | |
|---|---|
| **Område** | Uppdrag |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/uppdrag.spec.js`](../../tests/uppdrag.spec.js#L128) – *ta bort ett uppdrag kräver två tryck* |

## Förutsättningar

- Uppdrag finns

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Ta bort** | Knappen ber om ett tryck till |
| 2 | Tryck igen | Uppdraget försvinner |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
