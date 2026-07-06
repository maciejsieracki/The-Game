# D-CUD2 — Utrzymanie po wygaśnięciu cudu (KANON pytania ABC)

> **Status:** ✅ **ZAMKNIĘTE** — Maciej **C** (2026-06-26) · wdrożenie czeka **Tak — wdrażaj**  
> **Grupa D:** kopiuj **1:1** do czatu · **nie** skracaj · **nie** zmieniaj kolejności sekcji  
> **Decyzja powiązana:** D-CUD1 (cud zostaje na mapie; bonusy wygasają; +10 handlu turystycznego)

---

## [TEMAT: Cuda świata] D-CUD2 — Utrzymanie wygasłego cudu

### Pytanie (jedno zdanie)

Czy cud, który stracił wszystkie bonusy po epoce absolut (Renensans i dalej), nadal kosztuje utrzymanie ze skarbca co turę?

---

**Sytuacja**

W danych gry każdy cud ma pole **utrzymanie** — koszt ze skarbca co turę (np. Piramidy = 2 złota). Dopóki cud daje bonusy (Antyk i Średniowiecze), gracz płaci za jego działanie. Po decyzji **D-CUD1** cud **zostaje na mapie** jako ruina — wszystkie bonusy z pliku znikają, zostaje tylko **+10 do handlu** (atrakcja turystyczna). W pliku `wonders.json` jest adnotacja „bez utrzymania (do doprecyzowania D-CUD2)" — silnik jeszcze nie wie, czy po wygaśnięciu nadal pobierać opłatę.

**Cel pytania**

Ustalić, **czy wygasły cud nadal drenuje skarbiec**, czy staje się darmową ozdobą z lekkim bonusem handlowym — żeby Grupa Cywilizacje mogła domknąć logikę utrzymania w silniku i w Panelu danych.

**Dlaczego teraz**

To ostatni brakujący element paczki **cuda P1** po D-CUD1. Bez tej decyzji nie wiadomo, co wpisać w JSON i jak liczyć koszt tury w późnej grze — ryzyko, że gracz płaci 2–3 złota za ruiny, które dają tylko +10 handlu.

---

**A — Zero utrzymania po wygaśnięciu**

- **Co w grze:** Po epoce absolut utrzymanie = 0. Ruina nie kosztuje nic; +10 handlu to czysty bonus.
- **Za:** spójne z D-CUD1 (cud to dekor + turystyka, nie „żywy" obiekt); nie kara gracza za zabytek z przeszłości; prosta reguła w silniku.
- **Przeciw:** brak kosztu „opieki nad zabytkiem"; w późnej grze wiele ruin = wiele darmowego handlu; mniej presji ekonomicznej.

**B — Pełne utrzymanie jak za aktywnego cudu**

- **Co w grze:** Po wygaśnięciu nadal płacisz pełną stawkę z JSON (np. 2–3 złota/turę za Piramidy).
- **Za:** utrzymanie ma sens przez całą grę; opłaca się tylko przy dużym handlu; gracz musi świadomie „utrzymywać" zabytek.
- **Przeciw:** ruina bez bonusów może być stratna (+10 handlu vs 2–3 koszt); frustrujące w późnej grze; sprzeczne z duchem D-CUD1 (tylko turystyka).

**C — Obniżone utrzymanie (np. 50% starej stawki)**

- **Co w grze:** Po wygaśnięciu utrzymanie = połowa wartości z JSON (np. Piramidy 2 → 1 złoto/turę) — symboliczna „konserwacja zabytku".
- **Za:** kompromis między darmową ozdobą a pełnym kosztem; lekka presja ekonomiczna bez kary jak B.
- **Przeciw:** dodatkowa reguła do balansu i UI; gracz musi liczyć procent; trudniejsze do wyjaśnienia niż A lub B.

**Rekomendacja: A** — zero utrzymania po wygaśnięciu; zgodne z D-CUD1 (ruina = turystyka, nie aktywny cud) i prostą regułą dla gracza.

---

## Formularz Ask (Grupa D — krótkie etykiety)

| Pole | Wartość |
|------|---------|
| `id` | `D-CUD2` |
| `prompt` | `Wygasły cud — utrzymanie?` |
| `options` | `A — zero (Rekomendacja)` · `B — pełne jak żywy` · `C — 50% stawki` |
