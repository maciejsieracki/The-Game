# A1 — Power (Potęga) na środku paska [A]

| Pole | Wartość |
|------|---------|
| **ID** | A1-Power |
| **Data** | 2026-06-26 |
| **Status** | **ZAMKNIĘTE** (miejsce + v1.0 zakres) · **A1-Q15=A** 2026-06-27 |
| **Mockup** | `UI/Makieta-HUD-D1B-preview.html` → strefa **[A′]** |

---

## Podział lane (Maciej 2026-06-27, A1-Q15=A)

| Lane | Odpowiedzialność |
|------|------------------|
| **Grupa A / UI** | Wyświetlenie: liczba Power, klik → overlay składników (mockup [A′]) |
| **Grupa B / Miasto+Ekonomia** | **Wytyczne wyliczania** składników ludnosc, miasta, gospodarka + kontrakt API → `dyspozycje/_handoff/A1-do-GRUPA-B_power-wyliczanie.md` |
| **UNITS** | wielkoscArmii, wygraneBitwy |
| **SILNIK** | epoka, agregacja → `computePotegaNacji()` |
| **Grupa D / Dyplomacja** | Konsument Power → Respekt, progi AI → `A1-do-GRUPA-D_power-konsument.md` |

---

## Decyzja Macieja

Na **środku górnego paska** HUD mapy strategicznej widoczny jest **Power** — siła naszej cywilizacji, wykorzystywana w negocjacjach dyplomatycznych.

```
[Zasoby …]     [⚜ POWER 62]     [Epoka …][Sojusz][Pakt][Wojna][Menu]
                    ↑ środek [A]
```

- **Klik** → overlay ze składnikami potęgi + przykładowy Respekt względem sąsiadów
- **Bez duplikatu** na liście zasobów — osobny znacznik centralny

---

## Co to jest w grze (nie mylić z innymi pojęciami)

| Pojęcie | Skala | Gdzie w HUD | Znaczenie |
|---------|-------|-------------|-----------|
| **Power / Potęga** | 0–100 **absolutna** | **Środek [A′]** | Twoja siła imperium — suma ważona 6 składników |
| **Respekt** | 0–100 **względem partnera** | Panel **dyplomacji** (per nacja) | Jak partner cię traktuje siłowo: 50 = parytet, &gt;50 = ty silniejszy |
| **Zaufanie** | 0–100 per nacja | Panel dyplomacji | Soft power — traktaty, gesty, historia relacji |
| ~~**Wpływ**~~ | — | **OUT** z HUD mapy D1B | Stary wiersz w `hud.ts` — inna mechanika (szczęście/miasto); nie = Power |
| **Kultura** | imperium | Ikona [C] + opcj. zasób (A1-Q11 OTWARTE) | Presja kulturowa — **osobny** system od Power |

**Implementacja:** `gra/src/game/diplomacy.ts` — `computePotegaNacji()` + `computeRespekt()`.  
**Spec:** `Civ-CYWILIZACJE/SPEC-Respekt.md` · wagi: `gra/data/diplomacy.json` → `respekt_-_czynniki`.

---

## 6 składników Power (wagi startowe, suma 100%)

| Składnik | Klucz | Waga | Źródło danych (lane) |
|----------|-------|------|----------------------|
| Wielkość armii | `wielkoscArmii` | **28%** | UNITS |
| Wygrane bitwy | `wygraneBitwy` | **20%** | UNITS |
| Ludność | `ludnosc` | **18%** | MIASTO / EKONOMIA |
| Miasta / terytorium | `miasta` | **14%** | MIASTO |
| Gospodarka | `gospodarka` | **12%** | EKONOMIA |
| Epoka | `epoka` | **8%** | SILNIK / tech |

Każdy składnik jest **znormalizowany do 0–1** (SILNIK), potem:

```
Power = round( Σ składnik × waga ), clamp 0..100
```

Militaria (armia + bitwy) = **48%** — Respekt = „strach” / hard power.

---

## Respekt w negocjacjach (warstwa 2)

Power **samej** nacji to input. W rozmowie z Persją liczy się **Respekt**:

```
Respekt(my, Persja) = round( 100 × Power_my / (Power_my + Power_Persja) )
```

Przykład: Power 62 vs Persja 45 → Respekt ≈ **58** (lekkia przewaga).  
AI używa progów (np. &lt;40 → unika wojny, &gt;70 → żąda trybutu) — patrz SPEC-Respekt §E.

**Respekt NIE idzie na środek HUD** — tylko w panelu dyplomacji przy każdej nacji.

---

## Co pokazujemy na HUD (v1.0)

| Element | Tak / Nie |
|---------|-----------|
| Liczba **Power** (0–100) | **TAK** — środek [A′] |
| Etykieta „Power" + ikona | **TAK** |
| Klik → rozbicie 6 składników | **TAK** (overlay mockup) |
| Ranking vs inne cywilizacje | **TAK** w overlay (demo #2/6) — opcjonalnie w grze |
| Respekt per nacja | **NIE** na [A] — tylko dyplomacja |
| Zaufanie | **NIE** na [A] |
| Trend +/tura | **NIE** v1.0 (można później strzałka ▲▼) |

---

## Czego NIE dodajemy obok Power (bez decyzji Macieja)

- **Sojusznicy liczeni w Power** — nie ma w spec (wagi = 0 domyślnie)
- **Reputacja / dotrzymywanie słowa** — propozycja w SPEC §G p.4, nieaktywna
- **Kultura / religia w Power** — osobne systemy

---

## Mapa kliknięć

| Element | Klik | Efekt |
|---------|------|-------|
| **Power [A′]** | **TAK** | Overlay składników + ranking + przykład Respektu |
| Liczba Power | — | Informacja; bez osobnego kliku |

---

## Powiązane

- `docs/A1-HUD-MAP-KLIKNIEC.md`
- `docs/A1-HUD-PLAN-MOCKUPY-KLIKNIECIA.md` — overlay Power w paczce P1
- `docs/decyzje/A1-revB-uklad-mockup.md`
