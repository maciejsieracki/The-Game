# AI-BUNT-STOLICY — skutki buntu stolicy AI przy ≥ 2 miastach (R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1, tag CAPREBEL)

Data: 2026-11-27. Baza kodu: `659e2d01c` (origin/main). Runda 1/5, Operator HAIKU 5.5.
Surowe dane: `dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1/dane/capital-s4242-3t.txt`.
Raport operatora: `dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1/10-operator-claude.md`.

Ustawienia maksymalne (poziom „Trudny”, kultura i religia „trudny”, koszty jednostek „wysoki” ×4, dyplomacja i wojna „trudna”, wzrost surowców z epoką WYŁ.) — potwierdzone odczytem `__settingsLive.getSettings()` w każdym biegu. Start przez `__settingsLive.startNewGame` (realny `doStartGame`).

## Tabela skutków

| Pozycja | Skutek | Z kodu | Zmierzone żywo (seed 4242, stolica city16 właściciela 13, 2 miasta) | OCENA |
|---|---|---|---|---|
| (a) Nowa stolica | `capitalCityIdForOwner` po buncie: wpis `capitalCityIdByOwner` wskazuje miasto, które już nie należy do właściciela, więc spada na `oldestCityOfOwner` (`gra/src/main.ts` ~l.2478, ~40138) | Wyliczana na żywo, bez zapisu | TURA 1: stolica city16, miasta [city16, city17]. TURY 2–4: stolica **city17**, właściciel 13 ma miasta [city17], city16 należy do −99 (rebelianci) | ZAMIERZONE (fallback zgodny z komentarzem kodu) |
| (b) Pałac/budynki stołeczne | Budynki są przypisane do ID miasta (`cityBuilt`), więc przechodzą razem z miastem do rebeliantów | Kod: brak usuwania budynków przy buncie | NIE ZMIERZONO: w tym biegu w żadnym mieście nie było budynków (`buildingsOf` = []) — tura 1–4 za wczesna; pałac nie był zbudowany | NIE ZMIERZONO (brak budynków w biegu) |
| (b) Mennica | Mennica liczy się tylko z AKTUALNEJ stolicy (`ownersWithMennica`, `gra/src/game/turn-economy.ts` ~l.298; `ownerHasMennica` w `cityPanel.ts`). Mennica w rebelianckim mieście nie jest już „osierocona” dla właściciela (`ownerHasOrphanMennica` liczy miasta właściciela) | Kod: po buncie stolicy właściciel traci bonus Waluty+Mennicy, dopóki nie postawi Mennicy w nowej stolicy | NIE ZMIERZONO: Mennica nie była zbudowana (`mennicaWCapitalOwner` = false, `mennicaAnyCities` = []) | NIE ZMIERZONO (kod: ZAMIERZONE wg R-WEB-MINT-CAPITAL-ONLY-Q1; do potwierdzenia na żywo z zbudowaną Mennicą) |
| (c) Efekty stolicy w ekonomii tury (MINTDEBT / FALA 920) | Korupcja i efekty stolicy liczone wg AKTUALNEJ stolicy (`capitalCityIdForOwner`, `turn-economy.ts` ~l.267, `society-inputs.ts` `stolicaEasyBonusActive`) | Kod: przełączenie na city17 w tej samej turze | NIE ZMIERZONO: nie odczytano stanu skarbca/korupcji przed i po zmianie stolicy (poza zakresem hooka tej rundy) | NIE ZMIERZONO |
| (d) Warunki zwycięstwa / eliminacji | `eliminateOwner` wywoływane przy 0 miastach; właściciel z 1 miastem nie jest eliminowany | Kod: eliminacja wymaga utraty wszystkich miast | Właściciel 13 po buncie: `ownerEliminated` = false w turach 1–4, ma 1 miasto (city17), tura kończy się normalnie | ZAMIERZONE dla eliminacji. Warunek zwycięstwa NIE ZMIERZONO: w runnerze wyłączono sprawdzanie zwycięstwa (`disableVictoryCheckForTest`), więc ten pomiar nie dowodzi zachowania przy włączonym zwycięstwie. Wpis dla gracza o buncie AI: zob. poz. (f)/news w AIREBELVER |
| (e) Crash / pageerror / zawieszenie tury | — | — | 4 tury po wymuszeniu (tury 2–4 zakończone, `errors` = []); żadnego pageerror ani console.error w biegu | ZMIERZONO: brak błędów w 3 turach po buncie. Dłuższe biegi NIE ZMIERZONO |
| (f) Dyplomacja: relacja właściciela z rebeliantami | Relacja `getDiploRelation(owner, −99)` | Kod: brak ustawiania relacji przy buncie w `transferCityToRebelFactionWithLedger` | `relOwnerRebel` = „neutralni” przed i po buncie (tury 1–4); relacja właściciela z graczem = „neutralni” | ZMIERZONO: buntownicy nie dostają wojny/relacji −99 z właścicielem (zamierzone lub do potwierdzenia; relacja −99 z dispatchu NIE potwierdzona). Wojny AI↔frakcja NIE ZMIERZONO |
| (g) Zapis/wczytanie po buncie stolicy (round-trip) | Stan `capitalCityIdByOwner` i miast | Kod: wpis stolicy nie jest zapisywany po buncie (fallback liczony na żywo) | NIE ZMIERZONO w tej rundzie (zapis/wczytanie poza zakresem tego biegu) | NIE ZMIERZONO |

## Co dokładnie zmierzono

- Runner: `gra/tools/caprebel-capital-live.cjs` (nowy), 3 tury po wymuszeniu, seed 4242.
- Kandydaci AI z ≥ 2 miastami w t1: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37]; wybrany owner 13 (`SEED mod N`).
- Hak do odczytu budynków i Mennicy: `__capRebelReadTestDebug` w `gra/src/main.ts` (jedyna zmiana gra/src; WYŁĄCZNIE odczyt, bez zapisu stanu gry).
- Istniejący hak wymuszenia: `__rebelNotifyTestDebug.forceRevoltEligible(city16)` (próg buntu skrajnego 14% → 95%, grace 0), jak w AIREBELVER.

## Wnioski ostrożne

1. Bunt stolicy AI przy 2 miastach: stolica przechodzi na najstarsze pozostałe miasto (city17), właściciel zostaje żywy z 1 miastem. Zgodne z komentarzem kodu. ZMIERZONO (seed 4242).
2. Mennica i efekty stolicy w ekonomii: wg kodu bonus Waluty+Mennicy znika dla właściciela, dopóki nowa stolica nie ma Mennicy. Nie potwierdzone żywo, bo w biegu nie było budynków.
3. Warunek zwycięstwa nie został zmierzony przy włączonym sprawdzeniu zwycięstwa (hak testowy je wyłącza).
4. Relacja z rebeliantami: 'neutralni' zamiast oczekiwanego −99. Do wyjaśnienia przez właściciela tylko jeśli ma to wpływać na grę (poza zakresem tej rundy).

## Otwarte (NIE ZMIERZONO)

- (b) i (c): dłuższy bieg z zbudowaną Mennicą w stolicy (≥ 1 budowa przed buntem) i odczyt skarbca/korupcji przed i po zmianie stolicy.
- (d): bieg z włączonym sprawdzeniem zwycięstwa.
- (g): zapis przed buntem i wczytanie po buncie, tura +3.
- Wariant z buntem na stolicy AI przy 2 miastach, gdy stolicą jest drugie miasto (inny seed).

## Bramki (tura 1/5)

- `tsc --noEmit` (gra/): exit 0
- `ai-city-rebellion-gate-test.cjs`: PASS=37 FAIL=0
- `ai-city-rebellion-news-test.cjs`: PASS 24/0
- `logic-test.cjs`: LOGIC OK (213/213)
- `tech-tree-test.cjs`: 20 pass, 0 fail
- `research-test.cjs`: ALL GREEN (liczba przypadków nie wypisana przez skrypt)
- `ai-test` (297), `combat`, `unit-replace`: NIE URUCHOMIONO w tej rundzie (zmiana gra/src ograniczona do read-only hooka).
