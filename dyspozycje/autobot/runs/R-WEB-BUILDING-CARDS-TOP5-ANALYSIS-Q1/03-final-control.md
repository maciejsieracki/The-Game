STATUS: PASS
DOMAIN: GAME (WEB) — analiza i propozycja treści, bez zmian w kodzie gry
TEMAT: R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1
GOAL: Etap 2/5 kart: FINALNE TOP 5 dla 43 budynków z dowodem plik:linia (trzeci turniej FC dla niezgodnych + próbka zgodnych).
ROLA: Final Control r1 · Data: 2026-11-08 · Baza: origin/main d36f8b3b0

## 1. Integracja wejścia (linia do integracji)

Gałąź `worktree-wf_9d690c14-e3b-4` = `origin/main` d36f8b3b0 + cherry-pick (bez konfliktów) w kolejności:
Operator 4886c8b5a → 1cad4e0d8, 1902ab85b → b2ec5e435; Obrona 7390d3bb6 → 0ebec71ea; Evaluator 6709e4509 → 140c345d3, 415339a41 → a087b4b4e; potem commit FC.
Operator i Obrona pracowali na 397f84f29, Evaluator na d36f8b3b0 — jedna liniowa historia na aktualnym `main` usuwa potrzebę merge.

## 2. Zarzuty Evaluatora — orzeczenia

| # | Zarzut | Orzeczenie | Dowód FC (sprawdzone samodzielnie na d36f8b3b0) |
|---|---|---|---|
| 1 | Spichlerz Królewski: dodać „70% zapasu po wzroście” | **ODDAL** | `economy.ts:1150-1155` żyje tylko w `populationGrowth` (`:1107`); grep `populationGrowth` w `gra/src`: brak wywołań (tylko definicja i komentarze), wołają ją wyłącznie testy `gra/tools/growthmult-compound-test.cjs`, `spichlerz-wzrost-test.cjs`. Tura: `applyFractionalGrowthV85` (`population-growth-v85.ts:306-342`, wołane `:567`) — ułamek wzrostu, brak magazynu do zachowania. Obrona słusznie przeniosła też 50% Spichlerza I na listę martwych (§8). Zastępcze premie są żywe: `spichlerzRationFoodCostMultiplier` → `computeCityRationCost` (`population-growth-v85.ts:213-223`, `turn-economy.ts:1671`), `spichlerzHealthBonus` (`turn-economy.ts:2023`), `spichlerzGrowthBonusPercent` (`population-growth-v85.ts:266`). |
| 2 | Świątynia: brak szerzenia religii | **ODDAL** (naprawione w Obronie) | `society-params.json:504-510` (normal 1), `culture-religion.ts:1064`, `main.ts:37718-37730` (`hasSwiatynia` → `spreadReligion`). |
| 3 | Targowisko: Top1 warunkowy; +2 zdrowia poza TOP | **ODDAL** (Top1 naprawione w Obronie; reguła E1-B2 zatwierdzona) | +50% tras = 0 bez trasy (`main.ts:4212-4216`). +2 zdrowia (`turn-economy.ts:420,485`) działa na wzrost tylko przez `floor(zdrowie/10)` (`population-growth-v85.ts:268-269`) — skok co 10 pkt; przegrywa z „Warunkiem Mennicy” (bramka ×1,5 podatku). Pozycja wraca automatycznie przy Q2 = B; nie jest to brak FC. |
| 4 | Etap 4: 23 → 22 ulepszenia | **ODDAL** (naprawione w Obronie) | `json.load`: 24 klucze, `_meta`, `_miasto_zasieg_ref` → 22; `units.json` 75. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0 nowych (Q1–Q7 z §10 analizy bez zmian, w tym Q2 dla +2 zdrowia Targowiska).

## 3. Trzeci turniej FC — budynki niezgodne lub zmienione w Obronie (7)

Kryteria i wagi jak §1.2 etapu 1 (S×3, N×3, B×2, Z×2, O×2, C×1; maks. 65), normal. E1-B2: efekt wart 0 bez stanu gry, którego budynek sam nie zapewnia, nie może być Top1, gdy istnieje efekt bezwarunkowy (decyzja właściciela (4): Top1 = korzyść od ręki).

| Budynek | Operator r1 | Evaluator (ślepy) | Obrona | FC: pojedynek o Top1 (suma) | FINALNE Top1 | Głosy |
|---|---|---|---|---|---|---|
| Targowisko | +50% z tras | +5 pieniądza | +5 pieniądza | +5 pieniądza (3,1,2,2,4,5 = 33) vs +50% tras (44, ale E1-B2) | +5 pieniądza | 3:1 |
| Port handlowy | +1 trasa | +5 pieniądza | +5 pieniądza i +1 Pracy | +5 pieniądza (bezwarunkowe) vs slot trasy (E1-B2) | +5 pieniądza i +1 Pracy | 3:1 |
| Emporion | slot trasy | slot trasy | +8 pieniądza | +8 pieniądza (S3: najwyższy płaski dochód handlowy) vs slot trasy (0 bez partnera, E1-B2) | +8 pieniądza | 2:2 → FC rozstrzyga regułą (4)/E1-B2 |
| Pretorium | −30% korupcji | Prawo | −30% korupcji | −30% korupcji (S4 N3 B4 Z2 O4 C4 = 48; `economy.ts:1226-1253`, od zbudowania) vs Prawo 33→38 (+5 pkt) | −30% korupcji | 3:1 |
| Spichlerz | limit 5→8 | limit 5→8 | limit 5→8 | bez sporu o Top1; bufor 50% → martwy (zarzut 1) | limit ludności 5→8 | 4:0 |
| Spichlerz Królewski | limit 8→12 | limit 8→12 | limit 8→12 | bez sporu o Top1; bufor 70% → martwy; Top2 −50% racji (37) > +1500 pojemności | limit ludności 8→12 | 4:0 |
| Świątynia | religia +4% | konwersja religii | religia +4% | to samo zjawisko (konwersja/tempo religii w mieście); szerzenie na sąsiadów = Top2 (pewność ŚREDNIA, 0 na trudnym) | religia +4%/turę | 4:0 (treściowo) |

Kolejność Top2–Top5 w tych 7 budynkach: zgodna z rankingiem Obrony (`turnieje/<id>.md`), FC nie zmienia.

## 4. Próbka zgodnych (9 ≥ 8) — Top1 i liczby sprawdzone w kodzie

| Budynek | FINALNE Top1 | Dowód FC |
|---|---|---|
| Mennica | ×1,5 podatku w każdym mieście (×1,62/×1,38) | `econ-params.json:585-591` (opis: tylko podatek miejski, bez tras; wymaga Waluty i Złota) |
| Koszary | rekrutacja jednostek Brązu i Żelaza | `production.ts:1068-1076` (`epochNumber>=2 && !built.has('koszary')` → pomija) |
| Cytadela (fort) | +100% Obrony ponad Mury (razem +300%) | `city-defense.ts:60-75`, `miasto-params.json:84` |
| Akwedukt | limit ludności 20 | `econ-params.json:45` `akwedukt_max_ludnosci`; `population-growth-v85.ts:519` |
| Biblioteka | +30% Nauki | `econ-params.json:320` |
| Magazyn | +20% bazy pojemności magazynu państwa | `econ-params.json:613-618`, `economy-upkeep.ts:322,370-371` |
| Garnizon | Milicja 1/mieszkańca | `combat-params.json:51-58` |
| Warsztat oblężniczy | +10% parametrów (ścieżka do +50%) | `unit-building-bonuses.ts:9-33` (potwierdzone przez Evaluatora; spójne z Koszarami) |
| Port wielki | +10 pieniądza i +2 Pracy | `buildings.json:409` (baza), zgodne z Evaluatorem |

Wszystkie 9: zgodne z ślepym Evaluatorem i z kodem. Brak zarzutu.

## 5. Macierz zgodności po Obronie (przeliczona różnicowo od macierzy Evaluatora 415339a41 na 7 zmienionych budynkach)

- Top1: 38/40 zgodnych (było 37/40): +Targowisko, +Port, −Emporion; Pretorium bez zmian (niezgodne).
- Efekty Evaluatora w FINALNYM TOP: 127/130 (97,7%): +Świątynia szerzenie, −Spichlerz bufor 50% (martwy), dalej brak: Spichlerz Królewski bufor 70% (martwy), Targowisko +2 zdrowia (Q2).
- Budynków ze zgodnością ≤ 2/5: 0. Pełnej macierzy 43×5 od zera FC nie liczył (NIE_ZMIERZONO).

## 6. Zmiany FC (commit FC)

- Odwołania `main.ts` przesunięte o +18 linii do bazy d36f8b3b0 (FALA 558 dodała 5+9+4 linii przed l. 2460; `git diff -U0 397f84f29 d36f8b3b0 -- gra/src/main.ts`): `4194-4198→4212-4216`, `25922-25927→25940-25945`, `37700-37712→37718-37730`, `38297→38315`; treść każdej linii porównana 1:1 między bazami. W `bldata.py`, `ANALIZA-KART-BUDYNKOW.md`, wygenerowanym CSV i turniejach (Targowisko, Świątynia).
- `gen.py`: Status_TOP5 = „FINALNE (Final Control r1, baza d36f8b3b0)” (40 budynków); 3 × NIE_USTALONO bez zmian.
- `ANALIZA-KART-BUDYNKOW.md`: §5 status FINALNE, §12 zgodność, nowy §13 (rozstrzygnięcia).

## 7. Bramki (wykonane samodzielnie)

- `python3 -I .../narzedzia/gen.py <worktree>` na d36f8b3b0: rc=0, sprawdzenie plik:linia OK; drugi przebieg bez różnic (idempotentny). Przed zmianami FC wynik był bajtowo identyczny z commitem Obrony.
- CSV: BOM tak, CR = 0, 43 wiersze, 16 kolumn; 40 × FINALNE, 3 × NIE_USTALONO; 123 pozycje TOP (+3 wiersze NIE_USTALONO).
- `git diff --check`: czysto. Pliki pomocnicze generatora (`tables.md`, `stats.json`, `__pycache__`) usunięte.
- Allowlista: `git diff --name-only d36f8b3b0 HEAD` — tylko `dyspozycje/analizy/karty-budynkow/**` i `dyspozycje/autobot/runs/R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1/**`; `gra/**`: 0 zmian.

## 8. Kolejność integracji

Temat dokumentacyjny web — integracja do `main` (FF z d36f8b3b0, jeśli `main` nie ruszył; inaczej rebase/merge bez konfliktów, bo zmiany tylko w allowliście). Nie dotyczy `origin/rust-port/parity-v2` (d6414fcf1): brak zależności i kolejności — nie scalać tam; parity-v2 może pobrać przy najbliższym REPIN-ie dokumentacji, niezależnie.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator — integracja SHA FC do `main`, push; pytania ABC Q1–Q7 (§10 analizy) do właściciela; potem wdrożenie W2 (karty budynków w kodzie).
DEPLOY/PUSH: NIE WYKONANO
