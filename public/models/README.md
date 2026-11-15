# public/models — modelos 3D da cena da base

Coloque aqui os modelos 3D que entram na cena lunar (Menu e Explorador).
Tudo em `public/` é servido pela raiz do site, então um arquivo
`public/models/rover.glb` é carregado em runtime pela URL `/models/rover.glb`
— exatamente como as texturas em `public/textures/` (ex.: `/textures/2k_moon.jpg`).

## Formato

- Use **glTF binário (`.glb`)** — um único arquivo com malha, materiais e
  texturas embutidas. É o formato que o three.js carrega nativamente e o mais
  simples de versionar (um arquivo só, sem `.bin`/`.png` soltos).
- `.gltf` (JSON + `.bin` + texturas separadas) também funciona, mas mantenha
  todos os arquivos irmãos juntos nesta pasta.
- Evite `.obj`/`.fbx`: exigem loaders extras e não carregam material/animação
  de forma confiável offline.

## Orçamento (este app roda em Chromebook de escola, offline)

- **Tamanho**: mire em **≤ 1–2 MB por modelo** já comprimido. Rode os `.glb`
  pelo [gltf-transform](https://gltf-transform.dev/) (`gltf-transform optimize`)
  ou pelo [gltfpack/meshopt](https://meshoptimizer.org/gltf/) antes de commitar.
- **Polígonos**: a cena é um painel pequeno; alguns milhares de triângulos por
  objeto é o suficiente. Nada de malha de milhões de vértices.
- **Texturas**: no máximo 1K (1024²), em `.webp`/`.jpg`. Sem textura de 4K —
  a GPU alvo é fraca.
- **Offline-first**: NÃO busque modelos de CDN/rede em runtime. Todo asset tem
  que estar nesta pasta e ser servido localmente (o service worker faz o cache).

## Convenção de eixos e escala

A cena usa unidades do three.js onde **1 unidade ≈ o raio da cúpula** da base
(ver `src/app/components/baseScene.ts`). Ao exportar:

- **Eixo para cima: Y** (padrão glTF). O chão fica em `y = 0`.
- Modele voltado para **+Z** (frente da câmera).
- Deixe a **origem (pivô) na base** do objeto, no chão — assim posicionar é só
  definir `x`/`z` sem calcular meia-altura.
- Mantenha escala coerente: o rover atual tem ~0,5 unidade de comprimento; a
  cúpula tem raio 1. Exporte na mesma ordem de grandeza (reescalar depois no
  código é possível, mas é melhor acertar na exportação).

## Nomenclatura sugerida

```
public/models/
  rover.glb
  habitat.glb
  solar-panel.glb
  antenna.glb
  ...
```

Nomes em `kebab-case`, descritivos, em inglês (como os ids do engine).

## Como já está plugado

`base.glb` **já está ligado** na cena por `src/app/components/baseScene.ts`:

- É carregado por `GLTFLoader` de `/models/base.glb` (constante `MODEL_URL`).
- **Fit-to-bounds automático**: o código calcula a bounding box, centra na
  horizontal, apoia a base no chão (`y = 0`) e reescala pela maior dimensão
  horizontal até `MODEL_TARGET_SPAN` (≈ 4,6 unidades). Então **a escala com que
  você exporta não importa** — ajuste `MODEL_TARGET_SPAN` se quiser maior/menor.
- **Fallback de primeira classe**: a base procedural (grupo `built`) fica visível
  até o `.glb` carregar; se o arquivo sumir ou o glTF for inválido, ela
  permanece. Mesmo princípio do SVG que cobre o WebGL.
- **Disposal**: ao carregar, o código percorre o modelo e registra cada
  `geometry`/`material` para liberação no `dispose()` — contexto WebGL é raro.

Para **trocar o modelo**, é só sobrescrever `public/models/base.glb` (mantendo as
convenções de eixos/escala/pivô acima) e recarregar. Chão lunar, Terra, céu e
estrelas são ambiente procedural e continuam por trás do modelo.

> Nota sobre o export atual: o `Untitled.glb` original tinha vértices-lixo nas
> cascas dos domos (resquício de boolean) que explodiam a bounding box; o
> `base.glb` é a versão limpa. Se re-exportar, remova esses vértices no Blender
> (Edit Mode → achar os vértices muito distantes → deletar) antes.
