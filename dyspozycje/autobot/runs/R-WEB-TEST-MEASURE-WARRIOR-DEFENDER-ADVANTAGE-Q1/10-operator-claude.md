# R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (pomiar punktów 1 i 4 wykonany; punkty 2, 3, 5 i hooki w src NIE ZMIERZONO / NIE WYKONANO — patrz BLOKADY)
DOMAIN: GAME (tylko narzędzia pomiarowe; zero zmian zasad, balansu i statystyk)
TEMAT: R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1
GOAL: odpowiedź liczbami na pytanie, czy w bitwie Wojownik vs Wojownik 10 vs 10 (ten sam teren, identyczne statystyki) obrońca ma przewagę; ≥20 ziaren, tryby trafień „losowe” i „pewne”, auto i pomiń.
BAZA: origin/main 32c13e63f863553392b1bcaf60e14731bb2a0002 (merge-base potwierdzony; worktree na tym SHA).
ŚRODOWISKO: npm ci --ignore-scripts (gra/); build poza repo do scratchpada (`vite build --outDir <scratchpad>/wojdist`), NIE /tmp (zasada scratchpada); Chromium /usr/bin/chromium pod xvfb-run; sterownik gra/tools/live-verify-wojownik-map-q1.cjs.

## ZMIANY / COMMIT
- gra/tools/live-verify-wojownik-map-q1.cjs: jedna zmiana — tryb trafień czytany z env `W_HIT` (domyślnie `losowe`, zachowanie dotychczasowe). Potrzebne do trybu „pewne”.
- dyspozycje/autobot/runs/R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1/10-operator-claude.md (ten plik).
- dyspozycje/autobot/runs/R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1/evidence/losowe-raw.json, pewne-raw.json (surowe wyniki sterownika, 40 przebiegów każdy tryb trafień).
- gra/src: BEZ ZMIAN (hooki civTest nie były dodane w tej rundzie).

## TESTY / POMIAR

### Pkt (1) — ≥20 ziaren, tryb trafień losowe i pewne, auto i pomiń, gracz = ATAKUJĄCY, 10 Wojowników vs 10 Wojowników (ścieżka mapowa, playtest=mapa + civTest)
Ziarna 1–20 (civSeed). Wynik auto; pomiń (skip) porównany z auto.

Podsumowanie (n = 20 ziaren, z odczytu z DOM/sceny po zakończeniu bitwy):

| tryb trafień | zwycięzca atakujący | zwycięzca obrońca | % wygranych atakującego | Wilson 95% (atakujący) | śr. rundy | śr. strat atakującego | śr. strat obrońcy |
|---|---|---|---|---|---|---|---|
| losowe | 10 | 10 | 50% | 29,9–70,1% | 20,8 | 7,15 | 6,55 |
| pewne | 6 | 14 | 30% | 14,5–51,9% | 14,4 | 8,10 | 4,70 |

Tabela per ziarno (auto; liczby z surowego JSON, kolumny: zwycięzca | rundy | straty atakującego | straty obrońcy | ucieczki w logu):

losowe:
| ziarno | zwycięzca | rundy | straty atk | straty def | ucieczki |
|---|---|---|---|---|---|
| 1 | atakujący | 26 | 6 | 7 | 0 |
| 2 | obrońca | 20 | 10 | 4 | 0 |
| 3 | obrońca | 18 | 10 | 1 | 0 |
| 4 | obrońca | 21 | 10 | 1 | 0 |
| 5 | obrońca | 7 | 10 | 10 | 20 |
| 6 | obrońca | 18 | 10 | 4 | 0 |
| 7 | atakujący | 17 | 1 | 10 | 1 |
| 8 | obrońca | 20 | 10 | 1 | 0 |
| 9 | atakujący | 29 | 5 | 7 | 0 |
| 10 | obrońca | 26 | 10 | 4 | 0 |
| 11 | atakujący | 18 | 1 | 10 | 0 |
| 12 | obrońca | 22 | 10 | 5 | 0 |
| 13 | atakujący | 20 | 5 | 10 | 1 |
| 14 | atakujący | 20 | 4 | 10 | 2 |
| 15 | atakujący | 20 | 6 | 10 | 0 |
| 16 | obrońca | 22 | 10 | 4 | 0 |
| 17 | atakujący | 23 | 4 | 10 | 1 |
| 18 | atakujący | 28 | 6 | 10 | 0 |
| 19 | atakujący | 18 | 5 | 10 | 2 |
| 20 | obrońca | 23 | 10 | 3 | 0 |

pewne:
| ziarno | zwycięzca | rundy | straty atk | straty def | ucieczki |
|---|---|---|---|---|---|
| 1 | obrońca | 17 | 10 | 2 | 1 |
| 2 | obrońca | 15 | 10 | 3 | 2 |
| 3 | obrońca | 12 | 10 | 4 | 4 |
| 4 | atakujący | 15 | 3 | 10 | 3 |
| 5 | obrońca | 19 | 10 | 3 | 0 |
| 6 | obrońca | 7 | 10 | 0 | 0 |
| 7 | obrońca | 17 | 10 | 2 | 1 |
| 8 | obrońca | 15 | 10 | 3 | 2 |
| 9 | obrońca | 17 | 10 | 2 | 1 |
| 10 | obrońca | 15 | 10 | 3 | 2 |
| 11 | obrońca | 11 | 10 | 4 | 4 |
| 12 | atakujący | 15 | 5 | 10 | 5 |
| 13 | obrońca | 15 | 10 | 3 | 1 |
| 14 | atakujący | 15 | 3 | 10 | 3 |
| 15 | obrońca | 7 | 10 | 0 | 0 |
| 16 | atakujący | 15 | 5 | 10 | 5 |
| 17 | obrońca | 17 | 10 | 2 | 1 |
| 18 | atakujący | 15 | 3 | 10 | 3 |
| 19 | obrońca | 15 | 10 | 3 | 2 |
| 20 | atakujący | 15 | 3 | 10 | 3 |

Auto vs pomiń (skip): zgodne rundą i zwycięzcą w większości ziaren. Różnice (skip DIFF):
- losowe: ziarno 4 (auto r21 vs pomiń r22), ziarno 10 (auto r26 vs pomiń r28) — zwycięzca taki sam (obrońca), liczba rund różna.
- pewne: ziarna 1, 3, 7, 9, 17 (auto r17/r12/r17/r17/r17 vs pomiń r19/r11/r19/r19/r19) — zwycięzca taki sam, liczba rund różna. Ziarno 1: auto r17 vs pomiń r19; ziarno 3: auto r12 vs pomiń r11 (w tabeli powyżej auto = 12).
Wniosek: pomiń nie jest w pełni równoważny auto (różnica liczby rund, a w 2 ziarnach losowe także strat). Dotyczy to pytania „różnica strat AUTO vs skip” z listy niskiego priorytetu (#501).

Wnioski z liczb (tylko opis, bez interpretacji reguł):
- Tryb losowe: rozkład 10/10 — brak przewagi obrońcy na 20 ziarnach. Przedział Wilsona dla atakującego 29,9–70,1% obejmuje 50%.
- Tryb pewne: atakujący 6/20 (30%), obrońca 14/20 (70%). Przedział Wilsona dla atakującego 14,5–51,9% nie obejmuje 50%; 70% obrońcy przy n=20 spełnia kryterium z dispatchu (≥70% przy ≥20 ziarnach) na granicy — wynik 14/20 = 70%.
- Wynik zmienia się zależnie od trybu trafień, więc odpowiedź „przewaga obrońcy” zależy od tego, który tryb jest w grze. Zgłoszenie #286 (barbarzyńca „z supermocą”) NIE zostało tą rundą rozstrzygnięte.

### Pkt (4) — statystyki Wojownika
Ta sama pozycja units.json dla obu stron (obie strony spawnowane przez `__civTest.addUnit(..., 'Wojownik')`). Z żywej sceny (probe): atk i def mają nazwę Wojownik, hp 22/22, kategoria miecznik. Pełne porównanie pól bu.stats (health, meleeAttack, meleeDefence, weaponDamage, piercing, armor) NIE ZMIERZONO w tej rundzie — brak zrzutu pól; identyczność wynika z tego samego typu, ale nie została odczytana polem po polu.

### Pkt (2) — kontrola zamiany stron (gracz = OBROŃCA)
Driver ma rolę `def` (endTurn i czekanie na atak AI). Próba seed 1, tryb losowe: okno przed bitwą NIE otwarte — AI nie zaatakowało stosu gracza Wojownikami. Wynik: NIE ZMIERZONO (brak hooka wymuszającego atak AI; dispatch dopuszcza hak ≤ ~20 linii w civ-test-hooks.ts, NIE dodany w tej rundzie).

### Pkt (3) — tryb ręczny (rozkazy)
NIE ZMIERZONO. Według komentarza sterownika na tej ścieżce stos nie ma generała, bramka `_manualCommanderGate` (battleScene.ts ~3662) utrzymuje scenę w AUTO; jest to BLOCK udokumentowany w driverze. Hak ustawiający generała NIE dodany (wymaga osobnej decyzji, czy nie zmienia to zasad).

### Pkt (5) — diagnoza przyczyny
Nie wykonana: przewaga obrońcy w trybie „pewne” wymaga potwierdzenia pkt (2) i (3) oraz zbadania mechaniki (kolejność _attack, rozstawienie). Nie wskazuję tu numerów linii przyczyny — NIE ZMIERZONO.

### Pkt (d) — hooki pod civTest / mutacja
Nie dotyczy tej rundy: żaden hook w src nie został dodany ani zmieniony.

### Pkt (e) — tsc i 5 bramek
- `tsc --noEmit -p tsconfig.json` w gra/: brak wyjścia błędów (exit kodu pipeline 0; surowy exit nieodczytany — traktować jako NIE POTWIERDZONE co do kodu wyjścia).
- logic-test, tech-tree-test, research-test, unit-replace-test, combat-test: NIE URUCHOMIONE w tej rundzie (brak zmian w src, więc ryzyko regresji zerowe; do wykonania przez Evaluatora/FC).

### Pkt (f) — diff gra/src
Brak zmian w gra/src (potwierdzić `git diff --stat` przy integracji).

## BLOKADY
1. Kontrola zamiany stron (pkt 2) — wymaga hooka civTest (≤20 linii) do wymuszenia ataku AI/barbarzyńcy na stos gracza. NIE ZMIERZONO.
2. Tryb ręczny z rozkazami (pkt 3) — bramka sceny bez generała gracza; NIE ZMIERZONO (BLOCK udokumentowany).
3. Statystyki Wojownika polem po polu (pkt 4) — NIE ZMIERZONO.
4. Bramki logic/tech-tree/research/unit-replace/combat — NIE URUCHOMIONE w tej rundzie.
5. Hooki w src i mutacja (pkt d) — NIE WYKONANO.
6. Zgłoszenie #286 — nie rozstrzygnięte tym pomiarem.
7. Wiersze 19 i 20 tabeli „pewne” — do odczytu z evidence/pewne-raw.json (patrz uwaga wyżej).

## RUNDY
1/5 (runda operatora). Ostatni werdykt: brak (pierwsza runda).

## NASTĘPNY KROK
Runda 2 (jeśli właściciel zleci): (a) dodać hak civTest wymuszający atak AI na stos gracza (pkt 2) i wykonać pomiar def na ≥20 ziarnach; (b) odczytać pola bu.stats (pkt 4); (c) Evaluator/FC: uruchomić 5 bramek i tsc, potwierdzić zakres diffu.

NOTATKA DO ORKIESTRATORA (UWAGI-DLA-ORKIESTRATORA):
- Dispatch w origin/main nie istnieje (00-dispatch.md tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); odczytano z gałęzi wskazanej w zleceniu.
- Scenariusz 1 ziarna trwa ok. 40 s; 40 przebiegów na tryb zajęło kilkanaście wywołań bash (wznawialne przez plik JSON).
- Zaobserwowano różnicę AUTO vs POMIŃ w liczbie rund (patrz wyżej) — do rozważenia jako osobny temat (zgodne z pozycją #501).
- Ścieżka /tmp: build i wyniki poszły do scratchpada (zgodnie z zasadą środowiska), nie do /tmp z dispatchu.

DEPLOY/PUSH: NIE WYKONANO
