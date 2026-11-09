STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-RANGED-DAMAGE-VS-ARMOR-AUDIT-Q1
GOAL: audyt, dlaczego strzelcy zadają bardzo małe straty jednostkom Brązu/Żelaza, czy to zamierzone i co można zmienić (choćby tylko dla Procarzy); bez zmian kodu i danych gry.
ZMIANY/COMMIT: tylko allowlista runs/R-WEB-BATTLE-RANGED-DAMAGE-VS-ARMOR-AUDIT-Q1/: 01-operator-r1.md, tabela-obrazen-dystansowych.csv, opcje-korekty.csv, porownanie-wrecz.csv. Zero zmian w gra/, WERSJE.md, gra-robocza/. SHA: patrz linia "SHA commitu" na końcu (commit tworzony po zapisie raportu).
TESTY: nie uruchamiano testów gry (analiza bez zmian kodu). Liczby pochodzą ze skryptu Pythona odtwarzającego dokładnie wzory z combat.ts/battleScene.ts na gra/data/units.json i counters.json (baza: FALA 574, 264aebdf7). NIE_ZMIERZONO: brak symulacji pełnej bitwy w przeglądarce; wartości oczekiwane liczone analitycznie (bez losowości, bez terenu, bez flanki, bez bonusów cywilizacji/Kuźni/weteranów).
BLOKADY: brak. Uwaga: baza worktree = origin/main = 264aebdf7 (FALA 574); dispatch mówi "FALA 575+", ale kod walki nie różni się od tego, co opisano (FALA 575 to STADNINA/ALLIANCE).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje wzory i liczby; potem orkiestrator zadaje właścicielowi pytania ABC (sekcja 6).
DEPLOY/PUSH: NIE WYKONANO

# 1. Wzór obrażeń pocisku (krok po kroku)

Ścieżka: `BattleScene._doRangedAttack` (battleScene.ts:9069) -> po locie pocisku `_singleBlow(attacker, defender, ranged=true)` (battleScene.ts:8714). Auto-walka (bez animacji) używa tych samych funkcji z combat.ts (`resolveCombat`, faza dystansowa, combat.ts:~990-1030).

Jeden strzał = jeden cios. "Ilość pocisków" w units.json to POJEMNOŚĆ AMUNICJI (każdy strzał odejmuje 1, `ammoLeft`, battleScene.ts:9080), a NIE liczba pocisków w salwie. Jednostka (oddział, np. Procarz HP 16) oddaje 1 strzał na aktywację. Po wyczerpaniu amunicji walczy wręcz (Atak wręcz 1 -> praktycznie bezużyteczna).

Kroki:
1. Statystyki z `toCombatUnit` (units.json + weteran + głód armii + deficyt złota; battleScene.ts:1338). Atak dystansowy = `missileAttack`, Pancerz celu = `armor`.
2. Mnożniki: `atkMissile = missileAttack * (1 + rangedAtk cywilizacji) * mnożnik trudności`; `defArmor = armor * (1 + pancerz)` gdzie pancerz zawiera bonus cywilizacji i Kuźnię (Ścieżka A: +15% Kuźnia brązu, kumulowane z Kuźnią żelaza/Wielką Kuźnią do +45%; battleScene.ts:8847-8848). Pancerz więc tylko ROŚNIE z rozwojem celu.
3. SZANSA TRAFIENIA (battleScene.ts:8854): `hit% = clamp(40 + meleeAttack_strzelca - meleeDefence_celu*(1-kara flanki)*teren*..., 15, 75)`. UWAGA: dla strzału używane są statystyki WRĘCZ strzelca (`atkMelee`), nie Atak dystansowy. Procarz ma meleeAttack = 1, więc trafia ok. 31-37% (cel z Obroną 8-10). To samo w auto-walce (combat.ts:~1008, `atkEffMelee`).
4. Rzut: `roll >= hit%` -> "chybia", 0 obrażeń.
5. OBRAŻENIA (battleScene.ts:8863, combat.ts:468): `rawDmg = max(1, missileAttack - armor)`. Pancerz jest odejmowany STAŁĄ (nie mnożnik, nie procent), z podłogą 1. Nie są używane `weaponDamage` ani `piercing` strzelca (Przebicie/Obrażenia nie mają znaczenia dla pocisku).
6. Kontra: `dmg = max(1, round(rawDmg * counterMultiplier))` (battleScene.ts:8886). W counters.json dla strzelców istnieją tylko: Slinger -> Spearman +50%, Distance -> Spearman +15% (oraz odwrotnie: Mount -> Distance/Slinger +50%, Offensive -> Distance/Slinger +15%). Klucz "Bonus vs Slinger/Distance %" z units.json jest martwy (migracja R-KONTRY-BITWA-MIGRACJA-Q1 przeniosła wszystko do counters.json).
7. Flanka/tył NIE zwiększają obrażeń pocisku; obniżają tylko Obronę celu (więc podnoszą szansę trafienia). Morale: tylko `-dmg/maxHp` + ewentualne -flat za flankę/tył.
8. Brak minimalnego odsetka obrażeń poza podłogą 1; brak progu "Przebicie < Pancerz".

Wniosek strukturalny: dla pocisku obowiązuje `max(1, M - A)`. Ataki wręcz mają `max(0, weaponDamage - A) + piercing` (+ szarża), czyli "podłogę" równą Przebiciu (1-4) i brak zależności od celu przy pancerzu >= weaponDamage. Pocisk nie ma żadnego odpowiednika Przebicia.

# 2. Tabela liczbowa (pełna: tabela-obrazen-dystansowych.csv)

Założenia: front, równina, bez bonusów cywilizacji/Kuźni/weterana, hit = 40 + meleeAtk strzelca - meleeDef celu (15..75). E = oczekiwane obrażenia na strzał = hit% * dmg. "Cała amunicja" = ammo * E, w % HP celu (przy 100% celności ammo i pełnej serii strzałów w jeden cel).

Procarz (missile 4, melee 1, ammo 15):
| Cel | Pancerz | Obrona | HP | hit% | dmg/traf | E/strzał | % HP z całej amunicji |
|---|---|---|---|---|---|---|---|
| Wojownik (Kamień) | 2 | 4 | 22 | 37 | 2 | 0,74 | 50,5 |
| Woj. miecz+tarcza (Brąz) | 4 | 5 | 28 | 36 | 1 (min) | 0,36 | 19,3 |
| Włócznik (Brąz) | 6 | 8 | 32 | 33 | 2 (1 x 1,5 Slinger->Spearman) | 0,66 | 30,9 |
| Falanga (Żelazo) | 8 | 10 | 40 | 31 | 1 (min) | 0,31 | 11,6 |
| Hastati (Żelazo) | 9 | 7 | 38 | 34 | 1 (min) | 0,34 | 13,4 |
| Hieros Lochos | 6 | 10 | 42 | 31 | 1 (min) | 0,31 | 11,1 |
| Konnica (Brąz) | 8 | 10 | 56 | 31 | 1 (min) | 0,31 | 8,3 |
| Rydwan konny (Brąz) | 6 | 8 | 112 | 33 | 1 (min) | 0,33 | 4,4 |

Współczynnik redukcji przez pancerz (dmg / dmg bez pancerza): Procarz 0,5 vs Wojownik; 0,25 (spadek do podłogi) vs wszystkie cele z Pancerzem >= 3 poza Włócznikiem (podłoga x1,5 z kontry). Podłoga 1 jest osiągana dla Procarza, gdy Pancerz >= 3 (4 - 3 = 1).

Łucznik (missile 3, melee 2, ammo 12): dmg = 1 (podłoga) vs KAŻDY cel z Pancerzem >= 2 (czyli praktycznie cała lista), E/strzał 0,32-0,38, cała amunicja = 3,6-20,7% HP celu. Łucznik egipski/akadyjski/asyryjski/sumeryjski: missile 4-6, melee 1-3 -> dmg 1 vs Pancerz >= 3-5; egipski (missile 6) tylko vs Wojownik (Pancerz 2) zadaje 4.
Łucznik nubijski (missile 6/7*, ammo 16): vs Wojownik 4, vs miecz+tarcza 2, vs wszystko od Pancerza 5 w górę: 1. Cała amunicja = 107% HP Wojownika, ale 4,7-16,5% HP Brązu/Żelaza z Pancerzem >= 6. (*kolumna "Atak dystansowy" 7, silnik czyta missileAttack = 6.)
Oszczepnik (missile 4, ammo 6, Typ Distance, kontra +15% vs Spearman): dmg 1 vs Pancerz >= 3, ammo 6 -> cała amunicja to 3-13% HP.
Konnica łucznicza asyryjska (missile 12, ammo 20): dmg 10 vs Wojownik, 6 vs Włócznik, 4 vs Falangę/Konnicę, 3 vs Hastati; E/strzał 1,2-4,4 -> cała amunicja zdejmuje 43-400% HP celu. Jedyny strzelec dla którego pancerz nie jest "ścianą" (ponieważ ma missile 12 i wyższy hit przez melee 8).
Rydwan egipski (missile 10): analogicznie wysokie dmg.

Gdzie obrażenie spada do minimum: dla Procarza, Łucznika, Oszczepnika (missile 3-4) podłoga 1 obowiązuje przy Pancerzu >= missile - 1, czyli przy >= 2-3. Wszystkie jednostki Brązu od Pancerza 3-4 i całe Żelazo (Pancerz 6-9) są "na podłodze". Ponieważ podłoga to 1 trafienie z 31-37%, strzelec tego typu zadaje ~0,3 HP na strzał, niezależnie od tego jak ciężka jest zbroja.

Porównanie z walką wręcz (porownanie-wrecz.csv): Wojownik z mieczem i tarczą (Brąz, weaponDamage 6, piercing 2) vs Falanga: dmg 2/cios, hit 36%, E=0,72 na cios; Hastati vs Falanga: dmg 3, E=1,11. Czyli wręcz też jest "przybity" (~0,7-1,1 HP na cios przy HP celu 40), ale ma nielimitowaną liczbę ciosów (kontratak, wiele rund) i Przebicie jako podłogę 2-4, a strzelec ma tylko 12-16 strzałów i podłogę 1. Stosunek E: strzał Procarza vs Falanga 0,31 vs cios miecza 0,72 (2,3x mniej) i 15 strzałów vs bez limitu.

# 3. Intencja projektowa

- docs/WALKA-TW-v3.md: obrażenia zwarcia "roboczo, osobna decyzja" (`max(0, Obrażenia - Pancerz) + Przebicie`). Migracja (tabela l.95-103): Pancerz, Obrażenia, Przebicie przeskalowane /10, ale `Atak dystansowy` mapowane "1:1 (stary rangeDamage bez /10)". Atak dystansowy został więc przeniesiony w skali "weaponDamage" (np. Procarz 4 ~ Wojownik 4, Włócznik 5), a Pancerz w skali TW (2-9). Odjęcie stałej Pancerza od pocisku jest wprost odpowiednikiem zwarcia bez składnika Przebicie.
- rangeDamageTw (combat.ts:465) opisany jako "max(1, missileAttack - armor)" wprost. Brak dokumentu decyzji mówiącego "łucznicy mają być słabi na pancerz" ani żadnego KANON-u walki dystansowej z konkretnym progiem; w docs/decyzje nie znaleziono decyzji właściciela dot. strzelców i pancerza (grep po docs/decyzje, WALKA-TW-v3, Dokumentacja-UNITS-BITWA: brak). NIE_ZMIERZONO: nie przeszukano PYTANIA-OTWARTE.md pod kątem wszystkich wzmianek (tylko grep słów kluczowych).
- Wniosek: to NIE jest świadoma decyzja produktowa "strzelcy słabi na zbroję", tylko efekt skali: Atak dystansowy (3-7 dla Kamień/Brąz, nie skalowany z epoką) vs Pancerz (2 -> 9 przez epoki + Kuźnie do +45%). Stała odejmowana + podłoga 1 + brak Przebicia + trafienie liczone z Ataku WRĘCZ (1-2 dla strzelców) składają się na wynik, który właściciel widzi. Dodatkowo hit% dla pocisku z melee 1 jest o ~3 pp niższy niż byłby z Atakiem dystansowym 4 (drobne, ale nieintencjonalne: pole `missileAttack` nie bierze udziału w celności).
- Pozytywne: wąski, historycznie zgodny wyjątek (procarze/łucznicy słabi na ciężką piechotę, mocni na lekką) jest sensowną ideą projektową; sam fakt słabości wobec Falangi/Hastati nie jest błędem. Problem to skrajność: 0,3 HP/strzał oznacza, że 12-15 strzałów to ~10% HP celu, bez znaczenia w bitwie.

# 4. Dlaczego Procarz wydaje się szczególnie słaby

- missile 4 jest równe lub niższe niż Pancerz niemal wszystkich celów od Brązu: podłoga 1.
- 31-37% celności (melee 1).
- Amunicja 15 (Huaracoc 15, Pancerz celu bez znaczenia): cała amunicja daje ~0,31*15 = 4,7 HP vs Falanga 40 HP (11,6%).
- Kontra Slinger -> Spearman +50% działa tylko na Spearman (Włócznik, Triari, Impi...), a mnoży PODŁOGĘ: 1 x 1,5 = 1,5 -> round = 2 (stąd Włócznik dostaje 2). Nie dotyczy Swordsman/Falangite/Mount.
- Dla porównania Slinger jest też słaby na kontry: Mount -> Slinger +50%, Offensive -> Slinger +15%.

# 5. Czy i jak da się zmienić (3-4 opcje)

Wszystkie szacunki poniżej: opcje-korekty.csv (Procarz, Procarz Huaracoc, Łucznik, Konnica łucznicza). Procenty = "oczekiwane obrażenia z całej amunicji w % HP celu" (ammo 15, hit jak wyżej).

A) Bez zmian.
- Zalety: zero ryzyka dla balansu AI, wojen epok, testów; strzelcy pozostają "rola wsparcia, zabijają lekką piechotę/konnicę z wątłym pancerzem" (Konnica łucznicza z missile 12 pokazuje, że rola istnieje).
- Wady: Procarz/Łucznik/Oszczepnik (typowo najtańsze jednostki) praktycznie nie ranią niczego od Brązu wzwyż; właściciel nie zobaczy efektu strzelców na polu bitwy; luka rośnie z epoką (Pancerz rośnie, missile nie).
- Wpływ: brak.

B) Lokalna korekta WYŁĄCZNIE dla Procarzy (Slinger), bez dotykania innych strzelców. Dwa warianty techniczne:
  B1 (dane tylko, `counters.json`): dodać wiersze Slinger -> Swordsman, Falangite, Mount (i ewentualnie Offensive) z "+100%" (statusy "potwierdzone"). Mechanika już istnieje (counterMultiplier mnoży surowe obrażenia przed `round`, podłoga 1 -> 2). Efekt: Procarz dmg 2 zamiast 1 vs Falanga/Hastati/Hieros/Konnica/Rydwan/miecz+tarcza; wartości: Falanga 11,6% -> 23,2% HP, Hastati 13,4% -> 26,8%, Konnica 8,3% -> 16,6%, Rydwan 4,4% -> 8,8%, Wojownik (4 -> 4 x 2 = 4 zamiast 2) 50,5% -> 101%. Zalety: bez zmiany kodu, zmiana jedynie dwóch-trzech wierszy w danych; Rust: `combat.rs` operuje na agregacie siły i tablicy kontr, więc REPIN = zsynchronizowanie counters.json (NIE_ZMIERZONO, wymaga potwierdzenia w REPIN). Wady: podwaja także obrażenia vs Wojownika Kamienia (Procarz zabija go w 15 strzałach; Kamień vs Kamień OK?); wiersz Mount w counters.json już ma odwrotny wpis (Mount -> Slinger +50%); modyfikator dotyczy też AI i `unit-power` jeśli korzysta z countersów (do sprawdzenia).
  B2 (kod): zmienić `rangeDamageTw` tak, aby dla typu Slinger podłoga wynosiła `max(1, round(0,5 * missileAttack))` (czyli 2 dla missile 4). Wyniki jak C50 poniżej, ale tylko dla Procarzy. Wady: wyjątek per-typ w formule dzielonej z auto-walką i Rustem; wymaga REPIN combat/rust.
  B3 (dane): podnieść missileAttack Procarza 4 -> 6-7. Nie pomaga vs Pancerz 8-9 (6-8 = 0 -> podłoga 1) i psuje `unit-power`/moc AI (missileDivisor). NIE zalecane.
- Wpływ B1/B2: Procarz = 2 dmg vs prawie wszystko. Nadal ~0,6-0,7 HP na strzał (4,7 HP z amunicji vs 40 HP Falangi -> 23%). 10 procarzy w rzędzie = ok. 2,3 oddziałów HP 40 zdjętych HP. Realna zmiana w bitwie, ale nie przełamuje roli "wsparcie".

C) Ogólna korekta mechaniki dla wszystkich strzelców: `dmg = max(1, M - A, round(f * M))`, gdzie f = minimalny odsetek (35% lub 50%) lub redukcja pancerza dla pocisku `M - k*A` (k = 0,5).
- C35 (f = 0,35): praktycznie bez efektu dla M 3-4 (0,35*4 = 1,4 -> podłoga 1), pomaga tylko mocnym strzelcom (M 6+: min 2). Nie rozwiązuje problemu Procarza.
- C50 (f = 0,5): Procarz min 2 vs wszystko (Falanga 23,2%, Hastati 26,8%, Konnica 16,6%); Łucznik (M 3) min 2 (1,5 -> 2): Falanga 19,2%; Nubijski (M 6) min 3 (Falanga 12,4% -> 37,2%); Konnica łucznicza (M 12) min 6 (Falanga 114% zamiast 76%) - hurtowo wzmacnia strzelców konnych i tworzy ryzyko przesady (konnica łucznicza 20 strzałów x 6 = 120 HP bez ryzyka).
- Redukcja pancerza k = 0,5: Procarz vs Falanga 4 - 4 = 0 -> nadal podłoga 1 (brak poprawy dla Procarza!), pomaga tylko M >= 6: Wojownik miecz+tarcza 38,6%, Falanga dla Konnicy łucznickiej 152%.
- Zalety C: spójna zasada dla wszystkich strzelców, rozwiązuje problem skali z epoką bez wyjątków. Wady: zmiana formuły w combat.ts (jedna funkcja `rangeDamageTw` obsługuje bitwę animowaną i auto-walkę), skutki dla AI (ocena sił `unit-power`, auto-bitwy, `pole-bitwy-balance-check.cjs`, `combat-test.cjs` używają `rangeDamage`), balans wojen epok i kontr Mount/Slinger; konieczny REPIN dla Rust (`rust-port/engine/src/domain/combat.rs`, agregat) i testów kalibracyjnych. Wymaga przeliczenia progu przez właściciela (liczbowy próg = pytanie ABC).

D) Bonus dystansowy vs konkretne klasy (w `counters.json`, bez zmiany formuły): np. Distance -> Swordsman/Falangite/Mount +25-50%; Slinger -> Swordsman/Falangite +100%. Podobne do B1, ale dla wielu strzelców. Zalety: czysto danowe, czytelne dla gracza (kontry). Wady: mnożenie podłogi daje tylko zaokrąglenia (1 x 1,25 = 1; 1 x 1,5 = 2) - efekt skokowy i zależny od zaokrąglenia, a dla Łucznika (missile 3) vs ciężka piechota przy +15% nic się nie zmienia; wymaga progu >= +50% żeby cokolwiek zmienić.

Dodatkowa (niezależna) drobna kwestia: celność strzału liczona z Ataku WRĘCZ (melee 1) zamiast Ataku dystansowego (4). Przejście na `max(meleeAttack, missileAttack)` dałoby +3 pp celności (Procarz 31% -> 34%, +10% względnych obrażeń) - mała, bezpieczna zmiana, ale zmienia też auto-walkę i Rust. Nie rekomendowana osobno, ewentualnie razem z B/C.

Ryzyka wspólne: balans AI (ocena sił w `unit-power.ts`, auto-bitwa mapy), wojny epok (Procarz Brąz vs Żelazo), testy `combat-test.cjs`/`pole-bitwy-balance-check.cjs`, REPIN Rust (combat.rs jest agregatem, więc dla opcji danowych B1/D prawdopodobnie tylko synchronizacja counters; dla B2/C zmiana formuły w web ma efekt dopiero po przepisaniu auto-walki w Rust; NIE_ZMIERZONO).

# 6. Rekomendacja i pytania ABC (po polsku, do orkiestratora/właściciela)

Pytanie 1 (zakres): Co zrobić ze słabymi obrażeniami strzelców wobec pancerza?
- A) Bez zmian - ryzyko zerowe; strzelcy zostają wsparciem tylko przeciw lekkiej piechocie.
- B) Tylko Procarze (rekomendacja): B1 przez counters.json (dodać Slinger -> Swordsman/Falangite/Mount +100%), bez zmiany kodu; Procarz zadaje 2 zamiast 1 (podwojenie efektu vs Falanga/Hastati/Konnica). Najtańsze, najłatwiej cofnąć, zgodne z prośbą "choćby dla samych Procarzy".
- C) Wszyscy strzelcy: nowa zasada minimalnych obrażeń `max(1, M - A, round(0,5 * M))` - szersza poprawa, ale zmiana formuły (combat.ts + Rust), ryzyko dla Konnicy łuczniczej i AI.
- D) Bonusy klasowe w counters.json dla wszystkich strzelców (+50%/+100% vs wybrane klasy) - dane, ale efekt skokowy przez zaokrąglenia.

Pytanie 2 (jeśli B lub D): jaka wartość bonusu Procarza? (+50% = brak zmiany dla podłogi 1 -> 1,5 -> 2 tylko dla wybranych celów; +100% = stałe 2; podanie progu liczbowego należy do właściciela).

Pytanie 3 (opcjonalne): czy celność strzału ma używać Ataku dystansowego (max(melee, missile)) zamiast Ataku wręcz? (+3 pp dla Procarza; dotyczy wszystkich strzelców i auto-walki).

Rekomendacja orkiestratora-operatora: B1 (dane) jako pierwszy krok, bo odwracalny i w pełni mieści się w ramach decyzji "choćby dla Procarzy"; po wdrożeniu zmierzyć w bitwie ręcznej (batch 5x) czy efekt jest odczuwalny; dopiero wtedy rozważyć C50 dla wszystkich.

# 7. Pliki

- tabela-obrazen-dystansowych.csv - 9 strzelców x 8 celów: hit%, dmg/traf, współczynnik redukcji, E/strzał, E z całej amunicji, % HP, flaga podłogi.
- opcje-korekty.csv - warianty A/B(k=0,5)/C35/C50 dla Procarza, Huaracoc, Łucznika, Konnicy łuczniczej.
- porownanie-wrecz.csv - ciosy wręcz (Wojownik, miecz+tarcza, Włócznik, Hastati, Hieros) vs te same cele.
- Skrypt generujący (nie w repo): /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/ranged-audit-q1.py
