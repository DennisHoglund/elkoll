[← Testplan](../index.md)

# TC-FAK-02 · Markera fakturerad

| | |
|---|---|
| **Område** | Fakturering |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/faktura.spec.js`](../../tests/faktura.spec.js#L41) – *markera fakturerad och ångra* |

## Förutsättningar

- Uppdrag att fakturera

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Markera fakturerad** | Uppdraget flyttas till **Fakturerade** med datum |
| 2 | Tryck **Ångra** under Fakturerade | Uppdraget är tillbaka under Att fakturera |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
