# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`
GOAL: Kliknięcie zdarzenia „Zbadano: <technologia>" w panelu Wydarzeń **otwiera kartę
tej konkretnej technologii**. Dziś klik nic nie robi.

## Wyzwalacz — ECHO właściciela

> „Komunikat, na przykład, zbadano rolnictwo; jeżeli się naciśnie, powinno przekierowywać
> do karty technologii, która została zbadana, a niestety się nie dzieje."

Zrzut: karta „Wydarzenie — **Zbadano**: Rolnictwo (−40 nauki)" z przyciskiem ✕.

## USTALENIA RECONU — zweryfikuj, ale nie odkrywaj od nowa

**Obie potrzebne części JUŻ ISTNIEJĄ. Brakuje połączenia.**

1. **Mechanizm klikania zdarzeń istnieje.** `gra/src/ui/sidePanelHud.ts:772`, `:787`, `:807`
   → `config.onEventClick?.(id)`; kontrakt w `:83`, `:89`. Warunek: zdarzenie musi mieć `data-id`.
2. **Karta technologii istnieje.** `gra/src/ui/techDiscoveryNotice.ts:498`
   `showTechDiscoveryNotice(opts)` → `:515` `showTechDiscoveryNoticeViaEntityCard(tech, opts)`,
   przez wspólny `renderer.ts` / `renderEntityCard` (migracja CivPedia).
3. **Komunikat „Zbadano" powstaje w `gra/src/main.ts:26193-26196`** —
   `let msg = doneIconHtml + 'Zbadano: ' + done.id + ' (-' + done.koszt + ' nauki)'`,
   a potem `if (!eraAdvanced) showHintMessage(msg, 3500)` (`main.ts:12118`).
   **`done.id` to identyfikator technologii — jest pod ręką w miejscu tworzenia komunikatu.**
4. `main.ts:26208-26213` — przy `!eraAdvanced` woła się TAKŻE `showTechDiscoveryNotice({...})`.
   Czyli karta pokazuje się raz, jako modal, i znika; **zdarzenie w panelu bocznym zostaje
   i nie prowadzi już nigdzie.** To najprawdopodobniej dokładnie to, co widzi właściciel —
   ale **Operator MA to rozstrzygnąć pomiarem, a nie przyjąć z tego dispatchu.**

**Pierwsze zadanie Operatora jest diagnostyczne:** ustalić, czy komunikat ze zrzutu to
`SidePanelEvent` (z `data-id`, obsługiwany przez `onEventClick`), czy zwykły hint z
`showHintMessage` renderowany w tym samym miejscu. Od tego zależy cała reszta. Odpowiedź
podać jawnie, ze ścieżką i numerem linii.

## KONTEKST — ten obszar był już audytowany, przeczytaj wnioski

`dyspozycje/autobot/runs/P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1/01-operator.md` — pełny audyt
przekierowań zdarzeń panelu bocznego (2026-08-22). Kluczowy fragment: karty nie-blokujące
są klikalne w całości, a trzy rodziny (`border-march-*`, `war-*`, `elim-cs-*`) miały już
pełne handlery. Problem był **dwustronny**: część zdarzeń prowadzi gdzieś, ale bez afordancji;
część wygląda na klikalną, a nie prowadzi nigdzie (`cursor:pointer` na każdej karcie).

**„Zbadano" należy do drugiej grupy.** Trzymaj się konwencji ustalonej w tamtym audycie —
ta sama afordancja („→" albo cokolwiek tam przyjęto), nie wymyślaj nowej. Jeśli tamta
konwencja nie jest w `main`, powiedz to jawnie.

## ZADANIE

1. Zdarzenie „Zbadano: <tech>" ma nieść **identyfikator technologii** (`done.id`) w sposób,
   który `onEventClick` potrafi odczytać.
2. `onEventClick` dla tego zdarzenia ma otwierać **kartę TEJ technologii** —
   `showTechDiscoveryNotice` (albo właściwszą funkcję, jeśli Operator znajdzie lepszą,
   z uzasadnieniem). **Karta ma dotyczyć klikniętej technologii, nie ostatniej zbadanej** —
   przy dwóch technologiach w jednej turze to się rozjeżdża, sprawdź ten przypadek osobno.
3. Afordancja wizualna spójna z konwencją z audytu przekierowań.
4. Zdarzenie ma być klikalne **także po odświeżeniu panelu i po przejściu tury**, dopóki
   widnieje na liście — nie tylko w turze, w której powstało.
5. Krzyżyk ✕ (zamknięcie zdarzenia) ma dalej działać i **nie** otwierać karty.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ** uznania tematu za zrobiony bez **faktycznego `page.mouse.click`** w żywym Chromium
  na karcie zdarzenia i sprawdzenia, że karta technologii **się otworzyła i dotyczy właściwej
  technologii**. Sprawdzenie, że handler „jest podpięty", nie jest dowodem — w tej serii był
  już temat, gdzie przyciski istniały i nie działały (`KRYTYCZNE: przyciski akcji karty
  technologii nie działają`).
- **ZAKAZ** dowodu przez regex po własnym źródle. Każda nowa asercja MUSI czerwienieć po
  jednej celowanej mutacji — pokaż mutację i wynik.
- **ZAKAZ** testowania na fragmencie DOM bez rodziców. Lekcja `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`
  z tej serii: Evaluator i Final Control niezależnie zmontowali element bez rodzica i obaj
  zaraportowali objaw, którego w grze NIE MA. Harness ma odtwarzać pełny kontekst panelu.
- Sprawdź przypadek **dwóch technologii zbadanych w jednej turze** — klik na pierwszą ma
  otwierać pierwszą, nie ostatnią.
- Sprawdź, że zmiana **nie zepsuła** trzech rodzin z audytu (`border-march-*`, `war-*`,
  `elim-cs-*`) — pomiar, nie założenie.

## Kryteria sukcesu

1. Klik w „Zbadano: Rolnictwo" otwiera kartę **Rolnictwa** — dowód z żywego Chromium.
2. Dwie technologie w jednej turze → każda otwiera swoją kartę.
3. ✕ zamyka zdarzenie i nie otwiera karty.
4. Trzy rodziny zdarzeń z audytu nadal działają.
5. `tsc --noEmit` 0 błędów; 5 bramek referencyjnych zielonych (logic 213/213, tech-tree 19/0,
   research 33/33, unit-replace 13/13, combat 6/6).
6. Nowa bramka tematu z dowodem nietautologiczności.

## Izolacja

Gałąź `autobot/P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/main.ts` (okolice `:26185-26215` i `onEventClick`) · `gra/src/ui/sidePanelHud.ts` ·
`gra/src/ui/techDiscoveryNotice.ts` · `gra/tools/*` · raporty runu.

**UWAGA — DWA RÓWNOLEGŁE TEMATY (§2b), oba dotykają `main.ts`:**
- `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1` — `buildModeHud.ts` + `main.ts` ~`:19352-19359`
- `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1` — `economy-upkeep.ts`, `cityPanel.ts`, `main.ts` ~`:913`

Twoje rejony w `main.ts` (~`:26185`, `onEventClick`) są od nich odległe, ale **nie ruszaj
`buildModeHud.ts`, `economy-upkeep.ts` ani `cityPanel.ts`** i trzymaj zmiany w `main.ts`
w swoich rejonach. Kolizja = problem integracji.

**NIE ruszać:** `gra/data/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. C-001: zakaz
`npm run build`/`dev`; dozwolone `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`.
Zakaz `npx`, zakaz `git add -A`. **Commituj cząstkowe postępy W TRAKCIE** — w tym repo
dwa tematy zginęły przez brak commita.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról** (temat wizualny, §5a). C-062.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.

---

# ROZSZERZENIE DISPATCHU — DEFEKT (B), ten sam plik, ta sama ścieżka użytkownika

Zgłoszone przez właściciela chwilę po (A). **Nie jest to osobny temat** — to ta sama ścieżka
„zdarzenie → karta technologii → karta szczegółu" i te same pliki. Dwa osobne tematy na
`techDiscoveryNotice.ts` gwarantowałyby konflikt (§2b), więc idą razem.

## ECHO właściciela

> „po zakończeniu tury pojawia się informacja o nowych odkryciach, na przykład o technologii,
> i naciskam na szczegóły, na przykład o obozie łowieckim, ekran się wytwarza, ale nie pojawia
> się obok, tylko pod spodem. Powinno się pojawić obok. Karta obozu łowieckiego."

> „Pojawia się pod spodem i gracz może nie wiedzieć, co się stało, że to widocznie nie
> włączyło albo nie będzie widoczne."

## Co pokazują zrzuty

Zrzut 1: karta „Łowiectwo — Ukończono badania", sekcja „Ulepszenia terenu" → wiersz
„Obóz łowiecki" z linkiem **„Szczegóły →"**.
Zrzut 2: po kliknięciu — karta „Obóz łowiecki" jest widoczna **sama, na mapie**;
karty „Łowiectwo" już nie ma.

## Punkt zaczepienia

`gra/src/ui/techDiscoveryNotice.ts:226` —
`#HOST_ID{position:fixed;inset:0;z-index:940;display:flex;align-items:center;justify-content:center}`
— host karty technologii to wyśrodkowana nakładka pełnoekranowa; `:228` `.tdn-back` to jej tło.
Link „Szczegóły →": `techDiscoveryNotice.ts:660` oraz `entityCards/renderer.ts:468`.

Operator MA ustalić **pomiarem**, czy karta ulepszenia ląduje w innym hoście o niższym
`z-index`, czy karta technologii jest zamykana przed jej otwarciem — **to dwie różne
przyczyny i dwie różne naprawy**. Odpowiedź podać jawnie, ze ścieżką i numerem linii.

## Czego oczekuje właściciel

Obie karty widoczne **jednocześnie, obok siebie**, żeby było widać związek: z tej technologii
wynika to ulepszenie. Nie stos, nie podmiana, nie karta pod spodem.

Układ ma działać przy różnych szerokościach okna. Przy wąskim oknie dwie karty obok siebie
mogą się nie zmieścić — wtedy Operator wybiera rozwiązanie zastępcze (np. układ pionowy,
ale **obie widoczne**) i **nazywa ten próg jawnie**, zamiast po cichu wrócić do podmiany.

## Dodatkowe zadania (numeracja ciągła z częścią A)

6. Karta ulepszenia otwarta z „Szczegóły →" pojawia się **obok** karty technologii,
   **obie widoczne naraz**. Karta technologii NIE znika.
7. Zamknięcie karty ulepszenia wraca do samej karty technologii (nadal otwartej).
   Zamknięcie karty technologii zamyka obie.
8. Zachowanie przy wąskim oknie nazwane jawnie i uzasadnione.

## Dodatkowe kryteria sukcesu

7. **(B)** Po kliknięciu „Szczegóły →" **obie karty są jednocześnie widoczne** — dowód:
   pomiar `getBoundingClientRect()` obu kart w żywym Chromium. Żadna nie ma zerowej
   powierzchni, żadna nie jest zasłonięta przez drugą, **żadna nie leży poza viewportem**.
   Zrzut ekranu jako materiał uzupełniający, NIE zamiast pomiaru.
8. **(B)** Zamknięcie karty ulepszenia zostawia kartę technologii otwartą — pomiar.
9. Nowa bramka tematu pokrywa (A) i (B), obie z dowodem nietautologiczności.

## Rozszerzenie allowlisty

Dodatkowo: `gra/src/ui/entityCards/renderer.ts` · `gra/src/ui/entityCards/buildingAdapter.ts`.

**Uwaga:** `renderer.ts` to WSPÓLNY renderer kart encji (migracja CivPedia) — zmiana w nim
dotyka też karty jednostek i budynków. Każda zmiana tam MA być udowodniona jako niepsująca
pozostałych kart; jeśli da się rozwiązać (B) bez dotykania `renderer.ts`, to jest lepsze.
