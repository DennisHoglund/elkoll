[← Testplan](../index.md)

# TC-FAK-05 · Exportera CSV

| | |
|---|---|
| **Område** | Fakturering |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/faktura.spec.js`](../../tests/faktura.spec.js#L74) – *exportera underlag som CSV för en period* |

## Förutsättningar

- Ägare, klara uppdrag i perioden

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Fakturering → **Exportera underlag (CSV)**, välj period och tryck **Exportera** | Fil med en rad per uppdrag: datum, kund, adress, uppdrag, status, timmar totalt och per person, material, anteckning |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
