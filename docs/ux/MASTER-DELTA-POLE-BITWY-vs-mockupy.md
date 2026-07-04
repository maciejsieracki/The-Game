# DELTA — kod POLE-BITWY vs mockupy Design v2/v3

**MASTER · 2026-07-04** · źródło: `battleScene.ts` + `battleHudTheme.ts` · build `manual-polish`  
**Dla:** Design v4 · lane UI · **nie** zmienia logiki  
**Maciej ✅ 2026-07-04:** Hak 1 treść OK · Hak 2 **A** (szkic OK → Design v4 1E)

### Maciej — doprecyzowanie (nie mylić z mockupem v3)

| Obszar | Werdykt |
|--------|---------|
| **Lewy panel** | Roster jednostek (karty, filtry, Grupuj) — **nie** formacje |
| **Formacje F1/F2/F3** | Dolny toolbar: Formacja · Konnica · Linie |
| **LOGI / USTAWIENIA na deploy** | **NIE** · log osobno · dźwięk = prawy rail |

---

## Layout — krytyczne różnice

| Obszar | Mockup v2/v3 | Kod (Maciej OK) |
|--------|--------------|-----------------|
| **Roster jednostek** | Dolny dock TW · poziomy scroll · C09 v2/v3 | **Lewy panel pionowy** · stała szer. · siatka **max 6 kol × 5 rzędów** · scroll w pionie |
| **Filtry typu/grupy** | Nad dolnym dockiem · chipy 1-2-3 | **W lewym panelu** (nad kartami) · Konnica/Piechota/Łucznicy/Wszystkie/Grupa n/Generał |
| **Taktyka / Strategia** | Brak w v3 · lub inne miejsce | **Dolny toolbar środek** · popupy · deploy **i** tryb RĘCZNY |
| **Formacja / Konnica / Linie** | Dolny toolbar deploy | **Tylko deploy** · ukryte w walce R (zostaje Taktyka+Strategia) |
| **Komendy (P/R/H/…)** | Dolny pasek C-09 poziomy | **Prawy pionowy rail** (SVG z `CMD_SVG`) |
| **Morale / moc** | Pionowe paski boków ekranu (v4 brief) | **Poziomy pasek mocy** (zielony/czerwony) pod top HUD · „Ostatnie starcia” |
| **Top środek** | Paski morale ATK/OBR | **VS + liczniki typów K/P/Ł** (miecz/tarcza) · bez pasków morale w top bar |
| **Minimapa** | Lewy dół (C-17) | **Obok lewego rosteru** · offset od szer. panelu |
| **Mapa pola** | Pełne pole | **~50% centrum** · złota obwódka · niebieska/czerwona linia podziału · WASD |

---

## Elementy nowe (brak w mockupach)

1. **Pasek zaznaczenia** w rosterze: „Grupa 2 · 4 zazn.” · **Odznacz** · **◆ Grupuj** · **Rozgrupuj**
2. **Feedback** tekstowy w panelu (np. „Konnica: 4” po filtrze)
3. **Chipy formacji** w lewej kolumnie toolbara (status aktywnej grupy)
4. **Emblemat cywilizacji** + miecz/tarcza w top (deploy)
5. **Tryb AUTO vs R** — roster ukryty w AUTO · pełny lewy panel po **R**
6. **SPACJA** hint (planowanie tury w R) — opcjonalny label 1E
7. **Build marker** w title rosteru (dev — designer może pominąć)

---

## Co Design v4 musi odwzorować (must)

- Tokeny 1E · Ty `#3a6ad0` · wróg `#c84040` · złoto `#e8d88a`
- **Zero emoji** — SVG `battleHudTheme.ts` / brand-book
- Pole 3D = **placeholder** (HUD-only wokół mapy)
- **Jeden skin** deploy = walka R (ten sam toolbar, inne widoczne przyciski)

---

## Pliki mockupów docelowe (paczka 1)

| Plik | Zakres |
|------|--------|
| `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` | Mapa · top · toolbar · rail · deploy |
| `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` | Lewy panel 6×5 · filtry · grupy · karta |

v3 / v2 = **archiwum** — nie edytować.

**Design spec (zatwierdzony 2026-07-04):** `DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md`
