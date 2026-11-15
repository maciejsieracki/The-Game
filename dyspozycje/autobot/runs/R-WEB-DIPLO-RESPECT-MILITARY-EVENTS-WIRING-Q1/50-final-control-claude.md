STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) wpięte w tick, próg 50%, jednorazowo na przejście progu; widoczne w rejestrze I w panelu dyplomacji (DODATEK pkt 3: poprawnie przesunięty pasek Respektu).
ZMIANY-COMMIT: oceniany kandydat 404a345627bf54d6b3b9d24731c9d7ba1ff07ded (potomek 7c2074e00; merge-base z origin/main = 7c2074e00; NIE jest potomkiem 2fe362553 — to raport FC r1, nie baza kodu). Ten raport: jeden plik, osobny commit.
TESTY (surowe, mój worktree, npm ci --ignore-scripts w gra/):
  - npx tsc --noEmit: exit 0
  - diplo-respect-military-edge-test 12 OK/0; events-test 30 OK/0; offset-test 12 OK/0; MUTATE_NO_OFFSET=1 offset-test 11 OK/1 FAIL (mutacja czerwona); diplo-military-strength-test 27/0; unit-power-test 6/0; logic-test 213/213
  - git diff --check 7c2074e00..404a345627: czysty
  - evidence/respekt-live-result.json: fail 0; panelT2: bar 85, base 85, offset 15, relacjaAI 30 (bar NIE przesunięty o korektę)
  - git merge-tree origin/main(ff090714d) + kandydat: konflikt TYLKO gra/src/data/wikiBundle.json (regeneracja narzędziem); main.ts i poradnik scalają się automatycznie
  - NIE ZMIERZONO przeze mnie: test żywy Chromium (dysk 1,9 GB wolnego, wymagane >=4-6 GB; opieram się na JSON z r3), M4 na nowo, 4 bramki czerwone na bazie (city-cession-r3, stol-pw-sum, direct-negotiation-live, L2b diplo-truce-live) — zgodnie z obroną czerwone identycznie na bazie 7c2074e00 (pomiar r2), nie ponowiłem.
ROZSTRZYGNIĘCIE ZARZUTÓW:
  Z1 NAPRAW. Kryterium 3 DODATKU („zrzut z poprawnie przesuniętym paskiem Respektu”; wariant A: pasek/liczba uwzględnia korektę +15/−10) NIE spełnione: pomiar T2 bar 85 = base 85 przy offset 15. W panelu wpis „Przewaga militarna +15” w rejestrze nie zmienia paska — sprzeczność widoczna dla gracza. Obrona odrzuciła naprawę argumentem „kierunek przeciwny do relacji AI”, ale pasek ma własną semantykę zapisaną w tooltipie (main.ts:606: „Respekt = jak duża jest wasza Moc w porównaniu z tą nacją… Wyżej = jesteś silniejszy”): to udział gracza. W tej semantyce „Przewaga militarna” (gracz silniejszy) podnosi pasek, „Słabszy militarnie” obniża — kierunek jednoznaczny, nie wymaga decyzji; dopełnieniowość z relacją AI (AI-share) jest odrębnym, wcześniej istniejącym rozjazdem perspektyw (por. W33/#275) i nie blokuje. Test T2 nie rozróżniał, bo clamp(85+15)=100 — zmienić scenariusz tak, by baza+offset < 100 (stosunek bliski progu 1,5–2, baza ~60–70), albo asercja na pasek = respektZKorektaMilitarna(base, offset) z baza<85.
    Wymagana naprawa (r4, ten sam ID): (1) main.ts powerLine.respekt w audiencji (~26426) → respektZKorektaMilitarna(computeRespekt(gracz,AI), getDiploPairMeta(ME(),ownerId).respektMilOffset); (2) to samo w liście dyplomacji (objectiveRespektPctTowardEffective, ~8712) i audienceRelTotalEffective (relacjaTotal) — te trzy miejsca naraz, spójnie; (3) test żywy: asercja paska po zdarzeniu = clamp(base+offset), przy baza+offset<100, oraz −10 przy słabszym (T-weaker); zrzut Chromium z przesuniętym paskiem do evidence; (4) merge origin/main + regeneracja wikiBundle; (5) pozostałe bramki jak wyżej.
  Z2 ODDAL (niskie ryzyko): meta serializowane w całości (pairMeta), round-trip JSON zmierzony, border-era-live (IndexedDB) PASS; realny zapis slotu NIE ZMIERZONO — dopisać do testu r4 jeśli tanie, nie blokuje.
  Z3 DO DECYZJI CZŁOWIEKA: korekta trwała i kumulatywna (15→30→20), bez wygasania; realna decyzja produktowa (wygasanie vs trwałość). Założenie robocze zostaje.
  Z4 ODDAL: test żywy 36/0 + mutacje; zmiana sekcji D to uprawniona zmiana kontraktu.
  Z5 ODDAL (informacja): integracja z ff090714d wymaga merge + regeneracji wikiBundle (konflikt tylko tam).
  Z6 ODDAL: bramki czerwone-na-bazie odnotowane jako dług; nie zmierzone ponownie przeze mnie.
BLOKADY: Z1 (pasek/lista/relacjaTotal bez korekty). Dysk 1,9 GB.
RUNDY: FC r3 po obronie r3 (łącznie runda 4/5 po tym FAIL)
NASTĘPNY KROK: Operator r4 (Haiku) — naprawa Z1 wg powyższego; potem Evaluator, Obrona, FC.
UWAGI-DLA-ORKIESTRATORA: pre-existing zdarzenia +5/+10/+10 nadpisywane pętlą AI (osobny temat); rozjazd perspektyw bar vs relacja AI (osobna decyzja, nie blokuje); ABC właściciela: wygasanie korekty (Z3).
DEPLOY/PUSH: NIE WYKONANO
