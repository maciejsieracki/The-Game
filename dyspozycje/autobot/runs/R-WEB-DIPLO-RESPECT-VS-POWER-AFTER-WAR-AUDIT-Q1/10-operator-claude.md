# R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 — raport Operatora, runda 3/5 (Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
GOAL: zamknąć pomiarem zarzuty Z4 (symulacja 30 tur, źródło −1,5/turę, ślad zdarzeń militarnych) i Z2 (źródło 67 vs 89). Bez zmian w gra/src, bez decyzji produktowej (A/B/C zostaje dla właściciela).
ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/` (ten raport + `evidence/`). Baza: dcf743709 (origin/main, detached). Zero zmian w gra/src, gra/data, gra/tools, WERSJE.md. `gra/node_modules` zainstalowane lokalnie tylko do esbuild (npm ci --ignore-scripts), nie w commicie. Brak push, brak deployu.
TESTY:
- Symulacja (ZMIERZONO): `node dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/evidence/sim-respekt-wojna.cjs` → wynik w `evidence/wynik-pomiaru.txt`. Silnik bundlowany z gra/src/game/diplomacy.ts (bez zmian kodu).
- Bramki kodu (tsc, logic-test): NIE_ZMIERZONO — brak zmian w src, nie uruchamiano.
- Odczyt JSON (ZMIERZONO): gra/data/diplomacy.json:28-30 (ekspansjaGranica −2 / Brąz −3 / Żelazo −4), :26-27 (wspolnaReligia +0,5, odmiennaReligia −0,5), :136 (wiarygodnoscTempoAmplituda 0,5).
- Ślad wywołań (ZMIERZONO grep, patrz sekcja Z4c).
BLOKADY:
1. Sesja nie ma pełnego stanu gry (miasta, armie, wiarygodność, religia). Skład −1,5/turę jest policzony z funkcji silnika dla kombinacji składników, a nie z zapisu konkretnej gry — NIE_ZMIERZONO na żywym stanie.
2. Liczby 67 i 89 nie da się odtworzyć bez stanu gry: 14682/1854 z dispatchu to wartości rankingu, nie wejścia computeRespekt w ścieżce panelu (patrz Z2). NIE_ZMIERZONO dla wejść 67.
3. Decyzja A/B/C — poza zakresem tej rundy (dispatch DODATEK: „bez zdania ABC”).
RUNDY: 3/5 (ta runda). Historia: r1 Sonnet (dyspozycja), r2 Haiku obrona. Zarzuty Z1/Z3/Z5 nietknięte.
NASTĘPNY KROK: Evaluator r3 weryfikuje liczby z `evidence/wynik-pomiaru.txt` i linie kodu z sekcji Z4c/Z2. Po jego PASS orkiestrator zadaje właścicielowi ABC (B2 vs C) z tymi danymi.
DEPLOY/PUSH: NIE WYKONANO

---

## Z4a — Symulacja 30 tur wojny (ZMIERZONO)

Scenariusz: wojna (status `wojna`), granica z partnerem (karaWspolnaGranica, epoka <Brąz → −2), wspólna religia (+0,5). Start Z=40, R=30. Gracz 10× silniejszy: computeRespekt(100, 10) = **91** (kierunek poprawny).

| tura | Z (zapisany) | R (zapisany) | Z+R | Respekt LIVE | ΔZ/turę (nominalne) |
|---|---|---|---|---|---|
| 1 | 0 | 29 | 29 | 91 | −1,5 |
| 5 | 0 | 29 | 29 | 91 | −1,5 |
| 10 | 0 | 29 | 29 | 91 | −1,5 |
| 20 | 0 | 29 | 29 | 91 | −1,5 |
| 30 | 0 | 29 | 29 | 91 | −1,5 |

Wniosek z trajektorii: zapisany Respekt w wojnie jest sztywno ścięty do 29 już w pierwszej turze (clamp wojenny zabiera Zaufanie do 0, potem resztę z Respektu). Zapisany R nie rośnie. Spadek Zaufania −1,5/turę jest liczony, ale Z jest już na podłodze 0, więc nie jest widoczny.

Zdarzenia militarne (sekcja C skryptu):
- `wygrana_bitwa` (+5) i `przewaga_militarna` (+15) z R=29 → po zdarzeniu i po ticku R=29, Z=0.
- 30 × `wygrana_bitwa` z tickiem wojny → R końcowe 29, Z+R = 29.
Czyli nawet gdyby zdarzenia były podpięte, limit wojenny (Z+R ≤ 29, clampRelationForWar, diplomacy.ts:1121) zjadłby każdy przyrost.

## Z4b — Skąd −1,5/turę (ZMIERZONO na składowych silnika)

Funkcja computeTickZaufanieDelta (diplomacy.ts:1785-1812) przy atWar=true; positive sum jest zerowany (`if (atWar && dZ > 0) dZ = 0`), negatywny nie.

| składowe | ΔZ |
|---|---|
| granica, epoka <Brąz (−2) | −2 |
| granica −2 + wspólna religia (+0,5) | **−1,5** |
| granica −3 (Brąz) + wspólny wróg (+1) + wspólna religia (+0,5) | **−1,5** |
| granica −2 + odmienna religia (−0,5) | −2,5 |
| tylko wspólny wróg (+1) | 0 (zerowane w wojnie) |

Dominujący składnik: karaWspolnaGranica (sharedBorderPenaltyForEpochs: −2 / −3 / −4 wg max epoki, diplomacy.ts:598-607). Wiarygodność nie wchodzi w wojnie: applyDiploEventTracked daje wiarygodnosc=undefined dla statusu wojna (main.ts:12440-12456), a buildDiplomacyTickCtxForPair daje wiarygodnoscSelf=undefined w wojnie (main.ts, buildDiplomacyTickCtxForPair). Mnożnik tempa = 1 (applyWiarygodnoscTempoDoDelty przy undefined zwraca dZ bez zmian). Hipoteza z r2 („−2 × spadekMult ≈ 0,75”) jest błędna: w wojnie spadekMult nie działa.

Źródło liczby w panelu: main.ts, funkcja `relacjaDeltaPerTurn: zaufanieDeltaPerTurn` (wywołanie computeTickZaufanieDelta(tickCtxAudience, atWarAudience), ok. main.ts:25637-25652). Czyli −1,5 to realna wartość ΔZ z kontekstu pary, nie błąd UI.

## Z4c — Ślad zdarzeń militarnych (ZMIERZONO grep)

Literały `'wygrana_bitwa'`, `'przewaga_militarna'`, `'slabszy_militarnie'` w gra/src występują tylko w:
- gra/src/game/diplomacy.ts:1012, 1017, 1022 (definicja w switch applyDiplomaticEvent),
- gra/src/game/diplomacy-factors.ts:71-73 (etykiety),
- gra/src/game/power-objective.ts:146, 177 (klucz `wygranaBitwa` w współczynnikach Mocy, NIE zdarzenie dyplomatyczne).

Wywołania applyDiploEventTracked (main.ts, wrapper od linii 12440; wewnątrz applyDiplomaticEvent w linii 12450) z argumentem zmiennym:
- main.ts:23031 — `ev` = 'zerwanie_handlu_bez_kary' | 'zerwanie_handlu' | 'zerwanie_traktatu' (zerwanie traktatu).
- main.ts:23949 — `ev` = 'zlamana_obietnica' | 'zlamana_obietnica_ai' (breakTreatiesOnWar).
- main.ts:13341, 41017, 42507 — literał 'wojna_wypowiedziana'.
- main.ts:20902, 21566, 24531, 24758, 24933, 24950 — 'trybut_odmowa' / 'trybut_zaakceptowany'.
- main.ts:24865, 24927 — `isGift ? 'dar' : 'handel'`.

Żaden wariant nie przekazuje 'wygrana_bitwa' / 'przewaga_militarna' / 'slabszy_militarnie'. Potwierdzone: zdarzenia militarne nie są podpięte do silnika na żywo. Jedyny kanał bitew to składnik Mocy (wygranaBitwa, power-objective.ts), który wchodzi do computeRespekt przez potęgę, nie jako przyrost.

Uwaga do Z4c: w r2 wywołanie w main.ts:12450 uznano za niewyjaśnione — teraz wyjaśnione: to wnętrze wrappera, nie źródło zdarzenia.

## Z2 — Źródło 67 vs 89 vs 29 (ZMIERZONO w kodzie)

Są trzy różne liczby, każda z innego źródła:

1. **67 = „Relacja z perspektywy gracza 67 / 200”** — ekran audiencji: `audienceRelTotalEffective` (main.ts:25365-25369) = `rel.zaufanie + objectiveRespektPctTowardEffective(ownerId)`. Respekt tu jest LIVE (computeRespekt efektywnych Mocy, bez clampu wojennego). Z=0 → Relacja = Respekt LIVE = 67 (po stronie Mocy efektywnej, nie nominalnej).
2. **29 = „Respekt 29 / 100” (pasek) i „limit wojenny 29”** — `relacja`/`respekt` w kontekście bramek (buildDiplomacyLockContextBase, main.ts:25377; pole `respekt: rel.respekt ?? 0`, main.ts:25397) czyta ZAPISANY `rel.respekt`, który clampRelationForWar ściął do 29 (diplomacy.ts:1121; zapis w tickDiplomacy:1840-1852). Ta wartość jest w stanie gry, nie jest liczona na bieżąco.
3. **89 = computeRespekt(14682, 1854)** — to sprawdzenie formuły na wartościach rankingu z dispatchu. W ścieżce panelu wejściem nie są wartości rankingu, tylko objectivePowerForOwnerEffective (main.ts:2863). Nie da się z kodu odtworzyć, że 67 wynika z rankingu 14682/1854; dla 67 potrzebny jest stosunek ~2:1 po stronie efektywnej. Wejść nie zmierzono (NIE_ZMIERZONO).

Wniosek Z2: NIE jest to cache ani błąd znaku. Panel łączy dwa źródła w jednym ekranie: Relację liczy z Respektu LIVE (67), a pasek Respektu z zapisanego, ściętego w wojnie (29). Różnica 67 → 29 to dokładnie clamp wojenny. Rozjazd jest więc skutkiem reguły (limit wojenny) i rozdziału źródeł w UI, nie błędem liczenia. To potwierdza wcześniejszą diagnozę r2 („Relacja 67 vs pasek 29”), z dowodem liniowym.

## Odpowiedź na pytania ABC (bez decyzji)

Dane dla właściciela z pomiaru:
- Zapisany Respekt w wojnie nie może przekroczyć 29 − Z, niezależnie od mocy i zdarzeń (ZMIERZONO, sekcja B i C). To jest twarda reguła silnika, a nie brak składnika. Jeśli właściciel chce Respektu rosnącego z przewagą w wojnie, wymaga to zmiany limitu wojennego (WAR_RELATION_SCORE_CAP, diplomacy.ts:1121) albo osobnego składnika (wariant C).
- Podpięcie zdarzeń militarnych (B2) samo nie wystarczy: limit wojenny zjada przyrosty. Bez zmiany limitu B2 nic nie zmienia w wojnie, tylko poza nią.
- Rekomendacja operatora (z danych): B2 + jawny komunikat w panelu „limit wojenny 29” zamiast cichego ścięcia; C tylko jeśli właściciel chce odrębnej dominacji. Decyzja należy do właściciela.

## Otwarte (NIE_ZMIERZONO)
- Stan gry: rzeczywiste ΔZ i wejścia 67 (wymagają zapisu z sesji z Mocą i religią).
- Rozjazd AI: które Respekt czyta AI (zapisany vs LIVE) — diplomacy.ts:1287-1386 czyta zapisany rel.respekt; nie zmierzono ścieżki AI w żywej grze.
- Bramki kodu nie uruchamiane (brak zmian w src).
