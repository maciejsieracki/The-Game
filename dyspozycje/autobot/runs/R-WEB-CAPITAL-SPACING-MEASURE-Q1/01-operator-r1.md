STATUS: PASS
DOMAIN: GAME (WEB) — pomiar + diagnoza (bez zmian generatora)
TEMAT: R-WEB-CAPITAL-SPACING-MEASURE-Q1
GOAL: Wyjaśnić, dlaczego cywilizacje generują się „na kupie" mimo ogromu miejsca; podać zasady odległości per rozmiar mapy, pomiar, porównanie z wersją sprzed zmian, hipotezy i warianty poprawki.
ZMIANY/COMMIT: baza `4bbef081d`. Narzędzie `gra/tools/capital-spacing-measure.cjs` = `7584494e5` (+ ten raport w kolejnym commicie). Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`.

## 1. Zasady (plik:linia, `4bbef081d`)
Etykieta rozmiaru wg pola `w*h`: `clusters.ts:152-159` (<4800 mala, <12000 srednia, <25200 duza, <100000 ogromna). Tabele: `capitalMinSeparation` `:1470` (12/12/15/16/19), sep środków = +2 `:1508`, bufor bryły ceil(S/2) `:1533`, `capitalMinSeaDist` `:1370` (4/7/10/12/14), max = min+5 `:1385`. Wszystkie bramki są wyłączone dla `short<80` (`:1395-1412`, `:1485`).

| Menu | Wymiary | Etykieta | min sep stolic | pas od morza | typy (kamień/żelazo) | miasta-państwa |
|---|---|---|---|---|---|---|
| Malenki | 76×52 | mala | 0 (short<80) | 0 | 3/4 | 4 |
| Mały | 108×74 | srednia | 0 (short<80) | 0 | 4/5 | 5 |
| Standardowy | 168×120 | duza | 15 | 10–15 | 5/6 | 6 |
| Duży | 240×168 | ogromna | 16 | 12–17 | 6/10 | 7 |
| Ogromny | 336×238 | ogromna | 16 | 12–17 | 7/12 | 8 |
| Super Huge | 672×476 | super | 19 | 14–19 | 8/14 | 9 |

Typy: `e-start-params.json` `skala_mapy`; `main.ts:2391` przekazuje `_menuCivTypesCount`. Wartości `aktywne_typy`/`domyslni_rywale` z `map-gen-params.json` są tylko fallbackiem. Interfejs gry domyślnie ustawia udział lądu 30% dla każdego typu (`main.ts:26426`).

## 2. Pomiar (95 map, ziarna 1–8 Standard, 1–5 Mały, 1–3 Duży/Ogromny; rzeki wyłączone dla szybkości — NIE_ZMIERZONO wpływu rzek, brak mechanizmu wpływu na ląd/morze)
Para stolic bliżej niż 25 hex: 63% map (60/95); bliżej niż 30 hex: 74% (70/95). Standard: 68% / 83%. Najbliższa para to mediana ~15–17 (czyli dokładnie próg) w Standard-Kontynenty 30%, Pangea 30%/60%, w Dużym i Ogromnym-Pangea. Wszystkie żądane cywilizacje zostały umieszczone (placed=requested), zero ostrzeżeń `[clusters] placeClusterCenters`. Mały: Pangea 30% mediana min. pary = 5 hex (brak bramki).

Kluczowy wynik (Standard, 8 ziaren): środki klastrów (farthest-point) leżą daleko (mediana min. pary 53 hex Pangea 60%, 35 Kontynenty 30%), ale STOLICA jest wybierana na obrzeżu regionu: mediana dryfu stolicy od środka 31 hex (maks. 39–91). Sąsiednie regiony Voronoi mają stolice na wspólnej granicy, trzymane tylko progiem 15. Trace faz `placeClusterCentersAcrossLandmasses`: środki ≥45 po każdej fazie, stolice potem 15.

Pula kandydatów (hexy o seaDist ≥ min): Standard Kontynenty 30% ~570 z 5600 (10%), Pangea 30% ~900 z 2520, Wyspy 30%/50%: 0/117 (bramka niewykonalna → drabina rescue). Górna granica rozproszenia (greedy k-center z hexu gracza): Standard Kontynenty 28 (z bramką) / 58 (bez), Pangea 30% 19/30, Pangea 60% 47/56.

## 3. Regresja? NIE
`c799325c7^` (edb8fb561) i `6d37eb476^` (7d02dfc5b), Standard × 3 typy × 8 ziaren, udział lądu 30%: identyczne stolice w 24/24 mapach (dla `c799325c7^`), identyczne wskaźniki (75% <25, 91.7% <30). Zasady (tabela sep) obowiązują od FALA 169/171 (2026-08-02), `git log -- clusters.ts`. DELTA-3 (`gen-helpers.ts` queue) nie zmienia wyniku.

## 4. Wniosek
H6 (nowa, główna): wybór stolicy na obrzeżu regionu Voronoi, `clusters.ts:2262` (`(db)-(da)` malejąco od centroidu regionu). H1 częściowo: przy 30% lądu pas/pula jest wąska (Pangea 30% sufit tylko 19; Wyspy bez kandydatów). H3 potwierdzona: sep 15 to ~9% szerokości mapy. H2 obalona (środki OK), H4 obalona (placed=requested), H5 obalona (brak regresji). Nowe: Mały i Malenki mają zero bramek separacji.

Warianty (efekt zmierzony na kopii roboczej poza repo, Standard, 8 ziaren):
- A: stolica najbliżej centroidu regionu zamiast obrzeża (odwrócenie sortowania `:2262`). Kontynenty 30%: <25 hex 100%→50%, <30 100%→75%; Pangea 60%: mediana min. 17→48, 0/8 map <30 (przedtem 6/8); Pangea 30% bez zmiany (sufit 19); Wyspy 50% bez poprawy (3/8→5/8 <25).
- B: min sep proporcjonalny do krótszego boku (np. 0,15–0,2×short: Standard 18–24, Mały 11–15) plus bramki dla short<80; wykonalne poza Pangea 30% (sufit 19).
- C: A + B + rozszerzenie pasa od morza przy małej puli (Wyspy/Pangea 30%).
Rekomendacja do decyzji właściciela: A+B. NIE zmieniono kodu.

TESTY: `node --check` narzędzia OK; uruchomienia pomiarowe jak wyżej (dane w scratchpad, poza repo); `npm run build`/`dev` NIE uruchamiano; esbuild 0.28.2 z katalogu poza repo.
BLOKADY: brak. Ograniczenia: 3 ziarna na Duży/Ogromny; Super Huge NIE_ZMIERZONO; pomiar wariantu A tylko Standard.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja pomiaru), następnie decyzja ABC właściciela o wariancie.
DEPLOY/PUSH: NIE WYKONANO
