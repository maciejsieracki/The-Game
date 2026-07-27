# C-MURY-MODEL — obrona miasta (Mury, Cytadela, Baszta)

**Status:** 🟢 **WDROŻONA**  
**Mapowanie:** pytania numerowane **2A** + **3** (Maciej 2026-07-25)

## Decyzja

- **2A** — obrona miasta **wyłącznie procentowo**; płaskie `obrona` z JSON budynku nie jest źródłem bonusu garnizonu.
- **3** — Cytadela **+100%** dodatkowo do muru (+200%) → łącznie **300%** Obrony z Mury+Cytadela.

Parametry: `gra/data/miasto-params.json` (`bonus_obrona_mur_proc`, `bonus_obrona_cytadela_proc`, `bonus_obrona_baszta_proc`).

Logika: `gra/src/game/city-defense.ts`.

## Uwaga rejestru

REJESTR §MNOŻNIKI linia „OTWARTE: C-MURY-MODEL" była **sprzeczna** z **2A/3** — zsynchronizowano 2026-07-27.
