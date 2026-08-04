# R-ICON-ZROWNOWAZONE — ikona fokusu zrównoważonego budowania

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #72

## Problem

Chip **Zrównoważone** w panelu miasta używał tej samej ikony co **Prawo** (`cp-order` — waga/sąd) — mylące wizualnie.

## Rozwiązanie

Nowy glyph **`field-balanced`** (strzałki ↕ + belka) w `icons-manifest.json`. Mapowanie w `cityPanel.ts`: `zrownowazone` → `field-balanced`; `prawo` / porządek → `cp-order` bez zmian.

## Pliki

`gra/src/ui/icons/brand/icons-manifest.json` · `gra/src/ui/cityPanel.ts`
