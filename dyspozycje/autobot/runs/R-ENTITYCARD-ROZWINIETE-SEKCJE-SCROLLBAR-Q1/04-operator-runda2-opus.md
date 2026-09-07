STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
ROLA: Operator, runda 2/5
MODEL+EFFORT: Opus 5, effort Medium (korekta §5a — temat sklasyfikowany przez
orkiestratora jako GRAFICZNY/WIZUALNY w `00b-dispatch-runda2-model-opus.md`)
GOAL: (A) Karta technologii — sekcje „Ulepszenia terenu" i „Zmiany ekonomiczne"
domyślnie ROZWINIĘTE, bez klikania. (B) `.entity-card-dialog` ma TRWALE WIDOCZNY
pasek przewijania, bez polegania na geście scrolla.

## Zakres tej rundy

Runda 2 nie zaczynała od zera. Zadanie: **samodzielnie zweryfikować**, czy commit
`a391307f` (runda 1, wykonana błędnie na Sonnet 5) faktycznie realizuje GOAL —
własny odczyt kodu, własne uruchomienie bramek, **własny, nowy żywy zrzut
Chromium**, bez opierania się na raporcie ani zrzutach rundy 1.

**Wynik: nic nie wymagało poprawy w kodzie. Zero zmian w `gra/` w tej rundzie.**
Poniżej dowód własny, nie przepisany.

## Guard wstępny (§2b)

```text
git log -1 --oneline  → ee48554f (dispatch runda 2) — oczekiwana baza
git status --short    → pusto (czyste drzewo, przed i po całej rundzie)
```

Po zakończeniu wszystkich pomiarów drzewo nadal czyste; artefakty tymczasowe
(`gra/tools/.r2*`) usunięte przez skrypty w `finally`, zweryfikowane `ls`.

## ZMIANY/COMMIT

W tej rundzie **brak zmian w kodzie gry** — dokładany jest wyłącznie ten raport
(`dyspozycje/autobot/runs/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1/*`).

Zweryfikowany osobiście stan commita `a391307f` (`git show a391307f`, odczyt pełnego
diffu, nie streszczenia):

- `gra/src/ui/entityCards/technologyAdapter.ts` (+2/-2) — dokładnie dwie linie:
  `improvementsSection` (l. 221) i `econSection` (l. 301), `openDefault: false` →
  `openDefault: true`. `collapsible: true` **nietknięte** w obu miejscach.
  Kontrola własna: `grep -rn "openDefault" src/ui/entityCards/` → 6 wystąpień
  z `true`, **zero** z `false`; poza tym `renderer.ts:257` (`section.openDefault
  !== false`) i deklaracja w `types.ts:77`. Zero pozostałości.
- `gra/src/ui/entityCards/renderer.ts` (+13/-1) — wyłącznie blok CSS
  `.entity-card-dialog` (l. 702-714): `scrollbar-gutter:stable`,
  `scrollbar-width:thin`, `scrollbar-color` (Firefox) + `::-webkit-scrollbar`
  (12px), `-track`, `-thumb`, `-thumb:hover` (Chromium/WebKit) plus komentarz
  wiążący zmianę z ID tematu. `buildSectionEl` (l. 219-285) — odczytane
  linia po linii, **bez zmian**: `data-open`, `aria-expanded`, chevron ▾/▸,
  `bodyEl.hidden` i `headBtn.addEventListener('click', …)` w pełni na miejscu.
  Mechanizm zwijania NIE został usunięty ani osłabiony.
- `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` — nowa bramka.

Diff mieści się w allowliście `00-dispatch.md` co do pliku i co do zakresu w pliku.
Brak `git add -A` (commit niesie wyłącznie pliki z allowlisty).

## TESTY (wszystkie uruchomione przeze mnie w tej rundzie, nie przepisane)

Bramki referencyjne (§6), z `gra/`, kompilacja wyłącznie dozwoloną komendą (C-001):

| Bramka | Komenda | Wynik mój (runda 2) | Referencja §6 |
|---|---|---|---|
| TypeScript | `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3) | 0 błędów | 0 |
| Logika | `node tools/logic-test.cjs` | LOGIC OK (213/213) | 213/213 |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | 19 pass, 0 fail | 19/19 |
| Badania | `node tools/research-test.cjs` | 33/33, ALL GREEN | 33/33 |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | 13/13 ZIELONE | 13/13 |
| Walka | `node tools/combat-test.cjs` | 6/6 pass | 6/6 |

Bramka tematu (runda 1), uruchomiona przeze mnie od nowa:
`xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs`
→ **21 pass, 0 fail**. Potwierdzam też jej ostrzeżenie jako prawdziwe i istotne:
Playwright w `headless:true` bezwarunkowo dokleja `--hide-scrollbars`, więc test
paska MUSI biec `headless:false` pod Xvfb — inaczej byłby pusty niezależnie od CSS.

### WŁASNY, NIEZALEŻNY DOWÓD WIZUALNY (§5a, wymóg „Twój WŁASNY zrzut")

Napisałem **własny** skrypt weryfikacyjny, niezależny od bramki rundy 1 — inny
bundler entry (import bezpośrednio z plików na dysku, bez wirtualnych ścieżek),
inny viewport (960×600), inna technika dowodu: **analiza PIKSELI zrzutu PNG**
(`pngjs`), a nie tylko atrybuty DOM i `offsetWidth − clientWidth`. To celowo
mocniejszy test niż K3 rundy 1: `scrollbar-gutter:stable` rezerwuje miejsce
w layoucie także wtedy, gdy uchwyt paska nie jest malowany — więc sam pomiar
`offsetWidth − clientWidth` **nie dowodzi jeszcze, że użytkownik pasek widzi**.
Dowód pikselowy tę lukę zamyka.

Skrypt: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/operator-r2-opus-pixel-proof.cjs`
(poza repo — nie dubluję bramki w `gra/tools/`, §14 dyscyplina zakresu).
Wynik: **12 pass, 0 fail**.

```text
PASS (D1a) "Ulepszenia terenu": data-open=1, aria-expanded=true, chevron ▾,
           body NIE hidden, wysokość > 0 — bez kliknięcia
PASS (D1b) "Zmiany ekonomiczne": jak wyżej — bez kliknięcia
PASS (D1c) obie sekcje mają NIEPUSTĄ widoczną treść wierszy (nie sam nagłówek)
PASS (precond) scrollHeight > clientHeight ORAZ scrollTop === 0 (zero interakcji)
PASS (D2a) w pasie 12px przy prawej krawędzi dialogu > 200 pikseli złotego uchwytu
PASS (D2b) złote piksele tworzą pionowy UCHWYT krótszy niż wysokość dialogu
           (pasek z proporcją, nie jednolite tło)
PASS (D2c) uchwyt zaczyna się u góry toru — pozycja spójna ze scrollTop = 0
PASS (D3)  KONTROLA NEGATYWNA: ten sam render z CSS pozbawionym reguł
           scrollbar-*/::-webkit-scrollbar → ZERO złotych pikseli w tym samym pasie
PASS (D4)  brak błędów konsoli/pageerror
```

**Obejrzałem zrzuty własnymi oczami** (nie tylko asercje liczbowe), zapisane w
`…/scratchpad/shots-r2-operator-opus/`:

- `r2-opus-01-karta-bez-interakcji.png` — karta „Gospodarka wodna" (dokładnie ta ze
  zrzutu właściciela) tuż po otwarciu: **złoty pasek przewijania po prawej stronie,
  widoczny od razu**, uchwyt przy górze toru, zero scrolla i zero hovera.
- `r2-opus-04-przewiniete-do-obu-sekcji.png` — widać nagłówki **„Ulepszenia terenu"
  (wiersz: Irygacja)** i **„Zmiany ekonomiczne" (Studnia +1 zadowolenia, Studnia —
  utrzymanie 1 złota/turę)**, oba z chevronem ▾ i widoczną treścią; uchwyt paska
  przesunięty w dół proporcjonalnie do przewinięcia.
- `r2-opus-05-cala-karta-obie-sekcje-rozwiniete.png` — okno 960×1500, **cała karta
  w jednej klatce**: wszystkie sekcje („Co możesz teraz zrobić", „Budynki",
  „Ulepszenia terenu", „Zmiany ekonomiczne", „Wymagania") rozwinięte, zero kliknięć.
- `r2-opus-03-kontrola-negatywna-bez-css-paska.png` — kontrola negatywna: bez naszego
  CSS pasek jest szary/systemowy **i dodatkowo pojawia się poziomy pasek przewijania
  u dołu** (bez `scrollbar-gutter:stable` pionowy pasek zabiera szerokość i wypycha
  treść). To niezamierzony, ale realny plus zmiany, którego runda 1 nie odnotowała.
- `r2-opus-02-prawa-krawedz-pasek.png` — wycinek 20px prawej krawędzi (materiał
  źródłowy analizy pikselowej).

## BLOKADY: brak

## NOTY (stąd `PASS-WITH-NOTES`, nie `PASS`)

1. **Ograniczenie platformy dowodu — sprawdzone tylko na Linux/Chromium.**
   Weryfikacja biegła na Chromium pod Xvfb. Warstwa `::-webkit-scrollbar`
   (Chromium/WebKit, w tym Safari) i `scrollbar-width`/`scrollbar-color` (Firefox)
   są napisane poprawnie i pokrywają wszystkie trzy silniki, ale **fizycznie nie
   mam tu jak potwierdzić renderu na macOS ani w Firefoksie**. Zgodnie z wymogiem
   `00-dispatch.md` („jeśli napotkasz twardy limit platformy, opisz to zamiast
   obiecywać") zapisuję to wprost, zamiast twierdzić „działa wszędzie". Istotne
   dla oceny: zdefiniowanie `::-webkit-scrollbar` z jawną szerokością wymusza
   w Chromium/WebKit klasyczny (nie-overlay) pasek również na macOS — czyli
   mechanizm jest właściwy dla zgłoszonego problemu — ale to argument z zachowania
   silnika, nie z mojego zrzutu.
2. **Poza GOAL, do decyzji orkiestratora: w karcie technologii ZOSTAJE jeden
   element wymagający kliknięcia.** Sekcja „Jednostki" ma `previewLimit`
   (`technologyAdapter.ts:197`, `UNIT_PREVIEW = 3`) — sekcja jest rozwinięta,
   ale ponad trzy pierwsze wiersze chowa przycisk „Pokaż pozostałe N"
   (`renderer.ts:244-256`). Zmierzone na danych, nie z pamięci
   (`gra/data/units.json`): dotyczy **5 realnych technologii** — Brązownictwo (20
   jednostek), Hutnictwo żelaza (19), Jeździectwo (8), Łucznictwo (6), Obróbka
   żelaza (4). Zrzut dowodowy: `r2-opus-06-OBSERWACJA-pokaz-pozostale-jednostki.png`
   — karta „Brązownictwo", sekcja Jednostki `data-open="1"`, a mimo to przycisk
   **„Pokaż pozostałe 17"**.
   Dosłowne zgłoszenie właściciela brzmiało „wszystkie możliwe elementy w karcie
   technologii powinny być rozwinięte", więc **z punktu widzenia użytkownika ta
   pozycja nie jest jeszcze domknięta** — ale `GOAL` tego dispatchu jest węższy
   (dwie sekcje + pasek), a allowlista dopuszcza w `technologyAdapter.ts`
   **wyłącznie `openDefault`**. Zgodnie z §14 (dyscyplina zakresu) **niczego tu nie
   zmieniam** i nie rozszerzam tematu „przy okazji". Rekomendacja: osobny temat
   albo pytanie ABC do właściciela — „Pokaż pozostałe N" to świadomy mechanizm
   przeciw karcie na 20 wierszy jednostek, więc jego usunięcie jest decyzją
   projektową (UX), nie oczywistą poprawką.
3. **Uwaga do bramki rundy 1 (nie defekt, nie wymaga poprawki):** kryterium (K3)
   mierzy `offsetWidth − clientWidth ≥ 8`, co przy `scrollbar-gutter:stable`
   przechodziłoby także wtedy, gdyby uchwyt nie był malowany. Bramka pozostaje
   ważna (uzupełnia ją porównanie `getComputedStyle(…, '::-webkit-scrollbar')`
   PRZED/PO), a lukę domyka mój dowód pikselowy D2a-D2c opisany wyżej.
   Zostawiam bez zmian — poprawianie cudzej, zielonej bramki bez defektu byłoby
   rozszerzeniem zakresu.

## Werdykt własny

Commit `a391307f` **realizuje GOAL z `00-dispatch.md`** — potwierdzone własnym
odczytem kodu, własnym uruchomieniem wszystkich bramek i **własnym, nowym żywym
zrzutem Chromium z analizą pikseli oraz kontrolą negatywną**. Binarne kryterium
sukcesu (`00-dispatch.md`): **PRAWDA** — obie sekcje rozwinięte bez kliknięcia,
pasek przewijania widoczny bez interakcji. Zmian w kodzie w tej rundzie nie było,
bo żadna nie była potrzebna.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Opus 5, effort High) — z własnym, niezależnym żywym
zrzutem Chromium (§5a); następnie Final Control (Sonnet 5, effort High).
Do rozstrzygnięcia przez orkiestratora: nota 2 (previewLimit „Pokaż pozostałe N")
— osobny temat / pytanie ABC, nie rozszerzenie tego ID.
DEPLOY/PUSH: NIE WYKONANO
