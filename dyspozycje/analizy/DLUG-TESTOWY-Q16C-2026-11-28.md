# DLUG-TESTOWY-Q16C — stan na 2026-11-28 (temat R-WEB-TEST-DEBT-Q16C, runda 3 Operatora SONNET)

## Stan wiążący

- Baza: `1e7cccfa7` + merge `125b7aa14` (main z już zintegrowanymi ai-wojny 22/0 i hotseat-drugi-fotel 5/5). Zero zmian w `gra/src/**` i `gra/data/**` (zmieniony tylko `gra/tools/hotseat-etap4-noop-test.cjs`, dodane `gra/tools/tdq16c-diag-etap4.cjs`, `gra/tools/tdq16c-diag-pytb.cjs`).
- Bramki r3: `tsc --noEmit` RC 0; `logic-test.cjs` LOGIC OK (213/213); `ai-test.cjs` 297 passed, 0 failed.

| Test | Wynik r3 | Klasa | Dowód |
|---|---|---|---|
| `ai-wojny-zwykle-cap-dwa-miasta-test.cjs` | 22/0 (już w main, nie powtarzano) | A | runs/…/55–57 |
| `hotseat-drugi-fotel-tura-test.cjs` | 5/5 (już w main, nie powtarzano) | A | runs/…/43, 44 |
| `hotseat-etap4-noop-test.cjs` | ZIELONY: PASS 30/30 identycznych hashy A vs B, jsExc 0/0, 0 restartów Chromium | A (DWA artefakty testu, zero błędu gry) | runs/…/61 (PASS), 60 (bez drugiej poprawki: 4/30 FAIL), 64 (przyczyna zapisu t23) |

Pytanie B (−11 → −108): ZMIERZONE NA SANDBOXIE (pace 'niski', nie maksimum), wniosek „zamierzone” NIE POTWIERDZONY na maksimum. Dowód sandboxu: runs/…/62, 63. Pomiar na MAKSIMUM (obrona r3, zarzut nr 1, ziarna 11 i 7, nowa gra Bardzo ogromny): skoku −108 NIE odtworzono; spichlerz nie spada poniżej 0 przed t19 (runs/…/70, 71, 72). Szczegóły w sekcji „Pytanie B na maksimum (obrona r3)”.

## 1. hotseat-etap4-noop-test.cjs — klasa A, dwa osobne pinowe artefakty

### 1a. Zapis tury 23 (przyczyna 6/6 nieudanych prób z r2/r3)

- Pomiar na żywo (`tools/tdq16c-diag-etap4.cjs`, runs/…/64): po `endTurn` t22→t23 gracz (pasywny, 1 miasto, 26 jednostek) jest w realnej bitwie; w DOM otwarte jest PODSUMOWANIE BITWY (klasy `pbs-roster-col`: „WOJSKA AI · 1 … −36%”, „TWOJE WOJSKA · 2 … poległo: 2”), okno przed bitwą (`.pb-overlay`) NIE jest otwarte. Toast: „Zapis niedostępny w trakcie bitwy”.
- Kod: `src/main.ts` `doQuickSave` (ok. l. 43091–43096) wychodzi wcześnie przy `isSaveBlockedByBattle()` = `isBattleSceneOpen() || isPostBattleSummaryOpen()` (l. 43048–43050); `isPostBattleSummaryOpen()` = `overlayEl !== null` (`src/ui/postBattleSummary.ts` l. ~597). To CELOWA reguła (R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1), zapis w trakcie bitwy ma być zablokowany. Rotacyjny autozapis (inna ścieżka) działał, stąd w r2 „stan się zapisuje, ale Ctrl+S nie”.
- Klasyfikacja: A (test zamykał tylko ekran powitalny, nie podsumowanie bitwy). NIE B: gra zachowuje się zgodnie z regułą. NIE C: deterministyczne, nie losowe.
- Naprawa testu: `closeBattleOverlays(page)` (po `closeCivWelcome`, przed zapisem): realny klik „Auto” w `.pb-overlay` albo przycisku „Kontynuuj” (footer button w overlayu podsumowania), jak w `tools/ai-*-measure-run.cjs`. Asercje bez zmian.

### 1b. Rozbieżność A vs B od tury 5 (ujawniona po 1a; wcześniej niewidoczna, bo test padał w t23 przed porównaniem)

- Pierwszy pełny przebieg po 1a (runs/…/60): A i B przeszły 30 tur, ale `4/30 identycznych hashy`, pierwsza rozbieżność tura 5 → FAIL.
- Diff snapshotów A vs B (`tools/tdq16c-diag-etap4.cjs`, 6 tur): w t1–t4 0 różnic; w t5 DOKŁADNIE 6 różnic, wszystkie `units[].stackGroupId` (np. `sg1_mx07jggt_1` vs `sg1_mx07l6lm_1`). Przyczyna: `freshStackGroupId` (`src/game/armyMerge.ts:78-81`) = `'sg' + ownerId + '_' + Date.now().toString(36) + '_' + licznik` — drugi zegar ścienny w zapisie (poza `meta.savedAt`, który test już normalizował). Ten sam artefakt jest znany w `src/game/det-digest-normalize.ts`. Struktura grup i licznik są identyczne w A i B.
- Klasyfikacja: A (zegar ścienny w identyfikatorze; nie błąd silnika: id jest tylko unikalną etykietą). Naprawa testu: `normalizeStackGroupClocks` zamienia wyłącznie środkowy segment czasu na `<t>` (owner i licznik zostają, więc relacja równości grup i kolejność tworzenia nadal są porównywane). Docstring pkt 3 testu („jedyny zegar ścienny to savedAt”) był nieaktualny — poprawiono komentarzem przy funkcji.
- Mutacje czerwone→zielone: (i) bez `closeBattleOverlays` → BLOCK w t23 (runs/…/64, ta sama ścieżka co 6/6 prób r2/r3); (ii) bez `normalizeStackGroupClocks` (= wynik runs/…/60) → FAIL 4/30, rozbieżność w t5; (iii) z obiema poprawkami → PASS 30/30 (runs/…/61), A i B bez crashu Chromium.
- Ustawienia testu: `startNewGame('normal', 2)` z haka (`kosztJednostekPace = niski`, `buildingCostPace = niski`, `wzrostLudnosciPace = wysoki`) — to NIE jest maksimum. NIE ZMIERZONO na maksimum: hak `__cityStateStartUnitsTestDebug.startNewGame` ma te wartości zaszyte w main.ts (zmiana = zmiana gra/src, zakazana), a test jest bramką determinizmu A vs B, nie pomiarem balansu; skutkiem są inne hashe, nie inna poprawność. Poziom maksymalny nie jest dostępny przez ten hak.
- Czas: pełny przebieg ok. 12 min (A ≈ 5 min + B ≈ 5 min + build); narzędzie przeniosło bieg w tło po 590 s (polling pliku wyjściowego), brak `&`/`nohup`.

## 2. Pytanie B — skok Spichlerza −11 → −108 (R-WEB-TEST-DEBT-Q16C, diagnoza r1)

Scenariusz: `?playtest=mapa&civTest=1`, pasywny gracz (1 miasto `city0`, 3 Hastati, `poziomRacji = 0.5`), harness `ai-wojny-zwykle-cap-dwa-miasta` (`pullPlayerUnitsHome` + `endTurn`). Narzędzie: `gra/tools/tdq16c-diag-pytb.cjs` (odczyt `__nnsMeasureDebug.gateInfo()`, `setRationAll`, tylko odczytowe poza ustawieniem racji; `PYTB_RACJA0=1` utrzymuje racje 0 od t17). Surowe: runs/…/62 (racje 0/1/6/12 w t15–21) i runs/…/63 (racja 0 trwale od t17).

Zmierzone (Spichlerz = `spichlerzPo` = stan + bilans tury):

| Tura | Stan Spichlerza | Racja | Prognoza po turze | Zmiana/turę |
|---|---|---|---|---|
| t15 (łaska) | 304 | 0,5 | +327 | +23 |
| t16 | 327 | 0,5 | +158 | −169 |
| t17 | 158 | 0,5 | −11 (blokada) | −169 |
| t17 | 158 | 0 | +25 | −133 |
| t18 (po wydaniu t17 na racji 0) | 25 | 0 | −108 (blokada) | −133 |

Wyjaśnienie: −108 = 25 − 133. Skok NIE jest skutkiem obniżki racji do 0 (obniżka poprawia prognozę o +36/turę: −169 → −133). Bilans netto na racji 0 jest STAŁY −133/turę w t16–t21 (w r63: 158→25, potem prognozy 25−133, i po podniesieniu stanu przez harness 866→733→600→467, zawsze −133). Prognoza spadła, bo STAN spadł: na racji 0 t17 kończy się stanem 25, a t18 zaczyna z 25 i odejmuje te same 133. W r1 mierzono „−11 przy racji 12 → −108 przy racji 0” z dwoma różnymi stanami zapasu (158 vs 25).

Skąd −133/turę (zamierzone wg zasad gry):
- Łączny koszt wojska w żywności = 192/turę dla 3 Hastati (dźwignia „rozwiązanie jednostek (żywność): +192” w komunikacie bramki, runs/…/62), czyli 64 na jednostkę. Wzór `unitFoodPerTurn` (`src/game/economy-upkeep.ts` ok. l. 1175–1204): `base(tabela, 1) → unitFoodBaseByEpoch` (epoka jednostki: Hastati = Żelazo, geometria ×1/×4/×16 przy włączonej fladze rebalansu epok) `× R_STAWKI_FALA1_FALA2_MULT (×4) × mnoznikUtrzymaniaJednostek(pace)` = 16 × 4 × 1 (pace 'niski' w tym scenariuszu) = 64. To wynik decyzji właściciela: rebalans ekonomii wg epok (FALA 871) i koszty jednostek ×4 (UPKEEPMULT, FALA 883).
- Produkcja żywności pasywnego miasta ≈ +59/turę brutto po racji 0 (192 − 133); przy racji 0,5 koszt racji dodaje −36 (stąd −169).
- Okno łaski: `paceUtrzymaniaWlasciciela` zwraca 0 dla gracza tylko w t1–15 (`src/game/ai-free-unit-upkeep.ts` l. 83–95, `playerUnitUpkeepGraceActive`). Dlatego t15 = +23, t16 = −169: koszt 192 jednostek włącza się od t16 (potwierdza zmierzone t15→t16).

Klasyfikacja: ZAMIERZONE przez zasady gry (koszt jednostek ×4 × geometria epok, okno łaski 15 tur), nie defekt kodu. Kandydat do decyzji właściciela (gra, nie test): pasywny gracz z jednym miastem i 3 jednostkami epoki Żelaza ma od t16 stały deficyt żywności, więc bramka „Zakończ turę” blokuje od t17 (jedyne wyjście: rozwiązanie jednostek, bo racja 0 i podatek nie wystarczają od t18). To dokładnie temat Q42 (R-WEB-POST-GRACE-UPKEEP-Q42, CZEKA NA WŁAŚCICIELA) — nie zakładam nowego pytania ABC.

Ograniczenia pomiaru (NIE ZMIERZONO): jedno miasto w sandboxie `?playtest=mapa` (stały świat, pace 'niski' domyślny dla `player.kosztJednostekPace`, nie maksimum: sandbox nie ma suwaka); ziarna 11 i 7 przez `startGame` NIE mierzone (nie zmienia wniosku arytmetycznego −133/turę, ale liczby per ziarno NIE ZMIERZONO); `kosztArmii` rozbity per jednostka NIE ZMIERZONO osobno (tylko suma 192 z komunikatu bramki).

## Nie ZMIERZONO (jawnie)

- Pytanie B na ziarnach 11 i 7 (`startGame`) i na maksimum „Koszty jednostek” — scenariusz w sandboxie `?playtest=mapa` (pace 'niski').
- Test etap4 na poziomie maksymalnym ustawień (hak z zaszytymi wartościami, patrz 1b).
- Czy `closeBattleOverlays` jest potrzebne na innych ziarnach/trasach (test używa jednego ziarna 778899 i seeda PRNG 424242; w t23 jest bitwa — pozostałe tury nie wymagały zamykania).

## Uwagi dla orkiestratora

- Dodane pomocniki `tdq16c-diag-etap4.cjs` i `tdq16c-diag-pytb.cjs` (tylko odczyt/diagnostyka); można je zostawić jako narzędzia lub usunąć przy integracji.
- Znalezisko poza zakresem (kandydat do tematu): drugi zegar ścienny `Date.now()` w `freshStackGroupId` jest zapisywany do save; `det-digest-normalize.ts` normalizuje go tylko w digest testowym. Nie jest błędem gry, ale każdy test porównujący surowe snapshoty musi go normalizować (jak teraz etap4).
- `git diff gra/src gra/data` = 0.

## Pytanie B na maksimum (obrona r3, zarzut nr 1 Evaluatora)

Zarzut: pytanie B nie zmierzone na maksimum ani na ziarnach 11 i 7. PRZYJĘTE; pomiar wykonany, wynik poniżej.

Narzędzie: `gra/tools/tdq16c-pytb-max.cjs` (tylko odczyt + `setRationAll` + `prepareEndTurnGate`, ten sam wzór co `tdq16c-diag-pytb.cjs`). Start: nowa gra przez hak `__settingsLive.startNewGame` z parametrami MAX (Trudny; dyplomacja i wojna trudna; kultura i religia trudny; Koszty jednostek **Wysoki ×4**; wzrost ludności wysoki; mapa **Bardzo ogromny** = klucz `Super Huge`). Ziarno z parametru `seed` (11 i 7). Pasywny gracz: `pullPlayerUnitsHome` + `endTurn` do t19.

Ustalenia dotyczące maksimum:
- Maksimum mapy: `Super Huge` jest najwyższym rozmiarem w menu. Najpierw nie ładował świata (brak miasta gracza), po dodaniu kroku z `awaitingFirstCity` / `foundFirstCity` (procedura `grace15fx-active3-live.cjs`) świat ładuje się w ok. 17 s.
- Koszty jednostek: `wysoki` (×4) to maksimum z listy `KosztJednostekPace`. Koszty budynków zostały na `niski` (wartość z istniejącego narzędzia max-measure); `wysoki` dla kosztów budynków NIE zmierzono. Pozostałe ustawienia jak w `live-playtest-gate-max-measure.cjs`.

Wyniki (runs/…/70 seed 11 sweep; 71 seed 7 sweep; 72 seed 11 racja 0 od t17):
- Start: 1 miasto, 2 jednostki (nie 3 jak w sandboxie). Racja automatyczna (`auto: true`), w sandboxie `auto: false`. Rozbieżność scenariusza, nie wnioskowana.
- Seed 11 i seed 7 dają IDENTYCZNE liczby bilansu t1–t19 (ziarno jest ustawiane, ale bilans miasta startowego w tych turach nie zależy od mapy; przyczyny nie zbadano).
- Prognoza Spichlerza przy racji 2 (sweep, t15): po turze 15 (obecny 14) = 15; t16 (obecny 15) = 0; racja 0 w t17: po turze 17 (obecny 16) = 17; t18 (obecny 17) = 18. Brak skoku −108. Przy sweepie t15 racja 0/1/6/12 → po 31/23/0/0; t16 → po 16/8/−16/−16 (racja 6 i 12 dają deficyt, ale to racje sweepu, nie trwały stan).
- Blokada tury w t19: po stronie **Skarbca** (złoto: zabraknie 12, podatek +8, rozwiązanie jednostek +16), nie Spichlerza. Gate t19 przy racji 0 nadal `blokada: true` ze względu na skarbiec.
- Tury bez błędów strony (`PAGEERRORS` 0).

Wniosek (uczciwie): na maksimum, na ziarnach 11 i 7, w nowej grze, skok prognozy Spichlerza o −108 z sandboxu NIE występuje. Wniosek „zamierzone przez zasady gry (−133/turę)” z sandboxu pozostaje arytmetyką na pace 'niski' i 3 jednostkach; w maksimum NIE ZMIERZONO tej wartości (w nowej grze bilans food jest dodatni przy 2 jednostkach). Pytanie B zostaje otwarte jako „sandbox-only”: nie jest dowodem defektu gry ani dowodem zamierzonego zachowania na maksimum.

NIE ZMIERZONO (jawnie): rozbicie `kosztArmii` per jednostka; koszty budynków na wysoki; sandbox `?playtest=mapa` na maksimum (sandbox nie ma suwaka Koszty jednostek); ziarno 7 z wynikiem różnym od 11 (wynik identyczny); t20+; `auto: false` na maksimum (sandbox ma ręczną racją).

Odrzucenie zarzutu drugiego: brak (zarzut nr 1 jest jedynym). Kolejność: zarzut przyjęty w całości, dowody runs/…/70–72.
