import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

import { SHAPE_CATALOG, TEXT3D_SCHEMA, buildShapeGeometry } from './shapes.js';
import {
  fetchPolyHavenCatalog,
  resolvePolyHavenGltf,
  fetchKhronosCatalog,
  CURATED_MODELS,
  expandSearchQuery
} from './libraryApi.js';

// ==================== STATE ====================
const state = {
  objects: [], // Array of root THREE.Object3D items on stage
  selected: null,
  snapEnabled: false,
  turntable: false,
  cachedFont: null,
  // Library catalogs
  polyHavenAll: [],
  polyHavenCat: 'all',
  polyHavenQuery: '',
  khronosAll: [],
  khronosTag: 'all',
  khronosQuery: '',
  curatedCat: 'all',
  curatedQuery: '',
  // Animations
  activeMixer: null,
  activeClips: [],
  activeAction: null,
  animPlaying: true,
  animSpeed: 1.0
};

// ==================== THREE.JS SCENE SETUP ====================
const canvas = document.getElementById('three-canvas');
const viewportEl = document.getElementById('viewport-container');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#121214');

// Studio PBR Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnv = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = roomEnv;

// Camera
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(5.5, 4.2, 6.5);

// OrbitControls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.06;
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.target.set(0, 0.8, 0);

// TransformControls (Gizmo)
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(0.85);
const transformHelper = transformControls.getHelper ? transformControls.getHelper() : transformControls;
scene.add(transformHelper);

let isDraggingGizmo = false;
transformControls.addEventListener('dragging-changed', (e) => {
  orbit.enabled = !e.value;
  isDraggingGizmo = e.value;
});
transformControls.addEventListener('change', () => {
  if (state.selected && isDraggingGizmo) {
    syncTransformInputsFromObject(state.selected);
    updateSelectionBox();
  }
});

// Selection Box Helper
const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xa1a1aa);
selectionBox.visible = false;
scene.add(selectionBox);

// Ground Grid & Shadow Receiver Plane
const gridHelper = new THREE.GridHelper(28, 28, 0x333338, 0x1f1f23);
gridHelper.position.y = 0.001;
scene.add(gridHelper);

const shadowFloorGeo = new THREE.PlaneGeometry(60, 60);
shadowFloorGeo.rotateX(-Math.PI / 2);
const shadowFloorMat = new THREE.ShadowMaterial({ opacity: 0.32 });
const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
shadowFloor.receiveShadow = true;
scene.add(shadowFloor);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.85);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
dirLight.position.set(8, 14, 9);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 45;
const d = 10;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x818cf8, 0.65);
rimLight.position.set(-8, 6, -7);
scene.add(rimLight);

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const objLoader = new OBJLoader();
const stlLoader = new STLLoader();
const fontLoader = new FontLoader();

// Preload 3D Font for TextGeometry
fontLoader.load(
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_bold.typeface.json',
  (font) => {
    state.cachedFont = font;
  }
);

// ==================== PROCEDURAL SHAPE CREATION ====================
let objectCounter = 1;

export function createProceduralShape(shapeId, customOptions = {}) {
  const def = SHAPE_CATALOG.find((s) => s.id === shapeId);
  const isText = shapeId === 'text3d';

  const baseParams = isText
    ? { text: customOptions.text || 'FORMA 3D', size: 0.7, depth: 0.3, bevel: 0.03 }
    : structuredClone(def ? def.defaults : { width: 1.5, height: 1.5, depth: 1.5 });

  if (customOptions.params) {
    Object.assign(baseParams, customOptions.params);
  }

  const modifiers = customOptions.modifiers
    ? structuredClone(customOptions.modifiers)
    : { twist: 0, taper: 0, wave: 0, noise: 0 };

  const geometry = buildShapeGeometry(shapeId, baseParams, modifiers, state.cachedFont);

  const colorHex = customOptions.color || (def ? def.color : '#6366f1');
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: customOptions.metalness ?? 0.18,
    roughness: customOptions.roughness ?? 0.32,
    emissive: new THREE.Color(customOptions.emissiveColor || colorHex),
    emissiveIntensity: customOptions.emissiveIntensity ?? 0,
    roughnessMap: null,
    flatShading: Boolean(customOptions.flatShading || shapeId === 'terrain' || shapeId === 'icosahedron')
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const labelName = customOptions.name || `${isText ? `Texto "${baseParams.text}"` : def?.name || 'Forma'} #${objectCounter++}`;
  mesh.name = labelName;

  mesh.userData = {
    isStudioItem: true,
    kind: 'parametric',
    shapeId,
    params: baseParams,
    modifiers,
    matConfig: {
      color: colorHex,
      metalness: material.metalness,
      roughness: material.roughness,
      emissiveIntensity: material.emissiveIntensity,
      opacity: 1,
      wireframe: false,
      flatShading: material.flatShading
    }
  };

  // Place nicely on the ground
  geometry.computeBoundingBox();
  const minY = geometry.boundingBox ? geometry.boundingBox.min.y : -0.8;
  const spreadOffset = (state.objects.length % 5) * 0.35 - 0.5;
  mesh.position.set(
    customOptions.position ? customOptions.position[0] : spreadOffset,
    customOptions.position ? customOptions.position[1] : Math.max(0, -minY),
    customOptions.position ? customOptions.position[2] : spreadOffset * 0.5
  );

  if (customOptions.rotation) {
    mesh.rotation.set(...customOptions.rotation);
  }
  if (customOptions.scale) {
    mesh.scale.set(...customOptions.scale);
  }

  addStudioObject(mesh, customOptions.select !== false);
  return mesh;
}

function addStudioObject(obj, selectIt = true) {
  obj.userData.isStudioItem = true;
  obj.userData.uid = THREE.MathUtils.generateUUID();
  scene.add(obj);
  state.objects.push(obj);
  if (selectIt) {
    selectObject(obj);
  }
  refreshOutlinerAndStats();
}

// ==================== NORMALIZE & SPAWN EXTERNAL 3D MODELS ====================
function finalizeLoadedModel(rootScene, modelName, sourceBadge, animations = []) {
  const wrapper = new THREE.Group();
  wrapper.name = `${modelName} #${objectCounter++}`;

  // Enable shadows and ensure materials render nicely
  let firstColor = '#ffffff';
  rootScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material && child.material.color) {
        firstColor = '#' + child.material.color.getHexString();
      }
    }
  });

  // Compute bounding box and normalize to ~2.4 units size
  const box = new THREE.Box3().setFromObject(rootScene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const targetSize = 2.4;
  const normScale = targetSize / maxDim;

  rootScene.position.sub(center);
  rootScene.position.y += (size.y * 0.5);
  wrapper.add(rootScene);
  wrapper.scale.setScalar(normScale);

  // Place on ground with slight offset if center is occupied
  const offset = state.objects.length > 0 ? ((state.objects.length % 4) - 1.5) * 0.6 : 0;
  wrapper.position.set(offset, 0, offset * 0.4);

  wrapper.userData = {
    isStudioItem: true,
    kind: 'model',
    sourceBadge,
    baseScale: normScale,
    animations: animations || [],
    animTarget: rootScene,
    matConfig: {
      color: firstColor,
      metalness: 0.2,
      roughness: 0.5,
      emissiveIntensity: 0,
      opacity: 1,
      wireframe: false,
      flatShading: false
    }
  };

  addStudioObject(wrapper, true);
  setupAnimationsForObject(wrapper);
  hideLoading();
}

// ==================== LOAD FROM POLY HAVEN, KHRONOS, THREE.JS OR LOCAL FILE ====================
function showLoading(title, progress = 35) {
  const pill = document.getElementById('loading-pill');
  const titleEl = document.getElementById('loading-title');
  const barEl = document.getElementById('loading-bar');
  pill.classList.remove('hidden');
  titleEl.textContent = title;
  barEl.style.width = `${Math.min(100, Math.max(10, progress))}%`;
}

function hideLoading() {
  const pill = document.getElementById('loading-pill');
  pill.classList.add('hidden');
}

async function loadPolyHavenModel(item) {
  try {
    const resChoice = document.getElementById('ph-res-select')?.value || '1k';
    showLoading(`Baixando "${item.name}" (Poly Haven ${resChoice.toUpperCase()})...`, 30);

    const gltfJson = await resolvePolyHavenGltf(item.id, resChoice);
    showLoading(`Carregando texturas PBR de "${item.name}"...`, 70);

    gltfLoader.parse(
      JSON.stringify(gltfJson),
      '',
      (gltf) => {
        finalizeLoadedModel(gltf.scene, item.name, 'Poly Haven CC0', gltf.animations);
      },
      (err) => {
        console.error(err);
        hideLoading();
        alert(`Erro ao processar modelo ${item.name}.`);
      }
    );
  } catch (err) {
    console.error(err);
    hideLoading();
    alert(`Falha ao carregar modelo da API Poly Haven: ${err.message}`);
  }
}

function loadGltfUrlModel(name, url, badge = 'glTF API') {
  showLoading(`Baixando "${name}"...`, 25);
  gltfLoader.load(
    url,
    (gltf) => {
      finalizeLoadedModel(gltf.scene, name, badge, gltf.animations);
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        showLoading(`Baixando "${name}" (${pct}%)...`, pct);
      }
    },
    (err) => {
      console.error('Erro ao baixar GLTF:', err);
      hideLoading();
      alert(`Não foi possível carregar o modelo "${name}". Verifique sua conexão.`);
    }
  );
}

function importLocalFiles(fileList) {
  Array.from(fileList).forEach((file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    showLoading(`Importando arquivo "${file.name}"...`, 50);

    const reader = new FileReader();
    if (ext === 'glb' || ext === 'gltf') {
      reader.onload = (ev) => {
        gltfLoader.parse(
          ev.target.result,
          '',
          (gltf) => finalizeLoadedModel(gltf.scene, baseName, 'Arquivo Local', gltf.animations),
          (err) => {
            console.error(err);
            hideLoading();
          }
        );
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'obj') {
      reader.onload = (ev) => {
        const obj = objLoader.parse(ev.target.result);
        finalizeLoadedModel(obj, baseName, 'OBJ Local', []);
      };
      reader.readAsText(file);
    } else if (ext === 'stl') {
      reader.onload = (ev) => {
        const geom = stlLoader.parse(ev.target.result);
        geom.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35, metalness: 0.2 });
        const mesh = new THREE.Mesh(geom, mat);
        finalizeLoadedModel(mesh, baseName, 'STL Local', []);
      };
      reader.readAsArrayBuffer(file);
    } else {
      hideLoading();
      alert('Formato não suportado. Use .GLB, .GLTF, .OBJ ou .STL');
    }
  });
}

// ==================== ANIMATION SYSTEM ====================
function setupAnimationsForObject(obj) {
  const animBar = document.getElementById('anim-bar');
  const clipSelect = document.getElementById('select-anim-clip');

  if (!obj || !obj.userData?.animations || obj.userData.animations.length === 0) {
    animBar.classList.add('hidden');
    return;
  }

  const clips = obj.userData.animations;
  const target = obj.userData.animTarget || obj;

  if (state.activeMixer) {
    state.activeMixer.stopAllAction();
  }

  state.activeMixer = new THREE.AnimationMixer(target);
  state.activeClips = clips;

  clipSelect.innerHTML = '';
  clips.forEach((clip, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = clip.name || `Animação #${idx + 1}`;
    clipSelect.appendChild(opt);
  });

  playAnimationClip(0);
  animBar.classList.remove('hidden');
}

function playAnimationClip(index) {
  if (!state.activeMixer || !state.activeClips[index]) return;
  if (state.activeAction) state.activeAction.stop();
  state.activeAction = state.activeMixer.clipAction(state.activeClips[index]);
  state.activeAction.play();
  state.animPlaying = true;
}

// ==================== SELECTION & INSPECTOR ====================
export function selectObject(obj) {
  state.selected = obj;
  const inspectorEl = document.getElementById('selected-inspector');

  if (!obj) {
    transformControls.detach();
    selectionBox.visible = false;
    inspectorEl.classList.add('hidden');
    document.getElementById('anim-bar').classList.add('hidden');
    refreshOutlinerAndStats();
    return;
  }

  transformControls.attach(obj);
  updateSelectionBox();
  inspectorEl.classList.remove('hidden');

  // Header info
  document.getElementById('inp-obj-name').value = obj.name || 'Objeto 3D';
  const badgeEl = document.getElementById('badge-obj-type');
  badgeEl.textContent = obj.userData.kind === 'parametric' ? 'Forma Editável' : (obj.userData.sourceBadge || 'Modelo 3D');

  // Transform inputs
  syncTransformInputsFromObject(obj);

  // Parametric geometry & deformers section
  const paramSection = document.getElementById('parametric-section');
  if (obj.userData.kind === 'parametric') {
    paramSection.classList.remove('hidden');
    renderShapeParameterSliders(obj);
    syncDeformerSliders(obj);
  } else {
    paramSection.classList.add('hidden');
  }

  // Material controls
  syncMaterialInspector(obj);

  // Animations if available
  setupAnimationsForObject(obj);

  refreshOutlinerAndStats();
}

function updateSelectionBox() {
  if (!state.selected) {
    selectionBox.visible = false;
    return;
  }
  selectionBox.setFromObject(state.selected);
  selectionBox.visible = true;
}

function syncTransformInputsFromObject(obj) {
  document.getElementById('pos-x').value = obj.position.x.toFixed(2);
  document.getElementById('pos-y').value = obj.position.y.toFixed(2);
  document.getElementById('pos-z').value = obj.position.z.toFixed(2);

  document.getElementById('rot-x').value = Math.round(THREE.MathUtils.radToDeg(obj.rotation.x));
  document.getElementById('rot-y').value = Math.round(THREE.MathUtils.radToDeg(obj.rotation.y));
  document.getElementById('rot-z').value = Math.round(THREE.MathUtils.radToDeg(obj.rotation.z));

  const baseScale = obj.userData.baseScale || 1;
  document.getElementById('scl-x').value = (obj.scale.x / baseScale).toFixed(2);
  document.getElementById('scl-y').value = (obj.scale.y / baseScale).toFixed(2);
  document.getElementById('scl-z').value = (obj.scale.z / baseScale).toFixed(2);

  const uniRatio = Math.min(5, Math.max(0.1, obj.scale.x / baseScale));
  document.getElementById('scl-uniform').value = uniRatio;
  document.getElementById('val-scl-uniform').textContent = `${uniRatio.toFixed(2)}x`;
}

function renderShapeParameterSliders(obj) {
  const container = document.getElementById('shape-params-container');
  container.innerHTML = '';

  const shapeId = obj.userData.shapeId;
  const def = SHAPE_CATALOG.find((s) => s.id === shapeId);
  const schema = shapeId === 'text3d' ? TEXT3D_SCHEMA : (def?.schema || []);

  if (shapeId === 'text3d') {
    const textRow = document.createElement('div');
    textRow.className = 'slider-row';
    textRow.innerHTML = `
      <label>Texto 3D</label>
      <input type="text" id="param-live-text" value="${obj.userData.params.text || 'FORMA 3D'}" style="grid-column: span 2; background:#090b10; color:#fff; border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:4px 8px; font-size:11.5px;" />
    `;
    container.appendChild(textRow);
    textRow.querySelector('#param-live-text').addEventListener('input', (e) => {
      obj.userData.params.text = e.target.value || '3D';
      rebuildSelectedParametricGeometry();
    });
  }

  schema.forEach((field) => {
    const currentVal = obj.userData.params[field.key] ?? 1;
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `
      <label>${field.label}</label>
      <input type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${currentVal}" />
      <span>${Number(currentVal).toFixed(field.step < 1 ? 2 : 0)}</span>
    `;
    const input = row.querySelector('input');
    const valSpan = row.querySelector('span');
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      obj.userData.params[field.key] = v;
      valSpan.textContent = v.toFixed(field.step < 1 ? 2 : 0);
      rebuildSelectedParametricGeometry();
    });
    container.appendChild(row);
  });
}

function syncDeformerSliders(obj) {
  const mods = obj.userData.modifiers || { twist: 0, taper: 0, wave: 0, noise: 0 };
  document.getElementById('mod-twist').value = mods.twist;
  document.getElementById('val-mod-twist').textContent = `${Math.round(THREE.MathUtils.radToDeg(mods.twist))}°`;

  document.getElementById('mod-taper').value = mods.taper;
  document.getElementById('val-mod-taper').textContent = `${Math.round(mods.taper * 100)}%`;

  document.getElementById('mod-wave').value = mods.wave;
  document.getElementById('val-mod-wave').textContent = mods.wave.toFixed(2);

  document.getElementById('mod-noise').value = mods.noise;
  document.getElementById('val-mod-noise').textContent = mods.noise.toFixed(2);
}

function rebuildSelectedParametricGeometry() {
  const obj = state.selected;
  if (!obj || obj.userData.kind !== 'parametric') return;

  const newGeom = buildShapeGeometry(
    obj.userData.shapeId,
    obj.userData.params,
    obj.userData.modifiers,
    state.cachedFont
  );
  obj.geometry.dispose();
  obj.geometry = newGeom;
  updateSelectionBox();
  refreshOutlinerAndStats();
}

function syncMaterialInspector(obj) {
  const cfg = obj.userData.matConfig || {
    color: '#6366f1',
    metalness: 0.2,
    roughness: 0.35,
    emissiveIntensity: 0,
    opacity: 1,
    wireframe: false,
    flatShading: false
  };

  document.getElementById('mat-color').value = cfg.color;
  document.getElementById('mat-metalness').value = cfg.metalness;
  document.getElementById('val-mat-metalness').textContent = Number(cfg.metalness).toFixed(2);

  document.getElementById('mat-roughness').value = cfg.roughness;
  document.getElementById('val-mat-roughness').textContent = Number(cfg.roughness).toFixed(2);

  document.getElementById('mat-emissive').value = cfg.emissiveIntensity;
  document.getElementById('val-mat-emissive').textContent = Number(cfg.emissiveIntensity).toFixed(1);

  document.getElementById('mat-opacity').value = cfg.opacity;
  document.getElementById('val-mat-opacity').textContent = `${Math.round(cfg.opacity * 100)}%`;

  document.getElementById('mat-wireframe').checked = Boolean(cfg.wireframe);
  document.getElementById('mat-flat').checked = Boolean(cfg.flatShading);
}

function applyMaterialConfigToSelected() {
  const obj = state.selected;
  if (!obj) return;
  const cfg = obj.userData.matConfig;

  obj.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m.color) m.color.set(cfg.color);
        if ('metalness' in m) m.metalness = cfg.metalness;
        if ('roughness' in m) m.roughness = cfg.roughness;
        if (m.emissive) {
          m.emissive.set(cfg.color);
          m.emissiveIntensity = cfg.emissiveIntensity;
        }
        m.transparent = cfg.opacity < 0.99;
        m.opacity = cfg.opacity;
        m.wireframe = Boolean(cfg.wireframe);
        if ('flatShading' in m && m.flatShading !== Boolean(cfg.flatShading)) {
          m.flatShading = Boolean(cfg.flatShading);
          m.needsUpdate = true;
        }
      });
    }
  });
}

// ==================== OUTLINER & SCENE STATS ====================
function refreshOutlinerAndStats() {
  const listEl = document.getElementById('outliner-list');
  document.getElementById('outliner-count').textContent = String(state.objects.length);
  document.getElementById('stat-objects').textContent = String(state.objects.length);

  let totalVerts = 0;
  let totalTris = 0;

  state.objects.forEach((obj) => {
    obj.traverse((c) => {
      if (c.isMesh && c.geometry) {
        const pos = c.geometry.attributes.position;
        if (pos) {
          totalVerts += pos.count;
          if (c.geometry.index) {
            totalTris += Math.round(c.geometry.index.count / 3);
          } else {
            totalTris += Math.round(pos.count / 3);
          }
        }
      }
    });
  });

  document.getElementById('stat-verts').textContent = totalVerts.toLocaleString('pt-BR');
  document.getElementById('stat-tris').textContent = totalTris.toLocaleString('pt-BR');

  if (state.objects.length === 0) {
    listEl.innerHTML = `<div class="empty-hint">Cena vazia</div>`;
    return;
  }

  listEl.innerHTML = '';
  const cubeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 3L3 7.5v9L12 21l9-4.5v-9L12 3z"/></svg>`;
  state.objects.forEach((obj) => {
    const item = document.createElement('div');
    item.className = `outliner-item ${state.selected === obj ? 'selected' : ''}`;

    item.innerHTML = `
      <div class="outliner-item-left">
        ${cubeSvg}
        <span>${obj.name}</span>
      </div>
      <div class="outliner-actions">
        <button class="btn-vis" title="Visibilidade">${obj.visible ? 'Vis' : 'Oculto'}</button>
        <button class="btn-del" title="Remover">×</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      selectObject(obj);
    });

    item.querySelector('.btn-vis').addEventListener('click', (e) => {
      e.stopPropagation();
      obj.visible = !obj.visible;
      refreshOutlinerAndStats();
    });

    item.querySelector('.btn-del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteObject(obj);
    });

    listEl.appendChild(item);
  });
}

function deleteObject(obj) {
  if (!obj) return;
  if (state.selected === obj) {
    selectObject(null);
  }
  scene.remove(obj);
  state.objects = state.objects.filter((o) => o !== obj);
  refreshOutlinerAndStats();
}

function duplicateSelected() {
  const src = state.selected;
  if (!src) return;

  if (src.userData.kind === 'parametric') {
    createProceduralShape(src.userData.shapeId, {
      name: `${src.name} (Cópia)`,
      params: structuredClone(src.userData.params),
      modifiers: structuredClone(src.userData.modifiers),
      color: src.userData.matConfig.color,
      metalness: src.userData.matConfig.metalness,
      roughness: src.userData.matConfig.roughness,
      emissiveIntensity: src.userData.matConfig.emissiveIntensity,
      flatShading: src.userData.matConfig.flatShading,
      position: [src.position.x + 0.6, src.position.y, src.position.z + 0.6],
      rotation: [src.rotation.x, src.rotation.y, src.rotation.z],
      scale: [src.scale.x, src.scale.y, src.scale.z]
    });
  } else {
    const clone = src.clone(true);
    clone.name = `${src.name} (Cópia)`;
    clone.position.x += 0.8;
    clone.position.z += 0.8;
    clone.userData = structuredClone({
      isStudioItem: true,
      kind: 'model',
      sourceBadge: src.userData.sourceBadge,
      baseScale: src.userData.baseScale,
      matConfig: src.userData.matConfig
    });
    addStudioObject(clone, true);
  }
}

function snapSelectedToGround() {
  const obj = state.selected;
  if (!obj) return;
  const box = new THREE.Box3().setFromObject(obj);
  if (!box.isEmpty()) {
    obj.position.y -= box.min.y;
    syncTransformInputsFromObject(obj);
    updateSelectionBox();
  }
}

// ==================== EXPORT 3D SCENE (GLB, GLTF, OBJ, STL, PNG) ====================
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function getExportRootGroup() {
  const exportGroup = new THREE.Group();
  exportGroup.name = 'Forma3D_Export';
  state.objects.forEach((obj) => {
    if (obj.visible) {
      exportGroup.add(obj.clone(true));
    }
  });
  return exportGroup;
}

function exportSceneFormat(format) {
  if (state.objects.length === 0) {
    alert('A cena está vazia! Crie uma forma 3D ou adicione um modelo antes de exportar.');
    return;
  }

  const group = getExportRootGroup();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'glb' || format === 'gltf') {
    const exporter = new GLTFExporter();
    const isBinary = format === 'glb';
    exporter.parse(
      group,
      (result) => {
        if (isBinary) {
          downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), `forma3d-${timestamp}.glb`);
        } else {
          const jsonStr = JSON.stringify(result, null, 2);
          downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `forma3d-${timestamp}.gltf`);
        }
      },
      (err) => {
        console.error(err);
        alert('Erro ao exportar glTF.');
      },
      { binary: isBinary }
    );
  } else if (format === 'obj') {
    const exporter = new OBJExporter();
    const objText = exporter.parse(group);
    downloadBlob(new Blob([objText], { type: 'text/plain' }), `forma3d-${timestamp}.obj`);
  } else if (format === 'stl') {
    const exporter = new STLExporter();
    const stlData = exporter.parse(group, { binary: true });
    downloadBlob(new Blob([stlData], { type: 'application/octet-stream' }), `forma3d-${timestamp}.stl`);
  }
}

function captureScreenshotPNG() {
  const prevGrid = gridHelper.visible;
  const prevBox = selectionBox.visible;
  const prevGizmo = transformHelper.visible;

  gridHelper.visible = false;
  selectionBox.visible = false;
  transformHelper.visible = false;

  renderer.render(scene, camera);
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `forma3d-render-${Date.now()}.png`);
    }
    gridHelper.visible = prevGrid;
    selectionBox.visible = prevBox;
    transformHelper.visible = prevGizmo;
  }, 'image/png');
}

// ==================== LEFT SIDEBAR UI & CATALOG RENDERING ====================
function initShapeCardsUI() {
  const basicGrid = document.getElementById('shapes-grid-basic');
  const specialGrid = document.getElementById('shapes-grid-special');
  const polyGrid = document.getElementById('shapes-grid-poly');

  SHAPE_CATALOG.forEach((shape) => {
    const btn = document.createElement('button');
    btn.className = 'shape-card';
    btn.title = `Criar ${shape.name}`;
    btn.innerHTML = `
      <div class="shape-icon">${shape.icon}</div>
      <span>${shape.name}</span>
    `;
    btn.addEventListener('click', () => {
      createProceduralShape(shape.id, { color: '#d4d4d8' });
    });

    if (shape.category === 'basic') basicGrid.appendChild(btn);
    else if (shape.category === 'special') specialGrid.appendChild(btn);
    else polyGrid.appendChild(btn);
  });
}

// Poly Haven Catalog UI
async function initPolyHavenUI() {
  const statusEl = document.getElementById('ph-status-text');
  try {
    const models = await fetchPolyHavenCatalog();
    state.polyHavenAll = models;
    document.getElementById('badge-ph-count').textContent = `${models.length}`;
    statusEl.textContent = `${models.length} modelos`;
    renderPolyHavenGrid();
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Erro de conexão.';
  }

  document.getElementById('ph-search').addEventListener('input', (e) => {
    state.polyHavenQuery = e.target.value;
    renderPolyHavenGrid();
  });

  document.querySelectorAll('#ph-categories .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#ph-categories .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.polyHavenCat = chip.dataset.cat;
      renderPolyHavenGrid();
    });
  });
}

function renderPolyHavenGrid() {
  const grid = document.getElementById('ph-grid');
  const statusEl = document.getElementById('ph-status-text');
  const terms = expandSearchQuery(state.polyHavenQuery);
  const cat = state.polyHavenCat;

  const filtered = state.polyHavenAll.filter((m) => {
    const matchesCat = cat === 'all' || m.categories.some((c) => c.toLowerCase().includes(cat));
    if (!matchesCat) return false;
    if (terms.length === 0) return true;
    const hay = `${m.name} ${m.id} ${m.categories.join(' ')} ${m.tags.join(' ')}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  });

  statusEl.textContent = `${filtered.length} de ${state.polyHavenAll.length} modelos`;
  grid.innerHTML = '';

  const frag = document.createDocumentFragment();

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'model-card';
    const polyStr = item.polycount > 0 ? `${(item.polycount / 1000).toFixed(1)}k` : 'PBR';
    card.innerHTML = `
      <div class="model-thumb-wrap">
        <img src="${item.thumbnail}" alt="${item.name}" loading="lazy" />
        <span class="model-badge">${polyStr}</span>
      </div>
      <div class="model-info">
        <div class="model-title" title="${item.name}">${item.name}</div>
        <div class="model-sub">${item.categories.slice(0, 2).join(' · ') || 'CC0'}</div>
      </div>
    `;
    card.addEventListener('click', () => loadPolyHavenModel(item));
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

// Khronos glTF Catalog UI
async function initKhronosUI() {
  const statusEl = document.getElementById('kh-status-text');
  try {
    const models = await fetchKhronosCatalog();
    state.khronosAll = models;
    document.getElementById('badge-kh-count').textContent = `${models.length}`;
    statusEl.textContent = `${models.length} modelos`;
    renderKhronosGrid();
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Erro ao carregar.';
  }

  document.getElementById('kh-search').addEventListener('input', (e) => {
    state.khronosQuery = e.target.value;
    renderKhronosGrid();
  });

  document.querySelectorAll('#kh-tags .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#kh-tags .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.khronosTag = chip.dataset.tag;
      renderKhronosGrid();
    });
  });
}

function renderKhronosGrid() {
  const grid = document.getElementById('kh-grid');
  const statusEl = document.getElementById('kh-status-text');
  const terms = expandSearchQuery(state.khronosQuery);
  const tag = state.khronosTag;

  const filtered = state.khronosAll.filter((m) => {
    const matchesTag = tag === 'all' || m.tags.includes(tag);
    if (!matchesTag) return false;
    if (terms.length === 0) return true;
    const hay = `${m.name} ${m.id} ${m.tags.join(' ')}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  });

  statusEl.textContent = `${filtered.length} modelos disponíveis`;
  grid.innerHTML = '';

  const wireCubeSvg = `<div class="model-wire-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3L3 7.5v9L12 21l9-4.5v-9L12 3z"/><path d="M3 7.5L12 12l9-4.5"/><path d="M12 12v9"/></svg></div>`;
  const frag = document.createDocumentFragment();
  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'model-card';
    const thumbHtml = item.thumbnail
      ? `<img src="${item.thumbnail}" alt="${item.name}" loading="lazy" />`
      : wireCubeSvg;

    card.innerHTML = `
      <div class="model-thumb-wrap">
        ${thumbHtml}
        <span class="model-badge">${item.formatBadge}</span>
      </div>
      <div class="model-info">
        <div class="model-title" title="${item.name}">${item.name}</div>
        <div class="model-sub">${item.tags[0] || 'glTF'}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      loadGltfUrlModel(item.name, item.modelUrl, 'Khronos');
    });
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

// Curated Three.js Collection UI
function initCuratedUI() {
  renderCuratedGrid();

  document.getElementById('curated-search').addEventListener('input', (e) => {
    state.curatedQuery = e.target.value;
    renderCuratedGrid();
  });

  document.querySelectorAll('#curated-cats .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#curated-cats .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.curatedCat = chip.dataset.cat;
      renderCuratedGrid();
    });
  });
}

function renderCuratedGrid() {
  const grid = document.getElementById('curated-grid');
  const terms = expandSearchQuery(state.curatedQuery);
  const cat = state.curatedCat;

  const filtered = CURATED_MODELS.filter((m) => {
    const matchesCat = cat === 'all' || m.category === cat;
    if (!matchesCat) return false;
    if (terms.length === 0) return true;
    const hay = `${m.name} ${m.id} ${m.badge} ${m.category}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  });

  const wireIcon = `<div class="model-wire-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3L3 7.5v9L12 21l9-4.5v-9L12 3z"/><path d="M3 7.5L12 12l9-4.5"/><path d="M12 12v9"/></svg></div>`;
  grid.innerHTML = '';
  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.innerHTML = `
      <div class="model-thumb-wrap">
        ${wireIcon}
        <span class="model-badge">${item.badge}</span>
      </div>
      <div class="model-info">
        <div class="model-title" title="${item.name}">${item.name}</div>
        <div class="model-sub">GLB</div>
      </div>
    `;
    card.addEventListener('click', () => {
      loadGltfUrlModel(item.name, item.url, 'GLB');
    });
    grid.appendChild(card);
  });
}

// ==================== SCENE STARTER TEMPLATES ====================
function loadSceneTemplate(templateId) {
  [...state.objects].forEach((o) => deleteObject(o));

  if (templateId === 'abstract') {
    createProceduralShape('tubeRing', {
      name: 'Arco Principal',
      color: '#a1a1aa',
      metalness: 0.3,
      roughness: 0.35,
      params: { outerRadius: 1.8, innerRadius: 1.35, height: 0.45, segments: 48 },
      position: [0, 1.8, -0.4],
      rotation: [Math.PI / 2, 0, 0],
      select: false
    });
    createProceduralShape('sphere', {
      name: 'Esfera Metálica',
      color: '#d4af37',
      metalness: 0.85,
      roughness: 0.15,
      params: { radius: 0.75, widthSegments: 48, heightSegments: 32 },
      position: [0, 1.75, -0.4],
      select: false
    });
    createProceduralShape('cylinder', {
      name: 'Base Cilíndrica',
      color: '#27272a',
      params: { radiusTop: 1.1, radiusBottom: 1.3, height: 0.5, radialSegments: 36 },
      position: [0, 0.25, -0.4],
      select: false
    });
    const knot = createProceduralShape('torusKnot', {
      name: 'Nó Toroidal',
      color: '#e4e4e7',
      metalness: 0.2,
      roughness: 0.25,
      params: { radius: 0.65, tube: 0.18, p: 2, q: 3, tubularSegments: 96 },
      position: [2.2, 1.2, 0.6],
      select: true
    });
    selectObject(knot);
  } else if (templateId === 'scifi') {
    document.getElementById('env-preset').value = 'cyber';
    applyEnvironmentPreset('cyber');

    createProceduralShape('gear', {
      name: 'Engrenagem Base',
      color: '#27272a',
      metalness: 0.8,
      roughness: 0.25,
      params: { teeth: 16, radius: 1.8, toothHeight: 0.25, holeRadius: 0.6, depth: 0.35 },
      position: [0, 0.2, 0],
      select: false
    });
    createProceduralShape('torus', {
      name: 'Anel Emissivo',
      color: '#38bdf8',
      emissiveIntensity: 1.2,
      params: { radius: 1.45, tube: 0.1, radialSegments: 20, tubularSegments: 64 },
      position: [0, 1.5, 0],
      rotation: [0.4, 0.3, 0],
      select: false
    });
    const crystal = createProceduralShape('octahedron', {
      name: 'Octaedro Central',
      color: '#e4e4e7',
      metalness: 0.6,
      roughness: 0.1,
      params: { radius: 0.75, stretchY: 1.7, detail: 0 },
      modifiers: { twist: 0.8, taper: 0, wave: 0, noise: 0 },
      position: [0, 1.5, 0],
      select: true
    });
    selectObject(crystal);
  } else if (templateId === 'island') {
    createProceduralShape('terrain', {
      name: 'Terreno',
      color: '#52525b',
      flatShading: true,
      params: { size: 5.5, segments: 24, elevation: 1.1, freq: 1.4 },
      position: [0, 0.3, 0],
      select: false
    });
    createProceduralShape('cone', {
      name: 'Cone 1',
      color: '#71717a',
      flatShading: true,
      params: { radius: 0.55, height: 1.5, radialSegments: 7 },
      position: [-1.1, 1.1, -0.7],
      select: false
    });
    const cone2 = createProceduralShape('cone', {
      name: 'Cone 2',
      color: '#a1a1aa',
      flatShading: true,
      params: { radius: 0.45, height: 1.2, radialSegments: 7 },
      position: [1.2, 0.95, 0.8],
      select: true
    });
    selectObject(cone2);
  }
}

// ==================== ENVIRONMENT PRESETS ====================
function applyEnvironmentPreset(preset) {
  switch (preset) {
    case 'sunset':
      scene.background = new THREE.Color('#181416');
      hemiLight.color.set('#fed7aa');
      hemiLight.groundColor.set('#27272a');
      dirLight.color.set('#fb923c');
      rimLight.color.set('#f43f5e');
      break;
    case 'cyber':
      scene.background = new THREE.Color('#0c0e14');
      hemiLight.color.set('#38bdf8');
      hemiLight.groundColor.set('#18181b');
      dirLight.color.set('#e0e7ff');
      rimLight.color.set('#38bdf8');
      break;
    case 'daylight':
      scene.background = new THREE.Color('#e4e4e7');
      hemiLight.color.set('#ffffff');
      hemiLight.groundColor.set('#a1a1aa');
      dirLight.color.set('#ffffff');
      rimLight.color.set('#d4d4d8');
      break;
    case 'void':
      scene.background = new THREE.Color('#050505');
      hemiLight.color.set('#ffffff');
      hemiLight.groundColor.set('#09090b');
      dirLight.color.set('#ffffff');
      rimLight.color.set('#71717a');
      break;
    case 'dark':
    default:
      scene.background = new THREE.Color('#121214');
      hemiLight.color.set('#ffffff');
      hemiLight.groundColor.set('#18181b');
      dirLight.color.set('#ffffff');
      rimLight.color.set('#a1a1aa');
      break;
  }
}

// ==================== EVENT LISTENERS & UI BINDINGS ====================
function bindUIEvents() {
  // Left Sidebar Tabs
  document.querySelectorAll('.lib-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.lib-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  // 3D Text Creation Button
  document.getElementById('btn-create-text3d').addEventListener('click', () => {
    const val = document.getElementById('input-text3d').value.trim() || 'FORMA 3D';
    createProceduralShape('text3d', { text: val, color: '#38bdf8' });
  });

  // Templates
  document.querySelectorAll('.template-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadSceneTemplate(btn.dataset.template);
    });
  });

  // Topbar Transform Mode Buttons
  const setTransformMode = (mode) => {
    transformControls.setMode(mode);
    document.getElementById('tool-translate').classList.toggle('active', mode === 'translate');
    document.getElementById('tool-rotate').classList.toggle('active', mode === 'rotate');
    document.getElementById('tool-scale').classList.toggle('active', mode === 'scale');
  };

  document.getElementById('tool-translate').addEventListener('click', () => setTransformMode('translate'));
  document.getElementById('tool-rotate').addEventListener('click', () => setTransformMode('rotate'));
  document.getElementById('tool-scale').addEventListener('click', () => setTransformMode('scale'));

  // Snap Toggle
  const snapBtn = document.getElementById('btn-snap');
  snapBtn.addEventListener('click', () => {
    state.snapEnabled = !state.snapEnabled;
    snapBtn.classList.toggle('active', state.snapEnabled);
    transformControls.setTranslationSnap(state.snapEnabled ? 0.5 : null);
    transformControls.setRotationSnap(state.snapEnabled ? THREE.MathUtils.degToRad(15) : null);
    transformControls.setScaleSnap(state.snapEnabled ? 0.25 : null);
  });

  // Quick Mesh Actions
  document.getElementById('btn-duplicate').addEventListener('click', duplicateSelected);
  document.getElementById('btn-ground').addEventListener('click', snapSelectedToGround);
  document.getElementById('btn-delete').addEventListener('click', () => deleteObject(state.selected));

  // Import Local File
  const fileInput = document.getElementById('file-import-input');
  document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) importLocalFiles(e.target.files);
    fileInput.value = '';
  });

  // Drag and drop on viewport
  const dropOverlay = document.getElementById('drop-overlay');
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('hidden');
  });
  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) dropOverlay.classList.add('hidden');
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.add('hidden');
    if (e.dataTransfer?.files?.length) {
      importLocalFiles(e.dataTransfer.files);
    }
  });

  // Screenshot & Export Menu
  document.getElementById('btn-screenshot').addEventListener('click', captureScreenshotPNG);

  const exportMenu = document.getElementById('export-menu');
  document.getElementById('btn-export-menu').addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => exportMenu.classList.add('hidden'));
  exportMenu.querySelectorAll('button[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      exportSceneFormat(btn.dataset.export);
    });
  });

  // Viewport Quick Camera Controls
  document.getElementById('btn-cam-reset').addEventListener('click', () => {
    camera.position.set(5.5, 4.2, 6.5);
    orbit.target.set(0, 0.8, 0);
    orbit.update();
  });
  document.getElementById('btn-cam-top').addEventListener('click', () => {
    camera.position.set(0, 10, 0.01);
    orbit.target.set(0, 0, 0);
    orbit.update();
  });
  document.getElementById('btn-cam-front').addEventListener('click', () => {
    camera.position.set(0, 2.0, 8.5);
    orbit.target.set(0, 1.0, 0);
    orbit.update();
  });
  const turntableBtn = document.getElementById('btn-turntable');
  turntableBtn.addEventListener('click', () => {
    state.turntable = !state.turntable;
    orbit.autoRotate = state.turntable;
    orbit.autoRotateSpeed = 2.2;
    turntableBtn.classList.toggle('active', state.turntable);
  });
  document.getElementById('btn-clear-scene').addEventListener('click', () => {
    [...state.objects].forEach((o) => deleteObject(o));
  });

  // Animation Bar Controls
  document.getElementById('btn-anim-toggle').addEventListener('click', () => {
    if (!state.activeAction) return;
    state.animPlaying = !state.animPlaying;
    state.activeAction.paused = !state.animPlaying;
  });
  document.getElementById('select-anim-clip').addEventListener('change', (e) => {
    playAnimationClip(Number(e.target.value));
  });
  document.getElementById('input-anim-speed').addEventListener('input', (e) => {
    const spd = parseFloat(e.target.value);
    state.animSpeed = spd;
    document.getElementById('label-anim-speed').textContent = `${spd.toFixed(1)}x`;
  });

  // Inspector: Object Name & Transform Inputs
  document.getElementById('inp-obj-name').addEventListener('input', (e) => {
    if (state.selected) {
      state.selected.name = e.target.value;
      refreshOutlinerAndStats();
    }
  });

  const bindTransformInputs = () => {
    const obj = state.selected;
    if (!obj) return;
    const baseScale = obj.userData.baseScale || 1;
    obj.position.set(
      parseFloat(document.getElementById('pos-x').value) || 0,
      parseFloat(document.getElementById('pos-y').value) || 0,
      parseFloat(document.getElementById('pos-z').value) || 0
    );
    obj.rotation.set(
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-x').value) || 0),
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-y').value) || 0),
      THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-z').value) || 0)
    );
    obj.scale.set(
      Math.max(0.02, parseFloat(document.getElementById('scl-x').value) || 1) * baseScale,
      Math.max(0.02, parseFloat(document.getElementById('scl-y').value) || 1) * baseScale,
      Math.max(0.02, parseFloat(document.getElementById('scl-z').value) || 1) * baseScale
    );
    updateSelectionBox();
  };

  ['pos-x', 'pos-y', 'pos-z', 'rot-x', 'rot-y', 'rot-z', 'scl-x', 'scl-y', 'scl-z'].forEach((id) => {
    document.getElementById(id).addEventListener('input', bindTransformInputs);
  });

  document.getElementById('scl-uniform').addEventListener('input', (e) => {
    const obj = state.selected;
    if (!obj) return;
    const val = parseFloat(e.target.value);
    const baseScale = obj.userData.baseScale || 1;
    obj.scale.setScalar(val * baseScale);
    syncTransformInputsFromObject(obj);
    updateSelectionBox();
  });

  // Deformers Sliders
  const bindDeformer = (id, key, fmt) => {
    document.getElementById(id).addEventListener('input', (e) => {
      const obj = state.selected;
      if (!obj || obj.userData.kind !== 'parametric') return;
      const v = parseFloat(e.target.value);
      obj.userData.modifiers[key] = v;
      document.getElementById(`val-${id}`).textContent = fmt(v);
      rebuildSelectedParametricGeometry();
    });
  };
  bindDeformer('mod-twist', 'twist', (v) => `${Math.round(THREE.MathUtils.radToDeg(v))}°`);
  bindDeformer('mod-taper', 'taper', (v) => `${Math.round(v * 100)}%`);
  bindDeformer('mod-wave', 'wave', (v) => v.toFixed(2));
  bindDeformer('mod-noise', 'noise', (v) => v.toFixed(2));

  document.getElementById('btn-reset-deform').addEventListener('click', () => {
    const obj = state.selected;
    if (!obj || obj.userData.kind !== 'parametric') return;
    obj.userData.modifiers = { twist: 0, taper: 0, wave: 0, noise: 0 };
    syncDeformerSliders(obj);
    rebuildSelectedParametricGeometry();
  });

  // Material Controls
  document.getElementById('mat-color').addEventListener('input', (e) => {
    if (!state.selected) return;
    state.selected.userData.matConfig.color = e.target.value;
    applyMaterialConfigToSelected();
  });

  document.querySelectorAll('#color-swatches button').forEach((sw) => {
    sw.addEventListener('click', () => {
      if (!state.selected) return;
      state.selected.userData.matConfig.color = sw.dataset.color;
      document.getElementById('mat-color').value = sw.dataset.color;
      applyMaterialConfigToSelected();
    });
  });

  document.getElementById('mat-metalness').addEventListener('input', (e) => {
    if (!state.selected) return;
    const v = parseFloat(e.target.value);
    state.selected.userData.matConfig.metalness = v;
    document.getElementById('val-mat-metalness').textContent = v.toFixed(2);
    applyMaterialConfigToSelected();
  });

  document.getElementById('mat-roughness').addEventListener('input', (e) => {
    if (!state.selected) return;
    const v = parseFloat(e.target.value);
    state.selected.userData.matConfig.roughness = v;
    document.getElementById('val-mat-roughness').textContent = v.toFixed(2);
    applyMaterialConfigToSelected();
  });

  document.getElementById('mat-emissive').addEventListener('input', (e) => {
    if (!state.selected) return;
    const v = parseFloat(e.target.value);
    state.selected.userData.matConfig.emissiveIntensity = v;
    document.getElementById('val-mat-emissive').textContent = v.toFixed(1);
    applyMaterialConfigToSelected();
  });

  document.getElementById('mat-opacity').addEventListener('input', (e) => {
    if (!state.selected) return;
    const v = parseFloat(e.target.value);
    state.selected.userData.matConfig.opacity = v;
    document.getElementById('val-mat-opacity').textContent = `${Math.round(v * 100)}%`;
    applyMaterialConfigToSelected();
  });

  document.getElementById('mat-wireframe').addEventListener('change', (e) => {
    if (!state.selected) return;
    state.selected.userData.matConfig.wireframe = e.target.checked;
    applyMaterialConfigToSelected();
  });

  document.getElementById('mat-flat').addEventListener('change', (e) => {
    if (!state.selected) return;
    state.selected.userData.matConfig.flatShading = e.target.checked;
    applyMaterialConfigToSelected();
  });

  // Material Quick Presets
  const MAT_PRESETS = {
    plastic: { color: '#6366f1', metalness: 0.1, roughness: 0.25, emissiveIntensity: 0, opacity: 1, wireframe: false },
    gold: { color: '#f59e0b', metalness: 0.95, roughness: 0.14, emissiveIntensity: 0, opacity: 1, wireframe: false },
    chrome: { color: '#e2e8f0', metalness: 1.0, roughness: 0.05, emissiveIntensity: 0, opacity: 1, wireframe: false },
    neon: { color: '#06b6d4', metalness: 0.2, roughness: 0.2, emissiveIntensity: 1.4, opacity: 1, wireframe: false },
    glass: { color: '#bae6fd', metalness: 0.1, roughness: 0.05, emissiveIntensity: 0, opacity: 0.42, wireframe: false },
    clay: { color: '#d97757', metalness: 0.0, roughness: 0.88, emissiveIntensity: 0, opacity: 1, wireframe: false },
    emerald: { color: '#10b981', metalness: 0.35, roughness: 0.12, emissiveIntensity: 0.15, opacity: 0.82, wireframe: false },
    holo: { color: '#a855f7', metalness: 0.5, roughness: 0.2, emissiveIntensity: 1.1, opacity: 0.85, wireframe: true }
  };

  document.querySelectorAll('#mat-presets .mat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      if (!state.selected) return;
      const preset = MAT_PRESETS[pill.dataset.mat];
      if (!preset) return;
      Object.assign(state.selected.userData.matConfig, preset);
      syncMaterialInspector(state.selected);
      applyMaterialConfigToSelected();
    });
  });

  // Environment Controls
  document.getElementById('env-preset').addEventListener('change', (e) => {
    applyEnvironmentPreset(e.target.value);
  });
  document.getElementById('env-light-int').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    dirLight.intensity = v;
    document.getElementById('val-env-light').textContent = v.toFixed(1);
  });
  document.getElementById('env-grid').addEventListener('change', (e) => {
    gridHelper.visible = e.target.checked;
  });
  document.getElementById('env-shadows').addEventListener('change', (e) => {
    renderer.shadowMap.enabled = e.target.checked;
    dirLight.castShadow = e.target.checked;
  });

  // Raycast Selection on Canvas Click & Double Click Focus
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (isDraggingGizmo) return;
    const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (dist > 5) return; // User was orbiting camera

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(state.objects, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit.parent && !hit.userData?.isStudioItem) {
        hit = hit.parent;
      }
      if (hit && hit.userData?.isStudioItem) {
        selectObject(hit);
        return;
      }
    }
    selectObject(null);
  });

  canvas.addEventListener('dblclick', () => {
    if (state.selected) {
      const box = new THREE.Box3().setFromObject(state.selected);
      const center = new THREE.Vector3();
      box.getCenter(center);
      orbit.target.copy(center);
      orbit.update();
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'g' || k === 'w') setTransformMode('translate');
    else if (k === 'r' || k === 'e') setTransformMode('rotate');
    else if (k === 's' || k === 't') setTransformMode('scale');
    else if (k === 'f') snapSelectedToGround();
    else if (k === 'delete' || k === 'backspace') deleteObject(state.selected);
    else if ((e.ctrlKey || e.metaKey) && k === 'd') {
      e.preventDefault();
      duplicateSelected();
    }
  });
}

// ==================== RESIZE & RENDER LOOP ====================
function onWindowResize() {
  const width = viewportEl.clientWidth;
  const height = viewportEl.clientHeight;
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener('resize', onWindowResize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (state.activeMixer && state.animPlaying) {
    state.activeMixer.update(delta * state.animSpeed);
  }

  orbit.update();
  renderer.render(scene, camera);
}

// ==================== INITIALIZATION ====================
function init() {
  onWindowResize();
  initShapeCardsUI();
  bindUIEvents();

  // Load default starter composition so the user lands in a vibrant 3D studio
  loadSceneTemplate('abstract');

  // Fetch live open 3D APIs in parallel
  initPolyHavenUI();
  initKhronosUI();
  initCuratedUI();

  animate();
}

init();
