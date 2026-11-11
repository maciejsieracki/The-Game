# R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1
STATUS: REGISTERED
DOMAIN: GAME
Owner2026-11-11: ability to enable/disable resource-producing buildings in city; disabled building costs notcounted.
GOAL: per-city per-building operationaltoggle; offmeans noresourceproduction,noinputconsumption,noongoingmaintenancecost; onrestoresnormalbehavior. Persiststate/save-load, oldsave missingstate defaultsON. Do not refundconstructionprice ordeletebuilding/stock. Audit all resource-producingcitybuildings inclmulti-recipefoundries/pottery/brickworks andrawresourceproducers, notjustsingleconverter. Enumerateactualincludedbuildings beforecodeedit. No unsolicited toggle allcivicbuildings/economicrebalance.
CONSUMERS: actualtick/playerAIparity, productionpreview/HUD/citypanelrates/maintenancebudget consistent. Disabled building remainsbuilt forserialization; document existingtech/prereq/unlockeffects explicitly andavoidunrequestedgatingchanges. SingleUIaction nexttick obviousstate; disabledoutputnotcreditedbyalternatemain/AIpath. AIautomaticmanagement maynot silentlyoverridehumanchoice. Saveplayer/AIstate andlegacydefaults.
TESTS: active/off/on inputsoutputsmaintenance quantitativeconservation, multi-recipeoffall, mixedcitiesownerparity, save-loadtoggle+oldsaveON, actualUIcontrols/screenshot+mutation, focusedregressions/typecheck. Exactallowlistbeforeedit. IndependentLunaHigh Operator/Evaluator/FC→main/Robocza/push/readback.
QUEUE: max4active; registeredafterbrickcycles/otherownerrequests, nextqualifiedslot. Notimplemented.
