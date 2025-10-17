# MeiliNameSearch React UI

This is a full React project implementing the **Smart Name Search** UI.  It uses **Vite + React** with **Tailwind CSS** to provide a modern, attractive search experience.  The interface includes sorting, state filtering, progress‑bar visualization of ranking scores, and a dark/light theme toggle.

## Prerequisites

* **Node.js** version 16 or higher
* **npm** (or `yarn` if you prefer)

## Installation

1. Clone or copy this directory onto your machine.
2. From inside the `MeiliNameSearchReact` directory, install the dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   By default Vite will start on port 5173.  The console will show the exact URL (e.g. http://localhost:5173).

4. Ensure your **NameSearch API** is running on `http://localhost:5000` (for example, by running `docker compose up` in the MeiliNameSearch back‑end).  If your API is hosted on a different port or host, update the `apiBaseUrl` constant in `src/App.jsx` accordingly.

5. Open the app in your browser.  Use the search bar to query names.  The UI will call the `/NameSearch/search` endpoint and display sorted and filtered results.

## Building for production

Run the following command to produce an optimized build in the `dist/` directory:

```bash
npm run build
```

You can then serve the `dist/` folder with any static server.

## Customization and next steps

The project is a foundation you can extend.  Consider these enhancements:

* **Facet filters and advanced search** – Add more filter options for attributes such as city, category or date.  Meilisearch supports facet filters and sort parameters; you could update the API to pass those parameters through to Meilisearch and expose controls in the UI.
* **Custom ranking** – Adjust Meilisearch's ranking by adding custom rules.  For example, you can order results by a `createdAt` or `score` field using `attribute:asc` or `attribute:desc` rules in your index settings【548573118159552†L191-L201】.  Expose these options in the UI so users can choose their preferred ordering.
* **Synonyms and nicknames** – Use Meilisearch's synonym settings to make equivalent terms (e.g. “Liz” and “Elizabeth”) match【199951920922091†L186-L233】.  Provide an admin interface or configuration file for managing these synonyms.
* **Vector and hybrid search** – Meilisearch now supports vector fields and hybrid search, which combines full‑text and semantic matching【548573118159552†L248-L256】.  You could generate embeddings for names or descriptions, store them in the index, and update the API and UI to take advantage of this feature.
* **shadcn/ui components** – This project uses plain Tailwind CSS classes.  To adopt the shadcn/ui design system (which emphasises accessible, composable components with beautiful defaults【498490431631439†L191-L203】), install the library and replace or augment components.  For example, you could use shadcn dialogs, tabs, dropdowns or toasts for a richer experience.

## License

This project is provided as-is for educational purposes.  Feel free to modify and distribute it as needed.