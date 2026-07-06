# Lane A–E / F — NIE przyjmuj roli MASTER (KANON 2026-07-03)

> **Problem:** agent w czacie grupy po haśle `master` lub fladze `→ MASTER: master` **buduje kanon**, odpala `publish-kanon-snapshot.ps1`, „przejmuję rolę MASTER" — **to błąd**.
> **Trigger naprawy:** Maciej zgłasza rozjazd ról · wpisz **`zakres`** + ten plik w czacie grupy.

---

## Słownik (nie mylić)

| Tekst | Co to **jest** | Co agent **robi** |
|-------|----------------|-------------------|
| **`→ MASTER: master`** | **Flaga meldunku** w `*-DO-MASTERA.md` = „paczka gotowa, odbierz w **hubie Master**" | Lane: dopis pliku + handoff · **KONIEC** |
| **`→ MASTER: GOTOWE`** | To samo (preferowane) | j.w. |
| Maciej **`przekaż do Mastera`** | Hasło w czacie **grupy** | Handoff + Slack · **bez** build/kanon |
| Maciej **`master`** w **hubie Master** | Orkiestracja | **Tylko** ten czat: F, review, promocja |
| Maciej **`master`** w **czacie grupy A–E** | **Pomyłka rutyny** (Maciej mógł pomylić czat) | Lane **nie** orkiestruje — patrz § poniżej |

---

## Co lane robi po meldunku (3 kroki max)

1. **Self-check** — testy lane, pliki w swoim zakresie.
2. **Meldunek** — append `*-DO-MASTERA.md` + `_handoff/*-do-MASTER*.md` · flaga **`→ MASTER: GOTOWE`** (lub legacy `→ MASTER: master`).
3. **Stop** — odpowiedź Maciejowi: 3–5 linii *co zrobiono · testy · handoff · „Master w hubie: build/F/kanon"*.

**Lane NIE robi:** `npx vite build` do kanonu · `publish-kanon-snapshot.ps1` · `publish-robocza` (to **Integrator F**) · edycja `Gra-podglad.html` root · `gra-kanon/` · `main.ts` (to **F**).

---

## Gdy Maciej wpisze `master` w czacie GRUPY

**ZAKAZ:** „Przejmuję rolę MASTER" · build · promocja kanon.

**Odpowiedź (szablon):**

> To hasło orkiestracji działa w **czacie Master (hub)**, nie w lane [A/B/C/D/E].  
> U mnie paczka jest w `*-DO-MASTERA.md` + handoff. **Master** w hubie: dyspozycja F → robocza → review → kanon.  
> Ty: **`przekaż do Mastera`** już zrobione / **`raport2`** · ewentualnie otwórz hub i wpisz tam **`master`**.

---

## Gdy agent widzi flagę `→ MASTER: master` w meldunku

To **adresat = hub Master**, nie „teraz jestem Masterem".

- **W czacie grupy:** traktuj jako „mój meldunek jest kompletny" — **nie** wykonuj kroku Mastera.
- **W czacie Master:** Master czyta meldunek → dyspozycja F / review / `start3`.

---

## Powiązane

- [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md) · [`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)
- `.cursor/rules/komendy-raport.mdc` · `.cursor/rules/master-silnik-orchestration.mdc`
- [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md) — tylko Master promuje `gra-kanon/`
