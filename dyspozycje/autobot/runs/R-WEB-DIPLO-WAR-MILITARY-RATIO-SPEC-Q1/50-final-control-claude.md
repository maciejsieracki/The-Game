# R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (specyfikacja; zero zmian kodu gry)
TEMAT: R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1
GOAL: specyfikacja parametru wojennego `militaryRatioWar` zweryfikowana w kodzie (pliki runu; bez zmian w grze).
ZMIANY/COMMIT: kandydat do integracji = 7eb17e8a1 (potomek bazy 5d0c5f8d1; `git merge-base --is-ancestor` = TAK). `git diff --name-only 5d0c5f8d1 7eb17e8a1` = tylko `10-operator-claude.md` i `30-obrona-claude.md` w `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/` (allowlista OK; `gra/`, `WERSJE.md`, rejestr nietknięte). Ten raport: `50-final-control-claude.md` (osobny commit FC, nie do integracji jako kod).

## Weryfikacja dowodów (sprawdzone samodzielnie na 7eb17e8a1, kod = baza)
Wszystkie sprawdzone odwołania zgodne z opisem w specyfikacji/obronie:
- `power-objective.ts:241,244` — `armia` i `rekruci` z flagą `militaryKeys` (podwójne liczenie rekrutów w (a) i (c) potwierdzone).
- `diplomacy.ts:1141–1153` `clampRelationForWar` zmienia `respekt`; `:1094` (zwrot z `applyDiplomaticEvent`); `:1860–1872` (tick zapisuje obcięty respekt).
- `main.ts:11545–11563` `setDiploRelation` stempluje/zdejmuje `wojnaStartTura` synchronicznie przy zmianie statusu (zarzut 4 słuszny).
- `main.ts:34998` `applyMapBattleOutcome`, `:35027` `applyMilitaryWinRespectEvent` (punkt wpięcia licznika).
- `main.ts:24702–24708` propozycje nadpisują `respekt` z Mocy; `diplomacy-display.ts:437` panel liczy respekt z Mocy.
- `main.ts:11840–11858` hamulec (D7), `:12325`, `:13363`, `diplomacy-proposals.ts:1752`, `:2327` (`namow_wojne`), `ai.ts:6229` `PROG_WOJNA_SILA = 0.6`.
- `diplomacy.ts:1126–1138` (`militaryWinRespectPair`: remis -> null; tylko gdy zwycięzca jest człowiekiem — stąd licznik musi iść w `applyMapBattleOutcome`).
- `gra/data/diplomacy-war-peace-params.json:91` `"prog": 0.20` (poprawka numeru linii z obrony słuszna).
- Wzór po poprawce: `R_bitwy = (1+wA)/(1+wB)`, T11 (3 vs 1 -> 2, nie 4) — arytmetyka poprawna; przy symetrii pary oryginalny wzór rzeczywiście dawał kwadrat.

## Werdykt per zarzut
1. Podwójne liczenie rekrutów — ODDAL (poprawione w obronie, Z-H; dowód powyżej).
2. R_bitwy kwadrat / redundancja stanu — ODDAL (poprawione: stan = wygraneA/wygraneB, wzór bez kwadratu, T11).
3. Clamp a Respekt — ODDAL (zapis obcięty dowiedziony; zakres NIE ZWERYFIKOWANO dla pełnej listy czytelników zapisanego respektu jest uczciwie zadeklarowany i nie blokuje specyfikacji; K9 to osobny temat).
4. R3 stempel — ODDAL (R3 zawężone do zapisów sprzed stempla).
5. Niekompletność adresów — ODDAL (uzupełnione: hak gracza, hamulec, namow_wojne x2, punkt końca bitwy; pozostałe luki jawnie NIE ZWERYFIKOWANO i przesunięte do K7/K3 jako zadania rozpoznania, bez fałszywych twierdzeń).
6. Sprzeczność „zero pytań” — ODDAL (Z-D to próg liczbowy, CLAUDE.md §3 wymaga ABC; K1 nie zależy od Z-D; sformułowanie poprawione w obronie).
7. Z-G vs zał. 5 — ODDAL (dodany wariant Z-G2; domyślnie Z-G).
DO DECYZJI CZŁOWIEKA (nie jest NAPRAW, nie powoduje FAIL): Z-H. Obrona zmienia domyślnie założenie właściciela 3(a) „Armia + Rekruci” na „tylko Armia” (rekruci przez pulę 3(c)). Rozbieżność jest jawnie zapisana, ale wartość domyślna nadpisuje zatwierdzone założenie; wariant dosłowny (Armia+Rekruci w (a) oraz pula w (c), świadome podwójne ważenie) powinien być równorzędnie widoczny przy decyzji. Dodatkowo Z-D (próg liczbowy) = ABC przed K5.

## Uwagi (PASS-WITH-NOTES)
- Poprawiona specyfikacja jest w `30-obrona-claude.md` p.A–D i NADPISUJE p.4a/4b, p.8, NASTĘPNY KROK oraz testy w `10-operator-claude.md`, którego nie edytowano. Orkiestrator ma czytać oba pliki, przy sprzeczności wiąże 30-obrona.
- Sekcja p.8 w `10-operator-claude.md` i sekcja C w obronie nie zawierają słowa „pytanie” (kryterium dispatchu spełnione).
- Obrona sama przyznaje, że nie uruchomiła osobno `git diff --check`; brak zmian kodu, dokumenty tekstowe.

TESTY: `tsc --noEmit`, testy tematu i 5 bramek referencyjnych: NIE_DOTYCZY (zero zmian kodu; potwierdzone diffem plików). Chromium/UI: NIE_DOTYCZY. Odwołania plik:linia: sprawdzone ~20 samodzielnie (patrz wyżej), wszystkie zgodne.
BLOKADY: brak blokad FC. Luki rozpoznania (NIE ZWERYFIKOWANO, przesunięte do wdrożenia): UI kliknięcia wypowiedzenia wojny, `forced-war-bronze/iron/stone/waves.ts`, komponent panelu wojny (K7), `main.ts:6073`, pełna lista czytelników zapisanego respektu.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: orkiestrator integruje 7eb17e8a1 (wyłącznie dokumentacja runu), READY_FOR_DEPLOY nie dotyczy kodu; decyzje właściciela: Z-H (rekruci w (a)), Z-D (próg, ABC przed K5), opcjonalnie Z-G2/Z-B/Z-C2; potem dispatch K1.
DEPLOY/PUSH: NIE WYKONANO
