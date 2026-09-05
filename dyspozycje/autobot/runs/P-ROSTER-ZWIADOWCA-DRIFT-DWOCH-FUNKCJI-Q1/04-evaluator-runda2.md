# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Evaluator, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: sklad bitwy niezalezny od tego, ktora funkcja go policzono; runda 2 — naprawa
fixture'u bramki, zero zmian w `gra/src`.
MODEL+EFFORT: Opus 5, effort high · ROLA: Evaluator · RUNDA 2/5

## PUNKT KONTROLI 1 — CZY OSLABIONO ASERCJE

Licznik `assert(` w `map-field-battle-test.cjs`: **20 → 22** (grep 21→23 wlicza definicje
`function assert`). Zadna istniejaca asercja nie zostala usunieta; przepisana jest **jedna**,
autoryzowana ratyfikacja (`:155-157` → `:167-171`). Etykieta
`collectBattleRoster atk: adjacent scout excluded` zachowana bajt w bajt.

**Zweryfikowalem kluczowa teze Operatora wlasnym pomiarem** (podmiana pliku bramki na wersje
z `fe57a068`, przywrocenie z KOPII): pod mutacja cichego usuniecia jednostki bojowej z rosteru
**STARA bramka: 20 ok / 0 fail — calkowicie zielona**, NOWA: 21 ok / **1 fail**
(`pozostale trzy jednostki bojowe ZOSTAJA`). W osi „ubytek z rosteru" przepisana asercja jest
realnie mocniejsza od `length === 2`. Kryterium 2 w tej osi NIE naruszone.

## PUNKT KONTROLI 2 — ZAKRES

`git diff fe57a068..HEAD --stat`: wylacznie `gra/tools/map-field-battle-test.cjs` (+30/-2)
oraz pliki w katalogu runu. **`git diff fe57a068..HEAD -- gra/src/` — PUSTE** (kryterium 2
rundy 2 spelnione; md5 `battleRoster.ts` = `f8995d15…`). Wyciek poza allowliste: **brak**.
`P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1/00-dispatch.md` w diffie pochodzi z commitu
orkiestratora `91877f11`, nie z pracy Operatora.

## PUNKT KONTROLI 3 — PIEC WLASNYCH MUTACJI (inne niz M1/M2 Operatora)

Wszystkie na `gra/src/units/battleRoster.ts`, cofniete KOPIA, po kazdej `git diff --quiet`
czysto, md5 zgodny.

- **E-A** `collectAtkRosterNearCity` liczy od KOTWICY, nie od miasta (`battleHex` + `radiusFrom`)
  — dokladnie rozjazd dwoch funkcji z sekcji RECON → **22/22 ZIELONE, parytet zielony**.
- **E-B** promien `> 1` → `> 2` (szerszy sklad kazdej bitwy w polu) → **22/22 ZIELONE**.
- **E-C** galaz obroncy `return true` → **21/1**, czerwieni `adjacent defender scout excluded`.
- **E-D** warunkowa furtka dla zwiadowcy (martwa na tym fixturze) → 22/22 (oczekiwane).
- **E-E** usuniety filtr `ownerId` → **21/1**, ale czerwieni **stara** asercja `:154`, nie nowe.
- Kontrola M1 Operatora odtworzona: **19/3** — zgodnie z raportem; parytet zielony pod M1 jest
  tu POPRAWNY (zmiana symetryczna, kryterium 4 rundy 1).

## ZARZUTY

**1. Asercja parytetu (`:176-186`) jest slepa na klase rozjazdu, dla ktorej temat powstal.**
`parityAnchor = { ...hastati, q: openCity.q, r: openCity.r }` stawia kotwice NA heksie miasta,
wiec `battleHex` i punkt pomiaru dystansu sa w obu funkcjach identyczne — obliczenia redukuja
sie do tego samego wyrazenia. Dowod: mutacja **E-A**, czyli realny rozjazd `battleHex`/kotwica
wskazany w RECON, zostawia bramke **22/22 z zielonym parytetem**. Kryterium 3 rundy 1
(„bez niej funkcje rozjada sie ponownie za pol roku") i polecenie ratyfikacji („zeby funkcje
nie rozjechaly sie w przyszlosci") nie sa spelnione co do skutku. Uklad kontrolny podal sam
Operator w `03-obrona-runda1.md`: kotwica `(5,0)` obok miasta daje `["u0","u3"]` vs `["u0","u2"]`
— parytet NIE zachodzi i wlasnie ten uklad rozroznia funkcje. Okolicznosc lagodzaca: ratyfikacja
narzucila „wspolna kotwica na heksie miasta" doslownie; Operator wykonal polecenie, ale nie
zglosil, ze tak umiejscowiona asercja nie moze zaczerwieniec.

**2. Przepisana asercja (`:167-171`) nie ma ograniczenia GORNEGO — „nikt poza nim" nie jest
nigdzie sprawdzone.** Zaimplementowana para bada tylko: (a) brak zwiadowcy, (b) obecnosc trzech
imiennych jednostek. Brak `atkWithScoutIds.size === 3`. Ratyfikacja uzasadniala zmiane zdaniem
„nowa wymaga imiennie, ze wypadl dokladnie zwiadowca **i nikt poza nim**" — ta czesc nie
powstala, a stary `length === 2` ograniczenie gorne mial. Dowod: **E-B** (nadmiarowy sklad
kazdej bitwy) → 22/22 zielone; **E-E** lapie wylacznie nietknieta asercja `:154`. To dokladnie
tryb trzeci z §REGULA PRZECIW SAMOOSZUKIWANIU: zmiana skladu bitwy bez zauwazenia. Poprawka:
jeden czlon `atkWithScoutIds.size === 3`.

**3. Nietautologicznosc asercji parytetu nie zostala wykazana zadna mutacja.** M1 i M2 celuja
w asercje zwiadowcy i „pozostale trzy"; zadna nie testuje parytetu. Raport
(`03-operator-runda2.md`) podaje jako zabezpieczenie „straznik `size > 1`", ktory broni wylacznie
przed przypadkiem dwoch pustych zbiorow. Kryterium 4 rundy 1 wymagalo dowodu mutacyjnego per
asercja; dla nowej asercji parytetu go brak — a E-A pokazuje, ze w istotnym kierunku wypada zle.

## OBSERWACJE

- Prompt rundy 2 wymagal HEAD `7a19f591`; zastalem `45edcc00`, drzewo CZYSTE. Nie zatrzymalem
  sie na `BLOCK`: `7a19f591` jest przodkiem `45edcc00`, a caly rozjazd to wylacznie recenzowana
  praca (`83482d5c`) plus obrona rundy 1. Stan promptu, nie worktree, jest nieaktualny.
- `_tmp-battle-roster-test.cjs` uruchomiony: 7/7, ale pisze bundle pod STALA nazwa w `os.tmpdir()`
  — klasa bledu wprost nazwana w C-001. Wzmacnia obserwacje 1 Operatora.
- Trzy obserwacje Operatora potwierdzam odczytem; `collectDefRosterNearCity` faktycznie nie
  filtruje po `ownerId` (`battleRoster.ts:122-128`).

## TESTY (uruchomione PRZEZE MNIE, nie przepisane)

`map-field-battle-test` **22/22** · `tsc --noEmit` **exit 0** · `logic-test` 213/213 ·
`tech-tree-test` 19/19 · `research-test` 33/33 · `unit-replace-test` 13/13 · `combat-test` 6/6 ·
`battle-roster-test` 7/7 · `retreat-garnizon-fortyfikacja-test` 27/27 · `battle-summary-test` OK ·
`auto-battle-power-test` 14/14 · `entity-card-contract-test` 75/75 ·
`_tmp-battle-roster-test` 7/7. Sasiedztwo z grepu po `battleRoster` — komplet.
Po wszystkich bramkach i mutacjach `git status --short` PUSTE.

## ZMIANY/COMMIT

Zapisany wylacznie ten plik, po jawnej sciezce. Zero zmian w `gra/`.

BLOKADY: brak.
RUNDY: 2/5
NASTEPNY KROK: Obrona Operatora (lista zarzutow niepusta), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
