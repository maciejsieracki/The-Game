# P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 — Operator (obrona), runda 1/5

MODEL+EFFORT: **Opus 5, effort high** · DATA: 2026-09-06 · Druga faza TEJ SAMEJ rundy 1.
IZOLACJA: `/home/user/wt-barbarzyncy`, gałąź `autobot/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`.
Guard §2b: `HEAD` = `0fcc4e4f` (raport Evaluatora) nad `7b04c432` (Operator) nad bazą `022b82aa`,
drzewo czyste przed pracą. Mutacje weryfikacyjne cofane KOPIĄ, nigdy `git checkout`.

## OBRONA — zarzut po zarzucie

**1 → PRZYJMUJĘ pokrycie, ODRZUCAM tezę „naprawa nie działa na ścieżce produkcyjnej”.**
Pokrycie: sekcje 1–3 wołały `decideBarbarianMoves` bez `turn` — zarzut trafny, dołożona
**sekcja 10** (`turn` przekazywany w każdym wywołaniu + ŻYWY obóz z `campId`, jak `tickCamps`).
Teza obalona własnym pomiarem, 300 tur, BASE `022b82aa` vs HEAD, `turn` PRZEKAZANY:
2 niebronione — BASE cykl **okres 22**, `attack` NIGDY, **14 przyjazdów do każdego miasta**
→ HEAD `attack` **tura 58**, każde miasto raz; 3 niebronione okres 44 → tura 59; 4 → okres 66 →
tura 60. BASE z `turn` i bez `turn` daje **ten sam log** (md5 `93d70635`) — `turn` nie jest tu
czynnikiem, bo `homeCampForUnit` (`barbarians.ts:1506-1509`) zwraca obóz PO ID niezależnie od
odległości, więc `raidReady` jest stałe. Dlaczego sonda obozowa Evaluatora niczego nie pokazała:
`planBarbarianRally` (`barbarians.ts:773-779`) zawraca do obozu całą grupę ≥2 jednostek o tym
samym `campId`, a `barbarians.ts:1807` `continue` ucina je **przed** wyborem celu — kod naprawy
nigdy się nie wykonuje. Sekcja 10 omija pułapkę (`inGarnizon: true` na garnizonie) i to jest
w niej zapisane. Reżim Evaluatora (osierocony, limit wygasł, bronione 45 heksów przy
`aggroRadius=6`) **nie zawiera objawu również w BASE** (287 tur bez komendy) — nie może być
odniesieniem dla kryterium 1.

**2 → PRZYJMUJĘ.** Zdanie „logi komend przed/po są BIT-IDENTYCZNE” było nieprawdą. Zmierzone
(70×5, ściana morza q=44, 300 tur, md5 logu): 2 niebronione BASE `cd7cef7e70` (241 realnych
zmian pozycji / 29 tur bez komendy) vs HEAD `00e2ab78d0` (11 / 0); 3 — `b9314d677b` (260/13) vs
`c73be52345` (22/0); 1 — `c11f299bdd` (3/296) vs `7d234f1a96` (3/0). Akapit PL i EN przepisany
na te liczby.

**3 → PRZYJMUJĘ.** `eq(idle,0)` nie dowodzi ruchu: HEAD wydaje komendę co turę, ale ma
**1 unikalną pozycję w ostatnich 60 turach**. Sekcja 6 przepisana: (a) `idle===0` z jawnym
zastrzeżeniem, że NIE mówi o ruchu; (b) **każde osiągalne miasto odwiedzone dokładnie raz**
(realna poprawa wobec BASE); (c) `realMoves >= 1`. Z komentarza produkcyjnego usunięte zdanie
„zamrożenia znikają” — zastąpione pomiarem i nazwaniem reszty jako `if (raidReady) continue`.

**4 → PRZYJMUJĘ.** Dołożona **sekcja 11**: jednostka NIE raid-ready (`chaseRadius = aggroRadius
= 6`), jedyny zwykły kandydat d=20, jedyny kandydat „ostatniej deski” d=1. Zmierzone: `continue`
→ 1 komenda `move` na (11,1); `break` → **0 komend**. Dowód mutacyjny **9e** (`continue`→`break`)
czerwieni sekcję 11.

**5 → PRZYJMUJĘ.** Komentarz przypisywał guardowi `civCitiesBase.length > 0` skutek behawioralny.
Odtworzyłem M-E3: usunięcie guarda nie czerwieni żadnej bramki rodziny. Komentarz PL+EN
przepisany na „guard OBRONNY, bez zmierzonego skutku”, z podaniem, co jedynie robi.

**6 → PRZYJMUJĘ.** `expectSelfCheckPasses` **wycofane** (helper usunięty) — wymaganie, by mutant
był zielony, odwraca sens bramki. Martwa gałąź `: []` **usunięta z kodu produkcyjnego** z dowodem
w komentarzu (warunek resetu implikuje niepusty `clearedSet`). Killującego dowodu mutacyjnego
przywrócić się nie da: równoważność `[ostatnie]` vs `[]` potwierdziłem drugim, niezależnym
harnessem (0 bronionych × {2,3} niebronione, raid-ready, 120 tur — identyczne 0/0 tur bez
komendy, 97/104 realnych ruchów, 6/6 i 3/5/3 przyjazdów, 9/29 unikalnych pozycji). Sekcja 13 jest
teraz **asercją PRZESŁANKI** (warunek resetu + brak martwej gałęzi) — czerwieni się przy zmianie,
nigdy nie żąda zielonego mutanta. Żywy dowód mutacyjny warunku resetu zostaje w sekcji 10 tego
pliku. **Do rozstrzygnięcia Final Control:** czy to wystarcza wobec litery allowlisty, czy sekcja
13 ma zostać usunięta.

**7 → PRZYJMUJĘ.** Sprostowanie: **cztery** czerwone pre-istniejące (nie trzy), **16** bramek
rodziny (nie 14).

## DO DECYZJI CZŁOWIEKA (kandydat)

Reszta bezruchu z zarzutu 3 — jednostka raid-ready bez osiągalnego celu nadal nie rusza się
z miejsca. Usunięcie tego wymaga `if (raidReady) continue`, który dispatch nazywa **osobnym,
wciąż otwartym tematem**. Wytwór nie rozstrzyga, czy ma wejść do TEGO ID; to decyzja zakresu.

## TESTY (po poprawkach, własne uruchomienia)

- `node ./node_modules/typescript/bin/tsc --noEmit`: **0 błędów**.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**,
  combat **6/6**.
- Rodzina barbarzyńców, **16** bramek: ai-home-defense 38/0 · barb-camp-blacklist 18/0 ·
  barb-camp-destruction 82/**2** · barb-city-behavior **177/0** · barb-city-capture-cluster
  92/**1** · barb-city-owner-contract 3/3 · barb-karencja 13/0 · cooperation-grace-wiring 29/0 ·
  cooperation-grace 30/0 · barbarians-test 213/0 · **barbarzyncy-krazenie 249/0** (było 123) ·
  podwojny-atak 18/0 · diplomacy-barb-cooperation 10/0 · oboz-lowiecki-las 72/**19** ·
  oboz-lowiecki-las-znika-render 26/**1** · oboz-lowiecki-wymaga-tartaku 16/0.
  **Cztery czerwone to te same liczby, które Operator i Evaluator niezależnie potwierdzili jako
  pre-istniejące** podmianą `barbarians.ts` na bazę. Zero regresji.
- Dowody mutacyjne nowej bramki: 9a, 9b, 9c, **9e (nowy)**, 9d — wszystkie łapią mutanta.

## KONTRAKT

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1
GOAL: barbarzyńca podejmuje decyzję i ją realizuje; oscylacja znika; jedna reguła na wszystkich
poziomach trudności
ZMIANY/COMMIT: `gra/src/game/barbarians.ts`, `gra/tools/barbarzyncy-krazenie-test.cjs`,
`gra/tools/barb-city-behavior-test.cjs`,
`dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/03-obrona-runda1.md`
TESTY: tsc 0 · 213/19/33/13/6 · 16 bramek rodziny, 4 czerwone pre-istniejące · nowa bramka 249/0
BLOKADY: zarzut 6 — forma sekcji 13 wymaga werdyktu Final Control (granica allowlisty);
kandydat DO DECYZJI CZŁOWIEKA: zakres `if (raidReady) continue`
RUNDY: 1/5
NASTĘPNY KROK: Final Control (osobny subagent)
DEPLOY/PUSH: NIE WYKONANO
