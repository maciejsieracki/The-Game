# 02-operator-r2 — P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1

STATUS: PASS
TEMAT: P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1
GOAL: pole `tech.Uwagi` (notatki deweloperskie, np. „ABC-7: Popalnia brązu na mapie") NIE ma
przeciekać do gracza w `cityPanel.ts::appendTechDetailBlock()` — I legalna, gracz-facing
część notatki MUSI zostać pokazana, gdy współistnieje z adnotacją dev w tej samej notatce.

## Znalezisko Evaluatora (regres rundy 1)

Runda 1 dodała `/\bABC-\d+\b/i.test(t)` do `isDevOnlyPlayerText()` — funkcji odrzucającej
CAŁĄ notatkę (zwrot `null` z `playerFacingNote()`). Dla `tech.json` Brązownictwo,
`Uwagi = "kończy Epokę 1; ABC-7: Popalnia brązu na mapie"`, to spowodowało, że CAŁA notatka
znikała graczowi w `appendTechDetailBlock()`, w tym legalna część „kończy Epokę 1", nie
tylko dev-adnotacja „ABC-7: ...". Zweryfikowane bezpośrednio: przed naprawą
`playerFacingNote("kończy Epokę 1; ABC-7: Popalnia brązu na mapie") === null` zamiast
oczekiwanego `"kończy Epokę 1"`.

## Naprawa

`gra/src/ui/cityPanel.ts`:

1. Usunięto wzorzec `/\bABC-\d+\b/i` z `isDevOnlyPlayerText()` (funkcja odrzucająca CAŁĄ
   notatkę) — ta funkcja teraz znów rozpoznaje wyłącznie notatki, które w CAŁOŚCI są
   wewnętrzne: `^PYTANIE\s+\d+`, `^DECYZJA\b`, `^DEC-\d{8}`, „patrz unit-building-bonuses"
   (bez zmian względem stanu sprzed rundy 1 dla tych czterech wzorców).
2. Dodano do `stripInlineDevAnnotations()` (funkcja WYCINAJĄCA TYLKO adnotację, zachowującą
   otaczający legalny tekst — już zawierała analogiczną obsługę dla
   `PYTANIE ...=.../(Maciej daty)`) nowy wzorzec:
   `/[\s;,.]*\bABC-\d+(?:\s?[A-Za-z])?\s*:\s*[^.]*\.?/gi`
   — dopasowuje „ABC-<numer>[litera]?:" WRAZ z otaczającą interpunkcją (np. poprzedzający
   „; ") i treścią adnotacji AŻ DO końca zdania (`.`) lub końca stringa, wycina to, zostawia
   resztę notatki nietkniętą.
3. Efekt: `playerFacingNote("kończy Epokę 1; ABC-7: Popalnia brązu na mapie")` zwraca teraz
   `"kończy Epokę 1"` (niepusty string, bez fragmentu „ABC-7"), zamiast `null`. Notatki
   CAŁKOWICIE dev-owe (np. `buildings.json` „ABC-21 B: wchodzi w merge Akademia — nie buduj
   osobno", gdzie po adnotacji nie ma żadnego dalszego zdania) po wycięciu adnotacji dają
   pusty string → `playerFacingNote()` nadal zwraca `null` (zachowane przez
   `return cleaned || null;` w `playerFacingNote()`, bez zmian).
4. `appendTechDetailBlock()` nadal woła dokładnie `playerFacingNote(t.Uwagi)` (bez zmian —
   korzeń przeoczenia z dispatcha pozostaje naprawiony od rundy 1: jeden współdzielony
   filtr, nie osobna kopia).

Zero zmian w `gra/data/tech.json` (treści notatek) i w `techDiscoveryNotice.ts` (świadoma
decyzja „nie renderuj Uwagi wcale" pozostaje nietknięta — zweryfikowano `git status`/diff:
tylko `cityPanel.ts` i test zmienione).

## Test regresyjny

`gra/tools/citypanel-uwagi-abc-filter-test.cjs` rozszerzony:

- Sekcja 2a: regres dokładnego przypadku Brązownictwa — teraz wymaga
  `playerFacingNote(...) !== null`, `=== 'kończy Epokę 1'` i braku fragmentu „ABC-7" w
  wyniku (poprzednio runda 1 błędnie wymagała `=== null`, co samo w sobie było
  potwierdzeniem regresu — poprawione).
- Sekcja 2b: grep po `gra/data/tech.json` klasyfikuje trafienia na (a) wzorce
  CAŁKOWICIE-dev (`^PYTANIE`, `^DECYZJA`, `^DEC-\d{8}`, „patrz unit-building-bonuses") —
  nadal wymagane `=== null`; (b) `ABC-<numer>` współistniejący z legalnym tekstem — wymagane
  `!== null` ORAZ brak `ABC-<numer>` w wyniku. W obecnym `tech.json` jest dokładnie jedno
  trafienie (Brązownictwo/ABC-7), obsłużone przez gałąź (b); test jest przyszłościowo
  odporny na kolejne wpisy w dowolnej z dwóch kategorii.
- Kontrola przytomności (notatki bez wzorca dev nadal przechodzą) — bez zmian, nadal PASS.
- Asercja strukturalna `appendTechDetailBlock()` woła `playerFacingNote(t.Uwagi)` — bez
  zmian.

## TESTY

- `node gra/tools/citypanel-uwagi-abc-filter-test.cjs` → **35 pass, 0 fail** (po naprawie).
- Weryfikacja że test REALNIE łapie regres tej rundy: `git stash push -- src/ui/cityPanel.ts`
  (test plik zostaje zaktualizowany, tylko kod cofnięty do stanu rundy 1) → uruchomienie
  testu → **5 FAIL** (dokładnie asercje 2a/2b dot. Brązownictwa/ABC-7 — pełna lista w logu:
  "NIE są odrzucone w całości", "zwraca dokładnie legalną część", "NIE zawiera fragmentu
  ABC-7", dwukrotnie w sekcji 2b) → `git stash pop` przywraca naprawę → **35 pass, 0 fail**
  ponownie. Test faktycznie wykrywa regres rundy 1.
- `cd gra && npx tsc --noEmit` → czysto poza tym samym pre-istniejącym, niezwiązanym z tym
  tematem ostrzeżeniem `TS5101` (deprecated `baseUrl`) — identyczne jak w rundzie 1.
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir <tmp>
  --emptyOutDir` z `gra/` → **sukces** (837 modułów, ~30s). Worktree bez
  `gra/node_modules` (świeży worktree, `npm install`/`npm run build`/`npm run dev`
  zakazane) — na czas tej jednej weryfikacji utworzono TYMCZASOWY symlink
  `gra/node_modules -> /home/user/The-Game/gra/node_modules` (repo źródłowe, tylko
  odczyt), usunięty natychmiast po weryfikacji (`git status --porcelain` czysty poza
  dwoma zmienionymi plikami allowlisty).
- `git diff --check` → czysto (brak whitespace errors).
- `git status --porcelain` → wyłącznie `gra/src/ui/cityPanel.ts` i
  `gra/tools/citypanel-uwagi-abc-filter-test.cjs` zmienione; `gra/data/tech.json` i
  `gra/src/ui/techDiscoveryNotice.ts` nietknięte.

## ZMIANY/COMMIT

- `gra/src/ui/cityPanel.ts` — przeniesiono rozpoznawanie `ABC-<numer>:` z
  `isDevOnlyPlayerText()` do `stripInlineDevAnnotations()`.
- `gra/tools/citypanel-uwagi-abc-filter-test.cjs` — rozszerzony o asercje na przypadek
  mieszany (legalny tekst + ABC-<numer> w tej samej notatce) i klasyfikację
  całkowicie-dev vs. mieszane.
- Branch: `autobot/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (lokalnie, bez mergeu do main).
- Commit SHA: patrz `git log -1` po commicie tego raportu (commitowane razem z kodem).

## BLOKADY

Brak.

## NASTĘPNY KROK

Przekazać do Evaluatora (GPT-5.6 Luna High) wg obiegu z CLAUDE.md/README.md.

DEPLOY/PUSH: NIE WYKONANO
