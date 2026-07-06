# A2 — Jednostka wybrana na mapie świata

| Pole | Wartość |
|------|---------|
| **ID** | A2 |
| **Ekran** | **Mapa świata** (strategiczna — **nie** mapa bitwy; bitwa = **C2**) |
| **Lane** | UI, MAPA |
| **Legacy** | HUD **Q4** tylko (Q5–Q10 → **A1**) |
| **Status** | **ZAMKNIĘTE** (A2-Q4) |

---

## Decyzje

| Pytanie | Decyzja | Data |
|---------|---------|------|
| **A2-Q4** jednostka na mapie | **A** — pełna karta na dole ekranu (~400–520 px) | **2026-06-27** |

**Zawartość v1.0 (wg mockupu):** nazwa, typ, HP, Atak/Obrona/Ruch/Zasięg, pasek HP, przyciski Ruch · Fortyfikuj · Atak · Rozkaz · Posiłki · Usuń (disabled gdy brak mechaniki).

Pełne opcje ABC: `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` §4.

---

## Wykonanie

| Element | Stan |
|---------|------|
| Mockup `[H]` | `UI/Makieta-panel-jednostki.html` + routing w `Makieta-HUD-D1B-preview.html` |
| Kod `hud.ts` / lane UI | **CZEKA** batch F-HUD (MASTER) |

Mockup referencyjny: klik Hoplita → panel DK z iframe pełnej karty.

---

## → SILNIK

**GOTOWE DO WPIĘCIA:** **TAK** (spec + mockup) · handoff: `dyspozycje/_handoff/UI-do-MASTER_A2-Q4-panel-jednostki.md`

Po batch F-HUD: strefa **[H]** `bottom ~65px`, szer. ~400–520 px, `onUnitClick` → panel jednostki strategicznej.
