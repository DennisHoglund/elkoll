[← Testplan](../index.md)

# TC-TID-02 · Bara en pågående tid per person

| | |
|---|---|
| **Område** | Tidrapport |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/tid.spec.js`](../../tests/tid.spec.js#L29) – *starta tid på nytt uppdrag stoppar den förra* |

## Förutsättningar

- Tid pågår på ett uppdrag

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Starta tid på ett annat uppdrag | *Stoppade tiden på …* och den nya tiden startar |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
