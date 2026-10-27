[← Testplan](../index.md)

# TC-INL-07 · Ny kollega skapar konto

| | |
|---|---|
| **Område** | Inloggning |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/inloggning.spec.js`](../../tests/inloggning.spec.js#L54) – *ny kollega kan skapa konto och hamnar på välkomstsidan* |

## Förutsättningar

- Utloggad, e-post som inte har konto

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Ny här? Skapa konto**, skriv e-post och för kort lösenord | *Välj ett lösenord med minst 8 tecken.* |
| 2 | Skriv ett längre lösenord och tryck **Skapa konto** | Välkomstsidan visas (eller besked om att bekräfta e-posten) |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
