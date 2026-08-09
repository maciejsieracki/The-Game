# HANDOFF SESJI — 2026-08-09 · FALA 263 · maraton AutoBot (isWorkable + handel akcja „6")

**Dla następnego agenta (dowolna sesja — lokalna, chmurowa).**
**Czytaj najpierw ten plik**, potem `STAN-PRACY-HANDOFF.md` (skrót) · `dyspozycje/_handoff/KANAL-PRACA.md` (ostatnie wpisy) · `dyspozycje/PYTANIA-OTWARTE.md` (pełny rejestr otwartych/zamkniętych tematów z dziś).

---

## 1. Stan gry (ROBOCZA)

| Pole | Wartość |
|------|---------|
| **AKTUALNA FALA** | **263** |
| **md5** | `89176ced318b7e7d03b2fd6b197df80d` (label `89176ced`) |
| **Commit deploy** | `8fbe916e` na `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (branch roboczy, NIE `main` jeszcze) |
| **Wejście** | `gra-robocza/START.html` · **git pull** + Ctrl+F5 + Nowa gra |
| **Poprzednia fala** | FALA 262 `ce69cf45` — **ZASTĄPIONA** |

**Uwaga ważna:** cała praca tej sesji żyje na branchu **`claude/sprawdzenie-funkcjonalnosci-ek4ra0`**, nie na `main`. Przed startem następnej sesji sprawdź, czy ten branch został scalony do `main` (i czy PR nie został już zmergowany — jeśli tak, kolejna praca zaczyna nowy branch od `main`, nie stackuje na tym, zgodnie z regułą repo o mergowanych gałęziach).

---

## 2. Co ZROBIONE w tej sesji (skrót łańcucha, chronologicznie)

Sesja to bezpośrednia kontynuacja wcześniejszego maratonu tego samego dnia (FALA 262 była już zdeployowana na starcie tej sesji). Poniżej wyłącznie to, co doszło **w tej** sesji, aż do FALA 263.

### 2a. Batch „niepilnych notatek Evaluatorów” — 7 tematów, każdy osobny Operator→Evaluator
Wszystkie **ZAMKNIĘTE i scalone**, każdy z pełnym dowodem mutacyjnym:

| Temat | Commit | Bramka własna |
|---|---|---|
| `P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA` | `cca87559` | `diplomacy-tech-trade-test.cjs` 26/26 |
| `P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL` | `02b19607` | `format-pl-signed-minus-glif-test.cjs` 13/13 (nowy) |
| `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA` | `92341250` (+ **naprawiona recydywa** `9899f53b`, patrz §6) | `heks-panel-tooltip-warstwa-test.cjs` 22/22 |
| `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` | `d383edec` | `city-panel-growth-percent-separator-test.cjs` 29/29 |
| `P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA` | `930bb35c` | `mur-paradoks-test.cjs` 29/29 |
| `P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD` | `aa52898b` | `city-growth-percent-rounding-parity-test.cjs` 16/16 (nowy) |
| `P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA` | `1cde4c2a` | `spichlerz-widocznosc-test.cjs` 45/45 (przepisany, był 13/14) |

### 2b. `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA` — robotnicy na Górach/Morzu, **4 rundy**
Silnik ekonomii przypisywał robotników na Morze/Góry, których overlay renderowania nigdy by nie pokazał (Góry mają najwyższą Pracę ze wszystkich terenów). Historia rund:
- **Runda 1** — naprawiła 2 z 5 ścieżek zapisu przydziału → **Evaluator FAIL** (tryb ręczny bez filtra, cicha utrata produkcji 27→15 Pracy/turę).
- Decyzja właściciela **`R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1` = „tylko stare zapisy, bez migracji"** — mechanizm ręcznego przydziału zostaje bez zmian funkcjonalnych, żadnej auto-naprawy starych zapisów. Kanon: `docs/decyzje/R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.md`.
- **Runda 2** — wszystkie 5 ścieżek dostało filtr → **Evaluator FAIL** (filtr terenu zablokował też ZDEJMOWANIE robotnika ze starego zapisu — zakleszczenie, wprost łamiące decyzję).
- **Runda 3** — naprawiona kolejność bramek (zdejmowanie zawsze przed filtrem terenu) → **Evaluator FAIL** (NOWA regresja: przy spadku populacji `rebalanceWorkersAfterPopulationChange` kasowała więcej wpisów niż nadmiar populacji).
- **Runda 4** — naprawiona logika usuwania (`score=-Infinity` dla nielegalnych, jedna ścieżka usuwania) + dołożone testy per-ścieżkowe → **Evaluator PASS-WITH-NOTES, SCALONE** (commit `efbe6b89`).

Bramki końcowe: `okolica-test.cjs` **72/72** (było 46/46 przed rundą 1), `okolica-isworkable-silnik-test.cjs` **15/15** (nowy plik), `logic-test.cjs` **213/213**.

**Nowe pytanie ABC z tego wątku, już rozstrzygnięte:** `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1` — naprawa chroni też pola, które wypadły z zasięgu przez skurczenie promienia terytorium (zwykła dynamika gry, nie tylko stare zapisy) — tworzy „fantomowe" zajęte sloty niewidoczne w panelu miasta. **Maciej: B** — auto-czyścić TYLKO ten przypadek (nie stare zapisy z nielegalnym terenem). **Odłożone do następnej paczki pracy** — nie wdrożone w tej sesji.

### 2c. `P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1` — handel dwukierunkowy w akcji „6", **3 rundy**
Decyzja właściciela **ABC=A: pełny handel dwukierunkowy** (Sprzedaż/Kupno za gotówkę LUB wymianę technologia-za-technologię). Kanon: `docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`.
- **Runda 1** — zbudowany przełącznik Sprzedaż/Kupno (tylko gotówka), przy okazji naprawiony pre-istniejący bug (`executePnDealTransfer` nigdy nie czytał `techId`) → **Evaluator FAIL: EXPLOIT** — nowy kod przyznawał technologię PRZED sprawdzeniem zapłaty, gracz z 0 ¤ dostawał technologię za darmo. Drugi bloker: Operator świadomie wyciął tech-za-tech mimo że decyzja go wymagała.
- Nowe pytanie ABC o zakres (B3): rozszerzyć od razu o tech-za-tech, czy najpierw exploit osobno? **Maciej: A — rozszerzyć teraz.**
- **Runda 2** (rozszerzony zakres) — exploit gotówkowy naprawiony poprawnie (4/4 kombinacje), dołożony tryb tech-za-tech → **Evaluator FAIL** — tryb tech-za-tech był CAŁKOWICIE ODCIĘTY od silnika (`buildProposalFromPayload` gubił nowe pola w białej liście, `techPrice` wyliczał się jako 0, oferta zawsze odrzucana „Cena poniżej minimum" mimo 41/41 zielonych testów — testy omijały zepsute okablowanie UI→silnik). Druga połowa exploita rundy 1 nienaprawiona: silnik nie sprawdzał czy DAWCA głównej technologii ją posiada.
- **Runda 3** — oba blokery naprawione, nowy `diplomacy-tech-trade-e2e-test.cjs` wycinający PRAWDZIWY literał z `main.ts` (nie kopię) → **Evaluator PASS-WITH-NOTES, SCALONE** (commit `0d4f48e9`). Jedna nota (ostatni skok łańcucha w teście E2E był ręczną kopią, nie ekstrakcją) poprawiona przy scaleniu.

Bramki końcowe: `diplomacy-locks-test` 71/71 · `diplomacy-audience-actions-test` 20/20 · `diplomacy-tech-trade-test` 26/26 · `diplomacy-proposal-test` 129/129 · `diplomacy-negotiation-table-test` 62/62 · `diplomacy-tech-trade-execute-test` 52/52 (nowy) · `diplomacy-tech-trade-e2e-test` 28/28 (nowy).

---

## 3. Proces tej sesji — AutoBot, jak zwykle w tym repo

Operator = Sonnet 5 (worktree izolowany), Evaluator = Opus 5 (adwokat diabła, werdykt PASS/PASS-WITH-NOTES/FAIL), Deploy = Opus 5. **Każda** runda FAIL dostawała precyzyjną listę punktów od Evaluatora i była kontynuowana **przez `SendMessage` do TEGO SAMEGO agenta/worktree** (nie nowy `Agent` od zera) — to nowa, formalnie zapisana reguła procesowa (patrz §7).

---

## 4. Decyzje ABC tej sesji — wszystkie ECHO zapisane

| # | ID | Litera | Skutek | Plik |
|---|-----|--------|--------|------|
| 1 | `P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1` | **A** | Pełny handel dwukierunkowy w akcji „6" | `docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md` |
| 2 | `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1` | „tylko stare zapisy, bez migracji" | Mechanizm ręczny bez zmian funkcjonalnych | `docs/decyzje/R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.md` |
| 3 | `P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1` (B3, zakres) | **A** | Rozszerzyć rundę 2 o tech-za-tech od razu | (nota w `PYTANIA-OTWARTE.md`) |
| 4 | `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1` | **B** | Auto-czyścić TYLKO fantomy po skurczeniu promienia — **odłożone do wdrożenia** | `dyspozycje/PYTANIA-OTWARTE.md` |

---

## 5. Kontrola kompletności (`grep 'STATUS: **OTWARTE'`) — stan na koniec sesji

6 pozycji w `dyspozycje/PYTANIA-OTWARTE.md`, każda z udokumentowanym powodem odłożenia w samym nagłówku (niepilne/dokumentacyjne/pre-istniejące) — **żadna nie blokuje**:

1. `P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE` — pre-istniejące, awaria harnessu testowego nie regresja.
2. `P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI` — `+` przed `signed()` daje `+−5` na wartościach ujemnych, pre-istniejące.
3. `P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY` — analogiczna usterka do 2a w sąsiedniej karcie żywności, nienaprawiona.
4. `P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE` — komentarz w teście uzasadnia wybór regexa nieprawdziwym argumentem (jsdom jest w repo).
5. `P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY` — 3 miejsca nie przekazują `zloze` do `tileYield`, dziś nieszkodliwe.
6. `P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA` — `adjustTileWorker(+1)` na obsadzonym polu zdejmuje zamiast dodać, pre-istniejące, poza zakresem serii isWorkable.

Plus jedna zaparkowana decyzja czekająca na wdrożenie: `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1=B` (§2b, §4).

---

## 6. Problemy / pułapki sesji (żeby nie powtórzyć)

1. **CICHY REVERT przy scalaniu patcha liczonego względem złej bazy.** Przy scalaniu `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` orkiestrator policzył `git diff 92341250 cdb29d92` — ale `cdb29d92` (tip worktree tamtego Operatora) odgałęził się PRZED `92341250`, więc diff po cichu zawierał cofnięcie naprawy `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA`. `git apply --check` przeszedł czysto (brak konfliktu tekstowego) — złapane dopiero przez bramkę `heks-panel-tooltip-warstwa-test.cjs` na etapie DEPLOYU (agent deploy odmówił wypchnięcia FALA 263 pierwszej próby, słusznie). Naprawione bezpośrednio (`9899f53b`), zweryfikowane niezależnym Evaluatorem pełnym diffem + dowodem mutacyjnym. **Nowa reguła w `civ-autobot/SKILL.md` §5:** `git diff <A> <B>` do scalenia patcha jest bezpieczny WYŁĄCZNIE gdy `<A>` jest faktycznym przodkiem `<B>` (`git merge-base --is-ancestor`) — inaczej `git diff $(git merge-base <baza worktree> <tip>) <tip>`. Drugi, niezależny mechanizm cichej utraty pracy w tym repo obok `b9867b3`.
2. **Restarty kontenera zabijały subagentów bez notyfikacji.** Środowisko tej sesji restartowało się kilka razy z rzędu (~co 7-8 min w jednym epizodzie), zabijając background procesy (w tym długi `map-gen-regression-test.cjs`) bez żadnego sygnału przerwania. Jedynym sposobem wykrycia było bezpośrednie sprawdzenie `git log`/`git status` w worktree, gdy spodziewana notyfikacja nie nadeszła. **Nowa reguła w `civ-autobot/SKILL.md` §5** oraz ogólniejsza wersja w globalnym skillu `lean-loop`.
3. **`map-gen-regression-test.cjs` nie mieściła się w oknie restartów** dla zmian dotykających `okolica.ts`/`turn-economy.ts`. Zamiast czekać na niedostępne okno czasowe, zweryfikowano analizą call-site (`grep -rn` w `gra/src/map/**`) że żadna zmieniona funkcja nie jest tam wywoływana — bezpieczne pominięcie, potwierdzone niezależnie DWA razy (przez orkiestratora i przez Evaluatora rundy 3/4, licząc dokładne wystąpienia w bundlu entry-pointu). Nie jest to generalna zasada „zawsze można pominąć" — wymaga takiej samej analizy przy następnej zmianie dotykającej te pliki.
4. **Kontynuacja rundy po FAIL przez `SendMessage`, nie nowy `Agent`.** Sprawdzone wielokrotnie (4 rundy isWorkable, 3 rundy handel-akcja6) — agent zachowuje pełen kontekst (dokładna lista Evaluatora, stan plików, worktree), szybciej i taniej niż odtwarzanie od zera.
5. **Operator musi budować własne przypadki brzegowe wykraczające poza scenariusz z tickieta.** Dwie kolejne rundy (isWorkable runda 2→3, akcja6 runda 1→2) przeszły własny dowód mutacyjny Operatora na scenariuszu z raportu i mimo to wprowadziły nową regresję, którą złapał dopiero Evaluator budując WŁASNE scenariusze (np. `excess=0` z nielegalnymi wpisami obecnymi, wszystkie 4 kombinacje trybu/kierunku).

Wszystkie trzy nowe reguły (1, 2, 4-5) są już wpisane do `.claude/skills/civ-autobot/SKILL.md` §5 i §4 (commity `ca74f4f1`, `9899f53b`) — nie trzeba ich przepisywać, tylko przeczytać skill na starcie następnej sesji.

---

## 7. Start następnej sesji (checklist)

```bash
git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0
git log --oneline -5 origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0
# jeśli branch już zmergowany do main i PR zamknięty — zacznij nowy branch od main,
# nie stackuj na tym (zasada repo o mergowanych gałęziach)
```

1. Przeczytaj ten handoff + ostatnie wpisy `dyspozycje/_handoff/KANAL-PRACA.md` (wpis `[17:02 PL, 2026-08-09]` z md5 `89176ced`).
2. Potwierdź ROBOCZA `89176ced` w `dyspozycje/WERSJE.md`.
3. Przeczytaj `.claude/skills/civ-autobot/SKILL.md` §4-5 — trzy nowe reguły procesowe stąd.
4. Playtest FALA 263 (patrz sekcja „Playtesty" niżej) — nic z tej sesji nie było jeszcze fizycznie sprawdzone w grze.
5. Jeśli podejmujesz `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1=B` — kanon w `PYTANIA-OTWARTE.md`, zakres: `gra/src/game/okolica.ts` (`rebalanceWorkersAfterPopulationChange`, gałąź `!t`), rozróżnić przyczynę „teren nielegalny" (nie ruszać) od „poza promieniem po skurczeniu" (auto-czyścić jak przed serią napraw).

### Playtesty
- Robotnicy: nowego nie postawisz na Górach/Morzu; stary nielegalny wpis z zapisu da się zdjąć klikiem; po spadku populacji nielegalne pola schodzą pierwsze.
- Akcja dyplomatyczna „6": wszystkie 4 kombinacje Sprzedaż/Kupno × Gotówka/Technologia — sprawdzić że nie da się dostać technologii bez zapłaty ani kupić jej od władcy, który jej nie ma.
- Heksy wielowarstwowe: panel/ranking/render pokazują tę samą liczbę co silnik.
- Znak minus i przecinek: „−2,1%" wszędzie, także wiersz „Łącznie" karty WZROST%.

### Następny krok (pełna lista, bez limitu)
- `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1=B` — wdrożenie odłożonej decyzji.
- `P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY` — ta sama usterka separatorów w karcie żywności.
- `P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI`, `P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE`, `P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY`, `P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA` — noty Evaluatorów, niepilne.
- Dług testowy nierozbrojony: `unit-power-test` (4 pass/2 fail, dziedziczony z FALA 262+), pozostałe znane czerwone z listy w `CLAUDE.md`.
- Rozważyć promocję KANON — wyłącznie sesja lokalna, po teście Master.

---

## 8. Kotwice plików

- `dyspozycje/PYTANIA-OTWARTE.md` — pełny, szczegółowy zapis każdej rundy Operator→Evaluator tej sesji (dużo bardziej szczegółowy niż ten handoff).
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — skrócone lustro tego samego.
- `docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md` · `docs/decyzje/R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.md` — kanon decyzji ABC.
- `.claude/skills/civ-autobot/SKILL.md` §4-5 — nowe reguły procesowe z tej sesji.
- `gra/src/game/okolica.ts`, `gra/src/game/turn-economy.ts`, `gra/src/ui/cityPanel.ts` — silnik/UI robotników na polach.
- `gra/src/main.ts` (`buildProposalFromPayload`, `executeTechTradeDeal`), `gra/src/game/diplomacy-tech-trade.ts` — silnik handlu technologiami.
