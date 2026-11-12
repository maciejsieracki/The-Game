STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1
GOAL: ustalić, co oznaczają „Relacja 11,6” (wiersz „Wpływ Relacji na deal”) i „Relacja 90 / 200” (audiencja) dla tej samej pary, czy to błąd wyświetlania. Runda 2/5: pomiar Chromium w żywej grze, pełna tabela UI → źródło, trzy wielkości, status wojny i clampRelationForWar. Zmiany kodu gra/: BRAK.
BAZA/KANDYDAT: kandydat 2632a616e (web-wip, detached) + origin/main 44af89169 już zawarte w historii (merge: Already up to date). Zmiany w gra/src: brak.

## Wynik pomiaru (REALNY pomiar, nie czytanie kodu)

Test: gra/tools/diplomacy-relation-value-mismatch-live-test.cjs (nowy, allowlista `gra/tools/*-test.cjs`). Headless Chromium, bundle vite zbudowany POZA repo (`vite build --outDir` w scratchpad), `?playtest=mapa&civTest=1`. AI składa propozycję przez REALNY endTurn (AI id=1, status pary przed endTurn: `pokoj`), okno otwierane klikiem karty HUD „Dyplomacja”. Wynik: 7 pass / 0 fail, exit 0.

Surowe teksty z tego samego okna (z `drvm-result.json`):
- Wiersz „Wpływ Relacji na deal”: `−88,4%` · `Relacja 11,6 · Twoja strona słabsza (−88,4% PW); oni: baza`
- Linia audiencji: `Stan bieżący: Relacja 90 / 200 · Zaufanie 1 / 100 · Respekt 89 / 100 · nastawienie: Życzliwy`
- Prawy panel: `Zaufanie 1 / 100 (+0.0/turę)`, `Respekt 89 / 100`, `Relacja 90 / 200 (Zaufanie + Respekt)`
- Wymagania zablokowanych pakt/sojusz: `wymaga Zaufania 30 (masz 0.6) i Relacji 110 (masz 90)`
- Status pary w oknie: `POKÓJ`; w teście `prepare()` zwrócił `status: pokoj`.
- Zrzut (obejrzany): `dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/evidence/drvm-01-okno-relacja.png`

Wniosek z liczb: obie wartości są w TYM SAMYM oknie dla TEJ SAMEJ pary, i różnią się WYŁĄCZNIE składnikiem Respekt:
- Zaufanie zapisane = 0,6 (z `masz 0.6`, pole nie zależy od mocy) → 11,6 − 0,6 = **Respekt zapisany ≈ 11,0** (wyprowadzone z różnicy, nie odczytane wprost).
- Respekt „live” (z mocy, `objectiveRespektPctToward`) = **89** → Zaufanie(1, zaokr.) + 89 = **90**.
- Zatem 11,6 to wartość silnika (zaufanie + respekt zapisany inkrementalnie), a 90 to wartość z udziału mocy. To DWIE RÓŻNE wielkości, nie błąd sumowania. Rozjazd jest w Respekcie.

## Tabela: miejsce w UI → źródło → znaczenie (zweryfikowane liniami w kodzie)

| Miejsce w UI (ten sam ekran audiencji/okna dyplomacji) | Źródło (kod, sprawdzone w tej rundzie) | Znaczenie |
|---|---|---|
| „Wpływ Relacji na deal” `Relacja 11,6`, „Twoja strona słabsza (−88,4% PW)” | main.ts:21164 i :21213 `treatyEvalRelationTotal(ctx.relation)` → main.ts:21277 `computePlayerAcceptanceSides(..., relTotal)` → diplomacyAcceptanceBalance.ts (wiersz `.da-pn-rel-mod`, `relTotal = side.relCurrent`) | ZAPISANA relacja = clamp(zaufanie+respekt, 0, 200) (diplomacy-pn-engine.ts:147-149). Steruje modyfikatorem PW (−88,4%) i bramką „Przyjmij”. |
| Nagłówek „Bilans (netto)” / hint PW w oknie | diplomacyAcceptanceBalance.ts:638 `their.relCurrent` | to samo co wiersz wyżej (zapisana) |
| Audiencja „Relacja 90 / 200”, „Stan bieżący”, prawy panel „Relacja 90/200” | main.ts:25639 `relacjaTotal: audienceRelTotalEffective(ownerId, rel)` (definicja main.ts:25354-25358) → diplomacyAudience.ts:1535 i :2237 | EFEKTYWNA power-based: zaufanie + respekt z mocy z bonusami (weteran/fortyfikacja/trudność), zaokr. Tylko wyświetlanie. |
| Wiersze zablokowanych akcji `masz 90` (pakt/sojusz/przemarsz) | lockCtxBase (main.ts:25451), komentarz main.ts:25349: nominalna | NOMINALNA power-based (bramki odblokowania). W tym scenariuszu = 90, czyli równa efektywnej (brak bonusów różnicujących). |
| Koszyk audiencji / progi handlu i daru (`diplomacyFairGivePn`, `getNegotiationContext.relacjaTotal`) | main.ts:25762 `relacjaTotal: audienceRelTotal(ownerId, rel)` → diplomacyTradeBasket.ts (ctx.relacjaTotal) | NOMINALNA power-based (bez bonusów efektywnych). NIE pokazuje zapisanej 11,6. |

Korekta względem raportu r1: r1 pisał, że 90/200 „steruje progiem handlu”. To było błędne: próg handlu i bramki używają wersji NOMINALNEJ (25762), a 90/200 na ekranie to wersja EFEKTYWNA (25639). Wyświetlana „90/200” nie jest tą liczbą, która bramkuje handel.

## Trzy wielkości (z kodem)

1. Zapisana: `clamp(zaufanie + respekt, 0, 200)` = 11,6 w oknie PW. Silnik, modyfikator PW i bramka pwBalance.
2. Nominalna power-based: `round(clamp(zaufanie + objectiveRespektPctToward))` (main.ts:25349-25352 / audienceRelTotal). Bramki odblokowania akcji (lockCtx) i progi handlu/daru (main.ts:25762). Nie wyświetlana jako „Relacja X/200” w oknie.
3. Efektywna power-based: `round(clamp(zaufanie + objectiveRespektPctTowardEffective))` (main.ts:25354-25358). Wyświetlana jako „Relacja 90 / 200” w audiencji (main.ts:25639).

W badanym scenariuszu 2 i 3 dają tę samą wartość (90), więc rozjazd 90 vs 11,6 wynika z pary (1) vs (3). Rozdział (2) od (3) NIE został zmierzony liczbowo (wymaga bonusów: weteran/fortyfikacja/trudność), NIE_ZMIERZONO.

## Status wojny i clampRelationForWar (NAPRAWA 4)

- Status pary w pomiarze: `pokoj` (linia `POKÓJ` w oknie; `prepare()` zwrócił `status: pokoj`).
- diplomacy-proposals.ts:712-715: `treatyEvalRelationTotal` stosuje `clampRelationForWar` WYŁĄCZNIE gdy `rel.status === 'wojna'`.
- diplomacy.ts:1121-1123: `clampRelationForWar` zwraca `rel` bez zmian, gdy status ≠ `wojna`.
- Wniosek: w pokoju 11,6 NIE jest przycinane. Przycięcie wojenne mogłoby zmienić 11,6 tylko w stanie wojny (WAR_RELATION_SCORE_CAP = 29 w skali relationScore, obniża Zaufanie, potem Respekt).
- Liczby dla stanu wojny: NIE_ZMIERZONO (pomiar w wojnie nie był w zakresie tej rundy; w pomiarze nie wymuszano wojny, bo po endTurn AI nie składa propozycji w wojnie). Kod wskazuje, że w wojnie wartość 11,6 mogłaby być niższa.

## Pytania dispatchu — odpowiedzi

- Które okno pokazuje 11,6: wiersz „Wpływ Relacji na deal” w oknie dyplomacji/audiencji po otwarciu z HUD (ten sam ekran co „Relacja 90/200”). Pomiar pokazał oba teksty w jednym oknie.
- Którego źródła używa 90/200: efektywnej power-based (main.ts:25639), NIE nominalnej.
- Czy 90/200 steruje progiem handlu: NIE. Progi handlu/daru używają nominalnej (main.ts:25762).
- Czy clampRelationForWar przycina 11,6: NIE w pokoju (zmierzone status `pokoj`). W wojnie: kod tak, liczby NIE_ZMIERZONO.

## Nie wprowadzono zmian kodu. Dlaczego

Addendum dopuszcza wyłącznie etykiety wariantu B, gdy pomiar wykaże dwie różne wielkości. Pomiar to wykazał. Jednak r1 i r2 ustaliły, że nazwy etykiet wymagają akceptacji właściciela, a wariant A (ujednolicenie) to decyzja produktowa. Nazwy są decyzją produktową, więc nie wybieram ich sam. Brak zmian kodu gra/ (allowlista nietknięta), brak mutacji.

## Propozycja etykiet (do ABC, wariant B)

- Wiersz PW: „Relacja zapisana 11,6 (zaufanie + respekt z historii)”.
- Audiencja: „Relacja z mocy 90 / 200 (respekt = udział mocy)”.
- Opis w tooltipie: nominalna (bramki handlu) i efektywna (wyświetlana) to dwie różne wielkości — do rozdzielenia osobno w razie wariantu A.

## Testy / bramki (surowe wyjścia w evidence/)

- `npx tsc --noEmit`: exit 0 (plik `evidence/bram-tsc.log`, 0 linii błędów).
- `node tools/logic-test.cjs`: exit 0, `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: exit 0, `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs`: exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs`: exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs`: exit 0, `All sanity checks passed.`
- `tools/diplomacy-relation-value-mismatch-live-test.cjs` (Chromium, żywa gra): `7 pass, 0 fail`, exit 0, zero console.error/pageerror.
- Mutacja: NIE DOTYCZY (brak zmiany kodu).

## ZMIANY/COMMIT

- Kod gra/src: BRAK zmian.
- Nowy test pomiarowy: gra/tools/diplomacy-relation-value-mismatch-live-test.cjs (allowlista `gra/tools/*-test.cjs`).
- Dowody: dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/evidence/ (drvm-result.json, drvm-01-okno-relacja.png, logi bramek).
- Raport: dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/10-operator-claude.md.
- Commit: test + evidence + raport (wszystko w allowliście; test jest potrzebny, by FC mógł powtórzyć pomiar).

## BLOKADY

- Decyzja właściciela (ABC): wariant A (ujednolicić progi) czy B (etykiety; nazwy powyżej) czy C (zostawić i opisać).
- Nieobjęte pomiarem: liczby w stanie wojny (NIE_ZMIERZONO), rozdział nominalnej od efektywnej przy aktywnych bonusach (NIE_ZMIERZONO).
- Allowlista: diplomacyAudience.ts jest w addendum (tylko wyświetlanie), nie zmieniano go.

## RUNDY

2/5 (runda operatora po FC FAIL r1). Orkiestrator decyduje o R3.

## NASTĘPNY KROK

Orkiestrator: (1) ABC właściciela: A/B/C i nazwy etykiet; (2) po wyborze B: Operator R3 — etykiety w diplomacyAcceptanceBalance.ts i diplomacyAudience.ts, mutacja testu, tsc + 5 bramek; (3) przy wojnie: osobny pomiar z wymuszonym statusem `wojna` (zmierzyć 11,6 przed i po clampRelationForWar).

DEPLOY/PUSH: NIE WYKONANO
