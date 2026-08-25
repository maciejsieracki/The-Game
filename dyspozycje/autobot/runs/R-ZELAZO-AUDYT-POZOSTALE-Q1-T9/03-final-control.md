# 03 — FINAL CONTROL

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T9`
GOAL: Audyt Miecznika galijskiego i Rydwanu celtyckiego; rozstrzygnięcie kwestii
współdzielonej bryły rydwanu (świadomy wzorzec vs. luka). Zgodny z `00-dispatch.md`
i z `GOAL` w raportach Operatora/Evaluatora — bez rozjazdu.
MODEL/EFFORT: Sonnet 5, effort High (Final Control, §5a).

## Weryfikacja niezależna — własny worktree, własny harness

Osobny worktree (`/home/user/wt-finalcontrol-T9`), zero odczytu z raportów jako
dowodu. Wszystko uruchomione samodzielnie:

- `tsc --noEmit`: 0 błędów (na gałęzi T9 i po próbnym merge z dzisiejszym `main`).
- 5 bramek referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6 — zgodne. `unit-power-test`
  4/2 zweryfikowany jako pre-istniejący, niezmieniony.
- `vite build` binarką z `node_modules` do `/tmp` (C-001): czysty, i na gałęzi T9,
  i po merge.
- Test tematu (`zelazo-celtowie-miecznik-rydwan-real-render-test.cjs`): **82/0**
  (izolowany) / 79/0 (`--skip-vite`, po merge). Macierz ablacyjna M1–M21
  odczytana wprost z wyjścia: KAŻDA z H1–H21 czerwienieje pod swoją jedną
  mutacją, baza w całości zielona — nietautologiczność potwierdzona, nie
  przyjęta na słowo.
- Zero regresji zmierzone: germanie 77/0, soldurii-gaesatae 40/0, falanga 38/0,
  śródziemnomorze 81/0, super-rzym-grecja 89/0, mezopotamia 70/0, konnica-asyryjska
  29/0, jeździec-oszczepami 55/0, `zelazo-gate-test` 24/24 — wszystkie zgodne z
  raportem Evaluatora, uruchomione przeze mnie, nie przepisane.
- **Kwestia rydwanu, sprawdzona u źródła**: `buildCategoryModel('rydwan')` tworzy
  `mats: THREE.Material[]` lokalnie wewnątrz `case 'rydwan':` (linia 3883), a
  `makeMatFactory` (linia 715) robi `new THREE.MeshStandardMaterial` przy KAŻDYM
  wywołaniu `mat()`. `retint()` w `decorateChariot()` iteruje wyłącznie po tej
  lokalnej tablicy — nie ma globalnej puli materiałów do wycieku. Potwierdzone
  czytaniem kodu, nie tylko testem H20 (który też przechodzi). Zero regresji dla
  mykeńskiego/Shang potwierdzone niezależnie.
- Kolizja barw `retint()` (uwaga Evaluatora #3): sprawdzone `OWNER_COLORS` i
  `kolorHex` w `civs.json` — żaden nie równa się `COLOR_BRONZE`(0xcf9234),
  `COLOR_LACQUER`(0xa8252a) ani `COLOR_RED_VIV`(0xc0392b). Brak kolizji dziś,
  potwierdzone.
- Allowlista: diff `88e2181f..123a299f` ograniczony do `buildMiecznikGalijski()`
  (hunki w liniach 1270–1528, wszystkie wewnątrz funkcji lub komentarza przed
  nią), `decorateChariot()` + 2 linie dispatchu PL/EN w `units.ts`, oraz
  `gra/tools/*`. Zero linii w Berserker/Wojownik germański/Drużynnik/iButho.
  `git diff --check` czysty, brak sekretów (wzorce kluczy/tokenów sprawdzone,
  0 trafień).

## Próbny merge z `origin/main` (ab3ece6e) — INTEGRATION_PENDING rozstrzygnięte

Odtworzone niezależnie w osobnym worktree: jedyny konflikt to
`zelazo-germanie-real-render-test.cjs` (T9 i T10 rozwiązały ten sam wpis `galij`
różnym mechanizmem). Rozwiązane wg propozycji Evaluatora — zachowany mechanizm
T10 (`own`), wiersz `galij` dostał `own: 'mg-', mesh: 44, maxY: 0.7410`. Po
scaleniu: `tsc` 0, wszystkie bramki referencyjne zielone, germanie 77/0, T9 79/0,
T10 (`zelazo-slowianie-zulusi`) **73/0**, T11 (`zelazo-katapulta`) **19/0**,
`zelazo-gate-test` 24/24, `vite build` czysty. Ten trial-merge NIE jest
scommitowany do żadnej gałęzi wysyłanej dalej — to tylko dowód wykonalności dla
orkiestratora; sam merge do `main` wykonuje orkiestrator.

## Checklista §16b

1. `00-dispatch.md` istnieje, `GOAL` niezmieniony. 2. ID identyczne we
wszystkich rundach. 3. Werdykt Evaluatora oparty na artefaktach — każda liczba
z jego raportu odtworzona tu niezależnie i się zgadza. 4. Sześć uwag
Evaluatora: żadna nie dotyka `GOAL`, dowodu, zakresu ani granic §9 — luka
bryły rydwanu jest jawnie udokumentowana (nie ukryta), naprawa cząstkowa jest
granicą allowlisty, nie niedbalstwem. Uwaga #4 (stary nagłówek helperów) jest
POZA allowlistą T9 z własnej klasyfikacji Evaluatora — świadomie NIE naprawiam
tego jako micro-fix, żeby nie rozszerzać zakresu w biegu (§14); zostaje jako
zadanie na następne dotknięcie pliku, tak jak zarekomendowano. Nie znalazłem
żadnego innego nieprecyzyjnego zdania w komentarzach wewnątrz allowlisty
wymagającego poprawki — stąd zero micro-fixów w tym raporcie. 5. Licznik rund
1/5, brak cichego resetu. 6. `REJESTR-PROSB-I-ZADAN.md` nadal mówi „T9 w
kolejce" — poprawne na dziś (T9 nie jest jeszcze zintegrowany); wpis wymaga
aktualizacji PRZY integracji, tak jak przy T8 (`88e2181f`). 7. Temat
niedzielony na węzły. 8. Gotowość do integracji: **TAK**.

## Do wykonania przez orkiestratora przy integracji (nie blokuje PASS)

1. Scalić `autobot/ZELAZO-AUDYT-T9-Q1` do `main` z rozstrzygnięciem konfliktu
   `zelazo-germanie-real-render-test.cjs` jak wyżej (zweryfikowane wykonalne).
2. Zarejestrować w `REJESTR-PROSB-I-ZADAN.md` pięć zgłoszeń Operatora
   (bespoke bryła rydwanu celtyckiego; audyt rydwanu mykeńskiego/Shang; rozjazd
   `units.json` „oszczepy" vs `Atak dystansowy 0`; nazwa `getGeoOvalShield()`;
   kontrola barwy tuniki woźnicy dla gracza niebieskiego) — jak przy T8.
3. Zaktualizować status T9 w rejestrze na zintegrowany.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (merge `--no-ff`, rozstrzygnięcie
konfliktu jak wyżej, aktualizacja rejestru), następnie `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO.
