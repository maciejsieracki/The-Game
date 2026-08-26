# 01 — OPERATOR (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`
MODEL+EFFORT: Opus 5, effort high
GOAL: usunąć z panelu trybu budowy zdublowany blok **warstwy (a)** (`CityPodzialPracy.procentBudynki`)
i udostępnić w tym miejscu **warstwę (c)** (`UlepszeniaEmpirePolicy.pracaAutoPercent` /
`City.ulepszeniaPracaPercent`) niezależnie od trybu.

## ZMIANY/COMMIT

Gałąź `autobot/R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`, baza (merge-base) `136e664c`.

| SHA | Zakres |
|---|---|
| `cd95023c` | `gra/src/ui/buildModeHud.ts`, `gra/src/main.ts` — p.1 + p.2 + p.3 |
| `06f2c251` | 4 bramki przypięte do usuniętego bloku warstwy (a) |
| `3f15f0e4` (+ HEAD) | nowa bramka tematu `gra/tools/praca-panel-budowy-warstwa-real-render-test.cjs` |

Allowlista dotrzymana — `git diff --stat 136e664c..HEAD` obejmuje wyłącznie
`gra/src/ui/buildModeHud.ts`, `gra/src/main.ts` (tylko podpięcie kontraktu, 13 linii)
i `gra/tools/*`. `empireDetailPanel.ts` i `cityPanel.ts` **nietknięte** (0 linii diffu) —
to punkt odniesienia dowodu nr 3. `git diff --check` czysty.

**p.1** — usunięte: `renderEmpirePracaSplit()`, jego wstawienie w `update()`, handler
`input[data-praca-empire-split]`, reguły CSS `.civ-build-global-split*`, pozycje kontraktu
`getEmpirePracaSplit`/`onEmpirePracaSplitChange`, podpięcie w `main.ts:19352-19359` oraz
import nazw warstwy (a) (`PODZIAL_PRACY_PULA_LBL*`, `..._TIP`).

**p.2** — suwak **warstwy (c)** wyprowadzony spod `tryb === 'auto'`: renderuje się zawsze,
przy `tryb === 'reczny'` jako `disabled` + wyjaśnienie. To samo dla lokalnego pola warstwy (c).
Etykieta warstwy (c): „Z puli imperium na pracę automatyczną:" (globalnie) i „Z puli imperium
na automat tego miasta:" — mówi wprost, czym jest, bez czytania kodu.

**p.3** — nazwy `getEmpirePracaSplit`/`onEmpirePracaSplitChange` (mówiły o nieistniejącej
warstwie (b), sterowały warstwą (a)) **znikają** razem z blokiem. Sprawdzone, gdzie nazwa
jeszcze żyje: wyłącznie komentarze-nagrobki w `cities.ts:237` i `empireDetailPanel.ts:1307`
opisujące usunięty typ — poza allowlistą, zostawione świadomie, nie są żywym API.

**Znalezisko uboczne** — niespójny tekst podsumowania (`${pct}% ulepszenia / ${100-pct}% budynki`
vs render „…% Ulepszenia (pula) / …% Budynki") zniknął razem z blokiem warstwy (a). Sprawdzone
**pomiarem**, że wzorzec nie powtarza się w pozostających suwakach warstwy (c).

## TESTY

**Kryteria sukcesu 1–5 — wszystkie spełnione.**

1. Blok **warstwy (a)** nieobecny w panelu trybu budowy — żywy render Chromium, 0 elementów
   `[data-praca-empire-split] / .civ-build-global-split / [data-praca-split-scope]` w obu trybach.
2. Suwak **warstwy (c)** widoczny i `disabled` przy `tryb:'reczny'`, aktywny przy `tryb:'auto'` —
   **dwa zrzuty z żywego Chromium** (`A-tryb-reczny.png`, `B-tryb-auto.png`, katalog
   `$TMPDIR/civ-shots-praca-panel-budowy-warstwa`). Zrzut z trybu ręcznego pokazuje suwak
   „Z puli imperium na pracę automatyczną: 33%" wyszarzony, z notką „Tryb ręczny — cała pula
   zostaje na pracę ręczną…". Realny drag przy `auto` zapisuje 64 przez callback warstwy (c).
3. **Warstwa (a) nadal działa** — pomiar zachowania, nie regex: panel imperium drag→`procentBudynki`
   70→60, MAX→50 (cap 0–50% puli); panel miasta drag→`procentBudynki` 70→90, zakres 50–100%.
4. **Dowód liczbowy warstwy (c)**, prawdziwy `pickAutoImprovements`, pula **5 000**:
   `pracaAutoPercent` **10% → 12 ulepszeń (480 P)**, **50% → 62 ulepszenia (2 480 P)**.
   Kontrola: 50% dwa razy = ta sama liczba (różnica to skutek %, nie szum).
5. Bramki — patrz tabela niżej.

**Nietautologiczność: 5 mutacji źródła, każda w pamięci (`onLoad` esbuilda), żaden plik repo
nie modyfikowany. Każda mutacja zapala swoją asercję:** M1 — cofnięcie warstwy (c) pod
`tryb === 'auto'` (gasi „suwak w ręcznym"); M2 — usunięcie `disabled` (gasi „nieaktywny");
M3 — ponowne wstawienie bloku warstwy (a) (gasi „zero markupu (a)"); M4 — wycięcie zapisu
warstwy (a) w panelu imperium (gasi dowód nr 3); M5 — odpięcie pułapu automatu od
`pracaAutoPercent` (gasi dowód nr 4: 10% i 50% zrównują się).

| Bramka | Wynik | Referencja |
|---|---|---|
| `tsc --noEmit` | 0 błędów | 0 |
| logic / tech-tree / research / unit-replace / combat | 213/213 · 19/0 · 33/33 · 13/13 · 6/6 | zgodne |
| `praca-jeden-podzial-kontrakt-test` | **637 OK, 0 FAIL** | 634 → +3 (aktualizacja) |
| `praca-jeden-podzial-real-render-test` | **37/0** | 36 → +1 (aktualizacja) |
| `ai-jednostki-tylko-zakup-test` | 44/0 | zgodne |
| `build-panel-ulepszenia-scroll-real-render-test` | **43/0** | zgodne (przecelowana 1 asercja) |
| `dyplo-pakt-ekspansja-granica-test` | 26/26 | zgodne |
| `praca-cap-migracja-luka-test` | 11/0 | zgodne |
| `zelazo-zrzuty-25-jednostek-render` (bez `--no-shots`) | 61/0 | zgodne |
| `praca-budmode-slider-max-real-render-test` | **13/0** | 11 → +2 (aktualizacja) |
| `praca-split-ui-test` | 25/0 | **nie dotyczy** — czyta tylko `empireDetailPanel/cityPanel/cities`, nie `buildModeHud` (recon wskazywał ją błędnie) |
| **NOWA** `praca-panel-budowy-warstwa-real-render-test` | **28 pass, 0 fail** | — |
| `vite build` (forma dozwolona C-001, `--outDir /tmp/civ-dist-operator`) | OK, 26 s | — |

**Aktualizacje asercji — każda z uzasadnieniem w kodzie bramki** (co pilnowała / dlaczego stary
warunek przestał być prawdą / co pilnuje teraz). Żadna nie została wyłączona ani rozluźniona:
w kontrakcie 4 asercje o nazwie usuniętego bloku warstwy (a) zastąpione 4 asercjami „warstwa (a)
NIE wróci do tego panelu" + 4 kontrolami negatywnymi na syntetycznym mutancie; w
`praca-budmode-slider-max` scenariusz (C) przepięty z nieistniejącej funkcji na cap warstwy (a)
u źródła w `cities.ts` + panel imperium; w `scroll` hit-test przecelowany z suwaka warstwy (a)
na suwak warstwy (c) (ta sama własność, inny nośnik).

**Złapany fałszywy zielony (§13a):** asercja `praca-jeden-podzial-real-render-test:156` po
mojej zmianie **nadal przechodziła**, ale wyłącznie dlatego, że regex `PODZIAL_PRACY_PULA_LBL`
trafiał w **mój komentarz** wyjaśniający usunięcie, a nie w żywy import. Zgłaszam to jawnie:
asercja została rozdzielona na dwie, obie liczone na źródle ze zdjętymi komentarzami.

## BLOKADY

Brak.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high). Uwaga dla Evaluatora: `origin/main` przesunął się w trakcie
pracy na `8b6a64d0` (dispatch innego tematu) — diff czytać od `git merge-base`, nie naiwnie
od `origin/main` (§9 poz. 9).

DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi tematu, `main` nietknięty).
