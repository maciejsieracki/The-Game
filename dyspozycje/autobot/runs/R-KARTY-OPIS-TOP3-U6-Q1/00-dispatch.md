TEMAT:  R-KARTY-OPIS-TOP3-U6-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 6 z 6, OSTATNIA partia fali treści jednostek `R-KARTY-OPIS-TOP3-Q1`.
Partie U1-U5 (64 jednostki) już zintegrowane. Ta partia (U6) kończy WSZYSTKIE
jednostki (75/75) i zamyka CAŁĄ falę treści `R-KARTY-OPIS-TOP3-Q1`
(budynki B1-B3 już zamknięte wcześniej).

## GOAL

Dopisz DWA pola do KAŻDEJ z poniższych 11 jednostek w `gra/data/units.json`:
- `Opis` (WIELKA litera na początku): string, 1-2 zdania.
- `Top3` (WIELKA litera): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. Piechota neobabilońska
2. Tyrski miecznik
3. Wojownik fenicki
4. Gwardia Tyreńska
5. Thorakites
6. Evocati
7. iButho z iklwa
8. Gwardzista z champi
9. Wojownik z żelaznym khopesh
10. Mur tarcz (Sargonid)
11. Miecznik galijski

## WYTYCZNE PISANIA OPIS/TOP3

Identyczne wytyczne jak `R-KARTY-OPIS-TOP3-U1-Q1`...`U5-Q1` (przeczytaj U1 w
całości przed pisaniem). W skrócie:

**`Opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI jednostki — NIE historia,
NIE powtórz surowych liczb.

**`Top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE cechy — przeczytaj REALNE dane
(`Atak`/`Obrona`/`Pancerz`/`Uderzenie`/`Ruch`/`Zasięg ataku`/bonusy `Bonus vs <Typ> %`/
`Zmiana na`/`W zamian za`/`Rola (linia)`/`Super-jednostka`/`Klasa`), własne słowa,
NIE fikcyjne.

**Jednostki NIE MAJĄ poziomów/przyrostu.** Jedyna forma zmiany to jednorazowy
awans przez `Zmiana na`. Kilka jednostek w tej partii (np. Evocati, Thorakites)
to prawdopodobnie zaawansowane zamienniki wcześniejszych jednostek przez pole
`W zamian za` — jeśli tak, opisz to jako fakt strukturalny (X zastępuje Y po
spełnieniu warunku odblokowania), NIE jako „poziom" tej samej jednostki.

**KRYTYCZNA LEKCJA (Evaluator FAIL w U1 i U5, poprawione oba razy — PRZED
napisaniem „najwyższy/najlepszy X w tej partii" ZAWSZE porównaj wartość pola X
ZE WSZYSTKIMI 11 jednostkami tej partii, WŁĄCZNIE z tymi o zbliżonych, nie
tylko oczywiście najwyższych wartościach — błąd w U5 polegał na pominięciu
DWÓCH jednostek z wartością pośrednią między opisywaną a rzekomo jedyną
wyższą).** Jeśli remis lub pominięta wartość pośrednia, napisz to WPROST.
Superlatyw bez zastrzeżeń tylko przy prawdziwie unikalnym, W PEŁNI
zweryfikowanym maksimum/minimum.

**Bonusy przeciw typom (`Bonus vs X %`):** niezerowy bonus to silny kandydat na
`Top3` — opisz jako przewagę taktyczną z REALNĄ wartością %.

**ZAKAZANE:** identyfikatory tematów/ID z repozytorium, tekst deweloperski,
duplikacja zdań z `Historia`, zmyślone mechaniki.

Format JSON: UTF-8 wprost (nie `\uXXXX`). Zwaliduj `jq . gra/data/units.json`. NIE
zmieniaj żadnego INNEGO pola żadnej z tych 11 jednostek i żadnej jednostki SPOZA
tej listy (w tym jednostek z partii U1-U5).

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty JEDNEJ jednostki z tej listy (np.
Evocati) pokazujący sekcje Opis+Rys historyczny+Top 3 wypełnione, w poprawnej
kolejności. Zapisz PNG pod `dowody/opis-top3-evocati.png` w worktree, podaj
ścieżkę w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkich 11 jednostek ma niepuste `Opis` i `Top3` (dokładnie 3 pozycje, niepuste).
3. ZERO wpisów `Top3` sugerujących progresję poziomową/rozwój jednostki w czasie.
4. ZERO superlatywów błędnych lub niekompletnych (sprawdź KAŻDY superlatyw
   przeciwko WSZYSTKIM 11 jednostkom partii, nie tylko oczywistym kandydatom —
   udokumentuj to jawnie, jednostka po jednostce, w raporcie).
5. `git diff` pokazuje WYŁĄCZNIE dodane pola `Opis`/`Top3` tych 11 wpisów, zero
   innych zmian.
6. Zrzut ekranu istnieje, pokazuje wszystkie 3 sekcje z treścią.
7. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące
   testy entity-cards/CivPedia dla jednostek bez regresu.

## Allowlista

- `gra/data/units.json` (WYŁĄCZNIE pola `Opis`/`Top3` tych 11 wpisów)
- `dowody/opis-top3-evocati.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/buildings.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-u6`, gałąź `autobot/R-KARTY-OPIS-TOP3-U6-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
