# Design — W3 Miasto · zakładki prawego panelu · v2 (sync z grą)

> **Hasło:** `START — W3-miasto-zakladki-v2`  
> **Priorytet:** po Grupa C (walka) — równolegle z A-08 ulepszenia mapy  
> **Baseline:** screenshoty Macieja 2026-07-03 + `gra/src/ui/cityPanel.ts` (kanon ma W3-full-lite)

---

## GDZIE SĄ PLIKI (Design — GitHub)

**Repo:** https://github.com/maciejsieracki/The-Game · branch **`main`**

**START (otwórz pierwszy):**  
https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-W3-v2-GITHUB-START.md

Tam są linki do screenshotów, dyspozycji, tokenów i HUD Kit.

**Zip (cały pakiet):**  
https://github.com/maciejsieracki/The-Game/raw/main/docs/ux/W3-miasto-design-pakiet-v2.zip

---

## Screenshoty baseline (GitHub)

**Folder:** https://github.com/maciejsieracki/The-Game/tree/main/docs/ux/referencje-w3-screenshots  
**Indeks:** https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/README.md

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

Wklej **cały blok** poniżej (linki GitHub — działają bez dostępu do dysku Macieja):

```
START — W3-miasto-zakladki-v2

Projekt na GitHubie (branch main):
https://github.com/maciejsieracki/The-Game

OTWÓRZ PO KOLEI (linki — klikaj w przeglądarce):

1) START — mapa wszystkich plików:
https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-W3-v2-GITHUB-START.md

2) Instrukcja txt:
https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/pakiet-design-W3-v2/START-DESIGN-W3-v2.txt

3) Dyspozycja (spec 7 zakładek + górny pasek B-02):
https://github.com/maciejsieracki/The-Game/blob/main/dyspozycje/_handoff/UI-do-DESIGN_w3-miasto-zakladki-v2-2026-07-03.md

4) Screenshoty z gry (baseline — folder):
https://github.com/maciejsieracki/The-Game/tree/main/docs/ux/referencje-w3-screenshots

   Zakładki prawego railu (7):
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/01-wzrost-ludnosci-spichlerz.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/02-podzial-handlu-zamoznosc.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/03-podzial-pracy.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/04-porzadek.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/05-zdrowie-miasta.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/06-kultura.png
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/07-religia.png

   GÓRNY PASEK ZASOBÓW (B-02 — osobny screenshot):
   https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/08-gorny-pasek-zasobow-B02.png

5) Styl 1E:
   tokens: .../docs/ux/pakiet-design-W3-v2/styl-1E/tokens.css
   HUD Kit: .../docs/ux/pakiet-design-W3-v2/styl-1E/HUD-Kit-1E.dc.html

Opcjonalnie — pobierz cały zip:
https://github.com/maciejsieracki/The-Game/raw/main/docs/ux/W3-miasto-design-pakiet-v2.zip

ZADANIE: mockup v2 = ten sam układ co screenshoty + styl 1E. NIE wymyślaj gameplayu.
Stare „Miasto Zakładki W3 cz1/cz2” — NIE używaj.

DELIVERABLE:
• The Game - Miasto Zakładki W3 v2 (1E).dc.html — 7 zakładek + stopka surowce
• The Game - Miasto Gorny pasek B02 v2 (1E).dc.html — LUB osobna klatka w tym samym pliku
• Górny pasek: chipy Praca / Skarbiec / Kultura / Religia / Nauka — SVG 1E, bez emoji
• Zip zwrotny · NIE TypeScript

Potwierdź start po otwarciu linku nr 1.
```

---

## Stara wklejka (tylko ścieżki repo — NIE dla designera bez dostępu)

<details>
<summary>Rozwiń — wersja techniczna (lane / repo)</summary>
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

</details>

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

## B-02 · Górny pasek zasobów miasta (`renderCivResourceTopBar`)

**Rejestr UX:** B-02 · **Screenshot:** `08-gorny-pasek-zasobow-B02.png`

**GitHub:** https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/referencje-w3-screenshots/08-gorny-pasek-zasobow-B02.png

Lane UI (Cursor) zrobił **poziomy pasek chipów** u góry panelu miasta — działa, ale **bez polishu 1E** (emoji, kolory ad hoc). Design ma narysować wersję docelową **spójną z HUD Kit 6C**.

### Co jest w grze dziś (baseline — nie zmieniaj semantyki)

| Chip | Etykieta | Wartość główna | Dopiski (split) |
|------|----------|----------------|-----------------|
| 1 | **Praca** | suma /t miasta | złoty = budynki · niebieski = ulepszenia |
| 2 | **Skarbiec** | netto 💰 /t | złoty = handel→skarb · fiolet = handel→zamożność (W) |
| 3 | **Kultura** | /t miasta | — |
| 4 | **Religia** | wierni /t | — |
| 5 | **Nauka** | /t miasta | ikona sowy (SVG w kodzie) |

- Pasek = **jeden segment** z separatorami pionowymi między chipami (jak na screenshotcie).
- Każdy chip = **przycisk** (klik → karta szczegółów B-03…B-08) — w mockupie można pokazać `:hover`.
- **Zero emoji** — ikony z `brand-book/eksport/icons/` (hammer, coin, masks, temple, science).
- Kolory delt: zielony +, czerwony −, złoty/neutral, niebieski ulepszenia, fiolet W.

### Co NIE wchodzi w ten pasek (W3)

Żywność, ludność, garnizon, porządek — w layoucie W3 są **gdzie indziej** (badge miasta, okolica). **Nie dodawaj** ich do tego paska w mockupie.

### Deliverable B-02

- Osobna klatka **1920×120** (sam pasek na ciemnym tle) **lub** sekcja w pliku zakładek v2.
- Wariant **hover** na chipie Praca (opcjonalnie).
- Spójność z `HUD-Kit-1E.dc.html` (chipy mapy).

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
- [ ] **B-02 górny pasek zasobów** (5 chipów + splity) — screenshot 08
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
