# C3 — Oblężenie na mapie świata

**Ekran:** mapa świata (strategiczna) — **zanim** otworzy się preBattle / C2.  
**Grupa:** A (mapa świata) · **Status:** **ZAMKNIĘTE** (C3-Q1…Q10) · Maciej 2026-06-27  
**Handoff start:** `dyspozycje/_handoff/C3-Q1-do-MAPA_start-oblezenia.md`

---

## Decyzje Macieja (pełna paczka)

| ID | Decyzja | Data |
|----|---------|------|
| **C3-Q1** | **A** — Oblężaj / Szturm / Anuluj przy murze | 2026-06-27 |
| **C3-Q2** | **custom** — AI 3 poziomy siły (patrz niżej) | 2026-06-27 |
| **C3-Q3** | **B** — magazyn=0 → alert „kapitulacja za 1 turę", potem transfer | 2026-06-27 |
| **C3-Q4** | **A** — atrycja ~8%/turę + osobny zegar głodu | 2026-06-27 |
| **C3-Q5** | **C** — **brak** progu HP; upadek auto **tylko** z głodu (atrycja osłabia, nie kończy) | 2026-06-27 |
| **C3-Q6** | **A** — milicja 20% populacji (SS9c) | 2026-06-27 |
| **C3-Q7** | **A** — panel oblężenia: overlay na mapie (boczny/dolny) | 2026-06-27 |
| **C3-Q8** | **C** — tempo machin zależy od wielkości armii | 2026-06-27 |
| **C3-Q9** | **A** — wolny odwrót bez kary; machiny przepadają | 2026-06-27 |
| **C3-Q10** | **C** — pełne modele 3D obozów oblężniczych (polish v1.0) | 2026-06-27 |

**Jedna linia:** `C3-Q1=A, C3-Q2=custom, C3-Q3=B, C3-Q4=A, C3-Q5=C, C3-Q6=A, C3-Q7=A, C3-Q8=C, C3-Q9=A, C3-Q10=C`

---

### C3-Q1=A — Start oblężenia (gracz)

Przy wrogim mieście z murem → **Oblężaj / Szturm / Anuluj**. Gałąź Oblężaj **nie** woła preBattle.

**Reguły szturmu i obrońców (playtest 2026-06-30):** patrz **`docs/decyzje/C3-szturm-obrona.md`** (C3-ST-1…3).

---

### C3-Q2=custom — AI przy murze (3 poziomy)

| Siła armii AI | Zachowanie |
|---------------|------------|
| Bardzo silna | Szturm od razu |
| Średnia | Oblężenie + machiny → szturm gdy gotowe |
| Słaba, ale na kontratak | Tylko głodzenie jak najdłużej |

Handoff: `dyspozycje/_handoff/C3-Q2-do-UNITS-AI_oblezenie-3poziomy.md`

**Spójność C3-Q8=C:** tempo machin skaluje się z armii — tier „średnia" AI korzysta z tej reguły.

---

### C3-Q3=B — Kapitulacja z głodu

Magazyn = 0 → **alert** „kapitulacja za 1 turę" → następna tura transfer właściciela (bez bitwy 3D).

---

### C3-Q4=A + C3-Q5=C — Presja wojskowa vs upadek

- **Atrycja 8%/turę** — tak (panel, osłabianie garnizonu).
- **Auto-upadek od HP** — **nie**; jedyny auto-zwycięstwo bez szturmu = **głód** (Q3=B).

---

### C3-Q8=C — Machiny a wielkość armii

Parametry progów (np. +1 machina / N jednostek) — **UNITS/MAPA** przy implementacji; nie 1/turę flat.

---

### C3-Q10=C — Wizual oblężenia

**Pełne modele 3D obozów** na mapie strategicznej — **zakres v1.0** (duży koszt MAPA; Master informowany).

---

## Po decyzji

Work: panel Q7 (UI), render Q10 (MAPA), machiny Q8 (UNITS), AI Q2, wpiecie Q1+Q3 (F).

---

*Aktualizacja: 2026-06-27 · Grupa A · formularz ABC*
