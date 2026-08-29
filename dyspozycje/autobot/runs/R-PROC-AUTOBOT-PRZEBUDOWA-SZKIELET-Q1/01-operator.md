# 01 — OPERATOR (rundy 1–3, zapis skrócony)

> **Zapis retroaktywny**, założony w rundzie 3 razem z katalogiem runu (defekt
> D-5 Final Control rundy 2). Rundy 1 i 2 raportowały w czacie orkiestratora,
> nie do pliku; poniżej destylat z faktycznych commitów gałęzi
> `autobot/PROC-SZKIELET-Q1`, a nie przepisana treść tamtych raportów.

DOMAIN: PROCESS
TEMAT: `R-PROC-AUTOBOT-PRZEBUDOWA-SZKIELET-Q1`
GOAL: jak w `00-dispatch.md`.

## Runda 1 — commit `54aaa746`

STATUS: PASS (zakwestionowany później przez Evaluatora — 8 znalezisk)

- `R-PROC-AUTOBOT.md`: sekcje 1–8 zostawione z niezmienioną numeracją (inne pliki
  się do nich odwołują), dołożona warstwa §9–§16 nowego szkieletu — granice
  nienaruszalne domeny gry, podział decyzji właściciel/orkiestrator z testem
  zrozumiałości pytania, czystość raportu, progi podziału na węzły, dyscyplina
  źródeł, cztery pola promptu, checklisty Evaluatora i Final Control. Plus §1b
  (co NIE jest dowodem zakończenia), §2a (zapis dispatchu z wyzwalaczem), §2b
  (sekwencjonowanie i sprzątanie worktree przy `INFRA`), §3b (`PASS-WITH-NOTES`).
- `autobots/SKILL.md` przepisany jako szkielet domenowo-neutralny (0–19,
  placeholdery); `civ-autobot/SKILL.md` dostał wypełnienie parametrów tego
  projektu; `civ-autobot-workflow` i `civ-autobot-cursor-automations` dociągnięte
  do tej samej pętli.

## Runda 2 — commit `1dd22ddf`

STATUS: PASS (zakwestionowany przez Evaluatora i Final Control rundy 2 — `FAIL`,
5 zweryfikowanych defektów D-1…D-5)

- §12: próg „więcej niż 3 nazwane bramki" zawężony do sprawdzeń specyficznych dla
  tematu; `tsc` + 5 bramek referencyjnych jawnie wyłączone jako stała część wspólna;
  artefakty runu przestały być „obszarem allowlisty"; `gra/src/**` +
  `gra/tools/*-test.cjs` jednej zmiany uznane za jeden obszar, nie dwa.
- §12: dopisany styk z §3 — jedna fala węzłów = jedna runda w liczniku.
- C-001 cytowane dosłownie z `playbook.md` w §9 poz. 1 i we wzorcu promptu
  `civ-autobot-workflow`; „dozwolone wyłącznie" zawężone do rodziny komend
  build/compile, żeby nie zakazywało bramek §6.
- `civ-autobot/SKILL.md`: C-060 przywrócone do brzmienia warunkowego.

## Runda 3 — bieżąca

STATUS: PASS

Zakres: wyłącznie 5 defektów D-1…D-5 z Final Control rundy 2, bez cofania rund 1–2.

- **D-1** — `R-PROC-AUTOBOT.md` §9 poz. 1 i `civ-autobot-workflow/SKILL.md`
  §IZOLACJA: usunięte zdanie utrwalające dosłowny `--outDir dist` jako nakaz
  operacyjny. Dosłowny cytat C-001 zostaje bez zmian; wiążący jest **zakaz
  `npm run build`/`npm run dev`**, a `--outDir` opisany jako parametr katalogu
  docelowego, który w tym repo musi wskazywać katalog poza drzewem repo
  (powód: `SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md:265`, OneDrive `EPERM` na
  `gra/dist/`). Usunięty wymóg ECHO dla zmiany `--outDir`; ECHO zostaje dla
  osłabienia samego zakazu. Oba pliki mówią teraz to samo.
- **D-2** — §12: doprecyzowane, że do progu liczą się wyłącznie faktycznie NOWE
  sprawdzenia tematu, a istniejące bramki regresyjne/sąsiednie uruchamiane
  defensywnie nie liczą się, niezależnie od przynależności do piątki §6. Dopisane,
  że artefakty runu nie liczą się także do progu „więcej niż 6 plików w allowliście".
- **D-3** — `docs/procesy/INDEX-PROCESU.md` §6: dopisane brakujące pole `RUNDY:`;
  trzy nośniki kontraktu raportu mają identyczny zestaw pól.
- **D-4** — pytanie ABC przepisane w poprawionej wersji Final Control rundy 2
  (bez fałszywego „ani jednego zdania o samej grze", z wariantem C jawnie
  odpowiadającym zapisowi już działającemu w `civ-autobot/SKILL.md`).
- **D-5** — założony ten katalog runu z `00-dispatch.md` i skróconymi,
  oznaczonymi jako retroaktywne zapisami 01/02/03.

ZMIANY/COMMIT: allowlista z `00-dispatch.md`, docs-only, zero zmian w `gra/`.
TESTY: patrz `03-final-control.md`.
BLOKADY: brak.
RUNDY: 3/5.
NASTĘPNY KROK: Evaluator, runda 3.
DEPLOY/PUSH: NIE WYKONANO.
