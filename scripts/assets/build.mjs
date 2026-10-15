import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import obj2gltf from 'obj2gltf'
import convertFbx from 'fbx2gltf'
import sharp from 'sharp'
import { Box3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getBounds, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, resample, textureCompress, weld } from '@gltf-transform/functions'
import { fitToTarget, fitWithScale } from '../../src/render/models/fit.ts'

const REQUIRED = ['crop-1', 'crop-2', 'crop-3', 'crop-4', 'crop-5', 'tree-a', 'tree-b', 'tree-c', 'pine', 'rock-a', 'rock-b', 'bush', 'fence', 'robot']
const BUDGET = 10 * 1024 * 1024
const OUT = 'public/models'
const TMP = 'assets-src/tmp'

const config = JSON.parse(await readFile('scripts/assets/assets.config.json', 'utf8'))
const sources = JSON.parse(await readFile('scripts/assets/sources.json', 'utf8'))
const packs = new Map(sources.packs.map((pack) => [pack.id, pack]))
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

const missing = REQUIRED.filter((id) => !config.models.some((model) => model.id === id))
if (missing.length > 0) {
  console.error(`Modelos obrigatórios sem configuração: ${missing.join(', ')}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
await mkdir(TMP, { recursive: true })

async function toGlb(input, output) {
  const extension = path.extname(input).toLowerCase()
  if (extension === '.glb' || extension === '.gltf') {
    await io.write(output, await io.read(input))
    return
  }
  if (extension === '.obj') {
    await writeFile(output, await obj2gltf(input, { binary: true }))
    return
  }
  if (extension === '.fbx') {
    await convertFbx(input, path.resolve(output), ['--binary'])
    return
  }
  throw new Error(`Formato não suportado: ${input}`)
}

function linear(hex) {
  return [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
}

function tint(document, colors) {
  for (const material of document.getRoot().listMaterials()) {
    const hex = colors[material.getName()]
    if (hex) material.setBaseColorFactor([...linear(hex), 1])
  }
}

function matte(document) {
  for (const material of document.getRoot().listMaterials()) {
    material.setMetallicFactor(0)
    material.setRoughnessFactor(0.85)
  }
}

function measureWithThree(file, bytes) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(
      buffer,
      '',
      (gltf) => {
        gltf.scene.updateMatrixWorld(true)
        const box = new Box3().setFromObject(gltf.scene, true)
        resolve({ min: box.min.toArray(), max: box.max.toArray() })
      },
      (error) => reject(new Error(`${file}: ${error.message}`)),
    )
  })
}

async function measure(document, file) {
  if (document.getRoot().listSkins().length > 0) return measureWithThree(file, await readFile(file))
  const bounds = getBounds(document.getRoot().listScenes()[0])
  return { min: bounds.min, max: bounds.max }
}

async function slimTextures(document) {
  if (document.getRoot().listTextures().length === 0) return
  for (const material of document.getRoot().listMaterials()) {
    material.setNormalTexture(null)
    material.setOcclusionTexture(null)
    material.setMetallicRoughnessTexture(null)
  }
  await document.transform(prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512] }))
}

const manifest = []
const fits = new Map()
const ordered = [...config.models.filter((model) => !model.scaleLike), ...config.models.filter((model) => model.scaleLike)]
for (const model of ordered) {
  const pack = packs.get(model.pack)
  if (!pack) throw new Error(`Pacote desconhecido: ${model.pack}`)
  const input = path.join(pack.dir, model.source)
  const raw = path.join(TMP, `${model.id}.glb`)
  const output = path.join(OUT, `${model.id}.glb`)
  await toGlb(input, raw)
  const document = await io.read(raw)
  matte(document)
  if (model.tint) tint(document, model.tint)
  await slimTextures(document)
  await document.transform(dedup(), prune(), weld(), resample(), quantize())
  await io.write(output, document)
  const bounds = await measure(document, output)
  const reference = model.scaleLike ? fits.get(model.scaleLike) : null
  if (model.scaleLike && !reference) throw new Error(`scaleLike sem referência: ${model.id}`)
  const fit = reference ? fitWithScale(bounds, reference.scale) : fitToTarget(bounds, { targetHeight: model.targetHeight, targetWidth: model.targetWidth })
  fits.set(model.id, fit)
  const bytes = (await stat(output)).size
  manifest.push({
    id: model.id,
    file: `models/${model.id}.glb`,
    usage: model.usage,
    author: pack.author,
    license: pack.license,
    page: pack.page,
    scale: fit.scale,
    yOffset: fit.yOffset,
    rotationY: model.rotationY,
    bytes,
    ...(model.clips ? { clips: model.clips } : {}),
    ...(model.recolor ? { recolor: model.recolor } : {}),
  })
  console.log(`${model.id}: ${(bytes / 1024).toFixed(1)} KB, escala ${fit.scale}`)
}

const total = manifest.reduce((sum, entry) => sum + entry.bytes, 0)
if (total > BUDGET) {
  console.error(`Modelos somam ${(total / 1048576).toFixed(2)} MB, acima do limite de 5 MB`)
  process.exit(1)
}

const json = `${JSON.stringify({ models: manifest }, null, 2)}\n`
await writeFile(path.join(OUT, 'manifest.json'), json)
await writeFile('src/render/models/manifest.generated.json', json)

const credits = [
  '# Créditos dos assets',
  '',
  'Todos os modelos 3D são CC0 1.0 (domínio público) e foram convertidos para GLB por `scripts/assets/build.mjs`.',
  '',
  '| Modelo | Uso | Autor | Origem |',
  '|---|---|---|---|',
  ...manifest.map((entry) => `| ${entry.id} | ${entry.usage} | ${entry.author} | ${entry.page} |`),
  '',
  'Ícones, interface e modelos procedurais de reserva são originais do projeto.',
  '',
]
await writeFile('CREDITS.md', credits.join('\n'))
console.log(`OK: ${manifest.length} modelos, ${(total / 1048576).toFixed(2)} MB`)
