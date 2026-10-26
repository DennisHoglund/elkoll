[← Testplan](../index.md)

# TC-UPP-04 · Tolka fyller i fälten

| | |
|---|---|
| **Område** | Uppdrag |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/uppdrag.spec.js`](../../tests/uppdrag.spec.js#L43) – *tolka fyller i fälten och markerar det som saknas* |

## Förutsättningar

- Inloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Nytt uppdrag**, skriv en beskrivning, tryck **Tolka** | Datum, tid, adress, kund, telefon, uppgift och material fylls i. Saknade fält markeras orange |
| 2 | Fyll i det saknade fältet | Markeringen försvinner |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
