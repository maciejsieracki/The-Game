# R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1 — Obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1
GOAL: Usunąć redundantną plakietkę „+X” obok „Brutto · netto” na kartach surowców (ABC 2026-11-15, A). Wiersz „Brutto · netto” (liczby i klasy kolorów) bez zmian; sekcja „Skąd zapasy” nietknięta.
ZMIANY-COMMIT: kod produkcyjny bez zmian względem `ed0362c37` (plakietka usunięta w `bcc2523ef`). Obrona dotyczy wyłącznie testu: `gra/tools/resource-cards-plusx-badge-test.cjs` (dodana sekcja E: prawdziwy DOM w Chromium, 31 pass / 0 fail, wcześniej 17). Commit obrony: patrz sekcja SHA poniżej.
SHA: baza obrony `ed0362c37`; commit obrony — wpisany w raporcie końcowym orkiestratora (`git log -1` na gałęzi roboczej).

## Odpowiedzi na zarzuty Evaluatora (75592debd)

### Zarzut 1 — brak testu realnego DOM (kryterium a)
PRZYJMUJĘ, częściowo (poprawka + dowód):
- Dodano sekcję E do `gra/tools/resource-cards-plusx-badge-test.cjs`: HTML zwrócony przez prawdziwy `resCardHtml` (bundlowany esbuildem z `empireDetailPanel.ts`) jest wstawiany na stronę w Chromium (playwright, `/usr/bin/chromium`, wzorzec jak `army-merge-panel-scroll-real-render-test.cjs`) i sprawdzany w DOM:
  - liczba węzłów `[class*="civ-emp-res-rate"]` = 0 (dla drewna, złota z dyplomacją, gliny),
  - tekst węzła `.civ-emp-res-gn` = oczekiwany („Brutto +457 · netto +422 / turę” itd.),
  - klasa koloru węzła zawiera `good` / `bad`,
  - karta bez produkcji i zużycia: brak plakietki i brak `.civ-emp-res-gn` (E C).
- Mutant M1 (przywrócona plakietka) jest wykrywany przez test A oraz przez nowy M2 w prawdziwym DOM (węzeł `civ-emp-res-rate*` obecny).
- ODRZUCAM część „żywa gra”: pełny zrzut z żywej gry wymagałby `vite build`/`dev` w `gra/`, a to jest zakazane przez R-PROC-AUTOBOT §9. Zrzut z żywej gry pozostaje NIE_ZMIERZONO (nie była to dostępna ścieżka w tym temacie).

### Zarzut 2 — zmiana `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` i `gra/src/data/wikiBundle.json` poza dosłowną allowlistą
PRZYJMUJĘ jako uzasadnione (decyzja należy do FC):
- Kryterium (d)/(e) dispatchu: „wikiBundle/docs jeśli wspominają plakietkę”. Akapit 53.1a poradnika 08 (przed zmianą) opisywał plakietkę „+X” jako element karty — zostawienie go opisywałoby usunięty element.
- `wikiBundle.json` jest generowany z `docs/` i w zmianie jest tylko odtworzeniem tego akapitu (diff jednowierszowy; Evaluator potwierdził bajtową zgodność regeneracji).
- Allowlista dispatchu zawiera `docs/encyklopedia/**`, nie `docs/PORADNIK-GRACZA/**` — to jest luka w allowliście, nie wyjście poza zakres. Do rozstrzygnięcia przez FC (wpis w UWAGI).

### Zarzut 3 — UWAGA 3 Operatora „przesadzona”: rozbicie produkcja/dyplomacja/netto nadal w tooltipie
PRZYJMUJĘ (korekta raportu Operatora, bez zmiany kodu):
- Dowód: `gra/src/ui/empireDetailPanel.ts` — `resTooltipHtml` (ok. linii 3377–3395) nadal dla kart z dyplomacją dodaje „Produkcja własna: …”, „Dyplomacja (oddajesz): −N / turę”, „Dyplomacja (otrzymujesz): +N / turę” i „Netto magazyn: …”. Tooltip karty (`title="${resTooltipHtml(r)}"`) zachowuje to rozbicie.
- Więc informacja nie znika z gry; znika tylko WIDOCZNA plakietka „+X” na karcie. Poprawne sformułowanie: „rozbicie dostępne po najechaniu na kartę (tooltip)”, a nie „tylko w usuniętej plakietce”. Decyzja A właściciela obejmuje ten wariant.

### Zarzut 4 — karta bez produkcji i zużycia traci znacznik „—” i nie ma wiersza tempa
ODRZUCAM zmianę kodu (wyjaśnienie zamiast poprawki):
- Znacznik „—” był częścią usuwanej funkcji `resRateHtml` (w `bcc2523ef` usunięta linia `const rateTxt = prod === 0 ? '—' : …`). Dispatch wprost nakazuje usunąć plakietkę; „—” jest jej treścią.
- Wiersz brutto/netto dla karty bez produkcji i zużycia pozostaje pusty zgodnie z istniejącym komentarzem `resGrossNetLineHtml` („Brutto +X · netto +Y … Brak produkcji i brak zużycia → ''”), czyli zachowaniem sprzed zmiany dla wiersza gross/net. Test C1/C2 i E C to utrwalają.
- Do wiadomości FC/orkiestratora: jeśli właściciel chce „—” na kartach bez tempa, to osobna decyzja produktowa, nie część tej obrony.

### Zarzut 5 — asercja A szuka tylko `civ-emp-res-rate`
PRZYJMUJĘ jako ryzyko niskie, z częściowym uzupełnieniem:
- Nowa asercja E szuka `[class*="civ-emp-res-rate"]` w prawdziwym DOM, czyli wykrywa każdą klasę z tym prefiksem (w tym `-stack`, `-line`, `.good/.warn/.bad` w obrębie rodziny), nie tylko jedną nazwę. Plus D2 (statyczny brak reguł CSS `civ-emp-res-rate*`).
- Pozostaje znane ograniczenie: plakietka o zupełnie innej nazwie klasy nie zostałaby wykryta przez E/A, a wykrywa ją dopiero wizualny zrzut (kryterium c). Mutacja M1/M2 pokazuje, że przywrócenie oryginalnej plakietki jest łapane.

## TESTY (liczby z surowego wyjścia, worktree na `ed0362c37` + zmiana testu)
- `npx tsc --noEmit` (w `gra/`): exit 0 (`TSC_EXIT=0`, bez wyjścia błędów).
- `node tools/resource-cards-plusx-badge-test.cjs`: `=== resource-cards-plusx-badge-test: 31 pass, 0 fail ===` (exit 0). Sekcje: A/B (12), C (2), D (2), E (13 w DOM, Chromium), M1+M2 (2).
- `node tools/resource-cards-gross-net-test.cjs`: `=== resource-cards-gross-net-test: 22 pass, 0 fail ===` (exit 0).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)` (exit 0).
- `git diff --check`: bez wyjścia (czysto).
- Pozostałe bramki z dispatchu (tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) NIE były uruchamiane w tej rundzie obrony — zmiana dotyczy tylko pliku testu, a kod produkcyjny nie zmienił się od `bcc2523ef`, dla którego Operator i Evaluator raportowali je zielone. NIE_ZMIERZONO w tej rundzie.
- Zależności: `npm ci` w worktree (`gra/node_modules`, 71 pakietów), bez `npm run build`/`dev`.

## BLOKADY
Brak blokad. Zrzut z żywej gry: NIE_ZMIERZONO (zakaz build/dev w `gra/`).

## RUNDY
2/5 (runda 1 Operatora + ta obrona; ostatni werdykt Evaluatora: PASS-WITH-NOTES).

## UWAGI-DLA-ORKIESTRATORA
1. Allowlista dispatchu nie obejmuje `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` ani `gra/src/data/wikiBundle.json` (tylko `docs/encyklopedia/**`). Zmiany są uzasadnione kryterium (e); FC decyduje, czy rozszerzyć allowlistę. Warto poprawić allowlistę w dispatchach „wikiBundle/docs”.
2. Gałąź bazowa dispatchu: `origin/main` = `b97287c88`; kandydat `e67d6c288` z dispatchu nie zawiera kodu (wyjaśnione w 10-operator-claude.md, UWAGA 1).
3. Pierwotny plik `00-dispatch.md` nie istnieje w `origin/main` (tylko w dodatku na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Obrona oparła się na treści dodatku z komunikatu zadania.
4. Obserwacja poza zakresem (z raportu Operatora, bez zmian): przy szerokości kolumny 170 px wiersz „Brutto · netto / turę” zawija się do dwóch linii — był tak samo przed zmianą.
5. Decyzja produktowa do ewentualnego ABC: znacznik „—” na kartach bez produkcji/zużycia (zarzut 4) — obecnie usunięty razem z plakietką.

## NASTĘPNY KROK
Evaluator (re-weryfikacja testu E i mutacji M2 na `<SHA obrony>`), potem Final Control. Brak integracji i deployu przez Operatora.

DEPLOY/PUSH: NIE WYKONANO
