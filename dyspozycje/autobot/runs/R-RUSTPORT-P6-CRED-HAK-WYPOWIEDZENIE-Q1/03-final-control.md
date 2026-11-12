STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1
GOAL: hak P4 (chargeWarDeclarationCredibility) w wypowiedzeniu gracza, sojuszu i klastra
ZMIANY/COMMIT: brak zmian kodu. Baza 23e33793e; kod Operatora 2846a48f2 (potomek bazy, diff = tylko 01-operator-r1.md); eval d9fd22087; obrona 91366aec0. Allowlista zachowana.
TESTY: NIE_ZMIERZONO (brak kodu; BLOCK przed implementacja wg kryterium 5).
BLOKADY: ponizej.
RUNDY: 1/5
NASTEPNY KROK: nowe dispatche (decyzja orkiestratora)
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja samodzielna (git grep na 23e33793e)
- declare_war / declare_war_opts: tylko definicje (diplomacy_truce_flow.rs:239/247), zero wolajacych w engine/src.
- bridge.rs: zero trafien war/declare, EngineCommand nie ma komendy wypowiedzenia wojny.
- note_war_entered: wolany tylko z turn_war_dipl_steps.rs:895 (note_war_declarations, wojna AI z hamulca).
- declare_from_assignments (war_turn_declare.rs:141): zero wolajacych w engine/src.
- Pin 07d2fbd72 main.ts: wywolania 13168, 13205, 23806, 40441, 41931; definicja 12176. Zgodne z raportem.
- Klaster: brak odpowiednika resolveClusterCityStateWarOnPlayer w engine/src.

## Orzeczenie per zarzut
1. BLOCK potwierdzony: ODDAL (nie defekt Operatora; kryterium 5 spelnione, brak martwego wrappera).
2. Piny: ODDAL (potwierdzone).
3. Bramki nie uruchomione: ODDAL (brak kodu, NIE_ZMIERZONO).
4. Terminologia "trzy z czterech": ODDAL (kosmetyka; 4 sciezki / 5 wywolan).
5. Slaby dowod klastra: ODDAL (uzupelniony grepem powyzej).
6. Niewykonalne w obecnej formie: DO DECYZJI CZLOWIEKA (rozbicie tematu, patrz nizej); nie jest defektem pracy.
7. Commit eval d9fd22087 lokalny: ODDAL.
Brak NAPRAW => PASS-WITH-NOTES.

## Decyzje czlowieka / orkiestratora
- Nowy temat: komenda wypowiedzenia wojny gracza w EngineCommand + wolanie declare_war_opts + hak P4 (pin 13168/13205).
- Osobno: deklaracja sojusznika (23806), wojna klastra (40441), produkcyjne wpiecie declare_from_assignments / declare_forced_wars.
- Kolejna runda Operatora na tym dispatchu nie ma sensu.
