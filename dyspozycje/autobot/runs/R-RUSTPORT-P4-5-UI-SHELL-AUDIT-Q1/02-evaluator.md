STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1
GOAL: Audyt UI w webview Tauri przy rendererze 3D w Rust (stan `src-tauri/**`, podział `gra/src/ui/**`, granica UI<->renderer, opcje szkieletu, `D-UI-n`).
ZMIANY/COMMIT: ocena commitu Operatora `3e66b772` (baza `dc4cfdb4`); Evaluator dodaje tylko ten plik. Commit Operatora zmienia 2 pliki z allowlisty, `git diff --check dc4cfdb4 3e66b772` jest czysty.
TESTY: tylko odczyt (`git show`/`git grep`/`git ls-tree`), bez npm, cargo i buildu.
RUNDY: 1/5
NASTĘPNY KROK: Operator, runda 2, ten sam ID: poprawić zarzuty 1-5.
DEPLOY/PUSH: NIE WYKONANO

## Sprawdzone i potwierdzone (pin `origin/rust-port/parity-v2` = `f7aa0997`, web `edb8fb56`)

Sprawdziłem 16 twierdzeń, każde się zgadza:
1. `tauri.conf.json:6-25`: `frontendDist`, `withGlobalTauri`, okno `main` 1280x800, `msi`/`nsis`.
2. `Cargo.toml:13,16,18`: wersje tauri i tauri-build, `civ-engine` przez path.
3. `capabilities/default.json:5-6`.
4. `lib.rs:8-9,17,28-48,53`: jedna komenda `engine_command`.
5. `bridge.rs:17,20-40,80-84,109-112`: 6 wariantów i jedno zdarzenie.
6. `main.js` ma 810 linii. Komendy są w `:551,647,655-660,790`, nasłuch w `:754-764`, `close()` w `:256-262`, sonda w `:804-810`.
7. Siatka DOM: `index.html:150,151,244` oraz `main.js:665-693`. Siatka jest prostokątna i nie ma przesunięcia wierszy. W `src-tauri/frontend` nie ma canvas ani WebGL.
8. Cytat `P1-17B:12` i miejsce pomyłki w `P4-0:174` (grep po `rust-port/`).
9. `ui/**` to 438 plików, z tego 117 `.ts` z 58 177 LOC.
10. Linii z importami jest 573. Logikę lub dane importuje 49 plików. Importy z `render/**` to 8 linii w 7 plikach, z 5 modułów.
11. `unitMiniPreview.ts:4-5,29-32,103-107`.
12. `hud.ts:389,447,458-461,501-511` (zoom przez `transform` na `body`).
13. `main.ts:12041-12042,12939-12949,14588-14600`, `picker.ts:101-117`.
14. `minimapHud.ts:44-51,111-113`.
15. `hexContextTooltip.ts:2`.
16. `import.meta.glob` występuje w 4 plikach. `wonderpreview` w `ui/` i `main.ts` daje 0 trafień.

Twierdzenie o siatce DOM jest uczciwie zamknięte dowodem. `D-UI-1..8` są zapisane jawnie. Opcje Tauri są oznaczone NIE_ZMIERZONO i żadnej możliwości nie zmyślono.

## Zarzuty

1. **Tabela R1-R11 pomija tooltip DOM pokazywany po najechaniu na element renderera.** Dispatch pkt 2 wprost wymienia „tooltipy po najechaniu”.
   - `main.ts:26235` wybiera spod kursora gwiazdki weterana: `unitRenderer.pickVeteranBadgeUnitIdAt(e.clientX, e.clientY, canvas, camera)`.
   - `main.ts:26240` pokazuje wtedy `showVeteranBadgeTip`. To element `position:fixed` przyklejony do kursora (`main.ts:1855-1873`).
   - Dokument (§2.3, „Nie-zależne”) twierdzi, że tooltip mapy nie jest kotwiczony. Odznakom weteranów przypisuje wyłącznie renderer. Tooltip zależny od pickingu sprite'a w ogóle nie jest opisany.
2. **Hover i picking pod-elementów renderera to nie tylko „piksel→hex”.**
   - `main.ts:26253` wywołuje `cityRenderer.pickStatChipCityIdAt` (hover na pigułce miasta), a potem `syncStatChips` w `:26256,26260`.
   - Wejście W1/W2 (§3.3) i D-UI-6 zakładają picking heksu (`pickHexAt`). Rust musi jednak zwracać też trafienia w sprite'y odznak i chipów.
   - Brakuje tego w kontrakcie wejścia i w kandydacie P4-5B.
3. **Brakuje zależności „renderer czyta dane liczone przez UI”.**
   - Plakietka miasta na mapie bierze WZROST% z `ui/cityPanel.ts` `cityGrowthLive`. Dowody: `cityPanel.ts:1497-1528`, podpięcie w `main.ts:2647`, kontrakt w `render/cities.ts:392,821`.
   - Dokument (§2.3) twierdzi, że plakietki „idą do P4.3/P4.4, nie do UI”.
   - W wersji Rust ta wartość musi pochodzić z DTO z Rust i równać się wartości w panelu miasta (P-WZROSTPROCENT-PLAKIETKA-ROZJAZD). To element granicy UI<->renderer. Trzeba go dopisać do tabeli i do P5-0/P4-5B.
4. **Fałszywe zdanie „tylko 3 grupy DOM są projektowane” (§3.2).**
   - Dokument opiera się na metodzie `git grep "\.project("` po `gra/src` (§8), a pomija trafienia w bitwie.
   - Pływające etykiety HTML w bitwie są projektowane kamerą w każdej klatce: `battle/battleScene.ts:8635` (`_tickFloatLabels`, `worldToScreen` `:19419-19430`) oraz `battle/manualBattle.ts:1207` (`:221-232`).
   - Box-select w bitwie (`battleScene.ts:16505`, `worldToClientPx`) to picking ekran→świat.
   - D-REND-8 = B obejmuje bitwę 3D w Rust, więc te elementy należą do granicy UI<->renderer. Ich brak zaburza rachunek K1/K2/K3 i uzasadnienie rekomendacji K3.
5. **Pominięty istniejący mechanizm rozstrzygania „panel czy mapa”.**
   - Web ma predykaty `isPointOverCityPanelUi` (`main.ts:26212,26362,26717`) i `blockPointerAt`/`blockWheelAt` kamery (`render/camera.ts:40-46,112-115,166`, podpięcie `main.ts:1911-1917`).
   - §3.3 (W2) nazywa to „hit-test DOM po stronie natywnej, NIE_ZMIERZONO”. Nie odnotowuje, że ta logika już istnieje i trzeba ją przenieść w W1 i w W2.
6. (drobny) **„brak raw-window-handle” bez zastrzeżenia.**
   - §1.2 i raport Operatora mówią prawdę, ale tylko dla `*.toml`.
   - `src-tauri/Cargo.lock` zawiera `raw-window-handle 0.6.2` jako zależność przechodnią `tauri`, `tauri-runtime`, `tauri-runtime-wry`, `tao` i `wry` (`Cargo.lock:2425` oraz wpisy zależności).
   - §3.1 („żadnej zależności graficznej”) powinien to doprecyzować, bo to istotny fakt dla osadzenia wgpu w P4.3. Wniosku nie wyciągać, tylko odnotować.
7. (drobny) §2.4 parafrazuje `cityPanel.ts:1538-1546` jako „wołanie `getCityGrowth`/`previewCityEconomy` z gorącej ścieżki”. Komentarz mówi coś odwrotnego co do `previewCityEconomy`: ten wariant jest celowo NIE liczony na ścieżce `mousemove`. Lokalne liczenie reguł potwierdzają `computeView` i `cityGrowthLive`. Trzeba poprawić cytat.

Kryterium binarne: odpowiedź na pkt 2 i 3 jest niekompletna (zarzuty 1-5), a §3.2 zawiera fałszywe twierdzenie (zarzut 4). Wynik: FAIL.
