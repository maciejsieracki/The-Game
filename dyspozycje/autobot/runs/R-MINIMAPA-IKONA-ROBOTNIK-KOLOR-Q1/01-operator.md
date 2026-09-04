# 01 — Raport Operatora

TEMAT: R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1
ROLA: Operator (Opus 5, effort medium)
WORKTREE: /home/user/wt-minimapa-ikona-robotnik
GAŁĄŹ: autobot/R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1 (baza: c09bc259)

---

## Runda 1 — wykonanie

STATUS: PASS
DOMAIN: GAME
GOAL: zamiana emoji `👤`/`⛏` w rzędzie `.civ-hud-util-dock` na inline SVG
dziedziczące `currentColor`, żeby obie ikony były złote (`#e8d88a`) spójnie
z resztą rzędu.

ZMIANY/COMMIT:
- `gra/src/ui/hud.ts` — WYŁĄCZNIE wartości `icon:` dla `workerBtn` (linia 1244)
  i `depositBtn` (linia 1252). Zero zmian w `utilToggleBtnHtml()`,
  `renderUtilDock()` poza samą wartością `icon`, zero zmian w CSS
  `.civ-hud-util-dock .b-util-toggle`, zero zmian w `minimapHud.ts`.
- `gra/tools/minimapa-ikona-robotnik-kolor-live-test.cjs` — nowa bramka tematu
  (żywy Chromium, bundel PRZED z c09bc259 vs bundel PO, pomiar pikseli,
  `getComputedStyle`, toggle overlayów, zrzuty obu stanów).
- Commit: `08a13f1d` „R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1: ikony worker/deposit
  jako inline SVG (currentColor)".

TESTY (runda 1): 56 pass / 0 fail w bramce tematu; `tsc --noEmit` 0 błędów;
bramki referencyjne zielone (liczby w sekcji „Runda 1 — obrona" niżej,
przebiegnięte ponownie po poprawce).

BLOKADY: brak.
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO.

---

## Runda 1 — obrona po raporcie Evaluatora

### Zarzut 1 — SVG kilofa czyta się jako litera „T" (BLOKUJĄCY) → PRZYJMUJĘ

Zarzut potwierdzony własnym renderem w żywym Chromium (fallback
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), wszystkie kandydatury
obok siebie w skali 1:1 (20 px), 3x, 4x, 6x i 8x, na tle i w ramce przycisku
`.b-util-toggle`.

Diagnoza geometryczna Evaluatora jest poprawna i policzalna. Dla wariantu
z rundy 1 (`M3 10.6C6.8 4.8 15.2 3.4 20.8 7.2` + `M12.4 4.4 8 21`) punkt łuku
dla t=0.5 wynosi (11.2, 5.3), a trzonek startuje w (12.4, 4.4) — czyli
0.9 jednostki NAD łukiem i obok jego środka. Trzonek nie przebija głowicy,
tylko z niej wyrasta: powstaje wierzchołek + jedna noga = kursywne „T".

Sprawdziłem też wprost proponowanego przez Evaluatora kandydata B
(`M3.2 9.4C7 4.6 17 4.6 20.8 9.4` + `M12 5.6V21`). B usuwa asymetrię, ale NIE
usuwa defektu u źródła: apeks łuku B leży w (12, 5.8), a trzonek startuje
w (12, 5.6) — 0.2 jednostki nad apeksem, więc trzonek nadal styka się
z wierzchołkiem zamiast go przebijać. W renderze 1:1 B czyta się jako
wersalikowe „T" z lekko wygiętą poprzeczką (zrzut `kandydaci4.png`, panel
„B eval"). Z tego powodu NIE wziąłem B ani D dosłownie — przyjąłem zarzut,
ale dostarczyłem poprawkę mocniejszą, spełniającą warunek techniczny
Evaluatora („zmienia się WYŁĄCZNIE zawartość `d` obu ścieżek").

Poprawka wdrożona — dwa czynniki naraz:
1. **Trzonek realnie przebija głowicę.** Łuk symetryczny
   `M2.6 11.2C6.8 4.8 17.2 4.8 21.4 11.2` ma apeks w (12, 6.4), a trzonek
   `M12 2.4V22` startuje w (12, 2.4) — 4 jednostki NAD apeksem. Widoczny kikut
   nad głowicą to jest ta cecha, która odróżnia narzędzie od litery.
2. **Obrót o −35°.** Postawa pionowa jest sama w sobie literopodobna
   (poprzeczka + noga = „T" niezależnie od symetrii). Kilof w orientacji
   ukośnej — głowica u góry po lewej, trzonek w dół w prawo — to dokładnie ta
   sylwetka, którą właściciel widział dotąd jako emoji `⛏` i rozpoznawał jako
   kilof.

Obrót jest **zapieczony w liczbach `d`** (macierz obrotu policzona ręcznie
wokół (12,12), wynik wyśrodkowany w viewBox), a nie zrobiony przez
`transform` — dzięki temu zmieniają się WYŁĄCZNIE wartości `d` obu ścieżek,
zgodnie z warunkiem Evaluatora, a struktura SVG zostaje bit w bit taka sama.
Tożsamość obu zapisów (wersja z `transform="rotate(-35 12 12)"` vs wersja
z zapieczonymi liczbami) zweryfikowana renderem obok siebie w 160 px —
kształty pokrywają się (`kandydaci4.png`, panele „N transform" i „N* zapieczony
w d").

Stan po poprawce (`hud.ts:1252`, jedyna zmieniona linia):

```
<path d="M4.4 17C4.2 9.4 12.7 3.4 19.8 6.3"/><path d="M7.1 4.4 18.3 20.5"/>
```

Bez zmian: `viewBox="0 0 24 24"`, `width/height="20"`, `stroke="currentColor"`,
`fill="none"`, `stroke-width="1.6"`, `stroke-linecap/linejoin="round"`,
`aria-hidden`, `focusable`. Allowlista nie została poszerzona.

DOWÓD (żywy bundel, nie makieta):
- `/tmp/civ-ikona-robotnik-kolor-shots/po-przycisk-deposit.png` — zrzut
  faktycznego przycisku 42x42 z bundla PO, powiększony 8x: jednoznaczny kilof
  (łuk głowicy + ukośny trzonek przebijający ją), w tej samej orientacji co
  emoji z `main` (`przed-przycisk-deposit.png` obok, w tym samym kadrze).
- `/tmp/civ-ikona-robotnik-kolor-shots/po-dock-stan-poczatkowy-aktywne.png`
  i `po-dock-po-kliku-nieaktywne.png` — cały rząd `.civ-hud-util-dock`
  (worker + kilof + zoom −/100%/+ + fullscreen) w jednym kadrze, oba stany;
  kilof czytelny obok kontrolek zoom, nie myli się z `TRADE_ROUTES_SVG`
  (podwójna strzałka) ani z `TERRITORY_SVG` (heks).
- Renderowane porównania kandydatów (A z rundy 1, B/D Evaluatora, warianty
  pionowe i obrócone, `TERRITORY_SVG`, `TRADE_ROUTES_SVG`, worker, emoji `⛏`)
  w skalach 20/60/80/120/160 px — katalog roboczy obrony:
  `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/ikony/`
  (`kandydaci.png`, `kandydaci2.png`, `kandydaci3.png`, `kandydaci4.png`,
  `zywy-bundel2.png` + skrypty `render*.cjs`, `zoom2.cjs` do powtórzenia
  renderu). Zrzuty są dowodem roboczym poza repo — nie dokładam binariów do
  allowlisty tematu.

### Zarzut 2 — brak `01-operator.md` w katalogu runu (NIEBLOKUJĄCY, proces) → PRZYJMUJĘ

Zarzut prawdziwy: przed tą obroną `dyspozycje/autobot/runs/R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1/`
zawierał wyłącznie `00-dispatch.md`, a `docs/procesy/INDEX-PROCESU.md:49` wymaga
raportu Operatora w `runs/<ID>/01-operator.md`. Naprawione: ten plik JEST tym
raportem, zapisany w worktree i zacommitowany na gałęzi tematu.
`02-evaluator.md` pozostaje po stronie Evaluatora — nie zapisuję cudzego
raportu.

### Zarzut 3 — worktree bez `gra/node_modules` (NIEBLOKUJĄCY, infra/dowód) → PRZYJMUJĘ

Zarzut prawdziwy i istotny: bez `gra/node_modules` w worktree
`node ./node_modules/typescript/bin/tsc --noEmit` kończy się MODULE_NOT_FOUND,
a bramki `node tools/*-test.cjs` (playwright/pngjs) w ogóle nie startują —
czyli wyników z rundy 1 nie dało się odtworzyć na worktree tak, jak go
zostawiłem. To jest dokładnie ostrzeżenie playbook C-029 / R-PROC-AUTOBOT §6.
Symlink odtworzony przez Evaluatora zastałem na miejscu i na nim uruchomiłem
całą rundę obrony:

```
gra/node_modules -> /home/user/The-Game/gra/node_modules
```

Jest ignorowany przez Git (`git status --porcelain` pokazuje wyłącznie
`M gra/src/ui/hud.ts`), więc nie zanieczyszcza diffu. Zostaje na miejscu dla
Final Control.

---

## Wyniki po poprawce (wszystko przebiegnięte na tym worktree)

| Bramka | Komenda | Wynik |
|---|---|---|
| TypeScript | `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów (exit 0) |
| Bramka tematu | `node tools/minimapa-ikona-robotnik-kolor-live-test.cjs` | **56 pass / 0 fail** (exit 0) |
| Logika | `node tools/logic-test.cjs` | 213/213 |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | 19/19 |
| Badania | `node tools/research-test.cjs` | 33/33 |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | 13/13 |
| Walka | `node tools/combat-test.cjs` | 6/6 |

Kluczowe asercje bramki tematu po poprawce:
- `[deposit] stan AKTYWNY: rozwiązany stroke nadal = rgb(232, 216, 138)`
- `PO przycisk deposit: ZERO obcych, zimnych pikseli (ikona w całości złota)`
- `PO przycisk worker: ZERO obcych, zimnych pikseli` (PRZED: `obceChlodne: 226`)
- `[deposit] klik realnie zmienia obraz mapy 3D ponad szum tła`
- `wysokość/szerokość/pozycja rzędu .civ-hud-util-dock bez zmian (±1–2 px)`
- Pomiar pikseli deposit: PRZED `{gold: 1179, obceChlodne: 0}` →
  PO `{gold: 1184, obceChlodne: 0}`.

Uwaga do zarzutu 1 pkt (iii) Evaluatora — zgadzam się: dla przycisku deposit
korzyść **kolorystyczna** była zerowa (emoji kilofa i tak renderowało się
ciepło), więc wartością tej zmiany dla deposit jest wyłącznie usunięcie
defektu strukturalnego (emoji ignoruje CSS `color`, więc na innej maszynie
/ innym kroju emoji ten sam przycisk mógłby wyjść zimny tak jak worker).
Warunkiem koniecznym jest jednak, żeby glif pozostał czytelnym kilofem —
i to jest przedmiotem tej poprawki.

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-MINIMAPA-IKONA-ROBOTNIK-KOLOR-Q1
GOAL: worker + deposit w `.civ-hud-util-dock` jako inline SVG dziedziczące
`currentColor` (`#e8d88a`), spójne z resztą rzędu, czytelne jako postać i kilof.
ZMIANY/COMMIT: `gra/src/ui/hud.ts` (wyłącznie wartości `icon:`),
`gra/tools/minimapa-ikona-robotnik-kolor-live-test.cjs` (nowa bramka tematu),
`dyspozycje/autobot/runs/<ID>/01-operator.md` (raport, INDEX-PROCESU §3).
Commity: `08a13f1d` + commit obrony rundy 1.
TESTY: tsc 0 błędów; bramka tematu 56/56; logic 213/213; tech-tree 19/19;
research 33/33; unit-replace 13/13; combat 6/6.
BLOKADY: brak.
RUNDY: 1/5 (runda 1 + obrona po zarzutach Evaluatora).
NASTĘPNY KROK: Evaluator (weryfikacja poprawki, `02-evaluator.md`) → Final Control.
DEPLOY/PUSH: NIE WYKONANO.
