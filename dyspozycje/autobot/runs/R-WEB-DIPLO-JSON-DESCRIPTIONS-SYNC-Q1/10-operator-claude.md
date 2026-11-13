# R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tekst/dane opisowe; zero zmian zachowania)
TEMAT: R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1
GOAL: opisowe fragmenty gra/data/diplomacy.json (tabele referencyjne i opisy akcji dla gracza) zgadzają się z faktycznymi parametrami i kodem; zachowanie gry bez zmian.
BAZA: origin/main = 52fc1d5cf (FALA 680). Dispatch podawał „52fc1d5ca”, taki obiekt nie istnieje w repo; 52fc1d5cf to jedyny pasujący origin/main (ten sam opis „FALA 680”). ZAŁOŻENIE: baza = 52fc1d5cf.
KOD: b55db098c (gałąź odłączona od 52fc1d5cf; commit z kodem i testem). Raport: commit po nim.

## ZMIANY-COMMIT
Allowlista zachowana. `git add` wyłącznie po ścieżkach; bez `git add -A`; bez push na main.

- gra/data/diplomacy.json — tylko pola opisowe/tekstowe i tabele referencyjne nieczytane przez kod (21 linii zmienionych, `git diff --stat`: 21 insertions, 21 deletions). Zmiany:
  1. Tabela zdarzeń: „Wspólna religia” / „Odmienna religia” → Zmiana „0 (brak wpływu)”, Znak „0” (kod: wspolnaReligia/odmiennaReligia_zaufanie_perTura = 0, diplomacy.ts ok. 158–160).
  2. Tabela zdarzeń: „Ekspansja / osadnictwo przy granicy” → „-3 / -4 / -5 (wg epoki)”, uwagi o karencji (kod: ekspansjaGranica*_zaufanie_perTura = −3/−4/−5; wstrzymanie w karencji: diplomacy-factors.ts ok. 182).
  3. Tabela D (Δ Zaufanie/turę): religia 0 i 0; „Aktywny pakt NAP / sojusz” → NAP +2 (kod nap_zaufanie_perTura = 2), sojusz +3 (sojusz_zaufanie_perTura = 3) w uwagach; „Ekspansja przy granicy” → −3 (uwagi −3/−4/−5 wg epoki).
  4. Tabela progów: „Sojusze osiągalne gdy Relacja ≥” 120 → 130 (kod: progSojuszRelacja = 130; nie czytane przez kod, tylko tekst).
  5. akcje_dyplomatyczne „2. Pakt o nieagresji”: „Wymaga Relacji i Zaufania ≥ 30” → „Relacji ≥ 110 i Zaufania ≥ 30” (progNapRelacja = 110, progNapZaufanie = 30); „Złamanie: −30 Relacja, −20 Zaufanie” → „−40 Zaufanie (a więc także −40 Relacja)” (zlamanaPaktGracz_zaufanie = −40, zdarzenie zlamana_obietnica).
  6. akcje „3. Sojusz”: „Wypowiedzenie: −25 Relacja, −20 Zaufanie” → „Wypowiedzenie (zerwanie traktatu): −15 Zaufanie (a więc także −15 Relacja)” (main.ts ok. 23030: NAP/sojusz/granice/wasal → zerwanie_traktatu = −15 Zaufania).
  7. akcje „5. Traktat handlowy”: „Zerwanie: −15 Relacja, −10 Zaufanie” → „Zerwanie: −10 Zaufanie (a więc także −10 Relacja); po ≥10 turach bez kary Zaufania” (zerwanie_handlu −10; zerwanie_handlu_bez_kary 0); „+2 Relacja/tura, +1 Zaufanie/tura” → „+1 Zaufanie/turę (a więc także +1 Relacja/turę)” (diplomacy.ts:1804 dodaje tylko handel_zaufanie_perTura = 1 do Zaufania; brak dR).
- gra/src/game/diplomacy.ts — WYŁĄCZNIE komentarze (diff: 2 bloki, 0 zmian kodu wykonawczego):
  - blok przy `tarcia_graniczne` (ok. 985–993): usunięty opis „UI −2/turę” jako aktualny; pomiar oznaczony jako historyczny; aktualne wartości −3/−4/−5.
  - doc `WAR_RELATION_SCORE_CAP` (ok. 1104–1109): zamiast „nastawienie co najmniej Wrogi (score<30)” — stała referencyjna = 29, NIE steruje clampem; w wojnie obniżane jest tylko Zaufanie do zera; brak limitu 29 na sumę. Stała i jej wartość bez zmian.
- gra/tools/diplo-json-descriptions-sync-test.cjs — NOWY test (patrz TESTY).

Nie zmieniono: wartości params, ai.ts, main.ts, diplomacy-proposals.ts, kodu w diplomacy.ts, JSON balansu poza diplomacy.json, WERSJE.md, gra-robocza/, rust-port/, docs/encyklopedia (tekst zaufanie.md już zgodny), gra/src/data/wikiBundle.json (skrypt bundle-wiki-for-game.cjs nie czyta diplomacy.json, więc regeneracja nie była potrzebna).

## TESTY
Środowisko: `npm ci --ignore-scripts` w gra/ (71 pakietów). NIE uruchamiano `npm run build` ani `dev`.

- `npx tsc --noEmit` → exit 0 (bez wyjścia).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `node tools/diplomacy-test.cjs` → `148 passed, 0 failed (total 148)`.
- `node tools/diplo-civpedia-values-test.cjs` → `PASS: 129 sprawdzeń, wierszy parametrów w haśle: 151`, exit 0.
- `node tools/admin-panstwo-panel-names-test.cjs` → `26 pass, 0 fail`.
- `node tools/diplomacy-audience-actions-test.cjs` (czyta akcje_dyplomatyczne z JSON) → `20 passed, 0 failed`.
- NOWY `node tools/diplo-json-descriptions-sync-test.cjs` → `WYNIK: 29/29 OK, FAIL: 0`, exit 0. Na danych obecnych: 23 sprawdzenia opisów, niezgodności 0. Samo-test mutacji: 4 mutacje (kara NAP −40→−30; religia +0.5 w tabeli; granica −2 w tabeli Δ; próg sojuszu 130→120), wszystkie wykryte.
- Dowód, że test łapie stary stan: ten sam test uruchomiony na diplomacy.json z bazy 52fc1d5cf daje 12 niezgodności (religia ±0.5 ×4, granica −2 ×2, NAP progi/kara, sojusz −20/−25, tempo NAP 1, brak tempa sojuszu, próg 120). Wszystkie 12 usunięte w tym commicie.
- `git diff --check` → exit 0 (bez białych znaków).
- Kryterium „diff wartości liczbowych czytanych przez kod = pusty”: diff JSON zawiera 21 linii; zmienione liczby są w polach tekstowych/tabelach opisowych (nieczytane przez kod) lub w tabeli D „Δ Zaufanie/turę” (opisowa, nieczytana przez silnik — potwierdzone grepem: src czyta tylko `params` i `akcje_dyplomatyczne[].Opis/Efekt` jako tekst). Wartości `params` nie zmieniono — test porównuje je z kodem.

## BLOKADY
Brak blokad technicznych.

Pozycje z punktu 5 dispatchu, których NIE poprawiono (nie udało się zweryfikować w kodzie; zgodnie z dispatchem poprawiam tylko pewne):
- akcja „4. Traktat przemarszu”: „Nieautoryzowany przemarsz: −5 Zaufanie/tura u właściciela” — w kodzie nie znaleziono takiej kary Zaufania (w diplomacy.ts/diplomacy-credibility.ts/diplomacy-locks.ts brak; kara N7 to Wiarygodność −2 jednorazowo). NIE_ZMIERZONO — do decyzji/weryfikacji.
- akcja „2. Pakt” / tabela zdarzeń „Złamany pakt przez gracza”: „Informacja rozchodzi się do sąsiadów (−5 Relacja u każdego)” — brak potwierdzenia w kodzie. NIE_ZMIERZONO.
- akcja „3. Sojusz”: „odmowa: −15 Zaufanie” — kod: odmowa obowiązku sojuszniczego to N4 = Wiarygodność −15, nie Zaufanie. NIE_ZMIERZONO (możliwa niezgodność; nie zmieniono, bo wymaga decyzji co do słowa „Zaufanie”).
- Zdarzenie `wspolna_religia` (diplomacy.ts case, dZ = 1 jednorazowo) nadal istnieje w kodzie, a tabela mówi „brak wpływu”. Nie wiadomo, czy zdarzenie jest wywoływane w grze. NIE_ZMIERZONO — do ustalenia przez orkiestratora (logika poza zakresem).
- Zdarzenie `pokoj` w applyDiplomaticEvent ma dZ = 5, a parametr `pokoj_zaufanie_ustawienie` = 20 (ustawienie po pokoju). Nie zmieniano logiki; możliwe, że 5 jest tylko deltą zdarzenia, a ustawienie 20 nadpisuje — NIE_ZMIERZONO.
- diplomacy.ts `tier`/`relationTier` (progi 30 wg Relacji, komentarze ok. 1540–1554) — poza allowlistą komentarzy (dispatch wskazuje tylko 985–993 i 1103–1108); pozostawiono. To jest zadanie #348 (druga etykieta „Wrogi”).
- diplomacy.json sekcja wiodąca „11. Wypowiedzenie wojny” i tabele poza wymienionymi (np. wiersze „Wspólny wrog”, „Efekt dobrej woli”) nie były przeglądane pod kątem liczb — NIE_ZMIERZONO w pełnym zakresie punktu 5.
- docs/encyklopedia/pojecia/*.md nie były poprawiane (zaufanie.md zawiera już zgodne z decyzją 2026-11-13 wartości; pozostałe hasła nie były przeszukane pod kątem starych liczb religii/Relacji).
- Etykiety „Nieufny/Wrogi” (FALA 680) — nie ruszane (poza allowlistą).

## RUNDY
1/5 (Operator, Haiku). Brak rund korekcyjnych.

## NASTĘPNY KROK
Evaluator (Sonnet) → Final Control (Sonnet) na commicie b55db098c (kod + test) oraz na tym raporcie. Orkiestrator decyduje o trzech pozycjach NIE_ZMIERZONO (przemarsz −5, „−5 Relacja” przy złamaniu paktu, „odmowa −15 Zaufanie” w sojuszu) oraz o zdarzeniu `wspolna_religia`.

## DEPLOY/PUSH: NIE WYKONANO
Brak integracji, deployu i push na main. Brak zmian w WERSJE.md.

## SPRZĄTANIE
- Pozostawiono worktree do przeglądu (zmiany zcommitowane).
- gra/node_modules utworzony przez `npm ci --ignore-scripts` (gitignored) — do usunięcia przez orkiestratora po FC, jeśli dysk wymaga.
