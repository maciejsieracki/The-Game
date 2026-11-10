STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1
GOAL: Wariant A panelu „Rekrutacja” (web): wiersz jednostki w jednej linii (wysokość około 32 px, test ≤ 36). Pula rekrutów państwa jako jedna linia nad listą. Na wierszu liczba potrzebnych i czerwone „brak N”, pełny tekst w tooltipie. Panel działa przy 340, 307 i 280 px.
ZMIANY/COMMIT: oceniany commit `72e876d6` (rodzic `c11f5087` = origin/main). Ten raport jest jedyną zmianą Evaluatora.
RUNDY: 1/5

## Co sprawdziłem samodzielnie (czysty worktree, `npm ci --ignore-scripts`, potem `node_modules` usunięte)

- Allowlista: diff `c11f5087..72e876d6` obejmuje 16 plików, wszystkie z allowlisty. `hudLayout.ts` i `cityUxFrame.ts` są nietknięte. `git diff --check` czysty.
- `recruitment-panel-compact-row-test`: 38/0. Zmierzone maksymalne wysokości wiersza: 340 → 34,3 px, widoczne 13/13, ucięta 1/13; 307 → 34,3 px, ucięte 3/13; 280 → 34,3 px, ucięte 5/13. Poziome przewijanie przy każdej szerokości: brak.
- Ten sam test z `--baseline c11f5087`: 20 pass, 18 fail, K1, K2 i K3 czerwone (kontrola negatywna działa).
- Własne mutacje w kodzie, przywrócone po teście:
  - usunięcie linii puli w `cityPanel.ts` razem z `display:none` na „brak N” daje 32/6, czyli K5 czerwone przy każdej szerokości;
  - `recruit-card-manpower --mutate` daje 10/10 (10 asercji czerwonych).
- Zestaw przy puli 1 tys. (pomiar dodatkowy, którego w teście nie ma): ucięte nazwy przy 340 px to 1/13, widoczne wiersze 13/13.
- Wyniki testów:
  - recruit-card-manpower: 20/0
  - recruitment-panel-height: 12/0
  - quantity: 25/0
  - stock-chip: 15/0
  - resource-strip: 18/0
  - unit-recruit-nazwa: 17/0
  - city-panel-growth: 29/0
  - konwerter: 83/0
  - uwagi-abc: 44/0
  - hostcard: 12/0
  - spichlerz-cap: 12/0
  - entity-card-contract: 75/0
  - side-list-hud: 74/74
  - **hud-tooltip-body-mounted-panels: 16/0** (Operator podał 13/3 i NIE_ZMIERZONO na main; u mnie test jest zielony)
  - `tsc --noEmit`: 0 błędów
  - `vite build` do katalogu tymczasowego: OK, katalog usunięty
- Spójność danych: linia puli i `data-available` na kartach liczą się z tej samej funkcji `empireRekruciTotal(city)` (`cityPanel.ts:8213`, `:9047`).

## Zarzuty

1. **(BLOKUJĄCY) Kontrola mutanta w teście wysokości jest pusta.**
   - Asercja jest w `recruitment-panel-height-real-render-test.cjs:330-331`.
   - `layoutPass` nadal wymaga `exactlyOneActiveScrollbar`. Operator dopuścił 0 pasków przewijania na dużym ekranie, a w czystym kodzie na dużym ekranie jest teraz 0 aktywnych pasków. Dlatego zmierzone `clean.large.layoutPass` daje `false`.
   - Asercja `(mutant) … mutant.large.layoutPass === false` (`:429`) przechodzi więc bez względu na to, czy mutant w ogóle zmienia układ. Test nie odróżnia już starego układu od nowego.
   - Tej zmiany nie ma na liście „było → jest” w raporcie Operatora.
   - Naprawa: w `layoutPass` dla dużego ekranu użyć `atMostOneActiveScrollbar`. Dodatkowo sprawdzić `clean.large.layoutPass === true`.
2. **Wiersz nie jest w jednej linii (wymaganie 1 dispatchu, makieta A).**
   - W makiecie (`R-WEB-REKRUTACJA-PANEL-UX-Q1/makiety/wariant-A-wiersz.html:132`) koszt jest osobną kolumną w tej samej linii co nazwa.
   - U Operatora koszt jest drugą linią w kolumnie nazwy (Z1), a wysokość wiersza wynosi 34,3 px wobec „około 32 px”.
   - Wynik mieści się w kryterium testu (≤ 36), a odstępstwo jest uzasadnione pomiarem: przy koszcie w osobnej kolumnie ucinało się 12/13 nazw.
   - To jednak zmiana zatwierdzonego przez właściciela wariantu. Wymaga świadomej akceptacji przez Final Control lub orkiestratora. W przeciwnym razie trzeba ją poprawić.
3. **K3 zaniża liczbę uciętych nazw.**
   - Próg w `recruitment-panel-compact-row-test.cjs:275` ma tolerancję `+1` px.
   - Na zrzucie `zrzuty/po-rekrutacja-280px-brak-rekrutow.png` nazwa „Taran ok…” jest wyraźnie ucięta, a pomiar jej nie liczy (lista zawiera 5 nazw, bez „Taran okuty”).
   - Przy 340 px wynik się nie zmienia (1/13 według zrzutu i pomiaru). Wpływ jest więc niski, ale metryka jest nieścisła.
4. **K3 nie jest mierzone w stanie braku rekrutów.**
   - W tym stanie wskaźnik „brak N” zabiera miejsce nazwie, a jest to stan typowy we wczesnej grze.
   - Mój pomiar dodatkowy: 340 px → 1/13. Kryterium jest spełnione, ale test go nie pilnuje.
5. **Utrzymanie surowcowe znika z wiersza przy każdej realnej szerokości, nie tylko „przy wąskim panelu”.**
   - Lewy panel ma najwyżej 340 px, a wiersz ma szerokość ≤ 294 px, czyli mniej niż próg `@container urc (max-width:300px)`.
   - Ukryty `<span title>` nie daje podpowiedzi. Informacja zostaje tylko w karcie szczegółów (`attachHoverDetail`, `unitAdapter.ts:229-241`).
   - Jest to zgodne z makietą (która chowa `.up` poniżej 400 px), ale opis Z3 jest nieprecyzyjny.
6. **Raport Operatora ma 717 słów**, a limit w dispatchu to około 500.
7. **Uwaga BLOKADY w raporcie Operatora (hud-tooltip-body 13/3) nie potwierdza się:** u mnie ten test daje 16/0. Do sprostowania w raporcie.

ZAŁOŻENIE E1: polecenie orkiestratora dla Evaluatora (wywołania `ctx.*`, P4-25, tiny-skia, Cargo.lock, Rust 1.87.0, hash RGBA, metryka Chromium, `unsafe`) nie dotyczy tego dispatchu. To temat webowy TS, w którym `rust-port/**` i `src-tauri/**` są poza allowlistą i nie zostały zmienione. Te punkty uznaję za nieadekwatne (N/A) i oceniam według dispatchu. Działa tu ta sama niedopasowana kopia co w Z4 Operatora (sekcje KONTEKST i BINARNE KRYTERIUM).

TESTY: wymienione wyżej, wszystkie zielone; kontrole negatywne uruchomione.
BLOKADY: zarzut 1 (blokujący), zarzut 2 (wymaga decyzji Final Control lub orkiestratora).
NASTĘPNY KROK: Operator r2. Naprawić zarzut 1 (i najlepiej 3 i 4), sprostować punkty 5 i 7 w raporcie, następnie Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO
