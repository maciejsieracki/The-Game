STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiary, priorytet 2)
TEMAT: R-WEB-VERIFY-LIVE-3-Q1 (tag VLIVE3), obrona, runda 2/5
GOAL: trzy pomiary na żywej grze na poziomie maksymalnym: (1) Targowisko, (2) cesja >1 miasta, (3) FORTRING (ON/OFF, round-trip). Wynik tej rundy: (1) zmierzone, (2) zmierzone (na scenariuszu playtest, bez maksimum), (3) round-trip i czas tury zmierzone na maksimum; wpływ pierścienia NIE ZMIERZONO (brak obserwowalnej różnicy w mierzonych wielkościach).
ZMIANY-COMMIT: patrz sekcja SHA niżej. Zmienione pliki: `gra/src/main.ts` (wyłącznie hooki w bloku `__settingsLive`, tylko `?civTest=1`), `gra/tools/diplomacy-city-cession-live-test.cjs` (T4), nowe `gra/tools/vlive3-targowisko-live.cjs`, `gra/tools/vlive3-fortring-live.cjs`, `dyspozycje/analizy/VERIFY-LIVE-3-2026-11-27.md`, dane w `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-3-Q1/dane/`, ten raport. Brak zmian reguł, balansu ani progów.
TESTY:
- tsc: rc 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- combat-test: 6/6.
- ai-unit-replace-same-rules-test: 45 passed, 0 failed (dispatch podawał 21; liczba z surowego wyjścia).
- ai-test: 297 passed, 0 failed.
- ai-city-rebellion-gate-test: PASS=37 FAIL=0.
- ai-city-rebellion-news-test: PASS 24/0.
- diplomacy-city-cession-live-test (playtest=mapa, z T4): 23 pass, 0 fail.
- Pomiary (raw logi w `dane/`): Targowisko 1 tura (A/B, JSON + PASS); FORTRING ON 20/20 tur (druga próba; pierwsza przerwana w turze 12, log zachowany), FORTRING OFF 20/20 tur.
- Build live: bundle esbuild `tools/test-hook-setcitylimit-live-bundle.cjs` poza repo (`/tmp/claude-0/vlive3/...`), nie `npm run build`/`dev`.
BLOKADY:
- Wpływ pierścienia fortów (ON vs OFF): NIE ZMIERZONO. Powód: liczba fortów = 1 w każdej z 20 tur obu wariantów (wymuszony fort, AI nie buduje fortów); runner nie mierzy innej wielkości, w której pierścień by się ujawnił; nie zidentyfikowano w kodzie, co pierścień zmienia w mierzonych wielkościach.
- Netto skarbca po turze z zamiany 100 Żywności: +6 z 20 (30%) zmierzone; rozkład składników (Skarb/Nauka/Zamożność, modyfikatory stolicy) NIE ZMIERZONO. Pytanie o zamierzoność 30% to decyzja gry (ABC), nie rozstrzygam.
- Cesja na scenariuszu playtest: ceny pokoju na poziomie maksymalnym dyplomacji NIE ZMIERZONO (scenariusz `?playtest=mapa` nie przechodzi przez kreator).
- Jedna z dwóch prób ON zatrzymała się w turze 12 (`[EndTurn] blocked: endTurnInProgress`, bez modala/bitwy w stanie). Druga próba tego samego wariantu przeszła 20/20. Przyczyna nie zidentyfikowana.
RUNDY: 2/5 (runda 1 = `10-operator-claude.md`; ta runda = obrona na zarzuty Evaluatora)
NASTĘPNY KROK: orkiestrator decyduje, czy zlecić (a) temat: identyfikacja, co pierścień fortów zmienia (warunek pomiaru 3a), (b) temat: rozkład podatku z kolejki na Skarb/Nauka/Zamożność (netto 30%) — pytanie ABC do właściciela czy zamierzone, (c) temat: odtworzenie przerwanego końca tury ON t12 (`endTurnInProgress`).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedź na zarzuty Evaluatora (b6955685712dd7e10d7773ead17de5f7cc9dda22)

1. Poz. 1, brak próby pomiaru — PRZYJĘTE. Próba wykonana: `gra/tools/vlive3-targowisko-live.cjs`, rc 0, wynik w `dane/vlive3-targowisko-1tura-max-stdout.txt`.
2. Poz. 1, teza „brak haka civTest” — PRZYJĘTE w części wykonawczej, ODRZUCONE w części faktu. Fakt: hak `__settingsLive.convertFoodToTax` (main.ts, blok `__settingsLive`) zwraca tylko wyliczenie (`convertFoodReserveToTax`) i NIE zmienia stanu tury; to potwierdza zarzut, że nie była to pełna akcja. Przyjęto: dodano hak zmieniający stan, `convertOwnerFoodToTaxLive` (ta sama wiązka io co `onConvertOwnerFoodToTax`), plus odczyty `ownerFoodReserveLive`, `ownerTaxPendingLive`, `ownerTreasuryLive`, `ownerRatesLive` i setup `setOwnerFoodReserveLive`. Budynek Targowisko stawiany przez istniejący `__civTest.adminSetup` (builtIds `['targowisko']`, sprawdzone `adminState(...).built`).
3. Poz. 2, brak próby — PRZYJĘTE. T4 dodany do `diplomacy-city-cession-live-test.cjs`, zielony (23/0).
4. Poz. 2, teza „brak haka / wymaga klikania” — PRZYJĘTE. Istniały `foundExtraCityForTest` i `acceptAiCommandForTest` (`__cityCessionTestDebug`) oraz pole `dodatkoweMiasta` w komendzie AI; użyte w T4 bez klikania w UI.
5. Poz. 3, bieg na ustawieniach domyślnych — PRZYJĘTE. Runner `vlive3-fortring-live.cjs` startuje `__settingsLive.startNewGame(MAX_PARAMS)` (Trudny, dyplomacja trudna, koszty wysoki, kultura trudny). Echo potwierdzone w logu `start`.
6. Poz. 3, brak wymuszenia fortu, brak OFF i round-trip, brak raw logów — PRZYJĘTE częściowo. Dodano `forceFortLive(ownerId)` (rejestracja fortu jak budowa, `registerFortNodeIfNeeded`, SETUP bez zmiany reguły; fort na wolnym heksie w pierścieniu 2–6 od miasta gracza). OFF wykonany (20/20). Round-trip wykonany w obu wariantach (`saved: true`, equal). Raw logi `.txt` w `dane/`. W tej rundzie nie wystąpiły Chromium rc=1 (zero padnięć w 4 biegach z zapisem) — nie ma czego logować poza przerwanym przebiegiem ON t12. Wpływ pierścienia NIE ZMIERZONO (patrz BLOKADY).
7. Bramki nie uruchomione przez Operatora — PRZYJĘTE. Wszystkie bramki z dispatchu uruchomione (lista w TESTY), wyniki z surowego wyjścia (`dane/bramki-g-*.txt`).

## Uwagi dla orkiestratora (poza zakresem; nie wdrażałem)

- Maksimum rozmiaru mapy: runnery używają `Maly` (rozmiar nie jest ustawieniem trudności/kosztów). Jeśli właściciel chce `Super Huge` także tu, to osobny bieg.
- Targowisko: netto skarbca +6 z 20 kolejki (30%). Do rozstrzygnięcia jako pytanie o grę (ABC), nie błąd kodu.
- Przerwany koniec tury ON t12 (`endTurnInProgress` bez widocznego modala): kandydat na osobny temat (błąd gry lub harness); nie odtworzono deterministycznie.
- Zmiany `gra/src/main.ts` dotyczą tylko bloku `__settingsLive` (civTest). Dodano 7 pozycji (patrz ZMIANY-COMMIT). Jeśli orkiestrator woli rozdzielić, hooki można wydzielić do osobnego commita.
- Nie wykonano: spawn_task, create_session, create_trigger, send_later, run_in_background, push, deploy.

SHA: patrz wynik StructuredOutput (czubek commita z tym raportem, dokumentem analizy i danymi).
