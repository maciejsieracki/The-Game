# pre-kontynenty-1234.jsonl — tury 2..91

## Zapas `ruda` per główna cywilizacja (co 10 tur)

| tura | 0:rzymianie | 1:zulusi | 8:egipt | 15:chinczycy | 22:inkowie | 29:grecy |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | 0 | 0 | 90 | 0 | 0 | 60 |
| 30 | 0 | 150 | 330 | 140 | 0 | 110 |
| 40 | 60 | 0 | 2040 | 1170 | 1010 | 0 |
| 50 | 360 | 635 | 2830 | 3760 | 2510 | 2230 |
| 60 | 660 | 0 | 1900 | 7960 | 1845 | 3045 |
| 70 | 960 | 0 | 40 | 11860 | 2385 | 3015 |
| 80 | 1260 | 0 | 5295 | 15790 | 10335 | 2715 |
| 90 | 1560 | 0 | 9900 | 19420 | 18045 | 570 |
| 91 | 1590 | 0 | 10230 | 19735 | 18810 | 315 |

## Zapas `braz` per główna cywilizacja (co 10 tur)

| tura | 0:rzymianie | 1:zulusi | 8:egipt | 15:chinczycy | 22:inkowie | 29:grecy |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | 0 | 0 | 0 | 0 | 0 | 0 |
| 30 | 0 | 42 | 82 | 834 | 140 | 220 |
| 40 | 0 | 272 | 162 | 102 | 272 | 602 |
| 50 | 0 | 19857 | 22 | 0 | 46 | 22 |
| 60 | 0 | 32 | 789 | 37 | 46 | 2651 |
| 70 | 0 | 592 | 767 | 54749 | 466 | 587 |
| 80 | 0 | 572 | 79243 | 0 | 386 | 517 |
| 90 | 0 | 572 | 992 | 0 | 186 | 322 |
| 91 | 0 | 602 | 992 | 0 | 66 | 562 |

## Bilans źródeł `ruda` (suma po całym biegu) — główne cywilizacje

- **0:rzymianie**: 1590 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`
- **1:zulusi**: -40080 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; 37680 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`; 2400 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`
- **8:egipt**: 64830 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`; -54330 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -570 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; NIEOPISANE 300 (tury: 22:300)
- **15:chinczycy**: 49185 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`; -28340 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -1260 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; NIEOPISANE 150 (tury: 22:150)
- **22:inkowie**: 64335 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`; -45255 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -270 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`
- **29:grecy**: 52335 ← `creditOwnerResourceStock<creditTerritory<tickEmpireResourcePipeline<advanceCityEconomy`; -51750 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -270 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`

## Bilans źródeł `braz` (suma po całym biegu) — główne cywilizacje

- **1:zulusi**: -10853617 ← `deductBuildingStockCostAcrossCities<runWorldEndTurn<async`; 10816539 ← `creditOwnerResourceStock<runWorldEndTurn<async`; 40080 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -1800 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<runAiPhase<async`; -550 ← `deductBuildingStockCostAcrossCities<payStock<payStock<payStock`; -100 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<attemptGeneralPurchase`; 50 ← `creditOwnerResourceStock<applyMapBattleOutcome<doAutoPowerMapBattle<runWorldEndTurn`
- **8:egipt**: -10561327 ← `deductBuildingStockCostAcrossCities<runWorldEndTurn<async`; 10510079 ← `creditOwnerResourceStock<runWorldEndTurn<async`; 54330 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -1150 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<runAiPhase<async`; -450 ← `deductBuildingStockCostAcrossCities<payStock<payStock<payStock`; -390 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; -100 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<attemptGeneralPurchase`
- **15:chinczycy**: -7696320 ← `deductBuildingStockCostAcrossCities<runWorldEndTurn<async`; 7671520 ← `creditOwnerResourceStock<runWorldEndTurn<async`; 28340 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -3850 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<runAiPhase<async`; 1860 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; -1450 ← `deductBuildingStockCostAcrossCities<payStock<payStock<payStock`; -100 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<attemptGeneralPurchase`
- **22:inkowie**: -9039576 ← `deductBuildingStockCostAcrossCities<runWorldEndTurn<async`; 8999453 ← `creditOwnerResourceStock<runWorldEndTurn<async`; 45255 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -4450 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<runAiPhase<async`; -390 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; -226 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<attemptGeneralPurchase`; 100 ← `creditOwnerResourceStock<applyMapBattleOutcome<doAutoPowerMapBattle<runAiPhase`; -100 ← `deductBuildingStockCostAcrossCities<payStock<payStock<payStock`
- **29:grecy**: -10612170 ← `deductBuildingStockCostAcrossCities<runWorldEndTurn<async`; 10566272 ← `creditOwnerResourceStock<runWorldEndTurn<async`; 51750 ← `tickEmpireResourcePipeline<advanceCityEconomy<runWorldEndTurn<async:assign`; -3800 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<runAiPhase<async`; -840 ← `transferSurowiecIlosc<applyCyclicDeliveryOutcome<tickCyclicResourceTradeDeals<runDiplomacyTurnTick`; -650 ← `deductBuildingStockCostAcrossCities<payStock<payStock<payStock`; -100 ← `deductBuildingStockCostAcrossCities<purchaseRecruitmentUnit<attemptGeneralPurchase`; 100 ← `creditOwnerResourceStock<applyMapBattleOutcome<doAutoPowerMapBattle<runAiPhase`

MAX `ruda`: 19735 (15:chinczycy, tura 91, epoka 3, cap 440000)
MAX `braz`: 100000 (37:rzymianie(MP), tura 90, epoka 2, cap 100000)
