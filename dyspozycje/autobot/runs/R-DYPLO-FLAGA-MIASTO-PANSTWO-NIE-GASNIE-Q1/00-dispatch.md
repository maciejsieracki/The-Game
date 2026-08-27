# DISPATCH — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1

TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
DOMAIN: GAME
DATA: 2026-08-27
ECHO WLASCICIELA: **wariant A** — „oznaczenie miasta-panstwa znika przy KAZDYM przejeciu
miasta-panstwa, takze zbrojnym". Odpowiedz udzielona 2026-08-27 na pytanie ABC nr 1 turnieju
C-018 (`dyspozycje/abc-turniej/2026-08-27/SEDZIA-werdykt-i-wersja-finalna.md`, PYTANIE 1).

## GOAL

Cywilizacja prowadzona przez komputer przestaje byc traktowana jak miasto-panstwo w chwili,
gdy przejmie miasto nalezace wczesniej do miasta-panstwa — **niezaleznie od tego, czy przejela
je sila, czy pokojowo**. Po zmianie wojna wymuszona epoki Kamienia faktycznie wybucha w
rozgrywce, a cywilizacja po podboju wraca na liste poteg i odzyskuje portret wladcy w dyplomacji.

## PRZYCZYNA (ustalona w audycie P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1, zamknietym w `main`)

`isOwnerClusterCityState` (`gra/src/game/display-names.ts:50-58`) uznaje ownera za
miasto-panstwo m.in. gdy **ktorekolwiek** z jego miast ma `startCityState === true`:

```
if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;
```

Zdobyte miasto miasta-panstwa **wnosi ta flage do zdobywcy**. Dzieje sie to w turze 6-8,
u wszystkich szesciu cywilizacji, w kazdej sprawdzonej grze. Flaga jest dzis kasowana wylacznie
przy pokojowym wchlonieciu.

## KRYTERIA KONCA (wszystkie wymagane)

1. **Dowod przyczyny przed naprawa.** Pomiar na >= 3 ziarnach: liczba ownerow, dla ktorych
   `isOwnerClusterCityState` zwraca `true` w turze 20, PRZED zmiana. Oczekiwane: komplet
   glownych cywilizacji. Bez tego pomiaru nie ma z czym porownac.
2. **Po zmianie:** ten sam pomiar pokazuje, ze zadna glowna cywilizacja nie jest w turze 20
   oznaczona jako miasto-panstwo, a **rzeczywiste miasta-panstwa nadal sa** (nie wolno wylaczyc
   mechanizmu, tylko przestac go zarazac).
3. **Dowod na skutek docelowy:** w rozgrywce (playtest, >= 3 ziarna, >= 40 tur) padaja realne
   wypowiedzenia wojny miedzy cywilizacjami. Podac liczbe i tury. **Zero wypowiedzen = FAIL**,
   nawet przy zielonych bramkach — to jest dokladnie ten temat, w ktorym zielona bramka juz raz
   sklamala (§13a, `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`).
4. **Skutki poza wojna zmierzone osobno:** lista poteg (`gra/src/game/power-ranking.ts:33`)
   i portret wladcy (`shouldForceCultureIconForOwner`) — cywilizacja po podboju wraca do rankingu
   i dostaje portret. Podac stan PRZED i PO.
5. **Dowod nie-tautologiczny:** kazda nowa asercja musi zaczerwienic sie pod jedna celowana
   mutacja zrodla. Podac mutacje i wynik.
6. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
7. Bramki wojny wymuszonej `forced-war-stone` (32/0) i `forced-war-bronze` (18/0) bez pogorszenia.

## ALLOWLISTA (nic poza tym)

- `gra/src/main.ts`
- `gra/src/game/display-names.ts`
- `gra/tools/**` (nowa bramka tematu + sondy)
- `dyspozycje/autobot/runs/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1/**`

## GRANICE (naruszenie = FAIL)

- **NIE ruszac `gra/src/map/improvement-build.ts` ani `gra/data/terrain-improvements.json`** —
  rownolegle biegnie `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` na tych plikach (§2b). Kolizja =
  natychmiastowy BLOCK i raport, nie obejscie.
- Zakaz `npm run build` / `npm run dev` w `gra/`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-flaga-<rola> --emptyOutDir`
  (**`--outDir` unikalny per ROLA**, wniosek z `P-PROC-OUTDIR-KOLIZJA-ROWNOLEGLE-TEMATY-Q1`).
- Zakaz `npx`, zakaz `git add -A`, zakaz pushu do `main`, zakaz zmian w `dyspozycje/WERSJE.md`.
- **Nie poszerzac zakresu (§14):** nie ruszamy warunku wojny ogolnej (`ai.ts:4377-4384`) — to
  osobny, wciaz otwarty temat `P-DYPLO-RELACJA-I-SILA-TA-SAMA-LICZBA-Q1`.
- Nie ruszac filtru `oid > 0` wykluczajacego gracza z celow wojny wymuszonej — decyzja
  `R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1` Q2, zmiana wymagalaby nowego ECHO.

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. Limit 5 rund. Kazda rola pisze wlasny raport
w `dyspozycje/autobot/runs/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1/`.

**Final Control obowiazkowo:** `git fetch` + `git log` + wypisac SHA + potwierdzic, ze zmiany
SA W COMMITACH na galezi tematu. Praca niezacommitowana = BLOKER, nie nota.
