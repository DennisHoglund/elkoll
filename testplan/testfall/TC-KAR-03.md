[← Testplan](../index.md)

# TC-KAR-03 · Tryck på nål

| | |
|---|---|
| **Område** | Karta |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/karta.spec.js`](../../tests/karta.spec.js#L33) – *tryck på nål visar kort med Navigera och Öppna* |

## Förutsättningar

- Uppdrag på kartan

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på en nål | Kort med tid, adress och uppgift visas |
| 2 | Tryck **Navigera** | Kartor öppnas med vägbeskrivning |
| 3 | Tryck **Öppna** | Uppdragskortet visas |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
