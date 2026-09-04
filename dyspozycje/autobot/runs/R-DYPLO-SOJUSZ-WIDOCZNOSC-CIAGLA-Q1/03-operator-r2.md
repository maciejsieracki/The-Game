# 03 — OPERATOR (runda 2)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1`
GOAL: Rozszerzenie rundy 1 na drugi kierunek (ECHO właściciela, ta sesja: „Tak, zrob to tez
dla AI (obustronnie)"): dla aktywnego SOJUSZU gracz↔AI, sojusznik AI dostaje na bieżąco (co
turę, nie jednorazowo) unię z widocznością GRACZA — analogicznie i symetrycznie do już
zaimplementowanej (runda 1) strony gracza. Mechanizm aktywuje się przy zawarciu sojuszu,
dezaktywuje natychmiast po zerwaniu. Zero zmian w `ai.ts` Priorytet 4 (logika decyzyjna) —
wyłącznie źródło danych o widoczności się zmienia.
MODEL+EFFORT: Sonnet 5, effort high (Operator).
RUNDY: 2/5 · DEPLOY/PUSH: **NIE WYKONANO**

---

## 0. Streszczenie

Runda 1 zaimplementowała wyłącznie stronę gracza i pozostawiła stronę AI jako
`DECISION_REQUIRED` (Obrona rundy 1: zawężenie zakresu bez pytania właściciela było błędem
proceduralnym). Właściciel odpowiedział wprost: **„Tak, zrob to tez dla AI (obustronnie)"** —
wybierając opcję z jawnie opisanym ryzykiem („AI-sojusznik tez dostaje wglad w Twoj teren, z
wplywem na jego cele/decyzje — potrzebna dodatkowa, staranna weryfikacja"). Ta runda
implementuje dokładnie to, nic więcej.

Zmiana: `currentVisibleForOwner(ownerId)` (main.ts) — funkcja, która JUŻ ISTNIAŁA i JUŻ była
jedynym źródłem widoczności zasilającym decyzje AI (`aiVisibleHexes`/
`rememberVisibleAiTargets` przy dispatchu tury AI, `aiCityCaptureAllowed` przy przejęciu
miasta) — teraz, gdy `ownerId` ma aktywny sojusz z graczem (dokładnie ten sam predykat
`allianceFormalKindBetween` co strona gracza w rundzie 1), dokłada unię z bieżącą, żywą
widocznością WŁASNĄ gracza. Aby uniknąć wzajemnej rekursji `currentVisible()` ↔
`currentVisibleForOwner()` (strona gracza woła stronę AI dla sojuszników, strona AI teraz
wołałaby z powrotem stronę gracza), widoczność WŁASNA gracza (bez unii sojusznika) została
wydzielona do nowej funkcji `ownPlayerVisibleHexes()` — dokładnie to, co wcześniej było ciałem
`currentVisible()` przed pętlą sojuszników; obie funkcje teraz z niej korzystają zamiast
duplikować logikę.

Zero zmian w `ai.ts`. Jedyny zmieniony plik silnika: `gra/src/main.ts` — funkcja, przez którą
ta sama widoczność już wcześniej trafiała do `ai.ts`, teraz zwraca inny (szerszy, dla
sojuszników) zestaw heksów; sama logika Priorytetu 4, która na tym zestawie operuje, jest
bitowo nietknięta.

---

## 1. Zmiana (allowlista: `gra/src/main.ts` — jedyny zmieniony plik)

```ts
/** Widoczność WYŁĄCZNIE z własnych jednostek/miast gracza (bez unii sojusznika) —
 *  wydzielone z currentVisible(), żeby currentVisibleForOwner() mogło dołożyć unię z
 *  widocznością gracza bez wzajemnej rekursji. */
function ownPlayerVisibleHexes(): Set<string> { /* to, co wcześniej było ciałem currentVisible() */ }

function currentVisible(): Set<string> {
  const visible = ownPlayerVisibleHexes();
  for (const oid of aiOwnerCivMap.keys()) {
    if (allianceFormalKindBetween(activeDeals, 0, oid) === null) continue;
    for (const k of currentVisibleForOwner(oid)) visible.add(k);
  }
  // ... (start-reveal fallback nietknięty)
}

function currentVisibleForOwner(ownerId: number): Set<string> {
  const visible = computePlayerVisibility({ /* nietknięte — własna widoczność ownera */ });
  if (ownerId !== 0 && allianceFormalKindBetween(activeDeals, 0, ownerId) !== null) {
    for (const k of ownPlayerVisibleHexes()) visible.add(k);
  }
  return visible;
}
```

`allianceFormalKindBetween` — ta sama funkcja, ten sam import z `diplomacy-treaties.ts`, ten
sam predykat co strona gracza w rundzie 1 (rozpoznaje wyłącznie `sojusz_defensywny`/
`sojusz_pelny`, więc pakt/handel/granice NIETKNIĘTE — GOAL 5 dispatchu rundy 2/GOAL 4
pierwotnego dispatchu). Zero zmian w `diplomacy-treaties.ts`.

**Dlaczego to jest zgodne z „Zero zmian w ai.ts Priorytet 4"**: `currentVisibleForOwner` nigdy
nie była w `ai.ts` — jest w `main.ts`, w warstwie, która PRZYGOTOWUJE dane dla `ai.ts`
(`aiVisibleHexes = currentVisibleForOwner(ownerId)` → `rememberVisibleAiTargets(...)` →
`opts.visibleHexes` → `decideAITurn`; oraz `aiCityCaptureAllowed(..., currentVisibleForOwner
(ownerId), ...)`). Ta runda zmienia WYŁĄCZNIE co ta funkcja zwraca (szerszy zestaw heksów dla
sojuszników) — ani jedna linia w `ai.ts`/`ai-fog.ts` nie została dotknięta. `git diff --stat`
potwierdza: jedyny zmieniony plik to `gra/src/main.ts`.

Dodatkowo (allowlista: „nowe lub rozszerzone testy w `gra/tools/*-test.cjs`", plus hak
testowy main.ts wzorem już-istniejących `__dyploMapaOdkrycieTestDebug`/
`__sojuszWidocznoscTestDebug` z rundy 1): nowa metoda `spawnFarPlayerScout(ownerId)` w
istniejącym `__sojuszWidocznoscTestDebug` — symetryczny odpowiednik `spawnFarAiScout` z rundy
1, ale po stronie GRACZA (klonuje istniejącą jednostkę gracza na najdalszy suchy ląd od
danego ownera). Steruje WYŁĄCZNIE pozycją jednostki testowej, nic o samym mechanizmie
widoczności nie jest podrobione — ten sam wzorzec i uzasadnienie co analogiczny hak rundy 1.

---

## 2. Testy

### 2a. Bramki referencyjne (R-PROC-AUTOBOT.md §6) — z `gra/`, worktree, PO zmianie rundy 2

| Bramka | Wynik referencyjny | Wynik teraz |
|---|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | 0 błędów | **0 błędów** |
| `node tools/logic-test.cjs` | 213/213 | **213/213** |
| `node tools/tech-tree-test.cjs` | 19/19 | **19/19** |
| `node tools/research-test.cjs` | 33/33 | **33/33** |
| `node tools/unit-replace-test.cjs` | 13/13 | **13/13** |
| `node tools/combat-test.cjs` | 6/6 | **6/6** |

### 2b. Sweep AI/fog/dyplomacja/sojusz (dispatch rundy 2, punkt 4) — porównanie z baseline

Baseline = `origin/main` PRZED tym tematem (weryfikowane rundą 1 identycznie; tu potwierdzone
ponownie po zmianach rundy 2 przez `git stash` całego diffu tej rundy → uruchomienie →
`git stash pop`, patrz §2c dla jednego przypadku, gdzie to porównanie było kluczowe).

| Bramka | Wynik PO rundzie 2 | Porównanie z baseline |
|---|---|---|
| `node tools/ai-fog-test.cjs` | **8/8** | identyczne (main.ts nie zmienia `ai-fog.ts`/`ai.ts`, tylko wejście które te testy same konstruują niezależnie od main.ts) |
| `node tools/river-fog-visibility-test.cjs` | **31/0** | identyczne |
| `node tools/alliance-war-obligation-test.cjs` | **14/0** | identyczne |
| `node tools/city-state-alliance-test.cjs` | **67/0** | identyczne |
| `node tools/diplomacy-relacje-ai-ai-audiencja-test.cjs` | **20/0** | identyczne |
| `node tools/ai-war-gate-test.cjs` | **24/0** | identyczne |
| `node tools/ai-city-capture-integration-test.cjs` | **14/0** | identyczne |
| `node tools/diplomacy-ai-balance-test.cjs` | **31/0** | identyczne |
| `node tools/ai-test.cjs` | **287 pass, 8 fail** | **IDENTYCZNE nazwy/komunikaty asercji** co runda 1 i `origin/main` (C-058, pre-istniejąca czerwień: 3× "economy building"/"wartość" w budowie, 1× Harappa arch, 3× `zaproponuj_handel` T2S-b/b2/T10b) — potwierdzone `grep -in fail` na pełnym logu, żadna NOWA asercja nie zawiodła |

Te testy jednostkowe konstruują `visibleHexes`/wejścia AI ręcznie i NIE przechodzą przez
`main.ts`, więc formalnie nie mogłyby wykryć regresji w `currentVisibleForOwner` — trzymają
się w sweepie jako dowód, że logika Priorytetu 4 (`ai.ts`) sama w sobie jest bitowo nietknięta
(zero regresji tam, gdzie regresja w ogóle mogłaby powstać, gdyby ta runda naruszyła
allowlistę i dotknęła `ai.ts`).

### 2c. Weryfikacja pre-istniejącej czerwoności `dyplo-mapa-odkrycie-live-test.cjs` (temat
sąsiedni, R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1) — NIE w allowliście tej rundy, ale
`currentVisibleForOwner` jest przez niego wołana (linia main.ts ok. 18226, jednorazowy zrzut
widoczności przy KAŻDYM traktacie handel/pakt/sojusz), więc sprawdzone jako dodatkowa
ostrożność:

Uruchomienie PO zmianie rundy 2: **9 pass, 1 fail** — `FAIL (5) Umowa szlaków: propozycja +
Przyjmij przeszły przez realne UI` (błąd kliknięcia w UI negocjacji, `acceptRes.found:false`
— nie ma nic wspólnego z widocznością). Żeby wykluczyć regresję tej rundy, wykonano:
`git stash push -u -- gra/src/main.ts gra/tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs`
(cofnięcie CAŁEGO diffu tej rundy do czystego `origin/main`), ponowne uruchomienie tej samej
bramki: **identyczny wynik — 9 pass, 1 fail, TA SAMA asercja (5), TEN SAM komunikat błędu**
(`acceptRes":{"found":false}`, `toast` wciąż pokazujący poprzedni traktat). Potwierdzone:
pre-istniejący, niezwiązany z tym tematem flake w warstwie UI negocjacji tamtego testu (nie w
widoczności — kryteria (3)/(6) tamtego testu, które faktycznie sprawdzają scalenie
widoczności z `explored`, są **zielone** w obu przebiegach). `git stash pop` przywrócił zmiany
rundy 2 (`git status`/`git diff --stat` potwierdzone identyczne z przed stashem — jedyny
zmieniony plik silnika `gra/src/main.ts`).

### 2d. Żywy dowód wieloturowy, OBUSTRONNY (REGUŁA PRZECIW SAMOOSZUKIWANIU) — rozszerzenie
`tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs` z rundy 1

Ten sam plik z rundy 1 (headless Chromium, realny `vite build`, realny `?playtest=mapa`,
REALNE `activeDeals`/`breakTreatyVoluntarily`/`endTurn()`), rozszerzony o symetryczne kroki
strony AI (nowy hak `spawnFarPlayerScout` + istniejący `getOwnerCurrentVisibleKeys`, który
teraz woła zmienioną `currentVisibleForOwner`):

**Wynik: PASS — 38/38, 0 fail** (dwa niezależne uruchomienia w tej rundzie, oba zielone).

Pokrycie (oprócz kryteriów 1–4 rundy 1, bez zmian, wciąż zielone):
1. **(0d)/(1b)/(1c) Kontrola negatywna „przed" — strona AI**: daleka jednostka GRACZA (poza
   zasięgiem sojusznika) tworzy heks widoczny WYŁĄCZNIE graczowi; PRZED sojuszem
   `currentVisibleForOwner(ownerId)` (dokładnie to, co zasila `aiVisibleHexes`) tego heksu
   NIE zawiera.
2. **(3b) Zawarcie sojuszu + 1 turę → strona AI**: `currentVisibleForOwner(ownerId)` TERAZ
   zawiera próbkę heksów widocznych wyłącznie graczowi.
3. **(4.2c)/(4.3c) Dwie KOLEJNE tury z rzędu → strona AI**: heksy nadal widoczne sojusznikowi
   (ciągłość, nie jednorazowy zrzut — ta sama semantyka co strona gracza).
4. **(5b) Zerwanie sojuszu BEZ nowej tury → strona AI**: heksy natychmiast znikają z
   `currentVisibleForOwner(ownerId)`.
5. **(E0)** zero błędów konsoli/JS przez cały przebieg (obie strony razem).

Test świadomie NIE uruchamia realnej tury AI z celami w nowo-widocznym terenie (to wymagałoby
oddzielnego, głębszego scenariusza bojowego poza zakresem tej rundy — allowlista dispatchu
wymaga dowodu widoczności, nie dowodu konkretnej decyzji ataku) — GOAL 5 dispatchu wprost
przewiduje, że jeśli zmiana widoczności WPŁYNIE na decyzje AI (np. nowe cele ataku), to jest
to ZAMIERZONY skutek uboczny, nie coś do zablokowania testem; §2b (istniejące bramki
`ai-city-capture-integration-test`/`ai-war-gate-test`) potwierdza, że sama logika decyzyjna
zużywająca `visibleHexes`/`aiCityCaptureAllowed` pozostaje nietknięta i deterministyczna na
tych samych wejściach co przed tym tematem.

Zrzuty (nadpisane, wspólne z rundą 1): `dyspozycje/autobot/runs/
R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1/dowody/`.

---

## 3. Dokumentacja NIEZAMIERZONYCH vs ZAMIERZONYCH skutków (dispatch rundy 2, punkt 4)

**Zamierzony, oczekiwany skutek tej zmiany** (nie regresja): AI-sojusznik, po zawarciu
sojuszu, ma teraz w `aiVisibleHexes`/`currentVisibleForOwner` dodatkowe heksy z terenu
gracza — jeśli w tych heksach znajdują się cele nadające się do `rememberVisibleAiTargets`
lub warunki `aiCityCaptureAllowed`, sojusznik AI MOŻE zacząć widzieć/pamiętać/kwalifikować
cele, których wcześniej (bez sojuszu z rozszerzoną widocznością) nie widział. To jest DOKŁADNIE
to, o co poprosił właściciel („AI-sojusznik tez dostaje wglad w Twoj teren, z wplywem na jego
cele/decyzje"). Nie zaobserwowano tego efektu w żadnej z uruchomionych bramek regresyjnych
(§2b) — bo żadna z nich nie stawia scenariusza „sojusznik AI + cel wyłącznie w nowo-widocznym
terenie gracza + faktyczna tura AI z decyzją ataku" (taki scenariusz wymagałby dedykowanego
testu, poza zakresem kryteriów końca tej rundy, które wymagają dowodu WIDOCZNOŚCI, nie
konkretnej decyzji na jej podstawie).

**Rozbieżności NIE związane z sojuszem** (byłyby prawdziwą regresją): ŻADNE nie wystąpiły —
`ai-test.cjs` (287/8 fail) identyczne nazwy/komunikaty asercji z baseline `origin/main`;
wszystkie 8 bramek regresyjnych §2b identyczne PASS/FAIL; `dyplo-mapa-odkrycie-live-test.cjs`
identyczny wynik (9/1) na obu wersjach main.ts (§2c). Zero regresji poza zakresem tego tematu.

---

## 4. Zgodność z barierami (R-PROC-AUTOBOT.md §9)

- Zero `npm run build`/`npm run dev` w `gra/` — build wyłącznie
  `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`.
- Zero `git add -A` (stash użyty wyłącznie do porównania z baseline, z jawną listą plików
  `-- gra/src/main.ts gra/tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs`, natychmiast
  przywrócony `git stash pop`, zweryfikowany identyczny `git status`/diff po przywróceniu).
- Zero zmian w `docs/decyzje/<ID>.md`, `dyspozycje/WERSJE.md`, `gra-robocza/
  ROBOCZA-MANIFEST.json`, `playbook.json`.
- Zero zmian widoczności dla paktu/handlu/granic — `allianceFormalKindBetween` rozpoznaje
  wyłącznie sojusz_defensywny/sojusz_pelny, identycznie jak runda 1.
- Zero zmian w `ai.ts` — `git diff --stat` (worktree): jedyny zmieniony plik silnika to
  `gra/src/main.ts`.
- Efemeryczne artefakty z uruchomienia sąsiedniego testu (`dyplo-mapa-odkrycie-live-test.cjs`
  nadpisuje własne zrzuty w SWOIM katalogu `dowody/` przy każdym uruchomieniu) świadomie
  przywrócone `git checkout --` do stanu sprzed tej rundy — poza allowlistą tego tematu, nie
  miały pozostać jako zmiana.

---

## 5. Raport terminalny

ZMIANY/COMMIT: `gra/src/main.ts` (funkcje `ownPlayerVisibleHexes` (nowa, wydzielona),
`currentVisible` (bez zmiany logiki, korzysta z wydzielonej funkcji), `currentVisibleForOwner`
(rozszerzona o unię z widocznością gracza dla sojuszników), `__sojuszWidocznoscTestDebug`
(nowa metoda `spawnFarPlayerScout`)); `gra/tools/dyplo-sojusz-widocznosc-ciagla-live-test.cjs`
(rozszerzony o 15 nowych asercji strony AI, symetrycznych do rundy 1); `dyspozycje/autobot/
runs/R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1/03-operator-r2.md` (ten plik) + `dowody/*.png`
nadpisane najnowszym przebiegiem. Brak commitu — zmiany w worktree
`/home/user/wt-sojusz-widocznosc-ciagla`, gałąź `autobot/R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1`.
TESTY: 5 bramek referencyjnych zielone (§2a) + `tsc --noEmit` czyste + 8 bramek regresyjnych
fog/AI/dyplomacja/sojusz zielone identycznie z baseline (§2b) + `ai-test.cjs` 287/8-fail
identyczne nazwy asercji z baseline (C-058, pre-istniejące) + `dyplo-mapa-odkrycie-live-test`
9/1 identyczne na obu wersjach main.ts, pre-istniejący UI-flake niezwiązany z tematem (§2c) +
żywy wieloturowy dowód Playwright OBUSTRONNY 38/0 (§2d).
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) — weryfikacja zgodności z ECHO właściciela
(„Tak, zrob to tez dla AI (obustronnie)"), zgodności z „zero zmian w ai.ts Priorytet 4"
(potwierdzone `git diff --stat`), realności dowodu §2d (obustronność), kompletności sweepu
§2b/2c, poprawności §3 (dokumentacja zamierzonych vs niezamierzonych skutków).
DEPLOY/PUSH: **NIE WYKONANO**.
