# R-BITWA-DEAD-UNIT-DISAPPEARS-Q2
STATUS: REGISTERED
DOMAIN: GAME
RELATED_TO: R-BITWA-DEAD-UNIT-DISAPPEARS-Q1 (previously deployed6b7f40b4)
Owner2026-11-11 reports destroyedunitsstillvisibleinbattle. Reopen asregression/newuncoveredpath, donotclaimoldfixnotimplementedwithoutcodeaudit.
GOAL: killed/completelydestroyedunits disappearfromsceneimmediately includingbody/HPlabel/selection/formationghost, notmerelyroutedlivingunits. Auditallmelee/projectile/volley/siege/dot/auto/Skip/replaycases andrenderrecreationflags/fadeclock afterrecenttickunification. Existingbattle-dead-unit-disappearance-test mustrun butnotsoleproof. Baselineactualreproductionbeforefix; no newdeadbodygraphics. Preservevisiblelivingrout andunitcombatstate/save/outcome.
SCOPE: exactallowlist afterdiagnosis withinbattledeathlifecycle/render andownregressions/run. No broaderbattlebalance/refactor. ActualHTTPChromium largebattlekillmelee+missile/multistack+Skip variants before/after screenshots/objectdetachment assertions, mutationprooftest. IndependentLunaHigh roles→main/Robocza/push/readback.
QUEUE: registeredurgentnextfreedslot atmax4 (walls/alliance release619,cavalry,recruitment). Notyetoperatorassigned.
