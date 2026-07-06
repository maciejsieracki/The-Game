# Sprawdzanie zmian — kto co testuje (ISO-5 + SIMP-1)

> **Cel (jedyny):** grupa nie psuje gry innym (jak miasto, które rozwaliło mapę).
> **Zasada nadrzędna:** Maciej = tylko czat, **zero terminala**. Sprawdzanie robią agenci.

Reguła: `.cursor/rules/zmiany-izolacja.mdc` · Mapa połączeń: `docs/obieg/MAPA-POLACZEN.md` · Decyzje: ISO-5, SIMP-1 (`REJESTR-DECYZJI.md`).

## Podział (uproszczony — SIMP-1)

| Kto | Co sprawdza | Jak |
|---|---|---|
| **Grupa A–E** (agent w swoim czacie) | czy **kod się nie wysypał** (kompilacja + testy jej obszaru) | sam odpala w swoim terminalu; **nie** buduje całej gry |
| **Integrator** (Grupa F) | **całość + wygląd** (cała gra zbudowana, bramka, mapa/miasto/HUD) | właściciel testu integracyjnego i wizualnego |
| **Master** | weryfikuje raport Integratora, routing | nie odpala kodu |
| **Maciej** | finalny playtest | tylko ogląda gotowe — zero terminala |

## Grupa A–E — lekki self-check PRZED handoffem
Agent grupy, zanim napisze `→ INTEGRATOR: GOTOWE`:
1. `typecheck` (czy się kompiluje),
2. testy swojego obszaru (np. B: ekonomia/wealth; C: combat/oblężenie; A: mapa; D: civ/ai; E: start),
3. handoff z: **warstwą** (🟢 izolowana / 🟡 cross / 🔴 duża) + **„co sprawdzić po wpięciu"**.

> Grupa **nie musi** budować całej gry — to robi Integrator (ma wszystkie klocki).

## Integrator — test całości i wizualny (jego stały obowiązek, bez specjalnego skryptu)
Standardowymi komendami (są w `.cursor/rules/civ-workflow.mdc` §6):
1. `npm run typecheck` + testy (`bramka` / pojedyncze suite),
2. **build BEZ publikacji:** `npx vite build --outDir %TEMP%\civ-dist` → otwórz wynik,
3. **obejrzyj** mapę/miasto/HUD — regresja wizualna (ISO-4),
4. zielono + wygląd OK → publikuj `Gra-podglad-ROBOCZA.html` + raport do Mastera.

> Dwa kroki (build → obejrzyj → publikuj) zamiast jednego, żeby złapać „mapa się wykrzaczyła" PRZED publikacją.

## Handoff grupy (wzór)
```
→ INTEGRATOR: GOTOWE
- Moduł / pliki: <co zmienione>
- Warstwa: 🟢 / 🟡 / 🔴
- Self-check: typecheck OK + testy obszaru zielone
- Co sprawdzić po wpięciu: <ekrany / przypadki>
```

## Dlaczego tak (Twoja uwaga)
Gry nie da się sprawdzić z klocków jednej grupy — potrzeba wszystkich połączonych. Dlatego **test całości naturalnie mieszka u Integratora**, a grupa odpowiada tylko za to, że jej kawałek się kompiluje i przechodzi testy. „Czy ŹLE WYGLĄDA" wymaga oczu → Integrator + Twój playtest.
