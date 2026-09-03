TEMAT: P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/newGameFlow.ts (opcja `cityStateDifficulty`), gra/src/map/newGameMapDefaults.ts
(`clampMiastaPanstwaCount`)
MODEL+EFFORT: claude-sonnet-5, effort high (nowa opcja ustawień + poluzowanie clampu,
wymaga żywej weryfikacji generacji świata)

WYZWALACZ (dosłownie od właściciela)
"W ustawieniach państw-miast, kiedy robimy generator, powinna być opcja nie tylko wyboru
trudności — łatwy, normalny i trudny — ale też 'wyłączone', czyli całkowicie miasta i
państwa się nie generują. Są tylko same cywilizacje."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- UI: `newGameFlow.ts:1221-1237`, wiersz `key: 'cityStateDifficulty'`, `opts: ['Łatwy',
  'Normalny', 'Trudny']` (3 opcje), `advOpts.cityStateDifficultyOverride:
  'easy'|'normal'|'hard'|null` (linia 186). Gotowy wzorzec do skopiowania: `barbariansLevel`
  (linie 1238-1249) ma 4. opcję `'Brak'` = pełne wyłączenie tego samego rodzaju mechanizmu.
- Liczba miast-państw ma OSOBNY mechanizm: `newGameMapDefaults.ts:520-528`,
  `clampMiastaPanstwaCount()` twardo wymusza zakres `[1, MAX_MIAST_PANSTWA=9]` — MIN. 1,
  nie 0. To jest bariera do poluzowania (min 0), nie generator sam w sobie.
- Rdzeń world-genu TOLERUJE 0 miast-państw bez awarii — dowód:
  `main.ts:32716` (preset testowy `PLAYTEST_MIASTO_SEED`) używa `cityStatesCount: 0` i
  działa. Generator klastrów (`clusters.ts`, `cluster-spawn.ts`,
  `packCityStatesAroundCapital`) NIE wymaga ruszania — to duży, mocno wpleciony plik
  (4170 linii), poza zakresem tego tematu.

GOAL
1. Dodaj 4. opcję do wyboru trudności miast-państw w UI nowej gry: "Wyłączone" (obok
   Łatwy/Normalny/Trudny), analogicznie do wzorca `barbariansLevel`/'Brak'.
2. Wybór "Wyłączone" ustawia efektywną liczbę miast-państw na 0 dla tej gry (powiązanie
   z parametrem sterującym liczbą klastrów miast-państw w generatorze — znajdź dokładne
   miejsce, w którym `cityStateDifficultyOverride`/analogiczny wybór trafia do
   generatora, i dodaj tam gałąź dla wartości "off"/"wylaczone").
3. `clampMiastaPanstwaCount()` — poluzuj dolną granicę do 0 WYŁĄCZNIE gdy efektywnie
   wybrano "Wyłączone" (nie zmieniaj domyślnego minimum 1 dla pozostałych trzech opcji
   trudności — to by zmieniło zachowanie tam, gdzie właściciel go nie zgłosił).
4. Przy "Wyłączone": generowana mapa ma WYŁĄCZNIE cywilizacje (gracz + AI), zero miast-
   państw, zero klastrów miast-państw — potwierdź żywym testem generacji świata.
5. Zero zmian w generatorze klastrów cywilizacji AI (`clusters.ts` poza minimalnym
   podłączeniem parametru 0, jeśli w ogóle konieczne — jeśli wymaga zmiany w tym pliku,
   opisz dokładnie co i dlaczego w raporcie, bo to poza pierwotną allowlistą).

KRYTERIA KOŃCA (binarne)
1. Żywy render w Chromium: ekran nowej gry pokazuje 4 opcje trudności miast-państw
   (Łatwy/Normalny/Trudny/Wyłączone).
2. Test: generacja świata z wybranym "Wyłączone" kończy się sukcesem (brak crasha) i
   wygenerowana mapa ma 0 miast-państw (sprawdzone na strukturze danych po generacji, nie
   tylko brak błędu).
3. Test: pozostałe 3 opcje (Łatwy/Normalny/Trudny) generują miasta-państwa DOKŁADNIE tak
   jak dziś — zero regresji (porównanie liczby/rozmieszczenia miast-państw PRZED i PO
   zmianie na tym samym seedzie).
4. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/newGameFlow.ts — WYŁĄCZNIE opcja `cityStateDifficulty`/`opts` i pole
  `cityStateDifficultyOverride`.
- gra/src/map/newGameMapDefaults.ts — WYŁĄCZNIE `clampMiastaPanstwaCount`.
- Punkt podłączenia wyboru "Wyłączone" do generatora (main.ts lub inny plik wskazany
  reconem Operatora) — WYŁĄCZNIE minimalna gałąź warunkowa, nie przebudowa generatora.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana
`clusters.ts`/`cluster-spawn.ts` poza minimalnym podłączeniem parametru 0 (uzasadnionym
w raporcie), zmiana zachowania pozostałych 3 poziomów trudności.

IZOLACJA
worktree /home/user/wt-miasta-panstwa-wylaczone, gałąź
autobot/P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-miasta-panstwa-wylaczone --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2 za spełnione bez żywej generacji świata z opcją "Wyłączone" i
faktycznego przeliczenia miast-państw w wygenerowanej strukturze (0), nie tylko braku
wyjątku/crasha. Zakaz uznania kryterium 3 za spełnione bez porównania NA TYM SAMYM
SEEDZIE liczby/pozycji miast-państw PRZED i PO zmianie kodu.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
