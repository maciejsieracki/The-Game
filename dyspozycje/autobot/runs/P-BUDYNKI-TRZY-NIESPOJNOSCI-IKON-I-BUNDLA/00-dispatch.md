STATUS: DISPATCH
DOMAIN: INFRA
TEMAT: P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA
GOAL: Naprawić trzy niezależnie znalezione, drobne niespójności (recon Operatora Garnizonu,
2026-09-05, `PYTANIA-OTWARTE.md:28284`): brak własnej ikony `trybunal`, martwy plik ikony
`bld-pretorium.svg` (dziś nieużywany), oraz bramka testowa nadpisująca śledzony plik danych
i brudząca `git status`.

KONTEKST:
1. `dyspozycje/PYTANIA-OTWARTE.md` ok. linii 28284-28301 — oryginalny opis wszystkich trzech
   znalezisk.
2. `dyspozycje/REJESTR-PROSB-I-ZADAN.md` ok. linii 6173-6176 (pod `R-BUDYNEK-GARNIZON-NOWY-Q1`)
   — potwierdzenie "STATUS: ZAREJESTROWANE, NIE DISPATCHOWANE", zero śladu wcześniejszej
   naprawy.

ZADANIE:
1. `gra/src/ui/icons/brand/building-icon-map.json` — dodaj wpis `"trybunal": "bld-trybunal"`
   jeśli plik ikony `gra/src/ui/icons/brand/buildings/bld-trybunal.svg` istnieje; jeśli NIE
   istnieje, zweryfikuj świeżym `ls` i albo dodaj najbliższy sensowny odpowiednik z
   uzasadnieniem, albo zgłoś jako blokadę (nie zgaduj nazwy pliku).
2. W tym samym pliku — zmień wpis `"pretorium": "bld-palac"` na `"pretorium": "bld-pretorium"`
   (plik `bld-pretorium.svg` istnieje już w repo, dziś nieużywany — potwierdzone świeżym
   `ls gra/src/ui/icons/brand/buildings/`).
3. `gra/tools/civpedia-gra-id-mostek-test.cjs` (sekcja "7) Idempotentność generatora", ok.
   linii 204-212) — dziś uruchamia `bundle-wiki-for-game.cjs` dwukrotnie bezpośrednio na
   śledzonym `gra/src/data/wikiBundle.json` (`BUNDLE_PATH`), co nadpisuje ten plik i brudzi
   `git status` niezależnie od realnej zmiany treści. Napraw tak, by test dowodził
   idempotentności BEZ trwałej modyfikacji śledzonego pliku: np. odczytaj i zapamiętaj
   oryginalną zawartość PRZED uruchomieniem, uruchom generator dwukrotnie, porównaj wyniki,
   a na końcu PRZYWRÓĆ plik do oryginalnej zawartości (bajt w bajt, potwierdzone porównaniem
   stringów) niezależnie od wyniku testu (finally/try-finally). Zachowaj realne wykonanie
   generatora (nie mockuj) — to jest sedno testu idempotentności.

REGUŁA PRZECIW SAMOOSZUKIWANIU: dla punktu 3 — dowiedź, że przywrócenie faktycznie działa:
uruchom bramkę, sprawdź `git status --short -- gra/src/data/wikiBundle.json` PRZED i PO
uruchomieniu testu — musi być identyczne (puste, jeśli było puste przed). Dla punktów 1-2 —
uruchom żywą grę (Chromium) lub co najmniej realny odczyt mapy ikon potwierdzający że
`trybunal`/`pretorium` faktycznie rozwiązują się teraz do nowych plików SVG, nie tylko że
JSON się zmienił tekstowo.

BINARNE KRYTERIUM SUKCESU: (1) `trybunal` ma własny wpis w mapie ikon (albo udokumentowana
blokada jeśli plik SVG faktycznie nie istnieje); (2) `pretorium` mapuje na `bld-pretorium`;
(3) `civpedia-gra-id-mostek-test.cjs` przechodzi I nie zostawia zmiany w `git status` dla
`wikiBundle.json` po uruchomieniu (zweryfikowane empirycznie, nie tylko czytając kod);
(4) `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, zero regresji na
`civpedia-gra-id-mostek-test.cjs` i innych bramkach CivPedia/ikon budynków.

ALLOWLISTA:
- `gra/src/ui/icons/brand/building-icon-map.json`
- `gra/tools/civpedia-gra-id-mostek-test.cjs`
- `dyspozycje/autobot/runs/P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA/*`
Zakaz `git add -A`. Zakaz dotykania `gra/src/data/wikiBundle.json` jako trwałej zmiany
(dozwolone WYŁĄCZNIE tymczasowo w ramach testu, z gwarantowanym przywróceniem — patrz wyżej).
Zakaz dotykania jakiegokolwiek pliku spoza tej listy, w szczególności `gra/src/main.ts`,
`gra/src/ui/newGameFlow.ts`, `gra/src/game/cluster-start.ts`, `gra/src/map/cluster-spawn.ts`
(równoległa, niezależna praca nad Etapem 6f hot-seat).

IZOLACJA: worktree `/home/user/wt-budynki-ikony`, gałąź
`autobot/P-BUDYNKI-TRZY-NIESPOJNOSCI-IKON-I-BUNDLA`, baza `origin/main` (świeża). C-001:
zakaz `npm run build`/`dev`; `tsc --noEmit` jedyna dozwolona kompilacja; `node
./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` jedyny dozwolony
build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) →
(Obrona jeśli zarzuty) → Final Control → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
