STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: partia 1 splaty listy B (runda 3, DODATEK). Cel r3: łącznie >= 30 testów zielonych/usuniętych/sklasyfikowanych z adnotacją B. WYNIK: 20 zielonych/usuniętych skumulowanie (13 z r2 + 7 z r3); klasa B bez adnotacji w pliku — NIE osiągnięto 30.
BAZA: origin/web-wip/tdebtb-r2-fc = 4a2d4a225 (zachowane wszystkie zmiany r1/r2). Commit r3: patrz ZMIANY/COMMIT.
ZMIANY/COMMIT: allowlista: gra/tools/eko-tech-paczka1..5-test.cjs, gra/tools/ai-test.cjs, gra/tools/diplomacy-lista-podglad-przed-wizyta-test.cjs, gra/tools/diplomacy-package-ai-counter-actionable-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-PREEXISTING-B-Q1/04-operator-r3.md. Zero zmian w gra/src, gra/data, gra-robocza, WERSJE.md, rust-port. Nazwa raportu: 04-operator-r3.md (nie 01-operator-r1.md, aby nie nadpisać raportu r1).

TABELA (test | klasa | akcja | dowód | przed -> po):
| eko-tech-paczka5 | A | asercja „Kopalnia miedzi + Piec → active Brąz" bez stocku; dodany empireStock.braz; dodana negatywna asercja bez stocku | daacd43a8 DOSTEP-SUROWCE-Q1: Brąz z magazynu, nie z mapy (resource-access.ts:317) | 10/1 -> 12/0 |
| eko-tech-paczka1 | A | fixture Pismo: pełny zbiór technologii (Pismo ma prereq Wymiana + Zasadę 2 epochTierGateMet); T-TECH-8: świątynia NIE jest upgradeFrom (CITY_BUILDING_PREREQ swiatynia:kamienne_kregi, a167fc0b1), mechanizm sprawdzony na spichlerz->spichlerz_ii; Stolarnia: kontekst pól empireActiveResourceLabels/empireResourceStock (stary klucz activeResourceLabels ignorowany; production.ts:491-496) | probe: Pismo true tylko z pełnym zbiorem; buildings.json swiatynia bez upgradeFrom | 6 FAIL -> 13/0 |
| eko-tech-paczka2 | A | popalnia_brazu (usunięte) -> kopalnia_miedzi (485cda5a0); ta sama semantyka ABC-14 | probe: kopalnia_miedzi true/true/false, qualifies true/false/true | 3 FAIL -> 9/0 |
| eko-tech-paczka3 | A | hasBrazAccess dostaje stock {braz:10} (poprzednio Map -> zawsze false, DOSTEP-SUROWCE); Odlewnia brązu: wymóg „Ruda w magazynie państwa" -> empireResourceStock {ruda:50} | probe: odlewnia_brazu bez stocku rudy = false, ze stockiem = true; buildings.json wymagania | 2 FAIL -> 9/0 |
| eko-tech-paczka4 | A | ABC-17: świątynia NIE upgradeFrom (jw.); Model B: bydło na złożu nie odblokowuje (livestock-unlock.ts:111-129 — jedyne odblokowanie stadnina->kon); asercja odwrócona + dodana stadnina->kon | probe: bydlo placed -> []; stadnina na 1,0 -> [kon] | 2 FAIL -> 11/0 |
| diplomacy-package-ai-counter-actionable | A (harness) | predykat z main.ts używa isMe() (main.ts:12996 = ownerId===ME()); harness dostarcza isMe(o)=o===0 | run przed: ReferenceError isMe | crash -> 17/17 |
| diplomacy-lista-podglad-przed-wizyta | A | regex 6e akceptuje też isMe(id) (main.ts:7908, hotseat-poprawne) obok literału id===0 | run: 6e FAIL -> PASS | 1 FAIL -> 0 FAIL (exit 0) |
| ai-test T2c (1 asercja) | A | fallback trudnosc_poziom1_bonus_walka = -0.05 (ai.ts:620 zgodny z ai-params.json wartosc -0.05), nie 0 | ai-params.json:22-25 | 20 FAIL -> 19 FAIL (ai-test nadal czerwony) |
| ai-test T1b/T1c/T3f (4 asercje) | A (wstępnie, NIE przepisane) | model punktacji zmieniony (GROUP_BUILDING_BASE ai.ts:1596 + boost Koszar +110 mid-game ai.ts:2079-2092); stary wzorzec „econ 340 > koszary 300" nieaktualny | kod ai.ts; brak probe | czerwone (NIE_ZMIERZONO rewrite) |
| ai-test T9a/T9c/T9h/T9j, T2S-a/b/b2, T4S-d, T10b (10 asercji) | NIE_ZMIERZONO | decideAIDiplomacy / proposals zwracają [] także dla T9a przy currentTurn 30/60/120/200 (probe); bramka nieustalona | probe scratchpad | czerwone |
| diplomacy-audience-close-flush | B (kandydat) | 5 gołych hideDiplomacyAudience() zamiast 3 nazwanych: main.ts:13160 (__sidePanelLinkTestDebug.closeAll), 27108 i 27749 (hooki testowe closeAudience) poza closeDiplomacyAudienceAndFlush. Zostawione czerwone; NIE zmieniano src | run: [A4] got 5; [A4f] 3 z 5 | 2 FAIL -> 2 FAIL (B) |
| diplomacy-proposal (RUNDA 4, pokój w wojnie) | B (kandydat) | kod nie realizuje decyzji RUNDA 4 (pwBalance nie blokuje pokoju) — r5Gate AI (diplomacy-proposals.ts:1296-1315) i treatyBaseFairnessGap odrzucają; test czerwony | run: 2 FAIL (linie 125-126) | 2 FAIL -> 2 FAIL |
| diplomacy-negotiation-table | NIE_ZMIERZONO | runda 1 „AI składa kontrofertę" — nie analizowane | run: 1 FAIL | bez zmiany |
| empire-armia-produkcja, era-change-toast-defer, era-cud-main-ts-integracja, auto-battle-simultaneous, ai-zdobycie-miasta-adiacencja, ai-fog-test (adnotacja B), mgla-sciezka-inwariant (adnotacja B) | NIE_ZMIERZONO | nieuruszone w tej rundzie (brak czasu/kontekstu) | — | bez zmiany |

BRAMKI:
- tsc --noEmit: EXIT 0, 0 linii wyjścia.
- logic-test: LOGIC OK (213/213).
- git diff --check: czysto.
- Testy nieobjęte zmianą (unit-*, forced-war-*, era-recruit-panel-refresh, ai-jednostki-tylko-zakup) nie uruchamiane ponownie w r3; r2 wyniki bez zmian z definicji (inne pliki).

BLOKADY:
- Klasa B bez adnotacji w plikach (diplomacy-audience-close-flush, diplomacy-proposal, mgla-sciezka-inwariant, ai-fog-test) — wymaga osobnej rundy z adnotacją w nagłówku i wpisem do tematów R-WEB-*.
- ai-test: 19 FAIL (T1b/T1c/T3f wstępnie A, T9*/T2S*/T4S-d/T10b — źródło nieustalone).
- Brak temat R-WEB-* założonego przez Operatora (klasa B tylko wskazana; wymaga decyzji orkiestratora).
- Dysk: start ~4.8 GB wolnego; node_modules w worktree (npm ci --ignore-scripts, 134 MB) usuwany po pracy.

RUNDY: 3/5 (partia 1, runda 3 wg DODATKU)
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje 7 zielonych testów r3 (eko-tech 1–5 + 2 harness) i fixture'y ai-test T2c. Runda 4: ai-test T1b/T1c/T3f (przepisanie wg nowego modelu punktacji) + ustalenie bramki decideAIDiplomacy (T9*) + adnotacje klasy B (audience-close-flush, proposal, mgla, ai-fog) + diplomacy-negotiation-table.
DEPLOY/PUSH: NIE WYKONANO
