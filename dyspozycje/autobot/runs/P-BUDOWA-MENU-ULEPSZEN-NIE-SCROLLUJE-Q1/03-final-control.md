# 03 — FINAL CONTROL (runda 1)

STATUS: FAIL
GOTOWOŚĆ DO INTEGRACJI: **NIE**
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" ma być **w całości osiągalna i klikalna** przy każdym
realistycznym powiększeniu przeglądarki i rozmiarze okna. Zgodny z `00-dispatch.md`
i z GOAL w obu poprzednich raportach — bez przesunięcia (§16b pkt 1–2).

Worktree Final Control: `/home/user/wt-FC-P-BUDOWA-MENU` (detached @ `8e4f7cfb`), własny
harness, zero zależności od liczb Operatora/Evaluatora.

## Werdykt Evaluatora — POTWIERDZONY niezależnym pomiarem, nie odczytem raportu

Własny skrypt (siatka **łączona** BR{100,125,150,175,200}% × UI{100,125,150}% × wys.
{1080,900,768,640} = 60 punktów, realny `page.mouse.click` na środku ostatniej pozycji +
callback `onSelectType`, nie samo `elementFromPoint`):

- **Stan `d0fd2301` (po naprawie): 5/60 nieklikalnych** — dokładnie te same 5 komórek co
  w raporcie Evaluatora (BR150×UI150×640, BR175×UI150×640, BR200×UI150×768,
  BR200×UI125×640, BR200×UI150×640).
- **Stan `416733e1` (przed naprawą): 29/60 nieklikalnych** — zgodne z liczbą Evaluatora.
- Z tych 5: **2 to realna regresja** (BR200×UI125×640, BR200×UI150×640 — PRZED klikalne,
  PO nie), pozostałe 3 były zepsute już PRZED i nie są przedmiotem tej rundy.
- Arytmetyka potwierdzona wprost z kodu: `turnStackBottomPx()+EVENTS_PANEL_ABOVE_TURN_GAP_PX`
  = 184px (174px w trybie zoom UI), rezerwa całkowita 264–274px; przy body 100/z·vh mniejszym
  niż ta rezerwa `calc(100% − …)` staje się ujemny i `max-height` zapada się do ~0.

## Dowód wizualny (§9 poz. 6a) — obejrzany, nie tylko zmierzony

Własne zrzuty żywego Chromium: `before-br150-ui100-900.png` odtwarza dokładnie zgłoszenie
właściciela („Warzelnia soli/Tarasy/Fort" pod paskiem); `after-br150-ui100-900.png` —
„Fort" w całości nad paskiem, bez nachodzenia. `after-br200-ui150-640-regression.png` —
przy regresji panel budowy jest **wizualnie NIEOBECNY na ekranie** (skurczony do ok. 16–34px,
poza widocznym kadrem tego zrzutu) — gorzej niż samo „nieklikalne", praktycznie niewidoczny.

## Próbny merge i kolizja równoległych tematów

`git merge --no-ff` gałęzi tematu na aktualny `origin/main` (`a79614db`): czysty, bez
konfliktów. Kolizja z `R-PRACA-JEDEN-PODZIAL-Q1`: ta gałąź **nie istnieje na `origin`**
(tylko lokalnie w tym środowisku, niewypchnięta, z niescommitowanym raportem Operatora) —
rekonesans i tak wykonany: `git merge-file` trzech wersji `buildModeHud.ts` (baza/`8e4f7cfb`/
`1f158649`) scala się **czysto, bez markerów konfliktu** — hunki nie nachodzą (ten temat:
CSS panelu linie ~111–190; tamten: `renderEmpirePracaSplit`/suwak linie ~274–320, plus
zmiana nazwy stałej w imporcie). Rekomendacja: bezpieczne do integracji w dowolnej
kolejności *dzisiaj*, ale to się może rozjechać przy kolejnych zmianach — rebase i ponowne
uruchomienie testów obu tematów po integracji pierwszego jest obowiązkowe, nie opcjonalne.

## Bramki — uruchomione niezależnie

`tsc --noEmit` 0 błędów; logic 213/213; tech-tree 19/19; research 33/33; unit-replace 13/13;
combat 6/6; `vite build` (`--outDir /tmp/civ-dist-fc`, C-001) OK, `git status` po buildzie
czysty poza moim micro-fixem. Defensywnie: `build-mode-lock-tip-position-real-render-test`
21/21, `praca-budmode-slider-max-real-render-test` 13/13. Test tematu: 25/25 (bez zmian po
mikro-poprawce niżej). Sekret w diffie: brak.

## Integration micro-fix (wykonany sam, bez zwrotu do rundy 2)

Oba stuby (`build-panel-scroll-brandAssets-stub.ts`, `-scienceOwlIcon-stub.ts`) miały
nagłówek przekopiowany z testu tooltipa blokady („test mierzy geometrię tooltipa blokady")
— nie opisywał tego testu. Poprawiony na właściwy opis (osiągalność/klikalność ostatniej
pozycji listy). Czysto tekstowe, zweryfikowane ponownym uruchomieniem testu (25/25 bez
zmian). Nie ruszałem sformułowań w `01-operator.md`/`02-evaluator.md` (historyczny zapis
cudzych raportów) ani realnego „dead code" komentarza przy `STYLE_ID` — to zamierzony,
obronny wzorzec identyczny z `sidePanelHud.ts`/`bottomBarHud.ts`, nie błąd.

## Do rejestru orkiestratora (nie blokuje tej rundy, ale nie zostawiać w samym raporcie)

`REJESTR-PROSB-I-ZADAN.md` **nie ma żadnego wpisu** dla tego ID — do uzupełnienia. Trzy
uwagi drugorzędne Evaluatora (limit architektoniczny ≥2,25× w 3 komórkach, `.et-hint`
wchodzący pod panel, długość raportu Operatora) wymagają zapisu jako osobne pozycje w
rejestrze przed ostatecznym zamknięciem tematu — dziś nigdzie poza `02-evaluator.md`.

BLOKADY: regresja klikalności w 2 punktach siatki łączonej (BR200×UI125×640,
BR200×UI150×640) — potwierdzona niezależnie, patrz wyżej.
RUNDY: 1/5 — licznik zgodny w obu poprzednich raportach, brak cichego resetu (§3a).
NASTĘPNY KROK: Operator, runda 2 — poprawka „podłoga wysokości panelu" (§Evaluator pkt 1)
plus rozszerzenie testu o siatkę łączoną i realny `page.mouse.click` (pkt 3), to samo ID,
ta sama gałąź.
DEPLOY/PUSH: NIE WYKONANO.
