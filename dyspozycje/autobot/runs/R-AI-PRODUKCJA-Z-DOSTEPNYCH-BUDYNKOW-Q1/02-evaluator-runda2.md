# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Evaluator, runda 2/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po
BuildingDef.grupa. Runda 2 realizuje ratyfikację orkiestratora (00-dispatch.md) — punkty #1-#4.

## Metoda

Guard: HEAD `f9294ac0` jest bezpośrednim potomkiem ratyfikacji `6a40594b` (ancestor potwierdzony,
drzewo czyste) — awans o jeden commit Operatora, zgodnie z sekwencją. Zweryfikowano: `tsc --noEmit`
(0 błędów), 5 bramek referencyjnych (213/213, 19/19, 33/33, 13/13, 6/6), 38 plików `ai-*.cjs`
uruchomionych indywidualnie (`ai-buduje-budynki-test.cjs` pominięty jak w rundzie 1 — Vite/Chromium).
4 pliki z przedistniejącymi czerwonymi zweryfikowane bit-do-bitu wobec tymczasowego worktree na
`6a40594b`: identyczne liczby przed/po (7/1, 21/1, 33/5, 291/4) — zero nowych regresji. Kluczowe:
NIE zaufałem opisom w kodzie/raporcie dla twierdzeń o "realnym bonusie" — odtworzyłem własnym
harnessem (esbuild, ten sam wzorzec co bramki tematu) wiele scenariuszy mutacyjnych osobno dla
zagrożenia i granicy, oraz zbisekowałem próg Spichlerza (8→9).

## Ustalenia

Punkty ratyfikacji zweryfikowane pozytywnie: tsc/5 bramek/rodzina ai-* (bez regresji); pokrycie
42/42 dla major AI i miast-państw (bramka D); miasta-państwa nietknięte (gałąź defensiveCopy bez
zmian, ai-mp-*/ai-cs-* zielone, 42/42 utrzymane); bonus zagrożenia (`AI_MAJOR_WALL_THREAT_BONUS=180`)
realnie zmienia wybór AI na świeżym mieście z pełnym katalogiem konkurentów (T8d/T8e, T3a balans —
niezależnie potwierdzone własną mutacją: biblioteka→mury pod wrogiem w zasięgu); próg bezpieczny
Spichlerza (8) zweryfikowany bisekcją — 9 łamie chroniony gate (44/0→41/3), potwierdzone niezależnie.

Cztery niespełnienia poniżej.

## Tabela pokrycia (zweryfikowana niezależnie)

| Zakres | Wynik |
|---|---|
| Major AI, pełny katalog | 42/42 (mury/fort/baszta odblokowane, P-AI-008 usunięta) |
| Miasto-państwo (defensiveCopy) | 42/42 (nietknięte) |
| Katalog łącznie (`buildings.json`) | 42 |

## Tabela priorytetów wszystkich 42 budynków per epoka (wyliczona z danych — Operator jej NIE dostarczył, patrz zarzut #3)

Metoda: `base(grupa) + archetypeBonus − 0.3×kosztBudowy + wyjątek udokumentowany` — dokładne stałe
z `ai.ts` (`GROUP_BUILDING_BASE`, `GROUP_BUILDING_COST_WEIGHT`), profil neutralny 5/5/5, trudność
normal (economyScore=120, militaryScore=100, scienceScore=100), bez bonusu zagrożenia/granicy
(warunkowy, nie bazowy). Sortowanie malejąco wg score w obrębie epoki.

| Epoka | Budynek | Grupa | Koszt | Score (bez wyjątku) | Wyjątek | Score końcowy |
|---|---|---|---:|---:|---|---:|
| 1 | studnia | Zdrowie | 15 | 265.5 | — | 265.5 |
| 1 | garncarnia | Produkcja surowców | 18 | 254.6 | — | 254.6 |
| 1 | stolarnia | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | kamieniarski | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | spichlerz | Żywność | 20 | 244.0 | +8 (runda 2) | 252.0 |
| 1 | targowisko | Handel i pieniądz | 25 | 232.5 | — | 232.5 |
| 1 | dom_starszyzny | Prawo i administracja | 25 | 222.5 | — | 222.5 |
| 1 | garnizon | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 1 | palac | Prawo i administracja | 40 | 218.0 | — | 218.0 |
| 1 | kamienne_kregi | Wiara | 18 | 184.6 | — | 184.6 |
| 1 | palisada | Wojsko i obrona | 22 | 183.4 | — | 183.4 |
| 1 | stela | Nauka i kultura | 15 | 175.5 | — | 175.5 |
| 2 | koszary | Wojsko i obrona | 25 | 182.5 | +110 | 292.5 |
| 2 | biblioteka | Nauka i kultura | 25 | 172.5 | +90 | 262.5 |
| 2 | akwedukt | Zdrowie | 30 | 261.0 | — | 261.0 |
| 2 | cegielnia | Produkcja surowców | 22 | 253.4 | — | 253.4 |
| 2 | odlewnia_brazu | Produkcja surowców | 28 | 251.6 | — | 251.6 |
| 2 | kuznia | Produkcja surowców | 30 | 251.0 | — | 251.0 |
| 2 | spichlerz_ii | Żywność | 35 | 239.5 | — | 239.5 |
| 2 | magazyn | Handel i pieniądz | 20 | 234.0 | — | 234.0 |
| 2 | mennica | Handel i pieniądz | 28 | 231.6 | — | 231.6 |
| 2 | port | Handel i pieniądz | 30 | 231.0 | — | 231.0 |
| 2 | trybunal | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 2 | dwor_zarzadcy | Prawo i administracja | 45 | 216.5 | — | 216.5 |
| 2 | palac_ii | Prawo i administracja | 60 | 212.0 | — | 212.0 |
| 2 | swiatynia | Wiara | 25 | 182.5 | — | 182.5 |
| 2 | mury | Wojsko i obrona | 35 | 179.5 | +180 pod zagrożeniem / +60 przygraniczne (warunkowo) | 179.5 (bazowo) |
| 3 | laznia_publiczna | Zdrowie | 50 | 255.0 | — | 255.0 |
| 3 | odlewnia_zelaza | Produkcja surowców | 35 | 249.5 | — | 249.5 |
| 3 | akademia | Nauka i kultura | 70 | 159.0 | +90 | 249.0 |
| 3 | kuznia_zelaza | Produkcja surowców | 60 | 242.0 | — | 242.0 |
| 3 | port_wielki | Handel i pieniądz | 55 | 223.5 | — | 223.5 |
| 3 | sad | Prawo i administracja | 55 | 213.5 | — | 213.5 |
| 3 | pretorium | Prawo i administracja | 75 | 207.5 | — | 207.5 |
| 3 | palac_iii | Prawo i administracja | 90 | 203.0 | — | 203.0 |
| 3 | warsztat_oblezniczy | Wojsko i obrona | 65 | 170.5 | +180/+60 (warunkowo, MAJOR_FORTIFICATION nie obejmuje) | 170.5 |
| 3 | fort | Wojsko i obrona | 70 | 169.0 | +180/+60 (warunkowo) | 169.0 (bazowo) |
| 3 | baszta | Wojsko i obrona | 70 | 169.0 | +180/+60 (warunkowo) | 169.0 (bazowo) |
| 3 | akademia_wojskowa | Wojsko i obrona | 80 | 166.0 | — | 166.0 |
| 3 | teatr | Nauka i kultura | 55 | 163.5 | — | 163.5 |
| 4 | wielka_odlewnia | Produkcja surowców | 80 | 236.0 | — | 236.0 |
| 4 | wielka_kuznia | Produkcja surowców | 90 | 233.0 | — | 233.0 |

Uwaga: `warsztat_oblezniczy` NIE jest w `MAJOR_FORTIFICATION_IDS` (tylko mury/fort/baszta) — nie
dostaje bonusu zagrożenia/granicy mimo bycia w grupie "Wojsko i obrona"; to zgodne z zakresem
ratyfikacji (dotyczyła wyłącznie fortyfikacji), nie zarzut.

## Tabela dowodowa — mutacje/pomiary niezależne (nie w raporcie Operatora)

| Test | Scenariusz | Wynik | Wniosek |
|---|---|---|---|
| Threat, świeże miasto (jak T8d) | miasto bez budynków, wróg w zasięgu vs brak | brak zagrożenia→biblioteka; zagrożenie→mury | bonus zagrożenia REALNY na konkurencyjnym polu kandydatów |
| Border-only, świeże miasto | jak wyżej, territoryNodes obcego zamiast wroga | bez granicy→stolarnia; z granicą→stolarnia (BEZ ZMIANY) | bonus graniczny BEZ efektu w tym samym typie scenariusza co działający próg zagrożenia |
| Border-only, sweep budowy (0→38 budynków) | dodawanie po jednym budynku, sprawdzenie flipu | pierwszy flip dopiero na kroku 27/38 | bonus graniczny zaczyna działać dopiero gdy katalog niemal wyczerpany |
| Asercja (a)/(a2) bramki D | "prawie cały katalog zbudowany" (39/42) | baseline BEZ ŻADNEGO bonusu też zwraca 'mury' (jedyny afordowalny kandydat) | asercje (a)/(a2) przechodzą niezależnie od istnienia bonusu — puste wg reguły samooszukiwania |
| Bisekcja Spichlerza | AI_MAJOR_SPICHLERZ_PRIORITY_BONUS 8→9 | ai-jednostki-tylko-zakup-test: 44/0 → 41/3 | twierdzenie Operatora o progu bisekcji POTWIERDZONE |
| Pozycja Spichlerza (canAfford blokuje jednostki, 3 miasta, tura 60) | przed rundą 2 vs po | 12/39 → 11/42 | jakościowo zgodne z "8-11. pozycji"/"11→10" Operatora, ale nieodtwarzalne 1:1 (brak wydrukowanego śladu w raporcie) |
| Regresja rodziny ai-* (4 pliki czerwone) | worktree na `6a40594b` vs HEAD | 7/1, 21/1, 33/5, 291/4 identyczne | brak nowych regresji potwierdzony niezależnie |

## Zarzuty

Patrz pole `zarzuty` (4 pozycje, ponumerowane, bez etykiet ról).

RUNDY: 2/5
NASTĘPNY KROK: Operator odpowiada na 4 zarzuty (Obrona rundy 2) na tej samej gałęzi, LUB
orkiestrator rozstrzyga nowe DECISION_REQUIRED (magnitude bonusu granicznego) razem z istniejącym
DECISION_REQUIRED Spichlerza, jeśli uzna zarzuty #3/#4 za czysto proceduralne (dostarczyć brakującą
tabelę/ślad bez zmian logiki).
DEPLOY/PUSH: NIE WYKONANO
