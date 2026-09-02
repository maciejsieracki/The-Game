TEMAT:  R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (UI negocjacji, R-PROC-AUTOBOT.md
§5a) — Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final
Control Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, zrzut stołu negocjacji (obie strony "Traktat handlowy",
"wygasa za 5 tur"): "Widzę, że traktat handlowy jest tylko na pięć tur.
Powinniśmy mieć możliwość ustanawiania długości traktatu tak samo w
negocjacjach, jak przy umowie o pakt nieagresji."

## RECON (wykonany, nie powtarzaj — jeden punkt WYMAGA żywej weryfikacji)

**Pakt nieagresji ma już pełny wybór czasu w UI:** `diplomacyAudience.ts`
routuje akcję `nap` (i inne wymagające negocjacji) przez
`showNegotiationModal` (linie 2195-2206), która renderuje (`diplomacyNegotiationModal.ts:260-271`)
chipy szybkiego wyboru + pole ręczne `numInput('cdn-turns', 'Ręcznie (10–20
lub 0 = bezterminowy)', 15, 0, 20)` + chip "Bezterminowy" (`data-turns="0"`).
Silnik (`diplomacy-proposals.ts`, `resolveNapDealExpiry`) poprawnie
obsługuje zarówno terminowy (10-20 tur) jak i bezterminowy (`turns=0` →
`wygasaTura=null`) pakt.

**Traktat handlowy (`umowa_szlakow`, akcja `aid==='5'`) OMIJA ten modal
całkowicie i ma zahardkodowany czas:** `diplomacyAudience.ts:2189-2193`:
```
if (aid === '5' && negCtx) {
  ...
  // D-DYPLO-KOSZYK-OD-RAZU: traktat handlowy od razu na stół ("My oferujemy"), bez modala potwierdzenia.
  cfg!.onAction(cfg!.ownerId, '5', { actionId: '5', turns: 20 });
  return;
}
```
Gracz NIE dostaje żadnej możliwości wyboru — propozycja ląduje na stole z
`turns: 20` na sztywno, bez modala, bez chipów, bez pola ręcznego. Silnik
(`diplomacy-proposals.ts:1325`, case `umowa_szlakow`) SAM W SOBIE już
obsługuje elastyczny czas (`payload.turns != null ? ctx.turn +
clampDealTurns(payload.turns) : null` — czyli technicznie wspiera nawet
bezterminowy traktat, gdyby `payload.turns` było `null`/`undefined`) —
ograniczenie jest WYŁĄCZNIE w warstwie UI, nie w silniku.

**NIEPOTWIERDZONE — wymaga żywej weryfikacji przez Operatora:** zrzut
właściciela pokazuje "wygasa za 5 tur", nie 20 (wartość zahardkodowana w
`diplomacyAudience.ts:2192`). Możliwe wyjaśnienia do sprawdzenia PRZED
zmianą kodu: (a) inna, nieznaleziona w tym recon ścieżka (np. kontrpropozycja
AI, edycja przez gracza) ustawia inną wartość; (b) `clampDealTurns` gdzieś
po drodze przycina wartość inaczej niż oczekiwano; (c) to inny typ umowy
wizualnie podobny. Operator MA znaleźć i nazwać dokładną przyczynę
rozbieżności 20 vs 5 jako część Kroku 1 (żywa reprodukcja), nie zakładać z
góry, że wystarczy poprawić widoczną linię 2192.

## GOAL
Krok 1 (obowiązkowy PRZED zmianą kodu): żywo zreprodukuj DOKŁADNY stan ze
zrzutu właściciela (traktat handlowy na stole, "wygasa za 5 tur") i ustal,
skąd bierze się wartość 5 (patrz RECON, punkt NIEPOTWIERDZONY).

Krok 2: usuń bypass w `diplomacyAudience.ts` dla `aid==='5'` — przekieruj
akcję `umowa_szlakow` przez TEN SAM `showNegotiationModal`, którego już
używa `nap`, z tym samym mechanizmem wyboru czasu (chipy + pole ręczne +
opcja "Bezterminowy"). Zakres dozwolonych wartości może być identyczny jak
dla NAP (10-20 tur lub bezterminowy) — chyba że recon Kroku 1 ujawni inny,
uzasadniony zakres specyficzny dla handlu (np. istniejący
`clampDealTurns` 1-20 w silniku, patrz `diplomacy-proposals.ts:388-389`
komentarz "Czas trwałej umowy handlowej: 1–20 tur") — w takim wypadku
dopasuj widełki modala do REALNEGO ograniczenia silnika, udokumentuj
wybór w raporcie. Zero zmian w silniku (`diplomacy-proposals.ts`) chyba że
Krok 1 wykaże że silnik TEŻ wymaga poprawki dla obsługi bezterminowego
traktatu szlaków (dziś technicznie wspiera `turns=null`→bezterminowy, ale
zweryfikuj żywo, nie zakładaj z czytania kodu).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy zrzut PRZED (`page.screenshot()`, żywe Chromium): kliknięcie akcji
   "Traktat handlowy" ląduje na stole BEZ modala, z czasem zahardkodowanym
   (dzisiejsze zachowanie) — potwierdzone też źródło rozbieżności 20 vs 5
   ze zrzutu właściciela (RECON, punkt NIEPOTWIERDZONY).
2. Żywy zrzut PO: kliknięcie "Traktat handlowy" otwiera TEN SAM modal co
   pakt nieagresji, z chipami czasu + polem ręcznym + opcją "Bezterminowy"
   (albo udokumentowanym, uzasadnionym węższym zakresem, jeśli Krok 1 tak
   wykaże).
3. Żywy dowód: wybór konkretnej liczby tur w modalu (np. 10) skutkuje
   propozycją na stole z DOKŁADNIE tą liczbą tur (nie zahardkodowaną
   wartością).
4. Żywy dowód: opcja "Bezterminowy" (jeśli w zakresie) daje traktat bez
   wygaśnięcia — sprawdzone zarówno w UI (brak licznika "wygasa za...")
   jak i w silniku (`wygasaTura === null` w faktycznie zawartym deal-u).
5. Żywy dowód braku regresu: pakt nieagresji (`aid` dla `nap`) i inne akcje
   przechodzące przez `showNegotiationModal` (sojusz, trybut) działają
   identycznie jak dziś — modal, chipy, zakresy niezmienione.
6. Diff ograniczony do `diplomacyAudience.ts` (+ WYŁĄCZNIE jeśli Krok 1
   wykaże realną potrzebę, wąska poprawka w `diplomacy-proposals.ts` dla
   obsługi bezterminowego `umowa_szlakow` — udokumentowana, nie zgadywana)
   + nowy/rozszerzony test w `gra/tools/`.
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy negocjacji/handlu w `gra/tools/` (znajdź po nazwie,
   np. `*negotiation*`, `*trade-basket*`, `*audience*`) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/ui/diplomacyAudience.ts` (WYŁĄCZNIE gałąź `aid==='5'` i, jeśli
potrzebne, drobne dostosowanie wywołania `showNegotiationModal` dla tej
akcji), `gra/src/ui/diplomacyNegotiationModal.ts` (WYŁĄCZNIE jeśli akcja
`umowa_szlakow` wymaga własnego wariantu widełek czasu różnego od `nap` —
uzasadnij), `gra/src/game/diplomacy-proposals.ts` (WYŁĄCZNIE jeśli Krok 1
wykaże realną potrzebę wsparcia bezterminowego `umowa_szlakow` — dziś
prawdopodobnie już działa, zweryfikuj zamiast zakładać), nowy/rozszerzony
plik testowy w `gra/tools/`. Zakazane bezwzględnie: `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK kryterium wizualnego za
spełnione bez realnego zrzutu z żywego Chromium. Zakaz zakładania, że
poprawka jednej linii (`turns: 20` → routing przez modal) automatycznie
naprawia rozbieżność 20 vs 5 ze zrzutu właściciela — ustal PRAWDZIWĄ
przyczynę tej konkretnej liczby najpierw. Zakaz zakładania bez weryfikacji,
że silnik już poprawnie obsługuje bezterminowy `umowa_szlakow` — sprawdź
żywym wywołaniem, nie samym czytaniem kodu.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Opus 5) → Evaluator (Opus 5, zarzuty, lista może być pusta) →
Operator (Obrona, Opus 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
