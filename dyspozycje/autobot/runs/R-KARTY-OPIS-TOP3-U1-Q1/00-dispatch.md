TEMAT:  R-KARTY-OPIS-TOP3-U1-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Fala treści `R-KARTY-OPIS-TOP3-Q1` (wzorem `R-KARTY-HISTORIA-Q1`) domknęła wszystkie
budynki (B1+B2+B3, 42/42). Ta partia (U1) rozpoczyna analogiczną falę dla JEDNOSTEK —
75 jednostek razem, wszystkie mają już wypełnione pole `Historia` (fala
`R-KARTY-HISTORIA-Q1`), ZERO ma dziś `Opis`/`Top3`. U1 to pierwsza z 6 partii
(U1-U6, ok. 12-13 jednostek każda).

## GOAL

Dopisz DWA pola do KAŻDEJ z poniższych 13 jednostek w `gra/data/units.json`:
- `Opis` (WIELKA litera na początku — konwencja `units.json` różni się od
  `buildings.json`, sprawdź wprost istniejące pola przed pisaniem): string, 1-2 zdania.
- `Top3` (WIELKA litera): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. Wojownik
2. Procarz
3. Oszczepnik
4. Łucznik
5. Zwiadowca
6. Włócznik
7. Wojownik z mieczem i tarczą
8. Rydwan (woły)
9. Konnica
10. Galera
11. Falanga
12. Hieros Lochos (Święty Zastęp)
13. Hastati

## WYTYCZNE PISANIA OPIS/TOP3

**`Opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI jednostki w rozgrywce
(piechota liniowa, jednostka oblężnicza, kawaleria zwiadowcza itd.) — NIE historia
(osobne pole, już wypełnione), NIE powtórz surowych liczb z reszty karty.

**`Top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE cechy/mocne strony — przeczytaj
REALNE dane jednostki w `units.json` (`Atak`/`Obrona`/`Pancerz`/`Uderzenie`/`Ruch`/
`Zasięg ataku`/bonusy `Bonus vs <Typ> %`/`Zmiana na`/`W zamian za`/`Rola (linia)`/
`Super-jednostka`/`Klasa`) i opisz własnymi słowami, NIE fikcyjne/wymyślone cechy.

**KRYTYCZNA RÓŻNICA WZGLĘDEM BUDYNKÓW — jednostki NIE MAJĄ poziomów/przyrostu.**
Budynki miały pole `maksPoziom`/`przyrost` (progresja przy rozbudowie) — jednostki
NIE MAJĄ żadnego analogicznego mechanizmu. NIE pisz o „ulepszaniu"/„rozwoju" jednostki
w czasie — jedyna forma zmiany to JEDNORAZOWY awans na inną jednostkę przez pole
`Zmiana na` (jeśli niepuste, to osobna jednostka w tabeli, nie „poziom" tej samej).
Jeśli `Zmiana na` jest niepuste, możesz wspomnieć że jednostka jest zastępowana przez
nowocześniejszą wersję po zdobyciu odpowiedniej technologii — ale NIE zgaduj warunku
(technologii) jeśli nie jest jawnie podany w dostępnych polach.

**Bonusy przeciw typom (`Bonus vs X %`):** jeśli jednostka ma niezerowy bonus przeciw
konkretnemu typowi (np. `Bonus vs Spearman % = 15`), to silny kandydat na pozycję
`Top3` — opisz go jako przewagę taktyczną, cytując REALNĄ wartość procentową.

**ZAKAZANE (oba pola):** identyfikatory tematów/decyzji/ID z repozytorium, tekst
deweloperski, duplikacja zdań z pola `Historia`, zmyślone mechaniki gry
nieodzwierciedlone w danych.

Format JSON: UTF-8 wprost (nie `\uXXXX`). Zwaliduj `jq . gra/data/units.json`. NIE
zmieniaj żadnego INNEGO pola żadnej z tych 13 jednostek (w tym `Historia`) i żadnej
jednostki SPOZA tej listy 13.

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty JEDNEJ jednostki z tej listy (np.
Wojownik) pokazujący sekcje Opis+Rys historyczny+Top 3 wypełnione, w poprawnej
kolejności (wzorzec `entity-card-historia-section-test.cjs`: Wymagania→Rys
historyczny→Charakterystyka, Opis/Top3 wstawione między). Zapisz PNG pod
`dowody/opis-top3-wojownik.png` w worktree, podaj ścieżkę w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkich 13 jednostek ma niepuste `Opis` i `Top3` (dokładnie 3 pozycje, niepuste).
3. ZERO wpisów `Top3` sugerujących progresję poziomową/rozwój jednostki w czasie
   (sprawdź to jawnie w raporcie — jednostki nie mają takiego mechanizmu w ogóle).
4. `git diff` pokazuje WYŁĄCZNIE dodane pola `Opis`/`Top3` tych 13 wpisów, zero innych
   zmian.
5. Zrzut ekranu istnieje, pokazuje wszystkie 3 sekcje (Opis/Rys historyczny/Top3) z
   treścią.
6. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące testy
   entity-cards/CivPedia dla jednostek (w tym `entity-card-historia-section-test.cjs`,
   `entity-card-contract-test.cjs`, dowolne testy `civpedia-jednostki-*` jeśli istnieją
   — sprawdź `gra/tools/*.cjs`) bez regresu.

## Allowlista

- `gra/data/units.json` (WYŁĄCZNIE pola `Opis`/`Top3` tych 13 wpisów)
- `dowody/opis-top3-wojownik.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/buildings.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-u1`, gałąź `autobot/R-KARTY-OPIS-TOP3-U1-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
