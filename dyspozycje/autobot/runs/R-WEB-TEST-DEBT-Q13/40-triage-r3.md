# R-WEB-TEST-DEBT-Q13 r3 - kategoryzacja 156 pozycji sweepu (po scaleniu z main d42ec856, scalenie 63bee1a5)

Kategorie: P=PASS (exit 0), E=timeout 124 po ponowieniu 300 s, A=fixture/harness (ReferenceError/Build failed/brak ROBOCZA_HTML/--dist/--gra/SKIP), X=nierozstrzygniete (B stary pin lub D kandydat bledu gry; NIE ZMIERZONO w tej rundzie).

| kat | exit | pozycja | pierwsza linia FAIL / ostatnia linia |
|---|---|---|---|
| X/1/administracja-stolica-test.cjs/  [FAIL] Sąd w stolicy: ready, brak blokady lokalizacji |  |  |  |
| X/1/ai-city-render-batch-test.cjs/AssertionError [ERR_ASSERTION]: dirty city models flush after AI completion/errors before barbarian UI paint |  |  |  |
| A/1/ai-dlug-porzadki-q1-test.cjs/ReferenceError: orderMultMap is not defined |  |  |  |
| X/1/ai-balans-step3-test.cjs/FAIL: T1d: L3 prog_koszt_x bez zmian = 70 (got 80, want 70) |  |  |  |
| X/1/ai-general-war-campaign-test.cjs/FAIL: attack stage issues same-target movement for every stacked eligible unit (4/4) ordered general-1,infantry-2,infantry-3 |  |  |  |
| X/1/ai-home-war-sees-own-land-test.cjs/AssertionError [ERR_ASSERTION]: fog gate must be guarded by !targetOnOwnTerritory (and !targetNearLostCity, R-WEB-AI-DEFEND-RECAPTURE-ATTACK |  |  |  |
| X/1/ai-jednostki-tylko-zakup-test.cjs/  FAIL: C4: egzekutor build AI kieruje jednostke do bramki zakupu za Skarbiec |  |  |  |
| X/1/ai-army-composition-per-civ-test.cjs/  FAIL: D: rzymianie/Kamień: wręcz 0.0% vs 75% (±10) |  |  |  |
| X/1/ai-praca-split-parity-test.cjs/  FAIL: major AI wybiera farmę z absolutnego budżetu 50 (got 2, want 1) |  |  |  |
| X/1/ai-player-parity-fixes-test.cjs/FAIL: fixture: globalna i właścicielska trudność dają RÓŻNY koszt (stąd asymetria) |  |  |  |
| X/1/ai-purchase-maintenance-reserve-test.cjs/FAIL: main.ts: istnieje call site shouldAIPurchaseUnit (got false, want true) |  |  |  |
| X/1/ambush-deploy-wiring-test.cjs/FAIL atak gracza: deploy = generał LUB zasadzka (rozstawienie bez generała) |  |  |  |
| X/1/annex-citystate-spoils-test.cjs/  FAIL: 9h: definicja + 3 wywolania (propozycja gracz/AI, AI MP, AI major) -- wszystkie przez jedna funkcje (got 5, want 4) |  |  |  |
| X/1/army-leadership-test.cjs/AssertionError [ERR_ASSERTION]: aggregate defeat sends a surviving attacker commander into normal rout |  |  |  |
| X/1/army-split-enemy-city-block-test.cjs/  FAIL: main.ts ma 3 wywołania findSplitDestHexes (znaleziono 0) |  |  |  |
| X/1/ai-move-range-test.cjs/  [FAIL] G1 main.ts: executeAiCityMove dostaje truncatePath (przycinanie do ruchLeft przed zerowaniem) |  |  |  |
| X/1/ai4-popyt-obywatele-test.cjs/ Z2d: WYJATEK ZLOZOWY dziala — warzelnia soli powstaje na zlozu 12,7 mimo braku obywateli / Z2e: DEFAULT_ULEPS/  [FAIL] Z1h/infrastruktura |  |  |  |
| A/1/atak-adiacencja-wymagana-test.cjs/ReferenceError: marchStopNotified is not defined |  |  |  |
| X/1/auto-wyzywienie-live-recalc-test.cjs/FAIL: _maxSafeRationCache.clear() znaleziony w pobliżu wywołania advanceEmpireFood(...) (max 1500 znaków dalej) |  |  |  |
| A/1/autoimprove-live-hooks-test.cjs/  [FAIL] main.ts importuje installCivTestHooks |  |  |  |
| A/1/barbarian-cooperation-grace-maints-wiring-test.cjs/ReferenceError: ME is not defined |  |  |  |
| X/1/army-to-nearest-leader-test.cjs/FAIL: E4 main.ts: syncGeneralMarchTargets nadpisuje cel marszu najblizszym po trasie  |  |  |  |
| X/1/battle-manual-choice-contract-test.cjs/  throw new AssertionError(obj); |  |  |  |
| X/1/border-march-wygasanie-test.cjs/FAIL: znaleziono onEventDismiss |  |  |  |
| X/1/bramki-tmpdir-unikalnosc-test.cjs/  FAIL zadna bramka w tools/ nie pisze do STALEJ nazwy pod os.tmpdir() -- 169 trafien |  |  |  |
| X/1/budynki-koszt-pracy-50-test.cjs/FAIL: kuznia poziom 1: itemCost z kosztBudowy/przyrostKosztu |  |  |  |
| X/1/building-detail-card-entitycard-migration-test.cjs/FAIL: wiersz "Praca (jednorazowo)" obecny i kończy się na "pkt Pracy" — 20 pkt |  |  |  |
| X/1/barb-camp-destruction-test.cjs/  FAIL: static 4c: checkBarbCampDestructionAlongPath is called on the player move-completion path |  |  |  |
| A/1/city-panel-refresh-at-turn-start-live-test.cjs/if (!BUNDLE) throw new Error('Ustaw ROBOCZA_HTML=<sciezka do kopii Gra-ROBOCZA.html>'); |  |  |  |
| X/1/city-state-alliance-test.cjs/  FAIL: strong: wrog dist=2 <= threatRadius=2 -- posilek wyslany (maxPerTurn=2 -> oba guardy) (got 1, want 2) |  |  |  |
| X/1/citypanel-tech-tile-dead-effects-test.cjs/  FAIL [C] Oblężnictwo „Odblokowuje budynek” nadal zawiera Katapultę (Warsztat odblokowuje Katapultę) |  |  |  |
| X/1/civ-matrix-ai-diplomacy-wiring-test.cjs/FAIL: main AI path reads the matrix profile per owner and difficulty |  |  |  |
| X/1/city-clears-forest-test.cjs/  [FAIL] B2 finalizeCityFounding woła applyCityFoundingToHex (czyszczenie lasu) |  |  |  |
| X/1/civ-matrix-greece-test.cjs/FAIL: Roman gameplay aggression resolver uses ai_agresywnosc, not dip_agresja_archetyp (got 0.75, want 0.8) |  |  |  |
| X/1/commander-star-emblem-test.cjs/FAIL: renderer uwzględnia zarówno dowódcę w reprezentancie, jak i w reszcie stosu  |  |  |  |
| X/1/conquest-stability-test.cjs/  FAIL: unstable happiness penalty (got 0, want -2) |  |  |  |
| X/1/culture-religion-test.cjs/  FAIL: B9: missing mnoznikHandelPieniadz -> multiplier = 1 (fallback) (got 2.3, want ~1) |  |  |  |
| X/1/currency-test.cjs/FAIL: efekt1 scalony (normal x1.5): pieniadz = 10 (floor(15*0.70)) (got 11, want 10) |  |  |  |
| P/0/diplo-aggressor-unit-test.cjs/diplo-aggressor-unit-test: 73 PASS, 0 FAIL |  |  |  |
| P/0/diplo-war-trust-only-test.cjs/diplo-war-trust-only-test: 11 OK, 0 FAIL |  |  |  |
| X/1/drewno-gate-test.cjs/  [FAIL] Wojownik: nadal Surowiec=Drewno ×10 (bez zmian -- kontrola) -- ma={"Surowiec":"Drewno","ilosc":13} |  |  |  |
| X/1/dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs/FAIL: (0a) mutacja A faktycznie usunęła 29 dodanych pól pwBalance (7 accept + 22 reject) w 6 case'ach evaluateProposal — kontrola nieta |  |  |  |
| X/1/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs/FAIL: (0a) mutacja R2 faktycznie przywróciła formułę rundy 2 (bezwarunkowe wywołanie z relTotal wojennie ograniczonym dla obu ról) ORA |  |  |  |
| X/1/dyplo-karta-duplikat-komunikat-test.cjs/  FAIL: A1: negotiationTable.push(entry) obecne — trwała karta stołu negocjacji bez zmian |  |  |  |
| X/1/dyplo-pakt-ekspansja-granica-test.cjs/  FAIL: D1 stan ciągły: Zaufanie 50 → 35 po 5 turach (−2/turę, nie jednorazowo) |  |  |  |
| X/1/egypt-movement-precedence-test.cjs/AssertionError [ERR_ASSERTION]: other civilizations retain general and dedicated shallow-sea bonuses: 0.8130081300813008 != 0.67567567567567 |  |  |  |
| X/1/eliminacja-lup-kwoty-test.cjs/  FAIL: 4e: pełny raport z REALNEGO outcome silnika (1500 złota, 63 nauki, 2 techy, 420 Mocy, 90 puli pracy PRZEJĘTEJ od P-PODBOJ-ELIMINA |  |  |  |
| X/1/elimination-spectacle-test.cjs/  FAIL: tick rekordów tuż po turn++ |  |  |  |
| A/1/end-turn-hint-diplo-audience-test.cjs/FAIL: wykonanie (audiencja otwarta): oczekiwano „Zamknij okno audiencji dyplomatycznej, potem zakończ turę.”, jest „undefined” bł |  |  |  |
| X/1/cluster-plan-name-test.cjs/FAIL: rzymianie: seed 202 has a rejected slot |  |  |  |
| X/1/end-turn-modal-sequencing-test.cjs/FAIL: [A5] function openPlayerMapUnitAttackCore(: showPreBattle ma defaultAction:'manual' i BEZ auto:true (ręczna akcja gracza, nigdy nie o |  |  |  |
| X/1/epoka-merge-recruit-test.cjs/  [FAIL] epoch=1: WSZYSTKIE jednostki bazowe Kamienia dostepne (biezaca epoka, pelny magazyn+techy+koszary) -- brakuje=["Taran"] |  |  |  |
| X/1/era-change-toast-defer-test.cjs/FAIL: Blok 5: ogólny mechanizm defer (showHintMessage/shouldDeferEotEvents/deferredEotHints) dla innych komunikatów EOT nienaruszony |  |  |  |
| P/0/era-war-bronze-player-target-test.cjs/ |  |  |  |
| X/1/endturn-battle-deadlock-exec-test.cjs/  FAIL [B1c] klik 1 pokazuje podpowiedź blokady przy otwartym ekranie |  |  |  |
| X/1/fair-play-tier-grid-test.cjs/FAIL: low: góry 35 |  |  |  |
| X/1/ai-march-avoid-foreign-territory-test.cjs/  [FAIL] C7 requestWarMarchPassage: brak prosby o przemarsz (no-route): prosba znika (0) -> B4c (wojna-all-in) czerwone (got 1, want 0) |  |  |  |
| P/0/forced-war-bronze-test.cjs/PASSED: 48 / FAILED: 0 / TOTAL: 48 |  |  |  |
| A/1/escape-overlay-real-panels-test.cjs/BUILD/RUNTIME ERROR: Error: Build failed with 2 errors: |  |  |  |
| P/0/forced-war-iron-test.cjs/PASSED: 55 / FAILED: 0 / TOTAL: 55 |  |  |  |
| P/0/forced-war-reguly-multi-turn-simulation-test.cjs/PASSED: 48 / FAILED: 0 / TOTAL: 48 |  |  |  |
| P/0/barbarzyncy-krazenie-test.cjs/ |  |  |  |
| P/0/forced-war-stone-test.cjs/PASSED: 31 / FAILED: 0 / TOTAL: 31 |  |  |  |
| X/1/fortify-pole-test.cjs/  [FAIL] Taktyczna/Pomiń, płasko: hitChanceTw(atak, Obrona×(1+50%)×terrMult) (39%) == resolveCombat z bonusem wliczonym do meleeDefence  |  |  |  |
| X/1/granice-relacja-dyplomatyczna-test.cjs/FAIL: main.ts: relationColorFn(0) zwraca civColorFn(0) — własna obwódka w kolorze cywilizacji |  |  |  |
| X/1/hotseat-etap6d-podetap-e-source-test.cjs/  FAIL: negotiationPartnerOwnerIdOf: PRZED (HEAD) -- MIAŁO hardkod (dowód, że test nie jest tautologiczny -- odróżnia stan sprzed migra |  |  |  |
| X/1/hud-moc-warstwa-test.cjs/  FAIL: sumArmyMForOwner (NOMINALNA) == 49 dla Konnicy (bez skalowania weterana) -- 98 |  |  |  |
| X/1/hud-armia-chip-jednostki-test.cjs/  FAIL: main.ts zawiera funkcje buildEmpireDetailSnap(): EmpireDetailSnap |  |  |  |
| X/1/json-descriptions-sync-test.cjs/FAIL: a1: gra/data/war-weariness-params.json — wartości bez prefiksu _ równe wersji bazowej f196422ef (+ celowe: pelneTur 40, progWymusz |  |  |  |
| X/1/manual-rebalance-owner-era-test.cjs/FAIL: Zelazo: top2 = zloto(1,0)+oboz(-1,1) (epoka wlasciciela w rankingu), got=0,1,1,0 |  |  |  |
| X/1/heal-stale-blockers-pending-battle-test.cjs/FAIL: [A3] gałąź 1 (aiTurnAwaitingBattle//aiCmdResume) sprawdza DOKŁADNIE !preBattle && !battleUiResolving && !hasPendingAutoPreBattle() |  |  |  |
| X/1/march-attack-queue-persist-test.cjs/FAIL: (g5) handleSelectedUnitHudAction: DOKŁADNIE 5 wywołań clearPlannedMarch(u.id, true) — skip/garnizon/sentry/scout-explore + genera |  |  |  |
| A/1/miasta-panstwa-wylaczone-test.cjs/FAIL: brak PRE-tree (origin/main) w scratchpadzie — uruchom najpierw git archive. |  |  |  |
| X/1/idb-b1b2b3-test.cjs/  FAIL: (setup) mimo braku IDB, stary zapis z legacy localStorage nadal widoczny na liście (got 0) |  |  |  |
| X/1/moc-ranking-rozjazd-test.cjs/  FAIL: sumArmyMForOwner (NOMINALNA) == 49 dla rekruta (unitDefFor, bez skalowania) -- 98 |  |  |  |
| X/1/mur-paradoks-test.cjs/  [FAIL] Kontrola fixture: M bazowe Konnicy (bez zadnego bonusu) == 49 (98) |  |  |  |
| X/1/koniec-tury-g1-g2-runda4-test.cjs/FAIL: [A11] wszystkie 3 wywolania showArmyMergePanel maja flushDeferredAutoPreBattle() w KAZDYM callbacku zamykajacym (onMerge i onSeparate) |  |  |  |
| X/1/no-negative-stocks-c2-test.cjs/FAIL: main.ts: bramka zakupow AI (aiNnsHoldOwners) |  |  |  |
| X/1/no-negative-stocks-endturn-test.cjs/FAIL: (f) hintEndTurnBlocked: gałąź blokady pokazuje nnsHint.komunikat |  |  |  |
| X/1/naval-water-access-gate-test.cjs/MUTACJA: gate w availableProduction (odwrócenie warunku) -- FAIL potwierdzony, przywrócenie -- PASS potwierdzony |  |  |  |
| A/1/open-panel-refresh-after-tech-live-test.cjs/if (!BUNDLE) throw new Error('Ustaw ROBOCZA_HTML=<sciezka do kopii Gra-ROBOCZA.html>'); |  |  |  |
| X/1/perf-endturn-ai-phase-equiv-test.cjs/AssertionError [ERR_ASSERTION]: otwarcie okna tuz po deklaracji relacjeDip |  |  |  |
| X/1/r-bitwa-kolory-gracz-przeciwnik-q1-test.cjs/AssertionError [ERR_ASSERTION]: gracz niebieski, przeciwnik czerwony |  |  |  |
| X/1/okolica-ownership-change-reconcile-test.cjs/FAIL: (b) wchloniecie dyplomatyczne (annexCityStateToOwner): city.ownerId = annexerId -> seedCityOwnerDefaults(city) w petli po csCities |  |  |  |
| A/1/recruitment-batch-contract-test.cjs/ReferenceError: effectiveGameDifficultyForOwner is not defined |  |  |  |
| X/1/ruch-swiata-tempo-test.cjs/  FAIL: main.ts: load -> player.ruchSwiataPace = saved.gracz.ruchSwiataPace ?? newGameParams.advanced?.ruchSwiataPace ?? 'krotki' (stary zap |  |  |  |
| X/1/rekrutacja-skarbiec-only-test.cjs/FAIL: zakup gracza/AI/MP odrzuca brak środków Skarbca |  |  |  |
| X/1/rydwan-konnica-x2-test.cjs/FAIL: 4 niezgodnosci |  |  |  |
| A/1/save-load-roundtrip-state-drift-test.cjs/FAIL  --dist <abs-dist> z index.html jest wymagany dla warstwy dynamicznej (podano: "") |  |  |  |
| X/1/stone-research-costs-test.cjs/FAIL: complete technology dataset unchanged apart from the four approved costs |  |  |  |
| X/1/rydwan-bierny-atak-test.cjs/[FAIL] wróg poza zasięgiem nie wymusza ofensywnego zbliżenia |  |  |  |
| A/1/tartak-oboz-wyscig-race-test.cjs/ReferenceError: setPlacedLayersOwned is not defined |  |  |  |
| X/1/surrender-rekrutacja-build-gate-test.cjs/FAIL: surrender usuwa legacy, zwraca Pracę staremu właścicielowi i filtruje kolejkę dla nowego |  |  |  |
| X/1/plony-budynkow-test.cjs/FAIL: Targowisko: delta finalnego Pieniadza = 4 (NIE surowe 5) -- decyzja 67B: Pieniadz budynku dzieli sie suwakiem 70/20/10 z reszta Daniny |  |  |  |
| A/1/pr141-hotseat-diplomacy-owner-test.cjs/FAIL actual shared diplomacy tick context does not carry religion flag (decyzja #342: religia bez wplywu na Zaufanie): isHarderDiplomacyEnab |  |  |  |
| X/1/unit-stock-cost-test.cjs/FAIL: Bronze Konnica: Brąz 25 and base horse stock 25 each scale x2 (got {"braz":100,"kon":100}, want {"braz":50,"kon":50}) |  |  |  |
| X/1/trade-routes-income-test.cjs/  FAIL: H2e: one capital Mint raises tax cash in another city of the owner (mint=2, noMint=2) |  |  |  |
| X/1/villages-test.cjs/  FAIL: pickVillageReward wołane z opcją { excludeUnit } |  |  |  |
| X/1/war-epoch-player-first-main-guard-test.cjs/FAIL [baza]: main.ts: kandydaci na partnera gracza = WSZYSCY major AI (nie tylko pula) |  |  |  |
| X/1/war-era-counter-test.cjs/WYNIK: 37 OK / 0 FAIL |  |  |  |
| X/1/wojna-wymuszona-parowanie-test.cjs/  FAIL: S2: brak nierozwiązanych -- leftover 5 znalazł parę do dołączenia (got 1, want 0) |  |  |  |
| A/1/ui-language-count-renderer-test.cjs/Error: Build failed with 28 errors: |  |  |  |
| P/0/wojna-wymuszona-prog-tury-gracz-test.cjs/PASSED: 9, FAILED: 0 |  |  |  |
| X/1/wonder-transfer-on-conquest-test.cjs/FAIL: main.ts: kapitulacja głodowa owinięta migawkami |  |  |  |
| X/1/zelazo-gate-test.cjs/  [FAIL] Legionista JEST dostepny: kopalnia na zlozu + Odlewnia zelaza -- ids=[] |  |  |  |
| A/2/ai-ai-treaty-live-proof-wiring-test.cjs/ |  |  |  |
| A/2/ambush-deploy-identity-test.cjs/ |  |  |  |
| A/2/memory-static-geometry-pool-test.cjs/ |  |  |  |
| A/2/move-pass-through-own-units-test.cjs/Error: Build failed with 1 error: |  |  |  |
| P/0/unit-card-ranged-mult-test.cjs/ |  |  |  |
| X/1/war-allin-capital-test.cjs/  FAIL: 6b aiVsAi: flaga OFF == referencja 20a5bc2c7abcba1b (got "d28c8b7ffce7a3ec", want "20a5bc2c7abcba1b") |  |  |  |
| P/0/ai-avoid-polar-plan-test.cjs/ |  |  |  |
| X/1/ai-army-replacement-concentration-test.cjs/FAIL: pomiar: bez bramki >10% marszow jednostek ze skupiska < 3 (stan przed poprawka) |  |  |  |
| P/0/ai-avoid-polar-player-parity-test.cjs/ |  |  |  |
| P/0/ai-avoid-polar-sim-test.cjs/ |  |  |  |
| X/1/ai-move-full-range-test.cjs/  [FAIL] D2 udzial ruchow z niewykorzystanym zapasem mimo wolnej trasy PO (19.7%) <= PRZED (18.8%) + 0,5 pp tolerancji szumu |  |  |  |
| X/1/autoimprove-irrigation-after-farms-test.cjs/  [FAIL] koszt irygacji = 60 (3 x farma 20) [jest 30] |  |  |  |
| X/1/autoimprove-pasture-irrigation-q2-test.cjs/  [FAIL] (e) faza wzrostu (24 tury): 0 tur z glodzona trzoda/irygacja przy duzej puli (starved=3) |  |  |  |
| E/124/battle-pace-equal-line-live-test.cjs/ |  |  |  |
| P/0/capital-sep-pangea-test.cjs/ |  |  |  |
| X/1/climate-band-test.cjs/FAIL: map has polar terrain (0 hexes) |  |  |  |
| P/0/cluster-spread-test.cjs/ |  |  |  |
| P/0/cyna-surowiec-test.cjs/ |  |  |  |
| E/124/cluster-start-test.cjs/ |  |  |  |
| E/124/deposit-coast-test.cjs/ |  |  |  |
| E/124/earth-template-test.cjs/FAIL: ziemia: 0 heksów lądu poza szablonem (found 1668) |  |  |  |
| P/0/hotseat-etap6f-part2-data-test.cjs/ |  |  |  |
| E/124/fair-play-grid-test.cjs/ |  |  |  |
| E/124/horse-resource-terrain-test.cjs/ |  |  |  |
| E/124/land-sea-ratio-test.cjs/ prep=2 terrain=34 landSea=388 relief=691 coast=94 riversMain=20489 riversFill=23287 forest=32 deposits=122 starts=636 total=45774 |  |  |  |
| E/124/map-coast-buffer-test.cjs/FAIL: kontynenty seed=1: ląd w buforze brzegu (11,0, 12,0, 13,0) |  |  |  |
| E/124/map-continents-rivers-test.cjs/ |  |  |  |
| E/124/map-gen-regression-test.cjs/ |  |  |  |
| P/0/mapgen-rivers-fill-centroid-cache-test.cjs/ |  |  |  |
| P/0/map-quality-forest-parity-test.cjs/ |  |  |  |
| P/0/medium-river-test.cjs/ |  |  |  |
| P/0/merge-decor-no-regress-test.cjs/ |  |  |  |
| E/124/miasta-zbyt-blisko-test.cjs/ prep=0 terrain=121 landSea=2536 relief=2564 coast=965 riversMain=5910 riversFill=794 forest=77 deposits=91 starts=770 total=13828 |  |  |  |
| E/124/pangea-land-determinism-test.cjs/ prep=0 terrain=70 landSea=3276 relief=6409 coast=641 riversMain=15 riversFill=103 forest=70 deposits=96 starts=1336 total=12017 |  |  |  |
| E/124/pangea-land-fraction-test.cjs/ |  |  |  |
| E/124/pangea-land-shape-test.cjs/ |  |  |  |
| E/124/pangea-river-interior-test.cjs/ |  |  |  |
| E/124/relief-grid-coverage-test.cjs/ |  |  |  |
| E/124/river-density-test.cjs/ |  |  |  |
| E/124/river-grid-coverage-test.cjs/ |  |  |  |
| E/124/river-loop-test.cjs/ |  |  |  |
| E/124/river-map-scale-test.cjs/ |  |  |  |
| E/124/river-path-adjacency-test.cjs/ |  |  |  |
| E/124/river-sea-buffer-test.cjs/ |  |  |  |
| E/124/river-yield-both-sides-test.cjs/ |  |  |  |
| E/124/roads-city-links-only-test.cjs/ prep=1 terrain=10 landSea=166 relief=339 coast=43 riversMain=563 riversFill=570 forest=8 deposits=6 starts=157 total=1861 |  |  |  |
| E/124/roads-reach-city-hex-test.cjs/ prep=0 terrain=17 landSea=76 relief=114 coast=35 riversMain=409 riversFill=264 forest=6 deposits=6 starts=42 total=970 |  |  |  |
| E/124/stranded-land-test.cjs/ |  |  |  |
| E/124/terrain-height-audit-test.cjs/ |  |  |  |
| E/124/world-density-test.cjs/ |  |  |  |
| E/124/resource-ledger-realpath-mutation-test.cjs/[m01] ZABITA (exit 1) — pominiecie lupu z bitwy :: FAIL lup z bitwy: wpis „Łup z bitwy” (lup_bitwy) dla zwyciezcy :: {} |  |  |  |
