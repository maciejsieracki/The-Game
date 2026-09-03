TEMAT: R-DYPLO-PROG-NAP-90-DO-110-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/diplomacy.ts (wartosc domyslna), gra/data/diplomacy.json (dane zywe)
MODEL+EFFORT: claude-sonnet-5, effort medium (czysta zmiana wartosci liczbowej, ten sam wzorzec
co juz wykonana wczesniej w tej sesji zmiana 50→90 tego samego pola)

WYZWALACZ (dosłownie od właściciela)
"Zmieńmy jeszcze pakt o nieagresji z 90 na 110."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- `progNapRelacja` to prog Relacji wymagany do zawarcia paktu o nieagresji (NAP). DWA zrodla
  prawdy do zmiany: `gra/src/game/diplomacy.ts:204` (`progNapRelacja: 90,` w domyslnym obiekcie
  parametrow, z komentarzem linia 203 "Relacja >= wartosc wymagana do NAP (Maciej 2026-09-02: 90
  @ normal; tylko Rel, bez Zauf)") oraz `gra/data/diplomacy.json:46` (`"progNapRelacja": 90,` —
  dane zywe uzywane przez silnik w rozgrywce).
- Ten sam dokladny wzorzec zmiany (progNapRelacja) zostal juz wykonany wczesniej w tej sesji
  (temat `R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1`, FALA 340, zmiana 50→90) — bez ABC, jako czysta
  decyzja balansu wlasciciela. Ta zmiana jest tym samym rodzajem dyspozycji, kolejna iteracja tej
  samej liczby.
- Kilka komentarzy dokumentacyjnych w kodzie CYTUJE dzisiejsza wartosc 90 jako PRZYKLAD w
  ilustracyjnym opisie logiki (NIE jako logike samą w sobie): `diplomacy-proposals.ts:753`
  ("progNapRelacja=90, progSojuszRelacja=151..."), `diplomacy-acceptance-points.ts:163,175`
  ("progNapRelacja=90, 61≥50"). Te komentarze NIE wplywaja na zachowanie gry, ale staja sie
  nieaktualne po zmianie liczby — do zaktualizowania przy okazji, jesli trywialne (sama zmiana
  liczby w komentarzu), bez zmiany struktury zdania/logiki ktora ilustruja.
- `ai.ts:4527,4533` czyta `dipP.progNapRelacja` (nie ma wlasnej osobnej kopii liczby 90) —
  automatycznie podchwyci nowa wartosc bez zmian w tym pliku.
- `NAP_EKSPANSJA_RELACJA_NARZUT` (narzut na prog przy ekspansji, `diplomacy-proposals.ts:454-457`)
  jest DODAWANY do `progNapRelacja` — jego wlasna wartosc liczbowa NIE jest czescia tego
  zgloszenia (wlasciciel powiedzial wprost "pakt o nieagresji z 90 na 110", nie wspomnial
  narzutu) — zostawic bez zmian, chyba ze recon w locie wykaze ze to jawnie ten sam parametr pod
  inna nazwa (nie powinien byc, to OSOBNY, dodawany narzut).

GOAL
1. `progNapRelacja` zmienione z 90 na 110 w OBU zrodlach prawdy: `gra/src/game/diplomacy.ts:204`
   i `gra/data/diplomacy.json:46`, wartosci identyczne po zmianie.
2. Komentarz w `diplomacy.ts:203` zaktualizowany (data + nowa wartosc), zgodnie ze wzorcem
   istniejacego zapisu "(Maciej 2026-09-02: 90 @ normal...)" → nowa data + 110.
3. Zero zmian w logice progu (`relacjaGate`, `napThreshold`, `NAP_EKSPANSJA_RELACJA_NARZUT`,
   `napScoreEase`/bias AI) — WYLACZNIE wartosc liczbowa samego progu bazowego.
4. Ilustracyjne komentarze cytujace "progNapRelacja=90" jako przyklad (nie logike) — zmien liczbe
   na 110 tam, gdzie to trywialne (sama liczba w cytowanym przykladzie), bez zmiany struktury
   zdania.

KRYTERIA KOŃCA (binarne)
1. `grep -rn "progNapRelacja.*90\|90.*progNapRelacja" gra/src gra/data` (poza plikami
   historycznymi/dispatch/rejestr) nie zwraca zadnego wystapienia jako WARTOSC LICZBOWA pola (dopuszczalne
   pozostale wystapienia to wylacznie nazwa pola bez przypisania "90").
2. `gra/src/game/diplomacy.ts:204` i `gra/data/diplomacy.json:46` maja identyczna wartosc 110.
3. Zywy test (istniejacy lub nowy) potwierdza, ze silnik faktycznie odczytuje 110 jako prog przy
   decyzji AI o zaproponowaniu NAP (Relacja=109 → NIE proponuje, Relacja=110 → proponuje) —
   nie tylko odczyt statyczny pliku danych.
4. Zero regresji na istniejacych testach dyplomacji (znajdz je reconem — np.
   `diplomacy-*-test.cjs` dotyczace NAP/paktu nieagresji).
5. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/diplomacy.ts — WYLACZNIE `progNapRelacja` i jego komentarz.
- gra/data/diplomacy.json — WYLACZNIE pole `progNapRelacja`.
- Ilustracyjne komentarze w gra/src/game/diplomacy-proposals.ts i
  gra/src/game/diplomacy-acceptance-points.ts cytujace liczbe 90 jako przyklad — WYLACZNIE sama
  liczba w cytowanym przykladzie, zero zmian logiki/struktury zdania.
- Test w gra/tools/*-test.cjs jesli wymaga aktualizacji oczekiwanej wartosci progu, lub nowy test
  potwierdzajacy kryterium 3.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana `NAP_EKSPANSJA_RELACJA_NARZUT` lub
jakiegokolwiek innego progu dyplomatycznego (sojusz, granice, wasalizacja).

IZOLACJA
worktree /home/user/wt-dyplo-prog-nap-110, gałąź autobot/R-DYPLO-PROG-NAP-90-DO-110-Q1,
baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-prog-nap --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 3 za spelnione na podstawie samego odczytu wartosci pola — wymagany
zywy test przez prawdziwa sciezke decyzji AI (`ai.ts` Priorytet 3b, ~4527), pokazujacy ze zmiana
liczby faktycznie zmienia zachowanie (Relacja tuz ponizej nowego progu blokuje propozycje NAP,
tuz powyzej odblokowuje) — nie tylko ze plik danych ma nowa liczbe.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.

OBIEG
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort medium) → Operator (obrona,
jesli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
