# Grupa E — Meta / start / AI (katalog roboczy)

**Trigger Macieja:** `start` → czytaj `docs/obieg/E-start.md` · 🎯 TERAZ · tylko lane E · **NIE** `main.ts`

> **Jeden folder roboczy** dla czatu Grupa E. Kod gry (`gra/src/`) — osobno.  
> Charter operacyjny: `docs/czaty/GRUPA-E-META-AI.md` · protokół ABC: `docs/decyzje/DYSPOZYCJA-STALA.md`

**Ostatnia aktualizacja:** 2026-06-27 (audyt autonomiczny)

---

## Status skrót

| Temat | Postęp | Blokada |
|-------|--------|---------|
| **E1** Nowa gra | ~80% kod | ABC **Q9–Q12** · bramka TEST |
| **E1** Menu główne Q6–Q8 | ~20% | ABC nie wysłane |
| **E2** AI / zwycięstwo | ~5% | Brak pytań ABC |
| **E3** Surowce epok D14 | ~40% | Złoża żelaza na mapie |

---

## Mapa plików (czytaj w tej kolejności)

| Plik | Rola |
|------|------|
| [`AUDYT-2026-06-27.md`](AUDYT-2026-06-27.md) | Pełny audyt: zrobione / TODO / konflikty |
| [`USUNAC-KANDYDACI.md`](USUNAC-KANDYDACI.md) | Propozycje plików do usunięcia/archiwum |
| [`PANEL-E-SPEC.md`](PANEL-E-SPEC.md) | **Panel Excel** `panele-sterowania/Panel-E.xlsx` — ✅ 2026-06-29 |
| [`PANEL-E1-SPEC.md`](PANEL-E1-SPEC.md) | Legacy — tylko arkusz Nowa-gra (→ patrz PANEL-E-SPEC) |
| **decyzje/** | |
| [`decyzje/E1-nowa-gra.md`](decyzje/E1-nowa-gra.md) | **Source of truth** defaultów (Maciej 2026-06-26) |
| [`decyzje/E1-pytania-abc.md`](decyzje/E1-pytania-abc.md) | Indeks wszystkich pytań E1 (Q6–Q12) |
| [`decyzje/E1-PYTANIA-DO-SILNIKA.md`](decyzje/E1-PYTANIA-DO-SILNIKA.md) | Q9–Q12 + instrukcja dla Silnika |
| [`decyzje/E2-ai-zwyciestwo.md`](decyzje/E2-ai-zwyciestwo.md) | Stub — pytania do sformułowania |
| [`decyzje/E3-surowce-epoki.md`](decyzje/E3-surowce-epoki.md) | D14=A + luki MAPA |
| **handoff/** | |
| [`handoff/README.md`](handoff/README.md) | Aktywne vs archiwalne handoffy |
| **implementacja/** | |
| [`implementacja/kontrakt-kreator.md`](implementacja/kontrakt-kreator.md) | UI ↔ MAPA ↔ SILNIK |

---

## Raportowanie

| Kierunek | Plik |
|----------|------|
| → Master Silnik | `docs/czaty/DO-MASTERA.md` § Grupa E |
| ← Master | `docs/czaty/OD-MASTERA.md` § Grupa E |
| Lane UI | `dyspozycje/UI-DO-MASTERA.md` |
| Lane MAPA | `dyspozycje/MAPA-DO-MASTERA.md` |
| Lane SILNIK | `dyspozycje/SILNIK-DO-MASTERA.md` |
| Dziennik | `dyspozycje/DZIENNIK-MASTERA.md` |

**Komenda Macieja:** `master` → czytaj `OD-MASTERA.md` § E.

---

## Mockupy (UI/start — nie przenoszone tutaj)

| Plik | Ekran |
|------|-------|
| `UI/Gra-podglad-MENU.html` | S0 Menu |
| `UI/Makieta-flow-nowa-gra.html` | S1 Kreator (**wymaga sync z E1**) |
| `UI/Makieta-START.html` | Launcher |
