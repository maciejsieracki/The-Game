# 01-operator — R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1

```
STATUS: PASS
TEMAT: R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1
GOAL: przyciski akcji „Rozpocznij badanie" i „Otwórz drzewo" w karcie odkrycia/
      podglądu technologii MUSZĄ realnie reagować na kliknięcie w prawdziwej
      przeglądarce — naprawić prawdziwą przyczynę na `main` (branch), nie
      tylko w bundlu.
```

## Reprodukcja PRAWDZIWEJ przyczyny (nie zgadywanie)

Zgodnie z dyspozycją, NIE zaufałem "kod wygląda poprawnie" (event listenery w
`renderer.ts`/`techDiscoveryNotice.ts` faktycznie są podpięte prawidłowo — to
zweryfikowałem jako pierwsze i to NIE był problem).

**Krok 1 — harness esbuild+jsdom** (`gra/tools/tech-discovery-card-click-test.cjs`,
nowy plik): bunduje realny `techDiscoveryNotice.ts`, woła
`showTechDiscoveryNotice({kind:'preview', onStartResearch: spy, onOpenTree: spy})`
(dokładnie ścieżka `scienceHubHud.ts:631`), znajduje `<button>` w wyrenderowanym
DOM, woła `button.click()`/`dispatchEvent(MouseEvent)`. **Wynik: 13/13 PASS —
zarówno PRZED, jak i PO naprawie.** To jest fałszywie zielony test (jsdom nie
robi layoutu/hit-testingu — `button.click()` wywołuje handler wskazanego
elementu bezpośrednio, ignorując co faktycznie "leży na wierzchu" wizualnie).
Uruchomiłem też pętlę po wszystkich 32 technologiach z tech.json (ten sam
wzorzec) — 0 fallbacków na `_legacyShowTechDiscoveryNotice`, 0 nieudanych
kliknięć. Wniosek pośredni: to NIE jest ten sam błąd co
`P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1` (aktywna ścieżka
`entityCards` faktycznie się wykonuje, event listenery faktycznie się odpalają)
— bug jest głębiej.

**Krok 2 — realny Chromium (Playwright), bo dostępny w tym środowisku**
(`chromium.launch()` z fallbackiem na `/opt/pw-browsers/chromium-1194/...`, ten
sam wzorzec co `era-change-toast-live-test.cjs`/`sidepanel-hud-deadzone-test.cjs`):
zbudowałem przeglądarkowy bundle (esbuild, `platform:'browser'`) tego samego
`techDiscoveryNotice.ts`, załadowałem do żywej strony, wywołałem
`showTechDiscoveryNotice(...)`, po czym na środku `getBoundingClientRect()`
przycisku „Rozpocznij badanie" wywołałem `document.elementFromPoint(cx,cy)`.

**Wynik: `elementFromPoint` zwracał `<div class="tdn-back">` (tło modala), NIE
przycisk.** Realny `page.mouse.click(cx,cy)` w tym miejscu zamykał kartę bez
wywołania `onStartResearch` (`researchCalls: 0`) — dokładnie objaw z żywego
zgłoszenia właściciela ("przycisk nic nie robi").

## Prawdziwa przyczyna

`showTechDiscoveryNoticeViaEntityCard()` (`techDiscoveryNotice.ts`) buduje:
`host.innerHTML = '<div class="tdn-back"></div>'` (tło), potem
`host.appendChild(card)` (karta `.entity-card`, T3/entityCards) — tło i karta są
SIBLINGAMI w tym samym `#host`.

- `.tdn-back` ma `position:fixed` → tworzy własny kontekst stackowania na
  "stack level 0" (CSS 2.1 Appendix E, krok 6 malowania), niezależnie od
  z-index.
- `.entity-card` (ENTITY_CARD_CSS, `entityCards/renderer.ts`) **nie miała
  żadnego `position`** (domyślne `static`) → maluje się we WCZEŚNIEJSZYM kroku
  (3: "in-flow, non-positioned descendants"), czyli **pod** tłem — mimo że w
  DOM jest dodana PO tle.

Efekt: tło faktycznie renderuje się (i przechwytuje kliknięcia) NAD kartą.
Klik na przycisk w rzeczywistości trafia w `.tdn-back`, którego własny listener
(`addEventListener('click', close)`) zamyka kartę — `onClick` przycisku nigdy
się nie wykonuje.

Stary, sprzed-T3 `.tdn-card` (fallback `_legacyShowTechDiscoveryNotice`) miał
`position:relative` explicite w CSS — dlatego tam ten sam wzorzec (tło+karta
jako siblingi) działał poprawnie, a regres pojawił się dopiero z nową kartą
`entityCards` (T3, FALA 307), która przejęła strukturę hosta, ale nie
odziedziczyła tej właściwości CSS.

## Naprawa (minimalna)

Jedna linia w `gra/src/ui/techDiscoveryNotice.ts::ensureEntityCardOverrideStyles()`
— override lokalny do `#${HOST_ID} .entity-card`, NIE dotyka wspólnego
`ENTITY_CARD_CSS`/`entityCards/renderer.ts` (współdzielony z T4, migracja karty
jednostki, w toku równolegle — zgodnie z dyspozycją, ograniczenie do naprawy
lokalnej zamiast przepisywania mechanizmu):

```diff
-#${HOST_ID} .entity-card{pointer-events:auto;width:min(660px,96vw);...}
+#${HOST_ID} .entity-card{position:relative;pointer-events:auto;width:min(660px,96vw);...}
```

Plus obszerny komentarz w źródle wyjaśniający mechanizm (CSS stacking, nie
"brak event listenera"), żeby przyszła sesja nie musiała powtarzać reconu.

**Weryfikacja fix-u realnym Chromium (nie tylko czytanie kodu):**
`git stash` → PRZED naprawą: `elementFromPoint` → `.tdn-back`, `researchCalls: 0`
po realnym kliku. `git stash pop` → PO naprawie: `elementFromPoint` → `<button>`
(`isResearchBtn: true`), `researchCalls: 1` po realnym kliku, karta zamyka się
poprawnie. Potwierdzone dla obu przycisków i dla wariantu "technologia
zablokowana" (tylko „Otwórz drzewo", `onStartResearch` = `undefined`).

## Trwały test (zamyka też P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1)

Dwa nowe pliki w `gra/tools/`:

1. `tech-discovery-card-click-test.cjs` (esbuild+jsdom) — realnie woła
   `showTechDiscoveryNotice()`, realnie renderuje kartę, realnie klika
   przyciski stopki (`button.click()`/`dispatchEvent(MouseEvent)`). Zamyka
   dosłowną treść zgłoszenia `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`
   (poprzedni test string-matchował źródło, trafiając w martwy fallback) — ale
   **sam w sobie NIE wykryłby TEGO konkretnego regresu** (jsdom nie robi
   hit-testingu), co jawnie udokumentowałem w nagłówku pliku, żeby przyszła
   sesja nie myślała, że to wystarczające pokrycie.
2. `tech-discovery-card-real-click-test.cjs` (esbuild+Playwright, żywy
   Chromium) — dokładnie odtwarza mechanizm bugu: `elementFromPoint()` na
   środku przycisku + realny `page.mouse.click()`. **To jest test, który
   faktycznie łapie tę klasę regresu.** Zweryfikowany przez `git stash`:
   6/12 FAIL na kodzie sprzed naprawy (błędny hit → `.tdn-back`, spy nie
   wywołany), 12/12 PASS po naprawie.

Nowe stuby prywatne (wzorzec `P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY`, własny stub
per test, nie dzielony): `gra/tools/.stubs/tech-discovery-click-brandAssets-stub.ts`,
`gra/tools/.stubs/tech-discovery-click-scienceOwlIcon-stub.ts`.

Dodatkowo: dołączyłem symlink `gra/node_modules` → `/home/user/The-Game/gra/node_modules`
(worktree AutoBot nie miał własnych node_modules; wzorzec opisany wprost w
`.gitignore` root repo, "worktree'y AutoBot dziela node_modules przez
symlink") — potrzebny do uruchomienia jakiegokolwiek testu w tym worktree.
Symlink nie jest śledzony przez git (gitignore pattern `node_modules`), nic do
commitowania.

## ZMIANY/COMMIT

Allowlista: `gra/src/ui/techDiscoveryNotice.ts` (1 linia CSS + komentarz),
`gra/tools/tech-discovery-card-click-test.cjs` (nowy),
`gra/tools/tech-discovery-card-real-click-test.cjs` (nowy),
`gra/tools/.stubs/tech-discovery-click-{brandAssets,scienceOwlIcon}-stub.ts`
(nowe), `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (zamknięcie
`P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`), ten raport.

Nie dotknięto: `entityCards/renderer.ts` (współdzielony z T4), żadnych danych
(`tech.json`/`buildings.json`/`units.json`/`terrain-improvements.json`).

SHA: patrz `git log --oneline -1` po commicie tej paczki na tym branchu.

## TESTY

- `cd gra && npx tsc --noEmit` — czysty (0 błędów).
- `node gra/tools/tech-discovery-card-click-test.cjs` — 13 PASS, 0 FAIL.
- `node gra/tools/tech-discovery-card-real-click-test.cjs` — 12 PASS, 0 FAIL
  (żywy Chromium/Playwright; potwierdzone `git stash`: 6/12 FAIL bez naprawy).
- `node gra/tools/technology-discovery-card-visual-test.cjs` — 48 PASS, 0 FAIL
  (bez regresu, istniejący test string-match nadal zielony, jak oczekiwano).
- `node gra/tools/entity-card-contract-test.cjs` — 75 pass, 0 fail (bez
  regresu we wspólnym `entityCards/renderer.ts` — nietknięty, ale bramka
  kontraktowa zielona dla pewności).
- Build weryfikacyjny (z `gra/`):
  `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` —
  sukces (844 moduły, 0 błędów).

## BLOKADY

Brak.

## NASTĘPNY KROK

Evaluator → Final Control → integracja orkiestratora. Uwaga dla integracji:
zmiana ograniczona do `techDiscoveryNotice.ts` (lokalny CSS override), zero
zmian w `entityCards/renderer.ts` współdzielonym z T4 — T4 NIE powinien
wymagać rebase/ponownej weryfikacji z powodu tej naprawy.

## DEPLOY/PUSH: NIE WYKONANO
