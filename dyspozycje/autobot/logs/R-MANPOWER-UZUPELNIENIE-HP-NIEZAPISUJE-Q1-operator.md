# R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1 — raport Operatora Luna High

**Data:** 2026-08-20
**Rola:** Operator AutoBot Luna High
**Status:** `READY_FOR_EVALUATOR`
**Zakres:** audyt bieżącego `main`, historii Manpower/HP, ścieżki zapisu oraz regresji; minimalne wzmocnienie testu.
**Zakazy wykonane:** bez ABC, bez deployu, bez pushu.

## 1. Źródła prawdy i wymaganie właściciela

Przeczytane przed audytem:

- `AUTOBOT.md`, `AUTOBOT-UNIVERSAL.md`, `playbook.md`, `CLAUDE.md`;
- `STAN-PRACY-HANDOFF.md`;
- `dyspozycje/_handoff/HANDOFF-FALA-299-2026-08-19.md`;
- aktywne reguły routingu AutoBot w `.cursor/rules/autobot-evaluator-operator.mdc`.

Wymaganie właściciela: leczenie Manpower zapisuje HP do żywych jednostek; ograniczona pula Manpower jest dzielona proporcjonalnie między wszystkie kwalifikowane żywe jednostki, bez leczenia sekwencyjnego i bez wydania ponad dostępny limit.

## 2. Recon i ancestry

Audyt wykonano na bieżącym `main`, HEAD `9e576da2` (`fix(dyplomacja): domknij cennik 5x wszystkich surowców`). Handoff FALI 299 ma starszy punkt odniesienia, dlatego za źródło bieżącego kodu przyjęto faktyczny checkout i jego historię.

Istotne commity są przodkami bieżącego HEAD (`git merge-base --is-ancestor` = 0 dla każdego):

- `a2180228` — przekazanie żywych obiektów RuntimeUnit zamiast mapowanej kopii, aby leczenie trafiało do snapshotu;
- `bf4b99fc` — proporcjonalny allocator ograniczonej puli Manpower;
- `205815a5` — zapis wyłącznie wspieranych pól HP runtime;
- `3933d149` — zachowanie `hpMax` po leczeniu;
- `8e1e0f10` — regresja zapisu `hpMax`;
- `a64c41dd` — synchronizacja live HP przez funkcję testowalną.

## 3. Wynik audytu end-to-end

### Algorytm leczenia

`gra/src/game/manpower.ts:269-345`:

- grupuje jednostki per `ownerId`, więc gracz i AI korzystają z tej samej ścieżki;
- odrzuca cywilów, zwiadowców, jednostki martwe, pełne HP i jednostki w oblężonym mieście;
- tworzy listę wszystkich kwalifikowanych kandydatów przed pobraniem Manpower;
- wylicza docelowy koszt leczenia każdej jednostki;
- przy niedoborze alokuje pulę proporcjonalnie, a resztę rozdziela deterministycznie po zaokrągleniach;
- każdorazowo ogranicza HP do `maxHp` i koszt do dostępnego Manpower;
- odejmuje wyłącznie zaakceptowany koszt przez `deductManpowerFromEmpire`.

Nie ma już sortowania, które dawałoby garnizonowi pierwszeństwo i leczyło jednostki sekwencyjnie.

### Przekazanie do ekonomii i żywego runtime

- `gra/src/game/turn-economy.ts:2283-2286, 2883-2896` przekazuje callback zmiany HP do ticka Manpower.
- `gra/src/main.ts:25293-25301` przekazuje bezpośrednio żywą tablicę `units` oraz wywołuje `syncLiveUnitHp`.
- `gra/src/game/manpower.ts:112-120` synchronizuje `hp` i `hpMax` po identyfikatorze jednostki.
- `gra/src/main.ts:24346-24375` buduje snapshot i zapisuje `units.slice()`. Jest to płytka kopia tablicy, więc pola `hp` i `hpMax` zmienione na żywych obiektach są obecne w snapshotcie i przechodzą przez JSON/save.

Wniosek: bieżący `main` spełnia wymaganie end-to-end; nie wymaga zmiany produkcyjnej.

## 4. Zmiana wykonana w tej rundzie

Zmieniony wyłącznie:

- `gra/tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs` — dodano trzy asercje z dwiema jednostkami o różnych `maxHP`, odwróconą kolejnością tablicy i pulą 300 MP. Test dowodzi, że obie jednostki są leczone proporcjonalnie do niedoboru HP, a pula nie jest przekraczana.

Nie zmieniono `gra/src/game/manpower.ts`, `gra/src/game/turn-economy.ts`, `gra/src/main.ts` ani danych gry, ponieważ ich aktualny stan już realizuje wymaganie.

## 5. Bramki

Środowisko zweryfikowane: esbuild `0.21.5`, TypeScript `5.9.3`, Vite `5.4.21`.

| Bramka | Wynik |
|---|---:|
| `node tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs` | **12 OK, 0 FAIL** |
| `node tools/manpower-test.cjs` | **63 OK, 0 FAIL** |
| `npx tsc --noEmit` | **PASS, 0 błędów** |
| `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` | **PASS, 835 modułów, kod 0** |
| `git diff --check` dla zmienionego testu | **PASS** |

Pierwsza próba testów w sandboxie została zablokowana przez proces esbuild i nie jest wynikiem funkcjonalnym; te same bramki uruchomione lokalnie poza sandboxem przeszły z wynikiem powyżej.

## 6. Diff, stan drzewa i commit

Przed zapisem raportu jedyny własny diff kodowy dotyczył testu wymienionego w §4. Drzewo główne zawiera także wcześniejsze, niezależne zmiany użytkownika i pliki robocze; nie zostały dotknięte ani stagingowane.

Ponieważ wykonano realną zmianę w teście i dodano raport, lokalny commit Operatora obejmie wyłącznie te dwa pliki. Deploy i push pozostają osobnymi bramkami właściciela.

## 7. Przekazanie

Rekomendacja routingu: uruchomić niezależnego Evaluatora Luna High na bieżącym diffie i historii commitów wymienionych w §2. Oczekiwany status po pozytywnej kontroli: `READY_FOR_FINAL_CONTROL`.
