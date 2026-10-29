STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1
GOAL: Plan podziału `gra/src/ui/cityPanel.ts` (pin `edb8fb56`, 11 986 LOC) na kawałki portowalne dla frontend-v2. Tylko dokument i pomiar.
ZMIANY/COMMIT: oceniany stan Operatora r2 = `7ec90aee` (baza `640923ec`, r1). Final Control nie zmienia plików poza tym raportem.
TESTY (zweryfikowane samodzielnie, Final Control, r2):
- Allowlista: `git diff --name-only 640923ec 7ec90aee` = tylko `P5-8-CITYPANEL-PODZIAL.md` i `runs/R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1/**`. Zero `gra/**`, zero Rust, zero `WERSJE.md`. OK.
- Powtórka pomiaru: `python3 r2-logi/p5-8-pomiar.py edb8fb56 r2-logi/konfig-r2.json` -> rc=0, wyjście `cmp` IDENTYCZNE z `01-pomiar-r2.log` (determinizm potwierdzony, bez /tmp w skrypcie). 32 sekcje, 378 jednostek, `LOC SUM 11986 EQUAL`, `ACYCLIC: YES`, `CHUNK-LEVEL nontrivial SCC: 0`.
- Niezależna kontrola acykliczności (własny skrypt, słowa-identyfikatory w ciałach jednostek, komentarze i klucze typów liczone, cięcia wyłączone): 0 zależności wstecz względem przypisania `unit_block` (377 jednostek + nagłówek). Kryterium binarne "kolejność bez cykli" SPEŁNIONE.
- `git diff --check 91dc998a 7ec90aee`: NIE czysto (patrz zarzut 1).
WERDYKT ZARZUTÓW r1 (Evaluator): zarzuty 1-5, 8 usunięte w r2 (cykle zmierzone i zwinięte, pełne SCC bez ucięcia, skrypt czyta pin przez `git show`, 32 sekcje, Canvas 1 trafienie CSS). Zarzuty 6-7 usunięte tylko częściowo (niżej).
ZARZUTY r2 i rozstrzygnięcie:
1. NAPRAW. `git diff --check` zgłasza trailing whitespace w `r2-logi/01-pomiar-r2.log:110-111` i `02-determinizm-powtorka.log:110-111` (linie `K08/K09 najczesciej eksportowane: `). Raport Operatora twierdzi "czysto" - fałszywe. Poprawka: skrypt nie może emitować końcowej spacji (rstrip przy wypisie), przeliczyć oba logi i `cmp`, ponownie `git diff --check` do exit 0. CLAUDE.md wymaga tej bramki.
2. NAPRAW. Kryterium wyjścia "każdego" kawałka (dispatch, zadanie 3): K04, K05, K06, K07, K08 mają jedną wspólną linię ("harness DOM dla punktów wejścia z §5"), a §5 nie wylicza punktów wejścia per kawałek. Poprawka: dla każdego z K04-K08 jedno zdanie z nazwami punktów wejścia (np. K07: `renderOkolica`, `renderSpoleczenstwo`, `renderKultura`; K08: `renderMagazyn`, `renderReligia`, `paintCityPanelSections`) oraz DTO/komend z §5.
3. ODDAL. Kawałki to pakiety porządku topologicznego, nie tematyczne (K03 "Model miasta" obejmuje linie 314-11055 z 11 sekcji). Dispatch wymaga: <=~1500 LOC, brak cykli, kryteria, DTO. Wszystko spełnione i zmierzone; tabela §4 uczciwie pokazuje zawartość. Spójność tematyczną można poprawić w tematach portu. Uwaga na przyszłość: nazwy kawałków mają status etykiet, nie dowodu spójności.
4. ODDAL. Regex zamiast AST; komentarze liczone - oznaczone NIE_ZMIERZONO i kierunkowo bezpieczne (dokładają krawędzie); niezależna kontrola potwierdziła wynik.
5. ODDAL (poza repo, nie dotyczy kodu). Plik `/x` (9 182 B, kopia wyjścia pomiaru) leży poza repo; nie wpływa na allowlistę. Do ręcznego `rm /x` przez właściciela.
6. DO DECYZJI CZŁOWIEKA: brak. Pin vs `origin/main` (drift 332 linie) rozstrzygnięty założeniem P5.8-Z2 (pin).
BLOKADY: 2 x NAPRAW (drobne, dokumentacyjne). Żadnej blokady merytorycznej.
RUNDY: 2/5 zużyte; wraca do Operatora na r3 (to samo ID).
NASTĘPNY KROK: Operator r3: napraw 1 i 2, commit z jawnym `git add`, następnie Evaluator (zakres: tylko te dwa punkty + ponowna powtórka pomiaru `cmp`) i Final Control. Spodziewany PASS po r3.
SHA do integracji: BRAK (FAIL). Kolejność względem `origin/rust-port/parity-v2` (`2c2f58f8`): po PASS dokument integrować jako commit docs na gałęzi docs `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; plan jest tylko dokumentacyjny, nie koliduje z parity-v2, a port kawałków startuje po integracji planu.
DEPLOY/PUSH: NIE WYKONANO
