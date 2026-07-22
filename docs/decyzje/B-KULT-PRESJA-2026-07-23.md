# B-KULT-PRESJA — decyzje Macieja (presja kultury)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 |
| **Paczka** | 1/2 kultura (`01…03`) · 2/2 religia + capture + symetria (`04…06`) |
| **Status** | 🟡 ZAPISANA — czeka `działaj` / wdrożenie |
| **Grupa** | B (+ F Integrator przy wpięciu `main.ts`) |

> **Kontekst designu (Maciej):** Presja kultury — silniejsza kultura w zasięgu **popycha % własnej kultury** na wrogich miastach (+5%/t itd.). Mechanizm **symetryczny** (wróg może odpchnąć). **Pre-konquest:** miasto może mieć już wysoki % naszej kultury przed zdobyciem. **Zastępuje** stary model KULT-01 (hex-claim) i podejście „tylko terytorium" jako **główny** efekt kultury na mapie.

**Cytat Macieja (2026-07-23):**

> „KULT-PRESJA-01a / KULT-PRESJA-02 a / KULT-PRESJA-03 5% normal, easy, 7% hard, 3% normal."

*(Interpretacja: easy **7%** · normal **5%** · hard **3%** /turę — standardowy wzorzec trudności.)*

**Cytat Macieja — paczka 2/2 (2026-07-23):**

> „KULT-PRESJA-04 a / KULT-PRESJA-05 a / KULT-PRESJA-06 a /"

---

## KULT-PRESJA-01 — Siła kultury (kto jest „silniejszy")

**Pytanie:** Skąd bierzemy siłę kultury do porównania presji?

**Decyzja Macieja:** **A**

> Siła kultury = **suma skumulowanej kultury całego imperium** (licznik HUD „Kultura").

**Implementacja (plan):**

- `empireCultureTotal(ownerId)` = Σ `city.kulturaSkumulowana` po miastach właściciela.
- Porównanie presji: `empireCultureTotal(sourceOwner) > empireCultureTotal(targetOwner)` → źródło może pchać % na mieście celu w zasięgu.
- **Nie** per-miasto skumulowana kultura jako siła (chyba że Maciej zmieni w paczce 2+).

**Pliki docelowe:** `culture-religion.ts` (`empireCultureTotal`, `culturePressureEligible`).

---

## KULT-PRESJA-02 — Zasięg presji

**Pytanie:** Jak daleko sięga presja kultury?

**Decyzja Macieja:** **A**

> Zasięg presji = **zasięg okolicy miasta** (populacja + progi kultury 100/250/500 → +0…+3 pierścienie).

**Implementacja (plan):**

- Dla miasta źródłowego: promień = `citySightRadius(pop, kulturaSkumulowana)` albo równoważnie `cityRangeForPopulation(pop) + cityBorderRadius(kultura)` — **ten sam** co okolica / mgła (już w `okolica.ts`).
- Miasto wroga w tym promieniu (hexDistance ≤ radius) = cel presji.
- **Nie** osobny promień presji · **nie** per-hex claim.

**Pliki docelowe:** `okolica.ts` (reuse) · `culture-religion.ts` (`culturePressureTargetsInRange`).

---

## KULT-PRESJA-03 — Tempo presji (%/turę)

**Pytanie:** Ile % własnej kultury dodaje silniejsze imperium co turę?

**Decyzja Macieja:** **Custom** (zależne od trudności)

| Trudność | %/turę |
|----------|--------|
| **easy** | **7%** |
| **normal** | **5%** |
| **hard** | **3%** |

> Gdy silniejsza kultura imperium jest w zasięgu okolicy miasta wroga — co turę **+X%** udziału kultury źródła na mieście celu (cap 100%, symetrycznie obie strony).

**Implementacja (plan):**

- Parametr JSON: `kultura.kultura_presja_proc_tura` (easy 7 / normal 5 / hard 3).
- Tylko gdy `empireCultureTotal(pusher) > empireCultureTotal(defender)` dla danego miasta.
- Aktualizacja `City.ownCultureShare` (lub równoważnego mixu kultur — szczegóły w handoff).
- Wpływ na pre-konquest: wysoki % przed podbojem → łagodniejsza stabilizacja po capture.

**Pliki docelowe:** `society-params.json` · `culture-religion.ts` · testy § presja.

---

## Relacja do innych decyzji

| ID | Status vs KULT-PRESJA |
|----|------------------------|
| **KULT-01 / hex-claim** | ❌ **Superseded** — nie wracać do spend-hex |
| **B-KULT-REL-Q1** (terytorium z kultury) | ⏸ **Otwarte / wtórne** — presja = **główny** efekt mapowy; ekspansja terytorium może zostać osobno, nie zamiast presji |
| **B-KULT-REL-Q4** (Power, nie victory kultura) | ✅ Bez zmian |
| **Paczka 2 (04–06)** | ✅ **Zamknięta** — religia mirror + capture + symetria obniżania |

**Handoff wdrożenia:** `dyspozycje/_handoff/B-KULT-PRESJA-do-INTEGRATOR.md`

---

## Mapowanie odpowiedzi

| ID | Maciej | Skrót |
|----|--------|-------|
| **KULT-PRESJA-01** | **A** | Siła = suma kultury imperium (HUD) |
| **KULT-PRESJA-02** | **A** | Zasięg = okolica miasta (+ pierścienie 100/250/500) |
| **KULT-PRESJA-03** | **Custom** | easy 7% · normal 5% · hard 3% /t |
| **KULT-PRESJA-04** | **A** | Religia lustrzanie: siła imperium · zasięg okolicy · tempo 7/5/3% |
| **KULT-PRESJA-05** | **A** | Po podboju zachować aktualny % kultury/religii z presji |
| **KULT-PRESJA-06** | **A** | Symetria: wróg może obniżać nasz % u granicy (7/5/3%) |

---

## KULT-PRESJA-04 — Presja religii (mirror kultury)

**Pytanie:** Czy religia działa tak samo jak presja kultury?

**Decyzja Macieja:** **A**

> Religia **lustrzanie jak kultura**: siła imperium, zasięg okolicy, tempo **7/5/3%** (easy/normal/hard).

**Cytat Macieja (2026-07-23):**

> „KULT-PRESJA-04 a"

**Implementacja (plan):**

- `empireReligionTotal(ownerId)` — analogicznie do `empireCultureTotal` (suma wyznawców / skumulowanej religii imperium).
- Zasięg = ten sam co okolica miasta (`citySightRadius`).
- Tempo = `religia.religia_presja_proc_tura` (easy 7 / normal 5 / hard 3) — mirror `kultura_presja_proc_tura`.
- `tickReligionPressure()` — ta sama logika co presja kultury, osobny licznik udziału religii.

**Pliki docelowe:** `society-params.json` · `culture-religion.ts` · testy § presja religii.

---

## KULT-PRESJA-05 — Capture: zachowanie mixu z presji

**Pytanie:** Co z % kultury/religii po podboju miasta?

**Decyzja Macieja:** **A**

> Po podboju **zachować aktualny % kultury/religii** zbudowany presją (pre-konquest).

**Cytat Macieja (2026-07-23):**

> „KULT-PRESJA-05 a"

**Implementacja (plan):**

- Przy capture **nie** resetować `ownCultureShare` / udziału religii do 0% ani do 100% właściciela.
- Wartości z presji przed podbojem = stan startowy po podboju → łagodniejsza stabilizacja (`conquest-stability.ts`).
- Konwersja bazowa (budynki) działa **od** tego poziomu w górę, nie od zera.

**Pliki docelowe:** `conquest-stability.ts` · `culture-religion.ts` · test capture z wysokim mixem.

---

## KULT-PRESJA-06 — Symetria obniżania u granicy

**Pytanie:** Czy presja działa tylko w jedną stronę (pchanie w górę)?

**Decyzja Macieja:** **A**

> **Symetria:** wróg może **obniżać** nasz % u granicy — tym samym tempem **7/5/3%** gdy jego imperium silniejsze.

**Cytat Macieja (2026-07-23):**

> „KULT-PRESJA-06 a"

**Implementacja (plan):**

- Gdy `empireCultureTotal(enemy) > empireCultureTotal(us)` w zasięgu okolicy — wróg **−X%/t** udziału naszej kultury/religii na naszym mieście granicznym (floor 0%).
- Działa **obustronnie** dla kultury i religii (mirror 04).
- Ten sam parametr trudności (7/5/3) co push — symetria siły, nie osobna kara.

**Pliki docelowe:** `culture-religion.ts` (`tickCulturePressure` / `tickReligionPressure`) · testy T3/T7 symetria push+pull.
