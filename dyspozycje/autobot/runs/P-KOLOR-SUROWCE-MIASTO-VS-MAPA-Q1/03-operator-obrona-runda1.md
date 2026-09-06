# P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 — Operator, OBRONA rundy 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1`
GOAL: Jeden surowiec = jeden kolor, wzięty z jednego źródła prawdy.
ROLA/MODEL+EFFORT: Operator (obrona) — Opus 5, effort high.
GUARD §2b: HEAD `757b8590` (raport Evaluatora nad `c3cde217`), drzewo czyste. Prompt
podawał `c3cde217`; `git log` pokazuje ten SHA jako RODZICA HEAD-a i treść zgodną z opisem
(„Evaluator dopisał własny raport") — to ta sama baza, nie rozbieżność.

## 1–2, 8 — PRZYJĘTE. Zrzuty przeliczone od zera, procedura zacommitowana

Nowy, wersjonowany `zrzut-dowodow.cjs` (w katalogu runu). Robi dwa NIEZALEŻNE wczytania
(`?playtest=miasto`, `?playtest=mapa`) zamiast `Escape`, czeka na zniknięcie
`.civ-map-load-overlay` (`z-index:3000000`) i **po każdym zapisie liczy piksele
w zapisanym PNG** — pusty albo nieaktualny zrzut kończy się `exit 1`.

Dwie realne przyczyny defektów rundy 1, obie zmierzone:
* `Escape` w sandboxie miasta nie wraca do mapy — stąd `po-hud-mapy-*` bez HUD-u;
* mutowana była **Praca**, której chip w tej scenie **zasłania panel produkcji**
  (`getComputedStyle` = magenta, ekran = brak) — stąd zrzuty mutacji bajtowo identyczne
  z PO. Odtworzyłem to niezależnie: nowy przebieg z mutacją Pracy dał te same md5
  (`c34a3711…`, `63a3a8c0…`), więc pliki rundy 1 nie były kopią, tylko dowodem, że
  render nie reaguje. Mutacja idzie teraz na **Żywność** (chip nie zasłonięty).

Wszystkie 18 zrzutów przeliczone jedną komendą na jednej scenie (PRZED z buildu bazy
`094be1db`, PO i MUTACJA z gałęzi). Piksele dokładnego trafienia hex:

| zrzut | #e8d88a | #5a9bd4 | #7cb4e4 | #e8b84a | #ff3fb0 |
|---|---|---|---|---|---|
| `przed-hud-mapy-lewy` | 221 | 0 | **75** | 0 | 0 |
| `po-hud-mapy-lewy` | 221 | **75** | 0 | 0 | 0 |
| `mutacja-hud-mapy-lewy` | 195 | 75 | 0 | 0 | **26** |
| `przed-panel-miasta-chipy-lewe` | 296 | 0 | 0 | **125** | 0 |
| `po-panel-miasta-chipy-lewe` | **421** | 0 | 0 | 0 | 0 |
| `mutacja-panel-miasta-chipy-lewe` | 378 | 0 | 0 | 0 | **43** |

Bilans domyka się co do piksela: 296+125 = 421; 421−43 = 378; 221−26 = 195.

## 3 — ODRZUCONY. Skarbiec: złoto wygrywa 5:3, nie remis

Zliczenie na bazie `094be1db`, miejsca nadania koloru tożsamości Skarbca:

* **złoto (5):** `cityPanel.ts:2442` ikona chipa W3, `:2450` wartość chipa W3 (Skarbiec
  ma `cls` puste → domyślne złoto), `:2461` zapas chipa W3, `:4555` `'gold'`, `:11157`
  `'gold'`; do tego chip „Skarbiec" HUD-u mapy (`hud.ts:606`, `--civ-gold-primary`).
* **błękit (3):** `cityPanel.ts:1845`, `:10686`, `:11153` — wszystkie trzy to `'blue'`
  na chipie **„Pieniądz"** (przepływ na turę), nigdy na pasku W3.

Evaluator policzył wyłącznie trzy `'blue'` vs dwa `'gold'` z literałów `cls`, pomijając
sam pasek W3 — czyli największy element Skarbca w panelu miasta. Kryterium binarne jest
spełnione i rozstrzygnięcie nie jest remisem; ECHO właściciela nie jest potrzebne.

## 4 — PRZYJĘTY. `#7cb4e4` ma 4 miejsca, nie 3

`cityPanel.ts:2451`, `hud.ts:607`, `mapToolbarHud.ts:61`, `mapToolbarHud.ts:73`.
Konkluzja bez zmian: `#5a9bd4` stoi w 10 miejscach tożsamości Nauki (pięć assetów marki,
`scienceProgressRing.ts`, `scienceOwlIcon.ts`, `scienceHubHud.ts`, `--blue` w `.civ-cs`,
`tokens.css`) wobec 4. Poprawiona liczba wpisana do docstringu `resourceColors.ts`.

## 5 — PRZYJĘTY. `mapToolbarHud.ts` dopisany do tabel

| Surowiec | plik:linia (baza) | przed | po |
|---|---|---|---|
| Nauka | `mapToolbarHud.ts:61` przycisk Nauki paska narzędzi mapy | `#7cb4e4` | `var(--civ-res-nauka)` = `#5a9bd4` |
| Nauka | `mapToolbarHud.ts:73` ikona sowy w tym przycisku | `#7cb4e4` | `var(--civ-res-nauka)` = `#5a9bd4` |

Plik był od początku na liście `COVERED` bramki — brak był wyłącznie w tabelach raportu.

## 6 — ODRZUCONY co do zakresu, PRZYJĘTY co do dziury w bramce

`.civ-cs .praca-split-summary{color:#8ec5ff}` koloruje **wiersz „Pula ulepszeń
imperium %"**, nie wartość Pracy: ten sam `#8ec5ff` niesie obramowanie kolumny
„Ulepszenia" w tym samym widżecie (`.praca-split-col.right`, `rgba(142,197,255,0.35)`),
a liczba w linii to procent podziału, nie zasób. To akcent widżetu; przemalowanie go
na złoto jest zmianą kolorystyki poza parą wskazaną przez właściciela (C-025).

Strukturalna połowa zarzutu jest jednak trafna: A6 skanowało **po liniach**, więc reguła
łamana na dwie linie (selektor w jednej, `color:` w drugiej — w tym pliku norma) mogła
przejść. A6 skanuje teraz także **całe deklaracje CSS** sklejone w jeden ciąg, przy czym
bloki JS (nawiasy, `=>`, backtick) są odfiltrowane, żeby bramka nie czerwieniała na kodzie.
Dowód nietautologiczności: wstrzyknięta reguła `.civ-v-w3-chip-val.probe-obejscie{…\n
color:#e8b84a;}` → `FAIL: A6 … cityPanel.ts:2220`, `exit 1`; po cofnięciu kopią `exit 0`.
Przy okazji `stripComments` zachowuje teraz łamania linii — numery linii w raporcie A6
były przesunięte o ~250 wierszy.

## 7 — PRZYJĘTY. Docstring zgodny ze stanem kodu

`resourceColors.ts` mówi teraz wprost, że medaliony (`.civ-hud-chip-med`,
`.civ-v-w3-sci-med`) są POZA modułem, bo są **gradientem dwóch odcieni**, a nie jednym
kolorem tożsamości — i że stoją na whiteliście A6. Opis modułu i bramka mówią to samo.

## ZNALEZISKO WŁASNE (poza listą zarzutów) — ikona chipa W3 nie czytała palety

Mutacja Żywności pokazała, że `.civ-cs .civ-cs-chip-ic{color:var(--gold)}` (0,2,0) **bije**
`.civ-v-w3-chip-icon{color:var(--civ-res-self)}` (0,1,0): ikona surowca w panelu miasta
malowała się `--gold` scope'u, a nie paletą. Obie wartości są dziś równe `#e8d88a`, więc
na ekranie nie było różnicy — kryterium 2 („wszystkie miejsca czytają z palety") było
spełnione tylko pozornie. Dodane: reguła (0,3,0)
`.civ-v-w3-chip .civ-v-w3-chip-icon .civ-cs-chip-ic{color:var(--civ-res-self)}`
oraz asercja **A5f** w bramce. Zrzuty PO przed i po tej poprawce są identyczne co do
piksela (`#e8d88a` 421/317/1722) — **żaden kolor widziany przez gracza się nie zmienił**.

## ZMIANY/COMMIT

`gra/src/ui/cityPanel.ts` (reguła ikony + komentarz), `gra/src/ui/resourceColors.ts`
(docstring), `gra/tools/kolor-surowce-spojnosc-test.cjs` (A5f, A6 na deklaracjach,
`stripComments`), `dyspozycje/autobot/runs/<ID>/zrzut-dowodow.cjs` (NOWY),
`dyspozycje/autobot/runs/<ID>/dowody/*.png` (18 zrzutów przeliczonych),
ten raport. Commit po jawnych ścieżkach, bez `git add -A`.

## TESTY

* `tsc --noEmit` — 0 linii wyjścia. (Pierwsza wersja komentarza CSS miała backticki
  wewnątrz literału szablonowego i wywracała parser — złapane przez `tsc`, poprawione.)
* Bramka tematu **34/34**, `exit 0`. Mutacja `zywnosc → #ff3fb0`: `FAIL: A2b zywnosc`,
  `exit 1`, `33/34`; cofnięte KOPIĄ pliku.
* Pięć referencyjnych: logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6.
* Bramki wrażliwe na CSS panelu miasta: `hud-miasto-stock-tempo-test` 71/0,
  `build-panel-ulepszenia-scroll-real-render-test` 43/0,
  `sidepanel-blocking-card-cutoff-real-render-test` 47/0 (jeden przebieg dał 44/3,
  powtórzony trzykrotnie — 47/0; wynik na HEAD bez mojej zmiany też 47/0, więc to
  niestabilność tej bramki, nie regresja — zgłaszam jawnie).
* Mutacja widoczna na OBU ekranach: panel miasta 43 px, HUD mapy 26 px `#ff3fb0`.

## BLOKADY

Brak. Allowlista nie wyszła poza `gra/src/ui/`, `gra/tools/` i katalog runu.

RUNDY: 1/5 (obrona = II faza tej samej rundy)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
