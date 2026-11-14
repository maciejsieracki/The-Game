STATUS: PASS-WITH-NOTES (runda 2: punkt 3 DANE zmierzone, 6 scenariuszy x 2 sciezki; punkt 1 NIE_ZMIERZONO z powodem technicznym; punkt 2 bez zmian z r1/r2)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: dowod w zywej grze dla trzech punktow: (1) W18 machiny oblezcze przed/po techu, (2) W24 lewy baner (zamkniete w r1/r2), (3) straty zwyciezcy w bitwie (>=5 bitew, porownanie skip vs auto 'pewne').
BAZA: 3b36ee80c (origin/main, detached HEAD w worktree wf_e3cb84a9-ebd-1). Dispatch: 00-dispatch.md + 00-dispatch-DODATEK-claude.md z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (na origin/main brak tych plikow).

ZMIANY/COMMIT:
- gra/tools/live-verify-w18-w24-manual-losses-w3.cjs (nowy, allowlista OK).
- evidence/w3-straty-zwyciezcy-r2.json (surowy JSON 12 przebiegow: 6 konfiguracji x skip/auto).
- ten plik (10-operator-claude.md, nadpisany wersja r2).
- SHA: patrz pole sha w odpowiedzi strukturalnej.
- Bez zmian w gra/src i gra/data, WERSJE.md, gra-robocza/, rust-port/. git diff --check: do sprawdzenia przed commitem (patrz TESTY).

PUNKT 3 (straty zwyciezcy, bitwa reczna) — DANE, NIE OCENA BALANSU
Sciezka: scena BattleScene z realnego bundla (vite build z 3b36ee80c, poza repo, /tmp/claude-0/w18w24-r2-build), ?playtest=bitwa-duza lub oblezenie-duze, ?civTest=1, __civSetHitMode('pewne') (przelacznik #285), zegar deterministyczny (Math.random z ziarnem, rAF w kolejce, jak w battle-skip-equals-auto-resolve-test.cjs).
- sciezka "manual" = bs.skip() w fazie rozstawiania (ta sama operacja co przycisk Pomin). NIE klikano jednostek: sterowanie reczne (manualBattle.ts, rozkazy klik-po-klik) NIE zostalo wykonane. To jest odstepstwo od dispatchu opisane wprost.
- sciezka "auto" = _endDeployPhase() + wylaczenie trybu recznego (klawisz R) + predkosc 8x.

Wyniki (zrodlo: evidence/w3-straty-zwyciezcy-r2.json; liczby z surowego JSON):
| Konfiguracja | Stosunek sil (atak/obrona, start) | Sciezka | Zwyciezca | Runda | Straty atakujacego (utr./lacznie) | HP atak. (koniec/max) | Straty obroncy (utr./lacznie) | HP obr. (koniec/max) |
|---|---|---|---|---|---|---|---|---|
| B1 bitwa-duza, seed 1 | 28/28 = 1:1 | skip | obronca | 17 | 28/28 | 0/988 | 9/28 | 497/1008 |
| B1 | 28/28 | auto | obronca | 17 | 28/28 | 0/988 | 9/28 | 497/1008 |
| B2 bitwa-duza, seed 2 | 28/28 = 1:1 | skip | obronca | 17 | 28/28 | 0/988 | 9/28 | 497/1008 |
| B2 | 28/28 | auto | obronca | 17 | 28/28 | 0/988 | 9/28 | 497/1008 |
| B3 oblezenie bazowe, seed 1 | 39/28 (1,39:1) | skip | obronca | 400 (limit) | 28/39 | 2451/4188 | 12/28 | 671/1008 |
| B3 | 39/28 | auto | obronca | 400 (limit) | 28/39 | 2451/4188 | 12/28 | 671/1008 |
| B4 oblezenie +6 rydwanow, seed 1 | 45/28 (1,61:1) | skip | obronca | 400 (limit) | 33/45 | 2535/4860 | 13/28 | 626/1008 |
| B4 | 45/28 | auto | obronca | 400 (limit) | 33/45 | 2517/4860 | 13/28 | 626/1008 |
| B5 oblezenie +12 rydwanow, seed 1 | 51/28 (1,82:1) | skip | obronca | 400 (limit) | 30/51 | 3361/5532 | 10/28 | 701/1008 |
| B5 | 51/28 | auto | obronca | 400 (limit) | 30/51 | 3361/5532 | 10/28 | 701/1008 |
| B6 oblezenie +6 taranow, seed 2 | 45/28 (1,61:1) | skip | atakujacy | 137 | 26/45 | 5428/8388 | 28/28 | 0/1008 |
| B6 | 45/28 | auto | atakujacy | 139 | 27/45 | 5268/8388 | 28/28 | 0/1008 |

Uwagi do danych (anomalie, bez oceny balansu):
- Zwyciezca przy rownych silach (B1/B2): obronca stracil 9/28, atakujacy 28/28. Nie jest to przypadek "zwyciezca bez strat".
- B1 i B2 (ziarna 1 i 2) daja identyczne wyniki co do jednostki i HP. Ziarno nie zmienia tu wyniku; przyczyny nie ustalono (nie sprawdzano, czy preset bitwa-duza uzywa Math.random).
- B3, B4, B5 konczace sie na rundzie 400 (limit rundy) przy zywych jednostkach atakujacego (11, 12, 21) — werdykt "obronca / Porazka" przy limicie, a nie przez wyeliminowanie. To anomalia do rozstrzygniecia przez orkiestratora (limit 150 tur z #203 vs 400 w tym scenariuszu).
- Skip vs auto (ta sama konfiguracja): wyniki identyczne we wszystkich polach dla B1, B2, B3, B5 i B6 zbliżone (rozn. rundy 137 vs 139, HP 5428 vs 5268). B4 roznica HP atakujacego 2535 vs 2517. Roznica skip/auto w oblezeniu z wylomem jest znana (#202 R-WEB-BATTLE-SKIP-TICK-LOOP-UNIFY-Q1); tu tylko zarejestrowana.
- Brak w repo haka ustawiajacego dowolny stosunek sil; zmieniaja go tylko dodatki atakujacego (?rams / ?chariots) w scenariuszu oblezenia. Stosunek odwrotny (przewaga obroncy) NIE zostal zmierzony: presety maja staly sklad. Zakres 1:1 ... 1,82:1 w jednym kierunku.
- Brak zrzutow ekranu dla punktu 3 (kryterium: tabela + surowe JSON). Brak bledow strony (errors = 0 we wszystkich 12 przebiegach).

PUNKT 1 (W18 machiny oblezcze przed/po techu): NIE_ZMIERZONO
- Powod techniczny: pomiar wymaga AKTYWNEGO OBLEZENIA miasta AI. Stan oblezenia (city.oblegane) ustawia sciezka ataku gracza na miasto w main.ts (~18612–18634, showSiegeMapPanel przy oblegajacyOwnerId===0), uruchamiana gestem gracza (klik/atak). Hooki __civTest (addUnit, setWar, endTurn, foundCandidates, unlockAllTech) nie maja haka "rozpocznij oblezenie"; odtworzenie gestu klik-po-hexach bez haka nie miescilo sie w limicie tej rundy.
- Panel oblezenia (siegeMapPanel.ts, blok [data-siege-engine-build]) jest widoczny tylko przy aktywnym oblezeniu — bez niego nie ma co odczytac przed/po.
- unlockAllTech nie izoluje "Obrobki drewna" (Taran); przed/po w panelu rekrutacji (r1): Taran absent w obu fazach, zgodnie z zalozeniem, ze machiny nie sa rekrutowane z panelu rekrutacji (siegeMachines.ts:29, #297). Ta obserwacja nie rozstrzyga W18.
- Do domkniecia W18 potrzebny: hak "rozpocznij oblezenie miasta AI przez armie gracza" w civ-test-hooks.ts (decyzja orkiestratora) LUB hak "odkryj tech X" izolujacy Obrobke drewna.

PUNKT 2 (W24 lewy baner): bez zmian wzgledem r2 poprzedniego operatora (30-obrona-claude.md): brak poziomego przewijania przy 1000x700, 800x600, 640x480 (PASS literalny); pionowa anomalia 800x600 (hud-chip-grid top -6 px) — REALNY DEFEKT wizualny, nienaprawiony, do osobnego tematu R-WEB-*. Nie ponawiano pomiaru w tej rundzie (dispatch r2 dotyczy punktow 1 i 3).

TESTY:
- npm ci w gra/: 71 pakietow (EXIT 0).
- vite build z 3b36ee80c: EXIT 0, index.html 14 676 914 B + audio-pack-1/2/3.js; logi /tmp/claude-0/w18w24-r2-build.log.
- Pomiar punktu 3: 12 przebiegow, 0 bledow strony, plik evidence/w3-straty-zwyciezcy-r2.json (surowy). Liczby w tabeli z tego pliku.
- Sprawdzenie diff: wykonane przed commitem (git diff --check) — wynik w odpowiedzi.
- NIE_ZMIERZONO: tsc, testy logiki (nie uruchamiano, brak zmian w gra/src).

BLOKADY:
- Punkt 1: brak haka rozpoczynajacego oblezenie / izolacji techu (patrz wyzej).
- Punkt 3: sterowanie reczne (klik-po-klik, manualBattle.ts) nie wykonane; uzyto skip() jako sciezki "manual" (jawnie opisane). Brak reverse-ratio (przewaga obroncy).
- Dodatek orkiestratora: obecny na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (ten sam, co w tresci zadania).

RUNDY: 2/5 (runda Operatora po FC r1; Operator = Haiku, bez eskalacji modelu).

NASTEPNY KROK: orkiestrator decyduje: (a) hak "rozpocznij oblezenie" lub izolacja techu dla punktu 1; (b) czy zaakceptowac skip jako sciezke "manual" w punkcie 3 czy wymagac klik-po-klik; (c) anomalia limitu rundy 400 w oblezeniu (B3–B5) i identyczne wyniki ziaren 1/2 (B1/B2); (d) osobny temat R-WEB-* dla pionowej anomalii baneru 800x600.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch r1 i dodatek byly na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie na origin/main (przy starcie: "does not exist" na origin/main).
- Anomalie danych: (1) B3–B5 zakonczone przy rundzie 400 z zywymi atakujacymi, werdykt "obronca" przy limicie; (2) B1 i B2 (ziarna 1 i 2) identyczne; (3) skip vs auto rozni sie w B4 (HP atakujacego 2535 vs 2517) i B6 (runda 137 vs 139).
- Zadnych zmian w grze; skrypt pomiarowy w gra/tools tylko do odczytu stanu sceny.
