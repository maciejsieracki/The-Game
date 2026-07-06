# Playtest miasta — instrukcja dla Macieja

**Cel:** jedna mapa, jedno miasto, pełny panel ekonomii — bez AI i bez walki.

## Jak uruchomić

1. **Najszybciej:** dwuklik `Gra-podglad-PLAYTEST-MIASTO.html` (w katalogu głównym projektu).
2. **Alternatywa:** menu główne silnika → **Playtest miasta (ekonomia)**.
3. **URL:** `Gra-podglad.html?playtest=miasto` (po buildzie kanonu).

## Co jest na starcie

| Element | Wartość |
|---------|---------|
| Miasto | **Testpolis**, pop **9** (zasięg okolicy **9** heksów) |
| Skarbiec | 5000 |
| Nauka | 200 |
| Tech | Epoka Kamień + Brąz |
| Kolejka | Stolarnia (8/20) — **tylko budynki** w kolejce Pracy |
| Rekrutacja | Sekcja **„Kup jednostkę”** (Koszary już wybudowane → Hastati dostępny za złoto) |
| Mapa | Różne tereny w okolicy (łąka, równina, wzgórza, wybrzeże, pustynia, farma, las) |
| Jednostki / AI | Brak — tylko Ty |

Panel miasta otwiera się automatycznie; kamera jest ustawiona na Testpolis.

## Checklist testów

### Panel miasta
- [ ] Suwaki **Handel** (Nauka / Pieniądz / Luksus) — zmiana i odświeżenie podglądu
- [ ] Suwaki **Praca** (Budynki vs inne)
- [ ] **Kolejka produkcji** — dodaj budynek, dodaj jednostkę, **Wykup** (rush)
- [ ] **Auto-zarządca** ⚙ ON/OFF

### Okolica (pop 9 = 9 pól pracy)
- [ ] Profile: Żywność / Produkcja / Podatki / Zrównoważone
- [ ] **Klik heks** = +👤 · **PPM** = −👤 (tryb ręczny)
- [ ] Podgląd plonów na różnych terenach

### Produkcja vs rekrutacja
- [ ] **Budynki:** sekcja „Dostępne do budowy” → **Buduj** (kolejka Pracy)
- [ ] **Jednostki:** sekcja **„Kup jednostkę (za Pieniądz)”** — nie przez kolejkę Pracy (decyzja 2026-06-25)

### Mapa
- [ ] **🔨 Tryb budowy** — ulepszenie na heksie w zasięgu miasta
- [ ] Klik miasta ponownie — panel się odświeża

### Ekonomia (tura)
- [ ] **N** lub przycisk **Koniec tury** — tick produkcji, żywność, skarbiec
- [ ] Split imperium / wojsko (jeśli widoczny w HUD)

## Wskazówki

- Seed mapy: **271828** (powtarzalny układ).
- Brak przeciwników — tura kończy się od razu (brak AI).
- Jeśli panel się nie otworzy: kliknij heks miasta **Testpolis** na mapie.

## Dla developera

- Moduł: `gra/src/game/playtestMiastoEkonomia.ts`
- Start: `doStartPlaytestMiastoEkonomia()` w `main.ts`
- Build: `cd gra && npx vite build --outDir $env:TEMP\civ-dist` → skopiuj `index.html` → `Gra-podglad-PLAYTEST-MIASTO.html`
