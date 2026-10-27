[← Testplan](../index.md)

# TC-TEAM-07 · Skicka inbjudan via sms

| | |
|---|---|
| **Område** | Teamet |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/team.spec.js`](../../tests/team.spec.js#L69) – *skicka inbjudan öppnar sms med länk och rätt e-post* |

## Förutsättningar

- Kollega tillagd med mobilnummer

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Skicka inbjudan** vid kollegan | Meddelanden öppnas till kollegans nummer med färdig text: länk till appen, hur man skapar konto och vilken e-post som ska användas |
| 2 | Skicka | Kollegan kan följa instruktionen och komma in i teamet |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
