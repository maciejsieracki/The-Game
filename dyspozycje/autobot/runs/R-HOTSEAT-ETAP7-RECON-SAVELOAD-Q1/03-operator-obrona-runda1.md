# R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1 — Operator, Obrona rundy 1

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1
GOAL: Recon-only Etapu 7 (save/load v3) — OSTATNI etap planu hot-seat, zgodny z ABC-4
(bez migracji, czytelny komunikat niekompatybilności).

ZMIANY/COMMIT: Poprawiony `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1/01-operator-runda1.md`
(§4, §5, §7b) w tym samym worktree. Zero zmian w `gra/`.

TESTY: Recon-only, bez wykonania — poprawiony plan dowodu (§7 dokumentu) pozostaje
wykonywalny dopiero w implementacji.

BLOKADY: Brak ABC do rozstrzygnięcia.

RUNDY: 1/5

OBRONA:

1 -> PRZYJMUJE. Zarzut trafny, dowód potwierdzony świeżym `Read`/`grep` w tym worktree:
main.ts:35544-35561 (komentarz N-ZINDEX-TOAST) i realny kod wywołań main.ts:35573-35576
pokazują jednoznacznie `if (!fromInGamePause) openStartupMainMenu(); showHintMessage(...)`
— czyli `openStartupMainMenu()` PRZED `showHintMessage()`. `showHintMessage()`
(main.ts:13329, linia z-index: `hintToast.style.zIndex = isPreBattleOpen() ? '9950' :
((isMainMenuOpen() || isEmpireDetailPanelOpen()) ? '600' : '320')`) czyta
`isMainMenuOpen()` synchronicznie w chwili wywołania. Poprzednia wersja §5 dokumentu miała
kolejność ODWRÓCONĄ (`showHintMessage(...)` przed `openStartupMainMenu()`) — dla
scenariusza startowego `fromInGamePause===false` (dokładnie ten z §7b: stary zapis v2 z
ekranu startowego) dałoby to z-index 320, a `.civ-menu` (z-index 500, montowane przez
`openStartupMainMenu()` zaraz potem) zamalowałoby toast na całe 6000ms — naruszenie ABC-4.
Poprawka: zamieniona kolejność w kodzie-projekcie §5 na
`if (!fromInGamePause) openStartupMainMenu(); showHintMessage(e.message, 6000); return;`
z dopisanym uzasadnieniem odsyłającym do main.ts:35544-35561/35573-35576. Dodatkowo
poprawiony opis testu strukturalnego w §7b, który wcześniej (błędnie, symetrycznie z tym
samym błędem) opisywał asercję sprawdzającą `showHintMessage` PRZED `openStartupMainMenu()`
— teraz opisuje asercję w poprawnej kolejności (test failuje przy kolejności odwróconej).

2 -> PRZYJMUJE. Zarzut trafny, dowód potwierdzony świeżym `Read`: `game/playerState.ts:114-128`
definiuje `buildingCostPace: BuildingCostPace`, `kosztJednostekPace: KosztJednostekPace`,
`wzrostLudnosciPace: WzrostLudnosciPace`, `ruchSwiataPace: RuchSwiataPace` — wszystkie
string-union przez `keyof typeof <OBIEKT_PACE>`: `building-cost-tempo.ts:25`
(`BuildingCostPace = keyof typeof KOSZT_BUDYNKOW_PACE`, klucze `niski|normalny|wysoki`),
`unit-cost-tempo.ts:25` (analogicznie), `population-growth-tempo.ts:27`
(`WzrostLudnosciPace`, klucze `wysoki|normalny|wolny`), `ruch-swiata-tempo.ts:29`
(`RuchSwiataPace`, klucze `krotki|normalny|dlugi`). Potwierdzone też fallbackami string w
istniejącym kodzie restore: `main.ts:35776-35786` (`?? 'niski'`, `?? 'wysoki'`,
`?? 'krotki'`) — fallback numeryczny byłby tam typowym błędem kompilacji/runtime.
Poprawka w §4 dokumentu: `GraczSaveV3` teraz importuje i używa realnych typów
(`BuildingCostPace`, `KosztJednostekPace`, `WzrostLudnosciPace`, `RuchSwiataPace`) zamiast
`number`; przykładowy JSON w §4 poprawiony z wartości liczbowych (`1`) na realne klucze
stringowe (`"niski"`, `"wysoki"`, `"normalny"`, `"krotki"`, `"dlugi"`) zgodne z obiektami
PACE.

Spójność końca dokumentu sprawdzona po poprawkach: §7(a)/§7(b) i §8 (Wynik) nie odwołują
się do usuniętych/błędnych fragmentów (§7b poprawiony razem z §5, §8 nie wymagał zmian —
nie cytuje ani kolejności wywołań, ani typów pól `*Pace`).

NASTĘPNY KROK: Evaluator, runda 2 — weryfikacja poprawionej kolejności wywołań w §5/§7b
i poprawionych typów w §4.
DEPLOY/PUSH: NIE WYKONANO
