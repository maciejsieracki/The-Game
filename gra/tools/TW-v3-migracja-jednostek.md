# TW v3 — migracja jednostek

Data: 2026-06-29

Reguły:
- ÷10: Atak, Obrona, Obrażenia, Pancerz, Przebicie, Uderzenie (hard input ze skali 0-100)
- 1:1: Atak dystansowy (stary silnik nie dzielił)
- health × 0,25
- liczby całkowite
- Hastati: meleeAttack=8, weaponDamage=8 (nerf playtest)

| Jednostka | Pole | Stara | Nowa |
|---|---|---:|---:|
| Wojownik | meleeAttack | 45 | 4 |
| Wojownik | meleeDefence | 38 | 4 |
| Wojownik | weaponDamage | 45 | 4 |
| Wojownik | armor | 20 | 2 |
| Wojownik | piercing | 10 | 1 |
| Wojownik | chargeBonus | 20 | 2 |
| Wojownik | health | 45 | 11 |
| Wojownik | missileAttack | 0 | 0 |
| Procarz | meleeAttack | 2 | 0 |
| Procarz | meleeDefence | 4 | 0 |
| Procarz | weaponDamage | 0 | 0 |
| Procarz | armor | 2 | 0 |
| Procarz | piercing | 2 | 0 |
| Procarz | chargeBonus | 2 | 0 |
| Procarz | health | 10 | 2 |
| Procarz | missileAttack | 8 | 8 |
| Oszczepnik | meleeAttack | 4 | 0 |
| Oszczepnik | meleeDefence | 4 | 0 |
| Oszczepnik | weaponDamage | 0 | 0 |
| Oszczepnik | armor | 2 | 0 |
| Oszczepnik | piercing | 2 | 0 |
| Oszczepnik | chargeBonus | 2 | 0 |
| Oszczepnik | health | 10 | 2 |
| Oszczepnik | missileAttack | 8 | 8 |
| Łucznik | meleeAttack | 30 | 3 |
| Łucznik | meleeDefence | 20 | 2 |
| Łucznik | weaponDamage | 35 | 4 |
| Łucznik | armor | 10 | 1 |
| Łucznik | piercing | 15 | 2 |
| Łucznik | chargeBonus | 10 | 1 |
| Łucznik | health | 30 | 8 |
| Łucznik | missileAttack | 35 | 35 |
| Zwiadowca | meleeAttack | 5 | 0 |
| Zwiadowca | meleeDefence | 10 | 1 |
| Zwiadowca | weaponDamage | 0 | 0 |
| Zwiadowca | armor | 0 | 0 |
| Zwiadowca | piercing | 0 | 0 |
| Zwiadowca | chargeBonus | 0 | 0 |
| Zwiadowca | health | 20 | 5 |
| Zwiadowca | missileAttack | 0 | 0 |
| Włócznik | meleeAttack | 50 | 5 |
| Włócznik | meleeDefence | 80 | 8 |
| Włócznik | weaponDamage | 50 | 5 |
| Włócznik | armor | 55 | 6 |
| Włócznik | piercing | 20 | 2 |
| Włócznik | chargeBonus | 40 | 4 |
| Włócznik | health | 65 | 16 |
| Włócznik | missileAttack | 0 | 0 |
| Wojownik z mieczem i tarczą | meleeAttack | 60 | 6 |
| Wojownik z mieczem i tarczą | meleeDefence | 48 | 5 |
| Wojownik z mieczem i tarczą | weaponDamage | 65 | 6 |
| Wojownik z mieczem i tarczą | armor | 35 | 4 |
| Wojownik z mieczem i tarczą | piercing | 20 | 2 |
| Wojownik z mieczem i tarczą | chargeBonus | 35 | 4 |
| Wojownik z mieczem i tarczą | health | 55 | 14 |
| Wojownik z mieczem i tarczą | missileAttack | 0 | 0 |
| Rydwan (woły) | meleeAttack | 65 | 6 |
| Rydwan (woły) | meleeDefence | 40 | 4 |
| Rydwan (woły) | weaponDamage | 70 | 7 |
| Rydwan (woły) | armor | 25 | 2 |
| Rydwan (woły) | piercing | 30 | 3 |
| Rydwan (woły) | chargeBonus | 90 | 9 |
| Rydwan (woły) | health | 80 | 20 |
| Rydwan (woły) | missileAttack | 0 | 0 |
| Konnica | meleeAttack | 80 | 8 |
| Konnica | meleeDefence | 55 | 6 |
| Konnica | weaponDamage | 80 | 8 |
| Konnica | armor | 40 | 4 |
| Konnica | piercing | 60 | 6 |
| Konnica | chargeBonus | 100 | 10 |
| Konnica | health | 65 | 16 |
| Konnica | missileAttack | 0 | 0 |
| Galera | meleeAttack | 4 | 0 |
| Galera | meleeDefence | 4 | 0 |
| Galera | weaponDamage | 0 | 0 |
| Galera | armor | 0 | 0 |
| Galera | piercing | 0 | 0 |
| Galera | chargeBonus | 4 | 0 |
| Galera | health | 50 | 12 |
| Galera | missileAttack | 0 | 0 |
| Falanga | meleeAttack | 48 | 5 |
| Falanga | meleeDefence | 100 | 10 |
| Falanga | weaponDamage | 45 | 4 |
| Falanga | armor | 85 | 8 |
| Falanga | piercing | 15 | 2 |
| Falanga | chargeBonus | 70 | 7 |
| Falanga | health | 100 | 25 |
| Falanga | missileAttack | 0 | 0 |
| Hieros Lochos (Święty Zastęp) | meleeAttack | 8 | 1 |
| Hieros Lochos (Święty Zastęp) | meleeDefence | 10 | 1 |
| Hieros Lochos (Święty Zastęp) | weaponDamage | 0 | 0 |
| Hieros Lochos (Święty Zastęp) | armor | 6 | 1 |
| Hieros Lochos (Święty Zastęp) | piercing | 4 | 0 |
| Hieros Lochos (Święty Zastęp) | chargeBonus | 8 | 1 |
| Hieros Lochos (Święty Zastęp) | health | 85 | 21 |
| Hieros Lochos (Święty Zastęp) | missileAttack | 0 | 0 |
| Hastati | meleeAttack | 88 | 8 |
| Hastati | meleeDefence | 70 | 7 |
| Hastati | weaponDamage | 100 | 8 |
| Hastati | armor | 90 | 9 |
| Hastati | piercing | 40 | 4 |
| Hastati | chargeBonus | 80 | 8 |
| Hastati | health | 75 | 19 |
| Hastati | missileAttack | 6 | 6 |
| Triari | meleeAttack | 8 | 1 |
| Triari | meleeDefence | 8 | 1 |
| Triari | weaponDamage | 0 | 0 |
| Triari | armor | 6 | 1 |
| Triari | piercing | 4 | 0 |
| Triari | chargeBonus | 10 | 1 |
| Triari | health | 85 | 21 |
| Triari | missileAttack | 0 | 0 |
| Jeździec chiński | meleeAttack | 8 | 1 |
| Jeździec chiński | meleeDefence | 4 | 0 |
| Jeździec chiński | weaponDamage | 0 | 0 |
| Jeździec chiński | armor | 4 | 0 |
| Jeździec chiński | piercing | 4 | 0 |
| Jeździec chiński | chargeBonus | 10 | 1 |
| Jeździec chiński | health | 75 | 19 |
| Jeździec chiński | missileAttack | 0 | 0 |
| Kusznik | meleeAttack | 8 | 1 |
| Kusznik | meleeDefence | 4 | 0 |
| Kusznik | weaponDamage | 0 | 0 |
| Kusznik | armor | 2 | 0 |
| Kusznik | piercing | 2 | 0 |
| Kusznik | chargeBonus | 4 | 0 |
| Kusznik | health | 20 | 5 |
| Kusznik | missileAttack | 10 | 10 |
| Hu Ben Wei (Gwardia Tygrysa) | meleeAttack | 10 | 1 |
| Hu Ben Wei (Gwardia Tygrysa) | meleeDefence | 7 | 1 |
| Hu Ben Wei (Gwardia Tygrysa) | weaponDamage | 0 | 0 |
| Hu Ben Wei (Gwardia Tygrysa) | armor | 6 | 1 |
| Hu Ben Wei (Gwardia Tygrysa) | piercing | 4 | 0 |
| Hu Ben Wei (Gwardia Tygrysa) | chargeBonus | 8 | 1 |
| Hu Ben Wei (Gwardia Tygrysa) | health | 80 | 20 |
| Hu Ben Wei (Gwardia Tygrysa) | missileAttack | 0 | 0 |
| Impi | meleeAttack | 3 | 0 |
| Impi | meleeDefence | 6 | 1 |
| Impi | weaponDamage | 0 | 0 |
| Impi | armor | 4 | 0 |
| Impi | piercing | 2 | 0 |
| Impi | chargeBonus | 6 | 1 |
| Impi | health | 70 | 18 |
| Impi | missileAttack | 0 | 0 |
| Oszczepnik Zulu (Izijula) | meleeAttack | 4 | 0 |
| Oszczepnik Zulu (Izijula) | meleeDefence | 4 | 0 |
| Oszczepnik Zulu (Izijula) | weaponDamage | 0 | 0 |
| Oszczepnik Zulu (Izijula) | armor | 2 | 0 |
| Oszczepnik Zulu (Izijula) | piercing | 2 | 0 |
| Oszczepnik Zulu (Izijula) | chargeBonus | 2 | 0 |
| Oszczepnik Zulu (Izijula) | health | 20 | 5 |
| Oszczepnik Zulu (Izijula) | missileAttack | 9 | 9 |
| uThulwana (Białe Tarcze) | meleeAttack | 8 | 1 |
| uThulwana (Białe Tarcze) | meleeDefence | 7 | 1 |
| uThulwana (Białe Tarcze) | weaponDamage | 0 | 0 |
| uThulwana (Białe Tarcze) | armor | 6 | 1 |
| uThulwana (Białe Tarcze) | piercing | 4 | 0 |
| uThulwana (Białe Tarcze) | chargeBonus | 10 | 1 |
| uThulwana (Białe Tarcze) | health | 85 | 21 |
| uThulwana (Białe Tarcze) | missileAttack | 0 | 0 |
| Wojownik z maczugą (Chaska) | meleeAttack | 8 | 1 |
| Wojownik z maczugą (Chaska) | meleeDefence | 4 | 0 |
| Wojownik z maczugą (Chaska) | weaponDamage | 0 | 0 |
| Wojownik z maczugą (Chaska) | armor | 2 | 0 |
| Wojownik z maczugą (Chaska) | piercing | 6 | 1 |
| Wojownik z maczugą (Chaska) | chargeBonus | 8 | 1 |
| Wojownik z maczugą (Chaska) | health | 40 | 10 |
| Wojownik z maczugą (Chaska) | missileAttack | 0 | 0 |
| Wojownik z toporem | meleeAttack | 8 | 1 |
| Wojownik z toporem | meleeDefence | 4 | 0 |
| Wojownik z toporem | weaponDamage | 0 | 0 |
| Wojownik z toporem | armor | 2 | 0 |
| Wojownik z toporem | piercing | 8 | 1 |
| Wojownik z toporem | chargeBonus | 6 | 1 |
| Wojownik z toporem | health | 50 | 12 |
| Wojownik z toporem | missileAttack | 0 | 0 |
| Procarz (Huaracoc) | meleeAttack | 2 | 0 |
| Procarz (Huaracoc) | meleeDefence | 4 | 0 |
| Procarz (Huaracoc) | weaponDamage | 0 | 0 |
| Procarz (Huaracoc) | armor | 2 | 0 |
| Procarz (Huaracoc) | piercing | 2 | 0 |
| Procarz (Huaracoc) | chargeBonus | 2 | 0 |
| Procarz (Huaracoc) | health | 10 | 2 |
| Procarz (Huaracoc) | missileAttack | 8 | 8 |
| Oszczepnik (Estólica) | meleeAttack | 4 | 0 |
| Oszczepnik (Estólica) | meleeDefence | 4 | 0 |
| Oszczepnik (Estólica) | weaponDamage | 0 | 0 |
| Oszczepnik (Estólica) | armor | 2 | 0 |
| Oszczepnik (Estólica) | piercing | 2 | 0 |
| Oszczepnik (Estólica) | chargeBonus | 2 | 0 |
| Oszczepnik (Estólica) | health | 10 | 2 |
| Oszczepnik (Estólica) | missileAttack | 8 | 8 |
| Królewska Gwardia | meleeAttack | 10 | 1 |
| Królewska Gwardia | meleeDefence | 8 | 1 |
| Królewska Gwardia | weaponDamage | 0 | 0 |
| Królewska Gwardia | armor | 6 | 1 |
| Królewska Gwardia | piercing | 4 | 0 |
| Królewska Gwardia | chargeBonus | 8 | 1 |
| Królewska Gwardia | health | 80 | 20 |
| Królewska Gwardia | missileAttack | 0 | 0 |
| Rydwan konny | meleeAttack | 6 | 1 |
| Rydwan konny | meleeDefence | 2 | 0 |
| Rydwan konny | weaponDamage | 0 | 0 |
| Rydwan konny | armor | 2 | 0 |
| Rydwan konny | piercing | 4 | 0 |
| Rydwan konny | chargeBonus | 8 | 1 |
| Rydwan konny | health | 90 | 22 |
| Rydwan konny | missileAttack | 0 | 0 |
| Łucznik egipski | meleeAttack | 4 | 0 |
| Łucznik egipski | meleeDefence | 6 | 1 |
| Łucznik egipski | weaponDamage | 0 | 0 |
| Łucznik egipski | armor | 2 | 0 |
| Łucznik egipski | piercing | 2 | 0 |
| Łucznik egipski | chargeBonus | 2 | 0 |
| Łucznik egipski | health | 20 | 5 |
| Łucznik egipski | missileAttack | 10 | 10 |
| Rydwan egipski | meleeAttack | 4 | 0 |
| Rydwan egipski | meleeDefence | 2 | 0 |
| Rydwan egipski | weaponDamage | 0 | 0 |
| Rydwan egipski | armor | 2 | 0 |
| Rydwan egipski | piercing | 4 | 0 |
| Rydwan egipski | chargeBonus | 6 | 1 |
| Rydwan egipski | health | 90 | 22 |
| Rydwan egipski | missileAttack | 8 | 8 |
| Wojownik z khopesh | meleeAttack | 6 | 1 |
| Wojownik z khopesh | meleeDefence | 6 | 1 |
| Wojownik z khopesh | weaponDamage | 0 | 0 |
| Wojownik z khopesh | armor | 6 | 1 |
| Wojownik z khopesh | piercing | 4 | 0 |
| Wojownik z khopesh | chargeBonus | 6 | 1 |
| Wojownik z khopesh | health | 50 | 12 |
| Wojownik z khopesh | missileAttack | 0 | 0 |
| Medżaj (Gwardia Faraona) | meleeAttack | 10 | 1 |
| Medżaj (Gwardia Faraona) | meleeDefence | 8 | 1 |
| Medżaj (Gwardia Faraona) | weaponDamage | 0 | 0 |
| Medżaj (Gwardia Faraona) | armor | 6 | 1 |
| Medżaj (Gwardia Faraona) | piercing | 4 | 0 |
| Medżaj (Gwardia Faraona) | chargeBonus | 8 | 1 |
| Medżaj (Gwardia Faraona) | health | 85 | 21 |
| Medżaj (Gwardia Faraona) | missileAttack | 6 | 6 |
| Łucznik sumeryjski | meleeAttack | 4 | 0 |
| Łucznik sumeryjski | meleeDefence | 6 | 1 |
| Łucznik sumeryjski | weaponDamage | 0 | 0 |
| Łucznik sumeryjski | armor | 2 | 0 |
| Łucznik sumeryjski | piercing | 2 | 0 |
| Łucznik sumeryjski | chargeBonus | 2 | 0 |
| Łucznik sumeryjski | health | 20 | 5 |
| Łucznik sumeryjski | missileAttack | 8 | 8 |
| Rydwan sumeryjski | meleeAttack | 8 | 1 |
| Rydwan sumeryjski | meleeDefence | 4 | 0 |
| Rydwan sumeryjski | weaponDamage | 0 | 0 |
| Rydwan sumeryjski | armor | 2 | 0 |
| Rydwan sumeryjski | piercing | 4 | 0 |
| Rydwan sumeryjski | chargeBonus | 10 | 1 |
| Rydwan sumeryjski | health | 95 | 24 |
| Rydwan sumeryjski | missileAttack | 0 | 0 |
| Włócznik sumeryjski | meleeAttack | 4 | 0 |
| Włócznik sumeryjski | meleeDefence | 8 | 1 |
| Włócznik sumeryjski | weaponDamage | 0 | 0 |
| Włócznik sumeryjski | armor | 6 | 1 |
| Włócznik sumeryjski | piercing | 2 | 0 |
| Włócznik sumeryjski | chargeBonus | 6 | 1 |
| Włócznik sumeryjski | health | 82 | 20 |
| Włócznik sumeryjski | missileAttack | 0 | 0 |
| Gwardia Królewska Sumeru | meleeAttack | 10 | 1 |
| Gwardia Królewska Sumeru | meleeDefence | 8 | 1 |
| Gwardia Królewska Sumeru | weaponDamage | 0 | 0 |
| Gwardia Królewska Sumeru | armor | 6 | 1 |
| Gwardia Królewska Sumeru | piercing | 4 | 0 |
| Gwardia Królewska Sumeru | chargeBonus | 8 | 1 |
| Gwardia Królewska Sumeru | health | 85 | 21 |
| Gwardia Królewska Sumeru | missileAttack | 0 | 0 |
| Wojownik mykeński | meleeAttack | 6 | 1 |
| Wojownik mykeński | meleeDefence | 6 | 1 |
| Wojownik mykeński | weaponDamage | 0 | 0 |
| Wojownik mykeński | armor | 6 | 1 |
| Wojownik mykeński | piercing | 4 | 0 |
| Wojownik mykeński | chargeBonus | 8 | 1 |
| Wojownik mykeński | health | 55 | 14 |
| Wojownik mykeński | missileAttack | 0 | 0 |
| Rydwan mykeński | meleeAttack | 6 | 1 |
| Rydwan mykeński | meleeDefence | 2 | 0 |
| Rydwan mykeński | weaponDamage | 0 | 0 |
| Rydwan mykeński | armor | 2 | 0 |
| Rydwan mykeński | piercing | 4 | 0 |
| Rydwan mykeński | chargeBonus | 8 | 1 |
| Rydwan mykeński | health | 90 | 22 |
| Rydwan mykeński | missileAttack | 0 | 0 |
| Wojownik Sherden | meleeAttack | 7 | 1 |
| Wojownik Sherden | meleeDefence | 6 | 1 |
| Wojownik Sherden | weaponDamage | 0 | 0 |
| Wojownik Sherden | armor | 4 | 0 |
| Wojownik Sherden | piercing | 4 | 0 |
| Wojownik Sherden | chargeBonus | 6 | 1 |
| Wojownik Sherden | health | 55 | 14 |
| Wojownik Sherden | missileAttack | 0 | 0 |
| Halabardnik Shang | meleeAttack | 7 | 1 |
| Halabardnik Shang | meleeDefence | 5 | 0 |
| Halabardnik Shang | weaponDamage | 0 | 0 |
| Halabardnik Shang | armor | 4 | 0 |
| Halabardnik Shang | piercing | 6 | 1 |
| Halabardnik Shang | chargeBonus | 6 | 1 |
| Halabardnik Shang | health | 50 | 12 |
| Halabardnik Shang | missileAttack | 0 | 0 |
| Rydwan Shang | meleeAttack | 6 | 1 |
| Rydwan Shang | meleeDefence | 2 | 0 |
| Rydwan Shang | weaponDamage | 0 | 0 |
| Rydwan Shang | armor | 2 | 0 |
| Rydwan Shang | piercing | 4 | 0 |
| Rydwan Shang | chargeBonus | 8 | 1 |
| Rydwan Shang | health | 95 | 24 |
| Rydwan Shang | missileAttack | 0 | 0 |
| Łucznik akadyjski | meleeAttack | 4 | 0 |
| Łucznik akadyjski | meleeDefence | 6 | 1 |
| Łucznik akadyjski | weaponDamage | 0 | 0 |
| Łucznik akadyjski | armor | 2 | 0 |
| Łucznik akadyjski | piercing | 2 | 0 |
| Łucznik akadyjski | chargeBonus | 2 | 0 |
| Łucznik akadyjski | health | 25 | 6 |
| Łucznik akadyjski | missileAttack | 11 | 11 |
| Wojownik celtycki | meleeAttack | 8 | 1 |
| Wojownik celtycki | meleeDefence | 5 | 0 |
| Wojownik celtycki | weaponDamage | 0 | 0 |
| Wojownik celtycki | armor | 3 | 0 |
| Wojownik celtycki | piercing | 4 | 0 |
| Wojownik celtycki | chargeBonus | 6 | 1 |
| Wojownik celtycki | health | 55 | 14 |
| Wojownik celtycki | missileAttack | 0 | 0 |
| Gaesatae | meleeAttack | 10 | 1 |
| Gaesatae | meleeDefence | 2 | 0 |
| Gaesatae | weaponDamage | 0 | 0 |
| Gaesatae | armor | 0 | 0 |
| Gaesatae | piercing | 2 | 0 |
| Gaesatae | chargeBonus | 8 | 1 |
| Gaesatae | health | 45 | 11 |
| Gaesatae | missileAttack | 0 | 0 |
| Rydwan celtycki | meleeAttack | 7 | 1 |
| Rydwan celtycki | meleeDefence | 2 | 0 |
| Rydwan celtycki | weaponDamage | 0 | 0 |
| Rydwan celtycki | armor | 1 | 0 |
| Rydwan celtycki | piercing | 4 | 0 |
| Rydwan celtycki | chargeBonus | 8 | 1 |
| Rydwan celtycki | health | 85 | 21 |
| Rydwan celtycki | missileAttack | 0 | 0 |
| Wojownik germański | meleeAttack | 6 | 1 |
| Wojownik germański | meleeDefence | 6 | 1 |
| Wojownik germański | weaponDamage | 0 | 0 |
| Wojownik germański | armor | 2 | 0 |
| Wojownik germański | piercing | 2 | 0 |
| Wojownik germański | chargeBonus | 7 | 1 |
| Wojownik germański | health | 60 | 15 |
| Wojownik germański | missileAttack | 7 | 7 |
| Berserker germański | meleeAttack | 10 | 1 |
| Berserker germański | meleeDefence | 2 | 0 |
| Berserker germański | weaponDamage | 0 | 0 |
| Berserker germański | armor | 0 | 0 |
| Berserker germański | piercing | 4 | 0 |
| Berserker germański | chargeBonus | 8 | 1 |
| Berserker germański | health | 50 | 12 |
| Berserker germański | missileAttack | 0 | 0 |
| Taran | meleeAttack | 3 | 0 |
| Taran | meleeDefence | 2 | 0 |
| Taran | weaponDamage | 0 | 0 |
| Taran | armor | 8 | 1 |
| Taran | piercing | 8 | 1 |
| Taran | chargeBonus | 10 | 1 |
| Taran | health | 1400 | 350 |
| Taran | missileAttack | 0 | 0 |
| Katapulta | meleeAttack | 1 | 0 |
| Katapulta | meleeDefence | 1 | 0 |
| Katapulta | weaponDamage | 0 | 0 |
| Katapulta | armor | 0 | 0 |
| Katapulta | piercing | 6 | 1 |
| Katapulta | chargeBonus | 0 | 0 |
| Katapulta | health | 500 | 125 |
| Katapulta | missileAttack | 16 | 16 |
| Wieża oblężnicza | meleeAttack | 0 | 0 |
| Wieża oblężnicza | meleeDefence | 4 | 0 |
| Wieża oblężnicza | weaponDamage | 0 | 0 |
| Wieża oblężnicza | armor | 6 | 1 |
| Wieża oblężnicza | piercing | 0 | 0 |
| Wieża oblężnicza | chargeBonus | 0 | 0 |
| Wieża oblężnicza | health | 1800 | 450 |
| Wieża oblężnicza | missileAttack | 0 | 0 |
| Wojownik tyrreński | meleeAttack | 8 | 1 |
| Wojownik tyrreński | meleeDefence | 4 | 0 |
| Wojownik tyrreński | weaponDamage | 0 | 0 |
| Wojownik tyrreński | armor | 3 | 0 |
| Wojownik tyrreński | piercing | 5 | 0 |
| Wojownik tyrreński | chargeBonus | 7 | 1 |
| Wojownik tyrreński | health | 50 | 12 |
| Wojownik tyrreński | missileAttack | 0 | 0 |
| Wojownik szekelesz | meleeAttack | 5 | 0 |
| Wojownik szekelesz | meleeDefence | 7 | 1 |
| Wojownik szekelesz | weaponDamage | 0 | 0 |
| Wojownik szekelesz | armor | 4 | 0 |
| Wojownik szekelesz | piercing | 5 | 0 |
| Wojownik szekelesz | chargeBonus | 5 | 0 |
| Wojownik szekelesz | health | 55 | 14 |
| Wojownik szekelesz | missileAttack | 0 | 0 |

**Jednostek:** 50