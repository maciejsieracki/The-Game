# HANDEL-SPLIT-Q1 — rozdzielenie handlu: szlaki vs wymiana surowców

**Status:** ZAMKNIĘTE · **B**  
**Data:** 2026-07-29  
**Cytat Macieja:** „b” (dwie umowy w silniku — traktat szlaków + umowa wymiany)

---

## Decyzja B (skrót)

| Traktat | `rodzaj` | Włącza | Nie włącza |
|---------|----------|--------|------------|
| **Traktat szlaków** | `umowa_szlakow` | szlaki handlowe, granty z tras, +1 Zaufanie/turę, wiarygodność `strumien_handel` | koszyk PN, `handelPayload`, cykliczna wymiana |
| **Umowa wymiany** | `umowa_wymiany` | koszyk → payload / cykliczna, tick cykliczny, wiarygodność N6 | bramka szlaków |

Handel jednorazowy (`oneShotTrade`) — poza traktatami.

**UI:** dwa osobne kafle na stole (akcja 5 = traktat szlaków bez koszyka; akcja 14 = umowa wymiany z koszykiem). Klik traktatu szlaków **nie** otwiera koszyka wymiany.

**Migracja save:** stare `umowa_handlowa` → jeśli payload/cykliczna → `umowa_wymiany`; inaczej → `umowa_szlakow`.

---

## Wdrożenie

- `gra/src/types/diplomacy.ts` — enum
- `gra/src/game/diplomacy-treaties.ts` — migracja `hydrateActiveDeals`, `hasSzlakowTreaty` / `hasWymianaTreaty`
- `gra/src/game/diplomacy-proposals.ts` — `umowa_szlakow` / `umowa_wymiany`
- `gra/src/ui/diplomacyAudience.ts` — dwa kafle, propozycja szlaków bez koszyka
- `gra/data/diplomacy.json` — akcje 5 + 14
- `gra/src/main.ts` — `hasTradeTreaty` → szlaki, tick, save
