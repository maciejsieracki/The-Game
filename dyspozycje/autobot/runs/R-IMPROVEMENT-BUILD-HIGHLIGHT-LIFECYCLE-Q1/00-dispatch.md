# R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1 — dispatch

TEMAT: `R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1`
RUNDA: 1/5 · DATA: 2026-10-29 · DOMAIN: GAME · ŚCIEŻKA: A (Workflow)
STATUS: ACTIVE — właściciel jednoznacznie uchylił bramkę Kanban dla tej pracy 2026-10-29; Kanban nie jest używany.
ROLE ROUTING: Operator `/root/improvement_highlight_operator`; independent Evaluator after operator commit; Defense returns to Operator only if objections; independent Final Control after review; orchestrator integrates/releases/deploys/pushes.

## WYZWALACZ

Właściciel zgłosił 2026-10-29, że podczas zaznaczenia ulepszenia pola kwalifikujące się do budowy są podświetlane, ale podświetlenie jest za słabe i pozostaje po wybudowaniu, przez co myli się już zbudowane kopalnie na górach z miejscami nadal kwalifikującymi się. Żądanie obejmuje WSZYSTKIE ulepszenia.

## GOAL

Podświetlenie aktywnych, kwalifikujących się pól dla wszystkich ulepszeń ma być o 20% jaśniejsze od obecnego, a po udanej budowie natychmiast znikać z pola, które przestało kwalifikować się do wybranego ulepszenia; po odznaczeniu/ponownym odświeżeniu trybu podświetlenie pokazuje ponownie wyłącznie aktualnie kwalifikujące się, niezbudowane pola.

## KRYTERIA KOŃCA — binarne

1. NOWE: jasno zdefiniowana i testowalna miara „+20% jasności” względem obecnego renderu (kolor/alpha/luminance); brak niejawnej zmiany niepowiązanych kolorów UI.
2. NOWE: testy pokrywają WSZYSTKIE ulepszenia (w tym kopalnię na górze), aktualizację po udanej budowie, budowę nieudaną/anulowaną, zmianę zaznaczonego ulepszenia oraz odznaczenie/ponowne zaznaczenie pola.
3. NOWE: zbudowane lub niekwalifikujące się pole nie ma warstwy kwalifikowalności; nadal kwalifikujące się pola zachowują highlight. Widok nie może korzystać ze starego/cache'owanego zestawu heksów po budowie.
4. Wizualne dowody z żywego Chromium przed/po dla kopalni na wzgórzu oraz przynajmniej jednego ulepszenia innego typu; screenshots w katalogu `dowody/` tego runu.
5. Test mutacyjny/negatywny potwierdza, że usunięcie wzrostu jasności lub odświeżenia po budowie oblewa bramkę. Nie zmniejszaj istniejącego pokrycia.
6. Istniejące testy kwalifikacji/podświetlenia ulepszeń i regression suite bez nowych regresji; `tsc --noEmit`, Vite build i smoke PASS.
7. Niezależny Evaluator PASS; przy uwagach Operator/Defense odpowiada punktowo, Evaluator ponawia; Final Control PASS.

## ALLOWLISTA

- Najmniejszy potrzebny zakres `gra/src/render/**`, `gra/src/main.ts` (odświeżenie warstwy po build action), inne moduły UI/render tylko jeśli konieczne.
- `gra/tools/**` — testy.
- `dyspozycje/autobot/runs/R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1/**`.

Zakazane: sekrety, `.git/**`, `gra-robocza/**`, `dyspozycje/WERSJE.md`, deploy/push/integracja przez Operatora. Nie wznawiaj ani nie modyfikuj historycznego `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1`; wykorzystaj jako kontekst wyłącznie po sprawdzeniu zakresu.

## IZOLACJA

Worktree `/workspace/improvement-highlight-operator`, branch `autobot/R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1`, baza jawna: dispatch commit z `origin/main` po rejestracji. Nie używaj dirty `/workspace/The-Game`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

To zmiana wizualna: temat nie jest zamknięty samym CSS/stałą/liczbą asercji. Porównuj ten sam teren, kamerę, zoom i aktywne ulepszenie na żywym Chromium. Sprawdź zarazem widoczność zmiany modelu podświetlonego pola i to, że po budowie heks znika z overlay. Nie nazywaj odświeżenia po zmianie selekcji dowodem natychmiastowego odświeżenia po budowie.

## PROCEDURA NAPRAWCZA

Evaluator zgłasza każdy defekt z reprodukcją i minimalną poprawką; wraca zakwestionowany zakres do Operatora/Defense. Maksymalnie 5 rund na tym ID. Jeśli „+20%” nie mapuje się do jednej istniejącej mierzalnej wielkości, pokaż trzy możliwe interpretacje właścicielowi zamiast twierdzić, że zmiana jest dokładna; najpierw jednak zbadaj renderer i przyjmij najbardziej naturalną miarę alpha/luminance, jeśli wynik jest bezpieczny i weryfikowalny.

## GRAF 1–11

1. Rejestracja, zakres i dispatch — DONE (owner override; Kanban waived).
2. Rekonesans źródeł overlay, cyklu budowy i baseline — ACTIVE; baseline test kopalni 76/76.
3. Implementacja jasności i cyklu życia overlay — Operator.
4. Testy wszystkich ulepszeń, stanów budowy i mutacji — Operator.
5. Chromium before/after, typecheck, build i regresje — Operator.
6. Niezależny Evaluator — oczekuje na etap 5.
7. Obrona/poprawki Operatora — warunkowa.
8. Final Control — oczekuje na PASS ewaluatora.
9. Integracja do `main` — orkiestrator po akceptacji.
10. Build/publikacja do ROBOCZEJ oraz smoke/readback — orkiestrator.
11. `git push`, receipt, rejestr/WERSJE i zamknięcie — orkiestrator.

## OBIEG / GRANICE

Operator → niezależny Evaluator → (Defense przy zarzutach) → Final Control → integracja → ROBOCZA → push. Operator nie ocenia własnej pracy, nie integruje, nie deployuje, nie pushuje. Stosuj `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`; wcześniejsze jawne upoważnienie właściciela do merge/deploy/push pozostaje ważne.
