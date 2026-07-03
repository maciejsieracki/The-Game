# Design — W3 Miasto · zakładki prawego panelu · v2 (sync z grą)

> **Hasło:** `START — W3-miasto-zakladki-v2`  
> **Priorytet:** po Grupa C (walka) — równolegle z A-08 ulepszenia mapy  
> **Baseline:** screenshoty Macieja 2026-07-03 + `gra/src/ui/cityPanel.ts` (kanon ma W3-full-lite)

---

## Screenshoty baseline (w repo)

**Folder:** `docs/ux/referencje-w3-screenshots/`  
**Indeks:** `docs/ux/referencje-w3-screenshots/README.md`

| # | Plik | Zakładka |
|---|------|----------|
| 1 | `01-wzrost-ludnosci-spichlerz.png` | Wzrost ludności |
| 2 | `02-podzial-handlu-zamoznosc.png` | Podział handlu |
| 3 | `03-podzial-pracy.png` | Podział pracy |
| 4 | `04-porzadek.png` | Porządek |
| 5 | `05-zdrowie-miasta.png` | Zdrowie |
| 6 | `06-kultura.png` | Kultura |
| 7 | `07-religia.png` | Religia |

To **źródło prawdy wizualne** — mockup v2 ma odwzorować strukturę z tych PNG (polish 1E, nie nowy UX).

---

## Dla Macieja — wklej designerowi (copy-paste)

**Krok 1 — jedna wiadomość tekstowa** (całość poniżej, od `START` do końca bloku).

**Krok 2 — załączniki:** jeśli designer **nie ma repo**, dołącz zip folderu `docs/ux/referencje-w3-screenshots/` (7 PNG + README).  
Jeśli ma repo Civ — wystarczy ścieżka w wiadomości.

```
START — W3-miasto-zakladki-v2

Kontekst: panele miasta SĄ już w grze (Gra-podglad.html). Lane UI zaimplementował prawy panel
(7 zakładek) bez pełnego polishu 1E. Stare mockupy W3 (Miasto Zakładki cz1/cz2) są NIEAKTUALNE
(inna semantyka niż gra). Zadanie: mockup v2 = ten sam układ co gra + styl 1E (SVG, suwaki,
typografia). NIE wymyślaj nowego gameplayu.

SCREENSHOTY (baseline — otwórz w tej kolejności):
  docs/ux/referencje-w3-screenshots/README.md          ← mapa plik → zakładka
  docs/ux/referencje-w3-screenshots/01-wzrost-ludnosci-spichlerz.png
  docs/ux/referencje-w3-screenshots/02-podzial-handlu-zamoznosc.png
  docs/ux/referencje-w3-screenshots/03-podzial-pracy.png
  docs/ux/referencje-w3-screenshots/04-porzadek.png
  docs/ux/referencje-w3-screenshots/05-zdrowie-miasta.png
  docs/ux/referencje-w3-screenshots/06-kultura.png
  docs/ux/referencje-w3-screenshots/07-religia.png

DYPOZYCJA (szczegóły per zakładka, checklist, różnice vs stary Design):
  dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-zakladki-v2-2026-07-03.md

STYL 1E (obowiązkowo):
  docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/tokens.css
  docs/ux/claude-design/The Game — HUD Kit (1E).dc.html
  docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/icons/  (cp-*, res-*)

NIE używaj jako wzorca (przestarzałe):
  docs/ux/claude-design/The Game - Miasto Zakładki W3 (1E).dc.html
  docs/ux/claude-design/The Game - Miasto Zakładki W3 cz2 (1E).dc.html

DELIVERABLE:
  • NOWY plik: The Game - Miasto Zakładki W3 v2 (1E).dc.html
    — 7 klatek prawego panelu (1:1 ze screenshotami)
    — wspólna stopka SUROWCE W ZASIĘGU na każdej klatce
    — opcjonalnie 1 klatka pełnego chrome (2 rail + okolica + górny pasek)
  • Zero emoji Unicode — tylko SVG z brand-book
  • Zip: brand-book/ostatnie/W3-miasto-zakladki-v2.zip
  • Handoff zwrotny: krótki DESIGN-do-UI_w3-miasto-zakladki-v2.md

NIE koduj TypeScript. Po Twoim mockupie lane UI tylko dopasuje CSS w cityPanel.ts.

Potwierdź start jednym zdaniem i idź krok po kroku przez dyspozycję.
```

---

## Stan faktów (audyt 2026-07-03)

| Warstwa | Stan |
|---------|------|
| **Kod** (`cityPanel.ts`, `cityUxFrame.ts`) | ✅ **Zaimplementowane** — Maciej widzi to w kanonie |
| **Design W3 cz1/cz2** | ⚠️ **Nieaktualne** — inna semantyka niż gra |
| **START-W3-miasto-1E.md** | ⚠️ Częściowo spełniony w kodzie; brakuje polishu 1E per zakładka |

### Layout w grze (nie zmieniaj semantyki — tylko wygląd)

```
┌─────────────────────────────────────────────────────────────┐
│  Górny pasek B-02: nazwa · garnizon · chipy statów · ✕     │
├──────────┬────────────────────────────┬───┬─────────────────┤
│ rail L   │      OKOLICA (hex grid)    │rail│  prawy panel   │
│ budowa   │                            │ R  │  (7 zakładek)  │
│ rekrut.  │                            │    │                 │
└──────────┴────────────────────────────┴───┴─────────────────┘
```

- **Lewy rail (2):** budowa, rekrutacja → lewy panel produkcji  
- **Prawy rail (7):** spichlerz, handel, praca, porządek, zdrowie, kultura, religia  
- **Stopka stała** na każdej zakładce prawej: **SUROWCE W ZASIĘGU** (grid 2×2)

---

## 7 zakładek — co rysujesz (1:1 z kodem)

### 1 · Spichlerz / Wzrost ludności (`renderMagazyn`)

**Tytuł sekcji:** „Wzrost ludności" (gdy brak budynku Spichlerz) lub „Spichlerz"

| Element | Treść demo |
|---------|------------|
| Status row | Ludność **1** · Do +1 **~2 tury** (zielony) |
| Bilans | Netto **+12/t** · Bufor **+12/t** |
| Suwak WZROST ↔ ARMIA | Pasek **0 / 18** (wzrost) · **+0/t** (armia) · slider na dole |
| Link | **i SZCZEGÓŁY** → karta algorytmu (osobny panel — można miniaturę) |

**Design v1 miał:** magazyn 120/200 + produkcja/konsumpcja — **to już nieaktualne** dla tej zakładki.

---

### 2 · Podział handlu (`renderHandel` + Wealth)

| Element | Treść demo |
|---------|------------|
| Summary | Handel **0/t** · Pieniądz **+2/t** · Nauka **0/t** · Kultura **0/t** |
| 4 kafelki | Skarb +0·70% · Nauka +0·20% · Zamożność +0·10% · **Korupcja −0·5%** (czerwony) |
| 3 suwaki | Skarb 70% · Nauka 20% · Zamożność 10% |
| Sekcja Zamożność | W Poziom **W1** · × Skarb **1.00** · Sz **+0** · pasek **0/9** · „Do W+1 —" |

---

### 3 · Podział pracy (`renderPraca`)

| Element | Treść demo |
|---------|------------|
| Pasek split | złoty **+5/t** (🏛 budynki) · niebieski **+2/t** (🛠 pula) — **70/30** |
| Suwak | % budynki vs pula imperium |
| Breakdown | Miasto +7/t · Budowa +5/t · Pula +2/t |
| Linie detail | Kolejka budowy pusta — wybierz Buduj · Skarbiec · Rekrut. za monety |

**Design v1 miał:** przydział obywateli na pola/warsztaty — **to inny model; nie rysuj**.

---

### 4 · Porządek (`renderPorzadek`)

| Element | Treść demo |
|---------|------------|
| Header | **PORZĄDEK · 1 MIESZK.** · PODGLĄD |
| Status | Stan: **Napięcie** · Efekt: Praca **×0,95** · Garnizon **0 jedn.** |
| Szczęście | pasek **58%** · składniki (+2 kultura, +2 religia, +3 osiedle) |
| Prawo | pasek **58%** · (+7 osiedle) |
| Porządek łącznie | **Napięcie 58%** · chip **⚠ Napięcie** (zastąp emoji SVG) |

**Design v1 miał:** jeden pasek +3 zadowolenia — **za proste**.

---

### 5 · Zdrowie (`renderZdrowie`)

| Element | Treść demo |
|---------|------------|
| 3 chipy | Razem **0** · Plusy **+2** · Minusy **−2** |
| Składniki | NA PLUS: Osiedle (1 mieszk.) +2 · NA MINUS: Brak wody −2 |
| Ikony | **bez emoji** ❤💀 — użyj SVG z HUD Kit |

---

### 6 · Kultura (`renderKultura`)

| Element | Treść demo |
|---------|------------|
| Summary | **0/t** · Zasięg **+0** |
| Składniki | (pusty stan: „Brak rozpisanych źródeł…") |
| Pasek | Kultura **0 / 100** · Granice **+0 · +0/t** |

---

### 7 · Religia (`renderReligia`)

| Element | Treść demo |
|---------|------------|
| Summary | Religia rzymska **100%** · Sz **+2** · Wierni **0/t** |
| Składniki | Wpływ na szczęście +2 · kult państwa 100% |

---

### Stopka wspólna · Surowce w zasięgu (`renderSurowceFooter`)

Grid **2×2** na każdej zakładce prawej:

| Bydło (krowa/wół) | Glina |
| Koń | Sól |

- Koń/Sól dziś mają **placeholder box** — Design: prawdziwe ikony `res-*` z eksportu  
- Nagłówek: **SUROWCE W ZASIĘGU** + **i SZCZEGÓŁY**

---

## Różnice vs stare mockupy (nie wracaj do v1)

| Zakładka | Stary mockup | Gra dziś (baseline) |
|----------|--------------|---------------------|
| Handel | szlaki Rzym→Kapua | 3 suwaki + Korupcja + Wealth W1–W6 |
| Spichlerz | magazyn 120/200 | WZROST/ARMIA slider + bufor wzrostu |
| Praca | kropki obywateli | suwak 70% budynki / 30% pula |
| Porządek | +3 jednym paskiem | SzPct + PrawPct + PorPct + band |
| Zdrowie | pop + health grid | Plusy/Minusy składniki |

---

## Checklist Design (samokontrola)

- [ ] 7 klatek prawego panelu + stopka surowce identyczna
- [ ] Medallion rail W3 (okrągłe ikony cp-*) — aktywna złota obwódka
- [ ] Wszystkie suwaki jak w HUD Kit / Grupa C (1E)
- [ ] Zero emoji Unicode
- [ ] Korupcja wizualnie odróżniona (czerwony, nie suwak — tylko %)
- [ ] Chip porządku (Spokój/Napięcie/Bunt…) — 4 warianty demo opcjonalnie
- [ ] Typografia: Georgia nagłówki, Segoe UI body — jak reszta 1E

---

## Po deliverable

Lane **UI** (Composer): diff CSS w `cityPanel.ts` / `cityUxFrame.ts` vs mockup v2 — **bez zmiany logiki**.  
Review **Opus** przed kanonem. Publikacja: **MASTER**.

**Handoff z powrotem:** `DESIGN-do-UI_w3-miasto-zakladki-v2.md` + link do .dc.html
