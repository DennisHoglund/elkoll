[← Testplan](../index.md)

# TC-KAR-05 · Adress som inte hittas

| | |
|---|---|
| **Område** | Karta |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/karta.spec.js`](../../tests/karta.spec.js#L58) – *adress som inte hittas visas som saknar plats* |

## Förutsättningar

- Uppdrag med felstavad adress

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Öppna kartan | Texten *1 uppdrag saknar plats på kartan: …* visas. Rätta adressen under Ändra |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
