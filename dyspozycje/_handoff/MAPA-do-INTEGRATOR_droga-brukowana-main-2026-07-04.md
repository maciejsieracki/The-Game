# MAPA → INTEGRATOR: Droga brukowana — wpięcie main.ts

**Data:** 2026-07-04 · **Źródło:** T-TECH-9 A (MAPA lane GOTOWE)

## Co przesyłam

- `map/road-movement.ts` — logika bonusu ruchu (droga ÷3, bruk −bonus_ruch z JSON)
- `map/improvement-build.ts` — kwalifikacja upgrade + `collectRoadKeys` (droga + bruk)
- `types/hex.ts` — `Ulepszenie.DrogaBrukowana = 'droga_brukowana'`
- `render/improvements.ts` — model 3D bruku

## Co Odbiorca ma zrobić (main.ts + UI shell)

1. **buildImprovement handler:** mapowanie klucza `droga_brukowana` → `Ulepszenie.DrogaBrukowana`; przy upgrade **zastąp** `droga` na hexie (nie warstwa).
2. **Emoji/galeria budowy:** dodać `droga_brukowana` obok `droga` (buildModeHud, improvepreview FLAT_OVERLAY).
3. **roadKeys state:** po postawieniu bruku hex nadal w sieci dróg (`collectRoadKeys` już obsługuje).

## DoD

- [ ] Budowa bruku na hexie z Drogi w grze (nie tylko test)
- [ ] Ruch jednostek szybszy na bruku vs zwykły teren
- [ ] bramka: map-road-movement 16/16 + smoke

## Flaga

**GOTOWE** (logika MAPA) — **CZEKA** wpięcie F
