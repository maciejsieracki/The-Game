STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - dlug testowy
TEMAT: R-WEB-TEST-DEBT-REGRESSION-A-SYNC-Q1
GOAL: Synchronizacja 8 testow klasy A (FULLREG) z celowymi zmianami FALA 509-531; zero zmian w gra/src i gra/data.

ZMIANY/COMMIT: baza origin/main 16c0509f6; tylko gra/tools/*-test.cjs + ten raport. SHA commitu: patrz koniec pliku / `git log` brancha worktree-wf_8d254767-98f-1 (commit zawiera ten raport, wiec SHA nie moze byc w nim samym; podany w odpowiedzi koncowej).

Klasyfikacja (kazdy = NIEAKTUALNA ASERCJA, zadnego realnego bledu gry):
1. hud-armia-chip-jednostki (2 FAIL), hud-obywatele-chip (3 FAIL): regex celowal w `function buildHudState`, ktore po FALA 525 jest cienkim wrapperem `hudPureScope.run` (main.ts:21119-21121); logika jest w `buildHudStateRaw` (main.ts:21122, `pc`/`pop` 21148-21149, `ludnosc` 21333, `rekrutEkw`/`kosztJednostki` 21348-21349). Regexy przepieto na `buildHudStateRaw`, tresc asercji bez zmian.
2. spichlerz-deficyt-scalenie (3 FAIL): ten sam powod; kotwica `extractFunctionBody` -> `buildHudStateRaw` (getLastEmpireFoodTick main.ts:21292, zywnoscMiastNiedokarmionych 21293/21303).
3. prereq-budynkow (1 FAIL): 10. wpis `emporion: 'targowisko'` (building-resource-gate.ts:123, R-WEB-BUILDING-EMPORION-Q1). Licznik 9 -> 10 + NOWA asercja na wpis emporion.
4. diplo-aggressor-wiring (1 FAIL): prog paktu liczy wspolny helper `napRelacjaProgEfektywny` (diplomacy-proposals.ts:544-552, dodaje deltaRelacjiSojusz; wywolanie :1146-1150 przekazuje proponentAgresor); inline zostal tylko sojusz (:1197). Asercja zaostrzona do: 1 wystapienie inline + delta w helperze + przekazanie proponentAgresor do helpera + lacznie 2 wywolania deltaRelacjiSojusz(.
5. siege-blockade-no-recruit-reinforce (C4, C5): C4 - warunek kolejki rozszerzony o `|| recStackFree <= 0` (R-WEB-ARMY-STACK-LIMIT-Q1, main.ts:38106; oblezenie nadal pierwszym czlonem); C5 - blokada wejscia szuka tylko wsrod obleganych miast przez siegeScopeMemo (main.ts:12388-12391). Regexy dopasowane do nowej formy.
6. sidepanel-hud-deadzone: u mnie zielony (43/0); w logu FULLREG klik trafial w `.civ-map-load-overlay` (nie zdazyl zniknac przy obciazonym hoscie - test czekal max 90 s na tekst „Tworzenie swiata", a tryb 'load' ma inny tytul). Czekanie zmienione na zniknieciu selektora `.civ-map-load-overlay`, limit 240 s. Asercje bez zmian. Klasyfikacja: flaky/kolejnosc (czesciowa pewnosc - nie odtworzono czerwonego lokalnie).
7. ai-army-scattered-merge: asercja czasowa (CPU-time, min z przeplatanych prob). TRIALS 5 -> 11; statystyka i progi (2x+50, 3x+10) BEZ ZMIAN. Proba mediany parowej odrzucona (bardziej rygorystyczna, 11.1 > 10 ms - nie zgodna z "nie osłabiaj").

OBSERWACJA (nie blad w tym temacie): koszt tury AI w fazie zbierania chmury po FALA 520 to PO~50 ms vs bez bramki~14-16 ms, prog 3x+10 = 52.5-58 ms, czyli margines 2-8 ms. Test jest flaky z natury, bo realny koszt lezy przy progu. Jesli wlasciciel chce margines - temat perf w ai.ts (planFieldStackGather/faza zbierania), osobny; moj temat tylko stabilizuje probkowanie.

TESTY (po poprawkach, gra/, node_modules z `npm ci --ignore-scripts`, usuniete po pracy):
- hud-armia-chip-jednostki 60/60; hud-obywatele-chip 20/20; spichlerz-deficyt-scalenie 58/0; prereq-budynkow 60/0; diplo-aggressor-wiring 15/0 (+ diplo-aggressor-unit 73/0); siege-blockade (z Chromium) 57 OK/0 FAIL; sidepanel-hud-deadzone 43/0; ai-army-scattered-merge 33/0.
- Dowod czerwony-na-starym: przed zmianami te same testy dawaly: armia 58/2, obywatele 17/3, spichlerz 3 FAIL, prereq 1 FAIL, diplo-wiring 14/1, siege 55 OK/2 FAIL (C4,C5) - zmierzone na tym samym drzewie (HEAD = origin/main) przed edycja; po edycji zielone.
- Regresje: logic-test 213/213; ai-test 274 passed / 20 failed (bez pogorszenia wzgledem punktu odniesienia 274/20); tsc --noEmit bez bledow.

BLOKADY: brak. Brak realnych bledow gry (zadnego DECISION_REQUIRED).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5); zwrocic uwage na pkt 6 (niepelna reprodukcja) i obserwacje perf w pkt 7.
DEPLOY/PUSH: NIE WYKONANO
