STATUS: PASS
DOMAIN: GAME
TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1
GOAL: Panel miasta (bloki Szczęście i Prawo, `gra/src/ui/cityPanel.ts`) pokazuje przy
pasku procentowym TAKŻE netto/max w punktach, wyłącznie zmiana wyświetlania.

ZMIANY/COMMIT: weryfikacja niezależna w `/home/user/wt-porzadek-panel-punkty`
(branch `autobot/R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1`), HEAD zweryfikowany
`c5008247` (potwierdzone `git log -1`). Final Control nie wprowadza zmian
produkcyjnych — tylko odczyt/uruchomienie; commit tego raportu poniżej.

- `git diff --stat 5fa61be3 HEAD`: dokładnie 7 pozycji — `gra/src/ui/orderPanel.ts`
  (+8/-0), `gra/src/ui/cityPanel.ts` (+43/-3, w tym 9 linii komentarzy z obrony rundy 1
  dopisane po commicie Operatora), nowa bramka
  `gra/tools/porzadek-panel-punkty-absolutne-real-render-test.cjs`, oraz 4 raporty
  własne (`00-dispatch.md`, `01-operator-runda1.md`, `02-evaluator-runda1.md`,
  `03-obrona-runda1.md`). `gra/src/game/society-breakdown.ts`: 0 linii diff (potwierdzone
  `git diff 5fa61be3 HEAD -- gra/src/game/society-breakdown.ts | wc -l` → 0). Allowlista
  dotrzymana co do joty — zero plików spoza niej.
- `git diff --check 5fa61be3 HEAD`: czyste, exit 0.

TESTY (wszystkie uruchomione samodzielnie w tej sesji, nie przyjęte na słowo):
- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`): czyste, exit 0.
- 5 istniejących bramek cityPanel/porządek — uruchomione ponownie:
  `citypanel-konwerter-produkcja-test.cjs` 83/0,
  `citypanel-uwagi-abc-filter-test.cjs` 35/0,
  `citypanel-uwagi-hostcard-removed-real-render-test.cjs` 12/0 (real-render Playwright,
  fallback binarki `/opt/pw-browsers/chromium-1194/`, bez błędów konsoli),
  `porzadek-panel-czytelnosc-test.cjs` 93/0,
  `spichlerz-cap-citypanel-wiring-test.cjs` 12/0 — identyczne z liczbami z raportów
  Operatora/Evaluatora/obrony, 0 fail łącznie.
- Nowa bramka `porzadek-panel-punkty-absolutne-real-render-test.cjs` uruchomiona
  samodzielnie: **10/10 pass**. Bramka realnie bundluje `cityPanel.ts` przez esbuild i
  renderuje w headless Chromium (Playwright, fallback binarki
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) `renderSpoleczenstwo` oraz
  `buildPorzadekDetailCard` z realnymi danymi z `loadGameData()`. DOM po renderze
  zawiera dosłownie: `"Szczęście27%(9/35 pkt)"`, `"Prawo0%(0/47 pkt)"`, karta szczegółów
  `"Szczęście: 27% (9/35 pkt)"` / `"Prawo: 0% (0/47 pkt)"` — nowy tekst z liczbami
  punktów obok procentu widoczny bezpośrednio w DOM, zgodny co do znaku z liczbami
  zacytowanymi we wszystkich trzech poprzednich raportach (Operator/Evaluator/obrona).
  Bramka istnieje, uruchamia się i faktycznie pokazuje tekst z punktami w DOM —
  reguła przeciw samooszukiwaniu (żywy dowód, nie sam opis) spełniona.

WERYFIKACJA ZARZUTÓW (a-d z dyspozycji Final Control):
(a) `grep -n "state.porzadek\|orderPanel.ts:18\|Legacy pkt prawa"
    gra/src/ui/cityPanel.ts` — komentarze z obrony faktycznie obecne w OBU wskazanych
    miejscach: blok "Prawo" w `renderSpoleczenstwo` (L3323-3324, jawne odesłanie
    `orderPanel.ts:18` + odróżnienie od `state.porPct`) i wiersz "Prawo" w
    `buildPorzadekDetailCard` (L3421-3422, ta sama treść). Potwierdzone też treścią
    `orderPanel.ts:15-18`: pole `porzadek` faktycznie udokumentowane jako "Legacy pkt
    prawa / pole porzadek historyczne", `porPct` osobno jako "Procent Porządku łączny" —
    zarzut 1 był merytorycznie trafny, poprawka go adresuje dokładnie w miejscu ryzyka.
(b) `git diff --stat 5fa61be3 HEAD` — WYŁĄCZNIE pliki z allowlisty (patrz wyżej),
    `society-breakdown.ts` z zerowym diffem — potwierdzone bezpośrednio, nie na słowo.
(c) Wszystkie 6 bramek (5 istniejących + nowa real-render) uruchomione samodzielnie w
    tej sesji, wyniki identyczne z raportami. `tsc --noEmit` czyste. Real-render
    Playwright istnieje, uruchamia się i pokazuje tekst z punktami w DOM — zweryfikowane
    bezpośrednio z outputu bramki, nie z samego opisu.
(d) Pełny `git diff 5fa61be3 HEAD -- gra/src/ui/cityPanel.ts gra/src/ui/orderPanel.ts`
    przejrzany w całości: `orderPanel.ts` — wyłącznie 2 nowe opcjonalne pola interfejsu
    (`szMax?`, `prawMax?`) z komentarzem, zero logiki. `cityPanel.ts` —
    `computeOrderStateLocal`/`resolveOrderState` wyłącznie PRZEPISUJĄ już policzone
    `ordPct.sz.szMax`/`ordPct.prawo.prawMax` (silnik, `society-breakdown.ts`, nietknięty)
    do stanu UI; `appendW4PctMetricBlock` dostaje nowy opcjonalny parametr
    `pointsLabel` wyłącznie do wyświetlenia obok istniejącego `Math.round(pct)}%`;
    `buildPorzadekDetailCard` wyłącznie dokleja tekst do istniejącego wiersza gridu.
    Żadna linia nie zmienia wagi, mianownika, sposobu liczenia `%`, `netto` ani
    zaokrąglenia procentu w silniku. Oba zarzuty Evaluatora dotyczą wyłącznie
    czytelności/spójności PREZENTACJI już policzonych liczb, nie ukrywają zmiany
    formuły Szczęścia/Prawa/Porządku.

OCENA ZARZUTU 2 (rdzeń sporu): `pctFromNetto` w `society-breakdown.ts:503-506`
(`clampPct(100 * netto / m, cap)`, precyzja zaokrąglenia 0.1) liczy `%` z SUROWEGO
`netto/max`, całkowicie niezależnie od tego, że wyświetlane w UI netto/max są osobno
zaokrąglane do liczb całkowitych (`Math.round`) w `cityPanel.ts`. To jest strukturalna
własność trzech niezależnie zaokrąglonych liczb, potwierdzona bezpośrednim odczytem
kodu silnika (zero zmian w tym pliku w tym temacie — `git diff` = 0 linii). Powołany
precedens ("zarzut 6") sprawdzony w bazowym commicie `5fa61be3` PRZED tym tematem
(`git show 5fa61be3:gra/src/ui/cityPanel.ts | grep "zarzut 6"` → obecny na L2989/3299/3423
już w bazie) — a więc identyczny wzorzec "osobno zaokrąglony % obok osobno
zaokrąglonych liczb bezwzględnych" faktycznie istniał i był już zaakceptowany w tym
pliku PRZED tym tematem, nie jest wymysłem obrony post factum. Dyspozycja
(`00-dispatch.md` §FORMAT WYŚWIETLANIA) wprost zakazuje zmiany zaokrąglenia procentu —
naprawienie zarzutu 2 zmianą formuły łamałoby wprost tę barierę tematu. Zarzut trafny
jako obserwacja jakościowa, ale obrona wykazała dowodem z kodu (nie tylko słowem), że
(1) jest to zastany, przedtematowy wzorzec UI, i (2) jedyna naprawa zgodna z dyspozycją
byłaby zakazana przez samą dyspozycję — więc nie ma tu wykonalnego NAPRAW w granicach
tego tematu.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator → integracja allowlist-only (READY_FOR_DEPLOY do wystawienia
osobno przez orkiestratora po faktycznej integracji, nie przez Final Control).

WERDYKTY:
1 -> ODDAL. Obrona przyjęła zarzut i naprawiła go realną zmianą (komentarze w obu
    wskazanych miejscach, zweryfikowane grepem i odczytem treści) — zweryfikowane
    samodzielnie że poprawka faktycznie usuwa pułapkę nazewniczą wskazaną przez
    Evaluatora, bez zmiany logiki (diff commit obrony = wyłącznie 9 wstawionych linii
    komentarzy, potwierdzone `git diff 08d8d31c..c5008247`). Nic do naprawy w kolejnej
    rundzie.
2 -> ODDAL. Obrona obaliła zarzut dowodem z kodu: (i) dyspozycja wprost zakazuje zmiany
    zaokrąglenia procentu, (ii) rozbieżność jest strukturalnym artefaktem trzech
    niezależnie zaokrąglonych liczb w niezmienionym silniku (`society-breakdown.ts`,
    0 linii diff — potwierdzone), (iii) identyczny wzorzec zaokrągleń istniał w tym samym
    pliku PRZED tym tematem (weryfikacja w commicie bazowym `5fa61be3`, nie tylko
    twierdzenie obrony). Jedyna zgodna z dyspozycją "naprawa" (przeliczenie % z
    zaokrąglonych pkt) byłaby mniej precyzyjna i złamałaby jawny zakaz dyspozycji.

DEPLOY/PUSH: NIE WYKONANO
