# UI → Design: W3 miasto v3 · HUD (delta kanon)

**Flaga:** **START Design** · hasło `START — W3-miasto-v3-delta`  
**Data:** 2026-07-03  
**Priorytet:** P0 · **tylko HUD miasta** (osobno od C-06 bitwa)

---

## Co przesyłam

| Materiał | Ścieżka |
|----------|---------|
| Brief | `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md` |
| Delta UX | `dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md` |
| Audyt sync | `dyspozycje/_handoff/AUDYT-SYNC-MIASTO-BITWA-2026-07-03.md` |
| Playtest | `gra-kanon/START.html` · md5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`** |
| Screenshoty (opc.) | `docs/ux/referencje-miasto-kanon-2026-07-03/` |
| Referencja polish paneli | `The Game - Miasto Zakładki W4 v2 (1E).dc.html` |

---

## Co Designer ma zrobić

1. **Playtest kanonu** (Ctrl+F5) — miasto end-to-end (patrz brief § „Jak zobaczyć”)
2. **Nowy plik:** `The Game - Ekran Miasto W3 v3 (1E).dc.html` — min. 4 klatki (panel budowa · spichlerz · mapa chrome · Esc)
3. **Layout 2+7 rail** · mapa 3D widoczna · B-27 Mapa/Wróć/Esc · B-28 okolica toolbar
4. **NIE edytuj** starych mockupów W3-1E / 9 rail
5. Handoff zwrotny: `DESIGN-do-UI_miasto-w3-v3.md`

---

## Co Designer NIE robi

- TypeScript / `cityPanel.ts`
- Bitwa C-06 (osobny START)
- Zmiana logiki gry (tylko mockup wizualny)

---

## DoD (MASTER sprawdza)

- [x] v3 odzwierciedla **kanon** (chrome · Spichlerz · stopka surowców · `/t` jak w grze)
- [ ] Wszystkie punkty brief § „MUSI być w v3” — **brak 6 prawych paneli** → v3.1
- [x] W4 polish w Spichlerz (ikony surowców · pigułki)
- [x] Meldunek `DESIGN-do-UI_miasto-w3-v3.md` (Designer APPROVE)

**Po OK Macieja:** Lane UI ewentualny CSS polish · **bez** zmiany logiki · **bez** kanonu do czasu osobnej promocji

---

## Status

**PARTIAL (review Maciej 2026-07-03)** — Spichlerz + chrome OK; brak 6 prawych paneli; klatka Esc do poprawy (patrz § Review).

---

## Review Maciej 2026-07-03 (delta do v3.1)

### 1. Stopka „Surowce w zasięgu” — **OK treść · ZŁY układ w mockupie v3**

**Kanon (`cityPanel.ts`):** stopka to **`civ-v-right-foot`** (`#cs-surowce-foot`) — **osobny blok na samym dole prawej kolumny**, **poza** treścią aktywnej zakładki. Widoczna przy **każdym** medalionie prawego railu (Spichlerz, Handel, Praca…).

```
┌─ prawa kolumna ─────────────────┐
│  [7 medalionów rail]            │
│  ┌─ treść zakładki (scroll) ─┐ │
│  │ Spichlerz LUB Handel LUB…  │ │  ← tylko to się zmienia
│  └────────────────────────────┘ │
│  ─── border-top ─────────────── │
│  Surowce w zasięgu · i szczegóły│  ← ZAWSZE na dole, osobno
└─────────────────────────────────┘
```

**NIE mieszać z:**
- panelem **Spichlerz / Wzrost** (suwak Wzrost↔Armia, chipy `/t`)
- panelem **Handel** (`renderHandelSlidersPanel` — podział handlu, suwaki zamożności)

**Błąd v3:** Designer wstawił surowce **wewnątrz** karty Spichlerz (stopka tego samego `border-radius` panelu) — wygląda jak część wzrostu/handlu.

**Poprawka v3.1:** osobna klatka lub warstwa **`civ-v-right-foot`** pod panelem; w klatce **Handel** pokaż: góra = podział handlu · dół = ta sama stopka surowców (identyczna we wszystkich 7 zakładkach).

### 2. Esc vs Menu gry — **dwa różne flow w grze**

| Akcja | Co robi kanon | Co narysował Designer (K4) |
|-------|----------------|----------------------------|
| **Esc** (panel miasta) | Zamyka panel → **mapa świata** (bez pauzy) | Overlay „Pauza” z 5 przyciskami |
| **Przycisk Menu** (toolbar HUD mapy) | `gamePauseMenu.ts`: Wróć do gry · Zapisz · Wczytaj · Nowa gra · Menu główne | — (brak osobnej klatki) |
| **Wiki** (toolbar HUD) | Osobny przycisk — Poradnik + Encyklopedia | Wstawione **do** menu pauzy (w kanonie **nie ma** Wiki w pauzie) |
| **Ustawienia** | Menu główne (`mainMenu.ts`), nie pauza | Wstawione do pauzy (w kanonie **nie ma** w pauzie) |

**Brief K4** prosił: stan **po Esc** = HUD mapy świata (skrót), **nie** modal pauzy.

**Maciej:** oczekuje też widoczności **pełnego menu gry** (zapis, wczytanie, poznawanie/Wiki itd.) — nie tylko „Wyjście do menu”.

### 3. Poprawka dla Designera (v3.1)

| Klatka | Treść |
|--------|--------|
| **K4** | **Esc z miasta** → panel znika · mapa świata · hint „Esc — zamknij” · przycisk **Menu** w toolbarze widoczny |
| **K5 (nowa)** | **Menu gry** (klik ☰ Menu na mapie) — **1:1 z `gamePauseMenu.ts`**: Wróć do gry · 💾 Zapisz · 📂 Wczytaj · 🔄 Nowa gra · ☰ Menu główne |
| **K3 chrome** | Pokaż toolbar z **Menu** + **Wiki** (Wiki = poznawanie gry, osobno od pauzy) |

Nadal brakuje **6 klatek prawych** (Handel · Praca · Porządek · Zdrowie · Kultura · Religia).

### 4. ⚠️ Prawe panele — **playtest, NIE kopia W4 v2**

MASTER mógł zmieniać treść/layout paneli po W4 v2 (chipy, breakdowny, „i szczegóły”, suwaki handlu, alerty buntu itd.).  
**W4 v2 = tylko styl 1E** (tokeny, medaliony, kolory). **Treść i układ = wyłącznie z playtestu kanonu.**

**Obowiązkowy playtest** (`gra-kanon/START.html` · Ctrl+F5 · klik miasto → kolejno medaliony **prawego railu**):

| # | Medalion | Tytuł w grze | Co odwzorować (sprawdź w grze) |
|---|----------|--------------|--------------------------------|
| 1 | Spichlerz | Spichlerz | ✅ już w v3 |
| 2 | Handel | Podział handlu i zamożność | chipy Handel/Pieniądz/Nauka/Kultura · suwaki podziału · „i szczegóły” |
| 3 | Praca | Podział pracy — budynki i ulepszenia | lista pól pracy / budynki / ulepszenia (jak w kanonie dziś) |
| 4 | Porządek | Społeczeństwo i porządek | chipy Stan/Efekt/Garnizon · breakdown Szczęście + Prawo + pasek Porządek |
| 5 | Zdrowie | Zdrowie miasta | linie zdrowia / epidemie (jak w kanonie) |
| 6 | Kultura | Kultura — granice i progi | progi granic · przyrost · źródła |
| 7 | Religia | Religia — wiara i szerzenie | wiara · presja · sąsiedzi |

**Źródło kodu (podgląd struktury):** `gra-kanon/src/ui/cityPanel.ts` — `CITY_PANEL_ICONS_RIGHT` + `renderHandelSlidersPanel`, `renderSpoleczenstwo`, `renderZdrowie`, `renderKultura`, `renderReligia`.

**Zasada v3.1:** każda klatka = **stan z playtestu HTML** + szata Spichlerz v3 · **zero** przenoszenia bloków z W4 v2 bez weryfikacji w grze.
