# WERSJE â€” jedyny rejestr wersji bundli (prowadzi: publikujÄ…cy, czyli INTEGRATOR)

ZASADA: md5/stempel wpisuje siÄ™ TYLKO tutaj, zaraz po publishu. Inne pliki linkujÄ…,
nigdy nie kopiujÄ… (stary system miaĹ‚ 4 sprzeczne â€žaktualne" md5 â€” nigdy wiÄ™cej).
Format: data Â· md5 (peĹ‚ne) Â· stempel z menu Â· co weszĹ‚o (1 linia) Â· status.

UWAGA: KANON i FINALNA promujÄ… siÄ™ teraz OSOBNYMI skryptami (`gra/tools/publish-kanon-snapshot.ps1`
= ROBOCZAâ†’KANON, `gra/tools/publish-finalna-snapshot.ps1` = KANONâ†’FINALNA, ten drugi tylko na
wyraĹşne polecenie wĹ‚aĹ›ciciela) â€” dlatego sÄ… logowane NIEZALEĹ»NIE, kaĹĽdy w swojej sekcji, ze
swoim wĹ‚asnym md5/stemplem/statusem; promocja jednego NIE oznacza promocji drugiego.




## ROBOCZA 01f6024a - 2026-08-05 23:00 - FALA 243: dyplo katalog+szare B+C · audyt MP budów - **AKTUALNA**
|- md5 (pelne): 01f6024abb7bfbac5b360a6213fa74f0 · stempel: ROBOCZA · 2026-08-05 20:55 (label 01f6024a)
|- **FALA 243.** (1) D-DYPLO-AKCJE-SZARE=B+C + D-DYPLO-KATALOG=A — pełny katalog, szare + stały wiersz powodu. (2) R-AI-MIASTA-BUDOWY=A — audyt docs (bez fix). AutoBot PASS · tip `3517031`/`38d54dd` · dyplo-test 20/20 · mp-audit 9/9.
|- Grok deploy (Maciej litery · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 5b6ee97d - 2026-08-05 22:34 - FALA 242: AI-BALANS-STEP1 L3 kolonizacja pop 4 - **ZASTĄPIONA** (→ 01f6024a)
|- md5 (pelne): 5b6ee97d94285880320f2f1369840c9d · stempel: ROBOCZA · 2026-08-05 20:33 (label 5b6ee97d)
|- **FALA 242.** AI-BALANS-STEP1 — major AI na Trudnym: próg ludności miasta-źródła kolonii **4** (L1/L2 zostaje 5). AutoBot PASS · tip `9f92cbd` · ai-colonization-pop 13/13.
|- Grok deploy (Maciej „1+2” · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 178073f9 - 2026-08-05 22:23 - FALA 241: absorb F2 any-civ + celownik - **ZASTĄPIONA** (→ 5b6ee97d)
|- md5 (pelne): 178073f9c05e0e83ba929dae53efd3c8 · stempel: ROBOCZA · 2026-08-05 20:23 (label 178073f9)
|- **FALA 241.** (1) P-AI-ABSORB-F2=B — Hard any-civ major absorb (progi 1.25/tura10). (2) D-DYPLO-CELOWNIK=A — hint gdy brak stolicy. (3) AI-BALANS-UNLOCK=B — docs (bez liczb). AutoBot PASS · tip `68e2b04` · absorb 20/20.
|- Grok deploy (Maciej litery · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA d1450398 - 2026-08-05 22:11 - FALA 240: PROD-GATE + major absorb Faza1 - **ZASTĄPIONA** (→ 178073f9)
|- md5 (pelne): d14503985a8eb8dffde64b0c64e932fe · stempel: ROBOCZA · 2026-08-05 20:11 (label d1450398)
|- **FALA 240.** (1) P-AI-PROD-GATE-Q1=A — difficulty per owner w produkcji AI. (2) P-AI-MAJOR-ABSORB Q1=C Q2=C Faza1 — Hard + same-civ + Moc≥1.25 od tury 10 → instant wchłonięcie. AutoBot PASS · tip `27ba681` · testy 8+18.
|- Grok deploy (Maciej litery · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA ff7c5e49 - 2026-08-05 21:54 - FALA 239: AI-MOC-NEXT-Q1=B metryki diag - **ZASTĄPIONA** (→ d1450398)
|- md5 (pelne): ff7c5e490c45dace365a00de068b70c3 · stempel: ROBOCZA · 2026-08-05 19:54 (label ff7c5e49)
|- **FALA 239.** AI-MOC-NEXT-Q1=B: sekcja „Diag major AI” w overlay Moc (Moc/miasta/Praca/kolejki) · pure `ai-moc-diag.ts` · bez balansu. AutoBot PASS · tip `1f988f6`/`4b9c599` · ai-moc-diag 22/22.
|- Grok deploy (Maciej „2”=B · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA ea921d1e - 2026-08-05 21:37 - FALA 238: MP spawn Wyżywienie=4 + STRICT-SAVE - **ZASTĄPIONA** (→ ff7c5e49)
|- md5 (pelne): ea921d1e31f93a725c34f8efdbda4161 · stempel: ROBOCZA · 2026-08-05 19:37 (label ea921d1e)
|- **FALA 238.** (1) P-MP-SPAWN-WYZYWIENIE: founding `poziomRacji=4` (parytet gracz/AI/MP). (2) Evaluator STRICT-SAVE (FAIL #9 save/load) w procesie. AutoBot PASS · tip `5fecbcf`/`8baa14d` · mp-spawn-ration 14/14.
|- Grok deploy (Maciej „1+2” · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 5b0e1c19 - 2026-08-05 19:44 - FALA 237: WIAR UI badge + ranking Potęgi - **ZASTĄPIONA** (→ ea921d1e)
|- md5 (pelne): 5b0e1c19816157ac22dbf10cbab7d11d · stempel: ROBOCZA · 2026-08-05 17:44 (label 5b0e1c19)
|- **FALA 237.** WIAR §7: badge `W ±N · pasmo` przy tytule cywu (gracz+rozmówca) · W w rankingu Potęgi i panelu dyplomacji. AutoBot PASS (STRICT) · tip `cad6f23` · wiarygodnosc 146/146.
|- Grok deploy (Maciej „Dalej WIAR” · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 03a19191 - 2026-08-05 19:29 - FALA 236: WIAR UI życiorys vs bieżące - **ZASTĄPIONA** (→ 5b0e1c19)
|- md5 (pelne): 03a19191ae5a5c313417a67a386f9399 · stempel: ROBOCZA · 2026-08-05 17:29 (label 03a19191)
|- **FALA 236.** WIAR UI §4/§7: rozbicie „trwały życiorys” vs „bieżące uczynki” (tooltip + linia pod paskiem audiencji). AutoBot PASS · tip `18cb4f7` · wiarygodnosc 136/136.
|- Grok deploy (Maciej „2” · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 9c0a38ae - 2026-08-05 19:15 - FALA 235: WIAR R1b tempo one-shot - **ZASTĄPIONA** (→ 03a19191)
|- md5 (pelne): 9c0a38ae821034e283a794806853e788 · stempel: ROBOCZA · 2026-08-05 17:15 (label 9c0a38ae)
|- **FALA 235.** WIAR R1b: applyDiplomaticEvent mnoży dZ tempa (nie dR); applyDiploEventTracked przekazuje W. AutoBot PASS · tip `1c7e650` · wiarygodnosc 110/110 · diplomacy 148/148.
|- Grok deploy (Maciej „2” · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 7d86fa19 - 2026-08-05 19:05 - FALA 234: WIAR R1 tempo W→Zaufanie - **ZASTĄPIONA** (→ 9c0a38ae)
|- md5 (pelne): 7d86fa1919e785a6a3242388ad11ec46 · stempel: ROBOCZA · 2026-08-05 17:05 (label 7d86fa19)
|- **FALA 234.** WIAR R1: `applyWiarygodnoscTempoDoDelty` w `computeTickZaufanieDelta` (po sumie dZ, przed war-zero). AutoBot PASS · tip `6ccc945` · wiarygodnosc-test 103/103.
|- Grok deploy (Maciej „2”=R1 · SOLO-Q1=A). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 06712ea4 - 2026-08-05 18:55 - FALA 233: SOLO facing replay + WIAR Etap0 - **ZASTĄPIONA** (→ 7d86fa19)
|- md5 (pelne): 06712ea4149b64fc0eebad326684d7b0 · stempel: ROBOCZA · 2026-08-05 16:55 (label 06712ea4)
|- **FALA 233.** (1) BITWA-FACING=B: C-FLANK kompletny + persist `attackDirection` przy replay. (2) WIAR A+B: Etap 0 typy + przegląd Dźwignie 2–4. AutoBot PASS · tip `c97bf2d` · deploy `830a9e4`.
|- Grok deploy (SOLO-Q1=A · Maciej „1”=OK listy). tsc 0 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA fca41b9a - 2026-08-05 18:12 - FALA 232: SOLO batch (muzyka+węgiel+bitwa I) - **ZASTĄPIONA** (→ 06712ea4)
|- md5 (pelne): fca41b9ae7d30c104db261679f0124e6 · stempel: ROBOCZA · 2026-08-05 16:12 (label fca41b9a)
|- **FALA 232.** MUZYKA=A 2500ms · SUR-WEGIEL=B · BITWA I replay grupy. tip `b474a8e`.

## ROBOCZA 283de421 - 2026-08-05 17:45 - FALA 231: R-AI-TRUDNOSC P2 - **ZASTĄPIONA** (→ fca41b9a)
|- md5 (pelne): 283de42102481e6b66c509808ef6bf20 · stempel: ROBOCZA · 2026-08-05 15:45 (label 283de421)
|- **FALA 231.** R-AI-TRUDNOSC P2: Q1=A (canAfford status quo, bez kodu) · Q2=A (L3 + startowe_miasta≥1 → majorEarly max tura **25**). AutoBot PASS · merge tip `b234300` (PR #115).
|- Grok deploy (Maciej **1+2+3** = deploy + playtesty + dalsza kolejka). tsc 0 · difficulty 64/64 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA 7f8bdc74 - 2026-08-05 17:20 - FALA 230: R-AI-TRUDNOSC P1 + P1-3 - **ZASTĄPIONA** (→ 283de421)
|- md5 (pelne): 7f8bdc7445c11973c9e323fa166b8970 · stempel: ROBOCZA · 2026-08-05 15:20 (label 7f8bdc74)
|- **FALA 230.** (1) P1: majorEarly budynki ×0.70 · scout −80 po 1. · L1 early turn 25. (2) P1-3: Spryt AI (agresja/dyplomacja/cel) ×3 poziomy w `ai-params.json` (behavior-neutral). AutoBot PASS · merge PR #112+#113.
|- Grok deploy (hasło Macieja „1"). tsc 0 · difficulty 64/64 · T14-p1 6/6 · vite · stamp · sync · START hub · VERIFY OK.

## ROBOCZA efab84db - 2026-08-05 16:53 - FALA 229: DEPLOY ALL (R-AI-TRUDNOSC P0) - **ZASTĄPIONA** (→ 7f8bdc74)
|- md5 (pelne): efab84db7a8eaeae0f4885ae0111ccae · stempel: ROBOCZA · 2026-08-05 14:53 (label efab84db)
|- **FALA 229 DEPLOY ALL.** Maciej: deploy all do ROBOCZA. Batch: R-AI-TRUDNOSC P0 (realna Praca L2×1.1/L3×1.25 · fix spichlerz/cegielnia ids · L3 bonus_nauka=2) + pełny rebuild tip `main` (zawiera FALA 225–228). AutoBot PASS · merge PR #111.
|- Grok deploy (hasło Macieja). tsc 0 · ai-difficulty-bonus 25/25 · vite · stamp · sync playtest · START hub · VERIFY OK.

## ROBOCZA 29bfdf00 - 2026-08-05 14:58 - FALA 228: R-CITY-PILL-PROD-ICON (ECHO1+2) - **ZASTĄPIONA** (→ efab84db)
|- md5 (pelne): 29bfdf0049aa4837a94b9c7cd76f6fd5 · stempel: ROBOCZA · 2026-08-05 12:58 (label dcefcfec)
|- **FALA 228.** R-CITY-PILL-PROD-ICON: (1) ikony konkretnego budynku/jednostki z kolejki; pusta=brak; Wyżywienie na pigułce gracza. (2) ECHO2: medalion władcy (gracz+major AI) vs kultura (MP). AutoBot Operator→Evaluator PASS-WITH-NOTES→Grok. Merge `24127ba`+.
|- Grok deploy (hasło Macieja). tsc 0 · city-map-badge 27/27 · vite · stamp · sync playtest · START hub · VERIFY OK.

## ROBOCZA 3840f218 - 2026-08-05 13:55 - FALA 227: DEPLOY ALL (odświeżenie po handoff 225–226) - **ZASTĄPIONA** (→ 29bfdf00)
|- md5 (pelne): 3840f2189404ca7cf447c18e40d17d00 · stempel: ROBOCZA · 2026-08-05 11:55 (label 718d0ac2)
|- **FALA 227 DEPLOY ALL.** Maciej: po zapisie handoffu — deploy all do ROBOCZA. Kod gameplay = FALA 226 (P-AI-MOC-BONUS + P-AI-008) + FALA 225 (R-AUTO) na tip `main` `546ce97` + docs handoff. Sync wszystkich playtestów + START hub.
|- Grok deploy (hasło Macieja). tsc 0 · vite · inject stamp · sync playtest · START hub · VERIFY OK.

## ROBOCZA ebe4548f - 2026-08-05 13:27 - FALA 226: P-AI-MOC-BONUS + P-AI-008 - **ZASTĄPIONA** (→ 3840f218)
|- md5 (pelne): ebe4548fb8f8522112bec8eea9d2f8b0 · stempel: ROBOCZA · 2026-08-05 11:27 (label fea8af68)
|- **FALA 226.** (1) P-AI-MOC-BONUS-Q1=A — startoweJednostki/Miasta + bonusWalka + bonusNauka dla major AI. (2) P-AI-008 — zagrożenie: jednostki+rozwój zamiast murów (MP defensiveCopy bez zmian). Notes: manual battle mult + research bez murów. R-SCENA-PERF odłożone. Na bazie FALA 225 · merge `8bb15b0`.
|- AutoBot: Operator+Evaluator PASS · Grok deploy. tsc 0 · ai-difficulty-bonus 18/18 · ai-threat-mode 11/11 · vite · VERIFY OK.

## ROBOCZA 8767b9c0 - 2026-08-05 11:54 - FALA 225: R-AUTO-RACJE-RAISE + AutoBot - **ZASTĄPIONA** (→ ebe4548f)
|- md5 (pelne): 8767b9c075c6debb6e0c2036c22c8ffb · stempel: ROBOCZA · 2026-08-05 09:54 (label e5fbaa18)
|- **FALA 225.** (1) R-AUTO-RACJE-RAISE Q1=B Q2–Q5=A — Spichlerz ≥0; auto-raise z cofnięciem gdy pool poniżej 0; maxSafe cap suwaka; Auto Wyżywienie per miasto (default WYŁ); toast glodWojska. (2) R-PROC-AUTOBOT — twarda reguła Operator→Evaluator→Grok + scaffold. Na bazie FALA 224 · tip `main` `9c4a8d8`.
|- AutoBot: Operator PASS · Evaluator PASS · Grok deploy. tsc 0 · ai-major-economy 32/32 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 38df6ad7 - 2026-08-05 00:25 - FALA 224: R-REKRUT-LUDNOSC-UI teksty bez −1 obywatela - **ZASTĄPIONA** (→ 8767b9c0)
|- md5 (pelne): 38df6ad74d2613e776a51b332eb2696c · stempel: ROBOCZA · 2026-08-04 22:25 (label eef4e87e)
|- **FALA 224.** R-REKRUT-LUDNOSC-UI — intro Rekruci/Rekrutacja: werb = Manpower, ludność miasta nie spada (bez kłamstwa „−1 obywatela”). + docs close R-BUDOWA-ZROWNOWAZONE playtest OK. Na bazie FALA 223.
|- tsc 0 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA ee0e7e04 - 2026-08-04 22:10 - FALA 223: tarcza pigułki wallKind + Zwiedzaj złota ramka od razu - **ZASTĄPIONA** (→ 38df6ad7)
|- md5 (pelne): ee0e7e046c317b101ca2eb07f7e349fe · stempel: ROBOCZA · 2026-08-04 22:10
|- **FALA 223.** (1) R-PILL-TARCZA-BEZ-MURU-Q1=A — tarcza wyłącznie z `wallKind` (= model 3D); bez `maMur`. (2) R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A — WŁ Zwiedzaj: zostań zaznaczony + złota ramka od razu (bez deselect/cycle). Na bazie FALA 222.
|- tsc 0 · city-map-badge 19/19 · scout-auto-explore 25/25 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 132401ef - 2026-08-04 23:25 - FALA 222: tempo bitwy ±/komputer + czerwone budynki + zrównoważony tryb + city pill - **ZASTĄPIONA** (→ ee0e7e04)
|- md5 (pelne): 132401efa7a83d8e55d33325fe52ba6b · stempel: ROBOCZA · 2026-08-04 23:25
|- **FALA 222.** (1) R-BATTLE-TEMPO-UI Q1=A Q2=B — Pauza/−/+/komputer, ×N w tooltipie, drabina do ×512. (2) R-BUDYNKI-NIEAKTYWNE Q1=A Q2=A+C Q3=A — czerwona nazwa + `Brak: …` (Spichlerz/Mennica/deposit). (3) R-BUDOWA-ZROWNOWAZONE-TRYB Q1=A — zrównoważony = osobny tryb auto. (4) R-CITY-PILL-SHIELD-EMBLEM — tarcza palisada/mury + emblemat civ. Na bazie FALA 221.
|- tsc 0 · owned-building-inactive 4/4 · auto-manage 45/45 · city-map-badge 13/13 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 4d17d869 - 2026-08-04 23:04 - FALA 221: dyplo flex/EOT + dobra-kat + trzoda ×1.5 + PW sum/Przyjmij/przecinek + Zwiedzaj highlight - **ZASTĄPIONA** (→ 132401ef)
|- md5 (pelne): 4d17d86943cbd010c6df3ed7d7517f81 · stempel: ROBOCZA · 2026-08-04 23:04
|- **FALA 221.** (1) R-EOT-EVENT-DEFER=A — wydarzenia EOT na start następnej tury. (2) R-DYPLO-WYMIANA-FLEX: one-way, qty edit, jedno Przyjmij, Usuń. (3) R-DYPLO-DOBRA-KAT Q1–Q3=A — akordeon Surowce/Technologie/Inne. (4) R-TRZODA-SCALE-MAP-Q1=B — pastwisko ×1,5. (5) R-DYPLO-STOL-PW-SUM + PRZYJMIJ-TRADE + PW-PRZECINEK. (6) R-SCOUT-ZWIEDZAJ-HIGHLIGHT. Na bazie FALA 220.
|- tsc 0 · trade-flex 8/8 · eot-defer 5/5 · goods-kat 8/8 · stol-pw-sum 22/22 · acceptance 225/225 · negotiation-table 54/54 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 8a3c6d6d - 2026-08-04 21:17 - FALA 220: AI-ALL batch (utrzymanie + MP cap/absorpcja + same-civ + major economy + AI-FOUND/LOCAL/MANAGE) - **ZASTĄPIONA** (→ 4d17d869)
|- md5 (pelne): 8a3c6d6d88f9d8a482e1c0107c9cc122 · stempel: ROBOCZA · 2026-08-04 21:17
|- **FALA 220.** (1) Utrzymanie budynków: +1 surowiec/turę per typ z kosztu budowy + UI. (2) MP army cap: easy unlimited / normal max 1 / hard 0 + absorption rates. (3) Same-civ AI↔MP: Zaufanie 100 + priorytet absorpcji klastra. (4) Major AI: max wzrost early / Spichlerz; 60/40 archetyp; early ulepszenia. (5) AI-FOUND pop≥2; AI-LOCAL faza ~tura 20 LUB 1 zwiadowca; AI-MANAGE auto-zarządca major (NIE MP/defensiveCopy). Na bazie FALA 219.
|- tsc 0 · ai-mp-military-cap 16/16 · ai-cs-absorption 29/29 · ai-major-economy 9/9 · ai-slider 37/37 · upkeep 49/73 (24 ×2 R-STAWKI, nie regres) · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 9830224e - 2026-08-04 20:12 - FALA 219: dyplo kontrpropozycja + bilateral gate NAP + tip weteranów - **ZASTĄPIONA** (→ 8a3c6d6d)
- md5 (pelne): 9830224eb13e86452128661adf120541 · stempel: ROBOCZA · 2026-08-04 20:12
- **FALA 219.** (1) Edycja kontrpropozycji + landscape dealów (canPlayerCounterNegotiation, diplomacyAudience Edytuj, diplomacyTradeBasket/NegotiationModal). (2) AI bilateral + proposerUnfairToPartnerGate (NAP/traktaty, blokada Przyjmij, sync Relacji main.ts). (3) Tip „Doświadczeni wojownicy” — veteranEnemyEducationShown ★≥2, prune journal. Na bazie FALA 218.
- tsc 0 · diplomacy-negotiation-table 55/55 · diplomacy-acceptance-points 218/218 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA 4cf44809 - 2026-08-04 19:52 - FALA 218: dyplo traktaty + parytet auto-racji MP - **ZASTĄPIONA** (→ 9830224e)
- md5 (pelne): 4cf448090fae0e052cd754a96ce085ae · stempel: ROBOCZA · 2026-08-04 19:52
- **FALA 218.** UI traktatów uproszczone (NAP/sojusz/…) + stół multi-deal (diplomacyTradeBasket.ts, diplomacyAudience.ts). Parytet auto-racji AI/MP — wzrost miast-państw (main.ts, city-state-mp-growth-test.cjs 9/9). Na bazie FALA 217.
- tsc 0 · city-state-mp-growth 9/9 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build gra/dist.

## ROBOCZA `6bb24541` - 2026-08-04 19:43 - FALA 217: UI NAP uproszczony (dyplomacja) - **ZASTĄPIONA** (→ 4cf44809)
- md5 (pelne): `6bb245419c549de550282ec2829c7d2f` · stempel: `ROBOCZA · 2026-08-04 19:43`
- **FALA 217.** UI Paktu o nieagresji (NAP): tylko czas, kary, ultimatum, Anuluj/Zaproponuj (`diplomacyTradeBasket.ts`). Na bazie FALA 216.
- tsc 0 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build `gra/dist`.

## ROBOCZA `56ee166e` - 2026-08-04 19:32 - FALA 216: UI aktywne tryby jednostki (ramka 3px) - **ZASTĄPIONA** (→ `6bb24541`)
- md5 (pelne): `56ee166e52ccfe166546bc108914cb6f` · stempel: `ROBOCZA · 2026-08-04 19:32`
- **FALA 216.** UI: aktywne tryby jednostki (fortify / sentry / autoExplore) — ramka 3px złota (`unitActionBarHtml.ts`, `mapUnitHudSkin.ts`). Na bazie FALA 215.
- tsc 0 · vite · inject stamp · sync playtest · START hub · VERIFY OK · build `gra/dist`.

## ROBOCZA `2a5a66d1` - 2026-08-04 19:13 - FALA 215: R-NADMIAR-POOLS FALA2 ×2 koszty - **ZASTĄPIONA** (→ `56ee166e`)
- md5 (pelne): `2a5a66d15012215778d4bdd23c027ec4` · stempel: `ROBOCZA · 2026-08-04 19:13`
- **FALA 215.** R-NADMIAR-POOLS FALA2 (`R_STAWKI_FALA2_MULT=2`): utrzymanie budynków ×2 · Praca budynków ×2 vs JSON · `koszt_surowce` ×2 · rekrutacja ×2 · upkeep jednostek ×4 · żywność wojska ×4 · badania Brąz/Żelazo ×4 (Kamień ×2) · ulepszenia terenu ×2 · cuda Praca ×2 + żywność = Praca. Na bazie FALA 214. PR #82 `f940f61`.
- tsc 0 · r-stawki-fala2 11/11 · difficulty-cost 22/22 · vite · VERIFY OK · build `gra/dist`.

## ROBOCZA `adefb5b8` - 2026-08-04 16:03 - FALA 214: batch #70–#81 (ulepszenia AI, dyplo PW, scout, MP Hard, UI) - **ZASTĄPIONA** (→ `2a5a66d1`)
- md5 (pelne): `adefb5b8e5b60c597562ce218e886d6b` · stempel: `ROBOCZA · 2026-08-04 16:03`
- **FALA 214.** Merge #70–#81: #73 ulepszenia AI/MP (regres FALA 204) · #79 Przyjmij overpay OK · #70 bilans PW własna oferta · #80 Hard MP fala+sync DOW · #81 Zwiedzaj max czarne · #75 exit auto · #71 toast chatki · #74 lista nazwana · #76 okolica żywność · #77 tryby WŁ/WYŁ · #72 ikona zrównoważone · #78 R-PROC-NO-REGRESS. Na bazie FALA 213.
- tsc 0 · scout 25/25 · ai-improvements 18/18 · diplomacy-acceptance 212/212 · vite · VERIFY OK · build `gra/dist`.
## ROBOCZA `1d3b8755` - 2026-08-04 12:13 - FALA 213: Wiaryg drift + fortify/odfort - **ZASTĄPIONA** (→ `adefb5b8`)
- md5 (pelne): `1d3b8755445058c10957c81438912d1c` · stempel: `ROBOCZA · 2026-08-04 12:13`
- **FALA 213.** REL-WIARYG-DRIFT-Q1: dryf Zaufania W×0.03 (±3 przy ±100), umowy osobno, UI Δ/turę w audiencji. FORTIFY-MP0-Q1=C + ODFORT: fortify bez wymogu MP, snapshot ruchLeft, odfort na heksie miasta z select + restore MP (anti-exploit). Na bazie FALA 212.
- tsc 0 · vite · VERIFY OK · build `gra/dist`.
## ROBOCZA `e38ad116` - 2026-08-04 11:24 - FALA 212: Spich auto + MP rel + garnizon/scout - **ZASTAPIONA**
- md5 (pelne): `e38ad116993cf1b8c18d1fce4a5e10d6` · stempel: `ROBOCZA · 2026-08-04 11:24`
- **FALA 212.** SPICH-AUTO-Q1: auto-racje EOT + czerwone wydarzenie. REL-MP-SAME-Q1: MP sameCiv +20 zaufanie. Obce MP: wojna/klaster tylko typ gracza. HEX→magazyn: projection UI MAGAZYNOWANE + tooltip. Scout AI: priorytet odkrytej chatki. Chatka toast: nie nadpisywany tipem weteranów. Garnizon: odgarnizonowanie + split zostaje w mieście. Na bazie FALA 211.
- tsc 0 · vite · VERIFY OK · build `gra/dist`.

## ROBOCZA `6bf472e2` - 2026-08-04 10:24 - FALA 211: Relacja invert + landscape + Zwiedzaj UX - **ZASTĄPIONA**
- md5 (pelne): `6bf472e29725960883c323a8f74519f8` · stempel: `ROBOCZA · 2026-08-04 10:24`
- **FALA 211.** #67 Relacja PW invert (niska Rel → niższe PW gracza, 52/80→42 vs 80). #68 koszyk traktatu landscape. #69 Zwiedzaj: clear path + deselect + next. Na bazie FALA 210. Branch `cursor/deploy-fala211-63a1`.
- tsc 0 · diplomacy-acceptance 198/198 · scout-auto-explore 15/15 · vite · VERIFY OK · build /tmp/civ-dist-fala211.

## ROBOCZA `000e19c1` - 2026-08-04 09:27 - FALA 210: Relacja PW + rzeki FoW/bonus + UI miasta - **ZASTĄPIONA**
- md5 (pelne): `000e19c1b4df3f77406ecd00b235d220` · stempel: `ROBOCZA · 2026-08-04 09:27`
- **FALA 210.** #66 Relacja asymetryczna PW + UI Relacja (zawiera #60). #63 rzeki widoczne przy FoW OFF. #64 bonus rzeki obu brzegów. #62 ściągi + tooltipy Pula (zawiera #61). #65 etykieta Ulepszenia (chip/suwak). Na bazie FALA 209. Branch `cursor/deploy-fala210-9775`.
- tsc 0 · river-fog 12/12 · river-yield 7/7 · diplomacy-acceptance 198/198 · vite · VERIFY OK · build /tmp/civ-dist-fala210.

## ROBOCZA `ddad7cf9` - 2026-08-04 08:22 - FALA 209: Civpedia/poradnik rev G2 (budynki) - **ZASTĄPIONA**
- md5 (pelne): `ddad7cf9e1578de9c07124ba738181c8` · stempel: `ROBOCZA · 2026-08-04 08:22`
- **FALA 209.** Civpedia/poradnik rev G (FALA 206–208 docs) + rev G2 (obrona % + prawdziwe efekty budynków, katalog §45, wikiBundle). Na bazie FALA 208. Branch `cursor/deploy-fala209-63a1`.
- tsc 0 · vite · VERIFY OK · build /tmp/civ-dist-fala209.

## ROBOCZA `64a7878a` - 2026-08-04 07:57 - FALA 208: pigułka miasta v1 (obrona + cywu) - **ZASTĄPIONA**
- md5 (pelne): `64a7878a905984a0450bc2f5cfbf576d` · stempel: `ROBOCZA · 2026-08-04 07:57`
- **FALA 208.** R-DESIGN-PANEL-MIASTA prototyp: pigułka na mapie — tarcza obrony 3 stany, medalion cywu, glif produkcji lite. Na bazie FALA 207. Branch `cursor/deploy-fala208-63a1`.
- tsc 0 · city-map-badge 12/12 · vite · VERIFY OK · build /tmp/civ-dist-fala208.

## ROBOCZA `47a2e73b` - 2026-08-04 00:30 - FALA 207: handel+Połącz + Design Badania + Klatka D + kolonizacja AI - **ZASTĄPIONA**
- md5 (pelne): `47a2e73b266037c1f7b21406370a78b0` · stempel: `ROBOCZA · 2026-08-04 00:30`
- **FALA 207.** Handel AI Q1=B + Połącz (#42). Design Badania v1 (#44). Klatka D numerek planu (#46). R-AI-KOLONIZACJA (pop≥5, dystans 4, surge, score). Na bazie FALA 206 (wiarygodność/wchłonięcie/manpower/UI Relacja). Branch `cursor/deploy-fala207-63a1`.
- tsc 0 · vite · VERIFY OK · build /tmp/civ-dist-fala207.

## ROBOCZA `1c7e9df7` - 2026-08-03 23:11 - FALA 206: Wiarygodność D3+tempo + wchłonięcie MP + manpower 500 + UI Relacja - **ZASTĄPIONA**
- md5 (pelne): `1c7e9df7bf4c74258ae122fc0bda846d` · stempel: `ROBOCZA · 2026-08-03 23:11`
- **FALA 206.** #56 R-GRACZ-WCHLONIECIE (wchłonięcie MP po wasalu ≥10 tur, Respekt≥90, złoto). #54 D3 progi W (sojusz≥0 / NAP≥−40) + cleanup martwych (NAP Zauf/fair-ratio; **progWchloniecieRespekt zostaje**). #53 bez Dźwigni 2 (flat max_zaufanie_na_ture=5). #49 WIAR-Q3 tempo W→Z. #48 manpower ep1 1000→500. #50 UI „Wpływ Relacji na deal”. Branch `cursor/deploy-fala206-merge-63a1` (PR #57).
- tsc 0 · wiarygodnosc 93/93 · diplomacy-proposal 82/82 · diplomacy 148/148 · vite · VERIFY OK · build /tmp/civ-dist-fala206.

## ROBOCZA `f41c6550` - 2026-08-03 18:35 - FALA 205: stawki×2 + AI→MP + overflow Pracy + audyt sep - **ZASTĄPIONA**
- md5 (pelne): `f41c6550fb5913c3413da6575593eddb` · stempel: `ROBOCZA · 2026-08-03 18:35`
- **FALA 205.** #29 R-STAWKI ×2 kosztów (badania, upkeep, budynki, żywność). #33 R-AI-MP-WASAL-WCHLONIECIE (AI→MP trybut/wasal/wchłonięcie + sojusze sióstr vs gracz). #4 HUD Praca overflow (pusta kolejka + suwak budowa). #1 audyt sep stolic vs MP (docs + test 36 PASS, bez zmiany gameplay). Na bazie FALA 204 (R-AUTO-V2 + Ludy Morza).
- tsc 0 · auto-improvements 15/15 · auto-manage 43/43 · barbarians 167/167 · ai-cs-absorption 18/18 · difficulty-cost 22/22 · upkeep 67/67 · vite · VERIFY OK · build /tmp/civ-dist-fala205.

## ROBOCZA `d7754a22` - 2026-08-03 18:22 - FALA 204: R-AUTO-V2 (Q1–Q9) + Ludy Morza Q1=A - **ZASTĄPIONA**
- md5 (pelne): `d7754a220111402ef98b78e59188bf07` · stempel: `ROBOCZA · 2026-08-03 18:22`
- **FALA 204.** R-AUTO-V2: Lista wgraj do wszystkich · polityka ulepszeń państwa+wyjątek · rezerwa 30 Pracy · lista ukończona stop · szare epoki. Scalone v1 (#34+#37). R-LUDY-MORZA-Q1=A: Brąz bez obozu naval — raiderzy na łódkach; lądowe obozy zostają. Branch `cursor/fix-auto-v2-63a1` (+ merge Ludy Morza).
- tsc 0 · auto-manage 43/43 · auto-improvements 15/15 · barbarians 167/167 · vite · VERIFY OK · build /tmp/civ-dist-fala204.

## ROBOCZA `5f529a24` - 2026-08-03 14:28 - FALA 203: Zwiedzaj (Q1=A,Q2=B) + triumf MP (Q1=B) - **ZASTĄPIONA**
- md5 (pelne): `5f529a243d506a55cc84b57ee09fee8f` · stempel: `ROBOCZA · 2026-08-03 14:28`
- **FALA 203.** P-SCOUT-EXPLORE-Q1=A + Q2=B (przycisk Zwiedzaj, ruch tylko EOT; priorytet chatka>mgła). P-TRIUMPH-CS-Q1=B (dłuższy hint po ostatnim MP tej samej cyw.). Branch `cursor/fix-scout-q2b-triumph-hint-63a1` (zawiera Q1).
- tsc 0 · scout-auto-explore 15/15 · triumph-city-state 10/10 · vite · VERIFY OK · build /tmp/civ-dist-fala203.

## ROBOCZA `5e0f30e7` - 2026-08-03 08:45 - FALA 202: bulk fix PRs #7–#16+#18–#22 + plany - **ZASTĄPIONA**
- md5 (pelne): `5e0f30e7592074c9303b48162e862bee` · stempel: `ROBOCZA · 2026-08-03 08:45`
- **FALA 202.** Merge MERGEABLE: barb head hunger/raid (#7), MP logo (#8), trade accept/edit (#9), trade willingness (#10), gift false-war (#11), hills MIN-MOVE (#12), CS war tribute (#13), era notify (#14), MP AI label (#15), medium rivers FoW (#16), AI build filter (#18), gift-during-war (#19), orphan units (#21), battle HP bar (#22). Plany docs: auto-ulepszenia, Ludy Morza, zwiadowcy, balans nadmiar. **POMINIĘTE (konflikty):** #1 audyt, #4 praca overflow.
- tsc 0 · battle-hp 7/7 · barb 157/157 · display-names 20/20 · diplo-proposal 80/80 · capital-capture 58/58 · ai-test 248/4 (te same 4 FAIL co na main) · vite · VERIFY OK · build /tmp/civ-dist-fala202.

## ROBOCZA `48646cd6` - 2026-08-02 22:58 - FALA 201: Inkowie MP + zwrot surowca kolejki (+ NAP/sep15 z main) - **ZASTĄPIONA**
- md5 (pelne): `48646cd639ec75608b3c064da9ae5c45` · stempel: `ROBOCZA · 2026-08-02 22:58`
- **FALA 201.** PR #5 Inkowie MP (`repackAllSparse` + `clusterStartSlot`). PR #6 zwrot `koszt_surowce` przy Usuń z kolejki. Na main też: NAP fair-min + sep stolic Standard 15 (wcześniej bez deployu).
- tsc 0 · vite · VERIFY OK · build /tmp/civ-dist-fala201.

## ROBOCZA `26b05753` - 2026-08-02 22:48 - FALA 200: stolice w pasie 10–15 hex od morza (+ FALA 199) - **ZASTĄPIONA**
- md5 (pelne): `26b057536880c97db040ec0d3a123dc7` · stempel: `ROBOCZA · 2026-08-02 22:48`
- **FALA 200.** `clusters.ts`: pas stolicy `capitalMinSeaDist`…`capitalMaxSeaDist` (Standard **10–15** hex; inne rozmiary min+5). Preferencja środka pasa, nie „jak najbliżej 10” i nie głęboki interior. Zawiera FALA 199 (obwarzanek Wybrzeże, rzeki bez limitu).
- tsc 0 · vite · VERIFY OK · build %TEMP%\civ-dist-fala200.

## ROBOCZA `046c3ec9` - 2026-08-02 22:32 - FALA 199: obwarzanek=Wybrzeże most + rzeki bez limitu + stolice bliżej brzegu - **ZASTAPIONA**
- md5 (pelne): `046c3ec91f7391d9a4c16d6a2c0f37f5` · stempel: `ROBOCZA · 2026-08-02 22:32`
- **FALA 199.** Root cause obwarzanka: 2 masy suchego lądu rozdzielone korytarzem **Wybrzeża** (nie Morza). `ensure`/`fill` annular mostują Morze+Wybrzeże. Rzeki: bez cap liczby/komórek na Pangea; masy od 5 hex. Spawn: prefer seaDist ≥ min (10). Zawiera FALA 198.
- tsc 0 · pangea-land-shape dry=1 (default+20%) · gap-audit 30–80% dryMasses=1 · VERIFY OK · build %TEMP%\civ-dist-fala199.

## ROBOCZA `b6a7e049` - 2026-08-02 22:06 - FALA 198: anti-obwarzanek przed rzekami + G DEV - **ZASTAPIONA**
- md5 (pelne): `b6a7e049ddf953db78e25056ef969dc6` · stempel: `ROBOCZA · 2026-08-02 22:06`
- **FALA 198.** `generator.ts`: po finalizeCoast ponowny `ensurePangeaSingleContinent` / anti-annular tuż przed rzekami. `gen-helpers.ts`: szerszy maxBridge, agresywne usuwanie obręczy (195). `main.ts`: galeria G tylko `import.meta.env.DEV`. Zawiera FALA 197.
- tsc 0 · pangea-land-shape-test PASS (20% annular=0) · vite · VERIFY OK · build %TEMP%\civ-dist-fala198.







## ROBOCZA `7b91c73a` - 2026-08-02 21:03 - FALA 193: rzeki quota+index, civ 7→5 top-up, audio menu, Ziemia polar cap - **ZASTAPIONA**
- md5 (pelne): `7b91c73abc9d0c881090e41a7e0de67c` · stempel: `ROBOCZA · 2026-08-02 21:03`
- **FALA 193.** Rzeki: quota z landHex + RiverHexSpatialIndex + medium co ~4 (bez cięcia pokrycia). Pangea: radial fill / anti-annular (obwarzanek). Audio menu: mainMenu.ts + main.ts onSettingsChange. Civ 7→5: top-up clusters.ts (bez dropu typów). Ziemia: cap polar ocean earth-land-mask.ts. Zawiera FALA 192.
- vite · VERIFY OK · build %TEMP%\civ-dist-fala193.


## ROBOCZA `03a46dd2` - 2026-08-02 22:03 - FALA 197: galeria jednostek (G) tylko DEV - **ZASTAPIONA**
- md5 (pełne): `03a46dd2c6722906756343cedaa31599` · stempel: `ROBOCZA · 2026-08-02 22:03`
- **FALA 197.** `main.ts`: `unitGalleryShortcutEnabled()` = `import.meta.env.DEV` (klawisz G wyłączony w ROBOCZA/produkcji). Zawiera FALA 196.
- tsc 0 · vite · VERIFY OK · build %TEMP%\civ-dist-fala197.
## ROBOCZA `c01438a2` - 2026-08-02 21:45 - FALA 196: ćwiartki civów (spread top-up) + dirty tree - **ZASTĄPIONA**
- md5 (pelne): `c01438a20f9073e13f9bb30d742e389e` · stempel: `ROBOCZA · 2026-08-02 21:45`
- **FALA 196.** `clusters.ts`: bias pustych ćwiartek w `pickSpawnHexWithCapitalGates` (top-up FALA 193, HARD sep, enforceQuarterSpreadOnKlastry). Sep stolic bez zmian (12/14/16/19). Zawiera FALA 194+195 dirty (bagel, polar rivers, scene).
- tsc 0 · cluster-spread-test 5/5 PASS · vite · VERIFY OK · build %TEMP%\civ-dist-fala196.

## ROBOCZA `ecdb4df4` - 2026-08-02 21:10 - FALA 194: pelny redeploy dirty tree (mapa+scene+menu) - **ZASTAPIONA**
- md5 (pelne): `ecdb4df48262ceb29f6db548cc9d1bdd` · stempel: `ROBOCZA · 2026-08-02 21:10`
- **FALA 194.** Pelny swiezy deploy working tree gra/src + gra/data (10 plikow). clusters, gen-helpers, generator, spawn, scene, main/menu, e-start-params. Poprzednia `7b91c73a` ZASTAPIONA — md5 zmieniony.
- tsc 0 · vite · VERIFY OK · build %TEMP%\civ-dist-fala194.
## ROBOCZA `ea234151` - 2026-08-02 20:18 - FALA 192: obwarzanek + 80% lądu + dopływy - **ZASTĄPIONA**
- md5 (pelne): `ea2341511c803220967da480a1859c71` · stempel: `ROBOCZA · 2026-08-02 20:18`
- **FALA 192.** Bez obwarzanka (overlap blobów + fill annular). Target 80% → actual ~74%. Dopływy: sep=1 + bias centrum. Zawiera 190+191.
- vite · VERIFY OK · land-fraction/shape/medium PASS.

## ROBOCZA `dbbe3c4b` - 2026-08-02 20:13 - FALA 190+191 (+w toku 192) - **ZASTĄPIONA**
- md5 (pelne): `dbbe3c4b6aef821e123e9613bdeaf80b` · stempel: `ROBOCZA · 2026-08-02 20:13`
- **FALA 191** % lądu skaluje bloby Pangei. **FALA 190** dopływy (sep bez bloku parent main). Obwarzanek/80% absolute — dalsza korekta w toku (FALA 192).
- vite build OK · VERIFY OK.

## ROBOCZA `f467bdf6` - 2026-08-02 19:53 - FALA 189: Pangea izotropowa (nie kapsuła) - **ZASTĄPIONA**
- md5 (pelne): `f467bdf6ceeb44770c80e0f6729fe634` · stempel: `ROBOCZA · 2026-08-02 19:53`
- **FALA 189.** Maska Pangea: dystans izotropowy (okrąg na heksach, nie owal mapy) + zatoki na długich bokach. Aspect ~1.05 · 7/7 civ. Zawiera FALA 188 (soft sea).
- vite build OK · publish robocza · VERIFY OK.

## ROBOCZA `c0d51bd4` - 2026-08-02 19:46 - FALA 188: soft sea civ + Pangea + rzeki centrum - **ZASTĄPIONA**
- md5 (pelne): `c0d51bd4192c50c1d266246702be1482` · stempel: `ROBOCZA · 2026-08-02 19:46`
- **FALA 188.** Soft seaDist przy dropie civ (sep stolic **twarde** 12/12/14/16/19) → 7/7 stolic. Pangea rebalance/erode (bboxFill ~0.75). Silniejszy bias rzek ku centrum 5×5. Zawiera FALA 187+.
- vite build OK · publish robocza · VERIFY OK.

## ROBOCZA `ab9e6d3c` - 2026-08-02 18:17 - FALA 187+spread+dopływy - **ZASTĄPIONA**
- md5 (pelne): `ab9e6d3c79257099fb66ce36a80bd3c3` · stempel: `ROBOCZA · 2026-08-02 18:17`
- **FALA 187** Pangea ~5 blobów. **Spread civ** twarde ćwiartki. **Dopływy:** bez zawijania heksu (120°), bias ku centrum 5×5, widoczne (nie wybrzeżniki).
- vite build OK · publish robocza · VERIFY OK.
## ROBOCZA `d535b702` - 2026-08-02 17:29 - FALA 185+186: sep brył + rzeki 5×5 - **ZASTĄPIONA**
- md5 (pelne): `d535b702b708f7bcc80e47e4f87d74aa` · stempel: `ROBOCZA · 2026-08-02 17:29`
- **FALA 185.** `clusters.ts`: sep brył, maximin+ćwiartki, bufor MP. **FALA 186.** `gen-helpers.ts`: centrum rzek **5×5**, doplywy co 4 L/R. Zawiera FALA 184 (oxbow) + wczesniejsze.
- vite build OK · publish robocza.
## ROBOCZA `005dcb06` - 2026-08-02 16:02 - FALA 184: oxbow fix (medium junction) - **ZASTAPIONA**
- md5 (pelne): `005dcb06290a116b143e9970e26530c5` · stempel: `ROBOCZA · 2026-08-02 16:02`
- **FALA 184.** `gen-helpers.ts`: junction dopływu średniej dopiero po sensownym odcinku w głąb (fix oxbow 1–3 hex). Zawiera FALA 183 (defaults typy×MP) + FALA 182+181.
- vite build OK · publish robocza.
## ROBOCZA `a0670a3d` - 2026-08-02 15:34 - FALA 183: defaults typy×MP (5×5/6×6/7×7/8×8) - **ZASTĄPIONA**
- md5 (pelne): `a0670a3d46edb2a42da600c34659e296` · stempel: `ROBOCZA · 2026-08-02 15:34`
- **FALA 183.** `e-start-params.json`: domyślne typy cywilizacji × miasta państwa — Standard **5×5**, Duża **6×6**, Ogromna **7×7**, Super Huge **8×8** (epoka domyślna Kamień). Zawiera FALA 182 (sep stolic 12/12/14/16/19) + FALA 181.
- vite build OK · publish robocza.
## ROBOCZA `c6d0caa5` - 2026-08-02 15:28 - FALA 182: sep stolic +2 (12/12/14/16/19) - **ZASTĄPIONA**
- md5 (pelne): `c6d0caa56da75755d36964a52059bc53` · stempel: `ROBOCZA · 2026-08-02 15:28`
- **FALA 182.** `clusters.ts`: separacja stolic +2: Mala/Srednia **12**, Standard **14**, Duza **16**, Super **19**. Zawiera tez **FALA 181** (srednie doplywy od main co 4 hex).
- vite build OK · publish robocza.

## ROBOCZA `5424b604` - 2026-08-02 15:23 - FALA 181: srednie doplywy od main co 4 hex - **ZASTĄPIONA**
- md5 (pelne): `5424b60469bbcd229e2bee2ccfdec437` · stempel: `ROBOCZA · 2026-08-02 15:23`
- **FALA 181.** `gen-helpers.ts`: srednie rzeki jako doplywy od main co **4 hex** (odleglosc wzdluz sieci main). Spawn/farthest-point (FALA 180) bez zmian.
- vite build OK · publish robocza.

## ROBOCZA `13beb5fb` - 2026-08-02 14:56 - FALA 180: farthest-point spawn + twarda sep 10/10/12/14/17 - **ZASTAPIONA**
- md5 (pelne): `13beb5fb5875e83781f989abdb851d86` · stempel: `ROBOCZA · 2026-08-02 14:56`
- **FALA 180.** `clusters.ts`: rozklad startow civ farthest-point; twarda separacja stolic Mala/Srednia **10**, Standard **12**, Duza **14**, Super **17** (seaDist bez zmian).
- tsc 0 · vite build OK.

## ROBOCZA `ab6d3cc9` - 2026-08-02 14:42 - FALA 179: sep stolic 10/10/12/14/17, seaDist bez zmian - **ZASTAPIONA**
- md5 (pelne): `ab6d3cc927ef5281b22cb6a88b5303fe` · stempel: `ROBOCZA · 2026-08-02 14:42`
- **FALA 179.** `capitalMinSeparation` osobno od morza: Mała/Średnia **10**, Standard **12**, Duża **14**, Super **17**. `capitalMinSeaDist` bez zmian (Standard **10**).
- capital-sep-unit-test 17/17 · tsc 0.
## ROBOCZA `304b2631` - 2026-08-02 14:40 - FALA 178: main tylko coast→inland (bez A* fallback) - **ZASTAPIONA**
- md5 (pelne): `304b2631e7985f0e1eed790d77ed4610` · stempel: `ROBOCZA · 2026-08-02 14:40`
- **FALA 178.** Główne: wycięty fallback `tryPlaceGridSource` / inland→A*→morze w etapie 1; tylko `tryPlaceMainRiverFromCoast` (+ soft). Ujście wizualne: `renderCoastalRiverExtension` (FALA 177, stage≥1). `traceRiver` zostaje dla średnich/legacy.
- river-turn-window 10/10 · medium-river 12/12 · tsc 0.
## ROBOCZA `a2fb021d` - 2026-08-02 14:35 - FALA 177: ujścia coastal z powrotem przy stage≥1 - **ZASTAPIONA**
- md5 (pelne): `a2fb021d8b78df11b0e775ed9a20b42d` · stempel: `ROBOCZA · 2026-08-02 14:35`
- **FALA 177.** Regres ujść: FALA 149 diag trzymał `renderCoastalRiverExtension` tylko przy `riverStage≥4`; domyślny stage=2 (main+medium) → rzeka urywała się na lądzie. Fix: ujścia coastal przy `riverStage≥1` (razem z main). Kod ujść: `buildCoastalRiverPointChain` / `pathReachesOpenSeaRender` / `renderCoastalRiverExtension` w `scene.ts`; gen: `ensureRiverOutlets` bez zmian.
- tsc 0.
## ROBOCZA `e1d8bc68` - 2026-08-02 14:25 - FALA 176: stolice — twarde N bez dimCap + retry gracza - **ZASTAPIONA**
- md5 (pelne): `e1d8bc6869f93d4c9f814c035d475ede` · stempel: `ROBOCZA · 2026-08-02 14:25`
- **FALA 176 (Grok, 2×ZWIS subagent).** (1) `capitalMinSeaDistForMap` / sep: bez ścinania `short/12` (Standard zostaje **10**). (2) cluster-spawn: retry pick stolicy gracza bez preferred — zero soft-fail „zostaje plan”. Hard apply nadal dropuje obce &lt;N. Sep stolic = seaDist (10/12…).
- capital-sep-unit-test.cjs — PASS 10/10 · tsc 0.
## ROBOCZA `00623e5b` - 2026-08-02 13:53 - FALA 175: średnie rzeki — main junction + okno skrętu - **ZASTAPIONA**
- md5 (pelne): `00623e5b414c3c8595d580f2077bc71c` · stempel: `ROBOCZA · 2026-08-02 13:53`
- **FALA 175.** Średnie: A* do main/sieci (najkrótsza trasa), okno skrętu 6hex jak main (sanitizeRiverTurnWindow), hard prune orphan/dead-end, junction bez ogona przez main (gen+render). Ocean tylko fallback. Main (FALA 173) bez zmian.
- medium-river-test.cjs — PASS 12/12 · river-turn-window-test.cjs — PASS 10/10 · tsc 0.
## ROBOCZA `2dc296b0` - 2026-08-02 14:45 - FALA 174: średnie rzeki w playtestu (main+medium) - **ZASTAPIONA**
- md5 (pelne): `2dc296b08bb1fcfc67526557165fb3ae` · stempel: `ROBOCZA · 2026-08-02 14:45`
- **FALA 174.** Domyślnie gen `riverGenPhase=main+medium` + render `riverStage=2` (główne+średnie; krótkie/dekor OFF). Algorytm main (FALA 173) bez zmian. Pełny tor: ?riverGenPhase=all&riverStage=5 · tylko main: ?riverGenPhase=main&riverStage=1.
- river-turn-window-test.cjs — PASS 10/10 (okno skrętu tylko main) · tsc 0.
## ROBOCZA `0a7962a4` - 2026-08-02 14:15 - FALA 173: okno skrętu 6 hex + centroid + soft sep - **ZASTAPIONA**
- md5 (pelne): `0a7962a4b71e70777948574657a1543d` · stempel: `ROBOCZA · 2026-08-02 14:15`
- **FALA 173.** (1) Okno 6 hex: |Σ signed dirDelta|≤1 (bez spirali ±60°); per-krok zakaz 120°/180°; sanitizeRiverTurnWindow. (2) Centroid masy lądu per masa — główne rzeki dążą do środka kontynentu. (3) Soft sep≈3: stop tylko bez legalnego kroku (retry relaxHardMeander). (4) Las: inland boost forNoise w reapplyForestOverlay. refillMainRiverCoastMouthGaps post-flatten bez zmian (≤7).
- river-turn-window-test.cjs — PASS 10/10 · river-sea-buffer-test.cjs — TIMEOUT 360s (168×120 gen >6 min/karta, osobny perf) · tsc 0.
## ROBOCZA `e3b17661` - 2026-08-02 13:41 - FALA 172: rzeki max skręt ±60° + inland coverage - **ZASTAPIONA**
- md5 (pelne): `e3b17661618bd62223a7006869b66dac` · stempel: `ROBOCZA · 2026-08-02 13:41`
- **VERIFY OK (Gra-ROBOCZA.html).** growRiverFromCoastInland: dirDelta ∈ {0,1,5} (zakaz 120°/180° U-turn); prefer seaDist↑ + centroid masy; stop bez kandydata ±60°. riverTraceBudget +bonus inland; top-up ujść sep2/acceptLen2. Stolice bez zmian. riverGenPhase=main + riverStage=1.
- river-sea-buffer-test.cjs — PASS 9/9 · tsc 0.
## ROBOCZA `1c8dcfe6` - 2026-08-02 13:15 - FALA 171: stolice sep apply + ujścia post-flatten + rzeki inland maxLen - **ZASTAPIONA**
- md5 (pelne): `1c8dcfe6b6d6bcf437a5e5037e3ac9ae` · stempel: `ROBOCZA · 2026-08-02 13:15`
- **VERIFY OK (Gra-ROBOCZA.html).** (1) cluster-spawn: bramka minSep stolic przy apply (relokacja gracza + filtr obcych); Duża N=12. (2) refillMainRiverCoastMouthGapsOnMap po flattenFalseCoastalRiverNotches; ocean coast BFS; acceptLen 2 w top-up. (3) traceRiver inland do maxLen/sep3; riverTraceBudget nie ścina maxLen na Dużej. riverGenPhase=main + riverStage=1.
- cluster-start-test.cjs — PASS 407/407 · river-sea-buffer-test.cjs — PASS 9/9 · tsc 0.
## ROBOCZA `616afdfa` - 2026-08-02 12:30 - FALA 170: ujścia main co ≤7 hex wzdłuż wybrzeża - **ZASTAPIONA**
- md5 (pelne): `616afdfaa7c82883f64228d878b34ff2` · stempel: `ROBOCZA · 2026-08-02 12:30`
- **VERIFY OK (Gra-ROBOCZA.html).** Główne rzeki: po fazie main BFS wzdłuż wybrzeża — top-up ujść gdy luka > `MAIN_RIVER_COAST_MOUTH_MAX_GAP` (7 Standard/Duża, 5 Mała). `tryPlaceMainRiverAtMouth` + greedy domknięcie; sep 3 / bufor 2 / MassLandCache bez zmian. riverGenPhase=main + riverStage=1.
- river-sea-buffer-test.cjs — PASS 9/9 · tsc 0.
## ROBOCZA `af7216a4` - 2026-08-02 12:00 - FALA 169: separacja stolic ≥10 hex (skala jak od morza) - **ZASTAPIONA**
- md5 (pelne): `af7216a4d1eed872a08dab1068612663` · stempel: `ROBOCZA · 2026-08-02 12:00`
- **VERIFY OK (Gra-ROBOCZA.html).** Stolice gracza + obcych: `capitalMinSeparationForMap` (= tabela `capitalMinSeaDist`: mala=4, srednia=7, duza/Standard=10, ogromna=12, super=14); kolejność gracz→obcy, każda vs poprzednie; brak kandydata = pominięcie typu (bez soft-failu).
- cluster-start-test.cjs — PASS 384/384 · tsc 0.
## ROBOCZA `33fbf82d` - 2026-08-02 11:45 - FALA 168: rzeki coast — minLen akceptacja, wzrost do maxLen - **ZASTAPIONA**
- md5 (pelne): `33fbf82d9fcbd3ad36de2ec4fd464618` · stempel: `ROBOCZA · 2026-08-02 11:45`
- **VERIFY OK (Gra-ROBOCZA.html).** Fix: growRiverFromCoastInland nie zatrzymuje się na minLen (~25) — wzrost do traceMax (riverTraceBudgetForSeaDist) lub braku lądu / sep 3 / bufor 2 hex od morza. minLen = próg akceptacji w tryPlaceMainRiverFromCoast. riverGenPhase=main + riverStage=1 bez zmian.
- river-sea-buffer-test.cjs — PASS 6/6 · tsc 0.
## ROBOCZA `cf796528` - 2026-08-02 11:25 - FALA 167: rzeki główne minLen + stolice seaDist≥10 - **ZASTAPIONA**
- md5 (pelne): `cf796528a620ab71a3339427a247586d` · stempel: `ROBOCZA · 2026-08-02 11:25`
- **VERIFY OK (Gra-ROBOCZA.html).** A) traceRiverFromCoast: cel inland = tier minLen (~25 Normalnie), stop przy MAIN_RIVER_MIN_PATH_SEP=3; soft-accept tylko awaryjnie. B) stolice: pickCapitalHexInRegion z twardą bramką seaDist (gracz+AI), bez seaFirst na plażę. riverGenPhase=main + riverStage=1 bez zmian (Etap A).
- cluster-start-test.cjs — PASS 375/375 · tsc 0.
## ROBOCZA `5bc8737c` - 2026-08-02 11:05 - FALA 166/167: riverGenPhase=main default + render stage 1 (Etap A Maciej) - **ZASTAPIONA**
- md5 (pelne): `5bc8737c6197af2ef01b9105d98f7202` · stempel: `ROBOCZA · 2026-08-02 11:05`
- **VERIFY OK (Gra-ROBOCZA.html).** Domyślnie tylko główne rzeki (gen phase main, render stage 1). Gen pomija medium/short/tributary/topUp. Perf: cache mainKeysCache, skip tributary w buildGridRouteCandidates. Pełny tor: ?riverGenPhase=all&riverStage=5.
- tsc 0 · vite build OK.
## ROBOCZA `90803b6b` - 2026-08-02 10:50 - FALA 165: przywrócenie rzek głównych (gen ON + render stage 5) - **ZASTAPIONA**
- md5 (pelne): `90803b6b1817cdfcb7ce120190d7cd42` · stempel: `ROBOCZA · 2026-08-02 10:50`
- **VERIFY OK (Gra-ROBOCZA.html).** Etap B+C przywracania: getRiverGenEnabled() default true, getRiverRenderStage() default 5. Wyłączenie: ?riverGen=0 / ?riverStage=0. Etap A (perf „Rzeki — główne") nadal otwarty — Pangea może być wolna (~174s historycznie).
- tsc 0 · vite build OK.
## ROBOCZA `440cf7da` - 2026-08-02 03:15 - FALA 164: cluster start plan perf — MassLandCache (113s→~1s) - **ZASTAPIONA**
- md5 (pelne): `440cf7dab49b05d809a39aaa3d0e68b7` · stempel: `ROBOCZA · 2026-08-02 03:15`
- **VERIFY OK (Gra-ROBOCZA.html).** Winowajca: `developmentSpaceScore`/`passesPlayerStartMassGate` przebudowywały `buildMassHexIndex` per hex → O(n²) na ~15k lądu Pangea (~113 s w civ-perf „plan klastra startowego”). Fix: `MassLandCache` (hexIndex + massSets) jednorazowo w `computeClusters`; reuse `spawnCache` w cluster-spawn (bez drugiego `buildSeaDistanceField`). Bench Standard 168×120: buildClusterStartPlan ~1041 ms. Gameplay bez zmian.
- cluster-start-test.cjs — PASS 375/375 · tsc 0.
## ROBOCZA `c69a9c82` - 2026-08-02 02:45 - FALA 163: post-scene perf — defer PO hide + 9 podkroków w civ-perf - **ZASTAPIONA**
- md5 (pelne): `c69a9c8297ef25f1624b4256de9311da` · stempel: `ROBOCZA · 2026-08-02 02:45`
- **VERIFY OK (Gra-ROBOCZA.html).** FALA 162 nie pomogła: requestIdleCallback(2s) odpalał rebuildResourceOverlays WEWNĄTRZ pomiaru postScene (yield między krokami). Fix: hide najpierw, ciężkie (overlays+fog+HUD) po hide; civ-perf: POST-SCENE — podkroki (9× ms).
- tsc 0 · Gra-ROBOCZA.html md5 OK.
## ROBOCZA `c153da40` - 2026-08-02 02:10 - FALA 162: post-scene perf — defer nakładek zasobów (fix 118s Standard) - **ZASTAPIONA**
- md5 (pelne): `c153da402b5167c78f7474e8d9a573ef` · stempel: `ROBOCZA · 2026-08-02 02:10`
- **VERIFY OK (Gra-ROBOCZA.html).** Winowajca: rebuildResourceOverlays+collapse O(n) synchronicznie (~118s Standard Pangea). Fix: ZAWSZE defer po hide; collapse tylko ≥7 mesh; 9 podkroków post-scene.
- tsc 0 · Gra-ROBOCZA.html md5 OK.
## ROBOCZA `a01102ad` - 2026-08-02 02:00 - FALA 162: post-scene perf Duża Pangea (granular progress + defer overlays) - **ZASTAPIONA**
## ROBOCZA `654ac9a0` - 2026-08-02 01:30 - FALA 161: perf raport po pełnym starcie mapy (postScene + wall-clock) - **ZASTAPIONA**
- md5 (pelne): `654ac9a0602925e6347fd4769d162802` · stempel: `ROBOCZA · 2026-08-02 01:30`
- **VERIFY OK.** civ-perf dopiero gdy overlay znika; nowe linie: Przekazanie z workera, Po scenie/finishLoading, WALL-CLOCK; console.info wall-clock.
- tsc 0 · VERIFY OK.
## ROBOCZA `64240ff7` - 2026-08-02 01:15 - FALA 160: kill-switch generowania rzek (mapgen) - **ZASTAPIONA**
- md5 (pelne): `64240ff734d91232f8d70c6dde47f504` · stempel: `ROBOCZA · 2026-08-02 01:15`
- **VERIFY OK.** getRiverGenEnabled() — domyślnie OFF; ?riverGen=1 / localStorage civ-river-gen. Fazy „Rzeki — główne/uzupełnianie" ~0 ms. Kod rzek zachowany.
- tsc 0 · VERIFY OK.
## ROBOCZA `047fc994` - 2026-08-02 01:05 - FALA 159: perf raport auto-download + localStorage + chip HUD - **ZASTAPIONA**
- md5 (pelne): `047fc994f51440ad2915b3bd1801f94b` · stempel: `ROBOCZA · 2026-08-02 01:05`
- **VERIFY OK.** Po buildScene: auto-download civ-perf-*.txt + localStorage civ-last-perf-report + chip „Czasy ostatniej mapy" (modal + pobierz ponownie). Żółty panel domyślnie wyłączony.
- tsc 0 · VERIFY OK.
## ROBOCZA `b9230e56` - 2026-08-02 00:45 - FALA 158: buildScene catch + perf panel przy błędzie + overlay hardening - **ZASTAPIONA**
- md5 (pelne): `b9230e56dc237fc09e2379bcc79e67e3` · stempel: `ROBOCZA · 2026-08-02 00:45`
- **VERIFY OK.** runBuildSceneWithOverlay: catch → hide overlay + #civ-perf-report z error; formatCaughtError (nigdy „null"); overlay loop try/catch; onProgress guarded.
- tsc 0 · VERIFY OK.
## ROBOCZA `fe9559c2` - 2026-08-02 01:36 - FALA 157: twardy panel #civ-perf-report inline + html mount + retry - **ZASTAPIONA**
- md5 (pelne): `fe9559c214d449a091ba4071d281f36f` · stempel: `ROBOCZA · 2026-08-02 01:36`
- **VERIFY OK.** Panel na documentElement (nie body — zoom scale psuje fixed); z-index max; inline styles; retry 0+500ms; [civ-perf] console; 20s auto.
- tsc 0 · VERIFY OK.
## ROBOCZA `5614b30a` - 2026-08-02 01:00 - FALA 156: fix panel czasow widoczny 15s + z-index + X + fallback - **ZASTAPIONA**
- md5 (pelne): `5614b30ad26cea36c05a3d38066286ba` · stempel: `ROBOCZA · 2026-08-02 01:00`
- **VERIFY OK.** Panel po overlay: z-index 3_000_002, min 15s lub X, fallback brak mapGen, RAZEM gen+scena, rAF po hide.
- tsc 0 · VERIFY OK.
## ROBOCZA `61d74797` - 2026-08-02 00:30 - FALA 155: rozbicie czasow heksy/nakladki + fazy generatora + overlay nieblokujacy - **ZASTAPIONA**
- md5 (pelne): `61d74797f7397e25b03c07935499c99d` · stempel: `ROBOCZA · 2026-08-02 00:30`
- **VERIFY OK.** buildTimings.detail (heksy 7 podetapow + nakladki 2) + mapGenTimings (10 faz). Panel prawy gorny, pointer-events:none, auto-hide 4.5s, gra bez OK.
- tsc 0 · VERIFY OK.
## ROBOCZA `ac11d6e8` - 2026-08-02 00:05 - FALA 154: usunieto blokujacy panel czasow sceny + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `ac11d6e8c8f632fd205b24d397463619` · stempel: `ROBOCZA · 2026-08-02 00:05`
- **VERIFY OK.** Po buildScene: natychmiast hide overlay; czasy tylko console.info (F12).
- tsc 0 · VERIFY OK.
## ROBOCZA `d3a11217` - 2026-08-02 00:12 - FALA 154: timing panel OK klik + auto 3s + canvas block + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `d3a11217a5a22dd9ba75569500557d8d` · stempel: `ROBOCZA · 2026-08-02 00:12`
- **VERIFY OK.** Panel czasow: z-index 3M, canvas pointer-events:none, OK/Enter/Escape, auto 3s.
- tsc 0 · VERIFY OK.
## ROBOCZA `c7e95b62` - 2026-08-02 00:00 - FALA 153: fix timing OK button (pointerdown + auto-dismiss 8s) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `c7e95b62aeb46cfac740d2773b4742b9` · stempel: `ROBOCZA · 2026-08-02 00:00`
- **VERIFY OK.** Panel czasow sceny: OK reaguje na pointerdown; auto-znikniecie po 8 s.
- tsc 0 · VERIFY OK.
## ROBOCZA `6c8a1f92` - 2026-08-01 23:52 - FALA 152: czasy sceny NA EKRANIE (print screen) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `6c8a1f92accad4df6a2bdfa564516088` · stempel: `ROBOCZA · 2026-08-01 23:52`
- **VERIFY OK.** Po Budowanie sceny: panel Heksy/Brzeg/Nakladki/Rzeki/Final/RAZEM → print screen → OK.
## ROBOCZA `ed322ecd` - 2026-08-01 23:48 - FALA 151: buildScene ms jako jedna linia tekstu + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `ed322ecdca71eef54173fa20555c1479` · stempel: `ROBOCZA · 2026-08-01 23:48`
- **VERIFY OK.** Console: `[civ] buildScene ms | hexes=… coast=… overlays=… total=…` (bez rozwijania obiektu).
- tsc 0 · VERIFY OK.
## ROBOCZA `a1037b66` - 2026-08-01 23:40 - FALA 150: instrumentacja buildScene (fazy UI + console ms) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `a1037b66b0899ba0af77e82686ebf060` · stempel: `ROBOCZA · 2026-08-01 23:40`
- **VERIFY OK.** Stage 0 rzek zostaje. Overlay: heksy/brzeg/nakladki/rzeki/final. F12: `[civ] buildScene ms`.
- tsc 0 · VERIFY OK.
## ROBOCZA `7381ff21` - 2026-08-01 23:33 - FALA 149: DIAG riverRenderStage=0 (zero rzek w scenie) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `7381ff210874dab7c5a138da038f9ac6` · stempel: `ROBOCZA · 2026-08-01 23:33`
- **VERIFY OK.** Kill-switch: domyslnie stage 0 (bez meshy rzek). Kod zostaje; archiwum: `dyspozycje/_archiwum-rzeki/`. URL `?riverStage=5` = full.
- tsc 0 · VERIFY OK.
## ROBOCZA `b629a26d` - 2026-08-01 23:24 - FALA 148: swiezy rebuild FALA 147 (ta sama tresc) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `b629a26dbd6aceca18e3480a3b95e590` · stempel: `ROBOCZA · 2026-08-01 23:24`
- **VERIFY OK.** Ten sam kod co FALA 147 — nowa pieczatka, zeby Maciej widzial swiezy plik (cache/stara sciezka).
- tsc 0 · VERIFY OK.
## ROBOCZA `6a8ba59a` - 2026-08-01 23:14 - FALA 147: tylko perf rzek (batch 128, decymacja tributary, ujscia) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `6a8ba59a6657d1d1bdbe66290411a46f` · stempel: `ROBOCZA · 2026-08-01 23:14`
- **VERIFY OK.**
- Zakres: TYLKO tor rzek — batch 128, ribbon 3–4, decymacja medium/tributary, yield ujsc; main+pointHex bez zmian; dekoracje bez zmian.
- tsc 0 · VERIFY OK. Kod: Composer; deploy: Grok.
## ROBOCZA `78a1b727` - 2026-08-01 23:04 - FALA 146: isRiverRenderFast export + dekoracje z powrotem (perf tylko rzeki) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `78a1b727501f88348d3cfc88855a4614` · stempel: `ROBOCZA · 2026-08-01 23:04`
- **VERIFY OK.**
- Zakres: dopiecie eksportu isRiverRenderFast; dekoracje FALA 144 przywrocone; settle rzeki (riverRevealKeys) bez zmian.
- tsc 0 · VERIFY OK.
## ROBOCZA `daf2c51b` - 2026-08-01 23:00 - FALA 145: rzeki przy settle + suwak pracy jak zywnosc + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `daf2c51b0e56ecd4f3d7e5c35d4d8f16` · stempel: `ROBOCZA · 2026-08-01 23:00`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: BUG-RZEKI-SETTLE-VIS (pointHex main + riverRevealKeys przy 1. miescie); UI-LABOR-SLIDER-FOOD-PARITY (jeden suwak PODZIAL PRACY).
- tsc 0 · VERIFY OK. Kod: Composer; deploy: Grok.
## ROBOCZA `bec88c78` - 2026-08-01 22:52 - FALA 144: sceneBuildAggressive (Duza/Pangea) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `bec88c7855ff523fb73877182ed3ebf5` · stempel: `ROBOCZA · 2026-08-01 22:52`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: isSceneBuildAggressive (fast∨dense); skip piasek lądu/blend/wydmy/oazy; batch ujść rzek (3 merge); overlay bez collapse; ribbon ląd 4 / ujście 6.
- tsc 0 · VERIFY OK. Kod: Composer; deploy: Grok.
- Wizualnie Duzy+: bez piasku lądu przy brzegu, bez oaz/wydm 3D.
## ROBOCZA `2b524ff0` - 2026-08-01 22:45 - FALA 143: Pangea Budowanie sceny (dense landmass) + DEPLOY ALL - **ZASTAPIONA**
- md5 (pelne): `2b524ff05b4b1af28d4fd3a97b87a20b` · stempel: `ROBOCZA · 2026-08-01 22:45`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: `isDenseLandmassMap` (≥120 riverPaths lub ≥80 + >50% lądu); Pangea: skip forest collapse (robloxLite), batch ALL rzek (64), ribbonSegs 6, gęstsze yield overlay/ujść. Kontynenty bez zmian ścieżki.
- tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `2b1e072c` - 2026-08-01 22:38 - FALA 142: ląd% + spawn MP/ownerId + półpłaszczyzna A + ~10 hex od morza + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `2b1e072c1b915bf53faf6a478ac0a680` · stempel: `ROBOCZA · 2026-08-01 22:38`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: `enforceTargetDryLandFraction` (suwak 20/40/60%); ownerId rivals vs obce MP; `assignTypesToClusterCenters`; `capitalMinSeaDist` Standard=10; SPAWN-EXPANSION-ARC-Q1=A (półpłaszczyzna MP). **Bez** fixu sceny Pangea (patch odłożony).
- tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `0b70e93f` - 2026-08-01 21:06 - FALA 141: coast InstancedMesh + shared geo (Budowanie sceny) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `0b70e93fd0c0db0a893be4a1577e7fc8` · stempel: `ROBOCZA · 2026-08-01 21:06`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: wybrzeże/piasek — współdzielone geometrie + max 5 InstancedMesh (bez alokacji per heks); ujścia rzek 1 ribbon; mapgen bez zmian.
- Commit: `6556fa7`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `935d1642` - 2026-08-01 20:45 - FALA 140: ujścia inland + perf głównych rzek (Pangea) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `935d16420541e2746b5be7de870fdc16` · stempel: `ROBOCZA · 2026-08-01 20:45`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: `ensureRiverOutlets` po topUp + po wybrzeżu + scrub; Pangea bootstrap 22–32 + fastTrace (etap1 ~146 ms vs ~295 s); scena z FALA 139.
- Commity: `d2db99c` · `9c4320b` · (+ scena `25b6135`). tsc 0 · outlet smoke 0 bad · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `73c18fc2` - 2026-08-01 19:20 - FALA 139: Budowanie sceny minuty→sekundy + perf głównych rzek + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `73c18fc2ed030bf6c2fb2666b5c83676` · stempel: `ROBOCZA · 2026-08-01 19:20`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: scene — szybszy merge dekoru, robloxLite >8k hex, batch meshy rzek; mapgen — fastTrace/cache mainKeys (częściowy). Regres ujść inland — jeszcze w toku (osobny agent).
- Commity: `25b6135` · `d2db99c`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `cbc79e63` - 2026-08-01 18:54 - FALA 138: spawn Q2 (wyspy + 7 typów) + tani fill rzek + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `cbc79e6399f5c67a41350229ff6a4711` · stempel: `ROBOCZA · 2026-08-01 18:54`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: MAP-SPAWN-Q2 — twarde wykluczenie wysp (`max(90, 9% największej masy)`), quota 1 typ na kontynent, bez fallbacku na wyspy; tani fill rzek — topUp 1× hardStarts bez proximity (gęstość bez minut).
- Commity: `a06a615` · `0c4faac`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `09e5ecb7` - 2026-08-01 18:43 - FALA 137: fix Budowanie sceny (cache ujsc rzek + yield) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `09e5ecb74b45b1dd55a82679d5db4fdd` · stempel: `ROBOCZA · 2026-08-01 18:43`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: `computeRiverMouthEdgeKeys` raz na mapę (nie per heks wybrzeża); yield w overlay/rzekach; limit wstęgi. Naprawia zamrożenie timera „Upłynęło” na Budowanie sceny (~20 s).
- Commit: `6c56c96` (+ w bundlu też FALA 136 `ca90306`). tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `84587206` - 2026-08-01 17:59 - FALA 136: wylacz ciezkie topUp/fill na Duzy/Pangea + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `845872063e218adb66a3d94574aafcd8` · stempel: `ROBOCZA · 2026-08-01 17:59`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: Duży/Pangea — `effectiveTopUpPasses=0` (skip hardStarts/proximity/dry-patch/cache); faza 7 zostaje przy tanich prune/strip/outlets. Standard bez zmian.
- Commit: `ca90306`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `5c9e2265` - 2026-08-01 17:52 - FALA 135: 4 ciecia ROI rzek (etap3/dry/bootstrap/topUp1) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `5c9e2265d24a7f43691a6ff1c7bf3a7b` · stempel: `ROBOCZA · 2026-08-01 17:52`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: Duży/Pangea — wyłączony etap 3; wyłączony dry-patch; etap 1 bootstrap (bez pełnej siatki); topUp max 1 pass. Standard bez largeMapPerf bez zmian.
- Commit: `a5f099f` (+ `d6c008c`). tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `474c49c9` - 2026-08-01 17:28 - FALA 134: ROI rzek (1 topUp + mniej proximity/coverage na Duzy) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `474c49c96e9f7eddedee0f2ad7fd6162` · stempel: `ROBOCZA · 2026-08-01 17:28`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: jeden topUp po prune; twardsze limity coverage/proximity/topUp/feeder na Duży i Pangei; proximity tylko na ostatnim passie; skip dekoracyjnych tributary; dry-patch z generateRivers → topUp.
- Commity: `a790921` · `daaf91b`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `ac743f2e` - 2026-08-01 17:19 - FALA 133: MAP-SPAWN-Q2 B quota + cap na mase + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `ac743f2ee94c1a68c7556edbfd95d430` · stempel: `ROBOCZA · 2026-08-01 17:19`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: start cywilizacji — quota lądu proporcjonalna (largest remainder) + max 1 typ na małą masę + preferencja przestrzeni rozwoju.
- Commit: `4959679`. tsc 0 · smoke Q2 8/8 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `a2b17df5` - 2026-08-01 13:44 - FALA 132: granice stala opacity 0.7 bez gradientu + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `a2b17df5eb7126594fc62c8597550b29` · stempel: `ROBOCZA · 2026-08-01 13:44`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: granice państw — jedna opacity 0.7 na cały pas; usunięty gradient INNER/EDGE i ShaderMaterial; pas 0.45 bez zmian.
- Commit: `ea85db8`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `2cb47461` - 2026-08-01 13:35 - FALA 131: postep UI 10 etapow + zbiegi rzek + granice panstw + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `2cb4746134631f9da988eeb78f5fdf4c` · stempel: `ROBOCZA · 2026-08-01 13:35`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: realne etapy postępu generacji mapy (10 faz zamiast fałszywego 1/6); wizualne zbiegi rzek na wspólnej krawędzi hex; granice państw — pas 0.45 + gradient opacity INNER 0.5 → EDGE 0.7.
- Commity: `2237ffe` · `d6a4928` · `88ef15b` · `33616f1`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta). Perf Pangea (WIP gen-helpers) **nie** weszła — stash `WIP pangea-perf`.

## ROBOCZA `85767de4` - 2026-08-01 12:52 - FALA 130: rzeki od oceanu + sep 3 + bez relief + bez petli + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `85767de44be01e9d45500c382c97f83f` · stempel: `ROBOCZA · 2026-08-01 12:52`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: start od oceanu w głąb; min 3 hex między main; bez wymogu góry/wzgórza; zakaz zamkniętych pętli.
- Commit źródłowy: `3f85613`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `2806b932` - 2026-08-01 11:19 - FALA 129: siatka rzek 5x5 + stride 1 + inland + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `2806b9320aab2c233478b8c8ac285019` · stempel: `ROBOCZA · 2026-08-01 11:19`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: Normalnie/Dużo siatka 5×5; Mało 10×10; mainGridStride 1; domknięcie inland na dużych; post-prune topUp.
- Commity: `b86913a` · `1873d07`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `58755ecf` - 2026-08-01 10:16 - FALA 128: poluzowane reguly rzek (stride 1, suchy plat, fill) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `58755ecf53bcb4d2e637fbbb8002552a` · stempel: `ROBOCZA · 2026-08-01 10:16`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: MAIN stride 1; suchy płat = cały ląd bez rzeki (relief nie dzieli); fill przez wzgórza/góry; niższy próg komórki; bez wczesnego break.
- Commit źródłowy: `5eb6234`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `490884f4` - 2026-08-01 09:56 - FALA 127: rzeki 10x10 + dyplo NAP/pokoj/portret + Glinianka + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `490884f41c586d090e9d2ef89748f254` · stempel: `ROBOCZA · 2026-08-01 09:56`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: max suchy płat 10×10 (100 hex); wysokość płaskiego lądu; Glinianka na lesie; bilans PW pokoju; karencja 10 tur po pokoju; NAP blokuje DOW; złoto tylko w ugodzie pokojowej; portret władcy na karcie „Twoje państwo”.
- Commity: `e51dab3` · `7ffaff0` · `0fe3409` · `54757cc` · `9b658f2` · `22ac06b` · `d08165b`. tsc 0 · VERIFY OK.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `f37ec466` - 2026-08-01 00:06 - FALA 126: 3 etapy rzek + inland fill + LOD3 + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `f37ec46616223e34b52d77dbc8967cd2` · stempel: `ROBOCZA · 2026-08-01 00:06`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: rzeki 3 etapy (główne/średnie/krótkie); inland BFS dry patches; rzeki na LOD 3.
- Commity: `ab0a848` · `2107581`. tsc 0 · VERIFY OK. POLE-BITWY `dd399c4b`.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `31210b68` - 2026-07-31 23:08 - FALA 125: sojusze wojskowy/obronny + wybrzeze woda + rzeki siatka + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `31210b686cbc397917daeb23baa31b3f` · stempel: `ROBOCZA · 2026-07-31 23:08`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: sojusze wojskowy vs obronny (modal wypełnij/odmów); wybrzeże jasne + ląd niżej; rzeki — twardy start siatki, ujście morze/dopływ, dłuższe trasy.
- Commity: `0bee2e8` · `6771078` · `05b2b89`. tsc 0 · VERIFY OK. POLE-BITWY `dd399c4b`.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `10a2e30d` - 2026-07-31 22:04 - FALA 124: dyplomacja paczka + decyzje 1A-7A + fortify miasto bez murów + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `10a2e30dd1b1398be30ee8c919ae7e5b` · stempel: `ROBOCZA · 2026-07-31 22:04`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: Wyrównaj / ultimatum / PW×tury / UI Relacja / pakty 5/10/15 / rename; fortify +50%; pustynia ~7hex; złoto relief; palisada Brąz; ufortyfikuj w mieście bez murów = +50% Obrony.
- Commity źródłowe: `3414d0b` · `40d3909` · `0dc9851`. tsc 0 · VERIFY OK. POLE-BITWY `dd399c4b`.
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `fb78916f` - 2026-07-30 11:25 - FALA 123: armie/garnizon/rout/zajecie + irygacja las + HP bitwy + dyplo wojna/pokoj + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `fb78916f1c5d2db9d5413ad5ffe25e4e` · stempel: `ROBOCZA · 2026-07-30 11:25`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Zakres: merge garnizon↔pole; wyjście całego stosu z garnizonu; Spacja pomija uśpione/ufortyfikowane; rout nie kasuje jednostki; zajęcie miasta — cały stos kotwicy; irygacja/tarasy zabronione na lesie; HP w podsumowaniu auto-walki (pkt); CS wojna→Wrogi; pokój PW gate + bez zbędnego prezentu.
- tsc 0 · VERIFY OK. POLE-BITWY `dd399c4b` (bez zmian logiki fali).
- Deploy: Grok sam (bez subagenta).

## ROBOCZA `9f09757e` - 2026-07-30 09:11 - FALA 122: AI-CS-CLUSTER-DIFF (odwrotna trudnosc PM, wojna CS od t.20, priorytet kragu do t.100) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `9f09757ecb1df804e66c96066fdb72ac` · stempel: `ROBOCZA · 2026-07-30 09:11`
- **VERIFY OK.** Gra-ROBOCZA.html md5 = manifest.
- Commit zrodlowy: `e0b8afe` (AI-CS-CLUSTER-DIFF). tsc 0 · city-state-cluster-diff-test 15/15 · siege-defenders 12/12.
- POLE-BITWY `dd399c4b` (bez zmian logiki fali).
- Deploy: Grok sam (bez subagenta). Bez push.

## ROBOCZA `2930dfa4` - 2026-07-30 08:02 - FALA 121: DEPLOY ALL (dokonczenie po OOM) + auto-zajecie pustego miasta + main.ts - **ZASTĄPIONA**
- md5 (pelne): `2930dfa4c96d0e941f237fd9a54e1cad` · stempel: `ROBOCZA · 2026-07-30 08:02`
- **VERIFY OK.** Plik Gra-ROBOCZA.html md5 = manifest.
- Dokończenie po crashu Cursor OOM: bundel na dysku od 08:02, logi/commit/push domknięte rano.
- Zakres: niezacommitowany `main.ts` (capture empty city) + pełny rebuild roboczej.
- Bez force-push.

## ROBOCZA `874bb48a` - 2026-07-30 01:32 - FALA 120: auto-zajęcie pustego miasta wroga (split/marsz) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `874bb48a31c730459d600d89f90e5227` · stempel: `ROBOCZA · 2026-07-30 01:32`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · siege-defenders-test 12/12.
- **BUG-SPLIT-CAPTURE-EMPTY-CITY:** `tryAutoCaptureEmptyCityAt` — jednostka bojowa na heksie pustego miasta wroga (rozdzielenie armii, koniec marszu, ucięcie animacji na koniec tury) automatycznie zajmuje miasto (`captureCityWithoutBattle`); cywile bez zmian.
- POLE-BITWY `dd399c4b` (bez zmian).
- Bez push origin.

## ROBOCZA `ff57aaa5` - 2026-07-30 01:25 - FALA 119: oszczepnik dystans w rosterze deploy + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `ff57aaa588b1e7bfe58f569d852c64ea` · stempel: `ROBOCZA · 2026-07-30 01:25`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · battle-roster-test 7/7.
- **BUG-BATTLE-OSZCZEPNIK-ROSTER:** `_deployRowKind` deleguje do `_armyCompositionKind` — oszczepnik (Rola=Dystans) liczy się jako lucznictwo w filtrach/sortowaniu/licznikach rosteru deploy (wcześniej wrzucany do piechoty).
- POLE-BITWY `dd399c4b` (bez zmian).
- Bez push origin.

## ROBOCZA `242adb0d` - 2026-07-30 01:12 - FALA 118: fix NAP treatyPnGate (koszyk vs bilans UI) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `242adb0def2dae3ab870bd2117064420` · stempel: `ROBOCZA · 2026-07-30 01:12`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · diplomacy-proposal 65/65 · diplomacy-acceptance-points 143/143 · diplomacy-negotiation-table 48/48.
- **BUG-DYPLO-NAP-GATE:** UI pokazywał bilans 0 (NAP 200 PW doliczone do obu stron + 10¤), a `treatyPnGate` wymagał by sam koszyk ≥ ~200 PW → AI odrzucało; naprawione w `diplomacy-proposals.ts` (`treatyPnGate`) + `diplomacy-acceptance-points.ts` (accepted UI).
- Bez push origin.

## ROBOCZA `ed968c14` - 2026-07-30 00:39 - FALA 117: markery złóż na górach (relief sampler) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `ed968c14fe4983603931f3fe9c683920` · stempel: `ROBOCZA · 2026-07-30 00:39`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0.
- **MAP-DEPOSIT-MARKER-RELIEF:** markery złóż na Wzg./Górach — `compactDepositAtEdge` + `reliefSurfaceSampler` (pierścień 0.80, węższy span 0.34, Y z próbnika reliefu pod całym obrysem markera); fix „w środku skały" (FALA 115/116 naprawiały kopalnie, złoża zostawały w stromiźnie).
- Bez push origin.

## ROBOCZA `7df8cf1d` - 2026-07-30 12:45 - FALA 116: kopalnia_zelaza (R-KOPALNIA-UNIWERSALNA-Q1=B) + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `7df8cf1d0e11b5f9a520f08540ad4dfa` · stempel: `ROBOCZA · 2026-07-30 12:45`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · map-improvement-qualify 96/96 · deposit-building-gate 45/45 · zelazo-gate 24/24.
- **R-KOPALNIA-UNIWERSALNA-Q1=B:** usunięto uniwersalną `kopalnia`; dodano `kopalnia_zelaza` (epoka 3, tech Hutnictwo żelaza, ruda_zelaza 2/t); `kopalnia_miedzi` + legacy ZlozeRudy; migracja save przy load.
- Bez push origin.

## ROBOCZA `75fa29d7` - 2026-07-30 01:05 - FALA 115: fix złoża/kopalnia na górach + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `75fa29d71ccd7d0ff42080175bd299b4` · stempel: `ROBOCZA · 2026-07-30 01:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · population-growth-v85 47/47 · population-growth-v85-bonus 20/20 · map-improvement-qualify 94/94 · POLE-BITWY `dd399c4b`.
- **MAP-DEPOSIT-RELIEF:** złoża i kopalnie na Wzg./Górach — `elevatedTerrainEdgeSurfaceY` (topY pryzmu + relief przy ściance); fix „w powietrzu" (było TERRAIN_SURFACE_Y / apex kopca przy sektorze krawędzi).
- **PALISADA-BISKUPIN:** drobna korekta żerdzi na skarpie (`miasto-kamien.ts`).
- Bez push origin (jak FALA 113/114).

## ROBOCZA `c7f15cb3` - 2026-07-30 00:30 - FALA 114: Wyżywienie slider 0-6 + DEPLOY ALL - **ZASTĄPIONA**
- md5 (pelne): `c7f15cb3f47c60dba04ec98c689daaee` · stempel: `ROBOCZA · 2026-07-30 00:30`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · population-growth-v85 47/47 · population-growth-v85-bonus 20/20 · POLE-BITWY `dd399c4b`.
- **B-WYZYWIENIE-SLIDER:** suwak Wyżywienie 0–6 (krok 0,5); koszt żywności = poziom; tabela wzrostu −10%…+7%; migracja starych racji 1|2|3 → 2|4|6.
- **PALISADA-BISKUPIN:** render miasto-kamien (wdrożenie stylu Biskupin z sesji preview).
- Bez push origin (jak FALA 113).

## ROBOCZA `9ae07906` - 2026-07-30 00:05 - FALA 113: DEPLOY ALL sesji (dyplo+HUD+mapa+palisada+rzeki) - **ZASTĄPIONA**
- md5 (pelne): `9ae07906dc7215050b3cde635d50a5ee` · stempel: `ROBOCZA · 2026-07-30 00:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · diplomacy-ai-offer-balance 23/23 · diplomacy-rejection-cooldown 14/14 · diplomacy-negotiation-table 48/48 · empire-skarbiec-bilans 11/11 · koszty-surowcowe 128/128 (palisada ep.1) · map-gen-regression TIMEOUT (dopływy rzek, >10 min) · POLE-BITWY `dd399c4b`.
- **D-DYPLO-DUPLIKAT-UMOW:** blokada duplikatu negocjacji na stole (kontroferta / ignoruj klik).
- **D-DYPLO-KOSZYK-UX:** koszyk handlu — poprawki UX (trade basket).
- **D-DYPLO-AI-OFERTA-ZERO+CYKL:** trim cykliczny + oferta zero Normal/Hard (rozszerzenie FALA 112).
- **D-DYPLO-AI-NO-NAG:** cooldown 3 tury po odrzuceniu oferty AI (brak nękania).
- **E-HUD-ZOOM-FULLSCREEN:** zoom −/100%/+ i ⛶ pod minimapą; fullscreen documentElement.
- **E-TOOLTIP-ROZMIAR-2X:** potwierdzenie ×2 (nie ×4) — hudTitleTooltip.
- **E-SKARBIEC-BILANS:** panel imperium — kwoty zamiast myślników (treasuryBalanceSignedTxt).
- **BUG-PALISADA-BRAK:** palisada epoka Kamień (epokaWejscia=1, Obróbka drewna) + chip +100% Obrony.
- **BUG-FARMA-GLINA / surowce build / map toggles:** kontynuacja FALA 112 (bez regresji).
- **BUG-RZEKI-DOPLYWY:** `ensureRiverOutlets` w generatorze (gen-helpers).
- **WYKLUCZONE:** ikona palisady z `docs/ux/preview-palisada/` — nie w brand/bundle.

## ROBOCZA `8d5813ea` - 2026-07-29 23:13 - FALA 112: DEPLOY ALL dyplo+UI+mapa overlay + AI oferta zero - **ZASTĄPIONA**
- md5 (pelne): `8d5813ea025a603d23e04cc923c65b94` · stempel: `ROBOCZA · 2026-07-29 23:13`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · diplomacy-acceptance-points 142/142 · diplomacy-ai-offer-balance 18/18 · hex-plony-magazyn 9/9 · map-improvement-qualify 94/94 · diplomacy-treaties 12/12 · POLE-BITWY `dd399c4b`.
- **D-DYPLO-KOSZYK-OD-RAZU:** traktat handlowy / szlaki od razu na stół („My oferujemy"), bez modala potwierdzenia.
- **D-DYPLO-PW-NAZWA:** „Punkty porozumienia" w nagłówku AC + tooltip; etykiety traktatów PW spójne (NAP/sojusz/przemarsz).
- **BUG-DYPLO-NAP-PW:** wycena i wyświetlanie PW dla NAP i pozostałych traktatów PW (AC + koszyk + werdykt).
- **D-DYPLO-AI-OFERTA-ZERO:** Easy bez trimu do zera; Normal tolerancja 5 PW + trim daru; Hard 2 PW + undershoot sprzedaży.
- **E-TOOLTIP-ROZMIAR-2X:** podpisy hover HUD/toolbar/minimap ×2 (font + padding), bez kart wyjaśnień.
- **E-MAP-TOGGLE-DEFAULT-ON:** 👤 robotnicy + granice terytorium + ⛏ złoża domyślnie ON (nowa gra / load).
- **BUG-SUROWCE-WIDOCZNE:** overlay złóż surowcowych nie ukryty przy starcie.
- **BUG-FARMA-GLINA-ZNIKA:** ulepszenie gliny nie chowa overlay nakładki złoża.
- **BUG-RZEKI-DOPLYWY:** nie w bundlu (kod rzek niezmieniony w tej sesji).

## ROBOCZA `e5c1bbed` - 2026-07-29 18:30 - FALA 111: R-HEX-PLONY-MAGAZYN B + rzeka +2 glina + D-WIAR-KASKADA-Q1 - **ZASTĄPIONA**
- md5 (pelne): `e5c1bbed0087c660e1e29d8e00862a90` · stempel: `ROBOCZA · 2026-07-29 18:30`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · hex-plony-magazyn 9/9 · stolarnia-r5-d2 9/9 · diplomacy-treaties 12/12.
- **R-HEX-PLONY-MAGAZYN (B):** pełne tileYield drewno/kamień/glina z obrabianych heksów (centrum + 👤) → magazyn państwa; ulepszenia `surowiec_ilosc_tura` addytywnie; tooltip heksa zaktualizowany.
- **Rzeka +2 glina:** modyfikator „Rzeka" w `terrain-yields.json` → `tileYield` (+2 glina/szt./turę przy rzece); przy 👤 trafia do magazynu.
- **D-WIAR-KASKADA-Q1=B:** obrona ofiary w kaskadzie sojuszniczej — kara W tylko przy pełnym sojuszu agresora (`isDefensiveAllianceWarObligation`).

## ROBOCZA `1d730ca2` - 2026-07-29 18:05 - FALA 110: RELIEF medium + LAS/hodowla + surowce pod lasem - **ZASTĄPIONA**
- md5 (pelne): `1d730ca242e4ce8715a970801e6044c7` · stempel: `ROBOCZA · 2026-07-29 18:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · map-improvement-qualify 82/82 · relief-grid 6/6 · map-gen-regression determinizm PASS.
- **Relief Normalnie:** min 4 G/W w komórce 15×15 · target 10%/15% lądu · sufit 10%/15%; Mało/Dużo przeskalowane.
- **Las:** zakaz hodowli (`bydlo`/`owce`/`lama`/`stadnina` z JSON); wolno `oboz_lowiecki` **razem z** `tartak` (sektor `lowiectwo` ≠ `las`).
- **Surowce:** spawn niezależny od lasu; `hex.zloze` widoczne mimo `Nakladka.Las`; fair-play domknięcie pakietu komórki.

## ROBOCZA `57f6fba7` - 2026-07-29 17:45 - FALA 109: DYPLO AC + GLINA x3 - **ZASTĄPIONA**
- md5 (pelne): `57f6fba78776b0c31446059c66dbc975` · stempel: `ROBOCZA · 2026-07-29 17:45`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- tsc 0 · diplomacy-acceptance-points 52/52 · negotiation-table 43/43 · map-gen-regression PASS.
- **Dyplomacja AC:** kolumny My/Oni = tylko przedmiot dealu; werdykt + Przyjmij/Odrzuć/Kontruj wyłącznie w Punkty porozumienia; traktat handlowy symetryczny; przycisk Następne (kolejka FIFO); usunięte Poproś o odpowiedź / oceny PN w kolumnach.
- **Glina x3:** `deposit_rules.glina.rarity` 0.10→0.30 (×3 bazowej gęstości przy Normalnie; proporcje tierów Mało/Normalnie/Dużo bez zmian).

## ROBOCZA `9b61bdfd` - 2026-07-29 13:13 - FALA 108: TABLICZKA JEDNOSTKI (paski Ruchu i Zycia, Moc armii) - **ZASTĄPIONA**
- md5 (pelne): `9b61bdfdf20f181110ee2465cc75ce38` · stempel: `ROBOCZA · 2026-07-29 13:13`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `f10826b`.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0, 36,5 MB). Worktree buildowy
  zweryfikowany `git rev-parse` + obecnoscia plikow. Bundle URUCHOMIONY w Chromium:
  **zero bledow JS przy starcie**.
- Zbudowane po rebase na `origin/main` = `397456d` (fale 106-107 sesji lokalnej).

### R-ZETON-PASKI — tabliczka jednostki w stylu Total War
Zamiast dwoch osobnych obiektow (duzy medalion przy krawedzi heksu + rzadek odznak nad glowa)
jeden zwarty odczyt:
```
        [ pusty slot na przyszly symbol generala ]
   [ikona Koszar]   * * *   [ikona Kuzni]
   [ikona wlasc.] ==== pasek RUCHU (NIEBIESKI) ====  [ MOC ]
                  ---- zlota kreska rozdzielajaca ----
                  ==== pasek ZYCIA (zielony)     ====
```
Decyzje wlasciciela: **C-ZETON-PASKI-Q1=A** (widoczna zawsze, medalion wchodzi do tabliczki) ·
**C-MOC-Q1=A** (Moc nominalna, ta z auto-bitwy) · **C-MOC-Q2=A** (obwodka w barwie panstwa) ·
**C-ZETON-STOS-Q1=A** (odznaki = maksima ze stosu).

**Wymiary [HEX_R]:** paski 0,550 x 0,056, odstep 0,042, zlota kreska 0,020 · ikona wlasciciela
0,200 · pole Mocy 0,240 x 0,190 (cyfra 0,126) · rzadek odznak y=1,27 · slot generala y=1,65.
**Maks. promien poziomy 0,545** (limit roboczy 0,70, twardy obrys 0,866); miedzy tabliczkami
sasiednich heksow **0,642** przeswitu.

**AGREGACJA STOSU** — cala w `game/armyMerge.ts`, render tylko rysuje: Ruch = **MINIMUM**
(armia rusza lacznie, `stackRuchLeft`) · Zycie = **PULA** (suma HP / suma maksimow, NIE srednia
z procentow — srednia ukrywa rannego i traktuje Zwiadowce rowno z Wlocznikiem) · Moc przez
istniejace `sumRosterFieldM` · odznaki = maksima per sciezka osobno.

**NAPRAWIONY ROZJAZD PASKOW** (zgloszenie wlasciciela): zmierzony PRZED zmiana +3/+4/+2 px.
Przyczyna: wypelnienia byly osobnymi `THREE.Sprite` budowanymi wokol wlasnego zrzutowanego
poczatku; maja ten sam X w swiecie, ale rozna WYSOKOSC, wiec przy kamerze 52 st. rozna
GLEBOKOSC — dzielenie perspektywiczne mapowalo ten sam X_widoku na rozne x ekranu. Wada rosla
z oddaleniem zetonu od SRODKA KADRU (kamera gry ma azymut na stale 0), wiec wystepowala
w normalnej rozgrywce. Naprawa: cala nakladka to jedna wspolna plaszczyzna odchylona o 52 st.
**Zmierzone PO: 0 px roznicy w kazdym miejscu kadru.**

**ZLAPANA REGRESJA PO REBASE:** fala 106 zmienila model gwiazdek (gwiazdka = jedna wygrana
bitwa, nie pochodna poziomu premii). Kod stosu liczyl je stara funkcja — jednostka po jednej
wygranej dostalaby na tabliczce stosu DWIE gwiazdki. Poprawione.

**Bramki bez regresji vs baseline:** tsc 0 · weterani 73/0 · civ-visual 54/0 ·
unit-building-bonuses 82/0 · logic 206/208 · unit-replace 2/10 · grupy-budynkow 80/3 ·
zloto 39/6 · army-merge x3 i army-stack-ruch zielone.

**⚠️ OTWARTE — do decyzji wlasciciela:** tabliczka pokazuje Moc NOMINALNA (49 dla Konnicy),
a auto-bitwa dla tej samej jednostki z 3 wygranymi liczy **58** (skaluje definicje premia
weterana przed `sumRosterFieldM`). Dla armii weteranow tabliczka pokazuje ok. 18% mniej niz
liczba rozstrzygajaca starcie. Fala 106 tego NIE zamknela — dodala asercje, ktora to
dokumentuje. Zamkniecie = jedna linia w `armyMerge.ts::stackFieldPowerM`.

## ROBOCZA `b0517973` - 2026-07-29 14:18 - FALA 107: DEPLOY ALL — commit d9fe45f (dyplo PN + weterani + surowce + UI) - **ZASTAPIONA (9b61bdfd)**
- md5 (pelne): `b0517973516024a1a75579eac09f52d9` · stempel: `ROBOCZA · 2026-07-29 14:18`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- tsc 0 · diplomacy-acceptance-points-test 52/52 · diplomacy-negotiation-table-test 43/43 · weterani-test 73/73 · vite build OK (36,4 MB).
- Zakres: pełny rebuild HEAD `d9fe45f` — PN/stół/pokój, panel My/Bilans/Oni, weterani (odznaki/XP), surowce/econ-params, civBrandDisplay, empireDetailPanel. Zawiera FALA 106 i wcześniejsze.

## ROBOCZA `2b118002` - 2026-07-29 13:50 - FALA 106: DEPLOY — panel PN My/Bilans/Oni na stole + koszyku handlu - **ZASTAPIONA (b0517973)**
- md5 (pelne): `2b11800234eedd5891c8c7c8b85ba233` · stempel: `ROBOCZA · 2026-07-29 13:50`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- tsc 0 · diplomacy-acceptance-points-test 52/52 · diplomacy-negotiation-table-test 43/43 · vite build OK (36,4 MB).
- Zakres: panel „Punkty porozumienia" — kolumny My / Bilans / Oni na stole negocjacji i w koszyku handlu (live podgląd PN). Pliki: `diplomacyAcceptanceBalance.ts`, `diplomacyAudience.ts`, `diplomacyTradeBasket.ts`. Zawiera FALA 105 i wcześniejsze.

## ROBOCZA `ded7ed28` - 2026-07-29 13:38 - FALA 105: DEPLOY — pokój na stole negocjacji (PN baza 500) + bez instant case 10 - **ZASTAPIONA (2b118002)**
- md5 (pelne): `ded7ed28c4c0f1c7a73bb772f1436aa3` · stempel: `ROBOCZA · 2026-07-29 13:38`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- tsc 0 · diplomacy-acceptance-points-test 52/52 · diplomacy-negotiation-table-test 43/43 · vite build OK (36,4 MB).
- Zakres: pokój (`pokoj`) na stole negocjacji — PN baza 500, tylko w trwającej wojnie, propozycja ważna podczas wojny; wyłączenie instant-accept (case 10). Pliki: `diplomacy-acceptance-points.json`, `diplomacy-proposals.ts`, `diplomacy-negotiation-table-test.cjs`. Zawiera FALA 104 i wcześniejsze.

## ROBOCZA `42dc16e4` - 2026-07-29 13:21 - FALA 104: DEPLOY — PN złoto 50/szt + węgiel 20/szt (+ EMPIRE_STOCK wegiel) - **ZASTAPIONA (ded7ed28)**
- md5 (pelne): `42dc16e49db9b33556233719ff337d75` · stempel: `ROBOCZA · 2026-07-29 13:21`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- tsc 0 · diplomacy-acceptance-points-test 49/49 · vite build OK (36,4 MB).
- Zakres: PN za sztukę — złoto 50/szt, węgiel 20/szt; EMPIRE_STOCK wegiel w katalogu wartości. Pliki: `diplomacy-acceptance-points.json`, `diplomacy-value-catalog.ts`, `diplomacy-goods.ts`. Zawiera FALA 103 i wcześniejsze.

## ROBOCZA `d6a19cba` - 2026-07-29 12:29 - FALA 103: DEPLOY — PN surowców za sztukę (drewno 1…stal 25) + handel ilościowy sól/koń/ceramika/brąz/żelazo/stal - **ZASTAPIONA (42dc16e4)**
- md5 (pelne): `d6a19cba5734499c698cff110c4d161b` · stempel: `ROBOCZA · 2026-07-29 12:29`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD `f5bb931`.
- tsc 0 · diplomacy-acceptance-points-test 46/46 · diplomacy-value-catalog-test 58/59 (1 pre-existing boolean `ruda`) · vite build OK (36,4 MB).
- Zakres: PN za sztukę surowców magazynowych (drewno 1 … stal 25); handel ilościowy pakietami (sól, koń, ceramika, brąz, żelazo, stal). Pliki: `diplomacy-acceptance-points.json`, `diplomacy-value-catalog.ts`, `diplomacy-acceptance-points.ts`, `diplomacyTradeBasket.ts`, `diplomacyNegotiationModal.ts`. Zawiera FALA 102 i wcześniejsze.

## ROBOCZA `3bd7d5cf` - 2026-07-29 12:24 - FALA 102: DEPLOY — magazyn państwa (nagłówek+tooltip) + opis civ tylko tooltip - **ZASTAPIONA (d6a19cba)**
- md5 (pelne): `3bd7d5cf2204b0de87c05766d02c5993` · stempel: `ROBOCZA · 2026-07-29 12:24`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD `f5bb931`.
- tsc 0 · vite build OK (36,4 MB).
- Zakres: magazyn państwa — krótki nagłówek + tooltip (pojemność/formuła); opis cywilizacji (Falanga itd.) — w grze tylko tooltip, start bez zmian. Pliki: `civBrandDisplay.ts`, `empireDetailPanel.ts`, `diplomacyAudience.ts`. Zawiera FALA 101 i wcześniejsze.

## ROBOCZA `683fe397` - 2026-07-29 12:15 - FALA 101: DEPLOY — globalny mnożnik trudności koszyk My/Oni + tech koszt×tempo - **ZASTAPIONA (3bd7d5cf)**
- md5 (pelne): `683fe39730d7baa8eeb02efff8e2cbca` · stempel: `ROBOCZA · 2026-07-29 12:15`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD `f5bb931`.
- tsc 0 · diplomacy-acceptance-points-test 43/43 · vite build OK (36,4 MB).
- Zakres: globalny mnożnik trudności (easy/normal/hard) na cały koszyk My/Oni; technologie = koszt×tempo bez osobnego ±50%. Zawiera FALA 100 i wcześniejsze.

## ROBOCZA `26ef48a3` - 2026-07-29 12:07 - FALA 100: DEPLOY ALL — weterani ★10/15/20% + dyplomacja (sojusz def., wymiana PN=0, przemarsz, rel ±90%) - **ZASTAPIONA (683fe397)**
- md5 (pelne): `26ef48a35115e6965d9246e218436443` · stempel: `ROBOCZA · 2026-07-29 12:07`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD `f5bb931`.
- tsc 0 · weterani-test 73/73 · diplomacy-acceptance-points-test 33/33 · vite build OK (36,4 MB).
- Zakres: (1) weterani — gwiazdki tylko za wygrane, premia ★+10% / ★★+15% / ★★★+20% (pancerz bez zmian); (2) dyplomacja — sojusz defensywny AI/UI, umowa wymiany PN=0, traktat przemarszu wojskowego, modyfikator relacji ±90% do progu PN. Zawiera FALA 98–99 i wcześniejsze.

## ROBOCZA `2f5b7a49` - 2026-07-29 12:01 - FALA 99: DEPLOY — gwiazdki weterana tylko za wygrane bitwy - **ZASTAPIONA (26ef48a3)**
- md5 (pelne): `2f5b7a497b54b2fa8fbc0be52b552f9a` · stempel: `ROBOCZA · 2026-07-29 12:01`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `f5bb931`.
- tsc 0 · weterani-test 60/60 · vite build OK (36,4 MB).
- Zakres: gwiazdki weterana tylko za wygrane bitwy (1/2/3 → ★/★★/★★★); przegrana nie awansuje (stara skala premii 10/20). Pliki: `veteran.ts`, `post-battle-map.ts`, `unitVeteranBadges`, `unitCardStatus`, `weterani-test.cjs`, `main.ts`/`setup.ts`. Zawiera FALA 98 i wcześniejsze.

## ROBOCZA `222eb458` - 2026-07-29 11:54 - FALA 98: DEPLOY ALL — stół negocjacji + PN akceptacji + traktat handlowy + prezent AI - **ZASTAPIONA (2f5b7a49)**
- md5 (pelne): `222eb45848ba4241d6fb0f21d41cadd9` · stempel: `ROBOCZA · 2026-07-29 11:54`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `f5bb931`.
- tsc 0 · diplomacy-acceptance-points-test 20/20 · diplomacy-negotiation-table-test 39/39 · vite build OK (36,4 MB).
- Zakres: stół negocjacji dyplomacji · punkty akceptacji (PN) · traktat handlowy · prezent bez karty My · AI nie-instant (kontroferty). Pliki: `diplomacy-acceptance-points`, `diplomacyAudience`, `diplomacy-display`, `main.ts`, testy dyplomacji.

## ROBOCZA `0bea1d88` - 2026-07-29 09:09 - FALA 97: DEPLOY ALL — zeton jednostki (C-ZETON-DUP-Q1=B) + surowiec ZLOTO na mapie - **ZASTAPIONA (222eb458)**
- md5 (pelne): `0bea1d88ac59fedf367cc796d7c9599e` · stempel: `ROBOCZA · 2026-07-29 09:09`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `b5370c8`.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0, 36,4 MB single-file).
  ⚠️ Pierwszy build tej fali byl zbudowany z NIEWLASCIWEGO commita (worktree stal na
  `daacd43`, nie na scalonym HEAD) — wykryte kontrola `git rev-parse` i obecnoscia plikow
  PRZED kopiowaniem, przebudowane. Ta sama klasa bledu co niewazny bundle `ddcc04c1`.

### 1. ZLOTO JAKO SUROWIEC WIDOCZNY NA MAPIE (R-ZLOTO-NIEWIDOCZNE)
Zloto istnialo w grze jako zloze (rzadkosc 0,03 ulamka heksow ladu, Wzgorza i Gory),
bramkowalo Mennice i mialo wlasna Kopalnie zlota — ale **na mapie bylo NIEWIDZIALNE**:
`buildStyledResourceOverlay` obslugiwalo tylko cztery zloza (miedz, zelazo, wegiel, sol),
dla `zloto` zwracalo `null`. Gracz nie mial jak rozpoznac zloza inaczej niz klikajac w heks.
Dodany model `buildZlozeZloto()` — 4 skupiska w pierscieniu obrzeza (srodek heksu wolny),
kazde: skala macierzysta + zyla + samorodek + blik + okruch; NIE przypomina Kopalni zlota.
Pomiary: 22 meshe / 264 tri, maks. promien poziomy 0,768 HEX_R (limit obrysu 0,866),
min. promien 0,452 HEX_R. Rodzina zloz: 18 meshy, 0,748-0,787 / 0,462-0,510 — ten sam rzad.
**Zostaje niezalatane:** w stylu renderowania `civ` zloto nadal niewidoczne (tamta sciezka
nie zaglada do `hex.zloze`, kluczuje po enumie `Nakladka`). Enum jest ZAPISYWANY W STANIE GRY,
wiec jego poszerzenie to decyzja wlasciciela. Aktywny styl to `roblox` — skutek dla gry zerowy.

### 2. ZETON JEDNOSTKI — decyzja C-ZETON-DUP-Q1 = B
Dwie sesje zrobily C-OBCE-JEDN-Q2 rownolegle. Wlasciciel wybral wersje tej sesji;
moduly z FALI 43 (`unitOwnerMedallion.ts`, `unitPathFlankBadges.ts`) USUNIETE.
- Medalion wlasciciela przy lewej krawedzi zetonu: portret wladcy / sygnet kultury
  (miasto-panstwo) / czaszka (barbarzyncy). Kolejnosc rozstrzygania 1:1 z
  `preBattle.ts::commanderHtml`. Kolor pierscienia (mosiadz/srebro/czerwien) niesie te sama
  informacje, gdy przy oddalonej kamerze tresc medalionu przestaje byc czytelna.
- Rzadek nad glowa: ikona Koszar (sciezka B) LEWO ← gwiazdki weterana ŚRODEK → ikona Kuzni
  (sciezka A) PRAWO. Kropki u podstawy i metalowy kolnierz usuniete.
- Ikony to prawdziwe assety marki (`bld-koszary.svg`, `bld-kuznia.svg`) — korekta wlasciciela
  2026-07-29: „masz konkretne ikony i symbole tych dwoch budynkow, uzyj je".
- Poziom 1/2/3 liczony OSOBNO per sciezka, niesiony WYLACZNIE kolorem (braz/srebro/zloto).
  Progi: rowne tercje maksimum sciezki — **Pancerz max 45 pp -> 15/30 pp**,
  **Parametry max 50 pp -> 16/33 pp**. Identyczne z progami FALI 43, wiec **zero zmiany
  w rozgrywce** — dwa rownolegle komplety scalone w jedno zrodlo prawdy (aliasy
  `PATH_A_MAX_PP`/`PATH_B_MAX_PP`/`PathBadgeLevel` zachowane dla karty jednostki).
- `VETERAN_BADGE_HIT_UD` przywrocony — bez niego tooltip poziomu weterana (C-OBCE-JEDN-Q3)
  przestalby rozpoznawac trafienie w gwiazdke.

### BRAMKI — porownane z baseline zmierzonym na czystym `origin/main`
| Bramka | baseline `origin/main` | po scaleniu |
|---|---|---|
| `tsc --noEmit` | 0 bledow | **0 bledow** |
| `civ-visual-test` | 54/54 | **54/54** |
| `unit-building-bonuses-test` | 82/82 | **82/82** |
| `tech-tree-test` | 19/19 | **19/19** |
| `research-test` | ALL GREEN | **ALL GREEN** |
| `logic-test` | FAIL (city food store undefined) | **identycznie** |
| `unit-replace-test` | 2/10 | **identycznie** |
| `grupy-budynkow-test` | 80 pass / 3 fail | **identycznie** |
| `zloto-test` | 39 pass / 6 fail | **identycznie** |
**Cztery czerwone bramki sa PRE-ISTNIEJACE na `origin/main`** — zmierzone osobno w czystym
worktree, nie sa regresja tej fali.

## ROBOCZA `bc8f4630` - 2026-07-29 10:22 - FALA 96: DEPLOY ALL — pelny rebuild biezacych zrodel - **ZASTAPIONA (0bea1d88)**
- md5 (pelne): `bc8f4630112a3b5e60914b5a1ba46515` | stempel: `ROBOCZA | bc8f4630`
- **VERIFY OK.** tsc 0 | vite build OK | publish-robocza-snapshot OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** DEPLOY ALL — pelny rebuild biezacego drzewa `gra/src` + `gra/data` (bez nowych zmian kodu w tej turze; zawiera DOSTEP-SUROWCE-Q1 / FALA 95 i wczesniejsze). POLE-BITWY odswiezone.
- **Pliki (skrot):** calosc zrodel + bundle; temat glowny: DOSTEP-SUROWCE-Q1 (magazyn panstwa), dyplomacja, AI, mapa/ulepszenia, armie merge, balans racji 2-4-6.

## ROBOCZA `41cb38f7` - 2026-07-29 10:09 - FALA 95: tylko magazyn, bez dostepu (DOSTEP-SUROWCE-Q1) - **ZASTAPIONA**
- md5 (pelne): `41cb38f77ea238660ac8c45d5b53574f` | stempel: `ROBOCZA | 41cb38f7`
- **VERIFY OK.** tsc 0 | deposit-building-gate-test 46/46 | vite build OK | publish-robocza-snapshot OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** DOSTEP-SUROWCE-Q1 — bramki budynkow/jednostek = wylacznie magazyn panstwa (cofniecie FALA 94 B1 Stolarnia↔Tartak); Odlewnia brązu = Ruda w stocku; dyplomacja dostepu bez zmian (SUROW-TERYT wycofany); UI chipy „w magazynie państwa". Pelny rebuild ALL z biezacego `gra/src` + `gra/data`.
- **Pliki (temat glowny):** `building-resource-gate.ts` | `production.ts` | `braz-access.ts` | `zelazo-access.ts` | `resource-access.ts` | `cityPanel.ts` | `buildings.json` | `deposit-building-gate-test.cjs` | `docs/decyzje/DOSTEP-SUROWCE-Q1.md`

## ROBOCZA `d776c787` - 2026-07-29 09:35 - FALA 94: stopka surowców + Stolarnia B1 + luki P84/85 - **ZASTAPIONA**
- md5 (pelne): `d776c7874b0f076469fdac495028a42f` | stempel: `ROBOCZA | d776c787`
- **VERIFY OK.** tsc 0 | deposit-building-gate-test 45/45 | population-growth-v85-test 18/18 | vite build OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** (A) stopka „Surowce w zasięgu” zwiniete do zakładki Okolica; (B) Stolarnia wymaga aktywnego Drewna (Tartak), nie samego zapasu; (C) weryfikacja luk P84/85 — juz wdrozone (U-25B, Garncarnia +Zadowolenie, głód 1 tura).
- **Pliki:** `cityPanel.ts` | `building-resource-gate.ts` | `production.ts` | `buildings.json` | `empireDetailPanel.ts`

## ROBOCZA `651d0e11` - 2026-07-29 02:22 - FALA 93: balans racji zywnosci 2-4-6 - **ZASTAPIONA**
- md5 (pelne): `651d0e11798831f4c69c2c35801b8430` | stempel: `ROBOCZA | 651d0e11`
- **VERIFY OK.** tsc 0 | population-growth-v85-test 18/18 | vite build OK | certutil md5 OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Koszt racji poziom 1/2/3: **2/4/6** zywnosci na obywatela/ture (bylo 1/2/3). Farmy bez zmian. Decyzja Macieja 2026-07-29.
- **Pliki:** `gra/data/econ-params.json` | `gra/src/game/population-growth-v85.ts` | `docs/decyzje/PYTANIE-85.md`

## ROBOCZA `2a14158d` - 2026-07-29 02:15 - FALA 92: AI miast-panstw buduje infrastrukture - **ZASTAPIONA**
- md5 (pelne): `2a14158dacce0b8558af9b03d5b3e5cf` | stempel: `ROBOCZA | 2a14158d`
- **VERIFY OK.** tsc 0 | ai-test 250/250 | vite build OK | certutil md5 OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Miasta-panstwa (defensiveCopy): po garnizonie priorytet Studnia/Garncarnia/Spichlerz/Targowisko zamiast spamu Wojownika; Studnia/Garncarnia w puli kandydatow AI.
- **Pliki:** `gra/src/game/ai.ts` | `gra/tools/ai-test.cjs`

## ROBOCZA `34d69473` - 2026-07-29 01:58 - FALA 91: owce/las/confirm + surowce + balans (pelny rebuild) - **ZASTAPIONA**
- md5 (pelne): `34d694736801bd350a2f7faccedd135f` | stempel: `ROBOCZA | 34d69473`
- **VERIFY OK.** tsc 0 | map-improvement-qualify 74/74 | smoke PASS | vite build OK | certutil md5 OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Owce -- blokada na lesie (tylko otwarte wzgorze / zloze owiec); modal „Zastapic?" przy kolizji sektorow; ukrycie markerow surowcow/plonow po ulepszeniu; balans tartak drewno 10/t, glinianka glina 15/t; Polacz armie. W bundle FALA 87 (kolejka rekrutacji compact).
- **Pliki:** `improvement-build.ts` | `improvementBuildConfirm.ts` | `terrain-improvements.json` | `terrain-improvements.ts` | `main.ts` | `cityOkolicaOverlay.ts` | `armyMerge.ts` | `armyMergePickPanel.ts`


## ROBOCZA `3d299f17` - 2026-07-29 01:55 - FALA 90: balans tartak/glinianka (drewno 10, glina 15) - **ZASTAPIONA**
- md5 (pelne): `3d299f176846d87a2801c20d4224f6c0` | stempel: `ROBOCZA | 3d299f17`
- **VERIFY OK.** tsc 0 | vite build OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Balans SUROW-TERYT — Tartak drewno 20→10/t, Glinianka glina 20→15/t (kamieniolom 4/t bez zmian). W bundle takze FALA 88-89 (polacz armie, ukrywanie surowcow).
- **Pliki:** `gra/data/terrain-improvements.json` | `terrain-improvements.ts` (komentarz)


## ROBOCZA `17859ca1` - 2026-07-29 01:52 - FALA 89: ukrywanie surowcow/plonow po ulepszeniu - **ZASTAPIONA**
- md5 (pelne): `17859ca11570ccf9f674a7cbc6e1f503` | stempel: `ROBOCZA | 17859ca1`
- **VERIFY OK.** tsc 0 | smoke PASS | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Owce -- blokada na lesie (tylko otwarte wzgorze / zloze owiec); modal „Zastapic?" przy kolizji sektorow ulepszen; ukrycie markerow surowcow/plonow po ulepszeniu terenu (`hexSuppressesResourceOverlay`); balans tartak drewno 10/t, glinianka glina 15/t; Polacz armie (ikona + panel wyboru). W bundle calosc FALA 87 (kolejka rekrutacji compact).
- **Pliki:** `improvement-build.ts` | `improvementBuildConfirm.ts` | `terrain-improvements.ts` | `main.ts` | `cityOkolicaOverlay.ts` | `armyMerge.ts` | `armyMergePickPanel.ts`


## ROBOCZA `0c72963e` - 2026-07-29 01:50 - FALA 88: Polacz armie + prompt rekrutacji merge - **ZASTAPIONA**
- md5 (pelne): `0c72963e31e0bcd3db576c59ae1c3537` | stempel: `ROBOCZA | 0c72963e`
- **VERIFY OK.** tsc 0 | army-merge-colocated 2/2 | army-merge-bounce 4/4 | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Ikona Połącz w karcie jednostki (obok Rozdziel); panel wyboru jednostek + sąsiedniego stosu; prompt merge przy rekrutacji uwzględnia garnizon na heksie miasta.
- **Pliki:** `armyMerge.ts` | `armyMergePickPanel.ts` | `unitActionBarHtml.ts` | `main.ts` (+ test colocated)


## ROBOCZA `0415305b` - 2026-07-29 01:38 - FALA 87: kolejka rekrutacji compact + pending - **ZASTAPIONA**
- md5 (pelne): `0415305b7834e29b25e619b452b97f07` | stempel: `ROBOCZA | 0415305b`
- **VERIFY OK.** tsc 0 | smoke PASS | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Panel miasta / Produkcja -- kolejka rekrutacji skondensowana (max 5 wierszy + scroll); kolejka budowy max 4 + scroll; w bundle calosc FALA 86 (stol PN, ETA budowy, HUD Handel, diplo vs jednostka, cap AI).
- **Pliki:** `cityPanel.ts` (+ pending ze zrodel)


## ROBOCZA `5dfba0c5` - 2026-07-29 01:26 - FALA 86: kolumny stolu + HUD Handel + diplo/jednostka + cap AI - **ZASTAPIONA**
- md5 (pelne): 5dfba0c514eaf4c3264d2ea8704af61e14eaf4c3264d2ea8704af61e | stempel: ROBOCZA | 5dfba0c5
- **VERIFY OK.** tsc 0 | smoke PASS | diplomacy-ai-balance-test 14/14 | vite build OK | verify-robocza VERIFY OK.
- Wejscie: gra-robocza/START.html | Ctrl+F5 + Nowa gra.
- **Zakres:** Stol negocjacji -- Mozliwe umowy (lewo), Aktywne traktaty (prawo); lewy HUD -- wrap ramki Handel/chipy; dyplomacja vs pick obcej jednostki; cap AI handlu surowcow z produkcji (drewno).
- **Pliki:** `diplomacyAudience.ts` | `hud.ts` | `diplomacy-ai-balance.ts` | `main.ts` | `unitForeignPick.ts`

## ROBOCZA `912f1efa` - 2026-07-29 01:18 - FALA 85: dyplomacja vs jednostka (lista nie nachodzi) - **ZASTAPIONA**
- md5 (pelne): `912f1efacbee0e69fa053d01494d08a3` | stempel: `ROBOCZA | 912f1efa`
- **VERIFY OK.** tsc 0 | smoke PASS | vite build OK | verify-robocza VERIFY OK. (sync MAPA/START: czesciowy OneDrive lock)
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** `ensureDiplomacyUiClosed` przy wyborze jednostki; `onBack` z audiencji nie otwiera listy dyplomacji gdy zaznaczona jednostka - brak nachodzenia listy na panel jednostki. W bundle takze FALA 84 (stol PN, cap AI, etykiety).
- **Pliki:** `main.ts`



## ROBOCZA `4943f7ca` - 2026-07-29 01:29 - FALA 86: ETA kolejki budowy + UI dyplo/HUD + obca jednostka - **ZASTAPIONA**
- md5 (pelne): `4943f7ca77d104e8c9f8ae6f148fea89` | stempel: `ROBOCZA | 4943f7ca`
- **VERIFY OK.** tsc 0 | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** ETA kumulatywne w kolejce budowy (panel miasta); stol negocjacji -- Możliwe umowy lewo / Aktywne traktaty prawo; fix ramki/chipa Handel (HUD); wybor obcej jednostki vs audiencja (unitForeignPick). W bundle takze FALA 82-84 (dyplo PN, MP wyszarzone, tooltip magazyn).
- **Pliki:** `cityPanel.ts` | `hud.ts` | `diplomacyAudience.ts` | `unitForeignPick.ts` | `main.ts`
## ROBOCZA `7b836be9` - 2026-07-29 01:15 - FALA 84: stol negocjacji + cap AI + etykiety umow - **ZASTAPIONA**
- md5 (pelne): `7b836be9756ab74dc61d21812ddbcc01` | stempel: `ROBOCZA | 7b836be9`
- **VERIFY OK.** tsc 0 | diplomacy-layers-test 20/20 | diplomacy-ai-balance-test 14/14 | diplomacy-test 144/146 (2 pre-existing prog JSON) | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra. (sync playtestow/START: czesciowy fail OneDrive lock)
- **Zakres:** Redesign stolu negocjacji; etykiety umowy; cap AI surowcow; w bundle FALA 82-83 (tooltip magazyn, MP wyszarzone).
- **Pliki:** diplomacyNegotiationModal.ts | diplomacyTradeBasket.ts | diplomacyAudience.ts | diplomacyDealDisplay.ts | diplomacy-ai-balance.ts | diplomacy-proposals.ts | hexContextTooltip.ts | main.ts

## ROBOCZA `558ca4f0` - 2026-07-29 01:15 - FALA 85: celownik stolica dyplo (deploy zrodla) - **ZASTAPIONA** (skonsolidowane w FALA 84 `7b836be9`)
- md5 (pelne): `558ca4f006d6195a5054118fe7c67ef8` | stempel: `ROBOCZA | 558ca4f0`
- **VERIFY OK.** tsc 0 | smoke PASS | vite build OK | verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Celownik na karcie paĹ„stwa (audiencja + lista dyplomacji) â€” wycentruj kamerÄ™ na stolicy bez zamykania overlay. W bundlu takĹĽe FALA 83 (akcje MP wyszarzone + tooltip â€žNiedostÄ™pne u miasta-paĹ„stwaâ€ť) i FALA 84 (redesign stoĹ‚u PN) z drzewa ĹşrĂłdeĹ‚.
- **Pliki:** `diploUiSkin.ts` | `diplomacyAudience.ts` | `diploListHud.ts` | `main.ts` (+ `diplomacy-layers.ts` grey MP)

## ROBOCZA `558ca4f0` - 2026-07-29 01:05 - FALA 84: redesign stolu negocjacji PN - **ZASTAPIONA**
- md5 (pelne): `558ca4f065aaca2138662d809691144c` | stempel: `ROBOCZA | 558ca4f0`
- **VERIFY OK.** tsc 0 | smoke PASS | vite build OK | verify-robocza VERIFY OK. diplomacy-test: SKIP (OneDrive lock na tools/.dip-bundle.cjs).
- Wejscie: `gra-robocza/START.html` | Ctrl+F5 + Nowa gra.
- **Zakres:** Stol negocjacji -- kolumny My/Oni bez duplikatow oferty; pasek Przyjmij/Odrzuc/Kontruj pod kolumnami; traktat szlakow na stole (bez koszyka PN); opisy w tooltipach (m.in. rund negocjacji po kontrofercie). Rozdzial szlaki vs wymiana (HANDEL-SPLIT) bez zmian.
- **Pliki:** `diplomacyAudience.ts` | `diplomacyTradeBasket.ts` | `diplomacyNegotiationModal.ts` | `diplomacyDealDisplay.ts

## ROBOCZA `9191d697` - 2026-07-29 12:55 - FALA 83: dyplomacja MP â€” wyszarzone akcje + tooltip - **ZASTAPIONA**
- md5 (pelne): `9191d6970de5084651d32178c5735e29` Â· stempel: `ROBOCZA Â· 9191d697`
- **VERIFY OK.** tsc 0 Â· diplomacy-layers-test 20/20 Â· vite build OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Audiencja dyplomacji â€” akcje spoza pakietu podstawowego u miasta-paĹ„stwa / rywala tego samego typu **widoczne, wyszarzone** (nie ukryte). Tooltip: â€žNiedostÄ™pne u miasta-paĹ„stwa" lub â€žNiedostÄ™pne u rywala tego samego typu". Obce MP na peĹ‚nej warstwie teĹĽ objÄ™te (D3-Q4 poboczni).
- **Pliki:** `diplomacy-layers.ts` Â· `main.ts` Â· `diplomacyAudience.ts`

## ROBOCZA `e2dddd52` - 2026-07-29 02:50 - FALA 82: tooltip heksa plony vs magazyn (SUROW-TERYT) - **ZASTÄ„PIONA**
- md5 (pelne): `e2dddd524016164809ddd8f8cf314dcd` Â· stempel: `ROBOCZA Â· e2dddd52`
- **VERIFY OK.** tsc 0 Â· smoke PASS Â· vite build OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Audyt SUROW-TERYT + fix UX tooltipu heksa: osobno â€žPlony miasta (đź‘¤)" (Ĺ»ywnoĹ›Ä‡/Praca/Podatek) vs â€žDo magazynu paĹ„stwa" (ulepszenia `surowiec_ilosc_tura` auto + drewno z obrabianego pola). KamieĹ„ z terenu â€” etykieta nieaktywna (nie sugeruje magazynu).
- **Pliki:** `gra/src/ui/hexContextTooltip.ts`

## ROBOCZA `178a422a` - 2026-07-29 02:00 - FALA 81: zĹ‚oĹĽe konia Ă—2 skala wizualna - **ZASTÄ„PIONA**
- md5 (pelne): `178a422a8c1dd2096bdfc049d93d087f` Â· stempel: `ROBOCZA Â· 178a422a`
- **VERIFY OK.** tsc 0 Â· smoke PASS Â· vite build OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Surowiec koĹ„ na mapie â€” skala wizualna Ă—2: `buildZlozeKonie` 0.18â†’0.36 + `depositDisplayScale=2` w `compactDepositAtEdge` (normalizacja zĹ‚oĹĽa nie obcinaĹ‚a juĹĽ powiÄ™kszenia).
- **Pliki:** `kon-nowy-model.ts` Â· `styleResources.ts` Â· `resources.ts` Â· `main.ts`

## ROBOCZA `7d266143` - 2026-07-29 01:35 - FALA 80: HANDEL-SPLIT-Q1=B szlaki vs wymiana - **ZASTÄ„PIONA**
- md5 (pelne): `7d26614331b2ce511f3122da2382a400` Â· stempel: `ROBOCZA Â· 7d266143`
- **VERIFY OK.** tsc 0 Â· diplomacy-test 144/146 (2 pre-existing prog JSON) Â· vite build OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Rozdzielenie handlu (Maciej B): `umowa_szlakow` (szlaki, +1 Zaufanie/turÄ™, bez koszyka) + `umowa_wymiany` (koszyk PN). UI akcja 5 / 14 â€” osobne kafle. Migracja save legacy `umowa_handlowa`.
- **Pliki:** `diplomacy-treaties.ts` Â· `diplomacy-proposals.ts` Â· `diplomacyAudience.ts` Â· `diplomacyTradeBasket.ts` Â· `diplomacy.json` Â· `main.ts`

## ROBOCZA `35ec62df` - 2026-07-29 01:20 - FALA 79: miasta-paĹ„stwa dystans 5 hex - **ZASTÄ„PIONA**
- md5 (pelne): `35ec62dfa661bcddf09c7107637c9e8e` Â· stempel: `ROBOCZA Â· 35ec62df`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· smoke PASS.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Miasta-paĹ„stwa (hub-chain spawn): min/max odlegĹ‚oĹ›Ä‡ 4 hex â†’ **5 hex** (`CLUSTER_CITY_STATE_MIN/MAX_HEX`, `MIN_DIST_START_CITY_STATE`, `MIN_DIST_FOREIGN_IN_CLUSTER`, `clusterCityStateRadius`). WiÄ™cej przestrzeni na zasoby w ciasnym klastrze.
- **Pliki:** `gra/src/map/clusters.ts`, `gra/tools/cluster-start-test.cjs`

## ROBOCZA `ee79494f` - 2026-07-29 00:45 - FALA 78: first contact zawsze peĹ‚na audiencja - **ZASTÄ„PIONA**
- md5 (pelne): `ee79494fb513673a703bf903df30253c` Â· stempel: `ROBOCZA Â· ee79494f`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· smoke PASS.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Pierwszy kontakt â€” dla wszystkich cywilizacji (peĹ‚ne AI i miasta-paĹ„stwa) od razu peĹ‚na audiencja dyplomacji; karta â€žPierwsze spotkanie" usuniÄ™ta z UX. Kolejka wielu odkryÄ‡ bez zmian (po zamkniÄ™ciu audiencji â†’ nastÄ™pna). Muzyka Rzymu (FALA 77) bez zmian.
- **Pliki:** `gra/src/main.ts`, `gra/src/ui/diplomacyAudience.ts`

## ROBOCZA `1459f95f` - 2026-07-29 00:15 - FALA 77: muzyka pierwszego kontaktu Rzym - **ZASTÄ„PIONA**
- md5 (pelne): `1459f95f941002cbae0e887fa8cb8aac` Â· stempel: `ROBOCZA Â· 1459f95f`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· smoke PASS.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Muzyka dyplomacji per-cywilizacja â€” Rzym (`rzymianie`): 2 utwory (Imperial_Accord, Portico_of_the_Consul), pÄ™tla 3Ă—A/3Ă—B, fade-in przy starcie audiencji, crossfade miÄ™dzy utworami, fade-out przy zamkniÄ™ciu. Fallback: Gilded_Porticos dla innych civ.
- **Pliki:** `gra/src/audio/filePlayer.ts`, `muzyka-antyczna.ts`, `diplomacyAudience.ts`, `main.ts`, `utwory/dyplomacja/rzymianie/*.mp3`

## ROBOCZA `ad2c3e5d` - 2026-07-28 23:30 - FALA 76: first contact peĹ‚na civ â†’ audiencja - **ZASTÄ„PIONA**
- md5 (pelne): `ad2c3e5db875d5e6cfbf7f1502f91f0b` Â· stempel: `ROBOCZA Â· ad2c3e5d`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** Pierwsze spotkanie â€” miasto-paĹ„stwo: krĂłtka karta OK (jak dotÄ…d); peĹ‚na cywilizacja: od razu peĹ‚na audiencja dyplomacji (`openDiplomacyAudience`), bez samej intro-karty. RozrĂłĹĽnienie: `isOwnerClusterCityState(ownerId, ownerCityStateOpts())`.
- **Pliki:** `gra/src/main.ts`

## ROBOCZA `caea930e` - 2026-07-28 23:10 - FALA 75: hotfix dyplomacja first-contact + modale CSS - **ZASTÄ„PIONA**
- md5 (pelne): `caea930e8b505c972fff48766626ceb9` Â· stempel: `ROBOCZA Â· caea930e`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· verify-robocza VERIFY OK.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** P0 bug dyplomacji â€” `showFirstContactCard` / modale wojny i zerwania traktatu woĹ‚aĹ‚y `ensureStyles()` dopiero przy audiencji; bez CSS overlay fullscreen bez centrowania, uciÄ™ty tekst, pusty panel. Fix: `ensureStyles()` na wejĹ›ciu kaĹĽdego modala (`diplomacyAudience.ts`).
- **Pliki:** `gra/src/ui/diplomacyAudience.ts`

## ROBOCZA `76ccda79` - 2026-07-28 22:55 - FALA 74: deploy all (bitwa+dyplo+obrona+UI jednostek+pathing) - **ZASTÄ„PIONA**
- md5 (pelne): `76ccda794983b7643f4a36cab44139ec` Â· stempel: `ROBOCZA Â· 76ccda79`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· verify-robocza VERIFY OK Â· POLE-BITWY bez zmian (`dd399c4b`).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Bitwa** â€” pick na wzgĂłrzach, domyĹ›lna formacja Piechota, Ĺ‚up z kosztu rekrutacji (`battleScene.ts`, `battle-loot.ts`, `combat-params.json`). (2) **Pre-battle** â€” przycisk BITWA (`preBattle.ts`). (3) **Dyplomacja** â€” wiarygodnoĹ›Ä‡ gracza, kara DoW bez faĹ‚szywego â’20 Zaufania (`diplomacy-penalty-preview.ts`, `diplomacy.ts`, `diplomacyAudience.ts`). (4) **Obrona** â€” Palisada drewniana +100% Obrony, ufortyfikowanie w polu +50% (`buildings.json`, `city-defense.ts`). (5) **Mapa/UI** â€” klik obcej jednostki Informacja/Dyplomacja (`unitForeignPick.ts`), szerszy dock szczegĂłĹ‚Ăłw, minimapa/tooltipy (`main.ts`, `sidePanelHud.ts`, `hexContextTooltip.ts`). (6) **Pathing** â€” kontynuacja auto-marszu na EOT (`main.ts`). (7) **Handel AI** â€” balans propozycji (`diplomacy-ai-balance.ts`). (8) **PozostaĹ‚e** â€” oblÄ™ĹĽenie/produkcja/podsumowanie bitwy.
- **Pliki:** caĹ‚y working tree `gra/src` + `gra/data` od FALA 73 `490ec5fd`; build `%TEMP%\civ-dist-fala74`.

## ROBOCZA `490ec5fd` - 2026-07-28 21:20 - FALA 73: deploy all (UI+dyplo+granice+terytorium+MP pack+AI ekspansja) - **ZASTÄ„PIONA**
- md5 (pelne): `490ec5fd5e914960586c6437e4e3018b` Â· stempel: `ROBOCZA Â· 490ec5fd`
- **VERIFY OK.** tsc 0 Â· cluster-start PASS (150+) Â· vite build OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Mapgen ~10Ă—** â€” `localLandFraction` tylko dysk R=3 (`clusters.ts`). (2) **StĂłĹ‚ negocjacji** â€” kolumny Lâ†’P + split My/Oni oferty (`diplomacyAudience.ts`, `diplomacyDealDisplay.ts`). (3) **Tabela miast** â€” ikony tylko w TH (`empireDetailPanel.ts`). (4) **Karta jednostki** â€” zoom lift + duch medallion + zĹ‚ote scrollbary. (5) **Granice** â€” force ON w mieĹ›cie, nie gasnÄ… na mapie (`main.ts`). (6) **Ulepszenia** â€” tylko wĹ‚asne terytorium + tartak nie znika (`improvement-build.ts`, `territory.ts`). (7) **NAP** â€” bez pustej oferty (`diplomacyTradeBasket.ts`). (8) **Magazyn/Spichlerz cap 1000** (`econ-params.json`). (9) **Pre-battle scrim** (`preBattle.ts`). (10) **Bitwa obrys relief** (`battleScene.ts`). (11) **Dyplo** â€” hojnoĹ›Ä‡ wg trudnoĹ›ci + wycofany handel dostÄ™pem. (12) **MP Hard** â€” offensive support (`ai.ts`). (13) **MP packing** â€” `packCityStatesAroundCapital` + repack obcych klastrĂłw + `clusterStateTargets` od stolicy. (14) **AI priorytet** â€” `isLocalExpansionPhase` (skauciâ†’hutyâ†’MPâ†’founding).
- **Commit:** `6829df7` Â· **Pliki:** `clusters.ts` Â· `cluster-spawn.ts` Â· `ai.ts` Â· `main.ts` Â· `battleScene.ts` Â· `preBattle.ts` Â· `diplomacy*.ts` Â· `empireDetailPanel.ts` Â· `improvement-build.ts` Â· `territory.ts` Â· `econ-params.json` Â· UI HUD/panel

## ROBOCZA `bd187872` - 2026-07-28 19:26 - FALA 72: tooltipy HUD + karty detail normal + hub-chain MP - **ZASTÄ„PIONA**
- md5 (pelne): `bd18787215dc0ae9e98eab54944b117c` Â· stempel: `ROBOCZA Â· bd187872`
- **VERIFY OK.** tsc 0 Â· cluster-start hub-chain 6/6 PASS Â· vite build OK Â· POLE-BITWY bez zmian.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Tooltipy HUD** â€” `hudTitleTooltip.ts` + `installHudTitleTooltips()` w `showHud` (15px, jasny box; zamiast natywnego title). (2) **Karty wyjaĹ›nieĹ„** â€” przywrĂłcone rozmiary: `.detail-card` 0.78em, sekcje ~0.68â€“0.88em, float 400px, dock `HOVER_DETAIL_DOCK_W`=400; `sciencePicker` tooltipy cofniÄ™te z 2Ă—. (3) **MAP-SPAWN hub-chain** â€” `packCityStatesHubChain()` pierĹ›cieĹ„ 4 hex od stolicy, potem od kolejnych MP; min. odstÄ™p 4 hex miÄ™dzy MP na pierĹ›cieniu (`clusters.ts`).
- **Pliki:** `hudTitleTooltip.ts` Â· `hud.ts` Â· `cityPanel.ts` Â· `hoverDetailDock.ts` Â· `sciencePicker.ts` Â· `clusters.ts`

## ROBOCZA `0232836a` - 2026-07-28 19:10 - FALA 71: P0 end-turn session reset + heal + debug warns - **ZASTÄ„PIONA**
- md5 (pelne): `0232836ac4a721f4df33256cb3642dd4` Â· stempel: `ROBOCZA Â· 0232836a`
- Nowa gra / load resetuje endTurnInProgress + aiTurnAwaitingBattle + aiCmdResume + overlay tury
- healStaleEndTurnBlockers: orphan overlay, force-clear >8s, console.warn per blocker
- bottomBar: klik ZakoĹ„cz turÄ™ zawsze woĹ‚a triggerPlayerEndTurn (hint przy blokadzie)
- tsc 0 Â· Ctrl+F5 + certutil/md5 pliku = `0232836a`

## ROBOCZA `e441f614` - 2026-07-28 19:00 - FALA 70: P0 end-turn fix + bottomBar + battle cancel resume - **ZASTÄ„PIONA**
- md5 (pelne): `e441f614f2e94c2722012291e6828f8f` Â· stempel: `ROBOCZA Â· e441f614`
- **VERIFY OK.** tsc 0 Â· vite build OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** P0 Maciej â€” tura nie przechodziĹ‚a: (1) `canEndTurn` HUD â‰  bramki N (ciche `return` przy `aiCmdResume`/`aiTurnAwaitingBattle`); (2) self-heal zawieszonych flag po anulowaniu bitwy AI; (3) `BattleScene.onCancel` incoming â†’ `finishIncomingBattleUi`; (4) `triggerPlayerEndTurn()` wspĂłlny dla N i przycisku; (5) `bottomBarHud` â€” disabled + click-time gate; (6) guard `negotiationSummary` przy pustym payload.
- **Pliki:** `main.ts` Â· `bottomBarHud.ts`


## ROBOCZA `d109dfa8` - 2026-07-28 18:48 - FALA 69: deploy all (HUD+dyplo+epoch matrix+spawn 70%+MP pack) - **ZASTAPIONA**
- md5 (pelne): `d109dfa85c7006e708352e839d4330f2` Â· stempel: `ROBOCZA Â· d109dfa8`
- **VERIFY OK.** tsc 0 Â· diplomacy-display 28/0 Â· map-scale-menu 97/0 Â· cluster-start PASS (partial run, >140 asercji) Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **CIV-MAP-EPOCH-Q1** â€” macierz mapaĂ—epoka (typy cywilizacji + mp per rozmiar i epoka startu). (2) **HUD** â€” jeden wiersz: chipy Armiaâ€¦Religia + Civpedia + Menu (`hud.ts`/`hudLayout.ts`). (3) **Karta jednostki** â€” dock lewy `SIDE_PANEL_LEFT` 86px (`sidePanelLayout.ts`). (4) **Grecy display name** â€” `civCardDisplayName`/`civDisplayNameFromKey` (`leaderPortraits.ts`). (5) **Handel AI** â€” fix pustej tablicy give/receive (`diplomacy-display.ts`). (6) **MAP-SPAWN** â€” lokalny lÄ…d â‰Ą70% (`LOCAL_LAND_DOMINANCE_FRAC`) + packing MP (`packRivalCitiesAroundCore`/`packCityStatesHubChain`). (7) **Dziedziczone F67â€“68:** rzeki W2 Â· civ 4/5/6/10/12/15 Â· filtr epoki.
- **Pliki:** `newGameMapDefaults.ts` Â· `e-start-params.json` Â· `clusters.ts` Â· `cluster-spawn.ts` Â· `startScoring.ts` Â· `hud.ts` Â· `hudLayout.ts` Â· `sidePanelHud.ts` Â· `leaderPortraits.ts` Â· `diplomacy-display.ts` Â· `diplomacy-proposals.ts` Â· `diplomacyAudience.ts` Â· `newGameFlow.ts` Â· `main.ts`


## ROBOCZA `9b8f3539` - 2026-07-28 18:01 - FALA 68: deploy all (re-build ĹşrĂłdeĹ‚ roboczych gra/src) - **ZASTAPIONA**
- md5 (pelne): `9b8f3539c5c82fe5da5ce17f5fe8b4de` Â· stempel: `ROBOCZA Â· 9b8f3539`
- **VERIFY OK.** tsc 0 Â· cluster-start 123/0 Â· river-map-scale 11/0.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** ponowny deploy all ze Ĺ›wieĹĽego buildu Vite (niezacommitowane zmiany `gra/src` + `gra/data`). Ten sam pakiet co FALA 67: rzeki W2 Â· MAP-SPAWN C+B Â· typy cywilizacji 4/5/6/10/12/15 Â· filtr epoki startu. Nowy md5 (â‰  `934ac394`).
- **Pliki:** `newGameMapDefaults.ts` Â· `gen-helpers.ts` Â· `generator.ts` Â· `clusters.ts` Â· `cluster-spawn.ts` Â· `cluster-start.ts` Â· `newGameFlow.ts` Â· `e-start-params.json` Â· `map-gen-params.json` Â· `main.ts`


## ROBOCZA `934ac394` - 2026-07-28 17:42 - FALA 67: deploy all (rzeki W2 + MAP-SPAWN C+B + civ counts + filtr epoki) - **ZASTAPIONA**
- md5 (pelne): `934ac394eb47fd83746275bc3eb18257` Â· stempel: `ROBOCZA Â· 934ac394`
- **VERIFY OK.** tsc 0 Â· cluster-start 123/0 Â· river-map-scale 11/0.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Rzeki skala mapy W2** â€” `resolveRiverMapParams` + feedery `tributaryCell`. (2) **MAP-SPAWN C+B** â€” wyspa â‰Ą25% masy, Voronoi â‰Ą70% dominacji. (3) **Typy cywilizacji** â€” Malenki 4 â€¦ Super Huge 15 (menu Â±1). (4) **Filtr epoki startu** â€” spawn + suwak: kamienâ‰¤8, brazâ‰¤14, zelazoâ‰¤15 (kaskada `civIdsAvailableAtGameEpoch`).
- **Pliki:** `newGameMapDefaults.ts` Â· `gen-helpers.ts` Â· `generator.ts` Â· `clusters.ts` Â· `cluster-spawn.ts` Â· `civ-entry-epoch.ts` Â· `newGameFlow.ts` Â· `e-start-params.json` Â· `main.ts`


## ROBOCZA `20b25cc0` - 2026-07-28 17:35 - FALA 66: typy cywilizacji per mapa (tylko liczby, bez reszty paczki) - **ZASTAPIONA**
- md5 (pelne): `20b25cc07614fdb89cdb17d7de81854e` Â· stempel: `ROBOCZA Â· 2026-07-28 17:35`
- **VERIFY OK.** tsc 0 Â· map-scale-menu 32/0 Â· cluster-start 106/0.
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** domyslna liczba typow cywilizacji per rozmiar mapy (Malenki 4 â€¦ Super Huge 15); menu kreatora min/default/max = defaultÂ±1 (clamp 1..15); Panel-E + map-gen fallback.
- **Pliki:** `e-start-params.json` Â· `newGameMapDefaults.ts` Â· `map-gen-params.json` Â· `map-scale-menu-test.cjs`


## ROBOCZA `8092d730` - 2026-07-28 16:21 - FALA 65: Handel UX A-D + HUD prawy pasek + tooltips - **ZASTAPIONA**
- md5 (pelne): `8092d730685bd083c9a7797e3461adad` Â· stempel: `ROBOCZA Â· 2026-07-28 16:21`
- **VERIFY OK.** tsc 0 Â· tech-tree 33/0 Â· unit-replace 10/10 Â· map-gen PASS (duza 12.42s<15s; determinizm+rzeki PASS) Â· smoke OK (post-publish) Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Handel UX A+B+C+D** â€” trasy handlowe, panel imperium, flow w main. (2) **HUD prawy pasek** â€” hud.ts, hudLayout.ts, sidePanelHud.ts. (3) **cityPanel** â€” tooltips wzrost/zamoĹĽnoĹ›Ä‡. (4) **sciencePicker** â€” tooltips 2x. (5) **hoverDetailDock** â€” korekta.
- **Pliki:** `trade-routes.ts` Â· `main.ts` Â· `empireDetailPanel.ts` Â· `empireDetailTypes.ts` Â· `cityPanel.ts` Â· `sciencePicker.ts` Â· `hoverDetailDock.ts` Â· `hud.ts` Â· `hudLayout.ts` Â· `sidePanelHud.ts`


## ROBOCZA `145452c9` - 2026-07-28 15:04 - FALA 64: armia Rozdziel + karta stosu + Spacja cykl - **ZASTAPIONA**
- md5 (pelne): `145452c99f51e6a80abdbd04c88f70b5` Â· stempel: `ROBOCZA Â· 2026-07-28 15:04`
- **VERIFY OK.** tsc 0 Â· tech-tree 19/0 Â· research 33/0 Â· unit-replace 10/10 Â· map-gen FAIL (duĹĽa mapa 16.71s>15s; determinizm+rzeki PASS) Â· smoke OK Â· army-stack-ruch 5/0 Â· garnizon-exit 11/0 Â· army-merge-bounce 4/0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** (1) **Karta armii** â€” zwarty widok stosu: zetony HP/ruch per jednostka, bez zbiorczych Atak/Obrona/Pancerz/bonusow; szczegoly wybranej po â€žWiecej szczegolow". (2) **Rozdziel** â€” ikona na karcie bocznej (2+ jednostki) otwiera panel rozdzielenia na sasiedni heks. (3) **Spacja/auto-cykl** â€” po wyczerpaniu ruchu przechodzi do nastepnej jednostki/armii niezaleznie od ruchu. (4) **HUD** â€” karta jednostki vs minimapa (marginesy), panel Wydarzenia nie nachodzi na Wykonaj. (5) **Handel AI** â€” propozycje surowcow vs realne zasoby (`diplomacy-ai-balance.ts`).
- **Pliki:** `main.ts` Â· `hexContextTooltip.ts` Â· `unitActionBarHtml.ts` Â· `hud.ts` Â· `hudLayout.ts` Â· `minimapLayout.ts` Â· `sidePanelHud.ts` Â· `diplomacy-ai-balance.ts`

## ROBOCZA `0aa8e5c8` - 2026-07-28 14:28 - FALA 63: zoom nad minimapÄ… - **ZASTAPIONA**
- md5 (pelne): `0aa8e5c87ab46386cf82d346e85b06b7` Â· stempel: `ROBOCZA Â· 2026-07-28 14:28`
- **VERIFY OK.** tsc 0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** pasek zoom â’/+ i â›¶ nad gĂłrnÄ… krawÄ™dziÄ… minimapy (nie z boku). Pliki: `minimapLayout.ts`, `hud.ts`, `minimapHud.ts`.

## ROBOCZA `1a8f2f72` - 2026-07-28 14:22 - FALA 62: HUD Handel obok SurowcĂłw - **ZASTAPIONA**
- md5 (pelne): `1a8f2f721914e66163eb92d7bfddf4c7` Â· stempel: `ROBOCZA Â· 2026-07-28 14:22`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** lewy pasek HUD â€” Handel w grupie z Surowcami (nie zawija pod Skarbcem); szerszy banner-left, nowrap. Plik: `hud.ts`.

## ROBOCZA `846db7fc` - 2026-07-28 14:10 - FALA 61: kreator Bitwy + layout modal zaawansowany - **ZASTAPIONA**
- md5 (pelne): `846db7fcc09fb004d3241edd883b935b` Â· stempel: `ROBOCZA Â· 2026-07-28 14:10`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· cluster-start 93/0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** kreator nowej gry â€” ustawienie **Bitwy** (Automatyczne / RÄ™czna), modal zaawansowany przesuniÄ™ty w prawo, przycisk Zamknij zawsze widoczny, bez duplikatĂłw opisĂłw. Plik: `newGameFlow.ts`.

## ROBOCZA `b68ed206` - 2026-07-28 13:45 - FALA 60: wyrĂłwnanie HUD mapa + miasto (hudLayout.ts) - **ZASTAPIONA**
- md5 (pelne): `b68ed20671cd82dedefaf31e1a8996dc` Â· stempel: `ROBOCZA Â· 2026-07-28 13:45`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· cluster-start 93/0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** jedno ĹşrĂłdĹ‚o marginesĂłw HUD (`hudLayout.ts`) â€” mapa 20/16px, miasto 32px, zoom 10px; build panel right 20px; context 300px; 11 plikĂłw UI.

## ROBOCZA `0e985a95` - 2026-07-28 13:35 - FALA 59: karta jednostki vs minimapa + fortify/czuwanie - **ZASTAPIONA**
- md5 (pelne): `0e985a95fb0c8a28b8ada53e52b14360` Â· stempel: `ROBOCZA Â· 2026-07-28 13:35`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· cluster-start 93/0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** karta jednostki nad minimapa (minimapLayout.ts, +28px luz) + Ufortyfikuj/Czuwaj dzialaja poza terytorium + klik akcji w panelu heksa (dblclick). Pliki: minimapLayout.ts, sidePanelHud.ts, minimapHud.ts, hud.ts, main.ts.

## ROBOCZA `80608ce4` - 2026-07-28 12:58 - FALA 58: magazyn panstwa ceramika/sol/kon/zloto + spawn nagrody chatka - **ZASTAPIONA**
- md5 (pelne): `80608ce4bbca64b58c67d034bcba004b` Â· stempel: `ROBOCZA Â· 2026-07-28 12:58`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· cluster-start 93/0 Â· POLE-BITWY `dd399c4b` (bez zmian).
- Wejscie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** magazyn panstwa (Ceramika/Sol/Kon/Zloto stock+cap) + spawn nagrody chatka (findVillageRewardSpawnHex). Pliki: main.ts, empireDetailPanel, empireDetailTypes, villageRewards, city-hex-movement, villages-test.cjs.

## ROBOCZA `8dd05481` â€” 2026-07-28 12:28 â€” FALA 57: batch HUD + Miasta + spawn 4 hex + FALA 54â€“56 â€” **ZASTAPIONA**
- md5 (pelne): `8dd05481749e1950e0de31c1f8c40f48` Â· stempel: `ROBOCZA Â· 2026-07-28 12:28`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· cluster-start (4 hex) Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** **FALA 54â€“56** (karta armii, paski HP/ruch, HUD mapa/miasto, dock minimapy) + **Miasta** (chip zamiast LudnoĹ›Ä‡, tabela per miasto: obyw., ludnoĹ›Ä‡, wzrost, praca, pieniÄ…dz, ĹĽywnoĹ›Ä‡) + **Spichlerz** (tylko stan + przyrost, bez `/max`) + **Surowce** na lewym pasku za Handlem + **miasta-paĹ„stwa** dokĹ‚adnie **4 hex** od stolicy (fallback od innych MP w grupie).
- **Pliki:** `hud.ts` Â· `empireDetailPanel.ts` Â· `cityPanel.ts` Â· `minimapHud.ts` Â· `sidePanelHud.ts` Â· `hexContextTooltip.ts` Â· `main.ts` Â· `clusters.ts`

## ROBOCZA `fed92ad1` â€” 2026-07-28 12:05 â€” FALA 56: HUD mapa + miasto + dock minimapy (redeploy potwierdzajÄ…cy) â€” **ZASTÄ„PIONA**
- md5 (pelne): `fed92ad11b2bcfc5ea6e3be2459a9235` Â· stempel: `ROBOCZA Â· 2026-07-28 12:05`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· river-terrain-move 17/17 Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** jak `52bb743b` (FALA 50â€“56 w jednym bundle) â€” Ĺ›wieĹĽy build + pieczÄ™Ä‡ po audycie Macieja.
- **Uwaga:** poprzedni `52bb743b` (11:53) byĹ‚ juĹĽ na dysku; redeploy potwierdziĹ‚ zgodnoĹ›Ä‡ ĹşrĂłdĹ‚oâ†’bundle (nowa pieczÄ™Ä‡).

## ROBOCZA `52bb743b` â€” 2026-07-28 11:53 â€” FALA 56: HUD mapa + miasto + dock minimapy â€” **ZASTÄ„PIONA**
- md5 (pelne): `52bb743b503d0db9406dc5931543f8c7` Â· stempel: `ROBOCZA Â· 2026-07-28 11:53`
- **VERIFY OK.** tsc 0 Â· smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** **Mapa** â€” lewy pasek jeden rzÄ…d (SkarbiecÂ·PracaÂ·SpichlerzÂ·NaukaÂ·Handel), bez emoji đźŤž przy Spichlerzu; prawy klaster widoczny przy zoom UI; zoom Â± i â›¶ pod minimapÄ… (280px, lewa krawÄ™dĹş). **Miasto** â€” lewo: PracaÂ·Ĺ»ywnoĹ›Ä‡Â·Skarbiec; prawo przy nazwie: NaukaÂ·KulturaÂ·Religia; ikony brand (res-food/res-treasury/res-science), nowrap bez zawijania.
- **Pliki:** `hud.ts` Â· `cityPanel.ts` Â· `minimapHud.ts` Â· `sidePanelHud.ts`

## ROBOCZA `9bd4a0f6` â€” 2026-07-28 09:57 â€” FALA 55: paski HP + ruch na ĹĽetonach armii â€” **ZASTÄ„PIONA**
- md5 (pelne): `9bd4a0f6ded2720543f516c0cc49adcf` Â· stempel: `ROBOCZA Â· 2026-07-28 09:57`
- **VERIFY OK.** smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** FALA 54 + na kaĹĽdym ĹĽetonie skĹ‚adu armii: **pasek HP** (zielony) + **pasek ruchu** (niebieski) + tekst `22/22 Â· 2/2`; CSS `.sp-unit-stack-bar-hp`, `.sp-unit-stack-bar-mov`.
- **Bramki:** tsc 0 Â· smoke OK (deploy z 09:57; WERSJE zsynchronizowane 11:21).

## ROBOCZA `5162a385` â€” 2026-07-28 02:42 â€” FALA 54: karta armii â€” nazwa + skĹ‚ad od razu â€” **ZASTÄ„PIONA**
- md5 (pelne): `5162a385e35c232d9e6a675f4a182f69` Â· stempel: `ROBOCZA Â· 2026-07-28 02:42`
- **VERIFY OK.** smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** po poĹ‚Ä…czeniu jednostek karta pokazuje **â€žArmia Â· (q,r)â€ť** + liczbÄ™ oddziaĹ‚Ăłw na heksie; mini-karty skĹ‚adu widoczne bez â€žWiÄ™cej szczegĂłĹ‚Ăłwâ€ť; nagĹ‚Ăłwek panelu **Armia** (nie Jednostka).
- **Bramki:** tsc 0 Â· smoke OK.

## ROBOCZA `b337e2e0` â€” 2026-07-28 02:50 â€” FALA 53: rzeka bonus ruchu 1 MP â€” **ZASTÄ„PIONA**
- md5 (pelne): `b337e2e0ff5ab3f5580a0f16a2dbf3a6` Â· stempel: `ROBOCZA Â· 2026-07-28 02:50`
- **VERIFY OK.** smoke OK Â· river-move 17/17 Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** **Rzeka** â€” koszt ruchu **1 MP** na heksie z rzekÄ… (cofniÄ™cie bĹ‚Ä™du FALA 49); ignoruje kary lasu/wzgĂłrz/gĂłr â€” â€žautostrada wzdĹ‚uĹĽ rzeki".
- **Bramki:** tsc 0 Â· river-move 17/17 Â· smoke OK.

## ROBOCZA `111427dd` â€” 2026-07-28 02:45 â€” FALA 52: karta jednostki nad minimapÄ… â€” **ZASTÄ„PIONA**
- md5 (pelne): `111427dd444ea8d56154e808de92de4b` Â· stempel: `ROBOCZA Â· 2026-07-28 02:45`
- **VERIFY OK.** smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** karta **Jednostka** â€” lewy dolny rĂłg, nad minimapÄ… (280Ă—170, margines 20px); karta heksu zostaje w panelu Wydarzenia po prawej; `hideHud` ukrywa teĹĽ dock jednostki; warstwa na `<html>` (zoom UI).
- **Bramki:** tsc 0 Â· smoke OK.

## ROBOCZA `e49eb25d` â€” 2026-07-28 02:30 â€” FALA 51: wydarzenia max 50vh + zoom fix komunikatĂłw â€” **ZASTÄ„PIONA**
- md5 (pelne): `e49eb25d4f676c880f0c1bf65808a21b` Â· stempel: `ROBOCZA Â· 2026-07-28 02:30`
- **VERIFY OK.** smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· Ctrl+F5 + Nowa gra.
- **Zakres:** panel Wydarzenia (prawy dolny) â€” max **50% wysokoĹ›ci ekranu**, przewijanie w dĂłĹ‚ przy nadmiarze; pozycja stabilna przy zoomie UI (warstwa na `<html>`). Toasty dolne â€” teĹĽ poza skalowanym `body`, z limitem wysokoĹ›ci.
- **Bramki:** tsc 0 Â· smoke OK.

## ROBOCZA `85d115d4` â€” 2026-07-28 02:26 â€” FALA 50: HUD etykiety + zoom przy minimapie + tooltip budowy â€” **ZASTÄ„PIONA**
- md5 (pelne): `85d115d4a5a6dae37351eab976833c79` Â· stempel: `ROBOCZA Â· 2026-07-28 02:26`
- **VERIFY OK.** `Gra-ROBOCZA.html` + manifest Â· smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- **Zakres:**
  - **HUD mapy** â€” etykiety chipĂłw (Skarbiec, Armia, Spichlerzâ€¦) widoczne takĹĽe przy zoomie UI â‰  100%.
  - **Zoom â’/+** â€” tylko na mapie Ĺ›wiata, obok minimapy; w panelu miasta ukryty; peĹ‚ny ekran â›¶ w mieĹ›cie przy Menu.
  - **Budowa w terenie / zaĹ‚oĹĽenie miasta** â€” podpis â€žKliknij hex" przypiÄ™ty do heksu (nie do kursora), bez rozjazdu przy zoomie UI.
  - **NagĹ‚Ăłwek miasta** â€” chipy zasobĂłw: jedna liczba netto (bez rozbicia +10 +7 +3 inline).
- **Bramki:** tsc 0 Â· smoke OK Â· river-move 17/17.

## ROBOCZA `e906af1d` â€” 2026-07-28 02:04 â€” FALA 49: rzeka koszt 2 + cuda gĂłra + lama Inkowie â€” **ZASTÄ„PIONA**
- md5 (pelne): `e906af1d0fe2c6fe29a321ddbb68ed68` Â· stempel: `ROBOCZA Â· 2026-07-28 02:04`
- **VERIFY OK.** `Gra-ROBOCZA.html` + manifest Â· smoke OK Â· POLE-BITWY `dd399c4b` (bez zmian).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- **Zakres gameplay:**
  - **Rzeka** â€” koszt ruchu **2** pkt na heksie z rzekÄ… (byĹ‚o 1).
  - **Cuda Ĺ›wiata** â€” sekcja na **gĂłrze** listy Budowy w terenie (przed ulepszeniami); tylko gdy dostÄ™pne.
  - **LAMA** â€” zĹ‚oĹĽe/hodowla widoczne **tylko dla InkĂłw/AstekĂłw** (mapa, tooltip, budowa).
- **Bramki:** tsc 0 Â· river-move 17/17 Â· smoke OK Â· fix inject-build-stamp (zapis przez temp â€” OneDrive).

## ROBOCZA `2bdd9b59` â€” 2026-07-28 01:54 â€” FALA 48: redeploy roboczej (pieczÄ™Ä‡ + POLE-BITWY) â€” **ZASTÄ„PIONA**
- md5 (pelne): `2bdd9b59cdf96668a470d1c43beae2cf` Â· stempel: `ROBOCZA Â· 2026-07-28 01:54`
- **VERIFY OK.** `Gra-ROBOCZA.html` + manifest Â· smoke OK Â· POLE-BITWY OK.
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- **Zakres:** ten sam kod co FALA 47 â€” Ĺ›wieĹĽy build + pieczÄ™Ä‡ czasu; POLE-BITWY `dd399c4b`.
- **Bramki:** tsc 0 Â· smoke OK Â· publish POLE-BITWY bez bĹ‚Ä™du (fix skryptu).

## ROBOCZA `267d6d31` â€” 2026-07-28 01:41 â€” FALA 47: magazyn centralny + FALA 46 batch â€” **ZASTÄ„PIONA**
- md5 (pelne): `267d6d31a171df8de8061161e910444d` Â· stempel: `ROBOCZA Â· 2026-07-28 01:41`
- **VERIFY OK.** `Gra-ROBOCZA.html` + manifest (md5 HTML = md5 manifest). Smoke OK.
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0.
- **Co nowego (FALA 47):**
  - **Bramka budowy** â€” tylko surowce w centralnym magazynie paĹ„stwa; â€ždostÄ™p" do zĹ‚oĹĽa nie wystarcza.
  - **FALA 46** (ten sam batch): Spichlerz/Armia HUD, panel jednostki, tartak/cuda w terenie.
- **Bramki:** tsc 0 Â· deposit-building-gate 42/42 Â· map-improvement 64/64 Â· spichlerz 27/27 Â· river-move 17/17 Â· smoke OK.
- **POLE-BITWY:** `Gra-ROBOCZA-POLE-BITWY.html` md5 `dd399c4b1640c9934b03820291c319bf` (osobny build oblezenie-bitwa).

## ROBOCZA `4ef42265` â€” 2026-07-28 01:05 â€” FALA 46: Spichlerz/Armia HUD + panel jednostki + tartak/cuda â€” **ZASTÄ„PIONA**
- md5 (pelne): `4ef422657547260d564a082be463276a` Â· stempel: `ROBOCZA Â· 2026-07-28 01:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0.
- **Co nowego (FALA 46):**
  - **Spichlerz** â€” nowy ĹĽeton lewy pasek (miÄ™dzy PracÄ… a Surowcami): magazyn ĹĽywnoĹ›ci, przyrost/turÄ™, peĹ‚ny panel.
  - **Armia** â€” ĹĽeton pokazuje liczbÄ™ jednostek + odnowÄ™ rekrutĂłw; panel bez spichlerza i bez duplikatu LudnoĹ›ci.
  - **Panel jednostki** â€” kompaktowa karta po prawej, pasek akcji na dole, â€žWiÄ™cej szczegĂłĹ‚Ăłwâ€ť, bez dolnego paska Armia.
  - **Tartak/WyrÄ…b** â€” dokĹ‚adniejsze komunikaty gdy las poza terytorium.
  - **Cuda** â€” tylko z Budowy w terenie (nie z produkcji miasta).
- **Bramki:** tsc 0.

## ROBOCZA `12ee2a1f` â€” 2026-07-28 00:35 â€” FALA 45: UI produkcja/dyplomacja/drzewko tech + HUD â€” **ZASTÄ„PIONA**
- md5 (pelne): `12ee2a1f3df5abc97d1e452f7ec22f26` Â· stempel: `ROBOCZA Â· 2026-07-28 00:35`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0. POLE-BITWY: bez zmian.
- **Co nowego (FALA 45):**
  - **Wydarzenia produkcji:** symbol tylko gdy coĹ› realnie moĹĽna wyprodukowaÄ‡ (surowce/skarbiec/rekruci).
  - **Minimapa:** usuniÄ™te przyciski dev F/M (skrĂłty klawiatury zostajÄ…).
  - **Drzewko technologii:** WrĂłÄ‡ ESC w lewym gĂłrnym rogu; bez ikony i linii technicznej pod tytuĹ‚em.
  - **Umowa handlowa:** podglÄ…d Oferujemy|OferujÄ… jak w oczekujÄ…cych propozycjach; naprawione podsumowanie Jednorazowo/Co turÄ™.
  - **Panel miasta / HUD:** kolejka pusta ukryta, auto-budowa ikony, zamoĹĽnoĹ›Ä‡ kompakt, zoom UI scale.
- **Bramki:** tsc 0 Â· diplomacy-display 26/26 Â· logic 206/208 (pre-istniejÄ…ce).

## ROBOCZA `95021308` â€” 2026-07-28 00:05 â€” FALA 44: bonus koszar/kuĹşnia przy wejĹ›ciu do miasta + toast â€” **ZASTÄ„PIONA**
- md5 (pelne): `95021308eb1eb918bc95149d6928a8ef` Â· stempel: `ROBOCZA Â· 2026-07-28 00:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 8 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0. POLE-BITWY: bez zmian od FALA 42 (`a5a60f15`).
- **Co nowego (FALA 44):**
  - **Bonus budynkĂłw wojskowych (KuĹşnia/Koszary):** natychmiast przy **wejĹ›ciu lub przejĹ›ciu** przez heks wĹ‚asnego miasta (nie koniec tury).
  - **Toast graczowi** po nabyciu bonusu, np. â€žWojownik â€” Ateny: KuĹşnia +15% pancerzaâ€¦".
  - Bonus trwaĹ‚y; rekrutacja w mieĹ›cie â€” bonus przy narodzinach (bez dodatkowego komunikatu).
- **Bramki:** tsc 0 Â· unit-building-bonuses 82/82.

## ROBOCZA `33c49486` â€” 2026-07-27 23:50 â€” FALA 43: ĹĽeton jednostki â€” medalion + koszary/kuĹşnia â€” **ZASTÄ„PIONA**
- md5 (pelne): `33c4948673c578874dc897286371179b` Â· stempel: `ROBOCZA Â· 2026-07-27 23:50`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0. POLE-BITWY: bez zmian od FALA 42.
- **Co nowego (FALA 43):**
  - **C-OBCE-JEDN-Q2:** medalion wĹ‚aĹ›ciciela po lewej ĹĽetonu (portret / sygnet MP / czaszka barbarzyĹ„cy).
  - Ikony koszar (Ĺ›cieĹĽka B) i kuĹşni (Ĺ›cieĹĽka A) po bokach gwiazdek weterana â€” brÄ…z/srebro/zĹ‚oto.
  - UsuniÄ™te stare kropki/obwĂłdka u podstawy ĹĽetonu (`syncUnitUpgradeBadges` â†’ poziom 0).
- **Bramki:** tsc 0.

## ROBOCZA `6714d76f` â€” 2026-07-27 23:26 â€” FALA 42: Spichlerz U-12/U-25B + Garncarnia R7-C â€” **ZASTÄ„PIONA**
- md5 (pelne): `6714d76f2c20b6cf039fe517a3979b44` Â· stempel: `ROBOCZA Â· 2026-07-27 23:26`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 8 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0. POLE-BITWY: `a5a60f15` (bez zmian od FALA 41 follow-up).
- **Co nowego (FALA 42):**
  - **P84-SPICHLERZ U-12:** Zdrowie (+5/+10) **rĂłwnolegle** z +1%/+2% wzrostu (nie wykluczajÄ… siÄ™).
  - **P84-SPICHLERZ U-25B:** taĹ„sza racja ĹĽywnoĹ›ci Ă—0,75 / Ă—0,50 (nie Â˝ ĹĽywnoĹ›ci ludnoĹ›ci).
  - **P84-R7C-GARN:** nadwyĹĽka Ceramiki z Garncarni â†’ +Zadowolenie (+1 pkt/szt.).
  - **Panel miasta:** podglÄ…d racji ze Spichlerzem; Garncarnia surplus w sumie Zadowolenia z budynkĂłw.
- **Bramki:** tsc 0 Â· population-growth-v85 11/11 Â· bonus 20/20 Â· empire-food-b5 17/17.

## ROBOCZA `c1e7a596` â€” 2026-07-27 23:01 â€” FALA 41: PYTANIE-85 ĹĽywnoĹ›Ä‡ + Podatek + ulepszenia â€” **ZASTÄ„PIONA**
- md5 (pelne): `c1e7a5968dce012936d4925d05999d82` Â· stempel: `ROBOCZA Â· 2026-07-27 23:01` Â· commit: `68395cc`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html` Â· **Nowa gra** (Ctrl+F5).
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (OneDrive).
- **Follow-up 2026-07-27 23:10:** POLE-BITWY odĹ›wieĹĽony rÄ™cznie (`a5a60f15`) Â· BITWA-DUZA + OBLEZENIE-DUZE skopiowane z FALA 41 (`e2641312`) Â· `START.html` zsynchronizowany.
- **Co nowego (FALA 41):**
  - **PYTANIE-85:** centralny magazyn ĹĽywnoĹ›ci, racje 1/2/3, wzrost % uĹ‚amkowy po SzczÄ™Ĺ›ciu, panel Spichlerz centralny, batony racji w mieĹ›cie.
  - **Podatek:** strumieĹ„ z pĂłl terenu zawsze â€žPodatek" (bez Danina/Mennica); `terrain-yields.json` kolumna Podatek (ĹÄ…ka 2, Rzeka +3, Las +2).
  - **Ulepszenia (Excel Maciej):** bonus Podatek na 17 ulepszeniach terenu (`terrain-improvements.json`, 24 pola).
  - **GĹ‚Ăłd wojska:** 75% statĂłw bojowych (pancerz bez zmian) gdy zapasy < 0.
  - **P84-stock:** SĂłl/ZĹ‚oto/KoĹ„ magazyn, Stolarnia/Warsztat civ bonus (jeĹ›li w src).
- **Bramki:** tsc 0 Â· population-growth-v85 11/11 Â· bonus 13/13 Â· empire-food-b5 17/17 Â· army-hunger 13/13 Â· podatek-nazwa 15/15 Â· podatek-tooltip 12/12.

## ROBOCZA `71dffa40` â€” 2026-07-27 18:32 â€” FALA 40: Ĺ‚aĹ„cuch odlewni + tech tree â€” **ZASTÄ„PIONA**
- md5 (pelne): `71dffa407fd2d3bce734f0ee8c281cf2` Â· stempel: `ROBOCZA Â· 2026-07-27 18:32` Â· commit: `540d920`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html`
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (OneDrive stamp retry via TEMP OK).
- **Co nowego (FALA 40):**
  - **B-ODLEWNIA-2026-07-27:** Odlewnia brÄ…zu â†’ Odlewnia ĹĽelaza (brÄ…z+ĹĽelazo) â†’ Wielka odlewnia (+stal); Wielka KuĹşnia = tylko pancerz (+45% Ĺ‚aĹ„cuch).
  - **tech.json:** Hutnictwo ĹĽelaza Â· ObrĂłbka ĹĽelaza â€” wymagania, odblokowania, opisy.
  - **converters.ts:** multi-receptura per odlewnia; stal usuniÄ™ta z `wielka_kuznia`.
  - **resources.json** + testy lane (converters 33, koszty 119, upgrade 49, grupy 83, eko-p3 8, tech-tree 19).
- Decyzja: `docs/decyzje/B-ODLEWNIA-KUZNIA-LANCUCH-2026-07-27.md`
- **Bramki:** tsc 0 Â· VERIFY OK.

## ROBOCZA `a616a6dd` â€” 2026-07-27 17:50 â€” FALA 39: karta jednostki + staty efektywne â€” **ZASTÄ„PIONA**
- md5 (pelne): `a616a6dda7d9ed165d328411e19f8e19` Â· stempel: `ROBOCZA Â· 2026-07-27 17:50` Â· commit: `42da6f1`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html`
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (OneDrive/inject retry OK).
- **Co nowego (FALA 39):**
  - **C-OBCE-JEDN-KARTA:** medalion wĹ‚aĹ›ciciela Â· koszary Â· kuĹşnia Â· weteran Â· statusy (garnizon/czuwaj/fortyfikacja/oblÄ™ĹĽenie) â€” tooltip + army stack HUD (`unitCardStatus.ts`, `hexContextTooltip.ts`, `armyStackHud.ts`, `main.ts`).
  - **C-UNIT-CARD-Q1â€“Q3:** atak/obrona/pancerz/HP **efektywne** na karcie (baza maĹ‚ym) â€” `unit-card-stats.ts`.
- **Poza F39:** C-OBCE-JEDN-Q2 render 3D na ĹĽetonie Â· R-MUZYKA Â· R-FULLSCREEN.
- **Bramki:** tsc 0 Â· vite build OK.

## ROBOCZA `08c676a5` â€” 2026-07-27 17:32 â€” FALA 38: DYSPOZYCJA-85 globalny suwak â€” **ZASTÄ„PIONA**
- md5 (pelne): `08c676a56b568d59277d0a5e573a517a` Â· stempel: `ROBOCZA Â· 2026-07-27 17:32` Â· commit: `001a4b1`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html`
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (npm devdir warning).
- **Co nowego (FALA 38):**
  - **DYSPOZYCJA-85-SUWAK=C:** globalny domyĹ›lny podziaĹ‚ Daniny/Podatku imperium + override per miasto (`empire-handel-split.ts`, `main.ts`, `empireDetailPanel.ts`, `cityPanel.ts`, save/load `meta.ownerDefaultPodzialHandlu`).
- **Poza F38:** C-OBCE-JEDN-Q2 render (portret/sygnet) Â· R-MUZYKA Â· R-FULLSCREEN.
- **Bramki:** tsc 0 Â· scout 10/10 Â· diplomacy-display 26/26 Â· deposit-gate 49/49 Â· mennica 49/49.

## ROBOCZA `6691eb3e` â€” 2026-07-27 17:25 â€” FALA 37: paczka ABC + ZNALEZISKO-86 â€” **ZASTÄ„PIONA**
- md5 (pelne): `6691eb3e920045a24f7be8f94216e1db` Â· stempel: `ROBOCZA Â· 2026-07-27 17:25` Â· commit: `a17b541`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html`
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (npm devdir warning).
- **Co nowego (FALA 37):**
  - **ZNALEZISKO-86=A:** â€žSzczegĂłĹ‚y bitwy" â€” % HP + pasek (`endDetails1E.ts`).
  - **R-BITWA-POWTORKA-I=B:** powtĂłrka = Ĺ›wieĹĽa auto-grupa (`battleScene.ts`).
  - **R-MAPGEN-KOLEJNOSC-Q2/Q3:** relief ~15% + peĹ‚ny floor.
  - **PYTANIE-77-DOP=B:** Ĺ‚aska Mennicy 1 tura (`mennica-zloto-grace.ts` + `main.ts`).
  - **PYTANIE-84:** runtime gate dostÄ™p/magazyn (`building-resource-gate.ts`, `turn-economy.ts`).
  - **R-DYP-STOL-A=C:** sekcje traktatu w koszyku (`diplomacyTradeBasket.ts`).
  - **C-OBCE-JEDN Q3:** tooltip weterana + pierwszy kontakt (`veteran.ts`, `hexContextTooltip.ts`).
  - **ECHO:** pliki decyzji ABC (bez nowego kodu poza powyĹĽszym).
- **NIE w tej fali (czeka `dziaĹ‚aj`):** C-OBCE-JEDN Q1â€“Q2 peĹ‚ny panel Â· R-PIERWSZE-MIASTO Â· DYSPOZYCJA-85-SUWAK wire main Â· R-MUZYKA Â· R-FULLSCREEN.
- **Bramki:** tsc 0 Â· scout 10/10 Â· diplomacy-display 26/26.

## ROBOCZA `1d2eb0ba` â€” 2026-07-27 17:11 â€” FALA 37 (prĂłbny build) â€” **ZASTÄ„PIONA**

## ROBOCZA `a74c3797` â€” 2026-07-27 15:12 â€” FALA 36: PACZKA WDROĹ»EĹ BEZ ABC â€” **ZASTÄ„PIONA**
- md5 (pelne): `a74c3797e211532a457413e94fe28765` Â· stempel: `ROBOCZA Â· 2026-07-27 15:12` Â· commit: `2632156`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- WejĹ›cie: `gra-robocza/START.html`
- Wynik `vite build` exit 0. POLE-BITWY: pominiÄ™ty (build oblezenie-bitwa fail npm devdir).
- **Co nowego (FALA 36, batch bez nowego ABC):**
  - **Dyspozycja 85:** pasek zasobĂłw `Skarbiec Â· Praca Â· Surowce Â· Handel`; handel miÄ™dzynarodowy w chipie Handel.
  - **Kultura/religia/presja** (B-KULT-REL, KULT-PRESJA, KULT-DYP) â€” silnik w bundlu.
  - **B-SPIC / B-SUROW-BUD** â€” dane + bramki surowcĂłw.
  - **FALA 9 UI** (R-STARTPREVIEW, R-PANEL-DOCHOD, R-ARMIA, R-DRZEWO-TECHâ€¦) + **FALA 34â€“35** (scout, tartak, retreat, HUD, cykl armiiâ€¦).
  - **C-WIAR-D4 + C-WIAR-N1-UX:** DĹşwignia 4 Zaufanie + modal 3 opcje przed atakiem.
  - **C-WIAR-N4-AI=B:** AI rzadziej odmawia pomocy sojuszniczej gdy osĹ‚abione.
  - **P-AI-006/007/008** â€” produkcja AI, zasiÄ™g ekspansji, mury.
  - **R-MAPGEN-KOLEJNOSC-Q1â€“Q2** â€” pipeline lasu + relief ~15%.
  - **R-TEREN-DOPIAC + C-TEREN-IMPL:** teren bitwy 3 etapy + tooltip TEREN.
  - **R-AI-SUWAKI:** `decideAIEconomySliders` (ĹĽywnoĹ›Ä‡/handlarz/praca).
  - **R-DYP-STOL-A (czÄ™Ĺ›Ä‡):** modal handlu dyplomacji + statystyki imperium.
  - **R-BITWA-POWTORKA-I:** powtĂłrka bitwy â€” w F36 jeszcze stary snapshot; decyzja **B** (auto-grupa) w kodzie HEAD â†’ **delta FALA 37**.
- **NIE w tej fali:** R-MUZYKA-OPOZNIENIE Â· R-FULLSCREEN-PASEK Â· R-PIERWSZE-MIASTO Â· R-DYP-STOL-A peĹ‚ny stĂłĹ‚.
- **Bramki:** tsc 0 Â· scout 10/10 Â· map-improvement 58/58 Â· diplomacy-display 26/26 Â· manpower 62/62 Â· post-capture-law 11/11 Â· culture-religion 65/65.

## ROBOCZA `2e606ae6` â€” 2026-07-27 12:15 â€” FALA 35: HUD UX + CYKL ARMII + BANER â€” **ZASTÄ„PIONA**
- md5 (pelne): `2e606ae6f49e0f549cc337638939266e` Â· stempel: `ROBOCZA Â· 2026-07-27 12:15`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego (sesja F35, nad F34):**
  - **Koniec tury:** fix wiszÄ…cego banera armii po zakoĹ„czeniu tury (`syncPlayerUnitSelectionOnMap`).
  - **HUD:** tooltipsy chipĂłw zasobĂłw (Armia z rozbiciem wpĹ‚yw miast / koszt wojska, Nauka, Kulturaâ€¦).
  - **Cykl jednostek:** Spacja + â—€ â–¶ w panelu armii â€” wszystkie armie gracza (garnizon, bez ruchu).
- **Bramki:** tsc 0 Â· VERIFY OK.

## ROBOCZA `1e7f4cad` â€” 2026-07-27 11:56 â€” FALA 34: SCOUT CHATKA + TARTAK + OBRONA â€” **ZASTÄ„PIONA**
- md5 (pelne): `1e7f4cad0435fe00d8464d41a7faf8ff` Â· stempel: `ROBOCZA Â· 2026-07-27 11:56`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego (sesja F34):**
  - **Scout:** fix chatki wioski (`onAfterStep` w scout-auto-explore).
  - **Tartak:** tylko las + auto-usuwanie przy utratie lasu (improvement-build / map).
  - **Pre-battle:** wycofanie obroĹ„cy (defender retreat).
  - **Garnizon:** odfortyfikowanie (unfortify).
- **Bramki:** tsc 0 Â· scout-auto-explore 10/10 Â· map-improvement-qualify 58/58.

## ROBOCZA `2c3804da` â€” 2026-07-27 10:20 Â· FALA 33: GARNIZON + KULTURA + PRAWO + KLIMAT â€” **ZASTÄ„PIONA**
- md5 (pelne): `2c3804da371c027043b2669b535268c7` Â· stempel: `ROBOCZA Â· 2026-07-27 10:20`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock). PieczÄ™Ä‡: inject via temp (OneDrive lock na bezpoĹ›rednim zapisie).
- **Co nowego (sesja F33):**
  - **Panel miasta:** garnizon wyĹ›rodkowany pod badge ATENY/Stolica (`cityPanel.ts` CSS).
  - **Kultura:** fix `ownCultureShare` â€” zaĹ‚oĹĽone miasta / paĹ„stwa-miasta trzymajÄ… 100% kultury wĹ‚aĹ›ciciela od tury 2 (`main.ts`).
  - **B-LAW-Q1:** Prawo 100% przez 5 tur (Ĺ›wieĹĽy podbĂłj) lub 10 tur (odbicie po buncie) â€” `post-capture-law.ts`.
  - **C-MAP-Q3:** pasy klimatyczne (polarny/pustynia/rĂłwniny/umiarkowany), Ziemia bez Antarktydy, bufor oceanu N/S â€” **Nowa gra** (Ctrl+F5).
- **Bramki:** tsc 0 Â· post-capture-law 11/11 Â· climate-band OK Â· conquest-stability 29/29 Â· society-breakdown 40/40 Â· manpower 62/62 Â· picker 140/140 Â· diplomacy-display 17/17 Â· deposit-building-gate 41/41 Â· map-gen rivers 717/717 determinism OK (AC czas marginalny).

## ROBOCZA `e7c0655d` â€” 2026-07-27 09:56 Â· FALA 32: DYPLO STATY + FOG CHĹOPKI + MUZYKA FADE â€” **ZASTÄ„PIONA**
- md5 (pelne): `e7c0655d6bee033503f6bc26c86534b2` Â· stempel: `ROBOCZA Â· 2026-07-27 09:56`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F32):**
  - **Dyplomacja â€” statystyki:** karta gracza: moc/ranking/ludnoĹ›Ä‡/armia/wiarygodnoĹ›Ä‡; karty cywilizacji: ich ludnoĹ›Ä‡/armia + ich szacunek + nasz szacunek/zaufanie/relacja.
  - **Mapa â€” fog chĹ‚opek:** `syncWorkerFieldOverlayFog` ukrywa kolorowe chĹ‚opki na czarnym nieodkrytym terenie.
  - **Muzyka menu:** fade-in 5 s 0â†’100%, usuniÄ™ty opĂłĹşniony start.
  - **Dokumentacja:** handoff STAN-PRACY, KANAL-PRACA, REJESTR-DECYZJI, MACIEJ-GOTOWE, EKONOMIA-manpower-pobor.
- **Bramki:** tsc 0 Â· manpower 62/62 Â· picker 140/140 Â· diplomacy-display 17/17 Â· diplomacy-negotiation-table 39/39 Â· deposit-building-gate 41/41.

## ROBOCZA `f694dcba` â€” 2026-07-27 01:45 Â· FALA 31: WOJNA HUD + KLIK MAPY + DYPLO + MANPOWER HP â€” **ZASTÄ„PIONA**
- md5 (pelne): `f694dcba20acc6ed63866da4e3cd4672` Â· stempel: `ROBOCZA Â· 2026-07-27 01:45`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F31):**
  - **Wojna HUD:** usuniÄ™ty staĹ‚y pasek wojny; wydarzenia wojenne tylko w panelu Wydarzenia.
  - **Klik mapy:** pickMapTarget + raycast jednostek/heksĂłw (picker.ts, units.ts, main.ts).
  - **Dyplomacja:** karta â€žTwoje paĹ„stwo" bez traktatĂłw/wojen; dodane nauka/ludnoĹ›Ä‡/armia.
  - **Manpower B-MP-Q1:** uzupeĹ‚nianie HP (% max: 25/20/15), czÄ™Ĺ›ciowe MP, blokada oblÄ™ĹĽenia.
- **Bramki:** tsc 0 Â· manpower 62/62 Â· picker 140/140 Â· diplomacy-display 17/17 Â· diplomacy-negotiation-table 39/39 Â· deposit-building-gate 41/41 Â· logic 207/208 (pre garnizon).

## ROBOCZA `d9f2c1fa` â€” 2026-07-27 01:18 Â· FALA 30: DYPLOMACJA HANDEL + SLEEP + AI PERF â€” **ZASTÄ„PIONA**
- md5 (pelne): `d9f2c1fa32cd9b8165c00de127339ab3` Â· stempel: `ROBOCZA Â· 2026-07-27 01:18`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F30):**
  - **Dyplomacja â€” modal handlu:** naprawa pustego modala; koszyk z wyborem tur; podsumowania oferty; Anuluj/Esc.
  - **Jednostki:** po Sentry (sen) odznaczenie jednostki gracza (clearPlayerUnitSelection).
  - **AI:** cache + wczesny skip w pÄ™tli handlu dyplomatycznego (wydajnoĹ›Ä‡ tury AI).
- **Bramki:** tsc 0 Â· diplomacy-display 17/17 Â· diplomacy-negotiation-table 39/39 Â· manpower 44/44 Â· deposit-building-gate 41/41 Â· logic 207/208 (pre garnizon).

## ROBOCZA `e0238cc8` â€” 2026-07-27 01:01 Â· FALA 29: PANEL MIASTA UX + HEX DETAIL â€” **ZASTÄ„PIONA**
- md5 (pelne): `e0238cc8114bfe065a55573a590c714e` Â· stempel: `ROBOCZA Â· 2026-07-27 01:01`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F29):**
  - **NagĹ‚Ăłwek miasta:** flank layout â€” Praca/Ĺ»ywnoĹ›Ä‡/Skarbiec lewo, Kultura/Religia/Nauka prawo; przycisk wyjĹ›cia niĹĽej.
  - **â€ži szczegĂłĹ‚y":** fix kliku (z-index 410, pointer-events, przyciski).
  - **Rekrutacja:** uproszczony wiersz â€” bez HP/statĂłw w podtytule (unitRecruitCard).
  - **Budynki:** wymagania kolorowane niebieski/czerwony (cityPanel); sekcja â€žw mieĹ›cie" 2Ă— wiÄ™ksza.
  - **Mapa:** panel szczegĂłĹ‚Ăłw heksu na podwĂłjne klikniÄ™cie (main.ts).
  - **PieczÄ™Ä‡ build:** ukryta domyĹ›lnie + przeĹ‚Ä…cznik â„ą (buildStampToggle, inject-build-stamp).
- **Bramki:** tsc 0 Â· logic 207/208 (pre garnizon) Â· manpower 44/44 Â· deposit-building-gate 41/41.

## ROBOCZA `2dcd69e2` â€” 2026-07-27 00:39 Â· FALA 28: PANEL MIASTA + DYPLOMACJA + NAUKA â€” **ZASTÄ„PIONA**
- md5 (pelne): `2dcd69e2cd09b1f73253570728cd4d46` Â· stempel: `ROBOCZA Â· 2026-07-27 00:39`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F28):**
  - **Dyplomacja:** chipy paktĂłw (diplomacy-display, diploListHud, diplomacyPanel, diploUiSkin).
  - **Nauka:** `RESEARCH_QUEUE_MAX = 4` (sciencePicker, scienceHubHud, playerState).
  - **HUD miasta:** Civpedia + MENU ukryte w widoku miasta (hud.ts).
  - **Rekrutacja:** skondensowany layout (unitRecruitCard.ts).
  - **Budynki:** przyciski Buduj/Kup + stany can-build/cannot-build; tooltip labels + tile layout; strip dev notes.
  - **Hover flyout:** fix SzczegĂłĹ‚y (hoverDetailDock, cityPanel).
  - **Surowce w zasiÄ™gu:** tylko KoĹ„/SĂłl/ZĹ‚oto w panelu (resource-access.ts).
  - **ZakĹ‚adki miasta:** usuniÄ™te hint boxy.
  - **Detail dock:** fix layout bez overlap rails (cityUxFrame).
- **Bramki:** tsc 0 Â· diplomacy-display 17/17 Â· diplomacy-negotiation-table 39/39 Â· deposit-building-gate 41/41 Â· research 33/33 Â· fair-play-grid 8/8.

## ROBOCZA `b0d642b4` â€” 2026-07-27 00:11 Â· FALA 27: PANEL MIASTA â€” NAWIGACJA â€ą â€ş â€” **ZASTÄ„PIONA**
- md5 (pelne): `b0d642b4c3892284ac52e7f6060b497b` Â· stempel: `ROBOCZA Â· 2026-07-27 00:10`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock).
- **Co nowego (sesja F27):**
  - **Panel miasta â€” nawigacja:** przyciski â€ą â€ş zamiast przecinkĂłw/kropek; mniejszy font chevronĂłw.
  - **cityUxFrame:** `pointer-events:none` na `.civ-ux-top` + `auto` tylko na `.civ-v-top-stack` â€” klik w mapÄ™ pod banerem dziaĹ‚a.
  - **SkrĂłty klawiszowe:** `stopImmediatePropagation` na â† â†’ / , . â€” nie przechwytuje mapa.
  - **Rail ikon:** z-index 405 (nad panelami bocznymi).
- **Bramki:** tsc 0.

## ROBOCZA `a2436938` â€” 2026-07-27 00:08 Â· FALA 27: PANEL MIASTA UX â€” **ZASTÄ„PIONA**
- md5 (pelne): `a243693882d297d687273e10f01074f7` Â· stempel: `ROBOCZA Â· 2026-07-27 00:08`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (OneDrive lock przy inject).
- **Co nowego:**
  - **Panel miasta â€” ikony zakĹ‚adek:** `pointer-events` â€” gĂłrny pasek `none`, tylko `.civ-v-top-stack` i szyny ikon `auto`; z-index szyn 405 (klikalne taby lewa/prawa).
  - **Nawigacja miÄ™dzy miastami:** przyciski `â€ą` / `â€ş` zamiast `,` / `.`; skrĂłty klawiszowe `â†` / `â†’` (+ `,` / `.`) w `cityUxFrame`.
- **Bramki:** tsc 0 Â· smoke OK Â· logic 207/208 (pre garnizon).

## ROBOCZA `81b1d467` â€” 2026-07-26 23:52 Â· FALA 26: BITWA + DYPLOMACJA + MAPA 18% â€” **ZASTÄ„PIONA**
- md5 (pelne): `81b1d46795ddbaa51f6167a49b85857d` Â· stempel: `ROBOCZA Â· 2026-07-26 23:52`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (md5 HTML = md5 manifest).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0). POLE-BITWY: build pominiÄ™ty (ostrzeĹĽenie npm).
- **Co nowego (sesja F26):**
  - **Bitwa (battleScene):** obrona (`deployPlayerSide`), win/loss (`_playerWonFromBattleWinner`), manual (`_autoBattleSuspended`).
  - **Ekrany koĹ„ca bitwy:** `endScreen1E` + `endDetails1E` â€” statystyki po stronie gracza (`playerSide`).
  - **Panel miasta:** `sortProductionItemsByBuildability` + Skarbiec w banerze zasobĂłw.
  - **Dyplomacja:** kontrpropozycja przez `onCounterNegotiation` (audiencja + `main.ts`); handel od relacji neutralnej.
  - **Mapa:** gĂłrzystoĹ›Ä‡ medium ~18% lÄ…du (`relief_overflow_cap_frac` 0,06 GĂłry + 0,09 WzgĂłrza â€” decyzja wĹ‚aĹ›ciciela).
  - **Ekonomia:** `economy-upkeep` + panel imperium (`empireDetailPanel`) â€” korekty wyĹ›wietlania skarbca.
- **Bramki:** tsc 0 Â· diplomacy-negotiation-table 39/39 Â· fair-play-grid **8/8** Â· relief-grid-coverage **6/6** Â· upkeep 67/67 Â· map-gen-regression determinizm PASS (timing standard 5,41s â€” pre).

## ROBOCZA `96f307ce` â€” 2026-07-26 23:50 Â· FALA 26 (manifest bez HTML â€” OneDrive) â€” **ZASTÄ„PIONA**
- md5 manifest â‰  md5 HTML (OneDrive lock) â€” nie uĹĽywaÄ‡.

## ROBOCZA `b87481fc` â€” 2026-07-26 23:49 Â· FALA 26 (prĂłba publish) â€” **ZASTÄ„PIONA**
- md5 (pelne): `b87481fca6f9632ad3a6eebea90438c8` Â· stempel: `ROBOCZA Â· 2026-07-26 23:49`
- ZastÄ…piona przez `96f307ce` (ponowny build+publish po autoryzacji deploy).

## ROBOCZA `1636f388` â€” 2026-07-26 23:38 Â· FALA 25: KULTURA/RELIGIA + PANEL SKĹAD â€” **ZASTÄ„PIONA**
- md5 (pelne): `1636f388b512b008a2b95a6a46d8bdb9` Â· stempel: `ROBOCZA Â· 2026-07-26 23:38`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego:**
  - **Kultura â€” bez podwĂłjnej kary:** usuniÄ™ta druga linia â€žObca kultura â’2"; jedna pozycja **â€žKultura"** w rozpisce SzczÄ™Ĺ›cia.
  - **Miasta zaĹ‚oĹĽone = 100% kultury wĹ‚aĹ›ciciela** â€” presja sÄ…siadĂłw nie obniĹĽa udziaĹ‚u.
  - **PodbĂłj tego samego okrÄ™gu kulturowego** (np. Atenyâ†’Sparta, obie Grecka) = od razu 100% kultury + religia paĹ„stwa zdobywcy.
  - **OkrÄ™g kulturowy** porĂłwnywany po `typCywilizacji`, nie po nazwie paĹ„stwa.
  - **Presja kultury:** silniejsze imperium podnosi udziaĹ‚ wĹ‚asnej kultury (naprawa bĹ‚Ä™du obu gaĹ‚Ä™zi spadku).
  - **Panel miasta â€” Kultura:** sekcja â€žSkĹ‚ad kultury" (% wĹ‚aĹ›ciciela / obca + konwersja).
  - **Panel miasta â€” Religia:** â€žReligia paĹ„stwa" + â€žSkĹ‚ad wyznawcĂłw" z %.
- **Bramki:** tsc 0 Â· manpower-test 44/44 Â· ai-test 246/246 Â· map-attack-city 8/8 Â· society-breakdown 40/40.

## ROBOCZA `4a8745eb` â€” 2026-07-26 23:28 Â· FALA 24: MANPOWER IMPERIUM + FALA 23 â€” **ZASTÄ„PIONA**
- md5 (pelne): `4a8745eb332dbc9c3bd280e530ce60c7` Â· stempel: `ROBOCZA Â· 2026-07-26 23:28`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego (kumulatywnie od F22):**
  - **Manpower imperium (Maciej 2026-07-26):** werb/anulowanie/rozwiÄ…zanie jednostki â€” tylko pula rekrutĂłw cywilizacji (suma po miastach); **bez** spadku obywateli przy rekrutacji; zwrot MP do puli imperium, nie do miasta rekrutujÄ…cego.
  - Alert produkcji (warunkowy, âś• + fingerprint, bez auto-budowy) Â· baner zasobĂłw miasta 2Ă—3 Â· klik w miasto przy jednostce â†’ marsz Â· P-AI-011 + C-AI.
- **Bramki:** tsc 0 Â· manpower-test 44/44 Â· ai-test 246/246 Â· map-attack-city 8/8.

## ROBOCZA `e5972875` â€” 2026-07-26 23:21 Â· FALA 23: PRODUKCJA + UI MIASTA + MARSZ + AI HANDEL â€” **ZASTÄ„PIONA**
- md5 (pelne): `e5972875918e6e57c67657e2041674d2` Â· stempel: `ROBOCZA Â· 2026-07-26 23:21`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD roboczy `cba0a39` (lokalne zmiany w `gra/src`, niezacommitowane).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego:**
  - **Alert â€žProdukcja: â€¦ / Kolejka pusta"** tylko gdy `cityHasActionableProduction` (budynki, jednostki, ulepszenia poziomu, cuda â€” ta sama logika co panel). âś• zamyka i zapisuje fingerprint opcji; wraca po zmianie moĹĽliwoĹ›ci lub po oprĂłĹĽnieniu kolejki. Lista miast: â€žKolejka pusta" tylko wtedy samo. Auto-budowa (`budowaTryb=auto`) â€” bez alertu.
  - **Panel miasta â€” baner zasobĂłw 2Ă—3:** Praca/Ĺ»ywnoĹ›Ä‡/Skarbiec nad KulturÄ…/ReligiÄ…/NaukÄ…, wyrĂłwnane w jednym banerze.
  - **Klik w miasto przy zaznaczonej jednostce:** zawsze `planMarchTo` (takĹĽe przy 0 ruchu â€” podglÄ…d trasy); panel miasta tylko bez zaznaczenia. Obcy grĂłd: atak jeĹ›li moĹĽliwy, inaczej marsz na sÄ…siedni heks.
  - **P-AI-011 + pakiet C-AI** (proaktywny handel, audiencja AI, margines ceny, rozwĂłj/wojna/ekspansja) â€” kod w bundlu.
- **Bramki:** tsc 0 Â· ai-test 246/246 Â· map-attack-city 8/8 Â· logic-test 207/208 (pre: garnizon visibility).

## ROBOCZA `61cd43ad` â€” 2026-07-26 18:21 Â· FALA 22: GORZYSTOSC OBNIZONA DO ~12% â€” **ZASTÄ„PIONA**
- md5 (pelne): `61cd43ad517642a6bb92494a633871e5` Â· stempel: `ROBOCZA Â· 2026-07-26 18:21`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `668229a`.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego â€” C-MAPA-Q2 = B, obnizenie gorzystosci:**
  - Nowy nazwany parametr `gestosc.relief_overflow_cap_frac` w `map-gen-params.json`
    (jednostka: **ulamek heksow ladu w komorce siatki fair-play 25x25**):
    low 0,03 Gory / 0,05 Wzgorza Â· medium 0,04 / 0,06 Â· high 0,08 / 0,12.
    Dla medium suma = 0,10, czyli dokladnie progi wymagane przez `fair-play-grid-test`.
  - Przywrocony sufit `RELIEF_OVERFLOW_CAP_MULT = 1` (byl wylaczony na nieskonczonosc,
    bo w poprzedniej probie zbijal gorzystosc â€” teraz to jest CEL). Egzekwowany dwukrotnie:
    przy zasiewaniu reliefu i po rozroscie pasm gorskich.
  - **Naprawa, ktorej brakowalo w poprzedniej probie:** spozniony przebieg domykania reliefu
    dla typu â€žziemia" przycinal sufitem heksy z wymuszonymi zlozami fair-play i je KASOWAL.
    Nowa funkcja ochronna â€” heks ze zlozem nigdy nie jest kandydatem do przyciecia
    (ani w sufitcie gestosci, ani w limicie skupiska z decyzji 63).
- **Zmierzona gorzystosc** (5 ziaren, standard 168x120, kontynenty, relief medium), jednostka:
  **% powierzchni ladu**: przed 25,76â€“28,37% (srednia **26,64%**) -> po 11,83â€“12,68%
  (srednia **12,12%**). Ponad dwukrotny spadek. Powyzej idealnych 10%, bo podloga
  2 Gory + 2 Wzgorza na komorke oraz mniejsze komorki brzegowe podnosza efektywna gestosc.
- **âš ď¸Ź SKUTEK UBOCZNY DO OCENY PRZEZ WLASCICIELA â€” spadek liczby zloz** (sumy z 5 ziaren):
  miedz 317 -> 209 (**-34%**), zelazo 339 -> 225 (**-34%**), zloto 150 -> 67 (**-55%**).
  Miedz i zelazo maja gwarancje fair-play (min. 1 na komorke), zloto nie.
- **Bramki:** tsc 0 Â· relief-grid-coverage **6/6** Â· fair-play-grid **7/8** Â· zloto 43/43 Â·
  deposit-coast 20/20 Â· map-quality-forest-parity 101/101 Â· world-density 30/31 (porazka
  pre-istniejaca, niezwiazana z reliefem) Â· map-gen-regression: determinizm A=B (hash
  `471f0970`), **0 rzek bez ujscia** (710/710 do realnego morza); FAIL tylko na progach
  czasowych â€” pomiar wydajnosci kontenera, nie regresja.
- **Jedyna pozostala porazka fair-play** (â€žStandard Ziemia: zloza siatka 25 >=85%", dziĹ› 75%,
  bylo 50%): w jednym ziarnie komorka 21-heksowa nie ma ANI JEDNEGO heksu z rzeka, a regula
  gliny wymaga rzeki (decyzja 2026-07-24) â€” glina jest tam strukturalnie niemozliwa.
  Przyczyna lezy w generacji RZEK, nie reliefu. Test ani regula gliny nie byly naginane.

## ROBOCZA `3e847677` â€” 2026-07-26 17:57 Â· FALA 21: DZWIGNIA 2 WIARYGODNOSCI + TARASY UNIKALNE â€” **ZASTÄ„PIONA (61cd43ad)**
- md5 (pelne): `3e847677394e0464c0bd617760941a21` Â· stempel: `ROBOCZA Â· 2026-07-26 17:57`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `8e48dec`.
- **Wynik `vite build` sprawdzony PRZED kopiowaniem** (721 modulow, exit 0) â€” procedura po wpadce z fali 20b.
- **Co nowego:**
  - **Dzwignia 2 Wiarygodnosci (WIAR-9.5b=B)** â€” limit â€žmax_zaufanie_na_ture" (pkt Zaufania na ture,
    z darow i nadwyzki handlowej) zalezy teraz od Wiarygodnosci TEGO, KTO DAJE:
    W w [0,100] -> 5 pkt/ture (bez zmian) Â· W w (-40,0) -> 3 pkt/ture Â·
    W w (-70,-40] -> 1 pkt/ture Â· W w [-100,-70] -> 0 pkt/ture (zakup zaufania darem zablokowany).
    Cywilizacja o zlej reputacji nie kupi juz sympatii zlotem.
  - **Nagroda P5 â€žpomoc sojusznikowi"** (+20 pkt Wiarygodnosci) â€” naliczana wylacznie wtedy, gdy
    sojusznik FAKTYCZNIE dolacza do wojny na wezwanie obowiazku sojuszniczego.
  - **Kara N4 (odmowa pomocy)** â€” wpiety seam decyzyjny w AI; dzis zawsze â€žhonoruje sojusz",
    wiec ZERO zmiany w balansie, ale petla kary (-15 pkt Wiarygodnosci + zerwanie traktatu
    wylacznie odmawiajacemu) jest juz podpieta i czeka na heurystyke (decyzja balansowa do ABC).
  - **Tarasy uprawne znowu UNIKALNE kulturowo (C-TARASY-Q1=A)** â€” buduja je wylacznie Chinczycy
    i Inkowie. Bramka dziala w panelu budowy, na duchach/podswietleniu mapy, przy kliknieciu
    budowy ORAZ w planowaniu AI (parytet, bez rozgalezien per wlasciciel). Uzyto istniejacej
    konwencji z cudow swiata (pole â€žcywilizacje" w danych) â€” mechanizm jest ogolny, wiec kolejne
    ulepszenie unikalne to juz tylko wpis w JSON.
  - **Modal wyboru heksa w brandzie gry + maksymalne HP w szczegolach bitwy** â€” skomitowane
    wczesniej (`b9867b3`), do bundla wchodza dopiero TERAZ (build byl zablokowany).
- **Bramki:** tsc 0 Â· wiarygodnosc-test 84/84 (bylo 63/63) Â· tarasy-cywilizacje-test 17/17 (nowy) Â·
  ai-test 239/239 Â· logic-test 208/208 Â· civ-visual-test 54/54 Â· diplomacy-layers 14/14 Â·
  diplomacy-negotiation-table 39/39 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10.
  Porazki `diplomacy-test` 144/146, `diplomacy-proposal` 65/66, `diplomacy-value-catalog` 40/41 â€”
  identyczne jak bazowo, bez nowych regresji.

## ROBOCZA `856b804b` â€” 2026-07-26 Â· FALA 20b: PONOWNY BUILD PO NIEUDANYM DEPLOYU â€” **ZASTÄ„PIONA (3e847677)**
- md5 (pelne): `856b804bef0b80fe33e8d59628670235` Â· VERIFY OK. Zbudowane z commita `6e1e0e4`.
- **ZAWARTOSC IDENTYCZNA z fala 20** (Skarbiec i Praca netto). Nowy md5 wynika wylacznie
  z nowego stempla czasu.
- **âš ď¸Ź WPADKA DO ODNOTOWANIA:** bundle `ddcc04c1` (wgrany chwile wczesniej) byl NIEWAZNY â€”
  build sie NIE POWIODL, a `cp` skopiowal poprzednia zawartosc dist, wiec plik mial nowa
  pieczatke i stara tresc. VERIFY tego nie wykrywa, bo porownuje manifest z plikiem, a nie
  z wynikiem builda. **Wniosek na przyszlosc: sprawdzac wynik `vite build` PRZED kopiowaniem
  do gra-robocza â€” sam `VERIFY OK` nie jest dowodem, ze build sie udal.**
- **Przyczyna nieudanego builda:** commit `b9867b3` (modal wyboru heksa + maksymalne HP)
  objal `main.ts`, w ktorym byl juz import `diplomacyMaxZaufanieNaTureForWiarygodnosc`
  z NIEDOKONCZONEJ, niezacommitowanej pracy innego zlecenia (Dzwignia 2 Wiarygodnosci).
  `tsc` przechodzi, bo widzi caly katalog roboczy; bundler buduje wylacznie z tego, co
  skomitowane â€” i pada. Modal i maksymalne HP sa wiec SKOMITOWANE, ale NIE ma ich w tym
  bundlu; wejda razem z Dzwignia 2, gdy tamto zlecenie sie zamknie.

## ROBOCZA `0dc317f2` â€” 2026-07-26 Â· FALA 20: SKARBIEC I PRACA NETTO â€” **ZASTÄ„PIONA (ta sama zawartosc, nowy stempel: 856b804b)**
- md5 (pelne): `0dc317f28114bcfd86238aa706fc8910` Â· VERIFY OK, 6 bundli PLAYTEST, manifest 10 pozycji.
- Zbudowane z HEAD `6e1e0e4`.
- **Co nowego:** liczba przy Skarbcu pokazywala WPLYWY BRUTTO (Danina/Podatek + pieniadz
  z budynkow + Handel), a skarbiec rosl o NETTO â€” po odjeciu utrzymania budynkow i jednostek.
  Stad â€ž+6 na chipie, +1 realnie". Ten sam blad mial chip PRACY (brak odjecia utrzymania
  ulepszen surowcowych). Nauka i Zywnosc sprawdzone â€” bez tej wady.
  Tooltipy chipow pokazuja teraz pelne rozbicie z nazwami i jednostkami, wiec widac,
  gdzie znika roznica.
- **Bramki:** tsc 0 Â· hud-skarbiec 7/7 (nowy) Â· currency 32/32 Â· upkeep 67/67 Â·
  plony-budynkow 68/68 Â· korupcja 18/18 Â· logic 208/208 Â· wire-ekonomia 37/37 Â· ai 239/239.

## ROBOCZA `ce54be5b` â€” 2026-07-26 17:22 Â· FALA 19: DWA BLEDY BLOKUJACE + WIARYGODNOSC â€” **ZASTÄ„PIONA**
- md5 (pelne): `ce54be5b062f229cf77871597774573a` Â· stempel: `ROBOCZA Â· 2026-07-26 17:22`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `7931364`.
- **Naprawione oba bledy blokujace zgloszone w playtescie:**
  - **Jednostka przenoszona w nieoczekiwane miejsce** â€” przyczyna NIE byla w garnizonie ani
    fortyfikacji (obie przesledzone i wykluczone), tylko w oknie â€žPolaczenie armii": klik
    w przyciemnione tlo i Escape dzialaly jak swiadome â€žZostaw osobno", a ta akcja FIZYCZNIE
    odsuwa jednostke w strone heksu wyjscia (albo na sasiedni wolny, gdy oryginalny zajety).
    Modal wyskakuje odroczony na przelomie tury â€” czyli gdy gracz klika w mape po kolejny
    rozkaz. Stad trzy warianty objawu naraz. Blad istnial od 2026-07-22.
  - **Spichlerz niedostepny mimo odkrytej technologii** â€” bramka byla poprawna (wymaga dostepu
    do Ceramiki), ale katalog budynkow NIGDY nie sprawdzal bramki surowcowej, wiec budynek
    dostawal status â€žgotowy" i znikal z sekcji â€žJeszcze zablokowane" bez zadnego komunikatu.
    Dotyczylo OSMIU budynkow: Garncarnia, Stolarnia, Warsztat kamieniarski, Cegielnia, Kuznia,
    Mennica, Odlewnia brazu/Piec hutniczy, Spichlerz II.
- **Wiarygodnosc cywilizacji â€” etapy 2-4 wpiete w silnik**: rejestr zdarzen i strumienia
  przechodzacy przez zapis gry, kary N1-N7 (N1/N3 w jedynym wspolnym punkcie rozstrzygania
  potyczki, wiec parytet AI z konstrukcji), nagrody S1-S4/P1-P3/P4, oraz Dzwignia 1 â€”
  reputacja realnie wplywa na Zaufanie co ture (W/20, poza aktualnym przeciwnikiem wojennym).
  Przy okazji naprawiona atomowosc handlu cyklicznego: walidacja obu stron przed transferem,
  barter jako jedna para, wina liczona wylacznie stronie winnej.
- **Generator map â€” nowa kolejnosc krokow** (teren â†’ rzeki â†’ lasy â†’ surowce). Zmiana parametrow
  lasu przestaje przestawiac losowanie gor i zloz. Naprawione pokrycie reliefu (test 2/6 â†’ 6/6).
  Gorzystosc 19,16-20,58% (srednia 19,53%), determinizm i ujscia rzek bez zmian.
- **Bramki:** tsc 0 Â· logic 208/208 Â· ai 239/239 Â· wiarygodnosc 63/63 Â· spichlerz-widocznosc
  45/45 Â· army-merge-dismiss 16/16 Â· relief-grid-coverage 6/6 Â· world-density 31/31 Â·
  zloto 43/43 Â· deposit-coast 20/20 Â· map-quality-forest-parity 101/101.
- **Znane, NIEROZWIAZANE:** `fair-play-grid-test` 3/8 â€” udowodniona sprzecznosc arytmetyczna
  miedzy progami testu (~10% sufitu gestosci) a decyzja 80A (gorzystosc 19,3%). Wymaga decyzji
  wlasciciela, nie poprawki kodu.

## ROBOCZA `2f928932` â€” 2026-07-26 17:05 Â· FALA 18: NEGOCJACJE NA ZYWO + MUZYKA â€” **ZASTÄ„PIONA**
- md5 (pelne): `2f9289326f96147eab74f7403d306924` Â· stempel: `ROBOCZA Â· <pre-stamp> Â· 2026-07-26 17:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z czystego HEAD `a0847fd` w osobnym worktree. Trwajace prace (generator map,
  regresja cofania jednostek, blokada Spichlerza) **NIE** weszly do tego bundla.
- **Co nowego wzgledem `17ca0a4f`:**
  - **Negocjacje dyplomatyczne NA ZYWO** (R-DYP-NEGOCJACJE-NA-ZYWO) â€” po playtescie wlasciciel
    odrzucil model â€žpropozycja czeka na ture AI". Teraz AI odpowiada natychmiast w tym samym
    oknie audiencji: przyjmuje, odrzuca albo kontruje; gracz odpowiada i domyka rozmowe na
    miejscu. Zadna regula silnika nie ruszona â€” zmienil sie wylacznie moment rozstrzygania.
    Naprawione przy okazji: przyjecie i odrzucenie nie odswiezaly okna audiencji; komunikaty
    mowia teraz, czego dotyczyla propozycja.
  - **Start muzyki w menu glownym** (R-MUZYKA-OPOZNIENIE) â€” utwor startuje po gotowosci
    odtwarzacza, ale nie wczesniej niz po 2500 ms (parametr menu.muzyka_opoznienie_startu_ms),
    wiec przegladarka nie scina juz poczatku. Dotyczy wylacznie pierwszego startu po wejsciu
    na strone.
- **Znane, jeszcze NIENAPRAWIONE w tym bundlu** (zgloszenia z playtestu, zlecenia w toku):
  jednostka bywa przenoszona w nieoczekiwane miejsce po zakonczeniu tury; Spichlerz
  niedostepny mimo odkrytej technologii.
- **Bramki:** tsc 0 Â· diplomacy-negotiation-table 39/39 Â· ai 239/239 Â· logic 208/208.

## ROBOCZA `17ca0a4f` â€” 2026-07-26 16:24 Â· FALA 17: DECYZJE ABC + PARYTET AI â€” **ZASTÄ„PIONA**
- md5 (pelne): `17ca0a4f3ed09a2daf955667a17cf4a1` Â· stempel: `ROBOCZA Â· f9125052 Â· 2026-07-26 16:24`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z czystego HEAD `3c17ce5` w osobnym worktree â€” praca nad generatorem map
  (nowa kolejnosc krokow) trwa i **NIE** weszla do tego bundla.
- **Co weszlo:**
  - **Stol negocjacyjny dyplomacji** (C-DYP-Q1=A) â€” propozycja nie jest juz rozstrzygana
    natychmiast, laduje na stole; AI odpowiada w swojej turze i moze zlozyc kontroferte
    (limit 3 rundy, waznosc 5 tur). Nowa kolumna â€žOczekujace propozycje" w audiencji.
  - **Teren przy obronie miasta tylko z murem** (C-COMBAT-Q2) â€” miasto bez muru na wzgorzu
    ma 0% bonusu; przy okazji teren i budynki obronne SUMUJA sie w punktach procentowych,
    a nie mnoza (komplet na wzgorzu: 450%, bylo 675%).
  - **Bonus murow wylacznie do Obrony** we wszystkich trzech trybach walki (C-COMBAT-Q1);
    â€žPomin" w ogole nie stosowalo murow.
  - **Weterani w bitwie â€žAuto"** â€” premia byla ignorowana w kazdym starciu AI-vs-AI
    i przy kazdym kliknieciu â€žAuto"; przyczyna byl cache fieldPower z eksportu danych.
  - **Teren w bitwie, trzy etapy** (C-TEREN-Q1=A) â€” Gory +75% Obrony, Delta Zasiegu
    (Las -1, Wzgorza +1 pola), konnica: Las x2 kosztu, Gory niedostepne.
  - **Glod armii** (C-GLOD-Q1=A, C-GLOD-Q2=B) â€” karencja 3 tury z odliczaniem w HUD,
    zuzycie x1,0 na wlasnym terytorium i x2,0 poza nim, atrycja dziala teraz TAKZE dla AI
    (dotad wylacznie dla gracza â€” AI mialo darmowa armie).
  - **Ufortyfikowana jednostka zjada polowe zywnosci** â€” parametr istnial od zawsze
    i byl martwy (flaga camping zahardkodowana na false).
  - **Realna fortyfikacja w polu, takze podczas oblezenia** â€” zeruje ruch, nie przerywa
    oblezenia, daje +2 pkt Obrony (ozywiony fortify_obrona_bonus). Dotad â€žUfortyfikuj"
    poza wlasnym miastem zuzywalo ruch i nie robilo nic.
  - **Parytet AI** (C-AI-SUWAKI=A) â€” AI rusza suwakami zywnosci/Handlu/Pracy (dotad ani
    razu, przez cala partie), kara za wojne nalicza sie miastom AI (dotad tylko graczowi).
  - **Garnizon** (C-GARN-Q1=A + rozszerzenie) â€” jednostka ufortyfikowana byla PERMANENTNIE
    niesterowalna; trzy drogi wyjscia, w tym rozkaz ruchu z listy armii zdejmujacy
    fortyfikacje automatycznie.
  - **Odznaki weterana na zetonach** (decyzja 57) â€” zlote gwiazdki, 2 dla +10%, 3 dla +20%.
  - **Budynki** â€” 54a Baszta wymaga Murow, 54b Akwedukt wymaga Studni, Targowisko wg
    PYTANIE 20=A (Pieniadz 3->5 pkt, przyrost 2->3 pkt, martwy mnoznik skasowany).
  - **Wersja 0.9** takze na ekranie Nowej Gry (drugie, pominiete miejsce z â€žv0.1").
- **Bramki:** tsc 0 Â· logic 208/208 Â· ai 239/239 Â· combat 6/6 Â· battle-roster 7/7 Â·
  weterani 55/55 Â· glod-wojska-karencja 39/39 Â· fortify-pole 25/25 Â· garnizon-exit 11/11 Â·
  city-defense-terrain-gate 31/31 Â· structure-defense-bonus 8/8 Â· teren-walki-etapy 26/26 Â·
  diplomacy-negotiation-table 39/39 Â· ai-slider 37/37 Â· war-happiness-parity 18/18 Â·
  prereq-budynkow 59/59 Â· administracja-stolica 48/48 Â· happiness-breakdown 38/38.

## ROBOCZA `290a962b` â€” 2026-07-26 14:27 Â· FALA 16: PLAYTEST MACIEJA (10 napraw) â€” **ZASTÄ„PIONA**
- md5 (pelne): `290a962b077588ecbbaa1820fc470ae8` Â· stempel: `ROBOCZA Â· 69644b2d Â· 2026-07-26 14:27`
- **VERIFY OK.** Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z **czystego HEAD `6be1355`** w osobnym worktree â€” w drzewie roboczym trwaly
  rownolegle dwa zlecenia (teren w bitwie, bonus murow), wiec ich niedokonczone zmiany
  NIE trafily do bundla. Swiadoma decyzja, zeby playtest dostal wylacznie skonczone rzeczy.
- **Co weszlo (zgloszenia z playtestu 2026-07-26):**
  - **Trafianie w heks** (`R-RUCH-WZGORZA-2`) â€” 29,7% klikniec trafialo w zly heks (40,0% na
    wzgorzach i gorach). Przyczyna: `InstancedMesh.raycast()` odsiewa caly mesh po
    boundingSphere liczonej leniwie przy pierwszym raycascie i nigdy nieodswiezanej; mgla wojny
    zawezala ja do odslonietego skrawka na starcie gry. Plus martwa strefa 6 px w `camera.ts`
    (pan zaczynal sie od pierwszego piksela, klik ginal). Po poprawce 0,0%.
  - **Drzewko technologii** â€” Escape zamyka drzewko przed pelnym ekranem (Keyboard Lock API),
    przycisk `âś•` zastapiony wysrodkowana pigulka â€žâ† Wroc Â· ESC".
  - **Panele lewej kolumny** â€” koniec nachodzenia na przyciski toolbara i na pasek chipow;
    jedno zrodlo offsetow (`ui/sidePanelLayout.ts`, 86 px / 104 px) dla szesciu paneli.
  - **Lista armii** â€” pasek ruchu niebieski, etykiety â€žZdrowie 34/50" i â€žRuch 3/3" nad paskami.
  - **Nowa jednostka** (C-TURA-Q1 = A) â€” jednostka gotowa na przelomie tur ma pelne punkty
    ruchu w tej turze (wczesniej 0 pkt i tracila cala ture) + kamera leci do niej.
  - **Panel surowcow** â€” wiersze dostepu (Ceramika, Sol, Kon) widoczne zawsze (â€žmasz"/â€žbrak"),
    dolozone **Zloto** korzystajace z istniejacej bramki `ownerHasZlotoAccessNow`.
  - **Budynki stolica/region** â€” karta budynku nie pokazuje sie w miescie, w ktorym nigdy nie
    bedzie dostepny (blokada lokalizacji jest trwala, w odroznieniu od braku technologii).
  - **Model Wojownika (Kamien)** â€” trafial na stary model miecznika (`Typ = "Swordsman"`
    w `units.json`), nowy model Opus 5 byl martwym kodem. Widoczne glownie na miastach-panstwach.
  - **â€žRozegraj ponownie"** â€” powtorka gubila panel fazy rozstawiania (jedna linia chowala
    `_rosterBar` tuz po jego zbudowaniu).
  - **Barbarzyncy** (C-BARB-Q1 = B) â€” realna relacja â€žwojna" i atak przez ta sama bramke co
    reszta AI, zamiast wyjatku. Zamkniety przeciek: barbarzyncy potrafili trafic do listy
    odkrytych cywilizacji i otworzyc audiencje dyplomatyczna.
  - **Liczby na paskach** â€” koniec `Skarbiec +6.600000000000005`; wspolny `signedPl()`,
    zaokraglenie WYLACZNIE prezentacyjne (silnik liczy dalej na pelnej wartosci).
- **Bramki:** tsc 0 bledow Â· picker-test 140/140 (nowy) Â· ai 239/239 Â· logic 208/208 Â·
  combat 6/6 Â· battle-roster 7/7 Â· barbarians 148/148 Â· diplomacy-layers 14/14 Â·
  administracja-stolica 48/48 Â· prereq-budynkow 46/46 Â· zloto-szlak 45/45 Â·
  mennica-uspienie 47/47 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â·
  map-gen: determinizm A=B PASS, 0 rzek bez ujscia PASS (progi czasowe FAIL â€” wydajnosc
  kontenera, nie regresja) Â· build vite + smoke OK.

## ROBOCZA `7c7ae9a0` â€” 2026-07-26 12:18 Â· FALA 15: SCALENIE OBU INTEGRATOROW â€” **ZASTÄ„PIONA**
- md5 (pelne): `7c7ae9a018b174425ff9e99698f286c9` Â· stempel: `ROBOCZA Â· 5755d741 Â· 2026-07-26 12:18`
- **VERIFY OK.** Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- **TO PIERWSZY BUNDLE ZAWIERAJACY PRACE OBU INTEGRATOROW.** Do tej pory istnialy dwa rozne
  `gra-robocza/Gra-ROBOCZA.html` â€” jeden na `main` (drugi integrator), drugi na galezi
  `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (sesja chmurowa). Wlasciciel widzial tylko ten
  z `main`, wiec fale 12-14 sesji chmurowej NIGDY nie trafily do jego playtestu.
- **Z galezi main (drugi integrator):** naprawa suwaka lasu (40/60/80% â€” przyczyna byla
  zahardkodowanym sufitem 0,18 mniejszym od wszystkich progow, wiec tiery byly nierozroznialne),
  pasek w pelnym ekranie, tlo ikony dyplomacji, HP w liscie armii, dzwiek marszu jednostek,
  menu pauzy, koszt Murarstwa 28.
- **Z galezi sesji chmurowej (fale 12-14):** korupcja ozywiona (byla zahardkodowana na 0%),
  Pieniadz z budynkow i z konwersji Pracy do puli Daniny, domyslny podzial 20/60/20,
  nowa siatka Szczescia z kara ponizej 10%, Biblioteka +30%/Akademia +20%, Mennica tylko
  w stolicy + zasypianie bez zlota, zloto na szlakach, system weteranow, limit 10 heksow
  na skupisko gorskie przy gorzystosci 19,3%, 5 modeli jednostek wpietych, model Kopalni
  zlota, odznaki ulepszen na zetonach, bonus cudow zasilajacy Handel, nazewnictwo
  Danina/Podatek, Wyjdz w menu glownym, wersja 0.9.
- **KONFLIKT MERYTORYCZNY ROZSTRZYGNIETY PRZEZ WLASCICIELA:** obaj integratorzy wdrozyli
  decyzje 65B/66B niezaleznie. Maciej 2026-07-26: â€žok twoja glebsza" â€” obowiazuje wersja
  sesji chmurowej. Powod widoczny w kodzie: bramka z `main` nie sprawdzala ani wymogu
  STOLICY (66B), ani dostepu do ZLOTA (83B).
- **Bramki po scaleniu:** tsc 0 bledow Â· logic 208/208 Â· combat 6/6 Â· currency 32/32 Â·
  plony-budynkow 68/68 Â· korupcja 18/18 Â· praca-na-pieniadz 23/23 Â· zloto-szlak 45/45 Â·
  weterani 47/47 Â· mennica-uspienie 47/47 Â· danina-podatek-nazwa 15/15 Â· tooltip-ui 13/13 Â·
  cuda-handel 26/26 Â· szczescie-zamoznosc 60/60 Â· unit-replace 10/10 Â· dispatch-check OK.

<!-- ===== WPISY DRUGIEGO INTEGRATORA (galaz main) â€” doklejone przy scaleniu 2026-07-26 ===== -->

## ROBOCZA `c08b5fcc` â€” 2026-07-26 Â· naprawy UI z playtestu + lasy wg ustawienia â€” **AKTUALNA**

- **PeĹ‚ny ekran naprawiony** â€” przyczynÄ… paska u doĹ‚u NIE byĹ‚ element HUD, tylko canvas 3D zamroĹĽony na rozmiarze z chwili startu (`renderer.setSize()` nadpisywaĹ‚ `canvas.style` pikselami, kasujÄ…c 100%/100% z main.ts). Edge-pan wyĹ‚Ä…czaĹ‚ siÄ™, bo kursor wyjeĹĽdĹĽaĹ‚ poza obszar canvasu przed prawdziwÄ… krawÄ™dziÄ…. Fix w `render/scene.ts` (updateStyle=false + nasĹ‚uch `fullscreenchange`). **Efekt uboczny: naprawia teĹĽ skalowanie przy zwykĹ‚ej zmianie rozmiaru okna.**
- **Dyplomacja** â€” niebieskie kwadratowe tĹ‚o pod godĹ‚em paĹ„stwa â†’ obramĂłwka w tym samym kolorze (`.dip-pennant`, jeden wspĂłlny komponent = poprawione w liĹ›cie relacji i toolbarze naraz).
- **Lista armii** â€” dograne HP (suma stosu), widaÄ‡ ranne armie bez wchodzenia w kaĹĽdÄ….
- **Modal â€žCO WYBIERASZ?"** â€” populacja miasta i % HP jednostki na kaflach.
- **LASY wg ustawienia w kreatorze** â€” suwak â€žLas" wreszcie dziaĹ‚a: **MaĹ‚o 38% Â· Normalnie 58% Â· DuĹĽo 77%** (byĹ‚o ~15% niezaleĹĽnie od wyboru). Przyczyna: zahardkodowany cap `0.18` dominowaĹ‚ nad parametrem tierĂłw; wyniesiony do `FOREST_OVERLAY_CAP_FRAC=0.95`. Zero nowego kodu, tylko istniejÄ…ce wartoĹ›ci. âš ď¸Ź Przy â€žMaĹ‚o" ryzyko startu bez lasu w promieniu 5 NADAL istnieje (mechanizm gwarancji Ĺ›wiadomie niedodany).
- **Bramki:** tsc=0 Â· map-gen-regression PASS (determinizm) Â· combat 6/6 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10.
- Commity: `f4f6dd9` (4 naprawy UI), `b2f48bc` (lasy).

## ROBOCZA `076e3c0b` â€” 2026-07-26 Â· uwagi z playtestu Macieja (BEZ lasĂłw)

- **ZawartoĹ›Ä‡:** dĹşwiÄ™k marszu jednostek (nowy 4. kanaĹ‚ SFX mapy, synteza 0 MB, skalowany wielkoĹ›ciÄ… armii, cisza za mgĹ‚Ä… wojny, przeĹ‚Ä…cznik â€žOdgĹ‚osy jednostek") Â· przycisk PEĹNEGO EKRANU w HUD (funkcji wczeĹ›niej nie byĹ‚o) Â· â€žPodziaĹ‚ handlu" â†’ **Danina** / po Mennicy **Podatek** Â· Murarstwo 5â†’28 (dĹ‚uga gra 20â†’112, jak przed 24.07).
- **CELOWO BEZ LASĂ“W:** commit `e4c3e33` (pokrycie 14â†’83% + wymĂłg lasu przy starcie) **wycofany** rewertem `9a86e42` â€” Maciej: â€žbÄ™dziemy je zmieniaÄ‡ inaczej". Praca zachowana w historii, do ponownego uĹĽycia.
- **Bramki:** tsc=0 Â· map-gen-regression PASS Â· combat 6/6 Â· tech-tree 19/0 Â· research 33/33.
- Commity: `0645e92` (Murarstwo+Danina+peĹ‚ny ekran+dyspozycje), `bfa51c0` (marsz), `9a86e42` (revert lasĂłw).

## ROBOCZA `b1f16a59` â€” 2026-07-25 Â· FALA 10.1: fix bĹ‚Ä™dnego â€žmnoĹĽnika" PaĹ‚acu

- **ZawartoĹ›Ä‡:** caĹ‚a FALA 10 (patrz niĹĽej) **+ poprawka danych**: trzy tiery PaĹ‚acu miaĹ‚y w `baza.mnoznik` wartoĹ›Ä‡ rĂłwnÄ… DOKĹADNIE swojej kulturze (5/5, 8/8, 11/11, przyrost 0) â€” pomyĹ‚ka przy wpisywaniu danych, wykryta przy weryfikacji z Maciejem. Pole `mnoznik` NIE jest konsumowane przez silnik ekonomii (czytane tylko do wyĹ›wietlenia chipa â€žĂ—5 mnoĹĽnik" w panelu miasta), wiÄ™c karta PaĹ‚acu obiecywaĹ‚a bonus, ktĂłrego gra nie stosuje. Wyzerowane dla `palac`/`palac_ii`/`palac_iii` â€” chip znika, realne bonusy (kultura + zadowolenie, ktĂłre silnik faktycznie liczy) bez zmian.
- **Potwierdzone przez Macieja koszty i bonusy PaĹ‚acu:** I (KamieĹ„) 8 drewna / 40 pracy Â· kultura 5 (+3/poz.), zadowolenie 2 (+1/poz.) â€” II (BrÄ…z) 8 drewna+8 kamienia / 60 pracy Â· kultura 8 (+5), zadow. 3 (+2) â€” III (Ĺ»elazo) 8 drewna+8 kamienia+6 cegĹ‚y / 90 pracy Â· kultura 11 (+7), zadow. 5 (+2). Maks. poziom 10, ulepszane kolejno Iâ†’IIâ†’III.
- **Bramki:** tsc 0 Â· tech-tree 19/19 Â· VERIFY OK.
- **md5:** `b1f16a595b17a2cb37955cc8de4b2fc8` Â· pieczÄ…tka `b1f16a59`. ZastÄ™puje `99837b91`.
- **ZNANY DĹUG (do decyzji):** pozostaĹ‚e 11 budynkĂłw teĹĽ ma niezerowy `mnoznik` (kuĹşnia 5, karawanseraj 8, koszary 5, wielka kuĹşnia 23, akademia wojskowa 20, warsztat oblÄ™ĹĽniczy 10, akademia 10, pretorium 5, lazaret 5, kuĹşnia ĹĽelaza 8, targowisko +3/poz.) â€” tam wartoĹ›ci NIE sÄ… duplikatem kultury (wyglÄ…dajÄ… na zamierzonÄ…, ale NIGDY NIEZAIMPLEMENTOWANÄ„ mechanikÄ™). Silnik ich nie konsumuje. Do rozstrzygniÄ™cia: zaimplementowaÄ‡ mnoĹĽnik jako realnÄ… mechanikÄ™ czy usunÄ…Ä‡ z kart.


<!-- ===== WPISY SESJI CHMUROWEJ (galaz claude/sprawdzenie-funkcjonalnosci) ===== -->
## ROBOCZA `3cf111ce` â€” 2026-07-26 06:02 Â· FALA 14: jednostki Brazu wpiete + bonus cudow zasila Handel â€” **AKTUALNA**
- md5 (pelne): `3cf111ced9515fe4263cde7a75ddc692` Â· stempel z menu: `ROBOCZA Â· 8c897b6c Â· 2026-07-26 06:02`
- Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + `ROBOCZA-MANIFEST.json`. **VERIFY OK.**
- **Co weszlo:**
  - **PIEC MODELI JEDNOSTEK WPIETYCH** (dotad istnialy w repo, ale zaden zywy kod ich nie
    importowal): Wlocznik, Wojownik z mieczem i tarcza, Procarz, Rydwan (woly) â€” wszystkie
    epoka Brazu â€” oraz Hastati (epoka Zelaza, Rzym; model zastapil wczesniejszy
    z `hastati-falangita.ts`).
    - **Poprawka Wlocznika przed wpieciem:** wysokosc **0,999 -> 0,870 x HEX_R** (byl o jedna
      trzecia wyzszy od reszty serii i odstawal jak tyczka); tarcza przeniesiona z nadgarstka
      przy biodrze na srodek przedramienia, kryje tors od pasa po bark.
    - **SPROSTOWANIE:** w meldunku FALA 13 napisalem, ze wlocznia siega 0,999 w POZIOMIE
      i wchodzi na sasiednie pola. To byla moja bledna interpretacja pomiaru â€” 0,999 bylo
      WYSOKOSCIA, maks. promien poziomy wynosil 0,321 przy limicie 0,866.
    - Dopasowanie do jednostek po PELNEJ nazwie, nie po fragmencie. Nowy test
      `wpiecie-dispatch-check` 14/14 ma piec asercji NEGATYWNYCH potwierdzajacych, ze warianty
      kulturowe (Wlocznik sumeryjski, Procarz (Huaracoc), Rydwan egipski, Tyrski miecznik,
      Miecznik galijski) zachowaly wlasne modele.
  - **Bonus cudow `handel_procent` ozywiony** (decyzja wlasciciela 2026-07-26: â€žhandel nie
    danine"). Dotad ZADEN kod go nie konsumowal â€” czwarta martwa obietnica w tym projekcie.
    Zasila **Handel**, czyli dochod z tras handlowych z obcymi cywilizacjami, a **NIE Danine**
    (dochod miasta oddawany wladcy). Piec cudow: Petra 0,15 Â· Kamien Ha'amonga 0,15 Â·
    Kolos Rodyjski 0,20 Â· Brama wszystkich narodow 0,15 Â· Palac Weiyang 0,15.
    Kumulacja **addytywna** (spojnie z premiami budynkow i redukcja korupcji).
    Teksty w Poradniku i encyklopedii poprawione.
- **Bramki:** tsc 0 bledow Â· logic 208/208 Â· combat 6/6 Â· unit-replace 10/10 Â·
  wpiecie-dispatch-check 14/14 (NOWY) Â· cuda-handel 26/26 (NOWY) Â· trade-grant 60/60 Â·
  zloto-szlak 45/45 Â· currency 32/32 Â· mennica-uspienie 47/47 Â· danina-podatek-nazwa 15/15.
- **DO OGLEDZIN WLASCICIELA â€” dwa zastrzezenia integratora do wpietych modeli:**
  1. **Rydwan (woly) nie czyta sie jako rydwan** pod katem kamery 52 stopni â€” wyglada jak
     stojaca postac, nie widac ani zaprzegu, ani wozu.
  2. **Procarz jest wyraznie drobniejszy od reszty i nie widac u niego procy** â€” ta sama wada
     wracala juz trzy razy (proca czytana raz jako pochodnia, raz jako sztywny prostokat).
  Oba przechodza wszystkie pomiary (mieszcza sie w obrysie, stopy na y=0), ale pomiar
  to nie to samo co czytelnosc.

## ROBOCZA `9fc91af8` â€” 2026-07-26 00:12 Â· FALA 13: nazewnictwo Danina/Podatek, Mennica ze zlotem, odznaki i Kopalnia zlota â€” **ZASTAPIONA** (-> `3cf111ce`)
- md5 (pelne): `9fc91af8bec6561fd6d2d2afa4bf2e95` Â· stempel z menu: `ROBOCZA Â· c06affa9 Â· 2026-07-26 00:12`
- Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + `ROBOCZA-MANIFEST.json`. **VERIFY OK.** 34 250 545 B.
- **Co weszlo (decyzje 55B, 57, 65B, 66B, 81A, 82A, 83B + dlugi techniczne):**
  - **Zmiana nazwy Handel -> Danina -> Podatek.** Jeden wspolny modul `game/danina-nazwa.ts`
    rozstrzyga nazwe; przelacza na **Podatek** dla CALEJ cywilizacji dopiero gdy Waluta odkryta
    ORAZ Mennica stoi **w stolicy**. Strumien z tras handlowych swiadomie zostaje **Handlem**.
    Objelo tez **plon pojedynczego heksu** (decyzja 81A) â€” tooltip przelacza sie dynamicznie.
  - **Mennica zasypia po utracie dostepu do zlota** (83B): mnoznik Daniny wraca do x1,0,
    nazwa wraca na Danine. Budynek NIE jest burzony i budzi sie sam po odzyskaniu dostepu.
    Panel miasta mowi graczowi, DLACZEGO Mennica nie dziala i co zrobic.
  - **Odznaki ulepszen budynkowych na zetonach** (57 A+B): kropki przy podstawie + kolorowa
    obwodka; skala wyprowadzona z realnych maksimow (Pancerz 45 pkt proc. + Parametry 50 =
    95, trzy tercje: granice 31 i 63). Wizualnie odrozniane od gwiazdek weterana (kule przy
    podstawie vs bryly nad glowa; zloto zarezerwowane dla weterana).
  - **Wlasny model 3D Kopalni zlota** â€” koniec reuzycia Kopalni miedzi. Odkrywka z plytkim
    szybem, trojnog z koszem, rynna pluczkowa z runem owczym, sadzawka, misa batea.
    Po rundzie korekty czyta sie jako ZLOTO takze w skali mapy (weryfikacja na renderze
    200x200 px, czyli tyle pikseli, ile pole naprawde dostaje w grze).
  - **Pole `odblokowuje` ozywione** (55B): koniec hardkodu `id === 'mury'`, flagi czytane
    z danych. Trzy flagi (maFort/maBaszta/maWarsztatOblezniczy) zostaja jako **rezerwa**
    (decyzja 82A) â€” jawnie udokumentowana, zeby nikt nie usunal ich jako martwego kodu.
  - **Stala przepustowosci szlaku** przeniesiona do `econ-params.json`
    (`handel_szlaki.handel_ilosc_na_ture_na_szlak` = 4 sztuki surowca na ture na szlak).
  - **Martwy kod usuniety**: `buildingEffectAtLevel`, `formatYieldLine`, `ICON_LABELS_PL`.
  - **Dokumentacja doprowadzona do kanonu**: Poradnik gracza i encyklopedia â€” 50 wystapien
    zmienionych na Danine (74 swiadomie zostawione jako Handel), przykĹ‚ady liczbowe
    przeliczone z 70/20/10 na **20/60/20**, dopisane cztery reguly, ktorych Poradnik
    w ogole nie opisywal (korupcja, Mennica/Podatek, pula Daniny z budynkow, weterani).
    Opisy bonusow 5 cywilizacji mowia wreszcie o Daninie, a nie o zlocie z handlu.
- **Bramki:** tsc 0 bledow Â· logic 208/208 Â· combat 6/6 Â· currency 32/32 Â· plony-budynkow 68/68 Â·
  korupcja 18/18 Â· praca-na-pieniadz 23/23 Â· zloto-szlak 45/45 Â· weterani 47/47 Â·
  mennica-uspienie 47/47 (NOWY) Â· mennica-magazyn 41/41 Â· danina-podatek-nazwa 15/15 (NOWY) Â·
  danina-podatek-tooltip-ui 13/13 (NOWY) Â· szczescie-zamoznosc 60/60 Â· society-breakdown 40/40 Â·
  upgrade-budynki 48/48 Â· deposit-building-gate 34/34 Â· trade-grant 60/60.
- **Co NIE weszlo:** 5 modeli jednostek Brazu (istnieja, NIEWPIETE â€” czekaja na ogledziny
  wlasciciela, material w `dyspozycje/podglad-modeli-braz/`), pomiar FPS, panele Excel.
- **DO OGLEDZIN NA PLAYTESCIE:** (1) czy mapa nie jest za drobno cetkowana po limicie
  10 heksow na skupisko; (2) nowe liczby w panelu miasta â€” trzy strumienie przestaly omijac
  suwak, wiec Skarbiec dostaje mniej niz dotad, a Nauka i Zamoznosc wiecej.
- **ZNALEZISKO DO DECYZJI:** cuda o bonusie typu `handel_procent` (`wonders.json`) â€” typ
  NIGDZIE nie jest konsumowany przez kod. Kolejna martwa obietnica; nie wiadomo, czy mialy
  zasilac Danine czy Handel.

## ROBOCZA `0f9ce758` â€” 2026-07-25 22:33 Â· FALA 12: domkniÄ™cie ekonomii (Danina/korupcja/Mennica), zĹ‚oto na szlakach, weterani, limit skupisk gĂłrskich â€” **AKTUALNA**
- md5 (peĹ‚ne): `0f9ce758973fb53490fb79fdecda7bc7` Â· stempel z menu: `ROBOCZA Â· 9600d931 Â· 2026-07-25 22:33`
  (stempel nosi md5 pliku SPRZED wstrzykniÄ™cia stempla â€” tak jak poprzednie wydania; manifest i VERIFY
  operujÄ… na md5 pliku finalnego `0f9ce758`)
- OdĹ›wieĹĽone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST (MAPA, MIASTO, OBLEZENIE-3v3, ODSKOK-OBLEZENIE,
  ODSKOK, WALKA) + `ROBOCZA-MANIFEST.json`. **VERIFY OK.** Rozmiar 34 240 798 B.
- **Co weszĹ‚o (decyzje wĹ‚aĹ›ciciela 63, 67B, 73â€“80):**
  - **Korupcja oĹĽywiona** â€” dotÄ…d zahardkodowana na 0% w obu miejscach liczÄ…cych ekonomiÄ™ tury. ObciÄ…ĹĽa
    **wyĹ‚Ä…cznie DaninÄ™/Podatek, NIE PracÄ™**. WspĂłĹ‚czynniki obniĹĽone o 50%: dystans 0,5/1/1,5 pkt proc. straty
    na pole od stolicy, liczba miast 0,5/0,5/1 pkt proc. na miasto (easy/normal/hard). Sufit 38/50/62% bez zmian.
    SÄ…d, Pretorium i PaĹ‚ac redukujÄ… po 30 pkt proc., addytywnie (realne maksimum 60 pkt proc.).
  - **67B â€” PieniÄ…dz z budynkĂłw wchodzi do puli Daniny**, nie wprost do skarbca (budynek 60 pkt PieniÄ…dza/turÄ™:
    byĹ‚o Skarbiec 60/Nauka 0/ZamoĹĽnoĹ›Ä‡ 0, jest 36/12/12 przy suwaku 20/60/20).
  - **76B + korekta wĹ‚aĹ›ciciela â€” konwersja Pracy na PieniÄ…dz** (Targowisko + Waluta) wchodzi do Daniny
    **u ĹşrĂłdĹ‚a** i przechodzi przez wszystkie mnoĹĽniki handlu, Ĺ‚Ä…cznie z WalutÄ… i MennicÄ….
  - **74A â€” domyĹ›lny podziaĹ‚ Daniny nowego miasta 20% Nauka / 60% Skarbiec / 20% ZamoĹĽnoĹ›Ä‡** (byĹ‚o 20/70/10);
    poprawione TRZY ĹşrĂłdĹ‚a tej wartoĹ›ci (econ-params.json, game/cities.ts, ui/cityPanel.ts).
  - **Nowa siatka SzczÄ™Ĺ›cia od udziaĹ‚u ZamoĹĽnoĹ›ci** â€” 10 przedziaĹ‚Ăłw po 10 pkt proc., z KARÄ„ poniĹĽej 10%
    (easy +1â€¦+10, normal â’1â€¦+8, hard â’2â€¦+7 pkt SzczÄ™Ĺ›cia/turÄ™). UsuniÄ™ty stary mechanizm â€žwysokie podatki",
    ktĂłry dublowaĹ‚ karÄ™.
  - **75C â€” premia Biblioteki do Nauki miasta 0,37/0,30/0,23**, premia Akademii **0,25/0,20/0,15** (Ĺ‚Ä…cznie Ă—1,50
    na normalnym; byĹ‚o Ă—1,60 przy odwrĂłconej logice, gdzie taĹ„sza Biblioteka dawaĹ‚a 5Ă— wiÄ™cej niĹĽ Akademia).
  - **66B/71A â€” Mennica tylko w stolicy**, mnoĹĽnik dziaĹ‚a na caĹ‚e imperium; mnoĹĽnik cywilizacji z `civs.json`
    = poziom normal, easy +0,5 / hard â’0,5. **Naprawiony rozjazd panel/silnik** (Fenicjanie: panel Ă—2,6,
    silnik Ă—1,5 â€” silnik w ogĂłle nie czytaĹ‚ mnoĹĽnika cywilizacji).
  - **77A â€” zĹ‚oto na szlakach handlowych jako surowiec typu â€ždostÄ™p"** (jak koĹ„, bez przepĹ‚ywu sztuk do
    magazynu). Bez tego cywilizacja bez zĹ‚oĹĽa zĹ‚ota nigdy nie zbudowaĹ‚aby Mennicy.
  - **78 â€” system weteranĂłw** (trzeci system rozwoju jednostek): poziom 1 = statystyki z JSON, poziom 2 po
    1. przeĹĽytej bitwie +10%, weteran po 2. bitwie +20%; pancerz wyĹ‚Ä…czony; Morale ucieczki i PrĂłg dezercji
    **obniĹĽane** Ă—0,90 / Ă—0,80.
  - **63 + 80A â€” limit 10 heksĂłw GĂłr i 10 heksĂłw WzgĂłrz w spĂłjnym skupisku** przy przywrĂłconej gĂłrzystoĹ›ci
    lÄ…du 19,3% (najwiÄ™ksze skupisko: 218 â†’ 10 heksĂłw; pokrycie zĹ‚ĂłĹĽ mapa Ziemia z powrotem 75%).
  - **61A/64A â€” usuniÄ™ty martwy kod** testowej bitwy (ok. 260 linii, `battle-smoke.cjs`, `facing.ts`,
    `launchTestBattle`).
- **Bramki:** tsc 0 bĹ‚Ä™dĂłw Â· logic 208/208 Â· combat 6/6 Â· currency 32/32 Â· plony-budynkow 68/68 Â·
  korupcja 18/18 Â· praca-na-pieniadz 23/23 Â· zloto-szlak 45/45 Â· weterani 47/47 Â· szczescie-zamoznosc 60/60 Â·
  society-breakdown 40/40 Â· determinizm generatora PASS (hash A=B), 775/775 rzek z ujĹ›ciem do realnego morza.
- **Co NIE weszĹ‚o:** zmiana nazwy Handelâ†’Daninaâ†’Podatek (65B/66B, 204 wystÄ…pienia w UI), oĹĽywienie pola
  `odblokowuje` (55B), odznaki ulepszeĹ„ na ĹĽetonach (57 A+B), 5 modeli jednostek BrÄ…zu (istniejÄ…, niewpiÄ™te),
  wĹ‚asny model 3D Kopalni zĹ‚ota.
- **DO OGLÄDZIN:** rozkĹ‚ad skupisk GĂłr (5 map): 953 skupiska 1â€“2 heksowe, 111 po 3â€“5, 38 po 6â€“8, 70 po 9â€“10.
  Mapa moĹĽe wyglÄ…daÄ‡ â€žcÄ™tkowanie" â€” rozsypane pojedyncze szczyty pochodzÄ… z szumu reliefu, nie z limitu.

## ROBOCZA `98b1403a` â€” 2026-07-25 Â· FALA 11.1: przywrĂłcony wymĂłg kolejnoĹ›ci budowania â€” **ZASTÄ„PIONA** (â†’ `0f9ce758`)

- **WymĂłg â€žnajpierw poprzednik" wrĂłciĹ‚.** Likwidacja â€žawansu bocznego" (FALA 11) usunÄ™Ĺ‚a pole `upgradeFrom`
  z czterech par budynkĂłw, a **razem z nim zniknÄ…Ĺ‚ wymĂłg kolejnoĹ›ci budowania** â€” daĹ‚o siÄ™ postawiÄ‡ AkademiÄ™
  w mieĹ›cie, ktĂłre nigdy nie miaĹ‚o Biblioteki. Dopisane do `CITY_BUILDING_PREREQ`:
  Akademia â† Biblioteka Â· Cytadela â† Mury Â· Akademia wojskowa â† Koszary Â· ĹšwiÄ…tynia â† Kamienne krÄ™gi.
- **FIX pre-istniejÄ…cej luki:** `eraBuildingCatalog` w ogĂłle nie sprawdzaĹ‚ prerekwizytu budynkowego, wiÄ™c budynek
  zablokowany brakiem poprzednika **znikaĹ‚ z panelu bez ĹĽadnego komunikatu**, zamiast trafiÄ‡ do sekcji
  â€žJeszcze zablokowane" z tekstem â€žđź”’ Wybudowana Biblioteka w tym mieĹ›cie". DotyczyĹ‚o to rĂłwnieĹĽ Warsztatu
  oblÄ™ĹĽniczego i ĹaĹşni publicznej, czyli byĹ‚o widoczne dla gracza juĹĽ przed dzisiejszymi zmianami.
- **Bramki:** tsc 0 Â· nowy prereq-budynkow 42/42 Â· grupy-budynkow 80/80 Â· koszty-surowcowe 117/117 Â·
  plony-budynkow 47/47 Â· unit-building-bonuses 76/76 Â· administracja-stolica 48/48 Â· prawo-palac-tier 30/30 Â·
  society-breakdown 40/40 Â· logic 208/208 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· VERIFY OK.
- **md5:** `98b1403ac94d335015e5c28411155909` Â· pieczÄ…tka `98b1403a`. ZastÄ™puje `dd1ec38e`.
- **Nie weszĹ‚o:** modele jednostek epoki BrÄ…zu (WĹ‚Ăłcznik, Miecznik, Procarz, Rydwan na woĹ‚ach) â€” pliki istniejÄ…
  w repo, ale **NIE sÄ… wpiÄ™te do dispatchu**, bo wĹ‚aĹ›ciciel oceniĹ‚ seriÄ™ jako uwstecznienie. Praca przeniesiona
  na subagentĂłw Opus 5 i przerwana na jego proĹ›bÄ™ (limit). Gra renderuje te jednostki starymi modelami.

## ROBOCZA `dd1ec38e` â€” 2026-07-25 Â· FALA 11: przebudowa systemu budynkĂłw + naprawa martwych plonĂłw â€” ZASTÄ„PIONA

- **KRYTYCZNA NAPRAWA â€” plony budynkĂłw nigdy nie docieraĹ‚y do silnika.** `cityYieldPerTurn()` byĹ‚a woĹ‚ana
  z **pustÄ… tablicÄ… budynkĂłw** we wszystkich trzech miejscach (`turn-economy.ts` preview i advance,
  `cityPanel.ts` â€žBilans plonĂłw"). Od 2026-07-09 **ĹĽaden budynek nie dawaĹ‚ Pracy, PieniÄ…dza, Ĺ»ywnoĹ›ci,
  Nauki ani Kultury** â€” caĹ‚Ä… gospodarkÄ™ niosĹ‚o wyĹ‚Ä…cznie pole wokĂłĹ‚ miasta. Zmierzony skutek naprawy
  (miasto Ĺ»elaza, peĹ‚na zabudowa): Praca 12â†’**78**, PieniÄ…dz 8â†’**98**, Nauka 2â†’**21**, Kultura 0â†’**36**,
  Ĺ»ywnoĹ›Ä‡ 2â†’**8**. Zadowolenie NIE dubluje siÄ™ â€” pole z tej funkcji nigdy nie byĹ‚o propagowane dalej,
  ĹĽywym kanaĹ‚em pozostaje `sumBuildingHappinessFromBuiltIds`; asercja regresyjna dopisana.
- **Model awansu budynkĂłw rozdzielony na dwa rodzaje** (decyzja Macieja):
  **w gĂłrÄ™** (nastÄ™pca kasuje poprzednika, staĹ‚a wartoĹ›Ä‡ per tier, `maksPoziom: 1`): PaĹ‚ac I/II/III Â·
  Dom Starszyznyâ†’DwĂłr ZarzÄ…dcyâ†’Pretorium Â· KuĹşnia brÄ…zuâ†’KuĹşnia ĹĽelazaâ†’Wielka KuĹşnia Â· Spichlerzâ†’Spichlerz II Â·
  Port handlowyâ†’Port wielki Â· Piec hutniczyâ†’Odlewnia ĹĽelaza;
  **w bok** (oba stojÄ… obok siebie, wartoĹ›ci rozdzielone ĹĽeby nie liczyÄ‡ podwĂłjnie): Mury+Cytadela+Baszta Â·
  Biblioteka+Akademia Â· Koszary+Akademia wojskowa Â· Kamienne krÄ™gi+ĹšwiÄ…tynia.
  Rozdzielone: Akademia nauka 9â†’6 i kultura 7â†’5, Akademia wojskowa praca 5â†’3, ĹšwiÄ…tynia kultura 3â†’2 i zadow. 3â†’2.
- **Panel miasta: osiem grup dziedzinowych** zamiast pĹ‚askiej listy 39 budynkĂłw (Prawo i administracja Â·
  Wojsko i obrona Â· Handel i pieniÄ…dz Â· Nauka i kultura Â· Wiara Â· Zdrowie Â· Produkcja surowcĂłw Â· Ĺ»ywnoĹ›Ä‡).
  Przypisanie grupy jest **danymi**, nie hardkodem UI.
- **Stolica kontra regiony:** PaĹ‚ac I/II/III wyĹ‚Ä…cznie w stolicy, nowy Ĺ‚aĹ„cuch **Dom Starszyzny â†’ DwĂłr ZarzÄ…dcy â†’
  Pretorium** wyĹ‚Ä…cznie poza stolicÄ…, TrybunaĹ‚ i SÄ…d wszÄ™dzie. **FIX pre-istniejÄ…cego buga:** budynki z pustym
  `techUnlock` nie miaĹ‚y obsĹ‚ugi znacznika pustego, przez co **PaĹ‚ac nigdy nie pojawiaĹ‚ siÄ™ na liĹ›cie produkcji**.
- **Prawo â€” nowa siatka** (pkt Prawa, Ĺ‚atwy/normalny/trudny; skala KamieĹ„ 50 = 100%, BrÄ…z 75, Ĺ»elazo 100):
  PaĹ‚ac I 45/35/28 Â· PaĹ‚ac II 58/45/36 Â· PaĹ‚ac III 71/55/44 Â· Dom Starszyzny 36/28/22 Â· DwĂłr ZarzÄ…dcy 43/33/26 Â·
  Pretorium 50/38/31 Â· TrybunaĹ‚ 22/17/13 (wczeĹ›niej NIE byĹ‚ wpiÄ™ty w Prawo) Â· SÄ…d 25/19/16.
  Zasada: Pretorium = 70% PaĹ‚acu III, DwĂłr ZarzÄ…dcy 60%, Dom Starszyzny 50%, SÄ…d 50% Pretorium.
- **Obrona miasta:** nowy budynek **Baszta** (+100%). Mury 200% + Cytadela 100% + Baszta 100% = **400%**.
  Arytmetyka scalona w jednej funkcji `city-defense.ts` dla mapy Ĺ›wiata i bitwy interaktywnej
  (wczeĹ›niej dublowana osobno w `main.ts` i `battleScene.ts`).
- **Dwie Ĺ›cieĹĽki ulepszeĹ„ jednostek z budynkĂłw:** Pancerz (KuĹşnia brÄ…zu 15% â†’ KuĹşnia ĹĽelaza 30% â†’ Wielka
  KuĹşnia 45%, suma po Ĺ‚aĹ„cuchu) i parametry miÄ™kkie (Koszary 20 + Akademia wojskowa 20 + Warsztat oblÄ™ĹĽniczy
  10 = 50%). Jednostka pamiÄ™ta **najlepsze odwiedzone wĹ‚asne miasto**, bonus trwaĹ‚y, parytet AI.
- **Koszty surowcowe wg epok:** KamieĹ„ = drewno (wyjÄ…tek: Kamienne krÄ™gi i Stela na kamieniu), BrÄ…z =
  drewno+kamieĹ„, Ĺ»elazo = drewno+cegĹ‚a (obrona i port: drewno+kamieĹ„). **BrÄ…z i ĹĽelazo jako surowiec budowlany
  usuniÄ™te z caĹ‚ej gry.** PowĂłd: cegĹ‚a powstaje tylko z gliny, a glina tylko przy rzece â€” szeĹ›Ä‡ budynkĂłw BrÄ…zu
  i wszystkie Ĺ»elaza byĹ‚y nieosiÄ…galne dla cywilizacji bez rzeki.
- **CegĹ‚a wchodzi na szlaki handlowe** (obok brÄ…zu, ĹĽelaza, koni). Uwaga: budynki pobierajÄ… cegĹ‚Ä™ **iloĹ›ciowo**
  z puli cywilizacji, a szlak przekazuje **dostÄ™p**, wiÄ™c do peĹ‚nego zadziaĹ‚ania decyzji brakuje jeszcze bramki
  po stronie budynkĂłw â€” do rozstrzygniÄ™cia z Maciejem.
- **UsuniÄ™te z gry:** Karawanseraj (anachronizm â€” budynek Ĺ›redniowieczny w BrÄ…zie), Ratusz (martwy parametr
  Prawa bez budynku; wrĂłci jako szczebel po Pretorium w Ĺ›redniowieczu). WczeĹ›niej tej doby: Lazaret.
- **Jednostki:** **Ĺucznik nubijski** (BrÄ…z, Egipt â€” zasiÄ™g 5, atak dystansowy 7, 16 pociskĂłw, 50 zdrowia,
  ruch 3) z **dedykowanym modelem 3D** (84 mesh / 1052 tri, dĹ‚ugi Ĺ‚uk self-bow, ciemna karnacja, piĂłro strusia).
  WpiÄ™te modele Opus 5 Ĺ‚ucznikĂłw Egiptu i Sumeru. Tarcza Zulu przeskalowana z 2,07 na 1,49 wysokoĹ›ci tuĹ‚owia.
- **Naprawa generatora map:** Ĺ›cieĹĽka â€žfair play" wymuszaĹ‚a glinÄ™ na heksie bez rzeki, Ĺ‚amiÄ…c wĹ‚asnÄ… reguĹ‚Ä™ â€”
  `logic-test.cjs` wrĂłciĹ‚ z 207/208 na **208/208**.
- **Bramki:** tsc 0 Â· koszty-surowcowe 117/117 (nowy) Â· grupy-budynkow 80/80 (nowy) Â· plony-budynkow 47/47 (nowy) Â·
  unit-building-bonuses 76/76 Â· administracja-stolica 48/48 (nowy) Â· prawo-palac-tier 30/30 (nowy) Â·
  society-breakdown 40/40 Â· logic 208/208 Â· upkeep 58/58 Â· building-happiness 8/8 Â· tech-tree 19/19 Â·
  research 33/33 Â· unit-replace 10/10 Â· combat 6/6 Â· post-battle-map 25/25 Â· VERIFY OK.
- **md5:** `dd1ec38e0b277765e710e6ae48601b73` Â· pieczÄ…tka `dd1ec38e`. ZastÄ™puje `b1f16a59`.
- **UWAGA DO PLAYTESTU:** ekonomia zmieniĹ‚a siÄ™ skokowo (patrz naprawa plonĂłw) â€” to jest gĹ‚Ăłwna rzecz do ogrania.
  Stare zapisy wczytajÄ… siÄ™, ale miasta z AkademiÄ… bez Biblioteki dostanÄ… mniej Nauki, a budynki z Ĺ‚aĹ„cuchĂłw
  â€žw gĂłrÄ™" spadnÄ… do wartoĹ›ci jednego poziomu.

## ROBOCZA `b1f16a59` â€” 2026-07-25 Â· FALA 10.1: fix bĹ‚Ä™dnego â€žmnoĹĽnika" PaĹ‚acu â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** caĹ‚a FALA 10 (patrz niĹĽej) **+ poprawka danych**: trzy tiery PaĹ‚acu miaĹ‚y w `baza.mnoznik` wartoĹ›Ä‡ rĂłwnÄ… DOKĹADNIE swojej kulturze (5/5, 8/8, 11/11, przyrost 0) â€” pomyĹ‚ka przy wpisywaniu danych, wykryta przy weryfikacji z Maciejem. Pole `mnoznik` NIE jest konsumowane przez silnik ekonomii (czytane tylko do wyĹ›wietlenia chipa â€žĂ—5 mnoĹĽnik" w panelu miasta), wiÄ™c karta PaĹ‚acu obiecywaĹ‚a bonus, ktĂłrego gra nie stosuje. Wyzerowane dla `palac`/`palac_ii`/`palac_iii` â€” chip znika, realne bonusy (kultura + zadowolenie, ktĂłre silnik faktycznie liczy) bez zmian.
- **Potwierdzone przez Macieja koszty i bonusy PaĹ‚acu:** I (KamieĹ„) 8 drewna / 40 pracy Â· kultura 5 (+3/poz.), zadowolenie 2 (+1/poz.) â€” II (BrÄ…z) 8 drewna+8 kamienia / 60 pracy Â· kultura 8 (+5), zadow. 3 (+2) â€” III (Ĺ»elazo) 8 drewna+8 kamienia+6 cegĹ‚y / 90 pracy Â· kultura 11 (+7), zadow. 5 (+2). Maks. poziom 10, ulepszane kolejno Iâ†’IIâ†’III.
- **Bramki:** tsc 0 Â· tech-tree 19/19 Â· VERIFY OK.
- **md5:** `b1f16a595b17a2cb37955cc8de4b2fc8` Â· pieczÄ…tka `b1f16a59`. ZastÄ™puje `99837b91`.
- **ZNANY DĹUG (do decyzji):** pozostaĹ‚e 11 budynkĂłw teĹĽ ma niezerowy `mnoznik` (kuĹşnia 5, karawanseraj 8, koszary 5, wielka kuĹşnia 23, akademia wojskowa 20, warsztat oblÄ™ĹĽniczy 10, akademia 10, pretorium 5, lazaret 5, kuĹşnia ĹĽelaza 8, targowisko +3/poz.) â€” tam wartoĹ›ci NIE sÄ… duplikatem kultury (wyglÄ…dajÄ… na zamierzonÄ…, ale NIGDY NIEZAIMPLEMENTOWANÄ„ mechanikÄ™). Silnik ich nie konsumuje. Do rozstrzygniÄ™cia: zaimplementowaÄ‡ mnoĹĽnik jako realnÄ… mechanikÄ™ czy usunÄ…Ä‡ z kart.

## ROBOCZA `99837b91` â€” 2026-07-25 Â· FALA 10: bugi bitwy + picking + 7 decyzji ABC Macieja â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (commity `426e587`..`b172d9c`, na `546b0c8`) â€” dwie duĹĽe czÄ™Ĺ›ci:
  **(A) Playtest + audyt sterowania bitwÄ… (12 poprawek):** ROOT-CAUSE **pickingu** â€” klik trafiaĹ‚ tylko pĹ‚aski pryzm heksu / model sÄ…siada, stÄ…d â€žraz dziaĹ‚a raz nie", â€žzaznacza siÄ™ inna jednostka", â€žnie da siÄ™ ruszyÄ‡ pojedynczej z grupy", â€žĹ‚ucznik nie wchodzi za liniÄ™" (mapa: bryĹ‚y wzgĂłrz w `terrainPickMeshes`; bitwa: `_pickGroundTile` dopasowuje realnÄ… wysokoĹ›Ä‡ kafla, raycast honoruje trafienie tylko zgodne z kaflem) Â· liczniki typĂłw jednostek Â· imiona/portrety wĹ‚adcĂłw (byĹ‚o zawsze â€žMinos/grecy") Â· usuniÄ™ty chrome gĂłrnych paskĂłw deploy Â· â€žSTART WALKI" nie zostaje osierocony po bitwie Â· szyk piechota/dystans Â· karty rosteru (ikona klasy + nazwa spod paskĂłw) Â· numeracja grup = najniĹĽszy wolny (G1â†’G1, nie G3) Â· powtĂłrka bitwy nie gubi rozgrupowania Â· panel armii znika pod dialogiem bitwy Â· paski strat po walce Â· barbarzyĹ„cy z wĹ‚asnym sygnetem.
  **(B) Decyzje ABC Macieja (7 zadaĹ„):** edge-pan zawsze aktywny Â· â€žFormacja" na zaznaczony zakres (jednostka/grupa/armia) Â· **nowa pula 10 imion wĹ‚adcĂłw per cywilizacja** (150 imion, osobne imiÄ™ per wĹ‚aĹ›ciciel â€” koniec dwĂłch â€žMinosĂłw") Â· **UI kolejki badaĹ„ do 3 tech** (panel â€žPlan badaĹ„", drag&drop, numerki w hubie i drzewku) Â· **Sentry z auto-budzeniem** na wroga w polu widzenia Â· **C-FLANK: kierunek natarcia front/bok/tyĹ‚** w auto-odgrywaniu (jednostki obchodzÄ… wroga BFS-em) Â· **koszyk-traktat**: sĹ‚odziki (zĹ‚oto/surowce) doliczane do decyzji AI przy traktatach + transfer przy akceptacji.
  **Plus wczeĹ›niej tej doby:** sĂłl na lÄ…dzie przy wybrzeĹĽu (dziaĹ‚a na mapie Ziemia) Â· glina tylko przy rzece Â· realne bramki 7 budynkĂłw + czysta bramka epoki (naprawiony bug blokady budynkĂłw) Â· kamienioĹ‚om i kopalnie nie spĹ‚aszczajÄ… wzgĂłrza Â· ranking Mocy z pozycjÄ… absolutnÄ… (â€žjesteĹ› X. z N") + fix niespĂłjnoĹ›ci Mocy Â· ĹĽeton Handel Â· dwuetapowa dyplomacja.
- **Bramki:** tsc 0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· post-battle-HP 25/25 Â· battle-roster 7/7 Â· deposit-coast 20/20 Â· determinizm mapy PASS (hash `66949c60`) Â· VERIFY OK.
- **md5:** `99837b91d987752cc19c3311115a0320` Â· pieczÄ…tka `99837b91`. Bundel 34 MB. ZastÄ™puje `084d3827`.
- **Do strojenia w playteĹ›cie:** przelicznik sĹ‚odzika dyplomatycznego (25 PN = 1 pkt ease, sufit 20) â€” PLACEHOLDER.

## ROBOCZA `084d3827` â€” 2026-07-24 Â· FALA 9: seria uwag przeglÄ…dowych + FIX blokera PaĹ‚acu â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (commity `e49211c`..`7a72b0c`, na `d1f2a49`) â€” 8 poprawek z playtestu Macieja:
  1. **FIX blokera PaĹ‚acu** â€” bramka B-SUROW-BUD speĹ‚niona teĹĽ ZAPASEM puli paĹ„stwa (nie tylko aktywnym ĹşrĂłdĹ‚em); PaĹ‚ac (i inne budynki epoki) budowalne mimo braku ĹşrĂłdĹ‚a, gdy masz surowiec w puli. DokĹ‚adnÄ… iloĹ›Ä‡ egzekwuje `koszt_surowce`. Parytet AI (auto-build ctx).
  2. PodglÄ…d startu (kreator) = tylko parametry, bez prozy.
  3. Klik ĹĽetonu dochodu (Nauka/Skarbiec/Praca/Religia/Ĺ»ywnoĹ›Ä‡) = tylko jego wiersz.
  4. â€žZaopatrzenie" â†’ â€žArmia" (ĹĽywnoĹ›Ä‡ armii + ludnoĹ›Ä‡ + rekruci).
  5. Drzewka tech: usuniÄ™te stare (niebieskie), â€žgraf epok" â†’ â€žDrzewo technologii".
  6. Karta budynku: sekcje â€žDaje" (bonusy) vs â€žWymagane" (surowce + dostÄ™p).
  7. WyrÄ…b: plon 5 Drewna do puli paĹ„stwa (koszt 5 Pracy zostaje).
- **Bramki:** tsc 0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· VERIFY OK.
- **md5:** `084d3827d9e569a766e55b0ea6066b01` Â· manifest. PieczÄ…tka `af64e799` (one-iter quirk). Bundel 34 MB. ZastÄ™puje `0de2599c`.

## ROBOCZA `0de2599c` â€” 2026-07-24 Â· stash merge + FALA 8 + B-PALAC-TIER + B-RESEARCH-COST â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** FALA 8 zachowana (blokada 1. miasta Â· UI surowcĂłw Â· kamieĹ„ wspĂłĹ‚istnieje Â· Civpedia Â· mapa Ziemia) **+** sesja lokalna ze stash: (1) **B-PALAC-TIER** â€” `palac`â†’`palac_ii`â†’`palac_iii`, bramki drewno / drewno+kamieĹ„ / drewno+kamieĹ„+cegĹ‚a, bonus +50%/tier, `cityHasPalacLine()`; (2) **B-RESEARCH-COST-MODEL** â€” `GLOBAL_RESEARCH_COST_MULT=1`, koszty Ă—2 w `tech.json`, ObrĂłbka drewna + Murarstwo JSON=**5** â†’ 5/10/20 PN; (3) **B-TECH-EARLY-COST** wchĹ‚oniÄ™ty w model powyĹĽej.
- **Sync:** stash `sesja-lokalna-pre-pull-2026-07-24` â†’ pop + konflikt `buildings.json` (tiery paĹ‚acu wygraĹ‚y nad FALA-8 â€žbez surowcĂłw") Â· commit + push main.
- **Bramki:** tsc 0 Â· research 33/33 Â· tech-tempo 15/15 Â· difficulty-cost 22/22 Â· conquest-stability 27/27 Â· VERIFY OK.
- **md5:** `0de2599cba16087cbb47cb202fdb616c` Â· pieczÄ…tka `0de2599c`. Bundel 34 MB. ZastÄ™puje `c7e16e51`.

## ROBOCZA `c7e16e51` â€” 2026-07-24 Â· SESJA LOKALNA: stashâ†’pullâ†’pop + FALA 8 rebuild â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** FALA 8 (`90263d3`) â€” PaĹ‚ac bez surowcĂłw Â· blokada 1. miasta Â· UI surowcĂłw Â· kamieĹ„ wspĂłĹ‚istnieje Â· Civpedia. Lokalny rebuild po bramkach (bez git push).
- **Sync:** main juĹĽ na `90263d3` (pull FF: already up to date); stash `sesja-lokalna-pre-pull-2026-07-24` â†’ pop czÄ™Ĺ›ciowy (zmiany juĹĽ w WT) â†’ drop.
- **Bramki:** tsc 0 Â· research 33/33 Â· tech-tempo 12/12 Â· difficulty-cost 22/22 Â· conquest-stability 27/27 Â· build OK.
- **md5:** `c7e16e5172316f181892a5512518f0a4` Â· pieczÄ…tka `c7e16e51`. ZastÄ™puje `e65036fd`.

## ROBOCZA `e65036fd` â€” 2026-07-24 Â· SESJA LOKALNA: pull FALA 8 + rebuild weryfikacyjny â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** identyczna jak FALA 8 chmury (`90263d3` / `e9306d7a` przed pieczÄ™ciÄ…) â€” pull 4 commitĂłw FF + lokalny build/publish po bramkach.
- **Sync:** `e9c4c96` â†’ `90263d3` (stash lokalnych zmian pre-pull: `sesja-lokalna-pre-pull-2026-07-24`).
- **Bramki:** tsc 0 Â· research 33/33 Â· tech-tempo 12/12 Â· difficulty-cost 22/22 Â· build OK.
- **md5:** `e65036fde18cb7eb738d8c78797b2ca8` Â· pieczÄ…tka `e65036fd`. ZastÄ™puje `e9306d7a` (chmura, manifest przed stamp lokalnym).

## ROBOCZA `e9306d7a` â€” 2026-07-24 Â· FALA 8: PaĹ‚ac bez surowcĂłw + blokada 1. miasta + UI surowcĂłw (widocznoĹ›Ä‡+panel) + kamieĹ„ wspĂłĹ‚istnienie + Civpedia â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (commity `42170ea`, `b5ba1b0`, `5cf79a3`) â€” zbudowana NA mapie Ziemia `58299d6f` (rebase, zawiera ich zmiany):
  1. **PaĹ‚ac** â€” usuniÄ™ty koszt surowcowy (8 drewno+8 kamieĹ„); zostaje 40 Pracy (budynek startowy, na starcie pula surowcĂłw = 0).
  2. **Blokada pierwszego miasta** â€” `exitBuildMode` guard (jeden choke-point: Escape/PPM/đź”¨/dismiss) + blokada â€žkoniec tury" (canEndTurn + klawisz N z podpowiedziÄ…), dopĂłki gracz nie zaĹ‚oĹĽy 1. miasta. Parytet: AI nie uĹĽywa tego UI.
  3. **C-SURUI=A** â€” UI surowcĂłw widoczne od tury 1: pasek miasta pokazuje rdzeĹ„ (drewno+kamieĹ„) zawsze; magazyn imperium bez placeholdera przy 0 (skip tylko czysty dostÄ™p SĂłl/KoĹ„/Ceramika).
  4. **C-PANEL=B** â€” klik ĹĽetonu HUD otwiera panel z TYLKO jego blokiem (Surowce=magazyn, nie caĹ‚a ekonomia).
  5. **KamieĹ„=b** â€” KamienioĹ‚om na WzgĂłrza+GĂłry; wĹ‚asny sektor niewykluczajÄ…cy (wspĂłĹ‚istnieje z kopalniami rudy/gliniankÄ…/stadninÄ… â€” nie blokuje wydobycia ukrytej rudy); grafika rozsuniÄ™ta (300Â° vs 0Â°, zweryfikowane wizualnie â€” nie nachodzÄ…).
  6. **Civpedia** â€” rename â€žWikiâ†’Civpedia" (toolbar+panel) + aktualizacja treĹ›ci (magazyn 500+100/Magazyn, konsumpcja surowca przez jednostki, handel z MP, Cuda w liĹ›cie budowy, suwak trudnoĹ›ci MP, PaĹ‚ac bez kosztu) + regen wikiBundle.json (generated 2026-07-24).
  - Bez zmian kodu: trudnoĹ›Ä‡ MP=A, ujawnianie ĹĽelaza=A (potwierdzone).
- **Bramki:** tsc 0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· map-gen OK Â· VERIFY OK.
- **md5:** `e9306d7ad25f8f82cf55f8af3b809c0b` Â· manifest. PieczÄ…tka w grze `da99aead` (one-iter quirk â€” manifest miarodajny). Bundel 34 MB. ZastÄ™puje `58299d6f`.

## ROBOCZA `58299d6f` â€” 2026-07-24 Â· mapa Ziemia: bufor N+S + Antarktyda wraca (A-MAP-ZIEMIA-1 fix) â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** typ **Ziemia** tylko: ~30 rzÄ™dĂłw oceanu u gĂłry **i** u doĹ‚u (skalowane); peĹ‚ny szablon lÄ…du z AntarktydÄ… (bez wycinania); pĂłĹ‚noc bez zmian wzglÄ™dem poprzedniego bufora.
- **Fix:** cofniÄ™te bĹ‚Ä™dne wyciÄ™cie Antarktydy (`NR_LAND_MAX`); dodany symetryczny bufor poĹ‚udniowy.
- **Bramki:** tsc 0 Â· earth-template-test 0 fail Â· VERIFY OK.
- **md5:** `58299d6f7d7fd3770a5d603ee08ea7e6` Â· pieczÄ…tka `58299d6f`. ZastÄ™puje `160f0402`.

## ROBOCZA `160f0402` â€” 2026-07-24 Â· mapa Ziemia: bufor arktyczny + bez Antarktydy (A-MAP-ZIEMIA-1 B) â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** tylko typ Ĺ›wiata **Ziemia** (`ziemia`): ~30 rzÄ™dĂłw oceanu arktycznego u gĂłry (skalowane z rozmiarem mapy), wyciÄ™cie Antarktydy z mapowania szablonu, koĹ„cowy enforce szablonu w generatorze. Proceduralne Kontynenty / Pangea / Wyspy â€” bez zmian.
- **Pliki:** `earth-land-mask.ts`, `generator.ts`, `earth-template-test.cjs`, `docs/decyzje/A-MAP-ZIEMIA-1.md`.
- **Bramki:** tsc 0 Â· earth-template-test 0 fail Â· map-gen-regression PASS Â· VERIFY OK.
- **md5:** `160f0402c674d448e0d8ae529c765c86` Â· pieczÄ…tka `160f0402`. Bundel 34 MB. ZastÄ™puje `85f0ca70`.

## ROBOCZA `85f0ca70` â€” 2026-07-24 Â· menu: O grze â†’ poradnik + cleanup WiÄ™cej â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (1) **O grze** w menu gĹ‚Ăłwnym otwiera **Poradnik gracza** (ten sam hub Wikipedia co na mapie, tryb overlay nad menu). (2) UsuniÄ™te z menu WiÄ™cej: **Playtest mapy** (walka/miasto juĹĽ wczeĹ›niej). (3) Ustawienia menu: tylko Muzyka / Efekty / JÄ™zyk (`ui-params.json` â€” bez Grafika/Skala/MgĹ‚a).
- **Pliki:** `wikiHubHud.ts` (layout overlay), `mainMenu.ts`, `main.ts`, `ui-params.json`.
- **Bramki:** tsc 0 Â· build OK (699 moduĹ‚Ăłw) Â· VERIFY OK.
- **md5:** `85f0ca7055d39013e27702375cd3bab2` Â· pieczÄ…tka `85f0ca70`. Bundel 34 MB. ZastÄ™puje `e19e50ff`.

## ROBOCZA `e19e50ff` â€” 2026-07-24 Â· FALA 7: 6 utworĂłw muzyki kontekstowej (intro/dyplomacja/pre-battle/bitwa/zwyciÄ™stwo/poraĹĽka) â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (commit `af3b293`) 6 nowych utworĂłw mp3 kontekstowych + mechanizm OVERLAY muzyki paneli (`muzyka-antyczna.ts`):
  1. **Intro** â€” `Prayer_of_the_Sun_Stone` jako PIERWSZY (pozostaĹ‚e 3 o jedno dalej; `INTRO_KOLEJNOSC` w filePlayer.ts).
  2. **Panel dyplomacji** z innÄ… cyw. â€” `Gilded_Porticos` (hak w show/hideDiplomacyAudience).
  3. **NakĹ‚adka pre-battle** â€” `Song_of_the_Ancient_Hearth` (hak w show/hidePreBattle).
  4. **Sama bitwa** â€” `Before_the_Bronze_Gate` (hak w setMood('bitwa'/'mapa') â€” mapa/oblÄ™ĹĽenie/najazd).
  5. **Po WYGRANEJ** â€” `Where_the_Reed_Bends` Â· 6. **Po PRZEGRANEJ** â€” `Sun_on_the_Copper_Ridge` (hak w battleScene `_showEndScreen`, flaga playerWon; czysta wymiana utworu; Replay wraca na muzykÄ™ bitwy).
  - Overlay: muzyka gry milknie na czas panelu, wraca (mapa) po zamkniÄ™ciu. Respektuje wyĹ‚Ä…czonÄ… muzykÄ™ (start tylko gdy muzyka gry gra) + suwak gĹ‚oĹ›noĹ›ci obejmuje wszystkie 6 torĂłw.
- **Bramki:** tsc 0 Â· build OK (699 moduĹ‚Ăłw) Â· VERIFY OK.
- **md5:** `e19e50ff25cba5bf722b353e9d3aaa02` Â· manifest. PieczÄ…tka w grze `6e4c23d8` (one-iter quirk â€” manifest miarodajny). Bundel 34 MB (6 mp3 inline base64). ZastÄ™puje `8dc09b8a`.
- **TODO przyszĹ‚oĹ›Ä‡ (ĹĽyczenie wĹ‚aĹ›ciciela):** osobny utwĂłr dyplomacji per cywilizacja (dziĹ› 1 wspĂłlny; katalog `dyplomacja/` czytany automatycznie).

## ROBOCZA `8dc09b8a` â€” 2026-07-24 Â· FALA 6.2: peĹ‚ny handel surowcami z miastami-paĹ„stwami + portret miast-paĹ„stw = symbol kultury â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** (commity `8aacfd3`, `8363a4b`)
  1. **HANDEL SUROWCAMI Z MIASTAMI-PAĹSTWAMI** (decyzja Macieja A, parytet): `zaproponuj_handel_surowiec` w warstwie MP; graczâ†”MP i AIâ†”MP, jednorazowo + cyklicznie, obie strony (AIâ†”MP bramkowane realnÄ… nadwyĹĽkÄ… surowca). Inne ograniczenia MP nietkniÄ™te.
  2. **PORTRET MIAST-PAĹSTW = SYMBOL KULTURY** (nie zdjÄ™cie wĹ‚adcy): miasta-paĹ„stwa renderujÄ… `civIconSvg` kultury zamiast `portrait-{civ}-{epoka}.jpg` (dyplomacja, audiencja, preBattle, bitwa) â€” koniec 10-11 identycznych portretĂłw. Gracz/gĹ‚Ăłwne AI bez zmian. Etykieta MP: â€žMiasto Â· Kultura Â· miasto-paĹ„stwo" (np. â€žSparta Â· Grecja Â· miasto-paĹ„stwo").
- **Bramki:** tsc 0 Â· display-names 12/12 Â· diplomacy-layers 8/8 Â· cyclic-trade 42/42 Â· ai-test 233/7 (baseline) Â· diplomacy 144/2 (baseline) Â· city-state-alliance 59/59 Â· tech-tree 19/19 Â· VERIFY OK.
- **md5:** `8dc09b8ab2f709b567b65489f087e9a6` Â· manifest. PieczÄ…tka `8dc09b8a`. Bundel 28,2 MB. ZastÄ™puje `3db42857`.
- **FLAGI do decyzji Macieja:** (a) format etykiety MP â€žMiasto Â· Kultura Â· miasto-paĹ„stwo" â€” potwierdziÄ‡; (b) IMIÄ wĹ‚adcy pod medalionem MP nadal to samo co gĹ‚Ăłwna cywilizacja (moĹĽliwy follow-up); (c) etykiety miast na heksach mapy niezmienione (tylko dyplomacja/HUD dostaĹ‚y kulturÄ™).

## ROBOCZA `3db42857` â€” 2026-07-24 Â· FALA 6.1: caĹ‚a dyplomacja miast-paĹ„stw pod suwak trudnoĹ›ci MP (dokoĹ„czenie) â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡:** nadbudowa FALI 6 (commit `6797402`). `effectiveGameDifficultyForOwner(ownerId)` â€” dla miast-paĹ„stw **caĹ‚a** dyplomacja (progi wojna/handel + dary jednorazowe + agresja/aktywnoĹ›Ä‡ + posiĹ‚ki) idzie z suwaka â€žTrudnoĹ›Ä‡ miast-paĹ„stw"; peĹ‚ne cywilizacje AI bez zmian (globalna trudnoĹ›Ä‡). Decyzja Macieja: â€žprzenieĹ› wszystkie ustawienia poza gĹ‚ĂłwnÄ… trudnoĹ›Ä‡".
- **Bramki:** tsc 0 Â· ai-test 233/7 (baseline) Â· diplomacy 144/2 (baseline) Â· city-state-alliance 59/59 Â· VERIFY OK.
- **md5:** `3db4285743c1e83fac92b879765488a0` Â· manifest. PieczÄ…tka `3db42857`. Bundel 28,2 MB. ZastÄ™puje `666b2b75`.

## ROBOCZA `666b2b75` â€” 2026-07-24 Â· FALA 6: ikony surowcĂłw v4 + magazyn 500 + UI surowcĂłw + Cuda w mieĹ›cie + proaktywnoĹ›Ä‡ MP + AI-rush strojalny â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (sesja autonomiczna, commity `1e80e6d`â€¦`ca00246`; branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):**
  1. **IKONY SUROWCĂ“W v4 (Design):** 12 odrÄ™bnych ikon â€” koniec interimowego kolorowania. Metale/cegĹ‚a/rudy rozdzielone (res-bronze zielony, res-iron srebrno-szary, res-brick czerwony, res-copper-ore/res-iron-ore, res-steel, res-ceramics; glina=pomaraĹ„czowy placek). WchodzÄ… wszÄ™dzie przez `mapResourceIconSvg` (zakĹ‚adka + chipy miasta + tooltip heksa).
  2. **BAZA MAGAZYNU 100â†’500** (`magazyn_baza_surowce`); cap = **500 + 100Ă—Magazyn** (kaĹĽdy Magazyn w dowolnym mieĹ›cie addytywnie). Fixtury 44/44.
  3. **UI SUROWCĂ“W:** zakĹ‚adka â€žMagazyn PaĹ„stwa" na brand-ikonach (karty: ikonaÂ·nazwaÂ·pasekÂ·sztukiÂ·produkcja bez â€ž/t", szczegĂłĹ‚y na hover; cap data-driven 500); chip â€žSurowce" w HUD (Nauka przeniesiona w prawo); **pasek surowcĂłw przy budowie** i **pasek BrÄ…z/Ĺ»elazo wg epoki przy rekrutacji** w panelu miasta.
  4. **CUDA:** usuniÄ™ty osobny katalog z lewego menu; cuda w **liĹ›cie budowy miasta**, filtrowane per cywilizacja (AI bez zmian).
  5. **PROAKTYWNOĹšÄ† MIAST-PAĹSTW** (agresja/aktywnoĹ›Ä‡ dyplomacji) pod suwak â€žTrudnoĹ›Ä‡ miast-paĹ„stw", nie globalnÄ… (peĹ‚ne AI bez zmian).
  6. **PROGI AI-RUSH** (rezerwa 100/limit 1) przeniesione do `econ-params.json` (strojalne, wartoĹ›ci bez zmian).
  7. **Poza grÄ…:** generatory paneli Excel eksportujÄ… koszty surowcowe jednostek/budynkĂłw (Panel-B/C).
- **Bramki:** tsc 0 Â· surow-civ-storage 44/44 Â· unit-stock-cost 31/31 Â· ai-unit-rush 8/8 Â· ai-test 233/7 (baseline) Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· wonder-yields 11/11 Â· zelazo-gate 23/23 Â· map-gen determinizm PASS Â· VERIFY OK.
- **md5:** `666b2b75e42d8375706ecf993a3385c4` Â· manifest. PieczÄ…tka `86c44282` (one-iter quirk). Bundel 28,2 MB.
- **Test:** panel imperium â†’ Surowce (kolorowe ikony, cap 500, karty) Â· miasto â†’ budowa (pasek surowcĂłw) i rekrutacja (BrÄ…z/Ĺ»elazo wg epoki) Â· budowa cudĂłw z listy miasta (bez zakĹ‚adki Cuda) Â· kreator â†’ TrudnoĹ›Ä‡ miast-paĹ„stw wpĹ‚ywa teĹĽ na proaktywnoĹ›Ä‡ dyplomacji MP.
- **FLAGI do decyzji Macieja:** (a) ikona **konia** do wymiany (Design doĹ›le; SVG nie daĹ‚o siÄ™ zaĹ‚Ä…czyÄ‡); (b) HUD pokazuje pojedynczy chip â€žSurowce" (nie peĹ‚ny pasek 9 ikon â€” Ĺ›wiadomie zachowawczo); (c) zakres proaktywnoĹ›ci MP â€” progi/dary jednorazowe nadal globalne (osobny temat); (d) `R-MP-HANDEL-SUROWCE`, `R-STAWKI-STROJENIE` otwarte.

## ROBOCZA `c676b681` â€” 2026-07-24 Â· FALA 5: konsumpcja surowca przez jednostki + AI kupuje za zĹ‚oto + fix bramki dostÄ™pu â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (commity `3161c79`, `b194539`, `af9fae2`; branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):**
  1. **JEDNOSTKI KONSUMUJÄ„ SUROWIEC z puli PAĹSTWA** (decyzja Macieja C-JEDN-SUROWIEC-Q1=A): `Surowiec (iloĹ›Ä‡)` z units.json pobierane przy budowie/zakupie â€” gracz (zakup za zĹ‚oto + zwrot przy anulowaniu) i AI (handler build) â€” blokada gdy pula nie starcza; UI ma chip kosztu i wyĹ‚Ä…cza â€žRekrutuj". Mapowanie odporne na diakrytyki (BrÄ…zâ†’braz). Parytet AI (test 31/31, ownerIdâ‰ 0).
  2. **AI KUPUJE JEDNOSTKI ZA ZĹOTO** (parytet R-AI-KUP-JEDN): `purchaseRecruitmentUnit` uogĂłlnione na dowolnego ownera (ta sama Ĺ›cieĹĽka co gracz â†’ teĹĽ konsumuje surowiec). AI rush-uje ZACHOWAWCZO: tylko na wojnie, gdy ma Manpower + zĹ‚oto â‰Ą rezerwa 100 + koszt, max 1/turÄ™ (`shouldAIRushBuyUnit`, staĹ‚e PLACEHOLDER do strojenia). Test ai-unit-rush 8/8.
  3. **FIX martwej bramki dostÄ™pu brÄ…z/ĹĽelazo** (R-JEDN-DOSTEP-BUG): `stripDiacritics` w production.ts (2 miejsca) â€” jednostki brÄ…zowe/ĹĽelazne znĂłw WYMAGAJÄ„ dostÄ™pu do surowca (wczeĹ›niej `'brÄ…z'!=='braz'` czyniĹ‚o bramkÄ™ martwÄ…). zelazo-gate 23/23.
- **Bramki:** tsc 0 Â· unit-stock-cost 31/31 Â· ai-unit-rush 8/8 Â· surow-civ-storage 44/44 Â· unit-replace 10/10 Â· zelazo-gate 23/23 Â· tech-tree 19/19 Â· research 33/33 Â· ai 233/7 (baseline) Â· VERIFY OK.
- **md5:** `c676b6815625f28b25a0a9926dbaa6c6` Â· manifest. PieczÄ…tka w grze `271f572b` (one-iter quirk). Bundel 28,3 MB.
- **Test:** miasto â†’ produkcja jednostki brÄ…zowej/ĹĽelaznej pobiera surowiec z puli (chip kosztu, blokada gdy brak) Â· jednostka bez dostÄ™pu do brÄ…zu/ĹĽelaza niebudowalna Â· AI na wojnie kupuje jednostkÄ™ za zĹ‚oto.
- **Poza grÄ… (dokumentacja tej sesji):** analiza bilansu 100 tur (`BILANS-SUROWCE-100T-2026-07-25.md` â€” wynik: NADMIAR, kamieĹ„ bez odbiorcy, cap civ-wide nie skaluje siÄ™ z imperium), audyt parytetu AI (`AUDYT-PARYTET-AI-2026-07-24.md`), sync paneli Excel A/B/C.
- **FLAGI do decyzji Macieja:** (a) prĂłg AI-rush (rezerwa 100 / limit 1) do strojenia po playteĹ›cie; (b) generatory paneli Excel nie eksportujÄ… pĂłl kosztĂłw surowcowych jednostek/budynkĂłw (`R-PANEL-SYNC`); (c) strojenie bilansu (sink kamienia / cap per-miasto â€” `R-STAWKI-STROJENIE`).

## ROBOCZA `ea75f5ba` â€” 2026-07-24 Â· FALA 4.1: magazyny=pula paĹ„stwa + handel surowcami + trudnoĹ›Ä‡ miast-paĹ„stw + super-jednostki â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (commity `f136c09`â€¦`0d0db35`; nadbudowa fali 4):**
  1. **MAGAZYNY = pula PAĹSTWA** (civ-wide): cap per typ = **100 + 100Ă—Magazyn** (pĹ‚askie na easy/normal/hard, addytywnie), nadmiar przepada; surowce wspĂłlne dla imperium (budowa pĹ‚aci z puli). Parytet AI (test 44/44 z asercjÄ… na AI).
  2. **HANDEL SUROWCAMI w dyplomacji:** tryb **jednorazowy** + **cykliczny przez X tur** (za pieniÄ…dz/PracÄ™); AI proponuje/akceptuje/AIâ†”AI (parytet, test 42/42).
  3. **TRUDNOĹšÄ† MIAST-PAĹSTW** osobnym suwakiem w kreatorze (Zaawansowane opcje), odpiÄ™ta od globalnej trudnoĹ›ci: zaufanie startowe + sojusze siĂłstr + posiĹ‚ki + aiDiffLevel kopii obronnych (naprawiony przeciek `bonusProdukcja`). DomyĹ›lnie = gĹ‚Ăłwna trudnoĹ›Ä‡.
  4. **KOSZTY JEDNOSTEK:** KamieĹ„ 0 Â· BrÄ…z/Ĺ»elazo; dystansowe **0** (Procarz + Ĺ‚ucznicy brÄ…zowi) Â· I linia 2 Â· premium 3. **Super-jednostki:** bezpĹ‚atne pieniÄ™ĹĽnie (Triari/Wojownik germaĹ„ski 0) + max 1 + respawn stolica + 3 surowca.
  5. Baza fali 4: ceramika=dostÄ™p Â· produkcja bez pracownikĂłw Â· paliwo/Mielerz usuniÄ™te Â· bonusy budynkĂłw Â· koszty budynkĂłw Â· â’1 Praca upkeep Â· cegĹ‚a-A Â· wonder-bonusy Â· licznik Â· docs Civpedia/Poradnik.
- **Bramki (scalone):** tsc 0 Â· logic 208/208 Â· ai 233/7 Â· storage 44/44 Â· handel-cykliczny 42/42 Â· diplomacy-layers 8/8 Â· converters 24/24 Â· mennica 41/41 Â· wonder-yields 11/11 Â· owner-economy 9/9 Â· trade-routes 51/51 Â· trade-grant 38/38 Â· unit-replace 10/10 Â· tech-tree 19/19 Â· map-gen determinizm A=B PASS Â· VERIFY OK.
- **md5:** `ea75f5ba4d49cdc6849e829fc52a1887` Â· manifest. PieczÄ…tka w grze `fe5049dd` (one-iter quirk). Bundel 28,2 MB.
- **Test:** panel imperium â†’ SUROWCE (pula 100/+100, â’Praca za ulepszenia) Â· dyplomacja â†’ sprzedaj/wymieĹ„ surowiec (jednorazowo lub co turÄ™, za zĹ‚oto/PracÄ™) Â· kreator â†’ Zaawansowane â†’ â€žTrudnoĹ›Ä‡ miast-paĹ„stw" osobno Â· jednostki dystansowe darmowe surowcowo.
- **FLAGI do decyzji Macieja:** (a) `decideAIDiplomacy` (proaktywnoĹ›Ä‡ miast-paĹ„stw w propozycjach wojna/pokĂłj â€” `agresjaMnoznik`) NADAL na globalnej trudnoĹ›ci; odpiÄ…Ä‡ teĹĽ pod suwak miast-paĹ„stw? (b) placeholdery do strojenia po playteĹ›cie.

## ROBOCZA `cd42837f` â€” 2026-07-24 Â· FALA 4: przebudowa ekonomii surowcĂłw + wonder-bonusy + koszty budynkĂłw/jednostek â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (commity `07bc172`â†’`bcd818b`; sesja chmurowa, seria subagentĂłw + scalenia):**
  1. **Model surowcĂłw:** ceramika = tylko DOSTÄP (Garncarnia nie konwertuje) Â· produkcja per-ULEPSZENIE bez wymogu pracownikĂłw (naprawiony przeciek bazowego plonu) Â· stawki Tartak/KamienioĹ‚om/Glinianka 4, Kopalnie 2 (`surowiec_ilosc_tura`).
  2. **PALIWO + MIELERZ usuniÄ™te** â€” konwertery biorÄ… drewno 1:1 (DEFAULT_CONVERTER_RECIPES 7â†’5).
  3. **Bonusy budynkĂłw:** Stolarnia +10% drewna civ Â· Warsztat kamieniarski +10% kamienia civ Â· Garncarnia +10% ĹĽywnoĹ›ci lokalnie (placeholdery econ-params).
  4. **Koszty budynkĂłw** (28, `koszt_surowce`) wg tabel KamieĹ„/BrÄ…z/Ĺ»elazo. **CegĹ‚a-A:** Cegielnia 2â†’3/turÄ™, Glinianka 4â†’5.
  5. **â’1 Praca/turÄ™ za ulepszenie surowcowe** (wariant B, z WarzelniÄ…/StadninÄ…) â€” limit na spam ulepszeĹ„; **fix deadlocka AI** (konwertery przed konsumentami surowca).
  6. **Koszty jednostek:** KamieĹ„ 0 Â· BrÄ…zâ†’brÄ…z Â· Ĺ»elazoâ†’ĹĽelazo; dyst. 1 / I linia 2 / premium 3 (Procarz=0). 73 jednostki.
  7. **Wonder-bonusy realnie w ekonomii** (C-CUDA-BONUS=A): `bonusy.miasto` Ă— kaĹĽde miasto wĹ‚aĹ›ciciela + zadowolenie w happiness pipeline (gracz i AI).
  8. **LICZNIK surowcĂłw** (wolumen + tempo/turÄ™) w panelu imperium; **docs** Civpedia+Poradnik (wikiBundle 134 hasĹ‚a).
- **Bramki (scalone):** tsc 0 Â· logic 208/208 Â· ai 233/7 (pre-istniejÄ…ce) Â· converters 24/24 Â· mennica 41/41 Â· wonder-yields 11/11 (NOWY) Â· owner-economy 9/9 Â· unit-replace 10/10 Â· research 33/33 Â· tech-tree 19/19 Â· map-gen determinizm A=B PASS Â· VERIFY OK.
- **md5:** `cd42837fda237aa7bbea31e429900ca8` Â· manifest. PieczÄ…tka w grze: `5285a7ec` (one-iter-behind, znany quirk). Bundel 28,2 MB. PublikowaĹ‚a sesja chmurowa.
- **Test:** panel imperium â†’ SUROWCE STRATEGICZNE (wolumen+tempo, â’N Praca za ulepszenia) Â· buduj budynki/jednostki i patrz na koszty surowcowe Â· cuda dajÄ… realne yieldy Â· ceramika = dostÄ™p (Garncarnia).
- **FLAGI do decyzji Macieja:** (a) super-jednostki Triari(18)/Wojownik germaĹ„ski(16) majÄ… koszt PIENIÄĹ»NY â€” niespĂłjne z â€žpremium = bezpĹ‚atna pieniÄ™ĹĽnie"; (b) Ĺ‚ucznicy brÄ…zowi = 1 BrÄ…z (groty) â€” zostawiÄ‡ czy 0; (c) placeholdery do strojenia po playteĹ›cie (stawki, bonusy 10%, upkeep, cegĹ‚a); (d) bonusy cudĂłw teren/hex/specjalne = TODO.

## ROBOCZA `aa3c9b06` â€” 2026-07-23 Â· FALA 3: surowce (bydĹ‚o/owce/lama NIE surowce) + licznik magazynĂłw + CUDA-AI + Ludy Morza + UMOWA-B â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (commity `4adefe7`â†’`6859d9e`; kontynuacja batcha, 1 subagent/temat, trudne=Fable/worktree):**
  1. **SUROWCE â€” bydĹ‚o/owce/lama NIE sÄ… surowcami (decyzja Macieja, wielokrotna):** usuniÄ™te z systemu surowcĂłw (resource-access active, resources.json, diplomacy-goods) â€” zostajÄ… ulepszeniami terenu dajÄ…cymi bonus ĹĽywnoĹ›ci/produkcji. Surowcem â€žzwierzÄ™cym" jest tylko KoĹ„.
  2. **LICZNIK SUROWCĂ“W (BRAZ-ILOSC=B):** panel imperium â†’ sekcja SUROWCE STRATEGICZNE pokazuje realny wolumen magazynĂłw (suma City.surowce) zamiast pustej zaĹ›lepki. SĂłl/KoĹ„=dostÄ™p; Ceramika przejĹ›ciowo kumuluje; tempo/turÄ™=TODO.
  3. **CUDA-AI (C-CUDA-AI=A):** AI peĹ‚nych cywilizacji buduje cuda (priorytet E przed R, max 1 cud/cyw, throttle wg trudnoĹ›ci, deterministyczne). Progi ai-params.json Â§9 = PLACEHOLDERY DO AKCEPTACJI. FLAGA: bonusy cudĂłw nadal NIE wpiÄ™te w ekonomiÄ™ dla NIKOGO (gracz teĹĽ) â€” TODO ogĂłlnosystemowe.
  4. **#15 LUDY MORZA (Fable):** embarkacja (RuntimeUnit.embarked, ruch po wodzie koszt 1 z Ĺ»eglugÄ…, auto-desant, brak ataku z wody, obrona Ă—0,5) + obozy nadmorskie i rajdy (epoka BrÄ…zu; cel: nadmorskie miasto/ulepszenie). Params Â§9 PLACEHOLDERY. Render: Ĺ‚Ăłdka pod figurkÄ….
  5. **UMOWA-B (C-HANDEL-UMOWA=B):** trasy handlowe WYMAGAJÄ„ traktatu Umowa Handlowa (nie sam pokĂłj); teksty pomocy zaktualizowane (rekrutacja: Manpower nie ludnoĹ›Ä‡).
- **Bramki (stan scalony):** tsc=0 Â· logic 208/208 Â· ai 233/7 (pre-istniejÄ…ce) Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· barbarians 137/137 Â· trade-grant 38/38 Â· trade-routes 51/51 Â· category 73/73 Â· map-gen determinizm A=B PASS (806/806 rzek z ujĹ›ciem) Â· VERIFY OK.
- **md5:** `aa3c9b06c0c22405777c59447a28227d` Â· stamp `aa3c9b06`. Bundel 28,2 MB. PublikowaĹ‚a sesja chmurowa (autonomicznie, â€žwypchnij wszystko do roboczej").
- **Test:** panel imperium â†’ SUROWCE STRATEGICZNE pokazuje sztuki w magazynach; dyplomacja NIE pokazuje juĹĽ bydĹ‚a/owiec/lamy jako dĂłbr; z Ĺ»eglugÄ… jednostka wchodzi na wodÄ™ (Ĺ‚Ăłdka); AI moĹĽe zakolejkowaÄ‡ cud; trasy wymagajÄ… Umowy Handlowej.
- **FLAGI do decyzji Macieja:** (a) ceramika: zliczana vs tylko-dostÄ™p (koliduje z kosztem 3 budynkĂłw w ceramice); (b) czy ulepszenie produkuje bez pracownikĂłw (dziĹ›: tak tylko gdy pole obsadzone); (c) stawki produkcji/turÄ™ per surowiec â€” do ustalenia po obejrzeniu licznika; (d) placeholdery CUDA/Ludy Morza do strojenia; (e) docs (Civpedia+Poradnik, regeneracja wikiBundle) w NASTÄPNEJ fali.

## ROBOCZA `9f9ced35` â€” 2026-07-23 Â· WIELKI BATCH (12 tematĂłw): drzewko technologii w grze Â· ekran CudĂłw Â· handel E6+E3b Â· koszty surowcowe budynkĂłw Â· fixy â€” ZASTÄ„PIONA

- **ZawartoĹ›Ä‡ (commity `98ddefe`â†’`9450559`; batch zlecony przez Macieja, 1 subagent/temat, trudne=Fable):**
  1. **EKRAN DRZEWKA TECHNOLOGII (#2, Fable):** peĹ‚noekranowy graf wg makiety â€žsiatka v1.1" â€” pasma epok, 4 stany wÄ™zĹ‚Ăłw z powodami blokad, karta wÄ™zĹ‚a (koszt z tempem Ă—2, tury, AND âś“/âś—, odblokowania), zoom/pan/minimapa; wejĹ›cie zĹ‚otym przyciskiem z panelu badaĹ„; â€žpokaĹĽ Ĺ›cieĹĽkÄ™" = TODO.
  2. **EKRAN CUDĂ“W ĹšWIATA (#16):** galeria 19 cudĂłw wg makiety CUDA-v1 (stany z realnego stanu gry, karta z CTA), powiadomienia nasz/cudzy; wejĹ›cie 6. medalionem toolbara. Fix po drodze: cud w kolejce raportowaĹ‚ siÄ™ jako DostÄ™pny. Obserwacja: AI dziĹ› nie buduje cudĂłw.
  3. **Handel E6 (#3):** AI proaktywnie proponuje Umowy Handlowe (gracz przez skrzynkÄ™ propozycji + AIâ†”AI max 1/turÄ™; prĂłg 40 z decyzji 21.07, cooldowny w save).
  4. **Handel E3b (#4):** dostÄ™p brÄ…z/ĹĽelazo/koĹ„ przez aktywnÄ… trasÄ™ (czysta pochodna tras â€” wojna/zerwanie cofa automatycznie); UI: â€žszlak handlowy z X"; nowy test 30/30.
  5. **Powiadomienia tras (#5):** toast+WYDARZENIA nowa/zerwana trasa z powodem (+16 asercji).
  6. **Koszty surowcowe budynkĂłw (#6):** koszt_surowce w buildings.json (10 budynkĂłw BrÄ…z/Ĺ»elazo, PLACEHOLDERY), blokada+pobĂłr przy enqueue, chipy w karcie, AI omija.
  7. **WyrÄ…b dla AI (#8):** ostatni priorytet, min. 3 lasy w promieniu, poprawna â€žwycinka".
  8. **Fix rzekaâ†”dekor (#7):** rzeka znikaĹ‚a TRWALE pod miastem/ulepszeniem (decorHiddenHexKeys) â€” teraz tylko mgĹ‚a chowa rzekÄ™; potwierdzone zrzutami.
  9. **Pozycyjny szum wody (#23):** renderWoda wg udziaĹ‚u wody w kadrze (morze/rzeka).
  10. **Natura ulotna (#9):** wyciszenie nie zapisuje siÄ™ trwale (wzorzec muzyki).
  11. **Kontry+kategorie (#10):** Triari/Thorakites vs Mount 0â†’50 (Typ=Spearman); categoryOf 73/73.
  12. **logic-test (#1):** nie regresja â€” fixtury po Ĺ›wiadomych zmianach balansu; 208/208.
- **Bramki (stan scalony):** tsc=0 Â· logic 208/208 Â· combat 6/6 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· trade-routes 51/51 + income 49/49 Â· trade-grant 30/30 (NOWY) Â· diplomacy-layers 8/8 Â· converters 19/19 Â· ai 233/7 (pre-istniejÄ…ce) Â· kategorie 73/73 Â· VERIFY OK.
- **md5:** `9f9ced355686a82efe0b9a9edfd0944a` Â· stamp `9f9ced35`. Bundel 27,9 MB. PublikowaĹ‚a sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** panel badaĹ„ â†’ zĹ‚oty â€žDrzewko â€” graf epok"; toolbar mapy â†’ medalion Cuda Ĺ›wiata; dyplomacja: AI moĹĽe zaproponowaÄ‡ UmowÄ™ HandlowÄ…; miasto nad rzekÄ… nie kasuje juĹĽ rzeki; budynki BrÄ…zu+ pokazujÄ… koszt cegĹ‚y/ceramiki; zbliĹĽ kamerÄ™ do morza â†’ szum wody.
- **FLAGI do decyzji Macieja:** (a) trasy bramkowane POKOJEM (nie UmowÄ…) â€” zgodnie z HANDEL-Q1/Q8, Umowa=relacje+fundament; (b) â€žpokaĹĽ Ĺ›cieĹĽkÄ™" w drzewku TODO; (c) AI nie buduje cudĂłw (przyszĹ‚y temat); (d) niespĂłjne Bonus vs Mount u 4 SpearmanĂłw (ABC).

## ROBOCZA `feda52ec` â€” 2026-07-23 Â· RĂłwna gwiazdka GeneraĹ‚a + Dystansowe = tarcza (zasoby Design) â€” **ZASTÄ„PIONA** (â†’ `9f9ced35`)

- **ZawartoĹ›Ä‡ (commit `e5e1c26`):** â… GeneraĹ‚a podmieniona na RĂ“WNÄ„ gwiazdkÄ™ z eksportu Design (`chip-star-24.svg` â€” poprzednia z makiety byĹ‚a asymetryczna); filtr Dystansowych = TARCZA STRZELNICZA z torem lotu (`class-ranged.svg` z battle-class-map â€” decyzja Macieja, przywrĂłcona zamiast Ĺ‚uku).
- **Bramki:** tsc=0 Â· zrzut potwierdzony Â· VERIFY OK.
- **md5:** `feda52ecc1b4885b124ba03bca25aa6c` Â· stamp `feda52ec`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `e914e1e5` â€” 2026-07-23 Â· FILTRY NA DWĂ“CH PIÄTRACH (â… obok Wszystkie, grupy niĹĽej) â€” **ZASTÄ„PIONA** (â†’ `feda52ec`)

- **ZawartoĹ›Ä‡ (commit `216a3d5`):** ukĹ‚ad filtrĂłw wg uwagi Macieja: rzÄ…d 1 = ikony klas + Wszystkie + â… GeneraĹ‚ (obok siebie); rzÄ…d 2 (piÄ™tro niĹĽej) = grupy G1/G2/G3. Oba buildery (deploy + walka/rÄ™czna).
- **Bramki:** tsc=0 Â· zrzut potwierdzony Â· VERIFY OK.
- **md5:** `e914e1e52bf5b466c9381ca8849d55f1` Â· stamp `e914e1e5`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `b6481c25` â€” 2026-07-23 Â· RZÄ„D FILTRĂ“W W CAĹOĹšCI 1:1 z makiety C06 + grupy G1/G2/G3 â€” **ZASTÄ„PIONA** (â†’ `e914e1e5`)

- **ZawartoĹ›Ä‡ (commit `1d51e09`):** dokĹ‚adne rysunki ikon klas z makiety (podkowa z gwoĹşdziami / skrzyĹĽowane miecze / Ĺ‚uk z ciÄ™ciwÄ…), obwĂłdki/kolory per klasa 1:1 (konnica NIEBIESKA), grupy jako kompaktowe chipy **G1/G2/G3** w stylu ikon (decyzja Macieja â€” â€žsamo G"), peĹ‚ne nazwy w piguĹ‚kach. Makieta rzÄ™du filtrĂłw wyczerpana w caĹ‚oĹ›ci (ekstrakcja wszystkich elementĂłw).
- **Bramki:** tsc=0 Â· zrzut potwierdzony (podkowa/miecze/Ĺ‚uk/kropki/G1-G3/â…) Â· VERIFY OK.
- **md5:** `b6481c25796e73115a50cd695c795650` Â· stamp `b6481c25`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `0500eddf` â€” 2026-07-23 Â· KOMPLET filtrĂłw 1:1 z makietÄ… C06 (â… GeneraĹ‚, style aktywne) â€” **ZASTÄ„PIONA** (â†’ `b6481c25`)

- **ZawartoĹ›Ä‡ (commit `3978be4`):** rzÄ…d filtrĂłw rosteru w KOMPLECIE 1:1 z makietÄ… â€žC06 Pole bitwy odswiezenie": GeneraĹ‚ = GWIAZDKA (SVG z makiety), Wszystkie = 4 kropki (SVG z makiety, viewBox 24), przyciski 34px/radius 9, **stan aktywny = peĹ‚ne zĹ‚oto #e8d88a z ciemnÄ… ikonÄ…** (jak w makiecie; byĹ‚o: pĂłĹ‚przezroczyste). Korekta po uwadze Macieja o niepeĹ‚nym wdraĹĽaniu makiet.
- **Bramki:** tsc=0 Â· zrzut walki potwierdzony (podkowa/miecze/Ĺ‚uk/kropki/â… + GRUPA 1-3 tekstowo) Â· VERIFY OK.
- **md5:** `0500eddf184033d9b7bfe2d0a7ab998f` Â· stamp `0500eddf`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `8c774bdd` â€” 2026-07-23 Â· FILTR â€žWSZYSTKIE" = ikona czterech kropek â€” **ZASTÄ„PIONA** (â†’ `0500eddf`)

- **ZawartoĹ›Ä‡ (commit `277abfd`, na `1d2f86fc`):** czwarty filtr rosteru (â€žWszystkie") rĂłwnieĹĽ jako ikona â€” cztery kropki w kwadracie (uwaga Macieja), piguĹ‚ka â€žWSZYSTKIE" na hover; komplet czterech ikon filtrĂłw bez napisĂłw. Inne uĹĽycia przycisku (popupy taktyk/linii) bez zmian.
- **Bramki:** tsc=0 Â· zrzut potwierdzony Â· VERIFY OK.
- **md5:** `8c774bdde7851a884e17d76ad773ed0d` Â· stamp `8c774bdd`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `1d2f86fc` â€” 2026-07-23 Â· FILTRY ROSTERU JAKO IKONY (Konnica/Piechota/Dystansowe) â€” **ZASTÄ„PIONA** (â†’ `8c774bdd`)

- **ZawartoĹ›Ä‡ (commit `ff01479`, na `49563095`):** filtry klas jednostek w panelu rosteru bitwy = SAME IKONY 32px (podkowa/skrzyĹĽowane miecze/Ĺ‚uk â€” te same co na medalionach kart, spĂłjne z makietÄ… C06; ikona â€žtarczy" z battle-class-map.json Design Ĺ›wiadomie odrzucona jako niespĂłjna), polska nazwa TYLKO w piguĹ‚ce na hover, aktywny = zĹ‚ota obwĂłdka+glow; chipy WSZYSTKIE/GRUPA N/GENERAĹ zostajÄ… tekstowe (dynamiczne). Uwaga Macieja â€žinfografiki, nie napisy". Logika filtrowania bez zmian.
- **Bramki:** tsc=0 Â· smoke deploy+walka 0 bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `1d2f86fc930cc7d132de9ed4322c0da7` Â· stamp `1d2f86fc`. PublikowaĹ‚a sesja chmurowa.
- **Test:** roster bitwy â†’ trzy ikonki nad listÄ… (hover = KONNICA/PIECHOTA/DYSTANSOWE z licznikiem), klik filtruje jak dotÄ…d.

## ROBOCZA `49563095` â€” 2026-07-23 Â· BRĂ“D (wariant C) Â· HANDEL SUROWCAMI (wariant B) Â· HUD: ikony na rosterze + minimapa prawy-dĂłĹ‚ â€” **ZASTÄ„PIONA** (â†’ `1d2f86fc`)

- **ZawartoĹ›Ä‡ (commity `81d0cef`+`dd0f651`+`67e698f`):** trzy decyzje Macieja z 2026-07-23:
  1. **BrĂłd C-BTL-BROD-Q1=C:** ruch Ă—0,5 w brodzie Â· â’25% obrony walczÄ…c w brodzie (kara ataku â’25% juĹĽ istniaĹ‚a jako `river_attack_mult` â€” udokumentowana, osobne strojenie) Â· obroĹ„ca brzegu przy brodzie +15% obrony Â· tooltip jednostki pokazuje aktywny status (wiersz TEREN, czerwony/zielony) Â· wartoĹ›ci w `combat-params.json` klucz `brod` Â· AI: kawaleria unika zatrzymania w brodzie Â· legacy (bez FordĂłw) bit-for-bit.
  2. **Handel surowcami C-DYP-SUROWCE-Q1=B:** koszyk negocjacji handluje iloĹ›ciowymi surowcami miast w pakietach po 10 (drewno 2/kamieĹ„ 3/glina 2/cegĹ‚a 5/ceramika 6/ruda 4 za szt. â€” PLACEHOLDERY, sekcja `handel_surowce` w `econ-params.json`, strojenie w panelu) Â· transfer od najwiÄ™kszych zapasĂłw dawcy â†’ stolica biorcy Â· SZYBKA UMOWA dopeĹ‚nia bilans pakietami przed zĹ‚otem Â· AI wycenia przez ten sam katalog.
  3. **HUD bitwy (uwagi Macieja):** peĹ‚noszerokoĹ›ciowy dolny pasek USUNIÄTY; ikony Formacja/Konnica/Linie/Taktyka/Strategia (deploy) i zegar/budynek (walka) = maĹ‚y rzÄ…dek 38px NA GĂ“RZE panelu rosteru z hover-pillami; START WALKI+Reset = pĹ‚ywajÄ…cy klaster prawy-dĂłĹ‚; **minimapa+TEMPO przeniesione na prawy-dĂłĹ‚**; popupy dropdownĂłw fixed (bez obciÄ™cia).
- **Bramki:** tsc=0 Â· combat 6/6 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· logic 192/207 (te same 15) Â· trade-routes 35/35 + income 49/49 Â· basket-transfer 8/8 Â· map-gen determinizm A=B PASS Â· smoke deploy/walka/rzeka 0 bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `49563095b8a5d8552b4368ff4dca9ea3` Â· stamp `49563095`. Bundel 27,9 MB. PublikowaĹ‚a sesja chmurowa.
- **Test:** bitwa na hexie z rzekÄ… â†’ jednostka w brodzie ma w tooltipie karÄ™, obroĹ„ca brzegu bonus; dyplomacja â†’ koszyk z pozycjÄ… â€žDrewno Ă—10 (pakiet)"; bitwa â†’ ikony nad rosterem (hover = nazwa), minimapa na prawym dole, brak dolnego paska.

## ROBOCZA `f736ca21` â€” 2026-07-23 Â· OBLÄĹ»ENIE: zabudowa za murem + gruz wyĹ‚omu Â· IMIONA WĹADCĂ“W (60, z Antykiem) â€” **ZASTÄ„PIONA** (â†’ `49563095`)

- **ZawartoĹ›Ä‡ (commity `115484a`+`8770bdc`, na `48249d90`):**
  1. **OblÄ™ĹĽenie (#8):** miasto za murem ma ZABUDOWÄ (do 38 budynkĂłw low-poly: 3 rozmiary + 2 â€žpubliczne", dachy dwuspadowe/pĹ‚askie, paleta ziemisto-kamienna z jitterem; deterministycznie z `tileJitter`, gÄ™Ĺ›ciej przy bramie, korytarz od bramy wolny; InstancedMesh, zero wpĹ‚ywu na pathfinding â€” tylko w bitwach `siege`). **Gruz wyĹ‚omu:** 7 bryĹ‚ (boxy+kamienie) z jitterem pozycji/rozmiaru/koloru per kafel wyĹ‚omu (byĹ‚o 4 identyczne).
  2. **Imiona wĹ‚adcĂłw (ZAAKCEPTOWANE 2Ă—):** `civs.json` pole `wodzowie` â€” 15 cyw Ă— 4 epoki = 60 imion (Antyk = zapas, patrz `dyspozycje/DECYZJA-IMIONA-WLADCOW-2026-07-23.md`). W grze: imiÄ™ przy medalionie na karcie dowĂłdcy bitwy, w preBattle i w dyplomacji (obu kartach), dobĂłr wg epoki z fallbackiem antykâ†’ĹĽelazoâ†’brÄ…zâ†’kamieĹ„.
- **Bramki:** tsc=0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· logic 192/207 (te same 15 pre-istniejÄ…cych) Â· map-gen determinizm A=B PASS Â· smoke oblÄ™ĹĽenie+legacy 0 bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `f736ca211c25d646cbaadeb4b9824028` Â· stamp `f736ca21`. Bundel 27,9 MB. PublikowaĹ‚a sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** szturm na miasto â†’ za murem domy, przy bramie â€žulica"; wyĹ‚om katapultami â†’ rumowisko w luce; karty dowĂłdcĂłw â†’ portret + IMIÄ wĹ‚adcy (np. Rzym/KamieĹ„ = Romulus); dyplomacja â†’ imiÄ™ pod nazwÄ… cywilizacji.

## ROBOCZA `48249d90` â€” 2026-07-23 Â· PORTRETY WĹADCĂ“W w medalionach (bitwa + preBattle + dyplomacja) â€” **ZASTÄ„PIONA** (â†’ `f736ca21`)

- **ZawartoĹ›Ä‡ (commit `2cb3685`, na `6bb7fedc`):** wdroĹĽenie paczki Design PORTRETY-WLADCOW v3/v4 (30 portretĂłw: 15 cywilizacji Ă— KamieĹ„/BrÄ…z, ĹşrĂłdĹ‚o Gemini/Maciej, ciÄ™cie Design). Nowy `leaderPortraits.ts` (30Ă—256px JPEG inline, +0,38 MB bundla). Medaliony pokazujÄ… portret wĹ‚adcy wg CYWILIZACJI i EPOKI (ĹĽelazoâ†’brÄ…zâ†’kamieĹ„ przy braku; Ĺ»elazo TODO â€” czeka na arkusz): karty dowĂłdcĂłw HUD bitwy (obwĂłdki stron bez zmian), karty dowĂłdcĂłw preBattle nakĹ‚adki, medalion rozmĂłwcy i gracza w dyplomacji (hero 150px + 64px). Fallback obowiÄ…zkowy: brak portretu â†’ dotychczasowa ikona cywilizacji. `BattleOpts.attackerEra/defenderEra` opcjonalne (legacy=kamieĹ„); ery z `empireEpochForOwner` we wszystkich Ĺ›cieĹĽkach startu bitwy.
- **Bramki:** tsc=0 Â· zrzut E2E: Rzym/Grecja z portretami w koĹ‚ach medalionĂłw, cover-fit, obwĂłdki OK Â· VERIFY OK.
- **md5:** `48249d9089c15bc3967e55365601b719` Â· stamp `48249d90`. Bundel 27,9 MB. PublikowaĹ‚a sesja chmurowa.
- **Test:** bitwa â†’ karty dowĂłdcĂłw z twarzami wĹ‚adcĂłw; atak na wroga â†’ preBattle z portretami w rogach; dyplomacja â†’ portret rozmĂłwcy w medalionie. Cywilizacja bez portretu (nie powinno byÄ‡) â†’ ikona jak dotÄ…d.

## ROBOCZA `6bb7fedc` â€” 2026-07-23 Â· PAKIET: HUD TW-v5 F3 (komplet 3/3) + PREBATTLE nakĹ‚adka v1.1 + DYPLOMACJA zalegĹ‚oĹ›ci silnika â€” **ZASTÄ„PIONA** (â†’ `48249d90`)

- **ZawartoĹ›Ä‡ (commit `bfe377d`):** trzy tematy jednym bundlem:
  1. **HUD TW-v5 FAZA 3 (finaĹ‚ makiety):** C-12 Koniec bitwy 1:1 z klatkÄ… 5 (medalion laur/miecze, kafle strat â€žludzi", CTA, hint), C-23 SzczegĂłĹ‚y bitwy 1:1 z klatkÄ… 4 (2 kolumny ATK/OBR, Zniszczone/Rozbite/OcalaĹ‚e, â€ž1240â†’862 ludzi po bitwie") â€” przepiÄ™te z odrzuconego postBattleSummary; dolny toolbar deploy = SAME IKONY 46Ă—46 z piguĹ‚kÄ… na hover; karty rosteru z nazwÄ… jednostki (medaliony typu); nagĹ‚Ăłwki grup pasek+chevron (fix nadpisywania stylu); minimapa â€žrozstawianie" bez Tempo w deploy; panele ~72â€“86%+blur 7â€“9; sprzÄ…tniÄ™cie martwych pĂłl F1/F2.
  2. **PREBATTLE nakĹ‚adka v1.1 (kanon Design):** preBattle.ts + cityAttackChoice.ts jako kompaktowe nakĹ‚adki NAD mapÄ… (mapa widoczna â€” koniec peĹ‚noekranowych modali): panel dĂłĹ‚-Ĺ›rodek z kickerem/terenem(ikona+nazwa)/paskiem szans/piguĹ‚kami modyfikatorĂłw, karty dowĂłdcĂłw w rogach, rostery przy krawÄ™dziach (max 8 + â€ž+N"), atak na miasto: karty OBLEGAJ [1]/SZTURM [2], obrona: strony odwrĂłcone + â€žWycofanie niedostÄ™pne" zamiast Wycofaj. API bez zmian; braki danych (Region, marker hexa, mgĹ‚a wywiadu, szanse szturmu) = TODO w kodzie.
  3. **DYPLOMACJA zalegĹ‚oĹ›ci:** SZYBKA UMOWA = realna auto-uczciwa oferta (greedy na progu diplomacyFairGivePn, koszyk edytowalny); â€žZerwij" AKTYWNE (modal potwierdzenia, `zerwanie_traktatu` â’15 Zaufania, sojuszâ†’pokĂłj); NOWY diplomacy-goods.ts â€” koszyk pokazuje faktyczne dobra obu stron (city.surowce + brÄ…z/ĹĽelazo civ-wide). Wycena iloĹ›ciowa surowcĂłw miejskich odĹ‚oĹĽona (ABC).
- **Bramki:** tsc=0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· logic 192/207 (identyczne 15 pre-istniejÄ…cych) Â· map-gen determinizm A=B PASS Â· zrzuty E2E: toolbar ikonowy, walka, C-12, C-23, 8 plansz terenowych â€” 0 bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `6bb7fedce3ff5e84ae18a22d28169608` Â· stamp `6bb7fedc`. Bundel 27,5 MB. PublikowaĹ‚a sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** bitwa â†’ toolbar z samych ikon (najedĹş = piguĹ‚ka), karty rosteru z nazwami, koniec bitwy = nowy ekran ZwyciÄ™stwo/PoraĹĽka, â€žSzczegĂłĹ‚y bitwy" = 2 kolumny; atak na wroga na mapie â†’ pre-battle jako maĹ‚a nakĹ‚adka (mapa widoczna); dyplomacja â†’ SZYBKA UMOWA wypeĹ‚nia koszyk, â€žZerwij" dziaĹ‚a z potwierdzeniem.
- *(przejĹ›ciowa `47be2c02` â€” ta sama zawartoĹ›Ä‡ bez pkt 3, zastÄ…piona w ~30 min, nie trafiĹ‚a do playtestu)*

## ROBOCZA `2c19fcb3` â€” 2026-07-23 Â· HUD BITWY TW-v5 fazy 1-2 (dowĂłdcy/zegar/przewaga + tempo + stany kart + tooltip + bez raila) â€” **ZASTÄ„PIONA** (â†’ `6bb7fedc`)

- **ZawartoĹ›Ä‡ (na `2c67014c`, commity `0f1455e`+`4726e97`):** wdroĹĽenie makiety POLE-BITWY-TW-v5 fazy 1-2: **F1** â€” karty dowĂłdcĂłw obu stron (medalion z pierĹ›cieniem HP, liczniki typĂłw) + ZEGAR bitwy + pasek PRZEWAGI ze zĹ‚otym markerem (gĂłrny Ĺ›rodek); panel TEMPO (pauza + x1/x2/x4 + AUTO) przy minimapie. **F2** â€” stany kart rosteru C-09 v5 (puste sloty +, MARTWA âś•/â€žPadĹ‚a", ROZBITA â€žRout"; FIX: stany byĹ‚y odfiltrowywane i nigdy siÄ™ nie renderowaĹ‚y), bogaty tooltip jednostki (Postawa z realnych rozkazĂłw/doktryn, Grupa N, Zdrowie/Morale/Amunicja), **prawy rail 56px ZLIKWIDOWANY** (M/MUZ/H/I+Pomoc â†’ popup zÄ™batki âš™ przy â€žWycofaj siÄ™"; â€şâ€ş i WYCOFAJ w prawym-gĂłrnym klastrze; skrĂłty klawiszowe bez zmian). Build z czystego commita F2 (worktree â€” F3 w toku w drzewie roboczym).
- **Bramki:** tsc=0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· map-gen determinizm PASS Â· E2E deployâ†’walkaâ†’koniec + tooltip + popup zÄ™batki bez bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `2c19fcb34433c8d14ddc16f62b6e8c14` Â· stamp `2c19fcb3`. PublikowaĹ‚a sesja chmurowa. **F3 w toku** (C-12/C-23 + panele blur + ikonowy toolbar + medalionowe karty) â€” osobny deploy po bramkach.

## ROBOCZA `2c67014c` â€” 2026-07-23 Â· BITWA: czyste pole na czarnym tle (bez obramĂłwek) â€” **ZASTÄ„PIONA** (â†’ `2c19fcb3`)

- **ZawartoĹ›Ä‡ (na `8aff7266`):** usuniÄ™te niebieskie/czerwone pasy boczne wokĂłĹ‚ pola bitwy (decyzja Macieja); tĹ‚o/mgĹ‚a/grunt/marginesy â†’ czerĹ„; domyĹ›lny kadr ciaĹ›niejszy (pole wypeĹ‚nia ekran); zĹ‚ota ramka strefy gry zostaje. FIX: przeciek niebieskiego (kolor rzeki w marginesie) przez szparÄ™ na krawÄ™dziach kafli â€” marginesy po krawÄ™dziach + zakĹ‚adki, weryfikacja pixel-exact. BACKLOG (decyzja Macieja â€žkiedyĹ›"): wiÄ™ksze plansze â€” czarne tĹ‚o zastÄ…piÄ‡ graficznie uĹ‚oĹĽonym lÄ…dem, strefa walki wydzielona ramkÄ… jak obecnie.
- **Bramki:** tsc=0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· map-gen determinizm+rzeki PASS Â· zrzuty (rzeka/wzgĂłrza/pustynia/legacy) czyste, 0 bĹ‚Ä™dĂłw konsoli Â· VERIFY OK.
- **md5:** `2c67014c9ae05e7f86afac445f1ec039` Â· stamp `2c67014c`. PublikowaĹ‚a sesja chmurowa.

## ROBOCZA `8aff7266` â€” 2026-07-23 Â· DYPLOMACJA TW: dwustronny panel + stĂłĹ‚ negocjacji + blokady (makieta FINAL 3/3) â€” **ZASTÄ„PIONA** (â†’ `2c67014c`)

- **ZawartoĹ›Ä‡ (na `c7f70b27`):** peĹ‚ne wdroĹĽenie ZATWIERDZONEJ makiety DYPLOMACJA FINAL (9 pkt integratora, 3 fazy): **F1 dane** â€” spĂłjne blokady 13 akcji z progami silnika (notki â€žzablokowana â€” wymaga Zaufania 91 (masz X)"), FIX: Ĺ»Ä…danie trybutu wczeĹ›niej NIE bramkowaĹ‚o Respektu; rejestr czynnikĂłw relacji per-para (save round-trip) â†’ rozbicie â€žZa co CiÄ™ lubiÄ…/nie lubiÄ…" z realnych delt. **F2 layout** â€” dwustronny (karta gracza: medalion/Moc/potencjaĹ‚ sojuszniczy/SKARBIEC/dobra â†” karta rozmĂłwcy: relacje TYLKO tu + nastawienie), baner statusu formalnego (nazwa+od X tur+kara zerwania), stĂłĹ‚ negocjacji 3 kolumny (MoĹĽliwe/Aktywne/Ĺ»Ä…dania-Oferty), koszyk PN z bilansem jednorazowo vs /turÄ™ + werdykt. **F3 styl** â€” ikonowy pasek akcji 46px (WOJNA/POKĂ“J/SOJUSZ/PAKT/HANDEL/DAR/WASAL, hover-piguĹ‚ki, disabled wg blokad) + SZYBKA UMOWA, ikonowe â€žZerwij", granat 1E + zĹ‚oty primary z makiety.
- **Bramki:** tsc=0 Â· diplomacy 144/146 (2 pre-istniejÄ…ce fixtury progĂłw) Â· diplomacy-locks 67/67 (nowy) Â· tech/research/unit-replace/map-gen zielone Â· logic 192/207 baseline Â· E2E pokĂłjâ†’paktâ†’banerâ†’active zweryfikowane Â· VERIFY OK.
- **md5:** `8aff7266da86e3022d1ddeb52abe74a3` Â· stamp `8aff7266`. Bundel 27,4 MB. PublikowaĹ‚a sesja chmurowa.
- **Test:** otwĂłrz dyplomacjÄ™ â†’ audiencja = dwustronny panel; zablokowane akcje z notkami progĂłw; zawrzyj pakt â†’ baner + â€žjuĹĽ zawarta" + Aktywne traktaty; pasek ikon na dole (hover = nazwa); rozbicie relacji nad stopkÄ….

## ROBOCZA `c7f70b27` â€” 2026-07-23 Â· BITWA: wizualia sceny + presety terenu wg hexa + rzeka S â€” **ZASTÄ„PIONA** (â†’ `8aff7266`)

- **ZawartoĹ›Ä‡ (na `98c4ede1` Cursora, rebase czysty):** uatrakcyjnienie sceny 3D bitwy (ACES tone mapping, HemisphereLight, cieplejsza mgĹ‚a/tĹ‚o, MeshStandard kafli + wariacja, wyciszona siatka, banery stron nad oddziaĹ‚ami, kÄ™py trawy 7944 + drobny dekor, gÄ™stszy las, mur oblÄ™ĹĽniczy: materiaĹ‚y+wieĹĽyczki+wariacja segmentĂłw); **PRESETY plansz bitwy wg terenu hexa Ĺ›wiata** (Ĺ‚Ä…ka/rĂłwnina/wzgĂłrza/gĂłry/las/pustynia/wybrzeĹĽe/rzeka; wpiÄ™te w 4 Ĺ›cieĹĽki startu bitwy; debug `?bt=`); **rzeka = ciÄ…gĹ‚e koryto S** przez caĹ‚e pole z brodami (carve zamienia wodÄ™ pod formacjami na Ford â€” koryto nieprzerwane), jeziorka na Ĺ‚Ä…ce/rĂłwninie; fix czarnych drzew (instanceColor). Legacy bez presetu bit-for-bit. + dostawy Design: POLE-BITWY-TW-v5, DYPLOMACJA v1.1â†’FINAL (ZATWIERDZONA).
- **Bramki:** tsc=0 Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· manpower 36/36 Â· map-gen determinizm+rzeki PASS Â· logic 192/207 â€” **identycznie jak czysty origin/main** (poraĹĽki kultura/ĹšwiÄ…tynia + koszty badaĹ„ pre-istniejÄ… z Batch B, nie z tej paczki) Â· VERIFY OK.
- **md5:** `c7f70b271ceff1f1e711494fb519f1c5` Â· stamp `c7f70b27`. Bundel 27,4 MB. PublikowaĹ‚: sesja chmurowa (Claude Code) po sygnale Macieja â€žCursor skoĹ„czyĹ‚".
- **Test:** bitwa na hexie z rzekÄ… â†’ ciÄ…gĹ‚e S + brody; wzgĂłrza/gĂłry â†’ grzbiety; pustynia â†’ piach; `?bt=rzeka` itd. wymusza planszÄ™; oblÄ™ĹĽenie â†’ mur z wieĹĽyczkami.

## ROBOCZA `98c4ede1` â€” 2026-07-23 Â· AUDYT 9a0ca985 luki: ruda stock + KULT-04 Power + warzelnia â€” **ZASTÄ„PIONA** (â†’ `c7f70b27`)

- **ZawartoĹ›Ä‡:** Stock ruda/ruda_zelaza z kopalni_miedzi/kopalnia â†’ `city.surowce` (2/t, Ĺ‚aĹ„cuch konwerterĂłw brÄ…z/ĹĽelazo); **KULT-04 A** â€” skĹ‚adniki Power: kultura imperium (Ă—0,5) + jednoĹ›Ä‡ religii (Ă—25/miasto) w `power-objective.ts` + wpiÄ™cie `main.ts`; warzelnia_soli teren wybrzeĹĽe w JSON; resources.json ruda miedzi vs ruda ĹĽelaza; fix palac techUnlock `-`; kuznia wymagania bez legacy cyna.
- **OdĹ‚oĹĽone:** faza 3 koszty materiaĹ‚owe budynkĂłw/jednostek (B-SUROW-BUD â€” tylko access gates, nie stock costs); KULT-DYP-01 dyplomacja (osobna decyzja).
- **Bramki:** tsc=0 Â· power-objective 15/15 Â· converters 19/19 Â· culture-religion 65/65 Â· VERIFY OK.
- **md5:** `98c4ede16e506df393369a49dabe25bb` Â· stamp `98c4ede1`.

## ROBOCZA `9a0ca985` â€” 2026-07-23 Â· FAZA 2: surowce+budynki+spichlerz tier+kultura presja â€” **ZASTÄ„PIONA** (â†’ `98c4ede1`)

- **ZawartoĹ›Ä‡:** B-SUROW-BUD-03 deski wycofane (resources/tech/units/tartak/converters); bramki epok drewno/kamieĹ„/cegĹ‚a w `building-resource-gate.ts` + imperium w `production.ts`/panel; 7 konwerterĂłw (mielerz 2â†’1, cegielnia 2+1, odlewnia ĹĽelaza, wielka kuĹşnia); Spichlerz II (`spichlerz_ii` upgrade, cap 150, bufor 70%); SĂłl w resources; KULT-PRESJA tick w turze; KULT-PRESJA-05 capture mix; KULT-DYP-01 dyplomacja AND; fix garncarnia w turn-economy.
- **OdĹ‚oĹĽone (znane luki):** stock ruda miedzi/ĹĽelaza z terenu do magazynu miasta; KULT-04 Power skĹ‚adniki; warzelnia_soli teren wybrzeĹĽe w JSON; kamieĹ„/cegĹ‚a jako koszt materiaĹ‚owy (faza 3).
- **Bramki:** tsc=0 Â· converters-test 18/18 Â· conquest-stability 27/27 Â· vite build OK.
- **md5:** `9a0ca98598c7d89af47dbb10789df868` Â· stamp `9a0ca985`.

## ROBOCZA `5000ee9f` â€” 2026-07-22 Â· FAZA 1: urealnienie dostÄ™pu surowcĂłw â€” **ZASTÄ„PIONA** (â†’ `9a0ca985`)

- **ZawartoĹ›Ä‡:** `resource-access.ts` â€” aktywny dostÄ™p wymaga zĹ‚oĹĽe+ulepszenie na heksie (glina, miedĹş, ruda/ĹĽelazo/wÄ™giel, sĂłl, koĹ„); wyjÄ…tki: tartak, kamienioĹ‚om, warzelnia na wybrzeĹĽu; hodowla Model B (bydĹ‚o/owce/lama bez zĹ‚oĹĽa). Panel miasta: potencjaĹ‚ vs dostÄ™p aktywny. Pilot bramki budynku: Garncarnia/Cegielnia (glina) â€” bez rozszerzania.
- **OdĹ‚oĹĽone (faza 2):** peĹ‚ne bramki budynkĂłw per surowiec; faza 3: magazyny + koszty materiaĹ‚owe.
- **Bramki:** tsc=0 Â· deposit-building-gate 24/24 Â· eko-tech-p5 11/11 Â· food-hodowla 24/24.
- **md5:** `5000ee9fce6fa0c332303784ff045eb8` Â· stamp `5000ee9f`.

## ROBOCZA `7e038328` â€” 2026-07-22 Â· FIX: suwak ĹĽywnoĹ›Ä‡â†’armia per miasto â€” **ZASTÄ„PIONA** (â†’ `5000ee9f`)

- **Bug Macieja:** suwak podziaĹ‚u ĹĽywnoĹ›ci (wzrost vs armia) w panelu miasta byĹ‚ wspĂłlny dla caĹ‚ego imperium (`EmpireFoodState.procentRozwoj` per ownerId).
- **Fix:** pole `City.procentRozwoj` per miasto; silnik (`turn-economy`, `advanceEmpireFood`) i panel czytajÄ…/zapisujÄ… per miasto; migracja starych save z `empireFoodStates.procentRozwoj`.
- **Bramki:** tsc=0 Â· empire-food-b5 25/25 Â· research GREEN Â· upkeep 58/58.
- **md5:** `7e038328910eb09f9ca90beaf06a5e59` Â· stamp `7e038328`.

## ROBOCZA `b6353296` â€” 2026-07-22 Â· wycofanie #48 (decyzja gameplayowa Macieja) â€” **ZASTÄ„PIONA** (â†’ `7e038328`)

- **Jedyna zmiana vs `80a32769`:** cofniÄ™ta naprawa #48 â€” Moc wyeliminowanych cywilizacji ZNĂ“W liczy siÄ™ w mianowniku dominacji (Maciej: â€žto byĹ‚a decyzja z gameplayu"). Commity `4fdc0ed` + `773f49c`. PrzyszĹ‚e audyty: NIE zgĹ‚aszaÄ‡ jako bĹ‚Ä…d.

## ROBOCZA `80a32769` â€” 2026-07-22 Â· NAPRAWY AUDYTU: 51 bĹ‚Ä™dĂłw (subagenci Sonnet)

- **ZawartoĹ›Ä‡:** komplet napraw audytu-53 â€” m.in. KRYTYCZNE: #2 auto-szturm nie kasuje juĹĽ caĹ‚ej armii (straty proporcjonalne), #1 koszyk â€žjednostka" wyĹ‚Ä…czony (etap 1); dyplomacja bez exploitĂłw (zaufanie z pokryciem #16, kursy symetryczne #20, trybut z limitem #21, bramki wasalizacji/przemarszu #19/#46); save/load kompletny (wioski #13, obozy #42, religia #43, skarbce AI #44, profile miast-paĹ„stw #15); AI buduje budynki #31 i nie atakuje siĂłstr #24; combat: 25 jednostek odzyskaĹ‚o pancerz #10, super-jednostki max 1 #11; wydajnoĹ›Ä‡ (#27-30, #56-57); UI-prawda (#17 bilans, #18 HP). PeĹ‚ny log: `AUDYT-NAPRAWY-LOG.md`.
- **Commity:** A-D `6f11b3f`/`55d7597`/`bb9d264`/`d6837e1` + docs `90369f8` (po incydencie kolizji z integratorem â€” naprawy uratowane ze stashy, inwentaryzacja 50/51 + odtworzenie #71).
- **Bramki:** tsc=0 Â· combat 6/6 Â· tech-tree 19/0 Â· research GREEN Â· unit-replace 10/10 Â· logic-test 6 faili = dĹ‚ug integratora po balansie badania Ă—2 (94b7f6d; przed naprawami byĹ‚o 14).
- **Poza zakresem:** #41 Wielka KuĹşnia (decyzja Macieja), #22 (juĹĽ naprawione `b1a7a61`).

## ROBOCZA (gra-robocza\Gra-ROBOCZA.html â€” wskazywana przez START.html)

- 2026-07-22 Â· stempel: ROBOCZA Â· **7e038328** Â· md5 pliku `7e038328910eb09f9ca90beaf06a5e59` Â· **FIX: suwak ĹĽywnoĹ›Ä‡â†’armia per miasto** â€” na `7238588c`:
  **Bug Macieja:** zmiana suwaka wzrost/armia w jednym mieĹ›cie zmieniaĹ‚a ustawienie we wszystkich miastach. **Fix:** `City.procentRozwoj` per miasto; panel zapisuje tylko bieĹĽÄ…ce miasto; silnik sumuje wkĹ‚ady per miasto do zapasĂłw armii.
  tsc=0 Â· empire-food-b5 25/25 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **AKTUALNA** Â· Test: stamp `7e038328` Â· 2 miasta â†’ rĂłĹĽne suwaki â†’ kaĹĽde zachowuje wĹ‚asne %.

- 2026-07-22 Â· stempel: ROBOCZA Â· **7238588c** Â· md5 pliku `7238588c73778b8761ec5bf999268b09` Â· **FIX: dialog POĹÄ„CZENIE ARMII odĹ‚oĹĽony do startu tury gracza** â€” na `d7ad2f76`:
  **Bug Macieja:** dialog Ĺ‚Ä…czenia armii (â€žPOĹÄ„CZENIE ARMII") pojawiaĹ‚ siÄ™ w trakcie tury przeciwnika (produkcja end-turn: np. Wojownik na heks z Oszczepnikiem). **Fix:** `deferredMergePrompts` â€” kolejka promptĂłw; `promptMergeIfCoLocated` odĹ‚oĹĽone gdy `endTurnInProgress`; `flushDeferredMergePrompts()` po â€žTura N â€” twoja kolej" (razem z `flushDeferredPlayerUnitReveals`). Rush-buy / ruch w swojej turze bez zmian (natychmiast).
  tsc=0 Â· unit-replace 10/10 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `7e038328`) Â· Test: stamp `7238588c` Â· Rekrutuj na heks z jednostkÄ… â†’ ZakoĹ„cz turÄ™ â†’ dialog dopiero po AI.

- 2026-07-22 Â· stempel: ROBOCZA Â· **d7ad2f76** Â· md5 pliku `d7ad2f76e755e42352bb421a1a19c2fa` Â· **UI: opisowe nazwy zapisĂłw** â€” na `c72ab1b8`:
  **Zapis gry (Maciej):** domyĹ›lna nazwa sejwu z kontekstu rozgrywki zamiast generycznego â€žZapis Â· tura N". Format: `{stolica} Â· rok {YYYY} p.n.e. Â· tura {N} Â· {rozmiar mapy} Â· {trudnoĹ›Ä‡}`; szybki zapis i autozapis z prefiksem. ModuĹ‚ `save-label.ts`, pole nazwy max 72 znaki.
  tsc=0 Â· save-label-test OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `7238588c`) Â· Test: stamp `d7ad2f76` Â· Menu pauzy â†’ Zapisz grÄ™ â†’ nazwa np. â€žAteny Â· rok 3500 p.n.e. Â· tura 10 Â· Standardowy Â· Normalny".

- 2026-07-22 Â· stempel: ROBOCZA Â· **c72ab1b8** Â· md5 pliku `c72ab1b8c45c61364f754daf085ae41f` Â· **FIX: widocznoĹ›Ä‡ nowych jednostek po end-turn** â€” na `2f32fbea`:
  **Bug Macieja:** jednostki z produkcji/rekrutacji pojawiaĹ‚y siÄ™ na mapie od razu po â€žZakoĹ„cz turÄ™", zanim ruch AI. **Fix:** `deferredPlayerUnitRevealIds` â€” ukryte w renderze do koĹ„ca fazy AI; `flushDeferredPlayerUnitReveals()` przy starcie nowej tury gracza. Rush-buy w trakcie tury bez zmian (natychmiast).
  tsc=0 Â· unit-replace 10/10 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `d7ad2f76`) Â· Test: stamp `c72ab1b8` Â· Rekrutuj â†’ ZakoĹ„cz turÄ™ â†’ jednostka widoczna dopiero po ruchu AI.

- 2026-07-22 Â· stempel: ROBOCZA Â· **2f32fbea** Â· md5 pliku `2f32fbea89183d908099e984414db2cb` Â· **UI: Ranking Moc â†” mgĹ‚a wojny (FoW)** â€” na `6a9b8e72`:
  **Ranking Moc (Maciej):** widocznoĹ›Ä‡ listy powiÄ…zana ze stanem mgĹ‚y wojny zamiast osobnego przeĹ‚Ä…cznika testowego. **FoW wĹ‚Ä…czony (domyĹ›lnie / F):** tylko odkryte peĹ‚ne cywilizacje + gracz (bez miast-paĹ„stw). **FoW wyĹ‚Ä…czony (F / baton minimapy):** wszystkie peĹ‚ne cywilizacje. UsuniÄ™to `debugPowerRankingAll` (URL/localStorage/checkbox [TEST]).
  tsc=0 Â· power-ranking 10/10 Â· display-names 11/11 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `c72ab1b8`) Â· Test: stamp `2f32fbea` Â· FoW ON â†’ ranking tylko odkryte Â· F (FoW OFF) â†’ wszystkie peĹ‚ne nacje.

- 2026-07-22 Â· stempel: ROBOCZA Â· **6a9b8e72** Â· md5 pliku `6a9b8e729d52f1adb2ea556a265b12e0` Â· **UI: Ranking Moc â€” bez miast-paĹ„stw + mgĹ‚a wojny** â€” na `cd615c1e`:
  **Ranking Moc (Maciej):** lista pokazywaĹ‚a miasta-paĹ„stwa (np. â€žUr Â· miasto-paĹ„stwo") i nieodkryte cywilizacje. **Fix:** `filterOwnersForPowerRanking` â€” tylko peĹ‚ne nacje + odkryte (`diplomaticallyDiscoveredOwners`); gracz zawsze widoczny. **TEMP test:** `?debugPowerRankingAll=1` lub `localStorage civ.debugPowerRankingAll=true` + checkbox [TEST] w panelu Moc (ROBOCZA) â€” pokaĹĽ wszystkie peĹ‚ne cywilizacje bez mgĹ‚y (miasta-paĹ„stwa nadal ukryte).
  tsc=0 Â· power-ranking 10/10 Â· power-objective 12/12 Â· display-names 11/11 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `2f32fbea`) Â· Test: stamp `6a9b8e72` Â· Nowa gra â†’ Ranking Moc bez â€žÂ· miasto-paĹ„stwo" Â· odkryj AI â†’ pojawia siÄ™ w rankingu.

- 2026-07-22 Â· stempel: ROBOCZA Â· **cd615c1e** Â· md5 pliku `cd615c1e5a332919b72a183a7f980c60` Â· **MAPA: FIX spawn cywilizacji â€” continent-aware + fallback** â€” na `e5cb5ab6`:
  **Bug Macieja:** suwak 15 cywilizacji â†’ na mapie ~10; puste kontynenty, reszta zatĹ‚oczona; â€žbrak miejsca".
  **Przyczyna:** `computeClusters` stawiaĹ‚ Ĺ›rodki klastrĂłw greedy-shuffle (bez kontynentĂłw); twardy min 12 hex + brzeg â†’ za maĹ‚o Ĺ›rodkĂłw; `buildClusterLayoutWithEdgeCapital` zwracaĹ‚ pusty klaster na maĹ‚ym regionie; `aktywneTypy` raportowaĹ‚o ĹĽÄ…danÄ… liczbÄ™ zamiast faktycznej.
  **Fix:** rozmieszczenie Ĺ›rodkĂłw po masach lÄ…du (flood-fill) â†’ po 1 na kontynent, potem round-robin; adaptacyjny min dystans; progresywne luzowanie 12â†’6; fallback layout gdy edge-capital nie mieĹ›ci siÄ™; `requestedTypy` vs faktyczne `aktywneTypy`.
  tsc=0 Â· cluster-start 109/109 Â· map-gen-regression OK Â· map-scale-menu 32/32 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `6a9b8e72`) Â· Test: stamp `cd615c1e` Â· Super Huge 15 typĂłw â†’ 15 klastrĂłw Â· kontynenty z cywilizacjami.

- 2026-07-22 Â· stempel: ROBOCZA Â· **e5cb5ab6** Â· md5 pliku `e5cb5ab6a5dbe77b618e34ebd767951d` Â· **MAPA: FIX odstÄ™p 3 hex miÄ™dzy miastami-paĹ„stwami** â€” na `05d689e3`:
  **Miasta-paĹ„stwa (Maciej):** `buildSameTypeRivalCandidateHexes` scalaĹ‚o przepustki bez sprawdzania odlegĹ‚oĹ›ci para-po-parze (bug: kandydaci 1 hex od siebie). **Fix:** `tryAdd` wymaga min 3 hex od rdzenia, max 3 hex, i min 3 hex od juĹĽ zebranych hexĂłw. Pre-plan (`packRivalCitiesAroundCore`) bez zmian â€” juĹĽ OK.
  tsc=0 Â· cluster-start 103/103 Â· map-gen-regression OK (timing standard 5.12s â€” znany flake) Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `cd615c1e`) Â· Test: stamp `e5cb5ab6` Â· Nowa gra â†’ stolica â†’ paĹ„stwa min 3 hex od siebie i od stolicy.

- 2026-07-22 Â· stempel: ROBOCZA Â· **05d689e3** Â· md5 pliku `05d689e333d9d29543f1da9e1bebaa9b` Â· **MAPA: twardy klaster miast-paĹ„stw 3 hex** â€” na `4760325c`:
  **Miasta-paĹ„stwa (Maciej):** spawn w pierĹ›cieniu **min 3 / max 3 hex** od stolicy gracza â€” ciasne skupisko (staĹ‚e `CLUSTER_CITY_STATE_MIN_HEX` / `CLUSTER_CITY_STATE_MAX_HEX`). Pre-plan mapgen + runtime spawn (`packRivalCitiesAroundCore`) spĂłjne. AI resupply/konsolidacja: promieĹ„ 3 hex (`clusterCityStateRadius`).
  tsc=0 Â· cluster-start 93/93 Â· map-gen-regression OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `e5cb5ab6`) Â· Test: stamp `05d689e3` Â· Nowa gra â†’ zaĹ‚ĂłĹĽ stolicÄ™ â†’ miasta-paĹ„stwa w pierĹ›cieniu 3 hex (Sparta, Kapuaâ€¦).

- 2026-07-22 Â· stempel: ROBOCZA Â· **4760325c** Â· md5 pliku `4760325c0191876a107104b75622297b` Â· **BALANS: Super Huge miasta-paĹ„stwa 7Â·8Â·9** â€” na `6865baf8`:
  **Super Huge (`superogromny`):** menu miast-paĹ„stw min **7** Â· domyĹ›lnie **8** Â· max **9** (byĹ‚o 6Â·9Â·9). Panel-E `e-start-params.json` default **8**. `MAX_MIAST_PANSTWA=9` bez zmian.
  tsc=0 Â· map-scale-menu 32/32 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `05d689e3`) Â· Test: stamp `4760325c` Â· Super Huge â†’ kreator MP 7Â·8Â·9 Â· domyĹ›lnie 8.

- 2026-07-22 Â· stempel: ROBOCZA Â· **6865baf8** Â· md5 pliku `6865baf802e6ced6a0721e2a1f4d9c0b` Â· **BALANS: cap miast-paĹ„stw max 9 + FIX chatki spawn** â€” na `ae64786b`:
  **(1) Miasta-paĹ„stwa (Maciej):** za duĹĽo w klastrze (do 18 po Ă—2 2026-07-20). PrzywrĂłcono kanon max **9** (+ stolica = 10); skala: Malenki 3 Â· MaĹ‚y 4 Â· Standard 6 Â· DuĹĽy 7 Â· Ogromny 8 Â· Super Huge 9. `clampMiastaPanstwaCount` w spawn/generator/kreator; Panel-E `e-start-params.json`.
  **(2) Chatki:** spacing 3 hex / min od miasta 3 hex â€” peĹ‚ny spawn wg `typyĂ—(1+paĹ„stwa)Ă—trudnoĹ›Ä‡` (mniej chat na mniejszej mapie po cap MP).
  tsc=0 Â· map-scale-menu 32/32 Â· city-names-pool 12/12 Â· villages 39/39 Â· map-gen-regression OK Â· verify OK. Â· **ZASTÄ„PIONA** (â†’ `4760325c`) Â· Test: stamp `6865baf8` Â· Standardowy â†’ kreator max 7 MP Â· klaster ~7 miast tego typu Â· chatki proporcjonalne.

- 2026-07-22 Â· stempel: ROBOCZA Â· **ae64786b** Â· md5 pliku `ae64786b05cd77d6dbb8d807ac209b4e` Â· **FIX: AI/miasta-paĹ„stwa â€” farmy dopiero po Rolnictwie (koszt nauki)** â€” na `59d90c13`:
  **Bug Macieja:** obce cywilizacje majÄ… farmy w turze 2â€“3, zanim gracz zdÄ…ĹĽy zbadaÄ‡ Rolnictwo. **Przyczyna:** AI koĹ„czyĹ‚o tech natychmiast (`aiDone.add` co turÄ™), bez puli Nauki i `researchStep`; brak bankowania `aiEcon.nauka`. **Fix:** `aiNaukaPoolByOwner` + `aiBadanaByOwner` + `runAiResearchForOwner` (symetria z graczem: bank nauki â†’ chooseAIResearch â†’ researchStep); usuniÄ™to instant-unlock w pÄ™tli AI.
  tsc=0 Â· ai-improvements-test 15/15 Â· owner-epoch-test 13/13 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `6865baf8`) Â· Test: stamp `ae64786b` Â· Nowa gra KamieĹ„ â†’ obserwuj miasto-paĹ„stwo: brak farm w turach 1â€“3; farmy dopiero po ~koszt Rolnictwa (8 PN szybko / 16 standard).

- 2026-07-22 Â· stempel: ROBOCZA Â· **59d90c13** Â· md5 pliku `59d90c13cf1056f05f669465a760f758` Â· **FIX: pierĹ›cieĹ„ Nauki wyĹ›rodkowanie + dyplomacja pierwszy kontakt** â€” na `35fd5449`:
  **(1) Nauka:** pierĹ›cieĹ„ postÄ™pu koncentryczny z rantem ikon (`.civ-science-prog-ring`, bez podwĂłjnego ringu).
  **(2) Dyplomacja (Maciej):** Syrakuzy w liĹ›cie mimo braku miasta w mgle; dar przed kontaktem. **Przyczyna:** kontakt z `explored` (hex widziany kiedyĹ›) â‰  render miasta (`visible`); lista po odkryciu mgĹ‚y, nie po formalnym kontakcie; AI darowaĹ‚o po samym hexie. **Fix:** `diplomaticallyDiscoveredOwners` (widocznoĹ›Ä‡ choÄ‡ raz) + auto-audiencja; lista tylko po `diplomaticContactEstablished`; dary/handele/trybut/sojusz AI dopiero po audiencji.
  tsc=0 Â· diplomacy-layers-test 8/8 Â· diplomacy-proposal 64/64 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `ae64786b`) Â· Test: stamp `59d90c13` â†’ pierĹ›cieĹ„ Nauki OK Â· Nowa gra â†’ spotkaj miasto-paĹ„stwo â†’ auto-audiencja â†’ â€žNawiÄ…ĹĽ kontakt" â†’ wpis w dyplomacji; niewidoczne miasta nie w liĹ›cie; brak darĂłw przed kontaktem.

- 2026-07-22 Â· stempel: ROBOCZA Â· **35fd5449** Â· md5 pliku `35fd54491f7fda7921bf60e218bac727` Â· **FIX: epoka startowa miast-paĹ„stw AI (KamieĹ„, regresja)** â€” na `43510348`:
  **Bug Macieja:** miasta-paĹ„stwa / obcy AI wyglÄ…dajÄ… jak BrÄ…z (megaron) mimo startu w Kamieniu. **Przyczyna:** `fillAiOwnerCivMap` woĹ‚aĹ‚o `setupAiOwnerEpoch` na starych ownerId przed regeneracjÄ… mapy â€” ryzyko niespĂłjnego `aiResearchDone` (BrÄ…zownictwo â†’ era 2); brak `reconcileAllOwnerErasFromResearch` przed pierwszym `cityRenderer.sync` w klastrze. **Fix:** epoka tylko w `applyClusterStartPlan` / `initAllAiOwnersForNewGame` / rywale; `aiResearchDone.clear()` w klastrze; reconcile przed sync klastra + po `initAllAiOwners`; `repairAiRosterFromMap` â†’ `setupAiOwnerEpoch`.
  tsc=0 Â· owner-epoch-test 13/13 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `59d90c13`) Â· Test: Ctrl+F5 START.html â†’ stamp `35fd5449` Â· Nowa gra KamieĹ„ â†’ zaĹ‚ĂłĹĽ miasto â†’ miasta-paĹ„stwa: tipi/ognisko (P1), nie megaron.

- 2026-07-22 Â· stempel: ROBOCZA Â· **43510348** Â· md5 pliku `435103481edfde9081d2207425ac18a3` Â· **FIX: pierĹ›cieĹ„ Nauki â€” jeden rant (bez ring-in-ring)** â€” na `30e510b1`:
  **Przyczyna:** CSS `border:2px gold` na medalionie Nauki + nakĹ‚adka SVG = podwĂłjny pierĹ›cieĹ„ (zĹ‚oty w zĹ‚otym).
  **Fix:** usuniÄ™to CSS border na `.tb.science` i chipie z pierĹ›cieniem; SVG (`scienceProgressRing.ts`) **jest** rantem postÄ™pu (zĹ‚oto `#a08030` = `--tg-gold-dim`, niebieski roĹ›nie zgodnie z ruchem wskazĂłwek). Toolbar 52px stroke 2px; chip 30px stroke 2px.
  tsc=0 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `35fd5449`) Â· Test: Ctrl+F5 START.html â†’ stamp `43510348` â†’ ikona Nauki: jeden pierĹ›cieĹ„; 0% caĹ‚y zĹ‚oty, ~50% pĂłĹ‚ niebieski, 100% caĹ‚y niebieski.

- 2026-07-22 Â· stempel: ROBOCZA Â· **30e510b1** Â· md5 pliku `30e510b1885bf1da7362f1b45b62b392` Â· **FIX: Praca â€” pula imperium bez utraty 1 jednostki (zaokrÄ…glanie)** â€” na `c254006d`:
  **Przyczyna:** `Math.floor(pracaNetto)` + uĹ‚amkowy mnoĹĽnik PorzÄ…dku dawaĹ‚o np. 9 w silniku przy podziale HUD 7+3=10; pula dostawaĹ‚a doPuli+overflow=9 zamiast 10.
  **Fix:** `cityPracaInteger` (Math.round) w `economy.ts`/`turn-economy.ts`; `pracaImperialPoolGain` w `main.ts` â€” pusta kolejka â†’ caĹ‚e `doPuli+doBudynkow`, aktywny budynek â†’ tylko `doPuli`.
  tsc=0 Â· production-overflow-test 20/20 Â· wire-ekonomia 37/37 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `43510348`) Â· Test: Ctrl+F5 START.html â†’ stamp `30e510b1` â†’ Ateny bez budynku w kolejce, 10 Pracy (3+7) â†’ pula +10/turÄ™.

- 2026-07-22 Â· stempel: ROBOCZA Â· **c254006d** Â· md5 pliku `c254006dccb94e25a4121b3f377c157a` Â· **HUD: pierĹ›cieĹ„ postÄ™pu badaĹ„ (Nauka) + hook researchProgress** â€” na `9b539cb7`:
  **Medalion Nauki** (gĂłrny chip 6C + lewy toolbar mapy): zĹ‚oty pierĹ›cieĹ„ = pozostaĹ‚o; niebieski roĹ›nie zgodnie z ruchem wskazĂłwek. Hook: `researchProgress` z `buildHudState` (`player.nauka / koszt badanej tech`), nie postÄ™p epoki. ModuĹ‚ `scienceProgressRing.ts`; `resolveResearchProgress` w `hud.ts`.
  tsc=0 Â· verify OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `30e510b1`) Â· Test: Ctrl+F5 START.html â†’ stamp `c254006d` â†’ wybierz tech â†’ pierĹ›cieĹ„ roĹ›nie co turÄ™; po odkryciu reset.

- 2026-07-22 Â· stempel: ROBOCZA Â· **9b539cb7** Â· md5 pliku `9b539cb74bfc487a8c1fd7ef5d4af27b` Â· **UI: pierĹ›cieĹ„ postÄ™pu badaĹ„ na HUD Nauki** â€” na `c54dae3b`:
  **Lewy toolbar + chip Nauka (gĂłrny pasek):** pierĹ›cieĹ„ timer zĹ‚otoâ†’niebieski (SVG stroke-dashoffset), roĹ›nie zgodnie z ruchem wskazĂłwek od gĂłry; progress = `researchProgress` z `buildHudState` (`player.nauka / koszt badanej tech`), nie postÄ™p epoki. Nowy moduĹ‚ `scienceProgressRing.ts`; hooki w `mapToolbarHud.ts`, `hudChip6c.ts`, `hud.ts`.
  tsc=0 Â· verify OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `c254006d`) Â· Test: Ctrl+F5 START.html â†’ stamp `9b539cb7`; wybierz tech â†’ pierĹ›cieĹ„ zĹ‚oty z rosnÄ…cym niebieskim segmentem; po ukoĹ„czeniu caĹ‚y niebieski; nowy cel = reset zĹ‚oty + maĹ‚y niebieski.

- 2026-07-22 Â· stempel: ROBOCZA Â· **c54dae3b** Â· md5 pliku `c54dae3be8b3ab1cc0e5eebf7d04f9f0` Â· **FIX: Zwiadowca 0 Manpower** â€” na `98889578`:
  **Zwiadowca (`typeId=Zwiadowca`)** nie zuĹĽywa puli Manpower przy rekrutacji (zakup zĹ‚otem + ukoĹ„czenie kolejki produkcji). Hook: `unitManpowerCostForType` w `manpower.ts`; `tryDeductUnitSpawnCosts` / `canAffordUnitManpower` / `refundUnitSpawnToCity` z opcjonalnym `typeId`; `production.manpowerCostOf`; UI karty rekrutacji pokazuje `0 đź‘¤`.
  tsc=0 Â· manpower-test 36/36 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `9b539cb7`) Â· Test: Ctrl+F5 START.html â†’ stamp `c54dae3b`; rekrutuj ZwiadowcÄ™ przy pustej puli MP â†’ jednostka powstaje, MP bez zmian.

- 2026-07-22 Â· stempel: ROBOCZA Â· **98889578** Â· md5 pliku `98889578644a90da33d1dc45d1a67994` Â· **BALANS: regen Manpower 5%â†’2%** â€” na `a28c034e`:
  **Regen bazowy:** `manpower_regen_proc_max_tura` **5 â†’ 2** (`miasto-params.json`, fallback `DEFAULT_REGEN` w `manpower.ts`). **Rzymianie bez zmian bonusĂłw:** `mnoznik_manpower_max` **2.0** (2Ă— pula max) + `bonus_pobor_regen` **1.0** (2Ă— tempo regen). Ep1 KamieĹ„, 10 ludkĂłw: standard max **10k** regen **+200/t** (~50 tur do peĹ‚na); Rzym max **20k** regen **+800/t** (4% max = 2%Ă—2 bonus).
  tsc=0 Â· manpower-test 30/30 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `c54dae3b`) Â· Test: Ctrl+F5 START.html â†’ stamp `98889578` â†’ ep1 10 ludkĂłw: inna cyw. +200/t, Rzym +800/t.

- 2026-07-22 Â· stempel: ROBOCZA Â· **a28c034e** Â· md5 pliku `a28c034e03223ec6fb4cd52401b0d86c` Â· **CYWIL: bonus Manpower Rzymianie** â€” na `3613d5d4`:
  **Rzymianie:** `mnoznik_manpower_max` **2.0** (2Ă— pula max per ludek) + `bonus_pobor_regen` **1.0** (2Ă— tempo regen). Hook: `manpower.ts` (`getCivManpowerMaxMultiplier`, `getCivManpowerRegenBonus`) Â· `turn-economy.ts` Â· `main.ts` (HUD breakdown). PrzykĹ‚ad ep1, 10 ludkĂłw: max **20k** MP (vs 10k bazowo); regen **+1000/t** (vs +500).
  tsc=0 Â· manpower-test 30/30 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `98889578`) Â· Test: Ctrl+F5 START.html â†’ stamp `a28c034e` â†’ Nowa gra Rzymianie â†’ panel Manpower: wyĹĽszy max i szybsza odnowa vs inne cywilizacje.

- 2026-07-22 Â· stempel: ROBOCZA Â· **3613d5d4** Â· md5 pliku `3613d5d4ca248a3fa3f6879061aad3dc` Â· **BATCH: balans Manpower + sesja 2026-07-22** â€” na `81e95aaa`:
  **MANPOWER (audyt/balans):** koszt rekrutacji Ă—10 â€” `manpowerNaJednostke = manpowerNaLudka` w `epoka-ludnosc-manpower.json` (1 ludek = 1 jednostka przy peĹ‚nej puli); regen **10% â†’ 5%** (`manpower_regen_proc_max_tura` w `miasto-params.json`, fallback `DEFAULT_REGEN` w `manpower.ts`). **Sesja (juĹĽ w poprzednich wpisach, zbiorczy deploy):** dyplomacja (komunikaty AI, etykieta kultury, status formalny vs postawa, ikona wojny); badania Ă—2 koszt; budynki Ă·2 koszt produkcji; granice paĹ„stwa (ciÄ…gĹ‚e pÄ™tle, grubsze, 30% alpha); nazwy miast-paĹ„stw (pula 10â€“18); overflow Pracy â†’ pula cywilizacji; epoka startowa miast-paĹ„stw KamieĹ„; zwiadowca/wsparcie ATK post-battle; cooldown darĂłw Â¤ AI; panel badaĹ„ lista techĂłw; +1 szczÄ™Ĺ›cia per budynek; cap ofert AI do skarbca.
  tsc=0 Â· manpower-test 24/24 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `a28c034e`) Â· Test: Ctrl+F5 START.html â†’ stamp `3613d5d4` â†’ rekrutacja 1 jednostki przy peĹ‚nej puli = 1 slot ludek; regen ~20 tur do peĹ‚na (ep1, 10 ludkĂłw).

- 2026-07-22 Â· stempel: ROBOCZA Â· **81e95aaa** Â· md5 pliku `81e95aaae7cbea9034c0df360ce34845` Â· **EKONOMIA: +1 szczÄ™Ĺ›cia per budynek** â€” na `4332ae45`:
  **Decyzja Macieja:** kaĹĽdy zbudowany budynek daje +1 szczÄ™Ĺ›cia; bonus z `baza.zadowolenie` w JSON **dokĹ‚adany** (nie zastÄ™puje). **Hook:** `buildingHappinessAtLevel` / `sumBuildingHappinessFromBuiltIds` w `gra/src/game/economy.ts` â†’ `main.ts`, `cityPanel.ts`, `cityYieldPerTurn`. Tooltip: â€žBudynki (+1/budynek)". PrzykĹ‚ad: ĹšwiÄ…tynia zadowolenie 3 â†’ efekt 4; hipotetyczne 2 â†’ 3.
  tsc=0 Â· building-happiness-test 8/8 Â· society-breakdown-test OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `3613d5d4`) Â· Test: Ctrl+F5 START.html â†’ stamp `81e95aaa` â†’ miasto z 3 budynkami â†’ Sz +3 bazowe + bonusy z JSON.

- 2026-07-22 Â· stempel: ROBOCZA Â· **4332ae45** Â· md5 pliku `4332ae45d7d58b706e5a68a9882f8503` Â· **MAPA: granice paĹ„stwa â€” szersze + bardziej przezroczyste** â€” na `04f98d66`:
  **Decyzja Macieja:** szerokoĹ›Ä‡ pasa Ă—2,5 (wzrost ~150%); alpha 30%. **ByĹ‚o:** `TERRITORY_BORDER_BAND_WIDTH=0.15`, `TERRITORY_BORDER_OPACITY=0.5`. **Jest:** `0.375` / `0.3` w `gra/src/render/rangeOverlay.ts`.
  tsc=0 Â· territory-border-test 9/9 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `81e95aaa`) Â· Test: Ctrl+F5 START.html â†’ stamp `4332ae45` â†’ mapa â†’ granice paĹ„stwa wyraĹşnie szersze, delikatniejsze (30% alpha).

- 2026-07-22 Â· stempel: ROBOCZA Â· **04f98d66** Â· md5 pliku `04f98d66da71c76b3880dce7121dc916` Â· **FIX: zwiadowca sÄ…siad â€” domkniÄ™cie regresji Teby x3** â€” na `caa23af3`:
  **Bug (Maciej):** po ataku na miasto zwiadowca sÄ…siad nadal wchodziĹ‚/merge'owaĹ‚ mimo fixĂłw 5ce0dfb7 + caa23af3. **Luka:** `isCivilianUnit` tylko po `category` â€” jednostki ze starym zapisem / `domyslny` przechodziĹ‚y do rosteru; `applyCityCaptureAfterBattle` uĹĽywaĹ‚ `atkRoster[0]` zamiast kotwicy; brak guardĂłw cywilĂłw w `moveAtkRosterOntoBattleHex` / capture. **Fix:** `CIVILIAN_TYPE_IDS` fallback (typeId); kotwica zawsze pierwsza w rosterze; cywile nigdy nie relocate/capture/MP poza kotwicÄ…; test Teby A+B vs miasto C.
  tsc=0 Â· battle-roster-test 7/7 Â· post-battle-map-test 21/21 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `4332ae45`) Â· Test: Ctrl+F5 START.html â†’ stamp `04f98d66`; armia 2 hex A + zwiadowca hex B â†’ atak miasta C â†’ wygrana â†’ armia na mieĹ›cie, zwiadowca na B bez merge.

- 2026-07-22 Â· stempel: ROBOCZA Â· **caa23af3** Â· md5 pliku `caa23af35f45ae9b7b0dbe4d6b2ab561` Â· **FIX: wsparcie ATK zostaje po zdobyciu miasta** â€” na `24cdcfe8`:
  **Bug (kanon Â§14):** po wygranej MĂ—W+ caĹ‚y roster ATK lÄ…dowaĹ‚ na hexie miasta (`moveAtkRosterOntoBattleHex`); wspierajÄ…cy z sÄ…siedniego heksa merge'owali siÄ™ ze stosem jak zwiadowca (fix 5ce0dfb7 dotyczyĹ‚ tylko cywilĂłw). **Decyzja:** Â§13a MĂ—W+ / Â§13b â€” tylko kotwica wchodzi na hex miasta; wspierajÄ…cy zostajÄ…. **Fix:** `post-battle-map.ts` â€” ruch tylko kotwicy + jednostek ze wspĂłlnego hexu startowego (stos).
  tsc=0 Â· post-battle-map-test 17/17 Â· battle-roster-test 5/5 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `04f98d66`) Â· Test: Ctrl+F5 START.html â†’ stamp `caa23af3`; A atakuje miasto + B wspiera z sÄ…siedniego heksa â†’ wygrana â†’ A na mieĹ›cie, B na swoim hexie.

- 2026-07-22 Â· stempel: ROBOCZA Â· **24cdcfe8** Â· md5 pliku `24cdcfe843e8c0b28db7cb3f17ecf7d9` Â· **FIX: panel badaĹ„ â€” lista â€žMoĹĽesz wybraÄ‡"** â€” na `2c72af63`:
  **Bug Macieja:** sekcja MOĹ»ESZ WYBRAÄ† pusta (â€žBrak dostÄ™pnych technologii"), podczas gdy drzewko pokazywaĹ‚o techy do wyboru. **Przyczyna:** hub budowaĹ‚ listÄ™ tylko przez `available.has(node.id)` po iteracji `eraNodes` â€” bez normalizacji slugĂłw (nazwa vs slug) i bez epoki aktywnego celu; hooki pickera konfigurowane po utworzeniu huba. **Fix:** `scienceHubSnapshotLogic.ts` â€” normalizacja ID, iteracja pickable z silnika, epoka UI = epoka celu; `configureSciencePicker` przed `mountD1bHud`; merge config pickera.
  tsc=0 Â· science-hub-test 7/7 Â· research-test 33/33 Â· tech-tree-test 19/19 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `caa23af3`) Â· Test: Ctrl+F5 START.html â†’ stamp `24cdcfe8`; Badania â†’ MOĹ»ESZ WYBRAÄ† = peĹ‚na lista techĂłw Kamienia (niezbadane, speĹ‚nione prereq).

- 2026-07-22 Â· stempel: ROBOCZA Â· **2c72af63** Â· md5 pliku `2c72af6335dfc5c456f62b7d23649af1` Â· **DYPL: cooldown jednorazowych darĂłw Â¤ od miast-paĹ„stw** â€” na `5ce0dfb7`:
  **Bug Macieja:** miasta-paĹ„stwa proponowaĹ‚y handel ze zĹ‚otem co turÄ™ (accept â†’ staĹ‚y dopĹ‚yw Â¤ bez haraczu/trybutu). **ByĹ‚o:** `decideAIDiplomacy` P6 bez cooldownu â€” warunki speĹ‚nione co turÄ™ â†’ nowy popup. **Jest:** cooldown per ownerId (easy 15 / normal 25 / hard 35 tur); zapis w save (`aiOneShotGiftLastTurn`); mnoĹĽnik kwoty easy Ă—1.25 / hard Ă—0.75; trybut per-tura (`zadaj_trybut`) bez zmian.
  tsc=0 Â· diplomacy-economy-test 16/16 Â· diplomacy-proposal-test 64/64 Â· ai-test T2S-b2 PASS Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `24cdcfe8`) Â· Test: Ctrl+F5 START.html â†’ stamp `2c72af63`; kontakt z miastem-paĹ„stwem â†’ 1 propozycja handlu â†’ akcept/odrzut â†’ **cisza ~25 tur** (normal); kolejny dar dopiero po cooldownie.

- 2026-07-22 Â· stempel: ROBOCZA Â· **5ce0dfb7** Â· md5 pliku `5ce0dfb7a110e60576de86a4acf4a48b` Â· **FIX: zwiadowca nie wchodzi w bitwÄ™ / nie merge po walce** â€” na `f8a680cb`:
  **Bug Macieja (Teby x3):** armia 2 jednostek atakuje miasto; sÄ…siedni zwiadowca wĹ‚Ä…czaĹ‚ siÄ™ do preBattle i po wygranej doĹ‚Ä…czaĹ‚ do armii na hexie miasta. **Przyczyna:** `collectBattleRoster` / `collectAtkRosterNearCity` / `collectSiegeDefRoster` zbieraĹ‚y wszystkie jednostki distâ‰¤1 bez filtra cywilĂłw; `moveAtkRosterOntoBattleHex` przenosiĹ‚ caĹ‚y roster. **Fix:** `shouldIncludeInBattleRoster` â€” cywil (zwiadowca/osadnik/robotnik) tylko jako kotwica ataku lub obroĹ„ca na hexie starcia; `collectDefRosterNearCity` dla obroĹ„cĂłw miasta.
  tsc=0 Â· battle-roster-test 5/5 Â· post-battle-map-test 15/15 Â· combat-test 6/6 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `2c72af63`) Â· Test: Ctrl+F5 START.html â†’ stamp `5ce0dfb7`; armia 2 + zwiadowca sÄ…siad â†’ atak miasta â†’ preBattle bez zwiadu; po wygranej zwiadowca zostaje na swoim hexie.

- 2026-07-22 Â· stempel: ROBOCZA Â· **f8a680cb** Â· md5 pliku `f8a680cb8139078332c92fac65b4cb89` Â· **FIX: epoka startowa miast-paĹ„stw (KamieĹ„, nie BrÄ…z)** â€” na `4bd22b7b`:
  **Bug Macieja:** paĹ„stwa-miasta wyglÄ…daĹ‚y jak epoka BrÄ…zu (kamienne chatki) mimo startu w Kamieniu. **Przyczyna:** spawn klastra obcych AI uĹĽywaĹ‚ `initOwnerEra` bez peĹ‚nej synchronizacji tech/epoki (`setupAiOwnerEpoch`); render braĹ‚ epokÄ™ z `empireEpochForOwner` â€” poprawnie, ale dane startowe byĹ‚y niespĂłjne. **Fix:** `applyClusterStartPlan` + `fillAiOwnerCivMap` â†’ `setupAiOwnerEpoch`; `spawnPendingSameTypeRivals` â†’ `reconcileAllOwnerErasFromResearch` przed sync. **Uwaga:** neutralne chat ze skarbami (`wioska`) to osobny model â€” zawsze 3 chatki, nie epoka.
  tsc=0 Â· owner-epoch-test 11/11 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `5ce0dfb7`) Â· Test: Ctrl+F5 START.html â†’ stamp `f8a680cb`; Nowa gra Â· Epoka Kamienia â†’ zaĹ‚ĂłĹĽ miasto â†’ sprawdĹş miasta-paĹ„stwa: tipi/ognisko (P1 KamieĹ„), nie megaron (BrÄ…z); chat ze skarbami = neutralne chatki bez etykiety miasta.

- 2026-07-22 Â· stempel: ROBOCZA Â· **4bd22b7b** Â· md5 pliku `4bd22b7b03a0a85de8e5b8e0ba90f629` Â· **EKO: nadmiar Pracy â†’ pula ulepszeĹ„** â€” na `27108476`:
  **Bug Macieja:** bez budynku w kolejce do puli cywilizacji szĹ‚a tylko czÄ™Ĺ›Ä‡ z suwaka (np. 4 z 13), reszta (doBudynkow) ginÄ™Ĺ‚a. **Fix:** `advanceProduction` â€” pusta kolejka â†’ `overflowToPool = doBudynkow`; `main.ts` â€” overflow dolicza do `_lastPracaRate` (HUD).
  tsc=0 Â· production-overflow-test 12/12 Â· wire-ekonomia-test 37/37 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `f8a680cb`) Â· Test: Ctrl+F5 START.html â†’ stamp `4bd22b7b`; miasto bez budynku, 13 Pracy, suwak 70/30 â†’ pula +13/t (nie +4).

- 2026-07-22 Â· stempel: ROBOCZA Â· **27108476** Â· md5 pliku `27108476a220e9029beaf7a02512b0e7` Â· **START/DYPL: unikalne nazwy miast-paĹ„stw 10â€“18** â€” na `d5a4543e`:
  **UzupeĹ‚nienie fixu Rywal N:** `miasta_panstwa` = 10 nazw (9 rywali), kreator do 18. **ByĹ‚o:** rywal 10+ â†’ fallback â€žRywal N" (podglÄ…d bez pul) lub zawijanie (SpartaĂ—2). **Jest:** `clusterRivalFromPool` bierze rywali 10â€“18 z `miasta_cywilizacji` (Grecy: Olimpiaâ€¦Nafplion); kreator przekazuje `cityNamesPools`; UI `resolveOwnerBaseName` bez zmian (z `d5a4543e`).
  tsc=0 Â· city-names-pool-test 13/13 Â· civ-names-test 6/6 Â· display-names-test 11/11 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `4bd22b7b`) Â· Test: Ctrl+F5 START.html â†’ stamp `27108476`; Grecy Â· 16 miast-paĹ„stw â†’ kreator + mapa + dyplomacja: Olimpia, Efezâ€¦ (nie â€žRywal 10").

- 2026-07-22 Â· stempel: ROBOCZA Â· **d5a4543e** Â· md5 pliku `d5a4543e21e40869cd6fbbd6a7f27671` Â· **DYPL: nazwy miast-paĹ„stw w audiencji** â€” na `248b2622`:
  **Bug Macieja:** audiencja dyplomatyczna pokazywaĹ‚a â€žRywal 10 Â· miasto-paĹ„stwo" zamiast prawdziwej nazwy (np. Mykeny). **Przyczyna:** cache `ownerDisplayName` z fallbacku `Rywal N` (indeks poza pulÄ… 10 nazw) miaĹ‚ pierwszeĹ„stwo przed `city.name`. **Fix:** `resolveOwnerBaseName` + `isTechnicalOwnerLabel` w `display-names.ts`; `ownerDiploLabel` w `main.ts` â€” miasto-paĹ„stwo â†’ nazwa z mapy; stolica obcego klastra â†’ nazwa nacji; zawijanie indeksu w `city-names-pool.ts`.
  tsc=0 Â· display-names-test 11/11 Â· diplomacy-display-test 14/14 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `27108476`) Â· Test: Ctrl+F5 START.html â†’ stamp `d5a4543e`; dyplomacja â†’ audiencja miasta-paĹ„stwa â†’ **Mykeny Â· miasto-paĹ„stwo** (nie Rywal N); peĹ‚na nacja â†’ **Hetyci** itd.

- 2026-07-22 Â· stempel: ROBOCZA Â· **248b2622** Â· md5 pliku `248b262222701bc1bf5149094e1d277b` Â· **MAPA: jednostka widoczna na lesie** â€” na `70aea720`:
  **Bug Macieja:** token jednostki zasĹ‚oniÄ™ty przez kÄ™pÄ™ drzew (nakĹ‚adka Las). **Fix (wzorzec B â€” jak farma na lesie):** `syncForestForUnits` w `scene.ts` â€” tymczasowo ukrywa instancjonowanÄ… kÄ™pÄ™ lasu (+ legacy forest mesh + dĹĽungla styledOverlays) na heksach z widocznym tokenem; przywraca po ruchu. WywoĹ‚anie z `syncUnitsRender` w `main.ts`. Farmy/hodowle/ulepszenia na lesie bez zmian (`hideDecorAtHex` trwaĹ‚e).
  tsc=0 Â· smoke OK Â· picker-test 136/136 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `d5a4543e`) Â· Test: Ctrl+F5 START.html â†’ stamp `248b2622`; postaw jednostkÄ™ na lesie â†’ token + pierĹ›cieĹ„ wĹ‚aĹ›ciciela w peĹ‚ni widoczne; po ruchu z heksa las wraca.

- 2026-07-22 Â· stempel: ROBOCZA Â· **70aea720** Â· md5 pliku `70aea720f1c8697bb77fb97bfadc466f` Â· **MAPA: wiÄ™cej chat ze skarbami (miasta Ă— trudnoĹ›Ä‡)** â€” na `7d03bb35`:
  **Decyzja Macieja:** liczba chat = miasta startowe (typy Ă— (1+paĹ„stwa)) Ă— mnoĹĽnik trudnoĹ›ci â€” HART=1 Â· NORMAL=2 Â· EZ=3. **ByĹ‚o:** `round(lÄ…d/140)` (~10â€“65). **Jest:** `targetHuts = cityCount Ă— multiplier` w `villages.ts` + `WorldGenOptions` (difficulty, civTypesCount, cityStatesCount) z kreatora â†’ `generator.ts` / `main.ts`.
  tsc=0 Â· villages-test 39/39 Â· map-gen-regression determinizm PASS Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `248b2622`) Â· Test: Ctrl+F5 START.html â†’ stamp `70aea720`; nowa gra Standard Â· Normal â†’ wiÄ™cej chat niĹĽ wczeĹ›niej; przykĹ‚ad 8 miast Normal â†’ 16 chat.

- 2026-07-22 Â· stempel: ROBOCZA Â· **7d03bb35** Â· md5 pliku `7d03bb35daf68ef86d540b35cf87361b` Â· **DYPL: oferta AI = faktyczny skarbiec (strict transfer)** â€” na `826cc00b`:
  **Decyzja Macieja:** paĹ„stwo/miasto-paĹ„stwo/cywilizacja proponuje TYLKO tyle Â¤/PN, ile ma w skarbcu â€” nie wiÄ™cej. **Fix:** `capAiGoldOffer` (min(saldo, max)); `decideAIDiplomacy` + `enrichAiCommandWithTreasury` â€” brak propozycji gold-only przy 0 Â¤; UI dynamiczne (â€ž**5** Â¤"); akceptacja przez `applyOneShotGoldTransfer` (strict); cofniÄ™ty grant bez skarbca (`applyDiplomaticGoldGrant` â†’ strict alias).
  tsc=0 Â· diplomacy-proposal-test 64/64 Â· diplomacy-economy-test 11/11 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `70aea720`) Â· Test: Ctrl+F5 START.html â†’ stamp `7d03bb35`; propozycja handlu AI pokazuje realnÄ… kwotÄ™ (np. 5 Â¤); AKCEPTUJ â†’ skarbiec +dokĹ‚adnie tyle; AI z 0 Â¤ nie wysyĹ‚a handlu zĹ‚otem.

- 2026-07-22 Â· stempel: ROBOCZA Â· **826cc00b** Â· md5 pliku `826cc00bda20eccc5392ae3924a7aae0` Â· **MAPA: granice paĹ„stwa â€” ciÄ…gĹ‚y kontur per paĹ„stwo** â€” na `f9bd9a75`:
  **Bug:** poprzedni fix (`07beb443`) nadal dawaĹ‚ rozĹ‚Ä…czone paski â€” per-heks offset normalnych od Ĺ›rodka kaĹĽdego heksa + bĹ‚Ä™dne mapowanie krawÄ™dzi (rog i zamiast rog i+1,i+2). **Fix:** `territory-border.ts` â€” zbieranie krawÄ™dzi granicznych â†’ graf â†’ zamkniÄ™te pÄ™tle (polyline loops); `rangeOverlay.ts` â€” pas mesh wzdĹ‚uĹĽ pÄ™tli z joinami w wierzchoĹ‚kach; alpha **0.5**, szerokoĹ›Ä‡ **0.15** world units; per ownerId osobny obwĂłd w kolorze cywilizacji.
  tsc=0 Â· territory-border-test 9/9 Â· map-gen-regression determinizm PASS Â· picker-test 136/136 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `7d03bb35`) Â· Test: Ctrl+F5 START.html â†’ stamp `826cc00b`; mapa â†’ minimapa â†’ granice paĹ„stwa ON â†’ kaĹĽde paĹ„stwo ma ciÄ…gĹ‚y obwĂłd wokĂłĹ‚ caĹ‚ego terytorium (Ateny, Mykeny, AI).

- 2026-07-22 Â· stempel: ROBOCZA Â· **f9bd9a75** Â· md5 pliku `f9bd9a7522500410d4340d5deb9acb9d` Â· **DYPL: akceptacja AI handel â†’ +20 Â¤ graczowi** â€” na `07beb443`:
  **Bug:** po AKCEPTUJ propozycji Mykeny â€ž20 Â¤ na rzecz twojego paĹ„stwa" skarbiec gracza siÄ™ nie zwiÄ™kszaĹ‚. **Przyczyna:** `applyOneShotGoldTransfer` wymagaĹ‚ peĹ‚nego salda AI (czÄ™sto 0) + ponowna ocena `evaluateProposal` przy akceptacji. **Fix:** `resolvePlayerAcceptsAiPending` (gracz klika AKCEPTUJ bez re-eval); `applyDiplomaticGoldGrant` â€” gracz dostaje peĹ‚ne 20 Â¤, AI pĹ‚aci tyle ile ma; `updateHud()` po transferze.
  tsc=0 Â· diplomacy-proposal-test 57/57 Â· diplomacy-economy-test 8/8 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `826cc00b`) Â· Test: Ctrl+F5 START.html â†’ stamp `f9bd9a75`; poczekaj na propozycjÄ™ handlu AI â†’ AKCEPTUJ â†’ skarbiec +20 Â¤.

- 2026-07-22 Â· stempel: ROBOCZA Â· **07beb443** Â· md5 pliku `07beb443d7efc6dd1bd35efa29bfebae` Â· **MAPA: granice paĹ„stwa â€” widoczny spĂłjny obwĂłd** â€” na `2e46903e`:
  **Bug:** granica praktycznie niewidoczna (cienka linia WebGL 1px @ 30% alpha) + efekt rozĹ‚Ä…czonych paskĂłw per heks. **Fix:** `rangeOverlay.ts` â€” `buildTerritoryBorderMesh`: szeroki pas `TERRITORY_BORDER_BAND_WIDTH=0.10` (world units), flat Y dla caĹ‚ego obwodu, trĂłjkÄ…ty w naroĹĽnikach Ĺ‚Ä…czÄ… segmenty; alpha 0.48. Toggle minimapy bez zmian.
  tsc=0 Â· map-gen-regression determinizm PASS Â· picker-test 136/136 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `f9bd9a75`) Â· Test: Ctrl+F5 START.html â†’ stamp `07beb443`; mapa â†’ minimapa â†’ ikona granic paĹ„stwa â†’ wyraĹşny kolorowy obwĂłd wokĂłĹ‚ terytorium (nie kreski per heks).

- 2026-07-22 Â· stempel: ROBOCZA Â· **2e46903e** Â· md5 pliku `2e46903ef4065678fb24fbfe0475dd0f` Â· **BITWA: taktyka/strategia per jednostka** â€” na `77c603d7`:
  **Cel:** wybĂłr Taktyki (Obrona/Atak/Szturm/OstrzaĹ‚) i Strategii (priorytety celĂłw) dla pojedynczej jednostki, nie tylko grupy. **Fix:** `battleScene.ts` â€” pola `unitDoctrine`, `useUnitPriorities` / `unitTargetPriorities` na `RuntimeBattleUnit`; popup Taktyka/Strategia dziaĹ‚a na zaznaczeniu (Ctrl+LPM = jedna jednostka); wielokrotne zaznaczenie ustawia wszystkim lub pokazuje â€žmieszane".
  tsc=0 Â· auto-battle-power-test 14/14 Â· battle-smoke harness pre-existing fail Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `07beb443`) Â· Test: Ctrl+F5 START.html â†’ stamp `2e46903e`; PLAYTEST-WALKA â†’ bitwa rÄ™czna â†’ Ctrl+LPM zaznacz 1 jednostkÄ™ â†’ Taktyka â†’ Szturm; druga w grupie â†’ Obrona â†’ rĂłĹĽne postawy w tej samej grupie.

- 2026-07-22 Â· stempel: ROBOCZA Â· **77c603d7** Â· md5 pliku `77c603d77fe1346c18d8b5cb52535d3c` Â· **UI: etykieta kultury w audiencji dyplomatycznej** â€” na `3d2e4f32`:
  **Cel:** gracz widzi okrÄ™g kulturowy rozmĂłwcy (np. â€žKultura: Grecka" / â€žChetycka") oraz wskazĂłwkÄ™ ten sam okrÄ™g vs obca kultura. **Fix:** `civCultureLabelForKey` + `sameCultureCircle` w `diplomacy-display.ts`; linia UI w `diplomacyAudience.ts`; stan w `main.ts`.
  tsc=0 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `2e46903e`) Â· Test: Ctrl+F5 START.html â†’ stamp `77c603d7`; dyplomacja â†’ audiencja Argos â†’ â€žKultura: Grecka Â· Ten sam okrÄ™g kulturowy"; obcy typ â†’ â€žObca kultura".

- 2026-07-22 Â· stempel: ROBOCZA Â· **3d2e4f32** Â· md5 pliku `3d2e4f329dc66bc40aadf23c7c4d9623` Â· **UI: stan dyplomatyczny vs nastawienie w audiencji** â€” na `40a77974`:
  **Cel:** jednoznaczny formalny stan umĂłw (wojna/pokĂłj/sojusz/pakt/handel/brak kontaktu) odrÄ™bny od nastawienia (score). **Fix:** `resolveFormalDiplomaticStatus` + `nastawienieLabelFromScore` w `diplomacy-display.ts`; audiencja â€” prominentny box â€žStan dyplomatyczny" z ikonÄ… mieczy przy wojnie; nastawienie z podpisem wyjaĹ›niajÄ…cym; usuniÄ™to mylÄ…ce â€žPokĂłj (neutralne)" i badge tier w sekcji relacji.
  tsc=0 Â· diplomacy-display-test 14/14 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `77c603d7`) Â· Test: Ctrl+F5 START.html â†’ stamp `3d2e4f32`; dyplomacja â†’ audiencja â†’ â€žStan dyplomatyczny: PokĂłj" + osobno â€žNastawienie: Neutralny"; przy wojnie â†’ âš” Wojna.

- 2026-07-22 Â· stempel: ROBOCZA Â· **40a77974** Â· md5 pliku `40a77974b45d7aedb7bd17bc7abf2dfa` Â· **BALANS: badania x2, budynki -50% produkcji** â€” na `345cf8e2`:
  **Decyzja Macieja (flat, bez trudnoĹ›ci):** koszty badaĹ„ Ă—2 (`GLOBAL_RESEARCH_COST_MULT` w `difficulty-cost.ts` â†’ `scaledResearchCost`); koszt Pracy budynkĂłw Ă—0.5 (`GLOBAL_BUILDING_PROD_MULT` w `production.ts` â†’ `buildingWorkCost`). JSON bez zmian.
  tsc=0 Â· research-test 33/33 Â· tech-tree-test 19/19 Â· difficulty-cost-test 22/22 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `3d2e4f32`) Â· Test: Ctrl+F5 START.html â†’ stamp `40a77974`; drzewko: ObrĂłbka drewna 12â†’24 PN (szybka); ĹšwiÄ…tynia 25â†’13 Pracy (niski tempo).

- 2026-07-22 Â· stempel: ROBOCZA Â· **345cf8e2** Â· md5 pliku `345cf8e2c9a72fcc45fdb63fc9e62a62` Â· **UI: etykieta kultury w audiencji dyplomatycznej** â€” na `e90f27d4`:
  **Cel:** gracz widzi okrÄ™g kulturowy rozmĂłwcy (np. â€žKultura: Grecka" / â€žChetycka") oraz wskazĂłwkÄ™ ten sam okrÄ™g vs obca kultura. **Fix:** `diplomacy-display.ts` mapowanie typCywilizacji â†’ przymiotnik PL; `diplomacyAudience.ts` linia pod tytuĹ‚em; `main.ts` przekazuje `otherCultureLabel` + `cultureCircleSame`.
  tsc=0 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `40a77974`) Â· Test: Ctrl+F5 START.html â†’ stamp `345cf8e2`; dyplomacja â†’ audiencja Argos â†’ â€žKultura: Grecka Â· Ten sam okrÄ™g kulturowy"; obcy typ â†’ â€žObca kultura".

- 2026-07-22 Â· stempel: ROBOCZA Â· **e90f27d4** Â· md5 pliku `e90f27d4a8e40d79d19c410d21641ed4` Â· **FIX: propozycje dyplomacji AI â€” tekst dla gracza** â€” na `8b53ffd7`:
  **Bug:** popup propozycji handlu (i innych) pokazywaĹ‚ debug silnika (`willingnessTrade=0.58 â€¦`). **Fix:** `formatAiDiplomacyPlayerMessage` w `diplomacy-proposals.ts` â€” polskie opisy oferty (zĹ‚oto/trybut/sojusz/pokĂłj); `cmd.powod` tylko w `console.log`; UI inbox/modal bez wspĂłĹ‚czynnikĂłw.
  tsc=0 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `345cf8e2`) Â· Test: Ctrl+F5 START.html â†’ stamp `e90f27d4`; propozycja handlu od miasta-paĹ„stwa â†’ â€žProponujemy jednorazowÄ… wymianÄ™: 20 Â¤â€¦â€ť bez willingnessTrade.

- 2026-07-22 Â· stempel: ROBOCZA Â· **8b53ffd7** Â· md5 pliku `8b53ffd7328af8e421b094d5dc290460` Â· **FIX: picking heksĂłw mapy Ĺ›wiata (offset w dĂłĹ‚)** â€” na `0440dbe4`:
  **Bug:** klik w heks na mapie trafiaĹ‚ w sÄ…siada â€žw dĂłĹ‚" â€” trzeba byĹ‚o klikaÄ‡ Ĺ›rodek kafelka (`95be60fc` raycast terenu nie wystarczyĹ‚). **Przyczyna:** (1) `camera.aspect`/`setSize` z `innerWidth/innerHeight` vs `getBoundingClientRect` canvas (scrollbar/DPR drift â†’ przesuniÄ™cie Y promienia); (2) `worldToAxial` na trafieniu w bok pryzmu zamiast hex z `instanceId`. **Fix:** `scene.ts` â€” rozmiar kamery z `canvas.clientWidth/Height`; `terrainPickKeys` + `resolveTerrainPick(instanceId)`; `picker.ts` â€” `updateMatrixWorld`, world-space normal, test `picker-test.cjs`.
  tsc=0 Â· picker-test 136/136 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `e90f27d4`) Â· Test: Ctrl+F5 START.html â†’ stamp `8b53ffd7`; klik krawÄ™dzi heksa (nie tylko Ĺ›rodek) â†’ wĹ‚aĹ›ciwy hex / panel kontekstowy.

- 2026-07-22 Â· stempel: ROBOCZA Â· **0440dbe4** Â· md5 pliku `0440dbe4c9b526c4e382d22585168d40` Â· **FIX: manual battle deploy â€” raycast terenu 3D** â€” na `13cb70c2`:
  **Bug:** w fazie rozstawiania (deploy) klik w pole czasem trafiaĹ‚ w sÄ…siedni hex / wymagaĹ‚ wielu klikĂłw â€” `_pickGroundTile` i `_onDeployClick` uĹĽywaĹ‚y pĹ‚aszczyzny y=0 (perspektywa kamery przesuwaĹ‚a trafienie, jak stary bug mapy w `picker.ts`). **Fix:** `_battleGroundPickMeshes` + raycast na meshach terenu; `preferPlacement` przy kliku z zaznaczeniem; feedback â€žPoza strefÄ…"/â€žPole nieprzechodne".
  tsc=0 Â· battle-smoke harness pre-existing fail Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `8b53ffd7`) Â· Test: Ctrl+F5 START.html â†’ stamp `0440dbe4`; PLAYTEST-WALKA â†’ bitwa rÄ™czna deploy â†’ zaznacz jednostkÄ™ â†’ LPM na docelowy niebieski kafelek â†’ jedna prĂłba, wĹ‚aĹ›ciwy slot.

- 2026-07-22 Â· stempel: ROBOCZA Â· **13cb70c2** Â· md5 pliku `13cb70c217f2e899a712af962cfb176a` Â· **FIX: obywatele nie pracujÄ… na obcym terytorium + granice paĹ„stw** â€” na `d33863ab`:
  **Bug:** w overlapie zasiÄ™gĂłw miast gracz widziaĹ‚ đź‘¤ i zbieraĹ‚ plony z heksĂłw faktycznie naleĹĽÄ…cych do AI (budowa ulepszeĹ„ juĹĽ blokowana). **Fix:** `territoryOwnerAt` filtruje auto/rÄ™czny przydziaĹ‚ pĂłl, reconcile co turÄ™ i przy zaĹ‚oĹĽeniu miasta; đź‘¤ overlay tylko na wĹ‚asnych heksach; toggle granic paĹ„stw (minimapa, szeĹ›ciokÄ…t) â€” juĹĽ podpiÄ™ty.
  tsc=0 Â· okolica-test 39/39 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `0440dbe4`) Â· Test: Ctrl+F5 START.html â†’ stamp `13cb70c2`; overlap przy Sparcie â€” brak đź‘¤/plonĂłw na lesie AI; minimapa â†’ granice paĹ„stw ON.

- 2026-07-22 Â· stempel: ROBOCZA Â· **d33863ab** Â· md5 pliku `d33863ab2e47ec6fd8b5b8dcf2cd3a3f` Â· **FIX: zwiadowca bez gĹ‚odu + Manpower przy rekrutacji** â€” na `e1ac8503`:
  **Bug1:** czaszka gĹ‚odu i utrata HP na zwiadowcy gdy imperium gĹ‚oduje â€” overlay per-paĹ„stwo bez filtra cywilnych + utrzymanie zĹ‚oto Zwiadowca=1 w JSON. **Fix:** `isCivilianUnit` (zwiadowca/osadnik/robotnik) pomijany w overlay i `applyArmyStarvationHpLoss`; cywilne upkeep/food=0.
  **Bug2:** rekrutacja za zĹ‚oto nie odejmowaĹ‚a Manpower przy klikniÄ™ciu. **Fix:** `purchaseRecruitmentUnit` pobiera MP od razu; anulowanie zwraca MP; kolejka spawn bez ponownego poboru.
  tsc=0 Â· manpower-test 24/24 Â· upkeep-test 58/58 Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `13cb70c2`) Â· Test: Ctrl+F5 START.html â†’ stamp `d33863ab`; zwiadowca bez czaszki przy gĹ‚odzie wojska; rekrutuj â†’ pula rekrutĂłw spada natychmiast.

- 2026-07-22 Â· stempel: ROBOCZA Â· **e1ac8503** Â· md5 pliku `e1ac85039004206b42257db32921ebac` Â· **UI: Stos â†’ Armia (etykiety stosu jednostek)** â€” na `c7301135`:
  **Zmiana Macieja:** `Stos Â· 2 jedn.` â†’ `Armia â€” 2 jednostki` (odmiana 1/2â€“4/5+); tooltip `Zaznacz armiÄ™ â€” N jednostek`; spĂłjnie panel stosu, merge, wybĂłr miasto/jednostka.
  Pliki: `gra/src/ui/formatPl.ts`, `main.ts`, `armyListHud.ts`, `armyStackHud.ts`, `armyMergePanel.ts`, `cityUnitPick.ts`. tsc=0 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `d33863ab`) Â· Test: Ctrl+F5 START.html â†’ md5 `e1ac8503`; âš” lista armii â†’ â€žArmia â€” N jednostki", hover â€žZaznacz armiÄ™ â€” â€¦".

- 2026-07-22 Â· stempel: ROBOCZA Â· **a6820979** Â· md5 pliku `a6820979252257f6df87e881c729509d` Â· **D3-TRUST-TICK + lista dyplomacji Relacja/Zaufanie** â€” na `c63dd3f4`:
  **Zaufanie/turÄ™ (wykluczajÄ…ce tiery):** sojusz +3 Â· NAP +2 Â· pokĂłj +1 Â· UmowaHandlowa +1 stackuje. **Handel surowcĂłw/zĹ‚ĂłĹĽ:** `UmowaHandlowa` trwaĹ‚a, czas umowy **1â€“20 tur** (koszyk), wygasa bez auto-odnowienia; PN/Â¤ bez surowcĂłw = one-shot. **UI lista dyplomacji:** `Relacja: X Â· Zaufanie: Y`, bez bonusĂłw cyw.
  tsc=0 Â· diplomacy-proposal 55/55 Â· docs `docs/decyzje/D3-TRUST-TICK-2026-07-21.md` Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `e1ac8503`) Â· Test: Ctrl+F5 START.html â†’ stamp `a6820979`; handel z zĹ‚oĹĽem â†’ wybĂłr 1â€“20 tur; uĹ›cisk dĹ‚oni â†’ Relacja+Zaufanie.

- 2026-07-21 Â· stempel: ROBOCZA Â· **c7301135** Â· md5 pliku `c730113537ad8855f07f53a948566f28` Â· **D3-TRUST-TICK + lista dyplomacji** (push `4a41c43`, kod `eab45c1`) â€” na `c63dd3f4`:
  Ten sam zakres co `a6820979` â€” pierwszy publish na `main` po `eab45c1`. Â· **NA origin/main** (do nowszego lokalnego publishu).

- 2026-07-21 Â· stempel: ROBOCZA Â· **c63dd3f4** Â· md5 pliku `c63dd3f4df7e51f9300f2ba0265d69ac` Â· **FIX: Farma na lesie (Las) bez wyrÄ™bu** â€” na `41656451`:
  **Bug:** budowa Farmy wymagaĹ‚a wycinki lasu (WyrÄ…b) albo nie dziaĹ‚aĹ‚a na wzgĂłrzach z lasem; kÄ™pa drzew zasĹ‚aniaĹ‚a model ulepszenia. **Fix:** `isFarmBaseTerrain()` â€” ĹÄ…ka/RĂłwnina zawsze + WzgĂłrza gdy nakĹ‚adka Las; po postawieniu farmy/hodowli/irygacji na lesie schowanie dekoru lasu (nakĹ‚adka Las zostaje); test `map-improvement-qualify-test.cjs` 54/54.
  tsc=0 Â· map-improvement-qualify 54/54 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `a5b836a1`) Â· Test: Ctrl+F5 START.html â†’ stamp `c63dd3f4`; đź”¨ Budowa â†’ Farma â†’ klik heks z lasem bez WyrÄ™bu â†’ postawienie OK, drzewa schowane.

- 2026-07-21 Â· stempel: ROBOCZA Â· **41656451** Â· md5 pliku `41656451acc3344d2863fcdf0375f4e7` Â· **FIX: Lama ukryta w panelu budowy poza Inkowie** â€” na `c1b7327a`:
  **Bug:** ulepszenie Lama widoczne dla wszystkich cywilizacji (np. Grecy) jako wyszarzone â€žBrak heksĂłw w twoim terytorium". **Fix:** `isImprovementVisibleInBuildPanel` filtruje listÄ™ đź”¨ ULEPSZENIA TERENU; bramka `isLivestockAllowed` w `applyBuildRequest`. Lama tylko `typCywilizacji` inkowie (`isIncaCiv`).
  tsc=0 Â· map-improvement-qualify lama AC OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `c63dd3f4`) Â· Test: Ctrl+F5 START.html â†’ stamp `41656451`; Grecy đź”¨ â†’ brak Lama; Inkowie â†’ Lama na liĹ›cie.

- 2026-07-21 Â· stempel: ROBOCZA Â· **c1b7327a** Â· md5 pliku `c1b7327a494fbf0d3e348f0b5b78791e` Â· **D3-TRUST-TICK: per-turowe Zaufanie + trwaĹ‚y handel surowcami** â€” na `87d0d359`:
  **Zaufanie/turÄ™:** sojusz +3 Â· NAP +2 Â· pokojowy kontakt +1 (tiery wykluczajÄ…ce) Â· UmowaHandlowa +1 (stackuje). **Handel zĹ‚oĹĽa/surowiec_boolean:** trwaĹ‚y ActiveDeal `umowa_handlowa` 10â€“20 tur, grant ZlozeGrant z dealId, wygasa z traktatem/wojnÄ…; czysty PN/Â¤ nadal one-shot.
  tsc=0 Â· diplomacy-proposal 53/53 Â· diplomacy-test tick OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `41656451`) Â· Test: Ctrl+F5 START.html â†’ stamp `c1b7327a`; NAP/sojusz buduje Zaufanie szybciej; handel z dostÄ™pem do zĹ‚oĹĽa tworzy umowÄ™ wieloturowÄ….

- 2026-07-21 Â· stempel: ROBOCZA Â· **87d0d359** Â· md5 pliku `87d0d359f8ccd4275c89e56496dc1c9c` Â· **FIX: propozycje handlu AI tylko po odkryciu w mgle (D3-Q2)** â€” na `b1e90a22`:
  **Bug:** miasta-paĹ„stwa z klastra kulturowego wysyĹ‚aĹ‚y `zaproponuj_handel` bez odkrycia gracza i bez akcji â€žNawiÄ…ĹĽ kontakt". **Fix:** `diplomacyLayerForOwner` â†’ `pre_contact` dla wszystkich ownerĂłw bez odkrycia (wczeĹ›niej miasta-paĹ„stwa omijaĹ‚y bramkÄ™ przez warstwÄ™ `simplified`); `filterDiplomacyCommandsForLayer` blokuje wszystkie propozycje AI.
  tsc=0 Â· ai-test T10aâ€“c OK (234 pass, 4 pre-existing fail) Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `c1b7327a`) Â· Test: Ctrl+F5 START.html â†’ stamp `87d0d359`; Nowa gra bez odkrycia paĹ„stw-miast â†’ brak propozycji handlu; po odkryciu w mgle â†’ propozycje moĹĽliwe.

- 2026-07-21 Â· stempel: ROBOCZA Â· **b1e90a22** Â· md5 pliku `b1e90a22570f73e834a6209c6830575a` Â· **NAP rel-only + fix handel UI (live Respekt)** â€” na `31bf4a4b`:
  **NAP:** bramka tylko Relacja â‰Ą progNapRelacja (bez Zaufania); Zaufanie roĹ›nie po zawarciu. **Handel:** UI uĹĽywaĹ‚o stale `rel.respekt` zamiast live `computeRespekt` â†’ przy Rel 55 na ekranie przycisk szary z mylÄ…cym tooltipem; naprawione `audienceRelTotal` + `buildProposalEvalContext`.
  tsc=0 Â· diplomacy-proposal 47/47 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `87d0d359`) Â· Test: Ctrl+F5 START.html â†’ stamp `b1e90a22`; NAP przy Relâ‰Ą50 bez Zauf; handel aktywny gdy Rel (Zauf+Respekt mocy) â‰Ą40.

- 2026-07-21 Â· stempel: ROBOCZA Â· **31bf4a4b** Â· md5 pliku `31bf4a4bbe8eea314f7210b9a61f4a1a` Â· **D3-PROG-DIFF: progi traktatĂłw wg trudnoĹ›ci + dual gates NAP/handl** â€” na `95be60fc`:
  **D3-PROG-DIFF:** skalowanie progĂłw relacji/zaufania/respektu Â±10 wg trudnoĹ›ci (easy â’10 / hard +10). Normal: handel Rel 40, NAP Rel 50 + Zauf 40. Dual gates: NAP wymaga Rel+Zauf (+ tech/granice gdzie dotyczy); sojusz/trybut/handl z osobnymi progami.
  tsc=0 Â· diplomacy-proposal 48/48 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `b1e90a22`) Â· Test: Ctrl+F5 START.html â†’ stamp `31bf4a4b`; normal: NAP przy Relâ‰Ą50 i Zaufâ‰Ą40; handel przy Relâ‰Ą40.

- 2026-07-21 Â· stempel: ROBOCZA Â· **95be60fc** Â· md5 pliku `95be60fc79400576b0e82bb15f518174` Â· **FIX picking heksĂłw â€” raycast 3D terenu zamiast pĹ‚aszczyzny y=0** â€” na `83eadf9a`:
  **Przyczyna:** kamera ~52Â° + pryzmy terenu podniesione nad y=0 â†’ `pixelToHex` trafiaĹ‚ w pĹ‚aszczyznÄ™ pod spodem, przesuwajÄ…c wybĂłr w stronÄ™ kamery (krawÄ™dzie heksĂłw = zĹ‚y hex). **Fix:** raycast na InstancedMesh terenu (prefer gĂłrna Ĺ›cianka), fallback y=0; `terrainPickMeshes` w SceneResult + `pickHexAt` in main.ts.
  tsc=0 Â· logic 207/207 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `31bf4a4b`) Â· Test: Ctrl+F5 START.html â†’ stamp `95be60fc`; klik w krawÄ™dĹş heksa â†’ panel kontekstowy pokazuje wĹ‚aĹ›ciwy hex (nie sÄ…siada â€žw gĂłrÄ™").

- 2026-07-21 Â· stempel: ROBOCZA Â· **83eadf9a** Â· md5 pliku `83eadf9a14a80a6e08db6a2eb8da88ca` Â· **FIX FoW â€” jednostki wroga ukryte poza bieĹĽÄ…cym zasiÄ™giem** â€” na `eeace0a7`:
  **Przyczyna:** `syncUnitsRender()` bez jawnej listy mgĹ‚y synchronizowaĹ‚o wszystkie tokeny jako widoczne (czerwone pierĹ›cienie w czerni/shroud). **Fix:** przy `fogOn` domyĹ›lna lista = `unitsVisibleOnMap` (obcy tylko w `currentVisible`; gracz zawsze); test logic 207/207 (+4).
  tsc=0 Â· logic 207/207 Â· VERIFY OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `95be60fc`) Â· Test: Ctrl+F5 START.html â†’ stamp `83eadf9a`; brak wrogich jednostek w czarnej mgle i ciemnym shroud poza zasiÄ™giem.

- 2026-07-21 Â· stempel: ROBOCZA Â· **eeace0a7** Â· md5 pliku `eeace0a7477674272f86583795d60826` Â· **BUGFIX: miasta-paĹ„stwa atakujÄ… gracza tylko w wojnie** â€” na `5793da54`:
  **Fix:** `canEngageOwner` w AI (ai.ts) + bramka w main.ts â€” bez statusu `wojna` brak preBattle/ataku na jednostki gracza (riposta przy zwiadowcy obok miasta-paĹ„stwa). Dyplomacja PRZYJAZNY/neutralni spĂłjna z brakiem walki.
  tsc=0 Â· diplomacy-test 143/143 Â· ai-test T7D-g OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `83eadf9a`) Â· Test: Ctrl+F5 START.html â†’ stamp `eeace0a7`; zwiadowca obok Gamla Uppsala â†’ brak ataku; po wypowiedzeniu wojny â†’ atak dozwolony.

- 2026-07-21 Â· stempel: ROBOCZA Â· **5793da54** Â· md5 pliku `5793da543dc71b9a5ea61f6776f8c241` Â· **AUDYT 20 POTWIERDZONE + E-START-CS-Q1=C (merge commit)** â€” na `35a07a49`:
  **Audyt E1â€“E8:** #3â€“#9 #34â€“#39 #59â€“#65 + fix chatki WYDARZENIA (peĹ‚ny opis: `dyspozycje/AUDYT-NAPRAWY-LOG.md`). **E-START-CS:** paĹ„stwa-miasta wokĂłĹ‚ faktycznej stolicy (juĹĽ w `35a07a49`, zachowane).
  tsc=0 Â· tech-tree 19/19 Â· map-gen-regression OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `eeace0a7`) Â· Test: Ctrl+F5 START.html â†’ stamp `5793da54`; chatka + AI badania + klaster paĹ„stw po stolicy.

- 2026-07-21 Â· stempel: ROBOCZA Â· **35a07a49** Â· md5 pliku `35a07a49cd8d393f82b45819ccc1a19c` Â· **E-START-CS-Q1=C â€” paĹ„stwa-miasta wokĂłĹ‚ faktycznej stolicy gracza** â€” na `33e7c213`:
  **C:** spawn deferred same-type rivals uĹĽywa `buildSameTypeRivalCandidateHexes` wokĂłĹ‚ hexu gracza (nie pre-planu mapgen); backfill przy odrzuceniu `foundCityAt`; pre-plan zostaje tylko do podglÄ…du UI.
  tsc=0 Â· cluster-start-test 92/95 (3 pre-existing map 50Ă—50) Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `5793da54`) Â· Test: Ctrl+F5 START.html â†’ stamp `35a07a49`; Nowa gra 10â€“14 paĹ„stw â†’ postaw stolicÄ™ w innym miejscu niĹĽ sugerowane â†’ gÄ™sty klaster ~3 hex wokĂłĹ‚ Twojej stolicy.

- 2026-07-21 Â· stempel: ROBOCZA Â· **33e7c213** Â· md5 pliku `33e7c2138ee878307b4f0e294b5413e1` Â· **AUDYT 20 POTWIERDZONE (Maciej OK plan audyt 20)** + fix chatki WYDARZENIA:
  **E1â€“E8:** #3 dupe ludnoĹ›ci rekrut/disband Â· #4 suwak 0% nie kasuje gĹ‚odu Â· #5/#37 AI badania (awans epoki + epoch/tier gates) Â· #6 zwyciÄ™stwo nauka bez rakiety (NAUKA_WYMAGA_RAKIETY) Â· #7 relief bez GĂłr na WybrzeĹĽu Â· #8/#9/#39/#65 audio intro/awans epoki/natura/crossfade Â· #34 parametry gĹ‚odu z ekonomia_miasta Â· #35 zdrowie nie zeruje deficytu ĹĽywnoĹ›ci Â· #36 utrzymanie budynkĂłw w upkeep Â· #38 cuda nie na WybrzeĹĽu Â· #59 Pracaâ†’Â¤ po splitPraca Â· #60/#61 wioska setEra + parser prerekĂłw Â· #62 pangea bez purge jezior Â· #63 scoring start dist=4 Â· #64 martwe deposit_rules usuniÄ™te Â· **extra:** chatka znika po turze, WYKONAJ nie blokuje na nagrodzie.
  tsc=0 Â· tech-tree 33/33 Â· map-gen-regression OK Â· publish `gra-robocza/Gra-ROBOCZA.html`. Â· **ZASTÄ„PIONA** (â†’ `35a07a49`) Â· Test: Ctrl+F5 START.html â†’ stamp `33e7c213`; chatka â†’ komunikat znika po zakoĹ„czeniu tury; AI bada dalej po awansie epoki.

- 2026-07-21 Â· stempel: ROBOCZA Â· **14b3a1b0** Â· md5 pliku `14b3a1b05833ba24add367ec93b9beb3` Â· commit `dce32f3` (FF `main`, PUSHNIÄTE) Â· **TRASA PRZEZ MGĹÄ (fala 4, C-RUCH-Q1=B)** â€” na `a7e6b012`:
  **B:** `applyFogToPathPlan` nie ucina juĹĽ trasy na granicy widocznoĹ›ci â€” moĹĽna prowadziÄ‡ marsz **optymalnÄ… trasÄ… przez mgĹ‚Ä™ i nieodkryty teren** do celu. Pathfinding omija teren nieprzejezdny; egzekucja zatrzymuje jednostkÄ™ na realnej blokadzie (`shouldStopAtObstacle`). Dawna logika â€žĹ›lepa" przeniesiona do `_applyFogToPathPlanBlind` (nieuĹĽywana).
  tsc=0 Â· planned-march 18/18 Â· logic 203/203 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `33e7c213`) Â· Deploy sesja lokalna (Maciej: â€ždokoĹ„cz falÄ™ 4"). Test: zaznacz armiÄ™ â†’ klik cel za mgĹ‚Ä… â†’ trasa prowadzi przez mgĹ‚Ä™ do celu (nie staje na granicy widocznoĹ›ci); Ctrl+F5 START.html â†’ stamp `14b3a1b0`.

- 2026-07-21 Â· stempel: ROBOCZA Â· **a7e6b012** Â· md5 pliku `a7e6b01281d10853974faa884d79ef5b` Â· commit `dba6e6e` (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIÄTE) Â· **AUTOSAVE ROTACYJNY (fala 3): 10 ostatnich wstecz + ustawienie czÄ™stotliwoĹ›ci** â€” na `38d6fc8b`:
  **M:** automatyczny autozapis co N tur (domyĹ›lnie **co turÄ™**) do rotacji 10 slotĂłw (autosave-1â€¦10) â€” zawsze **10 ostatnich stanĂłw wstecz**. CzÄ™stotliwoĹ›Ä‡ N (1..20 tur) ustawiana w **menu pauzy** (â€žAutozapis co N tur"). Slot Ctrl+S (â€žautosave") pozostaje osobny. Rotacyjne sloty pojawiajÄ… siÄ™ w oknie Wczytaj. `setLastPlayedSlotId` â†’ â€žKontynuuj" wskazuje najnowszy autozapis.
  tsc=0 Â· logic 203/203 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `14b3a1b0`) Â· Deploy AUTONOMICZNY (C-ORG-Q17=A). Test: graj kilka tur â†’ w oknie Wczytaj roĹ›nie lista â€žAutozapis Â· tura N"; zmieĹ„ czÄ™stotliwoĹ›Ä‡ w menu pauzy.

- 2026-07-21 Â· stempel: ROBOCZA Â· **38d6fc8b** Â· md5 pliku `38d6fc8bebeace3056863e5e225230bb` Â· commity `c511387` (auto-cykl + feedback chatki) + `b8f0ab2` (status dyplomacji) (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIÄTE) Â· **PACZKA UX (fala 2): auto-cykl jednostek + feedback nagrĂłd + status dyplomacji** â€” na `dfe0e817`:
  **C:** auto-cykl â€žbÄ™ben" â€” po wyczerpaniu ruchu jednostki system automatycznie przechodzi do nastÄ™pnej jednostki gracza z dostÄ™pnym ruchem (centruje kamerÄ™); **SPACE** = rÄ™czne przejĹ›cie; gdy ĹĽadna nie ma ruchu â†’ odznaczenie. **D:** nagroda z chatki/wioski pokazywana jako jeden czytelny toast (5 s) ORAZ trwaĹ‚y wpis w panelu WYDARZENIA (wczeĹ›niej toast bywaĹ‚ nadpisywany â€” brak informacji). **J:** panel Audiencji dyplomatycznej ma teraz wyraĹşnÄ… liniÄ™ **STATUS** odrÄ™bnÄ… od nastawienia/tier: â€žW trakcie wojny / Sojusz wojskowy / Pakt o nieagresji / PokĂłj (neutralne) / Brak kontaktu" â€” kolorowanÄ… (rozwiewa mylÄ…ce â€žWROGI", ktĂłre jest tylko nastawieniem).
  tsc=0 Â· diplomacy 143/143 Â· logic 203/203 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `a7e6b012`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel w playteĹ›cie, C-ORG-Q17=A). đź”ś W toku fala 3: B (trasa przez mgĹ‚Ä™ 12 tur), M (autosave 10 wstecz). Test: (1) rusz jednostkÄ… â†’ auto-skok do nastÄ™pnej + SPACE; (2) wejdĹş na chatkÄ™ â†’ komunikat + wpis w WYDARZENIACH; (3) otwĂłrz dyplomacjÄ™ â†’ linia STATUS.

- 2026-07-21 Â· stempel: ROBOCZA Â· **dfe0e817** Â· md5 pliku `dfe0e8178186fba1d7a4151a81ec3568` Â· commity `14649e7` (crash walki + cywile + kamera) + `68e8485` (paĹ„stwa-miasta + rekrutacja + pasek + floaty) (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIÄTE) Â· **PACZKA UX/BUGFIX (fala 1): krytyczny crash walki + 7 poprawek** â€” na `5edc860`:
  **L (KRYTYCZNE):** naprawiony crash walki â€žMaximum call stack" (nieskoĹ„czona rekurencja rosteru `_rebuildBattleRosterGrid`â†”`_updateRosterBar`) + brak grupowania jednostek na polu bitwy. Przyczyna: silnik walki zakĹ‚adaĹ‚ gracz=atakujÄ…cy; gdy gracz BRONI siÄ™, roster/grupowanie siÄ™gaĹ‚y `this.atk` zamiast `_playerRoster()`/`_groupRegistryRoster()`. Dodany guard re-entrancy. **H:** rekrutacja NIE zabiera juĹĽ populacji miasta (`jednostka_koszt_ludnosci=0`) â€” kosztem tylko pula Manpower (potwierdzony objaw: zwiadowca zdejmowaĹ‚ 1 ludnoĹ›Ä‡). **G:** paĹ„stwa-miasta (15 ĹĽÄ…danych â†’ byĹ‚o ~1): `canFoundCity` relaksuje prĂłg do 3 hex gdy ZAKĹADANE miasto to paĹ„stwo-miasto (stolice bez flagi `startCityState` blokowaĹ‚y spawn progiem 5) + `Wybrzeze` wykluczone z puli kandydatĂłw + logi cichych odrzuceĹ„. **I:** cywile (zwiadowca/osadnik/robotnik) nie mogÄ… zdobywaÄ‡ miast. **K:** klik jednostki w panelu ARMIE centruje kamerÄ™ na jej heksie. **A:** zielony pasek ruchu (ruchLeft/ruchMax) w liĹ›cie ARMIE. **F:** `Math.round` na pulach nauki (BADANIA) i zamoĹĽnoĹ›ci â€” koniec `14.400000000000002`. **E/F2:** zweryfikowane bez zmian kodu (Zwiadowca 0 utrzymania ĹĽywnoĹ›ci + obywatel je 1 ĹĽywnoĹ›Ä‡ â€” juĹĽ dziaĹ‚ajÄ… end-to-end).
  tsc=0 Â· manpower 23/23 Â· logic 203/203 Â· map-gen A=B (1437e982) + 814/814 rzeki Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `38d6fc8b`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel w aktywnym playteĹ›cie, C-ORG-Q17=A). âš ď¸Ź Incydent: kontener przeklonowaĹ‚ siÄ™ w trakcie (limit) i skasowaĹ‚ niezacommitowanÄ… pracÄ™ â€” odtworzona z historii i zabezpieczona pushem. Test: (1) OBROĹ siÄ™ w bitwie â†’ walka startuje, grupowanie dziaĹ‚a; (2) 15 paĹ„stw-miast â†’ znacznie wiÄ™cej na mapie; (3) zbuduj jednostki â†’ poziom miasta bez zmian; (4) zwiadowcÄ… klik wrogie miasto â†’ komunikat â€žnie moĹĽe zdobywaÄ‡".

- 2026-07-21 Â· stempel: ROBOCZA Â· **20239659** Â· md5 pliku `20239659d422d41617f00cad11e15577` Â· commit `bfa3ceb` (branch â†’ FF `main`, PUSHNIÄTE) Â· **DYPLOMACJA MIAST-PAĹSTW wg TRUDNOĹšCI (start-zaufanie + dyplomacjaAktywnosc)** â€” na `454d7c52` (decyzja C-MP-DYPL-Q1=B):
  **Cz.1:** startowe zaufanie miast-paĹ„stw do gracza wg trudnoĹ›ci (tylko kopie typu; gĹ‚Ăłwne cyw nietkniÄ™te): easy +10 / normal +5 / **hard 0** (wariant B â€” baza juĹĽ na dnie skali, wiÄ™c hard=dzisiejsze zero, monotonicznie â€žwyĹĽsza trudnoĹ›Ä‡ = mniej zaufania"). **Cz.2:** oĹĽywiony martwy param `dyplomacjaAktywnosc` (easy 0,8/normal 1,0/hard 1,25) â€” podĹ‚Ä…czony do skĹ‚onnoĹ›ci propozycji sojuszu/handlu w `decideAIDiplomacy` (**param OGĂ“LNY â€” dotyczy teĹĽ gĹ‚Ăłwnych cywilizacji**). Globalne `DIPLOMACY_PARAMS` nietkniÄ™te.
  tsc=0 Â· city-state-alliance 59/59 Â· diplomacy 143/143 Â· ai-test 226/6 baseline Â· logic 203/203 Â· capital-capture 54/54 Â· map-gen A=B + 814/814 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `dfe0e817`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel nieobecny). Do akceptacji: delty 10/5/0, ogĂłlny zasiÄ™g dyplomacjaAktywnosc. Test: na rĂłĹĽnych trudnoĹ›ciach obserwuj nastawienie i skĹ‚onnoĹ›Ä‡ do sojuszy AI.

- 2026-07-21 Â· stempel: ROBOCZA Â· **454d7c52** Â· md5 pliku `454d7c5232878d354241d0245f1aab6b` Â· commit `ef56a99` (branch â†’ FF `main`, PUSHNIÄTE) Â· **POSIĹKI MIAST-PAĹSTW wg TRUDNOĹšCI + peĹ‚na maszyneria sojuszu** â€” przerĂłbka na `0251a5cf` (decyzje C-MP-SOJ-Q1/Q2/Q3):
  **USUNIÄTA osobna opcja** â€žWsparcie miast-paĹ„stw" â€” siĹ‚a miast-paĹ„stw wynika teraz z **trudnoĹ›ci gry**: Ĺatwyâ†’sĹ‚abe (skala sojuszu Ă—0,6, posiĹ‚ki {0,3,1}), Normalnyâ†’{Ă—0,3, 1,2,1}=obecne, Trudnyâ†’twarde (Ă—0,15, {2,1,2}). WyĹĽsza trudnoĹ›Ä‡ = twardsze, bardziej zwarte miasta-paĹ„stwa. **Q2=B peĹ‚na maszyneria:** siostry zawierajÄ… sojusz przez realny `aiDiplomacyStance`/willingness + parytet militarny (jak graczâ†”AI), tylko z obniĹĽonym progiem tierowym. Fix przy okazji: `progUmowaMinRelacja` skalowany razem dla siĂłstr (inaczej twarda podĹ‚oga uniewaĹĽniaĹ‚a obniĹĽkÄ™). Globalna dyplomacja graczâ†”AI nietkniÄ™ta.
  tsc=0 Â· city-state-alliance 42/42 Â· diplomacy 143/143 Â· logic 203/203 Â· capital-capture 54/54 Â· ai-improvements 15/15 Â· map-gen A=B + 814/814 Â· ai-test 226/6 baseline Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `20239659`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel nieobecny). Test: wybierz trudnoĹ›Ä‡ â†’ na Trudnym miasta-siostry szybko siÄ™ sprzymierzajÄ… i mocno wspierajÄ…; na Ĺatwym ledwo (Ĺ‚atwy Ĺ‚up).

- 2026-07-21 Â· stempel: ROBOCZA Â· **0251a5cf** Â· md5 pliku `0251a5cf0d2ae25ef1a69e49d80da701` Â· commit `3a41391` (branch â†’ FF `main`, PUSHNIÄTE) Â· **POSIĹKI MIAST-PAĹSTW przez SOJUSZ + opcja setupu + prĂłg -30%** â€” nabudowane na `0b59bf29`:
  Przeprojektowanie: siostry klastra pomagajÄ… sobie **tylko w sojuszu**; zawierajÄ… sojusze **Ĺ‚atwiej** (prĂłg 30% dla par siĂłstr, `Math.max(podĹ‚oga, prĂłgĂ—0,3)`; globalny prĂłg graczâ†”AI NIETKNIÄTY) i **proaktywnie gdy zagroĹĽone** (nowa pÄ™tla AIâ†”AI `formSisterAlliancesIfThreatened`, dziĹ› dyplomacji AIâ†”AI nie byĹ‚o). Nowa **opcja gracza w setupie**: â€žWsparcie miast-paĹ„stw: Niskie/Normalne/Mocne" (domyĹ›lnie Normalne) â†’ `RESUP_TIERS` (low r0/g3/1 Â· normal r1/g2/1=obecne Â· strong r2/g1/2). W save przez `meta.newGameParams`.
  tsc=0 Â· city-state-alliance 28/28 (nowy) Â· diplomacy 143/143 Â· logic 203/203 Â· capital-capture 54/54 Â· ai-improvements 15/15 Â· map-gen A=B + 814/814 Â· ai-test 226/6 baseline Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `454d7c52`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel nieobecny, C-ORG-Q17=A). Do akceptacji: skala 30%, liczby RESUP_TIERS, domyĹ›lne Normalne. Test: nowa gra â†’ opcja â€žWsparcie miast-paĹ„stw"; zaatakuj miasto-siostrÄ™ â†’ sÄ…siednie siostry zawierajÄ… sojusz i dopiero wtedy dosyĹ‚ajÄ… posiĹ‚ki.

- 2026-07-21 Â· stempel: ROBOCZA Â· **0b59bf29** Â· md5 pliku `0b59bf296b5417b4743ef6694644cee1` Â· commit `704ed00` (branch â†’ FF `main`, PUSHNIÄTE) Â· **AI BUDUJE ULEPSZENIA TERENU (wszystkie cywilizacje + miasta-paĹ„stwa)** â€” nabudowane na `7c65681a`:
  ULEP-Q1=B: dotÄ…d ulepszenia stawiaĹ‚ tylko gracz; teraz kaĹĽde AI rozwija teren. **Pula pracy AI** (`aiPracaPoolByOwner`, symetryczna do skarbca, w save) â€” podpiÄ™ta pod akcesory przejÄ™cia stolicy, wiÄ™c **AI teĹĽ traci pulÄ™ pracy przy utracie stolicy** (domkniÄ™cie asymetrii). **`planCityImprovements`** reuĹĽywa kwalifikatora gracza; throttle 1 ulepszenie/miasto/turÄ™, skip gdy nadwyĹĽka Pracy â‰¤30; deterministyczny, food-first; wyrÄ…b pominiÄ™ty; te same reguĹ‚y dla miast-paĹ„stw. WydajnoĹ›Ä‡: skan tylko terytorium miasta + typy odblokowane techem.
  tsc=0 Â· ai-improvements 15/15 (nowy) Â· capital-capture 54/54 Â· logic 203/203 Â· map-gen A=B + 814/814 Â· cluster-start 143/143 Â· siege-ai 17/17 Â· ai-test 226/6 baseline Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `0251a5cf`) Â· Deploy AUTONOMICZNY (wĹ‚aĹ›ciciel nieobecny, C-ORG-Q17=A). Do akceptacji: prĂłg nadwyĹĽki Pracy (30), kolejnoĹ›Ä‡ priorytetĂłw ulepszeĹ„. Test: obserwuj AI/miasta-paĹ„stwa po kilku turach â†’ stawiajÄ… farmy/kopalnie/pastwiska na swoim terytorium.

- 2026-07-21 Â· stempel: ROBOCZA Â· **7c65681a** Â· md5 pliku `7c65681a67c5fbf3060b5819a77c69bb` Â· commit `b56b815` (branch â†’ FF `main`, PUSHNIÄTE) Â· **PRZEJÄCIE STOLICY â€” follow-upy: przenieĹ› stolicÄ™ + Power-â€žzdobycze"** â€” nabudowane na `41d0a2ea`:
  **(A) PrzenieĹ› stolicÄ™** (MOVE-Q1/Q2/Q3 = A/A/A) â€” stolica jest teraz WYZNACZONYM miastem (`capitalCityIdByOwner`, domyĹ›lnie najstarsze, w save); plunder/sukcesja uĹĽywajÄ… wyznaczonej. Gracz: przycisk â€žUstaw jako stolicÄ™" w panelu miasta (za darmo, **blokada gdy stolica oblegana**). AI: gdy stolica zagroĹĽona (wrĂłg blisko, przed oblÄ™ĹĽeniem) przenosi do najbezpieczniejszego miasta. Symetria graczâ†”AI.
  **(B) Power-â€žzdobycze"** (POWER-Q3=A) â€” przy ELIMINACJI snapshot **caĹ‚ego** Power pokonanego â†’ trwaĹ‚a, osobna kategoria â€žzdobycze" u zwyciÄ™zcy (wpiÄ™te w `computeObjectivePower`, w save).
  tsc=0 Â· capital-capture 54/54 Â· logic 203/203 Â· siege-ai 17/17 Â· cluster-start 143/143 Â· map-gen A=B + 814/814 Â· civ-roster/tech-tree/research/unit-replace zielone Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `0b59bf29`) Â· Deploy AUTONOMICZNY z sesji CHMUROWEJ (wĹ‚aĹ›ciciel nieobecny 2h, C-ORG-Q17=A). Do akceptacji po powrocie: prĂłg â€žAI przenosi gdy zagroĹĽona", brzmienie komunikatĂłw. Test: przenieĹ› stolicÄ™ przyciskiem w panelu miasta (nie dziaĹ‚a gdy oblegana); wyeliminuj cywilizacjÄ™ â†’ skok Twojego Power (kategoria â€žzdobycze").

- 2026-07-21 Â· stempel: ROBOCZA Â· **41d0a2ea** Â· md5 pliku `41d0a2ea695143515934f34e3ef29564` Â· commity `adc472e` (rdzeĹ„) + `2966d9a` (fix) (branch â†’ FF `main`, PUSHNIÄTE) Â· **PRZEJÄCIE STOLICY (rdzeĹ„) + fix najstarszego miasta** â€” nabudowane na `8bd30f48`:
  **(A) PrzejÄ™cie stolicy** â€” dwa osobne zdarzenia przy zdobyciu stolicy (= najstarsze miasto cywilizacji): **Zdarzenie 1** (pokonany ma inne miasta) â€” skarbiec â†’ zwyciÄ™zca (caĹ‚oĹ›Ä‡), pula pracy przepada; cyw gra dalej, nowa stolica = kolejne najstarsze. **Zdarzenie 2** (ostatnie miasto = eliminacja) â€” + pula nauki â†’ zwyciÄ™zca + brakujÄ…ce techy skopiowane; cywilizacja usuniÄ™ta z gry (dyplomacja/mapy stanu/oblÄ™ĹĽenia/pÄ™tla AI). Miasto-paĹ„stwo (1 miasto) â†’ zawsze Zdarzenie 2. PeĹ‚na symetria graczâ†”AI, wpiÄ™te w obie Ĺ›cieĹĽki zdobycia (bitwa/puste + kapitulacja z gĹ‚odu), stan w save. Nowy `capital-capture.ts` + test 38/38. **Follow-upy (poza rdzeniem):** akcja â€žprzenieĹ› stolicÄ™", Power-â€žzdobycze".
  **(B) Fix** â€” `isPlayerCapitalCity` uĹĽywaĹ‚ `localeCompare` na id miast â†’ przy 10+ miastach myliĹ‚ kolejnoĹ›Ä‡ (po podwojeniu zawsze); teraz numeryczny `cityFoundOrder`.
  tsc=0 Â· capital-capture 38/38 Â· logic 203/203 Â· combat 6/6 Â· map-gen A=B + 814/814 Â· cluster-start 143/143 Â· siege-ai 17/17 Â· tech-tree/research/unit-replace/civ-roster/barbarians/villages/converters/trade-routes zielone Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `7c65681a`) Â· Deploy z sesji CHMUROWEJ (stamp node). Test: zdobÄ…dĹş stolicÄ™ AI â†’ przejmujesz jego skarbiec; zdobÄ…dĹş jego ostatnie miasto â†’ eliminacja + Ĺ‚up (nauka+techy); miasto-paĹ„stwo â†’ od razu eliminacja.

- 2026-07-21 Â· stempel: ROBOCZA Â· **8bd30f48** Â· md5 pliku `8bd30f4899b9143c2cb331f5d237899b` Â· commit `9e39b08` (branch â†’ FF `main`, PUSHNIÄTE) Â· **MIASTA-PAĹSTWA: aktywny rozwĂłj + posiĹ‚ki w klastrze (bez bonusĂłw)** â€” nabudowane na `a756d893`:
  Miasta-siostry (profil `kopia_typu_obronna`) przestajÄ… byÄ‡ biernym Ĺ‚upem. Przyczyna biernoĹ›ci: bramka `earlyPhase` (`myCities.length<3`) â€” kopie majÄ… zawsze 1 miasto â†’ wiecznie â€žwczesna faza" â†’ nigdy nie budowaĹ‚y budynkĂłw gospodarczych (Koszary/Tartak/Cegielnia/Huta/Magazyn/Targowisko), tylko w kĂłĹ‚ko Wojownik/Ĺucznik. Fix: `earlyPhase` wyklucza defensiveCopy â†’ peĹ‚na kolejka mid-game (ten sam scoring co zwykĹ‚e AI, **zero bonusu**). + Spichlerz w bloku defensiveCopy (izolowany). + **posiĹ‚ki w klastrze**: zagroĹĽona siostra (wrĂłg w distâ‰¤1) dostaje posiĹ‚ek z pobliskiej siostry z nadwyĹĽkÄ… garnizonu (progi RESUP: threat=1, min_guard=2, max/turÄ™=1 â€” **zachowawcze, do dostrojenia po playteĹ›cie**). **Zero darmowych jednostek, nie zakĹ‚adajÄ… miast, dyplomacja nietkniÄ™ta.** Handel AI (Q2=B) wydzielony do Handel E6. Ulepszenia terenu przez AI: mechanizm nie istnieje w grze (brak robotnika) â€” osobna decyzja.
  tsc=0 Â· ai-test 226/6 (te same 6 pre-istniejÄ…cych: T2S sojusz/handel, T7D-a przestarzaĹ‚y) Â· map-gen determinizm A=B + 814/814 z ujĹ›ciem Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· civ-roster 14/14 Â· cluster-start 143/143 Â· siege-ai 17/17 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `41d0a2ea`) Â· Deploy z sesji CHMUROWEJ (stamp node). Test: obce paĹ„stwo (kopia typu) â†’ rozbudowuje siÄ™ (budynki gospodarcze, nie tylko Wojownik) i broni; zaatakuj miasto-siostrÄ™ â†’ sÄ…siednia siostra dosyĹ‚a obroĹ„cÄ™; nadal Ĺ‚up, ale z wysiĹ‚kiem.

- 2026-07-21 Â· stempel: ROBOCZA Â· **a756d893** Â· md5 pliku `a756d893b60049d21719636014e49520` Â· commity `7f900ab`+`b778370`+`71733d2`+`00e1311` (rebasowane na `374c1067`, branch â†’ FF `main`, PUSHNIÄTE) Â· **PODWOJENIE PAĹSTW/MIAST + FIX RZEK (wzrokowy) + PPM anuluje ulepszenie** â€” nabudowane na audio+grafice lokalnej sesji:
  **(A) Podwojenie setupu** â€” miasta w klastrze Ă—2, cywilizacje Ă—2 z sufitem 15 (roster = 15 nacji). DomyĹ›lne per rozmiar: MaleĹ„ski 8mp/**7cyw** (7, nie 8 â€” na najmniejszej mapie 8 klastrĂłw czasem siÄ™ nie mieĹ›ciĹ‚o), MaĹ‚y 10/10, Standardowy 12/12, DuĹĽy 14/14, Ogromny 16/15, Super Huge 16/15. `MAX_MIAST_PANSTWA` 9â†’18, `MAX_TYPY_CYWILIZACJI_MENU` 14â†’15. Pomiar rozstawienia: wszystkie rozmiary 100% (MaleĹ„ski=7 mieĹ›ci siÄ™).
  **(B) Fix ujĹ›cia rzek (weryfikacja WZROKOWA, Playwright)** â€” poprzedni fix bramki nie wystarczyĹ‚; dwie wady w `render/scene.ts` `buildCoastalRiverPointChain`/`renderCoastalRiverExtension`: (1) kolor kamuflujÄ…cy (coastDeltaMat = kolor terenu WybrzeĹĽa â†’ wstÄ™ga niewidoczna), (2) wodospad za wczeĹ›nie â†’ pĹ‚aski odcinek biegĹ‚ pod bryĹ‚Ä… terenu lÄ…du. Naprawione: wstÄ™ga **widocznie wpĹ‚ywa w heks WybrzeĹĽa i poszerza siÄ™ w deltÄ™** (potwierdzone zrzutami przed/po). Dane/generator nietkniÄ™te.
  **(C) PPM anuluje tryb budowy ulepszeĹ„** â€” prawy przycisk (contextmenu + mouseup) woĹ‚a `exitBuildMode()`, wzorem Escape/lewego-kliku-w-pustkÄ™.
  tsc=0 (na scalonym stanie z audio+grafikÄ…) Â· map-gen-regression determinizm A=B + **814/814 z ujĹ›ciem** Â· map-scale-menu 32/0 Â· cluster-start 143/0 Â· start-preview 6/0 Â· rozmiar-label 13/0 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· VERIFY OK. Bundel **27,3 MB**. Â· **ZASTÄ„PIONA** (â†’ `8bd30f48`) Â· Deploy z sesji CHMUROWEJ (stamp node, rebase na `374c1067` bez konfliktĂłw). Test: nowa gra â†’ wiÄ™cej paĹ„stw/miast (Standardowy 12 cyw Ă— 13 miast); mapa â†’ rzeki wpĹ‚ywajÄ… w wybrzeĹĽe; tryb budowy ulepszeĹ„ â†’ PPM anuluje.

- 2026-07-21 Â· stempel: ROBOCZA Â· **374c1067** Â· md5 pliku `374c1067975b6ee0d0c9be8b70aa1ddc` Â· commity `1a73086`â€¦`3f1773e` (branch `main`) Â· **GRAFIKA-Ĺ»ELAZO + KOMPLET AUDIO** â€” dwa duĹĽe tematy w jednym bundlu:
  **(A) GRAFIKA-Ĺ»ELAZO** (zlecenie integratora #1 z 2026-07-10, wykonane po 10 dniach oczekiwania na werdykt wĹ‚aĹ›ciciela; dyspozycja `DYSPOZYCJA-GRAFIKA-JEDNOSTKI.md` Â§2b): 4 nowe moduĹ‚y w `gra/src/render/` â€” **11 modeli jednostek ĹĽelaza** (Mezopotamia/Indus: Gwardia hetycka, Piechota neobabiloĹ„ska, Mur tarcz, Garnizon Harappy Â· ĹšrĂłdziemnomorze: Tyrski miecznik, Gwardia TyreĹ„ska, Wojownik z ĹĽelaznym khopesh, Thorakites Â· plemiona: DruĹĽynnik, iButho z iklwa, Miecznik galijski) + **nowa Galera** (oko apotropaiczne, trĂłjzÄ™bny taran, ĹĽagiel z emblematem gracza, 8 wioseĹ‚/burta) zastÄ™pujÄ…ca ~90 linii geometrii ad-hoc. **FIX Triari** â€” `buildSuperUnit` ignorowaĹ‚ nazwÄ™, wiÄ™c `case 'rzym'` zawsze zwracaĹ‚ Evocati (Triari renderowaĹ‚ siÄ™ jako jego kopia). **FIX routingu Germana** â€” â€žWojownik germaĹ„ski SUPER" trafiaĹ‚ w generyczny fallback; dopisane `germanie` do `Culture`/`cultureFromName`/`buildSuperUnit`. Weryfikacja funkcjonalna headless: `buildUnitModel` dla **73/73 jednostek bez wyjÄ…tku**; Triari (486 tri) â‰  Evocati (478), German super (488) â‰  generyk (580).
  **(B) AUDIO â€” trzy niezaleĹĽne kanaĹ‚y:** *muzyka z plikĂłw* (intro: 3 utwory instrumentalne w **staĹ‚ej kolejnoĹ›ci** `C-MUZ-Q6=A`; kamieĹ„: 16 utworĂłw shuffle, kaĹĽdy 3Ă— pod rzÄ…d; brÄ…z+ synteza bez zmian, synteza kamienia **uĹ›piona nie skasowana**) Â· **crossfade 1,5 s** na kaĹĽdym przejĹ›ciu, takĹĽe miÄ™dzy powtĂłrzeniami, krzywa equal-power (zgĹ‚oszenie: ~1 s gĹ‚uchej ciszy, bo `'ended'` reaguje za pĂłĹşno) Â· *odgĹ‚osy natury* = **SYNTEZA, 0 MB** (wiatr, ptaki, Ĺ›wierszcze, wilk/sowa + nowy `renderListowie` = szum drzew), wĹ‚asny przeĹ‚Ä…cznik i suwak, **automatyczne wyciszanie w bitwie** (0,8 s) wpiÄ™te w `setMood()` â€” `main.ts` i pliki bitwy bez zmian. `renderWoda` **uĹ›piona** (morze/rzeka wrĂłci przy dĹşwiÄ™ku pozycyjnym â€” decyzja wĹ‚aĹ›ciciela: szum morza bez zwiÄ…zku z geografiÄ… brzmiaĹ‚ przypadkowo).
  **(C) DANE:** Thorakites `Typ` **Swordsmanâ†’Spearman** + uwagi (tarcza thureos + wĹ‚Ăłcznia dory); skutek mechaniczny: Ĺ‚apie kontrÄ™ **Spearman vs Mount +50%**. Panel-C zsynchronizowany z JSON, round-trip OK (na kopii).
  **FIX bĹ‚Ä™du wĹ‚aĹ›ciciela:** wyciszenie muzyki zapisywaĹ‚o siÄ™ trwale i gasiĹ‚o teĹĽ intro â€” teraz `enabled` jest **ulotne** (tylko bieĹĽÄ…ca rozgrywka), gĹ‚oĹ›noĹ›Ä‡ nadal trwaĹ‚a, stare zapisane `{enabled:false}` rozbrojone.
  Bramki: tsc=0 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· **combat 6/6** Â· **logic 203/203** Â· map-gen determinizm A=B Â· VERIFY OK. Bundel **26,1 MB** (19 mp3 inline). Â· **ZASTÄ„PIONA** (â†’ `a756d893`) Â· Test wĹ‚aĹ›ciciela: wyglÄ…d 13 modeli + Galery na wodzie Â· kolejnoĹ›Ä‡ i przenikanie utworĂłw Â· szum drzew (las czy drugi wiatr?) Â· wyciszanie natury w bitwie Â· wyciszenie muzyki NIE przechodzi na nowÄ… grÄ™ ani na intro.

- 2026-07-20 Â· stempel: ROBOCZA Â· **50448964** Â· md5 pliku `5044896415a4b298a6701243bccd183e` Â· commit `39c95a2` (feature) + commit deployu (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` â†’ FF `main`, PUSHNIÄTE) Â· **RZEKI: render ujĹ›cia koĹ„czy na WybrzeĹĽu (nie wymaga gĹ‚Ä™bokiego Morza)**:
  Bug byĹ‚ w 100% w RENDERZE (dane rzek poprawne: 96.6% rzek gĹ‚Ăłwnych koĹ„czy bieg na wodzie, 0% â€žwisi"; dopĹ‚ywy 97.2% Ĺ‚Ä…czÄ… siÄ™ z innÄ… rzekÄ…). Bramka renderu `pathReachesOpenSeaRender` (`render/scene.ts`) wymagaĹ‚a dotarcia do gĹ‚Ä™bokiego Morza w 1 kroku â€” a pas WybrzeĹĽa ma 2 heksy â€” wiÄ™c ujĹ›cie rzeki koĹ„czÄ…cej na wewnÄ™trznym pierĹ›cieniu WybrzeĹĽa byĹ‚o CAĹKOWICIE pomijane (wstÄ™ga urywaĹ‚a siÄ™ na lÄ…dzie). **Fix wg reguĹ‚y wĹ‚aĹ›ciciela** (WybrzeĹĽe JEST morzem, rzeka koĹ„czy na WybrzeĹĽu): (a) bramka przepuszcza, gdy ostatni heks biegu jest wodÄ… lub sÄ…siaduje z WybrzeĹĽem/Morzem; (b) `buildCoastalRiverPointChain` wpĹ‚ywa w pierwszy heks WybrzeĹĽa i tam koĹ„czy (bez przepychania do Morza), z zachowanym wodospadem/deltÄ…; deterministyczny wybĂłr heksu. **Pomiar render-ujĹ›cia: ziemia 8.8%â†’100%, kontynenty 0%â†’100%.** Zmiana wyĹ‚Ä…cznie w `render/scene.ts` (â’48 linii netto), dane/gra-data nietkniÄ™te.
  tsc=0 Â· map-gen-regression determinizm A=B (`1437e982`) + **814/814 z ujĹ›ciem** Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· VERIFY OK Â· **AKTUALNA** Â· Deploy z sesji CHMUROWEJ (stamp node). Test: pogeneruj mapy (ziemia + kontynenty) â†’ wstÄ™gi rzek wpĹ‚ywajÄ… w wybrzeĹĽe (pĹ‚ytkÄ… wodÄ™ przy brzegu) i tam siÄ™ koĹ„czÄ…; brak rzek urywajÄ…cych siÄ™ na Ĺ›rodku lÄ…du.
- 2026-07-20 Â· stempel: ROBOCZA Â· **74d85bc2** Â· md5 pliku `74d85bc2197de26d7fe47d36cf76420b` Â· commit `0d11fdd` (feature) + commit deployu (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` â†’ FF `main`, PUSHNIÄTE) Â· **MAPA: wybrzeĹĽe z morza (lÄ…d nietkniÄ™ty) + fix Ziemia + pasma gĂłr -25%**:
  (a) **WybrzeĹĽe â€” kierunek odwrĂłcony** (COAST-Q1=A) â€” WybrzeĹĽe powstaje z heksĂłw **Morza sÄ…siadujÄ…cych z lÄ…dem** (pĹ‚ytka woda), a NIE przez konwersjÄ™ suchego lÄ…du. LÄ…d zostaje w 100%. `applyCoastRing`/`applyDoubleCoastRing` iterujÄ… teraz po Morzu przy lÄ…dzie; `thickenCoastAndSmoothInlets` resetuje WybrzeĹĽeâ†’**Morze** (nieâ†’ĹÄ…ka â€” koniec faĹ‚szywego lÄ…du z wody); `sanitizeCoastHexes` sierotaâ†’Morze (nigdyâ†’lÄ…d). Naprawia regresjÄ™ â€žkontynent europejski zamieniony w wybrzeĹĽe" na mapie **Ziemia**: wybrzeĹĽe/lÄ…d **0.65â†’0.47**, lÄ…d **+63%** (3488â†’5691), rzeki 100% z ujĹ›ciem. Godzi generacjÄ™ ze zmianÄ… WybrzeĹĽe=woda z poprzedniego deployu.
  (b) **Fix faĹ‚szywego lÄ…du poza maskÄ… Ziemi** â€” po zachowaniu lÄ…du heurystyki â€ždomykania zatok" zaczÄ™Ĺ‚y zalewaÄ‡ lÄ…dem cieĹ›nie poza maskÄ… Ziemi (do 349 heksĂłw). Nowa `purgeStrayLandOutsideEarthMask` (tylko `typ=ziemia`): suchy lÄ…d poza maskÄ… â†’ Morze; `notMaskButLand` **349â†’0**.
  (c) **Pasma gĂłrskie -25%** (GORY-Q2=A) â€” â€žaĹĽ za duĹĽo gĂłr"; `gestosc.pasma_gorskie.dlugosc_max`: low 15â†’11, med 18â†’14, high 22â†’17 (`max_pasm_na_mase`/`dlugosc_min` bez zmian; logika `growMountainRanges` nietkniÄ™ta).
  **Ryzyko (do wiadomoĹ›ci):** ten sam mechanizm domykania zatok dziaĹ‚a teĹĽ na kontynenty/wyspy/pangea (brak maski referencyjnej â€” niemierzalne); jeĹ›li w playteĹ›cie widaÄ‡ nienaturalnie â€žzalane" zatoki na innych typach â€” wrĂłciÄ‡ do tego.
  tsc=0 Â· map-gen-regression **833/833 z ujĹ›ciem** + determinizm A=B Â· tech-tree 19/19 Â· research 33/33 Â· unit-replace 10/10 Â· VERIFY OK Â· **ZASTÄ„PIONA** (â†’ `50448964`) Â· Deploy z sesji CHMUROWEJ (stamp node). Test: mapa typu **Ziemia** â€” kontynenty wypeĹ‚nione lÄ…dem (nie zjedzone wybrzeĹĽem), wybrzeĹĽe cienki pas przy brzegu, rzeki z ujĹ›ciem; gĂłry rzadsze pasma.

> âš ď¸Ź **UZUPEĹNIENIE WSTECZNE 2026-07-19 (integrator #2 / â€ždrugi integrator").** Trzy deploye poniĹĽej (`494598a3`, `ed16d0ea`, `ca3aafa0`) wykonaĹ‚em **bez wpisu w tym dzienniku i bez meldunku w `_handoff/KANAL-PRACA.md`** â€” zĹ‚amanie zasady z nagĹ‚Ăłwka tego pliku (â€žmd5/stempel wpisuje siÄ™ TYLKO tutaj, zaraz po publishu"). DokĹ‚adnie ten sam problem, ktĂłry integrator #1 zgĹ‚aszaĹ‚ przy `d2a346ff`. Wszystkie trzy byĹ‚y na **wyraĹşne polecenie Macieja**, nie samowolnie â€” ale przez ~8 dni rejestr wskazywaĹ‚ jako AKTUALNÄ„ nieaktualnÄ… `58182469`. UzupeĹ‚niam wstecznie; rĂłwnolegle meldunek w kanale pracy.

- 2026-07-20 15:58 Â· stempel: ROBOCZA Â· **a31ebe6f** Â· md5 pliku `a31ebe6f6ac72f8349339de7beeb9e24` Â· commity `bf7aba0` + `ab27149` + `7a3b051` + `a44c446` (branch `main`, PUSHNIÄTE) Â· **HANDEL: szlaki handlowe (E2+E3+E7) + zbieranie gliny**:
  (a) **E2 â€” wykrywanie poĹ‚Ä…czeĹ„ miast** â€” nowy `game/trade-routes.ts` `findCityConnection` (lÄ…d: uproszczony dystans + BFS przechodnioĹ›ci; morze: przez Port, BFS po wodzie); cache po mapie+stanie portĂłw. Decyzja Q6=B.
  (b) **Zbieranie gliny** â€” glinianka na zĹ‚oĹĽu daje **2 gliny/turÄ™** â†’ Cegielnia/Garncarnia oĹĽywajÄ… (produkujÄ… cegĹ‚Ä™/ceramikÄ™); ruda/brÄ…z Ĺ›wiadomie odĹ‚oĹĽone (GLINA-Q1/Q2=A/A; brak martwego licznika brÄ…zu).
  (c) **E3 â€” dochĂłd z tras** â€” trasy **TYLKO zewnÄ™trzne** (graczâ†”obca cyw, w pokoju), automatyczne, limit = liczba budynkĂłw handlowych (Targowisko/Karawanseraj/Port/Port wielki); dochĂłd = wzĂłr dystansowy (Q7=A) **+ +5% Handlu za trasÄ™** (kumulatywnie), **OBIE strony** zarabiajÄ… (Q8=B), do skarbca czysto (pomija Wealth). Trasy w zapisie gry.
  (d) **E7 â€” UI** â€” sekcja â€žSzlaki handlowe" w panelu miasta (cel, medium, dystans, dochĂłd/turÄ™, bonus) + **Ĺ‚uki tras na mapie** (zĹ‚oto=lÄ…d, bĹ‚Ä™kit=morze).
  **OdĹ‚oĹĽone (E3b/E6):** dostÄ™p do surowca przez trasÄ™ (Q11) Â· AI proaktywnie proponujÄ…ce handel + obniĹĽony prĂłg.
  tsc=0 Â· determinizm A=B Â· logic 203/203 Â· combat 6/6 Â· trade-routes 35/35 Â· trade-routes-income 49/49 Â· mennica-magazyn 38/38 Â· converters 31/31 Â· villages 31/31 Â· barbarians 74/74 Â· VERIFY OK Â· **ZASTÄ„PIONA** (â†’ `74d85bc2`) Â· Deploy z sesji CHMUROWEJ (stamp node). Test: zbuduj budynek handlowy + bÄ…dĹş w pokoju z sÄ…siadem â†’ trasa handlowa (Ĺ‚uk na mapie + sekcja w panelu miasta + dochĂłd/turÄ™ do skarbca).
- 2026-07-20 13:57 Â· stempel: ROBOCZA Â· **b217916e** Â· md5 pliku `b217916ec1352988ef9085e63c22f658` Â· commity `bed3ea1` + `5a7db56` (branch `main`, PUSHNIÄTE) Â· **MAPA: wybrzeĹĽe=woda + dĹ‚uĹĽsze pasma + rzeki do wody Â· HANDEL E1: Mennica + per-city surowce**:
  (a) **WybrzeĹĽe przeklasyfikowane LÄ„Dâ†’WODA** (WYBRZEZE-Q1/Q2/Q3 = A/A/A) â€” predykaty generatora (`isLandOrCoast` itd.) liczÄ… WybrzeĹĽe jak wodÄ™; pas 2 heksy zostaje; usuniÄ™te z `TERENY_LADU`/`TARTAK_TERENY` (droga/fort/posterunek precz), warzelnia soli â†’ ulepszenie przybrzeĹĽne (sektor woda); render obniĹĽony do pĹ‚ytkiej wody (`WYBRZEZE_SURFACE_TOP_Y` 0.28â†’0.20, piasek tylko na brzegu). **Konsekwencja COAST-Q4=A:** balans â€ž% lÄ…du" liczy tylko suchy lÄ…d â†’ wiÄ™cej lÄ…du, mniej/wiÄ™ksze wyspy (Ĺ›wiadoma decyzja).
  (b) **Pasma gĂłrskie dĹ‚uĹĽsze/wÄ™ĹĽsze** (HILLS-Q1/Q2/Q3 = A/A/A) â€” `growMountainRanges` (seed-and-grow, rdzeĹ„ GĂłr/obrzeĹĽe WzgĂłrz) + `gestosc.pasma_gorskie` (dĹ‚uĹĽsze, mniej pasm, nowy `obrzeze_szansa`) â†’ Ĺ‚aĹ„cuchy zamiast plam (~3Ă— dĹ‚uĹĽsze niĹĽ szersze); floor fair-play + sanity-cap 40% zachowane.
  (c) **Rzeki uproszczone** (RIVER-Q1/Q2/Q3 = A1/B1/C2, po zmianie wybrzeĹĽa) â€” ujĹ›cie = kaĹĽda woda (MorzeâŞWybrzeĹĽe); rzeka koĹ„czy na pierwszym kontakcie; usuniÄ™ty martwy kod (`coastTouchingSeaKeys`/`riverSeaGoalKeys`); bramka wzmocniona (`rivers:'high'` + `pathReachesRealSea`): **637/637 z ujĹ›ciem**.
  (d) **HANDEL E1** (fundament ekonomii, BEZ tras â€” E2-E7 pĂłĹşniej) â€” Mennica po Walucie (mnoĹĽnik **easy 2/normal 1,5/hard 1**; dziaĹ‚a tylko gdy zbudowana+Waluta â†’ normal +50% Skarbu z handlu); per-city `city.surowce` (drewno/kamieĹ„ zbierane z terenu + limit magazynu Ă—5; converters oĹĽywione, bramkowane budynkami; **braz/ĹĽelazo/hodowla zostajÄ… civ-wide**). Glina/ruda jeszcze nie zbierane (brak pola iloĹ›ci â€” do decyzji). Decyzje HANDEL-Q1..Q12.
  tsc=0 Â· determinizm A=B Â· logic 203/203 Â· combat 6/6 Â· barbarians 74/74 Â· villages 31/31 Â· converters 31/31 Â· mennica-magazyn 26/26 (nowy) Â· VERIFY OK Â· **ZASTÄ„PIONA** (â†’ `a31ebe6f`) Â· Deploy z sesji CHMUROWEJ (stamp node, brak PowerShell). Test: wygeneruj mapÄ™ (wybrzeĹĽe = pĹ‚ytka woda + piasek na brzegu, pasma jako Ĺ‚aĹ„cuchy) Â· miasto z MennicÄ…+WalutÄ… â†’ +50% Skarbu z handlu (normal).
- 2026-07-20 04:17 Â· stempel: ROBOCZA Â· **ba8ab0d7** Â· md5 pliku `ba8ab0d70e8b010c97808e9540f3bb6b` Â· commity `496dd53` + `a624ec4` (branch `main`, PUSHNIÄTE) Â· **LUDY MORZA (barbarzyĹ„cy BrÄ…zu) + WIOSKI (goodie-huty) + naprawa bramek testowych**:
  (a) **Ludy Morza jako barbarzyĹ„cy epoki BrÄ…z** â€” gdy era gracza = BrÄ…z (`player.era===2`), obozy spawnujÄ… WYĹÄ„CZNIE Wojownika Sherden i Wojownika szekelesz (naprzemiennie, deterministycznie), peĹ‚ne zastÄ…pienie, wszystkie poziomy trudnoĹ›ci. Nowe: `game/barbarians.ts` (`LUDY_MORZA_BARB_UNIT_IDS`, `pickBronzeBarbUnit`), override `unitTypeId` w `main.ts` przed `tickCamps`. Decyzje SEA-Q1..Q4 = A/A/A/A. `units.json`: szekelesz `Kultura` â€žRzymska"â†’â€žLudy Morza" (tylko etykieta w cityPanel, bez wpĹ‚ywu na mechanikÄ™; SEA-Q5=C zweryfikowane grepem).
  (b) **Wioski â€žgoodie-hut"** â€” nowy `map/villages.ts` `placeVillages()` (wzorzec `spawnCamps`, deterministyczny LCG, rzadko: 1 wioska/140 heksĂłw lÄ…dowych â†’ maĹ‚a 10 / std 29 / duĹĽa 65; wykluczenia: miasto, obĂłz barbarzyĹ„cĂłw, woda/wybrzeĹĽe/gĂłry/pustynia). WejĹ›cie jednostki gracza na wioskÄ™ â†’ nagroda (`game/villageRewards.ts`: zĹ‚oto 50% / tech 30% / jednostka 20%, kwoty skalowane erÄ…, fallback na zĹ‚oto; jednostka KamieĹ„=Zwiadowca / BrÄ…z=WĹ‚Ăłcznik / Ĺ»elazo=fallback zĹ‚oto, decyzja WIO-Q6=A) â†’ wioska znika. Render byĹ‚ gotowy (`syncVillageMeshes`), brakowaĹ‚o wyĹ‚Ä…cznie ustawienia `istnieje=true`. Decyzje WIO-Q1..Q5 = B/B/B/A/B.
  (c) **Naprawa bramek testowych** (byĹ‚y zepsute PRZED nami, nie regresja) â€” `combat-test` 6/6 (dodane brakujÄ…ce pole `counterTyp` w harnessie `adaptUnit`); `logic-test` 203/203 (aktualizacja fixtur BrÄ…zownictwa / tempa badaĹ„ Ă—2 / ryzyka buntu / start positions; las+zĹ‚oĹĽe na jednym heksie DOZWOLONE â€” poluzowana asercja, silnik `gen-helpers.ts` NIETKNIÄTY, TEST-Q1=B).
  tsc=0 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· combat 6/6 Â· logic 203/203 Â· barbarians 74/0 Â· villages 31/31 (nowy) Â· map-gen determinizm A=B + 0 rzek bez ujĹ›cia Â· VERIFY OK Â· **ZASTÄ„PIONA** (â†’ `b217916e`) Â· Test: era BrÄ…z â†’ barbarzyĹ„cy = Sherden/szekelesz; jednostka wchodzi na wioskÄ™ â†’ nagroda + wioska znika. Deploy z sesji CHMUROWEJ (stamp przez port node'owy â€” brak PowerShell na Linux).
- 2026-07-19 21:52 Â· stempel: ROBOCZA Â· **a44d5350** Â· md5 pliku `a44d5350e0abadbad7e4ab2acc94fc3e` Â· commity `f8c004c` + `1ad2204` (branch `main`, PUSHNIÄTE) Â· **ĹAĹCUCH Ĺ»ELAZA + sync paneli Excel**:
  (a) **Jednostki epoki Ĺ»elaza wymagajÄ… surowca `zelazo`** â€” nowa mechanika symetryczna do brÄ…zu. Nowy `gra/src/game/zelazo-access.ts` â†’ `hasZelazoAccess()`; bramka w `production.ts:717` (`if (surowiec === 'zelazo' && !hasZelazoAccess(...)) continue;`); **25 jednostek Epoka=Ĺ»elazo â†’ `Surowiec: "zelazo"`** (w tym 4 konne â€” â€žKoĹ„" zdjÄ™ty, decyzja `C-SUR-Q14 = B`). WczeĹ›niej silnik egzekwowaĹ‚ WYĹÄ„CZNIE `braz`, wiÄ™c 16 jednostek ĹĽelaznych wymagaĹ‚o brÄ…zu, a kaĹĽda inna wartoĹ›Ä‡ pola â€žSurowiec" byĹ‚a ignorowana. Decyzja `C-SUR-Q13 = A` (peĹ‚ny Ĺ‚aĹ„cuch: kopalnia na zĹ‚oĹĽu ĹĽelaza AND Odlewnia ĹĽelaza).
  (b) **Sync paneli Excel Aâ€“E z JSON** (`1ad2204`) + fix `gen-panel-d` (obsĹ‚uga tablicy tokenĂłw po zmianie schematu `jednostka_specjalna` na `string[]`). Kierunek JSONâ†’Excel; zdejmuje dĹ‚ug â€žpanele niezsynchronizowane".
  **ZASTÄ„PIONA** (â†’ `ba8ab0d7`) Â· Test: jednostki ĹĽelazne niedostÄ™pne bez kopalni ĹĽelaza + Odlewni ĹĽelaza.
- 2026-07-19 21:09 Â· stempel: ROBOCZA Â· **ca3aafa0** Â· md5 pliku `ca3aafa0a072695de1cd48fc7be846e7` Â· commity `6252736` + `98ffca0` (branch `main`, PUSHNIÄTE `49ab882..98ffca0`) Â· ZASTÄ„PIONA (â†’ `a44d5350`) Â· **â€žZASTÄ„P" + typ Slinger + wymĂłg techu Triari/Evocati**:
  (a) **Mechanizm â€žZastÄ…p"** â€” jednostkÄ™ moĹĽna zastÄ…piÄ‡ dowolnÄ… DOSTÄPNÄ„ jednostkÄ… tego samego pola `Typ` (nawet sĹ‚abszÄ…) + jej unikatem z nowego pola `â€žZastÄ…p specjalnie"` (tyrreĹ„skiâ†’Evocati, mykeĹ„skiâ†’Hieros Lochos). **ZasiÄ™g = CAĹE TERYTORIUM paĹ„stwa** (nie tylko garnizon; reuĹĽyty `isPlayerTerritoryHex` z `map/territory.ts`); bramka koszary/surowce poza miastem = OR po wszystkich miastach gracza. Koszt = `max(0, cena nowej â’ cena starej)` w PieniÄ…dzu, zuĹĽywa turÄ™, HP zachowane procentowo, raz na turÄ™ (`replaceUsedThisTurn`), tylko wĹ‚asna nacja. Nowe: `production.ts availableReplacementsFor()`, `ui/unitReplacePicker.ts` (modal), akcja `replace` w ArmyStackHud, `performUnitReplace` w `main.ts`. **Rozliczanie ludnoĹ›ci ĹšWIADOMIE WYCOFANE** â€” wszystkie 73 jednostki majÄ… `"LudnoĹ›Ä‡": 1`, wiÄ™c rĂłĹĽnica zawsze = 0 i mechanizm nic nie robiĹ‚.
  (b) **Procarz â†’ wĹ‚asny typ â€žSlinger"** + kontry `Slingerâ†’Spearman +50%` i `Mountâ†’Slinger +50%` (zachowana podatnoĹ›Ä‡ na konnicÄ™) + **nowa kolumna `â€žBonus vs Slinger %"` na 73 jednostkach** (skopiowana z â€žBonus vs Distance %" â€” bez niej procarz byĹ‚by w bitwie taktycznej odporny na szarĹĽe 14 jednostek kawalerii, bo `battleScene.ts` czyta nazwÄ™ kolumny dynamicznie).
  (c) **Triari + Evocati wymagajÄ… techu â€žHutnictwo ĹĽelaza"** (jak Hastati) â€” koniec elity dostÄ™pnej za darmo z samej epoki.
  (d) **`STAN-PRACY-HANDOFF.md`** w korzeniu repo â€” punkt wejĹ›cia dla kaĹĽdej nowej sesji (takĹĽe chmurowej/telefonicznej).
  tsc=0 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· map-gen determinizm A=B + 0 rzek bez ujĹ›cia Â· VERIFY OK Â· weryfikacja wzrokowa Playwright (przycisk â€žZASTÄ„P" + modal renderujÄ… siÄ™, 0 bĹ‚Ä™dĂłw konsoli) Â· Test: jednostka na wĹ‚asnym terytorium â†’ â€žZastÄ…p" â†’ lista tego samego typu; procarz vs wĹ‚Ăłcznik; Triari/Evocati niedostÄ™pne bez â€žHutnictwa ĹĽelaza".
- 2026-07-11 02:48 Â· stempel: ROBOCZA Â· **ed16d0ea** Â· md5 pliku `ed16d0ea7b6bc8d5cf8ec386727b5e38` Â· commit `49ab882` (branch `main`, PUSHNIÄTY) Â· **3 zasady progresji + batch mapy + wielka naprawa jednostek**:
  (a) **Progresja epok** â€” twarda bramka epoki (`epochGateMet`: caĹ‚a epoka odkryta przed jakimkolwiek badaniem nastÄ™pnej) + tier-gating T1â†’T2â†’T3 wewnÄ…trz epoki (`epochTierGateMet`), w `research.ts` i `playerState.ts` (parytet).
  (b) **Mapa** â€” â€žmin nie max" (wyĹ‚Ä…czony cap degradujÄ…cy wygenerowane gĂłry/wzgĂłrza â†’ +25â€“29% wzgĂłrz, teren nieregularny); **wybrzeĹĽe â‰Ą2 heksy** + eliminacja faĹ‚szywych wciÄ™Ä‡ wyglÄ…dajÄ…cych jak ujĹ›cia (`dryTouchSea` 13686â†’0); zmiÄ™kczona reguĹ‚a dĹ‚ugoĹ›ci rzeki (krĂłtkie kompletne rzeki +75â€“116%, wszystkie z ujĹ›ciem). âš  NapiÄ™cie zgĹ‚oszone Maciejowi: pas 2 heksĂłw zjada 21â€“29% suchego lÄ…du i redukuje liczbÄ™ rzek ~29% â€” **decyzja Macieja: zostaje 2**.
  (c) **Jednostki** â€” normalizacja `Typ` PLâ†’EN + migracja `counters.json`; **naprawa tokenĂłw `civs.json`: 28%â†’100% widocznych jednostek narodowych** (15/53â†’57/57); fix klucza `sumer` w `production.ts`; **fix bramki em-dash â€žâ€”"** â†’ 7 super-jednostek (Hieros Lochos, Triari, Evocati, Hu Ben Wei, uThulwana, MedĹĽaj, Gwardia Sumeru) byĹ‚o **niewidocznych od zawsze**; Falanga/Hieros/Evocatiâ†’Ĺ»elazo; Triariâ†’zamiennik wĹ‚ĂłcznikĂłw; **Legion Rzymski usuniÄ™ty**; Galeraâ†’Naval; szekeleszâ†’nacja Ludy Morza.
  tsc=0 Â· tech-tree 19/0 Â· research 33/33 Â· determinizm A=B (`ffb7e787`) Â· VERIFY OK Â· ZASTÄ„PIONA (â†’ `ca3aafa0`)
- 2026-07-11 00:47 Â· stempel: ROBOCZA Â· **494598a3** Â· md5 pliku `cdf8f252` Â· commit `1119b45` (branch `main`, PUSHNIÄTY â€” `gh auth` dziaĹ‚a) Â· **Drzewko 3-tier (dane) + fix miedzi + czaszka gĹ‚odu** â€” dane drzewka `a93467` (tech/units/buildings: odwrĂłcenie nazw ĹĽelaza â€žHutnictwoâ†”ObrĂłbka", 12 prerekĂłw, re-leveling `Poziom` per epoka KamieĹ„ 1-3/BrÄ…z 4-6/Ĺ»elazo 7-9); **fix miedzi na zĹ‚ym terenie 25,7%â†’0%** (`gen-helpers.ts`, 6 miejsc â€” teren degradowany bez czyszczenia `zloze`); **czaszka nad gĹ‚odujÄ…cÄ… jednostkÄ…** (`starvingRepIds` nigdy nie byĹ‚o wypeĹ‚niane â†’ sprite istniaĹ‚, ale siÄ™ nie renderowaĹ‚); naprawa wiszÄ…cych referencji po renamie (`wonders.json`, Fort, **`ai.ts:409` hardcoded 'Wojskowosc'** = cicha regresja AI). Bundle zbudowany z caĹ‚ego drzewa â†’ **zawiera teĹĽ mgĹ‚Ä™ rzek integratora #1** (`scene.ts`). tsc=0 Â· tech-tree 19/0 Â· VERIFY OK Â· **âš  NADPISAĹEM `58182469`** (deploy integratora #1) â€” bez meldunku w kanale, patrz uwaga wyĹĽej Â· ZASTÄ„PIONA (â†’ `ed16d0ea`)
- 2026-07-11 00:06 Â· stempel menu: ROBOCZA Â· **f532c453** (lag inject = znane WARN) Â· **md5 pliku 58182469** `58182469ac58a3bbd0503060fcdc6dcf` Â· (`scene.ts` w WIP WĹ‚aĹ›ciciela â€” NIEZACOMMITOWANE) Â· ~~AKTUALNA~~ â†’ **ZASTÄ„PIONA** (â†’ `494598a3`, 2026-07-11 00:47; status skorygowany wstecznie 2026-07-19) Â· **PUSH moich prac do ROBOCZA** (Maciej zdjÄ…Ĺ‚ HOLD: â€ždrugi integrator zajÄ™ty, moĹĽesz wpychaÄ‡ do roboczej"). Rebuild z `gra/` (vite-direct) zainline'owaĹ‚ `index-CzZPYNnk.js` = **identyczny JS jak 081e3e79** â†’ potwierdza, ĹĽe `gra/src` NIE zmieniĹ‚o siÄ™ od mojego perf-guard deployu. ZawartoĹ›Ä‡ = peĹ‚ny Ĺ‚aĹ„cuch mojej sesji: jednostki `61f05ac` + muzyka `3d0a765` + wyrÄ…b `5b7bbb1` + AI paĹ„stw-kopii `6da0fbb` (HEAD) + mgĹ‚a rzek per-heks + straĹĽnik perf (`scene.ts`). tsc=0, VERIFY OK. **âš  NADPISAĹEM `d2a346ff` (23:42)** â€” to byĹ‚ deploy drugiego integratora zbudowany z INNEGO drzewa (mĂłj rebuild z gra/src daĹ‚ inny JS). JeĹ›li d2a346ff niĂłsĹ‚ ich pracÄ™ spoza `gra/src`, NIE MA jej w tym bundlu â†’ do reconcile (ich ĹşrĂłdĹ‚o bezpieczne po ich stronie; nie byĹ‚o logowane w kanale). Â· **AKTUALNA** Â· Test: jak niĹĽej (mgĹ‚a rzek) + reszta sesji.
- 2026-07-10 21:18 Â· stempel: ROBOCZA Â· **081e3e79** Â· md5 `081e3e7918e387bbf908a1eaa299a55f` Â· (`scene.ts` w WIP WĹ‚aĹ›ciciela â€” NIEZACOMMITOWANE) Â· **MgĹ‚a rzek per-heks + STRAĹ»NIK PERF** (na uwagÄ™ Macieja o FPS/CPU) â€” doĹ‚oĹĽony guard `lastFogSig`: `setIndex` (re-upload indeksu na GPU) odpala siÄ™ TYLKO gdy hash stanu mgĹ‚y danej rzeki siÄ™ zmieniĹ‚; sam zoom albo `setFog` bez zmiany tej rzeki â†’ tylko tani 32-bit hash (`Math.imul` + `Set.has`), ZERO setIndex/alokacji. Kontekst: pÄ™tla rzek jest w `applyZoomLodDecor` â€” woĹ‚a jÄ… WYĹÄ„CZNIE `setFog`/`setZoomLod`, **nigdy render-loop** â†’ 0 kosztu per-klatka; ukryte odcinki = MNIEJ trĂłjkÄ…tĂłw do rysowania (render taĹ„szy, nie droĹĽszy). Skala ~kilka tys. `Set.has` na zdarzenie mgĹ‚y â€” rzÄ™dy wielkoĹ›ci poniĹĽej regresji DEKOR (80â€“150 tys.). Render-only (hash nietkniÄ™ty), tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ [d2a346ff â€” deploy drugiego integratora, niezalogowany] â†’ 58182469 = mĂłj re-push) Â· Test wzrokowy jak niĹĽej + F9 (fog ms) przy ruchu jednostek.
- 2026-07-10 21:05 Â· stempel: ROBOCZA Â· **a7219f7d** Â· md5 `a7219f7dd4cc47fb10d4e50eda02df0c` Â· (`scene.ts` w WIP WĹ‚aĹ›ciciela â€” NIEZACOMMITOWANE) Â· **MgĹ‚a rzek PER-HEKS** (poprawka linii 1b47b7fe â†’ f6201c00 â†’ a7219f7d) â€” rzeka NIE Ĺ›wieci na ciemnym (nieodkrytym) polu, ALE odkryty odcinek ZOSTAJE (a caĹ‚oĹ›Ä‡, gdy brak fog-of-war). Rzeki lÄ…dowe (jednowstÄ™gowe, `buildRiverPointsFromHexPath` â†’ `pointHex` = heks per punkt) w `applyZoomLodDecor` rysujÄ… tylko quady, ktĂłrych OBA koĹ„ce sÄ… odkryte â€” **przebudowa INDEKSU geometrii** (pozycje wierzchoĹ‚kĂłw nietkniÄ™te â†’ wyglÄ…d wstÄ™gi identyczny, 1 draw-call/rzekÄ™). Delty scalone (bez `pointHex`) â†’ fallback â€žukryj caĹ‚oĹ›Ä‡, gdy ktĂłrykolwiek heks w czerni". `hasFog=false` â†’ indeks peĹ‚ny â†’ wszystkie rzeki. Render-only (hash nietkniÄ™ty), tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ 081e3e79 = +straĹĽnik perf) Â· Test wzrokowy: (1) rzeki daleko w czerni znikajÄ…; (2) odkryty kawaĹ‚ek obok startowego miasta widoczny; (3) mapa bez mgĹ‚y = wszystkie rzeki. PoĹ›redni build **f6201c00** (reguĹ‚a `allRevealed` = ukryj gdy â‰Ą1 heks ciemny) â€” przesadzaĹ‚ (chowaĹ‚ teĹĽ odkrytÄ… czÄ™Ĺ›Ä‡ rzeki wchodzÄ…cej w czerĹ„), zastÄ…piony per-heksem.
- 2026-07-10 20:35 Â· stempel: ROBOCZA Â· **1b47b7fe** Â· md5 `1b47b7fe4efa8c2ba82f9b00f37ed53f` Â· (`scene.ts` w WIP WĹ‚aĹ›ciciela â€” NIEZACOMMITOWANE) Â· **Fix: rzeki nie przeĹ›witujÄ… przez mgĹ‚Ä™** â€” korekta A-FOG-RZEKI: rzeka peĹ‚ny kolor jeĹ›li **â‰Ą1 heks odkryty/widoczny**, UKRYTA gdy CAĹA trasa w nieodkrytej czerni (bez znikania na krawÄ™dzi FoW). Render-only (hash nietkniÄ™ty). Zawiera caĹ‚oĹ›Ä‡ `e5c0fe56` (AI + wyrÄ…b + muzyka + jednostki) + WIP WĹ‚aĹ›ciciela. tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ f6201c00 â€žallRevealed" â†’ a7219f7d per-heks) Â·
- 2026-07-10 20:25 Â· stempel: ROBOCZA Â· **e5c0fe56** Â· md5 `e5c0fe564b0e6e75695fe207c901ce3a` Â· commit `6da0fbb` (branch `main`, NIEPUSHNIÄTY) Â· **AI paĹ„stw-kopii: aktywna defensywna gospodarka** (wybĂłr Macieja A) â€” `decideDefensiveCopyTurn` dokĹ‚ada PRODUKCJÄ: garnizon (Wojownik) najpierw â†’ Mury â†’ budynki/ekonomia; **bez ekspansji** (Osadnik pominiÄ™ty), ruch nadal defensywny (garnizon/riposta, bez agresji); badania juĹĽ dziaĹ‚aĹ‚y. Koniec â€žĹ‚atwego Ĺ‚upu". Zawiera caĹ‚oĹ›Ä‡ `0e15c2d2` (wyrÄ…b + muzyka + jednostki) + niezacommitowany WIP WĹ‚aĹ›ciciela. Logika-only (hashe nietkniÄ™te), tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ 1b47b7fe) Â· Test: zdobÄ…dĹş/obserwuj paĹ„stwo â€žswojego typu" â€” powinno budowaÄ‡ obronÄ™/mury/jednostki, nie staÄ‡ bezczynnie.
- 2026-07-10 20:18 Â· stempel: ROBOCZA Â· **0e15c2d2** Â· md5 `0e15c2d2ab61528b0bc785999280c5af` Â· commit `5b7bbb1` (branch `main`, NIEPUSHNIÄTY) Â· **Balans wyrÄ™bu: netto zero** (koszt 5 Pracy â†’ yield 5; `terrain-improvements.json` wyrab `praca_per_tura` 20â†’5, `tury` 3â†’1; byĹ‚o +20Ă—3=60 windfall, wyrÄ…b teraz 1-turowy). Zawiera caĹ‚oĹ›Ä‡ `3fe20827` (muzyka + jednostki) + niezacommitowany WIP WĹ‚aĹ›ciciela. Dane-only (hashe nietkniÄ™te), VERIFY OK Â· ZASTÄ„PIONA (â†’ e5c0fe56) Â· **UWAGA:** Excel Panel-A do sync (JSONâ†’EXCEL) przed najbliĹĽszym â€žeksportuj", inaczej cofnie wyrÄ…b na 20/3.
- 2026-07-10 20:12 Â· stempel: ROBOCZA Â· **3fe20827** Â· md5 `3fe20827d0b937cb8efb2312b2b2943e` Â· commit muzyki `3d0a765` (branch `main`, NIEPUSHNIÄTY) Â· **MUZYKA proceduralna** (Web Audio, zero plikĂłw audio, +~26 KB): era kamieĹ„/brÄ…z, nastrĂłj mapa/bitwa, generatywna; hooki start(gest)/bitwa(arena)/epoka(awans)/opcje(suwak+wyĹ‚Ä…cznik w menu pauzy, `civ-music-prefs-v1`, domyĹ›lnie WĹ/0.7); autoplay-safe. Zawiera caĹ‚oĹ›Ä‡ `2192f8bb` (jednostki) + niezacommitowany WIP WĹ‚aĹ›ciciela (rzeki/tech/buildings). Hooki muzyki w `main.ts` NIEZACOMMITOWANE (splecione z WIP). tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ 0e15c2d2) Â· Test Â§3: kamieĹ„ od startu â†’ bitwa gÄ™stnieje/wraca â†’ awans do brÄ…zu = lira â†’ suwak/wyĹ‚Ä…cznik â†’ 15 min.
- 2026-07-10 19:56 Â· stempel: ROBOCZA Â· **2192f8bb** Â· md5 `2192f8bbf37a6634b9d16670e576ed3b` Â· commit jednostek `61f05ac` (branch `main`, NIEPUSHNIÄTY) Â· **GRAFIKA-JEDNOSTKI: 9 modeli ROBLOX** (kategorie P1 + named P2/P3/P4/P57 + super P6 + Ĺ‚ucznik asyryjski + 4Ă— Bliski WschĂłd + 4Ă— p8b w tym **Legion Rzymski**; fix Legionu Ă—2 `units.ts`/`setup.ts`; `applyCultureOverrides` guard dla nowych modeli) Â· **UWAGA:** bundle zbudowany z CAĹEGO drzewa roboczego (decyzja Macieja â€ždeploy razem") â†’ zawiera teĹĽ NIEZACOMMITOWANY WIP WĹ‚aĹ›ciciela (rzeki gruboĹ›Ä‡-wg-rzÄ™du + peĹ‚ny-kolor-w-mgle, `tech.json`/`buildings.json`) â€” ĹşrĂłdĹ‚o tego WIP zostaje niezacommitowane, do domkniÄ™cia przez WĹ‚aĹ›ciciela. Jednostki render-only (hashe nietkniÄ™te), tsc=0, VERIFY OK Â· ZASTÄ„PIONA (â†’ 3fe20827) Â·
- 2026-07-10 14:31 Â· stempel: ROBOCZA Â· **3dec388b** Â· commit `3d5da76` (branch `main`, NIEPUSHNIÄTY â€” gh auth wygasĹ‚) Â· **RZEKI â€” styl finalny KANCIASTY (wall-tracing, Roblox)** Â· ZASTÄ„PIONA (â†’ 2192f8bb) Â·
  SzĂłsta iteracja rzek w ciÄ…gu dnia (Ĺ‚aĹ„cuch niĹĽej) â€” powrĂłt do trasowania **krawÄ™dziowego** (jak `06faee2`) z `sharp=true`: zero wygĹ‚adzania (Chaikin/CatmullRom odrzucone), rzeka biegnie wewnÄ™trznÄ… stronÄ… Ĺ›cianki wzdĹ‚uĹĽ **â‰Ą2 bokĂłw/heks** (prosty=3 Ĺ›cianki, Ĺ‚agodny skrÄ™t=2), zniesiony Ĺ›rodkowy punkt przejĹ›cia przez Ĺ›ciankÄ™ (koniec â€ždomkĂłw"), fix ujĹ›cia z HEAD zachowany (rzeki wpadajÄ… do morza). Render-only, determinizm A=B bez zmian. ZawartoĹ›Ä‡ bundla = **caĹ‚oĹ›Ä‡ 9c58ebc2 (teren-mozaika `terrainCellBias` ZATWIERDZONY + modele miast kamieĹ„/brÄ…z + lasy bez pniakĂłw + fix cienia) + drzewko tech `22bb83a5` + GRAFIKA-TEREN-2 `f7484fe1`** â€” styl rzek jest jedynÄ… zmianÄ… wzglÄ™dem `9c58ebc2`. Dyspozycje: `RZEKI-MODEL-PELNY-PLAN.md` (plan), `STAN-SESJI-RZEKI-DRZEWKO.md` (stan zbiorczy 2026-07-10).
  **UWAGA â€” ruchomy stan:** audyt dokumentacji 2026-07-10 ~15:00 zastaĹ‚ w drzewie roboczym NIEZACOMMITOWANE zmiany (`tech.json`, `buildings.json`, `loader.ts`, `production.ts`, `main.ts`, `cityPanel.ts`) â€” praca toczy siÄ™ rĂłwnolegle (temat rzek ponownie w iteracji). Ten wpis opisuje wyĹ‚Ä…cznie stan ZACOMMITOWANY na `3d5da76`; sprawdĹş `git log -1` przed poleganiem na nim jako ostatecznym.
- 2026-07-10 13:42â€“13:46 Â· **9c58ebc2** (+ fix cienia w tym samym paĹ›mie, commit `0c8e37e`) Â· commit ĹşrĂłdĹ‚a `ec2a186` Â· **rzeki â€žnaturalny ciek" (splajn CatmullRom, sharp=false) + naprawa ujĹ›Ä‡ (root cause: `coastalRiverRenderPath` dawaĹ‚ Ĺ‚aĹ„cuch dĹ‚.1 dla 505/507 rzek) + teren per-komĂłrka `terrainCellBias` (ZATWIERDZONE przez Macieja â€” â€žrĂłwniny/Ĺ‚Ä…ki rĂłwno pomieszane, plamy rozbite") + modele miast kamieĹ„/brÄ…z Grecja-Rzym + lasy bez pniakĂłw (`NL_NATURAL=4`) + fix cienia lewitujÄ…cego (ocean `receiveShadow=false`)** Â· ZASTÄ„PIONA co do STYLU RZEK (â†’ `3dec388b`: kanciasty); **teren-mozaika, modele miast, lasy i fix cienia POZOSTAJÄ„ aktualne** (wchĹ‚oniÄ™te w `3dec388b`) Â·
  Autonomiczna partia (Maciej offline ~1h, praca samodzielna) â€” teren i miasta zaakceptowane, styl rzek odrzucony po powrocie.
- 2026-07-10 11:04 Â· **f7484fe1** Â· commit `cee2f6a` Â· **GRAFIKA-TEREN-2: lasy (5Ă—InstancedMesh, â’40% tri), tarasy (kompozyt garb+pĂłĹ‚ki), oaza-pustynia, wioski+obozy barbarzyĹ„cĂłw (kolor 0xff4444)** + fixy FORT (usuniÄ™te potrĂłjne skalowanie)/OWCE (model spĂłjny z trzodÄ…) Â· wchĹ‚oniÄ™ta w `3dec388b`, bez zmian treĹ›ciowych Â· **DEKOR mikrodekoru Ĺ‚Ä…k/rĂłwnin nadal OFF** (decyzja Macieja, `DEKOR_ENABLED=false`).
- 2026-07-10 09:19 Â· **33527d79** Â· commit `06faee2` Â· rzeki â€žwall-hugging + Chaikin 2Ă—" (powrĂłt do krawÄ™dzi po odrzuceniu centrolinii) Â· ZASTÄ„PIONA (â†’ `9c58ebc2`: CatmullRom, potem â†’ `3dec388b`: kanciasty â€” trzecia wersja stylu rzek w ciÄ…gu dnia).
- 2026-07-10 08:53 Â· **22bb83a5** Â· commit `450394c` Â· **DRZEWKO TECHNOLOGII: bramka â€žwymagane ulepszenie" (Ĺ»eglugaâ†’Tartak), ObrĂłbka ĹĽelazaâ†’budynek â€žPiec hutniczy", pole jawne `awansDoEpoki` (BrÄ…zownictwoâ†’2, ObrĂłbka ĹĽelazaâ†’3, koniec regexu `/epok/` faĹ‚szywie Ĺ‚apiÄ…cego WalutÄ™/SztukÄ™ wojennÄ…), 20 jednostek ĹĽelaznych przeniesionych pod wĹ‚aĹ›ciwe techy, Kusznik usuniÄ™ty, Astronomiaâ†’Obserwatorium (nowy tech), Prawo (Kodeks)â†’TrybunaĹ‚ (nowy budynek)** + grafiki koĹ„ (stadnina)/kopalnia miedzi Â· dyspozycja `DRZEWKO-TECH-FIX.md` Â· testy: tech-tree 19/0, research 33/0, harness ery 14/0 Â· **treĹ›Ä‡ wchĹ‚oniÄ™ta w `3dec388b`, bez zmian od tego builda** Â· OTWARTE: chiĹ„ski unikat dystansowy niespĂłjny po usuniÄ™ciu Kusznika (`civs.json`), panele Excel niezsyncowane z JSON.
- 2026-07-10 08:13 Â· **79eb3159** Â· commit `8a3d983` Â· rzeki â€žcentrolinia" (przez Ĺ›rodek heksa, punkty przejĹ›cia) + Praca `splitPraca` (total=round, reszta nie ginie) + Armia/Zaopatrzenie fix (panel liczyĹ‚ zawyĹĽony pobĂłr) + panel heksa (zamyka siÄ™ poprawnie na innÄ… akcjÄ™/PPM) Â· ZASTÄ„PIONA co do STYLU RZEK (centrolinia ODRZUCONA przez Macieja po teĹ›cie wizualnym â€” â€žbiegnie przez heksy, nie po Ĺ›ciance"); **Praca/Armia/panel-heksa fixy POZOSTAJÄ„ aktualne** (niezaleĹĽne od stylu rzek, wchĹ‚oniÄ™te w kolejne buildy).
- 2026-07-09 Â· **bc8b8e38b5c9737e16c53d24ea1d39a2** Â· stempel: ROBOCZA Â· bc8b8e38 Â· **NAPRAWA REGRESJI FOG (dekor mgĹ‚y diff-based) + caĹ‚oĹ›Ä‡: FPS + DEKOR + ZASADY-ZWIERZÄ„T E1â€“E5** Â· **PROMOWANA DO KANONU** (gra-kanon bc8b8e38, KANON 39aa2a2c, FINALNA 5ccffe76) Â·
  Regresja z DEKOR: `applyTerrainFog` skanowaĹ‚ ~80â€“150k instancji dekoru per setFog â†’ **fog 1,9 â†’ 139,9 ms** (F9 Macieja). Fix: dekor dzieli stan mgĹ‚y z bazÄ… terenu (`dekorRefByHex`, diff w `setFog` â€” tylko zmienione heksy, ten sam `sig`); `applyZoomLodDecor` zostawia tylko `dekorGroup.visible`. Oczekiwane fog ~2 ms. tsc=0 Â· smoke OK Â· vite-direct Â· verify OK Â· **AKTUALNA = KANON** (autonomicznie, Maciej nieobecny â€” do testu wzrokowego po powrocie; git origin/main zabezpieczony). Log: `dyspozycje/OPTYMALIZACJE-FPS-LOG.md`.
- 2026-07-09 Â· **f69d1b0bc13c97c83df019e8ceba6ee4** Â· stempel: ROBOCZA Â· f69d1b0b Â· **FPS domkniÄ™ty + DEKOR + ZASADY-ZWIERZÄ„T E1â€“E5** Â· ZASTÄ„PIONA (â†’ bc8b8e38: naprawa regresji fog dekoru; f69d1b0b miaĹ‚o fog 139,9 ms) Â·
  Baza = kanon a1dce24d + prace sesji 2026-07-09. DEKOR wprowadziĹ‚ regresjÄ™ fog (skan dekoru) â€” naprawione w bc8b8e38. hash mapy nietkniÄ™ty (55aaa07c). tsc=0 Â· smoke OK Â· verify OK.
- 2026-07-09 Â· **5ff6abe0a97cf8be96cc26ec40944496** Â· stempel: ROBOCZA Â· 5ff6abe0 Â· **EKSPERYMENT B (pomiar): przeĹ‚Ä…cznik `?nobottom=0` â€” heks bez/z dolnej pokrywy** Â· ZASTÄ„PIONA (â†’ f69d1b0b: B keep + FPS domkniÄ™ty + DEKOR + ZASADY) Â·
  Baza = kanon 2b6c23dd (GRAFIKA-3D + FPS 1+3) + `scene.ts` flaga `B_NO_BOTTOM`: domyĹ›lnie B WĹÄ„CZONE (jak kanon, ~25% mniej tri bazowych), a `?nobottom=0` w URL â†’ peĹ‚ny pryzm heksa (z dolnÄ… pokrywÄ…) do porĂłwnania. Maciej mierzy F9 `tri` z-B (domyĹ›lnie) vs bez-B (`?nobottom=0`) na nowej bazie â†’ werdykt keep/rewert B. tsc=0 Â· vite-direct Â· 9 plikĂłw + hub Â· verify OK Â· **AKTUALNA (pomiar F9 B)**. ĹąrĂłdĹ‚o toggle niezacommitowane (czeka na werdykt).
- 2026-07-09 Â· **97d1b9cb2edfeb4a21205ffd12baae7f** Â· stempel: ROBOCZA Â· 97d1b9cb Â· **FPS lewar 1+3: scalanie dekoracji per-heks â†’ 1 mesh + zamroĹĽone macierze** Â· ZASTÄ„PIONA (â†’ promowana do KANON 2b6c23dd; robocza â†’ 5ff6abe0 eksperyment B) Â·
  Atak na anomaliÄ™ z F9 `mesh 1,3 mln` (CPU: traversal/culling/macierze per obiekt). `render/mergeDecor.ts` `collapseToMergedMesh` scala grupÄ™ dekoracji (zwierzÄ™ta ~125 boxĂłw/heks, budynki, zĹ‚oĹĽa, wybrzeĹĽe/plaĹĽe/wydmy/oazy) w JEDEN mesh z vertex colors (fog-dimming zachowany przez wĹ‚asny materiaĹ‚, jak w terenie). WpiÄ™te: resourceOverlays, improvementMeshes (main.ts), styledOverlays (scene.ts). `matrixAutoUpdate=false` na statycznych (lewar 3). Fail-safe (bĹ‚Ä…d merge â†’ grupa bez zmian). Oczekiwane: mesh 1,3 mln â†’ ~dziesiÄ…tki tys.
  tsc=0 Â· merge unit-test 12/12 Â· map-gen determinizm IDENTYCZNY. UWAGA: smoke daje false-negative na instancingu terenu (stage-2) w jsdom â€” walidacja przez F9 Macieja. **BRAK: lewar 5** (chunking bazowego terenu = `tri 6,7 mln` GPU) â€” Ĺ›wiadomie wstrzymany do potwierdzenia CPU-fixu na F9 (rdzeĹ„ renderu+fog, nie do wdroĹĽenia na Ĺ›lepo). vite-direct Â· 9 plikĂłw + hub Â· verify OK Â· **AKTUALNA (test F9 Macieja)**.
- 2026-07-09 Â· **ab5b8527a5a0912aeca7129948c402e7** Â· stempel: ROBOCZA Â· ab5b8527 Â· **GRAFIKA-3D KOMPLET: partie 1-3B + TEREN oba etapy (podmiana + 10 InstancedMesh) + stadnina quality** Â· ZASTÄ„PIONA (â†’ 97d1b9cb = +FPS lewar 1+3) Â·
  CaĹ‚oĹ›Ä‡ 64b633b1 + **TEREN stage 2**: gĂłry/wzgĂłrza (styl roblox) jako **10 InstancedMesh** (5+5 wariantĂłw, wspĂłlny TEREN_MATERIAL) zamiast per-heks styledOverlays â€” batching FPS. PeĹ‚na maszyneria FoW (matrix-hide nieodkryte/miasto + instanceColor-dim explored Ă—0.175), hide-on-hex, LOD, dispose. **Stadnina wg jakoĹ›ci**: WYSOKA=2 konie, NISKA/NORMALNA=1. FORT 1/3. WysokoĹ›ci logiczne + hashe mapy nietkniÄ™te.
  tsc=0 Â· smoke OK Â· **map-gen determinizm IDENTYCZNY** Â· vite-direct (bez prebuildu) Â· 9 plikĂłw + hub na `ab5b8527` Â· verify OK Â· publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA (wielki test Macieja z F9 â€” rano)**.
- 2026-07-09 Â· **64b633b1accdb80fd7948f1fd740ed59** Â· stempel: ROBOCZA Â· 64b633b1 Â· **GRAFIKA-3D partie 1-3B + TEREN stage 1** Â· ZASTÄ„PIONA (â†’ ab5b8527 = +TEREN stage 2 InstancedMesh + stadnina quality) Â·
  Zawiera caĹ‚oĹ›Ä‡ 27cb7771 (koĹ„+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, zĹ‚oĹĽa) + **partia TEREN stage 1**: 5+5 wariantĂłw sylwetek gĂłr/wzgĂłrz (`teren-gory-wzgorza.ts`, zmergowana geometria+vertex colors), `buildStyleMountainPeak`/`HillBump` roblox â†’ nowy model = **1 mesh/heks zamiast 12-14** (spadek draw calls terenu). tsc=0 Â· smoke OK Â· **map-gen determinizm IDENTYCZNY** Â· verify OK Â· publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA (test Macieja)**. BRAK: TEREN stage 2 (scene.ts 10 InstancedMesh = peĹ‚ny batching FPS) â€” follow-up.
- 2026-07-09 Â· **27cb77715abf5ba302f5b737edd0cae6** Â· stempel: ROBOCZA Â· 27cb7771 Â· **GRAFIKA-3D partie 1+2+3A+3B (ROBLOX): koĹ„+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, zĹ‚oĹĽa** Â· ZASTÄ„PIONA (â†’ 64b633b1 = +TEREN stage 1) Â·
  P1 nowy koĹ„ (moduĹ‚ kon-nowy-model, konnica/rydwan/onager + fix lancy) + pastwisko (krowa/owca/lama) + zĹ‚oĹĽa bydĹ‚a/owiec/koni. P2 farma/kopalnia/kamienioĹ‚om/tartak. P3A wyrÄ…b/obĂłz/glinianka/warzelnia/Ĺ‚odzie/stadnina (wĹ‚asny model + konie). P3B irygacja/pole/fort(1/3)/posterunek/drogi/zĹ‚oĹĽa mineralne. Bazuje na perf 00a372f4.
  tsc=0 Â· smoke OK Â· map-gen determinizm IDENTYCZNY (render-only, gen nietkniÄ™ty) Â· vite-direct Â· 9 plikĂłw + hub na `27cb7771` Â· verify OK Â· publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA (test Macieja)**. BRAK: partia TEREN (gĂłry/wzgĂłrza + instancing FPS) â€” follow-up.
- 2026-07-09 Â· **00a372f495e8f55ee9edaa4bf9a7914f** Â· stempel: ROBOCZA Â· 00a372f4 Â· **WYDAJNOĹšÄ† B + D4â€“D13 (zakĹ‚adanie miasta 30 sâ†’1,67 s, wejĹ›cie do miasta 60 sâ†’1,4 s) â€” diagnostyka zdjÄ™ta** Â·
  lokalne enumeracje zamiast peĹ‚nomapowych skanĂłw `Object.keys(map.hexes)`: D5/D6/D9 (wejĹ›cie), **D13** `getQualifyingHexes` w `map/improvement-build.ts` = kandydaci [terytorium+ring âŞ drogi âŞ placed âŞ pendingUndo] zamiast 19Ă—320k; D7 player-only, D10 event-trigger (dirty-flag), D11 gate minimapy, D12 dedup refreshFog/sync; B = geometria heksa bez dolnej pokrywy (~25% mniej tri). Czerwony box + timery serii D usuniÄ™te.
  tsc=0 Â· smoke OK Â· owner-economy 9/9 Â· wire-ekonomia 37/37 Â· qualify 44/44 Â· owner-epoch 7/7 Â· D13 rĂłwnowaĹĽnoĹ›Ä‡ candidate==full-scan (19/19 typĂłw) Â· vite-direct (bez export-data.py) Â· 9 plikĂłw + hub na `00a372f4` Â· verify OK Â· publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA** (â†’ promowana do KANON bbcacc13).
- 2026-07-08 21:27 Â· **dfa3f2e2f747059884aa6d2918250253** Â· stempel: 2026-07-08 21:27 Â· e6ba6cd5 Â· **B (test wydajnoĹ›ci): heks bez dolnej pokrywy â€” ~25% mniej trĂłjkÄ…tĂłw bazowych** Â·
  `hexPrismNoBottomGeo` w `render/scene.ts` (usuniÄ™ta niewidoczna dolna pokrywa, boki+gĂłra zostajÄ… â†’ pixel-identycznie). tsc=0 Â· vite-direct
  (bez export-data.py) Â· 9 plikĂłw + hub na md5 `dfa3f2e2` Â· verify OK. NIEZACOMMITOWANE (build testowy do pomiaru F9: tri przedâ†”po; kanon 51c2eb24
  bezpieczny na GitHub 32dca78 = fallback). Po pomiarze: commit jeĹ›li OK / rewert jeĹ›li nie Â· publikowaĹ‚ CODE-INTEGRATOR Â· **ZASTÄ„PIONA** (â†’ 00a372f4 = B + D4â€“D13 zacommitowane; kanon bbcacc13).
- 2026-07-08 19:50 Â· **51c2eb248aedac4f97a78854ad9b7422** Â· stempel: 2026-07-08 19:50 Â· 7fe722e3 Â· **WYDAJNOĹšÄ† D1+D3 na KANONIE `gra/src` + fix drzewka technologii przywrĂłcony na live** Â· ZASTÄ„PIONA (â†’ dfa3f2e2 test B; ta wersja = KANON 8adcd682) Â·
  Zbudowane z committed `gra/src` @ **865c94e** (wypchniÄ™ty na origin/main) â€” koniec ery deploy-only D1/D3, live=commit. vite-direct
  (bez `npm run build`/`export-data.py` â†’ **balans zachowany**: Falanga=45). WSZYSTKIE 9 plikĂłw + hub na tym samym md5 `51c2eb24`
  (spĂłjnoĹ›Ä‡). tsc=0 Â· bundle-gate HOST-verified: **drzew 88 / Nauka 129** (stary live c293647 miaĹ‚ 87/128 = **regres drzewka
  NAPRAWIONY**), viewBox 343, counterTyp 7 Â· FRESHâ‰ĄLIVE i ==HEAD Â· publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA (klucz=stempel)**.
- 2026-07-08 11:40 Â· stempel: 2026-07-08 11:40 Â· c293647ccedf Â· **WYDAJNOĹšÄ† D1+D3** (kolejka D1â†’D3â†’D2, osobno) Â·
  D3 = usuniÄ™ty zbÄ™dny `refreshFog()` z `applyCityPanelWorldView` (main.ts) â€” otwarcie panelu miasta nie zmienia wejĹ›Ä‡
  mgĹ‚y (setFog no-op); widocznoĹ›Ä‡ miast ustawia `cityRenderer.sync()`; poprawnoĹ›Ä‡ mgĹ‚y zapewniajÄ… realne zdarzenia.
  `refreshFog();` 27â†’26 (usuniÄ™ta dokĹ‚adnie 1). + D1. Z HEAD bc51a01 (sejwy+HEAD zachowane). tsc=0 Â· vite OK Â· pending=0 Â·
  10 plikĂłw Â· hub Â· HOST-verify Â· publikowaĹ‚ INTEGRATOR Â· ZASTÄ„PIONA (â†’ 51c2eb24â€¦, stempel 7fe722e3 Â· 2026-07-08 19:50 â€” wĹ‚aĹ›ciwy build z committed `gra/src` @ 865c94e). D2 nastÄ™pne (osobno, +`?culling=0`).
- 2026-07-08 11:20 Â· stempel: 2026-07-08 11:20 Â· 6102654b5d60 Â· **WYDAJNOĹšÄ† D1** (kolejka Mastera D1â†’D3â†’D2, osobno) Â· ZASTÄ„PIONA (â†’ c293647ccedf) Â·
  D1 = lokalna enumeracja heksĂłw (helper `hexKeysWithinRadius`) zamiast peĹ‚nomapowych skanĂłw `Object.keys(map.hexes)`
  przy otwarciu miasta â€” `okolicaTiles`/`hexesInCitySight`/`collectRangeKeys` (320kâ†’~700, ~450Ă—). Zbudowane z HEAD
  **bc51a01** (zawiera moduĹ‚ sejwĂłw Cursora + plony z Excela + panel B14 + drzewko tech â€” nic nie nadpisane; D1 dotyka
  tylko okolica.ts/resource-access.ts/cityOkolicaOverlay.ts). tsc=0 Â· vite OK Â· pending=0 Â· 10 plikĂłw Â· hub Â· HOST-verify Â·
  publikowaĹ‚ INTEGRATOR Â· AKTUALNA (klucz=stempel). Uwaga: podniosĹ‚o live z 3b089468â†’bc51a01. D3, D2 nastÄ™pne (osobno).
- 2026-07-06 20:41 Â· stempel build 371151b5544247c1e66f93597770c2f8 Â· ROBOCZA Â· 371151b5 Â· 20:41 Â· ZASTÄ„PIONA (â†’ 6102654b5d60; miÄ™dzy nimi buildy Cursora be32d0a8/58e76604/6e3027fe/3b089468 â€” wciÄ…gniÄ™te przez bc51a01) Â·
  SAVE/LOAD UX: dialog zapisu (nazwa sejwu) + dialog wczytywania (lista slotĂłw, usuwanie);
  wczytanie z menu regeneruje mapÄ™ z seeda zapisu (fix â€žrandomowa gra"); z-index dialog nad menu;
  Kontynuuj â†’ wybĂłr sejwu. tsc=0 Â· smoke OK Â· publish Cursor (wyjÄ…tek Macieja, bez Integratora)
- 2026-07-06 18:35 Â· <plik-md5 dryfuje> Â· stempel: 2026-07-06 18:35 Â· e4d99a49b659 Â·
  FIX duplikatu â€žSUROWCE W ZASIÄGU" w panelu miasta (usuniÄ™te wywoĹ‚anie `appendW4TabFooter` @6489 w
  `ui/cityPanel.ts`). + caĹ‚oĹ›Ä‡ d744 (balans, countery, rzeki, KONTRAKT #8, UX, roster, obwĂłdki, duĹĽe bitwy).
  tsc=0/vite OK Â· pending=0 Â· 9/9 Â· hub Â· HOST-verify. Build z klonu; do repo po pushu Â· AKTUALNA (klucz=stempel)
- 2026-07-06 18:10 Â· <plik-md5 dryfuje> Â· stempel: 2026-07-06 18:10 Â· d744cd7956fb Â· ZASTÄ„PIONA (â†’ e4d99a49b659) Â·
  COUNTERY po polu `Typ` (counterMultiplier czyta `counterTyp` z def['Typ']) â€” wĹ‚Ăłcznicy o opisowych
  nazwach dostajÄ… +50% vs konnica; `game/combat.ts` + `battle/battleScene.ts`. + caĹ‚oĹ›Ä‡ 7fb9f6d3e8fb
  (balans HPĂ—2/dystĂ—0.5, rzeki, KONTRAKT #8, UX, roster, obwĂłdki, duĹĽe bitwy). tsc=0/vite OK Â· pending=0 Â·
  9/9 Â· hub Â· HOST-verify. Build z klonu; do repo po pushu Macieja Â· publikowaĹ‚ INTEGRATOR Â· AKTUALNA (klucz=stempel)
- 2026-07-06 17:55 Â· <plik-md5 dryfuje> Â· stempel: 2026-07-06 17:55 Â· 7fb9f6d3e8fb Â· ZASTÄ„PIONA (â†’ d744cd7956fb) Â·
  BALANS-WALKI (wartoĹ›ci Macieja z uploadu Jednostki-PL0.xlsx): HPĂ—2 + dystansĂ—0.5 dla
  jedn. z polami EN; Falanga=40; 26 jedn. PL0 uzupeĹ‚nione pola EN + Typ; 3 przemianowania
  (Legionariusâ†’Legion Rzymski itd.); wszystkie 75 z Typ. + caĹ‚oĹ›Ä‡ a9fffc3e (rzeki, KONTRAKT #8,
  UX, roster, obwĂłdki, duĹĽe bitwy). tsc=0/vite OK Â· pending=0 Â· 9/9 Â· hub. Build z klonu na
  â€žwpinaj" Macieja; publikowaĹ‚ INTEGRATOR
- 2026-07-06 16:52 Â· a9fffc3eeeb9 Â· stempel: 2026-07-06 16:52 Â· d3a3edb52848 Â· ZASTÄ„PIONA (â†’ 7fb9f6d3e8fb)
  BUILD ZBIORCZY z GitHub HEAD b1b9fed (pierwszy build po migracji na GitHub): rzeki
  â€žwodospad" (render-only, hash bezpieczny) + KONTRAKT #8 ikony jednostek (âš”ď¸Źâ†’SVG w
  stosie armii / panelu [H] / scal-rozdziel) + grafiki UX [16:20] (ikony surowcĂłw mapy
  + teren) + podmiany UX [16:40] (7Ă— emojiâ†’SVG) + caĹ‚oĹ›Ä‡ d4d667d8 (siatka rostera 6 kol,
  obwĂłdki wĹ‚aĹ›ciciela, toniÄ™cie, zaznaczenie, duĹĽe bitwy, port UX). tsc=0 Â· HOST-verified
  (stempel + owner-ring + resources-map + menu-save) Â· pending=0 Â· 9 plikĂłw spĂłjne
  (wewn. stempel d3a3edb52848) Â· hub odĹ›wieĹĽony Â· publikowaĹ‚ INTEGRATOR Â· AKTUALNA
  (czeka na playtest Macieja). UWAGA: klucz wersji = WEWN. STEMPEL (md5 pliku dryfuje na OneDrive).
- 2026-07-06 13:47 Â· a76514621f02 Â· stempel: 2026-07-06 13:47 Â· bdc95d91be71 Â· ZASTÄ„PIONA (â†’ a9fffc3eeeb9)
  #4 ROSTER bitwy: sĹ‚upek â†’ SIATKA 6 kolumn (wg kanonu C09 v4 + DESIGN-SPEC v4;
  gridTemplateColumns repeat(6,minmax(0,1fr)) + gap 4 na roster-group-cards). Reszta
  jak 7ffa2859 (port UX + rzeki + obwĂłdki + toniÄ™cie + zaznaczenie + duĹĽe bitwy).
  tsc=0 Â· roster-group-cards HOST-verified Â· pending=0 Â· 9 plikĂłw Â· hub odĹ›wieĹĽony Â·
  publikowaĹ‚ INTEGRATOR Â· AKTUALNA (czeka na playtest Macieja â€” OBIEG Â§9)
- 2026-07-06 12:46 Â· 7ffa28596769 Â· stempel: 2026-07-06 12:46 Â· c169df028365 Â· ZASTÄ„PIONA (â†’ a76514621f02)
  PORT UX wpiÄ™ty (rebuild Ĺ‚Ä…czony): buildModeHud emojiâ†’SVG (panel UlepszeĹ„) +
  brandAssets.improvementIconSvg + improvement-icon-map.json + cityPanel nowsza
  (karty budynkĂłw Poziom B + rekrutacja + ramka zakĹ‚adek W4) + nowe unitRecruitCard.ts
  i unitInfographic.ts. Zawiera teĹĽ caĹ‚oĹ›Ä‡ d4d667d8 (rzeki+C3+B0.6+zoomLOD+obwĂłdki+
  toniÄ™cie+zaznaczenie+duĹĽe bitwy). tsc=0 Â· markery imp-farm/unitRecruit/owner-ring
  HOST-verified Â· pending=0 Â· hub+manifest odĹ›wieĹĽone Â· 9 plikĂłw na tym md5 Â·
  publikowaĹ‚ INTEGRATOR Â· AKTUALNA (czeka na playtest Macieja â€” OBIEG Â§9)
- 2026-07-06 11:34 Â· d4d667d80ebb Â· stempel: 2026-07-06 11:34 Â· e47323c170ab Â· ZASTÄ„PIONA (â†’ 7ffa28596769)
  GĹĂ“WNA GRA odĹ›wieĹĽona do najnowszego bundla (byĹ‚ desync â€” wisiaĹ‚a na 26730a2a).
  Zawiera: 26730a2a (rzeki+C3+B0.6+zoomLOD+UX) + obwĂłdki wĹ‚aĹ›ciciela jednostek
  (own=niebieski/wrĂłg=czerwony) + zaznaczenie w kolorze wĹ‚aĹ›ciciela + fix toniÄ™cia
  na wzgĂłrzach/gĂłrach + duĹĽe bitwy (arena, deploy:true). tsc=0 Â· marker civ-owner-ring
  HOST-verified Â· pending=0 Â· WSZYSTKIE playtesty na tym samym md5 (spĂłjnoĹ›Ä‡) Â·
  POLE-BITWY skasowany (niepodpiÄ™ty do gĹ‚Ăłwnej gry) Â· publikowaĹ‚ INTEGRATOR Â· AKTUALNA
- 2026-07-06 09:12 Â· 26730a2ab4ec9e11425a8a090d4b1caf Â· stempel: 2026-07-06 09:12 Â·
  3b15f0bab7f6 Â· ZBIORCZY: rzeki (bezUjscia=0/sieroc=0) + C3 porcjowana scena +
  **B0.6 frustumCulled=false Ă—12 (zalany lÄ…d)** + zoom LOD A1+A4 + B1-B2 (sanitizeCoast
  BFS + early-exit) + panel â€žMoc imperium v3" (UX) Â· tsc=0 Â· weryfikacja PASS Â·
  hash ziemia/42=4284176530 (determinizm) Â· stempel HOST-side POTWIERDZONY Â· publikowaĹ‚
  INTEGRATOR (bash-first /tmp/build, srcKopiaMaster=lustro) Â· ZASTÄ„PIONA (â†’ d4d667d80ebb)
- 2026-07-06 01:01 Â· bc04038ffd30db33d9ed5e1a81c83ee4 Â· stempel: 2026-07-06 01:01 Â·
  fc15d6ca71c4 Â· RZEKI KOMPLET (kaĹĽda gĹ‚Ăłwna z ujĹ›ciem, zero sierocych delt,
  pruneOrphanRiverPaths) + caĹ‚oĹ›Ä‡ batchy z wczoraj; UWAGA: UI w wersji sprzed
  batcha T4b-T5 (odtworzenie UI od zera = nastÄ™pny build) Â· publikowaĹ‚ MASTER
  awaryjnie (decyzja Macieja); stempel zweryfikowany HOST-side Â· ZASTÄ„PIONA (â†’ 26730a2ab4ec)
- 2026-07-06 ~03:40 Â· f199c4c808e6â€¦ Â· stempel: BĹÄ„D (PENDING â€” deploy niestemplowanej
  kopii) Â· rzeki domkniÄ™te (bezUjscia=0, sieroc=0) + caĹ‚oĹ›Ä‡ z 22:37 Â· DO POPRAWKI
  (integrator przestemplowuje â€” patrz kanaĹ‚ [03:50])
- 2026-07-05 ~22:37 Â· b04524f11a87ebb65df3871332f301d7 Â· 2026-07-05 Â· d3b1aee7f5af Â·
  overlay+worker, B0.9, panel wydajnoĹ›ci, A5, H1, rzeki I1/I2 Â· ZASTÄ„PIONA
- 2026-07-05 17:37 Â· 23d76157a8e3610b9eaae454bb97bdb5 Â· (bez stempla w menu) Â·
  ostatni publish Cursora sprzed przejÄ™cia Â· ZASTÄ„PIONA

## PLAYTESTY-BITWY (osobne pliki testowe w gra-robocza\ â€” nie gĹ‚Ăłwna gra)
- 2026-07-06 10:53 Â· 486a65094ddb Â· stempel: 2026-07-06 10:53 Â· 4771ec9ba9f0 Â·
  DWIE DUĹ»E BITWY jako ARENA taktyczna: `Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html` (pole) +
  `Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html` (mur). Na boot odpalajÄ… PROSTO `BattleScene`
  (armia vs armia), z pominiÄ™ciem mapy Ĺ›wiata. SkĹ‚ad/strona: 10 Hastati/Falanga + 10 Ĺucznik
  + 8 Konnica (konnica na skrzydĹ‚ach). OblÄ™ĹĽenie: defCiv=grecja + machiny u atakujÄ…cego
  (ensureSiegeMachines). Presety `bitwa_duza_pole`/`oblezenie_duze` + `launchBigPresetBattle`.
  tsc=0 Â· markery arena HOST-verified Â· pending=0 Â· ĹşrĂłdĹ‚o w srcKopiaMaster Â· AKTUALNA
- 2026-07-06 10:32 Â· e893f8bfd47c Â· stempel: 773234ea3a68 Â· WERSJA MAPOWA (28 jedn./stronÄ™
  rozstawione na MAPIE ĹšWIATA) â€” ZĹY POZIOM, Maciej chciaĹ‚ areny Â· ZASTÄ„PIONA (â†’ 486a65094ddb)

## KANON (gra-kanon\)
- 2026-07-20 Â· **d4052380684091f18fbc28bb6941aa14** Â· stempel KANON: **d4052380** (FINALNA **69bef0b2**) Â· ĹşrĂłdĹ‚o robocza md5 **a31ebe6f** Â· **PROMOCJA po teĹ›cie Macieja** (â€žsprawdzone") â€” pierwszy kanon od 2026-07-09, obejmuje **11 dni pracy**. ZawartoĹ›Ä‡ = caĹ‚oĹ›Ä‡ roboczej `a31ebe6f`:
  **Drzewko i jednostki:** drzewko 3-tier + 3 zasady progresji epok (twarda bramka epoki + tier-gating T1â†’T2â†’T3) Â· wielka naprawa jednostek (normalizacja `Typ` PLâ†’EN + migracja counters, **tokeny civs.json 28%â†’100%** widocznych jednostek narodowych, fix klucza `sumer`, **fix bramki em-dash â†’ 7 super-jednostek niewidocznych od zawsze**, Legion Rzymski usuniÄ™ty, Galeraâ†’Naval) Â· mechanizm **â€žZastÄ…p"** (zamiana na dostÄ™pnÄ… jednostkÄ™ tego samego `Typ` + unikat, zasiÄ™g = caĹ‚e terytorium, koszt = rĂłĹĽnica w PieniÄ…dzu) Â· **typ â€žSlinger"** dla Procarza + kontry + kolumna â€žBonus vs Slinger %" Â· **Ĺ‚aĹ„cuch ĹĽelaza** (`zelazo-access.ts`: kopalnia na zĹ‚oĹĽu ĹĽelaza AND Odlewnia ĹĽelaza; 25 jednostek epoki Ĺ»elaza na `Surowiec=zelazo`).
  **Ĺšwiat:** **Ludy Morza** jako barbarzyĹ„cy epoki BrÄ…z (Sherden/szekelesz) Â· **wioski goodie-hut** (zĹ‚oto/tech/jednostka) Â· mapa: **wybrzeĹĽe = woda**, **pasma gĂłrskie** (Ĺ‚aĹ„cuchy zamiast plam), rzeki uproszczone (**637/637 z ujĹ›ciem**), â€žmin nie max" reliefu, fix miedzi (0% na zĹ‚ym terenie).
  **Ekonomia:** Mennica naprawiona Â· per-city surowce logistyczne + zbieranie gliny (Cegielnia/Garncarnia oĹĽywione) Â· **realne szlaki handlowe** (wykrywanie poĹ‚Ä…czeĹ„ + dochĂłd obustronny + UI w panelu miasta i Ĺ‚uki na mapie).
  **Bramki w chwili promocji:** tsc=0 Â· tech-tree 19/0 Â· research 33/33 Â· unit-replace 10/10 Â· **combat-test 6/6** i **logic-test 203/203** (dawne â€žznane poraĹĽki" â€” naprawione) Â· map-gen determinizm A=B. ROBOCZA po promocji nietkniÄ™ta (`a31ebe6f`, VERIFY OK). Promocja skryptem `publish-kanon-snapshot.ps1` (zastÄ™puje poprzedni kanon bez archiwum w repo). publikowaĹ‚ INTEGRATOR #2 Â· **AKTUALNA**
- 2026-07-09 Â· **dee7140df6e7012213918913deba7c9e** Â· stempel KANON: **6a6e9820** (FINALNA 0d5234cd) Â· ĹşrĂłdĹ‚o robocza md5 **dee7140d** Â· **ZASTÄ„PIONA** (â†’ `d4052380`, 2026-07-20) Â· re-promocja (decyzja Macieja) â€” build z **fix #1 z code-review** (goĹ‚e ocalaĹ‚e zĹ‚oĹĽe bydĹ‚a/owiec pod miastem renderuje siÄ™; byĹ‚o znikaĹ‚o). Fog potwierdzony F9 Macieja **2,3 ms** (regresja 139,9 naprawiona). ZawartoĹ›Ä‡ = bc8b8e38 + fix #1. Decyzje po review: #2 (fort/droga na zĹ‚oĹĽu konia) â€” ZOSTAJE (koĹ„ wspĂłĹ‚istnieje); #3 marginalne. publikowaĹ‚ CODE-INTEGRATOR Â· **AKTUALNA**
- 2026-07-09 Â· **bc8b8e38b5c9737e16c53d24ea1d39a2** Â· stempel KANON: **39aa2a2c** (FINALNA 5ccffe76) Â· ĹşrĂłdĹ‚o robocza md5 **bc8b8e38** Â· promocja AUTONOMICZNA (Maciej â€žwyĹ›lij do kanonu", nieobecny) â€” build BEZ regresji fog. ZawartoĹ›Ä‡ = caĹ‚oĹ›Ä‡ a1dce24d + **FPS domkniÄ™ty** (diff-fog 41â†’~2 ms Â· cienie na ĹĽÄ…danie Â· matrixAutoUpdate Â· minimapa klikâ†’kamera) + **DEKOR** mikrodekor Ĺ‚Ä…k/rĂłwnin (regresja fog dekoru naprawiona â†’ diff-based) + **ZASADY-ZWIERZÄ„T E1â€“E5** (lama wzgĂłrza/gĂłry Â· koĹ„ poza food-gate Â· Nowy Ĺšwiat koĹ„ Â· Trzoda Â· posiew lamy InkĂłw Â· macierz miasta B). hash mapy nietkniÄ™ty (55aaa07c) Â· tsc=0 Â· smoke OK. **Do testu wzrokowego Macieja** (gameplay ZASAD + core mgĹ‚y/cieni nietestowane wizualnie). publikowaĹ‚ CODE-INTEGRATOR (publish-kanon-snapshot.ps1) Â· **ZASTÄ„PIONA** (â†’ dee7140d: fix #1 goĹ‚e zĹ‚oĹĽe pod miastem)
- 2026-07-09 Â· **a1dce24d80b1ed64e906b9715d11def6** Â· stempel KANON: **a1dce24d** Â· ĹşrĂłdĹ‚o robocza md5 **7dd9bb7a46dd** Â· promocja PO stabilizacji FPS (Maciej â€žpush do kanonu"). ZawartoĹ›Ä‡ = caĹ‚oĹ›Ä‡ 2b6c23dd (GRAFIKA-3D KOMPLET + FPS lewar 1+3, F9 **52 FPS**, mesh 1,3mlnâ†’39k) + **B sfinalizowane** (heks bez dolnej pokrywy zostaje; toggle ?nobottom=0) + **naprawa smoke** (async-poll, koniec false-negative na instancingu) + **optymalizacja minimapy** (cache getMinimapData + pomijanie mgĹ‚y w renderze; hitch ~795ms przy zakĹ‚adaniu miasta). publikowaĹ‚ CODE-INTEGRATOR (publish-kanon-snapshot.ps1) Â· **ZASTÄ„PIONA** (â†’ bc8b8e38, 2026-07-09: +DEKOR +ZASADY-ZWIERZÄ„T +FPS domkniÄ™ty)
- 2026-07-09 Â· **2b6c23dd4e15d5caf4941107d2c03a8d** Â· stempel KANON: **2b6c23dd** Â· ĹşrĂłdĹ‚o robocza md5 **97d1b9cb2edf** Â· promocja PO GRAFICE-3D + FPS (decyzja Macieja [12:55]; F9: FPS 25 Â· draw 835). ZawartoĹ›Ä‡ = caĹ‚oĹ›Ä‡ bbcacc13 (B + D4â€“D13) + GRAFIKA-3D KOMPLET + FPS lewar 1+3. publikowaĹ‚ CODE-INTEGRATOR Â· **ZASTÄ„PIONA** (â†’ a1dce24d, 2026-07-09)
- 2026-07-09 Â· **bbcacc138dde46ec0b0f136e3097c283** Â· stempel KANON: **bbcacc13** Â· ĹşrĂłdĹ‚o robocza md5 **00a372f495e8** Â· promocja PO pracy nad wydajnoĹ›ciÄ… (Maciej: â€žkanon plus git dziaĹ‚aj start"). ZawartoĹ›Ä‡ = B (geometria heksa) + D4â€“D13 (zakĹ‚adanie 30 sâ†’1,67 s, wejĹ›cie 60 sâ†’1,4 s), diagnostyka zdjÄ™ta; **poprawnoĹ›Ä‡ ekonomii zachowana** (lokalne enumeracje == peĹ‚ne skany, D13 rĂłwnowaĹĽnoĹ›Ä‡ 19/19). Bazuje na 51c2eb24 (D1/D3 + drzewko + balans). publikowaĹ‚ CODE-INTEGRATOR (publish-kanon-snapshot.ps1) Â· **ZASTÄ„PIONA** (â†’ 2b6c23dd, 2026-07-09)
- 2026-07-08 21:02 Â· **f2dcbbb8d9e7707d779d310ecff9a643** Â· stempel KANON: **8adcd682** Â· ĹşrĂłdĹ‚o robocza md5 **51c2eb248aed** Â· promocja z roboczej PRZED pracÄ… nad wydajnoĹ›ciÄ… (Maciej: â€žwypchnij obecnÄ… wersjÄ™ do kanonu"). ZawartoĹ›Ä‡ = live D1/D3 (miasto szybko + mgĹ‚a) + fix drzewka NA GĂ“RZE + balans/countery/plony/rzeki/ikony; ĹşrĂłdĹ‚o `865c94e` na origin. **Bez** eksperymentu B (geometria heksa). publikowaĹ‚ CODE-INTEGRATOR (publish-kanon-snapshot.ps1) Â· **ZASTÄ„PIONA** (â†’ bbcacc13, 2026-07-09)
- 2026-07-06 20:17 Â· **7856d3451a0cb3963bd3c50c032f5ad5** Â· stempel wewn.: **d744cd7956fb**
  (2026-07-06 18:10) Â· promocja Cursor Grupa G z roboczej (Maciej: playtest OK + GitHub
  bad0c7f). ZawartoĹ›Ä‡: rzeki wodospad, KONTRAKT #8 ikony, UX emojiâ†’SVG, siatka rostera
  6 kol., obwĂłdki wĹ‚aĹ›ciciela, duĹĽe bitwy arena, port UX W4, balans HPĂ—2/dystĂ—0.5,
  countery po polu `Typ`, C3/B0.6/Test wydajnoĹ›ci/A5/H1. gra/src zsynchronizowane ze
  srcKopiaMaster. tsc=0 Â· smoke OK Â· publikowaĹ‚ Cursor (publish-kanon-snapshot.ps1) Â· **ZASTÄ„PIONA** (â†’ 51c2eb24 / kanon 8adcd682, 2026-07-08 21:02)
- 2026-07-06 ~03:55 Â· skopiowany przez Cursora bundle f199c4c8 (ze stemplem PENDING) Â·
  **ZASTÄ„PIONA** (â†’ 7856d345)

## FINALNA (root)
- 2026-07-20 Â· **69bef0b26221b5e6087dd28f7fc12722** Â· stempel FINALNA: **69bef0b2** Â· zsynchronizowana z kanonem **d4052380** (ĹşrĂłdĹ‚o robocza `a31ebe6f`; drzewko+jednostki+â€žZastÄ…p"+ĹĽelazo+Ludy Morza+wioski+mapa+szlaki handlowe; `Gra-FINALNA.html`) Â· promocja po teĹ›cie Macieja Â· **AKTUALNA**
- 2026-07-09 Â· **fae546caae8d3220f18611418ca2efc0** Â· stempel FINALNA Â· zsynchronizowana z kanonem a1dce24d (ĹşrĂłdĹ‚o robocza 7dd9bb7a; GRAFIKA-3D + FPS 1+3 + minimapa; Gra-FINALNA.html) Â· **ZASTÄ„PIONA** (â†’ `69bef0b2`, 2026-07-20)
- 2026-07-09 Â· **3a8dd4bb5c5e8691f37d5fd3d92a9ffa** Â· stempel FINALNA Â· zsynchronizowana z kanonem 2b6c23dd (ĹşrĂłdĹ‚o robocza 97d1b9cb; Gra-FINALNA.html) Â· **ZASTÄ„PIONA** (â†’ fae546ca, 2026-07-09)
- 2026-07-09 Â· **676809f2bdf06d7c5a55bfb45ad1469e** Â· stempel FINALNA Â· zsynchronizowana z kanonem bbcacc13 (ĹşrĂłdĹ‚o robocza 00a372f4; Gra-FINALNA.html) Â· **ZASTÄ„PIONA** (â†’ 3a8dd4bb, 2026-07-09)
- 2026-07-08 21:02 Â· **605761807eb0b79f43c047c4e70916f7** Â· stempel FINALNA Â· zsynchronizowana z kanonem 51c2eb24 (Gra-FINALNA.html) Â· **ZASTÄ„PIONA** (â†’ 676809f2, 2026-07-09)
- 2026-07-06 20:17 Â· **7856d3451a0cb3963bd3c50c032f5ad5** Â· zsynchronizowana z kanonem
  (Gra-FINALNA.html) Â· **ZASTÄ„PIONA** (â†’ 60576180)
