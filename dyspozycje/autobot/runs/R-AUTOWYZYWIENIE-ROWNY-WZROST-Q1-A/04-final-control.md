# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — Final Control (sędzia §3c, runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A
GOAL: wyrównywanie WZROSTU między miastami przy twardym warunku braku głodu, z (B) miastem
na limicie i (C) skalowaniem tempa cywilizacji. Zgodny z `00-dispatch.md` — diff dispatchu
`bec25312..HEAD` ma **zero linii usuniętych**, ratyfikacja tylko dopisana.
MODEL+EFFORT: Sonnet 5, effort high. Baza `bec25312`, HEAD `377ca3a9` (potwierdzone).

## WERDYKTY

**ZARZUT 1 → ODDAL.** Allowlista ratyfikacją rozszerzona, więc pytanie brzmi tylko: czy zmiana
mieści się w rozszerzeniu. Zmierzyłem diff: 25 linii, dokładnie **3 zaszyte wartości**
(Ateny 4→1, Milet 0→1, Nadwyżka 23→31) + komentarz + jedna asercja **wzmacniająca**
(`atenyLvl === miletLvl`). Istota testu nietknięta — `nadwyzkaFinal >= KOSZT_ARMII` bez zmian
w diffie; bramka 18/18, exit 0.

**ZARZUT 2 → ODDAL** (rozstrzygnięcie wiążące, ale sprawdzone samodzielnie).
Fakt potwierdzam: `grep -rn popCapByCityId gra/src --include=*.ts` → **13 trafień, wszystkie
w `empire-food.ts`**; realnego callera brak, własność (B) w grze martwa. Warunek bezpieczeństwa
integracji **zweryfikowany pomiarem**: plan bez mapy i z mapą pustą dają identyczny
`uniformLevel` (0,5) i **identyczne `levelByCityId`**, `atPopCapCityIds` = 0 w obu. Zachowanie
wsteczne potwierdzone też empirycznie — żadna inna bramka nie podaje mapy i wszystkie
7 czerwonych ma wyjście bit w bit identyczne. Naprawa tutaj wymagałaby `main.ts` → §9.

**ZARZUT 3 → ODDAL.** Nie z raportu — **z własnego pomiaru** (sonda poza repo, 12 miast, cap 5,
kosztArmii 20, zapasy 279): produkcja ×0,25 → BEZ mapy `uniformLevel` **0,5**, Z mapą **0,5**,
poziomy miast na limicie `[0,5 ×5]` — nie stoją wyżej niż rosnące. Oszczędność zachowana:
×0,5 → 2→2,5; ×1 → 4→6. **Dowód, że poprawka jest nośna:** cofnąłem `Math.min` w obu miejscach
— pomiar wraca do **0,5 → 0** (B pogarsza rosnących), a bramka czerwienieje na **B7b i B7c**
(58/60, exit 1). Kierunek niedoboru jest więc pokryty, zarzut „B5 testuje tylko nadmiar" domknięty.

## TESTY (uruchomione przeze mnie, sekwencyjnie)

- **Zakres:** diff `bec25312..HEAD` = 8 plików, wszystkie w allowliście po rozszerzeniu.
  `gra/src/main.ts` i `gra/src/ui/**` — **0 zmian**. Redystrybucja z puli **nietknięta**:
  najniższy hunk w `empire-food.ts` zaczyna się na `+453`, `:249-251` i `:257-265` poza diffem.
- **Anty-samooszukiwanie (najważniejsze):** zmusiłem `resolveEqualGrowthRationPlan` do stałego
  poziomu 0% wzrostu. Rozrzut 0 i brak głodu, a bramka **CZERWIENIEJE** (49/54, exit 1):
  `E1 „przyrost 2 > próg 2"`, `E5b`, `C2`, `B5`, `B7a`. Wariant „zatrzymaj wszystkich" nie przechodzi.
- **Prawdziwa pętla, nie kopia wzoru:** mutacja `population-growth-v85.ts:450`
  (`city.population = growth.nowaLudnosc` usunięte) → bramka **51/54, exit 1**,
  `A5 „47 → 47"`, `E1 „przyrost 0"`. Bramka woła `applyPostCentralPopulationGrowth`.
- **Nietautologiczność:** po naprawie **60/60, exit 0**; na bazowym `empire-food.ts`
  **23/34, exit 1** (18 naruszeń odwrotnej zależności, rozrzut 4,5, poziomy 1,5/0,5/2/3/4).
- `tsc --noEmit` — exit 0.
- Zielone: kosztarmii-kryterium 18/18, flow-balance 17/17, bilans-clamp 22/22, live-recalc 60/60,
  population-growth-live-recalc 42/42, ai-major-economy 33/33, city-state-mp-growth 9/9,
  army-hunger-combat 13/13, gold-deficit 55/55, magazyn-era-scaling 58/58,
  okolica-multi-city-overlap exit 0, spichlerz-deficyt-scalenie 58/58.
- Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- **PARYTET 7 czerwonych — zmierzony sam**, podmianą `empire-food.ts` na `bec25312` i przebiegami
  SEKWENCYJNYMI: empire-food-b5 25/28, glod-wojska-karencja, population-growth-v85 48/50,
  population-growth-v85-bonus 18/20, population-growth-tempo 12/14, grupa-b-lane 45/49,
  spichlerz-wzrost 2/9 — **`diff` wyjścia PUSTY dla wszystkich siedmiu**, exit 1 przed i po.
  Brak regresji z tej zmiany.

## BLOKADY

Brak zatrzymujących. Dwie noty dla orkiestratora:
1. **Temat następczy nie jest jeszcze w rejestrze** — `grep R-AUTOWYZYWIENIE-LIMIT-WPIECIE-POPCAP-Q1
   dyspozycje/REJESTR-PROSB-I-ZADAN.md` → **0 trafień**. §16b pkt 4 wymaga, by uwaga zdjęta
   przez `ODDAL` była zapisana jako osobny temat; rejestr jest poza allowlistą tego węzła,
   więc wpis należy do orkiestratora przed integracją.
2. **Korekta liczb w `02-evaluator.md`:** wymieniono tam `population-growth-v85-bonus` i
   `population-growth-tempo` jako zielone (exit 0). Mój pomiar: obie są **czerwone już na bazie**
   i po zmianie, z identycznym wyjściem. Poprawna jest lista Operatora (7 pozycji). Nie wpływa
   na werdykt — parytet zachowany tak czy inaczej.
3. `03-obrona.md` i `01-operator.md` przekraczają ~400 słów (§11) — `PASS-WITH-NOTES` dla
   raportów, nie wada wytworu.

Drzewo po wszystkich mutacjach przywrócone: `git status --porcelain` **pusty**,
`git diff --check` czysty, HEAD nadal `377ca3a9`.

AGREGAT (§3c pkt 3, §16b pkt 8): 3× `ODDAL`, zero `NAPRAW`, zero `DO DECYZJI CZŁOWIEKA` → **PASS**.
Węzeł gotowy do integracji ręką orkiestratora po dopisaniu tematu następczego do rejestru.

RUNDY: 1/5 (obrona nie jest osobną rundą — §16b pkt 5; licznik niezresetowany)
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`
DEPLOY/PUSH: NIE WYKONANO
