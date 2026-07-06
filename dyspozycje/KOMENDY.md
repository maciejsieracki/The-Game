# KOMENDY MACIEJA — jedyny słownik wyzwalaczy (v2, 2026-07-06; „start" zamiast „działaj")

Maciej pisze TYLKO te słowa. Każdy czat Cowork (MASTER/INTEGRATOR/UX) rozumie je
identycznie. ZASADA NADRZĘDNA: każda komenda MUSI popchnąć flow do przodu — kończy
się wpisem w kanale ze stopką `CZEKAM-NA: <następne ogniwo>`, żeby od razu było
wiadomo, komu Maciej pisze następne słowo. Informowanie Macieja to tylko echo.

## KOMENDY

| Komenda | Co robi czat, który ją dostał |
|---|---|
| **start** | WYKONUJE całą swoją kolejkę z kanału do końca (§8): zadanie → meldunek → sam czyta kanał → następne… Na końcu OBOWIĄZKOWY wpis z `CZEKAM-NA:` wskazującym następne ogniwo (np. „CZEKAM-NA: INTEGRATOR — wpięcie UX-GOTOWE"), tak by flow toczył się dalej. („działaj" = akceptowany stary synonim) |
| **master** | SYNC + PRZEKAZANIE W GÓRĘ: czyta kanał i swoją kolejkę → **dopisuje WPIS „→ MASTER" do KANAL-PRACA.md**: co GOTOWE do wpięcia, co w toku, co blokuje + `CZEKAM-NA: MASTER`. To wyzwala MASTERA: on z meldunku NATYCHMIAST robi zadania dla następnego ogniwa (nowy wpis-kolejka). Czat NIE wykonuje przy tym pracy. |
| **raport** | (głównie do MASTERA) Pełny stan ZAWSZE w 3 sekcjach z numerowanymi podpunktami — **A** = ZROBIONE/odhaczone (A1, A2, …), **B** = CZĘŚCIOWO (B1, B2, … — co konkretnie brakuje), **C** = WYMAGA DZIAŁANIA (C1, C2, … — u kogo wisi i jakie słowo to rusza). Każdy temat = osobny podpunkt. Na końcu: „pierwszy ruch: …" + stempel aktualnej wersji. |
| **sprawdź** | Czyta kanał TERAZ → weryfikuje ostatni meldunek → odpowiada co się zmieniło i CO DALEJ (kto następny). |
| **OK / BUG: opis** | Werdykt playtestu (do MASTERA). OK → MASTER pakuje wersję do DO-KANONU i wskazuje następną robotę. BUG → MASTER natychmiast zamienia opis na zadanie w kanale + mówi komu wpisać „start". |
| **zabezpiecz** | (przed zamknięciem aplikacji) Czat robi natychmiastowy zrzut roboczych plików swojego sandboxa do `gra-robocza\_sandbox\<ROLA>\` + aktualizuje `STAN-SANDBOXA.md` (co było w /tmp + JEDNA komenda odtworzenia) + wpis w kanale „SANDBOX ZABEZPIECZONY: [lista]". Po restarcie „start" najpierw odtwarza z tego stanu. |

## DZIEŃ MACIEJA (stary flow, trzy słowa)

1. Do MASTERA: **raport** → stan + „wpisz start u X".
2. Do wskazanego czatu: **start** → mieli kolejkę, melduje, wskazuje następnego.
3. Do MASTERA: **sprawdź** → weryfikacja + „testuj stempel Y" / „wpisz start u Z".
Po grze: **OK** albo **BUG: …** — i kółko kręci się samo.

## GDZIE CO JEST (dla czatów)
Kolejka i meldunki: `_handoff/KANAL-PRACA.md` · wersje: `WERSJE.md` · role:
`ROLE-I-ZAKRESY-2026-07-06.md` · reguły: `OBIEG-KOMUNIKACJI-2026-07-06.md` (§7, §8).
