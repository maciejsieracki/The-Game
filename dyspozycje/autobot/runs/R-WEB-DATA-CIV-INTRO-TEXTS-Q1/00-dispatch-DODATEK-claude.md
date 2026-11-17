# R-WEB-DATA-CIV-INTRO-TEXTS-Q1 — teksty ekranu powitalnego nowej cywilizacji (rys historyczny + powitania władcy)
DOMAIN: GAME (dane tekstowe, bez zmian kodu) | Operator HAIKU 5.5 | BAZA = origin/main ac35200a176b1860e070c14ff8187e7112e29f52 (FALA 808). Pierwszy krok: `git fetch origin main claude/sprawdzenie-funkcjonalnosci-ek4ra0`, `git merge-base --is-ancestor ac35200a1 HEAD`, podaj `git rev-parse HEAD`. Dispatch czytaj z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DATA-CIV-INTRO-TEXTS-Q1/00-dispatch.md`), nie z origin/main.

KONTEKST (zgłoszenie właściciela 2026-11-17, ABC: kiedy = B, treść = A, przyciski = A): przy pierwszym spotkaniu nowej cywilizacji gra pokaże ekran „Odkryłeś nową cywilizację" (przed audiencją dyplomatyczną), z opisem, rysem historycznym, plusami/minusami, jednostkami specjalnymi i powitaniem władcy; dopiero przycisk „Audiencja" otwiera zwykły panel audiencji. Ten temat dostarcza WYŁĄCZNIE TEKSTY (dane). UI powstanie osobnym tematem PO akceptacji tekstów przez właściciela.

Owner o powitaniu władcy (dosłownie): „Dobrze, że było jakieś przywitanie ze strony inków i władcy inków. W zależności od nastawienia w stosunku do nas. Albo przyjazne, albo i nieprzyjazne. Ale dobrze było, żeby był jakiś tekst od władcy, żeby trochę bardziej ludzka była ta rozmowa."

GOAL (kryteria binarne):
1. Nowy plik `gra/data/civ-intro-texts.json`, klucz główny = `ikonaId` z `gra/data/civs.json` (15 cywilizacji: grecy, rzymianie, chinczycy, inkowie, zulusi, egipt, sumer, celtowie, germanie, harappa, hetyci, slowianie, babilonia, asyria, fenicjanie). Dla KAŻDEJ: 
   - `rys_historyczny`: krótki rys historyczny po polsku, 3–4 zdania (łącznie ok. 350–600 znaków), rzeczowy, bez anachronizmów i bez zmyślonych faktów; zgodny z naturą cywilizacji w grze (okres, region, to z czego słynęła; nie sprzeczny z `civs.json`: styl, jednostka specjalna, religia).
   - `powitanie_przyjazne`: LISTA 3 różnych krótkich powitań władcy (1–2 zdania, pierwsza osoba, ton ciepły/szanujący, charakterystyczny dla kultury; bez imienia władcy w tekście — UI doda podpis z `wodzowie` wg epoki; bez nazw epok i bez liczb).
   - `powitanie_nieprzyjazne`: LISTA 3 różnych krótkich powitań władcy (1–2 zdania, ton chłodny/podejrzliwy/wyniosły, nadal w granicach grzeczności dyplomatycznej, bez gróźb wojny z góry).
2. Pola dodatkowe NIE są pisane ręcznie: plusy/minusy/jednostki specjalne/styl/religia UI weźmie z istniejących danych (civs.json, civ-matrix.json, units.json). Ten temat NIE tworzy ich duplikatów.
3. Polszczyzna poprawna (diakrytyki, interpunkcja), spójna terminologia z grą (np. „cywilizacja", „audiencja"), bez surowych ID, bez znaków ' w polach (bezpieczne dla generatorów), bez angielskich słów.
4. Plik wypisany także w postaci czytelnej do akceptacji: `dyspozycje/autobot/runs/R-WEB-DATA-CIV-INTRO-TEXTS-Q1/TEKSTY-DO-AKCEPTACJI.md` (tabela/lista per cywilizacja: rys + 3 + 3 powitania), żeby właściciel mógł przeczytać i poprawić.
5. Kod gry NIE jest zmieniany; plik nie jest jeszcze nigdzie importowany (dlatego brak wpływu na grę i brak potrzeby deployu — wejdzie z UI-tematem).

TESTY (binarne):
- (a) nowy test gra/tools/civ-intro-texts-test.cjs: plik parsuje się; dokładnie 15 kluczy = zbiór `ikonaId` z civs.json; każdy wpis ma wymagane pola i typy; rys 3–4 zdania (liczone po kropkach/znakach końca zdania) i 300–700 znaków; po 3 unikalne powitania w każdej liście, każde 20–260 znaków i 1–2 zdania; brak znaku ', brak podwójnych spacji, brak nazw własnych władców z `wodzowie` w powitaniach; żadne dwa powitania w całym pliku nie są identyczne.
- (b) MUTACJA: usunięcie jednego klucza cywilizacji / pustego powitania (przez KOPIĘ pliku, nie git checkout) → test czerwony; przywrócenie → zielony.
- (c) Bramki: `node ./node_modules/typescript/bin/tsc --noEmit` = 0 oraz logic-test, tech-tree-test, research-test, unit-replace-test, combat-test (plik JSON nie jest importowany, więc oczekiwane bez zmian).

ALLOWLISTA: gra/data/civ-intro-texts.json (nowy), gra/tools/civ-intro-texts-test.cjs (nowy), dyspozycje/autobot/runs/R-WEB-DATA-CIV-INTRO-TEXTS-Q1/ (raporty + TEKSTY-DO-AKCEPTACJI.md). ZAKAZ: wszelkie inne pliki gra/ (w tym civs.json, civ-matrix.json, civ-music.json, wikiBundle, src/), gra-robocza, gra-kanon, WERSJE.md, npm run build/dev, rm/rmdir/unlink, git add -A, push, nowe sesje/zadania/harmonogramy.

REGUŁA PRZECIW SAMOOSZUKIWANIU: nie wymyślaj faktów, których nie jesteś pewien — pisz ogólnie i prawdziwie (region, okres, charakterystyczne osiągnięcia); gdy fakt budzi wątpliwość, pomiń go i wpisz w raporcie jako „POMINIĘTE: wątpliwy fakt". Liczby, daty i nazwy własne tylko jeśli pewne.

IZOLACJA: worktree własny od BAZY wyżej (sparse/--no-checkout jeśli dysk), gałąź autobot/R-WEB-DATA-CIV-INTRO-TEXTS-Q1, runda 1/5. Operator nie integruje, nie deployuje, nie pushuje. Raport ≤ 400 słów, kontrakt STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH.
