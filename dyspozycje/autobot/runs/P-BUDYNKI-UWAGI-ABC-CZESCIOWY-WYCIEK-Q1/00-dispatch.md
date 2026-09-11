TEMAT:  P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Evaluatora przy okazji `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` rundy 2
(2026-08-21, zarejestrowane w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, jawnie
NIE wymaga ABC — bug filtra/regexa, nie decyzja produktowa). Nigdy
niedispatchowane. Weryfikacja orkiestratora 2026-09-11 potwierdziła: temat
NADAL aktualny i realny (nie zmieniony przez późniejszą migrację
entityCards), ale zawężony w zakresie względem oryginalnego opisu —
`terrain-improvements.json` NIE jest już w zakresie (wiersz „Uwagi" tam
TRWALE usunięty inną, wcześniejszą naprawą, `improvementAdapter.ts:202-204`,
komentarz "T-KARTY-HISTORIA-INFRA-Q1 (c)"; `wonderAdapter.ts` też celowo
nigdy nie renderuje `uwagi`). Jedyny pozostały żywy konsument: `buildings.json`
→ `gra/src/ui/entityCards/buildingAdapter.ts:19` (`playerFacingNote(def.uwagi)`)
→ współdzielona funkcja w `gra/src/ui/cityPanel.ts`.

## GOAL

Funkcje `isDevOnlyPlayerText()`/`stripInlineDevAnnotations()`/`playerFacingNote()`
(`gra/src/ui/cityPanel.ts:7132-7167`) mają POPRAWNIE ukrywać notatki
deweloperskie oznaczone wzorcem `ABC-<numer>[ <litera>]` we WSZYSTKICH
wpisach `uwagi` w `gra/data/buildings.json`, zostawiając WYŁĄCZNIE legalny,
gracz-facing tekst. Dziś (potwierdzone realnymi wpisami w `buildings.json`)
zawodzi na dwóch klasach:

1. **Partial-strip do pierwszej kropki** — regex `[^.]*\.?` w
   `stripInlineDevAnnotations()` wycina notatkę dev tylko do PIERWSZEGO
   kropki, więc wieloznaniowe notatki dev zostawiają resztę. Przykład,
   `buildings.json` linia ok. 442 (`uwagi` portu): `"ABC-20 B: suma bonusów
   Port + Port wielki w JSON. LANCUCH W GORE: maksPoziom=1 -- wartosc stala
   per tier, rosnie WYLACZNIE przez awans. Pole 'przyrost' zostaje w danych
   jako notatka na przyszlosc, obecnie martwe. Budowla portowa epoki Żelaza
   -> drewno+kamień (nie drewno+cegła), zeby miasto bez zloza gliny nie
   zostalo bez portu."` — po dzisiejszym filtrze graczowi ZOSTAJE widoczne
   zdanie „LANCUCH W GORE: maksPoziom=1 ... obecnie martwe." (czysty dev-tekst),
   mimo że ostatnie zdanie („Budowla portowa...") jest legalne i powinno zostać.
2. **Brak dwukropka po numerze ABC** — regex wymaga `\s*:\s*` zaraz po
   `ABC-\d+(?:\s?[A-Za-z])?`, więc notatki w stylu „(merge bez zmian, ABC-21
   B)." (parentetyczny dev-dopisek BEZ dwukropka) w ogóle nie pasują i
   przechodzą NIETKNIĘTE do gracza. Przykład, `buildings.json` linia ok.
   1619 (`uwagi` Akademii): „...Teatr nadal ukryty z produkcji i wliczony w
   Akademie (merge bez zmian, ABC-21 B)." — dziś graczowi zostaje CAŁY ten
   dopisek w nawiasie.

Napraw REGEX/logikę tak, żeby oba przykłady wyżej dawały czysty, gracz-facing
tekst (bez utraty legalnej treści — np. w przykładzie 1 zdanie „Budowla
portowa epoki Żelaza -> drewno+kamień..." MUSI zostać, to legalna informacja
o koszcie budowy). Przeczytaj WSZYSTKIE wpisy `uwagi` w `buildings.json`
zawierające `ABC-` (użyj `grep -n '"uwagi"' gra/data/buildings.json | grep
-iE 'ABC-[0-9]+'`) i upewnij się, że naprawiony filtr daje poprawny,
gracz-facing wynik dla KAŻDEGO z nich — nie tylko dwóch przykładów wyżej.

## OGRANICZENIA

- Zmieniasz WYŁĄCZNIE logikę filtra w `gra/src/ui/cityPanel.ts` (funkcje
  `isDevOnlyPlayerText`/`stripInlineDevAnnotations`/`playerFacingNote` i/lub
  istniejący test `gra/tools/citypanel-uwagi-abc-filter-test.cjs`, rozszerzony
  o nowe przypadki z `buildings.json`). ZERO zmian w `gra/data/buildings.json`
  ani `gra/data/tech.json` (dane zostają, filtr ma je poprawnie oczyścić w
  runtime, nie na dysku).
- Nie zmieniaj zachowania dla `tech.json` (`t.Uwagi`, karta technologii) —
  istniejąca bramka `citypanel-uwagi-abc-filter-test.cjs` (35/35, z rundy 2
  `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`) MUSI pozostać w 100% zielona, zero
  regresu. To współdzielona funkcja — każda zmiana regexa dotyka OBU
  konsumentów naraz.
- ZAKAZANE fabrykowanie nowych wzorców „legalnej treści" — jeśli cała notatka
  jest dev-only (jak linia 1667 przykładowo: „ABC-21 B: wchodzi w merge
  Akademia — nie buduj osobno"), poprawny wynik to `null`/brak wiersza w
  karcie, NIE pusty string ani resztki interpunkcji.

## DOWÓD (obowiązkowy)

1. Rozszerzony `gra/tools/citypanel-uwagi-abc-filter-test.cjs` — dodaj
   przypadki testowe DOKŁADNIE z realnych wpisów `buildings.json` (co
   najmniej te dwa z GOAL wyżej + wszystkie inne z `ABC-` znalezione grepem),
   assercje na dokładny oczekiwany gracz-facing string (lub `null`).
2. Żywy zrzut ekranu (Playwright/Chromium) karty budynku Port (albo innego
   z listy) w panelu miasta, pokazujący wiersz „Uwagi" BEZ śladu „ABC-”/
   „LANCUCH W GORE”/innego dev-tekstu, z zachowaną legalną treścią. Zapisz
   pod `dowody/uwagi-abc-filter-buildings.png`.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Rozszerzony test 100% PASS, w tym oba przykłady z GOAL i pełny zbiór
   wpisów `ABC-` w `buildings.json`.
2. Istniejący `citypanel-uwagi-abc-filter-test.cjs` (przypadki tech.json)
   nadal 100% PASS — zero regresu.
3. `tsc --noEmit` 0 błędów.
4. 5 bramek referencyjnych bez regresu (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test).
5. Zrzut ekranu istnieje i pokazuje czysty, gracz-facing tekst.
6. `git diff` pokazuje WYŁĄCZNIE zmiany w `cityPanel.ts` (funkcje filtra) +
   test + nowy plik dowodu — zero zmian w `gra/data/*.json`.

## Allowlista

- `gra/src/ui/cityPanel.ts` (WYŁĄCZNIE funkcje `isDevOnlyPlayerText`/
  `stripInlineDevAnnotations`/`playerFacingNote`)
- `gra/tools/citypanel-uwagi-abc-filter-test.cjs`
- `dowody/uwagi-abc-filter-buildings.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/data/*.json`, `gra/src/ui/entityCards/*`
(poza czytaniem), pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-budynki-uwagi-abc-wyciek`, gałąź
`autobot/P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1`, baza `origin/main`. C-001:
zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
