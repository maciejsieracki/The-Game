STATUS: DISPATCH (RUNDA 2 — Final Control wydal FAIL na 1/4 zarzutow, wylacznie test)
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL RUNDY 2: Napraw WYLACZNIE anchoring nowej bramki zrodlowej
`gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` tak, zeby poprawnie lokalizowala
blok `_activateUnit` TAKZE po scaleniu z rownoleglym tematem P-BITWA-OBRONCY-PRZED-MUREM-Q1
(juz zintegrowany do main, commit `6094c585`). Sam fix silnika (`battleScene.ts`) z rundy 1
jest JUZ POTWIERDZONY POPRAWNY przez Final Control (wlasna, niezalezna weryfikacja na
scalonym stanie) — NIE dotykaj go w tej rundzie.

KONTEKST — PRZECZYTAJ RUNDE 1 W CALOSCI (01-operator-runda1.md, 02-obrona-runda1.md) PRZED
PIERWSZA ZMIANA:

WERDYKT FINAL CONTROL (PELNY, runda 1, 4 zarzuty Evaluatora):
1 → ODDAL (konflikt z obroncy-mur, mechaniczne zlozenie dziala, `bitwa-obroncy-mur-kolumny-
   test.cjs` 9/9 na scalonym bloku).
2 → NAPRAW (JEDYNY realny defekt, do naprawienia w tej rundzie — patrz nizej).
3 → ODDAL (12 dodatkowych testow zielonych na scalonym stanie, zero regresji).
4 → ODDAL (mechanizm klaso-agnostyczny, korekta redakcyjna w raporcie Obrony wystarczajaca).

ZARZUT 2 (DO NAPRAWIENIA), CYTAT Z FINAL CONTROL:
"`bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`, jak dostarczony, nie pozostaje zielony
na scalonym stanie: 5 pass, 1 fail. Przyczyna: test lokalizuje blok przez
`src.indexOf('if (!this._manualMode) {', activateUnitDefIdx)` — literalny string. Fix
obroncow-muru zmienia ten warunek na `if (!this._manualMode && !siegeDefenderNeverDoctrine) {`,
wiec literalny string juz tam nie wystepuje; `indexOf` przeskakuje do INNEGO, niepowiazanego
wystapienia tego samego stringu w pliku (linia ~16015, inna funkcja), a test sprawdza zle
okno 500 znakow → falszywy `[FAIL] okno po bramce AUTO zawiera '_isUnitDoctrineAuto(ru)'`.
Zmutowalem TYLKO wewnetrzny fix lucznikow (zostawiajac warunek muru) i potwierdzilem: to samo
`[FAIL]` wystepuje identycznie w obu wariantach (z fixem i bez) — asercja #4 jest slepa w
stanie scalonym, nie odroznia PRZED/PO. To defekt anchoringu testu, nie kodu silnika."

NASTEPNY KROK WSKAZANY PRZEZ FINAL CONTROL: "zamienic `indexOf('if (!this._manualMode) {',
…)` na dopasowanie tolerujace dodatkowe warunki w tym samym `if`, tak by test poprawnie
lokalizowal blok takze po scaleniu z P-BITWA-OBRONCY-PRZED-MUREM-Q1" — np. regex
`/if\s*\(\s*!this\._manualMode\b[^)]*\)\s*\{/` (od `activateUnitDefIdx`) zamiast literalnego
stringa. To jest SUGESTIA KIERUNKU, nie gotowy kod do slepego wklejenia — zweryfikuj i dopasuj
sam.

ZADANIE:
1. Zmien WYLACZNIE `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs`: zamien
   literalny `indexOf('if (!this._manualMode) {', ...)` na dopasowanie tolerujace dodatkowe
   warunki w tym samym `if` (np. regex dopuszczajacy `&& !siegeDefenderNeverDoctrine` albo
   jakikolwiek inny dodatkowy warunek w tym samym nawiasie), tak zeby test lokalizowal
   WLASCIWY blok `_activateUnit` niezaleznie od tego, czy warunek muru jest obecny czy nie.
2. Zweryfikuj na WLASNYM tymczasowym scaleniu (ten sam rodzaj co zrobil Final Control:
   worktree/kopia z aktualnego `origin/main` + reczne polaczenie fixu tego tematu z tym co juz
   jest w main), ze test daje 6/6 PASS na poprawnym, scalonym kodzie.
3. Mutacyjnie potwierdz: cofniecie WYLACZNIE wewnetrznego resetu `playerOrder` (zostawiajac
   warunek muru nietkniety) MUSI dac czerwone asercje zwiazane z fixem lucznikow (nie tylko
   przypadkowo inna, niezwiazana asercja) — test musi realnie odrozniac PRZED/PO na stanie
   scalonym, nie tylko na starej bazie sprzed integracji obroncy-mur.
4. Uruchom ponownie `tsc --noEmit` + 5 bramek referencyjnych + `bitwa-obroncy-mur-kolumny-
   test.cjs` (nadal 9/9, zero regresji drugiego tematu) na tym samym zweryfikowanym stanie.

BINARNE KRYTERIUM SUKCESU: `bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` 6/6 PASS na
kodzie POŁĄCZONYM z fixem obroncy-mur (nie na starej bazie sprzed integracji), z dowodem
mutacyjnym ze realnie odroznia PRZED/PO fixu lucznikow w tym scalonym stanie. Zero zmian w
`gra/src/battle/battleScene.ts` w tej rundzie (fix silnika juz potwierdzony poprawny przez
Final Control rundy 1). `tsc --noEmit` czysty, 5 bramek referencyjnych zielone,
`bitwa-obroncy-mur-kolumny-test.cjs` 9/9.

ALLOWLISTA:
- `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` (WYLACZNIE ten plik)
- `dyspozycje/autobot/runs/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1/*`
Zakaz `git add -A`. Zakaz DOTYKANIA `gra/src/battle/battleScene.ts` w tej rundzie — jesli w
trakcie pracy uznasz ze jednak trzeba tam cos zmienic, ZATRZYMAJ SIE i zglos dlaczego zamiast
to zrobic.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz "naprawienia" testu przez zwykle poszerzenie okna
wyszukiwania bez zrozumienia CZY nowa lokalizacja faktycznie trafia we wlasciwy blok (dowod:
sprawdz ze `indexOf`/regex zwraca pozycje w OBRĘBIE `_activateUnit`, nie w innej, przypadkowo
podobnej funkcji dalej w pliku — Final Control zlapal dokladnie ten blad w oryginalnej
wersji). Zakaz deklaracji sukcesu bez mutacyjnego dowodu na SCALONYM stanie (nie na starej
bazie sprzed integracji obroncy-mur — to bylo dokladnie zrodlo problemu w rundzie 1).

IZOLACJA: kontynuuj w istniejacym worktree `/home/user/wt-bitwa-lucznicy-auto`, ta sama
galaz `autobot/P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1` (baza tej galezi jest STARA,
`origin/main`@`5f0fa0e8` — to nie przeszkadza w tej wąskiej naprawie testu, ale do
WERYFIKACJI punktu ZADANIE-2/3 zrob WLASNA tymczasowa kopie/worktree z aktualnego
`origin/main` i recznie zastosuj OBA fixy (ten z tej galezi + juz zintegrowany
`P-BITWA-OBRONCY-PRZED-MUREM-Q1`), tak jak zrobil to Final Control — usun te tymczasowa
kopie po weryfikacji.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 2.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — po PASS orkiestrator integruje RĘCZNIE (patrz `08-final-control-runda1.md` —
tekst combined bloku juz potwierdzony przez Final Control rundy 1).
DEPLOY/PUSH: NIE WYKONANO
