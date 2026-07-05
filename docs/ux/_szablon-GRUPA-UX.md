# Szablon wpisu UX (jedna powierzchnia)

Skopiuj blok tabeli do `REJEST-UX-MASTER.md` w sekcji swojej grupy.

---

## Metadane sekcji (na górze sekcji grupy)

```markdown
## Grupa X — …
**Ostatnia aktualizacja:** YYYY-MM-DD · **Autor:** …  
**Status:** UX-INWENTARZ GOTOWE | W TRAKCIE | BRAK
```

---

## Tabela (jeden wiersz = jeden UX)

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML (jeśli jest) | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|---------------------------|------------|--------|-------------------------|
| B-01 | Przykład: panel miasta Civ V | Klik miasto gracza na mapie | `gra/src/ui/cityPanel.ts`, `cityUxFrame.ts` | `Gra-podglad-OKOLICA-UX.html` (kanon UX) | tak `showCityPanel` | GOTOWE | Gra-podglad → Nowa gra → klik własne miasto |
| B-02 | Dock szczegółów budynku | Hover miniatura budynku w lewym panelu ~0,4 s | `hoverDetailDock.ts` | — | tak (przez cityPanel) | GOTOWE | W panelu miasta → zakładka Buduj → najedź ikonę |

---

## Pola — definicje

| Pole | Opis |
|------|------|
| **ID** | Prefiks grupy + numer (`A-01`, `B-12`) |
| **Kiedy widoczny** | Konkretny trigger: klik, hover, koniec tury, warunek gry |
| **Moduł TS** | Główny plik; jeśli kilka — wypisz wszystkie |
| **Mockup HTML** | Osobny plik podglądu; `—` jeśli tylko w silniku |
| **W main.ts?** | `tak` / `nie` / `częściowo` + funkcja `show…` jeśli znasz |
| **Status** | `GOTOWE` · `MOCKUP` · `PLACEHOLDER` · `WPIĘTE` · `PLAN` |
| **Jak zobaczyć** | Max 2 zdania dla Macieja |

---

## Checklist przed „GOTOWE”

- [ ] Wszystkie `show*` / panele z Waszego charteru są w tabeli
- [ ] Panele **tylko po kliku** są opisane (nie pomijamy „ukrytych”)
- [ ] Martwe mockupy HTML oznaczone `ARCHIWUM` lub `USUNIĘTO`
- [ ] Brak duplikatów — ten sam UX jeden wiersz (cross-lane → notatka w kolumnie Status)
