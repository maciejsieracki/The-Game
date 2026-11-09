STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-ARMY-PANEL-SELECTS-GENERAL-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora dla commita 42f84c33c; poprawki w tym samym temacie.
ZMIANY/COMMIT: baza 42f84c33c (odtworzona w worktree, detach). Nowy commit obrony: SHA w raporcie orkiestratora (po commit). Allowlista: gra/src/main.ts, gra/src/ui/unitReplacePicker.ts, gra/tools/unit-replace-army-multi-select-test.cjs, runs/<ID>/.
TESTY: patrz sekcja BRAMKI.
BLOKADY: zarzut 1 (panel na żywo w Chromium) NIE_ZMIERZONO, patrz odpowiedź 1.
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Evaluator (runda 2) i Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ CZĘŚCIOWO. Panel na żywo w Chromium nie został uruchomiony (brak Chromium/playwright w piaskownicy; dysk 0,4–1,2 GB wolnego). Dodatkowo zweryfikowałem sam renderer modala: `unitReplacePicker.ts` zbundlowany esbuildem (ikony zastąpione stubem) i uruchomiony w jsdom 24 poza repo (`scratchpad/jsd/run.cjs`). Wynik: tytuł "Zastąp — Wojownik ×3", podtytuł z "grupa 1/2" i uwagą o pominiętych, wiersz "Razem 3: 300 💰 + 75 Brąz", pozycja z limitem Super wyszarzona z powodem "Limit Super", kliknięcie pozycji wywołuje onPick z właściwym typem, pojedyncza jednostka nie pokazuje wiersza "Razem". Nieprzetestowane: przepływ stackPickState -> akcja w żywym main.ts (boot wymaga DOM i pełnej gry). Pozostaje NIE_ZMIERZONO do weryfikacji Evaluatora/Final Control albo właściciela (zrzut przy 1 z 106).

2. PRZYJMUJĘ. Kod dokleja "(grupa i/n)" do tytułu. Poprawka: `unitName` zawiera już tylko typ (z "★ Wódz:" dla wodza), a nowe pole `groupLabel` (podtytuł) niesie "grupa i/n", gdy typów jest więcej niż jeden. Test: asercja "podpis w podtytule" i "w tytule nie ma (grupa i/n)". Raport 01 był błędny w tym punkcie (opisał to jako osobny podpis, a kod robił inaczej); po poprawce zgodne.

3. PRZYJMUJĘ. Ciche pominięcie niekwalifikujących się zaznaczonych jednostek. Poprawka: `openUnitReplaceForSelection` liczy `skipped = zaznaczone - kwalifikujące się` i przekazuje notkę do pierwszego okna ("pominięto N z M zaznaczonych (już zastąpione w tej turze lub brak zamienników)"); nowe pole `note` w pickerze. Test: asercje na notkę. Gdy nie kwalifikuje się żadna, nadal działa komunikat przyczyny (bez zmian).

4. PRZYJMUJĘ. `unitReplaceAffordableCount` nie znało limitu Super. Poprawka: używa `superUnitLimitViolation` (prawdziwa funkcja z production.ts, bundlowana w teście): typ zablokowany (zajęty slot / reserved) -> 0; typ Super z wolnym slotem -> najwyżej 1. Dodatkowo `blockedReason` pozycji dostaje powód "Limit Super" także dla n=1, więc komunikat nie znika. Test: 3 asercje (slot wolny n=3 -> 1; zwykła -> 3; zajęty -> 0).

5. PRZYJMUJĘ jako zachowanie zamierzone, udokumentowane tutaj. "Anuluj" (X, Anuluj, klik tła, Esc) w oknie grupy przerywa całą serię: `onCancel` nie wywołuje `onPick`, więc kolejne grupy nie są oferowane. Intencja: gracz zrezygnował z zamiany zaznaczenia. Brak zmiany kodu; ta sama intencja jest już opisana w komentarzu do `openUnitReplaceGroupPicker`. Jeśli właściciel woli "pomiń tę grupę, pokaż następną", to osobny temat (nie w tej obronie).

## Weryfikacja po poprawkach (commit obrony)

- unit-replace-army-multi-select-test.cjs: 36/36 OK (było 29/29; dodano asercje Super, groupLabel, note).
- unit-replace-test.cjs: 15/15 OK.
- unit-replace-full-cost-test.cjs: 40 passed, 0 failed.
- army-panel-recruit-rally-general-test.cjs: 5 assertions passed.
- army-panel-general-label-multiselect-test, army-panel-recruit-remove-test: NIE_ZMIERZONO (wymagają jsdom/playwright; brak ich w node_modules piaskownicy).
- jsdom (poza repo, zrzut DOM modala): zob. odpowiedź 1.
- tsc --noEmit gra/: 151 błędów środowiskowych w całym projekcie (brak @types/three); żaden nie w zmienionych zakresach unitReplacePicker.ts ani main.ts (okolice 77xx–79xx i 25xxx).
- git diff --check: czysty.

## Pliki poza allowlistą

Brak. Nie dotknięto WERSJE.md, gra-robocza/, buildów, git add -A.
