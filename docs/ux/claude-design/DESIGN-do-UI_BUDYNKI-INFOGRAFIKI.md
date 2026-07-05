# DESIGN → UI · Budynki infografiki 1E

**ZLECENIE-ID:** `BUDYNKI-INFOGRAFIKI-1E-2026-07-05`
**Data:** 2026-07-05 · **Autor:** Design (brand-book 1E)
**Repo:** https://github.com/maciejsieracki/The-Game

Handoff dla lane UI. Kanon: **35 dedykowanych ikon budynków @24px**, styl 1E
(kreska 1.5 · `stroke="#e8d88a"` w plikach → w grze `currentColor` · zaokrąglone
końce · viewBox 24×24 · **zero emoji**). Kończy problem „Stolarnia = Piec hutniczy".

## Co w paczce
| Plik | Opis |
|------|------|
| `eksport/icons/buildings/bld-{id}.svg` | 35 ikon SVG @24 |
| `building-icon-map.json` | mapowanie 1:1 `id budynku → bld-{id}` (bez heurystyki kategorii) |
| `The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html` | mockup: siatka 35 + 3 karty Poziom B |
| `MANIFEST.txt` | spis paczki |

## Integracja (lane UI — kroki)
1. Skopiuj `bld-*.svg` → `gra/src/ui/icons/brand/buildings/`
2. Podmień `building-icon-map.json` (id budynku z gry → `bld-{id}`)
3. Renderuj z `stroke="currentColor"` — kolor dziedziczy z kontekstu (złoto HUD / biel katalogu)
4. Rozmiary: 24px lista, 40px katalog/karta, 14–18px chipy
5. Rebuild ROBOCZA

## 35 ikon — id → nazwa → motyw
### Produkcja (10 · P0)
- `stolarnia` — Stolarnia — piła + deski
- `mielerz` — Mielerz — kopiec węgla drzewnego + dym
- `kamieniarski` — Warsztat kamieniarski — dłuto + blok
- `kuznia` — Kuźnia — kowadło + młot
- `odlewnia_brazu` — Piec hutniczy — piec z płomieniem ↗
- `odlewnia_zelaza` — Odlewnia żelaza — piec + spust żelaza *(upgrade Pieca)*
- `garncarnia` — Garncarnia — amfora
- `cegielnia` — Cegielnia — mur z cegieł
- `kuznia_zelaza` — Kuźnia żelaza — kowadło + iskry ↗
- `wielka_kuznia` — Wielka Kuźnia — wielki piec + kowadło *(upgrade Kuźni żelaza)*

### Handel (5 · P0)
- `targowisko` — Targowisko — stragan z markizą
- `port` — Port handlowy — kotwica ↗
- `port_wielki` — Port wielki — 2 żagle *(upgrade Portu)*
- `karawanseraj` — Karawanseraj — brama z arkadami
- `mennica` — Mennica — moneta + stempel

### Obrona / wojsko (5 · P0)
- `mury` — Mury — mur z blankami ↗
- `fort` — **Cytadela** — warowna wieża *(upgrade Murów)*
- `koszary` — Koszary — tarcza + włócznie ↗
- `warsztat_oblezniczy` — Warsztat oblężniczy — **katapulta** (NIE mur!)
- `akademia_wojskowa` — Akademia wojskowa — tarcza + wieniec + gwiazda *(upgrade Koszar)*

### Żywność / magazyn (2)
- `spichlerz` — Spichlerz — spichlerz + kłos
- `magazyn` — Magazyn — skrzynie

### Kultura / religia (5)
- `kamienne_kregi` — Kamienne kręgi — trylity ↗
- `swiatynia` — Świątynia — kolumny + ogień *(upgrade Kręgów)*
- `teatr` — Teatr — maski *(merge w Akademię — ikona na wypadek save)*
- `stela` — Stela / Pomnik — obelisk
- `palac` — Pałac — fasada z kopułą

### Nauka (2 · P1)
- `biblioteka` — Biblioteka — półka + zwój ↗
- `akademia` — Akademia — portyk + otwarta księga *(merge Bib+Teatr)*

### Zdrowie (4 · P2)
- `studnia` — Studnia — studnia z wiadrem
- `akwedukt` — Akwedukt — łuki + kanał
- `laznia_publiczna` — Łaźnia publiczna — kopuła + para
- `lazaret` — Lazaret — namiot + krzyż medyczny

### Administracja (2 · P2)
- `sad` — Sąd — waga sprawiedliwości + cokół
- `pretorium` — Pretorium — fasces (rózgi + topór)

## Łańcuchy upgrade (osobna ikona na stopień — preferencja Macieja)
Port→Port wielki · Mury→Cytadela(`fort`) · Biblioteka→Akademia · Koszary→Akademia
wojskowa · Kuźnia żelaza→Wielka Kuźnia · Kręgi→Świątynia · Piec hutniczy→Odlewnia żelaza.

## Uwagi
- `_default` w mapie = `bld-default` (fallback).
- `sad` i `bld-trade` oba używają wagi — `sad` ma cokół/podstawę (sprawiedliwość),
  `bld-trade` ma wiszące szale (handel). To celowe rozróżnienie.
- Wszystkie pliki mają `stroke="#e8d88a"` — przy renderze w grze zamień na
  `currentColor` (lub użyj CSS `color`), spójnie z jednostkami (JEDNOSTKI-INFOGRAFIKI).
