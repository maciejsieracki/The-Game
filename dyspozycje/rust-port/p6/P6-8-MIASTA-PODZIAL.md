# P6.8 — Miasta: ekonomia, produkcja, budynki, okolica — rekonesans i podział

**Temat:** `R-RUSTPORT-P6-8-MIASTA-REKONESANS-Q1` · **Runda:** 1/5 · **Rola:** Operator · **Status:** dokument, ZERO zmian kodu (`rust-port/**`, `gra/**`, `src-tauri/**` nietknięte).

**Baza:** `rust-port/parity-v2` @ `4c005237` (REPIN-EKONOMIA-B2 zintegrowane, silnik 1388/0 wg LEDGER).
**Pin webu (cel):** `91dc998a5f1b51ad29e0f4785edfd45655445c53`. **Pin dotychczasowy:** `edb8fb56`. Pinu nie przesuwano.

**Źródła kontekstu (docs-branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):** `p6/P6-0-GAP-ANALYSIS.md` (§3 wiersze P6.8, §6b backlog), `REPIN-DELTA-20261029.md` (§3, §5), `PLAN-AKTUALIZACJA-20261029-B.md`, `GOAL-RUST-PORT-20261020.md`, `LEDGER.md`, dispatche `R-RUSTPORT-REPIN-EKONOMIA-{B2,B3,C,D}-Q1`.

**Uwaga o źródle listy 18 pozycji:** `PLAN-PORT-RUST-TAURI-20261020.md` wymienia P6.6–P6.8 tylko ogólnie (§P6.8, linia ~205). Listę 18 pozycji przejęto z `P6-0-GAP-ANALYSIS.md` (tabela 1a: P6.8 = 1 CZ.nazwa + 11 CZ.domena + 6 BRAK = 18). Zgodne z dispatchem.

---

## 0. Metoda i komendy weryfikacyjne

| Co | Komenda (uruchomiona w worktree) | Wynik |
|---|---|---|
| Wersje weba 91dc998a do odczytu poza repo | `git archive 91dc998a5f1b51ad29e0f4785edfd45655445c53 gra/src gra/data` → rozpakowane do `scratchpad/web91/` (poza repo) | OK |
| LOC 18 plików @91dc998a | `wc -l <18 plików>` w `scratchpad/web91/gra/src/game/` | suma **10150** |
| Liczba funkcji top-level | `grep -cE '^(export )?(async )?function \|^(export )?const [A-Za-z_0-9]+ *(: *[^=]+)?= *(\(\|async \()'` | suma **304** (heurystyka regex, NIE_ZMIERZONO dokładnie: nie liczy metod klas ani funkcji zagnieżdżonych) |
| Zakres zmian edb8fb56→91dc998a | `git diff --stat edb8fb56 91dc998a -- <18 plików>` | tylko **6** z 18 plików zmienionych: +393 / −275 |
| Hunki zmian | `git diff -U0 edb8fb56 91dc998a -- <plik> \| grep -c '^@@'` | economy.ts **41**, production.ts **44**, society-breakdown.ts 1, wealth.ts 1, auto-improvements.ts 1, relief-preserving-improvements.ts 2 (razem **90**) |
| Cytowania Rust | `git grep -nE '(<basename>)\.ts' HEAD -- rust-port/engine/src` | patrz §1 kolumna „cytowania” |
| Kolizja z mapgen (landsea) | `git grep -n -i landsea HEAD -- rust-port/engine/src` | 0 wspólnych ścieżek z allowlistami P6.8 (trafienia tylko `data/derived.rs` — tabele mapgen, poza wszystkimi allowlistami tematów §3) |
| Graf importów | `grep -oE "from '\./[^']+'" <plik>` na kopii 91dc998a | patrz §2 |

Różnice LOC względem `P6-0-GAP-ANALYSIS.md` (starszy pin) są znaczące, np. production.ts 2233 → **2541**, economy-upkeep.ts 1083 → **1174**, society-breakdown.ts 1058 → **1172**, wealth.ts 228 → **271**, auto-improvements.ts 997 → **1051**, okolica.ts 760 → **815**. Liczby w tym dokumencie są z pinu 91dc998a.

---

## 1. Tabela 18 pozycji

Status: z GAP (heurystyka nazwy/ścieżki, „heur.”). **PORTOWANE: 0** — żadna z 18 pozycji nie ma pełnego pokrycia funkcji w Rust (NIE_ZMIERZONO na poziomie funkcji dla wszystkich). Cytowania = wynik `git grep` z §0 (`web:` lub nazwa pliku w komentarzu).

| # | Plik web (91dc998a) | LOC / fn | Status (GAP) | Moduł Rust (GAP, pierwszy pub) | Cytowania Rust (grep) | Zmiany edb8fb56→91dc998a | Temat docelowy |
|---|---|---|---|---|---|---|---|
| 1 | `auto-improvements.ts` | 1051 / 4 | CZĘŚC. (domena) | `domain/improvements.rs:425` | brak | M, 1 hunk @58: zmiana kolejności `AI_IMPROVEMENT_PRIORITY` (kopalnia_cyny przed kopalnia_zelaza) — **behawioralna** | T9 |
| 2 | `building-upgrades.ts` | 248 / 14 | CZĘŚC. (domena) | `domain/improvements.rs:425` | brak | — | T1 |
| 3 | `citizen-resource-upkeep.ts` | 353 / 4 | CZĘŚC. (domena) | `domain/resource_production.rs:150` | brak (`economy-upkeep.ts:967` cytowany w `derived.rs:132`, nie ten plik) | — | T4 |
| 4 | `cyna-access.ts` | 89 / 5 | BRAK | — (`data/economy_society.rs` tylko parametry, bez `hasCynaAccess`) | brak | — | T8 |
| 5 | `economy-upkeep.ts` | 1174 / 42 | CZĘŚC. (domena) | `domain/turn_economy.rs:340` | `city_growth.rs:844` (`magazynEraMultiplier`), `derived.rs:132,4303` | — | T5 |
| 6 | `economy.ts` | 1243 / 23 | CZĘŚC. (domena) | `domain/turn_economy.rs:340` | `improvements.rs:655` (TileYield, :256); `city_growth.rs:892,917` (:1145, :1163) | M, **41 hunków** (REPIN-EKONOMIA-D) | T6 |
| 7 | `gold-deficit.ts` | 250 / 13 | CZĘŚC. (domena) | `domain/turn_economy.rs:340` | brak | — | T4 |
| 8 | `mennica-zloto-grace.ts` | 108 / 7 | BRAK | `domain/turn_economy.rs:340` (brak logiki) | brak | — | T4 |
| 9 | `okolica.ts` | 815 / 31 | CZĘŚC. (domena) | `domain/city_growth.rs:14` (pierwszy pub, nie logika okolicy) | `improvement_build.rs:815` (`hexKeysWithinRadius`, okolica.ts:66); `city_growth.rs:534` (`rebalanceWorkersAfterPopulationChange` — **niezaportowane**, komentarz) | — | T7 |
| 10 | `pending-improvements.ts` | 74 / 2 | BRAK | `domain/improvements.rs:425` | brak | — | T1 |
| 11 | `production.ts` | 2541 / 74 | CZĘŚC. (domena) | `domain/resource_production.rs:150` + częściowo `domain/building_costs.rs`, `domain/production_units.rs` | `building_costs.rs:209,1578–1784` (B2: buildingWorkCost, unitMoneyCost, rabaty cywilizacji), `production_units.rs:23,34` (epoka, newestAvailableSameTypeUnit), `derived.rs:218` | M, **44 hunki** (B2 zintegrowało część) | T1 / T2 / T3 (wg zakresu linii, §3) |
| 12 | `relief-preserving-improvements.ts` | 43 / 2 | BRAK | — | brak | M, 2 hunki: dodanie `'tartak'` do zbioru jawnych kluczy (**behawioralna**) + komentarz | T9 (absorbuje REPIN-C5) |
| 13 | `resource-access.ts` | 362 / 16 | CZĘŚC. (domena) | `domain/resource_production.rs:150` | brak | — | T8 |
| 14 | `society-breakdown.ts` | 1172 / 36 | BRAK | — (`domain/ids.rs:44` tylko stała `-99`) | `ids.rs:44` (`society-breakdown.ts:206`) | M, +33 (nowa funkcja `applyCivMatrixHappinessModifier`, :1077–1118) — **behawioralna** | T10 |
| 15 | `society-inputs.ts` | 122 / 7 | CZĘŚC. (domena) | `data/economy_society.rs:839` | brak | — | T8 |
| 16 | `wealth.ts` | 271 / 10 | CZĘŚC. (nazwa) | `domain/state.rs:172`; `data/economy_society.rs` | brak | M, +20 (`WealthParams`, :58–77) — typ/parametry, **do potwierdzenia w T4** | T4 |
| 17 | `zelazo-access.ts` | 89 / 5 | BRAK | — (brak `hasZelazoAccess`) | brak | — | T8 |
| 18 | `zloto-access.ts` | 145 / 9 | CZĘŚC. (domena) | `data/economy_society.rs:839` | `building_costs.rs:913,925` (`empireZlotoStock`, `ownerCanFeedMennica`) — częściowo | — | T8 |

Sumy: CZĘŚC. domena 11 (poz. 1,2,3,5,6,7,9,11,13,15,18), BRAK 6 (4,8,10,12,14,17), CZĘŚC. nazwa 1 (16) — zgodne z GAP §1a.

---

## 2. Graf zależności (importy między pozycjami P6.8 i spoza nich)

- `production.ts` → `building-upgrades.ts` (poz. 2), `building-stock-cost`, `building-cost-tempo`, `building-resource-gate`, `civ-matrix`, `difficulty-cost`, `manpower` (P6.5, zamknięte), `r-stawki-strojenie`, `unit-cost-tempo`, `cities`.
- `economy.ts` → `production.ts`, `civ-matrix`, `tech-tree`, `terrain-improvements` (P6.3, zamknięte).
- `economy-upkeep.ts` → `economy.ts`, `production.ts`, `building-stock-cost`, `r-stawki-strojenie`.
- `okolica.ts` → `economy.ts`, `culture-religion`, `terrain-improvements`, `cities`.
- `auto-improvements.ts` → `okolica.ts`, `improvement-tech`, `terrain-improvements`, `cities`.
- `resource-access.ts` → `okolica.ts`, `zloto-access.ts`, `braz-access`, `livestock-unlock`, `terrain-improvements`.
- `pending-improvements.ts` → `improvement-tech`. `building-upgrades.ts` → `unit-building-bonuses`. `gold-deficit.ts` → `combat` (P6.13, poza tematem).
- Bez importów wewnętrznych P6.8: `citizen-resource-upkeep`, `mennica-zloto-grace`, `relief-preserving-improvements`, `wealth`.
- `society-breakdown.ts` → `cities`, `order`. `society-inputs.ts` → `capital-capture`, `cities`, `culture-religion`, `order`. `cyna-access`, `zelazo-access`, `zloto-access` → `terrain-improvements`.

**Konsekwencja dla kolejności:** łańcuch `production` (T1 → T2 → T3) jest podstawą dla `economy` (T6) → `economy-upkeep` (T5) i `okolica` (T7) → `auto-improvements` i `resource-access` (T9, T8). Pozycje bez importów (T4, T10) mogą startować od razu.

---

## 3. Podział na 10 tematów wykonawczych

**Odstępstwo od kryterium dispatchu (ZAŁOŻENIE Z-1):** dispatch żąda „≤10 tematów, każdy ≤ ~8 funkcji lub ≤ ~600 LOC”. Przy 304 funkcjach i 10150 LOC oba warunki są jednocześnie niemożliwe (10 tematów × 8 fn = 80 < 304; 10 × 600 = 6000 < 10150). Przyjęto: **limit 10 tematów** (twardszy) i rozmiar ≤ ~1200 LOC / ≤ ~45 fn na temat; wykonanie w partiach ≤ 4 funkcje (procedura REPIN-EKONOMIA), commit po partii. Pokrycie linii `production.ts` jest pełne: 1–682 → T1, 682–1252 → T2, 1253–1976 → T3, 1977–2541 → T2.

| ID tematu | Pozycje (poz. z §1) | Plik(i) web, LOC / fn | Razem LOC / fn | Allowlista Rust (nowe pliki oznaczone NOWY) | Zależy od | Fala |
|---|---|---|---|---|---|---|
| **R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1** | 11 (cz. 1–682), 2, 10 | production.ts 1–682 (20 fn; koszty, epoka, itemCost, buildingWorkCost, unitMoneyCost, rabaty), building-upgrades 248/14, pending-improvements 74/2 | **1004 / 36** | `domain/building_costs.rs`, `domain/production_units.rs`, `domain/improvements.rs`, `tests/p6_8a_produkcja_koszty.rs` (NOWY) | — (B2 zintegrowane) | 1 |
| **R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1** | 11 (682–1252 i 1977–2541) | production.ts: availableProduction, availableReplacementsFor, nacje, rush, rekrutacja, praca/podział, eraBuildingCatalog, splitOutput (17 + 22 fn) | **1135 / 39** | `domain/production_units.rs`, `domain/recruitment.rs` (**KOLIZJA z B3**), `domain/resource_production.rs`, `tests/p6_8b_dostepnosc.rs` (NOWY) | 8A; REPIN-B3 zamknięte dla `recruitment.rs` | 2 |
| **R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1** | 11 (1253–1976) | production.ts: enqueue, dequeue, filterQueue, promoteToFront, insertAtFront, advanceProduction, sanitizeBuildQueue, bank* (15 fn) | **724 / 15** | `domain/production_queue.rs` (NOWY), `domain/production_units.rs`, `tests/p6_8c_kolejka.rs` (NOWY) | 8A, 8B (wspólny `production_units.rs`, sekwencyjnie) | 2 |
| **R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1** | 3, 7, 8, 16 | citizen-resource-upkeep 353/4, gold-deficit 250/13, mennica-zloto-grace 108/7, wealth 271/10 | **982 / 34** | `domain/resource_production.rs`, `domain/turn_economy.rs`, `data/economy_society.rs`, `tests/p6_8d_utrzymanie.rs` (NOWY) | — (wealth +20: potwierdzić, Z-5) | 1 |
| **R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1** | 5 | economy-upkeep.ts 1174/42 (dopuszczalny podział 5a/5b na granicy funkcji w dispatchu) | **1174 / 42** | `domain/turn_economy.rs`, `tests/p6_8e_utrzymanie_ekonomii.rs` (NOWY) | 8A, 8B, 8F (import `economy.ts`), 8D | 4 |
| **R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1** | 6 | economy.ts 1243/23 (zakres: fn-po-fn **po** zamknięciu REPIN-EKONOMIA-D; D = 41 hunków + nowy `work-tax.ts`) | **1243 / 23** | `domain/turn_economy.rs`, `domain/improvements.rs`, `tests/p6_8f_ekonomia_miasta.rs` (NOWY); `city_growth.rs` **tylko po B3** | 8B; REPIN-D zamknięte | 3 |
| **R-RUSTPORT-P6-8G-OKOLICA-Q1** | 9 | okolica.ts 815/31 | **815 / 31** | `domain/okolica.rs` (NOWY), `domain/improvement_build.rs` (tylko odczyt), `domain/city_growth.rs` (hook rebalansu — **po B3**), `tests/p6_8g_okolica.rs` (NOWY) | 8F; REPIN-B3 zamknięte | 5 |
| **R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1** | 4, 13, 15, 17, 18 | resource-access 362/16, zloto-access 145/9, cyna-access 89/5, zelazo-access 89/5, society-inputs 122/7 | **807 / 42** | `domain/resource_access.rs` (NOWY), `domain/resource_production.rs`, `data/economy_society.rs`, `tests/p6_8h_dostep.rs` (NOWY) | 8G (resource-access importuje okolica); pozostałe 4 pliki mogą startować wcześniej (NASTĘPNA-PARTIA) | 6 |
| **R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1** | 1, 12 | auto-improvements.ts 1051/4 (+ reorder priorytetów), relief-preserving-improvements.ts 43/2 (+`tartak`, absorbuje **REPIN-C5**) | **1094 / 6** | `domain/improvements.rs`, `tests/p6_8i_auto_ulepszenia.rs` (NOWY) | 8G (importuje okolica) | 6 |
| **R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1** | 14 | society-breakdown.ts 1172/36 (+`applyCivMatrixHappinessModifier`, B-residual) | **1172 / 36** | `domain/society_breakdown.rs` (NOWY), `domain/ids.rs`, `data/economy_society.rs`, `tests/p6_8j_spoleczenstwo.rs` (NOWY) | — | 1 |

Suma LOC tematów = 10150 (zgodna z §0). Każda pozycja z §1 ma temat; każdy zakres linii `production.ts` ma właściciela.

### 3a. Kolejność (fale)

- **Fala 1 (start od razu):** 8A, 8D, 8J (brak zależności od P6.8; 8A zaczyna łańcuch production).
- **Fala 2:** 8B po 8A; 8C po 8B (sekwencyjnie, wspólny `production_units.rs`). 8B wymaga zamknięcia REPIN-B3 (`recruitment.rs`).
- **Fala 3:** 8F po 8B i po REPIN-D (`economy.ts`).
- **Fala 4:** 8E po 8F i 8D (oraz 8A/8B).
- **Fala 5:** 8G po 8F i po REPIN-B3 (hook w `city_growth.rs`).
- **Fala 6:** 8H (resource-access) i 8I po 8G. 8I musi zakończyć się przed P6-17 (`improvements.rs`).

Równoległość: 8A ‖ 8D ‖ 8J; 8H (część cyna/zelazo/zloto/society-inputs) może wcześniej, pod warunkiem rozłącznych allowlist.

### 3b. GOAL i ALLOWLISTA — treści do dispatchu (skrót)

- **8A:** GOAL „P6.8A: port `production.ts` 1–682 (koszty/epoka/itemCost/rabaty) + `building-upgrades.ts` + `pending-improvements.ts`, pin 91dc998a, wektory z weba. Start od stanu B2 (`building_costs.rs`).” ALLOWLISTA: §3 kolumna 5.
- **8B:** GOAL „P6.8B: dostępność produkcji, zamienniki, rekrutacja gated, rush, praca/podział, katalog epok (`production.ts` 682–1252 i 1977–2541).”
- **8C:** GOAL „P6.8C: kolejka produkcji (`production.ts` 1253–1976), nowy moduł `production_queue.rs`.”
- **8D:** GOAL „P6.8D: utrzymanie obywateli, deficyt złota, mennica, wealth (`citizen-resource-upkeep`, `gold-deficit`, `mennica-zloto-grace`, `wealth`).”
- **8E:** GOAL „P6.8E: `economy-upkeep.ts` (1174 LOC) — utrzymanie ekonomii.”
- **8F:** GOAL „P6.8F: `economy.ts` fn-po-fn po REPIN-EKONOMIA-D.”
- **8G:** GOAL „P6.8G: `okolica.ts` (worked tiles, rebalans) nowy `domain/okolica.rs`; hook `city_growth.rs` po B3.”
- **8H:** GOAL „P6.8H: dostęp do zasobów (`resource-access`, `cyna/zelazo/zloto-access`, `society-inputs`), nowy `domain/resource_access.rs`.”
- **8I:** GOAL „P6.8I: `auto-improvements.ts` (kolejność priorytetów) + `relief-preserving-improvements.ts` (zbiór `tartak`; zamyka REPIN-C5).”
- **8J:** GOAL „P6.8J: `society-breakdown.ts` (nowy `applyCivMatrixHappinessModifier`, rebel owner -99).”

Każdy dispatch: pin 91dc998a, gates `cargo fmt/clippy/test` w `rust-port/engine` (baseline 1388/0), `git diff --check`, zero zmian w `gra/**`, `WERSJE.md`, `Cargo.toml`, bez `Cargo.lock`.

---

## 4. Kolizje z trwającymi REPIN-EKONOMIA i mapgen

| Kolizja | Ścieżka Rust | Strona A | Strona B | Decyzja (ZAŁOŻENIE) |
|---|---|---|---|---|
| B3 (w toku) | `domain/city_growth.rs` | REPIN-B3 (hunki turn-economy.ts, wg dispatchu) | 8G (hook rebalansu), 8F (ewentualnie) | 8G i ewentualnie 8F startują **po** zamknięciu B3 |
| B3 (w toku, wg notatki orkiestratora) | `domain/recruitment.rs` | REPIN-B3 | 8B (rekrutacja `production.ts` 1977–2210) | 8B **po** zamknięciu B3 dla `recruitment.rs` |
| B2 (zamknięte, `4c005237`) | `domain/building_costs.rs`, `domain/production_units.rs` | część hunków production.ts | 8A, 8B | 8A zaczyna od stanu B2; B2 nie jest powtarzane |
| C5 (nieotwarte) | `gra/src/game/relief-preserving-improvements.ts` | REPIN-C5 | 8I | **8I absorbuje C5** (C5 zamknąć jako „w 8I”) |
| D (w toku/nieotwarte) | `economy.ts`, `work-tax.ts` (nowy) | REPIN-D | 8F | 8F fn-po-fn **po** D; `work-tax.ts` jest poza 18 pozycjami (zostaje w D) |
| B-residual (nieprzypisane) | `wealth.ts` (+20), `society-breakdown.ts` (+33) | brak właściciela w LEDGER | 8D, 8J | Z-5: przypisane do 8D/8J; odnotować w LEDGER |
| C6 (nieotwarte) | `population-growth-v85.ts` | REPIN-C6 (P6.7 domena, poza 18) | `city_growth.rs` | Poza P6.8; kolizja z B3 i 8G w `city_growth.rs` — sekwencyjnie |
| mapgen landsea | `domain/mapgen/landsea.rs` | M-series | — | **0 kolizji** (żadna pozycja P6.8 nie importuje mapgen; brak allowlisty P6.8 na mapgen) |
| mapgen tabele | `data/derived.rs` (`MAPGEN_LANDSEA_*`) | M-series | — | Nie w żadnej allowliście P6.8; jeśli którykolwiek temat dotknie `derived.rs`, najpierw sprawdzić M-series |

Pozostały zakres ekonomii (żeby tematy się nie dublowały): REPIN-EKONOMIA-B3 (turn-economy.ts, 12 hunków), B4+ (reszta z 51 hunków turn-economy.ts; wartość 51 z dispatchu B3, NIE_ZMIERZONO w tym dokumencie), C5 → 8I, C6 → poza P6.8, D → economy.ts + work-tax.ts, B2 → zamknięte. Ślad W Rust: `city_growth.rs` cytuje `turn-economy.ts` (1640, 1662) — to P6.7, nie P6.8.

---

## 5. Plan wektorów

- Generator: wektory z uruchomionego weba **91dc998a** (zakaz `npm run build/dev` w `gra/`; generator w kopii poza repo, wzorzec `gra/tools/*-test.cjs` i wektorów `p6_repin_b2_vectors/*.json`). **NIE_ZMIERZONO**, który generator obsługuje TS bez builda: rozstrzyga operator tematu.
- Każdy temat: `rust-port/engine/tests/p6_8<x>_vectors/*.json`, rozmiar ≤ 10 MB na plik (limit blokujący > 100 MB).
- Nie osłabiać asercji; nowe pliki testów per temat (autotests Cargo, bez wspólnych plików testów).
- Dotknięte istniejące wektory (do przeliczenia tylko, jeśli zmiana je dotyka): `p6_repin_b2_vectors/building_work_cost.json` (8A/8B), `p6_7b_vectors/cost.json` i `pool.json` (8B), `p6_23_vectors/improvements.json` (8I, 8A).

---

## 6. Założenia (luki rozstrzygnięte zamiast pytań)

- **Z-1:** Lista 18 pozycji = P6-0-GAP §1a/§3; źródło PLAN §P6.8 jest ogólne.
- **Z-2:** Kryterium rozmiaru dispatchu jest sprzeczne (§3); obowiązuje limit 10 tematów, ≤ ~1200 LOC / ≤ ~45 fn na temat, wykonanie w partiach ≤ 4 fn.
- **Z-3:** Status „PORTOWANE/CZĘŚCIOWE/BRAK” = status GAP (heur.) skorygowany o `git grep` cytowań. Brak jakiegokolwiek PORTOWANE.
- **Z-4:** Kolizje z B3 (`city_growth.rs`, `recruitment.rs`) przyjęte wg dispatchu i notatki orkiestratora; treść dispatchu B3 wymienia wyłącznie `city_growth.rs`.
- **Z-5:** Hunki `wealth.ts` (+20) i `society-breakdown.ts` (+33) nieprzypisane w LEDGER → 8D i 8J; treść zmian (typ vs logika) NIE_ZMIERZONO.
- **Z-6:** C5 (`relief-preserving-improvements.ts`) absorbowane przez 8I; C5 w LEDGER do zamknięcia.
- **Z-7:** Liczenie funkcji regexem (§0); może pominąć metody i funkcje zagnieżdżone.

## 7. NIE_ZMIERZONO (jawna lista)

- Które z 44 hunków `production.ts` są już zintegrowane przez B2 (numeracja hunków B2 nie została zmapowana na `git diff` w tym dokumencie).
- Pełna treść zmian semantycznych w `economy.ts` (41 hunków), `auto-improvements.ts` (zmiana kolejności — przeczytana), `wealth.ts` (+20 — nieprzeczytana).
- Zgodność funkcjonalna któregokolwiek z 18 modułów z Rust (nie uruchamiano silnika ani weba).
- Lista 51 hunków `turn-economy.ts` i ich podział B3/B4 (poza zakresem; z dispatchu B3).
- Dokładne granice podziału 8E (economy-upkeep 1174 LOC) na partie.

## 8. Komendy kontrolne tego dokumentu

```
git archive 91dc998a5f1b51ad29e0f4785edfd45655445c53 gra/src gra/data   # do katalogu poza repo
wc -l <18 plików>                                                        # suma 10150
git diff --stat edb8fb56 91dc998a -- <18 plików>                        # 6 plików, +393/-275
git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts | grep -c '^@@'      # 41
git diff -U0 edb8fb56 91dc998a -- gra/src/game/production.ts | grep -c '^@@'   # 44
git grep -nE '(<basename>)\.ts' HEAD -- rust-port/engine/src              # cytowania §1
git grep -n -i landsea HEAD -- rust-port/engine/src                       # 0 kolizji z allowlistami
```
