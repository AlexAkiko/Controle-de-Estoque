document.addEventListener('DOMContentLoaded', () => {
    const formAdicionar = document.getElementById('form-adicionar');
    const produtoNomeInput = document.getElementById('produto-nome');
    const produtoQuantidadeInput = document.getElementById('produto-quantidade');
    const produtoUnidadeInput = document.getElementById('produto-unidade');
    const produtoPrecoInput = document.getElementById('produto-preco');

    const tabelaEstoque = document.getElementById('tabela-estoque').getElementsByTagName('tbody')[0];
    const tabelaCarrinho = document.getElementById('tabela-carrinho').getElementsByTagName('tbody')[0];
    const totalCompraSpan = document.getElementById('total-compra');
    const finalizarCompraBtn = document.getElementById('finalizar-compra');
    const filtroEstoqueInput = document.getElementById('filtro-estoque');
    const filtroCarrinhoInput = document.getElementById('filtro-carrinho');
    const limparEstoqueBtn = document.getElementById('limpar-estoque-btn');

    let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Define o limite crítico de estoque
    const LIMITE_CRITICO = 1;

    // Função para renderizar o estoque na tabela e verificar o limite crítico
    function renderizarEstoque() {
        tabelaEstoque.innerHTML = '';
        let produtosCriticos = [];

        estoque.forEach(produto => {
            const row = tabelaEstoque.insertRow();
            row.dataset.nome = produto.nome.toLowerCase();
            row.innerHTML = `
                <td>${produto.nome}</td>
                <td>${produto.quantidade} ${produto.unidade}</td>
                <td>R$ ${produto.preco.toFixed(2)}</td>
                <td>R$ ${(produto.quantidade * produto.preco).toFixed(2)}</td>
                <td>
                    <button class="acoes-btn" onclick="moverParaCarrinho('${produto.nome}', '${produto.unidade}')">Mover para Carrinho</button>
                    <button class="acoes-btn" onclick="removerDoEstoque('${produto.nome}', '${produto.unidade}')">Remover</button>
                </td>
            `;

            // Verifica se o produto atingiu o limite crítico
            if (produto.quantidade <= LIMITE_CRITICO) {
                produtosCriticos.push(`${produto.nome} (${produto.quantidade} ${produto.unidade})`);
                row.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'; // Fundo vermelho para destacar o item
            }
        });
        salvarDados();

        // Exibe o alerta se houver produtos no limite crítico
        if (produtosCriticos.length > 0) {
            alert(`ATENÇÃO! Os seguintes produtos estão com o estoque baixo:\n\n${produtosCriticos.join('\n')}`);
        }
    }

    // Função para renderizar o carrinho na tabela
    function renderizarCarrinho() {
        tabelaCarrinho.innerHTML = '';
        let totalCompra = 0;
        carrinho.forEach(item => {
            const row = tabelaCarrinho.insertRow();
            row.dataset.nome = item.nome.toLowerCase();
            totalCompra += item.quantidade * item.preco;
            row.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.quantidade} ${item.unidade}</td>
                <td>R$ ${item.preco.toFixed(2)}</td>
                <td>R$ ${(item.quantidade * item.preco).toFixed(2)}</td>
                <td>
                    <button class="acoes-btn" onclick="removerDoCarrinho('${item.nome}', '${item.unidade}')">Remover</button>
                </td>
            `;
        });
        totalCompraSpan.textContent = `R$ ${totalCompra.toFixed(2)}`;
        salvarDados();
    }

    // Função para salvar os dados no Local Storage
    function salvarDados() {
        localStorage.setItem('estoque', JSON.stringify(estoque));
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
    }

    // Adiciona um novo produto ao estoque
    formAdicionar.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = produtoNomeInput.value;
        const quantidade = parseInt(produtoQuantidadeInput.value);
        const unidade = produtoUnidadeInput.value;
        const preco = parseFloat(produtoPrecoInput.value);

        const produtoExistente = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase() && p.unidade === unidade);

        if (produtoExistente) {
            produtoExistente.quantidade += quantidade;
        } else {
            estoque.push({ nome, quantidade, unidade, preco });
        }

        formAdicionar.reset();
        renderizarEstoque();
    });

    // Move um produto do estoque para o carrinho
    window.moverParaCarrinho = (nomeProduto, unidadeProduto) => {
        const produto = estoque.find(p => p.nome === nomeProduto && p.unidade === unidadeProduto);
        if (!produto) return;

        const itemCarrinho = carrinho.find(item => item.nome === nomeProduto && item.unidade === unidadeProduto);

        const quantidadeParaMover = parseInt(prompt(`Quantas ${produto.unidade} de ${produto.nome} você deseja mover para o carrinho? (Disponível: ${produto.quantidade})`));

        if (isNaN(quantidadeParaMover) || quantidadeParaMover <= 0 || quantidadeParaMover > produto.quantidade) {
            alert('Quantidade inválida ou insuficiente no estoque.');
            return;
        }

        if (itemCarrinho) {
            itemCarrinho.quantidade += quantidadeParaMover;
        } else {
            carrinho.push({ nome: produto.nome, quantidade: quantidadeParaMover, unidade: produto.unidade, preco: produto.preco });
        }

        produto.quantidade -= quantidadeParaMover;

        if (produto.quantidade <= 0) {
            estoque = estoque.filter(p => p.nome !== nomeProduto || p.unidade !== unidadeProduto);
        }

        renderizarEstoque();
        renderizarCarrinho();
    };

    // Remove um produto do estoque
    window.removerDoEstoque = (nomeProduto, unidadeProduto) => {
        estoque = estoque.filter(produto => produto.nome !== nomeProduto || produto.unidade !== unidadeProduto);
        renderizarEstoque();
    };

    // Remove um item do carrinho e o devolve ao estoque
    window.removerDoCarrinho = (nomeItem, unidadeItem) => {
        const item = carrinho.find(i => i.nome === nomeItem && i.unidade === unidadeItem);
        if (!item) return;

        const produtoNoEstoque = estoque.find(p => p.nome === nomeItem && p.unidade === unidadeItem);

        if (produtoNoEstoque) {
            produtoNoEstoque.quantidade += item.quantidade;
        } else {
            estoque.push({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, preco: item.preco });
        }

        carrinho = carrinho.filter(i => i.nome !== nomeItem || i.unidade !== unidadeItem);
        renderizarCarrinho();
        renderizarEstoque();
    };

    // Finaliza a compra e limpa o carrinho
    finalizarCompraBtn.addEventListener('click', () => {
        if (carrinho.length > 0) {
            alert('Compra finalizada com sucesso! O carrinho foi esvaziado.');
            carrinho = [];
            renderizarCarrinho();
        } else {
            alert('O carrinho está vazio.');
        }
    });

    // Filtra a tabela de estoque
    filtroEstoqueInput.addEventListener('keyup', (e) => {
        const termo = e.target.value.toLowerCase();
        const linhas = tabelaEstoque.querySelectorAll('tr');
        linhas.forEach(linha => {
            const nomeProduto = linha.dataset.nome;
            linha.style.display = nomeProduto.includes(termo) ? '' : 'none';
        });
    });

    // Filtra a tabela do carrinho
    filtroCarrinhoInput.addEventListener('keyup', (e) => {
        const termo = e.target.value.toLowerCase();
        const linhas = tabelaCarrinho.querySelectorAll('tr');
        linhas.forEach(linha => {
            const nomeProduto = linha.dataset.nome;
            linha.style.display = nomeProduto.includes(termo) ? '' : 'none';
        });
    });

    // Limpa o estoque
    limparEstoqueBtn.addEventListener('click', () => {
        const confirmacao = confirm('Tem certeza que deseja limpar todo o estoque? Esta ação não pode ser desfeita.');
        if (confirmacao) {
            estoque = [];
            renderizarEstoque();
            alert('Estoque limpo com sucesso!');
        }
    });

    // Renderiza as tabelas quando a página carrega
    renderizarEstoque();
    renderizarCarrinho();
});