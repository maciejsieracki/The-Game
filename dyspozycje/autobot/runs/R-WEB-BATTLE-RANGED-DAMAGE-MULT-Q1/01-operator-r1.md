STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1
GOAL: Wdrożenie decyzji właściciela (2026-11-09): obrażenia pocisku procarza x3, pieszego łucznika x2 (oszczepnik i strzelec konny bez zmian); celność pocisku = max(Atak wręcz, Atak dystansowy) strzelca. Mnożnik jako parametr w combat-params.json, jedna implementacja dla bitwy animowanej i auto-walki.
MODEL OPERATORA: Haiku 5.5 (dispatch zakładał SONNET 5.5; wykonano na tym, co przydzielono runtime)
ZMIANY/COMMIT: patrz sekcja COMMIT na końcu (SHA po commicie)
  - gra/data/combat-params.json: nowy blok "ranged_damage_mult" {slinger: 3, lucznik_piesi: 2} + opis.
  - gra/src/game/unit-power.ts: rangedDamageMultFor({Typ, Jednostka}) (jedyna implementacja klasyfikacji); fieldPower mnoży składnik missileAttack przez mnożnik (moc AI / sortowanie).
  - gra/src/game/combat.ts: rangedShotAccuracy(melee, missile)=max; rangedShotDamage(shooter, missile, armor, kontra) = max(1, round(max(1,missile-armor) * kontra * mnożnik klasy)); użyte w fazie dystansowej resolveCombat (obie strony).
  - gra/src/battle/battleScene.ts (tylko ścieżka pocisku w _singleBlow): celność = max(atakWrecz*rzeka, atakDyst*rzeka); dmg = rangeDamage * mnożnik klasy, potem kontra i zaokrąglenie (podłoga 1). Ścieżka wręcz bez zmian.
  - gra/tools/ranged-damage-mult-test.cjs (nowy): 24 asercje.
  - Poza allowlistą NIC nie zmieniono (próbne podpięcie karty/tooltipa cofnięte przed commitem).
KLASYFIKACJA OBJĘTYCH JEDNOSTEK (units.json, pole Typ + Jednostka):
  - x3 (Typ 'Slinger'): Procarz; Procarz (Huaracoc).
  - x2 (Typ 'Distance', nazwa zaczyna się od 'Łucznik'): Łucznik; Łucznik egipski; Łucznik nubijski; Łucznik sumeryjski; Łucznik akadyjski; Łucznik asyryjski.
  - BEZ ZMIAN (x1): Oszczepnik; Oszczepnik Zulu (Izijula); Oszczepnik (Estólica) (Typ Distance, nazwa nie zaczyna się od Łucznik); Konnica łucznicza asyryjska; Rydwan egipski; Jeździec z oszczepami (Typ Mount); Katapulta (Siege).
  - ZAŁOŻENIE: klasa "łucznik piesi" = Typ Distance + prefiks nazwy 'Łucznik' (żaden Typ Distance spoza Oszczepnik nie ma innej nazwy).
TESTY:
  - node tools/ranged-damage-mult-test.cjs: WSZYSTKIE PASS (24 asercje). Procarz vs Falanga (armor 8): dmg 3 (baza max(1,4-8)=1 x3). Łucznik vs Falanga: dmg 2 (baza 1 x2). Oszczepnik vs Falanga: 1 (bez zmian). Podłoga 1 po mnożniku zweryfikowana. Celność Procarz vs Falanga: 32% (max) vs 29% (samo wręcz).
  - npx tsc --noEmit: exit 0 (po wszystkich zmianach).
  - Regresje bez zmiany wyniku względem origin/main (node, bez przeglądarki): combat-test 6/6; pr141-combat-offense-behavior 75/0; pr141-combat-defense-behavior 59 PASS; pr141-matrix-only-combat 36/0; battle-ranged-mounted-doctrine 10/10; unit-power-test 6/0; unit-power-sort 13/0; unit-context-card 29/0; civ-bonusy 56/0; army-hunger-combat 13/0; gold-deficit 55/0; ai-difficulty-bonus 97/0; unit-building-bonuses 82/0; auto-battle-loss-audit 52/0; battle-cap-500 59/0; pole-bitwy-balance-check (bez zmian, to nie mierzy ścieżki auto-walki).
  - Pre-existing FAIL identyczne jak na origin/main (porównane asercja po asercji): moc-ranking-rozjazd-test 6 FAIL; weterani-test 1 FAIL; recruit-list-order-by-era-test 1 FAIL; rydwan-konnica-x2-test 2 niezgodności; defense-breakdown-test crash TypeError (bez zmian).
  - battle-ranged-approach-regression-test: NIE_ZMIERZONO — wymaga Chromium (brak /usr/bin/chromium w kontenerze; npm ci z --ignore-scripts nie pobrał przeglądarki).
  - Bitwa ręczna w Chromium (1 próbka): NIE_ZMIERZONO (jw.).
  - Realny balans auto-bitew (win-rate przed/po): NIE_ZMIERZONO.
BLOKADY:
  1. Karta jednostki / tooltip "Siły zastosowane" (src/ui/hexContextTooltip.ts, src/game/unit-card-stats.ts, src/main.ts unitCardCombatFor) NIE zaktualizowane: poza allowlistą tematu. Skutek: "Moc" w tooltipie liczy missileAttack bez mnożnika (procarz/łucznik pokazują starą moc), podczas gdy AI (armyFieldPower na wierszu units.json) używa nowej. Wymaga osobnego tematu lub rozszerzenia allowlisty (plumbing: Typ/Jednostka do UnitCardCombatBases i mnożnik do fieldPower).
  2. Karta "Atak dystansowy" pokazuje surową statystykę (nie obrażenia pocisku) — nie zmieniano; ewentualny opis obrażeń w karcie wymaga decyzji o treści.
  3. Dług REPIN Rust combat (dispatch): NIE zakładano — do rejestru.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu (4 pliki gra/ + tools/ranged-damage-mult-test.cjs + ten raport); decyzja orkiestratora w sprawie BLOKADY 1 (osobny temat karty/tooltipa).
DEPLOY/PUSH: NIE WYKONANO
COMMIT: podany w odpowiedzi operatora (SHA).
