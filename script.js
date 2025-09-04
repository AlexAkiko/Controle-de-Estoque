document.addEventListener('DOMContentLoaded', () => {
    const formAdicionar = document.getElementById('form-adicionar');
    const produtoNomeInput = document.getElementById('produto-nome');
    const produtoQuantidadeInput = document.getElementById('produto-quantidade');
    const produtoPrecoInput = document.getElementById('produto-preco');

    const tabelaEstoque = document.getElementById('tabela-estoque').getElementsByTagName('tbody')[0];
    const tabelaCarrinho = document.getElementById('tabela-carrinho').getElementsByTagName('tbody')[0];
    const totalCompraSpan = document.getElementById('total-compra');
    const finalizarCompraBtn = document.getElementById('finalizar-compra');
    const filtroEstoqueInput = document.getElementById('filtro-estoque');
    const filtroCarrinhoInput = document.getElementById('filtro-carrinho');

    let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Função para renderizar o estoque na tabela
    function renderizarEstoque() {
        tabelaEstoque.innerHTML = '';
        estoque.forEach(produto => {
            const row = tabelaEstoque.insertRow();
            row.dataset.nome = produto.nome.toLowerCase(); // Adiciona um atributo para o filtro
            row.innerHTML = `
                <td>${produto.nome}</td>
                <td>${produto.quantidade}</td>
                <td>R$ ${produto.preco.toFixed(2)}</td>
                <td>R$ ${(produto.quantidade * produto.preco).toFixed(2)}</td>
                <td>
                    <button class="acoes-btn" onclick="moverParaCarrinho('${produto.nome}')">Mover para Carrinho</button>
                    <button class="acoes-btn" onclick="removerDoEstoque('${produto.nome}')">Remover</button>
                </td>
            `;
        });
        salvarDados();
    }

    // Função para renderizar o carrinho na tabela
    function renderizarCarrinho() {
        tabelaCarrinho.innerHTML = '';
        let totalCompra = 0;
        carrinho.forEach(item => {
            const row = tabelaCarrinho.insertRow();
            row.dataset.nome = item.nome.toLowerCase(); // Adiciona um atributo para o filtro
            totalCompra += item.quantidade * item.preco;
            row.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.preco.toFixed(2)}</td>
                <td>R$ ${(item.quantidade * item.preco).toFixed(2)}</td>
                <td>
                    <button class="acoes-btn" onclick="removerDoCarrinho('${item.nome}')">Remover</button>
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
        const preco = parseFloat(produtoPrecoInput.value);

        const produtoExistente = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

        if (produtoExistente) {
            produtoExistente.quantidade += quantidade;
        } else {
            estoque.push({ nome, quantidade, preco });
        }

        formAdicionar.reset();
        renderizarEstoque();
    });

    // Move um produto do estoque para o carrinho
    window.moverParaCarrinho = (nomeProduto) => {
        const produto = estoque.find(p => p.nome === nomeProduto);
        if (!produto) return;

        const itemCarrinho = carrinho.find(item => item.nome === nomeProduto);
        if (itemCarrinho) {
            itemCarrinho.quantidade++;
        } else {
            carrinho.push({ nome: produto.nome, quantidade: 1, preco: produto.preco });
        }

        produto.quantidade--;
        if (produto.quantidade <= 0) {
            estoque = estoque.filter(p => p.nome !== nomeProduto);
        }

        renderizarEstoque();
        renderizarCarrinho();
    };

    // Remove um produto do estoque
    window.removerDoEstoque = (nomeProduto) => {
        estoque = estoque.filter(produto => produto.nome !== nomeProduto);
        renderizarEstoque();
    };

    // Remove um item do carrinho e o devolve ao estoque
    window.removerDoCarrinho = (nomeItem) => {
        const item = carrinho.find(i => i.nome === nomeItem);
        if (!item) return;

        const produtoNoEstoque = estoque.find(p => p.nome === nomeItem);

        if (produtoNoEstoque) {
            produtoNoEstoque.quantidade += item.quantidade;
        } else {
            estoque.push({ nome: item.nome, quantidade: item.quantidade, preco: item.preco });
        }

        carrinho = carrinho.filter(i => i.nome !== nomeItem);
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

    // Renderiza as tabelas quando a página carrega
    renderizarEstoque();
    renderizarCarrinho();
});