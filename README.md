# 🎨 Forma3D Studio

Estúdio web **100% gratuito e open-source** para criação de formas 3D no navegador com **bibliotecas 3D integradas via API** (mais de **700 modelos 3D livres** prontos para usar, sem precisar de chave de API ou conta).

---

## ✨ Funcionalidades

- **🔷 Criador de Formas 3D Paramétricas (20+ Formas):**
  - Cubo, Cubo Arredondado, Esfera, Cilindro, Cone, Pirâmide, Cápsula, Rosquinha (Torus), Nó Toroidal, Bule 3D (Utah Teapot), Estrela 3D, Coração 3D, Engrenagem Mecânica, Mola/Hélice, Anel, Poliedros, Terreno Low-Poly e **Texto 3D**.
- **🌀 Deformadores de Malha em Tempo Real:**
  - Modifique qualquer forma criada com **Torcer (Twist)**, **Afinar (Taper)**, **Ondular (Wave)** e **Ruído (Noise)**.
- **🌍 Bibliotecas 3D Integradas (100% Grátis via API):**
  - **Poly Haven API:** +522 modelos PBR realistas em domínio público (CC0) com texturas 1K/2K.
  - **Khronos Official glTF API:** +151 modelos oficiais `.glb` / `.gltf`.
  - **Coleção Three.js:** +28 modelos e personagens animados com reprodutor de animações integrado.
  - **Busca Inteligente PT/EN:** Pesquise modelos tanto em português (*cadeira, planta, carro, câmera, relógio*) quanto em inglês.
- **🎨 Estúdio de Materiais PBR & Iluminação:**
  - Presets rápidos (*Plástico, Ouro, Cromo, Neon, Vidro, Argila, Esmeralda, Holograma*), ajuste de metalicidade, rugosidade, opacidade, *Wireframe* e *Low-Poly*.
- **📦 Importação e Exportação Livre:**
  - **Importe** arquivos `.glb`, `.gltf`, `.obj` e `.stl` (arraste e solte na tela).
  - **Exporte** sua cena gratuitamente em **`.GLB`**, **`.GLTF`**, **`.OBJ`**, **`.STL`** (impressão 3D) ou **`.PNG`** (render).

---

## 🚀 Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/forma3d-studio.git

# 2. Entre na pasta do projeto
cd forma3d-studio

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Depois, basta abrir o link exibido no terminal (por padrão `http://localhost:5173`).

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
| :--- | :--- |
| `G` ou `W` | Mover objeto selecionado |
| `R` ou `E` | Rotacionar objeto selecionado |
| `S` ou `T` | Escalar objeto selecionado |
| `F` | Pousar objeto no chão |
| `Ctrl + D` | Duplicar objeto selecionado |
| `Delete` / `Backspace` | Excluir objeto selecionado |
| `Duplo Clique` | Focar câmera no objeto |

---

## 🛠️ Tecnologias Utilizadas

- [Three.js](https://threejs.org/) (WebGL, PBR, Loaders & Exporters)
- [Vite](https://vitejs.dev/)
- APIs abertas: [Poly Haven API](https://polyhaven.com/) (CC0) & [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)

---

## 📄 Licença

Distribuído sob a licença **MIT**. Sinta-se livre para usar, modificar e compartilhar!
