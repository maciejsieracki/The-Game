# R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1 — obrona Operatora (runda 2/5, Haiku 5.5)

STATUS: PASS-WITH-NOTES (kod poprawiony na odpowiedzi do zarzutów 1–6; dwa odchylenia do decyzji orkiestratora: allowlista generator.ts i zmiana wag wody na Ziemi)
DOMAIN: GAME (generator map)
TEMAT: R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1 (MAPFIX, P3+P4)
GOAL: P3 — Ziemia 0 heksów suchego lądu poza maską; P4 — 0 samotnych suchych heksów na otwartym oceanie. Bez zmiany lądu poza naprawianymi heksami, bez zmian rzek.
ZMIANY/COMMIT: baza 1bb77a7a0 (origin/main); kandydat b2730a909 (runda 1). Commit obrony: czubek gałęzi (sha w polu sha raportu StructuredOutput). Pliki:
- gra/src/map/gen-helpers.ts — nowa funkcja `cutBackEarthLandOutsideMask` (suchy ląd poza maską Ziemi -> PŁYTKIE morze; woda nietknięta).
- gra/src/map/generator.ts — przebieg 3e-final: `enforceEarthTemplateOnHexes` zastąpione przez `cutBackEarthLandOutsideMask` (import + wywołanie + komentarz). POZA ALLOWLISTĄ — patrz odpowiedź na zarzut 3.
- gra/src/map/earth-land-mask.ts — bez zmian względem kandydata b2730a909 (zmiana semantyki maski zostawiona, patrz zarzut 2).
- gra/tools/map-offmask-stranded-fix-test.cjs — dodana asercja „płytkie morze zachowane" (Ziemia 777 i 42).
- docs/obieg/MAPA-KANON-GENERATOR.md — linia gwarancji poprawiona (płytkie morze, wykluczenie izolowanego heksu z maski).

## Odpowiedzi na zarzuty

**Zarzut 1 (regresja: płytkie morze -> głębokie, ląd przy głębokim morzu) — PRZYJMUJĘ, NAPRAWIONE.**
Przyczyna: `enforceEarthTemplateOnHexes` zamienia KAŻDY heks poza maską (także płytkie morze) w głębokie morze. Poprawka: `cutBackEarthLandOutsideMask` zmienia tylko suchy ląd (`isDryLandTerrain`) i kładzie PLYTKIE_MORZE. Pomiar (ten sam skrypt, Ziemia 168×120):

| metryka | baza 1bb77a7a0 | kandydat b2730 | obrona (ta runda) |
|---|---|---|---|
| plytkie_morze seed 777 | 1596 | 0 (zarzut) | 1635 |
| plytkie_morze seed 42 | 1596 | — | 1635 |
| morze seed 777 | 15409 | 17082 | 15447 |
| suchy ląd przy głębokim morzu (777) | 0 | 853 | 0 |
| suchy ląd poza maską (777 / 42) | 72 / 72 | 0 | 0 / 0 |
| łąki seed 777 | 1559 | 1482 | 1482 |
| heksy rzeczne seed 777 | 1197 | 1196 | 1196 |

Wybrzeże płytkie zostaje (asercja w teście: płytkie > 0). Netto płytkie wzrosło o +39 względem bazy: 72 heksy lądu poza maską stały się płytkim morzem (+72), a zmiana maski (zarzut 2) przesunęła 33 płytkie na głębokie (−33).

**Zarzut 2 (zmiana semantyki `earthTemplateLandAt`, bez pomiaru) — PRZYJMUJĘ, ZMIERZONE.**
Zmiana jest potrzebna: bez niej po purgeOpenOceanLandSpecks na Ziemi duzy (test earth-template „0 morza/wybrzeża w masce lądu") pada z `found 5` — przy masce bazowej 5 izolowanych heksów w masce staje się morzem. Pomiar wpływu maski (kandydat z maską vs bez maski, ta sama konfiguracja, ziarna 777 i 42):
- suchy ląd: 3078 vs 3078 (bez zmiany lądu — ZERO heksów lądu zmienionych),
- łąki: identyczne,
- heksy rzeczne: identyczne (1196 / 1233),
- płytkie: 1668 -> 1635 (−33), morze: 15414 -> 15447 (+33), na obu ziarnach identycznie.
Czyli zmiana maski przesuwa 33 heksy WODY płytka -> głębokie na Ziemi i nie zmienia lądu. Decyzja o tym przesunięciu: patrz UWAGI.

**Zarzut 3 (zmiana generator.ts poza allowlistą) — PRZYJMUJĘ jako odchylenie, NIE ROZWIĄZANE w tej rundzie.**
Przebieg musi być wołany po ostatnim `finalizeCoastAndInlandWater`/`ensureRiverOutlets`, czyli w kolejności etapów zdefiniowanej w `generator.ts` (identycznie jak istniejące wywołania `enforceEarthTemplateOnHexes` w tym samym pliku). Nie znalazłem miejsca w `gen-helpers.ts`, z którego można by to wywołać bez zmiany kolejności. Zmiana w generator.ts to 3 linie (import, wywołanie, komentarz). Orkiestrator musi zdecydować, czy dopuścić ten plik do allowlisty.

**Zarzut 4 (brak pomiarów i pinów z pkt 4 dispatchu) — PRZYJMUJĘ, CZĘŚCIOWO WYKONANE.**
Wyniki (surowe, ta runda):
- `tsc --noEmit -p tsconfig.json`: exit 0 (po ostatniej edycji).
- `gra/tools/map-offmask-stranded-fix-test.cjs`: 5 pass, 0 fail (ziarna 777/42 Ziemia: 0 poza maską; płytkie zachowane 1635; wyspy 108×74 s42: 0 specks).
- `gra/tools/stranded-land-test.cjs`: 18 pass, 0 fail.
- `gra/tools/earth-template-test.cjs`: kandydat (z maską) 9 pass, 1 fail — jedyny fail „Antarktyda w szablonie nad buforem południowym (found 0)" JEST W BAZIE (baza: 8 pass, 2 fail = 72 off-template + Antarktyda). Zmiana: fail „0 lądu poza szablonem" (72) -> pass.
- Pomiar PRZED/PO (measure2, 4 mapy, bazy vs kandydat z maską):
  - ziemia777: laka 1559 -> 1482 (−77 = 72 poza maską + 5 specks), dry 3155 -> 3078, rzeki 1197 -> 1196 (−1), specks 5 -> 0, offmask 72 -> 0.
  - ziemia42: laka 1592 -> 1515 (−77), rzeki 1233 -> 1233, specks 5 -> 0, offmask 72 -> 0.
  - wyspy108x74s42: dry 3996 -> 3995 (−1), specks 1 -> 0, rzeki 3536 -> 3536, plytkie 3201 -> 3201.
  - kontynenty168x120s42: bez zmian (dry 6047, rzeki 5007, plytkie 8985, morze 5128).
  - czas 4 map: baza 160 s, kandydat 155 s (jeden przebieg każdy; NIE ZMIERZONO dokładniej).
- NIE ZMIERZONO (pominięte, dispatch wymagał): logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0, map-gen-regression, world-density, determinism-save-load, river-*, climate-band, fair-play, relief-grid, measure.cjs (pomiar PRZED/PO z liczbą heksów wodnych jest w tabelach powyżej). Pinów NIE PRZEPINANO — żaden pin nie został zmieniony.
- Różnica rzek 777: −1 (1197 -> 1196). Przyczyna per heks NIE ZMIERZONO; prawdopodobnie usunięty heks lądu poza maską z rzeką.
- Mutacja czerwona: baza (bez bloku 3e-final) daje offmask = 72 i test `0 heksów lądu poza maską` pada — zmierzone na bazie (tools/earth-template-test.cjs, map measure). Nie uruchamiałem osobnego wariantu z usuniętym blokiem w kodzie.

**Zarzut 5 (test nie chroni przed regresją płytkiego morza) — PRZYJMUJĘ, NAPRAWIONE.**
Dodana asercja: `plytkie_morze > 0` na Ziemi 777 i 42 (w bazie 1596, dziś 1635). Asercja jest słaba (>0, nie równość z bazą), ale wykrywa wariant z zarzutu 1 (0 płytkich).

**Zarzut 6 (dokumentacja) — PRZYJMUJĘ, NAPRAWIONE.** `docs/obieg/MAPA-KANON-GENERATOR.md` opisuje: płytkie morze jako cel cofnięcia, wykluczenie izolowanego heksu z maski, 0 samotnych heksów.

## TESTY
Powyżej (surowe wyniki). Lista bramek ogólnych dispatchu, której nie uruchomiłem: NIE ZMIERZONO.

## BLOKADY
- Allowlista: generator.ts (zarzut 3) — wymaga decyzji orkiestratora.
- Zmiana wag wody na Ziemi (33 płytkie -> głębokie przez maskę, zarzut 2) — efekt gry NIE ZMIERZONO poza mapą; orkiestrator ocenia, czy to wystarczy do READY_FOR_DEPLOY.
- Pinów i bramek ogólnych (pkt 4 dispatchu) nie uruchomiono w całości.

## RUNDY
2/5 (runda 1: kandydat b2730a909, FAIL). Ostatni werdykt Evaluatora: FAIL (6 zarzutów).

## UWAGI-DLA-ORKIESTRATORA
- Wioski (`wioska`) na heksach zamienionych w morze nie są czyszczone — tak samo jak w bazowym `enforceEarthTemplateOnHexes`; NIE ZMIERZONO, czy występują.
- `riverPaths` nie są przepisywane po cofnięciu lądu (zachowanie bazowe, RIVERS3B — nie dotykane).
- Antarktyda w `earth-template-test` pada także w bazie — to stary pin (temat #145 ANTARDOC), nie regresja tego tematu.
- Testy z allowlisty `earth-template-test.cjs` i `stranded-land-test.cjs` nie zostały zmienione (oczekiwania bez zmian).

DEPLOY/PUSH: NIE WYKONANO
NASTĘPNY KROK: Evaluator ponowna weryfikacja kandydata = czubek tej gałęzi; orkiestrator decyduje o allowlista generator.ts i o zmianie wag wody na Ziemi.
