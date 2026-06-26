# HANDOFF: EKONOMIA → MASTER — model nauki STEROWANY GRACZEM (korekta Maciela 1a)

**Data:** 2026-06-25.

## Model (Maciej, [214] w EKONOMIA.md)
Nauka GRACZA = sterowana ręcznie. Gracz wybiera **CEL** (technologię). Globalna pula `playerState.nauka` akumuluje co turę (z mojego strumienia **%Badania**). Gdy `pula >= Koszt nauki(cel)` i prereqi spełnione → tech ukończona, `pula -= koszt`, gracz wybiera nowy cel (cel można zmienić w trakcie — pula zostaje). **ZNIKA** auto-zakup „najtańsza dostępna".

## Podział pracy
- **EKONOMIA (ja):** strumień %Badania zasila pulę — JUŻ wpięte (`podziałHandlu`→`totalNauka`→`playerState.nauka`). Dostarczam stan celu `cel: string|null` + logikę odblokowania (czysta).
- **MASTER (silnik):** w `research.ts`/pętli zamień auto-cheapest (`playerState.researchStep`) na model celu gracza. AI BEZ ZMIAN (`chooseAIResearch` ustawia swój cel).
- **UI:** picker celu (`setResearchTarget(techId)`) + pasek postępu (pula vs koszt celu).

## Rekomendacja techniczna
`research.ts` (orphan) MA już dokładnie ten model: `startResearch`=ustaw cel, `advanceResearch`=akumuluj postęp, complete przy koszcie. Najprościej: dodać `cel` do `PlayerState` + tick `if pula>=koszt(cel) && prereqi → complete`. Jedno źródło puli = `playerState.nauka`.

## Uwaga (własność do reconcile master↔Maciej)
[188] mówi `playerState`=master; Maciej (czat) mówi „skarbiec + pula nauki = EKONOMIA". Ja dostarczam logikę — ktokolwiek wpina `playerState`. NIE blokuje: strumień %Badania (mój) gotowy, AI niezmienione.
