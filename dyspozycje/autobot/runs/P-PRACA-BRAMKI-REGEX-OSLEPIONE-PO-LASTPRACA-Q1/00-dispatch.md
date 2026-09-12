TEMAT:  P-PRACA-BRAMKI-REGEX-OSLEPIONE-PO-LASTPRACA-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: PROCESS/GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Final Control tematu `P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1`
(zintegrowane, commit `54f297dc`): dwie istniejące bramki regresyjne —
`gra/tools/praca-pula-rate-parity-test.cjs` i
`gra/tools/praca-auto-ulepszenia-koszt-split-test.cjs` — dopasowują wynik
literalnym regexem do STAREGO kształtu kodu (np. wzorzec
`_lastPracaRate -= pick.kosztPraca;`), który po migracji cache Pracy na
per-fotel zmienił się na semantycznie identyczny, ale inaczej zapisany
`setOwnerLastPracaRate(hOid, ownerLastPracaRate(hOid) - pick.kosztPraca)`.
Final Control potwierdził czytaniem kodu + własną numeryczną symulacją, że to
NIE jest regresja funkcjonalna (0 fail w obu bramkach dziś), ale same bramki
straciły zdolność wykrywania PRZYSZŁEJ regresji w tym miejscu — utraciły swój
cel ochronny bez zauważenia. Nie wymaga ABC (czysto techniczna naprawa testu).

## GOAL

Zaktualizować wzorce regex w obu plikach testowych do NOWEGO kształtu kodu
(akcesory `setOwnerLastPracaRate`/`ownerLastPracaRate` i analogiczne per-fotel
wywołania), tak żeby bramki znów realnie wykrywały regresję w tym miejscu —
BEZ zmiany semantyki żadnej asercji (co test sprawdza ma pozostać identyczne,
zmienia się WYŁĄCZNIE dopasowanie źródła).

## DOKŁADNE MIEJSCA

1. `gra/tools/praca-pula-rate-parity-test.cjs` — znajdź regex/wzorzec
   dopasowujący stary kształt `_lastPracaRate -= ...`/`_lastPracaRate = ...`
   w `main.ts` i zaktualizuj do wzorca pasującego do
   `setOwnerLastPracaRate(...)`/`ownerLastPracaRate(...)` (dokładny kształt
   sprawdź w `main.ts` po commicie `54f297dc` — nie zgaduj, przeczytaj kod).
2. `gra/tools/praca-auto-ulepszenia-koszt-split-test.cjs` — analogicznie, dla
   `_lastPracaAutoUlepszeniaKoszt` → jego akcesora per-fotel.
3. Zweryfikuj, czy oba testy MUTANT-TESTUJĄ (czy faktycznie czerwienieją, gdy
   tymczasowo popsujesz logikę, którą mają chronić) — jeśli nie, to jest
   dowód że naprawa faktycznie przywróciła zdolność wykrywania regresji, nie
   tylko dopasowanie tekstu.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Oba pliki testowe dopasowują AKTUALNY (2026-09-12) kształt kodu w
   `main.ts` — zero fałszywych negatywów z powodu przestarzałego regexu.
2. Semantyka obu asercji NIEZMIENIONA — testy sprawdzają dokładnie to samo
   zachowanie ekonomiczne co przed tą naprawą, tylko innym wzorcem
   dopasowania źródła.
3. Dowód mutant-testingu: dla KAŻDEGO z dwóch testów pokazane, że tymczasowa
   celowa mutacja odpowiedniej linii `main.ts` (np. zmiana znaku, usunięcie
   wywołania) powoduje czerwony wynik testu, a przywrócenie oryginału —
   zielony.
4. `tsc --noEmit` 0 błędów (te pliki to `.cjs`, ale sprawdź czy nie psujesz
   nic innego).
5. Oba testy zielone na aktualnym `origin/main` (bez mutacji).
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
7. `hotseat-etap6c-lastpraca-per-fotel-test.cjs` bez regresu (to bramka
   siostrzana z tego samego obszaru — upewnij się że nie kolidujesz).

## DOWÓD

Log z uruchomienia obu testów PRZED i PO mutacji (4 przebiegi: oryginał
zielony ×2, zmutowany czerwony ×2) — czysto tekstowy, bez Chromium (to testy
node/headless).

## Allowlista

- `gra/tools/praca-pula-rate-parity-test.cjs`
- `gra/tools/praca-auto-ulepszenia-koszt-split-test.cjs`

Zakazane: `gra/src/**` (zero zmian w kodzie produkcyjnym — to naprawa TYLKO
testów), `gra/data/*.json`, pliki z sekretami, `docs/decyzje/*.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## Izolacja

Worktree `/home/user/wt-praca-bramki-regex-oslepione`, gałąź
`autobot/P-PRACA-BRAMKI-REGEX-OSLEPIONE-PO-LASTPRACA-Q1`, baza `origin/main`.
C-001: zakaz `npm run build`/`dev` w `gra/`; ten temat nie wymaga builda
(zmiana wyłącznie w plikach `.cjs`), ale `tsc --noEmit` dozwolony jako
kontrola.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 300 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
