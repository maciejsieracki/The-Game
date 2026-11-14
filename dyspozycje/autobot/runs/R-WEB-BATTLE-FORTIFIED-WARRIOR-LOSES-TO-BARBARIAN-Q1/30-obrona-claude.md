STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: odpowiedziec na 7 zarzutow Evaluatora (kandydat fc0437a91, raport 20-evaluator-claude.md, report_sha 3b8999e39): ustalic danymi, czy Wojownik barbarzyncow wygrywa z Wojownikiem gracza przez defekt (bonus, flaga fortu, kolejnosc) czy przez zamierzone reguly (tryb 'pewne', szarza w rundzie 1). Bez zmian kodu src/data.
ZMIANY/COMMIT: tylko ten raport (git add tej sciezki). Brak zmian w gra/src, gra/data, gra/tools. Baza kodu: fc0437a91 (zmierzone na wersjach plikow z kolejnych commitow archiwum git, patrz BISECT). Sam SHA commita raportu: git log -1 w tej gałęzi wt (wartosc w polu sha odpowiedzi).

## Odpowiedzi na zarzuty Evaluatora

Zarzut 1 (brak bisectu po commitach DODATKU 2/3): PRZYJMUJE. Bisect wykonany, tabela ponizej. Wynik: w resolveCombat tryb 'losowe' daje IDENTYCZNE wyniki na wszystkich 68 commitach od 1461c0dfa do eb68e66d8 (zakres z DODATKU 2/3). Jedyny commit, po ktorym zmienia sie wynik, to ae600d5ed (2026-11-12, przelacznik Trafienia): od niego tryb 'pewne' daje 200/0/0, a domyslny tryb dla NOWYCH gier to 'pewne' (newGameFlow.ts, DEFAULT_ADVANCED: hitMode: 'pewne', wprowadzone w ae600d5ed). Wczesniej w grze nie bylo trybu 'pewne', wiec wynik 100/0 nie mogl wystapic. To zgadza sie ze zgloszeniem wlasciciela „wczesniej nie bylo”. Zastrzezenie: bisect obejmuje resolveCombat (silnik czysty z ziarnem LCG). Zmiany RNG w scenie (eb68e66d8, 38752ec01) i sciezki AUTO nie sa mierzone tym probe (NIE_ZMIERZONO w scenie, patrz nizej).

Zarzut 2 (wniosek 'pewne' nie tlumaczy kierunku „barbarzynca wygrywa tez gdy gracz atakuje”): PRZYJMUJE, z korekta wniosku. Dla identycznych jednostek (Wojownik vs Wojownik) wywolanie resolveCombat(atakujacy, obronca) jest TYM SAMYM wywolaniem co odwrotne, wiec wygrana atakujacego to wlasciwosc samego wywolania, nie barbarzyncy. Gdy gracz atakuje, to gracz jest atakujacym i w 'pewne' wygrywa 100% (tabela 'Kontrola roli' w sim). Zgloszenie „barbarzynca wygrywa w obu kierunkach” NIE jest odtwarzalne na poziomie resolveCombat. Musi wynikac z przypisania roli atak/obrona w bitwie (kto jest „atakujacym” w battle setup / kto inicjuje pierwsze uderzenie w scenie). To nie zostalo zmierzone (NIE_ZMIERZONO, patrz BLOKADY).

Zarzut 3 (zla sciezka pomiaru: resolveCombat, nie scena/Pomin): PRZYJMUJE jako ograniczenie. Pomiar obejmuje resolveCombat. Sceny (_singleBlow, battleScene.ts:8987-9160) ani computeInstantResult (battleScene.ts:20703, wywolanie resolveCombat w linii 20850) nie uruchomiono: BattleScene wymaga srodowiska DOM/Phaser, a w tej rundzie nie podjeto proby jego uruchomienia (NIE_ZMIERZONO). Sciezki kodu sprawdzone CZYTANIEM: (a) _singleBlow: fortyfikacja wpieta jako defMeleeDef = fieldFortifyDefenseBonus(...) przed terenem (battleScene.ts ~9107-9111); (b) computeInstantResult: fortyfikacja wpieta jako cu_d.meleeDefence = fieldFortifyDefenseBonus(...) (battleScene.ts ~20818-20822), potem resolveCombat(cu_a, cu_d) w linii 20850; (c) charge w scenie: isCharge = firstBlow && !bracesAgainstCharge(defender) (battleScene.ts 9072-9077), a kontratak dostaje engaged.add(def>atk) (linia 9317), wiec odpowiedz nie dostaje szarzy. Pomiar „fort on/off” w scenie nie byl wykonany.

Zarzut 4 (blednie „pierwsze uderzenie”; szarza w rundzie 1, combat.ts:1111): PRZYJMUJE. W resolveCombat uderzenia sa jednoczesne (combat.ts ~1152-1174: „Defender counter-attacks simultaneously”, kontrola smierci po obu uderzeniach). Asymetria to szarza R1: isCharge = meleeRound === 1 && !defBracing (combat.ts:1111), bonus roundAtkCharge (Uderzenie) tylko po stronie atakujacego, wplywa na celnosc (chargeHitBonus) i obrazenia (damageTw(..., roundAtkCharge, isCharge)). Dowod: probe z chargeBonus atakujacego = 0 daje w 'pewne' 0/0/200 (100% remisow), czyli bez szarzy identyczne jednostki remisuja. Bez szarzy w 'losowe' wynik to 93/90/17 (prawie symetria). Wniosek r1 „pierwsze uderzenie” nalezy zastapic: w resolveCombat przewaga = szarza R1 atakujacego. Opcja D z r1 (zmiana kolejnosci uderzen) nie jest wspierana danymi. Uwaga dla sceny: tam kolejnosc istnieje (atak 9304, potem kontratak 9321), wiec w scenie H5 (kolejnosc) pozostaje NIE_ZMIERZONO.

Zarzut 5 (brak macierzy 3x3 i ksiegi modyfikatorow): CZESCIOWO PRZYJMUJE, CZESCIOWO ODRZUCAM z uzasadnieniem. Macierz 3x3 (gracz/AI/barbarzynca) w resolveCombat jest tautologia: owner ani civ nie sa wejsciem funkcji, a probe przekazuje identyczne jednostki (combatUnitFromDef z tego samego wpisu units.json). Wejscia zalezne od wlasciciela (attackerCivBonusy, attackerDifficultyCombatMult; combat.ts:336, 411) pochodza ze sceny i NIE zostaly zmierzone (NIE_ZMIERZONO). Ksiega modyfikatorow dla 4 pierwszych komorek (Wojownik vs Wojownik, losowe i pewne, z i bez fortu) z probe:
- baza (combatUnitFromDef, units.json): Atak 4, Obrona 4, Uderzenie 4, Przebicie 1, Pancerz 2, HP 22 (ta sama krotka dla obu stron; sim: fieldPower att 10, def 17).
- szarza R1 atakujacego: +Uderzenie 4 (roundAtkCharge), tylko runda 1, tylko atakujacy (combat.ts:1111, 1152-1160).
- fort: x1,5 na Obrone obroncy (probe: meleeDefence x1,5, odpowiada fieldFortifyDefenseBonus, tylko Obrona). W 'pewne' bez skutku (trafienie 100%, pancerz bez zmian).
- weteran, epoka, teren, rzeka, generał, morale, glod, civ, trudnosc: NIE w probe (domyslne 1 / brak opcji). NIE_ZMIERZONO w scenie. Wedlug r1 barbarzyncy sa wykluczeni z mnoznika trudnosci (ai-difficulty-bonus.ts:17-19), ale tego NIE ponownie zweryfikowano w tej rundzie.

Zarzut 6 (pominieta rozbieznosc AUTO vs reczne): PRZYJMUJE jako obserwacje, wyjasnione kodem. (a) Wojownik vs Wojownik AUTO = 0,0% atakujacego, poniewaz resolveAutoBattleByPower zwraca 'tie' (remis M) gdy M atakujacego = M obroncy (isTie, auto-battle-power.ts; gałąź „remis M” przed linia `mAtk > mDef ? 'attacker' : 'defender'`). Remis nie jest wygrana atakujacego ani obroncy, a nie jest to asymetria barbarzyncy. (b) Wojownik vs Łucznik: AUTO 100% atakujacego (M 27 vs 19, sim), reczne 'pewne' 0% (atakujacy Wojownik), reczne 'losowe' 71,5%. Rozbieznosc ma zrodlo modelowe: AUTO porownuje moce fieldPower (unit-power.ts), a reczne liczy rundy z faza strzelecka (Łucznik strzela przed zwarciem; w 'pewne' kazdy strzal trafia). To NIE jest ukryty bonus barbarzyncy, ale jest realna niespojnosc AUTO/reczne. Decyzja, czy zamierzona: DECISION_REQUIRED (wlasciciel). Nie zmieniano.

Zarzut 7 (pomiar fort on/off ze skryptu poza repo; raport podaje tsc i 5 bramek jako NIE_WYKONANO): PRZYJMUJE. (a) Pomiar fortu odtworzony probe'em (patrz tabela) — wyniki ponizej. (b) Bramki: w tej rundzie NIE_WYKONANO z powodu braku zmian kodu (diff fc0437a91 vs HEAD = tylko raport). Liczby bramek z zarzutu Evaluatora (tsc 0 bledow, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) sa cytowane z raportu Evaluatora, NIE z moich uruchomien. (c) Odtworzenie sim tools/barb-warrior-audit-sim.cjs (N=200): wyniki identyczne z tabela r1 (54,0 / 100,0 / 0,0 itd.; surowe wyjscie cytowane w sekcji TESTY).

## BISECT (resolveCombat, 68 commitow od 1461c0dfa do eb68e66d8)

Probe: prawdziwe combat.ts (esbuild, kopia gra/src+gra/data z kazdego commita przez git archive), Wojownik vs Wojownik, N=200, ziarna LCG 1000+k*7919, attackerPosition 'front'.
Wynik w formacie atak/obrona/remis (A/D = suma HP pozostalego):
- Commity 1461c0dfa ... 6d81e708a (58 commitow, przed ae600d5ed): losowe 108/79/13 (A2129 D1971); losowe+fort 101/86/13; losowe bez szarzy 93/90/17. Pewne: brak trybu (-).
- ae600d5ed (2026-11-12, „przełącznik Trafienia”): pojawia sie 'pewne' = 200/0/0 (A2000 D1600); pewne+fort 200/0/0; pewne bez szarzy 0/0/200.
- Commity 7476f5410 ... eb68e66d8 (9 commitow po ae600d5ed, do 2026-11-14): te same liczby co po ae600d5ed; zadna zmiana wyniku resolveCombat.
Wniosek bisectu: resolveCombat nie ma regresji w trybie 'losowe' w zakresie 2026-11-01..2026-11-14. Jedyna zmiana wyniku to wprowadzenie trybu 'pewne' (ae600d5ed) i jego domyslnosc dla nowych gier. Commity RNG sceny (38752ec01, eb68e66d8) nie zmieniaja resolveCombat (probe nie wykrywa ich wplywu na scene: NIE_ZMIERZONO w scenie).

## TABELA WARIANTOW (probe + sim, N=200)

| wariant (Wojownik vs Wojownik, atakujacy vs obronca) | atak wygrywa | obrona wygrywa | remis |
|---|---|---|---|
| losowe, bez fortu | 54,0% | 39,5% | 6,5% |
| losowe, fort obrony (x1,5) | 50,5% | 43,0% | 6,5% |
| losowe, bez szarzy R1 | 46,5% | 45,0% | 8,5% |
| pewne, bez fortu | 100,0% | 0,0% | 0,0% |
| pewne, fort obrony (x1,5) | 100,0% | 0,0% | 0,0% |
| pewne, bez szarzy R1 | 0,0% | 0,0% | 100,0% |
Rozroznienie kierunku: dla identycznych jednostek role „barbarzynca atakuje” i „gracz atakuje” daja to samo wywolanie (zarzut 2).

AUTO (sim, sekcja AUTO; N=200): Wojownik vs Wojownik 0,0% atakujacego (remis M); Wojownik vs Łucznik 100,0% atakujacego (M 27 vs 19); 3v1 i 6v2 AUTO 100%/7,4%-strat.

## KONTROLA ROLI (sim, surowe wyjscie, reczne 1v1, role odwrocone wzgledem tabeli 4)
Łucznik vs Wojownik: losowe 33,0% / pewne 100,0%; Wojownik vs Wojownik: 54,0% / 100,0%; Miecznik galijski vs Wojownik 100% / 100%; Włócznik vs Wojownik 100% / 100%. Wojownik Sherden (atakujacy) vs Włócznik (obronca, negatesCharge, combat.ts:800-803) daje 0% wygranej atakujacego w 'pewne' (szarza zanegowana, rozstrzyga obrona). Pary typu strzelec (Łucznik) rozstrzygane sa faza strzelecka, nie sama szarza (NIE_ZMIERZONO dokladnie).

## ODPOWIEDZ NA PYTANIE WLASCICIELA (wniosek)
1. Barbarzynca NIE ma ukrytego bonusu w resolveCombat: staty z combatUnitFromDef sa identyczne dla obu Wojownikow.
2. Przyczyna wygranej atakujacego w 'pewne': 100% trafien (obrona nie wplywa na trafienie) + szarza R1 atakujacego (combat.ts:1111). Fort nie ma skutku w 'pewne' (zgodnie z opisem trybu: „obrona dziala tylko przez pancerz”, newGameFlow.ts).
3. W 'losowe' (poprzedni tryb, stare zapisy) fort daje ok. 3-4 pp, a atakujacy wygrywa 54%.
4. Zgloszenie „barbarzynca wygrywa takze gdy atakuje gracz” NIE jest produkowane przez resolveCombat (zarzut 2). Trzeba sprawdzic przypisanie atakujacego w bitwie i inicjacje w scenie (NIE_ZMIERZONO).
5. Dodatkowa obserwacja (do decyzji): w scenie szarza przysluguje pierwszemu uderzeniu pary, niezaleznie od ruchu (battleScene.ts:9072-9077, bez warunku ruchu); w resolveCombat szarza R1 tez nie wymaga ruchu (attackerMoved wplywa tylko na negacje przez wlocznie). Czy szarza ma wymagac ruchu: DECISION_REQUIRED.

## OPCJE DLA WLASCICIELA (liczby z probe/sim)
A. Zostawic 'pewne' domyslnie, bez zmiany kodu; dopisac w opisie, ze w 'pewne' atakujacy wygrywa rownorzedny pojedynek (szarza R1) i fort nie dziala. Najmniejsza zmiana, ale gra zostaje z wojownikiem inicjujacym zawsze wygrywajacym.
B. 'pewne' zachowac, ale obrona zmniejsza OBRAZENIA (np. redukcja z Obrony po forcie). Wymaga wzoru i liczb. Rekomendacja Operatora r1 (B) nadal aktualna, dane tego nie zmieniaja.
C. Domyslne 'losowe' dla NOWYCH gier (atakujacy 54%, fort 50,5% — fort slabo widoczny).
D. Zmiana szarzy R1: szarza wymaga ruchu atakujacego (attackerMoved) lub kary dla atakujacego przy stojacej obronie. To zmiana balansu/mechaniki; nie wykonano bez decyzji. Wynik: w 'pewne' bez szarzy remis 100%.
E. AUTO vs reczne (zarzut 6): ujednolicic model AUTO z recznym (faza strzelecka) albo zostawic jako swiadomy uproszczony model. DECISION.

## TESTY
- Probe (scratchpad, poza repo): 68 commitow, wyniki w results.jsonl; uruchomienie bisectu ~2 min (esbuild 0.28.2 w scratchpadzie).
- Odtworzenie tools/barb-warrior-audit-sim.cjs (N=200, na fc0437a91): „RECZNE losowe 54.0% / RECZNE pewne 100.0% / AUTO 0.0%” dla Wojownik vs Wojownik 1v1; Kamien 3v3: 61.5% / 100.0%; Wojownik vs Łucznik 1v1: 71.5% / 0.0% / AUTO 100.0%. Zadnych zmian w repo.
- tsc --noEmit i 5 bramek referencyjnych: NIE_WYKONANO w tej rundzie (brak zmian kodu). Liczby z zarzutu Evaluatora nie sa moje.
- Test regresji i mutacja: NIE_WYKONANO (brak poprawki; zgodnie z dispatchem zamiast poprawki zostaje DECISION_REQUIRED).
- Przy pomiarze 'fort' skrypt probe: losowe fort 101/86/13 (A2084 D2021) vs bez fortu 108/79/13 (A2129 D1971); pewne fort 200/0/0 vs bez fortu 200/0/0.

## BLOKADY
- Scena (_singleBlow, computeInstantResult/„Pomin”, sciezka „atakujacy AI/barbarzynca vs jednostka gracza”): NIE_ZMIERZONO (brak uruchomienia BattleScene). Tylko czytanie kodu.
- Przypisanie atakujacego w bitwie (kto jest „atakujacym” gdy gracz atakuje barbarzyncę i odwrotnie; main.ts): NIE_ZMIERZONO (nie zlokalizowano w tej rundzie w main.ts).
- Ksiega modyfikatorow civ/trudnosc/teren/weteran/generał w scenie: NIE_ZMIERZONO.
- Zapis/ziarno wlasciciela: niedostepne (NIE_ZMIERZONO).
- AUTO vs reczne: obserwacja, bez decyzji.

## RUNDY
2/5 (Obrona HAIKU, odpowiedz na zarzuty Evaluatora r1). Runda 1: 10-operator-claude.md (DECISION_REQUIRED).

## NASTEPNY KROK
Decyzja wlasciciela (pytanie ABC): A/B/C/D/E (powyzej). Najpierw: czy szarza R1 (combat.ts:1111, battleScene.ts:9072-9077) ma byc zamierzona w trybie 'pewne'. Po decyzji: Operator r3 z wybrana opcja. Jesli wlasciciel potwierdzi scenariusz „barbarzynca wygrywa takze gdy atakuje gracz”, potrzebna jest osobna sonda sceny (przypisanie atak/obrona w bitwie).

## UWAGI-DLA-ORKIESTRATORA
- Probe i bisect nie sa w repo (zgodnie z zasada „zacommituj tylko ten plik”): /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/probe/probe.cjs, bisect.sh, commits.txt, results.jsonl. Jesli potrzebna jest powtarzalnosc dla wlasciciela, osobny temat moze wprowadzic probe jako gra/tools/fortified-warrior-vs-barb-sim.cjs (allowlista DODATKU 1 to dopuszcza).
- Zarzut Evaluatora 2 (kierunek) i zarzut 3 (scena) sa nadal otwarte dla decyzji wlasciciela; nie zamykaja sie danymi z resolveCombat.
- Worktree ma node_modules tylko w scratchpadzie (esbuild), nie w repo.

DEPLOY/PUSH: NIE WYKONANO
