# 04-final-control-faza1 — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (FAZA 1)

Rola: Final Control (Sonnet 5, effort High) — osobny subagent, ostatnia niezależna
weryfikacja przed `READY_FOR_DEPLOY`. Nie integruje, nie deployuje, nie pushuje.

## Wejście

- Worktree: `/home/user/The-Game/.claude/worktrees/wf_88cbda24-bda-1`
- Branch: `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`
- HEAD: `35dc2334` (zgodny z `headSha` zgłoszonym przez Operatora)
- Operator: `PASS`
- Evaluator: `PASS-WITH-NOTES`, 2 uwagi (patrz niżej — obie zweryfikowane niezależnie)

## Weryfikacja zakresu (1:1 z dispatchem `02-dispatch-faza1-hub-tooltip.md`)

`git diff main..HEAD --stat -- gra/`:

```
gra/src/ui/cityPanel.ts     | 52 ++++++++++++++++++++++++++++++++++++++---
gra/src/ui/scienceHubHud.ts | 24 ++++++++++++++++++-
gra/src/ui/techTreeView.ts  | 56 ++++++++++++++++++++++++++++++++++++---------
3 files changed, 117 insertions(+), 15 deletions(-)
```

Dokładnie te 3 pliki wymienione w dispatchu (`buildEntryRow()` w `scienceHubHud.ts`,
węzły `.civ-ttv-tn` w `techTreeView.ts`, `techIconHintSpan()` w `cityPanel.ts`). Zero
zmian poza `gra/` poza własnymi artefaktami procesu Operatora (`01-operator-recon.md`,
`02-dispatch-faza1-hub-tooltip.md`, `03-operator-faza1.md`).

Uwaga proceduralna (nie regresja): `git diff main..HEAD --stat` (bez `-- gra/`) pokazuje
też usunięcie `.claude/skills/civ-autobot-cursor-automations/SKILL.md` (185 linii).
Zweryfikowano `git merge-base --is-ancestor`: commit dodający ten plik na `main`
(`95f3db90`) NIE jest przodkiem ani `HEAD`, ani `merge-base(main,HEAD)` — plik powstał
na `main` PO odgałęzieniu tego brancha. To dywergencja od nieaktualnego punktu startu
brancha, nie usunięcie przez Operatora tego tematu. Poza zakresem tej weryfikacji
(dotyczy integracji, nie tego dispatchu) — do adresowania przez orkiestratora przy
rebase/integracji, nie blokuje tej fazy.

Ograniczenia z dispatchu sprawdzone w diffie:
- Klik całego wiersza/węzła: zachowanie niezmienione (nowa ikonka `stopPropagation()`
  na wejściu, `openTechPreview()`/`act()` to te same funkcje co przed zmianą, wołane
  też z resztą wiersza/węzła jak dotychczas).
- `showTechDiscoveryNotice`/`techDiscoveryNotice.ts` nietknięte — tylko nowe wywołania.
- Duży refaktor (Pytanie 1=B) nierozpoczęty — potwierdzone, brak śladu w diffie.

## Testy

Uruchomione w `gra/` na worktree (branch `autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`,
`node_modules` obecne):

| Bramka | Wynik | Referencja (R-PROC-AUTOBOT §6) |
|---|---|---|
| `npx tsc --noEmit` | **0 błędów** | 0 błędów |
| `node tools/logic-test.cjs` | **213/213** | 213/213 |
| `node tools/tech-tree-test.cjs` | **19/19** | 19/19 |
| `node tools/research-test.cjs` | **33/33** | 33/33 |
| `node tools/building-tech-gate-test.cjs` | **89 pass, 0 fail** | (nie w tabeli bramek — dodatkowo uruchomiony, bo Evaluator cytował ten plik w kontekście `cityPanel.ts`; wynik wewnętrznie spójny, 0 fail) |

`git diff main..HEAD --check -- gra/`: czysty (brak konfliktów whitespace).

## Weryfikacja dwóch uwag Evaluatora (PASS-WITH-NOTES)

1. **`bindTechHintLinkDelegation()` wołane na poziomie modułu** (`cityPanel.ts`, po
   definicji funkcji) — potwierdzone w diffie: `document.addEventListener` odpala się
   przy imporcie, nie leniwie jak `ensureStyles()`. Rzeczywiste odstępstwo od konwencji
   pliku. Nieszkodliwe dziś (moduł tylko-przeglądarkowy, żaden test `.cjs` go nie
   importuje z Node — potwierdzone: żaden z uruchomionych testów nie zaimportował
   `cityPanel.ts` bezpośrednio, wszystkie przeszły). Nieblokujące, warto skorygować przy
   najbliższej okazji (przenieść do wnętrza `ensureStyles()` albo leniwie przy pierwszym
   `techIconHintSpan()`).
2. **Brak `.replace(/"/g, '&quot;')` na `techName`** w nowych atrybutach
   `data-tech-hint-name`/`aria-label` (`cityPanel.ts`, `techIconHintSpan()`) —
   potwierdzone: plik ma ustalony, 7-krotnie powtórzony wzorzec escapowania cudzysłowu
   przy interpolacji w `title`/`aria-label` (linie 1628, 1654, 1674, 1685, 1817, 3968,
   4828, 9543), nowy kod go nie stosuje. Sprawdzono realne ryzyko: `techName` pochodzi
   wyłącznie z `gra/data/tech.json` (`nazwa`), zweryfikowano że żadna nazwa technologii
   w danych nie zawiera `"`, `<` ani `>` — zero praktycznego ryzyka dziś, ale to
   rzeczywista niespójność ze standardem pliku (nie hipotetyczna). Nieblokujące.

Obie uwagi są realne, zweryfikowane niezależnie i poprawnie zakwalifikowane przez
Evaluatora jako nieblokujące higieny kodu, nie błędy funkcjonalne. Rekomendacja: mały,
osobny follow-up (nie ten dispatch) obejmujący oba punkty razem z `esc()`/analogicznym
helperem, jeśli właściciel/orkiestrator chce zamknąć dług przed dalszymi fazami tego
tematu (przyszłe fazy będą dodawać więcej takich interpolacji w kartach).

## Werdykt

STATUS: PASS
DOMAIN: GAME
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 (FAZA 1 z 6 — ikonka info hub badań/drzewko tech/cityPanel)
GOAL: Osobna, zawsze widoczna ikonka info „ⓘ" na ikonach technologii w hubie badań,
drzewku tech i podpowiedzi technologii w cityPanel, otwierająca kartę podglądu
technologii, bez zmiany zachowania kliknięcia całego wiersza/węzła.
ZMIANY/COMMIT: `gra/src/ui/scienceHubHud.ts`, `gra/src/ui/techTreeView.ts`,
`gra/src/ui/cityPanel.ts`; HEAD `35dc2334` na branchu
`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1`. Zakres 1:1 z dispatchem, zero zmian
poza allowlistą.
TESTY: `npx tsc --noEmit` 0 błędów; `logic-test.cjs` 213/213; `tech-tree-test.cjs`
19/19; `research-test.cjs` 33/33; `building-tech-gate-test.cjs` 89/89; `git diff --check`
czysty. Wszystkie zgodne z wynikiem referencyjnym z `R-PROC-AUTOBOT.md` §6.
BLOKADY: brak. Dwie nieblokujące uwagi higieny kodu z Evaluatora (moduł-level
side-effect w `cityPanel.ts`; brak escapowania cudzysłowu na `techName` w nowych
atrybutach) — zweryfikowane, potwierdzone jako realne ale bez wpływu funkcjonalnego,
rekomendowane do osobnego małego follow-upu.
NASTĘPNY KROK: integracja przez orkiestratora (uwzględnić dywergencję
`.claude/skills/civ-autobot-cursor-automations/SKILL.md` względem aktualnego `main` przy
rebase/merge) → `READY_FOR_DEPLOY` → osobna bramka deploy/push. Kolejne fazy tematu
(Pytanie 1=B — wspólny kontrakt karty encji, itd.) pozostają jako osobne dispatche,
zgodnie z planem w `docs/decyzje/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1.md`.
DEPLOY/PUSH: NIE WYKONANO (poza zakresem tej roli).

readyForDeploy: true
