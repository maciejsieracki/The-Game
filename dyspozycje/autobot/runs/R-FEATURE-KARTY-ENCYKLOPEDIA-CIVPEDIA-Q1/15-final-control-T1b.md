STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T1b „ROZSZERZENIE KONTRAKTU RENDERERA"
GOAL: `renderer.ts` faktycznie obsługuje wszystkie pola zarezerwowane/potrzebne w
`types.ts` (akordeon, ikona per wiersz, `trailing`, badge per wiersz, paginacja
"Pokaż pozostałe N" + `compactHeaderOnExpand`, layout `pills`) — bez zmiany
zachowania widocznego dla gracza dla dotychczasowych wywołań, wstecznie
kompatybilnie, gotowe pod T3 (migracja karty technologii).

## Rola i zakres tej weryfikacji

Final Control — osobny, niezależny subagent, ostatnia weryfikacja przed
`READY_FOR_DEPLOY`. Wejście: Operator status=PASS (headSha=63f60805),
Evaluator status=PASS (issues=[]). Nie integruję, nie mergeuję do `main`, nie
pushuję — zgodnie z barierami CLAUDE.md/README.md.

## Worktree i baza diffu

- Worktree: `/home/user/The-Game/.claude/worktrees/wf_6d4e31c1-2de-1`, branch
  `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`, `git status` czyste.
- `HEAD` = `63f608050c44589bcb7ca7761f354e71df389ad8` (zgodne z headSha zgłoszonym
  przez Operatora, prefiks `63f60805`).
- `git merge-base main HEAD` = `8cc70bac3f86607ffd8520d021873d1fee9a3976` — main
  jest dalej niż punkt rozgałęzienia tego brancha, więc diff liczony względem
  merge-base, nie względem `main` wprost.

## Weryfikacja diffu (`git diff <merge-base>..HEAD -- gra/`)

Diff w `gra/` obejmuje WYŁĄCZNIE:
- `gra/src/ui/entityCards/renderer.ts` — nowe funkcje `buildGridRowEl`,
  `buildPillRowEl`, `buildSectionEl` (akordeon/highlighted/previewLimit/pills/
  compact) + wywołanie z `renderEntityCard` + nowe klasy CSS w
  `ENTITY_CARD_CSS`.
- `gra/src/ui/entityCards/types.ts` — nowe opcjonalne pola: `EntityCardRowIcon`,
  `EntityCardRowBadge`, `EntityCardRow.icon?`/`.trailing?`/`.badge?`,
  `EntityCardSection.highlighted?`/`.previewLimit?`/`.layout?`,
  `EntityCardData.compactHeaderOnExpand?`.
- `gra/tools/entity-card-contract-test.cjs` — 28 nowych asercji (6 bloków
  fixture'ów T1b) dopisanych PO istniejących 47 (T1), bez modyfikacji
  wcześniejszych asercji.

Poza `gra/` diff dotyczy wyłącznie dokumentacji runu
(`dyspozycje/autobot/runs/.../11..14-*.md`) — bez wpływu na `gra/`.

Potwierdzone (`git diff --name-only`): **zero edycji**
`techDiscoveryNotice.ts`, jakichkolwiek adapterów, `scienceHubHud.ts`,
`techTreeView.ts`, `cityPanel.ts` — dokładnie zgodnie z allowlistą z dispatchu.

## Testy — wykonane w worktree

1. `cd gra && npx tsc --noEmit` → **brak błędów, brak output** (exit 0).
2. `node tools/entity-card-contract-test.cjs` → **75 pass, 0 fail**
   (47 asercji T1 bez zmian + 28 nowych T1b: akordeon 6, ikona 3, trailing 3,
   badge 5, paginacja+compact 6, pills 5 = 28). Rachunek 47+28=75 zgadza się z
   wymogiem zadania.
3. `node tools/technology-discovery-card-visual-test.cjs` → **48 PASS, 0 FAIL**
   — ten test operuje na `techDiscoveryNotice.ts` (nietkniętym w T1b), więc
   potwierdza zerowy efekt uboczny zmian renderera na istniejącą kartę
   odkrycia technologii.

## Ocena wstecznej kompatybilności

- Wszystkie nowe pola (`icon`, `trailing`, `badge`, `highlighted`,
  `previewLimit`, `layout`, `compactHeaderOnExpand`) są **opcjonalne** (`?`) —
  potwierdzone w diffie `types.ts`.
- Sekcje bez `collapsible` renderują się jak wcześniej (statyczny `h3`, zawsze
  rozwinięte). Sekcje bez `previewLimit` renderują wszystkie wiersze bez
  przycisku "Pokaż pozostałe" (asercja (5) w kontrakcie testowym, potwierdzona
  PASS). Domyślny `layout` to `'grid'` — zero zmiany dla istniejących wywołań
  bez `layout: 'pills'`.
- `compactHeaderOnExpand` domyślnie `undefined`/`false` → brak efektu, klasa
  `entity-card--compact` dodawana tylko gdy jawnie `true` i tylko po kliknięciu
  "Pokaż pozostałe".
- Istniejące 47 asercji T1 przechodzi bez modyfikacji → brak regresji
  zachowania dla dotychczasowych konsumentów (`unitInfoCard.ts` i inne miejsca
  budujące `EntityCardData` bez nowych pól).

## Decyzja

STATUS: PASS
readyForDeploy: true

Zero błędów kompilacji, zero regresji w obu bramkach testowych (75/75 i
48/48), diff ograniczony ściśle do allowlisty (`entityCards/types.ts` +
`entityCards/renderer.ts` + plik testu kontraktu + dokumentacja runu), zero
edycji plików zakazanych dla tej paczki. Wsteczna kompatybilność potwierdzona
zarówno przez typy (wszystkie nowe pola opcjonalne), jak i przez zachowanie w
runtime (fixture'y bez nowych pól renderują się identycznie jak przed T1b).

ZMIANY/COMMIT: brak zmian w plikach źródłowych wykonanych przez Final Control
(weryfikacja nieinwazyjna) — dopisany wyłącznie ten raport,
`dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/15-final-control-T1b.md`,
zakomitowany na branchu `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`.
TESTY: `npx tsc --noEmit` czysty; `entity-card-contract-test.cjs` 75/75;
`technology-discovery-card-visual-test.cjs` 48/48 — wszystkie uruchomione
bezpośrednio w tym przebiegu weryfikacji, wyniki wklejone powyżej.
BLOKADY: brak.
NASTĘPNY KROK: integracja przez orkiestratora (merge do `main` po jego własnej
weryfikacji) — poza zakresem tej roli. Po integracji: T3 (migracja karty
technologii na wspólny renderer) może korzystać z rozszerzonego kontraktu.
DEPLOY/PUSH: NIE WYKONANO.
