[← Testplan](../index.md)

# TC-KUND-01 · Autofyll från kundnamn

| | |
|---|---|
| **Område** | Kundregister |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/kunder.spec.js`](../../tests/kunder.spec.js#L4) – *kundens namn föreslår och fyller i adress, telefon och portkod* |

## Förutsättningar

- Teamet har haft uppdrag hos kunden

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skriv de första bokstäverna i kundens namn under **Kund** | Förslag med namn, adress och telefon visas |
| 2 | Tryck på förslaget | Adress, kund, telefon och portkod fylls i |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
