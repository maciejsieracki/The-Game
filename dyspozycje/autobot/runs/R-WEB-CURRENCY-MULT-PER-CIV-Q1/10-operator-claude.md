# R-WEB-CURRENCY-MULT-PER-CIV-Q1 — Operator, runda 3/5 (wdrożenie opcji D + korekta Asyrii)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CURRENCY-MULT-PER-CIV-Q1
GOAL: mnożnik Efektu 1 (Mennica+Waluta) per cywilizacja z civ-matrix (meta_mnoznik_waluta) + korekta trudności ±0,5, dolny limit 1,38 z econ-params (mennica_mnoznik_po_walucie_minimum), bez górnego limitu; globalne mennica_mnoznik_po_walucie jako fallback; Asyria = Babilonia − 0,1.

## Baza i wynik
- Kandydat (baza kodu): a9cc36f43 (FC PASS-WITH-NOTES, baza a8b063989).
- origin/main w chwili pracy: 93a618b17 (wg DODATKU 3); scalony merge.
- Commit merge z kodem (czubek kodu): 6e7ecbd72dd2f24bce6239d9e3df250fc9ab4d48
  - merge-base --is-ancestor a9cc36f43 HEAD: OK; 93a618b17 HEAD: OK.
- Raport: ten plik (SHA commita raportu podany w odpowiedzi).

## Zmiany
1. Konflikt merge `gra/tools/gen-building-cards-top5.korekty.json`: zachowane OBA wpisy (Targowisko (Rynek) z kandydata, Cegielnia z main); JSON poprawny.
2. Konflikt `gra/src/data/wikiBundle.json`: rozwiązany REGENERACJĄ `node gra/tools/bundle-wiki-for-game.cjs` (22 rozdz. + 174 haseł, 0 znaczników konfliktu).
3. `gra/data/civ-matrix.json` (cywilizacje[Asyria].params.meta_mnoznik_waluta): 1,7 → 2,2 (jedna linia, diff 1+/1-). Babilonia = 2,3 bez zmian.
4. `gra/tools/currency-mult-per-civ-test.cjs`: Asyria usunięta z listy „hard = 1,38” (na Trudnym wynosi 1,7 > 1,38); dodane asercje: Asyria normal 2,2, easy 2,7, hard 1,7.
5. `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` (linia 76): „Germanie, Asyria, Zulusi i Słowianie na Trudnym…” → „Germanie, Zulusi i Słowianie na Trudnym mają dokładnie ×1,38; Asyria na Trudnym ma ×1,7”. Potem regeneracja wikiBundle (pkt 2).

Allowlista operatora: gra/data/civ-matrix.json, gra/tools/currency-mult-per-civ-test.cjs, docs/PORADNIK-GRACZA/08-ekonomia-imperium.md, gra/src/data/wikiBundle.json (regen), gra/tools/gen-building-cards-top5.korekty.json (konflikt), merge origin/main. Kod silnika (economy.ts) NIE zmieniany w tej rundzie.
Strony encyklopedii civ: docs/encyklopedia/cywilizacje/ nie zawiera strony Asyrii (gen-cyw-encyklopedia.py generuje 9 stron bez Asyrii) — brak zmian.

## Założenie (do ewentualnej korekty przez właściciela)
- „nieznacznie gorsze” = Babilonia − 0,1 → Asyria normal 2,2 (easy 2,7; hard 1,7).

## Tabela końcowa 15 × 3 (wartości po korekcie; z surowego wyjścia currency-mult-per-civ-test.cjs)
| civ | easy | normal | hard |
|---|---|---|---|
| grecy | 2,8 | 2,3 | 1,8 |
| rzymianie | 2,5 | 2 | 1,5 |
| chinczycy | 2,9 | 2,4 | 1,9 |
| inkowie | 2,4 | 1,9 | 1,4 |
| zulusi | 2,3 | 1,8 | 1,38 |
| egipt | 2,6 | 2,1 | 1,6 |
| sumer | 2,7 | 2,2 | 1,7 |
| celtowie | 2,4 | 1,9 | 1,4 |
| germanie | 2,2 | 1,7 | 1,38 |
| harappa | 2,9 | 2,4 | 1,9 |
| hetyci | 2,5 | 2 | 1,5 |
| slowianie | 2,3 | 1,8 | 1,38 |
| babilonia | 2,8 | 2,3 | 1,8 |
| asyria | 2,7 | 2,2 | 1,7 |
| fenicjanie | 3,1 | 2,6 | 2,1 |

## TESTY (surowe wyniki)
- `npx tsc --noEmit` (gra/): exit 0.
- `node gra/tools/gen-building-cards-top5.cjs --check`: „--check OK”.
- `currency-mult-per-civ-test.cjs`: 202 passed, 0 failed (po zmianie Asyrii).
- Mutacja: w economy.ts:801 wymuszono globalną stałą (`if (true) return params.mennicaMnoznikPoWalucie;`) → `127 passed, 75 failed` (CZERWONA); economy.ts przywrócony z kopii, ponowny przebieg 202/0.
- Bramki referencyjne: logic-test „LOGIC OK (213/213)”; tech-tree-test „20 pass, 0 fail”; research-test „ALL GREEN”; unit-replace-full-cost-test „40 passed, 0 failed”; combat-test „All sanity checks passed.” (rc=0 wszystkie).
- Ekonomia/wiki: hud-skarbiec 34/0; empire-skarbiec-bilans 11/0; converters 49/0; upkeep-difficulty-per-owner 19/0; ai-purchase-maintenance-reserve 56/0; praca-pula-rate-parity 20/0; civ-matrix-meta-roster-wiring 63/0; civ-matrix-semantic-labels PASS 490 FAIL 0; ids-leak-audit 1648 ok/0 FAIL; wonder-text-no-raw-ids 132 ok/0 FAIL; pr141-matrix-only-data-wiki 15 civ rows + 9 CivPedia pages passed; tech-cards-top5 595/0; building-cards-top5 1207/0; waluta-mennica 61/0; mennica-uspienie 49/0; currency-test 37/0; diplomacy-currency-trade 5/0.
- NIE_ZMIERZONO: vite build (outDir poza repo), wizualna weryfikacja w Chromium (zmiana wartości liczbowych, bez zmian UI).

## BLOKADY / DŁUG (nie blokuje tego tematu)
- `mennica-magazyn-test.cjs`: 34 passed, 7 failed. TEN SAM wynik na origin/main (93a618b17) w czystym worktree — błąd pre-existing, nie wprowadzony przez ten temat. Asercje dotyczą starych globalnych wartości (easy 2 / hard 1) i stałych cityYieldPerTurn (×5). Do osobnego tematu naprawczego (poza zakresem).
- REPIN Rust: mnożnik per civ (matrix) i dolny limit 1,38 nie są jeszcze w rust-port. Nie dotykano rust-port ani LEDGER (zakaz).
- Zmiana Asyrii 1,7 → 2,2 jest ZAŁOŻENIEM operatora (Babilonia − 0,1); właściciel może skorygować.

## NASTĘPNY KROK
Evaluator (Sonnet) na commicie 6e7ecbd72 wraz z raportem; następnie Final Control; integracja orkiestratora dopiero po FC.

RUNDY: 3/5
DEPLOY/PUSH: NIE WYKONANO
