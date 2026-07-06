# ABC — jak pytać Macieja (JEDYNY wzór obiegu)

> **Status:** 🟢 **KANON** · **2026-06-26** (format) · **max 3/paczka — 2026-07-04** (Maciej)  
> **Dotyczy:** Grupy A–E + Master · **NIE** Grupa F  
> **Stary wzór** („O co chodzi i dlaczego", Plusy/Minusy, sam formularz Ask) — **WYCOFANY · NIE CZYTAJ**

---

## ⛔ Zanim zadasz pytanie — OBOWIĄZKOWO

1. Otwórz ten plik **+** `docs/decyzje/ABC-FORMAT-KANON-MACIEJ.md` **+** `docs/decyzje/SZABLON-PYTANIA-ABC.md`
2. Napisz **pełny tekst w czacie** (kroki 1–5 poniżej)
3. **Dopiero potem** jeden `AskQuestion` z krótkimi etykietami

**ZAKAZ:** sam `AskQuestion` bez tekstu · skróty · brak rekomendacji

**Kanoniczny podział:** pełen kontekst **w tekście czatu** → krótkie etykiety **w formularzu Ask** (na końcu).

Maciej: **`format`** / **`ABC`** → przepisz natychmiast, bez tłumaczeń.

---

## Paczki — max **3** pytania (Maciej 2026-07-04)

- **Jedna wiadomość** + **jeden** `AskQuestion` = **maks. 3** pytania ABC (pełny tekst każdego + 3 wpisy w formularzu).
- **Więcej w kolejce** → podziel na paczki po 3: `[PACZKA 1/4]`, `[PACZKA 2/4]`…
- **Po paczce:** ECHO → START (wdrażaj?) → następna paczka **dopiero potem**.
- **Powód:** paczki po 10 **zerwają czat w połowie** — Maciej traci odpowiedzi.

---

## Kolejność w wiadomości (każde pytanie)

Nagłówek: **`[EKRAN: …]`** lub **`[TEMAT: …]`** + **ID** (`C-BAL-Q1`, `B2-Q7`)

| # | Sekcja | Co piszesz |
|---|--------|------------|
| **1** | **Sytuacja** | Opis sytuacyjny — pełne nazwy; **bez** skrótów (P2, lane, same ID techniczne) |
| **2** | **Cel pytania** | Po co pytamy — jaki efekt ma mieć decyzja Macieja |
| **3** | **Dlaczego teraz** | Czemu akurat w tym momencie |
| **4** | **A / B / C** | Każda opcja: **opis decyzji w grze** + **Za** (≥2) + **Przeciw** (≥2) |
| **5** | **Rekomendacja** | **Zawsze** litera **A**, **B** albo **C** + jedno zdanie dlaczego |
| **6** | **AskQuestion** | Na końcu paczki — krótkie etykiety A/B/C (**bez** Za/Przeciw) |

---

## Pełne nazwy — przykłady

| ✅ TAK | ❌ NIE |
|--------|--------|
| Panel-C (macierz jednostek) | samo „Panel" |
| Auto-walka na mapie świata | samo „Auto" |
| ekran przed bitwą (preBattle) | samo „preBattle" bez kontekstu |

---

## Self-check (wszystkie TAK — inaczej nie wysyłaj)

- [ ] **Sytuacja** · **Cel pytania** · **Dlaczego teraz** — osobne sekcje?
- [ ] Pełne nazwy — zero niejasnych skrótów?
- [ ] A, B, C — każda: opis + Za (≥2) + Przeciw (≥2)?
- [ ] **Rekomendacja** A/B/C — **zawsze**?
- [ ] Pełny tekst w czacie **przed** `AskQuestion`?
- [ ] Max **3** pytania · nagłówek `[PACZKA x/y]` · jeden formularz Ask na paczkę?

---

## Po odpowiedzi Macieja

**ECHO** → **AskQuestion** „wdrażaj?" → **AKCJA** po **Tak**  
Reguła: `.cursor/rules/decyzje-echo.mdc`

---

## Pliki (tylko te — nie szukaj starego wzoru)

| Plik | Rola |
|------|------|
| **`_ABC-JAK-PYTASZ.md`** | ten plik — skrót obiegu |
| **`ABC-FORMAT-KANON-MACIEJ.md`** | cytat + spec Macieja |
| **`SZABLON-PYTANIA-ABC.md`** | przykład do kopiowania |
| **`abc-pelna-forma.mdc`** | reguła Cursor (alwaysApply) |

**NIE używaj:** „O co chodzi i dlaczego" · `REGULA-ABC.md` (legacy) · samych etykiet w Ask.
