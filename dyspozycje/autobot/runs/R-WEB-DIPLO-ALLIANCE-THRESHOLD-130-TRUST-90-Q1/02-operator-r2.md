STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-THRESHOLD-130-TRUST-90-Q1
GOAL: DODATEK 1 (runda 2): rdzen 130/90 pomija TYLKO hegemona i kare sily; gotowosc AI zostaje; AI proponujace stosuje ten sam rdzen; NAP bezterminowy osobny parametr 151; sync wiki
ZMIANY/COMMIT: BAZA 34c7dfd72 (web-wip/ALLY13090, kod r1). Pliki: gra/src/game/diplomacy-proposals.ts (evaluateProposal: gotowosc nie pomijana, kara penaltyAlly pomijana przy rdzeniu, komunikat "Brak gotowosci do sojuszu (gotowosc X, wymagana Y)"), gra/src/game/diplomacy.ts (aiDiplomacyStance: rdzen pomija hegemona / progi z kara / allyWPenalty; nowy DIPLOMACY_PARAMS.progNapBezterminowyRelacja=151, na liscie progow Relacji skalowanych trudnoscia), gra/src/types/diplomacy.ts, gra/data/diplomacy.json (progNapBezterminowyRelacja 151), gra/src/game/ai.ts (P3b napIndefinite -> progNapBezterminowyRelacja; P5 zaproponuj_sojusz: allianceCoreMet pomija hegemona-proponenta i kare, gotowosc zostaje), testy (diplomacy-proposal-test, ai-test T9l/T9m, diplo-aggressor-wiring-test licznik 2->3), wiki: docs/PORADNIK-GRACZA/12-dyplomacja.md, docs/encyklopedia/pojecia/wiarygodnosc.md, docs/decyzje/HANDEL-PUNKTY-AKCEPTACJI.md, gra/src/data/wikiBundle.json (wygenerowany bundle-wiki-for-game.cjs). SHA: patrz odpowiedz koncowa.

## A. Gotowosc AI zostaje
Przy rdzeniu w evaluateProposal pomijane: hegemon, penaltyZ/penaltyScore (progi bazowe), "za slaby proponent", penaltyAlly. Gotowosc: wymagane willingnessAlly >= progSojuszWillingnessMin (0.68) - ulga proponenta (bez kary sily). Progu 0.68 NIE zmieniano.
Pomiar willingnessAlly przy DOKLADNIE Zaufanie 90 / Relacja 130 (rdzen spelniony, scoreFactor=0), rowna sila: Chinczycy 0,74 (przechodzi), Inkowie 0,69 (przechodzi), Grecy 0,64, Rzymianie/Egipt/Babilon/Sumer/Celtowie/Germanie/Harappa/Hetyci/Slowianie/Babilonia/Asyria/Fenicjanie 0,54, Zulusi 0,34. Czyli przy dokladnie 130/90 gotowosc blokuje 14 z 16 cywilizacji (przechodza tylko Chinczycy i Inkowie); r1 podal 0,54-0,60 - zgodne dla civ neutralnych. Przy AI 3x silniejszym (hegemon) wartosci jak dla rownej sily (allyWPenalty pominieta przy rdzeniu); przy AI 3x slabszym +0,13 premii (Grecy 0,774, neutralne 0,674 - tuz ponizej 0,68 przed ulga proponenta). Gotowosc rosnie z Zaufaniem (0,006/pkt) i Relacja (scoreFactor do +0,30 przy Relacji 210): np. 100/175 -> ok. 0,9.
Testy: odwrocony test hegemon 90/130 (Grecy) -> odrzut z komunikatem "Brak gotowosci do sojuszu (gotowosc 0.64, wymagana 0.68)"; nowe: Chinczycy 90/130 przy hegemonie -> accept; Zulusi 90/130 rowna sila -> odrzut z gotowoscia.

## B. AI proponujace
ai.ts P5 i aiDiplomacyStance uzywaja tej samej reguly (rdzen 130/90 pomija hegemona-proponenta i kare sily; gotowosc zostaje; effWillingnessAlly >= minSojuszAlly bez penaltyAlly). Dotyczy propozycji do gracza i do innych AI (ta sama sciezka decideAIDiplomacy; akceptacja AI<->AI idzie przez evaluateProposal). Test T9m: 95/165 + AI 3x silniejsze (Grecy) -> proponuje; Zaufanie 89 lub Relacja 129 -> nie; Zulusi 90/130 -> nie (gotowosc).

## C. NAP bezterminowy
Nowy parametr progNapBezterminowyRelacja=151 (JSON + DIPLOMACY_PARAMS + typ, na liscie progow Relacji skalowanych trudnoscia jak wczesniej progSojuszRelacja). ai.ts napIndefinite uzywa go. Test T9l: Relacja 130 i 150 -> turns 15; 151 -> turns 0. sisterAllianceDiplomacyParams nie dotyka tego parametru.

## Wiki
wikiBundle.json zregenerowany generatorem; w bundle brak juz "Relacja 151"/"Zaufanie 91". Poradnik/encyklopedia/HANDEL-PUNKTY zaktualizowane na 130/90.

## TESTY
diplomacy-proposal-test 0 FAIL (czesc jsdom NIE_URUCHOMIONE - brak jsdom), ai-test 296/0 (+7 nowych), diplomacy-test 148/0, diplomacy-locks 88/0, diplo-alliance-gate 18/0, city-state-alliance 74/0, diplo-aggressor-unit 73/0, diplo-aggressor-mutation 19/19 KILLED, diplo-aggressor-wiring 15/0 (po korekcie licznika 2->3), diplo-nap-trust-30 25/25, diplomacy-acceptance-points 304/0, diplomacy-ai-balance 36/36, diplomacy-ai-offer-balance 29/0, diplomacy-treaties 17/17, wiarygodnosc 270/0, diplomacy-audience-actions 20/0. tsc --noEmit: zero bledow w diplomacy*/ai.ts/types. Weryfikacja przegladarkowa: NIE_ZMIERZONO (brak zmian UI poza danymi/komunikatem silnika). NIE uruchomiono: testy jsdom/Chromium.

## LEDGER (REPIN Rust)
rust-port dyplomacja: nowy parametr progNapBezterminowyRelacja=151 (napIndefinite w ai); evaluateProposal sojusz: gotowosc AI nie pomijana przy rdzeniu 130/90 (tylko hegemon/kara/slaby proponent), tekst odrzutu gotowosci z liczbami; aiDiplomacyStance: rdzen pomija hegemona i allyWPenalty; ai P5 zaproponuj_sojusz wg rdzenia (gotowosc zostaje).

BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: Evaluator R2
DEPLOY/PUSH: NIE WYKONANO
