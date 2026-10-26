[← Testplan](../index.md)

# TC-DOK-04 · Foto utan täckning

| | |
|---|---|
| **Område** | Dokumentation |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/dokumentation.spec.js`](../../tests/dokumentation.spec.js#L53) – *foto utan täckning sparas i telefonen och laddas upp sedan* |

## Förutsättningar

- Flygplansläge

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Ta ett foto på ett uppdrag | Fotot visas med *Väntar* och *Fotot är sparat i telefonen…* |
| 2 | Stäng av flygplansläget | Fotot laddas upp och *Väntar* försvinner |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
