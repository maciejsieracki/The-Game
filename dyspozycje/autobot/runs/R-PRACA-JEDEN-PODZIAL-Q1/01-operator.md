# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL: **Jeden** podział Pracy budynki/ulepszenia, sumujący się do 100%, stosowany
**dokładnie raz**, z capem ulepszeń ≤50%. Identyczny mechanizm globalnie (menu Pracy)
i w mieście. Usunięcie drugiego, zdublowanego dzielenia tej samej puli. Nazwy w kodzie
i UI muszą opisywać to, czym rzeczy naprawdę są.

ZMIANY/COMMIT: `1f158649` (gałąź `autobot/R-PRACA-JEDEN-PODZIAL-Q1`, worktree
`/home/user/wt-R-PRACA-JEDEN-PODZIAL-Q1`). Cały diff w allowliście:
`gra/src/game/{production,cities,empire-city-defaults,ai}.ts`, `gra/src/main.ts`,
`gra/src/ui/{cityPanel,empireDetailPanel,buildModeHud}.ts`, `gra/tools/*` (6 bramek
zaktualizowanych + 2 nowe). `turn-economy.ts` nie wymagał zmian.

## Recon konsumentów puli (pkt 8) — PRZED zmianą, na kodzie

Wpływ do puli: `poolGain` (= `doPuli`, a przy pustej kolejce cała Praca miasta) +
`overflowToPool`. Wypływ: utrzymanie ulepszeń surowcowych, cuda na mapie
(`advanceOwnerWonderMapBuilds`), **budżet budynków z drugiego podziału**, auto-ulepszenia,
zakładanie miasta, wycinka lasu, ręczne ulepszenia, dary/rynek, przepadek przy utracie stolicy.

Dwie korekty faktograficzne wobec pkt 8 dispatchu (źródło: kod, nie pamięć):
1. **Leczenie HP NIE jest konsumentem Pracy.** `manpower.ts` wydaje Manpower; słowo „Praca”
   nie występuje w tym pliku. Ryzyko z tej pozycji nie istnieje.
2. **Drugi podział szedł po CAŁYM, SKUMULOWANYM saldzie puli**, nie po tegorocznym
   przyroście — więc Praca odłożona na cud/miasto była co turę przemielana na budynki.

**Konflikt z kontraktem nie wystąpił, `BLOCK` niepotrzebny.** Usunięcie drugiego podziału
nie zmienia wpływu do puli (nadal `doPuli`), a kasuje jeden wypływ — każdy pozostały
konsument ma po zmianie **ściśle więcej** Pracy, nie mniej.

## Pomiar (10 Pracy) — te same funkcje, przed i po

| ustawienie ulepszeń | PRZED (realnie) | PO (realnie) |
|---|---|---|
| 33% (domyślne, drugi suwak) / 30% (domyślne dziś) | **0,0%** | **30,0%** |
| 50% (maksimum) | 20,0% | **50,0%** |

Reguła zaokrąglenia (jawna): `doBudynkow = round(total × %budynki)`, `doPuli = total − doBudynkow`
— zaokrąglana jest **tylko jedna strona**, więc suma zawsze = Praca miasta. Przy remisie `.5`
nadwyżka idzie do **budynków**, czyli w stronę wymaganą przez właściciela; twardo:
`2 × doPuli ≤ total` dla każdej wielkości Pracy i każdego legalnego ustawienia.

## Nazwy (pkt 6) i duplikat (pkt 7)

`doUlepszen` niosące pulę imperium **usunięte** z `cityPanel.ts`; cztery rozjeżdżone etykiety
zastąpione jedną rodziną: `PULA_LBL` „Ulepszenia (pula)” / `PULA_LBL_PELNA`
„Ulepszenia (pula imperium)”. **Decyzja interpretacyjna do akceptu właściciela:** zostawiłem
słowo „Ulepszenia” (jego słownik), ale z prawdziwym adresatem w nawiasie — bo z tej samej puli
płacą też cuda, zakładanie miast i wycinka. Samo „Ulepszenia” byłoby powtórzeniem root-cause’u.
Usunięte: `splitEmpirePracaBudget`, `allocateEmpirePracaToBuildings`, `applyEmpireBuildingBudget`,
`EmpirePracaSplit`, `ownerDefaultPracaSplit` (drugi suwak). `pracaAutoPercent` **nietknięty**.

TESTY (wszystkie uruchomione, wyniki wklejone):
- **Nowe bramki tematu:** `praca-jeden-podzial-kontrakt` **600 OK / 0 FAIL** (siatka 0–50% ×
  13 wielkości Pracy, cap w jednostkach, override pkt 5, zero duplikatu, konsumenci puli);
  `praca-jeden-podzial-real-render` **35 pass / 0 fail** (żywy Chromium: jeden suwak 50–100,
  kolumny sumują się do 100%, natywny klamp blokuje >50% na ulepszenia). Zrzut:
  `01-operator-podzial-pracy-real-render.png`.
- **Nietautologiczność (mutacja pojedyncza per asercja):** M1 przywrócenie drugiego podziału
  → 122 FAIL; M2 cap 40% → 17 FAIL; M3 override zawsze off → 3 FAIL; w real-render MUT-1/2/3
  (zakres, suma kolumn, myląca etykieta) — każda zapala swoją asercję.
- **8 bramek Pracy + `praca-cap-migracja-luka`:** 34/33/50/28/25/20/7/20/11 — zielone.
- **5 bramek referencyjnych:** logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- **Szerszy przemiat 34 bramek dotykających Pracy/ekonomii:** zielone poza trzema
  **czerwonymi pre-istniejąco na `main`** (identyczne asercje i liczniki po obu stronach):
  `empire-panel-econ-slider-visibility` 57/3, `empire-panel-sliders-always-visible` 6/2,
  `spichlerz-wzrost` 2/7. `unit-power` 4/2 — znany, pre-istniejący.
- `tsc --noEmit` 0 błędów; `vite build` (C-001, `--outDir /tmp/civ-dist-rpjp`) ✓ 848 modułów.
- `map-gen-regression` (wolna bramka §6, poza ścieżką tej zmiany — nie dotykam generatora
  mapy): przerwana własnym limitem czasu po 30 min na etapie „sieć rzek + dopływy”
  (`EXIT=124`). Sekcje, które zdążyły policzyć, są zielone: trasy z ujściem **2124/2124**,
  główne rzeki do realnego morza **1235/1235 (0 fail)**. Sekcja determinizmu A=B nie
  dobiegła — zgłaszam jako **niedomierzone**, nie jako zielone (§13a: brak dowodu ≠ dowód).

**Zmienione asercje starych bramek — uzasadnienie w kodzie każdej z nich** (`praca-limit-50`,
`praca-miasto-limit-50-cap`, `praca-pula-rate-parity`, `ai-praca-split-parity`,
`auto-improvements`, `production-overflow`, `praca-split-ui`, `praca-budmode-...`): wszystkie
pinowały **drugi podział** albo literalne stringi UI. Każda zmiana ma w pliku blok
„CO PILNOWAŁA / DLACZEGO PRZESTAŁO BYĆ PRAWDĄ / CO PILNUJE TERAZ”. Cap 50%, rozdzielność
`pracaAutoPercent`, parytet AI i niezmiennik HUD „+N = realny przyrost puli” są pinowane
dalej, przez funkcje, które przetrwały. Zero rozluźnienia — asercje negatywne dostały własne
mutacje. Jedna zmiana wartości domyślnej, jawnie: udział ulepszeń 33% → **30%** (dopełnienie
`DEFAULT_PODZIAL_PRACY` = 70), bo 33% było domyślną usuniętego drugiego suwaka.

BLOKADY: brak. Dwie noty dla orkiestratora:
1. **Rozważone i odrzucone jako poza allowlistą:** globalna zmiana nazwy `doPuli` →
   `doPuliImperium`. Wykonana, a następnie **wycofana**, bo wymuszała edycję
   `gra/src/game/economy.ts` i `auto-manage.ts` — plików spoza allowlisty (§14, C-025).
   Dispatch wymagał zlikwidowania `doUlepszen`, nie `doPuli`; to zrobione. Do rejestru jako
   osobny temat, jeśli właściciel chce szerszą nazwę.
2. `map-gen-regression` nie dobiegł do końca w 30 min (szczegóły w TESTY). Nie blokuje —
   diff nie dotyka generatora mapy — ale Evaluator powinien go domierzyć, jeśli chce
   pełnego pokrycia §6.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5 High) — priorytet kontroli: (a) czy budżet ulepszeń
liczony z tegorocznego wpływu do puli, a nie z salda, jest zgodny z intencją właściciela;
(b) migracja starych zapisów (kolizja `ownerDefaultPodzialPracy` vs legacy
`ownerDefaultPracaSplit` — wygrywa pierwsze); (c) czy etykieta „Ulepszenia (pula imperium)”
przechodzi u właściciela, czy wymaga ABC.
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej — tak; deploy/publikacja — nie).
