# R-MOC-TABLICZKA-VS-CIVPOWER-Q1 — dwie różne liczby, nie jedna

**Data:** 2026-08-09 · **Decyzja:** Maciej (bezpośrednia korekta, nie ABC)

## Sytuacja
Decyzja `R-MOC-DEFINICJA-Q1` (2026-08-08) ustaliła, że „Moc" wyświetlana graczowi (tabliczka
nad żetonem, tooltip, panel rankingu, HUD, Empire) **nigdy** nie liczy budynków ani terenu —
tylko własne wskaźniki jednostki + premia weterana. To była decyzja o zbyt szerokim zakresie:
zunifikowała pod jedną regułą dwie z natury różne liczby.

**Jego słowa (2026-08-09):** „jeżeli jednostka jest ufortyfikowana lub jest w mieście z murami,
powinno się pokazywać jej prawdziwą moc z tymi bonusami. Kwestią do rozpoznania było coś
innego, jak liczyć moc dla całej cywilizacji. Czym innym jest tabliczka dla danej jednostki,
która jest w danym momencie, żebyśmy dokładnie wiedzieli jaką ma realną moc plus bonusy
terenowe, fortyfikowanie, weteran czy też mury — na mapie liczymy wszystkie parametry i
wszystkie bonusy danej jednostki. A czym innym jest jej moc do power, do cywilizacji — podajemy
tylko i wyłącznie z jej naturalnymi parametrami plus ewentualnie bonusy z tytułu ulepszeń
jednostki lub z tytułu weterana."

## Decyzja — rozdział na dwie osobne liczby
1. **Tabliczka nad żetonem + tooltip jednostki na mapie** — REALNA Moc, ze WSZYSTKIMI
   bonusami: teren, fortyfikacja (polowa i garnizonowa), mur/struktura miasta, weteran.
   Ta sama liczba, którą realnie liczy rozstrzygnięcie bitwy (`effectiveDefenderM`, gałąź
   `isCity` — dziś już liczy pełny bonus struktury/terenu, patrz komentarz w `main.ts:8281`).
2. **Moc cywilizacji (panel rankingu Mocy, HUD, Empire)** — WYŁĄCZNIE naturalne wskaźniki
   jednostki + bonusy z ulepszeń jednostki (jeśli trwałe, zapisane w definicji) + premia
   weterana. BEZ terenu, fortyfikacji, murów — bo to zależy od tego, gdzie jednostka akurat
   stoi, nie od tego, jaką ma siłę samą w sobie.

## Uzasadnienie
`R-MOC-DEFINICJA-Q1` rozwiązywało pytanie „jak liczyć Moc cywilizacji" (punkt 2), ale
zastosowało odpowiedź też do tabliczki na mapie (punkt 1) — stąd wczorajszy paradoks
(`R-MOC-MUR-PARADOKS-Q2-KIERUNEK-ODWROTNY`, tabliczka garnizonu spadająca po wybudowaniu
muru) i przedwczorajszy odwrotny paradoks (`R-MOC-MUR-PARADOKS-Q1`, tabliczka garnizonu
rosnąca — obie strony tego samego błędnego założenia, że to jedna liczba). Rozdzielenie na dwie
osobne funkcje zamyka oba paradoksy naraz, bez kompromisu: tabliczka pokazuje prawdę o
konkretnej jednostce tu i teraz, ranking pokazuje porównywalną, niezależną od pozycji siłę
cywilizacji.

## Wdrożenie (do zrobienia)
- `gra/src/main.ts`: tabliczka nad żetonem (`computeStackDisplay`, `defOf`, dziś
  `combatPowerScaledDefFor(u)`) → zamienić na formułę z pełnym bonusem struktury/terenu
  (analogiczną do gałęzi `isCity` w `effectiveDefenderM`, ale dla PODGLĄDU, nie rozstrzygnięcia
  bitwy — bez efektów ubocznych na przebieg walki).
- `sumArmyMForOwnerEffective` (karmi `buildPowerRankingByOwner`/`buildPowerOverlayData`/
  `buildEmpireDetailSnap`, decyzja `R-MOC-RANKING-ROZJAZD-Q1=B`) → zamienić
  `combatPowerScaledDefFor(u)` na `veteranScaledDefFor(u)` (już istnieje: `unitDefFor(u)` +
  premia weterana, bez fortyfikacji/terenu/muru) — sprawdzić czy trwałe bonusy z ulepszeń
  jednostki są już w `unitDefFor`/`lookupUnitDef`, czy wymagają osobnego doliczenia.
- Zaktualizować komentarze przy `R-MOC-DEFINICJA-Q1` w kodzie — dziś twierdzą że zasada
  dotyczy WSZYSTKICH wyświetleń Mocy, co jest już nieaktualne.
- `mur-paradoks-test.cjs` — zaktualizować asercje pod nowy podział (dwie funkcje, dwa
  oczekiwane zachowania, oba testowalne wprost zamiast dokumentować świadomy paradoks).
- Sprawdzić hexContextTooltip/inne miejsca pokazujące „Moc" jednostki — czy któreś jeszcze
  korzystają ze starej, zunifikowanej definicji.

## Status
ECHO — kod do dispatchu.
