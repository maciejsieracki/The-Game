# HANDOFF: UI → MASTER — sciencePicker przebudowany na DRZEWKO (re-wire configa)

**Data:** 2026-06-25 · Wg `EKONOMIA-do-UI_nauka-w-drzewku.md` (model jednocelowy, wybór celu klikiem w drzewku). Walidacja składni: PASS (klamry 96/96). Backup `sciencePicker.ts.bak-UI`. Bez kanonu z mojej strony.

## Co się zmieniło
`gra/src/ui/sciencePicker.ts` — z listy na INTERAKTYWNE DRZEWKO (kolumny epok Kamień/Brąz/Żelazo, węzły = techy, krawędzie = prereqi, statusy, pasek pula vs koszt + ETA). Eksporty **NIEZMIENIONE** (`showSciencePicker`/`hideSciencePicker`/`isSciencePickerOpen`/`configureSciencePicker`) — przycisk „🔬 Nauka" w HUD działa bez zmian. Struktura drzewka: moduł importuje `gra/data/tech.json`.

## ⚠ KONIECZNY RE-WIRE: zmieniony kształt SciencePickerConfig
Stary config (`getCurrentTarget` / `getSciencePool` / `getAvailableTechs`→obiekty) **ZASTĄPIONY**. Nowy:
```ts
interface SciencePickerConfig {
  getResearchState?: (ownerId) => { pula; targetId: string|null; kosztCelu; postepFraction; turnsLeft } | null;
  getResearchedTechs?: (ownerId) => string[];   // zbadane
  getAvailableTechs?:  (ownerId) => string[];   // dostępne do wyboru
  onSelectTarget?:     (techId) => void;
}
```

## Mapowanie na ISTNIEJĄCE haki silnika (window.__civ_*)
- `getResearchState`  ↔ `window.__civ_getResearchState(naukaPerTurn?)` → {pula,targetId,kosztCelu,postepFraction,turnsLeft}. ✅ bezpośrednio.
- `getAvailableTechs` ↔ `window.__civ_getAvailableTechs()` → string[]. ✅
- `onSelectTarget`    ↔ `window.__civ_setResearchTarget(techId)`. ✅
- `getResearchedTechs` ↔ **BRAK haka** — proszę dodać `window.__civ_getResearchedTechs() => string[]` (lub dołączyć `zbadane: string[]` do getResearchState). Bez tego węzły zbadane pokażą się jako „dostępne" (degradacja, nie blokuje).

## Dane drzewka
`gra/data/tech.json` (Epoka/Poziom/Wymaga/Koszt nauki/Odblokowuje). 3 epoki v0.1: Kamień/Brąz/Żelazo — Żelazo dochodzi od EKONOMII (`EKONOMIA-do-MASTER_tech-tree-zelazo.md`). Drzewko renderuje epoki obecne w tech.json (skaluje się samo).

## DoD (po re-wire)
Klik dostępnego węzła ustawia cel (`setResearchTarget`); pasek pula vs koszt celu + ETA; statusy zbadana/cel/dostępna/zablokowana; panel zostaje otwarty po wyborze. Podgląd: `UI/Gra-podglad-NAUKA.html`.
