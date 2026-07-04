# UI → Design: W3 miasto v3 · HUD (delta kanon)

**Flaga:** **START Design** · hasło `START — W3-miasto-v3-delta`  
**Data:** 2026-07-03  
**Priorytet:** P0 · **tylko HUD miasta** (osobno od C-06 bitwa)

---

## Co przesyłam

| Materiał | Ścieżka |
|----------|---------|
| Brief | `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md` |
| Delta UX | `dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md` |
| Audyt sync | `dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md` |
| Playtest | `gra-kanon/START.html` · md5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`** |
| Screenshoty (opc.) | `docs/ux/referencje-miasto-kanon-2026-07-03/` |
| Referencja polish paneli | `The Game - Miasto Zakładki W4 v2 (1E).dc.html` |

---

## Co Designer ma zrobić

1. **Playtest kanonu** (Ctrl+F5) — miasto end-to-end (patrz brief § „Jak zobaczyć”)
2. **Nowy plik:** `The Game - Ekran Miasto W3 v3 (1E).dc.html` — min. 4 klatki (panel budowa · spichlerz · mapa chrome · Esc)
3. **Layout 2+7 rail** · mapa 3D widoczna · B-27 Mapa/Wróć/Esc · B-28 okolica toolbar
4. **NIE edytuj** starych mockupów W3-1E / 9 rail
5. Handoff zwrotny: `DESIGN-do-UI_miasto-w3-v3.md`

---

## Co Designer NIE robi

- TypeScript / `cityPanel.ts`
- Bitwa C-06 (osobny START)
- Zmiana logiki gry (tylko mockup wizualny)

---

## DoD (MASTER sprawdza)

- [ ] v3 odzwierciedla **kanon**, nie stary brief
- [ ] Wszystkie punkty brief § „MUSI być w v3”
- [ ] W4 polish w panelach (chipy bez `/t`, ikony surowców)
- [ ] Meldunek DESIGN-do-UI

**Po OK Macieja:** Lane UI ewentualny CSS polish · **bez** zmiany logiki · **bez** kanonu do czasu osobnej promocji

---

## Status

**GOTOWE do START** — Maciej wkleja `WKLEJKA-DESIGN-START-W3-miasto-v3.md`
