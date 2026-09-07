# R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`
RUNDA: 1/5 (RECON WYŁĄCZNIE — zero zmian kodu produkcyjnego w tej rundzie)
DOMAIN: INFORMATIONAL (recon/plan, nie implementacja)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — NIE DOTYCZY w tej rundzie (recon, nie kod — patrz OBIEG).

## GENEZA

Etapy 0-3 planu `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` zintegrowane
(`94c475ec`/`87b33da3`/`f3c0becf`/`302ea837`) — wszystkie były mechanicznymi
podmianami z dowodem behawioralnego no-opu. **Etap 4 jest jakościowo inny: plan
oznacza go jako NAJWYŻSZE RYZYKO CAŁEGO planu 0-8** (§D pkt 6-7): rozcięcie
`triggerPlayerEndTurn()` (main.ts, dziś ok. 4600 linii — zweryfikowane bezpośrednio
2026-09-07: zaczyna się `~28497`, kończy przed `startRenderLoop()` `~33103`, NIE ufaj
tym numerom przy starcie pracy, main.ts zmienia się codziennie) na
`endActiveHumanTurn()` (faza gracza, per-człowiek) + `runWorldEndTurn()` (faza świata,
raz na turę gry) + orkiestrator `advanceSeat()`. Plan cytuje: „`triggerPlayerEndTurn` =
4500 linii w pliku, do którego w 30 dni poszły 103 commity — rozcięcie musi być krótkie
i szybko zmergowane" (§D pkt 7).

**Dlatego ta runda jest CELOWO recon-only, zero zmian kodu.** Próba bezpośredniej
implementacji tak dużego rozcięcia bez wcześniejszego, dokładnego zmapowania granic faz
byłaby nieodpowiedzialna — dokładnie ten wzorzec ryzyka, przed którym ostrzega plan.

## GOAL (WYŁĄCZNIE ANALIZA, ZERO KODU)

1. Przeczytaj CAŁĄ funkcję `triggerPlayerEndTurn()` od deklaracji do końca (zamykający
   nawias tej funkcji, nie następnej). Zmapuj WSZYSTKIE fazy w kolejności, z numerami
   linii DZISIEJSZYMI (nie z planu): każda faza = krótki opis + zakres linii + czy
   dotyczy WYŁĄCZNIE aktywnego człowieka (kandydat do `endActiveHumanTurn`) czy całego
   świata/wszystkich ownerów (kandydat do `runWorldEndTurn`).
2. Zlokalizuj `turn++` (świeżym grepem, nie z pamięci planu) i wszystkie miejsca w tej
   funkcji oraz POZA nią (całe `main.ts`), które czytają zmienną `turn` w sposób
   wrażliwy na TO, w którym miejscu accessora `turn++` się wykona (np. logika
   „raz na turę gry" kontra „raz na fotel człowieka" — to jest SEDNO ryzyka, bo w
   hot-seat `turn` powinien rosnąć RAZ na turę świata, nie raz per fotel).
3. Zidentyfikuj WSZYSTKIE efekty uboczne w funkcji, które muszą pozostać w fazie
   „gracza" nawet jeśli logicznie dotyczą całego świata (przykład z planu §D pkt 4:
   `deferredEotHints`, `deferredMergePrompts`, `flushDeferredPlayerUnitReveals`,
   `preBattle` — rzeczy które „wyskoczą na ekranie następnego gracza, jeśli zostaną w
   `endActiveHumanTurn`" — potwierdź świeżym grepem czy te identyfikatory nadal istnieją
   pod tymi nazwami, main.ts mógł się zmienić).
4. Zaproponuj KONKRETNY punkt cięcia: dokładny numer linii/nazwa fazy, gdzie kończy się
   „to co dotyczy aktywnego człowieka" a zaczyna „to co dotyczy świata" — z uzasadnieniem
   per-fazowym (nie ogólnikowym).
5. Zidentyfikuj WSZYSTKIE miejsca w main.ts POZA `triggerPlayerEndTurn`, które wywołują
   tę funkcję (przycisk „Zakończ turę", testy Playwright z `__eraTestDebug.endTurn`,
   inne haki testowe) — to są miejsca, które będą wymagały aktualizacji wywołania w
   przyszłej rundzie implementacyjnej.
6. Napisz PLAN implementacji dla przyszłej rundy 2 (tego samego tematu albo nowego,
   zdecyduje orkiestrator): kolejność kroków, które fragmenty przenieść pierwsze
   (najbezpieczniejsze), jak zweryfikować behawioralny no-op dla dzisiejszego stanu
   (jeden fotel człowieka) — plan mówi „30 tur bez różnicy w logach EOT przy 1
   człowieku" jako kryterium; zaproponuj KONKRETNY, automatyzowalny sposób pomiaru tego
   (np. multi-turn headless simulation z hashem stanu po każdej turze, PRZED i PO
   rozcięciu, dla ustalonego seeda).

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz szacowania granic faz „na oko" bez przeczytania KAŻDEJ linii funkcji — to jest
4500-linowa funkcja w najgorętszym pliku repo, powierzchowny przegląd gwarantuje
przeoczenie efektu ubocznego. Zakaz twierdzenia że plan implementacyjny jest
„bezpieczny" bez wskazania KONKRETNEGO, zweryfikowalnego dowodu no-op dla przyszłej
rundy — samo słowo „powinno działać" nie wystarcza przy tym ryzyku.

## BINARNE KRYTERIUM SUKCESU (tej rundy, recon)

- Kompletna mapa faz `triggerPlayerEndTurn()` z numerami linii, zapisana w raporcie.
- Konkretny, uzasadniony punkt cięcia (nie „gdzieś w środku").
- Lista wszystkich miejsc wywołania funkcji poza nią samą.
- Konkretny, automatyzowalny plan dowodu no-op dla przyszłej rundy implementacyjnej.
- **ZERO zmian w jakimkolwiek pliku `gra/src/**` — ta runda to WYŁĄCZNIE dokument.**

## ALLOWLISTA

- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/**` (WYŁĄCZNIE — cała
  praca tej rundy to plik/pliki markdown z analizą, zero kodu).

Zakazane bezwzględnie: JAKAKOLWIEK zmiana w `gra/src/**`, `gra/tools/**`, `gra/data/**`,
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i
`git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap4-recon`, gałąź
`autobot/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`, baza jawnie `origin/main` (commit
`dfdc026d` w chwili założenia). Czytasz kod, nie zmieniasz go w tej rundzie — nie
dotyczy Cię C-001 (nie kompilujesz, nie budujesz), ale możesz uruchamiać istniejące
bramki READ-ONLY jeśli pomaga to zrozumieć zachowanie (np. `node tools/logic-test.cjs`
jako sanity check że worktree działa).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny brak w analizie (np. pominięta faza, błędny punkt cięcia);
runda N+1 na TYM SAMYM ID. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- To jest recon, nie implementacja — żadna zmiana zachowania gry nie jest tu w ogóle
  możliwa (zero zmian kodu).
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Nie decyduj samodzielnie o architekturze wykraczającej poza to, co plan już
  zatwierdził (§B, §C wiersz 4) — jeśli dojdziesz do wniosku że podejście planu jest
  błędne, opisz to jako osobną rekomendację w raporcie, nie zmieniaj cichcem założeń.

## OBIEG

Operator → Evaluator (ocena kompletności/trafności analizy, ponumerowane zarzuty) →
Obrona (gdy lista niepusta) → koniec skryptu. **Final Control NIE jest dispatchowany
dla tej rundy** — to dokument recon, nie kod do integracji; orkiestrator sam
zdecyduje o kolejnym kroku (dispatch implementacji Etapu 4, prawdopodobnie w kilku
rundach/podetapach) na podstawie tego dokumentu.
