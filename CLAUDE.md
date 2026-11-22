# millebeier

Bestands- und Kassen-App für **Millebéier** (so geschrieben wie im Logo; Repo, Dateien und Speicherschlüssel ohne é), die kleine Brauerei von Laurent, Jeff, Marc und Claude
(Luxemburg). **App-Texte auf Luxemburgisch** (vom Nutzer, 13.11.2026). **Reiter nach dem Ablauf** (vom Nutzer gewählt): Stock · Verkafen · Bestellungen · Ausstoend · Iwwersiicht · Client
(seit Fassung 15.11. e; der **Verlauf** liegt seitdem im Zahnrad ⚙️ → „📜 Verlaf“, mit „← Zréck an d'Astellungen“)
(„Bestellungen“ hieß bis Fassung w „Livraisons“ — vom Nutzer umbenannt, auch alle Texte und das Excel-Blatt; im Code
heißen Reiter, Funktionen und die Eintragsart weiter `livraison(s)`). **Seit Fassung 17.11. a: Reiter unten** (fest am Bildschirmrand, Symbol + Name,
  6 in einer Reihe, im Home-Bildschirm 22 px Abstand für den Home-Balken; seit Fassung 17.11. f dort auch 14 px links/rechts; **seit Fassung g über die Klasse `html.app`** (gesetzt bei `navigator.standalone`) statt `@media (display-mode: standalone)` — das erkennt iOS ohne Web-Manifest nicht, darum fehlten am iPhone auch die 22 px unten — vom Nutzer
  am iPhone gemeldet: „S“ von Stock und „t“ von Client lagen in der Bildschirmrundung; Spalten `minmax(max-content,1fr)`, damit „Bestellungen“ trotzdem passt, bis 320 px geprüft; **am iPhone bestätigt, 17.11.2026**) und **Startseite „Haut“** (s. u.); mit dem Nutzer und in Code/Doku Deutsch, Du-Form. Angelegt 13.11.2026.

## Arbeitsweise (vom Nutzer, 15.11.2026)
**Nicht einfach bauen.** Bei neuen Funktionen und größeren Änderungen (Aufbau, Reiter, Abläufe) erst einen Vorschlag
machen und auf das Okay des Nutzers warten. Vorschläge sind erwünscht, sofortiges Bauen nicht. Anlass: Adressbuch
wurde ohne Rückfrage in den Reiter Bestellungen gebaut — der Nutzer wollte einen eigenen Reiter „Clienten“ und den
Verlauf ins Zahnrad. Kleine, eindeutige Korrekturen, um die er ausdrücklich bittet, dürfen direkt gemacht werden.

## Was die App macht
Flaschen werden abgefüllt (→ Lager), an die vier verteilt, von ihnen verkauft. Jeder trägt auf seinem
Handy ein, wer wie viele Flaschen gekauft hat und ob bezahlt ist. Die App zeigt Bestand (Lager und je
Person), Verkauft, Kasse und Offen. **Geld geht immer sofort in die Millebéier-Kasse** (vom Nutzer) —
es gibt also nur eine Schuld: Käufer → Kasse. Kein Pfand. Sorten zum Start: NEIPA, White IPA,
Brown Porter, 3 € je Flasche; Sorten, Preise und Leute sind in der App (⚙️) für alle änderbar.

## Bisher: Excel-Tabelle
Vor der App lief alles über `Iwwersiicht_Commanden_Clients_2026.xlsx` (Dropbox, vom Nutzer am 14.11.2026 hochgeladen):
ein Blatt je Brauvorgang (Brown Porter 23.01., Rusty 06.02., NEIPA 28.07., Porter 30.09.) mit Spalten Virnumm/Numm,
Kontakt (Kürzel JF, MW, CW, LR = Jeff, Marc, Claude Wilwert „Willy“, Laurent; vom Nutzer bestätigt),
Unzuel, Béier (Preis), geliwwert?, Recetten, Remarquen, bezuel?; dazu „LIVRAISONS CLIENTS“ für Firmen/Vereine
(Ferro Forum, Rock Solid, Café Millebières, BEST, Brennerdag) mit livré/facture/payé. Fässer 30 l = 180 €, 20 l =
150 €; Vereine 2,50 €/Fl; Geschenkpacks 12 €/4, 18 €/6. Zuerst wurde die Geschichte nicht übernommen (zu viele
Unklarheiten, z. B. Brown Porter 310 Zeilen-Flaschen bei 288 gebraut) — Startstand = Zählung; dann doch, siehe unten.
Der Excel-Export der App bildet dieses Format nach (s. u.).
**Alte Verkäufe doch übernommen** (vom Nutzer, 14.11.2026), aber **ohne Geld**: `altImport()` (feste ids `alt26-…`,
Knopf ⚙️ „📜 Al Verkéf 2026“, einmalig, verschwindet danach; springt in die Iwwersiicht mit offenem Archiv).
**Seit Fassung j von selbst** (vom Nutzer: Knopf übersehen): nach dem ersten erfolgreichen Abgleich, wenn `alt26-bier-bp`
weder beim Server noch im Ausgang ist (Prüfung gegen `SERVER`, nicht gegen `Z`). Tests mit leeren Daten setzen
`window.OHNE_ALTIMPORT = true` (addInitScript); `oberflaeche.mjs` prüft das Selbst-Einspielen mit zwei Handys.
Archivierte Biere „Brown Porter 01/2026“, „Rusty 02/2026“ mit ihren Fässern (seit Fassung i Gebinde, nicht eigene Biere) (Namen mit Monat, vom Nutzer —
heute gibt es wieder ein Brown Porter). Verkäufe mit `alt: true` → `Z.altVerkaeufe`: zählen im Bestand und pro Bier
(Recetten zur Info), **nie** in Kasse, Ausstoend, Umsatz je Person, Käuferliste (vom Nutzer: „gar nicht in die Kasse“).
Kürzel JF Jeff, MW Marc, CW/Claude Claude, LR Laurent — **vom Nutzer bestätigt**. Gambrinuskelle = Verkauf zu 3 €
(vom Nutzer). Brown Porter 310 abgefüllt (= Zeilensumme, Vermerk am Bier), Testflaschen 78 + BTS 3 verschenkt,
4 „nach doheem“ bei Claude — **seit Fassung n fort verbucht** (vom Nutzer; schon eingespielte Stände korrigiert
`altKorrekturen()` einmalig: storno von `alt26-bp-cw` + Abgang `alt26-bp-cw-fort`); Ferro Forum 2,50 €/Fl (aus dem Livraisons-Blatt), Oarbechterkiermes/Brennerdag/
Laurent/Willy ohne Preis = 0 € mit Vermerk. BEST (Livraisons-Blatt, 24 Rusty + 12 Porter am 17.05.) = Marc Gloden
(gleiche Menge, gleicher Tag), nicht doppelt. NEIPA 28.07. nicht übernommen (ist das aktuelle). Übrig im Lager:
2 BP-Fässer, 1 Rusty-20-l-Fass — **bleiben aktuell** (vom Nutzer): Fässer archivierter Biere bietet `artikelListe`
beim Verkaufen/Livraison und „Fläsche beweegen“ an, solange jemand welche hat. Alte Zeilen ohne Datum: „ouni Datum“, im Excel leer.

## Aufbau
- `index.html` — Einzeldatei, kein Build, kein Framework. GitHub Pages: Organisation `millebeier`, Repo `millebeier.github.io` → https://millebeier.github.io/ (wie beim FC Koeppchen, vom Nutzer 13.11.2026).
- `worker.js` — Cloudflare Worker + D1 (Binding `DB`, Secret `CODE`). **Seit 14.11.2026 (Dateien) vom Nutzer neu
  einzufügen** — ohne den neuen Worker schlägt das Hochladen mit 400 fehl (Hinweis in der App). Speichert nur Einträge,
  rechnet nichts. Tabelle `eintraege` legt er selbst an. **Seit 14.11.2026 nimmt er jede Art `^[a-z_]{2,24}$`** —
  neue Eintragsarten brauchen kein Neu-Einfügen mehr (die Fassung davor kannte nur die ersten sieben).
  Lehnt der Server ein Bündel ab (400), schickt die App einzeln; Abgelehntes bleibt im Ausgang mit Hinweis
  „Worker muss aktualiséiert ginn“, der Rest geht durch (Test mit altem Worker, Gegenprobe gemacht).
- **Datenmodell = Buchungsliste.** Nichts wird überschrieben; jeder Eintrag
  `{id, zeit, art, durch, …}` mit `art` ∈ abfuellung, bewegung (von/an, „Lager“ ist ein Halter),
  abgang (getrunken/verschenkt/kaputt/sonst), verkauf (verkaeufer, kaeufer, posten[], betrag),
  zahlung (ref = Verkauf), einstellungen (sorten, leute; die letzte gilt), storno (ref),
  livraison (kunde, kontakt, aus, datum YYYY-MM-DD, posten, betrag, rechnung, anlass?, notiz?), rechnung (ref = Verkauf),
  bier (name, preis, stil?, braudatum?, alk?, liter?, mhd?, notiz?), bierstatus (name, status aktiv|archiv|weg).
  **Biere** (vom Nutzer, 14.11.2026): angelegt und geändert unter **Stock → Eis Béieren** (nicht mehr in ⚙️; die
  Sortenliste aus `einstellungen` bleibt Grundlage für Altbestand und wird beim Speichern der Leute unverändert
  mitgeschickt — `Z.basisSorten`). Name nicht änderbar (Bestand hängt dran). **Braudatum im Namen** (vom Nutzer, Fassung r):
  neue Biere heißen „NEIPA (28.07.2026)“ (Datum beim Anlegen angehängt) → zweiter Sud = eigenes Bier, eigenes Excel-Blatt;
  ältere Biere zeigen das Datum nur an (`bierText`/`artikelText`, `BRAUDATEN`); Namen mit Datum oder „MM/JJJJ“ bleiben.
  Doppelt = gleicher Name samt Datum. **Datum nachtragen/ändern** (vom Nutzer gefragt, Fassung s): Name/Bestand bleiben, die
  Anzeige nimmt immer das aktuelle Braudatum (ein Datum im Namen wird nur in der Anzeige ersetzt); Test in `logik.mjs`.
  Ein Datum gibt es nur, wenn jemand es einträgt (nichts automatisch). **Braudatum ist beim Anlegen Pflicht** (vom Nutzer,
  Fassung u; beim Ändern freiwillig, damit alte Biere ohne Datum nicht blockiert sind). Braudatum bleibt nachträglich änderbar; Rückfragen,
  Meldungen und Verlauf zeigen dann das neue Datum (`bierText` überall, Fassung v). Bier-Meldung „gespäichert“ steht in
  `BIER_MELD`, damit sie den Neuaufbau nach dem Abgleich übersteht. **Nie zwei gleich aussehende Biere** (Fassung t):
  Anlegen/Ändern wird abgelehnt, wenn die Anzeige einem anderen Bier gleicht (altes „NEIPA“ + 28.07. vs. neues
  „NEIPA (28.07.2026)“); Excel-Blattnamen werden trotzdem eindeutig gemacht („… (2)“), sonst bricht SheetJS ab. Knopf „+ Neien Béier“ (vom Nutzer, nicht „Neit“). Beim Anlegen optional Flaschen → `abfuellung`.
  **Archiv** = nicht mehr verkaufbar, bleibt in Iwwersiicht (📦) und Excel. **Erst wenn nichts mehr da ist** (vom Nutzer,
  Fassung o): liegt noch etwas (Flaschen/Fässer bei irgendwem) oder ist eine Livraison geplant, kommt ein Hinweis mit
  „wo“ (`restVon`) und es wird nicht archiviert. Der Import der alten Biere archiviert trotzdem (alte Fässer liegen noch). **Läschen** = zwei Rückfragen, verschwindet
  überall (`Z.geloescht`), Verkäufe bleiben im Verlauf und in der Kasse; zurück über den Verlauf oder neues Anlegen.
  Excel-Blatt je Bier zeigt die Eigenschaften (Braugang, Alk, Liter, Haltbar, ARCHIVÉIERT).
  **Dateien je Bier** (vom Nutzer, 14.11.2026): im Bier-Bearbeiten „📎 Dokumenter“ mit festen Feldern Etikett, Rezept,
  Brauprotokoll (je die neueste gilt, „Ersetzen“ lädt neu; ✕ = storno, dann gilt wieder die vorige) und „Aner Dateien“
  (beliebig viele). Nach „Béier uleeën“ springt die App gleich ins Bearbeiten. Eintrag `datei` (fid, name, typ, groesse,
  teile, bier, feld, thumb); der Inhalt liegt **nicht** in `eintraege`, sondern als Base64-Stücke à 1 000 000 Zeichen in
  der D1-Tabelle `teile` (Worker `teil_hoch`/`teil_holen`), Vorschaubild als Stück `<fid>-t` (JPEG 240 px; PDFs über
  pdf.js 3.11.174 von cdnjs, erst bei Bedarf geladen). Der Eintrag kommt erst, wenn alle Stücke oben sind. Max. 10 MB.
  Öffnen in eigener Anzeige (`#ansicht`: Bild bzw. alle PDF-Seiten als Canvas; **Tabellen** .ods/.xlsx/.xls/.csv über
  SheetJS `sheet_to_html` (vom Nutzer: Brauprotokoll als .ods), Datum ohne eigenes Format → TT.MM.JJJJ; „⬆️ Deelen“)
  **Deelen** (Fassung q, vom Nutzer: bei .ods ging es nicht — **am iPhone bestätigt: geht jetzt**, 14.11.2026; welcher
  der Ausweichwege gegriffen hat, ist unbekannt): Datei liegt seit dem Öffnen
  bereit (`DATEN`, kein Warten im Tippen), erst echter Typ, dann als `application/octet-stream`, dann ohne Typ; scheitert
  alles, Meldung mit dem Grund von iOS (Nutzer soll ihn schicken). Herunterladen nur im Browser, nie im Home-Bildschirm.
  **Etikett-Bild vor dem Biernamen** im Stock (Fassung q, vom Nutzer), antippen öffnet es; `thumbLaden` füllt alle
  `[data-thumb]` (Stock und Dokumente). — **nicht** per blob-URL,
  das gibt im Home-Bildschirm eine weiße Seite (Lehre aus pizza.html). `renderDok` baut nur bei Änderung neu
  (Signatur), sonst ging ein Tipp verloren, der in den Neuaufbau nach einem Abgleich fiel. Gelöschte Dateien bleiben
  als Stücke in D1 (zurückholbar über den Verlauf).
  **Bestellung planen: „Huelen aus“ = wer einträgt** (vom Nutzer, Fassung x), als Text mit Knopf „Änneren“ (`ausAendern`),
  erst dann die Auswahl Lager/Leute.
  **Bestellungen: All / Just meng** (vom Nutzer, Fassung y, wie bei Ausstoend): „meng“ = Kontakt oder `aus` ist man selbst.
  **Bestellung ändern** (vom Nutzer, Fassung z): nur geplante, Knopf „✎ Änneren“ → Formular vorbelegt (`LFORM.ersetzt`),
  scrollt den Formular-Anfang unter den festen Kopf (`lFormOben`; Fassung i beim Ändern, Fassung k auch bei „Nei Bestellung“),
  nach Späicheren/Ofbriechen ganz nach oben (Fassung l),
  Späicheren = storno der alten + neue `livraison` in einem `eintragen`; Reservierungsprüfung ohne die alte Fassung
  (`rechne` mit Prüf-storno). Gelieferte: kein Ändern (Verkauf/Zahlung/Rechnung hängen dran) — im Verlauf löschen.
  **Clienten** (vom Nutzer, 15.11.2026; Fassung c als „Stammclienten“ bei Bestellungen, seit **Fassung e eigener Reiter
  „Client“** am Ende, wo vorher Verlaf war): Eintrag `kunde` (`v: 2`, kid, firma, name, vorname, adresse, ort, tel, mail,
  notiz, alias?; neuester je kid gilt, `weg: true` = gelöscht) → `Z.kunden` mit `label`. Firma, Name **oder** Vorname Pflicht
  (seit Fassung f; Label dann Firma, sonst „Name Vorname“, sonst nur der Vorname).
  **Liste zeigt nur den Namen**: Firma, wenn gesetzt (auch wenn Name/Vorname da sind), sonst „Name Vorname“; **alphabetisch**
  (`kundeLabel`). Rotes ▶ klappt Kontaktdaten auf (Kontaktperson 👤, Adresse, Ort, tel:/mailto:-Links, Remarque,
  ✎ Änneren / ✕ Läschen; **klappt von selbst zu**, wenn man > 5 min nicht im Reiter war — anderer Reiter oder App im
  Hintergrund, Fassung l, vom Nutzer; seit 16.11. a gemeinsam mit Stock-Archiv und Iwwersiicht über `ZUKLAPPEN`/`ZU_WEG`/`ZU_MS`), darin „▶ Akeef (n)“ (`kaeufeVon`: Verkäufe und geplante/gelieferte Bestellungen **ab jetzt**, nie die
  alten Excel-Verkäufe; zugeordnet über `kid` oder den Namen; Datum, Biere, Betrag, bezahlt per / op / geplangt). Suchfeld
  oben (Name, Firma, Kontaktperson, Ort). Doppelt = gleiches Label. **Kein c/o-Feld** (vom Nutzer gefragt, abgesprochen):
  bei einer Firma sind Name/Vorname die Kontaktperson; Rechnungsadresse (`rechnungsAdresse`) = Firma / „À l'attention de
  Vorname Name“ / Adresse / Ort — Grundlage für die **Rechnungs-Vorlage, die der Nutzer noch schickt**. Clienten aus Fassung c
  (nur `name`, ohne `v`) gelten als Firma.
  **Käufer-Felder in Verkafen und Bestellungen** (vom Nutzer, Fassung f — statt eines Namensfelds und statt „+ Bei d'Clienten“):
  Firma · Numm · Virnumm (eins reicht; `kaeuferHtml`/`kaeuferBinden`/`kaeuferErgebnis`, Zustand `FORM.k`/`LFORM.k`). Beim Tippen
  in einem der drei Felder Vorschläge als Knöpfe (`kundenSuche`, Clienten 📇 zuerst, dann frühere Käufer **und Kunden
  geplanter Bestellungen** — Fassung g, vom Nutzer gemeldet; alte Excel-Namen bewusst nicht, vom Nutzer) — **kein Ausklappmenü**.
  Client antippen füllt alle drei und zeigt die Kontaktkarte. **Nichts wird geraten** (vom Nutzer): ein früherer Käufer kommt
  unverändert in das Feld, in dem getippt wurde; aufteilen tut man selbst. Ist es kein Client: Haken „☐ Als neie Client späicheren“ (Text vom Nutzer, Fassung m); mit
  Haken klappen Telefon/E-Mail/Adresse/Ort auf (freiwillig, später im Reiter Client änderbar), beim Speichern kommt der
  `kunde`-Eintrag im selben `eintragen` wie Verkauf/Bestellung. Ohne Haken nur der Name (bekannte Schreibweise übernommen).
  Ohne Client speichern Verkauf/Bestellung zusätzlich `kf` = {firma,name,vorname} (Fassung h, vom Nutzer gemeldet: beim Ändern
  einer Bestellung kam „Reimen“/„David“ wieder ganz in Numm zurück); ältere Einträge ohne `kf` kommen ganz in Numm.
  Vorschlag eines früheren Käufers mit gespeichertem `kf` füllt alle drei Felder so aus (`kfVon`, neuester Eintrag; Fassung j).
  Ohne `kf` wie gehabt der ganze Text in ein Feld. **Kein Client doppelt:** gleiches Label → Haken verschwindet, der bestehende
  Client wird genommen; im Reiter Client „gëtt et schonn“. Nur zwei Handys gleichzeitig offline könnten doppelt anlegen.
  **Namen bleiben beim Umbenennen gebunden** (vom Nutzer gefragt): Verkauf/Bestellung speichern `kid`; `rechne` löst jeden
  Käufer über `kid`, sonst über einen Namen des Clients (`kundeNamen` inkl. `alias`) auf und zeigt **überall den aktuellen
  Namen** (Ausstoend, Bestellungen, Excel, Verlauf; gespeicherter Text in `kaeuferText`/`kundeText`). Früherer Käufer per
  Vorschlag + Haken → sein alter Text als `alias`; Umbenennen im Reiter Client legt alte Namen in `alias` (max. 20).
  Gelöschter Client → wieder der gespeicherte Text. `kaeufer`/`kunde` dürfen bis 120 Zeichen lang sein.
  **Kalender** (vom Nutzer, 16.11.2026, Fassung b; Entwurf gezeigt und abgesprochen): Knopf oben neben dem Zahnrad (`#kalBtn`;
  seit Fassung g eigenes Kalenderblatt `.kalic` mit Monat `KAL_MON` und **heutigem Tag** statt 📅 — Apples Emoji zeigt immer „17“;
  rote Zahl = Termine/Bestellungen heute und morgen, **unten rechts**, damit der Monat frei bleibt; beides vom Nutzer gewählt), Ansicht `TAB = "kalender"` (kein Reiter). **Ein gemeinsamer Kalender.** Eintrag
  `termin` (tid, typ, titel, datum, uhr?, bis?, bier?, wer[], wou?, notiz?; neuester je tid gilt, `weg: true` = gelöscht) →
  `Z.termine`. Arten (`TERMIN_ARTEN`): Braudag, Ëmschlauchen, Hopfestopfen, Afëllen, Etikettéieren, Stand/Fest, Reunioun,
  Aanescht — **Akafen bewusst nicht** (vom Nutzer). Ohne Zeit = ganzer Tag. Liste nach Monaten, Kommend/Alles/Just meng,
  antippen klappt auf (✎/✕; klappt nach 5 min wie die anderen zu). **Geplante Bestellungen stehen nur in der App** (gestrichelt
  „aus de Bestellungen“), **nicht im Abo** (vom Nutzer). **Vorschlag nach dem Braudag** (`NO_BRAUDAG`): Ëmschlauchen +7,
  Afëllen +14 Tage, je mit Haken und eigenem Datumsfeld (vom Nutzer: Datum änderbar); ziehen mit dem Braudag-Datum mit, bis man
  sie selbst ändert; nur beim Anlegen; **Haken am Anfang leer** (vom Nutzer, Fassung d). **Fassung d** (vom Nutzer): Filterleiste
  mit kleinen Symbolen ohne Namen (`KAL_FILTER`: „All“ + 8 Arten + 🚚 Bestellungen, mehrere wählbar, wirkt mit Kommend/Alles/
  Just meng, klappt nach 5 min auf „All“ zurück); Béier aus der Liste **oder** „✏️ Neien Béier antippen …“ (Freitext, `bierNeu`; Text vom Nutzer); Auswahl fest `TERMIN_BIERE` = IPA, NEIPA, WHIPA, Brown Porter, Clasico, Rusty (vom Nutzer, nicht der Bestand; im Kalender ohne Braudatum); Filter alle zehn in einer Zeile ohne Scrollen (Fassung e);
  „Wien ass dobäi?“ **standardmäßig alle**; Afëllen mit der Bierflasche der App (`FLASCHE_SVG`, `terminIc`) — in Text (Verlauf,
  Abo) bleibt 🍾. **Abo:** Worker `GET /kalender/<schlüssel>.ics`, Schlüssel = SHA-256("millebeier-kalender:"
  + CODE) Hex, 32 Zeichen (`kalenderSchluessel`, App und Worker gleich) — kein eigenes Secret; Code ändern = neuer Link.
  Knopf `webcal://…`, darunter „Klappt net?“ mit https-Adresse zum Kopieren. VTIMEZONE Europe/Luxembourg, Zeilen gefaltet
  (≤ 75 Bytes), UID = tid. **Worker mit Kalender vom Nutzer am 16.11.2026 eingefügt.**
  **Livraison** (vom Nutzer, 14.11.2026): geplant, bis ein Verkauf mit `liv` = ihre id existiert („Geliwwert ✓“ legt ihn an,
  Flaschen aus `aus`, meist Lager — Verkauf hat dafür optional `aus`). Verkauf rückgängig → wieder geplant. Rechnung
  „gemaach“ = Eintrag `rechnung`. Geplantes zählt nirgends als verkauft.
  **Vorauszahlung** (vom Nutzer, 17.11.2026, Fassung h; Entwurf als Bild gezeigt): Leute zahlen oft per WERO/SumUp, sobald das Bier
  da ist, geliefert wird später. **Kein eigener Knopf** (Knopfreihe bleibt einzeilig): an jeder geplanten Bestellung eine antippbare
  Zeile „💶 Nach net bezuelt ›“ → Zahlungsfenster mit **„Wéivill?“** (vorbelegt: alles bzw. der Rest; weniger = Acompte, mehr abgelehnt)
  → Eintrag `zahlung` mit `vor: true`, `ref` = **lid** der Bestellung (bleibt beim Ändern). Danach „✓ 72 € bezuelt · WERO“ bzw.
  „30 € Acompte · Bar — 6 € op ›“. Zählt **sofort in der Kasse** (`Z.kasse`, `kasseNach`), nicht unter Ausstoend; bei „Geliwwert ✓“
  wird sie dem Verkauf angerechnet (`rechne`: `livNachLid`, `L.vorbezahlt`, `L.vorWie`). **Kein Feld beim Planen** (vom Nutzer).
  Löschen einer bezahlten Bestellung fragt „Do sinn schonn … bezuelt“ → „Jo, d'Suen sinn zréckbezuelt — läschen“ / „Nee — Bestellung
  bleift“; gelöscht zählt das Geld nicht mehr. Automatische Aufgabe 💡 „X huet scho bezuelt — nach liwweren“ (sofort, für den Kontakt,
  abgehakt nach 7 Tagen wieder; Datum vorbei → rot und ersetzt „nach net als geliwwert markéiert“). Excel Bestellungen: „Jo (am Viraus)“ /
  „Acompte 30 €“ + „bezuelt per“; Verlauf „💶 Virauszuelung …“. **Umsatz pro Person zählt erst ab der Lieferung** (wie verkaufte Flaschen); Vorschlag
  „💶 60 € am Viraus“ in Pro Persoun vom Nutzer abgelehnt („wie es ist lassen“, 17.11.2026).
  **Pro Bier** (`proSorte`): Verkäufe, Abgänge, geplante Livraisons je Sorte; Betrag eines Mehrsorten-Verkaufs nach
  Listenpreis aufgeteilt (`anteil`). In der Iwwersiicht Sorte antippen. **Excel-Export** (`exportBlaetter` → SheetJS
  0.18.5 von cdnjs, erst beim Tippen geladen): je Sorte ein Blatt wie die alte Tabelle, dazu Bestellungen, **Clienten** (alle
  Felder + Akeef/Total/dovun op/geplangt/Leschten Akaf, alphabetisch; vom Nutzer, Fassung 16.11. f) und Stock;
  Teilen-Leiste wie die anderen Dateien.
  **Fässer = Gebinde eines Biers** (vom Nutzer, 14.11.2026: „nicht als eigenständiges Bier“): Schlüssel im Bestand
  `fassKey(bier, 20|30)` = „<Bier> Keg 20l/30l“ — genau so hießen die früher als eigenes Bier angelegten Fässer, darum
  ordnet sich Altbestand von selbst zu (`zerlege`); alte Fass-„bier“-Einträge liefern nur noch den Fasspreis.
  Bier hat `preis20`/`preis30` (Vorgabe 150/180). `sortenNamen` = nur Biere; `fassNamen(Z, bier)` = Fässer mit
  Bewegung; `artikelVon` = beides. Flaschen-Summen (`Z.flaschen`, je Person) **nie** mit Fässern mischen — Fässer
  stehen daneben („10 + 3 F.“). Iwwersiicht: Fass-Zeilen 🛢️ unter dem Bier; Stock: eigene Fass-Tabelle; Excel:
  Spalte „Gebinde“, Fass-Info oben, Stock-Blatt mit Fass-Spalten. Verkaufen/Livraison zeigen Fässer nur, wenn der
  Halter welche hat (`artikelListe`).
  **Reserviert** (vom Nutzer): geplante Livraisons belegen den Bestand bei `aus` (`Z.reserviert`, `frei()`); beim
  Planen, Verkaufen, Weitergeben und Fort Warnung mit „huet X, dovun Y reservéiert → fräi Z“ (`zuWenig`, `fehltText`),
  bestätigen geht trotzdem. Stock zeigt „🚚 Reservéiert fir geplangt Livraisons“.
  **Tabellen zeigen frei, reserviert darunter** (vom Nutzer, Fassung 16.11. h, Variante A aus drei gezeigten Entwürfen): in Stock
  („Wien huet wat?“, Flaschen und Fässer), Iwwersiicht/Pro Zort („Nach do fräi“) und Pro Persoun („Huet nach fräi“) steht groß, was
  **frei** ist, darunter klein gelb „🚚 n“ = reserviert (`resZeile`, `resAlle`, `mengeText`); Stock unten Fräi / + reservéiert / = Total.
  Negativ frei = rot. Der gelbe Hinweistext unter Stock bleibt (vom Nutzer).
  **Stock-Tabelle passt aufs Handy** (vom Nutzer gemeldet, Fassung i: Σ-Spalte abgeschnitten): Spaltenköpfe zweizeilig
  (`kopfZweizeilig`: „NEIPA“ / klein „28.07.26“, „Brown Porter“ / „01/26“), Zeile „+ 🚚 res.“, Schrift 13 px (`.stocktab`);
  bei 3 Bieren bis 360 px Breite ohne seitliches Scrollen geprüft (Test prüft 390 px).
  **Verkaufen ohne eigenen Bestand** (vom Nutzer, Fassung m): statt Warnung Fenster „feelt: … — woher?“
  (`fehlendesHolen`, `frageWaehlen`): „📦 Aus dem Lager huelen“ / „Vum Jeff huelen“ (nur wer für alles Fehlende genug
  **frei** hat) → Umbuchung(en) `bewegung` + Verkauf in einem `eintragen`; „Trotzdeem androen“ = wie früher (Minus);
  Ofbriechen = nichts. Ausstoend markiert Verkäufe aus Livraisons mit „🚚 Livraisoun <Datum>“.
  Gemeldet 14.11.: „Livraison bezahlt, Ausstoend zeigt noch offen“ — am nachgebauten iPhone nicht nachstellbar
  (Kasse und Ausstoend stimmen); vermutet: doppelt eingetragen (Livraison + Verkauf) oder zweites Handy vor Abgleich.
  **Zahlungsarten** (vom Nutzer): `zahlung.wie` ∈ wero|sumup|bank|bar (WERO, SumUp, Iwwerweisung, Bar); Verkaufen hat
  vier Knöpfe + „Bezillt méi spéit“, Ausstoend/Livraisons ein Auswahlfenster (`zahlartWaehlen`, Abbrechen = nichts).
  `Z.kasseNach` je Art (Iwwersiicht unter „an der Kees“). **Art eigens sichtbar** (vom Nutzer): Liste pro Bier zeigt
  in „bezuel?“ direkt WERO/SumUp/…, Excel hat eigene Spalte „bezuelt per“ (Bier-Blätter und Livraisons; `wieListe`).
  Alte Zahlungen ohne Art = „ouni Aart“. **Knöpfe mit Bild + Name** (Bilder vom Nutzer, 14.11.2026, zugeschnitten auf
  240×96: `bilder/zahl-wero.jpg`, `zahl-sumup.png`, `zahl-bank.png` (Spuerkeess-Logo, Rot #de0000), `zahl-bar.jpg`
  (Ausschnitt der Geldscheine)); gewählt = grüner Rahmen + ✓.
  `rechne()` baut daraus den ganzen Stand. Rückgängig = storno, nie löschen; ein storniertes
  Verkauf nimmt seine Zahlungen mit. Storno eines Storno zählt nicht.
- **Startseite „Haut“** (vom Nutzer, 17.11.2026, Fassung a; Entwurf als Bild gezeigt): `TAB = "haut"` **immer beim Öffnen** (EIN.tab merkt
  nur noch den letzten Reiter für „Zréck“), Tipp aufs Logo (`#zurHaut`) führt hin; kein Reiter markiert. „Moien <Name>“ + Datum; drei
  große Knöpfe **Verkafen / Ausstoend / Bestellungen** (heißen wie die Reiter, vom Nutzer) = Abkürzungen, Ausstoend und Bestellungen
  gleich auf „Just meng“ (`NUR_MEINE`, `L_NUR_MEINE`), Zahlen = meine Schuldner / meine geplanten Bestellungen. Karten (seit Fassung e in dieser Reihenfolge, vom Nutzer): „✅ Fir dech ze maachen“, „Déi nächst Deeg“, „Nach op bei dir“, ganz unten „Du hues zur Verfügung“ (bis Fassung d „Du hues fräi“, weiter oben)
  (meine Flaschen/Fässer frei + 🚚 reserviert), „Déi nächst Deeg“ (Termine + Bestellungen 7 Tage, max. 5, → Kalender), „Nach op bei
  dir“ (meine Käufer mit offenem Betrag, → Ausstoend). Nach dem Speichern bleibt man im Reiter (nicht zurück zur Startseite).
  **Fassung 17.11. b** (vom Nutzer, Entwurf als Bild gezeigt): **🏠 oben** (`#hautBtn`, neben Kalender und Zahnrad; das Logo fand
  keiner); **Sync nur als Zeichen** ✓ / ⏳ n / ⚠️ n (`#sync`), Antippen klappt den ganzen Text darunter auf (`#syncInfo`, `SYNC_AUF`) —
  vorher brach „synchroniséiert“ auf bis zu vier Zeilen um; **länger als 5 min im Hintergrund → Startseite** (`HAUT_WEG`, `ZU_MS`),
  außer `mittenImEintrag()`. Kopf unter 360 px etwas kleiner (passt bis 320 px).
  **Fassung 17.11. c** (vom Nutzer gemeldet): Zahnrad ⚙️ rot markiert wie 🏠/Kalender, solange Astellungen oder Verlaf offen sind.
  **Fassung 17.11. d:** Karte heißt „Du hues zur Verfügung“ (vom Nutzer, statt „Du hues fräi“).
  **Fassung 18.11. e** (vom Nutzer): „Déi nächst Deeg“ heißt **„Deng nächst Deeg“** und zeigt **nur, was mich betrifft** (Termine, bei
  denen ich in „Wien ass dobäi?“ stehe — ohne Namen = alle; Bestellungen mit mir als Kontakt oder „Huelen aus“). Knopf **„Alles ›“** →
  Kalender (ganze Karte nicht mehr antippbar); „Alles ›“ bei den Aufgaben ebenso, beide deutlicher als Knopf (`.hmehr`); seit Fassung f rot mit schwarzer Schrift (vom Nutzer).
  **Fassung 18.11. i** (vom Nutzer: mittlerer Knopf „Ausstoend“ war doppelt zu „Nach op bei dir“): Knöpfe oben **Verkafen · Fläschen huelen ·
  Bestellungen**. „Fläschen huelen“ (Bild der Hand an der Kiste, `ABS_BILD.huelen`) öffnet **auf der Startseite** einen Kasten „Ech huele
  mer Fläschen“ (Lager ➜ ich, `H_HUELEN`, gemeinsamer Code `flaschenForm` mit dem Stock, ids mit Präfix „h“ statt „b“), „✕ Zoumaachen“,
  nach dem Speichern zu + Meldung (`H_MELD`), man bleibt auf der Startseite. „Nach op bei dir“ und „Du hues zur Verfügung“ bekommen
  ebenfalls „Alles ›“: → Ausstoend auf **All** (nicht Just meng, vom Nutzer) bzw. → Stock. Keine Karte ist mehr als Ganzes antippbar. **Fassung j:** alle drei Knöpfe oben gleich dunkel, Verkafen nicht mehr rot (vom Nutzer). Der Kasten „Fläschen huelen“ klappt nach > 5 min weg wieder zu (`ZUKLAPPEN.haut`), im Stock ebenso zurück auf die vier Knöpfe — Test in `haut.mjs` (vom Nutzer gefragt). **Fassung k** (vom Nutzer: 3 selbst getrunkene Flaschen wollten eingetragen werden): der Knopf heißt **„Fläschen“** (seit Fassung m **„Mäi Stock“**, n-Regel; vom Nutzer) (eigenes Bild: drei
  Flaschen + Fass 20 l + Fass 30 l, `ABS_BILD_FLASCHEN`/`ABS_FASS`) und öffnet auf der Startseite die **vier Absichten** wie im Stock
  (`absichtMenu`, gemeinsam), dann das Formular — alles ohne Seitenwechsel; „‹ aner Saach“ zurück zu den vier, „✕ Zoumaachen“ schließt.
- **Aufgaben „Ze maachen“** (vom Nutzer, 17.11.2026, Fassung d; Entwürfe als Bild gezeigt und abgesprochen — Notizen/Chat vorher
  verworfen, WhatsApp reicht): **hinter dem Kalender-Knopf**, kein neuer Reiter: oben zwei große Kästen „📅 Kalenner“ (Vorgabe, darunter
  wie bisher) und „✅ Aufgaben“ (`KAL_BEREICH`, `kalKaesten`), klein darunter „n dës Woch“ / „n op · m iwwerfälleg“. **Keine Zahl**
  irgendwo (nicht am 🏠, die Kalender-Zahl zählt weiter nur Termine/Bestellungen; Kalender und Aufgaben getrennt — vom Nutzer).
  Eintrag `aufgabe` (aid, text, fuer[] = Namen oder ["All"], bis?, ref? {typ liv|termin, id}, erledigt?, auto?); je aid gilt der
  neueste → `Z.aufgaben`. **Abhaken gilt für alle** („✓ vum Jeff“, unter Erleedegt 30 Tage, zurückholbar; erledigt:false = „↩️ Erëm op“).
  Anlegen nur in der Aufgaben-Ansicht (Text, Fir: Ech vorne/Leute/All, „📅 bis …“; Enter oder +) und per **„+ Aufgab“** an geplanter
  Bestellung und aufgeklapptem Termin (Formular darunter, blauer Link zurück). Knöpfe dort **in einer Zeile** (`.knopfe.einz`, vom Nutzer;
  unter 340 px dürfen sie umbrechen). Bestellung ändern: neue Fassung trägt `vorher`, `rechne` gibt jeder Bestellung `lid` (bleibt gleich)
  — Aufgaben hängen an `lid`. Liste: Op / Just meng (fir mech oder All) / Erleedegt; Überfälliges rot zuerst.
  **Automatische Aufgaben** (`autoAufgaben`, jedes Mal neu gerechnet, **immer gleich in der Liste**, 💡; Erklärung „💡 = Virschlag vun
  der App …“ unten nur, wenn eine da ist — vom Nutzer). Abhaken = „im Blick“, Eintrag `aufgabe` mit `auto` unter ihrer aid (`aidVon`):
  Rechnung maachen (Kontakt; weg mit Rechnung; abgehakt nach 14 Tagen wieder) · X erënneren ab 30 Tagen offen (Verkäufer; 14 Tage) ·
  Gläich keen XY méi do < 24 frei zusammen (All; nie wieder, neue aid erst nach neuer Abfüllung) · Fir d'Bestellung … feelen (3 Tage
  vorher, frühere Bestellungen zuerst bedient; „Huelen aus“ bzw. Kontakt beim Lager; am Liefertag eigene aid → kommt dann noch einmal) ·
  Bestellung nach net als geliwwert markéiert (Kontakt; 7 Tage) · Haltbar bis in 30 Tagen (All; nie) · Däin Handy huet n Agaben nach net
  geschéckt (> 24 h, nur dieses Handy, `aufExtra`, ohne Haken, Tipp öffnet den Sync-Text) · Afëllen fir XY plangen (Braudag > 7 Tage,
  ≤ 60, kein Afëllen-Termin mit dem Bier danach; All; nie). Grenzen in `AUF_GRENZE` (vom Nutzer bestätigt).
  **Haut liwweren: X** (vom Nutzer, 18.11.2026, Fassung a): am Liefertag einer geplanten Bestellung, für den Kontakt, „bis haut“; schon
  vorausbezahlt → keine eigene, dafür „huet scho bezuelt — nach liwweren“ mit „bis haut“; am Tag danach übernimmt „nach net als geliwwert
  markéiert“. Eine normale Bestellung (genug frei, nicht bezahlt) steht vorher **nicht** in den Aufgaben — nur Kalender/Startseite/Reiter.
  **„Jidderee muss“** (vom Nutzer, 18.11.2026, Fassung b; Entwurf als Bild gezeigt): bei mehreren Personen oder All beim Anlegen zwei
  Kästen „👤 Een eleng geet duer“ (Vorgabe, wie bisher: ein Haken für alle) / „👥 Jidderee muss“ (`jeder: true`). Dann hakt jeder nur
  **für sich** ab: eigener Eintrag `aufhak` (aid, durch = wer, `an: false` = zurück) — so geht offline kein Haken verloren. `rechne`
  gibt `noetig` (bei All alle Leute), `gemacht`, `erledigt` erst wenn alle. Liste: 👥 vor dem Text, „· jidderee“, Stand „2 vu 3“ mit
  grünen ✓-Namen; wer fertig ist, hat ein grünes Kästchen (antippen = zurück), wer nicht dabei ist, keins. Bei mir abgehakt → weg aus
  „Just meng“ und Startseite (`aufFuerMich`), in „Op“ bleibt sie bis alle durch. 💡-Aufgaben bleiben „een eleng“.
  **Startseite:** Karte „✅ Fir dech ze maachen“ (fir mech + All, auch 💡; max. 5, abhaken direkt; „Alles ›“ → Aufgaben auf **Op** = alle offenen (vom Nutzer, 18.11. g; vorher Just meng)),
  kein Anlegen dort (vom Nutzer). Excel-Blatt „Ze maachen“ (am Ende), Verlauf kennt Aufgaben.
- **Kasten „Fläschen“ im Stock** (vom Nutzer, 18.11.2026, Fassung c; Entwürfe als Bild gezeigt; vorher „Fläsche beweegen“ mit Reitern
  Ofgefëllt/Weiderginn/Fort und Vun/Un — zu abstrakt): erst **vier Absichten** (`ABSICHTEN`): 📥 Ech huele mer Fläschen (Lager ➜ ich) ·
  📤 Zréck an d'Lager (ich ➜ Lager) · 🤝 Engem anere ginn (ich ➜ erster anderer) · 🍻 Net verkaaft. Dann **Pfeil-Bild** (`.pfeil`, zwei
  Kästen mit Stand „huet n“ bzw. „n fräi · m do“, „änneren“ = Auswahl, ⇄ dreht um), Bier + Anzahl, grüne **Vorschau** „Duerno: …“
  (`#bVor`, beim Tippen ohne Neuaufbau). Net verkaaft: **Gründe als Knöpfe** (`GRUND_IC`; Soss eppes und — seit Fassung 22.11. c, vom Nutzer — Verschenkt / Prouf mit Textfeld → `notiz`), „vu mengen“.
  Nach dem Speichern **wieder die vier Knöpfe** mit Meldung (vom Nutzer); nach 5 min weg ebenso (`ZUKLAPPEN.bestand`).
  **Abfüllen nicht mehr hier**, sondern beim Bier (vom Nutzer: kein eigener Knopf): Anlegen wie bisher mit Flaschen/Fässern; **✎ Änneren**
  zeigt „Ofgefëllt an d'Lager“ mit der **Gesamtzahl** (`abgefuelltFelder`), ändern gleicht am Lager aus (`abfuellKorrektur`: alle
  Abfüllungen des Artikels storno + eine neue mit `vorher`; Verlauf „🍺 Ofgefëllt geännert: … 48 → 60“), Vorschau „Duerno am Lager“,
  Nachfrage, wenn weniger als im Lager liegt. Überschrift **„Eis Béieren am Stock“** (vom Nutzer).
  **Bilder auf den vier Knöpfen** (vom Nutzer, Fassung d, „nur als Gimmick“, mehrere Entwürfe gezeigt): `ABS_BILD`, eigene SVGs mit der
  App-Flasche (`ABS_FL`, `ABS_KISCHT`): Hand zieht eine von zwei Flaschen aus der LAGER-Kiste · Flasche schläft in der Kiste „Zz“ · Hand
  hält die Flasche **von hinten** (Finger verdecken sie nicht, vom Nutzer) und reicht sie einer offenen Hand (andere Ärmelfarbe) · eine
  Flasche mit roter Geschenkschleife + eine zerbrochen am Boden (Pfütze, ×-Augen).
- **Rechnungen** (vom Nutzer, 20.11.2026, Fassung b; Plan, Fenster-Entwurf und Muster-PDF aus den drei alten Rechnungen gezeigt und abgesprochen):
  **Wunsch** = Haken „🧾 Rechnung maachen“ beim Verkaufen (`verkauf.rechnung`) oder an der Bestellung — **beide standardmäßig aus** (vom Nutzer:
  die meisten brauchen keine). Geplante Bestellung mit Haken zeigt neben „Nach net bezuelt“ den Hinweis **„🧾 Rechnung nach net geschéckt“**
  (`.chip.rgef`, vom Nutzer). **Fenster** `#rechWahl` (`rechnungOeffnen`/`rechnungRender`, Zustand `RFORM`, zählt in `mittenImEintrag`): Adresse
  als Textfeld aus `rechnungsAdresse` (änderbar; Haken „Adress, Mail an Telefon och beim Client späicheren“ bzw. „Als neie Client späicheren“ —
  zurück in Client-Felder über `adresseTeile`: 1. Zeile Name, „À l'attention“ übersprungen, letzte Zeile Uertschaft), Mail/Telefon mit „📋 Kopéieren“,
  Anlass, Positionen aus dem Verkauf (nur lesen; Stückpreis aus `anteil`, letzte Zeile nimmt den Rundungsrest, `rechnungZeilen`) + **freie
  Positionen** (Anzahl, Text, Preis, ✕), Total / Scho bezuelt / Rescht. **„📄 PDF maachen“**: neue Nummer nur nach frischem Abgleich
  (`frischAbgleichen`, sonst Hinweis „muss online sinn“ — keine Nummer doppelt), `naechsteNr` = je Jahr ab JJJJ-001 über **alle** Rechnungs-Einträge
  (auch gelöschter Verkäufe). Eintrag `rechnung` mit `nr, datum, adresse, anlass, mail, tel, frei[]`; je Verkauf gilt die neueste — **Ändern behält
  die Nummer** (ohne Änderung kein neuer Eintrag). Alter Eintrag ohne `nr` = „Rechnung gemaach (ouni Nummer)“. **Freie Positionen erhöhen den
  geschuldeten Betrag** (vom Nutzer): `v.betrag` = Bier-Betrag `v.ware` + frei; Kasse/Offen/Umsatz/Excel stimmen, Bestand und Pro-Bier-Recetten nicht
  (die nehmen `ware`). **PDF** mit jsPDF 2.5.1 (cdnjs, erst beim Tippen; Helvetica = WinAnsi, darum „–“ statt „−“), `rechnungPdf`/`rechnungDaten`,
  Bilder `bilder/rechnung-{logo,krug,qr}.png` aus den alten PDFs (Facebook-QR unverändert übernommen): Logo, Absender, Facturé à, Nummer/Datum/
  Livraison du bzw. Date de vente/Payable jusqu'au, Occasion, Positionen, Total, Déjà payé, Reste à payer, BCEE-IBAN mit Mention „Facture Nr – Kunde“,
  „Payable dans les 30 jours“ (vom Nutzer), kein Steuer-Hinweis (vom Nutzer: erstmal nicht), Merci + Krug, Fuß mit QR. Danach die Anzeige (`#ansicht`
  mit `#ansichtInfo`, `rechInfo`): „⬆️ Deelen“ kopiert **nichts von selbst** (vom Nutzer, Fassung c: wer vorher die Telefonnummer für WhatsApp kopiert hat, will
  sie behalten) — im Kopf stehen „📋 Mail“ / „📋 Telefon“ zum Kopieren; **erfolgreich geteilt =
  verschickt** (Eintrag `rversand`), abgebrochen nicht; „✓ Schonn anescht verschéckt“ von Hand; „✎ Nach eppes änneren“. Wieder öffnen über den Chip
  „🧾 JJJJ-NNN ›“ (`rechnungZeigen`, rechnet das PDF neu, kein Eintrag). **Ausstoend**: oben „🧾 Rechnung nach ze maachen (n)“ mit „Maachen“ (auch
  bezahlte), darunter wie bisher, an jedem Verkauf der Chip (`rechChip`) und „Rechnung zënter n Deeg“; Reiterzahl zählt fehlende Rechnungen mit.
  Startseite „Nach op bei dir“: meine fehlenden Rechnungen. Verkafen mit Haken → Meldung mit „🧾 Elo Rechnung maachen“. **💡-Aufgaben**: Rechnung
  maachen (jetzt auch Verkäufe, Link öffnet das Fenster), neu „Rechnung … nach net verschéckt“ (ab dem Tag danach, Kontakt, 7 Tage), Erënneren zählt
  bei Rechnungen ab dem Rechnungsdatum (= ab Fristende) und nennt die Nummer. Excel: Spalte Rechnung mit Nummer (`rechnungStand`), Blatt „Rechnungen“.
  **Rechnung nodréiglech** (vom Nutzer, Fassung d, Entwurf gezeigt): Verkauf ohne Haken → kleiner **grauer** Knopf „🧾 Rechnung nodréiglech“
  (`rechNachKnopf`, `.knopf.klein`) an offenen Verkäufen unter Ausstoend und an gelieferten Bestellungen; im Reiter Client → Akeef je Kauf ein
  kleines 🧾 (bzw. Nummer / „Rechnung maachen ›“ wenn gewünscht) — so findet man auch bezahlte Verkäufe. Gewünscht bleibt gelb + rotes „Maachen“.
  Ebenso in der **Iwwersiicht → Liste pro Bier** (`uebRech`, vom Nutzer, Fassung e: Käufer ohne Client findet man nur dort).
  **Lieferdatum auf der Rechnung** (vom Nutzer, Fassung e: am 19. geliefert, geplant war der 20., PDF zeigte den 20.): „Livraison du“ / „Date de
  vente“ = Tag, an dem „Geliwwert ✓“ bzw. der Verkauf eingetragen wurde (`tagVon(v.zeit)`), im Fenster als Datum änderbar (`#rLiefer`,
  `rechnung.liefer`); alte Rechnungen ohne `liefer` nehmen von selbst den echten Tag.
- **Eigener Stückpreis** (vom Nutzer, 20.11.2026, Fassung d, Entwurf gezeigt): in Verkafen und Bestellung ist der Preis „3 € ✎“ gestrichelt
  antippbar (`prChipHtml`/`prBinden`, Zustand `FORM.preis`/`LFORM.preis`), wird zum kleinen Feld (`.prfeld`, ändert nur diesen Span, nie den Kasten);
  geändert = gelb + „amplaz 3 €“, Betrag rechnet mit (`stueckPreis`). Gilt nur für diesen Verkauf/diese Bestellung, Listenpreis bleibt. Gespeichert
  als `posten[].preis` (nur wenn abweichend, `postenMitPreis`); Bestellung ändern holt ihn zurück, „Geliwwert“ übernimmt ihn. `anteil` gewichtet mit
  dem eigenen Preis; `rechnungZeilen` nimmt die Stückpreise **genau**, wenn der Betrag dazu passt (sonst anteilig wie bisher). `postenText` zeigt „à 2,50 €“.
- **Buchhaltung** (vom Nutzer, 20.–22.11.2026, Entwurf als Bild gezeigt, „passt“; Fassung 22.11. a): Zahnrad ⚙️ → „📒 Buchhaltung“
  (`TAB = "buch"`, `#t-buch`, `renderBuch`, Zustand `BUCH`), gedacht auch für den Computer (Browser, drucken). Einmal im Jahr wird abgelegt;
  Ziel „alles wiederfinden“. Oben **Zeitraum** (Dëst Joer / Lescht Joer / Dëse Mount / Fräi, vum–bis) und **Filter** Béier, Zuelaart,
  Verkeefer, Client, Status; acht Ansichten (`BUCH_SICHTEN`): **Résumé** (verkauft, agaangen, op zum Stichtag, Rechnungen; je Zahlart, je Bier
  mit Fl./Fässer/€/gratis, je Verkäufer; „Nach op“ kennt keine Zahlart — mit Zuelaart-Filter steht darunter „gëllt fir all Zuelaarten“, auch in PDF/Excel, vom Nutzer, Fassung 22.11. l) · **Zuelungen** = Kassenbuch mit **fester Nummer Z-JJJJ-NNN** (`zahlNummern`, nach Eintragszeit,
  auch gelöschte behalten ihre Nummer und stehen durchgestrichen als STORNIERT, nicht im Total) · **Verkéf** (mit Bier-Filter nur der Anteil
  des Biers) · **Rechnungen** lückenlos inkl. stornierter (storniert = Verkauf gelöscht **oder** Rechnung selbst im Verlauf
  gelöscht — Fassung 22.11. b, vom Nutzer gemeldet: 001–003 nur als Rechnung gelöscht, standen noch als gültig da) · **Ausstoend zum Stichtag „bis“** (Zahlungen bis dahin, auch aus Vorjahren) ·
  **Stock** je Artikel (Anfang vor „vum“, abgefüllt, verkauft, getrunken, verschenkt, futti/soss, Ende) · **Ännerungen** (Löschungen,
  geänderte Bestellungen/Abfüllungen/Rechnungen mit wer/wann) · **Gratis** (vom Nutzer, Fassung 22.11. c: jeder Abgang mit Datum, Bier,
  Anzahl, Grund, bei wem, Bemerkung, eingetragen von; Grund-Knöpfe All/Gedronk/Verschenkt/Futti/Soss als eigener Filter `BUCH.grund`; hat den
  Platz des Platzhalters „Ausgaben“ bekommen — der kommt mit den Ausgaben selbst zurück). Logik `buchDaten(Z, F)` im Logik-Block,
  Tabellen `buchTabelle` (gleich für Bildschirm, PDF, Excel). **Alte Excel-Verkäufe bleiben draußen** (ohne Geld). Unter jeder Liste
  „🖨️ PDF vun dëser Lëscht“ (`buchPdf`, jsPDF, ab 7 Spalten quer, Kopf mit Zeitraum/Filter/erstellt von, Seitenzahlen) und „📊 Excel vun dëser
  Lëscht“ (`buchExcel`); „📄 All Rechnungen als ee PDF“ zwischen zwei Daten (`rechnungenSammelPdf`, `rechnungPdf` hängt mit `vorher` Seiten an,
  stornierte mit rotem „ANNULÉE“); „📊 Komplett Excel“ wie bisher. Ergebnis jeweils in `#ansicht` mit „⬆️ Deelen“ (`buchDateiZeigen`).
  **Zahltag änderbar** (Abgleich mit dem Kontoauszug): Zahlungsfenster hat „Bezuelt den“ (heute vorbelegt, `#zahlDatum`, `ZAHL_DATUM`, `zd()`),
  `zahlung.datum` nur wenn nicht heute; Buchhaltung nimmt `datum`, sonst den Eintragstag. Rechnungsnummer: bleibt wie es ist (vom Nutzer, 22.11.: die ersten Nummern waren Test-Rechnungen; echte zählen danach weiter).
- **Überweisung erst angekündigt** (vom Nutzer, 22.11.2026, Fassung d: „sonst würde verpasst, dass einer nicht zahlt“): Zahlart „Iwwerweisung“
  (Verkafen, Ausstoend, Bestellung/Vorauszahlung, Deelbetrag) speichert `zahlung` mit `wart: true` (`zw()`) — zählt **nicht** als bezahlt und nicht in
  der Kasse (`rechne`: `Z.wartend`, `v.wart`, `L.vorWart`). **Kein eigener Kasten** (vom Nutzer, Fassung 22.11. f): direkt am
  Verkauf unter „Nach net bezuelt“ bzw. an der geplanten Bestellung (`wartHtml`/`wartBinden`): Hinweis gestrichelt wie „Nach net bezuelt“: „🏦 Iwwerweisung vum <Datum> nach ausstoend · <Betrag>“ (vom Nutzer, Fassung g), „ukomm den“ + Datum (heute
  vorbelegt = Tag laut Kontoauszug), „✓ Ukomm“ → Eintrag `zbest` (ref = Zahlung, `datum` nur wenn nicht heute) → erst dann bezahlt; **„Aanescht
  bezuelt“** (statt ✕, vom Nutzer: bezahlt werden muss trotzdem) → Auswahl WERO/SumUp/Bar (`zahlartWaehlen(…, ohne)`) → storno der Ankündigung + neue
  Zahlung mit gleichem Betrag in einem `eintragen`. **Bezahl-Knöpfe nur für den nicht angekündigten Rest** (vom Nutzer, Fassung k, ersetzt das
  `wartWeg` aus Fassung h: „Ukomm/Aanescht bezuelt“ und „36 € bezuelt“ waren doppelt): `offenRest(v)` = offen − angekündigt (`wartSumme`). Ein Verkauf,
  der ganz angekündigt ist, hat keinen Bezahl-Knopf; die Karte zählt unten nur die übrigen (`K.bez`, `K.bezOffen`): keiner → nur „Erënneren“, einer →
  „<Rest> bezuelt ✓“, mehrere → Einzelknöpfe + „Béid/All n zesummen“. Zwei angekündigte Überweisungen = je eigenes „✓ Ukomm“. Deelbetrag verteilt nur
  auf den Rest; gelieferte Bestellung „<Rest> bezuelt ✓“; Vorauszahlung/Acompte rechnet den Rest ohne Angekündigtes. Angekündigtes bleibt dabei stehen. 💡 nach 7 Tagen „Iwwerweisung vu X
  kucken — ukomm?“ für Verkäufer/Kontakt, abgehakt nach 7 Tagen wieder. Buchhaltung: angekündigte stehen als „UGEKËNNEGT, NACH NET UKOMM“ (nicht im
  Total), bestätigte mit dem Tag vom Kontoauszug. Alte Überweisungen ohne `wart` zählen wie bisher sofort. **Durchsicht** (vom Nutzer, Fassung 22.11. j): 🏦-Block auch an der
  **gelieferten** Bestellung; geplante Bestellung, deren Rest ganz als Überweisung angekündigt ist, zeigt nur den 🏦-Hinweis (kein „Nach net
  bezuelt ›“); Zahlungsfenster-Datum heißt „Den“ (bei Iwwerweisung = Tag der Ankündigung, der Ankunftstag kommt mit „Ukomm“); Startseite „Nach op bei
  dir“ mit „🏦 Iwwerweisung ugekënnegt“; Excel `bezahltText` „Nee (Iwwerweisung ugekënnegt)“, Bestellungen-Blatt ebenso. Reiterzahl Ausstoend zählt Wartende mit.
- **Bezahl-Knöpfe in Ausstoend** (vom Nutzer, 22.11.2026, Fassung i, Entwurf gezeigt: „Alles bezuelt“ war verwirrend): Karte = Käufer. Ein offener
  Verkauf → roter Knopf „<Betrag> bezuelt ✓“; mehrere → je Verkauf ein roter Knopf „<Betrag> bezuelt ✓“ (`data-vbez`, vom Nutzer: rot, damit man
  sieht, dass man klicken kann), unten abgesetzt „Béid zesummen: …“ / „All n zesummen: … bezuelt ✓“ und der Satz „Deelbetrag geet op deen eelsten
  Verkaf zuerst“. Auch der Einzelknopf ersetzt eine angekündigte Überweisung (`wartWeg`).
- **Verlauf mit Suchfeld** (vom Nutzer, Fassung 22.11. d): `#vlSuche` bleibt beim Neuaufbau stehen (nur `#vlListe` wird neu gebaut, `renderVerlaufListe`),
  sucht in Text, wer und Zeit (alle Wörter müssen vorkommen), „n fonnt“.
- **Aktionsknöpfe rot, nicht grün** (vom Nutzer, Fassung 20.11. a): „Geliwwert ✓“, „Bezuelt ✓“, „Alles bezuelt ✓“ und Späicheren
  bei „+ Aufgab“ sind `.knopf.akt` (Millebéier-Rot, weiße Schrift) — grün sah aus, als wäre es schon erledigt. Grün bleibt nur
  für Erledigtes (✓ bezuelt, gewählte Zahlungsart).
- **`durch` = wer eingetragen hat** (nicht `von` — das ist bei `bewegung` die Herkunft; die
  Verwechslung war der erste Fehler).
- Bestand hängt am **Namen** — Leute nicht umbenennen, wenn sie Flaschen haben.
- Offline: neue Einträge liegen in `millebeier_v1_ausgang`, bis der Worker sie hat; Einfügen ist
  idempotent (`INSERT OR IGNORE` über die id).
- `WORKER_URL` = https://millebeier.rjtp6r9s9h.workers.dev/ (Cloudflare-Konto des Nutzers, eingerichtet 13.11.2026). Leer = Probe-Modus (alles nur im localStorage des Handys). Die Domain ist in der Cloud-Umgebung nicht freigegeben — prüfen kann nur der Nutzer.
- Käufernamen: gleiche Schreibweise ohne Groß/klein wird zusammengefasst, beim Eintragen der
  bekannte Name übernommen.
- Logo vom Nutzer (13.11.2026): `bilder/icon-180.png` (Home-Bildschirm, schwarzer Grund), `icon-512.png`, `logo-96.png` (Kopf, durchsichtig).
- **Doppeltipp-Schutz** (vom Nutzer, 13.11.2026), vier Stufen: `html`/`*{touch-action:manipulation}` (wie in der Koeppchen-App — **reichte hier am iPhone nicht**, Fassung n, Ursache unbekannt); deshalb `touchend`-Wächter: zweiter Ein-Finger-Tipp < 350 ms und < 40 px vom ersten wird abgefangen (−/+ bekommt ihn per `click()`, Eingabefelder ausgenommen, zwei Finger frei — **nie `user-scalable=no`**, der Nutzer will Zwei-Finger-Zoom; Test `test/tippen.mjs`, Gegenprobe gemacht); Klick-Wächter im Capture: derselbe Knopf (id + data + Text) innerhalb 800 ms wird verschluckt, −/+ ausgenommen; `eintragen()` speichert denselben Inhalt innerhalb 3 s nicht zweimal (gibt dann `[]` zurück — Aufrufer müssen das abfangen). Tests in `oberflaeche.mjs`, Gegenprobe gemacht. Tests, die denselben Knopf zweimal drücken, müssen > 800 ms warten.
- **Artikel vor Namen** (vom Nutzer: „Du bass de Laurent“): Verkäufer (alle Männer) über `de()`/`beim()` („de Jeff“, „beim Jeff“, „d'Lager“, „am Lager“); Käufer können Frauen sein (d'Anne) → Sätze mit Käufernamen ohne Artikel bauen („Paul: 4 € bezuelt?“). Kommt eine Verkäuferin dazu, braucht `de()` eine Liste.
- **Verlauf: rotes ✕ = Läschen** (= storno, Text „Dësen Agab läschen?“, „geläscht vum …“), vom Nutzer: ↶ war unklar.
  **Iwwersiicht: rotes ▶/▼** vor jeder Sorte (vom Nutzer: Dreieck war zu klein).
  **Pro Zort zeigt nur aktuelle Biere**; archivierte (und Sorten ohne Eintrag) stehen gesammelt in einer Zeile
  „📦 Archiv (n)“ mit ihren Summen (Total bleibt vollständig), aufklappbar, darin je Bier kleiner und eingerückt,
  wieder mit ▶ zu den Verkäufen (vom Nutzer, 14.11.2026). Archiv zuklappen schließt ein offenes Archiv-Bier mit.
  **Von selbst zuklappen** (vom Nutzer, Fassung 16.11. a): Iwwersiicht (Sorten-▶, Archiv) und Stock (Archiv der Biere) klappen
  zu, wenn man > 5 min nicht im Reiter war — wie die Clienten (`ZUKLAPPEN` je Reiter, `zuklappenPruefen` in `render`).
  Kopf: Name `white-space:nowrap` — bei langem Status (offline) brach er sonst als „Millebé / ier“ um.
- **Name im Kopf** ganz weiß, nur der Akzent auf dem é rot wie im Logo: weißes „e“ mit rotem Strich darüber (`.akz::after`), weil sich ein Akzent nicht einzeln einfärben lässt.
- **Farben wie im Logo** (vom Nutzer, 13.11.2026): schwarz, weiß, Rot `--akzent` (#e3141b) für Knöpfe und markierte Reiter, Kopf mit rotem Strich und grauer Linie wie der Logo-Ring. Grün (bezahlt) und Gelb (offen) bleiben als Bedeutungsfarben.
- iPhone-Regeln wie in den anderen Apps des Nutzers: kein `viewport-fit=cover`, Kasten mit
  fokussiertem Feld nie neu bauen (`tipptIn`), Zahlenfelder mit `inputmode`, Teilen über
  `navigator.share`.
- **`FASSUNG`** unten in `index.html` bei jeder Änderung hochzählen — daran hängt auch das **automatische Update** (vom Nutzer, 13.11.2026): beim Öffnen und bei jeder Rückkehr holt `updatePruefen()` die Seite mit `cache:"reload"`, steht dort eine andere FASSUNG, lädt die App neu; mitten im Eintrag (`mittenImEintrag`) stattdessen roter Knopf oben. Je Zielfassung ein Versuch in 5 min (`millebeier_v1_update`), gegen Schleifen bei altem CDN-Stand. Ohne Hochzählen kommt kein Update an. (Die Apps in panini-wm-2026 haben das nicht.)

## Neuanfang (14.11.2026, vom Nutzer)
`tools/neustart.sql` im D1-Dashboard (Console) ausführen: löscht alle Einträge außer Biere/bierstatus/Dateien/
einstellungen/`alt26-…`; Löschungen (storno) bleiben nur, wenn ihr Ziel bleibt. An einer nachgebauten SQLite-DB
geprüft (Gegenprobe gemacht). Die Datenbank ist von der Cloud-Umgebung aus nicht erreichbar — ausführen kann nur der
Nutzer. Rückweg: D1 Time Travel (Restore auf einen Zeitpunkt davor).

## Testen — vor jedem Push alle vierzehn, jeder mit eigenem Rückgabewert
**Push nur, wenn alle vierzehn 0 zurückgeben** — die Schleife gibt den Push erst danach frei (`ok`-Merker). Am 18.11.2026 (Fassung g) ging
ein Commit trotz roter Tests raus: ein `//`-Kommentar mitten in einer einzeiligen Anweisung schnitt den Rest der Zeile ab, das ganze
Script lief nicht, und damit auch kein automatisches Update. In Code auf einer Zeile nur `/* … */`-Kommentare.
- `node test/logik.mjs` — schneidet `Logik`…`Oberfläche` aus der HTML (Gegenprobe gemacht).
- `node test/worker.mjs` — Worker mit nachgebauter D1, auch Kalender-.ics (Gegenprobe gemacht).
- `node test/oberflaeche.mjs` — Playwright, zwei Handys gegen den echten Worker-Code, offline.
- `node test/tippen.mjs` — nachgebautes iPhone: Doppeltipp-Zoom-Sperre, −/+, schnelle Knopffolgen.
- `XLSX_JS=…/xlsx.full.min.js node test/livraisons.mjs` — Livraison planen/liefern/Rechnung/bezahlen, Liste pro Bier,
  Excel-Export (Datei wird mit SheetJS zurückgelesen), alter Worker. cdnjs ist in der Cloud-Umgebung gesperrt:
  SheetJS 0.18.5 per `npm install xlsx@0.18.5` in den Scratchpad, Pfad über `XLSX_JS`; ohne wird der Excel-Teil übersprungen.
  Auch Vorauszahlung (Zeile antippen, Acompte, zu viel abgelehnt, Löschen fragt nach, Anrechnen beim Liefern); Logik in `logik.mjs` (Gegenprobe gemacht).
- `XLSX_JS=… PDFJS_DIR=…/pdfjs-dist/build node test/dateien.mjs` (mit XLSX_JS auch .ods-Anzeige) — Dateien: PDF mit Vorschau, Foto, 1,5 MB in 3 Stücken (Byte für
  Byte auf dem zweiten Handy, Gegenprobe gemacht), Anzeige, Ersetzen, Löschen, > 10 MB abgelehnt. pdf.js per
  `npm install pdfjs-dist@3.11.174` in den Scratchpad. `test/fake-d1.mjs` = gemeinsame nachgebaute D1. Achtung beim
  Testen: derselbe Knopf zweimal < 800 ms zählt einmal (Doppeltipp-Schutz) — Tests müssen warten wie ein Mensch.
- `node test/faesser.mjs` — Bier mit Fässern, Fass-Zeilen, Reservierung + Warnung (Gegenprobe gemacht), Zahlungsarten.
- `node test/kunden.mjs` — Reiter Client (Anlegen, alphabetisch, Firma vor Name, Aufklappen, Akeef, Suche, Ändern, Löschen,
  alte Clienten = Firma, nur Vorname), Verlauf im Zahnrad, Käufer-Felder mit/ohne Haken „Neie Client“, früherer Käufer → alias,
  Umbenennen: aktueller Name überall, nichts fällt aus „Akeef“ (Gegenprobe gemacht).
- `node test/kalender.mjs` — Kalender: Termin, Vorschlag +7/+14 mit änderbarem Datum, Bestellungen nur in der App, Filter,
  Ändern/Löschen, Abo-Link aus dem Code, Zuklappen (Gegenprobe gemacht).
- `node test/haut.mjs` — Startseite beim Öffnen, Logo, drei Knöpfe auf „Just meng“, Karten nur mit eigenen Daten, Reiter unten
  (fest, Namen passen bei 375 px, Inhalt endet über den Reitern) (Gegenprobe gemacht).
- `node test/aufgaben.mjs` — Aufgaben: Kästen am Kalender, anlegen (Enter/+, Fir, bis), Just meng, abhaken/zurück, „+ Aufgab“ an Bestellung
  (auch nach Ändern verlinkt) und Termin, Knöpfe in einer Zeile, 💡 Rechnung + Erklärung, nach 14 Tagen wieder, Startseite nur meine,
  „nicht geschickt“, Excel, „Jidderee muss“ (Gegenprobe gemacht). Automatische Aufgaben im Einzelnen in `logik.mjs` (Gegenprobe gemacht).
- `JSPDF_JS=…/jspdf/dist/jspdf.umd.min.js node test/rechnungen.mjs` — Rechnungen: Haken aus, Fenster, Kopieren, freie Position, PDF-Inhalt
  (Rohtext der PDF-Datei), Deelen = verschickt / Abbruch nicht, Ändern behält Nummer, zweites Handy JJJJ-002, offline keine Nummer, Ausstoend,
  Startseite, Hinweis an geplanter Bestellung, eigener Stückpreis (Verkafen/Bestellung/Ändern), „Rechnung nodréiglech“, Client-Akeef, Lieferdatum, 🧾 in der Iwwersiicht (Gegenprobe gemacht). jsPDF per `npm install jspdf@2.5.1` in den Scratchpad; ohne wird übersprungen.
- `JSPDF_JS=… XLSX_JS=… node test/buchhaltung.mjs` — Buchhaltung: Résumé, Kassenbuch (feste Nummern, storniert sichtbar, nicht im Total),
  Filter SumUp, Druck-PDF der Liste, Verkéf mit Bier-Anteil, Rechnungen inkl. storniert, Ausstoend zum Stichtag, Stock Anfang/Ende, Ännerungen,
  Lescht Joer, Sammel-PDF (ANNULÉE), Excel der Liste, Zahltag im Zahlungsfenster, Verschenkt mit Bemerkung, Gratis mit Grund-Filter, Überweisung angekündigt/✕, Verlauf-Suche (Gegenprobe gemacht).
- `node test/biere.mjs` — Bier anlegen/ändern/archivieren/zurückholen/löschen (zwei Rückfragen, Gegenprobe gemacht),
  rotes ✕ im Verlauf, rotes Dreieck; Kasten „Fläschen“ (vier Absichten, Pfeil, ⇄, änneren, Vorschau, Gründe) und Abfüllen ändern beim Bier
  (48 → 60 → 50, Verlauf; Gegenprobe gemacht).

## Ideen, nicht gebaut
**Durchsicht aus Brauer-Sicht (17.11.2026), Antwort des Nutzers:** **Startseite und Reiter unten gebaut** (Fassung 17.11. a, siehe
Aufbau). Später vielleicht: +6/+24-Knöpfe, Packs/Sonderpreise. **Abgelehnt** (vom Nutzer): Stand-Verkauf ohne
Namen (Stand wird am Ende gesammelt unter Firma eingetragen), „Bargeld bei wem“, Fässer als Leihgut (sind keins), Rückgängig-Leiste,
Reiter zusammenlegen (einzeln findet man sie eher), Afëllen-Termin → Bestand, „älteste Flaschen zuerst“.
Allgemeine Dateien ohne Bier (Logik kann `bier: ""` schon);
Excel-Datei, die sich ständig selbst aktualisiert (vom Nutzer gefragt 14.11.2026, Wege besprochen, noch offen);
Ausgaben (Malz, Hopfen, Flaschen) → Gewinn; Daueraufträge (in der alten Tabelle rot); Reservierungen; Kisten-Preis; Kassensturz (Ist-Betrag
in der Kasse gegen App).
