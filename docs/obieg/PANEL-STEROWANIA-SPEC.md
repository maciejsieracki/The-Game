# 📊 PANEL STEROWANIA (Excel per grupa) — specyfikacja wspólna

> **Cel (Maciej, 2026-06-28):** jeden Excel na grupę = panel sterowania, w którym Maciej kręci parametrami i balansuje grę. Dziś parametry są rozsiane po ~15 plikach — mają trafić do jednego pliku per grupa.
> **Decyzje:** PANEL-1…PANEL-4 → `docs/obieg/REJESTR-DECYZJI.md`. Nazewnictwo grup: `docs/obieg/NAZEWNICTWO-GRUP.md`.
> **Robią grupy:** A, B, C, D, E (każda swój plik). **Grupa F** = bez panelu (wpina ewentualne zmiany `main.ts`).
> **Scalenie legacy (2026-06-30):** `docs/obieg/PANEL-MERGE-ORCHESTRACJA.md` · tracker `PANEL-MERGE-TRACKER.md` · dyspozycje `dyspozycje/_handoff/MASTER-do-GRUPY_PANEL-MERGE.md`

---

## 1. Model: Excel = ŹRÓDŁO PRAWDY (PANEL-2 = B)

Docelowo gra czyta parametry z Excela (przez eksport do JSON). Łańcuch:

```
Panel-X.xlsx  →  export-X.py (Excel→JSON)  →  gra/data/*.json  →  gra czyta
```

- Excel jest **nadrzędny**: zmiana wartości w Excelu + eksport = zmiana w grze (round-trip).
- Jeśli gra **już** czyta dany parametr z JSON (np. `civs.json`, `buildings.json`, `units.json`) — tylko upewnij się, że Excel zasila ten JSON.
- Jeśli parametr jest **zaszyty w kodzie** (`.ts`) — wyprowadź go do JSON i podmień odczyt; gdy wymaga to `main.ts` → **handoff do Grupy F (Integrator)**, nie ruszaj `main.ts` sam.
- Eksport: **skrypt celowany per grupa** (`panele-sterowania/export-<grupa>.py`) — NIGDY wspólny `export-data.py` (ryzyko nadpisania cudzych JSON).

---

## 1a. Jak Maciej kręci balansem — BEZ TERMINALA (twarda zasada)

> **Maciej NIGDY nie wpisuje `python`, `pip` ani niczego w terminal.** Żadna grupa nie pisze do Macieja „Twoje kroki (terminal)", „uruchom python…", „zainstaluj…". To łamie zasadę i jest odrzucane.

Przepływ zmiany balansu (rola Macieja = tylko Excel + jedno słowo w czacie):

1. **Maciej:** otwiera `panele-sterowania/Panel-X.xlsx`, zmienia kolumnę **Wartość**, zapisuje.
2. **Maciej:** pisze w czacie grupy: **`eksportuj panel`** (albo „zmieniłem panel, zaktualizuj grę").
3. **Agent grupy:** sam odpala `export-<x>.py` (i instalację zależności, jeśli trzeba) → aktualizuje JSON.
4. **Agent:** jeśli zmiana wymaga odczytu w `.ts`/`main.ts` → handoff do Integratora; inaczej 🟢 izolowana, gotowe.
5. **Agent:** raportuje krótko: „panel X wyeksportowany, gra zaktualizowana" (bez ścian komend).

Instalacja Pythona/`openpyxl`, ścieżki interpretera, `--dry-run` itp. = **wyłącznie sprawa agenta**, nigdy treść do Macieja.

---

## 2. Struktura skoroszytu (PANEL-3 = A — wspólny standard)

- **Jeden skoroszyt na grupę.** Arkusze (zakładki) = kategorie parametrów.
- **Kolumny (identyczne we wszystkich grupach):**

| Kolumna | Co wpisać |
|---|---|
| **ID** | unikalny klucz parametru (np. `B-FOOD-GROWTH`, `C-UNIT-HASTATI-ATK`) |
| **Parametr** | krótka nazwa techniczna |
| **Opis** | prostym językiem — co to robi w grze (dla Macieja) |
| **Wartość** | obecna wartość (to pole Maciej zmienia) |
| **Zakres/dozwolone** | min–max lub lista dozwolonych wartości |
| **Jednostka** | %, tury, pkt, sztuki itp. |
| **Wpływ na grę** | 1 zdanie: co się stanie, gdy podkręcę w górę/w dół |
| **Plik źródłowy** | gdzie w kodzie/JSON ten parametr żyje |

- Pierwszy arkusz **`_INFO`**: jak używać panelu, jak uruchomić eksport, data ostatniej synchronizacji, kontakt (która grupa).

---

## 3. Proces w każdej grupie (5 kroków — kolejność obowiązkowa)

1. **Inwentaryzacja** — znajdź WSZYSTKIE swoje parametry balansu (lista źródeł §5). Zrób spis.
2. **Budowa panelu** — `panele-sterowania/Panel-<X>.xlsx` wg standardu §2.
3. **Wpięcie (źródło prawdy)** — `export-<x>.py` Excel→JSON; podmień odczyt w grze; round-trip test (zmiana w Excel → eksport → widać w grze). `main.ts` → handoff do Grupy F.
4. **Przeniesienie zadań** — ze starych plików wyciągnij **otwarte zadania/decyzje** → `docs/ROADMAP.md` (właściwy rozdział) + plik obiegu grupy. **Nic nie ginie.**
5. **Archiwizacja** — dopiero teraz przenieś stare pliki parametrów do `docs/archiwum/` (kopia 1:1, nie kasuj treści).

**Raport po wykonaniu:** wpis `→ INTEGRATOR: GOTOWE` (jeśli dotyka kodu/`main.ts`) + aktualizacja statusu w `REJESTR-DECYZJI.md` (PANEL-2 dla swojej grupy) + 1 linia w pliku obiegu.

---

## 4. Lokalizacja i nazwy (PANEL-4 = A)

- Folder: **`panele-sterowania/`** (root projektu).
- Pliki: `Panel-A.xlsx`, `Panel-B.xlsx`, `Panel-C.xlsx`, `Panel-D.xlsx`, `Panel-E.xlsx`.
- Skrypty: `panele-sterowania/export-a.py` … `export-e.py`.
- Build/eksport zgodnie z regułami OneDrive (`.cursor/rules/civ-workflow.mdc` §6/§8).

---

## 5. Co która grupa zbiera (źródła — grupa uzupełnia własnymi)

| Grupa | Kategorie parametrów | Przykładowe źródła do zebrania |
|---|---|---|
| **A — Mapa** | generator mapy, mgła, ulepszenia terenu, zasięgi, typy świata | `MIASTO/Ulepszenia-terenu.xlsx`, params generatora w `map/*`, defaulty mapSize |
| **B — Miasto/Eko/Tech** | plony, koszty, utrzymanie, progi szczęścia/porządku, żywność, Wealth, drzewko tech | `economy.ts` stałe, `buildings.json`, upkeep, B2 progi (`docs/decyzje/B2-*`), B5 żywność, tech |
| **C — Walka** | macierz jednostek, oblężenie, stałe walki | `units.json` (macierz v2.0), `siege.ts`, `combat.ts` stałe |
| **D — Cyw/Dyplo/AI** | bonusy cywilizacji, parametry AI, dyplomacja, barbarzyńcy | `Cywilizacje.xlsx`, `Bonusy-cywilizacji-9x3.xlsx`, `civs.json`, `civ-ai.json`, `diplomacy.ts`, `barbarians.ts` |
| **E — Start/Meta/UI** | defaulty startu, warunki zwycięstwa, trudność/skala AI rywali | E1 defaulty (`docs/decyzje/E1-*`), E2 victory, skala rywali, `victory.ts` |

---

## 6. Definition of Done (sprawdza Master/Opus przed kanonem)

- [ ] `Panel-<X>.xlsx` istnieje, wszystkie parametry, kolumny wg §2, arkusz `_INFO`.
- [ ] `export-<x>.py` działa: Excel → JSON; gra czyta z JSON.
- [ ] Round-trip: zmiana wartości w Excelu widoczna w grze po eksporcie.
- [ ] Otwarte zadania przeniesione do ROADMAP/obieg (nic nie zginęło).
- [ ] Stare pliki parametrów zarchiwizowane (1:1) w `docs/archiwum/`.
- [ ] Status PANEL-2 w `REJESTR-DECYZJI.md` zaktualizowany dla grupy.

---
🔗 Zasady: `docs/obieg/_ZASADY.md` · Słownik: `docs/obieg/NAZEWNICTWO-GRUP.md` · Cała gra: `docs/ROADMAP.md`
