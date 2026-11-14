STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: ustalic POMIAREM (prawdziwa scena w Chromium), dlaczego Wojownik barbarzyncow wygrywa z Wojownikiem gracza w obu kierunkach ataku; naprawic defekt albo wystawic DECISION_REQUIRED z liczbami sceny.
ZMIANY/COMMIT: baza 95640bcf9 (origin/main). Dodane WYLACZNIE narzedzia pomiarowe w gra/tools/ (zero zmian w gra/src, gra/data): battle-scene-probe-entry.ts/.html (prawdziwy BattleScene), battle-scene-probe.cjs (macierz, Chromium przez vite), battle-scene-probe-one.cjs (pojedynczy przebieg), auto-power-identical-probe.cjs (sciezka AUTO na mocy M, esbuild). Plus ten raport. SHA w polu sha odpowiedzi.
RUNDY: 3/5 (Operator SONNET, uzasadnienie w DODATKU 5 dispatchu)

## TL;DR (wniosek)
Zgloszenie "barbarzynca wygrywa ZAWSZE, w obu kierunkach, fort nie pomaga" ODTWARZA SIE POMIAREM na prawdziwej scenie, ale NIE przez ukryty bonus barbarzyncy (barbarzynca i gracz sa w scenie symetryczni: ta sama funkcja toCombatUnit, te same statystyki 4/4/22/2, zero bonusow wg wlasciciela). Dwie zmierzone przyczyny:
 (P1) KARA GRACZA: glod wojska / deficyt zlota = x0,75 na Atak, Obrone, Obrazenia, Przebicie, Szarze, HP, pocisk (bez pancerza) -- tylko dla jednostek GRACZA/AI (isArmyHungry: barbarzyncy jawnie wykluczeni, empire-food.ts:353; barbarzyncy nie maja Skarbca). Przy karze gracza barbarzynca wygrywa 82-90% (losowe) i 100% (pewne) w OBU kierunkach, takze przy forcie. To dokladnie opis wlasciciela. Kara jest ZAMIERZONA regula (econ-params.json glod_wojska_stat_mult / zloto_deficyt_stat_mult = 0,75, decyzje PYTANIE-85 i R-DEFICYT-ZLOTA-KARA-Q1=A), ale pre-bitewne okno NIE ostrzega o niej (preBattle.ts bez wzmianki), a stosuje sie takze przy zwyklym ujemnym Skarbcu/Spichlerzu.
 (P2) KOLEJNOSC UDERZEN W SCENIE: w scenie (AUTO sceniczne / "Pomin" po starcie sceny / tryb reczny) pierwsze uderzenie i premie "Szarza" dostaje jednostka, ktora NIE musi pokonac dystansu (bronca albo gracz-trzymajacy), nie "atakujacy". Atakujacy traci pierwsza runde na dojscie (start: 5 heksow odstepu, atk (31,77), def (36,77)). Skutek: w "pewne" wygrywa strona stojaca (100%), w "losowe" obronca wygrywa ok. 62-65%. To nie jest wlasciwosc barbarzyncy -- wlasnosc roli. W kierunku "gracz atakuje barbarzynce" daje to wrazenie "barbarzynca zawsze wygrywa".
Fortyfikacja (+50% Obrony) jest wpieta poprawnie na wszystkich sciezkach (battleScene.ts:9100-9106 _singleBlow, computeInstantResult, main.ts fortifyFieldScaledDefFor) -- w "pewne" nie ma wplywu (trafienie 100%, Obrona nie liczy sie; znane z r1), w "losowe" daje tylko ok. 3 pp w scenie.

## Tabela pomiarow (identyczne Wojowniki 22 HP, teren Rownina, bez weterana/epoki/civ/trudnosci)
Sciezki: POMIN = scene.skip() po starcie sceny (ta sama symulacja tickow co AUTO sceniczne, przewijana; w grze to guzik "Pomin" i AUTO), INSTANT = computeInstantResult (_skipInstantFallback, gdy scena niestartowana), AUTO-M = resolveAutoBattleByPower (guzik "Auto" w oknie przed bitwa), MANUAL = tryb reczny gracza (rozkaz "atak"/"trzymaj"). "bar atk" = barbarzynca atakuje gracza; "gr atk" = gracz atakuje barbarzynce. Procenty = wygrana BARBARZYNCY (reszta = gracz). N: scena losowe 60/komorke (NIE 200: ok. 2,5 s/bitwa w swiftshader, limit 590 s na polecenie), instant 300, AUTO-M 300, pewne i manual = 1-3 (deterministyczne).

A. Bez kar gracza
| sciezka | tryb | fort obroncy | bar atk | gr atk | uwagi |
|---|---|---|---|---|---|
| POMIN (scena) | losowe | nie | 38,3% | 61,7% | obronca strzela pierwszy w 100% bitew (defStrikesFirst=100%) |
| POMIN (scena) | losowe | tak | 35,0% | 65,0% | fort daje ok. 3 pp obroncy |
| POMIN (scena) | pewne | nie/tak | 0% | 100% | obronca (strona stojaca) wygrywa 100%; fort bez efektu; 3/3 powtorzen |
| INSTANT | losowe | nie | 71,0% | 29,0% | resolveCombat: atakujacy 71% (szarza R1) |
| INSTANT | losowe | tak | 66,3% | 33,7% | |
| INSTANT | pewne | nie/tak | 100% | 0% | atakujacy 100%, fort bez efektu |
| AUTO-M | losowe/pewne | nie | remis 100% | | M=27 vs 27 -> "tie", straty po 40% |
| AUTO-M | losowe/pewne | tak | 0% (obronca 100%) | | M obroncy 35,5, ratio 1,31 > progu upsetu 1,15 |
| MANUAL pewne, gracz "atak" | pewne | nie | 0% | 0% (wygrywa gracz) | gracz wygrywa w obu rolach (pierwsze uderzenie w rundzie 2) |
| MANUAL pewne, gracz "trzymaj" | pewne | nie | 100% | 100% | pasywny gracz przegrywa w obu rolach (barbarzynca wchodzi pierwszy) |

B. Z kara gracza (glod wojska x0,75 lub deficyt zlota x0,75), scena POMIN, losowe, N=40
| kara | fort | bar atk | gr atk |
|---|---|---|---|
| glod | nie | 85,0% | 87,5% |
| glod | tak | 82,5% | 90,0% |
| deficyt zlota | nie | 85,0% (=wynik glodu, ta sama stala) | 87,5% |
Z karą, "pewne", POMIN, glod, n=2: barbarzynca 100% w obu kierunkach, fort bez roznicy.

C. Role w scenie (dowod logiem, sondowane `scene._singleBlow`): w POMIN/AUTO runda 1 = "d1 a1 a2 d2 d2 ..." (d = strona broniaca): atakujacy w fazie 1 tylko dochodzi, obronca zadaje pierwszy cios (z Szarza: 5 obr. zamiast 3). Kod: battleScene.ts:5720 (_beginAutoBatchPhase('atk', a) -> faza atakujacych, potem obroncow), szarza przy pierwszym uderzeniu pary: battleScene.ts:9072-9078 (isCharge = firstBlow, NIE zalezy od roli). W trybie recznym kolejnosc: gracz najpierw, potem wrog (battleScene.ts:5688-5700): rozkaz "atak" gracza = gracz wygrywa, "trzymaj" = przegrywa.
Rola atakujacego z mapy w main.ts jest poprawna (atakujacy=strona atk; deployPlayerSide 'def' gdy barbarzynca atakuje: main.ts:35766; 'atk' gdy gracz: 35034, 38501) -- sonda odwraca role, wynik jest identyczny wzgledem STRONY (atk/def), nie wlasciciela. Zadna sciezka nie rozroznia barbarzynca od gracza oprocz flag armyHungry/goldDeficit (runtimeToBattleUnit main.ts:34649-34650) i mnoznika trudnosci (barbarzyncy wykluczeni: qualifiesForMajorAiDifficultyBonus).

## Hipotezy
- H1 ukryty bonus barbarzyncy: ODRZUCONA. Dowod: dla identycznych jednostek wynik zalezy od strony/kolejnosci, nie od wlasciciela; zadnych pol "barbarian" w toCombatUnit/_singleBlow/computeInstantResult poza etykietami UI (attackerIsBarbarian tylko HUD, main.ts:35057). Trudnosc: difficultyCombatMultForOwner main.ts:9903 -> 1 dla barbarzyncow.
- H2 kara gracza: POTWIERDZONA (patrz B). battleScene.ts:1385-1390 (toCombatUnit), army-starvation.ts:35-52, gold-deficit.ts:149. Nie ma w pre-bitwie ostrzezenia.
- H3 asymetria sciezki wywolania: CZESCIOWO POTWIERDZONA -- asymetria jest wzgledem STRONY, nie wlasciciela; dodatkowo INSTANT (atakujacy 71%) i scena (atakujacy 38%) daja ODWROTNE wyniki dla tych samych jednostek (rozjazd sciezek Pomin-bez-sceny vs scena). Sciezka "Pomin" w grze idzie przez scene gdy scena wystartowala (skip(): battleScene.ts:3710), wiec w UI zwykle obowiazuje kolumna POMIN.
- H4 fortyfikacja niewpieta: ODRZUCONA (wpieta; w "pewne" nie dziala z definicji trafienia 100%, w "losowe" ok. 3 pp).
- H5 pierwsze uderzenie: POTWIERDZONA jako glowny czynnik scenowy (P2). Rozmiar: pewne 0/100%, losowe 38/62%.
- H6 regresja: zob. r2 (jedyny skok = ae600d5ed, "pewne" domyslne). Pomiar sceny nie wskazal nowej regresji w kodzie sceny; NIE_ZMIERZONO bisect sceny po starszych commitach (sonda importuje hit-mode.ts, istniejacy dopiero od ae600d5ed).

## Ksiega modyfikatorow (efektywne wartosci -- ZMIERZONE tylko to, co wynika z logow/kodu; reszta NIE_ZMIERZONO)
Oba Wojowniki (units.json "Wojownik"): Atak 4 / Obrona 4 / HP 22 / Pancerz 2, identyczne dla obu stron (r1 + obliczenia sceny: pierwsze uderzenie 5 = 3 + Szarza 2, pozostale 3).
| modyfikator | gracz | barbarzynca |
|---|---|---|
| baza | 4/4/22/2 | 4/4/22/2 |
| weteran | 0 (sonda) -- w grze veteranCombatBonusFrac, ownerId-agnostyczne | 0 (barbarzyncy nie awansuja: NIE_ZMIERZONO w spawn barbarians.ts, ale brak kodu bonusu) |
| epoka | brak w walce (statystyki z units.json) | j.w. |
| civ | civBonusyForOwnerId (gracz) | puste/brak |
| trudnosc | x1 (tylko major AI) | x1 |
| teren | Rownina x1 | x1 |
| fort | +50% Obrony tylko gdy ufortyfikowany i broniacy sie | 0 |
| morale | 50 start, ucieczka przy 22, utrata = dmg/maxHP*100 | identyczne |
| glod / deficyt zlota | x0,75 (gdy zapasy/Skarbiec < 0), wszystkie staty poza pancerzem; oba naraz x0,5625 | NIGDY (isArmyHungry wyklucza barbarzyncow; brak Skarbca) |
| szarza | tylko pierwszy cios pary (kto pierwszy dojdzie), nie rola | j.w. |
| general | NIE_ZMIERZONO (sonda 1v1 bez generala) | brak |
Zapis/ziarno wlasciciela: NIE_ZMIERZONO (niedostepne).

## Odpowiedz na pytanie wlasciciela "barbarzynca wygrywa takze gdy JA atakuje"
Odtwarza sie w dwoch warunkach: (a) gracz ma kare glodu/deficytu zlota (82-90% w obu kierunkach), (b) tryb "pewne" (domyslny dla nowych gier, newGameFlow.ts:272) i gracz atakuje w scenie/AUTO/"Pomin": obronca (barbarzynca) strzela pierwszy z Szarza i wygrywa 100%. Dane do zebrania od wlasciciela: tryb "Trafienia" (losowe/pewne), czy czaszka glodu / deficyt zlota na jednostkach gracza w chwili bitwy (stan Skarbca i Spichlerza), kierunek ataku, tura, jednostki obu stron, sciezka (Auto przed bitwa / Pomin / reczna z rozkazem "atak" czy "trzymaj").

## Opcje decyzji dla orkiestratora/wlasciciela (bez zmian kodu -- decyzje produktowe)
- O1 (kara gracza, P1): A zostawic regule x0,75 i dodac OSTRZEZENIE w oknie przed bitwa ("Twoja armia jest oslabiona: glod/deficyt zlota -25%", z liczbami); B ograniczyc/zmniejszyc kare (np. x0,9) ; C wylaczyc kare w walce z barbarzyncami lub poza wojna z AI; D bez zmian. Rekomendacja: A (tani, uczciwy) + rozwazyc B.
- O2 (kolejnosc/szarza, P2): A bez zmian (kto stoi, strzela pierwszy: opis w UI); B szarza R1 tylko dla atakujacego (jak resolveCombat) -- wyrownuje scena z INSTANT, atakujacy wygrywa wtedy duzo czesciej; C atakujacy zaczyna w zasiegu (bez rundy dojscia). Rekomendacja: wymaga decyzji produktowej, bo odwraca role.
- O3 ("pewne", ae600d5ed): A zostawic i opisac, ze fort/teren nie dzialaja w "pewne"; B w "pewne" obrona zmniejsza obrazenia; C domyslnie "losowe" dla nowych gier; D szarza R1 tylko w "losowe".
- O4 (rozjazd sciezek): INSTANT daje atakujacemu 71%, scena 38% dla tych samych jednostek; ujednolicic (osobna decyzja, tematy #269/#274 jej dotykaly).

## Co NIE zostalo zrobione / uczciwie
- N=60 w scenie dla "losowe" (nie 200): 2,5 s na bitwe, limit 590 s na polecenie. Roznice 38% vs 62% oraz 85-90% sa wielokrotnie poza bledem (SE ok. 6 pp przy N=60).
- AUTO sceniczne w czasie rzeczywistym (scene._toggleManualMode bez skip) nie domyka sie w headless (petla poscigu po rout czeka na rAF) -- NIE_ZMIERZONO realtime; POMIN uzywa tej samej symulacji tickow (239bb988b ujednolicil AUTO/Pomin), wiec jest reprezentatywny.
- Tryb reczny: pewne, 1 przebieg/komorke (deterministyczne); losowe-reczny NIE_ZMIERZONO (okolo 20 s/bitwa, scena po rout nie ustawia finished). Wynik wnioskowany z `routed` (pole inferred).
- Bisect sceny po starszych commitach: NIE_ZMIERZONO.
- Epoka/civ/generał/teren inny niz Rownina: NIE_ZMIERZONO.
- Brak poprawki kodu: zadna zmierzona asymetria nie jest bledem wg obowiazujacych regul (kara glodu/deficytu i szarza pierwszego uderzenia sa zamierzone); zmiana = decyzja produktowa (O1-O4). Brak testu regresji (brak defektu).

TESTY: `node node_modules/typescript/bin/tsc --noEmit` w gra/ -> exit 0. 5 bramek referencyjnych: NIE uruchomione (brak zmian w gra/src ani gra/data; zmieniono tylko narzedzia pomiarowe). Sondy: patrz tabele (surowe wyjscie JSON w konsoli; reprodukcja: `N=60 PAR=3 PATHS=pomin HITS=losowe TMO=30000 node tools/battle-scene-probe.cjs`; kara: dodaj `EXTRA='{"playerHungry":true}'`; AUTO-M: `N=300 node tools/auto-power-identical-probe.cjs`; Chromium: /opt/pw-browsers/chromium-1194 lub CHROMIUM_PATH).
BLOKADY: brak (srodowisko dzialalo; npm ci --ignore-scripts ok).
NASTEPNY KROK: orkiestrator pyta wlasciciela (ABC) O1-O4 z liczbami powyzej; po decyzji -> temat implementacyjny (np. ostrzezenie o oslabieniu w preBattle, korekta szarzy). Evaluator/FC: zweryfikowac tabele przez ponowne uruchomienie sond.
UWAGI-DLA-ORKIESTRATORA: (1) preBattle nie informuje o karze glodu/deficytu zlota -- prawdopodobne zrodlo "supermocy" wroga; (2) w trybie "pewne" i przy karze nowa gra jest w praktyce przegrywalna wobec barbarzyncow; (3) rozjazd INSTANT vs scena (71% vs 38% dla atakujacego) moze zaskakiwac -- Pomin bez startu sceny daje inny wynik niz Pomin po starcie.
DEPLOY/PUSH: NIE WYKONANO
