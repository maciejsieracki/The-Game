TEMAT: P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (UI wizualne / regres CSS)
ŚCIEŻKA: gra/src/ui/sidePanelHud.ts (WYŁĄCZNIE karta blokująca „Wymaga decyzji" —
CSS `.sp-blocking.sp-expanded`/`.sp-action-bar` i sekcja renderowania jej stopki
akcji, linie ~266-300, ~666-699, ~750-760, ~809-843)
MODEL+EFFORT: claude-opus-5, effort medium (Operator) / claude-opus-5, effort high
(Evaluator) — temat wizualny/regres CSS, R-PROC-AUTOBOT.md §9 punkt 6b. Final
Control zostaje Sonnet 5, effort high jak w regule bazowej.

WYZWALACZ (zgłoszenie właściciela, 2026-09-04, ze zrzutem panelu bocznego —
karta „Wymaga decyzji" z przyciskiem „OTWÓRZ →")
"Ta opcja zamknięcia czy odsunięcia na później decyzji dyplomatycznej niestety
jest zakryta i nie da się jej włączyć. Coś się popsuło. Lepszy byłby krzyżyk w
górnym rogu, żeby można było to po prostu wyłączyć."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu i
historii commitów, nie powtarzaj, buduj na tym)
To REALNY REGRES z 2026-09-03, nie element który nigdy nie działał.
`.sp-blocking.sp-expanded` (`sidePanelHud.ts:266-270`) ma `overflow:hidden` od
2026-08-20 (commit `834051475`) — bez problemu, dopóki karta miała JEDEN
przycisk akcji („Otwórz →", ewentualnie „Zignoruj" dla buntu). Commit `5cbe910c`
(2026-09-03, „P-DYPLO-KARTA-DECYZJI-DISMISS-Q1") dodał DRUGI przycisk „Odłóż na
później" (`data-sp-ignore`, linia ~689, gated przez `isDeferrableDiploEvent()`
linie 437-448) do `.sp-action-bar`, BEZ zmiany CSS — pierwszy przypadek
dwuprzyciskowej stopki tej karty. Mechanizm ucięcia: karta jest elementem flex
w kolumnie wewnątrz `.sp-scroll` (`display:flex;flex-direction:column;gap:8px;
max-height:100%`, linie 167-188, ma `overflow-y:auto`). Zgodnie ze specyfikacją
CSS Flexbox: domyślne automatyczne `min-height` elementu flex w kolumnie
odpowiada wysokości jego treści (`min-height:auto`), CHYBA że element ma
`overflow` inny niż `visible` — wtedy automatyczne minimum spada do `0`.
`overflow:hidden` na `.sp-blocking.sp-expanded` znosi więc ochronę przed
skurczeniem karty poniżej wysokości treści: gdy zabrakło miejsca po dodaniu
drugiego przycisku, przeglądarka KURCZY samą kartę zamiast przewinąć
`.sp-scroll` — obcinając dokładnie dolną krawędź `.sp-action-bar`, czyli link
„Odłóż na później" tuż nad kolejnym zwiniętym wierszem „Rozpatrz →". Element
ISTNIEJE w DOM z podpiętym listenerem (`sidePanelHud.ts:834-843` →
`config.onEventDismiss`, nie jest `pointer-events:none`/`visibility:hidden`) —
problem jest WYŁĄCZNIE geometryczny, nie logiczny (choć obcięty obszar może też
ograniczać hit-box klikalności).
Gotowy wzorzec przycisku „✕" (dismiss) już istnieje dla kart NIEblokujących
(informacyjnych): `sidePanelHud.ts:754` (`<span class="sp-close"
data-dismiss="..." title="Zamknij" aria-label="Zamknij powiadomienie">✕</span>`),
CSS `sidePanelHud.ts:360-363` (`margin-left:auto` odpycha „✕" na prawy kraniec),
handler `sidePanelHud.ts:809-818` woła TEN SAM `config.onEventDismiss?.(id)` co
„Odłóż na później"/„Zignoruj" — gotowy do skopiowania na kartę blokującą,
DOKŁADNIE zgodnie z sugestią właściciela.
Semantyka dzisiejszego „Odłóż na później" (dla poprawnego doboru zachowania
nowego „✕"): miękki, JEDNOTUROWY dismiss — klik dodaje id do
`dismissedSidePanelEventIds` (`main.ts:13466`), które filtruje listę zdarzeń
(`main.ts:13893`) i jest czyszczone na końcu KAŻDEJ tury (`main.ts:21079` i
`27568`). NIE usuwa oferty trwale z `pendingDiplomacyInbox`/negocjacji — karta
wraca w następnej turze, jeśli propozycja nadal aktualna.

GOAL
1. Napraw ucięcie: karta blokująca (`.sp-blocking.sp-expanded`) ma być w pełni
   widoczna wraz z całą stopką akcji (`.sp-action-bar`, oba przyciski/linki),
   niezależnie od tego, ile miejsca zostało w `.sp-scroll` — nadmiar ma
   przewijać SIĘ CAŁY KONTENER `.sp-scroll` (już ma `overflow-y:auto`), karta
   NIE MA się kurczyć poniżej wysokości własnej treści. Wybierz techniczne
   rozwiązanie usuwające przyczynę (np. `min-height:min-content` na karcie,
   zmiana `overflow:hidden`→`overflow:visible` z zachowaniem zaokrąglonych
   rogów innym mechanizmem typu `border-radius`+`isolation`, albo inny
   poprawny wzorzec) — dobierz metodę inżynierskim osądem, kryterium to
   REZULTAT (kryteria końca niżej), nie konkretna technika.
2. Dodaj przycisk „✕" (dismiss) w prawym górnym rogu karty blokującej
   (`.sp-blocking.sp-expanded`), wizualnie i funkcjonalnie wzorem istniejącego
   `.sp-close` z kart niebliokujących (`sidePanelHud.ts:754`, ten sam handler
   `onEventDismiss`) — zawsze widoczny, niezależny od dostępnego miejsca w
   stopce (pozycjonowany względem nagłówka karty, nie stopki akcji), z tym
   samym `title`/`aria-label` co istniejący wzorzec.
3. Zdecyduj o losie tekstowego linku „Odłóż na później" (`data-sp-ignore`,
   linia ~689) TERAZ, gdy „✕" pełni identyczną funkcję: skoro oba wołają
   dokładnie ten sam `onEventDismiss`, usunięcie zdublowanego linku tekstowego
   ze stopki jest poprawnym uproszczeniem (mniej elementów rywalizujących o
   miejsce w tej samej, ciasnej stopce — usuwa też ryzyko powrotu tego samego
   bugu ucięcia przy trzecim przycisku w przyszłości) — ZACHOWAJ jednak samą
   funkcję `isDeferrableDiploEvent()`-gating: „✕" pojawia się dla WSZYSTKICH
   kart blokujących (tak jak dziś dla informacyjnych), ale jeśli chcesz
   zachować rozróżnienie „ta karta NIE jest deferrable" (np. dla kart, gdzie
   odłożenie nie ma sensu semantycznego) — sprawdź czy taki przypadek w ogóle
   istnieje w danych i zdecyduj świadomie, dokumentując wybór w raporcie.
4. Zero zmian w logice `onEventDismiss`/`dismissedSidePanelEventIds`/
   `main.ts` — semantyka „miękki dismiss na tę turę" zostaje identyczna,
   zmienia się WYŁĄCZNIE prezentacja w `sidePanelHud.ts`.

KRYTERIA KOŃCA (binarne)
1. Żywy zrzut Chromium: karta blokująca z GATED „Odłóż na później"/nowym „✕"
   (użyj realnej oferty dyplomatycznej z danych gry, nie sztucznie krótkiej)
   pokazuje CAŁĄ stopkę akcji w pełni widoczną, bez ucięcia — „✕" widoczny w
   prawym górnym rogu karty.
2. Klik w „✕" faktycznie ukrywa kartę z listy „Wymaga decyzji" na tę turę
   (ten sam efekt co dawne „Odłóż na później") — zweryfikuj żywo, nie
   zakładaj z samej zmiany DOM.
3. Klik w „OTWÓRZ →" nadal poprawnie otwiera pełny dialog decyzji — zero
   regresji funkcjonalnej głównej akcji karty.
4. Karty NIEblokujące (informacyjne, istniejący `.sp-close`) bez zmian
   wizualnych/funkcjonalnych — zero regresji w tej części.
5. `tsc --noEmit` czysty, istniejące testy dotykające panelu bocznego/dyplomacji
   (grep `gra/tools/*sidepanel*-test.cjs`, `gra/tools/*sp-dismiss*-test.cjs`,
   w tym `sidepanel-diplo-dismiss-real-render-test.cjs` z commitu `5cbe910c`,
   30/30) nadal zielone, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/sidePanelHud.ts (WYŁĄCZNIE: CSS `.sp-blocking.sp-expanded`/
  `.sp-action-bar`/nowy `.sp-close`-na-karcie-blokującej, render karty
  blokującej — linie ~266-300, ~666-699, ~750-760 — i ewentualne usunięcie
  linku `data-sp-ignore` jeśli zdecydujesz się na uproszczenie z GOAL pkt 3;
  zero zmian w `isDeferrableDiploEvent()` samej logice warunku, zero zmian w
  kartach niebliokujących poza odczytem wzorca).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `main.ts` (`onEventDismiss`/
`dismissedSidePanelEventIds`/`handleSidePanelEventDismiss` — logika zostaje
nietknięta, wołaj ją tak jak dziś), zmiana `diplomacyAudience.ts` (osobny
panel, poza zakresem), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-dyplo-karta-dismiss-uciety, gałąź
autobot/P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1, baza jawnie: origin/main
(najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione przez samo odczytanie CSS bez żywego
zrzutu Chromium z REALNĄ ofertą dyplomatyczną (nie testową atrapą krótszą niż
prawdziwe dane) w scenariuszu z NISKĄ wysokością panelu bocznego (symuluj
ograniczony viewport, żeby faktycznie wymusić brak miejsca — na dużym
viewporcie bug może się nie ujawnić nawet bez fixu, co dałoby fałszywy PASS).
Zakaz porównania "wygląda dobrze" bez zrzutu POKAZUJĄCEGO oba przyciski/„✕"
jednocześnie w pełni w kadrze.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Opus 5, effort medium) → Evaluator (Opus 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.
