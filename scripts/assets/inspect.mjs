import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx', '.obj'])
const sources = JSON.parse(await readFile('scripts/assets/sources.json', 'utf8'))
const lines = []

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (MODEL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full)
  }
  return files
}

for (const pack of sources.packs) {
  lines.push(`## ${pack.id}`)
  for (const file of await walk(pack.dir)) {
    const size = (await stat(file)).size
    lines.push(`${path.relative(pack.dir, file)}\t${size}`)
  }
}

await writeFile('assets-src/inventory.txt', lines.join('\n'))
console.log(`${lines.length} linhas em assets-src/inventory.txt`)
