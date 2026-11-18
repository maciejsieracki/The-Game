# 30-obrona-claude — R-WEB-DIPLO-RESPECT-MILITARY-ADVANTAGE-DOUBLE-COUNT-AUDIT-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu)
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-ADVANTAGE-DOUBLE-COUNT-AUDIT-Q1
GOAL: rozstrzygnąć, czy „Przewaga militarna” (+15) liczy się w Respekcie dwa razy; odpowiedzieć na zarzuty Evaluatora.
ZMIANY-COMMIT: brak zmian kodu gry; commit tylko tego raportu (czubek pracy w polu sha).

## Rozstrzygnięcie (wariant A, ZMIERZONO)

Symulacja ratio 1;1,6;1,6;1,6;1,2;1,6;1,6;0,6;1 przez `respektMilitaryCrossing` (`gra/src/game/diplomacy-military-strength.ts`): zdarzenia tura 2 = A, tura 6 = A, tura 8 = B; pozostałe tury bez zdarzenia (tura 5 ratio 1,2 = stan brak).

Są dwa realne przejścia progu (2 i 6) z zejściem poniżej progu między nimi. Zgodne z ustaleniem „raz na przejście progu”. Brak dubla w pętli: `applyMilitaryRespektEdgeTick` jest wołane raz na turę (`main.ts:26030`).

## Liczby (Respekt 87)

- Pasek = `respektZKorektaMilitarna(computeRespekt(...), respektMilOffset)` (`main.ts:3079`). Korekta to jedno pole: `setDiploPairMeta(... respektMilOffset: +15)` (`main.ts:13048`), zastępowane, nie kumulowane. Stąd 72 + 15 = 87 (baza 72 NIE zweryfikowana: nie ma jej na zrzucie).
- `rel.respekt` po `applyDiplomaticEvent` (+15) jest nadpisywane w ticku AI: `main.ts:45388-45393` (`respektAI = respektZKorektaMilitarna(computeRespekt, offset)`). Nie ma drugiego naliczenia w formule paska.
- Relacja 115 = Respekt 87 + Zaufanie 28 (zgodne).

Wniosek: w formule Respektu +15 liczy się RAZ. Wiersze „ZA CO CIĘ LUBIĄ” to log (`recordDiploFactor`, `main.ts:13244-13256`), po jednym na przejście progu. Dwa wiersze sumują się do +30, a bieżąca korekta paska to +15 (korekta zdjęta po spadku poniżej progu). Renderera nie sprawdzono.

## Testy (surowe wyniki, po `npm ci --ignore-scripts` w gra/)

- edge-test: 12 OK, 0 FAIL (exit 0); events-test: 30 OK, 0 FAIL (exit 0); offset-test: 12 OK, 0 FAIL (exit 0); `tsc --noEmit`: exit 0
- Pozostałe bramki: NIE ZMIERZONO (brak zmian kodu). Mutacja: NIE WYKONANO.

## Odpowiedzi na zarzuty Evaluatora

1. PRZYJMUJĘ jako ograniczenie. Zrzutu bazy 72 nie da się odtworzyć z repo; sekwencję A/B potwierdza symulacja powyżej, nie przeglądarka.
2. ODRZUCAM jako część audytu, PRZYJMUJĘ jako obserwację. Czytanie kodu: +5 z wygranej bitwy zapisuje `rel.respekt` (`main.ts:13263-13270`), a tick `main.ts:45388-45393` nadpisuje je wartością `computeRespekt + offset`. Wpis „+5” w historii nie wchodzi do paska. Runtime NIE ZMIERZONO (test żywy nie ruszył: brak Chromium w ścieżce).
3. PRZYJMUJĘ. Zakres funkcji `applyMilitaryRespektEdgeTick` to `main.ts:13010-13054` (wcześniej cytowane 13010-13050).

## BLOKADY

Brak blokad dla audytu. Brak poprawki kodu: nie ma czego deduplikować.

## RUNDY

2/5. Ostatni werdykt Evaluatora: A.

## UWAGI-DLA-ORKIESTRATORA

- Pytanie ABC do właściciela (propozycja): czy wiersze historii „Przewaga militarna” mają być sumowane w panelu (wtedy +30 vs pasek +15), czy pokazywać tylko bieżącą korektę? Rekomendacja: pokazywać bieżącą korektę albo dopisać adnotację „(zdjęte po spadku poniżej progu)”.
- Pytanie ABC: wygrana bitwy +5 nie wchodzi do paska (zarzut 2). Osobny temat, decyzja właściciela.

## NASTĘPNY KROK

Final Control: weryfikacja wniosków A i zarzutów; decyzja orkiestratora o pytaniach ABC.

DEPLOY/PUSH: NIE WYKONANO
