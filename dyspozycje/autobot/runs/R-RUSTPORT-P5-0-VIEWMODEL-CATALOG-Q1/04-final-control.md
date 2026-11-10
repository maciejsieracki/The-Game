STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1
GOAL: Katalog modelu widoku dla 49 modułów `gra/src/ui/**` importujących logikę/dane gry; per moduł: co UI czyta/liczy lokalnie + docelowe DTO z Rust (nazwa, pola, typy, konsument, reguły do przeniesienia wg P5.13). UI-Q1=A, UI-Q2=A, UI-Q3=B, D-UI-9.
ZMIANY/COMMIT: ten plik, commit na `95503f49` (Obrona/Operator r2) <- `0e7b66d9` (Evaluator r1) <- `85cbd531` (Operator r1) <- baza `88df6493`. Jawny `git add`, bez push.
TESTY (samodzielnie, Final Control):
- Allowlista: `git diff --name-status 88df6493 95503f49` -> 13 plików, wszystkie w `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` lub `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/**`. Zero `gra/**`, `rust-port/**`, `src-tauri/**`.
- `git diff --check 88df6493 95503f49` -> brak wyjścia.
- Integracja: `git merge-tree --write-tree origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 95503f49` -> `fcef14a9…`, bez konfliktów (88df6493 jest przodkiem `0d20beed`).
- Brama §9.1 r2 na `edb8fb56` (`git grep … -- gra/src/ui`): 220 trafień, w tym 12 `data/loader` — zgodne z dokumentem.
- Dowody plik:linia sprawdzone `git show edb8fb56:…`: `siegeMapPanel.ts:217-224,268-269,279,291,321`; `main.ts:2611-2613`; `render/cities.ts:309`; `cityPanel.ts:81,629,1042,1050,1285,1292,3085,3228-3229,3251-3253,8383(komentarz),8400,8408,10427(komentarz),10456`; `newGameFlow.ts:20,505`; `minimapHud.ts:25-50`; `armyStackHud.ts:26-60`; `unitCardStatus.ts:32-55,76-92`; `hexContextTooltip.ts:768-777`. Wszystkie zgodne.
- §6.0: policzone 33 typy w 17 sekcjach — zgodne. `symbols.tsv` 498 wierszy + nagłówek; `EXIT.log` z wywołaniami i EXIT.

ORZECZENIA (zarzuty Evaluatora r1):
1 ODDAL (naprawione: regex §9.1 z `data`, 220/12 zweryfikowane).
2 ODDAL (naprawione: `milicjaEst :221-222`, `playerCanStorm :223` w §0/§6.12/§8, zweryfikowane).
3 ODDAL (naprawione: wiersz „Stan buntu” §5, `CityRevoltDto`, `order.revolt` = `CityMapBadge.revolt`; dowody zgodne).
4 ODDAL (naprawione: `MinimapDto` 1:1 z `MinimapData`).
5 ODDAL (naprawione: `thumbnail` usunięty; `vitals` mają dowód `ArmyStackCard`/`ArmyStackHudState`; pola `UnitCardStatusInput`/`UnitSufferingStatusFields` dodane).
6 ODDAL (naprawione: `r2-pomiar/` ze skryptami, logami EXIT, `symbols.tsv`; różnica 496/498 wyjaśniona).
7 ODDAL (naprawione: §6.0, „20 rodzin” wycofane).
8 ODDAL (naprawione: `:8400,8408`, `:10456`).
9 ODDAL (naprawione: `growth.wzrost_ulamkowy`, `zywnoscNetto` = alias `food.bilans_lokalny` `:1285`).
10 ODDAL (naprawione: SHA `85cbd531` w `01-operator-r1.md:6`).
Agregat: 0 NAPRAW, 0 DO DECYZJI CZŁOWIEKA -> PASS.

UWAGA NIEBLOKUJĄCA (do P5.1, bez rundy): §6.16 odsyła do `UnitCardDto.veteran.tooltip`, a w §6.8 pole nazywa się `status.veteran_stars_tooltip` — nazwa do ujednolicenia przy implementacji.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (cherry-pick/merge łańcucha `85cbd531` -> `0e7b66d9` -> `95503f49` -> commit FC na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`), potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
