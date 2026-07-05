# Nagłówek zlecenia — WKLEJ NA POCZĄTKU KAŻDEGO START u Designera

**Obowiązuje od:** 2026-07-05 rev.2 · **Maciej:** ten blok + treść z [WKLEJKA-DESIGN-START-TOR-A-ONLY.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-START-TOR-A-ONLY.md) (rev.4).

**Repo:** https://github.com/maciejsieracki/The-Game · gałąź `main`

---

## Blok do skopiowania (zawsze pierwszy)

```
═══════════════════════════════════════
REGUŁA NAZEWNICTWA + GITHUB — OBOWIĄZKOWA
═══════════════════════════════════════

REPO: https://github.com/maciejsieracki/The-Game  (gałąź main)
Przed pracą: git pull origin main  (albo podłącz repo w Claude Design)
Indeks haseł: szukaj w repo „TOR-A-ONLY" lub otwórz:
  https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-GITHUB-HASLA.md

ZLECENIE-ID: {wpisz z briefu, np. JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05}
DATA ZLECENIA: YYYY-MM-DD  ← dzisiaj

1) Każdy plik .dc.html — nazwa MUSI zawierać:
   · ID ekranu (C04, C05, A19, W3, C06, A21…)
   · opis zlecenia (nie generyczne „Brand Book")
   · wersję v2/v3
   · DATĘ zlecenia YYYY-MM-DD
   · sufiks (1E)

   Wzór:
   The Game - {ID} {Opis} v{N} {DATA} (1E).dc.html

   Przykład:
   The Game - C04 Atak miasto wybor v2 2026-07-04 (1E).dc.html

2) JEDEN plik ZIP do pobrania (jeśli Maciej pobiera ręcznie) — nazwa:
   {ZLECENIE-ID}_{DATA}.zip
   Przykład: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip

3) W ZIP (korzeń, bez podfolderów):
   · wszystkie .dc.html tego zlecenia
   · DESIGN-do-UI_{ZLECENIE-ID}.md  (handoff)
   · MANIFEST.txt  (szablon poniżej)

4) MANIFEST.txt — obowiązkowy:

   ZLECENIE-ID: …
   DATA: YYYY-MM-DD
   HASLO-GITHUB: …  (z briefu)
   REPO: https://github.com/maciejsieracki/The-Game

   PLIKI:
   C04 | pełna nazwa pliku | co to jest
   …

5) ZAKAZ:
   · ten sam tytuł dla wszystkich plików
   · numerowanie tylko 12, 13, 14 bez ID zlecenia
   · „Brand Book" / „The Game" bez ID ekranu
   · osobne zipy per plik (jeden zip = jedno zlecenie)

6) ODDANIE PRACY (preferowane — GitHub):
   · wrzuć pliki do docs/ux/claude-design/
   · git commit + push origin main
   · dopisz wpis w docs/ux/claude-design/WYMIANA-UI-DESIGN.md
   · workflow: https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md

Po gotowości napisz:
„Paczka {ZLECENIE-ID}_{DATA}.zip gotowa" + lista plików + link do commita (jeśli push).

NAZWA POBRANIA (Maciej — gdy zip zamiast push):
Design NIE kontroluje nazwy pliku w przeglądarce (tytuł projektu Claude Design,
np. „Ulepszenie infografik"). Przy każdej paczce Design podaje na końcu odpowiedzi
POGRUBIONĄ nazwę do wklejenia w pole „Nazwa pliku" w oknie zapisu Windows.
Przykład: JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05_2026-07-05.zip

Cursor / lane rozpoznaje paczkę po: nazwie zip + MANIFEST.txt + ZLECENIE-ID w nazwach plików.
Szukaj w repo po haśle z briefu — nie po cyfrach 12/13/14.

═══════════════════════════════════════
TREŚĆ ZLECENIA (poniżej — TOR A rev.4)
═══════════════════════════════════════
```

---

## Dla lane / Cursor

Po otrzymaniu zip lub push: pliki w `docs/ux/claude-design/` · szukaj po **ZLECENIE-ID** i **dacie w nazwie pliku** · indeks: [DESIGN-GITHUB-HASLA.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/DESIGN-GITHUB-HASLA.md).
