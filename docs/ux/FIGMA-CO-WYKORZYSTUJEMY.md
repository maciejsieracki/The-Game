# Figma — co wykorzystujemy w projekcie Civ (UI)

**Kontekst:** baseline screenshoty ✅ · decyzje ABC z `Warstwa1-Design-System-podglad.html` · workflow v2  
**Nie chodzi o:** gotowe szablony reklam / social media z community — tylko o narzędzia pod **grę strategiczną z panelami 2D**.

---

## Mapa: co Figma robi dla nas

| Możliwość Figmy | Po co nam | Kto | Kiedy |
|-----------------|-----------|-----|-------|
| **Design System + Variables** | Jedna paleta kolorów, fonty, odstępy — spójność A–E | Lane UI | Krok 2 workflow |
| **Komponenty + warianty** | Przycisk normal/hover/disabled; chip; ramka panelu | Lane UI | Krok 2 |
| **Import baseline PNG** | Tło referencyjne „jak jest dziś” pod każdy ekran | Grupy A–E | Krok 3 |
| **Zestawy ikon (community / własne)** | Start pod styl A/B/C z decyzji Macieja | Lane UI | Krok 2–4 |
| **Auto Layout** | Panele skalują się bez ręcznego przesuwania pikseli | Grupy | Krok 3 |
| **Prototyp klikalny** | Menu → kreator → mapa bez uruchamiania gry | Lane UI + Maciej review | Przed wdrożeniem E |
| **Dev Mode** | Odległości, kolory hex, CSS — handoff do kodu | Lane UI | Krok 5 |
| **Eksport SVG / PNG** | Ikony do `gra/src/ui/icons/` | Lane UI | Krok 4 |
| **Pluginy tokenów** (Tokens Studio itd.) | JSON → `design-tokens.json` → CSS w grze | Lane UI | Krok 4 |
| **Komentarze w pliku** | Maciej: „tu popraw” bez czatu | Maciej | Review |
| **Branch / wersje** | Grupa B nie psuje pracy grupy A | Grupy | Równolegle |
| **FigJam (opcjonalnie)** | Flow: dyplomacja 🤝→audiencja→modal | Grupa D | Jeśli trzeba wyjaśnić UX |

---

## Co widzisz na stronie Figmy — co bierzemy, co pomijamy

Ze strony [figma.com/pl-pl](https://www.figma.com/pl-pl/) i community (UI kits, ikony, szkielety…):

| Kategoria community | Bierzemy? | Jak |
|---------------------|-----------|-----|
| **Zestawy UI (UI kits)** | ✅ inspiracja / baza | Skopiować **strukturę** (tokeny, przyciski), nie gotowy motyw 1:1 |
| **Ikony** | ✅ częściowo | Dopasować do stylu 3A/3B/3C albo narysować w tym samym stylu |
| **Szkielety (wireframes)** | ✅ na start | Szybki układ panelu miasta przed „polish” |
| **Ilustracje** | ⚠️ ostrożnie | Tylko portrety dyplomacji / tło menu — spójne z paletą |
| **Aplikacje mobilne / social / reklamy** | ❌ | Inny produkt — nie kopiujemy |
| **Prezentacje** | ❌ | — |
| **Witryny interaktywne** | ⚠️ tylko prototyp | Klikalny mockup flow, nie produkcja |

---

## Pipeline rozszerzony (Figma w środku)

```
Baseline PNG (mamy)
    ↓
Decyzje ABC Warstwa 1 (Maciej)
    ↓
┌─ FIGMA ─────────────────────────────────────┐
│ 1. Variables (kolory z decyzji 1)           │
│ 2. Komponenty (przyciski, ramki z 4–5)      │
│ 3. Ikony (z decyzji 3)                      │
│ 4. Strony A–E: ekran + baseline jako tło    │
│ 5. Prototyp: klikalne flow (menu, dyplo)   │
│ 6. Dev Mode → spec dla kodu                 │
│ 7. Export SVG + token JSON                  │
└─────────────────────────────────────────────┘
    ↓
Kod (lane UI): tokeny globalnie → panele E→A→B→D→C
    ↓
After PNG → porównanie z baseline/
```

---

## Konkretne zadania, które Figma „przygotuje za nas”

### 1. Biblioteka komponentów (raz)
- `Button/Primary`, `Secondary`, `Danger`
- `Panel/Frame`, `Panel/Header`
- `Chip/Resource`, `Chip/Event`
- `Icon/24`, `Icon/40` — 12 zasobów gry

**Efekt:** grupy składają ekrany jak z klocków — bez rozjazdu stylu.

### 2. Ramki ekranów z baseline
Każda grupa wkleja swoje PNG z `docs/ux/baseline/{A…E}/` jako warstwę **„PRZED”** (przyciemniona), nad nią warstwa **„PO”** w komponentach.

**Efekt:** widać od razu, czy redesign jest lepszy — bez zgadywania.

### 3. Prototyp do Twojego playtestu (bez gry)
Link Figmy: klikasz Menu → Nowa gra → krok 2–4 → zamknij.  
Osobny prototyp: 🤝 → lista → audiencja.

**Efekt:** akceptujesz wygląd i flow **zanim** lane UI dotknie kodu.

### 4. Dev Mode → wdrożenie
Lane UI otwiera komponent w Dev Mode: hex, padding, border-radius → przenosi do CSS w `cityPanel.ts`, `hud.ts` itd.

**Efekt:** mniej „na oko”, mniej rozjazdów między Figmą a grą.

### 5. Eksport automatyczny tokenów
Plugin (np. Variables → JSON) → jeden plik → skrypt w `gra/` nakłada `:root` CSS.

**Efekt:** zmiana złota w Figmie = jeden export, cała gra się aktualizuje.

### 6. AI w Figmie (Make / generowanie wariantów)
- Warianty nagłówka panelu miasta (3 propozycje) na bazie baseline B-01  
- Szybkie iteracje chipów HUD (decyzja 6A/B/C)

**Efekt:** szybciej niż ręczne 10 wersji w HTML — **Ty wybierasz** wariant, nie projektujesz.

---

## Czego Figma NIE zastąpi

| Element | Dlaczego |
|---------|----------|
| Mapa 3D, heksy, jednostki | Three.js w silniku — Figma tylko panele 2D na wierzchu |
| Logika gry, ekonomia | Kod TS |
| Baseline „prawda” z playtestu | Nadal `Gra-podglad.html` + skrypty PNG |
| Decyzje gameplay | Maciej ABC — Figma nie decyduje |

---

## Co od Macieja (minimum)

1. **Decyzje 1–8** z `Warstwa1-Design-System-podglad.html` (jedna linia w czacie).
2. **Dostęp do pliku Figmy** (link view lub edit) — gdy lane UI utworzy plik.
3. **Playtest prototypu** (klik w Figmie) + **playtest w grze** po każdym batchu kodu.
4. Komentarze w Figmie zamiast długich opisów na czacie (opcjonalnie).

---

## Następny krok lane UI (po decyzjach ABC)

1. Utworzyć plik „The Game — Design System v1”.
2. Wgrać baseline PNG jako warstwy referencyjne per strona A–E.
3. Zbudować Variables + komponenty wg decyzji 1–6.
4. Wysłać Maciejowi **link do prototypu** (menu + HUD) przed kodem.
5. Dyspozycja do grup: redesign swojej strony w Figmie (jedna wiadomość uniwersalna).

---

*2026-07-01 · uzupełnienie WORKFLOW-GRAFIKA-UI-v2 · odpowiedź na możliwości Figma poza UI kits*
