# R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1 — raport obrony, runda 2 (Operator HAIKU, odpowiedź na zarzuty Evaluatora r2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render sceny bitwy taktycznej)
TEMAT: R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1
GOAL: generał armii na polu bitwy ma jasną gwiazdkę po obu stronach, także po Resecie rozstawiania (poprawka zarzutu FC r1). Zero zmian reguł, balansu i danych.
BAZA: kandydat r1 `ad422d889` (potomek `b160459c9`, `merge-base --is-ancestor` OK). Kod r2 = `33f91bd8e` (kod operatora: +1 linia `this._attachCommanderStar(group, bu);` w `_placeUnitsOneSide`, ok. linii 17905). Ten raport + test zmieniony w tym commicie.

## Odpowiedź na zarzuty Evaluatora r2

| Zarzut | Decyzja | Dowód |
|---|---|---|
| 1. Brak żywego Chromium dla Reset (1280x720, 1400x900) | PRZYJMUJĘ JAKO OTWARTY, NIE ZMIERZONO | W tej rundzie nie uruchomiono przeglądarki. Test `gra/tools/battle-commander-star-reset-test.cjs` działa na poziomie sceny (realna `_resetDeploySide` -> `_placeUnitsOneSide`), nie pikselowo. Zrzuty w `evidence/` pochodzą z r1 i nie pokazują Reset. Powód: harness żywego Chromium (`gra/tools/battle-doctrine-live-r3-test.cjs` jako wzór) wymaga osobnego buildu vite poza repo oraz hooka, który ustawia `isArmyCommander` na generale w presecie `bitwa_duza_pole` (preset nie ma generała). Ten krok nie został zrealizowany w tej rundzie. Decyzja orkiestratora: osobny przebieg Chromium albo akceptacja wyłącznie testu sceny. |
| 2. Test nie pokrywa sekwencji z DODATKU 1 pkt 2 | PRZYJMUJĘ, POPRAWIONE | Test przepisany: sekwencja **rozstaw -> Reset #1 (`_resetDeploySide`) -> ruch grupy -> Reset #2**. Po każdym kroku: dokładnie jeden generał ze gwiazdką, zwykłe bez, gwiazdka jest dzieckiem własnej grupy (`st.parent === ru.group`). Stub sceny: `_resetDeploySide` wywołuje realne `_placeUnitsOneSide`; stubowane są tylko UI-helpery (`_clearAllSelection`, `_clearDeploySelection`, `_rebuildDeployRosterGrid`, `_updateDeployRosterHeader`) i `scene.remove`. Wynik: `node tools/battle-commander-star-reset-test.cjs` -> `Wynik: 10 PASS, 0 FAIL`. Mutacja na kopii (usunięcie ostatniego wywołania `_attachCommanderStar` = ścieżka Reset) daje po Reset #1 `commanderStars = 0` -> test wykrywa regresję. Uwaga: „ruch” to przesunięcie grupy w renderze (`group.position.x += 2`), a nie logika ruchu gry. Asercja dotyczy tego, że gwiazdka pozostaje dzieckiem grupy. |
| 3. Regresja timeoutów battle-* na wydłużonym limicie | PRZYJMUJĘ, CZĘŚCIOWO ZMIERZONO | Przebiegi kandydata `33f91bd8e` z limitem `timeout 580` (osobne wywołania, < 590 s): `battle-natural-chariot-r5-test.cjs` rc=0 (161 s); `battle-natural-near-range-r6-test.cjs` rc=0 (72 s); `battle-pursuit-move-behavior-test.cjs` rc=0 (347 s, `13/13 pass, mutacje wykryte 6/6`); `battle-ranged-approach-regression-test.cjs` rc=0 (281 s). Cztery testy, które Evaluator wskazał jako niezmierzone, przechodzą na wydłużonym limicie. Pozostałe cztery timeouty (`collision-arbitration`, `full-move-strike`, `neverrout-hold`, `attack-move-pointer`) NIE zostały zmierzone przeze mnie w tej rundzie. Wg pomiaru Evaluatora (270 s / 560 s / 210 s) wyniki są identyczne na bazie `ad422d889` i na kandydacie, czyli są to przedistniejące długi, a nie regresja tego tematu. Nie zweryfikowałem tego ponownie. |

## ZMIANY-COMMIT

- `gra/tools/battle-commander-star-reset-test.cjs` (przepisany, sekwencja rozstaw -> Reset -> ruch -> Reset, mutacja na kopii, 10 PASS / 0 FAIL).
- `dyspozycje/autobot/runs/R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1/30-obrona-claude.md` (ten raport).
- Kod gry (`gra/src/battle/battleScene.ts`, `battleCommanderStar.ts`) nie zmieniony w tej rundzie: poprawka Reset jest już w `33f91bd8e`.
- Worktree po przebiegach regresji: przywrócone śledzone pliki artefaktów `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence/*` (`git checkout --`), nie dodane do commita.

## TESTY (surowe wyniki)

- `node tools/battle-commander-star-test.cjs` (test modułu, mutacje): `Wynik: 17 PASS, 0 FAIL`.
- `node tools/battle-commander-star-reset-test.cjs` (test sceny, sekwencja Reset): `Wynik: 10 PASS, 0 FAIL`, mutacja kopii: czerwona (zero generałów ze gwiazdką po Reset).
- `npm ci` w `gra/` (lokalnie w worktree, 71 pakietów). Nie uruchamiano `npm run build/dev`.
- tsc i 5 bramek referencyjnych NIE uruchomiono ponownie w tej rundzie: kod gry nie zmienił się względem `33f91bd8e`, a zmieniony jest tylko plik testu. Wyniki z rundy 1 i zarzutu Evaluatora (tsc 0, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) dotyczą kandydata `33f91bd8e`.
- Regresja `battle-*` na kandydacie (limit 580 s): patrz tabela, zarzut 3.

## BLOKADY

- Żywy Chromium (zrzuty Reset 1280x720 i 1400x900) nie wykonany: NIE ZMIERZONO. Wymaga osobnego przebiegu lub decyzji orkiestratora (patrz zarzut 1).
- Cztery timeouty (`collision-arbitration`, `full-move-strike`, `neverrout-hold`, `attack-move-pointer`) nie zmierzone przeze mnie na wydłużonym limicie; wynik porównawczy tylko z pomiaru Evaluatora.

## RUNDY

2/5. Ostatni werdykt FC r1: FAIL (brak gwiazdki po Reset). Ostatni werdykt Evaluatora r2: FAIL (3 zarzuty). Decyzja wymagana: czy wymagany jest żywy Chromium dla Reset przed READY_FOR_DEPLOY.

## UWAGI-DLA-ORKIESTRATORA

1. `manualBattle.ts:756` (`place()`) nie ma gwiazdki. Moduł nie jest importowany przez grę (zgodnie z raportem r1). Jeśli ma być podpięty, osobny temat.
2. Żywy Chromium: osobny temat z hookiem `isArmyCommander` dla generała w presecie (albo wybór innego presetu z generałem) i buildem vite poza repo. Nie jest to część tego raportu.
3. Cztery timeouty (`collision-arbitration`, `full-move-strike`, `neverrout-hold`, `attack-move-pointer`) są długiem istniejącym wg Evaluatora. Do osobnego tematu, jeśli FC uzna, że trzeba je ponownie zmierzyć.
4. `gra/node_modules` zainstalowano w worktree (`npm ci`) na potrzeby testów. Usuwam je po commicie, zgodnie z dispatchem (FC/Evaluator mogą zainstalować ponownie w swoim worktree).
5. Dług Rust: REPIN znacznika generała w scenie bitwy (port Rust), osobny temat.

NASTĘPNY KROK: Evaluator r3: weryfikacja testu sekwencji (`battle-commander-star-reset-test.cjs`) i decyzja o zarzucie 1 (żywy Chromium). Final Control po decyzji orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
