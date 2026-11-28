# Koniec tury: konsola w stanie blokady NNS (stan c), PRZED vs PO FALI 934 (R-WEB-ENDTURN-NNS-CONSOLE-Q1, tag ENDNNS)

Baza: origin/main d7b4dd3a9 (PO, zawiera FALĘ 934 ENDQUIET i 935 GRACE15). PRZED: 6afdec814 (sprzed FALI 934).
Zmiany w `gra/src`: brak. Dodane tylko narzędzie pomiaru `gra/tools/endturn-nns-console.cjs` i dane w runs/.

## 0. Wynik (krótko)

- **Stan c NIE ZMIERZONO.** Nie udało się doprowadzić do blokady NNS na żywo w żadnym przebiegu. Tabela PRZED/PO
  nie powstała (brak liczb wpisów w oknie 30 s dla stanu c).
- Ustalono maksimum ustawień z kodu (sekcja 1). Poprzednie pomiary ENDCLICK używały **nie-maksymalnych** wartości
  mapy (`Maly`) i prędkości (`Normalna`); dokument KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md, sekcja 6, to już zaznaczał.
- Trzy próby na maksimum (P1–P3, sekcja 3) nie doprowadziły do świata nowej gry z gotowym miastem gracza.
- Próba odtworzenia stanu c na buildzie PO: klik suwaka Skarb nie zmienił wartości (before 30, after 30, max 100 w
  `nns-PO-ogromny-s4242-proba.json`, `buyResult.slider`); zakup nie wykonany, bo wszystkie 5 przycisków rekrutacji było
  nieaktywnych w turze 1 (`buyResult.buy.rows`). Blokada NNS nie została wywołana.

## 1. Maksimum ustawień (z kodu)

Źródła: `gra/data/ui-params.json` (opcje i domyślne), `gra/src/ui/newGameFlow.ts` (suwaki zaawansowane),
`gra/src/map/newGameMapDefaults.ts` (sufity liczbowe).

| Ustawienie | Maksimum | Źródło |
|---|---|---|
| Rozmiar mapy | **Super Huge** (ostatnia opcja, ~80000 hex, 336×238) | ui-params.json, `map_size` |
| Prędkość gry | **Długa** (4× koszt badań, „najdłuższa gra”) | ui-params.json, `game_speed` |
| Miasta-państwa (pole „Miasta-państwa”) | **6** — jedyna opcja menu (`city_states_count`, opts ["6"], skala z mapą) | ui-params.json. Sufit kodu 9 (`MAX_MIAST_PANSTWA`, newGameMapDefaults.ts:528) NIE jest opcją menu |
| Liczba cywilizacji | **7** — jedyna opcja menu (`civ_types_count`, opts ["7"], ±1 od rozmiaru) | ui-params.json. Sufit kodu 15 (`MAX_TYPY_CYWILIZACJI_MENU`, newGameMapDefaults.ts:547) NIE jest opcją menu |
| Trudność miast-państw | **Trudny** (opcje: Łatwy / Normalny / Trudny / Wyłączone; „Wyłączone” = brak miast-państw, nie trudność) | newGameFlow.ts, `cityStateDifficulty` (setIdx 2 → `hard`) |
| Limit miast (baza) | **20** | newGameFlow.ts:1877 (opcje 10/15/20) |
| Poziom gry / barbarzyńcy / kultura / dyplomacja | Trudny / Trudny / Duży wpływ (trudny) / trudna | ui-params.json, newGameFlow.ts |
| Koszty budynków / jednostek / wzrost ludności / zasięg ruchu | Wysoki (x4) / Wysoki / Wysoki / Długi (x6) | newGameFlow.ts |

Decyzja „rywale” (zarzut obrony 5): pole „rywale” w dispatchu rozstrzygam jako pole „Miasta-państwa” (jedyne pole
menu o liczbie rywali; w kodzie nie ma etykiety „rywale”, a „Rywale (N)” w podglądzie to liczba cywilizacji tego samego typu).
Maksimum osiągalne w menu = 6 miast-państw i 7 cywilizacji. Wartości 9 i 15 z kodu są sufitami walidacji, nie opcjami.

Odczyt z żywej gry (zarzut 3, częściowo ODRZUCONY): `settingsReadback` istnieje w `nns-PO-ogromny-s4242-proba.json`
(difficulty hard, kosztJednostekPace wysoki, diplomacyWarLevel trudna, kulturaReligiaLevel trudny, wzrostSurowcowZEpoka false).
Nie obejmuje: mapy, prędkości, barbarzyńców, miast-państw. Dla tych pól readback nadal pochodzi z kodu. Przy próbie
`cityStateDifficultyOverride` ustawiono `hard` (wcześniej `normal`); żywy odczyt tego pola NIE ZMIERZONO.

Uwaga: w `endturn-click-live.cjs` (ENDCLICK) i w poprzednich narzędziach występują wartości `Maly`, `Normalna`,
`rivals: 2`, `cityLimitBase: 10`. Nie są to maksima.

## 2. Narzędzie i protokół (nowe)

`gra/tools/endturn-nns-console.cjs <katalog> <seed> <bundle> <etykieta>` (env: `MAP_SIZE`, `CLUSTER_WAIT_MS`, `CLICK_TURNS`, `WINDOW_MS`):

1. Nowa gra z parametrami maksimum (`__settingsLive.startNewGame`), czekanie na świat nowej gry.
2. Tury 1–4: fizyczny klik „Zakończ turę” (aria=false, isEndTurnInProgress=false, trafienie w `button[data-end]`).
3. Tura 5 (stan c): fizyczny klik prawego krańca suwaka Skarb (100%), zakup pierwszej aktywnej jednostki w panelu
   rekrutacji (klik), zamknięcie panelu.
4. Okno 30 s: tylko obserwacja (DOM, `isEndTurnInProgress`, `snapshot().turn`), bez kliknięć i **bez
   `gateInfo()`/`canPlayerInitiateEndTurn`** (te wołają `console.warn` i zaśmiecają liczenie).

Narzędzie nie zostało dotąd przeszło do końca na żadnym buildzie (sekcja 3).

## 3. Próby i blokady (wszystkie na buildzie PO = d7b4dd3a9, ziarno 4242)

| Próba | Parametry | Wynik | Log |
|---|---|---|---|
| P1 | Super Huge, czekanie na `[ClusterStart]` 600 s | Brak `[ClusterStart]` przez 600 s; po upływie strona zamknięta (`Target page, context or browser has been closed`); brak świata nowej gry | `runs/.../log-PO-superhuge-s4242.txt` |
| P2 | Ogromny (~20000 hex), czekanie 400 s | `[ClusterStart]` nie pojawił się; brak logu i JSON-a w runs/ (artefakt nie został zapisany; wynik znany tylko z tego raportu) | brak artefaktów |
| P3 | Ogromny, czekanie 60 s, klik tury 1 z dłuższym oknem | Tura 1: przycisk przykryty przez `DIV.civ-map-load-overlay` (`elementFromPoint`) przez >5 min; brak kliku, brak tury 2, brak stanu c | `runs/.../log-PO-ogromny-s4242.txt` |

Wnioski z prób (hipotezy, NIE ZMIERZONO przyczyny; `awaitingFirstCity` z P2 mogło być prawdziwe na świecie podglądu — NIE ZWERYFIKOWANE, nie jest dowodem gotowości):
- Super Huge: generacja świata nowej gry nie kończy się w ~10 min w headless Chromium (lub strona pada: zob. SIGSEGV z dispatchu).
- Ogromny (P3 — jedyny zapisany log): overlay ładowania mapy (`src/ui/mapLoadingOverlay.ts`, `hide()` wołane z main.ts) nie znika w headless
  w ciągu 5 min; `[ClusterStart]` nie jest emitowany w tej ścieżce, więc to nie jest pewny sygnał końca generacji.
- Nie zbadano, czy overlay utrzymuje się z powodu braku WebGL/GPU w headless (ostrzeżenia `GPU stall` w ENDCLICK).

## 4. Tabela stanu c (PRZED/PO)

| stan | build | ziarno | wpisy/30 s | rodzaje |
|---|---|---|---|---|
| (c) bramka NNS t5 po zakupie | PRZED 6afdec814 | 4242 / 7 | **NIE ZMIERZONO** | — |
| (c) bramka NNS t5 po zakupie | PO d7b4dd3a9 | 4242 / 7 | **NIE ZMIERZONO** | — |

Oczekiwanie z dispatchu (PO = tylko wpisy z kliku, cykl cichy) pozostaje **niepotwierdzone**.
Dane ENDCLICK (stany (a) i (b) z dispatchu, NIE stan c): (a) przed założeniem miasta 43–50 → 1–2 wpisów/30 s; (b) po kliknięciu
„Zakończ turę” 13–23 → 2–3. To nie jest pomiar stanu c i nie służy do porównań z blokadą NNS.

## 5. Co zostaje do zrobienia (decyzja orkiestratora)

- Ustalić, dlaczego maksimum (Super Huge) nie dochodzi do świata nowej gry w headless (czas generacji vs pad strony).
- Droga do stanu c NIEZWERYFIKOWANA: zakup w t5 nie wywołał blokady w buildzie PO (od FALI 935 utrzymanie jednostek gracza
  w t1–15 = 0). Do sprawdzenia: t16–19 (`STATE_TURN=17 CLICK_TURNS=16`, wymaga ~16 kliknięć tur) albo zakup kilku jednostek
  bojowych, gdy jest dość złota. Narzędzie zmienione w obronie r2: gotowość świata = awaitingFirstCity + brak overlay
  (nie [ClusterStart]); suwak Skarb ustawiany klawiszem End (klik myszą nie działał); miasta-państwa 6, cywilizacje 7 (menu),
  trudność miast-państw Trudny. Zmiany NIE uruchomione na żywo (tylko `node --check`); żaden pomiar nie powstał.
- Usunąć overlay ładowania w headless albo czekać na właściwy sygnał gotowości (nie `[ClusterStart]`).
- Dopiero potem zmierzyć stan c na obu buildach (ziarna 4242 i 7) wg protokołu z sekcji 2.
- Pytanie o ustawienia do pomiaru: „rywale” = miasta-państwa 9 czy liczba cywilizacji 15 (oba są sufitami).
