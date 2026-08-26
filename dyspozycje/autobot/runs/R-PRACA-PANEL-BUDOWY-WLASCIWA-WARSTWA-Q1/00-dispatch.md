# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`
GOAL: W panelu trybu budowy (`.civ-build-panel`, sekcja ulepszeń terenu) **usunąć zdublowany
blok podziału Pracy warstwy (a)** i **udostępnić w tym miejscu sterowanie warstwą (c)** —
ile ze skumulowanej puli ulepszeń idzie na pracę AUTOMATYCZNĄ, a ile zostaje na ręczną.

## Wyzwalacz — ECHO właściciela (dosłownie)

> „system źle identyfikuje parametr, ile ma być automatycznie rozdzielane pracy. W tym
> miejscu podział pracy nie jest potrzebny, bo jest dublowany już w pool imperium, więc
> usunąłbym tutaj te wskaźniki, które zaznaczę. W tym miejscu tylko powinno się wskazywać,
> czy ma być ręczna budowa, czy automatyczna, i ile z automatycznej, czyli z puli imperium
> na ulepszenia, ma iść do automatycznej pracy, a ile ma być zostawione w puli na inne
> prace ręczne."

Zrzut właściciela pokazuje blok „Podział Pracy: Budynki / Ulepszenia (pula) — 50%
Ulepszenia (pula) / 50% Budynki" ze suwakiem „Ulepszenia (pula imperium) (0–50%)".

## USTALENIA RECONU — traktuj jako fakty, nie zgaduj ich ponownie

**Właściciel ma rację co do duplikatu.** `buildModeHud.ts:364-392` (`renderEmpirePracaSplit`,
wstawiany w `:562-563`) i `empireDetailPanel.ts:1304-1377` (`renderEmpirePracaBudgetSplitSection`)
**czytają i piszą DOKŁADNIE to samo pole** — `ownerDefaultPodzialPracy` (owner 0) →
`CityPodzialPracy.procentBudynki`. Ten sam suwak, ten sam zakres `0–MAX_PROCENT_PULI_IMPERIUM`,
ten sam tekst opisu.

**Przyczyna wrażenia „system źle identyfikuje parametr":** sterowanie warstwą (c) **ISTNIEJE**
w tym samym panelu — `buildModeHud.ts:570-587` („Globalny budżet automatu:",
`data-ulepszenia-empire-percent`) i `:623-638` („Lokalny budżet automatu:") — ale jest
renderowane **wyłącznie gdy `tryb === 'auto'`** (warunki w `:570` i `:613`, `:623`).
Domyślnym trybem nowej gry jest `'reczny'` (`cities.ts:203`). **Więc na starcie właściciel
widzi w tym miejscu tylko zdublowaną warstwę (a), a właściwej warstwy (c) nie widzi wcale.**
To jest sedno defektu: nie brak funkcji, tylko pokazanie złej i ukrycie właściwej.

**Trzy warstwy (mapa, żeby NIE POWTÓRZYĆ pomyłki z tej serii):**
- **(a)** `CityPodzialPracy.procentBudynki` — podział Pracy miasta: budynki vs pula imperium.
  Zakres puli 0–50% (`MAX_PROCENT_PULI_IMPERIUM`). UI: `empireDetailPanel.ts:1304-1377`
  (globalnie), `cityPanel.ts:4876-4952` (per miasto) — **i zdublowany w `buildModeHud`,
  ten trzeci egzemplarz idzie do usunięcia.**
- **(b)** podział puli na ulepszenia vs budżet budowy imperium — **NIE ISTNIEJE**, usunięty
  w `R-PRACA-JEDEN-PODZIAL-Q1`. Nagrobki: `cities.ts:236-247`, `production.ts:1891-1898`.
- **(c)** `UlepszeniaEmpirePolicy.pracaAutoPercent` + `City.ulepszeniaPracaPercent` — tempo
  wydawania automatu, zakres **0–100%** (`MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`), domyślnie 33.
  Logika: `auto-improvements.ts:261-320` (`imperiumBudgetCap = pracaBudgetPercent% ×
  SKUMULOWANA pula`). **To jest warstwa, o którą prosi właściciel.**

## ZADANIE — trzy rzeczy, wszystkie w `buildModeHud.ts`

1. **Usunąć zdublowany blok warstwy (a)**: `renderEmpirePracaSplit` (`:364-392`), jego
   wstawienie (`:562-563`), handler suwaka (`:682-692`), CSS (`:294-298`) oraz — jeśli po
   usunięciu nic ich nie używa — pozycje kontraktu `getEmpirePracaSplit` /
   `onEmpirePracaSplitChange` (`:89-98`) i ich podpięcie w `main.ts:19352-19359`.
   **Warstwa (a) ma dalej działać w swoich dwóch prawowitych miejscach** (panel imperium
   i panel miasta) — to jest do udowodnienia, nie do założenia.

2. **Udostępnić warstwę (c) niezależnie od trybu.** Suwak budżetu automatu ma być widoczny
   **także przy `tryb === 'reczny'`** — wtedy w stanie nieaktywnym (`disabled`) z krótkim
   wyjaśnieniem, że działa po włączeniu automatyzacji. **Powód: dokładnie to ukrycie
   wywołało zgłoszenie.** Etykieta ma mówić wprost, czym ten procent jest — propozycja:
   „Z puli ulepszeń na pracę automatyczną" (reszta zostaje na ręczną). Sformułowanie
   Operator może poprawić, ale musi rozróżniać warstwę (c) od (a) bez czytania kodu.

3. **Naprawić mylące nazwy.** `getEmpirePracaSplit` / `onEmpirePracaSplitChange` sterują dziś
   warstwą (a), mimo że nazwa mówi o nieistniejącej (b). Jeśli po p.1 zostają — przemianować
   zgodnie z tym, co robią. Jeśli znikają — sprawdzić, czy nazwa nie żyje gdzie indziej.

**Znalezisko uboczne do naprawienia przy okazji (jest w allowliście):**
`buildModeHud.ts:691` — handler suwaka nadpisuje podsumowanie tekstem
`` `${pct}% ulepszenia / ${100 - pct}% budynki` `` (małe litery, bez `PODZIAL_PRACY_PULA_LBL`),
podczas gdy render początkowy `:383` daje „50% Ulepszenia (pula) / 50% Budynki" — napis
zmienia się po pierwszym ruchu suwakiem. Znika razem z blokiem, ale sprawdź, czy ten sam
wzorzec nie powtarza się w pozostających suwakach.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Ta seria ma **osiem fal nawrotów** na podziale Pracy i jedną udokumentowaną pomyłkę warstw
(właściciel: „prawdopodobnie cały czas mylisz te pozycje, dlatego wszystkie kolejne zmiany
cały czas robiły złe poprawki"). Dlatego:

- **ZAKAZ** raportowania czegokolwiek o „podziale Pracy" bez podania, o KTÓRĄ z warstw
  (a)/(b)/(c) chodzi, z nazwą pola. Zdanie bez tej kwalifikacji = raport do poprawy.
- **ZAKAZ** uznania p.2 za zrobiony bez **zrzutu z żywego Chromium przy `tryb: 'reczny'`**,
  pokazującego suwak warstwy (c) w panelu. Test na samym źródle tego nie dowodzi.
- **ZAKAZ** uznania p.1 za zrobiony bez dowodu, że warstwa (a) **nadal działa** w panelu
  imperium i w panelu miasta — pomiar zachowania, nie regex po źródle.
- Każda nowa/zmieniona asercja musi **czerwienieć po jednej celowanej mutacji źródła**.
  Asercja typu „regex po własnym źródle" jest tautologiczna i będzie odrzucona.

## BRAMKI, KTÓRE TA ZMIANA ZŁAMIE — zaktualizuj świadomie, nie obchodź

Recon wskazał, że literały tego bloku są przypięte w:
`praca-jeden-podzial-real-render-test.cjs` (`:152` `PODZIAL_PRACY_PULA_LBL_PELNA`, `:322-323`
nagłówek sekcji) · `praca-split-ui-test.cjs` (`:48`, `:117`) ·
`praca-jeden-podzial-kontrakt-test.cjs` (`:503-504`) ·
`praca-budmode-slider-max-real-render-test.cjs` (`:90`, `:107`, `:118`) ·
`build-panel-ulepszenia-scroll-real-render-test.cjs` (`:414-415`).
Dla każdej: **albo zaktualizuj asercję do nowego kontraktu z uzasadnieniem, albo wykaż,
że nie dotyczy.** Wyłączenie/usunięcie asercji bez uzasadnienia = FAIL.

## Kryteria sukcesu

1. Blok warstwy (a) **nie występuje** w panelu trybu budowy — dowód z żywego renderu.
2. Suwak warstwy (c) **jest widoczny przy `tryb: 'reczny'`** (nieaktywny) **i aktywny przy
   `tryb: 'auto'`** — dowód: dwa zrzuty z Chromium.
3. Warstwa (a) nadal działa w panelu imperium i panelu miasta — pomiar zachowania.
4. Zmiana suwaka (c) faktycznie zmienia budżet automatu: pomiar PRZED/PO na liczbach
   (np. pula 5 000, `pracaAutoPercent` 10% vs 50% → różna liczba ulepszeń w turze).
5. `tsc --noEmit` 0 błędów; **5 bramek referencyjnych** zielonych (logic 213/213,
   tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6); bramki tematów tej
   serii zielone (kontrakt 634/0, real-render 36/0, ai-zakup 44/0, scroll 43/0,
   dyplo 26/26, cap-migracja 11/0, zrzuty 61/0 — po aktualizacji tych, które ta zmiana dotyka).

## Izolacja

Gałąź `autobot/R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/ui/buildModeHud.ts` · `gra/src/main.ts` (wyłącznie podpięcie kontraktu
`:19352-19359`, jeśli p.1 tego wymaga) · `gra/tools/*` (aktualizacja bramek + nowa bramka
tematu) · raporty runu. **NIE ruszać** `gra/data/**`, `empireDetailPanel.ts`, `cityPanel.ts`
(tam warstwa (a) ma zostać nietknięta — to punkt odniesienia dowodu nr 3), `dyspozycje/WERSJE.md`,
`gra-robocza/**`.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. Zakaz `npm run build/dev`
(C-001: dozwolone `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`),
zakaz `npx`, zakaz `git add -A`. Commituj cząstkowe postępy w trakcie. Brak dowodu zgłaszaj
jako brak dowodu (§13a), nigdy jako zielone.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról** (temat wizualny + historia ośmiu
nawrotów, §5a). `opts.model` jawnie na KAŻDYM wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–5 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
