# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Evaluator runda 2 (weryfikacja obrony)

**Metoda:** świeży `grep -n`/`Read` w worktree `/home/user/wt-hotseat-etap5-recon`, HEAD
`2151dfb6f58918eaa48e6a09a081a5d2cacc81fa` (czysty `git status --porcelain` przed startem).
Zero zaufania cytatom Obrony/Operatora — każda linia niżej zweryfikowana od zera osobnym
`grep`/`sed`/`Read` tej rundy. Zakres: WYŁĄCZNIE dwie łatki z `03-obrona-runda1.md`
(zarzut #1 toast, zarzut #2 build-mode), zgodnie z zawężeniem trybu naprawczego z
`02-evaluator-runda1.md` ("Evaluator runda 2 weryfikuje wyłącznie te dwie łatki").

## Zarzut #1 (toast `hintToast`/`showHintMessage`/`hintOverrideTimer`) — poprawka WERYFIKOWANA POPRAWNA

Świeży grep:
```
grep -n "hintToast\|showHintMessage\|hintOverrideTimer\|hideHintMessage" gra/src/main.ts
```
Potwierdzone niezależnie:
- `const hintToast = document.createElement('div')` @ **1736**, `appendChild` @ **1749** —
  zgodne z §1c-bis.
- `let hintOverrideTimer` @ **13139**, `function showHintMessage(...)` @ **13141**, klamra
  zamykająca @ **13179** (nie 13178 z cytatu Evaluatora rundy 1 — korekta Obrony o 1 linię
  POPRAWNA, sprawdzona `sed -n '13175,13179p'`: `13179` to `}` zamykający funkcję).
- `grep -c "showHintMessage(" gra/src/main.ts` → **279**, zgodne z obiema rundami.
- `hideHintMessage` w `gra/src` → **zero trafień**, potwierdzone.
- Ciało `showHintMessage` odczytane w całości (13141-13179): jedyne wygaszenie to własny
  `setTimeout(() => { hintToast.style.display='none'; hintOverrideTimer=null; }, durationMs)`
  @ 13175-13178. Poprawka KROK 1b (`clearTimeout(hintOverrideTimer); hintOverrideTimer=null;
  hintToast.style.display='none';`) to dokładnie ten sam efekt końcowy, wywołany
  natychmiast zamiast po czasie — **wystarczające i poprawne dla kryterium "brak widocznego
  tekstu fotela A po handoff"**.

Dodatkowa uwaga (nie blokująca): `showHintMessage` ma na wejściu strażnika
`if (shouldDeferEotEvents(endTurnInProgress)) { deferredEotHints.push(...); return; }` —
zdarzenia odłożone do `deferredEotHints` (kolejka, nie DOM) są już objęte czyszczeniem w
KROKU 3 (`deferredEotHints.length = 0`, obecne od rundy 1) — brak luki.

**Werdykt zarzutu #1: PRZYJĘTA POPRAWKA JEST POPRAWNA I WYSTARCZAJĄCA.** Brak nowych
nieścisłości.

## Zarzut #2 (build-mode/`exitBuildMode()`) — poprawka CZĘŚCIOWA, NOWA LUKA ZNALEZIONA

Świeży grep:
```
grep -n "let foundCityMode\|let buildModeOpen\|let activeImprovementKey\|let activeWonderId\|function exitBuildMode\|function isAwaitingFirstPlayerCity" gra/src/main.ts
```
Potwierdzone: `foundCityMode` @ **2513**, `buildModeOpen`/`activeImprovementKey`/
`activeWonderId` @ **11457/11458/11459**, `exitBuildMode()` @ **12456**, ciało odczytane w
całości do **12472** (klamra zamykająca) — korekta Obrony (12456-12472, nie 12456-12469 z
cytatu Evaluatora rundy 1) **POPRAWNA**, sprawdzona `sed -n '12456,12472p'`: linia 12471 to
`popOverlay('build-mode');`, linia 12472 to `}`. Guard `if (isAwaitingFirstPlayerCity())
return;` @ **12462** z komentarzem odsyłającym do `R-PIERWSZE-MIASTO (Maciej 2026-07-24)` —
zgodne dosłownie z dokumentem.

**Weryfikacja przez wykonanie logiki (nie tylko odczyt), czy KROK 1c z §2 faktycznie
"wywołałoby exitBuildMode() (lub równoważny mechanizm)" w scenariuszu, dla którego został
napisany (`isAwaitingFirstPlayerCity()===true`):**

Ciało `exitBuildMode()` po guardzie (linie 12463-12471):
```ts
buildModeOpen = false;
foundCityMode = false;
activeImprovementKey = null;
activeWonderId = null;
clearBuildModeVisuals();      // 12467
refreshBuildApi();            // 12468
refreshBuildHighlight();      // 12469
refreshD1bHud();              // 12470
popOverlay('build-mode');     // 12471
```
Gdy `isAwaitingFirstPlayerCity()` jest prawdą (dokładnie ten scenariusz, dla którego KROK 1c
istnieje), `return` na linii 12462 wykonuje się PRZED linią 12463 — **żadna z tych ośmiu
linii, w tym `clearBuildModeVisuals()`/`popOverlay('build-mode')`, NIE wykonuje się.**
Poprawka Obrony w KROK 1c dodaje TYLKO:
```ts
if (isAwaitingFirstPlayerCity()) {
  buildModeOpen = false; foundCityMode = false;
  activeImprovementKey = null; activeWonderId = null;
}
```
— czyli odtwarza WYŁĄCZNIE cztery pierwsze linie ciała `exitBuildMode()` (12463-12466), nie
resztę (12467-12471). **To NIE jest "równoważny mechanizm" wobec `exitBuildMode()` w tym
scenariuszu — jest to podzbiór, celowo pomijający `clearBuildModeVisuals()`,
`refreshBuildHighlight()`, `refreshD1bHud()` i `popOverlay('build-mode')`.**

Sprawdzone treścią, co konkretnie zostaje POMINIĘTE i czy ma widoczny skutek:

1. **`clearBuildModeVisuals()` (12350-12354, odczytana w całości):**
   ```ts
   function clearBuildModeVisuals(): void {
     removeBuildGhosts();
     unitRenderer.clearHighlight();
     clearMineEligibleOverlay();
   }
   ```
   `removeBuildGhosts()` (11821-11836, odczytana w całości) usuwa z THREE.js `scene`
   `ghostGroup`/`ghostCityGroup` (mesh podglądu budowy/miasta) I ustawia
   `ghostChip.style.display = 'none'` (11835) — `ghostChip` to REALNY, widoczny element
   DOM (`document.createElement('div')` @ 11768, `id='civ-build-ghost-chip'` @ 11769,
   `appendChild(document.documentElement)` @ 11778), pozycjonowany na ekranie względem
   kursora myszy (`ghostChip.style.left/top` ustawiane w handlerze ruchu myszy, poza
   zakresem `switchActiveHuman()`). **Bez wywołania `clearBuildModeVisuals()`, jeśli
   `ghostChip.style.display` było `'flex'` w momencie handoffu (realne — ustawiane przy
   każdym ruchu myszy nad mapą podczas aktywnego build-mode), CHIP POZOSTAJE WIDOCZNY NA
   EKRANIE fotelowi B** — z etykietą/kolorem budowy fotela A — mimo że
   `buildModeOpen`/`activeImprovementKey` są już (poprawnie) wyzerowane. To samo dotyczy
   `ghostGroup`/`ghostCityGroup` w scenie 3D (widoczny "duch" budynku/miasta na mapie) i
   `mineEligibleGroup` (podświetlenie heksów pod kopalnię, `clearMineEligibleOverlay()`
   @ 11646-11651).
2. **`popOverlay('build-mode')` (12471) pominięte:** `escapeOverlayStack` (przeczytany w
   całości, `gra/src/ui/escapeOverlayStack.ts`) to WSPÓLNY, globalny stos — wpis
   `{id:'build-mode', onClose: () => exitBuildMode()}` (wepchnięty przez
   `enterBuildModeEscapeOverlay()` @ 12474-12476, wołane przy wejściu w build-mode)
   **pozostaje na stosie fotela A niezdjęty**. Konsekwencja: `lockEscapeWhileStacked()`
   utrzymuje `Keyboard Lock API` na Escape aktywny (bo `stack.length>0`), a pierwszy
   Escape fotela B — jeśli fotel B nie otworzył WŁASNEGO nowego wpisu na tym samym stosie
   — trafi w PRZEŻYWAJĄCY wpis `'build-mode'` sprzed handoffu zamiast (poprawnie) nie robić
   nic / zamknąć coś fotela B. To nie jest hipotetyczne: `pushOverlay()` dedupluje PO `id`
   (usuwa istniejący wpis i wstawia na wierzch), więc dopóki fotel B faktycznie NIE wejdzie
   w build-mode, stary wpis 'build-mode' nie zostanie zastąpiony ani usunięty przez nic
   innego.
3. **Potwierdzony ISTNIEJĄCY, precyzyjnie analogiczny precedens w main.ts, którego dokument
   NIE cytuje**, pokazujący, jak wygląda poprawny "twardy reset" build-mode OMIJAJĄCY
   guard `isAwaitingFirstPlayerCity()` (kontekst: reset stanu przy nowej grze,
   main.ts:34303-34309, świeżo odczytany):
   ```ts
   buildModeOpen = false;
   popOverlay('build-mode');
   activeImprovementKey = null;
   resetMapOverlayToggleDefaults();
   clearBuildModeVisuals();
   ```
   Ten JUŻ ISTNIEJĄCY, produkcyjny kod dowodzi, że poprawny wzorzec "resetuj build-mode BEZ
   przechodzenia przez `exitBuildMode()`" MUSI obejmować `popOverlay('build-mode')` i
   `clearBuildModeVisuals()` obok samych zmiennych stanu — dokładnie te dwa wywołania, które
   KROK 1c pomija. Nie trzeba wynajdywać nowego mechanizmu — trzeba skopiować ten, ten sam,
   co dokument sam rekomenduje robić dla innych kroków (§3.1: "nie wynajdywać własnego
   mechanizmu, użyć istniejącego precedensu").

**Konsekwencja:** w DOKŁADNIE tym scenariuszu, dla którego Obrona napisała KROK 1c (fotel A
w trakcie zakładania pierwszego miasta / budowy w momencie handoff, `isAwaitingFirstPlayerCity()
=== true`) — czyli w scenariuszu ocenionym przez Evaluatora rundy 1 jako "realistyczny,
domyślny stan startowy drugiego fotela", nie brzegowy przypadek — poprawka **nie usuwa
widocznego duszka budowy (`ghostChip`/`ghostGroup`/`ghostCityGroup`/`mineEligibleGroup`) z
ekranu ani nie zdejmuje wpisu ze stosu Escape**. To jest DOKŁADNIE ta sama kategoria ryzyka
co oryginalny zarzut #2 ("żaden fragment ekranu poprzednika widoczny" — kryterium gotowości
z `00-dispatch.md`), tylko że tym razem to WIZUALNY duszek 3D/DOM, nie stan sterujący
kliknięciem. §4.2 (`snapshotVisibleState()`) dodane w rundzie 2 sprawdza WYŁĄCZNIE 4
zmienne stanu (`buildModeOpen`/`foundCityMode`/`activeImprovementKey`/`activeWonderId`) —
test PRZESZEDŁBY (gdyby był uruchomiony) mimo widocznego duszka na ekranie, bo nie czyta
`ghostChip.style.display`/obecności `ghostGroup` w scenie/`escapeOverlayStack` — **luka w
projekcie automatycznie replikuje się jako luka w planie dowodu "no leak"**.

## Sprawdzenie pod kątem nowych nieścisłości (numerów linii, sprzeczności wewnętrznych)

- Wszystkie numery linii poprawione przez Obronę w tej rundzie (`13141-13179` zamiast
  `13141-13178`; `12456-12472` zamiast `12456-12469`) **zweryfikowane jako POPRAWNE**
  świeżym `sed`/`grep` — nie ma regresji dokładności.
- Komentarz w kodzie KROK 1c dokumentu Operatora (`01-operator-runda1-analiza.md:489`):
  *"exitBuildMode(); // "grzeczna" ścieżka: czyści wizualia + popOverlay('build-mode')"* —
  **ten komentarz jest wewnętrznie niespójny z resztą tego samego akapitu**: w scenariuszu,
  dla którego blok `if (isAwaitingFirstPlayerCity())` bezpośrednio pod nim istnieje, to
  właśnie wywołanie `exitBuildMode()` na linii wyżej JEST no-opem (guard) — więc "czyści
  wizualia + popOverlay" NIE opisuje tego, co faktycznie się dzieje w opisywanym dalej
  przypadku, tylko przypadek PRZECIWNY (guard fałszywy), który nie potrzebowałby w ogóle
  bloku `if` poniżej. To nie jest nowy błąd funkcjonalny (kod by zadziałał tak, jak
  napisano — po prostu niekompletnie, patrz wyżej), ale jest to nieścisłość w
  samo-opisie/uzasadnieniu dokumentu, wynikająca z tej samej luki: autor zdaje się wierzyć,
  że `exitBuildMode()` "i tak" czyści wizualia nawet w gałęzi guard-true, co pokazana wyżej
  treść funkcji wprost przeczy.

## STATUS: PASS-WITH-NOTES
## DOMAIN: INFORMATIONAL
## TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
## GOAL: Recon-only (zero zmian kodu) dla Etapu 5 planu hot-seat: `switchActiveHuman()` + `ui/hotSeatHandoff.ts`.
## ZMIANY-COMMIT: Nowy plik `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/04-evaluator-runda2.md`, do zacommitowania w tej rundzie w worktree `/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`. `git status --porcelain` czysty poza tym plikiem przed startem tej rundy; zero zmian w `gra/src`/`gra/tools`.
## TESTY: Nie dotyczy (dokument, zero kodu). Obie łatki Obrony zweryfikowane niezależnie świeżym `grep`/`sed`/`Read` main.ts tej rundy: Zarzut #1 (toast) potwierdzony poprawnie i wystarczająco zaadresowany; Zarzut #2 (build-mode) potwierdzony jako CZĘŚCIOWO zaadresowany — nowa luka znaleziona i udokumentowana wyżej z konkretnymi liniami (`clearBuildModeVisuals()`@12467/`popOverlay('build-mode')`@12471 pomijane w gałęzi guard-true, `ghostChip`@11768-11778/`removeBuildGhosts()`@11821-11836, precedens twardego resetu @ main.ts:34303-34309).
## BLOKADY: Brak blokad twardych (dokument, nie kod; PASS-WITH-NOTES nie zatrzymuje ścieżki dokumentacyjnej) — ale nowy zarzut niżej MUSI zostać zaadresowany w rundzie 3 tego samego tematu przed dispatchem implementacji `R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`, inaczej implementacja odziedziczy niekompletny projekt KROK 1c i test §4.2, który by tego nie złapał.
## RUNDY: 2/5.
## ZARZUTY:
1. **(NOWY, runda 3)** KROK 1c projektu `switchActiveHuman()` (§2 dokumentu, gałąź
   `if (isAwaitingFirstPlayerCity())`) resetuje WYŁĄCZNIE cztery zmienne stanu
   (`buildModeOpen`/`foundCityMode`/`activeImprovementKey`/`activeWonderId`), pomijając
   `clearBuildModeVisuals()` (main.ts:12350-12354, w tym `removeBuildGhosts()`
   @12467→11821-11836, chowa `ghostGroup`/`ghostCityGroup` w scenie THREE.js oraz
   `#civ-build-ghost-chip`@11768-11778, realny widoczny element DOM pozycjonowany na
   ekranie) i `popOverlay('build-mode')` (main.ts:12471, zdejmuje wpis ze wspólnego
   `escapeOverlayStack`) — obie te linie normalnie wykonuje `exitBuildMode()`, ale NIE w
   gałęzi guard-true, dla której KROK 1c w ogóle istnieje. Skutek: w scenariuszu
   "fotel A w trakcie zakładania pierwszego miasta/budowy przy handoff"
   (`isAwaitingFirstPlayerCity()===true`, oceniony przez Evaluatora rundy 1 jako
   REALISTYCZNY i DOMYŚLNY stan startowy drugiego fotela, nie brzegowy przypadek) —
   duszek budowy/miasta może pozostać WIDOCZNY na ekranie fotela B, a wpis
   `escapeOverlayStack` fotela A pozostaje na wspólnym stosie Escape. §4.2
   `snapshotVisibleState()` NIE czyta żadnego z tych trzech pól (`ghostChip.style.display`,
   obecności `ghostGroup`/`ghostCityGroup` w scenie, stanu `escapeOverlayStack`), więc test
   "no leak" zaprojektowany w tej rundzie PRZESZEDŁBY mimo widocznego duszka — luka w
   projekcie replikuje się jako luka w planie dowodu.
   **Poprawka rekomendowana (precedens JUŻ ISTNIEJĄCY w main.ts:34303-34309, do
   przywołania w rundzie 3 zamiast wynajdywania nowego mechanizmu):** w gałęzi
   `if (isAwaitingFirstPlayerCity())` dopisać `popOverlay('build-mode')` i
   `clearBuildModeVisuals()` obok resetu czterech zmiennych (opcjonalnie też
   `refreshBuildHighlight()`/`refreshD1bHud()` dla spójności HUD, analogicznie do pełnego
   ciała `exitBuildMode()` po guardzie). Dodatkowo poprawić w §2 KROK 1c komentarz
   `// "grzeczna" ścieżka: czyści wizualia + popOverlay('build-mode')` przy wywołaniu
   `exitBuildMode()` — w opisywanej gałęzi to wywołanie JEST no-opem, komentarz sugeruje
   inaczej. Dodać odpowiednie pola do `snapshotVisibleState()` (§4.2) i krok testu
   wchodzący w build-mode W SCENARIUSZU `isAwaitingFirstPlayerCity()===true` (nie tylko
   ogólny build-mode jak dziś), żeby test faktycznie łapał tę gałąź, nie tylko gałąź
   guard-false.
## NASTĘPNY KROK: Operator → runda 3 na tym samym ID: dopisać do KROK 1c
brakujące wywołania (`popOverlay('build-mode')`, `clearBuildModeVisuals()`) w gałęzi
`isAwaitingFirstPlayerCity()===true`, poprawić niespójny komentarz przy wywołaniu
`exitBuildMode()`, rozszerzyć `snapshotVisibleState()`/scenariusz testu §4.2 o pola
`ghostChip`/`escapeOverlayStack`, i przetestować scenariusz `isAwaitingFirstPlayerCity()
===true` osobno od zwykłego build-mode. Zarzut #1 (toast) zamknięty, nie wymaga dalszej
pracy. Po poprawce: Evaluator runda 3 weryfikuje wyłącznie tę jedną łatkę.
## DEPLOY/PUSH: NIE WYKONANO
