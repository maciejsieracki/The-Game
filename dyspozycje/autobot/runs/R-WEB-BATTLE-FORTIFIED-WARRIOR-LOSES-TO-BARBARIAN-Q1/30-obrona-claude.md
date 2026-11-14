STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: odpowiedziec na zarzuty Evaluatora do kandydata b200d13d6 (raport 3673a8fe2): PRZYJMUJE lub ODRZUCAM z dowodem. Cel tematu (binarny): ustalic danymi, dlaczego Wojownik barbarzyncow wygrywa z Wojownikiem gracza w obu kierunkach ataku, i naprawic defekt, jesli istnieje. Ta runda NIE ustala przyczyny w scenie (pomiar sceny NIE_ZMIERZONO), wiec nie kończy się DECISION_REQUIRED.
ZMIANY/COMMIT: tylko ten plik raportu (30-obrona-claude.md). Brak zmian w gra/src, gra/data, gra/tools. Baza kodu: b200d13d6 (origin/main poprzedniej rundy). Sam SHA commita raportu: patrz pole sha w odpowiedzi Workflow (git log -1 w worktree wf_adcbca66-983-3).

## Odpowiedzi na zarzuty Evaluatora (3673a8fe2)

Zarzut 1 (brak sondy sceny, brak tabeli % wygranych; „brak node_modules” nietrafiony): PRZYJMUJE w czesci dotyczacej bledu srodowiskowego, ODRZUCAM jako zarzut o braku wyniku sceny z powodu srodowiska.
- Dowod srodowiska (wykonane w tej rundzie, surowe wyjscie): `cd gra && npm ci --ignore-scripts --no-audit --no-fund` -> „added 71 packages in 2s”; `npx tsc --noEmit` -> exit 0 (bez wyjscia bledow). Wniosek r2 „NIE_WYKONANO (brak node_modules)” bylo nieprawdziwe i zostaje wycofane.
- Sonda sceny (_singleBlow, computeInstantResult/„Pomin”, AUTO sceniczne) NIE zostala uruchomiona: BattleScene wymaga DOM/Phaser/WebGL, a probe w Chromium (playwright, /usr/bin/chromium, build `vite --outDir` poza repo) nie zostal podjety w tej rundzie. NIE_ZMIERZONO. Tabela % wygranych sceny nie istnieje, wiec nie jest podawana.

Zarzut 2 (rola atakujacego w (A) barbarzynca->gracz i (B) gracz->barbarzynca czytana, nie zmierzona; main.ts:38501 niezweryfikowane): PRZYJMUJE z ODRZUCENIEM czesci dotyczacej roli w (B).
- (B) gracz atakuje: wejscie `openPlayerMapUnitAttack(atkUnit, def)` (main.ts:34849) wola `openPlayerMapUnitAttackCore` (main.ts:34857), ktore buduje `atkRoster = collectBarbarianAwareBattleRoster(atkUnit, defUnit, 'attacker')` (main.ts:34868, wywolanie z 'attacker'). Wywolania: main.ts:32594 (po ruchu/ataku, `openPlayerMapUnitAttack(atkUnit, def)`) oraz main.ts:34141 (`atkUnit` = jednostka zaznaczona, `isMe(atkUnit.ownerId)`). Scena: `attacker: atkBus` (roster atakujacego = gracz), `deployPlayerSide: 'atk'` (main.ts:35026-35040). Rola atakujacego w (B) = gracz: ODRZUCAM hipoteze odwroconej roli w (B) (dowod: powyzsze linie).
- (A) barbarzynca atakuje: `launchIncomingMapFieldBattle(atkRoster=barbarzynca, defRoster=gracz)` (main.ts:35500); scena `attacker: atkBus` = barbarzynca, `deployPlayerSide: 'def'` (main.ts:35758-35766). Wywolujace: main.ts:45096 (atak barbarzyncow), main.ts:44342 (atak AI), main.ts:29583 (hook testowy). Rola atakujacego w (A) = barbarzynca: zgodna.
- NIE_ZMIERZONO: sciezka „atak na oboz barbarzyncow”, szturm (launchSiegeStormFromMap, main.ts:38308) — `deployPlayerSide` i przypisanie stron w szturmie nie sprawdzone w tej rundzie; main.ts:38501 nie rozstrzygniete. Przypisanie roli przez logi/sonde: NIE_ZMIERZONO.

Zarzut 3 (sciezka pomiaru to resolveCombat, nie scena/Pomin): PRZYJMUJE. Brak pomiaru sceny. Dodatkowo ponizej wynik lektury kodu sceny (plik:linia), ktory jest HIPOTEZA, nie pomiar.
- Kolejnosc tury (battleScene.ts:5688-5700): tryb reczny `order = [...player, ...enemy]` (player = `_playerRoster()` wg `_deployPlayerSideOpt`, linie 12738-12744); tryb auto: przeplot atk/def zaczynajac od atakujacego (`for i ... push a[i], d[i]`).
- Szarza = pierwsze uderzenie PARY w danym kierunku: `key = attacker.bu.id + '>' + defender.bu.id`, `isCharge = firstBlow && !bracesAgainstCharge(defender.bu)` (battleScene.ts:9072-9077). Kontratak obroncy dostaje wpis `def>atk` jako juz zaangazowany (battleScene.ts:9317), wiec nie jest szarza.
- Wniosek HIPOTETYCZNY: w tym modelu wygrywa ten, kto UDERZA PIERWSZY w parze. W trybie recznym pierwszy uderza gracz (lista `player` idzie przed `enemy`) nawet gdy jest obroncą; w trybie auto pierwszy uderza atakujacy. Gdy gracz-obrońca czeka (nie uderza), barbarzynca uderza pierwszy w swojej fazie i dostaje szarze. To moze tlumaczyc zgloszenie „barbarzynca wygrywa, gdy mnie atakuje” w trybie recznym, ale NIE zostalo zmierzone. Nie zmieniono kolejnosci (zakaz bez decyzji wlasciciela).

Zarzut 4 (BLOCK bez blokady technicznej; pkt 4 niespelniony): PRZYJMUJE. BLOCK w tej rundzie NIE wynika z braku node_modules (npm ci dziala w 2 s, tsc 0). BLOCK wynika wylacznie z niezmierzonej sceny (zarzut 3). Zgodnie z dyspozycja nie zamykam tematu DECISION_REQUIRED bez pomiaru sceny.

Zarzut 5 (brak macierzy 3x3 i ksiegi modyfikatorow): PRZYJMUJE w czesci „macierz 3x3” i „ksiega ze sceny”; ODRZUCAM zarzut, ze ksiega z resolveCombat nie ma wartosci.
- Macierz 3x3 gracz/AI/barbarzynca: NIE wykonana jako pomiar sceny. Uwaga: w resolveCombat owner/civ nie sa wejsciem; wejscia zalezne od wlasciciela pochodza ze sceny (attackerCivBonusy, difficulty) — NIE_ZMIERZONO.
- Mnozniki trudnosci (H1, barbarzynca): ODRZUCAM hipoteze ukrytego bonusu trudnosci. Dowod kodu: `difficultyCombatMultForOwner` (main.ts:9903-9906) zwraca 1 dla kazdego ownerId, dla ktorego `qualifiesForMajorAiDifficultyBonus` jest falszem; ta funkcja (ai-difficulty-bonus.ts:17-19) wyklucza `ownerId > 0 && !isBarbarian(ownerId) && !isCityState`, czyli barbarzyncow i gracza (ownerId 0). Barbarzynca dostaje mnoznik 1. Battle-unit (battle-unit-context.ts:9-13) bierze `difficultyCombatMult ?? sideFallback`.
- Ksiega modyfikatorow (scena) — lista elementow, ktore wchodza do _singleBlow (battleScene.ts:9040-9160), BEZ wartosci ze sceny: baza (cuA.meleeAttack / cuD.meleeDefence / armor / weaponDamage / piercing / chargeBonus); civCombatStatMultipliers (civ, teren, szarza R1, own territory, shallow sea); mergeBuildingBonusIntoStatMultipliers (pancerzBonusFrac, parametryBonusFrac per jednostka); defMeleeDef = fieldFortifyDefenseBonus (fort, tylko obrona, przed terenem); defPenaltyFrac (kara z flanki/tylu); terrDefMult, terrRiverMlt, defFordMlt, shoreBonusMlt, wallCivMult; atkOwnerDiffMult/defOwnerDiffMult (battleUnitDifficultyCombatMult, dla barbarzyncy = 1 wg powyzszego); counterMultiplier. Weterani: wchodza przez stats (veteranScaledDefFor, main.ts:34516-34526), nie przez osobny mnoznik sceny. Wartosci liczbowe per strona: NIE_ZMIERZONO.

Zarzut 6 (H7 niezmierzona; AUTO vs reczne): PRZYJMUJE jako obserwacje. H7 potwierdzona lektura (battleScene.ts:5688-5700, patrz zarzut 3), nadal NIE_ZMIERZONO na scenie. Rozbieznosc AUTO vs reczne (Wojownik vs Lucznik: AUTO 100%, reczne losowe 71,5%, reczne pewne 0%) — potwierdzona symulacja w tej rundzie (ponizej), przyczyna modelowa (AUTO = M z unit-power.ts bez kolejnosci uderzen; reczne = rundy z faza strzelecka). Decyzja: DECISION_REQUIRED wlasciciela, nie zmieniano.

## NOWE ODKRYCIE LEKTURY (nie bylo w zarzutach): fort liczy sie w M ataku AUTO po obu stronach
- `combatPowerScaledDefFor(u)` (main.ts:9923-9925) wola `fortifyFieldScaledDefFor(u)` (main.ts:34534-34542), ktore dolicza +50% Obrony, gdy `unitGetsFortifyBonus(u)`. Ta funkcja uzywana jest ZARÓWNO w `rosterFieldPowerM(atkRoster)` (main.ts:35239-35242) jak i w `effectiveDefenderM` (main.ts:35256+). Skutek: w AUTO fort atakujacego (jednostka ufortyfikowana w polu, ktora atakuje) zawyza M ataku.
- W scenie fort dotyczy WYLACZNIE obroncy (battleScene.ts:9107-9111 `defMeleeDef`; 20818-20822 computeInstantResult). To rozjazd AUTO vs scena, ale NIE dotyczy barbarzyncy (barbarzyncy nie fortyfikuja) i nie wyjasnia zgloszenia. Status: obserwacja, NIE naprawiono (plik main.ts poza zakresem tej poprawki; dotyka sciezki fortyfikacji i wymaga decyzji, czy fort atakujacego ma wplywac na M).

## Stan flagi fortyfikacji (H4, czytanie kodu)
- Wejscie w fort: `enterFieldFortify(u)` (game/armyMerge.ts:302-318) ustawia `ufortyfikowanyWPolu = true` NATYCHMIAST i `ruchLeft = 0` (wywolania main.ts:26871, 26910). Brak opoznienia do kolejnej tury.
- Przekazanie do bitwy: `runtimeToBattleUnit` (main.ts:34648) `fortifiedInField: unitGetsFortifyBonus(u)`, a `unitGetsFortifyBonus` (main.ts:34368) czyta `ufortyfikowanyWPolu` lub garnizon bez muru. Wyjscie z fortu przy rozkazie ruchu: `exitFieldFortify` (armyMerge.ts:327).
- Wniosek: flaga jest przekazywana i ustawiana od razu; H4 w kodzie ODRZUCONA jako „niewpieta”. Pomiar efektu w scenie: NIE_ZMIERZONO.

## Wyniki symulacji (odtworzenie tools/barb-warrior-audit-sim.cjs na b200d13d6, surowe wiersze)
Wojownik vs Wojownik (1v1, losowe / pewne): Kontrola roli „Wojownik vs Wojownik | 54.0% | 100.0%”.
Wojownik vs Lucznik, Kamien/Brąz 1v1: „71.5% (44.8%) | 0.0% (n/d%) | 100.0% (27.6%)” (kolumny: RECZNE losowe | RECZNE pewne | AUTO).
Wojownik vs Lucznik 3v3: „50.5% (60.9%) | 0.0% | 100.0% (27.6%)”.
Kontrola roli: „Lucznik vs Wojownik | 33.0% | 100.0%”; „Wojownik z mieczem i tarczą vs Wojownik | 100.0% | 100.0%”.
Sim mierzy resolveCombat (RECZNE) i model AUTO (auto-battle-power), NIE scene.
Uwaga: wiersze „0.0% (n/d%)” dla Wojownik vs Wojownik w AUTO oznaczaja remis M (symetryczne straty), nie przegrana.

## Wniosek dla wlasciciela (stan na te runde)
1. Barbarzynca nie ma ukrytego bonusu w resolveCombat ani w mnozniku trudnosci (kod: main.ts:9903-9906, ai-difficulty-bonus.ts:17-19).
2. Rola atakujacego jest poprawna w obu kierunkach (main.ts:34857, 32594, 34141, 35026, 35766).
3. Hipoteza do zmierzenia (NIE_ZMIERZONO): w trybie recznym kolejnosc uderzen daje pierwsze uderzenie (szarze) temu, kto pierwszy uderza, a gracz-obronca, ktory czeka, oddaje inicjatywe barbarzyncy (battleScene.ts:5688-5700, 9072-9077). To jest zamierzony mechanizm szarzy, wiec przed zmiana wymaga decyzji wlasciciela.
4. Zgloszenie „barbarzynca wygrywa takze gdy gracz atakuje” nie zostalo odtworzone; w (B) atakujacy to gracz, a w resolveCombat atakujacy w „pewne” wygrywa 100%, czyli gracz powinien wygrywac. Przyczyne trzeba zmierzyc na scenie (zapis gry/ziarno wlasciciela i tryb „Trafienia”, kierunek, tura, jednostki).

## OPCJE DLA WLASCICIELA (bez zmiany kodu)
A. Zostawic szarze jako pierwsze uderzenie pary i opisac w Civpedii, ze w trybie recznym inicjatywe oddaje gracz, ktory czeka.
B. Zmienic kolejnosc tury recznej na przeplot atk/def (jak AUTO) — wymaga decyzji, bo zmienia kolejnosc uderzen.
C. Szarza tylko przy ruchu atakujacego (attackerMoved) — zmiana mechaniki.
D. Fort atakujacego nie wplywa na M w AUTO (combatPowerScaledDefFor tylko dla obrony) — drobna poprawka spojnosci AUTO vs scena, wymaga zgody.

## TESTY
- npm ci --ignore-scripts (gra/): added 71 packages in 2s.
- npx tsc --noEmit (gra/): exit 0.
- tools/barb-warrior-audit-sim.cjs: wyniki jak w sekcji powyzej (surowe wiersze cytowane).
- Bramki referencyjne (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6): NIE uruchamiane w tej rundzie — brak zmian kodu; liczby z zarzutu Evaluatora nie sa moje.
- Test regresji i dowod mutacyjny: NIE_WYKONANO (brak poprawki).

## BLOKADY
- Sonda sceny (_singleBlow, computeInstantResult/„Pomin”, AUTO sceniczne, oba kierunki, tryby losowe/pewne, fort on/off): NIE_ZMIERZONO. Potrzebny probe w Chromium (production build przez `vite --outDir` poza repo, skrypt w stylu tools/battle-manual-melee-live-test.cjs).
- Szturm (launchSiegeStormFromMap main.ts:38308) i atak na oboz barbarzyncow: przypisanie stron NIE_ZMIERZONO.
- Zapis gry / ziarno wlasciciela: niedostepne.

## UWAGI-DLA-ORKIESTRATORA
- Rozwaz nastepna runde z jawnym zadaniem: probe sceny w przegladarce (kolejnosc tury reczna, szarza, fort) zanim podejmie sie decyzje o H7.
- Obserwacja poza zakresem: combatPowerScaledDefFor (main.ts:9923) dolicza fort tez atakujacemu w AUTO (patrz wyzej).
- Nie tworzono zadnych sesji ani zadan (zakaz spawn_task/create_session).

RUNDY: 3/5 (runda obrony wobec kandydata b200d13d6 z zarzutami Evaluatora 3673a8fe2).
NASTEPNY KROK: runda 4 (Operator): probe sceny w Chromium — pomiar kolejnosci tury recznej, szarzy i fortu w _singleBlow; po pomiarze DECISION_REQUIRED z tabela albo naprawa defektu z testem.
DEPLOY/PUSH: NIE WYKONANO
