# Raport Operatora — R-JEDNOSTKI-RYDWAN-KONNICA-X2-Q1-20260927

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-JEDNOSTKI-RYDWAN-KONNICA-X2-Q1-20260927
GOAL: Podwojenie liczbowych parametrów bojowych wszystkich jednostek typu Mount objętych zakresem, bez zmiany kosztów, utrzymania, mobilności, widoku, morale i bonusów kontekstowych.

ANALIZA WPŁYWU NA SILNIK:
- `combat.ts` buduje snapshot walki z pól `meleeAttack`, `meleeDefence`, `weaponDamage`, `armor`, `piercing`, `chargeBonus`, `health` i `missileAttack`; `Health` jest fallbackiem maksymalnego HP używanym m.in. przez AI. Dlatego podwojono oba klucze zdrowia, które pełnią różne role w istniejących warstwach.
- `unit-power.ts` używa wpisanego w JSON `fieldPower` bezpośrednio w `armyFieldPower()`, a gdy go nie ma, dopiero wylicza moc ze statystyk źródłowych. `fieldPower` musiał zostać podwojony osobno, aby ranking/suma armii pozostały spójne z podwojoną bazą; nie jest to dodatkowe mnożenie w resolverze walki.
- `veteran.ts` i `unit-card-stats.ts` stosują bonusy weteranów/awansów jako mnożniki procentowe na bazowych statystykach. Zmiana danych bazowych automatycznie skaluje te bonusy bez dodatkowej modyfikacji kodu.

ZMIANY:
- Zmieniono wyłącznie `gra/data/units.json` w 13 jednostkach `Typ: Mount` i w 176 polach liczbowych.
- Dwie dodatkowe jednostki poza listą zgłoszenia zostały objęte zakresem zgodnie z regułą `Typ: Mount`: `Jeździec chiński` i `Jeździec z oszczepami`.
- Nie zmieniono żadnych plików pochodnych ani kodu silnika.

| Jednostka | Pole | Przed | Po |
|---|---|---:|---:|
| Rydwan (woły) | `Atak` | 6 | 12 |
| Rydwan (woły) | `Health` | 200 | 400 |
| Rydwan (woły) | `Obrona` | 2 | 4 |
| Rydwan (woły) | `Pancerz` | 2 | 4 |
| Rydwan (woły) | `Przebicie` | 4 | 8 |
| Rydwan (woły) | `Uderzenie` | 6 | 12 |
| Rydwan (woły) | `armor` | 3 | 6 |
| Rydwan (woły) | `chargeBonus` | 10 | 20 |
| Rydwan (woły) | `fieldPower` | 52 | 104 |
| Rydwan (woły) | `health` | 48 | 96 |
| Rydwan (woły) | `meleeAttack` | 6 | 12 |
| Rydwan (woły) | `meleeDefence` | 4 | 8 |
| Rydwan (woły) | `piercing` | 3 | 6 |
| Rydwan (woły) | `weaponDamage` | 7 | 14 |
| Konnica | `Atak` | 6 | 12 |
| Konnica | `Health` | 160 | 320 |
| Konnica | `Obrona` | 4 | 8 |
| Konnica | `Pancerz` | 4 | 8 |
| Konnica | `Przebicie` | 4 | 8 |
| Konnica | `Uderzenie` | 6 | 12 |
| Konnica | `armor` | 4 | 8 |
| Konnica | `chargeBonus` | 10 | 20 |
| Konnica | `fieldPower` | 49 | 98 |
| Konnica | `health` | 28 | 56 |
| Konnica | `meleeAttack` | 8 | 16 |
| Konnica | `meleeDefence` | 5 | 10 |
| Konnica | `piercing` | 6 | 12 |
| Konnica | `weaponDamage` | 7 | 14 |
| Jeździec chiński | `Atak` | 8 | 16 |
| Jeździec chiński | `Health` | 150 | 300 |
| Jeździec chiński | `Obrona` | 4 | 8 |
| Jeździec chiński | `Pancerz` | 4 | 8 |
| Jeździec chiński | `Przebicie` | 4 | 8 |
| Jeździec chiński | `Uderzenie` | 10 | 20 |
| Jeździec chiński | `armor` | 3 | 6 |
| Jeździec chiński | `chargeBonus` | 5 | 10 |
| Jeździec chiński | `fieldPower` | 45.5 | 91.0 |
| Jeździec chiński | `health` | 44 | 88 |
| Jeździec chiński | `meleeAttack` | 7 | 14 |
| Jeździec chiński | `meleeDefence` | 4 | 8 |
| Jeździec chiński | `piercing` | 2 | 4 |
| Jeździec chiński | `weaponDamage` | 5 | 10 |
| Rydwan konny | `Atak` | 6 | 12 |
| Rydwan konny | `Health` | 180 | 360 |
| Rydwan konny | `Obrona` | 2 | 4 |
| Rydwan konny | `Pancerz` | 2 | 4 |
| Rydwan konny | `Przebicie` | 4 | 8 |
| Rydwan konny | `Uderzenie` | 8 | 16 |
| Rydwan konny | `armor` | 3 | 6 |
| Rydwan konny | `chargeBonus` | 8 | 16 |
| Rydwan konny | `fieldPower` | 54 | 108 |
| Rydwan konny | `health` | 56 | 112 |
| Rydwan konny | `meleeAttack` | 7 | 14 |
| Rydwan konny | `meleeDefence` | 4 | 8 |
| Rydwan konny | `piercing` | 2 | 4 |
| Rydwan konny | `weaponDamage` | 6 | 12 |
| Rydwan egipski | `Atak` | 4 | 8 |
| Rydwan egipski | `Atak dystansowy` | 4 | 8 |
| Rydwan egipski | `Health` | 180 | 360 |
| Rydwan egipski | `Obrona` | 2 | 4 |
| Rydwan egipski | `Pancerz` | 2 | 4 |
| Rydwan egipski | `Przebicie` | 4 | 8 |
| Rydwan egipski | `Uderzenie` | 6 | 12 |
| Rydwan egipski | `armor` | 2 | 4 |
| Rydwan egipski | `chargeBonus` | 7 | 14 |
| Rydwan egipski | `fieldPower` | 53 | 106 |
| Rydwan egipski | `health` | 56 | 112 |
| Rydwan egipski | `meleeAttack` | 6 | 12 |
| Rydwan egipski | `meleeDefence` | 4 | 8 |
| Rydwan egipski | `missileAttack` | 5 | 10 |
| Rydwan egipski | `piercing` | 2 | 4 |
| Rydwan egipski | `weaponDamage` | 5 | 10 |
| Rydwan sumeryjski | `Atak` | 8 | 16 |
| Rydwan sumeryjski | `Health` | 190 | 380 |
| Rydwan sumeryjski | `Obrona` | 4 | 8 |
| Rydwan sumeryjski | `Pancerz` | 2 | 4 |
| Rydwan sumeryjski | `Przebicie` | 4 | 8 |
| Rydwan sumeryjski | `Uderzenie` | 10 | 20 |
| Rydwan sumeryjski | `armor` | 3 | 6 |
| Rydwan sumeryjski | `chargeBonus` | 9 | 18 |
| Rydwan sumeryjski | `fieldPower` | 54.5 | 109.0 |
| Rydwan sumeryjski | `health` | 56 | 112 |
| Rydwan sumeryjski | `meleeAttack` | 7 | 14 |
| Rydwan sumeryjski | `meleeDefence` | 4 | 8 |
| Rydwan sumeryjski | `piercing` | 2 | 4 |
| Rydwan sumeryjski | `weaponDamage` | 6 | 12 |
| Rydwan mykeński | `Atak` | 6 | 12 |
| Rydwan mykeński | `Health` | 180 | 360 |
| Rydwan mykeński | `Obrona` | 2 | 4 |
| Rydwan mykeński | `Pancerz` | 2 | 4 |
| Rydwan mykeński | `Przebicie` | 4 | 8 |
| Rydwan mykeński | `Uderzenie` | 8 | 16 |
| Rydwan mykeński | `armor` | 2 | 4 |
| Rydwan mykeński | `chargeBonus` | 9 | 18 |
| Rydwan mykeński | `fieldPower` | 52.5 | 105.0 |
| Rydwan mykeński | `health` | 52 | 104 |
| Rydwan mykeński | `meleeAttack` | 7 | 14 |
| Rydwan mykeński | `meleeDefence` | 3 | 6 |
| Rydwan mykeński | `piercing` | 3 | 6 |
| Rydwan mykeński | `weaponDamage` | 7 | 14 |
| Rydwan Shang | `Atak` | 6 | 12 |
| Rydwan Shang | `Health` | 190 | 380 |
| Rydwan Shang | `Obrona` | 2 | 4 |
| Rydwan Shang | `Pancerz` | 2 | 4 |
| Rydwan Shang | `Przebicie` | 4 | 8 |
| Rydwan Shang | `Uderzenie` | 8 | 16 |
| Rydwan Shang | `armor` | 3 | 6 |
| Rydwan Shang | `chargeBonus` | 8 | 16 |
| Rydwan Shang | `fieldPower` | 58 | 116 |
| Rydwan Shang | `health` | 60 | 120 |
| Rydwan Shang | `meleeAttack` | 7 | 14 |
| Rydwan Shang | `meleeDefence` | 5 | 10 |
| Rydwan Shang | `piercing` | 3 | 6 |
| Rydwan Shang | `weaponDamage` | 6 | 12 |
| Rydwan celtycki | `Atak` | 7 | 14 |
| Rydwan celtycki | `Health` | 170 | 340 |
| Rydwan celtycki | `Obrona` | 2 | 4 |
| Rydwan celtycki | `Pancerz` | 1 | 2 |
| Rydwan celtycki | `Przebicie` | 4 | 8 |
| Rydwan celtycki | `Uderzenie` | 8 | 16 |
| Rydwan celtycki | `armor` | 2 | 4 |
| Rydwan celtycki | `chargeBonus` | 10 | 20 |
| Rydwan celtycki | `fieldPower` | 53 | 106 |
| Rydwan celtycki | `health` | 52 | 104 |
| Rydwan celtycki | `meleeAttack` | 8 | 16 |
| Rydwan celtycki | `meleeDefence` | 3 | 6 |
| Rydwan celtycki | `piercing` | 2 | 4 |
| Rydwan celtycki | `weaponDamage` | 7 | 14 |
| Konnica lancowa asyryjska | `Atak` | 10 | 20 |
| Konnica lancowa asyryjska | `Health` | 34 | 68 |
| Konnica lancowa asyryjska | `Obrona` | 5 | 10 |
| Konnica lancowa asyryjska | `Pancerz` | 5 | 10 |
| Konnica lancowa asyryjska | `Przebicie` | 6 | 12 |
| Konnica lancowa asyryjska | `Uderzenie` | 12 | 24 |
| Konnica lancowa asyryjska | `fieldPower` | 39 | 78 |
| Konnica lancowa asyryjska | `health` | 34 | 68 |
| Konnica lancowa asyryjska | `meleeAttack` | 9 | 18 |
| Konnica lancowa asyryjska | `meleeDefence` | 5 | 10 |
| Konnica lancowa asyryjska | `weaponDamage` | 8 | 16 |
| Konnica łucznicza asyryjska | `Atak` | 7 | 14 |
| Konnica łucznicza asyryjska | `Atak dystansowy` | 6 | 12 |
| Konnica łucznicza asyryjska | `Health` | 30 | 60 |
| Konnica łucznicza asyryjska | `Obrona` | 3 | 6 |
| Konnica łucznicza asyryjska | `Pancerz` | 3 | 6 |
| Konnica łucznicza asyryjska | `Przebicie` | 3 | 6 |
| Konnica łucznicza asyryjska | `Uderzenie` | 5 | 10 |
| Konnica łucznicza asyryjska | `fieldPower` | 27 | 54 |
| Konnica łucznicza asyryjska | `health` | 30 | 60 |
| Konnica łucznicza asyryjska | `meleeAttack` | 4 | 8 |
| Konnica łucznicza asyryjska | `meleeDefence` | 2 | 4 |
| Konnica łucznicza asyryjska | `missileAttack` | 6 | 12 |
| Konnica łucznicza asyryjska | `weaponDamage` | 3 | 6 |
| Jeździec z oszczepami | `Atak` | 7 | 14 |
| Jeździec z oszczepami | `Atak dystansowy` | 2 | 4 |
| Jeździec z oszczepami | `Health` | 28 | 56 |
| Jeździec z oszczepami | `Obrona` | 4 | 8 |
| Jeździec z oszczepami | `Pancerz` | 3 | 6 |
| Jeździec z oszczepami | `Przebicie` | 4 | 8 |
| Jeździec z oszczepami | `Uderzenie` | 6 | 12 |
| Jeździec z oszczepami | `fieldPower` | 32.5 | 65.0 |
| Jeździec z oszczepami | `health` | 28 | 56 |
| Jeździec z oszczepami | `meleeAttack` | 6 | 12 |
| Jeździec z oszczepami | `meleeDefence` | 4 | 8 |
| Jeździec z oszczepami | `missileAttack` | 7 | 14 |
| Jeździec z oszczepami | `weaponDamage` | 5 | 10 |
| Rydwan Kapadokijski | `Atak` | 8 | 16 |
| Rydwan Kapadokijski | `Health` | 36 | 72 |
| Rydwan Kapadokijski | `Obrona` | 3 | 6 |
| Rydwan Kapadokijski | `Pancerz` | 3 | 6 |
| Rydwan Kapadokijski | `Przebicie` | 5 | 10 |
| Rydwan Kapadokijski | `Uderzenie` | 9 | 18 |
| Rydwan Kapadokijski | `fieldPower` | 35 | 70 |
| Rydwan Kapadokijski | `health` | 36 | 72 |
| Rydwan Kapadokijski | `meleeAttack` | 7 | 14 |
| Rydwan Kapadokijski | `meleeDefence` | 3 | 6 |
| Rydwan Kapadokijski | `weaponDamage` | 7 | 14 |

TESTY:
- `node gra/tools/rydwan-konnica-x2-test.cjs` — PASS; 13 jednostek, 548 asercji; wszystkie pola bojowe x2, pola wykluczone niezmienione.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.
- `node gra/tools/combat-test.cjs` — PASS; 6/6 scenariuszy.
- `node gra/tools/army-hunger-combat-test.cjs` — PASS; 13/13 asercji.
- `node gra/tools/unit-info-card-badges-real-render-test.cjs` — PASS; Chromium/Playwright, 19/19 asercji, brak błędów konsoli/pageerror podczas renderu karty.
- Izolowany smoke Chromium/Playwright dla wszystkich 13 jednostek `Typ: Mount` — PASS; 13/13 kart utworzonych, nagłówki i sekcje statystyk obecne, brak błędów konsoli/pageerror.
- `node gra/tools/unit-power-test.cjs` — FAIL w dwóch istniejących asercjach dla `Hastati` (oczekiwane 50, runtime 57.5; suma oczekiwana 160, runtime 167.5). Test nie dotyczy żadnej zmienionej jednostki Mount; błąd występuje po instalacji zależności i przedmiotowy diff nie dotyka `unit-power.ts` ani danych Hastati.
- `git diff --check` — PASS.
- Pełny smoke uruchomieniowy aplikacji przez Vite nie został wykonany, ponieważ procedura projektu zabrania uruchamiania `npm run build`/`npm run dev` w `gra/`; zamiast tego wykonano realny render kart wszystkich jednostek Mount w Chromium.

BLOKADY:
- Brak blokady dla zmiany danych. Uwaga regresyjna: istniejący `unit-power-test.cjs` ma niezależny od tego tematu czerwony baseline dla Hastati.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator i Final Control; po ich zgodzie integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
