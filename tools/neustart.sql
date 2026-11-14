-- Millebéier: Neuanfang. Bleiben: Biere (bier, bierstatus), Dateien (datei), Leute (einstellungen),
-- die alten Excel-Verkäufe (ids alt26-…) und Löschungen, die sich auf etwas Bleibendes beziehen.
DELETE FROM eintraege
 WHERE id NOT LIKE 'alt26-%'
   AND json_extract(daten, '$.art') NOT IN ('bier', 'bierstatus', 'datei', 'einstellungen', 'storno');
DELETE FROM eintraege
 WHERE json_extract(daten, '$.art') = 'storno'
   AND json_extract(daten, '$.ref') NOT IN (SELECT id FROM eintraege);
