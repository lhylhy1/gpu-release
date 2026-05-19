import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as cheerio from 'cheerio'

const RELEASE_NOTES_URL = 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html'
const OUT_PATH = join('public', 'cuda.json')

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

function parseVersionLabel(label) {
  label = label.trim()

  let m = label.match(/^CUDA\s+(\d+\.\d+\.\d+)$/)
  if (m) return { version: m[1], label: label.replace(/^CUDA\s+/, '') }

  m = label.match(/CUDA\s+(\d+\.\d+)\s+\((\d+\.\d+\.\d+)/)
  if (m) return { version: m[2], label: label.replace(/^CUDA\s+/, '') }

  m = label.match(/CUDA\s+(\d+\.\d+)\s+Update\s+(\d+)/)
  if (m) return { version: `${m[1]}.${m[2]}`, label: label.replace(/^CUDA\s+/, '') }

  m = label.match(/CUDA\s+(\d+\.\d+)\s+GA/)
  if (m) return { version: `${m[1]}.0`, label: label.replace(/^CUDA\s+/, '') }

  m = label.match(/CUDA\s+(\d+\.\d+\.\d+)\s+RC/)
  if (m) return { version: m[1], label: label.replace(/^CUDA\s+/, '') }

  m = label.match(/CUDA\s+(\d+\.\d+)/)
  if (m) return { version: m[1], label: label.replace(/^CUDA\s+/, '') }

  return { version: '', label }
}

function parseDriverVersion(text) {
  text = text.trim()
  const m = text.match(/>?=?\s*(\d+\.\d+\.\d+)/)
  return m ? m[1] : ''
}

function extractResolvedIssues($, sectionPrefix) {
  const issues = []
  let inSection = false

  $('h2, h3, h4, li').each((_, el) => {
    const $el = $(el)
    const tag = el.tagName.toLowerCase()
    const text = $el.text().trim()

    if (tag.match(/^h[2-4]$/) && /resolved\s+issues/i.test(text) && new RegExp(sectionPrefix, 'i').test($el.prevAll('h2,h3,h4').addBack().text())) {
      inSection = true
      return
    }
    if (tag.match(/^h[2-4]$/) && inSection) {
      inSection = false
      return
    }
    if (inSection && tag === 'li' && text.length > 5) {
      issues.push(text.replace(/\s+/g, ' ').trim())
    }
  })

  return issues
}

function parseReleaseNotesPage(html) {
  const $ = cheerio.load(html)
  const entries = []
  const seen = new Set()

  $('table').each((_, table) => {
    const $table = $(table)
    const headerText = $table.find('thead th, tr:first-child th, tr:first-child td').text()

    if (!/CUDA Toolkit/i.test(headerText) || !/Driver/i.test(headerText)) return

    $table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 2) return

      const labelCell = $(cells[0]).text().trim()
      const linuxCell = cells.length >= 2 ? $(cells[1]).text().trim() : ''

      if (!labelCell.startsWith('CUDA')) return

      const parsed = parseVersionLabel(labelCell)
      if (!parsed.version || seen.has(parsed.version)) return
      seen.add(parsed.version)

      const linuxDriver = parseDriverVersion(linuxCell)

      entries.push({
        version: parsed.version,
        versionLabel: parsed.label,
        linuxDriver,
        docUrl: RELEASE_NOTES_URL,
      })
    })
  })

  entries.sort((a, b) => {
    const pa = a.version.split('.').map(Number)
    const pb = b.version.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0)
    }
    return 0
  })

  for (const entry of entries) {
    if (entry.linuxDriver) {
      entry.downloadUrl = `https://developer.download.nvidia.com/compute/cuda/${entry.version}/local_installers/cuda_${entry.version}_${entry.linuxDriver}_linux.run`
    } else {
      entry.downloadUrl = ''
    }
  }

  return entries
}

async function main() {
  console.log('Fetching CUDA release notes...')
  const html = await fetchWithRetry(RELEASE_NOTES_URL)
  const entries = parseReleaseNotesPage(html)
  console.log(`Found ${entries.length} CUDA toolkit entries`)

  const existing = (() => {
    try {
      return JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
    } catch {
      return []
    }
  })()
  const existingMap = new Map(existing.map(e => [e.version, e]))

  for (const entry of entries) {
    existingMap.set(entry.version, entry)
  }

  const sorted = [...existingMap.values()].sort((a, b) => {
    const pa = a.version.split('.').map(Number)
    const pb = b.version.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0)
    }
    return 0
  })

  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`Done: ${sorted.length} total entries written to ${OUT_PATH}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})