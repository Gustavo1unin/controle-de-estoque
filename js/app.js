class EstoqueApp {
    constructor() {
        this.produtos = JSON.parse(localStorage.getItem('produtos')) || [];
        this.proximoId = Math.max(...this.produtos.map(p => p.id), 0) + 1 || 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderizar();
    }

    setupEventListeners() {
        // Formulário
        document.getElementById('produtoForm').addEventListener('submit', (e) => this.adicionarProduto(e));

        // Busca
        document.getElementById('searchInput').addEventListener('input', () => this.renderizar());

        // Botões
        document.getElementById('exportBtn').addEventListener('click', () => this.exportarCSV());
        document.getElementById('limparBtn').addEventListener('click', () => this.limparTodos());

        // Modal
        const modal = document.getElementById('editModal');
        const closeBtn = document.getElementsByClassName('close')[0];
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
        document.getElementById('editForm').addEventListener('submit', (e) => this.salvarEdicao(e));
    }

    adicionarProduto(e) {
        e.preventDefault();

        const nome = document.getElementById('nomeProduto').value.trim();
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const preco = parseFloat(document.getElementById('preco').value);
        const categoria = document.getElementById('categoria').value.trim();

        if (!nome || !quantidade || !preco || !categoria) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        const produto = {
            id: this.proximoId++,
            nome,
            quantidade,
            preco,
            categoria,
            dataCriacao: new Date().toLocaleDateString('pt-BR')
        };

        this.produtos.push(produto);
        this.salvarDados();
        this.renderizar();
        document.getElementById('produtoForm').reset();
    }

    editarProduto(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;

        document.getElementById('editId').value = id;
        document.getElementById('editNome').value = produto.nome;
        document.getElementById('editQuantidade').value = produto.quantidade;
        document.getElementById('editPreco').value = produto.preco;
        document.getElementById('editCategoria').value = produto.categoria;

        document.getElementById('editModal').style.display = 'block';
    }

    salvarEdicao(e) {
        e.preventDefault();

        const id = parseInt(document.getElementById('editId').value);
        const produto = this.produtos.find(p => p.id === id);

        if (produto) {
            produto.nome = document.getElementById('editNome').value;
            produto.quantidade = parseInt(document.getElementById('editQuantidade').value);
            produto.preco = parseFloat(document.getElementById('editPreco').value);
            produto.categoria = document.getElementById('editCategoria').value;

            this.salvarDados();
            this.renderizar();
            document.getElementById('editModal').style.display = 'none';
        }
    }

    deletarProduto(id) {
        if (confirm('Tem certeza que deseja deletar este produto?')) {
            this.produtos = this.produtos.filter(p => p.id !== id);
            this.salvarDados();
            this.renderizar();
        }
    }

    aumentarQuantidade(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (produto) {
            produto.quantidade++;
            this.salvarDados();
            this.renderizar();
        }
    }

    diminuirQuantidade(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (produto && produto.quantidade > 0) {
            produto.quantidade--;
            this.salvarDados();
            this.renderizar();
        }
    }

    renderizar() {
        const busca = document.getElementById('searchInput').value.toLowerCase();
        const produtosFiltrados = this.produtos.filter(p =>
            p.nome.toLowerCase().includes(busca) ||
            p.categoria.toLowerCase().includes(busca)
        );

        const tbody = document.getElementById('produtosBody');
        tbody.innerHTML = '';

        if (produtosFiltrados.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="8">Nenhum produto encontrado.</td></tr>';
        } else {
            produtosFiltrados.forEach(produto => {
                const total = produto.quantidade * produto.preco;
                let status = 'ok';
                if (produto.quantidade === 0) status = 'em-falta';
                else if (produto.quantidade < 5) status = 'baixo';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${produto.id}</td>
                    <td><strong>${produto.nome}</strong></td>
                    <td>${produto.categoria}</td>
                    <td>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="app.diminuirQuantidade(${produto.id})">−</button>
                            <span class="qty-display">${produto.quantidade}</span>
                            <button class="qty-btn" onclick="app.aumentarQuantidade(${produto.id})">+</button>
                        </div>
                    </td>
                    <td>R$ ${produto.preco.toFixed(2)}</td>
                    <td><strong>R$ ${total.toFixed(2)}</strong></td>
                    <td>
                        <span class="status-badge status-${status.replace('-', '_')}">
                            ${status === 'em-falta' ? '❌ Em falta' : status === 'baixo' ? '⚠️ Baixo' : '✅ OK'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-small" onclick="app.editarProduto(${produto.id})" style="background: #007bff; color: white; margin-right: 5px;">✏️ Editar</button>
                        <button class="btn btn-small btn-danger" onclick="app.deletarProduto(${produto.id})">🗑️ Deletar</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        this.atualizarResumo();
    }

    atualizarResumo() {
        const totalProdutos = this.produtos.length;
        const quantidadeTotal = this.produtos.reduce((sum, p) => sum + p.quantidade, 0);
        const valorTotal = this.produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);

        document.getElementById('totalProdutos').textContent = totalProdutos;
        document.getElementById('quantidadeTotal').textContent = quantidadeTotal;
        document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2)}`;
    }

    salvarDados() {
        localStorage.setItem('produtos', JSON.stringify(this.produtos));
    }

    exportarCSV() {
        if (this.produtos.length === 0) {
            alert('Nenhum produto para exportar!');
            return;
        }

        let csv = 'ID,Produto,Categoria,Quantidade,Preço,Total\n';
        this.produtos.forEach(p => {
            const total = p.quantidade * p.preco;
            csv += `${p.id},"${p.nome}","${p.categoria}",${p.quantidade},${p.preco.toFixed(2)},${total.toFixed(2)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    limparTodos() {
        if (confirm('Tem certeza que deseja deletar TODOS os produtos? Esta ação não pode ser desfeita!')) {
            this.produtos = [];
            this.proximoId = 1;
            this.salvarDados();
            this.renderizar();
        }
    }
}

// Inicializar a aplicação
const app = new EstoqueApp();

// Adicionar estilos inline para os controles de quantidade
const style = document.createElement('style');
style.textContent = `
    .qty-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .qty-btn {
        background: #667eea;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
    }
    
    .qty-btn:hover {
        background: #764ba2;
        transform: scale(1.1);
    }
    
    .qty-display {
        font-weight: bold;
        min-width: 40px;
        text-align: center;
    }
`;
document.head.appendChild(style);
