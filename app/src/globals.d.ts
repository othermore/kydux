// The values Vite puts into the page at build and dev start (vite.config.ts).

/** The stamp of the world the page is built with (scripts/stamp.mjs). */
declare const __WORLD_STAMP__: string;
/** Pyodide's version, the folder under pyodide/ its files are served from (D230). */
declare const __PYODIDE_VERSION__: string;
/** The page's build: the short git hash and the day, or `local`. */
declare const __BUILD__: string;
