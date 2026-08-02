# PLAN — Ludy Morza bez obozu na wodzie (Maciej 2026-08-02)

**Status:** plan / ustalenie produktowe — **bez implementacji** do hasła `działaj`.  
**Cytat:** „w brązie… nie powinno tak wyglądać ich obozowisko… powinni się pojawiać w różnych miejscach na łódkach i atakować… bez obozu, bo jeszcze obóz jest na wodzie, no to głupia ta.”

---

## 1. Co Maciej widzi (a czym to NIE jest)

| | To, co na screenie | Miasta-państwa |
|--|-------------------|----------------|
| Co to | **Ludy Morza** (barbarzyńcy epoki Brąz) | Osobne cywilizacje / siostry klastra |
| Wygląd | Drewniany obóz ze czaszką **na wodzie** + wojownicy na łódkach | Miasta na lądzie + dyplomacja |
| Epoka | Brąz (`player.era === 2`) | Od startu gry (klaster) |

**Wniosek:** to nie bug miast-państw — to wizual + spawn **Ludów Morza**.

---

## 2. Stan dziś (kod)

- W Brązie: `spawnSeaCamps()` stawia obozy `naval=true` na **Wybrzeżu** (płytka woda) lub wysepkach.
- Render: **ten sam** model lądowego obozu barbarzyńców (`buildObozBarbarzyncow`) — stąd „obóz na morzu”.
- Jednostki (Sherden / szekelesz) spawnują **zaokrętowane** na sąsiedniej wodzie → łódki + rajdy (`decideSeaPeoplesRaids`).

Czyli: łódki = OK jak chcesz; **obóz na wodzie = zgodny z kodem, niezgodny z Twoją intuicją**.

---

## 3. Docelowy kanon (Twoja wizja)

1. **Bez obozu na wodzie** — żadnego palisadowego obozowiska na morzu/wybrzeżu.
2. **Łódki w różnych miejscach** — wojownicy Ludów Morza pojawiają się już zaokrętowani na wodzie (rozproszeni) i **atakują / rajdują** wybrzeże.
3. (Opcja do ABC) Czy w Brązie zostają też **lądowe** obozy barbarzyńców w głębi lądu, czy tylko fala morska?

**Rekomendacja planu:** w Brązie — tylko spawn jednostek na wodzie (bez `spawnSeaCamps`); lądowe obozy Kamienia mogą zostać albo też przejść na Ludy Morza tylko jako jednostki z lądu (dziś już `pickBronzeBarbUnit`).

---

## 4. Propozycja implementacji (po `działaj`)

1. **Wyłączyć** `spawnSeaCamps` (lub nie rysować / nie tworzyć obozów `naval`).
2. Nowy spawn: co N tur w Brązie — 1–K jednostek Ludów Morza na **losowych heksach wody** w zasięgu mapy (daleko od miast / w `raidRadius` od wybrzeża), od razu `embarked + seaRaider`.
3. Limit żywych rajderów jak dziś `unitsPerCamp * maxSeaCamps` (żeby nie zalać mapy).
4. Istniejące obozy `naval` w save: przy load / tick — usunąć mesh + przestać tickować (jednostki zostają).
5. Test: `barbarians-test` — Brąz nie tworzy camp.naval; spawn embarked na wodzie.

Pliki: `barbarians.ts`, `main.ts` (pętla tur), ewentualnie render (brak sync naval).

---

## 5. Decyzja na rozmowę (1 punkt)

**Czy w Brązie zostają lądowe obozy barbarzyńców w środku kontynentu?**

| | Opcja | Sens |
|---|--------|------|
| **A** | Tylko fala morska (łódki), zero obozów naval; lądowe obozy jak w Kamieniu zostają | Mniej chaosu, ląd nadal „żyje” |
| **B** | W Brązie w ogóle bez obozów — tylko Ludy Morza z morza | Czystszy motyw epoki |
| **C** | Obóz naval zostaje, ale **inny model** (tratwa/kotwica, nie palisada) | Kompromis wizualny |

**Rekomendacja: A** (Twoje słowa: łódki bez obozu na wodzie; nie musisz kasować lądowych obozów).

---

*Koniec · 2026-08-02 · do rozmowy / działaj.*
