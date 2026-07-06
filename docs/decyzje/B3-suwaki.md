# B3 — Panel miasta: suwaki i podział

| Pole | Wartość |
|------|---------|
| **ID** | B3 |
| **Czat** | Civ — T-B3 Suwaki miasto |
| **Ekran** | **Panel miasta** |
| **Status** | **ZAMKNIĘTE** (decyzje 2026-06-26) |
| **Było w „10”** | T5 + T6 |

---

## Co decydujesz — rozstrzygnięte

| Temat | Decyzja | Źródło |
|--------|---------|--------|
| **Podatek / Handel** | **70/20/10** (Nauka / Pieniądz / Luksus) | D2=A, `MACIEJ-DECYZJE-WEALTH-UI` #3 |
| **Plaster D2** | **A** — wpinaj teraz (Praca → budynki vs pula) | D2=A, KARTA |
| **Kupno za pieniądz** | Jednostki ze skarbcu + koszt populacji | SILNIK batch 2026-06-26 |
| **Podział per miasto** | `podzialHandlu`, `podzialPracy` na `City` | EKONOMIA lane |
| **Auto-zarządca** | Logika w `auto-manage.ts` | v1.0 — UI toggle do ustalenia w B1 |

---

## Implementacja (lane)

- `gra/src/ui/cityPanel.ts` — suwaki Handel, Praca (Społeczeństwo osobno → B4)
- `gra/src/game/cities.ts` — pola per-city
- `dyspozycje/_handoff/EKONOMIA-do-MASTER_podzial-per-city.md`

---

## Ewentualne doprecyzowania (nie blokują)

- Widoczność suwaka **auto-zarządca** w panelu (on/off per miasto)
- Domyślne wartości nowego miasta (70 budynki praca — `buildEconParams`)

## Powiązania

- `docs/MACIEJ-KARTA-DECYZJI.md` — D2=A
- `docs/MACIEJ-DECYZJE-WEALTH-UI_2026-06-26.md`
