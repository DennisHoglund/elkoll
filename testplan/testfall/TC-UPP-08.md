[← Testplan](../index.md)

# TC-UPP-08 · Uppdragskort med navigera, ring och sms

| | |
|---|---|
| **Område** | Uppdrag |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/uppdrag.spec.js`](../../tests/uppdrag.spec.js#L92) – *visar uppgifter, portkod och knappar för navigera, ring och sms* |

## Förutsättningar

- Uppdrag med telefon och portkod

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på ett uppdrag | Rubrik, adress, portkod i stor stil, kund och avsändare visas |
| 2 | Tryck **Navigera**, **Ring kund**, **På väg-sms** och **Ring** vid Från | Kartor, telefon respektive Meddelanden öppnas |
| 3 | Bocka av material och öppna appen igen | Bockarna finns kvar |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
