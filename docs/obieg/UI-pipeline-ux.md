# Lane UI — pipeline UX (mockupy → Claude Design → kod)

> **Trigger Macieja:** `działaj` → ten plik · sekcja **🎯 TERAZ** · tylko UX · nie `main.ts`.
> **Checklist A→Z:** [`docs/ux/SCHEMAT-AZ-UX-PIPELINE.md`](../ux/SCHEMAT-AZ-UX-PIPELINE.md)
> **Obieg:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · Slack po **`przekaż do Mastera`**.

## 🎯 TERAZ

| Priorytet | Kto | Co | Folder |
|-----------|-----|-----|--------|
| **P0** | **MASTER** | Rebuild kanon po W1 brand book | handoff `UI-do-MASTER_brand-book-w1.md` |
| **P1** | Lane UI | Sync SVG gdy `brand-book/eksport/` pełny na dysku | poll + `iconRegistry.ts` |
| **P1** | **Grupa E** | 6× clean-screen `*_przed.png` | `docs/ux/pipeline/01-wejscie/grupa-E/` |
| **P2** | Grupy A–D | **8A:** E→A→B→D→C | `01-wejscie/grupa-{A..D}/` |

**Poll:** `node gra/tools/poll-claude-design.mjs` → `docs/obieg/_poll-claude-design-last.md`

**Status zbiorczy:** [`docs/ux/pipeline/STATUS-PIPELINE.md`](../ux/pipeline/STATUS-PIPELINE.md)

## 📁 Katalogi (kanon)

| Etap | Folder |
|------|--------|
| Upload do Design | `docs/ux/claude-design/00-brand-book-pakiet/` |
| **Brand Book (Design zapis · Lane UI czyta)** | **`docs/ux/claude-design/01-propozycje-z-design/brand-book/`** |
| Dyspozycje ↔ Design | `…/brand-book/DYSPOZYCJA.md` |
| Tokeny + handoff Design | `…/brand-book/eksport/` |
| Wejście grup | `docs/ux/pipeline/01-wejscie/grupa-{A..E}/` |
| PO zatwierdzone (kod) | `docs/ux/pipeline/02-po-design/grupa-{A..E}/` |
| Tokeny CSS (kod/mockupy) | `UI/design-tokens-brand-v1.css` |

## ✅ GOTOWE (lane UI)

- [x] 2026-07-01 — struktura `docs/ux/pipeline/` + STATUS + RAPORT-WEJSCIE per grupa
- [x] 2026-07-01 — `00-kanon/` BRAND-PROMPT + WKLEJKA-DO-DESIGN
- [x] 2026-07-01 — `claude-design/00-brand-book-pakiet/` + `01-propozycje-z-design/`
- [x] 2026-07-01 — `UI/design-tokens-brand-v1.css` · poll `gra/tools/poll-claude-design.mjs`
- [x] 2026-06-26 — **W1 brand book w kodzie UI** → `UI-do-MASTER_brand-book-w1.md`
- [ ] Sync `eksport/icons/*.svg` (OneDrive)
- [ ] Pierwszy plik wejścia Grupy E (`01-wejscie/`)

## 🔴 BLOKER

**Sync OneDrive:** agent lane widział tylko README w `brand-book/` mimo 34 plików u Macieja — SVG defer W2  
**0/34** w `01-wejscie/` → Grupa E mockupy PRZED

## Meldunki

| Plik | Kiedy |
|------|-------|
| `docs/ux/pipeline/01-wejscie/grupa-X/RAPORT-WEJSCIE.md` | grupa X |
| `docs/ux/pipeline/STATUS-PIPELINE.md` | lane UI po każdej zmianie |
| `dyspozycje/UI-DO-MASTERA.md` | ważne dla Mastera |
| Handoff | `dyspozycje/_handoff/UI-do-MASTER_<temat>.md` po **`przekaż do Mastera`** |
