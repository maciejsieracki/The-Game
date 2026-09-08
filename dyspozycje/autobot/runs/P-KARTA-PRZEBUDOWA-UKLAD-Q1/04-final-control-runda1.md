STATUS: PASS
DOMAIN: GAME
TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-Q1
GOAL: Wdrożyć zaakceptowany nowy układ (kolejność sekcji) kart budynków i jednostek w
`gra/src/ui/entityCards/` — infrastruktura/renderer/adaptery, bez autorstwa nowej treści.

WERDYKT: 1 -> ODDAL (obrona obaliła dowodem — poprawka faktycznie wdrożona i zweryfikowana
niezależnie)

DOWÓD WŁASNEJ WERYFIKACJI: Niezależny skrypt (esbuild+Playwright, tymczasowy, usunięty po
użyciu) — nie kopia istniejącego testu. Wynik dla `building/stolarnia` i `unit/wojownik`:
`hasLiteralAnywhere: true`, dokładny tekst „Rys historyczny" obecny w 2 węzłach (`H3`+`SPAN`),
zgodnie z wzorcem `buildSectionEl`. Kolejność DOM `body.children` obu kart: building =
`requirements → __historia__ → characteristics → yield → cost-build → cost-upkeep → levels`;
unit = `requirements → __historia__ → characteristics → combat → combat-advanced → counters →
cost-recruit → cost-upkeep → statuses` — dokładnie zgodne z zaakceptowanym układem. Dodatkowo
`technology/Łowiectwo`: `actions → __historia__ → improvements → next` — potwierdza wspólny
punkt pozycjonowania działa też poza building/unit.

ZMIANY-COMMIT: HEAD `359cee44` na `autobot/P-KARTA-PRZEBUDOWA-UKLAD-Q1`, worktree czysty.
`git diff --stat origin/main...HEAD`: wyłącznie pliki z allowlisty. Zero diff potwierdzony
samodzielnie dla `technologyAdapter.ts`, `improvementAdapter.ts`, `wonderAdapter.ts`,
`cityPanel.ts`, `unitInfoCard.ts`.

TESTY (uruchomione samodzielnie): `tsc --noEmit` 0 błędów. 5 bramek referencyjnych zielone.
`entity-card-contract-test.cjs` 75/0. `entity-card-historia-section-test.cjs` 36/36. Migration
testy 54/1 i 38/2 — porównane z czystym checkoutem `origin/main` (ten sam plik testu z
brancha): tam 51/1 i 37/2 — treść obu FAIL identyczna słowo w słowo w obu miejscach (dot.
`playerFacingNote`/„Uwagi" w `cityPanel.ts`, plik z zerowym diff) — różnica w liczbie PASS to
wyłącznie nowe asercje dodane w tej rundzie, fail-count identyczny, brak regresji.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora (merge do main) → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
