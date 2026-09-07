# P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1 — Evaluator, runda 1

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-06 · ŚCIEŻKA: A (Workflow)
GUARD IZOLACJI (§2b): baza `ee1f6756`, HEAD `346b12f7` (rodzic = `ee1f6756`), drzewo czyste
przed i po. Praca wyłącznie w `/home/user/wt-dyplo-testy`.

## ZARZUTY

**brak**

Lista jest pusta po realnym sprawdzeniu wszystkich 10 punktów §16a — nie po zadeklarowaniu
braku zastrzeżeń. Dowody niżej.

## PUNKT KONTROLI 1 — czy asercja została osłabiona

Policzone przed/po, per plik. Żadna asercja nie zniknęła i żadna nie utraciła zdolności
czerwienienia.

| Plik | Asercje `ee1f6756` | Asercje HEAD | Skasowane |
|---|---|---|---|
| `diplomacy-audience-close-flush-test.cjs` | 37 (wywołań `ok()` w źródle: 19 + helper) | 45 | 0 |
| `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` | 22 | 23 | 0 |

Jedyne linie `-` z asercją w całym diffie: `ok(allBareCalls === 2,` (zastąpione przez
`ok(bareOffsets.length === 3, …)` + 8 nowych `[A4a]`–`[A4f]`) oraz `(0)`/`(0b)` w bramce 2
(przepisane MOCNIEJ: `=== 1` → `=== 2`, plus nowe `(0c)`).

Dwa realne rozluźnienia, oba uzasadnione per pozycja i zweryfikowane przeze mnie w kodzie:
- `(PRZED-3)` i `(PO-3)`, regex `/Wspólna walka z barbarzyńcami \(3 tury\)/` → bez `\(3 tury\)`.
  Sprawdzone: `gra/src/ui/diplomacyTradeBasket.ts:680` **na bazie `ee1f6756`** nie zawiera już
  `(3 tury)` — sufiks zdjął `R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1`. Asercja nadal sprawdza
  rdzeń etykiety i nadal czerwienieje (mutacja E3 niżej).

Podniesienie progu `[A4]` 2 → 3 to droga (b) z dispatchu, nie „podniesienie bez zrozumienia":
`[A4a]`–`[A4f]` klasyfikują imiennie każde z trzech wywołań i dowodzą osiągalności.
Dowód Operatora zweryfikowany niezależnie: trzy gołe wywołania to `main.ts:5677` (wrapper),
`19495` (`onBack`, kotwica `onBack: () => {` **unikalna w pliku** — 1 wystąpienie),
`21571` (hak `__audienceRelTestDebug.closeAudience`). `grep -rn __audienceRelTestDebug gra/src/`
→ zero wywołań haka (tylko definicja i komentarze); `grep -rln … gra/tools/` → 2 żywe bramki
(`dyplo-mapa-odkrycie-live-test.cjs`, `diplomacy-relacje-ai-ai-audiencja-live-test.cjs`).
Droga (a) była zatem faktycznie zamknięta.

## PUNKT KONTROLI 2 — allowlista

`git diff ee1f6756..HEAD --name-only` → dokładnie 3 pliki, każdy konfrontowany z pozycją:

1. `gra/tools/diplomacy-audience-close-flush-test.cjs` — poz. 1 allowlisty. OK.
2. `gra/tools/dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` — poz. 2. OK.
3. `dyspozycje/autobot/runs/P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1/01-operator-runda1.md` — poz. 5. OK.

`gra/src/main.ts` (poz. 3) i `gra/src/ui/diplomacyAudience.ts` (poz. 4) — **0 zmian**, więc
warunek „wyłącznie jedna linia albo `DECISION_REQUIRED`" nie ma zastosowania. Zero wycieku poza
allowlistę, zero plików zakazanych. Sekretów w diffie brak. Usunięć, których GOAL nie wymagał,
brak (skasowane stałe `HTML_PO`/`READ_PO`/`CLICK_PO` zastąpiono generatorami). §9: brak
naruszenia (żadnego `npm run build/dev`, żadnego `git add -A`, `WERSJE.md` nietknięty).
GOAL w raporcie = GOAL z dispatchu (§16a pkt 9).

## PUNKT KONTROLI 3 — pięć WŁASNYCH mutacji, innych niż Operatora

Każda cofnięta KOPIĄ pliku (`cp` z kopii sprzed mutacji), nigdy `git checkout`.

| # | Mutacja | Wynik | `git diff --quiet` po cofnięciu |
|---|---|---|---|
| E1 | `main.ts:21571`: klucz haka `closeAudience:` → `closeAudienceHook:` (licznik NADAL 3) | bramka 1 **43/2** — `[A4c]`, `[A4f]` | czyste |
| E2 | `main.ts`: usunięty `flushDeferredAutoPreBattle()` z wrappera | bramka 1 **44/1** — `[A1]` | czyste |
| E3 | `diplomacyTradeBasket.ts:680`: etykieta → „Sojusz przeciw barbarzyńcom" | bramka 2 **21/2** — `(PRZED-3)`, `(PO-3)`; `(0)/(0b)/(0c)` PASS, **zero `PRZERWANE`** | czyste |
| E4 | **przesunięcie niewinne** (dokładnie tryb, który zabił starą wersję): dołożona linia `+ '<span class="cdb-spacer">…'` do `body` + reindentacja bloku listenera w `{ … }` | bramka 2 **23/0** — self-check zakotwiczył się bez problemu | czyste |
| E5 | `main.ts`: wrapper wcięty o poziom (`if (true) { … }`, koniec bloku przesunięty) **+ czwarte gołe wywołanie** w `openCityPanelForPlayer` | bramka 1 **42/3** — `[A2]`, `[A4]`, `[A4f]`; region NIE spuchł i nie połknął obcego wywołania | czyste |

E4 jest tu kluczowa: to jedyny test, który odróżnia realną naprawę kotwiczenia od naprawy
działającej „dziś". E5 wyklucza fałszywą zieleń przez zbyt szeroki `region()`.

## TESTY URUCHOMIONE PRZEZE MNIE (nie streszczenie raportu)

- `diplomacy-audience-close-flush-test.cjs` → **45 pass, 0 fail**
- `dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs` → **23 PASS, 0 FAIL**, zero `PRZERWANE`
- `node ./node_modules/typescript/bin/tsc --noEmit` (w `gra/`) → exit 0, zero błędów
- Referencyjne: logic `213/213` · tech-tree `19/0` · research `ALL GREEN` · unit-replace `13/13` · combat `All sanity checks passed`
- **Rodzina dyplomacji: własny przemiat wszystkich 72 plików** `gra/tools/*.cjs` z `diplo|dyplo`
  (lista = ta sama, co u Operatora). Wynik: **69 zielonych, 3 czerwone**, identycznie:
  `diplomacy-negotiation-table-test.cjs` 57/58 · `dyplo-mapa-odkrycie-live-test.cjs` 9/1
  (`(5) Umowa szlaków`, `{"clicked":false,"disabled":true}`) ·
  `dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` 22/26.
  Fałszywy alarm z mojego pierwszego przebiegu (`sidepanel-diplo-dismiss-real-render-test.cjs`,
  exit 124) był moim limitem 420 s, nie regresem — powtórka bez limitu: **35 pass, 0 fail**.
  Deklaracja Operatora o trzech zastanych czerwonych jest ścisła.
- Dowód zastałości: diff dotyka wyłącznie dwóch plików `gra/tools/`; te trzy bramki czytają
  `gra/src/**` w stanie `ee1f6756`.

## OBSERWACJE (nie zarzuty — do rozstrzygnięcia przez Final Control)

1. Mutacja usuwająca sam kod-kotwicę (E6: skasowany blok listenera `.cdb-treaty-mil, .cdb-treaty-barb`)
   kończy bramkę 2 przez `PRZERWANE`, nie czystym czerwonym. Różnica wobec stanu przed naprawą:
   teraz poprzedza je nazwany `FAIL: (0c) … kotwica …`, exit 1, więc przyczyna jest wskazana
   palcem. Kryterium 3 dispatchu jest spełnione przez E3/E5 i mutacje Operatora.
2. Etykiety asercji w `[A4]` przeskakują `[A4d]` (jest `A4a`,`A4b`,`A4c`,`A4e`,`A4f`); dwie różne
   asercje dzielą etykietę `[A4c]`. Kosmetyka, zero wpływu na czerwienienie.
3. Bramki `*-real-render-*` nadpisują zrzuty w `runs/*/dowody/` cudzych tematów, a
   `diplomacy-przemarsz-duplikat-real-render-test.cjs` zostawia nieśledzony
   `P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/render.png`. Przywróciłem stan kopią; to
   właściwość zastana repo, nie tego diffu.

## KONTRAKT

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-DYPLO-DWA-TESTY-CZERWONE-ZASTANE-Q1
GOAL: Obie bramki zielone i mierzące to, co miały mierzyć — nie zielone przez rozluźnienie.
ZMIANY/COMMIT: bez zmian w kodzie/bramkach; ten raport, baza `ee1f6756`, praca Operatora `346b12f7`
TESTY: 45/0 · 23/0 · tsc exit 0 · 213/213 · 19/0 · research OK · 13/13 · combat OK · rodzina 69/72; 5 własnych mutacji, wszystkie czerwienią, wszystkie cofnięte kopią
BLOKADY: 3 zastane czerwone bramki rodziny dyplomacji (potwierdzone niezależnie) — do osobnych tematów
ZARZUTY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (osobne wywołanie Workflow)
DEPLOY/PUSH: NIE WYKONANO
