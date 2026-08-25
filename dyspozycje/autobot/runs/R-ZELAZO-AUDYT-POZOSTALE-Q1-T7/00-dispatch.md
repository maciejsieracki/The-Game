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

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T5/T6).
DEPLOY/PUSH: NIE WYKONANO.
