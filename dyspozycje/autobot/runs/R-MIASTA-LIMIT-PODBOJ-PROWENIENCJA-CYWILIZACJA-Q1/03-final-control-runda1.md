STATUS: PASS
DOMAIN: GAME
TEMAT: R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1
GOAL: Limit miast per cywilizacja rozróżnia prowenincję zdobytego miasta — od
niezależnego miasta-państwa liczy się (bez zmian), od innej cywilizacji (czy to jej
własne miasto, czy miasto-państwo które ta cywilizacja WCZEŚNIEJ sama przejęła) nie
liczy się (częściowe odwrócenie R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1, ECHO 2026-09-07).

NIEZALEŻNA KONTROLA WYRYWKOWA (Final Control, samodzielne uruchomienia, nie na słowo
Operatora/Evaluatora):

(a) KOLEJNOŚĆ ODCZYTU vs clearCityStateFlagOnCapture — sprawdzone osobiście w kodzie
(nie w opisie), w OBU funnelach:
- `post-battle-map.ts::applyCityCaptureAfterBattle` — `wasIndependentCityState =
  wasIndependentCityStateBeforeCapture(city)` czytane na SAMYM POCZĄTKU funkcji (zaraz
  po `prevOwner = city.ownerId`), a więc PRZED `city.ownerId = atkOwner` (linia ~488) i
  PRZED `captureOpts?.onOwnerChanged?.(city)`. Zweryfikowałem osobno w main.ts (linia
  26983), że `onOwnerChanged` faktycznie woła `clearCityStateFlagOnCapture(c)` — hak
  jest jedynym miejscem gaszenia flagi dla tej ścieżki i wykonuje się PO ustawieniu
  nowego właściciela. Kolejność poprawna.
- `main.ts::resolveSiegeSurrender` — `wasIndependentCityState` czytane zaraz po `const
  oldOwner = city.ownerId;`, a więc PRZED `city.ownerId = newOwner;` (linia niżej) i
  PRZED `clearCityStateFlagOnCapture(city)` (jeszcze niżej). Kolejność poprawna.
Wniosek: w OBU funnelach predykat czyta stan SPRZED tego konkretnego przejęcia — zgodnie
z wymaganiem dispatchu.

(b) FORMUŁA LIMITU NIETKNIĘTA — `git diff 3f7c68e3` na `cities.ts` ograniczony do nowej
funkcji `wasIndependentCityStateBeforeCapture` (JSDoc + 3-liniowe ciało, zero zmian w
`canFoundCity`/`countsTowardCityFoundingLimit`). Grep `cityLimitBase|era-1|base +` na
całym diffie trzech plików źródłowych — zero trafień. Osobiście odczytany aktualny kod
`canFoundCity` (cities.ts ~1161-1163): `base = opts.gameConfig.cityLimitBase ?? 10`,
`limit = base + (era-1)*5` — identyczny jak przed tematem.

(c) ZACHOWANIE DLA NIEZALEŻNEGO MIASTA-PAŃSTWA BEZ ZMIAN — potwierdzone i logiką kodu
(`if (!wasIndependentCityState) city.foundedByOwner = false;` — gałąź NIE wykonuje się
gdy `wasIndependentCityState===true`, więc `foundedByOwner` zostaje niezmienione, zwykle
`true`, więc `countsTowardCityFoundingLimit` nadal `true`), i osobnym uruchomieniem testu
(scenariusz (i) niżej) — regres zachowania sprzed tematu potwierdzony aktywnie, nie
milcząco.

(d) `git diff --stat` względem bazy `3f7c68e3` (potwierdzone `git fetch origin main`;
origin/main przesunął się o 1 commit, `22aea4fc`, dyplomacja/etykieta negocjacji — bez
związku z tym tematem, `3f7c68e3` nadal jednoznaczna wspólna baza) — WYŁĄCZNIE pliki z
allowlisty:
  gra/src/game/cities.ts               | 34 ++++++++++++++
  gra/src/game/post-battle-map.ts       | 22 +++++++--
  gra/src/main.ts                       | 18 +++++--
  gra/tools/city-limit-conquered-test.cjs | 191 +++++++++++++++-----
  + raporty własne w dyspozycje/.../R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1/
Brak zmian w `gra/`-artefaktach spoza allowlisty, brak `git add -A` (zero
przypadkowych plików w diffie), `git diff --check` czysty.

(e) TESTY URUCHOMIONE SAMODZIELNIE (nie na słowo Operatora/Evaluatora), w
`/home/user/wt-miasta-limit-prowenienencja/gra`:
- `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0, brak błędów.
- `node tools/city-limit-conquered-test.cjs` — 24 passed, 0 failed. Przeczytałem pełny
  output: trzy binarne scenariusze z dispatchu są POKRYTE osobnymi, jednoznacznymi
  asercjami —
    (i) podbój BEZPOŚREDNIO od niezależnego miasta-państwa → `foundedByOwner` NIE
        ustawiane na false, miasto nadal zużywa pulę, limit 9+1=10 wyczerpuje founding
        (regres BEZ ZMIAN — potwierdzone aktywnie, nie założone),
    (ii) podbój zwykłego miasta obcej cywilizacji (nigdy nie było miastem-państwem) →
        `foundedByOwner=false`, limit NIE wyczerpany po 9+1, founding nadal dozwolony
        (ZMIANA wprowadzona tym tematem),
    (iii) podbój miasta-państwa WCZEŚNIEJ przejętego przez inną cywilizację (a więc w
        momencie TEJ konkwisty startCityState już `false`) → `foundedByOwner=false`
        ponownie jawnie ustawione, NIE liczy się — dokładnie rozróżnienie od (i), którego
        domagało się ECHO właściciela.
  Żaden z trzech scenariuszy nie jest pokryty przybliżeniem czy asercją pośrednią — każdy
  ma osobny, nazwany test na `foundedByOwner`/`countsTowardCityFoundingLimit` przed i po
  konkwiście.
- `node tools/logic-test.cjs` — 213/213 (baseline z R-PROC-AUTOBOT.md §6, bez zmian).
- Weryfikacja DWÓCH pre-istniejących FAIL na FAKTYCZNIE CZYSTYM `origin/main` @
  `3f7c68e3`: założyłem OSOBNY `git worktree` w
  `/tmp/.../scratchpad/clean-main-check` na commit `3f7c68e3` (potwierdzone
  `git merge-base --is-ancestor 3f7c68e3 origin/main` = TAK), zlinkowałem `node_modules`
  z worktree tematu (potwierdzone identycznym md5 `package-lock.json` między `3f7c68e3` a
  branchem tematu — bezpieczne, nie ukrywa różnicy w zależnościach) i uruchomiłem tam
  OBA testy niezależnie od jakiegokolwiek zapewnienia Operatora/Evaluatora:
    - `tools/flaga-mp-nie-gasnie-test.cjs` → `31 PASS, 1 FAIL` — identyczny FAIL:
      `T14: w main.ts zostaly dokladnie 2 reczne przypisania startCityState (oba to
      spawn), jest 3` — ten sam wynik uruchomiony też na branchu tematu (identyczny
      output, ten sam T14).
    - `tools/okolica-ownership-change-reconcile-test.cjs` → `12/15 (3 FAIL)` — te same
      trzy nazwane niepowodzenia (`(a)` kapitulacja głodowa, `(b)` wchłonięcie
      dyplomatyczne, `post-battle-map.ts::applyCityCaptureAfterBattle` ustawienie ownerId
      przed onOwnerChanged) — identyczne na branchu tematu.
  Oba FAIL są zatem POTWIERDZONE jako pre-istniejące, niepowiązane z tym tematem —
  zweryfikowane osobiście, nie na cudze zapewnienie. Worktree kontrolny usunięty po
  weryfikacji (`git worktree remove --force`).

DODATKOWA KONTROLA: przeczytałem osobiście pełny diff wszystkich trzech plików
źródłowych (cities.ts, post-battle-map.ts, main.ts) linia po linii — komentarze JSDoc i
inline są spójne z kodem, żadna zmiana nie wykracza poza `resolveSiegeSurrender` w
main.ts (reszta pliku nietknięta poza dodaniem importu w istniejącym bloku).

BLOKADY: brak.

RUNDY: 1/5
NASTĘPNY KROK: integracja allowlist-only przez orkiestrator → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
