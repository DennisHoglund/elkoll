[← Testplan](../index.md)

# TC-TID-04 · Tid i efterhand

| | |
|---|---|
| **Område** | Tidrapport |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/tid.spec.js`](../../tests/tid.spec.js#L50) – *lägga till och ta bort tid i efterhand* |

## Förutsättningar

- Uppdrag finns

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Öppna *Lägg till tid i efterhand*, fyll i från och till och tryck **Lägg till** | Passet läggs till. Till före från ger felmeddelande |
| 2 | Ta bort passet med två tryck | Passet försvinner |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
