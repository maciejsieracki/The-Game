# F → MASTER: batch W-WIKI (W-WIKI-1 + W-WIKI-2)

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-03 |
| **Batch** | `W-WIKI` (UI lane · bez `main.ts`) |
| **Handoff źródłowy** | `UI-DO-MASTERA.md` § W-WIKI-1 · W-WIKI-2 |
| **Poprzedni ROBOCZA** | `fd7c10bd96b3a249422bc280441dbac8` (szac. kanon W2 batch 2) |

---

## Scope (UI only — NIE `main.ts`)

| # | Element | Pliki |
|---|---------|--------|
| 1 | W-WIKI-1 polish | `hud.ts`, `wikiHubHud.ts`, `markdownLite.ts`, `brandTokenVars.ts`, `wikiBundle.json` |
| 2 | W-WIKI-2 ikona Design | `wikiBookIcon.ts`, `icons/brand/tier5/ui-wiki-*.svg`, `icons-manifest.json` |
| 3 | Fix kreator | `newGameFlow.ts` — `civMinStartEpochIndex()` (min z `epokiStartowe`) |

**NIE ruszano:** `main.ts`, `mapToolbarHud.ts`, `minimapHud.ts`

---

## Bramka (2026-07-03)

| Test | Wynik |
|------|-------|
| wire-ekonomia | **34/34** |
| logic-test | **203/203** |
| combat-test | **6/6** |
| post-battle-map | **10/10** |
| civ-bonusy | OK |
| diplomacy | **143/143** |
| ai | **193/198** (5× T2S baseline — oczekiwane) |
| smoke | **OK** |
| battle-smoke | **OK** |
| typecheck | pre-existing errors (nie regresja W-WIKI) |
| vite build → `$env:TEMP\civ-dist` | **OK** · 468 modułów · ~8.4 MB |

---

## Publish (tylko ROBOCZA — bez kanonu)

| Target | md5 | Status |
|--------|-----|--------|
| **`gra-robocza/`** | **`9b609961317734673d881e1604e04a7d`** | ✅ |
| **`Gra-podglad-ROBOCZA.html`** (legacy root) | ten sam | ✅ |
| **`Gra-podglad.html`** (kanon root) | **bez zmian** | ✅ NIE dotykane |
| **`gra-kanon/`** | `fd7c10bd…` | ✅ NIE dotykane |

**Start testowy:** `gra-robocza/START.html` · **Ctrl+F5**

**Dowód bundle:** `ui-wiki` SVG · `wh-hub` / `.b-wiki` · Wikipedia panel w JS bundle.

---

## Co sprawdzić (Master review — nie playtest Macieja w czacie)

1. Góra-prawo: chip **Wiki** obok Menu (zielony akcent, ikona otwarta książka)
2. Panel Wiki ~340px — złota ramka, zakładki Poradnik/Encyklopedia
3. Meta: Skrót / Hasło / Pełny artykuł
4. Górny pasek widoczny przy panelu miasta (z-index)

---

## Następny krok Master

- Review scope → opcjonalnie Opus → **Batch 3 kanon** (`publish-kanon-snapshot.ps1`) — **osobna dyspozycja**
- **NIE** prosić Macieja o playtest (OBOWIĄZ-PT)

---

## Pliki zmienione (lane UI — snapshot w `gra-robocza/src/ui/`)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/hud.ts` | `.b-wiki` + Wiki chip |
| `gra/src/ui/wikiHubHud.ts` | panel hub polish |
| `gra/src/ui/icons/wikiBookIcon.ts` | nowy |
| `gra/src/ui/icons/brand/tier5/ui-wiki-24.svg` | nowy |
| `gra/src/ui/icons/brand/tier5/ui-wiki-40.svg` | nowy |
| `gra/src/ui/icons/brand/icons-manifest.json` | wpis `ui-wiki` |
| `gra/src/ui/newGameFlow.ts` | `civMinStartEpochIndex` fix |
| `gra-robocza/ROBOCZA-MANIFEST.json` | md5 + timestamp |
