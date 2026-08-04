# ODFORT-Q1 + ODFORT-Q2 — Odfortyfikowanie: heks, wybór, snapshot ruchu

| Pole | Wartość |
|------|---------|
| **ID** | ODFORT-Q1, ODFORT-Q2 |
| **Ekran** | Panel miasta (Odfortyfikuj) · panel akcji jednostki · mapa (heks miasta) |
| **Status** | 🟢 **WDROŻONE w kodzie** — zamknięta dyskusja (Maciej 2026-08-04) |
| **Decyzja** | **Q1 = A** · **Q2 = doprecyzowanie Macieja** (nie czyste B) |
| **Data** | 2026-08-04 |

---

## Cytat Macieja (Q2)

> Powinna mrugać z opcją do ruchu… pełen zakres… jeżeli nie wykonywała wcześniej żadnych ruchów… żeby nie było tak, że wchodzimy z końcówką, fortyfikujemy, odfortyfikujemy i mamy pełną ilość ruchów.

---

## ODFORT-Q1 = A — pozycja po odfortyfikowaniu

| Obszar | Ustalenie |
|--------|-----------|
| **Heks** | Po odfortyfikowaniu jednostka **zostaje na heksie miasta** — widoczna na mapie (nie teleport na sąsiada). |
| **Limit stosu** | **Brak** osobnego limitu stosu z powodu odfortyfikowania — nie trzeba fallbacku na sąsiedni heks. |

---

## ODFORT-Q2 — wybór, ruch, anti-exploit

| Obszar | Ustalenie |
|--------|-----------|
| **Wybór** | Po odfortyfikowaniu jednostka jest **zaznaczona** (mruga / gotowa do ruchu). |
| **Przywrócenie ruchu** | `ruchLeft` = wartość **zachowana w momencie fortyfikacji** (snapshot), **nie** `maxRuch` / pełna pula. |
| **Pełna pula** | Tylko gdy przed ufortyfikowaniem jednostka **nie zużyła** ruchu w tej turze (snapshot = pełna pula). |
| **ZAKAZ exploita** | Wejście do miasta z końcówką ruchu (np. `ruchLeft = 0`) → ufortyfikowanie → odfortyfikowanie **NIE** przywraca pełnego ruchu. |
| **Koszt wyjścia** | Odfortyfikowanie **nie kosztuje** dodatkowego ruchu (jak dotąd). |

---

## Mechanizm snapshot (`fortifyRuchSnapshot`)

1. **Przy wejściu** w garnizon (`enterGarnizon`) lub fortyfikację w polu (`enterFieldFortify`): zapis `fortifyRuchSnapshot = ruchLeft`, potem `ruchLeft = 0`.
2. **Przy wyjściu** (`exitGarnizon` / `exitFieldFortify`): `ruchLeft = fortifyRuchSnapshot`, pole snapshot **czyszczone**.
3. Dotyczy **ręcznego** odfortyfikowania i **automatycznego** przy rozkazie ruchu (spójność).

### Przykłady

| Stan przed Ufort. | Po Odfort. (`ruchLeft`) |
|-------------------|-------------------------|
| Pełna pula (2/2), brak ruchów w turze | 2 |
| Zużyto 1 (1/2) | 1 |
| Wejście z końcówką (0/2) | 0 |
| Ufort. przy MP=0 po marszu | 0 |

---

## Implikacje implementacyjne

- `RuntimeUnit.fortifyRuchSnapshot?: number` — pole opcjonalne (stare save'y bez pola = brak przywracania spoza snapshota).
- `exitGarnizon` / `exitFieldFortify` — restore + `selectPlayerUnit` w UI (main.ts / cityPanel callback).
- Testy: `garnizon-exit-test.cjs`, `fortify-pole-test.cjs` — scenariusze snapshot + anti-exploit.

---

## Powiązane

- `FORTIFY-MP0-Q1.md` — Ufortyfikuj bez wymogu MP
- `gra/src/game/armyMerge.ts` — `enterGarnizon`, `exitGarnizon`, `enterFieldFortify`, `exitFieldFortify`
- `gra/src/units/setup.ts` — `fortifyRuchSnapshot` na `RuntimeUnit`
