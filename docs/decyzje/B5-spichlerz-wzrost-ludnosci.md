# B5 — Spichlerz, wzrost ludności i żywność wojska

| Pole | Wartość |
|------|---------|
| **ID** | B5-SPICH |
| **Czat** | Grupa B (Miasto / ekonomia) |
| **Ekran** | Panel miasta + HUD mapy (zapasy państwa) |
| **Status** | **ZAMKNIĘTE (Maciej)** · amendement **SP1–SP6** 2026-07-01 → batch **B5-SP-FOLLOWUP** |
| **Data** | 2026-06-29 · **SP 2026-07-01** |

---

## Słownik (obowiązkowy w UI i docs)

| Termin | Znaczenie |
|--------|-----------|
| **Spichlerz** | Budynek miasta. **Nie** pisz „magazyn żywności” w panelu — używaj **Spichlerz**. |
| **Bufor wzrostu** | Żywność **tego miasta** składana na próg kolejnego mieszkańca (N → N+1). |
| **Zapasy państwa** | Globalna pula imperium na **wojsko** (suwak „Rozwój miast” vs państwo). |

---

## Model w jednym akapicie

Żywność netto miasta dzieli suwak imperium na **rozwój miast** (bufor wzrostu per miasto) i **zapasy państwa** (wojsko). **Bez Spichlerza** bufor wzrostu działa, ale przy awansie ludności **spada do zera**; nadwyżka na wojsko jest **zjadana co turę**, a niewykorzystana **przepada**. **Ze Spichlerzem** przy awansie zostaje **50%** bufora (jak Civ) **oraz** nadwyżka na wojsko **gromadzi się** w zapasach państwa. **Rekrutacja wojska nigdy nie jest blokowana** brakiem Spichlerza.

---

## Wzrost ludności (zawsze — z Spichlerzem i bez)

### Próg kolejnego mieszkańca

**Próg(N) = 10 + N × wsp** (normal: wsp = **8**, z `econ-params.json`).

| Z pop | Na pop | Próg bufora (🍞) |
|-------|--------|------------------|
| 1 | 2 | **18** |
| 2 | 3 | **26** |
| 3 | 4 | **34** |
| 4 | 5 | **42** |
| 5 | 6 | **50** |
| 6 | 7 | **58** *(wymaga Akweduktu — cap wzrostu bez niego)* |
| 7 | 8 | **66** |
| 8 | 9 | **74** |
| 9 | 10 | **82** |
| 10 | 11 | **90** |
| 11 | 12 | **98** |
| 12 | 13 | **106** |
| 13 | 14 | **114** |
| 14 | 15 | **122** |

### Bufor wzrostu

- Część żywności miasta (wg suwaka **„Rozwój miast”**) **w całości** trafia do bufora wzrostu i **kumuluje się** turę po turze.
- Gdy **bufor ≥ Próg(N)** i nie ma blokady (Akwedukt, obleżenie itd.) → **+1 ludność**.

### Po awansie ludności (N → N+1)

| | **Bez Spichlerza** | **Ze Spichlerzem** |
|---|-------------------|-------------------|
| Bufor wzrostu | **→ 0** (całość „zjedzona” przy narodzinach) | **→ 50%** bufora (`spichlerz_zachowanie_po_wzroscie`, domyślnie 0,5) |
| Efekt | Wolniejszy kolejny próg (start od zera) | Szybszy wzrost — jak w Civ |

Przykład bez Spichlerza: zebrano 18 → ludność 2 → bufor **0** → do 2→3 trzeba znów **26** od zera.

Przykład ze Spichlerzem: bufor 18 → ludność 2 → bufor **9** (50%) → do 26 brakuje 17, nie 26.

---

## Wojsko i zapasy państwa

### Bez Spichlerza

- Suwak imperium nadal dzieli żywność (np. 70% miasta / 30% państwo).
- Część **państwo** karmi wojsko **w tej turze**.
- **Niewykorzystana** część **przepada co turę** (nie odkłada się).
- **Rekrutacja wojska: ZAWSZE dozwolona** — brak Spichlerza **nie blokuje** rekrutacji (unikanie niezrozumiałej blokady dla gracza).

### Ze Spichlerzem (bonus #2)

- Część **państwo** **gromadzi się** w **zapasach państwa** (kumulacja między turami).
- Wojsko je z zapasów; nadwyżka **nie przepada**, dopóki leży w puli.
- Bufor na głód / mniej miast / chwilowy deficyt produkcji — wojsko może jeść ze **zapasów**.

Głód wojska (zapasy < 0): **−8% max HP/turę** — bez zmian (B5-Q1).

---

## Dwa bonusy Spichlerza (podsumowanie)

1. **Wzrost:** po awansie ludności bufor **nie zeruje się** — zostaje **50%** → szybszy kolejny mieszkaniec.
2. **Wojsko:** nadwyżka żywności imperium na wojsko **się odkłada** (zapasy państwa), zamiast przepadać co turę.

---

## UI (Grupa B — po implementacji)

| Element | Tekst / zachowanie |
|---------|-------------------|
| Sekcja panelu | **„Spichlerz — wzrost”** (nie „Magazyn żywności”) |
| Bez Spichlerza | Pasek bufora + próg + ETA; hint: bufor zeruje się przy wzroście; wojsko bez składania |
| Ze Spichlerzem | Pasek bufora + informacja o 50% po wzroście; zapasy państwa w „Imperium / wojsko” |
| Błędny tekst do usunięcia | *„Bez Spichlerza nadwyżka nie jest magazynowana”* — **mylące**; zastąpić modelem powyżej |

---

## Stan kodu vs kanon (2026-06-30)

| Obszar | Stan |
|--------|------|
| `populationGrowth` bez/ze Spichlerzem | ✅ `economy.ts` |
| `maSpichlerz` w ticku | ✅ `turn-economy.ts` |
| `empire-food.ts` kumulacja ON/OFF | ✅ |
| UI `cityPanel` Spichlerz | ✅ |
| Testy | ✅ `spichlerz-wzrost-test` 9/9 · `empire-food-b5-test` 10/10 |

**Handoff:** `dyspozycje/_handoff/EKONOMIA-do-MASTER_B5-spichlerz-GOTOWE.md`

---

## Amendement SP1–SP6 (Maciej 2026-07-01)

Pełny formularz: `docs/decyzje/B5-spichlerz-FORMULARZ-SP1-SP6.md` · handoff: `MACIEJ-do-MASTER_B5-spichlerz-SP-2026-07-01.md`

| Temat | Ustalenie |
|--------|-----------|
| Sign-off model | **SP1=A** |
| Bufor po wzroście | **SP2=A** — 50% |
| Kumulacja armii | **SP3=A** — ≥1 Spichlerz w imperium |
| Wyświetlanie 📦 | **SP4=C** — **tylko HUD mapy**; panel bez zapasów (**SP4-szczegóły=A**) |
| Suwak default | **SP5=A** — 70/30 |
| Limit zapasów | **SP6=C** — **100 🍞 × liczba Spichlerzy** |
| Overflow | **SP6-overflow=A** — nadwyżka **przepada** |
| HUD format | **SP6-HUD=B** — **`zapasy / max`** (np. 142/200) |
| Upgrade poziomów Spichlerza | **odłożone** |

---

## Powiązania

- `docs/decyzje/B5-zywnosc.md` — suwak imperium, głód −8% HP
- `gra/data/econ-params.json` — progi, 50% po wzroście, cap Akwedukt, **`spichlerz_pojemnosc_zapasow_panstwa`**
- `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_spichlerz-wzrost-ludnosci.md` — kontrakt pierwotny lane
- `dyspozycje/_handoff/MASTER-do-EKONOMIA_B5-spichlerz-SP-limit-2026-07-01.md` — batch limit
- `dyspozycje/_handoff/MASTER-do-UI_B5-spichlerz-SP-hud-2026-07-01.md` — batch HUD
