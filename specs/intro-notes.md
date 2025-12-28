Utwórz Product Requirements Document (PRD) używając powyższej konwersacji jako kontekst i moich notatek:
-Użyj ml5.js (Feature Extractor) i p5.js 
- Nazwa apki: KlockiMowia

## Ekran 1:
- skanowanie figurek kamerą - dodawanie klas do rozpoznania
- wybór czy skanować przednią czy tylną kamerą
- pole tekstowe z nazwą figurki. Nazwa figurki jest katalogiem w którym są zapisane zdjęcia figury
- przycisk "Skanuj" - dodaje kolejny skan figury
- przycisk "Zapisz skany" - zapisuje zdjęcia do katalogu figury
- przycisk "Dodaj następną figurę"


## Ekran 2:
- trenowanie modelu
- wczytywanie katalogów figur do trenowania
- przycisk "Trenuj" - trenuje model
- przycisk "Zapisz model" - zapisuje model do pliku


# Ekran 3:
- załadowanie modelu
- rozpoznawanie figurek na obrazie z kamery
- wybór czy rozpoznawać przednią czy tylną kamerą
- po rozpozaniu wyświetla nazwę figury i confidence. Format przykładowy: "Figura: 93%"
- jeśli rozpoznano kilka figur, wyświetl top-3 figury z największym confidence