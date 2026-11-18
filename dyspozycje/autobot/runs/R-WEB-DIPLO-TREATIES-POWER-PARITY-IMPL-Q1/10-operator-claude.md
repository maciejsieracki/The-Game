STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły (S = X·r, W = X/r, D = S − W płaci słabsza) dla rozejmu, NAP, przemarszu, sojuszy i wasala; runda 3: ścieżka AI i AI↔AI, testy, Civpedia/wikiBundle.
ZMIERZONO NA: baza 7cc59b10f (origin/main 2b950566f już w niej zawarty, merge = "Already up to date").

ZMIANY-COMMIT (Operator SONNET, uzasadnienie w dispatchu: wielościeżkowy temat po 2 rundach Haiku)
- gra/src/game/war-weariness.ts: treatyParityBasePnFromData (X z JSON, rozejm × (1 − L)) i aiTreatyParityDuePn (jedno miejsce wzoru po stronie AI, wrapper peaceAiAiPaymentPn z X traktatu zamiast P).
- gra/src/game/ai.ts: (a) rozejm AI (oferuj_miasto_za_pokoj rodzaj=rozejm) liczy D z X = 2000 × (1 − L) przez ten sam aiPeaceCityDuePn; (b) zaproponuj_pakt i zaproponuj_sojusz: AI słabsze wg POWER (D > 0) nie składa oferty; progi gotowości 130/90 bez zmian.
- gra/src/main.ts: AI↔AI rozejm (tickAiAiPeaceRequests) = D z X rozejmu, bilans od ceny (nie od bazy 2000); rozejm AI → gracz: baza żądania = D (AI silniejsze) albo 0 (słabsze/równe); prośba AI o przemarsz bramkowana parytetem.
- gra/src/game/diplomacy-proposals.ts: bilans AI-autora rozejmu liczony od D (nie od surowej bazy 2000).
- docs/encyklopedia/pojecia/rozejm-pokoj.md + gra/src/data/wikiBundle.json (wygenerowany generatorem bundle-wiki-for-game.cjs; zdanie "2,5% na turę" zachowane): sekcja "Parytet siły w traktatach" z cenami ×10, regułą S/W/D, tabelą 6 traktatów.
- Testy: NOWY gra/tools/diplo-treaties-ai-parity-test.cjs (80 PASS / 0 FAIL); zaktualizowane asercje (uzasadnienie niżej): diplo-peace-pw-power-ratio (A1/A2 → 20 tur = pokój, nowe A1r rozejm), diplo-truce-r4-ai (baza 200→2000), dyplo-bilans-gate-n-e1-reprodukcja (zbiór TREATY_GATED z 'rozejm' — wyjątek allowlisty z dispatchu), diplo-peace-price-production-paths (B: cena rozejmu przed 20. turą), diplo-peace-price-wiring (W3: nowy kształt requiredPn rozejmu).

TESTY (surowe wyjście)
- tsc --noEmit: exit 0, 0 linii.
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0.
- diplo-json-descriptions-sync 46/46. json-descriptions-sync-test: 18/1 — FAIL a1 (war-weariness-params.json vs f196422ef): plik NIETKNIĘTY przeze mnie, błąd istnieje w bazie (dług).
- diplo-treaties-ai-parity 80/0; diplo-treaties-power-parity 50/0; diplo-rozejm-parity 25/0; diplo-peace-pw-power-ratio 48/0; diplo-truce-impl 94/0; diplo-truce-r1 31/0; diplo-truce-r4-ai 24/0 (przed: 23/1); diplo-war-peace-sim 25/0; diplo-wiki-weariness-rate-consistency 18/0; dyplo-bilans-gate-n-e1-reprodukcja 22/0 (przed: 21/1); diplo-peace-price-production-paths 15/0; diplo-peace-price-wiring 14/0.
- Mutacje (w nowym teście): bez bramki sojuszu → B5 czerwieni; bez bramki paktu → B1 czerwieni; bez bramki przemarszu → F3 czerwieni; istniejące mutacje rozejmu/sojuszu (r2) zostają.
- Regresje bazowe BEZ zmian względem bazy (te same 5 czerwonych w bazie i po zmianie): dyplo-bilans-gate-…-runda2, …-runda3, dyplo-karta-duplikat-komunikat, dyplo-pakt-ekspansja-granica, dyplo-warunek-niespelniony-czerwony-tooltip (weryfikowane odtworzeniem bazy ai.ts/main.ts/proposals).
- POMIAR częstości rozejmów AI względem bazy (siatka 5 r × 6 L × 5 cen miast × 4 liczby miast = 600 komórek, ai.ts z 7cc59b10f vs nowy): ofert rozejmu NOWE 185 vs BAZA 107; gorzej 0 komórek, lepiej 78. Powód: X rozejmu (2000·(1−L)) < P pokoju (6000·(1−L)), z którego bazowy ai.ts liczył rozejm.
- Żywy Chromium: NIE ZMIERZONO (wymaga buildu `npm run build` w gra/, zakazanego w tym dispatchu).

BLOKADY: brak. Płatność surowcami/złotem nie dodana (zgodnie z zakazem).

ZAŁOŻENIA / UWAGI-DLA-ORKIESTRATORA
1. Pozycja 'miasto' jest dozwolona tylko w pokoju i wasalizacji (MIASTO_AKCJE_DOZWOLONE, diplomacy-value-catalog.ts); pakt, sojusz i przemarsz nie przenoszą miast, a płatność surowcami jest niezatwierdzona. Dlatego AI słabsze (D > 0) NIE proponuje paktu, sojuszu ani prośby o przemarsz; AI silniejsze/równe — oferty jak dotąd. Konsekwencja bez sufitu: przy dużej różnicy mocy te oferty AI słabszego zanikają (zgodne z wyborem właściciela B), do decyzji jeśli ma być inaczej (np. zatwierdzenie złota/surowców albo miast w pakcie).
2. AI silniejsze nie żąda od gracza miasta ≥ D przy sojuszu/NAP/przemarszu (brak nośnika miasta w tych koszykach); blokada "Brakuje N PW" zostaje tylko dla autora-gracza (reguła 2026-09-07). Rozejm AI silniejszego żąda D w pozycjach koszyka (receiveItems), jak dotąd przez peaceOfferAiRequestBasket.
3. AI↔AI: istnieje tylko tor rozejmu/pokoju i przemarsz (granice); AI↔AI sojusz/NAP/wasal nie powstają w kodzie komendami (brak toru) — parytet tam nie ma zastosowania. Przemarsz AI↔AI słabszego: brak prośby (teren zostaje zablokowany jak po odmowie); wpływ na ruch AI do zmierzenia w grze.
4. Wpływ na częstość: rozejmy AI↔gracz i AI↔AI nie spadają (pomiar wyżej); sojusze i NAP AI słabszego mocą znikają, równa/większa moc bez zmian. Panel PW i tooltipy dla szóstki z r2 (treatyPowerSplit) — bez zmian w tej rundzie.
5. Tabela S/W/D z kodu (S/W/D, X z JSON):
| r | rozejm/NAP (X=2000) | przemarsz (600) | sojusz obronny (4200) | sojusz pełny (5000) | wasal (3500) |
| 1 | 2000/2000/0 | 600/600/0 | 4200/4200/0 | 5000/5000/0 | 3500/3500/0 |
| 1,5 | 3000/1333/1667 | 900/400/500 | 6300/2800/3500 | 7500/3333/4167 | 5250/2333/2917 |
| 2,67 | 5338/749/4589 | 1601/225/1376 | 11210/1574/9636 | 13345/1873/11472 | 9342/1311/8031 |
| 5 | 10000/400/9600 | 3000/120/2880 | 21000/840/20160 | 25000/1000/24000 | 17500/700/16800 |
   (rozejm: X × (1 − L) przy zmęczeniu.)
6. Testy uruchamiające przeglądarkę nadpisują PNG w dyspozycje/autobot/runs/*/dowody — przywrócone przed commitem (nie wchodzą do commita).
7. Dług: json-descriptions-sync-test a1 (war-weariness-params.json vs f196422ef) czerwony w bazie.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator → Obrona → Final Control (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO
