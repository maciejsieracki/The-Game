# 03-dispatch-final-control — Oblezenie wiring Final Control

STATUS: DISPATCH READY
ROLE: Final Control (independent — third reviewer, highest-level questions)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

Operator PASS → Evaluator PASS (zero zarzutów blokujących, dokładny audyt
w tym parytet trybów i poprawność strony civKey). Obrona pominięta.
Przeczytaj `00-dispatch.md`, `01-operator.md`, `02-evaluator.md`,
`INPUT-converted-values.json`. NIE ufaj żadnemu z poprzednich raportów —
zadaj własne pytania wyższego poziomu, niekoniecznie te same co Evaluator.

## PYTANIA WYŻSZEGO POZIOMU

1. **Czy kalibracja ±0.20 (standing/non-compounding) dla tego działu jest
   w rzędzie wielkości precedensów REAL_GAMEPLAY** — porównaj z już
   zwalidowanym Manpower (mp_max_proc/mp_koszt_jednostki_proc też ±0.20,
   Final Control tamtego tematu uznał to za "w rzędzie wielkości") oraz z
   pierwotnym precedensem `dip_handlowosc_archetyp` (±0.3-0.4). Czy efekt
   ±20% na bonus obrony muru (np. 200%→240%/160%) jest REALNIE odczuwalny
   w starciu, nie kosmetyczny? Policz samodzielnie przykładowy scenariusz
   (np. wpływ na hitChance/baseDamage w resolveSiegeAttack lub w
   battleScene.ts, jeśli tam faktycznie się to liczy).
2. **Czy podłączenie w city-defense.ts jest architektonicznie słuszne** —
   czy to rzeczywiście JEDYNE miejsce, przez które przechodzą OBA tryby
   bitwy, czy może istnieje trzeci, pominięty punkt wejścia (np. AI
   decyzyjność w siegeAi.ts, która używa `cityDefenseBonus` z siege.ts —
   INNEGO pliku niż city-defense.ts)? Sprawdź czy siege.ts/siegeAi.ts to
   martwy/testowy moduł czy realna ścieżka gameplayu, i czy wymaga
   osobnego podłączenia. Jeśli jest to faktycznie odrębna, używana ścieżka
   (np. do decyzji AI o sile ataku) i NIE dostała mnożnika — to może być
   luka, ale oceń czy jest wystarczająco istotna by być zarzutem
   blokującym, czy tylko notatką do przyszłej rundy.
3. **Czy wybór strony (obrońca dla mur/obrona miasta, atakujący dla
   machiny) jest kompletny i spójny** — Evaluator to zweryfikował, ale
   sprawdź sam niezależnie: czy istnieje scenariusz w grze, gdzie broniące
   się miasto SAMO posiada machiny oblężnicze (np. wypad garnizonu) i
   parametr `obl_machines_proc` powinien wtedy zadziałać na korzyść
   obrońcy zamiast atakującego? Jeśli tak i kod tego nie obsługuje — czy to
   realna luka gameplayowa, czy scenariusz który dziś w ogóle nie istnieje
   w silniku (sprawdź czy istnieje mechanika wypadu/kontrataku z murów)?
4. Czy diff jest bezpieczny do zmergowania razem z równoległą gałęzią
   WIRING-MANPOWER (już zamkniętą, gate t_3a0bc8f9) — obie modyfikują
   `civ-matrix.json`, ale różne klucze (`mp_*` vs `obl_*`). Sprawdź czy
   format/kolejność kluczy w civ-matrix.json pozostaje spójny (żeby merge
   dwóch branchy nie dał konfliktu na tym samym pliku, albo jeśli da
   konflikt, że jest to trywialny konflikt do rozwiązania).
5. Czy jest coś w tym temacie, co zasługuje na PASS-WITH-NOTES zamiast
   czystego PASS — jakikolwiek kompromis architektoniczny, uproszczenie,
   czy brakujący przypadek brzegowy, który nie jest fatalny, ale
   integrator powinien mieć świadomość przy merge?

## WERDYKT

STATUS: PASS | PASS-WITH-NOTES | FAIL. Zapisz `03-final-control.md`.

## NEXT PHASE

PASS/PASS-WITH-NOTES → workerless integration gate (nie mergować bez
jawnej zgody właściciela). FAIL → powrót do Operatora z konkretnym
zarzutem.
