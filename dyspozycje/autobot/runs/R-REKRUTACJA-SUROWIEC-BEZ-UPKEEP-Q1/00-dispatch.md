# 00 — DISPATCH (runda 2 tematu, 2026-08-26)

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`
GOAL: Rekrutacja jednostki sprawdza **wyłącznie jednorazowy koszt zakupu** (`unitStockCost`).
Przyszłe utrzymanie **nie blokuje** zakupu — jest rozliczane w NASTĘPNEJ turze, razem z
istniejącymi konsekwencjami niedoboru. Parytet gracz / AI / MP.

## Wyzwalacz — ECHO właściciela (2026-08-26, powtórzone zgłoszenie)

> „Kolejny błąd, który był wielokrotnie naprawiany i nadal nie został naprawiony: do rekrutacji
> system liczy nie tylko tyle surowca, ile jest konieczne do zrekrutowania, ale dolicza jeszcze
> koszt utrzymania z następnej tury. Rozmawialiśmy już wielokrotnie, że koszt utrzymania jest
> w następnej turze i powinien być weryfikowany w tej turze, a do rekrutacji bierzemy wyłącznie
> koszt zrekrutowania surowców."

Zrzut: Wojownik, koszt **50 Drewno**, utrzymanie **−10 Drewno/t**. Gracz ma **57 Drewno**
(+20/turę). Rekrutacja zablokowana, bo bramka żąda 50 + 10 = 60.

## DLACZEGO TO WRACA — ustalone, nie zgaduj tego ponownie

**Ten temat był już przerobiony i PRZESZEDŁ — ale nigdy nie został zintegrowany.**
Run z 2026-08-21 (`01-operator.md`, `02-evaluator.md`, `03-final-control.md` w tym katalogu)
ma Final Control **PASS-WITH-NOTES** z dowodami: `recruitment-no-upkeep-gate-test.cjs` 10/0,
`ai-recruit-upkeep-gate-test` 27/0, `upkeep-test` 73/0, `tsc` exit 0. Ostatnia linia tamtego
raportu brzmi: **„ZMIANY/COMMIT: Brak integracji i brak commita."**

Praca żyła jako **niescommitowane zmiany** w katalogu `Civ-clean-main-2026-08-20`, którego
już nie ma. `gra/tools/recruitment-no-upkeep-gate-test.cjs` **nie istnieje w repo**.
`economy-upkeep.ts:850` **nadal** liczy `unitRecruitFullStockCost`. Czyli: poprawka została
napisana, zweryfikowana przez trzy role i **zgubiona**, bo nikt jej nie oddał.

**Wniosek dla Ciebie:** przeczytaj tamte trzy raporty — opisują dokładnie, co zmienić.
Ale **NIE ufaj im jako stanowi kodu**: minęło 6 dni i kilkanaście fal. Każde twierdzenie
zweryfikuj na dzisiejszym `main`.

## KONFLIKT DECYZJI — rozstrzygnięty, ale musi być ZAPISANY

`docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md` (2026-08-06, status 🟢 WDROŻONA) **nakazuje**
dokładnie to, na co właściciel narzeka: „Nie rekrutuj jednostki, jeśli pula państwa nie
pokrywa 1 tury utrzymania surowcowego, **oprócz** zwykłego kosztu rekrutacji". Przykład
w tamtej decyzji jest bliźniaczy do dzisiejszego zrzutu.

Decyzja właściciela z 2026-08-20, powtórzona 2026-08-26, **odwraca tamtą**. Nowsza decyzja
właściciela wygrywa — ale **nie wolno jej wykonać po cichu wbrew zapisanej decyzji**.
Operator MA dopisać do `docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md` nagłówek statusu
„⛔ WYCOFANA 2026-08-26 przez `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`" z jednozdaniowym
uzasadnieniem i linkiem do tego runu. Treści historycznej NIE kasować.

## BASELINE — zmierzony przeze mnie na czystym `main` (`136e664c`) PRZED tym tematem

| Bramka | Stan PRZED |
|---|---|
| `ai-recruit-upkeep-gate-test` | **18 passed, 9 FAILED** — czerwona PRE-ISTNIEJĄCO |
| `unit-resource-upkeep-test` | **3 passed, 4 FAILED** — czerwona PRE-ISTNIEJĄCO |
| `unit-stock-cost-test` | **41 passed, 17 FAILED** — czerwona PRE-ISTNIEJĄCO |
| `ai-prod-fallback-test` | 17/0 zielona |
| `upkeep-test` | 73/0 zielona |
| `ai-mp-rekrutacja-build-gate-test` | 21/0 zielona |

Trzy czerwone to **drift oczekiwań ×1 vs dane FALI 300 ×5**, odnotowany już w
`pre-existing-test-drift.md` z 2026-08-21. **Nie są Twoją winą i nie masz ich ukrywać.**
Masz je: (1) potwierdzić jako pre-istniejące własnym pomiarem na bazie, (2) nie pogorszyć,
(3) jeśli Twoja zmiana część z nich naprawia — powiedzieć o tym wprost z liczbą.

## ZADANIE

1. Bramka rekrutacji ma sprawdzać **wyłącznie `unitStockCost`**. Symbole do rozstrzygnięcia:
   `canAffordUnitRecruitFull` (`economy-upkeep.ts:846-851`), `unitRecruitFullStockCost` (`:832`),
   `isUnitRecruitStockChipMissing` (`:862`), `pickUnitRecruitHint` (`:875`),
   `canAffordUnitRecruitUpkeepReserve` (`:823`), `UNIT_RECRUIT_UPKEEP_RESERVE_TURNS` (`:799`).
   Dla każdego: usunąć, przemianować czy zostawić — **z uzasadnieniem**, nie po cichu.
2. UI (`cityPanel.ts:7746`, `:7819`, `:7734`) — chip surowca i komunikat odmowy mają pokazywać
   **wyłącznie** brak jednorazowego kosztu. Brak zapasu na utrzymanie **nie** czerwieni chipa
   ani nie blokuje przycisku.
3. **Utrzymanie ma dalej działać w następnej turze** — pobór w ticku ekonomii i istniejące
   konsekwencje niedoboru zostają nietknięte. To jest do UDOWODNIENIA pomiarem, nie do założenia.
4. Parytet gracz / AI / MP — jedna bramka owner-agnostyczna, bez ścieżek specjalnych.
5. Zaktualizować `docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md` (patrz „KONFLIKT DECYZJI").

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ** uznania tematu za zrobiony bez odtworzenia **dokładnie scenariusza ze zrzutu
  właściciela**: pula 57 Drewna, jednostka o koszcie 50 i utrzymaniu 10/turę → rekrutacja
  MA przejść. Podaj to jako osobną, nazwaną asercję.
- **ZAKAZ** uznania p.3 za zrobiony bez pomiaru: zrekrutuj przy 57 Drewna, przejdź turę,
  pokaż że utrzymanie 10 **zostało pobrane** i że niedobór odpala właściwą konsekwencję.
  Rozdzielenie bramek nie może po cichu wyłączyć poboru.
- Każda nowa/zmieniona asercja MUSI **czerwienieć po jednej celowanej mutacji źródła** —
  pokaż mutację i wynik. Regex po własnym źródle jest tautologiczny i będzie odrzucony.
- **ZAKAZ** raportowania trzech pre-istniejących czerwonych bramek jako „naprawione przez
  mnie" albo jako „zielone". Zmierz je na bazie i po zmianie, podaj obie liczby.

## Kryteria sukcesu

1. Scenariusz właściciela (57 Drewna, koszt 50, utrzymanie 10) → **rekrutacja przechodzi**.
2. Pula 49 Drewna, koszt 50 → rekrutacja **nadal zablokowana** (nie rozbraja się bramka kosztu).
3. Utrzymanie pobierane w następnej turze, konsekwencje niedoboru działają — pomiar.
4. Parytet gracz / AI / MP — pomiar dla wszystkich trzech.
5. `tsc --noEmit` 0 błędów; **5 bramek referencyjnych** zielonych (logic 213/213, tech-tree 19/0,
   research 33/33, unit-replace 13/13, combat 6/6); `upkeep-test` 73/0, `ai-prod-fallback-test` 17/0,
   `ai-mp-rekrutacja-build-gate-test` 21/0 — bez pogorszenia. Trzy czerwone z baseline'u: nie gorzej.
6. Nowa bramka tematu pinująca kontrakt „rekrutacja = tylko `unitStockCost`", z dowodem mutacji.

## Izolacja

Gałąź `autobot/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/src/game/economy-upkeep.ts` · `gra/src/ui/cityPanel.ts` · `gra/src/main.ts`
(wyłącznie linia importu ~`:913`, jeśli symbole znikają) · `gra/tools/*` ·
`docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md` (wyłącznie dopisek statusu) · raporty runu.

**UWAGA — RÓWNOLEGŁY TEMAT (§2b):** jednocześnie biegnie
`R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`, który dotyka `gra/src/ui/buildModeHud.ts`
oraz `gra/src/main.ts` w okolicy `:19352-19359`. **Nie zbliżaj się do `buildModeHud.ts`**
i ogranicz zmiany w `main.ts` do absolutnego minimum (import). Kolizja = problem integracji.

**NIE ruszać:** `gra/data/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `buildModeHud.ts`.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test`. C-001: zakaz
`npm run build`/`dev`; dozwolone `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`
i `node ./node_modules/typescript/bin/tsc --noEmit`. Zakaz `npx`, zakaz `git add -A`.
**Commituj cząstkowe postępy W TRAKCIE** — ten temat już raz zginął przez brak commita.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról**. `opts.model` jawnie (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch rundy 2 tematu.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch; run z 2026-08-21 nie liczy się do limitu — nie został zintegrowany).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
