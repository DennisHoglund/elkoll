[← Testplan](../index.md)

# TC-MIN-01 · Tidigare besök på adressen

| | |
|---|---|
| **Område** | Platsminne |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/platsminne.spec.js`](../../tests/platsminne.spec.js#L9) – *visar tidigare besök på samma adress med anteckningar* |

## Förutsättningar

- Teamet har varit på adressen förut

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Öppna ett uppdrag | *Varit här förut: N besök* visas under kunduppgifterna |
| 2 | Tryck på raden | Tidigare besök visas med datum, uppgift, vem, status och anteckningar. Samma gata i en annan ort räknas inte |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
