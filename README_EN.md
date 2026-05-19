# NVIDIA GPU Driver & CUDA Toolkit Releases

A web dashboard that aggregates Linux Data Center GPU driver releases from [NVIDIA's official documentation](https://docs.nvidia.com/datacenter/tesla/index.html) and CUDA Toolkit releases from the [CUDA Toolkit Release Notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html), providing searchable, sortable access to driver versions, CUDA compatibility, and direct download links.

**Live site:** [https://lhylhy1.github.io/gpu-release/](https://lhylhy1.github.io/gpu-release/)

## Features

### GPU Drivers
- Search across driver versions, CUDA versions, release dates, and fixed issues
- Filter by driver release family (e.g. 550, 535, 525)
- Sortable table with version, release date, CUDA version, fixed issues count, and download links
- Expandable fixed issues list per driver
- One-click copy download link

### CUDA Toolkit
- CUDA version to minimum driver version mapping
- Linux / Windows driver compatibility
- Filter by major version (e.g. 13.x, 12.x)
- One-click download .run installer and copy link

### General
- Pagination for large result sets
- Dark theme with NVIDIA-inspired styling

## Tech Stack

- **Frontend:** Vue 3 + Vite
- **Data Source:** Scraped from NVIDIA docs via `scraper.mjs` and `cuda-scraper.mjs` (cheerio)
- **Hosting:** GitHub Pages (auto-deployed on push to `main`)

## Data Pipeline

1. `scraper.mjs` crawls the [NVIDIA Tesla driver index](https://docs.nvidia.com/datacenter/tesla/index.html) and each release notes page
2. `cuda-scraper.mjs` crawls the [CUDA Toolkit Release Notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html)
3. Extracted data is saved to `public/drivers.json` and `public/cuda.json`
4. The Vue app loads these JSON files at runtime and renders the interactive tables

To update data:

```bash
node scraper.mjs
node cuda-scraper.mjs
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

The output is written to `dist/` and deployed to GitHub Pages via the CI workflows in `.github/workflows/`.

[中文](./README.md)

## License

MIT