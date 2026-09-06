# P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 — Evaluator, runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`
GOAL: Jeden surowiec = jeden kolor, wzięty z jednego źródła prawdy.
ROLA/MODEL+EFFORT: Evaluator — Opus 5, effort high.
GUARD §2b: `c3cde217`, drzewo czyste — zgodne z promptem. Po pracy: bez zmian, drzewo czyste.

## CO ZWERYFIKOWAŁEM SAM (nie z liczb Operatora)

**tsc** `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0, zero linii wyjścia.

**Pięć bramek referencyjnych** — logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6; wszystkie exit 0.

**Rodzina bramek kolor/surowc/hud** (19 plików `*-test.cjs` z `ls gra/tools | grep -iE
'kolor|surowc|hud'`): 17 zielonych. Dwie czerwone — `koszty-surowcowe` 125/3 i
`minimapa-ikona-robotnik-kolor-live` 49/7 — **przeliczone na czystej kopii bazy `094be1db`
w `/tmp` i czerwone IDENTYCZNIE** (125/3, 49/7): pre-istniejące.

**Nowa bramka** `kolor-surowce-spojnosc-test.cjs` — 33/33. **Mutacja własna:**
`praca: '#e8d88a' → '#ff3fb0'` → 32/33, `FAIL: A2b praca`, exit 1. Przywrócone KOPIĄ pliku,
`git diff --quiet` zielone. Bramka nietautologiczna.

**Żywy Chromium (getComputedStyle), własny pomiar.** Build C-001:
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/claude-0/dist-eval-17752-26172
--emptyOutDir` (poza repo, unikalny sufiks); `git status` po buildzie czysty. Wynik:
`:root` niesie `--civ-res-{praca,zywnosc,skarbiec,kultura,religia}=#e8d88a`,
`--civ-res-nauka=#5a9bd4`, zgodnie z `--tg-gold-primary` / `--tg-science-blue`.
W kaskadzie HUD-u `.civ-hud .civ-res-c-nauka` → `rgb(90,155,212)`, pozostałe pięć →
`rgb(232,216,138)`. **Kod renderuje się tak, jak deklaruje.** Aplikacja montuje HUD
od razu po wczytaniu (`.civ-hud` obecny, 11 chipów, zero pageerror).

**Zliczenie pikseli w dowodach** (dokładne dopasowanie hex, Pillow) — patrz zarzuty 1–2.

**Własny grep konwencji na bazie `094be1db`** — patrz zarzuty 3–4.

## ZARZUTY

1. `po-hud-mapy-lewy.png` (16 unikalnych kolorów, 0 px `#e8d88a`, 0 px `#5a9bd4`) i
   `po-hud-mapy-prawy.png` (0 px obu) są PUSTE; `po-hud-mapy-pelny.png` to ekran bez HUD-u
   (68 763 px `#efefef`, 0 px `#5a9bd4`), podczas gdy `przed-hud-mapy-pelny.png` ma 158 px
   `#7cb4e4`. Kryterium końca 4 (zrzut PO HUD mapy) niespełnione, a nota 6 raportu deklaruje
   te pliki jako przeliczone na finalnym kodzie. Mój żywy Chromium pokazuje, że HUD montuje
   się od razu — to defekt zrzutu, nie ograniczenie aplikacji.
2. `mutacja-panel-miasta-{pelny,chipy-lewe,chipy-prawe}.png` są BAJTOWO IDENTYCZNE
   z `po-panel-miasta-*` (md5 `c34a3711…`, `63a3a8c0…`, `aef8d097…`) i mają 0 px `#ff3fb0`.
   Raport twierdzi: „zmiana widoczna na obu zrzutach … `mutacja-panel-miasta-*` — ikona Pracy
   `rgb(255,63,176)`". Kryterium 5 dla panelu miasta niespełnione.
3. Wybór złota dla Skarbca — największa zmiana widoczna dla gracza („Pieniądz"
   `#5a9bd4`→`#e8d88a` w 3 miejscach) — nie jest w raporcie POLICZONY. Mój grep na bazie:
   w `cityPanel.ts` Skarbiec ma `'blue'` w 3 miejscach (1845, 10686, 11153) wobec `'gold'`
   w 2 (4555, 11157) — w panelu miasta wygrywa BŁĘKIT; po doliczeniu chipa HUD-u 3:3, remis.
   Kryterium binarne („wygrywa wariant częstszy, policzony") niespełnione; rozstrzygnięcie
   remisu jest decyzją kolorystyczną właściciela (ECHO), nie Operatora.
4. Liczba podana dla `#7cb4e4` („3×") jest zaniżona — na bazie są 4 miejsca:
   `cityPanel.ts:2451`, `hud.ts:607`, `mapToolbarHud.ts:61` i `:73`.
5. `mapToolbarHud.ts` (przycisk Nauki, `#7cb4e4` → `var(--civ-res-nauka)`) jest zmieniony,
   ale nie występuje ani w tabeli G1 („wszystkie miejsca nadania koloru"), ani w tabeli
   przed/po. Trzecia powierzchnia zmieniona bez wpisu.
6. `.civ-cs .praca-split-summary{…color:#8ec5ff}` (`cityPanel.ts:2148-2149`) zostawia Pracę
   w błękicie WEWNĄTRZ panelu miasta; raport klasyfikuje ją jako „poza parą wskazaną przez
   właściciela", choć to ten sam plik i ten sam ekran. GOAL („jeden surowiec = jeden kolor")
   niespełniony, a nowa bramka tego NIE łapie: `RES_MARKER` nie zna `praca-split-summary`,
   a literał stoi w osobnej linii niż selektor. Kryterium 3 ma dziurę dokładnie tam, gdzie
   rozjazd pozostał.
7. Docstring `resourceColors.ts` deklaruje, że moduł obejmuje „ikona/**medalion**", a
   medaliony (`hud.ts:599/600`, `cityPanel.ts:2465`) zostały literałami poza paletą i są
   jawnie na whiteliście A6 bramki. Opis modułu sprzeczny ze stanem i z własną bramką.
8. Skrypt generujący zrzuty nie jest zacommitowany — dowodów real-render nie da się
   odtworzyć ani przeliczyć w kolejnej rundzie (zarzuty 1–2 są tego bezpośrednim skutkiem).

## ZMIANY/COMMIT

Wyłącznie ten raport w `dyspozycje/autobot/runs/P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1/`.
Bez `git add -A`, po jawnej ścieżce. Kod tematu nietknięty.

## BLOKADY

Zarzut 3 wymaga ECHO właściciela (remis 3:3 przy zliczeniu; kolorystyka to jego domena).

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / decyzja orkiestratora; werdyktu PASS/FAIL nie wydaję.
DEPLOY/PUSH: NIE WYKONANO
