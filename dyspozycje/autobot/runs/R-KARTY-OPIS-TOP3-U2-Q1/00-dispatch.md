TEMAT:  R-KARTY-OPIS-TOP3-U2-Q1
RUNDA:  1/5
DATA:   2026-09-11
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 2 z 6 fali treści jednostek `R-KARTY-OPIS-TOP3-Q1` (wzorem partii budynków
B1-B3, zamkniętych). Uruchamiana RÓWNOLEGLE z `R-KARTY-OPIS-TOP3-U1-Q1` (różne
jednostki, brak nakładania plików — obie partie edytują `gra/data/units.json`, ale
rozłączne zestawy wpisów; integracja nastąpi sekwencyjnie, nie jednocześnie).

## GOAL

Dopisz DWA pola do KAŻDEJ z poniższych 13 jednostek w `gra/data/units.json`:
- `Opis` (WIELKA litera na początku): string, 1-2 zdania.
- `Top3` (WIELKA litera): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. Triari
2. Jeździec chiński
3. Hu Ben Wei (Gwardia Tygrysa)
4. Impi
5. Oszczepnik Zulu (Izijula)
6. uThulwana (Białe Tarcze)
7. Wojownik z maczugą (Chaska)
8. Wojownik z toporem
9. Procarz (Huaracoc)
10. Oszczepnik (Estólica)
11. Królewska Gwardia
12. Rydwan konny
13. Łucznik egipski

## WYTYCZNE PISANIA OPIS/TOP3

Identyczne wytyczne jak w `R-KARTY-OPIS-TOP3-U1-Q1` (przeczytaj ten dispatch w całości
przed pisaniem — pełny przykład kalibracyjny i wszystkie zasady). W skrócie:

**`Opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI jednostki w rozgrywce — NIE
historia (osobne pole, już wypełnione), NIE powtórz surowych liczb z reszty karty.

**`Top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE cechy — przeczytaj REALNE dane
jednostki w `units.json` (`Atak`/`Obrona`/`Pancerz`/`Uderzenie`/`Ruch`/`Zasięg ataku`/
bonusy `Bonus vs <Typ> %`/`Zmiana na`/`W zamian za`/`Rola (linia)`/`Super-jednostka`/
`Klasa`) i opisz własnymi słowami, NIE fikcyjne cechy.

**KRYTYCZNA RÓŻNICA WZGLĘDEM BUDYNKÓW — jednostki NIE MAJĄ poziomów/przyrostu.**
Jednostki nie mają żadnego mechanizmu progresji jak budynkowe `maksPoziom`/`przyrost`.
NIE pisz o „ulepszaniu"/„rozwoju" jednostki w czasie — jedyna forma zmiany to
JEDNORAZOWY awans na inną jednostkę przez pole `Zmiana na` (osobna jednostka w
tabeli, nie „poziom" tej samej). Jeśli `Zmiana na` niepuste, możesz wspomnieć że
jednostka jest zastępowana nowocześniejszą wersją — NIE zgaduj warunku (technologii)
jeśli nie jest jawnie podany.

**Bonusy przeciw typom (`Bonus vs X %`):** niezerowy bonus przeciw konkretnemu typowi
to silny kandydat na `Top3` — opisz jako przewagę taktyczną, cytując REALNĄ wartość %.

**ZAKAZANE (oba pola):** identyfikatory tematów/decyzji/ID z repozytorium, tekst
deweloperski, duplikacja zdań z pola `Historia`, zmyślone mechaniki gry
nieodzwierciedlone w danych.

Format JSON: UTF-8 wprost (nie `\uXXXX`). Zwaliduj `jq . gra/data/units.json`. NIE
zmieniaj żadnego INNEGO pola żadnej z tych 13 jednostek (w tym `Historia`) i żadnej
jednostki SPOZA tej listy 13 (W TYM jednostek z partii U1 — sprawdź listę
`R-KARTY-OPIS-TOP3-U1-Q1`, zero pokrywania się).

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty JEDNEJ jednostki z tej listy (np.
Triari) pokazujący sekcje Opis+Rys historyczny+Top 3 wypełnione, w poprawnej
kolejności. Zapisz PNG pod `dowody/opis-top3-triari.png` w worktree, podaj ścieżkę
w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/units.json` bez błędu składni.
2. Wszystkich 13 jednostek ma niepuste `Opis` i `Top3` (dokładnie 3 pozycje, niepuste).
3. ZERO wpisów `Top3` sugerujących progresję poziomową/rozwój jednostki w czasie.
4. `git diff` pokazuje WYŁĄCZNIE dodane pola `Opis`/`Top3` tych 13 wpisów, zero innych
   zmian.
5. Zrzut ekranu istnieje, pokazuje wszystkie 3 sekcje z treścią.
6. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące testy
   entity-cards/CivPedia dla jednostek bez regresu.

## Allowlista

- `gra/data/units.json` (WYŁĄCZNIE pola `Opis`/`Top3` tych 13 wpisów)
- `dowody/opis-top3-triari.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/buildings.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-u2`, gałąź `autobot/R-KARTY-OPIS-TOP3-U2-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
