# NVIDIA Data Center GPU Driver Releases

A web dashboard that aggregates Linux Data Center GPU driver releases from [NVIDIA's official documentation](https://docs.nvidia.com/datacenter/tesla/index.html), providing searchable, sortable access to driver versions, fixed issues, CUDA compatibility, and direct download links.

**Live site:** [https://lhylhy1.github.io/gpu-release/](https://lhylhy1.github.io/gpu-release/)

## Features

- Search across driver versions, CUDA versions, release dates, and fixed issues
- Filter by driver release family (e.g. 550, 535, 525)
- Sortable table with version, release date, CUDA version, fixed issues count, and download links
- Expandable fixed issues list per driver
- Pagination for large result sets
- Dark theme with NVIDIA-inspired styling

## Tech Stack

- **Frontend:** Vue 3 + Vite
- **Data Source:** Scraped from NVIDIA docs via `scraper.mjs` (cheerio)
- **Hosting:** GitHub Pages (auto-deployed on push to `main`)

## Data Pipeline

1. `scraper.mjs` crawls the [NVIDIA Tesla driver index](https://docs.nvidia.com/datacenter/tesla/index.html) and each release notes page
2. Extracted data (version, release date, CUDA version, fixed issues, download URL) is saved to `public/drivers.json`
3. The Vue app loads this JSON at runtime and renders the interactive table

To update driver data:

```bash
node scraper.mjs
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The output is written to `dist/` and deployed to GitHub Pages via the CI workflow in `.github/workflows/pages.yml`.

## License

MIT