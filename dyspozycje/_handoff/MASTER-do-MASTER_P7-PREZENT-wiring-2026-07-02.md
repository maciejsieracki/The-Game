# MASTER: batch P7 — akcja 13 Prezent (G3-B)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **WDROŻONE** (Maciej: „wpinaj wszystko") |
| **Data** | 2026-07-02 |
| **Decyzja** | D3-PROG-G3-B (Rel ≥ 30) — zamknięte 2026-06-30 |

---

## Zmiany

| Plik | Co |
|------|-----|
| `gra/data/diplomacy.json` | wiersz **13. Prezent / dar** w `akcje_dyplomatyczne` |
| `gra/src/main.ts` | `buildAudienceActions` — próg Rel ≥ `prog_dar_relacja`, blok w wojnie |

UI/koszyk (`diplomacyTradeBasket`, `diplomacyNegotiationModal`) — **już było** dla id `13`.

---

## Bramka

| Suite | Wynik |
|-------|-------|
| diplomacy-test | **143/143** |
| diplomacy-proposal | **31/31** |
| society-breakdown | **26/26** |
| smoke | **OK** |

**md5 kanon + ROBOCZA:** `983fd12a9ed1d8d810299dfee720b2c8`

---

## Playtest Macieja (opcjonalnie)

Dyplomacja → audiencja → karta **Prezent / dar** (Rel ≥ 30) → koszyk daru.

---

## Nie wdrożone (świadomie)

- **B2-D18 PT-Z05** — kod ✅ · gameplay Macieja nadal zalecany
- **gra-kanon/** snapshot — czeka `publish-kanon-snapshot.ps1` (Master)
- **A5-Roblox** — czeka ABC Macieja
