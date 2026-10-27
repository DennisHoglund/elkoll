[← Testplan](../index.md)

# TC-INL-08 · Logga ut när servern svarar med fel

| | |
|---|---|
| **Område** | Inloggning |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/inloggning.spec.js`](../../tests/inloggning.spec.js#L54) – *logga ut fungerar även när servern svarar med fel* |

## Förutsättningar

- Inloggad
- Supabase svarar med fel på utloggningen (eller dålig täckning)

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Gå till **Mer** → **Logga ut** | Inloggningen visas |
| 2 | Ladda om appen | Inloggningen visas fortfarande |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
