# MASTER → MIASTO (+ UI): info jednostek vs balans walki — 2026-07-03

**STATUS: INFO / GOTOWE (Master)** · kanon md5 **`04d21f3087be8f4e85470ddad2335e70`**

---

## Dlaczego dotyczy miasta

Panel miasta (`cityPanel.ts`) pokazuje **statystyki jednostek** w kolejce produkcji i w encyklopedii osadzonej w UI miasta. Po passie balansu walki gracz musiał widzieć **te same liczby**, co silnik — wcześniej sekcja „Walka” pokazywała **stare kolumny Excel** (`Atak`, `Health`), podczas gdy bitwa używa TW.

---

## Co Master wdrożył (bez zmian logiki miasta)

| Obszar | Zmiana |
|--------|--------|
| **Wyświetlanie** | sekcja Walka w karcie jednostki → pola TW (`meleeAttack`, `health`, `missileAttack`…) |
| **Ekonomia / produkcja** | **bez zmian** — koszty, tempo, surowce jak wcześniej |
| **Garnizon / obrona miasta** | **bez zmian kodu** — HP jednostek w walce bierze `unitHealth()` z `health` (już TW) |
| **Społeczeństwo / zadowolenie** | **bez zmian** |

---

## Co lane MIASTO / EKONOMIA ma wiedzieć

1. **Nie trzeba** przeliczać produkcji ani kosztów — tylko **spójność prezentacji** z UNITS.
2. Jeśli w specach miasta / wiki jest tekst typu „Łucznik Atak 30” — **aktualizacja treści** do TW (np. HP 12, missile 3) — decyzja redakcyjna, nie kod produkcji.
3. **Playtest:** wyprodukuj Łucznika → otwórz szczegóły w panelu → porównaj z bitwą testową (T).
4. **Milicja** z oblężenia — osobny temat UNITS; nie objęta pass `units.json`.

---

## Powiązane handoffy

- `_handoff/MASTER-do-UNITS_balans-scena-T-2026-07-03.md` — silnik + JSON + bundle
- `_handoff/MASTER-do-UI_statystyki-TW-jednostki-2026-07-03.md` — szczegóły pól UI
