# ZLECENIE Design — IMP-01 Panel Moc imperium + raporty 6C

**Od:** Lane UI / Maciej  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-06  
**ZLECENIE-ID:** `IMP-01-MOC-2026-07-06`  
**Priorytet:** P0  
**Decyzja Macieja D16:** **opcja A** — slide-in z prawej (420px), wszystkie chipy + Moc w jednym panelu

**Review GAP:** `docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html`

---

## 1. Cel (1 zdanie)

Gracz klika **Moc** lub chip zasobu na górnym pasku mapy i widzi **jeden panel 1E** z czytelnymi tabelami imperium — bez modala na środku ekranu.

---

## 2. PRZED (stan gry)

| Trigger | Plik kodu | Problem wizualny |
|---------|-----------|------------------|
| Klik **Moc** (centrum HUD) | `powerOverlayHud.ts` | Stary modal centrum · pre-design-system |
| Klik chip **Skarbiec / Praca / Nauka / Kultura / Ludność / Rekruci** | `empireDetailPanel.ts` | Slide-in istnieje, ale szata lane · emoji · słaba hierarchia |
| Klik chip **Kultura** (szczegóły) | j.w. | Tabela miast bez spójności z HUD 1E |

**Playtest PRZED:** `gra-kanon/Gra-podglad.html` → 5–10 tur → klik Moc → klik każdy chip 6C → **zrób screenshot**.

---

## 3. PROBLEM (lista)

1. **Dwa różne UI** dla tego samego typu informacji (modal vs slide-in).
2. **Brak mockupu 1E** — Designer nie miał docelowego wyglądu.
3. **Moc:** 9 składników jest w silniku, ale **prezentacja** nieczytelna (brak % pasków, ranking słabo widoczny).
4. **Raporty per miasto** — logika OK, **tabela** wygląda jak debug panel.
5. **Zero emoji** — wymagane SVG z brand-book (`res-treasury`, `res-work`, `res-science`, `res-culture`, `res-population`, chip rekruci).
6. **Respekt** (dyplomacja) — ma być widoczny w sekcji Moc, nie schowany.

---

## 4. PO — docelowy wygląd

**Format:** slide-in **z prawej**, szer. **420px** (max 94vw), jak w kodzie `empireDetailPanel.ts` ale **wizualnie** jak HUD mapy 1E.

**Tokeny:** `--civ-gold-primary` `#e8d88a` · tło gradient `#161c28 → #0a0d14` · ramka lewa 2px złota · Georgia nagłówki · Segoe UI body.

**Referencje mockupów (PO — styl, nie kopiuj layoutu 1:1):**
- `The Game - HUD Mapy layout (1E).dc.html` — górny pasek 6C, medaliony
- `Miasto Zakładki W4 v2 (1E).dc.html` — tabele, chipy, spacing

---

## 5. Inwentarz elementów

### 5.1 Nagłówek panelu (stały)

| Element | Zachowanie |
|---------|------------|
| Emoji cywilizacji / herb | Stały · lewa |
| Nazwa cywilizacji | Georgia 17px złoto |
| Podtytuł | „Tura N · Epoka …" |
| Przycisk ✕ | Zamyka panel · bez modala centrum |

### 5.2 Sekcja **MOC** (scroll do niej po kliku centrum HUD)

**⚠ Korekta mockupu Design v1 2025-07-05:** model **6 filarów** (Wojsko/Gospodarka/…) **nie istnieje**. Tylko **tabela 9 składników** poniżej. **Trend ▲/▼ = usuń** (brak w silniku v1.0). Szczegóły: `ODPOWIEDZ-DESIGN-IMP-01-MOC-2026-07-06.md`.

| Element | Treść MUST |
|---------|------------|
| Suma | **Moc {N}** · duży numer złoty · `round(Σ składników)` |
| Tabela 9 wierszy | Kolumny: **Składnik · Ilość · × wsp. · = pkt · % · pasek** |
| 9 składników | Armia(×25) · Wygrane bitwy(×1) · Ludki(×5) · Rekruci ekw.(×5) · Miasta(×50) · Terytorium(×0.5) · Budynki(×5) · Tech(×20) · Ulepszenia(×5) |
| Pasek % | Udział w sumie Mocy · gradient złoty |
| Ranking | Wszystkie cywilizacje · `#rank Nazwa — Moc N` · gracz **▸** |
| Respekt | Wobec znanego AI · `100×self/(self+partner)` |

### 5.3 Sekcje **raportów zasobów** (osobne widoki lub scroll)

Po kliku chipa — panel **scrolluje** do sekcji (nie nowy modal):

| Sekcja | Ikona SVG | MUST |
|--------|-----------|------|
| Skarbiec | `res-treasury` | Suma · /t · tabela: Miasto · Skarb · Zmiana |
| Praca | `res-work` | j.w. |
| Nauka | `res-science` | j.w. |
| Kultura | `res-culture` | j.w. + opcjonalnie wpływ granic |
| Ludność | `res-population` | j.w. |
| Rekruci | chip manpower | Suma · pasek puli · „Można werbować X jedn." · tabela miast |

**Footnote Skarbiec (copy):** krótka linia o utrzymaniu / wpływie na turę — Design proponuje ton 1E.

---

## 6. Stany mockupu (min. 4 klatki w 1 pliku .dc.html)

1. **Moc** — pełna tabela + ranking + Respekt  
2. **Skarbiec** — 3+ miasta w tabeli · suma u góry  
3. **Praca** — inna tabela (te same kolumny, inne liczby)  
4. **Rekruci** — pasek puli + tabela (stan „mało rekrutów" opcjonalnie)

Opcjonalnie **5:** panel zamknięty (tylko HUD) — pokazuje skąd się otwiera.

---

## 7. Deliverables

| # | Plik | Opis |
|---|------|------|
| 1 | `The Game - Panel Moc imperium v2 2026-07-06 (1E).dc.html` | Korekta v1 · min. 4 sekcje @1920 |
| 2 | `DESIGN-do-UI_IMP-01-MOC-2026-07-06.md` | Mapowanie region → `empireDetailPanel.ts` |
| 3 | `MANIFEST.txt` | Lista plików |
| 4 | ZIP | `IMP-01-MOC-2026-07-06.zip` |

**Po stronie lane:** port CSS/HTML → wycofanie wizualne `powerOverlayHud.ts` po akceptacji Macieja.

---

## 8. Playtest PO (weryfikacja)

1. Master publish roboczej  
2. `gra-robocza/START.html` → klik Moc → wygląd = mockup  
3. Klik Skarbiec → ta sama ramka panelu · inna sekcja  

---

## 9. DoD checklist

- [ ] Zero emoji · SVG brand tier1  
- [ ] 9 wierszy Mocy z paskami %  
- [ ] Ranking + Respekt czytelne na 1080p  
- [ ] Tabela Skarbiec min. 3 miasta  
- [ ] Slide-in z prawej · **nie** modal centrum  
- [ ] `DESIGN-do-UI` + MANIFEST + ZIP  

**Po gotowości:** „Paczka IMP-01-MOC-2026-07-06 gotowa"
