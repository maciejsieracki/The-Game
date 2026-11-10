STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1
GOAL: Audyt UI w webview Tauri przy rendererze 3D w Rust: stan `src-tauri/**`, podział `gra/src/ui/**`, granica UI<->renderer, opcje szkieletu UI, lista `D-UI-n`.
ZMIANY/COMMIT: runda 2 na bazie commita Operatora r1 `3e66b772`. Pliki: `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md`, ten raport. Jawne `git add`.
TESTY: tylko `git show`/`git grep` na `edb8fb56` i `origin/rust-port/parity-v2` (`src-tauri/Cargo.lock`); zero npm/cargo/buildu; `git diff --cached --check` czysty.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium), ten sam ID.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora r1

1. PRZYJMUJĘ. Dodano R12: tooltip weterana, picking `main.ts:26235` (`render/units.ts:5900`), tooltip `main.ts:1853-1873`, `:26240`. Poprawiono zdanie w „Nie-zależne”: dotyczy ono tylko tooltipu heksu.
2. PRZYJMUJĘ. Dodano R13: pigułka miasta, `main.ts:26253` (`render/cities.ts:609`), `syncStatChips` `:26256,26260`. Kontrakt pickingu w §3.3, D-UI-6 i P4-5B obejmuje teraz heks, encję, odznakę, pigułkę i prostokąt.
3. PRZYJMUJĘ. Dodano R14: `cityGrowthLive` `cityPanel.ts:1497-1528`, `main.ts:655,2647`, `render/cities.ts:369,392,821`. Poprawiono zdanie o plakietkach. Dodano nową decyzję D-UI-9 (jedno pole DTO).
4. PRZYJMUJĘ. Pełny spis z pomiaru (grep `.project(`/`worldToClientPx(`/`worldToScreen(` poza `render/`, oraz 0 trafień w `render/`) daje 5 grup DOM. Doszły R15a `battleScene.ts:8635,19419-19430` i R15b `manualBattle.ts:1207,221-232`. Box-select R16 `battleScene.ts:16505` zaliczono do pickingu. Przeliczono K1/K2/K3. Rekomendacja K3 zostaje, ale kryterium podziału to teraz częstość ruchu. Zapisano jawnie, że K3 odchodzi od dzisiejszego podziału weba dla R5 i R15.
5. PRZYJMUJĘ. §3.3 opisuje `isPointOverCityPanelUi` (`cityUxFrame.ts:185`; `main.ts:26212,26362,26717`) oraz `blockPointerAt`/`blockWheelAt` (`camera.ts:40,48,112-115,166,216,255`; `main.ts:1911-1924`). Reguły są zmierzone. NIE_ZMIERZONO zostaje tylko dla transportu hit-testu w W2.
6. PRZYJMUJĘ. W §1.2 i §3.1 dodano zastrzeżenie: `raw-window-handle 0.6.2` jest zależnością przechodnią (`Cargo.lock:2425-2426`, przez tauri, tauri-runtime, tauri-runtime-wry, tao, wry, softbuffer, window-vibrancy i ndk). `wgpu`/`winit` nie ma także w lockfile (0 trafień).
7. PRZYJMUJĘ. Poprawiono cytat w §2.4: `previewCityEconomy` celowo NIE jest liczony na ścieżce `mousemove` (`cityPanel.ts:1538-1546`). Wniosek dotyczący `computeView`/`cityGrowthLive` się nie zmienia.
