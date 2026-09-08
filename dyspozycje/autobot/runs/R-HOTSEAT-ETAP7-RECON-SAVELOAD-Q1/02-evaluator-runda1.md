# R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1 — Evaluator, runda 1

Niezależna weryfikacja: świeży `Read`/grep `gra/src/main.ts`, `gra/src/game/save.ts`,
`gra/src/game/playerState.ts`, `gra/src/ui/mainMenu.ts`, `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`
(ABC-4), `gra/tools/load-fail-toast-zindex-test.cjs`, recon Etapu 6f.

## Co się potwierdziło (dowód, nie deklaracja)

Wszystkie numery linii kluczowe dla map buildSaveGameSnapshot/restore potwierdzone
identyczne ze świeżym `grep`: `28256` (def), `28290` (`wersja: 2`), `28295` (`explored`),
`28298` (`gracz: {`), `28389`/`28392` (aiSkarbiecByOwner/aiNaukaPoolByOwner save),
`35646` (def restore), `35766` (explored restore), `35768` (`if (saved.gracz)`),
`36282-36289`/`35896-35899` (restore aiSkarbiecByOwner/aiNaukaPoolByOwner, z komentarzem
"Audyt #44" potwierdzającym wprost, że bug byl JUŻ naprawiony), `26481` (akcesor
`ownerTreasury`), `34237`/`34251` (`newGameParamsForLoad`), `save.ts:606`/`584`/`356`,
`save.ts:792-796` (`loadFromLocal` catch→null), `main.ts:35488-35497` (branże `!saved`/
`fatal.length>0`). Cytat ABC-4 (linie 12-19 planu) zgodny słowo w słowo ze źródłem.
Zero wystąpień `humanSeats`/`exploredByHuman`/`playerStateByHuman` w
`buildSaveGameSnapshot` potwierdzone. Odesłanie do recon 6f (`humanCivIds`,
`playerStartHexByHuman`) zgodne z `R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md`.
Bug Audytu #44 słusznie uznany za już naprawiony — dowód kodowy kompletny (save+restore
dla obu pól, symetrycznie). Projekt v3 jest zgodny z ABC-4 (brak migracji, twardy próg
`ver < 3`, nie generyczne `ver < SAVE_VERSION`) — poprawnie odróżnia to zamierzone
jednorazowe cięcie od istniejącego luźnego mechanizmu pól opcjonalnych (`save.ts:356`).
Testy istniejące (`planned-march-test.cjs`, `postep-pamiec-usuniecie-test.cjs`) faktycznie
importują `game/save`, więc plan testu (b) jest wykonalny bez stubowania `main.ts`.

## ZARZUTY

**1. main.ts §5/§7(b) — projekt kolejności `showHintMessage()`/`openStartupMainMenu()`
jest odwrócony względem WŁASNEGO przywołanego wzorca N-ZINDEX-TOAST i realnie
odtworzy niewidoczny toast dla najbardziej prawdopodobnego scenariusza użycia.**

Dokument projektuje (§5 pkt 2, powtórzone w §7b): `showHintMessage(e.message, 6000);
if (!fromInGamePause) openStartupMainMenu();` — i twierdzi w §7b, że to "ta sama
kolejność co istniejący bug N-ZINDEX-TOAST — nowa gałąź musi go NIE powtórzyć".

Świeży `Read` `main.ts:35544-35561` (komentarz N-ZINDEX-TOAST, gałąź `if (!ok)`,
naprawa 2026-08-11) pokazuje kolejność DOKŁADNIE ODWROTNĄ do zaprojektowanej:
`openStartupMainMenu() MUSI wywołać się PRZED showHintMessage()` — bo
`showHintMessage()` (`main.ts:13329`: `hintToast.style.zIndex = ... isMainMenuOpen() ...
? '600' : '320'`) czyta `isMainMenuOpen()` SYNCHRONICZNIE w chwili wywołania, a
`isMainMenuOpen()` (`ui/mainMenu.ts:512`: `rootEl.style.display !== 'none'`) zwraca
`true` dopiero PO zamontowaniu `.civ-menu` przez `showMainMenu()` (wołane wewnątrz
`openStartupMainMenu()`). Odwrotna kolejność (toast przed menu) renderuje toast na
z-index 320, a `.civ-menu` (z-index 500) zaraz potem go zamalowuje — to jest DOSŁOWNIE
opisany w `load-fail-toast-zindex-test.cjs` mechanizm bugu.

Dodatkowo: `openLoadGameDialog()` (`main.ts:20777`) woła `if (!fromInGamePause)
hideMainMenu();` PRZED otwarciem dialogu Wczytaj — więc dla `fromInGamePause===false`
(scenariusz startowy: użytkownik na ekranie startowym klika "Wczytaj" i wybiera stary
zapis v2 — dokładnie scenariusz manualnego testu z §7b) `isMainMenuOpen()` jest `false`
w chwili wejścia do `loadGameFromSlot`. Projekt z §5/§7b odtworzy więc niewidoczny toast
(z-index 320 pod nowo zamontowanym menu 500) właśnie w tym najbardziej prawdopodobnym
przypadku użycia — co wprost narusza wymóg ABC-4 "jasno komunikować użytkownikowi" (toast
techniczne istnieje w DOM, ale wizualnie niewidoczny przez cały czas trwania, 6000ms).

Uwaga: identyczna kolejność (toast przed `openStartupMainMenu()`) występuje też w
ISTNIEJĄCYCH gałęziach `!saved`/`fatal.length>0` (`main.ts:35488-35501`) — to może być
już istniejący, nienaprawiony wariant tego samego bugu, poza zakresem tego recon. Ale
dokument NIE MOŻE twierdzić, że kopiowanie tego wzorca "nie powtarza" N-ZINDEX-TOAST —
to zdanie jest błędne/odwrócone i wymaga korekty albo zmiany projektu na kolejność
`openStartupMainMenu()` → `showHintMessage()` (zgodną z faktyczną naprawą), z jawnym
sprawdzeniem czy to nie zepsuje ścieżki `fromInGamePause===true` (gdzie menu w ogóle się
nie montuje, więc kolejność nie ma znaczenia — tam bezpiecznie).

**2. §4, `GraczSaveV3` — cztery pola typowane `number` są w rzeczywistości typami
łańcuchowymi (string union), nie liczbami; kontrakt v3 się nie skompiluje/koduje zły typ.**

Interfejs projektuje: `buildingCostPace: number; kosztJednostekPace: number;
wzrostLudnosciPace: number; ruchSwiataPace: number;`. Świeży `Read`
`game/playerState.ts:114-128` pokazuje deklaracje pól `PlayerState` jako
`buildingCostPace: BuildingCostPace`, `kosztJednostekPace: KosztJednostekPace`,
`wzrostLudnosciPace: WzrostLudnosciPace`, `ruchSwiataPace: RuchSwiataPace` — wszystkie
cztery to `keyof typeof <OBIEKT_PACE>` (`building-cost-tempo.ts:25`,
`unit-cost-tempo.ts:25`, `population-growth-tempo.ts:27`, `ruch-swiata-tempo.ts:29`),
czyli literały string (`'niski'|'normalny'|'wysoki'` itd. — potwierdzone
`building-cost-tempo.ts:19-22`: `KOSZT_BUDYNKOW_PACE = { niski: 1.0, normalny: 2.0,
wysoki: 4.0 }`, klucz to string, wartość-mnożnik jest wewnętrzna, nie zapisywana).
Sam istniejący kod restore w `main.ts:35776-35786` potwierdza to jawnie fallbackami
string: `?? 'niski'`, `?? 'wysoki'`, `?? 'krotki'` — fallback typu `number` byłby tu
niepoprawny składniowo/semantycznie.

To nie literówka kosmetyczna: `number` i string-union to niekompatybilne typy w TS,
więc `GraczSaveV3` jako podany w dokumencie nie opisuje poprawnie realnego kształtu
danych — `tsc --noEmit` z planu dowodu (§7a pkt 3) na TYM interfejsie by to złapał, ale
sam dokument miał to złapać na etapie recon (wymóg dispatchu: "konkretny projekt kształtu
v3"). Naprawa: te 4 pola (i dla spójności `tempoGry`, dziś zbyt luźno typowane jako
`string` zamiast `TempoGry`, choć to nie błąd kompilacji, tylko utrata precyzji) powinny
być string-union (lub przynajmniej `string`), nie `number`.

## Wynik

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1
GOAL: Recon-only Etapu 7 (save/load v3) — OSTATNI etap planu hot-seat, zgodny z ABC-4
(bez migracji, czytelny komunikat niekompatybilności).
TESTY: Weryfikacja własnym Read/grep main.ts, game/save.ts, game/playerState.ts,
building-cost-tempo.ts/unit-cost-tempo.ts/population-growth-tempo.ts/ruch-swiata-tempo.ts,
ui/mainMenu.ts, ABC-4 w PLAN-HOT-SEAT-2-GRACZY.md, recon 6f, gra/tools/*-test.cjs. Brak
zmian kodu (recon-only, zgodnie z allowlistą).
BLOKADY: Brak ABC do rozstrzygnięcia w tej rundzie.
RUNDY: 1/5
ZARZUTY:
1. §5/§7b (main.ts) — projekt kolejności `showHintMessage()` przed
   `openStartupMainMenu()` jest dokładnie odwrotny do naprawy N-ZINDEX-TOAST
   (`main.ts:35544-35561`) i przy `fromInGamePause===false` (scenariusz startowy, główny
   przypadek testu manualnego z §7b) da niewidoczny toast (z-index 320 pod menu 500)
   przez cały czas trwania — narusza wymóg ABC-4 "jasno komunikować". Twierdzenie
   dokumentu, że ta kolejność "nie powtarza" bugu N-ZINDEX-TOAST, jest odwrócone/błędne.
2. §4 — `GraczSaveV3.buildingCostPace/kosztJednostekPace/wzrostLudnosciPace/
   ruchSwiataPace` typowane `number`, podczas gdy `game/playerState.ts` (i cztery moduły
   `*-tempo.ts`) definiują je jako string-union (`'niski'|'normalny'|'wysoki'` itd.,
   potwierdzone też fallbackami string w istniejącym kodzie restore `main.ts:35776-35786`)
   — kontrakt typu jest niepoprawny.
NASTĘPNY KROK: Obrona Operatora (R-PROC-AUTOBOT.md §3c) na TYM SAMYM ID/gałęzi — poprawić
kolejność wywołań w projekcie §5/§7b (albo jawnie uzasadnić inaczej z konkretnym dowodem,
że kolejność jest bezpieczna) oraz skorygować typy w `GraczSaveV3`; następnie kolejny
Evaluator.
DEPLOY/PUSH: NIE WYKONANO
