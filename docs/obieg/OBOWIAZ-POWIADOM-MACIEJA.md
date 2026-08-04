# OBOWIĄZ — powiadom Macieja (czat + plik MD)

> **Decyzja Macieja (2026-06-26):** gdy coś **przygotujesz**, napisz mu **w czacie** **`✅ Gotowe:`** / **`⏸️ Czeka:`** **oraz dopisz wpis** do [`docs/MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) — nie tylko dziennik operacyjny.

> **Decyzja Macieja (2026-08-02):** gdy jest **coś do przetestowania w `gra-robocza/`**, w czacie **najpierw** banner tekstowy **GOTÓW DO TESTU** (md5 + Ctrl+F5 + co sprawdzić). Bez bannera Maciej **nie testuje**. Reguła Cursor: [`.cursor/rules/gotow-do-testu.mdc`](../../.cursor/rules/gotow-do-testu.mdc).

> **Decyzja Macieja (2026-08-02 wieczór):** skończyłeś kod w źródłach → **natychmiast** w czacie **`✅ Gotowe w źródłach`** + pytanie **„Wrzucić na ROBOCZA?”**. **ZAKAZ** milczeć i czekać, aż Maciej przypomni o deployu / teście. Po deployu — od razu banner GOTÓW DO TESTU (bez „a mogę testować?”).

---

## Banner testu (ROBOCZA) — obowiązkowy

Gdy paczka jest w roboczej i Maciej ma odpalić grę:

```
╔══════════════════════════════╗
║   ✅ GOTÓW DO TESTU          ║
╚══════════════════════════════╝
```

Pod spodem: **md5** · **Ctrl+F5 → `gra-robocza/START.html`** · **1–3 punkty „co sprawdzić”**.

Wiszący subagent w UI Cursor ≠ sygnał. Dopiero ten banner = „możesz testować”.

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

- [`.cursor/rules/gotow-do-testu.mdc`](../../.cursor/rules/gotow-do-testu.mdc) — banner **GOTÓW DO TESTU** (2026-08-02)
- [`PLOT-CODE-WORKFLOW.md`](PLOT-CODE-WORKFLOW.md) — hasło **`plot code`**
- [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md)
- [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)

---

*Obowiązuje: Master · lane A–E · UI · Integrator (meldunek do Macieja tylko gdy Master prosi)*
