# Turniej re-analizy założeń dyplomacji (a) i (b)

> **Autor:** subagent CYWILIZACJE / analityk (sesja 2026-06-25)
> **Metoda:** pairwise tournament, rubryka 4-kryteryjowa (jawna), maks. 6 rund
> **Wynik:** rekomendacja dla mastera — zostaw / zmień

---

## 0. Stan wyjściowy (wdrożone)

| Parametr | Wartość aktualna |
|---|---|
| Start Relacji | **50** (Zaufanie 20 + Respekt 30) |
| Zakres Relacji | **0–200** (clamp per składowa 0–100; Relacja = suma ≥ 0) |
| Próg wojny drobnych | **15** (remapped ze spec §5.2 „< −40") |

---

## 1. Rubryka oceny (jawna, wspólna dla obu zagadnień)

| Kryterium | Symbol | Waga |
|---|---|---|
| [1] Spójność ze Spec (Dyplomacja-szablon.md + Dyplomacja-zasady.md + PROJEKT-GRY-master) | **SPEC** | wysoka |
| [2] Grywalność / czytelność dla gracza | **GRY** | wysoka |
| [3] Brak martwych gałęzi / nieosiągalnych progów | **PROG** | średnia |
| [4] Prostota implementacji i utrzymania | **IMPL** | średnia |

Punktacja per kryterium: **3** (spełnia w pełni) / **2** (częściowo) / **1** (słabo/problem).
Maks. 12 pkt / wariant.

---

## 2. Zagadnienie (a): Start Relacji — warianty

### Definicja wariantów

| ID | Opis |
|---|---|
| **A-50** | Zaufanie=20, Respekt=30 → Relacja=50 *(aktualny)* |
| **A-60** | Zaufanie=30, Respekt=30 → Relacja=60 *(legacy-propozycja)* |
| **A-45** | Zaufanie=15, Respekt=30 → Relacja=45 *(alternatywna niska)* |

### Ocena wariantów wg rubryki

| Wariant | SPEC | GRY | PROG | IMPL | SUMA |
|---|---|---|---|---|---|
| **A-50** | 3 | 3 | 3 | 3 | **12** |
| **A-60** | 2 | 2 | 2 | 2 | **8** |
| **A-45** | 2 | 2 | 3 | 3 | **10** |

**Uzasadnienie ocen:**

**A-50 (obecny):**
- SPEC 3: Dyplomacja-zasady.md §1 jawnie dokumentuje start=50=20+30; zgodność 1:1 z `DIPLOMACY_PARAMS.startZaufanie=20`, `startRespekt=30`. Wartości wpisane do `diplomacy.json.params`. Pełna traceability.
- GRY 3: Gracz startuje poniżej progu dyplomacji dla różnych typów (Relacja 45 po −5 kult.) i daleko poniżej progu sojuszu (120). Kierunek nagrody za działania dyplomatyczne jest odczuwalny — każde +6 za dar widoczne. Relacja=50 z neutralnymi drobnymi jest intuicyjna: „nie jesteśmy wrogami, ale i nie przyjaciółmi".
- PROG 3: Próg minimalnej dyplomacji=30 osiągalny, a nawet już pokonany na starcie dla pary Główny↔Drobny (50>30). Próg sojuszu=120 wymaga pracy, ale nie jest blokowany. Progi drobnych: Relacja>30 dla handlu osiągalna od razu przy starcie (50>30) — spójne z tym, że gracz może od razu handlować z drobnymi.
- IMPL 3: Zaimplementowane; `initialRelation()` w diplomacy.ts czyta te stałe wprost. Zero kosztu utrzymania.

**A-60 (legacy):**
- SPEC 2: „60" pojawia się jako wartość zdyskredytowana przez Dyplomacja-zasady.md §6.a: „nie 60, było legacy". Nie ma traceability w żadnym aktualnym dokumencie.
- GRY 2: Para Główny↔Drobny startowałaby przy Relacja=60 — już powyżej progu handlu (30) i zbliżona do progu dyplomacji niemożliwej (odwrotnie: 30 to minimum; 60 jest OK). Problem: para Ten-Sam-Typ startowałaby na 40 (60−20 Zaufanie) — wciąż powyżej minimum (30), co osłabia poczucie rywalizacji wewnątrztypowej. Gracz nie czuje zagrożenia od rywali tego samego typu, bo i tak ich relacja jest stosunkowo dobra.
- PROG 2: Próg sojuszu (120) staje się bliższy startowo — mniej akcji potrzeba do najsilniejszych bonusów. Może skrócić wczesną grę dyplomatyczną (mniejsza przestrzeń do budowania relacji).
- IMPL 2: Wymagałoby zmiany `startZaufanie` z 20 na 30 w `DIPLOMACY_PARAMS`, `diplomacy.json.params` i `Dyplomacja.xlsx`. Drobna zmiana, ale bez uzasadnienia merytorycznego — koszt bez zysku.

**A-45 (niska alternatywa):**
- SPEC 2: Nie pojawia się w żadnym dokumencie spec. Brak podstawy.
- GRY 2: Para Główny↔Drobny startuje poniżej progu handlu (45>30 — OK), ale para różnych głównych startuje na 40 (45−5=40), co jest spójne. Para rywalizacyjna wychodzi na 25 (45−20=25) — poniżej progu dyplomacji (30). To byłoby ciekawe fabularnie (wrogość na starcie), ale blokuje jakiekolwiek natychmiastowe akcje dyplomatyczne z rywalami tego samego typu.
- PROG 3: Progi są "dalej", co daje większą przestrzeń gry dyplomatycznej. Nie ma martwych progów.
- IMPL 3: Koszt: zmiana `startZaufanie` z 20 na 15. Prosta, ale nieuzasadniona.

### Pairwise runda 1: A-50 vs A-60
A-50: 12 pkt vs A-60: 8 pkt → **A-50 wygrywa** (+4 pkt).

### Pairwise runda 2: A-50 vs A-45
A-50: 12 pkt vs A-45: 10 pkt → **A-50 wygrywa** (+2 pkt).

### Pairwise runda 3: A-60 vs A-45
A-60: 8 pkt vs A-45: 10 pkt → **A-45 wygrywa**. (Eliminacja A-60.)

### Zwycięzca (a): **A-50** (obecny, Zaufanie=20 + Respekt=30)

---

## 3. Zagadnienie (b): Zakres Relacji — warianty

### Definicja wariantów

| ID | Opis |
|---|---|
| **B-clamp** | Relacja = Zaufanie+Respekt, clamp 0..200; drobni: próg wojny = 15 *(aktualny)* |
| **B-neg** | Poboczne mają osobny clamp z wartościami ujemnymi (wierny §5.2 spec-szablonu); Relacja głównych = 0..200; Relacja drobnych = −100..+100 (lub analogiczny zakres ujemny) |

*(Tylko dwa warianty; pairwise = jedna runda.)*

### Ocena wariantów wg rubryki

| Wariant | SPEC | GRY | PROG | IMPL | SUMA |
|---|---|---|---|---|---|
| **B-clamp** | 2 | 3 | 3 | 3 | **11** |
| **B-neg** | 3 | 2 | 1 | 1 | **7** |

**Uzasadnienie ocen:**

**B-clamp (obecny):**
- SPEC 2: §5.2 szablonu używa wprost wartości ujemnych (`< −40`). Obecny model remapuje te progi na skalę 0..200. Jest to celowa decyzja projektowa udokumentowana w Dyplomacja-zasady.md §6.b: remapping zaakceptowany, uzasadnienie: Relacja = suma dwóch składowych ≥ 0. Punkt niżej (nie 3) za to, że spec-szablon (§5.2) jest literalnie niespójny z implementacją — gracz/dev musi znać klucz remappingu. Czytelność spec-szablonu obniżona.
- GRY 3: Gracz widzi jedną skalę (0–200) dla wszystkich cywilizacji. Brak dwóch różnych systemów w głowie. Próg wojny drobnych=15 jest intuicyjny: „naprawdę wrogie stosunki → ryzyko wojny". Interpretacja skali naturalnie liniowa (im wyżej, tym lepiej — zawsze).
- PROG 3: Brak martwych progów. Próg handlu drobnych=30 > próg wojny=15 → oba osiągalne. Gracz na 50 jest od razu w bezpiecznej strefie z drobnymi. Degradacja relacji przez −2/turę (ekspansja) jest odczuwalna i prowadzi do przeliczalnych konsekwencji (po ~18 turach od 50 do 15 = guerra).
- IMPL 3: Jeden typ `Relation` (zaufanie 0..100, respekt 0..100). Jeden `relationScore()`. `clamp(0, 100)` per składowa. Brak rozgałęzienia kodu per typ cywilizacji w modelu relacji. Testy 90 asercji przechodzą.

**B-neg (wierny §5.2):**
- SPEC 3: Literalnie wierny §5.2 szablonu (`< −40`, `< −60`). Zero rozbieżności ze spec-szablonem.
- GRY 2: Gracz operuje dwiema skalami: 0..200 dla głównych rywali, zakres-z-ujemnymi dla drobnych. UI musiałoby rozróżniać i wyświetlać różne zakresy. Zwiększa cognitive load. Wartości ujemne są mniej intuicyjne dla casualowego gracza: „−45 to bardzo zła relacja" wymaga wyjaśnienia, podczas gdy „15 na skali 0–200" jest samowyjaśniające.
- PROG 1: Ryzyko martwych progów. Jeśli Relacja drobnych może być ujemna, a próg handlu = >30 (pozytywny), przestrzeń między np. −60 a 30 to martwa strefa bez żadnych możliwych akcji dyplomatycznych. Skomplikowany mapping progów akcji, które dla głównych są na skali 0..200, a dla drobnych na innej. Ponadto — skoro Relacja drobnych = Zaufanie+Respekt, a Zaufanie ≥ 0 i Respekt ≥ 0 z definicji modelu, ujemna Relacja drobnych wymagałaby osobnego pola (nie sumy składowych) — tzn. **osobna implementacja modelu drobnych** niezgodna z obecną architekturą.
- IMPL 1: Wymagałoby nowego pola `relacjaDrobna` (nie `zaufanie+respekt`) lub ujemnych składowych dla drobnych — co łamie obecny `Relation` interface. Alternatywnie: `offset` subtrahowany dla drobnych — ale to ukryty hack. Każda zmiana w `aiDiplomacyStance` musiałaby rozgałęziać się na dwa modele. Koszt implementacji: wysoki; ryzyko regresji: wysokie.

### Pairwise runda 1: B-clamp vs B-neg
B-clamp: 11 pkt vs B-neg: 7 pkt → **B-clamp wygrywa** (+4 pkt).

### Zwycięzca (b): **B-clamp** (obecny, clamp 0..200 + próg drobnych=15)

---

## 4. Wyniki turnieju — podsumowanie

| Zagadnienie | Zwycięski wariant | Obecny stan | Wynik turnieju |
|---|---|---|---|
| **(a) Start Relacji** | A-50: Zaufanie=20 + Respekt=30 | ✅ A-50 | **ZOSTAW** |
| **(b) Zakres Relacji** | B-clamp: 0..200, próg=15 | ✅ B-clamp | **ZOSTAW** |

---

## 5. Rekomendacja

### Decyzja: ZOSTAW obecne dla obu założeń

**Uzasadnienie (a) — Start=50:**
Wartość 50 (Zaufanie=20 + Respekt=30) jest jedyną wartością z pełną traceability przez cały stos (Dyplomacja-zasady.md §6.a → DIPLOMACY_PARAMS → diplomacy.json.params → diplomacy.ts → `initialRelation()`). Turniej potwierdza ją jako najlepiej spełniającą wszystkie cztery kryteria (12/12). Propozycja 60 była jawnie wycofana jako legacy w §6.a, a wariant 45 nie ma podstawy w spec i byłby zmianą bez zysku.

**Uzasadnienie (b) — clamp 0..200 + próg=15:**
Model B-clamp (11/12) jest architektonicznie czysty: jeden `Relation` interface, zero rozgałęzienia na typ cywilizacji w modelu relacji, testy pokryte. Wariant B-neg (7/12) wymagałby osobnej implementacji modelu drobnych niezgodnej z obecnym interface, z ryzykiem martwych progów i podwójnej skali w UI. Rozbieżność ze spec-szablonem §5.2 jest celowa i udokumentowana w §6.b zasad — jest to koszt akceptowalny za ogromny zysk prostoty.

### Koszt zmian: nie ma — brak rekomendowanych zmian

Oba założenia POTWIERDZONE przez turniej. Żadnej zmiany w `diplomacy.ts`, `diplomacy.json` ani `Dyplomacja.xlsx`.

---

## 6. Uwagi dodatkowe (poza zakresem turnieju)

Podczas lektury źródeł zidentyfikowano jedną potencjalną niespójność informacyjną (nie blokującą implementacji):

**§3.2 Dyplomacja-zasady.md** opisuje `progPoboczneWojna` jako remapping z „< −40" na 15, ale **§5.2 Dyplomacja-szablon.md** zawiera też drugi próg: „Relacja ogólna < −60 LUB gracz atakuje → mogą poprosić o pokój". Ten drugi próg (−60) nie jest nigdzie zremappowany w `DIPLOMACY_PARAMS`. Obecny kod obsługuje „gracz atakuje" po stronie silnika (udokumentowane), ale remapped próg „pokój gdy Respekt > 50 + skrajnie niskie stosunki" wydaje się nieobecny jako osobny parametr. Sugestia: przy wdrożeniu `aiDiplomacyStance` drobnych do pętli tury — sprawdzić, czy `progPobocznePokojProsba` jest potrzebny (np. wartość 5).

Nie jest to temat na zmianę kodu przed decyzją mastera.

---

*Dokument: dyspozycje/_handoff/CYWILIZACJE-do-MASTER_turniej-ab.md*
*Wygenerowany: 2026-06-25, subagent CYWILIZACJE (analityk)*
