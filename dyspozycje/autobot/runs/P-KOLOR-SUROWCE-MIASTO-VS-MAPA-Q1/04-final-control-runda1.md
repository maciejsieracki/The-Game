# P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 — Final Control, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`
GOAL: Jeden surowiec = jeden kolor, wzięty z jednego źródła prawdy.
ROLA/MODEL+EFFORT: Final Control — Opus 5, effort high.
GUARD §2b: HEAD `f02019a7`, drzewo czyste przed i po mojej pracy.

## WERDYKTY

`1 → ODDAL` · `2 → ODDAL` · `3 → ODDAL` · `4 → ODDAL` · `5 → ODDAL` ·
`6 → ODDAL` · `7 → ODDAL` · `8 → ODDAL`

## DOWÓD WŁASNY (nie z raportów)

**Piksele — własny licznik pngjs na wszystkich 18 PNG.** Tabela obrony odtworzona
co do piksela. `po-hud-mapy-lewy` 221 `#e8d88a` / 75 `#5a9bd4` (nie 0/0),
`po-hud-mapy-pelny` 1722/161 z HUD-em (nie ekran `#efefef`) → zarzut 1 nieaktualny.
`mutacja-panel-miasta-chipy-lewe` 43 px `#ff3fb0`, `mutacja-hud-mapy-lewy` 26 px →
pliki nie są kopią PO, zarzut 2 nieaktualny.

**Własna mutacja w żywym Chromium — SKARBIEC (nie Żywność Operatora), własny build,
własny skrypt playwright.** Panel miasta: 164 px `#ff3fb0`, ikona chipa `zloto`
= `rgb(255,63,176)`. HUD mapy: 105 px, **11 chipów**, 0 `pageerror`. Mutację widać
na OBU ekranach. Kontrola krzyżowa autentyczności dowodów: 3954+164 = **4118** =
złoto w `po-panel-miasta-pelny`; 1617+105 = **1722** = złoto w `po-hud-mapy-pelny`.
Zacommitowane PNG pochodzą dokładnie z tego kodu.

**Trzy własne mutacje statyczne** (cofnięte kopią, drzewo czyste):
* `hud.ts` — reguła łamana na dwie linie `.civ-hud .civ-hud-chip-val.fc-probe` /
  `{color:#e0b24a;}` → nowa bramka `FAIL: A6 hud.ts:608`, exit 1. **Bramka
  z commita `757b8590` daje na tym samym obejściu 33/33, exit 0** — poprawka A6
  jest realna i nietautologiczna (zarzut 6, część strukturalna).
* paleta `religia` → `#d9a441` → `FAIL: A2b religia`, exit 1.
* `hud.ts` `resourceTextClass('kultura')` → literał klasy → `FAIL: A4b kultura`, exit 1.

**Zarzut 3 przeliczony samodzielnie na `094be1db`, bez liczb obrony.** Tożsamość
Skarbca: **złoto 7** — `res-treasury.svg` (sam asset marki) `#e8d88a`,
`hud.ts:607` chip HUD `--civ-gold-primary`, `cityPanel.ts:4555`, `:4588`
(`makeSlider('procentPieniadz','Skarb','gold')`), `:10013`, `:11157`, `psi-val gold`
wiersza „Skarbiec"; **błękit 3** — `:1845`, `:10686`, `:11153`, wszystkie na chipie
„Pieniądz". Evaluator pominął cztery z siedmiu. Zwycięstwo złota jest jednoznaczne,
zgodne z ekranem odniesienia właściciela (HUD mapy) i z kolorem samej ikony marki —
to nie jest decyzja kolorystyczna do ECHO. Zmiana „Pieniądz" `#5a9bd4 → #e8d88a`
jest jawnie wpisana w tabelę przed/po raportu rundy 1 (wiersz 47).

**Zarzut 6, zakres:** `.praca-split-summary` niesie ikonę `chip-crate` i procent
„Puli ulepszeń imperium"; ikona `res-work` w tej linii stoi w `<span class="muted">`.
Ten sam `#8ec5ff` niesie `.praca-split-col.right` i gradient `.praca-split-u`.
To akcent widżetu Ulepszeń, nie kolor Pracy — odrzucenie zakresu trafne (C-025).

**Zarzut 4:** `git grep 7cb4e4 094be1db` = dokładnie 4 trafienia (`cityPanel:2451`,
`hud:607`, `mapToolbarHud:61`, `:73`). `#5a9bd4` stoi w 10 miejscach tożsamości Nauki.

## TESTY (własne przebiegi)

`tsc --noEmit` 0 linii · bramka tematu **34/34** exit 0 · logic 213/213 ·
tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6 ·
`hud-miasto-stock-tempo` 71/0 · `build-panel-ulepszenia-scroll-real-render` 43/0 ·
`sidepanel-blocking-card-cutoff-real-render` **47/0** (niestabilność zgłoszona przez
Operatora nie powtórzyła się). Skan resztkowy: zero linii z markerem surowca
i literałem/starą klasą w trzech objętych plikach.

## NOTA (nie zarzut, nie blokada)

`cityPanel.ts:10040` — szkielet ładowania `Skarb: <span class="gold">${PH()}</span>`
bierze złoto z `--gold` scope'u, nie z palety. Dziś obie wartości są równe `#e8d88a`,
element jest shimmerem bez liczby, a `RES_MARKER` A6 go nie widzi. Zero różnicy dla
gracza i zero wpływu na GOAL; do rozważenia przy następnym temacie tego obszaru.
`empireDetailPanel.ts` / `empireBalance.ts` pozostają poza parą wskazaną przez
właściciela — świadomie, zgłoszone w rundzie 1 (C-025).

## ZMIANY/COMMIT

Wyłącznie ten raport (`dyspozycje/autobot/runs/<ID>/04-final-control-runda1.md`).
Mutacje kontrolne cofnięte kopią pliku; `git status --short` pusty. Bez `git add -A`.

## BLOKADY

Brak.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
