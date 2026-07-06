# CYWILIZACJE → SILNIK (Grupa F): P0 integracja Grupa D — **WYKONAJ TERAZ**

**Status:** **GOTOWE** — moduły lane dostarczone 2026-06-27  
**Priorytet:** **P0** (Maciej: pilne domknięcie częściowych decyzji)  
**Decyzje:** D1-Q1, D1-Q2, D3-Q1=A, D3-4B, D4-Q3=A, E1-D-Q1=A

---

## Co przesyłam (moduły GOTOWE — tylko wpięcie `main.ts`)

| # | Decyzja | Moduł | Plik lane |
|---|---------|-------|-----------|
| 1 | D3-Q1=A + 4B | Panel dyplomacji + modal wojny + callbacki | `gra/src/ui/diplomacyPanel.ts` |
| 2 | D1-Q1 | Filtr epoki drzewka tech | `gra/src/ui/sciencePicker.ts` (`getPlayerEra`) |
| 3 | D4-Q3 UI | Bonusy z `bonusy[]` w kreatorze | `gra/src/ui/newGameFlow.ts` |
| 4 | E1-D-Q1=A | Losowy roster AI | `gra/src/game/civ-roster.ts` — **już wpięte** |
| 5 | RDY-01 | Bonusy cyw | `civ-bonusy.ts` + test **30/30 PASS** |

---

## Batch SILNIK-D-P0-1: Dyplomacja gracza (main.ts)

W `buildDiplomacyPanelConfig()`:

1. Dodaj `ownerId: otherId` do każdego `rels.push({...})`.
2. Rozszerz return o callbacki:

```typescript
function buildDiplomacyPanelConfig(): DiplomacyPanelConfig {
  return {
    getRelations: () => { /* ... jak dziś + ownerId: otherId */ },
    getKnownWarsBetweenOthers: collectKnownWarsBetweenOthers,
    onDeclareWar: (ownerId: number, civName: string) => {
      const curRel = getDiploRelation(0, ownerId);
      const newRel = applyDiplomaticEvent(curRel, 'wojna_wypowiedziana');
      setDiploRelation(0, ownerId, newRel);
      showHintMessage('\u2694 Wypowiedziałeś wojnę: ' + civName, 4000);
      updateDiplomacyPanel();
    },
    onMakePeace: (ownerId: number, civName: string) => {
      const curRel = getDiploRelation(0, ownerId);
      const newRel = applyDiplomaticEvent(curRel, 'pokoj');
      setDiploRelation(0, ownerId, newRel);
      showHintMessage('\u{1F54A} Pokój z: ' + civName, 4000);
      updateDiplomacyPanel();
    },
    onProposeTrade: (ownerId: number, civName: string) => {
      console.log('[Dyplomacja] Gracz proponuje handel:', civName, ownerId);
      showHintMessage('Handel z ' + civName + ' — UI v0.2', 3000);
    },
  };
}
```

Import typu: `type DiplomacyPanelConfig` z `diplomacyPanel.ts` (opcjonalnie).

**DoD:** klik Wypowiedz wojnę → modal Tak → tier 0; Anuluj → bez zmiany.

---

## Batch SILNIK-D-P0-2: Drzewko epoki (main.ts)

W bloku `configureSciencePicker({...})` dodaj:

```typescript
getPlayerEra: (_ownerId: number) => player.era,
```

**DoD:** w epoce Kamień gracz nie widzi węzłów Brąz/Żelazo na drzewku.

---

## Batch SILNIK-D-P0-3: Weryfikacja (bramka)

```powershell
cd gra
node tools/civ-bonusy-test.cjs    # oczekiwane 30/30
node tools/diplomacy-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP\civ-dist
```

Po PASS + Opus → kanon `Gra-podglad.html`.

---

## Batch SILNIK-D-P0-4: Bonusy w bitwie 3D (main.ts)

UNITS dostarczył: `battleScene.ts`, `manualBattle.ts` — pola `attackerCivBonusy` / `defenderCivBonusy`.

Przy otwarciu bitwy (preBattle → battleScene / manualBattle) przekaż:

```typescript
attackerCivBonusy: civBonusyForOwnerId(attackerOwnerId),
defenderCivBonusy: civBonusyForOwnerId(defenderOwnerId),
```

Wzór: istniejące wywołania `resolveCombat` na mapie (~L2325, ~L2893 w main.ts).

**DoD:** Celtowie szarża widoczna w bitwie 3D; `battle-smoke.cjs` PASS po build.

---

## CZEKA na inne lane (Master rozdał dyspozycje)

| Lane | Zadanie | Handoff |
|------|---------|---------|
| ~~**UNITS**~~ | ~~Bitwa 3D + jednostki spec.~~ | **GOTOWE** 2026-06-27 |
| **UI** | preBattle bonusy | `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` |
| **CYW** | AI arkusze 5A | `CYWILIZACJE.md` § P0-5A |

*— Grupa D → Grupa F, 2026-06-27*
