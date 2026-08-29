TEMAT:  R-BADANIA-KOSZT-PODWOJENIE-Q1
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow) — właściciel dał opt-in w tej sesji frazą „Autobots workflow"
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobny subagent, osobne wywołanie Workflow) — R-PROC-AUTOBOT.md §5a, baza (temat NIE jest graficzny/wizualny)

## WYZWALACZ
Właściciel, żywa rozmowa 2026-08-29: „Na pewno trzeba podnieść koszt badań,
wszystkich poza pierwszymi czterema, o 100%. Badania trwają zbyt szybko. Nie
nadążam za budowaniem budynku, które można wybudować dzięki badaniom." Po
pytaniu doprecyzowującym (AskUserQuestion, bo „pierwsze cztery" było
niejednoznaczne między kolejnością tablicy i Poziomem) właściciel wskazał
wprost: Obróbka drewna, Rolnictwo, Łowiectwo, Oswojenie zwierząt. To jest
bezpośrednie ustalenie w dialogu (wyjątek 3 z `R-PROC-AUTOBOT-ABC-TURNIEJ.md`
§Zakres wyjątku) — właściciel sam podał wariant i liczbę, nie wybiera litery
z gotowej propozycji, więc turniej ABC nie ma zastosowania.

## GOAL
W `gra/data/tech.json` pole „Koszt nauki" jest DOKŁADNIE dwukrotnością
obecnej wartości dla wszystkich technologii OPRÓCZ czterech wymienionych
niżej, które zostają bez zmian; żaden inny plik ani mechanizm (tempo gry,
`difficulty-cost.ts`, testy referencyjne) nie jest modyfikowany.

## ZAKRES ZMIANY — jawna lista (32 technologie łącznie, recon 2026-08-29)

BEZ ZMIAN (4, Epoka Kamień, Poziom 1, dziś koszt 5 każda):
Obróbka drewna, Rolnictwo, Łowiectwo, Oswojenie zwierząt.

PODWOJENIE (28, stary koszt → nowy koszt = stary×2):
Garncarstwo 20→40, Murarstwo 28→56, Łucznictwo 28→56, Mistycyzm 20→40,
Wymiana 32→64, Gospodarka wodna 36→72, Koło 44→88, Brązownictwo 90→180,
Żegluga 80→160, Pismo 90→180, Religia 96→192, Jeździectwo 112→224,
Wojskowość 104→208, Matematyka 136→272, Handel 148→296, Kodeks 124→248,
Budownictwo 170→340, Waluta 200→400, Astronomia 220→440,
Hutnictwo żelaza 240→480, Inżynieria 260→520, Oblężnictwo 280→560,
Filozofia 300→600, Prawo 310→620, Drogi brukowane 340→680,
Medycyna 324→648, Obróbka żelaza 370→740, Sztuka wojenna 400→800.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `gra/data/tech.json`: dokładnie te 4 pozycje mają „Koszt nauki" NIEZMIENIONE
   (=5), pozostałe 28 mają „Koszt nauki" = 2× wartość sprzed zmiany z listy
   wyżej — sprawdzone programowo (skrypt porównujący stary/nowy JSON pozycja
   po pozycji), nie wzrokowo.
2. Żaden inny plik nie zmieniony poza `gra/data/tech.json` (`git diff --stat`
   pokazuje wyłącznie ten jeden plik).
3. `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.
4. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/0), research-test (33/33 — UWAGA: fixture testu jest
   SYNTETYCZNA, własne dane z hardkodowanym kosztem w `research-test.cjs`,
   NIEZALEŻNE od `tech.json`; zmiana kosztu w `tech.json` nie powinna
   poruszyć wyniku tej bramki — jeśli poruszy, to CZERWONA FLAGA, nie
   oczekiwany efekt uboczny), unit-replace-test (13/13), combat-test (6/6).
   Znany, świadomie nie-naprawiany regres: ai-praca-split-parity-test 21/1
   (nie pogarszać, nie naprawiać w tym temacie).
5. Brak nowego testu — to NIE jest nowe sprawdzenie (`R-PROC-AUTOBOT.md`
   §12), tylko zmiana wartości danych w istniejącym pliku; próg podziału na
   węzły nie ma zastosowania (1 plik, 1 obszar allowlisty).

## ALLOWLISTA — nic poza tym
`gra/data/tech.json` — wyłącznie pole „Koszt nauki", żadne inne pole
(„Technologia", „Epoka", „Poziom", „Wymaga (prereq)", opisy odblokowań,
„Uwagi") nie jest dotykane.
Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`,
`gra/tools/research-test.cjs` (fixture testu, celowo niezależna od danych).

## IZOLACJA
worktree osobny, gałąź `autobot/R-BADANIA-KOSZT-PODWOJENIE-Q1`, baza
**jawnie `origin/main`**. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/` (C-015).

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Tryb „Samoocena liczników" (tabela `civ-autobot/SKILL.md`) w wariancie
lokalnym: Operator NIE wolno zgłosić „28 wartości podwojonych" z pamięci —
musi wkleić do raportu wynik SKRYPTU porównującego stary i nowy JSON
pozycja-po-pozycji (np. `node -e` diff), nie własne przeliczenie w opisie.
Evaluator liczy niezależnie od zera (własny skrypt, nie kopiuje liczb z
raportu Operatora) i sprawdza też, że ŻADNE inne pole poza „Koszt nauki" się
nie zmieniło w żadnym z 32 wierszy.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładną pozycję/pozycje z błędną wartością; runda N+1
na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9 w całości. Szczególnie istotne tu: zakaz
`npm run build`/`dev` w `gra/` (typecheck wyłącznie
`node ./node_modules/typescript/bin/tsc --noEmit`), zakaz `git add -A`,
zakaz dotykania `dyspozycje/WERSJE.md` przed deployem.

## OBIEG
Operator → Evaluator → Final Control (osobne wywołanie Workflow) →
integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
