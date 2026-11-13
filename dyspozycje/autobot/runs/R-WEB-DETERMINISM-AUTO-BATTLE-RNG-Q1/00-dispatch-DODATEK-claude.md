# R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — DODATEK orkiestratora (runda 1)

Przeczytaj dispatch: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/00-dispatch.md`. Poprzedni temat: raporty w commicie ff25b42ad (`git show ff25b42ad:dyspozycje/autobot/runs/R-WEB-DETERMINISM-GAME-RNG-Q1/10-operator-claude.md`, 30-obrona, evidence), wyjątki w gra/tools/determinism-same-seed-test.cjs (sekcja WYJATKI).

## Wymagane
1. Rozpoznaj wywołania: auto-battle-power.ts:156 (resolveAutoBattleByPower — z main.ts 6×, mapFieldBattle.ts:476, wpływa na stan), combat.ts:890, siege.ts:659 (domyślny rng — wylistuj WSZYSTKICH wołających i czy podają rng), ai.ts:3215 aiFoundingRand. Dla każdego: czy wpływa na stan gry (tak/nie), czy używa strumienia z ziarna.
2. Naprawa: strumień z game-rng.ts (ziarno gry + tura + identyfikator walki/właściciela), bez zmiany rozkładu losowości dla gracza i bez zmiany zasady „Trafienia: losowe / pewne”. Wyjątki z testu źródłowego usuń, gdy naprawione; pozostałe uzasadnij.
3. Rozszerz skrót stanu w runnerze pomiarowym o liczbę jednostek, skarbiec i zasoby (Evaluator poprzedniego tematu to wytknął) i powtórz pomiar: ziarno 2222 i drugie ziarno, tryb przyspieszony ≥ 6 przebiegów i normalny ≥ 3, ≥ 40 tur; podaj pierwszą turę rozbieżności i pole, jeśli zostanie.
4. Mutacje pojedyncze: dla każdego z poprawionych miejsc mutacja (powrót do Math.random) musi zaczerwienić test źródłowy; minimum jedna mutacja musi też zmienić wynik pomiaru przebiegów.
5. Ryzyko kolizji _detIdSeq po wczytaniu zapisu w tej samej turze (uwaga z poprzedniego tematu): sprawdź i opisz; napraw tylko jeśli w allowliście i bezpieczne.

## Kryteria końca (binarne)
tsc 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 (combat-test używa losowości — przepisz asercje tylko jeśli zależą od konkretnej wartości); determinism-same-seed-test zielony z mniejszą listą wyjątków; pomiar: wszystkie przebiegi jednej konfiguracji mają ten sam skrót (surowe wyniki w evidence/).

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno; Chromium jak istniejące narzędzia, ≤ 590 s w pierwszym planie. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
