# Dispatch — duża macierz mieszanych armii na wydaniu `862568e`

- Zgłoszenie: szeroko przetestować duże bitwy różnymi doktrynami, ustawić, czy łucznicy,
  inne jednostki dystansowe oraz konnica/rydwany podejmują działanie.
- Baza kontrolna: `862568e26212ea733def53fc5f6b59214d753534` (`main`).
- Kryteria: atak/obrona/szturm, linie dystansowe 1–3, dwa priorytety celu, zwarcie i
  korytarz, po 42 jednostki na stronę, bez nielegalnych ataków; ruch/strzały oceniane
  zgodnie z rolą i doktryną.
- Operator: `02-operator-defense.md`; bez zmiany kodu produktu. Test ma wykonywać
  produkcyjną logikę `BattleScene`, a symulację ruchu przeciwnika/obrażeń jawnie
  oznaczać jako ograniczenie harnessu.
- Następna bramka: niezależna ewaluacja korekty kryterium testu przed integracją.
