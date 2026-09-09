STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-D-Q1
GOAL: Migracja duplikatu tick dyplomacji wewnątrz `runWorldEndTurn` (Blok A + Blok B, ok. 24
miejsca literału `0`) na `isMe()`, kontynuacja i OSTATNI podetap Etapu 6d (dyplomacja, plan
hot-seat).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md, docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/01-operator-runda1.md` —
   §4 (opis Bloku A i Bloku B, cytaty) i §6 "Podetap D". ŹRÓDŁO PRAWDY — main.ts przesunął
   się ZNACZĄCO od recon (integracje Podetapu A/C/E już w main, plus dziesiątki innych
   niezwiązanych tematów tego dnia) — recon SAM zaznacza że granice Bloku A/B są PRZYBLIŻONE,
   nie brace-matched dokładnie (funkcja bardzo duża, async, zagnieżdżone domknięcia). Musisz
   samodzielnie zlokalizować i potwierdzić dokładne granice świeżym `Read`/`grep -n` przed
   jakąkolwiek edycją.

TO JEST NAJWYŻSZE RYZYKO CAŁEGO ETAPU 6D — `runWorldEndTurn` to serce pętli tury świata,
dzielone z resztą silnika końca tury, wysoka gęstość logiki AI-vs-gracz i AI-vs-AI w jednej
funkcji. Dispatchowany jako OSTATNI podetap zgodnie z rekomendacją recon, PO ustabilizowaniu
A/C/E (już zintegrowane, zielone w main).

ZADANIE:
1. **Blok A (ok. 12 hardkodów, komentarz w kodzie "DOW klastra PM NA GRACZA")** — miasto-
   państwo wypowiada wymuszoną wojnę GRACZOWI. Wzorce: `getDiploRelation(csOwnerId,0)`,
   `isPeaceLockedBetween(csOwnerId,0)`, `hasTreaty(...,csOwnerId,0,...)`,
   `chargeWarDeclarationCredibility(csOwnerId,0)`, `breakTreatiesOnWar(csOwnerId,0,false)`,
   `applyAllianceObligationsOnWar(csOwnerId,0)`, `applyDiploEventTracked(csOwnerId,0,...)`,
   `setDiploRelation(csOwnerId,0,newRel)`, `pruneTributeNegotiationsBetween(csOwnerId,0)`,
   `recordWarDeclarationEvent(csOwnerId,0)` — strukturalny bliźniak już zmigrowanej
   `playerDeclareWarOnOwner`/`ownerDeclareWarOn` (Podetap A), ale kierunek odwrotny (miasto-
   państwo → gracz) → **isMe()** (mechanika jawnie "vs gracz", literał `0` jako DRUGI
   argument zamień na `ME()`).
   UWAGA KRYTYCZNA: to jest WYMUSZONA wojna epoki (miasto-państwo/klaster na gracza) —
   dokładnie ta sama rodzina mechanizmu co `P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`
   (zintegrowany wcześniej tego dnia, commit `c966f6b1`), który naprawił routing przez
   `dipLayerIgnoringPlayerFog`. Przeczytaj TEN fix przed edycją Bloku A — upewnij się że
   migracja `0`→`ME()` NIE koliduje z klasyfikatorem `isForcedEpochWarDeclareCmd` ani nie
   cofa tamtej naprawy. Jeśli zauważysz jakikolwiek styk z tamtym kodem — zatrzymaj się i
   zgłoś jako BLOKADĘ zamiast ryzykować cichą regresję.
2. **Blok B (ok. 12 hardkodów, właściwy per-AI-owner tick dyplomacji wewnątrz pętli tury
   świata)** — funkcjonalny odpowiednik już zmigrowanego `runDiplomacyTurnTick` (Podetap
   ENGINE, isMe), ale OSOBNY kod (różne linie, różna sygnatura, `runWorldEndTurn` woła to
   bezpośrednio we własnym ciele, nie przez `runDiplomacyTurnTick`). Wzorce:
   `getDiploRelation(0,ownerId)` (×2), `setDiploRelation(0,ownerId,...)` (×2),
   `getWiarygodnosc(0)`, `ownersShareLandBorderLive(ownerId,0)`,
   `citiesHaveTradeConnection(cities.filter(c=>c.ownerId===0),...)`,
   `relacjeDip.push({partnerId:'0',...})`, `aiDiplomacyStance(aiStub,humanStub,...)` z
   `humanStub={ownerId:0,...}` → **isMe()**, ten sam precedens co `runDiplomacyTurnTick`.

RYZYKO DODATKOWE: `runWorldEndTurn` mógł zostać dotknięty przez RÓWNOLEGŁE tematy tego dnia
(hot-seat Etap 6e render/kamera, inne bugfixy). Przed edycją sprawdź `git log --oneline -- 
gra/src/main.ts | head -30` i upewnij się że rozumiesz aktualny stan funkcji, nie stan z
czasu recon.

REGUŁA PRZECIW SAMOOSZUKIWANIU: bramka no-op PRZED/PO — pełny cykl kilku tur (nie jedna),
identyczne zachowanie dla jednego gracza, mutacja `isMe()`→zawsze `false` musi czerwienić
OBA bloki osobno (nie wystarczy że jeden test łapie oba naraz — jeśli mutujesz tylko Blok A,
test musi to złapać niezależnie od Bloku B i odwrotnie). Żywy dowód Chromium: pełny `endTurn()`
z realną grą, nie symulacja struktury danych. Zero tolerancji na regex-na-tekście zamiast
wykonania kodu (błąd złapany w Podetapie E rundy 1 — nie powtarzaj).

BINARNE KRYTERIUM SUKCESU: (1) oba bloki zmigrowane, zero pozostałych literałów `0` tam gdzie
reprezentują gracza; (2) żywa bramka Chromium: kilka pełnych `endTurn()` z jednym graczem,
PRZED/PO identyczne, zero console.error; (3) mutacja niezależnie czerwieni Blok A i Blok B;
(4) wszystkie istniejące bramki forced-war/dyplomacji (18 bramek z tematu wojny-epoki, patrz
`gra/tools/forced-war-*-test.cjs`, `diplomacy-*-test.cjs`, `wojna-wymuszona-*-test.cjs`) NADAL
zielone — zero regresji na mechanice wymuszonej wojny epoki; (5) `tsc --noEmit` czysty, 5
bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` — WYŁĄCZNIE Blok A i Blok B wewnątrz `runWorldEndTurn` (dokładne granice
  do potwierdzenia świeżym `Read`, NIE całą funkcję — reszta `runWorldEndTurn` poza zakresem)
- `gra/tools/*-test.cjs` — nowa bramka (żywy Chromium, kilka pełnych tur)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-D-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `runDiplomacyTurnTick`, `playerDeclareWarOnOwner`,
`ownerDeclareWarOn`, klasyfikatora `isForcedEpochWarDeclareCmd` i jakiegokolwiek kodu poza
dwoma wskazanymi blokami.

IZOLACJA: worktree `/home/user/wt-6d-PODETAP-D`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-D-Q1`,
baza `origin/main` (świeża, zawiera już zintegrowane Podetapy A/C/E oraz fix wojny epoki).
C-001: zakaz `npm run build`/`dev`; `tsc --noEmit` jedyna dozwolona kompilacja; `node
./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` jedyny dozwolony
build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Workflow,
Sonnet 5 effort high, wymagana szczególna staranność z uwagi na ryzyko) → integracja
orkiestratora. To jest OSTATNI podetap Etapu 6d — po jego integracji cały Etap 6d (dyplomacja)
będzie w pełni zamknięty.
DEPLOY/PUSH: NIE WYKONANO
