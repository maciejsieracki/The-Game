# AI -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (z godzina) ORAZ (2) to samo w CZACIE do uzytkownika.
Odpowiedzi czytaj w dyspozycje/AI.md.

---
(brak wpisow -- dopisuj ponizej)

## [2026-06-24 07:53] AI -> MASTER: konsolidacja plikow dzialu AI do katalogu Civ-AI/
Zebralem WSZYSTKIE nie-growe pliki dzialu AI do nowego katalogu **Civ-AI/** (zeby nie szukac po liscie ~50 plikow w root):
- Civ-AI/Spec-AI-architektura.md (dokumentacja dewelopera), Civ-AI/Spec-AI.md (design), Civ-AI/AI-parametry.xlsx (panel sterowania).
- Civ-AI/README.md = indeks calego dzialu (linkuje tez do plikow gry).
- Civ-AI/_archiwum/ = historyczne/nieuzywane: AI-parametry.xlsx.bak-aidoc + ai-params.json.bak-aidoc (moje backupy).

ZOSTAJA na miejscu (pliki gry / wspolna infra): gra/src/game/{ai,victory,barbarians}.ts, gra/data/ai-params.json,
gra/tools/export-ai-params.py + barbarians-test.cjs, oraz mailbox dyspozycje/AI.md + AI-DO-MASTERA.md.

ZMIANY SCIEZEK (do Twojej wiedzy / aktualizacji globalnych indeksow):
- Spec-AI.md: root -> Civ-AI/Spec-AI.md. Odwolania "przeczytaj Spec-AI.md" w DYSPOZYCJE-SESJI.md i dyspozycje/AI.md
  wskazuja teraz lokalizacje Civ-AI/Spec-AI.md (prosba: zaktualizuj sciezke w tych plikach, to Twoj lane koordynacji).
- AI-parametry.xlsx: root -> Civ-AI/AI-parametry.xlsx. Zaktualizowalem DEFAULT_XLSX w gra/tools/export-ai-params.py (zweryfikowane: export OK, 68 kluczy).
- ai-params.json ZOSTAJE w gra/data (plik gry).

NIE RUSZALEM: _backup/gra_*/game/ai.ts (6 szt.) — to snapshoty CALEGO drzewa gry (system backupu / SILNIK), nie moj lane.
W archiwum/_archiwum nie bylo nic z mojego tematu.
Prosba: jesli prowadzisz MAPA-TASKOW / globalny indeks, dopisz katalog Civ-AI/ jako miejsce dokumentacji+panelu dzialu AI.

## [2026-06-24 19:36] AI -> MASTER: DECYZJA MACIEJ — profil cywilizacji ZOSTAJE w panelu AI (NIE w DANE)
Maciej przekazal taka decyzje (relacjonuje doslownie): profil/charakter cywilizacji dla AI ma **zostac w moim pliku**,
czyli w panelu **AI-parametry.xlsx -> ai-params.json** (klucze `archetype_*`). **NIE** przenosimy go do DANE/`civs.json`.

To NADPISUJE Twoje wczesniejsze dyspozycje z 24.06 w dyspozycje/AI.md:
- „KOREKTA ZAKRESU ... Charakter/profil cywilizacji CZYTASZ z DANE (civs.json, blok Profil AI)",
- „DECYZJA MACIEJ: 7A ... Profil charakteru cyw. CZYTASZ z DANE/civs.json (po dodaniu bloku)".

SKUTKI:
- `ai.ts` zostaje przy czytaniu archetypow z `ai-params.json` (panel AI) — bez przepinania na `civs.json`.
- DANE **nie musi** dodawac bloku „Profil AI" do `civs.json` (rozjazd zamkniety po stronie panelu AI).
- Brak potrzeby handoffu DANE->AI w sprawie profilu.

PROSBA do mastera: zaktualizuj dyspozycje/AI.md (usun/zmien wpisy „profil z DANE" -> „profil w panelu AI"),
zeby przyszle „start" nie wracaly do przenoszenia profilu do DANE. (To samo zglaszam Maciej w czacie.)

## [2026-06-24 21:15] AI -> MASTER: HANDOFF pytania/zaleznosci -> _handoff/AI-do-MASTER_zaleznosci.md
Skierowane do mastera (per routing ostateczny) pytania zalezne od innych dzialow + integracja:
1. [MAPA] format/zrodlo startowego rozmieszczenia klastrow per typ (pkt3) — czy w MAPA-do-MASTER_nazwy-klastrow.md?
2. [EKONOMIA] kontrakt kosztu/budzetu: co AI czyta z economy.ts/turn-economy.ts (pkt5).
3. [INTEGRACJA] wpiecie ai/victory/barbarians teraz (handoff+DoD) czy po domknieciu pkt2-6.
4. [SPOJNOSC] zaktualizowac CYWILIZACJE.md/AI.md: jeden wlasciciel ai.ts=Civ-AI, profil=ai-params.json.
5. [DANE/tech] czy moge czytac tech.json wprost (pkt6 heurystyka nauki).
STATUS PRAC: pkt1 (fix wartosc<->wartość w ai.ts) naniesiony + backup .bak-AI; zielony test domknę harnessem przy pkt2.
