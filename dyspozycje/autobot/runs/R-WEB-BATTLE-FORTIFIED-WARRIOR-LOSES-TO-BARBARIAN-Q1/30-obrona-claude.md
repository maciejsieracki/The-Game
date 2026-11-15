STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: odpowiedzieć na 6 zarzutów Evaluatora (kandydat e0a62bf7f) dowodem albo jawnym NIE_ZMIERZONO; ustalić, czy da się odtworzyć „barbarzyńca wygrywa także gdy gracz atakuje” w prawdziwej scenie walki.
BAZA: e0a62bf7f9dae3b7b8c29730aec6fdb7b349b305 (kandydat Operatora r3). Srodowisko: gra/ (npm ci --ignore-scripts), tsc --noEmit exit 0.
ZMIANY-COMMIT: gra/tools/battle-scene-probe.cjs (zmienna SEED0 = offset ziaren, bez zmiany logiki walki) oraz ten raport. Brak zmian w kodzie gry (src/), patrz NAPRAWA.
TESTY: tsc --noEmit exit 0. Sonda sceny (battle-scene-probe.cjs, Chromium, prawdziwa BattleScene, Wojownik vs Wojownik, teren Rownina, deployPlayerSide odwracany per kierunek). Tabela A: 200 powtorzen na komorke (losowe, pomin = skip(), ziarna 1000-1199), 800 przebiegow, wszystkie rozstrzygniete (inferred=0, undecided=0). Tabela B: pewne, N=2 na komorke (deterministyczne), sciezki pomin i instant. Surowe JSON w scratchpadzie: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p-f0-s1000.json, p-f1-s1000.json, p-f0-s1100.json, p-f1-s1100.json, p-pewne.json
BLOKADY: bisect sceny NIE wykonany (NIE_ZMIERZONO); efektywne statystyki (ksiega modyfikatorow) z silnika NIE wydrukowane (NIE_ZMIERZONO); wariant kary glodu/deficytu (82-90%) NIE powtorzony w tej rundzie; ktora sciezka „Pomin” jest uzywana w grze (skip vs instant) NIE zweryfikowane w grze wlasciciela.
RUNDY: 3/5 (obrona po Operatorze r3, Sonnet).
NASTEPNY KROK: orkiestrator decyduje o: (a) bisecie sceny wstecz od c3ebc5440, (b) rozstrzygnieciu rozbieznosci scena pomin vs instant w trybie pewne (tabela B), (c) decyzjach produktowych: tryb pewne, kolejnosc pierwszego ciosu, fort (sekcja OPCJE). Bez zmiany kodu gry w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

Zarzut 1 (ksiega modyfikatorow nie zmierzona): PRZYJMUJE, bez naprawy. Nie dodalem drukowania efektywnych Atak/Obrona/HP/Pancerz z combatUnitFromDef ani dodatkow sceny. NIE_ZMIERZONO: weteran, epoka, civ, general, teren inny niz Rownina, morale, trudnosc. Dla sondy obowiazuje stan z kodu sondy: cywilizacje puste, brak weterana, teren Rownina, bez kar; jedynym dodatkiem jest fort (+50% Obrony, fieldFortifyDefenseBonus) przy fortDef=1. Tabela „ksiegi” z 10-operator-claude.md jest wnioskiem z kodu, nie pomiarem.

Zarzut 2 (N=60 zamiast >=200): PRZYJMUJE i NAPRAWIAM POMIAREM: 200 powtorzen na kazda komorke dla losowe/pomin (2 kierunki x fort 0/1), tabela A. Wczesniejszy efekt fortu „ok. 3 pp” wycofuje jako nieistotny statystycznie (roznica 3 pp, blad standardowy roznicy ok. 5 pp).

Zarzut 3 (brak bisectu sceny): PRZYJMUJE jako NIE_ZMIERZONO. Nie wykonalem bisectu sceny. Mini-bisect Evaluatora (obrona pierwsza na c3ebc5440^) jest zgodny z moimi pomiarami: kolejnosc pierwszego ciosu obroncy istnieje w obecnym kodzie. Pierwszy commit, w ktorym scena zaczyna tak dzialac, pozostaje nieustalony.

Zarzut 4 (rola atakujacego z mapy): PRZYJMUJE jako NIE_ZMIERZONO. Sonda odwraca role przez deployPlayerSide i nie testuje main.ts. Przypisania rol w main.ts (cytowane w DODATKU 5) nie odtworzylem w grze.

Zarzut 5 (TL;DR jako przyczyna; wariant kary 82-90%): PRZYJMUJE. TL;DR w 10-operator-claude.md opisuje dwa odtworzone mechanizmy, nie potwierdzona przyczyne w grze wlasciciela. Wariant kary (glod/deficyt) nie byl powtorzony w tej rundzie: NIE_ZMIERZONO.

Zarzut 6 (rozjazd INSTANT vs scena vs AUTO-M): PRZYJMUJE. Rozjazd zmierzony (tabela B), ale nierozstrzygniety jako defekt. Patrz sekcja OPCJE.

## Wyniki pomiarow

### Tabela A: scena, losowe, pomin (skip), 200 powtorzen na komorke, Wojownik vs Wojownik, Rownina

„barb atakuje” = barbarzynca ma strone atak (gracz broni); „gracz atakuje” = gracz ma strone atak.

| kierunek | fort obroncy | N | % wygranych atakujacego | % wygranych barbarzyncy | % wygranych gracza | sr. strata atakujacego (%HP) | sr. strata obroncy (%HP) | sr. ciosy atak / obrona |
|---|---|---|---|---|---|---|---|---|
| barb atakuje | OFF | 200 | 40,0 | 40,0 | 60,0 | 31,4 | 28,3 | 5,43 / 5,42 |
| barb atakuje | ON | 200 | 37,0 | 37,0 | 63,0 | 32,4 | 27,1 | 5,54 / 5,60 |
| gracz atakuje | OFF | 200 | 40,0 | 60,0 | 40,0 | 31,4 | 28,3 | 5,43 / 5,42 |
| gracz atakuje | ON | 200 | 37,0 | 63,0 | 37,0 | 32,4 | 27,1 | 5,54 / 5,60 |

Dla kazdej komorki pierwszy cios rundy 1 zadaje obronca w 100% przebiegow (defStrikesFirstPct=100; sampleSeq „d1 a1 a2 d2 d2 ...”).

Wniosek z tabeli A: wyniki sa symetryczne wzgledem rol. Przy tych samych ziarnach zamiana kierunku nie zmienia przebiegu, tylko strone zaczynajaca. Roznica 60/40 w losowe wynika wylacznie z tego, ze obronca uderza pierwszy w rundzie 1. Efekt fortu (40 -> 37%) miesci sie w szumie.

### Tabela B: scena i instant, pewne, N=2 (deterministyczne)

| sciezka | kierunek | fort | wygrywa atakujacy | wygrywa obronca |
|---|---|---|---|---|
| pomin (skip, scena) | barb atakuje | OFF/ON | 0% | 100% (gracz) |
| pomin (skip, scena) | gracz atakuje | OFF/ON | 0% | 100% (barbarzynca) |
| instant (computeInstantResult) | barb atakuje | OFF/ON | 100% | 0% |
| instant (computeInstantResult) | gracz atakuje | OFF/ON | 100% | 0% |

Rozbieznosc: w trybie pewne scena pomin daje wynik odwrotny do computeInstantResult (obronca 100% vs atakujacy 100%). Zarzut 6 zmierzony. Ktora sciezka jest uzywana po nacisnieciu „Pomin” w grze (skip() przy started=true vs _skipInstantFallback przy started=false): NIE_ZMIERZONO w UI.

### Tabela C: efekt fortu w scenie (losowe, pomin)

Fort +50% Obrony zmienia baze Obrony 4 na 6 (fieldFortifyDefenseBonus, battleScene.ts:9107-9111). Trafienie liczy hitChanceTw (combat.ts:441-448): clamp(hit_base + atak - obrona + bonus). Przy Obronie 4 fort przesuwa szanse trafienia o okolo -2 pkt. Zmierzony efekt calkowity: -3 pkt procentowe wygranych atakujacego (40 -> 37), niewiarygodny statystycznie. To nie jest blad kodu, tylko skutek wzoru (fort = +2 pkt Obrony przy bazie 4).

## Wniosek

1. Zgloszenie „barbarzynca wygrywa takze gdy gracz atakuje” w scenie: CZESCIOWO ODTWORZONE. W losowe, pomin, gracz atakuje: barbarzynca (obronca) wygrywa 60% (N=200). W pewne: obronca wygrywa 100% w obu kierunkach. Nie ma 100% dla barbarzyncy w losowe, wiec zgloszenie „zawsze” nie jest odtworzone w tej formie.
2. Mechanizm zmierzony: pierwszy cios rundy 1 zadaje obronca w 100% przebiegow sceny, niezaleznie od kierunku. Przyczyna w kodzie NIE_ZMIERZONO: kolejnosc tury w battleScene.ts:5688-5700 przeplata atak jako pierwszy, wiec pierwszy cios zalezy od ruchu/zasiegu w rundzie 1, co nie zostalo przesledzone.
3. Fort ma w scenie efekt pomijalny (-3 pkt, niezaleznie od kierunku). Fort nie jest przyczyna ani brakujacym przekazaniem flagi: sonda przekazuje fortifiedInField, a _singleBlow czyta je z defender.bu (battleScene.ts:9110).
4. Odpowiedz na pytanie wlasciciela: nie da sie wykazac, ze „barbarzynca zawsze wygrywa”. Da sie wykazac, ze obronca wygrywa czesciej (60/40 losowe; 100/0 pewne w scenie) oraz ze scena i computeInstantResult w trybie pewne daja przeciwny wynik.

## NAPRAWA

Brak zmiany w kodzie gry. Zmierzony defekt (rozbieznosc scena pomin vs instant w trybie pewne) nie ma jednoznacznej poprawki bez decyzji wlasciciela: ktory wynik jest zamierzony. Test regresji czerwony na bazie i dowod mutacyjny nie dotycza tej rundy, bo kodu gry nie zmieniono.

## OPCJE do decyzji wlasciciela (z liczbami)

- O1: zostawic kolejnosc „pierwszy cios obroncy” w scenie; opisac w Civpedii (losowe 60/40 na korzysc obroncy; pewne 100/0).
- O2: ustawic pierwszy cios atakujacego w scenie (zgodnie z przeplotem tury); wymaga przeprojektowania ruchu, nie rekomenduje bez bisectu.
- O3: wyrownac scene pewne z computeInstantResult (jeden z dwoch wynikow musi zostac uznany za bledny); decyzja, nie naprawa techniczna.
- O4: fort w trybie pewne nie ma wplywu na wynik (100/0 niezaleznie od fortu); decyzja o wzorze fortu (+50% przy Obronie 4 = +2 pkt).
