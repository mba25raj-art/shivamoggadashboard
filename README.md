# Shivamogga District Dashboard

Responsive dashboard with a light theme, district-to-taluk-to-village map exploration, and five tabs:

- District overview
- Jal Jeevan Mission
- PM-KISAN
- PM Awas Yojana (Urban and Gramin shown separately)
- e-Shram

The Data Checks tab has been removed. Source actions and reporting-date labels remain available alongside each scheme.

## Hosting

The complete, verified static build is in `dist/`. The included GitHub Actions workflow publishes it to GitHub Pages on pushes to `main`.

Expected Pages address after deployment: https://mba25raj-art.github.io/shivamoggadashboard/

If first-time Pages enablement is blocked by repository policy, open **Settings → Pages**, set **Source** to **GitHub Actions**, and rerun the workflow.

For local preview, run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000. Serve the whole directory; the HTML loads its accompanying JSON snapshot.

## Editing and rebuilding

Dashboard components and responsive styling live in `src/content/dashboard/`; the app-wide light palette is in `src/theme.css`. Reviewed rows and provenance are in `src/data.json`.

Use the Data plugin's canonical build command from an environment with that plugin installed:

```sh
node <data-plugin-root>/scripts/data-app.mjs build --project-dir <checkout> --separate-data
python3 scripts/verify-static-build.py
```

Commit the rebuilt `dist/` directory together with source changes. The deployment workflow verifies hashes and publishes the committed build without downloading or refreshing government figures.

## Data

Official-source snapshot reviewed 23 October 2026. Reporting periods differ by scheme. This is a published snapshot, not an automatic live data feed or an official government portal.

- JJM district, block and village counts reconcile. Map geometry comes from an archived KGIS copy; its administrative vintage is unconfirmed.
- PM-KISAN payment figures are historical, ending Aug–Nov 2022.
- e-Shram district and taluk figures retain the source's unreconciled difference.
- PMAY-Urban stages and the PMAY-Gramin waiting-list cohort are separate measures.

Material limitations stay visible on the relevant scheme view. Full source links, definitions and rows are retained in the dashboard.
