STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6A-INPUT-Q1
GOAL: Implementacja pod-etapu 6a planu hot-seat ("input" z tabeli B2 —
klik/zaznaczenie/ruch/atak/marsz/cykl jednostek, BEZ końca tury) na podstawie zamkniętego
recon `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md`
(zintegrowany, commit `941676d5`). Behawioralny no-op przy `humanOwnerIds=[0]` (kryterium
gotowości §C planu: "po każdym podetapie: typecheck + bramki + 20 tur").

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md`
  (dokument źródłowy tej implementacji — 42 miejsca rdzeniowe z cytatem linii przed/po,
  §1 tabele klastrów A-H, §2 rozliczenie liczby, §4 nakładanie z Etapem 4, §5 plan dowodu
  no-op) i `03-obrona-runda1.md` (3 korekty rundy 2 — m.in. A4 `main.ts:33273`,
  rozróżnienie F1-F5 vs D1-D3, wykluczenie `disbandPlayerUnit`).
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §B2 (tabela decyzyjna, wiersz 2: input → `isMe`).
- **main.ts zmienia się codziennie — WSZYSTKIE numery linii z recon MUSZĄ zostać
  zweryfikowane świeżym grepem przed każdą podmianą, nie skopiowane wprost.** Recon był
  pisany na HEAD `43cd1f14`/`c72a0d71` — od tego czasu główna gałąź dostała co najmniej
  2 kolejne commity (rejestr), a w trakcie tej implementacji mogą lecieć inne równoległe
  tematy hot-seat dotykające main.ts (sprawdź `git log --oneline origin/main` na start).

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem, że wszystkie 42 miejsca z recon nadal istnieją pod
   wskazanymi numerami (jeśli plik się przesunął — zaktualizuj numery w swoim raporcie,
   nie w dokumencie recon, który zostaje jako historyczny zapis).
2. Dodaj jednoliniowy alias `isMe(id: number): boolean { return id === ME(); }` w
   `main.ts` obok istniejącego `ME()`/`isHuman()` (rekomendacja recon §0/§3).
3. Zmigruj WSZYSTKIE 42 miejsca rdzeniowe (klastry A-H z recon §1) zgodnie z podaną
   podmianą (`ownerId === 0` → `isMe(ownerId)`, `ownerId !== 0` → `!isMe(ownerId)`,
   literał `0` jako argument funkcji generycznej → `ME()`).
4. Klaster D+F (13 miejsc: main.ts ok. 23277/23289/23332 oraz 33055-33466, patrz recon §4)
   — podłącz PRAWDZIWY parametr `humanOwnerId` funkcji `endActiveHumanTurn(humanOwnerId)`
   (dziś `void`-owany, main.ts ok. 33000) zamiast literału `0`/wywołania `isMe(...)` z
   globalnego `ME()` — to jest hak, który Etap 4b świadomie zostawił na ten temat
   (recon §4: "Runda implementacji Etapu 6a MUSI podłączyć `humanOwnerId` we WSZYSTKICH
   13 pozycjach klastra D+F"). D1-D3 są w oddzielnych funkcjach (`executePlannedMarchesEndTurn`/
   `applyMarchSegmentInstant`) wołanych z wnętrza `endActiveHumanTurn` — przekaż im
   `humanOwnerId` jako parametr zamiast literału, analogicznie do F1-F5.
5. Klaster A3 (`game/army-cycle.ts:55`, `cyclablePlayerArmyLeadsBase`) — moduł CZYSTY, nie
   importuje `human-owners.ts`. Dodaj wstrzykiwany parametr `isMe: (u: RuntimeUnit) => boolean`
   (wzorzec identyczny do istniejącego `canMove`), main.ts woła z `(u) => isMe(u.ownerId)`.
6. Zaktualizuj komentarz `main.ts` ok. 23333-23336 (odwołuje się dosłownie do "gracza"/
   "owner 0" — recon flagował to jako do zrobienia w tej rundzie).
7. NIE dotykaj: tooltip/panel kontekstowy (podetap b), build-mode/HUD (b/c),
   `afterPlayerUnitSpawned` (c), `playerIsAtWarWith` (d), `disbandPlayerUnit` (c) — patrz
   tabela wykluczeń recon §2, świadomie poza zakresem tego tematu.
8. Napisz bramkę dowodu no-op zgodnie z planem recon §5: Chromium (nie headless Node —
   większość miejsc jest DOM-bound), sekwencja realnych zdarzeń (klik jednostki, klik
   heksu-ruch, klik wrogiej jednostki-atak, marsz wieloturowy + koniec tury, Spacja-cykl),
   PRZED i PO na tym samym seedzie, 20 tur, porównanie `explored`/`plannedMarches`/
   pozycje-HP-ruchLeft wszystkich jednostek/`selectedId`/log tury — bit-w-bit identyczne.
   Wzorzec: `gra/tools/hotseat-etap4-noop-test.cjs` i `gra/tools/hotseat-etap5-no-leak-test.cjs`
   (retry+fallback Chromium, SHA lub deep-equal porównanie stanu).

BINARNE KRYTERIUM SUKCESU: wszystkie 42 miejsca zmigrowane (grep po `ownerId\s*(===|!==)\s*0`
w zakresach klastrów A-H daje ZERO trafień), `isMe`/`ME()` używane konsekwentnie, klaster D+F
faktycznie używa parametru `humanOwnerId` (nie globalnego `ME()`) — sprawdzalne przez to że
`endActiveHumanTurn(X)` z `X !== ME()` daje INNE zachowanie dla tych 13 miejsc niż dla
pozostałych 29 (dowód architektury gotowej pod przyszły hot-seat, mimo że dziś zawsze
`X === ME()`). Nowa bramka PASS przy `humanOwnerIds=[0]` (no-op). `tsc --noEmit` czysty.
5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie klastry A-H z recon + alias `isMe` + podłączenie
  `humanOwnerId` w D+F + komentarz 23333-23336)
- `gra/src/game/army-cycle.ts` (parametr `isMe` w `cyclablePlayerArmyLeadsBase`, wywołania)
- `gra/tools/hotseat-etap6a-input-noop-test.cjs` (NOWY plik, bramka dowodu no-op)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-INPUT-Q1/*`
Zakaz `git add -A`. Zakaz dotykania plików spoza tej listy (w tym `ui/hotSeatHandoff.ts`,
`human-owners.ts` — te są gotowe, nie wymagają zmian tego tematu).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania migracji za kompletną na podstawie samej
liczby zmienionych linii (42) bez świeżego grepa `ownerId\s*(===|!==)\s*0` w całym
main.ts potwierdzającego, że w zakresie klastrów A-H nie zostało ani jedno przeoczone
miejsce — a także bez REALNEGO dowodu (nie deklaracji), że bramka no-op czerwienieje
na kodzie SPRZED tej rundy (podmień świeżo zbudowany bundle na wersję bazową i pokaż
FAIL, dokładnie wzorzec Etapu 4/5).

IZOLACJA: worktree `/home/user/wt-hotseat-etap6a-input`, gałąź
`autobot/R-HOTSEAT-ETAP6A-INPUT-Q1`, baza `origin/main` @ `fe74fb0f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo,
np. /tmp/...> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only przez orkiestratora, potem Etap 6b (UI, ~75
miejsc — recon dispatchowany równolegle jako osobny temat).
DEPLOY/PUSH: NIE WYKONANO
