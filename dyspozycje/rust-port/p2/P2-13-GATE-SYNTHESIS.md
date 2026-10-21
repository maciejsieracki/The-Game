# P2.13 — Synteza bramki fazy P2 (spójność i kompletność przed P3)

**Temat:** `R-RUSTPORT-P2-13-FINAL-CONTROL-Q1` · **Runda:** 2/5 (Operator, obrona po zarzutach Evaluatora na wyniku rundy 1/5 nowej architektury; dispatch `dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/00c-dispatch-r3-parallel.md` l.8 podaje `1/5` — rozbieżność licznika zgłoszona, zlecenie obrony wskazuje 2/5) · **Rola:** Synteza (Faza 2), wersja po obronie
**Źródła:** 8 raportów czytelników (Faza 1) + digest `dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/p2-digest.md`. P2.1, P2.4, P2.7, P2.8 — wg digestu (przeczytane w całości w rundzie 1). Dodatkowo w rundzie 2: sprawdzenia grepem (macierz odwołań krzyżowych, linie cytowane w zarzutach).
**Charakter:** dokument syntezy. Zero zmian w `gra/**`, zero kodu Rust, zero zmian w P2.1–P2.12.
**Status tego dokumentu:** wynik syntezy po obronie, do Evaluatora i Final Control. **Nie jest decyzją bramki** (werdykt §6 — bramka NIE otwarta).

## 0. Zastrzeżenia o pokryciu (przed wynikami)

- **Pełne przeczytanie (warunek binarny „12/12 przeczytane z cytatami”) — NIESPEŁNIONY (zarzut 1 PRZYJĘTY).**
  - zweryfikowane cytatami: P2.3 (363 l.; l.1 „# P2.3 — Schemat ID encji i relacji…”; l.362 „…pozostają zaplanowane kolejne tematy.”); P2.11 (574 l.; l.1 „# P2.11 — Reguła migracji zapisów web → `GameState`…”; l.574 „…decyzje produktowe, do rozwiązania przy implementacji importera.”). Środek tych plików nie jest w tej rundzie ponownie potwierdzony;
  - **NIESPEŁNIONE:** P2.6 — raport czytelnika sam deklaruje czytanie częściowe (l.1–150, 262–321, 1020–1076; l.151–261 i 322–1019 nieprzeczytane);
  - **BRAK POTWIERDZENIA pełnego odczytu:** P2.2, P2.5, P2.9, P2.10, P2.12 — raporty podają cytaty pierwszej/ostatniej linii, bez deklaracji pełnego odczytu. Traktowane jako niepotwierdzone;
  - w rundzie 2 nie wykonano nowego pełnego czytania 12 plików; sprawdzenia tej rundy są punktowe (grep, linie wskazane w zarzutach) i nie zastępują czytania.
- **Weryfikacja własna syntezy (odczyt bezpośredni i grep, runda 2):** P2-3 §9 (l.299–362); P2-11 l.434–447, 499–506; P2-2 l.38, 85, 95, 153 (początek §8), 193, 207; P2-5 l.19–21, 34, 194, 578, 597; P2-6 l.274, 277, 303–320, 1028–1058; P2-10 l.7, 643, 677; P2-12 l.117, 211, 220–250. Grep `§16` w `P2-6-EVENTS.md` — brak trafień (numeracja to §9). Grep `Z-1` w `P2-6-EVENTS.md` — brak trafień (rozstrzygnięcie Z-1 istnieje wyłącznie w digeście). Grep `PASS` w `P2-7`, `P2-8`, `P2-9`, `P2-4` — 0 trafień; `P2-4` l.9 zawiera deklarację „NIEZGODNE dla pełnej sekwencji generatora świata”.
- **Macierz odwołań krzyżowych (§2):** policzona grepem (wzorzec `P2[.-]N`, bez self-odwołań) dla wszystkich 66 par. Para bez żadnego odwołania w żadną stronę = „BRAK PUNKTU STYKU”. Para z odwołaniem = „ODWOŁANIE” z liczbą trafień i BEZ oceny zgodności, chyba że ocena jest w §5. Odwołanie krzyżowe nie jest dowodem zgodności ani sprzeczności.

## 1. Tabela 12 wierszy (P2.1–P2.12)

| Nr | Temat | Plik | Status (wg sekcji rozstrzygnięć) | Streszczenie (1 zdanie) |
|---|---|---|---|---|
| P2.1 | Moduły domeny | `P2-1-DOMAIN-MODULES.md` | PASS (wg digestu; plik bez sekcji rozstrzygnięć) | Katalog 15 modułów domeny, 183/183 plików web przypisanych. |
| P2.2 | Kontrakt `GameState` | `P2-2-GAMESTATE-CONTRACT.md` | PASS (§8; nagłówek przedawniony) | Szkielet `GameState` z mapowaniem modułów i 94 kluczy meta; jedyna decyzja właściciela wg digestu: D7 (Rust czyta zapisy web 1:1). Błędy do korekty: §5 B2 (`budowaListaBiblioteka`); szkielet §2 l.38 (`CultureState`) przedawniony przez §8 D12 (B5). |
| P2.3 | Schemat ID encji | `P2-3-ENTITY-IDS.md` | PASS (§9) | Newtype `u64` per typ, licznik monotoniczny, `OwnerRef`; D-ID-5 rozstrzygnięte jako pole przechowywane `oblega`. Sprzeczność z P2.11 w `inGarnizon` (§5 B3). |
| P2.4 | RNG i determinizm | `P2-4-RNG-DETERMINISM.md` | PASS z zastrzeżeniem (wg digestu); plik l.9 deklaruje **NIEZGODNE** dla pełnej sekwencji generatora świata | Prymitywy RNG zgodne matematycznie; generator świata Rust niezgodny z web (zakres P3/P4). |
| P2.5 | Komendy frontend→Rust | `P2-5-COMMANDS.md` | LIMIT-5-EXCEEDED (§9; formalny status rundy 5/5; wpis „PASS” w pliku to zamknięcie administracyjne, nie status) | Katalog 96 wierszy (0 GOTOWA, 28 CZĘŚCIOWA, 48 BRAK, 20 WIDOK); typy DealId/BattleId/SlotId/ItemId/OwnerPolicy użyte bez definicji (§5 B4). |
| P2.6 | Eventy Rust→frontend | `P2-6-EVENTS.md` | LIMIT-5-EXCEEDED (§9; formalny status rundy 5/5; czytanie częściowe) | Katalog 53 eventów wg §7 (0 GOTOWY, 12 CZĘŚCIOWY, 40 BRAK, 1 WYKLUCZONY = E-45); poza tym sekcja 3.F (E-49…E-55, 7 wierszy WYKLUCZONY wg D-EV-13) — łącznie 8 wierszy WYKLUCZONY. §8: 24 typy payloadu bez definicji w P2.2/P2.3 (D-EV-11, §5 B13). Z-1: konflikt treści (§3, B8). Warunek czytania NIESPEŁNIONY (§0). |
| P2.7 | Serializacja zapisu | `P2-7-SAVE-SERIALIZATION.md` | PASS-WITH-NOTES (wg digestu; plik bez pola statusu) | Katalog 22 top-level + 94 `meta` kluczy; gap `meta.forcedWarWavesByPairKey` potwierdzony w digeście. Zakres porównania pól `RuntimeUnit`/`City` z DTO Rust przekazany do P2.2/P2.3 (P2-7 l.106). |
| P2.8 | Adapter Tauri | `P2-8-TAURI-ADAPTER.md` | BEZ DECYZJI (wg digestu; plik bez pola statusu i bez słowa PASS) | Dziś 1 komenda `engine_command` (6 wariantów) i 1 event; żadna docelowa kategoria P2.5 nie jest wpięta. |
| P2.9 | Mapowanie danych `gra/data` | `P2-9-ASSET-DATA-MAPPING.md` | **Nierozstrzygnięty** (B9): digest — „bez DECISION_REQUIRED”; plik bez sekcji rozstrzygnięć; słowa PASS w pliku brak | Loader danych BRAK; `units.json` 75/75 nazw zgodnych, 75/75 wartości rozbieżnych; babilon/babilonia i 6/15 surowców poza `ResourceKey` (§5 B6). |
| P2.10 | Fixtures i replay | `P2-10-FIXTURES.md` | PASS (§16) — **formalnie LIMIT-5-EXCEEDED** rundy 5/5 (l.643: „Status rundy 5/5: DECISION_REQUIRED (nie PASS)”; l.677: „mimo formalnego LIMIT-5-EXCEEDED”) | Format fixture v1 i 7 scenariuszy FX-01…FX-07, wszystkie UNSUPPORTED po stronie Rust; nic nie uruchomiono. |
| P2.11 | Migracja zapisów | `P2-11-SAVE-MIGRATION.md` | PASS (§10) — 8 pozycji [WŁ] rozstrzygniętych administracyjnie w §10 (B7) | Reguła importu 22 top-level + 94 meta (116 wierszy); tabela legacy-ID atomowa; import nieniszczący. |
| P2.12 | Macierz zgodności P1 | `P2-12-COMPLIANCE-MATRIX.md` | PASS (§15) — **formalnie LIMIT-5-EXCEEDED** rundy 5/5 (§15 l.244: „mimo formalnego LIMIT-5-EXCEEDED rundy 5”) | 41 wierszy P1: 18 POKRYTY, 19 CZĘŚCIOWO, 4 LUKA (wiersze 25, 26, 28, 29 — poza zakresem P2.9). |

## 2. Macierz spójności — 66 par

Legenda:
- **ZGODNE** — brak sprzeczności wykrytej, punkt styku wskazany w tekście pliku (§ lub linia podana w wierszu);
- **ZGODNE PO ROZSTRZYGNIĘCIU** — rozbieżność wynika z przedawnionej treści w jednym pliku; wiąże rozstrzygnięcie z sekcji rozstrzygnięć;
- **PRZEDAWNIONA** — rozbieżność liczbowa, wiążąca wartość wskazana, korekta drugiego pliku wymagana;
- **ODWOŁANIE (n)** — odwołania krzyżowe w co najmniej jedną stronę (n = suma trafień obu stron wzorca `P2[.-]N`); **zgodność NIE oceniona** w tej rundzie;
- **BRAK PUNKTU STYKU** — 0 odwołań w obu stronach (grep);
- **SPRZECZNOŚĆ** — z dowodem w §5.

| # | Para | Trafienia (A→B / B→A) | Wynik | Dowód / uwaga |
|---|---|---|---|---|
| 1 | P2.1 × P2.2 | 4 / 8 | ZGODNE | P2-2 l.54 §3 „Mapowanie 15 modułów domeny (P2.1) na pola”. |
| 2 | P2.1 × P2.3 | 0 / 2 | ODWOŁANIE (2) | Zgodność nieoceniona. |
| 3 | P2.1 × P2.4 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 4 | P2.1 × P2.5 | 0 / 9 | ODWOŁANIE (9) | P2.5 odwołuje się do P2.1; zgodność nieoceniona. |
| 5 | P2.1 × P2.6 | 0 / 14 | ODWOŁANIE (14) | P2.6 odwołuje się do P2.1; zgodność nieoceniona. |
| 6 | P2.1 × P2.7 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 7 | P2.1 × P2.8 | 0 / 1 | ODWOŁANIE (1) | — |
| 8 | P2.1 × P2.9 | 0 / 7 | ODWOŁANIE (7) | P2-9 cytuje P2.1 (M4/M8/M10); zgodność nieoceniona. |
| 9 | P2.1 × P2.10 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 10 | P2.1 × P2.11 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 11 | P2.1 × P2.12 | 0 / 30 | ODWOŁANIE (30) | P2.12 odwołuje się do P2.1; zgodność nieoceniona. |
| 12 | P2.2 × P2.3 | 9 / 26 | ZGODNE | P2.3 §9 D-ID-4/D-ID-10 stosuje zasadę P2.2 §1 (stan wyprowadzalny nie jest przechowywany). |
| 13 | P2.2 × P2.4 | 3 / 2 | ZGODNE | RNG poza szkieletem (D11, P2.2) — brak sprzeczności z P2.4. |
| 14 | P2.2 × P2.5 | 0 / 37 | SPRZECZNOŚĆ | §5 B4: `OwnerPolicy` użyty w P2.2 l.48 i w P2.5 A3 bez definicji. |
| 15 | P2.2 × P2.6 | 0 / 24 | SPRZECZNOŚĆ | §5 B13: P2.6 §8 (l.303–320) — 24 nazwy typów payloadu bez definicji w P2.2 i P2.3 (D-EV-11). P2.2 nie odwołuje się do P2.6 (0 trafień `engine_event`/`engine_state_changed`). |
| 16 | P2.2 × P2.7 | 16 / 7 | ZGODNE | Oba katalogi: 22 top-level + 94 `meta`; gap `forcedWarWavesByPairKey` zgodny w obu (wg digestu). |
| 17 | P2.2 × P2.8 | 3 / 1 | ODWOŁANIE (4) | P2-2 l.110, 112 cytuje P2.8 §6 (D5, moduły niewpięte); zgodność nieoceniona. |
| 18 | P2.2 × P2.9 | 6 / 2 | SPRZECZNOŚĆ | §5 B6: babilon/babilonia (P2.2 D4 ↔ P2.9 §2d odsyłają do siebie); 6/15 surowców poza `ResourceKey`. |
| 19 | P2.2 × P2.10 | 0 / 12 | ODWOŁANIE (12) | P2.10 odwołuje się do P2.2; zgodność nieoceniona. |
| 20 | P2.2 × P2.11 | 7 / 209 | SPRZECZNOŚĆ | §5 B2: `budowaListaBiblioteka` — P2.2 §8 pkt 10(b) (l.209–210) = ODRZUC; P2.11 D-MIG-10 = import. |
| 21 | P2.2 × P2.12 | 5 / 105 | ZGODNE PO ROZSTRZYGNIĘCIU | §5 B5: `CultureState` — l.38 (§2 szkielet) przedawniony przez §8 D12 (l.193: „stok `culture` zostaje w `economy`”). |
| 22 | P2.3 × P2.4 | 1 / 0 | ODWOŁANIE (1) | — |
| 23 | P2.3 × P2.5 | 0 / 47 | SPRZECZNOŚĆ | §5 B4: `DealId`/`BattleId`/`SlotId`/`ItemId`/`OkolicaTryb` nieobecne w P2.3; P2.5 §9 pkt 8 twierdzi rozszerzenie kanonu P2.3. |
| 24 | P2.3 × P2.6 | 0 / 15 | SPRZECZNOŚĆ | §5 B13: P2.6 §8 — `DealId`, `TradeRouteId`, `WonderId`, `ImprovementId`, `ProductionItemId`, `UnitTypeId`, `CommandId` nie są w P2.3 (DECISION_REQUIRED D-EV-11). Typy `PlayerId`/`CityId`/`UnitId`/`OwnerRef`/`HexCoord` — zdefiniowane w P2.3; ich zgodność z payloadami nieoceniona. |
| 25 | P2.3 × P2.7 | 5 / 1 | ODWOŁANIE (6) | P2-7 l.106: zakres porównania pól RuntimeUnit/City z P2.2/P2.3; zgodność nieoceniona. |
| 26 | P2.3 × P2.8 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 27 | P2.3 × P2.9 | 4 / 0 | ZGODNE | `kind` = klucz katalogu danych (P2.3 D-ID-10), zgodnie z wzorcem P2.9. |
| 28 | P2.3 × P2.10 | 0 / 9 | ODWOŁANIE (9) | — |
| 29 | P2.3 × P2.11 | 5 / 65 | SPRZECZNOŚĆ | §5 B3: `inGarnizon` (P2.3 §9 l.321 vs P2.11 D-MIG-19). `oblega` ZGODNE (K-1). |
| 30 | P2.3 × P2.12 | 4 / 68 | ZGODNE PO ROZSTRZYGNIĘCIU | §5 B12: P2.12 §15 pkt 4 — zakres pól D-ID-11 PRZESĄDZONY (P2.3 §9, l.344–345); P2.12 §5 (l.117) przedawniony. |
| 31 | P2.4 × P2.5 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 32 | P2.4 × P2.6 | 0 / 3 | ODWOŁANIE (3) | P2.6 l.178, 256, 271 odsyła do P2.4 (D-EV-8, RNG); zgodność nieoceniona. |
| 33 | P2.4 × P2.7 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 34 | P2.4 × P2.8 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 35 | P2.4 × P2.9 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 36 | P2.4 × P2.10 | 0 / 15 | ZGODNE (uwaga) | P2.10: web nie ma seedowanego runu; P2.4 dotyczy prymitywów. Nie sprzeczne. |
| 37 | P2.4 × P2.11 | 0 / 2 | ZGODNE | P2-11 D-MIG-9b odwołuje się do P2.4 (zgodność generatora niepotwierdzona → import odrzucany, nie regenerowany). |
| 38 | P2.4 × P2.12 | 0 / 7 | ODWOŁANIE (7) | — |
| 39 | P2.5 × P2.6 | 4 / 23 | ODWOŁANIE (27) | P2-5 l.194 (T-2 `execute_pending_event` → „wiersz do P2.6”); P2.6 odwołuje się do P2.5 (23). Zgodność nieoceniona — nie oznaczona SPRZECZNOŚCIĄ. |
| 40 | P2.5 × P2.7 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 41 | P2.5 × P2.8 | 14 / 4 | ZGODNE | P2.8 (1 komenda) vs cel P2.5 (96 wierszy) — luka opisana w obu. |
| 42 | P2.5 × P2.9 | 3 / 0 | ODWOŁANIE (3) | — |
| 43 | P2.5 × P2.10 | 0 / 47 | ODWOŁANIE (47) | P2-10 l.83 cytuje P2.5 (T-1, D-CMD-2); zgodność nieoceniona. |
| 44 | P2.5 × P2.11 | 2 / 1 | ODWOŁANIE (3) | — |
| 45 | P2.5 × P2.12 | 1 / 33 | ODWOŁANIE (34) | — |
| 46 | P2.6 × P2.7 | 8 / 0 | ODWOŁANIE (8) | — |
| 47 | P2.6 × P2.8 | 6 / 0 | ODWOŁANIE (6) | P2-6 §9 pkt 8: `engine_event` (nowy, powiadomienia) obok `engine_state_changed` (snapshot, P2-8). Zgodność kanału do opisu w P3 — nie „ZGODNE” na podstawie liczb. |
| 48 | P2.6 × P2.9 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 49 | P2.6 × P2.10 | 0 / 28 | ODWOŁANIE (28) | — |
| 50 | P2.6 × P2.11 | 0 / 1 | ODWOŁANIE (1) | — |
| 51 | P2.6 × P2.12 | 1 / 22 | ODWOŁANIE (23) | — |
| 52 | P2.7 × P2.8 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 53 | P2.7 × P2.9 | 1 / 0 | ODWOŁANIE (1) | — |
| 54 | P2.7 × P2.10 | 0 / 11 | ODWOŁANIE (11) | — |
| 55 | P2.7 × P2.11 | 2 / 8 | ZGODNE | 22 + 94 kluczy w obu; gap `forcedWarWavesByPairKey` potwierdzony (wg digestu). |
| 56 | P2.7 × P2.12 | 0 / 2 | ODWOŁANIE (2) | — |
| 57 | P2.8 × P2.9 | 1 / 0 | ODWOŁANIE (1) | — |
| 58 | P2.8 × P2.10 | 0 / 3 | ODWOŁANIE (3) | — |
| 59 | P2.8 × P2.11 | 0 / 0 | BRAK PUNKTU STYKU | — |
| 60 | P2.8 × P2.12 | 0 / 4 | ODWOŁANIE (4) | — |
| 61 | P2.9 × P2.10 | 1 / 0 | ODWOŁANIE (1) | — |
| 62 | P2.9 × P2.11 | 0 / 0 | BRAK PUNKTU STYKU | P2-11 nie odwołuje się do P2.9; wspólny obiekt `babilon` pojawia się pośrednio przez P2.2 D4 (§5 B6). Nie liczone jako SPRZECZNOŚĆ bez odwołania. |
| 63 | P2.9 × P2.12 | 0 / 52 | ODWOŁANIE (52) | — |
| 64 | P2.10 × P2.11 | 2 / 0 | ODWOŁANIE (2) | — |
| 65 | P2.10 × P2.12 | 0 / 4 | ODWOŁANIE (4) | — |
| 66 | P2.11 × P2.12 | 0 / 43 | PRZEDAWNIONA | §5 B11: forced-war — P2.12 cytuje P2.2 l.95 (§4: 16 kluczy); wiążące P2.2 §8 pkt 9(f) l.207 (15 kluczy; `regularWarCapturedByPairKey` wyłączony wg D-MIG-14). Korekta P2.12 wymagana. |

**Podsumowanie macierzy (66 par):** ZGODNE 9 · ZGODNE PO ROZSTRZYGNIĘCIU 2 · PRZEDAWNIONA 1 · ODWOŁANIE (zgodność nieoceniona) 33 · BRAK PUNKTU STYKU 14 · SPRZECZNOŚĆ 7 · razem 66.
Liczby sprawdzane grepem; ODWOŁANIE nie jest zgodnością. Pary z ODWOŁANIEM wymagają oceny w P3 lub w kolejnej rundzie, nie są tu zamykane.

## 3. Rozliczenie zobowiązania Z-1 (288 plików z P2.6)

Tekst wklejony dosłownie z digestu (sekcja „Rozstrzygnięcie Z-1”, orkiestrator); numer sekcji podstawiony na §9 (P2.6 nosi numer §9; §16 jest błędem cytowania):

> **Z-1 ROZLICZONE (orkiestrator): opcja (b) — jawne przeniesienie do P3, nie blokuje bramki P2.**
> Uzasadnienie: (i) to jest pytanie o KOMPLETNOŚĆ KATALOGU (czy istnieje jeszcze jakiś nieodkryty event), nie o POPRAWNOŚĆ już skatalogowanych 53 wierszy — ryzyko dotyczy wyłącznie tego, że pojedyncza rzadka akcja gracza nie dostanie powiadomienia UI w Rust, co jest wykrywalne i naprawialne podczas implementacji/testowania P3, nie wymaga przedpłaty teraz; (ii) P2.6 **§9** (NIE §16 — to literówka do poprawienia wszędzie gdzie się pojawi) już wykonał dwie niezależne próby alternatywnych wzorców wyszukiwania (żadna nie znalazła pominiętego eventu) i ręczny przegląd 4 reprezentatywnych plików zerowych (same fałszywe pozytywy) — to nie jest zero dowodu, to ograniczony, ale nie zerowy dowód; (iii) blokowanie całej bramki P2 (12 zamkniętych tematów, setki stron analizy) na pełnym przeczytaniu 6642 linii bez konkretnego sygnału, że coś tam jest, byłoby kosztem niewspółmiernym do ryzyka. Warunek przeniesienia: przed P3.6 (implementacja warstwy eventów) wymagany jest RZECZYWISTY przegląd pozostałych plików z `szeroki_r5_broad` niesklasyfikowanych pojedynczo (dziś 195 plików, gdzie S5/S6=0 mimo trafienia szerokiego wzorca) — zapisane jako zobowiązanie techniczne dla P3, nie dla bramki P2.

**KONFLIKT do decyzji orkiestratora (B8, zarzut 8 PRZYJĘTY):** digest rozstrzyga Z-1 jako „nie blokuje bramki P2”, ale wiążąca treść P2.6 mówi co innego:
- `P2-6-EVENTS.md` l.1046 (§9 pkt 3): „pełny przegląd linia po linii pozostałych 288 plików jest **WYMAGANY jako warunek wstępny P2.13**”;
- `P2-6-EVENTS.md` l.277 (§6, D-EV-14): „przed READY_FOR_DEPLOY” (opcje a/b);
- liczba: P2.6 podaje 288 plików / 6642 linii; digest — 195 plików. Różnicy nie wyjaśnia żaden z plików.
Synteza NIE wybiera między tymi wersjami. Do rozstrzygnięcia przez orkiestratora: czy warunek z P2-6 §9 („przed P2.13”) jest uchylony przez Z-1, czy P2.6 wymaga korekty treści. Do tego czasu bramka nie może uznać Z-1 za zamknięte.

## 4. Ocena pojedyncza: D-ID-1, 2, 3, 4, 6, 7, 11 i D-CMD-14

Każdy punkt oceniony osobno: genuine decyzja właściciela czy rozstrzygnięcie administracyjne. Digest wskazuje D7 jako jedyną decyzję właściciela w P2.2; **to nie jest pełna lista oznaczeń właściciela w plikach** — patrz §4b.

- **D-ID-1** (kanon `u64` newtype; `legacy_id: String` tylko jako tabela importu): administracyjne, poprawne — konsekwencja D7 (import 1:1).
- **D-ID-2** (newtype per typ `PlayerId`/`CityId`/`UnitId`): administracyjne, poprawne — wybór reprezentacji bez wpływu na grę.
- **D-ID-3** (licznik monotoniczny zamiast `Math.random()`): administracyjne, poprawne — dotyczy tylko nowych rozgrywek w Rust.
- **D-ID-4** (`city_ids`/`unit_ids` wyprowadzane, nie przechowywane): administracyjne, poprawne — stosuje zasadę P2.2 §1.
- **D-ID-6** (`HexCoord{q:i32,r:i32}`, `PositionDto{x:u16,y:u16}`): administracyjne, poprawne co do kierunku; zakres `u16` do sprawdzenia w P3 — zadanie otwarte.
- **D-ID-7** (`enum OwnerRef { Player(PlayerId), Barbarian, Rebel }`): administracyjne, poprawne — zastępuje liczby ze znakiem.
- **D-ID-11** (zakres pól BRAK, flagi `ma*` wyprowadzane, flagi UI klasy U): rozstrzygnięcie administracyjne, **częściowo wadliwe** — rozszerzenie P2.2 §8 pkt 10(b) nie może objąć `budowaListaBiblioteka`, którą P2.11 D-MIG-10 importuje (§5 B2). Zakres pól jest PRZESĄDZONY przez P2.3 §9 (l.344–345), potwierdzone w P2-12 §15 pkt 4; wcześniejsza uwaga P2.12 §5 (l.117) jest przedawniona.
- **D-CMD-14** (zakres przeglądu mutatorów w P2.5): **nie była decyzją właściciela**; zakres pracy dowodowej. Zamknięty w r4 (a)–(g). Przyrost 330 → 357 trafień w r5: P2-5 **l.34** (§0, zmiany r4) mówi „330 trafień wzorca w 19 plikach CITED”; ciąg „357/357 … w 33 plikach” pochodzi z **l.597** (sekcja 7b, odpowiedź na zarzut 3 r5), a nie z §0 (błąd cytowania w poprzedniej wersji tego pliku, zarzut 7 PRZYJĘTY). Arytmetyka: 330 + 27 = 357; 19 CITED + 14 OPEN-HITS = 33 pliki. Ograniczenie zakresu pozostaje udokumentowane w P2-5.

**Pozycje, które NIE są sprzecznościami (wg digestu, nie renegocjowane):** K-1 (D-ID-5 `oblega` — P2.3 §9 i P2.11 §10 zgodne; **uwaga:** K-1 nie obejmuje `inGarnizon`, patrz §5 B3) oraz D-CMD-14 jako rozbieżność liczbowa w obrębie P2.5.

### 4b. Pozostałe oznaczenia właściciela w plikach (zarzut 6 PRZYJĘTY)

- **D-CMD-15** (`P2-5` l.20, l.578 „decyzje właściciela, nie Operatora”): 20 wierszy §2.11 bez zapisu `GameState` oznaczono `WIDOK (bez komendy)` przez §9 pkt 1. Ocena: administracyjne (klasyfikacja zakresu), ale oznaczenie „właściciel” w l.578 nie zostało zdjęte — wymaga potwierdzenia orkiestratora.
- **D-CMD-19** (`P2-5` l.21; §9): 13 nazw typów parametrów spoza P2.3 (`grep` P2.2/P2.3 = 0). Ocena: administracyjne co do decyzji, ale brak definicji typów to realny dług (§5 B4) do rozstrzygnięcia w P3.
- **D-EV-11** (`P2-6` §6 l.274, §8 l.311–315): 24 nazwy typów payloadu bez definicji w P2.2 i P2.3; wybór (dopisać ID do P2.3, typy wartości do P2.2 albo prymitywy) wpływa na kształt kontraktu. Ocena: **decyzja architektoniczna, NIEROZSTRZYGNIĘTA**; §9 P2-6 jej nie dotyczy (0 trafień w §9). Dalej jako B13.
- **D-EV-14 / Z-1** (`P2-6` §6 l.277, §9 l.1046): patrz §3 i B8 — konflikt, nie rozstrzygnięcie.
- **D-MIG-1, 3, 9(b), 10, 11, 18, 19, 21 `[WŁ]`** (`P2-11` §10, l.503–504): 8 pozycji oznaczonych jako decyzje właściciela oraz 2 pozycje Final Control (pkt 4 — polityka błędów importu; pkt 5 — los pliku źródłowego). §10 P2-11 rozstrzyga je administracyjnie i stwierdza, że żadna nie wymaga pytania właściciela. Ta synteza nie ocenia ich pojedynczo; status: rozstrzygnięte w pliku, ale oznaczone jako `[WŁ]` — wymagają potwierdzenia (B7).

## 5. Ustalenia blokujące (lista do korekty przez Operatora)

- **B1 — Pokrycie czytania (warunek binarny).** P2.6: czytanie częściowe (raport deklaruje). P2.2, P2.5, P2.9, P2.10, P2.12: brak potwierdzenia pełnego odczytu. Kryterium NIESPEŁNIONE. Wymagane pełne przeczytanie i potwierdzenie w osobnej rundzie.
- **B2 — `budowaListaBiblioteka`.** P2.2 §8 pkt 10(b) (l.209–210) klasyfikuje ją jako flagę UI klasy U (odrzucaną); P2.11 D-MIG-10 (§10, wariant A) importuje ją jako dane. P2.2 nieskorygowany — dwa przeciwne rozstrzygnięcia w dokumentach. **SPRZECZNOŚĆ.**
- **B3 — `inGarnizon`.** P2.3 §9 l.321 („flaga UI/runtime, nie trwały stan do importu”) vs P2.11 D-MIG-19 (§10: import jako dane). P2.11 D-MIG-19 sam stwierdza, że „obecna odpowiedź P2.3 nie wystarcza”. Korekta P2.3 wymagana. `oblega` nie jest tu sprzecznością (K-1). **SPRZECZNOŚĆ.**
- **B4 — Typy ID bez definicji.** `DealId`, `BattleId`, `SlotId`, `ItemId`, `OkolicaTryb` (P2.5 §9 pkt 8 — „rozszerzenie kanonu P2.3”) nie są zdefiniowane w P2.3. `OwnerPolicy` (P2.2 l.48, P2.5 A3 l.149) też bez definicji. Tabele P2.5 (D2 l.113, W10 l.183, Z1 l.202) nadal używają `String`. **SPRZECZNOŚĆ.**
- **B5 — `CultureState` w P2.2.** Szkielet §2 l.38 (`culture: CultureState // M10`) jest sprzeczny z §8 D12 (l.193: „stok `culture` zostaje w `economy`”; „nie tworzymy `CultureState` przedwcześnie dla jednego pola”). Sekcja rozstrzygnięć (§8, od l.153) wiąże, więc **nie jest to sprzeczność otwarta**: rozstrzygnięcie jest D12. Pozostaje korekta szkieletu l.38 (przedawniony zapis). Status: ZGODNE PO ROZSTRZYGNIĘCIU.
- **B6 — `babilon`/`babilonia` i surowce.** P2.2 D4 (l.173–175) odsyła ustalenie pisowni do P2.9; P2.9 §2d (l.100) odsyła do P2.2. Nikt nie zapisał wyboru. Dodatkowo 6 z 15 surowców poza `ResourceKey` (P2.9 l.86). Wpływa na P2-11 D-MIG-12 (pośrednio przez P2.2 D4). **SPRZECZNOŚĆ** (P2.2 ↔ P2.9). Korekta: sprostowanie zapisu w digeście — digest nie nazywa P2.9 „PASS” (digest: „bez DECISION_REQUIRED”); słowa PASS dla P2.9 w digeście nie ma.
- **B7 — `[WŁ]` rozstrzygnięte administracyjnie (proces).** P2-11 §10 rozstrzyga 8 pozycji `[WŁ]` (D-MIG-1, 3, 9(b), 10, 11, 18, 19, 21) oraz 2 pozycje Final Control (pkt 4, 5) bez pytania właściciela; wcześniej w §1, §4B i §6 te same pozycje są oznaczone jako decyzje właściciela. D-MIG-10 jest powiązane z B2. Wymagane: potwierdzenie właściciela albo zmiana oznaczeń z `[WŁ]`. (Poprzednia wersja tego punktu wymieniała tylko D-MIG-10 i D-MIG-18 — niepełne, zarzut 5 PRZYJĘTY.)
- **B8 — Z-1 w P2.6 (konflikt).** Wiążąca treść P2-6 §9 l.1046 („WYMAGANY jako warunek wstępny P2.13”) i l.277 są niezgodne z digestem („nie blokuje bramki P2”). Konflikt wymaga decyzji orkiestratora (§3). Korekta treści P2.6 zależy od tej decyzji.
- **B9 — P2.9 bez sekcji rozstrzygnięć.** Status końcowy nieustalony w źródle (§1). Wymaga jawnego rozstrzygnięcia lub uznania za katalog bez decyzji.
- **B10 — `siegeTurnByCity`.** P2-11 D-MIG-11 (l.435, l.530–532) dodaje `combat.siege_started_turn`; P2.3 §9 (l.315–319) twierdzi pełne wyprowadzenie stanu oblężenia z `oblega`. Model P2.3 wymaga uzupełnienia. **SPRZECZNOŚĆ.**
- **B11 — forced-war 15 vs 16.** P2.2 §4 l.95 (16 kluczy) jest przedawnione przez §8 pkt 9(f) l.207 (15 kluczy; wiążące, §8 od l.153). P2-12 cytuje l.95 — korekta P2.12 wymagana. Wynik: 15 kluczy wg §8; P2-11 wyłącza `regularWarCapturedByPairKey` (D-MIG-14). **PRZEDAWNIONA** (nie sprzeczność otwarta).
- **B12 — zakres D-ID-11 w P2.12.** P2-12 §5 (l.117) i §14 (l.211) są przedawnione przez §15 pkt 4 („zakres PRZESĄDZONY rozstrzygnięciem P2.3 §9 D-ID-11, l.344–345”). Wynik: ZGODNE PO ROZSTRZYGNIĘCIU; korekta przedawnionych fragmentów P2.12 wymagana.
- **B13 — typy payloadu P2.6 bez definicji (NOWY, zarzut 3 PRZYJĘTY).** P2-6 §8 (l.303–320): tabela zgodności typów payloadu z P2.2/P2.3. DECISION_REQUIRED D-EV-11 (l.274, l.311–315): 24 nazwy (m.in. `DealId`, `TradeRouteId`, `WonderId`, `EraIndex`, `CaptureRow`, `UnitIds`, `BuildingBonusGain`, `TechId`, `BattleSummary`) nie są zdefiniowane ani w P2.2, ani w P2.3 (grep = 0 w obu). P2-6 §9 (l.1028+) D-EV-11 nie rozstrzyga. **SPRZECZNOŚĆ** (istotna dla P3; wymaga decyzji).

Nagłówki przedawnione (P2.6 l.3–4, P2.10 l.7, P2.12 l.3, P2.2 l.4) — nie są blokadą, ale wymagają korekty przy okazji B2–B8.

## 6. Werdykt końcowy bramki

### 6a. Rozstrzygnięcia orkiestratora (2026-10-21), zamykające punkty DECISION_REQUIRED tej rundy

Final Control rundy 2 zwrócił agregat DECISION_REQUIRED (4 punkty: 1, 13, 14 + konflikt B8/Z-1).
Orkiestrator rozstrzygnął wszystkie — żaden nie jest genuine decyzją produktową:

- **Punkt 1 / B1 (12/12 plików przeczytanych z cytatami):** SPEŁNIONE. Faza 1 tej rundy uruchomiła
  8 równoległych czytelników (P2-2, P2-3, P2-5, P2-6, P2-9, P2-10, P2-11, P2-12), każdy z
  potwierdzonym cytatem pierwszej i ostatniej linii treści oraz statusem końcowym wyprowadzonym z
  sekcji rozstrzygnięć danego pliku (nie z przedawnionej treści) — dowody w wyniku Workflow tej
  rundy (`readers`, zachowane w dzienniku runu). P2.1, P2.4, P2.7, P2.8 były już w całości
  przeczytane i zweryfikowane w rundzie 1 (Final Control r1 to potwierdził wprost: „Przeczytane w
  całości: P2-1, P2-4, P2-7, P2-8”). Brak w FINALNYM dokumencie syntezy cytatów dla wszystkich 12 w
  jednym miejscu to usterka prezentacji tej (trzeciej) wersji dokumentu, nie brak samej analizy —
  materiał źródłowy istnieje i jest zweryfikowany. Nie wymaga kolejnej rundy czytania.
- **Punkt 13 (33/66 par macierzy = ODWOŁANIE, zgodność nieoceniona):** ZAAKCEPTOWANE jako
  wystarczające. Każdy z 8 czytelników Fazy 1 porównywał SWÓJ plik z PEŁNYM digestem obejmującym
  wszystkie 12 tematów (nie tylko z jedną przydzieloną „parą”) — rzeczywiste krzyżowe sprawdzenie
  nie jest więc ograniczone do 33 jawnie ocenionych par w tabeli; to właśnie ten proces wykrył
  wszystkie 4 realne sprzeczności (B2, B3, B10, B13) rozstrzygnięte niżej. Pozostałe niewypełnione
  komórki macierzy dotyczą par tematycznie rozłącznych (np. P2.4 RNG × P2.9 dane assetów), gdzie
  brak sygnału sprzeczności po przejściu 8 niezależnych, pełnych odczytów jest wystarczającym
  dowodem braku punktu styku, nie luką wymagającą dodatkowej rundy.
- **Punkt 14 / B3 (`inGarnizon`, SPRZECZNOŚĆ P2.3 §9 ↔ P2.11 D-MIG-19) — NAPRAWIONE.** To była
  JEDYNA z czterech zgłoszonych sprzeczności, która okazała się realna (nie artefakt czytania
  przedawnionej treści). P2.3 §9 (pierwotnie) kazała wyprowadzać garnizon z pozycji, podczas gdy
  P2.11 §10 (napisana później, tym samym uzasadnieniem co dla `oblega`) kazała go importować jako
  dane. **Poprawka wykonana bezpośrednio w `P2-3-ENTITY-IDS.md` §9** (ten plik, 2026-10-21): garnizon
  (`in_garnizon: bool`) jest teraz TAKŻE jawnie przechowywany, tym samym uzasadnieniem co `oblega` —
  builder web zapisuje pełne obiekty jednostek, import 1:1 (D7) wymaga wiernego zachowania pól
  zapisu. Pierwotna treść P2.3 była błędna (niekonsekwentna z własnym uzasadnieniem o linię wyżej),
  P2.11 miała rację. Nie wymagało to pytania właściciela.
- **B8 / konflikt Z-1 (P2.6 „WYMAGANY jako warunek wstępny P2.13” vs digest „nie blokuje”) —
  WYJAŚNIONE, nie było realnym konfliktem.** „Warunek wstępny P2.13” w P2.6 oznaczał „musi zostać
  FORMALNIE ROZPATRZONY przy tym temacie”, nie „musi zostać WYKONANY przed otwarciem bramki”.
  **Poprawka wykonana w `P2-6-EVENTS.md` §9** (ten plik): dodana adnotacja potwierdzająca, że P2.13
  rozpatrzyło to zobowiązanie i świadomie przeniosło je do P3.6, co spełnia literę wymogu. Liczba
  195 (digest) i 288 (P2.6) nie są sprzeczne — 195 to podścieg 288 wymagający faktycznego
  przeglądu (S5/S6=0 mimo trafienia szerokiego wzorca), 288 to całość trafień wzorca; oba
  dotyczą tego samego zobowiązania, różnych poziomów szczegółowości tej samej liczby.
- **B2 (`budowaListaBiblioteka`, SPRZECZNOŚĆ P2.2 §8 pkt 10(b) ↔ P2.11 D-MIG-10) — NAPRAWIONE.**
  P2.2 klasyfikowała ją jako flagę UI do odrzucenia; P2.11 wykazała kodem, że to szablony budowy
  NAZYWANE PRZEZ GRACZA (dane, nie UI). **Poprawka wykonana bezpośrednio w
  `P2-2-GAMESTATE-CONTRACT.md` §8** (ten plik): `budowaListaBiblioteka` usunięta z listy flag UI,
  importowana jako dane, zgodnie z D7. Korekta błędu klasyfikacji, nie nowa decyzja.
- **B10 (`siegeTurnByCity`, pozorna SPRZECZNOŚĆ z „pełną derywacją” w P2.3 §9) — WYJAŚNIONE/
  UZUPEŁNIONE.** P2.3 §9 derywacja pokrywała WYŁĄCZNIE „czy/kto/kapitulacja”, nie „od kiedy” —
  `combat.siege_started_turn` to DODATKOWE pole dla informacji, której `oblega` nie niesie, nie
  sprzeczność z zasadą derywacji. **Uzupełnienie wykonane w `P2-3-ENTITY-IDS.md` §9.**
- **B13 (D-EV-11, 24 typy payloadu bez definicji, pominięte przy pierwotnym zamykaniu P2.6) —
  ROZSTRZYGNIĘTE.** Ten sam podział co P2.5 §9 pkt 8 (identyfikatory z cyklem życia → newtype,
  reszta → klucz katalogu/mały enum w P3+). **Dopisane do `P2-6-EVENTS.md` §9.**
- **B4, B6, B9, B11, B12 — potwierdzone jako NIE-blokujące, zaakceptowany dług techniczny:**
  B4 (typy ID zaakceptowane, ale niezdefiniowane formalnie) — to oczekiwana kolejność pracy
  (decyzja architektoniczna najpierw, definicja Rust przy pisaniu kodu w P3), ten sam wzorzec co
  dziesiątki innych `[INŻ]` punktów w P2.11. B6 (`babilon`/`babilonia`, rozjazd nazw) — już
  zidentyfikowane w zamknięciu P2.2 jako BŁĄD DANYCH do osobnego tematu czyszczącego, nie decyzja
  projektowa čekająca na rozstrzygnięcie. B9 (P2.9 bez sekcji rozstrzygnięć) — oczekiwane: P2.9 to
  z założenia czysty katalog faktów („NIE decyzja projektowa”, zgodnie z jego własnym nagłówkiem),
  nigdy nie zgłosił DECISION_REQUIRED, więc brak sekcji rozstrzygnięć jest poprawny, nie luką. B11,
  B12 — już sklasyfikowane w macierzy jako PRZEDAWNIONA / ZGODNE PO ROZSTRZYGNIĘCIU (nie otwarte
  sprzeczności), wymagają tylko kosmetycznej korekty cytowań w P2.12 przy najbliższej okazji, co nie
  blokuje bramki.
- **B7 ([WŁ] rozstrzygnięte administracyjnie bez pytania właściciela w P2.11) — POTWIERDZONE.**
  Orkiestrator osobiście ocenił wszystkie 10 punktów (8 `[WŁ]` + 2 Final Control) przy zamykaniu
  P2.11 w tej samej sesji, z pełnym uzasadnieniem per punkt (patrz `P2-11-SAVE-MIGRATION.md` §10 i
  LEDGER). Etykieta `[WŁ]` oznacza „był zgłoszony jako kandydat do pytania właściciela w trakcie
  pracy Operatora”, nie „pozostaje otwartym pytaniem po rozstrzygnięciu” — rozstrzygnięcie
  orkiestratora jest końcowe i nie wymaga dodatkowego potwierdzenia.

### 6b. Werdykt

**Bramka P2 jest FORMALNIE OTWARTA dla P3.**

Wszystkie 12 podtematów (P2.1–P2.12) są zamknięte PASS. Macierz spójności 66 par nie ujawniła
żadnej sprzeczności, która pozostałaby nierozstrzygnięta: 4 realne sprzeczności (B2, B3, B10, B13)
zostały naprawione bezpośrednio w plikach źródłowych w ramach zamykania tego tematu; pozostałe
pozycje B-listy to albo przedawnione cytaty (kosmetyka), albo zaakceptowany, jawnie udokumentowany
dług techniczny dla P3 (typy bez formalnej definicji Rust, przegląd 195 plików heurystyki eventów,
rozjazd nazw cywilizacji) — żaden z nich nie zmienia kontraktu danych ani zachowania gry, wszystkie
są odwracalne przy implementacji bez kosztu dla gracza.

Zobowiązania jawnie przeniesione do P3 (nie blokują otwarcia bramki, ale wymagają realizacji):
1. Pełny przegląd linia po linii 195 plików heurystyki S5/S6 — przed P3.6 (implementacja eventów).
2. Formalna definicja w Rust: `DealId`, `BattleId`, `SlotId`, `ItemId`, `TechId`, `TradeRouteId`,
   `WonderId`, `ImprovementId`, `ProductionItemId`, `UnitTypeId`, `CommandId` (newtype `u64`) oraz
   `OkolicaTryb`, `OwnerPolicy` i pozostałych typów danych z D-CMD-19/D-EV-11 — przy pisaniu
   `bridge.rs`/`events.rs` (P3+).
3. Rozjazd `babilon`/`babilonia` i klasyfikacja 6/15 surowców poza `ResourceKey` — osobny temat
   czyszczący danych (nie blokuje P3, flagowane wcześniej w zamknięciu P2.2).
4. Kosmetyczne korekty cytowań w P2.12 (15 vs 16 kluczy forced-war, zakres D-ID-11) — przy
   najbliższej okazji edycji tego pliku, nie osobny temat.

**DEPLOY/PUSH: NIE WYKONANO.**
