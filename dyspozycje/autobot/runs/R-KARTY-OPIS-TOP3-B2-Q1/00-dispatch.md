TEMAT:  R-KARTY-OPIS-TOP3-B2-Q1
RUNDA:  1/5
DATA:   2026-09-10
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 2 z wielu (fala treści `R-KARTY-OPIS-TOP3-Q1`, wzorem `R-KARTY-HISTORIA-Q1`).
Partia B1 (14 budynków) już zintegrowana i wdrożona (ROBOCZA FALA 371). Ta partia (B2)
dotyczy 14 kolejnych budynków, ta sama lista co `R-KARTY-HISTORIA-B2-Q1` — celowa
spójność wsadu (każdy z tych budynków ma już wypełnione pole `historia`).

## GOAL

Dopisz DWA pola do KAŻDEGO z poniższych 14 budynków w `gra/data/buildings.json`:
- `opis` (małe litery): string, 1-2 zdania.
- `top3` (małe litery): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. swiatynia
2. biblioteka
3. studnia
4. akwedukt
5. mennica
6. palisada
7. mury
8. koszary
9. magazyn
10. stela
11. palac
12. palac_ii
13. palac_iii
14. kuznia_zelaza

## WYTYCZNE PISANIA

Identyczne wytyczne jak w `R-KARTY-OPIS-TOP3-B1-Q1` (przeczytaj ten dispatch w całości
przed pisaniem — zawiera pełny przykład kalibracyjny i wszystkie zasady). W skrócie:

**`opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI budynku w rozgrywce — NIE
historia (osobne pole, już wypełnione), NIE powtórz liczb z innych sekcji karty.

**`top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE efekty/odblokowania — przeczytaj
realne dane budynku (`baza`/`przyrost`/`odblokowuje`/`techUnlock`/`maksPoziom`/`uwagi`
w `buildings.json`) i opisz własnymi słowami, NIE fikcyjne/wymyślone efekty.

**KRYTYCZNA LEKCJA Z RUNDY B1 (Evaluator FAIL, naprawione w Obronie):** 4 z 14 wpisów
`top3` partii B1 opisywały zmyślony wzrost „z każdym poziomem" dla budynków z
`maksPoziom=1`, gdzie pole `przyrost` jest jawnie MARTWE (potwierdzone własnym polem
`uwagi` budynku i kodem silnika `gra/src/game/production.ts`/`converters.ts` —
`buildingLevelForEpoch()` zwraca zawsze poziom 1 gdy `maksPoziom=1`, więc
`buildingEffectAtLevel()` nigdy nie dodaje `przyrostu`). **PRZED napisaniem `top3` dla
KAŻDEGO budynku tej partii: sprawdź jego `maksPoziom`.** Jeśli `maksPoziom=1` —
NIE pisz „rośnie z każdym poziomem"/„z każdym kolejnym poziomem" ani podobnych fraz
sugerujących progresję poziomową — opisz efekt jako STAŁY/PŁASKI. Jeśli `maksPoziom>1`
— progresja poziomowa jest realna i można ją opisać.

**ZAKAZANE (oba pola):** identyfikatory tematów/decyzji/ID z repozytorium, tekst
deweloperski, odniesienia do „gracza" w trzeciej osobie technicznej, duplikacja zdań
z pola `historia`.

Format JSON: UTF-8 wprost (nie `\uXXXX`). Zwaliduj `jq . gra/data/buildings.json`.
NIE zmieniaj żadnego INNEGO pola żadnego budynku (w tym `historia`) i żadnego budynku
SPOZA tej listy 14.

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty JEDNEGO budynku z tej listy (np.
Świątynia) pokazujący sekcje Opis+Rys historyczny+Top 3 wypełnione, w poprawnej
kolejności. Zapisz PNG pod `dowody/opis-top3-swiatynia.png` w worktree, podaj ścieżkę
w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/buildings.json` bez błędu składni.
2. Wszystkich 14 budynków ma niepuste `opis` i `top3` (dokładnie 3 pozycje, niepuste).
3. ZERO wpisów `top3` sugerujących progresję poziomową dla budynku z `maksPoziom=1`
   (sprawdź to jawnie, budynek po budynku, w raporcie).
4. `git diff` pokazuje WYŁĄCZNIE dodane pola `opis`/`top3` tych 14 wpisów, zero innych
   zmian.
5. Zrzut ekranu istnieje, pokazuje wszystkie 3 sekcje z treścią.
6. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące testy
   entity-cards/CivPedia (w tym `entity-card-historia-section-test.cjs`,
   `entity-card-contract-test.cjs`, `civpedia-budynki-historia-test.cjs`) bez regresu.

## Allowlista

- `gra/data/buildings.json` (WYŁĄCZNIE pola `opis`/`top3` tych 14 wpisów)
- `dowody/opis-top3-swiatynia.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/units.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-b2`, gałąź `autobot/R-KARTY-OPIS-TOP3-B2-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
