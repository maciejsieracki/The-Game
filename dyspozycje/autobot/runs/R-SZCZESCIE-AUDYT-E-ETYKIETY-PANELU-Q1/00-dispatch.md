# R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1 — dispatch

TEMAT: `R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1`
(węzeł **E**, ostatni z pięciu, temat nadrzędny: `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1`)
RUNDA: 1/5
DOMAIN: GAME (wizualny — etykieta/tooltip panelu, zero zmiany formuły)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high
(temat WIZUALNY, `R-PROC-AUTOBOT.md` §9 poz. 6b); Final Control — Sonnet 5, effort high.

## GENEZA

Cytat dosłowny, już zarejestrowany i weryfikowalny grepem w
`R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1/00-dispatch.md`:
> „„Szczęście 75% wkładu / Prawo 25% wkładu" to WYNIK, nie waga" — `orderContributionPct`
> (`:632-650`) liczy udział ważonych wartości; rzeczywiste wagi to `porzadek_waga_szczescie`
> easy 0,55 / **normal 0,50** / hard 0,45 (`society-params.json → porzadek`, `order.ts:251-252`,
> `computePorPct:609-611`). *(Mylącą etykietą zajmuje się węzeł E.)*

Ten sam dispatch, w sekcji GRANICE: „Nie zmieniasz etykiet panelu (węzeł E)." — węzeł A
świadomie zostawił to na później. Węzły A, B, C, D są dziś zintegrowane; to jest **ostatni**
element całego audytu `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1`.

**Ten dispatch jest autorstwa orkiestratora** — poza powyższym, jednozdaniowym zapisem
wyłączającym węzeł E z zakresu A, nie ma osobnego, wcześniej zarejestrowanego cytatu
właściciela opisującego wprost, JAK ma wyglądać naprawiona etykieta. Reszta tej sekcji to
recon orkiestratora nad rzeczywistym kodem — każda linia do zweryfikowania samodzielnie.

**Stan dzisiejszy (zweryfikowany czytaniem kodu):**
- `gra/src/ui/cityPanel.ts:3294-3306` — blok „Porządek łącznie" panelu miasta renderuje:
  `Szczęście: ${Math.round(state.szWkladPct)}% wkładu` i
  `Prawo: ${Math.round(state.prawWkladPct)}% wkładu` — TEKST już mówi „wkładu”, nie „waga”,
  więc nie jest to dosłowne kłamstwo. Ryzyko: gracz nieznający różnicy między „wkład tej
  tury” (wynik, zmienny) a „waga mechanizmu” (stała, `porzadek_waga_szczescie`/
  `porzadek_waga_prawo`) może i tak odczytać ten procent jako STAŁĄ regułę gry — zwłaszcza że
  nic w UI nie tłumaczy, skąd się bierze, ani nie pokazuje prawdziwej wagi obok.
- `gra/src/game/society-breakdown.ts:1019-1037` (`orderContributionPct`) i
  `gra/src/ui/orderPanel.ts:27-32` (typ `OrderPanelState.szWkladPct`/`prawWkladPct`) — kod
  liczący i przenoszący te dwie liczby jest **poza zakresem tego tematu**, NIETKNIĘTY.
- `gra/tools/porzadek-panel-czytelnosc-test.cjs` (81/0 dziś) już pokrywa to dokładne
  miejsce tekstowo (sekcje C-H opisane w nagłówku pliku) — prawdopodobnie właściwe miejsce
  do ROZSZERZENIA, nie pisania nowej bramki od zera (uzasadnij wybór w raporcie, jeśli
  jednak zdecydujesz inaczej).

## GOAL

Dodaj **tooltip/wyjaśnienie** (wzorzec `.title = '...'` już używany wielokrotnie w tym samym
pliku, np. `cityPanel.ts:5216`, `:6127`, `:6979` — natywny tooltip HTML, spójny z resztą
panelu) przy bloku „Szczęście: X% wkładu” / „Prawo: Y% wkładu”, który jasno rozróżnia:
1. **Wyświetlana liczba to udział TEJ TURY** (zależny od bieżących wartości Szczęścia/Prawa
   w mieście — rośnie/maleje z turami), **nie stała reguła gry**.
2. **Rzeczywista, stała waga mechanizmu** (`porzadek_waga_szczescie`/`porzadek_waga_prawo`
   z aktualnej trudności) — pokaż tę wartość w tooltipie (np. „Waga bazowa: Szczęście 50% /
   Prawo 50% (normal)”), żeby gracz miał punkt odniesienia dla „dlaczego dziś jest 75/25”.

**Wybór formy jest Twoją decyzją inżynierską** (tooltip vs. dodatkowa linia tekstu vs. oba) —
dispatch narzuca WYŁĄCZNIE treść informacji (oba punkty wyżej), nie dokładny markup. Zero
zmiany formuły/liczenia — `orderContributionPct`, `computePorPct`, `state.szWkladPct`/
`prawWkladPct` zostają NIETKNIĘTE, to jest wyłącznie dodanie kontekstu do już policzonej
liczby.

**Skąd wziąć prawdziwą wagę do wyświetlenia:** stan panelu (`resolveOrderState`/
`OrderPanelState`, `orderPanel.ts`) już ma dostęp do `difficulty` przy budowaniu tego bloku
(sprawdź realny przepływ, nie zakładaj) — jeśli `porzadek_waga_szczescie`/
`porzadek_waga_prawo` nie są dziś przekazywane do warstwy renderującej ten konkretny blok,
dociągnij je tym samym mechanizmem co inne progi (`data/society-params.json` przez
`loadOrderParams`/`loadSocietyParams`, wzorem sąsiednich odczytów w tym samym pliku) —
**czytaj, nie licz na nowo w UI wzoru, który już istnieje w silniku.**

## BINARNE KRYTERIUM SUKCESU

- Blok „Szczęście: X% wkładu / Prawo: Y% wkładu” w panelu miasta ma dodany tooltip/tekst
  jasno odróżniający „wkład tej tury” od „stałej wagi mechanizmu”, z realną wartością wagi
  bieżącej trudności (nie zahardkodowaną wartością — musi śledzić `society-params.json`,
  dowód: zmień testowo `porzadek_waga_szczescie`/`porzadek_waga_prawo` w danych, pokaż że
  wyświetlona wartość wagi podąża za zmianą).
- **Temat WIZUALNY — dowód bezwarunkowo wymagany, jak dla każdego tematu tej klasy
  (`R-PROC-AUTOBOT.md` §9 poz. 6a): zrzut z ŻYWEGO Chromium przez Playwright** (nowy albo
  rozszerzony `*-real-render-test.cjs`, wzorem innych bramek tej rodziny w `gra/tools/`),
  NIE sam jsdom ani test kontraktowy tekstowy — pokazujący tooltip/tekst faktycznie widoczny
  na renderowanej stronie. Plus dowód nietautologiczności: zmutuj źródło (np. usuń tooltip)
  i pokaż, że test faktycznie czerwienieje.
- Rozszerzona/nowa bramka tekstowa (`porzadek-panel-czytelnosc-test.cjs` lub nowa) — zero
  osłabienia liczby asercji istniejącej bramki, jeśli rozszerzasz.
- Zero zmiany wartości liczbowych `szWkladPct`/`prawWkladPct` — to jest czysto opisowa
  poprawka, gracz widzi TE SAME liczby co dziś, plus wyjaśnienie.
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test).

## ALLOWLISTA

- `gra/src/ui/cityPanel.ts` (WYŁĄCZNIE blok renderujący „Szczęście/Prawo: X% wkładu”,
  ok. linii 3286-3320 — dodanie tooltipu/tekstu, zero zmiany istniejącej logiki liczenia)
- `gra/src/ui/orderPanel.ts` (WYŁĄCZNIE jeśli trzeba dociągnąć pole wagi bieżącej trudności
  do `OrderPanelState` — nowe pole, zero zmiany istniejących)
- Bramka: rozszerzenie `gra/tools/porzadek-panel-czytelnosc-test.cjs` LUB nowa
  `gra/tools/szczescie-audyt-e-etykiety-panelu-test.cjs` — uzasadnij wybór w raporcie
- Nowa/rozszerzona bramka `*-real-render-test.cjs` (Playwright, żywy Chromium)
- `dyspozycje/autobot/runs/R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/society-breakdown.ts`
(`orderContributionPct`/`computePorPct` NIETKNIĘTE — zero zmiany formuły), `gra/src/game/order.ts`,
`gra/data/society-params.json` (odczyt WYŁĄCZNIE, zero zmiany wartości wag), `gra/src/main.ts`.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-szczescie-e`, gałąź `autobot/R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1`,
baza jawnie `origin/main` (commit `b869de97`) — potwierdź `git log -1` PRZED pracą
(SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
jedyny dozwolony build to `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`; bramki `node tools/*-test.cjs` nie są objęte zakazem.

Nie dotyka `main.ts` — może być dispatchowany niezależnie od innych aktywnych tematów (o ile
żaden inny nie dotyka `cityPanel.ts`/`orderPanel.ts` jednocześnie — sprawdź
`git worktree list` przed startem).

**Ostatni węzeł całego audytu `R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1`** — po integracji
tego tematu cała rodzina A-E jest zamknięta.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian formuły/liczenia Porządku — WYŁĄCZNIE dodanie kontekstu/tooltipu do już
  policzonych liczb.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Jeśli podczas pracy okaże się, że dociągnięcie prawdziwej wagi do UI wymaga zmiany
  architektury `OrderPanelState`/`resolveOrderState` wykraczającej poza dodanie jednego pola
  — STOP, `DECISION_REQUIRED`, nie rozszerzaj zakresu samodzielnie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
