# R-WEB-WAR-END-REASON-LOG-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (log + tekst wpisu w „Wydarzeniach na świecie”)
TEMAT: R-WEB-WAR-END-REASON-LOG-Q1
GOAL: Przy zmianie statusu wojna/pokój między dwiema cywilizacjami AI zapisywać PRZYCZYNĘ (kod powodu) w wpisie „Wydarzenia na świecie” (dziennik + trwała lista okna dyplomacji) oraz log diagnostyczny window.__diploWarEndLog pod ?civTest=1. Baza: origin/main 60986fe85.

ZMIANY/COMMIT: 49d30d59f (kod + testy), commit raportu: patrz NASTĘPNY KROK / sekcja SHA poniżej.
- gra/src/game/diplo-world-news.ts: typy WorldDiploReasonCode / WorldDiploReason, czysta funkcja worldDiploReasonLabel (polskie opisy; 'inny' i nieznane → null), pole powod w wpisie i w worldDiploNewsEntry (dopisane do podtytułu „ · powód”), sanitize zachowuje powod (brak = bez powodu).
- gra/src/main.ts: withDiploWarReason (kontekst ustawiany na czas wywołania, przywracany w finally, bez zmiany sygnatury setDiploRelation); setDiploRelation przekazuje kontekst i turę startu wojny do recordAiAiWarPeaceNews; log __diploWarEndLog (tylko ?civTest=1, pomija pary z graczem). Haki powodu:
  - P10 wymuszony pokój zmęczeniem (pokoj_wymuszony_zmeczenie) i P11 oferta przegranego (oferta_zmeczenia): finalize tickAiAiWarWeariness; rozróżnienie po warWearinessByPairKey.peak >= WAR_WEARINESS_PARAMS.zmeczenie.progWymuszonyPokoj (peak = poziom przed decyzją, war-weariness.ts linie 376–377).
  - P12 auto_pokoj_dwa_miasta: maybeResolveRegularWarOnCityCapture.
  - P20 prosba_o_pokoj_ai: finalize tickAiAiPeaceRequests.
  - wypowiedzenie_ai albo wojna_epoki (gdy gateForcedTagAny): zapis wypowiedzenia AI (setDiploRelation po chargeWarDeclarationCredibility).
- gra/tools/diplo-world-news-test.cjs: dwie asercje źródłowe przepięte na nową sygnaturę wywołania recordAiAiWarPeaceNews (ta sama kontrola: przekazanie truce, bramka skip). Nic nie osłabiono.
- gra/tools/war-end-reason-log-test.cjs (nowy): 34 asercje (część A wykonanie modułu, część B haki w main.ts).

TESTY:
- tsc --noEmit: EXIT 0, 0 linii błędów (po zmianie na diploWarStateForRead).
- war-end-reason-log-test.cjs: PASS=34 FAIL=0.
- Mutacja: usunięcie haka P20 (withDiploWarReason prosba_o_pokoj_ai) → FAIL „P20: prośba przegrywającej AI”, PASS=33 FAIL=1; po przywróceniu PASS=34 FAIL=0.
- diplo-world-news-test.cjs: PASS 67/0 (po przepięciu 2 asercji na nową sygnaturę).
- war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL.
- era-war-end-like-classic-test.cjs: PASS 17 / FAIL 0.
- truce-end-war-notice-test.cjs: PASS.
- hud-me-literal-zero-test.cjs: 150 PASS / 0 FAIL.
- Pozostałe *peace*test.cjs i *war-weariness*test.cjs (38 plików): 34 zakończyły się EXIT 0. Niezielone:
  - diplo-forced-peace-pending-test.cjs: 39/1 („okno wraca na początku tury po turn++”). To samo na bazie 60986fe85 (sprawdzone w osobnym archiwum bazy) — NIEZWIĄZANE z tą zmianą, stan zastany.
  - diplo-forced-peace-d2-live-test.cjs, diplo-forced-peace-pending-live-paths-test.cjs, diplo-war-peace-live-test.cjs: testy na żywo (przeglądarka); EXIT 1 / limit czasu 124. NIE ZMIERZONO na bazie; wynik nie jest dowodem regresji ani braku regresji.
- NIE ZMIERZONO (nie uruchomione w tej rundzie): logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297, hotseat e-source 77, bramki-tmpdir 18. Zmiana dotyka tylko hooków dyplomacji AI↔AI, nie tych modułów, ale nie zmierzono.
- Test na żywo (Chromium, wpis w oknie dyplomacji, log window.__diploWarEndLog w przeglądarce): NIE ZMIERZONO.

BLOKADY: brak. Dysk: 13 GB wolne przed startem (68% użycia), node_modules zainstalowane na czas bramek i usunięte po nich. Artefakty testów (zmodyfikowany PNG i nieśledzony live-table.json z uruchomienia testów live) przywrócone/usunięte przed commitem; commit zawiera tylko 4 pliki z allowlisty.

RUNDY: 1/5 (operator, HAIKU 5.5).

NASTĘPNY KROK: Evaluator (SONNET 5.5), potem Obrona i Final Control. Do rozstrzygnięcia przez Evaluatora:
1. Klasyfikacja P10/P11 przez peak (opisana wyżej) — zależy od tego, że peak = poziom w chwili decyzji (potwierdzone czytaniem war-weariness.ts 373–377; nie potwierdzone testem na żywo).
2. Kontekst powodu obejmuje też kaskady zmian statusu inne pary wykonane w tym samym wywołaniu (np. skutki sojuszy). Powód przypisywany jest wtedy wszystkim takim zmianom. Zakres jest świadomy; nie zmieniano logiki wojny.
3. Podpięte tylko ścieżki wymienione w dispatchu. Kody pokoj_z_propozycji, pokoj_po_rozejmie, rozejm_wygasl, zdobycie_miasta, bunt istnieją w słowniku (worldDiploReasonLabel), ale nie są ustawiane przez żadną ścieżkę — wpisy z tych ścieżek zostają bez powodu (jak dotąd).

DEPLOY/PUSH: NIE WYKONANO

SHA: 49d30d59f (kod + testy). Commit raportu: osobny, czubek gałęzi wf_bf15b0f2-0ec-1 (zwrócony w polu sha).

UWAGI-DLA-ORKIESTRATORA:
- Wpisy w diploListHud.ts nie zmieniano: podtytuł (n.subtitle, linia ~449) już niesie powód, więc okno pokazuje go bez zmian w HUD.
- Stary test diplo-forced-peace-pending-test.cjs ma czerwoną asercję „okno wraca na początku tury po turn++” już na bazie 60986fe85 — kandydat na osobny temat długu testowego.
- Haki live (Chromium) nie były uruchamiane poprawnie w tej rundzie; wpis do kolejki pomiarów, jeśli orkiestrator chce dowodu w grze.
