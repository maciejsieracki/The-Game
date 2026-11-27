# Cykl synchronizacji przycisku „Zakończ turę” — pomiar i przegląd (ENDPERF)

Temat: R-WEB-ENDTURN-SYNC-PERF-Q1 · baza: origin/main 6afdec814 (FALA 933, kod 00216ef8c) · data: 2026-11-27
Konfiguracja pomiaru: MAKSIMUM (Trudny, barbarzyńcy Trudny, dyplomacja trudna, kultura trudna, Wysoki ×4 ludność/koszt jednostek, Mała mapa, Kontynenty, Rzymianie, 2 rywali, 2 państwa-miasta).
Środowisko: kontener Linux bez GPU, Chromium headless (google-chrome), renderowanie programowe.

## 1. Co jest w kodzie (odczyt, bez zmian)

- `gra/src/ui/bottomBarHud.ts` ~l.319–331: `syncEndTurnState()` co 500 ms (`setInterval`, l.362) wywołuje `config.canEndTurn()` (= `canPlayerInitiateEndTurn()` w `main.ts` l.29561) i wywołuje `render()` tylko przy zmianie klucza `hidden|off|on`.
- `canPlayerInitiateEndTurn()` (`main.ts` l.43607) **zaczyna się od `healStaleEndTurnBlockers()`** — funkcji z efektami ubocznymi (kasowanie `aiCmdResume` itd.), a komentarz w l.43378 mówi, że jest już wołana z pętli HUD. Cykl więc dodaje wywołania tej funkcji z efektami ubocznymi co 500 ms, niezależnie od kliknięć gracza.
- Ta sama funkcja zawiera 10 wywołań `console.warn('[EndTurn] blocked: …')` (grep `main.ts`). Cykl wywołuje ją co 500 ms, więc **w stanie zablokowanym** (np. zablokowana tura) konsola dostaje do ~2 ostrzeżeń na sekundę. Ocena: wzorzec ryzyka, NIE ZMIERZONO w stanie zablokowanym (patrz §3).
- `activeEndTurnPointers` (`bottomBarHud.ts` l.190, 198, 340–344): pointerdown na `[data-end]` dodaje `pointerId`; usuwa go wyłącznie `pointerup`/`pointercancel` na `document` (capture). Gdy zbiór jest niepusty, `render()` jest odkładany (`renderPending`) i `syncEndTurnState()` wychodzi wcześniej.

## 2. Pomiar na żywo (co zmierzono)

Skrypt: `gra/tools/endturn-perf-probe.cjs` (nowy, poza `gra/src`). Start: nowa gra z konfiguracją MAKSIMUM, czekanie na `[ClusterStart]` i pierwsze miasto, zamknięcie ekranu powitalnego. Tura kończona prawdziwym kliknięciem myszy (`page.mouse.click`) na `[data-end]`, modale zamykane haczykami odczytu jak w `endturn-aria-probe.cjs`.

| Ziarno | Tura | Czas `gateInfo()` (zawiera `canPlayerInitiateEndTurn`), n=200: mediana / p95 / max [ms] | canEnd | Konsola w oknie 30 s (warn/error/log) | Klatki rAF (10 s): mediana / p95 [ms] |
|---|---|---|---|---|---|
| 4242 | 1 | 0 / 0 / 0,1 (przebiegi 2 i 3; przebieg 1: max 3,5) | true | 0 / 0 / 0 (ani jeden wpis) | 467 / 617 (n=22) |
| 7 | 1 | 0 / 0 / 3,8 | true | 0 / 0 / 0 | 550 / 883 (n=18) |

Uwagi do tabeli (uczciwie):
- **Czas canEndTurn:** `performance.now()` w Chromium ma rozdzielczość ~100 µs (poniżej tej wartości mediana wychodzi 0). Pomiar jest wyłącznie `gateInfo()` (większy zakres niż sam `canPlayerInitiateEndTurn`), bez oddzielnego hooka na samą funkcję. Wniosek: koszt pojedynczego wywołania w stanie „tura możliwa” jest rzędu ≤0,1 ms (max pojedynczych wywołań 3,8 ms, najpewniej pierwsze wywołanie/GC). Przy 2 wywołaniach na sekundę to narzut rzędu mikrosekund na sekundę. **Kosztu cyklu nie da się uznać za problem wydajnościowy na tym pomiarze.**
- **Liczba wywołań w 10 s (≈20):** NIE ZMIERZONO — nie dodano licznika bez zmiany `gra/src` (zakaz haków zmieniających stan; licznik w kodzie byłby zmianą gry). Interwał 500 ms jest stały w kodzie (`setInterval(…, 500)`).
- **Klatki rAF:** środowisko renderuje ~2 klatki/s (mediana 470–550 ms na pustej grze t1). Przy tej klatce nie da się wyodrębnić narzutu cyklu z szumu; porównanie z cyklem zatrzymanym i z buildem bazowym 32b3f1718 NIE ZMIERZONO (brak sprzętowego renderu; zatrzymanie cyklu wymagałoby zmiany kodu). Wniosek dla wydajności klatki: NIE ZMIERZONO na sprzęcie gracza.
- **Konsola:** w t1 (tura możliwa) przy cyklu: 0 wpisów warn/error/log w 30 s. Spam ewentualny występuje wyłącznie w stanie zablokowanym — NIE ZMIERZONO (nie udało się wywołać stanu zablokowanego w tym biegu, patrz §3).
- Pomiary t30 i t60 oraz ziarno 7 dla t30/t60: **NIE ZMIERZONO** (patrz §3).

## 3. Przebieg tury i stabilność harnessu (ważne dla kolejnych tematów)

- Przy pasywnym kończeniu tur kliknięciem na żywo kliknięcie w t1→t2 bywało skuteczne, a w kolejnych przebiegach tura nie zmieniała się w ciągu 120–240 s, mimo że przycisk był włączony (`aria-disabled=false`, `canEnd=true`, `gateBlok=false`, brak bitwy i brak modali). `document.elementFromPoint` w miejscu kliku zwracało `SPAN` wewnątrz `[data-end]`, więc trafienie było poprawne.
- Zaobserwowane w trzech przebiegach wieloturowych (ziarno 4242, checkpoint 1,30): przejście t1→t2 zawsze OK, a przejście t2→t3 nie zmieniało tury mimo włączonego przycisku (diagnoza: aria=false, canEnd=true, brak bitwy). Przebieg z samym checkpointem 2 przeszedł t1→t2 poprawnie. Przyczyna NIE ROZSTRZYGNIĘTA: może to być artefakt harnessu (klik w trakcie fazy AI przy ~2 klatkach/s), może to ścieżka „przycisk włączony, klik bez efektu”. Do rozstrzygnięcia w osobnym temacie (patrz §5, UWAGI).
- Efekt: nie udało się przejść do t30 i t60 w limicie czasu sesji. Wynik pomiaru tur 30/60 jest NIE ZMIERZONO.

## 4. Punkty z dispatchu

1. **Wydajność:** częściowo zmierzone (t1, 2 ziarna; §2). Koszt wywołania ≤0,1 ms typowo, max 3,8 ms. Pełna tabela t1/t30/t60 × 2 ziarna: NIE ZMIERZONO w t30/t60.
2. **Konsola:** w stanie możliwej tury 0 wpisów/30 s. Stan zablokowany NIE ZMIERZONO; kod (10 `console.warn` w `canPlayerInitiateEndTurn`, wywołania co 500 ms) wskazuje na ryzyko kilku–kilkudziesięciu wpisów na minutę w stanie zablokowanym. Limit „≤ kilka wpisów” nie jest potwierdzony ani obalony.
3. **activeEndTurnPointers (kod, bez odtworzenia):** zbiór usuwa wpis tylko `pointerup`/`pointercancel` na `document`. Jeśli zdarzenie zwolnienia nie dotrze (np. utrata fokusu okna w trakcie przytrzymania), wskaźnik zostaje w zbiorze: `syncEndTurnState()` przestaje działać, a `render()` jest odkładany. Skutek: zawieszony stan przycisku i reszty paska, aż do następnego `pointerup` (mysz ma stały `pointerId`, więc każde następne zwolnienie myszy czyści zbiór). Odtworzenie prawdziwymi zdarzeniami (mousedown na przycisku, mouseup poza oknem) NIE ZMIERZONO — brak czasu w tej sesji. Ocena: ryzyko samonaprawiające się; wymaga testu live.
4. **Odwrotny przypadek (aria=true, canEnd=false):** NIE ZMIERZONO. Tabela tura × (aria, canEnd, skutek kliku) nie powstała (brak tury zablokowanej w biegach).
5. **Wniosek wstępny:** cykl jest akceptowalny kosztowo (µs/s na pomiarze), ale ma dwa ryzyka do zamknięcia: (a) `healStaleEndTurnBlockers()` i ostrzeżenia `[EndTurn] blocked` wywoływane co 500 ms także poza kliknięciem gracza, (b) konsola w stanie zablokowanym. Brak dowodu na błąd poprawności przycisku. **Żadnej poprawki kodu nie wdrażano** (dispatch: tylko po odtworzeniu problemu).
6. **Otwarte w harnessie:** niestabilne kliknięcie „Zakończ turę” w t2+ mimo włączonego przycisku (§3) — do zbadania przed kolejnymi pomiarami na żywo.

## 5. UWAGI-DLA-ORKIESTRATORA

- Dla pomiarów t30/t60 potrzebny jest osobny temat harnessu: deterministyczne kliknięcie końca tury (np. ponowienie kliku po 20 s przy niezmienionej turze, z odczytem `pendingEndTurn`/fazy AI), bez zmiany gry.
- Cykl 500 ms wywołuje `healStaleEndTurnBlockers()` poza gestem gracza. To warto ocenić w osobnym przeglądzie (zakres: `main.ts` l.43378–43400, l.43607), nie jako poprawkę w tym temacie.
- Zalecany pomiar w stanie zablokowanym (np. wymuszona bitwa AI przed końcem tury) z licznikiem `console.warn` w oknie 30 s.
- Narzędzie `gra/tools/endturn-perf-probe.cjs` jest gotowe do użycia z argumentami `<katalog_poza_repo> <seed> <tury>`; przebieg t1 trwa ~1 min; przebieg do t2 wymaga poprawki klikania (§3).

## 6. Bramki (surowe wyniki)

- `npm ci --ignore-scripts`: exit 0.
- `npx tsc --noEmit`: exit 0.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`.
- `node tools/endturn-aria-sync-test.cjs`: `Wynik: 5 PASS / 0 FAIL`.
- Pozostałe testy z listy zmiany `gra/src` (tech-tree, research, unit-replace, combat, society-breakdown, ai-city-order-need-wiring): NIE URUCHOMIONO — brak zmian w `gra/src` w tym temacie.

## 7. Podsumowanie

Pomiar ograniczony do t1 na dwóch ziarnach w konfiguracji maksimum. Cykl 500 ms nie dał mierzalnego kosztu w wywołaniu bramki tury. Nie zmierzono: t30/t60, stanu zablokowanego (konsola), odwrotnego przypadku (aria/canEnd), zawieszonego wskaźnika pointer. Zidentyfikowane ryzyka kodowe i niestabilność klikania w t2+ wymagają osobnych tematów.
