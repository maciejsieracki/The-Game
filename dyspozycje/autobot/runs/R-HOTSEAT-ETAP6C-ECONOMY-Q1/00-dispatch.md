STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: Implementacja pod-etapu 6c planu hot-seat ("ekonomia" z tabeli B2) na podstawie
zamkniętego recon
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/01-operator-runda1-analiza.md`
(zintegrowany, commit `14960b8e`). **Docelowy alias to `isHuman(id)`, NIE `isMe(id)`**
— ekonomia liczy WSZYSTKICH ludzi jednocześnie w tej samej fazie EOT (w odróżnieniu od
input/UI/render gdzie liczy się wyłącznie aktywny fotel). Behawioralny no-op przy
`humanOwnerIds=[0]`.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/01-operator-runda1-analiza.md`
  (dokument źródłowy, PO poprawkach Obrony — suma 32 miejsc, main.ts=22 + game/*.ts=5 +
  Klaster D main.ts=5 (Etap4prep już zmigrowany, wykluczony) — czytaj CAŁY dokument z
  poprawkami §0/§3/§4, nie tylko pierwszą wersję).
- **KRYTYCZNE ZNALEZISKO tego recon**: blok bankowania Skarbiec/Nauka/utrzymanie
  wewnątrz `runWorldEndTurn()` to REALNY ZAPIS ekonomii gracza (nie odczyt HUD) —
  zahardkodowana ścieżka RÓWNOLEGŁA do generycznej pętli AI. To jest WYSOKIE RYZYKO
  IMPLEMENTACYJNE (przepisanie logiki, nie mechaniczna podmiana) — przeczytaj ten
  fragment recon ze szczególną uwagą, zweryfikuj świeżo dokładne linie (main.ts
  zmienił się od integracji Etapu 6b — `runWorldEndTurn()` już PRZYJMUJE i UŻYWA
  parametru `humanOwnerId` dla 11 write-site'ów cache HUD, zintegrowane w
  `R-HOTSEAT-ETAP6B-UI-Q1`, commit `e9e6a325` — Twoje zmiany w tej samej funkcji muszą
  koegzystować z tym, co 6b już tam wstawiło, nie kolidować).
- **DODATKOWE ZNALEZISKA z Final Control/Evaluatora Etapu 6b** (świeżo zintegrowane,
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-UI-Q1/02-evaluator-runda1.md`,
  `03-operator-runda1.md`): 2 miejsca jawnie PRZYPISANE temu tematowi jako poza jego
  zakresem: (1) `game/turn-economy.ts:1219` (`sumEconomyForPlayerCities`,
  `ownerId===0`) — zweryfikuj świeżo numer linii; (2) `gra/src/ui/cityPanel.ts` (dwa
  literały `ownerId: 0` ok. linii 7476/7575, w `buildBuildingDetailCardViaEntityCard`/
  `_legacyBuildBuildingDetailCard`) → konsumowane przez `buildingWorkCost`
  (game/production.ts) → `applyDifficultyCostMultiplier` → **`isPlayerOwner`**
  (`game/difficulty-cost.ts:44-46`, `return ownerId === 0`) — TA funkcja jest
  rzeczywistym celem migracji (nie same literały w cityPanel.ts, które są kosmetyczne
  bez migracji funkcji docelowej). Zdecyduj: czy `isPlayerOwner` należy do (c) ekonomia
  (trudność/koszt) — jeśli tak, zmigruj ją tu na `isHuman(ownerId)` i wtedy TAKŻE
  popraw 2 literały w cityPanel.ts (poza pierwotną allowlistą 6b, ale logicznie należące
  do tej migracji) — jeśli uznasz że to (d) dyplomacja albo inna kategoria, jawnie to
  uzasadnij i zostaw jako kolejny odłożony punkt.
- **main.ts zmienia się codziennie — WSZYSTKIE numery linii z recon MUSZĄ zostać
  zweryfikowane świeżym grepem przed każdą podmianą.** Recon był pisany PRZED integracją
  Etapu 6b — main.ts dziś ma już zintegrowany `isMe`/`ME()` (Etap 6a) i 78 migracji UI
  (Etap 6b, w tym częściowa parametryzacja `runWorldEndTurn(humanOwnerId)`).
- 1 pozycja jawnie odłożona jako niejednoznaczna przez recon: main.ts ok. 30169
  (rebelia) — recon nie rozstrzygnął jej kategorii, zweryfikuj świeżo i albo zmigruj z
  uzasadnieniem, albo jawnie odłóż z uzasadnieniem, nie milcz.
- **Uwaga o równoległych lanach**: w chwili tego dispatchu mogą równolegle trwać
  `R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1` (main.ts ok. 2400-2520 + 10380-10400 — region
  bootstrapu renderu, POZA Twoim zakresem) i `R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1`
  (main.ts ok. 7500-11200, funkcje AI-roster — POZA Twoim zakresem). Sprawdź świeżym
  `git status`/`git diff` w tamtych worktree jeśli istnieją, żeby potwierdzić brak
  nakładania z Twoimi 32 pozycjami (recon 6c nie wspomina tych regionów, ryzyko niskie,
  ale zweryfikuj).

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem, że wszystkie 32 miejsca core z recon (22 main.ts + 5
   game/*.ts + 5 Klaster D — sprawdź czy Klaster D już pokryty przez Etap4prep, jak
   twierdzi recon) nadal istnieją pod wskazanymi numerami.
2. Zmigruj WSZYSTKIE miejsca core na `isHuman(ownerId)` (NIE `isMe` — patrz GOAL).
3. Zaadresuj krytyczne znalezisko: blok bankowania w `runWorldEndTurn()` — podłącz
   `isHuman`/pętlę po `humanOwnerIds` tam gdzie dziś jest zahardkodowana ścieżka dla
   ownera 0, koegzystując z parametryzacją `humanOwnerId` którą Etap 6b już wprowadził
   do tej samej funkcji.
4. Rozstrzygnij i zaadresuj `isPlayerOwner` (`game/difficulty-cost.ts:44-46`) — patrz
   KONTEKST wyżej.
5. `game/*.ts` (turn-economy.ts, empire-food.ts, society-inputs.ts) — 5 miejsc core,
   zmigruj zgodnie z receptą recon.
6. Rozstrzygnij pozycję main.ts:30169 (rebelia) — nie zostawiaj bez decyzji/uzasadnienia.
7. Napisz bramkę dowodu no-op zgodnie z planem recon §5/§6: mieszany — headless Node dla
   klastrów czystej logiki (jeśli recon tak wskazuje), Chromium dla klastrów HUD-bound
   (write-site cache) i DOM-bound (auto-ulepszenia). Wzorzec: bramki Etapów 6a/6b.

BINARNE KRYTERIUM SUKCESU: wszystkie 32 miejsca core zmigrowane na `isHuman` (grep
`ownerId\s*(===|!==|=|\?\?)\s*0` w zakresach klastrów daje ZERO trafień), blok
bankowania w `runWorldEndTurn()` faktycznie liczy WSZYSTKICH `humanOwnerIds` (nie tylko
0), jawna decyzja o `isPlayerOwner`/rebelii main.ts:30169. Nowa bramka PASS i
nietautologiczna. `tsc --noEmit` czysty. 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie 22+5 core + blok bankowania w `runWorldEndTurn()`,
  BEZ dotykania regionu bootstrapu renderu main.ts~2400-2520/10380-10400 ani funkcji
  AI-roster main.ts~7500-11200 — te są POZA zakresem, zajęte równolegle)
- `game/turn-economy.ts`, `game/empire-food.ts`, `game/society-inputs.ts`,
  `game/difficulty-cost.ts` (jeśli decyzja z pkt 4 to migracja `isPlayerOwner`)
- `gra/src/ui/cityPanel.ts` (WYŁĄCZNIE 2 literały ok. linii 7476/7575, jeśli decyzja z
  pkt 4 to migracja)
- `gra/tools/hotseat-etap6c-economy-noop-test.cjs` (NOWY plik, bramka dowodu no-op)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-ECONOMY-Q1/*`
Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz mechanicznej podmiany bloku bankowania bez
zrozumienia że to jest ZAPIS, nie odczyt — przetestuj żywo z `humanOwnerIds` symulującym
drugi fotel (nawet jeśli produkcyjnie dziś zawsze `[0]`) żeby potwierdzić że logika
faktycznie obsłuży drugiego człowieka poprawnie, nie tylko że kompiluje się bez błędu.
Zakaz pominięcia świeżej weryfikacji nakładania z równoległymi lanami (6e-prereq,
6f-start).

IZOLACJA: worktree `/home/user/wt-hotseat-etap6c-economy`, gałąź
`autobot/R-HOTSEAT-ETAP6C-ECONOMY-Q1`, baza `origin/main` @ `f4f745f4` (Etap 6a+6b już
zintegrowane w tej bazie).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów — zawsze wymagana runda Obrony przed kolejnym Evaluatorem.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only przez orkiestratora, potem Etap 6d
(dyplomacja — wymaga ABC właściciela co do zakresu przed dispatchem) sekwencyjnie.
DEPLOY/PUSH: NIE WYKONANO
