# R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1
GOAL: domknąć trzy rozbieżności z DODATKU (zdarzenie wspolna_religia, kolejność pokoju 20 vs dZ=5, opisy „−5 Relacja” w diplomacy.json) bez zmiany zachowania gry; odpowiedź na zarzuty Evaluatora (eval-claude-tmp, ef0fb5f30).
BAZA: ed23d9319 (commit operatora rundy 1 na a2dc4fa31), worktree detached; poprawki w commicie tej rundy.

## Odpowiedź na zarzuty Evaluatora

### Zarzut 1 — ultimatum_spelnione martwe, opis „−5 Zaufanie” niezgodny z grą — PRZYJMUJĘ
Decyzja (ZAŁOŻENIE wg dispatchu: „zero zmian zachowania, chyba że zdarzenie jest martwe (wtedy usunięcie)”): zdarzenie jest martwe, więc usunięte, analogicznie do wspolna_religia.
- `gra/src/game/diplomacy.ts`: usunięty członek unii `DiplomaticEvent` (była l.886) i `case 'ultimatum_spelnione'` z `dZ = -5`.
- `gra/src/game/diplomacy-factors.ts`: usunięta osierocona etykieta `ultimatum_spelnione: 'Ultimatum spełnione'`.
- `gra/data/diplomacy.json` (akcja „9. Ultimatum”, pole Efekt, 1 linia): „Spełnienie: warunek zrealizowany; brak zmiany Zaufania i Relacji u adresata. Odmowa: casus belli. UPR: tylko poddanie się”. Tekst zgodny z kodem: akceptacja ultimatum (`diplomacy-proposals.ts`, `case 'ultimatum'`) zwraca `oneShotTrade`, bez zdarzenia zaufania. Blok `params` nietknięty.
- Dowód braku emitera przed zmianą: `git grep ultimatum_spelnione` w gra/src = tylko definicja, case, etykieta. Po zmianie: `git grep -n "ultimatum_spelnione\|wspolna_religia" -- gra/src gra/tools gra/data` = tylko asercje-guard w diplomacy-test.cjs i odwołania w sync-teście (sprawdzające nieobecność).
- `gra/tools/diplomacy-test.cjs`: usunięta asercja `ultimatum spelnione -5 Z`.
- `gra/tools/diplo-json-descriptions-sync-test.cjs` (check 8): zamiast „musi zawierać −5 Zaufanie” — trzy sprawdzenia: (a) `code.ultimatumSpelnione === null` (zdarzenie nie wróciło do kodu), (b) Efekt zawiera „brak zmiany Zaufania i Relacji u adresata”, (c) Efekt NIE zawiera „−5 Zaufanie” ani „−5 Relacja”. Mutacje: zamiana na „−5 Zaufanie (a więc także −5 Relacja) u adresata” i na „−5 Relacja u adresata” — obie wykryte.

### Zarzut 2 — nieaktualny komentarz diplomacy.ts ~l.1791-1792 — PRZYJMUJĘ
Komentarz `wspolnaReligia +0.5 Zaufanie (TODO…)` / `odmiennaReligia −0.5 Zaufanie (TODO…)` zastąpiony tekstem: 0 Zaufania, religia nie wpływa na Zaufanie, params `*_zaufanie_perTura = 0` (diplomacy.ts:158-160, potwierdzone testem diplomacy-test.cjs:123-124, 149 passed). Tylko komentarz; kod bez zmian.

### Zarzut 3 — brak strażnika nieobecności wspolna_religia — PRZYJMUJĘ
`gra/tools/diplomacy-test.cjs` (blok przed linią `ultimatum bezpodstawne`): odczyt `src/game/diplomacy.ts` i `src/game/diplomacy-factors.ts` oraz asercja, że literał `'wspolna_religia'` i `'ultimatum_spelnione'` nie występuje (`eq(... , false)`).
Dowód mutacyjny (wykonany, potem cofnięty): dopisanie `'wspolna_religia'` do końca diplomacy.ts → `FAIL: zdarzenie wspolna_religia nie wraca do diplomacy.ts / diplomacy-factors.ts (got true, want false)`, wynik `148 passed, 1 failed`. Po cofnięciu → `149 passed, 0 failed`.

### Zarzut 4 — odwołania poza allowlistą — CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM
- `gra/tools/.dip-run.cjs` i `gra/tools/.dip-run2.cjs` — PRZYJMUJĘ: usunięte 2 linie asercji na każdym pliku (`wspolna_religia` +1 Z, `ultimatum_spelnione` −5 Z). Uzasadnienie: allowlista dopuszcza „istniejące testy w gra/tools/*.cjs tylko w asercjach o tym zdarzeniu”. Diff: 2 usunięte linie na plik.
- `gra/tools/.dip-bundle2.cjs` — NIE RUSZAM: to wygenerowany bundle esbuild (zawiera `case "wspolna_religia"` i `case "ultimatum_spelnione"`). Nie jest w allowlistcie, a regeneracja wymaga builda, którego dispatch nie dopuszcza (zakaz npm run build). Do osobnego tematu lub regeneracji przez orkiestratora.
- `Dyplomacja/Dyplomacja-zasady.md` (l.100, l.105), `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md` (l.222, l.227), `Civ-CYWILIZACJE/DOKUMENTACJA-DEV-CYWILIZACJE.md` (l.292, l.299) — ODRZUCAM w tej rundzie. Dowód: allowlista dispatchu dopuszcza `docs/encyklopedia/pojecia/*.md` „tylko jeśli opisują to zdarzenie”; wyszukiwanie `git grep` w docs/encyklopedia dla obu nazw zwraca 0 trafień, a te pliki leżą poza allowlistą. Konflikt do decyzji orkiestratora: DODATEK pkt 1 mówi „testy i dokumenty zaktualizuj”, allowlista tego nie obejmuje. Proponuję osobny temat dokumentacyjny.
- Poza zakresem, też nie ruszane: `dyspozycje/PROJEKT-WIARYGODNOSC-CYWILIZACJI.md:135` i `dyspozycje/_scalone/DYPLOMACJA/DYPLOMACJA-DO-MASTERA.md:21` wspominają `ultimatum_spelnione (-5 Z)`.

## Pozostałe punkty z DODATKU (bez zmian względem rundy 1)
- Pkt 2 (kolejność pokoju): potwierdzone — main.ts:12127 `applyDiplomaticEvent(cur,'pokoj')` (dZ=+5), main.ts:12130 `setDiploRelation(..., {...afterPeace, zaufanie: trustSetpoint})` nadpisuje zaufanie na 20; brak późniejszego zapisu zaufania w funkcji. BLOKADA: brak.
- Pkt 3b (l.471 „brak −5 Relacja u każdego”): bez zmian, zgodne z kodem (`breakTreatiesOnWar` stosuje tylko zlamana_obietnica).

## ZMIENIANE PLIKI (commit tej rundy)
- gra/src/game/diplomacy.ts
- gra/src/game/diplomacy-factors.ts
- gra/data/diplomacy.json (1 linia, pole Efekt)
- gra/tools/diplomacy-test.cjs
- gra/tools/diplo-json-descriptions-sync-test.cjs
- gra/tools/.dip-run.cjs (2 linie asercji)
- gra/tools/.dip-run2.cjs (2 linie asercji)
- dyspozycje/autobot/runs/R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1/30-obrona-claude.md (ten raport)

Nie zmieniano: wikiBundle.json (`grep -c "Ultimatum spełnione"` = 0, `grep -c "a więc także −5 Relacja"` = 0, regeneracja niepotrzebna), params, main.ts, ai.ts, diplomacy-proposals.ts, docs.

## TESTY (surowe wyniki, po zmianach, z gra/ w worktree)
- `npx tsc --noEmit` → TSC_EXIT=0
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/diplomacy-test.cjs` → `[diplomacy-test] 149 passed, 0 failed (total 149).`
- `node tools/diplo-civpedia-values-test.cjs` → exit 0
- `node tools/diplo-json-descriptions-sync-test.cjs` → `WYNIK: 46/46 OK, FAIL: 0`, `mutacji: 9` (wszystkie wykryte)
- `node tools/diplo-relation-tier-trust-test.cjs` → exit 0
- `git diff --check` → exit 0
Instalacja: `npm ci --ignore-scripts` w gra/ (71 pakietów). Brak `npm run build`/`dev`.

## BLOKADY
Brak blokad technicznych.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie wykonane)
1. Konflikt DODATEK pkt 1 („dokumenty zaktualizuj”) z allowlistą: Dyplomacja/*.md i Civ-CYWILIZACJE/*.md wciąż opisują wspolna_religia (+1) i ultimatum_spelnione (−5 Z). Potrzebny osobny temat dokumentacyjny albo rozszerzenie allowlisty.
2. `gra/tools/.dip-bundle2.cjs` (tracked, wygenerowany esbuild) zawiera stare case'y. Do regeneracji osobnym tematem, jeśli ma być aktualny.
3. Zgodnie z dispatchem ultimatum usunięte jako martwe. Jeśli właściciel chce mieć ultimatum z realnym efektem zaufania, to osobna decyzja produktowa i zmiana zachowania.

## RUNDY
2/5 (runda 1: PASS-WITH-NOTES; runda 2 = ta obrona, odpowiedź na zarzuty 1–4).

## NASTĘPNY KROK
Evaluator: sprawdzić diff ed23d9319..HEAD (allowlista: 7 plików kodu/testów + raport), dowód mutacyjny strażnika (zarzut 3) i decyzję o usunięciu ultimatum (zarzut 1). Orkiestrator: decyzja o temacie dokumentacyjnym (zarzut 4) i o `.dip-bundle2.cjs`.

## DEPLOY/PUSH: NIE WYKONANO
