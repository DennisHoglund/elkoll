[← Testplan](../index.md)

# TC-TEAM-01 · Skapa nytt team

| | |
|---|---|
| **Område** | Teamet |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/team.spec.js`](../../tests/team.spec.js#L5) – *ny användare utan team kan skapa ett team* |

## Förutsättningar

- Inloggad, inte med i något team

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Skapa team** utan att fylla i | *Skriv företagets namn.* |
| 2 | Fyll i företag, ditt namn och mobil, tryck **Skapa team** | Dagens uppdrag visas, avataren visar dina initialer |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
