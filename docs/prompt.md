A partir desse momento você é um game designer, arquiteto e engenheiro de softwares sênior, focando em jogos web no formato Progressive Web Apps.

Seu objetivo é desenvolver o PoC (proof of concept) de uma simulação / base-management / decision-based de APRENDIZADO para astronautas mirins, mantendo a diversão como objetivo secundário, com trade-offs e estratégias reais. O aprendizado vem de TODA decisão ser pensada, ter um 'porém' e explicar claramente o porquê de cada consequência ou erro.

======

HISTORIA: Você é um astronauta encarregado com a missão de estabelecer um outpost para a NASA em outro mundo. Decida o destino, o que levar na viagem e calcule os riscos em cada decisão nesse base-management que se assemelha ao mundo real. Evite que os recursos se esgotem antes de uma descoberta. Será que conseguirá manter a base até o fim ou encontrar um motivo para voltar?

RECURSOS: oxigênio, energia, blindagem de radiação (proteção física/estrutural passiva, como paredes com água, regolito e abrigo central), comida
RECURSOS EXTRA: ciência, suporte de vida
ESCALA DOS RECURSOS: Todos os recursos (básicos e extra) devem ser mostrados e calculados em valores numéricos de 0 a 100. Apenas zerar um dos 4 recursos básicos causa derrota; os recursos extra começam baixos/em 0 e geram vitória ao atingir 100.

OBJETIVO: Após selecionar a missão e fundar seu outpost, chegue até o fim do tempo estipulado (no MVP, o nível jogável será de 10 dias em jogo; a campanha de 18 dias e outros níveis ficarão como "Coming Soon") sem zerar nenhum recurso básico OU faça algum recurso extra atingir o máximo (100). A gameplay deve ser mais ágil e simplificada, com textos enxutos nos cards e fluxo direto. Progredir em descobertas científicas ou fazer o outpost atingir um suporte de vida estável com decisões

DERROTA: algum dos 4 recursos básicos esgotar (chegar a 0)

LOCAIS DE POUSO: para a PoC/MVP, apenas a Lua é necessária e jogável (baseada em locais de pouso real, como hemisfério norte, sul e outros — com dificuldade Iniciante); Marte fica fora do escopo jogável da PoC (exibido apenas como "Coming Soon" para atualizações futuras); cada local terá sua especificação (como recursos observáveis) aleatorizada dentro de uma faixa numérica equilibrada (ex.: recursos iniciais pós-viagem na faixa de 75 a 90 na Lua); viajar para o local consumirá recursos, ou seja, viagens longas = começar com menos recursos

FUNCIONALIDADES DO MVP (ENTREGAR AGORA): 
1 - nível inicial jogável de 10 dias na Lua (dificuldade Iniciante) com 4 cards/dia (2 diurnos e 2 noturnos), sendo necessário vencê-lo para desbloquear outros níveis; os demais níveis, Marte, durações, dificuldades avançadas e modos ficam exibidos como "Coming Soon"
2 - salvar jogo e estado atual da partida (localmente no navegador)
3 - baralho completável (com outcomes revelados conforme experimentados e proteção contra falta de cards no pool)
4 - recompensas ao vencer, como cosméticos simples (ex.: emblemas da missão e variações visuais/cores do HUD da base) e novas ajudas (comandantes/estruturas/equipamentos)
5 - gameplay mais ágil e simplificada, com textos enxutos nos cards e recursos numéricos 0-100
6 - fluxo de gameplay completo e mecânica principal loopável
7 - tutorial funcional e organizado

PRODUTO COMPLETO E ATUALIZAÇÕES FUTURAS (COMING SOON - FORA DO MVP ATUAL):
1 - campanha padrão de 18 dias com 7 cards/dia (4 diurnos e 3 noturnos) e partidas com duração de 30+ minutos
2 - destino Marte, outros níveis de dificuldade (Padrão, Astronauta, Engenheiro Espacial) e durações desbloqueáveis após concluir o nível de 10 dias, além do 'modo infinito' completo
3 - expansão do baralho com novos cards, cosméticos avançados e animações/pixelart completas

TEMPO: o jogo se divide em dois turnos de decisões pelo relógio interno da base (UTC): Turno Diurno (Operações) e Turno Noturno (Manutenção/Vigília). No planejamento inicial de 10 dias (MVP), na parte diurna haverá 2 eventos e à noite haverá 2 eventos; total = 4. No planejamento completo de 18 dias (Coming Soon), na parte do dia haverá 4 eventos, enquanto à noite haverá 3 eventos; total = 7

Cada evento é uma decisão, que por sua vez é uma 'card' (cartas) dentro do jogo. Há 4 tipos de cards:
CARDS ÚNICOS -> decisões pontuais e simples, o tipo mais comum ao decorrer da partida; alguns são cards de rotina (como limpar algo ou reciclar água) e podem se repetir com um 'cooldown'
CARDS CONDICIONAIS -> ativados com uma condição específica (ex.: colheitas)
CARDS TEMPORAIS -> baseados em tempo, continuam por y dias ou turnos na partida, progridem e ocupam um dos slots do turno (ex.: tempestade de radiação solar prolongada ou manutenção em etapas)
CARDS SEQUENCIAIS -> um card único que puxa outro se a decisão tomada, ocupando um dos slots seguintes

Além disso, cards não podem repetir na mesma partida (exceto os cards únicos de rotina, respeitando seu cooldown) e são divididos em diurnos e noturnos (aparecem apenas no período específico, respeitando o tempo do jogo). É possível liberar cards ao decorrer da gameplay, para aparecerem em futuras partidas. Caso o pool de cards únicos do turno se esgote antes do fim da missão, o sistema usa um fallback seguro liberando cards de rotina para evitar travamentos

BARALHO: salva os cards que a conta do usuário possui, sendo possível ver cada um e suas respectivas decisões; os outcomes de cada decisão são liberados individualmente no baralho apenas conforme o jogador os experimenta em partida; ver quais desafios devem ser completados para liberar mais cards; terá filtros e separações para facilitar visualização

INÍCIO DA MISSÃO: o usuário escolhe o destino e 3 cards de ajuda para levar (um de comandante e dois extras (estrutura e equipamentos)). Será possível escolher o comandante (ex.: 2-3 opções iniciais no MVP + desbloqueáveis), enquanto as duas extras (estrutura e equipamento, com pelo menos 3-4 opções cada no MVP) serão por RNG com um reroll cada. Cada card inicial concede um efeito mecânico objetivo na partida (bônus inicial nos valores 0-100, modificador passivo de turno ou mitigação de perdas em eventos específicos)

COMO OBTER OS DADOS: para uma experiência realista, os dados usados serão obtidos através de chamadas assíncronas de APIs em tempo real, como o DONKI (clima espacial) e APOD/EPIC/NASA Images (janela 'olhar espaço'), espalhados pelo sistema de forma balanceada. Deve usar cache local por data (evitando estourar limites da DEMO_KEY) e possuir dataset fallback offline com eventos reais históricos da NASA, sempre exibindo a referência da API usada. Exemplo de Uso: uma explosão solar acontecendo | aconteceu no dia aumenta a probabilidade de cartas de 'explosão solar'

O QUE SÃO:
- recursos extra: o 'porquê' da nasa ter te enviado na missão e uma alternativa extra para concluir o jogo sem ser por tempo

======

FLUXO DA APLICAÇÃO ('|' são caminhos opcionais): 

primeiro acesso ao menu da sessão? > 
| sim: cutscene animada > menu >
| não: menu > 
aparece opções de nova missão, configuração e créditos > seleciona nova missão > história padrão em texto e pulável > tela de escolher destino e local de pouso (apenas a Lua é necessária e jogável na PoC; Marte marcado como 'Coming Soon'), nível de duração (10 dias liberado no MVP; demais durações, níveis avançados e 'modo infinito' marcados como 'Coming Soon') e checkbox de 'tutorial' (só pode ser ativado na primeira dificuldade — Iniciante — e sem 'modo infinito') > seleção de cards iniciais e roletar os cards extras > tela de perdas da viagem, info do local e dificuldade calculada (iniciante no MVP; padrão, astronauta e engenheiro espacial como 'Coming Soon' ou conforme desbloqueio) > tela de carregamento > tela do jogo (visão geral da base, recursos em valores 0-100 e relógio UTC) e opção 'olhar espaço' como se fosse uma janela da base > primeiro card aparece de forma suave após 3 segundos, com opções baseado em fatos reais
| olhar o espaço > mostra uma foto de satélite da terra ou cósmos >
interagir com card > escolhe a opção desejada > aplica o trade-off nos recursos > aparece uma explicação enxuta e educativa do que aconteceu e do porquê daquele resultado (destacando claramente a causa científica/operacional ou onde o usuário errou na escolha) > avança nos cards do Turno Diurno (Operações) > chega o Turno Noturno (Manutenção/Vigília) e muda os cards para cards noturnos (com eventos noturnos) > usuário entra num loop de mecânica, fazendo suas decisões >
| recurso básico esgota > tela de resultado, com derrota + explicação clara do porquê o recurso esgotou e qual decisão ou erro levou ao fim + dica simples de aprendizado (uma frase) + resumo da missão
| tempo atingido ou objetivo alcançado > tela de resultado, com vitória + texto explicativo do fim + resumo da missão (liberando acesso aos próximos níveis no produto completo)
recompensas baseadas no desempenho

SEQUÊNCIA DE CARDS: apenas duas vezes no dia, deve obrigatoriamente vir um card de recurso extra (ciência ou suporte de vida) junto de um card de recurso básico. Nesse turno simultâneo, o player deve **priorizar um card em detrimento do outro**, escolhendo qual dos dois resolver e abrindo mão do outro (ex.: resolver um erro nas comunicações ou ir até uma cratera a 12 km com o Rover / enviar um drone ou satélite da base para investigar um meteorito); o card não escolhido retorna ao pool disponível para outros dias. No MVP (10 dias, 4 slots/dia), o array de sequência será {CARD DIURNO, CARD DIURNO + CARD DE RECURSO EXTRA, CARD NOTURNO, CARD NOTURNO + CARD DE RECURSO EXTRA}. No modo completo de 18 dias (Coming Soon, 7 slots/dia), será {CARD DIURNO, CARD DIURNO, CARD DIURNO + CARD DE RECURSO EXTRA, CARD DIURNO, CARD NOTURNO, CARD NOTURNO + CARD DE RECURSO EXTRA, CARD NOTURNO}. Cards temporais em andamento e cards sequenciais disparados ocupam um desses slots normais (respeitando se são diurnos ou noturnos).

SEQUÊNCIA DE DIAS: acontece o evento "Pouso da Cápsula de Suprimentos em Órbita" (cargas previamente estacionadas em órbita aguardando comando para descer, apresentado como uma decisão rápida com trade-off — ex.: priorizar suprimentos básicos gastando energia na descida ou recuperar módulos científicos — escalado pela progressão dos recursos extra). No MVP de 10 dias: a Cápsula desce no 5° dia. Na campanha de 18 dias (Coming Soon): a Cápsula desce no 10° dia.

DECISÃO: Todas as mecânicas devem ser balanceadas corretamente, para tanto derrota quanto vitória serem possíveis. É possível que uma decisão só apareça por um recurso estar acima de um limiar, garantindo porém que **todo card tenha pelo menos 1 opção sempre selecionável (sem limiar)** para evitar travamentos, enquanto também é possível (e desejável) que decisões só tragam perdas (NUNCA só ganhos). Cada card deve ter no máximo 3 decisões já definidas, e cada desfecho deve priorizar explicar o **porquê** de o evento ter acontecido ou de o jogador ter errado/acertado (aprendizado em primeiro lugar). Essas observações valem para as decisões de cards e cards de recurso extra

======

A interface deve possuir cores mais espaciais (branco nas letras e preto claro para o fundo, por exemplo). A font-family deve ser arredondada e sem serifa. Use glassmorphism leve onde for cabível, para destacar o que importa no momento

Os cards tem borda arredondada. Possui uma descrição curta, textos enxutos (visando uma gameplay mais ágil e simplificada) e todas as palavras importantes devem ser coloridas (gravidade = roxo, radiação / blindagem de radiação = vermelho-vinho, ciência = azul, oxigênio = azul claro, energia = amarelo-âmbar, comida = verde, suporte de vida = esmeralda/ciano). Os recursos no HUD são exibidos em valores numéricos (0-100). Embaixo do card, mostre as opções de decisão que o usuário pode escolher, sem matar a identidade visual do site. Clicar em um recurso ou palavra com cor diferente, deve mostrar uma breve descrição (máximo de 10 palavras) destinado a uma criança de 10 anos

Não deve ter login, a sessão é manejada por navegador na PoC

Para imagens, prefira sempre buscar imagens reais (estáticas ou buscando de APIs), enquanto mistura com desenhos ou pixelart (estilo mixed media). Vise coerência visual intencional, unificando iluminação, paleta de cores e a perspectiva entre os dois mundos. Por exemplo, ao clicar na janela de 'olhar espaço' mostrar uma imagem real da terra ou do cósmos, enquanto a base e o mundo (apenas a Lua na PoC; Marte no produto completo) são desenhados ou pixelart

Durante a gameplay, disponibilize um botão de engrenagem para acessar opções (salvar, configurações, voltar ao menu)

Na seleção de cards extras: do comandante deve ser um card vazio com um '+' no meio e pontilhados na lateral, enquanto os outros dois devem ter uma animação dos cards aparecendo e um mini-botão retangular abaixo deles com um ícone de refresh

Selecionar créditos aparece os nomes dos desenvolvedores e seu email (usando arquivo de configuração simples com placeholders editáveis para o MVP)

Caso não consiga fazer alguma parte da interface, lembre-se que é apenas um MVP, por isso é aceitável usar ícones em vez de desenhos ou pixelarts

O tutorial só pode ser ativado se jogando na primeira dificuldade (Iniciante) e sem modo infinito; ele deve ter mini-janelas com como o jogo funciona e explicando as mecânicas (incluindo que os turnos seguem o relógio interno da base em UTC e que, na Lua, os astronautas fecham as escotilhas no Turno Noturno para simular a noite mesmo com o Sol brilhando lá fora), sem ser muito insistente e informativo, com opção de fechar ou pular

======

STACK TÉCNICA (ESTÁVEL PARA DESENVOLVIMENTO E DEBUG COM AGENTES):
- Frontend e Build: React + TypeScript + Vite (tipagem estrita, compilação rápida e fácil rastreamento de erros)
- PWA: vite-plugin-pwa (manifesto instalável e Service Worker com cache offline)
- Estilização e Ícones: Tailwind CSS + Lucide React (tema espacial, glassmorphism leve e ícones prontos para o MVP)
- Estado e Engine de Jogo: Regras isoladas em TypeScript puro (funções determinísticas/reducer desacopladas da interface) integradas via Zustand ou React Context, com persistência separada em localStorage (save da partida vs. conta/baralho)
- Testes e Debug: Vitest para validar deterministicamente turnos, cooldowns, limites 0-100 e save/load

======

POSSÍVEIS CARDS: falha na comunicação, explosão solar forte (card temporal), explosão solar fraca, descoberta em cratera a 12 km com rover/drone (card de ciência), meteorito observado (card de ciência), poeira lunar nos painéis solares, reciclagem de água / limpeza de filtros (cards únicos de rotina com cooldown), entre outros
