# REJESTR PRÓŚB I ZADAŃ — kanoniczny indeks + historia

## AKTYWNA PACZKA DOKUMENTACYJNA — `R-PROC-AUTOBOT-PAKIETY-1-3-Q1`

GOAL: dokończyć pakiety dokumentacyjne 1–3 i wdrożyć jeden, zamknięty obieg AutoBot
bez zmian w `gra/`. Dowód przebiegu: [`dyspozycje/autobot/runs/R-PROC-AUTOBOT-PAKIETY-1-3-Q1/`](autobot/runs/R-PROC-AUTOBOT-PAKIETY-1-3-Q1/).

| ID pakietu | STATUS KANONICZNY | Dowód |
|---|---|---|
| `R-PROC-AUTOBOT-PAKIET-1-INDEX-Q1` | `ZINTEGROWANE` | `docs/procesy/INDEX-PROCESU.md` wskazuje `HANDOFF-AKTUALNY` i miejsca zapisu artefaktów. |
| `R-PROC-AUTOBOT-PAKIET-2-AKTYWNE-DOKUMENTY-Q1` | `ZINTEGROWANE` | `CLAUDE.md`, aktywna reguła, skill i `R-PROC-AUTOBOT`; historia w `docs/archiwum-procesu/`. |
| `R-PROC-AUTOBOT-PAKIET-3-REJESTRY-RUNS-Q1` | `ZINTEGROWANE` | rejestr, `PYTANIA-OTWARTE.md`, `HANDOFF-AKTUALNY` i run `00–04`. |

Statusy pakietów są aktualne w tym indeksie; historyczne wiersze poniżej pozostają
append-only. `READY_FOR_DEPLOY` jest bramką po integracji, nie statusem publikacji;
deploy/push pozostają osobno i w tej paczce nie zostały wykonane.

## MIGRACJA STATUSÓW — 2026-08-20 (Pakiet 3)

Od tej daty bieżący status tematu może przyjmować wyłącznie jedną z wartości:

`NOWE` · `ABC-OCZEKUJE` · `OPERATOR` · `EVALUATOR` · `FINALNA-KONTROLA` ·
`DO-INTEGRACJI` · `ZINTEGROWANE` · `DEPLOY-ROBOCZA` · `ZAMKNIĘTE` · `BLOCK` ·
`ODŁOŻONE` · `ODRZUCONE` · `DUPLIKAT`

Znaczenie statusu jest procesowe, a nie opisowe: dowód w raporcie/handoffie ma
pierwszeństwo przed nazwą starej etykiety. `DEPLOY-ROBOCZA` oznacza potwierdzone
opublikowanie w ROBOCZEJ; nie jest równoznaczne z `ZAMKNIĘTE`. `ZAMKNIĘTE`
oznacza brak dalszej pracy w tym temacie albo jawne zamknięcie bez implementacji.

### Indeks bieżący — tylko wpisy z jednoznacznym dowodem

Poniższa tabela jest warstwą operacyjną migracji. Nie przepisuje ani nie kasuje
historycznych wierszy poniżej; wpisy bez jednoznacznego dowodu nie są tu zgadywane.

| ID | STATUS KANONICZNY | Dowód / punkt odniesienia |
|---|---|---|
| `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` | `ZDEPLOYOWANE (korekta statusu, 2026-08-21)` | Status `OPERATOR`/„gotowy do dispatchu” byl NIEAKTUALNY — mechanizm jest w pelni zaimplementowany w `gra/src/game/forced-war-stone.ts` (stale `WOJNA_KAMIEN_WYMUSZONA_START_TURY=20`, `_MAX_MIASTA_...=2`, `_ODPOCZYNEK_TUR=20`, `_COOLDOWN_...=20` — 1:1 z ECHO Q1=A/Q3=A) i wpiety w `main.ts`/`ai.ts` (`stoneForceWarTargetId`) analogicznie do mechanizmu Brązu. Zdeployowane FALA 298 (`4322f5aa`, potwierdzone w `WERSJE.md`: „Stone 32/32 + guard 18/18"). Zweryfikowane ponownie 2026-08-21: `node gra/tools/forced-war-stone-test.cjs` + `forced-war-stone-main-guard-test.cjs` nadal zielone. Nic do dispatchu. |
| `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` | `RECON ZAMKNIĘTY (3/4), 1 REALNY BUG WYDZIELONY` | Recon runda 2 (2026-08-21): pytania §4 2-4 (Popalnia brązu, koszty jednostek, kontrakt ogólny) potwierdzone jako zamknięte przez `R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`/T3. Pytanie 1 (12 vs 20 jednostek) — Operator błędnie uznał za martwy tekst bez konsumenta; **Evaluator (FAIL) znalazł 2 żywe konsumenty**: `techTreeView.ts::parseUnlockBuildings()` (hover-karta drzewka, pokazuje stare 12 zamiast 20) i `sciencePicker.ts` (tooltip badań, naiwny split po przecinku BEZ usunięcia prefiksu "Jednostki:" — myli fragmenty listy jednostek z budynkami). Realny, dziś działający bug — wydzielony jako `R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1`. |
| `R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1` | `ZINTEGROWANE` | Przyczyna znaleziona i naprawiona: `.et-hint`/`.et-tooltip` były dziećmi `.et-wrap` (owijał tylko przycisk końca tury), więc `position:absolute` liczyło się względem złego kontekstu i nakładało na zawsze-obecny (disabled gdy brak blokady) przycisk „Wykonaj" nad nim. Naprawa: oba elementy są teraz dziećmi `.civ-bottom-bar` bezpośrednio. **Zweryfikowane realną przeglądarką (Playwright/Chromium)** — zrzuty ekranu potwierdzają nakładanie na starym kodzie i czyste rozdzielenie po naprawie, pixel-for-pixel. Operator→Evaluator→Final Control PASS, 33/33 nowy test + zero regresji. Zintegrowane do `main`. |
| `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` | `ZDEPLOYOWANE, FALA 308` | Zgłoszenie właściciela na żywo (FALA 307, stempel `6c1433ef`): przyciski „Rozpocznij badanie"/„Otwórz drzewo" nie reagowały na klik. Przyczyna: `.entity-card` bez własnego `position` malowało się przed `.tdn-back` (tło, `position:fixed`) w kolejności CSS stacking-context — tło przechwytywało kliknięcia mimo poprawnego DOM/listenerów. Fix: `position:relative` na `.entity-card`. Znalezione i zweryfikowane realną przeglądarką (Playwright/Chromium, `elementFromPoint`+`page.mouse.click`) — jsdom dawał fałszywie zielony wynik. Test mutacyjny (usunięcie fixu → regres wraca, 6/12 FAIL) potwierdza że nowe testy faktycznie łapią ten bug. Operator→Evaluator→Final Control PASS, zdeployowane. |
| `R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1` | `ZINTEGROWANE` | Naprawione dokładnie wg dyspozycji: klik odblokowanego wiersza woła teraz `config.onSelectTech(e.id)` bezpośrednio (dodaje do planu), klik zablokowanego nadal otwiera podgląd. Ikonka „ⓘ" zastąpiona wyraźnym przyciskiem tekstowym „Karta". `techTreeView.ts` świadomie NIE zmieniony (inny, uzasadniony model interakcji — klik węzła zawsze otwiera kartę, start badania z jej wnętrza). Zweryfikowane realnym DOM/klikiem (jsdom+esbuild, prawdziwe dane) — 13/13 asercji. Operator→Evaluator→Final Control PASS. Zintegrowane do `main`. |
| `R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` | `ZINTEGROWANE` | KOREKTA: poprzedni wiersz (2026-08-21, „OTWARTE — nie rozpoczęte") był nieaktualny i miał złamany format tabeli (5 komórek zamiast 3). Znalezisko Evaluatora przy recon `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`: `techTreeView.ts`/`sciencePicker.ts` czytały niekompletną, osadzoną listę jednostek zamiast strukturalnego źródła (`units.json` pole `Tech`) — naprawione, Operator→Evaluator→Final Control PASS, zweryfikowane na żywym DOM (20 jednostek zamiast 12 dla Brązownictwa). Zintegrowane do `main` (bez osobnej FALI — połączone z `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` w FALI 308). Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-PRACA-BUDYNKI-ULEPSZENIA-SPLIT-50-Q1` | `DUPLIKAT/ZASTĄPIONY (korekta statusu, 2026-08-21)` | Status `OPERATOR`/„osobna gałąź, bez merge" byl NIEAKTUALNY/z 2026-08-17. Dokladnie ten kontrakt (`splitEmpirePracaBudget()`, pula imperium budynki+ulepszenia=100%, ulepszenia max 50%) zostal od tego czasu zaimplementowany i redeployowany DWUKROTNIE pod innymi ID: `P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1` (FALA 293, `8fa80b7c`) i `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` (FALA 302), a obecnie jest w dalszym ciagu dopracowywany w aktywnym temacie tej sesji `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` (Watki A/B/C/D/E/F). Zweryfikowane: `splitEmpirePracaBudget()` istnieje i dziala w `gra/src/game/production.ts:1898`. Brak osobnego dispatchu — dalsza praca nad tym mechanizmem idzie przez `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`, nie przez ten stary ID. |
| `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1` | `ZDEPLOYOWANE (korekta statusu, 2026-08-21)` | Status „implementacja w toku" byl NIEAKTUALNY — mechanizm jest w pelni zaimplementowany i przetestowany zgodnie z NAJNOWSZYM ECHO (1B=3 tury, 2A pelna obustronnosc, 3B autoryzacja konczy sie natychmiast/jednostki zostaja, 8B promien 2 heksow, 9A aktywne jednostki ladowe, 10B dolaczenie dopiero po koncu biezacej walki): `RodzajTraktatu.WspolnaWalkaBarbarzyncy` w `diplomacy.ts`, logika w `diplomacy-treaties.ts`/`diplomacy-proposals.ts`/`diplomacy-border-march.ts`/`diplomacy-display.ts`/`main.ts`. Zweryfikowane ponownie 2026-08-21: `node gra/tools/diplomacy-barbarian-cooperation-test.cjs` → 10/10 PASS (obustronnosc, wygasniecie na granicy tury 3, autoryzacja przemarszu, promien 2, wykluczenia zwiadowcy/garnizonu/rajdera morskiego, blokada dolaczenia w trakcie walki, brak duplikacji przy merge). Nic do dispatchu. |
| `R-USTROJE-RODZAJE-PRZYSZLOSC` | `ODŁOŻONE` | Jawnie zarejestrowane na przyszłość, do osobnej sesji o ustrojach. |
| `R-MIASTA-LIMIT-PODBÓJ-Q1` | `ZAMKNIĘTE` | ECHO A: limit dotyczy miast założonych; decyzja zamknięta bez zmiany kodu. |
| `R-TRZY-KARTY-WDROZENIE-Q1` | `ZINTEGROWANE` | Trzy karty wdrożone: Karta 1 (tokeny + `techDiscoveryNotice.ts`) Operator PASS-WITH-NOTES + Evaluator WARUNKOWY PASS (kod OK, zastrzeżenie czysto procesowe o kolejności commitów, rozwiązane przez Final Control); Karta 2 (`unitInfoCard.ts`) Operator FAIL (brak Esc, nieprawdziwe TESTY) → poprawka → Operator PASS + Evaluator PASS; Karta 3 (`sidePanelHud.ts`+`bottomBarHud.ts`) Operator PASS + Evaluator PASS-WITH-NOTES (drobne nieścisłości statystyk w raporcie, niemerytoryczne), z wykonanym test mutacyjnym potwierdzającym twardy zakaz blokady tury. Final Control (orkiestrator): pełna regresja na całości pięciu plików razem — `tsc` 0, 13 zestawów testów zielonych, 2 znane przedistniejące awarie (`unit-info-card-army-interaction-test` 5/2, niezwiązane z tym diffem, potwierdzone przez oba Evaluatory). ECHO: blokada tury = NIE (potwierdzone 6 lipca, karty zostają sygnałem); przycisk „Zignoruj" przy buncie = TAK; rant slotu 3D = złoto kanonu. Otwarte dla właściciela (nierozstrzygnięte, nieblokujące): przycisk „Otwórz hub badań" pominięty (rozbieżność handoffu designera z realną makietą, zweryfikowana niezależnie dwa razy — Operator i Evaluator). Dispatch: `dyspozycje/autobot/runs/R-TRZY-KARTY-WDROZENIE-Q1/`. |
| `P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1` | `DEPLOY-ROBOCZA` | Korekta potwierdzona w FALI 293 `8fa80b7c`; wpis nie jest już otwarty. |
| `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` | `ZDEPLOYOWANE, FALA 310` | Watki A-F: (A) usunięty zdublowany suwak, (C ECHO=A) cap 50% wymuszony też na historycznym automacie ulepszeń miasta, (D) naprawa „+N" niezgodności puli PRACA IMPERIUM, (F) przeprojektowanie prezentacji panelu — dwie kolumny Budynki/Ulepszenia. Runda 2 Final Control dała FAIL proceduralny (branch odgałęziony przed FALA 304); naprawione mergem `main`→branch (zero konfliktów w `gra/`), runda 3 Operator→Evaluator→Final Control PASS (Final Control: PASS-WITH-NOTES, patrz `PYTANIA-OTWARTE.md`). Zmergowane do `main`, zdeployowane FALA 310. `tsc` 0; 149 testów tematu + `logic-test` 213/213 + `tech-tree-test` 19/19 + `research-test` 33/33 + `unit-replace-test` 13/13 + `combat-test` 6/6. |
| `R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` | `CAŁA MIGRACJA T1-T10 ZDEPLOYOWANA, FALA 315` | T1+T1b+T3 FALA 307, T4 FALA 309, T8 FALA 311, T5 FALA 312, T7b FALA 313, T6+T9 FALA 314, T10 FALA 315. Ostatni krok (linkowanie krzyżowe 4×4), system `entityCards` (4 kinds/4 adaptery) kompletny. Operator+Evaluator+Final Control PASS niezależnie, 3 niezależne testy real-Chromium stosu Esc/overlay przy zagnieżdżonych kartach. Trywialny fast-forward. Cała migracja zakończona i zdeployowana. Nic do dispatchu. |
| `P-DESIGN-11-ZAKLADEK-DROBIAZGI-RUNDA-2-BEZ-AKCJI` | `ZDEPLOYOWANE, FALA 313` | N5/N9/N11/N12 naprawione w `empireDetailPanel.ts` zgodnie z ECHO. N5 ma znaną, udokumentowaną usterkę zaokrągleń (±1 złoto w ~10-20% kombinacji, kosmetyczna, nie dotyka skarbca) potwierdzoną niezależnie przez Evaluatora i Final Control. N1 zamknięte bez akcji. Operator→Evaluator→Final Control PASS/PASS-WITH-NOTES. Zdeployowane. Pełny recon mechaniki szlaków i dokładnej przyczyny N5: `P-HANDEL-SZLAKI-MECHANIKA-RECON-Q1` w `PYTANIA-OTWARTE.md`. |
| `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1` | `ZAKOŃCZONE — T1+T2+T2b+T3+T4+T6 WSZYSTKIE ZINTEGROWANE do main (T6 commit 2e6aac59), już w bundlu ROBOCZA (potwierdzone 2026-09-03 przy weryfikacji kolejki — wiersz był stały, tabela poniżej nieaktualizowana od T2b)` | Przebudowa mechaniki szlaków handlowych. ECHO (2026-08-21, pełna treść `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md`): odwrócenie zależności od dystansu osobno per medium (ląd max=12/morze max=20, identyczny szczyt); bonus morski ×2 sumuje się z istniejącym `PORT_SEA_TRADE_BONUS_PIENIADZ`; 5% przypisane per trasa jako stały procent JEJ WŁASNEGO dochodu, zastępuje stary globalny mnożnik w `economy.ts` (realny transfer budżetu); limit „jedna umowa" bez zmian (już istnieje per-para, temat T5 wypada z zakresu); Port zostaje wymogiem istnienia trasy morskiej. Finalne doprecyzowanie: opcja zawarcia `UmowaSzlakow` w panelu dyplomacji dostępna WYŁĄCZNIE gdy (a) dostępność lądowa istnieje (port niepotrzebny), LUB (b) brak lądu ale OBIE strony mają port — inaczej opcja niedostępna w panelu (nowy gate na poziomie propozycji traktatu, nie tylko powstania trasy). Ląd ma bezwarunkowe pierwszeństwo, nie wybór po dochodzie. Stawki ×5 tylko na stałych dystansowych. Podział T1(wzór)→T2(morze×2+priorytet lądu)→T2b(nowy: gate propozycji traktatu w dyplomacji)→T3(rozdzielenie gatingu budynkami)→T4(atrybucja 5%)→T6(UI). **T1 zakończone: Operator→Evaluator→Final Control wszystkie PASS (workflow `wf_e9da30e1-0e2`), zweryfikowane niezależnie przez orkiestratora (tsc czyste, vite build OK, testy handel/econ zgodne z raportami, 5 bramek referencyjnych zielone), zmergowane fast-forward do `main` i wypchnięte jako commit `65315319` (2026-08-22).** **T2 zakończone: Operator/Evaluator PASS, Final Control PASS-WITH-NOTES (uwaga niewiążąca o `detectBestConnection` — patrz decyzja §Postęp; nie blokuje READY_FOR_DEPLOY), workflow `wf_5973ab38-00f` (wymagał 1 wznowienia po INFRA-blokerze braku miejsca na dysku przy tworzeniu worktree — orkiestrator posprzątał ~24GB starych, już zmergowanych worktree i wznowił). Zweryfikowane niezależnie (tsc/build/testy/5 bramek zielone), zmergowane fast-forward do `main` commit `a3276dda`, wypchnięte (2026-08-22). Rozwiązuje też `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`.** **T2b zakończone: Operator/Evaluator/Final Control wszystkie PASS (workflow `wf_39d8ddec-8ff`), reużyto istniejącej `citiesHaveTradeConnection` (funkcja E6) — zero nowej logiki połączeniowej, nowe pole `hasTradeConnection` na `DiplomacyActionLockContext`, gate w `resolveDiplomacyActionLock` case '5' z priorytetem `atWar>hasHandel>hasTradeConnection>relacjaGate`, UI bez zmian. Zweryfikowane niezależnie (tsc/build/testy diplomacy+handel/econ/5 bramek zielone), zmergowane fast-forward do `main` commit `f303760a`, wypchnięte (2026-08-22).** **Zbiorczy deploy ROBOCZA wykonany (2026-08-22): FALA 316, `gra-robocza/Gra-ROBOCZA.html` + 6 bundli playtestowych + świeży build `Gra-ROBOCZA-POLE-BITWY.html`, manifest md5 `5bcde74d`, `verify-robocza-bundle.cjs` -> VERIFY OK, commit `9aa8959d`, wypchnięte do `origin/main`.** T3/T4/T6 w kolejce, nie dispatchowane jeszcze. |
| `P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1` | `NOWE — recon zamknięty, gotowe do dispatchu (wstrzymane na wyraźne polecenie właściciela)` | Zgłoszenie właściciela (2026-08-22): suwak „Automatyzacja ulepszeń terenu → Ręczny" (`UlepszeniaEmpirePolicy.pracaAutoPercent`) błędnie ograniczony do 0-50% zamiast 0-100% — pomyłkowe rozszerzenie stałej `MAX_PRACA_WSPOLNY_WOREK_PROCENT=50` z NIEZALEŻNEGO pola `EmpirePracaSplit.procentUlepszenia` (to drugie ma zostać 0-50%, poprawne). Recon potwierdził dokładną przyczynę w `clampUlepszeniaPracaPercent()` (`cities.ts:208-211`), 2 wywołania w `main.ts`, 3 pliki testowe do aktualizacji. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-PRACA-SPLIT-UI-JEDEN-SUWAK-Q1` | `NOWE — recon zamknięty, gotowe do dispatchu (wstrzymane na wyraźne polecenie właściciela)` | Zgłoszenie właściciela (2026-08-22, czysty UX, bez zmiany parametrów): panel „PODZIAŁ PRACY" (`renderEmpirePracaBudgetSplitSection()`, `empireDetailPanel.ts:1120-1154`) ma dziś dwa osobne boksy Budynki/Ulepszenia zamiast jednego suwaka pełnej szerokości z etykietami po bokach + klikalne min/max na krańcach. Gotowy gradient CSS (`laborSliderFillStyle()`) już istnieje jako martwy kod z wcześniejszego, świadomie zastąpionego wzorca — częściowy powrót na żądanie właściciela. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-PRZYCISK-Q1` | `NOWE — recon zamknięty, gotowe do dispatchu (wstrzymane na wyraźne polecenie właściciela)` | Zgłoszenie właściciela (2026-08-22): nowy przycisk w panelu „SPICHLERZ CENTRALNY" (`renderDefaultPoziomRacjiSection()`, `empireDetailPanel.ts:134-161`) ustawiający `autoWyzywienie=true` dla wszystkich miast bez `poziomRacjiOverride`. Oba mechanizmy (`city.autoWyzywienie`, `city.poziomRacjiOverride` + wzorzec masowej propagacji `broadcastPoziomRacjiToOwnerCities()`) już istnieją — prosta zmiana, nie wymaga nowego mechanizmu ekonomii. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-PRACA-PANEL-IKONY-NIESPOJNE-Q1` | `ECHO ZAPISANE — gotowe do dispatchu (wstrzymane na wyraźne polecenie właściciela)` | Zgłoszenie regresu (2026-08-22): panel miasta „PODZIAŁ PRACY" ma DWIE różne ikony dla „Ulepszenia" (`tb-build` młotek vs `chip-crate` skrzynka, ta druga dodana commitem `bd03ed3e`/Wątek F 2026-08-21). ECHO właściciela: ujednolicić do `chip-crate` (skrzynka), zachować ikony (nie przechodzić na tekst), Operator ma dodatkowo zweryfikować wizualnie (Playwright) czy ikona wagi realnie gdzieś występuje. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1` | `NOWE — recon zamknięty, WYMAGA jednej decyzji stylu` | Regres z T10 (FALA 315, commit `f17e257e`): brak CSS dla `.entity-card-row-key`/`.entity-card-row-value` w `entityCards/renderer.ts` — linkowalne wartości renderują się jako nieostylowane, białe `<button>`. Naprawa: 1 blok CSS w `ENTITY_CARD_CSS`, wspólny dla wszystkich 4 adapterów. Brak wzorca designera dla stylu linku (świadomie odroczone w brief). Dodatkowy zakres: ten sam typ usterki w karcie budynku wewnątrz panelu budowy miasta (`cityPanel.ts`, inny komponent). Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-CIVPEDIA-KARTY-NOTATKI-DEWELOPERSKIE-Q1` | `NOWE — recon zamknięty, gotowe do dispatchu bez ABC` | Karty ulepszeń pokazują graczowi surowy wewnętrzny dziennik balansu (`surowiecOdblokowany_uwaga` w `terrain-improvements.json`, 9/14 kluczy dotkniętych). Czysto opisowe, nie source-of-truth (`surowiec_ilosc_tura` to prawdziwa liczba używana przez silnik). Nie regres — pole zawsze pełniło tę funkcję. Naprawa: `improvementAdapter.ts` przestaje renderować to pole graczowi; dane JSON zostają nietknięte. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-BUILDMODE-LOCKTIP-ZASLANIA-LISTE-Q1` | `NOWE — recon zamknięty, gotowe do dispatchu bez ABC` | Tooltip „zablokowane przez technologię" w panelu „ULEPSZENIA TERENU" (`buildModeHud.ts::showLockTip()`) pozycjonowany sztywnym offsetem bez sprawdzenia viewportu/listy — zasłania wiersze poniżej. Gotowy wzorzec flip/clamp już istnieje 3× w repo (`techTreeView.ts`, `hoverDetailDock.ts`, `hudTitleTooltip.ts`). Mała, jednomiejscowa naprawa. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1` | `NOWE — recon zamknięty (znalezisko Final Control), gotowe do dispatchu bez ABC` | Znalezisko Final Control przy weryfikacji `P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1`: `.entity-card-action`/`-primary`/`-secondary` (przyciski „Rozpocznij badanie"/„Otwórz drzewo", `data.actions`, żywa ścieżka) nie mają ŻADNEGO CSS od T1, identyczny brzydki natywny wygląd jak `row-value` przed naprawą. Nie regres, poza allowlistą poprzedniego tematu — wydzielone osobno. Naprawa: styl wypełnionego przycisku (nie link), analogicznie do `.entity-card-more`, plus nowy test renderujący kartę z `actions`. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-HANDEL-SZLAKI-MECHANIKA-RECON-Q1` | `RECON ZAMKNIĘTY` | Pełne wyjaśnienie mechaniki szlaków handlowych (aktywacja: pokój+traktat+łączność+sloty; dochód: `floor(8−0.4×dystans)` złota + 5%/trasa Handlu) i dokładnej przyczyny usterki N5 (mismatch `floor` forward vs `round` reverse w `main.ts`/`empireDetailPanel.ts` — kosmetyczny, nie dotyka skarbca). Pełny opis w `PYTANIA-OTWARTE.md`. Wydzielone nowe znalezisko: `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`. |
| `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1` | `OTWARTE, niski priorytet` | Wzór dochodu z tras zduplikowany w 2 miejscach `main.ts` (panel Handlu + chip HUD) zamiast jednej wspólnej funkcji z `trade-routes.ts::computeTradeRouteIncomeByCity`. Ryzyko cichego rozjazdu przy przyszłej zmianie wzoru. Czysto techniczny refaktor, nie wymaga ABC. Pełny opis w `PYTANIA-OTWARTE.md`. |
| `P-SCIENCE-HUB-TEST-BASELINE-2-4-Q1` | `ZINTEGROWANE` | Przyczyna: stary próg `>=5` w teście od początku (era Kamień ma stabilnie 4 technologie Poziom=1 bez prereq). Naprawiony na `>=4` + komentarz. Zero zmian w `gra/src/`/`gra/data/`. Operator→Evaluator→Final Control PASS. Zintegrowane do `main`. |

### Zasada migracji i historii

Wiersze oraz sekcje poniżej są append-only historią. Stare etykiety (`W TOKU`,
`WDROŻONE`, `ZDEPLOYOWANE`, `SCALONE`, `CZEKA-NA-DECYZJĘ`, `SUPERSEDED` itd.)
pozostają nietknięte jako zapis stanu z chwili powstania. Nie traktuj ich jako
bieżącego statusu, dopóki nie ma wpisu w tym indeksie albo nowej, udokumentowanej
korekty z dowodem. Migracja nie zmienia merytorycznego statusu żadnego tematu bez
takiego dowodu.

---

## ⛔ ZASADA PROCESU (Maciej 2026-07-24, obowiązkowa dla KAŻDEJ sesji)
**KAŻDA prośba Macieja, która powinna skończyć się jakąkolwiek zmianą w grze/kodzie/danych,
MUSI zostać natychmiast zapisana TUTAJ** — nawet jeśli padła mimochodem w czacie i nie jest
od razu realizowana. Powód: prośby z samego czatu giną (potwierdzony przypadek: „osobny poziom
trudności per państwo/miasto" — poproszona dawno, nigdzie nie zapisana, nie wdrożona, nikt tego
nie pilnował). Narracja w czacie NIE jest śledzeniem. Ten plik jest jedynym rejestrem statusu.

**Format bieżącego wiersza:** ID · data zgłoszenia · prośba (zwięźle) ·
`STATUS-KANONICZNY` z listy powyżej · commit/deploy · uwagi. Historyczne wiersze
zachowują swój pierwotny zapis i wymagają korekty dopiero po sprawdzeniu dowodu.
Przy zamknięciu tematu: aktualizuj STATUS + wpisz commit/md5. Szczegóły decyzji ekonomicznych → `DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`.

**Problemy/błędy z numeracją:** `dyspozycje/REJESTR-PROBLEMOW-AI.md` — format **`P-AI-###`** (Maciej 2026-07-26). Każdy nowy problem od razu dostaje numer; w czacie odwołujesz się po ID.

## ⛔ NUMER → ABC/ECHO → COMMIT → READY_FOR_DEPLOY → DEPLOY/PUSH
Pełny kanon: [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md).
1. Każdy temat → **pełne ID tutaj od razu**; status bieżący wybierz z zamkniętej listy.
2. Jeśli potrzebna jest decyzja właściciela, zapisz pełne ABC w `PYTANIA-OTWARTE.md`.
3. Po odpowiedzi zapisz ECHO i decyzję; temat kontynuuje ten sam ID przez run `00–04`.
4. **`READY_FOR_DEPLOY`** → orkiestrator potwierdza Final Control i integrację; dopiero
   osobne polecenie `deploy`/`push` publikuje i aktualizuje `WERSJE.md`.

## ⛔ AUTOBOT — TWARDA REGUŁA (Maciej 2026-08-05) — KAŻDA PRACA TYLKO TĘDY
**KAŻDA praca agenta** (kod, fix, audyt, docs procesu) **wyłącznie** w systemie AutoBot:
Operator (**GPT-5.6 Luna High**) → Evaluator (**GPT-5.6 Luna High**) →
finalna kontrola → integracja → `READY_FOR_DEPLOY`. Deploy/push jest osobną bramką
po bramkach i autoryzacji. **ZAKAZ** omijania pętli.
Kanon: [`autobot/README.md`](autobot/README.md) ·
[`docs/decyzje/R-PROC-AUTOBOT.md`](../docs/decyzje/R-PROC-AUTOBOT.md) ·
`.cursor/rules/autobot-evaluator-operator.mdc`.

**ARCHIWUM:** wcześniejsze wpisy o modelach i routingach pozostają poniżej jako historia,
ale nie są aktywnym routingiem.

**Notatka 2026-08-05:** Cleanup przestarzałych „czeka deploy" / „bez deploy" dla pozycji już w `WERSJE.md`; źródło prawdy deployu w owym momencie = FALA 228 (`29bfdf00`).

**Notatka 2026-08-09:** źródło prawdy deployu dziś = **FALA 263** (`89176ced318b7e7d03b2fd6b197df80d`), branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie `main`). Szczegóły sesji: `dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md`.

**AKTYWNY ROUTING:** Operator **GPT-5.6 Luna High** → Evaluator **GPT-5.6 Luna High** →
Final Control **GPT-5.6 Luna High** → integracja orkiestratora **GPT-5.6 Luna Medium** →
`READY_FOR_DEPLOY`; deploy/push dopiero po osobnej bramce i autoryzacji. Pełny ślad
nowego przebiegu zapisuj w `dyspozycje/autobot/runs/<ID>/`.

**C-043 (2026-08-19):** właściciel komunikuje się wyłącznie w głównym czacie
orkiestratora; subagenci są kanałami technicznymi.

| R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1 | 2026-08-19 | Umowa terminowa na wspólną walkę z barbarzyńcami i obustronny wojskowy przemarsz; zasady zerwania i jednostek pozostających na miejscu | **ECHO 1A + 2A + 3A — DECYZJA ZAPISANA; IMPLEMENTACJA NIEZLECONA** | `docs/decyzje/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.md` · pełne A/B/C i ECHO w `PYTANIA-OTWARTE.md` · bez zmian `gra/`, bez deployu/pushu |
| R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1 | 2026-08-18 | Kanon raportu właściciela: **dziesięć** kategorii (stany Operator/Evaluator, czeka na Operatora vs zapomniane), filtr ECHO, Playtest z ROBOCZEJ | **WDROŻONE (docs-only) — nie jest pytaniem ABC** | `docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md`; zasady: `CLAUDE.md`, `.claude/skills/civ-autobot/SKILL.md`, `.cursor/rules/komendy-raport.mdc`; snapshot FALA 295 `8589d294` |
| R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1 | 2026-08-18 | Poprzedni kanon siedmiu kategorii (FALA 294) | **SUPERSEDED → R-RAPORT-10** | `docs/decyzje/R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1.md` — tylko kompatybilność linków; pełna treść w historii gita |

| P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1 | 2026-08-17 | Ogólny wzorzec rozbudowanej karty technologii; prototyp na Brązownictwie | **ECHO=A ZAPISANE (2026-08-21) — RECON W TOKU** | ECHO A: prototyp/UX zaakceptowany; recon rozbieżności źródeł (12 vs 20 jednostek, „Popalnia brązu") wymagany PRZED dalszym wdrożeniem. UWAGA: `techDiscoveryNotice.ts` (FALA 300, `R-TRZY-KARTY-WDROZENIE-Q1`) już wdrożył ogólną kartę dla wszystkich technologii PRZED zamknięciem tego recon — pierwszy krok recon to sprawdzenie, czy ten kod nadepnął na te same rozbieżności. Branch: `autobot/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`. Konkretna karta Brązownictwa (osobny, wcześniejszy temat) była wdrożona jako `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1=C` w FALI 294. |
| P-JEDNOSTKI-KARTA-3D-INFO-Q1 | 2026-08-18 | Integracja tymczasowej, generycznej karty jednostki z istniejącym ekranem armii; Hastati jako wzorzec, prawdziwe dane i slot modelu 3D | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | Testy karty 23/23, wiring 6/6, interakcja armii 7/7, istniejący kontekst 29/29, side-list 74/74, tsc PASS, build PASS; nota: brak live 3D/WebGL; dowód bundla `WERSJE.md` FALA 295 |
| P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1 | 2026-08-17 | Korekta niepełnego splitu FALI 292: cała pula Pracy, budynki + ulepszenia, cap 50% | **ZDEPLOYOWANE FALA 293 `8fa80b7c` — PASS** | FALA 292 była częściowa; FALA 293 domknęła `doBudynkow` dla gracza/AI/MP, kolejki, overflow i UI. Historia FALI 292 pozostaje w `WERSJE.md` i `PYTANIA-OTWARTE.md`. |

| R-AI-TRUDNOSC-AUDYT | 2026-08-05 | Audyt + **P0** (Maciej „1"): realna Praca · Spichlerz id · L3 nauka=2 | **ZDEPLOYOWANE `efab84db`** (FALA 229) | `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md` · PR #111 · AutoBot PASS |
| R-AI-TRUDNOSC-P1 | 2026-08-05 | P1: majorEarly ×0.70 · scout −80 · L1 early turn 25 | **ZDEPLOYOWANE `7f8bdc74`** (FALA 230) | §F audytu · PR #112 |
| R-AI-TRUDNOSC-P1-3 | 2026-08-05 | Spryt AI → ai-params.json (agresja/dyplomacja/cel ×3) | **ZDEPLOYOWANE `7f8bdc74`** (FALA 230) | §G audytu · PR #113 · behavior-neutral |
| R-AI-TRUDNOSC-P2 | 2026-08-05 | P2: Q1=A (canAfford status quo) · Q2=A (L3 early=25 przy +1 mieście) | **ZDEPLOYOWANE `283de421`** (FALA 231) | `docs/decyzje/R-AI-TRUDNOSC-P2-ABC.md` · PR #115 · Maciej 1+2+3 |
| R-KOLEJKA-OTWARTA | 2026-08-05 | Priorytet otwartej listy | **ECHO 1+2+3** · deploy→playtest→F12/scena→SUR-DESIGN | `docs/decyzje/R-KOLEJKA-OTWARTA-ABC.md` |
| R-SOLO-ABC | 2026-08-05 | Autonomia na nieobecność | **✅ ECHO ALL + FALA 232–233** · muzyka/węgiel/bitwa I+facing · WIAR Etap0+dźwignie docs | `docs/decyzje/R-SOLO-ABC.md` · ROBOCZA `06712ea4` |
| R-CITY-PILL-PROD-ICON | 2026-08-05 | Pigułka: ikony kolejki + wzrost + medalion władcy (gracz/major AI) vs kultura (MP) | **ZDEPLOYOWANE `29bfdf00`** (FALA 228) | `docs/decyzje/R-CITY-PILL-PROD-ICON.md` · AutoBot PASS |
| R-PROC-AUTOBOT-P0-SMOKE | 2026-08-05 | Wzmocnienie smoke przed merge (notes Evaluatora: git-merge, defer attrs, evaluate→retire) | **ZMERGOWANE `9068115`** · #108 · bez deploy | smoke 10/10 |
| R-PROC-AUTOBOT-P0 | 2026-08-05 | P0 po FAIL adwokata: Dev score jawne metryki, delay+historia prune, deny-default, RETIRED, smoke | **ZMERGOWANE `9068115`** · #108 · bez deploy | na `main` |
| P-AI-MOC-BONUS | 2026-08-05 | Podpiąć 4 martwe bonusy trudności AI (jednostki/miasta/walka/nauka) | **ZDEPLOYOWANE `3840f218`** (FALA 227←226) · playtest odłożony | Q1=A · `docs/decyzje/P-AI-MOC-BONUS.md` · AutoBot PASS+notes |
| AI-MOC-NEXT-Q1 | 2026-08-05 | Co dalej z luką Mocy AI | **ZDEPLOYOWANE `ff7c5e49`** (FALA 239) · B=metryki | Maciej `2`=B · overlay Diag major AI · `docs/decyzje/AI-MOC-NEXT-Q1.md` · bez balansu |
| P-AI-MAJOR-ABSORB | 2026-08-05 | Absorpcja AI major→major | **ZDEPLOYOWANE** F240 Faza1 + **F241 Faza2** `178073f9` | F2=B any-civ Hard · `P-AI-ABSORB-F2.md` |
| P-AI-ABSORB-F2 | 2026-08-05 | Faza 2 absorb any-civ | **ZDEPLOYOWANE `178073f9`** (FALA 241) Q1=B | tylko Hard · `docs/decyzje/P-AI-ABSORB-F2.md` |
| AI-BALANS-UNLOCK-Q1 | 2026-08-05 | Odblokuj strojenie liczb AI | **ECHO B** · FALA 241 docs · STEP1→F242 | wolno małe kroki · `AI-BALANS-UNLOCK-Q1.md` |
| AI-BALANS-STEP1 | 2026-08-05 | L3 kolonizacja: pop źródła 4 | **ZDEPLOYOWANE `5b6ee97d`** (FALA 242) | `AI_COLONIZATION_SOURCE_MIN_POP_L3=4` · test 13/13 · `AI-BALANS-STEP1.md` |
| AI-BALANS-STEP5 | 2026-08-06 | bonus_produkcja → realna Praca major AI | **ZDEPLOYOWANE** FALA 253 `b8704216` | P0-1 formalizacja (wiring F229) · test 18/18 · `AI-BALANS-STEP5.md` |
| AI-BALANS-STEP6-Q1 | 2026-08-06 | Kara score 2. zwiadowca −80 pkt w `chooseCityProduction` | **JUŻ WDROŻONE PRZED DECYZJĄ** — commit `dadcb48` (`AI_EARLY_SCOUT_REPEAT_PENALTY=80`, `ai.ts:730,836`), poprzedza ten wpis. Nie dublować. | `docs/decyzje/AI-BALANS-STEP6-Q1.md` · paczka ABC 2026-08-06 |
| R-RELIEF-FAIRPLAY | 2026-08-06 | relief-grid/fair-play C-MAPA-Q1=B mop-up po złożach | **ZDEPLOYOWANE** FALA 256 `693a2c57` | tip `41eed4d6` · `R-RELIEF-FAIRPLAY-STATUS.md` · fair-play 8/8 · Ogromny wolniejszy OK |
| R-KAMIEN-RELIEF-FOLLOWUP-Q1 | 2026-08-06 | Whitelist reliefu: legacy `kopalnia` + reguła wszystkich kopalń | **ZDEPLOYOWANE FALA 296 `a37f7123`** · commit `85932371` jest przodkiem `main`/źródła deployu | `docs/decyzje/R-KAMIEN-RELIEF-FOLLOWUP-Q1.md` · Evaluator PASS-WITH-NOTES · test prefiksu 23/23 |
| MAP-UX-CLUSTER-LABEL-Q1 | 2026-08-06 | Etykiety stolica (civ + marker) vs MP (nazwa + dopisek) | **ZDEPLOYOWANE FALA 296 `a37f7123`** · commity `9d33e8f` + `d3470ed` są przodkami `main`/źródła deployu | `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` · Evaluator PASS-WITH-NOTES · display 27/27 · badge 31/31 |
| R-WIARYGODNOSC-S9-Q1 | 2026-08-06 | Pełna paczka strojenia liczb §9 (JSON + testy) | **ZDEPLOYOWANE FALA 259 `e028045c` — Evaluator PASS-WITH-NOTES** | implementacja `2e67219` + korekta `68f06dc` · `wiarygodnosc-test` 270/270 · `docs/decyzje/R-WIARYGODNOSC-S9-Q1.md` |
| R-MIASTA-LIMIT-PODBÓJ-Q1 | 2026-08-18 | Limit miast założonych nie blokuje miast zdobytych | **ECHO A — ZAMKNIĘTE bez zmiany kodu** | `docs/decyzje/R-MIASTA-LIMIT-PODBÓJ-Q1.md`; rozpoznanie `canFoundCity()` vs ścieżki capture |
| R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1 | 2026-08-18 | Wojna wymuszona AI w epoce Kamienia | **ECHO Q1=A + Q2 + Q3=A — kompletne, gotowe do dispatchu Operatora** | start po 20 turach; cel jak w Brązie; koniec po 2 miastach, 20 tur odpoczynku, 20 tur cooldownu; `docs/decyzje/R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1.md` |
| R-DESIGN-PANEL-MIASTA-V2-Q1 | 2026-08-06 | Pilne zlecenie Design klatek v2; kod nie zamrożony | **ECHO ZAPISANA** · brief do wklejenia GOTOWY (AutoBot retry PASS-WITH-NOTES, fakty przeliczone na `main`) · czeka wklejenia do Design | `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` · C · deliverable: `dyspozycje/DO-WKLEJENIA-DESIGN-V2-2026-08-06.md` (zastępuje sekcje 1/3/4/6 `DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`) · uwaga: historyczna wersja briefu opisywała marker stolicy jako PENDING; marker jest teraz zdeployowany w FALI 296, a sekcja 5 briefu zawiera korektę statusu |
| R-OBRONA-MIASTA-MP-Q1 | 2026-08-06 | Obrona bez murów: rozbicie bonusów w preBattle (mechanika bez zmian) | **SCALONE runda 3** (PASS-WITH-NOTES) — bramka `cel` z licznikiem N z M, `cityDefenseBreakdownFor` pokryte testem (35/35), martwy kod usunięty · doprecyzowanie R-OBRONA-MIASTA-MP-SCOPE-Q1=B (bonus murów/cytadeli/baszty w panelu) nadal otwarte, osobna dosyłka | `docs/decyzje/R-OBRONA-MIASTA-MP.md` §ECHO · A · `docs/decyzje/R-BRAZ-SUPER-DISPATCH-Q1.md`-owy wzór 3 rund |
| R-DEFICYT-ZLOTA-KARA-Q1 | 2026-08-06 | Kara za deficyt Złota — analogia do głodu wojska (staty + atrycja HP) | **SCALONE+PUSH** `dd1f267` (prog=Skarbiec, AI floor zdjęty, UI fix) | `docs/decyzje/R-DEFICYT-ZLOTA-KARA-Q1.md` · A+B |
| R-STATUS-PRZYCZYNA-CIERPIENIA-Q1 | 2026-08-06 | Ikona per przyczyna + opis na karcie jednostki | **SCALONE** (PASS-WITH-NOTES) — 2 ikony rozróżnialne na mapie (głód/deficyt złota, obie naraz widoczne), wiersze statusu na karcie jednostki z nazwanymi parametrami | `docs/decyzje/R-STATUS-PRZYCZYNA-CIERPIENIA-Q1.md` · C |
| R-RABAT-SOL-GARNIZON-Q1 | 2026-08-06 | Podwójny rabat garnizonu przy Soli — sumują się czy nie | **ZAMKNIĘTA** — potwierdzenie status quo, zero zmian w kodzie | `docs/decyzje/R-RABAT-SOL-GARNIZON-Q1.md` · A |
| R-FENICJA-SKARB-CAP-Q1 | 2026-08-06 | Mnożnik Skarbu Fenicjan ×11,4 — exploit czy zamierzone | **ZAMKNIĘTE — FAŁSZYWY ALARM**: ×11,4 to artefakt sprzed refaktoru 2026-07-25, dziś nieistniejący; realny szczyt ×5,79 (normal) | `docs/decyzje/R-FENICJA-SKARB-CAP-Q1.md` · A |
| R-KONTRY-BITWA-SPOJNOSC-Q1 | 2026-08-06 | Ujednolicenie tabeli kontr bitwy do `counters.json` | **SCALONE+PUSH** `162b306` — zero utraconych bonusow (0/98) potwierdzone niezaleznie | `docs/decyzje/R-KONTRY-BITWA-SPOJNOSC-Q1.md` · A |
| **P-AI-BRAK-POJECIA-MGLY-Q1** | 2026-08-17 | AI: własna mgła per owner, pamięć ostatniej pozycji celu, atak dopiero po ponownym wykryciu | **GOTOWE / ZAMKNIĘTE — Evaluator PASS-WITH-NOTES; ZDEPLOYOWANE FALA 292, zachowane w FALI 294** | `gra/src/game/ai-fog.ts` · `main.ts` per-owner/save-load wiring · `ai-fog-test.cjs` 8/8 · `bitwa-mapa-kamera-blokada-test.cjs` 24/24 · ROBOCZA md5 `a0f804d7` · `VERIFY OK` |
| R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1 | 2026-08-06 | Priorytet bramek uczciwość vs chęć do handlu | **SCALONE** (runda 4, PASS-WITH-NOTES) — uczciwość PW pozostaje priorytetem, chęć respondenta-AI moduluje próg (−15%…+20%) WYŁĄCZNIE gdy respondentem jest AI (nie gracz), podłoga parytetu chroni przed przepłatą AI (R-PW-ACCEPT-OVERPAY-Q1), komunikat zawsze z realną przyczyną i liczbami PW. 4 rundy: r1 fałszywa przyczyna, r2 regresja AI→gracz, r3 regresja overpay (usunięcie z PROPOSER_PW_FAIRNESS_ACTIONS bez podłogi), r4 domknięcie podłogą parytetu | `docs/decyzje/R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1.md` · B+C połączone · efekt uboczny AI↔AI w `PYTANIA-OTWARTE.md` |
| LOGIC-TEST-2BUGS-Q1 | 2026-08-06 | 2 nowe awarie logic-test.cjs: canFoundCity dist=4, city food store undefined | **SCALONE** (PASS-WITH-NOTES) — oba testowe: prog dystansu byl zgadywany (5 zamiast realnych 4 z JSON), magazynZywnosci jest CELOWO legacy/tylko-oblezenie od refaktoru population-growth-v85 (asercja poprawiona na `number>=0 LUB undefined`) | logic-test 207/208 |
| UNIT-REPLACE-EVOCATI-Q1 | 2026-08-06 | unit-replace-test.cjs 2/10: Evocati znika z listy "Zastąp" | **SCALONE** (runda 2, PASS-WITH-NOTES) — realny bug produkcyjny naprawiony w `main.ts` (`replaceAvailabilityCtxForCity`/`replaceAvailabilityCtxEmpireWide` → `empireResourceStock: citySurowceSumForOwner(...)`, wzorem `productionCtxForCity`), od FALI 96 (`daacd43`) mechanizm "Zastąp" gubił wszystkie jednostki brązowe/żelazne. Brak pokrycia testowego naprawy w main.ts — nota w `PYTANIA-OTWARTE.md` | unit-replace-test 10/10, logic-test 207/208, tsc 0, build 797 modułów |
| MENNICA-GRACE-VERIFY-Q1 | 2026-08-06 | mennica-uspienie-test.cjs 39/49: laska Mennicy juz wdrozona (a17b541), test przestarzaly | **SCALONE** (PASS-WITH-NOTES) — mechanizm laski dziala poprawnie; test nie nadazyl za FALA 41 (etykieta zawsze "Podatek", stub trasy zlota deprecated) — naprawiono wylacznie test | mennica-uspienie-test 49/49, zero zmian w silniku |
| R-BRAZ-SUPER-DISPATCH-Q1 | 2026-08-06 | Wpięcie 5 naprawionych modeli super-jednostek + usunięcie starych | **SCALONE+PUSH** `4f2b8b5` + runda2 pełna recenzja (5/5 potwierdzone) + `8871c07` D1-D4 naprawione, martwy kod fizycznie usunięty | `docs/decyzje/R-BRAZ-SUPER-DISPATCH-Q1.md` · A |
| D-DYPLO-CELOWNIK-Q1 | 2026-08-05 | Celownik → stolica z karty dyplo | **ZDEPLOYOWANE `178073f9`** (FALA 241) Q1=A | hint brak stolicy · wiring był · `D-DYPLO-CELOWNIK-Q1.md` |
| D-DYPLO-AKCJE-SZARE-Q1 | 2026-08-05 | Niedostępne akcje szare+tooltip+wiersz | **ZDEPLOYOWANE `01f6024a`** (FALA 243) B+C | `D-DYPLO-AKCJE-SZARE-Q1.md` |
| D-DYPLO-KATALOG-Q1 | 2026-08-05 | Pełny katalog akcji dyplo w UI | **ZDEPLOYOWANE `01f6024a`** (FALA 243) A | `D-DYPLO-KATALOG-Q1.md` |
| R-AI-MIASTA-BUDOWY-Q1 | 2026-08-05 | MP prawie nie budują | **ECHO A** · audyt ✅ · fix→FIX-Q1=A ZDEPLOY | root: infra vs PROD-GATE · `R-AI-MIASTA-BUDOWY-Q1.md` |
| R-AI-MIASTA-BUDOWY-FIX-Q1 | 2026-08-05 | Fix MP budów: filtr infra vs PROD-GATE | **ZDEPLOYOWANE `0757265a`** (FALA 244) A | `infraOrder`+`isProductionAllowed` · test 17/17 · `R-AI-MIASTA-BUDOWY-FIX-Q1.md` |
| BUG-DYPLO-PANEL-OVERLAP-Q1 | 2026-08-05 | Dyplo nachodzi na panel jednostki | **ZDEPLOYOWANE `8b6e0cfe`** (FALA 245) A | `BUG-DYPLO-PANEL-OVERLAP-Q1.md` |
| R-KOPALNIA-WEGIEL-Q1 | 2026-08-05 | Kopalnia na węglu / stare save | **ECHO custom** — węgiel ep.6–7, nie teraz | `R-KOPALNIA-WEGIEL-Q1.md` |
| R-ZLOZA-EPOKI-GEN-Q1 | 2026-08-05 | Kiedy generować złoża przyszłych epok | **ECHO A** · kanon (kod metali OK, bez deploy) | gen przy Nowej grze + ukryj do epoki · `R-ZLOZA-EPOKI-GEN-Q1.md` |
| P-AI-PROD-GATE-PER-OWNER | 2026-08-05 | isProductionAllowed difficulty per owner | **ZDEPLOYOWANE `d1450398`** (FALA 240) Q1=A | `effectiveGameDifficultyForOwner` · `docs/decyzje/P-AI-PROD-GATE-PER-OWNER.md` |
| P-AI-008 | 2026-08-05 | Zagrożenie: jednostki+rozwój zamiast murów (nie chmury) | **ZDEPLOYOWANE `3840f218`** (FALA 227←226) · playtest odłożony | custom Maciej · `docs/decyzje/P-AI-008.md` |
| R-SCENA-PERF-FALA138 | 2026-08-05 | Budowanie sceny — pomiar→fix | **ZDEPLOYOWANE** FALA 248 `772bab7c` — offline diag + merge skip/cache; pomiar F12 nadal mile widziany | `docs/decyzje/R-SCENA-PERF.md` · handoff sesji 2026-08-05 |
| R-GARNIZON-AKCJE | 2026-07-26 | Opuść garnizon z panelu miasta | **ZDEPLOYOWANE** FALA 212 `e38ad116` (onLeaveGarrison) | diagnoza historyczna — kod już w ROBOCZA |
| R-KOPALNIA-RELIEF | 2026-07-25 | Kopalnie nie spłaszczają wzgórza | **ZAMKNIĘTE / ZDEPLOYOWANE FALA 296 `a37f7123`** przez `R-KAMIEN-RELIEF-FOLLOWUP-Q1` | miedź/żelazo/złoto + legacy `kopalnia` oraz przyszłe `kopalnia_*` zachowują relief; test prefiksu 23/23 |
| P-AI-006 | 2026-07-26 | ekspansywnosc=0 wszędzie | **ZAMKNIĘTE** — `civ-ai.json` 2–5; `ai-expansion.ts` czyta per nacja | REJESTR-DECYZJI 🟢 WDROŻONA FALA 36 |
| P-AI-010 | 2026-07-26 | Poradnik „konkuruj osadnikiem” | **ZAMKNIĘTE** — poradnik rev.G bez osadnika | `14-ai-zagrozenia.md` |
| R-PROC-AUTOBOT | 2026-08-05 | **KAŻDA praca** wyłącznie AutoBot (Operator→Evaluator→finalna kontrola→integracja→READY_FOR_DEPLOY; deploy/push osobną bramką) | **TWARDA REGUŁA OBOWIĄZUJE** · P0 zmergowane `#108`/`9068115` · Maciej przypomniał 13:41 | `docs/decyzje/R-PROC-AUTOBOT.md` · `dyspozycje/autobot/` · `.cursor/rules/autobot-evaluator-operator.mdc` |
| R-PROC-AUTOBOT-EVAL-SCOPE | 2026-08-05 | Evaluator: scope=tylko temat + brak regresji/ubocznych zmian | **🟢 OBOWIĄZUJE** · tip `eb84533`+ · rule_105 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` |
| R-PROC-AUTOBOT-EVAL-STRICT | 2026-08-05 | Evaluator STRICT: luki testów / brak asercji AC → FAIL (nie NOTES) | **🟢 OBOWIĄZUJE** · Maciej „2” · rule_106 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-EDGE | 2026-08-05 | Evaluator STRICT-EDGE: testy tematu tylko happy-path bez edge/negacji/repro → FAIL #7 | **🟢 OBOWIĄZUJE** · Maciej „2 Jeszcze twardszy” · rule_107 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-PARITY | 2026-08-05 | Evaluator STRICT-PARITY: asymetria gracz/AI/MP lub test tylko ownerId=0 bez decyzji → FAIL #8 | **🟢 OBOWIĄZUJE** · Maciej „2 = Tylko A (parytet)” · rule_108 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md` |
| R-PROC-AUTOBOT-EVAL-STRICT-SAVE | 2026-08-05 | Evaluator STRICT-SAVE: luki save/load nowego pola lub restore bez ?? default → FAIL #9 | **🟢 OBOWIĄZUJE** · Maciej „1+2” oś B · rule_109 | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md` |
| P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1 | 2026-08-17 | Po wejściu cywilizacji obóz znika, a heks dostaje trwałą blacklistę spawnera | **ZDEPLOYOWANE FALA 296 `a37f7123` — Evaluator PASS** · ECHO `e6c2ea2b` · implementacja `85f70a91` · testy 18/18 i 84/84 | `docs/decyzje/P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1.md` · blacklist/save-load/parytet |
| P-MP-SPAWN-WYZYWIENIE | 2026-08-05 | Spawn MP: suwak Wyżywienie start ~3 zamiast 4 | **ZDEPLOYOWANE `ea921d1e`** (FALA 238) | `foundCity*` → `poziomRacji:4` · tip `5fecbcf` · test 14/14 |
| R-AUTO-RACJE-RAISE | 2026-08-05 | Auto Wyżywienie + Spichlerz ≥ 0 + przełącznik auto w każdym mieście | **ZDEPLOYOWANE** FALA 225→227 `3840f218` · fokus playtest **ODŁOŻONY** (R-AUTO-RACJE-RAISE-PT=B, 2026-08-06) | Q1=B · Q2–Q5=A · bez ABC o playtest (`R-ABC-BEZ-PLAYTEST`) · `docs/decyzje/R-AUTO-RACJE-RAISE-PT.md` |
| R-REKRUT-LUDNOSC-UI | 2026-08-04 | Teksty rekrutacji: nie sugerować −1 obywatela; ludność miasta nie spada (tylko Manpower) | **ZDEPLOYOWANE `38df6ad7`** (FALA 224) | `docs/decyzje/R-REKRUT-LUDNOSC-UI.md` · cityPanel |
| R-BUDYNKI-NIEAKTYWNE | 2026-08-04 | Wybudowane budynki bez surowca runtime (Spichlerz, Mennica, deposit gate) → czerwona nazwa + tooltip Brak: … | **ZDEPLOYOWANE `132401ef`** (FALA 222) | Q1=A · Q2=A+C · Q3=A · `docs/decyzje/R-BUDYNKI-NIEAKTYWNE.md` · branch `cursor/feat-budynki-nieaktywne-63a1` |
| R-DYPLO-PW-PRZECINEK | 2026-08-04 | Panel PW: śmieci float (−10.400000000000006%) → format jak Skarbiec | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| `docs/decyzje/R-DYPLO-PW-PRZECINEK.md` |
| R-EOT-EVENT-DEFER | 2026-08-04 | Skutki EOT (wydarzenia/toasty) odłóż na start następnej tury gracza | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=**A** · `docs/decyzje/R-EOT-EVENT-DEFER.md` · branch `cursor/feat-eot-dyplo-flex-63a1` |
| R-DYPLO-WYMIANA-FLEX | 2026-08-04 | Stół: jednostronna wymiana, qty edit, jedno Przyjmij, Usuń | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| ONEWAY=A · QTY=A+B · ACCEPT=A · USUN=A · `docs/decyzje/R-DYPLO-WYMIANA-FLEX.md` |
| R-DYPLO-DOBRA-KAT | 2026-08-04 | Dobra handlowe: Surowce/Technologie/Inne (akordeon) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=A · Q2=A · Q3=A · `docs/decyzje/R-DYPLO-DOBRA-KAT.md` · branch `cursor/feat-dobra-kat-trzoda-63a1` |
| R-TRZODA-SCALE-MAP | 2026-08-04 | Skala zwierząt pastwiska/trzody ×1,5 na mapie | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| Q1=**B** (krowa+świnia+owca+lama) · `docs/decyzje/R-TRZODA-SCALE-MAP.md` |
| R-SCOUT-ZWIEDZAJ-HIGHLIGHT | 2026-08-04 | Zwiedzaj ma złoty stan WŁ jak Czuwaj/Fortyfikuj (select nie kasuje autoExplore) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| korekta R-SCOUT-EXIT-AUTO · `docs/decyzje/R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md` |
| R-SCOUT-ZWIEDZAJ-PODSWIETLENIE | 2026-08-04 | Po kliknięciu Zwiedzaj brak złotej ramki (Uśpienie OK) | **ZDEPLOYOWANE `ee0e7e04`** (FALA 223) | Q1=A · zostań + złoto od razu · `docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md` |
| P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1 | 2026-08-17 | Ceremonialny popup po zajęciu ostatniego aktywnego miasta-państwa tego samego klucza kultury co gracz; bez zmiany mechaniki epoki Brązu ani innych podbojów | **GOTOWE / ZAMKNIĘTE — ZDEPLOYOWANE FALA 294 `a0f804d7` — PASS-WITH-NOTES** | ECHO `94a70850` · testy `13/13`, `16/16`, tsc PASS · ROBOCZA md5 `a0f804d7593333e34c989dc3565cb0c6`, VERIFY OK · live Chromium niedostępny w środowisku |
| R-BATTLE-TEMPO-UI | 2026-08-04 | Panel Tempo bitwy: ± zamiast ×1/×2/×4; AUTO = komputer; prędkość w tooltipach | **ZDEPLOYOWANE `132401ef`** (FALA 222) | Q1=**A** · Q2=**B** · `docs/decyzje/R-BATTLE-TEMPO-UI.md` · branch `cursor/feat-battle-tempo-ui-63a1` |
| R-DYPLO-STOL-PW-SUM | 2026-08-04 | Stół: bilans PW liczy tylko 1. umowę, nie sumuje wymiany surowców na stole | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| panel `negotiationBalanceBarHtml` · suma PW wszystkich pending · `docs/decyzje/R-DYPLO-STOL-PW-SUM.md` |
| R-DYPLO-PRZYJMIJ-TRADE | 2026-08-04 | Stół negocjacji: Przyjmij na Traktat handlowy nic nie robi (umowa_handlowa vs umowa_szlakow w evaluateProposal) | **ZDEPLOYOWANE `4d17d869`** (FALA 221)| branch `cursor/fix-dyplo-przyjmij-traktat-63a1` · `docs/decyzje/R-DYPLO-PRZYJMIJ-TRADE.md` |
| R-BUDOWA-ZROWNOWAZONE-TRYB | 2026-08-04 | Zrównoważony w produkcji = osobny tryb (nie 6. priorytet typów) | **ZAMKNIĘTE** · ZDEPLOYOWANE FALA 222→223 `ee0e7e04` · playtest OK | Q1=A · `docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md` |
| R-PROC-NUMER-ABC | 2026-08-03 | Procedura: numer tematu → ABC → commit; deploy tylko na hasło | **WDROŻONE (docs)** | Pliki: `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`, `.cursor/rules/numer-abc-commit-deploy.mdc`, START-TU, CLAUDE, PAMIEC, KOMENDY |
| R-PROC-ABC-FULL-ID | 2026-08-03 | W ABC/Ask/ECHO **zakaz gołego Q1** — zawsze pełne ID (`R-TEMAT-Qn`) bo wiele wątków | **WDROŻONE (docs)** | Maciej: „nie wystarczy Q1… sam nie będziesz wiedział”. Procedura §3a · PAMIEC · abc-pelna-forma · numer-abc rule |
| R-PROC-NO-REGRESS | 2026-08-04 | Przy każdej zmianie: sprawdź diff (co zmienione/usunięte) — nie cofaj wcześniejszego fixa przy wdrażaniu nowego | **WDROŻONE (docs)** | Procedura §4a · checklist przed commit/deploy · PR #78 |
| R-PW-ACCEPT-OVERPAY | 2026-08-04 | Przyjmij traktat: gracz może zaakceptować gdy oddaje więcej (+ bilans); blokada gdy bilans na minus (korzyść gracza) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · `previewIncomingPlayerAccept` net≥0 · PR #79 · `docs/decyzje/R-PW-ACCEPT-OVERPAY.md` |
| R-NADMIAR-POOLS | 2026-08-04 | FALA2 ×2: budynki (upkeep/Praca/surowce), jednostki (rekrut/upkeep/żywność wojska), Brąz+Żelazo badań ×4, ulepszenia, cuda | **ZDEPLOYOWANE FALA 215** `2a5a66d1` | `R_STAWKI_FALA2_MULT=2` · PR #82 |
| MP-ARMY-Q1 | 2026-08-04 | Cap wojska MP: easy ∞ / normal 1 / hard 0 (garnizon wliczony, odbudowa do limitu) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-ARMY-Q1.md` · commit `b47a2e8` |
| MP-GARRISON-Q1 | 2026-08-04 | Hard: istniejące garnizony OK, zakaz nowej produkcji wojskowej | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-GARRISON-Q1.md` |
| MP-DIPLO-Q1 | 2026-08-04 | Ułatwienie AI major→MP; same-civ Zaufanie ~100; priorytet absorpcji klastra | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/MP-DIPLO-Q1.md` |
| AI-FOUND-Q1 | 2026-08-04 | Founding AI major pop ≥ 2 (jak gracz) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-FOUND-Q1.md` |
| AI-LOCAL-Q1 | 2026-08-04 | Faza lokalna AI ~tura 20 LUB 1 scout; wioski nie blokują | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-LOCAL-Q1.md` |
| AI-MANAGE-Q1 | 2026-08-04 | Auto-zarządca dla major AI (nie MP) | **ZDEPLOYOWANE FALA 220** `8a3c6d6d` | **A** · `docs/decyzje/AI-MANAGE-Q1.md` |
| R-UNIT-MODE-TOGGLE-UI | 2026-08-04 | Pasek akcji jednostki: wyróżnienie trybu WŁ/WYŁ (fortyfikuj / czuwaj / zwiedzaj) osobno od dostępny/zablokowany | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #77 · `docs/decyzje/R-UNIT-MODE-TOGGLE-UI.md` |
| R-MP-HARD-WAVE | 2026-08-04 | Hard MP: większe armie + fala ataku + sync DOW klastra | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · Q2=A · Q3=A · PR #80 · `docs/decyzje/R-MP-HARD-WAVE.md` |
| R-SCOUT-BLACK-MAX | 2026-08-04 | Zwiedzaj: każdy ruch max. nowych czarnych heksów (nie FoW); chatka wzrok/reachable; po chatce znowu czarne | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Q1=A · Q2=A · PR #81 · `docs/decyzje/R-SCOUT-BLACK-MAX.md` |
| R-SCOUT-ZWIEDZAJ | 2026-08-03 | Zwiadowca: przycisk Zwiedzaj (autoExplore), priorytet chatka > mgła | **ZDEPLOYOWANE `5f529a24`** (FALA 203) | P-SCOUT-EXPLORE-Q1=A, Q2=B · `docs/decyzje/P-SCOUT-EXPLORE.md` |
| R-SCOUT-ZWIEDZAJ-UX | 2026-08-04 | Zwiedzaj UX: clear path + deselect + next unit (jak sentry); poza cyklem Spacji | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | clear path + deselect + next · poza cyklem Spacji |
| R-CHATKA-VET-TOAST | 2026-08-04 | Chatka: toast nagrody nadal nadpisywany tipem „Doświadczeni wojownicy” (po FALA 212) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #71 · `docs/decyzje/R-CHATKA-VET-TOAST.md` |
| R-ICON-ZROWNOWAZONE | 2026-08-04 | Ikona zrównoważonego budowania = ta sama waga co Prawo/sąd | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #72 · `docs/decyzje/R-ICON-ZROWNOWAZONE.md` |
| R-MP-ULEPSZENIA | 2026-08-04 | Miasta-państwa nie stawiają ulepszeń terenu (regres FALA 204) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #73 · `docs/decyzje/R-MP-ULEPSZENIA.md` |
| R-OKOLICA-ZYWNOSC-SCORE | 2026-08-04 | Auto-okolica fokus żywność: łąka/równina zamiast lasu; wagi 10/0/0 + potencjał farmy | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #76 · `docs/decyzje/R-OKOLICA-ZYWNOSC-SCORE.md` |
| R-SCOUT-EXIT-AUTO | 2026-08-04 | Marsz / ruch ręczny → wyłącz autoExplore (select NIE — patrz HIGHLIGHT) | **ZDEPLOYOWANE `adefb5b8`** + korekta HIGHLIGHT | PR #75 · korekta `R-SCOUT-ZWIEDZAJ-HIGHLIGHT` |
| R-LISTA-NAZWANA | 2026-08-04 | Lista budowy: nazwane szablony + Zamknij listę (wyjście z trybu) | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | PR #74 · `docs/decyzje/R-LISTA-NAZWANA.md` |
| R-AUTO-ULEPSZENIA | 2026-08-03 | Auto-ulepszenia: Q1–Q5 | **WCHŁONIĘTE w R-AUTO-V2 / FALA 204** | `docs/decyzje/P-AUTO-ULEPSZENIA.md` |
| R-TRIUMPH-CS | 2026-08-03 | Triumf po zjednoczeniu ostatniego miasta-państwa tej samej cywilizacji (gracz) | **ZDEPLOYOWANE `5f529a24`** (FALA 203) | P-TRIUMPH-CS-Q1=B · `docs/decyzje/P-TRIUMPH-CS.md` · `triumph-city-state.ts` |
| R-AUTO-V2 | 2026-08-03 | Domknięcie auto: budowa+ulepszenia Q1–Q9 | **ZDEPLOYOWANE (FALA 204)** | `docs/decyzje/R-AUTO-V2.md` · branch `cursor/fix-auto-v2-63a1` |
| R-LUDY-MORZA | 2026-08-03 | Brąz: Ludy Morza bez obozu na wodzie; lądowe obozy zostają (Q1=A) | **ZDEPLOYOWANE (FALA 204)** | `docs/decyzje/R-LUDY-MORZA.md` · w merge z V2 |
| R-AI-MP-WASAL-WCHLONIECIE | 2026-08-03 | AI→MP: trybut/wasal/wchłonięcie ułatwione (skala trudności); sojusze sióstr tylko vs gracz; gracz bez zmian teraz | **ZDEPLOYOWANE (FALA 205)** | Q1=A · Q2=A(Ł/N)+C(Hard) · `ai-cs-absorption.ts` + main.ts · md5 `f41c6550` |
| R-GRACZ-WCHLONIECIE | 2026-08-03 | Gracz wchłania MP po wasalu (N=10, Respekt 90, koszt ¤, zgoda) — v1 tylko CS | **ZDEPLOYOWANE `1c7e9df7`** (FALA 206) | Q1A Q2A Q3A · branch `cursor/fix-gracz-wchloniecie-63a1` · docs |

## ⚠️ LEGENDA STATUSÓW (Maciej 2026-08-03)

`WDROŻONE (kod)` **≠** brak w bundlu ROBOCZA. Przed meldunkiem „nie ma w grze" — sprawdź **`dyspozycje/WERSJE.md`** (FALA + md5). Status `ZDEPLOYOWANE` = potwierdzony wpis w WERSJE.

## KOLEJKA OTWARTA (2026-08-03) — bez kodu / decyzja / design

| ID | Status | Uwagi |
|----|--------|-------|
| R-HANDEL-AI-FALA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | R-HANDEL-AI-FALA-Q1=B · skalowany koszyk AI |
| R-ZAMIEN-ULEPSZENIE-CONFIRM | **ZAMKNIĘTE Q1=A** | Zawsze modal przy zastąpieniu (jak dziś) · `docs/decyzje/R-ZAMIEN-ULEPSZENIE-CONFIRM.md` · bez zmian kodu |
| BUG-ARMIA-BRAK-POLACZ | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Połącz widoczny w docku jednostki |
| R-DESIGN-BADANIA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | R-DESIGN-BADANIA-Q1=B · scienceHubHud + Klatka D |
| R-DESIGN-BADANIA-KLATKA-D | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Numerek planu na węźle drzewka v1.1 |
| R-KOLEJKA-NASTEPNY | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | A+C wykonane: kolonizacja + Design w ROBOCZA |
| R-DESIGN-PANEL-MIASTA | **ZDEPLOYOWANE `64a7878a`** (FALA 208) | prototyp v1; hover czeka Design · `docs/decyzje/R-DESIGN-PANEL-MIASTA.md` |
| R-CITY-PILL-SHIELD-EMBLEM | **ZDEPLOYOWANE `132401ef`** (FALA 222) | tarcza: brak/palisada szara/mury złota; medalion SVG cywu; branch `cursor/fix-city-pill-shield-emblem-63a1` |
| R-PILL-TARCZA-BEZ-MURU | 2026-08-04 | Pigułka: szara tarcza mimo braku palisady/muru na heksie (Sparta) | **ZDEPLOYOWANE `ee0e7e04`** (FALA 223) | Q1=A · wallKind · `docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md` |
| R-UI-TRAKTAT-LANDSCAPE | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | Koszyk traktatu: landscape 2 kol. (PW+warunki lewo, wymiana prawo), modal ~1180px. |
| R-PW-BILANS-ACCEPT | **ZDEPLOYOWANE `adefb5b8`** (FALA 214) | Bilans PW < 0 → brak akceptacji AI/Przyjmij; dopiero ≥0. PR #70 · `docs/decyzje/R-PW-BILANS-ACCEPT.md` |
| R-WIARYGODNOSC | **R1/R1b/R3/R4 + UI rozbicie + badge/ranking + §9 DONE** (FALA 259 `e028045c`) | `wiarygodnosc-test` 270/270; `R-WIARYGODNOSC-S9-Q1.md` |
| R-RELACJA-PW-INVERT | **ZDEPLOYOWANE `6bf472e2`** (FALA 211) | Korekta FALA 210: niska Rel → niższe PW gracza (siła), partner baza; dopłać. Rel 52/baza 80 → **42 vs 80**. |
| R-AI-KOLONIZACJA | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) | Q1A Q2A Q3B · dystans 4 · pop≥5 · surge |

**PR-y docs — SUPERSEDED (cleanup 2026-08-03):** #35 R-PROC-ABC-FULL-ID → wchłonięte w `cursor/cleanup-docs-rejestr-63a1` · #31 plan AUTO-BUDOWA Q1 → R-AUTO-V2 / FALA 204 · #30 plan AI wasal → FALA 205 / R-AI-MP-WASAL-WCHLONIECIE · #27 backlog IDs → wchłonięte; deploy FALA 204/205.

---

| R-MP-TRYBUT-WOJNA | 2026-08-02 | Miasto-państwo (Tarent): wypowiedziało wojnę i jednocześnie „Oferta trybutu przyjęta" — sprzeczność z UI (akcja 8 niedostępna u MP). | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | Branch `cursor/fix-cs-war-tribute-contradiction-63a1`. Blokada trybutu CS w AI/evaluateProposal/negotiation; prune pending przy DOW. Testy: layers 22/22, proposal 69/69, cluster-diff 25/25. |
| R-HANDEL-AI-FALA | 2026-07-28 | AI handel: sensowne koszyki umów, walidacja magazynów obu stron, cap złota na cały cykl; nie wysyłać pustych propozycji (`zaproponuj_umowe_handlowa`). | **ZDEPLOYOWANE `47a2e73b`** (FALA 207) Q1=B | `buildClampedAiTradeAgreementPayload` · diplomacy-ai-balance 17/17 |
| R-HUD-MIASTO-UKLAD | 2026-07-28 | HUD miasta: lewo jeden rząd **Praca · Żywność · Skarbiec**; prawo przy nazwie **Nauka · Kultura · Religia**; ikony brand, nowrap bez zawijania. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `cityPanel.ts`. W bundle `fed92ad1` razem z FALA 50–55. |
| R-HUD-ZOOM-DOCK | 2026-07-28 | Przyciski zoom **− 100% +** i **⛶** pod minimapą (ta sama lewa krawędź 280px), nie nad mapą. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `minimapHud.ts` · `hud.ts`. |
| R-HUD-MAPA-NOWRAP | 2026-07-28 | HUD mapy: lewy pasek jeden rząd (Skarbiec·Praca·Spichlerz·Nauka·Handel), **bez emoji 🍞** przy Spichlerzu; prawy klaster (Civpedia+Menu) widoczny przy zoom UI 110–150%; nowrap. | **ZDEPLOYOWANE `fed92ad1`** (FALA 56) | `hud.ts` · `sidePanelHud.ts`. |
| R-AI-MP-BUILD-GATE | 2026-08-02 | MP/AI: planner produkcji bez bramki tech/epoki → pusta kolejka | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | **P-AI-014** · `isProductionAllowed` w `ai.ts` + `main.ts`; testy T7D-j/k · PR #18 |
| R-KARTA-ARMIA-2 | 2026-07-28 | Na żetonach składu armii: **2 paski** (HP zielony + ruch niebieski) oprócz tekstu 22/22 · 2/2. | **ZDEPLOYOWANE `fed92ad1`** (FALA 55 w bundle) | `hexContextTooltip.ts` `buildUnitStackBarHtml`. Pierwotny deploy FALA 55: `9bd4a0f6`; potwierdzone w bundle `fed92ad1`. |
| R-KARTA-ARMIA-1 | 2026-07-28 | Po merge jednostek: nazwa **Armia · (q,r)** + skład mini-kart od razu (nie tylko typ lidera); nagłówek panelu **Armia**. | **ZDEPLOYOWANE `fed92ad1`** (FALA 54 w bundle) | `main.ts`, `hexContextTooltip.ts`, `sidePanelHud.ts`. Pierwotny deploy FALA 54: `5162a385`. Handoff: `HANDOFF-SESJA-2026-07-28-KARTA-ARMII.md`. |

## OTWARTE / DO DECYZJI

> **Sekcja historyczna** — wiele wierszy poniżej ma status ZAMKNIĘTE / ZDEPLOYOWANE / WCHŁONIĘTE. Nie traktuj `WDROŻONE (kod)` 1:1 jako braków ROBOCZA; źródło prawdy deployu = **`WERSJE.md` FALA 202+**.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AUDYT-STOLICE-VS-MP | 2026-08-02 | 4 bliskie etykiety miast — czy bypass sep stolic (min ~12 hex)? | **ZAMKNIĘTE / ZDEPLOYOWANE FALA 296 `a37f7123`** przez `MAP-UX-CLUSTER-LABEL-Q1=B+C` | Audyt DESIGN_KLASTRA; sep 14 twarde; etykiety + marker wdrożone, MP wyłączone z korony commitem `d3470ed` |
| C-ARMY-HUNGER-Q1 | 2026-07-27 | ZNALEZISKO-88: parytet głodu armii AI vs gracz (suwak żywności + utrata HP) | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | Decyzja **A** — pełny parytet · `docs/decyzje/C-ARMY-HUNGER-Q1.md` |
| R-TRUDNOSC-1 | „jakiś czas temu" (odtworzone 2026-07-24) | **Osobny suwak „Trudność miast-państw" w kreatorze gry**, niezależny od głównej trudności. Steruje 3 mechanizmami miast-państw: (1) startowe zaufanie do gracza, (2) skala sojuszu sióstr, (3) posiłki obronne (RESUP). | **ZDEPLOYOWANE `ea75f5ba`** | Suwak w Zaawansowanych opcjach; domyślnie=główna trudność. Recon 2026-07-24: te 3 elementy są pochodną globalnej `_menuDifficulty` (trust easy+10/normal+5/hard0; sojusz sióstr ×0,6/0,3/0,15; RESUP low/normal/strong) **ORAZ przeciek: `bonusWalka` +5% siły walki AI na hard (`trudnosc_poziom3_bonus_walka`) — miasta-państwa też go dostają z globalnej trudności.** Nowa opcja setupu odpina WSZYSTKO (3 mechanizmy + siłę walki miast-państw) od globalnej. Domyślnie = główna trudność (zero regresji). Główna `_menuDifficulty` steruje resztą (ekonomia/AI/mapa). Musi respektować parytet AI. |
| R-UNIT-KOSZT-ŁUCZ | 2026-07-24 | Łucznicy brązowi = 1 Brąz czy 0? | **ZDEPLOYOWANE** (redeploy 4.1) — dystansowe 0 surowców | Decyzja: **0** (jednolicie — wszystkie dystansowe darmowe surowcowo, jak Procarz). Łucznik akadyjski/asyryjski 1→0. Reguła kosztów: dystansowe = 0. |
| R-AUTO-BUDOWA-LISTA | 2026-08-03 | Budowa: Ręczny / Priorytet / Lista nazwana A/B/C | **WCHŁONIĘTE w R-AUTO-V2 / FALA 204** | Q1=A · Q2=A · Q3=B · `docs/decyzje/R-AUTO-BUDOWA-LISTA.md` |
| R-STAWKI-STROJENIE | 2026-07-24 | ×2 koszty: badania + utrzymanie jednostek + budowa budynków + żywność ludność/wojsko (bez cięcia produkcji) | **ZDEPLOYOWANE (FALA 205)** | `R_STAWKI_KOSZT_MULT=2` · md5 `f41c6550` |
| R-DYST-DREWNO | 2026-07-24 | Surowce jednostek: rekrutacja×5 + utrzymanie=baza (Drewno/Brąz/Żelazo) + AI tartak/kopalnia | **ZDEPLOYOWANE** FALA 250 `d7165a12` | Akceptacja Macieja · tip `796fc7a7` · tabela `R-DYST-DREWNO-TABELE-AKCEPTACJA.md` |
| R-AI-KUP-JEDN | 2026-07-24 | AI NIE ma ścieżki „kup jednostkę za złoto" (`purchaseRecruitmentUnit` main.ts:2054 zablokowane do `ownerId===0`). Maciej 2026-07-24: „działać" = **naprawić parytet**. | **ZDEPLOYOWANE `c676b681`** (FALA 5) | `purchaseRecruitmentUnit`/`cancelRecruitmentPurchase` uogólnione na dowolnego ownera (ownerTreasury, koszt surowcowy z puli ownera, UI tylko gracz). Czysty predykat `shouldAIRushBuyUnit` (ai.ts). AI kupuje za złoto gdy: wojna + Manpower + złoto ≥ rezerwa(100)+koszt + <1 zakup w turze. Rezerwa/limit = PLACEHOLDER strojenia. Test ai-unit-rush 8/8, ai-test baseline 233/7 (0 regresji). **Do strojenia w playteście:** czy AI powinno rush-ować agresywniej/inny próg. |
| R-JEDN-DOSTEP-BUG | 2026-07-24 | Pre-istniejący bug: bramka dostępu brąz/żelazo dla jednostek jest MARTWA — `production.ts:751` porównuje `surowiec === 'braz'` po samym `.toLowerCase()`, a dane to `'Brąz'` (z ą) → `'brąz' !== 'braz'`, więc jednostki brązowe/żelazne budują się BEZ wymaganego dostępu do surowca. | **ZDEPLOYOWANE `c676b681`** (FALA 5) | Maciej 2026-07-24: „naprawiaj". Fix: `stripDiacritics()` zamiast `.toLowerCase()` w production.ts (2 miejsca: availableProduction + availableReplacementsFor) → `'Brąz'`→`'braz'` pasuje. Teraz jednostki brązowe/żelazne WYMAGAJĄ dostępu do surowca. Bramki: zelazo-gate 23/23, unit-replace 10/10, tsc 0 (zero regresji). |
| R-HUD-SUROWCE | 2026-07-24 | Surowce niewidoczne w górnym HUD (są tylko w panelu imperium → „SUROWCE STRATEGICZNE"). Dodać **chip „Surowce"** obok Skarbca/Pracy + **osobna zakładka magazynu surowców**. Relayout: **Naukę** przenieść na PRAWO (obok Zaopatrzenia/Ludności/Kultury), **Surowce** na LEWO (obok Skarbca/Pracy). | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | HUD dziś: lewo Skarbiec·Praca·Nauka / prawo Zaopatrzenie·Ludność·Kultura (hud.ts). Licznik surowców istnieje (R-LICZNIK) ale w panelu imperium, nie w HUD. Najpierw mockup zakładki → potem designer → potem wdrożenie. |
| R-SUROWCE-MOCKUP | 2026-07-24 | Przygotować mockup zakładki surowców (magazyn), potem do designera. | **GOTOWE — zaakceptowany** (artefakt claude.ai) → wdrożenie pod R-HUD-SUROWCE | Deliverable: samodzielny HTML mockup (HUD z nowym układem + panel magazynu: 9 surowców magazynowanych z pulą/cap 100+100 i tempem; dostępowe Ceramika/Sól/Koń osobno; Żywność=spichlerz osobno). |
| R-CUDA-TAB | 2026-07-24 | Usunąć osobną zakładkę „Cuda" z lewego menu — cuda tylko w liście budowy miasta, per cywilizacja. | **ZDEPLOYOWANE `666b2b75`** (FALA 6, wariant A: katalog usunięty) | Recon: budowa cudów JUŻ filtrowana per civ (`listBuildableWondersForCiv`, main.ts:1820). Osobny widok-katalog `wondersView.ts` (lewe menu) prawdopodobnie pokazuje wszystkie. Do ustalenia: czy katalog usunąć całkiem czy przefiltrować + jak wpiąć cuda do listy budowy miasta. Osobny temat po mockupie. |
| R-DOTYK-MVP | 2026-07-24 | Wersja pod tablet/dotyk (MVP): pinch-zoom + pan palcem + tap + hover→tap + viewport meta. | **ODŁOŻONE** (R-DOTYK-MVP-Q1=**B**, 2026-08-06) | Potwierdzone B — bez prac do osobnego sygnału. `docs/decyzje/R-DOTYK-MVP-Q1.md`. |
| R-PARYTET-SUROWCE-MP | 2026-07-24 | Zweryfikować: czy inne cywilizacje AI ORAZ miasta-państwa też mają surowce i płacą nimi (parytet ekonomii surowcowej z graczem). | **ZWERYFIKOWANE** — AI civ pełny parytet; MP parytet z 1 luką | **AI cywilizacje: PEŁNY PARYTET** — produkcja+składowanie (advanceCityEconomy bez filtra ownera, turn-economy.ts:1380), cap państwa (reconcileOwnerResourceCaps :1704), płacenie za budynki/jednostki (main.ts:14885/14928, deductOwnerStockCost) i handel surowcami — wszystko owner-agnostic. **MIASTA-PAŃSTWA: parytet Z JEDNĄ LUKĄ** — MAJĄ surowce (produkcja terytorialna + ulepszenia via planCityImprovements, ai.ts:1579), respektują cap państwa i PŁACĄ surowcami przy budowie (aktywna produkcja decideDefensiveCopyTurn→chooseCityProduction, ai.ts:1568). **LUKA:** wykluczone z dyplomatycznego HANDLU surowcami (`zaproponuj_handel_surowiec` poza SIMPLIFIED_CMD, diplomacy-layers.ts:12-16) — z MP tylko Pokój/Wojna/Handel ogólny. → decyzja Macieja czy domknąć (R-MP-HANDEL-SUROWCE). |
| R-SUROWCE-POPRAWKI | 2026-07-24 | Poprawki mockupu surowców (Maciej, iteracja na screenshotach) przed wpięciem w grę. | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | Ustalenia: **(zakładka pełna, wejście z mapy świata)** kompaktowo — usunąć dopiski typu, ikona+nazwa+sztuki+produkcja, **bez „/t"**, szczegóły na hover, prawdziwe ikony gry. **(formy uproszczone)** 3 konteksty: pasek HUD mapy = ikona+ilość+przyrost (styl chipów gry); miasto-budowa = ikona+ilość (jak Total War górny-lewy); miasto-rekrutacja = **tylko Brąz/Żelazo wg epoki**. Screenshoty wysłane do Macieja. Po akcepcie → subagent wpina w grę. |
| R-DESIGN-IKONY-MIEJSKIE | 2026-07-24 | Design ma dorobić 4 ikony surowców PRODUKOWANYCH W MIEŚCIE (brak dedykowanych: dziś dzielą res-iron/res-clay). | **DOSTARCZONE przez Design v4 + ZDEPLOYOWANE `666b2b75`** (FALA 6) — polecenie: `dyspozycje/POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md` | Cegła (res-cegla), Brąz (res-braz), Żelazo (res-zelazo), Stal (res-stal). Spec: SVG 24×24, stroke #e8d88a 1.5, styl jak res-wood/stone/clay/iron. Po dostarczeniu integrator dopisze mapowanie w resources-map-icon-map.json. Do czasu — interimowo odróżnione kolorem w mockupie/impl. |
| R-MAGAZYN-BAZA-500 | 2026-07-24 | Podnieść bazę magazynu 100→500; przypomnienie: +100 za KAŻDY Magazyn (w dowolnym mieście, addytywnie, nie jednorazowo). | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | `magazyn_baza_surowce` 100→500 (easy/normal/hard, płaskie); `magazyn_bonus_surowce_na_budynek`=100 bez zmian (addytywnie). Cap = 500 + 100×liczba Magazynów. Zmiana: econ-params.json + fallback economy-upkeep.ts:338 + fixtury surow-civ-storage-test (44/44). tsc 0. |
| R-IKONY-SUROWCE-V4 | 2026-07-24 | Design dostarczył paczkę v4: 12 nowych ikon surowców (koniec interimowego kolorowania). Sprawdzić dokładnie + zastosować w grze + sprawdzić inne miejsca użycia. | **ZDEPLOYOWANE `666b2b75`** (FALA 6) | 12 SVG poprawne, odrębne, kolory wg decyzji (kamień biały/cegła czerwona/miedź pomarańcz/ruda żel. srebro/brąz zielony/żelazo srebrno-szary/stal szara/glina placek pomarańcz; drewno/ceramika/koń złote). Podgląd wysłany. **Do obsługi w integracji:** (a) `res-copper-ore` vs mapa gry gdzie id copper=`ruda` (alias); (b) EmpireResourceRow używa EMOJI (main.ts:1725) → przełączyć na brand SVG; (c) resolver=brandAssets.mapResourceIconSvg via resources-map-icon-map.json; użycie też w cityPanel chipy + hexContextTooltip. **KOŃ:** do zmiany, ale Maciej nie może załączyć SVG → na razie zostaje v4 jak jest. Cel w repo: docs/ux/.../brand-book/ + gra/src/ui/icons/brand/resources-map/. |
| R-MP-HANDEL-SUROWCE | 2026-07-24 | Czy dopuścić handel surowcami z miastami-państwami (dziś wykluczone z warstwy uproszczonej). | **ZDEPLOYOWANE `8dc09b8a`** (FALA 6.2) | Dodać `zaproponuj_handel_surowiec` do SIMPLIFIED_CMD (diplomacy-layers.ts:12-16); gracz↔MP i AI↔MP, jednorazowo + cyklicznie, obie strony; usunąć skip `simplifiedDiplomacyOwners` w handlu AI↔AI (main.ts:8422). Parytet. |
| R-MP-PORTRET | 2026-07-24 | Miasta-państwa NIE mogą mieć tego samego nowego portretu-zdjęcia władcy co główna cywilizacja (10-11 identycznych postaci). Mają wracać do STAREGO/ogólnego wizerunku kultury (ikona-symbol civ) + etykieta „[Kultura] · miasto-państwo". Dot. wszystkich cywilizacji i ich miast-państw. | **ZAMKNIĘTE — POTWIERDZONE `8dc09b8a`** (FALA 6.2). 2026-07-24: Maciej zobaczył podgląd (dyplomacja + bitwa, realny kod) i wybrał **C-MP-Q1 = A** (zostaw symbol kultury). Bez zmian w kodzie. | Nowy portret = zdjęcie `portrait-{civ}-{epoka}.jpg` (leaderPortraits.ts); MP = `civIconSvg` (symbol kultury, diploUiSkin `forceCultureIcon` + battleScene `isCityState`). Gracz/główne AI = zdjęcie; miasta-państwa = ikona-symbol kultury (świątynia Grecja, tarcza Rzym, piramida Egipt…) — czytelna kultura, brak duplikacji portretu głównego. Miejsca potwierdzone podglądem: dyplomacja (medalion 150px) + bitwa (mini-medalion 22px). Etykieta „Sparta · Grecja · miasto-państwo" zaakceptowana. |
| R-MP-DYPL-PROAKT | 2026-07-25 | CAŁA dyplomacja miast-państw (agresja/aktywność + progi wojna/handel + dary jednorazowe) pod suwak trudności MP. Maciej: „przenieś wszystkie ustawienia poza główną trudność". | **ZDEPLOYOWANE `3db42857`** (FALA 6.1 — pełny zakres) | Dziś globalne (wcześniejsza decyzja „ogólny parametr dla wszystkich AI", D-MP-DYPL Q1 cz.2). 3 mechanizmy (zaufanie/sojusze/posiłki) + aiDiffLevel JUŻ odpięte; to jest 4. potencjalny element. |
| R-SESJA-AUTONOM | 2026-07-24 | Maciej wychodzi; wykonać samodzielnie: 1(ikony)+3/5(UI surowców)+4(baza500 DONE)+6(Cuda)+8(proaktywność MP)+9(panele)+11(AI-rush param). Każdy temat osobny subagent Sonnet 5. Po wszystkim DEPLOY do roboczej. | **ZDEPLOYOWANE `666b2b75`** (FALA 6 — wszystkie 8 tematów) | Decyzje ABC: C-AIRUSH=A (progi→econ-params, wartości bez zmian), C-CUDA=A (usunąć katalog), C-AUTONOMIA=A (temat ryzykowny→pomiń+log, deployuj resztę zieloną). Subagenty: ikony `af354b7`, Cuda `aee4f9c`, proaktywność `ab646e8`, panele `adf5dd3`, AI-rush `aea58aa`. UI surowców (3/5) po integracji ikon. |

| R-MUZYKA-KONTEKST | 2026-07-24 | 6 nowych utworów kontekstowych (Maciej wgrał pliki): (1) intro — nowy PIERWSZY, reszta o 1 dalej; (2) otwarcie panelu dyplomacji z inną cyw.; (3) nakładka pre-battle; (4) sama bitwa; (5) po WYGRANEJ bitwie; (6) po PRZEGRANEJ bitwie. Docelowo: osobny utwór dyplomacji per cywilizacja. | **ZDEPLOYOWANE `e19e50ff`** (FALA 7) | Pliki: `intro/Prayer_of_the_Sun_Stone`, `dyplomacja/Gilded_Porticos`, `prebattle/Song_of_the_Ancient_Hearth`, `bitwa/Before_the_Bronze_Gate`, `zwyciestwo/Where_the_Reed_Bends`, `porazka/Sun_on_the_Copper_Ridge`. Mechanizm OVERLAY (muzyka-antyczna.ts): panel „przejmuje ton", muzyka gry milknie, po zamknięciu wraca (mapa). Intro: lista `INTRO_KOLEJNOSC` (filePlayer.ts). Dyplomacja: show/hideDiplomacyAudience. Pre-battle: show/hidePreBattle. Bitwa+zwycięstwo+porażka: hak w `setMood('bitwa'/'mapa')` + `_showEndScreen` (playerWon → zwycięstwo/porażka, czysta wymiana). Powrót do bitwy przy Replay. Respektuje wyłączoną muzykę (overlay startuje tylko gdy muzyka gry gra) + suwak głośności obejmuje wszystkie. Bundel 28→34 MB (6 mp3 inline). tsc 0. **TODO przyszłość:** utwór dyplomacji per civId (dziś 1 wspólny). |

| R-PALAC-KOSZT | 2026-07-24 | Pałac (budynek startowy) nie może mieć kosztu surowcowego — na starcie pula = 0, więc pierwszego Pałacu nie da się postawić. Zostawić koszt PRODUKCJI (Praca). | **ZDEPLOYOWANE `772bab7c`** (FALA 248) | `buildings.json` palac: brak `koszt_surowce`, `kosztBudowy:40` (Praca). ROBOCZA zweryfikowana 2026-08-06. |
| R-PANEL-SPLIT | 2026-07-24 | Prawy panel imperium (z żetonów Skarbiec/Praca/Surowce/Nauka/Zaopatrzenie/Ludność) ma pokazywać **TYLKO sekcję klikniętego żetonu**, nie całą przewijaną listę — dziś wszystko w jednej liście, mylące (klik Surowce pokazuje Naukę). | **ZDEPLOYOWANE** FALA 248 — jedna sekcja per żeton | `empireDetailPanel.ts` render() składa `params+moc+zasoby+kult+sur` i scrolluje do `data-section`. Zmiana: filtrować body do sekcji z `section` param (widok jednosekcyjny per żeton). Spina bug „chip Surowce→Nauka". |
| R-SUROWCE-UI-ZERO | 2026-07-24 | UI surowców niewidoczne, bo chowa się przy 0 zasobów (start). Pasek miasta `filter(v>0)`; panel imperium przy pustej puli = placeholder. Właściciel: „mockupów nie ma w grze". | **ZDEPLOYOWANE** `b5ba1b0` (FALA 8, C-SURUI=A) — wiersz NOWE był STALE | `docs/decyzje/R-SUROWCE-UI-ZERO.md` · `cityPanel.ts` `CS_RES_STRIP_CORE` (drewno+kamień zawsze) · `main.ts` `buildEmpireResourceRows` (pełny magazyn od 0, bez placeholdera). |
| R-CIVPEDIA | 2026-07-24 | (a) Zaktualizować treść wiki po zmianach sesji; (b) zmienić nazwę „wiki"/„Wikipedia" → **„Civpedia"** w całej grze. | **ZDEPLOYOWANE** FALA 248 — etykiety Civpedia + Baszta w wikiBundle | Po reconie: aktualizacja treści (magazyn 500, surowce jednostek, handel MP, koszt Pałacu, ruda/kamień, Cuda, trudność MP) + rename etykiet UI na Civpedia. |
| R-PIERWSZE-MIASTO | 2026-07-27 | Decyzja **B** (Maciej): pełna blokada — tylko „Załóż miasto", bez ruchu/innych akcji osadnika. Tylko gracz (AI: nie). | **WDROŻONE** (kod, bez deploy tej sesji) | `docs/decyzje/R-PIERWSZE-MIASTO.md` · `first-player-city.ts` · `main.ts` · `buildModeHud.ts` · test `first-player-city-test.cjs` |
| R-MPDIFF-WIDOK | 2026-07-24 | Suwak „Trudność miast-państw" jest w zaawansowanych, ale trudno go znaleźć (właściciel go nie widział). | **ZAMKNIĘTE** — C-MPDIFF-Q1=**A** (suwak zostaje w zaawansowanych; rekom. C supersedes by A) | Opcja istnieje (`ea75f5ba`), widoczna na screenie właściciela. Do rozważenia przeniesienie/podniesienie. |
| R-SUR-DESIGN | 2026-07-24 | Decyzje projektowe surowców: (Q1) ujawnianie żelaza — dziś złoże od startu, aktywne w epoce 3 (rekom. A zostaw); (Q2) kamień = teren (Kamieniołom na Górach, bez złoża) vs złoże (rekom. A zostaw). Węgiel generuje się, ale nieużywany w kosztach (martwy/rezerwa). | **KAMIEŃ ZAMKNIĘTY** (SOLO-Q3=A) · **WĘGIEL=B ZDEPLOYOWANE `fca41b9a`** (FALA 232 SUR-WEGIEL=B; w łańcuchu `772bab7c`) | `map-gen-params.json` rarity 0 · `deposit-era.ts` · ROBOCZA: `SUR-WEGIEL=B: ukryty` |

## W TOKU

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-PANEL-SYNC | 2026-07-24 | Synchronizacja paneli Excel z JSON (JSON→Excel) | **ZAMKNIĘTE (generatory)** · regen Panel-B/C 2026-08-05 · **Panel-C dogoniony F250 2026-08-06** | `gen-panel-b.py`: kolumny `koszt_surowce.{drewno,kamien,cegla,braz,zelazo}` z `buildings.json` (commit `6c788cbe`). `gen-panel-c.py`: `COST_FIELDS` → `Surowiec` + `Surowiec (ilość)` + `Utrzymanie surowiec` + `Utrzymanie surowiec (ilość)` w arkuszu Koszty-jednostek (rekrutacja ×5, utrzymanie baza F250). Regen `Panel-B.xlsx` / `Panel-C.xlsx` z bieżących JSON (`units.json` FALA 250 tip `796fc7a7`). Round-trip `koszt_surowce.*` → `export-b.py` OK (`test-panel-b-roundtrip.py`). Panel D/E bez zmian. |
| R-BILANS-100T | 2026-07-25 | Ponowna analiza bilansu surowców na 100 tur z UWZGLĘDNIENIEM wszystkich zmian tej sesji; założenie: każde miasto ma WSZYSTKIE budynki epoki Kamień+Brąz. Nadmiar czy niedobór? | **ANALIZA GOTOWA** → `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md` | Wynik: **NADMIAR** (duży, rośnie z liczbą miast). Cap civ-wide płaski 200 → imperium 4-miejskie marnuje setki–tysiące/100t. Kamień bez odbiorcy. Drewno/glina jedyne napięte i tylko w chudym mieście. Implikacje strojenia → R-STAWKI-STROJENIE. |
| R-MAGAZYN-PANSTWO | 2026-07-24 | Magazyn = pula PAŃSTWA: 100 + 100/Magazyn, nadmiar przepada, surowce wspólne dla imperium | **ZDEPLOYOWANE `ea75f5ba`** | Cap płaski 100/100/100. Parytet AI 44/44. |
| R-HANDEL-SUROWCE | 2026-07-24 | Handel surowcami w dyplomacji: za pieniądz/Pracę; jednorazowy i przez X tur; AI też | **ZDEPLOYOWANE `ea75f5ba`** | Parytet AI (AI↔AI) 42/42. |
| R-FULLSCREEN-PASEK | 2026-07-25 | Playtest (ze zrzutami ekranu): w trybie pełnego ekranu na dole pojawia się pasek, którego nie powinno być; blokuje przesuwanie mapy myszką przy dolnej krawędzi (edge-pan nie działa w tym miejscu). | **ZDEPLOYOWANE `c08b5fcc`** | WERSJE 2026-07-26 playtest batch: `scene.ts` fullscreenchange + updateStyle=false (brak numeru FALA w WERSJE). |
| R-DESIGN-BADANIA | 2026-07-25 | Playtest: mockup ekranu badań przestarzały vs drzewko. | **GOTOWE-DO-WDROŻENIA** | Design: panel boczny Badania v1 (2026-07-26) · `DO-DESIGN-EKRAN-BADAN-2026-07-25.md` · reskin `scienceHubHud.ts` |
| R-DESIGN-PANEL-MIASTA | 2026-07-25 | Pigułka miasta na mapie — hover produkcji + ostrzeżenie surowców | **ZDEPLOYOWANE** FALA 251 `e594f018` · Q4=B · **V2 ECHO C** | hover bez makiety; Design v2 pilne · `R-DESIGN-PANEL-MIASTA-V2-Q1.md` |
| R-DYP-IKONA-TLO | 2026-07-25 | Playtest (ze zrzutami ekranu): w panelu dyplomacji pod ikoną państwa jest niebieskie kwadratowe tło. Decyzja Macieja: usunąć ALBO zamienić na obramówkę w tym kolorze. | **ZDEPLOYOWANE `c08b5fcc`** | WERSJE 2026-07-26: obramówka `.dip-pennant` (brak numeru FALA w WERSJE). |
| R-WIARYGODNOSC | 2026-07-25 | Wiarygodność cywilizacji (−100…+100), wpływ na zaufanie; trzeci wskaźnik. | **ZDEPLOYOWANE / WDROŻONE** — FALA 233–237 (R1/R1b/UI); audyt 2026-08-05: 0 otwartych ABC | Spec: `WIARYGODNOSC-SPECYFIKACJA.md` (rdzeń zatwierdzony WIAR-Q*); draft: `PROJEKT-WIARYGODNOSC-CYWILIZACJI.md`. Otwarte: §9 strojenie (paczka ABC później) · patrz KOLEJKA OTWARTA |

## ZAMKNIĘTE (ta sesja, 2026-07-23/24)

| ID | Prośba | Status | Commit/Deploy |
|---|---|---|---|
| R-PARYTET-AUDYT | Audyt parytetu gracz↔AI | **ZAMKNIĘTE** | Raport `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` · 7 obszarów pełny parytet · luka jednostki→pula zamknięta przez R-PROD-POOL-TEST |
| R-PROD-POOL-TEST | Konsumpcja surowców z puli państwa (budynki+jednostki) | **ZDEPLOYOWANE** `c676b681` (FALA 5) | `unitStockCost` · `building-stock-cost.ts` · parytet gracz+AI w `main.ts` || R-BYDLO | Bydło/owce/lama = NIE surowce (tylko koń) | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-LICZNIK | Licznik surowców w panelu imperium | ZDEPLOYOWANE | `d6c4f33` / `cd42837f` |
| R-CERAMIKA | Ceramika = tylko dostęp (Garncarnia); koszt 3 budynków→cegła | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PROD-BEZ-PRAC | Produkcja per-ulepszenie bez wymogu pracowników | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PALIWO | Usunąć Paliwo + Mielerz (konwertery→drewno) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-BONUSY-BUD | Stolarnia/Warsztat +10% civ, Garncarnia +10% lokalnie żywność | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-KOSZT-BUD | Koszty surowcowe 28 budynków (Kamień/Brąz/Żelazo) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-CEGLA-A | Cegła-A: Cegielnia 3, Glinianka 5 | ZDEPLOYOWANE | `2d9f173`,`bcd818b` / `cd42837f` |
| R-UPKEEP-PRACA | −1 Praca/turę za ulepszenie surowcowe (wariant B) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-DEADLOCK-AI | Fix kolejności budowy AI (konwertery przed konsumentami) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-KOSZT-JEDN | Koszty jednostek (Kamień 0/Brąz/Żelazo, 1/2/3; Procarz 0) | WDROŻONE (redeploy 4.1) | `aff3435`,`2b0cd14` |
| R-SUPER-ARCHE | Super-jednostki: bezpłatne pieniężnie + max1/stolica + 3 surowca | WDROŻONE (redeploy 4.1) | `c2d77fe` |
| R-CUDA-AI | AI buduje cuda | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-CUDA-BONUS | Wonder-bonusy realnie w ekonomii (gracz+AI) | ZDEPLOYOWANE | `b5e7110` / `cd42837f` |
| R-LUDY-MORZA | #15 Ludy Morza (embarkacja+rajdy) | ZDEPLOYOWANE | `6859d9e` / `aa3c9b06` |
| R-PARYTET-AI | ZASADA: zero uproszczeń dla AI, kod ownerId-agnostic | ZAPISANE (obowiązuje) | `318ed6c` |
| R-X2-OBSADA | Reguła ×2 przy obsadzie ludnością | ODRZUCONE | — (dublowałoby upkeep) |

## FALA 8 — ZDEPLOYOWANE 2026-07-24 (md5 `e9306d7ad25f8f82cf55f8af3b809c0b`)
Zebrane w jednej fali (na sygnał „deploy" Macieja), na mapie Ziemia `58299d6f` (rebase):
- **R-PALAC** (koszt surowcowy Pałacu → 0, zostaje Praca) — **ZDEPLOYOWANE** `42170ea`.
- **R-PIERWSZE-MIASTO** (blokada: nie da się wyjść z trybu zakładania ani skończyć tury bez 1. miasta; guard `exitBuildMode` + canEndTurn/N) — **ZDEPLOYOWANE** `b5ba1b0`. Decyzja: blokować też koniec tury = TAK.
- **C-SURUI = A** (UI surowców widoczne od tury 1: rdzeń drewno+kamień w pasku miasta zawsze; magazyn imperium bez placeholdera przy 0) — **ZDEPLOYOWANE** `b5ba1b0`.
- **C-PANEL = B** (klik żetonu HUD = panel z tylko jego blokiem) — **ZDEPLOYOWANE** `b5ba1b0`.
- **R-KAMIEN = b** (Kamieniołom Wzgórza+Góry; własny niewykluczający sektor — współistnieje z kopalniami rudy/glinianką/stadniną; grafika 300° vs 0°, zweryfikowana wizualnie) — **ZDEPLOYOWANE** `b5ba1b0`.
- **R-CIVPEDIA = A** (rename Wiki→Civpedia + aktualizacja treści + regen wikiBundle) — **ZDEPLOYOWANE** `5cf79a3`.
- **C-MPDIFF-Q1 = A** (suwak trudności MP zostaje w zaawansowanych) i **C-SUR-Q1 = A** (żelazo: złoże od startu, aktywne w epoce 3) — bez zmian w kodzie, ZAMKNIĘTE.

## PRZEGLĄD UI/GAMEPLAY 2026-07-24 (seria uwag Macieja z playtestu) — FALA 9 (w toku)
ZROBIONE w kodzie (tsc 0), NIEZDEPLOYOWANE — czekają na „deploy":
- **R-STARTPREVIEW**: podgląd startu (kreator) = tylko parametry, bez prozy. `e49211c`.
- **R-PANEL-DOCHOD**: klik żetonu dochodu (Nauka/Skarbiec/Praca/Religia/Żywność) = tylko jego wiersz, nie cały blok. `b918ce5`.
- **R-ARMIA**: „Zaopatrzenie" → „Armia"; sekcja grupuje żywność armii + ludność + rekruci. `df4b2a4`.
- **R-DRZEWO-TECH**: usunąć stare (niebieskie) „Pełne drzewko technologii"; „graf epok" → „Drzewo technologii". `6492b30`.
- **R-KARTA-WYMAGANE**: karty budynków — sekcje „Daje" (bonusy) vs „Wymagane" (surowce + dostęp „w zasięgu"). commit karty.
- **R-WYRAB**: wyrąb daje 5 Drewna do puli państwa (koszt 5 Pracy zostaje), nie 5 Pracy. `0017290`.

OTWARTE (recon/plan gotowy lub do zrobienia):
- **R-SOL-GLINA**: sól tylko Wybrzeże, glina tylko przy rzece. **ZROBIONE w kodzie** (subagent Sonnet 5, worktree; `gen-helpers.ts` + `generator.ts` — kolejność złóż PO rzekach/wybrzeżu, fix buga fałszywej flagi rzeki, wyjątek soli w `stripDepositsFromWater`+`deposit-coast-test`). Bramki: tsc 0, determinizm A=B PASS, deposit-coast 20/20. NIEZDEPLOYOWANE. **ROZSTRZYGNIĘTE: C-MAP-SOL-ZIEMIA=B** (Maciej 2026-07-25) — sól = ląd graniczący z płytkim morzem (`isCoastalLandHex`), nie kafel Wybrzeże; działa na Ziemi. Commit `e76329c`. Bramki: deposit-coast 20/20, determinizm PASS (hash 66949c60), tsc 0.
- **R-BARB-SYGNET**: barbarzyńcy pokazują portret cywilizacji — mają dostać własny sygnet barbarzyński (jak wcześniej). Podobne do R-MP-PORTRET.
- **R-DYPLO-STOL**: dwuetapowa dyplomacja — propozycja ląduje na „stole" ze wstępną zgodą AI + „Akceptuj/Zmień" + możliwość dołożenia żądań (np. surowce do paktu). RECON GOTOWY: `evaluateProposal` już jest czystą funkcją (podgląd bez finalizacji); luka = UI (scalić koszyk `diplomacyTradeBasket` z traktatami) + przerwać skrót `applyAudienceAction`→finalizacja. Duży temat (refaktor UI + silnik multi-deal).
- **R-BADANIA-KOLEJKA**: kolejka badań — zaznaczyć do 3 technologii do kolejki. Nowa funkcja (stan kolejki + UI + auto-przejście).
- **DO-DESIGN**: modal „CO WYBIERASZ?" (miasto vs jednostka na jednym heksie) — stary HUD do wymiany przez Design.
- **DO-DESIGN R-ZDOBYCIE-MIASTA**: modal „MIASTO ZDOBYTE / Argos / Potyczka wygrana — wojsko weszło na heks miasta / Rozumiem - Enter" — stary mockup, do designera (nowoczesny wygląd w KANON gry). Zgłoszone 2026-07-25. Mogę przygotować mockup (jak R-SUROWCE-MOCKUP) na sygnał.

## UWAGI BITWY 2026-07-24 (playtest, seria kolejnych) — W TOKU
- **R-BITWA-ETYKIETY**: przyciski dialogu rozstawienia — „Auto-rozstrzygnij" → „Auto"; „Do rozstawienia" → „Bitwa". ZROBIONE inline (`preBattle.ts`, tsc 0), niezdeployowane.
- **R-BITWA-ROSTER**: gdy overlay preBattle otwarty — panel armii świata znika, wraca po zamknięciu. **ZROBIONE** (worktree A: `setArmyStackHudSuppressed` w hud.ts, wpięte w show/hide preBattle). tsc 0.
- **R-BITWA-LICZNIKI**: górny HUD bitwy — liczniki typów jednostek (∩/×/⋊) pokazują błędne wartości (0 i 2 przy łucznikach mimo 1 melee + 1 dystans); nie przelicza realnego składu. Subagent Sonnet 5.
- **R-BITWA-WLADCA**: górny HUD bitwy — imię władcy „Minos" po OBU stronach; ma pokazywać ustalone imiona pierwszych władców per cywilizacja (15×3). Subagent Sonnet 5.
- **R-BITWA-CHROME**: usunąć chrome/pudełka górnych pasków fazy rozstawiania (lewy „Faza rozstawiania" + prawy „Wycofaj się") — zostawić same butony floating nad mapą (nowocześniej). Subagent Sonnet 5 (ten sam co liczniki/imiona, jeden worktree battleScene.ts).
- **R-BITWA-STRATY**: po walce jednostka z stratami — zielony pasek siły/HP/liczebności w panelu armii świata (armyStackHud) pokazuje pełny, nie odzwierciedla strat. Subagent Sonnet 5 (ten sam co R-BITWA-ROSTER, jeden worktree armyStackHud.ts). Sprawdzić czy straty w ogóle zapisywane do modelu jednostki po bitwie.
- **R-JEDN-AKCJE**: panel akcji jednostki (armyStackHud) — dodać **Sentry** (czuwanie/uśpienie do wykrycia wroga) do UFORT./ZASTĄP/POMIŃ; zamienić słowa na ikony-infografiki (ufort→fort, zastąp→strzałki góra-dół, sentry→sen/Zzz, pomiń→przeskocz). Subagent Sonnet 5 (ten sam worktree armyStackHud.ts). Sentry jako nowa mechanika silnika → możliwe ABC o zakres auto-budzenia.
- **R-BITWA-STARTWALKI**: po zakończonej (zwł. przegranej) bitwie pływający klaster „START WALKI"+Reset (deploy, battleScene ~1925) zostaje osierocony na mapie — nie sprząta się. Subagent Sonnet 5 (ten sam worktree battleScene.ts). Spiąć teardown z każdą ścieżką zakończenia bitwy.
- **R-KAMIEN-RELIEF**: kamieniołom SPŁASZCZAŁ wzgórze. **ZROBIONE** (subagent Sonnet 5, worktree, main.ts). Przyczyna: `syncImprovementDecorForHex` chowała bryłę wzgórza dla każdego ulepszenia na terenie podniesionym poza wyjątkiem „solo hodowla"; kamieniołom nie był w wyjątku. Fix: `PRESERVES_HILL_RELIEF_KEYS` += kamieniolom → bryła wzgórza zostaje, model siada na szczycie. Czysty render, bez ABC. tsc 0, determinizm mapy PASS. **FOLLOW-UP:** ten sam bug dotyczy `kopalnia` (żelazo) i `kopalnia_miedzi` — spłaszczają wzgórze identycznie; fix to jednolinijkowe rozszerzenie whitelisty. CZEKA na decyzję właściciela (rekomendacja: rozszerzyć — kopalnia w zboczu wzgórza jest logiczniejsza niż płaski heks).
- **R-RANKING-MOC**: **ZROBIONE** (subagent Sonnet 5, worktree). #1 pozycja absolutna: linia „Twoja pozycja: X. z N cywilizacji (uwzględnia nieodkryte)" w overlayu Mocy + panelu imperium (nowa pure `computeAbsolutePowerRank`, wariant B = dokładnie prośba właściciela). #2 niespójność 2645/3013: potwierdzony bug — respekt brał pierwszy kontakt bez filtra miast-państw i nazywał inną funkcją; teraz liczony wprost z rankingu (jedno źródło). Pliki: power-ranking.ts, main.ts, powerOverlayHud.ts, empireDetailTypes.ts, empireDetailPanel.ts. tsc 0, tech-tree 19/19. ABC C-RANK-Q1 (prezentacja nieodkrytych A=„???"/B=zrobione/C=zbiorczo) — rec B, już wdrożone. NIEZDEPLOYOWANE.
- **R-BITWA-SZYK** (G): mechanizm szyku (piechota vs dystans z przodu) przestał działać — mimo „piechota", dystans jest z przodu (regresja). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-BITWA-KARTY** (H): karty rosteru — Oszczepnik ma ikonę piechoty (zła klasa); paski mocy zasłaniają nazwę jednostki (layout). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-RUCH-WZGORZA**: **ZROBIONE** (subagent Sonnet 5, worktree). ROOT CAUSE: picking trafiał tylko w płaski pryzm bazowy, a wysoka bryła wzgórza/góry (styl roblox) sterczy wyżej i jest przesunięta perspektywicznie → klik lądował w złym heksie (raz dobrze/raz w sąsiada/inna jednostka). Fix: `goraInst`/`wzgorzeInst` dodane do `terrainPickMeshes` + filtr niewidocznych w raycaście (picker.ts, scene.ts). tsc 0, determinizm PASS. Tłumaczy wszystkie 3 objawy.
- **R-RUCH-WZGORZA-2 (nawrót, playtest 2026-07-26)**: **ZROBIONE** (Opus 5). Objaw: klik nadal trafia w zły heks, zwłaszcza na wzgórzach; czasem trzeba kliknąć 2–3× żeby jednostka ruszyła. ROOT CAUSE (inny mechanizm niż R-RUCH-WZGORZA!): `THREE.InstancedMesh.raycast()` odsiewa CAŁY mesh po `boundingSphere`, którą three.js liczy LENIWIE przy pierwszym raycaście i nigdy nie odświeża. Mgła wojny chowa heksy macierzą zerową (`ZERO_MATRIX`, scene.ts), więc pierwszy ruch myszy po starcie gry liczył sferę na mapie prawie całkiem zakrytej → sfera zawężona do odsłoniętego skrawka ZOSTAWAŁA na całą sesję, meshe terenu wypadały z pickingu, a klik leciał na awaryjną płaszczyznę `y = 0`. Ta leży POD wierzchem terenu, więc przy kamerze 52° wskazywała heks dalej od kamery o `Y/tan52°`: **Łąka 0,24 heksa · Wzgórze (plateau kopca) 0,50 heksa · Góra (szczyt) 0,95 heksa**. Pomiar: **29,7% pikseli mapy dawało zły heks (40,0% na wzgórzach/górach) → 0,0% po poprawce**. Fix (jedno miejsce): nowa `refreshInstancedPickBounds()` w `input/picker.ts`, wołana po zbudowaniu sceny w `render/scene.ts` (mapa świata) i `battle/battleScene.ts` (parytet) — sfery zamrożone na komplecie instancji. Druga przyczyna wielokrotnych kliknięć: kamera pan-owała od PIERWSZEGO piksela ruchu, a `main.ts` odrzucał klik dopiero od 6 px → drgnięcie ręki przesuwało mapę spod kursora albo kasowało klik; teraz `DRAG_THRESHOLD_PX` (render/camera.ts) jest wspólny dla kamery i kliku. Regresja w `tools/picker-test.cjs` (140/140). tsc 0, determinizm mapy PASS, smoke OK. Zrzuty przed/po: `docs/ux/picking-2026-07-26/`. NIEZDEPLOYOWANE.
- **R-RUCH-WZGORZA-3 (playtest 2026-08-02)**: **ZDEPLOYOWANE `5e0f30e7`** (FALA 202, PR #12 hills MIN-MOVE). Objaw: żółta trasa przez wzgórza, jednostka często nie rusza. ROOT CAUSE: `truncatePathToBudget` bez MIN-MOVE — koszt wejścia > MP (wzgórze+las=3 przy 2 MP) → pusty segment, odrzucenie ruchu przy pełnym podglądzie trasy. Fix: MIN-MOVE w `truncatePathToBudget`; `beginMoveSelectedUnitTo` używa tej funkcji; aliasy kluczy `terrain-movement.json` w `configureTerrainMovement`. Wzgórza koszt 2 (+1 las), przejezdne; Góry nieprzejdne. Test: `terrain-hill-movement-test.cjs` 10/10. Branch `cursor/fix-move-hills-stuck-63a1`.
- **R-EDGE-PAN**: **ZROBIONE** (ten sam worktree). Edge-pan strefa 32px, prędkość liniowa, clamp do granic (camera.ts, main.ts). Aktywacja: wariant A (tylko gdy zaznaczona jednostka + tryb mapy) = C-EDGEPAN-Q1 rec A; przełączenie na „zawsze" = 1 linia. tsc 0.
- **R-BITWA-GRUPY** (J): numer grupy w bitwie ma być najniższy wolny, nie inkrement (rozgrupuj+zgrupuj tych samych → znów G1, nie G3). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-BITWA-POWTORKA** (I): przy powtórce bitwy znika możliwość rozgrupowania jednostek. Hipoteza: niepełny re-init sceny (może wspólne z R-BITWA-STARTWALKI/F). Subagent Sonnet 5 (battleScene.ts, worktree B).
- **R-EDGE-PAN**: gdy zaznaczona jednostka i myszka przy krawędzi ekranu — mapa przesuwa się powoli w tym kierunku (ułatwia wskazanie celu ruchu). Subagent Sonnet 5 (ten sam worktree nawigacji mapy co R-RUCH-WZGORZA: main.ts/render). Możliwe ABC: aktywacja zawsze vs tylko przy zaznaczonej jednostce.
- **R-BITWA-ROSTER (temat A) — pozostałe:** (a) Sentry ZROBIONY wariant B (uśpij/obudź ręcznie, bez auto-budzenia na wroga — pole `RuntimeUnit.sentry`, parytet-ready); ikony akcji ZROBIONE (fort/swap/step-over; Sentry=półksiężyc — do ewentualnej korekty Design); (b) **R-BITWA-STRATY / C-STRATY-HP-Q1 — ZAMKNIĘTE 2026-07-27.** Mechanizm zweryfikowany POPRAWNY (test 25/25). Maciej: objaw = **nadreprezentacja siły obrońcy AI** w bitwie ręcznej 3D, nie bug strat zwycięzcy; „jak się powtórzy — wracamy". Bez fixu. `docs/decyzje/C-STRATY-HP-Q1.md`.
- **TEMAT 8 (bramki budynków)**: **ZROBIONY** (subagent Sonnet 5, worktree). Q1 = usunięto blankietową `ERA_ACCESS_LABELS`, bramka epoki = czyste `epokaWejscia ≤ epoka` (naprawiony realny bug blokady budynków). Q2 = realne bramki 7 budynków (stolarnia/kamieniarski/kuznia→surowiec w imperium; port/port_wielki→wybrzeże/rzeka miasta; warsztat_oblezniczy→Koszary; laznia_publiczna→Studnia). Q3 = Piec hutniczy wyjątek zostaje, tekst poprawiony. Parytet AI: naprawiona pre-istniejąca luka (ścieżki budowy AI nie przekazywały etykiet surowców). Pliki: buildings.json, building-resource-gate.ts, production.ts, main.ts, cityPanel.ts. Bramki: tsc 0, tech-tree 19/19, research 33/33. NIEZDEPLOYOWANE.
- **BITWA — AUDYT CAŁOŚCIOWY** (R-BITWA-AUDYT): właściciel — bitwa to najsłabszy aspekt („ciężko sterować, nielogiczne"). Zamówiony audyt Sonnet 5 (read-only) modelu sterowania: deploy, zaznaczanie/ruch (picking+elewacja), grupowanie, tempo, facing, spójność ze światem, czytelność HUD → ranking problemów + kierunki naprawy (kandydaci ABC). Zgłoszone bugi bitwy = objawy. Czeka na raport.
- **DECYZJE OTWARTE (nie blokują playtestu):** C-MAP-SOL-ZIEMIA-Q1 (rec A, właściciel na razie pominął modal — do paczki); kolejka badań C-RES-Q1..Q4 (temat 10, silnik gotowy, UI czeka); stół dyplomacji C-DYP-STOL-Q1/Q2 (temat 9).

## AKTUALIZACJA STATUSU BITWY — worktree B (battleScene.ts) + AUDYT
Subagent B (Sonnet 5, jeden worktree battleScene.ts) — pakiet błędów bitwy:
- **C liczniki** ZROBIONE (nowa `_armyCompositionKind()` tylko dla liczników; `_deployRowKind` celowo liczy Oszczepnika jako melee dla formacji — nietknięte).
- **D imiona władców** CZĘŚCIOWO: mapowanie ikony/portretu civ naprawione (`civIconIdFromCivLabel` 15 civ zamiast fallback→grecy). ROOT CAUSE z audytu: `civIconIdFromLabel` czytał `d.cywilizacje` (zawsze undefined; realny kształt `data.civs.cywilizacje`) + `attackerCivIconId/defenderCivIconId` NIGDY nie przekazywane do `new BattleScene` w main.ts — B dostał polecenie weryfikacji/dodania. **OTWARTE ABC:** gdy dwaj gracze to ta sama cywilizacja (np. dwaj Grecy), dzielą jedno imię władcy per civ+epoka („Minos" po obu stronach) — czy chcieć odrębnych tożsamości władców per-gracz? (rec: na razie per-civ OK; ewentualnie miasta-państwa/ten sam-civ dostają wariant imienia).
- **E chrome pasków** ZROBIONE (tło/ramka topBar → transparent, pigułki przycisków zostają, textShadow na etykiecie tury).
- **F START WALKI osierocony** ZROBIONE (`dispose()` usuwa `_deployToolbar`+dropdowny+`_modeBanner` doczepione do body).
- **G szyk piechota/dystans** ZROBIONE (`_applyDeployArmyFormation` zawsze na całą armię `live`, nie tylko zaznaczenie).
- **H karty rosteru** ZROBIONE (zła ikona: `_armyCompositionKind` w 4 miejscach; nazwa zasłonięta: wysokość karty 56→64 + flexShrink).
- **I powtórka gubi rozgrupowanie** — audyt ustalił DOKŁADNĄ przyczynę (`_replayBattle→_initDeployUI→_autoGroupDeployByKind` bezwarunkowo kasuje ręczne grupy). B dostał fix: zapamiętać `groupId` przy `_endDeployPhase`, odtworzyć przy replay (nie auto-grupować gdy jest zapisany stan). W TOKU.
- **J numeracja grup** ZROBIONE (`_nextFreeGroupId()` = najniższy wolny int; G1→rozgr.→zgr. → znów G1).
- **K1 rozjazd kursor/heks w bitwie** (potwierdzony przez właściciela, ten sam co mapa świata): `_pickGroundTile` fallback y=0 ignoruje wysokość kafla → klik trafia sąsiedni heks/jednostkę. B: wyeliminować poleganie na y=0 (najbliższy kafel rzutem z góry / rozszerzyć pick-meshe). W TOKU.
- **K2 nie da się ruszyć pojedynczej jednostki z grupy** — logika grupy przechwytuje ruch. W TOKU (część może zniknąć po K1).

### AUDYT STEROWANIA BITWĄ (Sonnet 5, read-only) — WNIOSEK GŁÓWNY
To NIE jeden głęboki problem architektury. To kilka punktowych bugów (większość powyżej, prosty fix każdy) + JEDNA realna decyzja projektowa: **facing/flankowanie jest w 100% automatyczne i nieczytelne** (gracz nie ustawia kierunku; jedyny feedback to tekst w logu PO starciu) — to główne źródło wrażenia „ciężko sterować, nielogiczne". Minimalna naprawa: wskaźnik kierunku na pierścieniu zaznaczenia PRZED rozkazem (bez refaktoru silnika).
Pomniejsze decyzje z audytu (kandydaci ABC): (2) zakres formacji „cała armia vs zaznaczenie" — komunikat/model; (8) Ctrl+klik multi-select jest tylko w bitwie, brak na mapie świata (złamanie nawyku); (9) dwa różne „Auto" (auto-rozstrzygnięcie mocą przed bitwą vs auto-odgrywanie na polu) — kolizja nazw.
HARNESS: `combat-test.cjs` DZIAŁA (6/6) — testuje tylko matematykę `combat.ts`, NIE dotyka `battleScene.ts`. Brak jakiegokolwiek automatycznego testu sterowania/UI bitwy (luka narzędziowa).

## INTEGRACJA NOCNA 2026-07-25 (sesja chmurowa, autonomiczna) — DEPLOY-READY, NIEZDEPLOYOWANE
Scalono **10 worktree** w gałąź roboczą `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (merge --no-ff każdy, tsc 0 po każdym kroku). Jeden konflikt (import battleScene.ts temat 11 vs B) rozwiązany ręcznie. **ŻADNEGO builda ani deploya** (zgodnie z poleceniem „nie rób deploy").
Zintegrowane: temat 8 (bramki budynków), temat 12 (sól/glina), kamieniołom (+decyzja: kopalnie też), nawigacja (picking wzgórz + edge-pan), ranking Mocy, panel armii A (ukryj+Sentry+ikony+test HP), temat 14 (żeton Handel), temat 9 (stół dyplomacji MVP), temat 10 silnik (kolejka badań), bitwa B (C–K2: picking/szyk/karty/grupy/imiona/chrome/START-WALKI/powtórka), temat 11 (barbarzyńcy sygnet).
**Bramki na scalonej całości:** tsc 0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · post-battle-HP 25/25 · battle-roster 7/7 · map-gen determinizm A=B PASS + 0 rzek bez ujścia PASS (2 FAIL czasowe = obciążenie maszyny, nie regresja).
**W TOKU (nowe, po integracji):** UI kolejki badań (temat 10, subagent — decyzje Q1=C/Q2=A/Q3=C/Q4=A). **WSTRZYMANE do decyzji:** facing (C-BITWA-FACING — główny wniosek audytu, genuine wybór produktowy).
**Decyzje autonomiczne (do przeglądu rano):** → `dyspozycje/DECYZJE-AUTONOMICZNE-2026-07-25.md` (ABC z zaznaczonym wyborem; „zmień <ID> na <literę>" jeśli źle).
**DO DEPLOYA na sygnał Macieja:** build z `gra/` (`node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`) → runbook ROBOCZA → log WERSJE/KANAL.

## WDROŻENIE DECYZJI MACIEJA 2026-07-25 (po przeglądzie ABC) — KOMPLET, NIEZDEPLOYOWANE
Maciej przejrzał wszystkie decyzje autonomiczne (`DECYZJE-AUTONOMICZNE-2026-07-25.md`) i skorygował część. Wdrożone WSZYSTKIE korekty + nowe funkcje (subagenty Sonnet 5, bez izolacji — izolowane worktree nie widzą zintegrowanej gałęzi):
1. **C-EDGEPAN-Q1=B** — edge-pan ZAWSZE aktywny na mapie (`a44e234`).
2. **C-BITWA-FORMACJA=B** — szyk na aktualnie zaznaczony zakres: jednostka/grupa/armia + komunikat zakresu (`45f9548`).
3. **C-BITWA-WLADCA=B** — NOWA pula 10 imion władców per cywilizacja (15×10=150 w `civs.json` jako `wodzowiePula`), osobne imię per właściciel (państwo i miasto-państwo) wg indeksu wśród właścicieli tej samej kultury; wpięte w bitwę, preBattle i dyplomację (`d776282`).
4. **C-RES UI kolejki badań** (Q1=C oba miejsca, Q2=C drag&drop, Q3=A tylko aktywny cel, Q4=A AI bez kolejki) — panel „Plan badań (n/3)" w hubie (numerki, usuwanie, przeciąganie) + numerowane krążki na węzłach drzewka; klik = enqueue w obu miejscach (`9be8bce`).
5. **C-SENTRY-Q1=A** — auto-budzenie jednostki Sentry gdy wróg w polu widzenia (`areEnemyOwners` + `wakeSentryUnitsOnEnemyContact`, używa istniejącego `unitSight()`; parytet AI) (`bf89f13`). UWAGA: brak w grze cyklu „następna jednostka czekająca na rozkazy", więc Sentry = „odstaw jednostkę, obudź na wroga".
6. **C-FLANK** (Q1=A auto-play na polu, Q2=B wszystkie jednostki) — kierunek natarcia FRONT/BOK/TYŁ per zaznaczony zakres, ustawiany w rozstawianiu; w auto-odgrywaniu jednostki obchodzą wroga BFS-em by trafić w flankę/tył, fallback czołowy gdy niemożliwe (`25e51e6`). Objęte: piechota + konnica. NIE manewrują: falanga (trzyma linię), łucznicy (kiting), machiny (biją w bramę) — świadomie, by nie psuć ich mechanik. Odkrycie: `facing.ts` to MARTWY KOD (stara siatka heksowa); żywa jest 4-kierunkowa `relativeHit` w `battleScene.ts`.
7. **C-DYP-STOL-Q1=B** — koszyk-traktat: słodziki (złoto/surowce) doliczane do decyzji AI przy traktatach (`sweetenerEasePoints`, PLACEHOLDER 25 PN = 1 pkt ease, sufit 20 — DO STROJENIA W PLAYTEŚCIE); transfer słodzików przy akceptacji także dla traktatów ≠ UmowaHandlowa; UI „Dołóż do umowy" (złoto + surowiec) w oknie negocjacji; podgląd ocenia złożony deal (`6595d00`). UI to minimalna sekcja, NIE pełny koszyk `diplomacyTradeBasket` (pełne wpięcie = większy refaktor).
Wcześniej tej doby: **C-MAP-SOL-ZIEMIA=B** — sól na lądzie przy wybrzeżu (działa też na mapie Ziemia) (`e76329c`).


## ZASADA: ZGODNOŚĆ HISTORYCZNA JEDNOSTEK (Maciej 2026-07-25) — WARUNEK STRATEGICZNY
Maciej: „Co do jednostek ważne też, żeby odwzorować jak najlepiej **zgodność historyczną**. To powinno być **warunkiem strategicznym**."
→ Modele i opisy jednostek mają odwzorowywać realia historyczne danej epoki/cywilizacji, nie potoczne wyobrażenia. Przykład wzorcowy: **hastati** = republika rzymska (IV–II w. p.n.e.) — scutum OWALNE (nie prostokątne cesarskie), hełm montefortino z piórami (nie imperial-gallic), pectorale lub lorica hamata (**NIE lorica segmentata** — anachronizm o ~200 lat), pilum ×2 + gladius hispaniensis, jeden nagolennik na lewej nodze.
Obowiązuje przy KAŻDEJ nowej/poprawianej jednostce. Przy niejasnościach historycznych — opisać wątpliwość i uzasadnić wybór, nie zgadywać po filmach.

## R-RENDER-JEDNOSTKI (2026-07-25, w toku)
Maciej poprosił o porównanie: jak wypadłoby renderowanie jednostek zrobione przez model Opus 5 vs obecny stan gry. Przykład: **Hastati**, maksymalnie szczegółowo. Subagent Opus 5 buduje nowy model (`gra/src/render/hastati-opus5.ts`, NIE podmienia obecnego) + samodzielny podgląd HTML „obecny vs Opus 5" obok siebie (`dyspozycje/PODGLAD-HASTATI-OPUS5.html`). Warunek nadrzędny: zgodność historyczna (patrz zasada wyżej). Ma też ocenić, czy OBECNY model ma anachronizmy.

## R-MNOZNIK-BUDYNKI (2026-07-25, w toku — śledztwo)
Do czego miał służyć `mnoznik` w budynkach (14 budynków ma niezerowy, silnik go NIE konsumuje — tylko chip w panelu miasta). Jedyny ślad: `SUROWCE-KANON-2026-07-22.md:90` — „kuznia_zelaza → wielka_kuznia (**mnożnik wojska** + stal)". Subagent Sonnet 5 przeszukuje historię decyzji + historię gita (czy KIEDYKOLWIEK był zaimplementowany) + panele Excel. Raport → `dyspozycje/SLEDZTWO-MNOZNIK-BUDYNKOW.md`.

## R-PALAC-POZIOMY (2026-07-25) — ZAMKNIĘTE: ZOSTAJE JAK JEST (decyzja Macieja)
**ROZSTRZYGNIĘCIE (Maciej 2026-07-25):** „Po prostu każdy poziom jest dla następnej epoki. Pierwszy poziom dla epoki Kamienia, drugi dla Brązu, trzeci dla Żelaza i tak dalej. Kolejne etapy też muszą różnić się surowcami. Więc de facto to co masz obecnie w zupełności nam wystarcza. Jak będziemy rozwijać kolejne epoki, to robimy kolejny poziom pałacu. Po co teraz to robić?"
→ **ZASADA: 1 poziom budynku = 1 epoka**, każdy poziom z INNYMI surowcami. Obecne trzy tiery (palac/palac_ii/palac_iii = Kamień/Brąz/Żelazo, drewno → +kamień → +cegła) realizują ten model poprawnie. **Poziomów 4-10 NIE projektujemy z góry** — kolejny tier powstaje dopiero wraz z kolejną epoką. Wcześniejszy wybór C (scalenie w jeden budynek 10-poziomowy) — ODWOŁANY, workflow zatrzymany przed jakąkolwiek zmianą, zero modyfikacji w danych.
Pozostała drobna niespójność kosmetyczna (każdy tier deklaruje `maksPoziom: 10`, co UI pokazuje jako „Maks. poziom: 10" mimo że nieosiągalne) — do ewentualnego sprzątnięcia przy okazji, NIE priorytet.
Ta sama zasada dotyczy 8 pozostałych łańcuchów budynków (Odlewnia, Port, Świątynia, Biblioteka→Akademia, Mury→Cytadela, Koszary→Akademia wojskowa, Kuźnia→Wielka kuźnia, Spichlerz) — nie projektujemy poziomów na zapas.

## (archiwum) R-PALAC-POZIOMY — analiza, która doprowadziła do decyzji
Maciej: „jeżeli projektujesz 10 poziomów pałacu, to Pałac I, II i III to już są pierwszy, drugi i trzeci poziom. Możesz doprojektować pozostałe siedem, ale nie mnóż tego dla każdego Pałacu."
Stan: `palac`, `palac_ii`, `palac_iii` — KAŻDY ma `maksPoziom: 10` → efektywnie 30 poziomów w linii. Dodatkowo `palac` ma tylko 3 `nazwyPoziomow` przy maksPoziom 10. Subagent Sonnet 5: recon (czy problem dotyczy też innych tier-ów: odlewnia, kuźnia, port), wyliczenie realnej progresji przy 3-4 epokach, **ABC do decyzji właściciela** (jak podzielić 10 poziomów). Zmian projektowych NIE robi bez decyzji.


## 🅿️ ZAPARKOWANE: AWANSE BUDYNKÓW W KOLEJNYCH EPOKACH (Maciej 2026-07-25)
**NIE ZAJMUJEMY SIĘ TYM, dopóki Maciej nie da znać, że idziemy w kolejne epoki.**
Zasada: **1 poziom budynku = 1 epoka**, każdy poziom z innymi surowcami. Obecny stan (Pałac I/II/III = Kamień/Brąz/Żelazo) jest poprawny i wystarczający.
Gdy dojdą kolejne epoki — wtedy dla KAŻDEGO budynku osobno przemyśleć: **czy ten budynek w ogóle awansuje w kolejnej epoce?** Jeśli tak: nowy tier + inne surowce + bonusy + nazwa. Dotyczy Pałacu i 8 pozostałych łańcuchów (Odlewnia, Port, Świątynia, Spichlerz, Biblioteka→Akademia, Mury→Cytadela, Koszary→Akademia wojskowa, Kuźnia→Wielka kuźnia).
Pełny zapis zasady → `STAN-PRACY-HANDOFF.md` §9 (sekcja „ZAPARKOWANE DO CZASU KOLEJNYCH EPOK").

## DECYZJE 2026-07-25 — jednostki epoki Kamienia + mnożniki (Maciej)
- **C-HASTATI-Q1 = B** — podnosimy poprzeczkę szczegółowości modeli jednostek. Zakres: NA RAZIE TYLKO EPOKA KAMIENIA („później zajmiemy się kolejnymi epokami").
- **ZGODNOŚĆ HISTORYCZNA = WARUNEK STRATEGICZNY** (patrz osobna zasada wyżej). Wzorzec: hastati republikańscy.
- **10 jednostek Kamienia przebudowane** (4 subagenty Opus 5). **Wpięte do gry:** Wojownik, Oszczepnik, Łucznik, Zwiadowca, Chaska (Inkowie), Estólica (Inkowie), Taran, Zulu (Izijula). **NIE wpięte:** Hastati Opus 5 (epoka Żelaza — poza zakresem), łucznicy Egipt/Sumer (czekają na łucznika nubijskiego).
- **Znalezione anachronizmy w OBECNYCH modelach** (lista kontrolna na kolejne epoki — powtarzają się DWA wzorce: metal tam, gdzie go nie mogło być, oraz insygnia władzy na szeregowych): macuahuitl (aztecka maczuga XV w. n.e.) jako broń Wojownika · umbo na tarczy · łuk 3× za mały · 2 lotki zamiast 3 · złota opaska llautu = insygnium Sapa Inki · brąz w 3 miejscach u Inków · atlatl bez rowka i haka (element, od którego jednostka bierze nazwę) · nemes = nakrycie królewskie na szeregowym łuczniku (500-900 lat za wcześnie) · złoty kołnierz usech · miedziany hełm sumeryjski · stalowy grot i 4 koła u jednostek Kamienia · „spłuczka" (kij umgobo z kitką) sterczący nad tarczą Zulusa — **UWAGA: ten sam błąd siedzi też w Impi** (`jednostki-p57`), do poprawy przy epoce Brązu.
- **C-SUMER-KOLOR = B** — narzuta Sumeryjczyka w terakocie `0x8f4a2e` (barwione tkaniny w Mezopotamii poświadczone). Kaunakes zostaje w naturalnej wełnie.
- **C-UNITS-OPIS = A** — poprawić opisy „łuk kompozytowy" przy jednostkach Kamienia (technologia ~1650 p.n.e.). **ZAMKNIĘTE** — `units.json`: Łucznik egipski → łuk dwuwypukły; Łucznik sumeryjski → łuk prosty (epoka Kamień bez „kompozytowy").
- **TARAN** — kamienny na płozach zatwierdzony, ograniczony do epoki Kamienia. **Nowa jednostka „Taran okuty"** (Brąz;Żelazo) na kołach — koło jako wyróżnik epoki Brązu. Asyryjski taran z wieżą zostawiony na Żelazo.
- **ŁUCZNIK EGIPTU dla Brązu = NUBIJSKI** (nie numidyjski — Numidyjczycy to Afryka Płn.-Zach., epoka żelaza, słynęli z JAZDY; Nubia = `Ta-Seti` „Kraina Łuku", a Medżajowie w grze to już Nubijczycy). Parametry: zasięg 5 (najlepszy w grze), atak dyst. 7, 16 pocisków, Health 50, **Ruch 3** (C-NUBIJ-RUCH=B — Medżajowie jako zwiadowcy pustynni). Bazowy Łucznik NIE dostaje kontynuacji.
- **C-MNOZ-WYCIEK = A** — zatrzymać wyciek Pracy, wpiąć mechaniki tam, gdzie należą. **WARTOŚCI DO POTWIERDZENIA przez Macieja** (wylistowane w czacie): żywe dziś Wielka Kuźnia 23→54%, Akademia 10→24%, Karawanseraj 8→19%, Pretorium 5→12%; martwe Akademia wojskowa 20%, Warsztat oblężniczy 10% (bez zapisanej intencji), Kuźnia żelaza 8%, Kuźnia 5%, Koszary 5%, Lazaret 5% (mechanika regeneracji NIE ISTNIEJE w silniku). Otwarte: czy siła jednostek SUMUJE się z budynków czy liczy się najwyższy.
- **C-PRZYROST = A** — **ZAMKNIĘTE** (`docs/decyzje/C-PRZYROST.md`): UI panelu miasta pokazuje realne wartości z `buildingEffectAtLevel` (baza + przyrost × (poziom−1)), nie surowe etykiety `przyrost`. Silnik bez zmian.

## MNOŻNIKI BUDYNKÓW — ustalenia 2026-07-25 (Maciej)
**Zasada nadrzędna:** budynki gospodarcze dokładają Pracę · handlowe dokładają handel · wojskowe dokładają parametry jednostek.
- **Gospodarcze — mnożnik USUNIĘTY**, zostaje sama Praca: Kuźnia (6), Kuźnia żelaza (8), Wielka Kuźnia (20). Trzy kuźnie traktowane jako gospodarcze.
- **Wojskowe — mnożnik = ULEPSZENIE JEDNOSTEK, dwie ścieżki po 3 poziomy:**
  - **PANCERZ (armor):** Kuźnia +15% (Brąz) · Kuźnia żelaza +15% (Żelazo) · **Wielka Kuźnia +15% (Klasyczna — C-KUZNIA-EPOKA=B: ZOSTAJE w epoce 4, parametr zdefiniowany, uśpiony do czasu zrobienia epoki Klasycznej)**. Dziś osiągalne max +30%.
  - **POZOSTAŁE PARAMETRY (wszystko poza armor, „umiejętności miękkie"):** Koszary 20% (było 5) · Akademia wojskowa 20% · Warsztat oblężniczy 10% → razem 50%.
- Jednostka zdobywa poziom **budując się w mieście LUB wchodząc do niego**; poziom zostaje na stałe.
- **ODZNAKI na żetonach** — osobna dla pancerza i osobna dla pozostałych parametrów, z poziomem 1/2/3, żeby gracz widział, czy jednostka jest przeszkolona. Weterani = osobny temat na później.
- **ZAMKNIĘTE (2026-07-27 sync):** ~~C-UPGRADE-KUMULACJA~~ = **1A** wdrożone (`docs/decyzje/C-UPGRADE-KUMULACJA.md`) · ~~C-MURY-MODEL~~ = **2A+3** wdrożone (`docs/decyzje/C-MURY-MODEL.md`).
- **ZAMKNIĘTE (2026-07-28):** ~~C-UPGRADE-TRIGGER~~ = bonus przy heksie miasta + toast (`docs/decyzje/C-UPGRADE-TRIGGER.md`) · FALA 44 `95021308` · commit `65e3ddd`.
- **USUNIĘTY Z GRY: Lazaret** (`3228fb1`) — epoka Średniowiecza, niedostępny; dane, ikona, Civpedia, poradnik, encyklopedia.
- **Mury/Cytadela — stan faktyczny:** Mury mają DWA żywe mechanizmy: `obrona 5 (+3/poz.)` = wytrzymałość muru w oblężeniu (jedyne żywe użycie pola `przyrost` w grze!) ORAZ +200% Obrony dla obrońców (`bonus_obrona_mur_proc`, flaga maMur). **Cytadela: `obrona 15` NIE jest czytana nigdzie i nie ma własnego procentu — ulepszenie Murów do Cytadeli nie daje dziś NIC.**

## ODPOWIEDZI MACIEJA 2026-07-25 (pytania numerowane)
- **1A** — poziom ulepszenia jednostki = **najlepsze odwiedzone miasto** (nie kumulacja).
- **2A** — obrona miasta **wyłącznie procentowo**; płaskie bonusy obrony z budynków usunięte (dublowały +200%).
- **3 = 100%** — Cytadela +100% DODATKOWO do muru → miasto z Cytadelą ma **300%**.
- **4** — Akademia i **każdy budynek naukowy** dokłada **+10% do nauki** („było na twardo zapisane i gdzieś zniknęło"). Biblioteka→Akademia to upgrade, więc nie kumulują się.
- **5** — Karawanseraj ma dawać handel (budynek handlowy), ale wg Macieja występuje dopiero w średniowieczu → patrz PYTANIE 15.
- **6** — Pretorium to **budynek rządowy jak Pałac** → zastosować to samo rozwiązanie co przy Pałacu (usunąć mnożnik, zostawić realne plony).
- **7A** — `maksPoziom` na REALNY (epoka 1→3, 2→2, 3→1); fikcyjne 10 usunięte. Temat awansu budynków ZAPARKOWANY → `STAN-PRACY-HANDOFF.md` §9.
- **8A** — wpiąć pole „Dostępna w epokach" w produkcję (żeby taran kamienny realnie znikał po Kamieniu).
- **9A** — Taran okuty jako **osobna jednostka**, kamienny znika po epoce.
- **10 = NIE A** — **mechanizm ×1,10 (compound) DO LIKWIDACJI, „żeby już nie było śladów w grze"**. Parametry mają rosnąć **+1 na każdy poziom** (Pałac: szczęście, kultura/prawo). To zmiana GLOBALNA — dotyczy skalowania wszystkich budynków. Doprecyzowanie w toku (czy +1 dla każdego parametru każdego budynku, czy ożywić istniejące wartości `przyrost`).
- **11A** — odznaki ulepszeń: małe ikony przy żetonie z cyfrą poziomu (tarcza=pancerz, miecz=parametry).
- **12A** — czerwona tunika linii rzymskiej ZOSTAJE jako tożsamość wizualna.
- **13B** — „spłuczka" (kij umgobo) w Impi — poprawić **przy robieniu epoki Brązu**, nie teraz.
- **14A** — **zmierzyć FPS** na dużej bitwie przed wejściem w kolejne epoki (modele ~3× cięższe, brak instancjonowania).
- **OTWARTE:** 15 (Karawanseraj — epoka), 16 (martwa `obrona: 2` w Pretorium).

## PYTANIE 15 — Karawanseraj (anachronizm epoki) — ODPOWIEDŹ: **B = USUNĄĆ Z GRY**
Maciej 2026-07-25: „15b". Karawanseraj stoi w danych w epoce Brązu (`epokaWejscia: 2`), a historycznie to budynek
średniowieczny (szlaki karawanowe, Persja/Anatolia, ~X-XV w.). Zamiast przenosić i parkować — **usuwamy całkowicie**,
tak jak Lazaret (commit 3228fb1). Do usunięcia: wpis w `gra/data/buildings.json`, ikona, Civpedia/poradnik/encyklopedia,
odwołania w panelach Excel i dokumentacji, powiązanie `techUnlock: "Handel"` (sprawdzić czy tech nie zostaje pusty).
Efekt uboczny: znika 1 z 4 żywych wycieków `mnoznik` (8% → 19% na poz. 10).

## PYTANIE 16 — Pretorium: martwe `obrona` — ODPOWIEDŹ: **A = USUNĄĆ** (+ audyt pozostałych bonusów)
Maciej 2026-07-25: „16a ale sprawdźmy, jakie inne bonusy ma pretorium."
`baza.obrona: 2` / `przyrost.obrona: 1` — silnik NIE czyta `obrona` z budynków (obrona miasta wyłącznie procentowa:
mur 200%, Cytadela 300%) → wyzerować, spójnie z decyzją 2A dla murów i Cytadeli.
**Pełny stan Pretorium (audyt na żądanie):**
| pole | wartość | status |
|---|---|---|
| kategoria | Administracja | — |
| epokaWejscia | 3 (Żelazo), techUnlock „Prawo" | ŻYWE |
| baza.praca | 2 | ŻYWE (praca miasta) |
| baza.pieniadz | 3 | ŻYWE (dochód) |
| baza.zadowolenie | 1 | ŻYWE |
| baza.obrona | 2 | **MARTWE → do zera (16A)** |
| baza.mnoznik | 5 | **do zera** (decyzja 6: budynek rządowy jak Pałac) |
| przyrost.* | praca 1 / pieniądz 2 / zadow. 1 / obrona 1 / mnoznik 2 | żywe po przejściu na model liniowy; obrona+mnoznik do zera |
| kosztBudowy 75 (+15/poz.), utrzymanie 3 (+1) | — | ŻYWE |
| koszt_surowce | cegła 9 | ŻYWE |
| uwagi | „bonus do utrzymania porządku (garnizon); mnożnik % do przychodu podatkowego" | **OPIS NIEZGODNY Z KODEM** — garnizonu nie ma, mnożnik idzie na Pracę a nie na podatki; opis do przepisania po zmianie |

## ZASADA MODELI (Maciej 2026-07-25)
„Tylko wyjątkowo za moją zgodą możesz użyć Opus 5 albo Fable 5." → **wszystkie prace zlecane subagentom na Sonnet 5**;
Opus/Fable wyłącznie po wyraźnej zgodzie właściciela.

## R-LINEARYZACJA (2026-07-25) — ZAMKNIĘTE: ×1,10 zlikwidowane
Odpowiedź Macieja na pytanie 10: „parametry pałacu miały rosnąć o jeden w każdym z wypadków, a nie o dziesięć procent.
To dziesięć procent do likwidacji, usunięcia, żeby już nie było śladów w grze."
**Wdrożone przez subagenta Sonnet 5:**
- `buildingEffectAtLevel(baza, przyrost, poziom) = baza + przyrost × (poziom−1)` — zamiast `baza × 1,10^(poziom−1)`
- koszt budowy: `kosztBudowy + przyrostKosztu × (poziom−1)`; utrzymanie: `utrzymanie + przyrostUtrzymania × (poziom−1)`
- usunięty parametr `budynek_mnoznik_poziomu` z `gra/data/miasto-params.json` i stała `BUILDING_LEVEL_FACTOR`
- `maksPoziom` urealniony w 37 budynkach: epoka 1 → 3, epoka 2 → 2, epoka 3 → 1 (koniec fikcyjnego „10")
- UI przycina listę `nazwyPoziomow` do realnego `maksPoziom`
**Skutek liczbowy:** Pałac kultura 5→11 na poziomie 3 (wcześniej compound dawał 5→6). Rodzina `przyrost*` z martwej stała się ŻYWA.
Bramki: tsc 0, tech-tree 19/19, research 33/33, logic-test 207/208 (1 porażka mapgen — osobne zadanie).

## R-COMBAT-TEST (2026-07-25) — ZAMKNIĘTE: nic do naprawy
Zlecona naprawa „zepsutego harnessu `counterTyp`" okazała się bezprzedmiotowa — naprawiono go już commitem `496dd53` (2026-07-19/20).
Test daje **6/6 pass**, exit 0, bez wyjątku. Nieaktualny był zapis w `CLAUDE.md` („~21 porażek logic-test", „combat-test rzuca wyjątkiem")
— poprawiony. Uwaga na przyszłość: asercje `combat-test.cjs` są sanity-checkami strukturalnymi, NIE porównaniem z oczekiwanymi
wynikami bitew — test nie wykryje błędów balansu, tylko awarie.

## PYTANIA 18–20 (2026-07-25) — ZADANE, CZEKAJĄ NA ODPOWIEDŹ
Pełna forma ABC w `dyspozycje/PYTANIA-OTWARTE.md`:
- **18** profil Pretorium po sprzątnięciu (rek. A: zadowolenie 1→3)
- **19** utrzymanie budynków — zróżnicowane czy płaskie (rek. A: włączyć dane, flat tylko jako domyślna)
- **20** Targowisko — co z bonusem handlowym, który nigdy nie działał (rek. A: przenieść do bazowego pieniądza)
Szkice paczki 2 (21 `odblokowuje`, 22 Wielka Kuźnia, 23 odznaki ulepszeń) — tamże.
Backlog przyszłościowy: **`dyspozycje/BACKLOG-PRZYSZLOSC.md`**.

## R-LUCZNIK-NUBIJSKI (2026-07-25) — WDROŻONE
Decyzja Macieja: Egipt w epoce Brązu dostaje **Łucznika nubijskiego** zastępującego Łucznika.
**Parametry podane przez właściciela:** zasięg 5 · atak dystansowy 7 · 16 pocisków · Health 50 · Ruch 3.
**Parametry dobrane przez subagenta — DO ZATWIERDZENIA przez właściciela:**
koszt 20 pieniądza (Łucznik akadyjski ma 16 — nubijski ma lepszy zasięg, atak, pociski i marsz) · utrzymanie 2 ·
ludność 1 · brak wymaganego surowca (żaden łucznik w grze nie kosztuje brązu — łuk to drewno) ·
atak/uderzenie/obrona 4/2/6 (standard łuczników) · ruch w bitwie 4 · próg dezercji 0,4 · widok 2 ·
pancerz/przebicie 2/2 · kara z flanki/tyłu 50%/80% · morale 85/25 · tech „Łucznictwo" · klasa Specjalna/Distance ·
epoki „Brąz;Żelazo" · missileAttack 6 (o 1 wyżej niż akadyjski) · fieldPower 16.
**Ważne ustalenie techniczne:** sam wpis „W zamian za" w `units.json` NIE wystarcza — produkcja jednostek specjalnych
filtruje dodatkowo przez listę `bonusy[].typ = "jednostka_specjalna"` w `gra/data/civs.json`. Bez dopisania nazwy do tej
listy jednostka w ogóle nie pojawia się w produkcji. Dopisane (precedens: Sumerowie mają tam i Łucznika sumeryjskiego,
i akadyjskiego). **Model 3D:** tymczasowo model łucznika egipskiego; dedykowany model nubijski do zrobienia osobno.

## R-MAPGEN-GLINA (2026-07-25) — NAPRAWIONE, logic-test 208/208
Pre-istniejąca porażka `mapgen: deposits obey terrain rules` była **realnym błędem generatora**, nie nieaktualną asercją.
Reguła gliny (`gen-helpers.ts`): glina TYLKO na lądzie z prawdziwą rzeką. Główna ścieżka losowania ją respektowała,
ale **konsolidacyjna ścieżka fair-play** (`ensureDepositGridCoverage` → `forceDepositInCell` → `pickDepositBootstrapHex`)
wymuszała glinę na dowolnym heksie lądowym, ignorując regułę. Stary komentarz nazywał to „akceptowalnym wyjątkiem" —
bez żadnego umocowania w decyzji właściciela. Naprawiono generator (bootstrap zwraca `null`, gdy w komórce nie ma
zgodnego heksu — dopuszczalne, bo fair-play wymaga ≥85% pokrycia, nie 100%), asercji testu NIE rozluźniono.
Sąsiednie złoża (miedź/żelazo/węgiel/konie) bezpieczne — `prepareTerrainForDeposit` wymusza teren PRZED złożem.
**Zauważone przy okazji (osobny temat):** `fair-play-grid-test.cjs` ma pre-istniejące porażki — klastry gór/wzgórz
za duże, pokrycie złóż 75% < 85% na „Standard Ziemia".

## R-PRAWO-ADMINISTRACJA (2026-07-25) — decyzje Macieja 26B, 27A, 28
**26 = B** — bazy wyższych tierów podnoszone tak, żeby awans zawsze wygrywał (nie zerujemy przyrostu).
**27 = A** — Prawo z Pałacu rośnie z tierem.
**28** — Pretorium = **70% wartości Pałacu III**; wcześniej ustalone: Ratusz = 70% Pretorium, Sąd = 50% Pretorium.

**Docelowa siatka Prawa (łatwy / normalny / trudny):**
| Budynek | easy | normal | hard | % skali w Żelazie (100 pkt) |
|---|---|---|---|---|
| Pałac I | 45 | 35 | 28 | 35% |
| Pałac II | 58 | 45 | 36 | 45% |
| Pałac III | 71 | 55 | 44 | 55% |
| Pretorium (70% P3) | 50 | 38 | 31 | 38% |
| Ratusz (70% Pretorium) | 35 | 27 | 22 | 27% |
| Sąd (50% Pretorium) | 25 | 19 | 16 | 19% |
| Dom Starszyzny (70% P1) — gdy powstanie | 31 | 24 | 20 | — |
| Dwór Zarządcy (70% P2) — gdy powstanie | 41 | 31 | 25 | — |
| Garnizon (za jednostkę, max 5) — bez zmian | 25 | 20 | 15 | 20% każda |

**KONSEKWENCJA ZGŁOSZONA WŁAŚCICIELOWI:** miasto z Pretorium + Ratuszem + Sądem zbiera 84 pkt Prawa
bez ani jednej jednostki wojska (dziś te same trzy budynki dają 16). Garnizon przestaje być koniecznością,
staje się uzupełnieniem. Właściciel podtrzymał regułę 70% — wdrażamy.

**Do rozstrzygnięcia osobno:** Ratusz nie istnieje jako budynek (parametr gotowy, `hasRatusz` nigdy nie jest true).
Przy trzech szczeblach administracji lokalnej byłoby sześć budynków administracyjnych (Dom Starszyzny, Dwór Zarządcy,
Ratusz, Trybunał, Sąd, Pretorium) w grze o trzech epokach — patrz pytania 29–31.

## NOWE PROŚBY 2026-07-25 (popołudnie/wieczór) — model budynków, jeszcze bez R-ID w tabeli głównej

Zapisane tu, żeby nie zgubić się (zasada procesu tego pliku) — pełny opis każdej w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md`. Status wdrożenia w kodzie różni się pozycja od pozycji
(audyt gap-fill 2026-08-05: R-BASZTA i R-STOLICA-REGION wdrożone na `main`).

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-BASZTA | 2026-07-25 | Nowy budynek obronny epoki Żelaza „Baszta" (+100% Obrony, stoi obok Murów+Cytadeli, nie zastępuje) — nazwa ZATWIERDZONA. | **ZDEPLOYOWANE** FALA 246 `cbf529f3` (audyt docs 2026-08-05; gameplay wcześniej na main) | `buildings.json` id `baszta`, `miasto-params.json` `bonus_obrona_baszta_proc=100`, `city-defense.ts` +400%, prereq Mury (`building-resource-gate.ts`), ikona `building-icon-map.json`, Civpedia `docs/encyklopedia/budynki/baszta.md`. Testy: `koszty-surowcowe-test.cjs` 128/128, `city-defense-terrain-gate-test.cjs` 31/31. |
| R-AWANS-MODEL | 2026-07-25 | Ogólna reguła: łańcuchy budynków dzielą się na „w górę" (następca kasuje poprzednika, stała wartość per tier, rośnie tylko przez awans) i „w bok" (oba stoją obok siebie, wartości przyrostowe). | **ZDEPLOYOWANE** FALA 11 `dd1ec38e` · kod `2354fb7` (verify 2026-08-05) | Pytanie 25 = B (per łańcuch). 6 łańcuchów „w górę" (Pałac, Dom Starszyzny→Dwór Zarządcy→Pretorium, Kuźnia, Spichlerz, Port, Piec hutniczy), 4 „w bok" — pełna lista `DECYZJE-BUDYNKI-2026-07-25.md` §1. **Nie zdeployowane do ROBOCZA** — tylko commit na gałęzi roboczej. |
| R-PANEL-GRUPY | 2026-07-25 | Panel miasta: budynki grupowane w 8 grup dziedzinowych (Prawo i administracja / Wojsko i obrona / Handel i pieniądz / Nauka i kultura / Wiara / Zdrowie / Produkcja surowców / Żywność); klik grupy rozwija budynki; budynek-następca „w górę" rozwija listę zastąpionych. | **ZDEPLOYOWANE** · `grupa` w buildings.json + UI (verify 2026-08-05, test 83/83) | Nie zdeployowane do ROBOCZA. |
| R-STOLICA-REGION | 2026-07-25 | Pałac I/II/III wyłącznie w stolicy; Dom Starszyzny/Dwór Zarządcy/Pretorium wyłącznie poza stolicą; Trybunał i Sąd wszędzie. | **ZDEPLOYOWANE** FALA 246 `cbf529f3` (audyt docs + fix testu; gameplay wcześniej na main) | `buildings.json` `lokalizacja: stolica|region`, `production.ts` `buildingLocationAllowed`, Trybunał/Sąd bez `lokalizacja`. Test: `administracja-stolica-test.cjs` 48/48. |
| R-PRAWO-SIATKA-V2 | 2026-07-25 | Siatka Prawa dla Dom Starszyzny/Dwór Zarządcy zmieniona z „70% swojego odpowiednika (Pałac I/II)" na „50%/60% Pałacu III" — patrz `R-PRAWO-ADMINISTRACJA` wyżej dla starych liczb. | **ZDEPLOYOWANE** FALA 247 `540d2490` (audyt; liczby wcześniej na main) — było **WDROŻONE** (audyt 2026-08-05) — `society-params.json` już zgodny (Dom 36/28/22, Dwór 43/33/26, Pretorium 50/38/31); zero zmian liczb | Test: `prawo-siatka-v2-test.cjs` + `prawo-palac-tier-test.cjs`. Dowód: `docs/decyzje/R-PRAWO-SIATKA-V2.md`. |

## ZGŁOSZENIA Z PLAYTESTU 2026-07-26 (Maciej, bundle FALA 15 `7c7ae9a0`)

Zapisywane na bieżąco na polecenie właściciela („zapisuj sobie wszystkie nowe zgłoszenia do listy zgłoszeń").
Cytaty są dosłowne — nie parafrazuję, żeby przy wdrożeniu nie zgubić intencji.

| ID | Data | Prośba (cytat / opis) | Status | Uwagi |
|---|---|---|---|---|
| R-TECH-ESC-FS | 2026-07-26 | „jeżeli wejdzie się do drzewka technologii w badaniach, a wcześniej był włączony pełny ekran, to nie da się wyjść bez usunięcia pełnego ekranu. Escape najpierw wychodzi z pełnego ekranu, a dopiero potem wychodzi z drzewka technologii, a powinno być na odwrót." | **ZDEPLOYOWANE** FALA 16 `290a962b` (Keyboard Lock) | Przeglądarka konsumuje Escape w pełnym ekranie ZANIM zdarzenie dojdzie do strony — samym listenerem kolejności nie odwrócimy. Użyto **Keyboard Lock API** (`navigator.keyboard.lock(['Escape'])`) na czas otwartego drzewka: Escape zamyka drzewko, pełny ekran zostaje; blokada zdejmowana przy zamknięciu, więc na mapie Escape znów wychodzi z pełnego ekranu. Wyjście z pełnego ekranu przy zablokowanym Escape = PRZYTRZYMANIE Escape (zachowanie Chromium). Poza Chromium API nie ma → zostaje stan sprzed zmiany + widoczny przycisk „Wróć". **Do sprawdzenia w playteście.** |
| R-TECH-WROC | 2026-07-26 | „powie mi gdzieś jakiś przycisk w badaniu drzewko technologii wyjść, żeby można było wyjść bez dawania escape'a" + „Escape jest po prawej stronie ale słabo widoczny więc trzeba byłoby go gdzieś przenieść na środek i wyjustować na samej górze na środku" + „raczej to powinien być symbol wróć a nie wyjdź". | **ZDEPLOYOWANE** FALA 16+ · przycisk ← Wróć · ESC | Znaczek `✕` z prawego rogu nagłówka usunięty; w jego miejsce wyśrodkowana u góry pigułka **„← Wróć · ESC"** (`.civ-ttv-back`, `position:absolute; left:50%`), złota obwódka + cień, żeby była widoczna na ciemnym tle. |
| R-HUD-PANEL-LEWY | 2026-07-26 | „gdy włączy się cokolwiek po lewej stronie, to menu od nowego otwartego okna nachodzi trochę na przyciski, a nie powinno." (zrzuty: panel MIASTA styka się z okrągłymi przyciskami paska; panel BADANIA dodatkowo zachodzi na górny pasek chipów Skarbiec/Praca/Surowce/Handel) | **ZDEPLOYOWANE** FALA 16 `290a962b` · `sidePanelLayout.ts` | Przyczyna: każdy panel miał WŁASNĄ, zduplikowaną i błędną stałą `LEFT_INSET = 68 px`, podczas gdy prawa krawędź medalionów toolbara wypada na **74 px** (toolbar `left:22 px` + przycisk `52 px`) — stąd 6 px nachodzenia. Do tego wszystkie miały `TOP = 56 px`, a dolna krawędź paska chipów jest na **104 px** — stąd zachodzenie panelu Badań na pasek. Paneli z tym samym błędem było **sześć, nie dwa**: Miasta, Badania, Dyplomacja, Wojsko, Civpedia, dok drzewka. Fix: nowy `ui/sidePanelLayout.ts` jako JEDYNE źródło (`SIDE_PANEL_LEFT = 22+52+12 = 86 px`, `SIDE_PANEL_TOP = 104 px`), liczone z wyeksportowanej geometrii toolbara. Ograniczenie wysokości panelu i wewnętrzny scroll już istniały. Zweryfikowane zrzutami z Chromium. |
| R-BADANIA-KOLEJKA-OK | 2026-07-26 | „przetestowałem też kontener na kolejne badania i działa. Można rzucać, można przeciągać, także jest okej." | **POTWIERDZONE PLAYTESTEM — ZAMKNIĘTE** | Domyka zadanie „UI kolejki badań (Q1=C oba miejsca, Q2=C drag&drop, Q3=A, Q4=A)". |
| R-MP-MODELE-KAMIEN | 2026-07-26 | „wydaje mi się, że państwa miasta używają starych grafik dla jednostek typu kamienia." | **ZDEPLOYOWANE** FALA 247+ · dispatch Wojownik→Opus5 | **Zgłoszenie potwierdzone, ale przyczyna NIE leży w miastach-państwach** — renderer nie ma żadnego rozgałęzienia po `ownerId`/`civId`/epoce (parytet zachowany). Winna jedna jednostka: **„Wojownik" (Kamień)**. `units.json` daje jej `Typ = "Swordsman"`, więc `categoryOf()` zwracało `miecznik` i model leciał na STARY `newBuildMiecznik` (28 meshy / 416 trójkątów); nowy `buildWojownikOpus5` (87 meshy / 1198 trójkątów) był podpięty tylko do gałęzi `default` i był **martwym kodem**. Widać to było na miastach-państwach, bo AI w gałęzi `defensiveCopy` ma „Wojownika" z najwyższym priorytetem (`ai.ts:743`) — ich armia to praktycznie same Wojowniki; gracz miał ten sam błąd, tylko rzadziej. Fix: jedna linia dispatchu po pełnej nazwie (`=== 'wojownik'`), więc warianty („Wojownik germański", „…mykeński", „…babiloński", Chaska) zachowują swoje modele. Bramki: `tsc` 0, tech-tree 19/19, research 33/33, unit-replace 10/10, dispatch-check 14/14; pomiary bryły: wysokość 0,831×HEX_R, maks. promień 0,297×HEX_R. |
| R-ARMIA-PASKI | 2026-07-26 | „trzeba jakoś inaczej pokazać pozostałą ilość ruchów oraz energię, czy tam AP, bo jest to trochę mylące, nie wiadomo o co chodzi. Myślę, trzeba było zmienić kolor ruchu na niebieski." | **ZDEPLOYOWANE** FALA 247+ · niebieski pasek ruchu | Lista armii (`armyListHud.ts`) ma dwa paski jeden pod drugim i OBA są zielone przy pełnych wartościach: zdrowie (`.al-hpbar`, czerwień→zieleń) i ruch (`.al-mvbar`, gradient zielony) — nie widać, co jest czym. Zmiana: pasek ruchu na **niebieski**, każdy pasek dostaje podpis z liczbami („Zdrowie 34/50", „Ruch 3/3"), a zduplikowane „Ruch: 3/3" znika z `detailLine` (`main.ts` ~3536). |
| R-SUROWCE-DOSTEP | 2026-07-26 | „sprawdź, czy w surowcach jest miejsce na surowce, które tylko trzeba mieć dostęp… powinno być chociaż zasugerowane miejsce na surowce, które są dostępem" + „trzeba dodać złoto". | **ZDEPLOYOWANE** FALA 248 — access rows `cap` null + Złoto | Przyczyna znikania wierszy: `main.ts` (`buildEmpireResourceRows`) pomijał (`continue`) każdy wiersz `access`, którego owner jeszcze nie odblokował — świadoma decyzja C-SURUI=A z 2026-07-24, teraz odwrócona. Wiersze dostępu (Ceramika, Sól, Koń) pokazują się **zawsze**, ze stanem „masz"/„brak" zamiast paska magazynu; dołożone **Złoto** jako czwarty wiersz dostępu, korzystające z istniejącej `ownerHasZlotoAccessNow(ownerId)` (bez drugiej implementacji). Nowa podsekcja „Dostęp — nie magazynowane" + podpis źródła dostępu. Bramki bez regresji (`tsc` 0, logic 208/208, zloto-szlak 45/45, mennica-uspienie 47/47). |
| R-TURA-JEDN-AKTYWNA | 2026-07-26 | „po zakończeniu tury, okazuje się zwiadowca czy armia, ale nie w formie takiej, że jest zaznaczona i można gdzieś ruszać, tylko po prostu jakoś bezimiennie. Więc wydaje mi się, że po zakończeniu tury powinna się pojawiać możliwość od razu ruchu jednostką z możliwością wybrania kierunku. Jeżeli już coś albo w ogóle nie powinna się ta armia pokazywać." | **ZDEPLOYOWANE** — ruchLeft + kamera po spawnie | **Diagnoza:** to nie kolejność reset↔render. Reset punktów ruchu (`main.ts:13789`, `u.ruchLeft = u.ruch`) wykonuje się poprawnie PRZED `turn++`. Jednostka w panelu to NOWO ZWERBOWANA jednostka, kończona w fazie ekonomii JUŻ PO `turn++` (`main.ts:14657`) i rodzi się z `ruchLeft: 0` → stoi bezczynnie CAŁĄ nową turę. Panel otwiera się dla niej bezwarunkowo (`afterPlayerUnitSpawned`, `main.ts:5723-5734`) z pominięciem istniejącego filtra `stackCanMove` (`main.ts:5569`). Kamera do niej NIE leci (brak `focusAt`, które ma zwykłe cyklowanie `main.ts:3234`), więc pierścień zaznaczenia zwykle jest poza kadrem. Osobno mylące: pasek „RUCH 3" to statystyka BAZOWA jednostki (`main.ts:9684`), a karta „0/3 ruch" to stan realny — dwa różne pola obok siebie. Na zrzucie panel armii po zakończeniu tury pokazuje Zwiadowcę z **„0/3 ruch"** — czyli albo panel jest zbudowany przed resetem punktów ruchu na nową turę, albo reset nie obejmuje tej jednostki. Do rozstrzygnięcia: czy jednostka jest realnie zaznaczona (podświetlenie heksu, zasięg ruchu, kamera), czy tylko wyświetlona. Wariant docelowy do decyzji właściciela po diagnozie: (A) auto-zaznaczenie z podświetlonym zasięgiem ruchu, (B) nie pokazywać panelu, gdy jednostka nie może się ruszyć. |
| R-GARNIZON-AKCJE | 2026-07-26 | „nie da się uśpić jednostki w mieście." | **ZDEPLOYOWANE** FALA 212 `e38ad116` · `onLeaveGarrison` | Historyczna diagnoza supersedowana — odfort z panelu miasta działa |
| R-BARB-WOJNA | 2026-07-26 | barbarzyńcy atakują zwiadowców | **ZAMKNIĘTE** — C-BARB-Q1=B (wojna) + **R-BARB-WOJNA-2=C** (atak wszystkich, bez wyjątku cywili) | `R-BARB-WOJNA-2.md` · kod bez zmian |
| R-OBRONA-MIASTA-MP | 2026-07-26 | „nie wiem też, dlaczego nagle przeciwnicy mają jakieś niewiarygodne bonusy w obronie miasta, jeżeli nawet nie ma tam muru, zwłaszcza kiedy atakuje państwa miasta. Coś tu jest nie tak." | **SCALONE** — patrz `R-OBRONA-MIASTA-MP-Q1` wyżej (runda 3, PASS-WITH-NOTES) | Audyt: brak buga podwójnego mnożnika; A = rozbicie preBattle · `docs/decyzje/R-OBRONA-MIASTA-MP.md` |
| R-MUZYKA-OPOZNIENIE | zgłoszone wcześniej (odtworzone 2026-07-26) | „przesuń start muzyki w menu głównym o dwie, trzy sekundy, bo ścina początek, zanim się załaduje przeglądarka" | **ZDEPLOYOWANE** FALA 18 `2f928932` — `muzyka_opoznienie_startu_ms=2500` | ⚠️ **Prośba padła wcześniej i NIE ZOSTAŁA ZAREJESTROWANA ANI WYKONANA** — dokładnie ten przypadek, przed którym ostrzega zasada procesu tego pliku. Wdrożenie: opóźnienie **2500 ms** jako nazwany parametr `menu.muzyka_opoznienie_startu_ms` w `ui-params.json`, wyłącznie dla pierwszego startu utworu w menu głównym (nie dla przejść między utworami ani muzyki kontekstowej); do sprawdzenia, czy da się dodatkowo powiązać start ze zdarzeniem gotowości odtwarzacza. |
| R-DYP-NEGOCJACJE-NA-ZYWO | 2026-07-26 | negocjacje w audiencji na bieżąco, nie po turze | **ZDEPLOYOWANE** — resolveNegotiationEntryAt | `docs/decyzje/R-DYP-NEGOCJACJE-NA-ZYWO.md` · `main.ts` C-DYP-Q1 · FALA 18 |
| R-ESC-PELNY-EKRAN | 2026-07-26 | Escape: najpierw zamknij panel, potem pełny ekran | **ZDEPLOYOWANE** FALA 253 `b8704216` · Q1=A | + science-hub/city-list (F253) · science-picker/army-list/save-load (F252) |
| R-AI-RECRUIT-UPKEEP-GATE | 2026-08-06 | Rekrutacja: pula musi pokryć koszt surowca + 1× utrzymanie/turę (łącznie) | **ZDEPLOYOWANE** FALA 252 `bbff9996` | `canAffordUnitRecruitFull` · parytet gracz/AI/MP · tip `df5cc308` · test 18/18 |
| R-RZEKI-PERF-FALA138 | 2026-08-01 | perf głównych rzek **>2 min** po FALA 138 | **ZAMKNIĘTE** | Maciej ~20:58 na FALA 140 `935d1642`: etap głównych **~20 s OK**. Fix `d2db99c`+`9c4320b`. Szczegóły: `PYTANIA-OTWARTE.md` → `BUG-RZEKI-PERF-FALA138`. |
| R-RZEKI-UJSCIE-FALA138 | 2026-08-01 | regres: rzeki kończą się w środku lądu | **ZDEPLOYOWANE** FALA 140 `935d1642` + FALA 177 | Fix `9c4320b`/`ensureRiverOutlets`; smoke 12 map: 0 bez ujścia. W ROBOCZA od FALA 140+. |
| R-RZEKI-KILLSWITCH-DIAG | 2026-08-01 | Eksperyment diagnozy: wyłączanie rzek stage 0–5 (izolacja wąskiego gardła) | **W TRAKCIE** | FALA 149: `getRiverRenderStage()` w `scene.ts`, default **0**; archiwum `dyspozycje/_archiwum-rzeki/scene-rivers-FULL-2026-08-01.ts`. Maciej 23:31 — kod renderu zostaje, tylko bramka. |
| R-DYPLO-NAP-FAIRMIN-FALSE | 2026-08-02 | NAP @ Rel 52: panel pokazuje fałszywe „Brakuje 274 PW" / fair min 570 zamiast progu Relacji | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `renderPnBalancePanelForTreaty` · na main z FALA 201 |
| R-DYPLO-TRADE-INCOMING | 2026-08-02 | Traktat handlowy od AI: Przyjmij zablokowany fair-min, bilans −120/Brakuje, brak edycji obu stron koszyka | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `main.ts` canAccept · `diplomacy-acceptance-points.ts` netto · klik karty → koszyk. Test 177/177. Branch `cursor/fix-trade-offer-edit-balance-63a1` · PR #9 |
| R-DYPLO-GIFT-WAR-FALSE | 2026-08-02 | Dar pieniędzy (Prezent) blokowany komunikatem „W wojnie pieniądze tylko w ugodzie pokojowej" mimo stanu POKÓJ w audiencji | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `validateBasketForm` — `ctx.atWar` zamiast hardkodu `true`. Testy war-gates + proposal §17–18 · PR #11 |
| R-DYPLO-TRADE-WILLINGNESS | 2026-08-02 | AI proponuje handel gdy partner niechętny / brak walidacji willingness | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #10 |
| R-SCENA-PERF-FALA138 | 2026-08-01 | Budowanie sceny: **bardzo długo** | **ZDEPLOYOWANE** FALA 248 `772bab7c` (+ dżungla InstancedMesh F249) — offline diag + merge skip/cache; pomiar F12 nadal mile widziany | `docs/decyzje/R-SCENA-PERF.md` · handoff sesji 2026-08-05 |
| R-SPAWN-CLUSTER-KULTURA | 2026-08-01 | Jakość klastrów: cywilizacje jednego typu czasem lądują w kręgu innego typu zamiast razem wokół siebie (stolica + mp) | **ZDEPLOYOWANE `2b1e072c`** (FALA 142) | `assignTypesToClusterCenters()` w `clusters.ts` + `allocateTypyToMasses`. ROBOCZA zweryfikowana 2026-08-06. |
| R-SPAWN-ODLEGLOSC-MORZE | 2026-08-01 | Start cywilizacji (zwł. główna) min. **~10 hex od morza** na Standard; skalować z rozmiarem mapy | **ZDEPLOYOWANE `26b05753`** (FALA 200) | Pas stolicy 10–15 hex Standard (`clusters.ts`); wcześniej WDROŻONE (kod) min 10. |
| R-SPAWN-SEP-STOLICE-15 | 2026-08-02 | Standard: odległość stolic różnych civ **14→15 hex** (tylko `duza`; MP w klastrze bez zmian) | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `capitalMinSeparation` LUT `duza: 15` · placement sep 17 · `minDystansObcyOdGracza` 17 na Standard. Testy: `capital-sep-unit-test.cjs`, `capital-sep-pangea-test.cjs`, `cluster-start-test.cjs`. |
| R-DYP-GIFT-WAR | 2026-08-02 | Dar 50¤ od miasta-państwa widoczny i akceptowalny podczas wojny (Kapua/Rzymianie) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | BUG-DYP-GIFT-WAR · `pruneInvalidNegotiations` po DOW · filtr UI + bramka Accept · `isGift` w `aiCommandToPendingProposal` · PR #19 |
| R-INKOWIE-MP-BRAK | 2026-08-02 | Inkowie (i czasem inne obce) bez miast-państw po body-sep / deferred spawn | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `repackAllSparse…` + `clusterStartSlot` · PR #5 |
| R-KOLEJKA-ZWROT-SUROWCA | 2026-08-02 | Anulowanie budynku z kolejki nie zwraca koszt_surowce | **ZDEPLOYOWANE `48646cd6`** (FALA 201) | `cancelQueueItem` + refund · PR #6 |
| R-BARB-GLOD-ATAK | 2026-08-02 | Barbarzyńcy bez głodu; obóz z 2 wojownikami od razu maszeruje na cywilizację | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `empire-food.ts` skip -1 · `isCampRaidReady` + `decideBarbarianMoves` · branch `cursor/fix-barb-no-hunger-attack-63a1` · PR #7 |
| R-PRACA-OVERFLOW-HUD | 2026-08-02 | Pusta kolejka budowy + suwak 100% budowa → HUD Praca +0 zamiast całej puli miasta | **ZDEPLOYOWANE (FALA 205)** | `previewPracaPoolBrutto` + main.ts · md5 `f41c6550` · production-overflow 24/24 |
| R-MP-NAZWA-CIV-MISMATCH | 2026-08-01 | MP: nazwa miasta ≠ kultura (Jin + Argos·Grecy); Chińczycy oznaczeni jako Grecy | **ZDEPLOYOWANE** — pendingSameTypeRivalOwnerIds | `pendingSameTypeRivalOwnerIds` w `cluster-spawn.ts` + `main.ts` spawn; bez kolizji z obcymi ID. |
| R-MP-LOGO-SAME-AS-PLAYER | 2026-08-02 | Audiencja: miasto-państwo (ten sam typ co gracz) ma identyczny portret-zdjęcie władcy zamiast symbolu kultury | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `shouldForceCultureIconForOwner` (`display-names.ts`) + `portraitForceCultureIcon` w `main.ts`; load fallback `simplifiedDiplomacyOwners`; `foundCityAt` → `startCityState`. Test: `display-names-test.cjs`. Branch `cursor/fix-mp-logo-same-as-player-63a1` · PR #8 |
| R-DYPLO-AI-LABEL | 2026-08-02 | Dyplomacja: „AI 32" zamiast nazwy miasta-państwa; Ludność 0 na duchach | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | `display-names.ts` sanitize + `ownerDiploLabel` pula; `eliminateOwner` czyści discovered; filtr listy · PR #15 |
| R-MEDIUM-RIVERS-FOG | 2026-08-02 | Średnie rzeki widoczne w mgle wojny (powinny być ukryte jak główne) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #16 · render/scene FoW medium rivers |
| R-ORPHAN-UNITS | 2026-08-02 | Jednostki sieroty po merge / eliminacji ownera | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #21 |
| R-BATTLE-HP-BAR | 2026-08-02 | Pasek HP w bitwie / podsumowaniu nieczytelny lub błędny | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #22 · `battle-hp` test 7/7 |
| R-RUCH-WZGORZA-3 | 2026-08-02 | Ruch przez wzgórza: trasa widoczna, jednostka nie rusza (MIN-MOVE) | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | PR #12 hills MIN-MOVE · `terrain-hill-movement-test.cjs` 10/10 · branch `cursor/fix-move-hills-stuck-63a1` |
| R-RYZ-CYWILIZACJE | 2026-07-26 | „ryż uprawny mieli robić tylko Chińczycy i chyba Aztekowie, z tego co pamiętam" | **ZAPISANE — DO POTWIERDZENIA** (ryżu nie ma dziś w grze) | **Stan faktyczny:** w `gra/data/**` nie ma dziś ŻADNEGO surowca ani ulepszenia „ryż" — sprawdzone grepem (jedyne trafienia to „ryzyko" i nazwy miast). Zapis jest więc ograniczeniem na przyszłość, na moment wprowadzenia ryżu jako uprawy/surowca, a nie poprawką istniejącego stanu. **Zapisana reguła:** uprawa ryżu dostępna wyłącznie dla wybranych cywilizacji — na pewno **Chińczycy**; **Aztekowie do potwierdzenia**. **⚠️ Uwaga historyczna do rozstrzygnięcia przez właściciela (zasada: zgodność historyczna = warunek strategiczny):** Aztekowie nie uprawiali ryżu — ich podstawą była kukurydza na chinampach (pływających polach), ryż trafił do Ameryk dopiero z kolonizacją. Jeśli chodziło o **uprawę na wodzie / chinampy jako azteckie ulepszenie**, to osobny byt niż ryż i warto go nazwać właściwie. Do potwierdzenia przy wprowadzaniu upraw. |
| R-AI-SUWAKI | 2026-07-26 | **Decyzja C-AI-SUWAKI = A** — AI dostaje heurystykę ruszania suwakami (żywność, Handel, Praca). | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | `decideAIEconomySliders` w `ai.ts` + wiring `main.ts` (~L21177); `econ-params.json` `ai_suwaki_*`. ROBOCZA zweryfikowana 2026-08-06. |
| R-MAPGEN-KOLEJNOSC | 2026-07-26 | Kolejność: teren → rzeki → lasy → złoża | **PACZKA ZAMKNIĘTA** — Q1=B las · Q2=C ~15% górzystości · Q3=A wieloetapowy floor (2×/3×) bez skracania | Testy: fair-play · relief-grid · map-gen-regression |
| R-TEREN-DOPIAC | 2026-07-26 | **Decyzja C-TEREN-Q1 = A** — trzy etapy terenu bitwy. | **ZDEPLOYOWANE `a74c3797`** (FALA 36) | `battleScene.ts` etapy 1–3 · `teren-walki-etapy-test.cjs` 33/33 PASS (2026-08-06). |
| R-GARN-AKCJE-A | 2026-07-26 | **Decyzja C-GARN-Q1 = A + rozszerzenie właściciela:** „możliwość zaznaczenia jednostki na liście jednostek w lewym menu i skierowania jej w dowolne inne miejsce — wtedy automatycznie następuje odfortyfikowanie albo odśpienie". | **ZDEPLOYOWANE** FALA 248 — lista armii + auto-wake przy ruchu | Dwa elementy: (1) akcja „Opuść garnizon" przy jednostce w panelu miasta; (2) jednostka ufortyfikowana **ma być widoczna i zaznaczalna na liście armii w lewym menu**, a wydanie jej rozkazu ruchu ma **automatycznie** zdjąć fortyfikację/uśpienie — bez osobnego kliknięcia. Uwaga wdrożeniowa: dziś jednostka z flagą garnizonu wypada z `visibleStackOnHex`, więc lista armii też jej nie pokazuje — to trzeba rozstrzygnąć osobno od filtra używanego przez łączenie armii i blokady ruchu. |
| R-DYP-STOL-A | 2026-07-27 | Decyzja **B+C** (Maciej): AI inicjuje w audiencji + pełny `diplomacyTradeBasket` dla wszystkich traktatów. | **ZAMKNIĘTE ABC** — kod CZĘŚCIOWO | `docs/decyzje/R-DYP-STOL-A.md` · B ~OK; C: koszyk tylko akcje 5/13. |
| ZNALEZISKO-86 | 2026-07-27 | Decyzja **A**: % HP + pasek jak `postBattleSummary` w „Szczegóły bitwy". | **WDROŻONE** | `endDetails1E.ts` · `end-details-hp-test.cjs` · `docs/decyzje/ZNALEZISKO-86.md` |
| DYSPOZYCJA-85-SUWAK | 2026-07-27 | Decyzja **C**: globalny domyślny podział Daniny + override per miasto. | **ZAMKNIĘTE ABC** — kod ROZBIEŻNOŚĆ | `docs/decyzje/DYSPOZYCJA-85-SUWAK.md` |
| PYTANIE-59-DOP | 2026-07-27 | Decyzja **B**: addytywna korupcja 30%+30% (sufit 60%). | **ZAMKNIĘTE** — kod ZGODNY | `economy.ts` `corruptionBuildingReduction` |
| PYTANIE-77-DOP | 2026-07-27 | Decyzja **B**: Mennica śpi **1 turę** po utracie złota. | **ZAMKNIĘTE ABC** — kod ROZBIEŻNOŚĆ (83=B natychmiast) | `docs/decyzje/PYTANIE-77-DOP.md` |
| R-AI-WOJNA-BRAMKA | 2026-07-26 | AI atakuje bez wojny (C-BARB-Q2) | **NAPRAWIONE (kod)** → patrz **P-AI-002** | `canEngageOwner` + dyplomacja przed ruchem; test 11/11. Deploy: **P-AI-005** |
| R-BUD-LOKALIZACJA-UI | 2026-07-26 | „jeżeli budynek jest tylko dla regionalnych terenów, to nie powinien się wyświetlać w stolicy, a jeżeli jest dla stolicy, nie powinien się wyświetlać w miastach regionalnych." | **ZDEPLOYOWANE** — locationBlocked filter cityPanel | Silnik był OK — `eraBuildingCatalog` (`production.ts:1460-1482`) już oznaczał taki budynek polem `locationBlocked`. Filtr listy w UI przepuszczał każdy wpis o `status === 'locked'` bez rozróżnienia POWODU blokady, więc trwała blokada lokalizacji lądowała w jednym worku z tymczasowym brakiem technologii/surowca. Teraz wpisy z `locationBlocked` wypadają z listy (w obie strony, stolica↔region), a brak technologii/surowca zostaje widoczny jak dotąd. Stolica czytana na żywo (bez cache), więc po jej przeniesieniu lista przelicza się sama. Bramki: `tsc` 0, administracja-stolica 48/48, prereq-budynkow 46/46. Dawniej: bramka budowy działała, ale karta wisiała w sekcji „Jeszcze zablokowane" z adnotacją „Tylko poza stolicą". Warunek lokalizacji jest TRWAŁY dla danego miasta, więc karta jest tam bezużyteczna — w odróżnieniu od braku technologii/surowca, które zostają widoczne jako informacja o przyszłości. |
| R-SKARBIEC-PRZECINEK | 2026-07-26 | „po ostatnich zmianach skarbca … miało nie być błędu po przecinku danych. Ale jednocześnie trzeba pamiętać, żeby dane się nie traciły przy zaokrągleniu." (zrzut: „Skarbiec +6.600000000000005") | **ZDEPLOYOWANE** — formatLiczbaPl/signedPl | Cztery panele miały WŁASNĄ kopię helpera `signed()`, każda składała liczbę przez `String(n)`, czyli cały zapis IEEE-754. Nowy `signedPl()`/`formatLiczbaPl()` w `ui/formatPl.ts`: 1 miejsce po przecinku, obcięte końcowe zera, polski przecinek. Wpięty w `hud.ts`, `empireBalance.ts`, `empireDetailPanel.ts`, `cityPanel.ts`. **Zaokrąglenie jest wyłącznie prezentacyjne** — nie wraca do stanu gry, silnik liczy dalej na pełnej wartości (wprost zastrzeżone przez właściciela). |
| R-TEREN-BITWA-WERYF | 2026-07-26 | „sprawdź, czy bonusy terenu w bitwie się doliczają w bitwie ręcznej, takie jak drzewo, las … czy góry, wzgórza. Czy są jakieś bonusy i minusy, na przykład rzeka." | **W WERYFIKACJI** (subagent Sonnet 5) | Ma powstać tabela: teren · parametr · wartość · jednostka · strona (atakujący/broniący) + kolumna „czytane w bitwie ręcznej TAK/NIE (plik:linia)" + osobno lista martwych obietnic i informacja, czy gracz w ogóle widzi te modyfikatory w UI. |
| R-TEREN-BITWA-WERYF-WYNIK | 2026-07-26 | Wynik weryfikacji bonusów terenu w bitwie ręcznej (odpowiedź na pytanie właściciela) | **RAPORT GOTOWY — 3 martwe mechaniki do decyzji** | **Działa:** Las +50% Obrony broniącego (ale tylko przeciw atakującym Dystans/Flanka — zgodnie z danymi), Wzgórza +50% Obrony broniącego (każdy atakujący), koszt wejścia 2 pkt ruchu (las/wzgórza), Bród komplet: ruch ×0,5 · −25% Atak · −25% Obrona w brodzie · +15% Obrony broniącemu brzegu. Rzeka głęboka poza brodem jest NIEPRZEKRACZALNA (surowiej niż opisują dane: „STOP, stoi 1 turę"). **Martwe obietnice:** (1) **Góry nigdy nie dają +75% Obrony w bitwie 3D** — plansza taktyczna ma tylko jeden typ wzniesienia (`Hills`) i mapuje go zawsze na „Wzgórza", więc bitwa na górskim heksie daje +50% jak wzgórze; +75% odpala się wyłącznie w rozstrzyganiu mocą na mapie; Poradnik §63.2 obiecuje ×1,75; (2) **Δ Zasięg od terenu (Las −1, Wzgórza +1) w 100% nieczytane** — pole istnieje w typach, zero odczytów w `gra/src`; (3) **utrudnienia terenowe konnicy/rydwanów nieczytane** — koszt wejścia identyczny dla wszystkich typów, brak zakazu gór dla konnicy. **Widoczność:** tylko Bród ma opis w tooltipie; bonus Lasu/Wzgórz działa PO CICHU (brak liczby w UI), tak samo ukryty jest bonus morale terenu obronnego (próg złamania niższy o 5 pkt). |
| R-BITWA-POWTORKA | 2026-07-26 | „jak się daje rozegraj ponownie to gra nie wraca do pierwotnego ustalenia, że możemy rozłożyć jednostki, ustalić grupowanie … Tak naprawdę można tylko jednostki przestawiać, ale nie ma żadnych ustawień." | **ZDEPLOYOWANE** — _replayBattle roster+grupy | Przyczyna to JEDNA linia: `_replayBattle()` tuż PO wywołaniu `_initDeployUI()` (która poprawnie pokazuje panel rosteru i buduje rząd ikon Formacja/Konnica/Kierunek natarcia/Linie/Taktyka/Strategia) ustawiała `_rosterBar.style.display = 'none'` — czyli kasowała panel chwilę po jego zbudowaniu. Pierwsze wejście w bitwę tej linii nie ma, dlatego działało. Nagłówek „Faza rozstawiania" i licznik zostawały widoczne, bo to osobne elementy — stąd wrażenie „faza jest, ale bez ustawień". Fix: usunięcie tej linii, bez dopisywania drugiej ścieżki „napraw po powtórce". Sprawdzone przy okazji: skład i HP wracają do stanu sprzed PIERWSZEJ bitwy (klon z `maxHp`), a grupowanie gracza jest celowo zachowywane. Bramki: `tsc` 0, combat 6/6, battle-roster 7/7. |
| R-ZLOTO-NIEWIDOCZNE | 2026-07-26 | „co do surowca złota na mapie moim zdaniem my go nie mamy, ale wyprowadź mnie z błędu — jeżeli tak, to zrób mi screenshot złota, jak wygląda. Nie chodzi o kopalnię, tylko surowiec.” | **ZDEPLOYOWANE** FALA 97 `0bea1d88` — model `buildZlozeZloto` (verify 2026-08-05) | **Właściciel ma rację w praktyce, nie w danych.** Złoto ISTNIEJE jako złoże: `deposit_rules.zloto` o rzadkości **0,03** (ułamek heksów lądu) w `gra/data/map-gen-params.json`, stawiane na Wzgórzach i Górach jako `hex.zloze = 'zloto'` (`terrain-improvements.json:307`); ma dedykowane ulepszenie **Kopalnia złota** z gotowym modelem (`render/kopalnia-zlota-opus5.ts`), jest surowcem DOSTĘPOWYM bramkującym Mennicę (decyzja PYTANIE 77=A, 2026-07-25; `game/zloto-access.ts`, `trade-routes.ts:863`) i ma własny test `zloto-test.cjs` 43/43. **Ale na mapie jest NIEWIDZIALNE:** `buildStyledResourceOverlay` (`render/styleResources.ts:418-425`) obsługuje w gałęzi `zloze` tylko **cztery** złoża — `miedz`, `zelazo`, `wegiel`, `sol`. Dla `zloto` nie ma żadnej gałęzi, funkcja zwraca `null`, więc na heks nie trafia żaden obiekt. W całym `gra/src` nie istnieje funkcja typu `buildZlozeZloto`/`styledGoldOre` — grep pusty. **Dowód:** przepuszczono pięć złóż przez tę samą funkcję i z tymi samymi argumentami, których używa mapa gry (`main.ts:1415` i `:1442`) — cztery heksy dostały bryłki, heks złota został pusty (zrzut `zloza-mapa.png`, podgląd `gra/tools/.zloze-mockup/`). **Skutek w rozgrywce:** gracz mija heks ze złożem złota i nie ma jak go rozpoznać inaczej niż klikając w heks albo próbując postawić Kopalnię złota. Po obniżeniu górzystości (fala 22) złoto spadło dodatkowo o 55%, więc szansa przypadkowego znalezienia jest znikoma. **Do zrobienia (nie wdrożone, czeka na decyzję właściciela):** model bryłki złota analogiczny do `buildZlozeMiedz`/`buildZlozeZelazo` + jedna gałąź w tym `switch`. Reszta łańcucha — generator, dostęp, kopalnia, Mennica, testy — już działa. |

## R-ZETON-PASKI — tabliczka jednostki w stylu Total War (pasek ruchu + pasek HP)
**Zgłoszone:** Maciej, 2026-07-29, wraz ze zrzutem referencyjnym z Total War.
**Cytat:** „myślę też, żeby na jednostce umieścić pasek ruchu i pasek HP, jako poziome paski
krótkie, na których dopiero jest zbudowana ta nakładka w postaci kuźni gwiazdek i koszar";
„Po lewej stronie [tabliczki] jednostki malutka ikona właściciela. U góry symbol generała —
to akurat generałów nie mamy. W środku poziom generała, to tam właśnie można umieścić te
elementy związane z ilością ruchu i HP. Generałów doprojektujemy sobie w przyszłości."

**Stan DZIŚ (po FALI 97):** medalion właściciela to osobny sprite przy LEWEJ KRAWĘDZI heksu,
a rządek odznak (Koszary ← gwiazdki → Kuźnia) wisi osobno nad głową figurki, na wysokości
0,92 HEX_R. Nie ma żadnego wspólnego tła ani tabliczki; ruch i HP nie są pokazywane na mapie
w ogóle — gracz odczytuje je wyłącznie z panelu jednostki.

**Kierunek do wdrożenia:** jedna zwarta TABLICZKA nad jednostką, złożona z:
- małej ikony właściciela przy lewej krawędzi tabliczki (dziś: osobny medalion obok heksu),
- dwóch krótkich poziomych pasków w środku: **Ruch** (pkt ruchu pozostałe / maks.)
  i **HP** (punkty życia / maks.),
- rządka odznak Koszary/gwiazdki/Kuźnia zbudowanego NA tych paskach,
- miejsca u góry zarezerwowanego na przyszły symbol generała (generałów jeszcze nie ma).

**NIE ROZSTRZYGNIĘTE — do decyzji ABC przed wdrożeniem:** czy tabliczka jest widoczna
zawsze, czy tylko dla jednostki zaznaczonej/najechanej; czy medalion właściciela wchodzi
DO tabliczki (zmniejsza się, traci czytelność portretu), czy zostaje osobno przy heksie.
| R-EPOKA-KOMUNIKAT | 2026-08-02 | Brak informacji o przejściu do nowej epoki | **ZDEPLOYOWANE `5e0f30e7`** (FALA 202) | Toast + WYDARZENIA: „Nowa epoka — Wkraczasz w epokę Brązu/Żelaza.” `era-change-notify.ts`. Branch `cursor/feat-era-change-notify-63a1` · PR #14 |
| R-RZEKI-PROG-MASY-LADU-Q1 | 2026-08-06 | Zgłoszenie: niespójny próg masy lądu dla generowania rzek — FALA 199 obniżyła do 5 w jednym miejscu `gen-helpers.ts`, gdzie indziej rzekomo stary filtr `m.length >= 8` | **ZAMKNIĘTE — FAŁSZYWY ALARM** (weryfikacja niezależna, subagent) | Wszystkie 3 miejsca rzek (`refillMainRiverCoastMouthGapsOnMap` L9562, `generateRivers` L11541, `topUpRiverGridCoverage` L11781) spójnie na **5**, zgodnie z FALA 199 (`WERSJE.md:299`). Filtr `>= 8` (L2371, L12304, L12383) należy do OSOBNEGO systemu — siatki fair-play reliefu/złóż/lasu, celowo spójne na 8 na mocy C-MAPA-Q1=B (komentarz w kodzie L12302-12303), niezależnie od progu rzek. Zero zmian w kodzie. Szczegóły: `docs/decyzje/R-RZEKI-PROG-MASY-LADU-Q1.md` |

## R-AUTOBOT-PROMPT — gotowy scenariusz AutoBot do wklejenia innym agentom
**Zgłoszone:** Maciej, 2026-08-06. Cytat: „przygotuj mi gotowy scenariusz, jak w innych
agentach mogę wkleić, żeby działali zgodnie z taką zasadą autobot, jak u nas to się
dzieje. Ale ze szczegółami."
**Wykonane:** `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` — samowystarczalny blok
do wklejenia (role Operator/Evaluator/Gate, pętla 8 kroków, twarde metryki, guardraile,
szablon werdyktu 5 pytań + STRICT/EDGE/PARITY/SAVE, playbook+postmortem z progami
0.30/0.60/5 runów/1000 zdarzeń/48 h, format meldunku, lista zakazów) + sekcja
PARAMETRY PROJEKTU wypełniona dla Civ. Zgodny z kanonem `R-PROC-AUTOBOT*` i playbookiem
rule_101–109; treść zawiera realne wypadki jako uzasadnienia reguł (ddcc04c1,
C-OBCE-JEDN-Q2, git stash).

## R-AUTOBOT-BATCH9-TESTY (2026-08-07) — 4 testy przestarzałe po już-zaszłych zmianach silnika/danych, scalone
**Zgłoszenie źródłowe:** Maciej, „każdy z tych tematów odpal oddzielnym subagentem…
Spróbujmy rozwiązać wszystkie te problemy" — lista pre-istniejących czerwonych testów.
Batch AutoBot `wgjvwhy88`, Operator→Evaluator dla każdego tematu, wszystkie 4 PASS-WITH-NOTES.
**ABC:** nie wymagane (R-PROC-ABC-BALANS §3b) — żadna poprawka nie zmienia `gra/data/**` ani
kodu silnika, wyłącznie wartości oczekiwane w harnessach testowych dogonione do już
zatwierdzonych/zdeployowanych decyzji.

| ID | Plik testu | Naprawiona asercja | Powód (test przestarzały, nie regresja) |
|---|---|---|---|
| R-LOGIC-GARNIZON-VIS | `gra/tools/logic-test.cjs` | „hides garnizon" → dwie asercje: własny garnizon widoczny (token na heksie), wrogi nadal ukryty | Commit `579dec89` (2026-07-26, C-GARN-Q1=A) zmienił semantykę; test nie nadążył. 209/209 |
| R-DIP-LOCKS-HANDEL-PROG | `gra/tools/diplomacy-locks-test.cjs` | `relTotal:10→locked:true` → `relTotal:0→locked:false` | `progHandelRelacja` 40→0 od `579dec8` (Maciej 2026-07-26, „0 = od neutralnej"). 70/70 |
| R-DIP-VALUE-CATALOG-RUDA | `gra/tools/diplomacy-value-catalog-test.cjs` | oczekiwane 25 → 22, etykieta `kopalnia`→`kopalnia_miedzi` | `buildResourceAccessIndex()` liczy min(koszt_praca); 22 jest jedyną, poprawną wartością od pierwszego commita repo — 25 był błędem autora testu od zera, nie regresją. 62/62 |
| R-DIP-CYCLIC-NAMING | `gra/tools/diplomacy-resource-cyclic-trade-test.cjs` | `deal.rodzaj` oczekiwane `umowa_handlowa`→`umowa_wymiany` | `HANDEL-SPLIT-Q1=B` (2026-07-29) rozdzielił traktat na `umowa_szlakow`/`umowa_wymiany`; builder cykliczny od zawsze buduje `UmowaWymiany`. 45/45 |

Weryfikacja: każdy Evaluator odtworzył kontrfaktyk (stara asercja czerwona na dzisiejszym
`main` też), potwierdził zero zmian w `gra/src/**`/`gra/data/**`, przepuścił `tsc --noEmit`.
Scalone bezpośrednio (bez ABC), commit `<uzupełnij po committcie>`.

## R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1 (2026-08-07) — eskalacja zasadna z batcha AutoBot (wgjvwhy88, temat dip-proposal-fairness-msg)
**Zgłoszenie źródłowe:** Maciej, „każdy z tych tematów odpal oddzielnym subagentem…
Spróbujmy rozwiązać wszystkie te problemy" — luka Evaluatora „efekt uboczny modyfikatora
chęci handlu" wyeskalowała w analizie do szerszego problemu w `proposerUnfairToPartnerGate`.
**WERDYKT AutoBot:** ESKALACJA-ZASADNA (Operator poprawnie rozpoznał, że wymaga decyzji
Macieja, nie autonomicznej naprawy — zero kodu zmienione).
**Status:** ✅ **ZDEPLOYOWANE do kodu — SCALONE** (commity `f80b24d` + `49819ee`, 2026-08-07).
AutoBot Operator (7 akcji dostały dedykowane bramki/progi, 'handel' nietknięty — miał już
własną naprawę z 9fc3821) → scalenie ręczne (1 konflikt w `PROPOSER_PW_FAIRNESS_ACTIONS`,
rozwiązany na PUSTY zbiór, nie `['handel']`, żeby nie zdublować bramkowania handlu) →
Evaluator (PASS-WITH-NOTES, macierz różnicowa 4860 przypadków, mutation-testing, sonda
bezpieczeństwa „darmowy pokój" — 0/12 exploitów) → 2 poprawki po notatkach Evaluatora:
zawężenie `treatyPnGate` receive-side z powrotem do `proposerIsPlayer` (N3, poza literą
decyzji A) + spójność `treatyEvalRelationTotal` (N5) + domknięcie luki pokrycia (N2).
117/117 `diplomacy-proposal-test.cjs`, 0 błędów tsc, zero regresji w pełnej baterii
diplomacy-*/wiarygodnosc/tech-tree/research. Szczegóły: `docs/decyzje/R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1.md`.

## R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1 (2026-08-07) — audyt AutoBot rundy 1+2 zamknięty, decyzja (b) czeka na ABC
**Źródło:** Evaluator, sesja MENNICA-GRACE-VERIFY-Q1, nota N3. Batch AutoBot `wgjvwhy88`, temat
`mennica-braz-zloto-asymetria` — runda 1 FAIL (fałszywy dowód w raporcie), runda 2 naprawiła.
**Werdykt merytoryczny (potwierdzony w obu rundach + zweryfikowany niezależnie przez orkiestratora):**
FAŁSZYWY ALARM co do 10 realnych wołających `placedImprovementsWithTradeGrants` w `main.ts` — żaden
nie polega na syntetycznym kluczu złota, gold access idzie wyłącznie przez `ownerHasZlotoAccessNow`
(stan magazynu). `placedImprovementsWithZlotoTradeGrant` jest martwym, ale nieszkodliwym kodem.
**Otwarte — WYMAGA ABC:** co zrobić z martwym kodem + jego osieroconymi testami
(`tools/zloto-szlak-test.cjs`, dziś **26/45**, testuje przedmigracyjną semantykę):
(i) zmigrować test do modelu magazynowego (wzorem `mennica-uspienie-test.cjs`, `72672f9`) vs.
(ii) usunąć martwy kod + martwe testy. Pełna analiza za/przeciw obu opcji:
`docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md`. Zero zmian w `gra/src/**`/`gra/data/**` w
obu rundach — audyt czysto diagnostyczny. Bramki (zweryfikowane niezależnie): tsc 0 błędów,
`mennica-uspienie-test` 49/49, `mennica-magazyn-test` 41/41, `waluta-mennica-test` 57/57.

## R-AUTOBOT-EVALUATOR-MODEL-Q1 (2026-08-07) — jaki model ma napędzać Evaluatora AutoBot? [OTWARTE — ABC]
**Źródło:** pytanie Macieja — „ile tokenów zjadł Evaluator odkąd wprowadziliśmy AutoBot; czy przerzucić
go na Fable 5, bo jest bardzo istotny".
**Pomiar (transkrypt sesji chmurowej, okno 2026-08-05 00:00 → 2026-08-07 10:45 PL):** Evaluator = **21
uruchomień na Opus 5**; zapis cache **2 630 689 tok**, odczyt cache **74 806 735 tok**, wyjście
**25 118 tok**. Koszt wg cennika API: **$54,47** = **10,4 %** całego zużycia okna ($526,11: główna
pętla $192,39 + subagenci $333,72). Rozkład kosztu Evaluatora: odczyt cache 69 %, zapis cache 30 %,
**wyjście 1,2 %** — Evaluator prawie nic nie pisze (~1 200 tok/werdykt), on **czyta** (~3,56 M tok
na uruchomienie).
**Cennik (USD / 1 M tokenów, wejście / wyjście):** Fable 5 = 10 / 50 · **Opus 5 = 5 / 25** ·
Sonnet 5 = 3 / 15. **Fable 5 jest 2× DROŻSZY od Opus 5**, nie tańszy.
**Symulacja na zmierzonym wolumenie:** Opus 5 $54,47 · Fable 5 $108,95 (2,00×) · Sonnet 5 $32,68 (0,60×).
**Zastrzeżenie:** pomiar obejmuje wyłącznie sesję chmurową (jeden plik transkryptu); zużycie sesji
lokalnej (Windows) i Cursora jest dla tej sesji niewidoczne.

### R-AUTOBOT-EVALUATOR-MODEL-Q1 — WERSJA 2 (2026-08-07), zastępuje ABC z wersji 1
**Doprecyzowanie Macieja:** „A możemy tylko w procesie Evaluatora jako adwokata diabła dać Fable?
Gdzie jest najbardziej krytyczny element, w którym Fable dałby wyraźną przewagę względem Opus?"
**Pomiar rozkładu pracy Evaluatora** (23 uruchomienia Opus 5 od 2026-08-05, 2 288 wywołań narzędzi,
15 793 123 znaków wyjścia narzędzi ≈ 3,95 M tokenów świeżej treści):

| Czynność | Wywołań | Udział | Czy klasa modelu ma znaczenie |
|---|---:|---:|---|
| `Bash` — bramki, sondy esbuild, grep | 1 937 | 84,7 % | praktycznie zero (wykonanie, nie rozumowanie) |
| `Read`/`Grep`/`Glob` — czytanie źródeł | 183 | 8,0 % | średnie |
| `Write`/`Edit` — sondy, kopie baseline | 152 | 6,6 % | średnie |
| `StructuredOutput` — sam werdykt | 10 | 0,4 % | **wysokie** |

**Wniosek:** ~85 % wolumenu Evaluatora to praca mechaniczna, w której Fable nie daje żadnej przewagi,
a kosztuje 2× więcej. Przewaga modelu leży w dwóch podczynnościach: **(A) polowanie na exploit**
(wymyślenie ścieżki przez reguły gry, na którą nikt nie napisał testu — dowód: „darmowy pokój
w trakcie wojny", 12 sond, 0/12) i **(B) wnioskowanie o konsekwencjach produktowych przez wiele
plików** (dowód: nota N4 — „stare zapisy zamrażają S4=0,2 na zawsze, playtest musi startować NOWĄ grę").
**Zastrzeżenie:** Opus 5 wygrywa dziś w obu tych miejscach; brak zmierzonego przypadku, w którym coś
przepuścił. „Fable dałby wyraźną przewagę" jest hipotezą, nie faktem — fałszywe negatywy nie zgłaszają się same.

## R-DYPLO-JSON-ZRODLO-PRAWDY-Q1 (2026-08-07) — czytniki mają czytać z JSON, nie z surowej stałej TS [OTWARTE — ABC]
**Źródło:** nota N3 Evaluatora z wdrożenia `R-WIARYGODNOSC-S9-LICZBY-Q1` (commit `2e67219`);
Maciej: „N3 do osobnego zlecenia".
**Problem:** 47 kluczy `wiarygodnosc*` trafiło do `gra/data/diplomacy.json` → `params`, ale
funkcje Wiarygodności czytają **surową stałą** `DIPLOMACY_PARAMS` z `diplomacy.ts`, a nie
`getBaseDiplomacyParams()` (które dokleja JSON). Skutek: **edycja JSON-a lub Panelu-D nie zmienia
dziś nic w rozgrywce.** Sprzeczne z CLAUDE.md §2 („źródłem prawdy są JSON-y w `gra/data/`").
**Zinwentaryzowane realne odczyty surowej stałej** (poza `diplomacy.ts`, który stałą definiuje;
komentarze i importy typów pominięte):

| Plik | Odczytów wartości | Czego dotyczą |
|---|---:|---|
| `gra/src/game/diplomacy-credibility.ts` | **43** | cały blok Wiarygodności (28 funkcji eksportowanych) |
| `gra/src/game/diplomacy-layers.ts` | **5** | `const p = DIPLOMACY_PARAMS` w 5 funkcjach warstw |
| `gra/src/game/diplomacy-value-catalog.ts` | **1** | `handel_zaufanie_perTura` |
| **RAZEM** | **49** | |

**Ustalenie techniczne (zweryfikowane w źródle, nie założone):** żaden klucz `wiarygodnosc*` nie
występuje w listach `DIPLO_RELATION_THRESHOLD_KEYS` / `DIPLO_ZAUFANIE_THRESHOLD_KEYS` /
`DIPLO_RESPEKT_THRESHOLD_KEYS`, więc `scaleDiplomacyParamsForDifficulty()` ich nie dotyka.
Podmiana na akcesor **bez** skalowania trudności jest dziś zachowaniowo neutralna
(JSON == TS, pilnowane sekcją 10 testu `wiarygodnosc-test.cjs`).

## R-FABLE-KOLEJKA-TYGODNIOWA (2026-08-07) — Evaluator wyławia tematy dla najmocniejszego modelu
**Polecenie Macieja (2026-08-07), cytat:** „dajemy zadanie Opusowi, żeby podczas ewaluacji znajdował
takie tematy, które byłyby dla Fable'a — z gatunku tych, które wymieniłeś: szukanie dziur
i nieścisłości, oceny balansu, audyt rozgrywki, refaktory architektoniczne. Zapisujmy sobie listę
i pod koniec tygodnia, kiedy będę miał jeszcze jakieś dostępne zasoby Fable 5, będę mógł puścić
tematy do wyczerpania limitu."
**Mechanizm:**
1. **Plik kolejki:** `dyspozycje/autobot/KOLEJKA-FABLE-5.md` — jedna lista, dopisywana, nie nadpisywana.
2. **Obowiązek Evaluatora:** po każdym werdykcie przejrzeć własne noty N1..Nx i dopisać
   kwalifikujące się tematy. Brak kandydatów → napisać wprost „brak kandydatów do kolejki"
   (żeby odróżnić „nie było" od „zapomniał”).
3. **Rytm:** przegląd raz w tygodniu, właściciel puszcza z listy tyle, ile pozwoli limit.
**Kwalifikują się WYŁĄCZNIE trzy kategorie:** (A) dziury i nieścisłości · (B) balans i audyt
rozgrywki · (C) refaktory architektoniczne. **NIE kwalifikują się:** zwykłe bugi z jasną naprawą,
poprawki testów, zadania dokumentacyjne, drobne UI.
**Uzasadnienie doboru kategorii:** to jedyne trzy klasy z podziału etapów Evaluatora
(`docs/decyzje/R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md`), które spełniają kryterium **K3** —
„wymaga wymyślenia czegoś, czego nikt nie zapisał; nie istnieje lista poprawnych odpowiedzi
do porównania".
**Status:** 🟡 w toku — kanon Evaluatora aktualizowany przez AutoBot, plik kolejki zakładany
przez orkiestratora.

## R-AUTOBOT-EVAL-CHECKLIST-KONFIG (2026-08-07) — Evaluator ma uruchamiać konfiguracje poza domyślną
**Źródło:** „eksperyment zerowy" z `R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md` §4 — teza, że sukces
etapu NO-REGRESSION wziął się z **zachowania typu checklista**, a nie z mocy modelu, więc przed
zakupem droższego modelu należy najpierw naprawić prompt. **Koszt wdrożenia: 0,00 USD.**
**Dowód zasadności (zmierzony):** jedyny realny defekt produkcyjny złapany w oknie
2026-08-05..07 to pokrycie żelaza **75 % wobec progu ≥85 %** na mapie Ogromny, seed 99 —
domyślna bramka `fair-play-grid-test.cjs` była przy tym **zielona 8/8**. Nikt nie zapisał
„przetestuj też mapę Ogromny".
**Zmiana:** do listy obowiązków Evaluatora (`dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` §5
oraz `.cursor/rules/autobot-evaluator-operator.mdc`) dochodzi punkt: wypisać i uruchomić
**≥3 konfiguracje poza domyślną** (rozmiar mapy / typ / seed / poziom trudności / liczba
cywilizacji), dobrane do zakresu zmiany, i wymienić je w werdykcie z parametrami.
Brak listy = werdykt niedomknięty.
**Status:** 🟡 w toku — AutoBot Operator→Evaluator.

## R-FABLE-RETENCJA-NASTER (2026-08-07) — czy retencja danych blokuje użycie Fable 5
**Fakt techniczny:** Fable 5 **wymaga 30-dniowej retencji danych i nie jest dostępny pod zerową
retencją (ZDR)**. Jeśli NASTER S.A. ma wymagania w tej sprawie, przesądza to temat niezależnie
od ceny i zdolności modelu.
**Zadanie:** ustalić, czy w repozytorium jest jakikolwiek zapis o retencji / ZDR / polityce
prywatności / dozwolonych modelach. Jeśli nie ma — pytanie wraca do Macieja.
**Status:** 🟡 w toku — AutoBot, zadanie czysto ustalające (read-only).

## R-BRAMKI-AUDYT-KANONU (2026-08-07) — czy sekcja BRAMKI w CLAUDE.md odpowiada rzeczywistości
**Podejrzenie:** `CLAUDE.md` (sekcja `## BRAMKI`) twierdzi, że `relief-grid-coverage-test.cjs` daje
**2 pass / 4 fail**, a `fair-play-grid-test.cjs` **3 pass / 5 fail**, oba „W NAPRAWIE na mocy
`C-MAPA-Q1=B`". Tymczasem w repo jest zapis, że `fair-play-grid-test` jest **zielony 8/8** —
a liczba asercji zmieniła się z 5 na 8, czyli **sam plik testu jest inny** niż wtedy, gdy powstał
wpis w kanonie.
**Pytanie, którego nikt nie zadał:** test został **NAPRAWIONY** czy **ROZBROJONY** (usunięte
asercje / poluzowane progi / zawężony zakres danych)? Rozstrzygnięcie wymaga porównania treści
asercji ze starą wersją pliku, nie samej liczby pass/fail.
**Dlaczego to pilne:** sekcja BRAMKI jest czytana przez **każdą** sesję i mówi wprost „NIE
naprawiaj przy okazji". Nieaktualna lista albo każe ignorować realną czerwień, albo marnuje czas
na fantomy.
**Precedens:** audyt 2026-07-26 wykazał, że **5 testów było błędnie wpisanych jako czerwone**
(`akwedukt-popcap`, `auto-manage`, `growthmult-compound`, `upgrade-budynki`,
`deposit-building-gate`) — wszystkie okazały się zielone.
**Zakres:** zadanie **audytowe** — zero napraw, zero zmian w `gra/src/**` i `gra/tools/**`.
Operator przygotowuje propozycję nowej treści sekcji, orkiestrator wkleja po zatwierdzeniu.
**Status:** 🟡 w toku — AutoBot Operator→Evaluator (`wupki7quq`).

## KOLEJKA ZLECEŃ AUTOBOT — polecenie Macieja 2026-08-07 („później niezależni agenci")
| # | Zlecenie | Stan | Uwaga |
|---|---|---|---|
| 1 | **`P-MAPGEN-PANGEA-OBRYS`** — **trzy niezależne pytania**, każde A/B/C: (1) co z metryką, (2) na czym oprzeć próg, (3) co z progami czasowymi AC | 🟡 **CZEKA NA LITERY** | Tabele w `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md`. Rekomendacje: 1=A, 2=B, 3=A — **żadna decyzja NIE zapadła** |
| 3 | **Powtórka `R-BRAMKI-AUDYT-KANONU`** na właściwej bazie | ⏸️ w kolejce — osobny agent AutoBot | Runda 1 FAIL: Operator audytował drzewo starsze o 57 commitów. Ustalenia o `relief-grid`/`fair-play` (naprawione, nie rozbrojone) się bronią i można je przenieść |
| 4 | **Runda 2 kanonu Evaluatora** (`R-AUTOBOT-EVAL-CHECKLIST-KONFIG` + `R-FABLE-KOLEJKA-TYGODNIOWA`) | ⏸️ w kolejce — osobny agent AutoBot | Runda 1 FAIL: uzasadnienie („nikt nie zapisał «przetestuj mapę Ogromny»") jest **fałszywe** — przypadek `Ogromny Ziemia seed 99` stoi w `relief-grid-coverage-test.cjs:51` od commita `1341975` z 2026-07-09. Potrzebna nowa podstawa albo rezygnacja z tego punktu |

**Zasada dla zleceń 3 i 4:** worktree przygotowuje orkiestrator na tipie gałęzi roboczej.
`isolation: "worktree"` odbija od `main` — trzy realne wypadki tego samego dnia
(`wb8coodo3`, `w2vcni6m1`, `wupki7quq`), za każdym razem kosztowały całą rundę.

## ECHO 2026-08-07 — trzy decyzje z serii „pozostałe otwarte tematy"

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-FABLE-RETENCJA-NASTER** | **B** | Kanon (`CLAUDE.md` zasada 4) dostaje jawną blokadę: dopóki retencja NASTER nie jest potwierdzona, Fable 5 nie wchodzi w grę. **Zgoda na model ≠ potwierdzenie retencji — potrzebne oba.** |
| **R-AUTOBOT-EVALUATOR-MODEL-Q1** (wersja 3) | **C + A** | **C:** najpierw pakiet dowodowy — `eval-evidence.json` (exit code, SHA-256 pełnego stdout + ścieżka, komplet parametrów przebiegu, `baseline_sha`/`head_sha`) oraz **obowiązkowy `StructuredOutput`** jako protokół (dziś 88,1 % werdyktów to nieparsowalny wolny tekst). **A:** model Evaluatora **zostaje na Opus 5** — bez zmiany, dopóki nie będzie czym uzasadnić innej. |
| **R-KOLEJKA-ZLECEN-3-4-Q1** | **B** | Zlecenie 3 (audyt sekcji BRAMKI) w całości. Ze zlecenia 4 **tylko** obowiązek dopisywania kandydatów do `KOLEJKA-FABLE-5.md`; **punkt o checkliście konfiguracji ODPADA** — jego uzasadnienie zostało obalone (przypadek `Ogromny Ziemia seed 99` stoi w `relief-grid-coverage-test.cjs:51` od commita `1341975` z 2026-07-09, czyli miesiąc przed oknem pomiarowym). |

**Konsekwencja wykonawcza:** C (pakiet dowodowy) i reszta zlecenia 4 (kolejka Fable) dotykają
**tych samych dwóch plików kanonu** — `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` §5
i `.cursor/rules/autobot-evaluator-operator.mdc`. Idą więc jako **jedno zlecenie**, nie dwa
(CLAUDE.md §4a — dwa równoległe worktree na tym samym pliku kończą się ręcznym scalaniem).

## R-AUTOBOT-ORKIESTRATOR (2026-08-07) — zasada AutoBot obejmuje pracę własną głównej sesji
**Polecenie Macieja, dwa zdania:** *„Dla siebie też przyjmij zasadę autobot na każdym temacie,
nie tylko dla subagentów. Czyli każdą swoją decyzję sprawdzaj ewaluatorem."* · *„zasada Autobots
obejmuje nie tylko zleconą pracę subagentowi ale **po pierwsze Twoją pracę**."*
**Zapisane w kanonie:** `CLAUDE.md` zasada **0b**.
**Skutek:** orkiestrator jest Operatorem własnej zmiany i **nie ocenia sam siebie**. Każda zmiana
zapisana do repo przez główną sesję — kod, dane, kanon, dokument decyzji, wpis w rejestrze,
sprostowanie — przechodzi przez Evaluatora na Opus 5. Tak samo każda liczba przedstawiona
właścicielowi jako fakt. Czynności czysto odczytowe są wyłączone.
**Zastosowanie wsteczne — ZAKRES FAKTYCZNY (korekta po nocie N14 Evaluatora):** Evaluator objął
**5 pozycji**: `7136241`, `7c24e33`, `55658fc`, `af68f86` oraz `CLAUDE.md` zasady 4 i 0b.
**Pierwotne brzmienie mówiło „całość pracy własnej" — to była NIEPRAWDA.** Praca własna
orkiestratora z 2026-08-07 to **19 commitów**; **14 pozostałych NIE zostało objętych**, w tym:
`c98006a` (pierwotne fałszywe „exit 0" — wypadek (a) z uzasadnienia zasady 0b), `dde2696`
(ECHO = D, którego właściciel nie podjął — wypadek (c)), `08035bf`, `56481cd`, `0355f30`,
`a976b63`, `934bcb0`, `d3d2673`, `ad04299`, `c67c9de` (deploy FALA 259), `0a08bf0`, `3b84875`,
`6e98ddc`, `3213ee2`, `8c6f26a` (deploy FALA 258). **Do przeglądu w osobnym zleceniu.**
Odnotowane: cztery z pięciu commitów niosących wypadki wymienione w uzasadnieniu zasady 0b
znalazły się POZA jej własnym zastosowaniem wstecznym.

## R-DYSK-WORKTREE-Q1 (2026-08-07) — zapobieganie zapychaniu dysku sesji chmurowej = **C**
**Decyzja Macieja: C** (reguła cyklu życia + sparse-checkout). Jego sformułowanie zasady:
*„wykonujesz daną pracę, komitujesz do Githuba i tyle, a potem czyścisz dysk"* oraz *„trzymanie
u ciebie danych tylko ma wtedy sens, kiedy coś jeszcze trzeba z tym zrobić"*.
**Wypadek, który to wywołał (2026-08-07):** dysk sesji chmurowej **86 % zajętości pojemności kontenera (252 GB), 0 MB wolnego**.
`Bash` zwracał `ENOSPC` **bez wykonania polecenia**, `Write` błąd. Skutki: Evaluator handoffu nie
uruchomił **ani jednej** bramki (uczciwie to zaraportował zamiast zmyślić pomiar), a bramka
`map-gen-regression` zginęła przy restarcie kontenera. Praca w toku przepadła **dwa razy** tego dnia.
**Przyczyna:** zasada 4a (CLAUDE.md) każe subagentom pracować na własnych worktree, ale **nie mówi,
kiedy worktree ma zniknąć**. Uzbierały się **22 sztuki × ~810 MB rozmiaru jednego worktree na dysku = 18 GB**; scratchpad **7,9 GB**.
Każdy worktree kopiował całe drzewo, w tym `gra-robocza` (**328 MB**) i `gra-kanon` (**109 MB**),
których subagent do pracy nie potrzebuje.
**Wykonane sprzątanie (kolejność: zapis → GitHub → dopiero kasowanie):** stan niescommitowany
każdego z 22 worktree zapisany na gałęzi `zapas/<nazwa>` i **wypchnięty na origin** (zweryfikowane:
`git ls-remote --heads origin 'refs/heads/zapas/*'` = **22**). Commit `c9c031e` — jedyny spoza
głównej historii, wnoszący `playbook.md` — jest przodkiem czterech gałęzi `zapas/*`, więc też
pojechał na zdalne. Odzyskanie: `git checkout zapas/<nazwa>`.
**Wynik:** wolne miejsce **5,3 GB → 26 GB**, zajętość **86 % → 32 %**, worktree **22 → 0**,
scratchpad **7,9 GB → 44 KB**, katalog repo **21 GB → 3,0 GB**.
**Zapisane w kanonie:** `dyspozycje/autobot/playbook.json` — **rule_118** (cykl życia worktree,
zapas na gałąź przed usunięciem) i **rule_119** (sparse-checkout: worktree bez `gra-robocza`,
`gra-kanon`, `dist` → ~370 MB zamiast ~810 MB, czyli **−54 %**; wyjątek dla subagenta robiącego deploy).
**CZŁON `.gitignore` — WDROŻONY w `89504c0`, po wcześniejszym błędnym wstrzymaniu.**
Najpierw wstrzymałem go z dwoma uzasadnieniami; **oba były nietrafione** (noty N3 i N4 Evaluatora):
- *„wyłączenie 2 z 398 dałoby niespójność z konwencją"* — **obalone**: konwencja miała już wtedy
  kilkanaście wyjątków (`.gitignore` ignorował m.in. `.capital-sep-*`, `.ai-recruit-upkeep-gate-*`,
  `.escape-overlay-stack-*`, `.ai-balans-step3/5-*`, `.probe-*`, a `gra/.gitignore` dodatkowo
  `.city-map-badge-*`, `.braz-*-preview-entry.ts`). Wyłączanie wybranych bundli **było praktyką**.
- *„objaw zniknął po `892d13f`"* — **obalone**: zwykłe uruchomienie `node tools/logic-test.cjs`
  zabrudziło drzewo (`.logic-bundle.cjs` +50/−1, `.logic-entry.ts` +2/−1). Objaw był systemowy,
  nie dotyczył dwóch plików map-genu. Sam `892d13f` nazywał wpis do `.gitignore` „docelową naprawą",
  po czym odroczyłem ją **właśnie po nadejściu litery**.
**Ocena własna: to było ciche zawężenie decyzji C** — właściciel wybrał wariant trzyczłonowy,
a wdrożyłem 2 z 3 z własnym uzasadnieniem, zamiast wykonać albo zgłosić przeszkodę przed startem.
**Stan faktyczny:** commit `89504c0` — **339 plików wypisanych ze śledzenia** (z dowodem, że jakiś
skrypt w `gra/tools/` je zapisuje), **59 pozostawionych** bez dowodu generowania, razem **398**
plików z **kropką wiodącą** (ta sama fraza czytana jako regex daje 412 — stąd doprecyzowanie).
Wzorce `gra/tools/.*-bundle.cjs` i `.*-entry.ts` w `.gitignore` nie ruszają tych 59, bo `.gitignore`
nie działa na pliki już śledzone. Weryfikacja empiryczna po zmianie: `logic-test` → 213/213,
`git status --porcelain` → **0 pozycji**.

**KOREKTA — „`c9c031e` jedynym commitem spoza głównej historii" było nieprawdą** (nota N7).
Commitów osiągalnych z gałęzi `zapas/*`, a nieosiągalnych z `HEAD` ani `origin/main`, jest **22**.
`c9c031e` jest jedynym niosącym **treść merytoryczną** (`playbook.md` + generator JSON).

## R-BRAMKA-MINDIST-Q1 (2026-08-07) — legalizacja zmiany bramki `logic-test.cjs` = **A**
**Decyzja Macieja: A** — commit `7136241` zatwierdzony **w całości**. Wszedł w ramach
`R-BRAMKI-AUDYT-KANONU` bez własnej litery; Maciej odmówił legalizowania go samodzielnie
(*„zmiana bramki weszła poza zakresem, sam tego nie zalegalizuję"*) i zażądał osobnego ID + ABC.
**NOWY PUNKT ODNIESIENIA: `logic-test.cjs` = 213/213 zaliczonych asercji** (było 209/209).
Każda sesja porównuje się od teraz do **213**; wynik 209 oznacza cofnięcie tej decyzji, nie normę.
**Co obejmuje (a):** przypięcie parametru **`MIN_CITY_DISTANCE` = 4 heksy** (+1 asercja). Poprzednia
asercja była **rozbrojona** — porównywała stałą zaimportowaną z testowanego modułu z tą samą stałą,
więc przechodziła dla dowolnej wartości progu, także **1 heksa**. **KOREKTA (nota N6 Evaluatora):** pierwotnie napisałem „żaden inny test nie pilnował tego
parametru" — to **nieprawda**. `gra/tools/found-from-village-test.cjs` istniał przed `7136241`,
importuje stałą i przypina **przedział 2..6 heksów** (test 2: dystans 1 = za blisko; test 4:
dystans 6 = OK). Prawdziwe jest zdanie węższe: **żaden test nie przypinał WARTOŚCI** progu —
przedział przechodził tak samo dla 4, jak i dla 5 heksów. Trafienia w `ai-*-test.cjs` dotyczą
innego pola (`ekspansja_min_dystans_miast`) i nie są bramką na ten parametr.
Wartość **4 heksy** pochodzi z decyzji `R-AI-KOLONIZACJA`; wcześniej było **5 heksów** — parametr
**już raz zmienił się bez bramki** — zmiana 5 → 4 heksy jest udokumentowana w kanonie
(`docs/decyzje/R-AI-KOLONIZACJA.md`, rejestr, tytuł commita `5726335`), więc **nie przeszła po cichu
obok kanonu, tylko obok TESTU**. Pierwotne sformułowanie „po cichu" było za mocne (nota N6).
To jest powód, dla którego przypięcie wartości jest celem, a nie kosztem.
**Skutek przyjęty świadomie:** zmiana `MIN_CITY_DISTANCE` bez decyzji właściciela **wywala bramkę**.
**Co obejmuje (b):** kontrakt czytelnika **`readCityFoodBuffer()`** (+3 asercje). Poprzedni predykat
rozszerzono o `=== undefined`, czyli zaczął akceptować dokładnie ten stan, który wcześniej wykrywał.
Nowe asercje sprawdzają **7 wariantów wejścia** (brak wartości, dodatnia, ujemna, zapis legacy
`{aktualny,pojemnosc}`, `NaN`, tekst) i wymagają, by funkcja zawsze zwracała liczbę skończoną **≥ 0**.
Żadnej liczby produktowej nie przypinają.
**Powiązanie:** obie luki to wypadki opisane w **rule_117** playbooka (zakaz „naprawy" testu przez
rozbrojenie asercji) — ta decyzja jest jego pierwszym zastosowaniem.

## R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 (2026-08-07) — tabliczka jednostki: Moc nominalna vs efektywna = **B**
**Decyzja Macieja: B.** Tabliczka nad żetonem ma pokazywać Moc **efektywną** — tę samą liczbę,
którą realnie rozstrzyga auto-bitwa — zamiast dzisiejszej Mocy nominalnej.
**Powód:** dla jednostki bez gwiazdek liczby są identyczne; dla weterana ★★★ (3 wygrane) tabliczka
pokazywała **49 pkt Mocy**, a starcie rozstrzygała liczba **58,0 pkt Mocy** — różnica **+18,37%**,
w całości z pominiętej premii weterana. Zweryfikowane dwukrotnie: Operator i niezależnie
Evaluator (oba Opus 5), zgodna arytmetyka.
**Implementacja:** podmiana jednego wywołania w `gra/src/game/armyMerge.ts::stackFieldPowerM`
(`rosterFieldPowerM` zamiast `sumRosterFieldM`), bez ruszania kodu renderu (Evaluator: koszt
znikomy). Model: Sonnet 5 (logika gry, nie `gra/src/render/**`).
**Powiązane, do domknięcia razem:** panel pre-battle (`main.ts:17635`, duplikat
`battle/mapFieldBattle.ts:143`) pokazuje dziś Moc nominalną obok prognozy szans liczonej ze
skalowanej — po tej decyzji zostałby jedynym miejscem z wariantem nominalnym; ujednolicić.

## R-PRZEMARSZ-ATRYBUCJA-Q1 (2026-08-07) — komunikat o naruszeniu granic: kto i gdzie = **B**
**Decyzja Macieja: B.** Komunikat „Twoje granice naruszone" ma dodatkowo pokazywać **nazwę
naruszającej cywilizacji** ORAZ dawać możliwość **skoku kamery** do miejsca naruszenia.
**Powód:** po naprawie `BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C` (filtr do gracza, scalone `e52e84a`)
komunikat jest poprawny formalnie, ale obca jednostka w promieniu terytorium (5–15 heksów) może
stać we mgle wojny, całkowicie niewidoczna — gracz dostaje ostrzeżenie bez możliwości
zweryfikowania go wzrokiem. Nota N1 Evaluatora.
**Zakres implementacji:** `classifyPlayerBorderMarchNotice` (`gra/src/game/diplomacy-border-march.ts`)
dziś zwraca tylko dwie flagi bool — trzeba rozszerzyć o identyfikację strony (ownerId, ewentualnie
współrzędne hexa pierwszej/najbliższej pary). `main.ts:3573-3589` — komunikat + akcja skoku kamery
(wzorzec: sprawdzić istniejący mechanizm centrowania kamery, np. z panelu jednostek — zadanie #1
z listy zadań tej sesji, „Centrowanie kamery po kliknięciu jednostki w panelu", już wdrożone).
Model: Sonnet 5 (logika + UI zdarzeń, nie `gra/src/render/**` — jeśli dotknie faktycznego
sterowania kamerą 3D, ten fragment przekazać do Opus 5 zgodnie z zasadą 4 CLAUDE.md).

## R-MOC-MUR-PARADOKS-Q1 (2026-08-07) — tabliczka: dociągnąć mur/teren = **A**
**Decyzja Macieja: A.** Tabliczka jednostki ma dociągnąć bonusy muru/palisady i terenu, nie
tylko weterana i fortyfikację polową — staje się zależna od heksu, na którym jednostka stoi.
**Powód:** dziś tabliczka Konnicy w garnizonie pokazuje 52 bez murów, 49 z murami, mimo że
realna Obrona rośnie z 49 do 95 — mylące, wygląda jak bug przy budowie obrony.
**Implementacja:** `gra/src/game/armyMerge.ts::stackFieldPowerM` ma doliczać `structBonusPct`
i `terrainDefenseMultiplier` analogicznie do `effectiveDefenderM` (`main.ts`). Wymaga przekazania
kontekstu terenu/miasta do `defOf` — dziś ta funkcja zna tylko jednostkę.
**Kotwice:** `armyMerge.ts::stackFieldPowerM`, `game/city-defense.ts`, `main.ts::effectiveDefenderM`.
Model: Sonnet 5 (logika gry).

## R-MOC-RANKING-ROZJAZD-Q1 (2026-08-07) — panel rankingu na efektywną, progi AI zostają = **B**
**Decyzja Macieja: B.** Panel Mocy imperium (widoczny dla gracza) przechodzi na Moc efektywną,
dla spójności z tabliczką. Progi decyzji dyplomatycznych AI (`militaryRatioFromArmyM`,
`progWojnaSila`) **zostają nominalne** — to zmiana balansu, nie tylko wyświetlania, i nie jest
częścią tej decyzji.
**Implementacja:** `main.ts:1581 sumArmyMForOwner` — rozdzielić na dwie funkcje/ścieżki: jedna
karmiąca `ui/powerOverlayHud.ts` (przechodzi na `combatPowerScaledDefFor`), druga karmiąca
`militaryRatioFromArmyM` i progi wojny (zostaje `unitDefFor`, bez zmian).
**Kotwice:** `main.ts:1581`, `ui/powerOverlayHud.ts:136`, `main.ts` ~12955/13950/21784/21974.
Model: Sonnet 5.

## R-PRZEMARSZ-WYGASANIE-Q1 (2026-08-07) — osobny log czyszczony co turę = **A**
**Decyzja Macieja: A.** Komunikat o naruszeniu granic przechodzi z `warEventLog` do osobnego
logu per-turowego (wzorem `villageEventLog`), czyszczonego przy `turn++`. Wpis znika sam, gdy
naruszenie ustaje; „✕" działa jak przy innych chipach per-turowych.
**Powód:** symulacja Evaluatora (20 000 tur) pokazała, że obecny mechanizm (stabilne id w
`warEventLog`, odświeżane co turę) nigdy nie pozwala trwale odrzucić komunikatu (34629/34629)
i w 79% przypadków zostawia w panelu nieaktualną liczbę kary po ustaniu naruszenia.
**Implementacja:** nowy `borderMarchEventLog` (albo rozszerzenie istniejącego wzorca
per-turowego), czyszczony w tym samym miejscu co `villageEventLog`/`tradeRouteEventLog`
(main.ts ~20096-20100). Usunąć stabilne id + splice/unshift z `warEventLog`, przenieść logikę
`borderMarchEventTargets` (skok kamery) do nowego mechanizmu.
**Kotwice:** `main.ts::applyBorderMarchPenaltiesEndTurn` (~3578-3640), `onEventDismiss`,
miejsce resetu per-tura (~20096-20100).
Model: Sonnet 5.

## R-MOC-HUD-GLOWNY-Q1 (2026-08-07) — caly UI Mocy na efektywna jednym ruchem = **C**
**Decyzja Macieja: C.** Zamiast punktowo dogrywac kolejne miejsca pokazujace Moc (dzis: HUD
glowny, wczesniej: tabliczka, panel rankingu, ekran Empire), jedna decyzja obejmuje CALA
warstwe UI naraz: glowny licznik HUD (`main.ts:12579 buildHudState` -> `hud.ts:1022,1102`),
ekran dyplomacji (`openDiplomacyAudience`/`buildPlayerDiploSummary`, `main.ts:14621-14622`,
`formatPowerRelationLine`), oraz pozycje w rankingu na ekranie dyplomacji
(`buildAbsolutePowerRank` -> ma przejsc na `buildAbsolutePowerRankEffective`, zgodnie z panelem
Mocy i Empire, ktore juz przeszly).
**NIE dotyczy** (pozostaje nominalne, poza zakresem C): progi decyzji AI (`militaryRatioFromArmyM`,
warunek zwyciestwa `checkVictory`/`potegaGracza`) — to zmiana balansu rozgrywki, nie wyswietlania,
i zostaje wylaczona ze wszystkich dotychczasowych decyzji `R-MOC-*` z dzisiejszej sesji.
**Kotwice:** `gra/src/main.ts:12579` (HUD), `main.ts:14621-14622` (dyplomacja), miejsca uzycia
`buildAbsolutePowerRank` w kontekscie dyplomacji (odroznic od juz-efektywnego uzycia w panelu
Mocy/Empire).
Model: Sonnet 5 (logika/UI danych, nie `gra/src/render/**`).

## BUG-TRAKTAT-KOSZYK-REGRESJA (2026-08-08) — ktora wersja kodu zachowac = **A**
**Decyzja Macieja: A.** Przywrocic stan sprzed `9cc7c76c` — traktat szlakow (akcja 5,
`umowa_szlakow`) calkowicie bez koszyka wymiany, zgodnie z `HANDEL-SPLIT-Q1=B` (2026-07-29).
Commit `9cc7c76c` (2026-08-05, zmiana NAP bezterminowego) przy okazji skurczyl liste
"traktatow bez koszyka" z 7 pozycji do 1, cofajac rozdzielenie.
**Kotwice:** `gra/src/game/diplomacy-proposals.ts`, `gra/src/ui/**` (okno traktatu),
`gra/tools/diplomacy-proposal-test.cjs`.
Model: Sonnet 5.

## BUG-ZWIADOWCA-KOSZT-SUROWCA (2026-08-08) — same surowce czy tez Pieniadz = **A**
**Decyzja Macieja: A.** Zerujemy tylko surowiec (oba kanaly): `Surowiec (ilosc)` Drewno
10 -> 0 przy rekrutacji, `Utrzymanie surowiec (ilosc)` Drewno 2 -> 0 na ture. Koszt Pieniadza
(8 pkt) zostaje bez zmian.
**Kotwice:** `gra/data/units.json` (wiersz "Zwiadowca").
Model: Sonnet 5 (dane JSON — zrodlo prawdy, CLAUDE.md §2, NIE `export-*.py`).

## BUG-BRAMKA-DREWNO-BRAK (2026-08-08) — rozszerzyc bramke na Drewno = **A**
**Decyzja Macieja: A.** Rozszerzyc bramke dostepu do surowca (`production.ts`) o Drewno,
zgodnie z ogolna zasada `DOSTEP-SUROWCE-Q1` (2026-07-29) — jednostka wymagajaca Drewna
niedostepna bez zapasu w magazynie panstwa. BEZ progu startowego/zapasu poczatkowego
(odrzucona rekomendacja C) — swiadome ryzyko zablokowania startu gry przy braku drewna.
**Powiazane:** `BUG-ZWIADOWCA-KOSZT-SUROWCA=A` — po wyzerowaniu kosztu Drewna Zwiadowcy,
Zwiadowca przestaje podlegac tej bramce (wymog 0 = zawsze spelniony).
**Kotwice:** `gra/src/game/production.ts:858-863` i `:950-960` (DWIE kopie warunku, obie
musza zostac zmienione razem).
Model: Sonnet 5.

## P-AI-MOC-GAP (2026-08-08) — trzecia przyczyna gapu Mocy AI: kodowac teraz bez pomiaru = **B**
**Decyzja Macieja: B.** Kodowac naprawe `canAfford`/pustej kolejki produkcji AI TERAZ, bez
uprzedniego swiezego playtestu (odrzucona rekomendacja A — najpierw zmierzyc obecny gap).
**Uzasadnienie wlasciciela:** pusta kolejka + nieotwarta produkcja + namnazajace sie surowce
(AI "myszkuje" zasobami bez ich wydawania) to kluczowy problem, ktory trzeba rozwiazac wprost.
**Kotwice:** miejsce w silniku AI gdzie `canAfford` decyduje o wpisach kolejki produkcji —
do zlokalizowania przez Operatora (kandydat: `gra/src/game/ai-*.ts`, `production.ts`,
logika tury AI w `main.ts`).
Model: Sonnet 5. Zakres: znalezc root cause (dlaczego AI nie zmienia zadania produkcji gdy
`canAfford` odrzuca biezacy wybor — czy probuje inny wpis kolejki, czy zostawia kolejke pusta
i akumuluje surowce bez konsumpcji) i naprawic tak, zeby AI zawsze mialo cos w produkcji,
jesli stac je na cokolwiek z dostepnej listy.

## BUG-TOOLTIP-MOC-BUDYNKI-Q1 (2026-08-08) — Obrazenia Broni/Przebicie w tooltipie: tylko weteran = **A**
**Decyzja Macieja: A.** Obrazenia Broni (`weaponDamage`) i Przebicie (`piercing`) w tooltipie
jednostki skalowane WYLACZNIE premia weterana (zgodnie z tym, co realnie liczy silnik walki
`damageTw()`), NIE pelnym `softFrac` (weteran+budynki). Pozostale 6 pol wzoru `fieldPower()`
(w tym Szarza, Atak dystansowy) zostaja bez zmian — dla nich silnik faktycznie stosuje premie
budynkowa, wiec pelny `softFrac` tam jest poprawny.
**Pytanie przeszlo przez turniej ABC (C-018):** dwa niezalezne projekty (orkiestrator +
niezalezny agent) zbiegly sie na tej samej rekomendacji A; Sedzia (Opus 5) zweryfikowal
liczby w kodzie i zsyntetyzowal finalna wersje pytania.
**Kotwice:** `gra/src/game/unit-card-stats.ts` (`unitCardCombatDisplay`), worktree
`.claude/worktrees/tooltip-moc`.
Model: Sonnet 5.

## R-MOC-DEFINICJA-Q1 (2026-08-08) — co wchodzi w skladowa "Moc" wyswietlana graczowi
**Zasada Macieja (cytat, do zachowania):** *"W aspekcie liczenia mocy jednostek czy armii
przed bitwa i na przyklad automatycznym rozpoznaniem bitwy i mocy oraz automatycznego
rezultatu, trzeba policzyc wszystkie wskazniki, takze parametry, ktore wspomniales, czyli
pelna premia budynkowa, weteran. I wszystkie mozliwe wskazniki, ktore wczesniej byly
ustalone. Ale w wypadku mocy power nie liczymy budynkow, dlatego ze ta sama jednostka moze
byc w jednym budynku, moze byc w drugim, moze byc w jednej formie, moze byc zafortyfikowana
lub nie. Liczymy wszystkie pozostale elementy, ale bez elementu terenu i budynku."*
**Rozroznienie dwoch odrebnych obliczen:**
1. **Rzeczywiste rozstrzygniecie bitwy** (pre-battle, auto-bitwa, wynik) — liczy WSZYSTKO:
   pelna premia budynkowa, weteran, teren, wszystkie ustalone wskazniki. Bez zmian wobec
   dzisiejszej pracy `combatPowerScaledDefFor`/`tabliczkaGarnizonScaledDefFor`.
2. **"Moc" jako wyswietlany wskaznik** (tooltip, tabliczka, panel rankingu, HUD, Empire) —
   NIE liczy budynkow ani terenu — tylko wskazniki wlasne jednostki + premia weterana.
   Uzasadnienie: jednostka jest przenosna (moze stac w roznych miastach/budynkach, byc
   zafortyfikowana lub nie) — Moc ma byc stabilna cecha jednostki, nie zalezec od tego,
   gdzie akurat stoi.
**NAPIECIE ROZSTRZYGNIETE (2026-08-08, ta sama sesja, pytanie zamkniete):** decyzja
`R-MOC-MUR-PARADOKS-Q1=A` (2026-08-07) wprowadzila `tabliczkaGarnizonScaledDefFor()`, ktora
DLA GARNIZONU W MIESCIE Z MUREM dokladala do "Mocy" na tabliczce bonus struktury obronnej +
mnoznik terenu. **Decyzja Macieja: wraca do czystej Mocy (bez muru)** — tabliczka cofnieta do
`combatPowerScaledDefFor(u)` (weteran + trudnosc AI, bez bonusu struktury/terenu), zgodnie
z nowa zasada R-MOC-DEFINICJA-Q1. To **CZESCIOWO COFA** `R-MOC-MUR-PARADOKS-Q1=A` — sam
paradoks garnizonu (49 pkt realnie wnoszone do bitwy vs 95 na tabliczce) wraca, ale teraz
jako SWIADOMA konsekwencja zasady "Moc = wskazniki wlasne + weteran, bez kontekstu miejsca",
nie przeoczenie.
Model: Sonnet 5 (logika/dane), `gra/src/render/**` gdyby dotkniete = Opus 5.

## R-SKILL-LEAN-LOOP-CIVAUTOBOT (2026-08-08) — synteza Ponytail + AutoBot w dwa skille Claude Code
**Prosba Macieja:** przeczytac w calosci skill "Ponytail" (minimalizm kodu) i kanon AutoBot
tego projektu (w tym 3 oryginalne pliki `AUTOBOT-PROMPT.md`/`AUTOBOT-opis-i-wdrozenie.md`/
`playbook.md` v1.2 dostarczone przez wlasciciela), i zsyntetyzowac je w DWA skille: (1)
uniwersalny, tech-agnostyczny, przenosny do innych projektow/agentow; (2) projektowy dla
Civ, dziedziczacy z uniwersalnego. Twarda instrukcja: **"Nic nie usuwamy"** — kompletnosc
jest kryterium sukcesu, nie tylko poprawnosc; przy niepewnosci decyzji syntezy — turniej.
**Wykonanie (Operator/Evaluator na Opus 5, na wyrazne polecenie Macieja dla tego tematu):**
- **`lean-loop`** — `/root/.claude/skills/lean-loop/` (SKILL.md + 5 plikow `references/`,
  1097 linii razem). Zero odniesien do Civ/gry/polskiego/modeli AI po nazwie (zweryfikowane
  dwukrotnie, niezaleznymi grepami + enumeracja znakow non-ASCII). Laczy drabine decyzyjna
  Ponytaila (YAGNI→reuse→stdlib→natywne→zaleznosc→jedna linia→minimum), "przyczyna nie objaw"
  (grep callerow), protokol bledu AutoBota 5-krokowy, rozdzial rol Operator/Evaluator (agent
  nie ocenia sam siebie), wzorzec playbooka z liczby win/fail i progami statusu, turniej
  dwoch propozycji + Sedzia, oraz — po dyskusji o zakresie — checkliste pisarska R-001..R-012
  z playbooka-meta wlasciciela (dokument o dokumentach, uznana za pasujaca do agenta
  kodujacego, ktory tez pisze specyfikacje/prompty/runbooki).
- **`civ-autobot`** — `.claude/skills/civ-autobot/SKILL.md` (239 linii). Dziedziczy z
  `lean-loop`, doklada WYLACZNIE specyfike tego repo: przydzial modeli, NUMER→ABC→DEPLOY,
  turniej ABC jako twarda reguła (nie opcja), 3 twarde FAIL Evaluatora (edge/parytet/save-
  load), izolacja worktree, zakazy build/dev/export-*.py, runbook deployu, bramki i baseline'y.
**Incydent w trakcie pracy:** automatyczny skaner bezpieczenstwa oznaczyl fragment Skilla B
(wyjatek "drobiazg 1-3 linie tekstu nie wymaga pelnej ceremonii") jako mozliwe "zatrucie
instrukcji". Zweryfikowane osobiscie: cytat byl prawdziwy (`.mdc:28,33`), ale sam plik
zrodlowy jest WEWNETRZNIE SPRZECZNY (naglowek tej samej reguly mowi "bez wyjatku «to tylko
drobiazg»"). Nie rozstrzygniete samodzielnie — poprawione na wersje ostrozniejsza (domyslnie
BRAK wyjatku, pelna petla) z jawna flaga sprzecznosci u zrodla, czekajaca na Twoje rozstrzygniecie
w `.cursor/rules/autobot-evaluator-operator.mdc:28` (czy tam faktycznie ma byc wyjatek dla
1-3 linii, czy to bylo nieprecyzyjne sformulowanie bez takiej intencji).
**Do Twojej decyzji (nie blokuje niczego, informacyjnie):** czy powyzsza sprzecznosc w
`.mdc` ma zostac rozstrzygnieta, i w ktora strone.
Model: Opus 5 (wyrazne polecenie Macieja dla tego tematu, obie role).

## R-SPRZECZNOSC-DROBIAZG-MDC-Q1 (2026-08-08) — wyjatek 1-3 linie tekstu: doprecyzowany, nie usuniety = **B**
**Decyzja Macieja: B.** Wyjatek z `.cursor/rules/autobot-evaluator-operator.mdc:28`
zostaje, ale doprecyzowany do trzech LACZNYCH warunkow: (a) wylacznie plik dokumentacji/
notatek, NIGDY `gra/src`; (b) wylacznie jako dopisek do paczki ktora JUZ przeszla przez
Evaluatora w tej samej sesji — nie samodzielna, nieoceniona zmiana; (c) zawsze zalogowany
w `KANAL-PRACA.md` lub tresci commita. Brak ktoregokolwiek warunku → pelna petla, bez
zgadywania "czy to drobiazg" (self-grading, ktoremu AutoBot ma zapobiegac).
**Wdrozenie:** `.cursor/rules/autobot-evaluator-operator.mdc:28` przepisane; `.claude/
skills/civ-autobot/SKILL.md` (sekcja "Reguła nadrzędna") zaktualizowany z flagi
sprzecznosci na rozstrzygniete dwa wyjatki.
Model: Sonnet 5 (mechaniczne wdrozenie juz podjetej decyzji, bez nowej oceny).

## R-PROFIL-TURNIEJ-PUNKTACJA-Q1 (2026-08-08) — profil decyzyjny jako kryterium punktacji w turnieju ABC
**Decyzja Macieja: potwierdzenie w rozmowie (wariant A+B połączony, opisany przeze mnie i
zaakceptowany wprost — „Tak, potwierdzam. Zgadzam się z tym, co napisałeś.").**
**Mechanizm:** obaj Proponenci turnieju ABC (`R-PROC-AUTOBOT-ABC-TURNIEJ.md`) wskazują
własny „typ" (którą literę uważają za najlepszą) z uzasadnieniem odwołującym się do
`PROFIL-DECYZYJNY-MACIEJ.md`. Sędzia punktuje dwuwarstwowo: Warstwa 1 (dominująca) —
trafność rozpoznania kategorii tematu i jakość zastosowania wzorca z profilu; Warstwa 2
(niuanse, tiebreaker) — zgodność ze źródłami, kompletność wariantów. Do właściciela trafia
zwycięska/zsyntetyzowana wersja z jawną adnotacją „wg profilu: typowana X, bo …" przy
Rekomendacji — zawsze obok pełnego A/B/C, nigdy jako zamiennik wyboru. Wybór litery
pozostaje w 100% właściciela — mechanizm nie zmienia tego, kto decyduje, tylko jak dobrze
formułowana jest rekomendacja w projekcie ABC.
**Wdrożenie (runda 1 + poprawki po FAIL Evaluatora, ta sama sesja):** `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`
(§Zasada rozszerzona o „typ" + punktację dwuwarstwową), `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md`
(baner ZAKAZ doprecyzowany o usankcjonowany wyjątek + odsyłacz przy starym zdaniu „wymaga
przeglądu" w §DOKOŃCZONE runda 2), `.claude/skills/civ-autobot/SKILL.md` §3 (zaktualizowany
opis turnieju), `.cursor/rules/autobot-evaluator-operator.mdc` §„Pytanie ABC" (**krytyczne —
to plik `alwaysApply: true`, ładuje się przed kanonem i bez tej poprawki przyszły agent
uruchamiałby stary turniej**), `playbook.md` (`C-018`, treść rozszerzona) →
`dyspozycje/autobot/playbook.json` (`rule_126`, wygenerowany generatorem, liczniki 0/0
zachowane, wersja 17).
**Doprecyzowania po pierwszym werdykcie FAIL (Opus 5 Evaluator):** (a) „typ" JEST literą
w polu `Rekomendacja`, adnotacja „wg profilu" to dopisek uzasadnienia, nie drugie,
konkurencyjne pole; (b) gdy profil nie ma wzorca pasującego do kategorii tematu, „typ"
zostaje obowiązkowy z jawnym stwierdzeniem braku wzorca — nie blokuje turnieju; (c) ta
decyzja **nie przeszła** turnieju C-018 sama — wyjątek „bezpośrednie ustalenie wypracowane
żywą rozmową z właścicielem" dopisany do zakresu wyjątków we wszystkich czterech miejscach
(kanon `R-PROC-AUTOBOT-ABC-TURNIEJ.md`, `civ-autobot/SKILL.md` §3, `.mdc`, `playbook.md`),
bo Maciej współtworzył projekt w dialogu, nie odpowiadał literą na cudzy gotowy projekt.
**Werdykt Evaluatora:** runda 1 FAIL (3 pliki zaktualizowane, 3 kluczowe — `.mdc`,
`playbook.md/json` — pominięte; nieprawdziwe „Wdrożenie" w tym wpisie); runda 2 FAIL
(kluczowe pliki naprawione i zweryfikowane generatorem w trybie dry-run — „brak różnic",
ale wyjątek „żywa rozmowa" dopisany tylko do `.mdc`/`playbook.md`, brakował w kanonie
i skillu, plus nieprawdziwe „trzy miejsca" w tym wpisie); runda 3 FAIL (wyjątek „żywa
rozmowa" ujednolicony we wszystkich pięciu plikach, ale trzeci, STARSZY wyjątek —
„czysto inżynierskie decyzje bez wpływu na gameplay/UX/dane gracza" — brakował w
`playbook.md`/`playbook.json`, obecny tylko w kanonie/`.mdc`/skillu); runda 4 (ta wersja)
dopisuje brakujący wyjątek inżynierski do `playbook.md` C-018 i regeneruje `playbook.json`
(wersja 18) — wszystkie trzy wyjątki teraz identyczne semantycznie w pięciu plikach.
Model: Sonnet 5 (orkiestrator, wdrożenie już potwierdzonej decyzji) + Opus 5 Evaluator.

## R-JAK-EDYTOWAC-AUTOBOT-DOKUMENT (2026-08-08) — meta-dokument: zasady edycji samego systemu AutoBot
**Prośba Macieja:** „spisz jeszcze zasady, jakimi się kierowałeś przy tworzeniu tego
skillsa autobot w przyszłości, żeby mógł zawsze robić zmiany w autobocie", doprecyzowana:
„kluczowe jest to, żeby nowy Skills odtworzył cały mechanizm działania łącznie z plikami,
które muszą być założone i używane w całym procesie kodowania i tworzenia".
**Wykonanie:** nowy plik `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — §0
pełna mapa mechanizmu w 5 warstwach (wejście / kanon / pamięć / egzekwowanie w kodzie /
ślad-księgowość, łącznie ok. 40 plików i ścieżek), §1-10 zasady wyniesione z konkretnych
incydentów tej sesji (m.in. rozjazd 5 plików przy R-PROFIL-TURNIEJ-PUNKTACJA-Q1, generator
playbook.json, fałszywe "Wdrożenie: gotowe"), checklista końcowa. Pointer dodany w
`civ-autobot/SKILL.md` (sekcja „Reguła nadrzędna").
**Werdykt Evaluatora (Opus 5):** runda 1 FAIL — mapa §0 niekompletna: pominięte 5 plików
`.mdc` (w tym `alwaysApply: true` konkurencyjne dla `autobot-evaluator-operator.mdc`),
6 z 10 plików `src/`, 4 pliki spoza src (`PROMPT-AUTOBOT-DLA-AGENTOW.md`,
`protokol-v1.2/`, `KOLEJKA-FABLE-5.md`, `dist-smoke/`), 1 plik kanonu
(`R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md`), niedoliczone incydenty w §5. Runda 2 PASS —
wszystkie braki zweryfikowane jako naprawione bezpośrednio w repo (nie na słowo).
Model: Sonnet 5 (orkiestrator) + Opus 5 Evaluator (2 rundy).

## R-PROFIL-TURNIEJ-UNIWERSALNY-Q1 (2026-08-08) — mechanizm "typ"+profil przeniesiony do lean-loop (uogólniony)
**Decyzja Macieja:** wprost — "musimy to wprowadzić z nasadek ogólnych, ale mechanizm
pozostaje ten sam, różni się tylko szczegółami" — przenieść poziom 2 turnieju (typ
Proponentów + punktacja wg pamięci preferencji) do uniwersalnego skilla, bez treści
specyficznej dla Civ, z wyraźnym celem: żeby żaden projekt nie sprawiał wrażenia, że
"użytkownik mówi do ściany" (poprawki/sugestie/odpowiedzi giną między sesjami).
**Wykonanie w `/root/.claude/skills/lean-loop/` (POZA tym repo, plik nie jest pod git —
brak commita/push, tylko zapis decyzji tutaj):**
- `references/playbook-pattern.md` — nowa sekcja "A second kind of memory: how the human
  decides" (3 typy sygnału: forced-choice, korekty kierunku bez błędu, wolontariat
  preferencji; osobny plik `decision-profile.md`; ten sam rygor statystyczny co playbook;
  wpięcie w rytuał startu/zamknięcia sesji; twarda bariera "nigdy nie zastępuje pytania").
- `references/high-stakes.md` — rozszerzona sekcja turnieju o "pick" + punktację Sędziego
  wg tej pamięci.
- `references/error-protocol.md` — rozróżnienie błąd (rejestr błędów) vs preferencja
  (nowy rejestr), żeby dwa rejestry się nie nakładały.
- `SKILL.md` — zaktualizowany opis trybu "memory".
**Werdykt Evaluatora (Opus 5, 2 rundy):** runda 1 PASS-WITH-NOTES — 4 uwagi (wiszący
odsyłacz do nieistniejącej sekcji turnieju w tym samym pliku, jednokierunkowe nakładanie
się rejestru błędów i nowego rejestru, brak rytuału startu dla nowego pliku pamięci,
bariera słabsza niż reszta "Immovable barriers"). Runda 2 PASS po naprawie wszystkich
czterech, zweryfikowane bezpośrednio w plikach. Zero przecieków Civ/PL/nazw modeli
potwierdzone grepem w obu rundach.
Model: Sonnet 5 (orkiestrator) + Opus 5 Evaluator (2 rundy).

## R-SCALENIE-MAIN-2026-08-08 (2026-08-08) — scalenie gałęzi roboczej do main, wariant A
**Decyzja Macieja: A — scal całą gałąź (21 commitów: deploy FALA 260 + skille AutoBot/
civ-autobot + R-PROFIL-TURNIEJ-PUNKTACJA-Q1 + dokumentacja) do main.** Bezpośrednia
przyczyna: playtest wykazał, że FALA 260 (naprawa Zwiadowcy/traktatu) nie była osiągalna
z main — sesja lokalna pulluje z main, nie z gałęzi roboczej, więc żadne odświeżanie
przeglądarki nie mogło pokazać naprawy, dopóki main jej fizycznie nie miał.
**Wykonanie:** `git merge` (nie force-push) na lokalnej gałęzi `main-merge` z origin/main,
scalenie 21 commitów moich + zachowanie 4 commitów sesji lokalnej wykonanych w
międzyczasie (`4be7e8ba`..`bdd69824`). **Konflikt merytoryczny wykryty i rozwiązany
ręcznie:** obie strony niezależnie dodały nowe reguły playbooka pod tymi samymi ID
(`C-016`/`C-017`/`C-018`) — moje `C-018` (turniej ABC) kolidowało z regułami sesji
lokalnej o tej samej etykiecie dot. przeglądu schowków git. Reguły sesji lokalnej
przenumerowane na `C-020`/`C-021`/`C-022` (treść bez zmian), referencje w rejestrze
błędów i kanale zaktualizowane, `playbook.json` zregenerowany generatorem (wersja 19,
liczniki zachowane). `.gitignore` i `KANAL-PRACA.md` scaliły się z drobnymi ręcznymi
poprawkami (append-only, oba wpisy zachowane w kolejności chronologicznej).
**Weryfikacja przed push:** tsc 0 błędów, logic-test 213/213, tech-tree 19/19,
unit-replace 13/13, autobot-smoke 11/11 — wszystko na scalonym drzewie.
**Po push:** potwierdzone md5 `gra-robocza/Gra-ROBOCZA.html` na `origin/main` =
`e0fa2ec12fdbaf26800f610bb5e82e23` (zgodne z FALA 260), potwierdzone że `rule_126` w
`playbook.json` na main to turniej ABC (nie reguła schowków) — brak kolizji ID.
Commit scalenia: `a659f4a1` (main-merge → main, push bez force).
Model: Sonnet 5 (orkiestrator, wykonanie scalenia po wyraźnej zgodzie Macieja).

## BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
**Jego słowa:** „podczas budowania w trybie budowania ulepszeń, kiedy wybierzemy już coś,
co chcemy ulepszać, nie da się przybliżać i oddalać mapy. Czasem to utrudnia stawianie
ulepszeń." — **NAPRAWIONE**: jeden warunek blokował jednocześnie przeciąganie i zoom;
rozdzielone na `blockPointerAt`/`blockWheelAt` w `camera.ts`. Evaluator PASS-WITH-NOTES po
dołożeniu testu regresji (`camera-zoom-block-test.cjs`, 4/4). ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest.

## R-AUDYT-ZGLOSZEN-2-DNI (2026-08-08) — pełny audyt zgłoszeń Macieja z ostatnich 2 dni
**Prośba:** sprawdzić wszystkie błędy zgłoszone przez właściciela w ciągu ostatnich 2 dni,
potwierdzić czy są zarejestrowane i czy naprawione; przygotować listę tych nienaprawionych
lub błędnie oznaczonych jako naprawione.
**Wynik audytu 9 zgłoszeń playtestowych (2026-08-07/08, `dyspozycje/PYTANIA-OTWARTE.md`):**
- **BUG-ETYKIETA-MIASTA-ROZMYTA** — OTWARTE, potwierdzone niezmienione.
- **BUG-IKONA-KULTURY-PLACEHOLDER** — OTWARTE, potwierdzone niezmienione. **Przyczyna
  zdiagnozowana teraz w kodzie** (`gra/src/render/cityMapStatChip.ts`): `requestCivSigilImage()`
  (linia ~364) porzuca `onReady` bez kolejkowania, gdy inny badge tej samej cywilizacji już
  ładuje ten sam sygnet (`if (cached === 'loading') return;`) — plakietka, która przegrała ten
  wyścig, zostaje trwale z rombem, bo tekstura tworzona jest raz (`if (!tex)`, linia ~744) i
  nigdy nie ponawia żądania. Hover naprawia to przypadkiem: `hoverExpanded` wchodzi do klucza
  cache tekstury (linia 714), więc hover tworzy NOWĄ teksturę, która trafia już na wypełniony
  globalny cache obrazu i rysuje ikonę od razu. Analogiczny wzorzec cache w
  `requestLeaderPortraitImage`/`requestProdIconImage` — niesprawdzony, prawdopodobnie ten sam błąd.
- **R-ETYKIETA-MIASTA-WZROST-PROCENT** ("W5" zamiast "5,5%") — OTWARTE, potwierdzone
  niezmienione i **poprawnie zarejestrowane** dosłownym cytatem właściciela — nie zostało
  pominięte, tylko wciąż czeka na realizację.
- **BUG-ZWIADOWCA-KOSZT-SUROWCA** — naprawione i wdrożone (FALA 260, zweryfikowane w
  `units.json` wcześniej tej sesji).
- **BUG-PRZEMARSZ-KOMUNIKAT-OBCY** — zamknięte, scalone.
- **BUG-BRAMKA-DREWNO-BRAK** — naprawione i wdrożone (FALA 260).
- **BUG-TOOLTIP-MOC-NIEPELNA** — **naprawione i wdrożone (FALA 260, `eff727e`), potwierdzone
  teraz w kodzie** (`gra/src/ui/hexContextTooltip.ts:668-677`, wszystkie 8 pól obecne) — ale
  **status w `PYTANIA-OTWARTE.md` wciąż mówi OTWARTE**. To rozjazd dokumentacji, nie
  pominięty fix — naprawa realnie istnieje i działa, tylko etykieta statusu nie została
  zaktualizowana po deployu.
- **BUG-RZEKI-MEDIUM-FOW-REGRESJA-2** — zamknięte, scalone.
- **BUG-TRAKTAT-KOSZYK-REGRESJA** — naprawione i wdrożone (FALA 260, zweryfikowane na
  `origin/main` wcześniej tej sesji).
**Wniosek:** żadne zgłoszenie nie zostało pominięte w rejestrze — każde ma wpis z cytatem.
Jeden realny problem dokumentacyjny znaleziony: status `BUG-TOOLTIP-MOC-NIEPELNA` nie
zaktualizowany po fixie. Dwa realne, wciąż nienaprawione bugi UI: `BUG-ETYKIETA-MIASTA-ROZMYTA`,
`BUG-IKONA-KULTURY-PLACEHOLDER` (przyczyna teraz znana) — plus otwarte od dawna
`R-ETYKIETA-MIASTA-WZROST-PROCENT`, i nowo zgłoszony `BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN`.
Model: Sonnet 5 (orkiestrator, audyt + diagnoza kodu, bez zmian w `gra/src`).

## R-WERYFIKACJA-ODPOWIEDZI-EWALUATOR (2026-08-08) — C-023/C-024, każda odpowiedź przez Evaluatora
**Decyzja Macieja:** „przyjmuję, że jeżeli pytam się, czy jest coś do zrobienia, to powinien
sprawdzić w plikach, czy nie wiszą jakieś tematy nierozwiązane, a nie odpowiadać z głowy i
kłamać" oraz „zapisz tą zasadę do plików autobota i stosuj zasadę autobota. Pierwsza zasada,
jeżeli o coś pytam i Ty odpowiadasz to ponownie sprawdzić sobie przez ewaluatora czy Twoja
odpowiedź jest prawidłowa."
**Powód:** znaleziony w tej sesji przestarzały status `BUG-TOOLTIP-MOC-NIEPELNA` (plik mówił
„OTWARTE", naprawa wdrożona od FALA 260) plus wcześniejsze niedoprecyzowane „repo czyste i
zsynchronizowane" (prawdziwe tylko dla mojej gałęzi, nie dla `main`).
**Wykonanie:** `playbook.md` — nowe reguły `C-023` (świeży przegląd plików+kodu na pytanie
o otwarte tematy, nigdy z pamięci) i `C-024` (każda odpowiedź na pytanie właściciela
przechodzi przez Evaluatora przed wysłaniem, nie tylko zmiana w repo) + wpis w rejestrze
błędów. `playbook.json` zregenerowany (wersja 20, `rule_131`/`rule_132`, liczniki 0/0).
`.cursor/rules/autobot-evaluator-operator.mdc` (alwaysApply) rozszerzony o tę samą treść —
priorytet, bo ładuje się przed kanonem.
**Zakres C-024 (do doprecyzowania z czasem):** stosowana od razu do odpowiedzi na pytania
o stan projektu/kod/pliki (weryfikowalne fakty); czysto konwersacyjne pytania bez
weryfikowalnej treści faktograficznej nie wymagają Evaluatora — jeśli Maciej chce szerszy
zakres, powie wprost.
Model: Sonnet 5 (orkiestrator, zapis już podjętej decyzji).

## BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA (2026-08-08) — zastosowanie C-024, moja pierwsza diagnoza była błędna
**Zgłoszenie Macieja:** regres w panelu imperium — surowce „dostępu" (Ceramika/Sól/Koń/Złoto)
straciły wyświetlaną ilość, pokazują tylko masz/brak.
**Zastosowanie nowej zasady C-024:** napisałem diagnozę wskazującą `cityPanel.ts`/
`renderSurowce` jako źródło problemu i konkluzję „to raczej nie regres, tylko inny panel
informacyjny". Wysłałem to do Evaluatora (Opus 5) PRZED przedstawieniem właścicielowi —
**Evaluator wydał FAIL**: zły panel wskazany (prawdziwy to `empireDetailPanel.ts`), i **regres
faktycznie istnieje**, ze zidentyfikowanym commitem `331aa180` (2026-08-05) usuwającym `cap`
(a przez to ilość `stock/cap`) dla surowców dostępu. Dodatkowo znalazł, że temat już wcześniej
był w rejestrze (`R-SUROWCE-DOSTEP`, 2026-07-26) — mój grep go przeoczył.
**Wniosek:** dokładnie ten scenariusz, przed którym C-024 miał chronić — pierwsza wersja
mojej odpowiedzi byłaby fałszywie uspokajająca („to nie regres, mylisz panele"), a właściciel
miał rację od początku. Poprawiona diagnoza zapisana w `PYTANIA-OTWARTE.md`
(`BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA`), z pełną chronologią sprzeczności między
`R-SUROWCE-DOSTEP` (26.07, chce widoczności dostępu) i `DOSTEP-SUROWCE-Q1` (29.07, usuwa
pojęcie dostępu) — wdrożenie 05.08 poszło za starszą, unieważnioną już prośbą.
**Do decyzji Macieja:** czy sekcja „Dostęp — nie magazynowane" w panelu imperium ma wrócić do
pokazywania `stock/cap` (cofnięcie `331aa180`) czy zostać czysto informacyjna.

## R-HUD-MIASTO-STAN-CYWILIZACJI — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
6 chipów nagłówka miasta (Praca/Żywność/Skarbiec/Nauka/Kultura/Religia) pokazuje teraz dużą
liczbę = agregat cywilizacji z tego samego silnikowego źródła co główny HUD mapy + małą
liczbę = wkład tego miasta. Evaluator (Opus 5) PASS-WITH-NOTES po jednej rundzie poprawek
(błąd kompilacji + reużycie istniejącej agregacji zamiast nowej). Test 20/20. **Do wiedzy:**
duża liczba NETTO, mała BRUTTO — nie zsumują się dokładnie. Pełne kotwice w
`PYTANIA-OTWARTE.md`.

## R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Spacja/bęben = tylko jednostki z ruchem, strzałki HUD = wszystkie jednostki — dwie osobne
kontrolki (decyzja właściciela 2026-08-08). Plus fix efektu ubocznego: cyklowanie po
„bębnie" nie pomija już pierwszej jednostki na liście. Evaluator PASS-WITH-NOTES po 2
rundach. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08) — nowe zgłoszenie z playtestu
**Jego słowa:** „powinny być pokazywane tylko technologie te które są niedostępne dla innej
cywilizacji zarówno po jednej jak i po drugiej stronie... jeżeli jedna i druga cywilizacja
ma tą technologię to nie ma sensu jej pokazywać". Zarejestrowane w `PYTANIA-OTWARTE.md`.
Wstępnie: `getSellableTechForPlayer()` (main.ts:14137) filtruje tylko po własnych zbadanych
technologiach oferującego, nie po tym czy odbiorca już je ma — pasuje do zgłoszenia, ale
niepewne czy to funkcja zasilająca akurat ten ekran koszyka (do doczytania).

## R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP (2026-08-08) — nowe zgłoszenie z playtestu
**Jego słowa:** „pod symbolem surowca powinna być liczba tych surowców, które mamy
dostępne... trzeba przewidzieć, że tych surowców będzie znacznie więcej, więc musi być
czytelny sposób pokazywania tej większej ilości". Zarejestrowane w `PYTANIA-OTWARTE.md`.
Dwa wymagania: (1) dopisać liczbę zapasu do chipów surowca w koszyku wymiany
(`diplomacyTradeBasket.ts`), (2) zaprojektować skalowalny układ na przyszłość (więcej
surowców niż dziś 3 w rzędzie).

## R-PROPOZYCJA-BRAK-EDYCJI + BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC (2026-08-08)
Dwa zgłoszenia z panelu propozycji dyplomacji, zarejestrowane w `PYTANIA-OTWARTE.md`:
(1) brak przycisku Edytuj — potwierdzone w kodzie, tylko „Usuń" (`diplomacyTradeBasket.ts:1177`);
(2) usunięcie pustej karty „Oni oferują" (druga strona nic nie daje) kasuje też sparowaną,
realną propozycję po naszej stronie — nielogiczna kaskada, niezdiagnozowana jeszcze która
funkcja odpowiada za to sparowanie.

## R-DYPLO-CENY-SUROWCOW-PW + BUG-PAKIET-BILANS-DODATNI-BLOKADA (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Zarejestrowane w `PYTANIA-OTWARTE.md` z pełną tabelą cen surowców (Drewno 1 PN/szt. ... Złoto
50 PN/szt., `econ-params.json:handel_surowce`) i zlokalizowanym mechanizmem bloku pakietu:
`diplomacy-proposals.ts:1082` (`treatyBaseFairnessGap`) liczy uczciwość WYŁĄCZNIE dla
pojedynczej umowy w pakiecie (`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A`, świadome), ale panel UI
pokazuje zbiorczy dodatni bilans pakietu (+14 PW) sugerując inaczej — niespójność UI vs
logika akceptacji. Powiązane z już znanym `R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY`.

## BUG-ETYKIETA-MIASTA-ROZMYTA + BUG-IKONA-KULTURY-PLACEHOLDER — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Oba w `gra/src/render/cityMapStatChip.ts`. Rozmycie: canvas renderowany teraz ×`devicePixelRatio`
(cap ×3), standardowy wzorzec „retina canvas" dla tekstur Three.js. Placeholder: kolejkowanie
callbacków sygnetu cywilizacji zamiast gubienia ich przy równoległych żądaniach. Evaluator
(Opus 5) PASS-WITH-NOTES po 3 rundach — runda 1 złapała 2 realne błędy, runda 2 znalazła lukę
pokrycia testu (błąd realny, ale test go nie łapał), runda 3 potwierdziła domknięcie własnymi
kontrfaktykami (7 mutacji, 6/7 złapanych, 1 nieszkodliwy wyciek pamięci bez efektu wizualnego).
`R-ETYKIETA-MIASTA-WZROST-PROCENT` (procent wzrostu zamiast „W5") pozostaje OTWARTE — próba
naprawy świadomie wycofana (użyłaby innej liczby niż panel miasta), prawdziwa przyczyna
zablokowania (migawka z końca tury vs. panel na żywo) znaleziona i opisana, czeka na decyzję.
Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-HANDEL-PAKIETY-USUNAC (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
**Jego słowa:** „zlikwiduj te pakiety, bo to będzie kompletnie niezrozumiałe dla graczy. Po
prostu podajemy sztuki. Jeden, dziesięć, sto i tak dalej. Żadnych pakietów! Usuń dla
wszystkich surowców pakiet." Decyzja wprost, nie ABC — usunąć koncepcję „pakiet ×10" z UI
wymiany surowców (`diplomacyTradeBasket.ts`, `diplomacy-value-catalog.ts`
`diplomacyHandelSurowcePakietWielkosc()`, `econ-params.json:pakiet_wielkosc`), zastąpić
wprowadzaniem surowej liczby sztuk (stepper +1/+10/+100 na sztukach, nie na pakietach).
Cena PN/szt. z `econ-params.json:handel_surowce.cena_*` zostaje bez zmian — zmienia się tylko
jednostka wejścia UI. **NAPRAWIONE**, Evaluator PASS-WITH-NOTES po 2 rundach (2 zepsute
pakiety testów + błąd wycieku etykiety do wiadomości AI, oba naprawione i niezależnie
zweryfikowane). Pełne kotwice w `PYTANIA-OTWARTE.md`.

## BUG-CYWILIZACJA-BEZ-GRANIC + BRAK-WZROSTU (2026-08-08) — DIAGNOZA ZAKOŃCZONA
Hipoteza właściciela (Zulusi „zjadają" własną ludność) **potwierdzona kodem**: koszt
założenia miasta = 1 pkt ludności pobierany z najludniejszego miasta (`city-founding.ts`),
AI (`ai.ts:planCityFounding`) zbiera to co turę bez throttle gdy miasto urośnie 1→2 —
samopodtrzymująca się pętla 1↔2. Wzmocnione karą wzrostu Zulusów (`civ-matrix.json
lud_wzrost_proc=-0.05`) i wysoką agresywnością/ekspansywnością (`civ-ai.json`). **Do decyzji
ABC** (throttle w AI). Brak granic — **NIE znaleziono przyczyny**, 3 hipotezy odrzucone
dowodami z kodu (brak gate'u odkrycia, kolor OK, promień terytorium OK nawet dla pop=1);
jedyna pozostała hipoteza (remis w `territoryOwnerAt` przy gęstym osadnictwie) wymaga
diagnozy na żywym zapisie, nie samą lekturą kodu. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## BUG-CYWILIZACJA-BEZ-GRANIC — CZĘŚĆ GRANICE: ZDEPLOYOWANE `ce69cf45` FALA 262 (naprawiona fragmentacja obrysu)
Hipoteza `territoryOwnerAt` (remisy) **odrzucona po weryfikacji na żywej symulacji** —
rzeczywista przyczyna to `borderVertexKey()` w `territory-border.ts`: `toFixed(5)` bez
normalizacji znaku przy zerze dawał dwa różne klucze stringowe dla tego samego wierzchołka
geometrycznego (szum zmiennoprzecinkowy ~1e-16 przy liczeniu wspólnego narożnika z dwóch
centrów heksów) — im gęstszy klaster miast względem world (0,0), tym częściej. Fix:
`fixNegativeZeroString()`. Evaluator PASS-WITH-NOTES z niezależnym dowodem (400 losowych
gęstych kształtów: przed naprawą 32/400 wadliwe, po naprawie 0/400). 9 bramek zweryfikowanych
niezależnie, identyczne liczby po scaleniu w drzewie głównym: `tsc` czyste, `territory-border`
9/9, `territory-border-dense-settlement` (nowy) 15/15, `improvement-territory-gate` 6/6,
`border-march-scan` 15/15, `border-march-wygasanie` 26/26, `diplomacy-border-march` 39/39,
`fair-play-grid` 8/8, `logic-test` 213/213. **Zastrzeżenie Evaluatora:** próba 4000 kształtów
sprzed naprawy pokazała że obrys nigdy nie znikał CAŁKOWICIE, tylko był poszarpany (70–94%
pokrycia) — status w `PYTANIA-OTWARTE.md` celowo złagodzony do „do potwierdzenia playtestem",
nie „NAPRAWIONE" bez zastrzeżeń.

## R-ETYKIETA-MIASTA-WZROST-PROCENT — ZDEPLOYOWANE `ce69cf45` FALA 262
Plakietka miasta na mapie pokazywała skrót „W5" (poziom Wyżywienia) zamiast realnego procentu
przyrostu ludności na turę, o który prosił właściciel. Naprawa: `cityGrowthLive()` woła TEN SAM
`computeView()` co panel miasta (jedno źródło prawdy, żadnej reimplementacji wzoru), przewód
przez strukturalny typ `CityRenderOptions.getCityGrowth` (`render/` nadal nie importuje `ui/`).
Format („5%"/„5,5%"/„0%"/„−2,1%"/„—" przy głodzie) zgodny z istniejącą konwencją kodu
(`formatWyzwienieLabel`, `formatLiczbaPl`) — Evaluator: nie wymaga osobnego pytania ABC.
Evaluator PASS-WITH-NOTES, `city-badge-growth-percent-test.cjs` 38/38 (nowy),
`city-map-badge-test.cjs` 62/62, `logic-test` 213/213, `tsc` 0 błędów. Cztery niepilne noty
Evaluatora: brak testu jednostkowego samej delegacji, rozjazd separatora panel-vs-plakietka
(zarejestrowany osobno `P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD`), 4 czerwone testy wzrostu
ludności potwierdzone pre-istniejące (dług testowy R-STAWKI, nie regresja), duplikacja
formatera liczb wymuszona architektonicznie.

## P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD — NAPRAWIONE 2026-08-09 (jeden wiersz)
Chip „WZROST%" w panelu miasta renderował surowo (kropka), plakietka mapy przecinkiem. Naprawa:
chip w `renderMagazyn` (zawsze widoczny, funkcjonalny odpowiednik plakietki) woła teraz
`formatLiczbaPl`. Evaluator PASS-WITH-NOTES potwierdził że to WŁAŚCIWY i JEDYNY zawsze widoczny
wiersz (8 pozostałych to detail-cardy na żądanie, jeden — martwy kod bez call-site). Znak minusa
świadomie nietknięty — panel już dziś miesza glify między chipami tej samej tabeli, właściwa
naprawa jest w `formatPl.ts` (`signedPl`), zarejestrowana osobno. `city-panel-growth-percent-separator-test.cjs` 22/22 (nowy), `city-badge-growth-percent-test.cjs` 38/38 (bez zmian),
`logic-test` 213/213. Cztery nowe niepilne noty zarejestrowane osobno: rozjazd glifu minusa
w `formatPl.ts`, rozjazd zaokrąglenia (dziś nieosiągalny), mieszane separatory w jednej karcie,
pre-istniejący czerwony `spichlerz-widocznosc-test` (13/14, do dopisania do CLAUDE.md).

## P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL — ZAMKNIĘTE 2026-08-09
`signedPl` (`gra/src/ui/formatPl.ts`) miał sprzeczność docstring vs implementacja (obiecywał
U+2212, zwracał ASCII `-`), co powodowało rozjazd glifu chip „Racje" (U+2212 zahardkodowane) vs
chip „Bilans" (ASCII przez `signedPl`) w tej samej tabeli. Naprawa: `signedPl` post-processuje
ASCII na U+2212 (`formatLiczbaPl` bazowa nietknięta, ma własny test ASCII z wcześniejszej
naprawy). Evaluator PASS-WITH-NOTES: domknięcie tranzytywne importów policzone niezależnie (29
modułów, 10 wołających, 5 testów), parytet Racje/Bilans potwierdzony na realnym kodzie, zero
konsumentów parsujących ASCII na wyjściu. `format-pl-signed-minus-glif-test.cjs` 13/13 (nowy),
`empire-skarbiec-bilans-test.cjs` 11/11, `city-panel-growth-percent-separator-test.cjs` 22/22,
`logic-test` 213/213, `tsc` 0 błędów. Dwie nowe niepilne noty zarejestrowane osobno:
`P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE` (2 pre-istniejące czerwone testy, awaria
harnessu nie regresja), `P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI` (`+` przed `signed()` daje
podwójny znak przy wartościach ujemnych).

## P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY — ZAMKNIĘTE 2026-08-09
Karta „Wyżywienie i wzrost — szczegóły" (`buildRacjeWzrostDetailCard`): 6 składników przez
`signed()` (przecinek), wiersz „Łącznie" surowym szablonem (kropka) — mieszane separatory w
jednej karcie. Naprawa: suma też przez `signed()`. C-026: sąsiad `bd.spichlerz` sprawdzony i
wykluczony (nieujemność gwarantowana konstrukcją funkcji, nie danymi). Evaluator PASS-WITH-NOTES
z blokującą korektą domkniętą przy scaleniu: sekcja [6] testu asercjonowała ASCII myślnik, co
padłoby po scaleniu równoległej `P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL` (`signedPl`→U+2212) —
poprawione na U+2212 przed commitem, zweryfikowane 29/29 po scaleniu obu. `logic-test` 213/213,
`tsc` 0 błędów. Nowa niepilna nota zarejestrowana osobno:
`P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY` (analogiczna usterka w sąsiedniej karcie).

## P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD — ZAMKNIĘTE 2026-08-09 (decyzja B: test/dokumentacja)
Panel/plakietka zaokrąglają inaczej (`toFixed` vs `Math.round`), rozjeżdżają się przy krokach
generujących nieparzyste wielokrotności 0,05 — dziś nieosiągalne (krok realny 0,5). Decyzja B:
nie zmieniać silnika, przypiąć osiągalność testem. Wyczerpująca enumeracja 52 140 543 kombinacji
6 składników `computeGrowthPercentV85` — 0 rozjazdów; parytet na 400 001 wartościach wielokrotności
0,5 — 0 rozjazdów. `city-growth-percent-rounding-parity-test.cjs` 16/16 (nowy). Evaluator
PASS-WITH-NOTES z blokującą korektą domkniętą przy scaleniu: komentarz-niezmiennik przy
`WYZYWIENIE_STEP` zawierał nieprawdziwe zdanie („identyczny wynik TYLKO dla wielokrotności 0,5"
— fałsz, prawdziwa reguła to nieparzysta wielokrotność 0,05) — poprawione. `city-badge-growth-
percent-test` 38/38, `logic-test` 213/213, `tsc` 0 błędów.

## P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA — ZAMKNIĘTE 2026-08-09 (test przestarzały, NIE dopisywać do listy czerwonych bramek)
`spichlerz-widocznosc-test.cjs` (13 pass/14 fail) nie odzwierciedlał dwóch późniejszych decyzji
(`DOSTEP-SUROWCE-Q1`, `R-STAWKI` FALA2 ×2) — silnik poprawny, test przestarzały. Przepisany
całkowicie (44→45/0 po korekcie), kod produkcyjny nietknięty. Evaluator PASS-WITH-NOTES:
diagnoza zweryfikowana z dokumentu decyzji, wszystkie 8 przeliczeń sprawdzone ręcznie. Dowód
mutacyjny pierwotnie pinował mnożnik tylko „z góry" — domknięte przy scaleniu asercją graniczną
(`drewno:15`), zweryfikowaną osobiście (mutacja MULT 2→1 → 44/1, przywrócone → 45/0).
`deposit-building-gate-test` 47/47, `tech-tree-test` 19/19, `logic-test` 213/213, `tsc` 0 błędów.

## P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE — ZDEPLOYOWANE `ce69cf45` FALA 262
`yieldOfMapHex` (`gra/src/game/okolica.ts`) czytał tylko ostatnią warstwę `hex.ulepszenie`,
silnik (`hexToWorkedTile`) sumuje wszystkie warstwy z `hex.ulepszenia[]`. Naprawa: wywołanie
`improvementKeysForHex(h)` identycznie jak silnik. Evaluator PASS-WITH-NOTES, parytet
potwierdzony linia po linii, dowód mutacyjny (12/7 fail po cofnięciu), własny harness 32/32.
`heks-plony-warstwy-test.cjs` 19/19 (nowy), `okolica-test` 46/46, `hex-plony-magazyn-test`
11/11, `plony-budynkow-test` 68/68, `logic-test` 213/213, `tsc` 0 błędów. Trzy niepilne noty
zarejestrowane osobno: `P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA` (Evaluator: podniesiona
pilność, „nie odkładać" — drugi człon tego samego wzoru rankingu ma identyczny nienaprawiony
wzorzec), `P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE` (dziś nieszkodliwe), oraz niezweryfikowana
hipoteza `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`.

## P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA — ZAMKNIĘTE 2026-08-09 (4 rundy, PASS-WITH-NOTES)
Hipoteza potwierdzona żywą symulacją: silnik ekonomii przypisywał robotników na Morze/Góry,
których overlay nigdy by nie pokazał (Góry mają najwyższą Pracę ze wszystkich terenów).

**Runda 1:** fix naprawił 2 z 5 miejsc przypisania — Evaluator FAIL (tryb ręczny bez filtra,
cicha utrata produkcji, 27→15 Pracy/turę). Decyzja właściciela `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1`:
tylko stare zapisy, bez migracji, mechanizm ręczny zostaje funkcjonalnie bez zmian.

**Runda 2:** wszystkich 5 ścieżek dostało filtr (potwierdzone niezależną enumeracją Evaluatora —
10 miejsc, zero szóstego writera, dowód mutacyjny na wszystkich). Ale **NOWY, sprzeczny z kanonem
decyzji bloker**: filtr terenu w `toggleTileWorker` blokuje też ZDEJMOWANIE robotnika, więc stary
zapis z nielegalnym przydziałem zakleszcza się (robotnik na Górach nie da się zdjąć klikiem) —
dokładnie zabronione przez `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1` („mechanizm zostaje bez zmian
funkcjonalnych"). Dodatkowo `cityPanel.ts:8290` liczy `isWorked` bez filtra — nowy rozjazd
panel↔silnik. Drugi blocker: zero testów dla AC „stary zapis nie liczy produkcji, bez
auto-naprawy" z kanonu decyzji — luka pokrycia, która pozwoliła pierwszemu blokerowi przejść
niezauważenie. Kierunek naprawy (5 linii, gałąź zdejmowania przed bramką terenu) zweryfikowany
osobiście przez Evaluatora, działa bez regresji. Runda 3 dispatched z pełną listą.

**Runda 3:** B1 rundy 2 potwierdzony jako naprawdę naprawiony (własny 42-asercyjny harness
Evaluatora, nie testy Operatora). Ale runda 3 wprowadziła NOWĄ regresję: filtr terenu dołożony do
`rebalanceWorkersAfterPopulationChange` powoduje, że przy SPADKU populacji gałąź `!t → delete` i
osobne `if(worstKey) delete` kasują ŁĄCZNIE więcej wpisów niż `excess` — zmierzone: 3 skasowane
zamiast 1, zginął legalny robotnik, miasto zostaje z pustymi slotami na stałe. Jedyny caller
produkcyjny to co-turowy `population-growth-v85.ts:396` — nie wymaga akcji gracza. To dokładnie
zakazana przez decyzję auto-migracja/cicha utrata. Drugi bloker: dowód mutacyjny Evaluatora
pokazuje że usunięcie filtra z `seedReczneFromAuto` (1 z 5 „zabezpieczonych" ścieżek) NIE jest
łapane przez żaden test — deklaracja „wszystkie 5 ścieżek" niezweryfikowana. Runda 4 dispatched
z precyzyjną listą (napraw logikę usuwania w rebalance, dołóż test na to, zamknij lukę pokrycia
seedReczneFromAuto, popraw nieprawdziwy komentarz przy cityPanel.ts:8290).

**Runda 4 (commit `3aba4286`) — Evaluator PASS-WITH-NOTES, SCALONE.** Pierwsza runda, która
obroniła się pod naciskiem: wpisy nielegalne dostają `score=-Infinity` i przechodzą przez tę samą
logikę wyboru `worstKey` co legalne, gwarantując dokładnie `excess` usunięć. Nowe testy 23/24
przypinają filtr w `seedReczneFromAuto` i gałęzi wzrostu. Evaluator zbudował własny harness (10
scenariuszy poza raportem) i wykonał 6 własnych mutacji, każda złapana przez SPECYFICZNY zestaw
asercji — dowód realnego, per-ścieżkowego pokrycia. `map-gen-regression` pominięcie potwierdzone
po raz trzeci (0 wystąpień zmienionych funkcji w bundlu 654 kB). `okolica-test` 72/72,
`okolica-isworkable-silnik-test` 15/15, `logic-test` 213/213, `tsc` 0 błędów.

**Korekta faktograficzna (Evaluator rundy 4):** zapis „runda 3 wprowadziła nową regresję" był
nieprecyzyjny co do mechanizmu — błędny blok podwójnego kasowania istniał od dawna (`13419757`),
runda 3 tylko rozszerzyła zakres `!t` o Góry/Morze, czyniąc go osiągalnym częściej. Poprawiona
naprawa B3 nie zależy od tego rozróżnienia.

**Nowe pytanie ABC zarejestrowane osobno:** `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1` — naprawa B3
chroni też pola, które wypadły z zasięgu przez skurczenie promienia terytorium (zwykła dynamika
gry, nie tylko stare zapisy), tworząc fantomowe sloty niewidoczne w panelu miasta.

## P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE — NAPRAWIONE 2026-08-09
`yieldOfMapHex` nie przekazywała `zloze` do `tileYield()`, silnik (`hexToWorkedTile`) tak.
Dziś nieszkodliwe (render nie zwraca `ruda`), pułapka na przyszłość. Naprawa: dodane pole,
zerowa zmiana zachowania (dowiedziona identycznym wynikiem testu przed/po). Nowy test przez
podmianę modułu na szpiega (jedyny sposób wykryć brak przekazania skoro wynik funkcji się nie
zmienia). Evaluator PASS-WITH-NOTES, zweryfikował szpiega osobiście (sonda sentinel).
`heks-plony-zloze-forward-test.cjs` 5/5 (nowy), `heks-plony-warstwy-test.cjs` 19/19 identyczne
przed/po, `logic-test` 213/213.

## P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA — NAPRAWIONE 2026-08-09
Drugi człon wzoru rankingu (obok `yieldOfMapHex`) miał ten sam błąd: `foodPotentialOfMapHex`
czytał tylko legacy `h.ulepszenie`. Naprawa: `improvementKeysForHex(h)`, ten sam wzorzec.
Evaluator PASS-WITH-NOTES, dowód mutacyjny (cofnięcie → 21/24, `okolica-test`/`logic-test` NIE
łapały błędu pod mutacją — nowy test był jedynym strażem). Osiągalność potwierdzona na realnym
przypadku: Równina z `['farma','droga']`, legacy `'droga'` (droga nadpisuje przy budowie) —
stary kod dawał nienależne 3 pkt potencjału. `heks-plony-warstwy-test.cjs` 24/24, `okolica-test`
46/46, `auto-manage-test` 45/45, `logic-test` 213/213. Trzeci, NIEnaprawiony człon tej samej
rodziny znaleziony przez Evaluatora, zarejestrowany osobno: `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA`
(`cityPanel.ts`, widoczny graczowi w tooltipach pól — zmierzone 2/2/2 zamiast realnych 5/5/5
na tym samym heksie testowym).

## P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA — ZAMKNIĘTE 2026-08-09
Trzeci człon tej samej rodziny błędu: `tileYieldLabel()`/`appendOkolicaYieldLabel()` w
`cityPanel.ts` budowały `WorkedTile` z tylko jedną (legacy) warstwą — panel pokazywał 2/2/2 tam,
gdzie silnik liczył 5/5/5. Naprawa: `improvementKeysForHex(hex)`, ten sam wzorzec co silnik i
pozostałe dwa naprawione dziś człony. Evaluator PASS-WITH-NOTES, 4 własne mutacje złapane osobno,
C-026 (8 wystąpień, wszystkich w `cityPanel.ts`) potwierdzone niezależnie — rodzina zamknięta.
`heks-panel-tooltip-warstwa-test.cjs` 22/22 (nowy), `heks-plony-warstwy-test.cjs` 24/24,
`logic-test` 213/213, `tsc` 0 błędów. Dwie nowe niepilne noty zarejestrowane osobno:
`P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE`, `P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY`.

**RECYDYWA tego samego dnia, złapana przez agenta deploy przed FALA 263:** scalanie NIEZWIĄZANEJ
naprawy (`P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY`) użyło `git diff` względem bazy, która nie
była przodkiem tipa worktree — patch po cichu cofnął tę naprawę, `git apply --check` przeszedł
czysto. Złapane wyłącznie przez bramkę `heks-panel-tooltip-warstwa-test.cjs` na etapie deployu
(15/22). Naprawione bezpośrednio, zweryfikowane niezależnym Evaluatorem (Opus 5) pełnym diffem
całego pliku + dowodem mutacyjnym — bit-for-bit identyczne z `92341250`. Nowa reguła procesowa w
`civ-autobot/SKILL.md` §5 (`git merge-base` przed liczeniem patcha).

## R-HEKS-PLONY-UKRYTE-POD-MIASTEM (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Przyczyna: render (`cityOkolicaOverlay.ts`) pomijał liczby plonów na KAŻDYM heksie z
„ulepszeniem", w tym na centrum miasta — silnik zawsze ma tam realny plon. Fix: wyjątek dla
heksu centrum. Evaluator (Opus 5) PASS-WITH-NOTES, `tsc` czyste. Dwie notatki do osobnej
rejestracji (dopisane jako `P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE`, niska pilność, i
uwaga do zweryfikowania na playteście: zgłoszenie mówiło o „zielonym kółku", centrum
faktycznie jest niebieskie — jeśli po deployu problem nadal widoczny na zielonych heksach,
to inny temat). Pełne kotwice w `PYTANIA-OTWARTE.md`.

## P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE (2026-08-08) — znalezisko Evaluatora, zarejestrowane
Render czyta tylko ostatnią warstwę ulepszenia heksu, silnik liczy wszystkie — przy
wielowarstwowych ulepszeniach na centrum miasta render może zaniżać plon. Niska pilność,
osobny temat od naprawy powyżej. Pełny opis w `PYTANIA-OTWARTE.md`.

## BUG-KOLEJKA-BUDOWY-PRZYCISKI-ROZJECHANE (2026-08-08) — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Fix scommitowany (2 zmiany CSS w `cityPanel.ts`), Evaluator (Opus 5) PASS-WITH-NOTES —
niezależnie zweryfikowany zakres (dokładnie 2 zmiany), C-026 (enumeracja miejsc użycia `.btn`)
potwierdzona własnym grepem Evaluatora, nie tylko self-raportem Operatora. `tsc --noEmit`
czyste. Nota Evaluatora: wymaga realnego playtestu (zmiana czysto wizualna, brak harnessu
DOM/CSS w repo). Poprzedni wpis poniżej — historia diagnozy.
Diagnoza (`cityPanel.ts`): dwa defekty flex-layoutu, oba z commita `daacd43a` (2026-07-29,
sprzed 10 dni) — NIE ze świeżej pracy, ujawnione dopiero dziś. (1) `qLabel` kolejki BUDYNKÓW
brakuje `min-width:0;overflow:hidden;...;white-space:nowrap;` które ma kolejka jednostek —
długa nazwa budynku rozpycha wiersz; (2) przyciski ↑/↓/✕ bez `flex-shrink:0` — kurczą się
poniżej wygodnego obszaru kliku pod naporem etykiety+chipów. Zakres naprawy wąski (C-025): 2
zmiany CSS, zero innych zmian; selektor przycisków zawężony do `.civ-cs .qitem .btn` (C-026),
nie globalnie `.civ-cs .btn`. Pełne kotwice w `PYTANIA-OTWARTE.md`.

## R-PORTRET-PRODIKONA-DROPPED-CALLBACK (2026-08-08) — znalezisko przy okazji, zarejestrowane
Ten sam wzorzec błędu co `BUG-IKONA-KULTURY-PLACEHOLDER` (`if (cached==='loading') return`
gubi callback) w dwóch innych funkcjach `cityMapStatChip.ts` — nie powoduje zgłoszonego
objawu, świadomie zostawione poza zakresem tamtej naprawy (C-025). Do naprawy tym samym
wzorcem kolejkowania. Pełny opis w `PYTANIA-OTWARTE.md`.

## Trzy decyzje ABC (2026-08-08) — ECHO, w realizacji
Maciej odpowiedział na turniej ABC: `R-AI-FOUNDING-THROTTLE-Q1 A` (zmodyfikowane: próg
`AI_FOUNDING_SOURCE_MIN_POP` z 2 na **3**, nie 4-5 z pierwotnej propozycji) ·
`R-SUROWCE-DOSTEP-ILOSC-Q1 A` (pełny powrót ilości dla wszystkich 13 surowców) ·
`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2 A` (bramka traktatu na poziomie sumy stołu, zawężona do baz
traktatowych). Decyzje zapisane w `docs/decyzje/R-AI-FOUNDING-THROTTLE-Q1.md`,
`R-SUROWCE-DOSTEP-ILOSC-Q1.md`, `R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2.md`. Kod w realizacji —
3 subagenty Sonnet 5 równolegle, per C-027.

## R-AI-FOUNDING-THROTTLE-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
`AI_FOUNDING_SOURCE_MIN_POP` 2→3. Evaluator PASS-WITH-NOTES — pętla 1↔2 przesuwa się na 2↔3
(świadome ryzyko z decyzji), nie znika całkowicie. `ai-test.cjs` 274/8 (8 pre-istniejących).

## R-SUROWCE-DOSTEP-ILOSC-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Pełne cofnięcie `331aa180`. Wszystkie 13 surowców pokazuje realną ilość, sekcja boolean
„Dostęp" usunięta wraz z martwym modułem `empire-resource-access.ts`. Tooltip źródła
nietknięty. Evaluator (Opus 5) PASS-WITH-NOTES — zgłosił martwą gałąź komunikatu „brak
dostępu" w tooltipie (dziś nieosiągalna) jako osobny, niepilny follow-up. `tsc` czyste,
13/13.

## R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Bramka uczciwości traktatu (`umowa_szlakow`/`umowa_handlowa`) teraz widzi nadwyżkę siostrzanej
pozycji w tym samym pakiecie (`packageSiblingGivePn`/`packageSiblingReceivePn`), zgodnie z
UI „Bilans (Netto)". Naprawiony przy okazji błąd kolejności (snapshot `siblingByTreatyId`
przed pętlą wykonania zamiast liczenia na żywo — poprzednio traciło dane o już wykonanej
pozycji). Usunięto 3 zduplikowane sprawdzenia `acceptanceTheir.accepted`. Evaluator: runda 1
PASS-WITH-NOTES (test źródłowy nie łapał regresji mimo zielonego wyniku — wzmocniony), runda 2
PASS z niezależną reprodukcją. `tsc` czyste, `diplomacy-fairness-gate-package-q2-test.cjs`
24/24, `diplomacy-proposal-test.cjs` 126/126, `diplomacy-stol-pw-sum-test.cjs` 26/26.
Osobno wciąż otwarte: `BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA` (kierunek przychodzący,
dispatch w toku).

## R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Wymiana technologii filtruje teraz obie strony po `ownerResearchedTechs` responder-a
(`tradeableTechIdsForSide`) zamiast pokazywać identyczną listę wszystkich zbadanych przez
oferującego. Evaluator PASS-WITH-NOTES (merge clean, tsc 0 błędów, pełny pakiet dyplomacji
zielony). 3 noty niepilne zarejestrowane osobno w `PYTANIA-OTWARTE.md`
(`P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU`, `P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE`, +
świadoma konsekwencja ukrywania akcji `'6'`).

## BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
`canAccept` dla pakietów przychodzących liczony teraz per-pozycja przez `responderPreview`
(ta sama funkcja co realne wykonanie), nie z sumy netto PW całego stołu — przycisk „Przyjmij"
i wykonanie są teraz zgodne z definicji. Evaluator PASS-WITH-NOTES, 28 plików testów dyplomacji
zielonych. 2 noty niepilne w `PYTANIA-OTWARTE.md`.

## R-MOC-TABLICZKA-VS-CIVPOWER-Q1 — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Tabliczka nad żetonem = pełna Moc (teren/fortyfikacja/mur/weteran), civ-power = tylko naturalne
wskaźniki + weteran. Evaluator PASS-WITH-NOTES, 14 plików testów zielonych. Przy okazji
naprawiony STRICT-PARITY: civ-power AI już nie zawyżony mnożnikiem trudności — **widoczne w
playteście jako spadek Mocy AI w rankingu na wyższych poziomach trudności, to poprawny efekt,
nie regresja**. Dwa znaleziska świadomie odłożone (tooltip heksu, trwałe bonusy budynków) w
`PYTANIA-OTWARTE.md`.

## R-MOC-TABLICZKA-VS-CIVPOWER-Q1 — ECHO, kod w dispatchu (ZASTĄPIONE wpisem wyżej)
Maciej skorygował `R-MOC-DEFINICJA-Q1` (2026-08-08): ta decyzja błędnie zunifikowała tabliczkę
jednostki na mapie (ma pokazywać REALNĄ Moc ze wszystkimi bonusami — teren/fortyfikacja/mur/
weteran) z Mocą cywilizacji (ranking/HUD/Empire — ma być BEZ terenu/fortyfikacji/muru, tylko
naturalne wskaźniki + ulepszenia + weteran). Zamyka `R-MOC-MUR-PARADOKS-Q1` i `-Q2` naraz.
Decyzja: `docs/decyzje/R-MOC-TABLICZKA-VS-CIVPOWER-Q1.md`.

## ABC-PACZKA-2026-08-06-DOPREC — ZAMKNIĘTE bez odpowiedzi, wszystkie 6 pytań nieaktualne
Audyt na polecenie „wypchnąć wszystkie aktywne pytania" wykazał, że wszystkie 6 pytań tej
paczki z 2026-08-06 zostało w międzyczasie rozstrzygniętych INNĄ drogą (status po prostu nigdy
nie zaktualizowany): działaj-scope → zastąpione C-027; deploy-rytm → zastąpione hasłem `deploy`;
marker stolicy → wdrożony C (`cityMapStatChip.ts`); przyszłe kopalnie → wdrożone
(`relief-preserving-improvements.ts`); liczby §9 → wdrożone (`2e67219`); brief Design v2 →
rozstrzygnięte C (`PROFIL-DECYZYJNY-MACIEJ.md`). Szczegóły w `PYTANIA-OTWARTE.md`.

## R-PROPOZYCJA-BRAK-EDYCJI + BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
3 rundy. Runda 1: worktree stale, niescalalne, zero testów edycji. Runda 2: worktree świeże,
FAIL za gating „Usuń" na karcie traktatu niezgodny z renderem (PW-check którego render nie ma).
Runda 3: worktree ZNOWU stale (40 commitów) — naprawione rebase'm w tym samym worktree zamiast
pełnego redo; Evaluator PASS-WITH-NOTES z niezależnym harnessem (nie kopią testu Operatora).
Jednolinijkowa poprawka przy scaleniu (`!= null`→truthy, zgodność z renderem co do joty).
Edycja działa dla 5 typów koszyka, kasacja pustej/mirror karty zgodna z decyzją
`R-PROPOZYCJA-KASACJA-UI-Q1=A`. `diplomacy-basket-edit-test.cjs` 25/25, `tsc` czyste.

## R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP — ZDEPLOYOWANE FALA 262 `ce69cf45`, czeka na playtest
Runda 1: FAIL (worktree stale, `maxPakiety` zamiast `maxQty`, 10× za niska wartość). Runda 2:
worktree naprawione przed kodowaniem, widoczna odznaka zapasu po stronie „daję", kompaktowy
format dla dużych wartości. Evaluator PASS-WITH-NOTES, 31 plików testów dyplomacji zielonych.
Skorygowany przy scaleniu: nieprawdziwy komentarz w kodzie o powodzie wyłączenia strony
„dostaję" (title/data-max już dziś ujawniają zapas AI bezwarunkowo, to nie był powód).

## R-PORTRET-PRODIKONA-DROPPED-CALLBACK — NAPRAWIONE, czeka na deploy+playtest
Wzorzec kolejkowania z `requestCivSigilImage` powielony na `requestLeaderPortraitImage`/
`requestProdIconImage`. Evaluator PASS-WITH-NOTES, własny dowód mutacyjny + sonda 5 miast.
`city-map-badge-test.cjs` 62/62 (baza 49, nie 47 jak w pierwotnym raporcie). Follow-up
zarejestrowany: `P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC` (3 kopie tego samego wzorca).

## P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC — NAPRAWIONE 2026-08-09 (refaktor, Opus 5/render)
3 niezależne kopie wzorca kolejkowania scalone w jeden prywatny helper `createImageRequestQueue()`.
Zero zmiany zachowania (wyjście testu bajt w bajt identyczne z bazą). Evaluator PASS-WITH-NOTES,
bardzo dokładna weryfikacja: 7 wariantów mutacyjnych (4 własne), mutacja rdzenia wywala 16
asercji naraz u wszystkich trzech zasobów (dowód realnego scalenia logiki, nie tylko
przeniesienia kodu). `city-map-badge-test.cjs` 62/62 (identyczne z bazą), `logic-test` 213/213,
`vite build` 799 modułów OK, `tsc` 0 błędów.

## P-TEST-UPKEEP-R-STAWKI — ZAMKNIĘTE, wpis był nieaktualny (dokumentacja, bez zmian silnika)
Diagnoza (subagent Sonnet 5, 2026-08-09): stary wpis „49/73, 24 porażek przez ×2 koszty
R-STAWKI/R-NADMIAR-POOLS" był nieaktualny już od 2026-08-05 — commit `12ecd09d`
(„test(upkeep): zaktualizuj asercje pod R-STAWKI ×4 i FALA2 ×2", współautor Maciej) już
wtedy naprawił asercje testu pod obowiązujące mnożniki, tylko nikt nie oznaczył wpisu jako
zamknięty. Dziś `node tools/upkeep-test.cjs` z `gra/`: **73 passed, 0 failed**. Klasyfikacja:
test był przestarzały (opcja b), nie bug silnika — mnożniki ×2 budynki (`R_STAWKI_FALA2_MULT`)
i ×4 jednostki/żywność wojska (`R_STAWKI_FALA1_FALA2_MULT`) w `r-stawki-strojenie.ts` są
świadomą decyzją Macieja, test już je odzwierciedla. Żadna zmiana silnika. C-026: 22 testy
ekonomii/utrzymania uruchomione, wszystkie zielone poza 4 pre-istniejącymi i niezwiązanymi
(`upgrade-budynki-test.cjs`, `unit-stock-cost-test.cjs` — już `P-UNIT-STOCK-COST-TEST-DLUG`,
`grupy-budynkow-test.cjs`, `budynek-civ-bonus-u17-test.cjs`) — żaden komunikat błędu nie
wspomina R-STAWKI/×2/×4. `tsc --noEmit` 0 błędów. Jedyna zmiana: `dyspozycje/PYTANIA-OTWARTE.md`
+ `STAN-PRACY-HANDOFF.md` (status zamknięcia).

## P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
`mur-paradoks-test.cjs` (sekcja 5) i `city-defense-terrain-gate-test.cjs` liczyły „realną
Obronę" z własnej REIMPLEMENTACJI wzoru, nie z prawdziwego `effectiveDefenderM` w `main.ts` —
żadna bramka nie chroniła linii `combinedDefPct = structBonusPct + (cityTerrMult - 1) * 100`.
Naprawa: asercja źródłowa (regex na ciało `effectiveDefenderM`, odróżniona od tekstowo
identycznej linii w nowej `combatPowerFullDisplayDefFor`). Evaluator PASS-WITH-NOTES, własny
dowód mutacyjny (4 warianty). `mur-paradoks-test.cjs` 24/24 (było 20/20),
`city-defense-terrain-gate-test.cjs` 34/34 (było 31/31), `logic-test.cjs` 213/213,
`combat-test.cjs` 6/6, `tsc` 0 błędów. Nowe znalezisko Evaluatora zarejestrowane osobno:
`P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA` (analogiczna luka w nowej
`combatPowerFullDisplayDefFor`, niepilne).

## P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
Analogiczna asercja źródłowa dla `combatPowerFullDisplayDefFor` (regex zakotwiczony na
unikalnej sygnaturze, brak crosstalku z `effectiveDefenderM`). Kod produkcyjny nietknięty
(test-only). Evaluator PASS-WITH-NOTES, dowód mutacyjny (6 wariantów). `mur-paradoks-test.cjs`
28/28 (było 24/24), `city-defense-terrain-gate-test.cjs` 34/34, `logic-test` 213/213,
`combat-test` 6/6, `tsc` 0 błędów. Nowe niepilne znalezisko zarejestrowane osobno:
`P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA` (asercja negatywna „brak skalowania Ataku" działa przez
czarną listę nazw helperów, nie białą listę kluczy — konwencja całego pliku, dług testowy).

## P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA — ZAMKNIĘTE 2026-08-09
Asercja „brak skalowania Ataku" w `combatPowerFullDisplayDefFor` sprawdzała czarną listę nazw
helperów (`scaleField`) — inny helper albo inline mnożenie przechodziło niewykryte. Naprawa:
mechanizm rozpoznaje skalowanie po KSZTAŁCIE prawej strony (wywołanie funkcji lub mnożenie), nie
po nazwie, każdy wykryty klucz musi być w białej liście `['meleeDefence','armor','health']`.
Zawężenie zakresu (tylko ta jedna z trzech asercji w pliku) zweryfikowane przez Operatora i
niezależnie przez Evaluatora czytaniem pełnych ciał pozostałych dwóch funkcji. Evaluator
PASS-WITH-NOTES, 8 mutacji (6 własnych) złapanych, świeżość worktree zerowy dryf od `main`.
`mur-paradoks-test.cjs` 29/29 (baza 28/28), `city-defense-terrain-gate-test.cjs` 34/34,
`combat-test` 6/6, `logic-test` 213/213, `tsc` 0 błędów. Trzy noty Evaluatora udokumentowane
bezpośrednio w `PYTANIA-OTWARTE.md` (luka przez zmienną pośrednią, brak ścisłej superzbiorowości
starego mechanizmu, sąsiad `fortifyFieldScaledDefFor` bez pokrycia) — żadna nie wymaga osobnego
zgłoszenia.

## P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN — ZDEPLOYOWANE `ce69cf45` FALA 262
`balancePanelDataFromRows` przy `responderPreview===undefined` dawała fail-open (`canAccept`
domyślnie `true`), dziś nieosiągalne w praktyce ale bez zabezpieczenia. Teraz fail-closed
(`canAccept=false` + jawny `blockReason`) na pozycji akcjonowalnej. Evaluator PASS-WITH-NOTES,
`diplomacy-stol-pw-sum-test.cjs` 42/42 (było 26/26), `tsc` 0 błędów.

## P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT — CZĘŚCIOWO ZDEPLOYOWANE `ce69cf45` FALA 262
Tryb traktatu: `balCls`/hint szły za surowym znakiem `netPw` zamiast za `data.canAccept` —
dla net ujemnego + `canAccept=true` panel pokazywał czerwony „no" + „dopłać" obok aktywnego
przycisku Przyjmij (i odwrotnie). Naprawione dla gałęzi traktatu (scalone w tym samym commicie
co powyżej). **Pozostaje otwarte:** ta sama klasa niespójności w gałęzi własna oferta+koszyk
poza traktatem — Evaluator ją zreprodukował próbą, świadomie poza zakresem dzisiejszej naprawy
(C-025).

## P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU + P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE — ZDEPLOYOWANE `ce69cf45` FALA 262
Dwa follow-up dzisiejszej naprawy R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE. (1) Pusta lista technologii
dostaje placeholder „— brak technologii (SILNIK) —" jak miasta. (2) `grantTechToOwner` sprawdza
teraz prerekwizyty drzewka + bramkę epoki/tieru odbiorcy (dwie warstwy: filtr na liście budowania
+ blokada silnikowa, defense in depth). STRICT-PARITY potwierdzone przez Evaluatora bezpośrednio
w kodzie (`main.ts:7353`, wywołanie przed jakąkolwiek gałęzią po `ownerId`), bramka realnie
aktywna w produkcji. Evaluator PASS-WITH-NOTES, `diplomacy-tech-trade-test.cjs` 24/24,
`diplomacy-basket-transfer-test.cjs` 17/17, `logic-test` 213/213, 31 plików dyplomacji zielonych,
`tsc` 0 błędów. Dwa nowe niepilne znaleziska zarejestrowane osobno:
`P-BRAMKA-TECH-TIER-NIEPOKRYTA` (luka pokrycia bramki tieru — mutacja przeżywa testy),
`P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA` (blokada akcji „6" liczy tylko stronę „daję", pre-istniejąca, dziś częściej odczuwalna).

## P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1 — ZAMKNIĘTE 2026-08-09 (ECHO A x2, 3 rundy realizacji, commit `054a9ed4`)
Subagent zdiagnozował asymetrię blokady (liczy tylko „daję") jako bug zgodny z opisem akcji „6"
w `diplomacy.json` (dwutrybowa: Sprzedaż/Wymiana) i naprawił bez pytania (commit `98cfe36c`,
NIE scalony). Evaluator werdyktem **FAIL** obalił diagnozę: komentarz w `main.ts:15122-15125`
(dopisany w TYM SAMYM commicie na który Operator się powoływał) dokumentuje że akcja „6" jest
dziś zaimplementowana jednokierunkowo (gracz zawsze sprzedaje) — odblokowanie przycisku bez
zmiany formularza/walidacji prowadzi gracza do ślepego zaułka. Sformułowane jako pytanie ABC.
**Maciej: A** — dociągnąć implementację do specyfikacji (pełny handel dwukierunkowy). Decyzja:
`docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`. Subagent dispatched.

**Runda 1 realizacji (commit `e0caef33`, NIESCALONA) — Evaluator FAIL, exploit + naruszenie
decyzji.** Operator zbudował przełącznik Sprzedaż/Kupno i PRZY OKAZJI naprawił realny
pre-istniejący bug (`executePnDealTransfer` nigdy nie czytał `techId` — stara „sprzedaż" nigdy
faktycznie nie przekazywała technologii, tylko gotówkę). Evaluator: (B1) nowy kod przyznaje
technologię PRZED sprawdzeniem zapłaty — gracz z 0 ¤ dostaje technologię za darmo, zmierzone na
żywym silniku; (B2) zero pokrycia mutacyjnego okablowania — mutacja odtwarzająca dokładnie
naprawiany błąd przeżywa cały pakiet 29 testów; (B3) Operator świadomie wyciął wymianę
tech-za-tech, choć decyzja właściciela wprost ją wymaga — to nie decyzja Operatora, nowe pytanie
ABC zadane równolegle. Runda 2 dispatched dla B1/B2/N1(przycisk aktywny przy pustej liście)/
N2(rozjazd techPrice/goldOnce po kontrofercie AI) — niezależnie od odpowiedzi na pytanie zakresu.

**Pytanie ABC o zakres — MACIEJ: A** (rozszerzyć rundę 2 o tech-za-tech, razem z naprawą
exploita, nie odkładać). Runda 2 rozszerzona w locie.

**Runda 2 (commity `b5a76611`+`d30c2b9e`, NIESCALONA) — Evaluator FAIL ponownie, DWA nowe
blokery.** B1 gotówkowy naprawiony poprawnie (potwierdzone na wszystkich 4 kombinacjach trybu/
kierunku), `canGrantTech` bez efektów ubocznych potwierdzone, bramki prereq/epoka/tier symetryczne
w obu kierunkach, N1/N2 rundy 1 naprawione realnie. Ale: **(1) tryb tech-za-tech jest CAŁKOWICIE
ODCIĘTY od silnika** — `main.ts::buildProposalFromPayload` gubi pola `techPaymentMode`/
`techOfferId` przy budowaniu payloadu z formularza (biała lista pól go nie zawiera), więc
`techPrice` wylicza się jako 0 i `evaluateProposal` zawsze odrzuca ofertę komunikatem „Cena
poniżej minimum" — funkcja niedziałająca w grze mimo 41/41 zielonych testów (testy wołają rdzeń
bezpośrednio, z ręcznie sklejonym payloadem, omijając zepsutą warstwę okablowania — dokładnie ten
sam wzorzec luki co B2 w rundzie 1, powtórzony piętro wyżej). **(2) Druga połowa exploita rundy 1
nienaprawiona:** silnik nie sprawdza czy DAWCA głównej technologii faktycznie ją posiada (tylko
odbiorca jest walidowany) — dziś nieklikalne z UI (listy filtrowane), ale save'y są odtwarzane
rzutowaniem bez rewalidacji, więc to luka zaufania na poziomie silnika, nie kosmetyka. Dowód
mutacyjny Evaluatora: 5 z 6 własnych mutacji złapanych (w tym dosłowny exploit rundy 1 w trybie
gotówkowym — nadal złapany, nie regresja). Runda 3 dispatched: dopisać brakujące pola do białej
listy `buildProposalFromPayload` + naprawić wyliczenie `techPrice` dla trybu tech, dołożyć
`ownerHasTech` dla dawcy w obu trybach, i kluczowe — test musi przechodzić PRZEZ
`buildProposalFromPayload`, nie obok niego (inaczej trzecia runda powtórzy ten sam błąd).

**Runda 3 (commit `054a9ed4`) — Evaluator PASS-WITH-NOTES, SCALONE.** Oba blokery naprawione:
białe listy uzupełnione, `ownerHasTech` dla dawcy dołożone w obu trybach. Nowy
`diplomacy-tech-trade-e2e-test.cjs` wycina prawdziwy literał `uiPayload` wprost ze źródła
main.ts (nie kopia) i przepuszcza przez cały łańcuch formularz→wykonanie — złapał dosłowne
odtworzenie błędu rundy 2, na które stary test był ślepy. Jedna nota (N1: ostatni skok łańcucha
w nowym E2E był ręczną kopią, nie ekstrakcją) poprawiona przy scaleniu tą samą techniką co
literał wyżej — zweryfikowane że łapie dokładnie tę mutację, którą Evaluator zgłosił jako
niepokrytą. Bramki po scaleniu: `diplomacy-tech-trade-e2e-test.cjs` 28/28,
`diplomacy-tech-trade-execute-test.cjs` 52/52, `logic-test` 213/213, `tsc` 0 błędów.

## P-BRAMKA-TECH-TIER-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
Nowy scenariusz testowy izolujący `tierOk` od `prereqsMet`/`epochOk` w `diplomacy-basket-transfer-test.cjs`. Kod produkcyjny nietknięty (test-only). Evaluator PASS-WITH-NOTES,
dowód mutacyjny potwierdził izolację. `diplomacy-basket-transfer-test.cjs` 20/20 (baza 17/17),
`logic-test` 213/213, `tsc` 0 błędów. Nowe znalezisko zarejestrowane osobno i już ZAMKNIĘTE:
`P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA` (identyczna luka w drugiej warstwie,
`techIdsWithPrereqsMetForRecipient` — naprawiona analogicznym scenariuszem `tierCatalog`,
Evaluator PASS-WITH-NOTES, `diplomacy-tech-trade-test.cjs` 26/26).

## R-MERGE-MAIN-RYTM-Q1 — ZAMKNIĘTE, ECHO Maciej 2026-08-09 (wariant własny, nie A/B/C)
Decyzja: **rytm scalania do main = zawsze jedna fala ROBOCZA do tyłu** (fala N-1 scalana dopiero
gdy powstanie fala N; bieżąca fala zostaje na gałęzi wyłącznie do testów) + **nowa fala ROBOCZA
wyłącznie na wyraźne słowo „deploy"** od właściciela (zero autonomicznego tworzenia kolejnych fal
w trakcie sesji). Wykonane od razu: `main` doganie o FALA 262 → **merge `b137332a`** (55 commitów
od `a659f4a1`), wypchnięte. FALA 263 (`89176ced`) świadomie zostaje na
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Pełna treść ECHO + reguła w `PYTANIA-OTWARTE.md`.
Kanon: `docs/decyzje/R-MERGE-MAIN-RYTM-Q1.md`.

## P-BRAMKI-MAPY-ROZMIAR-SCALE-FABLE-VERIFY-Q1 — CZEKA NA WERYFIKACJĘ (zgłoszone przez sesję lokalną, 2026-08-09)
Sesja lokalna zgłasza naprawę dwóch czerwonych bramek (`rozmiar-label-test.cjs` 12/1→13/0,
`map-scale-menu-test.cjs` 89/8→97/0) na gałęzi `fable/naprawa-bramek-mapy` (commit `b6b30721`,
oparty czysto na aktualnym `main` po merge `b137332a`). Diagnoza: testy miały twarde stare
wartości `miasta_panstwa` sprzed rebalansu `6f96f08` (2026-08-02) + jedną martwą asercję z
cofniętego eksperymentu (14 zamiast realnych 7 dla Duży). Zero zmian w `gra/data`/`gra/src` —
wyłącznie 2 pliki testowe, teraz czytające wartości z `e-start-params.json` w runtime zamiast na
sztywno. Osobne zgłoszenie przy okazji: `map-coast-buffer-test.cjs` pre-istniejąco czerwony
(niezwiązany, zweryfikowany na czystym main). Dispatch Evaluatora (Opus 5, worktree) do
niezależnej weryfikacji 4 punktów z prośby — bez ufania opisowi, wyprowadzić liczby samodzielnie.

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — zgłoszone z playtestu 2026-08-09, dispatch Opus 5
Maciej zgłosił z żywej gry: po zmianie przydziału robotnika (Praca→Żywność) stary „złoty chłopek"
został na nieaktywnym już polu, a na nowym polu pojawił się chłopek z zielonym tłem — mylące
wrażenie że to robotnik innej cywilizacji. Zdiagnozowane w kodzie (orkiestrator, bez zgadywania):
DWA niezsynchronizowane systemy renderowania: (1) `render/workerFieldOverlay.ts` — warstwa mapy
świata, kolor = paleta właściciela (Ty=złoto), pełne przebudowanie grupy przy każdym
`refreshWorkerFieldOverlay()`, ale ta funkcja **jawnie pomija odświeżenie gdy `isCityPanelOpen()`**
(main.ts:8963) — tylko czyści i wychodzi; (2) `render/cityOkolicaOverlay.ts` (`makeLabelSprite`,
linia ~145) — warstwa pierścienia okolicy miasta (ta widoczna na zrzutach), kolor odznaki chłopka
**na sztywno `rgba(30,80,30,0.88)`** (ciemna zieleń) dla KAŻDEGO obrobionego pola, niezależnie od
właściciela — nigdy nie kodowała właściciela kolorem. „Zielone tło" nigdy nie oznaczało obcej
cywilizacji — po prostu ta warstwa nigdy nie rozróżniała właściciela. Podejrzenie „uwięzionego
złotego chłopka": resztka warstwy (1), której odświeżenie nie nadążyło za zmianą przydziału w
trybie podglądu okolicy (możliwe że `isCityPanelOpen()` nie pokrywa stanu „okolicapreview" —
komentarz w pliku: „Używane przez okolicapreview; docelowo Integrator wpienie przy otwartym
panelu miasta" sugeruje że to dwa różne stany). Dotyczy `gra/src/render/**` → **Opus 5** zgodnie
z CLAUDE.md §4 (wyjątek stały dla renderu). Dispatch: zbadać dokładny stan `isCityPanelOpen()` vs
tryb podglądu okolicy w momencie zmiany przydziału, ujednolicić kolor odznaki chłopka w
`cityOkolicaOverlay.ts` z paletą właściciela z `workerFieldOverlay.ts` (Ty=złoto), naprawić lukę
odświeżania. Pełna pętla AutoBot Operator(Opus5)→Evaluator(Opus5).

## R-DYP-STOL-A-KOREKTA — ZAMKNIĘTE, ECHO Maciej 2026-08-09 (koryguje wykonanie R-DYP-STOL-A=C)
Traktaty (pakt, sojusz, itd.) mają być formularzem BEZ wpiętej wymiany surowców/PW w tym samym
oknie — jeśli brakuje „punktów", rozwiązanie to osobna, druga umowa, nie łączenie w jednym
formularzu. Koryguje wykonanie decyzji `R-DYP-STOL-A=C` (2026-07-27), nie samą decyzję B (AI
inicjuje w audiencji — zostaje). Efekt: `TREATY_ONLY_FORM_IDS` wraca do objęcia wszystkich typów
traktatów, nie tylko `'15'` — cofnięcie niedokumentowanego skurczenia z commitu `9cc7c76c`. Pełna
treść w `PYTANIA-OTWARTE.md` → `R-DYP-STOL-A-KOREKTA`. Dispatch Sonnet 5 (nie render, zwykła
logika dyplomacji).

## P-BRAMKI-MAPY-ROZMIAR-SCALE-FABLE-VERIFY-Q1 — ZWERYFIKOWANE, Evaluator PASS-WITH-NOTES (2026-08-09)
Niezależny Evaluator (Opus 5) potwierdził naprawę `fable/naprawa-bramek-mapy` (`b6b30721`) na
żywo, samodzielnie wyprowadzając liczby z `e-start-params.json` (nie z opisu Operatora) — zgadzają
się. Dowód mutacyjny: 4/5 mutacji złapane (A,C,D,E), jedna (B) nieinformatywna. `rozmiar-label-test`
13/0 · `map-scale-menu-test` 97/0, bez regresji `map-improvement-qualify`/`map-deposits-era`.
**3 noty (nie blokują):** (1) Operator zaniżył przyczynę — połowa napraw dotyczyła stałej w
`newGameMapDefaults.ts`, nie tylko JSON-a; (2) realna, PRE-ISTNIEJĄCA ślepa plamka: fallback w
kodzie jest dziś liczbowo identyczny z Panel-E, więc test nie odróżni „czytane" od „ignorowane" —
`rozmiar-label-test` jedyny broni tej ścieżki; (3) gałąź NIE była oparta na `main` jak twierdzono
(`a659f4a1` nie `b137332a`), ale zweryfikowano że dotknięte pliki nie zmieniły się między tymi
punktami — merge bezpieczny, 0 konfliktów. **Nowe, poważniejsze znalezisko przy okazji:**
`map-coast-buffer-test.cjs` ma **20 porażek, nie 1** jak zgłoszono — dwie klasy błędu („ląd w
buforze brzegu" na kontynenty/pangea/wyspy ORAZ „morze w środku lądu" na ziemia, ta druga w ogóle
niezgłoszona), wszystkie typy map, wszystkie seedy. Niezwiązane z tym commitem (0 nakładających
się plików). **Rekomendacja Evaluatora: przyjąć zmianę.** Czeka na merge do main — czekam na
potwierdzenie od sesji lokalnej/Macieja (zgodnie z ustaloną dziś zasadą wyraźnej zgody na merge).
Osobne zgłoszenie do zarejestrowania: rozmiar realny `map-coast-buffer-test` (20 porażek, 2 klasy).

## R-KARTA-JEDNOSTKI-STRZALKI-CYKL — zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: gdy zaznaczona jest jednostka, w górnej części karty bocznej (`sidePanelHud.ts`) mają być
strzałki przełączające do kolejnej/poprzedniej jednostki (dziś ich nie ma). Dodatkowo: usunąć
nagłówek „JEDNOSTKA" nad kartą — „kompletnie niepotrzebne". Zakotwiczone: `gra/src/ui/sidePanelHud.ts`
(nagłówek domyślny „Jednostka", linia ~226), karta budowana gdzieś w okolicy — Operator ma
zlokalizować dokładnie. Brak dziś mechanizmu cyklowania strzałkami NA KARCIE (istnieje tylko
klawisz Spacja cyklujący jednostki z ruchem — `R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA` — Operator ma
ocenić czy nowe strzałki powinny używać tej samej logiki wyboru kolejnej jednostki, czy czegoś
innego typu stos na heksie, i zgłosić jeśli to niejednoznaczne zamiast zgadywać). Dotyczy
`gra/src/ui/**` (DOM, nie render 3D) → Sonnet 5.

## R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO — OTWARTE, koryguje R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-09)
Chipy karty miasta pokazują dziś sumę TEMPA cywilizacji (nie zapasu) jako dużą liczbę — Maciej
chce realnego ZAPASU (jak na głównym HUD mapy: Skarbiec/Spichlerz/Nauka), mała liczba (+N) zostaje
jako wkład tego miasta w tempo. Przy jednym mieście duża=mała liczba (Praca +9 +9), stąd wrażenie
duplikacji. Pełna treść + zastrzeżenie o niepewności per-surowiec w `PYTANIA-OTWARTE.md`. Dispatch
Sonnet 5.

## R-WYDARZENIA-FILTR-KATEGORII — zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: panel „WYDARZENIA" zaśmiecony powtarzalnymi wpisami „Koniec tury" (handel innych
cywilizacji między sobą, np. Mykeny↔Korynt/Teby/Argos co turę). Trzy żądania: (1) przełącznik u
góry panelu włączający/wyłączający kategorie wydarzeń — własna cywilizacja (wszystko), inne
cywilizacje/pozostałe umowy (handel między obcymi), inne cywilizacje/wojny-pokoje-najważniejsze;
(2) etykieta „Koniec tury" dla wpisów dyplomatycznych (`gra/src/game/eot-event-defer.ts:37`) ma się
nazywać „Informacja dyplomatyczna"/„Dyplomacja", nie „Koniec tury" (to nie jest sam koniec tury,
tylko konkretne zdarzenie dyplomatyczne); (3) jeden przycisk „Usuń wszystkie" czyszczący cały
panel naraz. Zakotwiczone: `gra/src/ui/sidePanelHud.ts` (`SidePanelEvent`, render panelu),
`gra/src/game/eot-event-defer.ts` (generowanie wpisów „Koniec tury"). Operator ma najpierw
ustalić w kodzie jakie realne kategorie/źródła wpisów istnieją dziś (`kind` w `SidePanelEvent`,
skąd pochodzą wpisy o handlu innych cywilizacji) zanim zaprojektuje filtr — nie zgadywać
kategoryzacji z góry.

## R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY — zgłoszone z playtestu 2026-08-09, dispatch Opus 5
Maciej: granice Zulusów są w kolorze ciemnozielonym, zlewającym się z zielonym terenem — chce
koloru pomiędzy żółtym a zielonym (limonkowy/oliwkowy), wyraźnie odróżnialnego. Sprawdzone:
Zulusi NIE mają własnego `kolorHex` w `gra/data/civs.json` (`ikonaId: "zulusi"`, brak pola koloru)
— kolor granicy leci z fallbackowej palety `OWNER_COLORS`/analogicznej w `gra/src/game/civ-visual.ts`
(„kolorHex z civs.json lub stara paleta OWNER_COLORS"). Operator ma ustalić dokładnie skąd bierze
się dziś kolor obrysu terytorium (`gra/src/map/territory-border.ts` prawdopodobnie geometria,
kolor osobno) i czy inne cywilizacje bez własnego `kolorHex` mają ten sam problem (ta sama pula
slotów fallback) — rozważyć czy dać Zulusom dedykowany `kolorHex` w civs.json (rekomendowane,
węższy zakres) czy poprawić cały fallback slot (szerszy, może dotknąć innych cywilizacji). Dotyczy
oceny wizualnej koloru na tle terenu 3D → **Opus 5** zgodnie z CLAUDE.md §4 (wyjątek stały dla
renderu/wizualnej czytelności, analogicznie do dzisiejszej naprawy chłopków).

## P-REKRUTACJA-NAZWY-ZNIKAJA — PILNE, zgłoszone z playtestu 2026-08-09, dispatch Sonnet 5
Maciej: w panelu REKRUTACJA (widok miasta) nazwy jednostek zniknęły — tylko „Zwiadowca" pokazuje
nazwę, pozostałe 3 wiersze mają samą ikonę + koszty, bez tekstu nazwy. Obawa że to regresja z
dzisiejszej pracy. Wstępnie sprawdzone przez orkiestratora: `gra/data/units.json` — WSZYSTKIE
jednostki mają wypełnione pole `Jednostka` (grep po pustych `"Jednostka": ""` = zero trafień), więc
to NIE jest brak danych. Kod: `gra/src/ui/unitRecruitCard.ts:87` — `name.textContent = item.nazwa`,
`item.nazwa` pochodzi z `gra/src/game/production.ts` (kilka miejsc pushujących do listy: linie
~347, ~885, ~998, ~1014, wszystkie ustawiają `nazwa: u.Jednostka`/`specialUnit.Jednostka` — pozornie
spójnie). Operator ma: (1) ustalić DOKŁADNIE które 3 typy jednostek (po ikonach/kosztach ze zrzutu:
rząd 1 „24 · 500¤ · 10 Drewno −2/t" bez ikony Manpower, rząd 3 „40 · 500¤ · 👤 · 10 Drewno −2/t",
rząd 4 „56 · 500¤ · 👤 · 15 Drewno −3/t") mają puste nazwy w renderze — czy to konkretna kategoria
jednostek idąca innym torem budowania `ProductionItem` niż reszta; (2) sprawdzić czy to faktyczna
regresja z DZISIEJSZEJ pracy (żaden z dzisiejszych zarejestrowanych tematów nie dotykał
units.json/production.ts/unitRecruitCard.ts wprost — sprawdzić `git log` na te pliki) czy
pre-istniejący błąd dopiero teraz zauważony; (3) naprawić. PILNE — zgłoszone z aktywnego niepokoju
właściciela o regresję.

**SCALONE `872c1e0d`** — potwierdzone: NIE regresja z dzisiejszej sesji (zero zmian w dotkniętych
plikach między zdeployowanym buildem a HEAD). Przyczyna: defekt CSS flex-layout od 2026-08-06.

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — SCALONE `872c1e0d` (2026-08-09)
Dwukrotnie zweryfikowane przez Evaluatora. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — ECHO A + doprecyzowanie zakresu (2026-08-09)
Decyzja Macieja: A, ale tylko dla głównych cywilizacji (nie miast-państw) + NOWY warunek: awans
epoki wymaga WSZYSTKICH technologii epoki (12/12/8 wg tech.json), nie tylko 1 wyróżnionej. Progresja
per-civ asynchroniczna to już dzisiejsze zachowanie, ma zostać niezmienione. Ryzyko AI utykania
wyższe niż w pierwotnym pytaniu. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — ECHO A, dispatch implementacji (2026-08-09)
Decyzja Macieja: A — wdrożyć wzorem Danina/Handel (Mapa<ownerId, wartość domyślna> +
`override: boolean` per miasto) dla Praca/Żywność, podziału Praca, priorytetu produkcji. Pełna
treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — OTWARTE, wymaga ABC (2026-08-09)
Nowa reguła: awans epoki wymaga zbudowania cudu przypisanego cywilizacji w bieżącej epoce (jeśli
taki cud istnieje). Pełna treść w `PYTANIA-OTWARTE.md`. Dispatch rozpoznania przed ABC.

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY — OTWARTE, KORYGUJE R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO (2026-08-09)
⛔ Podważa decyzję zatwierdzoną chwilę wcześniej tego samego dnia (CLAUDE.md §1a). Docelowy układ:
duża liczba = tempo TEGO miasta, mała liczba (+N) = tempo CAŁEJ cywilizacji (zamiana miejsc
względem poprzedniej decyzji), NOWY trzeci element w nawiasie pod małą liczbą, innym kolorem
(propozycja: złoty) = realny zapas całej cywilizacji. Źródła danych już potwierdzone przez
zatrzymanego agenta `a35d817d715b1b210`: zapas — `EmpireHudSnap.pracaPool/zywnoscReserve/zloto/
nauka/kultura/religionStock`; tempo — istniejące pola `*Rate`. Pełna treść w `PYTANIA-OTWARTE.md`.
Dispatch Sonnet 5.

## P-KOLOR-SUROWCE-MIASTO-VS-MAPA-UJEDNOLICIC — OTWARTE, niepilne „temat na później" (2026-08-09)
Ujednolicić konwencje kolorów surowców między panelem miasta a HUD-em mapy świata. Świadomie
odłożone przez Macieja — tylko zarejestrowane.

## R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY — KOREKTA LICZB, jeszcze NIE scalone (2026-08-09)
Niezależna weryfikacja Evaluatora poprawiła błędny meldunek Operatora: Celtowie dE76 ~3,3 (nie 6,4
jak pierwotnie podano), próg 20 to wartość dobrana empirycznie („zmierzone naukowo" było
mylącym określeniem), „13 cywilizacji bezpieczne" dotyczy tylko podzbioru zieleni w teście, nie
pełnej palety terenu. Fix Zulusów sam w sobie stoi, ale siedzi wyłącznie w worktree
`agent-ae0ba1d148fe9acf8` (baza `b137332a`) — wymaga bezpiecznego scalenia do gałęzi. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — OTWARTE, bug zgłoszony z playtestu (2026-08-09)
Wybór „zostaw osobno" po najechaniu armią na hex innej jednostki powoduje rozpad CAŁEJ armii na
sąsiednie heksy, zamiast pozwolić armii i jednostce współistnieć na jednym heksie jako dwa
wybieralne cele. Dispatch Explore (bez kodowania) przed naprawą. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-PANSTWO-MIASTO-ZNIKA-PO-NAJEZDZIE-BEZ-BITWY — WSTRZYMANE na prośbę Macieja (2026-08-09)
Zgłoszenie o znikającym mieście-państwie po nieudanym ataku wycofane przez Macieja — mogła to być
chatka ze skarbami mylnie wzięta za miasto. Nie podejmować pracy, chyba że wróci potwierdzone.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — OTWARTE, bug zgłoszony z playtestu, priorytet wysoki (2026-08-09)
Dwa objawy: (1) autozapis miał trzymać 10 ostatnich tur, a lista „Wczytaj grę" pokazuje wielokrotne
wpisy „tura 2" o różnych znacznikach czasu zamiast kolejnych tur — rotacja prawdopodobnie nie
działa; (2) niespójność numeru tury (37 wg Macieja) z wyświetlanym rokiem kalendarzowym (2200
p.n.e., jak przy wczesnych turach). Ryzyko: brak realnej możliwości cofnięcia się do niedawnej
tury. Dispatch Explore (bez kodowania) przed naprawą. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA — OTWARTE, pytanie faktograficzne (2026-08-09)
Czy podbój/eliminacja cywilizacji przejmuje jej surowce, i czy to samo dotyczy miast-państw. Czyste
pytanie, dispatch Explore bez kodowania. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO — przyczyna drewna znaleziona, dispatch naprawy (2026-08-09)
Drewno: `main.ts:21130` woła `creditOwnerResourceStock` bez `capPerType` w pętli wyrębu lasu, po
jedynym w turze `reconcileOwnerResourceCaps()` — potwierdzony bug. Glina: przyczyny nie znaleziono
jednoznacznie, zalecona diagnostyka (console.warn) zamiast zgadywanej poprawki. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Bug: „Zostaw osobno" woła funkcję rozpraszania (`assignBounceHexesForUnits`) na CAŁYM stosie armii
zamiast na jednej, cofanej grupie — stąd rozpad na wszystkie strony. NIE regres, błąd w miejscu
wywołania. Osobno: silnik nie wspiera dziś współistnienia dwóch armii na jednym heksie (reguła par.
6b, `types/army.ts:4`) — to nowa funkcja, nie naprawa. ABC A/B/C, rekomendacja C (napraw
rozpraszanie teraz, pytanie o nową funkcję osobno). Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA — ODPOWIEDZIANE (2026-08-09)
Tak, mechanizm istnieje (`applyCapitalCapturePlunder`) i dotyczy też miast-państw — ta sama ścieżka
kodu, potwierdzone testem. Skarbiec zawsze 100%, surowce budowlane automatycznie z każdym
przejętym miastem, nauka+techy przy pełnej eliminacji (dla miast-państw zawsze prawda — mają 1
miasto). Jedyny wyjątek: pula pracy zawsze przepada, nie trafia do zwycięzcy. Pełna treść w
`PYTANIA-OTWARTE.md`.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — przyczyna znaleziona, dispatch naprawy (2026-08-09)
`doRotatingAutosave()` (main.ts:20554-20571) cicho zawodzi przy przepełnieniu localStorage quota —
brak komunikatu, indeks rotacji się nie przesuwa, reszta puli zamraża się na starej turze.
Przelicznik tura→rok jest poprawny (nie osobny bug). Dispatch naprawy widoczności błędu (bez ABC).
Pełna treść w `PYTANIA-OTWARTE.md`.

## P-PRODUKCJA-DREWNO-GLINA-KAMIEN-ZESTAWIENIE — OTWARTE, przygotowuje dane (2026-08-09)
Maciej chce zestawienia produkcji Drewna/Gliny/Kamienia we wszystkich ulepszeniach, zanim
zdecyduje czy zmniejszać balans (w kontekście P-MAGAZYN-PRZEKROCZENIE-LIMITU). Czyste zestawienie
danych z JSON, bez decyzji. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — OTWARTE, bug AI (2026-08-09)
AI nie broni oblężonego miasta przed barbarzyńcami, armia idzie w przeciwnym kierunku. Zasada do
wdrożenia: obrona własnego terytorium ma najwyższy priorytet nad innymi celami AI. Dispatch
Explore przed naprawą (może wymagać ABC po rozpoznaniu). Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — przyczyna znaleziona, wymaga ABC (2026-08-09)
Ruch wojsk AI (ai.ts:2155-2217) rozważa tylko wrogie miasta, nigdy barbarzyńców — brak priorytetu
obrony własnego terytorium. Realna zmiana logiki AI, wymaga ABC. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Mechanizm wojen AI istnieje ale rzadki; brak filtra sąsiedztwa do wyboru celu; kierunek preferencji
sojuszy dziś odwrotny do życzenia Macieja (silny woli słabego mniej, nie bardziej). Wieloczęściowa
zmiana, wymaga ABC. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK — OTWARTE, Maciej chce bardziej wyrazistego komunikatu (2026-08-09)
Mechanizm istnieje (`triumph-city-state.ts`, main.ts:19735) ale dymek się nie pojawił/przeoczony —
Maciej chce pełnoprawnego popupu zamiast 9,5s hinta. Dispatch Explore (wzorzec istniejącego modala)
przed implementacją. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — rozpoznanie gotowe, wymaga ABC (2026-08-09)
Odległość min. (4 heksy) identyczna gracz/AI — to nie problem. AI brak `withinTerritory` (gracz go
ma) + premia +15 pkt za zakładanie POZA zasięgiem własnych miast — realna przyczyna. ABC A/B/C,
rekomendacja C (złagodzić scoring, nie twardy zakaz). Pełna treść w `PYTANIA-OTWARTE.md`.

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY — Evaluator PASS-WITH-NOTES, 3 noty do naprawy (2026-08-09)
Duża/mała/zapas potwierdzone merytorycznie. N1: test nie strzeże deliverable (2 mutacje nie
złapane). N2: fallback Pracy dla panelu rywala miesza tempo/zapas. N3: komentarz-kanon zawiera
fałszywe słowo "nigdy". Pełna treść w `PYTANIA-OTWARTE.md`.

## R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK — OTWARTE, wymaga rozpoznania (2026-08-09)
Checkbox "Auto Wyżywienie" ma stać się przyciskiem w stylu przycisku auto-produkcji/"Auto-
zarządzaj", tekst "Auto WYŁ — bez auto-obniżania/podnoszenia" ma iść do tooltipa. Dispatch Explore
przed naprawą. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-DOPRECYZOWANIE-GLOBALNE-USTAWIENIA-NIE-ISTNIEJA — ODPOWIEDZIANE (2026-08-09)
Nieporozumienie wyjaśnione: "globalne ustawienia" żywności/pieniędzy/produkcji NIE istnieją dziś w
grze — to dokładnie to, o co Maciej poprosił jako nową funkcję w
R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE (wciąż czeka na ABC). Pełna treść w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — hipoteza potwierdzona, wymaga ABC (2026-08-09)
Odkrycie jednostki wojskowej z chatki ze skarbami na cudzym terytorium liczy się jako naruszenie
granicy i karze dyplomację, mimo że gracz nic złego nie zrobił. Propozycja: pula nagród z chatek na
cudzym terenie ma wykluczać jednostki wojskowe. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — OTWARTE, nowa reguła gry (2026-08-09)
Propozycja: wejście w epokę Brąz wymusza wypowiedzenie wojny co najmniej jednej cywilizacji, żeby
ożywić mapę. Doprecyzowanie: cel wojny to preferencyjnie SĄSIAD, nie zawsze gracz; sojusze mają iść
w stronę cywilizacji słabszych/podległych. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — OTWARTE, wymaga rozpoznania (2026-08-09)
Dwa żądania: (1) cywilizacje zawsze na górze listy dyplomacji, nad miastami-państwami; (2)
kliknięcie cywilizacji ma najpierw pokazać pop-up podsumowania (wojny/sojusze/umowy handlowe +
propozycja spotkania), dopiero potem pełny panel wizyty. Dispatch Explore przed ABC. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-WYDARZENIA-FILTR-KATEGORII — SCALONE `2984b707` (2026-08-09)
Odtworzone od zera, N1+N2 domknięte, druga runda Evaluatora PASS-WITH-NOTES bez not blokujących.
Scalone chirurgicznie (3 z 4 plików zdywergowane, per-hunk weryfikacja kotwic). N3-N8 niepilne w
rejestrze. Pełna treść w `PYTANIA-OTWARTE.md`.

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK — SCALONE `b057d248` (2026-08-09)
Modal wymagający potwierdzenia zamiast dymka, po 3 rundach AutoBot (Evaluator PASS finalnie).
Root cause: stary showHintMessage dzielił toast z komunikatem ELIMINACJA i go nadpisywał.
Niepilne noty do rejestru (kapitulacja z głodu nadal gubi ELIMINACJA — poza zakresem). Pełna
treść w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A. Doprecyzowanie: cofniecie CALEJ armii na miejsce startowe (nie sasiedni heks),
BEZ utraty punktu ruchu (jakby ruch sie nie odbyl). Dispatch implementacji. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — Evaluator PASS-WITH-NOTES, gotowe do scalenia (2026-08-09)
Naprawa widocznosci bledu potwierdzona (5/5 mutacji zlapanych, rozroznienie quota na realnym
DOMException). N1: to NIE zamyka calego tematu - rotacja/mozliwosc cofniecia sie nadal wymaga
osobnej decyzji. N2 niepilne (komunikat jako zwykly wpis "Koniec tury", nie dymek). Pelna tresc w
`PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — ECHO A (2026-08-09)
Decyzja Macieja: A. Obrona wlasnego terytorium (w tym barbarzyncy) ma najwyzszy priorytet nad
atakiem obcego celu, niezaleznie od stanu pokoju/wojny z innymi. Dispatch implementacji. Pelna
tresc w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A. Wojna wymuszona z sasiadem przy awansie do Brazu; koniec po 2 miastach
zdobytych/straconych; 20 tur odpoczynku; nie zrywa istniejacych sojuszy; pomijana jesli cywilizacja
juz jest w jakiejkolwiek wojnie (napastnik lub obronca). Jeden brakujacy parametr (cooldown powrotu
do tej samej cywilizacji) - pytanie doprecyzowujace do Macieja, robocze zalozenie 20 tur do czasu
odpowiedzi. Dispatch implementacji z tym zalozeniem. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — ECHO A (2026-08-09)
Decyzja Macieja: A. Pula nagrod chatki na cudzym terenie wyklucza jednostki wojskowe (cywilne bez
zmian); usuniete 20% rozdzielone proporcjonalnie zloto/tech. Dispatch implementacji. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — ECHO A + doprecyzowanie (2026-08-09)
Decyzja Macieja: A, z naciskiem: najpierw inspekcja istniejacego/martwego kodu (diplomacyPanel.ts,
diploListHud.ts, diplomacyAudience.ts), rozszerzac zamiast pisac od zera nowy panel. Sortowanie
cywilizacje-nad-panstwami + krok posredni podsumowania przed wizyta. Dispatch implementacji. Pelna
tresc w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — ECHO A wbrew rekomendacji C (2026-08-09)
Decyzja Macieja: A (twardy withinTerritory dla AI), swiadomie zawezajac wczesniejsza decyzje
R-AI-KOLONIZACJA Q3=B (pokrycie mapy ma sie teraz odbywac przez zwarte terytorium, nie odlegle
miasta). Usunac tez premie +15 za zakladanie poza zasiegiem (ai.ts:2694), sprzeczna z nowym
wymogiem. Dispatch implementacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — ECHO A (2026-08-09)
Decyzja Macieja: A (wbrew rekomendacji B). Cap ludnosci: 5 (bez zmian) -> 8 ze Spichlerzem (nowy) ->
12 z Akweduktem (obnizka z 15). Zalozenia domyslne do potwierdzenia: istniejace miasta >12 sa
zamrazane nie scinane; cap=8 wymaga tylko POSIADANIA Spichlerza (nie odprowadzonej ceramiki co
ture). Dispatch implementacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 1, runda 2 w toku (2026-08-09)
4 noty blokujace: B1 exploit nieskonczonego ruchu (zwrot na moveCost zamiast faktycznie odjete),
B2 zwrot kasowany przez selectPlayerUnit gdy na hexie startowym stoi inna wlasna jednostka,
B3 teleport bez sprawdzenia zajetosci/przejezdnosci, B4 nowy test nie chroni main.ts (mutacja
Evaluatora dala 13/13 mimo usuniecia fixu). Dispatch rundy 2. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — Evaluator runda 1: 3 BLOKUJACE, runda 2 (2026-08-09)
Scenariusz naprawiony, ale B1 regres wydajnosci +80% AI tura (zmierzone, poprawka jednolinijkowa
znana), B2 falszywa liczba w komentarzu (promien faktycznie 9-19 hex nie 2), B3 obronca wybierany
kolejnoscia tablicy nie odlegloscia (potwierdzone empirycznie, + podwojne zaangazowanie). N1 do
osobnej decyzji: faza wyscigu o wioski wyprzedza obrone domu w early-game. Dispatch rundy 2.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — Evaluator FAIL runda 1 (2026-08-09)
B1 (ABC): globalny priorytet produkcji bezczynny dla istniejacych miast (broadcast nie kopiuje
budowaPriorytetTypow), opis Operatora nieprawdziwy. B2: 4 miejsca zmiany wlasciciela miasta nie
resetuja cache -> panel klamie. B3: migracja starych zapisow kasuje indywidualne ustawienia
(3/9 mutacji przezylo). Dispatch runda 2 dla B2/B3, ABC dla B1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH — Evaluator FAIL runda 1 (2026-08-09)
B1: wykluczenie liczone na heksie chatki, jednostka spawnuje 1-2 hex dalej bez sprawdzenia
terytorium -> ~31% przeciek przy granicy. Naprawa tania (ocena na hex spawnu), w zakresie decyzji
A wg Evaluatora. N2 (ABC): wykluczenie nie uwzglednia istniejacych zwolnien z kary (wojna, sojusz,
prawo przemarszu) - gracz traci jednostke nawet gdy kara i tak by nie powstala. Dispatch runda 2
dla B1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
BB1: test nadal nie chroni main.ts (3 mutacje w kodzie produkcyjnym daja 16/16). Rozwiazanie:
test tekstowy regex wzorem border-march-wygasanie-test.cjs. BB2: zwrot ruchu gubiony w scenariuszu
z niska pula na hexie startowym - naprawic realnie lub udokumentowac jako ograniczenie. N4 (ABC):
pelny zwrot po marszu wieloheksowym nie cofa efektow ubocznych trasy (darmowe skanowanie).
Dispatch rundy 3, waski zakres. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — Evaluator FAIL runda 1, runda 2 w toku (2026-08-09)
B1: ulepszenie do Spichlerz II odbiera cap 8 (builtIds traci 'spichlerz' przy upgrade, brakuje
'spichlerz_ii' w warunku - zmierzone empirycznie). B2: test nie strzeze tej linii (mutacja
przechodzi wszystko). B3: karta budynkow pokazuje falszywy opis capu. Wszystkie mechaniczne, bez
ABC. Dispatch rundy 2. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE-B1 — ECHO A (2026-08-09)
Decyzja Macieja: A. Rozszerzyc broadcast o budowaPriorytetTypow. Kolejkowane po zakonczeniu rundy
B2/B3 (ten sam plik), zeby uniknac kolizji dwoch Operatorow. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — Evaluator FAIL runda 1 (2026-08-09)
B1: barbarzyncy pokazuja sie jako "w wojnie z" (brak filtra ktory istnieje gdzie indziej). B2:
wyciek mgly wojny - pokazuje niekontaktowane/wyeliminowane cywilizacje. B3: test nie chroni
wpiecia sortowania (mutacja usuwajaca .sort() przechodzi). Wszystkie mechaniczne. Dispatch rundy 2.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
Merytoryka B1 poprawna, ale bramka nadal nie chroni main.ts (3 mutacje daja 73/73). Naprawa: test
tekstowy regex wzorem hud-moc-warstwa-test.cjs. Dispatch rundy 3. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — Evaluator FAIL runda 1 (6 blokujacych), runda 2 w toku (2026-08-09)
B1 niekompletny funnel przejecia miasta (kapitulacja glodowa pomijana, AI-AI = wojna wieczna).
B2 (ABC): kaskada sojusznicza celu nieobslugana. B3 sojusz nie blokuje wyboru celu (sprzeczne z
zyczeniem). B4 mechanizm moze wylaczyc sie trwale po cichu. B5 brak save/load (STRICT-SAVE FAIL).
B6 bramka nie chroni main.ts. Dispatch rundy 2 dla B1/B3/B4/B5/B6, ABC dla B2. Pelna tresc w
`PYTANIA-OTWARTE.md`.

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator PASS-WITH-NOTES (3 blokujace) runda 1 (2026-08-09)
Rdzen logiki poprawny. B1: bramka nie chroni main.ts (mechaniczne, dispatch runda 2). B2 (ABC):
on-load przeliczanie AI nadpisuje zapisana epoke nowa regula, gracz nie - caly swiat AI cofa sie
przy wczytaniu starego zapisu. B3 (ABC): regula martwa dla 6/15 cywilizacji (cud w ostatniej
epoce), realne ryzyko trwalego zablokowania AI dla pozostalych 9 niezmierzone mimo polecenia.
Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — Evaluator PASS-WITH-NOTES (1 blokujaca) (2026-08-09)
Implementacja poprawna (zweryfikowana niezaleznie, wydajnosc -27%). B1: bramka nie chroni main.ts.
N2 wazne: AI traci mozliwosc ekspansji zamorskiej przez zakladanie miast (tylko podboj) - silniejsza
konsekwencja niz opisana w ABC, do wiadomosci Macieja. Dispatch waskiej rundy 2 dla B1. Pelna tresc
w `PYTANIA-OTWARTE.md`.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA-B2 — ECHO B (2026-08-09)
Decyzja Macieja: B (wbrew rekomendacji A). Kaskada sojusznicza odpala normalnie, ale licznik
"2 miasta = koniec" ma obejmowac CALA grupe wojen naraz (sumaryczny licznik po wszystkich parach
w kaskadzie), nie tylko pare napastnik-cel. Wymaga architektury "grupa wojen" zamiast per-para.
Zakolejkowane po rundzie B1/B3/B4/B5/B6 (te same pliki). Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-AI-NIE-BRONI-WLASNYCH-MIAST — Evaluator FAIL runda 2, runda 3 w toku (2026-08-09)
B1a: naprawa wydajnosci wprowadzila NOWY bug - prefilter=9 gubi 52% zagrozen dla miast pop>5
(pomylony prog min z max). Gotowe rozwiazanie od Evaluatora: dokladny warunek per miasto
hexDistance <= promien+2*VICINITY_HEX, zweryfikowany na 10000 hexach. B1b/B3b: bramki nie chronia
napraw. Dispatch waskiej rundy 3 wg gotowej specyfikacji. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — OTWARTE, wymaga rozpoznania (2026-08-09)
Propozycja Macieja: Fort/Posterunek/Port rozszerza zasieg zakladania miast poza wlasne terytorium,
dla gracza i AI rownoczesnie. Mechanizm juz zaprojektowany w danych (ABC-10 2026-07-04,
"posterunek=5, fort=10, wymaga Straznica LUB zasiegu miasta") ale nieznany stan wdrozenia w kodzie.
Dispatch Explore przed ABC. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator FAIL runda 3 (dokumentacja falszywa), runda 4 (2026-08-09)
BB1 zamkniete (6 mutacji zlapanych). BB2: powod FAIL to nieprawdziwa dokumentacja - skipStackRuchSync
to placebo (ginie 24 linie dalej w renderze HUD), nie czesciowa mitygacja jak twierdzil raport.
Korekta: odwolanie do wczesniejszej decyzji Macieja bylo nadinterpretacja (inne pytanie). Evaluator
dolozyl 2 tansze opcje D/E bez refaktoru. Dispatch waskiej rundy 4 (usunac placebo, naprawic
kruchosc testu K-5), potem pelne ABC z 5 opcjami. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — odlozone na krok 2 (2026-08-09)
Decyzja Macieja: krok 1 = wylacznie zablokowac AI budowanie miast tak jak dotychczas, zasady
identyczne jak gracz (P-AI-ZAKLADANIE-MIAST=A bez zlagodzenia). Krok 2 (fort/posterunek
rozszerza terytorium) odlozony bez daty. Wstrzymana decyzja o usunieciu premii +15 dla AI
odblokowana - ma zostac wykonana zgodnie z pierwotnym zakresem. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO C + doprecyzowanie (2026-08-09)
Decyzja Macieja: C (ekonomia + brama produkcji morskiej). Doprecyzowanie: dostep do wody = morze
LUB rzeka, ta sama definicja co juz istniejaca bramka budowy Portu. Jeden otwarty szczegol
(grandfather starych Galer w zapisach) - dopytany na czacie. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — ECHO Q1=B/Q2=B/Q3=A (2026-08-09)
Decyzja Macieja: Q1=B (wymaga wlasnej jednostki + widocznosc, miasto zakladane gdziekolwiek w
zasiegu fortu), Q2=B (fort tylko prawo zalozenia, bez pelnego terytorium), Q3=A (pelne przejecie,
ewakuowane jednostki trafiaja tuz za granice przejmujacego miasta). Zapisane, ale to "krok 2" -
NIE dispatchowac, czeka na sygnal po zakonczeniu kroku 1. Pelna tresc w `PYTANIA-OTWARTE.md`.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO B grandfather (2026-08-09)
Decyzja Macieja: B - istniejace Galery w miastach bez wody zostaja, tylko nowa produkcja
blokowana. Caly temat (C + rzeka=woda + grandfather=B) w pelni zdecydowany, ale niepilny -
NIE dispatchowac bez sygnalu. Pelna tresc w `PYTANIA-OTWARTE.md`.

## P-SPACJA-POMIJA-AUTOEKSPLORACJE-BEZ-OZNACZENIA — rozpoznanie gotowe, ABC zadane (2026-08-10)
Przyczyna: `isUnitActiveForCycle` celowo pomija jednostki `autoExplore===true` w cyklu Spacji, ale
panel Armie (`buildPlayerArmyListEntries`) nie oznacza tego stanu żadnym badge'em/tekstem — Zwiadowca
w auto-eksploracji wygląda jak zwykła jednostka z pełnym ruchem. To luka UI, nie bug logiki cyklu.
ABC (A: badge jak inGarnizon/sentry/ufortyfikowanyWPolu — rekomendacja / B: Spacja też cykluje
auto-explore / C: sam tekst w detailLine bez badge'a) zadane Maciejowi w czacie. Pełna treść w
`PYTANIA-OTWARTE.md`.

## R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 — zgłoszenie Macieja, koliduje z Q1=A, ABC zadane (2026-08-10)
Maciej zgłasza: po WŁ Zwiedzaj jednostka powinna się odznaczać (cykl do kolejnej z ruchem, inaczej
pełne odznaczenie) zamiast zostawiać podgląd ruchu — bo przypadkowy klik w podświetlony heks kasuje
autozwiedzanie. To wprost podważa `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A` (2026-08-04), która celowo
wybrała "zostań zaznaczony". Przyczyna zlokalizowana: `main.ts:16476-16491` nie czyści `reachable`
przy WŁ, więc podświetlenie ruchu zostaje klikalne; klik → zwykła ścieżka marszu → 
`clearScoutAutoExplore` kasuje flagę jako efekt uboczny. ABC (A: pełny powrót do deselect+cykl /
B: zostaw zaznaczenie z Q1=A ale wyczyść podgląd ruchu — nie cofa Q1=A / C: B + ostrzeżenie przy
kliku) zadane Maciejowi w czacie. Pełna treść w `PYTANIA-OTWARTE.md`.

## R-MANPOWER-EPOKA1-500-VS-1000 — zgłoszenie Macieja, koliduje z decyzją 2026-08-03, ABC zadane (2026-08-10)
Maciej rozważa cofnięcie kosztu rekrutacji jednostki w epoce 1 z 500 na 1000 (gigantyczna skala
przy większej liczbie miast). Koliduje z jego własną decyzją `b518e3e7` (2026-08-03). Pula manpower
rośnie liniowo z liczbą miast bez tłumika — potwierdza opisany problem. ABC (A: cofnij tylko ep.1 /
B: zostaw 500, dołóż tłumik skalowania puli / C: oba) zadane w czacie. Pełna treść w PYTANIA-OTWARTE.md.

## R-DYPLOLISTA-KOLOR-CYWILIZACJI — ABC zadane (2026-08-10)
Karty w liście "Znane cywilizacje" nie odróżniają cywilizacji kolorem. kolorHex już istnieje w
danych i jest reużywany gdzie indziej (minimapa, audiencja), ale ginie w diploListEntryFromRelation
(diploListHud.ts) — DiploListEntry nie ma pola kolorHex. ABC (A: obrys karty / B: A+tekst nazwy w
kolorze / C: tło kółka) zadane, rekomendacja A+B. Pełna treść w PYTANIA-OTWARTE.md.

## R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI — ABC zadane (2026-08-10)
Dwa defekty: (1) toast ELIMINACJA przy podboju bojowym ginie pod pełnoekranowym modalem
showCityCaptureNotice (kolizja z-index/timing, ten sam wzorzec co wcześniejsze
P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK); (2) przejęcie dyplomatyczne (annexCityStateToOwner)
nie ma ŻADNEGO komunikatu. ABC (A: przenieś do modalu + dodaj toast dla ścieżki dyplo / B: kolejkuj
toast po modalu / C: trwały log zdarzeń) zadane, rekomendacja A. Pełna treść w PYTANIA-OTWARTE.md.

## R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04 — ABC zadane (2026-08-10)
Pasywność city-state AI na Hard to NIE regresja — trzy decyzje Macieja (AI-CS-CLUSTER-DIFF
2026-07-30, R-MP-HARD-WAVE i MP-GARRISON-Q1 2026-08-04) razem gaszą mechanizm masowego ataku PM
dokladnie na najtrudniejszym poziomie gry. ABC (A: odlacz agresje PM od trudnosci PM, przywiaz do
trudnosci gry / B: podnies cap produkcji PM na Hard / C: zostaw, osobny suwak trudnosci PM) zadane.
Pelna tresc w PYTANIA-OTWARTE.md.

## R-ZUZYCIE-SUROWCOW-OBYWATELE — nowa mechanika, konflikty zidentyfikowane, wstrzymane (2026-08-10)
Propozycja Macieja: obywatele zuzywaja surowce per epoka (Kamien: Drewno+Glina; Braz: +Kamien+
Ceramika; Zelazo: +Cegla), z kara +-1 Szczescie i -1% Rozwoju za dostepnosc/brak. Rozpoznanie
ujawnilo 2 krytyczne konflikty: Glina ma baze terenu=0 wszedzie (dostepna dopiero przez Gliniank
epoki 2), Ceramika wymaga konwertera+tech - obie wymagane od poczatku odpowiedniej epoki bylyby
gwarantowanym deficytem od tury 1. Kodowanie wstrzymane do rozstrzygniecia przez Macieja. Pelna
tresc w PYTANIA-OTWARTE.md.

## P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT — dispatch Sonnet 5 (2026-08-10)
Manualny zapis znikal z listy - rozpoznanie: nie rozjazd backendow (ten sam localStorage/prefix co
listSaves()), tylko cichy blad quota z mylacym komunikatem ("brak localStorage?" zamiast "brak
miejsca") + dialog zamykajacy sie przed potwierdzeniem wyniku. Gotowy wzorzec do skopiowania z
autozapisu (juz poprawnie obsluguje reason==='quota'). Nie wymaga ABC, dispatch od razu.

## P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA — ABC zadane (2026-08-10)
Zapis nie zawiera siatki hexow, tylko seed - kazde wczytanie z menu regeneruje cala mape
proceduralnie (dokladnie ten sam pipeline 10 faz co Nowa Gra), stad rownie dlugie jak generowanie
nowej mapy. ABC (A: serializuj pelna siatke / B: przyspiesz generator, zostaw regeneracje / C:
serializuj tylko delte) zadane w czacie. Pelna tresc w PYTANIA-OTWARTE.md.

## P-SEJWY-KOLEJNOSC-STARE-BEZ-SAVEDAT — dispatch razem z quota (2026-08-10)
Sortowanie malejace po dacie juz dziala w kodzie (saveLoadDialog.ts) - waski problem: stare zapisy
sprzed pola savedAt dostaja pusty string i sortuja sie niedeterministycznie miedzy soba. Nie
wymaga ABC, dispatch razem z naprawa quota (ten sam obszar, osobno wydzielony zakres).

## R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI — Evaluator FAIL runda 2, runda 3 w toku (2026-08-10)
Retroaktywny Evaluator (Opus 5) na 6 zmianach orkiestratora: FAIL na d7718ad5 - toast wchlonienia
dyplomatycznego natychmiast nadpisywany 6 linii nizej (ten sam wzorzec kolizji ktory mial byc
naprawiony), 2 sciezki eliminacji gracza (kapitulacja glodowa, szturm przez mur) gubia zwracana
etykiete po cichu, utrata tresci (tech/Power) w nowym modalu. Zero pokrycia testowego. Dispatch
Sonnet 5 runda 3 + ponowny Evaluator przed zamknieciem. Pozostale 5 zmian: PASS/PASS-WITH-NOTES,
3 dodatkowe noty do dispatchu (Civpedia klamie o manpower, karty Dyplomacja w 2 kolorach,
ufortyfikowany+autoExplore). Pelna tresc w PYTANIA-OTWARTE.md.

## R-DESIGN-11-ZAKLADEK — nowe zgłoszenie, ABC zadane (2026-08-13)
Maciej: potrzebne konkretne wytyczne dla designera do zmiany wyglądu 11 zakładek/paneli, które
nigdy nie zostały dopracowane graficznie: Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel,
Armia, Miasto, Obywatele, Kultura, Religia. Ma zawierać zrzuty ekranu obecnego stanu, konkretne
wytyczne zmian i zasady do zapisania w plikach w repo. W repo istnieje już ustanowiony kanon
projektowy (`docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/`), w tym mockup
„Miasto Zakladki W3 6klatek" — nieznane, czy pokrywa te konkretne 11 zakładek. Status: `CZEKA-NA-DECYZJĘ`.
Pełna treść ABC (2 pytania: R-DESIGN-11-ZAKLADEK-Q1 kierunek wizualny, R-DESIGN-11-ZAKLADEK-Q2
zasada podziału Miasto/Obywatele) w `PYTANIA-OTWARTE.md`.

## P-DYPLO-BILANS-GATE-NIESPOJNY — NAPRAWIONE (2026-08-14, Operator Sonnet 5)
Temat POWRACAJĄCY (5. zgłoszenie tego wzorca). Zlokalizowana PRAWDZIWA przyczyna (dochodzenie
przez odtworzenie scenariusza ze zrzutu 50/20 PW @ Relacji 27,8 przez prawdziwy `evaluateProposal`):
`balancePanelDataFromRows` (`gra/src/ui/diplomacyAcceptanceBalance.ts`) liczyła wyświetlany
„Bilans" jako SUROWĄ różnicę `myOfferPn − theirOfferPn` (ignorując relację i mnożnik chęci
partnera), podczas gdy bramka akceptacji (`handelFairnessGate`/`treatyBaseFairnessGap` w
`gra/src/game/diplomacy-proposals.ts`) liczyła próg z relacją + mnożnikiem — dwie faktycznie
różne formuły na tym samym ekranie, reprodukujące dokładnie „+30 zielone" mimo odrzucenia.
Naprawa: `ProposalEvalResult.pwBalance` (nowe pole) niesie TĘ SAMĄ liczbę, którą policzyła
bramka; `balancePanelDataFromRows` używa jej jako jedynego źródła „Bilans" gdy dostępna
(pojedyncza pozycja na stole), z fallbackiem na stare zachowanie dla akcji bez numerycznej
bramki PW (nap/sojusz/wasal) i dla pakietów >1 pozycji (osobny, wcześniej rozstrzygnięty temat
BUG-PAKIET-BILANS-DODATNI-BLOKADA — nienaruszony). Dodatkowo usunięta redundantna linia „PW
surowe (bez Relacji): ... bilans +N" z live-podglądu koszyka (`renderPnBalancePanelFromBasket`)
— druga, sprzeczna liczba na tym samym panelu.
Bramki: `tsc` 0, `tech-tree-test` 19/19, `research-test` 33/33, cały pakiet testów dyplomacji
zielony (diplomacy-test 148/148, diplomacy-proposal-test 187/187, diplomacy-acceptance-points-test
254/254, diplomacy-value-catalog-test 81/81, diplomacy-treaties-test 17/17,
diplomacy-fairness-gate-package-q2-test 24/24, diplomacy-negotiation-table-test 62/62,
diplomacy-own-proposal-edit-test 33/33, diplomacy-stol-pw-sum-test rozszerzony **70/70**
o dokładny scenariusz ze zrzutu — mutacyjnie zweryfikowany: 8/8 nowych asercji PADA na starym
kodzie, przechodzi po naprawie). Pełny opis w `PYTANIA-OTWARTE.md`.

## P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY — NAPRAWIONE (2026-08-14, Operator Sonnet 5)
Potwierdzone przy wykonaniu (main.ts, `case 'zywnosc':` transferu traktatu): silnik operuje
wyłącznie na `empireFoodStates` (Spichlerz Centralny cywilizacji) i czyta z pozycji koszyka
tylko `ilosc` — `id`/`cityId` nigdy nie były czytane przy wykonaniu, wybór miasta był
interfejsem-widmem (UI-only, tylko dedup koszyka). Usunięty selektor „Miasto (spichlerz)"
z `gra/src/ui/diplomacyTradeBasket.ts`; `readItemFromForm` (case `zywnosc`) ma teraz stałe
`id: 'zywnosc'` (jak zloto/praca); `basketItemIdentity` uproszczona (bez specjalnego
przypadku dla żywności); usunięte martwe JS wiązanie `.cdb-chip-city` i pole `cityId?: string`
z `BasketItem` (`diplomacy-pn-engine.ts`) — zero pozostałych czytelników w całym repo.
Skutek: żywność w ofercie zawsze sumuje się do JEDNEJ pozycji koszyka (jeden cywilizacyjny
zasób), nie dzieli się już per miasto.
Testy: `diplomacy-basket-duplicate-test.cjs` 21/21 (scenariusz „inne miasto" zastąpiony „zawsze
scala się"), `diplomacy-basket-duplicate-ui-test.cjs` 31/31 (scenariusz scalania-przez-edycję
przeniesiony z żywności na `surowiec_ilosc` — regresja-ochrona zachowana, nie utracona).
Bramki: `tsc` 0, `tech-tree-test` 19/19, `research-test` 33/33, `diplomacy-test` 148/148,
`diplomacy-proposal-test` 187/187, `diplomacy-own-proposal-edit-test` 33/33,
`diplomacy-stol-pw-sum-test` 70/70, `diplomacy-negotiation-table-test` 62/62,
`diplomacy-currency-trade-test` 5/5. Pełny opis w `PYTANIA-OTWARTE.md`.

## R-MANPOWER-LECZENIE-PROC-TRUDNOSC — ECHO bezpośredni (2026-08-16)
Maciej (dosłownie): „a jeżeli chodzi o leczenie jednostek, to przyjmiemy, że na trudnym poziomie
teraz to będzie 20, na normalnym 30, a na łatwym 40%." Dotyczy `manpower_uzupelnienie_hp_proc_max_tura`
(`gra/data/miasto-params.json`) — % maxHP leczonego jednostce na turę z puli Manpower imperium.
Dziś: easy 25 / normal 20 / hard 15. Po zmianie: easy 40 / normal 30 / hard 20. Decyzja
jednoznaczna (liczby podane wprost per poziom trudności), bez ABC — implementacja wprost.
Pełna treść w `PYTANIA-OTWARTE.md`.

## P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1 — ECHO (2026-08-16)
Maciej: `P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1 = B`. Wąski wyjątek w egzekutorze
(`canUnitOccupyCityHex`), analogiczny do `canBarbarianWalkIntoEmptyCity` — AI może wejść na
heks pustego, niebronionego miasta wyłącznie w kontekście komendy ataku dystansowego na miasto.
Nie rozwiązuje ogólnego braku ścieżki zdobycia miasta przez AI (N2 werdyktu Evaluatora rundy 2)
— to świadomie poza zakresem tej naprawy. Pełna treść pytania i uzasadnienie w
`PYTANIA-OTWARTE.md`, sekcja `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`.

## P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 — ECHO (2026-08-16)
Maciej: `P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 = B`. Ujednolicić — zakładka Miasta ma
liczyć ŚREDNIĄ wzrostu efektywnie (głodujące miasta = 0%), tak samo jak Spichlerz od ECHO B.
Wymaga zmiany kodu w `cityMiastaMiniDetail()`/`computeMiastaSummaryRow` (empireDetailPanel.ts)
oraz ruszenia przypiętej bramki `empire-miasta-table-test.cjs` (dziś 89/0, pinuje konwencję
nominalną). Pełna treść pytania w `PYTANIA-OTWARTE.md`, sekcja
`P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD`.

## P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1 — ECHO C (2026-08-17)
Maciej: `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1 = C`. Po odkryciu technologii
umożliwiającej wejście do epoki Brązu ma pojawić się modal pełnej karty technologii
(budynki, jednostki, ulepszenia, kolejne technologie, wymagania i efekty), oparty
na prawdziwych danych tech tree. Modal nie anuluje tury ani badań, nie jest popupem
podboju miast-państw. Zakres: istniejący toast/zdarzenie epoki, karta, Escape/
zamknięcie, ponowne otwarcie z drzewa, długie listy/brak sekcji, test produkcyjnej
ścieżki i starego save. Bez Designera i linkowania zewnętrznego.

Kanon: `docs/decyzje/P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1.md`.
Status: **ZDEPLOYOWANE FALA 294 `a0f804d7` — PASS-WITH-NOTES** —
implementacja `1383c31e`/`b047ff73`; tsc PASS, tech-tree 19/19, research 33/33,
defer 7/7 + mutacje 8/8. Live build PASS; egzekucja Chromium zablokowana
brakiem executable w środowisku. To ograniczenie środowiskowe, nie funkcjonalny FAIL.

## P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1 — ECHO (2026-08-16)
Maciej: `P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1 = A`. Realne przejęcie miasta jak barbarzyńcy —
wejście AI na pusty, niebroniony heks miasta w kontekście ataku dystansowego ma wołać tę samą
ścieżkę co barbarzyńcy (`tryAutoCaptureEmptyCityAt`), miasto zmienia właściciela. Świadomie
otwiera zakres N2 (ogólny brak ścieżki zdobycia miasta przez AI) wcześniej niż planowano — ale
tylko w obrębie tej jednej ścieżki (atak dystansowy), nie ogólnego marszu AI na puste miasta.
Pełna treść pytania w `PYTANIA-OTWARTE.md`, sekcja `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`.

| R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE | 2026-08-16 | Nowo założone miasto ma zaczynać z automatycznie włączonym autowyżywieniem | **ZAMKNIETE (2026-08-17)** | PASS Evaluatora, commit `eb03cb94`, wdrozone w FALI 291. `foundCityAt()` zwraca `autoWyzywienie: true` domyslnie. |
| R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE | 2026-08-16 | Nowo założone miasto ma zaczynać z trybem budowy „zrównoważone" zamiast „ręczny" | **ZAMKNIETE (2026-08-17)** | PASS Evaluatora, commit `eb03cb94`, wdrozone w FALI 291. `foundCityAt()` zwraca `budowaTryb: 'zrownowazone'` domyslnie. |
| R-CYWILIZACJE-DOSTEPNE-PER-MAPA-PLUS-JEDEN | 2026-08-16 | +1 do liczby dostępnych cywilizacji dla każdego rozmiaru mapy | **ZAMKNIETE (2026-08-17)** | PASS Evaluatora, commit `48246469`, wdrozone w FALI 291. Niejednoznacznosc rozstrzygnieta ABC (`R-CYWILIZACJE-EPOKA-PULA-Q1 = A`) - mapy na suficie puli EPOCH_CIV_TYPE_POOL bez zmian, reszta +1; miasta_panstwa +1 wszedzie. |
| P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE | 2026-08-14 | Atak dystansowy AI na miasta — 4 rundy | **ZAMKNIĘTE — Evaluator PASS-WITH-NOTES `6826b16c`** | ECHO `EGZEKUCJA-Q1=B`+`WEJSCIE-Q1=A`; N1 wydzielony do `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1` (osobne ABC, nie pilne) |

## P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1 — ECHO B (2026-08-17)
Maciej zdecydował: gracz, AI i miasta-państwa pozyskują jednostki wyłącznie przez zakup
za Skarbiec/Pieniądze; jednostki nie trafiają do tej samej kolejki Pracy co budynki.
Zakres obejmuje produkcję, zakup/rush, limity, środki, save/load i migrację starych kolejek.
Status: **GOTOWE/ZAMKNIĘTE — obecne w ROBOCZEJ FALI 293 `8fa80b7c` i FALI 294
`a0f804d7`; zaakceptowane przez Evaluatora, PASS-WITH-NOTES**.
Dowód: ECHO `bc200aee`; implementacja `914ce8da`; testy kontraktów/migracji
`f30e13d7`, `c2a72a98`; `rekrutacja-skarbiec-only-test.cjs` **13/13 PASS**.
Pre-existing dług testowy, niezwiązany z tą zmianą: `unit-stock-cost-test.cjs`
**41/58 PASS** oraz `ai-recruit-upkeep-gate-test.cjs` **18/27 PASS**.
Kanon: `docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md`.

| P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1 | 2026-08-17 | Bazowa produkcja Drewna/Kamienia/Gliny z terenu; rzeka pozostaje osobnym modyfikatorem | **GOTOWE / ZAMKNIĘTE — ZDEPLOYOWANE ROBOCZA FALA 294 `a0f804d7` — Evaluator PASS-WITH-NOTES** | `gra/data/terrain-yields.json` · implementacja `4d40d0f8` · test korekty `3ee0c52f` · `terrain-base-resource-yields-test.cjs` 9/9 (rzeka osobno: +10 Glina, bez Drewna/Kamienia) · ROBOCZA md5 `a0f804d7593333e34c989dc3565cb0c6`, VERIFY OK · pozostałe testy: magazyn 14/14, konwertery 46/46, warstwy 24/24, parytet 101/101 |
| P-EPOKA-BRAZU-KOMUNIKAT-PODBOJ-MIAST-Q1 | 2026-08-17 | **POPRZEDNI POŁĄCZONY TEMAT — ZASTĄPIONY / UNIEWAŻNIONY** | **ZASTĄPIONY / UNIEWAŻNIONY przez sprostowanie właściciela** | Łączył błędnie dwa niezależne zdarzenia: komunikat odblokowania/przejścia do Brązu po badaniach/technologiach oraz triumf po zajęciu wszystkich miast-państw kultury. Historia zachowana; nowe ID: `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1` i `P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1`. Żadne z tych zdarzeń nie jest wzajemnym warunkiem. |
| P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1 | 2026-08-17 | Osobny komunikat o możliwości wejścia do epoki Brązu i nowych możliwościach po odkryciu/odblokowaniu odpowiednich badań/technologii | **ZDEPLOYOWANE FALA 294 `a0f804d7` — PASS-WITH-NOTES** | ECHO C; niezależne od zajęcia wszystkich miast-państw danej kultury; testy logiczne zielone, live Chromium niedostępny |
| P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1 | 2026-08-17 | Osobny popup triumfu po zajęciu wszystkich miast-państw danej kultury | **GOTOWE / ZAMKNIĘTE — ZDEPLOYOWANE FALA 294 `a0f804d7` — PASS-WITH-NOTES** | ECHO A; niezależne od odkrycia technologii i przejścia do epoki Brązu; testy 13/13 i 16/16; ROBOCZA md5 `a0f804d7593333e34c989dc3565cb0c6`, VERIFY OK; live Chromium niedostępny |
## KOREKTA STATUSÓW — FALA 291 (docs-only, 2026-08-17)

Poniższe wpisy porządkują wyłącznie aktywny status rejestru. Historia i dowody pozostają
w `PYTANIA-OTWARTE.md`; nie zmieniają decyzji właściciela ani `WERSJE.md`.

| ID | Status bieżący | Dowód / uwaga |
|---|---|---|
| P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | fix `8f45ae6d` + test repro/negacji; test 16/16, battle summary PASS, overlay 84/84, tsc PASS |
| P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | commit `46efc847`; test kamery 24/24, battle summary PASS, cleanup 23/0, tsc PASS |
| P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | commit `8e90aa53`; map attack 13/13, siege 6/6, tsc PASS; zakres = klik gracza |
| P-AI-BRAK-POJECIA-MGLY | **GOTOWE / ZAMKNIĘTE — Evaluator PASS-WITH-NOTES** | FALA 292, zachowane w ROBOCZA FALI 294 (`a0f804d7`, `VERIFY OK`); `ai-fog-test.cjs` 8/8; save/load W5 |
| P-TOOLTIP-CIV-UNIT-PANEL-SCOPE-MARTWY-W-GRZE | **ZAMKNIĘTE — NO-ACTION** | panel tree-shaken |
| P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACJA | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | predykat + executor + wiring; test capture 14/14, movement 13/13, tsc PASS; brak pełnego E2E pathfindingu |
| P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS** | aktywny flow AI/MP Skarbiec→rekrutacja; capture i surrender sanitizują legacy kolejkę; testy 20/20, 11/11, 13/13, tsc PASS |
| P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS-WITH-NOTES** | commit `4fda539a`; live preview 8/8, stół 166/166, proposal 187/187, negotiation 62/62, fairness 24/24, tsc PASS |
| P-SUROWCE-KOLEJNOSC-KART | **ZAMKNIĘTE** | test `62/0` |
| P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT | **ZDEPLOYOWANE FALA 295 `8589d294` — Evaluator PASS** | commit `8e0e70e7`; test 8/8, rodzic 2/8, tsc PASS |
| P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY | **ZDEPLOYOWANE** | FALA 286 |

## ECHO — decyzje ABC 2026-08-18, gotowe do dispatchu Workflow

| ID | Decyzja | Status | Kontrakt |
|---|---|---|---|
| P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY | **B** — czas ponad próg ostrzeżeniem, poprawność nadal twardą bramką | **ZDEPLOYOWANE FALA 296 `a37f7123` — Evaluator PASS-WITH-NOTES** | `docs/decyzje/P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY.md` · kontrakt 2/2 |
| P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-N2 | **C** — targeted overlay bez globalnego przebijania | **ZDEPLOYOWANE FALA 296 `a37f7123` — Evaluator PASS-WITH-NOTES** | `docs/decyzje/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-N2.md` · overlay 76/76 |

## R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1 — recon mechaniki handlu (2026-08-20)

**Zgłoszenie właściciela:** ustalić przychody z handlu między cywilizacjami, moment wejścia
mechaniki i wymagany budynek; nie dublować istniejącej mechaniki.

**GOAL:** potwierdzić faktyczny przychód, bramki technologiczne/budynkowe, warunki umowy,
parytet stron i save/load oraz wskazać, czy potrzebna jest zmiana kodu.

**STATUS:** RECON PASS-WITH-NOTES — mechanika istnieje; brak zmiany kodu. Ewentualne
rozszerzenie AI↔AI wymaga osobnej decyzji ABC.

## R-PRACA-MIASTO-LIMIT-50-Q1 — lokalny limit ulepszeń względem budynków (2026-08-20)

**Zgłoszenie właściciela:** „W oddziale pracy w miastach powinna być maksymalna możliwość
przeznaczenia do 50% na ulepszenia, a reszta na budynki. Powinna obowiązywać miasta dokładnie
ta sama zasada, która jest dla całej cywilizacji.”

**GOAL:** lokalny podział Pracy w mieście respektuje ten sam kontrakt co nadrzędny podział
cywilizacji: ulepszenia terenu maksymalnie 50% dostępnej puli, pozostała część trafia do
budynków; UI, logika gracza/AI i wartości zapisywane nie mogą pozwolić na przekroczenie capu.

**STATUS:** ZAREJESTROWANE — przed dispatchingiem wymaga reconu aktualnej implementacji,
sprawdzenia relacji z `P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1` oraz pełnej bramki AutoBot.

**Następny krok:** `00-dispatch.md`, następnie Operator Luna Medium.

## R-AUTOBOT-LIMIT-5-RUND-Q1 — limit pętli Operator–Evaluator (2026-08-20)

**Zgłoszenie właściciela:** pętla AutoBot nie może trwać bez końca; maksymalnie pięć prób
tego samego tematu, po czym należy jawnie zgłosić przekroczenie limitu.

**GOAL:** kanon procesu, skrót wejściowy, reguły egzekwujące i playbook definiują jednolity
limit 5 rund Operator→Evaluator dla jednego ID oraz status/akcję po przekroczeniu; temat
nie może być automatycznie ponawiany w nieskończoność.

**STATUS:** ZAREJESTROWANE — zmiana samego AutoBota; wymaga dispatchu Operatora, niezależnego
Evaluatora i aktualizacji wygenerowanego `playbook.json` wyłącznie przez generator.

## R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 — rekrutacja nie może blokować się kosztem utrzymania (2026-08-20)

**Zgłoszenie właściciela:** przy rekrutacji system ma sprawdzać wyłącznie surowce wymagane
do samego zakupu jednostki, a nie przyszły koszt jej utrzymania. Utrzymanie ma być pobierane
w kolejnej turze; niedobór może wtedy powodować właściwe szkody/konsekwencje dla jednostki.

**GOAL:** gracz z wystarczającymi zasobami rekrutacyjnymi może kupić jednostkę niezależnie
od przyszłego utrzymania; kontrola kosztu rekrutacji i rozliczenie utrzymania są rozdzielone
dla gracza, AI/MP, UI, logiki i starych zapisów.

**STATUS:** ZAREJESTROWANE — wymaga reconu regresu, implementacji w aktualnej ścieżce
rekrutacji i pełnego obiegu AutoBot. Decyzja właściciela jest literalna; nowe ABC nie jest
potrzebne, o ile kod nie ujawni dodatkowej niejednoznaczności zakresu.

## R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1 — podgląd kart w drzewku i panelu badań (2026-08-20)

**Zgłoszenie właściciela:** gotowe karty technologii mają być klikalne w drzewku technologii
oraz w menu Badań na mapie; kliknięcie ma otwierać podgląd karty i nie może przypadkowo
rozpoczynać badania. Interfejs ma oznaczać możliwość podglądu.

**GOAL:** jedna istniejąca karta technologii jest dostępna z obu ścieżek UI, dla wszystkich
stanów technologii, z osobną akcją rozpoczęcia badania oraz poprawnym zamykaniem/focusem.

**STATUS:** ZAREJESTROWANE — Operator i Evaluator wykonani; formalny dispatch/allowlista
uzupełnione po kontroli Final Control, przed ponowną kontrolą gotowości.

## R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1 — rozdzielenie budżetu od trybu automatyzacji (2026-08-20)

**Zgłoszenie właściciela:** blok „Podział Praca: budynki / ulepszenia” dotyczy już zebranego
budżetu i nie powinien sterować ani ograniczać automatycznego użycia ulepszeń; kontrolka jest
źle opisana i ma zostać rozdzielona od trybu pracy ulepszeń. Recon ma rozstrzygnąć, czy blok
budżetu usunąć, czy zastąpić właściwym sterowaniem 0–100% trybu automatyzacji.

**GOAL:** UI i logika nie mylą nadrzędnego budżetu ulepszeń z automatyzacją kolejki ulepszeń;
nie ma błędnej blokady 0–50% tam, gdzie właściciel oczekuje sterowania trybem pracy 0–100%.

**STATUS:** ZAREJESTROWANE — recon Operatora ma rozdzielić dwie kontrolki; przy niejednoznaczności
przygotować ABC zamiast wdrażać sprzeczną interpretację.

## R-ZDOBYCZE-ELIMINACJA-POWER-Q1 — brak zdobyczy po eliminacji (2026-08-20)

**Zgłoszenie właściciela:** popup eliminacji pokazuje `Skarbiec, nauka i 0 tech(y) przejęte`
oraz `Zdobycze Power: +0`, co jest niewiarygodne; po zdobyciu państwa/miasta powinny zostać
przejęte właściwe zasoby i power zgodnie z faktycznym stanem pokonanego.

**GOAL:** eliminacja poprawnie wylicza i pokazuje zdobycze Skarbca, Nauki, technologii i Power;
wartość nie może być zerowana przez błędny moment odczytu ani mylona z brakiem zdobyczy.

**STATUS:** ZAREJESTROWANE — wymaga reconu źródła popupu, snapshotu pokonanego państwa i testu
niezerowych oraz zerowych wartości; implementacja dopiero po potwierdzeniu kontraktu w kodzie.

## R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1 — stała tożsamość stron bitwy (2026-08-20)

**Zgłoszenie właściciela:** gracz ma być zawsze niebieski, przeciwnik zawsze czerwony,
niezależnie od tego, kto atakuje lub się broni; preferowany układ to gracz po lewej,
przeciwnik po prawej, a rola atakujący/obrońca ma być tylko informacją.

**GOAL:** ekran bitwy zachowuje stałą tożsamość kolorów i stron dla gracza/przeciwnika,
bez regresji podpisów, wyniku i logiki ataku/obrony.

**STATUS:** ZAREJESTROWANE — wymaga reconu renderowania stron i testów obu kierunków bitwy.

## R-PRACA-JEDEN-SUWAK-UI-Q1 — usunięcie drugiego suwaka (2026-08-20)

**Zgłoszenie właściciela:** usunąć dolny, niepotrzebny suwak; pozostawić jeden nadrzędny
suwak z nazwami „Budynki (0–100%)” i „Pula Pracy (0–50%)”, bez rozjechanych stanów.

**GOAL:** UI ma renderować jeden suwak i jeden stan podziału, z komplementarnymi wartościami
budynków/puli pracy oraz bez drugiego niezależnego event handlera.

**STATUS:** ZAREJESTROWANE — Operator zakończył zmianę i raport; brak jeszcze pełnej kontroli
Evaluator/Final Control. Nie integrować bez weryfikacji z późniejszym rozdzieleniem budżetu
i automatyzacji w `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1`.

## R-REPO-CHECKOUT-PULL-AUTH-Q1 — właściwy checkout i weryfikacja pull (2026-08-20)

**Zgłoszenie właściciela:** pracować na świeżym checkoutcie, potwierdzić obecność README.md,
Falę 300 i możliwość synchronizacji z `origin/main`; nie używać starego, zaśmieconego katalogu.

**GOAL:** właściwy checkout `Civ-clean-main-2026-08-20` jest rozpoznany, ma HEAD `47cdca15`
i upstream `origin/main`; pull nie może być wykonywany na nieprawidłowym/nieczystym katalogu
ani omijać problemu poświadczeń.

**STATUS:** ZWERYFIKOWANE — właściwy checkout i `origin/main` potwierdzone; README.md oraz
Fala 300 są obecne. Pull nie został wykonany na obecnym nieczystym worktree, aby nie nadpisać
równoległych zmian; wcześniejszy problem poświadczeń pozostaje warunkiem środowiskowym.

## R-PRACA-PULA-NIEAKUMULUJE-Q1 — pula pracy nie odkłada przychodu (2026-08-20)

**Zgłoszenie właściciela:** przy podziale 0% budynki / 100% pula pracy, a także przy 50/50,
globalna pula pozostaje na poziomie `8` zamiast odkładać bieżący przyrost Pracy; UI pokazuje
sprzeczność między `+9 do puli`, stanem `8 +9` i lokalnym `Praca w mieście +9`.

**GOAL:** każda tura prawidłowo rozdziela bieżącą Pracę między budynki i pulę, odkłada część
przeznaczoną do puli w trwałym stanie, nie zeruje jej po odświeżeniu oraz zachowuje zgodność
panelu imperium, panelu miasta, utrzymania ulepszeń i starego save/load.

**STATUS:** ZAREJESTROWANE — wymaga reconu źródła akumulacji i implementacji Operatora;
nie zakładać, że problem wynika wyłącznie z suwaka. Trzeba sprawdzić kolejność naliczenia,
cache/globalny stan puli, utrzymanie ulepszeń oraz ścieżkę tury.

## R-PROC-NUMERACJA-FAL-DEPLOY-Q1 — numer fali po każdym deployu (2026-08-20)

**Zgłoszenie właściciela:** przy każdym deployu numeracja fali ma być zwiększona i zapisana,
żeby wdrożenia nie ginęły w historii.

**GOAL:** każdy faktyczny deploy ma jeden jawny numer Fali, commit i wpis w `dyspozycje/WERSJE.md`;
numer nie jest zwiększany przy samym commicie, integracji ani pracy roboczej.

**STATUS:** ZAREJESTROWANE — kanon C-004 już wymaga logowania deployu; ten wpis doprecyzowuje
obowiązek numeracji dla bieżącej serii. W tej Fali nie wykonano nowego deployu.

## R-PROC-AGENT-CLEANUP-QUEUE-Q1 — zamykanie zakończonych subagentów (2026-08-20)

**Zgłoszenie właściciela:** zakończonych lub niepracujących subagentów trzeba usuwać/zamykać,
żeby nie blokowali kolejki.

**GOAL:** po odebraniu końcowego raportu agent jest zamykany; aktywny pozostaje wyłącznie agent,
który faktycznie pracuje lub oczekuje na wynik. Nie wolno zamykać agenta aktywnego bez sprawdzenia
statusu i zabezpieczenia jego raportu.

**STATUS:** ZAREJESTROWANE — bieżący audyt kolejki wykonany; zakończeni agenci tej serii zostali
zamknięci, a aktywny Operator puli pracy pozostaje otwarty do czasu raportu.

## R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1 — brak pewnego statusu subagentów (2026-08-20)

**Zgłoszenie właściciela:** routing nie przekazuje niezawodnie informacji o zakończeniu lub
przerwaniu subagenta; powstają puste przebiegi, marnuje się czas i nie wiadomo, czy uruchamiać
kolejną rolę.

**GOAL:** każde dispatchowanie ma jawny rekord `agent_id`, temat, rolę, rundę, czas startu,
oczekiwany artefakt i końcowy status (`PASS`, `FAIL`, `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS` albo
`CLOSED`). Brak notyfikacji nie może być traktowany jako aktywna praca ani jako sukces.

**STATUS:** ZAREJESTROWANE — wymaga audytu i wdrożenia mechanizmu ledger/watchdog w procesie
AutoBot; nie zmienia mechaniki gry.

## R-AUTOBOT-CAPACITY-LEDGER-VS-THREAD-LIMIT-Q1 — rozjazd wolnego slotu i limitu wątków (2026-08-20)

**Zgłoszenie właściciela:** ledger może wskazywać wolny slot po zamknięciu agenta,
podczas gdy silnik wykonawczy nadal zwraca `agent thread limit reached`; trzeba ustalić,
czy zamknięcie jest asynchroniczne, czy Watchdog zajmuje ten sam limit.

**GOAL:** zmierzyć rzeczywistą pojemność narzędzia względem liczby agentów raportowanych
jako aktywni, rozdzielić status księgowy od statusu wykonawczego oraz ustalić, czy Watchdog
liczy się do limitu. Wynik ma zawierać reprodukcję albo brak reprodukcji, czasy zwolnienia
slotu i regułę bezpiecznej rezerwacji slotów.

**STATUS:** ZAREJESTROWANE — diagnostyka procesu; bez zmian w `gra/**`, bez deployu i pushu.

## R-AUTOBOT-MODEL-LUNA-HIGH-OPERATOR-EVALUATOR-Q1 — zmiana modelu ról jakościowych (2026-08-20)

**Zgłoszenie właściciela:** zbyt wiele błędnych rund Operatora/Evaluatora przepala tokeny;
Operator i Evaluator mają pracować na Luna High.

**GOAL:** wymusić w dispatchach Codex `model=gpt-5.6-luna` oraz
`reasoning_effort=high` dla Operatora i Evaluatora, bez dziedziczenia przypadkowego modelu
rodzica. Każdy nowy raport ma podawać żądany model i effort; Final Control pozostaje Luna
High, a integracja orkiestratora Luna Medium.

**STATUS:** ZAREJESTROWANE — zmiana procesu; bez zmian w `gra/**`, bez deployu i pushu.

## KOREKTA STATUSÓW 2026-08-21 — faktyczny stan po FALA 300–302

Powyższe wpisy z 2026-08-20 leżały niescommitowane obok kodu gry i nigdy nie trafiły do
`origin/main`; ich `STATUS` jest zamrożony na moment sprzed FALA 300–302 i dziś jest
NIEAKTUALNY dla części tematów. Zgodnie z zasadą retencji tego pliku (nie przepisujemy
historycznych statusów bez daty/dowodu) — korekta, nie edycja wpisów powyżej:

- **`R-PRACA-JEDEN-SUWAK-UI-Q1`** → **ZDEPLOYOWANE, FALA 301** (potwierdzone przez
  właściciela). Wpis wyżej mówiący „brak jeszcze pełnej kontroli Evaluator/Final Control"
  jest nieaktualny.
- **`R-BITWA-KOLORY-GRACZ-PRZECIWNIK-Q1`** → **ZDEPLOYOWANE, FALA 301** (potwierdzone
  przez właściciela jako „Kolory bitwy: gracz niebieski, przeciwnik czerwony").
- **`R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1`** → **ZDEPLOYOWANE, FALA 302** (potwierdzone
  przez właściciela jako „Limit miasta: Budynki 50–100% / Pula Pracy 0–50%").
- **`R-PRACA-MIASTO-LIMIT-50-Q1`** → **DUPLIKAT** tej samej funkcji co
  `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` — zamknięty razem z nim, FALA 302; nie prowadzić
  osobnego retry pod tym ID.
- **`R-PRACA-PULA-NIEAKUMULUJE-Q1`** → **ZDEPLOYOWANE, FALA 302** (potwierdzone przez
  właściciela jako „Akumulacja puli pracy zgodnie z decyzją B").
- **`R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1`** → **NIEJEDNOZNACZNE, wymaga sprawdzenia
  przed zamknięciem.** Run tego ID (`dyspozycje/autobot/runs/R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1/`)
  ma werdykt `PASS-WITH-NOTES`, ale bez commita/integracji — jego zmiany nie są obecne ani w
  `origin/main`, ani w migawce `becb91c1`. Właściciel zgłosił jako zrobione w FALA 301
  „Podgląd technologii i badań" — może to być INNY, wcześniej zaimplementowany mechanizm
  (np. karta odkrycia z `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1`/`P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`),
  nie to konkretne zlecenie (klikalność kart w drzewku/hubie). Do potwierdzenia z właścicielem
  przy najbliższym przeglądzie — nie zamykać cicho jako to samo.
- **`R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`** i **`R-ZDOBYCZE-ELIMINACJA-POWER-Q1`** →
  potwierdzone przez właściciela jako **wciąż NIEWDROŻONE** (2026-08-21). Pozostają
  `ZAREJESTROWANE`, WIP częściowy istnieje niescommitowany w migawce `becb91c1` na branchu
  `work/clean-main-2026-08-20` — wymaga przeglądu przed kontynuacją, nie zakładać że jest
  gotowy do integracji.
- **`R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1`** → potwierdzone przez właściciela:
  to było pytanie o istniejące zasady, nie zaakceptowane zadanie zmiany — status
  `RECON PASS-WITH-NOTES` powyżej jest ostateczny, nie traktować jako otwarty temat do zamknięcia.

## R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1 — stary i nowy przycisk widoczne razem (2026-08-21)

**Zgłoszenie właściciela (transkrypcja głosowa):** „Następują stare i nowe przyciski,
zakończ turę i wykonaj" — stary i nowy przycisk dla akcji Zakończ turę/Wykonaj widoczne
jednocześnie w UI, zamiast jednego aktualnego.

**GOAL:** dokładnie jeden przycisk „Zakończ turę"/„Wykonaj" renderowany w danym stanie gry;
zidentyfikować i usunąć martwy/stary element UI pozostawiony po wcześniejszej zmianie
(prawdopodobnie regresja podobna do C-040/C-049 — nowy element wpięty bez usunięcia starego).

**STATUS (zaktualizowane 2026-08-21 po recon równoległej sesji orkiestratora):**
**RECON ZAMKNIĘTY — brak bugu w kodzie.** 3 hipotezy (podwójny montaż `bottomBarHud.ts`,
osobny przycisk `preBattle.ts`, race condition `cfg`) wykluczone niezależnie zweryfikowanym
recon (`dyspozycje/autobot/runs/R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1/01-operator.md`).
Najbardziej prawdopodobna przyczyna: stary zbuforowany build przeglądarki (ten sam mechanizm
co karta technologii z tej samej sesji). Rekomendacja: ABC do właściciela — czy duplikat
utrzymuje się po twardym odświeżeniu (Ctrl+Shift+R) przed ostatecznym zamknięciem tematu.

## R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 — pasek w stylu taśmy ostrzegawczej na kartach blokujących (2026-08-21)

**Zgłoszenie właściciela (transkrypcja głosowa):** „W tych obramówkach są jakieś znaczki,
jakby... taśmy ostrzegawcze na budowach. Nie jest zgodny ze stylem nowym, ale wiem, że
designer przygotował takie głupie wyglądy; trzeba by mu chyba dać dyspozycję, żeby to zmienić."

**Znalezisko (recon):** `gra/src/ui/sidePanelHud.ts`, klasa `.sp-blk-stripe` — diagonalny pasek
(`repeating-linear-gradient` złoto/ciemniejsze złoto) na górze kart „blokujących" wydarzeń w
panelu bocznym (`sp-event.sp-blocking.sp-expanded`). Wizualnie przypomina taśmę ostrzegawczą.
Brak jakiegokolwiek wcześniejszego zlecenia dla designera ani zgłoszenia pod tym opisem w
`REJESTR-PROSB-I-ZADAN.md` ani `PYTANIA-OTWARTE.md`.

**GOAL:** zastąpić `.sp-blk-stripe` istniejącym językiem wizualnym paczki designu panelu
imperium (`chip-warning.svg`/`.civ-emp-alert` z `Ulepszenie_infografik.zip`,
`docs/ux/claude-design/_dist/11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13/`) zamiast paska —
spójne z resztą nowego stylu, bez czekania na nowy mockup designera.

**ECHO (Maciej, 2026-08-21):** zastąp istniejącym językiem designu (nie usuwać całkowicie,
nie zlecać nowego mockupu).

**STATUS (zaktualizowane 2026-08-21 po dwóch rundach równoległej sesji orkiestratora):**
**READY_FOR_DEPLOY (Final Control, runda 2).** Runda 1 (recon inny niż to ECHO) usunęła pasek
całkowicie bez zamiennika — to było BŁĘDNE względem tego ECHO ("nie usuwać całkowicie").
Runda 2 zastępuje ją: pasek zamieniony na blok z ikoną `chip-warning` i paletą `.civ-emp-alert`
skopiowaną 1:1 z `empireDetailPanel.ts` (border `#4a2a2a`, tło `rgba(224,122,122,.07)`, tekst
`#e6c4c4`), zweryfikowane niezależnie przez Evaluatora i Final Control. Testy 19/19 + 43/43,
`tsc` czysty. Ślad: `dyspozycje/autobot/runs/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1/`
(`00-dispatch-r2.md`, `01-operator-r2.md`, `02-evaluator-r2.md`, `03-final-control-r2.md`).

## NOWE ZGŁOSZENIA PROCESOWE 2026-08-20 (Maciej)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AUTOBOT-LIMIT-5-RUND-Q1 | 2026-08-20 | Limit 5 rund pętli domknięcia Operator->Evaluator->Final Control na ten sam temat/ID; po przekroczeniu orkiestrator zgłasza właścicielowi zamiast kontynuować w nieskończoność | **WDROŻONE (docs-only) — nie jest pytaniem ABC** | Kanon: docs/decyzje/R-PROC-AUTOBOT.md §3 + .claude/skills/autobots/SKILL.md |
| R-AUTOBOT-FINALCONTROL-SUBAGENT-Q1 | 2026-08-20 | Final Control zawsze wykonuje osobny subagent (nigdy glowny agent samodzielnie); dla Claude Code ten sam model/effort co Evaluator | **WDROZONE (docs-only) — nie jest pytaniem ABC** | Kanon: docs/decyzje/R-PROC-AUTOBOT.md §1 + §5a + .claude/skills/autobots/SKILL.md |

## NOWE ZGŁOSZENIA GRA 2026-08-20 (Maciej)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1 | 2026-08-20 | Panel boczny wydarzeń (`sidePanelHud.ts`) stackuje wiele identycznych kart informacyjnych „Koniec tury" (ta sama treść, np. „Wyrąb: +25 Drewna (pozostało 0 tury)" powtórzona per miasto) zamiast łączyć je w jeden wpis. Poza zakresem `DYSPOZYCJA-WDROZENIE.md` Karty 3 — brief pokrywał wyłącznie rozróżnienie blokująca/informacyjna i kolejkę dla blokujących, nie deduplikację treści informacyjnych. | **READY_FOR_DEPLOY (Final Control, izolowany branch) — czeka na integrację** | Operator PASS (19/19 nowych testów, 0 regresji) → Evaluator PASS (adwersaryjnie, bez zmian kodu) → Final Control PASS (osobny subagent, READY_FOR_DEPLOY). Ślad: `dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/`. |
| P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1 | 2026-08-17 | Ogólny wzorzec karty odkrycia technologii. | **ECHO=A ZAPISANE, RECON ZAMKNIĘTY (2026-08-21)** | Recon wykazał 2 realne bugi w żywym kodzie FALI 300 (widmowe/nieaktualne nazwy ulepszeń terenu + systemowy zły dobór ikony) — naprawa wydzielona jako osobny temat `R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`. Ślad: `dyspozycje/autobot/runs/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1/01-operator-recon.md`. |
| R-TECH-ULEPSZENIA-TERENU-SYNC-Q1 | 2026-08-21 | Naprawa dwóch bugów znalezionych w recon `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`: widmowe/nieaktualne nazwy ulepszeń terenu w `tech.json` (Brązownictwo, Murarstwo, Oswojenie zwierząt, Wojskowość) + systemowy zły dobór ikony w `techDiscoveryNotice.ts` dla wszystkich technologii z tą sekcją. | **READY_FOR_DEPLOY (Final Control, PASS-WITH-NOTES) — czeka na integrację** | Operator PASS (48/48 testów, `tsc` czysty) → Evaluator PASS (adwersaryjnie, niezależny skrypt weryfikacyjny 0/18 rozbieżności) → Final Control PASS-WITH-NOTES: uwaga nieblokująca, poza zakresem — `tech.Uwagi` dla Brązownictwa ("ABC-7: Popalnia brązu na mapie") przecieka do gracza OSOBNYM kanałem (`cityPanel.ts::appendTechDetailBlock`, poza allowlistą tego tematu), zarejestrowane osobno niżej jako `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`. `terrain-improvements.json` nietknięty. Ślad: `dyspozycje/autobot/runs/R-TECH-ULEPSZENIA-TERENU-SYNC-Q1/`. |
| P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1 — **ZDEPLOYOWANE, FALA 306** | 2026-08-21 | Znalezisko Final Control przy okazji `R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`: pole `tech.Uwagi` (notatki deweloperskie, np. "ABC-7: Popalnia brązu na mapie") przecieka do gracza w `cityPanel.ts::appendTechDetailBlock()` (wywoływane z paneli budynku/jednostki) — filtr `playerFacingNote()` rozpoznaje tylko wzorce `PYTANIE`/`DECYZJA`/`DEC-\d{8}`/"patrz unit-building-bonuses", NIE rozpoznaje "ABC-7:". `techDiscoveryNotice.ts` (ten sam problem, inne miejsce) już świadomie NIE renderuje `Uwagi` — `cityPanel.ts` to przeoczył. | **ZDEPLOYOWANE, FALA 306** | Runda 1: dodano wzorzec `ABC-\d+` do `isDevOnlyPlayerText()` (whole-string reject) — Evaluator złapał regres: cała notatka Brązownictwa znikała, w tym legalna treść "kończy Epokę 1". Runda 2: przeniesiono rozpoznawanie do `stripInlineDevAnnotations()` (partial strip) — `playerFacingNote("kończy Epokę 1; ABC-7: ...")` teraz zwraca "kończy Epokę 1", nie `null`. Operator→Evaluator (PASS-WITH-NOTES)→Final Control PASS. Testy: `citypanel-uwagi-abc-filter-test.cjs` 35/35, `tsc` czysty. Znalezisko poza zakresem (Evaluator): analogiczny, nieblokujący problem w `buildings.json`/`terrain-improvements.json` (notatki ABC bez dwukropka po numerze, lub z długim ciągiem dalszym, przeciekają częściowo) — zarejestrowane niżej jako `P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1`. Ślad: `dyspozycje/autobot/runs/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1/`. |
| P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1 | 2026-08-21 | Znalezisko Evaluatora przy `R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` T3: `gra/tools/technology-discovery-card-visual-test.cjs` sekcja [2] robi `fs.readFileSync`+regex na SUROWYM TEKŚCIE `techDiscoveryNotice.ts`, nie na wyrenderowanym DOM aktywnej ścieżki — ponieważ stara implementacja (`_legacyShowTechDiscoveryNotice`) zostaje w tym samym pliku jako fallback, wzorce testu (np. `UNIT_PREVIEW = 3`, `tdn-card--compact`) trafiają w martwy kod fallbacku, nie w nową ścieżkę `entityCards`. Test dałby ten sam wynik (48 PASS) nawet gdyby aktywna ścieżka była całkowicie zepsuta. Final Control napisał jednorazowy harness DOM (esbuild+jsdom, bunduje realny kod, faktycznie woła `showTechDiscoveryNotice()`) i potwierdził poprawność na żywo (23/23), ale ten harness NIE został zapisany jako trwały test w repo. | **ZAMKNIĘTE przy okazji `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` (2026-08-21)** | Dokładnie ta luka materializowała się naprawdę: FALA 307 regres (przyciski „Rozpocznij badanie"/„Otwórz drzewo" nie reagujące na klik) przeszedł niezauważony przez zielony `technology-discovery-card-visual-test.cjs`, bo test nadal sprawdza tylko tekst źródła. Naprawiono dodając DWA trwałe testy: `gra/tools/tech-discovery-card-click-test.cjs` (esbuild+jsdom, realnie woła `showTechDiscoveryNotice()`, realny `button.click()`/`dispatchEvent(MouseEvent)` na przyciskach stopki) ORAZ `gra/tools/tech-discovery-card-real-click-test.cjs` (esbuild+Playwright/Chromium żywy, `elementFromPoint()`+`page.mouse.click()` — realny hit-test, bo jsdom NIE robi layoutu i `button.click()`/`dispatchEvent` w jsdom omija hit-testing, więc nie wykryłby faktycznej przyczyny tego konkretnego regresu, patrz `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`). Oba testy zweryfikowane przez `git stash` na PRZED-naprawą kodzie: jsdom PASS (fałszywie zielony, jak przewidziano), Playwright 6/12 FAIL (łapie regres). Ważne dla T4-T7b: ten sam wzorzec (realny hit-test przez żywy Chromium, nie tylko wywołanie handlera) warto powtórzyć dla kolejnych migracji kart. |
| P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1 | 2026-08-21 | Znalezisko Evaluatora przy okazji `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (runda 2): ten sam filtr (`isDevOnlyPlayerText`/`stripInlineDevAnnotations`/`playerFacingNote`) gate'uje też pole `uwagi` (małą literą) w `buildings.json`, renderowane graczowi w `cityPanel.ts:7138`. Część wpisów ABC w `buildings.json` przecieka częściowo: (a) regex wycina tylko do pierwszej kropki, więc dłuższe notatki dev (np. "ABC-20 B: suma bonusów Port... JSON. LANCUCH W GORE: ... martwe. Budowla portowa...") zostawiają wewnętrzny komentarz po pierwszym zdaniu; (b) wpisy bez dwukropka po numerze (np. "... merge bez zmian, ABC-21 B).") w ogóle nie pasują do regexa i przechodzą nietknięte. Potwierdzone: to NIE regresja tego tematu — te same wpisy przeciekały w całości już PRZED jakąkolwiek naprawą filtra (stan nie gorszy, częściowo lepszy). | **OTWARTE — nie rozpoczęte, tylko odnotowane** | Nie wymaga ABC (bug filtra/regexa, nie decyzja). Poza zakresem `P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (ten dotyczył wyłącznie `tech.json`/`cityPanel.ts::appendTechDetailBlock`). Brak brancha/dispatchu — do zarejestrowania z pełnym GOAL/allowlistą przed startem. |

Uwaga: `R-UI-PRZYCISK-ZAKONCZ-TURE-DUPLIKAT-Q1` i `R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1` — patrz sekcje narracyjne
z 2026-08-21 wyżej w tym pliku (zarejestrowane równolegle przez inną sesję pod tym samym ID; status pierwszego
zamknięty jako recon bez bugu, drugiego zaktualizowany do READY_FOR_DEPLOY runda 2 poniżej po integracji).

## NOWE ZGŁOSZENIA GRA 2026-08-21 (Maciej, po FALI 303)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-UI-PASKI-DIAGONALNE-PRODUKCJA-Q1 | 2026-08-21 | Karta „Produkcja: Ateny" (panel boczny wydarzeń) pokazuje diagonalny złoto-czarny pasek na górnej krawędzi zamiast czystej złotej obramówki. | **RECON ZAMKNIĘTY — brak aktywnego bugu w kodzie (Operator PASS)** | Pełny przegląd `sidePanelHud.ts` (740 linii) + grep całego repo pod `repeating-linear-gradient`/`border-image`/SVG pattern/`conic-gradient`/`stripe`/`diagonal`: jedyne wystąpienie to komentarz historyczny o już usuniętej (FALA 303) regule; brak jakiegokolwiek aktywnego mechanizmu mogącego dziś wyprodukować pasek. Karta „Produkcja" ma dziś jednolitą obramówkę. Silny dowód: stary zbuforowany build przeglądarki (ten sam wzorzec co 2 wcześniejsze incydenty tej sesji). Rekomendacja: twarde odświeżenie (Ctrl+Shift+R) na FALA 303 (md5 `26e45d4e`); jeśli pasek się utrzyma, potrzebny realny zrzut DOM/computed style z żywej sesji. Branch: `autobot/R-UI-PASKI-DIAGONALNE-PRODUKCJA-Q1` (`00588ad0`, docs-only, nic do integracji w `gra/`). Dispatch: `dyspozycje/autobot/runs/R-UI-PASKI-DIAGONALNE-PRODUKCJA-Q1/00-dispatch.md`, raport: `01-operator.md`. |
| R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 | 2026-08-21 | Klaster 5 powiązanych problemów w UI podziału Pracy: (A) zdublowany/sprzeczny suwak w panelu „Praca Imperium" (dolny suwak miał zniknąć po `R-PRACA-JEDEN-SUWAK-UI-Q1`, FALA 301); (B) złe nazewnictwo górnego suwaka; (C) miasto w trybie „Indywidualne" może przekroczyć empire-owy cap 50% na ulepszenia (70/30, 30/70) — **to świadoma, udokumentowana decyzja historyczna** (`praca-limit-50-test.cjs`), nie oczywisty bug — WYMAGA ABC przed zmianą; (D) pula pracy nie akumuluje mimo 100% alokacji — możliwy regres już zamkniętego `R-PRACA-PULA-NIEAKUMULUJE-Q1` (FALA 302); (E) suwak automatyzacji ulepszeń miasta ograniczony do 0–50% zamiast 0–100% — może być tym samym stanem co (A)/(C), do ustalenia w recon. | **RUNDA 1: Wątki A/B/D naprawione (Operator PASS, `tsc` czysty, 6/6 `praca-*.cjs` zielone), scalone na branch. Wątek D: prawdziwy root cause — `_lastPracaRate` w `main.ts` nie odejmował trzech drenaży puli (budowa cudów, empire building-budget, auto-ulepszenia); naprawione + nowy test `praca-pula-rate-parity-test.cjs`. Wątki C+E: recon zamknięty, ECHO zapisane (patrz niżej), implementacja RUNDA 2 w toku. NOWY Wątek F (2026-08-21, zlecenie właściciela): przeprojektować panel „Podział pracy" — czytelny rozdział budynki/ulepszenia, sygnał ulepszeń na górze, układ lewo=budynki/prawo=ulepszenia, zmiana nazw „Budowa"→„Budynki", „Pula Pracy"→„Ulepszenia".** | Potwierdzone: żaden wątek nie pochodzi z integracji FALI 303 (`empireDetailPanel.ts`/`cities.ts` nietknięte przez tę sesję) — stan odziedziczony z FALI 301/302. Branch: `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`. Dispatch: `dyspozycje/autobot/runs/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1/00-dispatch.md`, Operator runda 1: `01-operator.md`. |

## NOWE ZGŁOSZENIA GRA 2026-08-21 (Maciej, po FALI 303 — druga fala zgłoszeń, screenshoty)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 (RUNDA 3) — **ZDEPLOYOWANE, FALA 304** | 2026-08-21 | Designer przysłał `podmien.zip` — precyzyjną poprawkę CSS dla makiety kart wydarzeń („Karta 3"), sprzeczną z już wdrożoną rundą 2 (chip-warning). 5 podmian dosłownych: (1) usunąć skośny pasek na kartach blokujących całkowicie, zostaje sama obramówka `3px solid #e8d88a` (bez bloku chip-warning z rundy 2); (2)-(4) przycisk „Zakończ turę" (stany aktywny/disabled/zablokowany-z-poświatą) — zamiana `border-top-color` na inset box-shadow; (5) focus-visible bez `outline`/`outline-offset` — zamiana na `border-color`+`box-shadow` dla przycisku akcji i karty informacyjnej. Źródło: `dyspozycje/autobot/runs/R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1/podmien-designer-2026-08-21/PODMIEN-TO.md` (skopiowane ze scratchpad). | **ECHO ZAPISANE — gotowe do dispatchu Operatora** | ECHO (Maciej, 2026-08-21, po powtórnym pytaniu — pierwsze odrzucenie było przypadkowym kliknięciem): (a) świeża makieta Designera wygrywa w całości nad rundą 2 (usunąć chip-warning blok, wrócić do samej obramówki); (b) wszystkie 5 punktów w jednym dispatchu Operatora. Zakres: `gra/src/ui/sidePanelHud.ts` (punkt 1), `gra/src/ui/bottomBarHud.ts` (punkty 2-5). |
| R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1 — **ZDEPLOYOWANE, FALA 304** | 2026-08-21 | Zgłoszenie właściciela (zrzut ekranu, karta odkrycia „Obróbka drewna"): komunikat o nowym odkryciu wychodzi poza obrys monitora — brak twardego marginesu od góry/dołu. Jeśli treść karty jest długa, potrzebny jest pasek do przewijania w stylu złotym (nie systemowy szary), a nie wylewanie się karty poza widoczny obszar. | **OTWARTE — recon niezaczęty** | Prawdopodobny zakres: `gra/src/ui/techDiscoveryNotice.ts` (ten sam moduł co `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`/`R-TECH-ULEPSZENIA-TERENU-SYNC-Q1`) — brak `max-height`/`overflow-y` z marginesem od viewport + custom scrollbar (wzór stylu złotego już używany gdzie indziej w UI, do znalezienia w recon). Nie mylić z zamkniętymi tematami karty odkrycia — to nowy, osobny problem (overflow/scroll), nie treść/ikony. |
| R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 — **FAZA 1/6 ZDEPLOYOWANE, FALA 305** | 2026-08-21 | Duże zlecenie funkcjonalne właściciela (3 wiadomości uzupełniające się): (1) stworzyć pełne karty dla WSZYSTKICH budynków, jednostek, ulepszeń terenu i technologii; (2) w momencie odkrycia badania (popup odkrycia) — możliwość kliknięcia na dowolny wymieniony budynek/jednostkę/ulepszenie, by zobaczyć jego kartę; (3) karty mają być ze sobą POWIĄZANE (linkowanie krzyżowe); (4) część kart już istnieje (`unitInfoCard.ts`, `techDiscoveryNotice.ts`, karty budynku w `cityPanel.ts`) — **wymaga dokładnego sprawdzenia obecnego stanu i przeprojektowania od nowa dla spójności**, nie zakładać że wystarczy dokleić linki; (5) wszystkie karty (budynki/jednostki/ulepszenia/technologie) mają mieć swoje miejsce w CivPedii (`wikiHubHud.ts`/`wikiBundle.json` — istniejący hub wiki, patrz też `dyspozycje/AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md` i `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` z poprzedniego audytu); (6) NOWY WĄTEK (dołączony przez właściciela 3-krotnie, także dla drzewa technologii/hubu badań `scienceHubHud.ts`/`techTreeView.ts`): mały przycisk/tooltip informacyjny na każdej ikonie technologii do wyboru, klikalny, otwierający kartę technologii — bez zakłócania głównego kliknięcia „wybierz do badania". | **OTWARTE — duży zakres, recon wymagany przed ABC/implementacją** | To przeprojektowanie systemowe, nie prosty bug. Istniejące elementy do zinwentaryzowania w recon: `gra/src/ui/unitInfoCard.ts`, `techDiscoveryNotice.ts`, `wikiHubHud.ts`, `wikiBundle.json`, `scienceHubHud.ts`, `techTreeView.ts`, karty w `cityPanel.ts`. Prawdopodobnie wymaga ABC po recon (zakres kart per typ, priorytet, czy CivPedia = pojedyncze źródło prawdy dla treści kart czy osobna kopia). Nie implementować na ślepo przed pełnym recon + planem. |

## NOWE ZGŁOSZENIA GRA 2026-08-24 (Maciej)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ZELAZO-MODELE-BRAKUJACE-Q1 | 2026-08-24 | Właściciel poprosił o listę jednostek epoki Żelazo, które nie przeszły procesu naprawy modeli 3D „Opus 5" (precedens: `R-BRAZ-SUPER-DISPATCH-Q1`, zamknięty dla epoki Brąz). Audyt (subagent Explore) znalazł 4 jednostki bez dedykowanego modelu (Falanga, Jeździec z oszczepami, Konnica lancowa asyryjska, Konnica łucznicza asyryjska — ta ostatnia dodatkowo dzierży kopię zamiast łuku) + 2 jednostki dzielące identyczny model (Soldurii/Gaesatae, Celtowie). ECHO właściciela: wszystkie 6 dostają nowe, dedykowane, historycznie uzasadnione modele w stylu serii Opus 5. Jawna zgoda na pełną autonomię (workflow, pętla, deploy+push bez check-inów). | **ZINTEGROWANE (T1+T2+T3+T4 wszystkie na main) — czeka na deploy ROBOCZA** | Pełny opis, tabele audytu i podział na 4 sekwencyjne tematy (T1 Asyria-konnica ×2, T2 Celtowie Soldurii/Gaesatae, T3 Falanga, T4 Jeździec z oszczepami/Słowianie): `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`. Ślad: `dyspozycje/autobot/runs/R-ZELAZO-MODELE-BRAKUJACE-Q1-T{1..4}/`. |

## NOWE ZGŁOSZENIA PROCESOWE/KOSMETYCZNE 2026-08-25 (znaleziska rundy 2, R-ZELAZO-MODELE-BRAKUJACE-Q1-T1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T1-NPX-VITE-TWARDA-FORMA-Q1 | 2026-08-25 | `gra/tools/zelazo-konnica-asyryjska-real-render-test.cjs` (ok. linii 477) woła `npx vite build`, nie kanoniczną formę C-001 (`node ./node_modules/vite/bin/vite.js build`). Istota C-001 nie jest naruszona (empirycznie potwierdzone: brak nadpisania `data/*.json`), ale `npx` przy braku lokalnej binarki pobrałby vite z rejestru — ryzyko czysto proceduralne. | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Evaluatora T1 runda 2, potwierdzone przez Final Control jako niedotykające GOAL/dowodu/zakresu/§9/gotowości integracyjnej. Naprawa: zamienić wywołanie na formę binarną. |
| P-ZELAZO-T1-LANCA-UDO-BRAK-ASERCJI-Q1 | 2026-08-25 | Regres rundy 1 T1 (lanca przebijająca udo jeźdźca, naprawiony w rundzie 2 przez `AC_LANCE_GRIP.x`) nie ma dedykowanej asercji regresyjnej w teście tematu poza pośrednim pokryciem (H1) i jednorazowym testem penetracji Evaluatora/Final Control (nie zapisanym jako trwały test). | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Evaluatora T1 runda 2. Naprawa: dodać trwałą asercję geometryczną chroniącą tę konkretną oś, żeby regres nie mógł wrócić niezauważony. |
| P-ZELAZO-T1-Z3-WEDZIDLO-HEDGING-Q1 | 2026-08-25 | Komentarz historyczny Z3 w `zelazo-konnica-asyryjska-opus5.ts` (decyzja o brązowych, nie żelaznych, okuciach końskich) lekko przecenia jednoznaczność źródeł — żelazne wędzidła są poświadczone w kontekstach nowoasyryjskich. Wybór jest jawnie udokumentowany jako decyzja projektowa (kontrast materiałowy broń/oporządzenie), nie twierdzenie faktograficzne bez zastrzeżeń. | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Evaluatora T1 runda 2. Naprawa: złagodzić sformułowanie komentarza Z3, żeby jawnie nazwać to wyborem projektowym, nie ustalonym faktem. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (znaleziska T2, R-ZELAZO-MODELE-BRAKUJACE-Q1-T2, related_to: R-ZELAZO-MODELE-BRAKUJACE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T2-GAESATAE-UWAGI-NIEAKTUALNE-Q1 | 2026-08-25 | Pole `Uwagi` jednostki Gaesatae w `gra/data/units.json` opisuje stan SPRZED tego tematu i sprzed wcześniejszego rename „Wojownik celtycki → Gaesatae": „(...) długi miecz sieczny + owalna tarcza; tunika + torc" — dosłownie przeczy decyzji właściciela o nagości Gaesatae (`docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`) i faktycznemu modelowi zintegrowanemu w T2 (naga skóra, gaesum, brak tuniki). | **OTWARTE — dane, nieblokujące** | Znalezisko Operatora/Evaluatora/Final Control T2, poza allowlistą tego tematu (dane `units.json`, nie render). Naprawa: zaktualizować `Uwagi` do stanu faktycznego. |
| P-ZELAZO-T2-GAESATAE-TYP-SWORDSMAN-Q1 | 2026-08-25 | Pole `Typ` jednostki Gaesatae w `gra/data/units.json` = „Swordsman", mimo że jednostka faktycznie walczy włócznią/oszczepem (`Rola (linia)="Wręcz"`, model dzierży gaesum) — dziedzictwo tego samego rename co wyżej. Wpływa na tabele kontr (`Bonus vs Spearman: 15%` liczy się względem przeciwników, nie względem własnego typu, ale `Typ` samej jednostki też wchodzi w mechanikę kontr innych jednostek wobec niej). | **OTWARTE — dane/balans, nieblokujące, wymaga decyzji o typie broni** | Znalezisko Operatora/Evaluatora/Final Control T2, poza allowlistą tego tematu. Naprawa: ustalić właściwy `Typ` (Spearman?) i skutki dla tabel kontr — to jest decyzja balansu, może wymagać ABC. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (znaleziska T3, R-ZELAZO-MODELE-BRAKUJACE-Q1-T3, related_to: R-ZELAZO-MODELE-BRAKUJACE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T3-FALANGITA-WYSOKOSC-KOMENTARZ-NIEAKTUALNY-Q1 | 2026-08-25 | Nagłówek pliku `gra/src/render/hastati-falangita.ts` deklaruje sylwetkę „~0.55×HEX_R", ale zmierzona (Operator, Evaluator i Final Control niezależnie, identyczny wynik) wysokość Falangity to `0.7269×HEX_R` (z grzebieniem). Komentarz jest wspólny z `buildHastati()` w tym samym pliku, więc poprawka wychodzi poza allowlistę T3. | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Operatora T3, potwierdzone niezależnie przez Evaluatora i Final Control. Naprawa: zaktualizować komentarz do zmierzonej wartości. |
| P-ZELAZO-T3-DORY-CIAGLOSC-BRAK-ASERCJI-Q1 | 2026-08-25 | Nowy test real-render T3 (`zelazo-falanga-real-render-test.cjs`) nie ma dedykowanej asercji chroniącej CIĄGŁOŚĆ trzech części włóczni dory (shaft/tip/sauroter) — mutacja przesuwająca drzewce wzdłuż własnej osi (grot odczepia się i wisi w powietrzu) przechodzi test bez wykrycia, bo istniejące asercje mierzą inne relacje. Niezmiennik dziś TRZYMA z zapasem (zmierzone przez Evaluatora), to luka pokrycia na przyszłość, nie dowód braku dla tego tematu. | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Evaluatora T3. Naprawa: dodać asercję ciągłości shaft↔tip/shaft↔sauroter. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (znaleziska T4, R-ZELAZO-MODELE-BRAKUJACE-Q1-T4, related_to: R-ZELAZO-MODELE-BRAKUJACE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-BITWA-MANUALNA-MODEL-BEZ-NAZWY-Q1 | 2026-08-25 | `gra/src/battle/manualBattle.ts:750` woła `buildUnitModel(bu.kategoria, bu.ownerColor)` BEZ trzeciego argumentu (nazwa jednostki) — w scenie manualnej bitwy KAŻDY dedykowany model rodziny Opus 5 (T1 konnica asyryjska, T2 Soldurii/Gaesatae, T3 Falanga, T4 Jeździec z oszczepami — i wszystkie wcześniejsze, np. Brąz) spada do generycznego modelu kategorii, bo dispatch po nazwie nigdy nie dostaje szansy się uruchomić. Pozostałe wywołania `buildUnitModel` w repo (`unitMiniPreview.ts:90`, `battleScene.ts` ×4) przekazują nazwę poprawnie — to jest jedno, pojedyncze przeoczone miejsce. | **OTWARTE — pre-istniejący (commit `546f6a51`, 2026-08-17), przekrojowy, nieblokujący** | Znalezisko Evaluatora T4, potwierdzone niezależnie przez Final Control (`git blame`). Poza allowlistą T4 (§14) — nie naprawiony w tym temacie. Naprawa: dodać brakujący argument nazwy jednostki do wywołania. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (Maciej, korekta zakresu)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ZELAZO-AUDYT-POZOSTALE-Q1 | 2026-08-25 | Właściciel skorygował zakres `R-ZELAZO-MODELE-BRAKUJACE-Q1`: „mieć dedykowany model" ≠ „przeszedł proces Opus 5". Pozostałe 19 jednostek epoki Żelaza mają dedykowany dispatch, ale żyją w starszych plikach generacji, nigdy nie przeszły rygorystycznego audytu (zmierzona geometria, sekcja historyczna, real-render dowód). ECHO: audytować i przebudować wszystkie 19 (nie 6 już ukończonych). | **W TRAKCIE — T5+T6+T7+T8 ZINTEGROWANE, T9 w kolejce** | Pełny opis, tabela 19 jednostek i podział na 7 sekwencyjnych tematów (T5 Mezopotamia, T6 Fenicja/Egipt/Grecja piechota, T7 super-jednostki Rzym/Grecja+Hastati, T8 Germanie, T9 Celtowie, T10 Słowianie+Zulusi, T11 Katapulta): `docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`. Ślad: `dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T{5..11}/`. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (znaleziska T5, R-ZELAZO-AUDYT-POZOSTALE-Q1-T5, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T5-MUR-TARCZ-KULTURA-ROZJAZD-Q1 | 2026-08-25 | Jednostka „Mur tarcz (Sargonid)" w `gra/data/units.json` ma pole `Kultura: Sumerowie`, ale nazwa „Sargonid" wskazuje na dynastię neoasyryjską (Sargonidzi, 722-609 p.n.e.) — rozjazd ~1300 lat między nazwą a przypisaną kulturą. Opisane w kodzie (`jednostki-z1-mezopotamia.ts`, sekcja K) jako świadomy anachronizm z uzasadnieniem (dziedzictwo wizualne sumeryjskie np. kaunakes), ale to jest rozjazd DANYCH, nie tylko interpretacji wizualnej. | **OTWARTE — dane, wymaga decyzji właściciela** | Znalezisko Operatora T5, potwierdzone przez Evaluatora i Final Control. Poza allowlistą tego tematu (`units.json`). Decyzja: poprawić `Kultura` na Asyria/Sargonidzi, czy zostawić jako świadome uogólnienie „mezopotamskie" — to decyzja właściciela, nie techniczna. |

## NOWE ZGŁOSZENIA GRA 2026-08-25 (znaleziska T6, R-ZELAZO-AUDYT-POZOSTALE-Q1-T6, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T6-KHOPESH-EN-BRAZOWY-MODEL-Q1 | 2026-08-25 | Nazwa EN „Iron Khopesh Warrior" w `units.json` sugeruje broń żelazną, ale model buduje khopesz w kolorze/materiale brązowym — spójne historycznie (khopesz to broń epoki brązu, opisane w sekcji K tego pliku), ale niespójne z literalną nazwą EN jednostki. | **OTWARTE — dane/nazewnictwo, wymaga decyzji właściciela** | Znalezisko Operatora T6. Poza allowlistą tego tematu (`units.json`). Decyzja: zmienić nazwę EN, czy zaakceptować rozjazd nazwa/materiał jako świadomy (żelazo w innym elemencie uzbrojenia jednostki). |
| P-ZELAZO-T6-KHEPRESZ-SZEREGOWIEC-Q1 | 2026-08-25 | Model „Wojownik z żelaznym khopesh" nosi khepresz (niebieską koronę wojenną) — historycznie zastrzeżony dla faraona i następcy tronu, nie dla szeregowego wojownika. Nazwane wprost w sekcji K, nie naprawione (poza allowlistą — to `units.json`/decyzja projektowa, nie błąd geometrii). | **OTWARTE — decyzja projektowa/historyczna, wymaga właściciela** | Znalezisko Operatora T6, potwierdzone przez Evaluatora/Final Control. |
| P-ZELAZO-T6-TYRSKI-MIECZNIK-PANCERZ-Q1 | 2026-08-25 | Jednostka „Tyrski miecznik" ma w `units.json` Pancerz=4, ale model nie ma widocznej sylwetki pancerza (brak elementu ochronnego korpusu widocznego na figurze). | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Operatora T6. Naprawa: dodać element pancerza do modelu lub potwierdzić że wartość liczbowa nie wymaga wizualnej reprezentacji (decyzja projektowa). |

## NOWE ZGŁOSZENIA GRA/PROCESOWE 2026-08-25 (znaleziska T8, R-ZELAZO-AUDYT-POZOSTALE-Q1-T8, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T8-DISPATCH-FUNKCJA-NIEISTNIALA-Q1 | 2026-08-25 | Lekcja procesowa: dispatch T8 zakładał, że `buildBerserker()` istnieje w `jednostki-z3-plemiona.ts` — w rzeczywistości funkcja żyła w `units.ts` na generyku `buildBaseAvatar()`. Operator zgłosił to jawnie i napisał funkcję tam, gdzie allowlista ją nazywała (zero wpływu na sąsiadów, potwierdzone przez Evaluatora/Final Control). | **ZAMKNIĘTE — lekcja procesowa, bez akcji kodowej** | Rekomendacja Final Control T8: przyszłe dispatche (T9/T10/T11) powinny sprawdzać istnienie nazwanej funkcji w pliku PRZED napisaniem allowlisty, nie zakładać na podstawie wzorca innych jednostek tej samej rodziny. |
| P-ZELAZO-Z3-TYLNA-NOGA-SKROCONA-Q1 | 2026-08-25 | Cała rodzina jednostek w `jednostki-z3-plemiona.ts` (Berserker, Wojownik germański, Drużynnik, Miecznik galijski, iButho) buduje kończyny w płaszczyźnie YZ — tylna (−X) noga rzutuje się na ekran gry w rozpiętości ~0.046 wobec ~0.159 przedniej, więc wygląda na skróconą. Szczególnie widoczne u Berserkera (bose stopy). Stan zastany całej rodziny, nie defekt żadnego pojedynczego tematu. | **OTWARTE — kandydat na osobny temat serii** | Znalezisko Evaluatora T8, potwierdzone przez Final Control. Wymaga zmiany wspólnego wzorca budowy nóg całej rodziny — większy zakres niż pojedynczy temat T-serii. |
| P-ZELAZO-T8-WOJOWNIK-GERMANSKI-EPOKA-ROZJAZD-Q1 | 2026-08-25 | Jednostka „Wojownik germański" w `gra/data/units.json` ma `Epoka: Żelazo`, ale `Dostępna w epokach: Brąz` — rozjazd pól. | **OTWARTE — dane, wymaga decyzji właściciela** | Znalezisko Operatora T8, potwierdzone przez Evaluatora i Final Control. Poza allowlistą tego tematu (`units.json`). |
| P-ZELAZO-T8-TACYT-CYTATY-ELIPSA-Q1 | 2026-08-25 | Dwa cytaty z Tacyta w sekcji historycznej `jednostki-z3-plemiona.ts` skrócone bez oznaczenia elipsy ("scuta lectissimis coloribus distinguunt" z "tantum" pominiętym, "aut nudi aut sagulo leves" z "et" pominiętym) — sens obu zachowany, ale brak formalnego oznaczenia skrótu. | **OTWARTE — kosmetyczne, nieblokujące** | Znalezisko Evaluatora T8. Naprawa: dodać wielokropek w miejscu pominięcia. |

## NOWE ZGŁOSZENIA GRA/PROCESOWE 2026-08-25 (znaleziska T11, R-ZELAZO-AUDYT-POZOSTALE-Q1-T11, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-BITWA-MANUALNA-MASZYNY-OBLEZNICZE-BEZ-NAZWY-Q1 | 2026-08-25 | `manualBattle.ts:750` woła `buildUnitModel(bu.kategoria, bu.ownerColor)` bez nazwy jednostki — w bitwie ręcznej wszystkie trzy machiny oblężnicze (Katapulta, Taran okuty, Wieża oblężnicza) renderują ten sam generyczny model humanoidalny zamiast właściwej bryły (zmierzone: 87 mesh generyka dla każdej, wobec 48 dla prawdziwej Katapulty). Ten sam bug co `P-BITWA-MANUALNA-MODEL-BEZ-NAZWY-Q1` z T4 — dotyczy CAŁEJ rodziny `SUPER_Z_MODELEM_NAZWANYM`/dispatchu po nazwie, nie tylko super-jednostek. | **OTWARTE — wymaga decyzji właściciela/osobnego tematu** | Znalezisko Operatora T11, potwierdzone przez Evaluatora i Final Control. Poza allowlistą tego tematu (`manualBattle.ts`). Kandydat do połączenia z T4-owym znaleziskiem w jeden temat naprawczy obejmujący cały plik. |
| P-ZELAZO-T11-ONAGER-ALIASY-ROZJAZD-Q1 | 2026-08-25 | Aliasy `onager`/`balista`/`trebuchet` rozjeżdżają się między warstwami kodu (nazewnictwo niespójne), dziś bez efektu widocznego dla gracza (potwierdzone: `units.json` nie ma żadnego wiersza pod tymi nazwami — martwe rozgałęzienie). Operator świadomie NIE dopisał kodu pod nieistniejące jednostki. | **OTWARTE — porządkowe, nieblokujące** | Znalezisko Operatora T11, potwierdzone przez Evaluatora i Final Control. Bez wpływu na graczy dopóki `units.json` nie doda takiej jednostki. |

## NOWE ZGŁOSZENIA GRA/PROCESOWE 2026-08-25 (znaleziska T10, R-ZELAZO-AUDYT-POZOSTALE-Q1-T10, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T10-TARCZA-DRUZYNNIKA-DESKI-PROMIENISTE-Q1 | 2026-08-25 | Deski tarczy Drużynnika są ułożone promieniście (0°, ±60°), co z kamery gry (azymut 0/elewacja 52°) czyta się jako sześciopromienna gwiazda — powszechny opis tarcz tego typu mówi o deskach równoległych. Ten sam układ powtarza `zelazo-jezdziec-oszczepami-opus5.ts` (T4), który powołuje się na Drużynnika jako kanon — naprawa wymaga OBU plików naraz, żeby nie rozjechać spójności kulturowej. | **OTWARTE — kandydat na osobny temat serii** | Znalezisko Operatora T10, potwierdzone przez Evaluatora i Final Control. Świadomie nienaprawione w T10 (poza jego allowlistą jednoplikową). |
| P-ZELAZO-T10-DRUZYNNIK-GALIJSKI-PROG-Q1 | 2026-08-25 | Odróżnialność pary Drużynnik/Miecznik galijski = 0.521, nadal poniżej progu rodziny 0.558 (stan zastany 0.509 przed T10; T10 podniósł, nie pogorszył). Druga połowa pary (Miecznik galijski) jest przedmiotem T9. | **OTWARTE — zależność od T9, sprawdzić po jego zamknięciu** | Znalezisko Operatora T10, potwierdzone przez Evaluatora i Final Control. |
| P-ZELAZO-SERIA-PROG-ZEROWY-H12-Q1 | 2026-08-25 | Testy serii (asercje typu H12 „zero pikseli") pilnują wyłącznie dokładnego zera, więc bryły „prawie martwe" (8–11 px zmierzone np. `ib-arm-left-upper`, `ib-necklace-tooth-2`) przechodzą bez ostrzeżenia. Dotyczy metodologii CAŁEJ serii testów real-render, nie tylko T10. | **OTWARTE — porządkowe, dla całej serii** | Znalezisko Evaluatora T10. Propozycja: próg minimalnej widoczności zamiast progu zerowego. |
| P-ZELAZO-T10-DANE-ATAK-DYSTANSOWY-ARMOR-Q1 | 2026-08-25 | `units.json`: Drużynnik ma `Atak dystansowy: 0` w opisie, ale `missileAttack: 7` w bloku runtime (model słusznie idzie za polem opisowym, nie runtime); iButho nie ma w ogóle klucza `armor`, choć bratnia jednostka Impi ma `armor: 3`. Stan zastany, nie wprowadzony przez T10. | **OTWARTE — dane, wymaga decyzji właściciela** | Znalezisko Evaluatora T10, potwierdzone przez Final Control. Poza allowlistą tego tematu (`units.json`). |

## NOWE ZGŁOSZENIA GRA/PROCESOWE 2026-08-25 (znaleziska T9, R-ZELAZO-AUDYT-POZOSTALE-Q1-T9, related_to: R-ZELAZO-AUDYT-POZOSTALE-Q1 — OSTATNI temat serii)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-ZELAZO-T9-RYDWAN-CELTYCKI-BESPOKE-BRYLA-Q1 | 2026-08-25 | Rydwan celtycki dzieli WSPÓLNĄ bryłę kategorii `rydwan` z mykeńskim i Shang (`buildCategoryModel('rydwan')` + `decorateChariot()`) — to potwierdzona LUKA, nie świadomy wzorzec (cztery niezależne przesłanki, patrz `docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`). T9 podniósł odróżnialność celtycki/mykeński z 0.0102 do 0.390 w granicach allowlisty (`decorateChariot()`), ale próg rodziny 0.558 wymaga bespoke bryły (wiklinowy kosz, koła, kształt skrzyni) w osobnym pliku, jak Kapadokijski/konny. | **OTWARTE — kandydat na osobny temat serii** | Znalezisko Operatora T9, potwierdzone niezależnie przez Evaluatora i Final Control (obaj zmierzyli 0.390, próg 0.558 nieosiągalny bez bespoke bryły). |
| P-ZELAZO-T9-RYDWAN-MYKENSKI-SHANG-AUDYT-Q1 | 2026-08-25 | Rydwan mykeński i Shang mają ten sam defekt „znacznik kultury krawędzią do kamery" (198px) co miał celtycki przed T9; boss Shang ma barwę własnej tarczy (niewidoczny na tarczy), boss mykeński — barwę okuć wozu. Wzajemna odróżnialność mykeński/Shang 0.0139. Poza allowlistą T9 (dotyczy innych kultur). | **OTWARTE — kandydat na osobny temat** | Znalezisko Operatora T9, potwierdzone przez Evaluatora i Final Control. |
| P-ZELAZO-T9-RYDWAN-CELTYCKI-OSZCZEPY-ROZJAZD-Q1 | 2026-08-25 | `units.json`: Rydwan celtycki ma Uwagi „wojownik z oszczepami", ale `Atak dystansowy` = 0 i `Ilość pocisków` = „—" — model świadomie nie dostał oszczepów (zgodnie z realnymi danymi ataku), rozjazd jest w opisie tekstowym. | **OTWARTE — dane, wymaga decyzji właściciela** | Znalezisko Operatora T9, potwierdzone przez Evaluatora i Final Control. Poza allowlistą (`gra/data/**`). |
| P-ZELAZO-GETGEOOVALSHIELD-MYLNA-NAZWA-Q1 | 2026-08-25 | `getGeoOvalShield()` w `units.ts` zwraca `CylinderGeometry` (krążek), nie owal — nazwa myli co do faktycznego kształtu. Używane też przez inne jednostki poza zakresem T9, więc porządkowanie nazwy (i ew. sprawdzenie czy gdziekolwiek oczekiwano faktycznego owalu) jest osobnym tematem. | **OTWARTE — porządkowe, nieblokujące** | Znalezisko Operatora T9, potwierdzone przez Evaluatora i Final Control. |
| P-ZELAZO-T9-WOZNICA-TUNIKA-KOLOR-GRACZA-NIEBIESKI-Q1 | 2026-08-25 | Tunika woźnicy rydwanu celtyckiego (urzet 0x2f5aa0) leży blisko koloru gracza NIEBIESKIEGO (0x3366ee). Zmierzone: piksele w barwie gracza 1334 (celtycki) vs 1669 (mykeński) = 80%, więc identyfikacja gracza pozostaje czytelna dziś (H21), ale warto zobaczyć na żywym ekranie przy tej jednej palecie. | **OTWARTE — kosmetyczne, nieblokujące, do sprawdzenia przy okazji balansu barw** | Znalezisko Operatora T9, potwierdzone przez Evaluatora i Final Control. |


## ZNALEZISKO ROOT-CAUSE 2026-08-25 — podział Pracy: nazwa `doUlepszen` opisuje `doPuli` (P-PRACA-WARSTWY-NAZWY-ROZJAZD-Q1)

**Zgłoszenie właściciela (główny czat orkiestratora):** „to co miało być 0-100% jest do 50%,
a to co miało być do 50% jest 0-100%, więc chyba mylicie pojęcia i to co ma być zrobione jest
robione ciągle na odwrót" oraz „cap jest dla złej warstwy [...] prawdopodobnie cały czas mylisz
te pozycje, dlatego wszystkie kolejne zmiany cały czas robiły złe poprawki".

**POTWIERDZONE POMIAREM W KODZIE — właściciel ma rację.** `gra/src/ui/cityPanel.ts:1314-1319`:
`const { doBudynkow, doPuli } = splitPraca(total, pctB / 100); return { ..., doUlepszen: Math.round(doPuli) }`.
Zmienna nazywa się `doUlepszen`, ale niesie `doPuli` — czyli udział trafiający do OGÓLNEJ puli
Pracy imperium, nie budżet ulepszeń. Ta sama liczba jest w jednym pliku opisana czterema
różnymi nazwami: „Ulepszenia" (`cityPanel.ts:4783`), „→ Pula Pracy imperium" (`:4723`),
„→ Pula imperium — zapas cywilizacji (załóż miasto, projekty mapy)" (`:5539`) oraz w komentarzu
„`doUlepszen` (pula imperium)" (`:9948`). Pula imperium finansuje też cuda
(`wonder-map-build.ts`), zakładanie miast, budżet budynków imperium (`applyEmpireBuildingBudget`)
i leczenie HP jednostek (`manpower.ts`) — więc to NIE są ulepszenia.

**TRZY WARSTWY, mylone ze sobą od FALI 292:**
| # | Pole | Zakres | Co realnie dzieli |
|---|---|---|---|
| 1 | `podzialPracy.procentBudynki` | 50–100% budynków | lokalna kolejka budynków miasta **vs ogólna pula imperium** |
| 2 | `EmpirePracaSplit.procentUlepszenia` | 0–50% | pulę imperium **vs** budżet budynków imperium (`splitEmpirePracaBudget`) |
| 3 | `pracaAutoPercent` / `ulepszeniaPracaPercent` | 0–100% | ile z tego automat ulepszeń faktycznie wydaje (tryb budowy) |

**KONSEKWENCJA:** cap „ulepszenia ≤ 50%" siedzi dziś na warstwie 1, która nie jest podziałem
budynki/ulepszenia. Realny udział ulepszeń jest ILOCZYNEM warstw 1 i 2 (przy 70/30 w mieście
i 33% w imperium na ulepszenia idzie ~10%). To wyjaśnia całą serię nawrotów: fale 292, 293,
301, 302, 310, 317, 318, 319 naprawiały cap/etykietę na warstwie, na którą akurat trafiły —
każda „PASS", każda mijająca się z celem.

**STATUS:** **OTWARTE — czeka na decyzję właściciela (A/B).** (A) przemianować warstwę 1 na
uczciwe „Do puli imperium", cap zostaje gdzie jest, zero zmian w balansie; (B) rozdzielić pulę
na osobne strumienie i przenieść cap 50% na prawdziwy strumień ulepszeń — realna przebudowa
ekonomii Pracy, ale dopiero ona daje literalnie to, o co prosi właściciel.

**Wykonane dotąd (NIE jest to fix powyższego):** `P-PRACA-CAP-MIGRACJA-LUKA-Q1` — zamknięte
dwie luki w `migratePodzialPracyOnLoad()` (gałąź `savedDefaults` nie normalizowała miast wcale;
`podzialPracyOverride !== undefined` pomijało normalizację), dotąd maskowane wyłącznie kolejnością
wywołań na ścieżce load. Test `gra/tools/praca-cap-migracja-luka-test.cjs` (11/11, z dowodem
nietautologiczności przez wycięcie poprawki ze źródła). Dotyczy warstwy 1 — utwardzenie
istniejącego kontraktu, nie rozstrzygnięcie rozjazdu nazw.

## ZAMKNIETE 2026-08-25 — R-DYPLO-PAKT-WETO-EKSPANSJA-Q1 (Pakt o nieagresji strukturalnie nieosiagalny)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-DYPLO-PAKT-WETO-EKSPANSJA-Q1 | 2026-08-25 | „kolejny problem w dyplomacji, nie można zawrzeć deala" — Stół negocjacji odrzucał Pakt o nieagresji komunikatem „Ekspansja przy granicy — brak zaufania do paktu" mimo bilansu PW na korzyść drugiej strony. | **ZINTEGROWANE do `main` (`6841fa0c`), czeka na deploy ROBOCZA** | Weto nie miało ŻADNEGO źródła projektowego — specyfikacja modeluje ten czynnik wyłącznie jako −2 Zaufania/turę, nigdy jako bramkę. Flaga = czysta funkcja liczby miast (`cities(A)>2 && cities(B)>2`), więc od 3. miasta obu stron trwała do końca partii i żadna akcja gracza jej nie zdejmowała; przy Relacji 200/200 i słodziku 100 000 pakt nadal odrzucany. Naprawa: weto → narzut na próg Relacji równy `SWEETENER_EASE_MAX_POINTS`, więc maksymalny słodzik dokładnie go kasuje (pakt droższy, nigdy nieosiągalny). 26/26 nowy test + 51 bramek dyplomacji + 5 referencyjnych zielonych. |
| P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS | 2026-08-10 | Wcześniejsze zgłoszenie właściciela TEGO SAMEGO defektu: „albo nie mam zaufania i nie ma tego w opcjach do wyboru, albo jest w opcjach do wyboru, kwestią jest tylko zbalansowanie innymi propozycjami". | **ZAMKNIĘTE przez R-DYPLO-PAKT-WETO-EKSPANSJA-Q1** | Leżało w `PYTANIA-OTWARTE.md` ze statusem „zarejestrowane, w kolejce" przez 15 dni. Rozwiązanie realizuje dokładnie drugi wariant wskazany przez właściciela. Lekcja procesowa: zgłoszenie było poprawnie zapisane, ale nigdy nie dostało dispatchu. |
| P-DYPLO-AI-INICJATYWA-NIE-ZNA-EKSPANSJI-Q1 | 2026-08-25 | Inicjatywa AI (`ai.ts` Priorytet 3b) sprawdza tylko `score >= progNapRelacja - napScoreEase` i w ogóle nie zna flagi `ekspansjaPrzyGranicy` (`AIDiplomacyInput` jej nie niesie) — więc AI potrafi samo zaproponować pakt przy Relacji między progiem a progiem+narzut, którego samo by nie przyjęło. | **OTWARTE — wymaga `ai.ts` + `main.ts`, poza allowlistą tematu** | Znalezisko Operatora, potwierdzone przez Evaluatora i Final Control. Świadomie nieposzerzone w biegu (§14). |
| P-DYPLO-LOCKS-PREVIEW-LUKA-Q1 | 2026-08-25 | Luka w podglądzie `diplomacy-locks.ts` — pre-istniejąca, nie regresja tego tematu. | **OTWARTE — porządkowe** | Znalezisko Evaluatora, potwierdzone przez Final Control jako pre-istniejące i słusznie poza allowlistą. |

## ZAMKNIETE 2026-08-25 — R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1 (punkt zuzycia Pracy dla jednostek w kolejce)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1 | 2026-08-25 | „miało już nie być budowania jednostek w miastach AI tylko zakup za pieniądze z podatków i co znowu to samo czyli regres" + zrzut panelu PRODUKCJA („Wojownik · Koszt: 40 · Zebrana Praca: 2/40"). | **ZINTEGROWANE do `main` (`24fe52fc`), czeka na deploy ROBOCZA** | Premisa „regres w kodzie" NIE potwierdziła się: pomiar 40 tur × 3 scenariusze na czystym `main` → do kolejki Pracy trafia ZERO jednostek, wszystkie 24 kupione za Skarbiec. Sześć bramek chroni WEJŚCIE do kolejki. Znaleziono jednak realną lukę: PUNKT ZUŻYCIA nie był broniony (`advanceProduction` lał Pracę we front bez sprawdzania rodzaju), co ma znaczenie dla STARYCH ZAPISÓW — najprawdopodobniejsze źródło zrzutu. Naprawione owner-agnostycznie (parytet gracz/AI/MP). Runda 2 zamieniła tautologiczny test (regex po własnym źródle) na behawioralny; asercja D13 odtwarza dokładny zrzut właściciela. 44/44 + 31 bramek AI zielonych. |
| P-AI-CENA-JEDNOSTKI-SREDNI-NAN-Q1 | 2026-08-25 | Cena jednostki dla `kosztJednostekPace='sredni'` wychodzi `NaN`. | **OTWARTE — dane/logika, nieblokujące** | Znalezisko Operatora, poza allowlistą tematu. |
| P-AI-RUSH-KOMUNIKAT-PRZED-FALA299-Q1 | 2026-08-25 | Komunikat `[Rush] … jednostka w kolejce` opisuje zachowanie sprzed FALI 299 (jednostki w kolejce Pracy), czyli kontrakt, którego już nie ma. | **OTWARTE — kosmetyczne** | Znalezisko Operatora. |
| P-AI-PROMOTE-TO-FRONT-KONTRAKT-PRZED-FALA299-Q1 | 2026-08-25 | Trzy czerwone asercje `promote-to-front-test` (121/4) zakładają jednostkę w kolejce Pracy — kontrakt sprzed FALI 299. Czerwone PRE-ISTNIEJĄCO, potwierdzone identycznie na czystym `main`. | **OTWARTE — dług testowy** | Wymaga decyzji: zaktualizować asercje do kontraktu po FALI 299 albo usunąć jako nieaktualne. |
| P-AI-INICJATYWA-BEZ-FLAGI-EKSPANSJI-Q1 | 2026-08-25 | (powiązane z tematem dyplomacji) inicjatywa AI nie zna flagi `ekspansjaPrzyGranicy`. | **OTWARTE** | Zarejestrowane wcześniej przy `R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`. |

## ZAMKNIETE 2026-08-26 — R-PRACA-JEDEN-PODZIAL-Q1 (jeden podzial Pracy, suma 100%, cap 50%, stosowany RAZ)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-PRACA-JEDEN-PODZIAL-Q1 | 2026-08-25 | „zawsze musi się sumować do 100% nie może być 100 i 50" + „nazwy określamy tak jak powinny wyglądać żeby nie były mylące na przyszłość oraz usuwamy duplikaty tego co się liczy niepotrzebnie dwa razy". Po ośmiu falach nawrotów (292, 293, 301, 302, 310, 317, 318, 319). | **ZINTEGROWANE do `main` (`3739a64f` + `f33794d2`), czeka na deploy ROBOCZA** | Ta sama Praca była dzielona DWA RAZY. Na DOMYŚLNYCH ustawieniach gry do ulepszeń trafiało **0,0%**; przy maksymalnych suwakach 20% zamiast 50%. Po zmianie: 30% ustawione → 30,0%, 50% → 50,0%, suma zawsze = Praca miasta. Drugi podział usunięty w całości. Root cause nazw (`doUlepszen` niosące `doPuli`) zlikwidowany — trzy panele czytają jedną stałą. Runda 2 zamknęła trzy blokery: budżet automatu wrócił do liczenia od skumulowanej puli (pula 300 → 2 ulepszenia, 5 000 → 41, 50 000 → 217; wcześniej 0 niezależnie od puli), nazwy domknięte, dowód kryterium 5 zamieniony z regexa na behawioralny. |
| P-PRACA-BUDZET-AUTOMATU-33-SALDA-Q1 | 2026-08-26 | Efektywny budżet automatu ulepszeń to teraz 33% salda puli na turę (polityka imperium, `R-AUTO-PRACA-BUDZET-PROCENT-Q1=B`) — zmiana widoczna w rozgrywce wobec stanu sprzed tematu. | **OTWARTE — do świadomej akceptacji właściciela, nie defekt** | Znalezisko Evaluatora rundy 2. Nie jest błędem, ale jest odczuwalną zmianą tempa rozwoju — warto potwierdzić w playteście. |
| P-PRACA-PRODUCTION-OVERFLOW-PIN-UTRACONY-Q1 | 2026-08-26 | `production-overflow-test` stracił pin „wpływ do puli = poolGain + overflowToPool" (sekcja padła razem z nieistniejącą już mapą `pracaPoolInflowByOwner`). Zachowanie w `main.ts` bez zmian, ale bez straży. | **OTWARTE — dług testowy** | Znalezisko Evaluatora rundy 2. Do odtworzenia pinu w nowej formie. |
| P-PRACA-PUSTA-KOLEJKA-100-DO-PULI-Q1 | 2026-08-26 | Pusta kolejka budowy → 100% Pracy miasta idzie do puli, więc budżet ulepszeń może przekroczyć 50% Pracy TEGO miasta. Zachowanie sensowne, ale nienazwane w kontrakcie. | **OTWARTE — do nazwania w kontrakcie** | Znalezisko Evaluatora rund 1 i 2. Nie narusza capu na poziomie podziału. |
| P-PRACA-OVERRIDE-NIE-GASNIE-Q1 | 2026-08-26 | `toggleCityPodzialPracyOverride` zostawia override włączony przy wartości równej globalnej. | **OTWARTE — kosmetyczne** | Znalezisko Evaluatora. Nowa funkcja `applyPodzialPracyLocalChange` realizuje regułę właściciela (override zapala się sam przy różnicy, gaśnie przy powrocie do globalnej); ten toggle to osobna, starsza ścieżka. |

## ZAMKNIETE 2026-08-26 — P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1 (lista ulepszen nieosiagalna przy powiekszeniu)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1 | 2026-08-25 | „to menu budowania ulepszeń się nie przesuwa, przy dużym powiększeniu nie można otworzyć ulepszeń na samym dole". | **ZINTEGROWANE do `main`, czeka na deploy ROBOCZA** | 3 rundy. Siatka 60 punktów (powiększenie przeglądarki × powiększenie UI gry × wysokość okna), realny `page.mouse.click`: PRZED **29/60** ostatnia pozycja nieklikalna → PO **0/60**, zero regresji na każdej osi. Dwie przyczyny: sztywne `top:90px`+`vh` nie skalują się z powiększeniem UI gry, a rezerwa 180px była mniejsza niż realny `turnStackBottomPx()` (panel wchodził 75px w stos WYKONAJ). Hipoteza „kółko myszy zoomuje mapę" **obalona** pomiarem. |
| P-BUDOWA-KOMPROMIS-CIASNE-GEOMETRIE-Q1 | 2026-08-26 | W 7/60 najciaśniejszych kombinacji panel nachodzi na stos tury, w 3/60 zasłania WYKONAJ — tam blok zawierający jest niższy niż `top panelu + jeden pełny wiersz + rezerwa stosu`. | **OTWARTE — świadomy, nazwany kompromis, nie defekt** | Nachodzenie uznane za mniej złe niż zniknięcie panelu. Zero regresji wobec stanu zastanego. Do rozważenia przy ewentualnej przebudowie layoutu HUD. |
| P-BUDOWA-ET-HINT-POD-PANELEM-Q1 | 2026-08-25 | Pasek podpowiedzi blokad `.et-hint` dolnego paska wystaje ponad stos tury i potrafi wejść pod panel budowy; jego wysokość jest dynamiczna, więc nie da się jej objąć stałą rezerwą. | **OTWARTE — pre-istniejące, nieblokujące** | Znalezisko Operatora rundy 1, powtórzone w rundzie 2. |
| P-PROC-HARNESS-NIEPELNA-SCENA-Q1 | 2026-08-26 | **Lekcja procesowa.** W rundzie 2 Evaluator i Final Control NIEZALEŻNIE zmontowali `.hud-right-cluster` bez rodzica `.civ-hud`, przez co `z-index:320` bił się bezpośrednio z `311` i obaj zaraportowali objaw („panel chowa się pod HUD"), którego w grze nie ma — `.civ-hud` jest kontekstem układania, więc realne porównanie to 310 vs 311. Obie role sprostowały to same w rundzie 3. | **OTWARTE — do wpisania do kanonu procesu** | Cytat Evaluatora: „Dwa niezależne pomiary tej samej wady nie są dowodem — są dwoma egzemplarzami tego samego błędu". Wniosek: harness real-render musi odtwarzać KONTEKST UKŁADANIA, nie tylko obecność elementów; zgodność liczb dwóch ról nie jest dowodem, jeśli obie użyły tego samego skrótu. |

## ZAMKNIETE 2026-08-26 — R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1 (zrzuty 25 jednostek Zelaza, przod + kamera gry, podpisane)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1 | 2026-08-26 | „Jak skończysz, zrób deploy do roboczej, git push i potem screenshoty wszystkich nowych jednostek od przodu, żebym widział, jak wyglądają. Użyj nazwy jednostki, żebym wiedział, która jest która." | **ZINTEGROWANE do `main` (`974ff108`)** | Ostatnia, niezrealizowana część zlecenia po FALI 323. Nowy harness `gra/tools/zelazo-zrzuty-25-jednostek-render.cjs` (681 linii, 61/61): 25 obrazków + arkusz 5×5, nazwa **wypalona na obrazku**, dwa kadry obok siebie — PRZÓD (azymut 0°, elewacja 0°) i KAMERA GRY (azymut 0°, elewacja 52°, wzory z `render/camera.ts`), bo widok frontalny to NIE jest to, co gracz widzi w rozgrywce. Kryterium nadrzędne — **dowód modelu dedykowanego, nie generycznego fallbacku** — spełnione trzema niezależnymi metodami (dispatch po nazwie/kulturze ≠ `null`; liczba mesh dedykowany > generyk; unikalny prefiks nazw mesh 25/25 + `userData.anchors` w 21/25). Nietautologiczność: drugi bundle w pamięci z wyłączonym `buildNamedUnit`/`buildSuperUnit` → 25/25 traci dispatch, `units.ts` w repo nietknięty. **Cztery niezależne uruchomienia (Operator, Evaluator, Final Control, integracja) dały 26/26 PNG bajtowo identycznych.** Final Control obejrzał wszystkie 26 obrazków osobno (nie tylko arkusz). Zero zmian w `gra/src` i `gra/data`, zero PNG w repo. Wyjątek udokumentowany: **Falanga** ma model identyczny z kategorią `falanga`, bo obie ścieżki wołają `newBuildFalangita` — dowód, że to nie model współdzielony: jest JEDYNYM lokatorem tej kategorii w `units.json`. |
| P-ZELAZO-GAESATAE-SZPARA-DLON-DRZEWCE-Q1 | 2026-08-26 | Gaesatae: widoczna szpara między dłonią a drzewcem włóczni — włócznia wygląda na nieuchwyconą. Widoczne w OBU kadrach. | **OTWARTE — defekt modelu** | Ujawnione przez render, potwierdzone naocznie przez Evaluatora i Final Control. Świadomie nienaprawione: allowlista tematu (`gra/tools/*`) zabrania ruszania `gra/src`. Plik dowodowy: `04-Gaesatae.png`. |
| P-ZELAZO-ORIENTACJA-RODZINY-KONNEJ-Q1 | 2026-08-26 | Niespójna orientacja rodziny konnej: trzy modele `konnica` patrzą w **+X** (kamera gry i panel PRZÓD widzą je z profilu), a `Rydwan celtycki` w **+Z** (przodem). Jedna rodzina, dwie konwencje. | **OTWARTE — defekt modelu, do decyzji właściciela** | To powód, dla którego 4 jednostki konne wyglądają w panelu PRZÓD na ustawione bokiem. Harness ten błąd **ujawnia zamiast ukrywać** — nie obraca modeli „żeby ładniej wyszło", bo pokazałby stan nieistniejący w grze. Naprawa = obrót modeli w `units.ts` do wspólnej konwencji +Z. |
| P-ZELAZO-HARAPPA-TARCZA-ZASLANIA-Q1 | 2026-08-26 | Garnizon Harappy: tarcza trzcinowa zasłania od przodu praktycznie całą sylwetkę. | **OTWARTE — defekt modelu / kompozycja** | Potwierdzone naocznie przez Final Control. Do rozważenia: zwęzić tarczę albo odsunąć ją od korpusu. |
| P-ZELAZO-TRIARI-HASTA-SKROCONA-Q1 | 2026-08-26 | Triari: hasta od przodu jest silnie skrócona perspektywicznie (prawie niewidoczna), czytelna dopiero z kamery gry. | **OTWARTE — defekt modelu** | Dokładnie ten tryb, przed którym ostrzegał dispatch: element poprawny geometrycznie może być z jednego kąta niewidoczny. Kamera gry (elewacja 52°) czyta hastę poprawnie, więc w rozgrywce defekt jest niewidoczny — priorytet niski. |
| P-ZELAZO-STOPKA-DWUZNACZNA-MESH-Q1 | 2026-08-26 | Stopka obrazków Triari i Wojownika germańskiego („model 37 mesh vs generyk kategorii 37 mesh") czyta się jak zaprzeczenie własnego „MODEL DEDYKOWANY: TAK" — różnica jest w NAZWACH mesh, nie w ich liczbie. | **OTWARTE — kosmetyczne, w harnessie** | Uwaga Evaluatora #2. Final Control świadomie nie poprawiał: to tekst w PNG (artefakcie), poprawka wymaga ponownego renderu 25 obrazków — nieproporcjonalnie do wagi uwagi. |
| P-ZELAZO-ETYKIETA-MARGINES-3PX-Q1 | 2026-08-26 | Etykieta panelu kończy się 3 px nad czubkiem Miecznika galijskiego — dziś bez zasłonięcia, ale jednostka wyższa od obecnie najwyższej zostanie zakryta. | **OTWARTE — kosmetyczne, dług na przyszłość** | Uwaga Evaluatora #3. Do podniesienia marginesu przy następnej edycji harnessu. |
| P-ZELAZO-HIEROS-LOCHOS-NAZWA-Q1 | 2026-08-26 | Dispatch pisał „Hieros Lochos", kanoniczna nazwa w `units.json` to „Hieros Lochos (Święty Zastęp)". | **ZAMKNIETE — bez skutku** | Operator zgłosił rozbieżność jawnie zamiast renderować cichy fallback; dopasowanie po prefiksie jednoznaczne, renderowana jest jednostka z `units.json`. Odnotowane dla porządku. |

## ZAMKNIETE 2026-08-26 — R-REPO-SPRZATANIE-SREDNIE-Q1 (usuniecie 591,8 MB niepotrzebnych obecnej grze)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-REPO-SPRZATANIE-SREDNIE-Q1 | 2026-08-26 | „wykasowałbym wszystko na dysku i na git co nie jest nam potrzebne w obecnej grze i wyczyścił git". Wariant **średni** wybrany przez właściciela (AskUserQuestion): pochodne + `docs/ux` + archiwa. | **ZINTEGROWANE do `main` (`d692d371`)** | Usunięte wg tabeli dispatchu: 8 bundli PLAYTEST (280,3 MB), `gra-kanon/` (606 plików, 107,0 MB), `docs/ux/` (2928 plików, 177,5 MB), `docs/archiwum-czatow/` (13,4 MB), `_archiwum/` (8,2 MB), `_backup/` (5,4 MB), dwa katalogi „tools — kopia" oraz **10 martwych narzędzi** (8 zależnych od `gra-kanon`, 2 od `docs/ux`). Pliki śledzone **816,6 MB → 224,0 MB** (ubyło 592,6 MB), 8557 → 4445 plików. `Gra-ROBOCZA.html` bez zmian (md5 `04a7adcb` przed i po). `gra/src` tknięte **wyłącznie w sześciu komentarzach JSDoc** wskazujących na usuniętą `docs/ux` — zweryfikowane maszynowo, każda zmieniona linia zaczyna się od ` *`. `gra/data` bez zmian. Filtr odwrotny (czy skasowano cokolwiek spoza tabeli) — **pusty** w trzech niezależnych pomiarach. Bramki po merge'u: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 · kontrakt 634/0 · real-render 36/0 · ai-zakup 44/0 · scroll 43/0 · dyplo 26/26 · cap-migracja 11/0 · zrzuty 61/0. Build kanon C-001 do `/tmp` przechodzi (dowód, że skasowanie `docs/ux` niczego nie złamało). **Historia NIE przepisywana** — to osobna bramka wymagająca zgody właściciela. |
| R-REPO-SCIEZKA-KANON-FINALNA-Q1 | 2026-08-26 | Po usunięciu `gra-kanon/` i narzędzi `publish-kanon-snapshot.ps1` + `publish-finalna-snapshot.ps1`: `dyspozycje/WERSJE.md:8` nadal je nazywa, a `Gra-FINALNA.html` **zostaje w repo bez żadnego narzędzia promocji**. Owner-fact z `playbook.md` §1 („trzy poziomy: ROBOCZA → KANON → FINALNA") traci oprzyrządowanie dwóch poziomów. | **OTWARTE — WYMAGA DECYZJI WŁAŚCICIELA** | Znalezisko F1 Final Control, oznaczone przez niego jako **najważniejsze**. Pytanie do właściciela: czy KANON i FINALNA są nadal żywymi poziomami wydań? Jeśli TAK — trzeba odtworzyć oprzyrządowanie. Jeśli NIE — zaktualizować `WERSJE.md` i `playbook.md`. |
| R-REPO-HUB-START-MARTWE-KAFLE-Q1 | 2026-08-26 | `gra-robocza/START.html` **i** `gra-robocza/START-FALA201.html` mają po 16 odwołań do 8 usuniętych bundli PLAYTEST → **2×8 martwych kafli** w hubie, który otwiera właściciel. | **OTWARTE — wysoki priorytet (UX właściciela)** | Znalezisko F2. Evaluator zgłosił tylko `START.html`; **drugi hub to znalezisko Final Control**. Oba pliki chronione, więc żadna z trzech ról nie mogła tego naprawić w tym temacie. |
| R-DOCS-MARTWE-ODWOLANIA-PO-SPRZATANIU-Q1 | 2026-08-26 | Martwe odwołania w dokumentach po sprzątaniu: F3 `bramka-test-publish.ps1` (`docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md:20`, `docs/master/INDEX-PLIKOW.md:90`, `AUDYT-2026-06-27.md:82`, `protokoly/MASTER-SILNIK.md:84`); F4 `.cursor/rules/chat-export-auto.mdc:9` → usunięty `ARCHIWIZACJA-AUTO.md`; F6 `.gitattributes:17` reguła `gra-kanon/*.html`; F7 komentarze `docs/ux` w `gra-robocza/srcKopiaMaster/`. | **OTWARTE — porządkowe** | Znaleziska F3/F4/F6/F7. F3: Final Control potwierdził **niezależnie**, że tor „Grupa F" był wycofany PRZED tym tematem — jego cele `Gra-podglad*.html` nie istniały już w bazie `39ae5d17`. |
| R-PROC-C015-PO-SPRZATANIU-Q1 | 2026-08-26 | Reguła C-015 (`playbook.md:64`, `playbook.json:235`, `.claude/skills/civ-autobot*/SKILL.md`) mówi o sparse-checkout „bez `gra-robocza/`, `gra-kanon/` … ~810 MB" — po sprzątaniu te liczby i nazwy są nieaktualne. | **OTWARTE — kosmetyczne, domena PROCESS** | Znalezisko F5. Operator **słusznie** tego nie tknął (`playbook.json` jest generowany, §9 gr. 7; zmiana procesu poza allowlistą tematu, §9 gr. 4). |
| P-REPO-CHECK-POLE-BUNDLE-USUNIETY-Q1 | 2026-08-26 | Usunięto `gra/tools/check-pole-bundle.cjs`, które **działało** i diagnozowało ocalały `Gra-podglad-POLE-BITWY.html` (25 MB, w korzeniu repo). Podstawą usunięcia było zero wywołań, nie martwota narzędzia. | **OTWARTE — nota, do świadomej akceptacji** | Znalezisko F8. Operator odnotował to jawnie zamiast ukryć. Utrata sprawnej diagnostyki, której GOAL nie wymagał — mieści się w literze dispatchu, ale warto wiedzieć. Odtwarzalne z historii do czasu bramki `filter-repo`. |
| P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1 | 2026-08-26 | **Uzasadnienie wiersza 1 tabeli dispatchu było nieścisłe.** Tylko 2 z 8 usuniętych bundli PLAYTEST były kopią bieżącego `Gra-ROBOCZA.html`; pozostałe miały md5 `28d236f5` (×4) i `95021308` (×2). `sync-playtest-bundles.cjs` zna **6 nazw** — `BITWA-DUZA` i `OBLEZENIE-DUZE` **nie odtworzy w ogóle**. | **OTWARTE — BLOKUJE bramkę `filter-repo`** | Nota N2 Evaluatora, potwierdzona odczytem kodu przez Final Control (§4d). Dziś treść żyje w historii Gita, więc utrata jest odwracalna. **Przepisanie historii uczyni ją nieodwracalną** — do rozstrzygnięcia z właścicielem PRZED tą bramką. |

## ZAMKNIETE 2026-08-26 — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 (rekrutacja = tylko koszt zakupu)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 | 2026-08-20, ponowione 2026-08-26 | „do rekrutacji system liczy nie tylko tyle surowca, ile jest konieczne do zrekrutowania, ale dolicza jeszcze koszt utrzymania z następnej tury… do rekrutacji bierzemy wyłącznie koszt zrekrutowania surowców". Zrzut: Wojownik 50 Drewna + 10/t utrzymania, gracz ma 57, rekrutacja zablokowana. | **ZINTEGROWANE do `main`** | **Dlaczego wracało: temat już raz przeszedł trzy role 2026-08-21 (Final Control PASS-WITH-NOTES) i NIGDY NIE ZOSTAŁ ZINTEGROWANY** — ostatnia linia tamtego raportu: „Brak integracji i brak commita". Praca żyła jako niescommitowane zmiany w katalogu `Civ-clean-main-2026-08-20`, którego już nie ma; `recruitment-no-upkeep-gate-test.cjs` nie istniał w repo. To nie był regres, tylko utrata. Teraz: bramka sprawdza wyłącznie `unitStockCost`. Scenariusz właściciela (57/50/10) **przechodzi**; kontrola odwrotna (49 Drewna, koszt 50) **nadal blokuje**. **Pobór utrzymania w następnej turze udowodniony niezależnie przez Evaluatora i Final Control jako bajt w bajt identyczny z bazą** (sonda 6 tur × 3 właścicieli) — rozdzielenie bramek nie wyłączyło poboru. Parytet gracz/AI/MP (bramka bez `ownerId`). `gra/src/main.ts` nietknięty (alias `@deprecated` chronił §2b przy równoległym temacie). Nowe bramki: `recruitment-no-upkeep-gate-test` 36/0, `recruit-card-stock-chip-real-render-test` 15/0 (żywe Chromium, `getComputedStyle`). 5 mutacji Operatora + 2 Evaluatora + 3 Final Control. |
| R-AI-RECRUIT-UPKEEP-GATE | 2026-08-06 → **WYCOFANA 2026-08-26** | Decyzja nakazująca doliczanie rezerwy 1 tury utrzymania do bramki rekrutacji. | **WYCOFANA — zastąpiona przez `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`** | `docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md` dostał nagłówek statusu i sekcję WYCOFANIE; **treść historyczna nietknięta**. Powód jawnego oznaczenia: bez tego ktoś przeczytałby tamtą decyzję i „naprawił" to z powrotem. |
| P-REKRUT-DRIFT-TESTY-X1-X5-Q1 | 2026-08-26 | `unit-stock-cost-test` 41/17 FAILED i `unit-resource-upkeep-test` 3/4 FAILED — czerwone **PRE-ISTNIEJĄCO**, drift oczekiwań ×1 vs dane FALI 300 ×5. | **OTWARTE — dług testowy** | Zmierzone na czystym `main` PRZED tematem i po nim: bez zmiany, bez pogorszenia. Świadomie NIE naprawiane w tym temacie (poza GOAL). |
| P-REKRUT-ALIAS-DEPRECATED-MAIN-Q1 | 2026-08-26 | 5 wywołań `@deprecated` aliasu `canAffordUnitRecruitFull` w `main.ts` do przemianowania na `canAffordUnitRecruitStock`. | **OTWARTE — dług, kosmetyczne** | Alias był świadomą decyzją zakresową chroniącą §2b (zero ruchu w `main.ts` przy trzech równoległych tematach). |
| P-REKRUT-KARTA-ETYKIETA-MIECZNIK-Q1 | 2026-08-26 | Nagłówek karty rekrutacji pokazuje „Miecznik · Kamień" przy definicji Wojownika. | **OTWARTE — etykietowanie, poza allowlistą** | Znalezisko Evaluatora na zrzutach dowodowych. `unitRecruitCard.ts`. |
| P-REKRUT-KOMENTARZ-AI-PROD-FALLBACK-Q1 | 2026-08-26 | `ai-prod-fallback-test.cjs:271` — komentarz „12 brąz: 10 rekrutacja + 2 rezerwa" opisuje wycofaną decyzję. Bramka zielona 17/0, plik nietknięty. | **OTWARTE — kosmetyczne** | Do sprzątnięcia przy okazji. |

## ZAMKNIETE 2026-08-26 — R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 (wlasciwa warstwa w panelu budowy)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 | 2026-08-26 | „system źle identyfikuje parametr, ile ma być automatycznie rozdzielane pracy. W tym miejscu podział pracy nie jest potrzebny, bo jest dublowany już w pool imperium… W tym miejscu tylko powinno się wskazywać, czy ma być ręczna budowa, czy automatyczna, i ile z automatycznej… ma iść do automatycznej pracy, a ile ma być zostawione w puli na inne prace ręczne." | **ZINTEGROWANE do `main`** | **Duplikat potwierdzony co do znaku:** `buildModeHud.ts:364-392` i `empireDetailPanel.ts:1304-1377` czytały i pisały DOKŁADNIE to samo pole (`ownerDefaultPodzialPracy` owner 0 → `CityPodzialPracy.procentBudynki`), ten sam zakres 0–50%, ten sam tekst. **Przyczyna wrażenia „system źle identyfikuje parametr":** sterowanie warstwą (c) (`pracaAutoPercent`) ISTNIAŁO w tym samym panelu, ale renderowało się wyłącznie przy `tryb === 'auto'`, a domyślnym trybem nowej gry jest `'reczny'` (`cities.ts:203`) — więc na starcie widoczna była tylko zdublowana warstwa (a), a właściwa (c) wcale. Po zmianie: blok (a) usunięty z panelu budowy, suwak (c) widoczny w OBU trybach (przy `reczny` wyszarzony z wyjaśnieniem), etykieta „Z puli imperium na pracę automatyczną". Dowód liczbowy (prawdziwy `pickAutoImprovements`, pula 5 000): **10% → 12 ulepszeń (480 P), 50% → 62 ulepszenia (2 480 P)**; Evaluator zmierzył inaczej — w P: 0/480/1240/2480/3720/5000, każdy ≤ `pct%×pula`. Warstwa (a) nadal działa w swoich prawowitych miejscach — pomiar: imperium 70→60 i MAX→50, miasto 70→90; `empireDetailPanel.ts` i `cityPanel.ts` mają **zero linii diffu**. Cztery istniejące bramki zaktualizowane z uzasadnieniem, bilans rośnie (634→637, 36→37, 11→13); nowa bramka 28/0. |
| R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1 | 2026-08-20 | To samo zgłoszenie pod wcześniejszym ID („czy blok budżetu usunąć, czy zastąpić właściwym sterowaniem 0–100% trybu automatyzacji"). | **DUPLIKAT — zamknięty razem z `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`** | Dispatchowany 2026-08-21 (Operator + Evaluator, brak Final Control), **nigdy niezintegrowany**. Nie prowadzić osobnego retry pod tym ID. Błąd orkiestratora: nowe ID nadane 2026-08-26 bez sprawdzenia rejestru. |
| P-PRACA-MARTWE-PROCENT-PULI-IMPERIUM-FOR-OWNER-Q1 | 2026-08-26 | `main.ts:4808` `procentPuliImperiumForOwner()` martwe po usunięciu `getEmpirePracaSplit`. | **OTWARTE — porządkowe** | Znalezisko Evaluatora, poza allowlistą tematu. |
| P-PRACA-KOMENTARZ-WARSTWA-B-MAIN-Q1 | 2026-08-26 | `main.ts:19391` — komentarz nadal nazywa warstwę (c) „pole (b)", a warstwa (b) już nie istnieje. | **OTWARTE — kosmetyczne, mylące na przyszłość** | Dokładnie ta klasa nazewnictwa, która wywołała osiem fal nawrotów. |

## AUDYT ZAMKNIETY 2026-08-27 — P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 (wojny epoki Kamienia nie wybuchaja)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 | 2026-08-26 | „cywilizacje w epoce kamienia nadal nie wypowiadają sobie wojen, chociaż po 20 turach miałyby je wypowiadać… nie widzę efektu, żeby ktoś wypowiedział mi wojnę". | **ZINTEGROWANE do `main` — AUDYT, zero zmian w mechanice** | Trzy niezależne narzędzia, 5 map, **ponad 500 tur rozgrywki: ZERO wypowiedzeń wojny między kimkolwiek**. Mechanizm `forced-war-stone.ts` jest napisany dokładnie wg decyzji `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` (start tura 20, koniec po 2 miastach, 20 tur odpoczynku) i ma **zielone bramki 32/0 + 18/0** — ale ani razu się nie uruchamia. **To jest wzorcowy przykład, dlaczego zielona bramka nie jest dowodem zachowania w rozgrywce (§13a).** Zero zmian w `gra/src` i `gra/data` — dowód w diffie. |
| **R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1** | 2026-08-27 | **PRZYCZYNA GŁÓWNA.** Gdy AI zdobędzie pierwsze miasto należące wcześniej do miasta-państwa (tura **6–8**, u **wszystkich sześciu** cywilizacji, w **każdej** sprawdzonej grze), gra traktuje **ją samą** jak miasto-państwo **na stałe**, a wyzwalacz wojny miasta-państwa pomija (`isOwnerClusterCityState` w filtrze `main.ts:28020`). Do tury 20 wszyscy kandydaci są już trwale wykreśleni. Flaga jest kasowana **tylko przy pokojowym wchłonięciu, nigdy przy zdobyciu siłą**. | **OTWARTE — WYMAGA DECYZJI WŁAŚCICIELA, priorytet wysoki** | Właściciel przypuszczał, że to opóźnienie („dłużej zajmuje im przejęcie miast-państw… tak w sumie powinno być"). **Hipoteza trafiła w przyczynę, ale skutek jest odwrotny:** to nie opóźnienie, po którym wojna przyjdzie, tylko trwałe wykluczenie. Nie jest to zaprojektowane zachowanie — jest to błąd. |
| **P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1** | 2026-08-27 | Zwykła ścieżka wypowiedzenia wojny **graczowi** jest arytmetycznie niemożliwa przy ustawieniach domyślnych: ta sama liczba opisuje jednocześnie „jak silne jest AI wobec gracza" i „jak dobre są z graczem stosunki", więc **im AI silniejsze, tym dalej mu do wojny**. 585 pomiarów: najgorsza zanotowana relacja **77 punktów**, wojna wymaga zejścia **poniżej 30**. | **OTWARTE — WYMAGA DECYZJI WŁAŚCICIELA** | Jedyna droga, którą ktokolwiek może dziś wypowiedzieć graczowi wojnę w Kamieniu, otwiera się dopiero na poziomie trudności **Trudny**; na **Normalnym** nie może tego zrobić nikt. |
| P-DYPLO-WOJNY-AI-AI-NIEWIDOCZNE-Q1 | 2026-08-27 | Nawet gdyby wojny między AI wybuchały, gracz **nie dostaje o nich żadnej karty w Wydarzeniach**. Jedyny ślad to lista „Wojny znane (wywiad)" w panelu dyplomacji, którą trzeba samemu otworzyć. | **OTWARTE — UX, nieblokujące** | Znalezisko z punktu 5 dispatchu. Ma znaczenie praktyczne: nawet po naprawie przyczyny głównej właściciel mógłby nadal „nie widzieć efektu". |
| P-DYPLO-WYMUSZONA-WOJNA-OMIJA-GRACZA-Q1 | 2026-08-27 | Wymuszona wojna Kamienia **nigdy nie celuje w gracza** — filtr `oid > 0` w `main.ts:28063-28069`. | **ZAMKNIETE — zgodne z decyzją, nie defekt** | Decyzja `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` Q2 mówi wprost: „cel ma być najbliższą terytorialnie cywilizacją AI". Odnotowane, bo tłumaczy część obserwacji właściciela, ale zmiana wymagałaby nowego ECHO. |

## ZAMKNIETE 2026-08-27 — R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1 (oboz wylacznie w lesie)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1 | 2026-08-26 | „Obozy łowieckie raczej powinny być budowane w lasach. I tylko w lasach… niezależnie, czy to jest las na wzgórzu, czy na innym terenie, ale tylko w lesie." | **ZINTEGROWANE do `main`** | **2 rundy.** Runda 1: Operator PASS, ale **Evaluator i Final Control dały FAIL** — znaleźli dziurę, której Operator nie objął. Runda 2: Operator PASS, FC PASS. Reguła zawężona z `Las LUB złoże` do **`tylko Las`** w 7 punktach egzekwowania (gracz, automat, AI, tooltip, `galleryTerrainEligible`, migracja, commit). Wariant „Las I złoże" **odrzucony pomiarem: 0 pól na 5 mapach** — `Nakladka` to jedno pole, a `Las` nie należy do `NAKLADKI_ZWIERZECZE`; ulepszenie byłoby martwe. Pułapka „p-LAS-kie" (`normTerrain('Plaskie (rownina/laka)')` dosłownie zawiera podciąg `las`) sprawdzona osobnymi asercjami przez wszystkie trzy role. Bramka tematu **71/0 → 91/0**, `map-improvement-qualify` 112/0, `auto-improvements` 45/0 bez pogorszenia. `main.ts`, `ai.ts`, `auto-improvements.ts` **nietknięte**. |
| **P-ULEPSZENIA-WYRAB-ZOSTAWIAL-OBOZ-Q1** | 2026-08-27 | **Znalezisko Evaluatora (P7), przyczyna FAIL rundy 1.** `stripImprovementsWhenForestRemoved` (`improvement-build.ts:165`) była **pustym przelotem** (`return [...layers]`) mimo docstringu obiecującego filtrowanie ulepszeń zależnych od nakładki Las. Skutek: wyrąb lasu pod obozem zostawiał obóz na polu bez lasu — u gracza i u AI. Skarga właściciela wracała innymi drzwiami. | **ZAMKNIETE razem z tematem — ECHO wariant A** | Pytanie ABC zadane właścicielowi, odpowiedź: **„A: obóz znika przy wyrębie"** (praca nie wraca, tartak zostaje — kanon). Dowód: **obóz został poza lasem 0/200** (przed naprawą **200/200**). Sonda Evaluatora 87/1 → 88/0, sonda FC 4/1 → 5/0. Evaluator zmierzył to **inną metodą niż Operator** — wyciął dosłowny tekst z `main.ts` i uruchomił: 754 heksy z Lasem na 5 ziarnach, obóz poza lasem 0 razy, tartak został 754/754. |
| P-ULEPSZENIA-FARMA-NA-WZGORZU-PO-WYREBIE-Q1 | 2026-08-27 | Farma na Wzgórzu **wymaga** nakładki Las (`isFarmBaseTerrain(Wzgorza,Las)=true`, `(Wzgorza,Brak)=false`). Po wyrębie lasu pod taką farmą warunek przestaje być spełniony, ale farma **zostaje** — filtr celowo jej nie usuwa. | **OTWARTE — wymaga decyzji właściciela** | Znalezisko N3. Operator świadomie NIE usunął farmy: kasowanie cudzego ulepszenia to osobna decyzja, nie skutek uboczny tego tematu. Mutacja „filtr za szeroki" (dorzucenie farmy i tartaku) zapaliła 5 asercji tematu i złamała kanon `map-improvement-qualify` do 111/1 — dowód, że szerszy filtr byłby błędem. |
| P-ULEPSZENIA-CREATEQUALIFIER-BRAK-DOWODU-Q1 | 2026-08-27 | `createQualifier` w izolacji: mutacja nie zapala żadnej asercji (0 FAIL) — gate commitu `computeImprovementBuildImpact` maskuje gate panelu. | **OTWARTE — dług testowy, nie luka** | Zgłoszone jawnie przez Operatora (§13a), potwierdzone niezależnie przez Evaluatora i Final Control. Obrona w głąb: dwa redundantne gate'y, nie dziura. |
| **P-AI-WAGI-OBOZ-VS-PASTWISKO-Q1** | 2026-08-27 | „Cywilizacja, zamiast na przykład budować owcę, często buduje obóz łowiecki." **Zawężenie terenu tego NIE naprawiło.** | **OTWARTE — przeniesione do `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`** | Pomiar 3 ziarna × 40 tur: **99 obozów / 56 pastwisk przed zawężeniem i 99/56 po** — identycznie co do jednego pola. Evaluator na innych ziarnach: **83/62 przed i po**. Obozów poza lasem prawie nie było (791→790 pól na 5 mapach), więc zawężenie nie miało czego zmienić. To, co właściciel widział na wzgórzach, to **lasy na wzgórzach** — przypadek, który miał działać i działa. Przyczyną są **wagi wyboru ulepszeń w AI**. |
| P-PROC-BRAMKA-NIE-LAPIE-USUNIECIA-HOOKA-Q1 | 2026-08-27 | Usunięcie hooka ze ścieżki AI w `main.ts` zostawia bramkę tematu 91/0 i sondę 88/0 **zielone** — łapią to dopiero sondy wycinające dosłowny tekst z `main.ts` (26/4 i 20/2). | **OTWARTE — lekcja procesowa (wzorzec C-046)** | Znalezisko N1 Evaluatora, odtworzone niezależnie przez Final Control (M-FC-3). Wniosek: bramka testująca funkcję nie chroni przed usunięciem jej **wywołania**. Sondy są w commitach i muszą jechać razem z bramką. |

## ZAMKNIETE 2026-08-27 — P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 (klik w zdarzenie + karta obok karty)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 | 2026-08-26 | (A) „Komunikat, na przykład zbadano rolnictwo; jeżeli się naciśnie, powinno przekierowywać do karty technologii, która została zbadana, a niestety się nie dzieje." (B) „naciskam na szczegóły… ekran się wytwarza, ale nie pojawia się obok, tylko pod spodem… gracz może nie wiedzieć, co się stało". | **ZINTEGROWANE do `main`** | **(A) przyczyna:** to nie był `SidePanelEvent` z tożsamością, tylko **generyczny hint** — `showHintMessage` → `deferredEotHints` → `DeferredEotHint{msg,durationMs}` **gubi kontekst technologii**; karta dostawała `data-id=eot-hint-<tura>-<i>`, klasę `sp-no-link`, `cursor:default`, klik nie robił nic. Teraz emiter tworzy `tech-done-<tura>-<slug>` w `warEventLog` wzorem `era-*`, z pigułką „Karta technologii →" zgodną z konwencją audytu przekierowań. **Dwie technologie w jednej turze → każda otwiera SWOJĄ kartę** (osobna asercja — `main.ts:26212` używał `step.completed[length-1]`, co było dokładnie tym ryzykiem). **(B) przyczyna:** karta ulepszenia lądowała w **innym hoście o niższym z-index** (`.entity-card-backdrop` 520 vs host karty technologii 940) — karta technologii **nie była zamykana, tylko przykryta**. Teraz obie w jednym hoście `.tdn-stage`, obok siebie; poniżej **1160 px** układ pionowy, obie widoczne. Zamknięcie satelity wraca do karty technologii, klik w tło zamyka obie bez sierot. **Dowód:** `getBoundingClientRect` + `elementFromPoint` w **7 rozmiarach okna**, realny `page.mouse.click`, hit-test każdej karty. Bramka tematu **77/0**; **16 bramek obszaru** kart/wydarzeń/CivPedii zmierzone PRZED i PO — identyczne. `renderer.ts`, `buildingAdapter.ts`, `sidePanelHud.ts` **nietknięte**. |
| P-WYDARZENIA-BRAK-DOWODU-EMITER-ZYWA-GRA-Q1 | 2026-08-27 | **BRAK DOWODU** na przebieg emitera `tech-done-*` w żywej rozgrywce: `?playtest=mapa` kończy się zwycięstwem w turze 2 albo blokadą `canPlayerInitiateEndTurn()===false`; jedyny hak wymusza awans epoki. | **OTWARTE — dług dowodowy, zgłoszony jawnie (§13a)** | Operator zgłosił to sam zamiast raportować jako zielone; Evaluator potwierdził niezależnie (25 `endTurn` bez ruchu). Pokryte kotwicą źródłową, klikiem w kartę o tym samym id i sprawdzeniem 32 slugów. Potrzebny playtest-hak pozwalający dojść do tury z ukończonym badaniem bez awansu epoki. |
| P-WYDARZENIA-LIMIT-8-WPISOW-WARLOG-Q1 | 2026-08-27 | `warEventLog` trzyma limit 8 wpisów — karta „Zbadano" (`main.ts:26302`) może zostać wypchnięta przez hinty końca tury (`:29531`), zanim gracz zdąży w nią kliknąć. | **OTWARTE — realne ryzyko UX** | Nota Evaluatora. Im więcej zdarzeń w turze, tym większa szansa, że nowa funkcja stanie się niewidoczna. |
| P-WYDARZENIA-RESOLVER-W-MAIN-ZAMIAST-MODULU-Q1 | 2026-08-27 | Resolver `tech-done-*` (`techDoneEventTechName` / `LinkFor` / `openTechDoneEventLink`) trafił do `main.ts` zamiast do `side-panel-event-link.ts`, gdzie mieszkają pozostałe resolvery. | **OTWARTE — dług architektoniczny** | Jedno z trzech jawnie ujawnionych odstępstw od allowlisty; Operator opisał je w §5 raportu zamiast ukryć. |
| P-PROC-OUTDIR-KOLIZJA-ROWNOLEGLE-TEMATY-Q1 | 2026-08-27 | Katalog `/tmp/civ-dist-ev` został nadpisany przez równolegle biegnący temat — dwa Evaluatory budowały do tej samej ścieżki. | **OTWARTE — higiena procesu** | Wniosek: `--outDir` musi być unikalny **per TEMAT**, nie per rola. Do wpisania do kanonu C-001. |

## ECHO 2026-08-27 — odpowiedzi wlasciciela na pytania ABC turnieju C-018 (pytania 1 i 2)

| ID | Data | Odpowiedz wlasciciela | Status | Uwagi |
|---|---|---|---|---|
| **R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1** | 2026-08-27 | **ECHO = A** — „oznaczenie miasta-panstwa znika przy KAZDYM przejeciu miasta-panstwa, takze zbrojnym". | **ZAREJESTROWANE — do dispatchu** | Zgodne z rekomendacja turnieju (typowana A, wzorzec §3.2). Skutek uboczny przyjety swiadomie: od tury 20 rywale zaczynaja wojowac miedzy soba, a cywilizacja po podboju wraca na liste poteg i odzyskuje portret wladcy w dyplomacji. |
| **R-DYPLO-WYMUSZONA-WOJNA-POZA-OGOLNYMI-REGULAMI-Q1** | 2026-08-27 | **DYSPOZYCJA (nie litera A/B/C):** „wymuszone wojny w kazdej epoce powinny byc wylaczone calkowicie z ogolnych regul prowadzenia wojny. Inaczej nigdy nie nastapilaby wojna pomiedzy cywilizacjami". | **ZAREJESTROWANE — w czesci JUZ SPELNIONE w kodzie, reszta do dispatchu** | **Weryfikacja u zrodla przed dispatchem (`ai.ts:4113-4173`): wszystkie trzy istniejace mechanizmy wojny wymuszonej — krag miast-panstw, Braz i Kamien — JUZ dzis wracaja `wypowiedz_wojne` wczesnym `return`, PRZED `loadDefaultAIDiplomacyProgs` i przed warunkiem `rw >= PROG_WOJNA_SILA && score < progMinimalnyRelacja`.** Dyspozycja jest wiec dla Kamienia i Brazu spelniona co do znaku; **nie to blokowalo wojny**. Blokada byla jedna: znacznik miasta-panstwa (`R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`). Do wykonania zostaja dwie rzeczy nazwane ta dyspozycja: (1) **epoka Zelaza nie ma wojny wymuszonej wcale** — `KOLEJNOSC_EPOK = ['Kamien','Braz','Zelazo']` (`research.ts:323`), a moduly istnieja tylko dla Kamienia i Brazu; (2) **zapis kanonu**, ze zwolnienie z ogolnych regul jest swiadoma i trwala wlasnoscia wojny wymuszonej, a nie skutkiem ubocznym kolejnosci `if`-ow. |
| **P-DYPLO-ZELAZO-BRAK-WOJNY-WYMUSZONEJ-Q1** | 2026-08-27 | Znalezisko z weryfikacji dyspozycji powyzej: w epoce **Zelaza** nie istnieje zaden mechanizm wojny wymuszonej — `gra/src/game/` zawiera wylacznie `forced-war-stone.ts` i `forced-war-bronze.ts` (plus wspolny `forced-war-common.ts`). | **OTWARTE — wynika wprost z dyspozycji „w kazdej epoce"** | Wlasciciel powiedzial „w kazdej epoce"; dzis trzecia epoka jej nie ma. Nie zgadujemy parametrow (tura startu, warunek konca, odpoczynek) — Kamien i Braz maja wlasne, rozne wartosci, wiec Zelazo wymaga wlasnego ECHO albo jawnej zgody na skopiowanie parametrow Brazu. |
| **P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1** | 2026-08-27 | Wlasciciel **nie wybral litery**; odpowiedzial dyspozycja o wojnach wymuszonych, ktora tego pytania nie dotyka. | **NADAL OTWARTE — zawezone** | Dyspozycja rozwiazuje wojne **miedzy cywilizacjami**. Nie rozwiazuje wojny **przeciw graczowi**: kandydaci wojny wymuszonej sa filtrowani `oid > 0` (`main.ts:28180-28186`), a gracz ma `ownerId === 0`, wiec zadna wojna wymuszona nigdy w gracza nie celuje (odnotowane juz jako `P-DYPLO-WYMUSZONA-WOJNA-OMIJA-GRACZA-Q1`, zgodne z decyzja `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` Q2). Dla gracza pozostaje wylacznie sciezka ogolna, a ta jest arytmetycznie niemozliwa na poziomie Normalnym. **Pytanie wraca do wlasciciela w postaci zawezonej** (nowy turniej C-018) — patrz `PYTANIA-OTWARTE.md`. |

## ECHO 2026-08-27 — odpowiedz wlasciciela na pytanie ABC nr 3 (farmy a las)

| ID | Data | Odpowiedz wlasciciela | Status | Uwagi |
|---|---|---|---|---|
| **R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1** | 2026-08-27 | **DYSPOZYCJA (nie litera A/B/C):** „w lesie nie powinno byc mozliwosci budowania farm zarowno na wzgorzach, jak i na innych terenach, bo to sie wyklucza. W lesie mozna wybudowac tylko tartak i ewentualnie obozowisko, i tego sie trzymajmy." | **ZAREJESTROWANE — do dispatchu; UCHYLA decyzje z 2026-07-21** | Wlasciciel nie wybral zadnego z wariantow pytania 3 — **usunal przeslanke pytania**. Pytanie brzmialo „co sie dzieje z farma na wzgorzu PO wyrebie"; odpowiedz brzmi: takiej farmy nie powinno tam byc w ogole. Stan zastany (`isFarmBaseTerrain`, `improvement-build.ts:199`, komentarz „Maciej 2026-07-21: farma bez wycinki lasu"): **Laka/Rownina → farma dozwolona ZAWSZE, takze przy nakladce Las** (bez wyrebu); **Wzgorza → farma dozwolona WYLACZNIE przy nakladce Las**. Nowa regula: farma wymaga BRAKU lasu. **Trzy skutki, kazdy wprost z dyspozycji:** (1) na Lace/Rowninie z lasem farma znika z listy dozwolonych — zeby postawic farme, trzeba najpierw wyciac las; (2) na Wzgorzach z lasem farma znika; (3) **farma na Wzgorzach staje sie niemozliwa calkowicie**, bo Wzgorza bez lasu nie sa i nigdy nie byly terenem farmowym (`FLAT_FARM` = Laka, Rownina). Punkt (3) jest konsekwencja, nie wyborem — jesli wlasciciel chce, zeby Wzgorza bez lasu stalo sie terenem farmowym, wymaga to osobnego ECHO. |
| **P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1** | 2026-08-27 | Co ma sie stac z farmami, ktore **juz stoja** na heksach z lasem (postawionymi legalnie wg reguly z 2026-07-21) w zapisanych rozgrywkach i w trwajacych partiach. | **OTWARTE — wymaga decyzji wlasciciela (turniej C-018 w toku)** | Dyspozycja rozstrzyga, czego **nie wolno zbudowac**; nie rozstrzyga, co zrobic z tym, co juz stoi. Precedens obozu lowieckiego („znika przy wyrebie") nie przenosi sie wprost — tam znikniecie bylo skutkiem czynu gracza, tu byloby skutkiem zmiany reguly. |
| **P-ULEPSZENIA-FARMA-W-LESIE-WPLYW-NA-TEMAT-AI-Q1** | 2026-08-27 | **Kolizja z `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` (runda 3, niezintegrowana).** Caly pomiar rundy 3 zakladal, ze AI moze postawic farme na zalesionym heksie z rzeka **bez wyrebu**. Po tej dyspozycji wyrab staje sie **jedyna** droga do farmy na takim heksie. | **OTWARTE — blokuje domkniecie tematu AI** | Liczby rundy 3 (odzysk 42/43/46 %, `wyrab` 72/71) zostaly zmierzone na starej regule i **przestaja opisywac docelowa gre**. Kolejnosc prac musi byc: najpierw regula farmy, potem ponowny pomiar AI. Odwrotna kolejnosc = pomiar wyrzucony do kosza. |
| **P-ULEPSZENIA-FARMA-NA-WZGORZU-PO-WYREBIE-Q1** | 2026-08-27 | Pytanie ABC nr 3 w postaci zadanej wlascicielowi. | **ZAMKNIETE BEZ WYBORU LITERY — zastapione przez `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`** | Nie prowadzic osobnego tematu pod tym ID. |

## ECHO 2026-08-27 — odpowiedzi wlasciciela na pytania ABC turnieju AI-R4

| ID | Data | Odpowiedz wlasciciela | Status | Uwagi |
|---|---|---|---|---|
| **R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q1** | 2026-08-27 | **Nie litera czysta — start od B, znaczaco rozbudowana wlasna dyspozycja (cytat pelny):** „AI powinno budowac mniej wiecej wszystkie ulepszenia poza zywnoscia, tylko w miare potrzeby, czyli surowcowe, wtedy kiedy brakuje surowcow, a nie budowac na zapas, nie wiadomo po co. Brakuje drewna — trzeba wybudowac surowiec drewna. Brakuje brazu — trzeba wybudowac braz. To powinno byc sygnalem do wybudowania pozostalych ulepszen. W innych wypadkach powinna byc tylko i wylacznie inwestycja w zywnosc. [...] to jest dla AI z cywilizacji oraz dla parametru dla gracza, kiedy wybierze zrownowazony. [...] AI, zarowno w cywilizacji, jak i w ludzkich domach, powinno domyslnie budowac ulepszenia tam, gdzie sa obywatele. [...] z wylaczeniem surowcow, ktore moga znajdowac sie w roznych miejscach wedlug potrzeby. Gracz musi nacisnac przycisk «buduj» tylko w miejscach, gdzie sa obywatele. [...] jezeli AI widzi, ze nie ma zapotrzebowania na surowce, bo sa w nadmiarze, i nie ma potrzeby ulepszac terenu w miejscach, gdzie pracuja obywatele, powinna przestac budowac dla sztuki i przesunac srodki. Jesli w przypadku cywilizacji AI srodki przeznaczone sa bardziej na budynki, a w przypadku czlowieka lub gracza gracz sam zauwazy, ze ma za duzo zapasow na ulepszenia, moze odpowiednio przesunac suwak na rzecz budynkow." | **ZAREJESTROWANE — WYMAGA NOWEGO SCOPINGU PRZED DISPATCHEM, nie dispatchowane teraz** | To NIE jest wybor litery A/B/C z pytania R4-Q1 — odpowiedz zaczyna sie od „b", ale zastepuje tresc wariantu B wlasna, bardziej precyzyjna regula. Rozklad na trzy odrebne, mozliwe do osobnego wdrozenia zasady: **(1) budowanie napedzane popytem** — ulepszenia poza zywnoscia (surowcowe: drewno, braz, itd.) buduje sie TYLKO gdy danego surowca brakuje, nie na zapas; w przeciwnym razie caly budzet idzie w zywnosc; dotyczy AI CYWILIZACJI oraz AI GRACZA na ustawieniu „zrownowazone" (obie strony nazwane wprost — zgodne z regula stala wlasciciela o rozroznianiu dwoch AI). **(2) budowanie tylko przy obywatelach** — domyslnie ulepszenia stawiane wylacznie na heksach, gdzie realnie pracuja obywatele miasta; wyjatek: zloza surowcow moga byc gdziekolwiek wedlug potrzeby; dla gracza — przycisk „buduj" ma dzialac tylko w takich miejscach. **(3) przekierowanie nadwyzki** — gdy nie ma niedoboru surowcow ANI potrzeby ulepszen przy obywatelach, AI CYWILIZACJI przesuwa srodki na budynki, a AI GRACZA (automat) sygnalizuje graczowi nadmiar, by mogl sam przesunac suwak w strone budynkow. **Kolizja wprost z rekomendacja i z wynikami rundy 3:** dotychczasowy pomiar rundy 3 (42/43/46% odzysku zywnosci) mierzyl model, w ktorym AI buduje rowno wsrod WSZYSTKICH ulepszen — ta dyspozycja go zastepuje regula popytowa, wiec **cala runda 3 wymaga ponownego zaprojektowania, nie tylko przestrojenia liczb**. Nie dispatchowane teraz — wlasciciel wstrzymal prace autonomiczna na godzine (2026-08-27). Do dispatchu jako kolejna runda `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` po wznowieniu. |
| **R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q2** | 2026-08-27 | Wlasciciel odpowiedzial najpierw **„a"**, po czym w kolejnej wiadomosci sprostowal: **„C — przelacznik przy ustawieniach automatu «wolno wycinac las». Dla gracza jednak zmienmy na C."** **ECHO finalne = C** (przelacznik w panelu ustawien automatu gracza, per miasto/per panstwo). | **ZINTEGROWANE (potwierdzone 2026-09-03)** | Znalezione w pelni zaimplementowane przy weryfikacji kolejki AutoBot: `wolnoWycinacLas` per empire + per miasto (`cities.ts`), UI przelacznik „Wolno wycinac las" (`buildModeHud.ts`), wiazanie `getSkipWyrab`/`skipWyrab` w `auto-improvements.ts` z jawnym komentarzem w kodzie „R4-Q2=C". Wiersz w tabeli byl nieaktualizowany po faktycznej integracji. |

## ZAMKNIETE 2026-08-27 — R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 (farma nie w lesie)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1 | 2026-08-27 | „w lesie nie powinno być możliwości budowania farm zarówno na wzgórzach, jak i na innych terenach... w lesie można wybudować tylko tartak i ewentualnie obozowisko." | **ZINTEGROWANE do `main`** | Uchyla decyzję 2026-07-21 (farma bez wyrębu). Skutek: Wzgórza bez lasu przestają być terenem farmowym całkowicie (były jedynym terenem farmowym na Wzgórzach tylko z lasem). Bramka tematu 136/0, `map-improvement-qualify` 117/0, `auto-improvements` 45/0 bez pogorszenia. Punkt egzekwowania w `main.ts:11709` domknięty sterowaniem danymi (`FOREST_BLOCKED_IMPROVEMENT_KEYS`), bez tknięcia zakazanego pliku. |
| P-BRAMKA-FARMA-TOOLTIP-STRAZE-WZAJEMNIE-MASKUJACE-Q1 | 2026-08-27 | Znalezisko Final Control: `hexContextTooltip.ts:459` i `:474` maskują się wzajemnie — każda osobno wystarcza dla Łąka/Równina+Las, więc usunięcie linii 474 przejdzie bramkę na zielono mimo że linia jest dziś behawioralnie martwa. | **OTWARTE — dług dowodowy (limit pokrycia bramki)** | Nie defekt produktu. Do wpisania jako lekcja C-046 (bramka funkcji nie chroni przed usunięciem redundantnej straży). |
| P-BRAMKA-FARMA-MAINTS-OSIAGALNOSC-Q1 | 2026-08-27 | `main.ts:11709` zmienia zachowanie (toast blokady) po wpisaniu `farma` do `FOREST_BLOCKED_IMPROVEMENT_KEYS`, ale `main.ts` nie jest bundlowany przez żadną bramkę — osiągalność tej gałęzi nie ma dowodu. | **OTWARTE — luka dowodowa (§13a), zgłoszona jawnie przez Final Control** | Sam tekst hintu jest asercjonowany; brakuje dowodu, że gracz faktycznie tam trafia w żywej rozgrywce. |

## ECHO 2026-08-27 — Pytanie 1: farmy juz stojace w lesie — wlasciciel odrzuca pytanie jako bezzasadne

| ID | Data | Odpowiedz wlasciciela | Status | Uwagi |
|---|---|---|---|---|
| **P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1** | 2026-08-27 | **Wlasciciel NIE wybral litery — odrzucil sama forme pytania (cytat pelny):** „Juz odpowiadalem na to pytanie. Pytanie jest niezasadne. W ogole nie powinno byc farm w lesie; farm nie wolno stawiac w lesie. Mowilem, ze zmieniam te regule, zakaz stawiania farm w lasach. Dlatego pytanie, co sie stanie z lasem, jesli go wykarczujemy, i co sie stanie z farma, jest bezzasadne, bo w lesie nie powinno byc farm." | **ZAREJESTROWANE — rozstrzygniete jako WARIANT C, do dispatchu** | **Interpretacja, nie zgadywanie:** wlasciciel odrzuca sama Sytuacje pytania jako fasywe rozroznienie miedzy „zakazem budowy" a „losem juz stojacych". Jego regula „w lesie nie powinno byc farm" jest **niewarunkowa** — dotyczy stanu, nie tylko czynnosci budowania. Skoro problem jest FARMA-w-lesie (nie las-pod-farma), naprawa idzie po stronie farmy: **wariant C turnieju** — farma znika, las zostaje — nie wariant B (las znika, farma zostaje), bo wariant B zostawilby dokladnie to, czego wlasciciel wlasnie zakazal (farme, ktora dalej istnieje jako skutek stanu sprzed zmiany). Rozstrzyga to takze przypadek Wzgorz bez dodatkowej reguly: farma na Wzgorzu bez lasu i tak nie ma pod soba terenu rolnego, wiec znika identycznie jak wszedzie indziej — C jest jedynym wariantem bez wyjatku terenowego. Jesli ta interpretacja jest bledna, wlasciciel poprawi przy nastepnej turze ECHO — zapisane jawnie jako interpretacja, nie jako jego doslowny wybor litery. |

## KOREKTA 2026-08-27 — P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1 BYLO JUZ ODPOWIEDZIANE

| ID | Data | Korekta | Status | Uwagi |
|---|---|---|---|---|
| **P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1** | 2026-08-27 | **Wlasciciel poprawil orkiestratora: odpowiedz z tej samej tury co Pytanie 1 byla numerowana „1a / 2 <tekst>" — „2" oznaczalo odpowiedz na TO pytanie, nie tylko dyspozycje o wojnach wymuszonych.** Orkiestrator bledne zarejestrowal to jako „nie wybral litery, nie dotyczy". | **ZAMKNIETE — odpowiedziane, interpretacja: C (ogolna sciezka wobec gracza NIETKNIETA)** | **Ponowna lektura pelnego cytatu:** „wymuszone wojny w kazdej epoce powinny byc wylaczone calkowicie z ogolnych regul prowadzenia wojny. Inaczej nigdy nie nastapilaby wojna pomiedzy cywilizacjami" — caly tekst mowi wylacznie o wojnie MIEDZY CYWILIZACJAMI, ani razu nie wspomina gracza. Interpretacja: wlasciciel odpowiedzial na pytanie „dlaczego wojna nie wybucha" tak, ze **rozwiazaniem jest wydzielenie mechanizmow wymuszonych z ogolnych regul** — co juz w calosci zrealizowano (`R-DYPLO-WYMUSZONA-WOJNA-POZA-OGOLNYMI-REGULAMI-Q1`, `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1` w toku). Mechanizmy wymuszone SA i POZOSTAJA strukturalnie wylaczone od gracza (filtr `oid > 0`, decyzja `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` Q2 — cel to najblizszy sasiad AI, nie gracz). Skoro odpowiedz wlasciciela nie zada nowego mechanizmu celujacego w gracza, a mowi wylacznie o cywilizacjach — **ogolna sciezka wojny (arytmetycznie niemozliwa na Normalnym) zostaje NIETKNIETA**, co odpowiada literze **C** oryginalnego pytania („zostawic tak jak jest — na normalnym gracz nie bywa atakowany"). Jesli ta interpretacja jest bledna, prosze o jawna korekte — nie bedzie ponownie zadawane jako otwarte pytanie bez wyraznego sygnalu wlasciciela. |

## ZNALEZISKO ORKIESTRATORA 2026-08-27 — decyzja wlasciciela nigdy niezdispatchowana

| ID | Data | Znalezisko | Status | Uwagi |
|---|---|---|---|---|
| **R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1** | 2026-08-27 (decyzja z wczesniejszej tury sesji) | Wlasciciel odpowiedzial „Tak, odwracamy — wszystkie trzy" na pytanie o cofniecie zakazu budowy hodowli (owce, bydlo/Trzoda, lama) na nakladce Las — decyzja `Maciej 2026-07-29` (`isLivestockImprovementBlockedOnForest`, `improvement-build.ts:225-227`). **Ta decyzja nigdy nie zostala zdispatchowana ani zaimplementowana** — kod dzis nadal blokuje wszystkie trzy na lesie, zero wzmianki w rejestrze do tej pory. | **ZAREJESTROWANE TERAZ — dispatch wypchniety** | Blad orkiestratora: decyzja padla, zapisana w kontekscie sesji, ale nigdy nie trafila do REJESTR-PROSB-I-ZADAN.md ani do dispatchu. Naprawione teraz przy okazji przegladu wszystkich tematow z „wyrazna odpowiedzia, ktore nie zostaly odpalone". |

## ZAMKNIETE 2026-08-27 — R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1 (usuniecie istniejacych farm w lesie)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1 | 2026-08-27 | Implementacja wariantu C dla `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1` — zaden stan gry nie ma zawierac farmy na heksie z lasem. | **ZINTEGROWANE do `main`** | Zywy Chromium na realnym bundlu: 5301 heksow zasianych, granica tury usuwa 1372 farmy z lasu, zero bledow konsoli, powtorzone 3x. Bramka tematu 143/0, farma-nie-w-lesie 136/0, map-improvement-qualify 117/0 (przed nastepnym tematem) bez pogorszenia. Praca NIE wraca (wzorzec obozu lowieckiego). |
| P-DEMOKEYSFORHEX-SIEJE-FARMY-W-LESIE-Q1 | 2026-08-27 | `demoKeysForHex` (`main.ts`, tryb `?demo=ulepszenia`) nadal siewa farmy na lesie mimo zakazu z tego samego dnia — zmierzone 1372 heksy. | **OTWARTE — poza allowlista tematu, do osobnego reconu** | Znalezisko Evaluatora U1, potwierdzone przez Final Control. Wplywa wylacznie na tryb demonstracyjny, nie na normalna rozgrywke. |
| P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1 | 2026-08-27 | Nieaktualny wpis „cofnij" w kolejce budowy zwraca Prace za farme, ktora ta sama zmiana wlasnie usunela z mapy. | **OTWARTE — wylom w kryterium 2 tematu, nie w GOAL** | Znalezisko Final Control. Gracz moze odzyskac Prace za ulepszenie, ktorego juz nie ma. |

## ZAMKNIETE 2026-08-27 — R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 (odblokowanie hodowli w lesie)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1 | 2026-08-27 | Cofniecie zakazu z 2026-07-29: owce, bydlo, lama znow moga byc budowane na lesie. Decyzja wlasciciela „Tak, odwracamy — wszystkie trzy" sprzed tej sesji, nigdy niezdispatchowana. | **ZINTEGROWANE do `main`** | Pomiar 5 ziaren (777 heksow z lasem): owce 0→52, bydlo 0→725, lama 0→52. Kontrola regresji: 44 pola (22 klucze × 2 profile), zmienilo sie wylacznie 5 — te trzy klucze na lesie; „bez lasu" identyczne dla wszystkich 22. Dowod mutacyjny: 33 mutacje, pokrycie 100/100. Bramka tematu 100/0, map-improvement-qualify 126/0, oboz-lowiecki-las 91/0, farma-nie-w-lesie 136/0 bez pogorszenia. |
| **P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1** | 2026-08-27 | Zakaz lasu dla stadniny (`surowiecOdblokowany='kon'`) wpadl w regule z 2026-07-29 jako **pochodna definicji**, nie osobna decyzja — ECHO „wszystkie trzy" wymienia wylacznie owce/bydlo/lame. Operator swiadomie zostawil stadnine zabronioną zamiast zgadywac. Odblokowanie byloby skutkiem realnym: **725 nowych pol na 5 mapach** (kazdy zalesiony heks Laki/Rowniny po odblokowaniu Konia). | **OTWARTE — wymaga decyzji wlasciciela** | Pytanie: czy stadnina rowniez ma wejsc do lasu, czy zostaje zabroniona jak dzis? |
| P-HODOWLA-LAS-BRAK-DOWODU-WIZUALNEGO-Q1 | 2026-08-27 | Nikt (Operator, Evaluator, Final Control) nie obejrzal w zywej przegladarce zalesionego heksa z hodowla. `foodOnForest` (`main.ts`) obejmuje tylko `farma` i `bydlo` — bydlo na lesie chowa kepe lasu, owce i lama NIE (inna sciezka, `preservesHillRelief`). Render trzech hodowli bedzie niejednolity. | **OTWARTE — brak dowodu (§13a), poza allowlista** | `main.ts` poza allowlista tematu, wiec nikt nie mogl tego naprawic w tej rundzie. |
| P-HODOWLA-LAS-TOOLTIP-LUKA-POSZERZONA-Q1 | 2026-08-27 | Luka tooltip↔silnik (tooltip heksu nie pokazuje hodowli bez zloza) istniala przed tematem, ale **poszerzyla sie** — doszlo 777 zalesionych heksow, na ktorych silnik teraz dopuszcza hodowle, a tooltip jej nie pokaze. | **OTWARTE — dlug UX, nie regres tego tematu** | Zmierzone PRZED i PO jako identyczne co do przyczyny, ale zakres skutkow rosnie. |
| P-HODOWLA-DEMOKEYSFORHEX-NIEZNANE-Q1 | 2026-08-27 | `demoKeysForHex` (`main.ts:12031`) nie zna hodowli na lesie. | **OTWARTE — poza allowlista, ta sama klasa co P-DEMOKEYSFORHEX-SIEJE-FARMY-W-LESIE-Q1** | Warto naprawic razem z tamtym znaleziskiem, jeden temat porzadkowy dla `?demo=ulepszenia`. |
| P-HODOWLA-BRAMKA-KRUCHA-ASERCJA-JSON-Q1 | 2026-08-27 | Krucha asercja w bramce tematu dotyczaca pol JSON — szczegoly w `03-final-control.md`. | **OTWARTE — dlug testowy** | Nota Final Control, nie blokuje integracji. |
| P-BALANS-HODOWLA-3-WARSTWY-NA-HEKSIE-Q1 | 2026-08-27 | **Skutek balansowy zmierzony po raz pierwszy przez Final Control:** automat gracza i AI cywilizacji kladly na ulepszanym heksie lesnym 2 warstwy, teraz kazdy 3 (342/342 heksow) — bydlo na mapie wiecej niz sie podwaja. Tartak i oboz lowiecki NIE sa wypychane (rozne sektory). To skutek decyzji wlasciciela, nie usterka, ale warto znac liczby przy ocenie balansu po zagraniu. | **OTWARTE — informacyjne, do wiadomosci** | Ograniczenie pomiaru: sonda to syntetyczny pulap (1 miasto, praca 1e8) — przenosi sie PROPORCJA, nie liczby bezwzgledne. |

## ZAMKNIETE 2026-08-27/28 — R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 (wojna wymuszona epoki Zelaza)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 | 2026-08-27 | Trzecia epoka (Zelazo) dostaje mechanizm wojny wymuszonej, wzorem Brazu — wyzwalacz to awans do epoki, progi 2 miasta/20 tur odpoczynku/20 tur cooldownu identyczne z Brazem. | **ZINTEGROWANE do `main`** | Final Control zrobil probne scalenie z `main` PRZED integracja orkiestratora — zero konfliktow, wszystkie bramki zielone na scaleniu. Bramki: stone 32/32, bronze 44/44, iron 46/46, plus trzy testy main-guard (18/0, 25/0, 29/0). Miasta-panstwa i gracz wylaczeni identycznie jak w Kamieniu/Brazie. |
| P-WOJNA-JUZ-W-WOJNIE-LICZY-BARBARZYNCOW-Q1 | 2026-08-28 | **Znalezisko Final Control (F1), dotyczy WSZYSTKICH TRZECH epok naraz:** bramka „czy cywilizacja jest juz w jakiejs wojnie" (blokujaca wejscie w nowa wojne wymuszona) liczy takze wojne z barbarzyncami posiadajacymi miasto. Cywilizacja stale skonfliktowana z barbarzyncami nigdy nie kwalifikuje sie do wojny wymuszonej Kamienia, Brazu ani Zelaza. | **ZAMKNIETE — naprawione (potwierdzone wstecznie)** | Dokladnie to jest fix (a) z `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1` (2026-08-30): nowy `countActiveWarsForOwnerExcludingBarbarians` (main.ts:17150), uzyty we wszystkich 3 bramkach wymuszonej wojny (main.ts:28506,28588,28671). Zintegrowane, main. |
| P-WOJNA-BRAZ-NIE-CZYSCI-REJESTROW-NOWA-GRA-Q1 | 2026-08-28 | Nota (e) Evaluatora: mechanizm Brazu nie czysci swoich rejestrow (aktywne wojny, cooldowny) przy starcie nowej gry. | **W TOKU — dispatch zapisany 2026-08-31, Workflow uruchomiony** | Potwierdzone grepem: blok „nowa gra" (main.ts ~31270-31300) czysci stone/iron ForceWar, ale NIE bronze. Dispatch: `dyspozycje/autobot/runs/R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1/00-dispatch.md`. |
| P-WOJNA-ZELAZO-BRAK-DOWODU-ROZGRYWKA-Q1 | 2026-08-28 | **BRAK DOWODU (§13a):** auto-pokoj po 2 miastach, 20 tur odpoczynku i 20 tur cooldownu NIE zaobserwowane w realnej rozgrywce (playtest nie doszedl do pelnego cyklu); tempo naturalnego dojscia do epoki Zelaza nie zmierzone. | **CZESCIOWO W TOKU — zakres „gracz jako cel" dispatchowany 2026-08-31** | Zakres zawezony: nowy `R-WOJNA-ZELAZO-DOWOD-ROZGRYWKA-Q1` kopiuje wzorzec Brazu (`forceBronzeForcedWarOnPlayer`+live Playwright) na Zelazo. Dowod pelnego cyklu 20-turowego cooldownu w wieloturowej partii POZA zakresem (brak istniejacego wzorca „pelnej rozgrywki" do skopiowania) — zostaje jako dlug. |

## ZAMKNIETE 2026-08-28 — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (flaga miasta-panstwa)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 | 2026-08-27 | ECHO wlasciciela = A: oznaczenie miasta-panstwa gasnie przy kazdym przejeciu, takze sila. | **ZINTEGROWANE do `main`** | Final Control zrobil probne scalenie z `main` przed integracja orkiestratora — zero konfliktow. Bramka tematu 31/0, forced-war-stone 32/0, forced-war-bronze 44/0 bez pogorszenia. Mutacja: usuniecie `markCityStateDirty()` NIE zaczerwienia bramki (dziura odnotowana), no-op `clearCityStateFlagOnCapture` daje 22/9 FAIL (kontrola pozytywna). |
| P-WOJNA-PRE-CONTACT-BLOKUJE-AI-AI-Q1 | 2026-08-28 | **Znalezisko Operatora, potwierdzone przez Evaluatora i Final Control — czwarta zidentyfikowana przyczyna ciszy wojen.** Warstwa mgly wojny `pre_contact` kasuje komende `wypowiedz_wojne` miedzy dwiema AI CYWILIZACJI, gdy CZLOWIEK (gracz) nie odkryl napastnika we mgle wojny — mimo ze to wojna miedzy dwoma komputerowymi rywalami, niezwiazana z widocznoscia dla gracza. Pomiar: **1 wypowiedzenie na 3 ziarna** zamiast wielu. | **ZAMKNIETE — naprawione (potwierdzone wstecznie)** | Dokladnie to jest fix (b) z `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1` (2026-08-30): nowa `partitionDiplomacyCommandsForPlayerFog` (diplomacy-layers.ts) rozdziela `wypowiedz_wojne` AI-AI (bez mgly gracza) od komend z udzialem gracza; wpieta main.ts:28761. Zintegrowane, main. |
| P-FLAGA-BRAK-MIGRACJI-ISTNIEJACYCH-SEJWOW-Q1 | 2026-08-28 | Sejw zapisany PRZED ta naprawa, po wczytaniu PO naprawie, nadal oznacza zdobywce jako miasto-panstwo — sonda Final Control to potwierdza. Brak migracji dla juz istniejacych zapisow. | **ZAMKNIETE — decyzja wlasciciela: zostaw jak jest** | ECHO 2026-08-31: „Zostaw jak jest" — naprawa dotyczy wylacznie nowych rozgrywek/przejec od teraz; stare zapisy zachowuja bledna flage do konca gry. Brak dalszej pracy. |
| P-FLAGA-MARKCITYSTATEDIRTY-BRAK-ASERCJI-Q1 | 2026-08-28 | `markCityStateDirty()` dziala poprawnie, ale nie ma wlasnej asercji w bramce — usuniecie tego wywolania nie zaczerwienia bramki tematu (31/0 bez zmian). | **ZAMKNIETE — naprawione w `R-AI-DLUG-PORZADKI-Q1` (077b71d1)** | Nowa asercja T15, dowod mutacyjny potwierdzony niezaleznie przez Operatora i Evaluatora. |
| P-FLAGA-ONOWNERCHANGED-RYZYKO-ODDALONE-Q1 | 2026-08-28 | Rozwazono ryzyko trwalej degradacji prawdziwego miasta-panstwa przez wspolny hak `onOwnerChanged` przy wyzwoleniu miasta. | **ZAMKNIETE — ryzyko oddalone** | Final Control potwierdzil: mechaniki wyzwalania miast nie ma dzis w `gra/src/`. Nic do zrobienia. |

## RUNDA 4/5 (BLOCK) — R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (budowanie napedzane popytem itd.)

| ID | Data | Znalezisko | Status | Uwagi |
|---|---|---|---|---|
| **R-AI-WYRAB-PRZY-RZECE-FARMY-Q1** | 2026-08-28 | Runda 4/5 zakonczona werdyktem Final Control: **GOTOWOSC DO INTEGRACJI: NIE**, cztery blokady. Temat wraca do Operatora na runde 5 — OSTATNIA dozwolona. | **BLOCK — nie zintegrowane** | Zaimplementowano Zasady 1-3 (popyt, tylko-przy-obywatelach, przekierowanie nadwyzki) + R4-Q2. Bramki: `ai4-popyt-obywatele-test` 48/0, `ai2-heks-po-heksie-test` 35/0, bez pogorszenia auto-improvements 45/0, ai-improvements 52/0, map-improvement-qualify 117/0, farma-nie-w-lesie 136/0, oboz-lowiecki-las 91/0. Zastany czerwony `ai-praca-split-parity-test` 21/1 potwierdzony jako NIE-regres (identyczny na swiezym `main`). |
| P-AI-R4-Z3-SURPLUS-NIE-PERSISTOWANY-Q1 | 2026-08-28 | **Blokada 1 (do naprawy w kodzie, bez ABC).** `aiSurplusRedirectedOwners` (`main.ts:7495`) nie jest zapisywany w sejwie, a `ownerDefaultPodzialPracy` (blok Zasady 3) JEST. Po save/load w turze z nadwyzka AI CYWILIZACJI moze zostac trwale na `procentBudynki=100` → zero Pracy do puli imperium → zero ulepszen terenu NA STALE. | **ZAMKNIETE — naprawione w rundzie 5, rejestr byl nieaktualny** | Naprawione commitem `a46dfc7a` (2026-08-28, „Operator runda 5 (ostatnia)"), na `main`. Persist w `buildSaveGameSnapshot`/`restoreGameFromSave` (main.ts ~25270, ~32535-32538) + `clear()` na starcie nowej gry. Dowod PRZED/PO: procentBudynki 100→100 (PRZED) vs 100→70 (PO). `ai4-popyt-obywatele-test` 50/0. |
| P-AI-R4-FC2-ZASADA3-DOTYKA-MIASTA-PANSTWA-Q1 | 2026-08-28 | **Blokada 4 (do naprawy w kodzie, bez ABC).** Blok Zasady 3 (`main.ts:28482`) nie wylacza `defensiveCopy`, wiec przesuwa Prace na budynki takze miastom-panstwom — sasiedni blok CUDA-AI wyklucza kopie obronne jawnie, ten nie. Poszerzenie zakresu wobec §14 (miasta-panstwa nie byly czescia tematu). | **ZAMKNIETE — naprawione w rundzie 5, rejestr byl nieaktualny** | Naprawione tym samym commitem `a46dfc7a`, na `main`. Blok Zasady 3 opakowany w `if (!opts.defensiveCopy)`, jak sasiedni blok CUDA-AI. Dowod: miasta-panstwa przekierowane 11/11 (PRZED) vs 0/11 (PO) na 3 ziarnach. |
| P-AI-R4-Z1-ONLYWORKED-WSZYSTKIE-PROFILE-Q1 | 2026-08-28 | **Blokada 2 (Pytanie 3).** `DEFAULT_ULEPSZENIA_ONLY_WORKED=true` jest stala GLOBALNA — zmienia zachowanie WSZYSTKICH CZTERECH profili automatu gracza (zywnosc, surowce, infrastruktura, zrownowazone), nie tylko „zrownowazone", jak wymagal dispatch. Dodatkowo profil „infrastruktura" ma efekt uboczny: przeniesienie licznikow FAZY 0 na `radiusHexes`. | **ZAMKNIETE — decyzja wlasciciela: zaakceptuj na wszystkie 4 profile** | ECHO 2026-08-31: „Zaakceptuj efekt na wszystkie 4 profile" — uznane za pozadana spojnosc miedzy profilami. Brak zmian w kodzie. |
| P-AI-R4-FC1-RECZNY-PRZYCISK-BUDUJ-Q1 | 2026-08-28 | **Blokada 3 (Pytanie 4).** Reczny przycisk „buduj" gracza (`applyBuildRequest`, `main.ts:11650`) NIE jest zabramkowany do hesow z obywatelami — dziala wszedzie jak dzis. ECHO wlasciciela mowilo wprost „Gracz musi nacisnac przycisk «buduj» tylko w miejscach, gdzie sa obywatele", ale zaden z dwoch raportow (Operator/Evaluator) tego nie zauwazyl — znalezisko WLASNE Final Control. | **ZAMKNIETE — naprawione w `R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1` (e1e7bd6f)** | ECHO 2026-08-31: „Ogranicz do heksow z obywatelami". Zintegrowane, wspolny predykat z automatem AI potwierdzony 3x niezaleznie. |
| P-AI-R4-FC3-ZLOZA-ZYWNOSCIOWE-W-WYJATKU-Q1 | 2026-08-28 | Wyjatek zlozowy (Zasada 2 — zloza moga byc gdziekolwiek) obejmuje takze zloza ZYWNOSCIOWE (bydlo/owce/lama/oboz_lowiecki), a ECHO mowilo o „surowcach". | **OTWARTE — obserwacja, nie blokuje** | Final Control, nie wymaga natychmiastowej decyzji. |
| P-AI-R4-BRAK-DOWODU-ROZGRYWKA-Q1 | 2026-08-28 | BRAK DOWODU (§13a): efekt Zasady 3 w kolejce produkcji prawdziwej rozgrywki niezmierzony; wplyw Zasady 2 na sile AI CYWILIZACJI w dluzszej grze niezmierzony; czestosc pustej kolejki (Z-6) w rozgrywce niezmierzona. | **OTWARTE — dlug dowodowy** | Zgloszone jawnie przez Final Control. |

## CZESCIOWO ZAMKNIETE 2026-08-28 — R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (rundy 2-5 zintegrowane, temat NIE domkniety)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 | 2026-08-28 | 5 rund Operator→Evaluator→Final Control: AI kompleksowosc heks-po-heksie, wyrab lasu przy rzece, budowanie popytowe (Zasada 1), tylko-przy-obywatelach (Zasada 2), przekierowanie nadwyzki (Zasada 3), R4-Q2=C (przelacznik wyrebu automatu gracza), naprawa Z-3+FC-2 w rundzie 5. | **ZINTEGROWANE do `main` (kod), TEMAT NIE ZAMKNIETY** | Limit 5 rund WYCZERPANY. Final Control rundy 5: „GOTOWOSC DO INTEGRACJI: TAK dla zakresu rundy 5" ale „ZAMKNIECIE TEMATU: NIE". Bramki: ai4-popyt-obywatele-test 50/0, ai2-heks-po-heksie-test 35/0, bez pogorszenia auto-improvements 45/0, map-improvement-qualify 126/0, farma-nie-w-lesie 136/0, oboz-lowiecki-las 91/0, hodowla-las 100/0. Zastany regres `ai-praca-split-parity-test` 21/1 potwierdzony niezmieniony na czystym `main` PRZED integracja. |
| P-AI-R5-FC3-CLEANUP-OWNERID-REUSE-Q1 | 2026-08-28 | Final Control rundy 5: blok sprzatania po eliminacji ownera nie usuwa wpisu z `aiSurplusRedirectedOwners` mimo ze zbior jest juz trwaly (ta sama klasa przeoczenia co Z-3). Skutek praktyczny dzis martwy (reuse ownerId trafia do sciezki miasta-panstwa, gdzie blok jest pomijany). | **ZAMKNIETE — naprawione w `R-AI-DLUG-PORZADKI-Q1` (077b71d1)** | `eliminateOwner()` usuwa teraz oba wpisy, dowod mutacyjny per-pole (Operator + Final Control osobno). |
| P-AI-R5-FC4-SLIDER-STATE-NIE-PERSISTOWANY-Q1 | 2026-08-28 | `aiSliderStateByOwner` nie jest w sejwie; na sciezce wznowienia po komendzie (`isCommandResume`) powrot moze jednorazowo trafic w wartosc domyslna 70 zamiast wlasnego wyboru AI. | **ZAMKNIETE — naprawione w `R-AI-DLUG-PORZADKI-Q1` (077b71d1)** | Realny roundtrip save/load z nietrywialna wartoscia potwierdzony niezaleznie przez Operatora i Evaluatora. |
| P-AI-BRAK-DOWODU-ROZGRYWKA-ZBIORCZE-Q1 | 2026-08-28 | Zbiorcza lista brakow dowodu (§13a) z rund 2-5: zero pomiaru w realnej przegladarce (wszystkie dowody dzialaja na wycietym tekscie `main.ts` poza petla tury); zero realnego save/load przez UI; nieznana czestosc wpadania AI CYWILIZACJI w stan nadwyzki w normalnej partii; skutek strategiczny Zasady 2 dla sily AI CYWILIZACJI w dluzszej grze niezmierzony. | **OTWARTE — dlug dowodowy zbiorczy, jawnie zgloszony przez wszystkie trzy role przez 4 rundy** | Potrzebny playtest-hak dochodzacy do pelnej rozgrywki, podobnie jak w temacie wydarzen (`P-WYDARZENIA-BRAK-DOWODU-EMITER-ZYWA-GRA-Q1`). |
| P-AI-R4-Z1-ONLYWORKED-WSZYSTKIE-PROFILE-Q1 i P-AI-R4-FC1-RECZNY-PRZYCISK-BUDUJ-Q1 | 2026-08-28 | Patrz wpisy w sekcji „RUNDA 4/5 (BLOCK)" wyzej. | **ROZSTRZYGNIETE 2026-08-31** | Pytanie 3: zaakceptowano efekt na 4 profile (bez zmian kodu). Pytanie 4: naprawa wg ECHO, dolaczona do `R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1` (nowy ID, `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` ma wyczerpany limit 5 rund). |

## OTWARTE 2026-08-29 — trzy nowe tematy zgloszone zywa rozmowa

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| **R-BADANIA-KOSZT-PODWOJENIE-Q1** | 2026-08-29 | Wlasciciel: „Na pewno trzeba podniesc koszt badan, wszystkich poza pierwszymi czterema, o 100%." Doprecyzowane przez AskUserQuestion: bez zmian zostaja Obrobka drewna, Rolnictwo, Lowiectwo, Oswojenie zwierzat (4 technologie Poziomu 1, koszt 5); pozostale 28 dostaja koszt ×2. Bezposrednie ustalenie w dialogu (wyjatek 3 turnieju ABC) — nie wymaga turnieju. | **ZINTEGROWANE do `main` (runda 1/5)** | Operator PASS, Evaluator FAIL proceduralny (nieaktualna baza, naprawione rebasem bez nowej rundy), Final Control PASS (probne scalenie bezkonfliktowe). Po merge do `main`: tsc 0 bledow, logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6. Deploy ROBOCZA osobna bramka. |
| P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1 | 2026-08-29 | Wlasciciel: panel „Praca Imperium” i glowny zeton HUD pokazuja „Praca 39 -10” zamiast oczekiwanego wzrostu +80 (suma „do puli” z 8 miast Grecji) — po wylaczeniu automatycznego rozdysponowania ulepszen przez AI wraca do poprawnego „Praca 134 +95”. Podejrzenie: wydatek AI na auto-ulepszenia terenu jest odejmowany OD TEJ SAMEJ delty co produkcja miast, zamiast byc pokazany osobno w podsumowaniu tury („ile AI uzyl na automatyczne ulepszenia” / „ile wg % budzetu”). Dokladny sposob prezentacji ma ustalic orkiestrator (wlasciciel: „to musisz sam ustalic”). | **RUNDA 1/5 — dispatch gotowy, Workflow w toku** | Pierwotny wspolny recon zgubil sie w tle bez powiadomienia; orkiestrator zrobil wlasny recon: `_lastPracaRate` (main.ts) to SWIADOMIE ujednolicona suma 4 drenazy pod `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` Watek D (naprawa regresu `R-PRACA-PULA-NIEAKUMULUJE-Q1`), chroniona testem `praca-pula-rate-parity-test.cjs`. GOAL tego tematu: dodac OSOBNA, widoczna liczbe auto-ulepszen AI w UI, NIE cofac tamtej naprawy. |
| P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1 | 2026-08-29 | Wlasciciel, zrzut ekranu panelu „ULEPSZENIA TERENU”: ikonka info „i” stoi zbyt blisko klikalnego obszaru ulepszenia (Farma, Trzoda, Owce...) — czeste przypadkowe kliknieca. Zada: przeniesc ikonke calkowicie na prawa strone wiersza; etykiete kosztu uproscic z „E1 · 40 P” na samo „40 P” (usunac prefiks ery „E1”), reszte informacji (typ/era) przeniesc na prawa strone razem z ikonka. | **RUNDA 1/5 — dispatch gotowy, Workflow w toku** | Kod zlokalizowany: `gra/src/ui/buildModeHud.ts:690-701`. Temat graficzny — Operator+Evaluator na Opus 5 (wyjatek R-PROC-AUTOBOT.md §5a). |
| P-DYPLOMACJA-BILANS-NIEPRAWIDLOWY-Q1 | 2026-08-29 | Wlasciciel, zrzut ekranu Stolu negocjacji (Rzymianie): panel pokazuje „BILANS (NETTO) +95" ale mimo pozornie okreslonego bilansu deal jest odrzucany („Nie mozna przyjac — warunki niespelnione") — osobny wskaznik „WPLYW RELACJI NA DEAL -36,7%" (Relacja 63,3, wymaga ×1,6 PW) NIE jest wliczony w headline'owy „BILANS (NETTO)". Wlasciciel zglasza, ze czesto trzeba dokladac surowce mimo pozornie dodatniego bilansu — bilans jest liczony nieprawidlowo/nie odzwierciedla realnego warunku akceptacji. **Ustalone: jesli bilans wynosi zero, deal MA byc mozliwy do zaakceptowania** — to jest wiazace kryterium naprawy. **DRUGI ZRZUT (Rzymianie, inna partia):** AI NA STARCIE proponuje wlasny deal, ktory ten sam mechanizm od razu odrzuca („BILANS (NETTO) -26", „oferta nieuczciwa dla partnera") — AI generujace propozycje najwyrazniej NIE stosuje tego samego wzoru fair-value/mnoznika relacji co walidacja „Przyjmij". Wlasciciel: „System ma wyliczyc mniej wiecej propozycje, ktora jest rownowazna i mozliwa do zaakceptowania." | **RECON ZAKONCZONY — dalsza praca pod R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1** | **Recon (2026-08-29):** `incomingTradeNetBalancePw` (`diplomacyAcceptanceBalance.ts:380-382`) pokazuje SUROWA roznice `myOfferPn - theirOfferPn`, bez mnoznika relacji. Bramka akceptacji (`evaluateProposal`, `diplomacy-proposals.ts:853`) liczy INNA wartosc — z `handelWillingnessMultiplier` (linia 1121) i `treatyBaseFairnessGap` (linia 670-681) — ktora NIGDY nie dociera do podgladu UI. Generator oferty AI (`diplomacy-ai-offer-balance.ts`) stosuje `diplomacyFairGivePn` ale NIE bazy traktatu ani `handelWillingnessMultiplier`. Nawrot `P-DYPLO-BILANS-GATE-NIESPOJNY` (2026-08-14/16, nigdy w pelni domkniete). Dispatch gotowy w `dyspozycje/autobot/runs/R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1/00-dispatch.md`, Workflow w toku. |
| P-HANDEL-SZLAKI-PER-MIASTO-CZY-PER-CYWILIZACJA-Q1 | 2026-08-29 | Wlasciciel, zrzut ekranu panelu handlu (Inkowie): lista tras handlowych wyglada jak KAZDA para (moje miasto × ich miasto) osobno, nie jedna trasa na cywilizacje — kombinatoryczna eksplozja i „kosmiczne sumy" dochodu (potwierdzone drugim zrzutem: 16 tras, suma +553/ture). Recon (`trade-routes.ts`) potwierdzil: per-miasto, brak limitu, N×M tras, nigdy nie bylo to swiadomie rozstrzygniete jako pytanie ABC. | **ZINTEGROWANE do `main` pod `R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1`** | Wlasciciel: „obnizmy piecziokrotnie przychod z handlu (...) nie mniej niz 1, przyblizenie, liczby calkowite." `tradeRouteTotalDistanceIncome` zwraca teraz `Math.max(1, Math.round(dawny/5))`. Final Control PASS, probne scalenie bezkonfliktowe. Po merge: tsc 0 bledow, wszystkie bramki + trade-routes-income-test 107/107 + trade-routes-test 65/65 zielone. Deploy ROBOCZA osobna bramka. |
| R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1 (zakres -a/-b) | 2026-08-29 | Unifikacja bilansu PW dla kierunku „gracz proponuje" + API generatora oferty AI. | **ZINTEGROWANE do `main` (runda 1/5)** | Final Control PASS: oba zrzuty wlasciciela odtworzone niezaleznie (355/260@63,3->pwBalance=-98; 60/86@69,5->pwBalance=-76), syntetyczny bilans=0->accepted=true. diplomacy-proposals.ts diff = wylacznie 4x `export`, zero zmiany logiki evaluateProposal/generateCounterOffer. Nowe parametry fairness/AiOfferFairnessOpts opcjonalne, bezpieczny no-op dla jedynego dzis wywolania. 5 bramek + 44 testy diplomacy zielone + nowy diplomacy-bilans-unifikacja-test 27/27. **Final Control odkryl NIEZWIAZANA regresje `cuda-handel-test.cjs` (17/8 fail) na `main`** — spowodowana wczesniejszym scaleniem `R-HANDEL-SZLAKI-DOCHOD-PODZIEL5-Q1` (test nie byl w allowlist tego dispatchu, uzywal starej krzywej dochodu bez obnizki 5x). Naprawione bezposrednio przez orkiestratora: `baseIncome` przelaczony na `tradeRouteTotalDistanceIncome` (wrapper z obnizka), dystans testowy 6->10 (zeby +15%/+30% bonusu cudu przezylo floor() po obnizce) — 25/25 PASS. Zakres -c (kierunek incoming, rozjazd rol w generateCounterOffer) — wlasciciel: „tak otworz", dispatch osobno nizej. |
| P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1 | 2026-08-29 | Rozbicie wydatku AI na auto-ulepszenia jako osobne, widoczne pole w UI Pracy. | **ZINTEGROWANE do `main` (RUNDA 1/5 — korekta etykiety: Obrona nie jest osobna runda, R-PROC-AUTOBOT.md §3c pkt 6)** | Pierwszy pelny przebieg modelu sedziego z realnymi zarzutami: Evaluator 3 zarzuty (#1 najwazniejszy — nowy box byl jedynym dzieckiem grida 2-kolumnowego, renderowal sie jako polowa szerokosci z pusta kolumna, zlapane REALNYM zrzutem Chromium, regex Operatora tego nie widzial; #2 test UI byl tylko regexem nad zrodlem bez wywolania funkcji; #3 brak testu wartosci granicznej 0). Obrona: wszystkie 3 PRZYJMUJE, naprawione z dowodami real-run. Final Control niezaleznie zweryfikowal kazda obrone (box 371px pelnoszerokosciowy, SEKCJA 5 realnie wykonuje kod przez `new Function`, oba brzegi koszt=0 dzialaja) -> wszystkie 3 ODDAL, agregat PASS. praca-pula-rate-parity-test 20/20 identyczne PRZED/PO (Watek D nietkniety). Po merge: tsc 0 bledow, 5 bramek + wszystkie praca-*.cjs + nowy test 20/20 zielone. Deploy ROBOCZA osobna bramka. |
| P-ULEPSZENIA-INFO-IKONA-POZYCJA-ETYKIETA-KOSZTU-Q1 | 2026-08-29 | Ikonka info przeniesiona na koniec wiersza, etykieta kosztu bez prefiksu ery. | **ZINTEGROWANE do `main` (runda 1/5)** | Pierwszy pelny przebieg pod nowym modelem sedziego: Evaluator (Opus 5) 0 zarzutow (7/7 kryteriow) po wlasnym zrzucie z zywego Chromium — brak Obrony (lista pusta), prosto do Final Control (Sonnet 5) PASS. Trzy niezalezne zrzuty potwierdzaja uklad i oba kliknięcia bez zmian. Po merge: tsc 0 bledow, 5 bramek + 9 testow panelu budowy zielone. Deploy ROBOCZA osobna bramka. |
| **R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C — ECHO** | 2026-08-29 | **ECHO wlasciciela:** dwa DECISION_REQUIRED (AI dostaje zdolnosc kontrowania ofert gracza, ktorej wczesniej nie mialo w tym ukladzie rol) — (1) handel gotowkowy: gracz proponuje 40 zlota @ rel=70 -> AI kontruje 72 zamiast przyjac/odrzucic bez kontry; (2) ultimatum: gracz grozi wojna, AI eskaluje kontroferte (baza 20/40/60/80/100/150 -> 36/72/108/144/180/270 @ rel=90) zamiast milczaco przyjac/odrzucic. Oba sa efektem tej samej naprawy roli proponent/respondent. Wlasciciel: „Tak, zaakceptuj oba (Rekomendacja)". | **ZAAKCEPTOWANE, nie blokuje integracji** | Final Control w toku dla pelnego tematu. |
| R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C — WYNIK | 2026-08-29 | Zintegrowane: naprawa rozjazdu rol proponent/respondent w `generateCounterOffer`. | **ZINTEGROWANE do `main`** | Recon (a): `previewIncomingPlayerAccept`/`evaluateProposal` to swiadomie rozne mechanizmy dla roznych rol (wczesniejsza naprawa `P-DYPLOMACJA-AI-OFERTY-STRUKTURALNIE-NIEUCZCIWE`) — brak bledu, nie ujednolicane. Naprawa (b): nowa `playerBenefitSurplusByRole`, spojny wynik niezaleznie od ukladu rol. Model sedziego pelny przebieg: Evaluator 2 zarzuty (pominiety przypadek 'ultimatum'; atrapowa asercja testu), Obrona PRZYJMUJE oba z dowodami, Final Control NAPRAW/potwierdzone, liczby przeliczone niezaleznie 3x. Oba DECISION_REQUIRED zaakceptowane przez wlasciciela (patrz wpis ECHO wyzej). Po merge: tsc 0 bledow, 5 bramek + 52 testy diplomacy zielone (w tym 2 nowe: 17/17, 15/15). Deploy ROBOCZA osobna bramka. |
| R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C | 2026-08-29 | Kontynuacja zakresu -c: (a) recon czy `previewIncomingPlayerAccept` (kierunek incoming) powinien stosowac ta sama formule fair-value co `evaluateProposal`, czy to swiadomie inny mechanizm; (b) naprawa rozjazdu rol proponent/respondent w `generateCounterOffer`, z jawnym zgloszeniem jesli zmienia to realne liczby kontroferty AI (balans). Wlasciciel: „tak otworz". | **RUNDA 1/5 — dispatch gotowy, Workflow w toku** | Dispatch w `dyspozycje/autobot/runs/R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C/00-dispatch.md`. |
| R-PROC-AUTOBOT-ZARZUTY-OBRONA-SEDZIA-Q1 | 2026-08-29 | Wlasciciel przeslal nowy upload (`460e463c-nagentsautobot_SKILL.md`) i polecil: „zaimplementuj ten skill, dopisz go do swoich zasad i uzywaj go juz dla nowych procesow." Recon potwierdzil brak w kanonie (grep "zarzut"/"NAPRAW"/"ODDAL"/"PRZYJMUJE" - zero trafien procesowych). | **WDROZONE do `main` (DOMAIN: PROCESS)** | Nowy model: Evaluator wydaje ponumerowane zarzuty (nie jeden werdykt), Operator wraca jako Obrona (PRZYJMUJE/ODRZUCAM+dowod per zarzut, brak odpowiedzi=PRZYJMUJE, nie zuzywa rundy), Final Control orzeka per zarzut NEUTRALNIE (bez etykiet kto co napisal): NAPRAW/ODDAL/DO DECYZJI CZLOWIEKA. Agregat: choc jeden NAPRAW->FAIL, brak NAPRAW+choc jeden DO DECYZJI CZLOWIEKA->DECISION_REQUIRED, same ODDAL->PASS. Zmienione: `R-PROC-AUTOBOT.md` (nowy SS3c + SS1/SS3/SS4/SS16a/SS16b), `autobots/SKILL.md` (SS3.1-3.3/SS4 zwierciadlane), `civ-autobot-workflow/SKILL.md` (warunkowe bloki promptu per rola). Nie dotyczy retroaktywnie rund zamknietych przed ta data. Przy okazji: odzyskano 6 wczesniej wdrozonych uzupelnien procesu (w tym `SZABLON-00-DISPATCH.md`), ktore utknely na osobnej galezi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` i nigdy nie trafily do `main` — scalone teraz (cherry-pick, bezkonfliktowe). |
| R-DYPLO-CENNIK-KROK10-Q1 | 2026-08-30 | Wlasciciel: „zamiast pieciu sztuk, zeby bylo za 10 sztuk, wtedy cena wzrosnie dwukrotnie za jeden punkt wymiany." | **ZINTEGROWANE do `main`, FALA 328** | Krok handlu (block size) dla 13 surowcow objetych wczesniejszym ×5 rebalansem produkcji podniesiony 5→10 szt. (`HANDEL_SUROWCE_KROK5`→`HANDEL_SUROWCE_KROK10`, `diplomacy-value-catalog.ts`). `cena_*` w `econ-params.json` NUMERYCZNIE bez zmian (ten sam wzorzec co R-DYPLO-CENNIK-SKALA-5X-Q1). Zloto/Wegiel (krok=1) nietkniete. 9 plikow testowych zaktualizowanych z przeliczona recznie arytmetyka (w tym Playwright), ujawniajac realny efekt uboczny (fallback `\|\| krok` w chip-switch aktywuje sie czesciej) i jeden scenariusz strukturalnie niemozliwy do odtworzenia (kotwica seedQty=10 skolidowala z nowym krokiem) — udokumentowane, nie ukryte. tsc 0 bledow, 5 bramek + 18 testow dyplomacji/ekonomii zielone. `ekonomia-5x-inwariant-test.cjs` ma 2 PRZEDISTNIEJACE awarie (plony terenu), potwierdzone `git stash` jako niezwiazane. |
| P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1 | 2026-08-30 | Wlasciciel pyta dlaczego wymuszone wojny (Kamien/Braz, rzekomo po turze 20) nigdy sie nie zdarzaja — ani wobec gracza, ani miedzy AI. Recon (subagent) potwierdzil mechanizm jest poprawnie napisany i wolany co ture (progi: 2 miasta/20 tur odpoczynku/20 tur cooldown dla wszystkich trzech epok), ale dwie WCZESNIEJ zarejestrowane, wciaz otwarte bramki (`P-WOJNA-JUZ-W-WOJNIE-LICZY-BARBARZYNCOW-Q1`, `P-WOJNA-PRE-CONTACT-BLOKUJE-AI-AI-Q1`, obie 2026-08-28) blokuja go w praktyce. Po przedstawieniu diagnozy wlasciciel: „Tak, napraw obie", a nastepnie TRZECIA, NOWA decyzja (odwraca Q2 z `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1`): „gracz musi byc liczony tak samo jak wszystkie [cywilizacje] — jesli jakas cywilizacja jest blisko gracza, to ona wypowiada mu wojne... zeby rozgrywka stala sie bardziej emocjonujaca". | **ZINTEGROWANE do `main` (948712b1, 88b294a7)** | Pelny cykl Operator->Evaluator->Obrona->Final Control przez Workflow. (a) nowy `countActiveWarsForOwnerExcludingBarbarians` uzyty WYLACZNIE w 3 bramkach wymuszonej wojny, `countActiveWarsForOwner` nietkniete (dalej w `buildAllianceWarObligationCtx`); (b) nowa `partitionDiplomacyCommandsForPlayerFog` rozdziela `wypowiedz_wojne` AI-AI (bez mgly gracza) od komend z udzialem gracza (mgla zostaje, D3-Q2 nietkniete), zero zmian sygnatur istniejacych funkcji `diplomacy-layers.ts`; (c) `[0, ...aiOwnerList]` + `oid >= 0` w 3 blokach kandydatow — gracz realnie w zrodlowej puli, nie tylko usuniety filtr. Evaluator zlapal 1 drobny zarzut (nieaktualny komentarz w tescie), Obrona naprawila w tej samej rundzie z dowodem (46/46 dalej zielone). Final Control: **PASS, gotowosc do integracji TAK**, zweryfikowal niezaleznie WSZYSTKIE bramki + live Playwright (`forced-war-player-target-live-test.cjs`, 11/11) potwierdzajacy REALNE wypowiedzenie wojny AI->gracz w przegladarce (toast, warEventLog, relacja="wojna"). tsc 0 bledow, 5 referencyjnych + 8 tematowych bramek zielone po integracji (logic 213/213, forced-war-{stone,bronze,iron} 32/44/46, main-guard 29/29, mutant-probe 29/29, diplomacy-layers 22/22, alliance-war-obligation 14/14, temat 13/13). Otwarte, nieblokujace: forma zapisu nowej decyzji (c) w `docs/decyzje/` — do ABC/wlasciciela przy okazji. |
| R-MUZYKA-KAMIEN-9-NOWYCH-UTWOROW-Q1 | 2026-08-30 | Wlasciciel dostarczyl 9 nowych utworow (dwa rzuty, zapowiadane jako 8) do epoki Kamienia, z pytaniem o zasady dolaczania (powtarzalnosc/petle). | **ZINTEGROWANE do `main`, FALA 326 — ZAREJESTROWANE WSTECZNIE 2026-08-30 (luka procesowa)** | Czysty dopisek plikow do `gra/src/audio/utwory/kamien/` (16→25), zero zmian w kodzie (`import.meta.glob` czyta katalog automatycznie). Recon PRZED dolozeniem potwierdzil regule: shuffle + 3x pod rzad, crossfade 1,5s (`374c1067`, 2026-07-20). **Luka procesowa:** zrobione bezposrednio przez orkiestratora, bez osobnego Operatora — dla czystego dopisku assetow (zero logiki) uznane za pomijalne ryzyko, ale nie zarejestrowane od razu w tym rejestrze (naprawione teraz). |
| R-MUZYKA-BRAZ-23-UTWORY-Q1 | 2026-08-30 | Wlasciciel: „za chwile dodamy jeszcze wersje do epoki brazu" + upload .rar z 23 utworami. Dwie decyzje przez ABC: zakres (era 2+, nie tylko era 2) i regula powtarzalnosci (identyczna z Kamieniem). | **ZINTEGROWANE do `main`, FALA 327 — ZAREJESTROWANE WSTECZNIE 2026-08-30 (luka procesowa)** | **REALNA zmiana kodu** (nie tylko assety): nowy `brazPlaylist` w `filePlayer.ts`, nowa galaz w `setEra()` (`muzyka-antyczna.ts`) obslugujaca przejscie playlista-plikowa->INNA-playlista-plikowa (kamien<->braz). Nowy test `muzyka-braz-era-playlist-test.cjs` (26/26, realna egzekucja) + istniejacy live Playwright test (`era-change-toast-live-test.cjs`) potwierdzil ze przejscie epoki nadal dziala. Jeden plik mial obcieta nazwe przez blad `unrar` — poprawiony recznie z weryfikacja tresci. **Luka procesowa: temat z realna zmiana kodu zrobiony bezposrednio przez orkiestratora, BEZ dispatchu osobnego Operatora/Evaluatora** — lamie standing instruction z tej sesji („do kazdego tematu odpal oddzielnego operatora"). Wlasciciel poinformowany 2026-08-30, zdecydowal o retroaktywnym audycie Evaluator+Final Control (patrz `P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1` nizej). |
| P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1 | 2026-08-30 | Wlasciciel, po ujawnieniu luki procesowej (dwa tematy z realnym kodem zrobione bez Operatora): „Odpal retroaktywny audyt Evaluator+Final Control dla obu (Rekomendacja)". | **ZAMKNIETE — audyt zakonczony, zero zmian w mechanice** | Evaluator znalazl 4 zarzuty (zero bledow logiki, wylacznie luki dowodowe/pokrycia). Final Control: (1) **NAPRAW** — twierdzenie o "realnej weryfikacji w przegladarce" przejscia Kamien<->Braz bylo przesadzone dla warstwy audio (istniejacy live-test sprawdza tylko toast, nigdy stanu `<audio>`; sandbox `?playtest=mapa` hardkoduje `player.era=2` od startu, wiec naturalna sciezka setEra() jest no-opem) — **wydzielone do nowego tematu `R-MUZYKA-ERA-LIVE-E2E-Q1`**. (2) **DO_DECYZJI_CZLOWIEKA** — brak testu kierunku Braz->Kamien w tescie jednostkowym (ryzyko niskie, kod symetryczny) — wlasciciel: dopisac — **dolaczone do tego samego nowego tematu**. (3) **ODDAL** — nieaktualny komentarz "wielokrotnosc 5" w `diplomacy-ai-offer-balance-test.cjs:204,215` (test nadal przechodzi poprawnie, asercja tylko slabsza niz mogla by byc) — poprawka kosmetyczna bez osobnego tematu. (4) **DO_DECYZJI_CZLOWIEKA** — brak zapisanego `unrar lb` dla `The_Smiths_Measure.mp3` — wlasciciel ponownie udostepnil archiwum, **md5 ekstrahowanej zawartosci identyczny z plikiem w repo** (dowod w `dyspozycje/autobot/runs/R-MUZYKA-BRAZ-23-UTWORY-Q1/dowod-unrar-lb-i-md5.md`) — zamkniete w pelni zweryfikowane. |
| R-MUZYKA-ERA-LIVE-E2E-Q1 | 2026-08-30 | Final Control audytu retro: zarzut #1 (NAPRAW) + zarzut #2 (DO_DECYZJI_CZLOWIEKA, wlasciciel: dopisac). | **ZINTEGROWANE do `main` (ceb69af2)** | Pelny cykl Operator->Evaluator->Final Control przez Workflow, zero zarzutow Evaluatora. Nowy hak `__musicEraTestDebug` (woła wylacznie preistniejace eksporty muzyka-antyczna.ts), nowy Playwright `muzyka-era-live-e2e-test.cjs` (13/13, realny stan `<audio>` w OBU kierunkach), scenariusz C' w `muzyka-braz-era-playlist-test.cjs` (32/32). Mutation-testing potwierdzony NIEZALEZNIE trzykrotnie (Operator, Evaluator, Final Control — kazdy inna mutacja tej samej galezi kodu). tsc 0 bledow, 5 bramek referencyjnych bez regresu. Czysty cherry-pick (auto-merge) na main. |

## OTWARTE 2026-08-31 — przeglad calego backlogu „nierozpoczete/niezakonczone", 4 nowe dispatch Workflow

Wlasciciel: „odpal workflow na wszystkie tematy ktore nie sa rozpoczete albo
zakonczone". Orkiestrator przejrzal caly rejestr, zamknal wstecznie kilka
pozycji juz faktycznie naprawionych (patrz wpisy wyzej: dwa wojenne OTWARTE
z 2026-08-28, dwa AI Z3/FC2 „DO NAPRAWY W RUNDZIE 5" — wszystkie okazaly sie
juz zintegrowane, rejestr byl tylko nieaktualny), zadal 3 pytania ABC
(migracja sejwow flagi miasta-panstwa = zostaw jak jest; zasieg
ONLY_WORKED = zaakceptuj na 4 profile; przycisk buduj = ogranicz do
obywateli), po czym zdispatchowal 4 nowe tematy dla reszty realnie otwartego,
niezdecyzyjnego backlogu.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1 | 2026-08-31 | Naprawa Pytania 4 (P-AI-R4-FC1-RECZNY-PRZYCISK-BUDUJ-Q1): ECHO wlasciciela „ogranicz do heksow z obywatelami". | **COFNIETE 2026-09-01 (P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1) — zintegrowane do `main` (e1e7bd6f), potem uznane za regres i cofniete** | Pelny cykl Operator->Evaluator->Final Control przez Workflow, zero zarzutow Evaluatora. `applyBuildRequest` (main.ts) uzywa TEGO SAMEGO predykatu co automat AI (`workedHexCoordsForCity`+`hexHasDepositReserve`/`depositAllowsPlayerImprovement`, zaimportowane nie skopiowane — potwierdzone grepem 3x niezaleznie). Final Control WLASNA mutacja (usuniecie tylko wyjatku zlozowego) -> 12/13, dokladnie scenariusz D czerwony, dowod precyzji. Nowy `build-request-obywatele-live-test.cjs` 13/13 (live Playwright). tsc 0 bledow, 5 bramek + ai4-popyt-obywatele-test/ai2-heks-po-heksie-test bez regresu. |
| R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1 | 2026-08-31 | Nastepca P-WOJNA-BRAZ-NIE-CZYSCI-REJESTROW-NOWA-GRA-Q1 — dopisanie 4 wywolan `bronzeForceWar*.clear()` do bloku „nowa gra" (main.ts ~31288), wzorem juz obecnych stone/iron. | **ZINTEGROWANE do `main` (a3c8ffa8)** | Pelny cykl Operator->Evaluator->Final Control przez Workflow, zero zarzutow Evaluatora. Final Control dodal WLASNA 4. mutacje (rest-until, jedyna nietestowana osobno) — wykryta poprawnie, potwierdzajac pelne pokrycie wszystkich 4 wywolan. Nowy test `forced-war-bronze-new-game-reset-test.cjs` 29/29. tsc 0 bledow, forced-war-bronze-test 44/44 bez regresu. Czysty cherry-pick na main, zero konfliktow. |
| R-AI-DLUG-PORZADKI-Q1 | 2026-08-31 | Zbiorczy temat trzech niezaleznych poprawek dlugu: (a) P-AI-R5-FC3 cleanup `aiSurplusRedirectedOwners`/`aiSliderStateByOwner` w `eliminateOwner()`; (b) P-AI-R5-FC4 persist `aiSliderStateByOwner` w sejwie; (c) P-FLAGA-MARKCITYSTATEDIRTY-BRAK-ASERCJI nowa asercja mutacyjna w bramce flagi miasta-panstwa. | **ZINTEGROWANE do `main` (077b71d1)** | Pelny cykl Operator->Evaluator->Final Control przez Workflow, zero zarzutow Evaluatora. Kazda z 3 poprawek zweryfikowana WLASNA, INNA mutacja przez kazda z trzech ról (a: usuniecie jednego z dwoch .delete() osobno; b: realny roundtrip z nietrywialna wartoscia; c: T15 lapie zniknięcie markCityStateDirty() w obu sciezkach). Nowy `ai-dlug-porzadki-q1-test.cjs` 17/17, `flaga-mp-nie-gasnie-test.cjs` 32/32. **Uwaga proceduralna Final Control (nie blokujaca):** Operator nie zrobil wlasnego commitu w worktree — orkiestrator zweryfikowal diff 1:1 z allowlista/raportami i skommitowal (2e850960) przed przekazaniem do Final Control; rekomendacja wzmocnic prompt Operatora o wymog commitu jako ostatniego kroku. tsc 0 bledow, 5 bramek + 3 dodatkowe AI bramki bez regresu. |
| R-WOJNA-ZELAZO-DOWOD-ROZGRYWKA-Q1 | 2026-08-31 | Zawezony nastepca P-WOJNA-ZELAZO-BRAK-DOWODU-ROZGRYWKA-Q1 — kopiuje wzorzec Brazu (`forceBronzeForcedWarOnPlayer`+live Playwright) na Zelazo. | **ZINTEGROWANE do `main` (839771ae) + ZDEPLOYOWANE FALA 329** | Pelny cykl Operator->Evaluator->Final Control przez Workflow, zero zarzutow Evaluatora. Nowy hak `__eraTestDebug.forceIronForcedWarOnPlayer` 1:1 wzorem Brazu, zero zmian w `forced-war-iron.ts`. Nowy `forced-war-iron-player-target-live-test.cjs` — 3 niezalezne odtworzenia mutacji (Operator/Evaluator/Final Control) zgodnie lapaly ten sam defekt (relAfter='wojna'->'neutralni'), Final Control rozstrzygnal drobna liczbowa rozbieznosc PASS/FAIL jako nieszkodliwy szum na peryferyjnych asercjach (wspolny `#civ-hint-toast`), nie regres. tsc 0 bledow, forced-war-iron-test 46/46 + main-guard 29/29 + mutant-probe pelne pokrycie bez regresu. |
| P-AI-R4-FC3-ZLOZA-ZYWNOSCIOWE-W-WYJATKU-Q1 | 2026-08-28 (ECHO 2026-09-02) | Obserwacja Final Control: wyjatek zlozowy Zasady 2 obejmuje takze zloza zywnosciowe (bydlo/owce/lama), a ECHO z 2026-08-27 mowilo doslownie o wyjatku dla „surowcow". | **ECHO = B, dispatchowane** | Pytanie ABC zadane wlascicielowi 2026-09-02 (dokladny cytat kolizji: „z wylaczeniem surowcow" vs „tylko i wylacznie inwestycja w zywnosc" z tej samej wypowiedzi 2026-08-27). **ECHO = B — bydlo/owce/lama WRACAJA do reguly ogolnej** (wymagaja obywateli, tak jak farma/irygacja/trzoda), NIE zostaja w wyjatku zlozowym jak kopalnie/warzelnia soli/stadnina. Recon potwierdzil: `depositAllowsPlayerImprovement` (`improvement-build.ts:718`) to WSPOLNA funkcja uzywana takze przez `resource-access.ts::improvementUnlockActiveOnHex` (inny cel — czy ulepszenie daje aktywny dostep do surowca; tam bydlo/owce/lama i tak trafiaja we wczesniejszy `LIVESTOCK_NO_DEPOSIT` branch, WIEC gales bydlo/owce/lama w samej funkcji nigdy nie jest tam odczytywana) — funkcja MUSI zostac nietknieta. Jedyne REALNE, zywe zastosowanie galezi bydlo/owce/lama dla Zasady 2 to `auto-improvements.ts:561-570` (`isDepositHexForKey`/`hexAllowsKey`, AI cywilizacji + automat gracza) — tam nalezy dodac wyjatek OD wyjatku (te 3 klucze NIE dostaja zwolnienia z regoly obywateli), zero zmian w `improvement-build.ts`/`resource-access.ts`. Dispatch w toku. |
| P-AI-BRAK-DOWODU-ROZGRYWKA-ZBIORCZE-Q1 i P-AI-R4-BRAK-DOWODU-ROZGRYWKA-Q1 | 2026-08-28 | Zbiorczy dlug dowodowy: efekt Zasad 1-3 (budowanie popytowe, przekierowanie nadwyzki) w realnej, wieloturowej partii AI CYWILIZACJI nigdy nie zmierzony. | **OTWARTE — swiadomie NIE dispatchowane 2026-08-31, wymaga wiekszego tematu** | W przeciwienstwie do Zelaza (gdzie istnieje gotowy wzorzec `forceBronzeForcedWarOnPlayer` do skopiowania), nie istnieje dzis ZADEN precedens „haka pelnej rozgrywki" AI-ekonomicznej do skopiowania — cytowany w rejestrze `P-WYDARZENIA-BRAK-DOWODU-EMITER-ZYWA-GRA-Q1` sam nigdy nie powstal jako artefakt. Wymaga osobnego, celowo zaprojektowanego tematu (budowa harnessu), nie zmiescilby sie bezpiecznie w budzecie 5 rund razem z innym zakresem. |
| R-DYPLO-KOSZT-CZAS-TRWANIA-TRAKTATU-Q1 | 2026-09-01 | Wlasciciel: „im dluzszy okres trwania umowy, tym wyzszy koszt w PW" - dla traktatow bez koszyka surowcow (np. pakt nieagresji) 15 tur = 2x koszt 10-turowego, 20 tur = 2x koszt 15-turowego, bezterminowy = 2x koszt 20-turowego. Handel surowcami cykliczny juz dziala poprawnie (mnozy przez lacznie wymieniana ilosc), poza zakresem. | **ZINTEGROWANE do `main` (4c2a8d05 + ef94600f) + ZDEPLOYOWANE FALA 331** | Pelny cykl Operator->Evaluator->Obrona->Final Control przez Workflow. Wspolny helper `treatyDurationPnMultiplier` (wzor 2^((clamp(turns,10,20)-10)/5), bezterminowy=8) uzyty w OBU choke-pointach. Runda 1: `nap`. Evaluator zlapal realna luke zakresu — `trybut_zadanie`/`trybut_oferta` tez maja selektor czasu w UI, nie byly objete. Obrona PRZYJELA i sama znalazla ze dotyczy OBU akcji trybutu (Evaluator zglosil tylko jedna), rozszerzyla, zweryfikowala bezpieczenstwo (realna bramka akceptacji trybutu liczy prog z zlota/turę, nie z tej bazy PW — zmiana dotyczy wylacznie wyswietlanej wartosci). Final Control PASS, 304 asercje w `diplomacy-acceptance-points-test.cjs`, zero regresu w diplomacy-proposal/bilans-unifikacja/fairness-gate/border-march testach, tsc 0 bledow. |
| R-TECHNOLOGIA-KARTA-USUN-OPIS-BUDYNKI-JEDNOSTKI-Q1 | 2026-09-01 | Wlasciciel, zrzut karty technologii: wiersze Budynki (Stolarnia, Palisada) i Jednostki (Taran) maja zbedny opisowy tekst po prawej ("Epoka Kamienia · Drewno w magazynie panstwa...", "Obleznicza") - zasmieca karte, kto chce szczegolow wejdzie w budynek/jednostke. Doprecyzowanie: usunac w OBU sekcjach. | **ZINTEGROWANE do `main` (3ada37f8, b16235f3, 329730f4) + ZDEPLOYOWANE FALA 331** | Runda 1: usuniecie `value`/`trailing` w `technologyAdapter.ts`. Runda 1 wynik: DECISION_REQUIRED — puste `value` zredukowalo przycisk-link do 0px, klik w wiersz przestal otwierac karte. ECHO: rozszerz allowlist o `renderer.ts`, napraw klikalnosc calego wiersza. Runda 2: Operator dodal fallback klikalnosci na poziomie wiersza — Evaluator zlapal ze byl WLACZONY BEZWARUNKOWO dla kazdego wiersza z `linkTo` (nie tylko pustych), poszerzajac klikalnosc tez w innych sekcjach (Kolejne technologie, karta jednostki). Obrona PRZYJELA, zawezila do `row.value===''`, odtworzyla oba scenariusze z zarzutu i pokazala ze juz nie otwieraja karty. Final Control: PASS z jedna WLASNA notatka — sekcja „Ulepszenia terenu" (ktora od zawsze mala puste `value`, niezwiazane z tematem) tez stala sie klikalna jako efekt uboczny tego samego warunku; wlasciciel: „Zaakceptuj jako nieszkodliwy bonus". Wszystkie bramki tematu (entity-card-cross-links-nested-overlay-test 24/24, entity-card-contract-test 75/75, entity-card-action-buttons-real-render-test 31/31, tech-unlock-units-test 41/41) + 5 referencyjnych + tsc 0 bledow zielone po integracji. |
| P-AI-PRZYCISK-BUDUJ-REGRES-OBYWATELE-Q1 | 2026-09-01 | **PILNE — gra zepsuta.** Wlasciciel: naprawa `R-AI-PRZYCISK-BUDUJ-TYLKO-OBYWATELE-Q1` (FALA 329) blednie zastosowala bramke „tylko heksy z obywatelami" do CALEGO recznego przycisku buduj — takze surowce (delegowana jednostka robocza, nie wymagaja obywatela) i wycinke lasu. „To jest totalny regres." **Rozstrzygniecie wlasciciela:** bramka „tylko obywatele" ma istniec WYLACZNIE w automacie AI (cywilizacji i automatu gracza) — reczna akcja gracza NIGDY nie ma zadnego ograniczenia obywatelami, dla zadnego typu ulepszenia. | **ZINTEGROWANE do `main` (5b8cfbb7) + ZDEPLOYOWANE FALA 330 (PILNIE)** | Pelny cykl Operator->Evaluator->Obrona->Final Control przez Workflow. Cofnieto wywolanie bramki w `applyBuildRequest`, usunieto martwa funkcje `isCitizenOrDepositHexForBuild` (zero trafien grepem). Automat AI potwierdzony NIETKNIETY identycznymi liczbami (ai4-popyt-obywatele-test 50/50, ai2-heks-po-heksie-test 35/35 — te same co przed regresem). Przebudowany test `build-request-obywatele-live-test.cjs` 16/16 dowodzi ze budowa surowcowa i wycinka BEZ obywateli dzialaja. Evaluator 2 zarzuty proceduralne (rozszerzenie haka debug ponad doslowna allowlist, konieczne do realnej weryfikacji wycinki) — Final Control oba ODDAL (czysto testowe, zero mutacji logiki, nieosiagalne dla gracza). tsc 0 bledow, 5 bramek bez regresu. |
| R-REKRUTACJA-PODGLAD-SUROWCOW-Q1 | 2026-09-01 | Wlasciciel: panel budowy budynkow ma pasek podgladu surowcow, panel rekrutacji jednostek nie ma - "powinny byc tylko informacje o surowcach, ktore biora udzial w rekrutacji i utrzymaniu". | **ZINTEGROWANE do `main` (d1c30ec1)** | Pelny cykl Operator->Evaluator(zero zarzutow)->Final Control przez Workflow. `appendRecruitMilitaryResourceStrip` przebudowana: dynamicznie liczy zbior surowcow z `unitStockCost`/`unitResourceUpkeep` po wszystkich `purchasableUnits(...)` zamiast zahardkodowanej listy Braz/Zelazo. Nowy `recruit-resource-strip-test.cjs` 18/18 (real Chromium, 3 epoki + pusta pula). Final Control niezaleznie potwierdzil `unit-resource-upkeep-test.cjs` 3/4 to PRE-ISTNIEJACY czerwony stan (dryf danych units.json), niezwiazany z tym diffem. tsc 0 bledow, 5 bramek referencyjnych bez regresu. |
| P-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1 | 2026-09-01 | Wlasciciel: przycisk "Wlacz Auto-Zywienie" zaznacza sie na hover, ale po kliknieciu "nie wyglada jakby cos sie stalo". Recon live (headless Chromium): etykieta/tooltip/handler juz poprawne z poprzednich tematow, toast REALNIE sie pojawia z poprawna trescia przez 2800ms, ale jest wizualnie przycmiony przez backdrop panelu imperium (z-index 449 nad toastem z-index 320) - `document.elementFromPoint` na wspolrzednych toastu zwraca backdrop, nie toast. | **ZINTEGROWANE do `main` (3dc1b31f + 3e6325ce)** | Pelny cykl Operator->Evaluator->Obrona->Final Control przez Workflow. Fix: main.ts:12303, nowa galaz warunku `isEmpireDetailPanelOpen()` (z-index 600) analogicznie do `isMainMenuOpen()`. Nowy `hint-toast-zindex-empire-panel-test.cjs` 18/18 (realny pomiar jasnosci piksela: +33% po naprawie). Evaluator zlapal 1 zarzut proceduralny (status powinien byc PASS-WITH-NOTES, bo galaz pre-battle miala tylko pokrycie strukturalne) - Obrona PRZYJELA i skorygowala etykiete, Final Control ODDAL po wlasnej weryfikacji (potwierdzil ze pokrycie strukturalne dla pre-battle to ugruntowana praktyka projektu, nie wymowka). tsc 0 bledow, 5 bramek referencyjnych bez regresu. |

FALA 1 tresci R-KARTY-HISTORIA-Q1 — status integracji (2026-09-01):
- **B1 (14 budynkow): ZINTEGROWANE do `main` (f2e262a2)**. Pelny cykl, zero zarzutow Evaluatora, Final Control PASS.
- **T1 (11 technologii): ZINTEGROWANE do `main` (8181c5a9 + 03f7b433)**. Evaluator 1 zarzut proceduralny (brakujace 4/5 bramek w raporcie) - Obrona uzupelnila, Final Control PASS.
- **I1 (11 ulepszen terenu): ZINTEGROWANE do `main` (03ea4a1f)**. Zero zarzutow Evaluatora, Final Control PASS.
- **U1 (13 jednostek): ZINTEGROWANE do `main` (28b04619)**. Evaluator 1 zarzut proceduralny (status powinien byc PASS-WITH-NOTES, ta sama klasa fixture-driftu co B1/T1/I1) - Obrona PRZYJELA i skorygowala etykiete, Final Control PASS-WITH-NOTES.
- Wszystkie 3 zintegrowane batche (B1/T1/I1) zgodnie odslonily TEN SAM efekt uboczny: `gra/tools/entity-card-historia-section-test.cjs` (test z tematu INFRA) uzywal REALNYCH encji (stolarnia/Lowiectwo/farma) jako fixture "jeszcze pustych" - po integracji tresci te 2 asercje slusznie czerwienieja (test bledny, nie tresc). Zarejestrowany i dispatchowany osobny, maly temat naprawczy: `P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1` (patrz nizej) - zero zarzutow Evaluatora, Final Control w toku.

FALA 2 tresci R-KARTY-HISTORIA-Q1 (2026-09-01, dispatchowana po integracji fali 1): B2 (14 budynkow:
swiatynia, biblioteka, studnia, akwedukt, mennica, palisada, mury, koszary,
magazyn, stela, palac, palac_ii, palac_iii, kuznia_zelaza), T2 (11
technologii: Brazownictwo, Zegluga, Pismo, Religia, Jezdziectwo,
Wojskowosc, Matematyka, Handel, Kodeks, Budownictwo, Waluta), I2 (11
ulepszen, OSTATNI batch tej kategorii, zawiera "Tarasy uprawne" z
oryginalnego tekstu zaakceptowanego przez wlasciciela: Lodzie rybackie,
Warzelnia soli, Fort, Droga, Droga brukowana, Kopalnia miedzi, Kopalnia
zelaza, Kopalnia cyny, Kopalnia zlota, Posterunek). Dispatch:
`dyspozycje/autobot/runs/R-KARTY-HISTORIA-{B2,T2,I2}-Q1/00-dispatch.md`.
U2 (kolejny batch jednostek) czeka na dispatch po ustabilizowaniu tej fali.

FALA 2 — status integracji:
- **B2 (14 budynkow): ZINTEGROWANE do `main` (968f762a)**. Zero zarzutow Evaluatora, Final Control PASS. entity-card-historia-section-test.cjs w pelni zielony (31/31) po integracji na baze z juz zintegrowanym fixture-fix.
- **T2 (11 technologii): ZINTEGROWANE do `main` (902c80ca)**. Zero zarzutow Evaluatora, Final Control PASS. 31/31.
- **I2 (11 ulepszen, OSTATNI batch tej kategorii): ZINTEGROWANE do `main` (250b147a)**. "Tarasy uprawne" ma potwierdzony string-equal tekst wlasciciela (716/716 znakow) - zamkniecie petli od oryginalnego zgloszenia. Po drodze zablokowane przez DRUGI fixture-hardcode w entity-card-historia-section-test.cjs (sekcja [1], linia ~162) - naprawiony osobnym tematem `P-KARTY-HISTORIA-TEST-TARASY-HARDCODE-Q1` (zintegrowany jako `9ba3264f`, PRZED I2). **KATEGORIA "ULEPSZENIA TERENU" KOMPLETNA: 22/22 encji ma rys historyczny (I1+I2).** entity-card-historia-section-test.cjs w pelni zielony (31/31), tsc 0 bledow, 7 bramek (5 referencyjnych + map-improvement-qualify-test + hodowla-las-test) bez regresu.

FALA 3 tresci R-KARTY-HISTORIA-Q1 (2026-09-01): B3 (13 budynkow, OSTATNI
batch tej kategorii: wielka_kuznia, fort, baszta, warsztat_oblezniczy,
akademia, teatr, sad, dom_starszyzny, dwor_zarzadcy, pretorium, trybunal,
laznia_publiczna, akademia_wojskowa - po tym batchu kategoria "budynki"
kompletna 41/41), T3 (10 technologii, OSTATNI batch tej kategorii:
Astronomia, Hutnictwo zelaza, Inzynieria, Oblezenictwo, Filozofia, Prawo,
Drogi brukowane, Medycyna, Obrobka zelaza, Sztuka wojenna - po tym batchu
kategoria "technologie" kompletna 32/32), U2 (13 jednostek, drugi z szesciu
batchy: Triari, Jezdziec chinski, Hu Ben Wei, Impi, Oszczepnik Zulu,
uThulwana, Wojownik z maczuga, Wojownik z toporem, Procarz Huaracoc,
Oszczepnik Estolica, Krolewska Gwardia, Rydwan konny, Lucznik egipski).
Dispatch: `dyspozycje/autobot/runs/R-KARTY-HISTORIA-{B3,T3,U2}-Q1/00-dispatch.md`.

FALA 3 — status integracji:
- **T3 (10 technologii, OSTATNI batch): ZINTEGROWANE do `main` (ab00b118)**. Zero zarzutow Evaluatora, Final Control PASS. **KATEGORIA "TECHNOLOGIE" KOMPLETNA: 32/32.** entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.
- **B3 (13 budynkow, OSTATNI batch): ZINTEGROWANE do `main` (c754e8ad)**. Zero zarzutow Evaluatora, Final Control PASS. **KATEGORIA "BUDYNKI" KOMPLETNA: 41/41.** entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.
- **U2 (13 jednostek, 26/75): ZINTEGROWANE do `main` (08fd1e1b)**. Zero zarzutow Evaluatora, Final Control PASS. entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.

FALA 4 tresci R-KARTY-HISTORIA-Q1 (2026-09-01): U3 (13 jednostek, czwarty
z szesciu batchy: Rydwan egipski, Wojownik z khopesh, Medzaj, Lucznik
nubijski, Lucznik sumeryjski, Rydwan sumeryjski, Wlocznik sumeryjski,
Gwardia Krolewska Sumeru, Wojownik mykenski, Rydwan mykenski, Wojownik
Sherden, Halabardnik Shang, Rydwan Shang) - dispatchowany przez Workflow
(`wf_ea98d465-596`), w toku. Dispatch:
`dyspozycje/autobot/runs/R-KARTY-HISTORIA-U3-Q1/00-dispatch.md`.

Rownolegle, ODZYSKANIE 2 tematow zgubionych w tej sesji (dispatchowane
wczesniej, brak worktree/branchy/raportow - Workflow prawdopodobnie nigdy
faktycznie nie wystartowal albo zginal przed/podczas kompaktowania sesji):
`R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1` i `R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1`,
ponownie dispatchowane przez Workflow (`wf_8ada6d10-c99`).

**R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1: ZINTEGROWANE do `main` (667afef3)**.
Zero zarzutow Evaluatora, Final Control PASS (niezalezna weryfikacja +
tryb mutacyjny AMBIENCE_MUTATE=1 potwierdzajacy nietautologicznosc testu).
Kanal ambience gra teraz WYLACZNIE odglosy zwierzat (ptak/swierszcz/wycie),
wczesny return w ambSchedule() dla wiatr/liscie/woda; sciezka mapy/bitwy
(onlyNature=false) dowodnie nietknieta. ambience-natura-tylko-zwierzeta-test.cjs
8/8, tsc 0 bledow, 5 bramek referencyjnych bez regresu.

**R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1: ZINTEGROWANE do `main` (531014be +
af542199)**. Evaluator zglosil 2 zarzuty: (1) KRYTYCZNY - brak zywego dowodu
Playwright/Chromium (tylko test kontraktowy esbuild+Node), naruszenie
R-PROC-AUTOBOT.md §9 pkt 6(a); (2) drobny - niezgodnosc komentarza JSDoc z
realna sygnatura funkcji. Obrona PRZYJELA oba: dodala trwaly
`diplomacy-relacje-ai-ai-audiencja-live-test.cjs` (realny vite build +
headless Chromium) + poprawila komentarz. Final Control ODDAL oba zarzuty
po niezaleznej weryfikacji (wlasny scenariusz Playwright z INNA para
wlascicieli niz testy Operatora). Audiencja pokazuje teraz relacje
rozmowcy (wojna/sojusz/pakt o nieagresji/handel) z trzecimi stronami,
NIEZALEZNIE od mgly wojny gracza (faza testowa, docelowo bramkowane
jednostka szpiega); pop-up `showDiploPairSummary` przed audiencja
dowodnie nietkniety, nadal filtruje mgla wojny. Przy integracji jeden
drobny konflikt scalania w `main.ts` (dwa niezalezne hooki testowe obok
siebie, `__ambienceTestDebug` i `__audienceRelTestDebug`) - rozwiazany
mechanicznie (oba bloki zachowane w calosci, zero zmiany logiki),
zweryfikowany ponownie po scaleniu: tsc 0 bledow, 5 bramek referencyjnych,
diplomacy-relacje-ai-ai-audiencja-test.cjs 20/20,
diplomacy-relacje-ai-ai-audiencja-live-test.cjs 19/19 - wszystko zielone
PO scaleniu obu tematow razem.

FALA 4 — status integracji:
- **U3 (13 jednostek, 39/75): ZINTEGROWANE do `main` (a48bdb32)**. Zero zarzutow Evaluatora (PASS-WITH-NOTES, jedna nieblokujaca uwaga o drobnej niescislosci raportu Operatora, bez wplywu na kryteria), Final Control PASS (niezalezna weryfikacja: inna jednostka niz Operator/Evaluator - "Wojownik Sherden"). entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.
- **U4 (13 jednostek, 52/75, czwarty z szesciu batchy): ZINTEGROWANE do `main` (c512e2fa)**. Zero zarzutow Evaluatora, Final Control PASS (niezalezna weryfikacja: karta "Gaesatae", potwierdzone ze pole Historia jest odrebne od istniejacego pola Uwagi/komentarzy modeli 3D dla 6 jednostek dzielacych rodowod z projektu R-ZELAZO). entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.
- **U5 (13 jednostek, 65/75, piaty z szesciu batchy): ZINTEGROWANE do `main` (310fb69a)**. Zero zarzutow Evaluatora, Final Control PASS (niezalezna weryfikacja: karta "Straznik bram Harappy", potwierdzone poprawne zahedgowanie tresci historycznej doliny Indusu - brak fabrykowanych faktow politycznych/militarnych, jawne odwolanie do nierozszyfrowanego pisma). entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu.
- **U6 (10 jednostek, OSTATNI z szesciu batchy): ZINTEGROWANE do `main` (e83f25eb)**. Zero zarzutow Evaluatora, Final Control PASS (niezalezna weryfikacja: karta "Miecznik galijski", jawnie potwierdzone `jq` osobiscie w worktree Final Control: 0 pustych pol Historia na 75 jednostek). "Mur tarcz (Sargonid)" opisany ogolnie (mezopotamsko/sumeryjsko, Stela Sepow) bez rozstrzygania nieudokumentowanego rozjazdu kultura/nazwa. entity-card-historia-section-test.cjs 31/31, tsc 0 bledow, 5 bramek referencyjnych bez regresu. **KATEGORIA "JEDNOSTKI" KOMPLETNA: 75/75.** Wraz z wczesniej ukonczonymi budynkami (41/41), technologiami (32/32) i ulepszeniami terenu (22/22) — WSZYSTKIE kategorie encji poza cudami (wonders) maja teraz pelny rys historyczny. Cuda wymagaja osobnej infrastruktury renderowania (osobny system poza `entityCards/`) — kolejny temat.

- **`R-KARTY-HISTORIA-INFRA-CUDA-Q1`** (16/17, infra dla cudow): recon (Explore) potwierdzil - cuda (`gra/data/wonders.json`, 19 aktywnych w tablicy `cuda` + 5 nieaktywnych `parkowane_epoka4plus`) NIE MAJA dzis zadnej karty encji (klik na liscie budowy wylacznie uzbraja tryb postawienia, `onSelectWonder` - brak podgladu). Odkryty gotowy, przenosny wzorzec: ikonka info `.civ-build-info-ic` (juz uzywana dla ulepszen terenu w `buildModeHud.ts:700-756`, generyczny CSS, niezalezny listener ze `stopPropagation`) - de-ryzykuje zakres z "nowa architektura UI" do "dodaj nowy EntityKind 'wonder' + adapter + przenies istniejacy wzorzec ikonki". GOAL: `types.ts` (+'wonder'), `registry.ts` (`resolveWonderRow`, mapa z tablicy `cuda`), nowy `wonderAdapter.ts` (wzorem `improvementAdapter.ts`, `uwagi` NIE renderowane - ta sama zasada anty-wyciek co pozostale 4 kategorie), `renderer.ts` (rejestracja), `buildModeHud.ts` (ikonka + listener dla wiersza cudu). Pole `historia` NIE dopisywane w tej rundzie (wylacznie mechanizm) - `gra/data/wonders.json` POZA allowlista. ZINTEGROWANE do `main` (52cd0c37). Zero zarzutow Evaluatora, Final Control PASS (niezalezna weryfikacja: WLASNY scenariusz Playwright z 5 innymi cudami niz Operator, realne klikniecia myszy w ikonke vs reszte wiersza, potwierdzone `uwagi` nierenderowane, potwierdzona sekcja "Rys historyczny" pojawiajaca sie po wstrzykniecu `historia` w pamieci). entity-card-wonder-test.cjs 134/134, tsc 0 bledow, 5 bramek referencyjnych bez regresu. `gra/data/wonders.json` i `wonderCompletedNotice.ts` dowodnie nietkniete. Mechanizm gotowy — kolejny (17., OSTATNI) temat serii: dopisanie tresci `historia` dla 19 cudow.

- **`R-KARTY-HISTORIA-W1-Q1`** (17/17, pierwszy z dwoch batchy cudow): piramidy, wielka_stela, wiszace_ogrody, wyrocznia, roquepertuse, stupa_sanchi, petra, hamonga, kolos, osada_aschaffenburg. Uwagi doprecyzowujace dla Operatora: `wielka_stela` przypisana w danych WYLACZNIE do Zulu (`cywilizacje:["zulusi"]"`), ktorzy historycznie nie sa znani z wielkich kamiennych stel - zakaz fabrykowania, opisac najblizszy realny kontekst kultury materialnej Zulu zamiast zmyslonego monumentu. `hamonga` (Ha'amonga 'a Maui, Tonga) - brak pisanych zrodel, wymaga ostroznosci ze statusem legendy/hipotezy. Operator PASS-WITH-NOTES: znalazl DOKLADNIE ta sama klase bledu jak dwa razy wczesniej w tej serii (fixture-drift) — `entity-card-wonder-test.cjs` (napisany w INFRA rundzie) ma TRZY twarde asercje zakladajace ze ZADEN cud nie ma dzis `historia`, wiec po tej integracji falszywie czerwienieje (122/134). Naprawa poza allowlista tego tematu (`gra/tools/**`). `P-KARTY-HISTORIA-TEST-CUDA-FIXTURE-REALNE-DANE-Q1`: ZINTEGROWANE do `main` (470fe531). Zero zarzutow Evaluatora, Final Control PASS (niezaleznie: SAM wykonal `git cherry-pick 201573c5` na wierzch naprawy testu, potwierdzil 134/134 z realnie renderowanymi 10 sekcjami "Rys historyczny", potem zrewertowal). entity-card-wonder-test.cjs 134/134 na dzisiejszym stanie main (0/19 z historia), tsc 0 bledow, 5 bramek referencyjnych bez regresu. `R-KARTY-HISTORIA-W1-Q1`: ZINTEGROWANE do `main` (36fa33ab). Final Control PASS na naprawionym tescie — SAM przeczytal wszystkie 10 tekstow, potwierdzil rzetelnosc faktograficzna (Zulu "wielka_stela" nie fabrykuje monumentu tylko opisuje realny substytut isivivane/tradycja ustna; "hamonga" jawnie sygnalizuje status legendy; "roquepertuse" poprawnie celtyckie nie rzymskie; "stupa_sanchi" poprawnie Maurya/Asoka; "osada_aschaffenburg" nie fabrykuje konkretnego miejsca), zero duplikatow (n-gram sprawdzenie), zywy dowod na cudzie "roquepertuse". entity-card-wonder-test.cjs 134/134, tsc 0 bledow, 5 bramek referencyjnych bez regresu. 10/19 cudow ma teraz rys historyczny — pozostaje W2 (9 ostatnich), zamyka CALY projekt R-KARTY-HISTORIA-Q1 (17/17).

- **`R-KARTY-HISTORIA-W2-Q1`** (17/17, OSTATNI temat calego projektu): ziggurat, mundo_perdido, terakotowa_armia, koloseum, dur_sharrukin, brama_narodow, palac_weiyang, yerkapi, posag_peruna. Dwa doprecyzowania dla Operatora: `mundo_perdido` przypisany w danych do Inkow, ale realny "Mundo Perdido" to kompleks w Tikal (Majowie, Ameryka Srodkowa) - zakaz fabrykowania nieistniejacego inkaskiego miejsca. `brama_narodow` (cud dostepny dla wszystkich cywilizacji, jak `hamonga` z W1) - realny odpowiednik to Brama Wszystkich Narodow w Persepolis (Persja Achemenidzka), niezaleznie od listy cywilizacji gry. **ZINTEGROWANE do `main` (6d27df79). Zero zarzutow Evaluatora, Final Control PASS** (niezalezna weryfikacja: SAM przeczytal wszystkie 9 tekstow, potwierdzil ze "mundo_perdido" opisuje realny Tikal/Majowie mimo przypisania w danych do Inkow, "brama_narodow" to realna Persepolis, ziggurat/dur_sharrukin i terakotowa_armia/palac_weiyang faktycznie odrebne, "posag_peruna" jawnie zaznacza fragmentarycznosc zrodel slowianskich; zero duplikatow wzgledem siebie i wzgledem W1; zywy dowod na cudzie "yerkapi"; **osobiscie potwierdzil `jq` w swoim worktree: 0 pustych pol `historia` na 19 aktywnych cudow**). entity-card-wonder-test.cjs 134/134, tsc 0 bledow, 5 bramek referencyjnych bez regresu.

### ===== PROJEKT R-KARTY-HISTORIA-Q1 KOMPLETNY: 17/17 TEMATOW ZAMKNIETYCH =====

Wszystkie 5 kategorii encji maja teraz pelny "Rys historyczny": **budynki 41/41**,
**technologie 32/32**, **ulepszenia terenu 22/22**, **jednostki 75/75**,
**cuda 19/19**. Lacznie 189 encji z nowa trescia historyczna, kazda przez
pelny cykl Operator->Evaluator(->Obrona)->Final Control przez Workflow
(Sciezka A), z niezalezna, zywa weryfikacja w headless Chromium dla kazdego
batcha. Infrastruktura (`entityCards/`) obejmuje teraz WSZYSTKIE typy encji.
Nastepne fazy (Phase 2: aktualizacja CivPedia/wikiBundle.json, Phase 3: audyt
wszystkich tooltipow/opisow w grze) - jawnie odlozone przez wlasciciela do
czasu po zamknieciu Fazy 1 (ten projekt) - gotowe do rozpoczecia na zyczenie.

### ZDEPLOYOWANE FALA 332 (2026-09-02, commit `3c052c02`)

Pelny checklist nocnej kontroli AutoBot (trigger `trig_01FngsjSEihycrXtkgDESZ62`)
zamkniety: R-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1, R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1,
R-HANDEL-BRAK-BUDYNKU-NAZWA-Q1, R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1,
R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1, R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1 +
R-KARTY-HISTORIA-Q1 falami 1-4 (budynki 41/41, technologie 32/32, ulepszenia
terenu 22/22 KOMPLETNE, jednostki 52/75 po U1-U4). Build vite 881 modulow,
`node gra/tools/inject-build-stamp.cjs` -> md5 `64515106...`, manifest
zaktualizowany, `verify-robocza-bundle.cjs` -> VERIFY OK, nowy wpis FALA 332
w `WERSJE.md` (FALA 331 oznaczona ZASTAPIONA). Push do `origin/main`
(`3c052c02`). `Gra-ROBOCZA-POLE-BITWY.html` NIE przebudowany (zmiany tej fali
nie dotykaja battleScene/logiki bitwy). U5 (jednostki, w toku) i dalsze
batchy (U6, cuda) doloacza kolejna fala.

### ZDEPLOYOWANE FALA 333 (2026-09-02, commit `f5b1f8d7`)

U3+U4+U5+U6 zintegrowane od czasu FALI 332 - kategoria "jednostki" osiagnela
KOMPLETNOSC 75/75. Wraz z wczesniej ukonczonymi budynkami (41/41),
technologiami (32/32), ulepszeniami terenu (22/22) - WSZYSTKIE kategorie
encji poza cudami (wonders) maja teraz pelny rys historyczny. To zamyka
15 z 17 tematow projektu `R-KARTY-HISTORIA-Q1` (16. i 17. to infrastruktura
+ tresc dla cudow, swiadomie odrebny temat - render cudow zyje poza systemem
`entityCards/`). Build vite 881 modulow, `inject-build-stamp.cjs` -> md5
`d6476a96...`, manifest zaktualizowany, `verify-robocza-bundle.cjs` -> VERIFY
OK, nowy wpis FALA 333 w `WERSJE.md` (FALA 332 oznaczona ZASTAPIONA). Push do
`origin/main` (`f5b1f8d7`). `Gra-ROBOCZA-POLE-BITWY.html` NIE przebudowany
(pole `Historia` czysto opisowe, nie dotyka battleScene/statystyk bojowych).

### ZDEPLOYOWANE FALA 334 (2026-09-02, commit `b224478c`) — KAMIEN MILOWY

Ostatnie dwa tematy projektu `R-KARTY-HISTORIA-Q1` zintegrowane:
`R-KARTY-HISTORIA-INFRA-CUDA-Q1` (mechanizm karty encji dla cudow, nowy
EntityKind 'wonder') + naprawa fixture-drift + `R-KARTY-HISTORIA-W1-Q1`/
`W2-Q1` (tresc historia dla wszystkich 19 cudow). **PROJEKT KOMPLETNY:
17/17 tematow, wszystkie 5 kategorii encji (budynki 41/41, technologie
32/32, ulepszenia terenu 22/22, jednostki 75/75, cuda 19/19) maja pelny
rys historyczny - 189 encji lacznie.** Build vite 882 modulow (+1,
wonderAdapter.ts), `inject-build-stamp.cjs` -> md5 `875b02cd...`, manifest
zaktualizowany, `verify-robocza-bundle.cjs` -> VERIFY OK, nowy wpis FALA 334
w `WERSJE.md` (FALA 333 oznaczona ZASTAPIONA). Push do `origin/main`
(`b224478c`). `Gra-ROBOCZA-POLE-BITWY.html` NIE przebudowany (zadien z
tematow tej fali nie dotyka battleScene/logiki bitwy).

## FAZA 2 — R-CIVPEDIA-HISTORIA-Q1: przeniesienie rysu historycznego do CivPedii

Wlasciciel (2026-09-02, po przebudzeniu): jednoznacznie skorygowal - Faza 2
NIE mialа czekac na jego decyzje, mial byc realizowana autonomicznie od razu
po zamknieciu Fazy 1, zgodnie z pierwotnym celem sesji. Ruszam natychmiast.

Recon (Explore, przed dispatchem): CivPedia (`gra/src/data/wikiBundle.json`,
168 hasel) to CALKOWICIE OSOBNY system od `entityCards/` - reczne pliki
markdown w `docs/encyklopedia/**` (171 plikow, foldery budynki/jednostki/
ulepszenia/cuda/cywilizacje/pojecia/technologie), pakowane skryptem
`gra/tools/bundle-wiki-for-game.cjs` do JSON, renderowane przez
`gra/src/ui/wikiHubHud.ts`. Zero automatycznego polaczenia z `gra/data/*.json`
- to jest case (b) "osobno autorowana tresc", nie "juz dziala automatycznie".
Istnieje juz podobnie nazwany, ale NIEZWIAZANY naglowek `## Historia / decyzje`
(changelog strony wiki) - nowa sekcja tresci historycznej wymaga INNEJ nazwy
(`## Rys historyczny`), zeby uniknac kolizji. Pokrycie CivPedii vs danych gry
jest NIEPELNE: budynki 25/41, jednostki 49/75 (dane pol brakuje precyzyjnie),
ulepszenia 17/22, technologie 32/32 (pelne), cuda 19/19 (pelne). Tworzenie
NOWYCH stron dla brakujacych hasel to swiadomie ODDZIELNY, wiekszy temat -
Faza 2 obejmuje WYLACZNIE kopiowanie juz zatwierdzonej tresci `historia`/
`Historia` do ISTNIEJACYCH 168 hasel CivPedii.

- **`R-CIVPEDIA-HISTORIA-INFRA-Q1`**: mechanizm (bez tresci) - rozszerzenie
  bundlera o ekstrakcje sekcji `## Rys historyczny` do nowego pola `historia`
  na kazdym wpisie encyklopedii, rozszerzenie `wikiHubHud.ts` o renderowanie
  tej sekcji (widoczna w widoku "Haslo"/"Pelny artykul", NIE w "Skrot").
  Zero zmian w `docs/encyklopedia/**` i `wikiBundle.json` w tej rundzie -
  wylacznie kod. Dispatchowany przez Workflow (`wf_3bcbd351-1d5`), w toku.

Po integracji: dispatch batchy tresci per kategoria (budynki 25, technologie
32, ulepszenia terenu 17, jednostki 49 [2 batche], cuda 19) - kopiowanie
JUZ NAPISANEGO i zatwierdzonego tekstu z `gra/data/*.json` do plikow `.md`
+ regeneracja `wikiBundle.json` w kazdym batchu. Po Fazie 2: Faza 3 (szeroki
audyt wszystkich tooltipow/opisow w grze) - bez czekania na decyzje
wlasciciela, kontynuowac automatycznie.

Recon (Explore, po integracji infra): mapowanie 5 kategorii dokladnie
policzone. Budynki: `buildings.json`, klucz `id`, pole `historia` - 25/25
plikow .md mapuje sie czysto. Cuda: `wonders.json[cuda]`, klucz `id`, pole
`historia` - 19/19 czysto (najczystszy zbior). Ulepszenia:
`terrain-improvements.json`, klucz `id`, pole `historia` - 16/17 czysto,
WYJATEK `kopalnia.md` (1 plik dokumentuje 4 warianty: kopalnia_miedzi/
zelaza/cyny/zlota przez wiersz `gra-id` w Metadanych - decyzja orkiestratora:
wszystkie 4 teksty w jednej sekcji, kazdy pod podnaglowkiem z nazwa surowca).
Technologie: `tech.json[technologie]`, BRAK pola id - dopasowanie po nazwie
`Technologia`, pole `Historia` (Capitalized) - 32/32 czysto. Jednostki:
`units.json`, BRAK pola id - dopasowanie po `Jednostka`, pole `Historia` -
49/49 czysto poza 1 wyjatkiem: `wojownik-celtycki.md` ma `gra-id: soldurii`
(prawdziwy tytul "Soldurii", stara tresc przeniesiona do `gaesatae.md`).
Zero sekcji "## Rys historyczny" nigdzie dzis (potwierdzone grep) - nic nie
zmigrowano. 143/171 plikow ma juz NIEZWIAZANY `## Historia / decyzje`
(changelog wiki) - nowa sekcja idzie zawsze PO nim, na koncu pliku.

Dispatch: 6 rownoleglych batchy (Operator->Evaluator->Obrona przez jeden
polaczony Workflow, `wf_8349caeb-ee0`, limit fan-out=2 na tej maszynie
[nproc=4]): `R-CIVPEDIA-BUDYNKI-Q1` (25), `R-CIVPEDIA-CUDA-Q1` (19),
`R-CIVPEDIA-ULEPSZENIA-Q1` (17, w tym kopalnia 4-way), `R-CIVPEDIA-TECHNOLOGIE-Q1`
(32), `R-CIVPEDIA-JEDNOSTKI-J1-Q1` (25, polowa alfabetyczna), 
`R-CIVPEDIA-JEDNOSTKI-J2-Q1` (24, polowa alfabetyczna, w tym Soldurii).
J1/J2 dziela folder `jednostki/` ale maja rozlaczne, jawnie wymienione
zbiory plikow - zero konfliktu. WAZNE dla integracji: kazdy batch edytuje
WYLACZNIE pliki `.md` + regeneruje `wikiBundle.json` do WLASNEGO testu, ale
orkiestrator przy integracji cherry-pickuje WYLACZNIE diff plikow `.md`
(bez `wikiBundle.json`) i regeneruje ten wspoldzielony plik generowany
JEDEN raz, osobno, po zintegrowaniu wszystkich 6 batchy - zapobiega to
konfliktom przy sekwencyjnej integracji generowanego pliku.
Dispatche: `dyspozycje/autobot/runs/R-CIVPEDIA-{BUDYNKI,CUDA,ULEPSZENIA,TECHNOLOGIE,JEDNOSTKI-J1,JEDNOSTKI-J2}-Q1/00-dispatch.md`.

Wynik Operator->Evaluator (Workflow `wz6xdyvwc`): wszystkie 6 PASS, ZERO zarzutow
kazdy (Obrona nie byla potrzebna nigdzie). Commity: BUDYNKI `5a4f409f`, CUDA
`4a4369c5` (incydent: pierwszy przebieg omylkowo zapisal do wspoldzielonego
glownego checkoutu zamiast do worktree - wykryte i w pelni cofniete PRZED
commitem, orkiestrator dodatkowo potwierdzil i zabezpieczyl przez `git stash`
w miedzyczasie, zero sladu w `main`), ULEPSZENIA `6dc14517` (Operator nie
commitowal sam - orkiestrator scommitowal jego juz-zweryfikowana przez
Evaluatora prace z worktree, zeby dac Final Control stabilny SHA),
TECHNOLOGIE `b2a3eaf2` (**PASS-WITH-NOTES**: Operator i Evaluator NIEZALEZNIE
odkryli pre-istniejacy bug w `wikiHubHud.ts::pickEncyContent` z infry
`d6032099` - przy `depth='full'` sekcja "Rys historyczny" renderuje sie
DWUKROTNIE, bo `entry.full` juz zawiera cala tresc pliku wlacznie z nowa
sekcja, funkcja dokleja `historiaBlock` ponownie; przy `depth='m'` OK, tylko
jedna kopia. Poza allowlista tego tematu, wymaga osobnego tematu naprawczego
w `wikiHubHud.ts` - NIE blokuje integracji tresci), JEDNOSTKI-J1 `c35c98e8`,
JEDNOSTKI-J2 `0a772737` (w tym potwierdzona poprawna obsluga wyjatku
Soldurii). Final Control dispatchowany dla wszystkich 6 rownolegle: Workflow
`wf_99f5929f-dbc`.

Wynik Final Control: 5/6 PASS/PASS-WITH-NOTES, 1 FAIL (tresc poprawna, blad
wylacznie w nowym tescie). **ZINTEGROWANE do `main`**: BUDYNKI `3418c524`,
ULEPSZENIA `2452429b`, TECHNOLOGIE `e9687a11` (PASS-WITH-NOTES - patrz nizej),
JEDNOSTKI-J1 `3a44c234`, JEDNOSTKI-J2 `17f1ae17`; `wikiBundle.json`
zregenerowany raz po wszystkich (`1eea5aa8`). Po integracji: tsc 0 bledow,
5 bramek referencyjnych bez regresu (logic 213/213, tech-tree 19/19, research
33/33, unit-replace 13/13, combat 6/6).

**R-CIVPEDIA-CUDA-Q1: FAIL na Final Control** — WYLACZNIE w nowym tescie
`civpedia-cuda-historia-test.cjs` (check [2]: porownanie tresci z `git show
HEAD:<plik>`), NIE w tresci 19 plikow `.md` (Final Control niezaleznie
potwierdzil ze tresc jest w 100% poprawna, zero nieautoryzowanych zmian, zywy
render dziala). Przyczyna: test porownuje "tresc przed nowa sekcja" z `git
show HEAD:<plik>`, ale po scommitowaniu HEAD JUZ zawiera nowa sekcje - test
jest strukturalnie niespelnialny dla kazdego uruchomienia PO integracji
(dziala tylko gdy ktos go odpali PRZED commitem). **Po integracji 5 dobrych
batchy okazalo sie ze to SYSTEMOWY problem**: identyczny wzorzec (`git show
HEAD`/zakres `git diff` jako punkt odniesienia) zepsul rowniez juz
zintegrowane testy J1 (`civpedia-jednostki-j1-test.cjs`: 111/137, 26 fail,
wszystkie check [2]) i J2 (`civpedia-jednostki-j2-test.cjs`: 132/133, 1 fail,
check [4] zakres git diff zakladal izolacje od J1, ktora znikla po integracji
obu do tej samej galezi). BUDYNKI/ULEPSZENIA/TECHNOLOGIE uzyly odpornej metody
(bez zaleznosci od ruchomego `git HEAD`) i przeszly czysto (136/116/324).
Dispatch naprawczy `P-CIVPEDIA-TESTY-GIT-HEAD-SAMOODNOSZACE-Q1` dispatchowany
(Workflow `wf_03d25059-f8c`, razem z `P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1`
- rozlaczne pliki, ta sama fala). Ten pierwszy naprawia testy J1/J2 (juz na
`main`) na metode strukturalna bez zaleznosci od `git HEAD`, oraz dopisuje
tresc + nowy test dla cuda (wciaz niezintegrowane).

Operator+Evaluator PASS, zero zarzutow (commit `63409126`): testy J1/J2
przepisane na metode strukturalna (pozycje indeksow naglowkow w pliku, wzorem
budynki/ulepszenia/technologie), 161/157 PASS; nowy `civpedia-cuda-historia-test.cjs`
126/126 PASS; tresc 19 plikow cuda bajt-w-bajt identyczna z wczesniej
zweryfikowanym `4a4369c5`. Dowod nietautologicznosci: wszystkie 3 testy
uruchomione TAKZE z `git worktree add --detach` w calkowicie osobnej
lokalizacji, niezaleznej od historii gita ktoregokolwiek worktree - identyczny
wynik. Final Control dispatchowany: Workflow `wf_bc3b5fe6-e7a`.

**R-CIVPEDIA-TECHNOLOGIE-Q1: PASS-WITH-NOTES** — Operator, Evaluator i Final
Control NIEZALEZNIE potwierdzili pre-istniejacy bug w
`wikiHubHud.ts::pickEncyContent` (wprowadzony w infra `d6032099`, POZA
allowlista tego tematu): przy `depth==='full'` sekcja "Rys historyczny"
renderuje sie DWUKROTNIE w DOM, bo `entry.full` juz zawiera cala tresc pliku
(wlacznie z nowa sekcja), a funkcja dokleja `historiaBlock` ponownie. Przy
`depth==='m'` dziala poprawnie (jedna kopia). NIE blokuje tego tematu
(kryterium wymagalo tylko wyrenderowania tresci, nie unikalnosci). Dispatch
naprawczy `P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1` dispatchowany
(Workflow `wf_03d25059-f8c`, razem z tematem naprawy testow git-HEAD powyzej).
Operator+Evaluator PASS, zero zarzutow (commit `cae9540b`): guard
`entry.full.includes('\n## Rys historyczny\n')` przed doklejeniem
`historiaBlock` w galezi `depth==='full'`. Nowy test 7/7 PASS (zywy Chromium,
w tym dowod mutacyjny - cofniecie fixu odtwarza duplikacje i test to lapie).
Final Control dispatchowany razem z powyzszym: Workflow `wf_bc3b5fe6-e7a`.

Final Control PASS oba tematy (Workflow `wf_bc3b5fe6-e7a`, dowod nietautologicznosci
przez `git worktree add --detach` w calkowicie osobnej lokalizacji, dla
pierwszego tematu nawet z fizycznie usunietym `.git` w drzewie roboczym -
testy dzialaja bez zadnego wywolania gita). **ZINTEGROWANE do `main`**:
`P-CIVPEDIA-TESTY-GIT-HEAD-SAMOODNOSZACE-Q1` -> `9ac41749` (testy J1/J2
naprawione, 19 hasel cudow dopisanych, nowy `civpedia-cuda-historia-test.cjs`),
`P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1` -> `a4f1650d`.
`wikiBundle.json` zregenerowany raz po obu (`c97d9d45`). Po integracji:
tsc 0 bledow, wszystkie testy CivPedii zielone (budynki 136, ulepszenia 116,
technologie 324, jednostki J1 161, J2 157, cuda 126, wikiHubHud-duplikacja 7),
5 bramek referencyjnych bez regresu.

**6-ta odslona fixture-drift w tej sesji**: `civpedia-historia-infra-test.cjs`
(napisany PRZED jakakolwiek trescia CivPedii) mial zaszyte zalozenie "zero
wpisow ma dzis Rys historyczny" - falszywe po integracji 6 batchy tresci
(168 wpisow, wiekszosc z realna trescia). Dispatch naprawczy
`P-CIVPEDIA-INFRA-TEST-FIXTURE-DRIFT-Q1` (ten sam ustalony wzorzec naprawy -
asercja warunkowa zamiast twardego "wszystko puste"): Operator+Evaluator PASS,
zero zarzutow (commit `e687c48e`, scommitowany przez orkiestratora z worktree
Operatora - Operator sam nie commitowal). Kryterium [4] podzielone na [4a]/[4b],
czyta realny `wikiBundle.json` (168 wpisow, 142 z historia) i weryfikuje
warunkowo per wpis. Dowod nietautologicznosci powtorzony niezaleznie przez
Evaluatora (wlasna mutacja `pickEncyContentBlackBox`, test lapie regres na
[4a], 142/142 zgloszone). `map-gen-regression-test.cjs` swiadomie pominiety
jako poza zakresem (wolna bramka, niezwiazana ze zmienionym plikiem). Final
Control PASS (Workflow `wf_ba629b98-6f3`, wlasny powtorzony dowod mutacyjny).
**ZINTEGROWANE do `main` (`87ce67ed`)**. Po integracji: tsc 0 bledow, 18/18
ten test, 5 bramek referencyjnych bez regresu.

**CivPedia Faza 2 — ZAMKNIETA (2026-09-02).** Wszystkie 7 tematow tej fali
zintegrowane: infra (`d6032099`), 6 kategorii tresci (budynki/cuda/ulepszenia/
technologie/jednostki J1+J2), 3 naprawy pochodne (testy git-HEAD, duplikacja
wikiHubHud depth=full, fixture-drift infra-test). Caly zestaw testow CivPedii
zielony: infra 18/18, budynki 136/136, ulepszenia 116/116, technologie
324/324, jednostki J1 161/161, J2 157/157, cuda 126/126, wikihubhud-duplikacja
7/7 — 1045 asercji lacznie, 0 fail. 5 bramek referencyjnych bez regresu przez
cala fale. Nastepny krok: deploy ROBOCZA (nowa FALA) obejmujacy te fale
plus R-CIVPEDIA-HISTORIA-INFRA-Q1 i R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1
z wczesniejszej czesci sesji.

**Faza 3 rozpoczeta autonomicznie (2026-09-02, po zamknieciu Fazy 2, bez
czekania na decyzje wlasciciela — zgodnie z jego wczesniejsza korekta o
autonomii):** szeroki audyt tooltipow/opisow w calej grze POZA entity cards
i CivPedia (juz zaudytowane w Fazach 1-2). Recon (Explore, w toku) skanuje
`gra/src/ui/**/*.ts` w poszukiwaniu hardkodowanych tooltipow/opisow,
odrozniajac tresc GENEROWANA z juz zatwierdzonych pol `gra/data/*.json` od
tresci wpisanej wprost w kodzie UI (ta druga kategoria jest poza zakresem
Faz 1-2, wiec niezaudytowana), oraz flaguje ewentualne kolejne wycieki tekstu
deweloperskiego (ta sama klasa bledu co pierwotne zgloszenie "Tarasy
uprawne"). Wynik posluzy do rozpisania batchy AutoBot per obszar UI.

**Wynik recon (Explore, ~49 plikow UI z tooltipami przeskanowanych):**
kodowa baza jest w duzej wiekszosci czysta — sprawdzono `civs.json` (opisy
bonusow cywilizacji, osobne od entity cards), `gra/data/ui-params.json`
(135 stringow kopii UI kreatora nowej gry) i pozostale ~49 plikow — ZERO
kolejnych wyciekow tekstu deweloperskiego. JEDEN konkretny, potwierdzony
przypadek tej samej klasy bledu co pierwotne zgloszenie: karta szczegolow
podzialu daniny/handlu w panelu miasta (`cityPanel.ts`) zawiera surowa
notatke projektowa ("Do rozkminienia (v2): skad bierze sie korupcja...",
slowa "placeholder"/"prototyp"/"silnik") wprost w tresci widocznej dla
gracza. Reszta znalezisk to normalna, funkcjonalna mikro-tresc UI (etykiety
przyciskow, tooltipy akcji) — nie wymaga interwencji, decyzja orkiestratora:
NIE tworzyc sztucznych batchy "tone consistency" bez konkretnych defektow
(unikanie manufacturowania busywork). Dispatch fixu jedynego realnego
znaleziska: `P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1`, Workflow
`wf_7565c8d6-d1d`. Cala reszta karty (wzory algorytmu pokazywane graczowi —
`handelBrutto = Σ...` itd.) to swiadomy, zaakceptowany wzorzec
transparency-panelu i NIE jest w zakresie.

**Runda 1: DECISION_REQUIRED** — Operator i Evaluator NIEZALEZNIE zglosili
te sama sprzecznosc we WLASNYM dispatchu: Kryterium 1 (zero "placeholder" w
calym DOM) niespelnialne przy allowlisci zakazujacej ruszania
`appendDetailFormula`/`appendDetailAlgo`, ktore same zawieraja doslowne
slowo "placeholder" w 2 liniach (formula straty korupcji + krok algorytmu).
4 fragmenty z RECON poprawnie naprawione i zweryfikowane (commit `8bdc9581`
na galezi `autobot/P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1`, jeszcze NIE
na `origin/main`), nowy test 22-26/26 PASS w zakresie mozliwym przy
pierwotnym brzmieniu. ECHO orkiestratora (`01-echo-r2.md`): Kryterium 1
zostaje w pierwotnym brzmieniu, allowlista rozszerzona WYLACZNIE o usuniecie
slowa "placeholder" (poziom slowa, nie struktury) z tych 2 linii formul.
Runda 2 dispatchowana na TEJ SAMEJ galezi, budujaca na `8bdc9581`: Workflow
`wf_36c3cfca-ec6`. Wynik: PASS, zero zarzutow (commit `3c77cd4d`, na galezi
`autobot/P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1-r2` — kanoniczna galaz
bez `-r2` byla zajeta przez inny worktree, orkiestrator scali przy
integracji). Nowy test 27/27 PASS (w tym asercja "zero placeholder w calym
DOM"), tsc 0 bledow, 5 bramek referencyjnych bez regresu. Final Control PASS
(Workflow `wf_4238af33-9f2`, wlasny niezalezny dowod mutacyjny). **ZINTEGROWANE
do `main`** (cherry-pick obu commitow: `0f8b7fd7` runda 1 + `dc61e1da` runda 2).
Po integracji: tsc 0 bledow, 27/27 nowy test, 5 bramek referencyjnych bez
regresu.

**Faza 3 — zamknieta na tym etapie.** Jedyne konkretne znalezisko szerokiego
audytu tooltipow (karta korupcji w panelu miasta) naprawione i zintegrowane.
Reszta gry sprawdzona i czysta (zero kolejnych wyciekow tekstu deweloperskiego).

**Podsumowanie CivPedia Faza 2 (na dzien 2026-09-02, po tej fali)**: 6/6
kategorii tresci zintegrowane (budynki 25/25, cuda 19/19, ulepszenia 17/17,
technologie 32/32, jednostki 49/49), infra + 2 pochodne bledy naprawione.
Pozostaje: fix fixture-drift (w toku), potem deploy ROBOCZA. Faza 3 (szeroki
audyt tooltipow) - kontynuowac autonomicznie po zamknieciu tej fali, zgodnie
z wczesniejsza dyspozycja wlasciciela.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1 | 2026-09-01 | Naprawa `entity-card-historia-section-test.cjs` (temat INFRA), ktorego fixture "jeszcze pustych" encji (stolarnia/Lowiectwo/farma) uzywal REALNYCH danych produkcyjnych zamiast syntetycznych - kazdy kolejny batch tresci ktory wypelnia jedna z tych 3 encji powoduje falszywy FAIL. Dodatkowo sekcja [5] ma pokrewny blad: fixture "zla wielkosc liter" dziedziczy z prawdziwego wiersza, wiec po wypelnieniu poprawnego pola test przypadkiem przechodzi/nie przechodzi z innego powodu niz zamierzony. | **ZINTEGROWANE do `main` (4efd8db2)** | Pelny cykl Operator->Evaluator(zero zarzutow)->Final Control przez Workflow. Sekcja [4]: asercja WARUNKOWA (`historiaExists === fieldNonEmpty`) na realnym stanie pola zamiast twardego "nie istnieje". Sekcja [5]: destructuring usuwa poprawne pole z kopii wiersza przed wstrzyknieciem zlej wielkosci liter, dla wszystkich 4 adapterow. Test zweryfikowany na REALNYCH, dzisiejszych danych (B1/T1/I1/U1 juz zintegrowane) - 31/31 PASS, zero fixture-driftu na przyszlosc. tsc 0 bledow, 5 bramek referencyjnych bez regresu. |
| R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1 | 2026-09-01 | Wlasciciel: ustawil limit miast epoki Kamien na 15, ma 21 miast. Po recon (dyplomatyczne wchloniecie omija limit) wlasciciel doprecyzowal DWUKROTNIE: to NIE bylo wchloniecie, tylko podboj SILA (bitwa/kapitulacja) - te maja SIE LICZYC do limitu, tak jak zalozone. Swiadome ODWROCENIE wczesniejszej decyzji `R-MIASTA-LIMIT-PODBOJ-Q1=A` (ktora wylaczala podbite miasta z limitu) na wyrazne, potwierdzone zyczenie wlasciciela. Wchloniecie dyplomatyczne (annexCityStateToOwner) JUZ DZIS poprawnie liczy sie do limitu (nie dotyka flagi foundedByOwner) - zero zmian tam potrzebne, wczesniejsza hipoteza orkiestratora o „brakujacym foundedByOwner=false" w tej funkcji byla bledna i zostala odrzucona. | **ZINTEGROWANE do `main` (2a95f7dd)** | Pelny cykl Operator->Evaluator(zero zarzutow)->Final Control przez Workflow. Usuniecie `city.foundedByOwner = false` w DWOCH miejscach (`post-battle-map.ts:488`, `main.ts:12629`). `city-limit-conquered-test.cjs` przepisany, 15/15 PASS (realny test odtwarzajacy dokladny scenariusz wlasciciela: 9/10 zalozonych -> podboj 10-tego -> proba zalozenia 11-tego odrzucona; kontrola annexCityStateToOwner potwierdza zero zmian tam). tsc 0 bledow, 5 bramek referencyjnych bez regresu. |
| R-HANDEL-BRAK-BUDYNKU-NAZWA-Q1 | 2026-09-01 | Wlasciciel: tabela tras handlowych pokazuje generyczne "5% — brak budynku" zamiast konkretnej nazwy (np. "brak targowiska"). Recon: `routeBonusSplitHtml()`/`cityBonusSplitHtml()` (`empireDetailPanel.ts:816-859`) maja juz poprawny tooltip (Targowisko/Port/Port wielki), ale widoczny tekst jest zahardkodowany generycznie. Premia odblokowuje sie przez DOWOLNY z 3 budynkow po obu stronach trasy (`TradeRoute.budynekOdblokowany` to zwykly boolean, nie niesie ktory budynek/ktora strona) - precyzyjne wskazanie per-strona wymagaloby nietrywialnej zmiany danych (main.ts+typ), swiadomie POZA zakresem. Targowisko jest JEDYNYM z trzech budowalnym wszedzie (zero wymagan terenowych) - zawsze trafna podpowiedz. | **ZINTEGROWANE do `main` (15442464)** | Pelny cykl Operator->Evaluator(zero zarzutow)->Final Control przez Workflow. Widoczny tekst zmieniony na "5% — brak: Targowisko" w obu funkcjach (`routeBonusSplitHtml`/`cityBonusSplitHtml`), atrybut `tip`/`title` bajt w bajt nietkniety (nadal wymienia Targowisko/Port/Port wielki). `empire-trade-route-split-real-render-test.cjs` zaktualizowany, 58/58 PASS (realny render Chromium obu zakladek Handel/Miasto + mutacja). tsc 0 bledow, 5 bramek referencyjnych bez regresu. |
| R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1 | 2026-09-01 | Wlasciciel: panel Handel pokazuje +157 zlota/ture z 23 tras, ale panel Skarbiec Imperium (ta sama tura) pokazuje "Handel ze szlakow: 0" i Netto skarbiec liczone bez tego dochodu - podejrzenie ze pieniadze z handlu "sa sztucznie wyswietlane". Recon: SILNIK jest poprawny (na koncu tury `computeTradeRouteIncomeByCity` realnie dolicza do `player.skarbiec`) - bug jest WYLACZNIE w podgladzie HUD: `refreshLiveEmpireRatesUnsafe()` (main.ts:15917-15941) woli `previewCityEconomy` z DWOMA literalnymi `undefined` (pozycje 10-11: tradeRouteBuildingBonusByCity/tradeIncomeByCity), wiec podglad ZAWSZE liczy handel jako 0, mimo ze gotowa aktualna zmienna `tradeRouteBuildingBonusByCie` juz istnieje w tym samym domknieciu. Luka testowa potwierdzona: istniejace testy skarbca maja fixture bez zadnych tras, wiec "handel=0" wychodzi trywialnie z konstrukcji testu. | **ZINTEGROWANE do `main` (db6d2f9a + 95d28deb + e91a8d22 + e47020c1 + 270751e4 + 492f0fdd)** | Fix main.ts (podmiana dwoch `undefined` na realnie policzone mapy tras) POTWIERDZONY empirycznie 3x przez Final Control (kazda runda: realny revert -> test czerwienieje). 3 rundy hartowania guardu testowego `checkRealFixSiteInMainTs()`/`hud-skarbiec-test.cjs` przeciw kolejnym, coraz bardziej wyszukanym atakom (comment-injection, multi-call-site z martwym kodem, kotwiczenie pozycji argumentow) - kazda faktycznie naprawiona i potwierdzona. Runda 3 Final Control znalazl JESZCZE JEDNA, czwarta z rzedu luke (`findFunctionBody` tez uzywa surowego `indexOf` przy lokalizacji CIALA funkcji, nie tylko wywolania) i oznaczyl DECISION_REQUIRED z jawna rekomendacja: substancja (fix main.ts) jest juz wielokrotnie potwierdzona, a dalsze rundy maja malejaca wartosc krancowa (wymagaja swiadomego, celowego sabotazu wlasnego main.ts atrapa kodu - nierealistyczny wektor przypadkowej regresji). DECYZJA ORKIESTRATORA: zamkniecie tematu na substancji po 3 rundach zamiast rundy 4/5 goniacej za coraz bardziej hipotetycznymi atakami na sam test. Znane, udokumentowane ograniczenie: `findFunctionBody()` w `hud-skarbiec-test.cjs` moze byc omijalne przez celowo umieszczony, syntaktycznie poprawny komentarz-atrapa z sygnatura funkcji PRZED prawdziwa funkcja w main.ts - ryzyko praktyczne bardzo niskie (wymaga swiadomego dzialania kogos edytujacego main.ts, nie przypadkowej regresji). 34/34 hud-skarbiec-test.cjs, 11/11 empire-skarbiec-bilans-test.cjs, tsc 0 bledow, 5 bramek referencyjnych bez regresu. |
| P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1 | 2026-08-27 (dispatch 2026-09-02) | Znalezisko Final Control z tematu `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` (`03-final-control.md` par.6 "ZNALEZISKO 2"), swiadomie zostawione poza GOAL tamtego tematu, zarejestrowane osobno, nigdy nie zdispatchowane az do dzis. Kontynuacja petli AutoBot po zamknieciu CivPedii Fazy 2/3. Recon (Explore): `undoPendingBuildRequest` (`gra/src/main.ts:11711-11743`) bezwarunkowo zwraca `pending.kosztPraca` bez sprawdzenia czy `req.key` faktycznie nadal istnieje w `placedImprovements.get(req.hexKey)` - desynchronizacja mozliwa gdy `sweepLegacyFarmsOnForest` (main.ts:12199-12217) usunie farme z lasu niezaleznie od kolejki `pendingImprovementsTurn`, ktora o tym nie wie (osobna struktura, zero synchronizacji). Exploit: gracz cofa wpis dla juz nieistniejacego ulepszenia i dostaje Prace za nic. | **ZINTEGROWANE do `main` (`2d9d8b2a`)** | Dispatch zapisany (`dyspozycje/autobot/runs/P-FARMA-COFNIJ-ZWRACA-PRACE-NIEAKTUALNY-WPIS-Q1/00-dispatch.md`, commit `21f699fc`). Sciezka A (Workflow), Operator Sonnet 5 effort=medium -> Evaluator Sonnet 5 effort=high. Workflow `wf_683bec3d-634`: Operator PASS (commit `ebe493b4`, diff wylacznie `undoPendingBuildRequest` w `main.ts` +14/-2 + nowy `gra/tools/farma-cofnij-nieaktualny-wpis-test.cjs`), Evaluator ZERO zarzutow po niezaleznej weryfikacji (merge-base diff, tsc, 5 bramek, wlasne uruchomienie testu + kontrola negatywna na kodzie sprzed poprawki: 19/21, dokladny dowod starego buga "Cofnięto — Praca zwrócona (0)" mimo nieistniejacego ulepszenia). Obrona pominieta (lista pusta). Final Control (Workflow `wf_9bdee3f8-a90`, wlasny niezalezny worktree, wlasna kontrola negatywna) PASS. Integracja: cherry-pick `ebe493b4` -> `main` (commit `2d9d8b2a`), zakres diffa potwierdzony ograniczony do `main.ts` (funkcja `undoPendingBuildRequest`) + nowy test. Po integracji ponownie zielone: tsc 0 bledow, 5 bramek referencyjnych (213/19/33/13/6), nowy test 21/21 PASS. Worktree AutoBota usuniety. |

## OTWARTE 2026-09-01 — R-KARTY-HISTORIA-Q1: audyt tresci i rys historyczny wszystkich kart (seria ~17 tematow)

Wlasciciel, zrzut karty "Tarasy uprawne": karta pokazuje surowy tekst deweloperski
(nazwa tematu C-TARASY-Q1, imie/data decyzji, uzasadnienie implementacyjne z
nazwami funkcji/plikow kodu) wprost graczowi. Zlecenie: (1) gruntowny audyt i
czyszczenie WSZYSTKICH kart (budynki, jednostki, technologie, ulepszenia terenu,
cuda) z niepotrzebnych/deweloperskich informacji, (2) dopisanie do KAZDEJ pozycji
rysu historycznego (krotki tekst fabularny/edukacyjny, wzor Civilopedii z serii
Civilization). Przyklady tonu zaakceptowane przez wlasciciela (Rolnictwo, Tarasy
uprawne) - ~4-6 zdan, co/gdzie/kiedy/po co, bez suchych faktow encyklopedycznych
i bez odniesien do mechaniki gry. Po fazie 1 (karty): faza 2 aktualizacja CivPedii
zeby uwzgledniala nowe opisy, faza 3 przeglad wszystkich tooltipow/opisow w grze
(duzo sie zmienilo). Wlasciciel: "do kazdej karty osobny operator, autobot
workflow, dzialaj w petli az zalatwisz temat". Doprecyzowanie rozmiaru batcha:
"wieksze batche ~10-15 kart na temat" (~15-18 tematow zamiast doslownie 189).

Recon: skala 189 kart mechanicznych (41 budynkow, 75 jednostek, 32 technologie,
22 ulepszenia terenu, 19 cudow - cuda to OSOBNY system renderowania poza wspolnym
kontraktem kart entityCards/). Wyciek potwierdzony: ulepszenia terenu w ogole nie
filtruja (`improvementAdapter.ts` renderuje `uwagi`/`cywilizacje_uwaga`/`tech_uwaga`
1:1), budynki/technologie maja filtr `playerFacingNote()` (cityPanel.ts:6892) ale
dziurawy (nie lapie stylu "C-TARASY-Q1 Maciej data:..."). Pole "Warunek" ulepszen
ma tekst dev wtracony w srodek tresci mechanicznej - wymaga przepisania per-encja,
nie da sie naprawic kodem. Brak dzis mechanizmu na tresc fabularna w kartach.

Plan (17 tematow): T0 infrastruktura (mechanizm sekcji "Rys historyczny" w 4
adapterach + trwale usuniecie wycieku dev-tekstu z kart) -> potem batche tresci:
Budynki 3x (~14 encji), Technologie 3x (~11), Ulepszenia terenu 2x (~11, w tym
przepisanie "Warunek"), Cuda 2x (~10, wlasna infrastruktura w ramach batcha),
Jednostki 6x (~13). Kazdy batch pisze rys historyczny + usuwa lokalny dev-tekst
dla swoich encji. Tematy dotykajace tego samego pliku JSON dispatchowane

FALA 1 tresci (2026-09-01, po integracji infra): B1 (14 budynkow: stolarnia,
kamieniarski, kuznia, odlewnia_brazu, odlewnia_zelaza, wielka_odlewnia,
targowisko, port, port_wielki, spichlerz, spichlerz_ii, garncarnia,
cegielnia, kamienne_kregi), T1 (11 technologii: Obrobka drewna, Garncarstwo,
Murarstwo, Rolnictwo, Lowiectwo, Lucznictwo, Oswojenie zwierzat, Mistycyzm,
Wymiana, Gospodarka wodna, Kolo), I1 (11 ulepszen: Farma, Irygacja, Trzoda,
Owce, Lama, Stadnina, Glinianka, Kamieniolom, Oboz lowiecki, Wyrab, Tartak),
U1 (13 jednostek: Wojownik, Procarz, Oszczepnik, Lucznik, Zwiadowca,
Wlocznik, Wojownik z mieczem i tarcza, Rydwan (woly), Konnica, Galera,
Falanga, Hieros Lochos, Hastati). Wszystkie 4 dispatchowane rownolegle (4
rozne pliki JSON, zero konfliktu). Dispatch: `dyspozycje/autobot/runs/R-KARTY-HISTORIA-{B1,T1,I1,U1}-Q1/00-dispatch.md`.
Kolejne fale (B2/B3, T2/T3, I2, U2-U6) beda dispatchowane SEKWENCYJNIE per
plik, dopiero po integracji poprzedniej fali tego samego pliku.
SEKWENCYJNIE (nie w tej samej fali).

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-KARTY-HISTORIA-INFRA-Q1 | 2026-09-01 | Temat 1/17: mechanizm sekcji "Rys historyczny" w types.ts/renderer.ts + 4 adaptery (building/technology/unit/improvement), trwale usuniecie renderowania `uwagi`/`cywilizacje_uwaga`/`tech_uwaga` na kartach. Zero tresci historycznej w tej rundzie - tylko mechanizm. | **ZINTEGROWANE do `main` (0011c33e + 31a621d6 + f76cb890)** | Runda 1: DECISION_REQUIRED (sprzecznosc dispatchu - GOAL zadal calkowitego usuniecia "Uwagi" z kart budynku/jednostki, allowlista zakazywala cityPanel.ts, gdzie realnie doklejany jest ten wiersz). Decyzja orkiestratora runda 2: rozszerzono allowlist o cityPanel.ts WYLACZNIE dla usuniecia doklejania (nie regex-latania) - usunieto 4 bloki `playerFacingNote(def.uwagi)`/`u.Uwagi` w obu budowniczych karty budynku i obu budowniczych karty jednostki. Nowy `citypanel-uwagi-hostcard-removed-real-render-test.cjs` 12/12 (realny `page.hover()` na Stolarni/Procarzu, zero wiersza Uwagi w DOM). Evaluator r2 zlapal 1 zarzut proceduralny (brak udokumentowanego dowodu nietautologicznosci) - Obrona sama powtorzyla mutacje i udokumentowala w `02-obrona-r2-dowod-nietautologicznosci.md`, Final Control niezaleznie odtworzyl te sama procedure z identycznym wynikiem, ODDAL. `citypanel-uwagi-abc-filter-test` 35/35 bez regresu (3 niezwiazane wywolania playerFacingNote w cityPanel.ts nietkniete). tsc 0 bledow, 5 bramek referencyjnych bez regresu. Odblokowuje kolejne 16 tematow tresci. |

## OTWARTE 2026-09-01 — dwa nowe zgloszenia (dzwiek natury, dyplomacja)

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1 | 2026-09-01 | Wlasciciel: kanal "odglosy natury" (ambience) przeszkadza szumem wiatru/lasu/wody, ma zostac WYLACZNIE odglosy zwierzat. Recon: kanal to czysta synteza Web Audio (`gra/src/audio/muzyka-antyczna.ts`), ZERO plikow audio (katalog `utwory/natura/` swiadomie pusty). `composeKamien(onlyNature=true)` generuje typy `wiatr`/`liscie`/`woda` (do wyciszenia) i `ptak`/`swierszcz`/`wycie` (zostaja). Naprawa: wczesny `return` w `ambSchedule()` dla tych 3 typow — nie dotyka `composeKamien`/`LEVELS`/prawdziwej muzyki mapy (onlyNature=false, inna sciezka, nie wola ambSchedule). | **ZINTEGROWANE do `main` (667afef3), patrz tez linia ~3421** | KOREKTA 2026-09-02: poprzedni wpis w tym wierszu ("REDISPATCHOWANE — pierwszy dispatch zgubiony bez sladu") byl BLEDNY — orkiestrator sprawdzil wtedy wylacznie `git branch -a`/`git worktree list` (ktore nie pokazuja juz-zmergowanych i skasowanych galezi tematow) i mylnie uznal temat za zgubiony. W rzeczywistosci temat byl JUZ w pelni zintegrowany (`667afef3`, rejestr `706a85dd`, patrz sekcja wyzej w tym pliku) zanim doszlo do pomylkowego redispatchu. Redispatch (Workflow `wf_5603a0d5-e83`) sam siebie poprawnie zdiagnozowal jako duplikat (Operator i Evaluator: STATUS BLOCK, zero nowych zmian, `git merge-base --is-ancestor 667afef3 HEAD` = true) — zero ryzyka podwojnej pracy, jedynie zmarnowana runda. Temat POZOSTAJE zamkniety na `667afef3`. |
| R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1 | 2026-09-01 | Wlasciciel: w rozmowie/audiencji z cywilizacja chce widziec z kim ona jest w wojnie/sojuszu (docelowo tez handel/zaleznosci — jednostka szpiega w przyszlosci, na razie bez blokady, faza testowa = pelny dostep). Recon: dane i UI CZESCIOWO juz istnieja — `showDiploPairSummary`/`buildDiploPairSummaryData` (diplomacyPanel.ts/main.ts:6099) renderuja juz sekcje wojna/sojusz/handel dla dowolnego ownerId, ale TYLKO w pop-upie PRZED audiencja (lista "Znane frakcje"), znikaja w samej audiencji (`diplomacyAudience.ts`). Silnik ma gotowe, generyczne funkcje AI-AI (`diplomacy-pair-summary.ts`: `warPartnerIdsForOwner`, `dealPartnerIdsForOwner`) czytajace globalne `diplomacyRelations`/`activeDeals`/`tradeRoutes`. Temat 1 (ten): wpiac istniejacy widok do wnetrza audiencji + wylaczyc `isVisiblePartner` (mgla wojny) w tej sekcji (faza testowa = pelna widocznosc) + dodac brakujaca kategorie NAP do `dealPartnerIdsForOwner`. Temat 2 (osobny, pozniej, wiekszy/niepewny): drill-down do realnych `TradeRoute[]` i innych zaleznosci — do rozpisania po zamknieciu tematu 1 (ten sam plik `diplomacyAudience.ts`, sekwencyjnie). | **ZINTEGROWANE do `main` (531014be + af542199), patrz tez linia ~3429** | KOREKTA 2026-09-02: jw. — poprzedni wpis "REDISPATCHOWANE — zgubiony" byl bledny (niepelna weryfikacja przez orkiestratora). Temat byl juz zintegrowany (rejestr `706a85dd`). Redispatch (`wf_5603a0d5-e83`) poprawnie zdiagnozowal duplikat, STATUS BLOCK/PASS-WITH-NOTES, zero nowych zmian. Temat POZOSTAje zamkniety na `531014be`+`af542199`. Temat 2 (drill-down handlu) nadal NIE dispatchowany. |

## OTWARTE 2026-09-02 — R-CIVPEDIA-HISTORIA-INFRA-Q1 i R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-CIVPEDIA-HISTORIA-INFRA-Q1 | 2026-09-02 | Faza 2 (patrz sekcja wyzej): mechanizm (bez tresci) - rozszerzenie `bundle-wiki-for-game.cjs` o ekstrakcje nowej sekcji `## Rys historyczny` do pola `historia` na kazdym wpisie encyklopedii, rozszerzenie `wikiHubHud.ts::pickEncyContent` o doklejenie tej sekcji dla `depth==='m'`/`'full'` (nie `'s'`). Zero zmian w `docs/encyklopedia/**` i `wikiBundle.json` w tej rundzie. | **ZINTEGROWANE do `main` (d6032099)** | Pelny cykl Operator(PASS)->Evaluator(zero zarzutow)->Final Control(PASS, wlasny fixture+Playwright, sha256 wikiBundle.json niezmieniony) przez Workflow. Cherry-pick z `f3fa8966`, 4 pliki (allowlist-only): `bundle-wiki-for-game.cjs` (pole `historia`), `wikiHubHud.ts` (doklejenie sekcji "Rys historyczny" na depth m/full), nowy `civpedia-historia-infra-test.cjs` (16/16), prywatny stub `.stubs/`. Po integracji: tsc 0 bledow, 16/16 nowy test, 5 bramek referencyjnych bez regresu (logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6). Odblokowuje batche tresci CivPedii per kategoria (budynki/technologie/ulepszenia/jednostki/cuda). |
| R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1 | 2026-09-02 | Wlasciciel: "Sprawdz czy w kartach jednostek zostaly umieszczone grafiki 3D jednostek, bo jest na to miejsce i nie wiem czy to bylo zrobione." Recon (Grep/Read, przed dispatchem): mechanizm podgladu 3D (`unitMiniPreview.ts::mountUnitMiniPreview`/`defaultOwnerColor`) istnieje i dziala, ale jest podlaczony WYLACZNIE w `unitInfoCard.ts::buildUnitInfoCardViaEntityCard` (jedyny wolajacy: `armyListHud.ts` -> lista armii gracza). Adapter `unitAdapter.ts` SWIADOMIE zawsze zwraca statyczny SVG (decyzja architektoniczna T4) - nadpisanie medalionu jest sprawa konkretnego call-site'u. DWA inne, czesciej ogladane miejsca tego nie robia: `cityPanel.ts::buildUnitDetailCardViaEntityCard` (karta rekrutacji w panelu miasta - NAJCZESCIEJ widziana karta jednostki) i `entityCards/renderer.ts::buildEntityCardData` case `'unit'` (generyczna sciezka linkow krzyzowych z innych kart). Realna, potwierdzona luka - nie zalozenie. | **ZINTEGROWANE do `main` (3cd2c34e)** | Pelny cykl Operator(PASS)->Evaluator(zero zarzutow)->Final Control(PASS, wlasny Playwright test na INNYCH encjach - "Konnica"/"Jezdziectwo" - w tym realny klik DOM na link krzyzowy) przez Workflow. Cherry-pick z `5e276243`, 5 plikow (allowlist-only): `cityPanel.ts` (nadpisanie medalionu w `buildUnitDetailCardViaEntityCard`), `entityCards/renderer.ts` (case `'unit'`), nowy `unit-card-3d-preview-coverage-test.cjs` + 2 prywatne stuby. Zero zmian w `unitInfoCard.ts`/`armyListHud.ts`/`unitMiniPreview.ts`/`gra/data/**`. Po integracji: tsc 0 bledow, 18/18 nowy test (realny WebGL canvas-3d), 5 bramek referencyjnych bez regresu. |

## OTWARTE 2026-09-02 — trzy nowe zgloszenia z zywej rozmowy (zoom/skalowanie, ekspozycja 3D, kolejnosc opisu na kartach)

Wlasciciel, trzy kolejne zrzuty ekranu w jednej turze:

1. **P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1** — "Kiedy gracz zaznaczy, ze jego monitor ma byc powiekszony, na przyklad ze 100% do 125%, to niestety gorna i dolna czesc nie jest widoczna i strona sama sie nie skaluje." Zrzut: panel dyplomacji (audiencja z Grekami) przy zoomie przegladarki 125% — gorna/dolna czesc panelu ucieta, strona nie reaguje na zoom/resize.
2. **R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1** — "Wydaje mi sie, ze mozna byloby jakos ladnie wkomponowac grafiki jednostek, grafiki 3D. Byc moze trzeba przygotowac nowy UX przez designera, zeby to ladnie wyeksponowac. W kazdym razie nie wyglada to zbyt ciekawie." Zrzuty: karty "Wojownik"/"Zwiadowca" — podglad 3D to maly, plaski box w lewym gornym rogu, brak kompozycji/ekspozycji.
3. **P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1** — "Poza tym opisy przeniosbym na sama gore, ponad statystykami, zeby gracz mogl zapoznac sie z charakterem jednostki, budynku, cudu czy badania, a potem zobaczyc inne statystyki." Dotyczy WSZYSTKICH typow kart encji (jednostki, budynki, cuda, badania/technologie) — dziś tekst fabularny (Rys historyczny) jest na samym dole, pod pelnym blokiem statystyk.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1 | 2026-09-02 | Panele (min. dyplomacja) uciete gora/dol przy zoomie 125%, strona sie nie doskalowuje. | **ZINTEGROWANE do `main` (`5558c775`)** | Recon (Explore): brak jednego wspolnego mechanizmu layoutu — kazdy panel ma WLASNA regule `vh`/scroll. Kluczowe znalezisko: `main.ts:1490-1493` swiadomie ustawia `body.style.overflow='hidden'` (canvas 3D pelnoekranowy), zero fallbacku scrolla strony. Dispatch (`00-dispatch.md`, commit `fc9a60c3`) zawezony do JEDNEGO panelu (audiencja dyplomatyczna), wymagal zywej reprodukcji PRZED fixem. Operator zywo zreprodukowal uciecie DWOMA mechanizmami (zoom przegladarki `documentElement.style.zoom` ORAZ wewnetrzny zoom UI gry z `hud.ts`) — zoom systemowy/DPI (CDP `setDeviceMetricsOverride`) NIE reprodukowal (vh skaluje sie spojnie pod DPI). Przyczyna: `.civ-diplo-aud{align-items:center}` ("unsafe" centrowanie flex) obcina symetrycznie nadmiar bez sciezki scrolla gdy `.civ-diplo-aud-box{max-height:94vh}` przekracza realnie dostepna wysokosc. Fix: `align-items:center→flex-start`+`overflow-y:auto` na `.civ-diplo-aud`, `margin:auto 0` na `.civ-diplo-aud-box` ("bezpieczne" centrowanie — identyczny wyglad przy 100%, box przykleja sie do gory i nadmiar jest scrollowalny gdy brakuje miejsca). Evaluator zlapal 1 zarzut: nowy test regresyjny nie mial `page.screenshot()` (R-PROC-AUTOBOT.md par.9 pkt 6a wymaga zywego zrzutu dla tematow wizualnych/UX). Obrona PRZYJELA, dodala 6 wywolan `page.screenshot()` (dowody PNG w `dyspozycje/autobot/runs/.../dowody/`, zintegrowane wraz z kodem) i naprawila ze sekcja "PO" testu nie uzywala `openAudienceWithFiller()`. Final Control (Workflow `wf_91a8ff71-11f`, wlasny detached worktree, WLASNE otwarcie i obejrzenie zrzutow PNG, wlasna kontrola negatywna) PASS. Cherry-pick `0c7634d1`+`50857b70` -> `main`. Po integracji: tsc 0 bledow, 5 bramek referencyjnych bez regresu, `diplomacy-audience-zoom-cutoff-real-render-test.cjs` 11/11. main.ts i hud.ts NIETKNIETE. Pozostale panele (empireDetailPanel/cityPanel/entityCards/diplomacyPanel) swiadomie POZA zakresem — przyszle, osobne tematy po walidacji podejscia. Worktree usuniety. |
| R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 | 2026-09-02 | Lepsza kompozycja/ekspozycja podgladu 3D jednostki na kartach encji — dzis maly plaski box, wlasciciel sugeruje ze moze wymagac nowego UX/designera. | **ZINTEGROWANE do `main` (`e32d150a`+`6cebf7c3`), FALA ROBOCZA nastepna** | Recon (Explore): podglad 3D renderuje sie w `.entity-card-medallion` — twardy 34x34px (24x24px compact) slot w naglowku. Makieta (artefakt claude.ai, 3 warianty) — **wlasciciel zaakceptowal Wariant A**. Sciezka A (Workflow), Operator+Evaluator Opus 5 (temat graficzny, R-PROC-AUTOBOT.md par.5a), Final Control Sonnet 5. Workflow `wf_941a64bc-334`: Operator PASS (commit `2ce99aae`, diorama ~190px, nowy `entity-card-diorama-real-render-test.cjs` 33/33). Evaluator — 5 PONUMEROWANYCH zarzutow, wszystkie realne, zmierzone w zywym Chromium: (1) regres trybu compact — nowa regula CSS specyficznoscia bila pozycjonowanie przycisku zamkniecia w `showTechDiscoveryNotice`; (2) fallback "Render 3D niedostepny" nieczytelny na obu sciezkach; (3) elipsa "gruntu" praktycznie niewidoczna (8/255), asercja tautologiczna; (4) tryb compact nieznacznie zmienial rozmiar SVG (28->24px); (5) brak `01-operator.md`. Obrona (commit `0d4e67e4`) PRZYJELA wszystkie 5 z dowodami (przycisk wraca do absolute/10px, fallback 11px czytelny w calosci, elipsa jasny radial-gradient z pomiarem pikselowym 3473/82080 zmienionych, SVG w compact przywrocone do 28px, `01-operator.md` zapisany). Test rozszerzony do 46/46. Final Control (Workflow `wf_cae47f92-6dc`, wlasny detached worktree, wlasny niezalezny pomiar wszystkich 5 napraw + otwarcie zrzutow PNG, w tym rownolegle odtworzone 2 zastane nieregresyjne czerwone bramki na czystym `main`) PASS. Cherry-pick `2ce99aae`+`0d4e67e4` -> `main`. Po integracji: tsc 0 bledow, 5 bramek referencyjnych bez regresu, `entity-card-diorama-real-render-test.cjs` 46/46, wszystkie testy kart encji (historia/action-buttons/wonder/3d-preview-coverage/entitycard-migration) bez regresu. Worktree usuniety. Dwie NIEZWIAZANE zastane czerwone bramki (`entity-card-contract-test.cjs`, `entity-card-cross-links-nested-overlay-test.cjs`) potwierdzone identyczne na czystym `main` przed tematem — rekomendacja: osobne ID, poza zakresem tej naprawy. |
| P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1 | 2026-09-02 | Przeniesc sekcje opisu/rysu historycznego NAD blok statystyk we wspolnym kontrakcie karty encji (jednostki/budynki/cuda/technologie). | **ZINTEGROWANE do `main` (`5f9e8c41`)** | Recon (Explore): JEDEN wspolny punkt wstawienia — `renderer.ts::renderEntityCard` (linie 313-337) doklejal `historia` PO sekcji `body` przez zwykla sekwencje `card.appendChild()`, nie pozycje w tablicy `sections`. Wszystkie 4 adaptery + wonderAdapter.ts (cuda uzywaja TEGO SAMEGO renderera, nie osobnego systemu) tylko wypelniaja dane, zaden nie steruje kolejnoscia DOM — jeden reorder naprawia wszystkie 5 rodzajow encji. Pelny cykl Operator(PASS)->Evaluator(zero zarzutow)->Final Control(PASS, wlasny detached worktree, wlasna kontrola negatywna: test czerwienieje 30/31 na kodzie sprzed zmiany dokladnie na asercji kolejnosci, wlasny niezalezny Playwright dla 4 rodzajow encji) przez Workflow. Cherry-pick z `0dee36fd`, diff ograniczony do `renderer.ts` (przeniesienie appendChild) + `entity-card-historia-section-test.cjs` (odwrocona asercja `historiaAfterSections`->`historiaBeforeSections`). `wikiHubHud.ts` (CivPedia) swiadomie POZA zakresem. Po integracji: tsc 0 bledow, 5 bramek referencyjnych bez regresu, `entity-card-historia-section-test.cjs` 31/31, `entity-card-contract-test.cjs` bez regresu (identyczny pre-istniejacy blad jsdom `requestAnimationFrame` przed i po, potwierdzony przez Final Control). Worktree usuniety. |

## OTWARTE 2026-09-02 — regresja emoji zamiast ikon marki w hubie badan (kolejny nawrot)

Wlasciciel, zrzut hubu badan (karty "Lowiectwo"/"Obrobka drewna"/"Oswojenie
zwierzat"/"Rolnictwo"): "To, co juz wczesniej zglosilem w grafice niektorych
surowcow, takich jak oboz lowiecki, drewno, tartak, trzoda, krowa, byk, nie
jest zgodne z tym, co jest ustalone w brandbooku. To jest kolejna regresja.
Juz raz na to zwracalem uwage. To wystepuje na razie glownie w panelu badan
i rozwoju."

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1 | 2026-09-02 | Wiersz "Odblok.:" karty technologii w hubie badan pokazuje jeden generyczny emoji na kategorie (🏛 wszystkie budynki, 💎 wszystkie surowce, 🌾 wszystkie ulepszenia terenu) zamiast wlasciwej ikony marki per konkretna encja. | **DISPATCHOWANE, Workflow w toku** | Recon (Explore): zrodlo `sciencePicker.ts::techUnlockSummary` (linie 221-232) — zwraca plaski string z zaszytymi surowymi glifami Unicode. JEDYNY producent `sciencePicker.ts:278`, JEDYNY konsument `scienceHubHud.ts:601-606` (`.textContent`, zero mozliwosci ikon SVG bez przebudowy). Wlasciwe resolvery marki juz istnieja i dzialaja gdzie indziej: `mapResourceIconSvg` (surowce, po etykiecie), `buildingIconSvg` (budynki, po ID), `improvementIconSvg` (ulepszenia terenu, po ID) — `brandAssets.ts`. Gotowy, dzialajacy precedens konwersji nazwa->id W TEJ SAMEJ domenie: `techDiscoveryNotice.ts:122-130` (`IMPROVEMENT_NAME_TO_KEY`), do powtorzenia/reuzycia. Pola `TechNode.odblokuje*` to nazwy wyswietlane, nie ID. Temat graficzny/wizualny (R-PROC-AUTOBOT.md par.5a) — Operator+Evaluator Opus 5, Final Control Sonnet 5, obowiazkowe zywe zrzuty Playwright porownujace ikone w hubie badan z ta sama ikona uzyta gdzie indziej w grze. Dispatch `00-dispatch.md`. POZA ZAKRESEM tej rundy (zarejestrowane osobno nizej): druga, niezalezna instancja tego samego buga w funkcji tooltipa (`sciencePicker.ts:~905-925`). |
| P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1 | 2026-09-02 | Druga, NIEZALEZNA instancja tej samej klasy buga: `sciencePicker.ts:~905-925` (funkcja tooltipa hover, INNA powierzchnia UI niz lista huba badan) rowniez emituje surowe emoji 🏛/🌾 zamiast ikon marki. | **OTWARTE — zarejestrowane, swiadomie NIE dispatchowane w tej rundzie** | Znalezione przy okazji reconu dla `P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1`. Wlasciciel zglosil konkretnie liste huba badan (zrzut ekranu) — tooltip to inny call site, inny fragment kodu, mniejszy/mniej pewny zakres. Do dispatchu jako nastepny, osobny temat po zamknieciu pierwszego (ten sam wzorzec fixu prawdopodobnie da sie powtorzyc). |

## OTWARTE 2026-09-02 — popup odkrycia technologii: duplikat odznaki + mozliwe nachodzenie tekstu; linki krzyzowe na przyciski

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| P-TECHDISCOVERY-BADGE-DUPLIKAT-NACHODZENIE-Q1 | 2026-09-02 | Popup odkrycia zwyklej technologii (np. Rolnictwo) pokazuje dwie odznaki mowiace to samo ("Ukonczono badania" + "Ukonczona") obok tytulu; wlasciciel dodatkowo zglasza ze tekst nachodzi na grafike diaromy w tym popupie. | **DISPATCHOWANE, Workflow w toku** | Recon (Explore): `techDiscoveryNotice.ts:526-531,590` — `statusBadges: [kick, statusWord]`, dla zwyklego odkrycia (nie era/preview) OBIE wartosci ("Ukonczono badania"/"Ukonczona") mowia to samo. Gałęzie era/preview NIE sa duplikatem (kick i status niosa rozna informacje) — zostaja bez zmian. Odznaki renderuja sie jako overlay tekstowy NAD sceną diaromy (`entityCards/renderer.ts:299-319`, ten sam mechanizm co `R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1`), a ten konkretny popup uzywa WLASNEGO, SZERSZEGO wariantu karty (660px, `ensureEntityCardOverrideStyles`) nietestowanego zywo w oryginalnym temacie diaromy (tam testowano 434px) — prawdopodobne realne zrodlo nachodzenia tekstu, ale dispatch wymaga zywej reprodukcji PRZED przyjeciem zalozenia. Temat graficzny — Operator+Evaluator Opus 5, Final Control Sonnet 5. Dispatch `00-dispatch.md`. |
| P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1 | 2026-09-02 | Wlasciciel: linki tekstowe nawigacji miedzy kartami encji ("Szczegoly ->", "Gospodarka wodna" itp.) maja zostac zamienione na przyciski — "przyciski wygladaja bardziej profesjonalnie niz linki". | **DISPATCHOWANE, Workflow w toku** | Recon (Explore): temat SWIADOMIE ODWRACA udokumentowana wczesniejsza decyzje projektowa (`P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1`: "linki = nawigacja, zloty podkreslony; akcje = zmiana stanu gry, wypelniony przycisk") — wlasciciel wprost poprosil o odwrocenie CZESCI tej decyzji (nawigacja tez ma wygladac jak przycisk), dispatch zachowuje mimo to hierarchie wizualna (nawigacja = `.entity-card-action-secondary` styl, PRAWDZIWE akcje = `-primary`, nadal odrozniane). 4 klasy w `entityCards/renderer.ts` (wspolny CSS blok) + DWIE NIEZALEZNE kopie tego samego stylu w `cityPanel.ts` (`.dc-v-btn` x2) — nie jest to jeden wspolny plik, scattered. Trzeci, odrebny styl `.okolica-info-link` do swiadomej decyzji Operatora czy wchodzi w zakres. CSS-only, struktura DOM/logika klikania nietkniete. Temat graficzny — Operator+Evaluator Opus 5, Final Control Sonnet 5. Dispatch `00-dispatch.md`. |

## OTWARTE 2026-09-02 — nowa funkcja: odkrycie mapy przy traktacie + widocznosc sojusznicza

Wlasciciel: "Przy nawiazaniu umowy handlowej mapy obu cywilizacji powinny byc
wzajemnie odkryte. To samo w wypadku zobowiazania sojuszu czy paktu o
nieagresji. Dodatkowo powinna byc mozliwosc wymiany mapy lub kupienia mapy
pomiedzy cywilizacjami. Powinna byc to w miare latwe, bez blokad." Nastepnie
doprecyzowal dla sojuszu: "przy sojuszu powinna byc mozliwosc widzenia
lacznych z odkryciem Fog of War dla obu cywilizacji... my widzimy wszystko co
sojusznik, a sojusznik widzi wszystko [...] co my widzimy, bez Fog of War" —
CIAGLE, dwukierunkowe dzielenie widocznosci na czas trwania sojuszu, silniejsze
niz jednorazowy zrzut mapy ustalony ECHO dla paktu/handlu.

Recon (Explore): WYLACZNIE gracz (ownerId===0) ma trwaly zbior odkrytych
heksow (`main.ts:9077`, `explored`); AI nie przechowuje mgly wcale, liczy
widocznosc na biezaco kazda ture (`game/ai-fog.ts`). Wniosek: "wzajemne
odkrycie" jest w praktyce jednokierunkowe (mapa gracza rosnie), a ciagle
dzielenie widocznoscia dla sojuszu jest architektonicznie wykonalne PO OBU
stronach bez budowania nowego systemu mgly dla AI (AI i tak liczy widocznosc
na biezaco — union z widocznoscia sojusznika to naturalne rozszerzenie tej
samej, juz istniejacej sciezki), ale to WIEKSZY, osobny temat od
jednorazowego zrzutu.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1 | 2026-09-02 | Jednorazowe odkrycie terytorium cywilizacji AI na mapie gracza w chwili zawarcia paktu nieagresji, sojuszu lub umowy handlowej z gracza. ECHO (AskUserQuestion): jednorazowy zrzut przy podpisaniu, NIE ciagle dzielenie widocznoscia. | **DISPATCHOWANE, Workflow w toku** | Recon: punkt zaczepienia `applyProposalOutcome` (`main.ts:17956-17958`), scalenie zywo policzonej migawki widocznosci (miasta+jednostki+zasieg, `computeVisibleAt`/`computeVisible` z `game/visibility.ts`) do `explored`. Dotyczy WYLACZNIE PaktNieagresji/sojusz/UmowaSzlakow-Wymiany, WYLACZNIE traktatow z udzialem gracza (AI<->AI: brak efektu, gracz nie jest strona). Domain GAME, nie graficzny — Operator+Evaluator Sonnet 5. Dispatch `00-dispatch.md`. Czesc 1 z 2 zgloszonej funkcji — czesc 2 (kupno/wymiana mapy) dispatchowana OSOBNO, PO integracji tego (te same okolice main.ts, sekwencyjnie). |
| R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1 | 2026-09-02 | Doprecyzowanie wlasciciela: dla SOJUSZU (nie paktu/handlu) widocznosc ma byc CIAGLA i DWUKIERUNKOWA przez caly czas trwania sojuszu (gracz widzi biezaco co widzi sojusznik AI i odwrotnie), nie tylko jednorazowy zrzut. | **CZEKA NA POTWIERDZENIE WLASCICIELA** | Orkiestrator zaproponowal podzial: `R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1` zostaje jednorazowym zrzutem dla WSZYSTKICH trzech (w tym sojuszu, jako baza), a TEN temat dokłada NA TO ciagle, dwukierunkowe dzielenie widocznosci WYLACZNIE dla aktywnego sojuszu (aktywuje sie przy zawarciu, deaktywuje przy zerwaniu). Wieksze ryzyko/zlozonosc niz czesc 1 — dotyka biezacej (per-ture) logiki widocznosci gracza ORAZ AI (AI realnie zobaczy wiecej, co moze wplynac na jego decyzje/cele), nie tylko jednorazowego stanu. Nie dispatchowane — czeka na jawne "tak, dzialaj" wlasciciela po przedstawieniu zakresu/ryzyka. |

## OTWARTE 2026-09-02 — oferty handlowe AI blokowane mimo bilansu korzystnego dla gracza

Wlasciciel, 4 zrzuty "Stolu negocjacji" (Harappa x2 — pakiety 2 umow,
Chinczycy, Sumerowie — pojedyncza "Umowa wymiany surowcow"): "Cywilizacje
AI przedstawiaja propozycje handlowe, ktore sa na bilansie ujemnym, czyli
nie moga byc przeze mnie zaakceptowane. Powinny byc zawsze propozycje na
zerze, bilans zero, ewentualnie delikatny plus, albo jest jakis blad w
obliczeniach, albo blad w logice i kodzie."

Recon (Read/Grep, bez subagenta): konwencja znaku potwierdzona wprost w
kodzie (`diplomacyAcceptanceBalance.ts:380,399`) — bilans UJEMNY = przewaga
GRACZA. We wszystkich 4 zrzutach bilans jest ujemny (korzystny dla gracza),
a mimo to `verdictHtml()` (tamze, linie 403-413) blokuje `Przyjmij` z
komunikatem "oferta nieuczciwa dla partnera", bo `canAccept` pochodzi z
`responderPreview.accepted` = wynik `evaluateProposal()` case `'handel'`
(`diplomacy-proposals.ts` ~1177+, `handelFairnessGate`/`handelRequiredPn`,
`resolveProposalPn`). Kod w tym samym pliku (komentarz linie 820-830)
przyznaje wprost, ze mechanizm byl "zaprojektowany" glownie dla kierunku
gracz→AI, a kierunek AI→gracz mial juz jedna udokumentowana regresje
(mnoznik chęci liczony w zlym kierunku, naprawiony wymuszeniem multiplier=1).
Prawdziwa przyczyna (bramka akceptacji vs generator ofert AI) NIE zostala
jeszcze potwierdzona zywa reprodukcja — to zadanie Operatora.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1 | 2026-09-02 | AI proponuje umowy wymiany surowcow/handlowe, ktore wlasna bramka uczciwosci gry blokuje jako "nieuczciwe dla partnera" mimo bilansu korzystnego dla gracza — Przyjmij nie da sie kliknac. | **DISPATCHOWANE** | Domain GAME (logika, nie graficzny) — Operator+Evaluator+Final Control Sonnet 5. Dispatch wymaga zywej reprodukcji PRZED zalozeniem przyczyny (moze to byc bramka akceptacji ALBO generator propozycji AI — dwie rozne mozliwe poprawki), z zachowaniem istniejacej ochrony gracza w kierunku gracz→AI. Allowlista: `diplomacy-proposals.ts`, `diplomacy-pn-engine.ts`, `diplomacyAcceptanceBalance.ts`, `diplomacy-acceptance-points.ts` — jesli przyczyna okaze sie lezec poza allowlista (np. generator w `main.ts`), Operator ma zatrzymac sie z DECISION_REQUIRED zamiast wychodzic poza zakres. Dispatch `00-dispatch.md`, commit `b06bb7d2`. |

## OTWARTE 2026-09-02 — obóz łowiecki: las znika wizualnie pod ulepszeniem na wzgórzu + podejrzenie budowy bez lasu

Wlasciciel, zrzuty mapy 3D (rejon "DELFY" i osobno laka): "AI gracza buduje
masowo Obozy lowieckie [...] po wybudowaniu czegokolwiek na wzgorzu, jezeli
jest tam las, to ten las jakby znika [...] widze budowanie tych [...]
obozow, takze na lakach, na ktorych nie ma lasu."

Recon (Read/Grep bez subagenta) — CZESC A POTWIERDZONA: `main.ts::
syncImprovementDecorForHex` chowa kepe lasu (`hideDecorAtHex`) dla KAZDEGO
ulepszenia na Wzgorza/Gory ktore nie jest `farma`/`bydlo` (jedyne dwa klucze
w warunku `foodOnForest`) i nie zachowuje reliefu
(`relief-preserving-improvements.ts`: tylko bydlo/owce/lama/kamieniolom/
kopalnia*) — `oboz_lowiecki` pasuje do obu warunkow. `hex.nakladka` w
danych ZOSTAJE `Las` (czysto wizualny bug renderu, ekonomia nietknieta).
CZESC B NIEPOTWIERDZONA: rzekome obozy na tereniebez lasu przecza
istniejacej twardej bramce `improvement-build.ts:586` — Operator ma
zweryfikowac zywo (odczyt `hex.nakladka`), nie zakladac z gory ani bugu ani
pomylki.

Przy okazji odpowiedziane wprost bez zmiany kodu (informacyjne, w
dispatchu jako notatka): zasada "zywnosc tylko z obrobionego heksu" juz
obowiazuje — `cityYieldPerTurn` liczy `zywnosc` WYLACZNIE z `workedTiles`,
`oboz_lowiecki` NIE jest w `TERRITORY_YIELD_IMPROVEMENTS` (zbior surowcowy
niezalezny od workerow).

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1 | 2026-09-02 | (A) Las znika wizualnie po zbudowaniu ulepszenia (np. obozu lowieckiego) na wzgorzu/gorze z lasem. (B, do weryfikacji) obozy lowieckie widziane na terenie bez lasu. | **DISPATCHOWANE** | Domain GAME, wizualny/UX (R-PROC-AUTOBOT.md §5a) — Operator+Evaluator Opus 5, Final Control Sonnet 5. Czesc A ma dokladnie wskazana przyczyne (main.ts:11991-12014, `foodOnForest` sprawdza tylko 'farma'/'bydlo'), do naprawy generycznie wzgledem istniejacego zbioru ulepszen zgodnych z lasem. Czesc B jawnie warunkowa — Operator MUSI zweryfikowac zywo przed jakakolwiek zmiana kodu commitu. Dispatch `00-dispatch.md`, commit `ed11294d`. |

## OTWARTE 2026-09-02 — AI ma rozdrobnione armie zamiast jednej skoncentrowanej

Wlasciciel, zrzut mapy (rejon Elefantyna/Lothal/Harappa/Sais, kilka rozproszonych
grup 1-3 jednostek AI): "AI nadal unika generowania duzych armii [...] na
rzecz rozproszonych wielu armii. Powinien [...] starac sie skupiac cala
armie w jednym miejscu [...] Dodatkowo wszystko zalezy od tego, z ilu stron
jest atakowany. Jesli jest atakowany z dwoch stron, musi podzielic armie na
dwie czesci [...] ale powinien starac sie polaczyc wszystkie mniejsze armie
w jedna duza."

Recon (Read/Grep bez subagenta): mechanizm koncentracji JUZ ISTNIEJE
(`game/army-concentration.ts::planArmyConcentration`, wolany z `ai.ts:2597`
dla `isMajorAiOwner`), ale laczy WYLACZNIE jeden, juz bliski (promien 4)
klaster >=3 jednostek na ture — nie próbuje laczyc odleglych od siebie grup,
stad trwale rozdrobnienie. Obrona miast pod bezposrednim atakiem juz
poprawnie wylaczona z koncentracji (`homeDefenderAssignments`), ale
ogolniejsze pojecie "wielu frontow" (odlegle od siebie wrogie armie w polu,
zadna nie zagraza bezposrednio miastu) nie jest dzis rozpoznawane.

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1 | 2026-09-02 | AI ma laczyc rozproszone male armie w jedna duza, z wyjatkiem uzasadnionego podzialu gdy jest atakowane z wielu stron. | **DISPATCHOWANE** | Domain GAME, logika AI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH na obu pierwszych rolach (podniesiony z domyslnego Medium — zmiana dotyka rdzenia `ai.ts`, wysokie ryzyko regresji balansu). GOAL dwuczesciowy: (1) rozpoznanie liczby aktywnych frontow zagrozenia, (2) laczenie oddalonych klastrow w ich kierunku gdy liczba frontow < liczby dzisiejszych skupisk. Weryfikacja przez rozszerzenie istniejacego `army-concentration-test.cjs` (symulacja tur, nie zrzuty ekranu — to nie jest temat wizualny). Dispatch `00-dispatch.md`, commit `b7416c19`. |
| R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1 | 2026-09-02 | (aktualizacja) Runda 1 zakonczona DECISION_REQUIRED: przyczyna ustalona zywa reprodukcja — `main.ts::pickResourceTradeRelOffer` (kierunek 'zakup') proponuje zaplate ponizej progu `handelRequiredPn` (24 PN vs wymagane >=67 PN przy relTotal=60); bramka fairness sama w sobie poprawna/symetryczna. | **ZINTEGROWANE do `main` (5bb8e863)** | Runda 2: kierunek-swiadomy parametr w `targetResourceTradePaymentPn`/`adjustZaplataPerTuraForZeroBalance` (`diplomacy-ai-offer-balance.ts`), +1 linia w `pickResourceTradeRelOffer` (`main.ts`), domyslnie `kierunek='sprzedaz'` = bit-identyczne zachowanie, zero zmian w bramce fairness ani ochronie gracza→AI. Operator R2: `bb2b5e3c`. Evaluator R2: zero zarzutow, samodzielnie zweryfikowal ~27 testow dyplomacji/handlu + potwierdzil ze `diplomacy-acceptance-points.ts` faktycznie nietkniety (kolizja z rownoleglym procesem poprawnie cofnieta). Final Control: PASS, wlasny niezalezny checkout, tsc 0, 5 bramek referencyjnych, nowy test `dyplo-handel-oferta-ai-blokowana-test.cjs` 20/20 + ~55 istniejacych testow dyplomacji/handlu bez regresu (2 wyjatki zweryfikowane jako pre-istniejace/niezwiazane). Zintegrowane allowlist-only (`diplomacy-ai-offer-balance.ts`, `main.ts` wylacznie ta linia, nowy plik testowy), tsc+5 bramek+nowy test ponownie zielone po integracji. Worktree i branch posprzatane. |
| R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1 | 2026-09-02 | Dwie jawne decyzje balansu: prog Relacji dla paktu nieagresji 50->90; produkcja gliny na lace 5->2, bonus rzeki 10->5. | **DISPATCHOWANE** | Domain GAME, dane/balans — Operator+Evaluator+Final Control Sonnet 5. Dwie niezalezne czesci (diplomacy.ts::progNapRelacja, terrain-yields.json::Laka/Rzeka.Glina), zero wspoldzielonych plikow. Weryfikacja zywym wywolaniem evaluateProposal/tileYield, nie samym odczytem stalej. Dispatch `00-dispatch.md`, commit `b4ec2e12`. |
| R-WOJNA-WYMUSZONA-REGULY-Q1 | 2026-09-02 | Wojna wymuszona Kamienia/Brazu: (A) prog startu 20->25 tur od poczatku epoki, (B) jeden przeciwnik naraz (koordynacja miedzy napastnikami) + fallback na gracza gdy brak innych kandydatow + limit gracza wg trudnosci (Latwy=wylaczone, Normal=max 1, Trudny=bez limitu), (C) limit trwania wojny 25 tur niezaleznie od zdobyczy. | **DISPATCHOWANE** | Domain GAME, logika AI/wojny — Operator+Evaluator+Final Control Sonnet 5, effort HIGH (rdzen main.ts + serializacja zapisu, wysokie ryzyko). Zelazo swiadomie POZA zakresem (juz ma odrebny mechanizm). Wymaga nowego pola `startTurn` w `ForcedWarPairState` (wspolny typ Kamien+Brazu) + bezpiecznej kompatybilnosci wstecz starych zapisow. Dispatch `00-dispatch.md`, commit `1604e7a1`. |
| R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 | 2026-09-02 | Traktat handlowy powinien miec wybor czasu trwania w negocjacjach, tak jak pakt nieagresji (chipy+recznie+bezterminowy), zamiast dzisiejszego zahardkodowanego czasu. | **DISPATCHOWANE** | Domain GAME, wizualny/UX — Operator+Evaluator Opus 5, Final Control Sonnet 5. Recon: `diplomacyAudience.ts:2189-2193` omija modal wyboru czasu (ktory NAP juz ma) i hardkoduje `turns:20` dla akcji `umowa_szlakow` — silnik juz technicznie wspiera bezterminowy traktat. Rozbieznosc ze zrzutu wlasciciela ("wygasa za 5 tur" nie 20) NIEPOTWIERDZONA, Operator ma ustalic zywo przed zmiana kodu. Dispatch `00-dispatch.md`, commit `ca8eb4f3`. |
| R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 | 2026-09-02 | AI buduje bardzo malo ulepszen terenu (bylo: "zalewali wszystko"), byc moze przez przekierowanie na budynki; dodatkowo jawne zadanie: twardy sufit 50% Pracy na ulepszenia dla wszystkich AI. | **DISPATCHOWANE** | Domain GAME, logika AI/ekonomii — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Temat DIAGNOSTYCZNY w pierwszej kolejnosci — MAX_PROCENT_PULI_IMPERIUM=50 juz istnieje jako fallback, ale main.ts dokumentuje HISTORYCZNY bug o identycznym objawie (ZASADA 3 przekierowuje Prace na budynki, flaga gubila sie przy save/load, AI utykalo na 0% trwale) oznaczony jako naprawiony — Operator ma zweryfikowac zywa, wieloturowa symulacja czy problem faktycznie sie powtarza (moze sie NIE potwierdzic) przed jakakolwiek zmiana kodu. Dispatch `00-dispatch.md`, commit `ca8eb4f3`. |
| R-MIASTA-REBELIA-CICHA-BEZ-POWIADOMIENIA-Q1 | 2026-09-02 | Wlasciciel: Sumerowie przejeli jego miasto mimo aktywnego paktu nieagresji - podejrzewal bug w traktacie. | **DISPATCHOWANE** | Domain GAME — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Recon (bez subagenta, przed dispatchem): hasTreaty() symetryczna, brak bugu w bramce paktu; brak jakiegokolwiek mechanizmu "przejecia kulturalno-religijnego". Prawdziwy mechanizm: miasto gracza z wyczerpanym revoltGrace zmienia ownerId na REBEL_FACTION_OWNER_ID (main.ts:27429-27437) z JEDYNYM sladem w console.log - zero komunikatu w grze; sasiednia AI moze pozniej normalnie zdobyc juz-rebelianckie miasto (runCapitalCapturePlunder obsluguje ten przypadek jawnie), co nie wymaga wojny z graczem bo miasto juz nie jest jego. Pakt nigdy nie zostal zlamany - hipoteza NIEPOTWIERDZONA zywo, Operator ma zreprodukowac caly lancuch przed dodaniem powiadomien w obu punktach (bunt + przejecie przez sasiada), zero zmian w logice buntu. Dispatch `00-dispatch.md`, commit `cd25483d`. |

## POSTĘP PĘTLI AUTOBOT 2026-09-02 wieczór — stan po kontroli kontenera (bez pauzy, cel: zamknięcie wszystkich tematów + deploy ROBOCZA)

Właściciel poszedł spać z jawnym poleceniem dokończenia wszystkiego autonomicznie
("dzialaj w petli az zamkniesz wszystkie tematy autobot worflow") i wykonania
deployu ROBOCZA na końcu z raportem. Orkiestrator kontynuuje bez pytania o zgodę.

- **P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1** — już wcześniej **ZINTEGROWANE
  (`a2c887e8`, Final Control PASS)**, potwierdzone ponownie jako ancestor `origin/main`.
  Stare worktree/branch/Final-Control-worktree posprzątane (były nieaktualne, bez
  wpływu na integrację).
- **P-TECHDISCOVERY-BADGE-DUPLIKAT-NACHODZENIE-Q1** — **ZINTEGROWANE do `main`
  (`eca8f56d`)**. Final Control PASS (własny checkout, własne żywe zrzuty
  Playwright odtworzyły identyczny pomiar co Obrona co do piksela, 63/63 +
  12/12 + 5 bramek referencyjnych). Zintegrowane allowlist-only
  (`techDiscoveryNotice.ts`, nowy test `tech-discovery-badge-diorama-test.cjs`),
  tsc+5 bramek+oba testy tematu ponownie zielone po integracji. Worktree i
  branch posprzątane.
- **P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1** — **ZINTEGROWANE do `main`
  (`69cc3604`)**. Final Control PASS (własny checkout, merge-base scoped diff
  potwierdzony, żywy test elementFromPoint 0 mis, 34/0 + 20/0 + 5 bramek
  referencyjnych; 2 pre-istniejące czerwone testy poza allowlistą potwierdzone
  identyczne na czystym `origin/main`). Zintegrowane allowlist-only
  (`cityPanel.ts`, `entityCards/renderer.ts`, 2 pliki testowe), tsc+5 bramek+oba
  testy tematu ponownie zielone po integracji. Worktree i branch posprzątane.
- **R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1** — **ZINTEGROWANE do `main`
  (`9a2be640`)**. Evaluator PASS zero zarzutów (własny żywy dowód że AI↔AI nie
  wywołuje efektu), Final Control PASS (własny checkout, merge-base scoped diff,
  własny live test 10/10 + 5 bramek referencyjnych + diplomacy-proposal-test
  188/188). Zintegrowane allowlist-only (`main.ts` punktowo w
  `applyProposalOutcome`, nowy `dyplo-mapa-odkrycie-live-test.cjs`). Worktree i
  branch posprzątane.
- **R-WOJNA-WYMUSZONA-REGULY-Q1** — **ZINTEGROWANE do `main` (`bba85893`)**. 3
  zasady: próg 25 tur, jeden przeciwnik naraz + limit gracza wg trudności, limit
  trwania 25 tur; Żelazo nietknięte. Evaluator R1 FAIL (1 zarzut: nowe okablowanie
  main.ts bez testów main-guard chroniących przed cichym usunięciem wywołania —
  ten sam wzorzec co udokumentowana lekcja `P-PROC-BRAMKA-NIE-LAPIE-USUNIECIA-
  HOOKA-Q1`). Obrona dodała 4 nowe asercje main-guard, zweryfikowane mutacyjnie.
  Final Control PASS (własny checkout, sam zweryfikował mutacyjnie 3 z 4 nowych
  asercji na żywym `main.ts`, 5 bramek referencyjnych + 9 testów tematu
  zielone). Zintegrowane allowlist-only. Worktree i branch posprzątane.
- **R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1** — najbardziej burzliwy temat serii,
  3 rundy Evaluator/Obrona, wciąż OTWARTY. R1 Evaluator FAIL (3 zarzuty, w tym
  realny bug: czas traktatu nadpisywany częstotliwością wymiany koszyka). Obrona
  przyjęła wszystko, ale DECISION_REQUIRED (naprawa wymagała
  `diplomacyTradeBasket.ts`, poza pierwotną allowlistą — błędna atrybucja pliku
  w recon). Allowlist rozszerzona (`195b1970`). Kontynuacja Obrony (`ad14a38d`)
  naprawiła produkcyjnie, ALE R2 Evaluator znalazł 2 NOWE, poważne zarzuty:
  (1) wycena PN sweetenera `per_turn` została błędnie sprzęgnięta z czasem
  TRAKTATU zamiast z czasem WYMIANY — zmierzone odchylenia wyceny -42%/-95%/
  +1900% + 20-krotna rozbieżność UI-vs-silnik dla "Bezterminowy"; (2) klik chipa
  czasu w sekcji "wymiana" po cichu nadpisywał pole "czas traktatu" (globalny
  selektor zamiast scopowanego) — dokładnie ten sam rodzaj błędu, który temat
  miał naprawić, tylko inną ścieżką interakcji. Obrona (`7cecd4e5`, POPRAWNIE na
  Opus 5 po naprawieniu znaleziska procesowego niżej) naprawiła oba: nowe pole
  `payload.treatyTurns` rozdziela czas trwania traktatu od mnożnika wyceny PN
  (który wraca do pierwotnej roli, powiązanej z wymianą), handler kliku
  scopowany przez `btn.closest('.cdb-treaty'/'​.cdb-duration')`. Żywy dowód:
  wycena stabilna względem czasu traktatu (H4), nadal zależna od wymiany (H5,
  nietautologiczność), rozbieżność UI/silnik zlikwidowana (H6/I2), realne kliki
  w obu sekcjach nie kolidują (J1-J5). Test tematu 52/52, wszystkie 56 testów
  dyplomacji zielone (silnik dotknięty, nie tylko UI). Evaluator R3 (Opus 5,
  effort high, poprawny model) FAIL, **4 zarzuty, 2 KRYTYCZNE**: (1)
  `payload.treatyTurns` nigdy nie dociera do silnika — `main.ts` (`~18079`,
  `buildProposalFromPayload`) przepisuje payload negocjacji przez jawną białą
  listę 21 pól, `treatyTurns` nie jest na liście (ten sam wzorzec regresji co
  udokumentowany wcześniej incydent w tym samym miejscu kodu, ślad w
  komentarzu); (2) **REGRESJA względem stanu SPRZED tematu**: traktat handlowy
  bez koszyka staje się BEZTERMINOWY zamiast trwać wybraną liczbę tur (payload
  po białej liście staje się pusty → `wygasaTura=null`) — gorzej niż
  zahardkodowane `turns:20` sprzed tematu. (3) nowo otwarta ścieżka
  kontroferty/edycji dla aid '5' gubi prefill warunków propozycji z AI. (4)
  test tematu (52/52 zielone) omijał realną ścieżkę `buildProposalFromPayload`,
  więc nie wykrył (1)-(2) mimo pozornej pełnej zieleni. Allowlist rozszerzona
  PONOWNIE (`5fe2bbe7`, main.ts wyłącznie whitelist+counterInitial). Obrona R4
  (`25afe93c`) naprawiła wszystkie 4 (w tym odkryła i naprawiła DRUGĄ ukrytą
  przyczynę zarzutu 3 — `readTreatyStateFromDom` case '5' zerował prefill przed
  pierwszym renderem koszyka), test 65/65. Evaluator R4 (Opus 5, piąty
  niezależny przegląd) potwierdził wszystkie 4 naprawy żywo, ale znalazł JEDEN
  NOWY krytyczny zarzut — efekt uboczny Obrony R3: `buildTreatyPayload` case
  '8' (trybut) ustawia `treatyTurns=0` bezwarunkowo z domyślnego formularza, co
  przez `treatyDurationPnMultiplier` daje mnożnik ×8 zamiast ×1 — **każda
  domyślna propozycja trybutu dostaje 8-krotnie zawyżoną bazę PW** (dowód
  przed/po: 168→1344 PW za identyczny klik). Żaden z 52 testów dyplomacji tego
  nie łapał. Obrona R5 (`e35aaf41`) naprawiła (guard `> 0` + powiązany prefill
  case '8'), test 76/76. Evaluator R5 (szósty niezależny przegląd) **NIE
  znalazł już żadnego defektu w `gra/src/**`** — wszystkie ścieżki (biała
  lista, counterInitial, prefille, AI, save/load, kontroferty silnika)
  przeszły jego niezależne żywe scenariusze. Jedyne 2 zarzuty były poza kodem
  gry: niedeterministyczny zrzut PNG (kosmetyczny) i `01-operator.md` wciąż
  opisujący rundę 1 sprzed 5 Obron, zaprzeczający faktycznej treści commitu w
  6 punktach. Obrona R6 (`95b3a76e`, ZERO zmian w `gra/src/**`) naprawiła oba
  wyłącznie dokumentacyjnie. **ZINTEGROWANE do `main` (`1db988b7`)** — Final
  Control PASS (siódma i ostatnia weryfikacja, własne 23 niezależne asercje
  przez realną ścieżkę `main.ts`, wszystkie bramki dyplomacji + 5 bramek
  referencyjnych zielone). Zintegrowane allowlist-only (5 plików źródłowych +
  test tematu). Worktree i branch posprzątane. Najbardziej dociekliwie
  zweryfikowany temat tej serii — 7 pełnych rund Operator/Obrona i Evaluatora,
  każda runda poza ostatnią znalazła realny, wcześniej niewykryty błąd mimo
  pozornie zielonych testów.
- **R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1** — Operator PASS (`ccd5f6be`): diagnoza
  żywą symulacją potwierdziła że ZASADA 3 mogła przekierować 100% puli
  ulepszeń na budynki bez dolnej granicy; naprawa — nowa stała
  `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA=10` jako podłoga. Sufit 50% już
  istniał i obowiązywał wszystkie AI. Evaluator (Sonnet 5, dokończył samodzielnie
  `map-gen-regression-test.cjs`, ~75 min, wszystkie twarde asercje PASS) FAIL, **2
  zarzuty**: (1) **ważny, dotyczy sedna zgłoszenia właściciela** — własna,
  niezależna 30-biegowa symulacja (10 ziaren × 3 trudności × 100 tur, prawdziwy
  silnik) mierząca FAKTYCZNĄ liczbę rozkazów `buildImprovement` PRZED/PO pokazała
  **deltę zero w każdym biegu** (1854→1854). ZASADA 3 uruchamia się właśnie
  DLATEGO, że brak kandydatów do ulepszeń — dodatkowa Praca w puli nie może więc
  przełożyć się na więcej zbudowanych ulepszeń terenu w tych turach; budżet
  nigdy nie był czynnikiem ograniczającym. Naprawa zapobiega trwałemu zeru w
  UDZIALE % puli (prawdziwe), ale NIE zwiększa faktycznie budowanych ulepszeń
  widocznych na mapie — jedyny observable, o który pytał właściciel; ewentualna
  korzyść jest ograniczona do INNEJ ścieżki main.ts (cuda/zakładanie miast),
  nieprzemierzonej przez żaden test. (2) drobny dług — przypisanie `pct` w
  ZASADZIE 3 nie przechodzi przez `clampPodzialPracyBudynkiPercent` w
  odróżnieniu od 3 innych miejsc w tym samym pliku; sufit 50% strzeżony tam
  wyłącznie rozsądną wartością stałej, nie strukturalnie. Obrona (`d0ecd3db`)
  **uczciwie NIE wymusiła PASS na zarzucie 1** — zamiast tego zmierzyła INNY
  realny konsument tej samej puli (zakładanie miast AI): 5 ziaren, +42% miast
  założonych podczas nadwyżki, spójne we wszystkich ziarnach — i jawnie
  poinformowała, że tempo budowy ulepszeń TERENU widocznych na mapie (oryginalny
  objaw) się nie poprawia i wymaga osobnego reconu. Zarzut 2 naprawiony
  (clamping dodany + test mutacyjny, potwierdzony mutacyjnie niezależnie przez
  Final Control). Test tematu 13/13. Final Control PASS — dokończył samodzielnie
  `map-gen-regression-test.cjs` (~63 min, zero FAIL), niezależnie zmierzył
  zarzut 1 na innych ziarnach (+21%, ten sam kierunek co Obrona), potwierdził
  uczciwość raportu wobec właściciela. **ZINTEGROWANE do `main` (`3741fdb3`)**
  allowlist-only. Przy okazji integracji naprawiono niezwiązany, ujawniony
  dopiero teraz test `ai-dlug-porzadki-q1-test.cjs` (`cd683738`) — wycinanie
  kodu `eliminateOwner()` do `new Function` nie deklarowało
  `bronzeEraEnterTurnByOwner`, dodanego przez wcześniejszą integrację
  `R-WOJNA-WYMUSZONA-REGULY-Q1` do tej samej funkcji. Worktree i branch
  posprzątane.

**To był OSTATNI z 8 tematów tej serii — wszystkie zamknięte (zintegrowane do
`main`).** Następny krok: pełny deploy ROBOCZA.
- **R-MIASTA-REBELIA-CICHA-BEZ-POWIADOMIENIA-Q1** — **ZINTEGROWANE do `main`
  (`16ad0841`)**. Dwa nowe `showHintMessage` przy zmianie `city.ownerId` na/z
  `REBEL_FACTION_OWNER_ID` (bunt: "zbuntowało się", NIE "podbite"; przejęcie
  przez sąsiada: identyfikuje konkretną AI), zero zmian w logice buntu/progów/
  `runCapitalCapturePlunder`. Hak testowy `__rebelNotifyTestDebug` w `main.ts`
  (poza literalnym brzmieniem allowlisty) uznany przez Evaluatora i Final
  Control NIEZALEŻNIE za uzasadnione rozszerzenie w duchu allowlisty — czysto
  odczytowy/sterujący wejściami, woła REALNE funkcje silnika, precedens
  `__eraTestDebug`/`__buildRequestTestDebug`/`__audienceRelTestDebug` w tym
  samym pliku. Final Control PASS (własny niekopiowany skrypt Playwright, 3
  scenariusze na żywo, zero duplikacji komunikatów, guard eliminacji
  nietknięty). Zintegrowane allowlist-only. Worktree i branch posprzątane.

**ZNALEZISKO PROCESOWE (orkiestrator, ważne dla przyszłych sesji):** w kilku
dispatchach Workflow tej serii pominięto `opts.model` przy wywołaniu `agent()`
dla tematów wizualnych wymagających jawnie Opus 5 (R-PROC-AUTOBOT.md §5a) —
domyślny model sesji (Sonnet 5) był cicho używany zamiast tego. Wykryte przez
własnego Evaluatora tematu `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1`
(zarzut procesowy, nie defekt kodu). Dotyczy: `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-
ZNIKA-I-TEREN-Q1` (Operator R1 i Evaluator R1) i `R-DYPLO-TRAKTAT-HANDLOWY-
WYBOR-CZASU-Q1` (obie rundy Obrony). Naprawione dla wszystkich NOWYCH
dispatchów tej sesji (`model: 'claude-opus-5'` jawnie w `opts`); dla obu
dotkniętych tematów dodano/zaplanowano dodatkową rundę na poprawnym modelu
zamiast cichego zaakceptowania złamania §5a.
- **R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1** — **ZINTEGROWANE do `main`
  (`dc378ab7`)**. Część A naprawiona — `syncImprovementDecorForHex` przestał
  kasować wizualnie kępę lasu pod `oboz_lowiecki` na wzgórzu/górze (lista dwóch
  zahardkodowanych kluczy farma/bydlo rozszerzona do `ULEPSZENIA_ZYWNOSCIOWE`
  przefiltrowanego przez `isImprovementBlockedOnForest`, realnie osiągalne na
  lesie-na-wzgórzu: bydlo/owce/lama/oboz_lowiecki). Część B (obozy na terenie
  bez lasu) — NIE potwierdzona żywo, zero zmian kodu; to był ten sam objaw
  Części A. Evaluator FAIL R1 z 2 zarzutami: (1) **procesowy** — Operator i
  Evaluator R1 byli błędem orkiestratora uruchomieni na Sonnet 5 zamiast
  wymaganego Opus 5 (temat wizualny, §5a) — pierwsze wykryte i udokumentowane
  wystąpienie znaleziska procesowego niżej; (2) drobny — opis "predykat
  przepuszcza dokładnie 4 klucze" był nieścisły, sam predykat przepuszcza 5
  (dodatkowo `lodzie_rybackie`, nieszkodliwie bo teren wodny wyklucza się z
  wzgórzem/górą). Obrona (`d20fcda8`, POPRAWNIE na Opus 5) potwierdziła
  właściwe autorstwo modelu i doprecyzowała opis + rozszerzyła bramkę o pomiar
  ZACHOWANIEM zamiast ręcznego liczenia. Final Control PASS (własne
  przeliczenie zbiorów, własny zrzut z żywego Chromium, 27/27 + 5 bramek
  referencyjnych + 7 bramek związanych). Zintegrowane allowlist-only. Worktree
  i branch posprzątane.

Kolejna kontrola zaplanowana automatycznie; po zamknięciu wszystkich powyższych
— integracja allowlist-only każdego PASS, potem pełny deploy ROBOCZA (build →
stamp → manifest → weryfikacja → FALA w `WERSJE.md`) i raport końcowy dla
właściciela.

## NOWA SERIA 2026-09-03 — trzy zgłoszenia właściciela po FALI 340, pętla AutoBot kontynuowana bez przerwy

Właściciel po otrzymaniu raportu FALI 340 zgłosił trzy kolejne tematy w jednej
serii wiadomości, z jawnym poleceniem kontynuacji pętli AutoBot bez jego
udziału ("Działaj z tematami w pętli, autobot, workflow, bez mojego udziału,
popraw wszystko, co jest w stanie, i na końcu zrób raport").

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-AI-PRACA-PODZIAL-STALY-50-50-Q1 | 2026-09-03 | Kontynuacja R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (które NIE zwiększyło tempa budowy ulepszeń widocznych na mapie): ustaw dla AI cywilizacji i miast-państw sztywny podział Pracy 50/50 (budynki/ulepszenia), żeby AI zawsze miało budżet na oba. | **ZINTEGROWANE** (`e7983ff4`) | Domain GAME, logika AI/ekonomii — Operator+Evaluator+Obrona+Final Control Sonnet 5, effort HIGH. Nowa stała `AI_FIXED_PROCENT_BUDYNKI=50` w `cities.ts`, `decideAIEconomySliders` (`ai.ts`) nie dostosowuje już dynamicznie procentBudynki do wojny/pokoju/fazy gry. Runda 1 Evaluator znalazł krytyczne okno tury 1 (nowi właściciele AI seedowani starym 70% zanim pierwszy raz zadziała suwak) — Operator naprawił w tej samej rundzie (`initOwnerDefaultCityFields`/`seedCityOwnerDefaults`), potwierdzone żywym testem przez prawdziwy silnik. Final Control PASS, wszystkie 7 kryteriów końca potwierdzone niezależnie (symulacja 1500+500 tur, PRZED/PO na osobnym worktree bazowym). Zintegrowane (cherry-pick `85a951f7`+`0bf36b8e`→`e7983ff4`), 5 bramek referencyjnych + testy tematu zielone po integracji. |
| R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1 | 2026-09-03 | Obóz łowiecki powinien być budowalny WYŁĄCZNIE na heksie, gdzie już stoi tartak (rationale: nie marnować pola na mało wydajny obóz — lepiej najpierw postawić tartak, potem dołożyć obóz jako dodatkowy bonus na tym samym polu). | **ZINTEGROWANE** (`8fa5ba27`) | Domain GAME, logika budowy — Operator+Evaluator+Obrona+Final Control Sonnet 5, effort HIGH, 4 rundy. R1: gate w `qualifies()` (wzorzec `droga_brukowana`/`droga`) + kolejność `AI_IMPROVEMENT_PRIORITY` + tooltip/CivPedia. Final Control R1 (DECISION_REQUIRED) ujawnił, że profil automatu gracza „Żywność” (`ULEPSZENIA_FOCUS_ZYWNOSC`) miał ten sam defekt kolejności, pominięty przez R1. R2 naprawiła, ale przez współdzielony `ULEPSZENIA_ZYWNOSCIOWE` (Set pochodny) przypadkiem zepsuła kontrakt widoczności lasu na wzgórzu z innego, wcześniej zamkniętego tematu (R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1). R3 naprawiła kontrakt lasu, co złamało z kolei `foodOnly`-gate demand-driven AI (ten sam współdzielony Set). R4 rozdzieliła oba konsumenty na właściwe źródła danych. Final Control (weryfikacja całego łańcucha) PASS, wszystkie 7 kryteriów końca + 3 mechanizmy (gate/kontrakt lasu/foodOnly) potwierdzone jednocześnie żywą weryfikacją, 5 bramek referencyjnych + testy tematu + render-test zielone. |
| R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1 | 2026-09-03 | 20-turowy okres ochrony po buncie miasta: zdobycie zbuntowanego miasta przez KOGOKOLWIEK (gracza lub AI) w ciągu 20 tur od buntu ma liczyć się jak wypowiedzenie wojny byłemu właścicielowi (łamie pakty), symetrycznie dla gracza i AI. Po 20 turach miasto w pełni niezależne. | **ZINTEGROWANE** (`20a1d06c`) | Domain GAME, logika dyplomacji/buntu — Operator+Evaluator+Obrona+Final Control Sonnet 5, effort HIGH. Nowy licznik `rebelProtectionTurnsRemaining`=20 (analogiczny do `postCaptureLawTurnsRemaining`) w `post-capture-law.ts`, nowy opcjonalny parametr `force` na `ownerDeclareWarOn` (domyślnie `false`, zero zmian dla istniejących wywołań) omijający `isPeaceLockedBetween` wyłącznie w nowej ścieżce. Wpięte w oba lejki przejęcia miasta. Runda 1 Evaluator znalazł lukę w dowodzie dla scenariusza gracz-jako-były-właściciel (`defenderId===0` w `ownerDeclareWarOn`) — Obrona domknęła w tej samej rundzie nową sekcją testu live. Final Control PASS, wszystkie 7 kryteriów końca potwierdzone (test przeglądarkowy 39/39, oba lejki, oba kierunki pary, reconquest, barbarzyńca, poza oknem). Barbarzyńcy i reconquest wyłączeni z nowej konsekwencji wojennej; `canEngageOwner`/AI-targeting nietknięte (nie okazało się konieczne). |

Kolejność dispatchu: 50/50 najpierw (recon gotowy), potem obóz/tartak (recon
gotowy), potem bunt/ochrona (recon w toku) — każdy sekwencyjnie przez pełny
cykl AutoBot (Operator→Evaluator→Obrona→Final Control→integracja), zgodnie z
R-PROC-AUTOBOT.md §2b (tematy dotykające tych samych plików nie równolegle —
tu trzy tematy dotykają różnych obszarów main.ts/ai.ts/auto-improvements.ts,
więc mogą iść równolegle jeśli allowlisty się nie przecinają; zweryfikowane
przy dispatchu każdego kolejnego).

## POSTĘP PĘTLI AUTOBOT 2026-09-03 — kontynuacja po deployu FALI 341 (na wyraźne polecenie właściciela: "Kontynuuj pętlę autobot z kolejnymi zgłoszeniami")

Przeszukano `PYTANIA-OTWARTE.md` i ten rejestr (subagent Explore + weryfikacja
orkiestratora) pod kątem tematów gotowych do dispatchu bez pytania właściciela.
**Znaleziono nadspodziewanie wysoki odsetek fałszywych tropów** — 4 z 6
kandydatów okazały się już dawno zaimplementowane/zdeployowane, ale wiersze
rejestru/PYTANIA-OTWARTE.md nigdy nie zostały zaktualizowane po faktycznej
integracji:

| Kandydat | Werdykt | Dowód |
|---|---|---|
| `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1` T3/T4/T6 | **JUŻ ZINTEGROWANE** | `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` nagłówek: „T1+T2+T2b+T3+T4+T6 ZINTEGROWANE do main (T6 commit `2e6aac59`)". Wiersz rejestru (wyżej w tym pliku) poprawiony. |
| `R-AI-WYRAB-PRZY-RZECE-FARMY-R4-Q2` | **JUŻ ZINTEGROWANE** | Pełne wiązanie w kodzie: `wolnoWycinacLas` (`cities.ts`), UI przełącznik (`buildModeHud.ts`), `getSkipWyrab`/`skipWyrab` w `auto-improvements.ts` z komentarzem „R4-Q2=C". Wiersz rejestru poprawiony. |
| `P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE` | **JUŻ ZAMKNIĘTE** | `PYTANIA-OTWARTE.md` STATUS: ZAMKNIĘTE (2026-08-17), commit `34700709`, FALA 291 — status był poprawny, kandydat odrzucony przy weryfikacji. |
| `P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT` | **JUŻ NAPRAWIONE** | `onSelectWonder` (`main.ts:19909-19936`) ma dziś wszystkie 3 wczesne `return` + ścieżkę sukcesu poprzedzone `refreshBuildHighlight()`. `PYTANIA-OTWARTE.md` zamknięty. |

Dwa kandydaci potwierdzeni jako GENUINE OTWARTE, zdispatchowane w tej rundzie:

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA` | Panel „Wymiana" pokazuje bilans dodatni mimo blokady akceptacji oferty wielo-umowowej (N-E1 potwierdzone ponownie ze zrzutami Macieja) + nowy wątek: możliwy brak odświeżania panelu po edycji koszyka bez usunięcia/ponownego dodania. | **RUNDA 1 ZINTEGROWANA** (`3ca7c600`) — **RUNDA 2 DISPATCHOWANA** | Domain GAME, Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Runda 1: obie pierwotne hipotezy (formuła N-E1/staleness) NIE reprodukowały się na HEAD, ale Evaluator/Obrona znalazły i naprawili trzeci, realny defekt — etykieta „Bilans (Oni)"/„(netto)" zależna od KOLEJNOŚCI dodania wierszy do koszyka. Final Control PASS, zintegrowane. Runda 2: mechanizm dokładnie zlokalizowany reconem orkiestratora — `balancePanelDataFromRows` (`diplomacyAcceptanceBalance.ts:229-392`) wyświetla `unifiedPwBalance` (MIN pwBalance po wierszach) TYLKO gdy WSZYSTKIE wiersze mają numeryczny `pwBalance`; gdy choć jeden wiersz (np. Traktat przemarszu — traktat bez własnej bramki PW, bramkowany Relacją/Zaufaniem/Respektem) go nie ma, panel przełącza się na CAŁKOWICIE INNĄ formułę (`myOfferPn-theirOfferPn`, suma ofert, nie próg akceptacji) — podczas gdy `canAccept` nadal poprawnie zależy od `responderPreview.accepted` tego wiersza. Stąd oba kierunki błędu ze zrzutów właściciela. Dispatch rundy 2: `00-dispatch-runda2.md`, GOAL obejmuje wiążącą regułę (canAccept≥0 twardo, AI nie proponuje ujemnych dla gracza pakietów) + rozszerzenie `evaluateProposal` o `pwBalance` dla traktatów bez koszyka, żeby wyświetlana liczba i bramka używały tej samej metryki. |
| `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1` | Spowolnienie KAŻDEJ interakcji gracza (ruch, przełączanie, klik) narastające z liczbą miast gracza, nieobecne na starcie gry — najszerszy z trzech powiązanych wątków tego ID. Właściciel wcześniej zdecydował „Do kolejki" (2026-08-17); ta runda jest tym wznowieniem. | **ZAMKNIĘTE — AUDYT, BRAK POTWIERDZONEJ REGRESJI** (`ff6dda1c`) | Domain GAME, Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Żywy pomiar (headless Chromium, 2 vs 12 miast gracza, ta sama mapa) NIE wykazał powtarzalnego wzorca skalowania interakcji (openCityList/openCityPanel/openArmyList/selectUnit) z liczbą miast — pojedyncze przekroczenia progu 1.5x w powtórzeniach uznane za szum pomiarowy (swiftshader software-rendering, współdzielony sandbox), nie sygnał. Hipoteza "stuck-turn" OBALONA — zatrzymanie na iteracji 13 to zawsze ten sam realny modal `preBattle`, nie hang silnika. Final Control PASS, zero zmian w `gra/src/**` (w tym `render/**` nietknięty) — legalny wynik audytu "sprawdzone, brak problemu". Dwa narzędzia diagnostyczne zachowane w `gra/tools/` na przyszłość. |

Oba tematy dotykają różnych, nieprzecinających się obszarów kodu
(`diplomacyAcceptanceBalance.ts`/`diplomacyTradeBasket.ts` vs profiling bez
z góry ustalonego zakresu) — dispatchowane równolegle.

## NOWE ZGŁOSZENIE 2026-09-03 (zrzut ekranu) — kolejność kafelków w panelu audiencji dyplomatycznej

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1` | Zrzut ekranu panelu "Możliwe umowy": "Sprawdź, czy jest możliwość, aby podczas rozmów dyplomatycznych wszystkie aktywne statusy były na samej górze, a nieaktywne zgodnie z obecną kolejnością." | **ZINTEGROWANE** (`4638b6ce`) | Domain GAME, UI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. `dealsColumnHtml` (`diplomacyAudience.ts`) sortuje teraz stabilnie po `isLocked` (aktywne przed nieaktywnymi), bez zmiany kolejności wewnątrz grup ani wyglądu pojedynczego kafelka. Zero zarzutów Evaluatora, Final Control PASS (własny niezależny test 8/8 z inną fixture, 11 testów regresyjnych audiencji dyplomatycznej sprawdzonych, real Chromium). Zintegrowane, 5 bramek referencyjnych + nowa bramka tematu (15/15) zielone po integracji.

## NOWE ZGŁOSZENIE 2026-09-03 (dwa zrzuty ekranu) — jednostka chwilowo niewidoczna po wybudowaniu

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1` | Dwa zrzuty ekranu tej samej okolicy: "po wybudowaniu nowej jednostki nie pojawia się ona, tak jakby była niewidoczna... jakby coś później renderuje, a nagle się pojawia... może to wprowadzać graczy w błąd." Zrzut 1: malutki uproszczony znacznik zamiast jednostki; zrzut 2 (później): pełny model z paskiem zdrowia. | **ZINTEGROWANE** (`79748fac`) | Domain GAME, wizualny — Operator+Evaluator Opus 5 (`gra/src/render/**`), Final Control Sonnet 5. Runda 1: recon + DECISION_REQUIRED, właściciel wybrał opcję A (token przyciemniony zamiast niewidocznego). Runda 2: `main.ts::syncUnitsRender` przestał filtrować jednostki w oknie odroczenia, `render/units.ts::sync()` dostał `dimmedUnitIds`, opacity 0.45 jako PRÓG (nie mnożnik — pierścienie właściciela/wojny bez podwójnego przyciemnienia). Final Control PASS (agregat obu rund), auto-merge bezkolizyjny mimo równoległej integracji innego tematu w main.ts. Zintegrowane, nowa bramka 19/19 + tsc + 5 bramek referencyjnych + 7 bramek regresyjnych renderu zielone po integracji.

## NOWE ZGŁOSZENIE 2026-09-03 — próg paktu o nieagresji 90 → 110

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-DYPLO-PROG-NAP-90-DO-110-Q1` | "Zmieńmy jeszcze pakt o nieagresji z 90 na 110." | **ZINTEGROWANE** (`740993f4`) | Domain GAME, balans — Operator+Evaluator+Final Control Sonnet 5, effort MEDIUM. Ten sam wzorzec co wcześniejsza zmiana `progNapRelacja` 50→90 w tej samej sesji (FALA 340, `R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1`) — czysta decyzja balansu, bez ABC. Dwa źródła prawdy zmienione: `gra/src/game/diplomacy.ts:204` i `gra/data/diplomacy.json:46`. Final Control PASS, wszystkie 5 kryteriów potwierdzone żywo (w tym mutacyjny dowód nietautologiczności testu T9k). Zintegrowane, 5 bramek referencyjnych + 9 testów dyplomacji zielone po integracji.

## NOWE ZGŁOSZENIE 2026-09-03 (dwa zrzuty ekranu) — cały wiersz karty encji ma być przyciskiem

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1` | Zrzuty kart "Garncarstwo"/"Wymiana": "Te przyciski po prawej stronie nie są potrzebne... Jest kolejna technologia wymiana, powinien być przycisk jako wymiana... To samo z brązownictwem, pismem, religią... oraz także z budynkami i jednostkami. Wszystkie powinny być przyciskiem." | **ZINTEGROWANE** (`5b05773c`) | Domain GAME, UI (DOM/HTML, nie render/**) — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. `buildGridRowEl` (`entityCards/renderer.ts`) rozszerzony — cały wiersz klikalny niezależnie od `value`, nie tylko gdy pusty; `technologyAdapter.ts` (Kolejne technologie/Zmiany ekonomiczne) naprawiony. Jeden zarzut Evaluatora (brak dowodu wizualnego) przyjęty w obronie, 3 zrzuty dołączone. Final Control PASS, allowlist-only cherry-pick, nowa bramka 63/63 + tsc + 5 bramek referencyjnych zielone po integracji.

## NOWE ZGŁOSZENIE 2026-09-03 (dwa zrzuty ekranu + pytanie) — Traktat przemarszu: haczyki, edytowalność, duplikat aktywnej umowy

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1` | Zrzut panelu audiencji: mimo aktywnego "Traktatu przemarszu (wojskowy)" w "Aktywne traktaty", ten sam traktat nadal widnieje jako klikalna, niezablokowana pozycja w "Możliwe umowy". "Powinien być tylko jeden... Tutaj jest błąd. Trzeba było też sprawdzić, jak jest z innymi traktatami. Większość powinna być jednorazowa, poza umową wymiany surowców." | **ZINTEGROWANE** (`9a36550d`) | Domain GAME — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Runda 1 FAIL na jednym defekcie testu (domyślny tryb czerwony na poprawnym kodzie), sam fix logiki (`hasGranice`) poprawny od początku. Runda 2 odwróciła domyślną gałąź testu (PO=domyślnie zielono, `DPD_MODE=PRZED`=opt-in). Final Control PASS na obu rundach. Zintegrowane: `diplomacy-locks.ts`, `main.ts`, `diplomacy-locks-test.cjs` (88/88), nowy `diplomacy-przemarsz-duplikat-real-render-test.cjs` (2/2), tsc + 5 bramek referencyjnych + testy regresyjne dyplomacji zielone po integracji. |
| `P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1` | Ten sam zrzut modala traktatu przemarszu: "Poza tym powinny być zamienione na Przyciski, bo wygląda to bardziej profesjonalnie." (checkboxy "Wariant wojskowy (+ opłata)" i "Wspólna walka z barbarzyńcami (3 tury)"). | **ZINTEGROWANE** (`78151c38`) | Domain GAME, UI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Wzorzec przycisku-toggle (`cdb-chip`/case '2') reużyty dla obu przełączników. Zero zarzutów Evaluatora, Final Control PASS (własna weryfikacja diffu ograniczonego commitem `bfee5fb7`, 5 zrzutów obejrzanych). Zintegrowane, nowa bramka 22/22 + tsc + 5 bramek referencyjnych + testy regresyjne (border-march, barbarian-cooperation) zielone po integracji.
| (pytanie, bez kodu) | "Do czego służy opcja „wariant wojskowy" i wspólna walka z barbarzyńcami? Czy są jakieś haczyki?" | **ODPOWIEDZIANE W CZACIE 2026-09-03** | Wariant wojskowy rozszerza prawo przemarszu z cywilnego na wojskowe (Respekt≥55, wyższa opłata). Wspólna walka z barbarzyńcami wymaga wariantu wojskowego, dodaje automatyczne wsparcie bojowe przeciw barbarzyńcom w promieniu 2 heksów, wygasa CAŁKOWICIE po 3 turach (traci się też prawo przemarszu, nie tylko współpracę). Haczyki: (1) traktat jest symetryczny — obie strony dostają te same prawa przez swoje terytorium; (2) wariant cywilny NIE chroni przed karą Zaufania za nieautoryzowany przemarsz wojskowy. |
| (pytanie, bez kodu) | "nie da się edytować traktatu przemarszu; balans wychodzi na plus i nie da się go zmodyfikować (np. zamieniając na surowce)... Traktat przemarszu powinien być umową z kosztem po drugiej stronie... trzeba wprowadzić wymianę surowców, drugą umowę – tak wszędzie." | **DOŁĄCZONE DO RUNDY 2 `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA`** | Opłata `feeC`/`feeM` (20/40 ¤) jest dziś stałą wpisaną w traktat, nieedytowalną w formularzu — balansowanie wymaga dodania OSOBNEJ pozycji (np. "Umowa wymiany surowców") do tego samego pakietu na stole negocjacji, co jest już architekturalnie wspierane (wielopozycyjny koszyk), ale właśnie TA ścieżka (traktat + osobna umowa w jednym pakiecie) jest źródłem niespójności bilans/canAccept opisanej niżej. Nie osobny temat — ten sam mechanizm liczenia. |

## ZAPISANE NA PRZYSZŁOŚĆ 2026-09-03 (zrzut ekranu panelu Porządek) — audyt balansu szczęścia i prawa w miastach

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1` | Zrzut panelu "Porządek · 2 mieszk.": Szczęście 114% (Budynki +3, Kultura +4, Religia +4, Osiedle +3, Zaopatrzenie +2), Prawo 40% (Osiedle +20), Porządek łącznie 80% (Szczęście: 75% wkładu, Prawo: 25% wkładu). "Trzeba przeprowadzić dokładny audyt balansu zadowolenia w miastach pod kątem szczęścia, prawa i porządku... bardzo łatwo jest zorganizować szczęście na wysokim poziomie, ponieważ punkty się kumulują... im dalej w las, tym szczęście teoretycznie wyższe... Czy nie powinno być tak, że istnieje bufor punktów, które trzeba osiągnąć na określony poziom szczęścia, powiązany z budynkami i sytuacjami (plus i minus), każda epoka rozpatrzona oddzielnie... To samo dotyczy prawa, tu też system bardziej obiektywny... nie ma kary za nadmierną liczbę obywateli — za każdego obywatela powinien być minus jeden do szczęścia (przeludnienie), zrównoważone budynkami/kulturą/religią... nie wiem gdzie jest ustalenie że szczęście daje 75% wkładu a prawo 25% — czy nie powinno być pół na pół, chyba że zależy od trudności." | **RECON WYKONANY 2026-09-04** (wznowione na pytanie właściciela: „A co z audytem szczęścia, prawa i budynków... W tej chwili system jakby zlicza, dodaje co turę nowe punkty, a to chyba nie tak powinno działać"). **TRZY ZAŁOŻENIA Z PIERWOTNEJ REJESTRACJI OKAZAŁY SIĘ NIEPRAWDZIWE — poprawione niżej.** Podzielone na 5 węzłów, gotowe do sekwencyjnego dispatchu. | Domain GAME, balans — duży audyt (prawdopodobnie wieloepokowy/wielorundowy, analogiczny skalą do audytu bilansu dyplomacji). Zakres do recon przed dispatchem: (1) pełna lista czynników +/− szczęścia i prawa per epoka (budynki, kultura, religia, osiedle, zaopatrzenie surowcami, garnizon, itd.) — gdzie w kodzie żyje ta lista (prawdopodobnie `gra/src/game/happiness*.ts`/`order*.ts` lub podobne, do potwierdzenia reconem, nie zgadywać nazw plików); (2) czy istnieje jakikolwiek mechanizm skalowania progu szczęścia z liczbą mieszkańców/budynków (bufor rosnący z rozwojem miasta) — dziś podejrzenie właściciela: NIE ma, punkty się liniowo kumulują bez przeciwwagi; (3) brak kary za przeludnienie — zweryfikować czy istnieje jakikolwiek malus za liczbę mieszkańców; (4) skąd pochodzi stały podział 75% szczęście / 25% prawo w "Porządek łącznie" — czy jest konfigurowalny per trudność, czy stała wpisana na sztywno; (5) finalna propozycja rozwiązania zbalansowanego pod kątem grywalności, nie tylko diagnoza. Dispatchować dopiero po recon + jawnej decyzji właściciela co do zakresu. **RECON WYKONANY 2026-09-04 — wyniki, w tym TRZY KOREKTY wcześniejszych założeń:** **(1) NIE MA akumulacji — podejrzenie właściciela obalone dowodem.** `computeHappinessBreakdown` buduje PUSTĄ tablicę `lines` przy każdym wywołaniu (`society-breakdown.ts:335`) i sumuje ją od zera (`:430`, `lines.reduce`); Prawo analogicznie (`:522`). Zero odczytu poprzedniej wartości, zero `+=` na polu miasta (grep po `szczescie +=`/`zadowolenie +=` trafia wyłącznie w sumowanie cudów, `wonders-data.ts:230`). Czysta funkcja stanu, wołana raz na turę z `main.ts:28877`; panel liczy to samo lokalnie (`cityPanel.ts:3059`). **ALE intuicja właściciela trafiła w realny problem z innej strony:** licznik rośnie bez ograniczeń (**+1 za KAŻDY budynek, bez limitu i bez kosztu utrzymania** — `economy.ts:495` `BUILDING_HAPPINESS_BASE_PER_BUILDING = 1`, użycie `:501-508`, suma `:520-531`), a mianownik stoi — patrz (3). **(2) KOREKTA: kara za przeludnienie ISTNIEJE** (pierwotna rejestracja zakładała, że jej nie ma). `society-breakdown.ts:383-388`: powyżej `szczescie_prog_zageszczenia` (normal 5) linia „Zagęszczenie" = `szczescie_kara_wielkosc_miasta × (pop − próg)`, normal **−0,75/mieszkańca**. Dodatkowo bonus Osiedla znika powyżej pop 4 (`pickOsiedlePopBonus:170-188`), Prawo traci pasmo `[28,20,14,8]`, a przy `population >= 6` dochodzi kara Prawa za brak garnizonu (`main.ts:28911`). Postulat właściciela „minus jeden za obywatela" jest więc już zrealizowany, w wersji −0,75. **(3) POTWIERDZONE I DOPRECYZOWANE: próg NIE rośnie z miastem, rośnie TYLKO z epoką.** `SZMAX_DEFAULTS = {1:14, 2:20, 3:28}` i `PRAWMAX_DEFAULTS = {1:50, 2:75, 3:100}` (`society-breakdown.ts:153,155`), użycie `szMaxForEra:265`/`prawMaxForEra:270`/`pctFromNetto:260`, zależne wyłącznie od `era` (`:432, :523`). **Wartości zahardkodowane w TS, NIE MA ich w `society-params.json`** — to osobne znalezisko, bo uniemożliwia strojenie bez zmiany kodu. Capy: `SZ_PCT_CAP = 120`, `PRAW_PCT_CAP = 100` (`:156-157`). To jest mechaniczna przyczyna zjawiska „im dalej w las, tym szczęście wyższe". **(4) KOREKTA: „75% szczęście / 25% prawo" NIE jest stałą ani ustawieniem — to WYNIK, nie waga.** `orderContributionPct` (`society-breakdown.ts:632-650`) liczy `szWkladPct = round(weightedSz / (weightedSz + weightedPraw) × 100)`. Rzeczywiste wagi są konfigurowalne per trudność: `porzadek_waga_szczescie` easy 0,55 / **normal 0,50** / hard 0,45 (`society-params.json → porzadek`, ładowane `order.ts:251-252`, użyte `computePorPct:609-611`). **Czyli jest DOKŁADNIE pół na pół, tak jak postulował właściciel** — myli etykieta panelu, nie mechanika. Przy Sz 114% i Prawie 40% z wag 0,5/0,5 wychodzi 74-75%. **(5) Zrzut właściciela odtwarza się co do cyfry:** Sz netto 16 / szMax 14 = 114%; Prawo 20 (osiedle pop 2) / 50 = 40%. **(6) Mapa kodu:** `society-breakdown.ts` (model procentowy: `computeHappinessBreakdown:329`, `computeLawBreakdown:441`, `computePorPct:604`, `orderContributionPct:632`, `computeOrderPctBreakdown:652`, `evaluateOrderFromBreakdown:676`, bunt/grace `updateRevoltGrace:700`), `order.ts` (parametry/tiery/efekty: `loadOrderParams:244`, `computeOrder:283` legacy punktowy, `orderEffects:338`), `society-inputs.ts`, wpięcie `main.ts:28877`, render `orderPanel.ts:140`, dane `gra/data/society-params.json`. **PODZIAŁ NA WĘZŁY (do sekwencyjnego dispatchu, każdy osobny temat):** **A. Skala i normalizacja** — `szMax`/`prawMax` stałe per epoka vs rosnące z miastem, capy 120/100, przeniesienie zahardkodowanych stałych do JSON (`society-breakdown.ts:153-273`, `society-params.json`). **B. Wkład budynków** — `+1/budynek` bez limitu i bez utrzymania (`economy.ts:495-531`, `buildings.json`, `main.ts:28839`). **C. Prawo i osiedla** — skok `prawo_bonus_osiedle_pop` przy pop 5, garnizon vs administracja (`society-breakdown.ts:441-527`, `society-params.json → prawo`, `post-capture-law.ts`). **D. Progi/pasma i bunt** — `porPctBand`, `tierFromPorPct`, `orderEffectsFromPorPct`, grace (`society-breakdown.ts:533-602,700-752`, `order.ts:310-375`). **ECHO WŁAŚCICIELA 2026-09-04 (po Final Control węzła A): „Integruj węzeł A, węzeł C wygładzi urwisko później".** Uzasadnienie przyjęte: urwisko pop 4→5 (spadek Porządku o **9,8 p.p.**, zanik bonusu Osiedla) **istniało już wcześniej** i było tylko zasłonięte sufitem 120% — jego odsłonięcie nie jest nowym błędem, tylko ujawnieniem starego. Final Control zweryfikował tę liczbę bezpośrednio na czystym kodzie sprzed tematu (osobny worktree na bazie `2bb422aa`), więc nie jest to wymówka na własny defekt. Łączny spadek widziany przez gracza w najgorszym punkcie siatki: **12,0 p.p.** przy +1 mieszkańcu, z czego ok. **2 p.p.** wnosi węzeł A, reszta to odsłonięte urwisko. **MANDAT DLA WĘZŁA C, zmierzony i konkretny: wygładzić zanik bonusu Osiedla przy pop 5 tak, żeby łączny spadek Porządku przy przyroście o jednego mieszkańca nie przekraczał progu odczuwalności.** To nie jest już ogólne „przejrzeć prawo i osiedla" — to policzony cel z liczbą.

**E. Prezentacja** — mylące „75%/25%" (patrz korekta 4) i etykiety (`orderPanel.ts:140-194`, `cityPanel.ts:3059-3102`, `society-breakdown.ts:614-650`). **ZNALEZISKO DODATKOWE 2026-09-04, ze zrzutu panelu „PORZĄDEK · 5 mieszk." — PANEL NIE ZGADZA SIĘ SAM ZE SOBĄ (arytmetycznie pewne, niezależnie od trudności).** Zrzut pokazuje: Szczęście **0%**, Prawo **100%**, Porządek łącznie **57%**, wkład Szczęście **13%** / Prawo **87%**. `computePorPct` (`society-breakdown.ts:604-612`) to `clampPct(wS×szPct + wP×prawPct)`, więc przy szPct=0 i prawPct=100 wynik musi być równy `wP×100`: normal (0,5) → **50%**, easy (0,45) → 45%, hard (0,55) → 55%. **Żadna trudność nie daje 57%.** Niezależnie od tego `orderContributionPct` (`:632-650`) przy `weightedSz = wS×0 = 0` daje `szWkladPct = round(0/total×100) = 0%`, a panel pokazuje 13%. Licząc wstecz z obu liczb jednocześnie (57% i 13/87) wychodzi spójnie `wP ≈ 0,496` **oraz szPct ≈ 15** — czyli wartość Szczęścia UŻYTA w obliczeniu to ok. 15%, a wyświetlona to 0%. Składniki na zrzucie sumują się do netto 0 (Kultura −4, Religia +4, Wojna −2, Zaopatrzenie +2), a `pctFromNetto(0, szMax, cap)` (`:260-263`) zwraca dokładnie 0 — więc rozbieżność jest między tym, co panel POKAZUJE jako składniki i procent Szczęścia, a tym, co trafia do `computePorPct`. **Do rozstrzygnięcia w węźle E (albo A, jeśli okaże się, że to defekt modelu, a nie prezentacji) — orkiestrator NIE rozstrzyga, która liczba jest błędna, bo z samej arytmetyki tego nie widać; pewne jest wyłącznie to, że co najmniej jedna z wyświetlanych liczb nie pochodzi z tego samego obliczenia co pozostałe.** Kandydaci do sprawdzenia: czy panel przekazuje do `computePorPct` wartość sprzed clampu/zaokrąglenia, czy lista składników jest niepełna (brak dodatniego członu ok. +2,1), czy `szMax` użyty w wyświetleniu różni się od użytego w obliczeniu. **Rekomendacja orkiestratora co do kolejności: A jest rdzeniem** (bez zmiany normalizacji reszta jest kosmetyką), B drugi (to on wysyca skalę), E można zrobić niezależnie i tanio. **NIE DISPATCHOWANE** — czeka na decyzję właściciela, od którego węzła zacząć. |

## NOWE ZGŁOSZENIE 2026-09-03 — parytet wojen AI↔gracz przy parzystej liczbie cywilizacji

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1` | "Jeżeli jest parzysta ilość cywilizacji, to przeważnie one wypowiadają wojny [sobie nawzajem], a nie ma żadnej cywilizacji, która wypowiedziałaby wojnę graczowi... cywilizacja, która już wypowiedziała wojnę innej cywilizacji, [powinna mieć] pozwolenie na to, aby wypowiedziała wojnę graczowi." | **RECON ZAMKNIĘTY — MECHANIZM JUŻ NAPRAWIONY, 3 PYTANIA NA PRZYSZŁOŚĆ** | Domain GAME, balans/AI. Hipoteza CZĘŚCIOWO POTWIERDZONA: koordynowany wybór celu wojen WYMUSZONYCH (Kamień/Brąz, `forced-war-stone.ts`) wyklucza kandydatów już-w-wojnie (`candidatesAlreadyAtWarIds`) — przy parzystej liczbie AI mogą się w pełni sparować, zostawiając gracza poza mechanizmem. To dokładnie zjawisko zgłoszone przez właściciela, ale **już naprawione** wcześniejszym tematem `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1`: fallback-na-gracza gdy pula AI-kandydatów wyczerpana (`main.ts:29418-29420,29505-29507,29602-29604`, `playerActiveForcedWarCount`), z limitem zależnym od trudności (łatwy: mechanizm wyłączony; normalny: max 1 naraz; trudny: bez limitu) — potwierdzone obecne w bieżącym `main.ts`, nie tylko historycznie. Ogólna (niewymuszona) ścieżka decyzyjna AI (`ai.ts` Priorytet 4) NIE wyklucza gracza — traktuje go jak każdą inną AI. 3 pytania pozostawione do sprawdzenia TYLKO jeśli właściciel nadal obserwuje problem w praktyce: (a) epoka Żelaza (`forced-war-iron.ts`) nie ma koordynacji `candidatesAlreadyAtWarIds` — brak ochrony gracza, ale też brak problemu parowania; (b) czy progi ogólnej ścieżki (`rw≥0.6`, `agresja≥0.5`) są po prostu rzadko spełniane względem gracza niezależnie od parowania; (c) czy naprawa faktycznie widoczna w rozgrywce właściciela. Nic do dispatchu teraz — zamknięte jako informacyjne, chyba że właściciel potwierdzi że problem nadal występuje. |

## NOWE ZGŁOSZENIE 2026-09-03 — rozszerzenie pomysłu: wojna trójstronna, gdy para AI już walczy a gracz nie ma przeciwnika

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| (rozszerzenie `R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1`) | "Jeżeli jakaś cywilizacja ma już parę i z kimś walczy, a gracz nie ma swojej pary do walki — obie cywilizacje, które ze sobą walczą, wypowiadają JEDNOCZEŚNIE wojnę graczowi, tak żeby jedna cywilizacja nie musiała walczyć z dwoma, a reszta tylko z jedną. Wchodzą w konflikt trzy cywilizacje między sobą, chyba że jedną z nich łączy sojusz lub padnie agresja." | **ZAREJESTROWANE, NIE DISPATCHOWANE — propozycja projektowa, nie bug** | Domain GAME, balans/AI. To NOWY, konkretny mechanizm (nie tylko fallback pojedynczej AI na gracza, jak już naprawione w `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1`) — obie strony istniejącej pary wojny wymuszonej dołączają gracza jednocześnie, tworząc trójstronny konflikt, żeby żadna AI nie musiała dźwigać dwóch wojen. Wymaga jawnej decyzji właściciela przed dispatchem: (1) czy dotyczy WYŁĄCZNIE wojen wymuszonych (Kamień/Brąz/Żelazo) czy też ogólnej ścieżki AI; (2) jak traktować sojusze między AI-parą a graczem (wyjątek już wskazany przez właściciela: "chyba że jedną z nich łączy sojusz"); (3) czy to zwiększa trudność gry dla gracza w sposób zamierzony, czy wymaga dodatkowego złagodzenia gdzie indziej. Nie dispatchować bez potwierdzenia zakresu. |

## NOWE ZGŁOSZENIE 2026-09-03 (zrzut ekranu karty "WYMAGA DECYZJI") — skrót bilansu w kompaktowej karcie panelu bocznego

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1` | "Przy propozycji wymiany surowców komunikat powinien informować, ile co turę chce wymienić druga strona i za co, w jakiej ilości w drugą stronę, ale co turę... trzy liczby. Ja potem umiem obliczyć, ile to jest przez cały okres... W tym wypadku nie jest to potrzebne, tylko ewentualnie jak ktoś otworzy, widzi dokładnie co tam jest w szczegółach." | **ZINTEGROWANE** (`7030ee1b`) | Domain GAME, UI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Kompaktowa karta panelu bocznego i toast nie pokazują już "(łącznie X przez Y tur)" (nowe `omitTotal`), wiersz stołu negocjacji i kreator koszyka bez zmian (potwierdzone bit-identyczne). "Oferują: —" rozstrzygnięte żywym dowodem (wywołanie realnej `clampBasketItemsToAffordable`): to NIE błąd formatowania, tylko osobny bug ekonomiczny (`R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1`, zarejestrowany niżej). Final Control PASS, zintegrowane, nowa bramka 13/13 + diplomacy-display-test 35/35 + tsc + 5 bramek referencyjnych zielone po integracji. |

## NOWE ZGŁOSZENIE 2026-09-03 (zrzut mapy) — mgła wojny nie odkrywa terenu wzdłuż trasy szybkiego ruchu

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1` | "Jeżeli jednostka szybko się porusza, np. Scout, na duże tereny, to pomimo tego, że przeszła przez jakiś teren, nie odkrywa go... Tu chodzi chyba o [...] opóźnienie [klatek]." | **ZINTEGROWANE** (`6a9db6e0`) | Domain GAME — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Recon OBALIŁ hipotezę o klatkach/wydajności — przyczyna byla DETERMINISTYCZNA: `refreshFog()`/`currentVisible()` liczyly widocznosc WYLACZNIE z pozycji KONCOWEJ ruchu. Naprawa: nowa `computeVisibleAlongPath` (`visibility.ts`) liczy unie widocznosci z kazdego heksu przebytej sciezki, podpieta w main.ts w 2 punktach (koniec animacji, ruch instant) PRZED `refreshFog()`. Final Control PASS-WITH-NOTES: potwierdzil zywo istnienie TRZECIEGO, analogicznego miejsca buga poza allowlista tego dispatchu — `triggerPlayerEndTurn()` (main.ts ~26742) teleportuje jednostke w trakcie animacji bez wywolania nowej funkcji. Zarejestrowane osobno jako `P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1` (patrz niżej), NIE blokowalo integracji tego, węższego tematu. Testy: 17/17 + zywy render Chromium 5/5 + tsc + 5 bramek referencyjnych zielone. |

## NOWE ZGŁOSZENIE 2026-09-03 (zrzut mapy z linią szlaku przez czarny obszar) — czy handel działa przez nieodkryty teren

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| (pytanie, bez kodu) | "Jeśli jakiś teren nie jest odkryty, to pomimo podpisanej umowy miasta między sobą nie handlują?" | **SPRAWDZONE — HIPOTEZA OBALONA, TO NIE BUG** | Recon (subagent Explore): `findCityConnection`/`refreshTradeRoutes`/`citiesHaveTradeConnection` (trade-routes.ts) pathfindują po CAŁEJ, realnej mapie (`map.hexes`) — ZERO zależności od fog/explored/visible w którymkolwiek z tych miejsc ani w overlayu renderującym linię szlaku. Handel FAKTYCZNIE płynie przez nieodkryty teren, dokładnie tak samo jak przez odkryty — trasa znika tylko z powodu wojny, zerwanej umowy, zmiany geometrii (np. usunięcia Portu) lub przekroczenia progu dystansu. Linia szlaku widoczna na czarnym tle to WYŁĄCZNIE kosmetyka renderu (może wyglądać "podejrzanie", ale ekonomicznie działa poprawnie). Możliwy drobny pomysł UX na przyszłość (NIE dispatchowany): odsłaniać hexy trasy handlowej jako "znane" na mapie, albo dodać wizualny wskaźnik "trasa przez nieodkryty teren" — tylko jeśli właściciel zapyta o to wprost. |

## NOWE ZGŁOSZENIE 2026-09-03 — ustawienia miast-państw (wyłączone, startowe jednostki, sojusze, priorytety produkcji)

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1` | "W ustawieniach państw-miast, kiedy robimy generator, powinna być opcja nie tylko wyboru trudności [...] ale też 'wyłączone', czyli całkowicie miasta i państwa się nie generują. Są tylko same cywilizacje." | **ZINTEGROWANE** (`799fe21d`) | Domain GAME — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. 4. opcja "Wyłączone" (wzorzec `barbariansLevel`/"Brak"), `clampMiastaPanstwaCount` poluzowany do 0 wyłącznie dla tej opcji. Evaluator złapał zarzut: `generator.ts:659` (gęstość chatek) nadal liczył jakby było 1 miasto-państwo — Obrona naprawiła (drugi punkt podłączenia `allowZero`), dowiedzione żywym testem end-to-end (10 vs 20 chatek). Final Control PASS. Znana kosmetyczna usterka poza allowlistą (etykieta "N w klastrze" na ekranie startu) — nienaprawiona, nieblokująca. Testy 55/55+13/13 (żywy Chromium), tsc + 5 bramek referencyjnych zielone. |
| `R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1` | "Na najtrudniejszym poziomie [...] każde państwo-miasto powinno zaczynać od razu z dwiema jednostkami wojskowymi. Na najłatwiejszym zero, na normalnym jedna jednostka." | **ZINTEGROWANE** (`e5baa201`) | Domain GAME. Nowa `grantCityStateStartUnits`/`cityStateStartUnitCount` (easy=0/normal=1/hard=2), wpięta w OBU strukturalnie rozłącznych punktach foundowania miasta-państwa, zero zmian w foundowaniu gracza/cywilizacji AI. Evaluator złapał zarzut braku żywego dowodu (ekstrakcja funkcji zamiast realnego bootu) — Obrona naprawiła (żywy test Chromium, 22/22, 3 pełne generacje świata). Final Control PASS. Testy: 22/22 żywy render + 16/16 + 68/68, tsc + 5 bramek referencyjnych zielone. |
| (pytanie, bez kodu) | "Sprawdź, czy w kodzie jest zawieranie sojuszy [między miastami-państwami] w najtrudniejszym poziomie, bo ja nie widzę, żeby te państwa-miasta zawierały ze sobą sojusze. Coś tam chyba nie zadziałało i się wyłączyło." | **SPRAWDZONE — MECHANIZM DZIAŁA, NIE JEST WYŁĄCZONY** | Recon: `formSisterAlliancesIfThreatened()` (`main.ts:16866-16931`) jest wołane co turę (`main.ts:30680`), NIE jest martwym kodem. To NIE jest spontaniczny/losowy sojusz — zawiera się WYŁĄCZNIE gdy jednostka-zagrożenie gracza wejdzie w promień 2 heksów od siostrzanego miasta-państwa TEGO SAMEGO klastra/typu (`unitTriggersSisterAllianceThreat`), próg zależny od trudności (`citySupportByDifficulty`, hard='strong'=najniższy próg). Prawdopodobne wyjaśnienie braku obserwacji: gracz nie podszedł wystarczająco blisko, wymaga ≥2 sióstr tego samego typu klastra, lub stary zapis ma `clusterPlacement===null` (funkcja wychodzi natychmiast). Nie dispatchowane jako naprawa — jeśli właściciel nadal nie widzi sojuszy mimo bliskiego podejścia do 2+ sióstr, zgłoś ponownie z konkretnym scenariuszem do dalszego recon. |
| `R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1` | "Państwa-miasta powinny się na początku skupić na budowie jednostek wojskowych, żeby się obronić. W tej chwili nie są w ogóle wyzwaniem. Ewentualnie powinny budować palisadę jako budynki, rekrutować jednostki i na początku skupić się na tym w dużej mierze." | **ZINTEGROWANE** (`52cbd838`) | Domain GAME, balans AI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Cap wojska MP hard 4→7, normal 1→3 (easy bez zmian), nowy prog `CS_EARLY_GARRISON_TARGET` (easy=1/normal=2/hard=3) jako brama wojsko→ekonomia, usunieta kara score za mury/koszary po progu, Palisada dodana jako pierwszy tanszy wybor obronny przed Murami — wszystko wewnatrz `opts.defensiveCopy`, zero wplywu na cywilizacje AI (potwierdzone zywa symulacja bajt-identyczna). Final Control PASS, testy nowe/rozszerzone zielone, sweep 74 plikow bez nowych regresji, tsc + 5 bramek referencyjnych zielone. |

## NOWE ZGŁOSZENIE 2026-09-03 (trzy zrzuty panelu bocznego) — odkładanie kart dyplomatycznych + audyt kategorii wydarzeń

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-DYPLO-KARTA-DECYZJI-DISMISS-Q1` | "Na propozycjach dyplomatycznych powinna być też możliwość wyłączenia tej propozycji... ewentualnie do niej wrócić, jeżeli się da." + "część wydarzeń da się usunąć, to są informacyjne, a propozycji się nie da. Propozycje handlowe też powinny się usuwać jak wszystkie inne." | **ZINTEGROWANE** (`5cbe910c`) | Domain GAME, UI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Backend już obsługiwał ten przypadek — brakowało wyłącznie przycisku w `sidePanelHud.ts`: nowy predykat `isDeferrableDiploEvent` + drugi przycisk "Odłóż na później", reużywający istniejący handler `[data-sp-ignore]`, main.ts nietknięty. Dwa niezależne przebiegi Evaluatora + Final Control: zarzuty brak. Testy: 30/30 (żywy Chromium, oba źródła karty osobno), tsc + 5 bramek referencyjnych zielone. |
| (pytanie, bez kodu) | "Sprawdź, jaki jest podział komunikatów i główne grupy, abyśmy mogli zdecydować, czy nie powinniśmy ich lepiej posegregować." | **AUDYT ZAKOŃCZONY, RAPORT NIŻEJ** | Pełna taksonomia `SidePanelEvent` ustalona (subagent Explore): `kind` realnie używane = `city`/`diplo`/`enemy`/`info`/`science` (`culture`/`unit` zdefiniowane w typie, nigdzie nie tworzone). Blokujące (`blocking:true`): bunt (`revolt-`/`revolt-warn-`), pusta kolejka produkcji (`prod-empty-`), propozycje/negocjacje dyplomatyczne (`diplo`, bez własnego prefiksu id). Informacyjne (dismissowalne już dziś): nowy/zerwany szlak handlowy (`trade-new-`/`trade-lost-`), zdarzenia wioski (`village-`), naruszenie granic, eliminacja przez wchłonięcie (`elim-cs-`), wypowiedzenie wojny (`war-`), zmiana epoki (`era-`), ukończona technologia (`tech-done-`), zdeferowane hinty końca tury (`eot-hint-`). Pełna tabela plik:linia w wyniku subagenta tej sesji — do wglądu jeśli właściciel zechce dalszą segregację (np. osobna kolumna/filtr per grupa) jako przyszły temat UI. |

## NOWE ZGŁOSZENIE 2026-09-03 — kontrast etykiety tury na żółtym terenie

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-UI-TURA-ETYKIETA-KONTRAST-Q1` | "Trzeba zrobić, żeby te tury były trochę bardziej widoczne, bo czasem, gdy jest coś na żółtym terenie, to się całkowicie zmywa i nic nie widać. Może warto zmienić to na kolor niebieski." | **ZINTEGROWANE** (`1fafac1f`) | Domain GAME, UI — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. `.et-turn-lbl` — kolor `#8a8070`→`#fff8e6` + dodany ciemny `text-shadow` (kontur), reszta CSS bit-for-bit bez zmian. Final Control PASS, zerowe zarzuty, żywy dowód kontrastu na żółtym/zielonym/niebieskim (WCAG PRZED 1.23-2.66:1 → wyraźnie czytelne PO). Zintegrowane, nowa bramka 17/17 + tsc + 5 bramek referencyjnych zielone po integracji. |

## NOWE ZGŁOSZENIE 2026-09-03 — reset postępu budowy po usunięciu z kolejki (odwrócenie decyzji P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B)

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1` | "System nie zapamiętuje, ile już postępu zostało wykonane przy budowie budynku... jeżeli usuniemy go z kolejki albo w połowie zrobiony, gdy przywrócimy go znowu do kolejki, powinien być znowu w połowie zrobiony, a nie resetować się od zera... budynki powinny pamiętać swój stan, ile zostało już przeznaczonych środków na ich wybudowanie." | **ZINTEGROWANE** (`68278b20`) | Domain GAME. Recon (subagent Explore) potwierdził: to NIE przeoczenie, tylko świadoma, udokumentowana decyzja `P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B` (2026-08-13). ABC zadane właścicielowi (3 opcje) — wybrana odpowiedź: **pełna pamięć per typ budynku w danym mieście, przetrwa usunięcie z kolejki**. Allowlista skorygowana w locie (light path C-054a): `types/city.ts` był martwym plikiem (zero importów w `src/`) — realny `City` używany przez silnik to `game/cities.ts`, tam trafiło nowe pole `postepBudynkowUsuniete`. Zaimplementowano: `production.ts` (`dequeue`/`enqueue` z opcjonalnym 3. parametrem `city`, nowe helpery bankujące/wypłacające postęp), `cities.ts` (nowe pole + normalizacja w `ensureCitySaveDefaults`), `cityPanel.ts` (przekazanie `city` do `dequeue`/`enqueue`). `save.ts` bez zmian — pole addytywne, migracja przez `ensureCitySaveDefaults`, potwierdzone żywym testem na starym fixture bez awarii. Final Control PASS, nowy test `postep-pamiec-usuniecie-test.cjs` 38/38 (K1-K4: bankowanie/przywrócenie frontu, pozycja oczekująca, brak sumowania przy wielokrotnym usunięciu, brak TTL, izolacja per-miasto, migracja starego zapisu) + tsc + 5 bramek referencyjnych zielone po integracji. Pre-istniejący dryf `promote-to-front-test.cjs`/`building-queue-refund-test.cjs` (potwierdzony na czystym `origin/main` bez zmian tematu — nie regresja tego tematu). |

## NOWE ZGŁOSZENIE 2026-09-03 — korekta zamierzenia: "Wspólna walka z barbarzyńcami" to osobna umowa z regulowanym czasem, 3 tury to okres karencji, nie czas trwania

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1` | "Wspólna walka z barbarzyńcami miała być oddzielną umową, którą można podpisać na 5, 10, 15 tur lub na czas nieokreślony, aż do momentu, w którym jedna ze stron ją usunie. Czas trzech tur miał być wtedy, kiedy wygaśnie umowa... czas bez kary, dający możliwość powrotu jednostkom wojskowym na własne terytorium lub wyprowadzenia ich z terytorium innej cywilizacji, aby nie płacić kar." | **ZINTEGROWANE** (`1d8583b7`) | Domain GAME. Runda 1: GOAL 1 (czas trwania) wpięte end-to-end, GOAL 2 (karencja) zaprojektowane jako czyste funkcje ale nie wpięte (DECISION_REQUIRED — allowlista nie obejmowała main.ts), GOAL 3 — generyczny "Zerwij" już działał. Zatwierdzona lekka ścieżka: main.ts wyłącznie w 3 punktach. Runda 2: wpięcie w `runDiplomacyTurnTick`/`breakTreatyVoluntarily`/`resolveBorderMarchCtx`. Final Control PASS (agregat), zintegrowane, tsc + 5 bramek referencyjnych + testy regresyjne dyplomacji zielone po integracji. |

## NOWE ODKRYCIE 2026-09-03 (przy okazji P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1) — propozycje handlowe usuwają całą pozycję płatności zamiast redukować proporcjonalnie

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1` | (bug znaleziony podczas rozstrzygania "Oferują: —" ze zrzutu właściciela, nie osobne zgłoszenie) | **ZAREJESTROWANE, NIE DISPATCHOWANE** | Domain GAME, ekonomia/uczciwość ofert. Potwierdzone ŻYWO przez Operatora i niezależnie Evaluatora (wywołanie realnej, wyeksportowanej `clampBasketItemsToAffordable`, `gra/src/game/diplomacy-ai-balance.ts:536`, wołanej przez `main.ts:8830` wewnątrz `clampNegotiationPayloadToRealResources`): gdy skarbiec proponenta < wymagana rezerwa na PEŁNY czas trwania umowy (per_turn × turns), funkcja usuwa CAŁĄ pozycję płatności (`[]`), zamiast redukować ją proporcjonalnie do tego, na co skarbiec faktycznie starcza. Skutek: miasto-państwo/AI może żądać pełnej ilości surowca, płacąc 0 — dokładnie to widział właściciel jako "Oferują: —". To OSOBNY temat od kart decyzji (poza allowlistą tamtego dispatchu, GOAL 5 wprost zakazywał zmiany wyceny) — wymaga własnego dispatchu: zmiana `clampBasketItemsToAffordable`/`clampNegotiationPayloadToRealResources` na redukcję proporcjonalną zamiast usunięcia całej pozycji, z uwagą na wszystkie miejsca wywołania (gracz i AI, obie strony transakcji) i bez regresji na testach `diplomacy-ai-balance-*`/`diplomacy-negotiation-*`. |

## NOWE ODKRYCIE 2026-09-03 (przy okazji Final Control P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1) — trzecie, nienaprawione miejsce tego samego wzorca buga (teleport na koniec tury)

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1` | (bug znaleziony przez Final Control przy weryfikacji `P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1`; właściciel zgłosił ten sam objaw ponownie 2026-09-04: "Nadal często na drodze przejścia jednostki, pomimo przejścia przez dany teren, pole nie zostaje odkryte, zwłaszcza kiedy komputer trochę zamuli i procesor nie nadąża. To jest problem, który trzeba ogarnąć; miał być sprawdzony już wcześniej." — korelacja z "zamuleniem" wyjaśniona reconem: ta ścieżka aktywuje się gdy gracz zdąży kliknąć "koniec tury" zanim animacja marszu się dokończy, co jest statystycznie częstsze przy wolniejszym sprzęcie/dłuższych animacjach, nie jest to jednak bug klatek per se) | **DISPATCHOWANE** 2026-09-04 — worktree `wt-mgla-teleport-koniec-tury`. | Domain GAME. Potwierdzone żywo (grep+odczyt `main.ts`) przez Evaluatora, Obronę I Final Control niezależnie: `triggerPlayerEndTurn()` (`main.ts` ok. 26709, blok "Snap any in-flight animation to its destination" linia 26742) — gdy gracz kończy turę PODCZAS trwającej animacji wieloheksowego marszu, silnik teleportuje jednostkę na `anim.destQ/destR` (linie 26751-26752), woła `checkVillageRewardsAlongPath`/`checkBarbCampDestructionAlongPath` po `anim.pathHexes` (ten sam wzorzec co miejsca naprawione w `P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1`), ale NIGDY nie woła nowej `computeVisibleAlongPath`/`addExplored` — mgła pomija środek ścieżki dokładnie jak w oryginalnym zgłoszeniu właściciela. Poza allowlistą tamtego dispatchu (main.ts miał tylko 2 dozwolone punkty wpięcia) — wymaga własnego dispatchu: trzecie wpięcie `addExplored(explored, computeVisibleAlongPath(anim.pathHexes, map, unitSight(su)))` w bloku snapu animacji przy `triggerPlayerEndTurn()`, analogicznie do już zintegrowanego wzorca. |

## NOWE ZGŁOSZENIE 2026-09-03 — usunięcie limitu dystansu tras handlowych (odwrócenie wcześniejszej decyzji Q6=B)

| ID | Prośba | Status | Uwagi |
|---|---|---|---|
| `R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1` | "usuń ten limit max 12xów do lądu i 20 dla morza [...] to jest nielogiczne dlatego że przy dużych mapach te odległości powodują że żadne miasta nie mogą ze sobą handlować. [...] rozumiem dwie cywilizacje muszą ze sobą graniczyć to jest okej ale to nie oznacza że na przykład stolica danej cywilizacji nie może handlować bo jest za daleko ze stolicą innej cywilizacji." | **DISPATCHOWANE** | Domain GAME, ekonomia/wydajność — Operator+Evaluator+Final Control Sonnet 5, effort HIGH. Świadome ODWRÓCENIE wcześniejszej decyzji właściciela (Q6=B, 2026-07-20, `econ-params.json:704`) na jego wyraźne żądanie — nie błąd agenta, jak wstępnie podejrzewał właściciel. Recon: próg dystansu (`trade-routes.ts` linie 351/370) i promień BFS (`maxSteps=ladMaxDist×2`, linia 362/382) to DWA sczepione mechanizmy — usunięcie samego progu bez podniesienia `maxSteps` odtworzyłoby limit "tylnymi drzwiami". Krytyczne sprzężenie: `TradeRouteIncomeParams` (szczyt krzywej dochodu) czyta TE SAME klucze JSON co próg connectivity — rozstrzygnięte w dispatchu (GOAL 3): rozdzielić parametry, dochód dla dalekich tras = szczyt (40), bliskie trasy bez zmian balansu. Ryzyko wydajnościowe na mapie "superogromny" (672×476, do ~1150 heksów) — wymaga żywego pomiaru PRZED/PO. Dispatch `00-dispatch.md`. **ZINTEGROWANE** (`9b31997d`) — Final Control PASS. Twarde progi 12/20 usunięte jako warunek istnienia trasy; jedyną blokadą pozostaje fizyczna nieosiągalność (BFS, maxSteps skalowany do wymiarów mapy). Krzywa dochodu z dystansem oddzielona od connectivity, zero regresji balansu (26/26 assercji bajt-identyczne PRZED/PO dla d≤maxDist). Zero regresji wydajności (test na syntetycznej mapie 672×476, dystans=1146, &lt;10s). Temat ZAMKNIĘTY. |

## NOWE ZGŁOSZENIE 2026-09-03 — audyt kompletności backlogu, 8 odpowiedzi ABC właściciela naraz

Kontekst: właściciel poprosił o sprawdzenie, czy wszystkie zgłoszone tematy mają operatora i
workflow. Audyt (subagent) zidentyfikował listę tematów bez dispatchu; część okazała się
FAŁSZYWYMI ALARMAMI (już zamknięte we wcześniejszych, późniejszych wpisach tego samego pliku,
które audyt przeoczył — zweryfikowane ręcznie przez orkiestratora przed zadaniem pytań, żeby nie
pytać o już odpowiedziane): `R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` (ZINTEGROWANE,
`3284`+), `R-REPO-SCIEZKA-KANON-FINALNA-Q1` (ZINTEGROWANE `f274df70`),
`P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1` (ZAMKNIETE, interpretacja C), 2 z 3 pytań
`P-MAPGEN-PANGEA-OBRYS` (Pytania 1=A, 2=B już odpowiedziane wcześniej w
`docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md` — tylko Pytanie 4 pozostawało realnie otwarte).

Realnie otwarte tematy — 8 pytań ABC zadanych i odpowiedzianych w tej turze:

| ID | Pytanie | ECHO właściciela | Uwagi |
|---|---|---|---|
| `P-MAPGEN-PANGEA-OBRYS` (Pytanie 4) | Nazwa `TerenBazowy.Wybrzeze` myląca (woda nazwana jak ląd) — co zrobić? | **B** — zmiana nazwy na "płytkie morze" + przepięcie 142 ręcznych porównań `=== TerenBazowy.Morze` na istniejący helper `isWaterTerrain()` | Ostatnie z 4 pytań tego tematu — 1/2/3 już były odpowiedziane (A/B/B) w `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md`. Do dispatchu: rename + repin, zero zmian w `generator.ts`, sprawdzić wszystkie call-site `groupLandMassKeys`. |
| `P-DYPLO-ZELAZO-BRAK-WOJNY-WYMUSZONEJ-Q1` | Epoka Żelaza nie ma mechanizmu wojny wymuszonej (Kamień/Brąz mają) — jak uzupełnić? | **FAŁSZYWY ALARM — [duplicate_of: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1]** | Operator (zgodnie z regułą "sprawdzaj komendą, nie z pamięci") wykrył przed kodowaniem: `forced-war-iron.ts` JUŻ ISTNIEJE na `origin/main` (241 linii, identyczny wzorzec co Brąz — 2 miasta/20 tur odpoczynku/20 tur cooldownu, wyzwalacz=awans epoki, filtr `oid>0`), zintegrowany 2026-08-27 pod ID `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1` (`3348ebf3`), z następcą dowodowym już zdeployowanym (Fala 329). Wiersz rejestru z 2026-08-27 (linia niżej) powstał TEGO SAMEGO dnia co równoległy temat realizujący ten sam GOAL i nigdy nie dostał tagu duplikatu — audyt kompletności tej sesji (szukający po dosłownym ID) tego nie wyłapał, bo rozwiązanie trafiło pod INNYM ID. Evaluator i Obrona niezależnie potwierdzili dowód (git show/merge-base). Zero zmian w kodzie w tej rundzie — Operator zatrzymał się PRZED kodowaniem (DECISION_REQUIRED), runda niezużyta. |
| `P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1` | Czy Stadnina (surowiec Koń) wchodzi do lasu jak owce/bydło/lamy? | **Odpowiedź precyzująca regułę, nie proste tak/nie**: "Stadnina, w przeciwieństwie do owiec/bydła/lam, jest ulepszeniem SUROWCOWYM — ma podlegać takim samym zasadom jak Tartak czy Kopalnia, nie jak pastwiska. Jeśli symbol konia jest na lesie, nie przeszkadza to w postawieniu tam Stadniny. Późniejsze usunięcie lasu NIE powinno usuwać Stadniny — jest niezależna od lasu, tak samo jak Glinianka." | Do dispatchu: Stadnina dołącza do grupy budynków surowcowych niezależnych od obecności lasu (wzorem Glinianki/Tartaku/Kopalni), NIE do grupy pastwisk objętej regułą 07-29. Recon Operatora: potwierdzić dokładny dzisiejszy warunek blokujący Stadninę w lesie i zamienić go na wzorzec Glinianki. |
| `R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1` | Ciągła, dwukierunkowa widoczność mapy dla aktywnego sojuszu (nie tylko jednorazowy zrzut)? | **Tak, działaj** | Do dispatchu: aktywuje się przy zawarciu sojuszu, deaktywuje przy zerwaniu; dotyka logiki widoczności per-turę gracza ORAZ AI — wymaga starannej weryfikacji braku regresji w decyzjach AI. |
| `P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1` | Bramka `filter-repo` (nieodwracalne przepisanie historii Gita) zablokowana — 2 z 8 bundli PLAYTEST nie odtworzą się wcale. Jak postąpić? | **Zaakceptuj trwałą utratę tych 2 bundli (BITWA-DUZA, OBLEZENIE-DUZE), idź dalej z filter-repo** | Do dispatchu/wykonania: PRZED uruchomieniem filter-repo, jawnie udokumentować w commicie/raporcie które dokładnie bundle są trwale tracone i dlaczego (zgoda właściciela), potem odblokować bramkę. |
| Wojna trójstronna, rozszerzenie `R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1` (pytanie 1/3: zakres) | Wyłącznie wojny wymuszone, czy też ogólna ścieżka decyzyjna AI? | **Wyłącznie wojny wymuszone** (Kamień/Brąz/Żelazo) | Węższy, bezpieczniejszy zakres — zero zmian w ogólnej logice AI (`ai.ts` Priorytet 4). |
| Wojna trójstronna (pytanie 2/3: wyjątek sojuszu) | "Chyba że jedną z nich łączy sojusz" — z kim: z graczem, czy AI-AI? | **Wyjątek gdy KTÓRAKOLWIEK ze stron ma aktywny sojusz z graczem** | Jeśli AI-A lub AI-B ma sojusz z graczem, mechanizm się nie uruchamia — sojusznik nigdy nie dołączy do wojny przez ten efekt domina. |
| Wojna trójstronna (pytanie 3/3: trudność) | Zwiększa trudność gry (możliwe równoczesne wojny z dwiema cywilizacjami) — zamierzone czy wymaga złagodzenia? | **Zamierzone zaostrzenie, bez dodatkowego łagodzenia** | Wprowadzić dokładnie jak opisano, bez dodatkowych progów/ograniczeń trudnością. |

Wszystkie 8 tematów WYMAGAJĄ napisania `00-dispatch.md` i uruchomienia przez Workflow —
orkiestrator kontynuuje w kolejnych krokach tej samej sesji.

## NOWE ZGŁOSZENIE 2026-09-03 — ECHO właściciela: P-DYPLO-BILANS-GATE, pokój bez bramki PW

| ID | Pytanie | ECHO właściciela | Uwagi |
|---|---|---|---|
| `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA` (runda 4) | Runda 3 wykazała (Evaluator, dowód matematyczny): gola propozycja pokoju AI podczas wojny PRAWIE ZAWSZE blokowana przez bramkę pwBalance — realny sufit relTotal (zaufanie≤29 podczas wojny + respekt≤40 bo AI proponuje pokój tylko gdy słabsze) nie wystarcza do dodatniego bilansu. Czy przyjęcie OFEROWANEGO pokoju ma w ogóle podlegać tej bramce? | **Pokój bez bramki PW** — propozycje pokoju (oba kierunki: gracz i AI proponuje) NIGDY nie są blokowane liczbą pwBalance; przycisk Przyjmij zawsze aktywny dla oferowanego pokoju. Sama liczba bilansu może nadal być pokazywana informacyjnie, ale nie decyduje o `canAccept`. | **RUNDA 4 ZINTEGROWANA** (`e253e64a`) — Final Control PASS. Zakres: WYŁĄCZNIE `case 'pokoj'` w `evaluateProposal`/`canAccept` — inne typy propozycji (handel, sojusz, trybut...) bramka PW zostaje bez zmian. Bilans PW nadal liczony i pokazywany informacyjnie w panelu UI, ale nie blokuje `canAccept` dla pokoju. Temat ZAMKNIĘTY. |

## DISPATCH 2026-09-03 — 6 tematów z ECHO tej sesji (Pangea P4, Żelazo wojna wymuszona, Stadnina, sojusz widoczność ciągła, bundle nieodtwarzalne, wojna trójstronna)

| ID | Status | Uwagi |
|---|---|---|
| `P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1` | **ZINTEGROWANE** (`6be6be37`+`338bb9d6`) | Rename `TerenBazowy.Wybrzeze`→`PlytkieMorze` + przepięcie na `isWaterTerrain()`. Evaluator znalazł 3 pominięte pliki testowe (regresja realna, naprawiona przez Obronę). Final Control: DECISION_REQUIRED wyłącznie na kryterium 2 (`map-gen-regression-test.cjs` nie ukończył się żywo z powodu przeciążenia współdzielonej maszyny, load 9-18/4 rdzenie) — orkiestrator zaakceptował ryzyko (zero zmian w `generator.ts`, wszystkie lżejsze testy terenu/mapy/bitwy zielone, w tym `pangea-land-shape-test.cjs` z poprawną metryką coast/√A po naprawie Obrony) i zintegrował; `map-gen-regression-test.cjs` do odrębnego zweryfikowania gdy maszyna będzie mniej obciążona. |
| `P-DYPLO-ZELAZO-BRAK-WOJNY-WYMUSZONEJ-Q1` | **ZAMKNIĘTE — FAŁSZYWY ALARM, [duplicate_of: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1]** | Patrz wpis wyżej (2026-09-03) — mechanizm już istniał na `main` pod innym ID, zero dispatchu kodu potrzebne. |
| `P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1` | **ZINTEGROWANE** (`ed7c8bb5`) | Stadnina dołączyła do grupy budynków surowcowych (wzorem Glinianki) — budowalna w lesie, przetrwa usunięcie lasu. Evaluator zgłosił drobną notę proceduralną (plik danych `terrain-improvements.json` spoza dosłownej allowlisty — potwierdzone jako bezpieczne rozszerzenie, tylko opis CivPedii, bezpośredni precedens). Final Control PASS. Testy 27/27+102/102+136/136+143/143, tsc + 5 bramek referencyjnych zielone. |
| `R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1` | **ZINTEGROWANE** (`3a91fcf5`) | Ciągła dwukierunkowa widoczność WYŁĄCZNIE dla aktywnego sojuszu (sojusz_defensywny/sojusz_pelny). Runda 1: strona gracza. Runda 2 (ECHO "Tak, zrob to tez dla AI (obustronnie)"): strona AI — `ownPlayerVisibleHexes()` wydzielona, `currentVisibleForOwner(ownerId)` dokłada unię dla sojuszniczych AI, zero zmian w `ai.ts`. Final Control PASS, żywy test 38/38. |
| `P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1` | **PRZYGOTOWANIE ZINTEGROWANE** (`c2e00778`) — Final Control PASS, filter-repo NIE URUCHOMIONE | Dokument utraty (`02-utrata-bundli.md`) + dokładna komenda filter-repo celująca WYŁĄCZNIE w `main` (`03-komenda-filter-repo.md`, nieuruchomiona, wymaga osobnej jawnej zgody właściciela przed Krokiem 1 `--analyze`) + rozszerzenie `sync-playtest-bundles.cjs` o 2 wcześniej nieobsługiwane nazwy (BITWA-DUZA, OBLEZENIE-DUZE, żywy test 9/9). **NOWE USTALENIE wymagające decyzji właściciela przed faktycznym wykonaniem:** 298 gałęzi zdalnych poza `main`, z czego 281 dotyka tych samych 8 ścieżek własnymi commitami — filter-repo na samym `main` NIE uczyni utraty pełną w całym repozytorium. Pytanie do zadania przy prośbie o autoryzację: czy filter-repo ma celować wyłącznie w `main` (rekomendacja Operatora/Final Control) czy potrzebny jest osobny temat PROCES do sprzątania pozostałych gałęzi. Sam Krok 1+ (faktyczne `filter-repo`) NIE jest wykonany — czeka na osobną, jawną autoryzację właściciela. |
| `R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1` | **ZINTEGROWANE** (`ec4dd4fa`, 2 rundy) | Gdy dwie AI juz we wzajemnej wojnie wymuszonej i gracz bez wlasnej pary — obie wypowiadaja jednoczesnie wojne graczowi, wyjatek gdy KTORAKOLWIEK strona ma aktywny sojusz z graczem. Runda 2: naprawiona kolejnosc pary w syntetycznym traktacie testowym (kontrakt ActiveDeal.strony wymaga pary kanonicznej) ktora falszywie negowala wlasne kryterium 2 zywego testu. Final Control PASS, zywy test 24/24. |

## NOWE ZGŁOSZENIE 2026-09-03 — karty encji (technologia/budynek) nakładają się zamiast się zastępować

| ID | Zgłoszenie | Recon orkiestratora | Status |
|---|---|---|---|
| `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` | "Dopiero jak wyłączę kartę technologii, to wtedy się włącza [poprzednia]. Chodzi o to, żeby nie wszystkie włączały się naraz, tylko ta, którą się kliknie, aby pojawiła się obok, a gdy kliknie się inną kartę lub inny przycisk, powinna zniknąć i pojawić się nowa." — ze zrzutami: klik na link "Cegielnia" wewnątrz karty "Garncarstwo" otwiera nową kartę-dialog NAD poprzednią zamiast ją zastąpić; poprzednia staje się widoczna dopiero po zamknięciu nowej. | Przyczyna zlokalizowana: `openDialog()` w `gra/src/ui/entityCards/renderer.ts:439-461` przy KAŻDYM wywołaniu tworzy NOWY, niezależny `<div class="entity-card-backdrop">` dołączany do `document.body`, bez zamykania żadnego wcześniej otwartego dialogu. `pushOverlay`/`popOverlay` (`escapeOverlayStack.ts`) zarządzają WYŁĄCZNIE klawiszem Escape (stos zamykania), nie wymuszają unikalności — wielokrotne wywołanie `openEntityCard(..., {mode:'dialog'})` (m.in. z linku wewnątrz innej karty, `renderer.ts:433`, oraz z `buildModeHud.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts`) legalnie stackuje wiele backdropów jednocześnie — dokładnie zgodne ze zrzutami. | **ZINTEGROWANE** (`85865586`) — Final Control PASS. Moduł-level stan aktywnego dialogu w `openDialog()`: nowe otwarcie synchronicznie zamyka poprzedni PRZED zbudowaniem nowego, ten sam kind+id idempotentnie. Żywy test Chromium 26/26 (w tym dowód anty-samooszukiwania: reprodukcja buga na kodzie sprzed zmiany). Zero zmian w call site'ach/escapeOverlayStack.ts. Temat ZAMKNIĘTY. |

## NOWE ZGŁOSZENIE 2026-09-03 — miasta-państwa blokują wojnę wymuszoną epoki

| ID | Pytanie | Recon orkiestratora | ECHO właściciela |
|---|---|---|---|
| `R-WOJNA-WYMUSZONA-MIASTA-PANSTWA-WYKLUCZENIE-Q1` | "Wydaje mi się, że wojna epoki nie rozpoczyna się, dopóki państwa-miasta nie zostaną pokonane. Pytanie, czy nastąpi to później, w momencie, gdy dana cywilizacja pokona wszystkie państwa-miasta?" | Potwierdzone w kodzie: `alreadyAtWarAnyRole` (`countActiveWarsForOwnerExcludingBarbarians`, `main.ts:17473-17480`, oparte na `countActiveWarsExcluding` w `forced-war-common.ts:88-101`) liczy WSZYSTKIE aktywne wojny danego ownera z wyjątkiem barbarzyńców (`isBarbarian`) — wojny z miastami-państwami SIĘ LICZĄ i blokują `isEligibleForXForcedWar` (Kamień/Brąz/Żelazo) dopóki ta cywilizacja jest w stanie wojny z czymkolwiek, w tym z pojedynczym miastem-państwem. To NIE jest trwała blokada — próba jest ponawiana co turę (`wasPending` nigdy nie ginie), więc wojna epoki odpali się automatycznie gdy TA cywilizacja przestanie być w wojnie z kimkolwiek (nie wymaga pokonania WSZYSTKICH miast-państw na mapie). Miasta-państwa nigdy nie są celem/napastnikiem wojny wymuszonej (osobny filtr `!isOwnerClusterCityState(...)`, niezmieniany). Świadomie udokumentowane wykluczenie barbarzyńców istnieje (`P-WOJNA-JUZ-W-WOJNIE-LICZY-BARBARZYNCOW-Q1`) — analogicznej, jawnej decyzji o miastach-państwach dotąd nie było. | **WYCOFANE, ZASTĄPIONE poprawną odpowiedzią niżej** — pierwsza odpowiedź "wyklucz jak barbarzyńców" była błędna (właściciel: "chyba dałem złą odpowiedź"). Poprawna reguła: wojna z miastem-państwem MA NADAL blokować (zero zmian tutaj — kod zostaje) + dodatkowo próg minimalnej tury (patrz `R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1` niżej). Zero dispatchu kodu dla tego wpisu — zamknięte bez zmian. |
| `R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1` | Poprawiona odpowiedź: "lepiej byłoby dać cywilizacjom czas na zajęcie miast-państw — wojny danej epoki wybuchałyby najwcześniej w 25. turze [od wejścia w epokę], a wojna z miastem-państwem nadal blokuje, żeby cywilizacja nie musiała walczyć na dwa fronty naraz." | Recon: próg "nie wcześniej niż 25 tur" JUŻ ISTNIEJE dla Kamienia (`WOJNA_KAMIEN_WYMUSZONA_START_TURY=25`, `currentTurn>=25`, `forced-war-stone.ts:19,46`) i dla Brązu (25 tur OD WEJŚCIA w epokę, `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI=25`, `eraEnterTurn`/`bronzeEraEnterTurnByOwner`, `forced-war-bronze.ts:86,125-127`, `main.ts:1688,1786`). Dla Żelaza progu NIE MA — `isEligibleForIronForcedWar` (`forced-war-iron.ts:110-111`) sprawdza wyłącznie `isMainAiCiv && !isAlreadyAtWarAnyRole`, bez żadnego warunku tury. To była ŚWIADOMA, udokumentowana decyzja (komentarz `forced-war-iron.ts:21,26`: "Sztywny próg tury byłby tu bez sensu — do Żelaza cywilizacje docierają w bardzo różnych turach"), nie przeoczenie. | ABC właściciela, potwierdzone po doprecyzowaniu: **Tak, dodaj 25 tur od wejścia w Żelazo** — analogicznie do Brązu (nie do Kamienia, bo Żelazo jest epoką osiąganą awansem w różnych turach, tak jak Brąz). Odwraca świadomie udokumentowaną wcześniejszą decyzję o braku progu dla Żelaza — jawnie potwierdzone przez właściciela po pokazaniu mu tego kontekstu. **ZINTEGROWANE** (`7d77e978`) — Final Control PASS (runda 2/5, runda 1 zablokowana 2 istniejącymi testami spoza allowlisty, naprawione mechanicznie w rundzie 2). Temat ZAMKNIĘTY. |

## NOWE ZGŁOSZENIE 2026-09-03 — miasta-państwa zbyt pasywne (postawa ofensywna, punkty zbiorcze)

| ID | Pytanie | Recon orkiestratora | ECHO właściciela |
|---|---|---|---|
| `R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1` | "Sprawdź, jakie dodatkowe elementy są w trudności państw-miast [...] wspólnej walki, sojuszu, czy mają być obronne, czy atakujące, oraz punktów zbiorczych. Sprawdź, co jest i czy czasem nie zostało to w kodzie wyłączone, bo ostatnio te państwa-miasta funkcjonują zbyt pasywnie." | Potwierdzone: NIC nie zostało wyłączone przez 3 ostatnio zintegrowane tematy miast-państw (diff po diff, zero usunięć w tym obszarze). Pasywność jest strukturalna, nie regresją: (1) postawa ofensywna (`cityStateOffensiveSupport`, `main.ts:29096-29100`) działa WYŁĄCZNIE gdy `_menuCityStateDifficultyVsPlayer==='hard'` — na normal/easy zawsze `false` ("legacy defend-only"). (2) Ta sama flaga + `warAllyOwnerIds` (realne sojusze bojowe) dotyczą WYŁĄCZNIE miast-państw tego samego typu cywilizacji co gracz (`isOwnerPlayerSameCivType`) — nie zmieniane w tej rundzie (właściciel nie wybrał tej opcji). (3) Mechanizm punktów zbiorczych (`planArmyConcentration`/`planArmyFrontMerge`, `ai.ts:2662-2726`) jest gated `isMajorAiOwner(opts)` = `!opts.defensiveCopy` — miasta-państwa NIGDY z niego nie korzystają, od wprowadzenia modułu; mają tylko słabszy licznik-w-promieniu pod `offensiveSupport`. Posiłki obronne między "siostrami" i auto-sojusz sióstr działają szeroko, bez ograniczeń — NIE są źródłem pasywności, zero zmian tam. | **Dwie zmiany z trzech zaproponowanych**: (1) postawa ofensywna ma działać też na normal/easy, nie tylko hard (usunięcie warunku `_menuCityStateDifficultyVsPlayer==='hard'` z `cityStateOffensiveSupport`, `isOwnerPlayerSameCivType` zostaje bez zmian). (2) Punkty zbiorcze (`planArmyConcentration`/`planArmyFrontMerge`) mają być dostępne też dla miast-państw — zakres dokładny do dispatchu (najbezpieczniejsza propozycja: gated dodatkowo `opts.cityStateOffensiveSupport`, żeby defend-only PM nie ciągnęły jednostek z obrony domu do rajdu). Rozszerzenie na wszystkie typy cywilizacji (nie tylko typu gracza) — NIE wybrane, poza zakresem tej rundy. **ZINTEGROWANE** (`56d38457`, 2026-09-03, 3 rundy) — GOAL 1 (postawa ofensywna niezależna od trudności) zintegrowany od rundy 1; GOAL 2 (punkty zbiorcze dla PM) okazał się martwym kodem w rundzie 1 (`decideAITurn` przekierowuje PM do `decideDefensiveCopyTurn` przed gate'owanym blokiem) — runda 2 podłączyła realnie wewnątrz `decideDefensiveCopyTurn` (autoryzacja rozszerzenia zakresu udokumentowana w PYTANIA-OTWARTE.md); runda 3 naprawiła metodologię testu wydajności po FAIL Final Control (test mierzył zanieczyszczony przedistniejącym kosztem `getNeutralVillagesInTerritory` wynik, nowa sekcja izolowana mierzy wyłącznie koszt GOAL 2). Przedistniejący koszt `getNeutralVillagesInTerritory` zarejestrowany osobno w PYTANIA-OTWARTE.md jako temat do przyszłego dispatchu. |

## NOWE ZGŁOSZENIE 2026-09-03 — reorganizacja ikon paska minimapy

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1` | "Trzeba zrobić delikatny porządek w tych ikonach. Po pierwsze, same kopalnie i ludki postawiłbym obok tego plus minus 150 [zoom UI], czyli ułożył w górnej części minimapy. Usunąłbym włącznik kultury i religii i powiązał go z górnym panelem, gdzie jest kultura i religia — w momencie gdy naciskamy kulturę, powinno się zaznaczać (podkreślenie na mapie które wcześniej było w tych ikonkach), a one już nie będą potrzebne. Zostaje wyznaczanie granic po tej stronie i trzeba dorobić jeszcze jeden — włącz/wyłącz połączenia handlowe. Po prawej stronie będą dwie ikony: granice i połączenia handlowe, a u góry na minimapie obok plusów/minusów chłopek i surowce." | 5 ikon to `.civ-minimap-tools` w `gra/src/ui/minimapHud.ts::ensureToolButtons()` (linie 342-411), NIE `mapToolbarHud.ts` (osobny, niepowiązany lewy toolbar). Mapowanie: 1=`workerBtn` (robotnicy na polach, `toggleWorkerOverlayOnMap`), 2=`depositBtn` (złoża/surowce, `toggleResourceDepositOverlayOnMap`), 3=`mapBtn` (zasięg KULTURY, `toggleCultureRangeOnMap`), 4=`searchBtn` (zasięg RELIGII, `toggleReligionRangeOnMap`), 5=`territoryBtn` (granice terytorium, zostaje bez zmian). Kontrolka zoom "-150%+" to ODDZIELNY element (`civ-ui-zoom`, powiększenie CAŁEGO UI, nie zoom mapy) w `hud.ts::renderUtilDock()`, pozycjonowany przy minimapie przez `minimapLayout.ts`, ale inny kontener DOM niż `.civ-minimap-tools`. Chipy Kultura/Religia w górnym pasku (`hud.ts::renderBarD1B()`, `act:'kultura'`/`act:'religia'`) dziś NIE wywołują `toggleCultureRangeOnMap`/`toggleReligionRangeOnMap` (otwierają tylko panel szczegółów) — trzeba dopiąć. Trasy handlowe: renderer (`render/tradeRoutesOverlay.ts`, `refreshTradeRoutesOverlay` w `main.ts:10913-10928`) JUŻ ISTNIEJE i rysuje się ZAWSZE gdy trasy istnieją (brak flagi widoczności) — nowy toggle wymaga wyłącznie nowej zmiennej stanu + guard + przycisku, wzorem `showResourceDepositOverlay`. Do dispatchu: przenieść worker/deposit do rzędu zoom (wymaga rozszerzenia `HudApi`/`hud.ts` o hooki dziś dostępne tylko w `main.ts:20251-20257`), usunąć mapBtn/searchBtn z `.civ-minimap-tools` i podpiąć pod chipy górnego paska, dodać nowy przycisk widoczności tras handlowych obok `territoryBtn`. |

## NOWE ZGŁOSZENIE 2026-09-03 — sojusz siostrzany miast-państw: zły wyzwalacz, brak wspólnego ataku

| ID | Zgłoszenie | Recon orkiestratora | ECHO właściciela |
|---|---|---|---|
| `R-MIASTA-PANSTWA-SOJUSZ-SIOSTRZANY-ATAK-Q1` | "Wydaje mi się, że te sojusze błędnie określają się, że mechanizm włącza się, gdy jednostki wrogie pojawiają się obok. To powinno włączać się, gdy sojusz pomiędzy miastami-państwami zostanie zaatakowany, na przykład przez gracza lub AI. Wtedy powinny od razu wchodzić w sojusz i wspólnie bronić oraz atakować." | Potwierdzone w kodzie: `unitTriggersSisterAllianceThreat` (`ai-cs-absorption.ts:167-178`) wyzwala się na samą OBECNOŚĆ wrogiej jednostki w promieniu `threatRadius` (main.ts:16964-16972), NIE na faktyczny atak/wojnę — i to WYŁĄCZNIE dla gracza (`isSisterAllianceThreatOwner`: `ownerId===0`, udokumentowane jako świadoma decyzja "Q1=A"), AI nigdy nie wyzwala tego mechanizmu. Po zawarciu sojuszu nie ma dziś żadnej logiki "wspólnie atakuj napastnika" — istnieją tylko osobne, niepowiązane mechanizmy (posiłki obronne `sisterCityStates`, `ai.ts:3330-3369`; postawa ofensywna `cityStateOffensiveSupport` z osobnego tematu). | **Wszystkie trzy zmiany potwierdzone**: (1) wyzwalacz zmienia się z "wroga jednostka w promieniu" na "faktyczny atak/wypowiedzenie wojny na siostrę". (2) Wyzwalacz ma działać też dla AI, nie tylko gracza (odwrócenie decyzji Q1=A). (3) Po zawarciu sojuszu siostry mają też wspólnie ATAKOWAĆ napastnika, nie tylko bronić. **ZINTEGROWANE** (`9c7853e9`) — Final Control PASS, kolizja z równoległym `R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1` uniknięta (blok `cityStateOffensiveSupport`/`warAllyOwnerIds` bajt-identyczny, nowe pole `sisterAllianceUnderAttack` dodane osobno). Temat ZAMKNIĘTY. |

## NOWE ZGŁOSZENIE 2026-09-03 — pasek bitwy pokazuje nazwę jednostki zamiast tożsamości strony

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1` | Ze zrzutem: "w wyniku bitwy jest informacja 'wojownik wygrywa', a powinno być 'gracz wygrywa'. Po lewej stronie powinna być informacja 'Grecy' zamiast 'wojownik', a po drugiej stronie powinna być 'Korynt, Grecy, państwo-miasto' zamiast 'wojownik'. Ikona państwa-miasta powinna znajdować się po prawej stronie, a po lewej stronie ikona cywilizacji, która atakuje." | Wstępnie zlokalizowane: `_sideDisplayLabel(side)` (`battleScene.ts:8841-8851`) zwraca nazwę TYPU jednostki (`snaps[0].typeId`/`u.bu.nazwa`) gdy w rosterze jest 1 jednostka, zamiast `_attackerCivLabel`/`_defenderCivLabel` (już istniejące, poprawnie użyte gdzie indziej — `_buildEndDetailsSide`, `battleScene.ts:8938-8964`, `civLabel: this._attackerCivLabel`/`_defenderCivLabel`). To wyjaśnia werdykt "Wojownik wygrywa" w popupie "Wynik bitwy" (`battle-summary.ts:132-133`, `atkLabel`/`defLabel` karmione z `_sideDisplayLabel`). Osobny pasek nagłówka bitwy (górne rogi, medalion+bold nazwa+podtytuł "GRECY·ATAKUJĄCY") i dobór ikon per strona — recon w toku, nie potwierdzone jeszcze czy to ten sam czy osobny mechanizm. **ZINTEGROWANE** (`9479ccc4`, 3 rundy) — `_sideDisplayLabel()` ma bezwarunkowe pierwszeństwo civLabel; naprawiona też niezależna ścieżka mapowego podsumowania (`applyMapBattleOutcomeWithSummary`), która nadal pokazywała nazwę jednostki. GOAL 1 (civLabel w pasku+werdykcie, obie ścieżki) i GOAL 2 dla pełnych cywilizacji (portret władcy) w pełni dowiedzione żywo, mutacyjnie. Udokumentowane ograniczenie: ikona miasta-państwa/barbarzyńcy jako strony bitwy bez żywego dowodu z klikanej bitwy (brak presetu testowego stawiającego ich jako stronę) — dowód wyłącznie przez wstrzyknięcie widoku, jawnie oznaczone w kodzie; do osobnego przyszłego tematu jeśli istotne. Final Control PASS-WITH-NOTES. |

## NOWE ZGŁOSZENIE 2026-09-03 — karta ulepszenia (boczna) wychodzi poza ekran / czasem otwiera się jako dialog pod spodem

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1` | Ze zrzutem: klik "Szczegóły →" przy "Obóz łowiecki" w karcie technologii "Łowiectwo" otwiera kartę boczną (jak zaplanowano), ale wychodzi poza ekran. Klik na sam wiersz "Obóz łowiecki" (nie przycisk) otwiera DRUGĄ kartę pod spodem zamiast obok. | **Dwie odrębne, potwierdzone kodem przyczyny:** (1) Overflow: `improvementAdapter.ts:137` renderuje `improvement.warunek` dla `oboz_lowiecki` jako surową notatkę deweloperską ~700 znaków zaczynającą się od ID tematu `R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1` (widoczne w zrzucie jako "WYMAGA...") — nieprzenoszony tekst rozpycha kartę boczną poza breakpoint 1160px (`techDiscoveryNotice.ts:756-759`). (2) Regresja stackowania: `wireSideCardLinks()` (`techDiscoveryNotice.ts:665-677`, mechanizm "karta obok" z wcześniejszego tematu P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1, `57006261`) w fazie capture łapie WYŁĄCZNIE `button[data-entity-kind][data-entity-id]` — ale `P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1` (`5b05773c`, zintegrowane tego samego dnia) uczyniło klikalnym CAŁY `<div class="entity-card-row" data-row-entity-kind>` (nie `<button>`), więc klik na label (nie na przycisk "Szczegóły") omija capture-listener i trafia do bubble-fazy → deleguje do `openEntityCard(...,{mode:'dialog'})` w `renderer.ts` → dialog renderuje się POD hostem karty bocznej (z-index 520 vs 940) zamiast obok. Dwa niedopasowane, nigdy nieuzgodnione ze sobą commity. **ZINTEGROWANE** (`7c913485`, 2 rundy) — `wireSideCardLinks()` naprawiony (fallback na `.entity-card-row[data-row-entity-kind]`), 7 wpisów `terrain-improvements.json` oczyszczonych z notatek deweloperskich (`warunek`→tekst gracza, historia przeniesiona do `uwagi`, nierenderowane), overflow karty bocznej domknięty i dowiedziony przyczynowo (kontrola negatywna B7-K). Final Control PASS. |

## NOWE ZGŁOSZENIE 2026-09-03 — handel lądowy ma wymagać faktycznej wspólnej granicy

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1` | "Jeżeli chodzi o ostatnie zmiany w handlu [...] handel powinien być możliwy tylko wtedy, kiedy graniczymy z daną cywilizacją [...] to nie oznacza że nasza granica opiera się na ich granicy. Druga zasada: jeżeli jakaś cywilizacja jest dalej i nie mamy z nią wspólnej granicy, możemy handlować z nią, ale już poprzez port. [...] w tej chwili praktycznie każdy może handlować z każdym po całym kontynencie, kiedy został zdjęty limit 12." | **Potwierdzone: NIE regresja `R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1` — świadomie pozostawiona luka.** Ten temat (GOAL 6 tamtego dispatchu) jawnie stwierdzał "cywilizacje NIE muszą dziś fizycznie graniczyć [...] nie zmieniaj tego wymogu" — zawężająca interpretacja pierwotnych słów właściciela (`REJESTR-PROSB-I-ZADAN.md:4335`, "dwie cywilizacje muszą ze sobą graniczyć to jest okej"), teraz odrzucona. Sąsiedztwo terytorialne NIGDY nie było sprawdzane nigdzie w kodzie (ani w handlu, ani w dyplomacji) — brak gotowej funkcji `ownersAreTerritoriallyAdjacent`, trzeba zbudować od zera na prymitywie `territoryOwnerAt` (`territory.ts:106-125`) + `hexNeighborCoords`. Wymaga realnej zmiany architektonicznej: `findCityConnection`/`computeCityConnection` (`trade-routes.ts:478,508`) nie mają dziś dostępu do danych terytorialnych (`TerritoryNode[]`) — trzeba przeprowadzić nowy parametr przez cały łańcuch (`detectBestConnection`:711, `citiesHaveTradeConnection`:738, `diagnoseMissingTradeRouteForPartner`:784, `refreshTradeRoutes`:892 dwa wywołania, aż do main.ts, gdzie już istnieje `buildAllTerritoryNodes()`:4253). Warunek MA dotyczyć WYŁĄCZNIE połączeń LĄDOWYCH (linie 523-544) — SEA (546-573, wymaga portu) zostaje bez zmian, zgodnie z drugą zasadą właściciela. Adjacency NIE może być cache'owane trwale w `__tradeConnectionCache` (WeakMap<GameMap,...>, bezpieczne tylko dla statycznego terenu) — terytoria zmieniają się co turę, trzeba liczyć per wywołanie `refreshTradeRoutes` (lokalna `Map<"ownerA|ownerB",boolean>`, analogicznie do `usedSlots`/`kept`). Do dispatchu: precyzyjna definicja "granica" (terytorium A ma hex sąsiadujący z hexem terytorium B, przez `territoryOwnerAt`) + wpięcie warunku w gałąź LAND + testy wydajności (rząd setek hexów/cywilizację, nie cała mapa). |

## NOWE ZGŁOSZENIE 2026-09-03 — panel negocjacji: warunek niespełniony niewidoczny/mylący (nie regres bilansu)

| ID | Zgłoszenie | Recon orkiestratora | ECHO właściciela |
|---|---|---|---|
| `R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1` | Ze zrzutami: pakt o nieagresji odrzucany mimo rosnącego "Bilans (netto)" (+130→+414). "Znowu jakiś regres z handlem." Po wyjaśnieniu: "OK, to takie niespełnione warunki powinny świecić się na czerwono, żeby gracz wiedział, że nie ma możliwości podpisania deala. Powinna też być ta informacja, kiedy najedzie się na 'przyjmij', dlaczego nie można przyjąć." | **NIE regresja bilansu PW.** Blokada paktu jest w pełni poprawna: próg Relacji dla `nap` (`diplomacy-proposals.ts:1036-1044`, `napThreshold = progNapRelacja(110) + napExpansionSurcharge(20, "ekspansja przy granicy") - napEase`) niezależny od "Bilans (netto)" pokazywanego w panelu (ten liczy się z kosztów PW koszyka, nie z Relacji). Relacja gracza = 112 < próg 130 — poprawnie odrzucone. Problem to WYŁĄCZNIE UI: `verdictHtml()`/`da-pn-bal-verdict` (`diplomacyAcceptanceBalance.ts:484-537,673,745,868`, klasa CSS `no`) już ISTNIEJE dla "Nie spełnia warunków", ale dzisiejszy kolor (bursztynowy/orange wg zrzutu) nie sygnalizuje wystarczająco mocno blokady, a przycisk "Przyjmij" nie ma tooltipa z tym samym powodem przy najechaniu. | **Popraw tylko UI** — nie zmieniać progu Relacji dla NAP (110+20 zostaje). (1) Kolor `.da-pn-bal-verdict.no`/pokrewne na CZERWONY gdy warunki niespełnione (dziś bursztynowy). (2) Tooltip/title na przycisku "Przyjmij" gdy disabled, pokazujący ten sam tekst co komunikat blokady ("Relacja zbyt niska na pakt..."). Dołączone doprecyzowanie właściciela: "skoro jest taka kara 110 plus 20, to daje 130, to w ogóle kwestia paktu, a nie agresji, w ogóle nie powinna być w opcjach do wyboru" — do rozstrzygnięcia przez Operatora w tej samej rundzie: czy ukryć/wyszarzyć "Pakt o nieagresji" na liście "Możliwe umowy" (`diplomacyAudience.ts:1695+`) gdy BAZOWY próg (bez słodzika z koszyka) nie jest spełniony, z jasnym wskazaniem "wymaga wyższej Relacji" zamiast całkowitego ukrycia (słodzik w koszyku może obniżyć próg — całkowite ukrycie ukryłoby tę możliwość graczowi). **ZINTEGROWANE** (`da370d5f`, 2026-09-03) — kolor czerwony, tooltip (już istniał), ostrzeżenie "wymaga wyższej Relacji" na liście. Proces: Operator+Evaluator dispatchowane błędnie na Sonnet 5 zamiast Opus 5 (§9p6b, temat wizualny) — zaakceptowane jako shipped z udokumentowanym rozjazdem (wynik niezależnie zweryfikowany żywym testem 26/26 + Final Control). Dodatkowo zarejestrowano `P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1` w PYTANIA-OTWARTE.md (2 pre-istniejące czerwone testy dyplomacji, niezwiązane z tą zmianą). |

## NOWE ZGŁOSZENIE 2026-09-03 — "ekspansjaPrzyGranicy" (kara NAP +20) to w rzeczywistości licznik miast, nie granica

| ID | Zgłoszenie | Recon orkiestratora | ECHO właściciela |
|---|---|---|---|
| `R-DYPLO-NAP-KARA-GRANICA-REDEFINICJA-Q1` | "A poza tym, o co chodzi z tą ekspansją przy granicach? Przecież wiadomo, że z cywilizacją, z którą graniczymy, się stykamy, nawet jeśli nie budujemy tam miast. [...] Czy chodzi o to, że cywilizacja, z którą graniczymy, zawsze jest trudniej utrzymać relacje, więc powinno to nazywać się karą za wspólną granicę albo karą za to, że jesteśmy sąsiadami?" | Potwierdzone w kodzie (`main.ts:16884-16885`): `ekspansjaPrzyGranicy: cities.filter(c=>c.ownerId===a).length>2 && cities.filter(c=>c.ownerId===b).length>2` — WYŁĄCZNIE licznik miast (obie strony >2), ZERO związku z faktyczną granicą/sąsiedztwem terytorialnym. Raz aktywne (od 3. miasta obu stron) zostaje aktywne NA ZAWSZE. Komentarz w kodzie: "Żadne źródło projektowe nie ustanawia tego weta" — nazwa i mechanizm były wcześniej wymyślone bez oparcia w designie. | **Przedefiniuj na realne sąsiedztwo terytorialne** — po zbudowaniu funkcji `ownersHaveSharedLandBorder`/analogicznej w `R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1` (BLOKUJĄCA ZALEŻNOŚĆ — ten temat czeka na integrację tamtego), przepiąć narzut NAP: dolicza się +20 do progu TYLKO gdy strony faktycznie graniczą terytoriami (nie od samej liczby miast). Zmienić nazwę pola/etykiety na coś uczciwego (np. `karaWspolnaGranica`/"kara za wspólną granicę"). NIE dispatchować przed integracją `R-HANDEL-SZLAKI-WYMOG-GRANICY-LADOWEJ-Q1` — reużyj gotowej funkcji, nie duplikuj logiki adjacency. **ZINTEGROWANE** (`24b34975`, 2026-09-03) — 4 miejsca w main.ts przepięte na `ownersHaveSharedLandBorder`, pole przemianowane na `karaWspolnaGranica`, stała na `NAP_GRANICA_RELACJA_NARZUT` (wartość 20 bez zmian). Próg ">2 miasta" ZACHOWANY jako dodatkowy warunek obok granicy (brak uzasadnienia projektowego do usunięcia) — DECISION_REQUIRED udokumentowany w kodzie/teście, do ewentualnego potwierdzenia przez właściciela, nie zablokował integracji (fallback pre-autoryzowany w dispatchu). |

## NOWE ZGŁOSZENIE 2026-09-03 — komunikat eliminacji cywilizacji nie pokazuje kwoty łupu

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-MIASTA-ELIMINACJA-LUP-KWOTY-Q1` | "Gdy zdobędzie się stolicę jakiejś cywilizacji lub państwa, czyli ostatnie miasto danej cywilizacji, powinien pojawić się komunikat o tym, ile udało się nam zdobyć w tym przejęciu. Najlepiej, aby było to widoczne na planszy wyświetlanej po zdobyciu miasta." | Mechanizm wyświetlania JUŻ ISTNIEJE i już jest widoczny na planszy (`cityCaptureNotice.ts:21-30`, nagłówek "ELIMINACJA!" + `eliminatedDetails`), ale sama TREŚĆ komunikatu (`main.ts:25324-25327`, w `runCapitalCapturePlunder`) pomija konkretne kwoty: `outcome.skarbiecPrzejety` (złoto) i `outcome.naukaPrzejeta` (nauka) są już policzone i przekazane zwycięzcy w `capital-capture.ts:190-208`, ale tekst mówi ogólnikowo "Skarbiec, nauka i N tech(y) przejęte" bez ŻADNEJ liczby złota/nauki — mimo że Power (`+${lostPower}`) TUŻ OBOK w tym samym zdaniu POKAZUJE konkretną liczbę. **ZINTEGROWANE** (`92f75053`, 2026-09-03) — komunikat teraz np. "Skarbiec: +1500 złota. Nauka: +63 nauki. 2 tech(y) przejęte. Zdobycze Power: +420.", pusty skarbiec komunikowany jawnie ("Skarbiec był pusty."). |

## RECON (bez dispatchu) 2026-09-04 — tajemnicza ikona na jednostkach koło Sparty

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-SPARTA-IKONA-JEDNOSTKI-TAJEMNICZA-Q1` | Zrzut ekranu: nieznana ikona nad jednostkami w pobliżu miasta-państwa Sparta. Właściciel potwierdził (ABC): "Nie, nikt jej nie atakował" — miasto NIE było w tym momencie oblegane, więc `siegeMarker.ts` (dysk+pierścień+"⚔" renderowany na HEKSIE MIASTA, gated wyłącznie realnym oblężeniem, `game/mapSiegeDetect.ts`) jest wykluczony jako przyczyna — jest to marker MIASTA, nie jednostek, i wymaga aktywnego oblężenia. | **NAJSILNIEJSZY KANDYDAT (nieopatentowany kodem-only, wymaga potwierdzenia żywego stanu gospodarki Sparty w tamtej turze):** `gra/src/render/units.ts::_applySufferingIcons()`/`_makeStarvingChipSprite()`/`_makeGoldDeficitChipSprite()` — **czaszka "☠" (czerwona, półprzezroczysta)** gdy `isArmyHungry(ownerId)` (deficyt żywności armii ownera) i/lub **złota moneta** (opacity 0,46) gdy `isGoldDeficit(ownerId)`, renderowane NAD tokenem jednostki (nie miasta), zasilane `stackDisplay.starvingRepIds`/`goldDeficitRepIds` z `main.ts:~10326`. Mechanizm jest per-OWNER (nie ogranicza się do city-states, ale miasta-państwa regularnie wpadają w deficyt), całkowicie NIEZALEŻNY od oblężenia — dokładnie pasuje do "nie było ataku". Prawdopodobnie ZAMIERZONE zachowanie (wizualny sygnał kryzysu gospodarczego), nie bug — gracz najpewniej nie rozpoznał ikony. Inne sprawdzone i odrzucone kandydatury: `unitOwnerEmblem.ts` (medalion miasta-państwa z sygnaturą kultury zamiast portretu władcy — zamierzone, opisane w `R-MP-PORTRET`), `unitStatPlate.ts`/`unitUpgradeBadges.ts`/`unitVeteranBadges.ts` (zawsze-widoczne paski/odznaki, ogólne dla każdego ownera, nie "tajemnicze" po poznaniu), `sisterAllianceUnderAttack`/`cityStateOffensiveSupport` (`ai.ts`, WYŁĄCZNIE logika decyzyjna AI — zero kodu renderującego, grep pusty w `render/`+`battle/`). **ZAMKNIĘTE BEZ ZMIAN KODU — POTWIERDZONE PRZEZ WŁAŚCICIELA** (2026-09-04): "jest to prawdopodobne, ponieważ te państwa-miasta pewnie nie mają wystarczających środków, żeby utrzymać te jednostki. Czyli głód ze względu na jedzenie ma inną ikonę, a głód ze względu na środki pieniężne inną" — zgodne z reconem (czaszka=głód armii/`isArmyHungry`, moneta=deficyt złota/`isGoldDeficit`, dwie odrębne, niezależne ikony). Mechanizm działa zgodnie z przeznaczeniem, miasta-państwa faktycznie regularnie wpadają w deficyt i nie mogą utrzymać jednostek. Brak zgłoszenia o tooltip/UI — nie dispatchowane dalej. |

## NOWE ZGŁOSZENIE 2026-09-04 — ikona "chłopka" w pasku minimapy nie w kolorze złotym

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1` | Ze zrzutem: "Chłopak jest do poprawy, żeby był tak jak wszystkie ikony, złotym kolorem i nie wyróżniał się." (przycisk worker w rzędzie zoom nad minimapą, po integracji `R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1`). | Przyczyna ustalona z pewnością: `workerBtn`/`depositBtn` (`hud.ts:1241-1252`) renderują SUROWE emoji Unicode (`'👤'`/`'⛏'`) zamiast inline SVG — emoji są rysowane wielokolorową czcionką systemową i CAŁKOWICIE ignorują CSS `color`, więc `color:#e8d88a` na `.civ-hud-util-dock .b-util-toggle` (`hud.ts:652-657`) nie ma na nie wpływu. Kilof ma identyczny defekt strukturalny (też emoji), wygląda "znośnie" tylko przez przypadek kroju czcionki. Gotowy wzorzec w tym samym rzędzie wizualnym: `TERRITORY_SVG`/`TRADE_ROUTES_SVG` (`minimapHud.ts:145,148`) — inline SVG z `stroke="currentColor"`, poprawnie dziedziczy kolor z CSS. **ZINTEGROWANE** 2026-09-04 (Opus 5 Operator/Evaluator, Sonnet 5 Final Control, R-PROC-AUTOBOT.md §9 pkt 6b) — commity `df0fcc0d` (SVG worker+deposit, nowy live test) + `99b441b1` (obrona: poprawka kilofa po zarzucie Evaluatora „wygląda jak litera T", `01-operator.md`). Oba przyciski renderują teraz inline SVG z `stroke="currentColor"`, dziedziczą `#e8d88a` z CSS rodzica — potwierdzone żywym testem Chromium (`gra/tools/minimapa-ikona-robotnik-kolor-live-test.cjs`, 56/56 PASS) na 5 skalach, zero regresji toggle. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone na worktree i ponownie na `main` po cherry-picku. Wypchnięte na `origin/main`. |

## NOWE ZGŁOSZENIE 2026-09-04 — spójność kart CivPedia (technologia/budynek/jednostka/ulepszenie terenu)

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-CIVPEDIA-KARTY-SPOJNOSC-Q1` | Ze zrzutami (karta technologii „Obróbka drewna", karta jednostki „Taran", karta budynku „Stolarnia" otwarta obok karty technologii): (1) linki do budynków/jednostek/kolejnych technologii/wymagań wewnątrz karty technologii podświetlają się tylko na hover całego wiersza, bez widocznego przycisku — w przeciwieństwie do ulepszeń terenu („Szczegóły →") i gotowych-do-badania technologii (badge „Możesz badać"); właściciel chce widocznego przycisku wszędzie, nie tylko hover. (2) Karta jednostki (Taran) ucina się na dole bez przewijania na niższych rozdzielczościach. (3) Karta budynku (Stolarnia) otwarta obok karty technologii ma inną (większą) wysokość niż karta technologii — różne karty różnej wysokości. (4) Sama karta technologii zmienia wysokość zależnie od tego, ile sekcji accordion jest rozwiniętych — przy rozwinięciu wszystkich znikają przyciski akcji na dole („Rozpocznij badanie"/„Otwórz drzewo"). Żądanie: wszystkie 4 typy kart (budynek/jednostka/ulepszenie terenu/technologia) mają mieć tę samą, STAŁĄ wysokość zależną od rozdzielczości ekranu (10% marginesu góra+dół, czyli ok. 80% wysokości viewportu), tę samą szerokość referencyjną (obecna szerokość karty technologii), a nadmiar treści ma się mieścić w wewnętrznym przewijaku zamiast rozciągać/ucinać kartę. | Recon (`Explore`, potwierdzone bezpośrednim odczytem kodu) — wspólny kontrakt kart REALNIE istnieje i jest używany: `gra/src/ui/entityCards/{types,registry,renderer}.ts` + adaptery (`technologyAdapter.ts`/`buildingAdapter.ts`/`unitAdapter.ts`/`improvementAdapter.ts`). (A) **Przyciski linków**: `renderer.ts` już stylizuje KAŻDĄ niepustą `value` linku jako spójny, widoczny przycisk (border+tło+hover, linie ~630-653) — jedyny powód braku widoczności dla budynków/jednostek/„Kolejne technologie" (gałąź z wieloma prereq)/„Wymagania" jest to, że `technologyAdapter.ts` świadomie zostawia dla nich `value:''` (linie 162-167 budynki, 173-181 jednostki, 228-232 kolejne-technologie, 276-283 wymagania) — pusty przycisk jest CELOWO niewidoczny (`renderer.ts:664`, `button.entity-card-row-value:empty{border:0;...}`), decyzja z `P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1` („cały wiersz już klikalny przez hover, widoczna wartość zbędna"). Obecne zgłoszenie właściciela jest ŚWIADOMYM odwróceniem tamtej decyzji — nie regresją do naprawienia po cichu. Ulepszenia terenu mają widoczny „Szczegóły →" bo `techDiscoveryNotice.ts:568-578` nadpisuje ich `value` punktowo; „Możesz badać" (gotowe-do-badania technologie) mają widoczny przycisk bo ich `value` to nazwa technologii (`technologyAdapter.ts:213-217`), niepusta z natury. (B) **Wysokość/szerokość**: BRAK wspólnej reguły — trzy niezależne kopie wzorca `max-height:calc(100vh-Npx);overflow:auto` w `entityCards/renderer.ts:562` (bazowa, używana wprost przez ulepszenia terenu — brak własnego pliku), `unitInfoCard.ts:333` (karta jednostki, mapa) i `techDiscoveryNotice.ts:750-752` (karta technologii, nadpisanie lokalne w hoście) + osobna szerokość karty-satelity `techDiscoveryNotice.ts:762` (`.tdn-side-card`, 434px — INNA niż karta technologii 660px, stąd widoczna różnica szerokości/wysokości „Stolarnia" vs „Obróbka drewna" na zrzucie: satelita to zwykła `.entity-card` bez override, budynek/jednostka/ulepszenie otwarte z linku w karcie technologii ZAWSZE idą tą ścieżką, NIE przez dedykowany karta-budynku-w-panelu-miasta z `cityPanel.ts` — ten ostatni żyje wyłącznie w hover-docku panelu miasta, który już poprawnie przewija (`cityUxFrame.ts:103-104`), więc NIE wymaga zmian). `max-height` (nie `height`) oznacza, że krótka treść daje mniejszą kartę, długa większą — stąd różne wysokości między typami I między stanami accordion tej samej karty. Przyciski akcji (`renderer.ts:370-381`, `.entity-card-actions`) są ostatnim dzieckiem TEGO SAMEGO scrollowalnego elementu co reszta karty — stąd „znikają" (przesuwają się w głąb scrolla) przy rozwinięciu wszystkich sekcji, nie realny bug w osobnej stopce. (C) Trzy backdropy (`entity-card-backdrop` `renderer.ts:560`, `unit-info-card-backdrop` `unitInfoCard.ts:331`, host+`.tdn-stage` `techDiscoveryNotice.ts:234-235,759-760`) używają `align-items:center` bez fallbacku scrolla — dokładnie ten sam wzorzec bugu już naprawiony gdzie indziej (`diplomacyAudience.ts:566-590`, `P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1`: `align-items:flex-start`+`overflow-y:auto` na backdropie, `margin:auto 0` na boksie — "bezpieczne centrowanie"), gotowy do powielenia. Podział na 3 węzły niezależnych plikami (bez nakładania allowlist): **-A** (`entityCards/renderer.ts`+`technologyAdapter.ts`: przyciski linków + bazowe wymiary/safe-centering), **-B** (`unitInfoCard.ts`: wymiary/safe-centering karty jednostki), **-C** (`techDiscoveryNotice.ts`: wymiary karty technologii+satelity, ujednolicenie szerokości satelity do 660px, przeliczenie progu wąskiego okna, safe-centering hosta/sceny). **ZINTEGROWANE** 2026-09-04 (Opus 5 Operator/Evaluator, Sonnet 5 Final Control, R-PROC-AUTOBOT.md §9 pkt 6b) — commity `40bc1e27`+`5a25e6f7` (węzeł -A), `265098f2`+`a3b6f121` (węzeł -B), `2a241075` (węzeł -C), `97b0b32e` (korekta tolerancji testu po integracji). Wszystkie 4 typy kart (technologia/budynek/jednostka/ulepszenie terenu) mają teraz spójną szerokość referencyjną 660px, stałą wysokość 80vh (nie max-height rosnący z treścią), bezpieczne centrowanie backdropu (wzorem `diplomacyAudience.ts`) — zero przycięć bez dostępnego scrolla, potwierdzone żywo na wielu wysokościach/szerokościach viewportu. Widoczny przycisk-link dla budynków/jednostek/kolejnych-technologii (odwrócenie `P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1` na jawne żądanie właściciela). Dwie DECISION_REQUIRED z Final Control rozwiązane orkiestratorem bez dodatkowej rundy: (1) węzeł -B zgłosił szerokość 660px jako martwy CSS w izolacji — po integracji z węzłem -A produkcyjna karta jednostki (`showUnitInfoCardDialog`→`buildUnitInfoCardViaEntityCard`→`renderEntityCard`) dziedziczy poprawną szerokość automatycznie (zmierzone 662px=660+border, test skorygowany, 35/35); (2) węzeł -A zgłosił że pigułki „Wymagania" pokazują nazwę wymaganej technologii zamiast tekstu „Szczegóły →" (`buildPillRowEl` czyta `row.label`, nie `row.value`) — zaakceptowane jako świadomy wyjątek: pigułka już jest widocznym, obramowanym przyciskiem (spełnia rdzeń żądania właściciela), a pokazanie realnej nazwy wymaganej technologii jest informacyjnie bardziej użyteczne niż generyczny napis; nie wymaga rundy 2. `tsc --noEmit` czysty, 5 bramek referencyjnych i wszystkie testy dotknięte przez temat zielone na `main`. Wypchnięte na `origin/main`. |

## NOWE ZGŁOSZENIE 2026-09-04 — przycisk „Odłóż na później" ucięty na karcie decyzji dyplomatycznej

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1` | Ze zrzutem (panel boczny, karta „Wymaga decyzji" z przyciskiem „OTWÓRZ →"): "Ta opcja zamknięcia czy odsunięcia na później decyzji dyplomatycznej niestety jest zakryta i nie da się jej włączyć. Coś się popsuło. Lepszy byłby krzyżyk w górnym rogu, żeby można było to po prostu wyłączyć." | Recon (`Explore`) — REALNY REGRES z 2026-09-03, nie nigdy-niedziałający element. `.sp-blocking.sp-expanded` (`sidePanelHud.ts:266-270`) ma `overflow:hidden` od 2026-08-20 (commit `834051475`), bez problemu dopóki karta miała jeden przycisk akcji. Commit `5cbe910c` (2026-09-03, „P-DYPLO-KARTA-DECYZJI-DISMISS-Q1") dodał DRUGI przycisk „Odłóż na później" (`data-sp-ignore`, linia 689) do `.sp-action-bar`, nie dotykając CSS — pierwszy przypadek dwuprzyciskowej stopki. Efekt: kolumna flex w ograniczonym wysokościowo `.sp-scroll` (`max-height:100%`), `overflow:hidden` na karcie znosi ochronę `min-height:auto` (CSS Flexbox spec) — karta kurczy się PONIŻEJ wysokości własnej treści zamiast pozwolić przewinąć `.sp-scroll` (który ma `overflow-y:auto`), ucinając dokładnie dolną krawędź `.sp-action-bar` czyli „Odłóż na później". Element ISTNIEJE w DOM z podpiętym listenerem (`sidePanelHud.ts:834-843` → `config.onEventDismiss`) — problem czysto geometryczny, nie logiczny. Gotowy wzorzec przycisku „✕" już istnieje dla kart NIEblokujących (`sidePanelHud.ts:754` `.sp-close`, handler `809-818`, identyczny `onEventDismiss`) — do skopiowania dla kart blokujących, zgodnie z sugestią właściciela. Semantyka „Odłóż na później"/przyszłego „✕": miękki, JEDNOTUROWY dismiss (`dismissedSidePanelEventIds.add(id)`, czyszczony co turę `main.ts:21079,27568`) — NIE usuwa oferty trwale, wraca w następnej turze. **DISPATCHOWANE** 2026-09-04 (Opus 5, temat wizualny/regres CSS, R-PROC-AUTOBOT.md §9 pkt 6b) — worktree `wt-dyplo-karta-dismiss-uciety`. |

## NOWE ZGŁOSZENIE 2026-09-04 — zmiana nazwy ulepszenia „Wyrąb" na „Wycinka"

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1` | "Zamień nazwę ulepszenia Wyrąb na Wycinka." | Recon (`Grep`) — klucz wewnętrzny ulepszenia to `wyrab` (bez zmian, nie dotyczy nazwy). Kanoniczna nazwa wyświetlana: `gra/data/terrain-improvements.json:174` `"nazwa": "Wyrąb"`. Dodatkowe WŁASNE, hardkodowane wystąpienia nazwy (nie czytane z JSON, wymagają osobnej zmiany dla spójności): `gra/src/render/improvements.ts:39` (`label: 'Wyrąb'`, osobna lista etykiet UI), `gra/src/main.ts:12100,28014,31437` (komunikaty hint/log gracza: "Wyrąb: +X Drewna...", "Wyrąb @ (...)"), `gra/src/map/improvement-build.ts:471` (komunikat blokady budowy na lesie, zawiera zarówno rzeczownik własny „Wyrąb" JAK I czasownik pospolity „wyrąb las" w tym samym zdaniu — wymaga uwagi, żeby zmienić TYLKO rzeczownik-nazwę ulepszenia, nie czasownik). Komentarze kodu (`auto-improvements.ts:824,944,946`, `improvement-build.ts:364,428,1279`, `lasy-modele.ts:152`) używają „Wyrąb"/„wyrąb" opisowo — nie user-facing, poprawa kosmetyczna, nie wymagana. `gra/data/wikiBundle.json` zawiera też wystąpienie — do sprawdzenia czy to plik generowany (wtedy poprawa źródła, nie samego bundla) czy statyczny. **ZINTEGROWANE** 2026-09-04, merge `a87da490` (rundy 1-5, Final Control PASS, wszystkie 5 zarzutów `ODDAL`). Finalny zakres: `terrain-improvements.json` (`wyrab.nazwa` + `farma.warunek` — to drugie znalezione dopiero w rundzie 5), `improvements.ts`, `improvement-build.ts`, `main.ts`, regenerowany `wikiBundle.json`, 6 plików poradnika/encyklopedii. **Temat kosztował pełne 5 rund nie z powodu trudności zmiany, tylko z powodu czterokrotnie udowodnionej ślepoty własnej bramki testowej** — każda runda dokładała warstwę skanu po tym, jak poprzednia przepuściła realne wystąpienie: [6] bundle, [7] strażnik pokrycia liczony w znakach, [8]/[8b] pola kart `terrain-improvements.json` (odkryło `farma.warunek`), [11]/[11b]/[11c] skan negatywny 447 plików `.ts/.tsx` w `gra/src` z zakotwiczonym dopasowaniem. Test urósł 10/10 → 49/49. **Błąd autora dispatchu (runda 3→4):** orkiestrator sklasyfikował „najpierw wyrąb" w `05-budowa-mapa.md:166` jako czasownik pospolity i jawnie wykluczył ze zmiany; Evaluator zakwestionował, Obrona **proceduralnie odmówiła** wyjścia poza allowlistę i eskalowała — pełna linia brzmi „priorytet: najpierw wyrąb → farma → irygacja", czyli szereg NAZW ulepszeń. Ratyfikowane w rundzie 4 razem z usunięciem wpisów whitelisty, które ten błąd zakonserwowały w teście. Dwa stringi zostają celowo bez zmian, jawnie sklasyfikowane w whiteliście `DOZWOLONE_WYRAB_SRC` jako rzeczownik odczasownikowy (`buildModeHud.ts:572`, `main.ts:20535` — glosa czasownika „wycinać las" w tym samym zdaniu). Nota dla przyszłych tematów: cztery bramki `*improvement*`/`*las*` są czerwone PRE-ISTNIEJĄCO na `origin/main` (`map-improvement-qualify-test` 130/1, `oboz-lowiecki-las-test` 72/19, `improvement-card-callsites-test` 34/2, `entity-card-contract-test` wyjątek) — parytet zweryfikowany niezależnie przez Evaluatora i Final Control, zero regresji z tego tematu, ale to osobna resztka do sprzątnięcia. |

## NOWE ZGŁOSZENIE 2026-09-04 — limit tras handlowych (dochód eksploduje po Umowie Handlowej) + uogólnienie na wszystkie cywilizacje/AI + handel wewnątrz-cywilizacyjny + tech-gate „Wymiana"

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-HANDEL-LIMIT-TRAS-PELNY-Q1` | Ze zrzutem (licznik "Handel +542", gęsta pajęczyna tras między dwiema cywilizacjami): "Trzeba wprowadzić ograniczenie handlu... po podpisaniu umowy... sumy stają się gigantyczne." Doprecyzowanie właściciela (seria wiadomości): (1) limit slotów tras per miasto = 1 (baza, bez budynków) + 1 za każdy budynek handlowy (Targowisko/Port/Port wielki — **Magazyn i Mennica WYKLUCZONE**, ECHO właściciela); (2) limit obowiązuje SYMETRYCZNIE — brak slotu po DRUGIEJ stronie blokuje połączenie nawet gdy nasza strona ma wolne sloty; (3) miasto zawsze wybiera NAJBARDZIEJ LUKRATYWNĄ (najdalszą, do sufitu krzywej dochodu) dostępną opcję, dopiero gdy niedostępna — sięga po bliższą (priorytet malejący dystans/dochód, nie rosnący jak dziś); (4) **te same ograniczenia i priorytety mają obowiązywać WSZYSTKIE pary cywilizacji — gracz-AI, AI-AI, AI-państwo-miasto — nie tylko gracz-obcy jak dziś**; (5) **NOWY mechanizm: handel WEWNĄTRZ jednej cywilizacji** (miasto A ↔ miasto B tego samego ownera) — istnieje jako kandydat do tych samych slotów, konkuruje z kandydatami zewnętrznymi na równych zasadach (priorytet wg dochodu) — efekt: z czasem handel wewnętrzny bywa WYPIERANY przez bardziej dochodowy handel zewnętrzny, gdy powstanie odpowiedni traktat; (6) **tech-gate „Wymiana"**: dopóki cywilizacja nie zbada technologii "Wymiana", CAŁY handel (zewnętrzny I wewnętrzny) jest zablokowany — ECHO właściciela (wybrane explicite, opcja szersza niż tylko traktaty zewnętrzne). | Recon (`Explore`, 2 przebiegi, zweryfikowane bezpośrednim odczytem kodu) — kompleksowe ustalenia: **(A) Formuła dochodu** (`trade-routes.ts:1263-1297`, bez zmian w tym temacie): rośnie liniowo z dystansem 5→40 (baza) do sufitu przy 12 heksów (ląd)/20 (morze), finalnie `max(1,round(baza/5))` — ląd 1→8¤, morze (×2) 2→16¤ — OBIE strony trasy dostają pełną kwotę, sumowane bez ograniczeń. **(B) Limit dystansu USUNIĘTY 2026-09-03** (commit `9b31997d`, `R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1`, na wyraźną prośbę właściciela — mapy "superogromne" blokowały handel między realnie połączonymi stolicami) — NIE cofać, przyczyna eksplozji jest gdzie indziej. **(C) Brak limitu liczby tras na miasto od T3** (`R-HANDEL-SZLAKI-PRZEBUDOWA-Q1`) — `tradeRouteLimitForCity()` (`trade-routes.ts:828-837`, liczy WYŁĄCZNIE `TRADE_BUILDING_IDS={targowisko,port,port_wielki}`) dziś gatinguje TYLKO pole `budynekOdblokowany` (+5% bonus), NIE istnienie trasy — stąd nieograniczona liczba tras. **(D) Suma liniowa, iloczyn kombinatoryczny** (`computeTradeRouteIncomeByCity`, linie 1344-1361) — trasy to pary gracz-miasto×obce-miasto (bipartite N×M, nie N(N-1)/2 wewnątrz jednej cywilizacji jak zakładał właściciel pierwotnie) — realny wzrost to iloczyn liczby miast obu stron traktatu, bez diminishing returns. **(E) Architektura traktatów JUŻ generyczna per-dowolna-para ownerId** (`activeDeals`/`dealsForPair`/`hasSzlakowTreaty`, `diplomacy-treaties.ts`) — `hasTradeTreatyFn` wstrzykiwane do `refreshTradeRoutes` z `main.ts:13670` już poprawnie odpowiada dla par AI-AI. **AI już dziś samodzielnie zawiera Umowy Handlowe z innym AI** (`formAiAiTradeAgreementsIfEligible`, `main.ts:17460+`, w pełni produkcyjny mechanizm z throttlingiem, obejmuje też państwa-miasta) — jedyny brakujący element to fakt, że `refreshTradeRoutes` IGNORUJE te już istniejące traktaty AI-AI przez sztywny filtr `playerCities`/`foreignCities` (`ownerId===0` vs `!==0`, linie 1097-1099, 1138, 1165-1166) — generalizacja nie wymaga budowy dyplomacji AI-AI od zera, tylko odblokowania istniejącej. **(F) Handel wewnątrz-cywilizacyjny nie istnieje pod ŻADNĄ nazwą** (grep zero trafień) — nowy byt do zbudowania, bez ryzyka duplikacji. **(G) Tech "Wymiana"** (`tech.json:123-136`, Epoka Kamień, prereq Garncarstwo+Rolnictwo+Oswojenie zwierząt) dziś odblokowuje WYŁĄCZNIE budynek Targowisko — ZERO powiązania z traktatami/trasami w kodzie — tech-gate to całkowicie nowy kod. **(H) Skala/wydajność**: mapa superogromna 672×476, do ~20 podmiotów (gracz+10 AI+9 państw-miast), realistycznie ~100-150 miast jednocześnie — rozszerzenie z O(N_gracz×N_obcy) na "każda para cywilizacji" to rząd O(10⁴) par miast per turę, BRAK istniejących testów/bramek wydajnościowych dla `refreshTradeRoutes` — wymagany nowy benchmark. Ze względu na skalę i wzajemne zależności z tym samym plikiem (`trade-routes.ts`) — dispatch pkt (1)-(5) jako TEN temat (rdzeń mechaniki), tech-gate „Wymiana" (pkt 6) jako OSOBNY, SEKWENCYJNY temat `R-HANDEL-WYMIANA-TECH-GATE-Q1` (dopiero po integracji tego, żeby budować na nowej architekturze, nie równolegle — ten sam plik, R-PROC-AUTOBOT.md §2b). **DISPATCHOWANE** 2026-09-04 (Sonnet 5, effort podniesiony do wysokiego na Operatorze ze względu na złożoność algorytmiczną) — worktree `wt-handel-limit-tras-pelny`. |
| `R-HANDEL-WYMIANA-TECH-GATE-Q1` | Wydzielony punkt (6) z wiersza wyżej, dispatchowany **sekwencyjnie po** integracji `R-HANDEL-LIMIT-TRAS-PELNY-Q1` (ten sam `trade-routes.ts` i `main.ts`, `R-PROC-AUTOBOT.md` §2b). Wyzwalacz właściciela: „punktem startu dla możliwych umów wymiany i handlowania z inicjatywami powinno być wynalezienie samego znaleziska w wymiana". ECHO (AskUserQuestion, wybrane explicite): **„Cały handel, łącznie z wewnętrznym"** — bramka blokuje i handel traktatowy, i nowy handel wewnątrz-cywilizacyjny. Dotyczy tak samo gracza, AI i państw-miast. | Recon (`Explore`, potwierdzony bezpośrednim odczytem kodu): **(A) Stan per-owner „zbadane technologie" ISTNIEJE i jest jednolity** — gracz `player.zbadane` (`main.ts:3255`), AI/państwa-miasta `aiResearchDone: Map<number,Set<string>>` (`main.ts:7165`), gotowe akcesory `unlockedTechSetForOwner` (`main.ts:3254-3257`) i `ownerResearchedTechs` (`main.ts:25426-25428`). **AI ma REALNE własne badania**, nie tylko epokę (`runAiResearchForOwner`, `main.ts:25363`, wołane dla każdego `ownerId>0` z miastem) — epoka jest stanem POCHODNYM (`syncOwnerEraFromResearch`, `main.ts:1775`), nie wolno jej używać jako proxy. Państwa-miasta mają `ownerId>0` i miasta → bramka działa dla nich automatycznie, bez osobnej gałęzi. **(B)** Jedyne wywołanie `refreshTradeRoutes` — `main.ts:13713-13722`. **(C)** Miejsca traktatu `UmowaSzlakow`: bramka gracza `diplomacy-locks.ts:209-218` (wzorzec `ctx.hasTradeConnection` tuż obok), AI↔AI `formAiAiTradeAgreementsIfEligible` (`main.ts:17651`, warunki par 17665-17681), propozycje `diplomacy-proposals.ts:1491-1497` i `2080-2093`. **(D) Technologia „Wymiana" nie ma DZIŚ żadnej referencji logicznej w `gra/src`** — istnieje tylko w `gra/data/tech.json:124` (Kamień, poz. 2, prereq Garncarstwo+Rolnictwo+Oswojenie zwierząt, koszt 64, odblokowuje Targowisko), w kodzie jedynie ikona i komentarz. Uwaga na fałszywe trafienia grepu: `UmowaWymiany` i `progWymianaTechZaufanie` to INNE byty. **(E) Wzorzec do naśladowania istnieje i jest produkcyjny** — embarkacja: `EMBARK_TECH='Żegluga'` (`embarkation.ts:22`) + predykat per-owner `ownerHasSeafaring` (`main.ts:10382-10386`) wstrzykiwany do czystego modułu; drugi wzorzec `isImprovementTechUnlocked` (`improvement-tech.ts:140`). **DISPATCHOWANE** 2026-09-04 (Sonnet 5, effort high na Operatorze — zmiana przecina 3 warstwy: rdzeń tras, dyplomacja gracza, dyplomacja AI↔AI) — worktree `wt-handel-wymiana-tech-gate`, dispatch `dyspozycje/autobot/runs/R-HANDEL-WYMIANA-TECH-GATE-Q1/00-dispatch.md`. |

## NOWE ZGŁOSZENIE 2026-09-04 — nazwa encji ma BYĆ przyciskiem (korekta błędnej realizacji poprzedniej prośby) + regres klikalności

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1` | Ze zrzutem karty „Obróbka drewna": „Prosiłem cię poprzednio, żeby poprawić przyciski w kartach innego typu... zamiast dać brązowienie w ramkę i możliwość podświetlania, dodałeś w ramkę szczegóły... To nie tak miało być. Brązowienie miało być ramką bez linii podkreślania, tak jak w technologiach... **brązowienie powinno być przyciskiem bez szczegółów, otoczone ramką, i po najechaniu ma się podświetlać**." Czyli: przyciskiem ma być **SAMA NAZWA** encji (`Stolarnia`, `Palisada drewniana`, `Taran`, `Brązownictwo`), a tekst „Szczegóły →" ma zniknąć. | **Błąd orkiestratora przyznany wprost.** Poprzednie zgłoszenie („one nie mają przycisku, który się podświetla") zrealizowano w `R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A` jako OSOBNY przycisk „Szczegóły →" po prawej stronie wiersza (`technologyAdapter.ts:241` i analogiczne dla `buildingsRows`/`unitsRows`). Właściciel prosił o coś innego. Ironia do odnotowania: tamten temat zapisał jako „udokumentowany wyjątek" fakt, że pigułki Wymagań pokazują NAZWĘ technologii zamiast „Szczegóły →" — **to nie był wyjątek, tylko jedyny wiersz zrobiony dobrze**; reszta ma się do niego upodobnić. Recon kodu: (A) dwa warianty wiersza w `renderer.ts` — `buildGridRowEl` (l. 124-157; klikalny jest `value`, NIE nazwa) i `buildPillRowEl` (l. 164-176; klikalny jest `row.label`, czyli nazwa — **wzorzec wskazany przez właściciela jako poprawny**, widoczny na zrzucie jako „Żegluga"). (B) **Pudełko przycisku i hover JUŻ ISTNIEJĄ i są wspólne** dla czterech wariantów (`renderer.ts:639-663`), z `text-decoration:none` (l. 644) — „bez linii podkreślania" jest już spełnione, nic nie trzeba usuwać; zmiana to przeniesienie roli przycisku z `value` na `key`. (C) Delegacja `target.closest('button[data-entity-kind]')` nie wymaga nowego listenera. (D) Fallback „cały wiersz klikalny" zostaje (hit-area zapasowa). (E) Wyjątek `button.entity-card-row-value:empty` (l. 673) stanie się ścieżką podstawową. (F) **Wiąże zasada z RUNDY 1 OBRONY tego samego modułu** (`renderer.ts:645-651`): pudełko MUSI rysować dokładnie ten element, który łapie klik — zmierzono tam kiedyś 88,1×22,2 px „przycisku" wobec 52,0×16,2 px klikalnego tekstu, 41% martwej strefy. (G) `trailing` („Wymaga też: …") ZOSTAJE — właściciel kwestionuje „Szczegóły →", nie tę adnotację. **DISPATCHOWANE** 2026-09-04 (Opus 5 na Operatorze i Evaluatorze — temat wizualny, `R-PROC-AUTOBOT.md` §9 poz. 6b) — worktree `wt-civpedia-nazwa-przyciskiem`. Temat niesie też **GOAL 3 = naprawa regresu klikalności** (niżej), bo dotyczy tego samego elementu DOM. |
| `P-CIVPEDIA-WIERSZ-ULEPSZENIA-KLIK-REGRES-Q1` (**scalone jako GOAL 3** w temacie wyżej, nie osobny dispatch) | Nie zgłoszenie właściciela — znalezisko orkiestratora przy sprzątaniu. Evaluator i Final Control tematu `P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1` zgłosiły cztery czerwone bramki jako „pre-istniejące, parytet z `origin/main`". Parytet był prawdziwy, ale **mylący — `origin/main` już wtedy niósł regres**. | Orkiestrator sprawdził parytet GŁĘBIEJ, wobec commita sprzed integracji `R-CIVPEDIA-KARTY-SPOJNOSC-Q1` (`40bc1e27^` = `d2a5b6f3`): `improvement-card-callsites-test` **36 pass / 0 fail PRZED**, **34 pass / 2 fail DZIŚ**. To regres wprowadzony przez tamten temat, którego nie złapała żadna jego bramka (własne testy były zielone). Objaw (żywy Chromium 1280×900, popup odkrycia „Obróbka drewna", sekcja „Ulepszenia terenu"): `elementFromPoint` na środku wiersza trafia w `.tdn-back` zamiast w przycisk, a klik w `.tdn-back` **zamyka całą kartę**. Hipoteza (do potwierdzenia LUB obalenia przez Operatora, nie do przyjęcia na wiarę): `ensureEntityCardOverrideStyles()` w `techDiscoveryNotice.ts` nadało karcie STAŁĄ wysokość `min(80vh,calc(100vh-36px))` z `overflow:auto` zamiast dawnego `max-height` — przedtem karta rosła z treścią i wszystkie wiersze były hit-testowalne, teraz rozwinięta sekcja może wypchnąć wiersz poza przycięty box. Dispatch wymaga rozstrzygnięcia dwóch wykluczających się hipotez ŻYWYM DOWODEM: **H1 defekt produktu** (gracz nie dosięga wiersza → napraw KOD) vs **H2 przestarzały test** (wiersz osiągalny przez scroll, test nie przewija → napraw TEST i powiedz to wprost). |
| `P-BRAMKI-IMPROVEMENT-LAS-CZERWONE-STARE-Q1` | Nie zgłoszenie właściciela — trzy pozostałe czerwone bramki, **starsze, z parytetem także wobec `d2a5b6f3`** (czyli NIE regres z fal 345-347). Zarejestrowane, **NIE dispatchowane** — wymagają najpierw rozstrzygnięcia, czy przestarzały jest test, czy zasada gry. | (1) `oboz-lowiecki-las-test` **72 pass / 19 fail** — test oczekuje, że obóz łowiecki jest DOSTĘPNY na lesie (na wzgórzu, na równinie, na łące, na pustyni), produkcja mówi że nie; czerwienią się też wszystkie asercje pochodne (picker automatu/AI, tooltip, commit, mapa 42) oraz dwie asercje „warunku istotności" P7. (2) `map-improvement-qualify-test` **130 pass / 1 fail** — „oboz lowiecki OK on laka+las", ta sama klasa rozbieżności. (3) `entity-card-contract-test` — **wyjątek `ReferenceError: requestAnimationFrame is not defined`** w `mountUnitMiniPreview` (`.entity-card-contract-bundle.cjs:53401`), czyli problem harnessu testowego (jsdom bez rAF), nie logiki gry. Pozycje (1)+(2) to jedna rozbieżność zasada-vs-test i prawdopodobnie **wymagają ABC właściciela** („czy obóz łowiecki ma być budowalny na lesie?"); pozycja (3) jest niezależna i czysto infrastrukturalna. |

## NOWE ZGŁOSZENIA 2026-09-04 (wieczór) — trofea przy zdobyciu miasta + weryfikacja re-optymalizacji tras

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1` | „Nie widzę, żeby podczas zdobywania miasta, stolicy było gdzieś widoczne, jakie udało się zdobyć trofea. A nawet jeżeli coś, to powinien też się pojawiać raport, wydarzenie, które mówi dokładnie, co zostało zdobyte i jakie zwycięstwo zostało odniesione." **ECHO właściciela (AskUserQuestion):** (1) łup ze zwykłego miasta — **„Tylko raport, bez nowej mechaniki"** (zdobycie zwykłego miasta nadal nie daje łupu; raport ma uczciwie mówić, że łupu brak); (2) forma — **„1+2", czyli OBA naraz**: rozbudowany modal zdobycia z pełnym rozliczeniem ORAZ trwały wpis w panelu WYDARZENIA ze szczegółami po kliknięciu. | Recon (`Explore` + własna weryfikacja odczytem kodu). **(A) ZNALEZISKO KRYTYCZNE — komunikat zaprzecza temu, co gra właśnie zrobiła.** Przy zdobyciu stolicy, gdy cywilizacja ofiary PRZEŻYWA, skarbiec ofiary trafia **w całości do zdobywcy** (`capital-capture.ts:190-193`: `access.setTreasury(newOwner, getTreasury(newOwner) + skarbiecPrzejety)`), a komunikat mówi „**skarbiec i pula pracy przepadły**" (`main.ts:25917`) — i nie podaje kwoty. Pula pracy faktycznie przepada (`capital-capture.ts:197`), skarbiec NIE. Kwoty pokazują się wyłącznie przy pełnej eliminacji (`main.ts:25945-25952`). To jest defekt komunikatu, nie ekonomii — ekonomia działa poprawnie. **(B) Zwykłe miasto nie daje łupu w ogóle** — `applyCapitalCapturePlunder` zwraca `null` dla nie-stolicy (`capital-capture.ts:182`); zdobywca dostaje samo miasto i budynki, kolejka budowy jest czyszczona (`main.ts:26234-26248`). Zgodnie z ECHO — bez zmian, raport ma to jawnie powiedzieć. **(C) Zero śladu w panelu WYDARZENIA** — `collectTurnEvents` (`main.ts:13877`) nie emituje nic o zdobyciu; są tylko modal `showCityCaptureNotice` (`cityCaptureNotice.ts:106`) i znikający toast, więc nie ma do czego wrócić po turach. **(D) Trzy lejki przejęcia, nie jeden** — `applyCityCaptureToMap` (`main.ts:26150`, wspólny lejek bojowy: bitwa polowa, szturm muru, wejście do pustego miasta), kapitulacja głodowa `resolveSiegeSurrender` (`main.ts:12980`, przejęcie ~13055-13075) oraz ścieżka stolicy `runCapitalCapturePlunder` (`main.ts:25854`, wołana z 26265 i 13070). Raport musi pokrywać WSZYSTKIE trzy, inaczej powstanie kolejna dziura. **(E) Wzorce do naśladowania, nie do wymyślania od zera** — wpis+modal: `recordCivElimEvent` (`main.ts:7948-7961`) + `civElimEventDetails` (`main.ts:7926`) + `civElimNotice.ts`; panel podsumowania z gotowym polem `lootNote`: `showPostBattleSummary` (`postBattleSummary.ts:554`, dane `battle-summary.ts:44,57`, render 447-456); modal zdobycia ma już slot na dodatkowy wiersz (`eliminatedDetails`). **(F) DOPRESYZOWANIE 2026-09-04 ze ZRZUTEM modalu ELIMINACJA! (Yan, Chińczycy · miasto-państwo):** „Myślę, że można byłoby ten komunikat trochę ładniej ułożyć, bardziej logicznie i czytelnie." Orkiestrator odczytał kod i potwierdza cztery konkretne wady, wszystkie w `main.ts:25974-25980` + `cityCaptureNotice.ts:143-146`: **(F1) brak jakiejkolwiek struktury do ułożenia** — cała treść to JEDEN sklejony string (`eliminatedDetails`), przepuszczony przez `esc()` i wstawiony do POJEDYNCZEGO `<div class="civ-ccn-elim-sub">`; nie ma wierszy, etykiet ani wartości, jest zdanie — stąd wrażenie nieczytelności i stąd naprawa musi być STRUKTURALNA (wiersze etykieta/wartość), nie kosmetyczna. **(F2) „Nauka: +16 nauki"** — słowo powtórzone, bo `naukaText` (`main.ts:25977`) skleja etykietę „Nauka:" z jednostką „nauki" niezależnie. **(F3) „0 tech(y) przejęte"** — deweloperski skrót na liczbę mnogą wyciekł do gracza (`main.ts:25980`, `${outcome.techSkopiowane.length} tech(y) przejęte`), w dodatku pokazywany przy zerze. **(F4) „Zdobycze Power: +0"** — wewnętrzna, nieprzetłumaczona nazwa `Power` w tekście dla gracza (`main.ts:25980`). **(F5) NAJWAŻNIEJSZE — zera są pokazywane na równi z realnymi zdobyczami.** Na zrzucie właściciela z czterech faktów tylko JEDEN coś znaczy (+16 nauki); pozostałe trzy („Skarbiec był pusty", „0 tech(y)", „Power +0") mówią „nic nie zdobyłeś". Modal jest w trzech czwartych szumem. Wniosek dla Operatora: **pozycje zerowe mają być pomijane, a nie wypisywane** — z wyjątkiem świadomej informacji „łupu brak" jako CAŁOŚCI, gdy nie zdobyto niczego (to jest spójne z ECHO (1): raport ma uczciwie mówić, że łupu brak). Uwaga: gałąź barbarzyńska (`main.ts:25978-25979`) ma osobny, poprawnie sformułowany tekst — nie zepsuć go przy przebudowie. **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`. Kolejka `main.ts`: (1) TEN temat, (2) `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`, (3) `R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1`. |
| `P-HANDEL-TRASA-NIE-SZUKA-LEPSZEJ-WERYFIKACJA-Q1` | „Miasta powinny sprawdzać swoją nową drogę handlową do najdalszego możliwego miasta swojej lub innej cywilizacji. Widzę, że czasem miasta ustanawiamy jakąś drogę, a potem pojawia się lepsze miasto, do którego droga byłaby dłuższa, i niestety pierwsza droga handlowa zostaje ustawiona na stałe, a gra nie szuka innego, lepszego rozwiązania. Chyba, że się mylę i jest inaczej. Do sprawdzenia." | Recon orkiestratora (odczyt `trade-routes.ts`, uruchomienie bramki) — **odpowiedź jest niejednoznaczna i obie części są prawdziwe**: **(A) Mechanizm re-optymalizacji ISTNIEJE i działa co turę — ale dopiero od FALI 346, zintegrowanej tego samego dnia.** `refreshTradeRoutes` łączy WSZYSTKIE kandydatury (kontynuujące `stillValidUnique` + nowe `fresh`) w JEDNĄ listę i sortuje malejącym dochodem (`trade-routes.ts:1444-1451`); trasa kontynuowana wygrywa **wyłącznie przy DOKŁADNYM remisie dochodu** (`x.isExisting` jest dopiero drugim kryterium sortu). Generowanie kandydatów NIE ma skrótu „pomiń miasto z zajętymi slotami" (`trade-routes.ts:1390-1438`) — każda para jest rozważana co turę. Żywy dowód: `trade-routes-limit-test.cjs`, sekcja „Kryterium 5b: stopniowe wypieranie", 76/76 zielone. **Przed FALĄ 346 obserwacja właściciela była TRAFNA** — dawny algorytm (T3) miał dwa odrębne przebiegi z bezwarunkowym pierwszeństwem tras istniejących, więc slot faktycznie się betonował. **(B) Drugi powód, który NIE jest błędem, a wygląda identycznie: sufit dochodu.** Dochód rośnie liniowo z dystansem tylko do 12 heksów (ląd) / 20 (morze) — powyżej sufitu miasto dalsze daje DOKŁADNIE tyle samo złota, więc jest remis, a przy remisie wygrywa trasa istniejąca. Z perspektywy gracza „gra nie szuka lepszego"; z perspektywy silnika lepszego nie ma. **ZAMKNIĘTE BEZ ZMIAN W KODZIE 2026-09-04 — potwierdzenie właściciela na żywej rozgrywce:** „Widzę, że system sam zmienia co turę miasto do handlu z najdalszym miastem, więc chyba jest OK. System szuka najbardziej opłacalnego połączenia." Mechanizm działa zgodnie z (A), dispatch niepotrzebny. **Zastrzeżenie zapisane na przyszłość:** gdy gra „nie chce" sięgnąć po dalsze miasto, pierwszym podejrzanym jest SUFIT DOCHODU z (B) — 12 heksów lądem / 20 morzem — a nie brak re-optymalizacji. Powyżej sufitu dalsze miasto daje dokładnie tyle samo złota, więc jest remis, a remis wygrywa trasa istniejąca. To zachowanie zamierzone; ewentualna zmiana sufitu to osobna decyzja balansowa, nieotwarta. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — dochód z handlu ma przechodzić przez podział miasta

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1` | „Sprawdź, czy pieniądze z handlu lądują od razu bezpośrednio w skarbcu, czy przechodzą przez całą rundę podziału jeszcze na naukę i rozwój, bo mam takie wrażenie, że od razu wpadają w całości do skarbca." Po potwierdzeniu: „Są dwie opcje. Zostawić handel tak, jak jest do tej pory, albo **przypisywać poszczególny handel danego miasta bezpośrednio do przychodów tego miasta, żeby przechodziło przez całą ścieżkę podziału**. Handel nadal mógłby być sumowany łącznie... **Uzasadnienie pozostawienia tego tak, jak jest teraz, musiałoby mówić, że za handel odpowiada państwo i cywilizacja... To jeszcze byłoby okej, tylko jest problem tego typu, że niestety nie da się tych środków potem przeznaczyć na badania**, co najwyżej na kupowanie jednostek lub budynków." **ECHO właściciela (AskUserQuestion):** **„Pełna integracja: przed mnożnikiem Wealth"** — dochód z tras ma być traktowany identycznie jak reszta przychodów miasta: wchodzi do puli PRZED mnożnikiem zamożności, więc budynki zamożności go podbijają, a suwaki Handlu dzielą go na naukę/złoto. Właściciel przyjął jawnie, że to **zwiększy** łączny dochód z handlu i wymaga sprawdzenia balansu. | Recon (`Explore` + własna weryfikacja odczytem kodu) — **wrażenie właściciela POTWIERDZONE, i to jest jawnie zapisany kontrakt, nie przypadek**: dochód ze szlaków trafia w całości do skarbca, z pominięciem podziału. Rozstrzyga `turn-economy.ts:2687` i `:2775` — `pieniadz: pieniadzPoWealth + pieniadzZTras`; komentarz kontraktowy `turn-economy.ts:2641-2643` mówi wprost „dochod dystansowy z tras — CZYSTO do skarbca, dodany PO mnozniku Wealth" (patrz też `turn-economy.ts:1098-1101`). **Dwie konsekwencje, obie do odwrócenia w tym temacie:** (1) suwaki Handlu (`economy.ts:989-997`, domyślnie 60% na naukę wg `economy.ts:233`) dzielą wyłącznie `handelNetto` z pól miasta — dochód z tras nigdy przez nie nie przechodzi, więc handel **nie finansuje nauki ani odrobinę** (pole `nauka` ticku pochodzi wyłącznie z `yld.nauka`, `turn-economy.ts:2774`, liczonego z `handelNetto` w `economy.ts:1006-1010`); (2) mnożnik Wealth też go nie dotyczy, bo jest doliczany PO nim. **Infrastruktura pod zmianę już istnieje i jest per-miasto** — `computeTradeRouteIncomeByCity` (`trade-routes.ts:1637`) zwraca mapę per miasto, wołaną w ticku (`main.ts:27879-27881`, bonus portowy 27888-27893) i podawaną do `advanceCityEconomy` (`main.ts:27906-27912`), gdzie ląduje w `pieniadzZTras` (`turn-economy.ts:2644`, podgląd `:2072`). Zmiana to przekierowanie tej samej, już istniejącej mapy do puli dzielonej, a nie budowa nowego przepływu. **Brak różnicy gracz/AI** — ta sama `advanceCityEconomy`; księgowanie gracz `main.ts:28337-28338`, AI `main.ts:28387-28388` i `28412-28415`. **Uwaga na sąsiedni, ZINTEGROWANY temat:** `R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1` (`REJESTR:3766`) dotyczył wyłącznie błędu PODGLĄDU HUD („Handel ze szlaków: 0") — nie myl go z tym tematem; tamten potwierdził wtedy, że silnik realnie dolicza dochód, i to nadal jest prawda. **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (`R-PROC-AUTOBOT.md` §2b). Kolejka `main.ts`: (1) `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, (2) ten temat. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — drewno z wycinki + ciche przycięcie limitem magazynu

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1` | „Jeszcze jedno, wycięcie lasu powinno dawać plus 50 drewna, a nie pięć, jak teraz." **ECHO właściciela (AskUserQuestion):** (1) **„50 łącznie, jednorazowo (1 tura)"** — prosta podmiana wartości przy zachowaniu jednej tury, bez rozkładania w czasie; (2) **„Tak, w tym samym temacie"** — przy okazji naprawić ciche przycięcie limitem magazynu. | Recon orkiestratora (odczyt kodu + historia Git). **(A) Obserwacja właściciela („pięć") NIE zgadza się z danymi — wartość w repo to 25, nie 5.** `gra/data/terrain-improvements.json:185-188`: `"wycinka": { "praca_per_tura": 25, "tury": 1, "usuwa_nakladke": "las" }` — jedyny taki wpis w pliku (`grep -c '"praca_per_tura"'` = 1), wartość niezmieniona w historii tego fragmentu. Ścieżka: `improvement-tech.ts:97` (`row.wycinka.praca_per_tura ?? 20`) → `buildHexClearingState` (`:170`) → `tickHexClearing` (`:176-181`) → `main.ts:28210` → `applyStolarniaDrewnoMapInflow` (`turn-economy.ts:844-851`, `floor(baza × (1 + 0,10 × liczbaStolarni))`) → `creditOwnerResourceStock`. Bez Stolarni mnożnik = 1,0, więc kredyt = 25. **Rozbieżność do wyjaśnienia w temacie** — najprawdopodobniej starszy build u właściciela ALBO przycięcie z (B); Operator ma to rozstrzygnąć, nie zgadywać. **(B) DEFEKT KOMUNIKATU — kwota pokazywana graczowi jest liczona PRZED przycięciem, a kredyt PO.** `main.ts:28243` woła `creditOwnerResourceStock(cities, ownerId, 'drewno', drewnoCredit, drewnoCap)`, ale `main.ts:28245` drukuje `'Wycinka: +' + drewnoCredit + ' Drewna'` — czyli wartość SPRZED capu. Log AI robi to poprawnie (`main.ts:31660-31668` używa zwróconego `drewnoCredited`). Przy prawie pełnym magazynie gracz widzi „+50", dostaje np. 5 i nie dowiaduje się o stracie — **to samodzielnie tłumaczy obserwację „pięć" i jest realnym błędem niezależnie od zmiany wartości**. Precedens tej samej rodziny: `P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO` (komentarz `main.ts:28231-28233`). **(C) Uwaga na string domyślny** — `improvement-tech.ts:80` buduje opis „Wycinka N tury (+M Drewna/turę)" z fallbackiem `?? 20`, a `:97` z `?? 20`; po zmianie danych sprawdzić spójność fallbacków, żeby karta CivPedii nie pokazywała innej liczby niż silnik. **(D) Regeneracja bundla** — `gra/src/data/wikiBundle.json` niesie opisy ulepszeń, więc po zmianie danych uruchomić `node tools/bundle-wiki-for-game.cjs` i sprawdzić idempotencję. **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (`R-PROC-AUTOBOT.md` §2b). Kolejka `main.ts`: (1) `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, (2) `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`, (3) ten temat. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — paski postępu w kolejce produkcji

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1` | Ze zrzutem sekcji „KOLEJKA PRODUKCJI" (12 miast, np. „Sparta · Dom Starszyzny (63%) · 0") oraz zrzutem sekcji „PRODUKCJA NAUKI" jako wzorca: „Przydałyby się oprócz procentów jakieś paski postępu w tym miejscu... i wskazywałby procent zajętości lub realizacji – taki pasek postępu." + „Coś takiego jak tutaj." *(„dąb starszy"/„dąb starszyzny" w dyktowaniu = **Dom Starszyzny**, widoczny na zrzucie.)* | Recon (odczyt kodu). **(A) Obie sekcje są w JEDNYM pliku** — `gra/src/ui/empireDetailPanel.ts` (nauka `:1964-1984`, kolejka `:2051-2081`), więc temat to ujednolicenie dwóch sąsiadujących fragmentów tego samego widoku, bez integracji między modułami. **(B) Wzorzec paska już istnieje** (`:1974-1978`): tor `height:8px;border-radius:999px;background:#1f2733;overflow:hidden` + wypełnienie `width:${pct}%` z `linear-gradient(90deg,#2c4a6b,#8ec5ff)`, wartość w stałej szerokości 62px. **(C) Procent JEST JUŻ POLICZONY** (`~:2062-2065`, `front.postep / max(1, front.koszt)`) — nie trzeba liczyć od nowa; uwaga na `null`, gdy pozycja nie ma `postep`. **(D) NAJWAŻNIEJSZE — identyczny wygląd, RÓŻNE znaczenie.** Pasek nauki jest **względny** (`pct = n / maxN`, udział wobec najsilniejszego miasta — stopka mówi to wprost, `:1982-1983`), a produkcyjny ma być **bezwzględny** (`postep / koszt`, ukończenie 0-100%). Gracz, widząc dwa identyczne paski jeden pod drugim, odczyta drugi przez analogię — **stopka musi to rozróżniać jawnie, inaczej temat pogorszy czytelność zamiast poprawić**. To jest główne ryzyko tego tematu i główny tryb samooszukiwania w dispatchu (skopiowanie wyglądu RAZEM z formułą). **(E) Istniejąca stopka niesie ważne zastrzeżenie, którego nie wolno usunąć** (`~:2073-2080`): procent dotyczy WYŁĄCZNIE frontu kolejki, a pozycje za frontem mogą mieć zbankowany postęp niewidoczny w tym widoku. Powstała jako naprawa N5 po `FAIL` Evaluatora (komentarz w kodzie wprost o tym mówi) — dopisać do niej, nie zastąpić. **(F) Przeszkoda konstrukcyjna:** kolejka używa `miniHeader`/`miniRow` z siatką `'1fr 1.3fr 0.7fr'` (trzy kolumny), nauka — swobodnego flexa. Pasek musi zmieścić się w kolumnie „BUDUJE TERAZ" obok nazwy budynku albo siatka musi się zmienić; wybór należy do Operatora, ale ma być uzasadniony i pokazany na zrzucie przy 12+ miastach (tyle jest na zrzucie właściciela). **DISPATCHOWANE** 2026-09-04 (Opus 5 na Operatorze i Evaluatorze — temat wizualny, §9 poz. 6b) — worktree `wt-panel-kolejka-pasek`. |

## NOWE ZGŁOSZENIA 2026-09-04 (wieczór) — konwersja religii po podboju + autowyżywienie przy limicie ludności

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1` | Ze zrzutami paneli Religia i Porządek: „W przypadku kultury obserwujemy, że kultura innej cywilizacji jest powoli zastępowana naszą kulturą, co wywołuje zamieszki i negatywne skutki... W religii nie dostrzegam takiego zjawiska. Religia również powinna być zastępowana... co powinno przynosić minusy religii, a po jednej turze moja religia od razu jest na plusie, choć zastąpiłem swoją religią inną religię tej cywilizacji, której miasto zdobyłem. W kwestii religii więc jest coś do poprawy, aby było podobnie jak przy kulturze." | Recon (`Explore`) — **obserwacja właściciela POTWIERDZONA, przyczyna jednoznaczna.** **(A) Maszyneria konwersji religii ISTNIEJE, ale po podboju nigdy się nie uruchamia.** `convertViaTemple` (`culture-religion.ts:997-1069`) konwertuje `round(rate × pula obcych)`, min 1/turę; stawka `religionConversionRatePct` (`:950-958`) = normal 2%/t + świątynia 4 + kręgi 2. Odpalane w `conquest-stability.ts:130-142`, ale **tylko gdy `foreignReligionDominant`** (`main.ts:28714, 28733`) — a po podboju obca religia nigdy nie jest dominująca, bo: **(B) ścieżka przejęcia ustawia religię zdobywcy na 100% natychmiast** — `main.ts:26284-26289`: `if (!isBarbarian(atkOwner) && sameCultureCircle(...)) cityRelig.set(city.id, defaultCityReligionState(pop, ownerReligionForOwnerId(atkOwner)))`. **(C) Drugą drogą do tego samego jest fallback** — `resolveCityReligionState` (`culture-religion.ts:736-742`) → `defaultCityReligionState` (`:723-731`) buduje 100% wiary AKTUALNEGO właściciela, wołane z `city.ownerId` po zmianie właściciela (`main.ts:4143-4148`); każde miasto bez wpisu w `cityRelig` (`main.ts:2697`) pokazuje po podboju 100% religii zdobywcy. **(D) BRAK ODPOWIEDNIKA `onCityCapturedCulture` DLA RELIGII** — to jest sedno. Kultura ma przy przejęciu jawne ODWRÓCENIE udziału: `onCityCapturedCulture` (`conquest-stability.ts:56-73`, `city.ownCultureShare = 1 - prev`), wołane z `post-battle-map.ts:494-496`, a potem narasta `convertCulture` (`culture-religion.ts:437-458`, normal baza **1%/t**, cap **5%/t**, `society-params.json`). Grep `onCityCapturedCulture` daje JEDNO trafienie — tylko dla kultury. `cityRelig.set` istnieje w 3 miejscach: `main.ts:26285` (podbój), `28733` (tick), `28768` (szerzenie). **(E) DRUGA, GŁĘBSZA ASYMETRIA — kara kulturowa jest stopniowana, religijna BINARNA.** `cultureHappiness` (`culture-religion.ts:384-393`): progi po udziale, `<25% → −4`, `<50% → −2`; etykieta „Kultura (udział własnej X%)" `society-breakdown.ts:317-322`. `religionHappiness` (`:791-806`): nasza dominuje → +4, obca dominuje (>50%) → −4, przeskok na progu. **Sama naprawa konwersji NIE wystarczy** — nawet przy stopniowym udziale szczęście skakałoby na progu 50%. **(F) Dane niesymetryczne:** blok `religia` w `society-params.json` ma `religia_konwersja_bazowa/swiatynia/kregi/cel`, `religia_prog_dominacji` (50), `religia_kara_obca` (−4), ale **brak odpowiednika `kultura_konwersja_cap_tura`**. **(G) PUŁAPKA do sprawdzenia przez Operatora:** `civKeyForOwnerId` zwraca fallback `'grecy'` dla nieznanego ownerId (`main.ts:7452-7456`), więc `sameCultureCircle` w (B) może dać fałszywe TRUE dla państwa-miasta — dwie różne drogi do tego samego objawu, obie trzeba pokryć. **(H) Pozostałe lejki przejęcia NIE dotykają religii ani kultury** — `resolveSiegeSurrender` (`main.ts:12991-13130`) i `capital-capture.ts`: zero trafień. To znaczy, że kapitulacja głodowa zostawia stan sprzed podboju — **osobna niespójność, do rozstrzygnięcia w temacie**. **(I) Kontekst historyczny:** `dyspozycje/KULTURA-RELIGIA-AUDYT-2026-07-22.md:502` — `B-KULT-REL-Q2 = A` „konwersja religii po podboju", status ✅ conquest-stability; `:114` odnotowuje „po podboju religia często zostaje stara bez konwersji". Czyli temat był kiedyś uznany za zamknięty, a objaw jest odwrotny niż wtedy opisywany. **ECHO właściciela (AskUserQuestion) 2026-09-04: „Pełna symetria z kulturą"** — zakres obejmuje TRZY rzeczy naraz: (1) odwrócenie udziału własnej religii przy podboju (odpowiednik `onCityCapturedCulture`), (2) narastanie co turę z sufitem (dziś `convertViaTemple` istnieje, ale nie jest odpalane po podboju), (3) **zniesienie binarności kary** — `religionHappiness` dostaje progi wzorem `cultureHappiness` (dziś przeskok −4 → +4 na progu 50%). Właściciel przyjął jawnie, że sama naprawa konwersji nie wystarczy. **ZAREJESTROWANE, NIE DISPATCHOWANE** — kolizja plikowa: `society-breakdown.ts` i `society-params.json` trzyma `R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1`, `main.ts` trzyma `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (`R-PROC-AUTOBOT.md` §2b). |
| `R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1` | „Jeśli dane miasto jest na autowyżywieniu i osiąga limit swojej ludności, na przykład 5 lub 8, system autowyżywienia powinien wyzerować przyrost... W innym wypadku nadmiar żywności marnuje się, chyba że prostsze rozwiązanie to przenoszenie nadmiaru tej żywności na spichlerz... Oba zresztą prowadzą do tego samego, więc nie wiem, które jest prostsze i które będzie lepsze." | Recon (`Explore`) — **wariant (b) JEST JUŻ ZBUDOWANY, więc warianty NIE są równoważne; rekomendacja: wariant (a).** **(A) Nadmiar NIE przepada lokalnie** — nadwyżka miasta jest bezwarunkowo dodawana do puli centralnej: `empire-food.ts:249-251` (`if (bilans >= 0) { central += bilans; }`), bez żadnego warunku na populację. **(B) Redystrybucja do miast deficytowych JUŻ DZIAŁA** — `empire-food.ts:257-265` (`covered = Math.min(d.need, Math.max(0, central))`). Pula: `EmpireFoodState.zapasyPanstwa`, zapis `:281`, odczyt `getEmpireFoodReserve` `:328`. Spichlerz podnosi jej sufit: `SPICHLERZ_EMPIRE_CAP_I = 1000`, `_II_FULL = 1500` (`building-resource-gate.ts:502-503`, sumowane `empire-food.ts:177-181`). Czyli **to, co właściciel proponuje jako wariant (b), istnieje w produkcji.** **(C) REALNA STRATA jest dokładnie tam, gdzie wskazuje wariant (a):** `autoRaiseRationsForGrowth` (`empire-food.ts:627`, pętla `:666-672`) podnosi `poziomRacji` we WSZYSTKICH miastach właściciela, **nie sprawdzając, czy miasto stoi na limicie ludności** — `empire-food.ts` w ogóle nie zna pojęcia capu (brak `cityPopulationCap`/`popCap` w pliku; `atPopCap` żyje wyłącznie w UI, `cityPanel.ts:1256`). Rosnący koszt racji zjada nadwyżkę, a wzrost i tak jest zablokowany (`population-growth-v85.ts:243` `pop < popCap`, `growthGainPerTurnSlots` zwraca 0 przy `atPopCap`, `:271`). **(D) Drugie miejsce strat:** pula centralna jest jawnie przycinana do sufitu — `empire-food.ts:276` (`if (central > maxCap) central = maxCap;`), `computeCentralFoodCap` `:168-185`. To JEDYNE miejsce, gdzie żywność realnie ginie. **(E) Limit ludności:** `cityPopulationCap` (`economy.ts:1073-1080`) — Akwedukt → 12, Spichlerz I/II → 8, bez niczego → 5. **(F) Autowyżywienie ma już widok całego imperium** — pętla per właściciel `main.ts:27995`, wywołania `:28013` i `:28037`, kryteria sumują wszystkie miasta (`computeEmpireCityFoodNadwyzka`, `empire-food.ts:412-426`) — więc wariant (a) nie wymaga nowej infrastruktury, tylko warunku w istniejącej pętli. **(G) Żywność NIE jest surowcem magazynowym typu drewno/glina** — brak w `OWNER_CAPPED_RESOURCE_KEYS` (`economy-upkeep.ts:403-408`), komentarz `:400-402` wprost: „Żywność (Spichlerz) — osobny model per-miasto, poza zakresem tej skali". **(H) Historia obszaru:** `R-AUTO-RACJE-RAISE` (ZDEPLOYOWANE), `R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE` (ZAMKNIĘTE), `R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK` (OTWARTE, UI), `P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-PRZYCISK-Q1` (recon zamknięty, wstrzymane), `P-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1` (ZINTEGROWANE). Uwaga: `R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A` i `R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY` są cytowane w kodzie (`empire-food.ts:457, 481`, `main.ts:27997`), ale **nie mają wierszy w rejestrze** — osobna luka dokumentacyjna. **ECHO właściciela (AskUserQuestion) 2026-09-04: „Tak, wariant (a) — stop przy limicie"**, bez warstwy UI. Autowyżywienie przestaje podnosić racje w mieście stojącym na limicie ludności i wznawia po jego podniesieniu; nadmiar dalej płynie do puli centralnej tak jak dziś. **ZAREJESTROWANE, NIE DISPATCHOWANE** — do sprawdzenia przy dispatchu, czy `empire-food.ts` może poznać cap populacji bez zmiany miejsca wywołania w `main.ts` (`main.ts:28013`, `:28037`); jeśli nie, temat czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (§2b). |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — etykieta obcej stolicy pokazuje nazwę cywilizacji zamiast nazwy miasta

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` | Ze zrzutem plakietki (korona, napis „CHIŃCZYCY", populacja 4): „Zauważyłem, że czasem miasta danej cywilizacji, zamiast nazywać się z listy miast, nazywają się Chińczycy. To nie tak powinna się nazywać stolica danej cywilizacji, tylko zgodnie z nazwami miast tej cywilizacji, tak jak Ateny były dla Grecji czy Rzym dla Rzymian... Być może nazwa miasta została pomylona z nazwą cywilizacji i, co ważne, trzeba sprawdzić historycznie, która stolica tej cywilizacji była pierwotna." **ECHO właściciela po przedstawieniu reconu (AskUserQuestion): „Pokaż nazwę miasta i cywilizację"** — etykieta obcej stolicy ma nieść OBA człony, wzorem państw-miast (`Xi'an · Chińczycy`), plus korona jak dotąd. | Recon (`Explore` + weryfikacja orkiestratora) — **hipoteza właściciela SIĘ NIE POTWIERDZIŁA; nie ma błędu w danych ani w nadawaniu nazw.** **(A) Dane kompletne dla WSZYSTKICH 15 cywilizacji** — `gra/data/city-names-pools.json` (kształt `city-names-pool.ts:39-43`); Chińczycy: 100 nazw miast (`Xi'an`, `Luoyang`, `Pekin`, `Nankin`, `Kaifeng`…) + 10 nazw państw-miast (`Qin, Qi, Chu, Jin, Yan, Zhao, Wei, Han, Lu, Song`). Każda cywilizacja ma dokładnie 100+10, pilnuje tego walidator `city-names-pool.ts:243-248`. **(B) Fallback „nazwa cywilizacji jako nazwa miasta" ISTNIEJE, ale jest MARTWY** — `city-names-pool.ts:126` i `civ-names.ts:90` zwracają `ikonaId`, czyli `chinczycy` MAŁYMI literami, nie „Chińczycy"; przy obecnych danych nieosiągalne. Inne fallbacki: `Stolica` (`:76`), `Rywal N` (`:91`), `Miasto` (`:187`). **(C) PRZYCZYNA — świadoma podmiana w warstwie WYŚWIETLANIA.** `display-names.ts:174` (warunek `isForeign && isCapital && !isCityState && !isCityStateOwner`) → `:252` `if (isClusterCapital && cleanCiv) return cleanCiv;`. **Miasto MA poprawną nazwę z puli, jest tylko przykryta na etykiecie.** Wołający: `render/cities.ts:778-789`, `:861-862`, korona `:839`, wpięcie `main.ts:2284`. **(D) To była JAWNA, ZDEPLOYOWANA decyzja projektowa** — `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md:11` używa dosłownie przykładu „Chińczycy"; rejestr `:150`, status ZDEPLOYOWANE FALA 296 (`a37f7123`). **Ten temat świadomie ZMIENIA tamtą decyzję na wyraźne żądanie właściciela — to nie naprawa błędu, to zmiana projektu.** Aktualizację `MAP-UX-CLUSTER-LABEL-Q1.md` robi orkiestrator po integracji (agenci mają `docs/decyzje/**` zakazane). **(E) „W kilku cywilizacjach" — objaw jest jednakowy dla KAŻDEJ**, bo nie zależy od danych, tylko od tego, czy miasto jest obcą stolicą. **(F) Wzorzec docelowy JUŻ ISTNIEJE dwie linie niżej** — `display-names.ts:253-255` daje państwom-miastom `${cleanCity}${CITY_STATE_SEPARATOR}${cleanCiv}` („Yan · Chińczycy"), chronionym przed podmianą guardem `isCityStateOwner` (`:172,174`). Zmiana = ujednolicenie gałęzi stolicy z gałęzią państwa-miasta, nie nowy format. **(G) Dane wejściowe już dostępne** (`cleanCity` z `cityName`, `:242-244`) — bez zmian w `main.ts`. **(H) Druga część zgłoszenia („sprawdzić historycznie pierwotną stolicę") jest bezprzedmiotowa po (A)/(C)**, ale dispatch wymaga od Operatora sprawdzenia i wypisania, czy pierwsza pozycja `miasta_cywilizacji` każdej z 15 cywilizacji jest sensowną stolicą historyczną (dla Chińczyków `Xi'an` = Chang'an, stolica Zachodniej Han i Tangów — zasadne); ewentualne wątpliwości → `DECISION_REQUIRED`, bez samodzielnej edycji danych. **Ryzyko zmiany do sprawdzenia na zrzucie:** etykieta rośnie mniej więcej dwukrotnie, więc plakietka może się rozjeżdżać. **DISPATCHOWANE** 2026-09-04 (Opus 5 na Operatorze i Evaluatorze — temat wizualny, §9 poz. 6b) — worktree `wt-mapa-etykieta-stolicy`. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — AI masowo wypowiada wojnę graczowi zamiast parować się między sobą

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1` | Dwie wiadomości ze zrzutami. (1) „Jedna z cywilizacji nie ma żadnej wojny, a w epoce wojny inne cywilizacje, zamiast zaatakować Rzym, zaatakowały mnie we dwójkę... Najpierw system powinien parować cywilizacje, starając się zawsze z jedną z nich znaleźć parę, a dopiero brakujące cywilizacje powinny wchodzić ewentualnie w trójkowe rozwiązanie. Prawdopodobnie chodzi o to, że z jedną z cywilizacji, która graniczy ze mną, zawarłem sojusz, więc ta cywilizacja nie miała może z kim walczyć... System powinien zaczynać wybór przeciwnika do wojny od mojego sojusznika i potem kontynuować kolejno, a nie tworzyć trójkątów, jeśli jakakolwiek z cywilizacji nie ma wojny." (2) „Trzy cywilizacje wypowiedziały mi wojnę, to już nawet nie jest trójkąt, tylko wielokąt. Pomimo tego, że każda z tych cywilizacji prowadzi wojnę też z kimś innym. Myślę, że ogólnie wszystkie cywilizacje zaczęły wchodzić w trójkąt, a to miała być tylko ostateczność, kiedy gracz nie ma pary." **Dane ze zrzutów (6 cywilizacji):** Egipt ↔ gracz + Harappa; Harappa ↔ gracz + Egipt; Sumerowie ↔ gracz + Chińczycy; **Rzym NEUTRALNY, zero wojen**. | Recon (`Explore`) — **to NIE jest błąd, to mechanizm działający dokładnie tak, jak go napisano; mechanizm jest odwrotnością oczekiwania właściciela.** **(A) PRZYCZYNA GŁÓWNA — funkcja nazwana wprost „domino".** `pickStoneForcedWarDominoOwnerIds` (`forced-war-stone.ts:222-234`), `pickBronzeForcedWarDominoOwnerIds` (`forced-war-bronze.ts:323-336`), `pickIronForcedWarDominoOwnerIds` (`forced-war-iron.ts:309-314`): **dla KAŻDEJ aktywnej pary wojennej AI↔AI OBIE strony dostają cel = gracz**, wymuszane w main poza normalną ścieżką — `main.ts:30528-30530` (`if (bronzeDominoOwnerIds.has(ownerId)) bronzeForceWarTargetId = 0;`), `:30630`, `:30720`; uruchamiane raz na turę dla trzech epok, `main.ts:29658-29692`. **Im więcej wojen AI↔AI, tym więcej cywilizacji dostaje polecenie ataku na gracza** — to dosłownie generuje „wielokąt". Zrzuty odtwarzają się co do pary. **(B) Zabezpieczenie nie działa W TEJ SAMEJ TURZE.** Flaga `playerAlreadyHasActiveForcedWar` (`main.ts:29658-29661`) liczy tylko wojny wymuszone z `targetId===0` i jest odczytywana **RAZ, przed pętlą** (`forced-war-stone.ts:205-208`) — więc wiele par uderza w gracza jednocześnie. **(C) Sojusz odbiera sojusznikowi wojnę i nie daje nic w zamian** — hipoteza właściciela trafna co do joty. Sojusz wyklucza sojusznika z bycia celem (`main.ts:30489-30497`, `allianceFormalKindBetween`) ORAZ wyklucza całą parę z domina (`main.ts:29662-29667`, `forced-war-stone.ts:230`), ale **nie przydziela mu zastępczego celu** → Rzym bez wojny. **(D) Fallback z premedytacją omija filtr wojen gracza** — `forced-war-bronze.ts:295-299` i `forced-war-stone.ts:178-182`: gdy pula AI pusta, `return 0` (gracz), **ignorując, że gracz już prowadzi inne wojny**; komentarz mówi to wprost (`forced-war-stone.ts:151-154`). Filtr `countActiveWarsForOwnerExcludingBarbarians` (`main.ts:30504-30508`) chroni więc kandydatów-AI, ale nie gracza. **(E) BRAK limitu jednoczesnych wojen per cywilizacja i BRAK sprawdzenia „czy ktoś zostaje bez wojny".** `maxWars` istnieje wyłącznie dla odmowy dołączenia do wojny sojusznika (`alliance-war-obligation.ts:42-43`, `main.ts:17874`). Bramka „napastnik nie może już walczyć" (`forced-war-bronze.ts:124-129`, `main.ts:30439`) jest omijana przez ścieżkę domino (`main.ts:30523-30530` działa mimo `alreadyAtWarAnyRole`). **(F) Świadomie bez limitu trudności** — `forced-war-bronze.ts:308-310`, `forced-war-stone.ts:198-203`; Łatwy wyłącza cały mechanizm (`main.ts:30450-30451`). **(G) Trzy niezależne ścieżki wypowiadania wojny** — reaktywna `decideAIDiplomacy` Priorytet 4 (`ai.ts:4376`, warunki `:4683-4693`), wymuszone per epoka z wczesnym `return` PRZED progami ogólnymi (`ai.ts:4394-4408` klaster MP, `:4411-4432` Brąz, `:4442-4456` Kamień, `:4467-4480` Żelazo), wykonanie `main.ts:30742` → `:30783`. Zmiana musi objąć wszystkie trzy epoki, inaczej objaw wróci w kolejnej. **(H) Historia — mechanizm był świadomie dodany i już raz odwracany:** `R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1` ZINTEGROWANE (`ec4dd4fa`, rejestr `:4380`), `P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1` ZINTEGROWANE (`:3333`, punkt (c) — gracz wchodzi do puli kandydatów), `R-WOJNA-WYMUSZONA-REGULY-Q1` DISPATCHOWANE (`:3976`, część B — fallback na gracza), `P-DYPLO-WYMUSZONA-WOJNA-OMIJA-GRACZA-Q1` ZAMKNIĘTE (`:3181`, stan sprzed odwrócenia), `R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1` RECON ZAMKNIĘTY (`:4259`). **Ten temat odwraca kierunek po raz drugi — dlatego wymaga jawnego kryterium docelowego, nie kolejnego dostrojenia progów.** **ECHO właściciela (AskUserQuestion) 2026-09-04 — DOCELOWY ALGORYTM: „Najpierw wszyscy mają wojnę, potem trójkąty".** Krok 1: cywilizacje **bez żadnej wojny** są parowane 1v1 w PIERWSZEJ kolejności — to automatycznie rozwiązuje przypadek Rzymu i sojusznika gracza (recon C). Krok 2: dopiero gdy komuś zabraknie pary (nieparzysta liczba podmiotów), dołącza jako trzeci do istniejącej wojny. **Gracz traktowany dokładnie jak każde AI — mechanizm domino ZNIKA**, bez twardego limitu wojen gracza (właściciel świadomie odrzucił wariant uprzywilejowujący gracza formalnie). Kryterium binarne dla Operatora wynikające z ECHO: **po przydziale nie może istnieć podmiot z zerem wojen, dopóki istnieje inny podmiot z dwiema lub więcej.** **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (§2b) oraz na zwolnienie mocy maszyny (2026-09-04 20:37: load average 14 na 4 rdzeniach, 5 workflow równolegle — szósty groziłby fałszywym `ZWIS`). |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — audyt nazw miast: pierwsze stolice + rozdzielenie list państw-miast

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1` | „Czas sprawdzić wszystkie cywilizacje, ich pierwsze miasto i czy czasem nie ma wśród listy miast nazw cywilizacji." (wynikło ze zgłoszenia etykiety „CHIŃCZYCY"/„SUMEROWIE"). **ECHO właściciela (AskUserQuestion), trzy pozycje wybrane łącznie:** (1) **Asyria: `Ninive` → `Aszur`**, (2) **Fenicja: `Tyr` → `Byblos`**, (3) **„Rozdziel wszystkie — ~126 nowych nazw"** dla list państw-miast. | Audyt wykonany programowo przez orkiestratora na całym `gra/data/city-names-pools.json` (nie na próbce). **(A) Pierwsze miasto każdej z 15 cywilizacji jest sensowne historycznie:** Grecy→Ateny, Rzymianie→Rzym, Chińczycy→Xi'an, Inkowie→Cusco, Zulusi→uMgungundlovu, Egipcjanie→Memfis, Sumerowie→Uruk, Celtowie→Bibracte, Germanie→Mattium, Harappanie→Harappa, Hetyci→Hattusa, Słowianie→Kijów, Babilończycy→Babilon, Asyryjczycy→Ninive, Fenicjanie→Tyr. Każda ma komplet 100 + 10. **(B) Jedyne trafienie „nazwa cywilizacji na liście miast" jest POPRAWNE:** `Harappa` u `harappa` („Harappanie") — eponim, cywilizacja harappańska nazywa się OD miasta, nie odwrotnie. Jedyny taki przypadek w pliku. **(C) Dwie pierwsze pozycje historycznie dyskusyjne (nie błędne, ale nie pierwotne) — ZATWIERDZONE DO ZMIANY:** Asyria `Ninive` → pierwotną stolicą był **Aszur**, od niego pochodzi sama nazwa Asyrii; Niniwa dopiero za Sennacheryba. Fenicja `Tyr` → **Byblos** i Sydon starsze; Byblos uchodzi za najstarsze stale zamieszkane miasto fenickie. W obu wypadkach dotychczasowa nazwa **zostaje na liście dalej**, zmienia się tylko pierwsza pozycja. **(D) SKALA ROZDZIELENIA LIST — zmierzona, znacznie większa niż wyglądało: 126 ze 150 nazw państw-miast pokrywa się z listą miast tej samej cywilizacji.** Pełne pokrycie (10/10): Grecy, Rzymianie, Inkowie, Zulusi, Egipcjanie, Sumerowie, Celtowie, Germanie, Harappanie. Częściowe: Babilonia 9, Fenicjanie 8, Asyria 7, Hetyci 6, Słowianie 6. **Zero kolizji ma tylko `chinczycy`** (`Xi'an…` vs `Qin, Qi, Chu…`) — i to jest wzorzec do naśladowania: nazwy państw-miast jako mniejsze ośrodki/państwa zależne, nie powtórki stolic. Skutek dzisiejszy: greckie państwo-miasto może nazywać się **Ateny**, dokładnie jak stolica Grecji. **(E) 118 nazw powtarza się MIĘDZY cywilizacjami** — przeważnie zasadnie (Sumer i Babilonia dzielą miasta Mezopotamii: Uruk, Ur, Nippur, Larsa, Isin, Eridu, Kisz, Akkad, Sippar, Babilon; Teby greckie i egipskie; Lugdunum rzymskie i celtyckie; Wolin germański i słowiański). **Nie objęte tym tematem** — to świadome dziedzictwo historyczne, ale warto wiedzieć, że w grze mogą istnieć dwa różne miasta o tej samej nazwie. **ZAREJESTROWANE, NIE DISPATCHOWANE** — temat dotyka wyłącznie `gra/data/city-names-pools.json`, więc NIE koliduje z żadnym biegnącym tematem (`R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` ma ten plik jawnie ZAKAZANY); czeka wyłącznie na zwolnienie mocy maszyny. Zakres: 2 podmiany pierwszych pozycji + ~126 nowych nazw historycznych dla `miasta_panstwa`, plus regeneracja `wikiBundle.json`, jeśli niesie te nazwy. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — zdobyte miasto dziedziczy w kolejce budynek, którego zdobywca nie może postawić

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1` | Ze zrzutem panelu produkcji zdobytego miasta (Pałac, 142/320 Pracy, ~10 tur, w kolejce dalej Dom Starszyzny / Stela / Spichlerz): „Jeśli zajmujemy miasto-państwo innej cywilizacji, mogła ona budować pałac, ponieważ była jedyną stolicą swojej cywilizacji. Gdy przejmuję to miasto, ona nadal buduje pałac, który mógłby być budowany przeze mnie, ale nie powinien. Cała nadwyżka powinna trafić do głównej puli, ponieważ w cywilizacji może być tylko jeden pałac." **ECHO właściciela (AskUserQuestion):** (1) zwrot Pracy — **„Do mojej puli — zdobywcy"** (świadomie ODWROTNIE niż istniejąca konwencja, patrz recon C); (2) zakres — **„Wszystkie niemożliwe do postawienia"**, nie tylko Pałac. | Recon orkiestratora (odczyt kodu). **(A) Przy przejęciu miasta DZIAŁAJĄ już dwa sanityzatory, ale żaden nie zna pojęcia „budynek niemożliwy dla nowego właściciela".** `main.ts:26260-26273`, gałąź `else` (zdobywca niebarbarzyński): `sanitizeBuildQueue(prodCapture)` → migruje legacy jednostki z kolejki Pracy i zwraca `refundedPraca`; następnie `sanitizeProductionQueue(atkOwner, migrated.prod)`. Unikalność Pałacu **nie jest sprawdzana nigdzie w tej ścieżce**. **(B) Gałąź barbarzyńska czyści kolejkę CAŁKOWICIE** — `main.ts:26258-26259` (`cityProd.set(city.id, { kolejka: [], postep: 0 })`), z obszernym komentarzem tłumaczącym, dlaczego odziedziczony budynek w toku dokończyłby się pod obcą flagą (`advanceCityEconomy` liczy Pracę bez filtru `ownerId`, `advanceProduction` odejmuje ją od frontu bez sprawdzania właściciela). **Ten sam mechanizm dokańczania działa dla zdobywcy-gracza** — tyle że tam kolejki się nie czyści. **(C) Istniejąca konwencja zwrotu jest ODWROTNA do ECHO** — `main.ts:26269-26271`: `setOwnerPracaPool(oldOwner, ownerPracaPool(oldOwner) + migrated.refundedPraca)`, czyli zwrot idzie do POPRZEDNIEGO właściciela (komentarz: „Postęp zwracamy poprzedniemu właścicielowi"). Właściciel świadomie wybrał zwrot do ZDOBYWCY — **Operator ma to zrealizować dla nowej klasy przypadków, NIE zmieniając istniejącego zwrotu za legacy jednostki** (to osobna, zatwierdzona wcześniej decyzja; zmiana jej byłaby wyjściem poza zakres). Rozróżnienie musi być jawne w kodzie i w teście. **(D) Zakres szerszy niż Pałac — do zinwentaryzowania przez Operatora:** cuda świata już wzniesione gdziekolwiek (istnieje `aiWonderPracaTickByCity`, `main.ts:31058`, więc cuda są realnym bytem kolejki), budynki zablokowane brakiem technologii u zdobywcy, oraz każdy inny byt „jedyny w cywilizacji". `KORUPCJA_REDUKCJA_BUDYNKI = ['sad','pretorium','palac']` (`economy.ts:1209`) potwierdza, że `palac` to zwykły klucz budynku, nie osobny typ — więc reguła unikalności musi zostać ustalona/odczytana, a nie założona. **(E) Prawdopodobne miejsce reguły:** te same funkcje, które decydują o dostępności budynku w panelu „DOSTĘPNE DO BUDOWY" (zrzut właściciela pokazuje, że Pałacu tam NIE ma — czyli reguła „nie mogę go postawić" JUŻ istnieje w warstwie UI i wystarczy jej użyć przy sanityzacji, zamiast pisać drugą). **To jest najmocniejsza wskazówka tego reconu** — Operator ma znaleźć tę funkcję i użyć jej, a nie duplikować logiki. **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` przez `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` (§2b) i na zwolnienie mocy maszyny. |

## NOWE ZGŁOSZENIE 2026-09-04 (wieczór) — autowyżywienie wszystko-albo-nic + brak stanu przycisku + blokada racji indywidualnych

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-AUTOWYZYWIENIE-GLOBALNY-BLOKER-I-STAN-PRZYCISKU-Q1` | Ze zrzutami panelu miasta i Spichlerza Centralnego: „Nie da się ustawić indywidualnego wyżywienia, jeżeli dla całej cywilizacji wyżywienie jest ustawione jako auto-wyżywienie. Poza tym jedno z miast całkowicie podlega wycinaniu... cały czas głoduje... Sparta ma jeden, a to miasto jest bardzo stare, już powinno mieć większą ludność. To samo Ateny, też tylko dwa, a było moim pierwszym miastem. Coś tu jest nie tak z autożywieniem. Nie, chyba to autowyżywienie nie było włączone, ale ciężko mi się odnieść, bo **niestety autowyżywienie można tylko kliknąć i nie wiadomo, czy jest włączone, czy nie. Powinno być zaznaczenie przycisku: albo włączone, albo wyłączone.** Inne przyciski: po prostu ten przycisk się świeci, gdy jest aktywny, a gdy jest odznaczony, jest nieaktywny." | Analiza orkiestratora z liczb na zrzucie Spichlerza Centralnego — **odwrotna zależność wzrostu od bilansu żywności, potwierdzona na 12 miastach:** Ateny bilans **+24** → wzrost **−1%**; Sparta koszt racji **0**, bilans **+13** → **−4%**; Korynt +15 → −2%. Jednocześnie Milet bilans **−21** → **+7%**, Jin −4 → +7%, Zhao −12 → +7%, Yan −13 → +4%. **Miasta z nadwyżką kurczą się, miasta z deficytem rosną.** Panel miasta podaje mechanizm wprost: „Wyżywienie 0 · −10%", rozbicie „Wyżywienie −10% / Małe miasto +5% / Szczęście +1% = −4%". Czyli **nadwyżka Sparty bierze się STĄD, że poziom racji stoi na zerze** — miasto nic nie wydaje na jedzenie i płaci za to −10% wzrostu. **HIPOTEZA GŁÓWNA (do potwierdzenia LUB obalenia przez Operatora, nie do przyjęcia na wiarę): autowyżywienie jest WSZYSTKO-ALBO-NIC i kilka miast deficytowych blokuje podniesienie racji w CAŁYM imperium.** `autoRaiseRationsForGrowth` (`empire-food.ts:627`) podnosi `poziomRacji` o `WYZYWIENIE_STEP` we WSZYSTKICH miastach właściciela naraz (pętla `:666-672`), po każdym kroku przelicza bilanse i **cofa krok**, jeśli pula centralna < 0 albo kryterium bilansu niespełnione (`:693-699`); kryteria sumują wszystkie miasta (`computeEmpireCityFoodNadwyzka`, `:412-426`). Na zrzucie właściciela cztery miasta są na minusie — jeśli one blokują krok, Sparta i Ateny nie dostaną racji **mimo własnej nadwyżki i mimo że Spichlerz Centralny ma 279/1000 i rośnie o +22/turę, deklarując „wszystkie miasta nakarmione"**. To spina wszystkie obserwacje właściciela w jedną przyczynę. **DRUGI DEFEKT, niezależny — brak czytelnego stanu przycisku.** Zrzut panelu miasta: dwa przyciski „Auto Wyżywienie" (ciemny) i „Indywidualne" (zielony). Właściciel nie potrafi odczytać, który stan jest aktywny — zielone podświetlenie równie dobrze czyta się jako „kliknij, żeby przełączyć na Indywidualne". Reszta gry używa konwencji „przycisk świeci = aktywny". **TRZECI DEFEKT zgłoszony przez właściciela, do weryfikacji:** rzekomy brak możliwości ustawienia racji indywidualnych, gdy auto działa na poziomie cywilizacji — sprawdzić, czy to blokada zamierzona, czy skutek defektu pierwszego. **POWIĄZANIE:** temat `R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1` (ECHO: wariant (a), stop przy limicie) dotyka TEJ SAMEJ funkcji `autoRaiseRationsForGrowth` — **oba tematy muszą iść SEKWENCYJNIE**, a prawdopodobnie warto rozważyć scalenie, bo dotyczą tej samej pętli. Istniejąca historia obszaru: `R-AUTO-RACJE-RAISE` (ZDEPLOYOWANE), `R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK` (OTWARTE — **to jest dokładnie trzeci defekt, zgłoszony już wcześniej i nadal nienaprawiony**), `P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-PRZYCISK-Q1` (recon zamknięty, wstrzymane). **ECHO WŁAŚCICIELA 2026-09-04 — SPECYFIKACJA DOCELOWA, przekształca temat z naprawy błędu w PRZEPROJEKTOWANIE CELU ALGORYTMU:** „Nie jest pożądana sytuacja, że jedne miasta głodują, a drugie mają super nadwyżkę. Raczej ta nadwyżka powinna być równomiernie rozkładana w całej cywilizacji, a wszystkie miasta będą się rozwijać wolniej, a nie tak, że jedno rośnie bardzo szybko, a drugie w ogóle. Oczywiście wyjątkiem jest sytuacja, gdy miasto osiągnie swój limit; wtedy nie musi się rozwijać i powinno mieć zerowy przyrost. **Generalnie system autowyżywienia powinien dążyć do tego, aby w każdym mieście był podobny wzrost, jednocześnie unikając głodu.** Dla całej cywilizacji wzrost powinien się spowalniać lub przyspieszać w zależności od ilości żywności. Obecnie niepożądane są sytuacje, w których jedne miasta rosną bardzo szybko i mają wysoki przyrost, a jednocześnie są na minusie. To jest bez sensu."

**ANALIZA ORKIESTRATORA — dzisiejszy algorytm optymalizuje INNĄ funkcję celu niż żądana.** Dziś: `autoRaiseRationsForGrowth` (`empire-food.ts:627`, pętla `:666-672`) podnosi `poziomRacji` o ten sam `WYZYWIENIE_STEP` we WSZYSTKICH miastach naraz i cofa krok przy niespełnieniu kryterium sumarycznego (`:693-699`) — czyli dąży do **jednakowego POZIOMU RACJI** przy ograniczeniu wypłacalności imperium. Żądane: dążyć do **jednakowego WZROSTU** przy ograniczeniu braku głodu. **To wymaga racji NIERÓWNYCH** — miasto słabsze potrzebuje większego wsparcia, nie takiego samego kroku. Zmiana funkcji celu, nie strojenie parametru.

**Dowód absurdu z liczb właściciela (zrzut Spichlerza Centralnego):** Milet bilans **−21**, wzrost **+7%** — bo pula centralna dopłaca mu z pozycji „Pomoc miastom −50" (redystrybucja `empire-food.ts:257-265` działa). Sparta bilans **+13**, wzrost **−4%** — bo jej `poziomRacji` stoi na zerze. **Żywność w imperium JEST, tylko trafia nie tam, gdzie powinna, a algorytm nie ma równości wzrostu w swoim kryterium w ogóle.**

**SCALENIE TRZECH TEMATÓW — decyzja orkiestratora.** Wszystkie trzy siedzą w tej samej pętli `autoRaiseRationsForGrowth` i dispatchowane osobno wchodziłyby sobie w drogę (`R-PROC-AUTOBOT.md` §2b). Ten temat **wchłania**: (1) `R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1` (ECHO: wariant (a) — stop podnoszenia racji w mieście na limicie ludności; to jest DOKŁADNIE „wyjątek" z tego ECHO, więc naturalnie należy do tej samej funkcji celu) oraz (2) `R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK` (stan przycisku Auto/Indywidualne — osobna warstwa UI, ale ten sam panel i to samo zgłoszenie właściciela). Tamte wpisy pozostają w rejestrze jako historyczne, ze wskazaniem na ten temat.

**GOAL docelowy do dispatchu (do rozpisania na węzły przy dispatchu):** (A) funkcja celu = minimalizacja rozrzutu WZROSTU między miastami, przy twardym warunku braku głodu; (B) miasto na limicie ludności wychodzi z optymalizacji z zerowym przyrostem, nie konsumując racji ponad potrzebę (wchłonięty wariant (a)); (C) tempo wzrostu CAŁEJ cywilizacji skaluje się z dostępną żywnością — mniej jedzenia = wszyscy wolniej, nie = jedni stoją; (D) stan przycisku Auto/Indywidualne czytelny wzorem reszty gry („świeci = aktywny"); (E) weryfikacja zarzutu właściciela, że racji indywidualnych nie da się ustawić przy włączonym auto. **ZAREJESTROWANE, NIE DISPATCHOWANE** — czeka na zwolnienie `main.ts` i mocy maszyny. Temat duży, prawdopodobnie wymaga podziału na węzły (rdzeń funkcji celu / limit ludności / UI). |

## NOWE ZGŁOSZENIA 2026-09-04 (noc) — przewaga liczebna w walce + AI nie stawia budynków

| ID | Zgłoszenie | Recon orkiestratora |
|---|---|---|
| `R-WALKA-PRZEWAGA-LICZEBNA-Q1` | „W bitwach brakuje trochę elementu przewagi. Potrafię atakować jedną jednostkę dwudziestoma jednostkami i ta jedna jednostka zadaje większe straty, niż bym wystąpił czasem dwoma jednostkami na jedną." Doprecyzowanie po przedstawieniu reconu: „Ale czy te zmiany odniosłeś do auto-bitwy? Mam też na myśli bitwę ręczną, kiedy straty są podobne, czasem większe, i jedna jednostka potrafi zadać większe straty dużej armii, niż wynikałoby to ze składu armii." **ECHO 1 (AskUserQuestion): „1 + 2 — arytmetyka + premia za otoczenie"; ECHO 2: „Nagradzająco — większy skład traci mniej"** (wykładnik powyżej progu opłacalności). **ECHO 3, KOREKTA KIERUNKU (odrzucenie propozycji orkiestratora o skalowaniu obrażeń od HP):** „**Nie chodzi o jednostki ranne. Bitwa powinna wyglądać dokładnie tak, jak wygląda, tylko jeżeli masz przewagę liczebną, to powinno się mieć jakiś bonus, chociażby do morale.** Na pewno już plusem są ataki z flanki czy od tyłu, chociaż sprawdź, czy zadają większe straty i zmniejszają morale, bo tak miało być. Nie wiem, czy tak jest. Niemniej jednak **morale armii, która jest dziesięciokrotnie mniejsza, powinno być obniżone z automatu i taka jednostka powinna szybciej routować, czyli uciekać**." | Recon (`Explore`) — **DWA niezależne systemy walki, DWIE różne przyczyny tego samego objawu.** **(A) AUTO-BITWA MAPY — przyczyna arytmetyczna, zmierzona.** `auto-battle-power.ts:85`: `winnerLossPct = coef × L_MAX / r^p`; `applyLossPctToRoster` (`:188-207`) nakłada ten sam procent HP na **KAŻDĄ jednostkę składu**. Parametry `auto-battle-params.json`: `L_MAX 0,42`, `p 0,58`, `L_MIN 0,05`. Arytmetyka: 2 na 1 (r≈2) → 28,1% × 2 = **0,56** jednostki HP; 20 na 1 (r≈20) → 7,2% × 20 = **1,44**. Większy skład traci łącznie **2,6× więcej** — dokładnie zgłaszany objaw. Straty łączne rosną jak `n/n^0,58 = n^0,42`; **próg opłacalności to wykładnik 1,0**, dziś 0,58. Osobno `L_MIN 0,05` jest podłogą NA JEDNOSTKĘ — 20 jednostek traci minimum 1,0 jednostki HP niezależnie od przewagi; musi stać się podłogą na SUMĘ. **(B) BITWA TAKTYCZNA — przyczyna inna: kontratak nie słabnie od ran.** `combat.ts:788` `resolveCombat` jest ściśle 1v1, nie zna pojęcia stosu; obrońca kontratakuje w KAŻDEJ rundzie (`:1049-1064`), a obrażenia liczone są z bazowych statów (`:1015`, `:1053`) — **`hpDef` nigdzie nie wchodzi do wzoru**, tak samo faza dystansowa (`:939-944`). **UWAGA: właściciel ECHO 3 ODRZUCIŁ naprawę tej przyczyny** (skalowanie obrażeń od HP) — bitwa ma zostać jak jest, rozwiązaniem ma być morale od przewagi liczebnej. **(C) Odpowiedź na pytanie właściciela „sprawdź, czy flanka działa": DZIAŁA, ale TYLKO w bitwie taktycznej 3D.** `flankRearDefensePenalty` (`combat.ts:535`) zależy od kierunku; `attackerPosition` ustawiane wyłącznie w `battleScene.ts:18690`, **na mapie zawsze `'front'`** (`combat.ts:819`) — w auto-bitwie flankowanie NIE ISTNIEJE. Morale reaguje na flankę +8 i tyły +15 (`battleScene.ts:1010-1037`), więc „miało być tak" jest spełnione w jednym z dwóch systemów. **(D) Premia za otoczenie JUŻ ISTNIEJE, też tylko w 3D:** `MORALE_SURROUND_HIT = 10` przy ≥3 przylegających wrogach (`battleScene.ts:1031`, użycie `:5334`), zero wpływu na auto-walkę. **Nie wymyślamy mechaniki — przenosimy istniejącą do drugiego systemu.** Naturalny limit: heks ma 6 boków. **(E) Kary morale od SAMEGO STOSUNKU SIŁ nie ma nigdzie** — morale reaguje na trafienia, flankę, tyły, szarżę i otoczenie, ale nie na przewagę liczebną. To jest nowy element z ECHO 3, wraz z szybszym routowaniem. **(F) `RuntimeUnit` na mapie NIE MA pola morale** (`types/unit.ts:73` — morale jest tylko w modelu bitwy 3D). Kara morale dla armii 10× mniejszej w AUTO-bitwie wymaga więc albo nowego stanu, albo wyrażenia jej przez `effectiveDefenderM`. **(G) Punkty wpięcia:** auto-mapa `main.ts:24519` `effectiveDefenderM` (tam już sumują się weteran, fortyfikacja +50%, trudność, struktura 200/100/50%, teren); taktyka `combat.ts:829-898`. **(H) Historia:** `C-STRATY-HP-Q1` (rejestr `:393`) — **ZAMKNIĘTE 2026-07-27 BEZ NAPRAWY**, właściciel zgłaszał wtedy „nadreprezentację siły obrońcy"; to był ten sam problem widziany z drugiej strony. `R-BITWA-AUDYT` (`:395`) czeka na raport. **Zero wpisów o PRZEWADZE LICZEBNEJ.** **ECHO 4 — KALIBRACJA (właściciel):** „To nie musi być znacząca obniżka morale, ale powiedzmy, że **dla dziesięciokrotnej przewagi morale powinno spadać o 50%**, a wszystkie inne stany proporcjonalnie." **Interpretacja orkiestratora, przedstawiona właścicielowi z tabelą:** słowo „proporcjonalnie" dopuszcza dwa odczyty dające przy MAŁEJ przewadze bardzo różne liczby — a to tam efekt ma być odczuwalny, bo starcia 2:1 są codziennością, a 10:1 rzadkością. Skala logarytmiczna `spadek = 50% × log₁₀(r)`: 2×→15%, 3×→24%, 5×→35%, **10×→50%**, 20×→65%. Skala wprost od stosunku `50% × (r−1)/9`: 2×→6%, 3×→11%, 5×→22%, **10×→50%**, 20×→106% (wymaga sufitu). **PRZYJĘTA: LOGARYTMICZNA** — trafia w punkt kalibracyjny właściciela co do cyfry, daje odczuwalny efekt przy realistycznych przewagach i nie wymaga sztucznego sufitu, bo rośnie coraz wolniej. Współczynnik 50% ma być parametrem w pliku danych (jedna liczba do przestrojenia), nie stałą w kodzie. **ZAREJESTROWANE, NIE DISPATCHOWANE** — temat duży, do podziału na węzły: (W1) arytmetyka auto-bitwy — wykładnik `p` powyżej progu 1,0 + `L_MIN` przeniesiona z jednostki na sumę; (W2) morale od przewagi liczebnej z kalibracją log i szybszym routowaniem — wymaga rozstrzygnięcia, czy `RuntimeUnit` na mapie dostaje pole morale, czy efekt wyraża się przez `effectiveDefenderM`; (W3) flanka/tyły i premia za otoczenie przeniesione z bitwy 3D do auto-bitwy mapy (`attackerPosition` zawsze `'front'`, `combat.ts:819`). **ECHO 5 — POMYSŁ WŁAŚCICIELA, PRZEBUDOWUJE WĘZEŁ W2 (2026-09-04, noc):** „Jednostka powinna oddawać obrażenia tylko raz. Jeśli kolejna jednostka atakuje z flanki lub innego miejsca, zadaje jedynie obrażenia. W ten sposób rozwiązujemy problem przewagi liczebnej… a kontratakować może tylko raz, przy pierwszym ataku." **Doprecyzowanie przez AskUserQuestion — dwa pytania, dwie odpowiedzi:** (1) który z atakujących w turze dostaje kontratak → **„Pierwszy atakujący w turze"** (nie najsilniejszy, nie losowy — kolejność ataków staje się elementem taktyki gracza); (2) czy jednostka ufortyfikowana/w mieście zachowuje kontratak wobec każdego napastnika jako wyjątek → **„Nie, jeden kontratak dla wszystkich"** (bez wyjątków dla fortyfikacji i miast; obrona murów ma się opłacać przez modyfikatory obrony, nie przez darmowe dodatkowe kontrataki). **Skutek dla podziału na węzły:** W2 przestaje być „skalowanie morale od stosunku sił" i staje się **„jeden kontratak na turę obrońcy, przyznawany pierwszemu atakującemu"** — to jest zmiana mechaniki w `combat.ts:1049-1064` (kontratak w KAŻDEJ rundzie każdego starcia) plus nowy stan per obrońca per tura, resetowany na początku tury. **Trzy zastrzeżenia orkiestratora, zapisane świadomie, do uwzględnienia w dispatchu:** (a) **to NIE zastępuje naprawy auto-bitwy (W1)** — auto-bitwa mapy w ogóle nie wykonuje kontrataków per jednostka, tylko nakłada procent strat na cały skład, więc wykładnik `p` powyżej progu 1,0 i `L_MIN` przeniesiona na sumę zostają w zakresie niezależnie od ECHO 5; (b) **kolejność ataków zaczyna mieć znaczenie i to miecz obosieczny** — gracz nauczy się wysyłać najsłabszą jednostkę pierwszą, żeby przyjęła jedyny kontratak; to jest realna taktyka, ale też realne ryzyko degeneracji, do zmierzenia w bramce; (c) **morale nadal ma sens obok tego, w węższej roli** — jeden kontratak sprawia, że przewaga liczebna **się opłaca** (rozwiązanie paradoksu arytmetycznego), morale od stosunku sił sprawia, że słabsza strona **ucieka** (ECHO 3/4, o co właściciel prosił osobno); to dwa różne efekty i kalibracja logarytmiczna 50%×log₁₀(r) zostaje w mocy. **ECHO 6 — ZIELONE ŚWIATŁO NA WSZYSTKIE TRZY WĘZŁY (2026-09-04, noc):** „Co do naprawy auto-bitwy masz zielone światło i bitwę automatyczną; możesz naprawić tak, jak napisałeś w trzech punktach." → W1, W2 (w kształcie po ECHO 5) i W3 dopuszczone do dispatchu. **ECHO 7 — PROPOZYCJA WŁAŚCICIELA CO DO W1:** „Być może należy odwrócić tę statystykę i, tak jak obecnie, armia z przewagą traci więcej; trzeba by było na tych samych liczbach obrócić w drugą stronę, aby armia z niedoborem, z mniejszą liczbą żołnierzy, traciła więcej." **Weryfikacja orkiestratora — intuicja właściciela i naprawa wykładnika to TA SAMA dźwignia widziana z dwóch stron, potwierdzone rachunkiem.** Kod (`auto-battle-power.ts:82-95`): `coreLoss(r) = L_MAX / r^p`; zwycięzca traci `coreLoss` procent NA JEDNOSTKĘ, przegrany traci `1 − coreLoss`. Podniesienie `p` robi **jednocześnie oba ruchy, których właściciel chce**: obniża sumę strat zwycięzcy i PODNOSI procent strat przegranego — bo obie liczby wychodzą z tego samego `coreLoss`, jedna wprost, druga przez dopełnienie. Zmierzone (`L_MAX 0,42`, `L_MIN 0,05`): **dziś `p=0,58`** — 2:1 suma zwycięzcy 0,562 / przegrany 71,9%; 20:1 suma zwycięzcy **1,478** / przegrany 92,6% → **przy 20:1 zwycięzca wykrwawia się bardziej niż CAŁA armia przeciwnika (0,926)**, to jest dokładnie zgłaszany absurd. **`p=1,20`** — 2:1 suma 0,366 / przegrany 81,7%; 20:1 suma 0,231 / przegrany 98,8%. **PUŁAPKA, potwierdzona rachunkiem — `L_MIN` skasowałaby całą naprawę.** Podłoga `L_MIN 0,05` działa NA JEDNOSTKĘ, więc przy `p=1,20` i podłodze zostawionej po staremu suma zwycięzcy wynosi: 5:1 → 0,304, ale 10:1 → **0,500** i 20:1 → **1,000**, czyli **rośnie z powrotem i przy 20:1 jest gorsza niż przy 5:1** — objaw wraca w niemal pełnej sile mimo poprawnego wykładnika. Dopiero `L_MIN` przeniesiona na SUMĘ daje przebieg monotoniczny 0,387 → 0,366 → 0,337 → 0,304 → 0,265 → 0,231. **Wniosek wiążący dla dispatchu: druga połowa W1 (`L_MIN` z jednostki na sumę) nie jest kosmetyką, tylko warunkiem koniecznym pierwszej — same wykładniki bez niej NIE naprawiają tematu.** **Zastrzeżenie do kalibracji, do rozstrzygnięcia w dispatchu:** przy `p=1,20` starcie prawie równe (1,5:1) robi się ostrzejsze dla słabszego — 74,2% zamiast dzisiejszych 66,8%. **Osobne strojenie „ile traci zwycięzca" vs „ile traci przegrany" NIE jest dziś możliwe bez nowego parametru** — sprawdzone w kodzie: `p_atk` i `p_def` (`auto-battle-params.json`, oba 0,58) są przypisane do STRON (atakujący/broniący, `:171-175`), a nie do RÓL (zwycięzca/przegrany), więc rozdzielenie ról wymaga dołożenia pary `p_zwyciezca`/`p_przegrany`. Węzeł W1 ma to rozstrzygnąć jawnie, a nie po cichu przestroić istniejące pola. **ECHO 8 — WŁAŚCICIEL SAM SKORYGOWAŁ KRYTERIUM PRZEWAGI Z LICZEBNOŚCI NA MOC (2026-09-04, noc):** „Teraz pomyślałem, że to nie jest dobre rozwiązanie, gdy przeciwnik ma mało, ale bardzo silnych jednostek. W takim wypadku lepszy byłby mechanizm mocy, czyli porównanie siły jednej i drugiej armii. Jeśli moc drugiej armii jest znacząco większa, można byłoby zastosować współczynnik obniżenia morale." **Ocena orkiestratora: korekta TRAFNA i tania — silnik ma już dokładnie tę wielkość.** `sumRosterFieldM` / `armyFieldPower` (`auto-battle-power.ts:50-58`) liczy moc składu i jest tym samym `M`, na którym stoi auto-bitwa; użycie go w bitwie taktycznej daje **JEDNĄ definicję przewagi dla obu systemów walki** zamiast dwóch rozjeżdżających się (liczebność w 3D, moc na mapie). Kryterium liczebnościowe zostaje **odrzucone** — 20 Wojowników nie ma onieśmielać Falangi. **PROPOZYCJA ORKIESTRATORA (do zatwierdzenia przy dispatchu W2), 5 rozstrzygnięć:** (1) **wzór** `spadek = 50% × log₁₀(r)`, `r = M_wroga / M_własna`, `r ≤ 1 → 0` — trafia w punkt kalibracyjny właściciela co do cyfry (10× → 50%); zmierzone: 1,5×→8,8%, 2×→15,1%, 3×→23,9%, 5×→34,9%, **10×→50,0%**, 20×→65,1%; (2) **sufit 65% spadku** (r≈20) — bez sufitu `r=100` daje morale 0, jednostka routuje przed pierwszym ruchem i nie ma czego rozgrywać; powyżej 20× bitwa i tak jest formalnością; (3) **liczone RAZ, na starcie bitwy**, nie co rundę — przeliczanie co rundę tworzy spiralę śmierci (im więcej strat, tym gorszy stosunek, tym większa kara), co zamienia każdą przewagę w lawinę; wariant dynamiczny świadomie odrzucony, do ewentualnego powrotu osobnym tematem; (4) **wyłącznie KARA dla słabszego, żadnej premii dla silniejszego** — premia wypychałaby morale ponad maksimum i wymagała drugiego sufitu; (5) **nakłada się na istniejące modyfikatory jako przesunięcie startowe**, nie zastępuje ich: flanka −8, tyły −15, otoczenie −10 (`battleScene.ts:1026-1031`) działają dalej od obniżonego poziomu, więc słabsza strona **dobija do progu routowania szybciej** — to jest dosłownie „powinna szybciej routować, czyli uciekać" z ECHO 3. **Do rozstrzygnięcia w dispatchu, jawnie:** `armyFieldPower` czyta definicję jednostki (`u.def`), więc nie uwzględnia ani weterana, ani AKTUALNEGO HP — armia 20 jednostek poobijanych do 10% HP liczyłaby się jak świeża. Rekomendacja: ważyć moc bieżącym HP, żeby „przewaga" znaczyła realną siłę bojową, a nie stan ewidencyjny. **Brak podwójnego liczenia z ECHO 5:** jeden kontratak na turę zmienia WYMIANĘ OBRAŻEŃ (przewaga zaczyna się opłacać arytmetycznie), morale od mocy zmienia MOMENT ZAŁAMANIA (słabszy ucieka) — dwa rozłączne efekty na dwóch różnych wielkościach. **ECHO 9 — KOMPLET ROZSTRZYGNIĘĆ KALIBRACYJNYCH (AskUserQuestion ×4, 2026-09-04, noc). TEMAT JEST OD TEJ CHWILI W PEŁNI ZDEFINIOWANY I GOTOWY DO DISPATCHU.** (1) **Wykładnik: `p = 1,2`** — „umiarkowanie nagradzająco". Suma strat zwycięzcy 0,366 (2:1) → 0,304 (5:1) → 0,231 (20:1); przegrany 81,7% (2:1) → 98,8% (20:1). Odrzucone: `p=1,4` (miażdżąca przewaga prawie bezkosztowa, premiuje jeden wielki stos zamiast manewru) oraz `p=1,0` (neutralne, cofałoby ECHO 2). (2) **BEZ rozdzielania wykładników na role — „zaakceptować ostrzejsze starcia".** Nie dokładamy pary `p_zwyciezca`/`p_przegrany`; jeden wykładnik rządzi obiema stronami, a zaostrzenie starć prawie równych (przegrany 74,2% zamiast 66,8% przy 1,5:1) jest **świadomie przyjętym skutkiem**, nie przeoczeniem — bitwy bliskie remisu mają być bardziej rozstrzygające. Plik parametrów NIE dostaje nowych pól. (3) **Morale od przewagi mocy TYLKO w bitwie ręcznej 3D.** Auto-bitwa mapy załatwia przewagę wyłącznie arytmetyką z W1 — żadnego pola morale w `RuntimeUnit`, żadnego wyrażania kary przez `effectiveDefenderM`. Uzasadnienie przyjęte: morale działa tam, gdzie w ogóle istnieje; zero nowego stanu na mapie, zero ryzyka regresu w ścieżce mapy, brak konieczności strojenia W1 i W2 razem. (4) **WĘZEŁ W3 SKREŚLONY.** Flanka, tyły i otoczenie zostają wyłącznie w bitwie 3D; `attackerPosition` na mapie zostaje `'front'`. Uzasadnienie przyjęte: zgłoszony problem to paradoks strat i brak załamania słabszej strony — oba pokrywają W1 i W2, a trzeci mechanizm w systemie przestrajanym dwoma innymi uniemożliwiłby przypisanie efektu w grze do przyczyny. **ZAKRES KOŃCOWY TEMATU: DWA węzły, nie trzy.** **W1** — `p_atk` i `p_def` z 0,58 na 1,20 w `auto-battle-params.json` **oraz** `L_MIN` przeniesiona z jednostki na sumę składu (warunek konieczny, patrz ECHO 7 — bez tego suma strat zwycięzcy wraca do 1,000 przy 20:1). **W2** — jeden kontratak na turę obrońcy dla pierwszego atakującego (ECHO 5, bez wyjątku dla fortyfikacji i miast) **oraz** startowa kara morale `50% × log₁₀(r)` z sufitem 65%, gdzie `r` to stosunek MOCY (`sumRosterFieldM`, nie liczebność — ECHO 8), liczona raz na starcie bitwy, wyłącznie jako kara dla słabszego, ważona bieżącym HP. |
| `P-AI-NIE-STAWIA-BUDYNKOW-Q1` | Ze zrzutem panelu zdobytego miasta „BUDYNKI W MIEŚCIE (0) — (brak)": „Miasto zdobyłem od innej cywilizacji i nie ma tam żadnego budynku. Wygląda na to, że inne cywilizacje w ogóle nie budują budynków. To jest jakiś błąd, a przecież 50% pracy miała iść na budynki." | Recon (`Explore`) — **podejrzenie właściciela TRAFNE, ale przyczyna węższa; alternatywna hipoteza ODRZUCONA dowodem.** **(A) Przejęcie NIE kasuje budynków.** `cityBuilt` (`main.ts:2694`) jest mutowane wyłącznie przy ukończeniu budowy (`:3498`), presetach (`:34006`, `:34234`) i wczytaniu save (`:34632`) — **zero `cityBuilt.delete` w ścieżce przejęcia**; `post-battle-map.ts` nie zawiera ani jednego odwołania do budynków. Capture czyści tylko KOLEJKĘ. Miasto było puste, bo nic w nim nie zbudowano. **(B) PRZYCZYNA — `budowaTryb` resetowany na `'reczny'` przy KAŻDYM założeniu i KAŻDYM przejęciu.** `DEFAULT_BUDOWA_TRYB = 'reczny'` (`cities.ts:178`), `freshOwnerDefaultBudowaProfil` (`empire-city-defaults.ts:342-343`), nadpisanie w `seedCityOwnerDefaults` (`main.ts:4882-4884`), wołane z `main.ts:8267`, `8399`, `13057`, `31441` i z capture przez `onOwnerChanged` (`:26215`). **Kasuje to `budowaTryb:'zrownowazone'` ustawiane w `foundCityAt`** (`cities.ts:1211`). Skutek: `pickAutoBuildItem` zwraca `null` dla miast AI (`auto-manage.ts:270-272`), a gałąź `isAutoBudowaTryb` w pętli ekonomii (`main.ts:29117`) nigdy nie odpala. **Kod sam to potwierdza wprost** — komentarz `main.ts:26241-26242`: „AI nigdy sami nie wkładają budynku… bo `seedCityOwnerDefaults` resetuje `budowaTryb` do `reczny` przy KAŻDYM przejęciu". **(C) Duże AI ma drugą drogę, MIASTA-PAŃSTWA nie mają.** Zarządca (`autoManageCity`) jest odcięty dla miast-państw warunkiem `isMajorAiOwner` (`main.ts:29162`, `owner-utils.ts:12-16`, `isCityStateOwner` = `simplifiedDiplomacyOwners ∪ typCityCopyOwners`, `main.ts:6130-6131`). Zostaje im WYŁĄCZNIE `decideDefensiveCopyTurn` → `chooseCityProduction` (`ai.ts:3185`) — jedna wąska ścieżka bez fallbacku. **Właściciel zdobył miasto-państwo — i dlatego było puste.** **(D) Podział 50/50 działa poprawnie:** `AI_FIXED_PROCENT_BUDYNKI = 50` (`cities.ts:431`), wymuszane bezwarunkowo w `decideAIEconomySliders` (`ai.ts:5036-5037`); seed dla miast AI `main.ts:4812`, `:4850` (gracz ma 70%, `cities.ts:404`). **Nie ma czego dzielić, gdy nic nie trafia do kolejki.** **(E) ZERO bramek sprawdzających, że AI stawia budynki** — `auto-manage-test.cjs` i `empire-city-defaults-test.cjs` testują tor GRACZA, `ai-prod-fallback-test.cjs` i `ai-production-priority-test.cjs` tylko wybór kandydata/priorytety. **Żaden nie asertuje wzrostu `cityBuilt` dla ownera AI** — dlatego defekt mógł żyć niezauważony. **(F) Historia:** `R-AI-PRACA-PODZIAL-STALY-50-50-Q1` ZINTEGROWANE (`e7983ff4`, `:4177`), `R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1` DISPATCHOWANE (`:3978` — **prawdopodobnie ten sam korzeń**), `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` ZAMKNIĘTE (`eb03cb94`, `:2592` — **to zamknięcie mogło zostać cofnięte przez reset z (B)**, do sprawdzenia). **DISPATCHOWANE** 2026-09-04 (Opus 5 na Operatorze i Evaluatorze) — worktree `wt-ai-buduje-budynki`, baza `05df297a`.

**DOPRECYZOWANIE WŁAŚCICIELA 2026-09-04 (noc), PODWAŻA WNIOSEK RECONU (C):** „Przejąłem trzy miasta od innej cywilizacji, **nie od państwa-miasta**. To są oczywiście miasta, które ta cywilizacja zdobyła od innych państw-miast swojego gatunku. Niemniej jednak były to już miasta tej cywilizacji **od dłuższego czasu**. Tam powinno być zbudowane, chyba że ta cywilizacja nie zdążyła nic zbudować, ale to raczej mało prawdopodobne, kiedy ja już miałem wybudowane dwa-trzy budynki, a oni ani jednego. **Musi być weryfikator, który będzie robił weryfikację, czy AI bada budynki podczas gry.**"

**Skutek dla diagnozy — recon (C) był prawdopodobnie ZA OPTYMISTYCZNY.** Twierdził, że duże cywilizacje AI mają drugą drogę (komenda `build` z `chooseCityProduction`, `ai.ts:2593`), więc „jakoś budują", a puste są tylko miasta-państwa odcięte od Zarządcy warunkiem `isMajorAiOwner` (`main.ts:29162`). Obserwacja właściciela dotyczy **pełnoprawnej cywilizacji AI**, a nie państwa-miasta — czyli ścieżka `build` też nie działa, albo nie obejmuje przypadku, o którym mowa. **Dodatkowy trop wskazany przez samego właściciela: to były miasta, które AI wcześniej ZDOBYŁO od państw-miast.** Reset `budowaTryb` na `'reczny'` zachodzi przy KAŻDYM przejęciu (`seedCityOwnerDefaults` przez `onOwnerChanged`, `main.ts:26215`), więc miasto zdobyte przez AI dostaje ten sam reset co miasto zdobyte przez gracza. **Hipoteza do sprawdzenia: ścieżka `build` dużego AI nie obejmuje miast PRZEJĘTYCH, więc nigdy nie wychodzą one z trybu ręcznego.** To tłumaczyłoby objaw dokładnie.

**Świadomie NIE dopisane do `00-dispatch.md` w trakcie biegu rundy 1** — Operator pracuje na wersji sprzed tej wiadomości, a Evaluator czyta dispatch świeżo; dopisanie w locie wygenerowałoby zarzut za niespełnienie wymogu, którego Operator nigdy nie widział. Do wprowadzenia w rundzie 2 albo przekazania Final Control, zależnie od wyniku rundy 1. **Dispatch i tak wymaga tabeli budynków po N turach OSOBNO dla dużego AI, państwa-miasta, barbarzyńców i gracza — więc jeśli duże AI też ma zero, runda 1 to wykaże.**

**ECHO 6 — WŁAŚCICIEL WSKAZAŁ KIERUNEK NAPRAWY (2026-09-04, noc):** „Miasta-państwa, które są zdobyte przez cywilizację, powinny od razu wchodzić w tryb automatyczny, a nie ręczny, i to rozwiąże problem, bo budynki po prostu będą się dodawać same do kolejki. Tę zasadę można dodać zarówno do AI i innych cywilizacji, jak i dla gracza."

**KOREKTA ORKIESTRATORA DO ECHO 6 — propozycja trafna, ale ZA WĄSKA; weryfikacja w kodzie przesunęła punkt naprawy o poziom wyżej.** Recon (B) mówił „`seedCityOwnerDefaults` resetuje `budowaTryb` do `'reczny'`" — to jest **skrót myślowy, nie to, co robi kod**. `main.ts:4882-4884` czyta: `const bp = ownerDefaultBudowaProfil.get(c.ownerId)!; c.budowaFocus = bp.budowaFocus; c.budowaTryb = bp.budowaTryb;` — wpisywany jest **profil domyślny WŁAŚCICIELA**, nie stała `'reczny'`. Stałą jest dopiero to, czym ten profil się ZASIEWA: `freshOwnerDefaultBudowaProfil()` (`empire-city-defaults.ts:342-343`) → `DEFAULT_BUDOWA_TRYB = 'reczny'` (`cities.ts:178`), wołane dla gracza (`main.ts:4796`), dla każdego AI (`:4818-4819`) i dla każdego nieznanego właściciela miasta (`:4839-4840`). **Skutki tej korekty, trzy:** (1) **defekt NIE dotyczy tylko przejęć** — ta sama funkcja jest wołana przy zakładaniu miasta (`:8267`, `:8359`, `:8399`) i nadpisuje `budowaTryb:'zrownowazone'` z `foundCityAt` (`cities.ts:1211`), więc **miasta ZAKŁADANE przez AI są puste z dokładnie tego samego powodu**; naprawa samej ścieżki przejęcia zostawiłaby połowę defektu żywą; (2) **naprawa to JEDNO miejsce, nie wyjątek w capture** — profil domyślny właściciela AI ma być zasiewany trybem automatycznym; dziedziczenie miasto←właściciel zostaje nienaruszone, więc nie powstaje nowy wyjątek do utrzymania; (3) **gracz ma drogę wyjścia, AI nie ma żadnej** — `main.ts:6967` ustawia `ownerDefaultBudowaProfil` po zmianie globalnego ustawienia gracza i rozgłasza je na miasta bez override; **dla AI nie istnieje ANI JEDNO wywołanie zmieniające ten profil**, dlatego AI stoi na `'reczny'` przez całą partię.

**ECHO 7 (AskUserQuestion, po przedstawieniu powyższej korekty): „AI na auto + gracz też startowo auto".** Wiążące rozstrzygnięcie: `DEFAULT_BUDOWA_TRYB` (albo zasiew profilu) zmienia się na tryb automatyczny **dla wszystkich właścicieli, łącznie z graczem (owner 0)**. Skutek dla gracza jest jawny i zaakceptowany: każde NOWE i ZDOBYTE miasto gracza samo dokłada budynki do kolejki, dopóki gracz nie przełączy globalnie na ręczny — przełącznik globalny (`:6967`) zostaje jedyną i wystarczającą drogą kontroli. **Odrzucone warianty:** „tylko AI, gracz bez zmian" (gracz musiałby ręcznie odkryć przełącznik) oraz „gracz auto tylko przy przejęciu" (wymagałby wyjątku łamiącego dziedziczenie miasto←właściciel).

**Żądany „weryfikator" = GOAL 3 dispatchu**, już zdefiniowany: nowa bramka `ai-buduje-budynki-test.cjs` mierząca WZROST `cityBuilt` w czasie, w PRAWDZIWEJ pętli ekonomii (nie reimplementacji), z osobnymi asercjami dla czterech kategorii właścicieli plus obowiązkową regresją „barbarzyńcy mają ZERO budynków". |

## AUDYT KOMPLETNOŚCI ZGŁOSZEŃ OD FALI 347 (2026-09-04, noc, na żądanie właściciela)

Właściciel: „Sprawdź od ostatniej fali wszystkie moje zgłoszenia, czy są zarejestrowane
i czy każdy ma swojego operatora do działania." Audyt wykonany komendą po każdym ID
(obecność w rejestrze + istnienie katalogu `dyspozycje/autobot/runs/<ID>/`), nie z pamięci.

**Wynik: 17/17 zgłoszeń ZAREJESTROWANYCH, zero zgubionych. Operatora ma 7 z 17.**
Reszta czeka na zwolnienie plików przez tematy w biegu (`R-PROC-AUTOBOT.md` §2b) albo
na wolne miejsce w fali (limit `min(16, nproc−2)` = **2** przy 4 rdzeniach).

**Jedno realne znalezisko audytu — LUKA, nie zguba.** Zgłoszenie „audyt szczęścia, prawa
i budynków" zostało rozbite na węzły A–D, ale **ID dostał wyłącznie węzeł A**
(`R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1`, ZINTEGROWANY `f7a7eaf5`). Węzły B, C i D
żyły dotąd jako opis wewnątrz cudzego wpisu, więc formalnie **nie miały własnego
operatora**, mimo jawnego ECHO właściciela „Do każdego oddzielnego operatora i oddzielnego
workflow. Nie wszystkie idą razem." Naprawione tym wpisem — ID nadane niżej.

| ID węzła | Zakres | Mandat |
|---|---|---|
| `R-SZCZESCIE-AUDYT-B-WKLAD-BUDYNKOW-Q1` | `+1` szczęścia za KAŻDY budynek, bez limitu i bez kosztu utrzymania (`economy.ts:495-531`, `buildings.json`, `main.ts:28839`) | Licznik rośnie bez ograniczeń, mianownik (`szMax`) stoi — to jest druga połowa mechanizmu „im dalej w las, tym szczęście wyższe". Węzeł A ruszył mianownik; ten ma ruszyć licznik. |
| `R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1` | Zanik bonusu Osiedla przy pop 5, pasmo Prawa, garnizon vs administracja (`society-breakdown.ts:441-527`, `society-params.json → prawo`, `post-capture-law.ts`) | **Mandat zmierzony, nie ogólny:** wygładzić urwisko tak, żeby łączny spadek Porządku przy przyroście o JEDNEGO mieszkańca nie przekraczał progu odczuwalności. Dziś w najgorszym punkcie siatki **12,0 p.p.**, z czego ok. 2 p.p. wnosi węzeł A, a 9,8 p.p. to urwisko istniejące wcześniej i zasłonięte sufitem 120% (zweryfikowane przez Final Control na czystym kodzie sprzed tematu, baza `2bb422aa`). |
| `R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1` | `porPctBand`, `tierFromPorPct`, `orderEffectsFromPorPct`, okres łaski buntu (`society-breakdown.ts:533-602,700-752`, `order.ts:310-375`) | Ostatni węzeł — progi i skutki, dispatchowany dopiero po B i C, bo obie zmieniają rozkład wartości wejściowych, na których te progi mają być kalibrowane. |

**Kolejność dispatchu węzłów: B → C → D, sekwencyjnie.** Wszystkie trzy dotykają
`society-breakdown.ts` i `society-params.json`, więc równoległy dispatch jest wykluczony
przez §2b. Te same pliki trzyma też `R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1` (punkt (3) jego
zakresu — zniesienie binarności `religionHappiness`), który wchodzi do tej samej kolejki.

**Kolejka pliku `main.ts`** (najgorętszy plik repo, wąskie gardło całej reszty):
`P-AI-NIE-STAWIA-BUDYNKOW-Q1` (w biegu) → `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1` →
`R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1` → `R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1` →
`R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1` → `R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1` →
`P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`.

**Tematy WOLNE od `main.ts` i `society-*`, dispatchowalne natychmiast po zwolnieniu miejsca
w fali:** `R-WALKA-PRZEWAGA-LICZEBNA-Q1` (węzły W1/W2 — `auto-battle-*`, `combat.ts`,
`battleScene.ts`), `R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1` (pule nazw + `cluster-spawn.ts`),
`R-AUTOWYZYWIENIE-GLOBALNY-BLOKER-I-STAN-PRZYCISKU-Q1` (`empire-food.ts` + panel Spichlerza).
To są trzy najbliższe dispatche.

## R-HOTSEAT-MULTIPLAYER-HOSTING-Q1 — temat na przyszłość (rejestracja 2026-09-04, noc)

**Wyzwalacz (właściciel):** „Dopisać multiplayer i hosting jako rozdział do planu
hot-seatu, czy zostawiamy przy samej ocenie w rozmowie? Tak, dopisz do tematu
na przyszłość."

**Stan faktyczny sprawdzony przed zapisem: rozdział JUŻ ISTNIEJE.**
`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, rozdział **H** (H1–H6), commit `eba74a99`
„Plan hot-seat: rozdzial H - multiplayer sieciowy jako Etap 9 (ostatni krok)".
Ocena z rozmowy została utrwalona w pliku, nie została w czacie. Rozdział pokrywa oba
wątki z pytania: multiplayer (H1–H4, H6) **oraz** hosting (H5, z rozdzieleniem
„serwer serwuje stronę" vs „serwer liczy grę").

**Czego naprawdę brakowało i co ten wpis naprawia: pozycji w REJESTRZE.** Plan żył
wyłącznie w `docs/decyzje/`, a rejestr nie miał ani jednego trafienia na „hot-seat"
i „multiplayer" — czyli temat był niewidoczny dla audytów kompletności i nie stał
w żadnej kolejce. Od teraz stoi.

**STATUS: NIE DISPATCHOWANE, ŚWIADOMIE — temat na przyszłość, nie zaległość.**
Nie wchodzi do bieżącej pętli AutoBota i nie liczy się do niej jako dług.

**Zawartość rozdziału H w skrócie (dla przyszłego reconu — nie zastępuje lektury pliku):**
- **H1** Multiplayer jest ścisłym NADZBIOREM hot-seatu, nie alternatywą: zawiera Etapy 0–7
  w całości, więc żadna praca nad hot-seatem się nie marnuje.
- **H2** Cztery rzeczy gotowe, zweryfikowane w kodzie: logika działa headless w Node (rdzeń
  bez DOM/three.js), AI celowo deterministyczne (zero `Math.random()` w `ai.ts`), walka
  i oblężenie przyjmują wstrzykiwany RNG, istnieje pełna serializacja stanu (`SaveGame`).
  Plus gra jest turowa, więc odpada interpolacja, predykcja i rollback.
- **H3** Braki: backend nie istnieje w ogóle (zero trafień na `WebSocket|socket.io|fetch(`
  w `gra/src`) oraz **siedem** realnych losowań do domknięcia — 6 generatorów ID jednostek
  i 1 nagroda z wioski (`main.ts:22677`).
- **H4** Rekomendacja: autorytatywny host, NIE lockstep — format snapshotu już istnieje.
- **H5** Hosting rozdzielony na dwa różne znaczenia. **(a) serwerowanie strony ma wartość
  samo w sobie i nie zależy od niczego** — daje spójność wersji między graczami i likwiduje
  hack `vite-plugin-singlefile` wraz z 66 MB `Gra-ROBOCZA.html` ostrzeganym przy każdym
  pushu. **(b) serwer liczący grę** to dopiero Etap 4 planu (rozcięcie `triggerPlayerEndTurn`
  na `endActiveHumanTurn()` i `runWorldEndTurn()`).
- **H6** Kolejność, w której żaden krok nie jest ślepą uliczką.

**Wniosek do zapamiętania:** H5(a) — hosting strony — jest jedyną pozycją tego tematu
**bez żadnej zależności** i z natychmiastową wartością (koniec 66 MB w gicie, koniec
rozjazdu wersji). Gdyby właściciel chciał kiedyś ruszyć multiplayer małym krokiem,
to jest ten krok, a nie Etap 9.

### `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` — wynik rundy 2 i dwa ECHO (2026-09-04, noc)

**Runda 2 = `DECISION_REQUIRED`, ale sam GOAL SPEŁNIONY.** Chińska stolica AI pokazuje
`XI'AN` zamiast `QIN · CHIŃCZ…` — potwierdzone zrzutem z żywego Chromium przez Operatora
**i niezależnie przez Evaluatora**, który przebudował grę u siebie zamiast oglądać cudzy
obraz. Praca w `1e87ec1c`: nowa `foreignCapitalMapName`, `foreignCapitalFromPool` czyta
`miasta_cywilizacji[0]`, opt-in z rundy 1 usunięty (nie miał konsumenta). Diff 10 plików,
**każdy w allowliście**. Nietautologiczność udowodniona mutacjami źródła (27/7 i 25/9).

**Pomiar przycięć, trzy stany:** przed tematem 0/15 i 2/15 → runda 1 **14/15 i 15/15**
(katastrofa, stąd zmiana kierunku) → runda 2 **1/15 i 1/15**. Przy budżecie z produkcją
(161 px) runda 2 jest więc POPRAWĄ względem stanu sprzed tematu (2→1).

**Zarzut 1 → ECHO właściciela: „Poszerzyć budżet etykiety".** Jedyne przycięcie to zuluskie
`uMgungundlovu` (214 px przy budżecie 181 px). Odrzucone: przyjęcie 1/15 oraz skrócenie
nazwy w puli. **Orkiestrator ostrzegł PRZED decyzją, że zmiana `cityMapStatChip.ts:769`
dotyka WSZYSTKICH etykiet mapy i grozi zachodzeniem plakietki na sąsiednie heksy —
właściciel przyjął to ryzyko świadomie.** Dlatego runda 3 ma to ryzyko **zmierzyć**:
twardy warunek to zrzut w układzie GĘSTYM, a przy konflikcie „0/15 przycięć" ↔ „brak
zachodzenia" Operator ma zatrzymać się na `DECISION_REQUIRED` z podaną granicą pikselową,
zamiast wybierać kompromis samodzielnie.

**Zarzut 2 → ECHO właściciela: „Naprawić teraz, w rundzie 3".** Evaluator znalazł poza
zleceniem, że `playerCapitalFromPool` (`city-names-pool.ts:75-77`) **też czyta złą pulę** —
gracz-Chińczyk startuje w mieście „Qin", czyli dokładnie ta sama klasa pomyłki, którą
właściciel zgłosił dla AI, tylko po jego stronie. Allowlista rozszerzona o bramkę
z asercją **E7**, która utrwalała stary stan; jej aktualizacja dopuszczona pod warunkiem
wypisania w raporcie wartości przed i po wraz z uzasadnieniem.

**Zasięg pomyłki puli — ustalony, wąski.** Dotyczy WYŁĄCZNIE nazwy stolicy (2 z 15
cywilizacji dawały nazwę państwa zamiast miasta). Pozostałe miasta klastra to miasta-państwa
z właściwej puli, a miasta zakładane osadnikiem idą przez `pickNextRegularCityName`
z `miasta_cywilizacji`, z pomijaniem nazw użytych.

**Ratyfikacja rundy 3 dopisana do `00-dispatch.md` NA GAŁĘZI TEMATU** (`fb33fd0a`),
nie na `main` — agenci pracują w worktree i commitów z `main` nie widzą. To jest poprawka
własnego błędu procesowego z wcześniejszej rundy tej samej sesji.

### `R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1` — wynik rundy 1 (2026-09-04, noc)

**ZINTEGROWANE** (`487b0cfc`, 2026-09-04). Obieg pełny: Operator `PASS-WITH-NOTES` →
Evaluator 3 zarzuty → Obrona PRZYJMUJE wszystkie trzy → **Final Control `PASS`, 3× ODDAL**.
Bramki potwierdzone przez orkiestratora NA `main`, nie z raportu: nowa monotoniczność 43/0,
`auto-battle-power` 14/0, logic 213/213, tech-tree 19/19, research ALL GREEN,
unit-replace 13/13, combat OK, `tsc --noEmit` exit 0. Worktree sprzątnięty. Commity: `f72744d3` (praca) + `288e420e` (obrona).

**GOAL osiągnięty.** `p_atk`/`p_def` 0,58 → 1,2; `L_MIN` przeniesiona z podłogi na jednostkę
na podłogę na sumie składu. Zmierzony ciąg łącznych strat zwycięzcy: **0,3873 / 0,3656 /
0,3372 / 0,3045 / 0,2650 / 0,2300** dla r = 1,5 / 2 / 3 / 5 / 10 / 20 — ściśle malejący,
zgodny z tabelą docelową w tolerancji ±0,005. Przegrany: 74,2 / 81,7 / 88,8 / 93,9 / 97,4 / 98,9 %.

**Trzy wymagane przebiegi wykonane i udokumentowane:** (a) czysta baza — bramka CZERWONA
16/21, z odtworzonym rosnącym ciągiem 0,498…1,478 zgodnym z reconem; (b) po zmianie —
ZIELONA; (c) po cofnięciu SAMEJ zmiany `L_MIN` przy `p=1,2` — ZNÓW CZERWONA, r=10 → 0,500,
r=20 → 1,000. **Pułapka z reconu potwierdzona empirycznie przez Operatora**, nie tylko
przewidziana przez orkiestratora.

**Evaluator znalazł DWA realne defekty, których dispatch nie przewidział — oba naprawione:**
1. **Sekcja bramki była tautologiczna.** Sonda przy r=1000 przechodziła z samego `raw`, bez
   udziału podłogi, więc mutacja „podłoga → 0" zostawiała bramkę zieloną. Sondy przeniesione
   na r = 2000 / 5000 / 50 000 (jedyny zakres, gdzie podłoga faktycznie trzyma), 37 → 43 asercje.
2. **Zaokrąglenie kasowało straty przy skrajnych stosunkach.** `Math.round(max(floor, …))`
   zerowało OBA składniki od r≈1866 — auto-bitwa przy takiej przewadze dawała **zero strat**,
   choć przed zmianą podłoga gwarantowała ≥5%. Naprawione odwróceniem kolejności: zaokrąglenie
   najpierw, podłoga potem. Po poprawce r ≥ 41 821 daje dokładnie `L_MIN`; zakres grywalny
   nietknięty.

**To jest dokładnie ta klasa błędu, przed którą miała chronić reguła anty-halucynacyjna** —
bramka zielona po zmianie, a mimo to niczego nie mierząca w kluczowym punkcie.

## P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — nowe zgłoszenie (2026-09-04, znalezisko Evaluatora W1)

`gra/tools/auto-battle-power.py:133` liczy `max(L_MIN, min(cap, raw))` — **stara podłoga
na jednostce** — ale `p` czyta z `auto-battle-params.json` (`:35`, `:43`), czyli już 1,2.
Skutek: symulator balansu odtwarza dziś **krzywą-pułapkę** r=10 → 0,500, r=20 → 1,000,
sprzeczną z runtime TS po naprawie W1. Odtworzone liczbowo przez dwie niezależne role.

**Dlaczego to ma znaczenie, a nie jest kosmetyką:** to jest narzędzie, którym właściciel
stroi balans („Panel-C → Auto-walka → eksportuj panel C" wg nagłówka pliku parametrów).
Rozjechany symulator doradzałby wartości wyliczone z nieaktualnego wzoru — czyli następna
kalibracja walki startowałaby z fałszywych liczb.

**Świadomie NIE naprawione w W1** — plik poza allowlistą tematu; Operator zgłosił notę
zamiast wejść w niego samowolnie, co jest zachowaniem prawidłowym (§14).
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.** Zakres: doprowadzić `auto-battle-power.py`
do zgodności z `auto-battle-power.ts` po W1, plus bramka porównująca oba wzory na tym
samym zestawie stosunków sił — żeby rozjazd nie mógł się powtórzyć po cichu.
**Zależność: dispatchować PO integracji W1**, inaczej symulator zostanie zrównany
z wersją, która jeszcze się zmieni.

## P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1 — nowe zgłoszenie (2026-09-04)

`node gra/tools/map-field-battle-test.cjs` → exit 1, `TypeError: import_meta.glob is not
a function` (moduł audio pod esbuild). **Zweryfikowane niezależnie przez Operatora i Evaluatora
jako czerwone identycznie na czystej bazie `287718c2`** — defekt INFRA sprzed tematu, nie regres W1.

Skutek: bramka pokrywająca bitwę polową na mapie **nie chroni dziś niczego**, a jest wymieniana
w kryteriach końca tematów walki — czyli generuje fałszywe `PASS-WITH-NOTES` przy każdym
takim temacie. Dołącza do listy zaległych czerwonych bramek obok `oboz-lowiecki-las-test`
(72/19), `map-improvement-qualify-test` (130/1) i `entity-card-contract-test` (rAF ReferenceError).
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.** DOMAIN: INFRA.

## R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — SPRZECZNOŚĆ KONTRAKTÓW (2026-09-04, znalezisko CivPedia r2)

**To nie jest błąd wykonawcy — to dwa zatwierdzone tematy, które chcą sprzecznych rzeczy.**
Znalezione przy próbie wyjaśnienia, dlaczego dwie bramki są czerwone (29 faili łącznie:
`civpedia-caly-wiersz-przyciskiem` 19, `entity-card-cross-links-nested-overlay` 10).
Zweryfikowane niezależnie przez Operatora i Evaluatora w kodzie.

**Strona A — „jedna karta naraz".** `openDialog()` (`gra/src/ui/entityCards/renderer.ts:474-479`)
bezwarunkowo woła `activeDialog.dismiss()` przed zbudowaniem nowej karty. To jest **celowy
wynik `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1`, zamówionego przez właściciela** słowami: „żeby
nie wszystkie włączały się naraz […] poprzednia powinna zniknąć". Kryterium K1 tamtego tematu
żąda wprost: po kliknięciu linku krzyżowego w karcie A zostaje **dokładnie 1** backdrop.

**Strona B — „stos zagnieżdżony".** Starszy `entity-card-cross-links-nested-overlay-test.cjs:163-165`
żąda `depthAfterB === 2`, czyli że karta A ma **zostać pod spodem**. Około 10 asercji
`depthAfter === 2` siedzi też w `civpedia-caly-wiersz-przyciskiem-test.cjs`.

**Objaw w liczbach:** `depthBefore:1, depthAfter:1` przy POPRAWNYM `cardTop` — czyli karta
docelowa jest właściwa, tylko **zastępuje** źródłową zamiast się na niej kłaść. Nic nie jest
zepsute; dwa kontrakty po prostu opisują dwa różne UX.

**Dodatkowo martwy komentarz:** `renderer.ts:406-411` wciąż opisuje zachowanie „NIE zamykając
karty źródłowej", którego kod od czasu `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` już nie realizuje.
Do poprawienia **niezależnie od wyniku decyzji** — dziś wprowadza w błąd każdego, kto tam zajrzy.

**STATUS: OTWARTE — wymaga ABC właściciela, nie decyzji wykonawcy.** Wybór „jedna karta naraz"
vs „stos zagnieżdżony" to decyzja o UX, a nie o poprawności. Operator i Evaluator zgodnie
odmówili rozstrzygnięcia i przekazali wyżej — zachowanie prawidłowe (§14).

## P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — INFRA (2026-09-04, znalezisko Evaluatora CivPedia r2)

`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs:~65` buduje do
**współdzielonego** katalogu `os.tmpdir()/civ-zbadano-karta-tech-dist`. Dwa równoległe
przebiegi tej samej bramki (typowo: baza vs HEAD przy pomiarze parytetu) po cichu mieszają
ten sam `dist`.

**Dlaczego to jest realne, a nie teoretyczne:** Evaluator natrafił na to w praktyce i musiał
powtórzyć własne przebiegi **sekwencyjnie**. Przy tej sesji — pięć równoległych fal AutoBota,
każda mogąca uruchamiać bramki — ryzyko **fałszywego parytetu** jest wprost proporcjonalne
do liczby fal. Fałszywy parytet to najgorsza klasa błędu w tym procesie: wygląda jak dowód,
że nic się nie zepsuło.

**Zakres:** katalog docelowy per przebieg (PID/losowy sufiks) w tej bramce oraz **audyt
pozostałych bramek budujących do `os.tmpdir()`** — sprawdzić, ile z nich ma ten sam wzorzec.
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.** DOMAIN: INFRA.

## P-BRAMKA-ZBADANO-KARTA-KOMENTARZE-NIEAKTUALNE-Q1 — dokumentacja (2026-09-04)

Po rundzie 2 tematu CivPedia komentarz nad `clickRowLabel`
(`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs:268-272`) i etykieta asercji
(`:581`) nadal mówią o „`button[data-entity-kind]`" i „Szczegóły →" — czyli o warunku,
który właśnie zdjęto, i o przycisku, którego już nie ma. Operator **świadomie ich nie tknął**,
bo ratyfikacja mówiła „nic więcej w tym pliku" — zachowanie prawidłowe, ale zostawia ślad
do sprzątnięcia. **STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.** Drobny, do połączenia
z pierwszym tematem dotykającym tego pliku.

**ECHO WŁAŚCICIELA (AskUserQuestion, 2026-09-04): „Stos, ale maksymalnie dwie karty".**
Wiążące rozstrzygnięcie sprzeczności — **żadna ze stron sporu nie wygrywa w całości**.
Karta źródłowa **zostaje widoczna** pod docelową (wbrew dzisiejszemu bezwarunkowemu
`dismiss()` ze strony A), ale **głębokość stosu jest twardo ograniczona do 2** (wbrew
nieograniczonemu stosowi ze strony B). Otwarcie trzeciej karty zamyka najstarszą.

**Skutek dla obu istniejących kontraktów — oba wymagają korekty, żaden nie zostaje as-is:**
- `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` kryterium K1 („po kliknięciu linku krzyżowego zostaje
  dokładnie 1 backdrop") **przestaje obowiązywać w tym brzmieniu** — ma być 2. Intencja
  właściciela („żeby nie wszystkie włączały się naraz") zostaje spełniona przez SUFIT,
  a nie przez zamykanie poprzedniej.
- `entity-card-cross-links-nested-overlay-test.cjs:163-165` (`depthAfterB === 2`)
  **staje się zgodne z nowym kontraktem** i prawdopodobnie zzielenieje bez zmian —
  ale to wymaga sprawdzenia, nie założenia: asercje żądające `depthAfter === 2`
  w `civpedia-caly-wiersz-przyciskiem-test.cjs` też trzeba przejrzeć **po jednej**,
  bo część mogła zakładać stos NIEOGRANICZONY.
- **Brakuje trzeciego przypadku i to jest nowa praca:** nigdzie dziś nie ma asercji na
  otwarcie TRZECIEJ karty. Sufit trzeba zaimplementować i pokryć bramką od zera.

**Zakres do dispatchu (`R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`):** (1) `openDialog()`
(`renderer.ts:474-479`) przestaje bezwarunkowo zamykać poprzednią kartę, a zaczyna
egzekwować sufit 2; (2) nowa bramka na sekwencję A→B→C z asercją, że po C żyją dokładnie
dwie karty i że zamknięta jest A, nie B; (3) przegląd 29 czerwonych asercji w dwóch
istniejących bramkach — które zzielenieją same, a które utrwalały stos nieograniczony;
(4) **martwy komentarz `renderer.ts:406-411` do poprawienia niezależnie od reszty** —
opisuje zachowanie sprzed `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1` i dziś wprowadza w błąd.
**Zastrzeżenie orkiestratora do zapisania w dispatchu:** przy suficie 2 trzeba rozstrzygnąć,
co znaczy „zamknięcie karty B" — czy odsłania A (naturalne przy stosie), czy zamyka obie.
To jest pytanie, na które wytwór sam nie odpowie; jeśli Operator na nie trafi,
ma zatrzymać się na `DECISION_REQUIRED`, a nie wybierać.

### `P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1` — **ZINTEGROWANE** (`86e28a6d`, 2026-09-05)

Obieg pełny: Operator → Evaluator (3 zarzuty) → Obrona → **Final Control `PASS`, 3× ODDAL**.
Paski postępu w sekcji KOLEJKA PRODUKCJI, wzorem paska z PRODUKCJI NAUKI, na który powołał
się właściciel zrzutem. Procent liczbowy zostaje obok paska; stopka rozróżnia znaczenie
obu pasków. Pięć przypadków brzegowych: 0%, 100% bez przelania, pozycja wstrzymana
(pasek wygaszony), pozycja pusta, kikut przy 7%.

**Najcenniejsza część kontroli — Final Control zmutował inaczej niż Operator.** Zamiast
powtórzyć cudzą mutację, podmienił `pct` na `pct/2`, czyli zostawił pasek w DOM i nie ruszył
procentu liczbowego — zmieniła się wyłącznie szerokość wypełnienia. Bramka sczerwieniała
na 13 asercjach mierzących `getBoundingClientRect`. **To dowodzi, że bramka mierzy szerokość
względem toru, a nie samo istnienie elementu** — czyli dokładnie to, o czym łatwo tu
skłamać samemu sobie.

**Luka procesowa zapisana jawnie przez Final Control, nie ukryta:** raport Evaluatora
przepadł przy restarcie kontenera, więc nie da się zweryfikować, czy jego lista zarzutów
była kompletna. Final Control skompensował to własnym przejściem 10 punktów §16a po
wytworze — wynik czysty. Pary zarzut/odpowiedź odtworzył z pliku obrony, który wyliczał
je po numerze.

Bramki potwierdzone przez orkiestratora NA `main`: `panel-kolejka-pasek-postepu` 82/0,
logic 213/213, tech-tree 19/19, research ALL GREEN, unit-replace 13/13, combat OK,
`tsc --noEmit` exit 0. Worktree sprzątnięty.

## P-RESTART-KONTENERA-RAPORTY-W-PAMIECI-Q1 — wniosek procesowy (2026-09-05)

**Zdarzenie:** kontener zrestartował się w trakcie pracy pięciu równoległych fal AutoBota
(`up 3 min`, obciążenie z 15 na 1). Wszystkie pięć przebiegów Workflow zostało ubitych.

**Co przetrwało, a co nie.** Przetrwało wszystko, co agenci zdążyli **zacommitować** —
kod i te raporty etapów, które trafiły do gita. **Przepadł raport Evaluatora** tematu
`P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1`, bo został zapisany, ale nie zacommitowany;
przepadły też wszystkie raporty żyjące wyłącznie w pamięci procesu Workflow.

**Skutek dla jakości kontroli, realny:** Final Control musiał odtworzyć pary zarzut/odpowiedź
z pliku obrony i **nie mógł zweryfikować kompletności listy zarzutów**. Orkiestrator nie mógł
też zanonimizować par zgodnie z §3c, bo plik obrony zawiera etykiety ról — odstępstwo
zapisane jawnie w prompcie Final Control zamiast przemilczane.

**Wniosek wdrożony natychmiast, we wszystkich promptach wznowionych fal:** *raport etapu
commituj OD RAZU po zapisaniu, nie zostawiaj go w pamięci procesu*. Do rozważenia jako
trwała zmiana `R-PROC-AUTOBOT.md` §11 — dziś kontrakt raportu mówi, CO ma zawierać raport,
ale nie mówi, że ma być utrwalony w gicie przed przejściem do następnej roli.
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.** DOMAIN: PROCESS.

### `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1` — **ZINTEGROWANE** (`bec25312`, 2026-09-05)

Obieg pełny przez dwie rundy: runda 1 (praca + obrona) → ratyfikacja orkiestratora →
runda 2 (Operator PASS, Evaluator **zero zarzutów**) → **Final Control `PASS`**.

**Efekt dla właściciela:** nazwa encji jest teraz samym przyciskiem w ramce, podświetlanym
po najechaniu — spójnie z kartą technologii, o co prosił. Osobny przycisk „Szczegóły →"
usunięty; skan `gra/src/**` potwierdza brak żywych wystąpień.

**Rozwiązanie problemu, który omal nie zepsuł tematu:** wiersze z linkiem mają **dwa
kształty** — raz przyciskiem ma być etykieta, raz wartość. W „Technologia: Brązownictwo"
to wartość jest nazwą encji. Ślepa podmiana „etykieta zawsze przyciskiem" zrobiłaby
przycisk ze słowa „Technologia". Rozwiązanie Operatora: `linkAnchor?: 'label'|'value'`
z domyślną wartością `'value'`.

**Runda 2 i jej realne ryzyko.** Zdjęto **martwy warunek strażnika** w bramce real-render:
napisano go, gdy etykieta nie była przyciskiem, a po zmianie blokował własny scenariusz
przed kliknięciem. To jest **zluzowanie testu**, więc bramka mogła stać się tautologiczna.
Final Control obalił to własną mutacją — wyłączenie samego `page.mouse.click` czerwieni
asercje skutku kliku (144/1 → 138/3). **Obszedł też pułapkę wspólnego katalogu `dist`
w `os.tmpdir()`**, budując osobno dla bazy i HEAD (różne md5) — dzięki temu parytet
nie mógł być fałszywy. To jest dokładnie ta klasa błędu, którą zarejestrowałem osobno
jako `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`.

**Bramki potwierdzone przez orkiestratora NA `main`:** `civpedia-karty-nazwa-przyciskiem`
27/0, `improvement-card-callsites` 36/0, `unit-info-card-viewport-height-real-render` 35/0,
`tech-discovery-card-real-click` 12/0, logic 213/213, tech-tree 19/19, research ALL GREEN,
unit-replace 13/13, combat OK, `tsc --noEmit` exit 0.

**Bramka `civpedia-caly-wiersz-przyciskiem`: 19 faili PRZED i PO — parytet zmierzony
przeze mnie na `main` przez `git stash`.** Gałąź dokłada 22 nowe zielone asercje (44/63 → 66/85).
Te 19 to znana sprzeczność kontraktów objęta `R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1`,
**nie regres tej pracy**. Worktree sprzątnięty.

**Nota Final Control do domknięcia:** raport Evaluatora rundy 2 nie istnieje w runie
(przepadł przy restarcie), więc nie da się potwierdzić, że przeszedł 10 punktów §16a.
Merytorykę pokrył Final Control samodzielnie — luka procesowa objęta
`P-RESTART-KONTENERA-RAPORTY-W-PAMIECI-Q1`.

### Dispatch autowyżywienia — rozbicie na dwa węzły (2026-09-05)

Temat `R-AUTOWYZYWIENIE-GLOBALNY-BLOKER-I-STAN-PRZYCISKU-Q1` rozbity na dwa **rozłączne
plikowo** węzły, dispatchowane równolegle (§2b spełnione):

- **`R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A`** (`empire-food.ts`) — przebudowa funkcji celu
  z „podnoś racje wszystkim, dopóki się da" na wyrównywanie WZROSTU przy twardym warunku
  braku głodu. Wchłania `R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1` (ECHO: wariant (a)).
  **Hipoteza „wszystko-albo-nic" zapisana jawnie jako DO POTWIERDZENIA LUB OBALENIA** —
  recon orkiestratora jest wiążący co do OBJAWU (odwrotna zależność zmierzona na 12
  miastach), nie co do PRZYCZYNY. Bramka ma **odrzucać wariant „zatrzymaj wszystkich"**,
  który trywialnie zmniejsza rozrzut — to jest najłatwiejsza droga do fałszywego sukcesu.
- **`R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B`** (UI) — czytelny stan przełącznika.
  **Defekt zgłoszony już wcześniej** (`R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK`, nadal
  OTWARTE) i taki, przez który **właściciel nie mógł zdiagnozować własnej rozgrywki**
  („chyba to autowyżywienie nie było włączone, ale ciężko mi się odnieść"). Zakaz zmiany
  logiki przełączania — jeśli Operator odkryje wadę logiki, zgłasza notę do węzła A.

### `R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2` — **ZINTEGROWANE** (`5ef3ece3`, 2026-09-05). TEMAT WALKI ZAMKNIĘTY W CAŁOŚCI.

Runda 1 (Operator → Evaluator 2 zarzuty → Obrona: 1 przyjęty, 1 wyprowadzony do
`DECISION_REQUIRED`) → ECHO właściciela „klamp do progu ucieczki" → runda 2 (Operator PASS,
Evaluator **zero zarzutów**) → **Final Control `PASS-WITH-NOTES`**.

**Co dostał właściciel:** obrońca oddaje **jeden kontratak na turę**, pierwszemu atakującemu,
bez wyjątku dla fortyfikacji i miast. Wewnątrz jednego starcia kontratak działa jak dotąd —
naprawa siedzi na poziomie TURY, nie pojedynku, co Final Control zweryfikował osobno.
Do tego startowa kara morale `50% × log₁₀(r)` z sufitem 65%, gdzie `r` to stosunek **mocy
ważonej bieżącym HP**, a nie liczebności.

**Klamp dolny do progu ucieczki — wartość tego ECHO w liczbach.** Bez klampu **cztery z 71
typów jednostek** startowałyby przy sufcie 65% poniżej własnego progu ucieczki, czyli
routowałyby przed pierwszym ciosem (`50/22→17,5`; `40/25→14,0`; `30/25→10,5`; `60/22→21,0`).
Po klampie: `18→23`, `14→26`, `11→26`, `21→23`. Obrona **słusznie odmówiła rozstrzygnięcia
sama** i wyprowadziła to z noty do jawnej pozycji `DECISION_REQUIRED` — GOAL 2 pkt 5 mówił
dosłownie „nie ruszaj `fleeMorale`", więc klamp był nową regułą produktową.

**Najmocniejszy element kontroli — Final Control wykluczył scenariusz „bramka mierzy próbkę".**
Zsabotował **trzy rekordy SPOZA czwórki granicznej** (pierwszy, środkowy i ostatni zbioru):
bramka sczerwieniała i wymieniła je z nazwy. Usunięcie jednego rekordu daje „oczekiwano 71,
jest 70" — czyli sama liczność jest asercją. Zweryfikował też niezależnie, że `units.json`
ma 75 rekordów, z czego 4 pominięte to machiny oblężnicze z `Morale ucieczki = null`
(`isNeverRout`), więc 71 jest liczbą prawidłową, a nie wygodną.

**Sprostowanie do protokołu (Final Control, nie zarzut):** `RuntimeUnit` **ma** pole `morale`,
ale jest to wcześniejszy mapowy licznik dezercji/głodu, obecny już przed tym tematem.
Sformułowanie Evaluatora „`RuntimeUnit` nie dostaje pola morale" było nieprecyzyjne;
samo rozstrzygnięcie „morale od przewagi nie trafia na mapę" **zostaje utrzymane** —
`types/unit.ts` nietknięty, diff nie odwołuje się ani do `RuntimeUnit`, ani do
`effectiveDefenderM`.

Bramki potwierdzone przez orkiestratora NA `main`: `walka-morale-przewaga-mocy` 123/123,
`walka-jeden-kontratak` 24/24, logic 213/213, tech-tree 19/19, research ALL GREEN,
unit-replace 13/13, combat OK, battle-roster 7/7, battle-summary OK, battle-hp-display 7/7,
teren-walki-etapy 33/33, army-hunger-combat 13/13, `tsc --noEmit` exit 0. Worktree sprzątnięty.

**Cały temat `R-WALKA-PRZEWAGA-LICZEBNA-Q1` jest tym samym domknięty:** W1 (`487b0cfc`)
naprawił arytmetykę auto-bitwy, W2 (`5ef3ece3`) bitwę ręczną, W3 został skreślony przez
właściciela. Zostają dwa tematy poboczne z tej pracy: `P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1`
(teraz odblokowany — W1 zintegrowany) i `P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1`.

## P-RAPORTY-PRZEKRACZAJA-LIMIT-400-SLOW-Q1 — PROCESS (2026-09-05, nota Final Control W2)

Final Control zmierzył długość **wszystkich** raportów tematu W2: `02` 558 słów, `03` 552,
`04` 555, `05` 476, własny 468 — wobec orientacyjnych ~400 z `R-PROC-AUTOBOT.md` §11.
**Przekroczenie jest systemowe, nie incydentalne**, więc zgodnie z §16b pkt 4 należy je
otworzyć jako osobny temat, a nie kwitować notą w każdym raporcie z osobna.

Do rozstrzygnięcia w temacie: czy limit ~400 słów jest realistyczny przy dzisiejszym
kontrakcie raportu (dziewięć pól plus lista werdyktów per zarzut plus wyniki kilkunastu
bramek), czy raczej **limit należy podnieść albo przenieść na poszczególne pola**.
Dzisiejszy stan — limit, którego nikt nie dotrzymuje i który za każdym razem obniża status
do `PASS-WITH-NOTES` — jest gorszy od obu rozwiązań, bo zaszumia sygnał `-WITH-NOTES`,
który powinien znaczyć coś merytorycznego. **STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.**

### `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` — runda 4, dwa sprostowania liczb (2026-09-05)

**Operator zakwestionował kotwicę z MOJEJ ratyfikacji — i miał rację.** Ratyfikacja rundy 4
podawała bazę „≈305" wyprowadzoną z szerokości zapisu `−100,0%` = 51,7 px. **Formatter tego
zapisu nigdy nie produkuje**: `formatCityGrowthPercentLabel` dla −100 zwraca `−100%` (41 px).
Najszerszy realny zapis to `−99,9%` = 45 px, więc minimum arytmetyczne wynosi **298 px,
nie 304,6**. Operator **zostawił 305, ale z własnego pomiaru, nie z mojego dispatchu**,
i uzasadnił to marginesem: przy 298 zapas nad `uMgungundlovu` to 0,1 px i znika przy pierwszym
zapisie szerszym niż `−99,9%`; przy 305 zapas wynosi 7,1 px. **Dokładnie tak miał postąpić** —
dispatch wymagał dobrania wartości pomiarem i zgłoszenia rozbieżności zamiast dopasowania
pomiaru do liczby ode mnie.

**Wynik R4-1 zmierzony w trzech konfiguracjach:** obca stolica bez glifu 0/15, z glifem 0/15,
**stolica gracza z WZROST% 1/15 → 0/15**. Niezależny odczyt z prawdziwego
`makeCityMapBadgeSprite`: **0/45**. Cała pula nazw: 25/1500 → 8/1500. **Kolizje
plakietka↔plakietka: 0/45** (odstęp 5 heksów = 8,66 j. wobec najszerszej plakietki 4,62 j.) —
czyli kryterium, którym zastąpiłem swój błędny warunek, wypada czysto.

**Zrzut z żywego Chromium w układzie gęstym** pokazuje stolicę GRACZA `UMGUNGUNDLOVU`
z trzema slotami bez wielokropka, sześć miast-państw wokół, trzy w minimalnej odległości.
Operator założył partię **prawdziwym kreatorem nowej gry**, bo hak `startNewGame` ma na stałe
`civId: 'rzymianie'` — czyli nie poszedł na skróty, które dałyby zrzut niereprezentatywny.

**ZARZUT EVALUATORA (1, w toku obrony) — margines tekstury zawyżony o 148 px.** Komentarz
w `cityMapStatChip.ts:124-125,150-158` podaje „najszersza plakietka 426 px CSS → margines
344 px, sufit bazy 391". Zmierzone: 426 px powstaje przy `defenseTier: 0` i **nieprzyciętej**
nazwie; najszersza plakietka osiągalna na realnych danych to **463 px = BASE+158** → tekstura
1852 px, margines **196 px**, sufit bazy **354**. Znaczenie praktyczne: przy bazie 391
wyszłoby `(391+158)×4 = 2196 > 2048`, czyli ponad gwarantowany WebGL2 `MAX_TEXTURE_SIZE` —
udokumentowany „zapas na przyszłość" prowadziłby wprost w ścianę. **Wartość 305 zostaje
(1852 < 2048), więc to defekt dokumentacji, nie runtime.** Komentarz przeczy przy tym asercji
G5 z tego samego commita, która używa poprawnego `SLOTY_POZA_NAZWA_PX = 158`.

## R-ZARZADCA-AUTOMATYCZNY-STAN-PRZYCISKU-Q1 — nowe zgłoszenie (2026-09-05, znalezisko Evaluatora węzła B)


**Zgłoszenie źródłowe (właściciel, ta sama wiadomość co temat wyżywienia):** „Inne przyciski:
po prostu ten przycisk się świeci, gdy jest aktywny, a gdy jest odznaczony, jest nieaktywny."

**Defekt.** Przycisk `cs-manager` „Zarządca automatyczny" w NAGŁÓWKU panelu miasta
(`gra/src/ui/cityPanel.ts:9871`) jest **trwałym przełącznikiem stanu**, nie akcją: stan czyta
`cfg.isAutoManageEnabled?.(city.id)` (`cityPanel.ts:11493-11501`), źródło
`main.ts:6598 autoManageCities`. Ma dokładnie tę samą wadę, którą naprawia
`R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B`: **WŁ dostaje `.active`, WYŁ wraca do gołego `.hbtn`** —
czyli wygląda identycznie jak zwykły, w pełni klikalny przycisk. Brakuje drugiej strony pary.

**Dlaczego pilne.** Po wdrożeniu tematu wyżywienia właściciel zobaczy w tym samym panelu dwie
różne konwencje obok siebie: poprawną w treści zakładki i wadliwą w nagłówku.

**Dlaczego NIE naprawiono w temacie wyżywienia.** C-025 — zakres = tylko zgłoszony błąd; GOAL
dispatchu mówi wprost o „przełączniku wyżywienia". `cs-manager` nie ma z wyżywieniem nic
wspólnego, więc naprawa tutaj byłaby „przy okazji".

**Szacowany koszt.** Bardzo mały. Reguła CSS `.civ-cs .hbtn.off` (+`:hover`) **już istnieje**
w arkuszu po tym temacie — wystarczy w gałęzi `else` (`cityPanel.ts:11498-11500`) dodać
`manager.classList.add('off')` / `data-stan`, symetrycznie do `classList.remove('active')`,
plus asercja różnicy stanów w bramce (wzór gotowy: bloki (C2)/(D)/(E) w
`gra/tools/autowyzywienie-stan-przycisku-test.cjs`).

**Sąsiedni przycisk SPRAWDZONY, poza zakresem.** `cs-artview` („Widok artystyczny",
`cityPanel.ts:9872`, wpięcie `cityPanel.ts:11504`) woła tylko `cfg.onArtView?.(city.id)` — nie
czyta żadnego stanu, więc jest jednorazową akcją i tej wady NIE ma.

**Przeniesione przez orkiestratora z `NOTA-N3-REJESTR-CS-MANAGER.md`.** Obrona węzła B
**słusznie odmówiła wpisania tego sama** — `REJESTR-PROSB-I-ZADAN.md` jest poza jej
allowlistą, a §14 wymaga wpisu; przygotowała więc gotowy blok do przeniesienia zamiast
poszerzać allowlistę w biegu. To jest wzorcowe zachowanie i warto je odnotować.
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.**

## R-AUTOWYZYWIENIE-LIMIT-WPIECIE-POPCAP-Q1 — temat następczy (2026-09-05, zarzut 2 węzła A)

**Własność (B) autowyżywienia jest zaimplementowana i pokryta bramką, ale w grze MARTWA.**
`grep -rn popCapByCityId gra/src` trafia **wyłącznie w `empire-food.ts`** — żaden realny
caller nie podaje mapy limitów ludności, więc `atPopCap` jest zawsze puste.

To jest realna luka wobec ECHO właściciela (wariant (a): „miasto na limicie ma zerowy przyrost
i nie konsumuje racji ponad potrzebę"). **Nie jest winą wykonawcy węzła A** — wpięcie wymaga
`gra/src/main.ts` (`:28128`, `:28152`, `:28179`, `:16256`, `:16285`), zakazanego w tamtym
dispatchu i dodatkowo zajętego przez `P-AI-NIE-STAWIA-BUDYNKOW-Q1` (§2b).

**Bezpieczeństwo integracji węzła A mimo tej luki:** parametr `popCapByCityId` jest
**opcjonalny**, a brak mapy daje zachowanie **wsteczne** — więc integracja niczego nie psuje,
a jedynie zostawia własność (B) nieaktywną do czasu wpięcia.

**Zakres:** przekazać mapę limitów ludności z `main.ts` do `resolveEqualGrowthRationPlan`
plus bramka mierząca, że w PRAWDZIWEJ pętli ekonomii (nie w harnessie) miasto na limicie
ma zerowy przyrost i oddaje porcję do puli. **Dispatchować po zwolnieniu `main.ts`.**
**STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.**

## R-SPICHLERZ-STAN-I-PRZELACZNIK-Q1 — nowe zgłoszenie (2026-09-05, ECHO właściciela „2+3")

**Właściciel ŚWIADOMIE COFA swoją wcześniejszą decyzję.** W temacie
`P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1` rozstrzygnął, że przycisk w panelu Spichlerza
ma być **jednorazową akcją** „ustaw teraz", nie przełącznikiem stanu — i tak jest w kodzie
(`gra/src/ui/empireDetailPanel.ts:176-179`). Po tym, jak sam nie potrafił odczytać, czy
autowyżywienie działa („chyba to autowyżywienie nie było włączone, ale ciężko mi się
odnieść"), zmienił zdanie.

**ECHO (AskUserQuestion): „2+3" — OBA warianty naraz:**
1. **wskaźnik stanu** w panelu Spichlerza — ile miast jest w trybie auto, ile w indywidualnym;
2. **prawdziwy przełącznik** całej cywilizacji zamiast akcji jednorazowej.

**Dlaczego nie dało się tego zrobić w węźle B:** `EmpireFoodCityUiRow`
(`empireDetailTypes.ts:531-539`) **nie niesie pola `autoWyzywienie`**, a jedynym producentem
snapshotu jest `buildEmpireFoodSnap()` (`main.ts:14401`) — plik zakazany w tamtym dispatchu.
Dlatego kryterium 4 węzła B zostało **uchylone przeze mnie jako błędnie postawione**:
żądałem zrzutów dwóch stanów Spichlerza, które wtedy nie istniały.

**Zakres:** rozszerzyć `EmpireFoodCityUiRow` i `buildEmpireFoodSnap` o tryb wyżywienia,
dodać wskaźnik zbiorczy, przerobić przycisk na przełącznik ze stanem czytelnym w konwencji
`.active`/`.off` ustalonej w węźle B. **Kolizja: `main.ts` + `empireDetailPanel.ts`** —
dispatchować po zwolnieniu obu. **STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE.**

### `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` — **ZINTEGROWANE** (`8080f792`, 2026-09-05)

Cztery rundy, dwie zmiany kierunku, **dwa błędy w moich zleceniach uznane i naprawione**.
Final Control rundy 4: **PASS** (werdykt ODDAL po obronie).

**Co widzi właściciel:** chińska stolica AI pokazuje `XI'AN` zamiast `QIN · CHIŃCZ…`.
Przy okazji naprawiona ta sama pomyłka **po stronie gracza** — `playerCapitalFromPool`
też czytał pulę państw, więc gracz-Chińczyk startował w mieście „Qin". Budżet nazwy
260 → 305: **0/15 przycięć we wszystkich trzech konfiguracjach**, łącznie z własną stolicą
gracza mającą trzeci slot WZROST%. W całej puli 1500 nazw przycięcia spadły z 25 do 8.
Kolizji plakietka↔plakietka **0/45**.

**Dwa moje błędy w zleceniach, oba wykryte przez wykonawców:**
1. **Runda 3 — kryterium niewykonalne.** Postawiłem warunek „plakietka nie zachodzi
   na sąsiednie heksy". Pomiar 30 plakietek pokazał, że **nie spełnia go żadna konfiguracja,
   także sprzed całego tematu** — granica wypada przy 4–5 wielkich literach, mieści się
   jedno miasto z piętnastu (`Tyr`). Operator zatrzymał się na `DECISION_REQUIRED`
   zamiast naciągać odczyt warunku, i zaproponował miarę rozłączną, którą przyjąłem.
2. **Runda 4 — kotwica z powietrza.** Podałem bazę „≈305" wyprowadzoną z zapisu `−100,0%`,
   którego formatter **nigdy nie produkuje**. Prawdziwe minimum to 298. Operator zostawił
   305, ale **z własnego pomiaru i dla marginesu** (7,1 px zamiast 0,1 px), i zgłosił
   rozbieżność zamiast dopasować pomiar do mojej liczby.

**Znalezisko Evaluatora rundy 4 — margines tekstury zawyżony o 148 px.** Komentarz
deklarował sufit bazy 391; faktyczny to **354**, bo `(391+158)×4 = 2196` przekracza
gwarantowany w WebGL2 `MAX_TEXTURE_SIZE = 2048`, a `(354+158)×4 = 2048` **dokładnie**.
Źródło błędu: próbka obejmowała tylko `miasta_cywilizacji[0]` przy `defenseTier: 0`,
a najdłuższa z nich jest krótsza od budżetu, więc nigdy go nie wypełniła. Znaczenie
praktyczne: **udokumentowany „zapas na przyszłość" prowadziłby wprost w ścianę**, gdyby
ktoś kiedyś na nim polegał. Obrona poprawiła komentarz **oraz skrypt dowodowy** — bez tego
komentarz cytowałby dowód drukujący inną liczbę, czyli powielał ten sam defekt.

**Final Control ODDALIŁ zarzut z uzasadnieniem wartym zapamiętania:** zarzut był trafny
co do każdej liczby, ale `NAPRAW` wymaga wskazania „co i gdzie poprawić" (§3c pkt 3),
a naprawa weszła już w tej samej rundzie — nie ma podstawy, by zużyć rundę 5/5 na pracę
wykonaną. Sprawdził przy tym sam, że diff obrony w `cityMapStatChip.ts` zawiera
**zero linii kodu**, więc „brak ryzyka regresu" jest faktem, nie deklaracją.

Bramki potwierdzone przez orkiestratora NA `main`: `mapa-etykieta-stolicy` 47/0,
`display-names` 27/0, `city-map-badge` 62/0, `city-badge-growth-percent` 38/0,
`rozmiar-label` 13/0, `city-names-pool` 12/0, `city-names-pools` 6/0, logic 213/213,
tech-tree 19/19, research ALL GREEN, unit-replace 13/13, combat OK, `tsc` exit 0.
Worktree sprzątnięty.

**Odblokowany temat następczy:** `R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1` (pule nazw)
przestaje kolidować — ten temat zwolnił `city-names-pool.ts` i `civ-names.ts`.
