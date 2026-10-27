[← Testplan](../index.md)

# TC-FAK-06 · Exportera bara ej fakturerade

| | |
|---|---|
| **Område** | Fakturering |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/faktura.spec.js`](../../tests/faktura.spec.js#L91) – *export med bara ej fakturerade* |

## Förutsättningar

- Fakturerade och ej fakturerade uppdrag

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Kryssa i **Bara ej fakturerade** och exportera | Bara uppdrag som inte är fakturerade kommer med |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
