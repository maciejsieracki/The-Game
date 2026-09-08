STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1
GOAL: Napraw regres — na ekranie „Wynik bitwy" (i prawdopodobnie w innych miejscach
korzystających z tego samego medalionu, np. preBattle) portret gracza (atakującego,
niebędącego barbarzyńcą ani miastem-państwem) przestał się wyświetlać, pokazuje się
generyczna sylwetka zamiast portretu władcy. Zgłoszenie właściciela (zrzut ekranu, sesja
testowa single-player, `main` @ `6573df80` / bundle FALA 362): "wcześniej były widoczne
symbole infografiki graczy z portretem gracza i państwa miasta, z którymi walczymy, a w
tej chwili to znikło".

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Wstępna diagnoza (orkiestrator, przed dispatchem, NIE traktuj jako pewnik):
  - `gra/src/ui/postBattleSummary.ts` (~linia 137-139): `portraitUrl` = null gdy
    `side.isBarbarian || side.isCityState || !civIconId`; inaczej
    `leaderPortraitUrl(civIconId, era)`.
  - Dane `side` pochodzą z `preBattleSideFromRoster()` w `gra/src/main.ts` (~linia 25258-25275):
    `civId: civTypeForOwner(ownerId)`, `isCityState: portraitForceCultureIcon(ownerId)`,
    `isBarbarian: isBarbarian(ownerId)`.
  - `civTypeForOwner(0)` (main.ts ~3439-3442) i `portraitForceCultureIcon` (main.ts ~8087-8094,
    woła `shouldForceCultureIconForOwner` z `game/display-names.ts` ~linia 110-127, ktora ma
    `if (ownerId <= 0) return false;` na starcie) — obie ścieżki dla gracza (ownerId 0) NIE
    zostały dotąd zmigrowane literałami hot-seat (Etapy 6a-6f/7 zintegrowane dotąd NIE dotykają
    tych dwóch funkcji) i na pierwszy rzut oka nadal zwracają poprawne wartości dla gracza —
    ALE to nie znaczy że regres nie pochodzi STĄD pośrednio (np. zmiana w `aiOwnerCivMap`,
    `clusterCapitalOwnerIds`, albo w czymś co te funkcje konsumują). Zweryfikuj świeżo, nie
    zakładaj że skoro literały wyglądają OK to problem jest gdzie indziej.
  - `leaderPortraitUrl(civId, era)` (`gra/src/ui/leaderPortraits.ts` ~linia 195-207) zwraca
    `null` gdy `PORTRAIT_MAP[key]` nie istnieje dla danego `civId` (lowercase) — możliwe że
    problem leży w danych (PORTRAIT_MAP/civs.json) albo w niepoprawnym `civId`/`era` docierającym
    do tej funkcji, NIE koniecznie w logice isCityState/isBarbarian.
- **Ustal PRAWDZIWĄ przyczynę PRZED naprawą** — to jest kluczowe, bo równolegle trwa duża seria
  migracji hot-seat (Etapy 6a-6f/7, docs w `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`,
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP*`). Zrób `git log --oneline -- gra/src/ui/postBattleSummary.ts
  gra/src/ui/leaderPortraits.ts gra/src/battle/battleScene.ts gra/src/game/display-names.ts`
  i sprawdź, czy któryś z ostatnich commitów (hot-seat albo inny) faktycznie dotyka tych
  plików/funkcji w sposób który mógłby to zepsuć. Jeśli TAK — to jest regres z konkretnego
  commita, napraw punktowo. Jeśli NIE — możliwe że to STARSZY, wcześniej nieujawniony bug
  (np. w danych civs.json/PORTRAIT_MAP), niezwiązany z hot-seat.
- **Odtwórz błąd na żywo w Chromium** (build + realna bitwa gracz vs AI/miasto-państwo,
  zrzut ekranu PRZED naprawą pokazujący brak portretu, PO naprawą pokazujący portret) —
  to jest temat wizualny/UX, wymaga dowodu z żywej przeglądarki, nie tylko czytania kodu.

ZADANIE:
1. Świeżo zweryfikuj cały łańcuch danych: `preBattleSideFromRoster` → `showPostBattleSummary`
   → `postBattleSummary.ts` render, dla PRAWDZIWEJ bitwy gracz (ownerId 0, nie barbarzyńca,
   nie miasto-państwo) vs dowolny przeciwnik.
2. Ustal git-historycznie czy to regres konkretnego commita (bisect jeśli trzeba) czy
   starszy, dotąd nieujawniony bug.
3. Napraw przyczynę źródłową (nie tylko objaw) — jeśli to literał/dana, popraw tam gdzie
   naprawdę leży problem.
4. Dowód: żywy zrzut Chromium PRZED (portret brakuje) i PO (portret widoczny) naprawie,
   dla gracza-atakującego i gracza-obrońcy (dwa różne kierunki bitwy, wzorem istniejących
   call site'ów main.ts ~25486/26124/28146).
5. Napisz/zaktualizuj bramkę dowodu w `gra/tools/` jeśli nie istnieje już dedykowana —
   sprawdź najpierw czy istnieje test pokrywający ten obszar (np. `postbattle`/`leader-portrait`
   w nazwie) zanim napiszesz nowy.

BINARNE KRYTERIUM SUKCESU: portret gracza (i AI, gdy dotyczy) wraca na ekranie „Wynik bitwy"
dla walk gracz-vs-AI/gracz-vs-miasto-państwo, potwierdzone żywym zrzutem Chromium PRZED/PO;
ustalona i udokumentowana prawdziwa przyczyna (regres konkretnego commita albo starszy bug).
`tsc --noEmit` czysty, 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/ui/postBattleSummary.ts`, `gra/src/ui/leaderPortraits.ts`,
  `gra/src/battle/battleScene.ts`, `gra/src/game/display-names.ts`, `gra/src/ui/preBattle.ts`
  (WYŁĄCZNIE jeśli diagnoza faktycznie wskaże któryś z tych plików — nie zgaduj z góry,
  zweryfikuj najpierw)
- `gra/src/main.ts` — WYŁĄCZNIE `preBattleSideFromRoster`, `civTypeForOwner`,
  `portraitForceCultureIcon`, jeśli diagnoza tam wskaże (BEZ dotykania funkcji zajętych przez
  równoległe lany hot-seat — zweryfikuj świeżo `git diff`/`git status` w
  `/home/user/wt-hotseat-etap6e-render`, `/home/user/wt-hotseat-etap6d-recon-remainder`,
  `/home/user/wt-hotseat-etap6f-part2-recon`, `/home/user/wt-hotseat-etap7-fixture-bump`
  przed edycją, żeby potwierdzić brak nakładania)
- `gra/tools/*-test.cjs` (nowa albo zaktualizowana bramka dowodu)
- `dyspozycje/autobot/runs/P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1/*`
Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji naprawy bez żywego zrzutu Chromium
PRZED/PO. Zakaz przyjęcia pierwszej hipotezy (isCityState/civTypeForOwner) bez faktycznego
sprawdzenia w debugerze/live że to rzeczywiście ta ścieżka — dane pokazane w tym dispatchu
to WSTĘPNA hipoteza orkiestratora, nie potwierdzona diagnoza.

IZOLACJA: worktree `/home/user/wt-bitwa-portret-gracza`, gałąź
`autobot/P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1`, baza `origin/main` @ `6573df80`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — temat wizualny, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
