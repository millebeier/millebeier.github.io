# Millebéier 🍺

Wer hat wie viele Flaschen, was ist verkauft, was ist bezahlt — für die vier von Millebéier,
jeder auf seinem Handy, alle sehen denselben Stand.

App: https://strakekine.github.io/millebeier/  (Safari → Teilen → „Zum Home-Bildschirm“)

## Einrichten (einmal)
1. **Cloudflare** → Storage & Databases → D1 → Datenbank `millebeier` anlegen.
2. Workers & Pages → Create → Worker `millebeier` → Inhalt von `worker.js` einfügen → Deploy.
3. Worker → Settings → Bindings → **D1 database**: Variablenname `DB`, Datenbank `millebeier`.
4. Worker → Settings → Variables and Secrets → **Secret** `CODE` = euer gemeinsamer Code.
5. Worker-Adresse in `index.html` bei `WORKER_URL` eintragen.
6. GitHub → Settings → Pages → Branch `main`, Ordner `/`.

Den Code sagt ihr euch mündlich; jedes Handy fragt ihn einmal ab.
