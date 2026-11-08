# R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018 — nowe źródło wartości F-04

**Status:** OWNER APPROVED — new source, effective 2026-10-18  
**Domain:** INFORMATIONAL / source approval only  
**ECHO:** `R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018-Q1`

## Literalne pytanie i odpowiedź właściciela

**Pytanie:** „F-04: czy po zapoznaniu się z pakietem 07-approval-options.md zatwierdzasz Cyw-macierz-REVIEW.xlsx (SHA-256 c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32) jako NOWE źródło dokładnie 360 wartości F-04, bez zatwierdzania pozostałych parametrów i produktu?”

**Odpowiedź właściciela, 2026-10-18:** „Tak — zatwierdzam wariant B w pełnym zakresie opisanym w pakiecie.”

## Ustanowione źródło i zakres

Właściciel ustanawia jako **nowe źródło wartości od 2026-10-18**, bez twierdzenia o historycznej autentyczności lub wcześniejszej aprobacie:

- plik: `panele-sterowania/Cyw-macierz-REVIEW.xlsx`
- identyfikacja wersji: SHA-256 `c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32`, 27 300 bajtów; osobny numer wersji nie jest wskazany w pliku
- zakres: dokładnie przecięcie tych 24 literalnych `parameter_id`: `eko_handel_brutto_proc`, `eko_korupcja_proc`, `eko_kultura_proc`, `eko_luksus_proc`, `eko_nauka_proc`, `eko_pieniadz_port_proc`, `eko_pieniadz_proc`, `eko_praca_proc`, `eko_zadowolenie_proc`, `eko_zywnosc_proc`, `kultura_naplyw_proc`, `porzadek_kultura_proc`, `porzadek_nauka_proc`, `porzadek_pieniadz_proc`, `porzadek_produkcja_proc`, `porzadek_wzrost_proc`, `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, `prod_rush_koszt_proc`, `prod_szybkosc_budynku_proc`, `prod_szybkosc_jednostki_proc`, `religia_spread_proc`, `wealth_cap_proc`, `wealth_mnoznik_proc` oraz 15 kluczy cywilizacji: `grecy`, `rzymianie`, `chinczycy`, `inkowie`, `zulusi`, `egipt`, `sumer`, `celtowie`, `germanie`, `harappa`, `hetyci`, `slowianie`, `babilonia`, `asyria`, `fenicjanie`; ta lista ID jest również zachowana w [`/workspace/handoff-pr141/matrix/f04-24-parameter-ids.txt`](/workspace/handoff-pr141/matrix/f04-24-parameter-ids.txt)
- łączna liczba zatwierdzonych wartości surowych: 360
- mapowanie: nagłówek arkusza jest literalnym `parameter_id`, kolumna B zawiera `typCywilizacji` / `civKey`; obowiązują tylko komórki tego przecięcia

Zgoda nie obejmuje pozostałych 69 parametrów macierzy, żadnych innych wartości/plansz, semantycznych klasyfikatorów, podłączenia konsumentów, zachowania gry, acceptance produktu, integracji ani publikacji. To nowa decyzja źródłowa, nie rekonstrukcja dawnej zgody.

## Rekonsyliacja i dalszy zapis

Operator utworzył osobny, datowany per-cell receipt w [`dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json`](../../dyspozycje/autobot/runs/R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018/source-approval-receipt.json). Potwierdza on 360 unikalnych par; każda zatwierdzona wartość źródłowa równa się bieżącej wartości z `gra/data/civ-matrix.json` (360/360). Nie zastosowano zmian w macierzy ani nie przepisano seed-only ledgerów/historycznych receiptów.

Istniejący ledger F-04 nie ma aktywowanego mechanizmu, który aktualizuje pola `owner_approved_native_value`/status w miejscu; jego rekordy historyczne pozostają `SEED_ONLY_UNAPPROVED`. Test `gra/tools/pr141-evidence-ledger-behavior-test.cjs` wprost wiąże repozytoryjne `raw_approval` z historycznym source evidence i sprawdza tę seed-only klasyfikację, dlatego nie jest to bezpieczny kanał wpisania nowej decyzji. Nowy receipt jest oddzielnym dowodem owner Q/A, nie udaje aktualizacji starego ledgeru i nie rozstrzyga wyniku tych historycznych asercji.

## Otwarte prace F-04

Usunięto source approval hold dla dokładnie 360 wartości. Oddzielnie pozostaje implementacyjne i akceptacyjne domknięcie F-04: potwierdzić/przydzielić dozwolone consumer adapters dla tych pól, wykazać wartości w rzeczywistych ścieżkach gracza i AI, UI tam gdzie dotyczy, a następnie red-capable testy i save/load/runtime w zgodzie z istniejącymi bramkami. Ta decyzja nie aktywuje żadnego consumer-a ani nie ustala automatycznie, które z 93 parametrów mają działać w grze; każde takie zadanie wymaga osobnego dispatchu i scope.
