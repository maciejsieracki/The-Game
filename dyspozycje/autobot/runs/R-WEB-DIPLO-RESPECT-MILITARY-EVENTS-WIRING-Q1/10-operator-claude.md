STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) na progu 50% siły wojskowej, jednorazowo na przejście progu, widoczne w rejestrze I w pasku/liczbie Respektu w panelu dyplomacji.
ZMIANY-COMMIT: runda 4/5 (Operator SONNET, uzasadnienie w DODATKU 2). Baza kandydata 72f06535d + merge origin/main 42a93543a.
  - gra/src/main.ts: nowa funkcja respektBarWithMilitaryOffset(owner, base) = respektZKorektaMilitarna(base, respektMilOffset); użyta w TRZECH miejscach naraz: objectiveRespektPctTowardEffective (lista dyplomacji ~8712 i audienceRelTotalEffective/relacjaTotal), pasek audiencji (respektNorm).
  - gra/src/main.ts applyMilitaryRespektEdgeTick: korekta ZASTĘPUJE (offset = dR przy przejściu progu; powrót w pasmo 'brak' zeruje offset; inicjalizacja starego zapisu bez zmiany) — decyzja robocza Z3, DO POTWIERDZENIA przez właściciela.
  - gra/src/game/diplomacy-pn-engine.ts: komentarz pola respektMilOffset.
  - docs/encyklopedia/pojecia/respekt.md: opis (pasek uwzględnia korektę, brak kumulacji); wikiBundle.json zregenerowany narzędziem tools/bundle-wiki-for-game.cjs po merge (konflikt tylko tam).
  - gra/tools/diplo-respect-military-live-test.cjs (asercje paska = clamp(baza+offset), przesunięcie o +15/−10, round-trip przy niezerowym offsecie, offsety zastępujące), diplo-respect-military-offset-test.cjs (+ mutacja MUTATE_DIRECTION=1).
  - evidence/: respekt-live-result.json, respekt-live-t2.png, -t8.png, -t9.png (zrzuty Chromium panelu audiencji z „Przewaga militarna” w rejestrze).
  - SHA kodu/merge: f4aeca47d (przed commitem raportu); SHA czubka = commit tego raportu (patrz pole sha).
TESTY (surowe, po merge z origin/main 42a93543a):
  - npx tsc --noEmit: exit 0
  - diplo-respect-military-edge-test 12 OK/0; events-test 30 OK/0; offset-test 12 OK/0; diplo-military-strength-test 27 PASS/0; unit-power-test 6 pass/0
  - mutacje: MUTATE_DIRECTION=1 offset-test 11 OK/1 FAIL (czerwone); MUTATE_NO_OFFSET=1 11 OK/1 FAIL (czerwone)
  - TEST ŻYWY Chromium (?civTest=1, tury 1–30, po merge): 40 OK / 0 FAIL. Pomiary paska (audiencja, realny DOM): T2 bar 100 = baza 85 + 15 (clamp = 100, więc samo T2 nie rozróżnia); T8 bar 99 = baza 84 + 15 (baza+offset<100: PRZESUNIĘTY); T9 bar 72 = baza 82 − 10 (obniżony). Round-trip meta przy offsecie −10 stan B zachowany; stary zapis = inicjalizacja bez zdarzenia; jednorazowość i ponowne +15 po spadku poniżej progu potwierdzone.
  - MUTACJA ŻYWA (respektBarWithMilitaryOffset zwraca bazę): 35 OK / 5 FAIL (T2, T8, T9 paska) — czerwone; kod przywrócony z kopii.
  - bramki referencyjne po merge: diplomacy-border-era-penalty-live-test PASS; diplomacy-city-cession-r3-test 56 pass/17 fail (czerwone także na bazie wg FC/obrony r2, NIE zmierzone przeze mnie na bazie); diplomacy-stol-pw-sum-test 167/1 fail (jw.); diplomacy-direct-negotiation-live-test: wyjątek Playwright (jw., czerwone na bazie wg obrony); diplo-truce-live-test (L2b): TIMEOUT 170 s (jw., NIE zmierzone na bazie).
  - git diff --check origin/main HEAD: czysty. Dysk po pracy: 7,1 GB wolnego.
BLOKADY: brak blokad kodu. NIE ZMIERZONO: czerwonych-na-bazie ponownie na 72f06535d/origin/main (4 bramki), pełny zapis slotu IndexedDB z polami respektu (zmierzony round-trip JSON meta; border-era-live IndexedDB PASS).
RUNDY: 4/5
NASTĘPNY KROK: Evaluator (SONNET) -> Obrona -> Final Control; integracja orkiestratora (merge-base już zawiera origin/main 42a93543a; konflikt wikiBundle rozwiązany regeneracją).
UWAGI-DLA-ORKIESTRATORA:
  1. DO POTWIERDZENIA (Z3): korekta zastępuje się przy przejściu progu i zeruje po powrocie w pasmo neutralne (nie kumuluje się 15→30→20). Test żywy i jednostkowy kodują ten wariant.
  2. Semantyka: pasek gracza (wyżej = silniejszy) rośnie przy przewadze; relacja AI→gracz (rel.respekt) w pętli AI ma tę samą korektę (AI-share) — odrębny, wcześniej istniejący rozjazd perspektyw (W33/#275), nie ruszany.
  3. Zdarzenia +5/+10/+10 nadpisywane pętlą AI — pre-existing, osobny dług.
  4. Uruchomienie diplomacy-truce-live-test nadpisało plik R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png; przywrócony git checkout, nie wchodzi do commita.
DEPLOY/PUSH: NIE WYKONANO
