# OBOWIĄZ — powiadom Macieja (czat + plik MD)

> **Decyzja Macieja (2026-06-26):** gdy coś **przygotujesz**, napisz mu **w czacie** **`✅ Gotowe:`** / **`⏸️ Czeka:`** **oraz dopisz wpis** do [`docs/MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) — nie tylko dziennik operacyjny.

---

## Kiedy pisać (czat **i** plik)

| Sytuacja | Czat | Plik MD |
|----------|------|---------|
| Skończyłeś batch kodu / eksport / handoff | **✅ Gotowe:** … | Dopisz sekcję ✅ w [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) |
| Czekasz na plik Macieja (Design, folder) | **⏸️ Czeka:** … | Dopisz sekcję ⏸️ w [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) |
| Trigger **`plot code`** — po skan + praca | **Zawsze** | **Zawsze** |
| Trigger **`działaj`** — po wdrożeniu | **Zawsze** | **Zawsze** |
| **`przekaż do Mastera`** (grupa) | Slack + krótka linia Gotowe (gdy Maciej w czacie) | Tylko gdy Master prosi Macieja o status paczki |

---

## Format (kopiuj szablon)

**Sukces:**

```
✅ Gotowe: [co — jedno zdanie]

📁 [pliki]
🧪 [testy opcjonalnie]
⏭️ Od Ciebie: [nic / konkretna akcja]
```

**Bloker:**

```
⏸️ Czeka: [co brakuje]

🔓 Od Ciebie: [jedna akcja]
```

---

## Plik MD — [`docs/MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md)

1. **Append-only** — nowy wpis **na górze** (pod nagłówkiem / po `---`).
2. **Ten sam sens co czat** — tabela: Kto · Co · Pliki · Testy · Od Ciebie · Handoff.
3. **Szablon** — na dole pliku `MACIEJ-GOTOWE.md` (kopiuj).
4. **Nie duplikuj** całego handoffu — tylko skrót + link do pliku w `_handoff/`.

## Zasady (czat)

1. **Dziennik operacyjny ≠ wystarczy** — Maciej **nie musi** czytać `DZIENNIK-MASTERA.md`.
2. **Bez ściany** — max 5–8 linii na czacie; szczegóły w `MACIEJ-GOTOWE.md` + handoff.
3. **Nie proś o playtest** (grupy) — tylko Master po kanonie.
4. **Nie proś o wklejanie** między czatami — handoff w repo.

---

## Powiązane

- [`PLOT-CODE-WORKFLOW.md`](PLOT-CODE-WORKFLOW.md) — hasło **`plot code`**
- [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md)
- [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

---

*Obowiązuje: Master · lane A–E · UI · Integrator (meldunek do Macieja tylko gdy Master prosi)*
