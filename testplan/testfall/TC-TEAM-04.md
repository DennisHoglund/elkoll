[← Testplan](../index.md)

# TC-TEAM-04 · Samma e-post kan inte läggas till två gånger

| | |
|---|---|
| **Område** | Teamet |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/team.spec.js`](../../tests/team.spec.js#L45) – *samma e-post kan inte läggas till två gånger* |

## Förutsättningar

- Inloggad i team

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Lägg till en e-post som redan finns | *Den e-posten finns redan i teamet.* |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
