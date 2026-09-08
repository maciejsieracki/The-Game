STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-RENDER-Q1
GOAL: Implementacja pod-etapu 6e planu hot-seat ("render/kamera" z tabeli B2) na
podstawie zamkniętego recon
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/01-operator-runda1.md`
(zintegrowany, commit `42e919d7`). Behawioralny no-op przy `humanOwnerIds=[0]`.

**UWAGA — DISPATCHOWANE RÓWNOLEGLE Z R-HOTSEAT-ETAP6B-UI-Q1 (implementacja, w toku
osobną lanią)**: recon 6e potwierdza jawnie "brak nakładania" na swoich 27 pozycjach
względem Etapów 6a/6d. Overlap z 6b NIE był sprawdzany przez recon (6b implementacja
nie istniała w chwili pisania recon 6e) — orkiestrator zweryfikował świeżym `git diff`
że commit Operatora 6b (`b123cd1f`, worktree `/home/user/wt-hotseat-etap6b-ui`) dotyka
WYŁĄCZNIE funkcji `buildPlayerDiploSummary`/`buildPlayerArmyListEntries`/
`buildPlayerCityListEntries`/`buildCultureOverlayData`/`buildReligionOverlayData`/
`refreshLiveEmpireRatesUnsafe`/`wonderHudEntries`/`wonderHudTargetLabel`/
`wonderPlacementContext`/`ensureUlepszeniaHudCityId` + 4 pliki `ui/*.ts` — ŻADNA z tych
funkcji nie pokrywa się z 27 pozycjami tego tematu (`civTypeForOwner`, `relationColorFn`,
`cityMapOutlineKindForOwner`, `unitRingStanceForPlayer`, `civDisplayNameForOwner`,
`portraitForceCultureIcon`, `_cityRenderOpts` x3, `syncWorkerFieldOverlay`,
`refreshTerritoryBorderOverlay`, `syncOkolicaOverlay`, `cityRenderer.sync` literały,
`cities.ts`/`render/*.ts` fallbacki). Ryzyko konfliktu integracyjnego niskie, ale
**ZWERYFIKUJ TO PONOWNIE ŚWIEŻO na start swojej pracy** (main.ts mógł się zmienić od
czasu tej analizy) — jeśli znajdziesz realne nakładanie linii z 6b, zatrzymaj się i
zgłoś to jako BLOKADĘ zamiast migrować na oślep.

**Ten temat integruje się PO `R-HOTSEAT-ETAP6B-UI-Q1`** (kolejność dispatchu, nie
kolejność integracji — jeśli 6e skończy pracę pierwszy, orkiestrator zdecyduje o
kolejności integracji na podstawie faktycznego stanu obu gałęzi w tym momencie). Twoja
baza to `origin/main` @ dispatch — jeśli w międzyczasie 6b zostanie zintegrowany,
orkiestrator sam zajmie się rebase/reapplikacją diffu przy integracji, NIE Twoim
zadaniem jest się tym martwić w tej rundzie.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/01-operator-runda1.md`
  (dokument źródłowy — 27 miejsc, z cytatem linii przed/po, uwzględnia już 3 rundy
  poprawek Evaluatora — czytaj CAŁY dokument, nie tylko pierwszą wersję).
- Potwierdzone w recon: `render/camera.ts` jest owner-agnostyczna, ZERO pracy tam.
- Alias `isMe(id)`/`ME()` już istnieje w main.ts (Etap 6a, zintegrowany) — REUŻYJ GO,
  nie twórz duplikatu.
- **main.ts zmienia się codziennie — WSZYSTKIE numery linii z recon MUSZĄ zostać
  zweryfikowane świeżym grepem przed każdą podmianą.**

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem, że wszystkie 27 miejsc z recon nadal istnieją pod
   wskazanymi numerami.
2. Zmigruj WSZYSTKIE 27 miejsc zgodnie z podaną podmianą (`ownerId === 0` →
   `isMe(ownerId)`, `ownerId !== 0` → `!isMe(ownerId)`, literał `0` → `ME()`) — reużywając
   istniejący alias z Etapu 6a. Zwróć uwagę na formy `= 0`/`?? 0` (nie tylko `===`/`!==`)
   — recon je znalazł w rundzie 2 Evaluatora, sprawdź że wszystkie są uwzględnione.
3. NIE dotykaj: kodu obsługi kliknięcia (Etap 6a, np. `panelCity.ownerId===0` w
   handlerze mapy — to input, nie render), miejsc już zmigrowanych.
4. Napisz bramkę dowodu no-op: Chromium (render jest DOM/canvas-bound), porównanie
   wyrenderowanego stanu (kolory jednostek/miast, obrys terytorium, ikony) PRZED/PO na
   `humanOwnerIds=[0]`, 20 tur. Wzorzec: `gra/tools/hotseat-etap6a-input-noop-test.cjs`.

BINARNE KRYTERIUM SUKCESU: wszystkie 27 miejsc zmigrowane (grep `ownerId\s*(===|!==|=|`\
`\?\?)\s*0` w zakresach klastrów daje ZERO trafień), nowa bramka PASS i nietautologiczna,
`tsc --noEmit` czysty, 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie 27 miejsc z recon)
- `gra/src/render/units.ts`, `gra/src/render/cities.ts`, `gra/src/render/cityOkolicaOverlay.ts`
- `gra/tools/hotseat-etap6e-render-noop-test.cjs` (NOWY plik)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RENDER-Q1/*`
Zakaz `git add -A`. Zakaz dotykania plików spoza tej listy (w tym `render/camera.ts` —
recon potwierdził zero pracy tam).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania migracji za kompletną bez świeżego grepa
WSZYSTKICH form (`===`, `!==`, `=`, `??`) potwierdzającego brak przeoczonych miejsc.
Zakaz deklaracji bramki no-op jako PASS bez pokazania że czerwienieje na kodzie sprzed
tej rundy.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6e-render`, gałąź
`autobot/R-HOTSEAT-ETAP6E-RENDER-Q1`, baza `origin/main` @ `0272c3d2`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów — zawsze wymagana runda Obrony przed kolejnym Evaluatorem.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Integracja DOPIERO po integracji `R-HOTSEAT-ETAP6B-UI-Q1` (orkiestrator
decyduje o kolejności na podstawie faktycznego stanu w tym momencie).
DEPLOY/PUSH: NIE WYKONANO
