STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1
GOAL: Zapis i odczyt puli Pracy każdego fotela hot-seat (`meta.pracaPoolByHuman`); stare zapisy bez pola wczytują się bez błędu.

ZMIANY/COMMIT: Weryfikowany stan: `2e76fe00fd0598bfee11bdff0fe82d7be41162ff` (baza `0f9f60a10`; funkcjonalny `1545269a0`). Diff do allowlisty: tylko `gra/src/main.ts`, `gra/tools/saveload-praca-pool-hotseat-live-test.cjs`, `dyspozycje/autobot/runs/R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1/**`. Zero zmian w gra-robocza, WERSJE.md, rust-port, auto-improvements.ts, save.ts. Ten raport: osobny commit FC na gałęzi `fc-hotseat-r1`.

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Brak `pomiar-red.json` -> ODDAL. Obrona usunęła deklarację z raportu 01; dowód czerwonego to `gate-hotseat-red.txt`. Wada dokumentacyjna naprawiona.
2. Bramki PRZED niezmierzone -> ODDAL (uwaga). Wartości po zmianie zgodne z dispatchem, odtworzone przeze mnie.
3. Rozszerzony hak `__pracaPoolSaveLoadTestDebug` -> ODDAL (uwaga). Hak jest w bloku testowym `window`, wołany tylko z Playwrighta (main.ts ~26575-26594). Obrona poprawnie opisała: `roundTripMeta` zmienia stan, `writeLegacySlot` pisze do IndexedDB. Nie zmienia logiki gry. Akceptacja haka to decyzja orkiestratora.
Brak NAPRAW => PASS.

TESTY (własny `npm ci`, odtworzone na 2e76fe00f):
- saveload-praca-pool-hotseat-live-test: 22 pass / 0 fail (EXIT 0)
- tsc --noEmit: EXIT 0
- saveload-praca-pool-live-test: 13/0
- diplomacy-test: 148/0
- defeat-last-city-test: 14/0
- war-era-counter-test: 82/0
- Mutację (17/5) i pozostałe bramki (ring 15, autoimprove-stages, auto-improvements, ai-improvements, fort-outpost 80) odtworzył Evaluator; nie powtarzałem.
- Przegląd diffu main.ts: zapis (~33493), odczyt (~42732-42749); `humanSeats` odtwarzany wcześniej (42141); fotel 0 pomijany (alias komórki), wpisy śmieciowe ignorowane, sanitizer ten sam. Brak osłabionych asercji.
- `git diff --check` nie uruchomiony (ograniczenie narzędzia); NIE_ZMIERZONO.

BLOKADY: brak.
DO DECYZJI ORKIESTRATORA/WŁAŚCICIELA: Q-1 (cache HUD `_last*` dla foteli 2+: A zerować przy wczytaniu / B zapisywać / C zostawić; rekomendacja A lub C; skutek NIE_ZMIERZONY) oraz akceptacja rozszerzonego haka testowego.
RUNDY: 1/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora. SHA do integracji: `2e76fe00fd0598bfee11bdff0fe82d7be41162ff` (kod identyczny z 1a30065df; plus commit FC z tym raportem). Kolejność względem `origin/rust-port/parity-v2`: niezależna (temat WEB, `gra/`; parity-v2 dotyczy rust-port); najpierw wejście do `main`, parity-v2 bez zależności. Brak konfliktów plikowych (allowlista rozłączna z rust-port).
DEPLOY/PUSH: NIE WYKONANO
