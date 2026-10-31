STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HOTSEAT-HUD-CACHE-Q1
GOAL: Przy wczytaniu zapisu zerowac cache HUD (`_last*`: Praca rate, utrzymanie, koszt auto-ulepszen, koszt cudow, kultura, kultura rate) dla WSZYSTKICH foteli hot-seat (decyzja wlasciciela A, 2026-10-31).
ZMIANY/COMMIT: SHA w sekcji "COMMIT" ponizej. Pliki: `gra/src/main.ts` (TYLKO `restoreGameFromSave`, +14 linii: petla po `humanSeats.humanOwnerIds` wolajaca 6x `setOwnerLast*(oid, 0)`, tuz po istniejacych zerowaniach fotela 0 `_lastPracaRate = 0` ... `_lastLudnoscRate = 0`, main.ts ok. l.42758-42785); nowe `gra/tools/saveload-hud-cache-hotseat-live-test.cjs` (Chromium), `gra/tools/saveload-hud-cache-hotseat-wiring-test.cjs` (statyczny); logi runu. Zero zmian: gra-robocza, WERSJE.md, rust-port, auto-improvements.ts.
LOKALIZACJA: dotychczasowe zerowanie = main.ts `restoreGameFromSave` (decl. l.42000), surowe `_lastPracaRate = 0; _lastPracaUpkeep = 0; _lastPracaAutoUlepszeniaKoszt = 0; _lastPracaCudaKoszt = 0; ... _lastKulturaRate = 0;` -- dotyczy wylacznie fotela 0 (alias komorki slotu `makeOwnerCacheSlot`, l.12326-12352); `_lastKultura` fotela 0 NIE bylo zerowane (teraz jest -- zgodnie z lista decyzji). `_lastPraca` (pula) swiadomie nietykane (odtwarzane z zapisu, l.~42749).
ZALOZENIE: `_lastPraca` (pula Pracy) nie jest "wartoscia pomocnicza HUD" z listy decyzji -- zostaje z zapisu (test W3: 405/77 zachowane).
TESTY:
- PRZED (czerwony, bez poprawki): `gate-red-przed.txt` -- hot-seat 2 foteli (seedSecondSeat + tartak na miescie kazdego fotela), wczytanie w sesji (`roundTrip` = REALNE buildSaveGameSnapshot->restoreGameFromSave): fotel 1 po wczytaniu pracaRate=13, pracaUpkeep=1 (stara liczba), fotel 0 = 0. 16 pass / 2 fail, EXIT=1.
- PO (zielony): `gate-green-po.txt` -- obaj fotele wszystkie 6 pol = 0, pule 405/77 zachowane, 0 pageerror. 18/0, EXIT=0. Dowod pomiaru: `evidence-red.json`, `evidence-green.json`.
- Mutacja (usuniecie linii `setOwnerLastPracaUpkeep(oid, 0)`): live 17/1 FAIL (`gate-mutacja-live.txt`), wiring 8/1 FAIL (`gate-mutacja-wiring.txt`); po mutacji main.ts przywrocony (grep=1).
- Wiring statyczny PO: `gate-wiring-po.txt` 9/0.
- NIE_ZMIERZONO live: pola kultura, kulturaRate, pracaAutoUlepszeniaKoszt, pracaCudaKoszt fotela 1 nie daja sie zabrudzic w Chromium bez konca tury (setter tylko w end-turn, brak haka; haki main.ts poza allowlista) -- dla nich dowodem jest test statyczny wiring (wszystkie 6 w petli) + live potwierdza ze 2 osiagalne pola i fotel 0 dzialaja.
- Bramki: tsc EXIT=0 (`gate-tsc.txt`); saveload-praca-pool-hotseat-live 22/0; saveload-praca-pool-live 13/0; diplomacy 148/0; war-era-counter 82/0; ring (unit-owner-emblem-ring-civ-color) 15/0; autoimprove-stages-q1 269/0. Logi `gate-*.txt` kazdy z linia `EXIT=`.
- Uwaga: `npm ci` w gra/ (instalacja zaleznosci) uzyty; testy live robia `vite build` do katalogu tymczasowego (jak istniejace bramki), nie `npm run build/dev`. node_modules usuniety po etapie.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-WEB-HOTSEAT-HUD-CACHE-Q1), potem Final Control; integracja po stronie orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
