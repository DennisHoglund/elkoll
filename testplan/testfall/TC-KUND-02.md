[← Testplan](../index.md)

# TC-KUND-02 · Autofyll från adress

| | |
|---|---|
| **Område** | Kundregister |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/kunder.spec.js`](../../tests/kunder.spec.js#L21) – *adressfältet föreslår tidigare adresser* |

## Förutsättningar

- Tidigare uppdrag på adressen

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skriv början av gatunamnet under **Adress** | Tidigare adresser med kund visas |
| 2 | Tryck på förslaget | Fälten fylls i |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
