# 02 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: zamknąć N3/N5/N6 i rozstrzygnąć N2 pomiarem, nie opinią.

Guard §2b: `dd0a4c85`, rodzic = `ee1f6756` (baza dispatchu), drzewo czyste przed i po.
Werdyktu nie wydaję — poniżej zarzuty, decyzja należy do Final Control.

## Teza Operatora zweryfikowana niezależnie

`git merge-base --is-ancestor ac09c091 HEAD` → **YES**; `ac09c091` (2026-08-18) dotyka
dokładnie trzech plików allowlisty. Odczytem kodu potwierdzam: N3 — `clearMineEligibleOverlay()`
jest pierwszą linią `applySceneResult()` (`main.ts:33333`), przed `scene = newSceneResult.scene`.
N5 — tautologia `/…,?\n/ || /…/` z `b0f9bcb9:277` zastąpiona pełnym regexem instrukcji importu
(`test.cjs:288`). N2 — `MINE_ELIGIBLE_STYLE.hugTerrainRelief:true`, materiał płachty ma
`depthTest` domyślne `true` + `polygonOffset` (`rangeOverlay.ts:415-427`).

## PK1 — asercje

`git diff ee1f6756..HEAD -- gra/` **pusty**: żaden plik bramki nie tknięty, więc osłabienie
niemożliwe. Kontrola historyczna: `ok(` w bramce b0f9bcb9 **57** → ac09c091 **62** → HEAD **62**;
runtime **76/0** (bez zmian). Spadku brak.

## PK2 — zakres

`git diff ee1f6756..HEAD --stat` = 5 plików, wszystkie w
`dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/` (poz. 4 allowlisty).
Zero plików `gra/`. Brak sekretów. C-001 nienaruszony: `tsc --noEmit` jedyną kompilacją,
`esbuild` w harnessie ma 627 precedensów w `gra/tools/*.cjs`, HTML do `mkdtempSync`.

## PK3 — sześć WŁASNYCH mutacji (inne niż Operatora), każda cofnięta KOPIĄ

| # | mutacja | bramka |
|---|---|---|
| M1 | `MINE_ELIGIBLE_STYLE.hugTerrainRelief` true→false | **69/7** |
| M2 | `depthTest:false` w materiale płaskiego tinta (`rangeOverlay.ts:60`) | **74/2** |
| M3 | `applySceneResult`: `clearMineEligibleOverlay()` PO podmianie sceny (kolejność, nie usunięcie) | **75/1** |
| M4 | `depthTest:false` wyłącznie w materiale płachty drape | **75/1** |
| M5 | `MINE_ELIGIBLE_TINT_OPACITY` 0.30→0.5 | **73/3** |
| M6 | ścieżka modułu w imporcie → `./render/rangeOverlayX` (identyfikator zostaje) | **75/1** |

Po każdej: `cp <kopia> <plik>` + `git diff --quiet` → **czysty**. M6 jest istotny: czerwieni
dokładnie asercję N5 przez człon, którego stara tautologia nigdy by nie złapała.

## PK4 — dowód wizualny (§9 poz. 6b)

Trzy PNG istnieją w `dowody/`. Obejrzałem je. `n2-przed-depthtest-false.png` pokazuje płaski
krążek malujący PRZEZ sylwetki gór i przez model jednostki — artefakt N2 odtworzony.
`n2-po-hugterrainrelief.png`: góra-przesłona i jednostka całkowicie szare, płachta obleka bryłę.
**Przebiegłem harness sam** (kopia w scratchpadzie, `OUT_DIR` poza repo): liczby odtworzone
co do piksela — PRZED 37 096 px / 1 084 na jednostce / 5 617 na przesłonie; PO 44 291 / 0 / 0;
widoczność 119 %.

## N6 — przeliczyłem samodzielnie

Własny raycast po `powierzchniaReliefuY` (5 wariantów × 720 kierunków, próg = `yOffset` 0,06):
wzgórze **0,776–0,914·R**, góra **0,713–0,817·R** — zbieżne z Operatorem. Jego korekta bracketu
z dispatchu (0,87–0,92·R to stałe footprintu, nie promień przesłaniania) jest **słuszna**.

## Bramki uruchomione przeze mnie

`kopalnia-podswietlenie-heksow-test.cjs` **76/0** · `tsc --noEmit` **0 błędów** ·
logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13** · combat **6/6**.

## ZARZUTY

1. **`dowody/n2-scena-bez-warstwy.png` — nazwa i opis nie zgadzają się z zawartością.**
   `n2-depthtest-chromium.cjs:270-271` zapowiada „Scena referencyjna bez warstwy", a plik
   zawiera przebieg MASEK ID (czarne tło, czerwona jednostka, zielona przesłona). Przyczyna
   w kodzie: dla wariantu `'brak'` po przywróceniu materiałów (linia ~208) NIE ma ponownego
   renderu, więc w buforze zostaje render masek. Raport 01 wymienia ten plik w liście „Zrzuty:"
   bez zastrzeżenia. Znaczenie: dwa nośne zrzuty (przed/po) są poprawne, kryterium 4 spełnione —
   ale artefakt dowodowy o mylącej nazwie jest pułapką dla następnego czytelnika `dowody/`.
   Poprawka: render po przywróceniu materiałów albo zmiana nazwy na `n2-maski-regionow.png`.

2. **Kryterium 3 (N6) — „jedynie wąski pierścień" nie zgadza się z policzoną arytmetyką dla Góry.**
   `gra/src/render/rangeOverlay.ts:451-453`. Z mojego pomiaru: dla Góry promień przesłaniania
   0,713–0,817·R, więc widoczny pierścień to **29,0–46,0 % pola krążka** (najgorszy wariant:
   szerokość pierścienia 0,257·R = 26,5 % promienia). Przy 46 % pola określenie „jedynie wąski"
   przeszacowuje zasłonięcie — dokładnie ten rodzaj rachunku „na oko", przed którym ostrzega
   tryb trzeci dispatchu. Kryterium 3 jest binarne, a `rangeOverlay.ts` jest na allowliście,
   więc korekta była w zasięgu. Operator wykrył rozbieżność bracketu, ale zdania nie tknął.

3. **Raport 01, wiersz N2 tabeli: „w `gra/src/render/` **nie ma już** `depthTest:false`" — nieprawda.**
   `grep -rn "depthTest: false" gra/src/render/` daje **12 trafień** (`units.ts` ×4, `siegeMarker.ts` ×3,
   `cities.ts`, `unitOwnerEmblem.ts`, `cityMapStatChip.ts`, `workerFieldOverlay.ts`,
   `cityOkolicaOverlay.ts`, `unitStatPlate.ts`). Prawdziwe zdanie brzmi: „nie ma go w ścieżce
   warstwy kopalni / w `rangeOverlay.ts`". Znaczenie: nadgorliwa generalizacja w komórce podanej
   jako „Stan na `ee1f6756`" — merytorycznie temat jest zamknięty, ale zdanie w tej formie
   fałszywie sugeruje, że cały katalog renderu jest wolny od tej flagi.

Zarzutów co do kryteriów 1, 2, 4, 5, 6, 7 oraz PK1/PK2/PK3 — **brak** po realnym sprawdzeniu.

## ZMIANY/COMMIT

Tylko ten raport. Zero zmian w `gra/`. Wszystkie mutacje cofnięte kopią, drzewo czyste.

## BLOKADY

Konflikt dispatch↔kod (C-054) potwierdzony niezależnie: dispatch opisuje cztery defekty
zamknięte przez `ac09c091` PRZED jego napisaniem. `DECISION_REQUIRED` Operatora jest zasadne.

## RUNDY

1/5.

## NASTĘPNY KROK

Final Control — werdykt wobec trzech zarzutów; wszystkie są kosmetyczne i mieszczą się
w allowliście (poz. 1 i 4), więc runda 2 na tym samym ID jest tania.

DEPLOY/PUSH: NIE WYKONANO
