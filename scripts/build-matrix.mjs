// Builds public/matrix.json from a WPS/KDocs markdown export of the driver
// compatibility spreadsheet.
//
// Why a parser instead of hand-authoring matrix.json:
//   The grid is ~875 cells (48 enterprise rows x 14 GPUs + 31 consumer rows
//   x 3 GPUs). Hand-transcribing that is error-prone. The grid cells themselves
//   contain only Y / N / Yxxx tokens (no sensitive data), so they are safe to
//   parse mechanically.
//
// Sensitive data handling:
//   The source markdown contains customer names, device serial numbers, PCI
//   bus addresses, and internal document links inside the issue-code section
//   (Y001-Y015). Those are NOT parsed from the markdown. Instead the sanitized
//   issue-code descriptions are hardcoded below in SANITIZED_ISSUE_CODES, so
//   no sensitive text ever enters matrix.json or the repo. The raw markdown
//   file must not be committed.
//
// Usage:
//   node scripts/build-matrix.mjs <path-to-wps-markdown>
//   (defaults to the MCP temp export if no path given — re-export from KDocs
//   and pass the new path when the spreadsheet updates.)

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const OUT_PATH = join('public', 'matrix.json')

// Column order exactly as the spreadsheet header lays them out.
const ENTERPRISE_GPUS = [
  'B300', 'B200', 'HGX H200', 'HGX H100', 'HGX H800', 'HGX H20', 'HGX H20-3e',
  'HGX A100', 'HGX A800', 'V100', 'RTX 6000D', 'A30', 'A10', 'T4',
]
const CONSUMER_GPUS = ['5090', '4090', '3090']

// Compute Capability reference (from NVIDIA developer.nvidia.com/cuda-gpus,
// transcribed via the spreadsheet). Static reference data — hand-authored
// because the source table uses merged cells that are awkward to parse.
// `cc` is the Compute Capability; each category lists representative GPUs.
const COMPUTE_CAPABILITY = [
  { cc: '12.1', geforce: ['NVIDIA GB10 (DGX Spark)'] },
  { cc: '12', dataCenter: ['NVIDIA RTX PRO 6000 Blackwell Server Edition'], geforce: [
    'NVIDIA RTX PRO 6000 Blackwell Workstation Edition', 'NVIDIA RTX PRO 6000 Blackwell Max-Q Workstation Edition',
    'NVIDIA RTX PRO 5000 Blackwell', 'NVIDIA RTX PRO 4500 Blackwell', 'NVIDIA RTX PRO 4000 Blackwell',
    'NVIDIA RTX PRO 4000 Blackwell SFF Edition', 'NVIDIA RTX PRO 2000 Blackwell',
    'GeForce RTX 5090', 'GeForce RTX 5080', 'GeForce RTX 5070 Ti', 'GeForce RTX 5070',
    'GeForce RTX 5060 Ti', 'GeForce RTX 5060', 'GeForce RTX 5050',
  ] },
  { cc: '11', jetson: ['Jetson T5000', 'Jetson T4000'] },
  { cc: '10.3', dataCenter: ['NVIDIA GB300', 'NVIDIA B300'] },
  { cc: '10', dataCenter: ['NVIDIA GB200', 'NVIDIA B200'] },
  { cc: '9', dataCenter: ['NVIDIA GH200', 'NVIDIA H200', 'NVIDIA H100'] },
  { cc: '8.9', dataCenter: ['NVIDIA L4', 'NVIDIA L40'], geforce: [
    'RTX 6000 Ada', 'RTX 5000 Ada', 'RTX 4500 Ada', 'RTX 4000 Ada', 'RTX 4000 SFF Ada', 'RTX 2000 Ada',
    'GeForce RTX 4090', 'GeForce RTX 4080', 'GeForce RTX 4070 Ti', 'GeForce RTX 4070',
    'GeForce RTX 4060 Ti', 'GeForce RTX 4060', 'GeForce RTX 4050',
  ] },
  { cc: '8.7', jetson: ['Jetson AGX Orin', 'Jetson Orin NX', 'Jetson Orin Nano'] },
  { cc: '8.6', dataCenter: ['NVIDIA A40', 'NVIDIA A10', 'NVIDIA A16', 'NVIDIA A2'], geforce: [
    'RTX A6000', 'RTX A5000', 'RTX A4000', 'RTX A3000', 'RTX A2000',
    'GeForce RTX 3090 Ti', 'GeForce RTX 3090', 'GeForce RTX 3080 Ti', 'GeForce RTX 3080',
    'GeForce RTX 3070 Ti', 'GeForce RTX 3070', 'GeForce RTX 3060 Ti', 'GeForce RTX 3060',
    'GeForce RTX 3050 Ti', 'GeForce RTX 3050',
  ] },
  { cc: '8', dataCenter: ['NVIDIA A100', 'NVIDIA A30'] },
  { cc: '7.5', dataCenter: ['NVIDIA T4', 'T1000', 'T600', 'T400', 'T2000', 'T1200', 'T500'], geforce: [
    'RTX 8000', 'RTX 6000', 'RTX 5000', 'RTX 4000', 'RTX 3000', 'NVIDIA TITAN RTX',
    'GeForce RTX 2080 Ti', 'GeForce RTX 2080', 'GeForce RTX 2070', 'GeForce RTX 2060',
    'GeForce GTX 1650 Ti',
  ] },
]

// Sanitized, human-authored issue-code descriptions.
// Customer names, device serials, PCI bus addresses, internal doc links, and
// internal team references have been removed. Only technical failure detail
// remains. `retired` marks entries the spreadsheet struck through.
const SANITIZED_ISSUE_CODES = {
  Y001: { retired: false, text: 'HGX 底板缺少 BOM 信息导致驱动识别错误，需要手动覆盖 nvidia-fa 服务模版或使用高版本驱动。' },
  Y002: { retired: false, text: 'A800 不兼容 560.35.03，会导致 NVLink 初始化失败。' },
  Y003: { retired: false, text: '使用 SYS-821GE-TNHR 服务器 + H100 + BIOS 2.4 + CPLD F5.11.D1，概率性 GPU 初始化时因资源分配不足导致 GPU 无法正常工作，升级 HGX 1.5.0 版本未能解决；高并发业务时可能导致 XID13。' },
  Y004: { retired: true, text: '使用 SYS-821GE-TNHR 服务器 + H100 + BIOS 2.4 + CPLD F5.11.D1 + HGX H200 1.5.0 无法挂载驱动。2025-02-11 因无法在其他服务器复现而撤销，标记为独立事件。' },
  Y005: { retired: false, text: 'NVIDIA H20 使用 96.00.94.00.09 时无法加载驱动 570.86.15。' },
  Y006: { retired: false, text: '任务容器退出时大概率触发 XID137，表现为 NVSwitch rx warning，一般同时伴随 XID94，重启任务可正常运行；较大概率出现 XID154，伴随小概率 XID79，不稳定状态。' },
  Y007: { retired: false, text: '测试发现 550.54.14 不兼容 NVIDIA HGX H20-3e。' },
  Y008: { retired: false, text: 'A800 环境 P2P 异常。' },
  Y009: { retired: false, text: '基于 550.144.03（自定义版本驱动环境 + HGX 1.5.0），故障现象与 Y003 相似。' },
  Y010: { retired: false, text: 'NVLink 大概率出现 inactive 状态，不可用。' },
  Y011: { retired: false, text: 'B200 环境 gpu-burn 会导致 “the provided PTX was compiled with an unsupported toolchain.”，一定概率导致 GPU 访问超时，形成类似 GSP XID119 现象，即使禁用 GSP 也无法解决。' },
  Y012: { retired: false, text: 'CUDA 13.0 起，Maxwell、Pascal、Volta 架构被视为 feature-complete，离线编译与库支持已移除。' },
  Y013: { retired: false, text: 'A800 出现 NVLink inactive 异常。' },
  Y014: { retired: false, text: '该驱动不支持早于 Linux 4.15 的内核。' },
  Y015: { retired: false, text: '不兼容 6.17.0-20-generic，安装编译过程 fb_create = nv_drm_framebuffer_create 失败。' },
}

const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

// Split a markdown table row on unescaped pipes, then unescape \| -> |.
function splitRow(line) {
  const raw = line.split(/(?<!\\)\|/)
  // first & last elements are empty (row starts/ends with |)
  const cells = raw.slice(1, raw.length - 1).map(c => c.replace(/\\\|/g, '|').trim())
  return cells
}

function parseEnterpriseDate(text) {
  const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  return m ? `${m[3]}-${m[1]}-${m[2]}` : ''
}

function parseConsumerDate(text) {
  const m = text.match(/([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})/)
  if (!m) return ''
  const mm = MONTHS[m[1]]
  if (!mm) return ''
  return `${m[3]}-${mm}-${m[2].padStart(2, '0')}`
}

function extractDownload(cell) {
  if (!cell) return ''
  const m = cell.match(/\]\(([^)]+)\)/)
  return m ? m[1] : ''
}

// A cell value: "Y", "N", "Y012" (Y + issue code), or empty -> null.
function normalizeCell(value) {
  const v = (value || '').trim()
  if (!v) return null
  if (/^Y\d+$/i.test(v)) return v.toUpperCase()
  if (/^Y$/i.test(v)) return 'Y'
  if (/^N$/i.test(v)) return 'N'
  return null
}

function parseGrid(markdown) {
  const lines = markdown.split(/\r?\n/)
  const drivers = {}
  const changeNotes = []

  let inChangeNotes = false

  for (const line of lines) {
    if (!line.includes('|')) continue
    const cells = splitRow(line)
    if (cells.length < 5) continue

    const firstCell = cells[0] || ''

    // Change-notes section: lines after the "变更备注:" marker, non-empty,
    // not the "48小时重启测试记录" follow-on block.
    if (/变更备注/.test(firstCell)) { inChangeNotes = true; continue }
    if (/48小时重启测试/.test(firstCell)) { inChangeNotes = false }
    if (inChangeNotes && firstCell && !/^[-—]/.test(firstCell) && !/^\[/.test(firstCell)) {
      changeNotes.push(firstCell)
      continue
    }

    const isEnterprise = /\]\(/.test(firstCell) && /Linux x64/.test(firstCell)
    const isConsumer = !isEnterprise && /Linux x64/.test(firstCell)

    if (!isEnterprise && !isConsumer) continue

    const versionMatch = firstCell.match(/Linux x64 (\d{3}\.\d+(?:\.\d+)?)/)
    if (!versionMatch) continue
    const version = versionMatch[1]

    const download = isEnterprise ? extractDownload(cells[1]) : extractDownload(cells[1])
    const cuda = (cells[3] || '').trim()

    let date = ''
    let gpus = []
    let beta = false

    if (isEnterprise) {
      date = parseEnterpriseDate(cells[2] || '')
      // GPU cells start at index 4 (0=version,1=download,2=date,3=cuda)
      gpus = ENTERPRISE_GPUS.map((g, i) => normalizeCell(cells[4 + i]))
    } else {
      date = parseConsumerDate(cells[2] || '')
      beta = /BETA/i.test(firstCell)
      // consumer header has an empty cell at index 4, GPUs at 5,6,7
      gpus = CONSUMER_GPUS.map((g, i) => normalizeCell(cells[5 + i]))
    }

    const entry = drivers[version] || { enterprise: {}, consumer: {} }
    if (isEnterprise) {
      entry.enterprise = Object.fromEntries(ENTERPRISE_GPUS.map((g, i) => [g, gpus[i]]))
      entry.releaseDate = date || entry.releaseDate || ''
      entry.cuda = cuda || entry.cuda || ''
      if (download) entry.download = download
    } else {
      entry.consumer = Object.fromEntries(CONSUMER_GPUS.map((g, i) => [g, gpus[i]]))
      entry.beta = beta
      if (download) entry.download = download
      if (date) entry.consumerDate = date
    }
    drivers[version] = entry
  }

  return { drivers, changeNotes }
}

function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error('Usage: node scripts/build-matrix.mjs <path-to-wps-markdown>')
    process.exit(1)
  }
  const markdown = readFileSync(inputPath, 'utf-8')
  const { drivers, changeNotes } = parseGrid(markdown)

  const out = {
    enterpriseGpus: ENTERPRISE_GPUS,
    consumerGpus: CONSUMER_GPUS,
    drivers,
    issueCodes: SANITIZED_ISSUE_CODES,
    computeCapability: COMPUTE_CAPABILITY,
    changeNotes,
  }

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n')
  const entCount = Object.values(drivers).filter(d => Object.keys(d.enterprise || {}).length).length
  const conCount = Object.values(drivers).filter(d => Object.keys(d.consumer || {}).length).length
  console.log(`Wrote ${OUT_PATH}`)
  console.log(`  Enterprise rows: ${entCount}`)
  console.log(`  Consumer rows: ${conCount}`)
  console.log(`  Issue codes: ${Object.keys(SANITIZED_ISSUE_CODES).length}`)
  console.log(`  Change notes: ${changeNotes.length}`)
}

main()
