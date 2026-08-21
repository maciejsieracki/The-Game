STATUS: PASS-WITH-NOTES
TEMAT: R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1
GOAL: kliknięcie wiersza technologii w panelu „Badania" (scienceHubHud.ts, sekcje
„MOŻESZ WYBRAĆ"/„WKRÓTCE") ma DODAWAĆ technologię do planu badań (onSelectTech)
BEZPOŚREDNIO zamiast otwierać kartę podglądu; podgląd karty ma być dostępny przez
osobny, wyraźnie oznaczony element (baner/przycisk „Karta"), niezależny od kliknięcia
wiersza.

## ZMIANY/COMMIT

Plik: `gra/src/ui/scienceHubHud.ts`, funkcja `buildEntryRow()` wewnątrz `render()`.
Brak commitu wykonanego przez Operatora (zgodnie z barierą: Operator nie integruje/nie
pushuje) — zmiany zostawione w working tree tego brancha, gotowe do przejęcia przez
Evaluatora/Final Control/integrację. Branch: `autobot/R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1`,
bazowy commit `45b030cc` (dispatch), bez nowych commitów.

Zakres zmian w `buildEntryRow()`:

1. **Klik wiersza odblokowanego** (`!lockedRow && canEnqueue`) woła teraz
   `config.onSelectTech(e.id)` BEZPOŚREDNIO (nowa funkcja `rowActivate()`), zamiast
   zawsze wołać `act()` (podgląd karty). To przywraca zachowanie sprzed „trybu
   podglądu" zgodnie z żądaniem właściciela.
2. **Klik wiersza zablokowanego** (`lockedRow`) — bez zmiany zachowania: nadal woła
   `act()` (podgląd karty / wymagań), bo nie da się dodać zablokowanej technologii do
   planu. To dokładnie rozróżnienie, o które prosił dispatch (`lockedRow ? undefined :
   ...` przy `onStartResearch` już istniało — zachowane).
3. **Ikonka „ⓘ" (`sh-info-ic`) zastąpiona wyraźnym przyciskiem z tekstem „Karta"**
   (`sh-card-btn`, `<button>` z `textContent = 'Karta'`), umieszczonym w nowym
   kontenerze bocznym `sh-item-side` (prawa strona wiersza, jak w zgłoszeniu
   właściciela — „malutki przycisk po prawej stronie"). Przycisk woła TĘ SAMĄ funkcję
   `act()` co dawniej ikonka, z `stopPropagation()`, więc nie wywołuje `rowActivate()`
   wiersza. Obsługa klawiatury (Enter/Spacja) zachowana analogicznie do starej ikonki.
4. Odznaka pozycji w planie (`sh-num-badge`) i wizualny badge „+ PLAN" (dekoracyjny,
   podpowiadający że klik wiersza doda do planu) przeniesione do tego samego kontenera
   `sh-item-side` co przycisk „Karta" (pionowy układ po prawej) — bez zmiany logiki,
   tylko układu DOM/CSS.
5. Zaktualizowany tekst podpowiedzi (`sh-hint`) pod listą, opisujący nowe zachowanie
   („Klik odblokowanej technologii = dodaj do planu badań. Przycisk „Karta" = podgląd
   karty technologii.").
6. CSS: usunięto `.sh-info-ic` (absolutna ikonka na okrągłej ikonie techu), dodano
   `.sh-item-side` (flex kolumna po prawej stronie wiersza) i `.sh-card-btn` (mały,
   ale czytelny przycisk tekstowy ze stylem spójnym z resztą hudu).

## Punkt 2 dyspozycji — `techTreeView.ts` (BEZ ZMIAN, jawnie zanotowane)

Sprawdzono `bindViewportInteractions()` (klik na węzeł `.civ-ttv-tn`, linie ~934-981)
oraz `tryStartResearch()`/`openConfirm()` (linie ~813-858). Model interakcji jest
INNY niż w hubie i NIE ma tego samego problemu w sensie zgłoszenia właściciela:

- Klik na węzeł drzewka ZAWSZE woła `openTechPreview(node, st)`, która otwiera kartę
  podglądu (`showTechDiscoveryNotice(kind:'preview', onStartResearch: st === 'av' ?
  () => tryStartResearch(node) : undefined, ...)`). Faktyczne rozpoczęcie badania
  (`cfg.onStartResearch?.(node.id)`) następuje DOPIERO gdy użytkownik kliknie przycisk
  wewnątrz otwartej karty (`tryStartResearch` → ewentualnie `openConfirm()` z
  przyciskiem „Rozpocznij badanie", albo bezpośrednio `cfg.onStartResearch`).
- To zachowanie NIE zostało wprowadzone przez T2 (ikonka info) — sam klik węzła
  (poza `.ttv-info-ic`) już wcześniej zawsze otwierał kartę; ikonka info tylko
  dodała `stopPropagation()` + tę samą akcję z osobnej, mniejszej strefy klikalnej
  (identyczny wzorzec jak w hubie przed tą naprawą).
- Zgłoszenie właściciela (2026-08-21) dotyczy WYŁĄCZNIE lewego panelu „Badania"
  (scienceHubHud.ts) — właściciel jawnie porównuje do „poprzedniego sposobu wybierania
  z listy badań z menu po lewej stronie", nie do widoku pełnego drzewka.
- Uzasadnienie merytoryczne (zgodne z sugestią dispatcha): drzewko pokazuje pełny graf
  zależności międzytechnologicznych i epok — klik-na-węzeł=od razu enqueue byłby
  ryzykowny UX-owo (łatwo trafić w sąsiedni węzeł przy dużym zoomie/gęstym grafie;
  karta pokazuje wymagania/koszt/epokę przed potwierdzeniem, a przy zmianie aktywnego
  celu dodatkowo pyta o potwierdzenie przez `openConfirm()`). To wygląda na świadomy,
  inny model interakcji niż lista w hubie, a nie regres.
- Decyzja: NIE zmieniono `techTreeView.ts`, zgodnie z instrukcją dispatcha „jeśli inny
  [model], NIE zmieniaj bez jawnego zanotowania w raporcie dlaczego" — powyższe jest
  tym zanotowaniem. `ttv-info-ic` pozostawiona bez zmian (nie było zgłoszenia
  właściciela dotyczącego tego widoku).

## Poza zakresem — NIE zmieniono (zgodnie z ograniczeniami dispatcha)

- `showTechDiscoveryNotice` / `technologyAdapter.ts` — brak zmian.
- `main.ts` (`onSelectTech`/`enqueueOrSetPlayerResearchSlug`) — brak zmian.
- Panel „Plan badań" (`renderPlanPanel()`, klik na już-zakolejkowaną pozycję nadal
  otwiera kartę podglądu) — poza zakresem dispatcha (dotyczy tylko sekcji „MOŻESZ
  WYBRAĆ"/„WKRÓTCE"), pozostawiony bez zmian.
- Animacja/potwierdzenie wizualne przy dodaniu do planu (np. podświetlenie badge
  „+ PLAN") — dispatch pozwalał pominąć jako zbyt duże UX poza zakresem; zrobiono
  najprostszą wersję (bezpośrednie wywołanie `onSelectTech`, bez dodatkowej animacji).
  Odznaka pozycji w planie (`sh-num-badge`) i tak pojawia się natychmiast po re-renderze
  hudu (wywoływanym przez wywołującego `onSelectTech` w main.ts), więc feedback
  wizualny istnieje pośrednio.

## TESTY

- `cd gra && npx tsc --noEmit` — jedyny błąd to preistniejący `TS5101` (deprecated
  `baseUrl` w `tsconfig.json`), potwierdzony identyczny PRZED zmianą (`git stash` +
  ponowne uruchomienie) — nie związany ze zmianą, zero błędów w zmienionym pliku.
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir dist
  --emptyOutDir` (z `gra/`) — SUKCES (`✓ 844 modules transformed`, `✓ built in 27.98s`).
  Uwaga: worktree nie miał własnego `node_modules` (świeży `git worktree`) — na czas
  builda/testów utworzono TYMCZASOWY symlink `gra/node_modules -> ../../gra/node_modules`
  (główne repo), usunięty zaraz po testach; nie wchodzi do commitu (`git status`
  potwierdza tylko `M gra/src/ui/scienceHubHud.ts`).
- `node gra/tools/science-hub-test.cjs` — 5 pass, 2 fail. Oba fail (`engine
  available=4 (>=5)`, `hub unlocked=4 (>=5)`) potwierdzone jako PREISTNIEJĄCE —
  identyczny wynik przy `git stash` (kod sprzed zmiany), więc niezwiązane z tym
  tematem (dotyczą liczby dostępnych technologii w danych startowych/silniku, nie
  logiki kliknięcia).
- `node gra/tools/tech-tree-test.cjs` — 19 pass, 0 fail (potwierdza brak regresu w
  `techTreeView.ts`, którego nie dotknięto).
- Brak dedykowanego testu jednostkowego na klik wiersza w `scienceHubHud.ts` w
  istniejącym zestawie `tools/*-test.cjs` (weryfikacja jest głównie wizualna/manualna
  dla tego pliku) — zmiana zweryfikowana czytaniem kodu + buildem + istniejącymi
  testami danych (science-hub-test.cjs, tech-tree-test.cjs).

## BLOKADY

Brak blokad technicznych. Uwaga proceduralna: worktree nie miał `node_modules` — jeśli
kolejne etapy (Evaluator/Final Control) też pracują w świeżych worktree, będą
potrzebować analogicznego tymczasowego symlinku (lub `npm ci`) do uruchomienia builda/
testów — nie jest to część allowlisty tego tematu, tylko środowiskowy fakt worktree.

## NASTĘPNY KROK

Przekazanie do Evaluatora (GPT-5.6 Luna High) do weryfikacji zgodności z GOAL i
kryteriami dispatcha, następnie Final Control, następnie integracja orkiestratora.

## DEPLOY/PUSH: NIE WYKONANO
