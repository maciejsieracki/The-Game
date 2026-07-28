# HANDEL-SPLIT-Q1 — rozdzielenie handlu: szlaki vs wymiana surowców

**Status:** OTWARTE (czeka na A/B/C Macieja)  
**Temat z czatu:** Maciej 2026-07-28 — „rozdzielenie handlu B"  
**Research:** subagent [Handel rozdzielenie B research](ea3b8579-253a-4793-8f56-4fc3350bb80b)

---

## Sytuacja

Dziś jeden traktat **Umowa Handlowa** łączy trzy rzeczy:

1. prawo do automatycznych szlaków i dochodu Pieniądz z tras,
2. trwałą wymianę surowców z koszyka dyplomatycznego,
3. +1 Zaufanie/turę.

Panel Handel pokazuje umowy i trasy razem. Gracz nie widzi, że umowa „tylko na szlaki" (propozycja AI) to co innego niż umowa z drewnem co turę.

**Stan po pakiecie UX (28.07):** etykiety + sekcja „Aktywne umowy handlowe" + `recomputeTradeRoutesNow()` — w kodzie źródłowym, bez rozdzielenia silnikowego.

---

## Cel pytania

Ustalić, czy rozdzielamy tylko język interfejsu, czy też dwa osobne traktaty w silniku — żeby zerwanie wymiany surowców nie zabijało szlaków i odwrotnie.

---

## Dlaczego teraz

Kolejny krok bez decyzji = albo kosmetyka (A), albo duży refactor bez kontraktu (B).

---

## Opcje

### A — Tylko UI (szlaki vs wymiana surowców)

**Za:** szybko, warstwa izolowana; wystarczy gdy mechanika ma zostać jednym traktatem; mniej ryzyka save/load.  
**Przeciw:** silnik nadal miesza zerwanie wojny / wygaśnięcie; AI nadal proponuje „pustą" umowę bez jasnego kontraktu.

### B — Dwa traktaty w silniku (Szlaki + Wymiana surowców)

Proponowany split:

| Traktat | Włącza | Nie włącza |
|---------|--------|------------|
| **TraktatSzlakow** (`umowa_szlakow`) | `refreshTradeRoutes`, granty z trasy, +1 Zaufanie/turę, wiarygodność `strumien_handel` | `handelPayload`, `handelSurowiecCykliczny` |
| **UmowaWymianySurowcow** (`umowa_wymiany`) | koszyk → payload / cykliczna, tick cykliczny, wiarygodność N6 | bramka szlaków |

Handel jednorazowy (`oneShotTrade`) — poza traktatami.

Migracja save: stare `umowa_handlowa` → jeśli payload/cykliczna → Wymiana; inaczej → Szlaki.

**Za:** zgodne z DYSPOZYCJĄ 85; niezależne życie umów; czytelne progi AI.  
**Przeciw:** duży zakres (~15 plików), migracja zapisów, testy dyplomacji, Panel-D.

### C — Jeden traktat, dwa tryby w `ActiveDeal` (`handelTryb: szlaki | wymiana | oba`)

**Za:** mniej zmian w enum/save niż pełny split.  
**Przeciw:** półśrodek — nadal jeden rodzaj w UI dyplomacji; może mylić bardziej niż pomaga.

---

## Rekomendacja

**B** — jeśli celem jest realne rozdzielenie gameplayu (Maciej wskazał temat B).  
**A** — jeśli priorytetem jest szybka czytelność po dzisiejszym pakiecie UX.

---

## Pliki przy opcji B (skrót)

- `gra/src/types/diplomacy.ts`
- `gra/src/game/diplomacy-treaties.ts`, `diplomacy-proposals.ts`, `trade-routes.ts`
- `gra/src/main.ts` (hasTradeTreaty, tick, save/load, `buildEmpireTradeSnap`)
- `gra/src/ui/diplomacyAudience.ts`, `diplomacyTradeBasket.ts`, `empireDetailPanel.ts`
- `gra/data/diplomacy.json`
- testy: `trade-routes-income-test.cjs`, `diplomacy-ai-balance-test.cjs`

---

## Po decyzji Macieja

ECHO → rejestr → wdrożenie (🔴 jeśli B z migracją save).
