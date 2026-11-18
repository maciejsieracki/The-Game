STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza/projekt + pomiar; bez zmian logiki gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: Zmierzyć PRZED (3 ziarna × ≥150 tur) terytorium miast vs forty/posterunki AI i odpowiedzieć na zarzuty FC r1/r2.
ZMIANY-COMMIT:
- ccd24c6fb: hak `__aiEconomyMeasure.metrics()` (gra/src/main.ts, tylko odczyt): forty, posterunki, heksy terytorium (ogółem, z miast, z fortów/posterunków), heksy sporne.
- 2c46de4e0: gra/tools/territory-race-measure-run.cjs (wrapper runnera + CSV + kontrolne) i pole `terytorium` w rekordzie runnera.
- 891eefc8e: sekcja 6 projektu z liczbami (ziarno 4242, t1–40), sprostowania z kodu, dowody (dowody/, 0,7 MB, git add -f).
- Ten raport: osobny commit.
Bramki: tsc --noEmit EXIT 0; logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test 21 [OK], 0 FAIL; combat-test "All sanity checks passed"; ai-economy-measure-hook-test 20/20 zielone.
TESTY (pomiar, dane z dowody/seed4242.jsonl):
- ziarno 4242, tury 1–40 ZMIERZONE: t10 41 AI, 0 fortów/posterunków, 2531 heksów (wszystkie z miast); t20 41 AI, 0 fortów, 2593 heksy; t30 15 AI z wierszem, 0 fortów, 4283 heksy; t40 15 AI, 5 fortów, 2 posterunki, 6814 heksów, 254 z fortów/posterunków (≈3,7%).
- Pierwszy fort/posterunek AI: 5 właścicieli między turą 32 a 40 (19→32, 13→34, 22→35, 10→37, 37→40).
- Ziarna 777 i 1234: NIE ZMIERZONO. Tury 50, 60, 90, 120, 150: NIE ZMIERZONO.
- Wznowienie ze slotu t40 kończy się segfaultem Chromium (signal 11), 2 z 2 powtórzeń (dowody/seed4242-wznowienie-t40-BLAD-SIGSEGV.log). Wznowienie ze slotu t20 działało w tym samym dniu; przyczyna NIE zbadana.
- Przebieg w tle (setsid nohup) został odrzucony przez classifier uprawnień; przebieg wykonywano w pierwszym planie, w porcjach <590 s.
ODPOWIEDZI NA ZARZUTY R2 (ostatniej rundy FC):
- Zarzut 1 (pomiar PRZED 3×≥150 niewykonany): PRZYJĘTY CZĘŚCIOWO. Wykonano ziarno 4242 do tury 40. Pozostałe tury i ziarna NIE ZMIERZONO (patrz TESTY).
- Zarzut 2 (brak tools/territory-race-measure-run.cjs): PRZYJĘTY. Narzędzie dodane (2c46de4e0), działa jako wrapper i przelicza CSV.
- Zarzut 3 (hak nie rozszerzony): PRZYJĘTY. Rozszerzony (ccd24c6fb).
- Zarzut 4 (punkty NIE ZWERYFIKOWANO): PRZYJĘTY w części (a) — upkeep fortu i posterunku: `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` obejmuje oba klucze (terrain-improvements.ts:92, 608–610; turn-economy.ts:991). Kwota: NIE ZMIERZONO. (b) UI/administrator gracza: NIE ZWERYFIKOWANO (poza zakresem tej rundy). (c) kontakt granic i dyplomacja: NIE ZWERYFIKOWANO. (d) inne ścieżki budowy AI: NIE ZWERYFIKOWANO wyczerpująco.
- Zarzut 5 (runda 2 bez pracy): PRZYJĘTY. Ta runda ma commity z pracą (ccd24c6fb, 2c46de4e0, 891eefc8e).
- Zarzut 6 (SHA w treści, rekomendacje wstępne): PRZYJĘTY. SHA podane wyżej; rekomendacje P1–P5 oznaczone jako wstępne w sekcji 7 (nie ustalone pomiarem tur 50+).
BLOKADY: (1) wznowienie segfaultuje po t40 (klasa save-load, do naprawy poza tym tematem); (2) brak pomiaru tur 50–150 i dwóch ziaren; (3) classifier odrzucił tło. Pomiar wymaga dokończenia przed decyzją ABC o liczbach.
RUNDY: 3/5 (runda 3 tego tematu; r2 zakończyła się BLOCK bez pomiaru).
NASTĘPNY KROK: naprawa wznowienia (save-load) albo pomiar pełny w osobnej rundzie; po nim uzupełnić sekcję 6 i dopiero wtedy przedstawić pytania ABC z liczbami. Wniosek „AI rzadko stawia forty” NIE jest potwierdzony dla tur 50–150.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (a) `setsid nohup` zostało odrzucone przez classifier — dispatch to dopuszcza, ale tło nie zadziałało; (b) przy wznowieniu z t40 widać ten sam wzór co w r3 harnessu (znikanie właścicieli z wierszy między t20 a t30, 41→15) — warto go zbadać osobno.
