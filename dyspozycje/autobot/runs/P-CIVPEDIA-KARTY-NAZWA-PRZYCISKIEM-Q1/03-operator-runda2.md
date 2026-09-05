# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — Operator, runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1`
ROLA: Operator · MODEL+EFFORT: **Opus 5, effort high**
DATA: 2026-09-04
BAZA: `c8483a64` · HEAD PRZED: `3d9713de` · HEAD PO: `d67d739d`
GOAL (R2-1): zdjąć w `wydarzenia-zbadano-karta-tech-real-render-test.cjs` wyłącznie
warunek strażnika `clickRowLabel`, który przerywał scenariusz BEZ kliknięcia, gdy punkt
etykiety należy do `button[data-entity-kind]`.

## ZMIANY/COMMIT

`d67d739d` — **jeden plik, jedna linia**, w całości w ratyfikowanej allowliście:

- `gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs:292`

```diff
-  if (at === null || at.inButton === true || at.inKey !== true) {
+  if (at === null || at.inKey !== true) {
```

Człon `at.inKey !== true` **zostaje** — scenariusz nadal wymaga, żeby punkt kliku należał
do `.entity-card-row-key`, więc dalej klika w ETYKIETĘ, a nie w dowolne miejsce wiersza.
Produktu nie tknięto (`git show --stat d67d739d` = 1 plik, 1+/1-).

## TESTY

| Bramka | Baza `c8483a64` | Po zmianie `d67d739d` |
|---|---|---|
| `wydarzenia-zbadano-karta-tech-real-render` | **144/1** (zmierzone niezależnie) | **144/1** |
| `tsc --noEmit` | — | zielone (exit 0) |
| `improvement-card-callsites` | — | 36/0 |
| `civpedia-karty-nazwa-przyciskiem` | — | 27/0 |
| `unit-info-card-viewport-height-real-render` | — | 35/0 |
| `tech-discovery-card-real-click` | — | 12/0 |
| logic / tech-tree / research / unit-replace / combat | — | 213/213 · 19/19 · 33/33 · 13/13 · 6/6 |

**Parytet (B7) co do WARTOŚCI, nie tylko liczby.** Bazę zmierzyłem sam, na osobnym
worktree `--detach c8483a64`, nie przepisując liczby z rundy 1. Linia FAIL bazy i linia
FAIL po zmianie są **bajtowo identyczne** (`diff` pusty):

```
FAIL (B7) 1280px: tresc karty bocznej MIESCI SIE w karcie (scrollHeight <= clientHeight)
  -- {"cardClientH":470,"cardScrollH":690,"cardClientW":658,"cardScrollW":658,
      "overflowsY":true,"overflowsX":false,"warunekRowH":19,...}
```

## DOWÓD, ŻE SCENARIUSZ FAKTYCZNIE KLIKA (nie omija sprawdzenia)

Trzy niezależne przesłanki, nie sam licznik faili:

1. **Asercje, które zzieleniały, są nieosiągalne bez skutku kliku.** Zielone są dziś
   m.in. `(B6) klik w etykiete otworzyl karte „Obóz łowiecki" OBOK` (czyta
   `side.title === 'Obóz łowiecki'`), `obie karty w DOM z NIEZEROWA powierzchnia`,
   `hit-test w srodku KAZDEJ karty trafia w TE karte`, `prostokaty kart NIE zachodza na
   siebie`. Przed zmianą te same pola były `{"rect":null,"title":null}` — karty bocznej
   po prostu nie było, bo strażnik wychodził przed `page.mouse.click`.
2. **Mutacja dowodowa (nietautologiczność).** W pliku po zmianie wyłączyłem SAM klik
   (`await page.mouse.click(cx, cy)` zakomentowane), reszta bez zmian, ten sam dist:
   bramka spada **144/1 → 138/3**, czerwienieją dokładnie asercje skutku kliku
   (`karta „Obóz łowiecki" OBOK`, `obie karty w DOM`). Mutacja cofnięta
   (`git checkout HEAD --`), drzewo czyste, HEAD `d67d739d`.
3. **Strażnik nie zniknął, zwęził się.** `at.inKey !== true` nadal przerywa scenariusz,
   gdy punkt nie trafia w etykietę; asercja `(B6) hit-test PRZED klikiem` dalej jest
   osobno mierzona i zielona.

Czyli: zdjęcie warunku **przywróciło możliwość kliknięcia**, nie ominęło sprawdzenia.

## BLOKADY

Brak.

## NOTY (nie zarzuty, do decyzji orkiestratora — nie naprawiane w tej rundzie)

1. **Rozjazd liczby w prompcie rundy 2.** Prompt podawał kryterium
   `civpedia-karty-nazwa-przyciskiem 24/0`; zmierzyłem **27/0, zero faili**. `24/0` to stan
   **sprzed OBRONY** rundy 1 — `01-operator-runda1.md:51` notuje stan końcowy „27/0
   (24/0 przed OBRONĄ)". Brak regresu; poprawna liczba odniesienia to 27/0.
2. **Komentarz nad `clickRowLabel` (l. 268-272) i etykieta asercji `(B6)` (l. 581) nadal
   mówią „NIE jest wewnątrz `button[data-entity-kind]`"** — po GOAL 1 etykieta JEST
   przyciskiem, więc ten opis przestał odpowiadać kodowi. **Świadomie nie tknąłem**:
   dispatch rundy 2 mówi „Nic więcej w tym pliku", a poszerzanie zmiany pod pretekstem
   ratyfikacji jest wprost zakazane. Do domknięcia osobnym, jednolinijkowym tematem
   dokumentacyjnym.

## R2-2 — OPIS DLA ORKIESTRATORA (bez naprawy)

Obie bramki (`civpedia-caly-wiersz-przyciskiem` 19 faili, `entity-card-cross-links-nested-overlay`
10 faili) są czerwone z **jednej przyczyny i nie jest nią błąd**: to **sprzeczność kontraktów
dwóch zatwierdzonych tematów**. `openDialog()` w `gra/src/ui/entityCards/renderer.ts:474-479`
**bezwarunkowo** woła `activeDialog.dismiss()` przed zbudowaniem nowej karty — to celowy
wynik `P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1`, zamówionego przez właściciela („żeby nie
wszystkie włączały się naraz […] gdy klika się inną kartę, poprzednia powinna zniknąć"),
którego kryterium K1 wymaga wprost: po kliknięciu linku krzyżowego w karcie A ma zostać
**dokładnie 1 backdrop, wyłącznie B, A już nie istnieje**. Tymczasem starszy
`entity-card-cross-links-nested-overlay-test.cjs:163-165` żąda `depthAfterB === 2`, czyli
że A ma **zostać pod spodem** — a `renderer.ts:406-411` wciąż opisuje w komentarzu
zachowanie „NIE zamykając karty źródłowej", które kod już nie realizuje. Stąd zmierzony
wzorzec `depthBefore:1, depthAfter:1` przy **poprawnym `cardTop`**: karta docelowa jest
właściwa, tylko zastępuje źródłową zamiast się na niej kłaść.

**Wniosek dla nowego tematu:** to nie jest defekt do cichego naprawienia przez Operatora —
dwa kryteria wzajemnie się wykluczają, a wybór („jedna karta naraz" vs „stos zagnieżdżony")
jest decyzją właściciela o UX, więc wymaga **pytania ABC**, nie decyzji wykonawcy. Po
decyzji: albo wycofać `entity-card-cross-links-nested-overlay` i dostosować
`civpedia-caly-wiersz-przyciskiem` do modelu jednej karty, albo przywrócić stos i cofnąć
K1 tamtego tematu. Komentarz `renderer.ts:406-411` do poprawienia tak czy owak.

## RUNDY

2/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — ponumerowane zarzuty wg §16a.

DEPLOY/PUSH: **NIE WYKONANO**
