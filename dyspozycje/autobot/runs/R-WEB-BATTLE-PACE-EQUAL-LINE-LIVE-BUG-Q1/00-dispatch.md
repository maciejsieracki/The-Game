# R-WEB-BATTLE-PACE-EQUAL-LINE-LIVE-BUG-Q1 — dispatch (2026-11-12, zgłoszenie właściciela ze zrzutu z gry)

ZGŁOSZENIE WŁAŚCICIELA (dosłownie): „część armii, górna część armii idzie szybciej, a dolna jakby spowalnia i nie ma równej linii. Więc coś jest nie tak nadal z tym równym podejściem.”
ZRZUT: długa kolumna jednostek (dwie kolumny po ok. 20 jednostek), jedna grupa wyraźnie dalej do przodu niż druga, linia nie jest równa; znaczniki 1/2 nad jednostkami pokazują różne przebyte odległości.

ZAMIAR (wiążący; wynika z GOAL W19 i W40): cała armia (w tym mieszana) porusza się tempem NAJWOLNIEJSZEJ jednostki AŻ DO PIERWSZEGO WZWARCIA wręcz; wszystkie jednostki jednej armii mają w tej fazie równą liczbę pól przebytych w turze (różnica ≤ 1 pole). Konnica poza regułą po wzwarciu wg swojego sposobu ataku. Strzelcy trzymają dystans.

FAKTY Z KODU (do sprawdzenia, nie do przyjęcia z góry):
- `_lineAdvanceCap(ru)` w gra/src/battle/battleScene.ts (ok. linia 8218) i sprawdzenie `sign * candidateCol <= this._lineAdvanceCap(ru)` (ok. 8204): ogranicznik tempa; sprawdzić, czy działa dla KAŻDEJ jednostki armii, a nie tylko dla grupy piechoty; czy grupy (groupId / kolumny) nie dostają różnych limitów; czy limit liczy się od pozycji startowej armii czy od bieżącej.
- Zachowanie wyraźnie różne między górną i dolną połową: podejrzenie — limit liczony od różnych punktów (pozycja lidera vs. ostatniego) albo grupy z różnym `movementPoints` nie są sprowadzone do wspólnego tempa.
- Testy: gra/tools/battle-line-advance-uniform-test.cjs (W19, 17 PASS), gra/tools/battle-mixed-army-advance-pace-test.cjs (W40). Uwaga: testy W19 mogły przechodzić na bazie — W40 r5 FC stwierdził, że test NIE różnicuje bazy od poprawki. To wymaga naprawy testu, nie tylko kodu.

KRYTERIA KOŃCA (binarne, z dowodem):
K1. Test symulacyjny (headless, bez przeglądarki): armia mieszana (piechota + łucznicy + konnica + machiny) z różnymi movementPoints; po każdej turze do pierwszego wzwarcia: max−min liczby pól przebytych przez jednostki piechoty/strzelców/machin danej armii ≤ 1. Pomiar przed i po w raporcie.
K2. Test regresji z mutacją: przywrócenie błędnego limitu (np. limit tylko dla grupy 1 albo limit od pozycji lidera) → test CZERWIENIEJE. Bez tego dowodu K1 nie liczy się.
K3. Wizualnie w Chromium (1920×1080, przy zrzucie z deviceScaleFactor 2): po zarządzeniu marszu dwóch armii z zrzutu linia jest równa (kolumna frontu ma ≤1 pole rozrzutu). Zrzuty przed/po w evidence/.
K4. Konnica po wzwarciu nie jest wiązana tempem (istniejący test cavalry-flank-default zielony).
K5. Istniejące testy W19 i W40 zielone albo jawnie zaktualizowane z uzasadnieniem w raporcie; tsc --noEmit; bramki: logic-test, tech-tree-test, research-test, unit-replace-test, combat-test.
K6. Jeśli wymagany jest NOWY PRÓG liczbowy — DECISION_REQUIRED (ABC), nie wybierać samemu. Zmierzona wartość bieżąca: TOL=2 (decyzja właściciela 2026-11-12), TOL_RANK1=2 (decyzja właściciela 2026-11-12).

ALLOWLISTA: gra/src/battle/battleScene.ts (sekcja tempa/limitu, ok. linii 8190–8260 i pokrewne), gra/src/battle/* tylko jeśli konieczne do tempa, gra/tools/battle-line-advance-uniform-test.cjs, gra/tools/battle-mixed-army-advance-pace-test.cjs, nowy gra/tools/battle-pace-equal-line-live-test.cjs, dyspozycje/autobot/runs/R-WEB-BATTLE-PACE-EQUAL-LINE-LIVE-BUG-Q1/**.
ZAKAZ: WERSJE.md, JSON balansu, rust-port, push, deploy, npm run build/dev.
BAZA: origin/main aeb52465e. MODEL: Operator HAIKU 5.5 (zawęż zakres; w razie 2 porażek — Sonnet z uzasadnieniem), round 1/5.
