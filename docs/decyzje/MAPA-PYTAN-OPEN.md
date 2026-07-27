# Mapa pytań — kto pyta Macieja o co

> **Source of truth routingu.** Agent **nie zadaje** pytania spoza swojej Grupy.  
> Format ABC: `docs/decyzje/DYSPOZYCJA-STALA.md` §2.

**Ostatnia synchronizacja:** 2026-07-28 (FALA 41–44 → `STATUS-WDROZEN-AGENT-2026-07-28.md` · `STAN-PRACY-HANDOFF.md` §3a-6)

### Kolejka ABC 2026-07-27 — odpowiedzi Macieja (źródło: pliki per ID)

| ID | Litera | Status | Plik |
|----|--------|--------|------|
| C-WIAR-N4-AI | **B** | 🟢 WDROŻONA · FALA 36 | `C-WIAR-N4-AI.md` |
| C-WIAR-D4 | **A** | 🟢 WDROŻONA · FALA 36 | `C-WIAR-D4.md` |
| C-WIAR-N1-UX | **A** | 🟢 WDROŻONA · FALA 36 | `C-WIAR-N1-UX.md` |
| P-AI-006 | **C** | 🟢 WDROŻONA · FALA 36 | `P-AI-006.md` |
| P-AI-007 | **A** | 🟢 WDROŻONA · FALA 36 | `P-AI-007.md` |
| P-AI-008 | **C** | 🟢 WDROŻONA · FALA 36 | `P-AI-008.md` |
| R-MAPGEN-KOLEJNOSC-Q1 | **B** | 🟢 WDROŻONA · FALA 36 | `R-MAPGEN-KOLEJNOSC-Q1.md` |
| R-MAPGEN-KOLEJNOSC-Q2 | **C** | 🔵 KOD OK · ⏸ F37 | `R-MAPGEN-KOLEJNOSC-Q2.md` |
| R-MAPGEN-KOLEJNOSC-Q3 | **A** | 🔵 KOD OK · ⏸ F37 | `R-MAPGEN-KOLEJNOSC-Q3.md` |
| C-TEREN-IMPL-1 | **A** | 🟢 WDROŻONA · FALA 36 | `C-TEREN-IMPL-1.md` |
| C-TEREN-IMPL-2 | **C** | 🟢 WDROŻONA · FALA 36 | `C-TEREN-IMPL-2.md` |
| C-TEREN-IMPL-3 | **B** | 🟢 WDROŻONA · FALA 36 | `C-TEREN-IMPL-3.md` |
| R-BITWA-POWTORKA-I | **B** | 🔵 KOD OK · ⏸ F37 | `R-BITWA-POWTORKA-I.md` |
| C-ARMY-HUNGER-Q1 | **A** | 🟢 WDROŻONA | `C-ARMY-HUNGER-Q1.md` |
| C-STRATY-HP-Q1 | *(wyjaśnienie)* | ZAMKNIĘTE | `C-STRATY-HP-Q1.md` |
| PYTANIE-20 | **A** | ZAMKNIĘTE | `PYTANIE-20.md` |
| PYTANIE-21 | **B** (55) | 🟢 WDROŻONA | `PYTANIE-21.md` |
| PYTANIE-22 | **B** (56) | ZAMKNIĘTE | `PYTANIE-22.md` |
| PYTANIE-23 | **A+B** (57) | 🟢 WDROŻONA | `PYTANIE-23.md` |
| C-OBCE-JEDN-Q1 | A | 🟢 ZAMKNIĘTE | `C-OBCE-JEDN-Q1.md` |
| C-OBCE-JEDN-Q2 | TW | 🟢 WDROŻONA · FALA 43 | `C-OBCE-JEDN-Q2.md` |
| C-OBCE-JEDN-Q3 | A+B+C | 🟢 ZAMKNIĘTE | `C-OBCE-JEDN-Q3.md` |
| C-UPGRADE-TRIGGER | A | 🟢 WDROŻONA · FALA 44 | `C-UPGRADE-TRIGGER.md` |

Indeks zbiorczy: **`docs/decyzje/ABC-KOLEJKA-OTWARTE-2026-07-27.md`** · **PYTAJ TYLKO O:** `docs/decyzje/AUDYT-PYTAJ-TYLKO-O-2026-07-27.md`

---

## Legenda statusu pytania

| Status | Znaczenie |
|--------|-----------|
| **OTWARTE** | Czeka ABC od Macieja |
| **ZAMKNIĘTE** | Decyzja zapisana — tylko implementacja |
| **INNA GRUPA** | Nie pytaj tutaj — patrz kolumna „Grupa” |

---

## Grupa A — Mapa świata (strategia)

**Charter:** `docs/czaty/GRUPA-A-MAPA-SWIATA.md`  
**Ekran w pytaniach:** `[EKRAN: Mapa świata]`

| ID | Pytanie | Status | Źródło / uwagi |
|----|---------|--------|----------------|
| **A1-Q2** | Bilans +X/turę na pasku | **ZAMKNIĘTE → B** | legacy Q2 |
| **A1-Q5** | Banery cywilizacji (wojna/pokój) na HUD | **ZAMKNIĘTE → A+C custom** | legacy Q5 |
| **A1-Q6** | Lewy toolbar | **ZAMKNIĘTE → Zasoby, Cuda, Budowa** |
| **A1-Q7** | Idee na HUD | **ZAMKNIĘTE → brak idei; tylko Kultura na pasku** | legacy Q7 |
| **A1-Q8** | Wydarzenia z tury (panel/chipy) | **ZAMKNIĘTE → A** (prawy panel chipów D1B) | legacy Q8 |
| **A1-Q9** | Przycisk WYKONAJ | **ZAMKNIĘTE → A + brama końca tury** | legacy Q9 |
| **A1-Q10** | Przycisk Koniec tury | **ZAMKNIĘTE → A+B** (dolny pasek + okrąg MAPA) | legacy Q10 |
| **A1** | Mockup D1B — akceptacja przed kodem | **ZAMKNIĘTE → ABC1=A** | 2026-06-27 |
| **A1-Q11** | Kultura na pasku zasobów [A] | **ZAMKNIĘTE → A** | 2026-06-27 |
| **A1-Q12** | Klik ikon kultura/religia → treść overlay | **ZAMKNIĘTE → A1-Q12a/b=A** | `A1-Q12-kultura-religia-minimapa.md` |
| **MAPA-F2-Q1** | Toggle zasięgu obok minimapy | **ZAMKNIĘTE → MAPA** | nie Grupa D |
| **A2-Q4** | Wybrana jednostka na heksie | **ZAMKNIĘTE → A** | pełna karta [H] · 2026-06-27 |
| **A3** | Ruch, merge armii (D6, D8 ruch) | CZĘŚCIOWO | `A3-ruch-armie.md` |
| **A4** | Ulepszenia terenu z mapy (D4 Excel) | **ZAMKNIĘTE → A4-D4-Q1=A, A4-Q1=A** | 2026-06-27 · `A4-D4-przeglad-ulepszen-terenu.md` |
| **A-FOG-Q1** | Zasięg mgły jednostki (= Ruch; Zwiadowca min. 5) | **ZAMKNIĘTE → B** | 2026-06-27 · `docs/grupa-a/A-FOG-Q1-widok-jednostki.md` · miasto → **Grupa B** |
| **A5** | Wygląd mapy (D12) | CZĘŚCIOWO | `A5-wyglad-mapy.md` |
| **C1-Q1–Q5** | preBattle overlay (Auto/Ręczna/Wycofaj) | **ZAMKNIĘTE** | decyzje w `C1-wejscie-walke.md` · **pytania w czacie Grupa A** |
| **C3-Q1–Q10** | Oblężenie, strategia na mapie | **ZAMKNIĘTE** | Maciej **2026-06-27** · `docs/decyzje/C3-obleczenie.md` · `C3-Q1=A, C3-Q2=custom, C3-Q3=B, C3-Q4=A, C3-Q5=C, C3-Q6=A, C3-Q7=A, C3-Q8=C, C3-Q9=A, C3-Q10=C` |

**ZAMKNIĘTE w Grupie A (nie pytaj ponownie):** Q1→B5, Q3→B2, D15 minimapa, D1 układ=B.

**Grupa A NIE PYTA o:** panel miasta (B), pole bitwy 3D / preBattle (C), drzewko tech (D), menu startu (E).

**Kolejność paczek ABC:** A1-Q5–Q10 → A2-Q4 → A4 · D1B akceptacja osobno.

---

## Grupa B — Miasto i ekonomia

**Charter:** `docs/czaty/GRUPA-B-MIASTO-EKONOMIA.md`  
**Ekran:** `[EKRAN: Panel miasta]`

| ID | Pytanie | Status |
|----|---------|--------|
| **#1–3** | Szczęście, czynniki, Prawo/Porządek | **ZAMKNIĘTE** (1C, 2A, 3) |
| **B2-Q12** | Bunt skrajny / rebelia | **ZAMKNIĘTE → C** (grace 2 tury + alert) |
| **#4** | Pola pracy okolica | **ZAMKNIĘTE → 4C** (profile + ręczna korekta, v1.0) |
| **#5–6, #11** | rush, auto-zarządca, ulepszenia→plony | **ZAMKNIĘTE** (5A, 6A, 11A · paczka 2026-06-27) |
| **#7–8** | Kultura/religia w panelu | **ZAMKNIĘTE** (7A, 8A) |
| **#9–10** | Suwak żywności, default split | **ZAMKNIĘTE** (9A, 10A) |

**ZAMKNIĘTE:** B3, B4 model Wealth, B5 model Q1 (hybryda), B2-Q1…Q6.

**Pełne opcje ABC:** `docs/grupa-b/MACIEJ-PYTANIA-ABC.md` · odpowiedź: `1C 2B …`

**Grupa B NIE PYTA o:** HUD mapy (A1), jednostkę na heksie (A2), UX bitwy (C2).

**Kolejność paczek:** **1–3** → **4–6** (+**11**) → **7–10**.

---

## Grupa C — Walka

**Charter:** `docs/czaty/GRUPA-C-WALKA.md`

| ID | Pytanie | Status |
|----|---------|--------|
| **C2-Q2–Q7** | UX mapy bitwy 3D | **ZAMKNIĘTE** (2026-06-26, D5=B) · F-C2 **TODO** |
| **C4** | Posiłki D8, Katapulta D10 | **ZAMKNIĘTE** |
| **C4 balans** | Macierz-walki.xlsx | **ZAMKNIĘTE** (2026-06-29) |

**C1, C3:** **INNA GRUPA → Grupa A** — nie pytaj w czacie Walka.

**UWAGA:** **C2-Q*** ≠ **A2-Q*** ≠ legacy **HUD Q2–Q10**.

**Grupa C NIE PYTA o:** A2-Q4, Wealth (B), nauka (D).

---

## Grupa D — implementacja (decyzje zamknięte)

D1–D4 — **nie nowe ABC**. Wyjątek: luka danych → Silnik.

**NIE PYTA:** A1 HUD, B4.1 panel kultura UI, bitwa.

---

## Grupa E — Meta

E1 (D13), E2 (AI), E3 (D14) — **brak stałej paczki ABC** w tej mapie; pytania tylko gdy w KARCIE pojawi się luka (E1-Q9…Q12, E2, E3 — patrz `docs/grupa-e/`).

**NIE PYTA:** HUD, panel miasta, bitwa.

---

## Najczęstsze pomyłki

| Błąd | Poprawnie |
|------|-----------|
| Q4 jednostka w Grupie C | **A2-Q4** → A |
| C2-Q2 w Grupie A | **C2-Q2** → C |
| Q3 zadowolenie na HUD | **B2** (zamknięte) |
| legacy Q5 banery w C1 | **A1-Q5** (banery) · preBattle = **C1-Q*** |

---

## Dyspozycje do wklejenia

`docs/czaty/DYSPOZYCJA-GRUPA-A.md` … `DYSPOZYCJA-GRUPA-E.md` · `DYSPOZYCJA-MASTER-SILNIK.md`

---

## Licznik pracy Macieja (2026-07-01)

> **D1–D15 (KARTA):** wszystkie **zamknięte** — poniżej tylko **pytania szczegółowe** z czatów tematycznych (liczone wg tabel powyżej).

| Grupa | Otwarte ABC | Rozbicie |
|-------|-------------|----------|
| **A** | **0** | **C3-Q1…Q10** ✅ 2026-06-27 · **A3** / **A5** = CZĘŚCIOWO (implementacja / sign-off, nie nowe ABC) |
| **B** | **0** | Paczka **1–11** ✅ 2026-06-27 · **B2-D16/D17/D18** ✅ 2026-07 · `#5–10` w tabeli = **archiwum** (już odpowiedziane) |
| **C** | **0** | **C4 balans** ✅ 2026-06-29 · C2/C3 zamknięte |
| **D** | **0** | D1–D4 zamknięte — tylko implementacja |
| **E** | **0** | Brak wierszy OTWARTE w tej mapie — luki w KARCIE → czat E |
| **RAZEM** | **0 pilnych** | + **odłożone post-v1.0:** JEDN-KOSZT-v2 (już A, wdrożenie później) · sesje balansu Panel-D |

\* **A4 = B1.1** — licz **raz**.  
\** **C3:** decyzje w `docs/decyzje/C3-obleczenie.md` (2026-06-27) · paczki `docs/grupa-a/C3-PYTANIA-PACZKA-*.md` = archiwum pytań · **C1 preBattle** = Grupa A od 2026-06-27.

**Zamknięte (nie licz do pracy):** legacy Q1→B5, Q2→A1, Q3→B2, Q8→A1-Q8=A, Q9→A1-Q9=A, **Q10→A1-Q10=A+B** · B3 · B4 model · B2-Q1…Q6 · C1-Q1…Q5 · **C3-Q1…Q10** · C2-Q2…Q7 · D1–D15 · C4 · A1-Q5, A1-Q7, A1-Q11 · ABC1=A · A2-Q4 · A4-D4-Q1.

**Paczki po max 3 ABC** (Maciej 2026-07-04): np. `A1-Q5…Q7`, potem `A1-Q8…Q10`, itd.

**Lekkie sign-offy (nie pełne ABC):** mockup D1B, podgląd miast BRAZU (D12=A), zatwierdzenie defaultów startu (D13=A).

