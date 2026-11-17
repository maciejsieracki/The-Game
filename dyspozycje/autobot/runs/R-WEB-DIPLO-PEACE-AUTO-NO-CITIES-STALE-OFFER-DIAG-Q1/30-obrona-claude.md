# 30-obrona — R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1 (runda 4 / odpowiedź na Evaluator r3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1
GOAL: pokój z graczem automatycznie tylko przy 100% zmęczenia (okno + "Ważne"); po pokoju brak martwych ofert pokoju/rozejmu na stole i w liście audiencji; diagnoza ścieżek.
ZMIANY-COMMIT: baza c69bfe3a2 (r3); commit obrony zawiera: `main.ts` (wiring `isAtPeace` w `buildPendingNegotiationRows`, helper `logPeaceVazne`, wpisy "Ważne" w gałęziach pokój/rozejm), `diplomacy-proposals.ts` (`isAtPeace` wymagane), `60-dowody-tabela.md` (wiersze 8–11, L1–L2), `evidence/live-table-r4.json`, ten raport. SHA: w polu sha wyniku.

## Odpowiedź na zarzuty Evaluatora r3
1. **Przyczyna pokoju w grze właściciela (PRZYJMUJĘ częściowo).** Ścieżka #2 (tick zmęczenia) pozostaje jedyną potwierdzoną żywo (M4). Ścieżki #4 (koniec rozejmu) i #6 (akceptacja AI) NIE ZMIERZONO na żywo. Pytania do właściciela: (a) w której turze wojny pojawił się pokój i czy był wpis "Ważne"; (b) czy pojawił się toast "Pokój zawarty"; (c) kto był silniejszy i czy stanem był rozejm (tura końca rozejmu) czy wojna.
2. **Z7: okno/"Ważne" dla pokoju z akceptacji AI (PRZYJMUJĘ, naprawa).** Gałąź `pokoj` (main.ts ~26149) i `rozejm` (~26159) dostały `logPeaceVazne` (wpis "Ważne", dedup tura+para), dotąd był tylko toast 4 s. Wpis przy końcu rozejmu z r3 zostaje. Dowód: tsc exit 0; NIE ZMIERZONO na żywo (brak hooka akceptacji AI).
3. **blockReason przy +98 PW (PRZYJMUJĘ jako niepełne, ODPOWIADAM z kodu).** Wiersz przychodzący z `responderPreview.accepted===false` ustawia `blockReason = responderPreview.reason ?? 'Warunki niespełnione'` (gra/src/ui/diplomacyAcceptanceBalance.ts:352–353). Tekst "Nie można przyjąć — warunki niespełnione" (~529) nie pokazuje powodu. Który wiersz zablokował w zrzucie: NIE ZMIERZONO. To defekt czytelności, zostawiony poza zakresem (DIPLO-5).
4. **Z4/Z5 (PRZYJMUJĘ).** (a) `isAtPeace` był opcjonalne — ZMIENIONE na wymagane; tsc wymusza je we wszystkich wywołaniach. (b) Wiring listy audiencji (`buildPendingNegotiationRows`) nie przekazywał `isAtPeace` — NAPRAWIONE (main.ts 22123). To prawdopodobnie tłumaczy, dlaczego oferty były widoczne po pokoju (hipoteza, NIE ZMIERZONO na żywo). (c) Dary z miastami o innym actionId nie są czyszczone — PRZYJMUJĘ jako lukę, NIE ZMIERZONO (nie wiem, czy zrzut ma actionId pokoj). (d) Gałąź `isAtPeace` w `handleNegotiationAccept` (main.ts ~21715) bez osobnego testu — PRZYJMUJĘ jako lukę. (e) Testy statyczne T4a/T4b są strażnikami tekstowymi — PRZYJMUJĘ; pokrycie behawioralne daje test żywy S1–S5.
5. **Z8 tabela (PRZYJMUJĘ).** Dodane wiersze: `tickAiAiPeaceRequests` i `aiAiForcedPeacePairEligible` (wykluczenie par z graczem, diplomacy-ai-forced-peace.ts:122), akceptacja AI ze stołu, rozejm ze stołu, koniec rozejmu, lista audiencji, akceptacja `handleNegotiationAccept`.

## TESTY (surowe wyniki, runda 4)
- `npx tsc --noEmit` → exit 0 (po zmianach).
- `diplo-peace-auto-stale-offer-test.cjs` → PASS=6 FAIL=0.
- `diplo-peace-auto-stale-offer-live-test.cjs` (świeży build, Chromium) → PASS=12 FAIL=0; tabela `evidence/live-table-r4.json`.
- Regresje: ai-war-weariness-peace 96/0; diplo-peace-price-decay 13/0; diplo-peace-balance-accept 32/0; diplo-truce-until-turn 15/0; diplo-truce-impl 94/0; diplo-negotiation-round-counter 4/0; diplo-peace-ai-ai-nonnegative 21/0.
- NIE ZMIERZONO w tej rundzie: mutacje M1–M4 po zmianach, test wiringu listy audiencji, test wpisów "Ważne" z gałęzi akceptacji AI.

## BLOKADY
(1) Ścieżka pokoju w grze właściciela nierozstrzygnięta. (2) Brak testu żywego dla `logPeaceVazne` (akceptacja AI). (3) Brak testu gałęzi `handleNegotiationAccept`. (4) Dary z innym actionId nieczyszczone (NIE ZMIERZONO). (5) Powód blokady "Przyjmij" przy +98 PW nieustalony w żywej grze.

## DECISION_REQUIRED
- Q1: wpis "Pokój zawarty" w "Ważne" przy pokoju ze stołu (nowe zachowanie r4): A tak (zalecane), B nie (tylko toast).
- Q2: cena pokoju 0 przy zmęczeniu <100% (z r3, bez zmian): A zostawić, B cena wg wzoru, C zero tylko przy 100%. Rekomendacja B.

## UWAGI-DLA-ORKIESTRATORA
gra/node_modules zainstalowane (npm ci --ignore-scripts) w worktree — do usunięcia. Build testu żywego w scratchpadzie. Poza zakresem: DIPLO-4 (kierunek płatności), DIPLO-5 (nawarstwianie ofert, czytelność blockReason).

RUNDY: 4/5
NASTĘPNY KROK: Evaluator r4
DEPLOY/PUSH: NIE WYKONANO
