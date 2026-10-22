import json, re, sys, collections
u = json.load(open(sys.argv[1]))
M = {  # mutacje stanu gry wykonywane z UI
    'enqueue', 'dequeue', 'promoteToFront', 'setPaused', 'dequeueRecruitment',
    'deductBuildingStockCostAcrossCities', 'refundBuildingStockCostAcrossCities',
    'deleteLocal', 'loadFromLocal', 'loadFsaAutosaveFile', 'generujSwiatAsync',
}
X = {'buildUnitModel', 'axialToWorld', 'HEX_R', 'getRiverGenEnabled', 'getRiverGenPhase',
     'VITALS_HP_DARK_CSS', 'VITALS_HP_FULL_CSS', 'VITALS_MOVE_DARK_CSS', 'VITALS_MOVE_FULL_CSS',
     'PB_SVG', 'BATTLE_GOLD', 'BATTLE_PLAYER', 'BATTLE_PLAYER_TEXT', 'BATTLE_ENEMY', 'BATTLE_ENEMY_TEXT',
     'BATTLE_TEXT', 'BATTLE_TEXT_DIM', 'BATTLE_FONT', 'BATTLE_FONT_TITLE', 'applyBtnStartBattle',
     'MAP_GEN_PHASE_LABELS', 'MAP_GEN_PHASE_TOTAL', 'FOG_EXPLORED_BRIGHTNESS'}
F = {'formatCityMapLabel', 'formatEntityDisplayName', 'daninaLabel', 'daninaLabelGenitive', 'daninaLabelAccusative',
     'formatManpower', 'formatObywateleLabel', 'formatWyzwienieLabel', 'stockResourceLabel', 'formatDiploCivListLines',
     'formatRelationModLabel', 'nastawienieHintPl', 'nastawienieLabelFromScore', 'wiarygodnoscBadgeHtml',
     'wiarygodnoscTooltipPl', 'wiarygodnoscTooltipDefPl', 'wiarygodnoscLabelPl', 'wiarygodnoscTooltipRozbiciePl',
     'resourceDisplayLabel', 'formatBasketListBrief', 'improvementDisplayName', 'formatImprovementBuildImpactList',
     'hexDepositDisplayLabel', 'hexHiddenDepositHint', 'postCaptureLawBannerLabel', 'citizenUpkeepDisplayLines',
     'buildChipDeltaStockHtml', 'civMatrixFormattedValue', 'civMatrixIntensityLabel', 'civMatrixParameterLabelPl',
     'startPreviewSummaryRows', 'bonusChipTexts', 'audienceActionBarLockNote', 'audienceActionStatusNote',
     'buildingStructuralDefenseBonusLine', 'upgradeCompositionLines', 'qualityTierToLabel', 'slotSlugFromLabel',
     'uniqueSlotIdFromLabel', 'labelsForImprovementUnlock', 'terrainUnlockLabelsForTech', 'buildingRequiredActiveLabels',
     'converterProductionDisplayForBuilding', 'splitNegotiationDealPlayerSides', 'cityHasBibliotekaLine'}
S_LOADER = {'loadGameData', 'getTechDef', 'getUnitDef', 'loadWealthParams', 'loadOrderParams', 'loadSocietyScaleParams',
            'loadReligionParams', 'loadPowerOpcje', 'categoryOf', 'listSaves', 'getLastPlayedSlotId', 'loadSaveSlotMeta',
            'extractSaveContextFields', 'isIdbAvailable', 'listFsaAutosaveFiles'}

def cls(r):
    s, mod = r['sym'], r['mod']
    if r['type']:
        return 'T'
    if mod.startswith('gra-data/') or mod.startswith('data/wikiBundle'):
        return 'S'
    if s in M: return 'M'
    if s in X or mod.startswith('render/') or mod.startswith('battle/') or mod.startswith('map/mapGen') or mod.startswith('map/riverGen'):
        return 'X'
    if s in F: return 'F'
    if s in S_LOADER: return 'S' if mod != 'game/save' and mod != 'game/fsa-autosave' else 'IO'
    if re.fullmatch(r'[A-Z][A-Z0-9_]+', s): return 'K'
    if mod in ('game/save', 'game/fsa-autosave'): return 'IO'
    return 'R'

per_file = collections.OrderedDict()
tot = collections.Counter()
for f, rows in u.items():
    c = collections.defaultdict(list)
    for r in rows:
        k = cls(r)
        unused = r['uses'] == 0
        c[k].append(r['sym'] + ('°' if unused else ''))
        tot[k] += 1
    per_file[f] = c
print('TOTAL', dict(tot), sum(tot.values()))
for f, c in per_file.items():
    print('##', f, {k: len(v) for k, v in c.items()})
    for k in 'RMIOFKSXT':
        pass
    for k in ('R', 'M', 'IO', 'F', 'K', 'S', 'X', 'T'):
        if c.get(k):
            print('  ', k, ', '.join(c[k]))
json.dump({f: {k: v for k, v in c.items()} for f, c in per_file.items()}, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
