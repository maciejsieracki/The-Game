# 03 — FINAL CONTROL

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T11`
GOAL: Audyt Katapulty (onager) — ostatni temat serii `R-ZELAZO-AUDYT-POZOSTALE-Q1`.

GOTOWOŚĆ DO INTEGRACJI: **TAK.**

## Commity na gałęzi (`git log origin/main..HEAD --oneline`)

```
c9403247 T11 R-ZELAZO-AUDYT-POZOSTALE-Q1: Final Control micro-fix — 5 falszywych/niescislych zdan w komentarzach
6814366c T11 R-ZELAZO-AUDYT-POZOSTALE-Q1: raport Evaluatora (PASS-WITH-NOTES)
9176af07 T11 R-ZELAZO-AUDYT-POZOSTALE-Q1: audyt Katapulty (onager)
```

Branch `autobot/ZELAZO-AUDYT-T11-Q1`, odgałęziona od `origin/main` = `88e2181f`,
**nie pushowana**.

## Metoda

Nie przyjąłem żadnego twierdzenia Operatora ani Evaluatora na wiarę — zbudowałem
własny, niezależny harness (esbuild + Playwright/Chromium, poza obydwoma
istniejącymi testami) i zmierzyłem od zera: maxR rodziny oblężniczej, sylwetkę
z kamery gry przy `U=1.0*HEX_R`, oraz — przez tymczasowy `git worktree` na
`88e2181f` (usunięty po użyciu) — stan geometrii SPRZED T11 (pary „unoszących
się" brył). Dodatkowo wyrenderowałem model z pięciu kątów spoza istniejącego
testu (3/4, bok, góra, nisko-z-przodu, kamera gry) i obejrzałem wzrokiem.

## Kryteria sukcesu 1–7 (00-dispatch.md) — zweryfikowane od zera

1. **Model zmierzony** — potwierdzone: 48 nazwanych brył, `userData.anchors`
   obecne (własny odczyt przez `buildUnitModel`, nie z raportu).
2. **Typ machiny ustalony i spójny** — onager, jedno ramię + kamień kulisty;
   potwierdzone wizualnie (widok 3/4 i bok pokazują pojedyncze ramię, procę na
   dwóch sznurach, kamień, pęk skrętu między dwoma stojakami) i przez H10/H13.
3. **Sekcja historyczna K1–K9** — obecna, z lokalizacjami źródeł (Ammianus
   XXIII.4.4–7, Witruwiusz X.10–X.11); K2 jawnie nazywa niezgodność chronologii
   (onager attestowany dopiero IV w. n.e.) zamiast ją ukrywać.
4. **Real render Playwright + dowód nietautologiczności** — uruchomione
   niezależnie: `zelazo-katapulta-real-render-test.cjs` 22 pass/0 fail,
   macierz M0–M15 w całości wydrukowana, każda z H1–H15 czerwienieje pod
   dedykowaną mutacją. Dodatkowo własne zrzuty z 5 kątów (patrz niżej).
5. **Zero regresji: T1–T10 + 5 bramek referencyjnych** — wszystkie zielone,
   patrz „Testy" niżej.
6. **`tsc --noEmit` i `vite build` (C-001)** — oba czyste, uruchomione osobno
   PRZED i PO mikro-poprawce.
7. **Wątpliwości historyczne rozstrzygnięte i udokumentowane** — K2/K3
   pokazują rozumowanie, nie zamiatają problemu.

Wszystkie siedem: **spełnione**, potwierdzone niezależnym pomiarem.

## Wizualna ocena (Playwright, 5 kątów, w tym kamera gry)

Zrzuty: `po-katapulta-kamera-gry.png` (test istniejący) + własne
`fc-front-elevated-game-camera.png`, `fc-iso-3q.png`, `fc-side.png`,
`fc-top-down.png`, `fc-low-front.png`. Model spójny wizualnie: pojedyncze
ramię osadzone w pęku liny skrętnej między dwoma stojakami, proca na dwóch
sznurach z kamieniem zwisająca pod hakiem, poduszka zderzaka na dwóch słupach
z przodu, koła symetryczne, barwa właściciela symetryczna (lewa/prawa burta).
Zero błędów konsoli/JS na żadnym z renderów. Widok z kamery gry (jedyny, jaki
gracz faktycznie widzi) czytelny, proporcjonalny do rodziny oblężniczej —
żadnych klipujących się ani unoszących się elementów gołym okiem.

## Znaleziska i decyzja o mikro-poprawce

Potwierdziłem niezależnym pomiarem (nie z raportu Evaluatora) **5 zdań w
komentarzach produkcyjnych, które były fałszywe lub niescisłe** — wzorzec
znany z T5–T10:

1. **K4 (`units.ts`)** — „przekrój belek ... są [MOD] wielokrotnościami" było
   przesadzone: z `MOD` liczy się wyłącznie półszerokość podłużnic ramy
   (`FRAME_HW`); wysokość podłużnic i wszystkie pozostałe belki (obie
   poprzeczki, słupy skrętu, słupy zderzaka) liczą się z `U`. Potwierdzone
   czytaniem kodu wprost.
2. **K8 (`units.ts`)** — „lina kołowrotu ... hakiem na ramieniu" i „zapadka na
   zębatce założona": obie nieprawdziwe wobec kodu ~300 linii niżej — lina
   biegnie do UCHA (`kt-arm-winch-eye`), nie haka (`kt-arm-hook`, trzyma
   procę); mechanizm to sworzeń przez tarczę, z komentarzem WPROST mówiącym
   „nie o zapadce". Potwierdzone czytaniem kodu.
3. **Skala tokena (`units.ts`)** — „17 315 pikseli" przy `U=HEX_R`: zmierzyłem
   niezależnie na żywym renderze (własny harness, ta sama kamera gry) —
   **17 480**. Wysokość 215 px się zgadzała.
4. **Skala tokena (`units.ts`)** — „Taran okuty 0.372" (maxR): zmierzyłem
   niezależnie — Taran okuty **0.331**, prawdziwy max rodziny to Taran
   **0.340**. Wniosek (Katapulta 0.328 mieści się w rodzinie) pozostaje
   prawdziwy, liczba cytowana była zmyślona.
5. **Komentarz wheel-tyre (`units.ts`)** — „a nie 0.002 POD terenem" mylił
   kierunek: wielokąt wpisany w okrąg nie może wystawać POZA okrąg, więc zła
   liczba segmentów dawałaby szczelinę NAD terenem (koło unoszące się), nigdy
   zapadnięcie pod teren. Sprawdzone rachunkiem geometrycznym (nie tylko
   przyjęte z raportu).
6. **Komentarz H5 w teście** (`zelazo-katapulta-real-render-test.cjs`) —
   „PRZED T11 unosiły się: kubeł z kamieniem, obie liny, oba koła i
   banderola" (sześć części): odtworzyłem STARY model w tymczasowym
   `git worktree` na `88e2181f` i przeliczyłem tym samym algorytmem
   (każda bryła vs najbliższa INNA) — realnie łapane były **dwie**: ramię i
   lewe koło (0.005 od ramy). Kubeł+kamień i para lin dotykały SIEBIE
   NAWZAJEM (zerowa szczelina wewnątrz pary), więc algorytm liczący jedynie
   najbliższą inną bryłę ich nie łapał osobno — mimo że cały ten zestaw był
   oderwany od reszty maszyny. Potwierdzone pomiarem na odtworzonym starym
   kodzie, nie z pamięci.

**Wszystkie pięć to czysto tekstowe niescisłości w komentarzach — zero zmian
logiki, geometrii ani progów testowych.** Zgodnie z zadaniem i precedensem
T8/U2-U3, poprawiłem je sam jako integration micro-fix na branchu (commit
`c9403247`), z dopiskiem „poprawka Final Control" w miejscu każdej zmiany i
krzyżowym odwołaniem tam, gdzie to pomaga (K8 → `kt-windlass-ratchet`).

**Nie zwracam do rundy 2** — żadna z poprawek nie dotyka `buildCatapult()` poza
treścią komentarza, allowlista (`units.ts` funkcja `buildCatapult` + linia
dispatchu, `gra/tools/*`) w pełni zachowana.

## Uwagi bez akcji (nie w kodzie produkcyjnym)

Evaluator zgłosił dodatkowo U5, U7–U11 jako nieścisłości w **prozie raportu
Operatora** (`01-operator.md`), nie w skomitowanym kodzie/komentarzach:
błędna liczba pikseli (17 315 zamiast 17 480 — TA SAMA liczba co w kodzie,
już poprawiona wyżej), „0.1101" niesprzeczne do odtworzenia, „obydwa końce w
próżni" nieprawda, „14 kotwic" zamiast 17, liczniki §9 zaniżone przez
`--skip-vite`. To są nieścisłości narracji etapu procesu, nie artefaktu
wchodzącego do `main` w sensie funkcjonalnym — nie wymagają mikro-poprawki
Final Control (raport Operatora jest logiem historycznym rundy, nie kodem).
Odnotowane tu dla ciągłości audytu, bez dalszej akcji.

## Testy — uruchomione W CAŁOŚCI, niezależnie, PO mikro-poprawce

```
tsc --noEmit                              : 0 błędów
zelazo-katapulta-real-render-test.cjs     : 22 pass, 0 fail (M0 nadal 1:1, macierz bez zmian)
logic-test.cjs                            : 213/213
tech-tree-test.cjs                        : 19/19
research-test.cjs                         : 33/33
unit-replace-test.cjs                     : 13/13
combat-test.cjs                           : 6/6
unit-power-test.cjs                       : 4 pass/2 fail — POTWIERDZONE pre-istniejące
                                             (ten sam wynik na 88e2181f, nie regresja)
zelazo-celtowie-soldurii-gaesatae-*.cjs   : 42/0
zelazo-falanga-*.cjs                      : 40/0
zelazo-gate-test.cjs                      : 24/24
zelazo-germanie-*.cjs                     : 80/0
zelazo-jezdziec-oszczepami-*.cjs          : 57/0
zelazo-konnica-asyryjska-*.cjs            : 31/0
zelazo-mezopotamia-*.cjs                  : 72/0
zelazo-srodziemnomorze-*.cjs              : 83/0
zelazo-super-rzym-grecja-*.cjs            : 92/0
vite build (--outDir poza drzewem, C-001) : czysty, 848 modułów, 0 błędów
```

Zero regresji na całej serii T1–T10 i 5 bramkach referencyjnych.

## Allowlista i diff

`git diff origin/main..HEAD --stat`: `gra/src/render/units.ts` (funkcja
`buildCatapult` + linia dispatchu — zweryfikowane hunk po hunku),
`gra/tools/zelazo-katapulta-real-render-test.cjs` (nowy plik, w allowliście
`gra/tools/*`), oraz `01-operator.md`/`02-evaluator.md` (raporty etapu).
`git diff --check`: czysty. `gra/data`, `WERSJE.md` nietknięte. Zakaz `npm run
build`/`git add -A` respektowany (build przez `node ./node_modules/vite/bin/
vite.js`, `git add` po nazwie pliku).

ZMIANY/COMMIT: `c9403247` (Final Control micro-fix, 2 pliki, +35/−16) na
`autobot/ZELAZO-AUDYT-T11-Q1`.
TESTY: patrz sekcja wyżej — wszystkie zielone, zero regresji.
BLOKADY: brak.
RUNDY: 1/5 (jedna runda Operator+Evaluator, zamknięta Final Control bez zwrotu).
NASTĘPNY KROK: integracja orkiestratora do `main` (merge `--no-ff`), następnie —
to OSTATNI temat serii — zbiorczy deploy ROBOCZA dla całej
`R-ZELAZO-AUDYT-POZOSTALE-Q1` (osobna, późniejsza bramka).
DEPLOY/PUSH: NIE WYKONANO.
