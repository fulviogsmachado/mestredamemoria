document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const telaInicial = document.getElementById('tela-inicial');
    const telaJogo = document.getElementById('tela-jogo');
    const telaFim = document.getElementById('tela-fim');
    const btnIniciar = document.getElementById('btn-iniciar');
    const btnNovoJogo = document.getElementById('btn-novo-jogo');
    const btnsTempos = document.querySelectorAll('.btn-tempo');
    const pontuacaoElement = document.getElementById('pontuacao');
    const tempoElement = document.getElementById('tempo');
    const pontuacaoFinalElement = document.getElementById('pontuacao-final');
    const imagemJogador = document.getElementById('imagem-jogador');
    const nomeJogador = document.getElementById('nome-jogador');
    const celulas = document.querySelectorAll('.celula');
    const imagensOpcoes = document.querySelectorAll('.imagem-opcao');

    // Variáveis do jogo
    let jogadores = [];
    let jogadorAtual = null;
    let respostaCorreta = null;
    let pontuacao = 0;
    let tempoTotal = 60; // Padrão: 1 minuto
    let tempoRestante = 0;
    let temporizador = null;
    let categorias = ['clube', 'nacionalidade', 'campeonato', 'treinador', 'liga'];

    // Carregar dados dos jogadores
    async function carregarJogadores() {
        try {
            // Inicializar array vazio
            jogadores = [];
            
            // Carregar dados do arquivo JSON
            try {
                const response = await fetch('questions.json');
                const data = await response.json();
                if (data && data.jogadores && data.jogadores.length > 0) {
                    jogadores = data.jogadores;
                    console.log('Jogadores carregados do arquivo:', jogadores.length);
                } else {
                    throw new Error('Formato de dados inválido');
                }
            } catch (e) {
                console.error('Erro ao carregar jogadores do arquivo:', e);
                // Fallback para dados mínimos em caso de erro
                jogadores = [
                    {
                        "id": 1,
                        "nome": "Neymar Jr.",
                        "imagem": "https://upload.wikimedia.org/wikipedia/commons/8/83/Neymar_PSG.jpg",
                        "respostas": [
                            {
                                "categoria": "clube",
                                "valor": "Al-Hilal",
                                "imagem": "https://upload.wikimedia.org/wikipedia/en/a/a9/Al_Hilal_SFC_logo.png"
                            }
                        ]
                    }
                ];
                console.log('Usando dados de fallback');
            }
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
        }
    }

    // Inicializar o jogo
    async function iniciarJogo() {
        // Verificar se os jogadores já foram carregados
        if (jogadores.length === 0) {
            await carregarJogadores();
        }

        // Resetar pontuação
        pontuacao = 0;
        pontuacaoElement.textContent = pontuacao;

        // Iniciar temporizador
        tempoRestante = tempoTotal;
        atualizarTempo();
        if (temporizador) {
            clearInterval(temporizador);
        }
        temporizador = setInterval(() => {
            tempoRestante--;
            atualizarTempo();
            
            if (tempoRestante <= 0) {
                finalizarJogo();
            }
        }, 1000);

        // Mostrar tela de jogo
        telaInicial.classList.add('escondido');
        telaJogo.classList.remove('escondido');
        telaFim.classList.add('escondido');

        // Carregar primeira pergunta
        carregarPergunta();
    }

    // Atualizar exibição do tempo
    function atualizarTempo() {
        const minutos = Math.floor(tempoRestante / 60);
        const segundos = tempoRestante % 60;
        tempoElement.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }

    // Carregar uma nova pergunta
    function carregarPergunta() {
        // Selecionar jogador aleatório
        const indiceJogador = Math.floor(Math.random() * jogadores.length);
        jogadorAtual = jogadores[indiceJogador];

        // Exibir jogador
        imagemJogador.src = jogadorAtual.imagem;
        nomeJogador.textContent = jogadorAtual.nome;

        // Selecionar categoria aleatória para a resposta correta
        const categoriaIndex = Math.floor(Math.random() * jogadorAtual.respostas.length);
        respostaCorreta = jogadorAtual.respostas[categoriaIndex];

        // Criar opções para a cartela (incluindo a resposta correta)
        const opcoesCartela = [];
        
        // Adicionar resposta correta
        opcoesCartela.push({
            imagem: respostaCorreta.imagem,
            correta: true
        });

        // Adicionar respostas incorretas (de outros jogadores)
        const respostasIncorretas = [];
        
        // Coletar todas as respostas possíveis de outros jogadores
        jogadores.forEach((jogador, idx) => {
            if (idx !== indiceJogador) { // Não incluir o jogador atual
                jogador.respostas.forEach(resposta => {
                    // Verificar se a resposta já não é a correta (mesmo valor e categoria)
                    if (resposta.valor !== respostaCorreta.valor || resposta.categoria !== respostaCorreta.categoria) {
                        respostasIncorretas.push({
                            imagem: resposta.imagem,
                            correta: false
                        });
                    }
                });
            }
        });

        // Embaralhar respostas incorretas e selecionar 8
        embaralharArray(respostasIncorretas);
        const respostasIncorretasSelecionadas = respostasIncorretas.slice(0, 8);
        
        // Adicionar as 8 respostas incorretas à cartela
        opcoesCartela.push(...respostasIncorretasSelecionadas);

        // Embaralhar todas as opções
        embaralharArray(opcoesCartela);

        // Preencher cartela
        celulas.forEach((celula, index) => {
            const opcao = opcoesCartela[index];
            const imagemOpcao = celula.querySelector('.imagem-opcao');
            
            imagemOpcao.src = opcao.imagem;
            celula.dataset.correta = opcao.correta;
            celula.classList.remove('correta', 'incorreta');
        });
    }

    // Embaralhar array (algoritmo Fisher-Yates)
    function embaralharArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Verificar resposta
    function verificarResposta(celula) {
        const estaCorreta = celula.dataset.correta === 'true';
        
        if (estaCorreta) {
            // Resposta correta
            celula.classList.add('correta');
            pontuacao += 10;
            pontuacaoElement.textContent = pontuacao;
            
            // Aguardar um pouco antes de carregar nova pergunta
            setTimeout(() => {
                carregarPergunta();
            }, 1000);
        } else {
            // Resposta incorreta
            celula.classList.add('incorreta');
            
            // Mostrar qual era a resposta correta
            celulas.forEach(c => {
                if (c.dataset.correta === 'true') {
                    c.classList.add('correta');
                }
            });
            
            // Aguardar um pouco antes de carregar nova pergunta
            setTimeout(() => {
                carregarPergunta();
            }, 1500);
        }
    }

    // Finalizar o jogo
    function finalizarJogo() {
        // Parar temporizador
        if (temporizador) {
            clearInterval(temporizador);
            temporizador = null;
        }
        
        // Atualizar pontuação final
        pontuacaoFinalElement.textContent = pontuacao;
        
        // Mostrar tela de fim de jogo
        telaJogo.classList.add('escondido');
        telaFim.classList.remove('escondido');
    }

    // Event Listeners
    btnIniciar.addEventListener('click', iniciarJogo);
    btnNovoJogo.addEventListener('click', iniciarJogo);
    
    // Seleção de tempo
    btnsTempos.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover seleção anterior
            btnsTempos.forEach(b => b.classList.remove('selecionado'));
            
            // Adicionar seleção atual
            btn.classList.add('selecionado');
            
            // Atualizar tempo total
            tempoTotal = parseInt(btn.dataset.tempo);
        });
    });
    
    // Selecionar tempo padrão (1 minuto)
    document.querySelector('[data-tempo="60"]').classList.add('selecionado');
    
    // Clique nas células da cartela
    celulas.forEach(celula => {
        celula.addEventListener('click', () => {
            // Só permitir clique se o jogo estiver em andamento
            if (!telaJogo.classList.contains('escondido') && !celula.classList.contains('correta') && !celula.classList.contains('incorreta')) {
                verificarResposta(celula);
            }
        });
    });

    // Carregar jogadores ao iniciar
    carregarJogadores();
});
