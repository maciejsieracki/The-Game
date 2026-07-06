# B2 — Panel miasta: społeczeństwo

| Pole | Wartość |
|------|---------|
| **ID** | B2 |
| **Czat** | Civ — T-B2 Społeczeństwo |
| **Ekran** | **Panel miasta** |
| **Status** | **ZAMKNIĘTE (Maciej)** — B2-Q1…Q12 ✓ · **paczka ABC 1–11** ✓ 2026-06-27 · lane + **SILNIK wpięte** |
| **Było w „10”** | brak (elementy były w starym T5/T6 panelu miasta) |

---

## Co decydujesz (Maciej)

- **Zadowolenie** — **Q3=C per miasto** (skrót + klik → szczegóły; **nie** globalnie na HUD mapy)
- **Porządek / bunt** — szczęście, prawo, progi T1/T2, status buntu (`order.ts`, `orderPanel.ts`)
- **Zdrowie** — punkty zdrowia miasta, wpływ na wzrost (decyzja **#1 z 25.06** — model WIRE w silniku; UI do dopięcia)
- **„Mieszkańcy” 3-koszyk** — zadowoleni / kontentni / niezadowoleni (emotikony vs same liczby)

---

## Rozstrzygnięte

| Temat | Decyzja | Data |
|--------|---------|------|
| Zadowolenie scope | **Q3=C** — tylko panel miasta, nie imperium | 2026-06-26 |
| Porządek tier | Model `evaluateOrder` per miasto w silniku | — |
| **B2-Q1** Mieszkańcy 3 koszyki | **A** — emotikony + liczby (dane z `happinessBreakdown`) | 2026-06-26 |
| **B2-Q2** Porządek / bunt | **B** — pełna sekcja zawsze widoczna (lewa kolumna) | 2026-06-26 |
| **B2-Q3** Zdrowie miasta | **A** — osobna sekcja w lewej kolumnie (+/− ze źródeł) | 2026-06-26 |
| **B2-Q4** Specjaliści | **C** — usunąć sekcję z panelu na v1.0 | 2026-06-26 |
| **B2-Q6** Efekt buntu | **C** — kary ekonomiczne + migracja −1/+1 w imperium (~5%/turę); **nie** utrata miasta | 2026-06-26 |
| **B2-Q5** Alert buntu | **C** — chip w panelu wydarzeń **+** ikona 🔥 na heksie miasta (do końca tury) | 2026-06-27 |
| **1 (= B2-Q7)** Model Szczęścia | **C** — **SzPct** z SzMax/Netto, rozpiska +/-, **nie** liczyć ludzi; koszyki = wizualizacja z % | 2026-06-27 |
| **2 (= B2-Q8)** Czynniki Szczęścia v1.0 | **A** — **pełna lista Spec** (wszystkie składniki z Excel/JSON) | 2026-06-27 |
| **3 (= B2-Q9)** Porządek = Sz + Prawo | **Wdrożyć Spec** — oba **%** (max/netto/rozpiska), PorPct = waga×SzPct + waga×PrawPct | 2026-06-27 |
| **4 (= B1.4)** Pola okolicy | **C** — auto + profile (Żywność/Produkcja/Podatki/Zrównoważone) + ręczna korekta 👤 · **v1.0 pełne** | 2026-06-27 |
| **B2-Q12** Bunt skrajny | **C** — rebelia AI po **2 turach grace** + **alert krytyczny** na mapie strategicznej; dźwignie: ↓podatki→Sz, wojsko→Prawo | 2026-06-27 |

Handoff: `dyspozycje/_handoff/MACIEJ-do-UI_zadowolenie-per-miasto.md`  
Handoff SILNIK (porządek): `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md`  
Handoff alert buntu: `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` + `MAPA-do-SILNIK_B2-Q5-bunt-hex.md`  
Handoff szczęście %: `dyspozycje/_handoff/EKONOMIA-do-UI_szczescie-procent.md`  
Handoff porządek %: `dyspozycje/_handoff/EKONOMIA-do-UI_porzadek-procent.md`  
Handoff okolica: `dyspozycje/_handoff/EKONOMIA-do-UI_okolica-pola-C.md`  
Handoff B2-Q12: `UI-do-GRUPA-A_B2-Q12-alert-bunt.md` + `EKONOMIA+CYWILIZACJE-do-SILNIK_B2-Q12-rebelia.md`  
Spec stabilizacja: `B2-narzedzia-stabilizacji.md` · rebelia: `B2-Q12-bunt-rebelia.md`

---

## Otwarte pytania

| ID | Temat |
|----|--------|
| *(brak w paczce B2)* | **Paczka ABC 1–11 ZAMKNIĘTA** 2026-06-27 — patrz tabela „Rozstrzygnięte" |
| **B1-tech-Q3** | Tech posterunku — **ODŁOŻONE, nie pytaj** (`B1-tech-MACIEJ-2026-06-29.md`) |

Spec: `B2-model-szczescie-procent.md` · `B2-porzadek-model.md` · `B2-narzedzia-stabilizacji.md` · progi: `B2-porzadek-progi-efektow.md`

---

## Wykonanie kodu (2026-06-27)

| Element | Stan |
|---------|------|
| Mieszkańcy 3-koszyk + emotikony | ✅ `cityPanel.ts` + `happinessBreakdown` |
| Porządek inline (lewa kolumna) | ✅ `buildOrderSectionHtml` z `orderPanel.ts` |
| Zdrowie +/- | ✅ `computeCityHealthBreakdown` (export turn-economy) |
| Specjaliści | ✅ usunięte |
| Kary B2-Q6 (Praca/Pieniądz/Nauka/Kultura/wzrost) | ✅ `order.ts` + `turn-economy` `orderMultByCity` |
| Migracja buntu | ✅ `pickRevoltMigrationTarget` — **WPIĘTE** w main (F-B2-porzadek) |
| Haki silnika UI | ✅ `getOrderState` / `getCityHealth` + `porzadek: ord.order` |
| Chip + ikona buntu (B2-Q5=C) | 🟡 chip ✅ (F-HUD getEvents) · 🔥 hex **CZEKA MAPA** |

Backup: `gra/src/ui/cityPanel.ts.bak-UI-20260626`

---

## Lane

| Lane | Pliki |
|------|-------|
| EKONOMIA | `order.ts`, `turn-economy.ts` (computeCityHealth) |
| UI | `cityPanel.ts`, `orderPanel.ts` |

## Powiązania

- `UI/Gra-podglad-MIASTO.html` — sekcje społeczeństwo
- `docs/analiza/06-DYSPOZYCJE-stan.md` — wiszący 3-koszyk
