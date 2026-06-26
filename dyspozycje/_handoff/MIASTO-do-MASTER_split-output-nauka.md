# PACZKA: MIASTO -> MASTER (rozdziel: EKONOMIA + UI) : podzial outputu miasta (4 strumienie) + wklad Nauki
Data: 2026-06-25. Realizacja: Sonnet-subagent. Addytywne, testy modulowe zielone (split-output-test 46/46).
Kontekst: handoff CYWILIZACJE "model nauki" -> podzial = mechanika PER-MIASTO (MIASTO), agregacja globalna = EKONOMIA.

## CO WYSTAWIA MIASTO (production.ts) -- gotowe
- `splitOutput(total, shares?) -> { produkcja, pieniadz, nauka, rozwoj }` -- PURE; dzieli output miasta na 4 strumienie.
  Normalizuje udzialy; suma strumieni == total (ostatni bierze reszte z zaokraglenia); total NaN/ujemny -> same zera;
  shares {0,0,0,0} -> fallback calosc do produkcji.
- `DEFAULT_OUTPUT_SHARES` -- domyslne udzialy z miasto-params.json:
  udzial_output_produkcja=0.4, udzial_output_pieniadz=0.3, udzial_output_nauka=0.2, udzial_output_rozwoj=0.1 (tunowalne w panelu).
- `cityScienceOutput(total, shares?) -> number` -- sama czesc Nauki (wygodne dla agregacji).
- `cityMoneyOutput(total, shares?) -> number` -- sama czesc Pieniadza.

Typy: `OutputShares`, `OutputSplit` (oba { produkcja, pieniadz, nauka, rozwoj }).

## DLA EKONOMIA (agregacja globalna)
- Suma globalna Nauki/Pieniadza = sum po miastach z cityScienceOutput / cityMoneyOutput (lub splitOutput.*). 
- "total" (output miasta do podzialu) dostarcza EKONOMIA/silnik (np. z plonow/Handlu) -- MIASTO nie narzuca zrodla, tylko dzieli.
- Wzor tempa nauki = WASZ (_handoff/EKONOMIA-do-MASTER_tempo-nauki.md); my dajemy tylko per-miasto strumien Nauki.

## DLA UI (panel miasta, pkt 4 -- KOREKTA)
- Suwak podzialu outputu (produkcja/Pieniadz/Nauka/rozwoj) = MIASTO-owy. UI ustawia shares per miasto -> splitOutput liczy.
- Skorygowano _handoff/MIASTO-do-UI_widok-miasta-elementy.md pkt 4 (wczesniej blednie "= EKONOMIA").

## MAGAZYN NAUKI (pula + zakup tech) -- DECYZJA ARCHITEKTURY OTWARTA (Maciej)
Model (decyzja Maciej + CYWILIZACJE): nauka = WSPOLNA PULA punktow; gracz zbiera (sum z miast) i kupuje DOWOLNA tech
(prereqi spelnione) za `Koszt nauki` (tech.json). NIE "postep pod jedna tech".
KOLIZJA do rozstrzygniecia (Maciej wybiera A/B; rekomendacja MIASTA = A):
- A) Pula w playerState.ts (lane MASTER): MIASTO karmi podzialem per-miasto (cityScienceOutput); master przerabia
  playerState z biezace+postep na pule + "kup technologie". research.ts (orphan) kasowany jak planowano. [CZYSCIEJ]
- B) Reaktywacja research.ts jako modul MIASTO (pula); master przepina HUD z playerState na research.ts. [wiekszy refactor]
Po decyzji: jesli A -> MIASTO dostarcza tylko strumien Nauki (JUZ jest: cityScienceOutput); jesli B -> MIASTO przerabia research.ts.
CYWILIZACJE `chooseAIResearch` kompatybilny bez zmian w obu wariantach.

## WERYFIKACJA / PLIKI
- split-output-test.cjs = 46/46 (esbuild bundluje realny production.ts). 
- Pelny logic-test blokowany dehydratacja mountu (culture-religion.ts / units/setup.ts uciete; chmura kompletna) -> 163/163 po hydracji.
- Zmiana: production.ts (+ splitOutput/cityScienceOutput/cityMoneyOutput), data/miasto-params.json (+4 udzial_output_*). Backupy .bak-MIASTO.
