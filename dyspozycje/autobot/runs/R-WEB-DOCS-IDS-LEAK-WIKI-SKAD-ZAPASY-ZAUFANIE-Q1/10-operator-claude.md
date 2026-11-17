STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DOCS-IDS-LEAK-WIKI-SKAD-ZAPASY-ZAUFANIE-Q1
GOAL: usunąć surowe klucze snake_case z treści wiki (Civpedia) widocznej dla gracza w haslach skad-zapasy i zaufanie, zachowując merytorykę i wartości liczbowe.
ZMIANY/COMMIT: allowlista — docs/encyklopedia/pojecia/skad-zapasy.md (1 linia: `ksiega_zasobow_tury` → opis słowny „długość dziennika zasobów”), docs/encyklopedia/pojecia/zaufanie.md (2 linie: `dobra_wola_tur` usunięty z tabeli i z rozbieżności w Historii → opis słowny), gra/src/data/wikiBundle.json (regeneracja `node tools/bundle-wiki-for-game.cjs`). Porównanie strukturalne JSON starego i nowego bundla: różnią się wyłącznie encyklopedia[123].wikiM/full (skad-zapasy) i encyklopedia[179].wikiM/full (zaufanie). Wiersz json_ref (tabela metadanych) nie został zmieniony: test i stripEncyMetadata wykluczają go z widoku gracza, a w wikiBundle nie trafia do wikiM. SHA: wpisany w commit (patrz NASTĘPNY KROK / git log).
TESTY (surowe wyniki):
- baseline (57c885253) node tools/ids-leak-audit-test.cjs: WYNIK: 1723 ok, 2 FAIL (skad-zapasy.wikiM, zaufanie.wikiM snake_case w backtickach)
- po zmianie: WYNIK: 1725 ok, 0 FAIL (exit 0)
- node tools/json-descriptions-sync-test.cjs: json-descriptions-sync-test: 19 pass / 0 fail (exit 0)
- npx tsc --noEmit: exit 0, bez wyjścia
- node tools/ui-text-leftovers-test.cjs: == WSZYSTKO ZIELONE == (exit 0)
- node tools/wiarygodnosc-test.cjs: 270 pass, 0 fail (exit 0)
- node tools/diplomacy-display-test.cjs: 45 OK, 0 FAIL (exit 0)
- mutacja (e): w wikiBundle.json ponownie wstawiono `ksiega_zasobow_tury` w taka sama dla każdego poziomu → ids-leak-audit-test: 1724 ok, 1 FAIL (skad-zapasy.wikiM) exit 1; po przywróceniu pliku: 1725 ok, 0 FAIL
- NIE ZMIERZONO: pozostałe 5 „bramek referencyjnych” z R-PROC-AUTOBOT §Bramki (nie wskazano listy w dispatchu; nie uruchamiano); pełne uruchomienie wszystkich testów wiki/diplo z listy grep (~190 plików) — nie wykonano; build vite nie był wymagany i nie wykonywano.
BLOKADY: brak. Uwaga środowiskowa: w worktree wykonano `npm ci --ignore-scripts` w gra/ (node_modules, nieśledzone przez git) — do sprzątania przez orkiestratora.
RUNDY: 1/5 (ostatni werdykt: brak — operator)
NASTĘPNY KROK: Evaluator — weryfikacja diffu (2 pliki md + wikiBundle.json tylko w dwóch hasłach) i testów powyżej; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (1) dispatch 00-dispatch.md nie istnieje w origin/main — skopiowany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (commit f832fb5de) do worktree, NIE commitowany. (2) W tekście hasła zaufanie (sekcja Historia, „Rozbieżność do wyjaśnienia”) zmieniono wzmiankę o pliku diplomacy.json na opis słowny — zgodnie z duchem GOAL. (3) Pozostałe wystąpienia nazw plików technicznych (np. econ-params.json, diplomacy.json) w md nie są snake_case i nie łamią testu; nie ruszano ich poza wymienionymi liniami. (4) Pozycja „Rozbieżność do wyjaśnienia” w haśle zaufanie to notatka wewnętrzna — do rozważenia przez właściciela przy FC.
