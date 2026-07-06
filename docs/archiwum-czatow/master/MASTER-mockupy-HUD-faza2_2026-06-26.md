# MASTER — sesja mockupów HUD (faza 2 — polish)

| Data | 2026-06-26 (sesja 2) |
| Tryb | Autonomiczna praca bez Macieja |
| Zakres | Mockupy HTML + docs — **NIE** silnik |

---

## Co zrobiłem w tej sesji

1. **`UI/mockup-embed.js`** — wspólny pasek „← Mapa” dla wszystkich paneli w iframe (FS + DK).
2. **`UI/Makieta-START.html`** — launcher: pełna ścieżka Menu→HUD + linki do pojedynczych paneli.
3. **`dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md`** — handoff do MASTER (mapowanie mockup→moduł).
4. **Podpięcie embed** do: MIASTO, drzewko, armia, cuda, dyplomacja, preBattle.
5. **D1B:** `embed=dk` dla panelu armii; ESC zamyka panel [H]; overlay kultura→toggle mapy; klik poza jednostką zamyka [H].
6. **preBattle:** alert → toast; Wycofaj/Zapisz zamyka FS.
7. **MIASTO:** ✕ i 🗺 Mapa wywołują `civMockupClose()` w embed.

---

## Decyzje (wycofanie)

| ID | Decyzja | Wycofanie |
|----|---------|-----------|
| D-M9 | Wspólny **`mockup-embed.js`** zamiast duplikatów w każdym pliku | Usuń plik; przywróć lokalne paski |
| D-M10 | **`Makieta-START.html`** jako punkt wejścia playtestu | Usuń plik |
| D-M11 | Panel armii: **`?embed=dk`** + postMessage `civ-close-dk` | `openDK` bez query |
| D-M12 | Pre-bitwa: **toast** zamiast alert | Przywróć alert |
| D-M13 | Handoff MASTER **przed** sign-off Macieja | Usuń `_handoff/UI-do-MASTER_hud-D1B-mockupy.md` |

**Nadal NIE ruszano:** `gra/src/*`, `Gra-podglad.html`

---

## Pliki zmienione (sesja 2)

- `UI/mockup-embed.js` (NOWY)
- `UI/Makieta-START.html` (NOWY)
- `dyspozycje/_handoff/UI-do-MASTER_hud-D1B-mockupy.md` (NOWY)
- `UI/Makieta-HUD-D1B-preview.html`
- `UI/Gra-podglad-MIASTO.html`
- `UI/Makieta-drzewko-uklad-bez-przeciec.html`
- `UI/Makieta-panel-armii.html`
- `UI/Makieta-cuda.html`
- `UI/Makieta-dyplomacja.html`
- `UI/Makieta-preBattle.html`
- `UI/_INDEX.md`

---

## Następny krok

Maciej: `UI/Makieta-START.html` → playtest → `docs/MACIEJ-HUD-CHECKLIST-D1B.md`
