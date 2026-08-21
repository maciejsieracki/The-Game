# 01-operator — P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1

STATUS: PASS
TEMAT: P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1
GOAL: pole `tech.Uwagi` (notatki deweloperskie, np. „ABC-7: Popalnia brązu na mapie") NIE ma
przeciekać do gracza w `cityPanel.ts::appendTechDetailBlock()`.

## Diagnoza

1. **Lokalizacja wzorców (grep, nie zgadywanie).** `gra/data/tech.json` ma 32 wpisy z
   niepustym polem `Uwagi`. Grep na `PYTANIE|DECYZJA|DEC-\d{8}|ABC-\d+` w tym pliku daje
   DOKŁADNIE jedno trafienie: Brązownictwo, `"kończy Epokę 1; ABC-7: Popalnia brązu na
   mapie"`. Filtr `isDevOnlyPlayerText()` (w `gra/src/ui/cityPanel.ts`) rozpoznawał
   wcześniej wyłącznie `^PYTANIE\s+\d+`, `^DECYZJA`, `^DEC-\d{8}` i (wszędzie w tekście)
   „patrz unit-building-bonuses" — NIE rozpoznawał serii odniesień decyzyjnych
   `ABC-<numer>` (opcjonalnie z literą, np. „ABC-21 B"), więc ten jeden wpis przeciekał.
   Sprawdziłem, że seria `ABC-<numer>` to ta sama rodzina odniesień decyzyjnych co
   PYTANIE/DECYZJA — potwierdzone w `docs/decyzje/DECYZJE-MNOZNIK-ABC.md` i wielu plikach
   `dyspozycje/_handoff/*-ABC-*.md` (np. „ABC-7 (wariant)”, „ABC-18”, „ABC-20…24”) — nie
   osobna, nierozpoznana kategoria wymagająca nowej decyzji projektowej. `ABC-\d+`
   występuje też w `gra/data/buildings.json` (pole `uwagi`, ta sama funkcja
   `playerFacingNote()` używana przy linii 7134 dla `def.uwagi`), więc naprawa chroni
   wszystkie wywołania, nie tylko tech.json.
2. **Naprawa filtra.** Dodano `|| /\bABC-\d+\b/i.test(t)` do `isDevOnlyPlayerText()` w
   `gra/src/ui/cityPanel.ts` — dopasowanie WSZĘDZIE w tekście (analogicznie do już
   istniejącego wzorca „patrz unit-building-bonuses"), bo w danych odniesienie ABC
   pojawia się w środku zdania („kończy Epokę 1; ABC-7: ..."), nie tylko na początku.
   Nie zmieniono treści żadnej notatki w `tech.json` (zgodnie z ograniczeniem) — tylko
   logikę filtrowania przed wyświetleniem.
3. **Weryfikacja współdzielenia filtra (korzeń przeoczenia z dispatcha).**
   `appendTechDetailBlock()` w `cityPanel.ts` (linia 7007) woła
   `playerFacingNote(t.Uwagi)` — DOKŁADNIE tę samą funkcję, z której korzysta reszta
   panelu (np. `def.uwagi` przy budynkach/jednostkach, linia 7134). `techDiscoveryNotice.ts`
   NIE ma żadnej definicji/importu `playerFacingNote`/`isDevOnlyPlayerText` — bo
   świadomie w ogóle nie renderuje pola `Uwagi` (potwierdzone grepem — zero trafień w tym
   pliku). Nie ma więc dwóch rozjechanych kopii filtra do zsynchronizowania: jest jedna
   definicja w `cityPanel.ts`, używana konsekwentnie w obu miejscach tego pliku, a drugi
   plik świadomie pomija `Uwagi` w całości — zgodnie z ograniczeniem dispatcha, TEGO nie
   zmieniano.

## ZMIANY/COMMIT

- `gra/src/ui/cityPanel.ts` — `isDevOnlyPlayerText()`: dodano rozpoznawanie wzorca
  `ABC-\d+` (wszędzie w tekście), z komentarzem odsyłającym do tego tematu i źródeł
  potwierdzających serię ABC jako odniesienia decyzyjne.
- `gra/tools/citypanel-uwagi-abc-filter-test.cjs` (NOWY) — test regresyjny.
- Branch: `autobot/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (lokalnie, bez mergeu do main).
- Commit SHA: patrz `git log -1` po commicie tego raportu (commitowane razem z kodem).

## TESTY

- `cd gra && npx tsc --noEmit` → czysto poza jednym pre-istniejącym, niezwiązanym z tym
  tematem ostrzeżeniem `TS5101` (deprecated `baseUrl`) — zweryfikowano identyczne na
  `HEAD` przed zmianą (git stash + tsc + stash pop), więc to nie regresja tego tematu.
- `node gra/tools/citypanel-uwagi-abc-filter-test.cjs` → **32 pass, 0 fail**. Test:
  (a) wycina prawdziwe ciała `isEmptyDataVal`/`isDevOnlyPlayerText`/
      `stripInlineDevAnnotations`/`playerFacingNote` z `cityPanel.ts` i wykonuje je w
      `vm` (rzeczywista logika, nie regex na tekście źródła);
  (b) regres dokładnego przypadku ze znaleziska (Brązownictwo/„ABC-7:”);
  (c) grepuje WSZYSTKIE wartości `Uwagi` w `tech.json`, filtruje po znanych wzorcach
      dev-notatki i wymaga odrzucenia KAŻDEJ (nie tylko literalnego stringa) —
      przyszłościowo odporne na kolejne wpisy ABC/PYTANIE/DECYZJA;
  (d) kontrola przytomności: notatki BEZ wzorca dev nadal przechodzą (filtr nie
      nadgorliwy);
  (e) strukturalnie wymusza, że `appendTechDetailBlock()` woła
      `playerFacingNote(t.Uwagi)`.
  Zweryfikowano też, że test REALNIE łapie regres: uruchomiony na kodzie sprzed naprawy
  (`git stash` na samym `cityPanel.ts`) daje 2 FAIL na dokładnie tych dwóch asercjach
  dot. Brązownictwa/ABC-7, resztę PASS.
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir <tmp>
  --emptyOutDir` z `gra/` → **sukces** (837 modułów, build w ~29,5s). Uwaga
  proceduralna: worktree nie miał `gra/node_modules` (świeży worktree bez `npm install`,
  a `npm run build`/`npm run dev` są zakazane) — na czas tego jednego sprawdzenia
  utworzono TYMCZASOWY symlink `gra/node_modules -> /home/user/The-Game/gra/node_modules`
  (repo źródłowe, tylko odczyt), usunięty zaraz po weryfikacji (`git status` czysty,
  symlink nie jest częścią commitu).

## BLOKADY

Brak.

## NASTĘPNY KROK

Przekazać do Evaluatora (GPT-5.6 Luna High) wg obiegu z CLAUDE.md/README.md.

DEPLOY/PUSH: NIE WYKONANO
