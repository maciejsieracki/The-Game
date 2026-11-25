STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-POWERRANK-RELIGION-Q1
GOAL: ranking Mocy, nakładka zasięgu religii i lista graczy zwycięstwa: literał właściciela 0 w roli gracza aktywnego zastąpiony przez ME() (hotseat). W grze jednoosobowej ME() === 0 (HUMAN_OWNER_PRIMARY), zachowanie bit-w-bit bez zmian.
ZMIANY/COMMIT: baza origin/main 0ad95c3050bfc28102321e35bd7fead4722e6556; zmienione pliki: gra/src/main.ts (7 linii w 5 miejscach), gra/tools/hud-me-literal-zero-test.cjs (+29 linii, nowe asercje). Commit: patrz sekcja SHA poniżej.

## Przed / po (gra/src/main.ts)
| # | Miejsce (funkcja) | Przed | Po | Uzasadnienie |
|---|---|---|---|---|
| 1 | buildAbsolutePowerRank (ranking Mocy), pole `civ` | `oid === 0 ? civDisplayNameForKey(civKeyForOwner(0)) : ownerDiploLabel(oid)` | `oid === ME() ? civDisplayNameForKey(civKeyForOwner(oid)) : ownerDiploLabel(oid)` | 0 = gracz aktywny; civKeyForOwner(oid) == civKeyForOwner(0) dla ME()=0 |
| 2 | buildAbsolutePowerRank, pole `isPlayer` | `isPlayer: oid === 0` | `isPlayer: oid === ME()` | oznaczenie wiersza „gracz” w rankingu |
| 3 | buildPowerDiag (diag MOC AI), `labelForOwner` | `oid === 0 ? civDisplayNameForKey(civKeyForOwner(0))` | `oid === ME() ? civDisplayNameForKey(civKeyForOwner(oid))` | etykieta gracza aktywnego |
| 4 | rebuild nakładki religii, `ownerReligionForOwnerId` | `ownerReligionForOwnerId(0)` | `ownerReligionForOwnerId(ME())` | religia państwa gracza aktywnego |
| 5 | rebuild nakładki religii, `collectReligionRangeHexKeys(..., 0)` | ostatni argument `0` (ownerId) | `ME()` | zasięg religii liczony dla właściciela aktywnego |
| 6 | lista graczy zwycięstwa (sprawdzanie zwycięstwa), `typCywilizacji` | `oid === 0 ? player.civType : …` | `oid === ME() ? player.civType : …` | cywilizacja gracza aktywnego |
| 7 | lista graczy zwycięstwa, `ai` | `ai: oid !== 0` | `ai: oid !== ME()` | rola „nie-gracz aktywny” (patrz UWAGA 1) |

Test klasyfikacji (grep `oid === 0`, `civKeyForOwner(0)`, `ForOwnerId(0)`) — miejsca ZOSTAWIONE bez zmiany (0 nie jest gracza aktywnego lub poza allowlistą):
- gra/src/main.ts:9663 i 9666 `getEmpireHud`: `if (oid !== 0) return null;` oraz `cities.filter(c => c.ownerId === 0)` i `ownerReligionForOwnerId(0)` — to ta sama rola gracza aktywnego (HUD imperium), ale NIE było na liście dispatchu i allowlista wskazuje konkretne miejsca. Kandydat na kolejną falę (patrz UWAGI).
- :8551 `civBonusyForOwnerId(0)`, `:40488 playerCivKey: civKeyForOwnerId(0)`, `:42048 attackerCivBonusy: civBonusyForOwnerId(0)` — kontekst walki/bonusów bez ME(); poza listą, do osobnego przeglądu.
- :25515 `.filter(oid => oid !== 0)`, :26718 `if (oid === partnerId || oid === 0) continue;`, :45175 `if (oid === 0 || up <= 0) continue;`, :46049 `return [0, ...aiOwnerList.filter(oid => oid !== 0)];` — wyliczanie właścicieli / partnerów dyplomacji / lista AI; 0 tu jest identyfikatorem gracza, nie rolą wyświetlania; zostawione (dispatch: „zamierzony fotel 0 / indeks” — nie zmieniane).

## Dowód hotseat
- Ranking Mocy: dla oid ≠ ME() etykieta to `ownerDiploLabel(oid)`, a gracz aktywny dostaje `civDisplayNameForKey(civKeyForOwner(oid))` i `isPlayer` tylko dla `oid === ME()` — test strażnik sprawdza obecność tych linii.
- Nakładka religii: `ownerReligionForOwnerId(ME())` i `collectReligionRangeHexKeys(..., ME())` — zasięg liczony dla właściciela aktywnego (funkcja filtruje miasta po `c.ownerId !== ownerId`, więc ME() daje zasięg miast ME()).
- Dowód behawioralny (hotseat-etap6d e-source/B/D/E) — zielony, patrz TESTY. Nie dodano nowego testu behawioralnego ownerId≠0 (poza zakresem tej rundy); dowód = asercje źródłowe + mutacje.

## Test strażnik
gra/tools/hud-me-literal-zero-test.cjs: nowa sekcja POWERRANK — 7 asercji pozytywnych (jedna na każdą zmienioną linię) + 1 asercja negatywna (brak starych literałów: `civDisplayNameForKey(civKeyForOwner(0))`, `isPlayer: oid === 0,`, `const stateRel = ownerReligionForOwnerId(0);\n… collectReligionRangeHexKeys(`, `rangeCityInputs(), cityRelig, stateRel, rp, 0,`, `typCywilizacji: oid === 0 `, `ai: oid !== 0,`).
Mutacje (HUD_ME_GUARD_MAIN na kopii main.ts, każda zmieniona linia cofnięta do literału 0 osobno): civ → exit 1 (2 FAIL); isPlayer → exit 1 (2 FAIL); labelForOwner → exit 1 (2 FAIL); nakładka stateRel → exit 1 (2 FAIL); nakładka argument rp,0 → exit 1 (2 FAIL); typCywilizacji → exit 1 (2 FAIL); ai → exit 1 (2 FAIL). Wszystkie 7 czerwone.
gra/tools/hud-owner-hotseat-source-test.cjs NIE zmieniono (48/0 przed i po).

## TESTY (liczby z surowego wyjścia, na 0ad95c305 + zmiany)
- `npx tsc --noEmit` (gra/): exit 0
- logic-test: ostatni PASS [213] cityfix pop1 territory radius, exit 0 (wymagane 213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: exit 0 (cross-type melee matrix pass, 15 civ)
- combat-test: COMBAT TEST 6/6 pass
- ai-test: ai-test: 297 passed, 0 failed
- hud-moc-warstwa-test: WYNIK 28 PASS / 0 FAIL
- hud-me-literal-zero-test: 73 PASS / 0 FAIL, exit 0
- hud-owner-hotseat-source-test: Wynik 48 PASS / 0 FAIL
- moc-ranking-rozjazd-test: WYNIK 19 PASS / 0 FAIL
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hotseat-etap6d-podetap-e-source-test: 77 PASS / 0 FAIL
- hotseat-etap6d-podetap-b-exec-test: 48 PASS / 0 FAIL
- hotseat-etap6d-podetap-d-exec-test: 46 PASS / 0 FAIL
- hotseat-etap6d-podetap-e-exec-test: 24 PASS / 0 FAIL
- bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
- git diff --check: czysto
- Przed bramkami: `npm ci --ignore-scripts` w gra/ (bez build/dev); gra/node_modules usunięto po bramkach.
- NIE ZMIERZONO: runtime w przeglądarce (hotseat live, ranking/nakładka na żywo) — dispatch nie wymaga, brak ręcznego dowodu wizualnego.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control) weryfikuje diff 2 plików i bramki; po FC integracja orkiestratora (bez deployu tu).

## UWAGI-DLA-ORKIESTRATORA
1. Pozycja 7 (`ai: oid !== ME()`): w hotseat z WIELOMA fotelami człowieka inne fotele ludzkie zostaną oznaczone jako AI, a `typCywilizacji` dla nich dostanie fallback `'grecy'` (aiOwnerCivMap). Pełna poprawność wymaga `!isHuman(oid)` i cywilizacji per fotel — to zmiana logiki poza samym podstawieniem, więc NIE wykonana. Do decyzji orkiestratora / osobnego tematu.
2. getEmpireHud (gra/src/main.ts ~9663–9666: `oid !== 0` → null, `c.ownerId === 0`, `ownerReligionForOwnerId(0)`) — ta sama rola gracza aktywnego, poza allowlistą tego tematu. Kandydat na kolejną falę.
3. Wyjątki zostawione (patrz tabela) — 8551, 40488, 42048 (bonusy/civKey walki), 25515/26718/45175/46049 (wyliczanie właścicieli).

SHA: (ustawiony po commicie — patrz pole sha w odpowiedzi)
DEPLOY/PUSH: NIE WYKONANO
