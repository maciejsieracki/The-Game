# Design Brief — C-06 Faza deploymentu (rozstawianie wojsk)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P0 — **następny po C-01 v2**  
**Poprzedni deliverable:** `docs/ux/claude-design/The Game - C01 Pre-bitwa v2 (1E).dc.html` ✅

---

## Cel

Zaprojektować **UI fazy rozstawiania** na polu bitwy 3D — panel + etykiety stref — w stylu **1E**, spójny z **C-01 Pre-bitwa v2** (te same tokeny, przyciski, typografia).

**Deliverable:** `docs/ux/claude-design/The Game - C06 Deployment v2 (1E).dc.html`  
(opcjonalnie kopia eksport: `UI/Makieta-bitwa-deployment-v2.html`)

---

## Kontekst w grze (nie zmieniać logiki)

1. Gracz wybrał **„Rozegraj ręcznie”** w C-01  
2. Otwiera się **pole 3D** (heksy, jednostki)  
3. **Faza deploymentu** — tylko **atakujący** ustawia swoje jednostki po **lewej** połowie mapy  
4. **Prawa połowa** = mgła wojny (wroga strefa, niedostępna)  
5. **Złota linia** na środku mapy = granica  
6. Po **Start walki** → faza walki (osobny mockup C-07)

**Playtest kodu:** `Gra-podglad.html` → **T** (test battle) lub C-01 → Bitwa ręczna  
**Dev preview:** `Gra-podglad-BITWA.html`

---

## Co musi być na mockupie (1920×1080)

### Tło (statyczne — Design)

- Widok z góry: **heksowe pole bitwy** (zielone/trawy, rzeka opcjonalnie)  
- **Lewa połowa:** lekko rozjaśniona + **niebieskie obwódki** dozwolonych heksów (strefa ATK)  
- **Prawa połowa:** przyciemniona (mgła wojny)  
- **Pionowa złota linia** na środku + cienkie akcenty kolorów stron (czerwień ATK / błękit DEF na krawędziach linii)  
- Figurki jednostek (placeholder 3D lub sylwetki SVG) — kilka po lewej, wroga po prawej za mgłą

### Etykiety górne (overlay HTML)

| Lewo | Prawo |
|------|-------|
| **TWOJA STREFA** | **STREFA WROGA** |
| Rozstaw jednostki tutaj | Mgła wojny — niedostępna |

Styl: jak napisy HUD w C-01 — uppercase, cień, bez emoji.

### Panel dolny — **centrum ekranu** (główny deliverable)

```
┌─────────────────────────────────────────────────────────┐
│  FAZA ROZSTAWIANIA — ustaw jednostki i kliknij Start    │
│  (hint: kliknij jednostkę, potem pole po lewej…)        │
│                                                         │
│  FORMACJA AUTO-USTAW:                                   │
│  [ F1 ]    [ F2 ]    [ F3 ]   ← 3 kafelki z ikoną SVG   │
│                                                         │
│  [ Reset ]  [ Grupuj ]  [ ▶ Start walki ]               │
└─────────────────────────────────────────────────────────┘
```

**Formacje (z kodu — etykiety PL):**

| Przycisk | Podpis | Opis (tooltip / hint) |
|----------|--------|------------------------|
| **F1** | Dystans-przod | Łucznicy przód / Melee środek / Konnica boki |
| **F2** | Melee-przod | Melee przód / Dystansowe tył / Konnica boki |
| **F3** | Oblężenie | Machiny przód / Łucznicy tył / Konnica rezerwa |

**Przyciski akcji:**

| Przycisk | Rola |
|----------|------|
| **Reset** | Przywraca domyślne rozstawienie |
| **Grupuj** | Scala zaznaczone jednostki (box-select ≥2) |
| **Start walki** | Primary — czerwony/złoty jak „Atakuj-auto” w C-01 |

**Uwaga:** W starym UI było emoji (🏹🗡🐎) — w v2 **tylko SVG** (jak C-01).

### Opcjonalnie na mockupie (P1 — jeśli mieści się czytelnie)

- **Cienki pasek rosteru** nad panelem (karty jednostek ATK do szybkiego wyboru) — kod ma `_buildRosterBar` na dole  
- Jeśli za ciasno — osobny stan w komentarzu Design „z rosterem”

---

## Styl wizualny (must)

- **Spójność z C-01 v2:** `--civ-gold-primary`, panel `linear-gradient(180deg,#161c28,#0a0d14)`, ramka 2px złota  
- Przycisk primary **Start walki** = ten sam język co **Atakuj — auto** (C-01)  
- Przyciski secondary = outline złoty (jak **Wycofaj** / **Rozegraj ręcznie**)  
- Kafelki formacji = ciemne tło + obrys złoty, ikona SVG 24px + podpis 9–10px  
- **Kolory stron (decyzja Macieja 2026-07-03):** Ty = `#3a6ad0`, wróg = `#c84040` — patrz `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`
- **Bez emoji** · **bez** stary brąz `#d4af37` z programistycznego panelu — tylko tokeny 1E

---

## Referencje

| Plik | Rola |
|------|------|
| `The Game - C01 Pre-bitwa v2 (1E).dc.html` | Styl przycisków i paneli |
| `Gra-podglad-BITWA.html` + **T** | Jak wygląda dziś (do baseline) |
| `archiwum/Makieta-ekran-bitwy.html` | Stary layout HUD (nie kolory) |
| `gra/src/battle/battleScene.ts` | `_buildDeployOverlay`, `_buildDeployHalfLabels`, `_buildDeployZone` |

---

## Baseline screenshot (Maciej)

Zapisz do `docs/ux/baseline/C/C-06_deployment.png` — obecny panel brązowy z gry (klawisz T).

---

## DoD Design

- [ ] Plik `.dc.html` 1920×1080 z tłem pola + panelem + etykietami stref  
- [ ] 3 formacje F1–F3 z SVG (eksport do `eksport/icons/fmt-deploy-f1.svg` itd. — opcjonalnie)  
- [ ] Spójność z C-01 (Maciej porówna obok siebie)  
- [ ] Meldunek: **„C-06 v2 gotowy”** + ścieżka

---

## Po Design

1. Maciej akceptacja  
2. Lane **UNITS/UI** portuje styl do `battleScene._buildDeployOverlay` (batch SILNIK+UI — nie w tym dokumencie)  
3. Potem mockup **C-07 pole HUD**

---

## Mapowanie nazw C-01 (info dla spójności copy)

| C-01 v2 (Design) | Stary kod preBattle |
|------------------|---------------------|
| Wycofaj | onCancel |
| Rozegraj ręcznie | onBattlefield → **C-06** |
| Atakuj — auto | onAuto |

Lane UI zsynchronizuje copy przy porcie C-01.
