# Operator report — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1

Status: **operator complete; ready for independent evaluation**. Pracowałem w izolowanym worktree `/workspace/army-merge-scroll`, branch `codex/army-merge-panel-inner-scroll-q1`, na bazie opublikowanego `91dc998a5f1b51ad29e0f4785edfd45655445c53`. Nie wykonano commit, push, merge ani deploy.

## Ustalenie i zmiana

Kod produkcyjny w `gra/src/ui/armyMergePanel.ts` na wskazanej bazie już ogranicza modal do wysokości viewportu z marginesem, przewija `.civ-amp-body`, utrzymuje nagłówek/wynik/stopkę jako stałe sloty flex i nie dopuszcza zewnętrznego scrolla. Rzeczywisty Chromium potwierdził działanie tego zachowania. Nie zmieniłem CSS ani logiki scalania.

Wzmocniłem `gra/tools/army-merge-panel-scroll-real-render-test.cjs`: przypadki 40 jednostek zastąpiłem 53 istniejącymi jednostkami (54 wiersze z przybywającą jednostką) dla 900×620 oraz 600×413 CSS px przy DPR 1.5. Test mierzy marginesy, scroll container, dostępność ostatnich wierszy, widoczność/klik obu akcji i callback scalania. Zachowano negatywną kontrolę z mutacją starego layoutu.

## Weryfikacja

Z `gra/`:

- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **26 passed, 0 failed**. W scenariuszu 150% panel zachował margines górny 28.24 px i dolny 27.95 px; 53 jednostki i ostatni wiersz były osiągalne, oba CTA pozostały widoczne, a przycisk scalania wywołał callback.
- `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0.
- `git diff --check -- gra/tools/army-merge-panel-scroll-real-render-test.cjs` — exit 0.

Zależności testowe zainstalowano przez `npm ci`; `node_modules` jest lokalnym, ignorowanym artefaktem.

## Pliki i hash

Jedyny plik kodu/testu zmieniony w tej rundzie: `gra/tools/army-merge-panel-scroll-real-render-test.cjs` — SHA-256 `18ca0d053db2a1e15ea9c4e0b61bb2c5b9536110efcedc135c65edb0897b839d`.

Nie ma zmian produktu, ponieważ test dowodzi, że wymagane zachowanie już istnieje na wskazanej opublikowanej bazie. Raport nie jest werdyktem Evaluatora ani zgodą na integrację.
