# R-KARTY-HISTORIA-INFRA-Q1 — Runda 2 — Obrona: dowód nietautologiczności (Zarzut 1)

**Kontekst:** Evaluator (runda 2) zgłosił, że raport Operatora dla commita
`c2e6727f` nie zawierał udokumentowanego dowodu nietautologiczności
(§9 pkt 6a) dla nowego testu
`gra/tools/citypanel-uwagi-hostcard-removed-real-render-test.cjs` — mimo że
sam Evaluator wykonał tę mutację niezależnie i test poprawnie poczerwieniał.
Ten plik dokumentuje, że Operator wykonał tę samą procedurę we własnym
worktree/branchu, jako uzupełnienie braku formalnego w raporcie rundy 1/2.

## Krok 1 — baseline (commit `c2e6727f`, bez mutacji)

```
$ node gra/tools/citypanel-uwagi-hostcard-removed-real-render-test.cjs
...
[citypanel-uwagi-hostcard-removed-real-render-test] 12 pass, 0 fail
```

## Krok 2 — mutacja źródła

Przywrócono usunięty w commicie `c2e6727f` blok `playerFacingNote(def.uwagi)`
w `buildBuildingDetailCardViaEntityCard` (`gra/src/ui/cityPanel.ts`, przed
`return card;`), dokładnie ten sam blok, który diff `86c85ab0..c2e6727f`
pokazuje jako usunięty:

```ts
  const playerNote = playerFacingNote(def.uwagi);
  if (playerNote) {
    const noteBody = beginBuildingDetailTile(card, 'Uwagi');
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = playerNote;
    noteBody.appendChild(note);
  }
```

## Krok 3 — test po mutacji (musi poczerwienieć)

```
$ node gra/tools/citypanel-uwagi-hostcard-removed-real-render-test.cjs
...
FAIL: BUDYNEK (stolarnia, uwagi niepuste): karta REALNIE zbudowana przez
  cityPanel.ts::buildBuildingDetailCard NIE zawiera słowa "Uwagi" nigdzie w DOM
FAIL: BUDYNEK: treść pola uwagi ("B-SUROW-BUD-03...") NIE pojawia się w
  wyrenderowanej karcie
FAIL: REALNY hover: wyrenderowana karta NIE zawiera słowa "Uwagi"
  (zrzut DOM potwierdza obecność "<div class=\"bld-detail-tile-hd\">Uwagi</div>"
  i tekstu "B-SUROW-BUD-03: bonus Pracy only — bez konwertera desek")

[citypanel-uwagi-hostcard-removed-real-render-test] 9 pass, 3 fail
```

Test poprawnie wykrył regres — w tym realny scenariusz `page.hover()` przez
prawdziwy `attachHoverDetail` (jedna z trzech FAIL to właśnie ta asercja).
Pozostałe 9 asercji (fixture, jednostka Procarz, hover install, brak błędów
konsoli) pozostały PASS — mutacja dotyczyła wyłącznie jednej z 4 usuniętych
lokalizacji, zgodnie z oczekiwaniem.

## Krok 4 — przywrócenie pliku do stanu z commita i re-weryfikacja

```
$ git checkout -- gra/src/ui/cityPanel.ts
$ git status --short gra/src/ui/cityPanel.ts
(brak wyjścia — plik czysty, identyczny z commitem c2e6727f)

$ node gra/tools/citypanel-uwagi-hostcard-removed-real-render-test.cjs
...
[citypanel-uwagi-hostcard-removed-real-render-test] 12 pass, 0 fail
```

## Wniosek

Nowy test nie jest tautologiczny: wykrywa realny regres (przywrócenie
usuniętego kodu produkcyjnego powoduje FAIL, w tym w scenariuszu realnego
hover), a po przywróceniu pliku źródłowego do stanu z commita wraca do
12/12 PASS bez żadnych innych zmian w repo. §9 pkt 6a spełnione i
udokumentowane — w tym pliku, dołączonym do artefaktów rundy 2.
