[← Testplan](../index.md)

# TC-TID-01 · Starta och stoppa tid

| | |
|---|---|
| **Område** | Tidrapport |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/tid.spec.js`](../../tests/tid.spec.js#L10) – *starta och stoppa tid på ett uppdrag* |

## Förutsättningar

- Uppdrag finns

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Öppna uppdraget och tryck **Starta tid** | Knappen blir **Stoppa** med en klocka som räknar. Listan visar *Tid pågår* på uppdraget |
| 2 | Tryck **Stoppa** | *Tiden är sparad: …* och passet syns i listan med totalt |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
