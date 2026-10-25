[← Testplan](../index.md)

# TC-TEM-01 · Byta tema

| | |
|---|---|
| **Område** | Tema |
| **Prioritet** | Låg |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/tema.spec.js`](../../tests/tema.spec.js#L4) – *temaknappen växlar Auto → Ljust → Mörkt och kommer ihåg valet* |

## Förutsättningar

- Inloggad

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Teamet → tryck på temaknappen flera gånger | Växlar Auto → Ljust → Mörkt, valet finns kvar efter omstart |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
