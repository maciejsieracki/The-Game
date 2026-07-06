# Charter — Grupa D — Cywilizacje / Dyplomacja / AI

> **Zakładka Cursor:** `Grupa D — Cywilizacje / Dyplomacja / AI`  
> **Ten czat = 9 typów cywilizacji, bonusy nacji, dyplomacja, AI rywali + archetypy + barbarzyńcy.**  
> **NIE ten czat:** nauka + drzewko technologii → **Grupa B**.  
> Obowiązuje: `docs/decyzje/DYSPOZYCJA-STALA.md` + ten plik.

## Przepływ i raportowanie

**Obieg:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md`

1. Implementacja modułów Grupy D — **bez** `main.ts`, **bez** `Gra-podglad.html`.
2. Raport: `docs/obieg/D-cywilizacje.md` · `REJESTR-DECYZJI.md`.
3. Maciej: **`przekaż do Mastera`** → handoff + Slack → Master → Integrator F → kanon → **REJESTR §2** (lane milczy · playtest = Master).

**Hasła Macieja:** `działaj` · `przekaż do Mastera` · A/B/C · `format`

---

## Za co odpowiadacie

| Obszar | Odpowiedzialność |
|--------|------------------|
| **Kultura** | Idee, pasek kultury, wpływ na Wealth |
| **Dyplomacja** | Relacje, Respekt, tier T1–T4, panel dyplomacji |
| **Bonusy cyw** | `civBonusy`, roster, efekty w `civs.json` |
| **AI rywali** | Archetypy AI, zachowanie rywali, barbarzyńcy |
| **Model startu / miasta typu** | Kopie typu na mapie, AI defensywne — **`docs/grupa-d/MODELE-MIAST-TYPU.md`** |

**Moduły:** `data/civs`, `loader.ts`, `diplomacy.ts`, `ai.ts`, `barbarians.ts` (+ handoff do Grupy B przy kulturze/Wealth).

---

## Tematy w tym czacie (D1–D4)

| ID | Nazwa | Plik | Pytania do Macieja | Status |
|----|-------|------|-------------------|--------|
| **D1** | Nauka | `D1-nauka.md` | — (implementacja → **Grupa B**) | **ZAMKNIĘTE** dec. · kod w B |
| **D2** | Kultura | `D2-kultura.md` | D2-Q* | **ZAMKNIĘTE** |
| **D3** | Dyplomacja | `D3-dyplomacja.md` | **ZAMKNIĘTE** (D3-Q1=A modal) | **CZĘŚCIOWO** — UI akcje czeka |
| **D4** | Bonusy cyw | `D4-bonusy-cyw.md` | D4-Q* · tuning balansu | **ZAMKNIĘTE** (implementacja) |
| **D-START** | Miasta-kopie typu | `D-START-miasta-kopie-typu.md` | **ZAMKNIĘTE** (Maciej 2026-06-27) | **TODO implementacja** AI defensywne + pełny spawn obcych klastrów |

**Większość decyzji zamknięta** — ten czat głównie **implementuje** i pyta tylko gdy:
- brakuje parametru do kodu,
- konflikt z inną grupą,
- nowy tuning wymaga ABC (np. koszty tech batch → eskaluj do **Grupa B**).

**Ekran:** `[EKRAN: Panel]` (dyplomacja), `[EKRAN: Logika]` (bonusy, AI).

---

## Jakie pytania ABC wolno Maciejowi (tylko ta grupa)

**WOLNO pytać o:**
- Idee kultury, progi (D2)
- UI dyplomacji, progi Respektu (D3 — jeśli coś otwarte)
- Mechanizacja bonusów, priorytety tierów (D4)
- Archetypy AI, barbarzyńcy, zachowanie rywali

**ZAKAZ pytań w tym czacie:**

| Temat | Gdzie |
|-------|--------|
| HUD mapy, jednostka na heksie | **Grupa A** |
| Panel miasta, Wealth suwaki, drzewko nauki | **Grupa B** |
| Walka, bitwa, katapulta | **Grupa C** |
| Menu nowej gry, warunki zwycięstwa (meta) | **Grupa E** |

---

## Pytania do Mastera

`docs/decyzje/D4-PYTANIA-DO-SILNIKA.md` itd.

Raport: `dyspozycje/CYWILIZACJE-DO-MASTERA.md`.

---

## Uwaga operacyjna

Jeśli agent widzi „pytanie o mapę" lub „bitwę" — **STOP**, odesłanie do właściwej Grupy.  
Jeśli pytanie dotyczy **nauki/tech** — **STOP**, odesłanie do **Grupy B**.  
Przed paczką ABC: sprawdź `docs/decyzje/<ID>-*.md` — może decyzja **już jest zamknięta** (nie pytaj ponownie).
