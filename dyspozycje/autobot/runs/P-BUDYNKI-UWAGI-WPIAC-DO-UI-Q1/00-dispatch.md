TEMAT:  P-BUDYNKI-UWAGI-WPIAC-DO-UI-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Operatora+Evaluatora tematu `P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1`
(zintegrowane, commit `bc7ab7f6`): pole `uwagi` budynków (`buildings.json`) NIE
jest dziś renderowane w ŻADNEJ ścieżce UI, mimo że komentarz nagłówkowy
`buildBuildingDetailCardViaEntityCard()` (`gra/src/ui/cityPanel.ts:7510-7512`)
mówi wprost „Sekcje „Technologie"/„Uwagi" dopełnione TU" — funkcja realnie
dopełnia WYŁĄCZNIE „Technologie" (linie 7530-7531). **ECHO właściciela
2026-09-12: wpiąć wiersz „Uwagi" do karty budynku.**

## GOAL

Karta budynku (system entityCards, `buildBuildingDetailCardViaEntityCard()`)
ma pokazywać wiersz/sekcję „Uwagi" z legalną, gracz-facing treścią pola
`def.uwagi` — dokładnie tym samym wzorcem co karta technologii już stosuje
dla `t.Uwagi` (`cityPanel.ts:7416-7417`: `const techNote =
playerFacingNote(t.Uwagi); if (techNote) gridDetailRow(grid, 'Uwagi tech',
techNote);`), korzystając z JUŻ POPRAWIONEGO filtra
`isDevOnlyPlayerText`/`stripInlineDevAnnotations`/`playerFacingNote`
(commit `bc7ab7f6`, nie modyfikuj tych funkcji w tym temacie).

## DOKŁADNE MIEJSCE

`gra/src/ui/cityPanel.ts`, funkcja `buildBuildingDetailCardViaEntityCard()`
(ok. linii 7515-7534): po istniejącym bloku Technologii (`techBody`/
`appendTechDetailBlock`) dodaj analogiczny wiersz/sekcję dla `def.uwagi`.
Wzorce do wyboru (zdecyduj sam, udokumentuj wybór w raporcie):
- (A) dopisz wiersz do TEGO SAMEGO `techBody`/grid co tech (jeśli
  `appendTechDetailBlock` zwraca/udostępnia uchwyt do swojego grida — jeśli
  NIE, nie modyfikuj `appendTechDetailBlock`, bo jest świadomie współdzielona
  z kartą jednostki i zamrożona do T10, patrz komentarz w kodzie);
- (B, prawdopodobnie prostsze i bezpieczniejsze) osobny tile
  `beginBuildingDetailTile(card, 'Uwagi')` z własnym gridem
  (`appendDetailGridIn`), analogicznie do `charBody`/`yieldBody`/`costBody`
  niżej w tym samym pliku — dodaj TYLKO jeśli `playerFacingNote(def.uwagi)`
  zwraca niepusty string (brak tile'a, gdy notatka jest w całości dev-only
  albo pole puste — zero pustych sekcji w karcie).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Karta budynku z niepustym, legalnym `uwagi` (po odfiltrowaniu ABC-)
   pokazuje wiersz/sekcję „Uwagi" z tą treścią — zweryfikuj żywym Chromium na
   co najmniej 2 budynkach z realnymi wpisami `uwagi` w `buildings.json`
   (np. `port`/Port, `akademia`).
2. Budynek z polem `uwagi` PUSTYM albo W CAŁOŚCI dev-only (np. wpis linii
   1667 z `buildings.json`, „ABC-21 B: wchodzi w merge Akademia — nie buduj
   osobno") NIE pokazuje pustej sekcji „Uwagi" — zero śladu w DOM.
3. Karta technologii (istniejący wiersz „Uwagi tech") i karta jednostki
   NIETKNIĘTE — `appendTechDetailBlock`, `playerFacingNote`,
   `stripInlineDevAnnotations`, `isDevOnlyPlayerText` bez zmian (chyba że
   wariant A z GOAL wymaga minimalnej zmiany sygnatury zwracanej wartości —
   jeśli tak, MUSISZ potwierdzić zero regresu na karcie jednostki i
   technologii żywym testem).
4. `tsc --noEmit` 0 błędów.
5. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
6. Istniejące testy entity-cards/CivPedia dla budynków bez regresu
   (`entity-card-contract-test.cjs`, `building-detail-card-entitycard-
   migration-test.cjs`, `citypanel-uwagi-abc-filter-test.cjs`).
7. Żywy zrzut Chromium karty budynku pokazujący wypełnioną sekcję „Uwagi".

## DOWÓD WIZUALNY (obowiązkowy)

Zrzut ekranu karty budynku Port (albo innego z realnym, legalnym wpisem
`uwagi` po filtrze) pokazujący sekcję „Uwagi" wypełnioną. Zapisz pod
`dowody/budynek-uwagi-wpiete-do-ui.png`.

## Allowlista

- `gra/src/ui/cityPanel.ts` (WYŁĄCZNIE `buildBuildingDetailCardViaEntityCard`
  i, jeśli absolutnie konieczne dla wariantu A, minimalna, jawnie uzasadniona
  zmiana w `appendTechDetailBlock` z pełnym testem regresji na tech/jednostce)
- `dowody/budynek-uwagi-wpiete-do-ui.png` (nowy plik)

Zakazane: `gra/data/*.json`, `gra/src/ui/entityCards/*` (poza czytaniem),
filtr `isDevOnlyPlayerText`/`stripInlineDevAnnotations`/`playerFacingNote`
(już poprawny, nie dotykaj), pliki z sekretami, `docs/decyzje/*.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## Izolacja

Worktree `/home/user/wt-budynki-uwagi-wpiac-do-ui`, gałąź
`autobot/P-BUDYNKI-UWAGI-WPIAC-DO-UI-Q1`, baza `origin/main`. C-001: zakaz
`npm run build`/`dev` w `gra/`; dozwolona wyłącznie `node
./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo>
--emptyOutDir` oraz `node ./node_modules/typescript/bin/tsc --noEmit`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 400 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
