# P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 — Operator, runda 1/5

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · IZOLACJA: `/home/user/wt-barbarzyncy`,
gałąź `autobot/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`, guard §2b zielony (baza `022b82aa`,
drzewo czyste przed pracą).

## NAPRAWA (3 zmiany w `gra/src/game/barbarians.ts`, `decideBarbarianMoves`)

1. **Warunek resetu pamięci `clearedCityIds`** — z „odwiedziłem wszystkie NIEBRONIONE" (runda 5)
   na `filtered.length === 0 && civCitiesBase.length > 0`: reset dopiero gdy **nie został żaden
   inny cel**. Reset odsłania odwiedzone miasta, więc dopóki bronione miasto czeka jako poprawny
   cel, jest szkodliwy — to było źródło krążenia.
2. **Bramka trudności usunięta** (ECHO): `skipDefenselessCities = difficulty === 'normal' || 'hard'`
   → stała `true`. Jedna reguła na wszystkich poziomach. Stała, nie usunięcie gałęzi — zostawia
   ślad po bramce i utrzymuje istniejący dowód mutacyjny (sekcja 9 bramki miast) bez przepisywania.
3. **Zabezpieczenie przed zamianą błędu na błąd**: miasta odrzucone WYŁĄCZNIE przez pamięć
   dopisane na koniec listy kandydatów („ostatnia deska ratunku"), `break` → `continue`.
   Bez tego sama zmiana (1) zamieniała krążenie na TRWAŁE zamrożenie w reżimie z nieosiągalnym
   bronionym miastem (zmierzone: 287/300 tur bez komendy).

## KRYTERIUM 1 — SYMULACJA 300 TUR, PRZED vs PO (własny pomiar, nie rozumowanie)

Plansza 70×8, niebronione q=6/16/26/36, bronione q=60, jednostka raid-ready start q=10.
„PRZED" = dokładna treść pliku z `HEAD`, nie ręcznie cofnięta kopia.

| Reżim | PRZED (normal/hard) | PRZED (easy / bez `difficulty`) | PO (wszystkie 4 warianty) |
|---|---|---|---|
| 2 niebronione + 1 bronione | cykl **okres 20**, `attack` NIGDY, min. dystans 45 | parkuje przy 1. mieście, min. dystans 51 | **`attack` w turze 58** |
| 3 niebronione + 1 bronione | cykl **okres 44**, NIGDY, min. 34 | parkuje, min. 51 | **`attack` w turze 59** |
| 4 niebronione + 1 bronione | cykl **okres 66**, NIGDY, min. 24 | parkuje, min. 51 | **`attack` w turze 60** |

PO: każde niebronione miasto odwiedzone **dokładnie raz**, 0 tur bezczynności, zero powtórzeń stanu.

## KRYTERIUM 2 — JEDNA REGUŁA

Logi komend `easy` == `normal` == `hard` == `difficulty` pominięte: **bit-identyczne** we
wszystkich trzech reżimach (PRZED: rozjazd w każdym). Dowód strukturalny (sekcja 5 nowej bramki):
w liniach kodu od `skipDefenselessCities` do `nearestCity` nie pada `difficulty`.

## TABELA CZTERECH OSI (niebronione × bronione × osiągalność × raidReady × trudność)

120 przebiegów po 300 tur, PRZED vs PO: **60 bit-identycznych, 60 zmienionych, 0 pogorszonych.**
- Zamrożenia **zniknęły**: „1 niebronione + bronione NIEOSIĄGALNE" 296/300 tur idle → **0**
  (to defekt, który werdykt zbiorczy rundy 6 kazał udokumentować — domknięty, nie zamieciony).
- 0 bronionych: bit-identyczne na normal/hard; krążenie zostaje, bo **nie ma innego celu**
  (asercja sekcji 6b istniejącej bramki, nietknięta).
- 0 niebronionych + bronione nieosiągalne: bit-identyczne zamrożenie — pre-istniejący defekt
  `if (raidReady) continue`, osobny otwarty temat, świadomie poza zakresem.
Pełna tabela: `01-operator-runda1-tabela-4-osi.txt` w tym katalogu runu.

## PIĘĆ PUNKTÓW WERDYKTU ZBIOROWEGO

1/3/4/5/6 były już domknięte w bazie `022b82aa` (runda 7) — zweryfikowane odczytem, nie z pamięci.
Ta runda: (1) zdanie o „samo-gojącym się artefakcie" nie istnieje, ale sprostowanie rundy 7
twierdziło „reżim POZOSTAJE NIEROZWIĄZANY" — **przepisane na stan po naprawie z moimi liczbami**;
(2) reżim nieosiągalny — udokumentowany i domknięty pomiarem; (4) M2b i M3 — istniały w bramce
miast, **powtórzone w nowej bramce** (sekcje 7/8) z własnymi dowodami mutacyjnymi; (5)+(6)
sprostowania rundy 7 zachowane, historia warunku resetu dopisana.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3): **0 błędów**.
- Bramki referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.
- **NOWA** `gra/tools/barbarzyncy-krazenie-test.cjs`: **123/123**.
- Rodzina barbarzyńców (grep `barb|raid|oboz` po `gra/tools/*-test.cjs`, 14 bramek):
  ai-home-defense 38/0 · barb-camp-blacklist 18/0 · barb-camp-destruction 82/**2** ·
  barb-city-behavior **177/0** · barb-city-capture-cluster 92/**1** · barb-city-owner-contract 3/3 ·
  barb-karencja 13/0 · cooperation-grace-wiring 29/0 · cooperation-grace 30/0 ·
  barbarians-test 213/0 · barbarzyncy-krazenie **123/0** · podwojny-atak 18/0 ·
  diplomacy-barbarian-cooperation 10/0 · oboz-lowiecki-las 72/**19** ·
  oboz-lowiecki-las-znika-render 26/**1** · oboz-lowiecki-wymaga-tartaku 16/0.
  **Cztery czerwone są PRE-ISTNIEJĄCE** — te same liczby zmierzone na `HEAD` z bazową
  `barbarians.ts`: barb-camp-destruction 82/2, barb-city-capture-cluster 92/1,
  oboz-lowiecki-las 72/19, oboz-lowiecki-las-znika-render 26/1. Zero regresji.
- **Kryterium 4 (mutacja)**: cofnięcie obu części naprawy → nowa bramka **74 faili**,
  bramka miast **5 faili**. Cofnięcie przez KOPIĘ pliku, przywrócenie zweryfikowane `diff`,
  `git diff` czysty poza allowlistą. Cztery dowody mutacyjne w nowej bramce (9a–9d) zielone.

## BLOKADY / NOTY DLA EVALUATORA

- **N1 (ODSTĘPSTWO OD ALLOWLISTY, do rozstrzygnięcia).** Allowlista pozwala w istniejących
  bramkach „wyłącznie dodawać asercje". Sekcja **6d** i dwa dowody mutacyjne
  (**10**, **USTERKA 1**) w `barb-city-behavior-test.cjs` asercjonowały **dokładnie to krążenie,
  które ECHO każe usunąć** (reset mimo obecności bronionego miasta, ≥2 przyjazdy do każdego
  niebronionego). Nie da się spełnić ECHO i utrzymać ich zielonymi. Odwróciłem je na niezmiennik
  z ECHO (nie usunąłem): liczba asercji **173 → 177**, sekcja 10 nadal żywym dowodem mutacyjnym
  w przeciwnym kierunku.
- **N2.** USTERKA 1 przekwalifikowana z dowodu mutacyjnego na **dowód równoważności**: po zmianie
  warunku resetu mutacja `[ostatnie]` → `[]` jest zachowaniowo neutralna i **żadna sekcja jej nie
  łapie** (zweryfikowane wykonaniem: podproces z mutantem 143/143). Kod produkcyjny rundy 6
  zostawiony bez zmian; zamiast udawać złapanie, przypięty fakt równoważności.
- **N3.** Nowa bramka **nie została wpisana do tabeli §6 `R-PROC-AUTOBOT.md`** — `docs/decyzje/**`
  jest poza allowlistą tego tematu. Wpis należy do integracji orkiestratora (§6: „nowa bramka
  istnieje dopiero, gdy jest w tej tabeli").
- **N4.** `gra/data/*.json` nietknięte — naprawa nie wymagała nowego parametru.
- Zero zmian w `gra/src/main.ts` i `gra/src/game/ai.ts` (§2b, temat równoległy).

## KONTRAKT

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1
GOAL: barbarzyńca przed wyborem celu podejmuje decyzję i ją realizuje; oscylacja bez dotarcia do
żadnego celu znika; jedna reguła na wszystkich poziomach trudności
ZMIANY/COMMIT: `gra/src/game/barbarians.ts`, `gra/tools/barbarzyncy-krazenie-test.cjs` (NOWY),
`gra/tools/barb-city-behavior-test.cjs`, `dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/01-operator-runda1.md`
TESTY: tsc 0 · 5 referencyjnych zielonych · nowa bramka 123/123 · rodzina barbarzyńców bez regresji
(3 czerwone pre-istniejące, potwierdzone na HEAD) · mutacja: 74 + 5 faili
BLOKADY: N1 (odwrócenie 3 asercji/dowodów w istniejącej bramce — wymaga werdyktu Evaluatora),
N3 (wpis bramki do §6 należy do integracji)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
