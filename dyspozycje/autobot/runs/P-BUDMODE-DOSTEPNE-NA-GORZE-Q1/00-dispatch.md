# Dispatch — P-BUDMODE-DOSTEPNE-NA-GORZE-Q1

## Zgłoszenie właściciela (2026-09-10, na żywo, ze zrzutem ekranu listy ulepszeń terenu)

Lista ulepszeń w trybie budowy (`buildModeHud.ts`, panel „Ulepszenia terenu") dziś miesza
dostępne i zablokowane (wymagające jeszcze nieodkrytej technologii) pozycje w jednej,
nieposortowanej kolejności (kolejność z danych). Właściciel chce, żeby dostępne pozycje
były na samej górze, zablokowane poniżej — dokładnie jak już działa w panelu dyplomacji.

## Punkt odniesienia — wzorzec JUŻ istnieje w kodzie

`gra/src/ui/diplomacyAudience.ts:1840`:
```
.sort((x, y) => Number(x.isLocked) - Number(y.isLocked))
```
Prosty, stabilny sort: `false` (0, dostępne) przed `true` (1, zablokowane). Analogiczny
wzorzec ogólny (`.slice().sort(comparator)`) też w `diploListHud.ts:216`
(`compareDiploListEntries`). Zastosuj TEN SAM wzorzec do listy ulepszeń.

## GOAL

W panelu „Ulepszenia terenu" (`buildModeHud.ts`) dostępne pozycje renderują się nad
zablokowanymi (wymagającymi technologii LUB z niewystarczającą Pracą — obie te
przyczyny już dziś dają `locked=true` dla wiersza, patrz niżej), przy zachowaniu
względnej kolejności WEWNĄTRZ każdej z dwóch grup (sort stabilny).

## Miejsce zmiany

`gra/src/ui/buildModeHud.ts`:
- `types` (linia ok. 486-488, `config.listTypes().filter(...)`) — dziś renderowane w
  kolejności z danych, BEZ sortowania.
- Pętla renderująca (linia ok. 677+) liczy `locked` PER WIERSZ jako
  `techLocked || insufficientPraca` (`techLocked = t.techUnlocked === false`,
  `insufficientPraca = !techLocked && t.kosztPraca > pracaPool`, `pracaPool` już dostępny
  przed pętlą, linia ok. 675).

**Sortowanie MUSI używać DOKŁADNIE tej samej definicji `locked`** (obie przyczyny, nie
tylko `techUnlocked`) — inaczej kolejność rozjedzie się z tym, co wizualnie wygląda jako
zablokowane (wyszarzone, `.locked` w CSS). Najprościej: policz `locked` dla każdego `t`
PRZED pętlą renderującą (np. `.map(t => ({t, locked: ...}))`), posortuj po tym polu
stabilnie (`Number(locked) - Number(locked)`, wzorem `diplomacyAudience.ts:1840`), potem
renderuj w tej kolejności — bez duplikowania logiki liczenia `locked` w dwóch miejscach
(oblicz raz, użyj i do sortu, i do renderu tego samego wiersza).

Nie sortuj sekcji „Cuda świata" (linia ok. 516-540) ani „Miasto"/„Załóż miasto" — to
OSOBNE, DZIŚ NIETKNIĘTE sekcje, zgłoszenie dotyczy WYŁĄCZNIE listy „Ulepszenia terenu".
Jeśli po przeczytaniu kodu uznasz, że właściciel intencjonalnie chciałby też cudów —
NIE zgaduj, zrób wyłącznie ulepszenia terenu i wspomnij cuda jako możliwe rozszerzenie
w raporcie (BLOKADY), nie decyduj sam.

## Reguła przeciw samooszukiwaniu

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu — to jest temat
wizualny. Wymagany żywy zrzut Chromium: otwórz tryb budowy w mieście z MIESZANKĄ
dostępnych i zablokowanych ulepszeń (jak na zrzucie właściciela — np. świeża gra w
Epoce Kamienia, gdzie część ulepszeń wymaga jeszcze nieodkrytych technologii), pokazujący
że wszystkie dostępne (odblokowane I z wystarczającą Pracą) są nad wszystkimi
zablokowanymi. Dodatkowy dowód: scenariusz „za mało Pracy" (dostępna technologicznie
pozycja, ale `kosztPraca > pracaPool`) też ląduje w grupie zablokowanych, nie dostępnych.

## Binarne kryterium sukcesu

Nowy test (lub rozszerzenie istniejącego testu `buildModeHud`/`P-ULEPSZENIA-*`, sprawdź
`gra/tools/*.cjs` po nazwach zawierających „budmode"/„buildmode"/„ulepszen") dowodzący
sortowania PASS na żywym Chromium ORAZ `tsc --noEmit` czysty ORAZ 5 bramek referencyjnych
zielone ORAZ zero regresji istniejących testów panelu budowy (przeszukaj i uruchom
wszystkie pasujące).

## Allowlista

- `gra/src/ui/buildModeHud.ts`
- odpowiedni istniejący/nowy plik `gra/tools/*-test.cjs` dla tego panelu

Zakazane: `gra/src/ui/diplomacyAudience.ts`, `gra/src/ui/diploListHud.ts` (tylko wzorzec
do skopiowania, nie do zmiany), pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-budmode-sort`, gałąź `autobot/P-BUDMODE-DOSTEPNE-NA-GORZE-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`; dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium sekwencyjnie.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 400 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`. Nie
integrujesz, nie deployujesz, nie pushujesz.
