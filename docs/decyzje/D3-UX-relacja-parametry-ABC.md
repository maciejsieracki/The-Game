# Gr-D3 — UX relacji per nacja (Power + dyplomacja) — decyzja ABC

**Data:** 2026-06-26 (sesja MASTER/CYW)  
**Status:** **ZAMKNIĘTE** — Maciej **2026-06-26**  
**Decyzja:** **D3-UX-1=B · D3-UX-2=B · D3-UX-3=B · D3-UX-4=B** (BBBB)

**Zależność:** **Power (Moc P-A) ✅ w silniku** — Respekt liczony z `computeRespekt(Moc, Moc)`.

**Powiązane:** `D3-audiencja-dyplomacja.md` (flow 2 ekrany) · `P-C3-moc-power-nazwa.md` · `D3-moc-respekt-tuning-scenariusze.md`

---

## TL;DR dla Macieja

| Gdzie | Co proponujemy |
|-------|----------------|
| **Lista dyplomacji** | Nadal **lekka** (D3) — bez liczb, ewentualnie kolor statusu |
| **Audiencja (rozmowa)** | **Tu pełny panel relacji** — Zaufanie, Respekt, Moc, traktaty, opcjonalnie charakter nacji |
| **Overlay Moc (HUD)** | Szczegóły składników Power — **globalnie**, nie w audiencji |

---

## Pytanie D3-UX-1 — Lista dyplomacji (lewy panel 🤝)

| | Opcja | Co widać |
|---|--------|----------|
| **A** | **Minimal (kanon D3)** | Nazwa + „Porozmawiaj" / „Nawiąż kontakt" — **zero liczb** |
| **B** | **Status bez liczb** *(rekomendacja)* | A + **badge** Wojna / Pokój / Sojusz (kolor) |
| **C** | **Skrót relacji** | B + jedna linia: „Relacja wysoka / niska" (słownie, bez %) |

> Dziś `diploListHud` pokazuje tier + Respekt — to **rozjazd z D3-A**. Po decyzji: wyrównać do wybranej litery.

---

## Pytanie D3-UX-2 — Audiencja (ekran rozmowy) — główny panel

| | Opcja | Zawartość |
|---|--------|-----------|
| **A** | **Jak dziś** | Status słowny + Zaufanie + Respekt (liczby) + karty akcji |
| **B** | **Rekomendowany** | A + **paski** Zauf./Respekt + **Moc: Ty X vs Oni Y** + **aktywne traktaty** + suma **Relacja** |
| **C** | **Pełny briefing** | B + **charakter nacji** (3 tagi) + **ranking Mocy** (#3/15) + **ich Respekt wobec nas** (asymetria) + **progi** na paskach (sojusz ≥60) |

---

## Pytanie D3-UX-3 — Charakter nacji (z macierzy `dip_*`)

| | Opcja | Co gracz widzi |
|---|--------|----------------|
| **A** | **Ukryte** | Tylko bonusy cywilizacji (★) — jak dziś |
| **B** | **Tagi po polsku** *(rekomendacja)* | 2–3 etykiety: np. „Handlowy", „Lojalny sojusznik", „Pamiętliwy" — **bez liczb 1–10** |
| **C** | **Liczby surowe** | Skłonność sojusze 7/10 itd. — **nie polecane** (Excel, nie gameplay) |

Mapowanie tagów (propozycja CYW — po eksporcie macierzy):

| Parametr (ukryty) | Tag jeśli wysoki (≥7) | Tag jeśli niski (≤3) |
|-------------------|------------------------|----------------------|
| `dip_otwartosc_handel` | Handlowy | Izolacjonista |
| `dip_sklonnosc_sojusze` | Sojuszniczy | Samotny wilk |
| `dip_lojalnosc` | Lojalny | Zdradziecki |
| `dip_prog_wojny` | Wojowniczy | Ostrożny |
| `dip_pamietliwosc` | Pamiętliwy | Wybaczający |

---

## Pytanie D3-UX-4 — Moc w audiencji

| | Opcja |
|---|--------|
| **A** | **Para liczb:** „Twoja Moc **4020** · Ich Moc **1980**" |
| **B** | **A + stosunek** *(rekomendacja)* | + linia: „Przewaga **2:1** → Respekt **67**" (tooltip wyjaśnia formułę) |
| **C** | **Bez Mocy w audiencji** | Moc tylko w overlay HUD — Respekt bez kontekstu |

**Etykieta PL:** **Moc** (P-C3). Nie „Power", nie „Wpływ".

---

## Układ audiencji — propozycja **D3-UX-2B** (mockup ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Lista          AUDIENCJA — Kapua (Rzymianie)                 │
├──────────────────────────┬──────────────────────────────────────┤
│  👑 Ty                   │  🛡 Kapua · Rzymianie                 │
│  Wódz · Grecy            │  Konsul · Epoka: Żelazo               │
│  ◆ +10% do produkcji…    │  ◆ +15% do murów…                     │
│                          │  [Handlowy] [Lojalny]  ← tagi B      │
├──────────────────────────┴──────────────────────────────────────┤
│  STATUS: Pokój  ·  Relacja 87                                    │
│  ┌ Zaufanie 42 ────────────●──────────────┐  (próg sojusz 60) │
│  └ Respekt  67 ─────────────────●─────────┘  (z Mocy 4020:1980)│
│  Moc: Ty ⚜ 4020  vs  Oni ⚜ 1980  ·  przewaga ~2:1               │
│  Traktaty: NAP (12 tur) · Handel aktywny                          │
├─────────────────────────────────────────────────────────────────┤
│  [NAP] [Handel] [Sojusz] [Pokój] [Wojna] … (karty akcji)        │
└─────────────────────────────────────────────────────────────────┘
```

### Strefy

| Strefa | Parametry | Źródło danych |
|--------|-----------|---------------|
| Portrety L/P | Nazwa, epoka, bonusy ★ | SILNIK + `civs.json` |
| Tagi charakteru | 2–3 słowa | `civ-matrix.json` `dip_*` → CYW helper |
| Status | Wojna/Pokój/Sojusz + **Relacja** (suma) | `diplomacy.ts` |
| Pasek Zaufanie | 0–100 + marker progu 60/70 | relacja + `diplomacy.json` params |
| Pasek Respekt | 0–100 + tooltip formuły | `computeRespekt(powerSelf, powerOther)` |
| Linia Mocy | obie wartości + stosunek | `power-objective.ts` |
| Traktaty | lista aktywnych + wygaśnięcie | `diplomacy-treaties.ts` (v1.1) |

---

## Co **NIE** pokazujemy graczowi (zostaje w Excelu / AI)

| Parametr | Dlaczego ukryty |
|----------|-----------------|
| `dip_*` surowe 1–10 | Balans AI — gracz dostaje **tagi**, nie arkusz |
| `dyplomacja_strach_prog_*` | Wewnętrzne progi AI |
| Delty co turę z `diplomacy.json` | Efekt widać na pasku, nie „+0,5/turę" |
| 9 składników Power | Tylko overlay **Moc** (globalny) |
| `mnoznikRespektu`, wagi % legacy | Martwy model / Panel-B zastąpił |

---

## Kolejność wdrożenia (lane)

```
1. EKONOMIA/SILNIK: Panel-B eksport → power-params.json → kanon (Respekt poprawny)
2. UI: rozszerzyć DiplomacyAudienceState + layout (ten dokument)
3. SILNIK: buildAudienceState() — nowe pola w callbacku getState()
4. CYW: civ-matrix dip_* → tagi (helper, lane CYW)
5. SILNIK-D-V11: traktaty aktywne w linii „Traktaty:"
```

**Handoff techniczny:** `dyspozycje/_handoff/CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`

---

## Decyzja Macieja (2026-06-26)

| ID | Decyzja | Skutek |
|----|---------|--------|
| **D3-UX-1** | **B** | Lista 🤝: nazwa + badge statusu (Wojna/Pokój/Sojusz), **bez** % |
| **D3-UX-2** | **B** | Audiencja: paski Zauf./Respekt + Relacja + Moc + traktaty |
| **D3-UX-3** | **B** | Tagi PL (Handlowy, Lojalny…) z `dip_*`, max 3, bez liczb |
| **D3-UX-4** | **B** | Moc obu stron + stosunek (np. 2:1) + tooltip Respekt |

**Odpowiedź:** `D3-UX-1=B, D3-UX-2=B, D3-UX-3=B, D3-UX-4=B`

**→ UI + SILNIK:** implementacja wg mockupu § układ 2B · **→ CYW:** `diplomacy-display.ts` (tagi)
