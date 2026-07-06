# B2-Q12 — Bunt skrajny: rebelia AI + ostrzeżenie

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **C** (2026-06-27) + doprecyzowanie |
| **Status** | **ZAMKNIĘTE** |
| **Powiązane** | B2-Q6=C (kary+migracja w niższych tierach), B2-Q5=C (chip+🔥), `B2-porzadek-progi-efektow.md` |

---

## Ustalenie Macieja

1. **B2-Q12 = C** — przy długotrwałym kryzysie Porządku miasto może przejść pod **AI rebeliantów** (szary kolor, oddzielna frakcja). Można **odbijać** wojskiem.
2. **2 tury na reakcję** — po wejściu w strefę krytyczną **nic się nie dzieje** przez **2 tury** (brak eskalacji do rebelii, brak dodatkowych kar ponad tier).
3. **Ostry komunikat na mapie strategicznej** — w panelu powiadomień / wydarzeń (Grupa A, prawy panel chipów): widoczny, priorytetowy alert.
4. **Dźwignie krótkoterminowe** (gracz ma wiedzieć z komunikatu):
   - **Obniż podatki** → więcej % na **Wealth (Luksus)** → bonus Szczęścia (patrz `B2-narzedzia-stabilizacji.md`)
   - **Wprowadź wojsko** → silny wzrost **Prawa** (nawet do 100%), nie Szczęścia
5. **Długoterminowo** — budynki ↑ Szczęście + ↑ Wealth (lista w `B2-narzedzia-stabilizacji.md`).

**Uwaga:** B2-Q12=C **rozszerza** B2-Q6=C tylko w **skrajnym** progu po grace — normalny bunt = kary + migracja bez utraty właściciela.

---

## Progi (PorPct — kanon)

| PorPct | Stan | Efekt |
|--------|------|--------|
| **10–29%** | Bunt | Kary B2-Q6 + migracja 5%/turę + chip 🔥 |
| **0–9%** | **Strefa krytyczna** | Start **licznika grace = 2 tury** + **alert strategiczny** |
| **0–9%** przez **2 tury z rzędu** (po grace) | **Rebelia AI** | Miasto → frakcja rebeliantów |

Wejście w strefę krytyczną = **PorPct &lt; 10%** (tier „Bunt skrajny”).

---

## Sekwencja tur (silnik)

```
T0: PorPct spada poniżej 10%
    → revoltGraceRemaining := 2
    → event REVOLT_WARNING (blocking chip, mapa strategiczna)
    → tekst: patrz niżej
    → kary tieru 0–9% działają, ALE revolt AI = OFF

T1: nadal PorPct < 10%, grace := 1
    → przypomnienie alertu (chip aktualizowany: „1 tura”)

T2: nadal PorPct < 10%, grace := 0
    → ostatnie ostrzeżenie

T3+: nadal PorPct < 10%, grace wyczerpany
    → triggerRevoltRebellion(cityId)
    → ownerId := REBEL_FACTION
    → miasto szare na mapie, AI obrona/produkcja rebeliantów
```

**Wyjście z kryzysu:** jeśli **PorPct ≥ 10%** w dowolnej turze → `revoltGraceRemaining := null`, alert znika, licznik reset.

---

## Komunikat (mapa strategiczna — Grupa A)

**Typ:** `revolt-warning` · **severity:** `critical` · **blocking:** tak (WYKONAJ może otworzyć panel miasta)

**Tekst (PL):**

> **KRYTYCZNE — grozi bunt w [Nazwa miasta]!**  
> Masz **2 tury**, żeby podnieść Porządek. **Obniż podatki** (więcej na Wealth) albo **stacjonuj wojsko** (Prawo). Inaczej miasto może przejść pod rebeliantów.

W turze 2: dopisek „**Ostatnia szansa — 1 tura**”.

Handoff UI: `dyspozycje/_handoff/UI-do-GRUPA-A_B2-Q12-alert-bunt.md`

---

## Rebelia AI (po grace)

| Element | Zachowanie |
|---------|------------|
| Właściciel | `REBEL_FACTION_ID` (szary) |
| Produkcja | AI rebeliant — obrona, ewent. jednostki |
| Odbicie | Atak gracza → normalna walka/podbój |
| Migracja B2-Q6 | **OFF** po rebelii (ludność „u rebeliantów”) |
| Dyplomacja | Rebelianci neutralni wobec wszystkich v1.0 (proste) |

Save/load: `city.revoltGraceRemaining`, `city.rebelState?`.

---

## Implementacja (lane)

| Lane | Zadanie |
|------|---------|
| EKONOMIA | licznik grace, `checkRevoltRebellion`, tier PorPct |
| CYWILIZACJE | AI rebeliant, `REBEL_FACTION_ID`, `ai.ts` obrona miasta |
| UI / Grupa A | chip critical + tekst |
| MAPA | heks szary, ikona rebelii |
| SILNIK | integracja tur, save/load, WYKONAJ → panel miasta |

Handoff: `dyspozycje/_handoff/EKONOMIA+CYWILIZACJE-do-SILNIK_B2-Q12-rebelia.md`

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-27 | Maciej **B2-Q12=C** + 2 tury grace + alert strategiczny + dźwignie podatki/wojsko |
