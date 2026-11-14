# R-WEB-DETERMINISM-SAME-SEED-AUDIT-Q1 — DODATEK orkiestratora (runda 1)

## Co wiemy (z W35 r4, 10-operator-claude.md i 20-evaluator-claude.md, zarzut 1)
- Trzy przebiegi ziarna 2222, relacja 20, 30 tur: oferta handlowa AI w t25 (tryb normalny i przyspieszony) albo w t26 (freshprofile, noprofile-B, freshprofile-B). Porównanie fast vs fast też się rozjeżdża od ok. tury 24.
- Przebiegi odbywają się w Chromium za ?civTest=1 z hakami z gra/src/game/civ-test-hooks.ts i gra/src/main.ts (civTestSeedOverride).

## Zadania
1. Przejrzyj kod pod kątem źródeł niedeterminizmu w głównej pętli tury i w AI/dyplomacji/handlu: Math.random, Date.now/performance.now, crypto.getRandomValues, kolejność iteracji po Map/Set/obiektach zależna od czasu wstawiania lub identyfikatorów, setTimeout/requestAnimationFrame wpływające na stan, sortowania bez stabilnego klucza, losowość w profilach AI/ziarno profilu. Dla każdego znaleziska: plik:linia, czy wpływa na stan gry (nie tylko na render/dźwięk), czy używa ziarna gry (seeded) czy globalnego Math.random.
2. Wykonaj pomiar rozbieżności: runner z gra/tools/measure-ai-trade-offer-frequency*.cjs lub nowe narzędzie gra/tools/determinism-probe.cjs: ten sam stan startowy, ≥3 przebiegi po 30–40 tur, porównanie skrótu stanu (np. liczba miast, jednostek, stan skarbca, relacje) co turę; wskaż PIERWSZĄ turę rozbieżności i które pole się rozjechało. Nie używaj npm run build/dev; przeglądarka Chromium tylko jak istniejące narzędzia (gra/tools).
3. Zawęź do 1–3 najbardziej prawdopodobnych przyczyn z dowodem (np. mutacja diagnostyczna na kopii: zastąpienie podejrzanego Math.random stałym ziarnem i ponowny pomiar — ZMIANA TYLKO W KOPII WORKTREE, nie w commicie).
4. Zaproponuj minimalną naprawę (plik:linia, opis) jako dispatch osobnego tematu; oszacuj ryzyko dla istniejących testów i zapisów.

## Kryteria końca (binarne)
- 10-operator-claude.md z punktami 1–4, każdy fakt z plik:linia lub surowym wynikiem pomiaru; pierwsza tura rozbieżności podana liczbą.
- git diff --name-only względem bazy: tylko allowlista.
- tsc nie jest wymagany (brak zmian w gra/src); jeśli dodasz narzędzie, node --check.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; Chromium pre-instalowany (playwright); ZAKAZ npm run build/dev. Dysk bywa < 5 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
