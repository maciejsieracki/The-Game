# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — dispatch

TEMAT: `P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1`
RUNDA: 1/5 · DATA: 2026-09-05 · DOMAIN: INFRA · ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ

Final Control tematu `R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1` (2026-09-03)
znalazł dwie bramki dyplomacji czerwone **niezależnie od diffu tamtej rundy** — potwierdził
to samodzielnie przez `git stash -u` do stanu sprzed zmian i ponowne uruchomienie:
identyczny wynik z diffem i bez.

1. **`gra/tools/diplomacy-audience-close-flush-test.cjs`: 36 pass / 1 fail.**
   Failing: `[A4] main.ts ma DOKLADNIE 2 gole wywolania hideDiplomacyAudience() poza
   importem (wrapper + onBack) -- got 3.`
   **To jest regres względem wcześniejszych zapisów w `PYTANIA-OTWARTE.md`, gdzie bramka
   figuruje jako 37/0** — ale ZASTANY na `origin/main`, nie wprowadzony przez tamten temat.
2. **`gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`: self-check
   PRZERWANY** — `PRZERWANE: nie udało się odtworzyć stanu sprzed zmiany — kod się przesunął`
   po (0)/(0b) PASS. Ten sam wynik na czystym `origin/main`.

## GOAL

Obie bramki zielone i **mierzące to, co miały mierzyć** — nie zielone przez rozluźnienie.

Dwa bardzo różne przypadki, potraktuj je osobno:

**Bramka 1** pilnuje liczby gołych wywołań `hideDiplomacyAudience()` w `main.ts`. Pojawiło
się trzecie. **Najpierw ustal, czy to trzecie wywołanie jest POTRZEBNE.** Dwie drogi:
(a) jeśli jest zbędne albo duplikuje istniejącą ścieżkę — usuń je i zostaw asercję na 2;
(b) jeśli jest potrzebne (realna ścieżka zamknięcia, której wcześniej nie było) — podnieś
próg do 3 **wraz z komentarzem nazywającym trzecią ścieżkę** i asercją, że każda z trzech
jest osiągalna. **Wybór (a) vs (b) uzasadnij dowodem z kodu, nie preferencją.**
Jeśli z kodu nie da się rozstrzygnąć — `DECISION_REQUIRED`.

**Bramka 2** ma self-check porównujący kod z zapamiętanym kształtem sprzed zmiany; kod
się przesunął i self-check nie umie się zakotwiczyć. **Napraw kotwiczenie, nie usuwaj
self-checku** — on jest jedynym powodem, dla którego ta bramka cokolwiek znaczy. Zakotwicz
na czymś odpornym na przesunięcia (nazwa funkcji, unikalny fragment, struktura AST) zamiast
na numerze linii albo dosłownym bloku.

## KRYTERIA KOŃCA (binarne)

1. `node gra/tools/diplomacy-audience-close-flush-test.cjs` — 37/0 (albo 38/0, jeśli
   wybierzesz (b) i dołożysz asercję osiągalności trzeciej ścieżki). Liczba asercji **nie może spaść**.
2. `node gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` — self-check
   przechodzi do końca, zero `PRZERWANE`.
3. **Dowód, że self-check nadal działa:** zmutuj kod, który on pilnuje, i pokaż, że bramka
   czerwienieje (nie: przerywa). Cofnij mutację przez kopię pliku, `git diff --quiet`.
4. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
5. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
6. Cała rodzina dyplomacji zielona — wyznacz ją grepem po `gra/tools/` (`diplo`, `dyplo`),
   wypisz listę i wynik każdej. Każda inna czerwona bramka w tej rodzinie = BLOKADA
   do zgłoszenia, nie przypis.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — ZIELONO PRZEZ ROZLUŹNIENIE.** Obie bramki najłatwiej zzielenić, kasując
asercję `[A4]` i wyrzucając self-check. To jest dokładnie odwrotność celu: te bramki
istnieją, bo ktoś kiedyś naprawiał ten sam błąd trzy razy.

**Tryb drugi — PODNIESIENIE PROGU BEZ ZROZUMIENIA.** Zmiana `2` na `3` zajmuje sekundę
i zawsze działa. Kryterium wymaga, żebyś **nazwał trzecią ścieżkę** i udowodnił, że jest
osiągalna — inaczej za miesiąc będzie czwarta i nikt nie zauważy.

**Tryb trzeci — SELF-CHECK ZAKOTWICZONY NA NUMERZE LINII.** Naprawa, która działa dziś
i pęknie przy następnym przesunięciu kodu, nie jest naprawą. Zakotwicz semantycznie.

## ALLOWLISTA

- `gra/tools/diplomacy-audience-close-flush-test.cjs`
- `gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`
- `gra/src/main.ts` — **wyłącznie** usunięcie zbędnego wywołania `hideDiplomacyAudience()`,
  jeśli wybierzesz drogę (a). Nic więcej w tym pliku. Jeśli naprawa wymaga czegoś więcej
  niż jednej linii — `DECISION_REQUIRED`.
- `gra/src/ui/diplomacyAudience.ts`
- `dyspozycje/autobot/runs/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1/` (raporty etapów)

Zakazane bezwzględnie: pozostałe pliki `gra/src/**`, `gra/data/**`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-dyplo-testy`, gałąź `autobot/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat: ścieżki + SHA zamiast diffu, wynik bramki
zamiast logu.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

## C-001 (bariera CHRONIONA)

Brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON) —
dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Jedyna dozwolona kompilacja to `node ./node_modules/typescript/bin/tsc --noEmit`; bramki
`node gra/tools/*-test.cjs` nie są nim objęte. `--outDir` musi wskazywać katalog POZA
drzewem repo i z UNIKALNYM sufiksem (PID albo losowy) — stała nazwa w `os.tmpdir()` dała
już w tym repo dwa fałszywe wyniki bramek.

## GUARD IZOLACJI (§2b, obowiązkowy przed pracą)

`git -C <worktree> log -1 --oneline` i `git -C <worktree> status --short`. Oczekiwana baza
i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu do drzewa. Mutacje weryfikacyjne cofaj
przez KOPIĘ pliku, nigdy przez `git checkout`.

---

## RATYFIKACJA ORKIESTRATORA — runda 2 (2026-09-06, po Final Control `FAIL`)

Final Control ma rację w obu pozycjach i obie są tej samej klasy: **asercja opisuje
zapis, a nie zachowanie**. Bramka przechodzi, bo kod wygląda tak, jak się spodziewała,
a nie dlatego, że robi to, co ma robić.

### R2-U1 — `[A4]` liczy regexem wymagającym średnika

`/hideDiplomacyAudience\(\);/g` **nie widzi** wywołania bez średnika. Mutacja F4 Final
Control dowiodła tego wprost: nowa funkcja w `main.ts` z `closeAudienceNow: () =>
hideDiplomacyAudience(),` **omija wrapper** i bramka zostaje zielona. To jest dokładnie
ten scenariusz, przed którym `[A4]` ma chronić — trzecia ścieżka zamknięcia dopięta obok.

**Napraw tak, żeby liczyła wywołania, nie znaki.** Przecinek, brak terminatora, wywołanie
w wyrażeniu strzałkowym, w obiekcie, w argumencie — każde ma być policzone.
**Dowód obowiązkowy:** powtórz mutację F4 i pokaż, że bramka teraz czerwienieje.

### R2-U2 — `[A4c]` wymaga tego samego wiersza fizycznego

Uznaje wywołanie za „w haku" tylko wtedy, gdy `closeAudience:` stoi w tej samej linii.
Mutacja F2 (**czysto kosmetyczne** rozbicie haka na pięć linii, semantyka bit w bit ta sama)
daje **43/2**. Czyli sformatowanie kodu przez kogokolwiek czerwieni bramkę bez żadnej
zmiany zachowania — to jest fałszywy alarm, który z czasem nauczy wszystkich ją ignorować.

**Zakotwicz semantycznie**, nie na układzie wierszy. **Dowód obowiązkowy:** powtórz
mutację F2 i pokaż, że bramka zostaje zielona, a potem realną mutację (usunięcie wywołania
z haka) i pokaż, że czerwienieje.

### Zakres — wąski, nic poza nim

Wyłącznie `gra/tools/diplomacy-audience-close-flush-test.cjs`.
`dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` **nietknięty** — Final Control
uznał go za domknięty. `gra/src/main.ts` **nietknięty** — to jest naprawa asercji, nie kodu.

### KRYTERIA KOŃCA rundy 2

1. Bramka zielona, liczba asercji **nie mniejsza** niż po rundzie 1.
2. Mutacja F4 (wywołanie bez średnika, omijające wrapper) → **czerwona**, podaj liczbę faili.
3. Mutacja F2 (rozbicie haka na pięć linii, bez zmiany semantyki) → **zielona**.
4. Mutacja realna (usunięcie wywołania z haka) → **czerwona**.
5. `git diff` wobec rundy 1 dotyka **wyłącznie** tego jednego pliku.
6. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych; rodzina dyplomacji zielona.

Mutacje cofaj przez KOPIĘ pliku, `git diff --quiet` po każdej.
