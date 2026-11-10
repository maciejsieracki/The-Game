STATUS: OBRONA-ZAKONCZONA (kryterium binarne nadal NIESPELNIONE; proponowany werdykt rundy: FAIL, decyzja Evaluatora/Final Control)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1
GOAL: Odpowiedz na 8 zarzutow Evaluatora wobec sekcji 6 `P1-16-EDGE-CASES.md` (pin edb8fb56).
ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko sekcja 6, sekcje 1-5 nietkniete; `git diff --check` OK). Brak commita.
TESTY: git show / git grep na edb8fb56 w tej rundzie. Brak testow gry.

DECYZJE NA ZARZUTY:
1. PRZYJMUJE. Kryterium binarne nie jest spelnione: 69 znalezisk AUDYT-KODU (po odjeciu #1, #2, #19, #22), PARYTET #1-#6 i #8 nie maja statusu z dowodem. Dodano wprost w sekcji 6 i w 6.3.
2. PRZYJMUJE w czesci. Dopisano Mury, Fort, Pretorium (dane `buildings.json:998, 1439, 1829`: obrona 0, mnoznik 0). Teksty Civpedia/Poradnik (`07-miasto-budowa-rekrutacja.md:193`, 25 haselek „+1 ¤/poziom", opis Pretorium) NIE przeliczone: status NIEROZSTRZYGNIETY.
3. PRZYJMUJE w czesci. Dopisano Akademie (`:1586`), Warsztat oblezniczy (`:1537`), Kuznie zelaza (`:1339`), converters.ts:62 (komentarz, martwosc nieprzeliczona), NOWE ZNALEZISKA nr 4 (NIEROZSTRZYGNIETY). Uwaga: audyt twierdzi, ze Pretorium „dolicza do Pracy", ale pin ma mnoznik 0 w baza i przyrost, wiec zalozenie audytu nie ma podstaw w danych.
4. PRZYJMUJE. Poprawiono: etykieta `case 'jednostka': {` w main.ts:10221; TODO A1 w 10222-10225; `break;` w 10227.
5. PRZYJMUJE. Dopisano: `trade-routes.ts` bez rozrozniania wielkosci liter daje 1 trafienie w linii 904 (komentarz „Karawanseraj usunięty z gry"). Status NAPRAWIONY bez zmian.
6. PRZYJMUJE. Statusy sprowadzone do trzech: KOD #1 → NAPRAWIONY (defensywnie, TODO A1 zostaje); KULTURA-RELIGIA → NIEROZSTRZYGNIETY; Lazaret → NADAL ISTNIEJE; Kuznia/Koszary → NADAL ISTNIEJE (opis obiecuje efekt, ktorego kod nie daje).
7. PRZYJMUJE. Naglowek poprawiony: jeden dokument spoza wzorca (KULTURA-RELIGIA); AUDYT-KODU-2026-07-21.md pasuje do wzorca i jest w tabeli 6.1. Zakres: 8 AUDYT w tabeli + OBIEG wykluczony = 9.
8. PRZYJMUJE w czesci. Dopisano pin-evidence: `main.ts:20515` (`proposerRespekt = computeRespekt(potProposer, potResponder)`) i `:20519` (`respekt: proposerRespekt`); linia 6938 z audytu jest nieaktualna. Strona petli AI (main.ts:12163-12166) NIE przeliczona w tej rundzie.

NOWE USTALENIE (poza zarzutami): KOD #19 (wasal) NAPRAWIONY na pinie: `diplomacy-proposals.ts:1684-1689` bramka czyta `ctx.proposerRespekt`. Dopisano do sekcji 6. Kierunek platnosci (`:1699 payerOwnerId: responderOwnerId`) nie zmieniony.

BLOKADY:
- 69 znalezisk AUDYT-KODU nieprzeliczonych (osobny temat).
- PARYTET #1-#6, #8 nieprzeliczone linia po linii.
- Teksty Civpedia/Poradnik (treść) nieprzeliczone.
- Werdykty STOLICE i OPISY-CIVPEDIA bez weryfikacji wprost.

RUNDY: 1/5 (obrona, bez zmiany rundy)
NASTEPNY KROK: Evaluator kontroluje poprawiona sekcje 6 i decyduje o werdykcie; osobny temat dla 69 znalezisk AUDYT-KODU i PARYTET.
DEPLOY/PUSH: NIE WYKONANO
