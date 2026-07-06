# Master Silnik — handoff sesji (2026-06-26 / 27)

> **Ten czat = Master Silnik.** Nie pytasz ABC gameplay — to Grupy A–E.  
> **Maciej:** `czaty` · `weryfikuj` · `wpięcie <ID>` · `status`

---

## Model (2 warstwy)

| Czat | Rola | Komenda Macieja |
|------|------|-----------------|
| **Grupa A–E** | ABC + implementacja lane | `master` → czytaj `OD-MASTERA.md` |
| **Grupa F** | `main.ts` + bramka + ROBOCZA | `master` → § F |
| **Master Silnik** (ten) | orkiestracja, Opus, finalna | `czaty` → czytaj `DO-MASTERA.md` |

**Schemat 2 wersje:** `docs/czaty/SCHEMAT-DWIE-WERSJE.md`

**Pliki komunikacji (append-only):**
- Silnik → czaty: `docs/czaty/OD-MASTERA.md` (sekcje A–E)
- Czaty → Silnik: `docs/czaty/DO-MASTERA.md` (sekcje A–E)
- Lane technicznie: `dyspozycje/<LANE>-DO-MASTERA.md`
- Pytania techniczne: `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`

**Po ABC Macieja agent robi KROK A–G** (`docs/decyzje/DYSPOZYCJA-STALA.md`):
- A decyzje → `docs/decyzje/<ID>.md`
- E1 raport → `dyspozycje/<LANE>-DO-MASTERA.md`
- E2 raport → `docs/czaty/DO-MASTERA.md` § Grupa
- **Bez E1+E2 = praca nieuznana**

**Maciej NIE raportuje ręcznie** — odpowiada ABC w czacie grupy, potem tu: `czaty`.

---

## Pierwszy raz w zakładce (raz)

`docs/czaty/PIERWSZE-URUCHOMIENIE-KOMENDY.md` + dyspozycja grupy:
- A: `DYSPOZYCJA-GRUPA-A.md`
- B: `DYSPOZYCJA-GRUPA-B.md`
- C/D/E: analogicznie
- Silnik: `DYSPOZYCJA-MASTER-SILNIK.md`

Indeks: `docs/czaty/README.md` · routing pytań: `docs/decyzje/MAPA-PYTAN-OPEN.md`

---

## Routing pytań (skrót)

| Legacy | Nowy ID | Grupa |
|--------|---------|-------|
| Q4 jednostka | **A2-Q4** | A (mapa świata) |
| Q5–Q10 HUD | **A1-Q5…Q10** | A (nie A2!) |
| Q1 żywność | B5 | B (zamknięte) |
| Q2 bilans | A1-Q2 | zamknięte |
| Q3 zadowolenie | B2 | zamknięte per miasto |
| C2 minimapa bitwy | **C2-Q2…Q7** | C (≠ A2) |
| B1.1–B5.2 | Bx.y | B |

**D1–D15 (KARTA):** wszystkie zamknięte.

**Otwarte ABC łącznie:** ~33–38 (albo ~29–34 jeśli C2 = jedna akceptacja D5=B).

---

## Stan na koniec sesji (`czaty` ×2)

| Grupa | DO-MASTERA | Co dalej |
|-------|------------|----------|
| **A** | brak | `master` · D1B lub A1-Q5…Q10 |
| **B** | CZEKA na ABC | Maciej: B2.1…B2.5 w czacie B |
| **C** | brak | C2 akceptacja D5=B lub C2-Q2…Q7 |
| **D** | brak | implementacja D1–D4, bez ABC |
| **E** | brak | E2 głównie otwarte |

**Poza protokołem:** EKONOMIA 2026-06-27 — podziałHandlu/Pracy per city (B3) w `EKONOMIA-DO-MASTERA.md`, **bez** wpisu w `DO-MASTERA.md`.

**Lane 26.06 (stary model):** UI mockup D1B, UNITS C2 kod, CYW sprint — czeka wpięcie / akceptacje.

---

## Plan Macieja (ustalony)

1. Wkleić dyspozycje / komendy do zakładek A–E + Silnik
2. Praca w grupach (ABC)
3. Tu: **`czaty`** — Silnik sprawdza zgodność
4. **`weryfikuj`** — pełna bramka + spójność

---

## Kluczowe pliki (START)

| Plik | Rola |
|------|------|
| `docs/decyzje/DYSPOZYCJA-STALA.md` | paste dla czatów A–E |
| `docs/decyzje/MAPA-PYTAN-OPEN.md` | kto pyta o co + licznik |
| `docs/decyzje/STATUS.md` | dashboard |
| `docs/MASTER-SILNIK.md` | procedura weryfikuj |
| `dyspozycje/DZIENNIK-MASTERA.md` | rejestr operacyjny |

*Ostatnia aktualizacja handoff: 2026-06-27*
