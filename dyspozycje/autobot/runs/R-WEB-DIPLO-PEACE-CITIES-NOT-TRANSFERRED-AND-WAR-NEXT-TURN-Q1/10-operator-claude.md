# Raport Operatora — runda 2/5 (HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-CITIES-NOT-TRANSFERRED-AND-WAR-NEXT-TURN-Q1
GOAL: negocjowany pokój z cesją miast (oferta AI z kilkoma miastami, gracz akceptuje przy stole) ma przenieść miasta i zawrzeć pokój atomowo, albo wrócić z komunikatem.

## Przyczyna (base 1213504618, plik:linia w bazie)
- `gra/src/main.ts` ~l.40978 `cityCessionPayloadBlockReason`: limit „w propozycji pokoju może być tylko jedno miasto" (`total > 1` → blok).
- AI tworzy oferty z wieloma miastami: `gra/src/game/ai.ts:7445` (`dodatkoweMiasta`), `gra/src/game/diplomacy-proposals.ts` `aiOfferedCityItems`.
- `gra/src/main.ts` ~l.27084 (applyProposalOutcomeImpl, gałąź `oneShotTrade`): blok → `return` PRZED `finalizePeaceTreatyBetween` (~l.27133). Pokój nie jest zawierany, status zostaje „wojna", miasta nie przechodzą, komunikat 4,5 s. Stąd: „przyjąłem, nic nie dostałem, następnej tury znów atak".
- Hipoteza B potwierdzona kodowo: nie ma „połowicznego pokoju" — pokój nie został zapisany. Karencja po pokoju nie była w grze, więc wojna nie została zablokowana.
- Nie dotyczy FALI 872 (ścieżka wymuszona, `pendingPeaceItems`).

## Zmiana (ABC A: wykonalne miasta przechodzą, reszta odpada z komunikatem)
- `gra/src/game/diplomacy-value-catalog.ts` ~l.1099 nowa czysta funkcja `partitionPeaceCityItems` (sekwencyjne zakazy przez `selectSequentialCityCessions`).
- `gra/src/main.ts` ~l.40988 `cityCessionFilterPayload` zastępuje stary blok; dopiero gdy NIC nie przechodzi — pokój wraca z komunikatem; częściowo — pokój zawarty z resztą + komunikat o pominiętych miastach.
- `gra/tools/diplomacy-city-cession-test.cjs`: kotwica w teście wskazuje nową nazwę funkcji.
- Nie zmieniono wartości balansu, formuł PW/D, flag ani karencji wojen.

## Testy (liczby z surowego wyjścia)
- `npx tsc --noEmit` (node typescript): exit 0.
- `tools/logic-test.cjs`: LOGIC OK (213/213).
- `tools/tech-tree-test.cjs`: 20 pass, 0 fail.
- `tools/research-test.cjs`: ALL GREEN.
- `tools/combat-test.cjs`: 6/6.
- `tools/ai-unit-replace-same-rules-test.cjs`: 45 passed, 0 failed (gate w dispatchu mówi 21; uruchomiony plik zwraca 45).
- Pokój/cesja/wojna: `peace-city-cession-negotiated-test.cjs` (NOWY) 18/0; `peace-city-cession-and-rewar-test.cjs` PASS=8; `diplomacy-city-cession-test.cjs` 79/0 (po poprawce kotwicy); `diplomacy-city-cession-r3-test.cjs` 79/0; `diplo-forced-peace-pending-test.cjs` 40/0; `diplo-peace-weaker-seeks-city-only-test.cjs` 35/0; `diplo-peace-tail-integration-test.cjs` 42/0; `diplo-peace-last-stage-payment-test.cjs` OK.
- Mutacja: w nowym teście kopia starego limitu „>1 miasto" przepuszcza 0 z 2 (czerwone).

## NIE ZMIERZONO
- Przebieg w prawdziwej grze / Chromium (hak civTest, ≤45 tur) — nie uruchamiano; brak zapisu gry właściciela.
- Regres po FALACH 863/865/866 (bramki OFF) — nie porównywano z bazą sprzed FALI 860.
- Karencja przed ponownym wypowiedzeniem przez tę samą cywilizację — nie zbadano (poza zakresem zmiany).
- Atomowość: sekwencyjne przeliczenie planu cesji dla drugiego miasta odbywa się na stanie po pierwszym przelewie tylko w `transferCityByTreaty`; rzadki błąd (wolne pole) zostałby zalogowany, nie cofnięty.

## UWAGI-DLA-ORKIESTRATORA
- Nazwa dawcy „Karapał" w zgłoszeniu nie występuje w danych (jak w dispatchu).
- Pytanie ABC dla właściciela: czy przy częściowej cesji pokój ma być zawierany (obecnie tak) — zob. ABC A z dispatchu.

NASTĘPNY KROK: integracja orkiestratora po Final Control; test w grze na ROBOCZEJ (zapis właściciela, jeśli dostępny).
DEPLOY/PUSH: NIE WYKONANO
