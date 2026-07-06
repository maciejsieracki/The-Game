# MASTER → Grupa A — A-START P0 (playtest Maciej 2026-06-27)

**Status:** część wdrożona w silniku (Master batch) — weryfikacja + reszta u A

## Maciej zgłosił (P0)

| ID | Problem | Batch silnik |
|----|---------|--------------|
| A-START-01 | Jednostka wojska na starcie zamiast budowy miasta | ✅ brak jednostek + auto tryb 🔨 Załóż miasto |
| A-START-02 | Kamera za wysoko | ✅ focusAt dist=22 przy starcie |
| A-START-03 | Rzeki przez mgłę | ✅ segmenty rzeki w scene.ts |
| A-START-04 | Minimap bez mgły | ✅ fog w getMinimapData + minimapHud |
| A-START-05 | Brak Załóż miasto w panelu | ✅ przycisk w buildModeHud |
| BUG-VIC | Przegrana tura 2 bez miasta | ✅ graczKiedysMialMiasto w victory.ts |
| BUG-DIP | typCywilizacji crash | ✅ guard diplomacy.ts |

## Do weryfikacji u A

- Kamera / UX onboarding polish
- Panel 🔨 layout (E1-UX osobno)
- C3 atak miasta z mapy (nadal A)

**Publish:** `Gra-podglad-ROBOCZA.html` po bramce Master
