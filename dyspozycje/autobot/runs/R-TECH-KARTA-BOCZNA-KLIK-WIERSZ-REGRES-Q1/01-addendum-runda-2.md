TEMAT: R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1
ADDENDUM DO: 00-dispatch.md (ten sam ID, ta sama gałąź `autobot/R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1`,
ten sam worktree `/home/user/wt-tech-karta-boczna-klik-wiersz`)
RUNDA: 2/5 — obowiązuje ŁĄCZNIE z `00-dispatch.md`; przy sprzeczności wygrywa ten plik.
DATA: 2026-09-03
DOMAIN: GAME (UI + dane)

## Po co ten plik

`00-dispatch.md` opisuje rundę 1 i jego nagłówek (`RUNDA: 1/5`) oraz allowlista nie były
aktualizowane po dispatchu rundy 2. Autoryzacja rozszerzenia allowlisty istniała wyłącznie
w prompcie dispatchującym rundę 2 — poza repo. Final Control czytający sam `00-dispatch.md`
zobaczyłby w `git status` dwa pliki „nic poza tym" nie obejmuje. Ten addendum zapisuje tę
autoryzację w run-dirze, żeby stan repo był samowystarczalnym dowodem (§1b R-PROC-AUTOBOT).

## Co się zmieniło względem rundy 1

**Runda 1 zakończyła się DECISION_REQUIRED** (opis konfliktu: `decision-abc.md`). Skrócenie
pól `warunek` dla `farma`, `bydlo`, `owce`, `lama`, `stadnina` — wymagane przez GOAL 2 i
kryterium końca 5 — łamało twarde asercje w DWÓCH pre-istniejących bramkach należących do
INNYCH tematów, spoza allowlisty rundy 1:

- `gra/tools/farma-nie-w-lesie-test.cjs` (temat `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1`),
- `gra/tools/hodowla-las-test.cjs` (temat `R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1`).

Obie asercjowały, że daty decyzji i cytaty ECHO stoją LITERALNIE w polu `warunek`.

**Decyzja dispatchu rundy 2 (autoryzacja orkiestratora):** allowlista tematu zostaje
ROZSZERZONA o te dwa pliki, WYŁĄCZNIE w zakresie przeniesienia nośnika historii decyzji z
`warunek` (tekst gracza) do `uwagi` (pole nierenderowane w UI, wzorzec
`P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1`). Zakaz zmiany w tych dwóch plikach czegokolwiek innego:
żadnej asercji zachowania silnika, żadnej reguły kwalifikacji budowy, żadnego usunięcia
kontroli — wyłącznie zamiana czytanego pola plus, w rundzie 2 obrony, wzmocnienie samych
asercji (kotwica na cytat ECHO zamiast na datę, kontrola pozytywna „brak sygnatury dev-notu
w tekście gracza").

## ALLOWLISTA OBOWIĄZUJĄCA W RUNDZIE 2 (zastępuje allowlistę z `00-dispatch.md`)

- `gra/src/ui/techDiscoveryNotice.ts` — WYŁĄCZNIE `wireSideCardLinks()` i logika selektora.
- `gra/data/terrain-improvements.json` — WYŁĄCZNIE pola `warunek` zidentyfikowane jako
  wyciek notatki deweloperskiej + towarzyszące im nowe pola `uwagi` (nośnik historii).
- `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` — rozszerzenie testu.
- **[NOWE, runda 2]** `gra/tools/farma-nie-w-lesie-test.cjs` — WYŁĄCZNIE asercje historii
  decyzji: czytanie `uwagi` zamiast `warunek` + kontrola pozytywna tekstu gracza.
- **[NOWE, runda 2]** `gra/tools/hodowla-las-test.cjs` — jw.
- `dyspozycje/autobot/runs/R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1/**` — artefakty
  procesu tego tematu (ten plik, `decision-abc.md`).

Zakazy z `00-dispatch.md` pozostają w mocy BEZ ZMIAN — w szczególności
`gra/src/ui/entityCards/renderer.ts`, `gra/src/ui/entityCards/improvementAdapter.ts`,
logika kwalifikacji budowy, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`, zakaz `npm run build`/`dev` w `gra/`, zakaz `git add -A`.

## Zakres rundy 2 (obrona) — 5 zarzutów Evaluatora

1. `(B7)` nie dowodziło przyczynowo, że skrócenie `warunek` domyka overflow → pomiar
   wzmocniony o `scrollHeight > clientHeight` + kontrola negatywna `(B7-K)`.
2. Brak zapisu autoryzacji rundy 2 w repo → TEN PLIK.
3. `decision-abc.md` nieaktualny po rundzie 2 → przepisany na stan faktyczny.
4. Asercja `stadnina.uwagi.includes('2026-09-03')` tautologiczna (prefiks) → kotwica na
   fragment cytatu ECHO.
5. Żądanie żywego dowodu dla `stadnina` przez CivPedię → ścieżka odrzucona z dowodem
   (CivPedia nie ma hasła `stadnina` i nie renderuje pola `warunek`); żywy dowód
   dostarczony dla wszystkich pozostałych osiągalnych wpisów — `(B8)`.

## GRANICE

Bez zmian: Operator/Evaluator/obrona nie integrują, nie deployują, nie pushują.
`READY_FOR_DEPLOY` wystawia wyłącznie orkiestrator po Final Control i faktycznej integracji.
