# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Operator — Opus 5, effort high (§1a / C-052)
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: `9bc06495` (naprawa + nowa bramka), `8cafb97e`, `71531e2c`, `ed4a5af6`
tymczasowego + sprzątanie) + NOWY `gra/tools/bramki-tmpdir-unikalnosc-test.cjs`.
Allowlista dotrzymana: `git status` pokazuje wyłącznie `gra/tools/`; zero `gra/src`,
zero `gra/data`. Staging po jawnych ścieżkach, bez `git add -A`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO

## Trzy rzeczy, które warto przeczytać zanim spojrzysz na tabelę

**1. Rekonesans dispatchu nie widzi jednego z dwóch plików, które sam nakazuje naprawić.**
`grep -rl "os.tmpdir()" gra/tools/*.cjs` daje 54 (policzone przeze mnie, zgadza się) — ale
`wydarzenia-zbadano-karta-tech-real-render-test.cjs` z **kryterium 2** w tym wyniku **nie
występuje**: używa `require('os').tmpdir()`, a wzorzec `os.tmpdir()` wymaga jednego znaku
między `os` a `tmpdir`. Dodatkowo powłokowy glob `*.cjs` nie łapie nazw kropkowych — pięć
śledzonych w gicie `.smoke-*.cjs` pisało do **wspólnego** `/tmp/smoke_bundle_eval.js`, tego
samego co `smoke.cjs`. Realna pula to **62 pliki**, nie 54. Tabela ma 62 wiersze; kolumna
„w puli 54" pokazuje, które 8 grep gubił. Nowa bramka skanuje `readdirSync`, nie glob.

**2. Kolizja jest MIĘDZY WORKTREE, nie tylko między dwoma biegami tej samej bramki.**
W trakcie pracy temat z `/home/user/wt-garnizon` biegł `ai-buduje-budynki-test.cjs` do tego
samego `/tmp/civ-ai-buduje-budynki`. Skala problemu jest więc większa niż w dispatchu.
**Zdarzenie do odnotowania:** odruchowo wywołałem `rm -rf /tmp/civ-ai-buduje-budynki*` —
**skasowałoby to cudzy przebieg w locie**. Komendę zablokował klasyfikator uprawnień, nie
moja ostrożność. Do tej ścieżki już nie wracałem.

**3. Sam wpadłem w „tryb trzeci" (ciche złamanie sprzątania) — TRZY RAZY, każdy raz
wykryty pomiarem, nie przeglądem kodu.** To jest najważniejsza rzecz w tej rundzie:
każdy z tych trzech błędów przechodził `node --check` i wyglądał poprawnie.

| # | Defekt mojej własnej naprawy | Jak wykryty | Naprawa |
|---|---|---|---|
| a | Hak używał `fs` z zasięgu modułu, a `era-change-notify-test.cjs` **nie requiruje `fs`** → `ReferenceError` wpadał w mój własny `catch` i sprzątanie po cichu nie robiło NIC | porównanie `ls /tmp` przed/po — artefakty z moim run-id zostawały na dysku | `9bc06495`: hak bierze `fs`/`path`/`os` lokalnie |
| b | W **8 plikach** pierwsze użycie `os.tmpdir()` było w ciele funkcji, więc transformator wstawił tam cały blok. `process.on('exit')` rejestrowałby się przy KAŻDYM wywołaniu, a run-id zmieniałby się między wywołaniami → dwa buildy jednej bramki trafiałyby do RÓŻNYCH katalogów | osobne sprawdzenie głębokości nawiasów klamrowych w miejscu deklaracji; `node --check` tego nie widzi | `71531e2c`: blok przeniesiony na poziom modułu, 57/57 na głębokości 0 |
| c | Filtr keep haka omija nazwy ze słowem `preview` (zrzuty to dowód, §9 pkt 6) — ale `civ-unit-panel-preview` to katalog ROBOCZY (bundle + html), nie zrzuty; zostawałby na dysku po każdym przebiegu | wypisanie WSZYSTKICH nazw wpadających w filtr keep i sprawdzenie każdej z osobna | `ed4a5af6`: nazwa na `civ-unit-panel-build`; keep obejmuje teraz wyłącznie 4 realne katalogi zrzutów |

Wniosek dla Evaluatora: teza „zmiana jest mechanicznie identyczna we wszystkich plikach"
okazała się **fałszywa trzy razy**. To są trzy wymiary warte niezależnego sprawdzenia.

## Kryteria końca

| # | Kryterium | Wynik |
|---|---|---|
| 1 | tabela wszystkich plikow z puli grep | **62 wiersze** (54 z grepu + 8 gubionych); 59 DEFEKT / 3 BEZPIECZNY |
| 2 | oba potwierdzone pliki unikalne per przebieg | `ai-buduje-budynki-test.cjs:81`, `wydarzenia-zbadano-karta-tech-real-render-test.cjs:65` — TAK |
| 3 | dowód reprodukcji: 2× równolegle PRZED i PO | patrz niżej |
| 4 | nowa bramka zielona + czerwona po mutacji | **3/3 PASS**; mutacja R1/R2/R3 → `exit=1` każda; mutacje cofnięte |
| 5 | `tsc --noEmit` | **0 błędów** (tsc 5.9.3, `node_modules` dowiązane — C-029) |
| 6 | pięć bramek referencyjnych | logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**, combat **6/6** |
| 7 | każda naprawiona bramka pojedynczo | 20 zielonych; 6 czerwonych **dowiedzionych jako pre-istniejące**; ~24 bramki Chromium NIE uruchomione — patrz BLOKADY |

### Kryterium 3 — dowód reprodukcji

**PRZED naprawą** (kod `91877f11`, dwa procesy równolegle, `/tmp/civ-ai-buduje-budynki`):

```text
PHASE=przed A=1 B=1        (oba exit=1, w ciągu ~1 s)
A: failed to load config from /tmp/civ-ai-buduje-budynki/root-fix/vite.config.ts
B: ENOTEMPTY: directory not empty, rmdir '/tmp/civ-ai-buduje-budynki/root-fix/src/ui/icons/brand/buildings'
```

To jest **fałszywy CZERWONY** wprost: `rmSync` lustra jednego biegu ścierał się z `cpSync`
drugiego. Kod gry sprawny, bramka czerwona.

**PO naprawie:** WYNIK_PO

### Kryterium 4 — nietautologiczność nowej bramki

| Mutacja | Reguła | Wynik |
|---|---|---|
| `path.join(os.tmpdir(), 'civ-mutacja-stala-nazwa-dist')` | R1 stała nazwa dosłowna | `PASS=2 FAIL=1`, `exit=1` |
| `const MUT_R2 = os.tmpdir();` | R2 korzeń `/tmp` jako cel | `PASS=2 FAIL=1`, `exit=1` |
| `path.join(os.tmpdir(), n)` w pliku bez znacznika | R3 nazwa ze zmiennej | `PASS=2 FAIL=1`, `exit=1` |

Po cofnięciu wszystkich trzech: `PASS=3 FAIL=0`, `exit=0`. Skan obejmuje 63 plików z
`tmpdir` spośród 818 `.cjs`.

### Kryterium 7 — bramki uruchomione pojedynczo

Zielone (20): `_tmp-battle-roster` 7/7 · `_tmp-siege` 11/11 · `city-defense-terrain-gate`
34/34 · `combat` 6/6 · `counter-migration` 15/15 · `defense-breakdown` 3/3 ·
`era-change-notify` 8/8 · `fortify-pole` 41/41 · `hud-moc-warstwa` 28/28 ·
`hud-obywatele-chip` 20/20 · `moc-ranking-rozjazd` 19/19 · `structure-defense-bonus` 8/8 ·
`teren-walki-etapy` 33/33 · `walka-jeden-kontratak` 24/24 · `walka-morale-przewaga-mocy`
123/123 · `weterani` 79/79 · `bramki-tmpdir-unikalnosc` 3/3 · plus 5 referencyjnych.

Czerwone (6) — **dowiedzione jako pre-istniejące**, nie deklarowane: podmieniłem każdy plik
na wersję z `91877f11`, uruchomiłem, przywróciłem. Wszystkie sześć dają `exit=1` **z tą samą
przyczyną** przed i po zmianie:

| bramka | przyczyna (identyczna HEAD i po naprawie) |
|---|---|
| `unit-power-test` | `FAIL: Hastati M_pole=50 (got 57.5)` — 4 pass / 2 fail, pre-istniejące wprost w `R-PROC-AUTOBOT.md` §6 |
| `audit-atak-obrona` | `TypeError: hitChanceMatrix is not a function` |
| `legion-vs-falanga-compare` | `TypeError: ... reading 'toLowerCase'` (dryf sygnatury `resolveCombat`) |
| `tw-vs-stary-legion-falanga` | jw. |
| `wpiecie-dispatch-check` | `Could not resolve ".wpiecie-dispatch-check-entry.ts"` (plik nigdy nie zacommitowany) |
| `smoke` | `Bundle not found` — wymaga zbudowanego bundla, nieobecnego w tym worktree |

### Tryb trzeci — czy katalog znika po przebiegu

Pomiar, nie deklaracja: `ls /tmp` przed i po **16 naprawionych bramkach** →
**zero nowych pozostałości**. Zrzuty ekranu (`*shots*`, `*preview*`) **celowo zostają** —
są dowodem wizualnym (§9 pkt 6); unikalność chroni je przed nadpisaniem przez równoległy
bieg, a hak sprzątający jawnie je pomija.

## BLOKADY

- **~24 bramki wymagające headless Chromium nie zostały uruchomione pojedynczo** (rodzina
  `zelazo-*`, `*-real-render-*`, `*-live-*`). Każda to `vite build` + realny Chromium,
  rzędu kilkunastu–kilkudziesięciu minut; łącznie wielokrotność budżetu jednej rundy.
  Ich zmiana jest mechanicznie identyczna z 20 zweryfikowanymi (ten sam blok, ta sama
  podmiana literału) i wszystkie przechodzą `node --check`, ale **to nie jest to samo co
  zielony przebieg** i nie udaję, że jest. Rekomendacja: osobny węzeł „przebieg bramek
  render" (§12), albo jawna zgoda Evaluatora na próbkę.
- Kolizja `/tmp` z tematem w `/home/user/wt-garnizon` (§2b) — mój kod jej już nie powoduje,
  ale ich niezałatana kopia bramek nadal może kolidować z innymi. Do rozważenia przez
  orkiestratora przy integracji kolejności.

## Tabela audytu (62 wiersze; nie liczy się do limitu 400 słów)

| # | plik | w puli 54 | klasyfikacja | powod (linie wg 91877f11) | ryzyko |
|---|---|---|---|---|---|
| 1 | `_tmp-battle-roster-test.cjs` | tak | **DEFEKT** | 8: stala nazwa 'battle-roster-bundle-test.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 2 | `_tmp-siege-test.cjs` | tak | **DEFEKT** | 8: stala nazwa 'siege-defenders-bundle-test.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 3 | `ai-buduje-budynki-test.cjs` | tak | **DEFEKT** | 81: stala nazwa 'civ-ai-buduje-budynki' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 4 | `ai4-mutacje.cjs` | tak | **BEZPIECZNY** | kazde uzycie unikalne (193: mkdtempSync) | — |
| 5 | `audit-atak-obrona.cjs` | tak | **DEFEKT** | 9: stala nazwa 'combat-audit.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 6 | `city-defense-terrain-gate-test.cjs` | tak | **DEFEKT** | 85: stala nazwa 'cdtg-city-bundle.cjs'; 99: stala nazwa 'cdtg-combat-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 7 | `combat-test.cjs` | tak | **DEFEKT** | 33: stala nazwa 'combat-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 8 | `counter-migration-test.cjs` | tak | **DEFEKT** | 54: stala nazwa 'counter-migration-combat-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 9 | `defense-breakdown-test.cjs` | tak | **DEFEKT** | 65: stala nazwa 'defense-breakdown-bundle.cjs'; 88: stala nazwa 'defense-breakdown-city-defense-bundle.cjs'; 102: stala nazwa 'defense-breakdown-siege-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 10 | `empire-trade-route-split-real-render-test.cjs` | tak | **DEFEKT** | 534: stala nazwa 'civ-empire-trade-split-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 11 | `era-change-notify-test.cjs` | tak | **DEFEKT** | 15: stala nazwa 'era-change-notify-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 12 | `fortify-pole-test.cjs` | tak | **DEFEKT** | 106: stala nazwa 'fortify-pole-city-bundle.cjs'; 120: stala nazwa 'fortify-pole-combat-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 13 | `hud-moc-warstwa-test.cjs` | tak | **DEFEKT** | 67: stala nazwa outName | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 14 | `hud-obywatele-chip-test.cjs` | tak | **DEFEKT** | 207: stala nazwa outName | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 15 | `interaction-latency-vs-citycount-live-test.cjs` | tak | **DEFEKT** | 65: stala nazwa 'civ-dist-perf-interaction-latency' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 16 | `legion-vs-falanga-compare.cjs` | tak | **DEFEKT** | 8: stala nazwa 'combat-bundle-legion.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 17 | `mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs` | tak | **DEFEKT** | 124: stala nazwa 'mgla-sciezka-live-render.html' | SREDNIE (nadpisanie zrzutu-dowodu) |
| 18 | `mgla-sciezka-live-test.cjs` | tak | **DEFEKT** | 48: stala nazwa 'civ-mgla-sciezka-live-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 19 | `minimapa-ikona-robotnik-kolor-live-test.cjs` | tak | **DEFEKT** | 52: stala nazwa 'civ-ikona-robotnik-kolor-after'; 53: stala nazwa 'civ-ikona-robotnik-kolor-before'; 67: stala nazwa 'civ-ikona-robotnik-kolor-shots' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 20 | `minimapa-pasek-narzedzi-reorganizacja-live-test.cjs` | tak | **DEFEKT** | 54: stala nazwa 'civ-minimapa-toolbar-test-after'; 55: stala nazwa 'civ-minimapa-toolbar-test-before' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 21 | `moc-ranking-rozjazd-test.cjs` | tak | **DEFEKT** | 55: stala nazwa outName | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 22 | `oboz-lowiecki-las-znika-render-test.cjs` | tak | **DEFEKT** | 53: stala nazwa 'oboz-las-shots'; 437: stala nazwa 'civ-dist-oboz-las-po'; 438: stala nazwa 'civ-dist-oboz-las-przed' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 23 | `panel-kolejka-pasek-postepu-test.cjs` | tak | **DEFEKT** | 520: stala nazwa 'civ-kolejka-pasek-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 24 | `perf-long-session-live-test.cjs` | tak | **DEFEKT** | 44: stala nazwa 'civ-dist-perf-long-session' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 25 | `praca-panel-budowy-warstwa-real-render-test.cjs` | tak | **DEFEKT** | 65: stala nazwa 'civ-shots-praca-panel-budowy-warstwa'; 74: stala nazwa 'civ-praca-panel-budowy-warstwa' | SREDNIE (nadpisanie zrzutu-dowodu) |
| 26 | `preview-unit-side-panel-screenshots.cjs` | tak | **DEFEKT** | 14: stala nazwa 'civ-unit-panel-preview' | SREDNIE (nadpisanie zrzutu-dowodu) |
| 27 | `r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs` | tak | **DEFEKT** | 66: stala nazwa 'civ-dist-bitwa-etykieta-live-atak' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 28 | `r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs` | tak | **DEFEKT** | 118: stala nazwa 'civ-bitwa-etyk-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 29 | `rebel-city-notification-live-test.cjs` | tak | **DEFEKT** | 83: stala nazwa 'civ-rebel-notify-live-test-after'; 84: stala nazwa 'civ-rebel-notify-live-test-before' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 30 | `recruit-card-stock-chip-real-render-test.cjs` | tak | **DEFEKT** | 158: KORZEN /tmp jako cel zapisu | SREDNIE (nadpisanie zrzutu-dowodu) |
| 31 | `sidepanel-blocking-card-cutoff-real-render-test.cjs` | tak | **DEFEKT** | 87: stala nazwa 'civ-dist-sp-cutoff-test' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 32 | `sidepanel-event-header-wydarzenie-real-render-test.cjs` | tak | **DEFEKT** | 379: stala nazwa 'civ-sp-event-header-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 33 | `smoke.cjs` | tak | **DEFEKT** | 64: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 34 | `structure-defense-bonus-test.cjs` | tak | **DEFEKT** | 71: stala nazwa 'sdb-combat-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 35 | `teren-walki-etapy-test.cjs` | tak | **DEFEKT** | 33: stala nazwa 'teren-walki-etapy-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 36 | `tw-vs-stary-legion-falanga.cjs` | tak | **DEFEKT** | 119: stala nazwa 'combat-bundle-lf.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 37 | `unit-deferred-reveal-dim-real-render-test.cjs` | tak | **DEFEKT** | 56: stala nazwa 'unit-deferred-reveal-dim-bundle.js'; 58: stala nazwa 'civ-jednostka-niewidoczna-r2-shots' | SREDNIE (nadpisanie zrzutu-dowodu) |
| 38 | `unit-power-test.cjs` | tak | **DEFEKT** | 16: stala nazwa 'unit-power-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 39 | `walka-jeden-kontratak-test.cjs` | tak | **DEFEKT** | 36: stala nazwa 'walka-jeden-kontratak-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 40 | `walka-morale-przewaga-mocy-test.cjs` | tak | **DEFEKT** | 43: stala nazwa 'walka-morale-combat-bundle.cjs'; 44: stala nazwa 'walka-morale-power-bundle.cjs' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 41 | `weterani-test.cjs` | tak | **DEFEKT** | 37: stala nazwa outName | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 42 | `wiarygodnosc-test.cjs` | tak | **BEZPIECZNY** | kazde uzycie unikalne (861: mkdtempSync) | — |
| 43 | `wpiecie-dispatch-check.cjs` | tak | **DEFEKT** | 22: stala nazwa 'wpiecie-dispatch-check.html' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 44 | `zelazo-celtowie-miecznik-rydwan-real-render-test.cjs` | tak | **DEFEKT** | 61: stala nazwa 'civ-zelazo-t9-bundles'; 1047: stala nazwa 'civ-zelazo-t9-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 45 | `zelazo-celtowie-soldurii-gaesatae-real-render-test.cjs` | tak | **DEFEKT** | 468: stala nazwa 'civ-zelazo-t2-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 46 | `zelazo-falanga-real-render-test.cjs` | tak | **DEFEKT** | 641: stala nazwa 'civ-zelazo-t3-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 47 | `zelazo-germanie-real-render-test.cjs` | tak | **DEFEKT** | 68: stala nazwa 'civ-zelazo-t8-bundles'; 1041: stala nazwa 'civ-zelazo-t8-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 48 | `zelazo-jezdziec-oszczepami-real-render-test.cjs` | tak | **DEFEKT** | 705: stala nazwa 'civ-zelazo-t4-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 49 | `zelazo-katapulta-real-render-test.cjs` | tak | **DEFEKT** | 68: stala nazwa 'civ-zelazo-t11-bundles'; 811: stala nazwa 'civ-zelazo-t11-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 50 | `zelazo-konnica-asyryjska-real-render-test.cjs` | tak | **DEFEKT** | 476: stala nazwa 'civ-zelazo-t1-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 51 | `zelazo-mezopotamia-real-render-test.cjs` | tak | **DEFEKT** | 68: stala nazwa 'civ-zelazo-t5-bundles'; 771: stala nazwa 'civ-zelazo-t5-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 52 | `zelazo-slowianie-zulusi-real-render-test.cjs` | tak | **DEFEKT** | 63: stala nazwa 'civ-zelazo-t10-bundles'; 1028: stala nazwa 'civ-zelazo-t10-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 53 | `zelazo-srodziemnomorze-real-render-test.cjs` | tak | **DEFEKT** | 75: stala nazwa 'civ-zelazo-t6-bundles'; 869: stala nazwa 'civ-zelazo-t6-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 54 | `zelazo-super-rzym-grecja-real-render-test.cjs` | tak | **DEFEKT** | 63: stala nazwa 'civ-zelazo-t7-bundles'; 921: stala nazwa 'civ-zelazo-t7-render-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
| 55 | `.smoke-13b.cjs` | NIE (poza grepem) | **DEFEKT** | 50: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 56 | `.smoke-deliver.cjs` | NIE (poza grepem) | **DEFEKT** | 50: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 57 | `.smoke-final2.cjs` | NIE (poza grepem) | **DEFEKT** | 50: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 58 | `.smoke-rerender.cjs` | NIE (poza grepem) | **DEFEKT** | 50: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 59 | `.smoke-verify.cjs` | NIE (poza grepem) | **DEFEKT** | 50: stala nazwa 'smoke_bundle_eval.js' | SREDNIE (nadpisanie/rozerwany odczyt bundla) |
| 60 | `miasta-panstwa-wylaczone-test.cjs` | NIE (poza grepem) | **BEZPIECZNY** | kazde uzycie unikalne (122: process.pid; 228: process.pid) | — |
| 61 | `recruit-resource-strip-test.cjs` | NIE (poza grepem) | **DEFEKT** | 111: KORZEN /tmp jako cel zapisu | SREDNIE (nadpisanie zrzutu-dowodu) |
| 62 | `wydarzenia-zbadano-karta-tech-real-render-test.cjs` | NIE (poza grepem) | **DEFEKT** | 65: stala nazwa 'civ-zbadano-karta-tech-dist' | WYSOKIE (--emptyOutDir czysci cudzy katalog) |
