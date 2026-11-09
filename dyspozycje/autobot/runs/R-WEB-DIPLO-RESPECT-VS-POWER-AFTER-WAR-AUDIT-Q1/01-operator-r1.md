STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
GOAL: ustalić, czy niski Respekt (29/100) silniejszego gracza po wojnie to błąd kierunkowości, czy zamierzona reguła
ZMIANY/COMMIT: tylko nowy test charakteryzujący gra/tools/diplo-respect-power-test.cjs + ten raport (SHA: patrz commit "R-WEB-DIPLO-RESPECT-VS-POWER ... r1"). Brak zmian mechaniki, brak zmian w gra/src.
TESTY: node gra/tools/diplo-respect-power-test.cjs -> 10 PASS / 0 FAIL (prawdziwe funkcje silnika przez esbuild). Reszta bramek nie uruchamiana (brak zmian w src).
BLOKADY: decyzja produktowa (ABC niżej) — zadaje orkiestrator.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje diagnozę; orkiestrator zadaje ABC właścicielowi.
DEPLOY/PUSH: NIE WYKONANO

## 1. Diagnoza — to NIE jest odwrócony znak

Respekt = ratio-share `computeRespekt(self, partner) = round(100*self/(self+partner))` (diplomacy.ts:1665; SPEC-Respekt: >50 = self silniejszy). Moc = objectivePower (power-objective.ts; zawiera już bitwy/zniszczone jednostki jako składnik). Dla zrzutów 14682 (gracz) vs 1854 (Chińczycy): "Nasz respekt" = 89, "Ich respekt" = 11 (suma 100). Kierunek jest poprawny: przewaga mocy => wysoki Respekt gracza.

| Pytanie | Odpowiedź (źródło) |
|---|---|
| Pasek "Respekt" w audiencji | `powerLine.respekt = computeRespekt(moc gracza eff., moc AI eff.)` (main.ts ~24571) — liczony na bieżąco, nie kumulowany |
| Lista dyplomacji | "Nasz respekt" = computeRespekt(ME, ona), "Ich respekt" = computeRespekt(ona, ME) (main.ts ~8175) |
| rel.respekt AI->gracz (pętla AI) | nadpisywane co turę `computeRespekt(potAI, potPlr)` (main.ts ~40151) = udział mocy AI (11), czyli "jak silna jest AI", używane w willingnessAlly |
| Zdarzenia jednorazowe wygrana_bitwa +5, przewaga_militarna +15, slabszy -10 | zdefiniowane w applyDiplomaticEvent, ale NIGDZIE nie wołane z main.ts (martwe) i i tak nadpisywane co turę; wygrane bitwy wchodzą do Respektu tylko pośrednio przez Moc (ratio) |
| Czas wojny, zmęczenie, osobowość, kultura | brak wpływu na Respekt (zmęczenie działa w regułach pokoju, nie w Respekcie) |

### Skąd 29 na zrzucie (sprawca)
`effectiveNastawienieScores` -> `clampRelationForWar`: w wojnie Zaufanie+Respekt ścinane do WAR_RELATION_SCORE_CAP = 29 (progMinimalnyRelacja 30 - 1). Zaufanie 0 => Respekt wyświetlany jako 29, choć rzeczywisty wynosi 89 (lub ~67 wg efektywnych mocy). Jednocześnie wiersz "Relacja X/200" używa `audienceRelTotalEffective` = Zaufanie + efektywny Respekt BEZ ścięcia (stąd 67). Wniosek: pasek Respekt (29) i Relacja (67) są wzajemnie niespójne; tooltip paska ("Wyżej = jesteś silniejszy") kłóci się z wyświetlaną liczbą.

### Skąd -1,5/turę
computeTickZaufanieDelta w wojnie: dryf Wiarygodności wyłączony, dodatnie zerowane, ale `karaWspolnaGranica` -2 + `wspolnaReligia` +0,5 = -1,5/turę (buildDiplomacyTickCtxForPair, main.ts ~22145). "Relacja -1,5/turę" to alias Zaufania (`relacjaDeltaPerTurn = zaufanieDeltaPerTurn`), Respekt nie jest liczony do delty.

### Symulacja (test, 30 tur wojny, 14682 vs 1854, start Z=40)
Zaufanie 40 -> 0 (dno po 27 tur), rel.respekt AI->gracz stale 11, pasek gracza w wojnie 29 (realnie 89), w pokoju 89. Respekt nie rośnie za wygrane bitwy ani czas wojny — rośnie tylko, gdy zmienia się stosunek Mocy.

## 2. Wniosek: reguła zamierzona + błąd prezentacji
- Mechanika Respektu (ratio-share, silniejszy = wyższy) jest zgodna ze SPEC i nie ma odwróconego znaku.
- Realny defekt wyświetlania: ścięcie do 29 w wojnie ukrywa Respekt silniejszego gracza i rozjeżdża się z "Relacja". Naprawa wymaga wyboru (zmiana UI/semantyki), więc nie wprowadzam jej samowolnie.
- Wpływ na reguły: sojusz (próg Relacji 130 + Zaufanie 90) i pokój (20% przewagi, zmęczenie) NIE zależą od wyświetlanego ścięcia; ścięcie dotyka nastawienia/willingness AI w wojnie (relationScore<=29), co jest zamierzone ("w wojnie co najmniej Wrogi").

## 3. DECISION_REQUIRED (ABC, do zadania przez orkiestratora)
A) Bez zmian — zostawić ścięcie do 29. Plus: zero ryzyka. Minus: mylące dla gracza (zrzuty), niespójne z "Relacja".
B) (REKOMENDACJA) Naprawa prezentacji: pasek Respekt zawsze pokazuje prawdziwy Respekt (89), ścięcie wojenne stosować tylko do etykiety nastawienia ("Wrogi"); "Relacja" liczyć spójnie z paskami lub dopisać "(limit wojenny 29)"; tooltip "Respekt zależy od stosunku Mocy; w wojnie nastawienie ograniczone do Wrogiego". Plus: spójność, brak zmiany mechaniki/AI/pokoju. Minus: gracz w wojnie widzi Relację > 29 przy etykiecie "Wrogi" (wymaga rozstrzygnięcia, czy Relacja ma też być ścięta). Pliki: diplomacy-display.ts (effectiveNastawienieScores), ui/diplomacyAudience.ts:1448/2218, test.
C) Osobny składnik "Strach/Dominacja" (rosnący z przewagą i wygranymi bitwami/zdobytymi miastami, parametry w diplomacy-*.json) zamiast reinterpretacji Respektu. Plus: pełne odwzorowanie intuicji właściciela. Minus: duża zmiana (UI, AI willingness, save, REPIN Rust), wymaga progów liczbowych od właściciela.

Dług: po decyzji B/C — wpis LEDGER (REPIN Rust diplomacy-display / effectiveNastawienieScores).
