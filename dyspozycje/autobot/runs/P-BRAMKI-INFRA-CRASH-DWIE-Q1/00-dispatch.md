# P-BRAMKI-INFRA-CRASH-DWIE-Q1 — dispatch (dwie bramki wywalają się przed pierwszą asercją)

TEMAT: `P-BRAMKI-INFRA-CRASH-DWIE-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: INFRA
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ

Nie jest to zgłoszenie właściciela, tylko **znalezisko procesowe zarejestrowane
w `REJESTR-PROSB-I-ZADAN.md`** jako `P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1`
(2026-09-04, zweryfikowane niezależnie przez Operatora i Evaluatora tematu walki jako
czerwone identycznie na czystej bazie `287718c2` — defekt sprzed tematu, nie regres).
Ten dispatch rozszerza tamten zakres o drugą bramkę z tą samą klasą awarii.

**Dlaczego to jest pilne, a nie kosmetyczne:** obie bramki są wymieniane w kryteriach
końca tematów (walka polowa / karty encji), a **nie wykonują ani jednej asercji**.
Generują więc fałszywe `PASS-WITH-NOTES` przy każdym takim temacie: agent widzi czerwień,
sprawdza parytet na czystej bazie, stwierdza „czerwone było przed tematem" i przechodzi
dalej — a bramka przez cały ten czas **nie chroni niczego**.

## RECON (zmierzony przez orkiestratora 2026-09-05; POTWIERDŹ własnym uruchomieniem)

Obie bramki wywalają się **przed pierwszą asercją**, czyli nie jest to sprawa progów
ani oczekiwanych wartości — to awaria środowiska uruchomieniowego bundla.

**Bramka 1 — `gra/tools/map-field-battle-test.cjs`, exit 1:**
```
TypeError: import_meta.glob is not a function
    at Object.<anonymous> (gra/tools/.map-field-battle-bundle.cjs:5244:33)
    at Object.<anonymous> (gra/tools/map-field-battle-test.cjs:41:5)
```
`import.meta.glob` to funkcja **Vite**, nie Node ani esbuild. Bundle jest budowany
esbuildem, który zostawia wywołanie nietknięte, a w Node ono nie istnieje. Prawie na pewno
wciąga to moduł audio (`import.meta.glob` jest typowym wzorcem ładowania plików dźwiękowych).
**ZNAJDŹ SAM**, który moduł to wnosi — nie zgaduj, pokaż ścieżkę i linię w źródle TS.

**Bramka 2 — `gra/tools/entity-card-contract-test.cjs`, exit 1:**
```
ReferenceError: requestAnimationFrame is not defined
    at drainQueue (.entity-card-contract-bundle.cjs:53418:3)
    at mountUnitMiniPreview (.entity-card-contract-bundle.cjs:53439:3)
    at Object.mount (.entity-card-contract-bundle.cjs:53463:30)
    at renderEntityCard (.entity-card-contract-bundle.cjs:53715:20)
    at main (gra/tools/entity-card-contract-test.cjs:153:16)
```
Podgląd 3D jednostki (`mountUnitMiniPreview`) wchodzi na `requestAnimationFrame`, którego
w gołym Node nie ma. Bramka jest w środowisku bez DOM-owego API animacji.

**Wspólny mianownik:** oba to braki w warstwie zgodności środowiska bramki, nie defekty
w logice gry. Naprawa NIE MOŻE zmieniać zachowania gry w przeglądarce.

## GOAL

Obie bramki **uruchamiają się do końca i wykonują swoje asercje**. Nie chodzi o to, żeby
były zielone za wszelką cenę — chodzi o to, żeby w ogóle mierzyły.

1. `node gra/tools/map-field-battle-test.cjs` — dobiega do końca, wypisuje wynik asercji.
2. `node gra/tools/entity-card-contract-test.cjs` — jak wyżej.
3. Jeśli po usunięciu awarii którakolwiek bramka pokaże **realne czerwone asercje**, to jest
   **osobne znalezisko do zgłoszenia w raporcie**, a nie powód do majstrowania przy
   asercjach. **Zakaz osłabiania lub usuwania asercji, żeby bramka zzieleniała** — to jest
   dokładnie ta patologia, przed którą bramki mają chronić. Zgłoś liczbę i treść faili.

## ROZSTRZYGNIĘCIA — WIĄŻĄCE

- **Zakaz zmiany kodu gry pod bramkę.** Naprawa ma leżeć w warstwie bramki/bundla
  (shim, stub, konfiguracja esbuilda, podmiana modułu), a nie w `gra/src/**` — chyba że
  wykażesz dowodem, że inaczej się nie da, i wtedy zatrzymujesz się z `DECISION_REQUIRED`.
- **Zakaz `npm run build`/`dev`** — C-001, brzmienie niżej.
- Nie ruszasz asercji merytorycznych żadnej z bramek.

## KRYTERIA KOŃCA (binarne)

1. Obie bramki dobiegają do końca (nie `TypeError`/`ReferenceError` przed asercjami).
2. W raporcie podana **liczba pass/fail każdej z nich po naprawie** — jawnie, także gdy
   są faile.
3. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
4. Pięć bramek referencyjnych bez regresu: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
5. **Dowód, że shim nie maskuje:** pokaż, że po celowym zepsuciu jednej rzeczy, którą
   bramka ma mierzyć, bramka **czerwienieje** — czyli że naprawiłeś uruchamianie,
   a nie wyciszyłeś pomiar.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — zzielenienie przez wyciszenie.** Najprostsza „naprawa" obu tych bramek
to `try/catch` wokół feralnego wywołania albo pusty stub, po którym bramka kończy się
zielona, bo nic nie sprawdziła. To jest gorsze niż stan obecny: dziś czerwień przynajmniej
widać. Po naprawie bramka MUSI wykonać swoje asercje — udowodnij to liczbą asercji
w wyniku, nie zapewnieniem.

**Tryb drugi — naprawa jednej i uznanie tematu za zamknięty.** Bramki są dwie, obie mają
być uruchamialne. Podaj wynik OSOBNO dla każdej.

**Tryb trzeci — cichy skok w `gra/src/**`.** Jeśli sięgasz do kodu gry, to musi być jawnie
uzasadnione w raporcie, z dowodem że warstwa bramki nie wystarczy.

## ALLOWLISTA

- `gra/tools/map-field-battle-test.cjs`
- `gra/tools/entity-card-contract-test.cjs`
- `gra/tools/` — pliki pomocnicze shimów, JEŚLI je tworzysz (podaj ścieżki w raporcie)
- `dyspozycje/autobot/runs/P-BRAMKI-INFRA-CRASH-DWIE-Q1/**`

Pliki `.map-field-battle-bundle.cjs` i `.entity-card-contract-bundle.cjs` są **generowane** —
nie edytuj ich ręcznie, zmieniaj to, co je produkuje.

Zakazane bezwzględnie: `gra/src/**` (bez `DECISION_REQUIRED`), `gra/data/**`,
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/main.ts`, `gra/src/ui/cityCaptureNotice.ts`,
`gra/src/ui/sidePanelHud.ts`, `gra/src/game/capital-capture.ts` (trzyma je
`R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, §2b), `gra/src/game/economy.ts`, `gra/data/buildings.json`,
`gra/data/society-params.json`, `gra/src/game/society-breakdown.ts` (czekają na decyzję
właściciela w węźle B audytu szczęścia).
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-bramki-infra-crash`, gałąź `autobot/P-BRAMKI-INFRA-CRASH-DWIE-Q1`,
baza jawnie `origin/main` na SHA podanym przy zakładaniu — potwierdź `git log -1` PRZED pracą.

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build
--outDir dist --emptyOutDir`". Jedyna dozwolona kompilacja: `node
./node_modules/typescript/bin/tsc --noEmit`; bramki `node gra/tools/*-test.cjs` nie są
zakazem objęte. `--outDir` musi wskazywać katalog POZA drzewem repo.

**Jeśli tworzysz katalog tymczasowy, użyj UNIKALNEGO sufiksu (PID albo losowy).** Stała
nazwa w `os.tmpdir()` powoduje kolizje między równoległymi przebiegami i fałszywe wyniki
w obie strony — znany, dwukrotnie potwierdzony defekt
(`P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`).

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz do origin. Przy decyzji produktowej
zatrzymujesz się ze statusem `DECISION_REQUIRED`. Raport maksymalnie ok. 400 słów.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — wyłącznie ręką orkiestratora.
