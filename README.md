# NVIDIA 数据中心 GPU 驱动版本汇总

汇总 [NVIDIA 官方文档](https://docs.nvidia.com/datacenter/tesla/index.html) 中的 Linux 数据中心 GPU 驱动发布信息，提供可搜索、可排序的驱动版本、修复问题、CUDA 兼容性及下载链接。

**在线访问：** [https://lhylhy1.github.io/gpu-release/](https://lhylhy1.github.io/gpu-release/)

## 功能特性

- 跨字段搜索：驱动版本、CUDA 版本、发布日期、修复问题
- 按驱动系列筛选（如 550、535、525）
- 可排序表格：版本、发布日期、CUDA 版本、修复问题数、下载链接
- 可展开查看每条驱动的修复问题详情
- 大数据量分页
- 暗色主题，NVIDIA 风格

## 技术栈

- **前端：** Vue 3 + Vite
- **数据来源：** 通过 `scraper.mjs`（cheerio）从 NVIDIA 文档抓取
- **托管：** GitHub Pages（推送到 `main` 分支自动部署）

## 数据流程

1. `scraper.mjs` 爬取 [NVIDIA Tesla 驱动索引页](https://docs.nvidia.com/datacenter/tesla/index.html)及各版本发布说明
2. 提取的数据（版本号、发布日期、CUDA 版本、修复问题、下载链接）保存至 `public/drivers.json`
3. Vue 应用运行时加载该 JSON 并渲染交互式表格

更新驱动数据：

```bash
node scraper.mjs
```

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`，通过 `.github/workflows/pages.yml` 中的 CI 工作流自动部署到 GitHub Pages。

[English](./README_EN.md)

## 许可证

MIT