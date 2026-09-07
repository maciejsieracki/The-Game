# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — dispatch

TEMAT: `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: INFRA
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ — dwa POTWIERDZONE przypadki, każdy z innym znakiem błędu

**Przypadek 1 (2026-09-04, Evaluator CivPedia runda 2) — fałszywy ZIELONY.**
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` buduje do współdzielonego
`os.tmpdir()/civ-zbadano-karta-tech-dist`. Evaluator mierzył parytet baza-vs-HEAD, dwa
przebiegi zmieszały ten sam `dist` i musiał powtarzać pomiary sekwencyjnie.
**Fałszywy parytet wygląda jak dowód, że nic się nie zepsuło.**

**Przypadek 2 (2026-09-05, potknął się o niego orkiestrator) — fałszywy CZERWONY.**
`gra/tools/ai-buduje-budynki-test.cjs:81` — `TMP_ROOT = os.tmpdir()/civ-ai-buduje-budynki`,
`runVariantBuild` (`:189`, `:219`) buduje do `TMP_ROOT/dist-<wariant>` z `--emptyOutDir`.
Dwa równoległe przebiegi → `exit=1`. Jeden wyczyścił `dist` drugiemu w locie. Po ubiciu
obu i przebiegu pojedynczym: `42 PASS / 0 FAIL`.

**Obie strony monety kosztują tak samo:** jedna przepuszcza regres, druga każe naprawiać
sprawną pracę. Przy pięciu równoległych falach AutoBota ryzyko rośnie liniowo z liczbą fal.

## RECON (policzony przez orkiestratora; POTWIERDŹ własnym odczytem)

`grep -rl "os.tmpdir()" gra/tools/*.cjs | wc -l` → **54 pliki**. To jest górna granica
puli do audytu, NIE liczba defektów — część z nich używa `os.tmpdir()` poprawnie
(np. przez `fs.mkdtempSync`, które z definicji daje unikalną nazwę).

**Wzorzec defektu, którego szukasz:** stała, przewidywalna nazwa katalogu pod `os.tmpdir()`,
do której pisze więcej niż jeden przebieg — szczególnie w połączeniu z `--emptyOutDir`,
`rmSync(..., {recursive:true})` albo `emptyOutDir: true` w konfiguracji esbuild/vite.

**Wzorzec BEZPIECZNY, którego NIE ruszaj:** `fs.mkdtempSync(path.join(os.tmpdir(), 'prefix-'))`
— to już jest unikalne per przebieg.

## GOAL

Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej chwili
biegnie inny przebieg — jej albo czyjkolwiek.

Trzy rzeczy, wszystkie wymagane:

1. **Audyt wszystkich 54 plików** — dla każdego jednoznaczna klasyfikacja: BEZPIECZNY
   (z podaniem dlaczego) albo DEFEKT (z podaniem linii). Tabela w raporcie, bez pominięć.
2. **Naprawa każdego znalezionego defektu** — katalog docelowy unikalny per przebieg.
   Wzorzec do zastosowania: `fs.mkdtempSync(path.join(os.tmpdir(), '<nazwa>-'))` albo
   sufiks z `process.pid` + licznikiem losowym. **Sprzątanie po sobie zostaje** — jeśli
   bramka dziś usuwa swój katalog na końcu, ma go dalej usuwać (inaczej zaśmiecimy dysk,
   a `INFRA` z braku miejsca to ta sama klasa problemu z drugiej strony).
3. **Nowa bramka `gra/tools/bramki-tmpdir-unikalnosc-test.cjs`** — skanuje `gra/tools/*.cjs`
   i czerwienieje, gdy którykolwiek plik ma wzorzec stałej nazwy pod `os.tmpdir()`.
   To jest zabezpieczenie przed nawrotem: bez niego 55. bramka napisana za miesiąc
   powtórzy ten sam błąd.

## KRYTERIA KOŃCA (binarne)

1. Raport zawiera tabelę **wszystkich 54 plików** z klasyfikacją. Liczba wierszy = liczba
   plików zwróconych przez `grep -rl "os.tmpdir()" gra/tools/*.cjs`, policzona przez Ciebie.
2. `gra/tools/ai-buduje-budynki-test.cjs` i
   `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs` mają katalog unikalny
   per przebieg — te dwa są potwierdzone, muszą być naprawione niezależnie od audytu.
3. **DOWÓD REPRODUKCJI, nie deklaracja:** uruchom `ai-buduje-budynki-test.cjs` DWA RAZY
   RÓWNOLEGLE na kodzie PRZED naprawą i pokaż wynik (ma być czerwony albo rozjechany),
   a potem DWA RAZY RÓWNOLEGLE po naprawie (oba mają być zielone i identyczne).
   Bez tego przebiegu temat jest niedomknięty — to jest sedno całego zgłoszenia.
4. Nowa bramka `bramki-tmpdir-unikalnosc-test.cjs` zielona, a po wstawieniu do dowolnego
   pliku sztucznej stałej ścieżki — **czerwona** (pokaż obie liczby, cofnij mutację).
5. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
6. Pięć bramek referencyjnych zielonych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
7. Każda naprawiona bramka uruchomiona POJEDYNCZO i zielona — naprawa nie może zepsuć
   tego, co bramka mierzy. Podaj wynik per plik.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — AUDYT NA DEKLARACJĘ.** Nie wolno napisać „sprawdziłem wszystkie, reszta
jest bezpieczna". Każdy z 54 plików ma mieć w tabeli własny wiersz z powodem klasyfikacji.
Plik pominięty w tabeli liczy się jak plik niesprawdzony.

**Tryb drugi — NAPRAWA BEZ REPRODUKCJI.** Zmiana nazwy katalogu na losową „wygląda"
poprawnie i przechodzi każdy pojedynczy przebieg — dlatego kryterium 3 wymaga
DWÓCH RÓWNOLEGŁYCH przebiegów przed i po. To jedyny dowód, który cokolwiek znaczy.

**Tryb trzeci — CICHE ZŁAMANIE SPRZĄTANIA.** Łatwo naprawić kolizję, zostawiając
katalogi na dysku na zawsze. Sprawdź i podaj w raporcie, czy po przebiegu naprawionej
bramki katalog znika.

## ALLOWLISTA

- `gra/tools/**/*.cjs` — wyłącznie w zakresie ścieżki katalogu tymczasowego i sprzątania.
  **Zakaz zmiany asercji, progów i logiki pomiarowej którejkolwiek bramki.**
- `gra/tools/bramki-tmpdir-unikalnosc-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/**` (to temat INFRA, kod gry się nie zmienia),
`gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .` — dodawaj po jawnych ścieżkach.

**Uwaga na kolizję (§2b):** równolegle biegną inne tematy, które też uruchamiają bramki
w `gra/tools/`. NIE ruszaj plików `szczescie-*`, `citizen-resource-upkeep-*`,
`r-wzrost-szczescie-*`, `society-breakdown-*`, `wealth-*`, `war-happiness-*`,
`building-happiness-*`, `logic-test.cjs` — trzyma je `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`.
Jeśli któryś z nich ma defekt tmpdir — **zgłoś go w tabeli i zostaw do osobnej rundy**.

## IZOLACJA

Worktree `/home/user/wt-bramka-tmpdir`, gałąź `autobot/P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1`,
baza `fe57a068`. PRZED pracą: `git -C /home/user/wt-bramka-tmpdir log -1 --oneline` musi
pokazać `fe57a068`, a `git status --short` czyste drzewo. Inaczej — `BLOCK`, nie pisz.

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node gra/tools/*-test.cjs`
nie są nim objęte. `--outDir` musi wskazywać katalog POZA drzewem repo i — co jest
dokładnie tematem tej pracy — z UNIKALNYM sufiksem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Przy decyzji produktowej zatrzymujesz się
ze statusem `DECISION_REQUIRED`. Raport maksymalnie ok. 400 słów PLUS tabela audytu
(tabela nie liczy się do limitu — jest wytworem, nie narracją).

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

## RATYFIKACJA ORKIESTRATORA — runda 2 (2026-09-06, po Final Control `FAIL`)

**Praca rundy 1 jest bardzo dobra i nie wraca do przerobienia.** Audyt objął 62 pliki
(pula szersza niż moje 54 z reconu — policzyłeś sam i miałeś rację), dowód reprodukcji
wykonany wzorowo: PRZED **A=1 B=0** przy dwóch równoległych przebiegach tego samego kodu,
PO **A=0 B=0, 42/42 identyczne**. Dokładnie o to chodziło.

`FAIL` wynika z **dwóch linii w nowej bramce** — nie z naprawy 57 plików.

### R2-FC1 (`NAPRAW`) — warunek tłumi regułę R3 na poziomie całego pliku

`gra/tools/bramki-tmpdir-unikalnosc-test.cjs:191` — `} else if (!fileHasUniqueMark) {`.

Po naprawie **wszystkie 57 plików mają znacznik unikalności**, więc R3 jest w nich
**martwa**. Final Control wstawił z powrotem **dosłownie tę linię, którą Twoja własna tabela
audytu klasyfikuje jako DEFEKT** (`weterani-test.cjs:75`, `path.join(os.tmpdir(), outName)`)
— i bramka została zielona.

To jest najgorszy możliwy stan bramki anty-nawrotowej: chroni przed nawrotem tylko dopóty,
dopóki nawrotu nie ma. Poprawka `} else {` łapie mutację (`[R3] weterani-test.cjs:75 →
exit=1`) i daje **zero fałszywych alarmów** na HEAD oraz na drzewie symulowanej integracji —
zmierzone przez Final Control, potwierdź własnym przebiegiem.

### R2-FC2 (`NAPRAW`) — `` `${os.tmpdir()}/nazwa` `` niewidzialne dla R1–R5

Ta sama rodzina, inny zapis. Dołóż jedną regułą w tej samej rundzie.

### Trzy pozycje, których runda 2 NIE rusza

- **FC-4** (sufiks `-p<pid>` w domyślnych katalogach raportowych) — żaden plik w repo ich
  nie konsumuje. Zostaje.
- **FC-5, FC-6** — obserwacje bez naprawy, poza allowlistą.
- **Zarzut 6** (§11, limit słów) — raporty mają 912/873/1058 słów narracji. §11 sama
  ogranicza konsekwencję do `PASS-WITH-NOTES`, więc **nie jest to powód zwrotu**.
  Rozstrzygam spór o priorytet: **zachowaj ślad, nie przepisuj raportów po ocenie** (§13b).
  Historia rundy jest warta więcej niż zgodność z limitem.
- **Zarzut 7** (bramka niezarejestrowana w §6) — **moje zadanie, nie Twoje.** §9 poz. 4
  zabrania zmiany procesu w allowliście tematu produktowego. Zrobię to osobno.

### KRYTERIA KOŃCA rundy 2

1. `} else {` zamiast `} else if (!fileHasUniqueMark) {`.
2. Reguła na `` `${os.tmpdir()}/nazwa` `` dołożona.
3. **Powtórz mutację FC-M7** (przywróć oryginalny defekt do `weterani-test.cjs:75`) —
   bramka ma **czerwienieć**, podaj liczbę faili. Poprzednio zostawała zielona.
4. **Powtórz mutację FC-M5** (`` `${os.tmpdir()}/nazwa` ``) — ma czerwienieć.
5. **Zero fałszywych alarmów** na czystym HEAD — bramka zielona, podaj wynik.
6. Liczba asercji w bramce **nie mniejsza** niż po rundzie 1.
7. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych.

Mutacje cofaj przez KOPIĘ pliku, `git diff --quiet` po każdej.
