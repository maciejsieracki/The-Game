# R-PUŁKA-PYTANIA-29-07 — audyt forgotten open

**Data audytu:** 2026-08-05  
**Branch:** `cursor/pulka-forgotten-audit-63a1`  
**Źródło:** `dyspozycje/PYTANIA-OTWARTE.md` § R-PUŁKA-PYTANIA-29-07 · transkrypt `MASTER-Work_KORESPONDENCJA.md` L93062–93505

## Werdykt

**STATUS: ZAMKNIĘTE audytem** — 0 pytań realnie otwartych (wszystkie 18 + 5 powiązanych domknięte wyjaśnieniem z kodu lub wdrożeniem).

## Tabela — 18 pytań paczki

| # | ID / temat | Werdykt | Dowód |
|---|------------|---------|-------|
| 1 | Farma bez 👤 — czy daje Ż/Pr/Pod? | **ZAMKNIĘTE** | Żywność/Praca z `workedTiles` + `tileYield` (`economy.ts`, `turn-economy.ts`); farma bez 👤 nie daje plonów pracy/żywności. Surowce z ulepszeń (Tartak…) idą przez `territoryResourceYieldForImprovement` bez 👤 — osobna ścieżka (`terrain-improvements.ts`). |
| 2 | Palisada — tech i czy działa? | **ZAMKNIĘTE** | `buildings.json` `palisada`, tech Obróbka drewna, epoka Kamienia; +100% obrony. `BUG-PALISADA-BRAK` naprawione 2026-07-29. |
| 3 | Lista ulepszeń: surowce bez vs z 👤 | **ZAMKNIĘTE** | Dwie listy w panelu budowy okolicy (`cityPanel.ts` — katalog z/bez wymogu 👤). |
| 4 | Irygacja vs Farma — nachodzą graficznie? | **ZAMKNIĘTE** | Stack logiczny OK; render jeden mesh `pole_irygowane` (generator/render mapy). |
| 5 | Farma + Trzoda — czy można Irygację? | **ZAMKNIĘTE** | Wykluczenie mutualne: farma+irygacja **albo** farma+trzoda (`terrain-improvements.json` / gate budowy). |
| 6 | ETA budynku (~N tur przy obecnej Pracy) | **ZAMKNIĘTE** | `cityPanel.ts` → `etaTurns()` w kolejce budowy i UI produkcji. |
| 7 | Skondensować UI rekrutacji (jak budynki, max 5) | **ZAMKNIĘTE** | `RECRUIT_QUEUE_VISIBLE = 5`, kompaktowy katalog `LIST_SCROLL_VISIBLE_CATALOG = 8` (`cityPanel.ts` L1422–1429). Decyzja UX wdrożona bez osobnego ABC. |
| 8 | Ulepszenie kosztuje 1 Pracy? | **ZAMKNIĘTE** | Budowa ulepszenia 15–30 pkt Pracy; **utrzymanie** = surowce/turę (`surowiec_ilosc_tura`, koszty tartak/kopalnie…), nie 1 Pracy/turę na ulepszenie. |
| 9 | AI oferuje drewno, którego nie ma | **ZAMKNIĘTE** | Cap ofert: `maxResourcePakiety('once'|'per_turn', …)` w `diplomacy-ai-balance.ts`; `D-DYPLO-AI-OFERTA-ZERO` (FALA deploy). |
| 10 | Handel wychodzi poza ramkę panelu | **ZAMKNIĘTE** | `diplomacyTradeBasket.ts` / `diplomacyNegotiationModal.ts` — `overflow-y:auto`, `cdb-body-scroll`, landscape layout. |
| 11 | „Handel jednorazowy" + „Runda 1 z 3 · 5 tur" | **ZAMKNIĘTE** (wyjaśnienie) | Dwie osie: tryb dostawy (`once`/`per_turn` w koszyku) vs runda negocjacji (`negotiationTable.round`, `main.ts` L10665). Nie wymaga ABC gameplay; ewentualne uproszczenie copy = opcjonalny UX. |
| 12 | Owce w lesie / zastąpienie Tartaku — dialog? | **ZAMKNIĘTE** | `R-ZAMIEN-ULEPSZENIE-CONFIRM-Q1=A` (2026-08-03) · `showImprovementBuildConfirmModal`. |
| 13 | Brak „Połącz" przy wielu jednostkach | **ZAMKNIĘTE** | `BUG-ARMIA-BRAK-POLACZ` — fix FALA 207 `47a2e73b`; przycisk Połącz w `armyStackHud.ts`, merge w `main.ts` / `armyMerge.ts`. |
| 14 | Surowce znów widoczne po budowie | **ZAMKNIĘTE** | Fix overlay zasobów po budowie (wdrożony wcześniej; brak regresji w źródle). |
| 15 | Farma chowa ikonę gliny — czy blokuje Gliniankę? | **ZAMKNIĘTE** | Tylko warstwa UI ikon; złoże `zloze` zostaje na heksie — bramka Glinianki niezależna od ikony farmy. |
| 16 | Tartak → 10 Drewna/t, Glinianka → 15 Glina/t | **ZAMKNIĘTE** | `terrain-improvements.json` + komentarz w `terrain-improvements.ts` L135–136; decyzja Macieja 01:39 wdrożona. |
| 17 | Państwa-miasta nie budują mimo zasobów | **ZAMKNIĘTE** | `R-AI-MIASTA-BUDOWY-FIX-Q1=A` — FALA 244 `0757265a`; filtr `isProductionAllowed` w `ai.ts` `chooseCityProduction`. |
| 18 | Sojusznik zerwie handel gdy broni sojusznika — kto karę? | **ZAMKNIĘTE** (wyjaśnienie) | Kary Relacji/Zaufania/Wiarygodności przy zerwaniu sojuszu / wojnie z sojusznikiem (`diplomacy-credibility.ts`, UI copy w `diplomacyTradeBasket.ts` L491–496). Kara dotyczy strony łamiącej zobowiązanie — wyjaśnione w czacie 29.07 ~01:02. |

## Tabela — powiązane (ta sama noc, osobne wpisy)

| ID | Werdykt | Dowód |
|----|---------|-------|
| `D-DYPLO-KATALOG-AKCJI` | **ZAMKNIĘTE** | FALA 243 `01f6024a` · Q1=A |
| `D-DYPLO-CELOWNIK-STOLICA` | **ZAMKNIĘTE** | FALA 241 `178073f9` · Q1=A |
| `D-DYPLO-AKCJE-SZARE` | **ZAMKNIĘTE** | FALA 243 `01f6024a` · Q1=B+C |
| `BUG-DYPLO-PANEL-OVERLAP` | **ZAMKNIĘTE** | FALA 245 `8b6e0cfe` · `BUG-DYPLO-PANEL-OVERLAP-Q1=A` · `unitCtxDockDiploGate.ts` |
| `R-HEX-PLONY-MAGAZYN` | **ZAMKNIĘTE** | Decyzja **B** 2026-07-29 · `docs/decyzje/R-HEX-PLONY-MAGAZYN.md` |

## Kolejka ABC (realnie otwarte)

**Brak** — żadne pytanie z paczki R-PUŁKA nie wymaga nowego ABC do Macieja.

## Akcje po audycie

1. `PYTANIA-OTWARTE.md` — sekcja R-PUŁKA → **ZAMKNIĘTE audytem**; zsynchronizować `BUG-ARMIA-BRAK-POLACZ` i `BUG-DYPLO-PANEL-OVERLAP` (stale OTWARTE/W TOKU).
2. Indeks „Dyplo-UX (nadal otwarte)" — usunąć wpisy już zamknięte.
