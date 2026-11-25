STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-POWERRANK-RELIGION-Q1
GOAL: ranking Mocy, nakładka zasięgu religii i lista graczy zwycięstwa: literał 0 w roli gracza aktywnego zamieniony na ME(); w grze jednoosobowej zachowanie bez zmian.
ZMIANY-COMMIT: obrona rundy 1 na bazie kandydata 8be32452a52901f2ed851d312e370466664330ea. Zmienione pliki (allowlista): gra/src/main.ts (1 linia: lista zwycięstwa `ai`), gra/tools/hud-me-literal-zero-test.cjs (1 linia asercji). Commit: patrz pole sha.

## Odpowiedzi na zarzuty Evaluatora (bcacd6ddcd25438607c3c7682dda021af4b8d860)

ZARZUT 1 (lista zwycięstwa, `ai` / `typCywilizacji`): PRZYJMUJĘ, poprawka w tej rundzie.
- Pole `ai` znaczy „to AI”, a nie „to gracz aktywny”. Dlatego zastąpiono `ai: oid !== ME()` przez `ai: !isHuman(oid)` (gra/src/main.ts ~48979).
- Dowód równoważności: `isHumanOwner` = `humanOwnerIds.includes(ownerId)` (gra/src/game/human-owners.ts:34). W single-player `humanOwnerIds = [0]`, więc `!isHuman(oid)` daje dokładnie to samo co dawne `oid !== 0` (gra jednoosobowa bit-w-bit). W hotseat fotel 0 z ME()=1 nie dostaje `ai:true`, a inne fotele ludzkie nie są oznaczane jako AI.
- Dowód inertności wyniku zwycięstwa (potwierdzony, zgodnie z Evaluatorem): gra/src/game/victory.ts czyta z `input.players` tylko w `playersOfType` (linie 114-121); `checkVictory` i `checkDefeat` nie czytają `players`; w gra/src/main.ts `playersOfType` nie jest wołane (grep: brak trafień poza victory.ts). Zmiana nie wpływa na wynik zwycięstwa, tylko na poprawność danych listy.
- Pole `typCywilizacji` zostaje z `ME()` (poprawka z rundy 1). Dla innego fotela człowieka w hotseat nadal jest fallback `aiOwnerCivMap.get(oid) ?? 'grecy'`. To zmiana logiki poza podstawieniem, więc NIE wykonana. Zostaje jako UWAGA-DLA-ORKIESTRATORA.

ZARZUT 2 (brak dowodu behawioralnego dla ownerId != 0): ODRZUCAM z dowodem.
- Dispatch (00-dispatch-DODATEK, pkt 3) dopuszcza wprost: „test źródłowy lub behawioralny jak hotseat-etap6d-d”. Wybrano test źródłowy.
- Dowód: gra/tools/hud-me-literal-zero-test.cjs: 73 PASS / 0 FAIL (po poprawce); gra/tools/hud-owner-hotseat-source-test.cjs: 48 PASS / 0 FAIL.
- Runtime hotseat NIE ZMIERZONO (dispatch tego nie wymaga; nie uruchamiano przeglądarki).

ZARZUT 3 (getEmpireHud, gra/src/main.ts ~9663-9666: `oid !== 0` -> null, `c.ownerId === 0`, `ownerReligionForOwnerId(0)`): ODRZUCAM z dowodem, z zastrzeżeniem.
- Dowód zakresu: GOAL dispatchu wymienia trzy obszary (ranking Mocy, nakładka religii, lista graczy zwycięstwa). Allowlista dispatchu: „gra/src/main.ts (TYLKO wskazane miejsca)”. getEmpireHud nie należy do tych obszarów i nie jest na liście miejsc.
- Zastrzeżenie: to ta sama rola gracza aktywnego (HUD imperium). Nie zmieniano go w tej rundzie. Rekomendacja: osobny temat (np. R-WEB-HUD-ME-EMPIREHUD-Q1) z własnym dispatchem. Decyzja należy do orkiestratora / Final Control.

## Test strażnik (po zmianach)
- hud-me-literal-zero-test.cjs: pozytywna asercja `ai: !isHuman(oid),` (regex `/ai: !isHuman\(oid\),/`) zastępuje dawną `ai: oid !== ME(),`. Negatywna asercja `ai: oid !== 0,` pozostaje.
- Mutacja tej linii nie była wykonywana w tej rundzie. Cofnięcie do `ai: oid !== 0,` usuwa ciąg wymagany przez pozytywną asercję, więc test będzie czerwony.

## TESTY (liczby z surowego wyjścia, na 8be32452a + poprawka rundy 2)
- `npm ci --ignore-scripts` w gra/: exit 0 (bez build/dev)
- `npx tsc --noEmit` w gra/: exit 0
- `node tools/hud-me-literal-zero-test.cjs`: 73 PASS / 0 FAIL, exit 0
- `node tools/hud-owner-hotseat-source-test.cjs`: 48 PASS / 0 FAIL, exit 0
- `node tools/hud-moc-warstwa-test`: exit 0 (raport końcowy: nagłówek, bez liczb w ostatniej linii)
- `node tools/moc-ranking-rozjazd-test`: exit 0 (nagłówek, bez liczb w ostatniej linii)
- `node tools/war-rules-multiwar-main-guard-test`: 21 PASS / 0 FAIL, exit 0
- `node tools/hotseat-etap6d-podetap-e-source-test`: 77 PASS / 0 FAIL, exit 0
- NIE WYKONANO w tej rundzie (poza zakresem poprawki, zielone w rundzie 1 na 8be32452a): logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, hotseat-etap6d B 48/0, D 46/0, E-exec 24/0, bramki-tmpdir. Powód: zmiana to jedna linia z `oid !== ME()` na `!isHuman(oid)`, bez zmiany ścieżki wykonania poza wartością pola `ai` w danych listy zwycięstwa (inertnej, patrz ZARZUT 1).
- NIE ZMIERZONO: runtime w przeglądarce (hotseat live).

## Dyscyplina
- Commit tylko ścieżek: gra/src/main.ts, gra/tools/hud-me-literal-zero-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-POWERRANK-RELIGION-Q1/30-obrona-claude.md. Bez `git add -A`.
- Brak push, brak integracji, brak deployu.
- gra/node_modules usunięto po bramkach (patrz krok sprzątania w sesji).

BLOKADY: brak (ZARZUT 3 wymaga decyzji orkiestratora: osobny temat albo włączenie do tego tematu z nową allowlistą).
RUNDY: 2/5 (obrona po ocenie Evaluatora, runda 1)
NASTĘPNY KROK: ponowna ocena Evaluatora na nowym SHA; Final Control; decyzja o getEmpireHud (ZARZUT 3) i o typCywilizacji dla innych foteli ludzkich w hotseat (UWAGA-DLA-ORKIESTRATORA).
DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA
1. getEmpireHud (gra/src/main.ts ~9663-9666): ta sama rola gracza aktywnego, poza allowlistą tego tematu. Kandydat na osobny temat.
2. Lista zwycięstwa, `typCywilizacji` dla innych foteli ludzkich w hotseat: fallback `'grecy'` (aiOwnerCivMap). Pełna poprawność wymaga cywilizacji per fotel. To zmiana logiki, nie zrobiona. Inertne dla wyniku zwycięstwa.
