[← Testplan](../index.md)

# TC-OFF-01 · Spara uppdrag utan täckning

| | |
|---|---|
| **Område** | Offline |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/offline.spec.js`](../../tests/offline.spec.js#L5) – *uppdrag sparas i telefonen utan täckning och skickas sedan* |

## Förutsättningar

- Flygplansläge

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Skapa och spara ett uppdrag | *Sparat i telefonen – skickas när du har täckning*, märket *1 väntar* visas |
| 2 | Stäng av flygplansläget | Märket försvinner och uppdraget finns på servern |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
