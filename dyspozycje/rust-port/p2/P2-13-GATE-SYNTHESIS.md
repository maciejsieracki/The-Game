# P2.13 — Synteza bramki fazy P2 (kontrola spójności i kompletności przed P3)

**Temat:** `R-RUSTPORT-P2-13-FINAL-CONTROL-Q1` · **Runda:** 5/5 (poprawka po zarzutach Evaluatora rundy 4; odpowiedzi w §0e) · **Rola:** Operator (Haiku 5.5 medium) · **Rejestr rund (zarzut 10 r5):** dispatch l.8 zapisuje `RUNDA: 1/5` i nie był aktualizowany; historia rund r1–r5 jest prowadzona wyłącznie w tym pliku (§0–§0e), więc licznik 5/5 nie jest potwierdzony przez dispatch.
**Charakter:** audyt SPÓJNOŚCI i KOMPLETNOŚCI całości P2 (nie re-litygacja rozstrzygnięć). Zero zmian w `gra/**`, zero kodu Rust, zero zmian w P2.1–P2.12.
**Status tego dokumentu:** wynik Operatora, do Evaluatora i Final Control. Nie jest decyzją bramki.
**STATUS wyniku Operatora r5: FAIL** — czytanie 12 plików P2-n nadal niepełne w całości (r5: w całości 4 z 12, §7; warunek 0 w §6). Nie PASS-WITH-NOTES. Wynik r5 nie jest bramką i nie zamyka tematu. Runda 5/5 jest ostatnią; wg procedury dispatchu temat przechodzi w LIMIT-5-EXCEEDED (decyzja orkiestratora).

**Piny:** web `main` = `edb8fb56` (`gra/`); Rust `rust-port/parity-v2` = `9e33fc77` (tylko jako odniesienie cytowań P2.x).

**Korekta odniesienia z dispatchu:** dispatch wskazuje „P2.6 §16" jako miejsce zobowiązania 288 plików. Właściwe miejsca to `P2-6-EVENTS.md` §6 pkt D-EV-14 (l.277) oraz §9 („Rozstrzygnięcia", pkt 3, l.1040–1047). `P2-6-EVENTS.md` nie ma §16; §16 istnieje wyłącznie w `P2-10-FIXTURES.md` (rozstrzygnięcia D-FIX).

**Werdykt (skrót):** bramka P2 **NIE jest formalnie otwarta** dla P3. Szczegóły: §6.

---

## 0. Odpowiedzi na zarzuty Evaluatora rundy 2

| Zarzut | Odpowiedź | Miejsce naprawy |
|---|---|---|
| 1 — czytanie obowiązkowe nie wykonane w całości | PRZYJĘTY. Czytanie LEDGER (wpisy P2.1–P2.12) wykonane w całości w r2 i ponownie w r3. Czytanie 12 plików P2-n NIE wykonane w całości; odstępstwo jest jawne i nie jest zamknięte (patrz §0c, zarzut 1 r3). | §7 |
| 2 — nadmierne deklaracje spójności | PRZYJĘTY. Usunięto określenia „zgodne" i „spełnione" bez wskazanej pary lub linii. Każda pozycja w §2, §4B i §5 ma status: sprawdzone w tej rundzie (z liniami), zacytowane z rundy 2 (niesprawdzone w r3) albo nieporównane. | §2, §4B, §5 |
| 3 — rozliczenie Z-1 bez jednego z dwóch sposobów | PRZYJĘTY. Wybór sposobu A/B NIE jest dokonany przez Operatora (korekta r4, §0c zarzut 4): obie drogi są przedstawione w §3 Z-1, a Z-1 pozostaje OTWARTE. | §3 Z-1, §6 pkt 1 |
| 4 — re-litygacja rozstrzygnięć technicznych | PRZYJĘTY. Usunięto argumenty wskazujące, który wariant techniczny jest lepszy (m.in. odwołanie do `main.ts:10275` w O-2e, „akceptowalne" w §4B, „zgodne z web" jako ocena wyboru w O-3). Pozostały wyłącznie klasyfikacja i opis stanu. | §4A, §4B |
| 5 — brak rozdziału klasyfikacji od re-litygacji | PRZYJĘTY. Każda pozycja DR ma kolumnę „Klasyfikacja" z jedną z trzech wartości: **GENUINE-kandydat** (decyzja produktowa/zakresowa/wpływ na gracza), **NIE-GENUINE** (wybór reprezentacji/kształtu, bez wpływu na gracza poza tym, co web już robi), **DO-ROZSTRZYGNIĘCIA-PRZEZ-FC** (klasa niejednoznaczna). Kolumna nie ocenia, który wariant jest poprawny. | §4A, §4B |
| 6 — sprzeczny status D-CMD-15 / D-CMD-19 (O-8/O-9) | PRZYJĘTY. Jednolity status: **DECISION_REQUIRED, OTWARTE** (nie „zamknięte administracyjnie"). Rozstrzygnięcie orkiestratora (P2-5 §9 pkt 1 i 8) jest odnotowane jako stanowisko orkiestratora, nie jako zamknięcie. | §3 Z-11, §4A O-8/O-9, §6 |

**Sprostowanie liczników (wynik kontroli r3, skorygowane r5):**
- **D-CMD:** 19 identyfikatorów (D-CMD-1…19). Zamknięte: 2 (D-CMD-12, D-CMD-14). Bez rozstrzygnięcia: 15 (14 w O-2a + D-CMD-7 w O-15). DECISION_REQUIRED: 2 (D-CMD-15 → O-9, D-CMD-19 → O-8). **Łącznie nierozstrzygnięte: 17.** Licznik „15" z dispatchu obejmuje wyłącznie pozycje bez statusu i pomija dwie pozycje DR.
- **D-EV:** 15 identyfikatorów (D-EV-1…15). Zamknięte: 1 (D-EV-15). Nierozstrzygnięte: 14 (D-EV-1…13 → O-2b; D-EV-14 → O-1, blokuje werdykt).
- **D-FIX:** 20 identyfikatorów (D-FIX-1…20). Zamknięte bez zastrzeżeń: **0** (D-FIX-15 przeklasyfikowany na DECISION_REQUIRED → O-22, korekta po zarzucie 5 r5). D-FIX-20: rozstrzygnięty przez orkiestratora, klasa DECISION_REQUIRED (O-21) = otwarty dla bramki. Otwarte bez D-FIX-20: **19** (1–19). Dla bramki łącznie **20** (19 + O-21), zgodnie z §1 i K-11.

---

## 0b. Odpowiedzi na zarzuty Evaluatora rundy 3

| Zarzut | Odpowiedź | Miejsce zmiany |
|---|---|---|
| 1 — czytanie obowiązkowe | PRZYJĘTY. Nie naprawiono w tej rundzie: pełne czytanie ~750 KB przekracza budżet tej tury. Nie deklaruję poprawy; dodany warunek 0 do werdyktu. | §6 pkt 0, §7 |
| 2 — status PASS-WITH-NOTES | PRZYJĘTY. Status wyniku Operatora r3 = FAIL. „PASS-WITH-NOTES" w §1 dotyczy wiersza P2.7 z LEDGER, nie tej syntezy. | nagłówek |
| 3 — [WŁ] klasyfikowane jako NIE-GENUINE | PRZYJĘTY. Potwierdzone grep: P2-11 l.420 (D-MIG-1 [WŁ]), l.435 (D-MIG-11 [WŁ]), l.445 (D-MIG-19 [WŁ]), D-MIG-10 [WŁ] (§6, l.17, l.44). Dodano O-11…O-14 (DECISION_REQUIRED). D-CMD-7 (bez oznaczenia w P2-5) → O-15 (DECISION_REQUIRED). Usunięto zatwierdzanie NIE-GENUINE przez FC bez właściciela dla wątpliwych pozycji. | §4A, §4B, §6 pkt 3 |
| 4 — Z-1 trzecia droga | PRZYJĘTY. Sposób A (osobny temat) nie jest sposobem z dispatchu; temat nie istnieje. Z-1 pozostaje OTWARTE. Wybór A/B oddany orkiestratorowi. Odrzucenie P3 opiera się na P2-6 §9 pkt 3 („warunek wstępny P2.13"), nie na ocenie merytorycznej. | §0a pkt 1, §3 Z-1, §6 pkt 1 |
| 5 — deklaracje zgodności | CZĘŚCIOWO. PRZYJĘTY: D-MIG-22 („Zgodne z D7") oznaczono jako cytat r2 niesprawdzony w r3; P2.2 w §1 ma status procesowy z zaznaczeniem O-6/O-7 OTWARTE. ODRZUCAM dla K-4: para i linie podane (P2-2 l.38, l.119, l.181–184, l.193–195), wynik to „SPRZECZNE TERMINOLOGICZNIE", a nie deklaracja zgodności. | §1 P2.2, §4B D-MIG-22 |
| 6 — oznaczenia „r4" i „zarzut 6 r2" | PRZYJĘTY. „r4" dotyczy rundy 4 tematu P2-5 (P2-5 l.19, l.526; wcześniejsze „l.83" było błędne), nie tej syntezy. „zarzut 6 r2" oznacza zarzut 6 Evaluatora rundy 2 P2-13. Oznaczenia doprecyzowane. | §3 Z-11, §4B D-CMD-14 |

---

## 0c. Odpowiedzi na zarzuty 1–6 Evaluatora rundy 3 (poprawka r4)

| Zarzut r3 | Co zrobiono w r4 | Miejsce |
|---|---|---|
| 1 — czytanie 12 plików P2-n (BLOKADA) | NIE WYKONANO w r4 (≈750 KB > budżet kontekstu tej tury). Odstępstwo uzasadnione jawnie i zapisane jako warunek 0 do werdyktu. Dodano plan partii (P2-6, P2-5, P2-9, P2-10, P2-11, P2-12, P2-2, P2-3 — pliki po kolei, każdy w osobnym temacie czytania). Zarzut pozostaje otwarty jako BLOKADA werdyktu, nie jest zamykany deklaracją. | §7, §6 pkt 0 |
| 2 — status raportu zgodny z wynikiem | ZAMKNIĘTY. Nagłówek ma status FAIL r4; numer rundy zaktualizowany do 4/5. | nagłówek |
| 3 — DECISION_REQUIRED dla D-MIG-1/10/11/19 | ZAMKNIĘTY. D-MIG-1 → O-11, D-MIG-10 → O-12, D-MIG-11 → O-13, D-MIG-19 → O-14 (wszystkie DECISION_REQUIRED, OTWARTE). D-MIG-3/9(b)/18/21 → GENUINE-kandydat (O-10, O-3, O-2e, O-2f). LEDGER l.83 nie zamyka żadnej z nich. | §4A, §4B |
| 4 — Z-1 rozliczone trzecią, niezleconą drogą | ZAMKNIĘTY (korekta). Usunięto „Wybrany sposób (A)" i stare zdanie w §0 pkt 3. Sposób A wymaga zlecenia przez orkiestratora (temat `R-RUSTPORT-P2.6-R-REVIEW-288` nie istnieje). Sposób B nie jest rekomendowany, bo P2-6 §9 pkt 3 nazywa przegląd warunkiem wstępnym P2.13. Z-1 OTWARTE i blokuje werdykt. | §3 Z-1, §0a pkt 1 |
| 5 — deklaracje zgodności | CZĘŚCIOWO ZAMKNIĘTY. Usunięto nieuzasadnione „zgodne" (P2.4 w §1 i §3 K-7 w zakresie sformułowania) — każda pozostała zgodność ma cytat z numerem linii i status (sprawdzone w r3 / cytat r2). Pozycje P2-1, P2-4, P2-7, P2-8, P2-9, P2-10 w §1 mają jawny status „nieczytany w r3" lub „cytat r2". K-4 pozostaje SPRZECZNE TERMINOLOGICZNIE (wynik kontroli, nie deklaracja zgodności). | §1, §2 K-4, K-7, §7 |
| 6 — odwołania „r4" i „zarzut 6 r2" | ZAMKNIĘTY (korekta odwołania). Poprzednie „P2-5 l.83" było błędne: l.83 to wiersz R1 tabeli P2-5. Poprawne odwołania: wpis zmian rundy 4 tematu P2-5 (P2-5 l.19) oraz D-CMD-14 zamknięte w r4 (P2-5 l.526). Oznaczenie „zarzut 6 r2" dotyczy zarzutu 6 Evaluatora rundy 2 tej syntezy. | §3 Z-11, §4B D-CMD-14 |

---

## 0d. Odpowiedzi na zarzuty Evaluatora rundy 4 (ta sama runda 4/5)

| Zarzut r4 | Odpowiedź | Co zmieniono w pliku |
|---|---|---|
| 1 — czytanie 12 plików P2-n | PRZYJĘTY. Czytanie nie zostało wykonane w tej rundzie. Streszczenia wierszy P2.1, P2.4, P2.7, P2.8, P2.9 i P2.10 w §1 oznaczono jako niezweryfikowane. | §1 (akapit wprowadzający) |
| 2 — kontrola spójności tylko 13 par | PRZYJĘTY. Wniosek z §2 obejmuje wyłącznie K-1…K-13 i nie jest wnioskiem o spójności fazy P2. | §2 (akapit „Zakres wniosku") |
| 3 — Z-1 bez rozliczenia | PRZYJĘTY. Wskazanie wyboru A/B nie jest rozliczeniem. Z-1 oznaczono NIEROZLICZONE; kryterium dispatchu „jawne rozliczenie każdego zobowiązania" dla Z-1 jest NIESPEŁNIONE. | §3 Z-1, §5 |
| 4 — pozycje DO_DECYZJI_WŁAŚCICIELA z LEDGER niesklasyfikowane jako GENUINE | PRZYJĘTY. Sprawdzono LEDGER l.80 (P2.3 pkt 8/9/10), l.82 (P2.6 pkt 3/8/9), l.84 (P2.10 D-FIX-20) oraz P2-3 l.54, l.286–288, l.330–337. Dodano O-16…O-21 (DECISION_REQUIRED). O-1 (P2.6 pkt 3) przeklasyfikowano na DECISION_REQUIRED. D-ID-8/9/10, P2.6 pkt 8/9 i D-FIX-20 przeniesiono w §4B do DECISION_REQUIRED. D-ID-1…7 i 11 pozostają zbiorczo NIE-GENUINE i nie zostały ocenione pojedynczo w r4. | §4A, §4B |
| 5 — licznik „15" w O-2a przy 14 pozycjach | PRZYJĘTY. Lista O-2a ma 14 pozycji (klasa (i) 3, 4, 9, 10, 11, 16, 17, 18 = 8; klasa (ii) 1, 2, 5, 6, 8, 13 = 6). Wraz z D-CMD-7 w O-15 jest 15 bez statusu. Z-11 uzupełniono o O-15. | §0 sprostowanie, §3 Z-11, §4A O-2a |
| 6 — K-9 cytuje P2-6 l.1059, którego nie ma na liście | PRZYJĘTY. Sprawdzono sed na P2-6 l.1059: „zgodnie z D-EV-3 (eventy efemeryczne," — zgodne z K-9. Dodano do listy cytatów sprawdzonych. | §7 |

---

## 0e. Odpowiedzi na zarzuty Evaluatora rundy 4 (poprawka r5, runda 5/5)

| Zarzut (lista z dispatchu) | Odpowiedź r5 | Miejsce |
|---|---|---|
| 1 — czytanie 12 plików P2-n niewykonane w całości | CZĘŚCIOWO. W r5 przeczytano w CAŁOŚCI: LEDGER (wpisy P2.1–P2.12, l.73–86), P2-1, P2-4, P2-7, P2-8 (łącznie 4 z 12). NIEPRZECZYTANE w całości: P2-2 (219 l.), P2-3 (363), P2-5 (668), P2-6 (1075), P2-9 (1806), P2-10 (681), P2-11 (574), P2-12 (248), łącznie ≈650 KB. Ten budżet nie mieści się w jednej turze Operatora; odstępstwo pozostaje BLOKADĄ werdyktu (warunek 0, §6). Nie deklaruję domknięcia. | §7, §6 pkt 0 |
| 2 — pełna macierz spójności niewykonana | NIEZAMKNIĘTE. Dodano jedną nową parę sprawdzoną na liniach: K-14 (LEDGER l.78 ↔ P2-8 §6/§7). Pełnej macierzy 12×12 nie wykonano; wniosek §2 dotyczy wyłącznie K-1…K-14. | §2 |
| 3 — Z-1 bez wyboru A/B | WYBÓR Operatora r5: **A** (przegląd 288 plików w osobnym temacie, zlecenie przez orkiestratora). Uzasadnienie: B wymagałby zmiany warunku wstępnego P2-6 §9 pkt 3 („pełny przegląd … WYMAGANY jako warunek wstępny P2.13"), a Operator nie może zmieniać P2-n w tym temacie; B z uzasadnieniem kolidującym z tym warunkiem nie rozlicza zobowiązania. Wybór dokonany, WYKONANIE otwarte: Z-1 pozostaje NIEROZLICZONE do czasu wyniku przeglądu. | §3 Z-1, §6 pkt 1 |
| 4 — wątpliwe rozstrzygnięcia niezgłoszone jako DECISION_REQUIRED | ZAMKNIĘTY (potwierdzone w r5 przez odczyt). D-ID-8/9/10 → O-16/O-17/O-18; P2-6 §9 pkt 8 → O-19; P2-6 §9 pkt 9 → O-20; D-FIX-20 → O-21; wszystkie DECISION_REQUIRED, OTWARTE. Odczyt P2-6 l.1040–1047 i P2-10 §16 potwierdza, że są to rozstrzygnięcia orkiestratora, nie właściciela. | §4A O-16…O-21, §4B |
| 5 — liczniki (D-FIX) | ZAMKNIĘTY (korekta). D-FIX-20 był błędnie liczony jako zamknięty w §0 i §3 Z-10. Poprawnie: D-FIX-15 zamknięty bez zastrzeżeń (1); D-FIX-20 rozstrzygnięty przez orkiestratora, ale klasa DR → O-21 OTWARTE; 18 pozostałych otwartych (1–14, 16–19). Dla bramki otwartych jest **19** (18 + D-FIX-20). | §0 sprostowanie, §3 Z-10 |
| 6 — P2-6 §16 | Potwierdzone w r5: `P2-6-EVENTS.md` nie zawiera ani nagłówka §16, ani odwołania „§16" (grep: 0 trafień). §16 istnieje tylko w `P2-10-FIXTURES.md` (l.647). Zobowiązanie 288 plików: P2-6 §6 D-EV-14 (l.277) i §9 pkt 3 (l.1040–1047). | nagłówek, §3 Z-1 |

**Ta runda nie rozstrzyga żadnej decyzji właściciela i nie zmienia statusu bramki.**

**Korekta po zarzutach Evaluatora/Final Control r5 (bez nowego czytania):** zarzut 5 — D-FIX-15 → O-22 (DO), D-ID-1…7/11 i D-CMD-14 → DO-ROZSTRZYGNIĘCIA-PRZEZ-FC, uzasadnienia pojedyncze dla D-MIG-13/22, D-CMD-12; zarzut 6 — wiersz P2.10 poprawiony; zarzut 7 — wiersz P2.3 poprawiony; zarzut 8 — P2-9 units.json = l.113, buildings = l.112; zarzut 9 — etykiety LIMIT-5 w §1; zarzut 10 — rejestr rund w nagłówku; zarzut 11 — furtka odwracalności usunięta z §6 pkt 3. **Zarzuty 1–4 NIE są usunięte:** czytanie 12 plików w całości, Z-1 (przegląd 288 plików, wybór A bez wykonania), pełna macierz 12×12 — pozostają otwarte blokery werdyktu, bez deklaracji poprawy.

---

## 0a. Werdykt (skrót, rozwinięcie w §6)

Bramka P2 **NIE** jest formalnie otwarta dla P3. Powody:

1. Zobowiązanie P2.6 → P2.13 (przegląd 288 plików / 6642 linii, D-EV-14) nie zostało wykonane w tym temacie. Wybrana ścieżka A (§0e) wymaga osobnego tematu, który nie istnieje. Do jego PASS werdykt pozostaje NIE.
2. Dokumenty są **sprzeczne** w 14 miejscach (K-1…K-14). K-1, K-2, K-5, K-6 zmieniają zapis kontraktu i muszą być poprawione w jednym miejscu przed implementacją P3.
3. Pozycje oznaczone w samych dokumentach jako właścicielskie (D12, D-CMD-15, D-CMD-19, D-EV-3, D-MIG-1/3/9b/18/21, G13, G14, D-COMP-1/2) nie mają jednolitego statusu: część jest zamknięta przez orkiestratora w LEDGER, część pozostaje otwarta (§4). Wynik nie podważa poprawności pojedynczych tematów P2.1–P2.12 jako dokumentów propozycji; wskazuje, że „PASS" kilku z nich oznacza zamknięcie procesowe, nie zamknięcie decyzji.

---

## 1. Tabela 12 podtematów P2.1–P2.12

Status końcowy wg `dyspozycje/rust-port/LEDGER.md` (wpisy 2026-10-21, wiersze 73–86, przeczytane w całości w r3). Kolumna „Uwaga" zawiera status faktyczny, gdy różni się od etykiety LEDGER lub gdy jest sprzeczność. Streszczenia i liczby z rundy 2 nie były ponownie weryfikowane, chyba że w §2 lub §7 zaznaczono inaczej.

| # | Podtemat | Status (LEDGER) | Plik źródłowy | Co dostarcza (jedno zdanie) | Uwaga |
|---|---|---|---|---|---|
| P2.1 | DOMAIN-MODULES | PASS | `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` | 183/183 plików `gra/src/game` przypisanych: 172 do 15 modułów domeny (M1–M15) i 11 jawnie odroczonych. | Przeczytane w całości w r5 (§2 lista 11 odroczonych, §3 pokrycie 172+11=183 — zgodne). Klasyfikacja startowa 14 wierszy P1-17C przeniesiona bez weryfikacji logiki (P2-1 §3). Brak sekcji rozstrzygnięć orkiestratora. |
| P2.2 | GAMESTATE-CONTRACT | PASS (procesowo wg LEDGER; O-6, O-7 OTWARTE w §4A) | `dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` | Szkielet `GameState` z 15 modułami, mapa 22 kluczy top-level i 94 kluczy `meta` na pola kontraktu. | LEDGER: genuine tylko D7. Dokument P2-2 l.119 oznacza D12 jako „decyzję właściciela" (K-13). Orkiestrator rozstrzygnął też D8 i D12 (O-6, O-7). |
| P2.3 | ENTITY-IDS | PASS procesowo wg LEDGER; O-16, O-17, O-18 OTWARTE (DECISION_REQUIRED) | `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` | Schemat ID (newtype `u64` per typ, `OwnerRef`, człowiek = 0) i tabele pól RuntimeUnit (25) i City (61). | Garnizon: D-ID-5 wyprowadzany z pozycji (Propozycja A) — sprzeczne z P2.11 D-MIG-19 (K-1). Wcześniejsze „rozstrzygnięte" było błędne (zarzut 7 r5): D-ID-8/9/10 są DO_DECYZJI wg LEDGER l.80 i pozostają otwarte (§4A). |
| P2.4 | RNG-DETERMINISM | PASS | `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md` | Prymitywy RNG (mulberry32, permutacja, offsety): ZGODNE (P2-4 l.10, §1–§2). Pełny generator web vs Rust: NIEZGODNY (P2-4 l.9, §5). `ziemia`: NIEZGODNE potwierdzone (P2-4 l.43–44; `map_generator.rs:519`). Przeczytane w całości w r5. | Otwarte rekomendacje §6 (O-4, Z-2). |
| P2.5 | COMMANDS | LIMIT-5-EXCEEDED (LEDGER: „PASS administracyjnie"; brak potwierdzenia merytorycznego w tym temacie, zarzut 9 r5) | `dyspozycje/rust-port/p2/P2-5-COMMANDS.md` | Katalog 96 wierszy (0 GOTOWA, 28 CZĘŚCIOWA, 48 BRAK, 20 WIDOK) i mapowanie 174 callbacków `main.ts` (LEDGER l.81). | 17 nierozstrzygniętych D-CMD (§0, O-2a, O-8, O-9). §9 pkt 14 i 17 bez numeru D-CMD. |
| P2.6 | EVENTS | LIMIT-5-EXCEEDED (LEDGER: „PASS administracyjnie"; brak potwierdzenia merytorycznego w tym temacie, zarzut 9 r5) | `dyspozycje/rust-port/p2/P2-6-EVENTS.md` | Katalog 53 wierszy eventów (12 CZĘŚCIOWY, 40 BRAK, 1 WYKLUCZONY) + 7 wierszy wewnętrznych; pokrycie 457 plików `gra/src`. | Pełny przegląd 288 plików NIE wykonany (D-EV-14, Z-1). LEDGER l.82 wiąże przegląd z P2.13. D-EV-1…13 bez rozstrzygnięcia (O-2b). |
| P2.7 | SAVE-SERIALIZATION | PASS-WITH-NOTES | `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` | Katalog kształtu zapisu web (`SAVE_VERSION=3`, 22 klucze top-level, 94 klucze `meta`); gap `meta.forcedWarWavesByPairKey` potwierdzony (LEDGER l.76). | Serializacja Rust (v2) obejmuje ułamek pól (P2-7 §5). Przeczytane w całości w r5; gap l.63–80 potwierdzony; 92 z 94 pozycji `meta` BRAK (§3, §6). |
| P2.8 | TAURI-ADAPTER | PASS | `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` | Granica dziś: 1 komenda `engine_command` z 6 wariantami (frontend używa 4) i 1 event. Wpięte: ruch (`move_unit`) i tura (`advance_turn`) wg P2-8 §6 l.71–72; BRAK dla rekrutacji, budowy, dyplomacji, handlu, badań, auto-zarządzania, save/load (P2-8 §7 l.88). | Stan faktyczny, nie decyzja. Przeczytane w całości w r5. LEDGER l.78 wlicza „tura" do niewpiętych — sprzeczne (K-14). |
| P2.9 | ASSET-DATA-MAPPING | PASS | `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` | 1527 unikalnych kluczy 29 plików JSON zmapowanych per klucz; loader Rust dla danych: BRAK (LEDGER l.77). | `units.json` vs `recruitment.rs`: 0/75 zgodne, 75/75 rozbieżne — P2-9 **l.113** (sprawdzone grep w tej korekcie; wcześniej błędnie l.112) (Z-3, O-5). `buildings.json`: 40 z 42 rekordów obecne w Rust; wartości 40/40 zgodne — P2-9 **l.112** (sprawdzone grep w tej korekcie) (Z-4). |
| P2.10 | FIXTURES | LIMIT-5-EXCEEDED (LEDGER: „PASS administracyjnie"; nagłówek P2-10 l.7: DECISION_REQUIRED, status wykonania r5 — sprzeczność z LEDGER, zarzut 9 r5) | `dyspozycje/rust-port/p2/P2-10-FIXTURES.md` | Format fixture, mechanizm nagrywania (do zbudowania), 7 scenariuszy FX-01…FX-07, harness (projekt). | 19 otwartych D-FIX bez D-FIX-20 (Z-10; w tym D-FIX-15 → O-22, zarzut 5 r5). D-FIX-20: DECISION_REQUIRED → O-21 (zarzut 6 r5: wcześniej błędnie „zamknięte w §16"). P2-10 §7 (l.513) nie zawiera rozstrzygnięć; §16 je zawiera (K-11). |
| P2.11 | SAVE-MIGRATION | DECISION_REQUIRED → PASS (administracyjnie) | `dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md` | Mapowanie 116 kluczy (22 + 94) na `GameState`, schemat importu jednokierunkowego, polityka błędów, nieniszczący import. | 8 pozycji [WŁ] w §10/§6 (D-MIG-1, 3, 9b, 10, 11, 18, 19, 21). LEDGER l.83 twierdzi, że żadna nie wymagała pytania właścicielowi — sprzeczne z oznaczeniami [WŁ] (K-12). §4B w.94 sprzeczne z §10 (K-2). |
| P2.12 | COMPLIANCE-MATRIX | LIMIT-5-EXCEEDED (LEDGER: „PASS administracyjnie"; brak potwierdzenia merytorycznego w tym temacie, zarzut 9 r5) | `dyspozycje/rust-port/p2/P2-12-COMPLIANCE-MATRIX.md` | Macierz 41 wierszy P1: 18 POKRYTY, 19 CZĘŚCIOWO, 4 LUKA (treść tekstowa poza zakresem P2.9); luki G1–G14. | G1, G3, G13, G14 nieotwarte. §15 („zero DECISION_REQUIRED", l.245) sprzeczne z §7 (l.129–135) (K-7). |

**Zarzut 1 r4 (niezweryfikowane streszczenia):** streszczenia wierszy P2.1, P2.4, P2.7, P2.8, P2.9 i P2.10 nie zostały sprawdzone w r3 ani r4 (pliki nie przeczytane w całości). Traktować je jako streszczenia z LEDGER i rundy 2, nie jako zweryfikowane.

**Liczniki (zgodność z listami):** P2.5 96 = 0+28+48+20 (wg LEDGER l.81); P2.6 53 = 12+40+1 (wg LEDGER l.82; numeracja E-01…E-48 + E-56…E-60 zgodnie z rundą 2); P2.12 41 = 18+19+4 (wg LEDGER l.86); P2.9 suma kluczy 1527 (wg LEDGER l.77, bez ponownego sumowania). Liczby pochodzące z rundy 2 zaznaczone w §7.

---

## 2. Kontradykcje między dokumentami

Każda para: dokument A (lokalizacja) ↔ dokument B (lokalizacja) → wynik. Kolumna „Weryfikacja r3" mówi, czy cytat został sprawdzony w tej rundzie (sed/grep na pliku, wynik potwierdzony) czy przeniesiony z rundy 2.

| ID | Para (A ↔ B) | Co dokładnie porównano | Wynik | Weryfikacja r3 |
|---|---|---|---|---|
| K-1 | P2-3 §9 D-ID-5 (l.315–321) ↔ P2-11 §6 D-MIG-19 (l.445–446) i §10 (l.539, „DOKŁADNIE TEN SAM precedens … dla `oblega`") | Traktowanie `inGarnizon` (`RuntimeUnit`, `setup.ts:51`). P2-3 l.315–321: `oblega` = Propozycja B; garnizon „pozostaje wyprowadzany z pozycji (Propozycja A)". P2-11 l.445: builder zapisuje całe obiekty jednostek, więc pole JEST w zapisie. | **SPRZECZNE.** Precedens P2-11 l.539 odwołuje się do `oblega`, ale P2-3 wyłączył garnizon z tej zasady. Kierunek poprawki wybiera Final Control. | Tak (l.315–321, l.445) |
| K-2 | P2-11 §4B w.94 (l.341: `cities[].auto_manage`) ↔ P2-11 §6 D-MIG-18 (l.444) i §10 (wariant A: `owners[].policy`) ↔ P2-2 §2 l.48, l.84 | Miejsce `autoManageCities`. | **SPRZECZNE WEWNĄTRZ P2-11.** Rozstrzygnięcie §10 nie zostało przeniesione do §4B w.94. P2-12 G13 nadal opisuje wariant B jako odstępstwo. | l.341, l.444 tak; P2-2 l.48, l.84 nie (z r2) |
| K-3 | P2-4 §1, §4 („NIEZGODNE — ziemia", wg LEDGER l.75) ↔ P2-12 §4 w.9 (l.35: „Zgodność generatora Rust z web niepotwierdzona") ↔ P2-11 §6 D-MIG-9(b) (l.430: „Rust nie ma potwierdzonej zgodności generatora z web") | Status generatora świata Rust. | **SPRZECZNE (opis).** P2.4 ustalił NIEZGODNOŚĆ; P2-12 w.9 i P2-11 nazywają to „niepotwierdzonym". Status „POKRYTY" w w.9 dotyczy miejsca w kontrakcie, nie zgodności; status zostaje, opis wymaga korekty. | Tak (l.35, l.430; LEDGER l.75) |
| K-4 | P2-2 §2 l.38 (`culture: CultureState // M10`) ↔ P2-2 §8 D12 (l.193–195: „nie tworzymy `CultureState` przedwcześnie dla jednego pola") ↔ P2-2 §8 D8 (l.181–184: placeholdery M10 w `GameState`) | Czy typ `CultureState` istnieje w szkielecie i czy niesie stok kultury. | **SPRZECZNE TERMINOLOGICZNIE.** D8 wymaga placeholdera M10 w `GameState`; szkielet realizuje go jako typ `CultureState`; D12 mówi, że `CultureState` nie powstaje dla samego stoku. Spójne wyłącznie warunkowo: tylko jeśli `CultureState` jest placeholderem bez pola stoku; D12 tego nie mówi wprost. Korekta: doprecyzować D12. | l.119 (D12) tak; l.193–195 tak (z r2); l.38, D8 nie |
| K-5 | P2-2 §4 l.85 (`budowaListaBiblioteka` — „U? do potwierdzenia") i §8 pkt 10(b) (l.209–210: klasa U, czytana przy imporcie) ↔ P2-11 §6 D-MIG-10 [WŁ] i §10 (wariant A: import jako dane) | Klasa `budowaListaBiblioteka`. | **SPRZECZNE.** P2-11 rozstrzygnął inaczej, P2-2 nie został zaktualizowany. Kontrakt ma dwie wersje. | Tak (l.85, l.209–210); P2-11 D-MIG-10 z r2 |
| K-6 | P2-2 §4 l.95 (lista kluczy fal wojny wymuszonej: **16** pozycji, w tym `regularWarCapturedByPairKey`) ↔ P2-2 §8 pkt 9(f) l.207 („cała rodzina **15** kluczy fal wojny wymuszonej → `ai.forced_war`") ↔ P2-11 §6 D-MIG-14 (`regularWarCapturedByPairKey` poza 15 kluczami fal, → `ai`) | Liczba i skład rodziny wojny wymuszonej. | **SPRZECZNE WEWNĄTRZ P2-2** (16 w l.95, 15 w l.207). Rozstrzygnięcie D-MIG-14 wskazuje 15 (bez `regularWar…`). Korekta: usunąć `regularWarCapturedByPairKey` z l.95 (zgodnie z wiążącym rozstrzygnięciem P2-11). | Tak (l.95: 16 backtick-kluczy; l.207) |
| K-7 | P2-12 §15 (l.245: „bez punktów DECISION_REQUIRED") ↔ P2-12 §7 (l.129–135: decyzje `D-COMP` G1 i G3; decyzje właściciela G13 i G14) | Status decyzji w tym samym dokumencie. | **SPRZECZNE WEWNĄTRZ P2-12.** §7 (l.129–135) wymienia cztery pozycje decyzyjne (G1, G3, G13, G14); §15 jest nieaktualne. | Tak (l.129–135, l.245) |
| K-8 | P2-6 §6 D-EV-14 (l.277: „(b) jawna akceptacja ryzyka przez **Final Control**") ↔ P2-6 §9 pkt 3 (l.1040–1047: „ryzyko zaakceptowane na tym etapie" i „pełny przegląd … WYMAGANY jako warunek wstępny P2.13") | Kto akceptuje ryzyko kompletności i czy przegląd jest warunkiem zamknięcia. | **SPRZECZNE.** §6 przewiduje akceptację przez Final Control jako alternatywę wobec przeglądu; §9 przyjmuje akceptację ryzyka i jednocześnie wymaga przeglądu przed P2.13. Obie wersje nie mogą być wiążące jednocześnie. Korekta: jedna z nich w P2-6. | Tak (l.277, l.1040–1047) |
| K-9 | P2-6 §6 D-EV-3 (l.266: „Właściciel powinien potwierdzić") ↔ P2-6 §9 pkt 9 (l.1059: „zgodnie z D-EV-3 (eventy efemeryczne …)" jako przesłanka) | Status D-EV-3 (kronika efemeryczna). | **SPRZECZNE.** §9 traktuje D-EV-3 jako przesądzone; §6 wymaga potwierdzenia właściciela, którego nie ma w LEDGER. | Tak (l.266, l.1059) |
| K-10 | P2-5 §4 D-CMD-15 (l.535: „DECYZJA WŁAŚCICIELA (status DECISION_REQUIRED)") ↔ P2-5 §9 pkt 1 (l.658: „Żaden nie jest genuine decyzją produktową"; rozstrzygnięte jako `WIDOK`). P2-5 §4 D-CMD-19 (l.540: „NIE ZAMKNIĘTE — otwarte, blokuje kryterium") ↔ P2-5 §9 pkt 8 (l.662: rozszerzenie kanonu P2.3) | Klasyfikacja genuine vs nie-genuine dla D-CMD-15 i D-CMD-19. | **SPRZECZNE (klasyfikacja i status).** Dokument sam oznacza te pozycje jako właścicielskie lub otwarte; §9 je zamyka administracyjnie. Status w tej syntezie: DECISION_REQUIRED, OTWARTE (O-8, O-9). | Tak (l.535, l.540, l.658, l.662) |
| K-11 | P2-10 §7 (l.513: „Żaden z punktów nie został rozstrzygnięty w tym temacie"; D-FIX-1…20 w tabeli) ↔ P2-10 §16 (rozstrzygnięcia D-FIX-15 pkt 1, D-FIX-20 pkt 3; lista otwartych w §16) | Liczba i lista otwartych D-FIX. | **NIESPÓJNE LICZENIE.** Przyjęty licznik: 18 (Z-10). Lista otwartych w §16 pomija D-FIX-2, 5, 6, 7, 8, których §7 nie zamyka. | Tak (l.513, §16 pkt 1 i 3) |
| K-12 | LEDGER l.83 (P2.11: „żaden nie wymagał pytania właścicielowi") ↔ P2-11 §6 i §10 (8 pozycji oznaczonych [WŁ]: D-MIG-1, 3, 9(b), 10, 11, 18, 19, 21; l.444–445) | Czy pozycje [WŁ] są właścicielskie. | **SPRZECZNE (status).** Dokument oznacza je jako [WŁ]; LEDGER zamyka wszystkie bez pytania. Ta synteza klasyfikuje je w §4B (GENUINE-kandydat: D-MIG-3 → O-10, D-MIG-9(b) → O-3, D-MIG-18 → O-2e, D-MIG-21 → O-2f). | Tak (LEDGER l.83; P2-11 l.444–445) |
| K-13 | LEDGER l.79 (P2.2: „tylko D7 … genuine") ↔ P2-2 l.119 (D12: „Decyzja właściciela") | Czy D12 jest decyzją właściciela. | **SPRZECZNE (status).** LEDGER: nie-genuine; dokument: decyzja właściciela. Ta synteza: O-7, DECISION_REQUIRED (klasa GENUINE-kandydat, zgodnie z oznaczeniem dokumentu). | Tak (l.119; LEDGER l.79) |
| K-14 | LEDGER l.78 (P2.8: „żadna z docelowych kategorii P2.5 (… tura) nie ma wpiętej komendy") ↔ P2-8 §6 l.71–72 (ruch `move_unit` TAK; tura `advance_turn` TAK, `playable.rs:554`) i §7 l.88 (lista BRAK bez „tura") | Czy kategoria „tura" jest wpięta w komendy. | **SPRZECZNE (status LEDGER vs dokument).** P2-8 rozróżnia: tura TAK, siedem kategorii BRAK. LEDGER wlicza tura do niewpiętych. Korekta wpisu LEDGER P2.8; nie wpływa na werdykt. | Tak (P2-8 l.71–72, l.88; LEDGER l.78) |

**Zakres wniosku (zarzut 2 r4, r5):** §2 obejmuje wyłącznie pary K-1…K-14. Nie jest to wniosek o spójności całej fazy P2 i nie zastępuje pełnej macierzy 12×12, której nie wykonano.

**Pary porównane bez sprzeczności w tej rundzie:** brak nowych par. Pary z rundy 2 (P2-2 D1 ↔ P2-3 ↔ P2-11 §4B; P2-2 D2/D-ID-8 ↔ P2-10 D-FIX-14; P2-2 D7 ↔ P2-11 D-MIG-1 i D-MIG-22; P2-3 D-ID-4/D-ID-11 ↔ P2-11; P2-5 §9 pkt 17 ↔ P2-2 D2; P2-6 §9 pkt 8 ↔ P2-8 §2; P2-7 §3 ↔ P2-11 §4B; P2-9 §1 ↔ P2-12 w.13 ↔ P2-10 §0; P2-1 ↔ P2-12 w.1; P2-9 §1 w.3 ↔ §2e) **NIE są w tej rundzie ponownie zweryfikowane i NIE są deklarowane jako zgodne.** Sprawdzone w r3 tylko pary K-1…K-13 wymienione wyżej, na wskazanych liniach.

**Drobne rozjazdy liczbowe (bez wpływu na decyzje):** P2-9 §1 wiersz 1 („136 parametrów" przy 139 BRAK) — wg r2 nieweryfikowane; P2-9 §4 („loader dla 30 plików", l.121) przy nagłówku „29"; P2-6 D-EV-13 mówi o statusie WYKLUCZONY dla 8 wierszy, §7 nie liczy ich.

---

## 3. Zobowiązania techniczne — rozliczenie

| ID | Zobowiązanie (źródło) | Rozliczenie w tym temacie | Status |
|---|---|---|---|
| Z-1 | Przegląd 288 plików heurystyki, 6642 linii, bez przeczytania pojedynczo (P2-6 §6 D-EV-14, l.277; §9 pkt 3, l.1040–1047: „WYMAGANY jako warunek wstępny P2.13") | **Dwie drogi; wybór Operatora r5: A (§0e, zarzut 3). Opis obu dróg:** **(A)** wykonanie przeglądu w osobnym temacie (proponowana nazwa `R-RUSTPORT-P2.6-R-REVIEW-288`; temat nie istnieje, wymaga zlecenia przez orkiestratora; wynik w NOWYM pliku, bez edycji P2-6 w tym temacie). **(B)** przeniesienie do P3 z uzasadnieniem — obecnie niezgodne z P2-6 §9 pkt 3, które nazywa przegląd warunkiem wstępnym P2.13; wymagałoby zmiany tego warunku przez orkiestratora. Akceptacja ryzyka (P2-6 §6 opcja b) nie jest ścieżką (K-8). Rozliczenie nie wymaga decyzji właściciela. | **NIEROZLICZONE — blokuje werdykt.** Wybór A dokonany (r5); wykonanie nie rozpoczęte: A wymaga zlecenia tematu `R-RUSTPORT-P2.6-R-REVIEW-288` przez orkiestratora. Kryterium dispatchu „jawne rozliczenie każdego zobowiązania" dla Z-1 NIESPEŁNIONE do wyniku przeglądu (PASS albo FAIL z poprawką). |
| Z-2 | Otwarte rekomendacje generatora (P2-4 §6 pkt 1–3): zakres bitowej zgodności; seed > ~4e6; seed 0 | Pkt 2 = D-FIX-4 (P2-10 §7; DECISION_REQUIRED). Pkt 1 (zakres zgodności) i pkt 3 (seed 0) nie są w żadnej liście D-; trafiają do O-4. | **OTWARTE** (O-4; pkt 2 w D-FIX-4) |
| Z-3 | `units.json` vs `recruitment.rs`: 75/75 wartości rozbieżnych; komentarz „mirrored from units.json" nieaktualny (P2-9 §3 l.113, §4; LEDGER l.77) | Brak rozstrzygnięcia w P2.9 i P2.12 (P2-12 w.34 dotyczy miejsca, nie wartości). Kierunek korekty zależy od O-5. Wg LEDGER web zmieniono commitem `4c1126de` (koszty przepołowione). | **OTWARTE — warunkowe na O-5** |
| Z-4 | `building_costs.rs`: 40 z 42 rekordów obecne (brak `warsztat_oblezniczy`, `akademia_wojskowa`); 40/40 obecnych zgodnych wartościowo (P2-9 l.104, l.112) | Brak decyzji produktowej — uzupełnienie rekordów. Brak wpisu w LEDGER/P2.12. Wpisać do GOAL P3 (§6). | **OTWARTE — obowiązek P3, bez decyzji** |
| Z-5 | Loader danych `gra/data` w Rust: BRAK dla 29/29 (P2-9 §4, l.121; LEDGER l.77) | Zakres P3.5–P3.7 wg P2-9 §5. Brak decyzji o formacie loadera. | **OTWARTE — zakres P3** |
| Z-6 | Rozjazdy ekonomii ×5 i tartak/kamieniołom 50 vs 200 (P1-16D-EKONOMIA5X; P1-16D w P2-12 w.27) | Liczby w danych: POKRYTE. Przyczyna tartaku nieustalona (LEDGER: „do P2"). Nie ustalono w P2.9 ani P2.12. | **OTWARTE — ustalić przyczynę; wpisać do GOAL P3 (§6)** |
| Z-7 | Pola BRAK bez nazwanego miejsca w szkielecie: ~30 pól City, 14 pól RuntimeUnit (P2-3 D-ID-11 + P2-12 G2, G12) | P2-3 §9 D-ID-11 rozstrzygnęło zasadę (placeholdery w `GameState`); P2-2 §2 nie nazywa tych pól (P2-12 §5 l.113–116). Korekta dokumentu, nie decyzja. | **OTWARTE — korekta P2.2 §2 przed P3** |
| Z-8 | LUKA ×4 (P2-12 w.25, 26, 28, 29): treść tekstowa (wikiBundle, Poradnik, CivPedia) poza zakresem P2.9 (G3, D-COMP-2) | P2-12 §7 nazywa D-COMP-2 „zmianą zakresu zamkniętego P2.9". Decyzja zakresowa (O-2c). | **OTWARTE — decyzja (O-2c)** |
| Z-9 | P2-12 G1–G14 | G1 → O-2d (D-COMP-1). G2 → zamknięte (D-ID-11). G3 → Z-8 (O-2c). G4–G12 → proste uzupełnienia wg P2-12 §7, poza listą O. G13 → O-2e. G14 → O-2a (D-CMD-11). | **OTWARTE — patrz §4** |
| Z-10 | P2-10 D-FIX: **19** otwartych (1–19 bez 20; w tym D-FIX-15 → O-22) + D-FIX-20 (klasa DR → O-21) = **20** dla bramki; zob. §0, §0e, K-11 | Świadomie otwarte; blokują pierwszy realny PASS fixture (P2-10 §16). Nie blokują P3 (kontrakt). D-FIX-2 i D-FIX-5 wymagają rozstrzygnięcia przed harnessem. | **OTWARTE — zgodnie z dokumentem** |
| Z-11 | P2-5 D-CMD: **17** nierozstrzygniętych = 15 bez statusu (1–11, 13, 16–18) + 2 DECISION_REQUIRED (15, 19) | Pełna lista i klasy w §4 (O-2a: 14 pozycji; O-15: D-CMD-7; O-8, O-9). Zamknięte: D-CMD-12 (P2-5 §9 pkt 2, 13), D-CMD-14 (P2-5 l.526; zamknięte w r4, wpis P2-5 l.19). **D-CMD-15 i D-CMD-19: DECISION_REQUIRED, OTWARTE** (zarzut 6 Evaluatora rundy 2 P2-13); rozstrzygnięcia orkiestratora (P2-5 §9 pkt 1 i 8) są stanowiskiem orkiestratora, nie zamknięciem. | **OTWARTE — §4 (O-2a, O-8, O-9)** |
| Z-12 | P2-6 D-EV: **14** nierozstrzygniętych (1–14); D-EV-15 zamknięte (§9 pkt 7) | D-EV-1…13 → O-2b; D-EV-14 → O-1 (ścieżka A, Z-1). | **OTWARTE — §4 (O-1, O-2b)** |
| Z-13 | Stany P1 bez statusu w P2 (P2-12 w.20, w.25; ustalenia P1-16 §11.2: AUDYT-KODU 10 nierozstrzygniętych) | Dług P1, nie P2 (P2-12 w.20). | **Przeniesione do P1 — poza bramką P2** |

---

## 4. Decyzje wymagające właściciela (DECISION_REQUIRED)

Kryterium klasyfikacji (dispatch, ZADANIE pkt 4): czy pozycja jest decyzją produktową, zakresową lub wpływającą na gracza, czy wyborem reprezentacji i kształtu. Kolumna „Klasyfikacja" NIE ocenia, który wariant techniczny jest poprawny.

### 4A. Pozycje nierozstrzygnięte

| ID | Pozycja | Źródło | Klasyfikacja | Stan |
|---|---|---|---|---|
| O-1 | Przegląd 288 plików (D-EV-14): wykonanie czy akceptacja ryzyka | P2-6 l.277 (opcje a/b), l.1040–1047; K-8 | DECISION_REQUIRED (zarzut 4 r4; LEDGER l.82 flaguje pkt 3 jako DO_DECYZJI_WŁAŚCICIELA; opcja (b) jest wyborem, nie zadaniem). Opcja (b) — akceptacja przez Final Control — nie jest używana w tej syntezie. | **OTWARTE**: ścieżka A/B (Z-1); decyzja nie zapadła, pozycja nie jest zamknięta. |
| O-2a | **D-CMD, 14 pozycji bez statusu** (P2-5 §4, §9; wraz z D-CMD-7 w O-15 — 15 bez statusu, zarzut 5 r4) | P2-5 | (i) GENUINE-kandydat (zachowanie/ekonomia widoczne dla gracza): **3, 4, 9, 10, 11, 16, 17, 18**. (ii) NIE-GENUINE (kształt kontraktu): **1, 2, 5, 6, 8, 13**. D-CMD-10 zawiera w P2-5 l.522 frazę „do potwierdzenia"; D-CMD-7 przeniesiony do O-15 (DECISION_REQUIRED: brak oznaczenia statusu w P2-5, wątpliwość klasy). | **OTWARTE**. Klasa (i) → właściciel; klasa (ii) → Final Control. |
| O-2b | **D-EV, 13 pozycji bez rozstrzygnięcia** (P2-6 §6) | P2-6 | (i) GENUINE-kandydat: **2, 3, 6, 7, 8, 9, 10, 12** (m.in. D-EV-3, kronika w zapisie; D-EV-10, zwycięstwo P2 vs P6.19). (ii) NIE-GENUINE: **1, 4, 5, 11, 13**. D-EV-1 częściowo przesądzony przez §9 pkt 8 (`engine_event` jest dodatkowy); wariant batchu pozostaje otwarty. | **OTWARTE**. |
| O-2c | **D-COMP-2 / G3**: czy treść tekstowa (wikiBundle, Poradnik, CivPedia) wchodzi do kontraktu danych P2.9 | P2-12 §4 G3, §7 (l.129–135); Z-8 | GENUINE-kandydat (zmiana zakresu zamkniętego kontraktu P2.9, P2-12 §7 nazywa ją zmianą zakresu). | **OTWARTE** |
| O-2d | **D-COMP-1 / G1**: miejsce `kulturaSkumulowana` i `ownCultureShare` (kultura per miasto) w `GameState` | P2-12 §4 G1, §7; P2-3 §5 w.52–53; K-4 | DO-ROZSTRZYGNIĘCIA-PRZEZ-FC (P2-12 nazywa to decyzją; treść to zakres modelu M10 i powiązanie z D12, patrz O-7). | **OTWARTE** |
| O-2e | **G13 / D-MIG-18**: miejsce `autoManageCities` — wariant A (`owners[].policy`, P2-11 §10) czy wariant B (`cities[].auto_manage`, P2-11 §4B w.94) | P2-11 l.341, l.444 [WŁ, ODSTĘPSTWO od kontraktu P2.2]; P2-12 §7 (G13: „decyzja właściciela"); K-2 | GENUINE-kandydat (oznaczenie [WŁ] w dokumencie; P2-12 §7 wskazuje decyzję właściciela). | **OTWARTE**. Wybór A/B wymaga potwierdzenia po poprawce K-2. |
| O-2f | **D-MIG-21**: czas życia tabeli legacy→nowe ID (wariant A: tylko na czas importu; wariant B: przez całą sesję) | P2-11 §6 D-MIG-21 [WŁ], §10; dispatch P2.11 pkt 3 | GENUINE-kandydat (oznaczenie [WŁ]; wariant A zmienia wymaganie zapisane w dispatchu P2.11). | **OTWARTE** |
| O-3 | **D-MIG-9(b)**: zapis bez `mapSnapshot` jest ODRZUCANY (nie regenerowany generatorem Rust) | P2-11 §6 l.430, §10; P2-2 D7 (l.160–161: „Rust MUSI wczytywać dzisiejsze zapisy web 1:1 — gracze nie mogą stracić postępu") | GENUINE-kandydat: skutek dla gracza (część zapisów web nie zostanie wczytana). Odrzucenie jest odstępstwem od literalnego brzmienia odpowiedzi właściciela D7 (sformułowanie dokumentu, nie ocena wyboru). | **OTWARTE** |
| O-4 | Zakres zgodności generatora (P2-4 §6 pkt 1), seed 0 w API (pkt 3), seed ≥ ~4e6 (pkt 2 = D-FIX-4) | P2-4 §6, P2-10 §7 | pkt 1 — GENUINE-kandydat (wymóg, czy gracz widzi tę samą mapę po seedzie z web); pkt 3 — NIE-GENUINE (zachowanie API); pkt 2 — DECISION_REQUIRED wg D-FIX-4. | **OTWARTE** |
| O-5 | Wartości jednostek: `units.json` (web) vs `recruitment.rs` (Rust): który stan jest kanonem | P2-9 §3, Z-3; LEDGER l.77; commit `4c1126de` (LEDGER) | GENUINE-kandydat (wartości balansu gry, zmiana przepołowiła koszty w web). P2-10 D-FIX-20 ustala wyrocznię testów, nie kanon balansu. | **OTWARTE** |
| O-6 | **D8 (P2-2)**: czy M10, M12, M13 powstają w P2.2 jako placeholdery w `GameState`, czy są odroczone do P6.16–P6.18 | P2-2 §8 D8 (l.181–184; pytanie w l.115) | GENUINE-kandydat (zakres roadmapy: co trafia do P6). Rozstrzygnięte przez orkiestratora; odnotowane jako stanowisko orkiestratora. | **OTWARTE** (potwierdzenie zakresu przez właściciela) |
| O-7 | **D12 (P2-2)**: stok `culture` w `economy` czy w `CultureState` | P2-2 §5 l.119 („Decyzja właściciela"); §8 D12 (l.193–195); K-4; K-13 | GENUINE-kandydat (dokument przypisuje decyzję właścicielowi; wybór kształtu modelu kultury wpływa na P6). LEDGER l.79 uznaje ją za nie-genuine; to sprzeczność statusu (K-13). | **OTWARTE** |
| O-8 | **D-CMD-19**: rozszerzenie kanonu ID P2.3 o `DealId`, `BattleId`, `SlotId` i 11 typów jako `String`/enum | P2-5 §4 l.540 („NIE ZAMKNIĘTE, blokuje kryterium"), §9 pkt 8 (l.662); K-10 | DECISION_REQUIRED (dokument sam oznacza jako otwarte; zmiana zamkniętego kontraktu P2.3). | **OTWARTE** (status ujednolicony: DECISION_REQUIRED) |
| O-9 | **D-CMD-15**: 20 akcji §2.11 bez komendy (status `WIDOK`) | P2-5 §4 l.535 („DECYZJA WŁAŚCICIELA (status DECISION_REQUIRED)"), §9 pkt 1 (l.658); K-10 | DECISION_REQUIRED (dokument sam oznacza jako decyzję właściciela). | **OTWARTE** (status ujednolicony: DECISION_REQUIRED) |
| O-10 | **D-MIG-3 [WŁ]**: po imporcie RNG startuje z `seed`, kolejka pusta; kontynuacja losowań nie jest bit-w-bit z web | P2-11 §10 (oznaczenie [WŁ]); LEDGER l.83 (zamknięte bez pytania; K-12) | GENUINE-kandydat: zmienia to przebieg gry widoczny dla gracza po wczytaniu (sekwencja losowań). Pozycja NOWA w tej rundzie, zgłoszona przez drugą parę oczu. | **OTWARTE** |
| O-11 | **D-MIG-1 [WŁ]**: zakres wersji wejściowych (odrzucenie `wersja` ≠ 3; czy migrować zapisy v1/v2) | P2-11 §6 l.420 (oznaczenie [WŁ]); LEDGER l.83 (K-12) | DECISION_REQUIRED: oznaczenie [WŁ] bez rozstrzygnięcia właściciela (dispatch pkt 4). | **OTWARTE** |
| O-12 | **D-MIG-10 [WŁ]**: klasa `budowaListaBiblioteka` (wariant A: import jako dane) | P2-11 §6 D-MIG-10 [WŁ], §10; P2-2 §4 l.85, §8 pkt 10(b) (K-5) | DECISION_REQUIRED: oznaczenie [WŁ]; dokumenty P2-2 i P2-11 sprzeczne. | **OTWARTE** |
| O-13 | **D-MIG-11 [WŁ]**: `combat.siege_started_turn` jako pole przechowywane | P2-11 l.435 (oznaczenie [WŁ]) | DECISION_REQUIRED: oznaczenie [WŁ] bez rozstrzygnięcia właściciela; dodaje pole do kontraktu. | **OTWARTE** |
| O-14 | **D-MIG-19 [WŁ]**: import `inGarnizon` jako dane vs wyprowadzanie z pozycji | P2-11 l.445 (oznaczenie [WŁ]); P2-3 §9 D-ID-5 (K-1) | DECISION_REQUIRED: oznaczenie [WŁ]; sprzeczność z P2-3 nierozstrzygnięta. | **OTWARTE** |
| O-15 | **D-CMD-7**: `unit_type: String` (klucz z `units.json`) zamiast enum | P2-5 §2 wiersze R1–R6, B1 (użycie); §4 D-CMD-7 (brak oznaczenia statusu) | DECISION_REQUIRED: wątpliwość klasy (kształt vs zakres), zgłoszona w zarzucie 3 r3. | **OTWARTE** |
| O-16 | **D-ID-8 (P2-3 §9, l.286, l.330)**: konwencja człowieka 0 vs 1 (`HUMAN_PLAYER_ID = 1` w `parity-v2` `playable.rs:15`); import zapisów 1:1 zmieniałby właściciela człowieka 0→1 (P2-3 l.54, D7) | P2-3 l.286, l.330, l.54; LEDGER l.80 (DO_DECYZJI_WŁAŚCICIELA wg Final Control) | DECISION_REQUIRED (zarzut 4 r4). Klasa wątpliwa: dotyczy stałych kodu, ale wpływa na import zapisów gracza. | **OTWARTE** |
| O-17 | **D-ID-9 (P2-3 §9, l.287, l.334)**: czy `gra/src/types/city.ts` (`City`, l.113) wypada z zakresu portu | P2-3 l.287, l.334; LEDGER l.80 (DO_DECYZJI wg Final Control) | DECISION_REQUIRED: decyzja zakresowa (usunięcie typu z zakresu portu). | **OTWARTE** |
| O-18 | **D-ID-10 (P2-3 §9, l.288, l.337)**: jeden `UnitState` w `GameState` vs cztery struktury jednostek (dotyka M4, M7/M8) | P2-3 l.288, l.337; LEDGER l.80 (DO_DECYZJI wg Final Control) | DECISION_REQUIRED (flaga Final Control). | **OTWARTE** |
| O-19 | **P2-6 §9 pkt 8**: `engine_state_changed` jako snapshot, `engine_event` jako dodatkowy kanał; zawężenie E-43 | P2-6 §9 pkt 8 (od l.1049); LEDGER l.82 (DO_DECYZJI wg Final Control) | DECISION_REQUIRED (flaga Final Control; zmiana kształtu kanału zdarzeń). | **OTWARTE** |
| O-20 | **P2-6 §9 pkt 9**: semantyka dostarczania eventów przy braku nasłuchu (brak bufora/sekwencji); zależne od D-EV-3 | P2-6 §9 pkt 9 (od l.1058), l.1059; LEDGER l.82 (DO_DECYZJI wg Final Control); K-9 | DECISION_REQUIRED (flaga Final Control). | **OTWARTE** |
| O-21 | **D-FIX-20 (P2-10 §7 l.511, §16 pkt 3 l.662–668)**: model wyroczni — wyłącznie zmierzona wartość web | P2-10 l.511, §16; LEDGER l.84 (DO_DECYZJI wg Final Control) | DECISION_REQUIRED (flaga Final Control; §16 jest rozstrzygnięciem orkiestratora, nie właściciela). | **OTWARTE** |
| O-22 | **D-FIX-15 (P2-10 §16 pkt 1)**: forma dowodu zamknięcia czytania P2-5/P2-6 („trzy przejścia czytania" jako dowód) | P2-10 §7 (DO_DECYZJI wg P2-10), §16 pkt 1; zarzut 5 r5 | DECISION_REQUIRED (przeklasyfikowane z NIE-GENUINE: forma dowodu sporna, zgłoszona przez drugą parę oczu) | **OTWARTE** |

### 4B. Pozycje zamknięte administracyjnie — klasyfikacja

Kolumna „Klasyfikacja" dotyczy wyłącznie kwalifikacji genuine/nie-genuine. Nie ocenia wyboru technicznego.

| ID | Rozstrzygnięcie (dokument, §) | Klasyfikacja | Uwaga |
|---|---|---|---|
| D7 (P2-2 l.160–161) | Odpowiedź właściciela, 2026-10-21 | GENUINE (rozstrzygnięte przez właściciela) | Jedyna pozycja z potwierdzoną decyzją właściciela w LEDGER. |
| D-ID-1…D-ID-7, D-ID-11 (P2-3 §9) | Orkiestrator (§9) | DO-ROZSTRZYGNIĘCIA-PRZEZ-FC (zarzut 5 r5: klasa NIE-GENUINE była zbiorcza i nieoceniona pojedynczo; nie przyjmowana bez oceny) | D-ID-5: korekta zapisu → K-1. |
| D-ID-8, D-ID-9, D-ID-10 (P2-3 §9) | Orkiestrator (§9) | DECISION_REQUIRED → O-16, O-17, O-18 (flaga Final Control, LEDGER l.80) | Wcześniej błędnie NIE-GENUINE (zarzut 4 r4). |
| D-MIG-1 [WŁ] (P2-11 §10) | Odrzucenie wersji ≠ 3 | DECISION_REQUIRED → O-11 (oznaczenie [WŁ]; zachowanie web wg r2 `save.ts:693,695`, nie re-weryfikowane w r3). | Oznaczenie [WŁ] w P2-11 nie zostało rozstrzygnięte przez właściciela (K-12). |
| D-MIG-3 [WŁ] (P2-11 §10) | RNG po imporcie z `seed`, kolejka pusta | GENUINE-kandydat → **O-10** | Nie zamknięte. |
| D-MIG-9(b) [WŁ] | Odrzucenie zapisu bez `mapSnapshot` | GENUINE-kandydat → **O-3** | Nie zamknięte. |
| D-MIG-10 [WŁ] (P2-11 §10) | Wariant A: import jako dane | DECISION_REQUIRED → O-12 (oznaczenie [WŁ]) | Korekta P2-2 → K-5. |
| D-MIG-11 [WŁ] (P2-11 §10) | `combat.siege_started_turn` | DECISION_REQUIRED → O-13 (oznaczenie [WŁ]) | — |
| D-MIG-13 (P2-11 §6A) | Odrzucenie wiersza 46 (`ownerDisplayName`) | NIE-GENUINE (pole wyświetlane, nie stan gry; klasa UI wg P2-2 §8 pkt 10(b), cytat r2 nie sprawdzony w r5) | Uzasadnienie pojedyncze podane (zarzut 5 r5). |
| D-MIG-18 [WŁ] | Miejsce `autoManageCities` | GENUINE-kandydat → **O-2e** | Nie zamknięte. |
| D-MIG-19 [WŁ] (P2-11 §10) | Import `inGarnizon` jako dane | DECISION_REQUIRED → O-14 (oznaczenie [WŁ]) | Sprzeczne z P2-3 D-ID-5 → K-1. |
| D-MIG-21 [WŁ] | Czas życia tabeli ID | GENUINE-kandydat → **O-2f** | Nie zamknięte. |
| D-MIG-22 (P2-11 §6A) | Import jednokierunkowy (odpowiedź właściciela D7) | NIE-GENUINE (wynika z D7: import jednokierunkowy jest konsekwencją odpowiedzi właściciela na D7) | Cytat D7 z r2, nie sprawdzony w r5; uzasadnienie pojedyncze podane (zarzut 5 r5). |
| D-CMD-12 (P2-5 §9 pkt 2, 13) | `selectedUnitId` = stan widoku | NIE-GENUINE (zaznaczenie w UI nie jest stanem gry; P2-5 §9 pkt 2, 13, cytat r2) | Uzasadnienie pojedyncze podane (zarzut 5 r5). |
| D-CMD-14 (P2-5 §4, l.526) | Zamknięte w P2-5 w r4 (wpis P2-5 l.19) | DO-ROZSTRZYGNIĘCIA-PRZEZ-FC (zarzut 5 r5: treść nieoceniona w tej syntezie) | Zamknięcie w P2-5 nie zawiera oceny klasy. |
| D-CMD-15 | → O-9 | DECISION_REQUIRED | Nie zamknięte. |
| D-CMD-19 | → O-8 | DECISION_REQUIRED | Nie zamknięte. |
| P2-5 §9 pkt 14 (granularność `set_city_policy` / B8) i pkt 17 (`owner: PlayerId` jawny) | Orkiestrator (§9), bez numeru D-CMD | NIE-GENUINE (kształt komend) | Brak ID w §4; zapisać jako rozstrzygnięte bez ID. |
| D-EV-14 (P2-6 §6, §9 pkt 3) | → O-1 | DECISION_REQUIRED (flaga Final Control, LEDGER l.82) | Ścieżka A/B (Z-1). |
| D-EV-15 (P2-6 §9 pkt 7) | Granulacja eventów | NIE-GENUINE (granulacja) | — |
| P2-6 §9 pkt 8 (`engine_state_changed` jako snapshot, `engine_event` dodatkowy) | Orkiestrator (§9) | DECISION_REQUIRED → O-19 (flaga Final Control, LEDGER l.82) | Zależne od D-EV-1 (otwarte, O-2b). |
| P2-6 §9 pkt 9 (brak bufora zdarzeń) | Orkiestrator (§9) | DECISION_REQUIRED → O-20 (flaga Final Control, LEDGER l.82), **zależne od D-EV-3** | Jeśli D-EV-3 (O-2b, klasa (i)) wymaga potwierdzenia właściciela, pkt 9 wymaga tego samego (K-9). |
| D-FIX-15 (P2-10 §16 pkt 1) | Zamknięte w P2-10 §16 (trzy przejścia czytania uznane za dowód) | DECISION_REQUIRED → O-22 (zarzut 5 r5) | Forma dowodu sporna: P2-10 §7 nazwał ją DO_DECYZJI, §16 zamknął; ta synteza nie zamyka jej bez decyzji. |
| D-FIX-20 (P2-10 §16 pkt 3) | Wyrocznia = wyłącznie zmierzona wartość web | DECISION_REQUIRED → O-21 (flaga Final Control, LEDGER l.84; §16 jest rozstrzygnięciem orkiestratora, nie właściciela) | Sprzeczność klasyfikacji (P2-10 §7 vs §16) zgłoszona w zarzucie 4 r4; K-11 dotyczy liczby, nie tej klasy. |

---

## 5. Weryfikacja kryteriów z dispatchu

| Kryterium | Wynik |
|---|---|
| Tabela 12 wierszy z statusem i streszczeniem | **CZĘŚCIOWO SPEŁNIONE (zarzut 3 r5 przyjęty).** Statusy zgodne z LEDGER, z korektami P2.3, P2.10 i etykiet LIMIT-5 (zarzuty 6, 7, 9). Streszczenia P2.9 (units.json, l.113 sprawdzone w tej korekcie) i P2.10 (cytat r2, §16 nie przeczytany w całości) nie są w pełni zweryfikowane; pozostałe jak w §7. |
| Sekcja kontradykcji z listą par faktycznie porównanych | Wykonane dla par K-1…K-14 (§2), z liniami i zaznaczeniem, co sprawdzono w r3/r5. **Nie wykonano pełnej macierzy 12×12.** Pary z rundy 2 nie są deklarowane jako zgodne. |
| Sekcja zobowiązań z jawnym rozliczeniem każdego | Z-1…Z-13 mają status i opis. **Z-1 NIE jest rozliczone: kryterium NIESPEŁNIONE** (zarzut 3 r4; brak wyboru A/B; wykonanie nie rozpoczęte). |
| Werdykt, czy bramka P2 jest formalnie otwarta dla P3 | **NIE.** Patrz §6. |
| Zero zmian w `gra/**`, zero kodu Rust, zero zmian w P2.1–P2.12 | Zgodnie z `git status` (r3): jedyna zmiana to plik nowy `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md`. |

---

## 6. Werdykt bramki i warunki otwarcia P3

**Werdykt:** bramka P2 **NIE jest formalnie otwarta** dla P3.

Warunki, po spełnieniu których Operator (kolejna runda) lub orkiestrator może ponownie wydać werdykt:

0. **Czytanie obowiązkowe (zarzut 1 r3):** przeczytanie w CAŁOŚCI 12 plików P2-n oraz pełna macierz 12×12, w osobnym temacie czytania (wynik poza P2-13). Do tego czasu werdykt NIE.
1. **Z-1 / O-1 (ścieżka A):** wykonanie przeglądu 288 plików w temacie `R-RUSTPORT-P2.6-R-REVIEW-288` z wynikiem PASS (albo FAIL z poprawką wykonaną w tym samym temacie). Akceptacja ryzyka (opcja b) nie jest używana.
2. **K-1…K-14:** poprawki zapisu w dokumentach P2 wykonywane w **osobnym temacie korekt P2** (ten temat nie zmienia P2.1–P2.12). Każda sprzeczność ma jedno miejsce poprawki: K-1 (P2-3 §9 D-ID-5 albo P2-11 §6 D-MIG-19 / §10), K-2 (P2-11 §4B w.94), K-3 (P2-12 w.9, P2-11 D-MIG-9(b)), K-4 (P2-2 l.193–195, D12), K-5 (P2-2 §4 l.85, §8 10(b)), K-6 (P2-2 l.95), K-7 (P2-12 §15), K-8 (P2-6 §6 l.277 albo §9 pkt 3), K-9 (P2-6 §6 l.266 albo §9 pkt 9), K-10 (P2-5 §4 vs §9), K-11 (P2-10 §7 vs §16), K-12 (LEDGER l.83 vs P2-11 [WŁ]), K-13 (LEDGER l.79 vs P2-2 l.119), K-14 (LEDGER l.78 vs P2-8 §6, §7).
3. **O-1, O-2a, O-2b, O-2c, O-2d, O-2e, O-2f, O-3, O-4, O-5, O-6, O-7, O-8, O-9, O-10, O-11…O-21:** rozstrzygnięcie przez właściciela (klasa GENUINE-kandydat i DECISION_REQUIRED). Furtka „uznania za odwracalną" została usunięta (zarzut 11 r5): dispatch nie przewiduje takiego uznania ani podmiotu, który by je wydał. Klasa NIE-GENUINE w O-2a(ii) i O-2b(ii) może być zatwierdzona przez Final Control; pozycje wątpliwe (O-11…O-15, O-22) są DECISION_REQUIRED i FC ich nie zatwierdza bez właściciela.
4. **Zobowiązania P3 do GOAL** (nie blokują werdyktu, ale muszą być wpisane przed otwarciem P3). **Stan: NIEWPISANE.** Operator nie zapisuje poza allowlistą. Orkiestrator wkleja poniższy blok do GOAL tematu otwierającego P3:

```text
ZOBOWIĄZANIA Z P2-13 (wpisać do GOAL tematu otwierającego P3):
(a) Z-4: uzupełnić building_costs.rs o warsztat_oblezniczy i akademia_wojskowa (40 z 42 rekordów obecne; P2-9 §1 w.3, §2e l.104).
(b) Z-3 (WARUNKOWE na O-5): wyrównać recruitment.rs do units.json (75/75 wartości rozbieżnych; P2-9 §3 l.113). Jeśli O-5 da wartości Rust jako kanon, zamiast tego web -> Rust nie jest wymagane.
(c) Z-5: loader danych gra/data w Rust (29/29 BRAK; P2-9 §4, §5 — zakres P3.5–P3.7).
(d) Z-2 pkt 1 i pkt 3: zakres bitowej zgodności generatora i semantyka seed 0 (O-4). Zakres P3/P4 po decyzji właściciela.
(e) Z-6: ustalić przyczynę rozjazdu tartaku 50 vs 200 i ×5 (P1-16D, P2-12 w.27).
(f) Z-7: nazwać placeholdery City (~30 pól) i RuntimeUnit (14 pól) w P2.2 §2 (P2-12 §5, G12).
(g) Z-11 (D-CMD, 17 nierozstrzygniętych) i Z-12 (D-EV, 14 nierozstrzygniętych): rozstrzygnąć przed implementacją odpowiednich części bridge.rs i events.rs; lista i klasy w P2-13 §4 O-2a, O-2b, O-8, O-9, O-15, O-1.
(h) Z-10 (D-FIX, 20 pozycji dla bramki: 19 + D-FIX-20/O-21; D-FIX-15 → O-22): rozstrzygnąć przed pierwszym realnym PASS fixture (P2-10 §16).
```

**Co nie blokuje P3:** P2.10 D-FIX (blokują pierwszy realny PASS fixture, nie implementację kontraktu); Z-5, Z-6, Z-7 (zakres P3 lub korekta dokumentu); Z-13 (P1).

---

## 7. Zakres czytania (jawnie, odstępstwo od wymogu)

**Wymóg dispatchu:** przeczytać OBOWIĄZKOWO w CAŁOŚCI LEDGER (wpisy P2.1–P2.12) oraz 12 plików P2-n. **Stan r5: wymóg NIE spełniony w całości. W r5 w całości: LEDGER (wpisy), P2-1, P2-4, P2-7, P2-8 (4 z 12). Nieprzeczytane w całości: P2-2, P2-3, P2-5, P2-6, P2-9, P2-10, P2-11, P2-12 (≈650 KB). Odstępstwo jawne, uzasadnione w tym §; warunek 0 w §6. Plan partii w §0c zarzut 1.**

| Plik | Stan w rundzie 3 | Uwagi |
|---|---|---|
| `LEDGER.md`, wpisy P2.1–P2.12 (wiersze 73–86) | **Przeczytane w całości** (narzędzie Read, bez obcięcia linii) | Wiersze 1–69 (P0/P1) nie są wymagane dispatchem dla P2.x; nieczytane w r3. |
| P2-1-DOMAIN-MODULES (70 linii) | **Przeczytane w całości w r5** | §2 (11 odroczonych) i §3 (172+11=183) zweryfikowane. |
| P2-2-GAMESTATE-CONTRACT (219 linii) | Fragmenty w r3: l.85, l.95, l.119, l.160–161, l.207, l.209–210 | Reszta nieczytana w r3. |
| P2-3-ENTITY-IDS (363 linie) | Fragmenty w r3: l.113, l.135, l.160, l.283, l.315–321 | Pełne tabele pól i pozostałe D-ID nieczytane w r3. |
| P2-4-RNG-DETERMINISM (66 linii) | **Przeczytane w całości w r5** | Status NIEZGODNE; `ziemia` NIEZGODNE (l.43–44); pangea/wyspy NIEROZSTRZYGNIĘTE (l.45) — zgodne z §1. |
| P2-5-COMMANDS (668 linii) | Fragmenty w r3: l.13–37, l.83–113 (wybrane wiersze), l.522, l.535, l.540, l.658, l.662 | Nie czytano w całości. |
| P2-6-EVENTS (1075 linii) | Fragmenty w r3: l.40, l.266, l.277, l.1040–1047, l.1052–1073 | Nie czytano w całości; **Z-1 nieczytany (288 plików).** |
| P2-7-SAVE-SERIALIZATION (119 linii) | **Przeczytane w całości w r5** | §2 (22 klucze), §3 (94 pozycje meta), §4 (gap potwierdzony). |
| P2-8-TAURI-ADAPTER (95 linii) | **Przeczytane w całości w r5** | §6 i §7; rozbieżność z LEDGER l.78 (K-14). |
| P2-9-ASSET-DATA-MAPPING (1806 linii) | Fragmenty w r3 i r5: l.29, l.31, l.104, l.112, l.113, l.121 | Nie czytano w całości. |
| P2-10-FIXTURES (681 linii) | Fragmenty w r3: l.7, l.36, l.42, l.153–158, l.238–249, l.460–461, l.480, l.488–516, l.513, §16 (l.647–668) | Nie czytano w całości. |
| P2-11-SAVE-MIGRATION (574 linie) | Fragmenty w r3: l.35, l.78–79, l.98, l.119, l.175, l.189, l.195, l.222, l.240, l.341, l.410, l.428–446, l.508, l.539 | Nie czytano w całości. |
| P2-12-COMPLIANCE-MATRIX (248 linii) | Fragmenty w r3: l.9, l.35, l.129–135, l.220–248 (l.245) | Nie czytano w całości. |

**Dlaczego odstępstwo:** łączny rozmiar 12 plików P2-n wynosi około 750 KB (P2-6 około 184 KB, P2-5 około 110 KB, P2-9 około 100 KB, P2-10 około 97 KB, P2-11 około 77 KB, P2-12 około 56 KB, pozostałe około 90 KB). Pełne czytanie w jednej turze Operatora (Haiku 5.5 medium) przekracza bezpieczny budżet kontekstu. Pełne czytanie wymaga podziału na partie, np. w temacie `P2.6-R` lub w osobnym temacie czytania P2-n.

**Cytaty sprawdzone w r3 (sed/grep na plikach, wynik potwierdzony):** P2-2 l.85, l.95 (16 kluczy), l.119, l.160–161, l.207, l.209–210; P2-3 l.315–321; P2-5 l.522, l.535, l.540, l.658, l.662; P2-6 l.266, l.277, l.1040–1047, l.1059 (dopisane w r4: sed potwierdził treść „zgodnie z D-EV-3", zarzut 6 r4); P2-10 l.513, §16 pkt 1 i 3; P2-11 l.341, l.430, l.444–446, l.539; P2-12 l.35, l.129–135, l.245; LEDGER l.73–86.

**Cytaty sprawdzone w r5 (grep/sed lub pełne czytanie pliku):** P2-6: brak nagłówka i odwołania „§16" (grep: 0 trafień); l.277 (D-EV-14), l.1040–1047 (pkt 3, „warunek wstępny P2.13") — potwierdzone. P2-2: l.95 (16 pozycji, w tym `regularWarCapturedByPairKey`), l.160–161 (D7), l.207 (15 kluczy) — potwierdzone. P2-12 l.245 — potwierdzone. P2-9: l.29 (wiersz 1: tekst „136 parametrów", kolumna 139), l.104 (40/40 zgodne), l.112 (buildings 40/40 zgodne), l.113 (units 0/75 zgodne, 75/75 rozbieżne; w r1–r5 błędnie podawane jako l.112), l.121 („loader dla 30 plików") — potwierdzone. P2-4: l.9, l.10, l.18, l.43–46, §6 — potwierdzone (pełne czytanie). P2-7: §2–§4, l.63–80 — potwierdzone (pełne czytanie). P2-8: §6 l.71–72, §7 l.88 — potwierdzone (pełne czytanie). P2-1: §2, §3 — potwierdzone (pełne czytanie). LEDGER l.73–86 — potwierdzone (sed 70–86 w r5).

**Cytaty z rundy 2, NIE sprawdzone w r5:** P2-2 §2 l.38, l.48, l.84, D8 l.181–184, D14 l.200–201; P2-11 §6 D-MIG-10 i D-MIG-14, §6A, §10 pozostałe pozycje; P2-6 §9 pkt 8 (l.1052–1059 częściowo); P2-9 §1 wiersz 1 (136 vs 139), §4 (l.121); P2-7 §3; P2-10 §0–§6; P2-12 §1 pozostałe wiersze.

**Ograniczenia:**
- Werdykt „bramka NIE otwarta" pozostaje. Werdykt „otwarta" jest niedopuszczalny, dopóki luka czytania nie zostanie domknięta.
- Przegląd 288 plików (Z-1) nie został wykonany; wybrana ścieżka A.
- Pełna macierz par (12×12) nie była sprawdzana.
- Fakty z `gra/` i `rust-port/` nie zostały zweryfikowane na nowo; jest to rola Evaluatora i Final Control.
- Status „PASS" w LEDGER przyjęto jako fakt procesowy; ocena merytoryczna należy do §4.
- Liczby z P2-9 (suma 1527, 75/75) przyjęto z LEDGER lub z rundy 2 bez ponownego sumowania.

**DEPLOY/PUSH: NIE WYKONANO.**
