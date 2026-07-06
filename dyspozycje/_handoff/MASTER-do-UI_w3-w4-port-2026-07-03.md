# MASTER → UI lane: W3 miasto · port Design W4 v2

**Trigger:** Maciej `START lane W3` · 2026-07-03  
**Design kanon:** `docs/ux/claude-design/The Game - Miasto Zakładki W4 v2 (1E).dc.html`  
**Baseline kod:** `gra/src/ui/cityPanel.ts` · `gra/src/ui/cityUxFrame.ts`  
**NIE:** `main.ts`

---

## Cel

Polish 1E panelu miasta (7 zakładek prawego raila + stopka surowce) zgodnie z W4 v2. Usunąć **`/t`** i **`/turę`** z **widocznego UI gracza** — same liczby jak Design (`+12`, `+2`, `70% +5`).

---

## Zakres

| Obszar | Akcja |
|--------|--------|
| 7 zakładek (spichlerz…religia) | CSS/tokens z W4: chipy netto/bufor, karty, siatki szczegółów |
| Stopka **SUROWCE W ZASIĘGU** | Inline SVG z W4 → wyciągnij do `gra/src/ui/icons/brand/` jako `res-cattle.svg`, `res-clay.svg` (Koń/Sól = istniejące horses/salt lub z W4) |
| Górny pasek B-02 | Polish chipów imperium (`renderCivResourceTopBar`) — screenshot `docs/ux/referencje-w3-screenshots/08` + tokens 1E |
| `/t` w UI | Usuń z labeli, chipów, statów widocznych graczowi w panelu miasta |
| Komentarze dev / tooltipy techniczne | Można zostawić `/turę` tylko w komentarzach kodu — nie w DOM |

---

## DoD

- [ ] Wizualnie zbliżone do W4 v2 (7 klatek) na playtest Macieja
- [ ] Brak `/t` w panelu miasta (grep `cityPanel.ts` + `cityUxFrame.ts` — zero w stringach UI)
- [ ] SVG surowców w stopce (nie sama lista tekstowa)
- [ ] `npx tsc --noEmit` OK
- [ ] `node tools/smoke.cjs` OK
- [ ] Meldunek append `UI-DO-MASTERA.md` → `→ MASTER: CZEKA` (bez kanonu — MASTER po Opus)

---

## Pliki własności

`cityPanel.ts` · `cityUxFrame.ts` · `gra/src/ui/icons/brand/res-*.svg` (nowe) · ewent. `scienceOwlIcon.ts` (bez zmian funkcji)

**Backup:** `cityPanel.ts.bak-UI-W4v2-2026-07-03`
