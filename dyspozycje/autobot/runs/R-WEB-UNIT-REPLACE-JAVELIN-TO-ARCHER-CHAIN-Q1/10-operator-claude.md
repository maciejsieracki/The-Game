STATUS: PASS-WITH-NOTES
DOMAIN: GAME (Zastąp, dane/tabela zamian)
TEMAT: R-WEB-UNIT-REPLACE-JAVELIN-TO-ARCHER-CHAIN-Q1
GOAL: tabela zamian realizuje łańcuch Oszczepnik -> Łucznik -> Procarz (decyzja właściciela 2026-11-17). Oszczepnik (generyczny) i Oszczepnik Zulu (Izijula) przechodzą do Łucznika, nie wprost do Procarza. Wpis Estólicy (Inkowie) rozstrzygnięty jako DECISION_REQUIRED (patrz niżej).
BAZA: bc4d623655f71c36eee1621389357961bc6d2641 (origin/main, detach). Dispatch 00-dispatch.md czytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (na origin/main brak katalogu runu). DODATEK-claude (00-dispatch-DODATEK-claude.md) NIE ISTNIEJE w żadnej z badanych gałęzi: luki rozstrzygnięte założeniem opisanym niżej.

ZMIANY-COMMIT: commit z kodem i raportem (SHA w polu sha odpowiedzi operatora). Allowlista zachowana: gra/data/units.json (tylko pole „Zastąp specjalnie"), gra/src/game/ai-era-unit-promotion.ts (wyjątek AI), gra/tools/unit-replace-promotion-table-test.cjs, gra/tools/unit-replace-archer-slinger-test.cjs, raport. Bez zmian statystyk jednostek, bez zmian WERSJE.md, bez git add -A.
- units.json linia 192 (Oszczepnik): "Zastąp specjalnie": "—" -> "Łucznik"
- units.json linia 1286 (Oszczepnik Zulu (Izijula)): "—" -> "Łucznik"
- ai-era-unit-promotion.ts: nowy zbiór JAVELIN_TO_ARCHER_SOURCES (Oszczepnik, Oszczepnik Zulu (Izijula)) + isJavelinToArcher(); promoteAiUnitForEra dopuszcza ten wyjątek obok SAME_EPOCH_ARCHER_DOWNGRADE (bez niego AI odrzuciłoby same-epoch lateral Kamień->Kamień)
- unit-replace-promotion-table-test.cjs: ARCHER_EXCEPTIONS + wpisy Oszczepnik/Zulu -> Łucznik, JAVELIN_TO_ARCHER_SOURCES w punkcie 3, EXPECTED_TABLE rozszerzona o 2 wpisy
- unit-replace-archer-slinger-test.cjs: sekcja 12 (4 nowe asercje: Łucznik na liście Oszczepnika i Zulu, brak Procarza w Kamieniu, AI Oszczepnik -> Łucznik)

TABELA (typ -> cel dziś -> cel docelowy wg łańcucha):
| Jednostka | Typ / Klasa / Epoka | Cel dziś („Zastąp specjalnie") | Cel docelowy | Stan |
|---|---|---|---|---|
| Oszczepnik (generyczny) | Distance / Standardowa / Kamień | brak (—); dostępny tylko przez listę A (same Typ) | Łucznik | ZMIENIONO (wpis "Łucznik") |
| Oszczepnik Zulu (Izijula) | Distance / Specjalna / Kamień | brak (—) | Łucznik | ZMIENIONO (wpis "Łucznik") |
| Oszczepnik (Estólica) Inkowie | Distance / Specjalna / Kamień | Procarz/Procarz (Huaracoc) | Łucznik (generyczny, Kamień) wg reguły | NIE ZMIENIONO: DECISION_REQUIRED |
| Łucznik (generyczny) | Distance / Standardowa / Kamień | Procarz/Procarz (Huaracoc) | Procarz (koniec łańcucha) | bez zmian |
| Łucznik egipski, sumeryjski (Kamień), nubijski, akadyjski, asyryjski (Brąz) | Distance / Specjalna | Procarz | Procarz | bez zmian |
| Procarz, Procarz (Huaracoc) | Slinger | brak | koniec łańcucha | bez zmian; brak Żelaza dystansowego |

ZAŁOŻENIA (luki rozstrzygnięte w raporcie):
1. Oszczepnik (generyczny) -> Łucznik jest lateralny (Kamień/Standardowa -> Kamień/Standardowa). Przejście dopuszczone przez wyjątek JAVELIN_TO_ARCHER_SOURCES, analogiczny do archerów Brązu.
2. Oszczepnik Zulu -> Łucznik obniża klasę (Specjalna -> Standardowa). Dopuszczone, bo właściciel nazwał Zulu wprost. Ta sama logika co Łucznik Specjalna -> Procarz Standardowa.
3. Estólica (Inkowie) NIE zmieniona. Reguła właściciela („najpierw łucznik, jeśli dostępny w epoce") jest spełniona danymi (generyczny Łucznik jest w Kamieniu), ale Estólica jest Specjalna, a Łucznik Standardowa. To sprzeczność klasowa i brak inkaskiego łucznika. Wpis „Procarz/Procarz (Huaracoc)" ma zostać do decyzji. Opcje do właściciela: A) Estólica -> Łucznik (zdejmuje bezpośredni skok do Procarza, zgodnie z łańcuchem); B) zostawić obecny wpis (Procarz bezpośrednio, dzisiejszy stan z FALA 779); C) Estólica -> Łucznik + Procarz (oba, zachowuje listę zamienników). Rekomendacja operatora: A.
4. Dla gracza Oszczepnik -> Łucznik już działało przez listę A (ta sama Typ, pusty W zamian za). Zmiana wpisu realnie domyka ścieżkę AI i łańcuch w danych; nie zmienia listy gracza na ten krok.
5. Oszczepnik -> Procarz nie jest możliwy bezpośrednio (Procarz to Slinger, ma Typ inny niż Distance i brak wpisu); łańcuch jest więc zachowany w danych, nie tylko w opisie.

TESTY (surowe wyniki, uruchomione z gra/):
- node tools/unit-replace-promotion-table-test.cjs -> PASS: 32 wpisów źródłowych, 64 krawędzi, brak cykli; exit 0
- node tools/unit-replace-archer-slinger-test.cjs -> 47 OK, 0 FAIL (43 przed zmianą + 4 nowe); exit 0
- node tools/ai-era-unit-promotion-test.cjs -> 17 passed, 0 failed; exit 0
- node tools/ai-unit-replace-same-rules-test.cjs -> 45 passed, 0 failed; exit 0
- node tools/unit-replace-test.cjs -> WSZYSTKIE TESTY ZIELONE (21/21); exit 0
- node tools/unit-replace-full-cost-test.cjs -> 39 passed, 1 failed; to dług bazowy z dispatchu (39/1), NIE naprawiany; exit 1 zgodnie z bazą
- tsc --noEmit -> exit 0 (bez błędów)
- logic-test -> LOGIC OK (213/213); tech-tree-test -> 20 pass, 0 fail; research-test -> PASSED 33/0; combat-test -> COMBAT TEST 6/6 pass
- Mutacja (usunięcie wpisu Oszczepnik lub Zulu -> czerwony): NIE ZMIERZONO osobnym uruchomieniem; mechanizm to dokładna równość EXPECTED_TABLE w tools/unit-replace-promotion-table-test.cjs (usunięcie wpisu daje FAIL "tabela: ...").
- Chromium/xvfb (okno Zastąp Oszczepnik -> Łucznik OBEJRZANE): NIE ZMIERZONO (brak uruchomienia przeglądarki w tej rundzie).
- npm ci --ignore-scripts (gra/): added 71 packages; wykonane zgodnie z dispatchem.

BLOKADY:
- Estólica: DECISION_REQUIRED (opcje A/B/C wyżej, rekomendacja A). Do ustalenia przez właściciela przed zmianą wpisu.
- Civpedia/wiki i regeneracja wikiBundle: NIE WYKONANO (krok 5 dispatchu). Opis łańcucha w wiki wymaga aktualizacji po decyzji o Estólicy; regeneracja bundle przy zmianie danych do wykonania przez orkiestratora lub kolejnego operatora.
- Dług Rust: REPIN tabeli zamian (gra/data/units.json, pole „Zastąp specjalnie" -> plan Rust) do zaplanowania.
- Dług bazowy unit-replace-full-cost-test 39/1: nie tykany (zgodnie z dispatchem).

RUNDY: 1/5 (Operator, Haiku 5.5). Ostatni werdykt: brak (runda operatora).
DECYZJA WYMAGANA: Estólica (Inkowie): wpis „Procarz/Procarz (Huaracoc)" -> A / B / C (patrz założenie 3).

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje allowlistę, bramki i założenia; orkiestrator zbiera decyzję właściciela w sprawie Estólicy; następnie wpis Estólicy, Civpedia/wikiBundle i ewentualnie Chromium (okno Zastąp).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Brak DODATKU-claude w gałęziach fetchowanych (origin/main, origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0). Dispatch 00-dispatch.md istnieje tylko na gałęzi claude/..., nie na origin/main. Proszę o potwierdzenie, że poprawny DODATEK ma nazwę 00-dispatch-DODATEK-claude.md w innej gałęzi.
- Test archer-slinger sekcja 12 asercja „Oszczepnik w Kamieniu: Procarz niedostępny" jest trywialna (Procarz to Brąz); zostawiona jako dokumentacja braku skoku, nie jako dowód logiki.
- Zakaz nowych sesji zachowany: nie wywoływano spawn_task, dismiss_task ani żadnego narzędzia tworzącego sesje.
