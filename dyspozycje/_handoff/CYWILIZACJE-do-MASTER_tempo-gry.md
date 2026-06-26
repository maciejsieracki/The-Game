# CYWILIZACJE → MASTER (dla SILNIK + UI): tempo gry + finalne koszty tech

Data: 2026-06-25 | tech.json koszty FINALNE (decyzje Macieja), `tempo_gry` = NOWA funkcja startu gry.

## Koszty tech — FINALNE (temat zamknięty)
- **1a**: baza zostaje (spójna z referencją tempa nauki).
- **4b + zasada narastania**: koszty PROGRESYWNIE rosnące w obrębie KAŻDEJ epoki (monotonicznie wg kolejności badań); bramki na szczycie epoki: **Brązownictwo 45, Waluta 100, Sztuka wojenna 200**. **Jeździectwo (56) > Pismo/Religia** (3b).
- Q2 (Murarstwo) zniknęło — L1 = łagodne narastanie.
- tech.json: 29 tech (Kamień 10 / Brąz 10 / Żelazo 9), monotoniczność per epoka potwierdzona, JSON OK.

## tempo_gry — NOWA funkcja (dla UI + SILNIK)
Globalny mnożnik kosztu badań WYBIERANY PRZY STARCIE GRY (steruje długością/dynamiką, nie ruszając bazowych kosztów):
- **szybka ×0.2 (=÷5), standardowa ×1.0, długa ×5.0.** Dane: `tech.json` → `"tempo_gry"`.
- Helper: `gra/src/game/tech-tempo.ts` → `applyTempoKoszt(bazowyKoszt, tempo: TempoGry|number)` → round, min 1. Test `tech-tempo-test.cjs` 9/9.

WPIĘCIE:
- **UI**: ekran nowej gry — wybór tempa (szybka/standardowa/długa) → `GameData.tempoGry`.
- **SILNIK**: przed wyświetleniem kosztu tech i przed sprawdzeniem ukończenia badania → `applyTempoKoszt(tech['Koszt nauki'], gameData.tempoGry)`. Baza w tech.json niezmieniona (= tryb standardowa).
