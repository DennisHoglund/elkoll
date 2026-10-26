[← Testplan](../index.md)

# TC-KAR-02 · Mina/Alla och byta dag på kartan

| | |
|---|---|
| **Område** | Karta |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/karta.spec.js`](../../tests/karta.spec.js#L20) – *Alla och byte av dag ändrar nålarna* |

## Förutsättningar

- Uppdrag idag och imorgon

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck **Alla** | Hela teamets uppdrag visas |
| 2 | Tryck pilen för nästa dag | Morgondagens uppdrag visas |
| 3 | Tryck **Lista** | Listan visar samma dag och filter |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
