STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1
GOAL: Odpowiedź Operatora (obrona, runda 1) na zarzuty Evaluatora z 02-evaluator.md: przyjęcie z poprawką i dowodem albo odrzucenie z dowodem.
ZMIANY/COMMIT: poprawka dokumentu `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1-ROZPOZNANIE.md` — commit `df8599989` (na bazie `ddd65a4e8`, czyli na commicie Evaluatora; branch wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 nie był przesuwany). Zmiany tylko w allowliście (dokumenty), brak zmian w `src/**`, `tests/**`, `gra/**`, `Cargo.*`.
TESTY: NIE DOTYCZY (zmiany wyłącznie dokumentacyjne; brak cargo). Weryfikacja: `git diff --check` czysty; odczyt pina `git show 07d2fbd72:gra/src/main.ts` (kopia lokalna poza repo); ponowny grep po `rust-port/`, `src-tauri/`, `gra-robocza/` (bez `tests/`).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja poprawek 1–8 względem pina i grepów) → Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ. Pin potwierdza: bramka w `main.ts:34668–34677` (`(allowCityCapture===true || siegeContext===true) && mapWinner==='atakujacy' && cityOnHex && owner != atk && atkRoster[0] !== undefined && areEnemyOwners && !barbCaptureBlockedByRemainingDefenders && !fortifiedCaptureBlocked`) dotyczy każdego atakującego; komentarz `34651–34662` mówi, że dodatkowe sprawdzenie obrońców (`isCityCaptureBlockedByDefenders`) dotyczy WYŁĄCZNIE atakującego-barbarzyńcy (`34664–34666`). Poprawiono wiersz P6, W1, sekcję „Gałąź zdobycia w bitwie” i Z5 (commit `df8599989`).

2. PRZYJMUJĘ. Pin: `applyCityCaptureToMap` (36034) woła `applyCityCaptureAfterBattle` (wołanie `main.ts:36061`, import `main.ts:963`, definicja w `game/post-battle-map.ts`). Dodano węzeł P9 i wiersz „Producent `applyCityCaptureAfterBattle` (P9)” w sekcji braków; Z1 obejmuje P9. Rust: `grep -rn 'after_battle|post_battle' rust-port/ --include=*.rs | grep -v /tests/` — pusty (potwierdzone ponownie).

3. PRZYJMUJĘ (część zarzutu). Pin `main.ts:36049–36053` potwierdza, że `applyPostCaptureLawOnCapture` NIE jest wołany w main.ts w P1 — wołany jest przez P9 w `post-battle-map.ts`. Przeniesiono go do opisu P9. Dodatkowo pin `main.ts:17702` wywołuje `applyPostCaptureLawOnCapture` bezpośrednio w P4 (kapitulacja), więc to wejście pozostaje w P4. Kolejność `wasProtectedRebel` (`main.ts:36055`) PRZED `applyCityCaptureAfterBattle` (`36061`) opisano w P1 i w Z1 jako wymóg.

4. PRZYJMUJĘ. Zarzut trafny: `grep -rn 'cession|transfer_city'` w `rust-port/` poza testami daje trafienia `city_cession_ok` / `cs_blocks_cession`: `ai_peace_city_offer.rs:234,280`; `war_turn_ai_ai.rs:79,126,139`; `diplomacy_war_weariness_tick.rs:194,377`; `diplomacy_ai_forced_peace.rs:382,644`. Są to wstrzyknięte predykaty (bramki), nie producent przeniesienia miasta. Producent `transferCityByTreaty` / `planCityCession` nadal BRAK (potwierdzone: brak funkcji przenoszącej miasto). W W11, sekcji braków i Z7 opisano bramki jako wejścia tematu Z7.

5. PRZYJMUJĘ. Pin: produkcyjny call site `onBarbarianCityBattleResolved` to `main.ts:43398` (`launchIncomingMapFieldBattle` w fazie barbarzyńców), callback przekazany w `main.ts:43406`. Hak testowy `__defeatTestDebug` (`main.ts:28641`, komentarz `28662`, wołanie `launchIncomingMapFieldBattle` `28682`, callback `28685`) dodany do W14. Wiersz W13 i sekcja braków uzupełnione. Uwaga: `main.ts:42648` wywołuje `launchIncomingMapFieldBattle` dla fazy AI bez `onBarbarianCityBattleResolved` — nie jest to druga ścieżka przegranej.

6. PRZYJMUJĘ. Pin `main.ts:28608–28612`: `captureViaSiegeSurrender` ustawia `oblegajacyOwnerId` i woła `resolveSiegeSurrender(cityId)` (28612). Dodano do W14 (haki testowe), status POZA PRODUKCJĄ.

7. PRZYJMUJĘ. Dodano sekcję 3a z czterema komponentami Rust (plik:linia zweryfikowane): `siege_enter_city::enter_city_after_surrender` (`siege_enter_city.rs:132`), `eliminacja::eliminate_owner` (`eliminacja.rs:48`), `siege_transfer_effects::apply_post_capture_law_on_capture` (`:163`), `siege_transfer_effects::rebel_protection_war_request` (`:211`). Dla każdego zmierzono wołających poza testami (grep po `rust-port/`): `apply_post_capture_law_on_capture` i `rebel_protection_war_request` są wołane wyłącznie z `siege_transfer.rs` (linie 374 i 381, wewnątrz `apply_transfer_with_effects`, PORT-NIEPODPIĘTY); `enter_city_after_surrender` — wyłącznie opis w `siege_surrender.rs` i komentarz w `siege_transfer.rs:171`; `eliminate_owner` — 0 wołających poza definicją. Rozbieżność z #114 (zakończone jako „produkcyjna ścieżka eliminacji”) zapisano jako NIE_ZMIERZONO w sekcji 5.

8. PRZYJMUJĘ (niska waga). Zakres grepu rozszerzono o `src-tauri/` i `gra-robocza/` (grep po tych drzewach, te same symbole, bez `tests/`: zero trafień wołających poza definicjami). Legenda i sekcja Metoda opisują teraz zakres statusów: cały repo, zmierzono. NIE_ZMIERZONO zostało tylko dla semantyki i wpływu #106/#120, nie dla wołających.

Zarzuty niepoparte dowodem: brak. Żaden zarzut nie został odrzucony.

## Potwierdzone w poprawce

- Numery linii pina dla W1/P6: warunek 34668–34677, wywołanie 34679, bramka barbarzyńcy 34664–34666 (zgodne z grep `barbCaptureBlockedByRemainingDefenders`: 34664, 34675; `applyCityCaptureToMap` w 34679).
- P1 → P9: `applyCityCaptureAfterBattle` import 963, wołanie 36061; snapshot 36055; `triggerRebelProtectionWarConsequence` 36090; `maybeResolveRegularWarOnCityCapture` 36092.
- Call site barbarzyńców 43398/43406; hak 28612, 28685.
- Sprawdzone bez zmian: P2–P5, P7–P8, W2–W10, W12, W14 (poza uzupełnieniem), tabela statusów PORT-NIEPODPIĘTY dla `apply_transfer_with_effects`, `run_capital_capture_plunder`, `check_defeat`.
