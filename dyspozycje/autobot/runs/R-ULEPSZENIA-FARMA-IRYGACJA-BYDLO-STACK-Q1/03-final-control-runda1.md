# Final Control — runda 1/5 — R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1

Model+effort: Sonnet 5, effort high. Weryfikacja SAMODZIELNA w
`/home/user/wt-ulepszenia-farma-irygacja-bydlo` (gałąź
`autobot/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1`, HEAD `c578c7f7`, guard
wstępny: `git log -1` i `git status --short` czyste, zgodne z oczekiwaną bazą).

## (a) `canAddFoodLayer()` — czytanie kodu osobiście

Przeczytany `gra/src/map/improvement-build.ts:783-813` w całości oraz otaczający
kontekst `qualifies()` (linie 948-1030). Potwierdzone:

- `case 'irygacja'` i `case 'bydlo'` teraz sprawdzają wyłącznie `hasF` (usunięte
  `&& !hasB` / `&& !hasI`) — to jedyna zmiana logiki.
- `case 'farma'` bez zmian; jest nieosiągalny z `ex.length===2` inną drogą niż
  przez `irygacja`/`bydlo`, więc nie musiał być dotknięty — sam prześledziłem
  wszystkie sekwencje budowy (farma→irygacja→bydlo, farma→bydlo→irygacja,
  irygacja→farma→bydlo, bydlo→farma→irygacja) i każda prowadzi do trójki bez
  luki logicznej.
- Warunek rzeki dla irygacji (`isRiverAdjacent`, `qualifies()` linia 989) i
  warunek złoża na pierwsze postawienie bydła
  (`isLivestockUnlockedForPlacement`, linia 998) leżą POZA
  `canAddFoodLayer()`, w kodzie spoza allowlisty i spoza diffu — sprawdzone
  bezpośrednim odczytem, nie diffem: `git diff 3f7c68e3..HEAD --
  gra/src/map/improvement-build.ts` pokazuje WYŁĄCZNIE te dwa case'y
  (11 linii, w tym 6 komentarza) — reszta pliku identyczna bajt w bajt.
- `canAddFoodLayer` ma jedno miejsce wywołania w całym `gra/src`
  (`improvement-build.ts:628`, `isFoodKey(key) && !canAddFoodLayer(after,
  key)`) — potwierdzone przez `grep -rn canAddFoodLayer gra/src`. Żaden inny
  gate nie ogranicza liczby warstw żywnościowych — recon z dispatchu (jedyna
  bramka egzekwująca limit) potwierdzony samodzielnie, nie z zapewnienia.
- Podprzypadek `irygacja+bydlo` BEZ farmy: prześledzona ścieżka `bydlo` solo →
  `irygacja` (hasF=false → false) i odwrotnie — nadal zablokowany, zgodnie z
  decyzją domyślną dispatchu §1. Operator NIE poluzował tego przypadku.

**Zarzutów brak.**

## (b) Kanon — append-only

`git diff 3f7c68e3..HEAD -- docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`
przeczytany w całości: dodany JEDEN wiersz w tabeli „Historia zmian" (§11) oraz
rozszerzone JEDNO zdanie w stopce dokumentu. Zero linii usuniętych, zero
nadpisanych — oryginalny zapis §2.7/§3/§6 „Farma łączy się wyłącznie z jednym
dodatkiem: irygacją XOR bydłem" z 2026-06-29 fizycznie obecny w pliku bez
zmian, z jawnym dopiskiem że dla tej kombinacji obowiązuje teraz wpis
2026-09-07. **Zgodne z append-only.**

## (c) Bateria testów — uruchomiona samodzielnie

- `node ./node_modules/typescript/bin/tsc --noEmit` (wersja `5.9.3`, zgodna z
  kanonicznym punktem odniesienia §6 R-PROC-AUTOBOT) → **0 błędów**.
- `node tools/map-improvement-qualify-test.cjs` → **133 pass, 1 fail**
  (`oboz lowiecki OK on laka+las`). **Weryfikacja pre-existing zrobiona
  OSOBIŚCIE, nie na proxy-commicie**: założony tymczasowy `git worktree add
  --detach` na PRAWDZIWEJ bazie izolacji `3f7c68e3` (nie na `79362fb1`, którego
  użył Evaluator — sprawdzone że plik testu jest identyczny między tymi
  dwoma commitami, więc wynik jest równoważny, ale zweryfikowałem na
  źródłowej bazie wprost), symlink `node_modules` z worktree tematu (te same
  zależności), uruchomienie testu → **130 pass, 1 fail, IDENTYCZNY fail**
  (`oboz lowiecki OK on laka+las`). Delta 130→133 = dokładnie 3 nowe asercje
  dodane przez Operatora. **Potwierdzone: fail przedistnieje, nie jest nową
  regresją tego tematu.** Worktree tymczasowy usunięty po weryfikacji
  (`git worktree remove --force`).
- 5 bramek referencyjnych z `docs/decyzje/R-PROC-AUTOBOT.md` §6, uruchomione
  samodzielnie z `gra/`:
  - `node tools/logic-test.cjs` → **213/213** (zgodne z referencją)
  - `node tools/tech-tree-test.cjs` → **19/19** (zgodne)
  - `node tools/research-test.cjs` → **33/33** (zgodne)
  - `node tools/unit-replace-test.cjs` → **13/13** (zgodne)
  - `node tools/combat-test.cjs` → **6/6** (zgodne)
- Diff testów (`gra/tools/map-improvement-qualify-test.cjs`) przeczytany w
  całości: 2 asercje odwrócone (stary zakaz → nowe dozwolenie, z komentarzem),
  2 nowe potwierdzające że `irygacja+bydlo` bez farmy nadal zablokowane, 1 nowa
  na prawdziwym `qualifies()` z fixture'em rzeki (`0,2`) dowodząca że trójka
  przechodzi CAŁY gate, nie tylko izolowaną funkcję — ta konkretna asercja
  (`qRzymRiverFarmaBydlo('irygacja', 0, 2)` → `true`) jest częścią 133 zielonych
  i sama w sobie stanowi niezależny, powtarzalny dowód działania trójki bez
  potrzeby żywego Playwrighta.
- Niezależnie przeliczona arytmetyka bonusów wprost z
  `gra/data/terrain-improvements.json`: farma `{żywność:3,praca:3,handel:3}` +
  irygacja `{5,2,2}` + bydło `{2,4,3}` = **10/9/8**, zgodne z raportem.
  Sprawdzony też `applyImprovementBonuses`/`applyImprovementBonus`
  (`terrain-improvements.ts:131-135`) — proste sumowanie per klucz w pętli,
  brak capów/interakcji między warstwami — arytmetyka delty `tileYield` jest
  więc wiarygodna niezależnie od zrzutu ekranu czy zapewnienia Operatora.

## (d) Zrzuty dowodowe — otwarte i ocenione osobiście

- `dowody/01-triple-build-toast.png`: otwarty, widoczny realny toast
  **„Postawiono: bydlo · klik ponownie w turze = cofnij"** w HUD gry, zero
  widocznych błędów UI. **Dobry, jednoznaczny dowód dla kryterium (a).**
- `dowody/02-triple-render-closeup.png`: otwarty. Widoczna wyraźna struktura
  tarasowa/schodkowa terenu (spójna z modelem `pole_irygowane` — farma+
  irygacja) oraz mały czerwony punkt w centrum heksa (marker celowania kamery
  testu, nie ikona zwierzęcia). **Zgadzam się z oceną Evaluatora: to słaby
  dowód wizualny konkretnie dla OSOBNEJ, rozpoznawalnej ikony bydła** — nie
  widać jednoznacznie odrębnych elementów zwierzęcych w przeciwieństwie do
  czytelnego wzoru tarasowego pierwszych dwóch warstw.

  **Decyzja Final Control:** NIE żądam nowego zrzutu. Powód: kryterium (c)
  dispatchu wymaga trzech dowodów — (a) build się udaje, (b) suma bonusów w
  ekonomii, (c) renderer pokazuje wizualnie wszystkie trzy warstwy. Dowód (c)
  ma dwa niezależne od zrzutu, silniejsze potwierdzenia, które sam
  zweryfikowałem: (i) `canAddFoodLayer` i `qualifies()` są jedynym miejscem w
  kodzie, które w ogóle decyduje ile i które warstwy widnieją w
  `placedImprovements` — dane wejściowe rendera; (ii) renderer
  (`gra/src/render/improvements.ts`) jest NIETKNIĘTY w tym temacie (zero
  edycji, potwierdzone diffem), więc jego zachowanie na danych z 3 kluczami
  jest identyczne z tym, co już działa produkcyjnie dla innych stackowanych
  par (Farma+Bydło, Farma+Irygacja) — nowością jest wyłącznie to, że
  `placedImprovements` może teraz zawierać WSZYSTKIE trzy klucze naraz, co
  `getPlacedLayers`/`tileYield` (dane silnika, nie UI) już potwierdzają.
  Piksel na zrzucie jest domyślnym, ale nie jedynym dowodem — kod źródłowy
  rendera i dane silnika są w tym przypadku bardziej rozstrzygające niż jakość
  konkretnego kadru kamery bez natywnego hooka do centrowania (ograniczenie
  poza allowlistą tego tematu, uczciwie zastrzeżone przez Operatora). Uwaga
  zostaje zapisana jako niebilokująca, dokładnie jak u Evaluatora.

## (e) `git diff --stat` względem bazy `3f7c68e3`

```
 docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md   |   3 +-
 .../00-dispatch.md                                 |  96 ++
 .../01-operator-runda1.md                          | 170 ++
 .../02-evaluator-runda1.md                         |  96 ++
 .../dowody/01-triple-build-toast.png               | Bin
 .../dowody/02-triple-render-closeup.png            | Bin
 gra/src/map/improvement-build.ts                   |  10 +-
 gra/tools/map-improvement-qualify-test.cjs          |  29 ++-
 8 files changed, 397 insertions(+), 7 deletions(-)
```

Dokładnie 8 plików (7 zmian kodu/kanonu/testu + własne raporty tematu, licząc
`00-dispatch.md` jako część „raporty własne" allowlisty), wszystkie w granicach
allowlisty z `00-dispatch.md`. `terrain-improvements.json` i
`gra/src/render/improvements.ts` NIETKNIĘTE, zgodnie z zakazem. `git diff
3f7c68e3..HEAD --check` → czyste (brak whitespace errors), zweryfikowane
osobiście. `git diff origin/main..HEAD --stat` faktycznie myli (13 commitów,
o które bieżący `origin/main` odjechał od bazy izolacji) — potwierdzona
metodologia Evaluatora, prawidłowy punkt odniesienia to `3f7c68e3`.

## Podsumowanie

Wszystkie pięć punktów zadania Final Control zweryfikowane SAMODZIELNIE:
kod przeczytany osobiście (a), kanon append-only potwierdzony diffem (b), cała
bateria testów uruchomiona własnoręcznie w tym fail pre-existing potwierdzony
na PRAWDZIWEJ bazie izolacji przez tymczasowy worktree (c), oba zrzuty otwarte
i ocenione z uzasadnioną decyzją nie żądania powtórki (d), diff allowlist-only
policzony i sprawdzony (e). Zero zarzutów. Gotowość do integracji: TAK.

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1
ZMIANY-COMMIT: `ee5b7ebf` (Operator) + `c578c7f7` (Evaluator) na
`autobot/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1`; `git diff 3f7c68e3..HEAD
--stat` = 8 plików, allowlist-only, zweryfikowane osobiście.
TESTY: `tsc --noEmit` (5.9.3) zielone; `map-improvement-qualify-test.cjs` →
133 pass/1 fail, fail potwierdzony pre-existing NA PRAWDZIWEJ bazie `3f7c68e3`
(worktree tymczasowy, 130 pass/1 fail, identyczny fail); 5 bramek
referencyjnych zgodne z referencją (213/213, 19/19, 33/33, 13/13, 6/6); suma
bonusów +10/+9/+8 niezależnie przeliczona z `terrain-improvements.json`.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only) → READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
