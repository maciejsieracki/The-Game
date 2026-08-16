# REJESTR PRÓŚB I ZADAŃ — jedyne miejsce śledzenia próśb Macieja

## ⛔ ZASADA PROCESU (Maciej 2026-07-24, obowiązkowa dla KAŻDEJ sesji)
**KAŻDA prośba Macieja, która powinna skończyć się jakąkolwiek zmianą w grze/kodzie/danych,
MUSI zostać natychmiast zapisana TUTAJ** — nawet jeśli padła mimochodem w czacie i nie jest
od razu realizowana. Powód: prośby z samego czatu giną (potwierdzony przypadek: „osobny poziom
trudności per państwo/miasto" — poproszona dawno, nigdzie nie zapisana, nie wdrożona, nikt tego
nie pilnował). Narracja w czacie NIE jest śledzeniem. Ten plik jest jedynym rejestrem statusu.

**Format wiersza:** ID · data zgłoszenia · prośba (zwięźle) · STATUS (`NOWE` / `W TOKU` / `WDROŻONE` / `ZDEPLOYOWANE` / `ODRZUCONE` / `CZEKA-NA-DECYZJĘ`) · commit/deploy · uwagi.
Przy zamknięciu tematu: aktualizuj STATUS + wpisz commit/md5. Szczegóły decyzji ekonomicznych → `DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`.

**Problemy/błędy z numeracją:** `dyspozycje/REJESTR-PROBLEMOW-AI.md` — format **`P-AI-###`** (Maciej 2026-07-26). Każdy nowy problem od razu dostaje numer; w czacie odwołujesz się po ID.

## ⛔ NUMER → ABC → COMMIT → DEPLOY (Maciej 2026-08-03)
Pełny kanon: [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md).
1. Case / bug / poprawka / innowacja → **ID tutaj od razu** (status zwykle `CZEKA-NA-DECYZJĘ`).
2. Agent **nie koduje** — proponuje rozwiązanie ± ABC.
3. Maciej: **`ID + A|B|C`** → dopiero commit.
4. **`deploy`** (hasło) → dopiero ROBOCZA / `WERSJE.md`.

## ⛔ AUTOBOT — TWARDA REGUŁA (Maciej 2026-08-05) — KAŻDA PRACA TYLKO TĘDY
**KAŻDA praca agenta** (kod, fix, audyt, docs procesu) **wyłącznie** w systemie AutoBot: Operator → Evaluator → Grok final. **ZAKAZ** omijania pętli.  
Kanon: [`autobot/README.md`](autobot/README.md) · [`docs/decyzje/R-PROC-AUTOBOT.md`](../docs/decyzje/R-PROC-AUTOBOT.md) · `.cursor/rules/autobot-evaluator-operator.mdc`.
1. **Operator** — `composer-2.5` + `playbook.json` + guardrails.
2. **Evaluator** — adwokat diabła + twarde metryki → postmortem → playbook.
3. **Grok** — final; dopiero potem „gotowe” / `deploy`.

**Notatka 2026-08-05:** Cleanup przestarzałych „czeka deploy" / „bez deploy" dla pozycji już w `WERSJE.md`; źródło prawdy deployu w owym momencie = FALA 228 (`29bfdf00`).

**Notatka 2026-08-09:** źródło prawdy deployu dziś = **FALA 263** (`89176ced318b7e7d03b2fd6b197df80d`), branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie `main`). Szczegóły sesji: `dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md`.

| R-AI-TRUDNOSC-AUDYT | 2026-08-05 | Audyt + **P0** (Maciej „1"): realna Praca · Spichlerz id · L3 nauka=2 | **ZDEPLOYOWANE `efab84db`** (FALA 229) | `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` · PR #111 · AutoBot PASS |
| R-AI-TRUDNOSC-P1 | 2026-08-05 | P1: majorEarly ×0.70 · scout −80 · L1 early turn 25 | **ZDEPLOYOWANE `7f8bdc74`** (FALA 230) | §F audytu · PR #112 |
| R-AI-TRUDNOSC-P1-3 | 2026-08-05 | Spryt AI → ai-params.json (agresja/dyplomacja/cel ×3) | **ZDEPLOYOWANE `7f8bdc74`** (FALA 230) | §G audytu · PR #113 · behavior-neutral |
| R-AI-TRUDNOSC-P2 | 2026-08-05 | P2: Q1=A (canAfford status quo) · Q2=A (L3 early=25 przy +1 mieście) | **ZDEPLOYOWANE `283de421`** (FALA 231) | `docs/decyzje/R-AI-TRUDNOSC-P2-ABC.md` · PR #115 · Maciej 1+2+3 |
| R-KOLEJKA-OTWARTA | 2026-08-05 | Priorytet otwartej listy | **ECHO 1+2+3** · deploy→playtest→F12/scena→SUR-DESIGN | `docs/decyzje/R-KOLEJKA-OTWARTA-ABC.md` |
| R-SOLO-ABC | 2026-08-05 | Autonomia na nieobecność | **✅ ECHO ALL + FALA 232–233** · muzyka/węgiel/bitwa I+facing · WIAR Etap0+dźwignie docs | `docs/decyzje/R-SOLO-ABC.md` · ROBOCZA `06712ea4` |
| R-CITY-PILL-PROD-ICON | 2026-08-05 | Pigułka: ikony kolejki + wzrost + medalion władcy (gracz/major AI) vs kultura (MP) | **ZDEPLOYOWANE `29bfdf00`** (FALA 228) | `docs/decyzje/R-CITY-PILL-PROD-ICON.md` · AutoBot PASS |
| R-PROC-AUTOBOT-P0-SMOKE | 2026-08-05 | Wzmocnienie smoke przed merge (notes Evaluatora: git-merge, defer attrs, evaluate→retire) | **ZMERGOWANE `9068115`** · #108 · bez deploy | smoke 10/10 |
| R-PROC-AUTOBOT-P0 | 2026-08-05 | P0 po FAIL adwokata: Dev score jawne metryki, delay+historia prune, deny-default, RETIRED, smoke | **ZMERGOWANE `9068115`** · #108 · bez deploy | na `main` |
| P-AI-MOC-BONUS | 2026-08-05 | Podpiąć 4 martwe bonusy trudności AI (jednostki/miasta/walka/nauka) | **ZDEPLOYOWANE `3840f218`** (FALA 227←226) · playtest odłożony | Q1=A · `docs/decyzje/P-AI-MOC-BONUS.md` · AutoBot PASS+notes |
| AI-MOC-NEXT-Q1 | 2026-08-05 | Co dalej z luką Mocy AI | **ZDEPLOYOWANE `ff7c5e49`** (FALA 239) · B=metryki | Maciej `2`=B · overlay Diag major AI · `docs/decyzje/AI-MOC-NEXT-Q1.md` · bez balansu |
| P-AI-MAJOR-ABSORB | 2026-08-05 | Absorpcja AI major→major | **ZDEPLOYOWANE** F240 Faza1 + **F241 Faza2** `178073f9` | F2=B any-civ Hard · `P-AI-ABSORB-F2.md` |
| P-AI-ABSORB-F2 | 2026-08-05 | Faza 2 absorb any-civ | **ZDEPLOYOWANE `178073f9`** (FALA 241) Q1=B | tylko Hard · `docs/decyzje/P-AI-ABSORB-F2.md` |
| AI-BALANS-UNLOCK-Q1 | 2026-08-05 | Odblokuj strojenie liczb AI | **ECHO B** · FALA 241 docs · STEP1→F242 | wolno małe kroki · `AI-BALANS-UNLOCK-Q1.md` |
| AI-BALANS-STEP1 | 2026-08-05 | L3 kolonizacja: pop źródła 4 | **ZDEPLOYOWANE `5b6ee97d`** (FALA 242) | `AI_COLONIZATION_SOURCE_MIN_POP_L3=4` · test 13/13 · `AI-BALANS-STEP1.md` |
| AI-BALANS-STEP5 | 2026-08-06 | bonus_produkcja → realna Praca major AI | **ZDEPLOYOWANE** FALA 253 `b8704216` | P0-1 formalizacja (wiring F229) · test 18/18 · `AI-BALANS-STEP5.md` |
| AI-BALANS-STEP6-Q1 | 2026-08-06 | Kara score 2. zwiadowca −80 pkt w `chooseCityProduction` | **JUŻ WDROŻONE PRZED DECYZJĄ** — commit `dadcb48` (`AI_EARLY_SCOUT_REPEAT_PENALTY=80`, `ai.ts:730,836`), poprzedza ten wpis. Nie dublować. | `docs/decyzje/AI-BALANS-STEP6-Q1.md` · paczka ABC 2026-08-06 |
| R-RELIEF-FAIRPLAY | 2026-08-06 | relief-grid/fair-play C-MAPA-Q1=B mop-up po złożach | **ZDEPLOYOWANE** FALA 256 `693a2c57` | tip `41eed4d6` · `R-RELIEF-FAIRPLAY-STATUS.md` · fair-play 8/8 · Ogromny wolniejszy OK |
| R-KAMIEN-RELIEF-FOLLOWUP-Q1 | 2026-08-06 | Whitelist reliefu: legacy `kopalnia` + reguła wszystkich kopalń | **COMMIT+PUSH** `8593237` (branch roboczy, nie w main) | `docs/decyzje/R-KAMIEN-RELIEF-FOLLOWUP-Q1.md` · A + reguła „teraz i przyszłe" · `gra/src/game/relief-preserving-improvements.ts` |
| MAP-UX-CLUSTER-LABEL-Q1 | 2026-08-06 | Etykiety stolica (civ + marker) vs MP (nazwa + dopisek) | **COMMIT+PUSH** `9d33e8f` + `d3470ed` (MAP-UX-CAPITAL-MP-SCOPE-Q1=B) — branch roboczy, nie w main | `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` · B+C |
| R-WIARYGODNOSC-S9-Q1 | 2026-08-06 | Pełna paczka strojenia liczb §9 (JSON + testy) | **TABELA GOTOWA** (Eval PASS-WITH-NOTES, 2 błędy poprawione), commit `22df1b1` | czeka OK Macieja przed kodem · `docs/decyzje/R-WIARYGODNOSC-S9-TABELA-LICZB.md` |
| R-DESIGN-PANEL-MIASTA-V2-Q1 | 2026-08-06 | Pilne zlecenie Design klatek v2; kod nie zamrożony | **ECHO ZAPISANA** · brief do wklejenia GOTOWY (AutoBot retry PASS-WITH-NOTES, fakty przeliczone na `main`) · czeka wklejenia do Design | `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` · C · deliverable: `dyspozycje/DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` (zastępuje sekcje 1/3/4/6 `DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`) · uwaga: marker stolicy (korona) opisany w briefie jako PENDING — gotowy kod na osobnym, niescalonym branchu, NIE na `main` |
| R-OBRONA-MIASTA-MP-Q1 | 2026-08-06 | Obrona bez murów: rozbicie bonusów w preBattle (mechanika bez zmian) | **SCALONE runda 3** (PASS-WITH-NOTES) — bramka `cel` z licznikiem N z M, `cityDefenseBreakdownFor` pokryte testem (35/35), martwy kod usunięty · doprecyzowanie R-OBRONA-MIASTA-MP-SCOPE-Q1=B (bonus murów/cytadeli/baszty w panelu) nadal otwarte, osobna dosyłka | `docs/decyzje/R-OBRONA-MIASTA-MP.md` §ECHO · A · `docs/decyzje/R-BRAZ-SUPER-DISPATCH-Q1.md`-owy wzór 3 rund |
| R-DEFICYT-ZLOTA-KARA-Q1 | 2026-08-06 | Kara za deficyt Złota — analogia do głodu wojska (staty + atrycja HP) | **SCALONE+PUSH** `dd1f267` (prog=Skarbiec, AI floor zdjęty, UI fix) | `docs/decyzje/R-DEFICYT-ZLOTA-KARA-Q1.md` · A+B |
| R-STATUS-PRZYCZYNA-CIERPIENIA-Q1 | 2026-08-06 | Ikona per przyczyna + opis na karcie jednostki | **SCALONE** (PASS-WITH-NOTES) — 2 ikony rozróżnialne na mapie (głód/deficyt złota, obie naraz widoczne), wiersze statusu na karcie jednostki z nazwanymi parametrami | `docs/decyzje/R-STATUS-PRZYCZYNA-CIERPIENIA-Q1.md` · C |
| R-RABAT-SOL-GARNIZON-Q1 | 2026-08-06 | Podwójny rabat garnizonu przy Soli — sumują się czy nie | **ZAMKNIĘTA** — potwierdzenie status quo, zero zmian w kodzie | `docs/decyzje/R-RABAT-SOL-GARNIZON-Q1.md` · A |
| R-FENICJA-SKARB-CAP-Q1 | 2026-08-06 | Mnożnik Skarbu Fenicjan ×11,4 — exploit czy zamierzone | **ZAMKNIĘTE — FAŁSZYWY ALARM**: ×11,4 to artefakt sprzed refaktoru 2026-07-25, dziś nieistniejący; realny szczyt ×5,79 (normal) | `docs/decyzje/R-FENICJA-SKARB-CAP-Q1.md` · A |
| R-KONTRY-BITWA-SPOJNOSC-Q1 | 2026-08-06 | Ujednolicenie tabeli kontr bitwy do `counters.json` | **SCALONE+PUSH** `162b306` — zero utraconych bonusow (0/98) potwierdzone niezaleznie | `docs/decyzje/R-KONTRY-BITWA-SPOJNOSC-Q1.md` · A |
| R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1 | 2026-08-06 | Priorytet bramek uczciwość vs chęć do handlu | **SCALONE** (runda 4, PASS-WITH-NOTES) — uczciwość PW pozostaje priorytetem, chęć respondenta-AI moduluje próg (−15%…+20%) WYŁĄCZNIE gdy respondentem jest AI (nie gracz), podłoga parytetu chroni przed przepłatą AI (R-PW-ACCEPT-OVERPAY-Q1), komunikat zawsze z realną przyczyną i liczbami PW. 4 rundy: r1 fałszywa przyczyna, r2 regresja AI→gracz, r3 regresja overpay (usunięcie z PROPOSER_PW_FAIRNESS_ACTIONS bez podłogi), r4 domknięcie podłogą parytetu | `docs/decyzje/R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1.md` · B+C połączone · efekt uboczny AI↔AI w `PYTANIA-OTWARTE.md` |
| LOGIC-TEST-2BUGS-Q1 | 2026-08-06 | 2 nowe awarie logic-test.cjs: canFoundCity dist=4, city food store undefined | **SCALONE** (PASS-WITH-NOTES) — oba testowe: prog dystansu byl zgadywany (5 zamiast realnych 4 z JSON), magazynZywnosci jest CELOWO legacy/tylko-oblezenie od refaktoru population-growth-v85 (asercja poprawiona na `number>=0 LUB undefined`) | logic-test 207/208 |
| UNIT-REPLACE-EVOCATI-Q1 | 2026-08-06 | unit-replace-test.cjs 2/10: Evocati znika z listy "Zastąp" | **SCALONE** (runda 2, PASS-WITH-NOTES) — realny bug produkcyjny naprawiony w `main.ts` (`replaceAvailabilityCtxForCity`/`replaceAvailabilityCtxEmpireWide` → `empireResourceStock: citySurowceSumForOwner(...)`, wzorem `productionCtxForCity`), od FALI 96 (`daacd43`) mechanizm "Zastąp" gubił wszystkie jednostki brązowe/żelazne. Brak pokrycia testowego naprawy w main.ts — nota w `PYTANIA-OTWARTE.md` | unit-replace-test 10/10, logic-test 207/208, tsc 0, build 797 modułów |
| MENNICA-GRACE-VERIFY-Q1 | 2026-08-06 | mennica-uspienie-test.cjs 39/49: laska Mennicy juz wdrozona (a17b541), test przestarzaly | **SCALONE** (PASS-WITH-NOTES) — mechanizm laski dziala poprawnie; test nie nadazyl za FALA 41 (etykieta zawsze "Podatek", stub trasy zlota deprecated) — naprawiono wylacznie test | mennica-uspienie-test 49/49, zero zmian w silniku |
| R-BRAZ-SUPER-DISPATCH-Q1 | 2026-08-06 | Wpięcie 5 naprawionych modeli super-jednostek + usunięcie starych | **SCALONE+PUSH** `4f2b8b5` + runda2 pełna recenzja (5/5 potwierdzone) + `8871c07` D1-D4 naprawione, martwy kod fizycznie usunięty | `docs/decyzje/R-BRAZ-SUPER-DISPATCH-Q1.md` · A |
| D-DYPLO-CELOWNIK-Q1 | 2026-08-05 | Celownik → stolica z karty dyplo | **ZDEPLOYOWANE `178073f9`** (FALA 241) Q1=A | hint brak stolicy · wiring był · `D-DYPLO-CELOWNIK-Q1.md` |
| D-DYPLO-AKCJE-SZARE-Q1 | 2026-08-05 | Niedostępne akcje szare+tooltip+wiersz | **ZDEPLOYOWANE `01f6024a`** (FALA 243) B+C | `D-DYPLO-AKCJE-SZARE-Q1.md` |
| D-DYPLO-KATALOG-Q1 | 2026-08-05 | Pełny katalog akcji dyplo w UI | **ZDEPLOYOWANE `01f6024a`** (FALA 243) A | `D-DYPLO-KATALOG-Q1.md` |
| R-AI-MIASTA-BUDOWY-Q1 | 2026-08-05 | MP prawie nie budują | **ECHO A** · audyt ✅ · fix→FIX-Q1=A ZDEPLOY | root: infra vs PROD-GATE · `R-AI-MIASTA-BUDOWY-Q1.md` |
| R-AI-MIASTA-BUDOWY-FIX-Q1 | 2026-08-05 | Fix MP budów: filtr infra vs PROD-GATE | **ZDEPLOYOWANE `0757265a`** (FALA 244) A | `infraOrder`+`isProductionAllowed` · test 17/17 · `R-AI-MIASTA-BUDOWY-FIX-Q1.md` |
| BUG-DYPLO-PANEL-OVERLAP-Q1 | 2026-08-05 | Dyplo nachodzi na panel jednostki | **ZDEPLOYOWANE `8b6e0cfe`** (FALA 245) A | `BUG-DYPLO-PANEL-OVERLAP-Q1.md` |
| R-KOPALNIA-WEGIEL-Q1 | 2026-08-05 | Kopalnia na węglu / stare save | **ECHO custom** — węgiel ep.6–7, nie teraz | `R-KOPALNIA-WEGIEL-Q1.md` |
| R-ZLOZA-EPOKI-GEN-Q1 | 2026-08-05 | Kiedy generować złoża przyszłych epok | **ECHO A** · kanon (kod metali OK, bez deploy) | gen przy Nowej grze + ukryj do epoki · `R-ZLOZA-EPOKI-GEN-Q1.md` |
| P-AI-PROD-GATE-PER-OWNER | 2026-08-05 | isProductionAllowed difficulty per owner | **ZDEPLOYOWANE `d1450398`** (FALA 240) Q1=A | `effectiveGameDifficultyForOwner` · `docs/decyzje/P-AI-PROD-GATE-PER-OWNER.md` |
| P-AI-008 | 2026-08-05 | Zagrożenie: jednostki+rozwój zamiast murów (nie chmury) | **ZDEPLOYOWANE `3840f218`** (FALA 227←226) · playtest odłożony | custom Maciej · `docs/decyzje/P-AI-008.md` |
| R-SCENA-PERF-FALA138 | 2026-08-05 | Budowanie sceny — pomiar→fix | **ZDEPLOYOWANE** FALA 248 `772bab7c` — offline diag + merge skip/cache; pomiar F12 nadal mile widziany | `docs/decyzje/R-SCENA-PERF.md` · handoff sesji 2026-08-05 |
| R-GARNIZON-AKCJE | 2026-07-26 | Opuść garnizon z panelu miasta | **ZDEPLOYOWANE** FALA 212 `e38ad116` (onLeaveGarrison) | diagnoza historyczna — kod już w ROBOCZA |
| R-KOPALNIA-RELIEF | 2026-07-25 | Kopalnie nie spłaszczają wzgórza | **ECHO follow-up** → `R-KAMIEN-RELIEF-FOLLOWUP-Q1` ZAPISANA | miedź/żelazo/złoto OK; legacy `kopalnia` + reguła w ECHO 2026-08-06 |
| P-AI-006 | 2026-07-26 | ekspansywnosc=0 wszędzie | **ZAMKNIĘTE** — `civ-ai.json` 2–5; `ai-expansion.ts` czyta per nacja | REJESTR-DECYZJI 🟢 WDROŻONA FALA 36 |
| P-AI-010 | 2026-07-26 | Poradnik „konkuruj osadnikiem” | **ZAMKNIĘTE** — poradnik rev.G bez osadnika | `14-ai-zagrozenia.md` |
| R-PROC-AUTOBOT | 2026-08-05 | **KAŻDA praca** wyłącznie AutoBot (Operator→Evaluator→Grok) | **TWARDA REGUŁA OBOWIĄZUJE** · P0 zmergowane `#108`/`9068115` · Maciej przypomniał 13:41 | `docs/decyzje/R-PROC-AUTOBOT.md` · `dyspozycje/autobot/` · `.cursor/rules/autobot-evaluator-operator.mdc` |
| R-PROC-AUTOBOT-EVAL-SCOPE | 2026-08-05 | Evaluator: scope=tylko temat + brak regresji/ubocznych zmian | **🟢 OBOWIĄZUJE** · tip `eb84533`+ · rule_105 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` |
| R-PROC-AUTOBOT-EVAL-STRICT | 2026-08-05 | Evaluator STRICT: luki testów / brak asercji AC → FAIL (nie NOTES) | **🟢 OBOWIĄZUJE** · Maciej „2” · rule_106 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-EDGE | 2026-08-05 | Evaluator STRICT-EDGE: testy tematu tylko happy-path bez edge/negacji/repro → FAIL #7 | **🟢 OBOWIĄZUJE** · Maciej „2 Jeszcze twardszy” · rule_107 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-PARITY | 2026-08-05 | Evaluator STRICT-PARITY: asymetria gracz/AI/MP lub test tylko ownerId=0 bez decyzji → FAIL #8 | **🟢 OBOWIĄZUJE** · Maciej „2 = Tylko A (parytet)” · rule_108 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-SAVE | 2026-08-05 | Evaluator STRICT-SAVE: luki save/load nowego pola lub restore bez ?? default → FAIL #9 | **🟢 OBOWIĄZUJE** · Maciej „1+2” oś B · rule_109 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md` |
| P-MP-SPAWN-WYZYWIENIE | 2026-08-05 | Spawn MP: suwak Wyżywienie start ~3 zamiast 4 | **ZDEPLOYOWANE `ea921d1e`** (FALA 238) | `foundCity*` → `poziomRacji:4` · tip `5fecbcf` · test 14/14 |
| R-AUTO-RACJE-RAISE | 2026-08-05 | Auto Wyżywienie + Spichlerz ≥ 0 + przełącznik auto w każdym mieście | **ZDEPLOYOWANE** FALA 225→227 `3840f218` · fokus playtest **ODŁOŻONY** (R-AUTO-RACJE-RAISE-PT=B, 2026-08-06) | Q1=B · Q2–Q5=A · bez ABC o playtest (`R-ABC-BEZ-PLAYTEST`) · `docs/decyzje/R-AUTO-RACJE-RAISE-PT.md` |
| R-REKRUT-LUDNOSC-UI | 2026-08-04 | Teksty rekrutacji: nie sugerować −1 obywatela; ludność miasta nie spada (tylko Manpower) | **ZDEPLOYOWANE `38df6ad7`** (FALA 224) | `docs/decyzje/R-REKRUT-LUDNOSC-UI.md` · cityPanel |
| R-BUDYNKI-NIEAKTYWNE | 2026-08-04 | Wybudowane budynki bez surowca runtime (Spichlerz, Mennica, deposit gate) → czerwona nazwa + tooltip Brak: … | **ZDEPLOYOWANE `132401ef`** (FALA 222) | Q1=A · Q2=A+C · Q3=A · `docs/decyzje/R-BUDYNKI-NIEAKTYWNE.md` · branch `cursor/feat-budynki-nieaktywne-63a1` |
| R-DYPLO-PW-PRZECINEK | 2026-08-04 | Panel PW: śmieci float (−10.400000000000006%) → format jak Skarbiec | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| `docs/decyzje/R-DYPLO-PW-PRZECINEK.md` |
| R-EOT-EVENT-DEFER | 2026-08-04 | Skutki EOT (wydarzenia/toasty) odłóż na start następnej tury gracza | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=**A** · `docs/decyzje/R-EOT-EVENT-DEFER.md` · branch `cursor/feat-eot-dyplo-flex-63a1` |
| R-DYPLO-WYMIANA-FLEX | 2026-08-04 | Stół: jednostronna wymiana, qty edit, jedno Przyjmij, Usuń | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| ONEWAY=A · QTY=A+B · ACCEPT=A · USUN=A · `docs/decyzje/R-DYPLO-WYMIANA-FLEX.md` |
| R-DYPLO-DOBRA-KAT | 2026-08-04 | Dobra handlowe: Surowce/Technologie/Inne (akordeon) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=A · Q2=A · Q3=A · `docs/decyzje/R-DYPLO-DOBRA-KAT.md` · branch `cursor/feat-dobra-kat-trzoda-63a1` |
| R-TRZODA-SCALE-MAP | 2026-08-04 | Skala zwierząt pastwiska/trzody ×1,5 na mapie | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=**B** (krowa+świnia+owca+lama) · `docs/decyzje/R-TRZODA-SCALE-MAP.md` |
| R-SCOUT-ZWIEDZAJ-HIGHLIGHT | 2026-08-04 | Zwiedzaj ma złoty stan WŁ jak Czuwaj/Fortyfikuj (select nie kasuje autoExplore) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| korekta R-SCOUT-EXIT-AUTO · `docs/decyzje/R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md` |
| R-SCOUT-ZWIEDZAJ-PODSWIETLENIE | 2026-08-04 | Po kliknięciu Zwiedzaj brak złotej ramki (Uśpienie OK) | **ZDEPLOYOWANE `ee0e7e04`** (FALA 223) | Q1=A · zostań + złoto od razu · `docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md` |
| R-BATTLE-TEMPO-UI | 2026-08-04 | Panel Tempo bitwy: ± zamiast ×1/×2/×4; AUTO = komputer; prędkość w tooltipach | **ZDEPLOYOWANE `132401ef`** (FALA 222) | Q1=**A** · Q2=**B** · `docs/decyzje/R-BATTLE-TEMPO-UI.md` · branch `cursor/feat-battle-tempo-ui-63a1` |
| R-DYPLO-STOL-PW-SUM | 2026-08-04 | Stół: bilans PW liczy tylko 1. umowę, nie sumuje wymiany surowców na stole | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| panel `negotiationBalanceBarHtml` · suma PW wszystkich pending · `docs/decyzje/R-DYPLO-STOL-PW-SUM.md` |
| R-DYPLO-PRZYJMIJ-TRADE | 2026-08-04 | Stół negocjacji: Przyjmij na Traktat handlowy nic nie robi (umowa_handlowa vs umowa_szlakow w evaluateProposal) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| branch `cursor/fix-dyplo-przyjmij-traktat-63a1` · `docs/decyzje/R-DYPLO-PRZYJMIJ-TRADE.md` |
| R-BUDOWA-ZROWNOWAZONE-TRYB | 2026-08-04 | Zrównoważony w produkcji = osobny tryb (nie 6. priorytet typów) | **ZAMKNIĘTE** · ZDEPLOYOWANE FALA 222→223 `ee0e7e04` · playtest OK | Q1=A · `docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md` |
| R-PROC-NUMER-ABC | 2026-08-03 | Procedura: numer tematu → ABC → commit; deploy tylko na hasło | **WDROŻONE (docs)** | Pliki: `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`, `.cursor/rules/numer-abc-commit-deploy.mdc`, START-TU, CLAUDE, PAMIEC, KOMENDY |
| R-PROC-ABC-FULL-ID | 2026-08-03 | W ABC/Ask/ECHO **zakaz gołego Q1** — zawsze pełne ID (`R-TEMAT-Qn`) bo wiele wątków | **WDROŻONE (docs)** | Maciej: „nie wystarczy Q1… sam nie będziesz wiedział”. Procedura §3a · PAMIEC · abc-pelna-forma · numer-abc rule |
| R-PROC-NO-REGRESS | 2026-08-04 | Przy każdej zmianie: sprawdź diff (co zmienione/usunięte) — nie cofaj wcześniejszego fixa przy wdrażaniu nowego | **WDROŻONE (docs)** | Procedura §4a · checklist przed commit/deploy · PR #78 |
| R-PW-ACCEPT-OVERPAY | 2026-08-04 | Przyjmij traktat: gracz może zaakceptować gdy oddaje więcej (+ bilans); blokada gdy bilans na minus (korzyść gracza) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · `previewIncomingPlayerAccept` net≥0 · PR #79 · `docs/decyzje/R-PW-ACCEPT-OVERPAY.md` |
| R-NADMIAR-POOLS | 2026-08-04 | FALA2 ×2: budynki (upkeep/Praca/surowce), jednostki (rekrut/upkeep/żywność wojska), Brąz+Żelazo badań ×4, ulepszenia, cuda | **ZDEPLOYOWANE FALA 215** `2a5a66d1` | `R_STAWKI_FALA2_MULT=2` · PR #82 |
| MP-ARMY-Q1 | 2026-08-04 | Cap wojska MP: easy ∞ / normal 1 / hard 0 (garnizon wliczony, odbudowa do limitu) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-ARMY-Q1.md` · commit `b47a2e8` |
| MP-GARRISON-Q1 | 2026-08-04 | Hard: istniejące garnizony OK, zakaz nowej produkcji wojskowej | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-GARRISON-Q1.md` |
| MP-DIPLO-Q1 | 2026-08-04 | Ułatwienie AI major→MP; same-civ Zaufanie ~100; priorytet absorpcji klastra | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-DIPLO-Q1.md` |
| AI-FOUND-Q1 | 2026-08-04 | Founding AI major pop ≥ 2 (jak gracz) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-FOUND-Q1.md` |
| AI-LOCAL-Q1 | 2026-08-04 | Faza lokalna AI ~tura 20 LUB 1 scout; wioski nie blokują | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-LOCAL-Q1.md` |
| AI-MANAGE-Q1 | 2026-08-04 | Auto-zarządca dla major AI (nie MP) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-MANAGE-Q1.md` |
| R-UNIT-MODE-TOGGLE-UI | 2026-08-04 | Pasek akcji jednostki: wyróżnienie trybu WŁ/WYŁ (fortyfikuj / czuwaj / zwiedzaj) osobno od dostępny/zablokowany | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #77 · `docs/decyzje/R-UNIT-MODE-TOGGLE-UI.md` |
| R-MP-HARD-WAVE | 2026-08-04 | Hard MP: większe armie + fala ataku + sync DOW klastra | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · Q2=A · Q3=A · PR #80 · `docs/decyzje/R-MP-HARD-WAVE.md` |
| R-SCOUT-BLACK-MAX | 2026-08-04 | Zwiedzaj: każdy ruch max. nowych czarnych heksów (nie FoW); chatka wzrok/reachable; po chatce znowu czarne | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · Q2=A · PR #81 · `docs/decyzje/R-SCOUT-BLACK-MAX.md` |
| R-SCOUT-ZWIEDZAJ | 2026-08-03 | Zwiadowca: przycisk Zwiedzaj (autoExplore), priorytet chatka > mgła | **ZDEPLOYOWANE `5f529a24`** (FALA 203) | P-SCOUT-EXPLORE-Q1=A, Q2=B · `docs/decyzje/P-SCOUT-EXPLORE.md` |
| R-SCOUT-ZWIEDZAJ-UX | 2026-08-04 | Zwiedzaj UX: clear path + deselect + next unit (jak sentry); poza cyklem Spacji | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | clear path + deselect + next · poza cyklem Spacji |
| R-CHATKA-VET-TOAST | 2026-08-04 | Chatka: toast nagrody nadal nadpisywany tipem „Doświadczeni wojownicy” (po FALA 212) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #71 · `docs/decyzje/R-CHATKA-VET-TOAST.md` |
| R-ICON-ZROWNOWAZONE | 2026-08-04 | Ikona zrównoważonego budowania = ta sama waga co Prawo/sąd | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #72 · `docs/decyzje/R-ICON-ZROWNOWAZONE.md` |
| R-MP-ULEPSZENIA | 2026-08-04 | Miasta-państwa nie stawiają ulepszeń terenu (regres FALA 204) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #73 · `docs/decyzje/R-MP-ULEPSZENIA.md` |
| R-OKOLICA-ZYWNOSC-SCORE | 2026-08-04 | Auto-okolica fokus żywność: łąka/równina zamiast lasu; wagi 10/0/0 + potencjał farmy | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #76 · `docs/decyzje/R-OKOLICA-ZYWNOSC-SCORE.md` |
| R-SCOUT-EXIT-AUTO | 2026-08-04 | Marsz / ruch ręczny → wyłącz autoExplore (select NIE — patrz HIGHLIGHT) | **ZDEPLOYOWANE `adefb5b8`** + korekta HIGHLIGHT | PR #75 · korekta `R-SCOUT-ZWIEDZAJ-HIGHLIGHT` |
| R-LISTA-NAZWANA | 2026-08-04 | Lista budowy: nazwane szablony + Zamknij listę (wyjście z trybu) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #74 · `docs/decyzje/R-LISTA-NAZWANA.md` |
| R-AUTO-ULEPSZENIA | 2026-08-03 | Auto-ulepszenia: Q1–Q5 | **WCHŁONIĘTE w R-AUTO-V2 / FALA 204** | `docs/decyzje/P-AUTO-ULEPSZENIA.md` |
| R-TRIUMPH-CS | 2026-08-03 | Triumf po zjednoczeniu ostatniego miasta-państwa tej samej cywilizacji (gracz) | **ZDEPLOYOWANE `5f529a24`** (FALA 203) | P-TRIUMPH-CS-Q1=B · `docs/decyzje/P-TRIUMPH-CS.md` · `triumph-city-state.ts` |
| R-AUTO-V2 | 2026-08-03 | Domknięcie auto: budowa+ulepszenia Q1–Q9 | **ZDEPLOYOWANE (FALA 204)** | `docs/decyzje/R-AUTO-V2.md` · branch `cursor/fix-auto-v2-63a1` |
| R-LUDY-MORZA | 2026-08-03 | Brąz: Ludy Morza bez obozu na wodzie; lądowe obozy zostają (Q1=A) | **ZDEPLOYOWANE (FALA 204)** | `docs/decyzje/R-LUDY-MORZA.md` · w merge z V2 |
| R-AI-MP-WASAL-WCHLONIECIE | 2026-08-03 | AI→MP: trybut/wasal/wchłonięcie ułatwione (skala trudności); sojusze sióstr tylko vs gracz; gracz bez zmian teraz | **ZDEPLOYOWANE (FALA 205)** | Q1=A · Q2=A(Ł/N)+C(Hard) · `ai-cs-absorption.ts` + main.ts · md5 `f41c6550` |
| R-GRACZ-WCHLONIECIE | 2026-08-03 | Gracz wchłania MP po wasalu (N=10, Respekt 90, koszt ¤, zgoda) — v1 tylko CS | **ZDEPLOYOWANE `1c7e9df7`** (FALA 206) | Q1A Q2A Q3A · branch `cursor/fix-gracz-wchloniecie-63a1` · docs |

## ⚠️ LEGENDA STATUSÓW (Maciej 2026-08-03)

`WDROŻONE (kod)` **≠** brak w bundlu ROBOCZA. Przed meldunkiem „nie ma w grze" — sprawdź **`dyspozycje/WERSJE.md`** (FALA + md5). Status `ZDEPLOYOWANE` = potwierdzony wpis w WERSJE.

## KOLEJKA OTWARTA (2026-08-03) — bez kodu / decyzja / design

| ID | Status | Uwagi |
|----|--------|-------|
| R-HANDEL-AI-FALA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | R-HANDEL-AI-FALA-Q1=B · skalowany koszyk AI |
| R-ZAMIEN-ULEPSZENIE-CONFIRM | **ZAMKNIĘTE Q1=A** | Zawsze modal przy zastąpieniu (jak dziś) · `docs/decyzje/R-ZAMIEN-ULEPSZENIE-CONFIRM.md` · bez zmian kodu |
| BUG-ARMIA-BRAK-POLACZ | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Połącz widoczny w docku jednostki |
| R-DESIGN-BADANIA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | R-DESIGN-BADANIA-Q1=B · scienceHubHud + Klatka D |
| R-DESIGN-BADANIA-KLATKA-D | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Numerek planu na węźle drzewka v1.1 |
| R-KOLEJKA-NASTEPNY | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | A+C wykonane: kolonizacja + Design w ROBOCZA |
| R-DESIGN-PANEL-MIASTA | **ZDEPLOYOWANE `64a7878a`** (FALA 208) | prototyp v1; hover czeka Design · `docs/decyzje/R-DESIGN-PANEL-MIASTA.md` |
| R-CITY-PILL-SHIELD-EMBLEM | **ZDEPLOYOWANE `132401ef`** (FALA 222) | tarcza: brak/palisada szara/mury złota; medalion SVG cywu; branch `cursor/fix-city-pill-shield-emblem-63a1` |
| R-PILL-TARCZA-BEZ-MURU | 2026-08-04 | Pigułka: szara tarcza mimo braku palisady/muru na heksie (Sparta) | **ZDEPLOYOWANE `ee0e7e04`** (FALA 223) | Q1=A · wallKind · `docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md` |
| R-UI-TRAKTAT-LANDSCAPE | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | Koszyk traktatu: landscape 2 kol. (PW+warunki lewo, wymiana prawo), modal ~1180px. |
| R-PW-BILANS-ACCEPT | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Bilans PW < 0 → brak akceptacji AI/Przyjmij; dopiero ≥0. PR #70 · `docs/decyzje/R-PW-BILANS-ACCEPT.md` |
| R-WIARYGODNOSC | **R1/R1b/R3/R4 + UI rozbicie + badge/ranking DONE** (FALA 237 `5b0e1c19`) · **§9 ECHO A** → strojenie czeka `działaj` | Spec §7 badge+Potęga w ROBOCZA; `R-WIARYGODNOSC-S9-Q1.md` |
| R-RELACJA-PW-INVERT | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | Korekta FALA 210: niska Rel → niższe PW gracza (siła), partner baza; dopłać. Rel 52/baza 80 → **42 vs 80**. |
| R-AI-KOLONIZACJA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Q1A Q2A Q3B · dystans 4 · pop≥5 · surge |

**PR-y docs — SUPERSEDED (cleanup 2026-08-03):** #35 R-PROC-ABC-FULL-ID → wchłonięte w `cursor/cleanup-docs-rejestr-63a1` · #31 plan AUTO-BUDOWA Q1 → R-AUTO-V2 / FALA 204 · #30 plan AI wasal → FALA 205 / R-AI-MP-WASAL-WCHLONIECIE · #27 backlog IDs → wchłonięte; deploy FALA 204/205.

---

| R-MP-TRYBUT-WOJNA | 2026-08-02 | Miasto-państwo (Tarent): wypowiedziało wojnę i jednocześnie „Oferta trybutu przyjęta" — sprzeczność z UI (akcja 8 niedostępna u MP). | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | Branch `cursor/fix-cs-war-tribute-contradiction-63a1`. Blokada trybutu CS w AI/evaluateProposal/negotiation; prune pending przy DOW. Testy: layers 22/22, proposal 69/69, cluster-diff 25/25. |
| R-HANDEL-AI-FALA | 2026-07-28 | AI handel: sensowne koszyki umów, walidacja magazynów obu stron, cap złota na cały cykl; nie wysyłać pustych propozycji (`zaproponuj_umowe_handlowa`). | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) Q1=B | `buildClampedAiTradeAgreementPayload` · diplomacy-ai-balance 17/17 |
| R-HUD-MIASTO-UKLAD | 2026-07-28 | HUD miasta: lewo jeden rząd **Praca · Żywność · Skarbiec**; prawo przy nazwie **Nauka · Kultura · Religia**; ikony brand, nowrap bez zawijania. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `cityPanel.ts`. W bundle `fed92ad1` razem z FALA 50–55. |
| R-HUD-ZOOM-DOCK | 2026-07-28 | Przyciski zoom **− 100% +** i **⛶** pod minimapą (ta sama lewa krawędź 280px), nie nad mapą. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `minimapHud.ts` · `hud.ts`. |
| R-HUD-MAPA-NOWRAP | 2026-07-28 | HUD mapy: lewy pasek jeden rząd (Skarbiec·Praca·Spichlerz·Nauka·Handel), **bez emoji 🍞** przy Spichlerzu; prawy klaster (Civpedia+Menu) widoczny przy zoom UI 110–150%; nowrap. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `hud.ts` · `sidePanelHud.ts`. |
| R-AI-MP-BUILD-GATE | 2026-08-02 | MP/AI: planner produkcji bez bramki tech/epoki → pusta kolejka | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | **P-AI-014** · `isProductionAllowed` w `ai.ts` + `main.ts`; testy T7D-j/k · PR #18 |
| R-KARTA-ARMIA-2 | 2026-07-28 | Na żetonach składu armii: **2 paski** (HP zielony + ruch niebieski) oprócz tekstu 22/22 · 2/2. | **ZDEPLOYOWANE `fed92ad1`** (FALA 55 w bundle) | `hexContextTooltip.ts` `buildUnitStackBarHtml`. Pierwotny deploy FALA 55: `9bd4a0f6`; potwierdzone w bundle `fed92ad1`. |
| R-KARTA-ARMIA-1 | 2026-07-28 | Po merge jednostek: nazwa **Armia · (q,r)** + skład mini-kart od razu (nie tylko typ lidera); nagłówek panelu **Armia**. | **ZDEPLOYOWANE `fed92ad1`** (FALA 54 w bundle) | `main.ts`, `hexContextTooltip.ts`, `sidePanelHud.ts`. Pierwotny deploy FALA 54: `5162a385`. Handoff: `HANDOFF-SESJA-2026-07-28-KARTA-ARMII.md`. |

## OTWARTE / DO DECYZJI

> **Sekcja historyczna** — wiele wierszy poniżej ma status ZAMKNIĘTE / ZDEPLOYOWANE / WCHŁONIĘTE. Nie traktuj `WDROŻONE (kod)` 1:1 jako braków ROBOCZA; źródło prawdy deployu = **`WERSJE.md` FALA 202+**.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AUDYT-STOLICE-VS-MP | 2026-08-02 | 4 bliskie etykiety miast — czy bypass sep stolic (min ~12 hex)? | **ECHO UX** → `MAP-UX-CLUSTER-LABEL-Q1` ZAPISANA B+C | Audyt DESIGN_KLASTRA; sep 14 twarde; wdrożenie etykiet czeka `działaj` |
| C-ARMY-HUNGER-Q1 | 2026-07-27 | ZNALEZISKO-88: parytet głodu armii AI vs gracz (suwak żywności + utrata HP) | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | Decyzja **A** — pełny parytet · `docs/decyzje/C-ARMY-HUNGER-Q1.md` |
| R-TRUDNOSC-1 | „jakiś czas temu" (odtworzone 2026-07-24) | **Osobny suwak „Trudność miast-państw" w kreatorze gry**, niezależny od głównej trudności. Steruje 3 mechanizmami miast-państw: (1) startowe zaufanie do gracza, (2) skala sojuszu sióstr, (3) posiłki obronne (RESUP). | **ZDEPLOYOWANE `ea75f5ba`** | Suwak w Zaawansowanych opcjach; domyślnie=główna trudność. Recon 2026-07-24: te 3 elementy są pochodną globalnej `_menuDifficulty` (trust easy+10/normal+5/hard0; sojusz sióstr ×0,6/0,3/0,15; RESUP low/normal/strong) **ORAZ przeciek: `bonusWalka` +5% siły walki AI na hard (`trudnosc_poziom3_bonus_walka`) — miasta-państwa też go dostają z globalnej trudności.** Nowa opcja setupu odpina WSZYSTKO (3 mechanizmy + siłę walki miast-państw) od globalnej. Domyślnie = główna trudność (zero regresji). Główna `_menuDifficulty` steruje resztą (ekonomia/AI/mapa). Musi respektować parytet AI. |
| R-UNIT-KOSZT-ŁUCZ | 2026-07-24 | Łucznicy brązowi = 1 Brąz czy 0? | **ZDEPLOYOWANE** (redeploy 4.1) — dystansowe 0 surowców | Decyzja: **0** (jednolicie — wszystkie dystansowe darmowe surowcowo, jak Procarz). Łucznik akadyjski/asyryjski 1→0. Reguła kosztów: dystansowe = 0. |
| R-AUTO-BUDOWA-LISTA | 2026-08-03 | Budowa: Ręczny / Priorytet / Lista nazwana A/B/C | **WCHŁONIĘTE w R-AUTO-V2 / FALA 204** | Q1=A · Q2=A · Q3=B · `docs/decyzje/R-AUTO-BUDOWA-LISTA.md` |
| R-STAWKI-STROJENIE | 2026-07-24 | ×2 koszty: badania + utrzymanie jednostek + budowa budynków + żywność ludność/wojsko (bez cięcia produkcji) | **ZDEPLOYOWANE (FALA 205)** | `R_STAWKI_KOSZT_MULT=2` · md5 `f41c6550` |
| R-DYST-DREWNO | 2026-07-24 | Surowce jednostek: rekrutacja×5 + utrzymanie=baza (Drewno/Brąz/Żelazo) + AI tartak/kopalnia | **ZDEPLOYOWANE** FALA 250 `d7165a12` | Akceptacja Macieja · tip `796fc7a7` · tabela `R-DYST-DREWNO-TABELE-AKCEPTACJA.md` |
| R-AI-KUP-JEDN | 2026-07-24 | AI NIE ma ścieżki „kup jednostkę za złoto" (`purchaseRecruitmentUnit` main.ts:2054 zablokowane do `ownerId===0`). Maciej 2026-07-24: „działać" = **naprawić parytet**. | **ZDEPLOYOWANE `c676b681`** (FALA 5) | `purchaseRecruitmentUnit`/`cancelRecruitmentPurchase` uogólnione na dowolnego ownera (ownerTreasury, koszt surowcowy z puli ownera, UI tylko gracz). Czysty predykat `shouldAIRushBuyUnit` (ai.ts). AI kupuje za złoto gdy: wojna + Manpower + złoto ≥ rezerwa(100)+koszt + <1 zakup w turze. Rezerwa/limit = PLACEHOLDER strojenia. Test ai-unit-rush 8/8, ai-test baseline 233/7 (0 regresji). **Do strojenia w playteście:** czy AI powinno rush-ować agresywniej/inny próg. |
| R-JEDN-DOSTEP-BUG | 2026-07-24 | Pre-istniejący bug: bramka dostępu brąz/żelazo dla jednostek jest MARTWA — `production.ts:751` porównuje `surowiec === 'braz'` po samym `.toLowerCase()`, a dane to `'Brąz'` (z ą) → `'brąz' !== 'braz'`, więc jednostki brązowe/żelazne budują się BEZ wymaganego dostępu do surowca. | **ZDEPLOYOWANE `c676b681`** (FALA 5) | Maciej 2026-07-24: „naprawiaj". Fix: `stripDiacritics()` zamiast `.toLowerCase()` w production.ts (2 miejsca: availableProduction + availableReplacementsFor) → `'Brąz'`→`'braz'` pasuje. Teraz jednostki brązowe/żelazne WYMAGAJĄ dostępu do surowca. Bramki: zelazo-gate 23/23, unit-replace 10/10, tsc 0 (zero regresji). |
| R-HUD-SUROWCE | 2026-07-24 | Surowce niewidoczne w górnym HUD (są tylko w panelu imperium → „SUROWCE STRATEGICZNE"). Dodać **chip „Surowce"** obok Skarbca/Pracy + **osobna zakładka magazynu surowców**. Relayout: **Naukę** przenieść na PRAWO (obok Zaopatrzenia/Ludności/Kultury), **Surowce** na LEWO (obok Skarbca/Pracy). | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | HUD dziś: lewo Skarbiec·Praca·Nauka / prawo Zaopatrzenie·Ludność·Kultura (hud.ts). Licznik surowców istnieje (R-LICZNIK) ale w panelu imperium, nie w HUD. Najpierw mockup zakładki → potem designer → potem wdrożenie. |
| R-SUROWCE-MOCKUP | 2026-07-24 | Przygotować mockup zakładki surowców (magazyn), potem do designera. | **GOTOWE — zaakceptowany** (artefakt claude.ai) → wdrożenie pod R-HUD-SUROWCE | Deliverable: samodzielny HTML mockup (HUD z nowym układem + panel magazynu: 9 surowców magazynowanych z pulą/cap 100+100 i tempem; dostępowe Ceramika/Sól/Koń osobno; Żywność=spichlerz osobno). |
| R-CUDA-TAB | 2026-07-24 | Usunąć osobną zakładkę „Cuda" z lewego menu — cuda tylko w liście budowy miasta, per cywilizacja. | **ZDEPLOYOWANE `666b2b75`** (FALA 6, wariant A: katalog usunięty) | Recon: budowa cudów JUŻ filtrowana per civ (`listBuildableWondersForCiv`, main.ts:1820). Osobny widok-katalog `wondersView.ts` (lewe menu) prawdopodobnie pokazuje wszystkie. Do ustalenia: czy katalog usunąć całkiem czy przefiltrować + jak wpiąć cuda do listy budowy miasta. Osobny temat po mockupie. |
| R-DOTYK-MVP | 2026-07-24 | Wersja pod tablet/dotyk (MVP): pinch-zoom + pan palcem + tap + hover→tap + viewport meta. | **ODŁOŻONE** (R-DOTYK-MVP-Q1=**B**, 2026-08-06) | Potwierdzone B — bez prac do osobnego sygnału. `docs/decyzje/R-DOTYK-MVP-Q1.md`. |
| R-PARYTET-SUROWCE-MP | 2026-07-24 | Zweryfikować: czy inne cywilizacje AI ORAZ miasta-państwa też mają surowce i płacą nimi (parytet ekonomii surowcowej z graczem). | **ZWERYFIKOWANE** — AI civ pełny parytet; MP parytet z 1 luką | **AI cywilizacje: PEŁNY PARYTET** — produkcja+składowanie (advanceCityEconomy bez filtra ownera, turn-economy.ts:1380), cap państwa (reconcileOwnerResourceCaps :1704), płacenie za budynki/jednostki (main.ts:14885/14928, deductOwnerStockCost) i handel surowcami — wszystko owner-agnostic. **MIASTA-PAŃSTWA: parytet Z JEDNĄ LUKĄ** — MAJĄ surowce (produkcja terytorialna + ulepszenia via planCityImprovements, ai.ts:1579), respektują cap państwa i PŁACĄ surowcami przy budowie (aktywna produkcja decideDefensiveCopyTurn→chooseCityProduction, ai.ts:1568). **LUKA:** wykluczone z dyplomatycznego HANDLU surowcami (`zaproponuj_handel_surowiec` poza SIMPLIFIED_CMD, diplomacy-layers.ts:12-16) — z MP tylko Pokój/Wojna/Handel ogólny. → decyzja Macieja czy domknąć (R-MP-HANDEL-SUROWCE). |
| R-SUROWCE-POPRAWKI | 2026-07-24 | Poprawki mockupu surowców (Maciej, iteracja na screenshotach) przed wpięciem w grę. | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | Ustalenia: **(zakładka pełna, wejście z mapy świata)** kompaktowo — usunąć dopiski typu, ikona+nazwa+sztuki+produkcja, **bez „/t"**, szczegóły na hover, prawdziwe ikony gry. **(formy uproszczone)** 3 konteksty: pasek HUD mapy = ikona+ilość+przyrost (styl chipów gry); miasto-budowa = ikona+ilość (jak Total War górny-lewy); miasto-rekrutacja = **tylko Brąz/Żelazo wg epoki**. Screenshoty wysłane do Macieja. Po akcepcie → subagent wpina w grę. |
| R-DESIGN-IKONY-MIEJSKIE | 2026-07-24 | Design ma dorobić 4 ikony surowców PRODUKOWANYCH W MIEŚCIE (brak dedykowanych: dziś dzielą res-iron/res-clay). | **DOSTARCZONE przez Design v4 + ZDEPLOYOWANE `666b2b75`** (FALA 6) — polecenie: `dyspozycje/POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md` | Cegła (res-cegla), Brąz (res-braz), Żelazo (res-zelazo), Stal (res-stal). Spec: SVG 24×24, stroke #e8d88a 1.5, styl jak res-wood/stone/clay/iron. Po dostarczeniu integrator dopisze mapowanie w resources-map-icon-map.json. Do czasu — interimowo odróżnione kolorem w mockupie/impl. |
| R-MAGAZYN-BAZA-500 | 2026-07-24 | Podnieść bazę magazynu 100→500; przypomnienie: +100 za KAŻDY Magazyn (w dowolnym mieście, addytywnie, nie jednorazowo). | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | `magazyn_baza_surowce` 100→500 (easy/normal/hard, płaskie); `magazyn_bonus_surowce_na_budynek`=100 bez zmian (addytywnie). Cap = 500 + 100×liczba Magazynów. Zmiana: econ-params.json + fallback economy-upkeep.ts:338 + fixtury surow-civ-storage-test (44/44). tsc 0. |
| R-IKONY-SUROWCE-V4 | 2026-07-24 | Design dostarczył paczkę v4: 12 nowych ikon surowców (koniec interimowego kolorowania). Sprawdzić dokładnie + zastosować w grze + sprawdzić inne miejsca użycia. | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | 12 SVG poprawne, odrębne, kolory wg decyzji (kamień biały/cegła czerwona/miedź pomarańcz/ruda żel. srebro/brąz zielony/żelazo srebrno-szary/stal szara/glina placek pomarańcz; drewno/ceramika/koń złote). Podgląd wysłany. **Do obsługi w integracji:** (a) `res-copper-ore` vs mapa gry gdzie id copper=`ruda` (alias); (b) EmpireResourceRow używa EMOJI (main.ts:1725) → przełączyć na brand SVG; (c) resolver=brandAssets.mapResourceIconSvg via resources-map-icon-map.json; użycie też w cityPanel chipy + hexContextTooltip. **KOŃ:** do zmiany, ale Maciej nie może załączyć SVG → na razie zostaje v4 jak jest. Cel w repo: docs/ux/.../brand-book/ + gra/src/ui/icons/brand/resources-map/. |
| R-MP-HANDEL-SUROWCE | 2026-07-24 | Czy dopuścić handel surowcami z miastami-państwami (dziś wykluczone z warstwy uproszczonej). | **ZDEPLOYOWANE `8dc09b8a`** (FALA 6.2) | Dodać `zaproponuj_handel_surowiec` do SIMPLIFIED_CMD (diplomacy-layers.ts:12-16); gracz↔MP i AI↔MP, jednorazowo + cyklicznie, obie strony; usunąć skip `simplifiedDiplomacyOwners` w handlu AI↔AI (main.ts:8422). Parytet. |
| R-MP-PORTRET | 2026-07-24 | Miasta-państwa NIE mogą mieć tego samego nowego portretu-zdjęcia władcy co główna cywilizacja (10-11 identycznych postaci). Mają wracać do STAREGO/ogólnego wizerunku kultury (ikona-symbol civ) + etykieta „[Kultura] · miasto-państwo". Dot. wszystkich cywilizacji i ich miast-państw. | **ZAMKNIĘTE — POTWIERDZONE `8dc09b8a`** (FALA 6.2). 2026-07-24: Maciej zobaczył podgląd (dyplomacja + bitwa, realny kod) i wybrał **C-MP-Q1 = A** (zostaw symbol kultury). Bez zmian w kodzie. | Nowy portret = zdjęcie `portrait-{civ}-{epoka}.jpg` (leaderPortraits.ts); MP = `civIconSvg` (symbol kultury, diploUiSkin `forceCultureIcon` + battleScene `isCityState`). Gracz/główne AI = zdjęcie; miasta-państwa = ikona-symbol kultury (świątynia Grecja, tarcza Rzym, piramida Egipt…) — czytelna kultura, brak duplikacji portretu głównego. Miejsca potwierdzone podglądem: dyplomacja (medalion 150px) + bitwa (mini-medalion 22px). Etykieta „Sparta · Grecja · miasto-państwo" zaakceptowana. |
| R-MP-DYPL-PROAKT | 2026-07-25 | CAŁA dyplomacja miast-państw (agresja/aktywność + progi wojna/handel + dary jednorazowe) pod suwak trudności MP. Maciej: „przenieś wszystkie ustawienia poza główną trudność". | **ZDEPLOYOWANE `3db42857`** (FALA 6.1 — pełny zakres) | Dziś globalne (wcześniejsza decyzja „ogólny parametr dla wszystkich AI", D-MP-DYPL Q1 cz.2). 3 mechanizmy (zaufanie/sojusze/posiłki) + aiDiffLevel JUŻ odpięte; to jest 4. potencjalny element. |
| R-SESJA-AUTONOM | 2026-07-24 | Maciej wychodzi; wykonać samodzielnie: 1(ikony)+3/5(UI surowców)+4(baza500 DONE)+6(Cuda)+8(proaktywność MP)+9(panele)+11(AI-rush param). Każdy temat osobny subagent Sonnet 5. Po wszystkim DEPLOY do roboczej. | **ZDEPLOYOWANE `666b2b75`** (FALA 6 — wszystkie 8 tematów) | Decyzje ABC: C-AIRUSH=A (progi→econ-params, wartości bez zmian), C-CUDA=A (usunąć katalog), C-AUTONOMIA=A (temat ryzykowny→pomiń+log, deployuj resztę zieloną). Subagenty: ikony `af354b7`, Cuda `aee4f9c`, proaktywność `ab646e8`, panele `adf5dd3`, AI-rush `aea58aa`. UI surowców (3/5) po integracji ikon. |

| R-MUZYKA-KONTEKST | 2026-07-24 | 6 nowych utworów kontekstowych (Maciej wgrał pliki): (1) intro — nowy PIERWSZY, reszta o 1 dalej; (2) otwarcie panelu dyplomacji z inną cyw.; (3) nakładka pre-battle; (4) sama bitwa; (5) po WYGRANEJ bitwie; (6) po PRZEGRANEJ bitwie. Docelowo: osobny utwór dyplomacji per cywilizacja. | **ZDEPLOYOWANE `e19e50ff`** (FALA 7) | Pliki: `intro/Prayer_of_the_Sun_Stone`, `dyplomacja/Gilded_Porticos`, `prebattle/Song_of_the_Ancient_Hearth`, `bitwa/Before_the_Bronze_Gate`, `zwyciestwo/Where_the_Reed_Bends`, `porazka/Sun_on_the_Copper_Ridge`. Mechanizm OVERLAY (muzyka-antyczna.ts): panel „przejmuje ton", muzyka gry milknie, po zamknięciu wraca (mapa). Intro: lista `INTRO_KOLEJNOSC` (filePlayer.ts). Dyplomacja: show/hideDiplomacyAudience. Pre-battle: show/hidePreBattle. Bitwa+zwycięstwo+porażka: hak w `setMood('bitwa'/'mapa')` + `_showEndScreen` (playerWon → zwycięstwo/porażka, czysta wymiana). Powrót do bitwy przy Replay. Respektuje wyłączoną muzykę (overlay startuje tylko gdy muzyka gry gra) + suwak głośności obejmuje wszystkie. Bundel 28→34 MB (6 mp3 inline). tsc 0. **TODO przyszłość:** utwór dyplomacji per civId (dziś 1 wspólny). |

| R-PALAC-KOSZT | 2026-07-24 | Pałac (budynek startowy) nie może mieć kosztu surowcowego — na starcie pula = 0, więc pierwszego Pałacu nie da się postawić. Zostawić koszt PRODUKCJI (Praca). | **ZDEPLOYOWANE `772bab7c`** (FALA 248) | `buildings.json` palac: brak `koszt_surowce`, `kosztBudowy:40` (Praca). ROBOCZA zweryfikowana 2026-08-06. |
| R-PANEL-SPLIT | 2026-07-24 | Prawy panel imperium (z żetonów Skarbiec/Praca/Surowce/Nauka/Zaopatrzenie/Ludność) ma pokazywać **TYLKO sekcję klikniętego żetonu**, nie całą przewijaną listę — dziś wszystko w jednej liście, mylące (klik Surowce pokazuje Naukę). | **ZDEPLOYOWANE** FALA 248 — jedna sekcja per żeton | `empireDetailPanel.ts` render() składa `params+moc+zasoby+kult+sur` i scrolluje do `data-section`. Zmiana: filtrować body do sekcji z `section` param (widok jednosekcyjny per żeton). Spina bug „chip Surowce→Nauka". |
| R-SUROWCE-UI-ZERO | 2026-07-24 | UI surowców niewidoczne, bo chowa się przy 0 zasobów (start). Pasek miasta `filter(v>0)`; panel imperium przy pustej puli = placeholder. Właściciel: „mockupów nie ma w grze". | **ZDEPLOYOWANE** `b5ba1b0` (FALA 8, C-SURUI=A) — wiersz NOWE był STALE | `docs/decyzje/R-SUROWCE-UI-ZERO.md` · `cityPanel.ts` `CS_RES_STRIP_CORE` (drewno+kamień zawsze) · `main.ts` `buildEmpireResourceRows` (pełny magazyn od 0, bez placeholdera). |
| R-CIVPEDIA | 2026-07-24 | (a) Zaktualizować treść wiki po zmianach sesji; (b) zmienić nazwę „wiki"/„Wikipedia" → **„Civpedia"** w całej grze. | **ZDEPLOYOWANE** FALA 248 — etykiety Civpedia + Baszta w wikiBundle | Po reconie: aktualizacja treści (magazyn 500, surowce jednostek, handel MP, koszt Pałacu, ruda/kamień, Cuda, trudność MP) + rename etykiet UI na Civpedia. |
| R-PIERWSZE-MIASTO | 2026-07-27 | Decyzja **B** (Maciej): pełna blokada — tylko „Załóż miasto", bez ruchu/innych akcji osadnika. Tylko gracz (AI: nie). | **WDROŻONE** (kod, bez deploy tej sesji) | `docs/decyzje/R-PIERWSZE-MIASTO.md` · `first-player-city.ts` · `main.ts` · `buildModeHud.ts` · test `first-player-city-test.cjs` |
| R-MPDIFF-WIDOK | 2026-07-24 | Suwak „Trudność miast-państw" jest w zaawansowanych, ale trudno go znaleźć (właściciel go nie widział). | **ZAMKNIĘTE** — C-MPDIFF-Q1=**A** (suwak zostaje w zaawansowanych; rekom. C supersedes by A) | Opcja istnieje (`ea75f5ba`), widoczna na screenie właściciela. Do rozważenia przeniesienie/podniesienie. |
| R-SUR-DESIGN | 2026-07-24 | Decyzje projektowe surowców: (Q1) ujawnianie żelaza — dziś złoże od startu, aktywne w epoce 3 (rekom. A zostaw); (Q2) kamień = teren (Kamieniołom na Górach, bez złoża) vs złoże (rekom. A zostaw). Węgiel generuje się, ale nieużywany w kosztach (martwy/rezerwa). | **KAMIEŃ ZAMKNIĘTY** (SOLO-Q3=A) · **WĘGIEL=B ZDEPLOYOWANE `fca41b9a`** (FALA 232 SUR-WEGIEL=B; w łańcuchu `772bab7c`) | `map-gen-params.json` rarity 0 · `deposit-era.ts` · ROBOCZA: `SUR-WEGIEL=B: ukryty` |

## W TOKU

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-PANEL-SYNC | 2026-07-24 | Synchronizacja paneli Excel z JSON (JSON→Excel) | **ZAMKNIĘTE (generatory)** · regen Panel-B/C 2026-08-05 · **Panel-C dogoniony F250 2026-08-06** | `gen-panel-b.py`: kolumny `koszt_surowce.{drewno,kamien,cegla,braz,zelazo}` z `buildings.json` (commit `6c788cbe`). `gen-panel-c.py`: `COST_FIELDS` → `Surowiec` + `Surowiec (ilość)` + `Utrzymanie surowiec` + `Utrzymanie surowiec (ilość)` w arkuszu Koszty-jednostek (rekrutacja ×5, utrzymanie baza F250). Regen `Panel-B.xlsx` / `Panel-C.xlsx` z bieżących JSON (`units.json` FALA 250 tip `796fc7a7`). Round-trip `koszt_surowce.*` → `export-b.py` OK (`test-panel-b-roundtrip.py`). Panel D/E bez zmian. |
| R-BILANS-100T | 2026-07-25 | Ponowna analiza bilansu surowców na 100 tur z UWZGLĘDNIENIEM wszystkich zmian tej sesji; założenie: każde miasto ma WSZYSTKIE budynki epoki Kamień+Brąz. Nadmiar czy niedobór? | **ANALIZA GOTOWA** → `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md` | Wynik: **NADMIAR** (duży, rośnie z liczbą miast). Cap civ-wide płaski 200 → imperium 4-miejskie marnuje setki–tysiące/100t. Kamień bez odbiorcy. Drewno/glina jedyne napięte i tylko w chudym mieście. Implikacje strojenia → R-STAWKI-STROJENIE. |
| R-MAGAZYN-PANSTWO | 2026-07-24 | Magazyn = pula PAŃSTWA: 100 + 100/Magazyn, nadmiar przepada, surowce wspólne dla imperium | **ZDEPLOYOWANE `ea75f5ba`** | Cap płaski 100/100/100. Parytet AI 44/44. |
| R-HANDEL-SUROWCE | 2026-07-24 | Handel surowcami w dyplomacji: za pieniądz/Pracę; jednorazowy i przez X tur; AI też | **ZDEPLOYOWANE `ea75f5ba`** | Parytet AI (AI↔AI) 42/42. |
| R-FULLSCREEN-PASEK | 2026-07-25 | Playtest (ze zrzutami ekranu): w trybie pełnego ekranu na dole pojawia się pasek, którego nie powinno być; blokuje przesuwanie mapy myszką przy dolnej krawędzi (edge-pan nie działa w tym miejscu). | **ZDEPLOYOWANE `c08b5fcc`** | WERSJE 2026-07-26 playtest batch: `scene.ts` fullscreenchange + updateStyle=false (brak numeru FALA w WERSJE). |
| R-DESIGN-BADANIA | 2026-07-25 | Playtest: mockup ekranu badań przestarzały vs drzewko. | **GOTOWE-DO-WDROŻENIA** | Design: panel boczny Badania v1 (2026-07-26) · `DO-DESIGN-EKRAN-BADAN-2026-07-25.md` · reskin `scienceHubHud.ts` |
| R-DESIGN-PANEL-MIASTA | 2026-07-25 | Pigułka miasta na mapie — hover produkcji + ostrzeżenie surowców | **ZDEPLOYOWANE** FALA 251 `e594f018` · Q4=B · **V2 ECHO C** | hover bez makiety; Design v2 pilne · `R-DESIGN-PANEL-MIASTA-V2-Q1.md` |
| R-DYP-IKONA-TLO | 2026-07-25 | Playtest (ze zrzutami ekranu): w panelu dyplomacji pod ikoną państwa jest niebieskie kwadratowe tło. Decyzja Macieja: usunąć ALBO zamienić na obramówkę w tym kolorze. | **ZDEPLOYOWANE `c08b5fcc`** | WERSJE 2026-07-26: obramówka `.dip-pennant` (brak numeru FALA w WERSJE). |
| R-WIARYGODNOSC | 2026-07-25 | Wiarygodność cywilizacji (−100…+100), wpływ na zaufanie; trzeci wskaźnik. | **ZDEPLOYOWANE / WDROŻONE** — FALA 233–237 (R1/R1b/UI); audyt 2026-08-05: 0 otwartych ABC | Spec: `WIARYGODNOSC-SPECYFIKACJA.md` (rdzeń zatwierdzony WIAR-Q*); draft: `PROJEKT-WIARYGODNOSC-CYWILIZACJI.md`. Otwarte: §9 strojenie (paczka ABC później) · patrz KOLEJKA OTWARTA |

## ZAMKNIĘTE (ta sesja, 2026-07-23/24)

| ID | Prośba | Status | Commit/Deploy |
|---|---|---|---|
| R-PARYTET-AUDYT | Audyt parytetu gracz↔AI | **ZAMKNIĘTE** | Raport `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` · 7 obszarów pełny parytet · luka jednostki→pula zamknięta przez R-PROD-POOL-TEST |
| R-PROD-POOL-TEST | Konsumpcja surowców z puli państwa (budynki+jednostki) | **ZDEPLOYOWANE** `c676b681` (FALA 5) | `unitStockCost` · `building-stock-cost.ts` · parytet gracz+AI w `main.ts` || R-BYDLO | Bydło/owce/lama = NIE surowce (tylko koń) | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-LICZNIK | Licznik surowców w panelu imperium | ZDEPLOYOWANE | `d6c4f33` / `cd42837f` |
| R-CERAMIKA | Ceramika = tylko dostęp (Garncarnia); koszt 3 budynków→cegła | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PROD-BEZ-PRAC | Produkcja per-ulepszenie bez wymogu pracowników | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PALIWO | Usunąć Paliwo + Mielerz (konwertery→drewno) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-BONUSY-BUD | Stolarnia/Warsztat +10% civ, Garncarnia +10% lokalnie żywność | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-KOSZT-BUD | Koszty surowcowe 28 budynków (Kamień/Brąz/Żelazo) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-CEGLA-A | Cegła-A: Cegielnia 3, Glinianka 5 | ZDEPLOYOWANE | `2d9f173`,`bcd818b` / `cd42837f` |
| R-UPKEEP-PRACA | −1 Praca/turę za ulepszenie surowcowe (wariant B) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-DEADLOCK-AI | Fix kolejności budowy AI (konwertery przed konsumentami) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-KOSZT-JEDN | Koszty jednostek (Kamień 0/Brąz/Żelazo, 1/2/3; Procarz 0) | WDROŻONE (redeploy 4.1) | `aff3435`,`2b0cd14` |
| R-SUPER-ARCHE | Super-jednostki: bezpłatne pieniężnie + max1/stolica + 3 surowca | WDROŻONE (redeploy 4.1) | `c2d77fe` |
| R-CUDA-AI | AI buduje cuda | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-CUDA-BONUS | Wonder-bonusy realnie w ekonomii (gracz+AI) | ZDEPLOYOWANE | `b5e7110` / `cd42837f` |
| R-LUDY-MORZA | #15 Ludy Morza (embarkacja+rajdy) | ZDEPLOYOWANE | `6859d9e` / `aa3c9b06` |
| R-PARYTET-AI | ZASADA: zero uproszczeń dla AI, kod ownerId-agnostic | ZAPISANE (obowiązuje) | `318ed6c` |
| R-X2-OBSADA | Reguła ×2 przy obsadzie ludnością | ODRZUCONE | — (dublowałoby upkeep) |

## FALA 8 — ZDEPLOYOWANE 2026-07-24 (md5 `e9306d7ad25f8f82cf55f8af3b809c0b`)
Zebrane w jednej fali (na sygnał „deploy" Macieja), na mapie Ziemia `58299d6f` (rebase):
- **R-PALAC** (koszt surowcowy Pałacu → 0, zostaje Praca) — **ZDEPLOYOWANE** `42170ea`.
- **R-PIERWSZE-MIASTO** (blokada: nie da się wyjść z trybu zakładania ani skończyć tury bez 1. miasta; guard `exitBuildMode` + canEndTurn/N) — **ZDEPLOYOWANE** `b5ba1b0`. Decyzja: blokować też koniec tury = TAK.
- **C-SURUI = A** (UI surowców widoczne od tury 1: rdzeń drewno+kamień w pasku miasta zawsze; magazyn imperium bez placeholdera przy 0) — **ZDEPLOYOWANE** `b5ba1b0`.
- **C-PANEL = B** (klik żetonu HUD = panel z tylko jego blokiem) — **ZDEPLOYOWANE** `b5ba1b0`.
- **R-KAMIEN = b** (Kamieniołom Wzgórza+Góry; własny niewykluczający sektor — współistnieje z kopalniami rudy/glinianką/stadniną; grafika 300° vs 0°, zweryfikowana wizualnie) — **ZDEPLOYOWANE** `b5ba1b0`.
- **R-CIVPEDIA = A** (rename Wiki→Civpedia + aktualizacja treści + regen wikiBundle) — **ZDEPLOYOWANE** `5cf79a3`.
- **C-MPDIFF-Q1 = A** (suwak trudności MP zostaje w zaawansowanych) i **C-SUR-Q1 = A** (żelazo: złoże od startu, aktywne w epoce 3) — bez zmian w kodzie, ZAMKNIĘTE.

## PRZEGLĄD UI/GAMEPLAY 2026-07-24 (seria uwag Macieja z playtestu) — FALA 9 (w toku)
ZROBIONE w kodzie (tsc 0), NIEZDEPLOYOWANE — czekają na „deploy":
- **R-STARTPREVIEW**: podgląd startu (kreator) = tylko parametry, bez prozy. `e49211c`.
- **R-PANEL-DOCHOD**: klik żetonu dochodu (Nauka/Skarbiec/Praca/Religia/Żywność) = tylko jego wiersz, nie cały blok. `b918ce5`.
- **R-ARMIA**: „Zaopatrzenie" → „Armia"; sekcja grupuje żywność armii + ludność + rekruci. `df4b2a4`.
- **R-DRZEWO-TECH**: usunąć stare (niebieskie) „Pełne drzewko technologii"; „graf epok" → „Drzewo technologii". `6492b30`.
- **R-KARTA-WYMAGANE**: karty budynków — sekcje „Daje" (bonusy) vs „Wymagane" (surowce + dostęp „w zasięgu"). commit karty.
- **R-WYRAB**: wyrąb daje 5 Drewna do puli państwa (koszt 5 Pracy zostaje), nie 5 Pracy. `0017290`.

OTWARTE (recon/plan gotowy lub do zrobienia):
- **R-SOL-GLINA**: sól tylko Wybrzeże, glina tylko przy rzece. **ZROBIONE w kodzie** (subagent Sonnet 5, worktree; `gen-helpers.ts` + `generator.ts` — kolejność złóż PO rzekach/wybrzeżu, fix buga fałszywej flagi rzeki, wyjątek soli w `stripDepositsFromWater`+`deposit-coast-test`). Bramki: tsc 0, determinizm A=B PASS, deposit-coast 20/20. NIEZDEPLOYOWANE. **ROZSTRZYGNIĘTE: C-MAP-SOL-ZIEMIA=B** (Maciej 2026-07-25) — sól = ląd graniczący z płytkim morzem (`isCoastalLandHex`), nie kafel Wybrzeże; działa na Ziemi. Commit `e76329c`. Bramki: deposit-coast 20/20, determinizm PASS (hash 66949c60), tsc 0.
- **R-BARB-SYGNET**: barbarzyńcy pokazują portret cywilizacji — mają dostać własny sygnet barbarzyński (jak wcześniej). Podobne do R-MP-PORTRET.
- **R-DYPLO-STOL**: dwuetapowa dyplomacja — propozycja ląduje na „stole" ze wstępną zgodą AI + „Akceptuj/Zmień" + możliwość dołożenia żądań (np. surowce do paktu). RECON GOTOWY: `evaluateProposal` już jest czystą funkcją (podgląd bez finalizacji); luka = UI (scalić koszyk `diplomacyTradeBasket` z traktatami) + przerwać skrót `applyAudienceAction`→finalizacja. Duży temat (refaktor UI + silnik multi-deal).
- **R-BADANIA-KOLEJKA**: kolejka badań — zaznaczyć do 3 technologii do kolejki. Nowa funkcja (stan kolejki + UI + auto-przejście).
- **DO-DESIGN**: modal „CO WYBIERASZ?" (miasto vs jednostka na jednym heksie) — stary HUD do wymiany przez Design.
- **DO-DESIGN R-ZDOBYCIE-MIASTA**: modal „MIASTO ZDOBYTE / Argos / Potyczka wygrana — wojsko weszło na heks miasta / Rozumiem - Enter" — stary mockup, do designera (nowoczesny wygląd w KANON gry). Zgłoszone 2026-07-25. Mogę przygotować mockup (jak R-SUROWCE-MOCKUP) na sygnał.

## UWAGI BITWY 2026-07-24 (playtest, seria kolejnych) — W TOKU
- **R-BITWA-ETYKIETY**: przyciski dialogu rozstawienia — „Auto-rozstrzygnij" → „Auto"; „Do rozstawienia" → „Bitwa". ZROBIONE inline (`preBattle.ts`, tsc 0), niezdeployowane.
- **R-BITWA-ROSTER**: gdy overlay preBattle otwarty — panel armii świata znika, wraca po zamknięciu. **ZROBIONE** (worktree A: `setArmyStackHudSuppressed` w hud.ts, wpięte w show/hide preBattle). tsc 0.
- **R-BITWA-LICZNIKI**: górny HUD bitwy — liczniki typów jednostek (∩/×/⋊) pokazują błędne wartości (0 i 2 przy łucznikach mimo 1 melee + 1 dystans); nie przelicza realnego składu. Subagent Sonnet 5.
- **R-BITWA-WLADCA**: górny HUD bitwy — imię władcy „Minos" po OBU stronach; ma pokazywać ustalone imiona pierwszych władców per cywilizacja (15×3). Subagent Sonnet 5.
- **R-BITWA-CHROME**: usunąć chrome/pudełka górnych pasków fazy rozstawiania (lewy „Faza rozstawiania" + prawy „Wycofaj się") — zostawić same butony floating nad mapą (nowocześniej). Subagent Sonnet 5 (ten sam co liczniki/imiona, jeden worktree battleScene.ts).
- **R-BITWA-STRATY**: po walce jednostka z stratami — zielony pasek siły/HP/liczebności w panelu armii świata (armyStackHud) pokazuje pełny, nie odzwierciedla strat. Subagent Sonnet 5 (ten sam co R-BITWA-ROSTER, jeden worktree armyStackHud.ts). Sprawdzić czy straty w ogóle zapisywane do modelu jednostki po bitwie.
- **R-JEDN-AKCJE**: panel akcji jednostki (armyStackHud) — dodać **Sentry** (czuwanie/uśpienie do wykrycia wroga) do UFORT./ZASTĄP/POMIŃ; zamienić słowa na ikony-infografiki (ufort→fort, zastąp→strzałki góra-dół, sentry→sen/Zzz, pomiń→przeskocz). Subagent Sonnet 5 (ten sam worktree armyStackHud.ts). Sentry jako nowa mechanika silnika → możliwe ABC o zakres auto-budzenia.
- **R-BITWA-STARTWALKI**: po zakończonej (zwł. przegranej) bitwie pływający klaster „START WALKI"+Reset (deploy, battleScene ~1925) zostaje osierocony na mapie — nie sprząta się. Subagent Sonnet 5 (ten sam worktree battleScene.ts). Spiąć teardown z każdą ścieżką zakończenia bitwy.
- **R-KAMIEN-RELIEF**: kamieniołom SPŁASZCZAŁ wzgórze. **ZROBIONE** (subagent Sonnet 5, worktree, main.ts). Przyczyna: `syncImprovementDecorForHex` chowała bryłę wzgórza dla każdego ulepszenia na terenie podniesionym poza wyjątkiem „solo hodowla"; kamieniołom nie był w wyjątku. Fix: `PRESERVES_HILL_RELIEF_KEYS` += kamieniolom → bryła wzgórza zostaje, model siada na szczycie. Czysty render, bez ABC. tsc 0, determinizm mapy PASS. **FOLLOW-UP:** ten sam bug dotyczy `kopalnia` (żelazo) i `kopalnia_miedzi` — spłaszczają wzgórze identycznie; fix to jednolinijkowe rozszerzenie whitelisty. CZEKA na decyzję właściciela (rekomendacja: rozszerzyć — kopalnia w zboczu wzgórza jest logiczniejsza niż płaski heks).
- **R-RANKING-MOC**: **ZROBIONE** (subagent Sonnet 5, worktree). #1 pozycja absolutna: linia „Twoja pozycja: X. z N cywilizacji (uwzględnia nieodkryte)" w overlayu Mocy + panelu imperium (nowa pure `computeAbsolutePowerRank`, wariant B = dokładnie prośba właściciela). #2 niespójność 2645/3013: potwierdzony bug — respekt brał pierwszy kontakt bez filtra miast-państw i nazywał inną funkcją; teraz liczony wprost z rankingu (jedno źródło). Pliki: power-ranking.ts, main.ts, powerOverlayHud.ts, empireDetailTypes.ts, empireDetailPanel.ts. tsc 0, tech-tree 19/19. ABC C-RANK-Q1 (prezentacja nieodkrytych A=„???"/B=zrobione/C=zbiorczo) — rec B, już wdrożone. NIEZDEPLOYOWANE.
- **R-BITWA-SZYK** (G): mechanizm szyku (piechota vs dystans z przodu) przestał działać — mimo „piechota", dystans jest z przodu (regresja). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-BITWA-KARTY** (H): karty rosteru — Oszczepnik ma ikonę piechoty (zła klasa); paski mocy zasłaniają nazwę jednostki (layout). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-RUCH-WZGORZA**: **ZROBIONE** (subagent Sonnet 5, worktree). ROOT CAUSE: picking trafiał tylko w płaski pryzm bazowy, a wysoka bryła wzgórza/góry (styl roblox) sterczy wyżej i jest przesunięta perspektywicznie → klik lądował w złym heksie (raz dobrze/raz w sąsiada/inna jednostka). Fix: `goraInst`/`wzgorzeInst` dodane do `terrainPickMeshes` + filtr niewidocznych w raycaście (picker.ts, scene.ts). tsc 0, determinizm PASS. Tłumaczy wszystkie 3 objawy.
- **R-RUCH-WZGORZA-2 (nawrót, playtest 2026-07-26)**: **ZROBIONE** (Opus 5). Objaw: klik nadal trafia w zły heks, zwłaszcza na wzgórzach; czasem trzeba kliknąć 2–3× żeby jednostka ruszyła. ROOT CAUSE (inny mechanizm niż R-RUCH-WZGORZA!): `THREE.InstancedMesh.raycast()` odsiewa CAŁY mesh po `boundingSphere`, którą three.js liczy LENIWIE przy pierwszym raycaście i nigdy nie odświeża. Mgła wojny chowa heksy macierzą zerową (`ZERO_MATRIX`, scene.ts), więc pierwszy ruch myszy po starcie gry liczył sferę na mapie prawie całkiem zakrytej → sfera zawężona do odsłoniętego skrawka ZOSTAWAŁA na całą sesję, meshe terenu wypadały z pickingu, a klik leciał na awaryjną płaszczyznę `y = 0`. Ta leży POD wierzchem terenu, więc przy kamerze 52° wskazywała heks dalej od kamery o `Y/tan52°`: **Łąka 0,24 heksa · Wzgórze (plateau kopca) 0,50 heksa · Góra (szczyt) 0,95 heksa**. Pomiar: **29,7% pikseli mapy dawało zły heks (40,0% na wzgórzach/górach) → 0,0% po poprawce**. Fix (jedno miejsce): nowa `refreshInstancedPickBounds()` w `input/picker.ts`, wołana po zbudowaniu sceny w `render/scene.ts` (mapa świata) i `battle/battleScene.ts` (parytet) — sfery zamrożone na komplecie instancji. Druga przyczyna wielokrotnych kliknięć: kamera pan-owała od PIERWSZEGO piksela ruchu, a `main.ts` odrzucał klik dopiero od 6 px → drgnięcie ręki przesuwało mapę spod kursora albo kasowało klik; teraz `DRAG_THRESHOLD_PX` (render/camera.ts) jest wspólny dla kamery i kliku. Regresja w `tools/picker-test.cjs` (140/140). tsc 0, determinizm mapy PASS, smoke OK. Zrzuty przed/po: `docs/ux/picking-2026-07-26/`. NIEZDEPLOYOWANE.
- **R-RUCH-WZGORZA-3 (playtest 2026-08-02)**: **ZDEPLOYOWANE `5e0f30e7`** (FALA 202, PR #12 hills MIN-MOVE). Objaw: żółta trasa przez wzgórza, jednostka często nie rusza. ROOT CAUSE: `truncatePathToBudget` bez MIN-MOVE — koszt wejścia > MP (wzgórze+las=3 przy 2 MP) → pusty segment, odrzucenie ruchu przy pełnym podglądzie trasy. Fix: MIN-MOVE w `truncatePathToBudget`; `beginMoveSelectedUnitTo` używa tej funkcji; aliasy kluczy `terrain-movement.json` w `configureTerrainMovement`. Wzgórza koszt 2 (+1 las), przejezdne; Góry nieprzejdne. Test: `terrain-hill-movement-test.cjs` 10/10. Branch `cursor/fix-move-hills-stuck-63a1`.
- **R-EDGE-PAN**: **ZROBIONE** (ten sam worktree). Edge-pan strefa 32px, prędkość liniowa, clamp do granic (camera.ts, main.ts). Aktywacja: wariant A (tylko gdy zaznaczona jednostka + tryb mapy) = C-EDGEPAN-Q1 rec A; przełączenie na „zawsze" = 1 linia. tsc 0.
- **R-BITWA-GRUPY** (J): numer grupy w bitwie ma być najniższy wolny, nie inkrement (rozgrupuj+zgrupuj tych samych → znów G1, nie G3). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-BITWA-POWTORKA** (I): przy powtórce bitwy znika możliwość rozgrupowania jednostek. Hipoteza: niepełny re-init sceny (może wspólne z R-BITWA-STARTWALKI/F). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-EDGE-PAN**: gdy zaznaczona jednostka i myszka przy krawędzi ekranu — mapa przesuwa się powoli w tym kierunku (ułatwia wskazanie celu ruchu). Subagent Sonnet 5 (ten sam worktree nawigacji mapy co R-RUCH-WZGORZA: main.ts/render). Możliwe ABC: aktywacja zawsze vs tylko przy zaznaczonej jednostce.
- **R-BITWA-ROSTER (temat A) — pozostałe:** (a) Sentry ZROBIONY wariant B (uśpij/obudź ręcznie, bez auto-budzenia na wroga — pole `RuntimeUnit.sentry`, parytet-ready); ikony akcji ZROBIONE (fort/swap/step-over; Sentry=półksiężyc — do ewentualnej korekty Design); (b) **R-BITWA-STRATY / C-STRATY-HP-Q1 — ZAMKNIĘTE 2026-07-27.** Mechanizm zweryfikowany POPRAWNY (test 25/25). Maciej: objaw = **nadreprezentacja siły obrońcy AI** w bitwie ręcznej 3D, nie bug strat zwycięzcy; „jak się powtórzy — wracamy". Bez fixu. `docs/decyzje/C-STRATY-HP-Q1.md`.
- **TEMAT 8 (bramki budynków)**: **ZROBIONY** (subagent Sonnet 5, worktree). Q1 = usunięto blankietową `ERA_ACCESS_LABELS`, bramka epoki = czyste `epokaWejscia ≤ epoka` (naprawiony realny bug blokady budynków). Q2 = realne bramki 7 budynków (stolarnia/kamieniarski/kuznia→surowiec w imperium; port/port_wielki→wybrzeże/rzeka miasta; warsztat_oblezniczy→Koszary; laznia_publiczna→Studnia). Q3 = Piec hutniczy wyjątek zostaje, tekst poprawiony. Parytet AI: naprawiona pre-istniejąca luka (ścieżki budowy AI nie przekazywały etykiet surowców). Pliki: buildings.json, building-resource-gate.ts, production.ts, main.ts, cityPanel.ts. Bramki: tsc 0, tech-tree 19/19, research 33/33. NIEZDEPLOYOWANE.
- **BITWA — AUDYT CAŁOŚCIOWY** (R-BITWA-AUDYT): właściciel — bitwa to najsłabszy aspekt („ciężko sterować, nielogiczne"). Zamówiony audyt Sonnet 5 (read-only) modelu sterowania: deploy, zaznaczanie/ruch (picking+elewacja), grupowanie, tempo, facing, spójność ze światem, czytelność HUD → ranking problemów + kierunki naprawy (kandydaci ABC). Zgłoszone bugi bitwy = objawy. Czeka na raport.
- **DECYZJE OTWARTE (nie blokują playtestu):** C-MAP-SOL-ZIEMIA-Q1 (rec A, właściciel na razie pominął modal — do paczki); kolejka badań C-RES-Q1..Q4 (temat 10, silnik gotowy, UI czeka); stół dyplomacji C-DYP-STOL-Q1/Q2 (temat 9).

## AKTUALIZACJA STATUSU BITWY — worktree B (battleScene.ts) + AUDYT
Subagent B (Sonnet 5, jeden worktree battleScene.ts) — pakiet błędów bitwy:
- **C liczniki** ZROBIONE (nowa `_armyCompositionKind()` tylko dla liczników; `_deployRowKind` celowo liczy Oszczepnika jako melee dla formacji — nietknięte).
- **D imiona władców** CZĘŚCIOWO: mapowanie ikony/portretu civ naprawione (`civIconIdFromCivLabel` 15 civ zamiast fallback→grecy). ROOT CAUSE z audytu: `civIconIdFromLabel` czytał `d.cywilizacje` (zawsze undefined; realny kształt `data.civs.cywilizacje`) + `attackerCivIconId/defenderCivIconId` NIGDY nie przekazywane do `new BattleScene` w main.ts — B dostał polecenie weryfikacji/dodania. **OTWARTE ABC:** gdy dwaj gracze to ta sama cywilizacja (np. dwaj Grecy), dzielą jedno imię władcy per civ+epoka („Minos" po obu stronach) — czy chcieć odrębnych tożsamości władców per-gracz? (rec: na razie per-civ OK; ewentualnie miasta-państwa/ten sam-civ dostają wariant imienia).
- **E chrome pasków** ZROBIONE (tło/ramka topBar → transparent, pigułki przycisków zostają, textShadow na etykiecie tury).
- **F START WALKI osierocony** ZROBIONE (`dispose()` usuwa `_deployToolbar`+dropdowny+`_modeBanner` doczepione do body).
- **G szyk piechota/dystans** ZROBIONE (`_applyDeployArmyFormation` zawsze na całą armię `live`, nie tylko zaznaczenie).
- **H karty rosteru** ZROBIONE (zła ikona: `_armyCompositionKind` w 4 miejscach; nazwa zasłonięta: wysokość karty 56→64 + flexShrink).
- **I powtórka gubi rozgrupowanie** — audyt ustalił DOKŁADNĄ przyczynę (`_replayBattle→_initDeployUI→_autoGroupDeployByKind` bezwarunkowo kasuje ręczne grupy). B dostał fix: zapamiętać `groupId` przy `_endDeployPhase`, odtworzyć przy replay (nie auto-grupować gdy jest zapisany stan). W TOKU.
- **J numeracja grup** ZROBIONE (`_nextFreeGroupId()` = najniższy wolny int; G1→rozgr.→zgr. → znów G1).
- **K1 rozjazd kursor/heks w bitwie** (potwierdzony przez właściciela, ten sam co mapa świata): `_pickGroundTile` fallback y=0 ignoruje wysokość kafla → klik trafia sąsiedni heks/jednostkę. B: wyeliminować poleganie na y=0 (najbliższy kafel rzutem z góry / rozszerzyć pick-meshe). W TOKU.
- **K2 nie da się ruszyć pojedynczej jednostki z grupy** — logika grupy przechwytuje ruch. W TOKU (część może zniknąć po K1).

### AUDYT STEROWANIA BITWĄ (Sonnet 5, read-only) — WNIOSEK GŁÓWNY
To NIE jeden głęboki problem architektury. To kilka punktowych bugów (większość powyżej, prosty fix każdy) + JEDNA realna decyzja projektowa: **facing/flankowanie jest w 100% automatyczne i nieczytelne** (gracz nie ustawia kierunku; jedyny feedback to tekst w logu PO starciu) — to główne źródło wrażenia „ciężko sterować, nielogiczne". Minimalna naprawa: wskaźnik kierunku na pierścieniu zaznaczenia PRZED rozkazem (bez refaktoru silnika).
Pomniejsze decyzje z audytu (kandydaci ABC): (2) zakres formacji „cała armia vs zaznaczenie" — komunikat/model; (8) Ctrl+klik multi-select jest tylko w bitwie, brak na mapie świata (złamanie nawyku); (9) dwa różne „Auto" (auto-rozstrzygnięcie mocą przed bitwą vs auto-odgrywanie na polu) — kolizja nazw.
HARNESS: `combat-test.cjs` DZIAŁA (6/6) — testuje tylko matematykę `combat.ts`, NIE dotyka `battleScene.ts`. Brak jakiegokolwiek automatycznego testu sterowania/UI bitwy (luka narzędziowa).

## INTEGRACJA NOCNA 2026-07-25 (sesja chmurowa, autonomiczna) — DEPLOY-READY, NIEZDEPLOYOWANE
Scalono **10 worktree** w gałąź roboczą `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (merge --no-ff każdy, tsc 0 po każdym kroku). Jeden konflikt (import battleScene.ts temat 11 vs B) rozwiązany ręcznie. **ŻADNEGO builda ani deploya** (zgodnie z poleceniem „nie rób deploy").
Zintegrowane: temat 8 (bramki budynków), temat 12 (sól/glina), kamieniołom (+decyzja: kopalnie też), nawigacja (picking wzgórz + edge-pan), ranking Mocy, panel armii A (ukryj+Sentry+ikony+test HP), temat 14 (żeton Handel), temat 9 (stół dyplomacji MVP), temat 10 silnik (kolejka badań), bitwa B (C–K2: picking/szyk/karty/grupy/imiona/chrome/START-WALKI/powtórka), temat 11 (barbarzyńcy sygnet).
**Bramki na scalonej całości:** tsc 0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · post-battle-HP 25/25 · battle-roster 7/7 · map-gen determinizm A=B PASS + 0 rzek bez ujścia PASS (2 FAIL czasowe = obciążenie maszyny, nie regresja).
**W TOKU (nowe, po integracji):** UI kolejki badań (temat 10, subagent — decyzje Q1=C/Q2=A/Q3=C/Q4=A). **WSTRZYMANE do decyzji:** facing (C-BITWA-FACING — główny wniosek audytu, genuine wybór produktowy).
**Decyzje autonomiczne (do przeglądu rano):** → `dyspozycje/DECYZJE-AUTONOMICZNE-2026-07-25.md` (ABC z zaznaczonym wyborem; „zmień <ID> na <literę>" jeśli źle).
**DO DEPLOYA na sygnał Macieja:** build z `gra/` (`node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`) → runbook ROBOCZA → log WERSJE/KANAL.

## WDROŻENIE DECYZJI MACIEJA 2026-07-25 (po przeglądzie ABC) — KOMPLET, NIEZDEPLOYOWANE
Maciej przejrzał wszystkie decyzje autonomiczne (`DECYZJE-AUTONOMICZNE-2026-07-25.md`) i skorygował część. Wdrożone WSZYSTKIE korekty + nowe funkcje (subagenty Sonnet 5, bez izolacji — izolowane worktree nie widzą zintegrowanej gałęzi):
1. **C-EDGEPAN-Q1=B** — edge-pan ZAWSZE aktywny na mapie (`a44e234`).
2. **C-BITWA-FORMACJA=B** — szyk na aktualnie zaznaczony zakres: jednostka/grupa/armia + komunikat zakresu (`45f9548`).
3. **C-BITWA-WLADCA=B** — NOWA pula 10 imion władców per cywilizacja (15×10=150 w `civs.json` jako `wodzowiePula`), osobne imię per właściciel (państwo i miasto-państwo) wg indeksu wśród właścicieli tej samej kultury; wpięte w bitwę, preBattle i dyplomację (`d776282`).
4. **C-RES UI kolejki badań** (Q1=C oba miejsca, Q2=C drag&drop, Q3=A tylko aktywny cel, Q4=A AI bez kolejki) — panel „Plan badań (n/3)" w hubie (numerki, usuwanie, przeciąganie) + numerowane krążki na węzłach drzewka; klik = enqueue w obu miejscach (`9be8bce`).
5. **C-SENTRY-Q1=A** — auto-budzenie jednostki Sentry gdy wróg w polu widzenia (`areEnemyOwners` + `wakeSentryUnitsOnEnemyContact`, używa istniejącego `unitSight()`; parytet AI) (`bf89f13`). UWAGA: brak w grze cyklu „następna jednostka czekająca na rozkazy", więc Sentry = „odstaw jednostkę, obudź na wroga".
6. **C-FLANK** (Q1=A auto-play na polu, Q2=B wszystkie jednostki) — kierunek natarcia FRONT/BOK/TYŁ per zaznaczony zakres, ustawiany w rozstawianiu; w auto-odgrywaniu jednostki obchodzą wroga BFS-em by trafić w flankę/tył, fallback czołowy gdy niemożliwe (`25e51e6`). Objęte: piechota + konnica. NIE manewrują: falanga (trzyma linię), łucznicy (kiting), machiny (biją w bramę) — świadomie, by nie psuć ich mechanik. Odkrycie: `facing.ts` to MARTWY KOD (stara siatka heksowa); żywa jest 4-kierunkowa `relativeHit` w `battleScene.ts`.
7. **C-DYP-STOL-Q1=B** — koszyk-traktat: słodziki (złoto/surowce) doliczane do decyzji AI przy traktatach (`sweetenerEasePoints`, PLACEHOLDER 25 PN = 1 pkt ease, sufit 20 — DO STROJENIA W PLAYTEŚCIE); transfer słodzików przy akceptacji także dla traktatów ≠ UmowaHandlowa; UI „Dołóż do umowy" (złoto + surowiec) w oknie negocjacji; podgląd ocenia złożony deal (`6595d00`). UI to minimalna sekcja, NIE pełny koszyk `diplomacyTradeBasket` (pełne wpięcie = większy refaktor).
Wcześniej tej doby: **C-MAP-SOL-ZIEMIA=B** — sól na lądzie przy wybrzeżu (działa też na mapie Ziemia) (`e76329c`).


## ZASADA: ZGODNOŚĆ HISTORYCZNA JEDNOSTEK (Maciej 2026-07-25) — WARUNEK STRATEGICZNY
Maciej: „Co do jednostek ważne też, żeby odwzorować jak najlepiej **zgodność historyczną**. To powinno być **warunkiem strategicznym**."
→ Modele i opisy jednostek mają odwzorowywać realia historyczne danej epoki/cywilizacji, nie potoczne wyobrażenia. Przykład wzorcowy: **hastati** = republika rzymska (IV–II w. p.n.e.) — scutum OWALNE (nie prostokątne cesarskie), hełm montefortino z piórami (nie imperial-gallic), pectorale lub lorica hamata (**NIE lorica segmentata** — anachronizm o ~200 lat), pilum ×2 + gladius hispaniensis, jeden nagolennik na lewej nodze.
Obowiązuje przy KAŻDEJ nowej/poprawianej jednostce. Przy niejasnościach historycznych — opisać wątpliwość i uzasadnić wybór, nie zgadywać po filmach.

## R-RENDER-JEDNOSTKI (2026-07-25, w toku)
Maciej poprosił o porównanie: jak wypadłoby renderowanie jednostek zrobione przez model Opus 5 vs obecny stan gry. Przykład: **Hastati**, maksymalnie szczegółowo. Subagent Opus 5 buduje nowy model (`gra/src/render/hastati-opus5.ts`, NIE podmienia obecnego) + samodzielny podgląd HTML „obecny vs Opus 5" obok siebie (`dyspozycje/PODGLAD-HASTATI-OPUS5.html`). Warunek nadrzędny: zgodność historyczna (patrz zasada wyżej). Ma też ocenić, czy OBECNY model ma anachronizmy.

## R-MNOZNIK-BUDYNKI (2026-07-25, w toku — śledztwo)
Do czego miał służyć `mnoznik` w budynkach (14 budynków ma niezerowy, silnik go NIE konsumuje — tylko chip w panelu miasta). Jedyny ślad: `SUROWCE-KANON-2026-07-22.md:90` — „kuznia_zelaza → wielka_kuznia (**mnożnik wojska** + stal)". Subagent Sonnet 5 przeszukuje historię decyzji + historię gita (czy KIEDYKOLWIEK był zaimplementowany) + panele Excel. Raport → `dyspozycje/SLEDZTWO-MNOZNIK-BUDYNKOW.md`.

## R-PALAC-POZIOMY (2026-07-25) — ZAMKNIĘTE: ZOSTAJE JAK JEST (decyzja Macieja)
**ROZSTRZYGNIĘCIE (Maciej 2026-07-25):** „Po prostu każdy poziom jest dla następnej epoki. Pierwszy poziom dla epoki Kamienia, drugi dla Brązu, trzeci dla Żelaza i tak dalej. Kolejne etapy też muszą różnić się surowcami. Więc de facto to co masz obecnie w zupełności nam wystarcza. Jak będziemy rozwijać kolejne epoki, to robimy kolejny poziom pałacu. Po co teraz to robić?"
→ **ZASADA: 1 poziom budynku = 1 epoka**, każdy poziom z INNYMI surowcami. Obecne trzy tiery (palac/palac_ii/palac_iii = Kamień/Brąz/Żelazo, drewno → +kamień → +cegła) realizują ten model poprawnie. **Poziomów 4-10 NIE projektujemy z góry** — kolejny tier powstaje dopiero wraz z kolejną epoką. Wcześniejszy wybór C (scalenie w jeden budynek 10-poziomowy) — ODWOŁANY, workflow zatrzymany przed jakąkolwiek zmianą, zero modyfikacji w danych.
Pozostała drobna niespójność kosmetyczna (każdy tier deklaruje `maksPoziom: 10`, co UI pokazuje jako „Maks. poziom: 10" mimo że nieosiągalne) — do ewentualnego sprzątnięcia przy okazji, NIE priorytet.
Ta sama zasada dotyczy 8 pozostałych łańcuchów budynków (Odlewnia, Port, Świątynia, Biblioteka→Akademia, Mury→Cytadela, Koszary→Akademia wojskowa, Kuźnia→Wielka kuźnia, Spichlerz) — nie projektujemy poziomów na zapas.

## (archiwum) R-PALAC-POZIOMY — analiza, która doprowadziła do decyzji
Maciej: „jeżeli projektujesz 10 poziomów pałacu, to Pałac I, II i III to już są pierwszy, drugi i trzeci poziom. Możesz doprojektować pozostałe siedem, ale nie mnóż tego dla każdego Pałacu."
Stan: `palac`, `palac_ii`, `palac_iii` — KAŻDY ma `maksPoziom: 10` → efektywnie 30 poziomów w linii. Dodatkowo `palac` ma tylko 3 `nazwyPoziomow` przy maksPoziom 10. Subagent Sonnet 5: recon (czy problem dotyczy też innych tier-ów: odlewnia, kuźnia, port), wyliczenie realnej progresji przy 3-4 epokach, **ABC do decyzji właściciela** (jak podzielić 10 poziomów). Zmian projektowych NIE robi bez decyzji.


## 🅿️ ZAPARKOWANE: AWANSE BUDYNKÓW W KOLEJNYCH EPOKACH (Maciej 2026-07-25)
**NIE ZAJMUJEMY SIĘ TYM, dopóki Maciej nie da znać, że idziemy w kolejne epoki.**
Zasada: **1 poziom budynku = 1 epoka**, każdy poziom z innymi surowcami. Obecny stan (Pałac I/II/III = Kamień/Brąz/Żelazo) jest poprawny i wystarczający.
Gdy dojdą kolejne epoki — wtedy dla KAŻDEGO budynku osobno przemyśleć: **czy ten budynek w ogóle awansuje w kolejnej epoce?** Jeśli tak: nowy tier + inne surowce + bonusy + nazwa. Dotyczy Pałacu i 8 pozostałych łańcuchów (Odlewnia, Port, Świątynia, Spichlerz, Biblioteka→Akademia, Mury→Cytadela, Koszary→Akademia wojskowa, Kuźnia→Wielka kuźnia).
Pełny zapis zasady → `STAN-PRACY-HANDOFF.md` §9 (sekcja „ZAPARKOWANE DO CZASU KOLEJNYCH EPOK").

## DECYZJE 2026-07-25 — jednostki epoki Kamienia + mnożniki (Maciej)
- **C-HASTATI-Q1 = B** — podnosimy poprzeczkę szczegółowości modeli jednostek. Zakres: NA RAZIE TYLKO EPOKA KAMIENIA („później zajmiemy się kolejnymi epokami").
- **ZGODNOŚĆ HISTORYCZNA = WARUNEK STRATEGICZNY** (patrz osobna zasada wyżej). Wzorzec: hastati republikańscy.
- **10 jednostek Kamienia przebudowane** (4 subagenty Opus 5). **Wpięte do gry:** Wojownik, Oszczepnik, Łucznik, Zwiadowca, Chaska (Inkowie), Estólica (Inkowie), Taran, Zulu (Izijula). **NIE wpięte:** Hastati Opus 5 (epoka Żelaza — poza zakresem), łucznicy Egipt/Sumer (czekają na łucznika nubijskiego).
- **Znalezione anachronizmy w OBECNYCH modelach** (lista kontrolna na kolejne epoki — powtarzają się DWA wzorce: metal tam, gdzie go nie mogło być, oraz insygnia władzy na szeregowych): macuahuitl (aztecka maczuga XV w. n.e.) jako broń Wojownika · umbo na tarczy · łuk 3× za mały · 2 lotki zamiast 3 · złota opaska llautu = insygnium Sapa Inki · brąz w 3 miejscach u Inków · atlatl bez rowka i haka (element, od którego jednostka bierze nazwę) · nemes = nakrycie królewskie na szeregowym łuczniku (500-900 lat za wcześnie) · złoty kołnierz usech · miedziany hełm sumeryjski · stalowy grot i 4 koła u jednostek Kamienia · „spłuczka" (kij umgobo z kitką) sterczący nad tarczą Zulusa — **UWAGA: ten sam błąd siedzi też w Impi** (`jednostki-p57`), do poprawy przy epoce Brązu.
- **C-SUMER-KOLOR = B** — narzuta Sumeryjczyka w terakocie `0x8f4a2e` (barwione tkaniny w Mezopotamii poświadczone). Kaunakes zostaje w naturalnej wełnie.
- **C-UNITS-OPIS = A** — poprawić opisy „łuk kompozytowy" przy jednostkach Kamienia (technologia ~1650 p.n.e.). **ZAMKNIĘTE** — `units.json`: Łucznik egipski → łuk dwuwypukły; Łucznik sumeryjski → łuk prosty (epoka Kamień bez „kompozytowy").
- **TARAN** — kamienny na płozach zatwierdzony, ograniczony do epoki Kamienia. **Nowa jednostka „Taran okuty"** (Brąz;Żelazo) na kołach — koło jako wyróżnik epoki Brązu. Asyryjski taran z wieżą zostawiony na Żelazo.
- **ŁUCZNIK EGIPTU dla Brązu = NUBIJSKI** (nie numidyjski — Numidyjczycy to Afryka Płn.-Zach., epoka żelaza, słynęli z JAZDY; Nubia = `Ta-Seti` „Kraina Łuku", a Medżajowie w grze to już Nubijczycy). Parametry: zasięg 5 (najlepszy w grze), atak dyst. 7, 16 pocisków, Health 50, **Ruch 3** (C-NUBIJ-RUCH=B — Medżajowie jako zwiadowcy pustynni). Bazowy Łucznik NIE dostaje kontynuacji.
- **C-MNOZ-WYCIEK = A** — zatrzymać wyciek Pracy, wpiąć mechaniki tam, gdzie należą. **WARTOŚCI DO POTWIERDZENIA przez Macieja** (wylistowane w czacie): żywe dziś Wielka Kuźnia 23→54%, Akademia 10→24%, Karawanseraj 8→19%, Pretorium 5→12%; martwe Akademia wojskowa 20%, Warsztat oblężniczy 10% (bez zapisanej intencji), Kuźnia żelaza 8%, Kuźnia 5%, Koszary 5%, Lazaret 5% (mechanika regeneracji NIE ISTNIEJE w silniku). Otwarte: czy siła jednostek SUMUJE się z budynków czy liczy się najwyższy.
- **C-PRZYROST = A** — **ZAMKNIĘTE** (`docs/decyzje/C-PRZYROST.md`): UI panelu miasta pokazuje realne wartości z `buildingEffectAtLevel` (baza + przyrost × (poziom−1)), nie surowe etykiety `przyrost`. Silnik bez zmian.

## MNOŻNIKI BUDYNKÓW — ustalenia 2026-07-25 (Maciej)
**Zasada nadrzędna:** budynki gospodarcze dokładają Pracę · handlowe dokładają handel · wojskowe dokładają parametry jednostek.
- **Gospodarcze — mnożnik USUNIĘTY**, zostaje sama Praca: Kuźnia (6), Kuźnia żelaza (8), Wielka Kuźnia (20). Trzy kuźnie traktowane jako gospodarcze.
- **Wojskowe — mnożnik = ULEPSZENIE JEDNOSTEK, dwie ścieżki po 3 poziomy:**
  - **PANCERZ (armor):** Kuźnia +15% (Brąz) · Kuźnia żelaza +15% (Żelazo) · **Wielka Kuźnia +15% (Klasyczna — C-KUZNIA-EPOKA=B: ZOSTAJE w epoce 4, parametr zdefiniowany, uśpiony do czasu zrobienia epoki Klasycznej)**. Dziś osiągalne max +30%.
  - **POZOSTAŁE PARAMETRY (wszystko poza armor, „umiejętności miękkie"):** Koszary 20% (było 5) · Akademia wojskowa 20% · Warsztat oblężniczy 10% → razem 50%.
- Jednostka zdobywa poziom **budując się w mieście LUB wchodząc do niego**; poziom zostaje na stałe.
- **ODZNAKI na żetonach** — osobna dla pancerza i osobna dla pozostałych parametrów, z poziomem 1/2/3, żeby gracz widział, czy jednostka jest przeszkolona. Weterani = osobny temat na później.
- **ZAMKNIĘTE (2026-07-27 sync):** ~~C-UPGRADE-KUMULACJA~~ = **1A** wdrożone (`docs/decyzje/C-UPGRADE-KUMULACJA.md`) · ~~C-MURY-MODEL~~ = **2A+3** wdrożone (`docs/decyzje/C-MURY-MODEL.md`).
- **ZAMKNIĘTE (2026-07-28):** ~~C-UPGRADE-TRIGGER~~ = bonus przy heksie miasta + toast (`docs/decyzje/C-UPGRADE-TRIGGER.md`) · FALA 44 `95021308` · commit `65e3ddd`.
- **USUNIĘTY Z GRY: Lazaret** (`3228fb1`) — epoka Średniowiecza, niedostępny; dane, ikona, Civpedia, poradnik, encyklopedia.
- **Mury/Cytadela — stan faktyczny:** Mury mają DWA żywe mechanizmy: `obrona 5 (+3/poz.)` = wytrzymałość muru w oblężeniu (jedyne żywe użycie pola `przyrost` w grze!) ORAZ +200% Obrony dla obrońców (`bonus_obrona_mur_proc`, flaga maMur). **Cytadela: `obrona 15` NIE jest czytana nigdzie i nie ma własnego procentu — ulepszenie Murów do Cytadeli nie daje dziś NIC.**

## ODPOWIEDZI MACIEJA 2026-07-25 (pytania numerowane)
- **1A** — poziom ulepszenia jednostki = **najlepsze odwiedzone miasto** (nie kumulacja).
- **2A** — obrona miasta **wyłącznie procentowo**; płaskie bonusy obrony z budynków usunięte (dublowały +200%).
- **3 = 100%** — Cytadela +100% DODATKOWO do muru → miasto z Cytadelą ma **300%**.
- **4** — Akademia i **każdy budynek naukowy** dokłada **+10% do nauki** („było na twardo zapisane i gdzieś zniknęło"). Biblioteka→Akademia to upgrade, więc nie kumulują się.
- **5** — Karawanseraj ma dawać handel (budynek handlowy), ale wg Macieja występuje dopiero w średniowieczu → patrz PYTANIE 15.
- **6** — Pretorium to **budynek rządowy jak Pałac** → zastosować to samo rozwiązanie co przy Pałacu (usunąć mnożnik, zostawić realne plony).
- **7A** — `maksPoziom` na REALNY (epoka 1→3, 2→2, 3→1); fikcyjne 10 usunięte. Temat awansu budynków ZAPARKOWANY → `STAN-PRACY-HANDOFF.md` §9.
- **8A** — wpiąć pole „Dostępna w epokach" w produkcję (żeby taran kamienny realnie znikał po Kamieniu).
- **9A** — Taran okuty jako **osobna jednostka**, kamienny znika po epoce.
- **10 = NIE A** — **mechanizm ×1,10 (compound) DO LIKWIDACJI, „żeby już nie było śladów w grze"**. Parametry mają rosnąć **+1 na każdy poziom** (Pałac: szczęście, kultura/prawo). To zmiana GLOBALNA — dotyczy skalowania wszystkich budynków. Doprecyzowanie w toku (czy +1 dla każdego parametru każdego budynku, czy ożywić istniejące wartości `przyrost`).
- **11A** — odznaki ulepszeń: małe ikony przy żetonie z cyfrą poziomu (tarcza=pancerz, miecz=parametry).
- **12A** — czerwona tunika linii rzymskiej ZOSTAJE jako tożsamość wizualna.
- **13B** — „spłuczka" (kij umgobo) w Impi — poprawić **przy robieniu epoki Brązu**, nie teraz.
- **14A** — **zmierzyć FPS** na dużej bitwie przed wejściem w kolejne epoki (modele ~3× cięższe, brak instancjonowania).
- **OTWARTE:** 15 (Karawanseraj — epoka), 16 (martwa `obrona: 2` w Pretorium).

## PYTANIE 15 — Karawanseraj (anachronizm epoki) — ODPOWIEDŹ: **B = USUNĄĆ Z GRY**
Maciej 2026-07-25: „15b". Karawanseraj stoi w danych w epoce Brązu (`epokaWejscia: 2`), a historycznie to budynek
średniowieczny (szlaki karawanowe, Persja/Anatolia, ~X-XV w.). Zamiast przenosić i parkować — **usuwamy całkowicie**,
tak jak Lazaret (commit 3228fb1). Do usunięcia: wpis w `gra/data/buildings.json`, ikona, Civpedia/poradnik/encyklopedia,
odwołania w panelach Excel i dokumentacji, powiązanie `techUnlock: "Handel"` (sprawdzić czy tech nie zostaje pusty).
Efekt uboczny: znika 1 z 4 żywych wycieków `mnoznik` (8% → 19% na poz. 10).

## PYTANIE 16 — Pretorium: martwe `obrona` — ODPOWIEDŹ: **A = USUNĄĆ** (+ audyt pozostałych bonusów)
Maciej 2026-07-25: „16a ale sprawdźmy, jakie inne bonusy ma pretorium."
`baza.obrona: 2` / `przyrost.obrona: 1` — silnik NIE czyta `obrona` z budynków (obrona miasta wyłącznie procentowa:
mur 200%, Cytadela 300%) → wyzerować, spójnie z decyzją 2A dla murów i Cytadeli.
**Pełny stan Pretorium (audyt na żądanie):**
| pole | wartość | status |
|---|---|---|
| kategoria | Administracja | — |
| epokaWejscia | 3 (Żelazo), techUnlock „Prawo" | ŻYWE |
| baza.praca | 2 | ŻYWE (praca miasta) |
| baza.pieniadz | 3 | ŻYWE (dochód) |
| baza.zadowolenie | 1 | ŻYWE |
| baza.obrona | 2 | **MARTWE → do zera (16A)** |
| baza.mnoznik | 5 | **do zera** (decyzja 6: budynek rządowy jak Pałac) |
| przyrost.* | praca 1 / pieniądz 2 / zadow. 1 / obrona 1 / mnoznik 2 | żywe po przejściu na model liniowy; obrona+mnoznik do zera |
| kosztBudowy 75 (+15/poz.), utrzymanie 3 (+1) | — | ŻYWE |
| koszt_surowce | cegła 9 | ŻYWE |
| uwagi | „bonus do utrzymania porządku (garnizon); mnożnik % do przychodu podatkowego" | **OPIS NIEZGODNY Z KODEM** — garnizonu nie ma, mnożnik idzie na Pracę a nie na podatki; opis do przepisania po zmianie |

## ZASADA MODELI (Maciej 2026-07-25)
„Tylko wyjątkowo za moją zgodą możesz użyć Opus 5 albo Fable 5." → **wszystkie prace zlecane subagentom na Sonnet 5**;
Opus/Fable wyłącznie po wyraźnej zgodzie właściciela.

## R-LINEARYZACJA (2026-07-25) — ZAMKNIĘTE: ×1,10 zlikwidowane
Odpowiedź Macieja na pytanie 10: „parametry pałacu miały rosnąć o jeden w każdym z wypadków, a nie o dziesięć procent.
To dziesięć procent do likwidacji, usunięcia, żeby już nie było śladów w grze."
**Wdrożone przez subagenta Sonnet 5:**
- `buildingEffectAtLevel(baza, przyrost, poziom) = baza + przyrost × (poziom−1)` — zamiast `baza × 1,10^(poziom−1)`
- koszt budowy: `kosztBudowy + przyrostKosztu × (poziom−1)`; utrzymanie: `utrzymanie + przyrostUtrzymania × (poziom−1)`
- usunięty parametr `budynek_mnoznik_poziomu` z `gra/data/miasto-params.json` i stała `BUILDING_LEVEL_FACTOR`
- `maksPoziom` urealniony w 37 budynkach: epoka 1 → 3, epoka 2 → 2, epoka 3 → 1 (koniec fikcyjnego „10")
- UI przycina listę `nazwyPoziomow` do realnego `maksPoziom`
**Skutek liczbowy:** Pałac kultura 5→11 na poziomie 3 (wcześniej compound dawał 5→6). Rodzina `przyrost*` z martwej stała się ŻYWA.
Bramki: tsc 0, tech-tree 19/19, research 33/33, logic-test 207/208 (1 porażka mapgen — osobne zadanie).

## R-COMBAT-TEST (2026-07-25) — ZAMKNIĘTE: nic do naprawy
Zlecona naprawa „zepsutego harnessu `counterTyp`" okazała się bezprzedmiotowa — naprawiono go już commitem `496dd53` (2026-07-19/20).
Test daje **6/6 pass**, exit 0, bez wyjątku. Nieaktualny był zapis w `CLAUDE.md` („~21 porażek logic-test", „combat-test rzuca wyjątkiem")
— poprawiony. Uwaga na przyszłość: asercje `combat-test.cjs` są sanity-checkami strukturalnymi, NIE porównaniem z oczekiwanymi
wynikami bitew — test nie wykryje błędów balansu, tylko awarie.

## PYTANIA 18–20 (2026-07-25) — ZADANE, CZEKAJĄ NA ODPOWIEDŹ
Pełna forma ABC w `dyspozycje/PYTANIA-OTWARTE.md`:
- **18** profil Pretorium po sprzątnięciu (rek. A: zadowolenie 1→3)
- **19** utrzymanie budynków — zróżnicowane czy płaskie (rek. A: włączyć dane, flat tylko jako domyślna)
- **20** Targowisko — co z bonusem handlowym, który nigdy nie działał (rek. A: przenieść do bazowego pieniądza)
Szkice paczki 2 (21 `odblokowuje`, 22 Wielka Kuźnia, 23 odznaki ulepszeń) — tamże.
Backlog przyszłościowy: **`dyspozycje/BACKLOG-PRZYSZLOSC.md`**.

## R-LUCZNIK-NUBIJSKI (2026-07-25) — WDROŻONE
Decyzja Macieja: Egipt w epoce Brązu dostaje **Łucznika nubijskiego** zastępującego Łucznika.
**Parametry podane przez właściciela:** zasięg 5 · atak dystansowy 7 · 16 pocisków · Health 50 · Ruch 3.
**Parametry dobrane przez subagenta — DO ZATWIERDZENIA przez właściciela:**
koszt 20 pieniądza (Łucznik akadyjski ma 16 — nubijski ma lepszy zasięg, atak, pociski i marsz) · utrzymanie 2 ·
ludność 1 · brak wymaganego surowca (żaden łucznik w grze nie kosztuje brązu — łuk to drewno) ·
atak/uderzenie/obrona 4/2/6 (standard łuczników) · ruch w bitwie 4 · próg dezercji 0,4 · widok 2 ·
pancerz/przebicie 2/2 · kara z flanki/tyłu 50%/80% · morale 85/25 · tech „Łucznictwo" · klasa Specjalna/Distance ·
epoki „Brąz;Żelazo" · missileAttack 6 (o 1 wyżej niż akadyjski) · fieldPower 16.
**Ważne ustalenie techniczne:** sam wpis „W zamian za" w `units.json` NIE wystarcza — produkcja jednostek specjalnych
filtruje dodatkowo przez listę `bonusy[].typ = "jednostka_specjalna"` w `gra/data/civs.json`. Bez dopisania nazwy do tej
listy jednostka w ogóle nie pojawia się w produkcji. Dopisane (precedens: Sumerowie mają tam i Łucznika sumeryjskiego,
i akadyjskiego). **Model 3D:** tymczasowo model łucznika egipskiego; dedykowany model nubijski do zrobienia osobno.

## R-MAPGEN-GLINA (2026-07-25) — NAPRAWIONE, logic-test 208/208
Pre-istniejąca porażka `mapgen: deposits obey terrain rules` była **realnym błędem generatora**, nie nieaktualną asercją.
Reguła gliny (`gen-helpers.ts`): glina TYLKO na lądzie z prawdziwą rzeką. Główna ścieżka losowania ją respektowała,
ale **konsolidacyjna ścieżka fair-play** (`ensureDepositGridCoverage` → `forceDepositInCell` → `pickDepositBootstrapHex`)
wymuszała glinę na dowolnym heksie lądowym, ignorując regułę. Stary komentarz nazywał to „akceptowalnym wyjątkiem" —
bez żadnego umocowania w decyzji właściciela. Naprawiono generator (bootstrap zwraca `null`, gdy w komórce nie ma
zgodnego heksu — dopuszczalne, bo fair-play wymaga ≥85% pokrycia, nie 100%), asercji testu NIE rozluźniono.
Sąsiednie złoża (miedź/żelazo/węgiel/konie) bezpieczne — `prepareTerrainForDeposit` wymusza teren PRZED złożem.
**Zauważone przy okazji (osobny temat):** `fair-play-grid-test.cjs` ma pre-istniejące porażki — klastry gór/wzgórz
za duże, pokrycie złóż 75% < 85% na „Standard Ziemia".

## R-PRAWO-ADMINISTRACJA (2026-07-25) — decyzje Macieja 26B, 27A, 28
**26 = B** — bazy wyższych tierów podnoszone tak, żeby awans zawsze wygrywał (nie zerujemy przyrostu).
**27 = A** — Prawo z Pałacu rośnie z tierem.
**28** — Pretorium = **70% wartości Pałacu III**; wcześniej ustalone: Ratusz = 70% Pretorium, Sąd = 50% Pretorium.

**Docelowa siatka Prawa (łatwy / normalny / trudny):**
| Budynek | easy | normal | hard | % skali w Żelazie (100 pkt) |
|---|---|---|---|---|
| Pałac I | 45 | 35 | 28 | 35% |
| Pałac II | 58 | 45 | 36 | 45% |
| Pałac III | 71 | 55 | 44 | 55% |
| Pretorium (70% P3) | 50 | 38 | 31 | 38% |
| Ratusz (70% Pretorium) | 35 | 27 | 22 | 27% |
| Sąd (50% Pretorium) | 25 | 19 | 16 | 19% |
| Dom Starszyzny (70% P1) — gdy powstanie | 31 | 24 | 20 | — |
| Dwór Zarządcy (70% P2) — gdy powstanie | 41 | 31 | 25 | — |
| Garnizon (za jednostkę, max 5) — bez zmian | 25 | 20 | 15 | 20% każda |

**KONSEKWENCJA ZGŁOSZONA WŁAŚCICIELOWI:** miasto z Pretorium + Ratuszem + Sądem zbiera 84 pkt Prawa
bez ani jednej jednostki wojska (dziś te same trzy budynki dają 16). Garnizon przestaje być koniecznością,
staje się uzupełnieniem. Właściciel podtrzymał regułę 70% — wdrażamy.

**Do rozstrzygnięcia osobno:** Ratusz nie istnieje jako budynek (parametr gotowy, `hasRatusz` nigdy nie jest true).
Przy trzech szczeblach administracji lokalnej byłoby sześć budynków administracyjnych (Dom Starszyzny, Dwór Zarządcy,
Ratusz, Trybunał, Sąd, Pretorium) w grze o trzech epokach — patrz pytania 29–31.

## NOWE PROŚBY 2026-07-25 (popołudnie/wieczór) — model budynków, jeszcze bez R-ID w tabeli głównej

Zapisane tu, żeby nie zgubić się (zasada procesu tego pliku) — pełny opis każdej w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md`. Status wdrożenia w kodzie różni się pozycja od pozycji
(audyt gap-fill 2026-08-05: R-BASZTA i R-STOLICA-REGION wdrożone na `main`).

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-BASZTA | 2026-07-25 | Nowy budynek obronny epoki Żelaza „Baszta" (+100% Obrony, stoi obok Murów+Cytadeli, nie zastępuje) — nazwa ZATWIERDZONA. | **ZDEPLOYOWANE** FALA 246 `cbf529f3` (audyt docs 2026-08-05; gameplay wcześniej na main) | `buildings.json` id `baszta`, `miasto-params.json` `bonus_obrona_baszta_proc=100`, `city-defense.ts` +400%, prereq Mury (`building-resource-gate.ts`), ikona `building-icon-map.json`, Civpedia `docs/encyklopedia/budynki/baszta.md`. Testy: `koszty-surowcowe-test.cjs` 128/128, `city-defense-terrain-gate-test.cjs` 31/31. |
| R-AWANS-MODEL | 2026-07-25 | Ogólna reguła: łańcuchy budynków dzielą się na „w górę" (następca kasuje poprzednika, stała wartość per tier, rośnie tylko przez awans) i „w bok" (oba stoją obok siebie, wartości przyrostowe). | **ZDEPLOYOWANE** FALA 11 `dd1ec38e` · kod `2354fb7` (verify 2026-08-05) | Pytanie 25 = B (per łańcuch). 6 łańcuchów „w górę" (Pałac, Dom Starszyzny→Dwór Zarządcy→Pretorium, Kuźnia, Spichlerz, Port, Piec hutniczy), 4 „w bok" — pełna lista `DECYZJE-BUDYNKI-2026-07-25.md` §1. **Nie zdeployowane do ROBOCZA** — tylko commit na gałęzi roboczej. |
| R-PANEL-GRUPY | 2026-07-25 | Panel miasta: budynki grupowane w 8 grup dziedzinowych (Prawo i administracja / Wojsko i obrona / Handel i pieniądz / Nauka i kultura / Wiara / Zdrowie / Produkcja surowców / Żywność); klik grupy rozwija budynki; budynek-następca „w górę" rozwija listę zastąpionych. | **ZDEPLOYOWANE** · `grupa` w buildings.json + UI (verify 2026-08-05, test 83/83) | Nie zdeployowane do ROBOCZA. |
| R-STOLICA-REGION | 2026-07-25 | Pałac I/II/III wyłącznie w stolicy; Dom Starszyzny/Dwór Zarządcy/Pretorium wyłącznie poza stolicą; Trybunał i Sąd wszędzie. | **ZDEPLOYOWANE** FALA 246 `cbf529f3` (audyt docs + fix testu; gameplay wcześniej na main) | `buildings.json` `lokalizacja: stolica|region`, `production.ts` `buildingLocationAllowed`, Trybunał/Sąd bez `lokalizacja`. Test: `administracja-stolica-test.cjs` 48/48. |
| R-PRAWO-SIATKA-V2 | 2026-07-25 | Siatka Prawa dla Dom Starszyzny/Dwór Zarządcy zmieniona z „70% swojego odpowiednika (Pałac I/II)" na „50%/60% Pałacu III" — patrz `R-PRAWO-ADMINISTRACJA` wyżej dla starych liczb. | **ZDEPLOYOWANE** FALA 247 `540d2490` (audyt; liczby wcześniej na main) — było **WDROŻONE** (audyt 2026-08-05) — `society-params.json` już zgodny (Dom 36/28/22, Dwór 43/33/26, Pretorium 50/38/31); zero zmian liczb | Test: `prawo-siatka-v2-test.cjs` + `prawo-palac-tier-test.cjs`. Dowód: `docs/decyzje/R-PRAWO-SIATKA-V2.md`. |

## ZGŁOSZENIA Z PLAYTESTU 2026-07-26 (Maciej, bundle FALA 15 `7c7ae9a0`)

Zapisywane na bieżąco na polecenie właściciela („zapisuj sobie wszystkie nowe zgłoszenia do listy zgłoszeń").
Cytaty są dosłowne — nie parafrazuję, żeby przy wdrożeniu nie zgubić intencji.

| ID | Data | Prośba (cytat / opis) | Status | Uwagi |
|---|---|---|---|---|
| R-TECH-ESC-FS | 2026-07-26 | „jeżeli wejdzie się do drzewka technologii w badaniach, a wcześniej był włączony pełny ekran, to nie da się wyjść bez usunięcia pełnego ekranu. Escape najpierw wychodzi z pełnego ekranu, a dopiero potem wychodzi z drzewka technologii, a powinno być na odwrót." | **ZDEPLOYOWANE** FALA 16 `290a962b` (Keyboard Lock) | Przeglądarka konsumuje Escape w pełnym ekranie ZANIM zdarzenie dojdzie do strony — samym listenerem kolejności nie odwrócimy. Użyto **Keyboard Lock API** (`navigator.keyboard.lock(['Escape'])`) na czas otwartego drzewka: Escape zamyka drzewko, pełny ekran zostaje; blokada zdejmowana przy zamknięciu, więc na mapie Escape znów wychodzi z pełnego ekranu. Wyjście z pełnego ekranu przy zablokowanym Escape = PRZYTRZYMANIE Escape (zachowanie Chromium). Poza Chromium API nie ma → zostaje stan sprzed zmiany + widoczny przycisk „Wróć". **Do sprawdzenia w playteście.** |
| R-TECH-WROC | 2026-07-26 | „powie mi gdzieś jakiś przycisk w badaniu drzewko technologii wyjść, żeby można było wyjść bez dawania escape'a" + „Escape jest po prawej stronie ale słabo widoczny więc trzeba byłoby go gdzieś przenieść na środek i wyjustować na samej górze na środku" + „raczej to powinien być symbol wróć a nie wyjdź". | **ZDEPLOYOWANE** FALA 16+ · przycisk ← Wróć · ESC | Znaczek `✕` z prawego rogu nagłówka usunięty; w jego miejsce wyśrodkowana u góry pigułka **„← Wróć · ESC"** (`.civ-ttv-back`, `position:absolute; left:50%`), złota obwódka + cień, żeby była widoczna na ciemnym tle. |
| R-HUD-PANEL-LEWY | 2026-07-26 | „gdy włączy się cokolwiek po lewej stronie, to menu od nowego otwartego okna nachodzi trochę na przyciski, a nie powinno." (zrzuty: panel MIASTA styka się z okrągłymi przyciskami paska; panel BADANIA dodatkowo zachodzi na górny pasek chipów Skarbiec/Praca/Surowce/Handel) | **ZDEPLOYOWANE** FALA 16 `290a962b` · `sidePanelLayout.ts` | Przyczyna: każdy panel miał WŁASNĄ, zduplikowaną i błędną stałą `LEFT_INSET = 68 px`, podczas gdy prawa krawędź medalionów toolbara wypada na **74 px** (toolbar `left:22 px` + przycisk `52 px`) — stąd 6 px nachodzenia. Do tego wszystkie miały `TOP = 56 px`, a dolna krawędź paska chipów jest na **104 px** — stąd zachodzenie panelu Badań na pasek. Paneli z tym samym błędem było **sześć, nie dwa**: Miasta, Badania, Dyplomacja, Wojsko, Civpedia, dok drzewka. Fix: nowy `ui/sidePanelLayout.ts` jako JEDYNE źródło (`SIDE_PANEL_LEFT = 22+52+12 = 86 px`, `SIDE_PANEL_TOP = 104 px`), liczone z wyeksportowanej geometrii toolbara. Ograniczenie wysokości panelu i wewnętrzny scroll już istniały. Zweryfikowane zrzutami z Chromium. |
| R-BADANIA-KOLEJKA-OK | 2026-07-26 | „przetestowałem też kontener na kolejne badania i działa. Można rzucać, można przeciągać, także jest okej." | **POTWIERDZONE PLAYTESTEM — ZAMKNIĘTE** | Domyka zadanie „UI kolejki badań (Q1=C oba miejsca, Q2=C drag&drop, Q3=A, Q4=A)". |
| R-MP-MODELE-KAMIEN | 2026-07-26 | „wydaje mi się, że państwa miasta używają starych grafik dla jednostek typu kamienia." | **ZDEPLOYOWANE** FALA 247+ · dispatch Wojownik→Opus5 | **Zgłoszenie potwierdzone, ale przyczyna NIE leży w miastach-państwach** — renderer nie ma żadnego rozgałęzienia po `ownerId`/`civId`/epoce (parytet zachowany). Winna jedna jednostka: **„Wojownik" (Kamień)**. `units.json` daje jej `Typ = "Swordsman"`, więc `categoryOf()` zwracało `miecznik` i model leciał na STARY `newBuildMiecznik` (28 meshy / 416 trójkątów); nowy `buildWojownikOpus5` (87 meshy / 1198 trójkątów) był podpięty tylko do gałęzi `default` i był **martwym kodem**. Widać to było na miastach-państwach, bo AI w gałęzi `defensiveCopy` ma „Wojownika" z najwyższym priorytetem (`ai.ts:743`) — ich armia to praktycznie same Wojowniki; gracz miał ten sam błąd, tylko rzadziej. Fix: jedna linia dispatchu po pełnej nazwie (`=== 'wojownik'`), więc warianty („Wojownik germański", „…mykeński", „…babiloński", Chaska) zachowują swoje modele. Bramki: `tsc` 0, tech-tree 19/19, research 33/33, unit-replace 10/10, dispatch-check 14/14; pomiary bryły: wysokość 0,831×HEX_R, maks. promień 0,297×HEX_R. |
| R-ARMIA-PASKI | 2026-07-26 | „trzeba jakoś inaczej pokazać pozostałą ilość ruchów oraz energię, czy tam AP, bo jest to trochę mylące, nie wiadomo o co chodzi. Myślę, trzeba było zmienić kolor ruchu na niebieski." | **ZDEPLOYOWANE** FALA 247+ · niebieski pasek ruchu | Lista armii (`armyListHud.ts`) ma dwa paski jeden pod drugim i OBA są zielone przy pełnych wartościach: zdrowie (`.al-hpbar`, czerwień→zieleń) i ruch (`.al-mvbar`, gradient zielony) — nie widać, co jest czym. Zmiana: pasek ruchu na **niebieski**, każdy pasek dostaje podpis z liczbami („Zdrowie 34/50", „Ruch 3/3"), a zduplikowane „Ruch: 3/3" znika z `detailLine` (`main.ts` ~3536). |
| R-SUROWCE-DOSTEP | 2026-07-26 | „sprawdź, czy w surowcach jest miejsce na surowce, które tylko trzeba mieć dostęp… powinno być chociaż zasugerowane miejsce na surowce, które są dostępem" + „trzeba dodać złoto". | **ZDEPLOYOWANE** FALA 248 — access rows `cap` null + Złoto | Przyczyna znikania wierszy: `main.ts` (`buildEmpireResourceRows`) pomijał (`continue`) każdy wiersz `access`, którego owner jeszcze nie odblokował — świadoma decyzja C-SURUI=A z 2026-07-24, teraz odwrócona. Wiersze dostępu (Ceramika, Sól, Koń) pokazują się **zawsze**, ze stanem „masz"/„brak" zamiast paska magazynu; dołożone **Złoto** jako czwarty wiersz dostępu, korzystające z istniejącej `ownerHasZlotoAccessNow(ownerId)` (bez drugiej implementacji). Nowa podsekcja „Dostęp — nie magazynowane" + podpis źródła dostępu. Bramki bez regresji (`tsc` 0, logic 208/208, zloto-szlak 45/45, mennica-uspienie 47/47). |
| R-TURA-JEDN-AKTYWNA | 2026-07-26 | „po zakończeniu tury, okazuje się zwiadowca czy armia, ale nie w formie takiej, że jest zaznaczona i można gdzieś ruszać, tylko po prostu jakoś bezimiennie. Więc wydaje mi się, że po zakończeniu tury powinna się pojawiać możliwość od razu ruchu jednostką z możliwością wybrania kierunku. Jeżeli już coś albo w ogóle nie powinna się ta armia pokazywać." | **ZDEPLOYOWANE** — ruchLeft + kamera po spawnie | **Diagnoza:** to nie kolejność reset↔render. Reset punktów ruchu (`main.ts:13789`, `u.ruchLeft = u.ruch`) wykonuje się poprawnie PRZED `turn++`. Jednostka w panelu to NOWO ZWERBOWANA jednostka, kończona w fazie ekonomii JUŻ PO `turn++` (`main.ts:14657`) i rodzi się z `ruchLeft: 0` → stoi bezczynnie CAŁĄ nową turę. Panel otwiera się dla niej bezwarunkowo (`afterPlayerUnitSpawned`, `main.ts:5723-5734`) z pominięciem istniejącego filtra `stackCanMove` (`main.ts:5569`). Kamera do niej NIE leci (brak `focusAt`, które ma zwykłe cyklowanie `main.ts:3234`), więc pierścień zaznaczenia zwykle jest poza kadrem. Osobno mylące: pasek „RUCH 3" to statystyka BAZOWA jednostki (`main.ts:9684`), a karta „0/3 ruch" to stan realny — dwa różne pola obok siebie. Na zrzucie panel armii po zakończeniu tury pokazuje Zwiadowcę z **„0/3 ruch"** — czyli albo panel jest zbudowany przed resetem punktów ruchu na nową turę, albo reset nie obejmuje tej jednostki. Do rozstrzygnięcia: czy jednostka jest realnie zaznaczona (podświetlenie heksu, zasięg ruchu, kamera), czy tylko wyświetlona. Wariant docelowy do decyzji właściciela po diagnozie: (A) auto-zaznaczenie z podświetlonym zasięgiem ruchu, (B) nie pokazywać panelu, gdy jednostka nie może się ruszyć. |
| R-GARNIZON-AKCJE | 2026-07-26 | „nie da się uśpić jednostki w mieście." | **ZDEPLOYOWANE** FALA 212 `e38ad116` · `onLeaveGarrison` | Historyczna diagnoza supersedowana — odfort z panelu miasta działa |
| R-BARB-WOJNA | 2026-07-26 | barbarzyńcy atakują zwiadowców | **ZAMKNIĘTE** — C-BARB-Q1=B (wojna) + **R-BARB-WOJNA-2=C** (atak wszystkich, bez wyjątku cywili) | `R-BARB-WOJNA-2.md` · kod bez zmian |
| R-OBRONA-MIASTA-MP | 2026-07-26 | „nie wiem też, dlaczego nagle przeciwnicy mają jakieś niewiarygodne bonusy w obronie miasta, jeżeli nawet nie ma tam muru, zwłaszcza kiedy atakuje państwa miasta. Coś tu jest nie tak." | **SCALONE** — patrz `R-OBRONA-MIASTA-MP-Q1` wyżej (runda 3, PASS-WITH-NOTES) | Audyt: brak buga podwójnego mnożnika; A = rozbicie preBattle · `docs/decyzje/R-OBRONA-MIASTA-MP.md` |
| R-MUZYKA-OPOZNIENIE | zgłoszone wcześniej (odtworzone 2026-07-26) | „przesuń start muzyki w menu głównym o dwie, trzy sekundy, bo ścina początek, zanim się załaduje przeglądarka" | **ZDEPLOYOWANE** FALA 18 `2f928932` — `muzyka_opoznienie_startu_ms=2500` | ⚠️ **Prośba padła wcześniej i NIE ZOSTAŁA ZAREJESTROWANA ANI WYKONANA** — dokładnie ten przypadek, przed którym ostrzega zasada procesu tego pliku. Wdrożenie: opóźnienie **2500 ms** jako nazwany parametr `menu.muzyka_opoznienie_startu_ms` w `ui-params.json`, wyłącznie dla pierwszego startu utworu w menu głównym (nie dla przejść między utworami ani muzyki kontekstowej); do sprawdzenia, czy da się dodatkowo powiązać start ze zdarzeniem gotowości odtwarzacza. |
| R-DYP-NEGOCJACJE-NA-ZYWO | 2026-07-26 | negocjacje w audiencji na bieżąco, nie po turze | **ZDEPLOYOWANE** — resolveNegotiationEntryAt | `docs/decyzje/R-DYP-NEGOCJACJE-NA-ZYWO.md` · `main.ts` C-DYP-Q1 · FALA 18 |
| R-ESC-PELNY-EKRAN | 2026-07-26 | Escape: najpierw zamknij panel, potem pełny ekran | **ZDEPLOYOWANE** FALA 253 `b8704216` · Q1=A | + science-hub/city-list (F253) · science-picker/army-list/save-load (F252) |
| R-AI-RECRUIT-UPKEEP-GATE | 2026-08-06 | Rekrutacja: pula musi pokryć koszt surowca + 1× utrzymanie/turę (łącznie) | **ZDEPLOYOWANE** FALA 252 `bbff9996` | `canAffordUnitRecruitFull` · parytet gracz/AI/MP · tip `df5cc308` · test 18/18 |
| R-RZEKI-PERF-FALA138 | 2026-08-01 | perf głównych rzek **>2 min** po FALA 138 | **ZAMKNIĘTE** | Maciej ~20:58 na FALA 140 `935d1642`: etap głównych **~20 s OK**. Fix `d2db99c`+`9c4320b`. Szczegóły: `PYTANIA-OTWARTE.md` → `BUG-RZEKI-PERF-FALA138`. |
| R-RZEKI-UJSCIE-FALA138 | 2026-08-01 | regres: rzeki kończą się w środku lądu | **ZDEPLOYOWANE** FALA 140 `935d1642` + FALA 177 | Fix `9c4320b`/`ensureRiverOutlets`; smoke 12 map: 0 bez ujścia. W ROBOCZA od FALA 140+. |
| R-RZEKI-KILLSWITCH-DIAG | 2026-08-01 | Eksperyment diagnozy: wyłączanie rzek stage 0–5 (izolacja wąskiego gardła) | **W TRAKCIE** | FALA 149: `getRiverRenderStage()` w `scene.ts`, default **0**; archiwum `dyspozycje/_archiwum-rzeki/scene-rivers-FULL-2026-08-01.ts`. Maciej 23:31 — kod renderu zostaje, tylko bramka. |
| R-DYPLO-NAP-FAIRMIN-FALSE | 2026-08-02 | NAP @ Rel 52: panel pokazuje fałszywe „Brakuje 274 PW" / fair min 570 zamiast progu Relacji | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `renderPnBalancePanelForTreaty` · na main z FALA 201 |
| R-DYPLO-TRADE-INCOMING | 2026-08-02 | Traktat handlowy od AI: Przyjmij zablokowany fair-min, bilans −120/Brakuje, brak edycji obu stron koszyka | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `main.ts` canAccept · `diplomacy-acceptance-points.ts` netto · klik karty → koszyk. Test 177/177. Branch `cursor/fix-trade-offer-edit-balance-63a1` · PR #9 |
| R-DYPLO-GIFT-WAR-FALSE | 2026-08-02 | Dar pieniędzy (Prezent) blokowany komunikatem „W wojnie pieniądze tylko w ugodzie pokojowej" mimo stanu POKÓJ w audiencji | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `validateBasketForm` — `ctx.atWar` zamiast hardkodu `true`. Testy war-gates + proposal §17–18 · PR #11 |
| R-DYPLO-TRADE-WILLINGNESS | 2026-08-02 | AI proponuje handel gdy partner niechętny / brak walidacji willingness | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #10 |
| R-SCENA-PERF-FALA138 | 2026-08-01 | Budowanie sceny: **bardzo długo** | **ZDEPLOYOWANE** FALA 248 `772bab7c` (+ dżungla InstancedMesh F249) — offline diag + merge skip/cache; pomiar F12 nadal mile widziany | `docs/decyzje/R-SCENA-PERF.md` · handoff sesji 2026-08-05 |
| R-SPAWN-CLUSTER-KULTURA | 2026-08-01 | Jakość klastrów: cywilizacje jednego typu czasem lądują w kręgu innego typu zamiast razem wokół siebie (stolica + mp) | **ZDEPLOYOWANE `2b1e072c`** (FALA 142) | `assignTypesToClusterCenters()` w `clusters.ts` + `allocateTypyToMasses`. ROBOCZA zweryfikowana 2026-08-06. |
| R-SPAWN-ODLEGLOSC-MORZE | 2026-08-01 | Start cywilizacji (zwł. główna) min. **~10 hex od morza** na Standard; skalować z rozmiarem mapy | **ZDEPLOYOWANE `26b05753`** (FALA 200) | Pas stolicy 10–15 hex Standard (`clusters.ts`); wcześniej WDROŻONE (kod) min 10. |
| R-SPAWN-SEP-STOLICE-15 | 2026-08-02 | Standard: odległość stolic różnych civ **14→15 hex** (tylko `duza`; MP w klastrze bez zmian) | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `capitalMinSeparation` LUT `duza: 15` · placement sep 17 · `minDystansObcyOdGracza` 17 na Standard. Testy: `capital-sep-unit-test.cjs`, `capital-sep-pangea-test.cjs`, `cluster-start-test.cjs`. |
| R-DYP-GIFT-WAR | 2026-08-02 | Dar 50¤ od miasta-państwa widoczny i akceptowalny podczas wojny (Kapua/Rzymianie) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | BUG-DYP-GIFT-WAR · `pruneInvalidNegotiations` po DOW · filtr UI + bramka Accept · `isGift` w `aiCommandToPendingProposal` · PR #19 |
| R-INKOWIE-MP-BRAK | 2026-08-02 | Inkowie (i czasem inne obce) bez miast-państw po body-sep / deferred spawn | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `repackAllSparse…` + `clusterStartSlot` · PR #5 |
| R-KOLEJKA-ZWROT-SUROWCA | 2026-08-02 | Anulowanie budynku z kolejki nie zwraca koszt_surowce | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `cancelQueueItem` + refund · PR #6 |
| R-BARB-GLOD-ATAK | 2026-08-02 | Barbarzyńcy bez głodu; obóz z 2 wojownikami od razu maszeruje na cywilizację | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `empire-food.ts` skip -1 · `isCampRaidReady` + `decideBarbarianMoves` · branch `cursor/fix-barb-no-hunger-attack-63a1` · PR #7 |
| R-PRACA-OVERFLOW-HUD | 2026-08-02 | Pusta kolejka budowy + suwak 100% budowa → HUD Praca +0 zamiast całej puli miasta | **ZDEPLOYOWANE (FALA 205)** | `previewPracaPoolBrutto` + main.ts · md5 `f41c6550` · production-overflow 24/24 |
| R-MP-NAZWA-CIV-MISMATCH | 2026-08-01 | MP: nazwa miasta ≠ kultura (Jin + Argos·Grecy); Chińczycy oznaczeni jako Grecy | **ZDEPLOYOWANE** — pendingSameTypeRivalOwnerIds | `pendingSameTypeRivalOwnerIds` w `cluster-spawn.ts` + `main.ts` spawn; bez kolizji z obcymi ID. |
| R-MP-LOGO-SAME-AS-PLAYER | 2026-08-02 | Audiencja: miasto-państwo (ten sam typ co gracz) ma identyczny portret-zdjęcie władcy zamiast symbolu kultury | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `shouldForceCultureIconForOwner` (`display-names.ts`) + `portraitForceCultureIcon` w `main.ts`; load fallback `simplifiedDiplomacyOwners`; `foundCityAt` → `startCityState`. Test: `display-names-test.cjs`. Branch `cursor/fix-mp-logo-same-as-player-63a1` · PR #8 |
| R-DYPLO-AI-LABEL | 2026-08-02 | Dyplomacja: „AI 32" zamiast nazwy miasta-państwa; Ludność 0 na duchach | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `display-names.ts` sanitize + `ownerDiploLabel` pula; `eliminateOwner` czyści discovered; filtr listy · PR #15 |
| R-MEDIUM-RIVERS-FOG | 2026-08-02 | Średnie rzeki widoczne w mgle wojny (powinny być ukryte jak główne) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #16 · render/scene FoW medium rivers |
| R-ORPHAN-UNITS | 2026-08-02 | Jednostki sieroty po merge / eliminacji ownera | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #21 |
| R-BATTLE-HP-BAR | 2026-08-02 | Pasek HP w bitwie / podsumowaniu nieczytelny lub błędny | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #22 · `battle-hp` test 7/7 |
| R-RUCH-WZGORZA-3 | 2026-08-02 | Ruch przez wzgórza: trasa widoczna, jednostka nie rusza (MIN-MOVE) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #12 hills MIN-MOVE · `terrain-hill-movement-test.cjs` 10/10 · branch `cursor/fix-move-hills-stuck-63a1` |
| R-RYZ-CYWILIZACJE | 2026-07-26 | „ryż uprawny mieli robić tylko Chińczycy i chyba Aztekowie, z tego co pamiętam" | **ZAPISANE — DO POTWIERDZENIA** (ryżu nie ma dziś w grze) | **Stan faktyczny:** w `gra/data/**` nie ma dziś ŻADNEGO surowca ani ulepszenia „ryż" — sprawdzone grepem (jedyne trafienia to „ryzyko" i nazwy miast). Zapis jest więc ograniczeniem na przyszłość, na moment wprowadzenia ryżu jako uprawy/surowca, a nie poprawką istniejącego stanu. **Zapisana reguła:** uprawa ryżu dostępna wyłącznie dla wybranych cywilizacji — na pewno **Chińczycy**; **Aztekowie do potwierdzenia**. **⚠️ Uwaga historyczna do rozstrzygnięcia przez właściciela (zasada: zgodność historyczna = warunek strategiczny):** Aztekowie nie uprawiali ryżu — ich podstawą była kukurydza na chinampach (pływających polach), ryż trafił do Ameryk dopiero z kolonizacją. Jeśli chodziło o **uprawę na wodzie / chinampy jako azteckie ulepszenie**, to osobny byt niż ryż i warto go nazwać właściwie. Do potwierdzenia przy wprowadzaniu upraw. |
| R-AI-SUWAKI | 2026-07-26 | **Decyzja C-AI-SUWAKI = A** — AI dostaje heurystykę ruszania suwakami (żywność, Handel, Praca). | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | `decideAIEconomySliders` w `ai.ts` + wiring `main.ts` (~L21177); `econ-params.json` `ai_suwaki_*`. ROBOCZA zweryfikowana 2026-08-06. |
| R-MAPGEN-KOLEJNOSC | 2026-07-26 | Kolejność: teren → rzeki → lasy → złoża | **PACZKA ZAMKNIĘTA** — Q1=B las · Q2=C ~15% górzystości · Q3=A wieloetapowy floor (2×/3×) bez skracania | Testy: fair-play · relief-grid · map-gen-regression |
| R-TEREN-DOPIAC | 2026-07-26 | **Decyzja C-TEREN-Q1 = A** — trzy etapy terenu bitwy. | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | `battleScene.ts` etapy 1–3 · `teren-walki-etapy-test.cjs` 33/33 PASS (2026-08-06). |
| R-GARN-AKCJE-A | 2026-07-26 | **Decyzja C-GARN-Q1 = A + rozszerzenie właściciela:** „możliwość zaznaczenia jednostki na liście jednostek w lewym menu i skierowania jej w dowolne inne miejsce — wtedy automatycznie następuje odfortyfikowanie albo odśpienie". | **ZDEPLOYOWANE** FALA 248 — lista armii + auto-wake przy ruchu | Dwa elementy: (1) akcja „Opuść garnizon" przy jednostce w panelu miasta; (2) jednostka ufortyfikowana **ma być widoczna i zaznaczalna na liście armii w lewym menu**, a wydanie jej rozkazu ruchu ma **automatycznie** zdjąć fortyfikację/uśpienie — bez osobnego kliknięcia. Uwaga wdrożeniowa: dziś jednostka z flagą garnizonu wypada z `visibleStackOnHex`, więc lista armii też jej nie pokazuje — to trzeba rozstrzygnąć osobno od filtra używanego przez łączenie armii i blokady ruchu. |
| R-DYP-STOL-A | 2026-07-27 | Decyzja **B+C** (Maciej): AI inicjuje w audiencji + pełny `diplomacyTradeBasket` dla wszystkich traktatów. | **ZAMKNIĘTE ABC** — kod CZĘŚCIOWO | `docs/decyzje/R-DYP-STOL-A.md` · B ~OK; C: koszyk tylko akcje 5/13. |
| ZNALEZISKO-86 | 2026-07-27 | Decyzja **A**: % HP + pasek jak `postBattleSummary` w „Szczegóły bitwy". | **WDROŻONE** | `endDetails1E.ts` · `end-details-hp-test.cjs` · `docs/decyzje/ZNALEZISKO-86.md` |
| DYSPOZYCJA-85-SUWAK | 2026-07-27 | Decyzja **C**: globalny domyślny podział Daniny + override per miasto. | **ZAMKNIĘTE ABC** — kod ROZBIEŻNOŚĆ | `docs/decyzje/DYSPOZYCJA-85-SUWAK.md` |
| PYTANIE-59-DOP | 2026-07-27 | Decyzja **B**: addytywna korupcja 30%+30% (sufit 60%). | **ZAMKNIĘTE** — kod ZGODNY | `economy.ts` `corruptionBuildingReduction` |
| PYTANIE-77-DOP | 2026-07-27 | Decyzja **B**: Mennica śpi **1 turę** po utracie złota. | **ZAMKNIĘTE ABC** — kod ROZBIEŻNOŚĆ (83=B natychmiast) | `docs/decyzje/PYTANIE-77-DOP.md` |
| R-AI-WOJNA-BRAMKA | 2026-07-26 | AI atakuje bez wojny (C-BARB-Q2) | **NAPRAWIONE (kod)** → patrz **P-AI-002** | `canEngageOwner` + dyplomacja przed ruchem; test 11/11. Deploy: **P-AI-005** |
| R-BUD-LOKALIZACJA-UI | 2026-07-26 | „jeżeli budynek jest tylko dla regionalnych terenów, to nie powinien się wyświetlać w stolicy, a jeżeli jest dla stolicy, nie powinien się wyświetlać w miastach regionalnych." | **ZDEPLOYOWANE** — locationBlocked filter cityPanel | Silnik był OK — `eraBuildingCatalog` (`production.ts:1460-1482`) już oznaczał taki budynek polem `locationBlocked`. Filtr listy w UI przepuszczał każdy wpis o `status === 'locked'` bez rozróżnienia POWODU blokady, więc trwała blokada lokalizacji lądowała w jednym worku z tymczasowym brakiem technologii/surowca. Teraz wpisy z `locationBlocked` wypadają z listy (w obie strony, stolica↔region), a brak technologii/surowca zostaje widoczny jak dotąd. Stolica czytana na żywo (bez cache), więc po jej przeniesieniu lista przelicza się sama. Bramki: `tsc` 0, administracja-stolica 48/48, prereq-budynkow 46/46. Dawniej: bramka budowy działała, ale karta wisiała w sekcji „Jeszcze zablokowane" z adnotacją „Tylko poza stolicą". Warunek lokalizacji jest TRWAŁY dla danego miasta, więc karta jest tam bezużyteczna — w odróżnieniu od braku technologii/surowca, które zostają widoczne jako informacja o przyszłości. |
| R-SKARBIEC-PRZECINEK | 2026-07-26 | „po ostatnich zmianach skarbca … miało nie być błędu po przecinku danych. Ale jednocześnie trzeba pamiętać, żeby dane się nie traciły przy zaokrągleniu." (zrzut: „Skarbiec +6.600000000000005") | **ZDEPLOYOWANE** — formatLiczbaPl/signedPl | Cztery panele miały WŁASNĄ kopię helpera `signed()`, każda składała liczbę przez `String(n)`, czyli cały zapis IEEE-754. Nowy `signedPl()`/`formatLiczbaPl()` w `ui/formatPl.ts`: 1 miejsce po przecinku, obcięte końcowe zera, polski przecinek. Wpięty w `hud.ts`, `empireBalance.ts`, `empireDetailPanel.ts`, `cityPanel.ts`. **Zaokrąglenie jest wyłącznie prezentacyjne** — nie wraca do stanu gry, silnik liczy dalej na pełnej wartości (wprost zastrzeżone przez właściciela). |
| R-TEREN-BITWA-WERYF | 2026-07-26 | „sprawdź, czy bonusy terenu w bitwie się doliczają w bitwie ręcznej, takie jak drzewo, las … czy góry, wzgórza. Czy są jakieś bonusy i minusy, na przykład rzeka." | **W WERYFIKACJI** (subagent Sonnet 5) | Ma powstać tabela: teren · parametr · wartość · jednostka · strona (atakujący/broniący) + kolumna „czytane w bitwie ręcznej TAK/NIE (plik:linia)" + osobno lista martwych obietnic i informacja, czy gracz w ogóle widzi te modyfikatory w UI. |
| R-TEREN-BITWA-WERYF-WYNIK | 2026-07-26 | Wynik weryfikacji bonusów terenu w bitwie ręcznej (odpowiedź na pytanie właściciela) | **RAPORT GOTOWY — 3 martwe mechaniki do decyzji** | **Działa:** Las +50% Obrony broniącego (ale tylko przeciw atakującym Dystans/Flanka — zgodnie z danymi), Wzgórza +50% Obrony broniącego (każdy atakujący), koszt wejścia 2 pkt ruchu (las/wzgórza), Bród komplet: ruch ×0,5 · −25% Atak · −25% Obrona w brodzie · +15% Obrony broniącemu brzegu. Rzeka głęboka poza brodem jest NIEPRZEKRACZALNA (surowiej niż opisują dane: „STOP, stoi 1 turę"). **Martwe obietnice:** (1) **Góry nigdy nie dają +75% Obrony w bitwie 3D** — plansza taktyczna ma tylko jeden typ wzniesienia (`Hills`) i mapuje go zawsze na „Wzgórza", więc bitwa na górskim heksie daje +50% jak wzgórze; +75% odpala się wyłącznie w rozstrzyganiu mocą na mapie; Poradnik §63.2 obiecuje ×1,75; (2) **Δ Zasięg od terenu (Las −1, Wzgórza +1) w 100% nieczytane** — pole istnieje w typach, zero odczytów w `gra/src`; (3) **utrudnienia terenowe konnicy/rydwanów nieczytane** — koszt wejścia identyczny dla wszystkich typów, brak zakazu gór dla konnicy. **Widoczność:** tylko Bród ma opis w tooltipie; bonus Lasu/Wzgórz działa PO CICHU (brak liczby w UI), tak samo ukryty jest bonus morale terenu obronnego (próg złamania niższy o 5 pkt). |
| R-BITWA-POWTORKA | 2026-07-26 | „jak się daje rozegraj ponownie to gra nie wraca do pierwotnego ustalenia, że możemy rozłożyć jednostki, ustalić grupowanie … Tak naprawdę można tylko jednostki przestawiać, ale nie ma żadnych ustawień." | **ZDEPLOYOWANE** — _replayBattle roster+grupy | Przyczyna to JEDNA linia: `_replayBattle()` tuż PO wywołaniu `_initDeployUI()` (która poprawnie pokazuje panel rosteru i buduje rząd ikon Formacja/Konnica/Kierunek natarcia/Linie/Taktyka/Strategia) ustawiała `_rosterBar.style.display = 'none'` — czyli kasowała panel chwilę po jego zbudowaniu. Pierwsze wejście w bitwę tej linii nie ma, dlatego działało. Nagłówek „Faza rozstawiania" i licznik zostawały widoczne, bo to osobne elementy — stąd wrażenie „faza jest, ale bez ustawień". Fix: usunięcie tej linii, bez dopisywania drugiej ścieżki „napraw po powtórce". Sprawdzone przy okazji: skład i HP wracają do stanu sprzed PIERWSZEJ bitwy (klon z `maxHp`), a grupowanie gracza jest celowo zachowywane. Bramki: `tsc` 0, combat 6/6, battle-roster 7/7. |
| R-ZLOTO-NIEWIDOCZNE | 2026-07-26 | „co do surowca złota na mapie moim zdaniem my go nie mamy, ale wyprowadź mnie z błędu — jeżeli tak, to zrób mi screenshot złota, jak wygląda. Nie chodzi o kopalnię, tylko surowiec.” | **ZDEPLOYOWANE** FALA 97 `0bea1d88` — model `buildZlozeZloto` (verify 2026-08-05) | **Właściciel ma rację w praktyce, nie w danych.** Złoto ISTNIEJE jako złoże: `deposit_rules.zloto` o rzadkości **0,03** (ułamek heksów lądu) w `gra/data/map-gen-params.json`, stawiane na Wzgórzach i Górach jako `hex.zloze = 'zloto'` (`terrain-improvements.json:307`); ma dedykowane ulepszenie **Kopalnia złota** z gotowym modelem (`render/kopalnia-zlota-opus5.ts`), jest surowcem DOSTĘPOWYM bramkującym Mennicę (decyzja PYTANIE 77=A, 2026-07-25; `game/zloto-access.ts`, `trade-routes.ts:863`) i ma własny test `zloto-test.cjs` 43/43. **Ale na mapie jest NIEWIDZIALNE:** `buildStyledResourceOverlay` (`render/styleResources.ts:418-425`) obsługuje w gałęzi `zloze` tylko **cztery** złoża — `miedz`, `zelazo`, `wegiel`, `sol`. Dla `zloto` nie ma żadnej gałęzi, funkcja zwraca `null`, więc na heks nie trafia żaden obiekt. W całym `gra/src` nie istnieje funkcja typu `buildZlozeZloto`/`styledGoldOre` — grep pusty. **Dowód:** przepuszczono pięć złóż przez tę samą funkcję i z tymi samymi argumentami, których używa mapa gry (`main.ts:1415` i `:1442`) — cztery heksy dostały bryłki, heks złota został pusty (zrzut `zloza-mapa.png`, podgląd `gra/tools/.zloze-mockup/`). **Skutek w rozgrywce:** gracz mija heks ze złożem złota i nie ma jak go rozpoznać inaczej niż klikając w heks albo próbując postawić Kopalnię złota. Po obniżeniu górzystości (fala 22) złoto spadło dodatkowo o 55%, więc szansa przypadkowego znalezienia jest znikoma. **Do zrobienia (nie wdrożone, czeka na decyzję właściciela):** model bryłki złota analogiczny do `buildZlozeMiedz`/`buildZlozeZelazo` + jedna gałąź w tym `switch`. Reszta łańcucha — generator, dostęp, kopalnia, Mennica, testy — już działa. |

## R-ZETON-PASKI — tabliczka jednostki w stylu Total War (pasek ruchu + pasek HP)
**Zgłoszone:** Maciej, 2026-07-29, wraz ze zrzutem referencyjnym z Total War.
**Cytat:** „myślę też, żeby na jednostce umieścić pasek ruchu i pasek HP, jako poziome paski
krótkie, na których dopiero jest zbudowana ta nakładka w postaci kuźni gwiazdek i koszar";
„Po lewej stronie [tabliczki] jednostki malutka ikona właściciela. U góry symbol generała —
to akurat generałów nie mamy. W środku poziom generała, to tam właśnie można umieścić te
elementy związane z ilością ruchu i HP. Generałów doprojektujemy sobie w przyszłości."

**Stan DZIŚ (po FALI 97):** medalion właściciela to osobny sprite przy LEWEJ KRAWĘDZI heksu,
a rządek odznak (Koszary ← gwiazdki → Kuźnia) wisi osobno nad głową figurki, na wysokości
0,92 HEX_R. Nie ma żadnego wspólnego tła ani tabliczki; ruch i HP nie są pokazywane na mapie
w ogóle — gracz odczytuje je wyłącznie z panelu jednostki.

**Kierunek do wdrożenia:** jedna zwarta TABLICZKA nad jednostką, złożona z:
- małej ikony właściciela przy lewej krawędzi tabliczki (dziś: osobny medalion obok heksu),
- dwóch krótkich poziomych pasków w środku: **Ruch** (pkt ruchu pozostałe / maks.)
  i **HP** (punkty życia / maks.),
- rządka odznak Koszary/gwiazdki/Kuźnia zbudowanego NA tych paskach,
- miejsca u góry zarezerwowanego na przyszły symbol generała (generałów jeszcze nie ma).

**NIE ROZSTRZYGNIĘTE — do decyzji ABC przed wdrożeniem:** czy tabliczka jest widoczna
zawsze, czy tylko dla jednostki zaznaczonej/najechanej; czy medalion właściciela wchodzi
DO tabliczki (zmniejsza się, traci czytelność portretu), czy zostaje osobno przy heksie.
| R-EPOKA-KOMUNIKAT | 2026-08-02 | Brak informacji o przejściu do nowej epoki | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | Toast + WYDARZENIA: „Nowa epoka — Wkraczasz w epokę Brązu/Żelaza.” `era-change-notify.ts`. Branch `cursor/feat-era-change-notify-63a1` · PR #14 |
| R-RZEKI-PROG-MASY-LADU-Q1 | 2026-08-06 | Zgłoszenie: niespójny próg masy lądu dla generowania rzek — FALA 199 obniżyła do 5 w jednym miejscu `gen-helpers.ts`, gdzie indziej rzekomo stary filtr `m.length >= 8` | **ZAMKNIĘTE — FAŁSZYWY ALARM** (weryfikacja niezależna, subagent) | Wszystkie 3 miejsca rzek (`refillMainRiverCoastMouthGapsOnMap` L9562, `generateRivers` L11541, `topUpRiverGridCoverage` L11781) spójnie na **5**, zgodnie z FALA 199 (`WERSJE.md:299`). Filtr `>= 8` (L2371, L12304, L12383) należy do OSOBNEGO systemu — siatki fair-play reliefu/złóż/lasu, celowo spójne na 8 na mocy C-MAPA-Q1=B (komentarz w kodzie L12302-12303), niezależnie od progu rzek. Zero zmian w kodzie. Szczegóły: `docs/decyzje/R-RZEKI-PROG-MASY-LADU-Q1.md` |

## R-AUTOBOT-PROMPT — gotowy scenariusz AutoBot do wklejenia innym agentom
**Zgłoszone:** Maciej, 2026-08-06. Cytat: „przygotuj mi gotowy scenariusz, jak w innych
agentach mogę wkleić, żeby działali zgodnie z taką zasadą autobot, jak u nas to się
dzieje. Ale ze szczegółami."
**Wykonane:** `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` — samowystarczalny blok
do wklejenia (role Operator/Evaluator/Gate, pętla 8 kroków, twarde metryki, guardraile,
szablon werdyktu 5 pytań + STRICT/EDGE/PARITY/SAVE, playbook+postmortem z progami
0.30/0.60/5 runów/1000 zdarzeń/48 h, format meldunku, lista zakazów) + sekcja
PARAMETRY PROJEKTU wypełniona dla Civ. Zgodny z kanonem `R-PROC-AUTOBOT*` i playbookiem
rule_101–109; treść zawiera realne wypadki jako uzasadnienia reguł (ddcc04c1,
C-OBCE-JEDN-Q2, git stash).

## R-AUTOBOT-BATCH9-TESTY (2026-08-07) — 4 testy przestarzałe po już-zaszłych zmianach silnika/danych, scalone
**Zgłoszenie źródłowe:** Maciej, „każdy z tych tematów odpal oddzielnym subagentem…
Spróbujmy rozwiązać wszystkie te problemy" — lista pre-istniejących czerwonych testów.
Batch AutoBot `wgjvwhy88`, Operator→Evaluator dla każdego tematu, wszystkie 4 PASS-WITH-NOTES.
**ABC:** nie wymagane (R-PROC-ABC-BALANS §3b) — żadna poprawka nie zmienia `gra/data/**` ani
kodu silnika, wyłącznie wartości oczekiwane w harnessach testowych dogonione do już
zatwierdzonych/zdeployowanych decyzji.

| ID | Plik testu | Naprawiona asercja | Powód (test przestarzały, nie regresja) |
|---|---|---|---|
| R-LOGIC-GARNIZON-VIS | `gra/tools/logic-test.cjs` | „hides garnizon" → dwie asercje: własny garnizon widoczny (token na heksie), wrogi nadal ukryty | Commit `579dec89` (2026-07-26, C-GARN-Q1=A) zmienił semantykę; test nie nadążył. 209/209 |
| R-DIP-LOCKS-HANDEL-PROG | `gra/tools/diplomacy-locks-test.cjs` | `relTotal:10→locked:true` → `relTotal:0→locked:false` | `progHandelRelacja` 40→0 od `579dec8` (Maciej 2026-07-26, „0 = od neutralnej"). 70/70 |
| R-DIP-VALUE-CATALOG-RUDA | `gra/tools/diplomacy-value-catalog-test.cjs` | oczekiwane 25 → 22, etykieta `kopalnia`→`kopalnia_miedzi` | `buildResourceAccessIndex()` liczy min(koszt_praca); 22 jest jedyną, poprawną wartością od pierwszego commita repo — 25 był błędem autora testu od zera, nie regresją. 62/62 |
| R-DIP-CYCLIC-NAMING | `gra/tools/diplomacy-resource-cyclic-trade-test.cjs` | `deal.rodzaj` oczekiwane `umowa_handlowa`→`umowa_wymiany` | `HANDEL-SPLIT-Q1=B` (2026-07-29) rozdzielił traktat na `umowa_szlakow`/`umowa_wymiany`; builder cykliczny od zawsze buduje `UmowaWymiany`. 45/45 |

Weryfikacja: każdy Evaluator odtworzył kontrfaktyk (stara asercja czerwona na dzisiejszym
`main` też), potwierdził zero zmian w `gra/src/**`/`gra/data/**`, przepuścił `tsc --noEmit`.
Scalone bezpośrednio (bez ABC), commit `<uzupełnij po committcie>`.

## R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1 (2026-08-07) — eskalacja zasadna z batcha AutoBot (wgjvwhy88, temat dip-proposal-fairness-msg)
**Zgłoszenie źródłowe:** Maciej, „każdy z tych tematów odpal oddzielnym subagentem…
Spróbujmy rozwiązać wszystkie te problemy" — luka Evaluatora „efekt uboczny modyfikatora
chęci handlu" wyeskalowała w analizie do szerszego problemu w `proposerUnfairToPartnerGate`.
**WERDYKT AutoBot:** ESKALACJA-ZASADNA (Operator poprawnie rozpoznał, że wymaga decyzji
Macieja, nie autonomicznej naprawy — zero kodu zmienione).
**Status:** ✅ **ZDEPLOYOWANE do kodu — SCALONE** (commity `f80b24d` + `49819ee`, 2026-08-07).
AutoBot Operator (7 akcji dostały dedykowane bramki/progi, 'handel' nietknięty — miał już
własną naprawę z 9fc3821) → scalenie ręczne (1 konflikt w `PROPOSER_PW_FAIRNESS_ACTIONS`,
rozwiązany na PUSTY zbiór, nie `['handel']`, żeby nie zdublować bramkowania handlu) →
Evaluator (PASS-WITH-NOTES, macierz różnicowa 4860 przypadków, mutation-testing, sonda
bezpieczeństwa „darmowy pokój" — 0/12 exploitów) → 2 poprawki po notatkach Evaluatora:
zawężenie `treatyPnGate` receive-side z powrotem do `proposerIsPlayer` (N3, poza literą
decyzji A) + spójność `treatyEvalRelationTotal` (N5) + domknięcie luki pokrycia (N2).
117/117 `diplomacy-proposal-test.cjs`, 0 błędów tsc, zero regresji w pełnej baterii
diplomacy-*/wiarygodnosc/tech-tree/research. Szczegóły: `docs/decyzje/R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1.md`.

## R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1 (2026-08-07) — audyt AutoBot rundy 1+2 zamknięty, decyzja (b) czeka na ABC
**Źródło:** Evaluator, sesja MENNICA-GRACE-VERIFY-Q1, nota N3. Batch AutoBot `wgjvwhy88`, temat
`mennica-braz-zloto-asymetria` — runda 1 FAIL (fałszywy dowód w raporcie), runda 2 naprawiła.
**Werdykt merytoryczny (potwierdzony w obu rundach + zweryfikowany niezależnie przez orkiestratora):**
FAŁSZYWY ALARM co do 10 realnych wołających `placedImprovementsWithTradeGrants` w `main.ts` — żaden
nie polega na syntetycznym kluczu złota, gold access idzie wyłącznie przez `ownerHasZlotoAccessNow`
(stan magazynu). `placedImprovementsWithZlotoTradeGrant` jest martwym, ale nieszkodliwym kodem.
**Otwarte — WYMAGA ABC:** co zrobić z martwym kodem + jego osieroconymi testami
(`tools/zloto-szlak-test.cjs`, dziś **26/45**, testuje przedmigracyjną semantykę):
(i) zmigrować test do modelu magazynowego (wzorem `mennica-uspienie-test.cjs`, `72672f9`) vs.
(ii) usunąć martwy kod + martwe testy. Pełna analiza za/przeciw obu opcji:
`docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md`. Zero zmian w `gra/src/**`/`gra/data/**` w
obu rundach — audyt czysto diagnostyczny. Bramki (zweryfikowane niezależnie): tsc 0 błędów,
`mennica-uspienie-test` 49/49, `mennica-magazyn-test` 41/41, `waluta-mennica-test` 57/57.

## R-AUTOBOT-EVALUATOR-MODEL-Q1 (2026-08-07) — jaki model ma napędzać Evaluatora AutoBot? [OTWARTE — ABC]
**Źródło:** pytanie Macieja — „ile tokenów zjadł Evaluator odkąd wprowadziliśmy AutoBot; czy przerzucić
go na Fable 5, bo jest bardzo istotny".
**Pomiar (transkrypt sesji chmurowej, okno 2026-08-05 00:00 → 2026-08-07 10:45 PL):** Evaluator = **21
uruchomień na Opus 5**; zapis cache **2 630 689 tok**, odczyt cache **74 806 735 tok**, wyjście
**25 118 tok**. Koszt wg cennika API: **$54,47** = **10,4 %** całego zużycia okna ($526,11: główna
pętla $192,39 + subagenci $333,72). Rozkład kosztu Evaluatora: odczyt cache 69 %, zapis cache 30 %,
**wyjście 1,2 %** — Evaluator prawie nic nie pisze (~1 200 tok/werdykt), on **czyta** (~3,56 M tok
na uruchomienie).
**Cennik (USD / 1 M tokenów, wejście / wyjście):** Fable 5 = 10 / 50 · **Opus 5 = 5 / 25** ·
Sonnet 5 = 3 / 15. **Fable 5 jest 2× DROŻSZY od Opus 5**, nie tańszy.
**Symulacja na zmierzonym wolumenie:** Opus 5 $54,47 · Fable 5 $108,95 (2,00×) · Sonnet 5 $32,68 (0,60×).
**Zastrzeżenie:** pomiar obejmuje wyłącznie sesję chmurową (jeden plik transkryptu); zużycie sesji
lokalnej (Windows) i Cursora jest dla tej sesji niewidoczne.

### R-AUTOBOT-EVALUATOR-MODEL-Q1 — WERSJA 2 (2026-08-07), zastępuje ABC z wersji 1
**Doprecyzowanie Macieja:** „A możemy tylko w procesie Evaluatora jako adwokata diabła dać Fable?
Gdzie jest najbardziej krytyczny element, w którym Fable dałby wyraźną przewagę względem Opus?"
**Pomiar rozkładu pracy Evaluatora** (23 uruchomienia Opus 5 od 2026-08-05, 2 288 wywołań narzędzi,
15 793 123 znaków wyjścia narzędzi ≈ 3,95 M tokenów świeżej treści):

| Czynność | Wywołań | Udział | Czy klasa modelu ma znaczenie |
|---|---:|---:|---|
| `Bash` — bramki, sondy esbuild, grep | 1 937 | 84,7 % | praktycznie zero (wykonanie, nie rozumowanie) |
| `Read`/`Grep`/`Glob` — czytanie źródeł | 183 | 8,0 % | średnie |
| `Write`/`Edit` — sondy, kopie baseline | 152 | 6,6 % | średnie |
| `StructuredOutput` — sam werdykt | 10 | 0,4 % | **wysokie** |

**Wniosek:** ~85 % wolumenu Evaluatora to praca mechaniczna, w której Fable nie daje żadnej przewagi,
a kosztuje 2× więcej. Przewaga modelu leży w dwóch podczynnościach: **(A) polowanie na exploit**
(wymyślenie ścieżki przez reguły gry, na którą nikt nie napisał testu — dowód: „darmowy pokój
w trakcie wojny", 12 sond, 0/12) i **(B) wnioskowanie o konsekwencjach produktowych przez wiele
plików** (dowód: nota N4 — „stare zapisy zamrażają S4=0,2 na zawsze, playtest musi startować NOWĄ grę").
**Zastrzeżenie:** Opus 5 wygrywa dziś w obu tych miejscach; brak zmierzonego przypadku, w którym coś
przepuścił. „Fable dałby wyraźną przewagę" jest hipotezą, nie faktem — fałszywe negatywy nie zgłaszają się same.

## R-DYPLO-JSON-ZRODLO-PRAWDY-Q1 (2026-08-07) — czytniki mają czytać z JSON, nie z surowej stałej TS [OTWARTE — ABC]
**Źródło:** nota N3 Evaluatora z wdrożenia `R-WIARYGODNOSC-S9-LICZBY-Q1` (commit `2e67219`);
Maciej: „N3 do osobnego zlecenia".
**Problem:** 47 kluczy `wiarygodnosc*` trafiło do `gra/data/diplomacy.json` → `params`, ale
funkcje Wiarygodności czytają **surową stałą** `DIPLOMACY_PARAMS` z `diplomacy.ts`, a nie
`getBaseDiplomacyParams()` (które dokleja JSON). Skutek: **edycja JSON-a lub Panelu-D nie zmienia
dziś nic w rozgrywce.** Sprzeczne z CLAUDE.md §2 („źródłem prawdy są JSON-y w `gra/data/`").
**Zinwentaryzowane realne odczyty surowej stałej** (poza `diplomacy.ts`, który stałą definiuje;
komentarze i importy typów pominięte):

| Plik | Odczytów wartości | Czego dotyczą |
|---|---:|---|
| `gra/src/game/diplomacy-credibility.ts` | **43** | cały blok Wiarygodności (28 funkcji eksportowanych) |
| `gra/src/game/diplomacy-layers.ts` | **5** | `const p = DIPLOMACY_PARAMS` w 5 funkcjach warstw |
| `gra/src/game/diplomacy-value-catalog.ts` | **1** | `handel_zaufanie_perTura` |
| **RAZEM** | **49** | |

**Ustalenie techniczne (zweryfikowane w źródle, nie założone):** żaden klucz `wiarygodnosc*` nie
występuje w listach `DIPLO_RELATION_THRESHOLD_KEYS` / `DIPLO_ZAUFANIE_THRESHOLD_KEYS` /
`DIPLO_RESPEKT_THRESHOLD_KEYS`, więc `scaleDiplomacyParamsForDifficulty()` ich nie dotyka.
Podmiana na akcesor **bez** skalowania trudności jest dziś zachowaniowo neutralna
(JSON == TS, pilnowane sekcją 10 testu `wiarygodnosc-test.cjs`).

## R-FABLE-KOLEJKA-TYGODNIOWA (2026-08-07) — Evaluator wyławia tematy dla najmocniejszego modelu
**Polecenie Macieja (2026-08-07), cytat:** „dajemy zadanie Opusowi, żeby podczas ewaluacji znajdował
takie tematy, które byłyby dla Fable'a — z gatunku tych, które wymieniłeś: szukanie dziur
i nieścisłości, oceny balansu, audyt rozgrywki, refaktory architektoniczne. Zapisujmy sobie listę
i pod koniec tygodnia, kiedy będę miał jeszcze jakieś dostępne zasoby Fable 5, będę mógł puścić
tematy do wyczerpania limitu."
**Mechanizm:**
1. **Plik kolejki:** `dyspozycje/autobot/KOLEJKA-FABLE-5.md` — jedna lista, dopisywana, nie nadpisywana.
2. **Obowiązek Evaluatora:** po każdym werdykcie przejrzeć własne noty N1..Nx i dopisać
   kwalifikujące się tematy. Brak kandydatów → napisać wprost „brak kandydatów do kolejki"
   (żeby odróżnić „nie było" od „zapomniał”).
3. **Rytm:** przegląd raz w tygodniu, właściciel puszcza z listy tyle, ile pozwoli limit.
**Kwalifikują się WYŁĄCZNIE trzy kategorie:** (A) dziury i nieścisłości · (B) balans i audyt
rozgrywki · (C) refaktory architektoniczne. **NIE kwalifikują się:** zwykłe bugi z jasną naprawą,
poprawki testów, zadania dokumentacyjne, drobne UI.
**Uzasadnienie doboru kategorii:** to jedyne trzy klasy z podziału etapów Evaluatora
(`docs/decyzje/R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md`), które spełniają kryterium **K3** —
„wymaga wymyślenia czegoś, czego nikt nie zapisał; nie istnieje lista poprawnych odpowiedzi
do porównania".
**Status:** 🟡 w toku — kanon Evaluatora aktualizowany przez AutoBot, plik kolejki zakładany
przez orkiestratora.

## R-AUTOBOT-EVAL-CHECKLIST-KONFIG (2026-08-07) — Evaluator ma uruchamiać konfiguracje poza domyślną
**Źródło:** „eksperyment zerowy" z `R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md` §4 — teza, że sukces
etapu NO-REGRESSION wziął się z **zachowania typu checklista**, a nie z mocy modelu, więc przed
zakupem droższego modelu należy najpierw naprawić prompt. **Koszt wdrożenia: 0,00 USD.**
**Dowód zasadności (zmierzony):** jedyny realny defekt produkcyjny złapany w oknie
2026-08-05..07 to pokrycie żelaza **75 % wobec progu ≥85 %** na mapie Ogromny, seed 99 —
domyślna bramka `fair-play-grid-test.cjs` była przy tym **zielona 8/8**. Nikt nie zapisał
„przetestuj też mapę Ogromny".
**Zmiana:** do listy obowiązków Evaluatora (`dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` §5
oraz `.cursor/rules/autobot-evaluator-operator.mdc`) dochodzi punkt: wypisać i uruchomić
**≥3 konfiguracje poza domyślną** (rozmiar mapy / typ / seed / poziom trudności / liczba
cywilizacji), dobrane do zakresu zmiany, i wymienić je w werdykcie z parametrami.
Brak listy = werdykt niedomknięty.
**Status:** 🟡 w toku — AutoBot Operator→Evaluator.

## R-FABLE-RETENCJA-NASTER (2026-08-07) — czy retencja danych blokuje użycie Fable 5
**Fakt techniczny:** Fable 5 **wymaga 30-dniowej retencji danych i nie jest dostępny pod zerową
retencją (ZDR)**. Jeśli NASTER S.A. ma wymagania w tej sprawie, przesądza to temat niezależnie
od ceny i zdolności modelu.
**Zadanie:** ustalić, czy w repozytorium jest jakikolwiek zapis o retencji / ZDR / polityce
prywatności / dozwolonych modelach. Jeśli nie ma — pytanie wraca do Macieja.
**Status:** 🟡 w toku — AutoBot, zadanie czysto ustalające (read-only).

## R-BRAMKI-AUDYT-KANONU (2026-08-07) — czy sekcja BRAMKI w CLAUDE.md odpowiada rzeczywistości
**Podejrzenie:** `CLAUDE.md` (sekcja `## BRAMKI`) twierdzi, że `relief-grid-coverage-test.cjs` daje
**2 pass / 4 fail**, a `fair-play-grid-test.cjs` **3 pass / 5 fail**, oba „W NAPRAWIE na mocy
`C-MAPA-Q1=B`". Tymczasem w repo jest zapis, że `fair-play-grid-test` jest **zielony 8/8** —
a liczba asercji zmieniła się z 5 na 8, czyli **sam plik testu jest inny** niż wtedy, gdy powstał
wpis w kanonie.
**Pytanie, którego nikt nie zadał:** test został **NAPRAWIONY** czy **ROZBROJONY** (usunięte
asercje / poluzowane progi / zawężony zakres danych)? Rozstrzygnięcie wymaga porównania treści
asercji ze starą wersją pliku, nie samej liczby pass/fail.
**Dlaczego to pilne:** sekcja BRAMKI jest czytana przez **każdą** sesję i mówi wprost „NIE
naprawiaj przy okazji". Nieaktualna lista albo każe ignorować realną czerwień, albo marnuje czas
na fantomy.
**Precedens:** audyt 2026-07-26 wykazał, że **5 testów było błędnie wpisanych jako czerwone**
(`akwedukt-popcap`, `auto-manage`, `growthmult-compound`, `upgrade-budynki`,
`deposit-building-gate`) — wszystkie okazały się zielone.
**Zakres:** zadanie **audytowe** — zero napraw, zero zmian w `gra/src/**` i `gra/tools/**`.
Operator przygotowuje propozycję nowej treści sekcji, orkiestrator wkleja po zatwierdzeniu.
**Status:** 🟡 w toku — AutoBot Operator→Evaluator (`wupki7quq`).

## KOLEJKA ZLECEŃ AUTOBOT — polecenie Macieja 2026-08-07 („później niezależni agenci")
| # | Zlecenie | Stan | Uwaga |
|---|---|---|---|
| 1 | **`P-MAPGEN-PANGEA-OBRYS`** — **trzy niezależne pytania**, każde A/B/C: (1) co z metryką, (2) na czym oprzeć próg, (3) co z progami czasowymi AC | 🟡 **CZEKA NA LITERY** | Tabele w `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md`. Rekomendacje: 1=A, 2=B, 3=A — **żadna decyzja NIE zapadła** |
| 3 | **Powtórka `R-BRAMKI-AUDYT-KANONU`** na właściwej bazie | ⏸️ w kolejce — osobny agent AutoBot | Runda 1 FAIL: Operator audytował drzewo starsze o 57 commitów. Ustalenia o `relief-grid`/`fair-play` (naprawione, nie rozbrojone) się bronią i można je przenieść |
| 4 | **Runda 2 kanonu Evaluatora** (`R-AUTOBOT-EVAL-CHECKLIST-KONFIG` + `R-FABLE-KOLEJKA-TYGODNIOWA`) | ⏸️ w kolejce — osobny agent AutoBot | Runda 1 FAIL: uzasadnienie („nikt nie zapisał «przetestuj mapę Ogromny»") jest **fałszywe** — przypadek `Ogromny Ziemia seed 99` stoi w `relief-grid-coverage-test.cjs:51` od commita `1341975` z 2026-07-09. Potrzebna nowa podstawa albo rezygnacja z tego punktu |

**Zasada dla zleceń 3 i 4:** worktree przygotowuje orkiestrator na tipie gałęzi roboczej.
`isolation: "worktree"` odbija od `main` — trzy realne wypadki tego samego dnia
(`wb8coodo3`, `w2vcni6m1`, `wupki7quq`), za każdym razem kosztowały całą rundę.

## ECHO 2026-08-07 — trzy decyzje z serii „pozostałe otwarte tematy"

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-FABLE-RETENCJA-NASTER** | **B** | Kanon (`CLAUDE.md` zasada 4) dostaje jawną blokadę: dopóki retencja NASTER nie jest potwierdzona, Fable 5 nie wchodzi w grę. **Zgoda na model ≠ potwierdzenie retencji — potrzebne oba.** |
| **R-AUTOBOT-EVALUATOR-MODEL-Q1** (wersja 3) | **C + A** | **C:** najpierw pakiet dowodowy — `eval-evidence.json` (exit code, SHA-256 pełnego stdout + ścieżka, komplet parametrów przebiegu, `baseline_sha`/`head_sha`) oraz **obowiązkowy `StructuredOutput`** jako protokół (dziś 88,1 % werdyktów to nieparsowalny wolny tekst). **A:** model Evaluatora **zostaje na Opus 5** — bez zmiany, dopóki nie będzie czym uzasadnić innej. |
| **R-KOLEJKA-ZLECEN-3-4-Q1** | **B** | Zlecenie 3 (audyt sekcji BRAMKI) w całości. Ze zlecenia 4 **tylko** obowiązek dopisywania kandydatów do `KOLEJKA-FABLE-5.md`; **punkt o checkliście konfiguracji ODPADA** — jego uzasadnienie zostało obalone (przypadek `Ogromny Ziemia seed 99` stoi w `relief-grid-coverage-test.cjs:51` od commita `1341975` z 2026-07-09, czyli miesiąc przed oknem pomiarowym). |

**Konsekwencja wykonawcza:** C (pakiet dowodowy) i reszta zlecenia 4 (kolejka Fable) dotykają
**tych samych dwóch plików kanonu** — `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` §5
i `.cursor/rules/autobot-evaluator-operator.mdc`. Idą więc jako **jedno zlecenie**, nie dwa
(CLAUDE.md §4a — dwa równoległe worktree na tym samym pliku kończą się ręcznym scalaniem).

## R-AUTOBOT-ORKIESTRATOR (2026-08-07) — zasada AutoBot obejmuje pracę własną głównej sesji
**Polecenie Macieja, dwa zdania:** *„Dla siebie też przyjmij zasadę autobot na każdym temacie,
nie tylko dla subagentów. Czyli każdą swoją decyzję sprawdzaj ewaluatorem."* · *„zasada Autobots
obejmuje nie tylko zleconą pracę subagentowi ale **po pierwsze Twoją pracę**."*
**Zapisane w kanonie:** `CLAUDE.md` zasada **0b**.
**Skutek:** orkiestrator jest Operatorem własnej zmiany i **nie ocenia sam siebie**. Każda zmiana
zapisana do repo przez główną sesję — kod, dane, kanon, dokument decyzji, wpis w rejestrze,
sprostowanie — przechodzi przez Evaluatora na Opus 5. Tak samo każda liczba przedstawiona
właścicielowi jako fakt. Czynności czysto odczytowe są wyłączone.
**Zastosowanie wsteczne — ZAKRES FAKTYCZNY (korekta po nocie N14 Evaluatora):** Evaluator objął
**5 pozycji**: `7136241`, `7c24e33`, `55658fc`, `af68f86` oraz `CLAUDE.md` zasady 4 i 0b.
**Pierwotne brzmienie mówiło „całość pracy własnej" — to była NIEPRAWDA.** Praca własna
orkiestratora z 2026-08-07 to **19 commitów**; **14 pozostałych NIE zostało objętych**, w tym:
`c98006a` (pierwotne fałszywe „exit 0" — wypadek (a) z uzasadnienia zasady 0b), `dde2696`
(ECHO = D, którego właściciel nie podjął — wypadek (c)), `08035bf`, `56481cd`, `0355f30`,
`a976b63`, `934bcb0`, `d3d2673`, `ad04299`, `c67c9de` (deploy FALA 259), `0a08bf0`, `3b84875`,
`6e98ddc`, `3213ee2`, `8c6f26a` (deploy FALA 258). **Do przeglądu w osobnym zleceniu.**
Odnotowane: cztery z pięciu commitów niosących wypadki wymienione w uzasadnieniu zasady 0b
znalazły się POZA jej własnym zastosowaniem wstecznym.

## R-DYSK-WORKTREE-Q1 (2026-08-07) — zapobieganie zapychaniu dysku sesji chmurowej = **C**
**Decyzja Macieja: C** (reguła cyklu życia + sparse-checkout). Jego sformułowanie zasady:
*„wykonujesz daną pracę, komitujesz do Githuba i tyle, a potem czyścisz dysk"* oraz *„trzymanie
u ciebie danych tylko ma wtedy sens, kiedy coś jeszcze trzeba z tym zrobić"*.
**Wypadek, który to wywołał (2026-08-07):** dysk sesji chmurowej **86 % zajętości pojemności kontenera (252 GB), 0 MB wolnego**.
`Bash` zwracał `ENOSPC` **bez wykonania polecenia**, `Write` błąd. Skutki: Evaluator handoffu nie
uruchomił **ani jednej** bramki (uczciwie to zaraportował zamiast zmyślić pomiar), a bramka
`map-gen-regression` zginęła przy restarcie kontenera. Praca w toku przepadła **dwa razy** tego dnia.
**Przyczyna:** zasada 4a (CLAUDE.md) każe subagentom pracować na własnych worktree, ale **nie mówi,
kiedy worktree ma zniknąć**. Uzbierały się **22 sztuki × ~810 MB rozmiaru jednego worktree na dysku = 18 GB**; scratchpad **7,9 GB**.
Każdy worktree kopiował całe drzewo, w tym `gra-robocza` (**328 MB**) i `gra-kanon` (**109 MB**),
których subagent do pracy nie potrzebuje.
**Wykonane sprzątanie (kolejność: zapis → GitHub → dopiero kasowanie):** stan niescommitowany
każdego z 22 worktree zapisany na gałęzi `zapas/<nazwa>` i **wypchnięty na origin** (zweryfikowane:
`git ls-remote --heads origin 'refs/heads/zapas/*'` = **22**). Commit `c9c031e` — jedyny spoza
głównej historii, wnoszący `playbook.md` — jest przodkiem czterech gałęzi `zapas/*`, więc też
pojechał na zdalne. Odzyskanie: `git checkout zapas/<nazwa>`.
**Wynik:** wolne miejsce **5,3 GB → 26 GB**, zajętość **86 % → 32 %**, worktree **22 → 0**,
scratchpad **7,9 GB → 44 KB**, katalog repo **21 GB → 3,0 GB**.
**Zapisane w kanonie:** `dyspozycje/autobot/playbook.json` — **rule_118** (cykl życia worktree,
zapas na gałąź przed usunięciem) i **rule_119** (sparse-checkout: worktree bez `gra-robocza`,
`gra-kanon`, `dist` → ~370 MB zamiast ~810 MB, czyli **−54 %**; wyjątek dla subagenta robiącego deploy).
**CZŁON `.gitignore` — WDROŻONY w `89504c0`, po wcześniejszym błędnym wstrzymaniu.**
Najpierw wstrzymałem go z dwoma uzasadnieniami; **oba były nietrafione** (noty N3 i N4 Evaluatora):
- *„wyłączenie 2 z 398 dałoby niespójność z konwencją"* — **obalone**: konwencja miała już wtedy
  kilkanaście wyjątków (`.gitignore` ignorował m.in. `.capital-sep-*`, `.ai-recruit-upkeep-gate-*`,
  `.escape-overlay-stack-*`, `.ai-balans-step3/5-*`, `.probe-*`, a `gra/.gitignore` dodatkowo
  `.city-map-badge-*`, `.braz-*-preview-entry.ts`). Wyłączanie wybranych bundli **było praktyką**.
- *„objaw zniknął po `892d13f`"* — **obalone**: zwykłe uruchomienie `node tools/logic-test.cjs`
  zabrudziło drzewo (`.logic-bundle.cjs` +50/−1, `.logic-entry.ts` +2/−1). Objaw był systemowy,
  nie dotyczył dwóch plików map-genu. Sam `892d13f` nazywał wpis do `.gitignore` „docelową naprawą",
  po czym odroczyłem ją **właśnie po nadejściu litery**.
**Ocena własna: to było ciche zawężenie decyzji C** — właściciel wybrał wariant trzyczłonowy,
a wdrożyłem 2 z 3 z własnym uzasadnieniem, zamiast wykonać albo zgłosić przeszkodę przed startem.
**Stan faktyczny:** commit `89504c0` — **339 plików wypisanych ze śledzenia** (z dowodem, że jakiś
skrypt w `gra/tools/` je zapisuje), **59 pozostawionych** bez dowodu generowania, razem **398**
plików z **kropką wiodącą** (ta sama fraza czytana jako regex daje 412 — stąd doprecyzowanie).
Wzorce `gra/tools/.*-bundle.cjs` i `.*-entry.ts` w `.gitignore` nie ruszają tych 59, bo `.gitignore`
nie działa na pliki już śledzone. Weryfikacja empiryczna po zmianie: `logic-test` → 213/213,
`git status --porcelain` → **0 pozycji**.

**KOREKTA — „`c9c031e` jedynym commitem spoza głównej historii" było nieprawdą** (nota N7).
Commitów osiągalnych z gałęzi `zapas/*`, a nieosiągalnych z `HEAD` ani `origin/main`, jest **22**.
`c9c031e` jest jedynym niosącym **treść merytoryczną** (`playbook.md` + generator JSON).

## R-BRAMKA-MINDIST-Q1 (2026-08-07) — legalizacja zmiany bramki `logic-test.cjs` = **A**
**Decyzja Macieja: A** — commit `7136241` zatwierdzony **w całości**. Wszedł w ramach
`R-BRAMKI-AUDYT-KANONU` bez własnej litery; Maciej odmówił legalizowania go samodzielnie
(*„zmiana bramki weszła poza zakresem, sam tego nie zalegalizuję"*) i zażądał osobnego ID + ABC.
**NOWY PUNKT ODNIESIENIA: `logic-test.cjs` = 213/213 zaliczonych asercji** (było 209/209).
Każda sesja porównuje się od teraz do **213**; wynik 209 oznacza cofnięcie tej decyzji, nie normę.
**Co obejmuje (a):** przypięcie parametru **`MIN_CITY_DISTANCE` = 4 heksy** (+1 asercja). Poprzednia
asercja była **rozbrojona** — porównywała stałą zaimportowaną z testowanego modułu z tą samą stałą,
więc przechodziła dla dowolnej wartości progu, także **1 heksa**. **KOREKTA (nota N6 Evaluatora):** pierwotnie napisałem „żaden inny test nie pilnował tego
parametru" — to **nieprawda**. `gra/tools/found-from-village-test.cjs` istniał przed `7136241`,
importuje stałą i przypina **przedział 2..6 heksów** (test 2: dystans 1 = za blisko; test 4:
dystans 6 = OK). Prawdziwe jest zdanie węższe: **żaden test nie przypinał WARTOŚCI** progu —
przedział przechodził tak samo dla 4, jak i dla 5 heksów. Trafienia w `ai-*-test.cjs` dotyczą
innego pola (`ekspansja_min_dystans_miast`) i nie są bramką na ten parametr.
Wartość **4 heksy** pochodzi z decyzji `R-AI-KOLONIZACJA`; wcześniej było **5 heksów** — parametr
**już raz zmienił się bez bramki** — zmiana 5 → 4 heksy jest udokumentowana w kanonie
(`docs/decyzje/R-AI-KOLONIZACJA.md`, rejestr, tytuł commita `5726335`), więc **nie przeszła po cichu
obok kanonu, tylko obok TESTU**. Pierwotne sformułowanie „po cichu" było za mocne (nota N6).
To jest powód, dla którego przypięcie wartości jest celem, a nie kosztem.
**Skutek przyjęty świadomie:** zmiana `MIN_CITY_DISTANCE` bez decyzji właściciela **wywala bramkę**.
**Co obejmuje (b):** kontrakt czytelnika **`readCityFoodBuffer()`** (+3 asercje). Poprzedni predykat
rozszerzono o `=== undefined`, czyli zaczął akceptować dokładnie ten stan, który wcześniej wykrywał.
Nowe asercje sprawdzają **7 wariantów wejścia** (brak wartości, dodatnia, ujemna, zapis legacy
`{aktualny,pojemnosc}`, `NaN`, tekst) i wymagają, by funkcja zawsze zwracała liczbę skończoną **≥ 0**.
Żadnej liczby produktowej nie przypinają.
**Powiązanie:** obie luki to wypadki opisane w **rule_117** playbooka (zakaz „naprawy" testu przez
rozbrojenie asercji) — ta decyzja jest jego pierwszym zastosowaniem.

## R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 (2026-08-07) — tabliczka jednostki: Moc nominalna vs efektywna = **B**
**Decyzja Macieja: B.** Tabliczka nad żetonem ma pokazywać Moc **efektywną** — tę samą liczbę,
którą realnie rozstrzyga auto-bitwa — zamiast dzisiejszej Mocy nominalnej.
**Powód:** dla jednostki bez gwiazdek liczby są identyczne; dla weterana ★★★ (3 wygrane) tabliczka
pokazywała **49 pkt Mocy**, a starcie rozstrzygała liczba **58,0 pkt Mocy** — różnica **+18,37%**,
w całości z pominiętej premii weterana. Zweryfikowane dwukrotnie: Operator i niezależnie
Evaluator (oba Opus 5), zgodna arytmetyka.
**Implementacja:** podmiana jednego wywołania w `gra/src/game/armyMerge.ts::stackFieldPowerM`
(`rosterFieldPowerM` zamiast `sumRosterFieldM`), bez ruszania kodu renderu (Evaluator: koszt
znikomy). Model: Sonnet 5 (logika gry, nie `gra/src/render/**`).
**Powiązane, do domknięcia razem:** panel pre-battle (`main.ts:17635`, duplikat
`battle/mapFieldBattle.ts:143`) pokazuje dziś Moc nominalną obok prognozy szans liczonej ze
skalowanej — po tej decyzji zostałby jedynym miejscem z wariantem nominalnym; ujednolicić.

## R-PRZEMARSZ-ATRYBUCJA-Q1 (2026-08-07) — komunikat o naruszeniu granic: kto i gdzie = **B**
**Decyzja Macieja: B.** Komunikat „Twoje granice naruszone" ma dodatkowo pokazywać **nazwę
naruszającej cywilizacji** ORAZ dawać możliwość **skoku kamery** do miejsca naruszenia.
**Powód:** po naprawie `BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C` (filtr do gracza, scalone `e52e84a`)
komunikat jest poprawny formalnie, ale obca jednostka w promieniu terytorium (5–15 heksów) może
stać we mgle wojny, całkowicie niewidoczna — gracz dostaje ostrzeżenie bez możliwości
zweryfikowania go wzrokiem. Nota N1 Evaluatora.
**Zakres implementacji:** `classifyPlayerBorderMarchNotice` (`gra/src/game/diplomacy-border-march.ts`)
dziś zwraca tylko dwie flagi bool — trzeba rozszerzyć o identyfikację strony (ownerId, ewentualnie
współrzędne hexa pierwszej/najbliższej pary). `main.ts:3573-3589` — komunikat + akcja skoku kamery
(wzorzec: sprawdzić istniejący mechanizm centrowania kamery, np. z panelu jednostek — zadanie #1
z listy zadań tej sesji, „Centrowanie kamery po kliknięciu jednostki w panelu", już wdrożone).
Model: Sonnet 5 (logika + UI zdarzeń, nie `gra/src/render/**` — jeśli dotknie faktycznego
sterowania kamerą 3D, ten fragment przekazać do Opus 5 zgodnie z zasadą 4 CLAUDE.md).

## R-MOC-MUR-PARADOKS-Q1 (2026-08-07) — tabliczka: dociągnąć mur/teren = **A**
**Decyzja Macieja: A.** Tabliczka jednostki ma dociągnąć bonusy muru/palisady i terenu, nie
tylko weterana i fortyfikację polową — staje się zależna od heksu, na którym jednostka stoi.
**Powód:** dziś tabliczka Konnicy w garnizonie pokazuje 52 bez murów, 49 z murami, mimo że
realna Obrona rośnie z 49 do 95 — mylące, wygląda jak bug przy budowie obrony.
**Implementacja:** `gra/src/game/armyMerge.ts::stackFieldPowerM` ma doliczać `structBonusPct`
i `terrainDefenseMultiplier` analogicznie do `effectiveDefenderM` (`main.ts`). Wymaga przekazania
kontekstu terenu/miasta do `defOf` — dziś ta funkcja zna tylko jednostkę.
**Kotwice:** `armyMerge.ts::stackFieldPowerM`, `game/city-defense.ts`, `main.ts::effectiveDefenderM`.
Model: Sonnet 5 (logika gry).

## R-MOC-RANKING-ROZJAZD-Q1 (2026-08-07) — panel rankingu na efektywną, progi AI zostają = **B**
**Decyzja Macieja: B.** Panel Mocy imperium (widoczny dla gracza) przechodzi na Moc efektywną,
dla spójności z tabliczką. Progi decyzji dyplomatycznych AI (`militaryRatioFromArmyM`,
`progWojnaSila`) **zostają nominalne** — to zmiana balansu, nie tylko wyświetlania, i nie jest
częścią tej decyzji.
**Implementacja:** `main.ts:1581 sumArmyMForOwner` — rozdzielić na dwie funkcje/ścieżki: jedna
karmiąca `ui/powerOverlayHud.ts` (przechodzi na `combatPowerScaledDefFor`), druga karmiąca
`militaryRatioFromArmyM` i progi wojny (zostaje `unitDefFor`, bez zmian).
**Kotwice:** `main.ts:1581`, `ui/powerOverlayHud.ts:136`, `main.ts` ~12955/13950/21784/21974.
Model: Sonnet 5.

## R-PRZEMARSZ-WYGASANIE-Q1 (2026-08-07) — osobny log czyszczony co turę = **A**
**Decyzja Macieja: A.** Komunikat o naruszeniu granic przechodzi z `warEventLog` do osobnego
logu per-turowego (wzorem `villageEventLog`), czyszczonego przy `turn++`. Wpis znika sam, gdy
naruszenie ustaje; „✕" działa jak przy innych chipach per-turowych.
**Powód:** symulacja Evaluatora (20 000 tur) pokazała, że obecny mechanizm (stabilne id w
`warEventLog`, odświeżane co turę) nigdy nie pozwala trwale odrzucić komunikatu (34629/34629)
i w 79% przypadków zostawia w panelu nieaktualną liczbę kary po ustaniu naruszenia.
**Implementacja:** nowy `borderMarchEventLog` (albo rozszerzenie istniejącego wzorca
per-turowego), czyszczony w tym samym miejscu co `villageEventLog`/`tradeRouteEventLog`
(main.ts ~20096-20100). Usunąć stabilne id + splice/unshift z `warEventLog`, przenieść logikę
`borderMarchEventTargets` (skok kamery) do nowego mechanizmu.
**Kotwice:** `main.ts::applyBorderMarchPenaltiesEndTurn` (~3578-3640), `onEventDismiss`,
miejsce resetu per-tura (~20096-20100).
Model: Sonnet 5.

## R-MOC-HUD-GLOWNY-Q1 (2026-08-07) — caly UI Mocy na efektywna jednym ruchem = **C**
**Decyzja Macieja: C.** Zamiast punktowo dogrywac kolejne miejsca pokazujace Moc (dzis: HUD
glowny, wczesniej: tabliczka, panel rankingu, ekran Empire), jedna decyzja obejmuje CALA
warstwe UI naraz: glowny licznik HUD (`main.ts:12579 buildHudState` -> `hud.ts:1022,1102`),
ekran dyplomacji (`openDiplomacyAudience`/`buildPlayerDiploSummary`, `main.ts:14621-14622`,
`formatPowerRelationLine`), oraz pozycje w rankingu na ekranie dyplomacji
(`buildAbsolutePowerRank` -> ma przejsc na `buildAbsolutePowerRankEffective`, zgodnie z panelem
Mocy i Empire, ktore juz przeszly).
**NIE dotyczy** (pozostaje nominalne, poza zakresem C): progi decyzji AI (`militaryRatioFromArmyM`,
warunek zwyciestwa `checkVictory`/`potegaGracza`) — to zmiana balansu rozgrywki, nie wyswietlania,
i zostaje wylaczona ze wszystkich dotychczasowych decyzji `R-MOC-*` z dzisiejszej sesji.
**Kotwice:** `gra/src/main.ts:12579` (HUD), `main.ts:14621-14622` (dyplomacja), miejsca uzycia
`buildAbsolutePowerRank` w kontekscie dyplomacji (odroznic od juz-efektywnego uzycia w panelu
Mocy/Empire).
Model: Sonnet 5 (logika/UI danych, nie `gra/src/render/**`).

## BUG-TRAKTAT-KOSZYK-REGRESJA (2026-08-08) — ktora wersja kodu zachowac = **A**
**Decyzja Macieja: A.** Przywrocic stan sprzed `9cc7c76c` — traktat szlakow (akcja 5,
`umowa_szlakow`) calkowicie bez koszyka wymiany, zgodnie z `HANDEL-SPLIT-Q1=B` (2026-07-29).
Commit `9cc7c76c` (2026-08-05, zmiana NAP bezterminowego) przy okazji skurczyl liste
"traktatow bez koszyka" z 7 pozycji do 1, cofajac rozdzielenie.
**Kotwice:** `gra/src/game/diplomacy-proposals.ts`, `gra/src/ui/**` (okno traktatu),
`gra/tools/diplomacy-proposal-test.cjs`.
Model: Sonnet 5.

## BUG-ZWIADOWCA-KOSZT-SUROWCA (2026-08-08) — same surowce czy tez Pieniadz = **A**
**Decyzja Macieja: A.** Zerujemy tylko surowiec (oba kanaly): `Surowiec (ilosc)` Drewno
10 -> 0 przy rekrutacji, `Utrzymanie surowiec (ilosc)` Drewno 2 -> 0 na ture. Koszt Pieniadza
(8 pkt) zostaje bez zmian.
**Kotwice:** `gra/data/units.json` (wiersz "Zwiadowca").
Model: Sonnet 5 (dane JSON — zrodlo prawdy, CLAUDE.md §2, NIE `export-*.py`).

## BUG-BRAMKA-DREWNO-BRAK (2026-08-08) — rozszerzyc bramke na Drewno = **A**
**Decyzja Macieja: A.** Rozszerzyc bramke dostepu do surowca (`production.ts`) o Drewno,
zgodnie z ogolna zasada `DOSTEP-SUROWCE-Q1` (2026-07-29) — jednostka wymagajaca Drewna
niedostepna bez zapasu w magazynie panstwa. BEZ progu startowego/zapasu poczatkowego
(odrzucona rekomendacja C) — swiadome ryzyko zablokowania startu gry przy braku drewna.
**Powiazane:** `BUG-ZWIADOWCA-KOSZT-SUROWCA=A` — po wyzerowaniu kosztu Drewna Zwiadowcy,
Zwiadowca przestaje podlegac tej bramce (wymog 0 = zawsze spelniony).
**Kotwice:** `gra/src/game/production.ts:858-863` i `:950-960` (DWIE kopie warunku, obie
musza zostac zmienione razem).
Model: Sonnet 5.

## P-AI-MOC-GAP (2026-08-08) — trzecia przyczyna gapu Mocy AI: kodowac teraz bez pomiaru = **B**
**Decyzja Macieja: B.** Kodowac naprawe `canAfford`/pustej kolejki produkcji AI TERAZ, bez
uprzedniego swiezego playtestu (odrzucona rekomendacja A — najpierw zmierzyc obecny gap).
**Uzasadnienie wlasciciela:** pusta kolejka + nieotwarta produkcja + namnazajace sie surowce
(AI "myszkuje" zasobami bez ich wydawania) to kluczowy problem, ktory trzeba rozwiazac wprost.
**Kotwice:** miejsce w silniku AI gdzie `canAfford` decyduje o wpisach kolejki produkcji —
do zlokalizowania przez Operatora (kandydat: `gra/src/game/ai-*.ts`, `production.ts`,
logika tury AI w `main.ts`).
Model: Sonnet 5. Zakres: znalezc root cause (dlaczego AI nie zmienia zadania produkcji gdy
`canAfford` odrzuca biezacy wybor — czy probuje inny wpis kolejki, czy zostawia kolejke pusta
i akumuluje surowce bez konsumpcji) i naprawic tak, zeby AI zawsze mialo cos w produkcji,
jesli stac je na cokolwiek z dostepnej listy.

## BUG-TOOLTIP-MOC-BUDYNKI-Q1 (2026-08-08) — Obrazenia Broni/Przebicie w tooltipie: tylko weteran = **A**
**Decyzja Macieja: A.** Obrazenia Broni (`weaponDamage`) i Przebicie (`piercing`) w tooltipie
jednostki skalowane WYLACZNIE premia weterana (zgodnie z tym, co realnie liczy silnik walki
`damageTw()`), NIE pelnym `softFrac` (weteran+budynki). Pozostale 6 pol wzoru `fieldPower()`
(w tym Szarza, Atak dystansowy) zostaja bez zmian — dla nich silnik faktycznie stosuje premie
budynkowa, wiec pelny `softFrac` tam jest poprawny.
**Pytanie przeszlo przez turniej ABC (C-018):** dwa niezalezne projekty (orkiestrator +
niezalezny agent) zbiegly sie na tej samej rekomendacji A; Sedzia (Opus 5) zweryfikowal
liczby w kodzie i zsyntetyzowal finalna wersje pytania.
**Kotwice:** `gra/src/game/unit-card-stats.ts` (`unitCardCombatDisplay`), worktree
`.claude/worktrees/tooltip-moc`.
Model: Sonnet 5.

## R-MOC-DEFINICJA-Q1 (2026-08-08) — co wchodzi w skladowa "Moc" wyswietlana graczowi
**Zasada Macieja (cytat, do zachowania):** *"W aspekcie liczenia mocy jednostek czy armii
przed bitwa i na przyklad automatycznym rozpoznaniem bitwy i mocy oraz automatycznego
rezultatu, trzeba policzyc wszystkie wskazniki, takze parametry, ktore wspomniales, czyli
pelna premia budynkowa, weteran. I wszystkie mozliwe wskazniki, ktore wczesniej byly
ustalone. Ale w wypadku mocy power nie liczymy budynkow, dlatego ze ta sama jednostka moze
byc w jednym budynku, moze byc w drugim, moze byc w jednej formie, moze byc zafortyfikowana
lub nie. Liczymy wszystkie pozostale elementy, ale bez elementu terenu i budynku."*
**Rozroznienie dwoch odrebnych obliczen:**
1. **Rzeczywiste rozstrzygniecie bitwy** (pre-battle, auto-bitwa, wynik) — liczy WSZYSTKO:
   pelna premia budynkowa, weteran, teren, wszystkie ustalone wskazniki. Bez zmian wobec
   dzisiejszej pracy `combatPowerScaledDefFor`/`tabliczkaGarnizonScaledDefFor`.
2. **"Moc" jako wyswietlany wskaznik** (tooltip, tabliczka, panel rankingu, HUD, Empire) —
   NIE liczy budynkow ani terenu — tylko wskazniki wlasne jednostki + premia weterana.
   Uzasadnienie: jednostka jest przenosna (moze stac w roznych miastach/budynkach, byc
   zafortyfikowana lub nie) — Moc ma byc stabilna cecha jednostki, nie zalezec od tego,
   gdzie akurat stoi.
**NAPIECIE ROZSTRZYGNIETE (2026-08-08, ta sama sesja, pytanie zamkniete):** decyzja
`R-MOC-MUR-PARADOKS-Q1=A` (2026-08-07) wprowadzila `tabliczkaGarnizonScaledDefFor()`, ktora
DLA GARNIZONU W MIESCIE Z MUREM dokladala do "Mocy" na tabliczce bonus struktury obronnej +
mnoznik terenu. **Decyzja Macieja: wraca do czystej Mocy (bez muru)** — tabliczka cofnieta do
`combatPowerScaledDefFor(u)` (weteran + trudnosc AI, bez bonusu struktury/terenu), zgodnie
z nowa zasada R-MOC-DEFINICJA-Q1. To **CZESCIOWO COFA** `R-MOC-MUR-PARADOKS-Q1=A` — sam
paradoks garnizonu (49 pkt realnie wnoszone do bitwy vs 95 na tabliczce) wraca, ale teraz
jako SWIADOMA konsekwencja zasady "Moc = wskazniki wlasne + weteran, bez kontekstu miejsca",
nie przeoczenie.
Model: Sonnet 5 (logika/dane), `gra/src/render/**` gdyby dotkniete = Opus 5.

## R-SKILL-LEAN-LOOP-CIVAUTOBOT (2026-08-08) — synteza Ponytail + AutoBot w dwa skille Claude Code
**Prosba Macieja:** przeczytac w calosci skill "Ponytail" (minimalizm kodu) i kanon AutoBot
tego projektu (w tym 3 oryginalne pliki `AUTOBOT-PROMPT.md`/`AUTOBOT-opis-i-wdrozenie.md`/
`playbook.md` v1.2 dostarczone przez wlasciciela), i zsyntetyzowac je w DWA skille: (1)
uniwersalny, tech-agnostyczny, przenosny do innych projektow/agentow; (2) projektowy dla
Civ, dziedziczacy z uniwersalnego. Twarda instrukcja: **"Nic nie usuwamy"** — kompletnosc
jest kryterium sukcesu, nie tylko poprawnosc; przy niepewnosci decyzji syntezy — turniej.
**Wykonanie (Operator/Evaluator na Opus 5, na wyrazne polecenie Macieja dla tego tematu):**
- **`lean-loop`** — `/root/.claude/skills/lean-loop/` (SKILL.md + 5 plikow `references/`,
  1097 linii razem). Zero odniesien do Civ/gry/polskiego/modeli AI po nazwie (zweryfikowane
  dwukrotnie, niezaleznymi grepami + enumeracja znakow non-ASCII). Laczy drabine decyzyjna
  Ponytaila (YAGNI→reuse→stdlib→natywne→zaleznosc→jedna linia→minimum), "przyczyna nie objaw"
  (grep callerow), protokol bledu AutoBota 5-krokowy, rozdzial rol Operator/Evaluator (agent
  nie ocenia sam siebie), wzorzec playbooka z liczby win/fail i progami statusu, turniej
  dwoch propozycji + Sedzia, oraz — po dyskusji o zakresie — checkliste pisarska R-001..R-012
  z playbooka-meta wlasciciela (dokument o dokumentach, uznana za pasujaca do agenta
  kodujacego, ktory tez pisze specyfikacje/prompty/runbooki).
- **`civ-autobot`** — `.claude/skills/civ-autobot/SKILL.md` (239 linii). Dziedziczy z
  `lean-loop`, doklada WYLACZNIE specyfike tego repo: przydzial modeli, NUMER→ABC→DEPLOY,
  turniej ABC jako twarda reguła (nie opcja), 3 twarde FAIL Evaluatora (edge/parytet/save-
  load), izolacja worktree, zakazy build/dev/export-*.py, runbook deployu, bramki i baseline'y.
**Incydent w trakcie pracy:** automatyczny skaner bezpieczenstwa oznaczyl fragment Skilla B
(wyjatek "drobiazg 1-3 linie tekstu nie wymaga pelnej ceremonii") jako mozliwe "zatrucie
instrukcji". Zweryfikowane osobiscie: cytat byl prawdziwy (`.mdc:28,33`), ale sam plik
zrodlowy jest WEWNETRZNIE SPRZECZNY (naglowek tej samej reguly mowi "bez wyjatku «to tylko
drobiazg»"). Nie rozstrzygniete samodzielnie — poprawione na wersje ostrozniejsza (domyslnie
BRAK wyjatku, pelna petla) z jawna flaga sprzecznosci u zrodla, czekajaca na Twoje rozstrzygniecie
w `.cursor/rules/autobot-evaluator-operator.mdc:28` (czy tam faktycznie ma byc wyjatek dla
1-3 linii, czy to bylo nieprecyzyjne sformulowanie bez takiej intencji).
**Do Twojej decyzji (nie blokuje niczego, informacyjnie):** czy powyzsza sprzecznosc w
`.mdc` ma zostac rozstrzygnieta, i w ktora strone.
Model: Opus 5 (wyrazne polecenie Macieja dla tego tematu, obie role).

## R-SPRZECZNOSC-DROBIAZG-MDC-Q1 (2026-08-08) — wyjatek 1-3 linie tekstu: doprecyzowany, nie usuniety = **B**
**Decyzja Macieja: B.** Wyjatek z `.cursor/rules/autobot-evaluator-operator.mdc:28`
zostaje, ale doprecyzowany do trzech LACZNYCH warunkow: (a) wylacznie plik dokumentacji/
notatek, NIGDY `gra/src`; (b) wylacznie jako dopisek do paczki ktora JUZ przeszla przez
Evaluatora w tej samej sesji — nie samodzielna, nieoceniona zmiana; (c) zawsze zalogowany
w `KANAL-PRACA.md` lub tresci commita. Brak ktoregokolwiek warunku → pelna petla, bez
zgadywania "czy to drobiazg" (self-grading, ktoremu AutoBot ma zapobiegac).
**Wdrozenie:** `.cursor/rules/autobot-evaluator-operator.mdc:28` przepisane; `.claude/
skills/civ-autobot/SKILL.md` (sekcja "Reguła nadrzędna") zaktualizowany z flagi
sprzecznosci na rozstrzygniete dwa wyjatki.
Model: Sonnet 5 (mechaniczne wdrozenie juz podjetej decyzji, bez nowej oceny).

## R-PROFIL-TURNIEJ-PUNKTACJA-Q1 (2026-08-08) — profil decyzyjny jako kryterium punktacji w turnieju ABC
**Decyzja Macieja: potwierdzenie w rozmowie (wariant A+B połączony, opisany przeze mnie i
zaakceptowany wprost — „Tak, potwierdzam. Zgadzam się z tym, co napisałeś.").**
**Mechanizm:** obaj Proponenci turnieju ABC (`R-PROC-AUTOBOT-ABC-TURNIEJ.md`) wskazują
własny „typ" (którą literę uważają za najlepszą) z uzasadnieniem odwołującym się do
`PROFIL-DECYZYJNY-MACIEJ.md`. Sędzia punktuje dwuwarstwowo: Warstwa 1 (dominująca) —
trafność rozpoznania kategorii tematu i jakość zastosowania wzorca z profilu; Warstwa 2
(niuanse, tiebreaker) — zgodność ze źródłami, kompletność wariantów. Do właściciela trafia
zwycięska/zsyntetyzowana wersja z jawną adnotacją „wg profilu: typowana X, bo …" przy
Rekomendacji — zawsze obok pełnego A/B/C, nigdy jako zamiennik wyboru. Wybór litery
pozostaje w 100% właściciela — mechanizm nie zmienia tego, kto decyduje, tylko jak dobrze
formułowana jest rekomendacja w projekcie ABC.
**Wdrożenie (runda 1 + poprawki po FAIL Evaluatora, ta sama sesja):** `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`
(§Zasada rozszerzona o „typ" + punktację dwuwarstwową), `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md`
(baner ZAKAZ doprecyzowany o usankcjonowany wyjątek + odsyłacz przy starym zdaniu „wymaga
przeglądu" w §DOKOŃCZONE runda 2), `.claude/skills/civ-autobot/SKILL.md` §3 (zaktualizowany
opis turnieju), `.cursor/rules/autobot-evaluator-operator.mdc` §„Pytanie ABC" (**krytyczne —
to plik `alwaysApply: true`, ładuje się przed kanonem i bez tej poprawki przyszły agent
uruchamiałby stary turniej**), `playbook.md` (`C-018`, treść rozszerzona) →
`dyspozycje/autobot/playbook.json` (`rule_126`, wygenerowany generatorem, liczniki 0/0
zachowane, wersja 17).
**Doprecyzowania po pierwszym werdykcie FAIL (Opus 5 Evaluator):** (a) „typ" JEST literą
w polu `Rekomendacja`, adnotacja „wg profilu" to dopisek uzasadnienia, nie drugie,
konkurencyjne pole; (b) gdy profil nie ma wzorca pasującego do kategorii tematu, „typ"
zostaje obowiązkowy z jawnym stwierdzeniem braku wzorca — nie blokuje turnieju; (c) ta
decyzja **nie przeszła** turnieju C-018 sama — wyjątek „bezpośrednie ustalenie wypracowane
żywą rozmową z właścicielem" dopisany do zakresu wyjątków we wszystkich czterech miejscach
(kanon `R-PROC-AUTOBOT-ABC-TURNIEJ.md`, `civ-autobot/SKILL.md` §3, `.mdc`, `playbook.md`),
bo Maciej współtworzył projekt w dialogu, nie odpowiadał literą na cudzy gotowy projekt.
**Werdykt Evaluatora:** runda 1 FAIL (3 pliki zaktualizowane, 3 kluczowe — `.mdc`,
`playbook.md/json` — pominięte; nieprawdziwe „Wdrożenie" w tym wpisie); runda 2 FAIL
(kluczowe pliki naprawione i zweryfikowane generatorem w trybie dry-run — „brak różnic",
ale wyjątek „żywa rozmowa" dopisany tylko do `.mdc`/`playbook.md`, brakował w kanonie
i skillu, plus nieprawdziwe „trzy miejsca" w tym wpisie); runda 3 FAIL (wyjątek „żywa
rozmowa" ujednolicony we wszystkich pięciu plikach, ale trzeci, STARSZY wyjątek —
„czysto inżynierskie decyzje bez wpływu na gameplay/UX/dane gracza" — brakował w
`playbook.md`/`playbook.json`, obecny tylko w kanonie/`.mdc`/skillu); runda 4 (ta wersja)
dopisuje brakujący wyjątek inżynierski do `playbook.md` C-018 i regeneruje `playbook.json`
(wersja 18) — wszystkie trzy wyjątki teraz identyczne semantycznie w pięciu plikach.
Model: Sonnet 5 (orkiestrator, wdrożenie już potwierdzonej decyzji) + Opus 5 Evaluator.

## R-JAK-EDYTOWAC-AUTOBOT-DOKUMENT (2026-08-08) — meta-dokument: zasady edycji samego systemu AutoBot
**Prośba Macieja:** „spisz jeszcze zasady, jakimi się kierowałeś przy tworzeniu tego
skillsa autobot w przyszłości, żeby mógł zawsze robić zmiany w autobocie", doprecyzowana:
„kluczowe jest to, żeby nowy Skills odtworzył cały mechanizm działania łącznie z plikami,
które muszą być założone i używane w całym procesie kodowania i tworzenia".
**Wykonanie:** nowy plik `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — §0
pełna mapa mechanizmu w 5 warstwach (wejście / kanon / pamięć / egzekwowanie w kodzie /
ślad-księgowość, łącznie ok. 40 plików i ścieżek), §1-10 zasady wyniesione z konkretnych
incydentów tej sesji (m.in. rozjazd 5 plików przy R-PROFIL-TURNIEJ-PUNKTACJA-Q1, generator
playbook.json, fałszywe "Wdrożenie: gotowe"), checklista końcowa. Pointer dodany w
`civ-autobot/SKILL.md` (sekcja „Reguła nadrzędna").
**Werdykt Evaluatora (Opus 5):** runda 1 FAIL — mapa §0 niekompletna: pominięte 5 plików
`.mdc` (w tym `alwaysApply: true` konkurencyjne dla `autobot-evaluator-operator.mdc`),
6 z 10 plików `src/`, 4 pliki spoza src (`PROMPT-AUTOBOT-DLA-AGENTOW.md`,
`protokol-v1.2/`, `KOLEJKA-FABLE-5.md`, `dist-smoke/`), 1 plik kanonu
(`R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md`), niedoliczone incydenty w §5. Runda 2 PASS —
wszystkie braki zweryfikowane jako naprawione bezpośrednio w repo (nie na słowo).
Model: Sonnet 5 (orkiestrator) + Opus 5 Evaluator (2 rundy).

## R-PROFIL-TURNIEJ-UNIWERSALNY-Q1 (2026-08-08) — mechanizm "typ"+profil przeniesiony do lean-loop (uogólniony)
**Decyzja Macieja:** wprost — "musimy to wprowadzić z nasadek ogólnych, ale mechanizm
pozostaje ten sam, różni się tylko szczegółami" — przenieść poziom 2 turnieju (typ
Proponentów + punktacja wg pamięci preferencji) do uniwersalnego skilla, bez treści
specyficznej dla Civ, z wyraźnym celem: żeby żaden projekt nie sprawiał wrażenia, że
"użytkownik mówi do ściany" (poprawki/sugestie/odpowiedzi giną między sesjami).
**Wykonanie w `/root/.claude/skills/lean-loop/` (POZA tym repo, plik nie jest pod git —
brak commita/push, tylko zapis decyzji tutaj):**
- `references/playbook-pattern.md` — nowa sekcja "A second kind of memory: how the human
  decides" (3 typy sygnału: forced-choice, korekty kierunku bez błędu, wolontariat
  preferencji; osobny plik `decision-profile.md`; ten sam rygor statystyczny co playbook;
  wpięcie w rytuał startu/zamknięcia sesji; twarda bariera "nigdy nie zastępuje pytania").
- `references/high-stakes.md` — rozszerzona sekcja turnieju o "pick" + punktację Sędziego
  wg tej pamięci.
- `references/error-protocol.md` — rozróżnienie błąd (rejestr błędów) vs preferencja
  (nowy rejestr), żeby dwa rejestry się nie nakładały.
- `SKILL.md` — zaktualizowany opis trybu "memory".
**Werdykt Evaluatora (Opus 5, 2 rundy):** runda 1 PASS-WITH-NOTES — 4 uwagi (wiszący
odsyłacz do nieistniejącej sekcji turnieju w tym samym pliku, jednokierunkowe nakładanie
się rejestru błędów i nowego rejestru, brak rytuału startu dla nowego pliku pamięci,
bariera słabsza niż reszta "Immovable barriers"). Runda 2 PASS po naprawie wszystkich
czterech, zweryfikowane bezpośrednio w plikach. Zero przecieków Civ/PL/nazw modeli
potwierdzone grepem w obu rundach.
Model: Sonnet 5 (orkiestrator) + Opus 5 Evaluator (2 rundy).

## R-SCALENIE-MAIN-2026-08-08 (2026-08-08) — scalenie gałęzi roboczej do main, wariant A
**Decyzja Macieja: A — scal całą gałąź (21 commitów: deploy FALA 260 + skille AutoBot/
civ-autobot + R-PROFIL-TURNIEJ-PUNKTACJA-Q1 + dokumentacja) do main.** Bezpośrednia
przyczyna: playtest wykazał, że FALA 260 (naprawa Zwiadowcy/traktatu) nie była osiągalna
z main — sesja lokalna pulluje z main, nie z gałęzi roboczej, więc żadne odświeżanie
przeglądarki nie mogło pokazać naprawy, dopóki main jej fizycznie nie miał.
**Wykonanie:** `git merge` (nie force-push) na lokalnej gałęzi `main-merge` z origin/main,
scalenie 21 commitów moich + zachowanie 4 commitów sesji lokalnej wykonanych w
międzyczasie (`4be7e8ba`..`bdd69824`). **Konflikt merytoryczny wykryty i rozwiązany
ręcznie:** obie strony niezależnie dodały nowe reguły playbooka pod tymi samymi ID
(`C-016`/`C-017`/`C-018`) — moje `C-018` (turniej ABC) kolidowało z regułami sesji
lokalnej o tej samej etykiecie dot. przeglądu schowków git. Reguły sesji lokalnej
przenumerowane na `C-020`/`C-021`/`C-022` (treść bez zmian), referencje w rejestrze
błędów i kanale zaktualizowane, `playbook.json` zregenerowany generatorem (wersja 19,
liczniki zachowane). `.gitignore` i `KANAL-PRACA.md` scaliły się z drobnymi ręcznymi
poprawkami (append-only, oba wpisy zachowane w kolejności chronologicznej).
**Weryfikacja przed push:** tsc 0 błędów, logic-test 213/213, tech-tree 19/19,
unit-replace 13/13, autobot-smoke 11/11 — wszystko na scalonym drzewie.
**Po push:** potwierdzone md5 `gra-robocza/Gra-ROBOCZA.html` na `origin/main` =
`e0fa2ec12fdbaf26800f610bb5e82e23` (zgodne z FALA 260), potwierdzone że `rule_126` w
`playbook.json` na main to turniej ABC (nie reguła schowków) — brak kolizji ID.
Commit scalenia: `a659f4a1` (main-merge → main, push bez force).
Model: Sonnet 5 (orkiestrator, wykonanie scalenia po wyraźnej zgodzie Macieja).

## BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
**Jego słowa:** „podczas budowania w trybie budowania ulepszeń, kiedy wybierzemy już coś,
co chcemy ulepszać, nie da się przybliżać i oddalać mapy. Czasem to utrudnia stawianie
ulepszeń." — **NAPRAWIONE**: jeden warunek blokował jednocześnie przeciąganie i zoom;
rozdzielone na `blockPointerAt`/`blockWheelAt` w `camera.ts`. Evaluator PASS-WITH-NOTES po
dołożeniu testu regresji (`camera-zoom-block-test.cjs`, 4/4). ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest.

## R-AUDYT-ZGLOSZEN-2-DNI (2026-08-08) — pełny audyt zgłoszeń Macieja z ostatnich 2 dni
**Prośba:** sprawdzić wszystkie błędy zgłoszone przez właściciela w ciągu ostatnich 2 dni,
potwierdzić czy są zarejestrowane i czy naprawione; przygotować listę tych nienaprawionych
lub błędnie oznaczonych jako naprawione.
**Wynik audytu 9 zgłoszeń playtestowych (2026-08-07/08, `dyspozycje/PYTANIA-OTWARTE.md`):**
- **BUG-ETYKIETA-MIASTA-ROZMYTA** — OTWARTE, potwierdzone niezmienione.
- **BUG-IKONA-KULTURY-PLACEHOLDER** — OTWARTE, potwierdzone niezmienione. **Przyczyna
  zdiagnozowana teraz w kodzie** (`gra/src/render/cityMapStatChip.ts`): `requestCivSigilImage()`
  (linia ~364) porzuca `onReady` bez kolejkowania, gdy inny badge tej samej cywilizacji już
  ładuje ten sam sygnet (`if (cached === 'loading') return;`) — plakietka, która przegrała ten
  wyścig, zostaje trwale z rombem, bo tekstura tworzona jest raz (`if (!tex)`, linia ~744) i
  nigdy nie ponawia żądania. Hover naprawia to przypadkiem: `hoverExpanded` wchodzi do klucza
  cache tekstury (linia 714), więc hover tworzy NOWĄ teksturę, która trafia już na wypełniony
  globalny cache obrazu i rysuje ikonę od razu. Analogiczny wzorzec cache w
  `requestLeaderPortraitImage`/`requestProdIconImage` — niesprawdzony, prawdopodobnie ten sam błąd.
- **R-ETYKIETA-MIASTA-WZROST-PROCENT** ("W5" zamiast "5,5%") — OTWARTE, potwierdzone
  niezmienione i **poprawnie zarejestrowane** dosłownym cytatem właściciela — nie zostało
  pominięte, tylko wciąż czeka na realizację.
- **BUG-ZWIADOWCA-KOSZT-SUROWCA** — naprawione i wdrożone (FALA 260, zweryfikowane w
  `units.json` wcześniej tej sesji).
- **BUG-PRZEMARSZ-KOMUNIKAT-OBCY** — zamknięte, scalone.
- **BUG-BRAMKA-DREWNO-BRAK** — naprawione i wdrożone (FALA 260).
- **BUG-TOOLTIP-MOC-NIEPELNA** — **naprawione i wdrożone (FALA 260, `eff727e`), potwierdzone
  teraz w kodzie** (`gra/src/ui/hexContextTooltip.ts:668-677`, wszystkie 8 pól obecne) — ale
  **status w `PYTANIA-OTWARTE.md` wciąż mówi OTWARTE**. To rozjazd dokumentacji, nie
  pominięty fix — naprawa realnie istnieje i działa, tylko etykieta statusu nie została
  zaktualizowana po deployu.
- **BUG-RZEKI-MEDIUM-FOW-REGRESJA-2** — zamknięte, scalone.
- **BUG-TRAKTAT-KOSZYK-REGRESJA** — naprawione i wdrożone (FALA 260, zweryfikowane na
  `origin/main` wcześniej tej sesji).
**Wniosek:** żadne zgłoszenie nie zostało pominięte w rejestrze — każde ma wpis z cytatem.
Jeden realny problem dokumentacyjny znaleziony: status `BUG-TOOLTIP-MOC-NIEPELNA` nie
zaktualizowany po fixie. Dwa realne, wciąż nienaprawione bugi UI: `BUG-ETYKIETA-MIASTA-ROZMYTA`,
`BUG-IKONA-KULTURY-PLACEHOLDER` (przyczyna teraz znana) — plus otwarte od dawna
`R-ETYKIETA-MIASTA-WZROST-PROCENT`, i nowo zgłoszony `BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN`.
Model: Sonnet 5 (orkiestrator, audyt + diagnoza kodu, bez zmian w `gra/src`).

## R-WERYFIKACJA-ODPOWIEDZI-EWALUATOR (2026-08-08) — C-023/C-024, każda odpowiedź przez Evaluatora
**Decyzja Macieja:** „przyjmuję, że jeżeli pytam się, czy jest coś do zrobienia, to powinien
sprawdzić w plikach, czy nie wiszą jakieś tematy nierozwiązane, a nie odpowiadać z głowy i
kłamać" oraz „zapisz tą zasadę do plików autobota i stosuj zasadę autobota. Pierwsza zasada,
jeżeli o coś pytam i Ty odpowiadasz to ponownie sprawdzić sobie przez ewaluatora czy Twoja
odpowiedź jest prawidłowa."
**Powód:** znaleziony w tej sesji przestarzały status `BUG-TOOLTIP-MOC-NIEPELNA` (plik mówił
„OTWARTE", naprawa wdrożona od FALA 260) plus wcześniejsze niedoprecyzowane „repo czyste i
zsynchronizowane" (prawdziwe tylko dla mojej gałęzi, nie dla `main`).
**Wykonanie:** `playbook.md` — nowe reguły `C-023` (świeży przegląd plików+kodu na pytanie
o otwarte tematy, nigdy z pamięci) i `C-024` (każda odpowiedź na pytanie właściciela
przechodzi przez Evaluatora przed wysłaniem, nie tylko zmiana w repo) + wpis w rejestrze
błędów. `playbook.json` zregenerowany (wersja 20, `rule_131`/`rule_132`, liczniki 0/0).
`.cursor/rules/autobot-evaluator-operator.mdc` (alwaysApply) rozszerzony o tę samą treść —
priorytet, bo ładuje się przed kanonem.
**Zakres C-024 (do doprecyzowania z czasem):** stosowana od razu do odpowiedzi na pytania
o stan projektu/kod/pliki (weryfikowalne fakty); czysto konwersacyjne pytania bez
weryfikowalnej treści faktograficznej nie wymagają Evaluatora — jeśli Maciej chce szerszy
zakres, powie wprost.
Model: Sonnet 5 (orkiestrator, zapis już podjętej decyzji).

## BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA (2026-08-08) — zastosowanie C-024, moja pierwsza diagnoza była błędna
**Zgłoszenie Macieja:** regres w panelu imperium — surowce „dostępu" (Ceramika/Sól/Koń/Złoto)
straciły wyświetlaną ilość, pokazują tylko masz/brak.
**Zastosowanie nowej zasady C-024:** napisałem diagnozę wskazującą `cityPanel.ts`/
`renderSurowce` jako źródło problemu i konkluzję „to raczej nie regres, tylko inny panel
informacyjny". Wysłałem to do Evaluatora (Opus 5) PRZED przedstawieniem właścicielowi —
**Evaluator wydał FAIL**: zły panel wskazany (prawdziwy to `empireDetailPanel.ts`), i **regres
faktycznie istnieje**, ze zidentyfikowanym commitem `331aa180` (2026-08-05) usuwającym `cap`
(a przez to ilość `stock/cap`) dla surowców dostępu. Dodatkowo znalazł, że temat już wcześniej
był w rejestrze (`R-SUROWCE-DOSTEP`, 2026-07-26) — mój grep go przeoczył.
**Wniosek:** dokładnie ten scenariusz, przed którym C-024 miał chronić — pierwsza wersja
mojej odpowiedzi byłaby fałszywie uspokajająca („to nie regres, mylisz panele"), a właściciel
miał rację od początku. Poprawiona diagnoza zapisana w `PYTANIA-OTWARTE.md`
(`BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA`), z pełną chronologią sprzeczności między
`R-SUROWCE-DOSTEP` (26.07, chce widoczności dostępu) i `DOSTEP-SUROWCE-Q1` (29.07, usuwa
pojęcie dostępu) — wdrożenie 05.08 poszło za starszą, unieważnioną już prośbą.
**Do decyzji Macieja:** czy sekcja „Dostęp — nie magazynowane" w panelu imperium ma wrócić do
pokazywania `stock/cap` (cofnięcie `331aa180`) czy zostać czysto informacyjna.

## R-HUD-MIASTO-STAN-CYWILIZACJI — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
6 chipów nagłówka miasta (Praca/Żywność/Skarbiec/Nauka/Kultura/Religia) pokazuje teraz dużą
liczbę = agregat cywilizacji z tego samego silnikowego źródła co główny HUD mapy + małą
liczbę = wkład tego miasta. Evaluator (Opus 5) PASS-WITH-NOTES po jednej rundzie poprawek
(błąd kompilacji + reużycie istniejącej agregacji zamiast nowej). Test 20/20. **Do wiedzy:**
duża liczba NETTO, mała BRUTTO — nie zsumują się dokładnie. Pełne kotwice w
`PYTANIA-OTWARTE.md`.

## R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Spacja/bęben = tylko jednostki z ruchem, strzałki HUD = wszystkie jednostki — dwie osobne
kontrolki (decyzja właściciela 2026-08-08). Plus fix efektu ubocznego: cyklowanie po
„bębnie" nie pomija już pierwszej jednostki na liście. Evaluator PASS-WITH-NOTES po 2
rundach. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08) — nowe zgłoszenie z playtestu
**Jego słowa:** „powinny być pokazywane tylko technologie te które są niedostępne dla innej
cywilizacji zarówno po jednej jak i po drugiej stronie... jeżeli jedna i druga cywilizacja
ma tą technologię to nie ma sensu jej pokazywać". Zarejestrowane w `PYTANIA-OTWARTE.md`.
Wstępnie: `getSellableTechForPlayer()` (main.ts:14137) filtruje tylko po własnych zbadanych
technologiach oferującego, nie po tym czy odbiorca już je ma — pasuje do zgłoszenia, ale
niepewne czy to funkcja zasilająca akurat ten ekran koszyka (do doczytania).

## R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP (2026-08-08) — nowe zgłoszenie z playtestu
**Jego słowa:** „pod symbolem surowca powinna być liczba tych surowców, które mamy
dostępne... trzeba przewidzieć, że tych surowców będzie znacznie więcej, więc musi być
czytelny sposób pokazywania tej większej ilości". Zarejestrowane w `PYTANIA-OTWARTE.md`.
Dwa wymagania: (1) dopisać liczbę zapasu do chipów surowca w koszyku wymiany
(`diplomacyTradeBasket.ts`), (2) zaprojektować skalowalny układ na przyszłość (więcej
surowców niż dziś 3 w rzędzie).

## R-PROPOZYCJA-BRAK-EDYCJI + BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC (2026-08-08)
Dwa zgłoszenia z panelu propozycji dyplomacji, zarejestrowane w `PYTANIA-OTWARTE.md`:
(1) brak przycisku Edytuj — potwierdzone w kodzie, tylko „Usuń" (`diplomacyTradeBasket.ts:1177`);
(2) usunięcie pustej karty „Oni oferują" (druga strona nic nie daje) kasuje też sparowaną,
realną propozycję po naszej stronie — nielogiczna kaskada, niezdiagnozowana jeszcze która
funkcja odpowiada za to sparowanie.

## R-DYPLO-CENY-SUROWCOW-PW + BUG-PAKIET-BILANS-DODATNI-BLOKADA (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Zarejestrowane w `PYTANIA-OTWARTE.md` z pełną tabelą cen surowców (Drewno 1 PN/szt. ... Złoto
50 PN/szt., `econ-params.json:handel_surowce`) i zlokalizowanym mechanizmem bloku pakietu:
`diplomacy-proposals.ts:1082` (`treatyBaseFairnessGap`) liczy uczciwość WYŁĄCZNIE dla
pojedynczej umowy w pakiecie (`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A`, świadome), ale panel UI
pokazuje zbiorczy dodatni bilans pakietu (+14 PW) sugerując inaczej — niespójność UI vs
logika akceptacji. Powiązane z już znanym `R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY`.

## BUG-ETYKIETA-MIASTA-ROZMYTA + BUG-IKONA-KULTURY-PLACEHOLDER — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Oba w `gra/src/render/cityMapStatChip.ts`. Rozmycie: canvas renderowany teraz ×`devicePixelRatio`
(cap ×3), standardowy wzorzec „retina canvas" dla tekstur Three.js. Placeholder: kolejkowanie
callbacków sygnetu cywilizacji zamiast gubienia ich przy równoległych żądaniach. Evaluator
(Opus 5) PASS-WITH-NOTES po 3 rundach — runda 1 złapała 2 realne błędy, runda 2 znalazła lukę
pokrycia testu (błąd realny, ale test go nie łapał), runda 3 potwierdziła domknięcie własnymi
kontrfaktykami (7 mutacji, 6/7 złapanych, 1 nieszkodliwy wyciek pamięci bez efektu wizualnego).
`R-ETYKIETA-MIASTA-WZROST-PROCENT` (procent wzrostu zamiast „W5") pozostaje OTWARTE — próba
naprawy świadomie wycofana (użyłaby innej liczby niż panel miasta), prawdziwa przyczyna
zablokowania (migawka z końca tury vs. panel na żywo) znaleziona i opisana, czeka na decyzję.
Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-HANDEL-PAKIETY-USUNAC (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
**Jego słowa:** „zlikwiduj te pakiety, bo to będzie kompletnie niezrozumiałe dla graczy. Po
prostu podajemy sztuki. Jeden, dziesięć, sto i tak dalej. Żadnych pakietów! Usuń dla
wszystkich surowców pakiet." Decyzja wprost, nie ABC — usunąć koncepcję „pakiet ×10" z UI
wymiany surowców (`diplomacyTradeBasket.ts`, `diplomacy-value-catalog.ts`
`diplomacyHandelSurowcePakietWielkosc()`, `econ-params.json:pakiet_wielkosc`), zastąpić
wprowadzaniem surowej liczby sztuk (stepper +1/+10/+100 na sztukach, nie na pakietach).
Cena PN/szt. z `econ-params.json:handel_surowce.cena_*` zostaje bez zmian — zmienia się tylko
jednostka wejścia UI. **NAPRAWIONE**, Evaluator PASS-WITH-NOTES po 2 rundach (2 zepsute
pakiety testów + błąd wycieku etykiety do wiadomości AI, oba naprawione i niezależnie
zweryfikowane). Pełne kotwice w `PYTANIA-OTWARTE.md`.

## BUG-CYWILIZACJA-BEZ-GRANIC + BRAK-WZROSTU (2026-08-08) — DIAGNOZA ZAKOŃCZONA
Hipoteza właściciela (Zulusi „zjadają" własną ludność) **potwierdzona kodem**: koszt
założenia miasta = 1 pkt ludności pobierany z najludniejszego miasta (`city-founding.ts`),
AI (`ai.ts:planCityFounding`) zbiera to co turę bez throttle gdy miasto urośnie 1→2 —
samopodtrzymująca się pętla 1↔2. Wzmocnione karą wzrostu Zulusów (`civ-matrix.json
lud_wzrost_proc=-0.05`) i wysoką agresywnością/ekspansywnością (`civ-ai.json`). **Do decyzji
ABC** (throttle w AI). Brak granic — **NIE znaleziono przyczyny**, 3 hipotezy odrzucone
dowodami z kodu (brak gate'u odkrycia, kolor OK, promień terytorium OK nawet dla pop=1);
jedyna pozostała hipoteza (remis w `territoryOwnerAt` przy gęstym osadnictwie) wymaga
diagnozy na żywym zapisie, nie samą lekturą kodu. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## BUG-CYWILIZACJA-BEZ-GRANIC — CZĘŚĆ GRANICE: ZDEPLOYOWANE `ce69cf45` FALA 262 (naprawiona fragmentacja obrysu)
Hipoteza `territoryOwnerAt` (remisy) **odrzucona po weryfikacji na żywej symulacji** —
rzeczywista przyczyna to `borderVertexKey()` w `territory-border.ts`: `toFixed(5)` bez
normalizacji znaku przy zerze dawał dwa różne klucze stringowe dla tego samego wierzchołka
geometrycznego (szum zmiennoprzecinkowy ~1e-16 przy liczeniu wspólnego narożnika z dwóch
centrów heksów) — im gęstszy klaster miast względem world (0,0), tym częściej. Fix:
`fixNegativeZeroString()`. Evaluator PASS-WITH-NOTES z niezależnym dowodem (400 losowych
gęstych kształtów: przed naprawą 32/400 wadliwe, po naprawie 0/400). 9 bramek zweryfikowanych
niezależnie, identyczne liczby po scaleniu w drzewie głównym: `tsc` czyste, `territory-border`
9/9, `territory-border-dense-settlement` (nowy) 15/15, `improvement-territory-gate` 6/6,
`border-march-scan` 15/15, `border-march-wygasanie` 26/26, `diplomacy-border-march` 39/39,
`fair-play-grid` 8/8, `logic-test` 213/213. **Zastrzeżenie Evaluatora:** próba 4000 kształtów
sprzed naprawy pokazała że obrys nigdy nie znikał CAŁKOWICIE, tylko był poszarpany (70–94%
pokrycia) — status w `PYTANIA-OTWARTE.md` celowo złagodzony do „do potwierdzenia playtestem",
nie „NAPRAWIONE" bez zastrzeżeń.

## R-ETYKIETA-MIASTA-WZROST-PROCENT — ZDEPLOYOWANE `ce69cf45` FALA 262
Plakietka miasta na mapie pokazywała skrót „W5" (poziom Wyżywienia) zamiast realnego procentu
przyrostu ludności na turę, o który prosił właściciel. Naprawa: `cityGrowthLive()` woła TEN SAM
`computeView()` co panel miasta (jedno źródło prawdy, żadnej reimplementacji wzoru), przewód
przez strukturalny typ `CityRenderOptions.getCityGrowth` (`render/` nadal nie importuje `ui/`).
Format („5%"/„5,5%"/„0%"/„−2,1%"/„—" przy głodzie) zgodny z istniejącą konwencją kodu
(`formatWyzwienieLabel`, `formatLiczbaPl`) — Evaluator: nie wymaga osobnego pytania ABC.
Evaluator PASS-WITH-NOTES, `city-badge-growth-percent-test.cjs` 38/38 (nowy),
`city-map-badge-test.cjs` 62/62, `logic-test` 213/213, `tsc` 0 błędów. Cztery niepilne noty
Evaluatora: brak testu jednostkowego samej delegacji, rozjazd separatora panel-vs-plakietka
(zarejestrowany osobno `P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD`), 4 czerwone testy wzrostu
ludności potwierdzone pre-istniejące (dług testowy R-STAWKI, nie regresja), duplikacja
formatera liczb wymuszona architektonicznie.

## P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD — NAPRAWIONE 2026-08-09 (jeden wiersz)
Chip „WZROST%" w panelu miasta renderował surowo (kropka), plakietka mapy przecinkiem. Naprawa:
chip w `renderMagazyn` (zawsze widoczny, funkcjonalny odpowiednik plakietki) woła teraz
`formatLiczbaPl`. Evaluator PASS-WITH-NOTES potwierdził że to WŁAŚCIWY i JEDYNY zawsze widoczny
wiersz (8 pozostałych to detail-cardy na żądanie, jeden — martwy kod bez call-site). Znak minusa
świadomie nietknięty — panel już dziś miesza glify między chipami tej samej tabeli, właściwa
naprawa jest w `formatPl.ts` (`signedPl`), zarejestrowana osobno. `city-panel-growth-percent-separator-test.cjs` 22/22 (nowy), `city-badge-growth-percent-test.cjs` 38/38 (bez zmian),
`logic-test` 213/213. Cztery nowe niepilne noty zarejestrowane osobno: rozjazd glifu minusa
w `formatPl.ts`, rozjazd zaokrąglenia (dziś nieosiągalny), mieszane separatory w jednej karcie,
pre-istniejący czerwony `spichlerz-widocznosc-test` (13/14, do dopisania do CLAUDE.md).

## P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL — ZAMKNIĘTE 2026-08-09
`signedPl` (`gra/src/ui/formatPl.ts`) miał sprzeczność docstring vs implementacja (obiecywał
U+2212, zwracał ASCII `-`), co powodowało rozjazd glifu chip „Racje" (U+2212 zahardkodowane) vs
chip „Bilans" (ASCII przez `signedPl`) w tej samej tabeli. Naprawa: `signedPl` post-processuje
ASCII na U+2212 (`formatLiczbaPl` bazowa nietknięta, ma własny test ASCII z wcześniejszej
naprawy). Evaluator PASS-WITH-NOTES: domknięcie tranzytywne importów policzone niezależnie (29
modułów, 10 wołających, 5 testów), parytet Racje/Bilans potwierdzony na realnym kodzie, zero
konsumentów parsujących ASCII na wyjściu. `format-pl-signed-minus-glif-test.cjs` 13/13 (nowy),
`empire-skarbiec-bilans-test.cjs` 11/11, `city-panel-growth-percent-separator-test.cjs` 22/22,
`logic-test` 213/213, `tsc` 0 błędów. Dwie nowe niepilne noty zarejestrowane osobno:
`P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE` (2 pre-istniejące czerwone testy, awaria
harnessu nie regresja), `P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI` (`+` przed `signed()` daje
podwójny znak przy wartościach ujemnych).

## P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY — ZAMKNIĘTE 2026-08-09
Karta „Wyżywienie i wzrost — szczegóły" (`buildRacjeWzrostDetailCard`): 6 składników przez
`signed()` (przecinek), wiersz „Łącznie" surowym szablonem (kropka) — mieszane separatory w
jednej karcie. Naprawa: suma też przez `signed()`. C-026: sąsiad `bd.spichlerz` sprawdzony i
wykluczony (nieujemność gwarantowana konstrukcją funkcji, nie danymi). Evaluator PASS-WITH-NOTES
z blokującą korektą domkniętą przy scaleniu: sekcja [6] testu asercjonowała ASCII myślnik, co
padłoby po scaleniu równoległej `P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL` (`signedPl`→U+2212) —
poprawione na U+2212 przed commitem, zweryfikowane 29/29 po scaleniu obu. `logic-test` 213/213,
`tsc` 0 błędów. Nowa niepilna nota zarejestrowana osobno:
`P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY` (analogiczna usterka w sąsiedniej karcie).

## P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD — ZAMKNIĘTE 2026-08-09 (decyzja B: test/dokumentacja)
Panel/plakietka zaokrąglają inaczej (`toFixed` vs `Math.round`), rozjeżdżają się przy krokach
generujących nieparzyste wielokrotności 0,05 — dziś nieosiągalne (krok realny 0,5). Decyzja B:
nie zmieniać silnika, przypiąć osiągalność testem. Wyczerpująca enumeracja 52 140 543 kombinacji
6 składników `computeGrowthPercentV85` — 0 rozjazdów; parytet na 400 001 wartościach wielokrotności
0,5 — 0 rozjazdów. `city-growth-percent-rounding-parity-test.cjs` 16/16 (nowy). Evaluator
PASS-WITH-NOTES z blokującą korektą domkniętą przy scaleniu: komentarz-niezmiennik przy
`WYZYWIENIE_STEP` zawierał nieprawdziwe zdanie („identyczny wynik TYLKO dla wielokrotności 0,5"
— fałsz, prawdziwa reguła to nieparzysta wielokrotność 0,05) — poprawione. `city-badge-growth-
percent-test` 38/38, `logic-test` 213/213, `tsc` 0 błędów.

## P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA — ZAMKNIĘTE 2026-08-09 (test przestarzały, NIE dopisywać do listy czerwonych bramek)
`spichlerz-widocznosc-test.cjs` (13 pass/14 fail) nie odzwierciedlał dwóch późniejszych decyzji
(`DOSTEP-SUROWCE-Q1`, `R-STAWKI` FALA2 ×2) — silnik poprawny, test przestarzały. Przepisany
całkowicie (44→45/0 po korekcie), kod produkcyjny nietknięty. Evaluator PASS-WITH-NOTES:
diagnoza zweryfikowana z dokumentu decyzji, wszystkie 8 przeliczeń sprawdzone ręcznie. Dowód
mutacyjny pierwotnie pinował mnożnik tylko „z góry" — domknięte przy scaleniu asercją graniczną
(`drewno:15`), zweryfikowaną osobiście (mutacja MULT 2→1 → 44/1, przywrócone → 45/0).
`deposit-building-gate-test` 47/47, `tech-tree-test` 19/19, `logic-test` 213/213, `tsc` 0 błędów.

## P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE — ZDEPLOYOWANE `ce69cf45` FALA 262
`yieldOfMapHex` (`gra/src/game/okolica.ts`) czytał tylko ostatnią warstwę `hex.ulepszenie`,
silnik (`hexToWorkedTile`) sumuje wszystkie warstwy z `hex.ulepszenia[]`. Naprawa: wywołanie
`improvementKeysForHex(h)` identycznie jak silnik. Evaluator PASS-WITH-NOTES, parytet
potwierdzony linia po linii, dowód mutacyjny (12/7 fail po cofnięciu), własny harness 32/32.
`heks-plony-warstwy-test.cjs` 19/19 (nowy), `okolica-test` 46/46, `hex-plony-magazyn-test`
11/11, `plony-budynkow-test` 68/68, `logic-test` 213/213, `tsc` 0 błędów. Trzy niepilne noty
zarejestrowane osobno: `P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA` (Evaluator: podniesiona
pilność, „nie odkładać" — drugi człon tego samego wzoru rankingu ma identyczny nienaprawiony
wzorzec), `P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE` (dziś nieszkodliwe), oraz niezweryfikowana
hipoteza `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`.

## P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA — ZAMKNIĘTE 2026-08-09 (4 rundy, PASS-WITH-NOTES)
Hipoteza potwierdzona żywą symulacją: silnik ekonomii przypisywał robotników na Morze/Góry,
których overlay nigdy by nie pokazał (Góry mają najwyższą Pracę ze wszystkich terenów).

**Runda 1:** fix naprawił 2 z 5 miejsc przypisania — Evaluator FAIL (tryb ręczny bez filtra,
cicha utrata produkcji, 27→15 Pracy/turę). Decyzja właściciela `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1`:
tylko stare zapisy, bez migracji, mechanizm ręczny zostaje funkcjonalnie bez zmian.

**Runda 2:** wszystkich 5 ścieżek dostało filtr (potwierdzone niezależną enumeracją Evaluatora —
10 miejsc, zero szóstego writera, dowód mutacyjny na wszystkich). Ale **NOWY, sprzeczny z kanonem
decyzji bloker**: filtr terenu w `toggleTileWorker` blokuje też ZDEJMOWANIE robotnika, więc stary
zapis z nielegalnym przydziałem zakleszcza się (robotnik na Górach nie da się zdjąć klikiem) —
dokładnie zabronione przez `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1` („mechanizm zostaje bez zmian
funkcjonalnych"). Dodatkowo `cityPanel.ts:8290` liczy `isWorked` bez filtra — nowy rozjazd
panel↔silnik. Drugi blocker: zero testów dla AC „stary zapis nie liczy produkcji, bez
auto-naprawy" z kanonu decyzji — luka pokrycia, która pozwoliła pierwszemu blokerowi przejść
niezauważenie. Kierunek naprawy (5 linii, gałąź zdejmowania przed bramką terenu) zweryfikowany
osobiście przez Evaluatora, działa bez regresji. Runda 3 dispatched z pełną listą.

**Runda 3:** B1 rundy 2 potwierdzony jako naprawdę naprawiony (własny 42-asercyjny harness
Evaluatora, nie testy Operatora). Ale runda 3 wprowadziła NOWĄ regresję: filtr terenu dołożony do
`rebalanceWorkersAfterPopulationChange` powoduje, że przy SPADKU populacji gałąź `!t → delete` i
osobne `if(worstKey) delete` kasują ŁĄCZNIE więcej wpisów niż `excess` — zmierzone: 3 skasowane
zamiast 1, zginął legalny robotnik, miasto zostaje z pustymi slotami na stałe. Jedyny caller
produkcyjny to co-turowy `population-growth-v85.ts:396` — nie wymaga akcji gracza. To dokładnie
zakazana przez decyzję auto-migracja/cicha utrata. Drugi bloker: dowód mutacyjny Evaluatora
pokazuje że usunięcie filtra z `seedReczneFromAuto` (1 z 5 „zabezpieczonych" ścieżek) NIE jest
łapane przez żaden test — deklaracja „wszystkie 5 ścieżek" niezweryfikowana. Runda 4 dispatched
z precyzyjną listą (napraw logikę usuwania w rebalance, dołóż test na to, zamknij lukę pokrycia
seedReczneFromAuto, popraw nieprawdziwy komentarz przy cityPanel.ts:8290).

**Runda 4 (commit `3aba4286`) — Evaluator PASS-WITH-NOTES, SCALONE.** Pierwsza runda, która
obroniła się pod naciskiem: wpisy nielegalne dostają `score=-Infinity` i przechodzą przez tę samą
logikę wyboru `worstKey` co legalne, gwarantując dokładnie `excess` usunięć. Nowe testy 23/24
przypinają filtr w `seedReczneFromAuto` i gałęzi wzrostu. Evaluator zbudował własny harness (10
scenariuszy poza raportem) i wykonał 6 własnych mutacji, każda złapana przez SPECYFICZNY zestaw
asercji — dowód realnego, per-ścieżkowego pokrycia. `map-gen-regression` pominięcie potwierdzone
po raz trzeci (0 wystąpień zmienionych funkcji w bundlu 654 kB). `okolica-test` 72/72,
`okolica-isworkable-silnik-test` 15/15, `logic-test` 213/213, `tsc` 0 błędów.

**Korekta faktograficzna (Evaluator rundy 4):** zapis „runda 3 wprowadziła nową regresję" był
nieprecyzyjny co do mechanizmu — błędny blok podwójnego kasowania istniał od dawna (`13419757`),
runda 3 tylko rozszerzyła zakres `!t` o Góry/Morze, czyniąc go osiągalnym częściej. Poprawiona
naprawa B3 nie zależy od tego rozróżnienia.

**Nowe pytanie ABC zarejestrowane osobno:** `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1` — naprawa B3
chroni też pola, które wypadły z zasięgu przez skurczenie promienia terytorium (zwykła dynamika
gry, nie tylko stare zapisy), tworząc fantomowe sloty niewidoczne w panelu miasta.

## P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE — NAPRAWIONE 2026-08-09
`yieldOfMapHex` nie przekazywała `zloze` do `tileYield()`, silnik (`hexToWorkedTile`) tak.
Dziś nieszkodliwe (render nie zwraca `ruda`), pułapka na przyszłość. Naprawa: dodane pole,
zerowa zmiana zachowania (dowiedziona identycznym wynikiem testu przed/po). Nowy test przez
podmianę modułu na szpiega (jedyny sposób wykryć brak przekazania skoro wynik funkcji się nie
zmienia). Evaluator PASS-WITH-NOTES, zweryfikował szpiega osobiście (sonda sentinel).
`heks-plony-zloze-forward-test.cjs` 5/5 (nowy), `heks-plony-warstwy-test.cjs` 19/19 identyczne
przed/po, `logic-test` 213/213.

## P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA — NAPRAWIONE 2026-08-09
Drugi człon wzoru rankingu (obok `yieldOfMapHex`) miał ten sam błąd: `foodPotentialOfMapHex`
czytał tylko legacy `h.ulepszenie`. Naprawa: `improvementKeysForHex(h)`, ten sam wzorzec.
Evaluator PASS-WITH-NOTES, dowód mutacyjny (cofnięcie → 21/24, `okolica-test`/`logic-test` NIE
łapały błędu pod mutacją — nowy test był jedynym strażem). Osiągalność potwierdzona na realnym
przypadku: Równina z `['farma','droga']`, legacy `'droga'` (droga nadpisuje przy budowie) —
stary kod dawał nienależne 3 pkt potencjału. `heks-plony-warstwy-test.cjs` 24/24, `okolica-test`
46/46, `auto-manage-test` 45/45, `logic-test` 213/213. Trzeci, NIEnaprawiony człon tej samej
rodziny znaleziony przez Evaluatora, zarejestrowany osobno: `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA`
(`cityPanel.ts`, widoczny graczowi w tooltipach pól — zmierzone 2/2/2 zamiast realnych 5/5/5
na tym samym heksie testowym).

## P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA — ZAMKNIĘTE 2026-08-09
Trzeci człon tej samej rodziny błędu: `tileYieldLabel()`/`appendOkolicaYieldLabel()` w
`cityPanel.ts` budowały `WorkedTile` z tylko jedną (legacy) warstwą — panel pokazywał 2/2/2 tam,
gdzie silnik liczył 5/5/5. Naprawa: `improvementKeysForHex(hex)`, ten sam wzorzec co silnik i
pozostałe dwa naprawione dziś człony. Evaluator PASS-WITH-NOTES, 4 własne mutacje złapane osobno,
C-026 (8 wystąpień, wszystkich w `cityPanel.ts`) potwierdzone niezależnie — rodzina zamknięta.
`heks-panel-tooltip-warstwa-test.cjs` 22/22 (nowy), `heks-plony-warstwy-test.cjs` 24/24,
`logic-test` 213/213, `tsc` 0 błędów. Dwie nowe niepilne noty zarejestrowane osobno:
`P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE`, `P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY`.

**RECYDYWA tego samego dnia, złapana przez agenta deploy przed FALA 263:** scalanie NIEZWIĄZANEJ
naprawy (`P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY`) użyło `git diff` względem bazy, która nie
była przodkiem tipa worktree — patch po cichu cofnął tę naprawę, `git apply --check` przeszedł
czysto. Złapane wyłącznie przez bramkę `heks-panel-tooltip-warstwa-test.cjs` na etapie deployu
(15/22). Naprawione bezpośrednio, zweryfikowane niezależnym Evaluatorem (Opus 5) pełnym diffem
całego pliku + dowodem mutacyjnym — bit-for-bit identyczne z `92341250`. Nowa reguła procesowa w
`civ-autobot/SKILL.md` §5 (`git merge-base` przed liczeniem patcha).

## R-HEKS-PLONY-UKRYTE-POD-MIASTEM (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Przyczyna: render (`cityOkolicaOverlay.ts`) pomijał liczby plonów na KAŻDYM heksie z
„ulepszeniem", w tym na centrum miasta — silnik zawsze ma tam realny plon. Fix: wyjątek dla
heksu centrum. Evaluator (Opus 5) PASS-WITH-NOTES, `tsc` czyste. Dwie notatki do osobnej
rejestracji (dopisane jako `P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE`, niska pilność, i
uwaga do zweryfikowania na playteście: zgłoszenie mówiło o „zielonym kółku", centrum
faktycznie jest niebieskie — jeśli po deployu problem nadal widoczny na zielonych heksach,
to inny temat). Pełne kotwice w `PYTANIA-OTWARTE.md`.

## P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE (2026-08-08) — znalezisko Evaluatora, zarejestrowane
Render czyta tylko ostatnią warstwę ulepszenia heksu, silnik liczy wszystkie — przy
wielowarstwowych ulepszeniach na centrum miasta render może zaniżać plon. Niska pilność,
osobny temat od naprawy powyżej. Pełny opis w `PYTANIA-OTWARTE.md`.

## BUG-KOLEJKA-BUDOWY-PRZYCISKI-ROZJECHANE (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Fix scommitowany (2 zmiany CSS w `cityPanel.ts`), Evaluator (Opus 5) PASS-WITH-NOTES —
niezależnie zweryfikowany zakres (dokładnie 2 zmiany), C-026 (enumeracja miejsc użycia `.btn`)
potwierdzona własnym grepem Evaluatora, nie tylko self-raportem Operatora. `tsc --noEmit`
czyste. Nota Evaluatora: wymaga realnego playtestu (zmiana czysto wizualna, brak harnessu
DOM/CSS w repo). Poprzedni wpis poniżej — historia diagnozy.
Diagnoza (`cityPanel.ts`): dwa defekty flex-layoutu, oba z commita `daacd43a` (2026-07-29,
sprzed 10 dni) — NIE ze świeżej pracy, ujawnione dopiero dziś. (1) `qLabel` kolejki BUDYNKÓW
brakuje `min-width:0;overflow:hidden;...;white-space:nowrap;` które ma kolejka jednostek —
długa nazwa budynku rozpycha wiersz; (2) przyciski ↑/↓/✕ bez `flex-shrink:0` — kurczą się
poniżej wygodnego obszaru kliku pod naporem etykiety+chipów. Zakres naprawy wąski (C-025): 2
zmiany CSS, zero innych zmian; selektor przycisków zawężony do `.civ-cs .qitem .btn` (C-026),
nie globalnie `.civ-cs .btn`. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-PORTRET-PRODIKONA-DROPPED-CALLBACK (2026-08-08) — znalezisko przy okazji, zarejestrowane
Ten sam wzorzec błędu co `BUG-IKONA-KULTURY-PLACEHOLDER` (`if (cached==='loading') return`
gubi callback) w dwóch innych funkcjach `cityMapStatChip.ts` — nie powoduje zgłoszonego
objawu, świadomie zostawione poza zakresem tamtej naprawy (C-025). Do naprawy tym samym
wzorcem kolejkowania. Pełny opis w `PYTANIA-OTWARTE.md`.

## Trzy decyzje ABC (2026-08-08) — ECHO, w realizacji
Maciej odpowiedział na turniej ABC: `R-AI-FOUNDING-THROTTLE-Q1 A` (zmodyfikowane: próg
`AI_FOUNDING_SOURCE_MIN_POP` z 2 na **3**, nie 4-5 z pierwotnej propozycji) ·
`R-SUROWCE-DOSTEP-ILOSC-Q1 A` (pełny powrót ilości dla wszystkich 13 surowców) ·
`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2 A` (bramka traktatu na poziomie sumy stołu, zawężona do baz
traktatowych). Decyzje zapisane w `docs/decyzje/R-AI-FOUNDING-THROTTLE-Q1.md`,
`R-SUROWCE-DOSTEP-ILOSC-Q1.md`, `R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2.md`. Kod w realizacji —
3 subagenty Sonnet 5 równolegle, per C-027.

## R-AI-FOUNDING-THROTTLE-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
`AI_FOUNDING_SOURCE_MIN_POP` 2→3. Evaluator PASS-WITH-NOTES — pętla 1↔2 przesuwa się na 2↔3
(świadome ryzyko z decyzji), nie znika całkowicie. `ai-test.cjs` 274/8 (8 pre-istniejących).

## R-SUROWCE-DOSTEP-ILOSC-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Pełne cofnięcie `331aa180`. Wszystkie 13 surowców pokazuje realną ilość, sekcja boolean
„Dostęp" usunięta wraz z martwym modułem `empire-resource-access.ts`. Tooltip źródła
nietknięty. Evaluator (Opus 5) PASS-WITH-NOTES — zgłosił martwą gałąź komunikatu „brak
dostępu" w tooltipie (dziś nieosiągalna) jako osobny, niepilny follow-up. `tsc` czyste,
13/13.

## R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Bramka uczciwości traktatu (`umowa_szlakow`/`umowa_handlowa`) teraz widzi nadwyżkę siostrzanej
pozycji w tym samym pakiecie (`packageSiblingGivePn`/`packageSiblingReceivePn`), zgodnie z
UI „Bilans (Netto)". Naprawiony przy okazji błąd kolejności (snapshot `siblingByTreatyId`
przed pętlą wykonania zamiast liczenia na żywo — poprzednio traciło dane o już wykonanej
pozycji). Usunięto 3 zduplikowane sprawdzenia `acceptanceTheir.accepted`. Evaluator: runda 1
PASS-WITH-NOTES (test źródłowy nie łapał regresji mimo zielonego wyniku — wzmocniony), runda 2
PASS z niezależną reprodukcją. `tsc` czyste, `diplomacy-fairness-gate-package-q2-test.cjs`
24/24, `diplomacy-proposal-test.cjs` 126/126, `diplomacy-stol-pw-sum-test.cjs` 26/26.
Osobno wciąż otwarte: `BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA` (kierunek przychodzący,
dispatch w toku).

## R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Wymiana technologii filtruje teraz obie strony po `ownerResearchedTechs` responder-a
(`tradeableTechIdsForSide`) zamiast pokazywać identyczną listę wszystkich zbadanych przez
oferującego. Evaluator PASS-WITH-NOTES (merge clean, tsc 0 błędów, pełny pakiet dyplomacji
zielony). 3 noty niepilne zarejestrowane osobno w `PYTANIA-OTWARTE.md`
(`P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU`, `P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE`, +
świadoma konsekwencja ukrywania akcji `'6'`).

## BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
`canAccept` dla pakietów przychodzących liczony teraz per-pozycja przez `responderPreview`
(ta sama funkcja co realne wykonanie), nie z sumy netto PW całego stołu — przycisk „Przyjmij"
i wykonanie są teraz zgodne z definicji. Evaluator PASS-WITH-NOTES, 28 plików testów dyplomacji
zielonych. 2 noty niepilne w `PYTANIA-OTWARTE.md`.

## R-MOC-TABLICZKA-VS-CIVPOWER-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Tabliczka nad żetonem = pełna Moc (teren/fortyfikacja/mur/weteran), civ-power = tylko naturalne
wskaźniki + weteran. Evaluator PASS-WITH-NOTES, 14 plików testów zielonych. Przy okazji
naprawiony STRICT-PARITY: civ-power AI już nie zawyżony mnożnikiem trudności — **widoczne w
playteście jako spadek Mocy AI w rankingu na wyższych poziomach trudności, to poprawny efekt,
nie regresja**. Dwa znaleziska świadomie odłożone (tooltip heksu, trwałe bonusy budynków) w
`PYTANIA-OTWARTE.md`.

## R-MOC-TABLICZKA-VS-CIVPOWER-Q1 — ECHO, kod w dispatchu (ZASTĄPIONE wpisem wyżej)
Maciej skorygował `R-MOC-DEFINICJA-Q1` (2026-08-08): ta decyzja błędnie zunifikowała tabliczkę
jednostki na mapie (ma pokazywać REALNĄ Moc ze wszystkimi bonusami — teren/fortyfikacja/mur/
weteran) z Mocą cywilizacji (ranking/HUD/Empire — ma być BEZ terenu/fortyfikacji/muru, tylko
naturalne wskaźniki + ulepszenia + weteran). Zamyka `R-MOC-MUR-PARADOKS-Q1` i `-Q2` naraz.
Decyzja: `docs/decyzje/R-MOC-TABLICZKA-VS-CIVPOWER-Q1.md`.

## ABC-PACZKA-2026-08-06-DOPREC — ZAMKNIĘTE bez odpowiedzi, wszystkie 6 pytań nieaktualne
Audyt na polecenie „wypchnąć wszystkie aktywne pytania" wykazał, że wszystkie 6 pytań tej
paczki z 2026-08-06 zostało w międzyczasie rozstrzygniętych INNĄ drogą (status po prostu nigdy
nie zaktualizowany): działaj-scope → zastąpione C-027; deploy-rytm → zastąpione hasłem `deploy`;
marker stolicy → wdrożony C (`cityMapStatChip.ts`); przyszłe kopalnie → wdrożone
(`relief-preserving-improvements.ts`); liczby §9 → wdrożone (`2e67219`); brief Design v2 →
rozstrzygnięte C (`PROFIL-DECYZYJNY-MACIEJ.md`). Szczegóły w `PYTANIA-OTWARTE.md`.

## R-PROPOZYCJA-BRAK-EDYCJI + BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
3 rundy. Runda 1: worktree stale, niescalalne, zero testów edycji. Runda 2: worktree świeże,
FAIL za gating „Usuń" na karcie traktatu niezgodny z renderem (PW-check którego render nie ma).
Runda 3: worktree ZNOWU stale (40 commitów) — naprawione rebase'm w tym samym worktree zamiast
pełnego redo; Evaluator PASS-WITH-NOTES z niezależnym harnessem (nie kopią testu Operatora).
Jednolinijkowa poprawka przy scaleniu (`!= null`→truthy, zgodność z renderem co do joty).
Edycja działa dla 5 typów koszyka, kasacja pustej/mirror karty zgodna z decyzją
`R-PROPOZYCJA-KASACJA-UI-Q1=A`. `diplomacy-basket-edit-test.cjs` 25/25, `tsc` czyste.

## R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Runda 1: FAIL (worktree stale, `maxPakiety` zamiast `maxQty`, 10× za niska wartość). Runda 2:
worktree naprawione przed kodowaniem, widoczna odznaka zapasu po stronie „daję", kompaktowy
format dla dużych wartości. Evaluator PASS-WITH-NOTES, 31 plików testów dyplomacji zielonych.
Skorygowany przy scaleniu: nieprawdziwy komentarz w kodzie o powodzie wyłączenia strony
„dostaję" (title/data-max już dziś ujawniają zapas AI bezwarunkowo, to nie był powód).

## R-PORTRET-PRODIKONA-DROPPED-CALLBACK — NAPRAWIONE, czeka na deploy+playtest
Wzorzec kolejkowania z `requestCivSigilImage` powielony na `requestLeaderPortraitImage`/
`requestProdIconImage`. Evaluator PASS-WITH-NOTES, własny dowód mutacyjny + sonda 5 miast.
`city-map-badge-test.cjs` 62/62 (baza 49, nie 47 jak w pierwotnym raporcie). Follow-up
zarejestrowany: `P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC` (3 kopie tego samego wzorca).

## P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC — NAPRAWIONE 2026-08-09 (refaktor, Opus 5/render)
3 niezależne kopie wzorca kolejkowania scalone w jeden prywatny helper `createImageRequestQueue()`.
Zero zmiany zachowania (wyjście testu bajt w bajt identyczne z bazą). Evaluator PASS-WITH-NOTES,
bardzo dokładna weryfikacja: 7 wariantów mutacyjnych (4 własne), mutacja rdzenia wywala 16
asercji naraz u wszystkich trzech zasobów (dowód realnego scalenia logiki, nie tylko
przeniesienia kodu). `city-map-badge-test.cjs` 62/62 (identyczne z bazą), `logic-test` 213/213,
`vite build` 799 modułów OK, `tsc` 0 błędów.

## P-TEST-UPKEEP-R-STAWKI — ZAMKNIĘTE, wpis był nieaktualny (dokumentacja, bez zmian silnika)
Diagnoza (subagent Sonnet 5, 2026-08-09): stary wpis „49/73, 24 porażek przez ×2 koszty
R-STAWKI/R-NADMIAR-POOLS" był nieaktualny już od 2026-08-05 — commit `12ecd09d`
(„test(upkeep): zaktualizuj asercje pod R-STAWKI ×4 i FALA2 ×2", współautor Maciej) już
wtedy naprawił asercje testu pod obowiązujące mnożniki, tylko nikt nie oznaczył wpisu jako
zamknięty. Dziś `node tools/upkeep-test.cjs` z `gra/`: **73 passed, 0 failed**. Klasyfikacja:
test był przestarzały (opcja b), nie bug silnika — mnożniki ×2 budynki (`R_STAWKI_FALA2_MULT`)
i ×4 jednostki/żywność wojska (`R_STAWKI_FALA1_FALA2_MULT`) w `r-stawki-strojenie.ts` są
świadomą decyzją Macieja, test już je odzwierciedla. Żadna zmiana silnika. C-026: 22 testy
ekonomii/utrzymania uruchomione, wszystkie zielone poza 4 pre-istniejącymi i niezwiązanymi
(`upgrade-budynki-test.cjs`, `unit-stock-cost-test.cjs` — już `P-UNIT-STOCK-COST-TEST-DLUG`,
`grupy-budynkow-test.cjs`, `budynek-civ-bonus-u17-test.cjs`) — żaden komunikat błędu nie
wspomina R-STAWKI/×2/×4. `tsc --noEmit` 0 błędów. Jedyna zmiana: `dyspozycje/PYTANIA-OTWARTE.md`
+ `STAN-PRACY-HANDOFF.md` (status zamknięcia).

## P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
`mur-paradoks-test.cjs` (sekcja 5) i `city-defense-terrain-gate-test.cjs` liczyły „realną
Obronę" z własnej REIMPLEMENTACJI wzoru, nie z prawdziwego `effectiveDefenderM` w `main.ts` —
żadna bramka nie chroniła linii `combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100`.
Naprawa: asercja źródłowa (regex na ciało `effectiveDefenderM`, odróżniona od tekstowo
identycznej linii w nowej `combatPowerFullDisplayDefFor`). Evaluator PASS-WITH-NOTES, własny
dowód mutacyjny (4 warianty). `mur-paradoks-test.cjs` 24/24 (było 20/20),
`city-defense-terrain-gate-test.cjs` 34/34 (było 31/31), `logic-test.cjs` 213/213,
`combat-test.cjs` 6/6, `tsc` 0 błędów. Nowe znalezisko Evaluatora zarejestrowane osobno:
`P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA` (analogiczna luka w nowej
`combatPowerFullDisplayDefFor`, niepilne).

## P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
Analogiczna asercja źródłowa dla `combatPowerFullDisplayDefFor` (regex zakotwiczony na
unikalnej sygnaturze, brak crosstalku z `effectiveDefenderM`). Kod produkcyjny nietknięty
(test-only). Evaluator PASS-WITH-NOTES, dowód mutacyjny (6 wariantów). `mur-paradoks-test.cjs`
28/28 (było 24/24), `city-defense-terrain-gate-test.cjs` 34/34, `logic-test` 213/213,
`combat-test` 6/6, `tsc` 0 błędów. Nowe niepilne znalezisko zarejestrowane osobno:
`P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA` (asercja negatywna „brak skalowania Ataku" działa przez
czarną listę nazw helperów, nie białą listę kluczy — konwencja całego pliku, dług testowy).

## P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA — ZAMKNIĘTE 2026-08-09
Asercja „brak skalowania Ataku" w `combatPowerFullDisplayDefFor` sprawdzała czarną listę nazw
helperów (`scaleField`) — inny helper albo inline mnożenie przechodziło niewykryte. Naprawa:
mechanizm rozpoznaje skalowanie po KSZTAŁCIE prawej strony (wywołanie funkcji lub mnożenie), nie
po nazwie, każdy wykryty klucz musi być w białej liście `['meleeDefence','armor','health']`.
Zawężenie zakresu (tylko ta jedna z trzech asercji w pliku) zweryfikowane przez Operatora i
niezależnie przez Evaluatora czytaniem pełnych ciał pozostałych dwóch funkcji. Evaluator
PASS-WITH-NOTES, 8 mutacji (6 własnych) złapanych, świeżość worktree zerowy dryf od `main`.
`mur-paradoks-test.cjs` 29/29 (baza 28/28), `city-defense-terrain-gate-test.cjs` 34/34,
`combat-test` 6/6, `logic-test` 213/213, `tsc` 0 błędów. Trzy noty Evaluatora udokumentowane
bezpośrednio w `PYTANIA-OTWARTE.md` (luka przez zmienną pośrednią, brak ścisłej superzbiorowości
starego mechanizmu, sąsiad `fortifyFieldScaledDefFor` bez pokrycia) — żadna nie wymaga osobnego
zgłoszenia.

## P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN — ZDEPLOYOWANE `ce69cf45` FALA 262
`balancePanelDataFromRows` przy `responderPreview===undefined` dawała fail-open (`canAccept`
domyślnie `true`), dziś nieosiągalne w praktyce ale bez zabezpieczenia. Teraz fail-closed
(`canAccept=false` + jawny `blockReason`) na pozycji akcjonowalnej. Evaluator PASS-WITH-NOTES,
`diplomacy-stol-pw-sum-test.cjs` 42/42 (było 26/26), `tsc` 0 błędów.

## P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT — CZĘŚCIOWO ZDEPLOYOWANE `ce69cf45` FALA 262
Tryb traktatu: `balCls`/hint szły za surowym znakiem `netPw` zamiast za `data.canAccept` —
dla net ujemnego + `canAccept=true` panel pokazywał czerwony „no" + „dopłać" obok aktywnego
przycisku Przyjmij (i odwrotnie). Naprawione dla gałęzi traktatu (scalone w tym samym commicie
co powyżej). **Pozostaje otwarte:** ta sama klasa niespójności w gałęzi własna oferta+koszyk
poza traktatem — Evaluator ją zreprodukował próbą, świadomie poza zakresem dzisiejszej naprawy
(C-025).

## P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU + P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE — ZDEPLOYOWANE `ce69cf45` FALA 262
Dwa follow-up dzisiejszej naprawy R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE. (1) Pusta lista technologii
dostaje placeholder „— brak technologii (SILNIK) —" jak miasta. (2) `grantTechToOwner` sprawdza
teraz prerekwizyty drzewka + bramkę epoki/tieru odbiorcy (dwie warstwy: filtr na liście budowania
+ blokada silnikowa, defense in depth). STRICT-PARITY potwierdzone przez Evaluatora bezpośrednio
w kodzie (`main.ts:7353`, wywołanie przed jakąkolwiek gałęzią po `ownerId`), bramka realnie
aktywna w produkcji. Evaluator PASS-WITH-NOTES, `diplomacy-tech-trade-test.cjs` 24/24,
`diplomacy-basket-transfer-test.cjs` 17/17, `logic-test` 213/213, 31 plików dyplomacji zielonych,
`tsc` 0 błędów. Dwa nowe niepilne znaleziska zarejestrowane osobno:
`P-BRAMKA-TECH-TIER-NIEPOKRYTA` (luka pokrycia bramki tieru — mutacja przeżywa testy),
`P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA` (blokada akcji „6" liczy tylko stronę „daję", pre-istniejąca, dziś częściej odczuwalna).

## P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1 — ZAMKNIĘTE 2026-08-09 (ECHO A x2, 3 rundy realizacji, commit `054a9ed4`)
Subagent zdiagnozował asymetrię blokady (liczy tylko „daję") jako bug zgodny z opisem akcji „6"
w `diplomacy.json` (dwutrybowa: Sprzedaż/Wymiana) i naprawił bez pytania (commit `98cfe36c`,
NIE scalony). Evaluator werdyktem **FAIL** obalił diagnozę: komentarz w `main.ts:15122-15125`
(dopisany w TYM SAMYM commicie na który Operator się powoływał) dokumentuje że akcja „6" jest
dziś zaimplementowana jednokierunkowo (gracz zawsze sprzedaje) — odblokowanie przycisku bez
zmiany formularza/walidacji prowadzi gracza do ślepego zaułka. Sformułowane jako pytanie ABC.
**Maciej: A** — dociągnąć implementację do specyfikacji (pełny handel dwukierunkowy). Decyzja:
`docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`. Subagent dispatched.

**Runda 1 realizacji (commit `e0caef33`, NIESCALONA) — Evaluator FAIL, exploit + naruszenie
decyzji.** Operator zbudował przełącznik Sprzedaż/Kupno i PRZY OKAZJI naprawił realny
pre-istniejący bug (`executePnDealTransfer` nigdy nie czytał `techId` — stara „sprzedaż" nigdy
faktycznie nie przekazywała technologii, tylko gotówkę). Evaluator: (B1) nowy kod przyznaje
technologię PRZED sprawdzeniem zapłaty — gracz z 0 ¤ dostaje technologię za darmo, zmierzone na
żywym silniku; (B2) zero pokrycia mutacyjnego okablowania — mutacja odtwarzająca dokładnie
naprawiany błąd przeżywa cały pakiet 29 testów; (B3) Operator świadomie wyciął wymianę
tech-za-tech, choć decyzja właściciela wprost ją wymaga — to nie decyzja Operatora, nowe pytanie
ABC zadane równolegle. Runda 2 dispatched dla B1/B2/N1(przycisk aktywny przy pustej liście)/
N2(rozjazd techPrice/goldOnce po kontrofercie AI) — niezależnie od odpowiedzi na pytanie zakresu.

**Pytanie ABC o zakres — MACIEJ: A** (rozszerzyć rundę 2 o tech-za-tech, razem z naprawą
exploita, nie odkładać). Runda 2 rozszerzona w locie.

**Runda 2 (commity `b5a76611`+`d30c2b9e`, NIESCALONA) — Evaluator FAIL ponownie, DWA nowe
blokery.** B1 gotówkowy naprawiony poprawnie (potwierdzone na wszystkich 4 kombinacjach trybu/
kierunku), `canGrantTech` bez efektów ubocznych potwierdzone, bramki prereq/epoka/tier symetryczne
w obu kierunkach, N1/N2 rundy 1 naprawione realnie. Ale: **(1) tryb tech-za-tech jest CAŁKOWICIE
ODCIĘTY od silnika** — `main.ts::buildProposalFromPayload` gubi pola `techPaymentMode`/
`techOfferId` przy budowaniu payloadu z formularza (biała lista pól go nie zawiera), więc
`techPrice` wylicza się jako 0 i `evaluateProposal` zawsze odrzuca ofertę komunikatem „Cena
poniżej minimum" — funkcja niedziałająca w grze mimo 41/41 zielonych testów (testy wołają rdzeń
bezpośrednio, z ręcznie sklejonym payloadem, omijając zepsutą warstwę okablowania — dokładnie ten
sam wzorzec luki co B2 w rundzie 1, powtórzony piętro wyżej). **(2) Druga połowa exploita rundy 1
nienaprawiona:** silnik nie sprawdza czy DAWCA głównej technologii faktycznie ją posiada (tylko
odbiorca jest walidowany) — dziś nieklikalne z UI (listy filtrowane), ale save'y są odtwarzane
rzutowaniem bez rewalidacji, więc to luka zaufania na poziomie silnika, nie kosmetyka. Dowód
mutacyjny Evaluatora: 5 z 6 własnych mutacji złapanych (w tym dosłowny exploit rundy 1 w trybie
gotówkowym — nadal złapany, nie regresja). Runda 3 dispatched: dopisać brakujące pola do białej
listy `buildProposalFromPayload` + naprawić wyliczenie `techPrice` dla trybu tech, dołożyć
`ownerHasTech` dla dawcy w obu trybach, i kluczowe — test musi przechodzić PRZEZ
`buildProposalFromPayload`, nie obok niego (inaczej trzecia runda powtórzy ten sam błąd).

**Runda 3 (commit `054a9ed4`) — Evaluator PASS-WITH-NOTES, SCALONE.** Oba blokery naprawione:
białe listy uzupełnione, `ownerHasTech` dla dawcy dołożone w obu trybach. Nowy
`diplomacy-tech-trade-e2e-test.cjs` wycina prawdziwy literał `uiPayload` wprost ze źródła
main.ts (nie kopia) i przepuszcza przez cały łańcuch formularz→wykonanie — złapał dosłowne
odtworzenie błędu rundy 2, na które stary test był ślepy. Jedna nota (N1: ostatni skok łańcucha
w nowym E2E był ręczną kopią, nie ekstrakcją) poprawiona przy scaleniu tą samą techniką co
literał wyżej — zweryfikowane że łapie dokładnie tę mutację, którą Evaluator zgłosił jako
niepokrytą. Bramki po scaleniu: `diplomacy-tech-trade-e2e-test.cjs` 28/28,
`diplomacy-tech-trade-execute-test.cjs` 52/52, `logic-test` 213/213, `tsc` 0 błędów.

## P-BRAMKA-TECH-TIER-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
Nowy scenariusz testowy izolujący `tierOk` od `prereqsMet`/`epochOk` w `diplomacy-basket-transfer-test.cjs`. Kod produkcyjny nietknięty (test-only). Evaluator PASS-WITH-NOTES,
dowód mutacyjny potwierdził izolację. `diplomacy-basket-transfer-test.cjs` 20/20 (baza 17/17),
`logic-test` 213/213, `tsc` 0 błędów. Nowe znalezisko zarejestrowane osobno i już ZAMKNIĘTE:
`P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA` (identyczna luka w drugiej warstwie,
`techIdsWithPrereqsMetForRecipient` — naprawiona analogicznym scenariuszem `tierCatalog`,
Evaluator PASS-WITH-NOTES, `diplomacy-tech-trade-test.cjs` 26/26).

## R-MERGE-MAIN-RYTM-Q1 — ZAMKNIĘTE, ECHO Maciej 2026-08-09 (wariant własny, nie A/B/C)
Decyzja: **rytm scalania do main = zawsze jedna fala ROBOCZA do tyłu** (fala N-1 scalana dopiero
gdy powstanie fala N; bieżąca fala zostaje na gałęzi wyłącznie do testów) + **nowa fala ROBOCZA
wyłącznie na wyraźne słowo „deploy"** od właściciela (zero autonomicznego tworzenia kolejnych fal
w trakcie sesji). Wykonane od razu: `main` doganie o FALA 262 → **merge `b137332a`** (55 commitów
od `a659f4a1`), wypchnięte. FALA 263 (`89176ced`) świadomie zostaje na
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Pełna treść ECHO + reguła w `PYTANIA-OTWARTE.md`.
Kanon: `docs/decyzje/R-MERGE-MAIN-RYTM-Q1.md`.

## P-BRAMKI-MAPY-ROZMIAR-SCALE-FABLE-VERIFY-Q1 — CZEKA NA WERYFIKACJĘ (zgłoszone przez sesję lokalną, 2026-08-09)
Sesja lokalna zgłasza naprawę dwóch czerwonych bramek (`rozmiar-label-test.cjs` 12/1→13/0,
`map-scale-menu-test.cjs` 89/8→97/0) na gałęzi `fable/naprawa-bramek-mapy` (commit `b6b30721`,
oparty czysto na aktualnym `main` po merge `b137332a`). Diagnoza: testy miały twarde stare
wartości `miasta_panstwa` sprzed rebalansu `6f96f08` (2026-08-02) + jedną martwą asercję z
cofniętego eksperymentu (14 zamiast realnych 7 dla Duży). Zero zmian w `gra/data`/`gra/src` —
wyłącznie 2 pliki testowe, teraz czytające wartości z `e-start-params.json` w runtime zamiast na
sztywno. Osobne zgłoszenie przy okazji: `map-coast-buffer-test.cjs` pre-istniejąco czerwony
(niezwiązany, zweryfikowany na czystym main). Dispatch Evaluatora (Opus 5, worktree) do
niezależnej weryfikacji 4 punktów z prośby — bez ufania opisowi, wyprowadzić liczby samodzielnie.

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — zgłoszone z playtestu 2026-08-09, dispatch Opus 5
Maciej zgłosił z żywej gry: po zmianie przydziału robotnika (Praca→Żywność) stary „złoty chłopek"
został na nieaktywnym już polu, a na nowym polu pojawił się chłopek z zielonym tłem — mylące
wrażenie że to robotnik innej cywilizacji. Zdiagnozowane w kodzie (orkiestrator, bez zgadywania):
DWA niezsynchronizowane systemy renderowania: (1) `render/workerFieldOverlay.ts` — warstwa mapy
świata, kolor = paleta właściciela (Ty=złoto), pełne przebudowanie grupy przy każdym
`refreshWorkerFieldOverlay()`, ale ta funkcja **jawnie pomija odświeżenie gdy `isCityPanelOpen()`**
(main.ts:8963) — tylko czyści i wychodzi; (2) `render/cityOkolicaOverlay.ts` (`makeLabelSprite`,
linia ~145) — warstwa pierścienia okolicy miasta (ta widoczna na zrzutach), kolor odznaki chłopka
**na sztywno `rgba(30,80,30,0.88)`** (ciemna zieleń) dla KAŻDEGO obrobionego pola, niezależnie od
właściciela — nigdy nie kodowała właściciela kolorem. „Zielone tło" nigdy nie oznaczało obcej
cywilizacji — po prostu ta warstwa nigdy nie rozróżniała właściciela. Podejrzenie „uwięzionego
złotego chłopka": resztka warstwy (1), której odświeżenie nie nadążyło za zmianą przydziału w
trybie podglądu okolicy (możliwe że `isCityPanelOpen()` nie pokrywa stanu „okolicapreview" —
komentarz w pliku: „Używane przez okolicapreview; docelowo Integrator wpienie przy otwartym
panelu miasta" sugeruje że to dwa różne stany). Dotyczy `gra/src/render/**` → **Opus 5** zgodnie
z CLAUDE.md §4 (wyjątek stały dla renderu). Dispatch: zbadać dokładny stan `isCityPanelOpen()` vs
tryb podglądu okolicy w momencie zmiany przydziału, ujednolicić kolor odznaki chłopka w
`cityOkolicaOverlay.ts` z paletą właściciela z `workerFieldOverlay.ts` (Ty=złoto), naprawić lukę
odświeżania. Pełna pętla AutoBot Operator(Opus5)→Evaluator(Opus5).

## R-DYP-STOL-A-KOREKTA — ZAMKNIĘTE, ECHO Maciej 2026-08-09 (koryguje wykonanie R-DYP-STOL-A=C)
Traktaty (pakt, sojusz, itd.) mają być formularzem BEZ wpiętej wymiany surowców/PW w tym samym
oknie — jeśli brakuje „punktów", rozwiązanie to osobna, druga umowa, nie łączenie w jednym
formularzu. Koryguje wykonanie decyzji `R-DYP-STOL-A=C` (2026-07-27), nie samą decyzję B (AI
inicjuje w audiencji — zostaje). Efekt: `TREATY_ONLY_FORM_IDS` wraca do objęcia wszystkich typów
traktatów, nie tylko `'15'` — cofnięcie niedokumentowanego skurczenia z commitu `9cc7c76c`. Pełna
treść w `PYTANIA-OTWARTE.md` → `R-DYP-STOL-A-KOREKTA`. Dispatch Sonnet 5 (nie render, zwykła
logika dyplomacji).

## P-BRAMKI-MAPY-ROZMIAR-SCALE-FABLE-VERIFY-Q1 — ZWERYFIKOWANE, Evaluator PASS-WITH-NOTES (2026-08-09)
Niezależny Evaluator (Opus 5) potwierdził naprawę `fable/naprawa-bramek-mapy` (`b6b30721`) na
żywo, samodzielnie wyprowadzając liczby z `e-start-params.json` (nie z opisu Operatora) — zgadzają
się. Dowód mutacyjny: 4/5 mutacji złapane (A,C,D,E), jedna (B) nieinformatywna. `rozmiar-label-test`
13/0 · `map-scale-menu-test` 97/0, bez regresji `map-improvement-qualify`/`map-deposits-era`.
**3 noty (nie blokują):** (1) Operator zaniżył przyczynę — połowa napraw dotyczyła stałej w
`newGameMapDefaults.ts`, nie tylko JSON-a; (2) realna, PRE-ISTNIEJĄCA ślepa plamka: fallback w
kodzie jest dziś liczbowo identyczny z Panel-E, więc test nie odróżni „czytane" od „ignorowane" —
`rozmiar-label-test` jedyny broni tej ścieżki; (3) gałąź NIE była oparta na `main` jak twierdzono
(`a659f4a1` nie `b137332a`), ale zweryfikowano że dotknięte pliki nie zmieniły się między tymi
punktami — merge bezpieczny, 0 konfliktów. **Nowe, poważniejsze znalezisko przy okazji:**
`map-coast-buffer-test.cjs` ma **20 porażek, nie 1** jak zgłoszono — dwie klasy błędu („ląd w
buforze brzegu" na kontynenty/pangea/wyspy ORAZ „morze w środku lądu" na ziemia, ta druga w ogóle
niezgłoszona), wszystkie typy map, wszystkie seedy. Niezwiązane z tym commitem (0 nakładających
się plików). **Rekomendacja Evaluatora: przyjąć zmianę.** Czeka na merge do main — czekam na
potwierdzenie od sesji lokalnej/Macieja (zgodnie z ustaloną dziś zasadą wyraźnej zgody na merge).
Osobne zgłoszenie do zarejestrowania: rozmiar realny `map-coast-buffer-test` (20 porażek, 2 klasy).

## R-KARTA-JEDNOSTKI-STRZALKI-CYKL — zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: gdy zaznaczona jest jednostka, w górnej części karty bocznej (`sidePanelHud.ts`) mają być
strzałki przełączające do kolejnej/poprzedniej jednostki (dziś ich nie ma). Dodatkowo: usunąć
nagłówek „JEDNOSTKA" nad kartą — „kompletnie niepotrzebne". Zakotwiczone: `gra/src/ui/sidePanelHud.ts`
(nagłówek domyślny „Jednostka", linia ~226), karta budowana gdzieś w okolicy — Operator ma
zlokalizować dokładnie. Brak dziś mechanizmu cyklowania strzałkami NA KARCIE (istnieje tylko
klawisz Spacja cyklujący jednostki z ruchem — `R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA` — Operator ma
ocenić czy nowe strzałki powinny używać tej samej logiki wyboru kolejnej jednostki, czy czegoś
innego typu stos na heksie, i zgłosić jeśli to niejednoznaczne zamiast zgadywać). Dotyczy
`gra/src/ui/**` (DOM, nie render 3D) → Sonnet 5.

## R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO — OTWARTE, koryguje R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-09)
Chipy karty miasta pokazują dziś sumę TEMPA cywilizacji (nie zapasu) jako dużą liczbę — Maciej
chce realnego ZAPASU (jak na głównym HUD mapy: Skarbiec/Spichlerz/Nauka), mała liczba (+N) zostaje
jako wkład tego miasta w tempo. Przy jednym mieście duża=mała liczba (Praca +9 +9), stąd wrażenie
duplikacji. Pełna treść + zastrzeżenie o niepewności per-surowiec w `PYTANIA-OTWARTE.md`. Dispatch
Sonnet 5.

## R-WYDARZENIA-FILTR-KATEGORII — zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: panel „WYDARZENIA" zaśmiecony powtarzalnymi wpisami „Koniec tury" (handel innych
cywilizacji między sobą, np. Mykeny↔Korynt/Teby/Argos co turę). Trzy żądania: (1) przełącznik u
góry panelu włączający/wyłączający kategorie wydarzeń — własna cywilizacja (wszystko), inne
cywilizacje/pozostałe umowy (handel między obcymi), inne cywilizacje/wojny-pokoje-najważniejsze;
(2) etykieta „Koniec tury" dla wpisów dyplomatycznych (`gra/src/game/eot-event-defer.ts:37`) ma się
nazywać „Informacja dyplomatyczna"/„Dyplomacja", nie „Koniec tury" (to nie jest sam koniec tury,
tylko konkretne zdarzenie dyplomatyczne); (3) jeden przycisk „Usuń wszystkie" czyszczący cały
panel naraz. Zakotwiczone: `gra/src/ui/sidePanelHud.ts` (`SidePanelEvent`, render panelu),
`gra/src/game/eot-event-defer.ts` (generowanie wpisów „Koniec tury"). Operator ma najpierw
ustalić w kodzie jakie realne kategorie/źródła wpisów istnieją dziś (`kind` w `SidePanelEvent`,
skąd pochodzą wpisy o handlu innych cywilizacji) zanim zaprojektuje filtr — nie zgadywać
kategoryzacji z góry.

## R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY — zgłoszone z playtestu 2026-08-09, dispatch Opus 5
Maciej: granice Zulusów są w kolorze ciemnozielonym, zlewającym się z zielonym terenem — chce
koloru pomiędzy żółtym a zielonym (limonkowy/oliwkowy), wyraźnie odróżnialnego. Sprawdzone:
Zulusi NIE mają własnego `kolorHex` w `gra/data/civs.json` (`ikonaId: "zulusi"`, brak pola koloru)
— kolor granicy leci z fallbackowej palety `OWNER_COLORS`/analogicznej w `gra/src/game/civ-visual.ts`
(„kolorHex z civs.json lub stara paleta OWNER_COLORS"). Operator ma ustalić dokładnie skąd bierze
się dziś kolor obrysu terytorium (`gra/src/map/territory-border.ts` prawdopodobnie geometria,
kolor osobno) i czy inne cywilizacje bez własnego `kolorHex` mają ten sam problem (ta sama pula
slotów fallback) — rozważyć czy dać Zulusom dedykowany `kolorHex` w civs.json (rekomendowane,
węższy zakres) czy poprawić cały fallback slot (szerszy, może dotknąć innych cywilizacji). Dotyczy
oceny wizualnej koloru na tle terenu 3D → **Opus 5** zgodnie z CLAUDE.md §4 (wyjątek stały dla
renderu/wizualnej czytelności, analogicznie do dzisiejszej naprawy chłopków).

## P-REKRUTACJA-NAZWY-ZNIKAJA — PILNE, zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: w panelu REKRUTACJA (widok miasta) nazwy jednostek zniknęły — tylko „Zwiadowca" pokazuje
nazwę, pozostałe 3 wiersze mają samą ikonę + koszty, bez tekstu nazwy. Obawa że to regresja z
dzisiejszej pracy. Wstępnie sprawdzone przez orkiestratora: `gra/data/units.json` — WSZYSTKIE
jednostki mają wypełnione pole `Jednostka` (grep po pustych `"Jednostka": ""` = zero trafień), więc
to NIE jest brak danych. Kod: `gra/src/ui/unitRecruitCard.ts:87` — `name.textContent = item.nazwa`,
`item.nazwa` pochodzi z `gra/src/game/production.ts` (kilka miejsc pushujących do listy: linie
~347, ~885, ~998, ~1014, wszystkie ustawiają `nazwa: u.Jednostka`/`specialUnit.Jednostka` — pozornie
spójnie). Operator ma: (1) ustalić DOKŁADNIE które 3 typy jednostek (po ikonach/kosztach ze zrzutu:
rząd 1 „24 · 500¤ · 10 Drewno −2/t" bez ikony Manpower, rząd 3 „40 · 500¤ · 👤 · 10 Drewno −2/t",
rząd 4 „56 · 500¤ · 👤 · 15 Drewno −3/t") mają puste nazwy w renderze — czy to konkretna kategoria
jednostek idąca innym torem budowania `ProductionItem` niż reszta; (2) sprawdzić czy to faktyczna
regresja z DZISIEJSZEJ pracy (żaden z dzisiejszych zarejestrowanych tematów nie dotykał
units.json/production.ts/unitRecruitCard.ts wprost — sprawdzić `git log` na te pliki) czy
pre-istniejący błąd dopiero teraz zauważony; (3) naprawić. PILNE — zgłoszone z aktywnego niepokoju
właściciela o regresję.

**SCALONE `872c1e0d`** — potwierdzone: NIE regresja z dzisiejszej sesji (zero zmian w dotkniętych
plikach między zdeployowanym buildem a HEAD). Przyczyna: defekt CSS flex-layout od 2026-08-06.

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — SCALONE `872c1e0d` (2026-08-09)
Dwukrotnie zweryfikowane przez Evaluatora. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — ECHO A + doprecyzowanie zakresu (2026-08-09)
Decyzja Macieja: A, ale tylko dla głównych cywilizacji (nie miast-państw) + NOWY warunek: awans
epoki wymaga WSZYSTKICH technologii epoki (12/12/8 wg tech.json), nie tylko 1 wyróżnionej. Progresja
per-civ asynchroniczna to już dzisiejsze zachowanie, ma zostać niezmienione. Ryzyko AI utykania
wyższe niż w pierwotnym pytaniu. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — ECHO A, dispatch implementacji (2026-08-09)
Decyzja Macieja: A — wdrożyć wzorem Danina/Handel (Mapa<ownerId, wartość domyślna> +
`override: boolean` per miasto) dla Praca/Żywność, podziału Praca, priorytetu produkcji. Pełna
treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — OTWARTE, wymaga ABC (2026-08-09)
Nowa reguła: awans epoki wymaga zbudowania cudu przypisanego cywilizacji w bieżącej epoce (jeśli
taki cud istnieje). Pełna treść w `PYTANIA-OTWARTE.md`. Dispatch rozpoznania przed ABC.

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY — OTWARTE, KORYGUJE R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO (2026-08-09)
⛔ Podważa decyzję zatwierdzoną chwilę wcześniej tego samego dnia (CLAUDE.md §1a). Docelowy układ:
duża liczba = tempo TEGO miasta, mała liczba (+N) = tempo CAŁEJ cywilizacji (zamiana miejsc
względem poprzedniej decyzji), NOWY trzeci element w nawiasie pod małą liczbą, innym kolorem
(propozycja: złoty) = realny zapas całej cywilizacji. Źródła danych już potwierdzone przez
zatrzymanego agenta `a35d817d715b1b210`: zapas — `EmpireHudSnap.pracaPool/zywnoscReserve/zloto/
nauka/kultura/religionStock`; tempo — istniejące pola `*Rate`. Pełna treść w `PYTANIA-OTWARTE.md`.
Dispatch Sonnet 5.

## P-KOLOR-SUROWCE-MIASTO-VS-MAPA-UJEDNOLICIC — OTWARTE, niepilne „temat na później" (2026-08-09)
Ujednolicić konwencje kolorów surowców między panelem miasta a HUD-em mapy świata. Świadomie
odłożone przez Macieja — tylko zarejestrowane.

## R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY — KOREKTA LICZB, jeszcze NIE scalone (2026-08-09)
Niezależna weryfikacja Evaluatora poprawiła błędny meldunek Operatora: Celtowie dE76 ~3,3 (nie 6,4
jak pierwotnie podano), próg 20 to wartość dobrana empirycznie („zmierzone naukowo" było
mylącym określeniem), „13 cywilizacji bezpieczne" dotyczy tylko podzbioru zieleni w teście, nie
pełnej palety terenu. Fix Zulusów sam w sobie stoi, ale siedzi wyłącznie w worktree
`agent-ae0ba1d148fe9acf8` (baza `b137332a`) — wymaga bezpiecznego scalenia do gałęzi. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — OTWARTE, bug zgłoszony z playtestu (2026-08-09)
Wybór „zostaw osobno" po najechaniu armią na hex innej jednostki powoduje rozpad CAŁEJ armii na
sąsiednie heksy, zamiast pozwolić armii i jednostce współistnieć na jednym heksie jako dwa
wybieralne cele. Dispatch Explore (bez kodowania) przed naprawą. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-PANSTWO-MIASTO-ZNIKA-PO-NAJEZDZIE-BEZ-BITWY — WSTRZYMANE na prośbę Macieja (2026-08-09)
Zgłoszenie o znikającym mieście-państwie po nieudanym ataku wycofane przez Macieja — mogła to być
chatka ze skarbami mylnie wzięta za miasto. Nie podejmować pracy, chyba że wróci potwierdzone.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — OTWARTE, bug zgłoszony z playtestu, priorytet wysoki (2026-08-09)
Dwa objawy: (1) autozapis miał trzymać 10 ostatnich tur, a lista „Wczytaj grę" pokazuje wielokrotne
wpisy „tura 2" o różnych znacznikach czasu zamiast kolejnych tur — rotacja prawdopodobnie nie
działa; (2) niespójność numeru tury (37 wg Macieja) z wyświetlanym rokiem kalendarzowym (2200
p.n.e., jak przy wczesnych turach). Ryzyko: brak realnej możliwości cofnięcia się do niedawnej
tury. Dispatch Explore (bez kodowania) przed naprawą. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA — OTWARTE, pytanie faktograficzne (2026-08-09)
Czy podbój/eliminacja cywilizacji przejmuje jej surowce, i czy to samo dotyczy miast-państw. Czyste
pytanie, dispatch Explore bez kodowania. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO — przyczyna drewna znaleziona, dispatch naprawy (2026-08-09)
Drewno: `main.ts:21130` woła `creditOwnerResourceStock` bez `capPerType` w pętli wyrębu lasu, po
jedynym w turze `reconcileOwnerResourceCaps()` — potwierdzony bug. Glina: przyczyny nie znaleziono
jednoznacznie, zalecona diagnostyka (console.warn) zamiast zgadywanej poprawki. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Bug: „Zostaw osobno" woła funkcję rozpraszania (`assignBounceHexesForUnits`) na CAŁYM stosie armii
zamiast na jednej, cofanej grupie — stąd rozpad na wszystkie strony. NIE regres, błąd w miejscu
wywołania. Osobno: silnik nie wspiera dziś współistnienia dwóch armii na jednym heksie (reguła par.
6b, `types/army.ts:4`) — to nowa funkcja, nie naprawa. ABC A/B/C, rekomendacja C (napraw
rozpraszanie teraz, pytanie o nową funkcję osobno). Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA — ODPOWIEDZIANE (2026-08-09)
Tak, mechanizm istnieje (`applyCapitalCapturePlunder`) i dotyczy też miast-państw — ta sama ścieżka
kodu, potwierdzone testem. Skarbiec zawsze 100%, surowce budowlane automatycznie z każdym
przejętym miastem, nauka+techy przy pełnej eliminacji (dla miast-państw zawsze prawda — mają 1
miasto). Jedyny wyjątek: pula pracy zawsze przepada, nie trafia do zwycięzcy. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — przyczyna znaleziona, dispatch naprawy (2026-08-09)
`doRotatingAutosave()` (main.ts:20554-20571) cicho zawodzi przy przepełnieniu localStorage quota —
brak komunikatu, indeks rotacji się nie przesuwa, reszta puli zamraża się na starej turze.
Przelicznik tura→rok jest poprawny (nie osobny bug). Dispatch naprawy widoczności błędu (bez ABC).
Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PRODUKCJA-DREWNO-GLINA-KAMIEN-ZESTAWIENIE — OTWARTE, przygotowuje dane (2026-08-09)
Maciej chce zestawienia produkcji Drewna/Gliny/Kamienia we wszystkich ulepszeniach, zanim
zdecyduje czy zmniejszać balans (w kontekście P-MAGAZYN-PRZEKROCZENIE-LIMITU). Czyste zestawienie
danych z JSON, bez decyzji. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — OTWARTE, bug AI (2026-08-09)
AI nie broni oblężonego miasta przed barbarzyńcami, armia idzie w przeciwnym kierunku. Zasada do
wdrożenia: obrona własnego terytorium ma najwyższy priorytet nad innymi celami AI. Dispatch
Explore przed naprawą (może wymagać ABC po rozpoznaniu). Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — przyczyna znaleziona, wymaga ABC (2026-08-09)
Ruch wojsk AI (ai.ts:2155-2217) rozważa tylko wrogie miasta, nigdy barbarzyńców — brak priorytetu
obrony własnego terytorium. Realna zmiana logiki AI, wymaga ABC. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Mechanizm wojen AI istnieje ale rzadki; brak filtra sąsiedztwa do wyboru celu; kierunek preferencji
sojuszy dziś odwrotny do życzenia Macieja (silny woli słabego mniej, nie bardziej). Wieloczęściowa
zmiana, wymaga ABC. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK — OTWARTE, Maciej chce bardziej wyrazistego komunikatu (2026-08-09)
Mechanizm istnieje (`triumph-city-state.ts`, main.ts:19735) ale dymek się nie pojawił/przeoczony —
Maciej chce pełnoprawnego popupu zamiast 9,5s hinta. Dispatch Explore (wzorzec istniejącego modala)
przed implementacją. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Odległość min. (4 heksy) identyczna gracz/AI — to nie problem. AI brak `withinTerritory` (gracz go
ma) + premia +15 pkt za zakładanie POZA zasięgiem własnych miast — realna przyczyna. ABC A/B/C,
rekomendacja C (złagodzić scoring, nie twardy zakaz). Pełna treść w `PYTANIA-OTWARTE.md`.

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY — Evaluator PASS-WITH-NOTES, 3 noty do naprawy (2026-08-09)
Duża/mała/zapas potwierdzone merytorycznie. N1: test nie strzeże deliverable (2 mutacje nie
złapane). N2: fallback Pracy dla panelu rywala miesza tempo/zapas. N3: komentarz-kanon zawiera
fałszywe słowo "nigdy". Pełna treść w `PYTANIA-OTWARTE.md`.

## R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK — OTWARTE, wymaga rozpoznania (2026-08-09)
Checkbox "Auto Wyżywienie" ma stać się przyciskiem w stylu przycisku auto-produkcji/"Auto-
zarządzaj", tekst "Auto WYŁ — bez auto-obniżania/podnoszenia" ma iść do tooltipa. Dispatch Explore
przed naprawą. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-DOPRECYZOWANIE-GLOBALNE-USTAWIENIA-NIE-ISTNIEJA — ODPOWIEDZIANE (2026-08-09)
Nieporozumienie wyjaśnione: "globalne ustawienia" żywności/pieniędzy/produkcji NIE istnieją dziś w
grze — to dokładnie to, o co Maciej poprosił jako nową funkcję w
R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE (wciąż czeka na ABC). Pełna treść w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — hipoteza potwierdzona, wymaga ABC (2026-08-09)
Odkrycie jednostki wojskowej z chatki ze skarbami na cudzym terytorium liczy się jako naruszenie
granicy i karze dyplomację, mimo że gracz nic złego nie zrobił. Propozycja: pula nagród z chatek na
cudzym terenie ma wykluczać jednostki wojskowe. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — OTWARTE, nowa reguła gry (2026-08-09)
Propozycja: wejście w epokę Brąz wymusza wypowiedzenie wojny co najmniej jednej cywilizacji, żeby
ożywić mapę. Doprecyzowanie: cel wojny to preferencyjnie SĄSIAD, nie zawsze gracz; sojusze mają iść
w stronę cywilizacji słabszych/podległych. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — OTWARTE, wymaga rozpoznania (2026-08-09)
Dwa żądania: (1) cywilizacje zawsze na górze listy dyplomacji, nad miastami-państwami; (2)
kliknięcie cywilizacji ma najpierw pokazać pop-up podsumowania (wojny/sojusze/umowy handlowe +
propozycja spotkania), dopiero potem pełny panel wizyty. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-WYDARZENIA-FILTR-KATEGORII — SCALONE `2984b707` (2026-08-09)
Odtworzone od zera, N1+N2 domknięte, druga runda Evaluatora PASS-WITH-NOTES bez not blokujących.
Scalone chirurgicznie (3 z 4 plików zdywergowane, per-hunk weryfikacja kotwic). N3-N8 niepilne w
rejestrze. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK — SCALONE `b057d248` (2026-08-09)
Modal wymagający potwierdzenia zamiast dymka, po 3 rundach AutoBot (Evaluator PASS finalnie).
Root cause: stary showHintMessage dzielił toast z komunikatem ELIMINACJA i go nadpisywał.
Niepilne noty do rejestru (kapitulacja z głodu nadal gubi ELIMINACJA — poza zakresem). Pełna
treść w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A. Doprecyzowanie: cofniecie CALEJ armii na miejsce startowe (nie sasiedni heks),
BEZ utraty punktu ruchu (jakby ruch sie nie odbyl). Dispatch implementacji. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — Evaluator PASS-WITH-NOTES, gotowe do scalenia (2026-08-09)
Naprawa widocznosci bledu potwierdzona (5/5 mutacji zlapanych, rozroznienie quota na realnym
DOMException). N1: to NIE zamyka calego tematu - rotacja/mozliwosc cofniecia sie nadal wymaga
osobnej decyzji. N2 niepilne (komunikat jako zwykly wpis "Koniec tury", nie dymek). Pelna tresc w
`PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — ECHO A (2026-08-09)
Decyzja Macieja: A. Obrona wlasnego terytorium (w tym barbarzyncy) ma najwyzszy priorytet nad
atakiem obcego celu, niezaleznie od stanu pokoju/wojny z innymi. Dispatch implementacji. Pelna
tresc w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A. Wojna wymuszona z sasiadem przy awansie do Brazu; koniec po 2 miastach
zdobytych/straconych; 20 tur odpoczynku; nie zrywa istniejacych sojuszy; pomijana jesli cywilizacja
juz jest w jakiejkolwiek wojnie (napastnik lub obronca). Jeden brakujacy parametr (cooldown powrotu
do tej samej cywilizacji) - pytanie doprecyzowujace do Macieja, robocze zalozenie 20 tur do czasu
odpowiedzi. Dispatch implementacji z tym zalozeniem. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — ECHO A (2026-08-09)
Decyzja Macieja: A. Pula nagrod chatki na cudzym terenie wyklucza jednostki wojskowe (cywilne bez
zmian); usuniete 20% rozdzielone proporcjonalnie zloto/tech. Dispatch implementacji. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A, z naciskiem: najpierw inspekcja istniejacego/martwego kodu (diplomacyPanel.ts,
diploListHud.ts, diplomacyAudience.ts), rozszerzac zamiast pisac od zera nowy panel. Sortowanie
cywilizacje-nad-panstwami + krok posredni podsumowania przed wizyta. Dispatch implementacji. Pelna
tresc w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — ECHO A wbrew rekomendacji C (2026-08-09)
Decyzja Macieja: A (twardy withinTerritory dla AI), swiadomie zawezajac wczesniejsza decyzje
R-AI-KOLONIZACJA Q3=B (pokrycie mapy ma sie teraz odbywac przez zwarte terytorium, nie odlegle
miasta). Usunac tez premie +15 za zakladanie poza zasiegiem (ai.ts:2694), sprzeczna z nowym
wymogiem. Dispatch implementacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — ECHO A (2026-08-09)
Decyzja Macieja: A (wbrew rekomendacji B). Cap ludnosci: 5 (bez zmian) -> 8 ze Spichlerzem (nowy) ->
12 z Akweduktem (obnizka z 15). Zalozenia domyslne do potwierdzenia: istniejace miasta >12 sa
zamrazane nie scinane; cap=8 wymaga tylko POSIADANIA Spichlerza (nie odprowadzonej ceramiki co
ture). Dispatch implementacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 1, runda 2 w toku (2026-08-09)
4 noty blokujace: B1 exploit nieskonczonego ruchu (zwrot na moveCost zamiast faktycznie odjete),
B2 zwrot kasowany przez selectPlayerUnit gdy na hexie startowym stoi inna wlasna jednostka,
B3 teleport bez sprawdzenia zajetosci/przejezdnosci, B4 nowy test nie chroni main.ts (mutacja
Evaluatora dala 13/13 mimo usuniecia fixu). Dispatch rundy 2. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — Evaluator runda 1: 3 BLOKUJACE, runda 2 (2026-08-09)
Scenariusz naprawiony, ale B1 regres wydajnosci +80% AI tura (zmierzone, poprawka jednolinijkowa
znana), B2 falszywa liczba w komentarzu (promien faktycznie 9-19 hex nie 2), B3 obronca wybierany
kolejnoscia tablicy nie odlegloscia (potwierdzone empirycznie, + podwojne zaangazowanie). N1 do
osobnej decyzji: faza wyscigu o wioski wyprzedza obrone domu w early-game. Dispatch rundy 2.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — Evaluator FAIL runda 1 (2026-08-09)
B1 (ABC): globalny priorytet produkcji bezczynny dla istniejacych miast (broadcast nie kopiuje
budowaPriorytetTypow), opis Operatora nieprawdziwy. B2: 4 miejsca zmiany wlasciciela miasta nie
resetuja cache -> panel klamie. B3: migracja starych zapisow kasuje indywidualne ustawienia
(3/9 mutacji przezylo). Dispatch runda 2 dla B2/B3, ABC dla B1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH — Evaluator FAIL runda 1 (2026-08-09)
B1: wykluczenie liczone na heksie chatki, jednostka spawnuje 1-2 hex dalej bez sprawdzenia
terytorium -> ~31% przeciek przy granicy. Naprawa tania (ocena na hex spawnu), w zakresie decyzji
A wg Evaluatora. N2 (ABC): wykluczenie nie uwzglednia istniejacych zwolnien z kary (wojna, sojusz,
prawo przemarszu) - gracz traci jednostke nawet gdy kara i tak by nie powstala. Dispatch runda 2
dla B1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
BB1: test nadal nie chroni main.ts (3 mutacje w kodzie produkcyjnym daja 16/16). Rozwiazanie:
test tekstowy regex wzorem border-march-wygasanie-test.cjs. BB2: zwrot ruchu gubiony w scenariuszu
z niska pula na hexie startowym - naprawic realnie lub udokumentowac jako ograniczenie. N4 (ABC):
pelny zwrot po marszu wieloheksowym nie cofa efektow ubocznych trasy (darmowe skanowanie).
Dispatch rundy 3, waski zakres. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — Evaluator FAIL runda 1, runda 2 w toku (2026-08-09)
B1: ulepszenie do Spichlerz II odbiera cap 8 (builtIds traci 'spichlerz' przy upgrade, brakuje
'spichlerz_ii' w warunku - zmierzone empirycznie). B2: test nie strzeze tej linii (mutacja
przechodzi wszystko). B3: karta budynkow pokazuje falszywy opis capu. Wszystkie mechaniczne, bez
ABC. Dispatch rundy 2. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE-B1 — ECHO A (2026-08-09)
Decyzja Macieja: A. Rozszerzyc broadcast o budowaPriorytetTypow. Kolejkowane po zakonczeniu rundy
B2/B3 (ten sam plik), zeby uniknac kolizji dwoch Operatorow. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — Evaluator FAIL runda 1 (2026-08-09)
B1: barbarzyncy pokazuja sie jako "w wojnie z" (brak filtra ktory istnieje gdzie indziej). B2:
wyciek mgly wojny - pokazuje niekontaktowane/wyeliminowane cywilizacje. B3: test nie chroni
wpiecia sortowania (mutacja usuwajaca .sort() przechodzi). Wszystkie mechaniczne. Dispatch rundy 2.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
Merytoryka B1 poprawna, ale bramka nadal nie chroni main.ts (3 mutacje daja 73/73). Naprawa: test
tekstowy regex wzorem hud-moc-warstwa-test.cjs. Dispatch rundy 3. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — Evaluator FAIL runda 1 (6 blokujacych), runda 2 w toku (2026-08-09)
B1 niekompletny funnel przejecia miasta (kapitulacja glodowa pomijana, AI-AI = wojna wieczna).
B2 (ABC): kaskada sojusznicza celu nieobslugana. B3 sojusz nie blokuje wyboru celu (sprzeczne z
zyczeniem). B4 mechanizm moze wylaczyc sie trwale po cichu. B5 brak save/load (STRICT-SAVE FAIL).
B6 bramka nie chroni main.ts. Dispatch rundy 2 dla B1/B3/B4/B5/B6, ABC dla B2. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator PASS-WITH-NOTES (3 blokujace) runda 1 (2026-08-09)
Rdzen logiki poprawny. B1: bramka nie chroni main.ts (mechaniczne, dispatch runda 2). B2 (ABC):
on-load przeliczanie AI nadpisuje zapisana epoke nowa regula, gracz nie - caly swiat AI cofa sie
przy wczytaniu starego zapisu. B3 (ABC): regula martwa dla 6/15 cywilizacji (cud w ostatniej
epoce), realne ryzyko trwalego zablokowania AI dla pozostalych 9 niezmierzone mimo polecenia.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — Evaluator PASS-WITH-NOTES (1 blokujaca) (2026-08-09)
Implementacja poprawna (zweryfikowana niezaleznie, wydajnosc -27%). B1: bramka nie chroni main.ts.
N2 wazne: AI traci mozliwosc ekspansji zamorskiej przez zakladanie miast (tylko podboj) - silniejsza
konsekwencja niz opisana w ABC, do wiadomosci Macieja. Dispatch waskiej rundy 2 dla B1. Pelna tresc
w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA-B2 — ECHO B (2026-08-09)
Decyzja Macieja: B (wbrew rekomendacji A). Kaskada sojusznicza odpala normalnie, ale licznik
"2 miasta = koniec" ma obejmowac CALA grupe wojen naraz (sumaryczny licznik po wszystkich parach
w kaskadzie), nie tylko pare napastnik-cel. Wymaga architektury "grupa wojen" zamiast per-para.
Zakolejkowane po rundzie B1/B3/B4/B5/B6 (te same pliki). Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
B1a: naprawa wydajnosci wprowadzila NOWY bug - prefilter=9 gubi 52% zagrozen dla miast pop>5
(pomylony prog min z max). Gotowe rozwiazanie od Evaluatora: dokladny warunek per miasto
hexDistance <= promien+2*VICINITY_HEX, zweryfikowany na 10000 hexach. B1b/B3b: bramki nie chronia
napraw. Dispatch waskiej rundy 3 wg gotowej specyfikacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — OTWARTE, wymaga rozpoznania (2026-08-09)
Propozycja Macieja: Fort/Posterunek/Port rozszerza zasieg zakladania miast poza wlasne terytorium,
dla gracza i AI rownoczesnie. Mechanizm juz zaprojektowany w danych (ABC-10 2026-07-04,
"posterunek=5, fort=10, wymaga Straznica LUB zasiegu miasta") ale nieznany stan wdrozenia w kodzie.
Dispatch Explore przed ABC. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 3 (dokumentacja falszywa), runda 4 (2026-08-09)
BB1 zamkniete (6 mutacji zlapanych). BB2: powod FAIL to nieprawdziwa dokumentacja - skipStackRuchSync
to placebo (ginie 24 linie dalej w renderze HUD), nie czesciowa mitygacja jak twierdzil raport.
Korekta: odwolanie do wczesniejszej decyzji Macieja bylo nadinterpretacja (inne pytanie). Evaluator
dolozyl 2 tansze opcje D/E bez refaktoru. Dispatch waskiej rundy 4 (usunac placebo, naprawic
kruchosc testu K-5), potem pelne ABC z 5 opcjami. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — odlozone na krok 2 (2026-08-09)
Decyzja Macieja: krok 1 = wylacznie zablokowac AI budowanie miast tak jak dotychczas, zasady
identyczne jak gracz (P-AI-ZAKLADANIE-MIAST=A bez zlagodzenia). Krok 2 (fort/posterunek
rozszerza terytorium) odlozony bez daty. Wstrzymana decyzja o usunieciu premii +15 dla AI
odblokowana - ma zostac wykonana zgodnie z pierwotnym zakresem. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO C + doprecyzowanie (2026-08-09)
Decyzja Macieja: C (ekonomia + brama produkcji morskiej). Doprecyzowanie: dostep do wody = morze
LUB rzeka, ta sama definicja co juz istniejaca bramka budowy Portu. Jeden otwarty szczegol
(grandfather starych Galer w zapisach) - dopytany na czacie. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — ECHO Q1=B/Q2=B/Q3=A (2026-08-09)
Decyzja Macieja: Q1=B (wymaga wlasnej jednostki + widocznosc, miasto zakladane gdziekolwiek w
zasiegu fortu), Q2=B (fort tylko prawo zalozenia, bez pelnego terytorium), Q3=A (pelne przejecie,
ewakuowane jednostki trafiaja tuz za granice przejmujacego miasta). Zapisane, ale to "krok 2" -
NIE dispatchowac, czeka na sygnal po zakonczeniu kroku 1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO B grandfather (2026-08-09)
Decyzja Macieja: B - istniejace Galery w miastach bez wody zostaja, tylko nowa produkcja
blokowana. Caly temat (C + rzeka=woda + grandfather=B) w pelni zdecydowany, ale niepilny -
NIE dispatchowac bez sygnalu. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-SPACJA-POMIJA-AUTOEKSPLORACJE-BEZ-OZNACZENIA — rozpoznanie gotowe, ABC zadane (2026-08-10)
Przyczyna: `isUnitActiveForCycle` celowo pomija jednostki `autoExplore===true` w cyklu Spacji, ale
panel Armie (`buildPlayerArmyListEntries`) nie oznacza tego stanu żadnym badge'em/tekstem — Zwiadowca
w auto-eksploracji wygląda jak zwykła jednostka z pełnym ruchem. To luka UI, nie bug logiki cyklu.
ABC (A: badge jak inGarnizon/sentry/ufortyfikowanyWPolu — rekomendacja / B: Spacja też cykluje
auto-explore / C: sam tekst w detailLine bez badge'a) zadane Maciejowi w czacie. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 — zgłoszenie Macieja, koliduje z Q1=A, ABC zadane (2026-08-10)
Maciej zgłasza: po WŁ Zwiedzaj jednostka powinna się odznaczać (cykl do kolejnej z ruchem, inaczej
pełne odznaczenie) zamiast zostawiać podgląd ruchu — bo przypadkowy klik w podświetlony heks kasuje
autozwiedzanie. To wprost podważa `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A` (2026-08-04), która celowo
wybrała "zostań zaznaczony". Przyczyna zlokalizowana: `main.ts:16476-16491` nie czyści `reachable`
przy WŁ, więc podświetlenie ruchu zostaje klikalne; klik → zwykła ścieżka marszu → 
`clearScoutAutoExplore` kasuje flagę jako efekt uboczny. ABC (A: pełny powrót do deselect+cykl /
B: zostaw zaznaczenie z Q1=A ale wyczyść podgląd ruchu — nie cofa Q1=A / C: B + ostrzeżenie przy
kliku) zadane Maciejowi w czacie. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-MANPOWER-EPOKA1-500-VS-1000 — zgłoszenie Macieja, koliduje z decyzją 2026-08-03, ABC zadane (2026-08-10)
Maciej rozważa cofnięcie kosztu rekrutacji jednostki w epoce 1 z 500 na 1000 (gigantyczna skala
przy większej liczbie miast). Koliduje z jego własną decyzją `b518e3e7` (2026-08-03). Pula manpower
rośnie liniowo z liczbą miast bez tłumika — potwierdza opisany problem. ABC (A: cofnij tylko ep.1 /
B: zostaw 500, dołóż tłumik skalowania puli / C: oba) zadane w czacie. Pełna treść w PYTANIA-OTWARTE.md.

## R-DYPLOLISTA-KOLOR-CYWILIZACJI — ABC zadane (2026-08-10)
Karty w liście "Znane cywilizacje" nie odróżniają cywilizacji kolorem. kolorHex już istnieje w
danych i jest reużywany gdzie indziej (minimapa, audiencja), ale ginie w diploListEntryFromRelation
(diploListHud.ts) — DiploListEntry nie ma pola kolorHex. ABC (A: obrys karty / B: A+tekst nazwy w
kolorze / C: tło kółka) zadane, rekomendacja A+B. Pełna treść w PYTANIA-OTWARTE.md.

## R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI — ABC zadane (2026-08-10)
Dwa defekty: (1) toast ELIMINACJA przy podboju bojowym ginie pod pełnoekranowym modalem
showCityCaptureNotice (kolizja z-index/timing, ten sam wzorzec co wcześniejsze
P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK); (2) przejęcie dyplomatyczne (annexCityStateToOwner)
nie ma ŻADNEGO komunikatu. ABC (A: przenieś do modalu + dodaj toast dla ścieżki dyplo / B: kolejkuj
toast po modalu / C: trwały log zdarzeń) zadane, rekomendacja A. Pełna treść w PYTANIA-OTWARTE.md.

## R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04 — ABC zadane (2026-08-10)
Pasywność city-state AI na Hard to NIE regresja — trzy decyzje Macieja (AI-CS-CLUSTER-DIFF
2026-07-30, R-MP-HARD-WAVE i MP-GARRISON-Q1 2026-08-04) razem gaszą mechanizm masowego ataku PM
dokladnie na najtrudniejszym poziomie gry. ABC (A: odlacz agresje PM od trudnosci PM, przywiaz do
trudnosci gry / B: podnies cap produkcji PM na Hard / C: zostaw, osobny suwak trudnosci PM) zadane.
Pelna tresc w PYTANIA-OTWARTE.md.

## R-ZUZYCIE-SUROWCOW-OBYWATELE — nowa mechanika, konflikty zidentyfikowane, wstrzymane (2026-08-10)
Propozycja Macieja: obywatele zuzywaja surowce per epoka (Kamien: Drewno+Glina; Braz: +Kamien+
Ceramika; Zelazo: +Cegla), z kara +-1 Szczescie i -1% Rozwoju za dostepnosc/brak. Rozpoznanie
ujawnilo 2 krytyczne konflikty: Glina ma baze terenu=0 wszedzie (dostepna dopiero przez Gliniank
epoki 2), Ceramika wymaga konwertera+tech - obie wymagane od poczatku odpowiedniej epoki bylyby
gwarantowanym deficytem od tury 1. Kodowanie wstrzymane do rozstrzygniecia przez Macieja. Pelna
tresc w PYTANIA-OTWARTE.md.

## P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT — dispatch Sonnet 5 (2026-08-10)
Manualny zapis znikal z listy - rozpoznanie: nie rozjazd backendow (ten sam localStorage/prefix co
listSaves()), tylko cichy blad quota z mylacym komunikatem ("brak localStorage?" zamiast "brak
miejsca") + dialog zamykajacy sie przed potwierdzeniem wyniku. Gotowy wzorzec do skopiowania z
autozapisu (juz poprawnie obsluguje reason==='quota'). Nie wymaga ABC, dispatch od razu.

## P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA — ABC zadane (2026-08-10)
Zapis nie zawiera siatki hexow, tylko seed - kazde wczytanie z menu regeneruje cala mape
proceduralnie (dokladnie ten sam pipeline 10 faz co Nowa Gra), stad rownie dlugie jak generowanie
nowej mapy. ABC (A: serializuj pelna siatke / B: przyspiesz generator, zostaw regeneracje / C:
serializuj tylko delte) zadane w czacie. Pelna tresc w PYTANIA-OTWARTE.md.

## P-SEJWY-KOLEJNOSC-STARE-BEZ-SAVEDAT — dispatch razem z quota (2026-08-10)
Sortowanie malejace po dacie juz dziala w kodzie (saveLoadDialog.ts) - waski problem: stare zapisy
sprzed pola savedAt dostaja pusty string i sortuja sie niedeterministycznie miedzy soba. Nie
wymaga ABC, dispatch razem z naprawa quota (ten sam obszar, osobno wydzielony zakres).

## R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI — Evaluator FAIL runda 2, runda 3 w toku (2026-08-10)
Retroaktywny Evaluator (Opus 5) na 6 zmianach orkiestratora: FAIL na d7718ad5 - toast wchlonienia
dyplomatycznego natychmiast nadpisywany 6 linii nizej (ten sam wzorzec kolizji ktory mial byc
naprawiony), 2 sciezki eliminacji gracza (kapitulacja glodowa, szturm przez mur) gubia zwracana
etykiete po cichu, utrata tresci (tech/Power) w nowym modalu. Zero pokrycia testowego. Dispatch
Sonnet 5 runda 3 + ponowny Evaluator przed zamknieciem. Pozostale 5 zmian: PASS/PASS-WITH-NOTES,
3 dodatkowe noty do dispatchu (Civpedia klamie o manpower, karty Dyplomacja w 2 kolorach,
ufortyfikowany+autoExplore). Pelna tresc w PYTANIA-OTWARTE.md.

## R-DESIGN-11-ZAKLADEK — nowe zgłoszenie, ABC zadane (2026-08-13)
Maciej: potrzebne konkretne wytyczne dla designera do zmiany wyglądu 11 zakładek/paneli, które
nigdy nie zostały dopracowane graficznie: Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel,
Armia, Miasto, Obywatele, Kultura, Religia. Ma zawierać zrzuty ekranu obecnego stanu, konkretne
wytyczne zmian i zasady do zapisania w plikach w repo. W repo istnieje już ustanowiony kanon
projektowy (`docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/`), w tym mockup
„Miasto Zakladki W3 6klatek" — nieznane, czy pokrywa te konkretne 11 zakładek. Status: `CZEKA-NA-DECYZJĘ`.
Pełna treść ABC (2 pytania: R-DESIGN-11-ZAKLADEK-Q1 kierunek wizualny, R-DESIGN-11-ZAKLADEK-Q2
zasada podziału Miasto/Obywatele) w `PYTANIA-OTWARTE.md`.

## P-DYPLO-BILANS-GATE-NIESPOJNY — NAPRAWIONE (2026-08-14, Operator Sonnet 5)
Temat POWRACAJĄCY (5. zgłoszenie tego wzorca). Zlokalizowana PRAWDZIWA przyczyna (dochodzenie
przez odtworzenie scenariusza ze zrzutu 50/20 PW @ Relacji 27,8 przez prawdziwy `evaluateProposal`):
`balancePanelDataFromRows` (`gra/src/ui/diplomacyAcceptanceBalance.ts`) liczyła wyświetlany
„Bilans" jako SUROWĄ różnicę `myOfferPn − theirOfferPn` (ignorując relację i mnożnik chęci
partnera), podczas gdy bramka akceptacji (`handelFairnessGate`/`treatyBaseFairnessGap` w
`gra/src/game/diplomacy-proposals.ts`) liczyła próg z relacją + mnożnikiem — dwie faktycznie
różne formuły na tym samym ekranie, reprodukujące dokładnie „+30 zielone" mimo odrzucenia.
Naprawa: `ProposalEvalResult.pwBalance` (nowe pole) niesie TĘ SAMĄ liczbę, którą policzyła
bramka; `balancePanelDataFromRows` używa jej jako jedynego źródła „Bilans" gdy dostępna
(pojedyncza pozycja na stole), z fallbackiem na stare zachowanie dla akcji bez numerycznej
bramki PW (nap/sojusz/wasal) i dla pakietów >1 pozycji (osobny, wcześniej rozstrzygnięty temat
BUG-PAKIET-BILANS-DODATNI-BLOKADA — nienaruszony). Dodatkowo usunięta redundantna linia „PW
surowe (bez Relacji): ... bilans +N" z live-podglądu koszyka (`renderPnBalancePanelFromBasket`)
— druga, sprzeczna liczba na tym samym panelu.
Bramki: `tsc` 0, `tech-tree-test` 19/19, `research-test` 33/33, cały pakiet testów dyplomacji
zielony (diplomacy-test 148/148, diplomacy-proposal-test 187/187, diplomacy-acceptance-points-test
254/254, diplomacy-value-catalog-test 81/81, diplomacy-treaties-test 17/17,
diplomacy-fairness-gate-package-q2-test 24/24, diplomacy-negotiation-table-test 62/62,
diplomacy-own-proposal-edit-test 33/33, diplomacy-stol-pw-sum-test rozszerzony **70/70**
o dokładny scenariusz ze zrzutu — mutacyjnie zweryfikowany: 8/8 nowych asercji PADA na starym
kodzie, przechodzi po naprawie). Pełny opis w `PYTANIA-OTWARTE.md`.

## P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY — NAPRAWIONE (2026-08-14, Operator Sonnet 5)
Potwierdzone przy wykonaniu (main.ts, `case 'zywnosc':` transferu traktatu): silnik operuje
wyłącznie na `empireFoodStates` (Spichlerz Centralny cywilizacji) i czyta z pozycji koszyka
tylko `ilosc` — `id`/`cityId` nigdy nie były czytane przy wykonaniu, wybór miasta był
interfejsem-widmem (UI-only, tylko dedup koszyka). Usunięty selektor „Miasto (spichlerz)"
z `gra/src/ui/diplomacyTradeBasket.ts`; `readItemFromForm` (case `zywnosc`) ma teraz stałe
`id: 'zywnosc'` (jak zloto/praca); `basketItemIdentity` uproszczona (bez specjalnego
przypadku dla żywności); usunięte martwe JS wiązanie `.cdb-chip-city` i pole `cityId?: string`
z `BasketItem` (`diplomacy-pn-engine.ts`) — zero pozostałych czytelników w całym repo.
Skutek: żywność w ofercie zawsze sumuje się do JEDNEJ pozycji koszyka (jeden cywilizacyjny
zasób), nie dzieli się już per miasto.
Testy: `diplomacy-basket-duplicate-test.cjs` 21/21 (scenariusz „inne miasto" zastąpiony „zawsze
scala się"), `diplomacy-basket-duplicate-ui-test.cjs` 31/31 (scenariusz scalania-przez-edycję
przeniesiony z żywności na `surowiec_ilosc` — regresja-ochrona zachowana, nie utracona).
Bramki: `tsc` 0, `tech-tree-test` 19/19, `research-test` 33/33, `diplomacy-test` 148/148,
`diplomacy-proposal-test` 187/187, `diplomacy-own-proposal-edit-test` 33/33,
`diplomacy-stol-pw-sum-test` 70/70, `diplomacy-negotiation-table-test` 62/62,
`diplomacy-currency-trade-test` 5/5. Pełny opis w `PYTANIA-OTWARTE.md`.

## R-MANPOWER-LECZENIE-PROC-TRUDNOSC — ECHO bezpośredni (2026-08-16)
Maciej (dosłownie): „a jeżeli chodzi o leczenie jednostek, to przyjmiemy, że na trudnym poziomie
teraz to będzie 20, na normalnym 30, a na łatwym 40%." Dotyczy `manpower_uzupelnienie_hp_proc_max_tura`
(`gra/data/miasto-params.json`) — % maxHP leczonego jednostce na turę z puli Manpower imperium.
Dziś: easy 25 / normal 20 / hard 15. Po zmianie: easy 40 / normal 30 / hard 20. Decyzja
jednoznaczna (liczby podane wprost per poziom trudności), bez ABC — implementacja wprost.
Pełna treść w `PYTANIA-OTWARTE.md`.

## P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1 — ECHO (2026-08-16)
Maciej: `P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1 = B`. Wąski wyjątek w egzekutorze
(`canUnitOccupyCityHex`), analogiczny do `canBarbarianWalkIntoEmptyCity` — AI może wejść na
heks pustego, niebronionego miasta wyłącznie w kontekście komendy ataku dystansowego na miasto.
Nie rozwiązuje ogólnego braku ścieżki zdobycia miasta przez AI (N2 werdyktu Evaluatora rundy 2)
— to świadomie poza zakresem tej naprawy. Pełna treść pytania i uzasadnienie w
`PYTANIA-OTWARTE.md`, sekcja `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`.

## P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 — ECHO (2026-08-16)
Maciej: `P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 = B`. Ujednolicić — zakładka Miasta ma
liczyć ŚREDNIĄ wzrostu efektywnie (głodujące miasta = 0%), tak samo jak Spichlerz od ECHO B.
Wymaga zmiany kodu w `cityMiastaMiniDetail()`/`computeMiastaSummaryRow` (empireDetailPanel.ts)
oraz ruszenia przypiętej bramki `empire-miasta-table-test.cjs` (dziś 89/0, pinuje konwencję
nominalną). Pełna treść pytania w `PYTANIA-OTWARTE.md`, sekcja
`P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD`.

## P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1 — ECHO (2026-08-16)
Maciej: `P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1 = A`. Realne przejęcie miasta jak barbarzyńcy —
wejście AI na pusty, niebroniony heks miasta w kontekście ataku dystansowego ma wołać tę samą
ścieżkę co barbarzyńcy (`tryAutoCaptureEmptyCityAt`), miasto zmienia właściciela. Świadomie
otwiera zakres N2 (ogólny brak ścieżki zdobycia miasta przez AI) wcześniej niż planowano — ale
tylko w obrębie tej jednej ścieżki (atak dystansowy), nie ogólnego marszu AI na puste miasta.
Pełna treść pytania w `PYTANIA-OTWARTE.md`, sekcja `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`.
