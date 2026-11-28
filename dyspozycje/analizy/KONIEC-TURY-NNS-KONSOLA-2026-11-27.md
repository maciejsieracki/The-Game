# Koniec tury: konsola w stanie blokady NNS (stan c), PRZED vs PO FALI 934 (R-WEB-ENDTURN-NNS-CONSOLE-Q1, tag ENDNNS)

Baza: origin/main d7b4dd3a9 (PO, zawiera FALĘ 934 ENDQUIET i 935 GRACE15). PRZED: 6afdec814 (sprzed FALI 934).
Zmiany w `gra/src`: brak. Dodane tylko narzędzie pomiaru `gra/tools/endturn-nns-console.cjs` i dane w runs/.

## 0. Wynik (krótko)

- **Stan c NIE ZMIERZONO.** Nie udało się doprowadzić do blokady NNS na żywo w żadnym przebiegu. Tabela PRZED/PO
  nie powstała (brak liczb wpisów w oknie 30 s dla stanu c).
- Ustalono maksimum ustawień z kodu (sekcja 1). Poprzednie pomiary ENDCLICK używały **nie-maksymalnych** wartości
  mapy (`Maly`) i prędkości (`Normalna`); dokument KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md, sekcja 6, to już zaznaczał.
- Dwie próby na maksimum nie doprowadziły do zaczętej nowej gry (sekcja 3).

## 1. Maksimum ustawień (z kodu)

Źródła: `gra/data/ui-params.json` (opcje i domyślne), `gra/src/ui/newGameFlow.ts` (suwaki zaawansowane),
`gra/src/map/newGameMapDefaults.ts` (sufity liczbowe).

| Ustawienie | Maksimum | Źródło |
|---|---|---|
| Rozmiar mapy | **Super Huge** (ostatnia opcja, ~80000 hex, 336×238) | ui-params.json, `map_size` |
| Prędkość gry | **Długa** (4× koszt badań, „najdłuższa gra”) | ui-params.json, `game_speed` |
| Miasta-państwa (klaster) | **9** | `MAX_MIAST_PANSTWA` (newGameMapDefaults.ts:528) |
| Liczba cywilizacji | **15** | `MAX_TYPY_CYWILIZACJI_MENU` (newGameMapDefaults.ts:547); NIEJEDNOZNACZNE, który suwak to „rywale” |
| Limit miast (baza) | **20** | newGameFlow.ts:1877 (opcje 10/15/20) |
| Poziom gry / barbarzyńcy / kultura / dyplomacja | Trudny / Trudny / Duży wpływ (trudny) / trudna | ui-params.json, newGameFlow.ts |
| Koszty budynków / jednostek / wzrost ludności / zasięg ruchu | Wysoki (x4) / Wysoki / Wysoki / Długi (x6) | newGameFlow.ts |

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
| P2 | Ogromny (~20000 hex), czekanie 400 s | `[ClusterStart]` nie pojawił się; `awaitingFirstCity` było już prawdziwe na świecie podglądu, więc nie dowodzi nowej gry | (dane w runs/, wynik częściowy) |
| P3 | Ogromny, czekanie 60 s, klik tury 1 z dłuższym oknem | Tura 1: przycisk przykryty przez `DIV.civ-map-load-overlay` (`elementFromPoint`) przez >5 min; brak kliku, brak tury 2, brak stanu c | `runs/.../log-PO-ogromny-s4242.txt` |

Wnioski z prób (hipotezy, NIE ZMIERZONO przyczyny):
- Super Huge: generacja świata nowej gry nie kończy się w ~10 min w headless Chromium (lub strona pada: zob. SIGSEGV z dispatchu).
- Ogromny: overlay ładowania mapy (`src/ui/mapLoadingOverlay.ts`, `hide()` wołane z main.ts) nie znika w headless
  w ciągu 5 min; `[ClusterStart]` nie jest emitowany w tej ścieżce, więc to nie jest pewny sygnał końca generacji.
- Nie zbadano, czy overlay utrzymuje się z powodu braku WebGL/GPU w headless (ostrzeżenia `GPU stall` w ENDCLICK).

## 4. Tabela stanu c (PRZED/PO)

| stan | build | ziarno | wpisy/30 s | rodzaje |
|---|---|---|---|---|
| (c) bramka NNS t5 po zakupie | PRZED 6afdec814 | 4242 / 7 | **NIE ZMIERZONO** | — |
| (c) bramka NNS t5 po zakupie | PO d7b4dd3a9 | 4242 / 7 | **NIE ZMIERZONO** | — |

Oczekiwanie z dispatchu (PO = tylko wpisy z kliku, cykl cichy) pozostaje **niepotwierdzone**.
Z tego samego kodu wiadomo (ENDQUIET, dane ENDCLICK): PRZED w stanie (b) 11–20 wpisów `[EndTurn] blocked` na 30 s,
PO 0 wpisów (n=1). To nie jest pomiar stanu c.

## 5. Co zostaje do zrobienia (decyzja orkiestratora)

- Ustalić, dlaczego maksimum (Super Huge) nie dochodzi do świata nowej gry w headless (czas generacji vs pad strony).
- Usunąć overlay ładowania w headless albo czekać na właściwy sygnał gotowości (nie `[ClusterStart]`).
- Dopiero potem zmierzyć stan c na obu buildach (ziarna 4242 i 7) wg protokołu z sekcji 2.
- Pytanie o ustawienia do pomiaru: „rywale” = miasta-państwa 9 czy liczba cywilizacji 15 (oba są sufitami).
