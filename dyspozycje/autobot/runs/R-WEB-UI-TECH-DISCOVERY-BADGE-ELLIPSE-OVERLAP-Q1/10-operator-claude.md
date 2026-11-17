# R-WEB-UI-TECH-DISCOVERY-BADGE-ELLIPSE-OVERLAP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI okna odkrycia technologii, CSS odznak)
TEMAT: R-WEB-UI-TECH-DISCOVERY-BADGE-ELLIPSE-OVERLAP-Q1
GOAL: odznaki `.tdn-badge` nie nachodzą na elipsę gruntu ponad limit testu B2 (0 px dla `completion`, ≤4 px dla `era`/`preview`) dla wszystkich technologii z listy TECHS i wszystkich wariantów mierzonych przez test; zmiana punktowa w CSS, bez zmiany treści, kolejności, kolorów, czcionek i układu poza minimum.
BAZA: origin/main = `ac0904f34305e28100e0a459d652e1bf22fb1a78` (checkout --detach, worktree `wf_10ff1ad6-deb-1`).

## ZMIANY / COMMIT

Zmiana (1 linia w CSS, w bloku naprawy sceny `tdn-entity-card-v2` / `tdn-side-card`):

- `gra/src/ui/techDiscoveryNotice.ts` l. 893: `.entity-card-diorama-ground{bottom:63px;}` → `bottom:70px;` (elipsa gruntu przesunięta o 7 px w górę; wysokość sceny 226 px, padding 72 px i pozostałe reguły bez zmian).
- `gra/tools/tech-discovery-badge-diorama-test.cjs` l. 395: literał kotwicy mutacji (d2) `bottom:63px` → `bottom:70px` (synchronizacja regexa z kodem; próg B2 i asercje NIE zluzowane — `GROUND_EDGE_TOLERANCE_PX = 4` bez zmian).
- Zrzuty: `dyspozycje/autobot/runs/R-WEB-UI-TECH-DISCOVERY-BADGE-ELLIPSE-OVERLAP-Q1/zrzuty/` (24 PNG: `przed-` = baza, `po-` = po zmianie; 2 rozdzielczości 1280×950 i 1920×1080; 3 technologie: Rolnictwo / Hutnictwo żelaza / Oswojenie zwierząt; 2 rodzaje: completion / preview).
- Commit: zob. pole `sha` w wyniku strukturalnym (commit zawiera tylko powyższe pliki i ten raport).

Diff vs baza (`git diff ac0904f34 --stat -- gra`): 2 pliki, +1/−1 każdy.

## TESTY

Wszystkie wyniki z surowego wyjścia (ZMIERZONO na worktree, Chromium headless przez Playwright, bez xvfb — nie był potrzebny).

Bramka właściwa `node tools/tech-discovery-badge-diorama-test.cjs`:
- BAZA (`ac0904f34`): `62 PASS, 1 FAIL` — FAIL: `(B2) [Hutnictwo żelaza] kind:"preview"` worst 7 px (`badge0(Podgląd technologii)` 120×7 px, `badge1(Informacja)` 58×7 px nad elipsą; medallion 0).
- PO ZMIANIE: `63 PASS, 0 FAIL`, exit 0.
- Mutacja (d2) (usunięcie bloku CSS naprawiającego scenę) w wersji po zmianie: `(d2) po usunięciu bloku CSS tekst ZNOWU nachodzi na grafikę` PASS, `(d2) [Hutnictwo żelaza] / [Oswojenie zwierząt] długa nazwa wraca NA MEDALION` PASS — mutacja czerwieni test. Kotwica (D) znajduje się w źródle (PASS).

Bramki referencyjne (§6 R-PROC-AUTOBOT, po zmianie):
- `npx tsc --noEmit` (`node node_modules/typescript/bin/tsc --noEmit`): exit 0, 0 błędów.
- `tools/logic-test.cjs`: exit 0, 213 linii PASS (wynik ref. 213/213).
- `tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail` (ref. 20/20).
- `tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (ref. 33/33).
- `tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` (ref. 21/21).
- `tools/combat-test.cjs`: exit 0, `All sanity checks passed.` (ref. 6/6; liczby nie drukuje — wynik wg komunikatu i exit code).

Pozostałe testy dotykające `tdn-` (`grep -l 'tdn-' gra/tools`), wynik PO ZMIANIE, porównanie z bazą tam, gdzie były czerwone:
- `entity-card-diorama-real-render-test.cjs`: exit 0, 45/0.
- `improvement-card-callsites-test.cjs`: exit 0, 36/0.
- `tech-discovery-card-real-click-test.cjs`: exit 0, 12/0.
- `tech-discovery-notice-resource-chips-test.cjs`: exit 0, 6/0.
- `technology-discovery-card-visual-test.cjs`: exit 0, 48/0.
- `tech-discovery-card-click-test.cjs`: exit 0, 13/0.
- `civpedia-karty-spojnosc-q1-c-test.cjs`: JEDEN przebieg po zmianie dał `22 PASS, 2 FAIL` (asercje (3) układ obok siebie przy 1420 i 1920 px, `sideR.top` ≠ `mainR.top` o ~3 px); PONOWNY przebieg po zmianie: `24 PASS, 0 FAIL`; przebieg na bazie: `24 PASS, 0 FAIL`. Zmiana CSS elipsy nie zmienia wymiarów kart; wynik traktuję jako niestabilny pomiar animacji (`civ-tdn-in .18s`) — NIE ZMIERZONO statystycznie (jeden przebieg z awarią).
- `wydarzenia-zbadano-karta-tech-real-render-test.cjs`: po zmianie exit 1 (`(0c)` kolejność rodzin, `(A1)` brak kart `tech-done-12-*`, `(B2) karta szczegolu ma wlasny ✕`); NA BAZIE dokładnie te same FAILe, exit 1 → błąd przedistniejący, nie spowodowany tą zmianą.
- `era-change-toast-live-test.cjs`: po zmianie exit 1 (`modal pokazuje pełną kartę Brązownictwa`); NA BAZIE exit 1 → przedistniejący.
- `ai-economy-measure-hook-test.cjs`: po zmianie exit 1 (błąd w `openNewGame`); NA BAZIE exit 1 → przedistniejący (nie dotyczy okna odkrycia; trafił na grep `tdn-` przypadkowo).

Pominięto (poza zakresem zgłoszenia, nie dotyczą `techDiscoveryNotice`): brak.

## DOWODY WIZUALNE (kryterium c)

Zrzuty zapisane w `zrzuty/` i OBEJRZANE (Read). Zmierzone (`getBoundingClientRect`, nie z pamięci):
- Baza, 1280×950, `preview`, „Hutnictwo żelaza": odznaki „Podgląd technologii" i „Informacja" leżą w paśmie elipsy gruntu (120×7 px i 58×7 px) — na zrzucie odznaki sidzą tuż nad/na świetle pod medalionem.
- Po zmianie, ten sam ekran: brak nakładania (`overlaps: []`); elipsa (poświata) widoczna bezpośrednio pod medalionem, odznaki w jednym wierszu z tytułem, bez zmiany treści i kolorów.
- Po zmianie, 1920×1080, `completion`, „Oswojenie zwierząt": odznaka „Ukończono badania" nad poświatą, brak nakładania; treść i układ listy korzyści bez zmian.
- Pomiary dla wszystkich 3 technologii × 2 rodzaje × 2 rozdzielczości po zmianie: `overlaps: []` (żadnych przecięć z medalionem ani elipsą). Przed zmianą: jedyne przecięcia to `preview` „Hutnictwo żelaza" (120×7 i 58×7 px) w obu rozdzielczościach.

Obserwacja wizualna: zmiana przesuwa poświatę gruntu o 7 px w górę. Kontakt światła pozostaje pod medalionem; efekt wizualnie subtelny (elipsa ma gradient z przezroczystą krawędzią). Nie wykryto zmiany układu tytułu ani medalionu.

## BLOKADY

- Nie wykonano bisektu `git log -S` / pomiaru przed/po commitem `57d1c7d3b` (chipy surowców) jako sprawcy — NIE ZMIERZONO. Naprawa jest w CSS zakotwiczonym w bloku sceny (226/72/63 z R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C i P-TECHDISCOVERY-BADGE-DUPLIKAT); pomiar wskazuje, że przy `preview` tytuł + dwie odznaki + podtytuł sięgają ok. 7 px w pasmo elipsy, co nie wynika z zmiany treści w 57d1c7d3b (nie sprawdzono).
- Kotwica mutacji (d2) w teście zmieniona z `63px` na `70px` — konieczna, bo literał był częścią wzorca blokującego mutację. Nie jest to luzowanie limitu (B2 nadal ≤4 px, a dla `completion` 0 px).
- Pozostałe czerwone testy (`wydarzenia-zbadano`, `era-change-toast-live`, `ai-economy-measure-hook`) są przedistniejące na bazie `ac0904f34` i wymagają osobnych tematów.

## UWAGI-DLA-ORKIESTRATORA

- W worktree powstały artefakty testów poza zakresem tematu (nie są w commicie): `gra/node_modules/` (instalacja `npm ci` — niezbędna do `tsc`/testów; w `.gitignore`), pliki generowane `gra/tools/.tech-discovery-badge-diorama-{entry.ts,bundle.cjs}` (w `.gitignore`), oraz nieśledzone PNG z testu innego tematu: `dyspozycje/autobot/runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/1c-karta-technologii-diorama.png` i `.../1c-tdn-diorama-przycisk-zamkniecia.png`. Dziesięć śledzonych PNG z tego samego katalogu, które testy nadpisały, przywróciłem `git checkout` do stanu z bazy. Nieśledzone PNG z innego tematu NIE są w commicie — do sprzątnięcia przez orkiestratora.
- Pliki tymczasowe `/tmp/tdn-*`, `/tmp/gate-*`, `/tmp/tdn-shots/` (skrypt zrzutów) — poza repo.
- `civpedia-karty-spojnosc-q1-c-test` ma niestabilną asercję (3) na 1420/1920 px; warto osobny temat DZ.
- Brak `git push` (zgodnie z dispatchem); deploy/integracja NIE wykonane.

## RUNDY

1/5 (Operator). FC/Obrona/deploy — nie wykonywane w tej rundzie.

## NASTĘPNY KROK

Evaluator: zweryfikować (a) `node tools/tech-discovery-badge-diorama-test.cjs` = 63/0 na commicie, (b) mutację (d2) i zrzuty w `zrzuty/`, (d) bramki referencyjne. Po PASS → Final Control → integracja orkiestratora (FALA 790).

## DEPLOY/PUSH: NIE WYKONANO
