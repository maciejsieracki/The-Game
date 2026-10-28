# AutoBot dispatch — tartak na zalesionym wzgórzu

## Problem i oczekiwany rezultat
Po zbudowaniu tartaku na lesie na wzgórzu znika wizualny kopiec i kępa lasu, a model wygląda jakby stał na płaskim heksie. Zachować relief wzgórza oraz las i osadzić sektor tartaku na próbkowanej powierzchni stoku, tak jak dla innych ulepszeń zachowujących relief.

## Zakres
- Bazowy bundle/commit: deployed Robocza `39d020aed3921d7188284dd1fee3bc524707c3db`.
- Dozwolone pliki: predykat relief-preserving, ścieżka renderowania `syncImprovementDecorForHex` i `improvementReliefOpts`, test regresji oraz raport AutoBot.
- Nie zmieniać wymagań budowy, ekonomii tartaku, wycinki ani zachowania innych ulepszeń.
- Nie commitować, nie integrować i nie wdrażać przed niezależnym przeglądem.
- Pełna weryfikacja build/Chromium i wizualna kontrola modelu na wzgórzu są odroczone, dopóki główny agent nie zakończy aktywnego testu wydajności.
