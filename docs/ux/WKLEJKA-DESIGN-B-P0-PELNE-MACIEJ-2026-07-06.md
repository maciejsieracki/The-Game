# WKLEJKA — Design P0 B1–B5 (pełne zlecenia · Maciej → Claude Design)

**Data:** 2026-07-06 · **Gotowe:** lane UI  
**Pełna spec (repo):** `docs/ux/DESIGN-ZLECENIE-B-P0-PELNE-2026-07-06.md`

---

## Co zrobić przed wklejeniem (Maciej — 5 min)

Jeśli masz screenshoty z playtestu ~23:05 — **dołącz do czatu Design** jako obrazki.  
Jeśli nie — Design czyta **GAP HTML** (otwórz lokalnie w Chrome) i robi screenshot sam wg instrukcji w spec.

| Temat | GAP (otwórz w przeglądarce) |
|-------|----------------------------|
| B1 A-08 | `docs/ux/export/A08-BUILD-PANEL-GAP-DLA-DESIGN.html` |
| B2 HEX | `docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html` |
| B3 Moc | `docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html` |
| B4+B5 Bitwa | `docs/ux/export/C-POLE-BITWY-GAP-DLA-DESIGN.html` |

---

## Skopiuj cały blok poniżej do czatu Design

```
START — PACZKA B-P0 · 5 pełnych zleceń (2026-07-06)

Nie rób „domu bez planu". Każde zlecenie ma: PRZED (screenshot) · PROBLEM · PO (referencja 1E) · inwentarz elementów · stany · deliverable · playtest PO.

Repo (read-only): https://github.com/maciejsieracki/The-Game (main)
MASTER SPEC: docs/ux/DESIGN-ZLECENIE-B-P0-PELNE-2026-07-06.md

REGUŁY:
  · ZERO emoji · styl 1E · tokeny HUD mapy + miasto W4
  · Każdy ekran = .dc.html @1920 + DESIGN-do-UI + MANIFEST
  · git push brand-book/ + docs/ux/claude-design/ + wpis WYMIANA

══════════════════════════════════════════════════════════════
B1 · A-08 — Tryb budowy ulepszeń (panel prawy mapy)
══════════════════════════════════════════════════════════════

CEL: Gracz w trybie Budowa widzi panel 1E — SVG imp-*, scroll, tech-lock czytelny (Posterunek!).

PRZED (zrób screenshot):
  gra-robocza/START.html → toolbar Budowa → panel prawy 240px
  GAP: docs/ux/export/A08-BUILD-PANEL-GAP-DLA-DESIGN.html
  PROBLEM: layout brązowy · Posterunek tekst overlap · banner emoji · brak 6–8 ikon

PO (styl):
  The Game - HUD Mapy layout (1E).dc.html
  Miasto Zakładki W4 v2 (1E).dc.html

INWENTARZ (MUST w mockupie):
  · Banner góra: TRYB BUDOWY + ✕ Wyjdź
  · Sekcja Miasto: Załóż miasto (aktywny/locked/selected)
  · Sekcja Ulepszenia: 15 wierszy [imp 24px] Nazwa · E1 · koszt P
    stany: default · hover · selected · locked(🔒+tech 2 linie) · disabled
  · Sekcja Cuda: osobny styl złoty

STANY mockup: (1) Farma selected (2) Posterunek locked (3) scroll + Cuda na dole

DELIVERABLE:
  · 6–8 nowych SVG imp-* (owce, lama, glinianka, obóz, tarasy, sól…) + 40px
  · improvement-icon-map.json
  · The Game - A08 Tryb budowy ulepszen (1E).dc.html
  ZIP: A08-ulepszenia-2026-07-06.zip
  Spec: docs/ux/DESIGN-BRIEF-A08-ulepszenia-ikony-i-panel.md

══════════════════════════════════════════════════════════════
B2 · HEX-C1 — Panel kontekstu heksu (D17=A)
══════════════════════════════════════════════════════════════

CEL: Klik heksu → karta nad Wydarzeniami — plony SVG, ulepszenia z imp-*, bez emoji.

PRZED:
  Screenshot Macieja 2026-07-05 · Równina · PLONY litery/emoji · MOŻLIWE plain text
  GAP: docs/ux/export/HEX-CONTEXT-PANEL-GAP-DLA-DESIGN.html
  Playtest: klik pusty heks (nie miasto/jednostka)

PO: ten sam HUD · ikony ulepszeń = paczka B1 imp-*

INWENTARZ sekcji (kolejność MUST):
  POLE MAPY — KLIKNIĘTY HEKS
  · Typ terenu + heks (x,y)
  · Surowce: Bydło · Rzeka …
  · Ulepszenie postawione / goły teren
  · PLONY — ROZBICIE: wiersze [SVG] Nazwa · wartość · (składniki)
  · Razem: suma z ikonami SVG (nie emoji)
  · MOŻLIWE ULEPSZENIA: [imp] nazwa → bonus · scroll lub collapse

STANY (4): goły+rzeka · ulepszenie · złoże · + miasto

DELIVERABLE:
  The Game - A04 Panel heks kontekst v1 (1E).dc.html
  ZIP: HEX-CONTEXT-PANEL-2026-07-06.zip
  Spec: docs/ux/DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md

══════════════════════════════════════════════════════════════
B3 · IMP-01 — Panel Moc + raporty 6C (D16 = opcja A slide-in)
══════════════════════════════════════════════════════════════

CEL: Klik Moc lub chip Skarbiec/Praca/Nauka… → jeden panel 1E z prawej (420px).

PRZED:
  Klik Moc → stary modal centrum (powerOverlayHud)
  Klik Skarbiec → brzydki slide-in (empireDetailPanel — dane OK)
  GAP: docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html

PO: HUD Mapy layout 6C · slide-in · NIE modal centrum

INWENTARZ Moc (9 wierszy — NIE wymyślaj):
  Armia×25, Wygrane×1, Ludki×5, Rekruci×5, Miasta×50,
  Terytorium×0.5, Budynki×5, Tech×20, Ulepszenia×5
  + kolumny: Ilość · ×wsp · =pkt · % · pasek
  + Ranking cywilizacji + Respekt

Raport zasobu (każdy chip): suma imperium + tabela per miasto
  Skarbiec · Praca · Nauka · Kultura · Ludność · Rekruci (pasek puli)

STANY mockup (4): Moc · Skarbiec · Praca · Rekruci

DELIVERABLE:
  The Game - Panel Moc imperium v1 2026-07-06 (1E).dc.html
  ZIP: IMP-01-MOC-2026-07-06.zip
  Spec: docs/ux/DESIGN-ZLECENIE-IMP-01-MOC-2026-07-06.md

══════════════════════════════════════════════════════════════
B4 · C23 — Szczegóły bitwy
══════════════════════════════════════════════════════════════

CEL: Pełnoekranowy overlay 1E — 2 kolumny ATK/OBR, sekcje strat.

PRZED:
  Gra-ROBOCZA-POLE-BITWY.html → koniec → Szczegóły → screenshot provizorki
  GAP: C-POLE-BITWY-GAP-DLA-DESIGN.html § GAP-01

PO: styl C12 v2 (winieta, ◆, Georgia) — NIE mały modal 5C

POLA (MUST — z kodu):
  Zniszczone (#ff7b7b) · Zrootowane (#ffd54a) · Ocalałe (#7ad0a0)
  × 2 kolumny · przykładowe Horseman×7 · Phalanx×60…
  Przyciski: ← Wróć do podsumowania · Rozegraj ponownie (opcj.)

DELIVERABLE:
  The Game - C23 Szczegoly bitwy v1 2026-07-06 (1E).dc.html

══════════════════════════════════════════════════════════════
B5 · C12 — Koniec bitwy v3
══════════════════════════════════════════════════════════════

CEL: 3 stany w 1 pliku — Zwycięstwo · Porażka · hint replay.

PRZED: C12 v2 w repo · lane ma provizorkę v2
GAP: C-POLE-BITWY-GAP § GAP-02

INWENTARZ:
  · Tytuł 82px + ornament ◆ · karty stat 230px · bohater
  · 3 przyciski: Rozegraj ponownie (primary) · Szczegóły · Powrót do mapy
  · Hint: „Ta sama armia · pełne HP · wynik na mapę dopiero po Powrocie"
  · Porażka: czerwony tytuł subtelny · te same przyciski

DELIVERABLE:
  The Game - C12 Koniec bitwy v3 2026-07-06 (1E).dc.html
  Przycisk Szczegóły → link do C23 (B4)

══════════════════════════════════════════════════════════════
ODDANIE
══════════════════════════════════════════════════════════════

Opcja A — jeden ZIP: DESIGN-B-P0-2026-07-06.zip (5 mockupów + SVG B1 + JSON)
Opcja B — 5 ZIP tematycznych (OK)

Zawsze:
  · DESIGN-do-UI_B-P0-2026-07-06.md
  · MANIFEST.txt
  · git push + WYMIANA wpis

Po gotowości napisz:
  „Paczka B-P0 gotowa — A-08, HEX, Moc, C23, C12v3"
  + lista plików

Lane UI portuje w 24h po ZIP · Master publish robocza.
```

---

## Po wysłaniu Design

Lane czeka na ZIP → port do `gra/src/` → meldunek Master → publish.

**Stara wklejka (skrót):** `WKLEJKA-DESIGN-PELNA-LISTA-B-2026-07-05.md` — **zastąpiona** tą wersją.
