# D3 — tuning dyplomacji na kanonie Moc + Respekt (Grupa D)

**Data:** 2026-06-26  
**Status:** **TUNING v1 ZAMKNIĘTY** — progi Panel-D **bez zmian** (zgodne z P-A)  
**Źródło Mocy:** `power-params.json` · kalibracja **3020** (ep.1, 10 miast, ~100 ludków)  
**Formuła Respekt:** `round(100 × Moc_self / (Moc_self + Moc_partner))`

---

## 1. Mapowanie progów Panel-D → stosunek Mocy

| Próg (Panel-D / `diplomacy.json`) | Respekt min. | Stosunek Mocy (silny:słaby) | Przykład przy Moc silnego = 3020 |
|-----------------------------------|--------------|-----------------------------|-----------------------------------|
| AI NAP ze strachu (`dyplomacja_strach_prog_nap` **60**) | 60 | **≥ 1,5 : 1** | vs partner **≤ 2013** Moc |
| Wasalizacja (`progWasalizacjaRespekt` **70**) | 70 | **≥ ~2,33 : 1** | vs partner **≤ 1295** Moc |
| Wchłonięcie (`progWchloniecieRespekt` **90**) | 90 | **≥ 9 : 1** | vs partner **≤ 336** Moc |
| Sojusz (`progSojuszZaufanie` **60**) | — | **Zaufanie**, nie Moc | osobna oś |
| Relacja minimalna (`progMinimalnyRelacja` **30**) | — | suma Z+R | blokada dialogu |

**Wniosek tuningu:** progi **60 / 70 / 90** tworzą sensowną drabinkę dominacji (NAP → wasal → aneksja). **Nie zmieniamy** bez playtestu Macieja.

---

## 2. Scenariusze referencyjne (kalibracja 3020)

| # | Moc **my** | Moc **oni** | **Respekt my→oni** | **Respekt oni→my** | Gameplay |
|---|------------|-------------|--------------------|--------------------|----------|
| 1 | 3020 | 3020 | **50** | **50** | Parytet — brak wasala |
| 2 | 3020 | 2013 | **60** | **40** | Próg NAP ze strachu (AI) |
| 3 | 3020 | 1295 | **70** | **30** | Próg wasalizacji |
| 4 | 4000 | 2000 | **67** | **33** | 2:1 — silna przewaga, **poniżej** wasala |
| 5 | 40000 | 2000 | **95** | **5** | Dominacja, **poniżej** wchłonięcia (90) |
| 6 | 3020 | 336 | **90** | **10** | Próg wchłonięcia |
| 7 | 1500 | 3020 | **33** | **67** | My słabsi — AI może żądać trybutu (prog 60 od strony AI) |
| 8 | 500 | 3020 | **14** | **86** | Miasto-państwo vs imperium |

---

## 3. Oś Zaufanie (Panel-D) — bez zmian w tym tuningu

| Parametr | Wartość | Uwaga |
|----------|---------|--------|
| `startZaufanie` | 20 | start miękki |
| `startRespekt` | 30 | **tylko init** — po 1. turze nadpisywane przez `computeRespekt(Moc, Moc)` |
| `progSojuszZaufanie` | 60 | sojusz po Zaufaniu |
| `handel_zaufanie_perTura` | +1 | tick |

**Rekomendacja integratora:** w UI pokazywać **Respekt z Mocy**, nie `startRespekt` 30 jako „prawdę” po kontakcie.

---

## 4. Legacy — nie ruszać

| Artefakt | Status |
|----------|--------|
| `diplomacy.json` → `respekt_-_czynniki` | **dokumentacja legacy** — silnik **nie używa** |
| `diplomacy.json` → `panel_sterowania.A` | j.w. |
| `computePotegaNacji` 0–100 | tylko victory/UI legacy paths — **Respekt dyplomacji = objective Moc** |
| Cyw-12-POTEGA per-cyw | **usunięte** — nie przywracać |

---

## 5. Testy po tuningu (2026-06-26)

| Suite | Wynik |
|-------|-------|
| `power-objective-test.cjs` | **9/9** |
| `diplomacy-test.cjs` | **135/135** |

Zmiana Panel-D w Excelu → `export-d.py` + powtórzyć `diplomacy-test.cjs`.

---

## 6. Następne kroki (poza tune JSON)

| Kto | Co |
|-----|-----|
| **Maciej** | D3-UX-1…4 ABC (`D3-UX-relacja-parametry-ABC.md`) |
| **UI** | audiencja v2 — handoff odblokowany |
| **SILNIK** | `getState()` + Moc w audiencji |
| **CYW** | tagi `dip_*` po eksporcie macierzy |

**Symulator Excel:** `docs/decyzje/POWER-kalkulator-Maciej.xlsx` (Moc) + formuła Respekt w tym dokumencie.
