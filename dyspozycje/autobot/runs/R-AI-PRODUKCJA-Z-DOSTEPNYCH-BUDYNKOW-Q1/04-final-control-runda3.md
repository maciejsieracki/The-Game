# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Final Control, runda 3/5

**Uwaga proceduralna:** agent Final Control zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa. Runda 3: Spichlerz/Spichlerz II mają być REALNYM, wysokim priorytetem, gdy miasto faktycznie potrzebuje ich, by przełamać sufit populacji — niezależnie od trudności gry.

METODA/GUARD: worktree /home/user/wt-ai-produkcja, HEAD 3dd91190, drzewo czyste. Guard w promptcie podawał oczekiwany HEAD 72a11dfc; `git merge-base --is-ancestor 72a11dfc HEAD`=true, a 3 commity pomiędzy (be88681f/ef7235dd/3dd91190) to dokładnie Operator/Obrona rundy 3 opisane w dispatchu — nieodświeżony snapshot guarda, ten sam precedens co FC rund 1-2. `git diff 72a11dfc HEAD --stat`: wyłącznie ai.ts + 2 raporty rundy 3, zero plików spoza allowlisty, `git diff --check` czysty.

TESTY (odtworzone niezależnie): `tsc --noEmit` 0 błędów. 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6. Chroniony gate `ai-jednostki-tylko-zakup-test` 44/0. `ai-produkcja-pokrycie-katalogu-test` 6/6 (42/42). `ai-threat-mode-test` 12/12. `ai-production-priority-test` 9/9. 4 przedistniejące czerwone identyczne z rundą 2, potwierdzone niezwiązane (handel, nie budynki): ai-balans-step3-test 7/1, ai-praca-split-parity-test 21/1, ai-slider-test 33/5, ai-test 291/4 (FAIL to zaproponuj_handel/T2S-b/T10b). Econ-params.json zweryfikowany bezpośrednio w pliku: akwedukt_prog_ludnosci easy=6/normal=5/hard=4, spichlerz_prog_ludnosci 8/8/8 — dokładnie jak twierdzi Obrona. `DifficultyLevel` ma dokładnie 3 warianty (easy/normal/hard), Record wymaga wszystkich — tsc czysty potwierdza wyczerpanie.

WŁASNE MUTACJE (>5): (1) niezależna 400-turowa proxy-symulacja WŁASNYM scenariuszem (4 miasta, inne id/mapa 24×24, esbuild+prawdziwy buildings.json, bez canAfford — metoda zgodna z dispatchem): hard/pop=4 → spichlerz #1 (potwierdza naprawę realnego defektu na "hard"); easy/pop=5 → spichlerz NIEOBECNY w 400 tur (poprawnie WEAK, miasto ma zapas); normal/pop=4 (scenariusz gate'u) → spichlerz NIEOBECNY (gate nietknięty); normal/pop=5 → spichlerz #1; spichlerz_ii/hard/pop=8 z już zbudowanym spichlerz → spichlerz_ii #1. (2) Mutacja chronionego gate'u (kopia pliku, cofnięta): population scenariusza B podbite 4→5 (na/ponad sufit normal) → gate PĘKA 41/3 — dowód, że mechanizm STRONG/WEAK to realna gałąź warunkowa, nie przypadkowe przejście, i że fixture scenariusza B (pop=4) faktycznie mierzy "miasto jeszcze niezablokowane", tak jak twierdzi Obrona. (3) Miasto z Akweduktem już zbudowanym, populacja=20 (skrajna, ponad wszystkie progi): bonus granary poprawnie=0, Spichlerz wraca na naturalną pozycję ~12 (zgodnie z bazowym scoringiem grupy sprzed rundy 3) — potwierdza early-return `built.includes('akwedukt')`. (4) Bisekcja granic: pop=3→WEAK/pop=4→STRONG (hard, próg 4), pop=5→WEAK/pop=6→STRONG (easy, próg 6), pop=7→WEAK/pop=8→STRONG (spichlerz_ii, próg 8) — czysty flip dokładnie na granicy we wszystkich 3 przypadkach. (5) Weryfikacja źródłowa: koszary early bonus=+110 (ai.ts:1785) — potwierdza dosłownie "ranga Koszar" STRONG=110. (6) Głębsza diagnostyka (debug-instrumentacja kopii ai.ts, usunięta po użyciu): odkryłem, że przy INNEJ metodzie testowej niż nakazana (z `opts.canAfford` symulującym "tylko budynki") Spichlerz bywa wyprzedzany przez Stolarnię — przyczyna to ODRĘBNY, już wcześniej udokumentowany i ratyfikowany jako poza zakresem mechanizm (konwerter-przed-konsumentem/deficyt surowca, `if (opts.canAfford)`, jeden z 13 literałów z ratyfikacji #1). Mechanizm ten NIE aktywuje się w nakazanej metodzie dowodowej ("bez canAfford") i nie jest częścią tej rundy — odnotowuję jako obserwację do kryterium 4 (pełna symulacja, świadomie odroczone), nie jako nowy DECISION_REQUIRED.

OCENA ZARZUTU 1: Trafny i poprawnie naprawiony. Niezależnie potwierdziłem: (a) `opts.menuDifficulty` był dostępny w zakresie (linia 259, używany też w CS_EARLY_GARRISON_TARGET) i faktycznie nieużywany w starej `granaryPriorityBonus`; (b) econ-params.json rzeczywiście skaluje próg bez-Spichlerza z trudnością (nie skaluje progu ze Spichlerzem — również zgodne z danymi); (c) naprawa (`AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY`, wzorzec identyczny z istniejącym `CS_EARLY_GARRISON_TARGET`) działa poprawnie i deterministycznie na obu granicach (hard i easy), zweryfikowane własną symulacją i bisekcją; (d) chroniony gate pozostaje nietknięty (44/0) z udowodnionego, nieprzypadkowego powodu (mutacja #2 wyżej); (e) status "PASS-WITH-NOTES" Obrony (ryzyko duplikacji progów ekonomii bez importu economy.ts) jest uczciwie zgłoszonym, nieblokującym ryzykiem architektonicznym — liczby aktualnie zgodne z danymi, nie błąd.

BLOKADY: Brak nowych blokujących. Kryterium 4 (150 tur w realnym silniku) — nadal świadomie odroczone do nocnego przebiegu i playtestu właściciela, zgodnie z ratyfikacją #1/#2; moja obserwacja o interakcji z mechanizmem konwerterów mieści się w tym już zaakceptowanym odroczeniu, nie tworzy nowej decyzji dla tej rundy.

RUNDY: 3/5
NASTĘPNY KROK: Integracja orkiestratora (Final Control PASS) i odblokowanie R-PRAWO-PRZEBUDOWA-SKALI-Q1, zgodnie z "NASTĘPNY KROK" ratyfikacji #2.
DEPLOY/PUSH: NIE WYKONANO

---

TABELA: WŁASNA 400-turowa proxy-symulacja (4 miasta h1-h4, esbuild, bez canAfford, mapa 24×24, seed odrębny od Operatora/Obrony/FC rund 1-2) — pierwsze budynki miasta h1

| # | HARD, pop start=4 (realny sufit hard=4) | NORMAL, pop start=5 (sufit normal=5, zablokowane) | EASY, pop start=5 (sufit easy=6, NIE zablokowane) |
|---|---|---|---|
| 1 | **spichlerz** | **spichlerz** | koszary |
| 2 | koszary | koszary | studnia |
| 3 | studnia | studnia | akwedukt |
| 4 | akwedukt | akwedukt | laznia_publiczna |
| 5 | laznia_publiczna | laznia_publiczna | stolarnia |
| 6 | stolarnia | stolarnia | kamieniarski |
| 7 | kamieniarski | kamieniarski | garncarnia |
| 8 | garncarnia | garncarnia | cegielnia |
| 9 | cegielnia | cegielnia | — (plateau, spichlerz nieobecny w 400 tur) |

Dodatkowo: HARD, spichlerz już zbudowany, populacja=8 (sufit ze Spichlerzem I=8, zablokowane) → **spichlerz_ii #1** wśród nowych budynków, w tej samej kolejności co powyżej (koszary/studnia/akwedukt/…).

Wniosek: fix z rundy 3 poprawnie odróżnia "miasto zablokowane" (STRONG, Spichlerz #1) od "miasto z zapasem" (WEAK, Spichlerz nieobecny w oknie plateau) na WSZYSTKICH trzech trudnościach, zgodnie z realnymi progami `economy.ts`/`econ-params.json`, nie ze sztywną wartością normal=5 jak przed poprawką rundy 3.
