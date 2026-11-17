# R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 — raport Operatora (runda 2/5)

STATUS: DECISION_REQUIRED (część danych zrobiona: narodowi łucznicy Brązu i Inka Estólica → Procarz; przejście „do jednostki żelaza” NIE dodane, bo brak jednoznacznego celu w danych; AI dla Brąz→Brąz wymaga decyzji)
DOMAIN: GAME (Zastąp, tabela zamian w units.json, testy gra/tools)
TEMAT: R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1
GOAL: tabela zamian obejmuje Inków i narodowych łuczników z przejściem do Procarza na tych samych zasadach co Łucznik (pełny koszt, gracz i AI); niejednoznaczny cel → DECISION_REQUIRED, bez zgadywania.
BAZA: 4183b8617af59a09751a63a403777e660e7d7919 (origin/main, detach). Dispatch: gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md + 00-dispatch-DODATEK-claude.md — oba odczytane).

## Źródła i zakres
- Odpowiedź właściciela (DODATEK, 2026-11-17): „Wszyscy łucznicy finalnie przechodzą na procarze. Chociaż to najwyższy poziom. I jednostka żelaza.”
- Zakres (a) wg DODATKU: nubijski, akadyjski, asyryjski + dystansowe jednostki Inków. W units.json Inkowie NIE mają „Łucznika”; mają `Oszczepnik (Estólica)` (Kamień, Specjalna, Distance) i `Procarz (Huaracoc)` (Brąz, Specjalna, Slinger, już celem Łucznika). Przyjęto Estólicę jako dystansową jednostkę Inków (założenie, patrz DECISION_REQUIRED pkt 3).
- Zakres (b): w units.json NIE istnieje żadna jednostka Żelaza typu Distance/Slinger (sprawdzone filtrem: Epoka=Żelazo i Typ ∈ {Distance, Slinger} → pusty zbiór). Jedyne jednostki Żelaza: Hastati, Triari, Falanga, Hieros Lochos, Konnica, Jeździec chiński, Jeździec z oszczepami (Mount).

## Tabela (typ → cel; dziś → proponowany)
| Jednostka | Epoka / Klasa / Nacja | Cel dziś (przed r2) | Cel po r2 |
|---|---|---|---|
| Łucznik | Kamień / Standardowa / — | Procarz/Procarz (Huaracoc) | bez zmian |
| Łucznik egipski | Kamień / Specjalna / Egipt | Procarz (r1) | bez zmian |
| Łucznik sumeryjski | Kamień / Specjalna / Sumer | Procarz (r1) | bez zmian |
| Łucznik nubijski | Brąz / Specjalna / Egipt | — | Procarz (same-epoch, decyzja właściciela) |
| Łucznik akadyjski | Brąz / Specjalna / Sumer | — | Procarz (same-epoch) |
| Łucznik asyryjski | Brąz / Specjalna / Asyria | — | Procarz (same-epoch) |
| Oszczepnik (Estólica) | Kamień / Specjalna / Inkowie | — | Procarz/Procarz (Huaracoc) (jak Łucznik) |
| Procarz (Huaracoc) | Brąz / Specjalna / Inkowie | — | bez celu (nie ma wyższego/dystansowego celu w danych) |
| Oszczepnik (generyczny), Oszczepnik Zulu | Kamień / Standardowa / Specjalna | — | bez zmian (nie są łucznikami; poza zakresem) |
| Jednostka Żelaza dystansowa | — | nie istnieje w danych | DECISION_REQUIRED (patrz niżej) |

## ZMIANY-COMMIT
1. `gra/data/units.json` — pole „Zastąp specjalnie” (4 wiersze, sed po numerze linii, zweryfikowane node’em): Łucznik nubijski/akadyjski/asyryjski → `Procarz`; Oszczepnik (Estólica) → `Procarz/Procarz (Huaracoc)`. Diff: 4 linie (+/-), żadnych innych zmian. Uwaga techniczna: pierwsza próba trafiła w sąsiedni obiekt (Drużynnik) — cofnięto i poprawiono; końcowy diff potwierdza tylko 4 właściwe wiersze.
2. `gra/tools/unit-replace-promotion-table-test.cjs` — ARCHER_EXCEPTIONS: +nubijski/akadyjski/asyryjski → [Procarz], +Oszczepnik (Estólica) → [Procarz, Procarz (Huaracoc)]; nowy zbiór `SAME_EPOCH_ARCHER_DOWNGRADE` (3 Brąz-łucznicy → Procarz) jako JEDYNY wyjątek od reguły „cel wyżej (epoka/klasa)”; EXPECTED_TABLE +4 wpisy (dokładna równość).
3. `gra/tools/unit-replace-archer-slinger-test.cjs` — test 9 przepisany (nubijski z „brak” na „jest”); nowy blok 11 (nubijski/akadyjski/asyryjski w Brązie, koszt > 0, bramka Koszar, mutacja kopii nubijskiego, Estólica w Brązie/Kamieniu/Rzymie, Huaracoc poza Inkami, AI Estólica Kamień→Brąz ok, AI nubijski — DECISION_REQUIRED, patrz niżej); nagłówek zaktualizowany.
4. `gra/src/data/wikiBundle.json` — regeneracja (`node tools/bundle-wiki-for-game.cjs` → „22 rozdz. + 185 haseł (~1317 KB)”), plik BEZ zmiany bajtów (git status nie pokazuje go).
5. Civpedia/poradnik: przeszukano docs/encyklopedia, docs/PORADNIK-GRACZA (grep „Zastąp”, „zamien”, „awans” przy łucznikach/procarzu) — brak tekstu opisującego tabelę zamian łuczników, więc brak sprzeczności i brak zmiany dokumentacji.
6. `dyspozycje/.../10-operator-claude.md` — raport rundy 2 (ten plik; poprzedni raport r1 zachowany niżej jako historia).

## TESTY (liczby z surowego wyjścia, gra/, node_modules: symlink do katalogu poza repo, gitignored)
- `node tools/unit-replace-promotion-table-test.cjs` → `PASS: 30 wpisów źródłowych, 62 krawędzi, brak cykli` — exit 0 (r1: 26/57).
- `node tools/unit-replace-archer-slinger-test.cjs` → `38 OK, 0 FAIL` — exit 0 (r1: 27 OK).
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)` — exit 0.
- `node tools/unit-replace-full-cost-test.cjs` → `unit-replace pelny koszt: 39 passed, 1 failed` — exit 1. Ta sama liczba co r1 i co zmierzona w r1 na bazie 76a1739 (dług przedtematowy, asercja na main.ts/unit-replace-execute.ts; poza allowlistą, NIE naprawiano).
- `npx tsc --noEmit` (gra/) → exit 0.
- Mutacje (usunięcie wpisu → czerwony): nubijski w teście 11 (mutacja kopii → Procarz znika: OK) oraz egipski (test 9). Walidator: usunięcie wpisu w ARCHER_EXCEPTIONS dla nubijskiego powoduje FAIL przez EXPECTED_TABLE (sprawdzane logicznie, nie uruchamiane po mutacji pliku).
- Pięć bramek projektu (R-PROC-AUTOBOT §Bramki) — NIE uruchamiane w tej rundzie (poza zakresem danych + tabeli); NIE ZMIERZONO.
- Żywy Chromium (okno „Zastąp” z nowym przejściem OBEJRZANE) — NIE ZMIERZONO. Zmiana jest danymi i testami, bez zmian UI; nie uruchamiano przeglądarki ani builda vite.

## DECISION_REQUIRED (do właściciela)
1. **Jednostka Żelaza (zakres b).** W danych nie ma dystansowej/procarz-podobnej jednostki Żelaza, więc nie dodano żadnego przejścia „do jednostki żelaza”. Opcje:
   - A) zostawić Procarz jako koniec łańcucha łuczników (stan po r2; rekomendacja, bo zgodne z danymi),
   - B) dodać przejście Procarz → nowa dystansowa jednostka Żelaza, gdy ta jednostka zostanie zaprojektowana (osobny temat, wymaga nowej pozycji w units.json),
   - C) wskazać istniejącą jednostkę Żelaza innego typu (np. Jeździec z oszczepami — Mount) — NIE rekomendowane: zmienia klasę armii (dystans → konnica).
2. **AI dla nubijskiego/akadyjskiego/asyryjskiego (Brąz → Brąz).** Gracz może je zamienić na Procarza (pełny koszt). AI NIE: `promoteAiUnitForEra` (src/game/ai-era-unit-promotion.ts) odrzuca cel o nie wyższej epoce (`epochNumber(target) <= epochNumber(old)` → false), a live-wiring w src/main.ts (newestSameRole) też filtruje po epoce `> oldEpoch`. Test 11 zapisuje ten stan jawnie jako DECISION_REQUIRED. Opcje:
   - A) zostawić asymetrię (gracz tak, AI nie) — stan obecny,
   - B) dopuścić same-epoch wyłącznie dla SAME_EPOCH_ARCHER_DOWNGRADE w ai-era-unit-promotion.ts i main.ts (zmiana w src/ — POZA allowlistą tego tematu, wymaga zgody orkiestratora),
   - C) dopuścić same-epoch dla wszystkich wpisów tabeli — NIE rekomendowane (zmiana zachowania AI dla np. Falanga→Hieros Lochos i Wojownik mykeński→Hieros Lochos).
   Rekomendacja: B (osobny temat, po zgodzie orkiestratora). Zgodnie z GOAL („te same zasady co Łucznik, gracz i AI”) to jest luka.
3. **Oszczepnik (Estólica) jako „dystansowa jednostka Inków”.** Przyjęto założenie, że jest odpowiednikiem Łucznika dla Inków (Kamień, Specjalna, Distance) i dostał te same cele co Łucznik (Procarz / Procarz (Huaracoc)). Jeśli właściciel chce tylko „łuczników”, wpis do cofnięcia jednym wierszem w units.json i jednym w ARCHER_EXCEPTIONS.

## Zmiany względem r1 (dla orkiestratora)
- r1 DECISION_REQUIRED „nubijski/akadyjski/asyryjski: opcje A/B/C” zostało rozstrzygnięte przez właściciela: wszyscy łucznicy → Procarz (zmiana wykonana w danych + walidatorze; zostaje tylko kwestia AI, pkt 2 powyżej).
- r1 DECISION_REQUIRED „Inkowie” — rozstrzygnięte założeniem (Estólica → Procarz/Huaracoc), do potwierdzenia pkt 3.

## BLOKADY
- Decyzje właściciela: pkt 1 (Żelazo), pkt 2 (AI same-epoch), pkt 3 (Estólica jako łucznik).
- Dług testowy full-cost 39/1 (poza zakresem).
- Dług Rust REPIN tabeli zamian (z DODATKU, nie w tym repo) — otwarty.
- Chromium NIE ZMIERZONO.

## RUNDY
2/5. Ostatni werdykt r1: PASS-WITH-NOTES (zakres częściowy) → r2 wykonana. Decyzja wymagana: pkt 1–3 powyżej.

## NASTĘPNY KROK
Evaluator: sprawdzić allowlistę (units.json 4 wiersze, 2 testy, wikiBundle bez zmiany bajtów, raport), walidator (30/62), testy archer-slinger 38/0, unit-replace 21/21, full-cost 39/1 (dług bazowy), tsc 0. Final Control po decyzji właściciela pkt 2 (AI) i pkt 1 (Żelazo). Ewentualny osobny temat AI-SAME-EPOCH-ARCHER po zgodzie orkiestratora.

DEPLOY/PUSH: NIE WYKONANO

---

## Historia: raport rundy 1 (poprzedni stan pliku)

# R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED (część danych zrobiona; Inkowie i narodowi łucznicy Brązu czekają na decyzję)
DOMAIN: GAME (Zastąp, tabela zamian w units.json)
TEMAT: R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1
GOAL: tabela zamian obejmuje Inków i narodowych łuczników z przejściem do Procarza na tych samych zasadach co Łucznik; przy niejednoznacznym celu DECISION_REQUIRED, bez zgadywania.
BAZA: 76a1739fddb415edc2204c404e9aab43e6cf5b30 (origin/main), worktree wf_21f1d813-a4d-1, rozgałęzienie detached.

## Uwagi o źródle zadania
- Dispatch `00-dispatch.md` odczytany z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (w `origin/main` go nie ma).
- `00-dispatch-DODATEK-claude.md` NIE istnieje w żadnej dostępnej gałęzi (sprawdzone `git ls-tree`). Luki rozstrzygnięte założeniem: zakres = GOAL/KRYTERIA z `00-dispatch.md`.

## Mechanika danych (ustalona w kodzie)
- Cel "Zastąp" z pola `Zastąp specjalnie` w `gra/data/units.json`, czytany w `availableReplacementsFor` (`gra/src/game/production.ts`, krok B).
- Walidator tabeli: `gra/tools/unit-replace-promotion-table-test.cjs` (cel wyżej epoką/klasą, ta sama nacja źródła i celu, tylko piechota + wyjątki `ARCHER_EXCEPTIONS`, cała tabela przypięta do `EXPECTED_TABLE`).
- Łucznik (Kamień, Distance): `Procarz/Procarz (Huaracoc)` (już było przed tematem).

## Zmiany (ZMIANY/COMMIT)
1. `gra/data/units.json`: `Łucznik egipski` i `Łucznik sumeryjski` (oba Kamień, Specjalna) — `Zastąp specjalnie`: `—` → `Procarz`. Cel bez nacji, bo Huaracoc jest nacji Inkowie (walidator odrzuca różne nacje, a dla Egiptu/Sumeru i tak byłby bramkowany).
2. `gra/tools/unit-replace-promotion-table-test.cjs`: `ARCHER_EXCEPTIONS` + `EXPECTED_TABLE` dopisane dla obu łuczników (`Procarz`).
3. `gra/tools/unit-replace-archer-slinger-test.cjs`: test 9 przepisany z "stan zgodny z dispatchem, ABC otwarte" na asercje nowego stanu (egipski/sumeryjski w Brązie mają Procarza, w Kamieniu nie; mutacja kopii usuwa; nubijski Brąz nadal bez Procarza).
- `wikiBundle` przegenerowany (`node tools/bundle-wiki-for-game.cjs`): brak zmiany w pliku.

## DECISION_REQUIRED (typ → cel, NIE zgadywano)
- `Łucznik nubijski` (Egipt, Brąz, Specjalna, atak 6), `Łucznik akadyjski` (Sumer, Brąz, Specjalna), `Łucznik asyryjski` (Asyria, Brąz, Specjalna): Procarz to Brąz Standardowa, czyli ta sama epoka i niższa klasa. To nie jest awans, tylko degradacja. Opcje dla właściciela: (A) bez zmiany (stan obecny); (B) zezwolić na zamianę w dół jako wyjątek; (C) inny cel do wskazania (np. Oszczepnik/Procarz Brązu z konkretnym celem Typ Distance).
- Inkowie (oba warianty): w danych są dwie jednostki Inków — `Procarz (Huaracoc)` (Slinger, Brąz, Specjalna; już jest celem Łucznika) i `Oszczepnik (Estólica)` (Distance, Kamień, Specjalna). Brak jednoznacznego "łucznika Inków". Propozycja do decyzji: `Oszczepnik (Estólica)` → `Procarz` (Kamień→Brąz, cel bez nacji; wymagałoby wyjątku typu Distance→Slinger jak w `ARCHER_EXCEPTIONS`). `Procarz (Huaracoc)` nie ma sensownego celu awansu poza sobą. Brak zmiany w danych dla Inków.

## TESTY (liczby z surowego wyjścia)
- `node tools/unit-replace-promotion-table-test.cjs` → `PASS: 26 wpisów źródłowych, 57 krawędzi, brak cykli` (exit 0).
- `node tools/unit-replace-archer-slinger-test.cjs` → `20 OK, 0 FAIL` (exit 0).
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)` (exit 0).
- `node tools/unit-replace-full-cost-test.cjs` → `39 passed, 1 failed` (exit 1). Nieudana asercja: `performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa` — to asercja źródłowa (regex na `main.ts` i `unit-replace-execute.ts`), a ten temat nie zmienia ani jednego z tych plików. NIE ZWERYFIKOWANO na bazie 76a1739 (nie uruchamiano testu na czystym `main`), więc nie twierdzę, że to dług przedtematowy. Do potwierdzenia przez Evaluatora.
- `npx tsc --noEmit` (gra/) → exit 0, 0 linii wyjścia.
- Pięć bramek projektu (bramki komendy `R-PROC-AUTOBOT` §Bramki) NIE uruchamiane w tej rundzie (poza zakresem danych); NIE ZMIERZONO.
- Żywy Chromium (okno Zastąp z przejściem) NIE ZMIERZONO.

## BLOKADY
- Decyzja właściciela dla Inków i trzech narodowych łuczników Brązu (sekcja DECISION_REQUIRED).
- `gra/node_modules` zainstalowane lokalnie (`npm ci --ignore-scripts`), tylko do testów; nie w commicie.
- Dług Rust REPIN tabeli zamian (z DODATKU, nie w tym repo) — zostaje otwarty.

## RUNDY
1/5. Ostatni werdykt: brak (pierwsza runda). Decyzja wymagana: patrz DECISION_REQUIRED.

## NASTĘPNY KROK
Evaluator: sprawdzić allowlistę (3 pliki w `gra/`, raport), diff `units.json` (2 linie), walidator i testy powyżej. Final Control po decyzji właściciela co do Inków i łuczników Brązu.

DEPLOY/PUSH: NIE WYKONANO
