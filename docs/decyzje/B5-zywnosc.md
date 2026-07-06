# B5 — Żywność imperium (hybryda)

| Pole | Wartość |
|------|---------|
| **ID** | B5 |
| **Czat** | Civ — T-B5 Żywność |
| **Ekran** | **Panel miasta** + **HUD mapy świata** |
| **Status** | **ZAMKNIĘTE** (Q1 2026-06-26 + **B5-Q1=A**, **B5-Q2=A** 2026-06-27); tick lane w kolejce |
| **Było w „10”** | brak (osobny wątek — wcześniej poza listą A1–10) |

---

## Co decydujesz — rozstrzygnięte (Maciej Q1)

| Warstwa | Ustalenie |
|---------|-----------|
| **Miasto** | Bufor wzrostu + Spichlerz — **kanon:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` (2026-06-29) |
| **Zapasy państwa** | Globalna pula na wojsko; **bez cap góry** v1.0; **kumulacja tylko ze Spichlerzem** |
| **Suwak** | **Global per owner:** % rozwój miast vs % zapasy państwa (default spec: 70/30) |
| **Wojsko** | Zużycie zapasów państwa ∝ liczba jednostek; **rekrutacja nigdy blokowana** brakiem Spichlerza |
| **Głód** | Zapasy < 0 → **−8% max HP/turę** (UNITS) |
| **UI panel miasta** | Sekcja **„Spichlerz — wzrost”** (nie „magazyn”); **„Imperium / wojsko”** — suwak splitu |
| **Default split** | **70% miasta / 30% państwo** (**B5-Q2=A**) |
| **UI HUD mapy** | Stan zapasów państwa + alert głodu (**nie** magazyn lokalny miasta) |

---

## Dokumentacja i handoffy

| Plik | Rola |
|------|------|
| `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` | Q1 pełny zapis |
| `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_zywnosc-hybrid.md` | Kontrakt lane |
| `dyspozycje/_handoff/EKONOMIA-do-UNITS_glod-8hp.md` | Atrycja wojska |
| `dyspozycje/_handoff/EKONOMIA-do-UI_zywnosc-hud.md` | Pola HUD + suwak |
| `gra/src/game/empire-food.ts` | Tick zapasów; **kumulacja ON tylko ze Spichlerzem** — kanon B5-SPICH |
| `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` | **Kanon** Spichlerz + wzrost + wojsko (2026-06-29) |
| `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_spichlerz-wzrost-ludnosci.md` | Handoff implementacji (CZEKA) |

---

## Następny krok (Work, nie Decyzja)

EKONOMIA: `advanceEmpireFood` + test → UNITS atrycja → UI → MASTER save/load.

## Powiązania

- **B2** — zadowolenie per miasto (osobne od żywności wojska)
- **Q2=B** — przyrost żywności państwa na górnym pasku mapy (delta, nie panel lewy)
