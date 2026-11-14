import type { Card } from '../engine/types.js';

/**
 * Dataset do MVP. Conteudo e DADO, nao codigo: as invariantes do design
 * (<=3 opcoes, >=1 opcao sem limiar, nenhuma opcao so com ganhos, fase
 * correta, cooldown em rotinas) sao verificadas por teste automatizado em
 * tests/content.test.ts -- nao por disciplina do autor.
 *
 * `outcome.line`  -> sempre visivel, 1 linha (gameplay agil)
 * `outcome.why`   -> o APRENDIZADO, a causa cientifica/operacional
 * `outcome.mistake` -> so quando o jogador realmente errou
 */

export const CARDS: readonly Card[] = [
  // =========================================================================
  // BASICOS - TURNO DIURNO (OPERACOES)
  // =========================================================================
  {
    id: 'dust_panels',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 3,
    title: 'Poeira nos paineis',
    text: 'O [[regolith]] cobriu os [[solar_panel]]. A geracao de [[power]] caiu.',
    options: [
      {
        id: 'eva_clean',
        label: 'Sair de traje e limpar',
        effects: [
          { stat: 'lifeSupport', delta: 1 },
          { stat: 'power', delta: 7 },
          { stat: 'oxygen', delta: -4 },
          { stat: 'dose', delta: 3 },
        ],
        outcome: {
          line: 'Paineis limpos. A geracao voltou ao normal.',
          why: 'Cada ciclo da [[airlock]] joga ar fora, e la nao existe a [[shielding]] da base: a [[dose]] sobe. Limpar funciona, mas voce paga em ar e em radiacao.',
          verdict: 'mixed',
        },
      },
      {
        id: 'blower',
        label: 'Usar o soprador eletrico',
        requires: [{ stat: 'power', op: 'gte', value: 30 }],
        effects: [
          { stat: 'power', delta: 6 },
          { stat: 'shielding', delta: -2 },
        ],
        outcome: {
          line: 'Recuperacao parcial, sem ninguem sair.',
          why: 'A poeira lunar e afiada e eletrostatica: soprar devolve parte da luz aos paineis, mas espalha gra~os abrasivos sobre a [[shielding]].',
          verdict: 'mixed',
        },
      },
      {
        id: 'postpone',
        label: 'Deixar para outro dia',
        effects: [{ stat: 'power', delta: -6 }],
        outcome: {
          line: 'A geracao continuou caindo.',
          why: 'Sem chuva e sem vento, nada limpa um painel na Lua. Poeira nao sai sozinha: adiar e escolher perder [[power]] todos os dias.',
          verdict: 'bad',
          mistake: 'Voce tratou um problema que piora sozinho como se ele pudesse esperar.',
        },
      },
    ],
  },
  {
    id: 'comm_failure',
    kind: 'unique',
    role: 'basic',
    phase: 'day',
    title: 'Enlace perdido',
    text: 'A [[antenna]] perdeu o apontamento. Nenhum dado esta chegando a Terra.',
    options: [
      {
        id: 'realign',
        label: 'Realinhar a antena na mao',
        effects: [
          { stat: 'oxygen', delta: -4 },
          { stat: 'dose', delta: 3 },
          { stat: 'science', delta: 4 },
        ],
        outcome: {
          line: 'Enlace restabelecido. Os dados subiram.',
          why: 'Dado que nao chega a Terra e dado perdido: a base nao tem espaco para guardar tudo. A [[eva]] custou ar e [[dose]], mas salvou a [[science]] da semana.',
          verdict: 'good',
        },
      },
      {
        id: 'reboot',
        label: 'Reiniciar o software e esperar',
        effects: [
          { stat: 'power', delta: -4 },
          { stat: 'science', delta: -3 },
        ],
        outcome: {
          line: 'Voltou sozinho, mas tarde.',
          why: 'Reiniciar e barato e as vezes resolve. Aqui o problema era mecanico, e a janela de transmissao com a Terra fechou antes.',
          verdict: 'mixed',
        },
      },
      {
        id: 'backup_dish',
        label: 'Ligar a antena de reserva',
        requires: [{ stat: 'power', op: 'gte', value: 50 }],
        effects: [
          { stat: 'power', delta: -10 },
          { stat: 'science', delta: 2 },
        ],
        outcome: {
          line: 'Reserva no ar, consumindo muito.',
          why: 'A antena de reserva e menor: gasta mais [[power]] para enviar menos dados. Redundancia sempre custa, por isso ela e a segunda opcao e nao a primeira.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'hatch_leak',
    kind: 'unique',
    role: 'basic',
    phase: 'day',
    title: 'Micro-vazamento',
    text: 'Sensor acusa perda lenta de pressao na [[airlock]].',
    options: [
      {
        id: 'seal_now',
        label: 'Selar agora',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'oxygen', delta: -2 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Vazamento fechado no mesmo turno.',
          why: 'Um vazamento nao para sozinho: o ar escapa sem parar ate alguem selar. Selar cedo custou 2 de [[oxygen]]; esperar custaria muito mais.',
          verdict: 'good',
        },
      },
      {
        id: 'monitor',
        label: 'Monitorar por um turno',
        effects: [{ stat: 'oxygen', delta: -8 }],
        outcome: {
          line: 'A perda acelerou durante o turno.',
          why: 'Ar que vaza para o vacuo nao volta. Nao existe "vazamento estavel" quando do outro lado a pressao e zero.',
          verdict: 'bad',
          mistake: 'Voce coletou dados sobre um problema em vez de parar a perda.',
        },
      },
      {
        id: 'depressurize',
        label: 'Manter a eclusa despressurizada',
        requires: [{ stat: 'oxygen', op: 'gte', value: 50 }],
        effects: [{ stat: 'oxygen', delta: -3 }],
        modifiers: [{ stat: 'oxygen', perSlot: -1, slots: 4, label: 'Eclusa fora de operacao' }],
        outcome: {
          line: 'Perda contida, saidas limitadas.',
          why: 'Sem pressao na [[airlock]], o vazamento para. Mas cada [[eva]] passa a gastar ar extra para repressurizar tudo de novo.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'water_recycle',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 2,
    title: 'Filtros do reciclador',
    text: 'Os filtros de agua estao saturados. A [[electrolysis]] rende menos.',
    options: [
      {
        id: 'full',
        label: 'Manutencao completa',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -5 },
          { stat: 'oxygen', delta: 5 },
        ],
        outcome: {
          line: 'Reciclador em plena eficiencia.',
          why: 'Quase todo o [[oxygen]] da base vem da agua por [[electrolysis]]. Filtro limpo = mais agua util = mais ar. Agua e ar sao o mesmo problema aqui.',
          verdict: 'good',
        },
      },
      {
        id: 'quick',
        label: 'Limpeza rapida',
        effects: [
          { stat: 'power', delta: -2 },
          { stat: 'oxygen', delta: 2 },
        ],
        modifiers: [{ stat: 'oxygen', perSlot: -1, slots: 2, label: 'Filtro parcialmente saturado' }],
        outcome: {
          line: 'Resolveu metade do problema.',
          why: 'Economizar [[power]] na manutencao parece esperto, mas o filtro continua sujo e segue cobrando [[oxygen]] nos turnos seguintes.',
          verdict: 'mixed',
        },
      },
      {
        id: 'skip',
        label: 'Pular a manutencao',
        effects: [{ stat: 'oxygen', delta: -5 }],
        outcome: {
          line: 'Rendimento do reciclador caiu.',
          why: 'Manutencao nao e opcional em sistema fechado: tudo que voce nao recicla, voce perde para sempre.',
          verdict: 'bad',
          mistake: 'Voce economizou energia hoje pagando em oxigenio todos os dias.',
        },
      },
    ],
  },
  {
    id: 'flare_weak',
    kind: 'unique',
    role: 'basic',
    phase: 'day',
    solarFlare: 'weak',
    title: 'Tempestade solar fraca',
    text: 'O monitor acusa [[solar_storm]] de classe baixa a caminho.',
    options: [
      {
        id: 'shelter',
        label: 'Recolher ao abrigo central',
        effects: [
          { stat: 'dose', delta: 1 },
          { stat: 'science', delta: -4 },
          { stat: 'power', delta: -2 },
        ],
        outcome: {
          line: 'Tripulacao protegida, operacoes paradas.',
          why: 'O [[central_shelter]] tem mais massa em volta, e massa e o que para [[radiation]]. O preco foi um turno sem trabalho de campo.',
          verdict: 'good',
        },
      },
      {
        id: 'carry_on',
        label: 'Seguir as operacoes',
        effects: [
          { stat: 'dose', delta: 6 },
          { stat: 'science', delta: 3 },
        ],
        outcome: {
          line: 'Trabalho adiantado, exposicao maior.',
          why: 'Classe baixa nao mata ninguem hoje. Mas a [[dose]] e cumulativa e nunca desce: voce acabou de gastar parte do seu limite do ano.',
          verdict: 'mixed',
        },
      },
      {
        id: 'reinforce',
        label: 'Reforcar o teto com regolito',
        requires: [{ stat: 'power', op: 'gte', value: 40 }],
        effects: [
          { stat: 'power', delta: -8 },
          { stat: 'shielding', delta: 5 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Blindagem melhor para as proximas.',
          why: 'Voce transformou um aviso em investimento: [[regolith]] e de graca e esta no chao. Quem reforca antes paga menos [[dose]] nas tempestades seguintes.',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'flare_strong',
    kind: 'temporal',
    role: 'basic',
    phase: 'any',
    solarFlare: 'strong',
    title: 'Tempestade solar classe X',
    text: 'Evento forte. As particulas continuam chegando por varios turnos.',
    temporal: {
      slots: 3,
      perSlot: [
        { stat: 'dose', delta: 1 },
        { stat: 'shielding', delta: -1 },
      ],
    },
    options: [
      {
        id: 'shelter',
        label: 'Abrigo central, tudo parado',
        effects: [
          { stat: 'dose', delta: 1 },
          { stat: 'science', delta: -3 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Turno perdido, dose de radiacao quase toda barrada.',
          why: 'Nenhuma blindagem para 100% das particulas: sempre entra um pouco. Mas a diferenca entre estar no [[central_shelter]] e fora dele e enorme.',
          verdict: 'good',
        },
      },
      {
        id: 'short_shifts',
        label: 'Operar em turnos curtos',
        effects: [
          { stat: 'dose', delta: 7 },
          { stat: 'science', delta: 4 },
        ],
        outcome: {
          line: 'Trabalho feito, exposicao alta.',
          why: 'Turnos curtos reduzem o tempo exposto, nao a intensidade. Numa classe X, mesmo poucos minutos fora valem muita [[dose]].',
          verdict: 'bad',
          mistake: 'Voce negociou saude da tripulacao por pontos de ciencia numa tempestade forte.',
        },
      },
      {
        id: 'rover_shelter',
        label: 'Abrigar a tripulacao no rover blindado',
        requires: [{ stat: 'power', op: 'gte', value: 35 }],
        effects: [{ stat: 'power', delta: -10 }],
        outcome: {
          line: 'Protegidos, com custo alto de energia.',
          why: 'O [[rover]] tem paredes de agua: hidrogenio para particulas melhor que metal. Manter suporte de vida nele por um turno custa muita [[power]].',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'shield_regolith',
    kind: 'unique',
    role: 'basic',
    phase: 'day',
    title: 'Reforco de blindagem',
    text: 'Sacos de [[regolith]] podem engrossar a [[shielding]] da base.',
    options: [
      {
        id: 'full_crew',
        label: 'Mutirao de EVA',
        effects: [
          { stat: 'shielding', delta: 12 },
          { stat: 'oxygen', delta: -5 },
          { stat: 'dose', delta: 4 },
        ],
        modifiers: [{ stat: 'power', perSlot: -1, slots: 2, label: 'Tripulacao cansada' }],
        outcome: {
          line: 'Blindagem bem mais grossa.',
          why: 'Voce pagou [[dose]] hoje para pagar muito menos todos os dias. Blindagem nao e consumida: ela atenua. Quanto mais massa, menos [[radiation]] entra.',
          verdict: 'good',
        },
      },
      {
        id: 'sleeping_only',
        label: 'So sobre os dormitorios',
        effects: [
          { stat: 'shielding', delta: 6 },
          { stat: 'oxygen', delta: -2 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Protecao onde a tripulacao passa mais tempo.',
          why: 'Proteger onde se dorme cobre um terco do dia com um terco do esforco. Priorizar por tempo de permanencia e a decisao certa quando falta gente.',
          verdict: 'good',
        },
      },
      {
        id: 'later',
        label: 'Adiar o reforco',
        effects: [{ stat: 'shielding', delta: -2 }],
        outcome: {
          line: 'A blindagem segue degradando.',
          why: '[[micrometeoroid]] e poeira raspam a cobertura todo dia. Sem reforco, a [[dose]] diaria sobe sozinha pelo resto da missao.',
          verdict: 'bad',
        },
      },
    ],
  },
  {
    id: 'greenhouse_photoperiod',
    kind: 'conditional',
    role: 'basic',
    phase: 'day',
    requires: [{ stat: 'food', op: 'lte', value: 70 }],
    title: 'Fotoperiodo da estufa',
    text: 'A [[greenhouse]] rende mais com mais horas de luz, e luz custa [[power]].',
    options: [
      {
        id: 'more_light',
        label: 'Aumentar as horas de luz',
        effects: [
          { stat: 'power', delta: -9 },
          { stat: 'food', delta: 10 },
        ],
        outcome: {
          line: 'Colheita adiantada.',
          why: 'Na base, [[food]] e [[power]] convertida em planta. Toda caloria no prato saiu de um [[solar_panel]] primeiro.',
          verdict: 'mixed',
        },
      },
      {
        id: 'ration',
        label: 'Manter a luz e racionar',
        effects: [
          { stat: 'food', delta: -4 },
          { stat: 'power', delta: 2 },
        ],
        outcome: {
          line: 'Energia preservada, pratos menores.',
          why: 'Racionar funciona por pouco tempo: tripulacao com menos caloria erra mais em [[eva]]. Voce comprou energia com margem de seguranca.',
          verdict: 'mixed',
        },
      },
      {
        id: 'leafy_only',
        label: 'LED so nas folhosas',
        effects: [
          { stat: 'power', delta: -4 },
          { stat: 'food', delta: 4 },
          { stat: 'science', delta: -2 },
        ],
        outcome: {
          line: 'Meio caminho, com dados perdidos.',
          why: 'Folhosas crescem rapido e com pouca luz. Mas voce interrompeu o experimento de cultivo controlado, e experimento interrompido nao vale como dado.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'rover_battery',
    kind: 'unique',
    role: 'basic',
    phase: 'day',
    title: 'Bateria do rover',
    text: 'O [[rover]] perdeu capacidade depois da noite fria.',
    options: [
      {
        id: 'diagnose',
        label: 'Rodar diagnostico completo',
        effects: [{ stat: 'power', delta: -4 }],
        chains: 'rover_battery_fix',
        outcome: {
          line: 'Diagnostico rodando. Resultado em seguida.',
          why: 'Consertar antes de medir e chute. Diagnostico custa [[power]] e um turno, e evita trocar a peca errada.',
          verdict: 'good',
        },
      },
      {
        id: 'swap',
        label: 'Trocar pela celula reserva',
        effects: [
          { stat: 'power', delta: -8 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Rover de volta, reserva gasta.',
          why: 'Funcionou, mas voce queimou a unica reserva sem saber se era ela o problema. Agora nao ha plano B para a proxima falha.',
          verdict: 'mixed',
        },
      },
      {
        id: 'half_range',
        label: 'Operar com metade do alcance',
        effects: [
          { stat: 'science', delta: -5 },
          { stat: 'power', delta: -2 },
        ],
        outcome: {
          line: 'Rover limitado ao perimetro.',
          why: 'Alcance e ciencia: os alvos interessantes estao longe da base. Reduzir raio e reduzir descoberta.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'rover_battery_fix',
    kind: 'sequential',
    role: 'basic',
    phase: 'day',
    sequentialOnly: true,
    title: 'Diagnostico: celula em curto',
    text: 'Uma celula do pacote esta em curto e puxa as outras para baixo.',
    options: [
      {
        id: 'isolate',
        label: 'Isolar a celula ruim',
        effects: [
          { stat: 'power', delta: -3 },
          { stat: 'science', delta: 3 },
        ],
        outcome: {
          line: 'Pacote estavel com 7 de 8 celulas.',
          why: 'Isolar o defeito e mais barato que substituir o conjunto. Voce perdeu um oitavo da capacidade e guardou a reserva para uma emergencia real.',
          verdict: 'good',
        },
      },
      {
        id: 'replace_pack',
        label: 'Substituir o pacote inteiro',
        effects: [
          { stat: 'power', delta: -10 },
          { stat: 'science', delta: 6 },
        ],
        outcome: {
          line: 'Rover com autonomia total.',
          why: 'Capacidade cheia abre alvos distantes. O custo foi alto e a reserva acabou: decisao boa se voce pretende explorar, ruim se pretende sobreviver.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'eva_suit_check',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 3,
    title: 'Checagem dos trajes',
    text: 'Os trajes de [[eva]] precisam de teste de pressao.',
    options: [
      {
        id: 'full_check',
        label: 'Checagem completa',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'power', delta: -4 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Todos os trajes aprovados.',
          why: 'O traje e a sua menor nave espacial. Testar com pressao gasta um pouco de ar de proposito: e mais barato descobrir o furo aqui dentro.',
          verdict: 'good',
        },
      },
      {
        id: 'sampling',
        label: 'Testar so por amostragem',
        effects: [
          { stat: 'power', delta: -1 },
          { stat: 'oxygen', delta: -1 },
        ],
        modifiers: [{ stat: 'oxygen', perSlot: -1, slots: 3, label: 'Traje com vedacao suspeita' }],
        outcome: {
          line: 'Economia agora, vazamento pequeno depois.',
          why: 'Amostragem serve para lote de parafuso, nao para equipamento que mantem gente viva. Um traje nao testado vaza em cada [[eva]].',
          verdict: 'bad',
        },
      },
    ],
  },

  // =========================================================================
  // BASICOS - TURNO NOTURNO (MANUTENCAO / VIGILIA)
  // =========================================================================
  {
    id: 'pressure_alarm',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Alarme as 03:00 UTC',
    text: 'Alarme de pressao durante a vigilia. Pode ser sensor ruim.',
    options: [
      {
        id: 'wake_crew',
        label: 'Acordar a tripulacao e inspecionar',
        effects: [
          { stat: 'lifeSupport', delta: 3 },
          { stat: 'power', delta: -4 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Falso positivo confirmado em 40 minutos.',
          why: 'Alarme de pressao se trata como verdadeiro ate provar o contrario. Custou uma noite de sono; a alternativa custaria a base.',
          verdict: 'good',
        },
      },
      {
        id: 'snooze',
        label: 'Silenciar e ver de manha',
        effects: [{ stat: 'oxygen', delta: -7 }],
        outcome: {
          line: 'Era real. Horas de ar perdidas.',
          why: 'Silenciar alarme nao e decisao de engenharia, e aposta. Em [[life_support]], o custo de checar errado e muito menor que o de ignorar certo.',
          verdict: 'bad',
          mistake: 'Voce desligou o aviso em vez de investigar a causa.',
        },
      },
      {
        id: 'remote',
        label: 'Checar os sensores remotamente',
        requires: [{ stat: 'power', op: 'gte', value: 30 }],
        effects: [
          { stat: 'power', delta: -6 },
          { stat: 'oxygen', delta: -2 },
        ],
        outcome: {
          line: 'Diagnostico sem acordar ninguem.',
          why: 'Telemetria resolve a maioria dos falsos positivos. Ela so nao enxerga o que nao tem sensor: o vazamento pequeno continuou por um turno.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'co2_scrubber',
    kind: 'routine',
    role: 'basic',
    phase: 'night',
    cooldownDays: 2,
    title: 'Cartucho do scrubber',
    text: 'O [[scrubber]] de CO2 esta no fim do cartucho.',
    options: [
      {
        id: 'swap',
        label: 'Trocar o cartucho agora',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -3 },
          { stat: 'oxygen', delta: 5 },
        ],
        outcome: {
          line: 'Ar limpo de novo.',
          why: 'O perigo em cabine fechada nao e so faltar [[oxygen]]: e sobrar gas carbonico. O [[scrubber]] e o que impede o ar de ficar toxico.',
          verdict: 'good',
        },
      },
      {
        id: 'regenerate',
        label: 'Regenerar o cartucho velho',
        effects: [
          { stat: 'lifeSupport', delta: 1 },
          { stat: 'power', delta: -7 },
          { stat: 'oxygen', delta: 3 },
          { stat: 'science', delta: 1 },
        ],
        outcome: {
          line: 'Cartucho reaproveitado com calor.',
          why: 'Regenerar gasta [[power]] mas nao gasta estoque. Em missao longe da Terra, o consumivel que voce nao tem vale mais que o watt que voce tem.',
          verdict: 'good',
        },
      },
      {
        id: 'wait',
        label: 'Esperar o proximo turno',
        effects: [{ stat: 'oxygen', delta: -6 }],
        outcome: {
          line: 'CO2 subiu durante a noite.',
          why: 'Gas carbonico acumula enquanto todos dormem, e dor de cabeca ja e sintoma de intoxicacao. Esse e o relogio que nao da para pausar.',
          verdict: 'bad',
          mistake: 'Voce adiou a unica tarefa que ninguem pode adiar.',
        },
      },
    ],
  },
  {
    id: 'micrometeorite',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Impacto na cupula',
    text: 'Um [[micrometeoroid]] furou a camada externa da [[shielding]].',
    options: [
      {
        id: 'patch_now',
        label: 'Remendo imediato',
        effects: [
          { stat: 'shielding', delta: -2 },
          { stat: 'oxygen', delta: -4 },
          { stat: 'power', delta: -3 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Furo fechado na mesma noite.',
          why: 'A Lua nao tem atmosfera para queimar pedrinhas: elas chegam inteiras a 20 km/s ou mais. Remendar no escuro custa [[dose]], mas limita o dano a [[shielding]].',
          verdict: 'good',
        },
      },
      {
        id: 'isolate',
        label: 'Isolar o modulo e consertar de dia',
        effects: [
          { stat: 'shielding', delta: -6 },
          { stat: 'food', delta: -2 },
        ],
        outcome: {
          line: 'Modulo fechado ate amanhecer.',
          why: 'Esperar a luz reduz o risco da equipe e aumenta a [[dose]] de todos, porque a [[shielding]] fica fina por mais tempo. Nao existe escolha sem custo aqui.',
          verdict: 'mixed',
        },
      },
      {
        id: 'inner_plate',
        label: 'Selar por dentro com placa',
        requires: [{ stat: 'power', op: 'gte', value: 40 }],
        effects: [
          { stat: 'shielding', delta: -3 },
          { stat: 'power', delta: -8 },
        ],
        outcome: {
          line: 'Vedacao feita sem ninguem sair.',
          why: 'Selar por dentro protege o ar, mas a massa que para [[radiation]] precisa estar do lado de fora. Voce resolveu pressao, nao blindagem.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'thermal_night',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Noite termica',
    text: 'As escotilhas estao fechadas e a base precisa de aquecimento.',
    options: [
      {
        id: 'heat_all',
        label: 'Aquecer todos os modulos',
        effects: [{ stat: 'power', delta: -10 }],
        outcome: {
          line: 'Base inteira em temperatura segura.',
          why: 'Os turnos seguem o relogio [[utc]] da base, nao o Sol: a tripulacao fecha as escotilhas para dormir mesmo com o Sol la fora. Mas o frio real vem do equipamento parado e da sombra.',
          verdict: 'mixed',
        },
      },
      {
        id: 'central_only',
        label: 'Aquecer so o modulo central',
        effects: [
          { stat: 'power', delta: -5 },
          { stat: 'food', delta: -3 },
          { stat: 'science', delta: -2 },
        ],
        outcome: {
          line: 'Energia salva, estufa e laboratorio frios.',
          why: 'Planta e amostra tambem precisam de temperatura. Economia que congela a [[greenhouse]] vira falta de [[food]] dois dias depois.',
          verdict: 'mixed',
        },
      },
      {
        id: 'waste_heat',
        label: 'Reaproveitar calor dos equipamentos',
        requires: [{ stat: 'shielding', op: 'gte', value: 60 }],
        effects: [
          { stat: 'power', delta: -3 },
          { stat: 'shielding', delta: -3 },
        ],
        outcome: {
          line: 'Aquecimento quase gratis.',
          why: 'Calor residual e energia que voce ja pagou uma vez. O preco foi abrir dutos na parede, e cada duto e um caminho a menos de [[shielding]].',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'ration_inventory',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Inventario de racoes',
    text: 'A contagem de [[food]] no sistema nao fecha com a prateleira.',
    options: [
      {
        id: 'recount',
        label: 'Recontagem completa',
        effects: [
          { stat: 'food', delta: 3 },
          { stat: 'power', delta: -2 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Um lote estava fora do sistema.',
          why: 'Contagem manual e a unica verificacao independente do software. Voce achou comida que o sistema achava que nao existia.',
          verdict: 'good',
        },
      },
      {
        id: 'trust_system',
        label: 'Confiar no sistema',
        effects: [{ stat: 'food', delta: -5 }],
        outcome: {
          line: 'O erro era do sistema, para menos.',
          why: 'Planejar consumo com numero errado e pior que ter pouco: voce decide como se tivesse margem que nao existe.',
          verdict: 'bad',
          mistake: 'Voce aceitou um numero que voce mesmo sabia estar inconsistente.',
        },
      },
      {
        id: 'precaution',
        label: 'Racionar por precaucao',
        effects: [
          { stat: 'food', delta: -1 },
          { stat: 'science', delta: -3 },
        ],
        outcome: {
          line: 'Consumo reduzido sem resolver a divergencia.',
          why: 'Racionar compra tempo, nao informacao. E tripulacao com menos caloria trabalha menos e erra mais.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'dust_airlock',
    kind: 'routine',
    role: 'basic',
    phase: 'night',
    cooldownDays: 3,
    title: 'Limpeza da eclusa',
    text: '[[regolith]] acumulado nas vedacoes da [[airlock]].',
    options: [
      {
        id: 'deep_clean',
        label: 'Limpeza completa das vedacoes',
        effects: [
          { stat: 'lifeSupport', delta: 3 },
          { stat: 'power', delta: -4 },
          { stat: 'oxygen', delta: -1 },
          { stat: 'shielding', delta: 2 },
        ],
        outcome: {
          line: 'Vedacoes limpas e conferidas.',
          why: 'A poeira lunar nunca foi arredondada por agua ou vento: cada grao tem ponta. Ela corta borracha de vedacao como lixa fina.',
          verdict: 'good',
        },
      },
      {
        id: 'floor_only',
        label: 'Aspirar so o piso',
        effects: [
          { stat: 'power', delta: -2 },
          { stat: 'shielding', delta: -1 },
        ],
        outcome: {
          line: 'Parece limpo, vedacao segue suja.',
          why: 'O problema nunca foi a poeira no chao, e a que esta no sulco da porta. Limpar o que esta visivel e o erro classico de manutencao.',
          verdict: 'mixed',
        },
      },
      {
        id: 'skip',
        label: 'Deixar passar',
        effects: [
          { stat: 'oxygen', delta: -4 },
          { stat: 'shielding', delta: -2 },
        ],
        outcome: {
          line: 'Vedacao comprometida, ar escapando.',
          why: 'Poeira acumulada vira vazamento permanente na [[airlock]], e vazamento em sistema fechado nao se recupera.',
          verdict: 'bad',
        },
      },
    ],
  },
  {
    id: 'crew_fatigue',
    kind: 'conditional',
    role: 'basic',
    phase: 'night',
    requires: [{ stat: 'dose', op: 'gte', value: 25 }],
    title: 'Exame medico da tripulacao',
    text: 'A [[dose]] acumulada da tripulacao passou do limite planejado.',
    options: [
      {
        id: 'reduce_eva',
        label: 'Reduzir saidas por dois turnos',
        effects: [
          { stat: 'science', delta: -6 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Exposicao contida. Agenda cientifica atrasada.',
          why: 'A [[dose]] nunca diminui: so da para parar de somar. Menos [[eva]] e o unico freio disponivel, e ciencia na Lua depende de sair.',
          verdict: 'good',
        },
      },
      {
        id: 'keep_pace',
        label: 'Manter o ritmo da missao',
        effects: [
          { stat: 'dose', delta: 5 },
          { stat: 'science', delta: 3 },
        ],
        outcome: {
          line: 'Cronograma mantido, risco maior.',
          why: 'Limite de dose de radiacao existe porque o dano e estatistico e permanente. Cumprir prazo gastando saude da tripulacao nao e eficiencia, e divida.',
          verdict: 'bad',
        },
      },
      {
        id: 'shelter_time',
        label: 'Dobrar o tempo no abrigo central',
        requires: [{ stat: 'shielding', op: 'gte', value: 55 }],
        effects: [
          { stat: 'science', delta: -3 },
          { stat: 'power', delta: -4 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Mais horas protegidas, sem parar tudo.',
          why: 'Em vez de cortar trabalho, voce mudou onde a tripulacao descansa. Mesma missao, menos horas sob [[radiation]].',
          verdict: 'good',
        },
      },
    ],
  },

  // =========================================================================
  // RECURSO EXTRA - CIENCIA
  // =========================================================================
  {
    id: 'crater_12km',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'day',
    title: 'Cratera a 12 km',
    text: 'Anomalia magnetica no fundo de uma [[crater]] a 12 km da base.',
    options: [
      {
        id: 'rover_trip',
        label: 'Ir com o rover',
        effects: [
          { stat: 'science', delta: 11 },
          { stat: 'power', delta: -8 },
          { stat: 'food', delta: -2 },
          { stat: 'oxygen', delta: -3 },
          { stat: 'dose', delta: 3 },
        ],
        outcome: {
          line: 'Medicoes no local. Anomalia confirmada.',
          why: 'Medir no lugar e o unico jeito de separar sinal de artefato. Doze quilometros de ida e volta sao horas de [[eva]] e muita bateria.',
          verdict: 'good',
        },
      },
      {
        id: 'drone',
        label: 'Mandar o drone',
        effects: [
          { stat: 'science', delta: 6 },
          { stat: 'power', delta: -5 },
          { stat: 'dose', delta: 1 },
        ],
        outcome: {
          line: 'Dados aereos, sem amostra.',
          why: 'Drone mede campo e imagem, mas nao traz pedra. Sem amostra fisica, a descoberta fica em hipotese.',
          verdict: 'mixed',
        },
      },
      {
        id: 'orbital',
        label: 'Pedir passagem orbital',
        requires: [{ stat: 'power', op: 'gte', value: 25 }],
        effects: [
          { stat: 'science', delta: 3 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Imagem de orbita, resolucao baixa.',
          why: 'Orbita cobre area grande com detalhe pequeno. Serve para escolher onde ir depois, nao para concluir.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'meteorite_observed',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'day',
    title: 'Impacto fresco',
    text: 'Um [[micrometeoroid]] maior abriu uma marca nova a 4 km.',
    options: [
      {
        id: 'collect',
        label: 'Coletar amostra agora',
        effects: [
          { stat: 'science', delta: 10 },
          { stat: 'oxygen', delta: -4 },
          { stat: 'dose', delta: 2 },
          { stat: 'power', delta: -3 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Material de impacto recem exposto, coletado.',
          why: 'Rocha recem exposta ainda nao foi alterada pelo vento solar. Cada dia que passa degrada a assinatura quimica: aqui, rapido vale mais que seguro.',
          verdict: 'good',
        },
      },
      {
        id: 'photograph',
        label: 'Fotografar de longe',
        effects: [
          { stat: 'science', delta: 4 },
          { stat: 'power', delta: -2 },
        ],
        outcome: {
          line: 'Registro visual arquivado.',
          why: 'Foto documenta a geometria do impacto, nao a composicao. Voce guardou a pergunta sem a resposta.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'ice_sample',
    kind: 'conditional',
    role: 'extra',
    track: 'science',
    phase: 'day',
    requires: [{ stat: 'power', op: 'gte', value: 40 }],
    title: 'Gelo em sombra permanente',
    text: 'Ha agua congelada no fundo de uma [[permanent_shadow]].',
    options: [
      {
        id: 'descend',
        label: 'Descer ate o gelo',
        effects: [
          { stat: 'science', delta: 12 },
          { stat: 'power', delta: -9 },
          { stat: 'food', delta: -2 },
          { stat: 'oxygen', delta: -2 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Nucleo de gelo coletado a -180 C.',
          why: 'Esse gelo nunca viu o Sol: ele guarda o registro de bilhoes de anos. E tambem agua, ou seja, [[oxygen]] e combustivel futuros.',
          verdict: 'good',
        },
      },
      {
        id: 'shallow',
        label: 'Perfuracao rasa na borda',
        effects: [
          { stat: 'science', delta: 6 },
          { stat: 'power', delta: -5 },
        ],
        outcome: {
          line: 'Amostra da borda, mais contaminada.',
          why: 'A borda recebe luz indireta e perde volateis. Metade do custo, menos da metade do valor cientifico.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'seismometer_net',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'night',
    title: 'Rede de sismometros',
    text: 'Medir tremores lunares exige sensores espalhados.',
    options: [
      {
        id: 'full_net',
        label: 'Instalar quatro pontos',
        effects: [
          { stat: 'science', delta: 10 },
          { stat: 'power', delta: -6 },
          { stat: 'food', delta: -2 },
          { stat: 'oxygen', delta: -3 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Rede completa, triangulacao possivel.',
          why: 'Um sensor diz que tremeu. Quatro dizem onde e a que profundidade. Rede e o que transforma medida em mapa.',
          verdict: 'good',
        },
      },
      {
        id: 'two_points',
        label: 'Dois pontos perto da base',
        effects: [
          { stat: 'science', delta: 5 },
          { stat: 'power', delta: -3 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Detecta, mas nao localiza.',
          why: 'Com dois sensores proximos nao da para separar tremor profundo de tremor da propria base. Geometria importa tanto quanto o sensor.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'spectrometer',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'night',
    title: 'Analise de regolito',
    text: 'O espectrometro pode ler a composicao do [[regolith]] coletado.',
    options: [
      {
        id: 'long_run',
        label: 'Rodar a analise longa',
        effects: [
          { stat: 'science', delta: 9 },
          { stat: 'power', delta: -8 },
        ],
        outcome: {
          line: 'Espectro limpo, elementos raros identificados.',
          why: 'Tempo de integracao longo reduz ruido: o sinal cresce mais rapido que o erro. Por isso a noite, com equipamento parado, e o melhor momento.',
          verdict: 'good',
        },
      },
      {
        id: 'quick_run',
        label: 'Analise rapida',
        effects: [
          { stat: 'science', delta: 4 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Resultado com ruido alto.',
          why: 'Leitura curta confunde elemento raro com ruido do detector. Barato, porem inconclusivo: ciencia inconclusiva nao conta.',
          verdict: 'mixed',
        },
      },
    ],
  },

  // =========================================================================
  // RECURSO EXTRA - SUPORTE DE VIDA
  // =========================================================================
  {
    id: 'grow_module',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'day',
    title: 'Expandir o cultivo',
    text: 'Mais area de [[greenhouse]] significa [[life_support]] mais estavel.',
    options: [
      {
        id: 'full_expand',
        label: 'Expandir agora',
        effects: [
          { stat: 'lifeSupport', delta: 11 },
          { stat: 'power', delta: -2 },
          { stat: 'food', delta: -4 },
          { stat: 'oxygen', delta: -3 },
        ],
        outcome: {
          line: 'Area de cultivo dobrada.',
          why: 'Planta devolve [[oxygen]] e [[food]] ao mesmo tempo: ela fecha dois ciclos. O investimento sai do estoque de sementes e de muita [[power]].',
          verdict: 'good',
        },
      },
      {
        id: 'half_expand',
        label: 'Meia expansao',
        effects: [
          { stat: 'lifeSupport', delta: 6 },
          { stat: 'power', delta: -5 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Metade da area, metade do custo.',
          why: 'Expansao escala quase linear aqui, entao meia expansao e uma escolha honesta quando a [[power]] esta curta.',
          verdict: 'good',
        },
      },
      {
        id: 'prepare_bed',
        label: 'So preparar o leito',
        requires: [{ stat: 'food', op: 'gte', value: 50 }],
        effects: [
          { stat: 'lifeSupport', delta: 3 },
          { stat: 'food', delta: -3 },
        ],
        outcome: {
          line: 'Leito pronto, nada plantado.',
          why: 'Preparar substrato adianta trabalho futuro, mas leito vazio nao produz ar nem alimento. Infraestrutura sem operacao nao e sistema.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'water_loop',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'day',
    title: 'Fechar o loop de agua',
    text: 'Reciclar toda a agua da base, inclusive a suja.',
    options: [
      {
        id: 'closed_loop',
        label: 'Instalar o loop fechado',
        effects: [
          { stat: 'lifeSupport', delta: 12 },
          { stat: 'power', delta: -6 },
          { stat: 'oxygen', delta: -3 },
        ],
        outcome: {
          line: 'Mais de 90% da agua reaproveitada.',
          why: 'Na Estacao Espacial a tripulacao bebe a propria agua reciclada por isso: cada litro trazido da Terra custa uma fortuna. Loop fechado e o que torna a base independente.',
          verdict: 'good',
        },
      },
      {
        id: 'partial_loop',
        label: 'Loop parcial',
        effects: [
          { stat: 'lifeSupport', delta: 6 },
          { stat: 'power', delta: -5 },
        ],
        outcome: {
          line: 'Recicla a agua limpa apenas.',
          why: 'Reciclar so o facil resolve metade e deixa a parte que realmente escasseia de fora. O estoque segue caindo, mais devagar.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'generator_redundancy',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'night',
    title: 'Redundancia do gerador',
    text: 'A base depende de uma unica fonte de [[power]].',
    options: [
      {
        id: 'second_unit',
        label: 'Montar o segundo gerador',
        effects: [
          { stat: 'lifeSupport', delta: 10 },
          { stat: 'power', delta: -6 },
          { stat: 'shielding', delta: -2 },
        ],
        outcome: {
          line: 'Duas fontes independentes no ar.',
          why: 'Ponto unico de falha e o maior risco de qualquer base: se a fonte cair, [[oxygen]], calor e agua caem juntos. Redundancia custa caro e paga uma vez.',
          verdict: 'good',
        },
      },
      {
        id: 'cabling',
        label: 'So o cabeamento de transferencia',
        effects: [
          { stat: 'lifeSupport', delta: 5 },
          { stat: 'power', delta: -5 },
        ],
        outcome: {
          line: 'Pronto para receber a segunda fonte.',
          why: 'Cabo instalado reduz o tempo de recuperacao, mas nao elimina o ponto unico de falha. Meia redundancia ainda e dependencia.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'central_shelter',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'night',
    title: 'Ampliar o abrigo central',
    text: 'O [[central_shelter]] e pequeno para a tripulacao inteira.',
    options: [
      {
        id: 'regolith_expand',
        label: 'Ampliar com regolito',
        effects: [
          { stat: 'lifeSupport', delta: 9 },
          { stat: 'shielding', delta: 4 },
          { stat: 'oxygen', delta: -3 },
          { stat: 'power', delta: -5 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Abrigo maior e mais protegido.',
          why: 'Mesma obra resolve dois problemas: espaco para todos e mais massa contra [[radiation]]. Decisoes que atacam dois recursos de uma vez sao as melhores do jogo.',
          verdict: 'good',
        },
      },
      {
        id: 'rearrange',
        label: 'Reorganizar o espaco atual',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -2 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Cabe mais gente, sem mais protecao.',
          why: 'Organizacao e de graca e sempre vale. Mas quem define quanta [[radiation]] entra e a massa da parede, nao o layout.',
          verdict: 'mixed',
        },
      },
    ],
  },

  // =========================================================================
  // EVENTO FIXO DE CALENDARIO
  // =========================================================================
  {
    id: 'supply_capsule',
    kind: 'unique',
    role: 'event',
    phase: 'day',
    title: 'Capsula de suprimentos',
    text: 'A carga estacionada em orbita aguarda comando de descida.',
    options: [
      {
        id: 'basics',
        label: 'Priorizar suprimentos basicos',
        effects: [
          { stat: 'oxygen', delta: 15 },
          { stat: 'food', delta: 15 },
          { stat: 'power', delta: -12 },
        ],
        outcome: {
          line: 'Tanques e despensa reabastecidos.',
          why: 'A descida custa [[power]] para guiar e frear a capsula. Voce comprou folga de sobrevivencia e perdeu a chance desta janela para equipamento.',
          verdict: 'good',
        },
      },
      {
        id: 'modules',
        label: 'Priorizar modulos de pesquisa e habitat',
        effects: [
          { stat: 'science', delta: 9 },
          { stat: 'lifeSupport', delta: 9 },
          { stat: 'power', delta: -10 },
          { stat: 'food', delta: -4 },
        ],
        outcome: {
          line: 'Modulos no solo, despensa intacta.',
          why: 'Equipamento muda o que a base consegue fazer todos os dias; racao muda o que ela aguenta esta semana. A escolha certa depende de quanto tempo falta.',
          verdict: 'mixed',
        },
      },
      {
        id: 'split',
        label: 'Descida dividida',
        effects: [
          { stat: 'oxygen', delta: 7 },
          { stat: 'food', delta: 7 },
          { stat: 'science', delta: 5 },
          { stat: 'lifeSupport', delta: 5 },
          { stat: 'power', delta: -16 },
        ],
        outcome: {
          line: 'Duas descidas, consumo dobrado.',
          why: 'Dividir a carga exige duas manobras de frenagem, e frear custa quase o mesmo independente do peso. Nao concentrar foi a opcao mais cara.',
          verdict: 'mixed',
        },
      },
    ],
  },

  // =========================================================================
  // EXPANSAO DO POOL: medida pelo simulador, nao por intuicao.
  // Com 9 cards extra o pool secava no dia 5 e a vitoria por objetivo era
  // matematicamente impossivel (o trilho travava em ~77). Com 13 ela passa
  // a ser possivel e caríssima, que e o desenho pretendido.
  // =========================================================================
  {
    id: 'lava_tube',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'day',
    title: 'Tubo de lava',
    text: 'Um tubo de lava colapsado abre entrada a 3 km da base.',
    options: [
      {
        id: 'descend',
        label: 'Descer e mapear por dentro',
        effects: [
          { stat: 'science', delta: 11 },
          { stat: 'oxygen', delta: -4 },
          { stat: 'food', delta: -2 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Galeria de 200 m mapeada.',
          why: 'Tubo de lava e o abrigo natural mais cobicado da Lua: metros de rocha em cima param [[radiation]] e [[micrometeoroid]] de graca. Mapear por dentro e perigoso e vale muito.',
          verdict: 'good',
        },
      },
      {
        id: 'entrance_only',
        label: 'Mapear so a entrada',
        effects: [
          { stat: 'science', delta: 5 },
          { stat: 'oxygen', delta: -2 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Boca do tubo documentada.',
          why: 'A entrada diz o diametro, nao a extensao nem a estabilidade. Sem isso ninguem aprova instalar base la dentro.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'farside_radio',
    kind: 'unique',
    role: 'extra',
    track: 'science',
    phase: 'night',
    title: 'Radio-silencio',
    text: 'A base esta na janela de silencio de radio, longe do ruido da Terra.',
    options: [
      {
        id: 'long_obs',
        label: 'Observacao longa',
        effects: [
          { stat: 'science', delta: 10 },
          { stat: 'power', delta: -7 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Sinais de radio muito fracos registrados.',
          why: 'A Lua e o unico lugar perto da Terra onde o radio fica quieto: nossa propria civilizacao abafa esses sinais. A janela e curta e nao volta amanha.',
          verdict: 'good',
        },
      },
      {
        id: 'short_obs',
        label: 'Observacao curta',
        effects: [
          { stat: 'science', delta: 5 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Registro parcial da janela.',
          why: 'Em radioastronomia o sinal aparece somando horas de observacao. Metade do tempo nao da metade do resultado, da menos.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'oxygen_plant',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'day',
    title: 'Oxigenio do regolito',
    text: 'O forno pode arrancar [[oxygen]] do proprio [[regolith]] lunar.',
    options: [
      {
        id: 'full_batch',
        label: 'Rodar o forno completo',
        effects: [
          { stat: 'lifeSupport', delta: 11 },
          { stat: 'power', delta: -6 },
          { stat: 'shielding', delta: -3 },
        ],
        outcome: {
          line: 'Oxigenio extraido direto do solo.',
          why: 'Quase metade do peso do [[regolith]] e oxigenio preso em oxido. Mas o regolito que entra no forno e o mesmo que estava na parede: aqui [[life_support]] e [[shielding]] disputam o mesmo material.',
          verdict: 'good',
        },
      },
      {
        id: 'test_batch',
        label: 'Lote de teste',
        effects: [
          { stat: 'lifeSupport', delta: 5 },
          { stat: 'power', delta: -4 },
          { stat: 'shielding', delta: -1 },
        ],
        outcome: {
          line: 'Processo validado em pequena escala.',
          why: 'Validar antes de escalar evita gastar muito [[regolith]] num processo mal ajustado. Rende pouco e ensina o suficiente.',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'medical_bay',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'night',
    title: 'Enfermaria',
    text: 'Montar a enfermaria com monitor de [[dose]] por tripulante.',
    options: [
      {
        id: 'full_bay',
        label: 'Enfermaria completa',
        effects: [
          { stat: 'lifeSupport', delta: 10 },
          { stat: 'power', delta: -4 },
          { stat: 'oxygen', delta: -1 },
          { stat: 'food', delta: -2 },
        ],
        outcome: {
          line: 'Enfermaria operacional com dosimetria.',
          why: 'Medir a [[dose]] de cada pessoa muda a operacao: da para revezar quem sai e espalhar a exposicao. Sem medir, todo mundo paga igual.',
          verdict: 'good',
        },
      },
      {
        id: 'basic_kit',
        label: 'So o kit basico',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -2 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Primeiros socorros garantidos.',
          why: 'Kit resolve corte e queimadura, nao doenca de radiacao nem perda ossea. Cobre o urgente e deixa o cronico de fora.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'solar_tracking',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 3,
    title: 'Rastreamento dos paineis',
    text: 'Os [[solar_panel]] sairam do angulo otimo em relacao ao Sol.',
    options: [
      {
        id: 'recalibrate',
        label: 'Recalibrar o rastreamento',
        effects: [
          { stat: 'lifeSupport', delta: 1 },
          { stat: 'power', delta: 5 },
          { stat: 'oxygen', delta: -2 },
        ],
        outcome: {
          line: 'Paineis de volta ao angulo otimo.',
          why: 'Perto do equador lunar o Sol passa quase de lado: alguns graus de erro custam um quinto da [[power]]. Apontar bem e a melhoria mais barata que existe.',
          verdict: 'good',
        },
      },
      {
        id: 'fixed_angle',
        label: 'Fixar no angulo medio',
        effects: [
          { stat: 'power', delta: 4 },
          { stat: 'shielding', delta: -1 },
        ],
        outcome: {
          line: 'Solucao simples, rendimento medio.',
          why: 'Angulo fixo nao tem motor para quebrar, e isso tem valor. Mas voce desmontou o suporte para reaproveitar a chapa.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'battery_cycling',
    kind: 'routine',
    role: 'basic',
    phase: 'night',
    cooldownDays: 2,
    title: 'Equalizar as baterias',
    text: 'As celulas perderam sincronia e a carga util caiu.',
    options: [
      {
        id: 'full_cycle',
        label: 'Ciclo completo de equalizacao',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'power', delta: 4 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Banco de baterias equalizado.',
          why: 'Num banco, a celula mais fraca limita todas as outras. Equalizar nao cria [[power]]: devolve a capacidade que o desequilibrio escondia.',
          verdict: 'good',
        },
      },
      {
        id: 'partial_cycle',
        label: 'Ciclo parcial',
        effects: [{ stat: 'power', delta: 3 }],
        modifiers: [{ stat: 'power', perSlot: -1, slots: 2, label: 'Banco desequilibrado' }],
        outcome: {
          line: 'Metade do ganho, problema de volta.',
          why: 'Interromper a equalizacao no meio deixa o banco pior ordenado do que estava antes de comecar.',
          verdict: 'bad',
        },
      },
      {
        id: 'skip',
        label: 'Pular o ciclo',
        effects: [{ stat: 'power', delta: -4 }],
        outcome: {
          line: 'Capacidade util continuou caindo.',
          why: 'Bateria que nunca equaliza envelhece rapido e de forma irreversivel. Essa perda nao volta com manutencao depois.',
          verdict: 'bad',
        },
      },
    ],
  },
  {
    id: 'water_thaw',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Degelo das amostras',
    text: 'O gelo coletado tem que derreter sem perder os gases presos.',
    options: [
      {
        id: 'controlled',
        label: 'Degelo controlado, lento',
        effects: [
          { stat: 'lifeSupport', delta: 3 },
          { stat: 'power', delta: -4 },
          { stat: 'oxygen', delta: 5 },
        ],
        outcome: {
          line: 'Agua recuperada e gases capturados.',
          why: 'Derreter devagar deixa capturar os gases volateis antes de escaparem. Essa agua vira [[oxygen]] por [[electrolysis]] depois.',
          verdict: 'good',
        },
      },
      {
        id: 'fast',
        label: 'Degelo rapido',
        effects: [
          { stat: 'power', delta: -7 },
          { stat: 'oxygen', delta: 3 },
          { stat: 'science', delta: -2 },
        ],
        outcome: {
          line: 'Agua obtida, volateis perdidos.',
          why: 'Pressa gastou mais [[power]] e deixou escapar justamente a parte que carregava a informacao de bilhoes de anos.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'sample_curation',
    kind: 'unique',
    role: 'basic',
    phase: 'night',
    title: 'Curadoria de amostras',
    text: 'Amostra sem catalogo e sem contexto perde valor cientifico.',
    options: [
      {
        id: 'catalog_all',
        label: 'Catalogar tudo esta noite',
        effects: [
          { stat: 'science', delta: 4 },
          { stat: 'power', delta: -3 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Lote inteiro catalogado e lacrado.',
          why: 'Pedra sem a anotacao de onde saiu e so pedra. O contexto vale tanto quanto a amostra, e se perde em horas.',
          verdict: 'good',
        },
      },
      {
        id: 'catalog_main',
        label: 'Catalogar so as principais',
        effects: [
          { stat: 'science', delta: 2 },
          { stat: 'power', delta: -1 },
        ],
        outcome: {
          line: 'As melhores amostras registradas.',
          why: 'Triagem funciona quando voce sabe o que importa. Aqui ninguem sabe ainda: as amostras descartadas podem ser as interessantes.',
          verdict: 'mixed',
        },
      },
    ],
  },

  {
    id: 'waste_processing',
    kind: 'unique',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'day',
    title: 'Processar residuos',
    text: 'Nada pode ser lixo numa base: todo residuo volta para algum ciclo.',
    options: [
      {
        id: 'full_compost',
        label: 'Compostagem completa',
        effects: [
          { stat: 'lifeSupport', delta: 10 },
          { stat: 'power', delta: -1 },
          { stat: 'oxygen', delta: -3 },
          { stat: 'food', delta: -4 },
        ],
        outcome: {
          line: 'Residuo organico virou substrato da estufa.',
          why: 'Em sistema fechado nao existe lixo, existe insumo no lugar errado. Fechar o ciclo do residuo e o que permite a base crescer sem carga da Terra.',
          verdict: 'good',
        },
      },
      {
        id: 'separate_only',
        label: 'So separar e estocar',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -2 },
        ],
        outcome: {
          line: 'Residuo separado, ciclo nao fechado.',
          why: 'Separar e metade do trabalho e a metade que nao produz nada. Estoque de residuo ocupa volume, que e o recurso mais escasso de todos.',
          verdict: 'mixed',
        },
      },
    ],
  },

  {
    id: 'greenhouse_tending',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 2,
    title: 'Tratar a estufa',
    text: 'A [[greenhouse]] precisa de poda, rega e checagem de nutrientes.',
    options: [
      {
        id: 'full_tending',
        label: 'Trato completo',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'food', delta: 6 },
          { stat: 'power', delta: -4 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Plantas saudaveis, colheita no prazo.',
          why: 'Planta em [[gravity]] baixa cresce torta e a agua nao escorre do jeito esperado: sem alguem cuidando toda semana, a [[greenhouse]] para de produzir.',
          verdict: 'good',
        },
      },
      {
        id: 'minimal',
        label: 'So a rega minima',
        effects: [
          { stat: 'food', delta: 3 },
          { stat: 'power', delta: -2 },
        ],
        outcome: {
          line: 'Plantas vivas, rendimento menor.',
          why: 'Agua mantem vivo; nutriente e poda e que fazem render. Minimo viavel nao e minimo necessario.',
          verdict: 'mixed',
        },
      },
      {
        id: 'skip',
        label: 'Deixar para a semana que vem',
        effects: [{ stat: 'food', delta: -3 }],
        outcome: {
          line: 'Parte da producao se perdeu.',
          why: '[[food]] e o unico recurso que voce produz devagar e perde rapido. Uma semana sem trato custa mais do que uma semana de trabalho.',
          verdict: 'bad',
        },
      },
    ],
  },

  {
    id: 'regolith_topup',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    cooldownDays: 3,
    title: 'Repor a cobertura',
    text: 'A camada de [[regolith]] sobre a base afinou. Da para repor sacos.',
    options: [
      {
        id: 'topup_all',
        label: 'Repor a cobertura inteira',
        effects: [
          { stat: 'shielding', delta: 6 },
          { stat: 'oxygen', delta: -3 },
          { stat: 'power', delta: -2 },
          { stat: 'dose', delta: 2 },
        ],
        outcome: {
          line: 'Cobertura de volta na espessura de projeto.',
          why: 'A [[dose]] ja absorvida nunca desce: a unica coisa sob seu controle e quanta entra de amanha em diante. Repor [[shielding]] cedo vale muito mais que repor tarde.',
          verdict: 'good',
        },
      },
      {
        id: 'topup_quarters',
        label: 'Repor so sobre os dormitorios',
        effects: [
          { stat: 'shielding', delta: 3 },
          { stat: 'oxygen', delta: -1 },
          { stat: 'dose', delta: 1 },
        ],
        outcome: {
          line: 'Area de descanso reforcada.',
          why: 'Um terco do dia e passado dormindo: proteger o dormitorio cobre um terco da exposicao com pouco trabalho.',
          verdict: 'good',
        },
      },
      {
        id: 'postpone',
        label: 'Adiar a reposicao',
        effects: [{ stat: 'shielding', delta: -2 }],
        outcome: {
          line: 'A camada seguiu afinando.',
          why: 'Blindagem nao avisa quando acaba de proteger: ela so deixa passar um pouco mais por dia. O custo de adiar aparece dias depois, na [[dose]].',
          verdict: 'bad',
        },
      },
    ],
  },

  // =========================================================================
  // FALLBACKS - evitam travamento quando o pool seca. A telemetria do
  // simulador conta quantas vezes eles aparecem: muitos = faltam cards.
  // =========================================================================
  {
    id: 'quiet_day',
    kind: 'routine',
    role: 'basic',
    phase: 'day',
    isFallback: true,
    cooldownDays: 1,
    title: 'Turno sem ocorrencias',
    text: 'Nenhum alarme. A rotina da base consome recursos de todo jeito.',
    options: [
      {
        id: 'standard',
        label: 'Rotina padrao',
        effects: [
          { stat: 'power', delta: -2 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Turno tranquilo, consumo normal.',
          why: 'Mesmo sem acontecer nada, a base gasta: aquecer, filtrar, bombear. Nao existe custo zero em sistema fechado.',
          verdict: 'mixed',
        },
      },
      {
        id: 'rest',
        label: 'Turno de descanso',
        effects: [
          { stat: 'food', delta: -2 },
          { stat: 'science', delta: -1 },
        ],
        outcome: {
          line: 'Tripulacao descansada.',
          why: 'Descanso reduz erro humano, que e a maior causa de acidente em operacao espacial. Custa um turno de producao.',
          verdict: 'mixed',
        },
      },
    ],
  },
  {
    id: 'quiet_night',
    kind: 'routine',
    role: 'basic',
    phase: 'night',
    isFallback: true,
    cooldownDays: 1,
    title: 'Vigilia calma',
    text: 'Escotilhas fechadas, sistemas estaveis. A vigilia segue.',
    options: [
      {
        id: 'standard',
        label: 'Vigilia padrao',
        effects: [
          { stat: 'power', delta: -2 },
          { stat: 'oxygen', delta: -1 },
        ],
        outcome: {
          line: 'Noite sem ocorrencias.',
          why: 'Mesmo dormindo a tripulacao respira e a base aquece. Consumo noturno e menor, nunca nulo.',
          verdict: 'mixed',
        },
      },
      {
        id: 'checks',
        label: 'Rodar checagens extras',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'power', delta: -4 },
          { stat: 'food', delta: -1 },
        ],
        outcome: {
          line: 'Tudo conferido antes do amanhecer.',
          why: 'Checar sem motivo aparente e o que encontra a falha antes dela virar emergencia. Custa energia e nao da pontos.',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'data_review_day',
    kind: 'routine',
    role: 'extra',
    track: 'science',
    phase: 'day',
    isFallback: true,
    cooldownDays: 1,
    title: 'Revisar dados coletados',
    text: 'Sem alvo novo. Da para reprocessar o que ja foi medido.',
    options: [
      {
        id: 'light',
        label: 'Revisao leve',
        effects: [
          { stat: 'science', delta: 2 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Algumas inconsistencias corrigidas.',
          why: 'Reanalise encontra erro de calibracao sem sair da base. Rende pouco, mas rende: dado velho bem tratado ainda e dado.',
          verdict: 'mixed',
        },
      },
      {
        id: 'deep',
        label: 'Reprocessamento completo',
        effects: [
          { stat: 'science', delta: 4 },
          { stat: 'power', delta: -6 },
        ],
        outcome: {
          line: 'Serie temporal inteira recalculada.',
          why: 'Processar tudo de novo com a calibracao atual melhora todas as medidas de uma vez. Caro em [[power]], seguro em [[dose]].',
          verdict: 'good',
        },
      },
    ],
  },
  {
    id: 'systems_review_night',
    kind: 'routine',
    role: 'extra',
    track: 'lifeSupport',
    phase: 'night',
    isFallback: true,
    cooldownDays: 1,
    title: 'Revisar os sistemas',
    text: 'Sem obra planejada. Da para ajustar o que ja existe.',
    options: [
      {
        id: 'tuning',
        label: 'Ajuste fino dos setpoints',
        effects: [
          { stat: 'lifeSupport', delta: 2 },
          { stat: 'power', delta: -3 },
        ],
        outcome: {
          line: 'Sistemas um pouco mais eficientes.',
          why: 'Ajustar limites de operacao e a melhoria mais barata que existe: nenhum material novo, so medicao e paciencia.',
          verdict: 'mixed',
        },
      },
      {
        id: 'overhaul',
        label: 'Revisao completa de valvulas',
        effects: [
          { stat: 'lifeSupport', delta: 4 },
          { stat: 'power', delta: -6 },
        ],
        outcome: {
          line: 'Valvulas conferidas uma a uma.',
          why: 'Valvula travada e a falha mais comum em [[life_support]]. Revisar antes e o que separa manutencao de emergencia.',
          verdict: 'good',
        },
      },
    ],
  },
];
