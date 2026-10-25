[← Testplan](../index.md)

# TC-INL-03 · Ogiltig e-post stoppas innan något skickas

| | |
|---|---|
| **Område** | Inloggning |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/inloggning.spec.js`](../../tests/inloggning.spec.js#L22) – *ogiltig e-post stoppas innan något skickas* |

## Förutsättningar

- Utloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skriv *inte-en-adress* och ett lösenord, tryck **Logga in** | *Ange en giltig e-postadress.* visas, inget skickas |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
