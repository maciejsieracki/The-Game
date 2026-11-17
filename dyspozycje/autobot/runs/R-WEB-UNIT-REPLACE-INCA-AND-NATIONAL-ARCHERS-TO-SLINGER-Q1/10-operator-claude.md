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
