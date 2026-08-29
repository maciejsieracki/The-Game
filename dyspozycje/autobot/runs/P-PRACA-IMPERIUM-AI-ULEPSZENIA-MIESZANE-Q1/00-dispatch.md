TEMAT:  P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow) — osobny Operator per temat (żądanie właściciela 2026-08-29), model sędziego (R-PROC-AUTOBOT.md §3c) obowiązuje od tego dispatchu
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow)

## WYZWALACZ
Właściciel, żywa rozmowa 2026-08-29 (Grecy, 8 miast): panel „Praca Imperium" i
główny żeton HUD pokazują „Praca 39 -10" zamiast oczekiwanego wzrostu +80 (suma
„do puli" z 8 miast). Po wyłączeniu automatycznego rozdysponowania ulepszeń
przez AI wraca poprawne „Praca 134 +95". Właściciel: „nie powinno się tak
rozliczać, bo wprowadza w błąd. Powinno to pojawić się gdzieś w podsumowaniu,
a nie na głównym żetonie. W podsumowaniu, ile w zeszłej turze AI-gracz użył na
automatyczne ulepszenia? Albo ile przeznaczyć zgodnie z procentem budżetu. To
musisz sam ustalić."

## RECON WŁASNY ORKIESTRATORA (2026-08-29, zweryfikuj przed edycją)
`_lastPracaRate` (`gra/src/main.ts`) to jedyna zmienna zasilająca zarówno HUD
chip „Praca" (`hud.ts`, pole `pracaRate`) jak i panel „PULA IMPERIUM"
(`empireDetailPanel.ts:1219-1240`, pole `economy.pracaRate`). Jest sumą CZTERECH
niezależnych drenaży/zysków w jednej turze:
1. `+= poolGain` (linia ok. 27181) i `+= overflowToPool` (linia ok. 27201) — zysk
   z produkcji miast (`pracaImperialPoolGain`, `advanceProduction`).
2. `-= playerUpkeep` (linia ok. 27360) — utrzymanie ulepszeń surowcowych,
   JUŻ dziś pokazywane osobno w UI jako „UTRZYMANIE ULEPSZEŃ −N z puli"
   (`empireDetailPanel.ts:1241-1243`, pole `economy.pracaUpkeep`).
3. `-= usedPlayer` (linia ok. 27379) — przekierowanie nadwyżki (inny mechanizm).
4. `-= pick.kosztPraca` **per KAŻDE auto-postawione ulepszenie** (linie ok.
   27519-27534, wewnątrz pętli `pickAutoImprovements`) — TO JEST SKŁADNIK,
   o który chodzi w zgłoszeniu. Komentarz przy linii 27531-27533 nazywa to
   wprost: „auto-ulepszenia zużywają pulę TEJ SAMEJ tury (...) odjęcia od
   wyświetlanej stawki".

**WAŻNE — to NIE jest prosty, nienazwany bug.** Punkt 4 powyżej został
świadomie wprowadzony pod ID `R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` (Wątek D,
`dyspozycje/autobot/runs/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1/01-operator.md`
§„KROK 2"), jako naprawa WCZEŚNIEJSZEGO regresu `R-PRACA-PULA-NIEAKUMULUJE-Q1`
(pula wyglądała jakby „nie akumulowała" mimo dodatniego przychodu — bo
`_lastPracaRate` WCZEŚNIEJ pomijał ten drenaż, więc liczba na ekranie nie
zgadzała się z faktycznym stanem puli). Istnieje dedykowany test regresyjny
`gra/tools/praca-pula-rate-parity-test.cjs` (3/3) chroniący WŁAŚNIE to, że
`_lastPracaRate` = suma WSZYSTKICH czterech drenaży/zysków, zgodna z faktyczną
zmianą puli.

## GOAL
Dwie rzeczy muszą być prawdą jednocześnie:
(a) `_lastPracaRate` (i wszystko co z niego czyta: HUD chip, panel „PULA
    IMPERIUM") **nadal** jest dokładną sumą wszystkich czterech drenaży/zysków —
    `praca-pula-rate-parity-test.cjs` (3/3) pozostaje zielony BEZ ZMIANY swoich
    asercji. Ten temat NIE cofa naprawy Wątku D.
(b) Gdzieś w UI (rekomendacja: panel „PULA IMPERIUM" w `empireDetailPanel.ts`,
    obok już istniejącego boksu „UTRZYMANIE ULEPSZEŃ", analogiczny nowy boks
    „AUTO-ULEPSZENIA (AI)" pokazujący sumę `pick.kosztPraca` faktycznie
    wydaną automatem w OSTATNIEJ turze) pojawia się osobna, czytelna liczba
    tego konkretnego drenażu — tak żeby gracz widział SKĄD bierze się ujemny
    /niski netto, zamiast tylko końcowego wyniku. Dokładny wybór miejsca
    (osobny boks w panelu vs. rozszerzenie tooltipu HUD, wzorem
    `pracaChipTitle` w `hud.ts:800-804`, który już dziś rozbija
    brutto=netto+pracaUpkeep) należy do Operatora — byle liczba była widoczna
    BEZ dodatkowego kliku w miejscu, gdzie gracz już dziś patrzy na bilans
    Pracy (nie ukryta głęboko w osobnym ekranie).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `praca-pula-rate-parity-test.cjs` — 3/3, BEZ ZMIANY oczekiwanych wartości
   (dowód, że suma czterech drenaży w `_lastPracaRate` jest nietknięta).
2. Nowe pole (np. `pracaAutoUlepszeniaSpent` albo analogiczna nazwa wybrana
   przez Operatora, zgodna z konwencją `pracaUpkeep`) niesie sumę
   `pick.kosztPraca` ze WSZYSTKICH auto-postawionych ulepszeń gracza w
   OSTATNIEJ turze (analogicznie do istniejącego `pracaUpkeep` — osobny
   licznik zerowany/ustawiany w tym samym miejscu co `_lastPracaRate` w
   pętli tury, NIE odczyt wsteczny z logów).
3. To nowe pole jest widoczne w UI (panel „PULA IMPERIUM" i/lub tooltip HUD)
   jako osobna, podpisana liczba — scenariusz z tego zgłoszenia (8 miast,
   suma „do puli" +80, auto-ulepszenia AI wydały 90 z puli w tej samej turze,
   netto -10) MA być rozłożalny na te dwa składniki w UI, nie tylko w kodzie.
4. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
5. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/19), research-test (33/33), unit-replace-test (13/13),
   combat-test (6/6). Znany regres ai-praca-split-parity-test 21/1 bez zmian.
6. Wszystkie istniejące testy `praca-*.cjs` (co najmniej: praca-limit-50-test,
   praca-miasto-limit-50-test, praca-na-pieniadz-test, praca-split-ui-test,
   praca-global-default-live-test, praca-pula-rate-parity-test) zielone bez
   pogorszenia.
7. To jest NOWE SPRAWDZENIE tematu — nazwij plik docelowy jawnie w raporcie
   (np. rozszerzenie `praca-pula-rate-parity-test.cjs` o nowe asercje, albo
   nowy plik `praca-auto-ulepszenia-rozbicie-test.cjs`).

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (wyłącznie: dodanie nowej zmiennej/pola śledzącego sumę
auto-ulepszeń AI w turze, obok istniejącego `_lastPracaUpkeep`/`pracaUpkeep` —
BEZ zmiany istniejącej arytmetyki `_lastPracaRate`), `gra/src/ui/hud.ts`
(rozszerzenie `HudState`/`pracaChipTitle` jeśli Operator wybierze tooltip),
`gra/src/ui/empireDetailPanel.ts` (jeśli Operator wybierze osobny boks w
panelu „PULA IMPERIUM"), plik(i) testowe z kryterium 7.
Zakazane bezwzględnie: zmiana arytmetyki `_lastPracaRate` (kryterium 1),
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Tryb „Wynik bramki z pamięci" (tabela `civ-autobot/SKILL.md`) w wariancie
lokalnym: zakaz zgłoszenia „test parytetu nadal przechodzi" bez wklejonego
surowego outputu `praca-pula-rate-parity-test.cjs` PRZED i PO zmianie — to
jedyny dowód, że Wątek D nie został po cichu cofnięty. Dodatkowo zakaz
zaokrąglania/szacowania sumy auto-ulepszeń AI „z grubsza" — musi to być
faktyczna suma `pick.kosztPraca` z tej samej pętli co zapis do
`_lastPracaRate`, nie osobne, niezależne przybliżenie.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładny plik/funkcję z błędem; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, model sędziego §3c) → Operator (obrona, jeśli
zarzuty) → Final Control (werdykt per zarzut, osobne wywołanie Workflow) →
integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
