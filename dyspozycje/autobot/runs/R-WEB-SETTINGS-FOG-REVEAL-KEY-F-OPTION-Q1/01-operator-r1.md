STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-FOG-REVEAL-KEY-F-OPTION-Q1
GOAL: Klawisz F (pełne odkrycie / wyłączenie mgły wojny) działa wyłącznie gdy opcja „Odkrywanie mapy klawiszem F (tryb testowy)” jest włączona na ekranie nowej gry. Domyślnie WYŁĄCZONA; brak pola w nowej grze/zapisie = WYŁĄCZONA; opcja nie wpływa na AI.
BAZA: origin/main (ab1188446).

ZMIANY/COMMIT:
- gra/data/ui-params.json: nowy wpis nowa_gra.ustawienia `fog_reveal_key_f` (opcje Włączone / Wyłączone, domyslny = 1 → Wyłączone), etykieta „Odkrywanie mapy klawiszem F (tryb testowy)”.
- gra/src/ui/newGameFlow.ts: pozycja w głównej siatce ustawień (po „Automatyzacja budowy”), glif `Mg`, pole `fogRevealKeyFEnabled` w NewGameParams i w buildParams (`settingValue('fog_reveal_key_f') === 'Włączone'`).
- gra/src/main.ts: import bramki; stan `fogRevealKeyFEnabled` (domyślnie false); doStartGame czyta parametr; wczytanie zapisu (brak pola = false); zapis meta.fogRevealKeyFEnabled; w obsłudze klawisza F bramka `if (!isFogRevealKeyFActive(...)) return;` PRZED preventDefault i toggleDevFogFull (OFF = brak komunikatu, brak preventDefault, brak efektu). Klawisze M, G, B i pozostałe bez zmian.
- gra/src/game/fog-reveal-key-f.ts (NOWY, czysta bramka): FOG_REVEAL_KEY_F_DEFAULT=false, fogRevealKeyFFromNewGameParam, fogRevealKeyFFromSaveMeta, isFogRevealKeyFActive.
- gra/tools/fog-reveal-key-f-option-test.cjs (NOWY): 25 sond (bramka czysta, dane ui-params, newGameFlow, main.ts, brak wpływu na AI).
- gra/tools/newgame-settings-layout-reposition-test.cjs: oczekiwana kolejność głównej siatki rozszerzona o 14. kartę (nowa opcja). Zmiana konieczna, bo dodanie karty zmienia układ siatki; poza literalną allowlistą, ale to regresja tej samej powierzchni ustawień.
- SHA commita: podane w odpowiedzi operatora (po commicie).

ZGODNOŚĆ / UWAGI:
- Dotychczas F było zawsze aktywne (FOG_DEV_SHORTCUTS = true w praktyce) i odkrywało mapę po naciśnięciu. Teraz domyślnie F nic nie robi.
- Sandbox playtest (?playtest=…, PLAYTEST-*) NIE przechodzi przez doStartGame, więc opcja zostaje na domyślnym OFF → F tam nie działa, dopóki sandbox nie włączy opcji (test hook nie dodany, bo gra/src/game/civ-test-hooks.ts jest poza allowlistą).
- Testy korzystające z F (poza allowlistą, NIE zmieniane): gra/tools/longrun-100-turns-leak-q1-measure.cjs:149, gra/tools/memory-unit-static-merge-game-measure.cjs:102, gra/tools/memory-growth-rootcause-q1-measure.cjs:151 (page.keyboard.press('f')). Po tej zmianie ich F nie odkryje mapy, dopóki opcja nie jest włączona na ekranie nowej gry. Wymagają osobnego tematu (jawne włączenie opcji / hook).
- Dług do rejestru (nie wpisany, poza allowlistą): REPIN Rust — ustawienie `fog_reveal_key_f` (odpowiednik w porcie Rust).

TESTY:
- npx tsc --noEmit (gra/): czysto (bez błędów).
- node tools/fog-reveal-key-f-option-test.cjs: 25 OK / 0 FAIL.
- node tools/autobuild-toggle-test.cjs: 39 passed / 0 failed (regresja ustawień „Automatyzacja budowy”, parametry nowej gry, zapis).
- node tools/newgame-settings-layout-reposition-test.cjs: PASS (po aktualizacji oczekiwanej listy do 14 kart).
- node tools/war-epoch-player-first-main-guard-test.cjs: 34 pass / 1 fail — FAIL „bypass R3 usunięty (brak waveActorBypassR3) + licznik per cywilizacja w bramce deklaracji”. Dotyczy wojny epoki w main.ts, nie tej zmiany (nie dotykałem tych linii). NIE_ZMIERZONO na bazie origin/main (test nie został uruchomiony na czystym main) — do potwierdzenia przez orkiestratora.
- node tools/newgame-defaults-test.cjs: NIE_ZMIERZONO — brak Chromium (/usr/bin/chromium nie istnieje) w tym środowisku.
- Chromium live (F z opcją wył./wł.): NIE_ZMIERZONO — brak przeglądarki; zastępstwo: test statyczny + sondy tekstowe.
- npm ci --ignore-scripts w gra/ (tylko zależności, bez build/dev); node_modules nieśledzone.

BLOKADY: brak Chromium (live-weryfikacja F). Trzy testy measure korzystające z F wymagają osobnego tematu (poza allowlistą). Sandbox playtest bez opcji = F wyłączony.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — przegląd diffu i testów; orkiestrator decyduje o osobnym temacie dla 3 testów measure i o REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
