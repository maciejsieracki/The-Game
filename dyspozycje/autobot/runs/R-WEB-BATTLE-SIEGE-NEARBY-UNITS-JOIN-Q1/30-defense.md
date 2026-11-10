# R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — Obrona po Final Control FAIL (2026-11-10)

Kandydat źródłowy: `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5`.

## Zarzut FC-1: helper poza zatwierdzoną allowlistą

**Przyjęty jako prawidłowa uwaga procesowa; zakres skorygowany przez orkiestratora 2026-11-10.** `gra/src/game/diplomacy-siege-war-gate.ts` zawiera dodany helper do wyznaczania członków obu stron oblężenia. To wąski wspólny seam, który używa istniejącej bramki rzeczywistej wojny oraz formalnego aktywnego sojuszu. Nie był wymieniony w pierwotnej szczegółowej allowliście `10` ani jednoznacznie objęty ogólną listą `siege*.ts`. Nie twierdzę, że był autoryzowany przed edycją. Orkiestrator autoryzował jego zachowanie w kandydacie ze względu na wspólny predykat; ponowna ocena FC ma potwierdzić zgodność po jawnej korekcie dokumentacji `00` i `10`.

## Zarzut FC-2: brak dokładnego wpisu LEDGER

**Przyjęty jako prawidłowa uwaga procesowa; wpis uzupełniony przez orkiestratora 2026-11-10.** W chwili pierwotnej kontroli LEDGER zawierał jedynie ogólną kolejkę oblężenia P3–P5 i nie wiązał tego dokładnego ID ani web commitu z wymaganiem parytetu. Dodano wpis w `dyspozycje/rust-port/LEDGER.md` z dokładnym ID, commitem `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5`, opisem wymogu parytetu Rust P3+ oraz jawnym statusem `NIE ROZPOCZĘTO / odroczone do P3+`. Wpis nie oznacza rozpoczęcia pracy Rust.

## Status

Zarzuty formalne zostały skorygowane dokumentacyjnie i zakresowo, lecz werdykt **FAIL pozostaje w mocy** do niezależnego Final Control follow-up. Nie zmieniono mechaniki produktu w tej rundzie. Kandydat webowy nie został zintegrowany ani wydany.
