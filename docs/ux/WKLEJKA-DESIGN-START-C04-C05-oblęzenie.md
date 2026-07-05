# Wklejka — START C-04 + C-05 · Atak na miasto (modal mapy świata)

**Status:** 🟢 **START Design** · 2026-07-04 · brief na GitHub `main`  
**Uwaga:** to **modal na mapie świata** — **NIE** C-04/C-05 pole bitwy (tam ✅ map-v2 HUD-only)

---

## WKLEJ DO DESIGNERA (cały blok)

> **Reguła nazw (obowiązkowa):** nagłówek z `WKLEJKA-DESIGN-NAGLOWEK-ZLECENIA.md` · pliki z **ID + DATA** w nazwie · jeden zip `{ZLECENIE-ID}_{DATA}.zip`.

```
START — C04-C05-oblęzenie-mapa-v2

ZLECENIE-ID: C04-C05-A19-mapa-v2
DATA ZLECENIA: 2026-07-04

REGUŁA NAZEWNICTWA (obowiązkowa):
· Plik: The Game - {ID} {Opis} v2 {DATA} (1E).dc.html
· Zip:  C04-C05-A19-mapa-v2_{DATA}.zip + MANIFEST.txt
· NIE: ten sam tytuł · NIE: tylko cyfry 12/13/14 bez ID

START — C04-C05-oblęzenie-mapa-v2

⚠️ To NIE jest C-01 Pre-bitwa (układ TW). To wcześniejszy krok:
   wojsko przy mieście z murem → klik miasto → modal Oblężaj / Szturm.

Maciej potwierdził: ekrany w grze są STARE (emoji 🏛⛺⚡):
   · C-04 Atak na miasto (Oblężaj/Szturm)
   · A-19 Miasto zdobyte (pusty garnizon — drugi screenshot)
C-01 pre-bitwa v3 jest osobno — pojawia się DOPIERO po wyborze Szturm.

📖 Brief (czytaj w całości):
   docs/ux/DESIGN-BRIEF-C04-C05-oblęzenie-v2.md

🎮 Playtest (OBOWIĄZKOWY):
   gra-kanon/START.html → Ctrl+F5 → wojsko przy Atenach (mur) → klik miasto
   = dokładnie ten modal ze screenshota

✅ Deliverable 1 (P0):
   The Game - C04 Atak miasto wybor v2 {DATA} (1E).dc.html
   · SVG z brand-book · zero emoji
   · ornament ⚔ → SVG line · ikona miasta SVG · tagi Mur/Garnizon/Pop
   · 2 karty: Oblężaj (ciepły/brąz) · Szturm (#3a6ad0)
   · Anuluj · skróty 1/2/Esc

✅ Deliverable 2 (P1):
   The Game - C05 Panel oblezenie v2 {DATA} (1E).dc.html
   · panel prawy · mapa świata WIDOCZNA w tle
   · Kontynuuj / Szturm / Odwrót · machiny · tura

✅ Deliverable 3 (P1 — drugi screenshot Macieja):
   The Game - A19 Miasto zdobyte v2 {DATA} (1E).dc.html
   · „Miasto zdobyte" + nazwa miasta + opis + Rozumiem/Enter
   · SVG zamiast 🏛 · ten sam styl modal co C-04

📁 Kod (lane portuje później, nie Design):
   cityAttackChoice.ts · siegeMapPanel.ts · cityCaptureNotice.ts

📁 NIE mylić z:
   The Game - C04 Oblezenie v2 (1E).dc.html  ← HUD POLA bitwy (C-19), inny ekran!

📁 Referencja stylu przycisków:
   C01 Pre-bitwa v3 (1E).dc.html

⛔ HOLD (później):
   C-06 deployment · C-07 pole bitwy

Po gotowości:
   „Paczka C04-C05-A19-mapa-v2_{DATA}.zip gotowa” + lista plików
   + **pogrubiona nazwa do wklejenia przy zapisie** (Maciej — pole „Nazwa pliku")
   (zip = 3× dc.html + MANIFEST.txt + DESIGN-do-UI_…md)
```

---

## Flow — żeby się nie gubić

```
Klik miasto z murem
    → C-04 Atak na miasto  ← STARY · Design TERAZ
        → Oblężaj → C-05 panel mapy
        → Szturm  → C-01 Pre-bitwa v3 TW  ← już nowy w kanonie

Atak miasta BEZ obrońców (pusty garnizon)
    → A-19 Miasto zdobyte  ← STARY (drugi screenshot) · Design w tym samym pakiecie
```

---

## Maciej — kolejność u Designera

| Priorytet | Hasło | Ekran |
|-----------|-------|-------|
| **1** | `START — C04-C05-oblęzenie-mapa-v2` | C-04 Atak · C-05 panel · **A-19 Zdobyte** |
| **2** | `START — W3-miasto-v3-delta` | HUD miasta |
| **3** | `START — C01-v3-sync-kanon` | sign-off pre-bitwy TW (po Szturm) |
