[← Testplan](../index.md)

# TC-TEAM-02 · Medlemmar visas med telefon och ringknapp

| | |
|---|---|
| **Område** | Teamet |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/team.spec.js`](../../tests/team.spec.js#L24) – *visar medlemmar med telefon och ringknapp* |

## Förutsättningar

- Inloggad i team

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på avataren | Alla medlemmar visas med namn, telefon och e-post. Du är markerad (du) |
| 2 | Tryck på ringknappen vid en kollega | Telefonen ringer upp kollegan |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
