STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-TAX-SPLIT-30-60-10-Q1
GOAL: nowa gra i nowe miasta startują z podziałem 30/60/10 (Skarb/Nauka/Zamożność); AI i stare zapisy bez zmiany zachowania.
ROLA: Final Control (r1/5). Kandydat: 27cf95bb1f7d96918aef6c69a914a236793b2741. Baza: fe802bb61b9420800898ad3489bdb8b637c7f10a.

ZMIANY/COMMIT:
- Kandydat jest potomkiem bazy (merge-base fe802bb61 == baza; log baza..kandydat = c513bd057, adb46eb7b, 27cf95bb1; brak cudzych rodziców).
- 30 plików, +349/-107; `git diff --check fe802bb61..27cf95bb1` czysty.
- Kod: gra/data/econ-params.json (jedno miejsce prawdy 60/30/10 dla easy/normal/hard), game/cities.ts (DEFAULT_PODZIAL_HANDLU 60 Nauka/30 Skarb/10 Zamożność + LEGACY_PODZIAL_HANDLU_PRZED_2026_11_14 20/60/20), ai.ts (seed AI na LEGACY), empire-handel-split.ts (migracja starych zapisów na LEGACY), society-breakdown.ts (fallback LEGACY), cityPanel.ts i empireDetailPanel.ts (fallbacki 30/60/10), main.ts (tylko komentarze).
- Docs/wikiBundle: poradnik, analiza, SPIS-TRESCI, encyklopedia suwak-handlu; wikiBundle regenerowany narzędziem (wg Obrony i Evaluatora; diff regeneracji zerowy).
- Testy: nowy default-tax-split-test.cjs (28), poprawione ai-nauka-podzial-tura1-seed, ai-player-parity-fixes, hotseat-ustawienia-kopiowane, logic-test.
- Poza allowlistą dispatchu: docs/PORADNIK-GRACZA/**, docs/analiza/02-EKONOMIA.md, ai.ts, empire-handel-split.ts, society-breakdown.ts, main.ts (komentarze), logic-test, ai-* testy. Uznane za konieczne konsekwencje zarzutów 1, 2, 4 (zachowanie AI/starych zapisów wymaga LEGACY; docs zgodnie z pkt 4 dispatchu). Orkiestrator ratyfikuje rozszerzenie allowlisty przy integracji.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. cityPanel DEFAULT_PODZIAL_HANDLU 60/20/20: ODDAL. Naprawione w adb46eb7b (wartość 30/60/10, komentarz, asercje w default-tax-split-test: brak starego fallbacku i obecny 30/60/10). Zweryfikowane odczytem diffu i uruchomieniem testu.
2. Stare opisy 60/20/20: ODDAL. Ponowny grep po docs (bez archiwum) zwraca już tylko dwie stopki historii rewizji (08:426, 06:825: "poprawiony z 70/20/10 na 60/20/20") — to zapis historyczny, nie opis stanu. Zdanie o 50/30/20 poprawione. Pozostałe stare wzmianki to komentarze w testach (labor-to-tax-conversion-gold, plony-budynkow, mennica-magazyn) i work-tax.ts:64 — kosmetyka, patrz UWAGI.
3. Brak zrzutu Chromium: DO DECYZJI CZŁOWIEKA / NIE_ZMIERZONO (nie defekt kodu). Mój pomiar: vite build OK (poza repo), Chromium uruchomiony, kreator -> gra startuje do mapy bez błędów strony. Panel Skarbiec w nowej grze pokazuje "Brak miast", a sekcje podziału podatków renderują się dopiero po założeniu miasta; próba założenia miasta skryptem Playwright przekroczyła limit czasu. Zrzut panelu z 30/60/10 NIE_ZMIERZONO. hotseat-ustawienia-kopiowane-test kończy się tym samym timeoutem Playwright na `.civ-newgame .start` także na bazie (kreator ma więcej kroków niż zakłada test) — dług testowy niezależny od tematu.
4a. migrate przy niepustym savedDefaults dawał DEFAULT: ODDAL — naprawione na LEGACY + test. 4b. ensureCityPodzialDefaults / society-breakdown: ODDAL — LEGACY + testy. 4c. wpływ 10% Zamożności na Szczęście na żywo: NIE_ZMIERZONO (jawnie oznaczone w econ-params), nie zarzut kodu. 4d. komentarze main.ts: ODDAL (poprawione).
Żadnego NAPRAW.

TESTY (liczby z surowego wyjścia, kandydat 27cf95bb1, node_modules z `npm ci`):
- tsc --noEmit: exit 0.
- default-tax-split-test: 28 pass, 0 fail. Na bazie (ten sam plik testu wgrany do worktree bazy): czerwony, 12 FAIL (econ-params got 20/60/20 itd.) — wymóg "czerwony na bazie" spełniony.
- 5 bramek referencyjnych + moc: logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0. Wszystkie zielone.
- Testy powiązane z podziałem (kandydat): ai-nauka-podzial-tura1-seed 8/0; szczescie-zamoznosc exit 0; currency 37/0; labor-to-tax-conversion-gold 58/0; pr141-f04-work-activation PASS; mennica-uspienie 49/0; waluta-mennica 61/0; praca-podzial-staly-50-50 6/0; spichlerz-wzrost 14/0; civ-bonusy 56/0; adjust-handel-split-suma 46/0; ai-slider 46/0; trade-routes-income 134/0; prawo-przebudowa-skali 152/0; wire-ekonomia 37/0; plony-budynkow 68/0; ai-major-economy 31/0; spichlerz-panel-food-parity 11/0; society-breakdown exit 0; owner-economy 20/0; szczescie-skala-normalizacja 148/0.
- Czerwone na kandydacie, identyczne na bazie (baza vs kandydat, ten sam zbiór FAIL): ai-player-parity-fixes 43/1 (baza 43/1); szczescie-przebudowa-skali 515 OK/4 FAIL (baza 515/4); mennica-magazyn 34/7 (baza 34/7; w jednej asercji zmienia się tylko wartość "got" 1 -> 0, ta sama asercja czerwona na obu); hotseat-ustawienia-kopiowane BLOCK/timeout (baza ten sam). Brak nowej regresji.
- Dowód mutacyjny: wg Obrony M1/M2/M3 po 1 FAIL (nie powtarzałem); niezależnie potwierdziłem czerwień testu na bazie.

ANALIZA ZACHOWANIA (czytane z diffu): player/nowe miasta = DEFAULT 60N/30S/10Z przez econ-params; fallbacki econ w economy.ts/turn-economy.ts (60/30/10) już były zgodne z nową wartością; AI: aiSeedPodzialHandlu używa LEGACY.procentLuksus (20%) — zachowanie AI bez zmian; stare zapisy: migrateHandelSplitOnLoad nadal przypisuje LEGACY brakującym właścicielom; zapisany podział nie jest nadpisywany.

BLOKADY: brak blokad kodu. NIE_ZMIERZONO: zrzut panelu imperium/Skarbiec z 30/60/10 po założeniu miasta (Chromium); wpływ 10% Zamożności na Szczęście; hotseat-ustawienia-kopiowane-test (timeout niezależny od tematu).
RUNDY: FC 1/5 (łącznie: operator r1, evaluator r1, obrona r1, FC r1).
NASTĘPNY KROK: integracja orkiestratora (kod 27cf95bb1; sprawdź ancestry vs aktualny main i diff --stat), opcjonalnie zrzut panelu po założeniu miasta przed/po deployu; dług Rust: REPIN domyślnego podziału (econ-params 60/30/10, LEGACY dla AI/starych zapisów).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Rozszerzenie allowlisty ponad dispatch (ai.ts, empire-handel-split.ts, society-breakdown.ts, docs/PORADNIK-GRACZA/**, docs/analiza, testy ai-*/logic) — wymaga Twojej ratyfikacji; zmiany uzasadnione (AI i stare zapisy bez zmiany zachowania).
- Dług testowy (niezależny, baza też czerwona): hotseat-ustawienia-kopiowane-test (kreator ma dodatkowy krok), mennica-magazyn-test 7 FAIL, szczescie-przebudowa-skali-test 4 FAIL, ai-player-parity-fixes-test 1 FAIL.
- Kosmetyka: nieaktualne komentarze "20/60/20" w testach labor-to-tax-conversion-gold, plony-budynkow, mennica-magazyn, ai-player-parity-fixes (l.239 string "60/20/20") oraz work-tax.ts:64.
- Relayowana prośba użytkownika o kolejność badań (Obróbka drewna -> Rolnictwo -> Oswojenie zwierząt -> Łowiectwo) dotyczy osobnego tematu (zadanie #383 na liście, "Kolejność badań w Możesz wybrać"), nie tego tematu; w tej rundzie FC nie była stosowana ani sprawdzana.
- Środowisko: /tmp bywa czyszczone między wywołaniami (artefakty buildu znikały); testy UI warto uruchamiać build+run w jednym wywołaniu.
