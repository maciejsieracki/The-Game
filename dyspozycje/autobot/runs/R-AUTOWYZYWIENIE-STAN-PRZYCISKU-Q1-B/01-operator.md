# R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — Operator, runda 1/5

> **ŚLAD KOREKTY (§13b pkt 2).** Wersja pierwotna miała 604 słowa wobec limitu „ok. 400"
> (§11). Skrócona w Obronie rundy 1 (zarzut 4); treść merytoryczna niezmieniona, pełny
> tekst pierwotny zachowany w commicie `4b0aeec5`.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B
MODEL+EFFORT: Opus 5, effort high
GOAL: stan przełącznika wyżywienia (auto / indywidualne) czytelny BEZ klikania, w konwencji
reszty gry: aktywny świeci, nieaktywny wygaszony — we wszystkich miejscach.

## INWENTARYZACJA (kryterium 1) — 4 miejsca, nie 2

| # | Miejsce | Co to jest |
|---|---|---|
| 1 | `cityPanel.ts:5180-5187` (`renderMagazyn`) | „Auto Wyżywienie" — przełącznik stanu |
| 2 | `cityPanel.ts:5223` → `appendIndywidualneToggle` (def. `:4405`) | „Indywidualne", grupa Żywność |
| 3 | `cityPanel.ts:4511` (Skarbiec+Nauka) i `:4975` (Praca) | ten sam **współdzielony** komponent (C-026) |
| 4 | `empireDetailPanel.ts:181-186` | „Włącz Auto-Żywienie" — jednorazowa AKCJA, nie przełącznik |

Pełny `grep autoWyzywienie` po `gra/src` nie daje innego miejsca renderu.

## PRZYCZYNA

Obie połówki w panelu miasta **już miały** `.active` + `aria-pressed`. Defekt był po stronie
stanu WYŁĄCZONEGO: bez własnego oznaczenia wyglądał identycznie jak zwykły, klikalny `.hbtn`
(pełny `var(--text)` + złoty kontur) — „ciemny" czytał się jako „do kliknięcia", nie „odznaczony".

## KONWENCJA (kryterium 5) — naśladowana, nie wymyślona

`.civ-cs .fsbtn` / `.fsbtn.active` — `cityPanel.ts:2025-2027`, ten sam arkusz. Wtórnie
`.civ-emp-mocview-btn` (`empireDetailPanel.ts:335-338`). Stan WŁ nietknięty.

## ZMIANY/COMMIT

`4b0aeec5`: `gra/src/ui/cityPanel.ts` — reguła `.civ-cs .hbtn.off` (+hover) w `ensureStyles`;
obie połówki dostają `active`/`off` + `data-stan="wl|wyl"`. **Wyłącznie prezentacja** — handlery
bez zmian. `gra/tools/autowyzywienie-stan-przycisku-test.cjs` — NOWA bramka.
`empire-food.ts`, `main.ts` nietknięte; `git diff --check` czysty.

## TESTY

Nowa bramka **57/57** — asertuje RÓŻNICĘ, nie obecność klasy: (B)/(C) ta sama kontrolka
w dwóch trybach, (D) XOR `active`/`off`, (E) `getComputedStyle` w Chromium, (F) predykaty
(B)–(E) na bundlu z cofniętą poprawką muszą dać FAŁSZ (8 par). Mechanika (F) złapała
tautologię w mojej własnej pierwszej wersji.
tsc 0 błędów · logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
Panel miasta: 29/29 · 83/83 · 35/35 · 12/12 · 12/12 · praca-real-render 37/37.
Panel imperium: 25/25 · 96/96 · 53/53 · 33/33.
Czerwone **pre-istniejąco** (zweryfikowane na bazie, identyczne liczby): econ-slider-visibility
57/3, sliders-always-visible 6/2 (SUPERSEDED), empire-food-b5 25/3. Nie regres, nie naprawiane (C-025).

## BLOKADY / NOTY

**N1** — kryteria 3-4 w części „Spichlerz" niewykonalne w tej allowliście: panel Spichlerza nie
ma przełącznika, `EmpireFoodCityUiRow` (`empireDetailTypes.ts:531-539`) nie niesie
`autoWyzywienie`, a producent snapshotu siedzi w zakazanym `main.ts`. Do decyzji orkiestratora.
**N2** — nota do węzła A: „Auto Wyżywienie" i „Indywidualne" to dwa **niezależne** przełączniki,
nie para wykluczająca się. Poza zakresem tematu wizualnego.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
