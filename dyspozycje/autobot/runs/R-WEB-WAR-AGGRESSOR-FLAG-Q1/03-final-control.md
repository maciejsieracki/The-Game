STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WAR-AGGRESSOR-FLAG-Q1
GOAL: flaga agresora (20 tur) bez casus belli; casus belli (15 tur) z odmowy trybutu/ultimatum; wplyw na AI; znacznik UI; parametry w JSON.
ZMIANY/COMMIT: SHA do integracji = 7e3d6bc6b (baza ad2bc6e3c = origin/web/integration-20261030, merge-base zgodny; r1 a8675d693 + r2 7e3d6bc6b). FC bez commitow kodu; ten plik dopisany jako osobny commit docs.

WERDYKT ZARZUTOW (runda 1) po obronie r2:
1. Brak wiringu: ODDAL (naprawione w r2). Weryfikacja: zarejestrujWypowiedzenie we wszystkich 7 realnych miejscach wojna_wypowiedziana w main.ts (10435 hamulec, 11642 gracz, 11684 ownerDeclareWarOn, 21337 sojusznik, 35884 klaster CS, 37244 AI + wymuszona epoka; 3 hooki testowe 25635/25727/25795 swiadomie poza gra). Casus belli: main.ts:18316 (adresat AI), :18467 (adresat gracz). Save/load: aggressorFlagUntilByOwner/casusBelliUntilByPair (meta + reset nowej gry). AI: ai.ts + diplomacy-proposals.ts (deltaRelacjiSojusz, willingnessAlly x0.7 w aiDiplomacyStance).
2. Testy tylko modulu: ODDAL. Mutacje 19/19 KILLED (w tym silnik AI), test na realnym aiDiplomacyStance, wiring 15/0.
3. Bramki bazowe: ODDAL. Uruchomione przeze mnie, wszystkie rowne bazie (ponizej).
4. Allowlista: ODDAL. 17 plikow zmienionych; poza allowlista wylacznie 3 stare PNG city-cession-live w evidence/ (katalog runu = allowlista, szum bez wplywu na gre). Brak zabronionych sciezek (gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml). Modul przeniesiony do diplomacy.ts (na allowliscie); diploListHud.ts cofniety.
5a-d. Luki rdzenia: ODDAL (a: zapis wpiety; b: ZALOZENIE w JSON i tescie; c: tooltip pokazuje doTury = ta sama wartosc, live T1 sprawdza rownosc; d: przyczyna z plik:linia j.w.).
NOTA (nie blokuje): znacznik na liscie HUD (gra/src/ui/diploListHud.ts) NIE wykonany, plik poza allowlista (ui/diplomacy*.ts go nie obejmuje). Znacznik jest w panelu dyplomacji (wiersz kazdej cywilizacji). Rekomendacja dla orkiestratora: osobny drobny temat z rozszerzeniem allowlisty, o ile wlasciciel chce znacznik rowniez na liscie HUD.

TESTY (samodzielnie, na 7e3d6bc6b): tsc exit 0; git diff --check czysty; aggressor unit 73/0, mutation 19/19 KILLED, wiring 15/0, UI live Chromium 7/0 (zrzut zgodny: znacznik Agresor w panelu); city-cession 79/0; r3 73/0; picker-ui 13/0; war-era-counter 82/0; multiwar 57/0; multiwar main-guard 21/0; forced-war relation-gate 14/0, stone 31/0, iron 54/0, iron main-guard 35/0; diplo-war-peace profile 198/0, gate 11/0, main-guard 28/0, d7 8/0, sim 22/0; diplomacy 148/0; peace-lock 9/0; ring 15/0; civ-matrix-ai-diplomacy-wiring 42/1 (znane czerwone, bez zmian). Nieuruchomione: live city-cession, war-era-counter-live, multiwar-live (NIE_ZMIERZONO, pokryte unit/wiring).
BLOKADY: brak (poza nota HUD).
RUNDY: FC 1 (temat 2/5)
NASTEPNY KROK: integracja orkiestratora. Kolejnosc: 7e3d6bc6b jest na ad2bc6e3c (HEAD web/integration-20261030), wiec fast-forward na web/integration-20261030, nastepnie dopiero ta galaz do main. Wzgledem origin/rust-port/parity-v2 (74b81339e): niezalezne, gra/** vs rust-port/**; kolejnosc dowolna, parity-v2 nie zalezy od tego tematu; integrowac po web/integration, bez konfliktow sciezek.
DEPLOY/PUSH: NIE WYKONANO
