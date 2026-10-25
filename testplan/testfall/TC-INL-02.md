[← Testplan](../index.md)

# TC-INL-02 · Fel lösenord ger tydligt felmeddelande

| | |
|---|---|
| **Område** | Inloggning |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/inloggning.spec.js`](../../tests/inloggning.spec.js#L13) – *fel lösenord ger ett tydligt felmeddelande* |

## Förutsättningar

- Utloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skriv rätt e-post och fel lösenord, tryck **Logga in** | Texten *Fel e-post eller lösenord.* visas i rött |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
