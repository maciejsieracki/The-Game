# Design Brief — C-01 Pre-bitwa · sync kanon (sign-off)

**Od:** Maciej / MASTER  
**Do:** Design (Claude Design · styl 1E)  
**Data:** 2026-07-03  
**Hasło:** `START — C01-v3-sync-kanon`  
**Priorytet:** P1 — **lżejsze niż W3 miasto** · **osobno od C-06**

---

## Cel

**Uwaga:** To **NIE** ekran ze screenshota Macieja „Atak na miasto” (Oblężaj/Szturm) — to **C-04** (`cityAttackChoice.ts`).  
**C-01** pojawia się **dopiero po wyborze Szturm** (lub atak polowy bez muru).

**Pre-bitwa C-01 jest już w kanonie** — lane portował v3 do `preBattle.ts`.  
Kod **nie zmienia się** od promocji kanonu (`31868e6c…` — identyczny w `gra/` = `gra-kanon/` = `gra-robocza/`).

Designer **nie projektuje od zera** — robi **sync dokumentacyjny**:
1. Playtest kanonu → porównanie z mockupem **`C01 Pre-bitwa v3 (1E).dc.html`**
2. Ewentualna korekta mockupu (v3.1) jeśli są luki wizualne
3. **Sign-off:** mockup = referencja kanonu na przyszłość

**Bitwa (C-06 deployment, pole HUD)** → **HOLD** (Maciej: za dużo zmian w `battleScene.ts`).

---

## Playtest (OBOWIĄZKOWY)

| Sposób | Ścieżka |
|--------|---------|
| **Kanon** | `gra-kanon/START.html` → Ctrl+F5 → nowa gra → **T** (test bitwy) **lub** atak wroga |
| **Walka only** | `Gra-podglad-PLAYTEST-WALKA.html` |

Powinien pojawić się ekran **przed bitwą** (układ TW): medaliony · roster boczny · panel centralny · 3 przyciski.

---

## Co MUSI być na mockupie (= kanon)

| Element | Kanon |
|---------|-------|
| Medaliony dowódców | lewo **niebieski** `#3a6ad0` · prawo **czerwony** `#c84040` |
| Roster boczny | karty jednostek · SVG (nie emoji) |
| Panel centralny | tytuł bitwy · **szansa %** · pasek niebieski/czerwony · modyfikatory ▲/▼ |
| VS | środek góry |
| Przyciski | **Wycofaj** · **Rozegraj ręcznie** · **Atakuj — auto** (czerwony primary) |
| Kolory | `battleHudTheme.ts` · Ty `#3a6ad0` · wróg `#c84040` |

**Referencja istniejąca:** `The Game - C01 Pre-bitwa v3 (1E).dc.html` — **edytuj ten plik** lub v3.1 jeśli trzeba.

**Archiwum (NIE edytuj):** v2 · `Makieta-preBattle.html`

---

## Deliverable

| # | Plik | Opis |
|---|------|------|
| 1 | `C01 Pre-bitwa v3 (1E).dc.html` | zaktualizowany **lub** potwierdzenie „sync OK” |
| 2 | `DESIGN-do-UI_C01-v3-sync.md` | krótki meldunek: co poprawiono / „bez zmian” |

**Nie twórz C-06 v4** w tym zadaniu.

---

## DoD

- [ ] Playtest kanonu wykonany
- [ ] Mockup v3 = kanon (lub lista max 5 luk wizualnych)
- [ ] Zero emoji · SVG line · styl 1E
- [ ] Meldunek DESIGN-do-UI

**Po sign-off:** mockup = **zamrożona referencja** C-01 · lane **nie portuje** (kod już OK).

---

## Powiązane (HOLD)

| ID | Status |
|----|--------|
| **C-06 v4** deployment | **HOLD** — bitwa w toku |
| **C-07+** pole bitwy | **HOLD** |
| **W3 miasto v3** | osobny START (`W3-miasto-v3-delta`) |
