# CYWILIZACJE → MASTER : Fala A+B (enum 9 + pełna dyplomacja AI + spryt + budżet) — DONE

Data: 2026-06-25 | DONE, czyste/NIEwpięte. Testy ZIELONE: diplomacy-test 133/0, ai-test 175/0.

## Fala A — wyrównanie do rostera 9 (master polecił)
- enum `TypCywilizacji` (src/types/player.ts): +Celtowie +Germanie (10 = 9 + DrobnaCywilizacja).
- diplomacy.ts `ARCHETYPE_AGGRESSION`/`ARCHETYPE_TRADE`: +Celtowie (0.60/0.35), +Germanie (0.65/0.30).
- civs.json: usunięto martwą flagę **"Typ główny"** (+ export-civs.py PRESERVED_FIELDS).
- loader.ts `AiParamDef`: +`wartosc?: number|null` (TS7053 zniknął).
- **RIPPLE do mastera (lane UI, NIE moja edycja):** `src/ui/newGameFlow.ts` czyta `typGlowny` (l.34/79/87/248) — po usunięciu pola = undefined; UI bezpiecznie pomija (`if c.typGlowny`), ale master niech sprzątnie te linie.

## Fala B — decyzje Macieja 2a/4b + pkt5 (ai.ts)
- **T2=A PEŁNA dyplomacja AI:** `decideAIDiplomacy` + `zaproponuj_sojusz` (PROG_SOJUSZ=0.6, willingnessAlly, partner równy rw∈[0.4,0.7]) + `zaproponuj_handel` (PROG_HANDEL=0.5, willingnessTrade, handlowosc). `DiplomacjaInputs` +`handlowosc?`. Priorytet/partner: wojna > trybut > trybut-za-pokój > pokój > sojusz > handel (max 1/partner).
- **T4=B SPRYT od trudności:** `loadDifficultyParams` +`agresjaMnoznik`(0.85/1.0/1.2) +`dyplomacjaAktywnosc`(0.8/1.0/1.25) +`celObranie`(0.0/0.5/1.0). `decideAIReaction(inp, agresjaMnoznik=1)` + `decideAIDiplomacy(inp, params?, agresjaMnoznik=1)` skalują agresję; `decideAITurn` dobiera cel wg `celObranie` (preferuje słabszego). Poziom 3 widocznie agresywniejszy/sprytniejszy niż 1.
- **pkt5 BUDŻET:** `AITurnOpts` +`itemCost?(itemId)=>number`; `chooseCityProduction` filtruje przez `canAfford`, gdy nic nie stać → `null` (AI oszczędza, nie buduje ponad budżet), `itemCost` → wybór score/cost. Kamień=Praca obsłużone przez `canAfford` EKONOMII. Kontrakt: `EKONOMIA-do-CYWILIZACJE_budzet-AI.md`. Zero regresji gdy brak canAfford/itemCost.

## Respekt (decyzja 1, Maciej drąży) — SPEC + wzór DO AKCEPTACJI
- `Civ-CYWILIZACJE/SPEC-Respekt.md`: moc nacji (potęga) z 6 komponentów (armia 28 / bitwy 20 / ludność 18 / miasta 14 / gospodarka 12 / epoka 8) → Respekt = **ratio-share** (50=parytet). Turniej formuły: ratio-share 12/12.
- diplomacy.ts: `computePotegaNacji` + `computeRespekt(self, partner)` ratio-share. **Steruje AI: słaby ULEGA (pokój/trybut), nie atakuje silniejszego** — sedno Macieja.
- DO AKCEPTACJI: komponenty/wagi/formuła (4 pkt w SPEC §G).

## Wpięcie (master) — kontrakty dla silnika
- `decideAIDiplomacy`: w fazie dyplomacji tury AI → wykonaj komendy (stanWojny / `applyDiplomaticEvent`). Przekaż `agresjaMnoznik` z `loadDifficultyParams(poziom)`.
- `computeRespekt`: silnik liczy potęgę per nacja (komponenty z UNITS/MIASTO/EKONOMIA) → `Relation.respekt = computeRespekt(potSelf, potPartner)`.
- `decideAITurn`: przekaż `canAfford` + `itemCost` (z EKONOMIA/production) + `poziomTrudnosci` (celObranie).
- Pełne API: `CYWILIZACJE-do-MASTER_diplo-ai-api.md` + powyższe rozszerzenia.
