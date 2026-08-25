# 03 — FINAL CONTROL

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T4
GOAL: Zbudować nowy, dedykowany model 3D dla „Jeździec z oszczepami" (Żelazo, Słowianie) —
      dziś generyczny model kategorii `konnica` z kopią/lancą, mimo że to lekka,
      dystansowa jednostka oszczepnicza.
ZMIANY/COMMIT: 03ae11972e4de7c1af2cc2aa5c74ab19e7f53cd7, gałąź autobot/ZELAZO-T4-Q1,
      merge-base = origin/main = f21fa8295af3e8bc67f80299b3ff5f794f4ab109
TESTY: własne, niezależne uruchomienia w osobnym worktree, wszystkie zielone (patrz §3)
BLOKADY: brak dla kodu; jeden brakujący wpis rejestrowy do domknięcia przy integracji (§5)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora — allowlist-only, z warunkiem z §5 niżej
DEPLOY/PUSH: NIE WYKONANO (origin/main nadal f21fa829; ja też niczego nie pushowałem)
```

**MODEL WYKONUJĄCY TĘ ROLĘ (Final Control): Sonnet 5** — z własnego system prompt tej sesji
(„You are powered by the model named Sonnet 5"), zgodnie z wymogiem dispatchu i §5a bazowej
reguły (nie wyjątku graficznego — ten dotyczy tylko Operatora/Evaluatora). Effort niepotwierdzalny
z zewnątrz — ten sam, znany gap narzędziowy (C-061), nie nowy problem.

Pracowałem we **własnym, trzecim worktree** `/home/user/wt-fc-ZELAZO-T4` (detached na
`origin/autobot/ZELAZO-T4-Q1`, świeży `npm ci`, własny `node_modules`), bez ufania raportom
Operatora ani Evaluatora na słowo — każda liczba niżej jest z mojego własnego uruchomienia.

---

## 1. Ślad i ID (§16b.1–2)

`00-dispatch.md` istnieje, GOAL w dispatchu identyczny z GOAL w raportach Operatora/Evaluatora
i z GOAL w tym raporcie. Jedno ID we wszystkich trzech rundach ról. Runda 1/5, brak śladu
cichego resetu licznika (§3a) — to pierwszy i jedyny dispatch tego tematu.

## 2. Zakres i allowlista — własny diff od merge-base

`git merge-base origin/main HEAD` = `f21fa829` (potwierdzone `--is-ancestor`). Własny
`git diff --numstat`: **4 pliki, +2114/-0**, identyczne z oboma raportami:
`gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` (nowy, 1256 linii),
`gra/src/render/units.ts` (+19), `gra/tools/zelazo-jezdziec-oszczepami-real-render-test.cjs`
(nowy, 727 linii), `01-operator.md`. `git diff --check`: czysty. Odczytałem diff `units.ts`
osobiście — dokładnie 1 nowy import + 1 nowa, jawnie skomentowana gałąź w `buildNamedUnit()`,
umieszczona PRZED generycznym dopasowaniem konnicy; blok `case 'konnica'` (linie z komentarzy
`96/103/110/1394/1415`) bajtowo nietknięty. Grep na sekrety w obu nowych plikach: 0 trafień.
Zero usunięć (§9 poz. 2 nie dotyczy — nie ma `git add -A` w śladzie, nie sprawdzałem procesu
integracji bo jeszcze nie zaszła).

## 3. Bramki i testy — wszystkie uruchomione osobiście, od zera

- `node ./node_modules/typescript/bin/tsc --noEmit`: **0 błędów**.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-fc-t4-dist --emptyOutDir`:
  **OK w 24,6 s**; `gra/dist` NIE powstało; `git status` po buildzie pusty (C-001 przestrzegane).
- 5 bramek referencyjnych (§6): **logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6** — identyczne z liczbami obu ról.
- Test tematu (`zelazo-jezdziec-oszczepami-real-render-test.cjs`, własny build,
  Playwright/Chromium): **57 pass, 0 fail**, w tym wszystkie asercje D (mutacja dispatchu →
  A1-A5 padają, mesh = generyk) i M (mutacja 5 stałych pozy → H1-H6 wszystkie RED).
- Regresja sąsiadów, własne uruchomienie z pełnym builtem dist: **T1 (asyryjska) 31/31 ·
  T2 (Celtowie) 42/42 · T3 (Falanga) 40/40 · zelazo-gate-test 24/24** — zgodne z liczbami
  Operatora (rozjazd Evaluatora to wyłącznie efekt jego flagi `--skip-vite`, nie regresja).

Zero regresji potwierdzone niezależnie na wszystkich czterech sąsiednich bramkach tematu.

## 4. Dane jednostki i mechanizm błędu — zweryfikowane w źródle, nie z pamięci

Odczytałem `data/units.json` bezpośrednio: `Ilość pocisków: 5`, `Zasięg ataku (hex): 2`,
`Atak dystansowy: 2`, `Pancerz: 3`, `Kultura: Słowianie`, `Nazwa EN: Slavic Javelin Cavalry`
— każda liczba cytowana w obu raportach zgadza się z plikiem. Odczytałem `categoryOf()`
(`src/units/setup.ts`): słowo kluczowe `'jezdz'` w liście `konnicaKw` faktycznie łapie tę
nazwę i kieruje do kategorii `konnica` — mechanizm błędu opisany przez Operatora jest
prawdziwy, nie interpretacją.

## 5. Sekcja historyczna K1–K13 — czytana w całości, nie punktowo

Przeczytałem cały blok K1–K13 w źródle. Weryfikowalne fakty (*Strategikon* XI.4 „short
javelins, two to each man" / tarcze „unwieldy"; *Strategikon* ks. I jako pierwszy europejski
zapis o strzemionach; strzemiona awarskie 2. poł. VI w.; ponad 570 ostróg z Mikulčic; konie
wczesnośredniowieczne z ziem polskich w kategorii małych/średnich) zgadzają się z moją własną
wiedzą i nie znalazłem anachronizmu, którego nie nazwałby sam Operator w K3/K4. Rozdzielenie
warstw (a) VI–VII w. (piechota leśna, brak poświadczonej jazdy) i (b) IX–X w. (konny orszak
książęcy, ta sama rama co `Drużynnik`) jest jawne, uzasadnione i konsekwentnie zastosowane —
w tym K4 wprost nazywa to „świadomym odwróceniem" reguły braku strzemion z `braz-konnica-
opus5.ts` i `zelazo-konnica-asyryjska-opus5.ts`. Sprawdziłem oba te pliki źródłowo: rzeczywiście
dokumentują brak strzemion jako celową decyzję dla swoich ram czasowych — spójność potwierdzona,
nie zadeklarowana. Rozbieżność „2 oszczepy u Maurycjusza vs `Ilość pocisków: 5`" jest zapisana
i rozstrzygnięta na rzecz danych jednostki (K2), poprawnie.

## 6. Wizualnie — własne zrzuty z żywego Chromium

Obejrzałem wszystkie trzy PNG z mojego własnego przebiegu testu
(`/tmp/fc-t4-shots/po-jezdziec-oszczepami.png`, `przed-generyczna-konnica.png`,
`mutacja-geometria.png`). „Po": trzy wyraźnie różne sylwetki (nowy model z bronią
trzymaną nad barkiem w geście rzutu i czapką zamiast hełmu vs lancer asyryjski z hełmem
i kopią skierowaną w przód vs generyczna Konnica Brązu). „Przed": model docelowy zapada się
w kształt identyczny z generycznym fallbackiem (czerwony tors, stożkowy hełm, lanca trzymana
poziomo) — realna zmiana kształtu, nie tylko koloru. „Mutacja geometrii": widocznie zepsuta
poza (broń i ręce w nienaturalnym układzie) — potwierdza nietautologiczność testu wzrokiem,
nie tylko liczbą PASS. To domyka wymóg §9 poz. 6a bezwarunkowo.

## 7. `PASS-WITH-NOTES` Evaluatora wg §3b — sprawdzone punkt po punkcie

Sześć uwag Evaluatora, ocenione osobno pod kątem czy dotykają GOAL/dowodu/zakresu/§9/gotowości:

- **Uwaga 1** (mesh 115→117 w raporcie czatowym) — sprawdziłem `01-operator.md`: **nie niesie
  liczby mesh w ogóle**, więc artefakt plikowy jest czysty; rozjazd jest wyłącznie w raporcie
  czatowym Operatora. Redakcyjne, nie dotyka §3b.
- **Uwaga 3** (K10, sporne pochodzenie konika polskiego od tarpana) — sekcja i tak opiera
  decyzję na dwóch innych, mocniejszych przesłankach; nie zmienia wyboru wizualnego. Redakcyjne.
- **Uwaga 4** (literówka „3 stałe pozy" zamiast 5 w komunikacie testu) — potwierdziłem w
  źródle testu: kosmetyczna, nie wpływa na wynik testu (sam warunek sprawdza
  `GEOM_MUTATIONS.length`, czyli 5, poprawnie).
- **Uwaga 5** (`disposeZelazoJezdziecOszczepamiOpus5Geometries` nieużywana) — sprawdziłem:
  identyczny wzorzec ma cała rodzina Opus 5. Konwencja, nie defekt.
- **Uwaga 6** (weryfikacja modelu/effort) — patrz nagłówek tego raportu; nie blokuje.
- **Uwaga 2** (`manualBattle.ts:750` woła `buildUnitModel(bu.kategoria, bu.ownerColor)` **bez
  nazwy jednostki**, więc scena manualnej bitwy gubi WSZYSTKIE modele rodziny Opus 5, nie
  tylko T4) — **zweryfikowałem samodzielnie i potwierdzam jako realny defekt**: `git blame`
  pokazuje commit `546f6a51` z 2026-08-17, a więc **pre-istniejący, przekrojowy, poza
  allowlistą T4** (poprawnie sklasyfikowany przez Evaluatora, nie do naprawy w tym temacie,
  §14). **Ale**: sprawdziłem `REJESTR-PROSB-I-ZADAN.md` i `PYTANIA-OTWARTE.md` — **wpisu o
  `manualBattle.ts` NIE MA jeszcze nigdzie**. §3b wymaga: „Kończy proces wyłącznie wtedy, gdy
  uwagi są kosmetyczne **i zostały zapisane jako osobny temat w rejestrze**". Ten warunek na
  dziś **nie jest spełniony**. Wzorzec z T1/T2/T3 (np. `P-ZELAZO-T3-FALANGITA-...`,
  `P-ZELAZO-T3-DORY-...`) pokazuje, że taki wpis powstaje w commicie zamykającym integrację na
  `main` (np. `f21fa829`), nie w gałęzi tematu — więc to jest zadanie dla kroku integracji
  orkiestratora, nie powód do FAIL ani do nowej rundy Operatora.

## Werdykt

Praca robi dokładnie to, co zamawiał dispatch, z solidnym, samodzielnie zweryfikowanym
dowodem: zakres czysty (4 pliki, generyk nietknięty), zero regresji na 4 sąsiednich bramkach
tematu + 5 bramkach referencyjnych + `tsc`/`vite build`, sekcja historyczna bez anachronizmu,
dowód nietautologiczności potwierdzony (D)+(M) własnym uruchomieniem i wzrokiem na żywym
renderze. Jedyna rzecz odróżniająca to od czystego `PASS` to formalny warunek §3b: uwaga 2
Evaluatora musi trafić do `REJESTR-PROSB-I-ZADAN.md` jako nowy, osobny temat (wzorem
`P-ZELAZO-T3-*`), inaczej zostaje „wolną uwagą w raporcie, której nikt później nie znajdzie".

**Gotowość do integracji: TAK**, pod jawnym warunkiem: commit integrujący na `main` musi
DODATKOWO zawierać wpis rejestrowy dla `manualBattle.ts:750` (analogicznie do T1-T3 — nowy
wpis w sekcji „NOWE ZGŁOSZENIA GRA … znaleziska T4"), zanim temat zostanie uznany za w pełni
domknięty wg §3b. Uwagi 1/3/4/5 są czysto redakcyjne i nie wymagają osobnego wpisu ani rundy.

**Ścieżki mojej weryfikacji:** worktree `/home/user/wt-fc-ZELAZO-T4` (własny `npm ci`) ·
zrzuty `/tmp/fc-t4-shots/` (`po-jezdziec-oszczepami.png`, `przed-generyczna-konnica.png`,
`mutacja-geometria.png`) · build `/tmp/civ-fc-t4-dist/`.