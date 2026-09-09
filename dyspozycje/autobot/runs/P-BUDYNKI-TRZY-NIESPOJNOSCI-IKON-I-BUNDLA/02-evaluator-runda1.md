STATUS: PASS
TEMAT: P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA
RUNDA: 1/5

ZARZUTY: brak

DOWÓD WŁASNEJ WERYFIKACJI (wszystko uruchomione/odczytane samodzielnie w tej sesji, nie na
podstawie deklaracji Operatora):

1. Diff `git diff origin/main HEAD` na dwóch dozwolonych plikach przeczytany w całości —
dokładnie dwie zmiany: `pretorium`→`bld-pretorium`, dodany `trybunal`→`bld-admin`; w bramce
dodany `try{...}finally{restore+assert}` wokół sekcji 7.
2. `ls gra/src/ui/icons/brand/buildings/`: `bld-trybunal.svg` faktycznie NIE istnieje,
`bld-admin.svg` i `bld-pretorium.svg` istnieją (świeży `test -f`, nie deklaracja).
3. Odczyt `gra/src/ui/icons/brandAssets.ts:86-98` (`buildingBldId`) + `gra/data/buildings.json:
1651-1654` (trybunal ma `"kategoria": "Administracja"`): bez wpisu w mapie,
`buildingMap.map[id]` = undefined → `k.includes('admin')` (kategoria zlowercase'owana
"administracja") → zwraca `bld-admin`. Wybór jawnego `bld-admin` dla trybunału jest więc
udokumentowaniem realnie istniejącej dziś ścieżki heurystyki, nie zgadywaniem.
4. `grep -n "bld-pretorium\|bld-palac" building-icon-map.json` przed patrzeniem na diff: przed
zmianą `bld-pretorium.svg` nie był kluczowany przez żaden wpis (martwy plik); po zmianie
tylko `pretorium` na niego wskazuje; `bld-palac` nadal ma 5 innych kluczy (palac, palac_ii,
palac_iii, dom_starszyzny, dwor_zarzadcy) — nic nie osierocono.
5. `node tools/civpedia-gra-id-mostek-test.cjs` → wszystkie OK, exit 0, w tym nowe asercje
idempotentności i przywrócenia. `git status --short -- gra/src/data/wikiBundle.json`
sprawdzone PRZED i PO uruchomieniem — oba puste (identyczne).
6. Odczyt kodu try/finally: `original` czytane PRZED `try`, brak wcześniejszego `return`;
`check()` (linie 45-52) tylko inkrementuje licznik, nigdy nie rzuca ani nie wywołuje
`process.exit` — więc `finally` wykona się w KAŻDEJ ścieżce, także gdyby `execFileSync`
rzuciło.
7. `npx tsc --noEmit` → 0 błędów (po utworzeniu symlinku `node_modules`, usuniętym po pracy —
potwierdzone `test -e` = brak).
8. 5 bramek referencyjnych, wszystkie zielone: logic-test 213/213, tech-tree-test 19/19,
research-test 33/33, unit-replace-test 13/13, combat-test 6/6.
9. `git diff --stat origin/main HEAD` → tylko `building-icon-map.json` i
`civpedia-gra-id-mostek-test.cjs`; raport `01-operator-runda1.md` już identyczny na
origin/main (bajt w bajt, `git diff` puste) — zero wycieku poza allowlistę.

NASTĘPNY KROK: Final Control → integracja orkiestratora.
