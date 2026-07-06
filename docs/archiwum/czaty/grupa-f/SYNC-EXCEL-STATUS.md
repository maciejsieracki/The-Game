# Sync Excel — Grupa F → Status-projektu-The-Game.xlsx

**Data:** 2026-06-27

## Automatycznie (zalecane)

```powershell
cd "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ"
pip install openpyxl   # jeśli brak
python gra/tools/append-f-status-xlsx.py
```

Skrypt tworzy backup `Status-projektu-The-Game.xlsx.bak-F-2026-06-27` i dopisuje arkusz **`Grupa-F`** (10 wierszy).

## Ręcznie (jeśli brak Python)

| ID | Temat | Status | Uwagi |
|----|-------|--------|-------|
| F-kod | Integracja main.ts | WPIĘTE | 8 batchy 26–27.06 |
| F-bramka | ROBOCZA | CZEKA | Node + bramka-test-publish.ps1 |
| F-HUD-1 | HUD cz.1 | WPIĘTE | ABC1=A |
| F-HUD-2 | WYKONAJ, panel [H] | TODO | handoff D1B-A4 |
| F-C2 | Bitwa TW | TODO | po ROBOCZA |
| F-B2-hex | 🔥 hex buntu | CZEKA MAPA | getRevolt |
| F-save-B2 | Persist B2 w save | TODO | luka Ctrl+L |
| F-D4 | Bonusy cyw | TODO P2 | CYWILIZACJE |
| F-A4-D4 | Ulepszenia mapy | TODO P2 | BLK-04 |
| F-B5 | Żywność imperium | BLOK | stub |

## Wskaźniki % (propozycja dla głównego arkusza)

| Metryka | Wartość audyt 2026-06-27 |
|---------|--------------------------|
| Kod lane SILNIK (batchy) | ~85% |
| Integracja main.ts | ~80% |
| HUD D1B w grze | ~55% (cz.1 wpięte, cz.2 TODO) |
| Grywalność vs kod źródłowy | **rozjazd** — brak ROBOCZA |
| Opus / kanon finalna | 0% (czeka ROBOCZA) |
