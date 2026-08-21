# 03-final-control-r2 — P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1 (runda 2)
GOAL: pole `tech.Uwagi` (notatki deweloperskie, np. „ABC-7: Popalnia brązu na mapie") NIE ma
przeciekać do gracza w `cityPanel.ts::appendTechDetailBlock()` — I legalna, gracz-facing
część notatki MUSI zostać pokazana, gdy współistnieje z adnotacją dev w tej samej notatce
(przypadek mieszany, regres rundy 1).

Wejście: Operator status=PASS (worktree `wf_0a5b5681-aeb-1`, `headSha=0090e673`),
Evaluator status=PASS-WITH-NOTES, uwaga nieblokująca: `buildings.json`/
`terrain-improvements.json` mają wpisy z adnotacją `ABC-<numer>` bez dwukropka
(np. „... (merge bez zmian, ABC-21 B).") lub z komentarzem dev PO pierwszym zdaniu
(ogon wpisu ABC-20 B Port „ŁAŃCUCH W GÓRĘ / ... martwe"), które nadal przeciekają przez
ten sam `playerFacingNote()` w karcie budynku (`cityPanel.ts:7138`). Uwaga: brak w repo
skomitowanego artefaktu `02-evaluator*.md` dla tej rundy (ani rundy 1) — werdykt i treść
uwagi dotarły do Final Control wyłącznie przez dispatch orkiestratora, nie przez plik w
`dyspozycje/autobot/runs/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1/`. To odstępstwo od kontraktu
artefaktów (README/skill: `02-evaluator.md`), zgłaszam jako uwagę procesową do
orkiestratora — NIE blokuje tej rundy, bo Final Control zweryfikował treść uwagi
niezależnie (patrz niżej) i potwierdza jej trafność.

## Niezależna weryfikacja (nie na podstawie raportów Operatora/Evaluatora)

1. **Zakres commitów tego tematu** — `git diff --stat 26cc6119..HEAD -- gra/` (merge-base
   z `main`, nie sam `main..HEAD`) pokazuje WYŁĄCZNIE:
   - `gra/src/ui/cityPanel.ts` (+13/-1)
   - `gra/tools/citypanel-uwagi-abc-filter-test.cjs` (nowy, 221 linii)
   `git diff main..HEAD -- gra/` pokazuje DODATKOWO usunięcie całego katalogu
   `gra/src/ui/entityCards/*` i starego `entity-card-contract-test.cjs` — zweryfikowano,
   że to NIE jest usunięcie przez ten temat: `merge-base main HEAD` = `26cc6119`, a te
   pliki nie istnieją w tym merge-base (dodane do `main` PÓŹNIEJ, commitem
   `c1365bfa` z gałęzi `R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`, zmergowanej do `main`
   już po odgałęzieniu tego tematu). Ten temat po prostu nie ma jeszcze `main` z tamtą
   funkcją — to naturalna rozbieżność do rozwiązania przy integracji (rebase/merge
   orkiestratora), NIE regresja tej rundy. Working tree czyste (`git status` — nothing to
   commit) przed startem weryfikacji.
2. **Kod naprawy** — odczytany bezpośrednio (`gra/src/ui/cityPanel.ts` ok. L6764–6802):
   - `isDevOnlyPlayerText()` NIE zawiera już wzorca `ABC-\d+` (regres rundy 1 usunięty) —
     rozpoznaje wyłącznie `^PYTANIE\s+\d+`, `^DECYZJA\b`, `^DEC-\d{8}`, „patrz
     unit-building-bonuses", identycznie jak przed rundą 1.
   - `stripInlineDevAnnotations()` zyskał wzorzec
     `/[\s;,.]*\bABC-\d+(?:\s?[A-Za-z])?\s*:\s*[^.]*\.?/gi` — wycina TYLKO fragment
     adnotacji, zostawia resztę notatki.
3. **Test przypadku mieszanego — odtworzony niezależnie w Node** (skrypt ad-hoc,
   skopiowane 1:1 obie funkcje z pliku źródłowego, bez odwoływania się do raportu
   Operatora):
   ```
   playerFacingNote("kończy Epokę 1; ABC-7: Popalnia brązu na mapie")
     → "kończy Epokę 1"      // legalna część PRZETRWAŁA
   ```
   Potwierdzone: string niepusty, `=== "kończy Epokę 1"`, brak podciągu „ABC-7" w wyniku.
   To dokładnie kryterium końca zlecone w dispatchu Final Control — **spełnione**.
   Dodatkowo sprawdzone kontrolnie (nie regres, zachowanie oczekiwane bez zmian):
   `PYTANIE 3 = A (...)`, `DECYZJA: ...`, `DEC-20260101 ...` → nadal `null` (odrzucone w
   całości), zwykła notatka bez wzorca dev → przechodzi bez zmian.
4. **Uwaga Evaluatora zweryfikowana jako trafna i faktycznie nieblokująca** — odtworzone
   w tym samym skrypcie ad-hoc:
   - `"merge bez zmian, ABC-21 B)."` → wynik BEZ ZMIAN (nie wycięte) — bo wzorzec wymaga
     dwukropka po `ABC-<numer>[litera]?`, a tu po literze `B` jest `)."`, nie `:`. Adnotacja
     rzeczywiście przecieka.
   - Wariant z ogonem komentarza dev po pierwszym zdaniu (ABC-20 B Port) — również nie
     łapany przez obecny wzorzec (brak dwukropka po numerze/literze w tej pozycji).
   Oba przypadki dotyczą `buildings.json`/`terrain-improvements.json`, NIE `tech.json` —
   poza `GOAL` i allowlistą tej rundy (dispatch dotyczył konkretnie `tech.Uwagi` i regresu
   rundy 1 na przypadku Brązownictwa). Test regresyjny tego tematu
   (`citypanel-uwagi-abc-filter-test.cjs`) świadomie NIE rości sobie prawa do pokrycia tych
   wariantów — potwierdzone czytaniem pliku testu. Zgadzam się z rekomendacją Evaluatora:
   osobny ticket przeciwko treści `uwagi`/`Uwagi` w `buildings.json` /
   `terrain-improvements.json`, nie blokada tej rundy.
5. **Bramki** (`docs/decyzje/R-PROC-AUTOBOT.md` §6), uruchomione w `gra/` na tym
   worktree/HEAD:
   - `npx tsc --noEmit` — pierwsza próba: `TS5101` (baseUrl deprecated, TS 6.0.2 z braku
     `node_modules` w tym świeżym worktree — playbook C-029: bez właściwego
     `node_modules` wynik niewiarygodny). Naprawa: `npm install` (NIE `npm run
     build`/`npm run dev` — barierа dotyczy tylko tych dwóch komend, nie samego
     `install`), po czym `npx tsc --version` → `5.9.3` (zgodne z referencją) i
     `npx tsc --noEmit` → **0 błędów**, exit 0.
   - `node tools/logic-test.cjs` → **213/213** (zgodne z referencją).
   - `node tools/tech-tree-test.cjs` → **19/19**.
   - `node tools/research-test.cjs` → **33/33**.
   - `node tools/unit-replace-test.cjs` → **13/13**.
   - `node tools/combat-test.cjs` → **6/6**.
   - `node tools/unit-power-test.cjs` → **4 pass / 2 fail** — zgodne z udokumentowanym
     pre-istniejącym czerwonym stanem („nie regresja, nie naprawiaj przy okazji"), NIE
     pogorszone przez ten temat.
   - `node tools/citypanel-uwagi-abc-filter-test.cjs` (nowy test tego tematu) →
     **35/35 pass**.
   - `git status --short` po `npm install` — czysto (node_modules poza repo/gitignore,
     brak dryfu).

## Werdykt

Zero błędów typów, zero regresji w żadnej bramce referencyjnej, przypadek mieszany
(„kończy Epokę 1; ABC-7: ...") zweryfikowany niezależnie i działa poprawnie — legalna
część przetrwa, dev-adnotacja zostaje wycięta, notatka NIE znika w całości. Uwaga
Evaluatora potwierdzona jako prawdziwa, ale poza `GOAL`/allowlistą tej rundy (inny plik
danych, ten sam mechanizm) — nieblokująca, do osobnego zgłoszenia.

STATUS: PASS
readyForDeploy: true

## ZMIANY/COMMIT

Brak zmian w `gra/` względem HEAD Operatora (`0090e673`) — Final Control tylko
weryfikuje, nie modyfikuje kodu tematu. Ten raport dodany i zakomitowany na
`autobot/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (branch pozostaje niezmergowany do `main`).

## TESTY

Patrz „Bramki" wyżej — pełne, dosłowne wyniki, bez skrótów.

## BLOKADY

Brak blokad dla tej rundy. Uwaga procesowa (nieblokująca): brak skomitowanego artefaktu
`02-evaluator*.md` w `dyspozycje/autobot/runs/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1/` dla
rundy 1 i rundy 2 — kontrakt artefaktów (README/skill `civ-autobot`) przewiduje osobny
plik na etap; werdykt Evaluatora dotarł do Final Control wyłącznie przez dispatch
orkiestratora. Do rozważenia przez orkiestrator przy kolejnych dispatchach.

## NASTĘPNY KROK

Integracja przez orkiestratora: rebase/merge tego brancha na aktualny `main` (uwzględniając
rozbieżność z `entityCards/*` opisaną w pkt. 1 wyżej — naturalny konflikt stale'ości
brancha, nie regresja), a następnie `READY_FOR_DEPLOY` wyłącznie po faktycznej integracji.
Final Control nie integruje, nie deployuje, nie pushuje.

DEPLOY/PUSH: NIE WYKONANO
