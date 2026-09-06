# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — obrona Operatora, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: sklad bitwy niezalezny od tego, ktora funkcja go policzono; runda 2 — naprawa fixture'u bramki, zero zmian w `gra/src`.
MODEL+EFFORT: Opus 5, effort high · ROLA: Operator (obrona) · RUNDA 2/5 (druga faza tej samej rundy)

## OBRONA

**OBRONA 1 -> PRZYJMUJE.** Zarzut trafny i odtworzony. Mutacja M-A (`collectAtkRosterNearCity`
liczy `hexDistance(u.q,u.r,anchor.q,anchor.r)` zamiast od `city`) zostawiala stara asercje
parytetu **22/22 zielona**. Przyczyna strukturalna: przy kotwicy stojacej NA heksie miasta
`battleHex == kotwica == miasto`, wiec oba wyrazenia dystansu sa identyczne — asercja nie mogla
zaczerwieniec przy ZADNEJ zmianie jednej funkcji. Poprawka: ten sam **heks bitwy** osiagany
dwiema droga — `collectBattleRoster` z kotwica `parityOnCity` (6,0) stojaca na miescie,
`collectAtkRosterNearCity` z kotwica `hastati` (5,0) stojaca OBOK. Po poprawce M-A czerwieni
parytet (21 ok, 1 fail).

**OBRONA 2 -> PRZYJMUJE.** Brak ograniczenia gornego potwierdzony. Dodalem czlon
`atkWithScoutIds.size === 3`. Sam czlon jednak **nie wystarczyl**: mutacja M-B (`radiusFrom(u) > 1`
-> `> 2`) dalej dawala 22/22, bo fixture nie mial ani jednej jednostki poza promieniem 1 —
gorna granica nie miala czego zlapac. Dodalem wiec jednostke `farAlly` (`u-far`, owner 0,
Hastati, (4,2)) w dystansie dokladnie 2 od kotwicy (5,0) i od miasta (6,0). Po tym M-B czerwieni
`pozostale trzy jednostki bojowe ZOSTAJA` (21 ok, 1 fail).

**OBRONA 3 -> PRZYJMUJE.** Dowod mutacyjny per asercja dostarczony (tabela nizej).

## MUTACJE (kazda cofnieta KOPIA pliku, nie `git checkout`)

| # | mutacja w `gra/src/units/battleRoster.ts` | wynik bramki | czerwieni |
|---|---|---|---|
| M-A | `collectAtkRosterNearCity` liczy od kotwicy, nie od miasta | 21 ok, 1 fail | parytet |
| M-B | promien `> 1` -> `> 2` | 21 ok, 1 fail | pozostale trzy ZOSTAJA |
| M-C | usuniety filtr `ownerId` | 21 ok, 1 fail | 2 allies dist<=1 |
| M-D | zwiadowca-atakujacy nie wykluczany | 18 ok, 4 fail | scout excluded + 3 inne |
| M-E | ciche zgubienie jednostki bojowej `u3` | 21 ok, 1 fail | pozostale trzy ZOSTAJA |

Po kazdej: `md5 battleRoster.ts` = `f8995d1571fe3f1b5be274c530c2f653`, `git diff --quiet -- gra/src/` czysto.

## DO DECYZJI CZLOWIEKA

Dla kotwicy **poza** heksem miasta funkcje zwracaja rozne zbiory — zmierzone na tym fixture:
kotwica `u0` (5,0) daje field `["u-anchor-city","u0","u2","u3"]` vs city `["u-anchor-city","u0","u2"]`.
Bitwa w polu toczy sie na heksie kotwicy, bitwa o miasto na heksie miasta — to sa **rozne miejsca
starcia**, wiec roznica moze byc zamierzona. Wytwor tego nie rozstrzyga; asercja parytetu celowo
jej NIE przesadza (zapisane w komentarzu przy asercji). Doslowne czytanie kryterium 3 rundy 1
(„ten sam uklad jednostek -> ten sam zbior ID") wymagaloby zrownania funkcji, co byloby zmiana
`gra/src` zakazana w tej rundzie.

## ODCHYLENIE OD RATYFIKACJI (jawnie)

Ratyfikacja narzucila parytet „dla wspolnej kotwicy na heksie miasta". Utrzymalem ratyfikowana
semantyke (wspolny heks bitwy = heks miasta), ale **zrezygnowalem ze wspolnego OBIEKTU kotwicy**,
bo w tamtym ukladzie asercja jest dowodowo pusta (M-A). Liczba asercji bez zmian: **22**.

## ZMIANY-COMMIT

`gra/tools/map-field-battle-test.cjs` — fixture `farAlly`, czlon `size === 3`, przepisany blok
parytetu. `git diff fe57a068..HEAD -- gra/src/` **PUSTE**. Zadna wczesniejsza asercja nie usunieta.

## TESTY

`tsc --noEmit` exit 0 · `map-field-battle-test` 22/22 · `logic-test` 213/213 ·
`tech-tree-test` 19/19 · `research-test` 33/33 · `unit-replace-test` 13/13 · `combat-test` 6/6 ·
`battle-roster-test` 7/7 · `retreat-garnizon-fortyfikacja-test` 27/27 · `battle-summary-test` OK ·
`auto-battle-power-test` 14/14 · `entity-card-contract-test` 75/75 · `_tmp-battle-roster-test` 7/7.

## BLOKADY

Brak.

## UWAGA PROCESOWA

Prompt wymagal HEAD `7a19f591`; zastalem `fab1451e`, drzewo CZYSTE. Nie zatrzymalem sie na `BLOCK`:
`7a19f591` jest przodkiem `fab1451e` (`git merge-base --is-ancestor` potwierdza), a rozjazd to
wylacznie recenzowana praca rundy 2, obrona rundy 1 i raport Evaluatora. Nieaktualny jest prompt,
nie worktree.

RUNDY: 2/5
NASTEPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
