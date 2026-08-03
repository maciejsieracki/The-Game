# PLAN — auto-budowa: Ręczny / Priorytet typów / Lista epoki

**ID:** `R-AUTO-BUDOWA-LISTA`  
**Status:** Q1 doprecyzowane (2026-08-03) — **bez implementacji** do domknięcia Q2/Q3  
**Powiązane:** `PLAN-AUTO-ULEPSZENIA-2026-08-02.md`

---

## Decyzja Macieja — Q1 (2026-08-03)

**R-AUTO-BUDOWA-LISTA-Q1 = A (doprecyzowane):** trzy tryby Budowy.

| Tryb | Co robi | Relacja do dziś |
|------|---------|-----------------|
| **1. Ręczny** | Gracz klika budynek → kolejka | Bez zmian |
| **2. Priorytetowy** | Ustalasz **kolejność typów** budynków w mieście (np. 1. żywność/wzrost → 2. handel → 3. wojsko…). System buduje **aż wyczerpie pulę** dostępnych budynków z typu o wyższym priorytecie, potem bierze następny typ | Zastępuje / rozbudowuje dzisiejsze chipy jednego `budowaFocus` (dziś: jeden typ naraz) |
| **3. Lista** | Własna **nazwana lista** budynków na epokę (Lista A / B / C…): dokładana kolejność konkretnych budynków → **wgrywasz** do miasta (lub kolejnych miast) → budowa ściśle wg tej kolejności | Nowe; szablony epoki z nazwą |

**Cytat (skrót):** *„priorytetyzowanie które budynki najpierw… aż do wyczerpania puli… trzeci sposób to lista… Lista A/B/C… po wgraniu same według kolejności w każdym mieście gdzie taką listę gramy.”*

---

## 1. Co jest dziś

| Tryb | Stan |
|------|------|
| Ręczny | ✅ |
| Auto jednego profilu (`budowaFocus`) | ✅ jeden typ naraz (najtańszy w kategorii) |
| Priorytet **wielu typów w kolejności** | ❌ |
| Nazwana lista budynków epoki + wgranie | ❌ |

Typy dziś (chipy): wzrost / wojsko / kultura / prawo / produkcja / zrównoważone — mapowane w `prioritiesForBudowaFocus` (`auto-manage.ts`).

---

## 2. Tryb 2 — Priorytetowy (szczegół)

### UI (propozycja)
W zakładce Budowa, gdy tryb = Priorytetowy:
- Lista typów z numerami 1…N (przeciągnij / ↑↓)
- Domyślna kolejność startowa = sensowna (np. wzrost → produkcja → handel/wojsko → kultura → prawo) albo kopia „zrównoważone”
- Opcja: „Kopiuj priorytety do wszystkich miast” (później)

### Algorytm pickera
```
dla typu w kolejności priorytetów (1 → N):
  kandydaci = budynki tego typu legalne w mieście (tech, epoka, surowce, nie max level)
  jeśli kandydaci niepuste:
    wybierz jeden (reguła: najtańszy Praca  LUB  kolejność w katalogu — do ABC drobnego)
    enqueue i STOP
jeśli wszystkie typy wyczerpane → nic (jak dziś przy pustym auto)
```

**„Aż do wyczerpania puli”** = w kolejnych turach, dopóki w typie #1 coś jeszcze da się zbudować, **nie** przechodzi do typu #2.

### Stan miasta
```
budowaTryb: 'reczny' | 'priorytet' | 'lista'
budowaPriorytetTypow: BudowaFocus[]  // np. ['wzrost','produkcja','wojsko',…]
```
Stary `budowaFocus` + tryb `auto` → migracja: `priorytet` z jedną pozycją na górze albo domyślna pełna kolejność.

---

## 3. Tryb 3 — Lista nazwana (epoka)

### Biblioteka (poza miastem / w save meta)
```
budowaSzablony: {
  id, nazwa,          // „Lista A”, „Handel Brązu”…
  epoka,              // 1/2/3 lub „bieżąca”
  budynki: string[]   // ID w kolejności
}[]
```

### W mieście po wgraniu
```
budowaTryb = 'lista'
budowaLista = kopia szablonu.budynki
budowaListaZrodloId? = szablon.id
```

### Zachowanie
- Buduje **następny legalny** element listy (reguła skip: **Q2** poniżej).
- Wgranie do miasta **nie** kasuje ręcznych pozycji już w kolejce produkcji — dopina gdy front pusty (jak obecne auto).
- Ta sama lista może być wgrana do wielu miast (każde ma własną kopię kolejki/kursora).

### UI
- Edytor listy: dodaj z katalogu epoki → ↑↓ → zapisz jako Lista A/B/C
- W mieście: **Wgraj listę…** → wybór z biblioteki → tryb Lista

---

## 4. Otwarte (ABC poniżej w czacie)

| ID | Temat |
|----|-------|
| **Q2** | Lista: pozycja zablokowana — pomiń+wróć / czekaj / skreśl |
| **Q3** | Zakres v1: najpierw tylko Priorytet, potem Lista / oba naraz |
| (później) | Reguła wyboru w typie (najtańszy vs katalog); jednostki na liście = NIE w v1 |

---

## 5. Kolejność wdrożenia (po Q2/Q3)

1. Typy + `budowaTryb` + migracja ze starego `auto`
2. UI priorytetów typów + picker „wyczerp typ #1”
3. Biblioteka list + wgranie + picker listy
4. Save/load + komunikaty („Następne: …”)

Pliki: `cities.ts`, `auto-manage.ts`, `cityPanel.ts`, `main.ts`, testy `auto-manage-test.cjs`.

---

*Aktualizacja 2026-08-03 · Q1=A doprecyzowane przez Macieja.*
