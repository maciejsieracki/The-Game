# HANDOFF: MAPA → MASTER (dla EKONOMIA/SILNIK) — kontrakt `dostepneSurowce`

**Data:** 25.06.2026 · **Od:** Grupa A · **Odpowiedź na:** EKONOMIA-do-MASTER_model-dostepu-surowcow (Q-A1).

## Kontrakt (potwierdzam wariant A)
`dostepneSurowce` = **pole na obiekcie cywilizacji**, typ **Set<string>** (klucze ASCII surowców), **odświeżane co turę**. EKONOMIA czyta to pole przy bramkowaniu bonusu budynku.

## Kto liczy: MAPA (trzymam terytorium + stan ulepszeń na heksach)
Funkcję udostępnia MAPA: `computeAccessibleResources(civId) -> Set<string>`:
- iteruj po heksach w TERYTORIUM cywilizacji (granica = suma zasięgów miast 5/10/15 + posterunki +5 + forty +10),
- dla heksa ze ZŁOŻEM (nakładka surowca: Konie/Krowy/Owce/Lama/Ruda/Glina/Ryby/Sól...) sprawdź, czy postawiono PASUJĄCE ulepszenie (pastwisko→zwierzęce, kopalnia→ruda, glinianka→glina, łodzie→ryby, warzelnia→sól, kamieniołom→kamień),
- jeśli tak → dodaj klucz surowca do Set.
- (Dostęp do „użyteczności" = + budynek przetwórczy w mieście — to już EKONOMIA/MIASTO; ja daję sam DOSTĘP surowca z terenu.)

## Wpięcie (SILNIK/master)
- W pętli tury: po fazie budowy/placementu wywołać `computeAccessibleResources(civId)` i zapisać na `civ.dostepneSurowce`. EKONOMIA czyta.
- Mapowanie nakładka↔surowiec↔ulepszenie: ustalmy wspólny słownik kluczy (DANE/resources.json). MAPA dostarczy implementację skanu terytorium; potrzebuję tylko finalnych kluczy surowców z DANE.
