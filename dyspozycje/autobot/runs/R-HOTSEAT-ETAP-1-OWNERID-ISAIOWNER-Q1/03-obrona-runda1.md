# R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1 — Obrona, runda 1

STATUS: PASS-WITH-NOTES

Bez zmian kodu — ta runda koryguje wyłącznie dowód audytu w raporcie.

OBRONA: 1 -> PRZYJMUJĘ. Dowód: `sed -n '31320,31345p' gra/src/main.ts` potwierdza blok
P-AI-MAJOR-ABSORB Faza 2 — linia 31326 warunek `ownerId > 0 && !typCityCopyOwners.has(ownerId)
&& !isBarbarian(ownerId) && !eliminatedOwners.has(ownerId)`, a bezpośrednio w tym samym `if`
niżej (linia 31337-31341) `.filter(oid => oid !== ownerId && oid > 0 &&
!typCityCopyOwners.has(oid) && !isBarbarian(oid) && !eliminatedOwners.has(oid))` — ten sam
wzorzec „major AI, nie miasto-państwo" pod aliasem `oid`, pominięty przez regex
`ownerId *> *0`. Klasyfikacja Evaluatora poprawna: miejsce nietknięte i słusznie nietknięte,
ale liczba w raporcie rundy 1 była zaniżona.

Korekta: **21 → 22 realne miejsca kodu semantyki `ownerId>0`, z czego 12 (nie 11)
nietkniętych** — nowa pozycja: `main.ts:31339` (`oid > 0` w `.filter` P-AI-MAJOR-ABSORB,
ten sam blok co `main.ts:31326`).

Dodatkowa weryfikacja rozszerzonym grepem (`grep -nE '\b(oid|aid|targetOwner|victimId|otherOwner)\s*>\s*0' gra/src/main.ts`)
→ dokładnie 1 trafienie (`main.ts:31339`, już uwzględnione) — potwierdza brak dalszych
przeoczeń tego typu.

Żadna zmiana kodu nie jest wymagana (wynik klasyfikacji się nie zmienia), tylko korekta
liczby i listy w raporcie audytu (ten plik + `01-operator-runda1.md` traktować łącznie
jako skorygowany raport rundy 1).

TESTY: bez zmian (patrz `01-operator-runda1.md`/`02-evaluator-runda1.md`).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
