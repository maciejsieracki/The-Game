STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1
GOAL: Z Kamienia Ha'amonga wyciąć martwe wpisy bonusy.teren "lowie_rybackie" (id nie istnieje) i "laka" (silnik nie nalicza); cud zachowuje pozostałe bonusy bez zmian; bez implementacji naliczania.
BAZA: main 0f20c1bf9 (worktree wf_72169e69-4f4-1); dispatch z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (brak DODATKU, runda 1).

ZMIANY/COMMIT:
- gra/data/wonders.json: usunięty klucz bonusy.teren z cudu "hamonga" (dwa martwe wpisy: lowie_rybackie kultura 2/żywność 2; laka kultura 2 warunek hex_sasiad_plytkie_morze). Pozostałe bonusy bez zmian: miasto {kultura 3, zywnosc 3}; specjalne handel_procent 0.15 (handel_morski), dyplomacja_wpływ 3.
- gra/tools/wonder-haamonga-no-dead-bonuses-test.cjs (nowy).
- Bez zmian: gra/src/game/wonders-data.ts, docs/encyklopedia/cuda/hamonga.md, docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md, gra/src/data/wikiBundle.json (patrz NOTATKI).
- dyspozycje/autobot/runs/R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1/01-operator-r1.md (ten raport).
- Commit lokalny (bez push); SHA w sekcji DEPLOY/PUSH.

TESTY:
- node gra/tools/wonder-haamonga-no-dead-bonuses-test.cjs: 16 PASS, 0 FAIL (nowy).
- gra/data/wonders.json parsuje się (JSON.parse OK).
- node gra/tools/bundle-wiki-for-game.cjs: wikiBundle.json po regeneracji BEZ zmian (generator czyta docs/, nie wonders.json).
- Regresja (esbuild z istniejącego node_modules poza worktree, przez tymczasowy symlink gra/node_modules, usunięty po testach):
  - wonder-yields-test: 11 passed, 0 failed
  - cuda-handel-test: 26 passed, 0 failed
  - wonder-availability-test: 7 passed, 0 failed
  - wonder-civ-tech-test: 6 passed, 0 failed
  - entity-card-wonder-test: 134 pass, 0 fail
- git diff --check: czysto. Nie uruchamiano npm build/dev. Nie zmieniano WERSJE.md ani gra-robocza/.
- NIE_ZMIERZONO: wizualny rendering karty Ha'amonga w przeglądarce (zmiana danych; karta i etykieta są generowane z danych w wonderAdapter.ts i main.ts wonderEffectsLabel).

BLOKADY: brak.

NOTATKI (założenia, bez pytań):
1. Dispatch wskazuje "wonders-data.ts:199-201 TODO" — w worktree to komentarz ogólny (bonusy.teren/hex nie są liczone dla żadnego cudu, np. Petra), a nie specyficzny dla Ha'amonga. Zostawiony bez zmian, bo teren nadal nie jest liczony dla pozostałych cudów. Kod nie obsługuje martwych kluczy (nic ich nie czyta), więc nie było czego usuwać.
2. Teksty obiecujące martwe bonusy: nie znaleziono. Wyświetlanie jest danych-napędzane (wonderAdapter.ts, main.ts wonderEffectsLabel). Encyklopedia i katalog PORADNIKA mówią tylko o kulturze, żywności, handlu i wpływie. Test sprawdza brak "lowie_rybackie" w tych plikach oraz brak łąki/rybołówstwa w wierszu Ha'amonga katalogu.
3. Poza zakresem (nie ruszane): docs/encyklopedia/cuda/hamonga.md ma ogólne "×3 plony w mieście wzniesienia (patrz JSON)", co nie zgadza się z JSON (kultura i żywność +3 × każde miasto). Do osobnego tematu, jeśli właściciel chce.
4. Kolejność POTTERY/wikiBundle: ten commit NIE zmienia wikiBundle.json, więc nie tworzy konfliktu z POTTERY.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na commicie operatora r1; potem Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
