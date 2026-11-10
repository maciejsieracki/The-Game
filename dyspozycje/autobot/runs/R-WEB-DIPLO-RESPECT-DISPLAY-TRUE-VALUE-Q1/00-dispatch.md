# R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1 — dispatch (2026-11-09)
GOAL (decyzja właściciela, ABC „B: pokazuj prawdziwą wartość”): panel dyplomacji pokazuje rzeczywistą efektywną wartość Respektu AI wobec gracza (np. 67, nie obcięte 29); ograniczenie wojenne (clampRelationForWar, 29) zostaje tylko dla etykiety „Wrogi” + dopisek „limit wojenny 29”.
Operator: HAIKU 5.5. ZAKRES: gra/src/game/diplomacy-display.ts (effectiveNastawienieScores), ui/diplomacyAudience.ts (~1448/2218); otwarte: czy „Relacja” klamrowana czy z adnotacją — wybrać adnotację, bez zmiany mechaniki. Test + brak regresji diplomacy testów. LEDGER (REPIN Rust UI).
ALLOWLISTA: powyższe pliki, nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
