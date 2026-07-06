# MASTER → UI: Wikipedia — dopracowanie HUD (batch W-WIKI)

> **Data:** 2026-07-03 · **Sign-off Maciej:** „fajnie wygląda, fajnie działa” · **Wejście kanoniczne:** górny pasek **Wiki** obok **Menu**  
> **Status:** READY · **NIE ruszać** `main.ts` (integracja już w SILNIK) · **Design równolegle:** `_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md`

---

## Stan bazowy (nie psuć)

| Element | Plik | Uwaga |
|---------|------|--------|
| Przycisk **Wiki** | `hud.ts` (`.b-wiki`, `.hud-right`) | przed Menu · stan `.on` gdy panel otwarty |
| Panel boczny | `wikiHubHud.ts` | zakładki Poradnik / Encyklopedia · Esc · ← Lista |
| Treść | `gra/src/data/wikiBundle.json` | generowane: `node gra/tools/bundle-wiki-for-game.cjs` |
| Renderer MD | `markdownLite.ts` | bez zewn. bibliotek |
| Ikona tymczasowa | `icons/wikiBookIcon.ts` | do zastąpienia assetem Design |

**Usunięte (nie przywracać):** Wiki na lewym toolbarze (`mapToolbarHud`) · Wiki przy minimapie (`minimapHud`).

---

## Batch W-WIKI-1 — Lane UI (bez Design) · **TERAZ**

Cel: dopasować Wiki do reszty HUD 1E (W2) — Maciej zatwierdził funkcję, Lane dopracowuje **look & feel**.

### 1. Górny przycisk Wiki (`hud.ts`)

- [ ] **Wyrównaj styl do `.b-menu`:** ta sama wysokość 42px, radius 9px, font `var(--civ-font-ui)`, letter-spacing jak Menu
- [ ] **Akcent wiki** zostaje zielony (`#a8c878`), ale obramowanie/tło — gradient jak Menu (nie „obcy” zielony blok)
- [ ] Etykieta: **`Wiki`** (Maciej OK) — tooltip: *„Wikipedia — poradnik i encyklopedia”*
- [ ] Stan `.on`: spójny z aktywnym Menu/hub (delikatny glow, nie agresywny box-shadow)
- [ ] **Usuń emoji** z tytułu panelu (`wikiHubHud.ts` linia „📖 Wikipedia”) → sama ikona SVG + tekst **Wikipedia** (reguła brand: zero emoji w finalnych ekranach)

### 2. Panel boczny (`wikiHubHud.ts`)

- [ ] **Spójność z `scienceHubHud` / `diploListHud`:** ten sam `LEFT_INSET`, `TOP_H`, `BOTTOM_BAR_H`, szerokość (~340–420px — wybierz jedną i uzasadnij w meldunku)
- [ ] Ramka panelu: **złoto** jak dyplomacja (`rgba(212,175,90,…)`) + akcent wiki tylko na nagłówku/zakładkach (nie cały panel na zielono)
- [ ] Zakładki Poradnik/Encyklopedia: ten sam wzorzec co `.sh-tab` / przyciski w innych hubach
- [ ] Przyciski głębokości **Skrót / Hasło / Pełne:** mniejsze, nie przeładowują paska gdy tytuł długi (ellipsis na `.wh-dtitle`)
- [ ] **Typografia treści:** `markdownLite` output — sprawdź tabele na mobile wąskim oknie (min-width panelu 300px OK)
- [ ] Meta stopka (`.wh-meta`): kolor `--muted`, bez technicznych „Wiki-S/M” w UI gracza → **„Skrót” / „Hasło” / „Pełny artykuł”** (PL gracza)

### 3. Zachowanie

- [ ] Po otwarciu Wiki **zachowaj** zamykanie innych hubów (logika w `main.ts` — tylko weryfikuj, nie zmieniaj bez potrzeby)
- [ ] Wiki **widoczne** gdy otwarty panel miasta (górny pasek nie znika) — playtest Lane: miasto + Wiki jednocześnie
- [ ] `refreshD1bHud` / `updateHud` — przycisk `.on` odświeża się po zamknięciu panelu (już powinno działać — potwierdź)

### 4. Assety / tokeny (tylko jeśli brak Design)

- [ ] **NIE** przerysowuj SVG od zera — zostaw `wikiBookIcon.ts` do czasu `ui-wiki.svg` z Design
- [ ] Opcjonalnie: wpisz `--wiki-accent: #a8c878` w `brandTokenVars.ts` (scope HUD), użyj w `.b-wiki` i panelu

### 5. Bundle treści

- [ ] Po każdej zmianie w `docs/PORADNIK-GRACZA/` lub `docs/encyklopedia/` uruchom `node gra/tools/bundle-wiki-for-game.cjs` przed meldunkiem
- [ ] W meldunku podaj: liczba rozdz. + haseł + ~KB bundle

---

## Batch W-WIKI-2 — po dostawie Design (**CZEKA**)

Trigger: zip z `eksport/icons/ui-wiki.svg` + mockup mapy/miasta z Wiki.

- [ ] Podmień `wikiBookIcon.ts` → `brandIconSvg('ui-wiki', …)` (sync jak W1-menu)
- [ ] Dopasuj kolory panelu do mockupu 1E (tokeny z `tokens.css`)
- [ ] Ewentualna zmiana etykiety **Wiki → Pomoc** tylko po decyzji Macieja ABC

Handoff Design: `_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md`

---

## Batch W-WIKI-3 — 🔮 v2 (backlog, nie teraz)

- Tooltip `(?)` przy polach miasta / chipach HUD z Wiki-S
- Deep-link: klik w budynek na liście → hasło encyklopedii
- Wyszukiwarka globalna (nie tylko encyklopedia)

---

## Pliki lane (wyłączna edycja)

```
gra/src/ui/hud.ts
gra/src/ui/wikiHubHud.ts
gra/src/ui/markdownLite.ts
gra/src/ui/icons/wikiBookIcon.ts   (do W-WIKI-2: sync brand)
gra/src/data/wikiBundle.json       (generowany — commit po regen)
gra/tools/bundle-wiki-for-game.cjs (tylko jeśli poprawka parsera sekcji)
```

**Zakaz:** `main.ts`, `mapToolbarHud.ts` (bez Wiki), `minimapHud.ts` (bez Wiki).

---

## DoD (Lane)

1. W-WIKI-1 checklist ✅ (co zrobione — lista w meldunku)
2. `node tools/smoke.cjs` OK (z katalogu `gra/`)
3. Meldunek `UI-DO-MASTERA.md` → **`→ MASTER: master`**
4. Screenshot opisowy w meldunku: górny pasek Wiki + otwarty panel (tekst, nie plik — Maciej ogląda kanon)

---

## Referencje

| Dokument | Rola |
|----------|------|
| `docs/PORADNIK-GRACZA/README.md` | zakres treści |
| `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` § Wikipedia | sync z Design |
| `scienceHubHud.ts`, `diploListHud.ts` | wzorce panelu |
| `HUD Mapy layout (1E).dc.html` | mockup strefy góra-prawo |

*MASTER → UI · 2026-07-03 · Maciej sign-off funkcji*
