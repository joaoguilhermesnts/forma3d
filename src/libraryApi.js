/**
 * Integrated Open 3D Model Libraries (100% Free, No API Key Required, CORS-Enabled):
 * 1. Poly Haven API (522+ Photorealistic CC0 PBR 3D Models)
 * 2. Khronos Group Official glTF Sample Assets API (151+ Official & Animated 3D Models)
 * 3. Three.js Official Showcase Models (30+ Animated Characters, Vehicles, Sculptures & Scenes)
 */

const PT_TO_EN_SYNONYMS = {
  cadeira: 'chair seating armchair stool',
  poltrona: 'armchair sofa chair',
  mesa: 'table desk coffee',
  sofa: 'sofa couch seating',
  sofá: 'sofa couch seating',
  cama: 'bed',
  armario: 'cabinet wardrobe shelf',
  armário: 'cabinet wardrobe shelf',
  estante: 'shelf shelves bookcase',
  planta: 'plant tree bush fern flower',
  arvore: 'tree nature trunk bark',
  árvore: 'tree nature trunk bark',
  flor: 'flower blossom plant',
  pedra: 'rock stone boulder cliff',
  rocha: 'rock stone boulder',
  carro: 'car vehicle ferrari buggy toycar',
  moto: 'bike motorcycle',
  bicicleta: 'bike bicycle',
  capacete: 'helmet scifi flight',
  robo: 'robot expressive cyborg',
  robô: 'robot expressive cyborg',
  personagem: 'soldier robot michelle xbot character fox',
  animal: 'horse fox duck flamingo parrot stork fish',
  cavalo: 'horse',
  pato: 'duck',
  raposa: 'fox',
  peixe: 'fish barramundi',
  passaro: 'bird parrot flamingo stork',
  pássaro: 'bird parrot flamingo stork',
  relogio: 'watch clock rolex chronograph',
  relógio: 'watch clock rolex chronograph',
  camera: 'camera lens steampunk',
  câmera: 'camera lens steampunk',
  lampada: 'lamp light lantern chandelier',
  lâmpada: 'lamp light lantern chandelier',
  luminaria: 'lamp light lantern',
  luminária: 'lamp light lantern',
  vaso: 'vase pot ceramic planter',
  comida: 'food fruit avocado bread apple',
  fruta: 'fruit avocado apple',
  abacate: 'avocado',
  ferramenta: 'tool hammer anvil wrench axe saw',
  caixa: 'box crate chest boombox',
  som: 'boombox speaker radio',
  garrafa: 'bottle water jug',
  xicara: 'mug cup coffee',
  xícara: 'mug cup coffee',
  mascara: 'mask venice helmet',
  máscara: 'mask venice helmet',
  estatua: 'bust statue nefertiti',
  estátua: 'bust statue nefertiti',
  dragao: 'dragon',
  dragão: 'dragon'
};

export function expandSearchQuery(rawQuery) {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return [];
  const terms = new Set([q]);
  for (const [pt, enList] of Object.entries(PT_TO_EN_SYNONYMS)) {
    if (q.includes(pt)) {
      enList.split(' ').forEach((t) => terms.add(t));
    }
  }
  return Array.from(terms);
}

/**
 * Fetches all 522+ CC0 3D models from Poly Haven API
 */
export async function fetchPolyHavenCatalog() {
  const res = await fetch('https://api.polyhaven.com/assets?t=models');
  if (!res.ok) throw new Error(`Erro Poly Haven API: ${res.status}`);
  const data = await res.json();

  const models = Object.entries(data).map(([id, item]) => ({
    id,
    source: 'polyhaven',
    name: item.name || id,
    categories: item.categories || [],
    tags: item.tags || [],
    polycount: item.polycount || 0,
    downloads: item.download_count || 0,
    description: item.description || '',
    thumbnail:
      item.thumbnail_url ||
      `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?width=256&height=256`
  }));

  // Sort by popularity (download count) so top studio assets appear first
  models.sort((a, b) => b.downloads - a.downloads);
  return models;
}

/**
 * Resolves a Poly Haven model ID into a self-contained glTF JSON with absolute CDN URLs
 * for its .bin geometry and PBR textures.
 */
export async function resolvePolyHavenGltf(assetId, preferredRes = '1k') {
  const filesRes = await fetch(`https://api.polyhaven.com/files/${encodeURIComponent(assetId)}`);
  if (!filesRes.ok) {
    throw new Error(`Não foi possível obter arquivos de ${assetId}`);
  }
  const filesData = await filesRes.json();
  const gltfGroup = filesData.gltf;
  if (!gltfGroup) {
    throw new Error(`Modelo ${assetId} não possui variante glTF.`);
  }

  // Pick preferred resolution (1k, 2k, 4k) or fallback
  const resOrder = [preferredRes, '1k', '2k', '4k', ...Object.keys(gltfGroup)];
  let chosenBlock = null;
  for (const r of resOrder) {
    if (gltfGroup[r] && gltfGroup[r].gltf && gltfGroup[r].gltf.url) {
      chosenBlock = gltfGroup[r].gltf;
      break;
    }
  }

  if (!chosenBlock) {
    throw new Error(`Variante glTF indisponível para ${assetId}`);
  }

  const includeMap = chosenBlock.include || {};
  const gltfResponse = await fetch(chosenBlock.url);
  if (!gltfResponse.ok) {
    throw new Error(`Falha ao baixar arquivo .gltf de ${assetId}`);
  }
  const gltfJson = await gltfResponse.json();

  // Helper to resolve relative URI against Poly Haven's include map
  const resolveUri = (relUri) => {
    if (!relUri || relUri.startsWith('data:') || relUri.startsWith('http')) {
      return relUri;
    }
    const clean = relUri.replace(/^\.\//, '');
    if (includeMap[clean]?.url) return includeMap[clean].url;

    const lowerClean = clean.toLowerCase();
    for (const [k, v] of Object.entries(includeMap)) {
      if (k.toLowerCase() === lowerClean && v?.url) {
        return v.url;
      }
    }

    const baseName = lowerClean.split('/').pop();
    for (const [k, v] of Object.entries(includeMap)) {
      if (k.toLowerCase().split('/').pop() === baseName && v?.url) {
        return v.url;
      }
    }

    // Fallback relative to gltf URL directory
    const baseDir = chosenBlock.url.substring(0, chosenBlock.url.lastIndexOf('/') + 1);
    return baseDir + clean;
  };

  if (Array.isArray(gltfJson.buffers)) {
    gltfJson.buffers.forEach((buf) => {
      if (buf.uri) buf.uri = resolveUri(buf.uri);
    });
  }

  if (Array.isArray(gltfJson.images)) {
    gltfJson.images.forEach((img) => {
      if (img.uri) img.uri = resolveUri(img.uri);
    });
  }

  return gltfJson;
}

/**
 * Fetches all 151+ official 3D models from Khronos Group glTF-Sample-Assets API
 */
export async function fetchKhronosCatalog() {
  const baseUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';
  const res = await fetch(`${baseUrl}/model-index.json`);
  if (!res.ok) throw new Error(`Erro Khronos API: ${res.status}`);
  const list = await res.json();

  return list.map((item) => {
    const variants = item.variants || {};
    let modelUrl = null;
    let formatBadge = 'GLB';

    if (variants['glTF-Binary']) {
      modelUrl = `${baseUrl}/${item.name}/glTF-Binary/${variants['glTF-Binary']}`;
      formatBadge = 'GLB';
    } else if (variants['glTF']) {
      modelUrl = `${baseUrl}/${item.name}/glTF/${variants['glTF']}`;
      formatBadge = 'glTF';
    } else if (variants['glTF-Embedded']) {
      modelUrl = `${baseUrl}/${item.name}/glTF-Embedded/${variants['glTF-Embedded']}`;
      formatBadge = 'glTF';
    } else {
      const firstType = Object.keys(variants)[0];
      if (firstType) {
        modelUrl = `${baseUrl}/${item.name}/${firstType}/${variants[firstType]}`;
      }
    }

    const thumbUrl = item.screenshot
      ? `${baseUrl}/${item.name}/${item.screenshot}`
      : null;

    return {
      id: item.name,
      source: 'khronos',
      name: item.label || item.name,
      tags: item.tags || [],
      formatBadge,
      thumbnail: thumbUrl,
      modelUrl
    };
  }).filter((m) => Boolean(m.modelUrl));
}

/**
 * Curated Three.js Official Showcase Collection (Animated Characters, Animals, Vehicles, Props)
 */
const THREE_CDN = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf';

export const CURATED_MODELS = [
  {
    id: 'RobotExpressive',
    name: 'Robô Expressivo (Animado)',
    category: 'characters',
    badge: 'Animado • 13 Clips',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    url: `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`
  },
  {
    id: 'Soldier',
    name: 'Soldado Tático (Animado)',
    category: 'characters',
    badge: 'Animado • Walk/Run',
    emoji: '🪖',
    gradient: 'linear-gradient(135deg,#10b981,#047857)',
    url: `${THREE_CDN}/Soldier.glb`
  },
  {
    id: 'Michelle',
    name: 'Michelle Dançarina (Animada)',
    category: 'characters',
    badge: 'Animado • Dance',
    emoji: '💃',
    gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
    url: `${THREE_CDN}/Michelle.glb`
  },
  {
    id: 'Xbot',
    name: 'Androide X-Bot (Animado)',
    category: 'characters',
    badge: 'Animado • Rigged',
    emoji: '🦾',
    gradient: 'linear-gradient(135deg,#6366f1,#4338ca)',
    url: `${THREE_CDN}/Xbot.glb`
  },
  {
    id: 'ReadyPlayerMe',
    name: 'Avatar Metaverso 3D',
    category: 'characters',
    badge: 'Personagem PBR',
    emoji: '🧑‍🚀',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    url: `${THREE_CDN}/readyplayer.me.glb`
  },
  {
    id: 'Kira',
    name: 'Kira Sci-Fi Character',
    category: 'characters',
    badge: 'Personagem 3D',
    emoji: '🦸‍♀️',
    gradient: 'linear-gradient(135deg,#a855f7,#7e22ce)',
    url: `${THREE_CDN}/kira.glb`
  },
  {
    id: 'Horse',
    name: 'Cavalo Galopando (Animado)',
    category: 'animals',
    badge: 'Animado • Low-Poly',
    emoji: '🐎',
    gradient: 'linear-gradient(135deg,#f59e0b,#b45309)',
    url: `${THREE_CDN}/Horse.glb`
  },
  {
    id: 'Flamingo',
    name: 'Flamingo Voando (Animado)',
    category: 'animals',
    badge: 'Animado • Voo',
    emoji: '🦩',
    gradient: 'linear-gradient(135deg,#f43f5e,#be123c)',
    url: `${THREE_CDN}/Flamingo.glb`
  },
  {
    id: 'Parrot',
    name: 'Papagaio Colorido (Animado)',
    category: 'animals',
    badge: 'Animado • Voo',
    emoji: '🦜',
    gradient: 'linear-gradient(135deg,#22c55e,#15803d)',
    url: `${THREE_CDN}/Parrot.glb`
  },
  {
    id: 'Stork',
    name: 'Cegonha em Voo (Animada)',
    category: 'animals',
    badge: 'Animado • Voo',
    emoji: '🦢',
    gradient: 'linear-gradient(135deg,#06b6d4,#0e7490)',
    url: `${THREE_CDN}/Stork.glb`
  },
  {
    id: 'Duck',
    name: 'Pato Clássico Khronos',
    category: 'animals',
    badge: 'Clássico 3D',
    emoji: '🦆',
    gradient: 'linear-gradient(135deg,#eab308,#a16207)',
    url: `${THREE_CDN}/duck.glb`
  },
  {
    id: 'DragonAttenuation',
    name: 'Dragão de Cristal PBR',
    category: 'animals',
    badge: 'Cristal / Vidro',
    emoji: '🐉',
    gradient: 'linear-gradient(135deg,#14b8a6,#0f766e)',
    url: `${THREE_CDN}/DragonAttenuation.glb`
  },
  {
    id: 'Ferrari',
    name: 'Supercarro Esportivo',
    category: 'vehicles',
    badge: 'Veículo Detalhado',
    emoji: '🏎️',
    gradient: 'linear-gradient(135deg,#ef4444,#991b1b)',
    url: `${THREE_CDN}/ferrari.glb`
  },
  {
    id: 'CarbonFrameBike',
    name: 'Bicicleta Fibra de Carbono',
    category: 'vehicles',
    badge: 'Veículo PBR',
    emoji: '🚴',
    gradient: 'linear-gradient(135deg,#38bdf8,#0369a1)',
    url: `${THREE_CDN}/CarbonFrameBike.glb`
  },
  {
    id: 'PrimaryIonDrive',
    name: 'Propulsor de Íons Sci-Fi',
    category: 'vehicles',
    badge: 'Animado • Sci-Fi',
    emoji: '🛸',
    gradient: 'linear-gradient(135deg,#06b6d4,#1e40af)',
    url: `${THREE_CDN}/PrimaryIonDrive.glb`
  },
  {
    id: 'SpaceshipHallway',
    name: 'Corredor de Nave Espacial',
    category: 'vehicles',
    badge: 'Cenário Sci-Fi',
    emoji: '🚀',
    gradient: 'linear-gradient(135deg,#475569,#1e293b)',
    url: `${THREE_CDN}/space_ship_hallway.glb`
  },
  {
    id: 'SteampunkCamera',
    name: 'Câmera Steampunk Vintage',
    category: 'props',
    badge: 'PBR 4K • Bronze',
    emoji: '📷',
    gradient: 'linear-gradient(135deg,#d97706,#78350f)',
    url: `${THREE_CDN}/steampunk_camera.glb`
  },
  {
    id: 'Rolex',
    name: 'Relógio de Pulso Luxo',
    category: 'props',
    badge: 'Ouro & Metal PBR',
    emoji: '⌚',
    gradient: 'linear-gradient(135deg,#eab308,#713f12)',
    url: `${THREE_CDN}/rolex.glb`
  },
  {
    id: 'VeniceMask',
    name: 'Máscara Veneziana',
    category: 'props',
    badge: 'Arte & Ornamento',
    emoji: '🎭',
    gradient: 'linear-gradient(135deg,#c084fc,#581c87)',
    url: `${THREE_CDN}/venice_mask.glb`
  },
  {
    id: 'BoomBox',
    name: 'Rádio BoomBox Retrô',
    category: 'props',
    badge: 'Eletrônico PBR',
    emoji: '📻',
    gradient: 'linear-gradient(135deg,#64748b,#334155)',
    url: `${THREE_CDN}/BoomBox.glb`
  },
  {
    id: 'CoffeeMug',
    name: 'Caneca de Café 3D',
    category: 'props',
    badge: 'Objeto Cotidiano',
    emoji: '☕',
    gradient: 'linear-gradient(135deg,#fb7185,#9f1239)',
    url: `${THREE_CDN}/coffeeMug.glb`
  },
  {
    id: 'SheenChair',
    name: 'Poltrona Design de Veludo',
    category: 'props',
    badge: 'Móvel PBR',
    emoji: '🪑',
    gradient: 'linear-gradient(135deg,#f97316,#9a3412)',
    url: `${THREE_CDN}/SheenChair.glb`
  },
  {
    id: 'AnisotropyBarnLamp',
    name: 'Luminária Industrial',
    category: 'props',
    badge: 'Iluminação PBR',
    emoji: '💡',
    gradient: 'linear-gradient(135deg,#fbbf24,#92400e)',
    url: `${THREE_CDN}/AnisotropyBarnLamp.glb`
  },
  {
    id: 'IridescenceLamp',
    name: 'Abajur Iridescente Moderno',
    category: 'props',
    badge: 'Design Moderno',
    emoji: '🔮',
    gradient: 'linear-gradient(135deg,#ec4899,#6366f1)',
    url: `${THREE_CDN}/IridescenceLamp.glb`
  },
  {
    id: 'Nefertiti',
    name: 'Busto Rainha Nefertiti',
    category: 'props',
    badge: 'Escultura Museu',
    emoji: '🗿',
    gradient: 'linear-gradient(135deg,#d6d3d1,#57534e)',
    url: `${THREE_CDN}/Nefertiti/Nefertiti.glb`
  },
  {
    id: 'Nemetona',
    name: 'Estátua Celta Nemetona',
    category: 'props',
    badge: 'Escultura Histórica',
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg,#94a3b8,#334155)',
    url: `${THREE_CDN}/nemetona.glb`
  },
  {
    id: 'Gears',
    name: 'Mecanismo de Engrenagens',
    category: 'props',
    badge: 'Mecânica 3D',
    emoji: '⚙️',
    gradient: 'linear-gradient(135deg,#38bdf8,#1e3a8a)',
    url: `${THREE_CDN}/gears.glb`
  },
  {
    id: 'LittlestTokyo',
    name: 'Diorama Littlest Tokyo (Animado)',
    category: 'props',
    badge: 'Cena Completa!',
    emoji: '🏙️',
    gradient: 'linear-gradient(135deg,#f43f5e,#7c3aed)',
    url: `${THREE_CDN}/LittlestTokyo.glb`
  }
];
