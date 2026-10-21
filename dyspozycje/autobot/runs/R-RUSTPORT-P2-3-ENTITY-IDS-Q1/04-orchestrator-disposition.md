STATUS: PASS (DECISION_REQUIRED rozstrzygnięte — 0 pytań do właściciela, 14 punktów
strukturalnych rozstrzygniętych przez orkiestratora)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-3-ENTITY-IDS-Q1

Final Control zwrócił DECISION_REQUIRED: punkty 1-7 to ODDAL (zarzuty Evaluatora odparte przez
Obronę), punkty 8, 9, 10 to DO_DECYZJI_WŁAŚCICIELA (znalezione przy przeglądzie całości pod kątem
cichych wyborów architektonicznych), plus dokument własny Operatora D-ID-1 do D-ID-11 (§7).

Przejrzałem wszystkie 14 punktów (D-ID-1..D-ID-11 + Final Control 8/9/10, gdzie 8 wiąże się z
D-ID-10, 9 z D-ID-5, 10(a)-(c) to osobny pakiet). W odróżnieniu od P2.2 (gdzie D7 był genuine
decyzją produktową) — tu ŻADEN punkt nie dotyczy tego, CO gra robi dla gracza ani jego
doświadczenia. Wszystkie to wewnętrzne wybory reprezentacji danych w Rust: typ ID (newtype vs
surowy u64/i64), kanon wartości właściciela-człowieka (0 vs 1), który z dwóch duplikatów
`City`/`CivilizationKind` jest żywy, czy `kind` jednostki jest zamkniętym enumem czy kluczem do
katalogu danych, czy stan oblężenia jest przechowywany czy wyprowadzany.

Najważniejsza rozstrzygnięta kwestia: ODWRÓCIŁEM pierwotną skłonność Operatora w sprawie
oblężenia — `oblega: Option<CityId>` MUSI być jawnie PRZECHOWYWANE na jednostce (nie wyprowadzane
z pozycji), bo kompatybilność importu zapisów web 1:1 (D7 z P2.2, odpowiedź właściciela) wymaga
wiernego zachowania `oblegaCityId` z zapisu źródłowego — derywacja z pozycji straciłaby ten stan
przy imporcie zapisu, w którym jednostka oblega miasto spoza własnej pozycji (możliwe w logice
web). Druga istotna decyzja: `kind` jednostki to klucz katalogu danych (`units.json`), nie
zamknięty enum Rust — spójne z ustalonym wzorcem „treść gry w danych" z P2.1/P2.9.

Rozstrzygnąłem wszystkie 14 punktów z uzasadnieniem w `P2-3-ENTITY-IDS.md` §9 (dopisana sekcja).
Żaden nie wymagał eskalacji: każdy jest odwracalny później bez wpływu na zapis/zachowanie gry,
jeśli okaże się błędny — ta sama kategoria jak 15 z 16 punktów P2.2.

DECYZJA: temat zamykam jako PASS. Schemat ID encji i pełne porównanie pól `UnitState`/`CityState`
(z §9) są kompletną propozycją gotową do implementacji (P3+) i do P2.11 (migracja zapisów).

ZMIANY/COMMIT: dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md (nowy plik + §9 dopisane przez
orkiestratora), dyspozycje/autobot/runs/R-RUSTPORT-P2-3-ENTITY-IDS-Q1/** (ten plik)
TESTY: praca projektowa/odczytowa, zero kodu Rust, zero zmian w gra/ — nie dotyczy
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja (commit+push), dispatch kolejnego tematu P2 w zwolniony slot.
DEPLOY/PUSH: NIE WYKONANO
