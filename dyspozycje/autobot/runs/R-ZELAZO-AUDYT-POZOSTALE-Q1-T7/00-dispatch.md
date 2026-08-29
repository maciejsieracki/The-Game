# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T7`
GOAL: Audytować cztery jednostki Rzymu/Grecji: **Evocati, Triari, Hieros Lochos
(Święty Zastęp), Hastati** — trzy super-jednostki dochodzące przez `buildSuperUnit()`
(inna ścieżka dispatchu niż reszta rodziny, ale formalnie dedykowane — patrz T6
`R-HANDEL...` — nie, patrz audyt `R-ZELAZO-MODELE-BRAKUJACE-Q1`, sekcja „poza
zakresem") + Hastati, który JUŻ jest w konwencji `-opus5.ts` — dla Hastati wystarczy
LEKKA weryfikacja (potwierdzenie, że spełnia bar, nie przebudowa).

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T6. Pełny kontekst:
`docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T7-Q1`, odgałęziona od `origin/main` (zawiera już
T5+T6), osobny worktree per rola.

## Allowlista

- `gra/src/render/jednostki-p6-super.ts` — funkcje `buildSuperRome()` (Evocati),
  `buildSuperGreece()` (Hieros Lochos).
- `gra/src/render/jednostki-z2-srodziemne.ts` — WYŁĄCZNIE `buildTriari()`. NIE ruszać
  innych funkcji tego pliku (T3/T6, poza zakresem).
- `gra/src/render/hastati-opus5.ts` — WYŁĄCZNIE jeśli audyt Hastati (patrz niżej)
  znajdzie realny defekt geometrii; priorytet to potwierdzenie, że NIE trzeba nic
  zmieniać.
- `gra/src/render/units.ts` — WYŁĄCZNIE `case 'rzym'`/`case 'grecja'` w `buildSuperUnit()`
  (ok. `units.ts:4200-4201`) i linia dispatchu `hastati` (ok. `units.ts:1437`), jeśli
  audyt tego wymaga.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania.

## Kontekst techniczny

**Dane jednostek** (`units.json`): Evocati (Rzymianie, SUPER, Atak 9/Obrona 9/Pancerz 6),
Triari (Rzymska, SUPER, 8/8/6 — weteran legionu, historycznie tarcza/pilum/gladius jak
Hastati, ale starszy/doświadczony żołnierz), Hieros Lochos (Grecka, SUPER, 8/10/6 —
Tebański Święty Zastęp, elitarna piechota), Hastati (Rzymska, NIE super, 6/6/4,
`Atak dystansowy=3` — RZUCA pilum przed walką wręcz, sprawdź czy model to pokazuje).

**Ścieżka dispatchu super-jednostek jest INNA** niż reszta rodziny (przez wewnętrzny
switch po kulturze w `buildSuperUnit()`, nie whitelistę `SUPER_Z_MODELEM_NAZWANYM` +
`buildNamedUnit`) — to ZNANE i zaakceptowane w poprzednim audycie
(`R-ZELAZO-MODELE-BRAKUJACE-Q1`), NIE jest to defekt do naprawienia, tylko inny,
działający mechanizm. Audytuj JAKOŚĆ modeli pod tą ścieżką, nie sam mechanizm
dispatchu.

**Hastati — lekka weryfikacja.** Ten plik już używa konwencji `-opus5.ts` (prawdopodobnie
zbudowany wcześniej z podobnym rygorem). Zbuduj model, zmierz geometrię, sprawdź czy ma
sekcję historyczną. Jeśli WSZYSTKO jest solidne — potwierdź to jawnie z dowodem pomiaru
i NIE przebudowuj bez powodu. Jeśli audyt znajdzie realny błąd — napraw.

**Metoda — jak T1-T6:** zmierzyć geometrię w żywym Three.js, sprawdzić kolizje broni z
ciałem, orientację tarcz względem kamery gry (azymut 0), uzupełnić sekcję historyczną
K-style.

## Kryteria sukcesu

1. Cztery modele zmierzone (dowód pomiaru w raporcie, także dla Hastati — nawet jeśli
   wynik to „bez zmian").
2. Zero kolizji broni/tarczy. Hastati faktycznie w pozie gotowej do rzutu pilum
   (zgodnie z `Atak dystansowy=3`) — potwierdzić lub naprawić.
3. Sekcja historyczna K-style dla wszystkich czterech (uzupełnić brakujące).
4. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja.
5. Zero regresji: testy T1-T6 tej serii + 5 bramek referencyjnych zielone.
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Wątpliwości historyczne — Operator rozstrzyga i dokumentuje (§10), nie pyta.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Runda 1 — PASS-WITH-NOTES (zamknięte, po integration micro-fixie Final Control)

Operator PASS, Evaluator PASS-WITH-NOTES, Final Control PASS-WITH-NOTES. Operator
obalił dwa błędne założenia z samego dispatchu: Hastati NIE był lekką weryfikacją —
miał dwa realne defekty (hełm zasłaniał oczy/szczękę mimo że nagłówek pliku reklamował
odsłoniętą twarz); `hastati-opus5.ts` od 2026-07-26 jest JEDYNYM modelem widzianym
przez gracza (dispatch w `units.ts`), nie „niepodpiętym wariantem porównawczym" jak
twierdził jego własny nagłówek. Znalezione i naprawione pomiarem: drzewce dory Hieros
Lochos w ramieniu (poprawka T3 dla tej samej broni nigdy nie dotarła do kopii buildera
w innym pliku), drzewce przebijające własną chorągiew, hełm Evocatiego bez oczu,
zarost Triariego niewidoczny (0 pikseli, dwie niezależne przyczyny), stopa Triariego
pod terenem. Pytanie o pozę Hastatiego rozstrzygnięte: NIE poza rzutu — model pokazuje
moment PO salwie pilum (Polibiusz VI.23).

Evaluator znalazł 7 nieprawdziwych/nieaktualnych zdań w NOWYCH komentarzach dodanych
przez Operatora (m.in. wartość pomiaru sprzed naprawy przeżywająca poprawkę, kotwica
opisująca stan sprzed zmiany, błędne odsyłacze między sekcjami, martwy kod, niespójna
numeracja, nieprecyzyjne „punkt po punkcie" przy cytacie łacińskim) i zarekomendował
rundę 2. Final Control, korzystając z jawnej autoryzacji w dispatchu tej roli (naprawić
samemu jako integration micro-fix, chyba że wymaga zmiany logiki — żaden z 7 punktów
nie wymagał), zweryfikował każdy punkt niezależnie, naprawił wszystkie siedem (czysto
tekstowe/martwy-kod, zero zmian geometrii), ponownie uruchomił pełny zestaw testów
(identyczne wyniki przed/po) i jawnie zamknął temat bez zużywania rundy 2 — micro-fix
Final Control nie jest dispatchem Operatora. Dodatkowo uzupełnił brakujący
`02-evaluator.md` w śladzie obiegu (luka procesowa znaleziona przy okazji).

Zmergowane do `main`, zweryfikowane niezależnie przez orkiestratora (tsc/vite build/
testy tematu+T1-T6/5 bramek referencyjnych zielone).

## Raport terminalny dispatchu

ZMIANY/COMMIT: branch `autobot/ZELAZO-AUDYT-T7-Q1`, commity `54d5cd37`→`6c9fe7cc`→
`d8982342`, zmergowane do `main`.
TESTY: kryteria sukcesu 1–7 spełnione, potwierdzone niezależnie 3-krotnie + orkiestrator
po merge.
BLOKADY: brak.
RUNDY: 1/5 (zamknięte pozytywnie).
NASTĘPNY KROK: T8 (Germanie).
DEPLOY/PUSH: git push (main) WYKONANO; deploy ROBOCZA po zamknięciu T8-T11.
