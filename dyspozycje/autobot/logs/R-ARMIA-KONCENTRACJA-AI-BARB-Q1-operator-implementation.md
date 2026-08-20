# Raport Operatora — R-ARMIA-KONCENTRACJA-AI-BARB-Q1

**Status:** IMPLEMENTED / TESTED / LOCAL ONLY
**Tryb:** Luna High
**Baza:** `main` HEAD `9e576da2048eb2f2083e0c5684ae01c66ff8d6eb`
**Worktree:** `codex/r-armia-koncentracja-ai-barb-q1`
**Commit implementacji:** `b299041801f978dc208cfc906fd61950c12d84c6`

## Wynik

Zaimplementowano minimalnie pełną koncentrację głównych cywilizacji AI zgodnie z decyzją 4A/5A/6A/7A. Nowy owner-agnostyczny planer:

- uruchamia się od minimum 3 aktywnych kwalifikowanych jednostek w promieniu 4 heksów;
- wybiera deterministyczny punkt zbiórki będący realnym, zajętym heksiem;
- porusza jednostki do punktu przez istniejący `firstStep`/`computePath` i istniejący executor ruchu;
- wstrzymuje zwykły marsz/atak dla rozproszonej grupy do czasu fizycznego stosu;
- po faktycznym stosie nie dodaje bonusu Mocy ani syntetycznych jednostek — roster walki pozostaje runtime rosterem.

Kwalifikacja wyklucza zwiadowców/cywilów, garnizony, jednostki bez ruchu, zaokrętowane, oblężone, rajderów morskich i rodzime jednostki morskie (`galera`). Obrońcy przydzieleni przez istniejącą ochronę własnych miast są wyłączeni z rally.

Istniejący lokalny rally barbarzyńców pozostał nietknięty: nie zmieniano `barbarians.ts`, dispatchera barbarzyńców, rajdów morskich ani zasad Mocy.

## Pliki

- `docs/decyzje/R-ARMIA-KONCENTRACJA-AI-BARB-Q1.md` — decyzja 4A/5A/6A/7A w worktree.
- `gra/src/game/army-concentration.ts` — czysty, deterministyczny planer i kontrakt kwalifikacji.
- `gra/src/game/ai.ts` — wpięcie koncentracji wyłącznie w główną ścieżkę AI.
- `gra/tools/army-concentration-test.cjs` — niezależne testy kontraktowe, mutacyjne guardy i integracja z `decideAITurn`.

## Testy i bramki

- `npm run typecheck` — **PASS, exit 0**.
- `node tools/army-concentration-test.cjs` — **PASS, 27 passed, 0 failed**.
- `node tools/barbarians-test.cjs` — **PASS, 213 passed, 0 failed**.
- `git diff --check` — **PASS, brak błędów whitespace**.
- `node tools/ai-test.cjs` — **285 passed, 8 failed** w istniejącym legacy suite; porażki dotyczą wcześniejszych testów ekonomii/dyplomacji (`wartosc`/archetypy i handel), nie dotykają plików ani ścieżki koncentracji. Nowy niezależny test integracyjny `decideAITurn` przechodzi.

## Pełny `git show --stat` commit-u implementacji

```text
commit b299041801f978dc208cfc906fd61950c12d84c6
Author:     maciejsieracki <maciej.sieracki@gmail.com>
AuthorDate: Thu Aug 20 08:18:19 2026 +0200
Commit:     maciejsieracki <maciej.sieracki@gmail.com>
CommitDate: Thu Aug 20 08:18:34 2026 +0200

    feat(ai): concentrate major armies before attack

 docs/decyzje/R-ARMIA-KONCENTRACJA-AI-BARB-Q1.md |  13 +++
 gra/src/game/ai.ts                              |  30 +++++++
 gra/src/game/army-concentration.ts              | 103 +++++++++++++++++++++++
 gra/tools/army-concentration-test.cjs           | 106 +++++++++++++++++++++++
 4 files changed, 252 insertions(+)
```

## Kontrola końcowa

Commit implementacji jest exact i lokalny. Nie wykonano push ani deploy. Raport został zapisany w tym pliku; nie wykonano żadnych zmian w głównym, istniejącym brudnym worktree.
