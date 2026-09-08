STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1
GOAL: Usunąć blokadę architektoniczną znalezioną przez `R-HOTSEAT-ETAP6E-RENDER-Q1`
(Operator+Evaluator, worktree `/home/user/wt-hotseat-etap6e-render`, BLOCK/
DECISION_REQUIRED) — migracja miejsc kategorii render na `isMe()`/`ME()` psuje start
gry przez Temporal Dead Zone (TDZ), bo `_cityRenderOpts()` (main.ts ok. 2439-2504) jest
wołane BEZWARUNKOWO na starcie (`cityRenderer.sync(cities, _cityRenderOpts())`,
main.ts ok. 2506) — DŁUGO PRZED deklaracją `let humanSeats` (main.ts ok. 10378) i funkcji
`ME()`/`isMe()` (main.ts ok. 10384/10398), które Etap 6e ma tam wstawić. Ten temat
naprawia WYŁĄCZNIE kolejność inicjalizacji, nie migruje żadnych miejsc kategorii render —
to zadanie osobnego, wznowionego `R-HOTSEAT-ETAP6E-RENDER-Q1`.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED ZMIANĄ:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RENDER-Q1/01-operator-runda1.md` i
  `02-evaluator-runda1.md` — pełna diagnoza: Operator zredukował problem do
  JEDNOLINIOWEJ reprodukcji (`playerOwnerId: 0` → `playerOwnerId: ME()` w
  `_cityRenderOpts()`), Evaluator NIEZALEŻNIE zreprodukował identyczny
  `ReferenceError: Cannot access 'lw' before initialization` w osobnej kopii drzewa
  (poza worktree), potwierdzając diagnozę.
- **Kod JUŻ ma ustalony wzorzec na dokładnie ten problem, w tej samej funkcji.**
  `main.ts` ok. 2434-2437, cytat:
  ```
  /** Podpinane po deklaracji cityBuilt (~L1830) — unika TDZ przy pierwszym sync. */
  let cityBuiltIdsForRender: ((cityId: string) => readonly string[]) | undefined;
  /** Podpinane po deklaracji cityProd — pigułka: glif produkcji always-on lite. */
  let cityProdForRender: ((cityId: string) => import('./game/production').CityProduction | null) | undefined;
  ```
  Te zmienne są forward-deklarowane jako `let X: T | undefined` PRZED
  `_cityRenderOpts()`, użyte wewnątrz z bezpiecznym fallbackiem (`cityBuiltIdsForRender?.(cityId) ?? []`),
  i dopiero PÓŹNIEJ (po realnej deklaracji `cityBuilt`/`cityProd`) przypisane do
  prawdziwej funkcji. Tam też jest komentarz wprost tłumaczący ten wzorzec: `/** Opcje
  renderowania miast — epoka i cywilizacja per właściciel. */` + komentarz przy
  `_visCache` o "Guard `cityFogVisible &&` celowo PRZED `fogOn`... short-circuit... omija
  TDZ" — TDZ w tej funkcji jest już ZNANYM, udokumentowanym problemem z ustalonym
  rozwiązaniem, NIE nowym odkryciem wymagającym nowego wzorca.
- **Kluczowe pytanie do rozstrzygnięcia przez Ciebie**: czy WSZYSTKIE 27 miejsc z recon
  6e potrzebują tego zabiegu, czy TYLKO te fizycznie leżące wewnątrz `_cityRenderOpts()`/
  wywoływane z niej PRZED linią 2506 (pierwsze bezwarunkowe wywołanie). Sprawdź świeżo —
  większość z 27 miejsc może być w ogóle NIEOSIĄGALNA przed 2506 (np. wywoływane dopiero
  z callbacków klikniętych przez gracza, długo po pełnej inicjalizacji) i nie potrzebować
  żadnej zmiany tutaj.

ZADANIE TEJ RUNDY:
1. Zidentyfikuj DOKŁADNIE, które z 27 miejsc recon 6e (main.ts) są fizycznie osiągalne z
   `_cityRenderOpts()` PRZED main.ts:2506 (pierwsze wywołanie) — najprawdopodobniej tylko
   pola samej `_cityRenderOpts()` (`getCiv`, `getCivIconId`, `playerOwnerId`,
   `isCityStateOwner`) plus ewentualnie `_visCache`/`cityFogVisible` jeśli dotyczą.
2. Dla TYCH konkretnych miejsc zastosuj wzorzec forward-declare+wire IDENTYCZNY z
   istniejącym (`cityBuiltIdsForRender`/`cityProdForRender`) — NIE migruj ich jeszcze na
   `isMe`/`ME()` bezpośrednio (to zrobi wznowiony `R-HOTSEAT-ETAP6E-RENDER-Q1`), tylko
   przygotuj infrastrukturę: np. `let meForRender: (() => number) | undefined;` deklarowane
   przed `_cityRenderOpts()`, użycie `meForRender?.() ?? HUMAN_OWNER_PRIMARY` (fallback
   identyczny z dzisiejszym zachowaniem — literał `0`/`HUMAN_OWNER_PRIMARY`, ZERO zmiany
   zachowania), i przypisanie `meForRender = ME;` zaraz po prawdziwej deklaracji `ME()`
   (main.ts ok. 10384) — analogicznie do `cityBuiltIdsForRender = (cityId) => ...` gdzieś
   dalej w pliku (znajdź ten wzorzec przez grep i skopiuj dokładnie tę technikę).
3. Zweryfikuj że boot gry działa identycznie jak dziś (menu się pojawia, brak wyjątków
   JS) — użyj REDUKCJI Z RAPORTU EVALUATORA jako gotowego testu regresji: podmień
   `playerOwnerId: 0` → `playerOwnerId: meForRender?.() ?? HUMAN_OWNER_PRIMARY` (albo
   `meForRender!()` po podpięciu — Twoja decyzja implementacyjna, byle bezpieczna), build
   Vite + Chromium, potwierdź że menu się ładuje bez `ReferenceError`.
4. To jest CZYSTA infrastruktura — nie zmienia zachowania (fallback = dzisiejszy literał).
   Behawioralny no-op jest z definicji trywialny (brak zmiany logiki), ale POTWIERDŹ to
   żywym uruchomieniem gry (Chromium), nie tylko `tsc`.

BINARNE KRYTERIUM SUKCESU: gra startuje bez `ReferenceError`/wyjątków JS (potwierdzone
żywym Chromium, wzorzec reprodukcji z `02-evaluator-runda1.md` Etapu 6e), `tsc --noEmit`
czysty, 5 bramek referencyjnych zielone, zero zmiany zachowania (fallback = dzisiejszy
literał, nie nowa logika).

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE region `_cityRenderOpts()`/deklaracje forward, main.ts
  ok. 2400-2520 + punkt podpięcia po `ME()`/`isMe()`, main.ts ok. 10380-10400)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1/*`
Zakaz `git add -A`. Zakaz migrowania jakichkolwiek z 27 miejsc kategorii render na
`isMe`/`ME()` bezpośrednio — to jest zadanie OSOBNEGO, wznowionego tematu.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "naprawione" bez żywego uruchomienia
Chromium odtwarzającego dokładnie reprodukcję z `02-evaluator-runda1.md` (jednoliniowa
zmiana `playerOwnerId: 0`→coś odczytującego `ME()`) i pokazania że menu się ładuje.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6e-prereq`, gałąź
`autobot/R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1`, baza `origin/main` @ `f4f745f4`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
weryfikacji Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja, potem WZNOWIENIE `R-HOTSEAT-ETAP6E-RENDER-Q1` (nowa
runda na tej samej gałęzi/ID, tym razem bez blokady TDZ).
DEPLOY/PUSH: NIE WYKONANO
