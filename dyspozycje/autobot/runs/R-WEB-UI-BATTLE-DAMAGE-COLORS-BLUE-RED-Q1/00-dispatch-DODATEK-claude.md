# DODATEK 0 (orkiestrator, 06:39 UTC) — runda 1; START po AMBUSH-REQUIRES-GENERAL (ten sam plik).

## DODATEK 1 (runda 2, 2026-11-17) — BAZA = b93db15b3a634c265fea3f52431ac9446a69456d (kandydat r1; kod ma wejść w całości)

Final Control r1: FAIL z JEDNEJ przyczyny — kryterium (b): brak ≥4 zrzutów z ŻYWEGO Chromium z pływającymi liczbami obrażeń obu kolorów. Kod (kolory przeciwnika niebieskie, gracza czerwone; tokeny w `battleHudTheme.ts`, `endScreen1E.ts`, `postBattleSummary.ts`), test kolorów 28/0, tsc 0 i 5 bramek są ZIELONE — NIE przepisuj kodu, chyba że zrzut pokaże realny defekt (np. słaby kontrast na mapie). Zarzuty 2 i 3 FC: ODDANE (odstępstwo od allowlisty zaakceptowane: `endScreen1E.ts`, `postBattleSummary.ts` wprost w GOAL 2, `manualBattle.ts` tylko komentarz; żółty 0xffd54a to kolor cywilizacji gracza, nie znacznik strony — bez zmian).

ZADANIE rundy 2 (jedno): nowy plik `gra/tools/battle-damage-colors-live-test.cjs` (test, w allowliście) — driver bitwy w żywym Chromium (xvfb-run, vite z `--outDir` poza repo wg C-001), który:
1. dochodzi do realnej walki (po przycisku „START WALKI”; selektor weź z DOM/zrzutu; poczekaj na kolejne rundy), przy użyciu WZORCA z harnessu, który już DOCIERA do bitwy — przejrzyj `gra/tools/battle-doctrine-live-r4-test.cjs`, `battle-manual-control-multicycle-live-test.cjs`, `ambush-live-test.cjs` (zielone w FALI 795, dochodzą do sceny bitwy) i skopiuj ich metodę uruchomienia/startu walki. Dwa harnessy, które utknęły w r1 (`battle-manual-melee-live-test.cjs`, `r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs`), NIE są wzorcem;
2. doprowadza do trafień OBU stron (szybka bitwa, jednostki wręcz i dystans) i odczytuje wartość koloru pływających etykiet obrażeń (computed style elementu/materiału etykiety `_spawnDamageLabel`) — obrażenia NA PRZECIWNIKU = niebieski, NA JEDNOSTKACH GRACZA = czerwony;
3. robi ≥4 zrzuty (wręcz + dystans × 2 rozdzielczości, np. 1440×900 i 1024×640) do /tmp i OBEJRZYJ je (Read obrazu); opisz kontrast niebieskiego na tle mapy w raporcie. Zrzuty NIE do repo (nie commituj PNG, także cudzych nadpisanych testami).
Jeśli walka nie startuje po rozsądnych próbach (max 2 różne podejścia) — zapisz DOKŁADNIE gdzie utknęło (krok, selektor, log) i zwróć BLOCK z dowodem, nie zgaduj.

Zakazy bez zmian: `rm/rmdir/unlink` w komendach, `git add -A`, `npm run build/dev` w `gra/`, nie wypychaj. Model Operatora: HAIKU (r2; Sonnet dopiero po 2 nieudanych rundach Haiku).
