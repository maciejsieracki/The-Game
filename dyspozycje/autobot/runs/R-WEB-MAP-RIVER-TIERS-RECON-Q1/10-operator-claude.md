STATUS: PASS-WITH-NOTES
DOMAIN: GAME (recon, bez zmian kodu)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2x źródeł), zero zmian w gra/**
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md + ten raport; baza e70abe718
TESTY: NIE ZMIERZONO. Brak gra/node_modules w worktree i w checkoucie głównym (esbuild wymagany przez gra/tools/river-count-quick.cjs); pomiar 15 map i czasy generowania nie wykonane. Odczyt kodu: gra/src/map/gen-helpers.ts:11971 (bramka !isRiverGenFull), gra/src/map/generator.ts:493-499, gra/src/map/riverGenSwitch.ts:76-83, gra/src/map/newGameMapDefaults.ts:281 i 338, gra/src/render/scene.ts:1517.
BLOKADY: brak pomiaru liczb rzek; rozbieżność N=15 (MAPA-RZEKI-SPEC §2) vs mainCell=5 dla tieru medium (kod, newGameMapDefaults.ts:281); brak wprost sformułowanej reguły „trzeci poziom" w docs/ i dyspozycje/ (najbliższe: RiverPathKind 'short' = etap 3, gen-helpers.ts:8632-8634).
KLUCZOWE USTALENIA: domyślna faza generacji to 'main' (generator.ts:497, riverGenSwitch.ts:76-77). Medium, short i tributary powstają tylko przy ?riverGenPhase=all. Dlatego w domyślnej grze widać wyłącznie rzeki główne, niezależnie od parametrów siatki.
RUNDY: 1/5
NASTĘPNY KROK: decyzja ABC właściciela (trzeci poziom = short, czy nowy typ; czy domyślnie włączyć fazę all); pomiar 15 map po instalacji zależności.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: nie tworzono żadnych sesji, zadań ani triggerów. Nie użyto run_in_background. Usuń/sprawdź: w worktree nie utworzono node_modules (symlink nie powstał).
