# UI → Design: W3 miasto v3.2 · delta playtest

**Flaga:** **START Design** · hasło `START — W3-miasto-v3.2-delta`  
**Data:** 2026-07-04  
**Priorytet:** P0 · HUD miasta (osobno od C-09 roster)

---

## Co przesyłam

| Materiał | Ścieżka |
|----------|---------|
| **Brief (NOWY)** | `docs/ux/DESIGN-BRIEF-W3-miasto-v3.2-playtest-delta.md` |
| Brief bazowy | `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md` |
| Review v3.1 | `dyspozycje/_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md` |
| Playtest | `gra-robocza/START.html` → Ctrl+F5 → miasto |
| Screenshoty (opc.) | `docs/ux/referencje-miasto-playtest-2026-07-04/` |
| Poprzedni deliverable | `The Game - Ekran Miasto W3 v3 (1E).dc.html` |

---

## Co Designer ma zrobić

1. **Playtest roboczej** — miasto end-to-end (panel · mapa 3D · Esc · badge na mapie świata)
2. **Zaktualizować / nowy plik:** `The Game - Ekran Miasto W3 v3.2 (1E).dc.html`
3. **Priorytet klatek:** K3′ mapa chrome · K1′ HUD miasta · K2′ stopka · K6 badge mapy
4. Dokończyć **6 paneli prawych** jeśli jeszcze brak (z review v3.1)
5. Handoff: `DESIGN-do-UI_miasto-w3.2-delta.md`

---

## Delta vs kod (skrót dla Designera)

| # | Zmiana | Mockup |
|---|--------|--------|
| 1 | W mieście: **brak** chipów imperium / Epoki · **Wiki+Menu** zostają | K1′ |
| 2 | Mapa 3D: **brak** tabliczki nazwy na środku | K3′ |
| 3 | „Wróć na mapę” **u góry**, nie blokuje heksów | K3′ |
| 4 | Okolica: **brak** plonów na heksach · **brak** dolnych hintów | K3′ |
| 5 | Mapa świata: badge **NAZWA + populacja** | K6 |
| 6 | Stopka surowców **osobna** od Spichlerza | K2′ |

---

## Co Designer NIE robi

- TypeScript / `cityPanel.ts` / `hud.ts`
- Bitwa / roster (osobny START C-09)
- Promocja kanonu

---

## DoD (MASTER / Maciej)

- [ ] Playtest vs mockup v3.2 — brak elementów sprzed delty
- [ ] P0 klatki (K1′, K2′, K3′) OK
- [ ] Handoff Design z listą klatek

**Po OK Macieja:** Lane CSS polish opcjonalnie · kanon **osobna** decyzja MASTER.

---

## Status

**START** · playtest Macieja = OK funkcjonalnie · Design **odblokowany** dla sync mockupu.
