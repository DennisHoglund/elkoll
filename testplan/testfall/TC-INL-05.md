[← Testplan](../index.md)

# TC-INL-05 · Inloggningen finns kvar efter omstart

| | |
|---|---|
| **Område** | Inloggning |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/inloggning.spec.js`](../../tests/inloggning.spec.js#L42) – *inloggningen finns kvar efter omladdning* |

## Förutsättningar

- Inloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Stäng appen helt och öppna igen | Du är fortfarande inloggad |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
