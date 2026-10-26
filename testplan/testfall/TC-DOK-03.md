[← Testplan](../index.md)

# TC-DOK-03 · Ta bort foto

| | |
|---|---|
| **Område** | Dokumentation |
| **Prioritet** | Medel |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/dokumentation.spec.js`](../../tests/dokumentation.spec.js#L37) – *ta bort foto kräver två tryck* |

## Förutsättningar

- Foto finns

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck på fotot | Fotot visas stort |
| 2 | Tryck **Ta bort foto** två gånger | Fotot försvinner från uppdraget och servern |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
