# Nagłówek zlecenia — WKLEJ NA POCZĄTKU KAŻDEGO START u Designera

**Obowiązuje od:** 2026-07-04 · **Maciej:** ten blok + treść zlecenia z konkretnej wklejki (C04, W3, …).

---

## Blok do skopiowania (zawsze pierwszy)

```
═══════════════════════════════════════
REGUŁA NAZEWNICTWA — OBOWIĄZKOWA
═══════════════════════════════════════

ZLECENIE-ID: {wpisz z briefu, np. C04-C05-A19-mapa-v2}
DATA ZLECENIA: YYYY-MM-DD  ← dzisiaj

1) Każdy plik .dc.html — nazwa MUSI zawierać:
   · ID ekranu (C04, C05, A19, W3, C06…)
   · opis zlecenia (nie generyczne „Brand Book”)
   · wersję v2/v3
   · DATĘ zlecenia YYYY-MM-DD
   · sufiks (1E)

   Wzór:
   The Game - {ID} {Opis} v{N} {DATA} (1E).dc.html

   Przykład:
   The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html

2) JEDEN plik ZIP do pobrania — nazwa:
   {ZLECENIE-ID}_{DATA}.zip
   Przykład: C04-C05-A19-mapa-v2_2026-07-04.zip

3) W ZIP (korzeń, bez podfolderów):
   · wszystkie .dc.html tego zlecenia
   · DESIGN-do-UI_{ZLECENIE-ID}.md  (handoff)
   · MANIFEST.txt  (szablon poniżej)

4) MANIFEST.txt — obowiązkowy:

   ZLECENIE-ID: …
   DATA: YYYY-MM-DD
   HASLO-GITHUB: …  (jeśli jest)

   PLIKI:
   C04 | pełna nazwa pliku | co to jest
   …

5) ZAKAZ:
   · ten sam tytuł dla wszystkich plików
   · numerowanie tylko 12, 13, 14 bez ID zlecenia
   · „Brand Book” / „The Game” bez ID ekranu
   · osobne zipy per plik (jeden zip = jedno zlecenie)

Po gotowości napisz:
„Paczka {ZLECENIE-ID}_{DATA}.zip gotowa” + lista plików.

NAZWA POBRANIA (Maciej — obowiązkowe):
Design NIE kontroluje nazwy pliku w przeglądarce (tytuł projektu Claude Design,
np. „Ulepszenie infografik"). Przy każdej paczce Design podaje na końcu odpowiedzi
POGRUBIONĄ nazwę do wklejenia w pole „Nazwa pliku" w oknie zapisu Windows.
Przykład: C04-C05-A19-mapa-v2_2026-07-04.zip

Cursor rozpoznaje paczkę po: nazwie zip + MANIFEST.txt + prefiksach C04/C05/A19 w plikach.

═══════════════════════════════════════
TREŚĆ ZLECENIA (poniżej)
═══════════════════════════════════════
```

---

## Dla lane / Cursor

Po otrzymaniu zip: rozpakuj do `docs/ux/claude-design/` · szukaj po **ZLECENIE-ID** i **dacie w nazwie pliku** · nie po cyfrach 12/13/14.
