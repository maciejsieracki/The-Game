STATUS: PASS (DECISION_REQUIRED rozstrzygnięte — 10 punktów rozstrzygniętych przez orkiestratora,
0 pytań do właściciela)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-11-SAVE-MIGRATION-Q1

Workflow zamknął się w rundzie 4/5 z agregatem DECISION_REQUIRED: Final Control oddalił zarzuty 1,
2, 3, 6, 7 (poprawki Operatora z poprzednich rund się utrzymały), ale wskazał 2 dodatkowe punkty
(polityka błędów importu/atomowość, los pliku źródłowego) obok 8 punktów `[WŁ]` nagromadzonych w
dokumencie w poprzednich rundach (D-MIG-1, 3, 9(b), 10, 11, 18, 19, 21).

Przejrzałem wszystkie 10 punktów — **żaden nie wymagał pytania właścicielowi**. Rozstrzygnięcia:
1. Zakres wersji (D-MIG-1): tylko v3, zgodnie z tym co dziś czyta web.
2. Stan RNG/zdarzeń po imporcie (D-MIG-3): nowy `rng` z `seed`, pusta kolejka — web sam nie
   gwarantuje deterministycznej kontynuacji, więc nic nie jest tracone względem status quo.
3. Brak `mapSnapshot` w starych zapisach (D-MIG-9b): odrzucenie z jawnym błędem zamiast ryzykownej
   regeneracji (P2.4: generator Rust niepotwierdzony) — nie dotyczy praktycznie żadnego
   dzisiejszego zapisu (builder zawsze zapisuje snapshot).
4. `budowaListaBiblioteka` (D-MIG-10): import jako dane — korekta błędnej klasyfikacji P2.2 §8 pkt
   10(b), konsekwentne zastosowanie D7.
5. `siegeTurnByCity` (D-MIG-11): przyjęta propozycja Operatora, pole przechowywane w `combat`.
6. `autoManageCities` (D-MIG-18): zgodność z już przyjętym kontraktem P2.2 (owners[].policy), nie
   nowe odstępstwo.
7. `inGarnizon`/`oblegaCityId` (D-MIG-19): import jako dane — DOKŁADNIE ten sam precedens ustalony
   w P2.3 §9 dla `oblega` w tej samej sesji.
8. Tabela legacy-ID (D-MIG-21): atomowa, tylko na czas importu — zgodna z już zamkniętym P2.3 §9
   D-ID-1; napięcie z ZADANIEM dispatchu to błąd własnego sformułowania, nie nowa decyzja.
9. Polityka błędów importu (Final Control pkt 4): atomowy twardy fail tylko dla nienaprawialnego
   uszkodzenia strukturalnego, naprawa-z-ostrzeżeniem dla reszty — maksymalizuje zgodność z D7.
10. Los pliku źródłowego (Final Control pkt 5): import nieniszczący — oczywisty bezpieczny domyślny
    wybór.

DECYZJA: temat zamykam jako PASS. Reguła migracji (116 kluczy zmapowanych, schemat tabeli ID,
polityka błędów, import nieniszczący) jest kompletną propozycją gotową do implementacji P3+.

ZMIANY/COMMIT: dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md (§10 dopisane przez orkiestratora),
ten plik dyspozycji.
TESTY: praca projektowa/odczytowa, zero kodu Rust, zero zmian w gra/ — nie dotyczy
BLOKADY: brak
RUNDY: 4/5
NASTĘPNY KROK: integracja (commit+push), dispatch kolejnego tematu P2 w zwolniony slot.
DEPLOY/PUSH: NIE WYKONANO
