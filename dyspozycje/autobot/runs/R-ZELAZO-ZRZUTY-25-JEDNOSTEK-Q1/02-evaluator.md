# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: `R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1`
GOAL: Zrzuty wszystkich 25 jednostek epoki Żelaza od przodu, każdy podpisany nazwą, żeby
właściciel zobaczył je po dwóch seriach audytu; zero zmian w kodzie gry. (Porównany dosłownie
z `00-dispatch.md` — zgodny, §16a p.9.)

ZMIANY/COMMIT: sprawdzone z własnego worktree `/home/user/wt-eval-zrzuty-25` (detached
`b80ba50d`). Diff od `git merge-base` = `bfb180a8` (§9 poz. 9): **2 pliki** —
`gra/tools/zelazo-zrzuty-25-jednostek-render.cjs` (+681) i `01-operator.md` (+61).
`gra/src`/`gra/data`: **zero**. Zero PNG, zero sekretów. Po uruchomieniu harnessu `git status`
pusty (brak śmieci `.zelazo-zrzuty-25-*`), `units.ts` nietknięty — mutacja tylko w pamięci.

TESTY — wszystko uruchomione przeze mnie, nie przepisane z raportu:
- Harness **61/61**, zero błędów konsoli. Nietautologiczność (§9 poz. 6a): po mutacji 25/25
  traci dedykowany dispatch, (D1) zielone.
- **Determinizm: 26/26 PNG bajtowo identycznych** z runem Operatora, `DOWODY-modeli.json`
  identyczny — reprodukcja w osobnym worktree.
- Bramki §6: `tsc` 0 · logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 ·
  combat 6/6. `map-gen` nie uruchamiany.
- **Kryterium nr 1 — odtworzone trzecim dowodem, którego Operator nie użył:** 25/25 ma WŁASNY,
  unikalny prefiks nazw mesh (`ac-`, `falangita-`, `kt-`, … pełna lista w `DOWODY-modeli.json`) —
  zero generyka. `userData.anchors` w 21/25, ze słownikiem serii audytu. Wyjątek Falanga
  sprawdziłem sam: jedyny lokator kategorii `falanga` w całym `units.json` (75 pozycji).
- **Lukę domknąłem sam:** mapa woła `buildUnitModel(cat, color, typeId)` (`units.ts:5997,6015`),
  a `units.ts:1705` mówi wprost, że `typeId` to nazwa POLSKA = pole `Jednostka` — harness
  renderuje DOKŁADNIE ścieżkę mapy; pułapka `manualBattle.ts` tych zrzutów nie dotyczy.
- **Oględziny wzrokowe** (arkusz 5×5 + 6 pełnych): podpis wypalony, oba kadry, tło jasne,
  niebieski spójny. Pomiar pikselowy 25×2 paneli: nic nie dotyka krawędzi, maksimum 433/470 px
  (Rydwan, kamera gry) — rydwan i katapulta nieprzycięte. Naocznie potwierdziłem defekty #1
  (szpara dłoń–drzewce Gaesatae), #3 (tarcza Harappy), #4 (skrócona hasta Triari).

BLOKADY: brak.

UWAGI — kosmetyczne, do rejestru, nie wracają do Operatora:
1. Raport Operatora 495 słów wobec ~400 z §11.
2. Stopka Triari i Wojownika germańskiego: „model 37 mesh vs generyk kategorii 37 mesh" czyta
   się jak zaprzeczenie własnego „MODEL DEDYKOWANY: TAK" (różnica jest w NAZWACH mesh).
3. Etykieta panelu kończy się 3 px nad czubkiem Miecznika galijskiego — dziś bez zasłonięcia,
   ale wyższa jednostka zostanie zakryta.
4. **Powiedzieć właścicielowi wprost:** 4 jednostki konne mają w panelu PRZÓD profil, bo ich
   modele patrzą w +X, a reszta w +Z (defekt #2 Operatora). Harness ten błąd ujawnia zamiast
   ukryć — ale bez tego zdania właściciel uzna, że pominięto jego prośbę.
5. Czterech defektów nie ma jeszcze w `REJESTR-PROSB-I-ZADAN.md` (słusznie — poza allowlistą);
   wpisuje orkiestrator przed zamknięciem (§3b, §16b p.4). Brak też wiersza dla tego ID.

RUNDY: 1/5.
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.
