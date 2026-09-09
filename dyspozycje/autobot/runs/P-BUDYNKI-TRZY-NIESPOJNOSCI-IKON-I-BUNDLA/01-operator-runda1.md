STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA
GOAL: Naprawić trzy niespójności ikon budynków i bramki testowej (recon 2026-09-05, `PYTANIA-OTWARTE.md:32284`).

ZMIANY/COMMIT: commit `3a0966b9` na gałęzi `autobot/P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA` (worktree `/home/user/wt-budynki-ikony`):
- `gra/src/ui/icons/brand/building-icon-map.json`: `pretorium` → `bld-pretorium` (plik istniał, był martwy); `trybunal` → `bld-admin` dodane jawnie.
- `gra/tools/civpedia-gra-id-mostek-test.cjs`: sekcja 7 (idempotentność) teraz zapamiętuje oryginalną treść `wikiBundle.json` przed uruchomieniem generatora i przywraca ją bajt w bajt w `finally`, z dodatkową asercją porównującą stringi po przywróceniu.

**Punkt 1 (trybunal) — NIE jest to nowa własna ikona, decyzja świadoma:** świeży `ls gra/src/ui/icons/brand/buildings/` (uruchomiony ponownie w tej rundzie) potwierdza, że `bld-trybunal.svg` faktycznie NIE istnieje. Zgodnie z dispatchem wybrałem opcję „najbliższy sensowny odpowiednik z uzasadnieniem" zamiast blokady: `bld-admin.svg` istnieje i już DZIŚ jest wynikiem heurystyki kategorii dla `trybunal` (kategoria budynku „Administracja" → `buildingBldId()` w `brandAssets.ts:97` `k.includes('admin') → 'bld-admin'`). Jawny wpis w mapie nie zmienia wizualnego efektu w grze — dokumentuje istniejącą decyzję zamiast zostawiać ją w cichym fallbacku. Jeśli właściciel chce faktycznie DEDYKOWANEJ ikony trybunału (inny SVG niż generyczna „administracja"), to osobny temat wymagający narysowania nowego pliku — poza zakresem tej naprawy tekstowej.

TESTY (z `gra/`, po symlinku `node_modules` z głównego drzewa — C-029, usunięty po pracy):
- `npx tsc --version` → 5.9.3 (właściwy kompilator, nie globalny).
- `npx tsc --noEmit` → 0 błędów.
- `node tools/logic-test.cjs` → 213/213
- `node tools/tech-tree-test.cjs` → 19/19
- `node tools/research-test.cjs` → 33/33
- `node tools/unit-replace-test.cjs` → 13/13
- `node tools/combat-test.cjs` → 6/6
- `node tools/civpedia-gra-id-mostek-test.cjs` → wszystkie PASS, w tym nowa asercja przywrócenia pliku.
  - Dowód anty-samooszukiwania: `git status --short -- gra/src/data/wikiBundle.json` puste PRZED uruchomieniem testu i puste PO (zweryfikowane bezpośrednio w tej rundzie, nie tylko przez kod testu).
- Realny odczyt mapy ikon (nie tylko JSON tekstowo): skrypt node czytający `building-icon-map.json` + `fs.existsSync` na plikach SVG potwierdził: `trybunal → bld-admin, exists: true`; `pretorium → bld-pretorium, exists: true`.
- Regresja sąsiednich bramek CivPedia/ikon: `budynek-garnizon-test.cjs` (79 pass/2 fail — identyczny wynik na czystym `main`, potwierdzone porównaniem, pre-istniejący, niezwiązany z tym tematem), `civpedia-budynki-historia-test.cjs` (141/0), `civpedia-historia-infra-test.cjs` (18/0) — zero nowych regresji.

BLOKADY: brak formalnej blokady punktu 1 — rozwiązany świadomym wyborem odpowiednika (opisanym wyżej), zgodnie z dopuszczoną w dispatchu alternatywą.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja zarzutów, w tym zasadność wyboru `bld-admin` dla trybunału jako „najbliższego sensownego odpowiednika" zamiast blokady).
DEPLOY/PUSH: NIE WYKONANO
