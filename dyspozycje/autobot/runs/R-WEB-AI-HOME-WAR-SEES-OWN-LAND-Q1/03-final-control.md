STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-HOME-WAR-SEES-OWN-LAND-Q1
GOAL: AI broniaca WLASNEGO terytorium moze zaatakowac wroga na nim mimo mgly; poza wlasnym terytorium mgla bez zmian.
ZMIANY-COMMIT: eef2c86a7 (baza e30c824ec, potomek). Diff do allowlisty: 01-operator-r1.md, gra/src/main.ts (jedna bramka, blok komend AI), gra/tools/ai-fog-test.cjs, nowy gra/tools/ai-home-war-sees-own-land-test.cjs. `git diff --check` OK. Brak zmian w ai.ts, gra/data, WERSJE.md, rust-port.
TESTY (samodzielnie, eef2c86a7): ai-fog-test 9/9 exit 0; ai-home-war-sees-own-land-test 4/4; ai-test 289/0; logic-test 213/213. territoryOwnerAtLive (main.ts:5396) w zasiegu boot(), uzycie ok. 40836 w tym samym boot(). tsc: wg Obrony 172 bledy srodowiskowe identyczne na bazie i HEAD (zero nowych); samodzielnie NIE_ZMIERZONO. Przegladarka: NIE_ZMIERZONO (zmiana logiczna).
ROZSTRZYGNIECIE ZARZUTOW: 1 (K1 tekstowy) ODDAL - notatka, main.ts nie do zaladowania w node. 2 (szerszy zakres niz home-war) ODDAL - zgodne z celem terytorialnym, niewidoczne cele wchodza tylko sciezka homeThreats. 3 (tsc) ODDAL - dowod z Obrony, brak nowych bledow. 4 (przegladarka) ODDAL.
BLOKADY: brak.
RUNDY: 1/5 (Final Control). Werdykt: same ODDAL -> PASS.
NASTEPNY KROK: integracja orkiestratora, SHA do integracji: eef2c86a7 (plus commit z tym raportem). Kolejnosc wzgledem origin/rust-port/parity-v2 (707b50c41): zmiana dotyczy wylacznie gra/, niezalezna od galezi Rust (nie jest jej przodkiem); integrowac po web-wip/aizfog-fc, przed deployem na ROBOCZA; kolejnosc wzgledem parity-v2 dowolna.
DEPLOY/PUSH: NIE WYKONANO
