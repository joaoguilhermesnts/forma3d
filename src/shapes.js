import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export const SHAPE_CATALOG = [
  // BASIC PRIMITIVES
  {
    id: 'cube',
    name: 'Cubo / Caixa',
    category: 'basic',
    color: '#6366f1',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    defaults: { width: 1.6, height: 1.6, depth: 1.6, segments: 12 },
    schema: [
      { key: 'width', label: 'Largura', min: 0.2, max: 5, step: 0.1 },
      { key: 'height', label: 'Altura', min: 0.2, max: 5, step: 0.1 },
      { key: 'depth', label: 'Profund.', min: 0.2, max: 5, step: 0.1 },
      { key: 'segments', label: 'Subdivisões', min: 1, max: 32, step: 1 }
    ]
  },
  {
    id: 'roundedBox',
    name: 'Cubo Suave',
    category: 'basic',
    color: '#8b5cf6',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/></svg>`,
    defaults: { width: 1.6, height: 1.6, depth: 1.6, radius: 0.28, segments: 5 },
    schema: [
      { key: 'width', label: 'Largura', min: 0.3, max: 5, step: 0.1 },
      { key: 'height', label: 'Altura', min: 0.3, max: 5, step: 0.1 },
      { key: 'depth', label: 'Profund.', min: 0.3, max: 5, step: 0.1 },
      { key: 'radius', label: 'Borda', min: 0.02, max: 0.8, step: 0.02 },
      { key: 'segments', label: 'Suavidade', min: 1, max: 10, step: 1 }
    ]
  },
  {
    id: 'sphere',
    name: 'Esfera',
    category: 'basic',
    color: '#ec4899',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="3.5" ry="9"/></svg>`,
    defaults: { radius: 1.0, widthSegments: 36, heightSegments: 24 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.2, max: 4, step: 0.1 },
      { key: 'widthSegments', label: 'Seg. Horiz.', min: 4, max: 64, step: 2 },
      { key: 'heightSegments', label: 'Seg. Vert.', min: 4, max: 64, step: 2 }
    ]
  },
  {
    id: 'cylinder',
    name: 'Cilindro',
    category: 'basic',
    color: '#06b6d4',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5"/></svg>`,
    defaults: { radiusTop: 0.9, radiusBottom: 0.9, height: 2.0, radialSegments: 32 },
    schema: [
      { key: 'radiusTop', label: 'Raio Topo', min: 0.0, max: 3, step: 0.1 },
      { key: 'radiusBottom', label: 'Raio Base', min: 0.1, max: 3, step: 0.1 },
      { key: 'height', label: 'Altura', min: 0.2, max: 5, step: 0.1 },
      { key: 'radialSegments', label: 'Lados', min: 3, max: 64, step: 1 }
    ]
  },
  {
    id: 'cone',
    name: 'Cone',
    category: 'basic',
    color: '#f59e0b',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L4 19c0 1.66 3.58 3 8 3s8-1.34 8-3L12 2z"/></svg>`,
    defaults: { radius: 1.0, height: 2.1, radialSegments: 32 },
    schema: [
      { key: 'radius', label: 'Raio Base', min: 0.2, max: 3, step: 0.1 },
      { key: 'height', label: 'Altura', min: 0.2, max: 5, step: 0.1 },
      { key: 'radialSegments', label: 'Lados', min: 3, max: 64, step: 1 }
    ]
  },
  {
    id: 'pyramid',
    name: 'Pirâmide',
    category: 'basic',
    color: '#eab308',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 19 12 22 22 19 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
    defaults: { radius: 1.2, height: 2.0, sides: 4 },
    schema: [
      { key: 'sides', label: 'Lados Base', min: 3, max: 10, step: 1 },
      { key: 'radius', label: 'Raio Base', min: 0.3, max: 4, step: 0.1 },
      { key: 'height', label: 'Altura', min: 0.3, max: 5, step: 0.1 }
    ]
  },
  {
    id: 'capsule',
    name: 'Cápsula',
    category: 'basic',
    color: '#10b981',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="6"/><line x1="6" y1="12" x2="18" y2="12"/></svg>`,
    defaults: { radius: 0.65, length: 1.2, capSegments: 16, radialSegments: 32 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.15, max: 2.5, step: 0.05 },
      { key: 'length', label: 'Corpo', min: 0.1, max: 4, step: 0.1 },
      { key: 'radialSegments', label: 'Suavidade', min: 6, max: 48, step: 2 }
    ]
  },

  // SPECIAL, CURVED & MECHANICAL SHAPES
  {
    id: 'torus',
    name: 'Rosquinha (Torus)',
    category: 'special',
    color: '#f43f5e',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/></svg>`,
    defaults: { radius: 1.0, tube: 0.38, radialSegments: 24, tubularSegments: 56 },
    schema: [
      { key: 'radius', label: 'Raio Maior', min: 0.3, max: 3, step: 0.05 },
      { key: 'tube', label: 'Espessura', min: 0.05, max: 1.2, step: 0.02 },
      { key: 'tubularSegments', label: 'Subdivisões', min: 6, max: 96, step: 2 }
    ]
  },
  {
    id: 'torusKnot',
    name: 'Nó Toroidal',
    category: 'special',
    color: '#a855f7',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z"/><circle cx="12" cy="10" r="3"/></svg>`,
    defaults: { radius: 0.85, tube: 0.26, p: 2, q: 3, tubularSegments: 96 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.3, max: 2.5, step: 0.05 },
      { key: 'tube', label: 'Espessura', min: 0.05, max: 0.6, step: 0.02 },
      { key: 'p', label: 'Simetria P', min: 1, max: 8, step: 1 },
      { key: 'q', label: 'Voltas Q', min: 1, max: 9, step: 1 }
    ]
  },
  {
    id: 'teapot',
    name: 'Bule 3D (Teapot)',
    category: 'special',
    color: '#fb7185',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9h11a3 3 0 0 1 0 6h-1"/><path d="M6 9c0 6 2 10 6 10s6-4 6-10"/><path d="M6 11L2 8"/><line x1="9" y1="6" x2="15" y2="6"/></svg>`,
    defaults: { size: 0.85, segments: 12 },
    schema: [
      { key: 'size', label: 'Tamanho', min: 0.3, max: 2.5, step: 0.05 },
      { key: 'segments', label: 'Suavidade', min: 3, max: 24, step: 1 }
    ]
  },
  {
    id: 'star',
    name: 'Estrela 3D',
    category: 'special',
    color: '#facc15',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    defaults: { points: 5, outerRadius: 1.2, innerRadius: 0.55, depth: 0.45, bevel: 0.08 },
    schema: [
      { key: 'points', label: 'Pontas', min: 3, max: 12, step: 1 },
      { key: 'outerRadius', label: 'Raio Ext.', min: 0.4, max: 3, step: 0.05 },
      { key: 'innerRadius', label: 'Raio Int.', min: 0.15, max: 2, step: 0.05 },
      { key: 'depth', label: 'Espessura', min: 0.1, max: 2, step: 0.05 },
      { key: 'bevel', label: 'Chanfro', min: 0.0, max: 0.25, step: 0.01 }
    ]
  },
  {
    id: 'heart',
    name: 'Coração 3D',
    category: 'special',
    color: '#ef4444',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    defaults: { scale: 1.0, depth: 0.45, bevel: 0.1 },
    schema: [
      { key: 'scale', label: 'Tamanho', min: 0.3, max: 2.5, step: 0.05 },
      { key: 'depth', label: 'Espessura', min: 0.1, max: 1.8, step: 0.05 },
      { key: 'bevel', label: 'Chanfro', min: 0.0, max: 0.25, step: 0.01 }
    ]
  },
  {
    id: 'gear',
    name: 'Engrenagem 3D',
    category: 'special',
    color: '#38bdf8',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 0 1 0 4h-.09c-.74.02-1.25.44-1.51 1z"/></svg>`,
    defaults: { teeth: 12, radius: 1.1, toothHeight: 0.24, holeRadius: 0.42, depth: 0.4 },
    schema: [
      { key: 'teeth', label: 'Nº Dentes', min: 5, max: 28, step: 1 },
      { key: 'radius', label: 'Raio', min: 0.5, max: 2.5, step: 0.05 },
      { key: 'toothHeight', label: 'Alt. Dente', min: 0.08, max: 0.6, step: 0.02 },
      { key: 'holeRadius', label: 'Furo Central', min: 0.1, max: 0.9, step: 0.02 },
      { key: 'depth', label: 'Espessura', min: 0.1, max: 1.5, step: 0.05 }
    ]
  },
  {
    id: 'spring',
    name: 'Mola / Hélice',
    category: 'special',
    color: '#34d399',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4c0 2 12 2 12 4s-12 2-12 4 12 2 12 4-12 2-12 4"/></svg>`,
    defaults: { radius: 0.75, height: 2.2, turns: 4, wireRadius: 0.16 },
    schema: [
      { key: 'radius', label: 'Raio Mola', min: 0.2, max: 2, step: 0.05 },
      { key: 'height', label: 'Altura', min: 0.5, max: 5, step: 0.1 },
      { key: 'turns', label: 'Espiras', min: 1, max: 10, step: 0.5 },
      { key: 'wireRadius', label: 'Espessura', min: 0.04, max: 0.45, step: 0.01 }
    ]
  },
  {
    id: 'tubeRing',
    name: 'Tubo / Anel',
    category: 'special',
    color: '#818cf8',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/></svg>`,
    defaults: { outerRadius: 1.1, innerRadius: 0.75, height: 0.8, segments: 36 },
    schema: [
      { key: 'outerRadius', label: 'Raio Ext.', min: 0.4, max: 3, step: 0.05 },
      { key: 'innerRadius', label: 'Raio Int.', min: 0.1, max: 2.5, step: 0.05 },
      { key: 'height', label: 'Altura', min: 0.1, max: 4, step: 0.1 },
      { key: 'segments', label: 'Lados', min: 3, max: 64, step: 1 }
    ]
  },

  // POLYHEDRA, CRYSTALS & TERRAIN
  {
    id: 'icosahedron',
    name: 'Icosaedro (Gema)',
    category: 'poly',
    color: '#2dd4bf',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"/><polygon points="12 6 17 15 7 15 12 6"/></svg>`,
    defaults: { radius: 1.05, detail: 0 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.3, max: 3, step: 0.05 },
      { key: 'detail', label: 'Subdivisão', min: 0, max: 4, step: 1 }
    ]
  },
  {
    id: 'dodecahedron',
    name: 'Dodecaedro',
    category: 'poly',
    color: '#c084fc',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 19 6 22 13 17 21 7 21 2 13 5 6 12 2"/></svg>`,
    defaults: { radius: 1.05, detail: 0 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.3, max: 3, step: 0.05 },
      { key: 'detail', label: 'Subdivisão', min: 0, max: 4, step: 1 }
    ]
  },
  {
    id: 'octahedron',
    name: 'Cristal Octaedro',
    category: 'poly',
    color: '#10b981',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 20 12 12 22 4 12 12 2"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
    defaults: { radius: 1.0, stretchY: 1.4, detail: 0 },
    schema: [
      { key: 'radius', label: 'Largura', min: 0.3, max: 3, step: 0.05 },
      { key: 'stretchY', label: 'Altura Cristal', min: 0.5, max: 3, step: 0.1 },
      { key: 'detail', label: 'Subdivisão', min: 0, max: 3, step: 1 }
    ]
  },
  {
    id: 'tetrahedron',
    name: 'Tetraedro',
    category: 'poly',
    color: '#fb923c',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 21 19 3 19 12 3"/><line x1="12" y1="3" x2="12" y2="19"/></svg>`,
    defaults: { radius: 1.15, detail: 0 },
    schema: [
      { key: 'radius', label: 'Raio', min: 0.3, max: 3, step: 0.05 },
      { key: 'detail', label: 'Subdivisão', min: 0, max: 3, step: 1 }
    ]
  },
  {
    id: 'terrain',
    name: 'Terreno 3D',
    category: 'poly',
    color: '#4ade80',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3l4 8 5-5 5 15H2L8 3z"/></svg>`,
    defaults: { size: 3.6, segments: 28, elevation: 0.85, freq: 1.6 },
    schema: [
      { key: 'size', label: 'Tamanho', min: 1.5, max: 8, step: 0.2 },
      { key: 'segments', label: 'Resolução', min: 6, max: 64, step: 2 },
      { key: 'elevation', label: 'Montanhas', min: 0.0, max: 2.5, step: 0.05 },
      { key: 'freq', label: 'Frequência', min: 0.4, max: 4.0, step: 0.1 }
    ]
  }
];

export const TEXT3D_SCHEMA = [
  { key: 'size', label: 'Tamanho', min: 0.3, max: 2.5, step: 0.05 },
  { key: 'depth', label: 'Profundidade', min: 0.05, max: 1.5, step: 0.05 },
  { key: 'bevel', label: 'Chanfro', min: 0.0, max: 0.12, step: 0.01 }
];

/**
 * Generates a THREE.BufferGeometry for any procedural shape and applies real-time vertex modifiers.
 */
export function buildShapeGeometry(shapeType, params = {}, modifiers = {}, font = null) {
  let geom;

  switch (shapeType) {
    case 'cube': {
      const s = Math.max(1, Math.round(params.segments ?? 12));
      geom = new THREE.BoxGeometry(
        params.width ?? 1.6,
        params.height ?? 1.6,
        params.depth ?? 1.6,
        s, s, s
      );
      break;
    }

    case 'roundedBox': {
      geom = new RoundedBoxGeometry(
        params.width ?? 1.6,
        params.height ?? 1.6,
        params.depth ?? 1.6,
        Math.round(params.segments ?? 5),
        params.radius ?? 0.28
      );
      break;
    }

    case 'sphere': {
      geom = new THREE.SphereGeometry(
        params.radius ?? 1.0,
        Math.round(params.widthSegments ?? 36),
        Math.round(params.heightSegments ?? 24)
      );
      break;
    }

    case 'cylinder': {
      geom = new THREE.CylinderGeometry(
        params.radiusTop ?? 0.9,
        params.radiusBottom ?? 0.9,
        params.height ?? 2.0,
        Math.round(params.radialSegments ?? 32),
        16
      );
      break;
    }

    case 'cone': {
      geom = new THREE.ConeGeometry(
        params.radius ?? 1.0,
        params.height ?? 2.1,
        Math.round(params.radialSegments ?? 32),
        16
      );
      break;
    }

    case 'pyramid': {
      geom = new THREE.ConeGeometry(
        params.radius ?? 1.2,
        params.height ?? 2.0,
        Math.max(3, Math.round(params.sides ?? 4)),
        12
      );
      break;
    }

    case 'capsule': {
      geom = new THREE.CapsuleGeometry(
        params.radius ?? 0.65,
        params.length ?? 1.2,
        Math.round(params.capSegments ?? 16),
        Math.round(params.radialSegments ?? 32)
      );
      break;
    }

    case 'torus': {
      geom = new THREE.TorusGeometry(
        params.radius ?? 1.0,
        params.tube ?? 0.38,
        Math.round(params.radialSegments ?? 24),
        Math.round(params.tubularSegments ?? 56)
      );
      geom.rotateX(Math.PI / 2);
      break;
    }

    case 'torusKnot': {
      geom = new THREE.TorusKnotGeometry(
        params.radius ?? 0.85,
        params.tube ?? 0.26,
        Math.round(params.tubularSegments ?? 96),
        20,
        Math.round(params.p ?? 2),
        Math.round(params.q ?? 3)
      );
      break;
    }

    case 'teapot': {
      geom = new TeapotGeometry(
        params.size ?? 0.85,
        Math.round(params.segments ?? 12),
        true, true, true, false, true
      );
      break;
    }

    case 'star': {
      const pts = Math.max(3, Math.round(params.points ?? 5));
      const outerR = params.outerRadius ?? 1.2;
      const innerR = Math.min(outerR - 0.05, params.innerRadius ?? 0.55);
      const starShape = new THREE.Shape();
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();
      const bevel = params.bevel ?? 0.08;
      geom = new THREE.ExtrudeGeometry(starShape, {
        depth: params.depth ?? 0.45,
        bevelEnabled: bevel > 0.005,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 4,
        steps: 4
      });
      geom.center();
      break;
    }

    case 'heart': {
      const s = (params.scale ?? 1.0) * 0.085;
      const hs = new THREE.Shape();
      hs.moveTo(0, 5 * s);
      hs.bezierCurveTo(0, 5 * s, -2 * s, 0, -6 * s, 0);
      hs.bezierCurveTo(-12 * s, 0, -12 * s, 7 * s, -12 * s, 7 * s);
      hs.bezierCurveTo(-12 * s, 11 * s, -8 * s, 15.4 * s, 0, 19 * s);
      hs.bezierCurveTo(8 * s, 15.4 * s, 12 * s, 11 * s, 12 * s, 7 * s);
      hs.bezierCurveTo(12 * s, 7 * s, 12 * s, 0, 6 * s, 0);
      hs.bezierCurveTo(2 * s, 0, 0, 5 * s, 0, 5 * s);

      const bevel = params.bevel ?? 0.1;
      geom = new THREE.ExtrudeGeometry(hs, {
        depth: params.depth ?? 0.45,
        bevelEnabled: bevel > 0.005,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5,
        curveSegments: 24
      });
      geom.rotateZ(Math.PI);
      geom.center();
      break;
    }

    case 'gear': {
      const teeth = Math.max(5, Math.round(params.teeth ?? 12));
      const baseR = params.radius ?? 1.1;
      const toothH = params.toothHeight ?? 0.24;
      const holeR = Math.min(baseR - 0.15, params.holeRadius ?? 0.42);
      const gearShape = new THREE.Shape();
      const totalSteps = teeth * 4;

      for (let i = 0; i < totalSteps; i++) {
        const mod = i % 4;
        const r = (mod === 1 || mod === 2) ? baseR + toothH : baseR;
        const angle = (i / totalSteps) * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) gearShape.moveTo(x, y);
        else gearShape.lineTo(x, y);
      }
      gearShape.closePath();

      if (holeR > 0.05) {
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, holeR, 0, Math.PI * 2, true);
        gearShape.holes.push(holePath);
      }

      geom = new THREE.ExtrudeGeometry(gearShape, {
        depth: params.depth ?? 0.4,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 3
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      break;
    }

    case 'spring': {
      const radius = params.radius ?? 0.75;
      const height = params.height ?? 2.2;
      const turns = params.turns ?? 4;
      const wireRadius = params.wireRadius ?? 0.16;

      class HelixCurve extends THREE.Curve {
        getPoint(t, optionalTarget = new THREE.Vector3()) {
          const angle = t * Math.PI * 2 * turns;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (t - 0.5) * height;
          return optionalTarget.set(x, y, z);
        }
      }
      geom = new THREE.TubeGeometry(new HelixCurve(), Math.round(turns * 32), wireRadius, 16, false);
      break;
    }

    case 'tubeRing': {
      const outerR = params.outerRadius ?? 1.1;
      const innerR = Math.min(outerR - 0.08, params.innerRadius ?? 0.75);
      const segs = Math.max(3, Math.round(params.segments ?? 36));
      const ringShape = new THREE.Shape();
      ringShape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
      ringShape.holes.push(hole);

      geom = new THREE.ExtrudeGeometry(ringShape, {
        depth: params.height ?? 0.8,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 3,
        curveSegments: segs
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      break;
    }

    case 'icosahedron': {
      geom = new THREE.IcosahedronGeometry(
        params.radius ?? 1.05,
        Math.round(params.detail ?? 0)
      );
      break;
    }

    case 'dodecahedron': {
      geom = new THREE.DodecahedronGeometry(
        params.radius ?? 1.05,
        Math.round(params.detail ?? 0)
      );
      break;
    }

    case 'octahedron': {
      geom = new THREE.OctahedronGeometry(
        params.radius ?? 1.0,
        Math.round(params.detail ?? 0)
      );
      if (params.stretchY && params.stretchY !== 1) {
        geom.scale(1, params.stretchY, 1);
      }
      break;
    }

    case 'tetrahedron': {
      geom = new THREE.TetrahedronGeometry(
        params.radius ?? 1.15,
        Math.round(params.detail ?? 0)
      );
      break;
    }

    case 'terrain': {
      const size = params.size ?? 3.6;
      const segs = Math.round(params.segments ?? 28);
      const elev = params.elevation ?? 0.85;
      const freq = params.freq ?? 1.6;
      geom = new THREE.PlaneGeometry(size, size, segs, segs);
      geom.rotateX(-Math.PI / 2);

      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const distFromEdge = Math.max(0, 1 - Math.hypot(x, z) / (size * 0.6));
        const h =
          (Math.sin(x * freq) * Math.cos(z * freq) * 0.6 +
            Math.sin((x + z) * freq * 1.9) * 0.3 +
            Math.cos(x * freq * 3.1 - z * 2.2) * 0.15) *
          elev *
          distFromEdge;
        pos.setY(i, h);
      }
      geom.computeVertexNormals();
      break;
    }

    case 'text3d': {
      if (font) {
        const textStr = (params.text || 'FORMA 3D').trim() || '3D';
        const bevel = params.bevel ?? 0.03;
        geom = new TextGeometry(textStr, {
          font,
          size: params.size ?? 0.75,
          depth: params.depth ?? 0.3,
          curveSegments: 8,
          bevelEnabled: bevel > 0.002,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelOffset: 0,
          bevelSegments: 4
        });
        geom.center();
      } else {
        geom = new RoundedBoxGeometry(2.2, 0.8, 0.4, 4, 0.1);
      }
      break;
    }

    default:
      geom = new THREE.BoxGeometry(1.5, 1.5, 1.5, 8, 8, 8);
  }

  // Apply Real-Time Vertex Deformers (Twist, Taper, Wave, Noise)
  applyMeshModifiers(geom, modifiers);

  return geom;
}

/**
 * Applies non-destructive procedural deformers (Twist, Taper, Wave, Noise) to a BufferGeometry.
 */
function applyMeshModifiers(geometry, modifiers = {}) {
  const twist = Number(modifiers.twist || 0);
  const taper = Number(modifiers.taper || 0);
  const wave = Number(modifiers.wave || 0);
  const noise = Number(modifiers.noise || 0);

  if (Math.abs(twist) < 0.001 && Math.abs(taper) < 0.001 && wave < 0.001 && noise < 0.001) {
    return;
  }

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const heightSpan = Math.max(0.001, bbox.max.y - bbox.min.y);
  const midY = (bbox.max.y + bbox.min.y) * 0.5;

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const normY = (y - midY) / (heightSpan * 0.5); // -1 to +1

    // 1. Taper (Afinar / Alargar ao longo de Y)
    if (Math.abs(taper) >= 0.001) {
      const factor = Math.max(0.05, 1 + normY * taper * 0.5);
      x *= factor;
      z *= factor;
    }

    // 2. Twist (Torcer ao longo de Y)
    if (Math.abs(twist) >= 0.001) {
      const angle = normY * twist * 0.5;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const nx = x * cosA - z * sinA;
      const nz = x * sinA + z * cosA;
      x = nx;
      z = nz;
    }

    // 3. Wave (Ondulação senoidal 3D)
    if (wave >= 0.001) {
      x += Math.sin(y * 4.0 + z * 2.0) * wave * 0.25;
      z += Math.cos(y * 4.0 + x * 2.0) * wave * 0.25;
    }

    // 4. Noise (Deslocamento Cristalizado / Orgânico determinístico)
    if (noise >= 0.001) {
      const hash = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
      const rand = (hash - Math.floor(hash)) * 2 - 1;
      const len = Math.hypot(x, y, z) || 1;
      const disp = rand * noise * 0.28;
      x += (x / len) * disp;
      y += (y / len) * disp;
      z += (z / len) * disp;
    }

    pos.setXYZ(i, x, y, z);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}
