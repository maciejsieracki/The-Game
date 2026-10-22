STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1
GOAL: Katalog modelu widoku dla 49 modułów `gra/src/ui/**` importujących logikę/dane gry: co UI czyta/liczy lokalnie + docelowe DTO z Rust (nazwa, pola, typy, konsument, reguły do przeniesienia wg P5.13), przy UI-Q1=A, UI-Q2=A, UI-Q3=B, D-UI-9.
ZMIANY/COMMIT: baza r2 = `0e7b66d9` (Evaluator r1) na `85cbd531` (Operator r1) na `88df6493`. SHA commita r2 — w komunikacie zwrotnym Operatora (commit nie może zawierać własnego SHA). Bez push. Pliki (allowlista, jawny `git add`):
- `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (zmieniony; rejestr zmian §12)
- `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/01-operator-r1.md` (dopisany SHA r1 `85cbd531`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/03-operator-r2.md` (ten raport)
- `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/r2-pomiar/` (NOWE: `imp.py`, `use.py`, `cls.py`, `tsv.py`, `imp.log`, `cls.log`, `symbols.tsv`, `gate91-new.log`, `EXIT.log`)
Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Pliki `*.log` są w `.gitignore:20`, więc 4 logi dodane jawnie `git add -f <ścieżka>` (bez `-A`).
TESTY: temat dokumentacyjny, bez buildu. Pomiar odtworzony na `edb8fb56` (archiwum do scratch, EXIT 0; skrypty `python3 -I`, każdy EXIT 0 — `r2-pomiar/EXIT.log`): 49 plików / 212 linii (game 142, gra-data 28, src/data 13, map 13, render 8, units 6, battle 2); 498 symboli R182 M11 IO6 F56 K46 S43 X26 T128 (r1: 496 — błąd parsera, poprawiony). Brama §9 pkt 1 (r2) na pinie: 220 trafień = 212 + 6 inline + 2 `three`; regex r1: 179.

ODPOWIEDZI NA ZARZUTY (szczegóły: dokument §12):
1. PRZYJMUJĘ — `data` w regexie §9.1; kalibracja 220 (`gate91-new.log`); `loadGameData` w czasie gry: `cityPanel.ts:81/629`, `newGameFlow.ts:20/505`.
2. PRZYJMUJĘ — `milicjaEst` `:221-222`, `playerCanStorm` `:223` (użycia `:268-269,279,291,321`) w §0, §3.1, `SiegePanelDto`, §8.
3. PRZYJMUJĘ — §5 wiersz „Stan buntu” (`render/cities.ts:309`, `main.ts:2611-2613`, `cityPanel.ts:3228-3229,3251-3253`), `CityRevoltDto` w `CityPanelDto.order.revolt`, `CityMapBadge.revolt` z tego samego pola.
4. PRZYJMUJĘ — `MinimapDto` 1:1 z `MinimapData` (`minimapHud.ts:25-50`).
5. PRZYJMUJĘ — `thumbnail` usunięty; HP/ruch zostają z dowodem (`armyStackHud.ts:26-48,278-319`, `hexContextTooltip.ts:768-777`); dodane pola `UnitCardStatusInput` (`unitCardStatus.ts:76-92`) i `UnitSufferingStatusFields` (`:32-55`).
6. PRZYJMUJĘ — skrypty, logi z EXIT i `symbols.tsv` (498 wierszy, klasa per symbol) w `r2-pomiar/`. Odtworzenie wykazało, że Evaluator miał rację co do 498: parser r1 zgubił re-eksport `validateTradeBasketSides` (`diplomacyTradeBasket.ts:2833`) i martwy import `powerParams` (`power-labels.ts:14`).
7. PRZYJMUJĘ — §6.0: 17 sekcji, 33 typy; „20 rodzin” wycofane.
8. PRZYJMUJĘ — `promoteToFront` → `:8400,8408`; `civWideSixStatsFromEmpireSnap` → `:10456`.
9. PRZYJMUJĘ — `growth.wzrost_ulamkowy`; `zywnoscNetto` = alias `food.bilans_lokalny` (`:1285`); tabela pokrycia 20/20 pól `CityView`.
10. PRZYJMUJĘ — SHA `85cbd531` dopisany do `01-operator-r1.md`.

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 → Final Control → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
