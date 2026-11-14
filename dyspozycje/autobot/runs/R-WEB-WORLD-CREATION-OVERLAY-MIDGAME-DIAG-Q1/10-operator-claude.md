STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1
GOAL: ustalić, czy nakładka „Tworzenie świata” (gra/src/ui/mapLoadingOverlay.ts) pojawia się w trakcie partii na realnej ścieżce (nowa gra -> miasto gracza -> endTurn), czy tylko jako artefakt harnessu. Bez zmian kodu gry.
BAZA: origin/main 75e238e52 (worktree detached). Dispatch: 00-dispatch-DODATEK-claude.md z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (oryginalny 00-dispatch.md NIE istnieje w origin/main; odczytany z tej samej gałęzi).

ZMIANY/COMMIT: nowe gra/tools/world-overlay-midgame-diag-run.cjs (runner pomiarowy, read-only wobec gry); runs/R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1/10-operator-claude.md; runs/.../evidence/checkpoint-*.json (5 plików). Zero zmian w gra/src, gra/data, WERSJE.md. Lokalny symlink gra/node_modules (poza commitem) wskazuje na node_modules innego worktree, bo własny był pusty.

NARZĘDZIA I METODA:
- bundle: `vite build` do scratchpad (dist-wod zmin., dist-dbg `--minify false` do stacków); bez npm run build/dev.
- realna ścieżka (scenariusz real): ?civTest=1&civSeed=N (hak), startGame() -> REALNE doStartGame (main.ts:46477; overlay w main.ts:46520), foundFirstCity, setFast(true), 30 x realne triggerPlayerEndTurn. Bez ?playtest, bez grantPlayerGold.
- rejestr nakładki: init-script opakowuje Node.prototype.appendChild/insertBefore; przy dołączeniu .civ-map-load-overlay zapisuje JS stack; MutationObserver liczy pojawienia się w DOM; checkpoint JSON po każdej turze.
- Harness (jawnie): clearBlockers (odrzucenie ofert AI blokujących koniec tury, zamknięcie okien bitwy) — działania logowane w checkpoint; w runach real 11 i 33 nie wystąpiły (lista akcji pusta).

TESTY (surowe wyniki z checkpointów, evidence/):
| Run | Ścieżka | Tury | Overlay razem (appendChild) | Overlay widoczny w turze | max endTurn ms | hung |
| real seed 11 | nowa gra realna | 30/30 | 1 (start, doStartGame) | 0 | 3876 | 0 |
| real seed 33 | nowa gra realna | 30/30 | 1 (start, doStartGame) | 0 | 3369 | 0 |
| real seed 22 | nowa gra realna | 0/30 | 1 (start) — świat nie skończył generacji w 500 s | — | — | — |
| mapa -100000 seed 11 | ?playtest=mapa + grant | 4/4 | 1 (start, doStartPlaytestMapaSwiata) | 0 | 708 | 0 |
| mapa -150000 seed 11 | ?playtest=mapa + grant | 4/4 | 1 (start) | 0 | 743 | 0 |
Ślad stosu nakładki startowej (real): showMapLoadingOverlay <- doStartGame (main.ts:46520); artefakt mapa: <- doStartPlaytestMapaSwiata (main.ts:47378). Numery linii w bundlu dist-dbg są inne niż źródłowe; źródłowe wskazania z grep.
Dodatkowa obserwacja (seed 22, start, NIE w trakcie partii): komunikat nakładki „Tworzenie świata Standardowy · Kontynenty 7/10 · Rzeki — uzupełnianie” utrzymuje się od ~t=45 s do t=500 s (licznik „Upłynęło” rośnie, faza nie postępuje). Brak dalszego pomiaru: NIE_ZMIERZONO, czy generacja kończy się po >500 s, czy zawiesza (to osobny temat, poza zakresem).
Uwaga: w checkpointach logi „[EndTurn] blocked” są ucinane do 30 wpisów, więc nie da się policzyć ich liczby; NIE_ZMIERZONO ilościowo, obecność obu typów (awaitingFirstPlayerCity, endTurnInProgress) potwierdzona w real 11.

TABELA HIPOTEZ:
| Hipoteza | Wynik | Dowód |
| H1: nakładka wraca w środku partii na realnej ścieżce (nowa gra -> miasto -> endTurn) | NIE_ODTWORZONO (2 niezależne 30-turowe runy, seedy 11 i 33) | evidence/checkpoint-real-real-11.json, -33.json: jedyny wpis to start gry |
| H2: ?playtest=mapa + grantPlayerGold(-100k/-150k) wywołuje ponowne generowanie świata w trakcie tury | NIE_ODTWORZONO w 4 turach (-100k i -150k); nakładka tylko przy starcie playtestu (doStartPlaytestMapaSwiata) | evidence/checkpoint-mapa-*.json |
| H3: reset do „TURA 1 / Załóż miasto” przy deficycie ~130–150k | NIE_ODTWORZONO (tura 1 -> 5, miasto 1, bez awaitingFirstCity poza turą 1 playtestu) | jw. |
| H4: zawieszenie endTurn 9→10 / endTurnInProgress na realnej ścieżce | NIE_ODTWORZONO (30/30 tur w obu realnych runach, hung=0, max 3,9 s) | jw. |
| H5 (kod, nie odtworzone): regeneracja świata przy wczytaniu zapisu | NIE_ZMIERZONO — ścieżka istnieje: regenerateWorldForLoad (main.ts:46389) wołany z wczytywania (main.ts:47641) gdy loadNeedsMapRebuild (main.ts:10160) zwraca true; loadNeedsMapRebuild zwraca true dla każdego wczytania poza pauzą w tej samej grze. Nie testowano wczytywania. | kod |

WNIOSEK: Na realnej ścieżce (nowa gra -> miasto -> endTurn, 30 tur) nakładka „Tworzenie świata” NIE pojawia się w trakcie partii (2 ziarna). Zjawisko z W80A/W80B nie zostało odtworzone; obserwowane zachowania (reset do tury 1, zawieszenie endTurn) pochodzą z innych ścieżek niż ta, lub z warunków niereprodukowanych tutaj (np. wczytanie zapisu z pauzy, zmiana ustawień, długi dłuższy niż 30 tur, tryb ręczny gracza). Kandydat do zbadania następnym tematem: wczytanie zapisu (regenerateWorldForLoad przy loadNeedsMapRebuild) — rekomenduję osobny temat diagnostyczny, NIE poprawkę.

BLOKADY: seed 22 nie dał pomiaru tur (generacja startowa stoi w fazie 7/10 >500 s); brak zrzutów ekranu (nie wykonywano screenshotów); brak testu wczytywania zapisu (poza allowlistą tego tematu).
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje: (a) osobny temat diagnostyczny wczytania zapisu z pauzy (regenerateWorldForLoad), (b) osobny temat: zbadać zawieszenie generacji seed 22 w fazie „Rzeki — uzupełnianie” (poza tym tematem).
UWAGI-DLA-ORKIESTRATORA: (1) Dispatch oryginalny 00-dispatch.md nie istnieje w origin/main; użyto wersji z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0. (2) Nie zakładano sesji ani zadań (zakaz zachowany). (3) Runner ma ograniczenie: brak wznowienia ze slotu (checkpoint tylko do odczytu), limit czasu per wywołanie (--cell-sec) przerywa start świata przy wolnych ziarnach.
DEPLOY/PUSH: NIE WYKONANO
