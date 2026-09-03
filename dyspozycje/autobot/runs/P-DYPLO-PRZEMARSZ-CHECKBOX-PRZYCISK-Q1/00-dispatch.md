TEMAT: P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/diplomacyTradeBasket.ts (wyłącznie sekcja `case '4':` w
`treatySectionHtml`, ok. linii 643-655, plus odczyt stanu ok. linii 804-805)
MODEL+EFFORT: claude-sonnet-5, effort high (mała zmiana UI, wymaga żywej weryfikacji w
przeglądarce jak każdy temat wizualny)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu modala „Traktat przemarszu")
"Poza tym powinny być zamienione na Przyciski, bo wygląda to bardziej profesjonalnie."
(dot. dwóch checkboxów: „Wariant wojskowy (+ opłata)" i „Wspólna walka z barbarzyńcami
(3 tury)" w formularzu traktatu przemarszu, akcja '4')

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Dokładna lokalizacja: `gra/src/ui/diplomacyTradeBasket.ts`, funkcja `treatySectionHtml`,
  `case '4':` (linie 643-655). Dwa `<input type="checkbox">` z etykietami:
  `#cdb-treaty-mil` (klasa `cdb-treaty-mil`, „Wariant wojskowy (+ opłata)") i
  `#cdb-treaty-barb` (klasa `cdb-treaty-barb`, „Wspólna walka z barbarzyńcami (3 tury)").
- Odczyt stanu po interakcji: linie 804-805, `readTreatyStateFromDom` (nazwa przybliżona —
  potwierdź w kodzie) czyta `.checked` z obu elementów przez `querySelector` po klasie.
- Wzorzec „przycisk zamiast checkboxa" o identycznej semantyce (toggle on/off,
  wielokrotne kliknięcie przełącza stan, wizualny stan `selected`/`active`) już istnieje
  w TYM SAMYM pliku: `turnChips`/`cdb-chip cdb-chip-turn` (linie 615-623, case '2') —
  `<button type="button" class="cdb-chip ... selected" data-turns="...">` z obsługą kliku
  gdzieś dalej w pliku (znajdź reconem faktyczny listener, np. delegacja zdarzeń na
  kontenerze modala). Użyj TEGO SAMEGO wzorca (klasa `cdb-chip`/podobna + `selected`),
  a NIE nowego, osobnego systemu stylowania — spójność z resztą modala.
- Zależność logiczna między dwoma polami: `barbarianCooperation` wymaga
  `borderMilitary === true` (silnik odrzuca kombinację odwrotną,
  `diplomacy-proposals.ts:1479-1481`). Rozważ (ale NIE wymuszaj bez potwierdzenia w UI
  istniejących wzorców), czy przycisk „Wspólna walka z barbarzyńcami" powinien być
  wizualnie wyłączony/wyszarzony, gdy „Wariant wojskowy" nie jest zaznaczony — dziś
  (checkboxy) użytkownik może zaznaczyć obie i dopiero silnik po stronie akceptacji
  odrzuci kombinację; jeśli zmiana disabled-state jest trywialna i nie zmienia zakresu
  allowlisty, można ją dodać, ale NIE jest to wymagane kryterium końca.

GOAL
1. Oba checkboxy w `case '4':` zastąpione przyciskami (`<button type="button">`) w stylu
   spójnym z istniejącym wzorcem `cdb-chip` z tego samego pliku (case '2', linie 615-623)
   — wizualny stan zaznaczenia (`selected`/analogiczna klasa), etykiety tekstowe bez
   zmian: „Wariant wojskowy (+ opłata)", „Wspólna walka z barbarzyńcami (3 tury)".
2. Kliknięcie przycisku przełącza stan (toggle) identycznie jak dotychczasowy checkbox —
   `state.borderMilitary`/`state.barbarianCooperation` i finalny `payload.borderMilitary`/
   `payload.barbarianCooperation` bez zmian semantyki.
3. Zero zmian w logice progów/kosztów/akceptacji (`diplomacy-proposals.ts`) — WYŁĄCZNIE
   reprezentacja UI tych dwóch pól w tym jednym pliku.
4. `id`/`class` atrybutów zachowane pod tymi samymi nazwami LUB test zaktualizowany, jeśli
   selektor musi się zmienić (np. `input[type=checkbox]` → `button`) — wybierz podejście
   minimalizujące zmiany w innych miejscach czytających te selektory (recon: sprawdź, czy
   `.cdb-treaty-mil`/`.cdb-treaty-barb` są czytane też gdzie indziej niż linie 804-805).

KRYTERIA KOŃCA (binarne)
1. Żywy render w headless Chromium (Playwright) modala „Traktat przemarszu" pokazuje dwa
   przyciski zamiast dwóch checkboxów, z tymi samymi etykietami.
2. Kliknięcie każdego przycisku przełącza jego wizualny stan zaznaczenia (widoczne w
   zrzucie/atrybucie klasy) i widoczne w podsumowaniu opłaty (`feeC`/`feeM` — cywilna vs
   wojskowa) — dokładnie jak dziś działający checkbox.
3. Wysłana propozycja (`payload.borderMilitary`/`barbarianCooperation`) ma te same
   wartości boolean co przed zmianą, przy tych samych kliknięciach — porównanie na żywo,
   nie tylko czytanie kodu.
4. Zero regresji na pozostałych case'ach formularza traktatu (2, 3, 5, 8, 12, 15) —
   niedotknięte przez zmianę.
5. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone, oraz istniejące testy koszyka
   negocjacyjnego/traktatu przemarszu (znajdź reconem, np. diplomacy-trade-basket-*-test.cjs
   lub podobne w gra/tools/).

ALLOWLISTA (nic poza tym)
- gra/src/ui/diplomacyTradeBasket.ts — WYŁĄCZNIE `case '4':` w `treatySectionHtml` i
  odpowiadający odczyt stanu (`.cdb-treaty-mil`/`.cdb-treaty-barb`, ok. linii 804-805) oraz
  ewentualna delegacja zdarzeń kliknięcia analogiczna do `cdb-chip-turn`, jeśli nie
  istnieje jeszcze generyczna obsługa `cdb-chip` poza turn-chipami.
- Nowy lub rozszerzony test w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana innych
case'ów formularza traktatu, zmiana `diplomacy-proposals.ts`.

IZOLACJA
worktree /home/user/wt-dyplo-przemarsz-checkbox, gałąź
autobot/P-DYPLO-PRZEMARSZ-CHECKBOX-PRZYCISK-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-przemarsz-cb --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2/3 za spełnione na podstawie samego czytania kodu — wymagany
żywy dowód z Chromium (klik → zmiana klasy/stanu → wartość w payload) na tej samej
fixture PRZED i PO zmianie, nie tylko porównanie struktury HTML.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
