# P6 — plan zamknięcia (stan 13.11, parity `fc2ed160f`)

Źródło struktury: `PLAN-PORT-RUST-TAURI-20261020.md` §4 (P6.1–P6.24). Ten dokument dodaje: stan każdej pozycji, kryterium zamknięcia i kolejność. P6 to szacunkowo 6–12 tygodni w planie, więc zamknięcie wymaga wielu nocy pętli Autobot.

## Kryterium zamknięcia P6
1. Każda pozycja P6.1–P6.22 ma status ZROBIONE z dowodem (wektory z pinu, test przed/po, readback) albo jawne NIE_ZMIERZONO z uzasadnieniem zaakceptowanym przez właściciela.
2. Produkcyjna pętla tury wywołuje wszystkie moduły domeny (nie tylko testy). Brak martwego kodu w produkcji (P1.14b, #105, #119).
3. P6.23: testy funkcjonalne i regresyjne przechodzą (`cargo test --no-fail-fast`, zero failed).
4. P6.24: niezależny Evaluator gameplayu (SONNET, osobna rola) wystawia PASS na cały P6.

## Stan pozycji (13.11)

| Pozycja | Stan | Co zostało |
|---|---|---|
| P6.1 stan początkowy | ZROBIONE | hot-seat (osobny temat), nazwy miast web |
| P6.2 walidacja komend | CZĘŚĆ | transakcyjność mutacji |
| P6.3 teren | ZROBIONE | — |
| P6.4–P6.5 jednostki | CZĘŚĆ | produkcyjny lifecycle, wpięcie, L-3 (#9) |
| P6.6–P6.8 miasta | CZĘŚĆ | 8I2, dostęp do żelaza (#180), REPIN-EKONOMIA, auto-ulepszenia wymagają REPIN |
| P6.9–P6.10 tura | CZĘŚĆ | odroczenie zdarzeń na koniec tury, marsze na koniec tury |
| P6.11–P6.12 AI, wymuszone wojny | CZĘŚĆ | forced-war-waves (fale, nieportowane), ai-war-home-defense, zbiórka i marsz AI |
| P6.13 walka | CZĘŚĆ, najwięcej pozycji | zwarcie (#136 zrobione, integracja #165), wejścia (#135, #167), NaN/Inf (#137), pętla dystansu (#100, #169), facing (#107, #178), wynik ciosu (#109, #179), doktryna (#112), wieże (#96, #146, #116), oblężenie wiring (#113), zdobycie miasta (#115, #175) |
| P6.14 dyplomacja | CZĘŚĆ, 2 z 10 tematów podziału | MULTIWAR-ERA (#181), wymuszone wojny (dalsze tematy podziału), hak wypowiedzenia (#120, #171), ZŁOŻA (#104, #172), R7K7C (#106, #176) |
| P6.15 handel | CZĘŚĆ | bramki web (kontakt, zerwanie po 10 turach, premia morska) |
| P6.16 kultura/religia | CZĘŚĆ | odświeżenie `culture-religion.ts` |
| P6.17 cuda i tech | CZĘŚĆ | drzewko technologii jako system |
| P6.18 państwa-miasta, barbarzyńcy | CZĘŚĆ | kod państw-miast martwy w produkcji; aneksja ze zdobyczami |
| P6.19 zwycięstwo/porażka | NIEROZPOCZĘTE | rozpoznanie (#182) |
| P6.20–P6.22 save/load/replay | CZĘŚĆ | pola z §0b, migracje, replay (#184) |
| P6.23 testy | W TOKU | ciągle, po każdym temacie |
| P6.24 Evaluator gameplayu | NIEROZPOCZĘTE | po zamknięciu P6.1–P6.22 |

## Kolejność (od najbardziej blokującej)
1. **Integracje w toku, zanim zaczną się kolejne:** melee (#165), js_max (#110/#174). Bez tego kolejne tematy P6.13 kolidują w `combat.rs`.
2. **Rozpoznania doc-only (już w toku lub w kolejce):** #120, #104, #135, #175, #176, #178, #179, #180, #181, #182, #184. Każde daje zakres i liczbę rund dla pozycji powyżej.
3. **Walka (P6.13) jako pierwszy duży blok:** wejścia → NaN/Inf → pętla dystansu → facing → wynik ciosu → doktryna → wieże → oblężenie wiring. Kolejność wynika z zależności w kodzie pinu.
4. **Dyplomacja i wojny (P6.11–P6.14):** MULTIWAR-ERA, forced-war-waves, hak wypowiedzenia, ZŁOŻA, R7K7C.
5. **Ekonomia i miasta (P6.6–P6.8, P6.15–P6.18):** 8I2, dostęp do żelaza, bramki handlu, kultura, cuda, państwa-miasta.
6. **Zapis i zwycięstwo (P6.19–P6.22):** warunki zwycięstwa, pola zapisu, migracje, replay.
7. **Przesunięcie pinu (REPIN):** wymagane przez REPIN-DRYFT 2–6 i 50 pól `units.json`. Plan w #177. Wykonać po zakończeniu punktów 3–5, bo zmiana pinu zmienia wektory wszystkich modułów.
8. **Zamknięcie:** P6.23 i P6.24.

## Blokery wymagające decyzji właściciela
- Przesunięcie pinu (punkt 7): czy wykonać w ramach P6, czy po nim.
- Atrybucja commitów (linia `Co-Authored-By` z nazwą modelu).

Pozostałe blokery są technicznie rozstrzygnięte w rejestrze (sekcja „Decyzje techniczne”).
