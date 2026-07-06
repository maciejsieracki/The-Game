# Gr-D2 — Kultura i religia

**Ekran:** overlay po kliknięciu ikon przy minimapie · panel miasta (szczegóły per miasto → B4.2)  
**Status:** CZĘŚCIOWO — routing 2026-06-26 (korekta Maciej)  
**Mapowanie:** A1-Q12 (treść kliku ikon), MAPA-F2-Q1 (toggle zasięgu), B4.2 (panel miasta)

---

## Podział MAPA vs Grupa A vs Grupa B (Maciej, 2026-06-26)

| Warstwa | Kto | Co |
|---------|-----|-----|
| **Toggle zasięgu obok minimapy [F]** | **MAPA** (MAPA-F2-Q1) | **Włącz/wyłącz** podgląd zasięgu **kultury** i **naszej religii** na mapie 3D |
| **Klik ikony → treść „w środku"** | **Grupa A** (**A1-Q12**) | Overlay/panel — dane imperium, akcje (**nie** wygląd toggle) |
| **Górny pasek HUD [A]** | **Grupa A** | Zasoby imperium (Kultura — **A1-Q11 OTWARTE**) |
| **Panel miasta** | **Grupa B (B4.2)** | Szczegóły per miasto |

> **Unieważnione:** treść kliku → Grupa D (D2-Q1/Q2). **Unieważnione:** Grupa D/Nauka — wygląd toggle przy minimapie (Maciej odpisał lane).

---

## Decyzje Macieja

| # | Pytanie | Decyzja | Data |
|---|---------|---------|------|
| MAPA-F2-Q1 | Toggle zasięgu obok minimapy | **→ MAPA** | 2026-06-26 |
| **A1-Q12a/b** | Treść po kliku ikon | **A1-Q12a=A, A1-Q12b=A** — pełne parametry kultury/religii i zasięgów | 2026-06-26 |

---

## Po decyzji (Work — lane UI + MAPA + EKONOMIA)

- **MAPA:** toggle zasięgu + render overlay (`MAPA-do-UI_kultura-religia-zasieg-minimapa.md`).
- **UI / Grupa A:** overlay treści wg **A1-Q12** (`culture-religion.ts` → stan imperium).
- Panel miasta: szczegóły per miasto → **Grupa B** (B4.2).

---

## → SILNIK

**Status:** CZĘŚCIOWO — A1-Q12 zamknięte · toggle MAPA osobno  
**GOTOWE DO WPIĘCIA:** **NIE** — UI overlay (Grupa A) + kontrakt z `culture-religion.ts`
