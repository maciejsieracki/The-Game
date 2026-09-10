TEMAT:  R-KARTY-OPIS-TOP3-B3-Q1
RUNDA:  1/5
DATA:   2026-09-10
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Część 3 z wielu (fala treści `R-KARTY-OPIS-TOP3-Q1`, wzorem `R-KARTY-HISTORIA-Q1`).
Ta partia (B3) dotyczy 13 budynków z listy `R-KARTY-HISTORIA-B3-Q1` PLUS jeden budynek
(„garnizon") nieobjęty żadną z trzech partii fali „Rys historyczny" — 14 budynków razem,
OSTATNIA partia budynków (po niej zostają wyłącznie jednostki, U1-U6+).

## GOAL

Dopisz DWA pola do KAŻDEGO z poniższych 14 budynków w `gra/data/buildings.json`:
- `opis` (małe litery): string, 1-2 zdania.
- `top3` (małe litery): tablica DOKŁADNIE 3 obiektów `{ "tytul": "...", "tekst": "..." }`.

1. wielka_kuznia
2. fort
3. baszta
4. warsztat_oblezniczy
5. akademia
6. teatr
7. sad
8. dom_starszyzny
9. dwor_zarzadcy
10. pretorium
11. trybunal
12. laznia_publiczna
13. akademia_wojskowa
14. garnizon

**UWAGA — „garnizon" nie ma dziś wypełnionego pola `historia`** (jedyny budynek w grze
w tym stanie, pominięty przez wcześniejszą falę treści). Napisz dla niego RÓWNIEŻ pole
`historia` (4-6 zdań, DOKŁADNIE wg wytycznych z `R-KARTY-HISTORIA-B1-Q1` — realny kontekst
historyczny garnizonu wojskowego, styl Civilopedii) — to jedyne odstępstwo od reszty tej
partii (pozostałe 13 budynków mają już `historia` wypełnioną, nie dotykaj jej).

## WYTYCZNE PISANIA OPIS/TOP3

Identyczne wytyczne jak w `R-KARTY-OPIS-TOP3-B1-Q1`/`B2-Q1` (przeczytaj B1 w całości —
pełny przykład kalibracyjny i wszystkie zasady). W skrócie:

**`opis` (1-2 zdania):** krótkie, growe podsumowanie ROLI budynku — NIE historia, NIE
powtórz liczb z innych sekcji.

**`top3` (3 pozycje):** 3 NAJISTOTNIEJSZE, KONKRETNE efekty — przeczytaj realne dane
budynku (`baza`/`przyrost`/`odblokowuje`/`techUnlock`/`maksPoziom`/`uwagi`), własne
słowa, NIE zmyślone.

**KRYTYCZNA LEKCJA Z RUNDY B1 (Evaluator FAIL, naprawione w Obronie):** budynki z
`maksPoziom=1` mają MARTWE pole `przyrost` (potwierdzone `production.ts`/`converters.ts`)
— PRZED napisaniem `top3` dla KAŻDEGO budynku sprawdź `maksPoziom`; jeśli `=1`, NIE pisz
„rośnie z każdym poziomem" ani podobnych fraz, opisz efekt jako STAŁY. Jeśli `>1`,
progresja poziomowa jest realna.

**ZAKAZANE:** identyfikatory repozytorium, tekst deweloperski, duplikacja z `historia`.

Format JSON: UTF-8 wprost. Zwaliduj `jq . gra/data/buildings.json`. NIE zmieniaj żadnego
INNEGO pola żadnego z tych 14 budynków (poza dodaniem `historia` WYŁĄCZNIE dla
„garnizon", jak opisano wyżej) i żadnego budynku SPOZA tej listy.

## DOWÓD WIZUALNY (obowiązkowy)

Żywy zrzut ekranu (Playwright/Chromium) karty budynku „Garnizon" (jedyny z tej partii
z NOWYM polem `historia` — najlepszy dowód że WSZYSTKIE cztery sekcje: Opis, Rys
historyczny, Top 3 działają razem) pokazujący poprawną kolejność. Zapisz PNG pod
`dowody/opis-top3-historia-garnizon.png`, podaj ścieżkę w raporcie.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. `jq . gra/data/buildings.json` bez błędu składni.
2. Wszystkich 14 budynków ma niepuste `opis` i `top3` (dokładnie 3 pozycje, niepuste);
   „garnizon" DODATKOWO ma niepuste `historia` (4-6 zdań).
3. ZERO wpisów `top3` sugerujących progresję poziomową dla budynku z `maksPoziom=1`.
4. `git diff` pokazuje WYŁĄCZNIE dodane pola tych 14 wpisów (opis/top3 wszystkie 14,
   plus historia wyłącznie dla garnizon), zero innych zmian.
5. Zrzut ekranu istnieje, pokazuje wszystkie 3 (dla garnizon: wszystkie 3, w tym nową
   historię) sekcje z treścią.
6. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych bez regresu + istniejące testy
   entity-cards/CivPedia (w tym `entity-card-historia-section-test.cjs`,
   `entity-card-contract-test.cjs`, `civpedia-budynki-historia-test.cjs`) bez regresu.

## Allowlista

- `gra/data/buildings.json` (WYŁĄCZNIE pola `opis`/`top3` tych 14 wpisów +
  `historia` wyłącznie dla „garnizon")
- `dowody/opis-top3-historia-garnizon.png` (nowy plik, dowód)

Zakazane: wszystko inne, w tym `gra/src/ui/entityCards/*`, `gra/data/units.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-karty-opis-top3-b3`, gałąź `autobot/R-KARTY-OPIS-TOP3-B3-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 500 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
