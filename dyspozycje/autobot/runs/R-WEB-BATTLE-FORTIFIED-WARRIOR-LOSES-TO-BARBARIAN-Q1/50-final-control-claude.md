STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: ustalic POMIAREM (prawdziwa scena), dlaczego Wojownik barbarzyncow wygrywa z Wojownikiem gracza; naprawic defekt albo przekazac zmierzone liczby jako decyzje produktowe.
ZMIANY/COMMIT: kandydat 1fddf9898 (potomek bazy 95640bcf9: `git merge-base --is-ancestor` = tak). Diff vs baza: wylacznie gra/tools/{battle-scene-probe-entry.ts,.html, battle-scene-probe.cjs, battle-scene-probe-one.cjs, auto-power-identical-probe.cjs} + raporty 10/30 w runs/<ID>/. Zero zmian w gra/src i gra/data (allowlista: *battle*probe* i nowe sondy -- zgodne). Do integracji: SHA tego raportu (zawiera kandydata).
TESTY (wlasne, surowe wyjscie): `tsc --noEmit` w gra/ na kandydacie -> exit 0. `git diff --check` baza..kandydat: czysty. 5 bramek referencyjnych: NIE uruchamiane -- brak zmian w gra/src i gra/data, wiec wynik bramek identyczny jak dla bazy (uzasadnienie, nie pomiar).
Niezalezny pomiar sceny (Chromium, prawdziwa BattleScene, `battle-scene-probe.cjs`, POMIN, losowe, N=24, ziarno 5000, Wojownik vs Wojownik, Rownina):
 - barb atakuje: atakujacy 41,7% (fort OFF) / 37,5% (fort ON); defStrikesFirst 100%; sampleSeq "d1 a1 a2 d2 d2".
 - gracz atakuje: atakujacy 41,7% / 37,5% -> ten sam wynik wzgledem STRONY, niezaleznie od wlasciciela (barb wygrywa 58,3-62,5% jako obronca, gracz 58,3-62,5% jako obronca).
 Potwierdza P2 (przewaga strony stojacej, nie barbarzyncy).
Niezalezny pomiar z kara gracza (EXTRA playerHungry, N=16, ziarno 7000): barb atakuje 81,3% / 81,3% (fort ON); gracz atakuje barb 81,3% / 87,5% -> odtwarza opis wlasciciela "barbarzynca wygrywa w obu kierunkach, fort nie pomaga" (P1: glod/deficyt x0,75, battleScene toCombatUnit; flagi runtimeToBattleUnit main.ts:34649-34650, barbarzyncy nie podlegaja). Zgodne z N=40 Operatora (82-90%).
Weryfikacja kodu: runtimeToBattleUnit (main.ts:34620-34651) ownerId-agnostyczny (weteran, pancerz/parametry, fort); jedyne rozroznienie wlasciciela = armyHungry/goldDeficit. Brak pol bonusu barbarzyncy w barbarians.ts. H1 odrzucona potwierdzona.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
 1 (ksiega modyfikatorow nie z pomiaru) -> ODDAL. Efektywne staty nie sa wydrukowane przez sonde, ale zrodlo (runtimeToBattleUnit/toCombatUnit) jest agnostyczne wzgledem wlasciciela, a pomiar wyniku (N=200/komorke) pokazuje symetrie wzgledem strony i zero wlasciciela. Wartosc decyzyjna dodatkowej ksiegi = zerowa wobec opcji O1-O4. Pozostaje NIE_ZMIERZONO (weteran/epoka/civ/general/teren inny niz Rownina) -- wpisane.
 2 (N<200) -> ODDAL. Obrona wykonala N=200/komorke (800 przebiegow); moj N=24/16 zgadza sie jakosciowo. Efekt fortu ok. 3 pp nie wolno cytowac jako istotnego (SE ok. 5 pp) -- Obrona to przyjela.
 3 (brak bisectu sceny) -> ODDAL z adnotacja. Mini-bisect Evaluatora pokazuje, ze kolejnosc "obronca pierwszy" i wynik "pewne" istnieja przed c3ebc5440, wiec nie jest to regresja z okna 2026-11-10+; jedyny skok = ae600d5ed (r1, zaakceptowany). Dalszy bisect nie zmienia opcji decyzyjnych (kolejnosc/szarza = decyzja produktowa wg dispatchu "NIE zmieniaj kolejnosci bez decyzji"). Zostaje otwarte jako NIE_ZMIERZONO.
 4 (rola z mapy tylko z lektury) -> ODDAL. Sonda odwraca role przez deployPlayerSide i wynik zalezy od strony atk/def, nie od wlasciciela; kod main.ts:35034/35766/38501 zgodny. Brak dowodu z gry wlasciciela = NIE_ZMIERZONO (brak zapisu/ziarna).
 5 (TL;DR jak przyczyna) -> ODDAL. Rozstrzygniete redakcyjnie: to dwa ODTWORZONE mechanizmy (P1, P2), nie potwierdzona przyczyna w grze wlasciciela; obie strony sie na to zgadzaja. Wariant kary niezalezne powtorzylem (patrz wyzej) -- potwierdzony.
 6 (rozjazd INSTANT 71% vs scena 38%) -> DO DECYZJI CZLOWIEKA (realna decyzja produktowa: ktora regula szarzy/kolejnosci obowiazuje; combat.ts:1111 vs battleScene.ts:9072-9078). Opcja O4 w raporcie Operatora.
Zaden zarzut nie wymaga NAPRAWY kodu: zmierzone asymetrie wynikaja z zamierzonych regul (kara glodu/deficytu x0,75 -- econ-params.json, decyzje PYTANIE-85 i R-DEFICYT-ZLOTA-KARA-Q1=A; pierwsze uderzenie/szarza w scenie; tryb "pewne" domyslny od ae600d5ed), a dispatch zabrania zmiany ich bez decyzji wlasciciela.

WNIOSEK (liczby do ABC wlasciciela):
 - P1 kara gracza (glod wojska / deficyt zlota x0,75 na staty): barb 82-90% w OBU kierunkach (losowe), 100% (pewne). To jest najbardziej prawdopodobne zrodlo "supermocy". Pre-bitewne okno nie ostrzega. Rekomendacja Operatora O1=A (ostrzezenie + zostawic regule), rozwazyc zlagodzenie.
 - P2 scena: strona stojaca (obronca) uderza pierwsza z Szarza: losowe obronca ok. 60-65%, pewne 100%; INSTANT daje atakujacemu 71% (rozjazd, O4). Fort bez efektu w "pewne" (O3), ok. 3 pp w "losowe".
 - Brak ukrytego bonusu barbarzyncy (H1 odrzucona), fort wpiety poprawnie (H4 odrzucona).
 - Dane do zebrania od wlasciciela: tryb "Trafienia", czy czaszka glodu/deficyt zlota w chwili bitwy, kierunek, tura, jednostki, sciezka (Auto/Pomin/reczna: "atak" vs "trzymaj").
BLOKADY: brak. NIE_ZMIERZONO: bisect sceny wstecz, efektywne staty z silnika, weteran/epoka/civ/general/teren, zapis wlasciciela.
RUNDY: 3/5 (Operator Sonnet r3, Obrona Haiku, FC Sonnet).
NASTEPNY KROK: orkiestrator integruje narzedzia sondy (bez zmian gry), pyta wlasciciela ABC o O1-O4 z liczbami; po decyzji temat implementacyjny (ostrzezenie o oslabieniu w preBattle / korekta szarzy / domyslne "losowe").
UWAGI-DLA-ORKIESTRATORA: (1) Przed integracja zweryfikuj `git merge-base --is-ancestor 95640bcf9 <SHA>`; origin/main poszedl dalej (d85bc6f41), merge-tree czysty powinien byc, bo zmiany tylko w gra/tools/ i runs/<ID>/. (2) Sonda scena: ok. 2,5 s/bitwa w swiftshader. (3) Node_modules w tym worktree zainstalowane do pomiaru; do sprzatniecia z worktree.
DEPLOY/PUSH: NIE WYKONANO
