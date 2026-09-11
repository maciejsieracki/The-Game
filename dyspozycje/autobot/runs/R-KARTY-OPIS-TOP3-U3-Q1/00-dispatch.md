TEMAT:  R-KARTY-OPIS-TOP3-U3-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 3 z 6 fali treści jednostek `R-KARTY-OPIS-TOP3-Q1`. Partie U1 (13 jednostek)
i U2 (13 jednostek) już zintegrowane (26/75). Ta partia (U3) dotyczy kolejnych
13 jednostek, rozłącznych z U1/U2.

## GOAL

Dopisz DWA pola do KAŻDEJ z poniższych 13 jednostek w `gra/data/units.json`:
- `Opis` (WIELKA litera na początku): string, 1-2 zdania.
- `Top3` (WIELKA litera): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. Rydwan egipski
2. Wojownik z khopesh
3. Medżaj (Gwardia Faraona)
4. Łucznik nubijski
5. Łucznik sumeryjski
6. Rydwan sumeryjski
7. Włócznik sumeryjski
8. Gwardia Królewska Sumeru
9. Wojownik mykeński
10. Rydwan mykeński
11. Wojownik Sherden
12. Halabardnik Shang
13. Rydwan Shang

## WYTYCZNE PISANIA OPIS/TOP3

Identyczne wytyczne jak `R-KARTY-OPIS-TOP3-U1-Q1`/`U2-Q1` (przeczytaj U1 w całości
przed pisaniem — pełny przykład kalibracyjny). W skrócie:

**`Opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI jednostki — NIE historia,
NIE powtórz surowych liczb.

**`Top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE cechy — przeczytaj REALNE dane
(`Atak`/`Obrona`/`Pancerz`/`Uderzenie`/`Ruch`/`Zasięg ataku`/bonusy `Bonus vs <Typ> %`/
`Zmiana na`/`Rola (linia)`/`Super-jednostka`/`Klasa`), własne słowa, NIE fikcyjne.

**Jednostki NIE MAJĄ poziomów/przyrostu** (mechanizm budynkowy nie istnieje dla
jednostek). Jedyna forma zmiany to jednorazowy awans przez `Zmiana na`.

**KRYTYCZNA LEKCJA Z RUND U1/U2 (Evaluator FAIL w U1, naprawione; U2 zero
zarzutów dzięki tej lekcji): PRZED napisaniem „najwyższy/najlepszy X w tej
partii" — PORÓWNAJ wartość pola X ZE WSZYSTKIMI 13 jednostkami tej partii i
sprawdź czy nie ma remisu.** Jeśli jest remis (dwie lub więcej jednostek ma tę
samą wartość), napisz to WPROST („remis z Y") zamiast sugerować jednoznaczną
przewagę. Superlatyw bez zastrzeżeń wolno użyć TYLKO gdy wartość jest naprawdę
unikalnym maksimum/minimum w tej konkretnej partii 13 jednostek.

**Bonusy przeciw typom (`Bonus vs X %`):** niezerowy bonus to silny kandydat na
`Top3` — opisz jako przewagę taktyczną z REALNĄ wartością %.

**ZAKAZANE:** identyfikatory tematów/ID z repozytorium, tekst deweloperski,
duplikacja zdań z `Historia`, zmyślone mechaniki.

Format JSON: UTF-8 wprost (nie `\uXXXX`). Zwaliduj `jq . gra/data/units.json`. NIE
zmieniaj żadnego INNEGO pola żadnej z tych 13 jednostek i żadnej jednostki SPOZA
tej listy (w tym jednostek z partii U1/U2).

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty JEDNEJ jednostki z tej listy (np.
Rydwan egipski) pokazujący sekcje Opis+Rys historyczny+Top 3 wypełnione, w
poprawnej kolejności. Zapisz PNG pod `dowody/opis-top3-rydwan-egipski.png` w
worktree, podaj ścieżkę w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkich 13 jednostek ma niepuste `Opis` i `Top3` (dokładnie 3 pozycje, niepuste).
3. ZERO wpisów `Top3` sugerujących progresję poziomową/rozwój jednostki w czasie.
4. ZERO superlatywów bez zastrzeżeń tam, gdzie w tej partii istnieje remis pola
   liczbowego (sprawdź to jawnie, jednostka po jednostce, w raporcie).
5. `git diff` pokazuje WYŁĄCZNIE dodane pola `Opis`/`Top3` tych 13 wpisów, zero
   innych zmian.
6. Zrzut ekranu istnieje, pokazuje wszystkie 3 sekcje z treścią.
7. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące
   testy entity-cards/CivPedia dla jednostek bez regresu.

## Allowlista

- `gra/data/units.json` (WYŁĄCZNIE pola `Opis`/`Top3` tych 13 wpisów)
- `dowody/opis-top3-rydwan-egipski.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/buildings.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-u3`, gałąź `autobot/R-KARTY-OPIS-TOP3-U3-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
