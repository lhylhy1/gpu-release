import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as cheerio from 'cheerio'

const INDEX_URL = 'https://docs.nvidia.com/datacenter/tesla/index.html'
const DOCS_BASE = 'https://docs.nvidia.com/datacenter/tesla/'
const DELAY_MS = 1500
const OUT_PATH = join('public', 'drivers.json')

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'gpu-release-scraper/1.0 (+https://github.com/lhylhy1/gpu-release)' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === retries - 1) throw e
      await sleep(2000 * (i + 1))
    }
  }
}

function parseLinuxVersion(text) {
  const match = text.match(/(\d{3}\.\d{2,3}\.\d{2,3})\(Linux\)/)
  return match ? match[1] : null
}

function parseFamilyFromHref(href) {
  const m = href.match(/tesla-release-notes-(\d{3})/)
  return m ? m[1] : null
}

function parseIndexPage(html) {
  const $ = cheerio.load(html)
  const drivers = []
  const seen = new Set()

  $('a').each((_, el) => {
    const link = $(el)
    const text = link.text().trim()
    const href = link.attr('href') || ''
    const version = parseLinuxVersion(text)
    if (!version || seen.has(version)) return
    seen.add(version)

    const family = parseFamilyFromHref(href)
    if (!family) return

    let docUrl = href
    if (!docUrl.startsWith('http')) {
      docUrl = DOCS_BASE + href.replace(/^\.\.\//, '')
    }

    drivers.push({ version, releaseFamily: family, docUrl })
  })

  return drivers
}

async function scrapeReleaseNotes(driver) {
  const html = await fetchWithRetry(driver.docUrl)
  const $ = cheerio.load(html)

  const cudaVersion = extractCudaVersion($)
  const releaseDate = extractReleaseDate($)
  const fixedIssues = extractFixedIssues($)
  const supportedGpus = extractSupportedGpus($)

  return {
    version: driver.version,
    releaseFamily: driver.releaseFamily,
    releaseDate,
    cudaVersion,
    fixedIssues,
    supportedGpus,
    docUrl: driver.docUrl,
  }
}

function extractCudaVersion($) {
  const text = $('body').text()
  const m = text.match(/CUDA Toolkit\s+\d+\s*:\s*([\d.x]+)/)
  return m ? m[1].trim() : ''
}

function extractReleaseDate($) {
  const text = $('body').text()
  const m = text.match(/Linux driver release date:\s*(\d{2}\/\d{2}\/\d{4})/)
  if (!m) return ''
  const parts = m[1].match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!parts) return ''
  return `${parts[3]}-${parts[1]}-${parts[2]}`
}

function extractFixedIssues($) {
  const issues = []
  const body = $('body')
  let inFixedSection = false

  body.find('h1, h2, h3, h4, li').each((_, el) => {
    const $el = $(el)
    const tag = el.tagName.toLowerCase()
    const text = $el.text().trim()

    if (tag.match(/^h[1-4]$/) && /fixed\s+issues/i.test(text)) {
      inFixedSection = true
      return
    }
    if (tag.match(/^h[1-4]$/) && inFixedSection) {
      inFixedSection = false
      return
    }

    if (inFixedSection && tag === 'li' && text.length > 5) {
      issues.push(text.replace(/\s+/g, ' ').trim())
    }
  })

  return issues
}

function extractSupportedGpus($) {
  const gpus = []
  let inSection = false

  $('h1, h2, h3, h4, table').each((_, el) => {
    const $el = $(el)
    const tag = el.tagName.toLowerCase()

    if (tag.match(/^h[1-4]$/) && /supported\s+nvidia\s+data\s+center\s+gpus/i.test($el.text())) {
      inSection = true
      return
    }
    if (tag.match(/^h[1-4]$/) && inSection) {
      inSection = false
      return
    }

    if (inSection && tag === 'table') {
      $el.find('tbody tr, tr:not(:first-child)').each((_, row) => {
        const firstTd = $(row).find('td').first()
        const text = firstTd.text().trim()
        if (text && !/product|architecture/i.test(text) && text.length > 2) {
          gpus.push(text.replace(/\s+/g, ' ').trim())
        }
      })
    }
  })

  return gpus
}

async function main() {
  console.log('Fetching index page...')
  const indexHtml = await fetchWithRetry(INDEX_URL)
  const drivers = parseIndexPage(indexHtml)
  console.log(`Found ${drivers.length} Linux driver entries`)

  const existing = (() => {
    try {
      return JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
    } catch {
      return []
    }
  })()
  const existingMap = new Map(existing.map(d => [d.version, d]))

  let scraped = 0
  let skipped = 0

  for (const driver of drivers) {
    const cached = existingMap.get(driver.version)
    if (cached && cached.supportedGpus) {
      skipped++
      continue
    }

    console.log(`Scraping v${driver.version}...`)
    try {
      const data = await scrapeReleaseNotes(driver)
      existingMap.set(driver.version, data)
      scraped++
    } catch (e) {
      console.error(`  Failed: ${e.message}`)
      const old = existingMap.get(driver.version)
      if (old && !old.supportedGpus) old.supportedGpus = []
    }

    await sleep(DELAY_MS)
  }

  const sorted = [...existingMap.values()].sort((a, b) => {
    const pa = a.version.split('.').map(Number)
    const pb = b.version.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0)
    }
    return 0
  }).map(d => ({ ...d, supportedGpus: d.supportedGpus || [] }))

  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`\nDone: ${scraped} scraped, ${skipped} cached, ${sorted.length} total drivers`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})