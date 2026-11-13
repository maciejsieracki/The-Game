# R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — Obrona Operatora (runda 2, HAIKU)

STATUS: BLOCK (bez zmian kodu gry; zrodlo dryfu skarbca AI NIE ZIDENTYFIKOWANE; dwie hipotezy wykluczone jako jedyne zrodlo)
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1
GOAL: ten sam skrot stanu dla tego samego ziarna we wszystkich przebiegach (z bitwami automatycznymi i oblezeniami), bez zmiany regul gry.
BAZA: ad7959321 (kandydat operatora r2; worktree `git checkout --detach ad7959321`). Zadnych zmian w gra/src ani gra/tools.
ZMIANY-COMMIT: tylko ten raport i cztery dowody pomiarowe w `evidence/def2-*.json` (nowe pliki, bez modyfikacji istniejacych). Commit wykonany jawnymi sciezkami (`git add <sciezka>`), bez `git add -A`.

## Co dodano w tej obronie (dowody)

Pomiar: `gra/tools/measure-ai-trade-offer-frequency.cjs`, ziarno 2222, `MEAS_ARM=prepared MEAS_REL=20 MEAS_TURNS=40 MEAS_FAST=1`, bundle zbudowany z biezacego kodu (ad7959321), 40 tur, `stoppedBy` = koniec przebiegu we wszystkich przypadkach. Kazdy przebieg ~1 min 46 s, w pierwszym planie, jedno wywolanie Bash na przebieg.

| Przebieg | Konfiguracja | trajectorySha256_12 | autoBattles | pierwsza rozbieznosc vs def2-base-1 |
|---|---|---|---|---|
| def2-base-1 | kandydat, bez mutacji | 4917febd9c04 | 0 | — |
| def2-base-2 | kandydat, bez mutacji | f60c439c632e | 0 | t22, `treasury[1]` 581 vs 584 |
| def2-base-3 | kandydat, bez mutacji | 7078d3346e98 | 0 | t23, `treasury[1]` 581 vs 583 |
| f2222-a/b/c (r2 Operatora) | kandydat, bez mutacji | bc1e99ec053f / 3034535b8eff / beb31cc01c39 | 1 / 1 / 1 | (r2: t27/t28) |
| def2-mutA-1/2 | MUTACJA A: 8-sekundowe wymuszone czyszczenie „stuck transition” (main.ts:38696) wylaczone (`if (false && ...)`) | 147e6a988b70 / f60c439c632e | 0 / 0 | t23 / t22 (vs base-1) |
| def2-mutB-1/2 | MUTACJA B: `Date.now()` w ID stackGroupId (armyMerge.ts:75) i budowa-lista (cities.ts:89) zastapione licznikiem | fd702b9340d6 / fc18955038b6 | 0 / 0 | t22 (vs base-1) |

Wnioski z tabeli (liczby z surowych JSON, skrypt porownania `cmp` w scratchpadzie operatora, nie w repo):
- Na kandydacie z 40 turami i ziarnem 2222 zaobserwowano 6 roznych skrotow w 6 przebiegach bez mutacji (4917, f60c, 7078, bc1e, 3034, beb3); po dolaczeniu mutantow A i B — 9 roznych skrotow w 10 przebiegach (jeden powtorzony: def2-mutA-2 = f60c, takze def2-base-2).
- Pierwsza rozbieznosc zawsze w tym samym polu: `digest.treasury[1]` (skarbiec AI wlasciciela 1), wartosc 581 w jednym przebiegu vs 583/584 w drugim; poczatek w perTurn idx 20/21 = tura 22/23 (mapowanie: `t = indeks + 2`, bo perTurn zaczyna sie od tury 2). Jednostki, miasta, pending, deals, table i relTotalAi zgadzaja sie do tej tury.
- `autoBattles = 0` we wszystkich przebiegach def2 (mutanty A i B tez). Rozbieznosc wystepuje wiec przy braku auto-walk: zrodlo NIE jest tylko w auto-walkach.
- Mutacja A (wylaczenie 8 s wall-clock stuck-clear) NIE usuwa dryfu: dwa przebiegi, dwa rozne skroty (147e, f60c), oba z rozbieznoscia skarbca AI w t22/t23. Wykluczona jako jedyne zrodlo dryfu.
- Mutacja B (deterministyczne ID stackGroupId i budowa-lista) NIE usuwa dryfu: dwa przebiegi, dwa rozne skroty (fd70, fc18), rozbieznosc w t22. Hipoteza z dispatchu o Date.now w ID jest zatem wykluczona jako jedyne zrodlo (nie jest wykluczona jako przyczynolowo drugorzedna — nie zbadano).
- Mutacje A i B NIE sa dowodem mutacyjnym wymaganym przez dispatch (pkt 3 i DODATEK pkt 4): zaden z nich nie daje powtarzalnego, innego skrotu niz kandydat; oba przebiegi kazdej mutacji sa rozne. Mutacja nie „zmienia skrotu” w sensie dowodowym, bo skrot jest losowy zarowno przed, jak i po mutacji.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (ad7959321 / raport 6158896e3)

1. Cel rundy 2 niespelniony (3 skroty na ziarnie 2222) — PRZYJMUJE. Dowod: def2-base-1..3 + f2222-a..c: 6 roznych skrotow bez mutacji. Kryterium binarne NIE jest spelnione. Nie naprawiono.

2. Bisekcja niewykonana do funkcji i linii — PRZYJMUJE. Wykonano tylko eksperymenty wykluczajace (mutacje A i B, tabela wyzej). Bisekcja per krok AI (instrumentacja `runAiPhase` / petli komend AI w main.ts ok. 43380–43470 i 41160+) wymaga osobnej rundy pomiarowej; nie zmiescila sie w budzecie tej obrony (kazdy przebieg ~2 min w osobnym wywolaniu).

3. Brak naprawy; brak salt-licznika auto-battle; brak przekazania rng w manualBattle.ts ok. l.1062 — PRZYJMUJE brak naprawy i ODRZUCAM w tej formie obie pozostale czesci:
   - Licznik walk w turze (sol strumienia auto-battle) NIE jest warunkiem determinizmu: przy tym samym ziarnie i tej samej sekwencji wywolan daje ten sam wynik; jego rola to unikniecie identycznych strumieni dla dwoch walk o ten sam hex i tego samego lidera w jednej turze (jakosc losowania, nie powtarzalnosc). Dodatkowo licznik nie jest zapisywany w zapisie, wiec po wczytaniu zapisu w tej samej turze zmienia kolejnosc strumieni (ryzyko opisane przez operatora r1, sekcja 2 „Luka”). Dlatego nie zostal dodany w tej rundzie.
   - manualBattle.ts:1062 (resolveCombat bez rng) — PRZYJMUJE jako otwarte ograniczenie: plik poza allowlista i dispatch zakazuje rozszerzen poza zakres auto-walki; wymaga decyzji orkiestratora (patrz UWAGI).

4. Hipotezy z dispatchu osłabione czytaniem kodu, nie eksperymentem; brak mutacji diagnostycznej — PRZYJMUJE, i wykonano eksperymenty: mutacja A (stuck-clear, main.ts:38696) i mutacja B (Date.now w ID: armyMerge.ts:75, cities.ts:89). Obie NIE usuwaja dryfu (tabela). Hipoteza zegara w ID i wall-clock stuck-clear wykluczona jako jedyne zrodlo. Nie wykluczono innej sciezki zegara lub kolejnosci iteracji Map/Set; ta czesc zostaje NIE_ZMIERZONO.

5. Wniosek „przeplot krokow AI z zegarem, nie RNG” nieudowodniony; r2 mialo autoBattles=1, a r1 mowilo „nie auto-walki” — PRZYJMUJE. Korekta: w r2 (f2222-a..c) autoBattles=1 w kazdym przebiegu, wiec teza „nie auto-walki” nie ma pokrycia w danych r2 i nie wolno jej powtarzac dla r2. ODRZUCAM natomiast wniosek „auto-walki nie sa jedyna przyczyna”: w def2-base-1..3 i def2-mutA/B autoBattles=0 i skrot nadal dryfuje, wiec rozbieznosc nie wymaga auto-walk. Nie ustalono, czy auto-walki r2 dodatkowo dokladaja dryfu. Zrodlo pozostaje NIE_ZMIERZONO. Wplyw resolveCombat bez rng (battleScene.ts:20795 i manualBattle.ts:1062) na stan: TAK, pozostaje otwarty (patrz 3).

6. Pomiar niepelny wzgledem dispatchu (3 przebiegi zamiast >=6; ziarno 1717, tryb normalny, mutacja zmieniajaca skrot) — PRZYJMUJE czesciowo:
   - Ziarno 2222, tryb przyspieszony: teraz 6 przebiegow bez mutacji (3 nowe def2-base + 3 r2) — spelnia liczbe przebiegow, nie spelnia kryterium „ten sam skrot”.
   - Ziarno 1717: NIE_ZMIERZONO (budzet).
   - Tryb normalny >=3x40: NIE_ZMIERZONO. Runner ~10 s/ture, 40 tur > 400 s, wymaga wielu wywolan z MEAS_PROFILE (wznawianie).
   - Mutacja zmieniajaca skrot: NIE dowiedziona (patrz wyzej — mutacje A i B nie daja powtarzalnej zmiany skrotu, bo skrot jest losowy).

7. Kryterium „determinism-same-seed-test z mniejsza lista wyjatkow” niespelnione — PRZYJMUJE jako NIESPELNIONE: lista wyjatkow bez zmian, bo nie wprowadzono zmiany zrodla, ktora moglaby ja skrocic. Test `determinism-same-seed-test.cjs` (uruchomiony na ad7959321 w r2: PASS) pozostaje zielony, ale to zielony test przy niezmienionej liscie.

8. Drobne niedokladnosci raportu — PRZYJMUJE:
   - Mapowanie indeksu perTurn na ture: t = indeks + 2 (dodane wyzej, zweryfikowane na kolejnosci `t` w base-1: 2,3,...,41).
   - Skrypt porownania nie byl w repo; dodano dowody JSON dla kazdego przebiegu, a skrypt `cmp` (mala funkcja porownujaca pola digest po turze) pozostaje poza repo i jest opisany powyzej.
   - Prog Sonneta: operator r1 i r2 maja FAIL r1 + BLOCK r2 bez kodu. Zgodnie z zasada modeli, Sonnet na Operatorze wymaga pisemnego uzasadnienia w dispatchu orkiestratora; ta obrona nie zmienia modelu i nie rekomenduje go sama.

## Ryzyko kolizji _detIdSeq (pytanie 5 dispatchu r1)

NIE_ZMIERZONO w tej rundzie. Analiza z r1 (main.ts ~2008, licznik w domknieciu, nie zapisywany w zapisie) pozostaje aktualna. Nie naprawiano (poza allowlista rundy 2 i wymaga zmiany formatu zapisu).

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez tworzenia sesji)

1. Dryf skarbca AI (`treasury[1]`) przy tym samym ziarnie jest ZREPRODUKOWANY 6 razy na kandydacie i NIE zalezy od auto-walk ani od wall-clock stuck-clear ani od Date.now w ID. Nastepna runda powinna byc instrumentacja per krok AI (zapis `ownerTreasury(1)` przed i po kazdej komendzie w petli `runAiPhase`, main.ts ok. 43380–43470) na dwoch przebiegach z ta sama konfiguracja, a potem bisekcja do funkcji. To wymaga budzetu ok. 6–10 przebiegow po ~2 min.
2. Dispatch r2 wskazuje allowlist „armyMerge.ts, cities.ts” — mutacja B pokazala, ze te pliki nie sa zrodlem dryfu; mozna je wyjac z allowlisty kolejnej rundy.
3. manualBattle.ts:1062 i battleScene.ts:20795 (resolveCombat bez rng) — wplyw na stan TAK. Decyzja: osobny temat z jawna zgoda na battleScene.ts, albo poza tym tematem.
4. Runner trzyma w `consoleMatches` tylko 60 ostatnich dopasowan; przy instrumentacji per krok AI trzeba podniesc limit lub zapisywac wszystko.
5. Dispatch r2 nie byl w origin/main (tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0). Warto zapisac to w procesie.
6. Mutacje A i B NIE sa w kodzie (przywrocono `git checkout`), kandydat ad7959321 jest czysty (`git status` bez zmian w gra/).

## TESTY

Brak zmian kodu gry w tej rundzie, wiec bramki tsc/logic/tech-tree/research/unit-replace/combat/determinism-same-seed NIE uruchamiano ponownie w tej obronie (wyniki kandydata: patrz raport Evaluatora 6158896e3, potwierdzone przez operatora r2). Pomiar: zob. tabela powyzej (surowe wyniki w `evidence/def2-*.json`).

## BLOKADY

1. Zrodlo dryfu skarbca AI NIE ZIDENTYFIKOWANE — wymaga instrumentacji per krok AI (runda 3).
2. Kryterium binarne „jeden skrot na ziarno” NIE spelnione (6 roznych skrotow na ziarnie 2222 bez mutacji).
3. Ziarno 1717 i tryb normalny: NIE_ZMIERZONO (budzet czasu rundy).
4. resolveCombat bez rng (battleScene.ts:20795, manualBattle.ts:1062) — poza allowlista/zakazem, decyzja orkiestratora.

## RUNDY

2/5 (ta obrona). Ostatni werdykt FC: FAIL (zarzuty 1–8 w raporcie Evaluatora 6158896e3). Obecny stan: 2 nieudane rundy Haiku bez kodu (FAIL r1 + BLOCK r2) — prog z zasady modeli osiagniety; decyzja o modelu dla rundy 3 nalezy do orkiestratora.

## NASTEPNY KROK

Runda 3 (orkiestrator decyduje o modelu i allowliscie): instrumentacja per krok AI w `runAiPhase` (main.ts ok. 43380–43470), dwa przebiegi ziarna 2222 w tej samej konfiguracji, pierwszy krok AI z rozbiezna wartoscia `treasury[1]`, potem bisekcja do funkcji i linii.

DEPLOY/PUSH: NIE WYKONANO (commit tylko na galezi detached/worktree; push na main nie wykonywany; integracja nie wykonywana)
