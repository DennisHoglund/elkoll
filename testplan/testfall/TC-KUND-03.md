[← Testplan](../index.md)

# TC-KUND-03 · Inga felaktiga förslag

| | |
|---|---|
| **Område** | Kundregister |
| **Prioritet** | Låg |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/kunder.spec.js`](../../tests/kunder.spec.js#L33) – *inga förslag för okänd kund eller för kort text* |

## Förutsättningar

- Inloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skriv en bokstav eller ett okänt namn | Inga förslag visas |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
