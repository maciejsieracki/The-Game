# R-CHATKA-VET-TOAST — toast chatki vs tip weteranów

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #71

## Problem

Po zebraniu chatki toast nagrody był natychmiast nadpisywany edukacją **„Doświadczeni wojownicy"** — regres po FALA 212 (częściowy fix w `checkVillageRewardAt`).

## Przyczyna

Drugi `refreshFog()` po marszu / animacji / scout EOT wołał `checkVeteranEnemyFirstEncounter` bez pominięcia.

## Rozwiązanie

- `refreshFog({ skipVeteranEducation: true })` gdy w tej samej klatce zebrano chatkę.
- `checkVillageRewardAt` / `rewardsAlongPath` zwracają boolean; marsz i animacja: fog refresh tylko gdy brak nagrody chatki na ścieżce.

## Pliki

`gra/src/main.ts` (`refreshFog`, `applyMarchSegmentInstant`, scout EOT)
