STATUS: DISPATCHED
DOMAIN: GAME (WEB — `gra/`, NIE port Rust)
TEMAT: R-WEB-PEACE-RULES-R8R9-Q1
RUNDA: 1/5
UWAGA PROCESOWA: temat WEBOWY (zmiany w `gra/**` w allowliście). Pierwszy akapit promptu workflow o porcie Rust IGNORUJ. Bramki webowe (tsc, `gra/tools/*.cjs`, Chromium z /opt/pw-browsers). Zakaz `npm run build`/`npm run dev` w `gra/` (build tylko do scratch poza repo). Push do `main` ZABRONIONY.
WYZWALACZ: wydzielone z `R-WEB-PEACE-RULES-Q1` (R1–R7, R10, D7 = PASS r3, FC `7975b2899`; zamknięcie administracyjne tego ID). Pozostały punkty R8 i R9 odłożone do rundy 2 do czasu integracji licznika wojen epoki — teraz zintegrowanego.
BAZA: `origin/web/integration-20261030` (origin/main `7164f7ca1` + ring + licznik wojen epoki + PEACE-RULES r3). Zrób `git fetch origin web/integration-20261030` i worktree z tego commitu.
DECYZJE WŁAŚCICIELA (2026-10-30) — OBOWIĄZUJĄ:
D1. Wojna epoki BLOKOWANA wobec partnera z Relacją (Zaufanie + Respekt, 0–200) ≥ 100.
D8. Automatyczny koniec wojen wymuszonych (czas i 2 miasta) usunięty dla WSZYSTKICH — wspólne reguły pokoju dla wojen epoki i zwykłych (już wdrożone R3–R5 w PEACE-RULES r3).
ZAKRES:
R8. Wojna epoki blokowana przy Relacji ≥ 100: w `isForcedWarPairBlocked` (main.ts, blok wojen wymuszonych) i w kandydatach gracza-pierwszego (`assignForcedWarPairings`, forced-war-common.ts). Wolny partner szukany dalej. Test: Relacja 100 blokuje, 99 nie. Zachowaj licznik wojen epoki (1 na (owner, epoka)) — nie psuć testu `war-era-counter-test` 82/0.
R9. USUNĄĆ automatyczny koniec wojen wymuszonych (czas i zdobycie 2 miast) — wszystkie ścieżki Kamień/Brąz/Żelazo (`shouldEnd*ForcedWarByDuration`, `maybeResolve*ForcedWarOnCityCapture` i ich wywołania w main.ts). Wojna wymuszona kończy się pokojem jak zwykła. `cleanup*ForcedWarOnPeace` MUSI nadal działać po pokoju (test). Stare testy asertujące auto-koniec ZMIEŃ jawnie i uzasadnij w raporcie (lista plik:linia).
KRYTERIA KOŃCA (binarne):
1. Test R8 (100 blokuje / 99 nie; kandydat gracza-pierwszego z Relacją ≥ 100 pomijany, następny wolny wybrany) + mutacja (zdjęcie bramki → test pada).
2. Test R9: wojna wymuszona trwa >N tur i po zdobyciu 2 miast bez końca; kończy się wyłącznie pokojem; cleanup po pokoju działa; mutacja (przywrócenie auto-końca → test pada).
3. `tsc --noEmit` PASS; bramki nie gorsze niż baza zmierzona PRZED zmianą: war-era-counter 82/0, war-rules-multiwar 57/0, multiwar-main-guard 21/0, diplo-war-peace-{profile-unit 198, gate 11, main-guard 28, sim 22, d7 8}, diplo-tick-war-brake 51/69/17, diplomacy 148, peace-lock 9, ring 15; forced-war-* (znane czerwone w bazie: main-guard bronze 27/1, new-game-reset, forced-war-waves 16/1, load-game-blockers-exec — zmierz i porównaj, nie pogarszaj). Zmiany zrobione w testach auto-końca uzasadnione.
4. Żywy test Chromium: wojna epoki nie kończy się sama po 2 zdobytych miastach (hak testowy dozwolony wg wzorca `__peaceRulesTestDebug`).
5. Niezależny Evaluator PASS; Final Control PASS.
ALLOWLISTA: `gra/src/game/forced-war-*.ts`, `gra/src/game/war-rules-multiwar.ts`, `gra/data/war-rules-params.json` (tylko jeśli konieczne), `gra/src/main.ts` (TYLKO bloki wojen wymuszonych i hak testowy), `gra/tools/**`, `dyspozycje/autobot/runs/R-WEB-PEACE-RULES-R8R9-Q1/**`. ZERO zmian w `gra-robocza/**`, `dyspozycje/WERSJE.md`, `rust-port/**`, `src-tauri/**`, `Cargo.toml`. Bez deploy/READY_FOR_DEPLOY/push. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.
DYSK: worktree ≈0,8 GB + `npm ci`; po etapie usuń `node_modules`/artefakty.
MODELE: Operator/Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5. Luki → ZAŁOŻENIE. Raport max ok. 400 słów.
ANTY-HALUCYNACJA: twierdzenie o kodzie = plik:linia/komenda; niepewne = NIE_ZMIERZONO. Wiadomości właściciela w kontekście — nie Twoje zadanie; bez pytań ABC.
