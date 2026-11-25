# R-WEB-HUD-ME-EMPIREHUD-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (naprawa błędu, hotseat)
TEMAT: R-WEB-HUD-ME-EMPIREHUD-Q1
GOAL: getEmpireHud (panel imperium) przestaje czytać literał 0 jako gracza aktywnego; czyta fotel `oid`. Jednoosobowa gra bit-w-bit bez zmian.
BAZA: 81ec4a300 (origin/main, FALA 900)
ZMIANY/COMMIT: patrz sekcja ZMIANY poniżej; SHA commita podany w raporcie zwrotnym do orkiestratora.

## ZMIANY (gra/src/main.ts)

Funkcja `getEmpireHud` (w `boot`, obiekt `cfg` dla panelu miasta):

| Linia przed | Linia po | Uzasadnienie |
|---|---|---|
| `if (oid !== 0) return null;` | `if (!isHuman(oid)) return null;` | Guarda przepuszcza każdy fotel człowieka, nie tylko 0. Dla AI nadal `null` (jak dotąd). Single-player: jedyny człowiek = 0, więc wynik identyczny. |
| `const hs = buildHudState();` | `const hs = buildHudState(oid);` | `buildHudState(ownerId = ME())` już przyjmuje fotel; domyślny argument dawał ME(), a nie `oid`. |
| `const pc = cities.filter(c => c.ownerId === 0);` | `... c.ownerId === oid);` | Miasta panelu imperium fotela `oid`. |
| `const stateRel = ownerReligionForOwnerId(0);` | `... ownerReligionForOwnerId(oid);` | Religia państwa fotela `oid`. |

Funkcja `buildHudStateRaw` (ciało buildHudState, ~l. 24079):

| Linia przed | Linia po | Uzasadnienie |
|---|---|---|
| `const shortageRows = ownerId === 0` | `const shortageRows = isMe(ownerId)` | Literał 0 jako fotel aktywny. Wynik nie zmienia się: obie gałęzie dają te same wiersze dla `ownerId === 0` (`storedResourceRows` = `buildEmpireResourceRows(ownerId)` po tym samym filtrze). Zmiana porządkowa. |

Przegląd pokrewnych miejsc (grep `ForOwnerId(0)`, `ownerId === 0`, `oid !== 0`, `c.ownerId === 0` w pobliżu funkcji getEmpire*/build*Hud*):
- `buildHudStateRaw`: pozostałe odczyty już są po `ownerId`/`ps`/`isMe` (sprawdzone testem strażnikiem z poprzednich FAL). Zmieniono tylko linię `shortageRows`.
- `buildAudienceOtherRelations` (~l. 9163, `w.ownerId === 0`): NIE zmieniano. Dotyczy wojen w widoku dyplomacji/audiencji, nie HUD imperium.
- `onBudowaListaLoadAllCities` (~l. 10048, `cities.filter(c => c.ownerId === 0)`): NIE zmieniano. Akcja UI „wgraj listę do wszystkich miast”, poza zakresem tematu (nie getEmpire*/build*Hud*). UWAGA dla orkiestratora: w hotseat to też literał gracza aktywnego, do osobnego tematu.
- ~l. 4504–20463 (rekrutacja, budowa, handel, komunikaty `ownerId === 0`): NIE analizowano szczegółowo, poza zakresem. UWAGA dla orkiestratora (np. ~l. 20463 `civType` dla `ownerId === 0`).

## TESTY

Strażnik `gra/tools/hud-me-literal-zero-test.cjs` (rozszerzony): kotwica po sygnaturze `getEmpireHud: (oid: number) => {`, ciało wycinane po nawiasach, komentarze usunięte. Nowe kontrole: 4 linie wymagane + brak literałów 0 w ciele + `shortageRows = isMe(ownerId)` w buildHudStateRaw.

Test źródłowy hotseat `gra/tools/hud-owner-hotseat-source-test.cjs` (rozszerzony): guarda `isHuman(oid)`, `buildHudState(oid)`, `c.ownerId === oid`, `ownerReligionForOwnerId(oid)`; brak `ownerId === 0`, `ForOwnerId(0)`, `buildHudState()` w ciele getEmpireHud.

Mutacje (każda linia cofnięta na kopii main.ts w katalogu scratchpad; oryginał nietknięty):

| Mutant | Cofnięta linia | hud-me-literal-zero | hud-owner-hotseat |
|---|---|---|---|
| m1 | guarda `oid !== 0` | 2 FAIL | 1 FAIL |
| m2 | `buildHudState()` | 2 FAIL | 2 FAIL |
| m3 | filtr miast `ownerId === 0` | 2 FAIL | 2 FAIL |
| m4 | `ownerReligionForOwnerId(0)` | 2 FAIL | 2 FAIL |
| m5 | `shortageRows = ownerId === 0` | 1 FAIL | 0 FAIL (poza zakresem tego testu; wyłapuje strażnik literal-zero) |

Każda zmieniona linia ma czerwoną mutację. Baseline (bez mutacji): literal-zero 79 PASS / 0 FAIL, hotseat-source 51 PASS / 0 FAIL.

Bramki (z surowego wyjścia, uruchomione w worktree po `npm ci` w gra/):

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` | exit 0, brak błędów |
| logic-test | LOGIC OK (213/213) |
| tech-tree-test | 20 pass, 0 fail |
| research-test | PASSED 33 / FAILED 0 |
| unit-replace-test | 21/21 zielone |
| combat-test | 6/6 pass |
| ai-test | 297 passed, 0 failed |
| hud-moc-warstwa-test | 28 PASS, 0 FAIL |
| hud-me-literal-zero-test | 79 PASS, 0 FAIL |
| hud-owner-hotseat-source-test | 51 PASS, 0 FAIL |
| moc-ranking-rozjazd-test | 19 PASS, 0 FAIL |
| war-rules-multiwar-main-guard-test | 21 PASS, 0 FAIL |
| hotseat-etap6d e-source | 77 PASS, 0 FAIL |
| hotseat-etap6d B-exec | 48 PASS, 0 FAIL |
| hotseat-etap6d D-exec | 46 PASS, 0 FAIL |
| hotseat-etap6d E-exec | 24 PASS, 0 FAIL |
| bramki-tmpdir-unikalnosc-test | PASS=18 FAIL=0 |

NIE ZMIERZONO: runtime hotseat (panel imperium dla fotela ≠ 0 w przeglądarce) — brak uruchomionej gry w tej rundzie. Dowód jest źródłowy i testowy. Bit-w-bit w single-player wynika z kodu: ME() = HUMAN_OWNER_PRIMARY = 0, więc `buildHudState(oid)` dla oid 0 = `buildHudState()`, a `isHuman(0)` jest prawdą dla jedynego fotela człowieka. Nie uruchamiano testów live.

Usunięto `gra/node_modules` po bramkach. `npm run build`/`dev` nie uruchamiano. `git diff --check` czysty.

## BLOKADY
Brak.

## RUNDY
1/5. Werdykt: nie dotyczy (runda Operatora).

## NASTĘPNY KROK
Evaluator: przejrzeć zmianę 4 linii w getEmpireHud i wycofanie literału w buildHudStateRaw; sprawdzić, czy `isHuman` jest w zasięgu wywołania (tsc przeszedł, więc tak).
Final Control: decyzja o deployu po integracji orkiestratora (poza tym tematem).

## UWAGI-DLA-ORKIESTRATORA
- `onBudowaListaLoadAllCities` (~l. 10048) i miejsca `ownerId === 0` w zakresie ~4504–20463 nadal są literałami 0 w akcjach/komunikatach gracza. Nie w zakresie tego tematu. Warto osobny temat hotseat.
- `buildAudienceOtherRelations` (~l. 9163) ma `w.ownerId === 0` (wojny widoku dyplomacji). Sprawdzić w osobnym temacie, czy to literał gracza aktywnego.
- Runtime hotseat dla panelu imperium: NIE ZMIERZONO.

DEPLOY/PUSH: NIE WYKONANO
