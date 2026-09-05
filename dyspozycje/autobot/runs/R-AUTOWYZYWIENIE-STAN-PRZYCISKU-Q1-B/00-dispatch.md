# R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — dispatch (czytelny stan przycisku)

TEMAT: `R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high. (Temat WIZUALNY — §9 poz. 6b.)

## WYZWALACZ (dosłownie, właściciel, ze zrzutem panelu miasta)

> „Niestety autowyżywienie można tylko kliknąć i nie wiadomo, czy jest włączone, czy nie.
> **Powinno być zaznaczenie przycisku: albo włączone, albo wyłączone.** Inne przyciski:
> po prostu ten przycisk się świeci, gdy jest aktywny, a gdy jest odznaczony, jest nieaktywny."

Kontekst z tej samej wiadomości, pokazujący realny koszt tego defektu:
> „Coś tu jest nie tak z autożywieniem. **Nie, chyba to autowyżywienie nie było włączone,
> ale ciężko mi się odnieść**, bo…"

**To jest sedno sprawy: właściciel nie potrafił zdiagnozować własnej rozgrywki, bo nie
widział stanu przełącznika.** Defekt czytelności zamienił się w defekt diagnozowalności.

## RECON ORKIESTRATORA

Zrzut panelu miasta pokazuje dwa przyciski obok siebie: **„Auto Wyżywienie"** (ciemny)
i **„Indywidualne"** (zielony). Właściciel nie potrafi odczytać, który stan jest aktywny —
zielone podświetlenie równie dobrze czyta się jako „kliknij, żeby przełączyć na Indywidualne",
jak i jako „Indywidualne jest teraz włączone".

**Konwencja reszty gry, podana przez właściciela wprost:** przycisk **świeci, gdy jest
aktywny**; odznaczony jest wygaszony. Naprawa ma **doprowadzić ten przycisk do konwencji
reszty gry**, a nie wymyślić trzecią.

**HISTORIA — to zgłoszenie NIE JEST nowe.** W rejestrze istnieje
`R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK` ze statusem **OTWARTE** — ten sam defekt,
zgłoszony wcześniej i nadal nienaprawiony. Powiązany, wstrzymany:
`P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-PRZYCISK-Q1` (recon zamknięty).
**Sprawdź oba przed pracą** — być może istnieje już częściowa analiza albo ustalona
konwencja, której nie należy podważać.

## GOAL

Stan przełącznika wyżywienia (auto / indywidualne) jest **jednoznacznie czytelny bez
klikania**, w konwencji zgodnej z resztą gry: aktywny wariant świeci, nieaktywny jest wygaszony.

Dotyczy **wszystkich miejsc**, w których ten przełącznik występuje — panel miasta oraz
panel Spichlerza Centralnego. Znajdź je wszystkie; nie zakładaj, że są dwa.

## KRYTERIA KOŃCA (binarne)

1. Inwentaryzacja: wypisz **wszystkie** miejsca w kodzie renderujące ten przełącznik,
   ze ścieżką i linią. Jeśli jest ich więcej niż dwa — napraw wszystkie.
2. Dla każdego miejsca: stan aktywny i nieaktywny różnią się w sposób mierzalny w DOM
   (klasa/atrybut/`aria-pressed`), a nie wyłącznie odcieniem tła.
3. Nowa bramka `gra/tools/autowyzywienie-stan-przycisku-test.cjs` asertuje dla obu stanów
   i obu paneli, że **aktywny wariant jest oznaczony**, a nieaktywny nie — i **czerwienieje
   po cofnięciu zmiany**.
4. **Zrzuty z żywego Chromium: cztery** — panel miasta w trybie auto i w trybie indywidualnym,
   to samo dla Spichlerza. Na zrzutach ma być widać różnicę bez czytania kodu.
5. Zgodność z konwencją: wskaż w raporcie **inny, istniejący** przycisk w grze, którego
   konwencję naśladujesz, ze ścieżką i linią. Nie wymyślaj nowej.
6. `tsc --noEmit` zielone; pięć bramek referencyjnych zielonych (logic 213/213,
   tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6).
7. Bramki panelu miasta i panelu imperium bez regresu — wypisz z nazwy i wynikiem.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Temat WIZUALNY — zakaz uznania za zamknięty bez zrzutów z żywego Chromium** (§9 poz. 6b).
Zrzut ma pokazywać OBA stany, nie jeden; różnica ma być widoczna dla kogoś, kto nie zna kodu.

**Drugi tryb: bramka sprawdzająca istnienie klasy zamiast różnicy.** Test asertujący
„element ma klasę `aktywny`" przechodzi także wtedy, gdy klasa jest na obu przyciskach naraz.
Asertuj **różnicę między stanami**, nie obecność atrybutu.

**Trzeci tryb: naprawa jednego miejsca z dwóch.** Właściciel widzi ten przełącznik
w co najmniej dwóch panelach. Naprawa jednego zostawi go z tym samym problemem gdzie indziej.

## ALLOWLISTA

- pliki UI renderujące przełącznik wyżywienia (ustal inwentaryzacją; typowo
  `gra/src/ui/**` — panel miasta i panel Spichlerza)
- arkusz stylów tych paneli
- `gra/tools/autowyzywienie-stan-przycisku-test.cjs` (NOWY)
- `dyspozycje/autobot/runs/R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B/`

Zakazane bezwzględnie: **`gra/src/game/empire-food.ts`** (to jest węzeł A, dispatchowany
równolegle — wejście tam = naruszenie allowlisty), `gra/src/main.ts`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

**Zakaz zmiany LOGIKI przełączania** — ten temat zmienia wyłącznie to, jak stan jest
POKAZANY. Jeśli przy okazji odkryjesz, że logika jest wadliwa (np. że nie da się ustawić
racji indywidualnych przy włączonym auto), **zgłoś to jako notę do węzła A**, nie naprawiaj tutaj.

## IZOLACJA

Worktree `/home/user/wt-autowyzywienie-b`, gałąź `autobot/R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA), brzmienie dosłowne z `playbook.md`: „Zakaz `npm run build`/`dev`
w `gra/` (export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja:
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` POZA drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Raport maksymalnie ok. 400 słów. **Raport commituj OD RAZU po zapisaniu.**

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

# RATYFIKACJA ORKIESTRATORA — KRYTERIUM 4 UCHYLONE (2026-09-05)

## Uznanie błędu w zleceniu

Kryterium 4 żądało **czterech zrzutów**, w tym „Spichlerz w trybie auto i indywidualnym".
**To jest niewykonalne i błąd jest po stronie orkiestratora, nie wykonawcy.** W panelu
Spichlerza **nie ma przełącznika auto/indywidualne** — jest jednorazowa akcja „Włącz
Auto-Żywienie", i to jest **wcześniejsza, świadoma decyzja właściciela**, zapisana wprost
w wytworze (`gra/src/ui/empireDetailPanel.ts:176-179`, temat
`P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1`): „przycisk jest jednorazową akcją »ustaw
teraz«, nie przełącznikiem stanu".

Dwa stany tam **nie istnieją**, więc identyczny md5 obu zrzutów Spichlerza jest **dowodem
tego faktu, a nie brakiem dowodu**. Obrona ma rację; Evaluator słusznie zgłosił niespełnienie
kryterium binarnego, bo takie było jego zadanie.

**Kryterium 4 zostaje UCHYLONE w części dotyczącej Spichlerza.** Obowiązuje wyłącznie
w części panelu miasta — i tam jest spełnione.

## Zakres węzła B zamyka się na panelu miasta

Inwentaryzacja Operatora znalazła **cztery kontrolki, nie dwie**, jak zakładał dispatch —
wszystkie w `cityPanel.ts`, w tym jeden komponent współdzielony przez trzy grupy
(Żywność, Skarbiec+Nauka, Praca). To jest właściwy zakres tego węzła i on jest wykonany.

## Sprawa Spichlerza przechodzi do OSOBNEGO tematu — ECHO właściciela: „2+3"

Właściciel rozstrzygnął, że Spichlerz ma dostać **jedno i drugie**:
- **wskaźnik stanu** — ile miast jest w trybie auto, ile w indywidualnym;
- **prawdziwy przełącznik** całej cywilizacji zamiast akcji jednorazowej.

**To jawnie COFA wcześniejszą decyzję** z `P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1`.
Nie jest to sprzeczność do rozstrzygania przez wykonawcę — właściciel zmienił zdanie
świadomie, po zobaczeniu, że nie potrafi odczytać stanu autowyżywienia.

**Nie należy do węzła B** i nie jest jego brakiem: wymaga `main.ts` w allowliście
(`buildEmpireFoodSnap`, `main.ts:14401` — jedyny producent snapshotu) oraz rozszerzenia
`EmpireFoodCityUiRow` (`empireDetailTypes.ts:531-539`), które dziś nie niesie pola
`autoWyzywienie`. Osobny temat, dispatchowany po zwolnieniu `main.ts`.

## Co Final Control ma orzec

Cztery zarzuty Evaluatora i odpowiedzi obrony. Zarzut 1 orzekaj **wobec kryterium
UCHYLONEGO powyżej**, nie wobec pierwotnego brzmienia.
