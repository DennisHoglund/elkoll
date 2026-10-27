[← Testplan](../index.md)

# TC-TEAM-05 · Ta bort kollega

| | |
|---|---|
| **Område** | Teamet |
| **Prioritet** | Hög |
| **Typ** | 🤖 Automatiserad |
| **Krav** | [SPEC.md](../../SPEC.md) |
| **Playwright** | [`tests/team.spec.js`](../../tests/team.spec.js#L55) – *ta bort kräver två tryck och gör kollegans uppdrag otilldelade* |

## Förutsättningar

- Inloggad, kollega med uppdrag

## Steg

| # | Gör så här | Förväntat resultat |
|---|---|---|
| 1 | Tryck soptunnan vid kollegan | Knappen blir *Ta bort?*, inget tas bort än |
| 2 | Tryck igen | Kollegan försvinner. Hens uppdrag visas som *Otilldelad* under **Alla** |

## Resultat

- [ ] Godkänt
- [ ] Underkänt – notera vad som hände:
