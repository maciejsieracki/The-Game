STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1
ZMIANY-COMMIT: patrz SHA w commit message tego pliku — `gra/src/ui/cityPanel.ts` (jedyny
plik zmieniony, 9 wstawionych linii, 0 usuniętych, wyłącznie komentarze — zero zmiany
logiki/formuły/zaokrąglenia). Dwa miejsca: blok "Prawo" w `renderSpoleczenstwo`
(~3302-3315) i wiersz "Prawo" w `buildPorzadekDetailCard` (~3421-3427).
TESTY:
- `npx tsc --noEmit` w `gra/` — czyste, zero błędów.
- `git diff --stat` — tylko `gra/src/ui/cityPanel.ts`; `git diff --check` — czyste.
- Żywy zrzut Playwright/Chromium (`node tools/porzadek-panel-punkty-absolutne-real-render-test.cjs`)
  URUCHOMIONY PONOWNIE po poprawce: **10/10 pass**, identyczne wartości jak w rundzie
  Evaluatora: `"Szczęście27%(9/35 pkt)"`, `"Prawo0%(0/47 pkt)"`, karta szczegółów pokazuje
  `Szczęście: 27% (9/35 pkt)` / `Prawo: 0% (0/47 pkt)` — komentarz-only nie naruszył
  bundlowania ani wyniku.
- 4 pozostałe istniejące bramki cityPanel/porządek uruchomione ponownie samodzielnie:
  `citypanel-uwagi-abc-filter-test.cjs` 35 pass/0 fail, `spichlerz-cap-citypanel-wiring-test.cjs`
  12 pass/0 fail, `citypanel-uwagi-hostcard-removed-real-render-test.cjs` 12 pass/0 fail,
  `citypanel-konwerter-produkcja-test.cjs` 83 pass/0 fail — wszystkie identyczne z rundą
  Evaluatora (83+35+12+93(=83+10)+12, 0 fail łącznie).
BLOKADY: brak.
RUNDY: 1/5 (obrona nie zwiększa licznika)
NASTĘPNY KROK: Evaluator → Final Control (Ścieżka A, Workflow).

OBRONA:

1 -> PRZYJMUJE. Dowód zarzutu: `orderPanel.ts:18` faktycznie dokumentuje `porzadek` jako
"Legacy pkt prawa / pole porzadek historyczne", a w miejscach wyświetlania
(`cityPanel.ts` blok "Prawo" i wiersz "Prawo" w `buildPorzadekDetailCard`) nie było żadnego
komentarza ostrzegawczego przy użyciu `state.porzadek` — realne ryzyko pomyłki z
`state.porPct` ("Porządek łącznie") kilka linii dalej w tej samej funkcji. Poprawka: dodano
komentarz w obu miejscach wyświetlania z jawnym odesłaniem do `orderPanel.ts:18`,
odróżnieniem od `porPct`/"Porządek łącznie" i referencją do ręcznej weryfikacji z rundy 1
(netto=9.4 → `Math.round(9.4)=9`, zgodne z wyświetlonym "(9/35 pkt)"). Weryfikacja po
zmianie: `tsc --noEmit` czyste, 10/10 + 35+12+83 pass bez zmian w wyniku (komentarz nie
mógł i nie zmienił zachowania).

2 -> ODRZUCAM. Dowód: dyspozycja `00-dispatch.md` wprost zakazuje tej klasy zmiany —
"WYŁĄCZNIE zmiana wyświetlania — zero zmiany w formule..." oraz explicite "NIE wymyślać
nowej jednostki miary ani nie zmieniać istniejącego zaokrąglenia procentu" (sekcja FORMAT
WYŚWIETLANIA). Sam mechanizm rozbieżności jest strukturalny, nie błędem tej zmiany:
`pctFromNetto` (`society-breakdown.ts:503-506`) liczy % z SUROWEGO `netto/max` (clampPct
z precyzją do 0.1), NIEZALEŻNIE od tego, że wyświetlane pkt (`Math.round(state.szczescie)`,
`Math.round(state.szMax)`) są zaokrąglane osobno do liczb całkowitych — trzy niezależnie
zaokrąglone liczby (%, netto, max) z definicji nie muszą się nawzajem "przeliczać" 1:1;
to jest znany, ogólny artefakt każdej prezentacji "% + zaokrąglone liczby bezwzględne", a
nie defekt wprowadzony tym tematem. Dowód, że to ISTNIEJĄCY, wcześniej zaakceptowany wzorzec
w tym samym pliku, nie coś nowego: komentarz `cityPanel.ts:3307` i `:3445` — "zarzut 6: jedno
zaokrąglenie prezentacyjne — ta sama liczba, którą pokazuje karta Religii" — ten dokładnie
wzorzec (osobno zaokrąglony % obok osobno zaokrąglonych liczb bezwzględnych) już istnieje
w karcie Religii i był już przedmiotem wcześniejszego zarzutu w tym repo, zaakceptowanego
jako zgodny z konwencją UI. Zmiana zaokrąglenia procentu (np. przeliczanie go z zaokrąglonych
pkt zamiast z surowego netto) byłaby MNIEJ dokładna (procent straciłby precyzję 0.1pp) i
wprost naruszałaby zakaz dyspozycji. Nie zmieniam kodu w odpowiedzi na ten zarzut.

DEPLOY/PUSH: NIE WYKONANO
