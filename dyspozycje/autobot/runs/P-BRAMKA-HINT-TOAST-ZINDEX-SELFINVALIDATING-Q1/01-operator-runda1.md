# P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1 — Operator, runda 1

## Recon (GOAL pkt 1-2)

`buildBeforeBundle` (main.ts:12303 formuła) szukał `origin/main:gra/src/main.ts` jako "PRZED".
Znaleziono w kodzie naprawy: commit `3dc1b31f` ("R-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1")
wprowadził fix (`git log --all -S`). Jego rodzic, `8c20c849`, to dokładny stan main.ts
SPRZED naprawy. Zweryfikowano: `git log --all` widzi pełną historię (3735 commitów, brak
ograniczenia sparse-checkout na historię — sparse dotyczy tylko working tree), `8c20c849`
jest ancestorem `origin/main` (`git merge-base --is-ancestor` -> tak) i nie ma tekstu fixu.

**Próba metody 2 (zamrożony SHA) — NIEUDANA, udokumentowana:** podstawienie CAŁEGO main.ts z
`8c20c849` przy bieżących plikach pomocniczych łamie build (`unitTriggersSisterAllianceThreat
is not exported by ai-cs-absorption.ts`) — te pliki ewoluowały niezależnie od naprawy z-index.
Historia jest osiągalna, ale całe drzewo z tamtego punktu nie jest już spójne z bieżącym kodem.

## Rozwiązanie (GOAL pkt 3, wzorzec mutacyjny)

`buildBeforeBundle` cofa WYŁĄCZNIE jedną linię formuły z-index (string replace na dokładnym
literale `FIXED_ZINDEX_LINE` -> `BROKEN_ZINDEX_LINE`, zweryfikowanym `git show 8c20c849`) w
kopii bieżącego main.ts w pamięci; reszta drzewa (w tym zależności) zostaje bieżąca. Zapis na
dysk otacza wyłącznie build, przywrócenie w `finally`. Jeśli oczekiwana naprawiona linia
zniknie z main.ts (formuła zmieniona gdzie indziej) — jawny `Error`, nie cichy fałszywy wynik.
Wszystkie asercje z-index/kolejności nakładania (1)-(4) zachowane bez osłabienia.

## Dowód NA ŻYWO przeciw samooszukiwaniu

1. Normalny stan (fix obecny): `node tools/hint-toast-zindex-empire-panel-test.cjs` ->
   **18 pass · 0 fail**, kończy się PEŁNYM wynikiem, brak wyjątku.
2. Sztuczne cofnięcie fixu w `src/main.ts` (kopia przez `cp` + Python replace, nie
   `git checkout`) i ponowne uruchomienie tej samej bramki na TAK zmutowanym pliku ->
   asercja (4) **FAIL** + jawny `Error` w `buildBeforeBundle` ("main.ts nie zawiera
   oczekiwanej naprawionej linii") — bramka realnie CZERWIENIEJE, nie przechodzi po cichu.
3. `src/main.ts` przywrócony z kopii zapasowej, `git diff --stat src/main.ts` pusty (zero
   trwałych zmian w `gra/src/**`), harness uruchomiony ponownie -> **18 pass · 0 fail**.

## Testy

- `node tools/hint-toast-zindex-empire-panel-test.cjs` -> 18 pass / 0 fail (dwukrotnie,
  przed i po dowodzie mutacyjnym).
- `npx tsc --noEmit` (gra/) -> czysto, exit 0.
- 5 bramek referencyjnych: logic-test, tech-tree-test, research-test, unit-replace-test,
  combat-test -> wszystkie exit 0.
- `git status --porcelain` w worktree: wyłącznie `gra/tools/hint-toast-zindex-empire-panel-test.cjs`
  zmieniony; `gra/src/**` bez zmian.

## Blokady

Brak.
