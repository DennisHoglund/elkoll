[← Testplan](../index.md)

# TC-UPP-14 · Tolkningen hänger aldrig

| | |
|---|---|
| **Område** | Uppdrag |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/uppdrag.spec.js`](../../tests/uppdrag.spec.js#L90) – *tolkningen hänger aldrig – tidsgräns ger besked* |

## Förutsättningar

- Google svarar långsamt

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Tolka** | Inom 40 sekunder visas *Tolkningen tog för lång tid…* och knappen går att trycka igen |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
