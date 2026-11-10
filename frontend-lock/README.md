# Frontend lock (live Apps Script v792)

Built `Index.html` + `LogicPayload_*` pulled from production on 2026-11-10.

`build.js` copies these into `dist/` instead of recompiling the older HTML modules, so a milestone cannot roll live UI back to the pre-DAL tree.

To return to HTML-module builds: delete this folder (or remove its payload files) and fix/update the `*.html` modules until `node build.js` matches production again.
