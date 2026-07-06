# ABC — kanon pytań do Macieja (decyzja Macieja)

> **Data:** 2026-06-26 · **Status:** 🟢 **KANON** — obowiązuje Grupy A–E + Master  
> **Reguła Cursor:** `.cursor/rules/abc-pelna-forma.mdc` · **Szablon:** `SZABLON-PYTANIA-ABC.md`

---

## Co Maciej wymaga w każdym pytaniu ABC

Każde pytanie musi dać **pełny kontekst**, żeby Maciej mógł zdecydować bez domyślania się.

### 1. Opis sytuacyjny (**Sytuacja**)

- Co jest **dziś** w grze — co widzi gracz, na jakim ekranie, co już działa, czego brakuje.
- **Pełne nazwy** — bez skrótów (np. „P2", „lane", same identyfikatory techniczne); używaj nazw z gry (np. „Panel-C", „Auto-walka na mapie świata").
- Język gracza, 2–4 zdania.

### 2. **Cel pytania**

- Po co pytamy — **jaki efekt ma mieć decyzja Macieja** w grze.
- Maciej musi od razu wiedzieć, **czego od niego oczekujemy**.
- 1–2 zdania.

### 3. **Dlaczego teraz**

- Czemu akurat **w tym momencie** — blokada, ryzyko, zależność.
- 1–3 zdania.

### 4. Opcje **A**, **B**, **C** — każda osobno

Dla **każdej** opcji obowiązkowo:

| Element | Co wpisać |
|---------|-----------|
| **Opis decyzji** | Co dokładnie zrobimy w grze (pełne nazwy) |
| **Za** | Min. **2** argumenty za tą opcją |
| **Przeciw** | Min. **2** argumenty przeciw tej opcji |

Bez skróconych list typu „A: szybciej / B: więcej pracy".

### 5. **Rekomendacja** — zawsze

- Agent **zawsze** podaje rekomendację: **A**, **B** albo **C**.
- Format: **Rekomendacja: B** — jedno zdanie dlaczego.

### 6. Paczki — max **3** pytania na turę (Maciej 2026-07-04)

- **Jedna wiadomość** + **jeden** `AskQuestion` = **maksymalnie 3** pytania (nie 10).
- Kolejka dłuższa → **paczki po 3** (`[PACZKA 1/4]` …), następna paczka **po** ECHO + odpowiedzi Macieja.
- **Powód:** paczki po 10 zerwają sesję w połowie — lepiej **10 rund × 3** niż **3 rundy × 10** z utratą postępu.

### 7. Formularz Ask (dopiero na końcu)

**Najlepsze rozwiązanie (Maciej, potwierdzenie):** **pełen kontekst w tekście czatu** + **krótkie etykiety w formularzu AskQuestion**.

- **W czacie:** Sytuacja · Cel · Dlaczego teraz · A/B/C (opis + Za + Przeciw) · Rekomendacja — **całość do przeczytania**.
- **W `AskQuestion`:** tylko **krótkie pytania / etykiety** A, B, C (bez powtarzania Za/Przeciw, bez kontekstu).
- **ZAKAZ:** sam formularz bez tekstu w czacie · długie opisy w formularzu.

---

## Cytat Macieja (2026-06-26, potwierdzenie kolejności)

> Opis sytuacyjny → **Cel pytania** → **Dlaczego teraz** → opcje A/B/C (Za/Przeciw) → **Rekomendacja** → formularz na końcu (krótkie etykiety; kontekst w czacie).  
> Bez skrótów typu „P2", „lane", same identyfikatory techniczne.

---

## Hasła Macieja

| Hasło | Efekt |
|-------|--------|
| **`format`** / **`ABC`** | Agent **natychmiast** przepisuje pytanie w pełnej formie (bez tłumaczeń) |

---

## Kto stosuje

| Rola | ABC gameplay |
|------|----------------|
| Grupy A–E | **TAK** — ten kanon |
| Master (hub) | **TAK** — ten kanon |
| Grupa F (Integrator) | **NIE** — tylko technika, bez pytań gameplay do Macieja |
