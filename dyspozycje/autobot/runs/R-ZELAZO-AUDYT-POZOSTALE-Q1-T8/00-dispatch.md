# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T8`
GOAL: Audytować dwie jednostki germańskie: **Berserker germański, Wojownik germański**
(super-jednostka) — dziś dedykowany dispatch, kod z `jednostki-z3-plemiona.ts`, nigdy
rygorystycznie zmierzony.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T7. Pełny kontekst:
`docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T8-Q1`, odgałęziona od `origin/main` (zawiera już
T5+T6+T7), osobny worktree per rola.

## Allowlista

- `gra/src/render/jednostki-z3-plemiona.ts` — WYŁĄCZNIE funkcje `buildBerserker()`,
  `buildGermanSuper()`. NIE ruszać innych funkcji tego pliku (Drużynnik/Miecznik
  galijski/iButho — poza zakresem, osobne tematy T9/T10).
- `gra/src/render/units.ts` — WYŁĄCZNIE linie dispatchu (`n.includes('berserker
  germansk')` ok. `units.ts:1287`, `case 'germanie'` w `buildSuperUnit()` ok.
  `units.ts:4210`), jeśli audyt tego wymaga.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania.

Uwaga: martwa funkcja `buildGermanWarrior()` (nieosiągalna dla dzisiejszych danych —
jedyny rekord „Wojownik germański" jest super, idzie przez `buildGermanSuper`) jest
poza zakresem — porządek kodu, nie luka wizualna (opisane w
`R-ZELAZO-MODELE-BRAKUJACE-Q1`), NIE ruszać.

## Kontekst techniczny

**Dane jednostek** (`units.json`): Berserker germański (Germanie, NIE super, Atak
10/Obrona 2/Pancerz 0 — skrajnie ofensywny, zerowy pancerz, model powinien to
odzwierciedlać: brak zbroi/tarczy, dzikość), Wojownik germański (Germanie, SUPER, Atak
6/Obrona 6/Pancerz 2, `Atak dystansowy=4` — framea/oszczep do rzutu, sprawdź czy model
to pokazuje).

**Metoda — jak T1-T7:** zmierzyć geometrię w żywym Three.js, sprawdzić kolizje broni z
ciałem, uzupełnić sekcję historyczną K-style (Germanie epoki żelaza — kultury
lateńska/przeworska/jastorfska w zależności od okresu, źródła: Tacyt *Germania*,
znaleziska Nydam/Illerup — realne badanie, nie zgadywanie).

## Kryteria sukcesu

1. Dwa modele zmierzone (dowód pomiaru w raporcie).
2. Berserker faktycznie bez pancerza/tarczy (zgodnie z `Pancerz=0`) lub udokumentowane
   świadome odstępstwo. Wojownik germański w pozie zgodnej z `Atak dystansowy=4`.
3. Sekcja historyczna K-style dla obu, ze źródłami.
4. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja.
5. Zero regresji: testy T1-T7 tej serii + 5 bramek referencyjnych zielone.
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Wątpliwości historyczne — Operator rozstrzyga i dokumentuje (§10), nie pyta.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Runda 1 — PASS-WITH-NOTES (zamknięte, po integration micro-fixie Final Control)

Operator PASS, Evaluator PASS-WITH-NOTES, Final Control PASS-WITH-NOTES. Dispatch był
niewykonalny dosłownie: `buildBerserker()` fizycznie nie istniał w
`jednostki-z3-plemiona.ts` (żył w `units.ts` na generyku `buildBaseAvatar()`).
Operator zgłosił to jawnie z góry i napisał funkcję dokładnie tam, gdzie allowlista
ją nazywała — zero ingerencji w sąsiednie funkcje (Drużynnik/Miecznik galijski/
iButho), potwierdzone przez obie role kontrolne hunk po hunku.

Znalezione i naprawione pomiarem: topór Berserkera nie był trzymany (pięść mijała
broń — zero styku SAT), kaptur wilczej głowy połykał oba oczy, stopy pod terenem,
brak pozy ramion; Wojownik germański niósł długi miecz zamiast framei mimo
`Atak dystansowy=4`/`Ilość pocisków=4`/Uwag „z frameą" (sprzeczne też z Tacytem,
Germania 6). Trzy defekty złapane dopiero WZROKIEM na zrzucie, po tym jak wszystkie
16 asercji były już zielone: żeleziec czytał się jako młot, łeb wilka jako pudełko,
framea celowała w ziemię — błąd projekcji YZ→ekran przy stałej kamerze gry (każdy
kierunek w tej płaszczyźnie daje na ekranie pionową linię; miara długości rzutu nie
łapie złego zwrotu, tylko miara kierunku).

Final Control naprawił (integration micro-fix na branchu, nie na main) trzy
nieprecyzyjne/błędne zdania w komentarzach — w tym własne odkrycie: cytat Tacyta
błędnie przypisany do Germania 13 (faktycznie Germania 6, zweryfikowane źródłowo).
Świadomie NIE poszedł z micro-fixem na main (rozróżnił dokumentację runu od kodu —
oba wymagają integracji przez orkiestratora). 4 znaleziska (lekcja procesowa o
weryfikacji dispatchu, skrócona tylna noga całej rodziny Z3, rozjazd Epoka/Dostępna
w epokach, cytaty bez elipsy) zarejestrowane osobno.

Zmergowane do `main`, zweryfikowane niezależnie przez orkiestratora (tsc/vite build/
testy tematu+T1-T7/5 bramek referencyjnych zielone).

## Raport terminalny dispatchu

ZMIANY/COMMIT: branch `autobot/ZELAZO-AUDYT-T8-Q1`, commity `82bdb907`→`04cc4acc`,
zmergowane do `main`.
TESTY: kryteria sukcesu 1–7 spełnione, potwierdzone niezależnie 3-krotnie + orkiestrator
po merge.
BLOKADY: brak (4 znaleziska zarejestrowane osobno, nie blokują).
RUNDY: 1/5 (zamknięte pozytywnie).
NASTĘPNY KROK: T9 (Celtowie pozostali).
DEPLOY/PUSH: git push (main) WYKONANO; deploy ROBOCZA po zamknięciu T9-T11.
