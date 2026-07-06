# P-C2 + P-ARMIA — Moc: składniki Armia i Wygrane bitwy (paczka ABC)

**Data:** 2026-06-26  
**Status:** **ODŁOŻONE v1.1** — status quo A/A (flat ×25) · **nie blokuje gry** · nie pytaj Macieja bez otwarcia v1.1  
**Powiązane:** `P-A-power-kanon.md` · `EKONOMIA-POWER-RESPEKT-SPEC.md` · `D3-moc-respekt-tuning-scenariusze.md`

**Kanon wdrożony:** `power-objective.ts` · 9 składników P-A · Respekt = ratio · HUD „Moc”. To NIE redesign — ewentualny tuning dwóch współczynników w v1.1.

**Kontekst (archiwum):** flat 25/jednostka i 25/wygrana — Maciej 2026-06-26: „na razie zostawmy”.

---

## P-C2 — Składnik „Wygrane bitwy” w Mocy

**O co chodzi:** Czy każda wygrana bitwa daje **stałe +25 pkt** do Mocy na zawsze (kumulacja), czy liczy się **jakość** zwycięstwa?

**Dziś:** `wygraneBitwy × 25 pkt` (flat). Przy 10 wygranych w kalibracji = 250 pkt (~8% Mocy 3020).

| | Opcja | Co w grze |
|---|--------|-----------|
| **A** | **Flat 25 / wygrana** *(status quo)* | Każda wygrana +25 pkt Mocy, bez względu na wroga. Proste, przewidywalne. |
| **B** | **Ważona siłą pokonanego** | Punkty = f(siła armii pokonanego), np. `round(siła_bojowa_wroga / 10)` z tej samej formuły co oblężenie. Wygrana z barbarzyńcą ≈ mało; z dużą armią AI ≈ dużo. |
| **C** | **Flat + limit** | Nadal +25, ale składnik „bitwy” w Mocy **max 250 pkt** (10 liczonych wygranych) — reszta bez wpływu na Moc (historia zostaje w statystykach). |

**Za A:** zero pracy, spójne z kalibracją 3020.  
**Za B:** brak „farmienia” słabych bitew pod Moc/Respekt; spójne z sensem gry.  
**Za C:** anty-inflacja bez skomplikowanej formuły.

**Rekomendacja CYW:** **B** (długotermin) lub **A** (zostaw do v1.1, zmień razem z P-ARMIA).

---

## P-ARMIA — Składnik „Armia” w Mocy

**O co chodzi:** Czy **liczba jednostek × 25** zostaje, czy Moc armii powinna odzwierciedlać **jakość wojska** (jak w walce)?

**Dziś:** `jednostki × 25 pkt`. 40 jednostek brązowych = 1000 pkt tak samo jak 40 elitarnych.

| | Opcja | Co w grze |
|---|--------|-----------|
| **A** | **Flat 25 / jednostka** *(status quo v1)* | Bez zmian teraz. Rozważamy P-ARMIA ponownie po playteście dyplomacji. |
| **B** | **Suma siły bojowej** | `Armia_Moc = suma estimateUnitCombatStrength(jednostka) × skala` — ta sama formuła co AI oblężenia (`Atak+Obrona+0,5×Pancerz…`). Skala w Panel-B tak, by cała Moc imperium ≈ 3020. |
| **C** | **Tabela pkt w Panel-B** | Kolumna `moc_pkt` per typ w `units.json` / Excel — Ty ustalasz np. włócznik=12, legion=28, czołg=80. |

**Za A:** Maciej już powiedział „na razie zostawmy”; kalibracja gotowa.  
**Za B:** jedno źródło prawdy z walką i pre-bitwą; brąz ≠ czołg automatycznie.  
**Za C:** pełna kontrola w Excelu; więcej utrzymania (2 macierze: walka + Moc).

**Rekomendacja CYW:** **A** teraz (zamrożenie v1) **albo B+A w jednym batchu** (jeśli chcesz od razu domknąć rozjazd z walką).

---

## Powiązanie decyzji

| P-C2 | P-ARMIA | Sens |
|------|---------|------|
| A | A | **v1 zamrożone** — nic nie ruszamy |
| B | B | **Spójność z walką** — oba składniki z siły bojowej |
| A | B | Armia jakościowa, bitwy flat — możliwe, ale niespójne |
| B | A | Bitwy ważone, armia liczbowa — kompromis |

---

## Po decyzji (lane)

1. Maciej → litery w jednej linii  
2. Panel-B (`Potega-P-A`, `Potega-opcje`) — jeśli B/C: nowe pola  
3. `export-b.py` → `power-params.json`  
4. EKONOMIA: `power-objective.ts` + test kalibracji 3020  
5. SILNIK: liczniki z mapy (HP, typ jednostki)  
6. CYW: **przeliczenie progów Respekt 60/70/90** jeśli skala Mocy się przesunie (`D3-moc-respekt-tuning-scenariusze.md`)

---

## Format odpowiedzi Macieja

```
P-C2=A, P-ARMIA=A
```

(lub inne litery — np. `P-C2=B, P-ARMIA=B` dla pełnej spójności z walką)
