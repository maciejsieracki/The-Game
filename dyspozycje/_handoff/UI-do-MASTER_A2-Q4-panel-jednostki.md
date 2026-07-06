# HANDOFF: UI → MASTER — A2-Q4 panel jednostki [H]

**Data:** 2026-06-27  
**Decyzja Macieja:** **A2-Q4 = A**  
**Status:** **GOTOWE** (spec + mockup)

---

## Decyzja

Pełna karta jednostki na **dole mapy strategicznej** po kliknięciu **własnej** jednostki na heksie.

| Element | Spec |
|---------|------|
| Pozycja | Dolny środek, `bottom ~65px`, szer. ~400–520 px |
| Zawartość | Nazwa, typ, HP, Atak/Obrona/Ruch/Zasięg, pasek HP |
| Akcje | Ruch, Fortyfikuj, Atak, Rozkaz, Posiłki, Usuń (disable gdy brak API) |
| Zamknięcie | ✕ lub klik mapy poza jednostką |

**≠** bitwa 3D (C2), **≠** panel Wojsko (DK od dołu), **≠** pre-bitwa (wróg).

---

## Mockup

- `UI/Makieta-panel-jednostki.html`
- Routing: `UI/Makieta-HUD-D1B-preview.html` → `#unit-dk` / hotspot Hoplita

---

## Wpięcie (F-HUD / hud.ts)

- `HudState`: opcjonalnie `selectedUnit` + hook `onUnitPanelAction`
- Klik jednostka gracza na mapie → pokaż panel [H]
- Źródło statystyk: UNITS kontrakt (typ jednostki z `data/units`)

**Flaga:** GOTOWE · CZEKA batch MASTER `hud.ts`
