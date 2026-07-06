# B2 — Porządek: progi procentowe i efekty

| Pole | Wartość |
|------|---------|
| **Status** | **DRAFT założenia** — balans w Excel/playtest |
| **Wejście** | **PorPct** = waga×SzPct + waga×PrawPct — patrz `B2-porzadek-model.md` |
| **Poprzedni draft** | `B2-szczescie-progi-efektow.md` (tylko SzPct) — **superseded** dla efektów |

---

## Zasada

**Jedna liczba decyduje o karach:** **PorPct** (nie SzPct osobno, nie PrawPct osobno).  
Panel nadal pokazuje **skąd** wziął się Porządek (rozpiski Szczęścia i Prawa).

Mapowanie na `order.ts`: tier + `OrderEffects` (productionMult, pieniadzMult, …, revoltRisk).

---

## Tabela progów PorPct (założenia startowe)

| PorPct | Tier | Nazwa w UI | Efekty gameplay |
|--------|------|------------|-----------------|
| **≥ 90%** | `order` | **Ład** | Bonus **Praca** ×1,10, **Handel** ×1,10 (`porzadek_bonus_*_t2`). Brak kar. |
| **70–89%** | `neutral` | **Spokój** | Brak kar, brak bonusów. Normalna gra. |
| **50–69%** | `neutral` | **Napięcie** | **Praca** ×0,95. Komunikat „Nastroje spadają”. |
| **30–49%** | `unrest` | **Niepokój** | Kary B2-Q6: **Praca/Pieniądz/Nauka/Kultura** ~×0,85; **wzrost** ×0,75. Chip buntu możliwy (B2-Q5). |
| **10–29%** | `unrest` | **Bunt** | Kary jak wyżej + **migracja** 5%/turę (`porzadek_ryzyko_buntu_t1`). |
| **0–9%** | `unrest` | **Bunt skrajny** | Kary max (~×0,70 plony) + migracja 8%/turę. **B2-Q12=C:** grace **2 tury** + alert → potem **rebelia AI**. |

Wartości mnożników = istniejące klucze `porzadek_kara_*_t1` / `porzadek_bonus_*_t2` (normal) w JSON.

**Cap euforii:** jeśli PorPct &gt; 100% (obie składowe wysokie) — bonus ład do ×1,15 (do strojenia).

---

## Co spada przy spadku PorPct (schemat)

| Spada PorPct z… na… | Gracz czuje |
|---------------------|-------------|
| 70+ → 50–69 | Trochę wolniejsza produkcja (−5% Praca) |
| 50–69 → 30–49 | Wyraźne spowolnienie ekonomii (−15% plony), wolniejszy wzrost |
| 30–49 → 10–29 | Ryzyko migracji, event „Niepokoje”, ikona 🔥 (B2-Q5) |
| 10–29 → 0–9 | **Alert krytyczny** — 2 tury grace, potem rebelia AI (B2-Q12=C) |

Przy **wzroście** PorPct efekty **zdejmują się od razu** (bez opóźnienia), chyba że Maciej kiedyś wybierze „histeresis” — na razie **nie**. Grace **reset** gdy PorPct ≥ 10%.

---

## B2-Q12 — **ZAMKNIĘTE → C**

PorPct &lt; 10% → **2 tury** ostrzeżenia (alert mapa strategiczna) → brak reakcji → **miasto pod AI rebeliantów** (szary, odbicie wojskiem). Dźwignie: podatki/Wealth → Sz, wojsko → Prawo. Patrz `B2-Q12-bunt-rebelia.md`, `B2-narzedzia-stabilizacji.md`.

---

## Excel

Arkusz proponowany: **`Porzadek-progi`** — kolumny: `por_pct_min`, `por_pct_max`, `tier`, `label_pl`, mnożniki, `ryzyko_buntu`.

Synchronizacja: `gra/tools/export-panel.py` → `society-params.json` sekcja `porzadek_progi` (do utworzenia).

---

## Następne kroki

1. EKONOMIA: `tierFromPorPct(porPct)` + testy.
2. Playtest → strojenie Excel.
