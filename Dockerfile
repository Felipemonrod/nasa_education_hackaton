# Ambiente de DESENVOLVIMENTO do frontend (Vite + HMR).
#
# Debian slim (glibc) de proposito, nao Alpine: o Vite depende de binarios
# nativos (esbuild, rollup) e o Alpine (musl) costuma exigir variantes
# diferentes das fixadas no package-lock.json gerado em glibc. Slim evita
# esse atrito em troca de alguns MB.
FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias numa camada propria: so reinstala quando package.json ou
# package-lock.json mudam. npm ci respeita o lock, instalacao reproduzivel.
COPY package.json package-lock.json ./
RUN npm ci

# O codigo real entra por bind mount no compose; este COPY serve para quem
# rodar a imagem sem o compose (ex.: `docker run`).
COPY . .

# Porta padrao do Vite.
EXPOSE 5173

# --host 0.0.0.0 e OBRIGATORIO no container: sem isso o Vite escuta so em
# localhost DE DENTRO do container e a porta publicada nao responde no host.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
