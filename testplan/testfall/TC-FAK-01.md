[← Testplan](../index.md)

# TC-FAK-01 · Fakturaunderlag per kund

| | |
|---|---|
| **Område** | Fakturering |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/faktura.spec.js`](../../tests/faktura.spec.js#L25) – *klara uppdrag per kund med tid per person och material* |

## Förutsättningar

- Klara uppdrag med rapporterad tid

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Teamet → **Fakturering** | *Att fakturera (N)* med klara uppdrag grupperade per kund: tid totalt och per person, material och anteckningar. Ej klara uppdrag syns inte |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
