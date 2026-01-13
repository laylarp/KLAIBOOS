// ========== CONFIGURAÇÕES GLOBAIS ==========
let cart = [];
let cartCount = 0;
let salesData = {};
let currentFilter = 'all';
let wishlist = [];

const freeDeliveryZones = ['Mahotas', 'Costa de sol', 'Laulane', 'Albazine', 'T3', 'Zona verde', 'Benfica'];
const deliveryFee = 100;

// ========== ELEMENTOS DOM ==========
const booksGrid = document.getElementById('booksGrid');
const bestsellersGrid = document.getElementById('bestsellersGrid');
const cartIcon = document.getElementById('cartIcon');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartSummary = document.getElementById('cartSummary');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');
const checkoutOptions = document.getElementById('checkoutOptions');
const deliverySection = document.getElementById('deliverySection');
const whatsappBtn = document.getElementById('whatsappBtn');
const smsBtn = document.getElementById('smsBtn');
const emailBtn = document.getElementById('emailBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const getLocationBtn = document.getElementById('getLocationBtn');
const deliveryAddress = document.getElementById('deliveryAddress');
const wishlistIcon = document.getElementById('wishlistIcon');
const wishlistOverlay = document.getElementById('wishlistOverlay');
const closeWishlist = document.getElementById('closeWishlist');
const wishlistItems = document.getElementById('wishlistItems');
const emptyWishlistMessage = document.getElementById('emptyWishlistMessage');
const wishlistActions = document.getElementById('wishlistActions');
const clearWishlistBtn = document.getElementById('clearWishlist');
const bookOptionsModal = document.getElementById('bookOptionsModal');
const closeOptionsModal = document.getElementById('closeOptionsModal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// ========== FUNÇÕES DE INICIALIZAÇÃO ==========
function initializeApp() {
    loadSalesData();
    loadWishlist();
    loadCartFromStorage();
    renderBooks('all');
    renderBestsellers();
    setupEventListeners();
    updateCartCount();
    updateWishlistCount();
}

// ========== FUNÇÕES DE DADOS ==========
function loadSalesData() {
    const savedSalesData = localStorage.getItem('klaibooks_sales_data');
    if (savedSalesData) {
        salesData = JSON.parse(savedSalesData);
    } else {
        books.forEach(book => {
            salesData[book.id] = {
                sales: book.popular ? Math.floor(Math.random() * 50) + 30 : Math.floor(Math.random() * 20) + 5,
                views: Math.floor(Math.random() * 200) + 100,
                rating: 3.5 + Math.random() * 1.5
            };
        });
        saveSalesData();
    }
}

function saveSalesData() {
    localStorage.setItem('klaibooks_sales_data', JSON.stringify(salesData));
}

function loadWishlist() {
    const savedWishlist = localStorage.getItem('klaibooks_wishlist');
    if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
    }
}

function saveWishlist() {
    localStorage.setItem('klaibooks_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    renderWishlist();
}

function isInWishlist(bookId) {
    return wishlist.includes(bookId);
}

function toggleWishlist(bookId) {
    const index = wishlist.indexOf(bookId);
    if (index === -1) {
        wishlist.push(bookId);
        saveWishlist();
        showNotification('Livro adicionado à lista de desejos!', 'success');
        return true;
    } else {
        wishlist.splice(index, 1);
        saveWishlist();
        showNotification('Livro removido da lista de desejos', 'info');
        return false;
    }
}

function clearWishlist() {
    if (wishlist.length === 0) return;
    
    if (confirm('Tem certeza que deseja limpar toda a lista de desejos?')) {
        wishlist = [];
        saveWishlist();
        showNotification('Lista de desejos limpa', 'success');
    }
}

// ========== FUNÇÕES DE RENDERIZAÇÃO ==========
function renderBooks(filter, searchQuery = '') {
    if (!booksGrid) return;
    
    booksGrid.innerHTML = '';
    currentFilter = filter;
    
    let filteredBooks = [...books];
    
    // Aplicar filtro
    switch(filter) {
        case 'pdf':
            filteredBooks = books.filter(book => book.type === 'pdf');
            break;
        case 'fisico':
            filteredBooks = books.filter(book => book.type === 'fisico');
            break;
        case 'populares':
            filteredBooks = books.filter(book => book.popular);
            break;
        case 'promocao':
            filteredBooks = books.filter(book => book.promotion);
            break;
    }
    
    // Aplicar busca
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.category.toLowerCase().includes(query) ||
            book.description.toLowerCase().includes(query)
        );
    }
    
    // Ordenar por popularidade
    filteredBooks.sort((a, b) => {
        const salesA = salesData[a.id]?.sales || 0;
        const salesB = salesData[b.id]?.sales || 0;
        const ratingA = salesData[a.id]?.rating || 4.0;
        const ratingB = salesData[b.id]?.rating || 4.0;
        
        const scoreA = salesA * 10 + ratingA * 100;
        const scoreB = salesB * 10 + ratingB * 100;
        return scoreB - scoreA;
    });
    
    // Renderizar livros
    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhum livro encontrado${searchQuery ? ` para "${searchQuery}"` : ''}</p>
                ${searchQuery ? `<button class="cta-button secondary-btn" id="clearSearch">Limpar Busca</button>` : ''}
            </div>
        `;
        
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                renderBooks(filter);
            });
        }
        
        return;
    }
    
    filteredBooks.forEach(book => {
        const bookCard = createBookCard(book);
        booksGrid.appendChild(bookCard);
        registerView(book.id);
    });
}

function renderBestsellers() {
    if (!bestsellersGrid) return;
    
    bestsellersGrid.innerHTML = '';
    
    let bestsellers = [...books];
    
    // Ordenar por vendas
    bestsellers.sort((a, b) => {
        const salesA = salesData[a.id]?.sales || 0;
        const salesB = salesData[b.id]?.sales || 0;
        return salesB - salesA;
    });
    
    // Pegar apenas os top 8
    bestsellers = bestsellers.slice(0, 8);
    
    // Renderizar mais vendidos
    bestsellers.forEach((book, index) => {
        const bookCard = createBookCard(book, index + 1);
        bestsellersGrid.appendChild(bookCard);
    });
}

function createBookCard(book, rank = null) {
    const bookSales = salesData[book.id]?.sales || 0;
    const bookRating = salesData[book.id]?.rating || 4.0;
    const inWishlist = isInWishlist(book.id);
    const bookImage = bookImages[book.id] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.id = book.id;
    
    let badgesHTML = '';
    if (rank) {
        badgesHTML += `<span class="book-badge rank">#${rank}</span>`;
    }
    if (book.promotion) {
        badgesHTML += `<span class="book-badge promo">Promoção</span>`;
    }
    if (book.popular) {
        badgesHTML += `<span class="book-badge popular">Popular</span>`;
    }
    
    bookCard.innerHTML = `
        <div class="book-image-container">
            <img src="${bookImage}" alt="${book.title}" class="book-image" loading="lazy">
            ${badgesHTML}
            <button class="quick-view-btn" data-id="${book.id}">
                <i class="fas fa-eye"></i>
            </button>
        </div>
        
        <div class="book-content">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">
                <i class="fas fa-user"></i> ${book.author}
            </p>
            
            <div class="book-meta">
                <span><i class="fas fa-file"></i> ${book.pages}p</span>
                <span><i class="fas fa-tag"></i> ${book.category}</span>
                <span class="book-type ${book.type}">
                    <i class="fas fa-${book.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
                    ${book.type === 'pdf' ? 'PDF' : 'Físico'}
                </span>
            </div>
            
            <div class="book-rating">
                <div class="stars">
                    ${getStarRating(bookRating)}
                </div>
                <span class="rating-text">${bookSales} vendas</span>
            </div>
            
            <div class="book-footer">
                <div class="book-price">${book.price} MT</div>
                <div class="book-actions">
                    <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${book.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="add-to-cart" data-id="${book.id}">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return bookCard;
}

function renderWishlist() {
    if (!wishlistItems) return;
    
    wishlistItems.innerHTML = '';
    
    if (wishlist.length === 0) {
        emptyWishlistMessage.style.display = 'block';
        wishlistActions.style.display = 'none';
        return;
    }
    
    emptyWishlistMessage.style.display = 'none';
    wishlistActions.style.display = 'block';
    
    wishlist.forEach(bookId => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        
        const bookImage = bookImages[book.id] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
        
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        wishlistItem.dataset.id = book.id;
        
        wishlistItem.innerHTML = `
            <img src="${bookImage}" alt="${book.title}" class="wishlist-item-image">
            <div class="wishlist-item-details">
                <h4>${book.title}</h4>
                <p class="wishlist-item-author">${book.author}</p>
                <p class="wishlist-item-price">${book.price} MT</p>
                <p class="wishlist-item-type ${book.type}">
                    <i class="fas fa-${book.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
                    ${book.type === 'pdf' ? 'PDF' : 'Livro Físico'}
                </p>
            </div>
            <div class="wishlist-item-actions">
                <button class="move-to-cart" data-id="${book.id}">
                    <i class="fas fa-cart-plus"></i>
                </button>
                <button class="remove-from-wishlist" data-id="${book.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        wishlistItems.appendChild(wishlistItem);
    });
    
    // Adicionar eventos após renderizar
    setTimeout(() => {
        document.querySelectorAll('.remove-from-wishlist').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookId = parseInt(this.dataset.id);
                toggleWishlist(bookId);
            });
        });
        
        document.querySelectorAll('.move-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookId = parseInt(this.dataset.id);
                showBookOptions(bookId);
                wishlistOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        });
    }, 100);
}

function showBookOptions(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const bookImage = bookImages[book.id] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    
    let optionsHTML = '';
    
    if (book.type === 'pdf') {
        optionsHTML = `
            <div class="option-section">
                <h3>${book.title}</h3>
                <p class="option-subtitle">Escolha o formato do PDF</p>
                
                <div class="format-options">
                    <div class="format-option">
                        <input type="radio" id="format-a4" name="format" value="A4" checked>
                        <label for="format-a4">
                            <i class="fas fa-print"></i>
                            <span>Formato A4</span>
                            <small>Pronto para imprimir em casa</small>
                        </label>
                    </div>
                    <div class="format-option">
                        <input type="radio" id="format-a5" name="format" value="A5">
                        <label for="format-a5">
                            <i class="fas fa-print"></i>
                            <span>Formato A5</span>
                            <small>Tamanho reduzido</small>
                        </label>
                    </div>
                </div>
            </div>
        `;
    } else {
        optionsHTML = `
            <div class="option-section">
                <h3>${book.title}</h3>
                <p class="option-subtitle">Personalize seu livro físico</p>
                
                <div class="format-options">
                    <div class="format-option">
                        <input type="radio" id="format-comum" name="format" value="capa comum" checked>
                        <label for="format-comum">
                            <i class="fas fa-book"></i>
                            <span>Capa Comum</span>
                            <small>Capa padrão sem personalização</small>
                        </label>
                    </div>
                    <div class="format-option">
                        <input type="radio" id="format-personalizada" name="format" value="capa personalizada">
                        <label for="format-personalizada">
                            <i class="fas fa-gift"></i>
                            <span>Capa Personalizada</span>
                            <small>Com nome da criança (será impresso na capa)</small>
                        </label>
                    </div>
                </div>
                
                <div class="personalization-section" id="personalizationSection" style="display: none;">
                    <label for="childName">
                        <i class="fas fa-user"></i> Nome da criança:
                    </label>
                    <input type="text" id="childName" placeholder="Digite o nome para a capa" maxlength="30">
                    <small class="note">O nome será impresso na capa do livro</small>
                </div>
                
                <div class="quantity-section">
                    <label>Quantidade:</label>
                    <select class="quantity-select" id="quantitySelect">
                        <option value="1">1 unidade</option>
                        <option value="2">2 unidades</option>
                        <option value="3">3 unidades</option>
                        <option value="4">4 unidades</option>
                        <option value="5">5 unidades</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="book-options-content">
            <div class="book-options-image">
                <img src="${bookImage}" alt="${book.title}">
            </div>
            ${optionsHTML}
        </div>
        <div class="book-options-footer">
            <button class="cta-button secondary-btn cancel-options">Cancelar</button>
            <button class="cta-button primary-btn add-with-options" data-id="${book.id}">
                <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
            </button>
        </div>
    `;
    
    bookOptionsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Eventos do modal
    closeOptionsModal.addEventListener('click', closeBookOptions);
    
    const cancelOptionsBtn = document.querySelector('.cancel-options');
    if (cancelOptionsBtn) {
        cancelOptionsBtn.addEventListener('click', closeBookOptions);
    }
    
    const addWithOptionsBtn = document.querySelector('.add-with-options');
    if (addWithOptionsBtn) {
        addWithOptionsBtn.addEventListener('click', function() {
            const bookId = parseInt(this.dataset.id);
            addToCartWithOptions(bookId);
        });
    }
    
    // Mostrar/ocultar campo de personalização
    const personalizadaRadio = document.getElementById('format-personalizada');
    const comumRadio = document.getElementById('format-comum');
    const personalizationSection = document.getElementById('personalizationSection');
    
    if (personalizadaRadio && comumRadio && personalizationSection) {
        personalizadaRadio.addEventListener('change', () => {
            personalizationSection.style.display = 'block';
        });
        
        comumRadio.addEventListener('change', () => {
            personalizationSection.style.display = 'none';
        });
    }
    
    // Fechar ao clicar fora
    bookOptionsModal.addEventListener('click', function(e) {
        if (e.target === bookOptionsModal) {
            closeBookOptions();
        }
    });
}

function closeBookOptions() {
    bookOptionsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function addToCartWithOptions(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const format = document.querySelector('input[name="format"]:checked')?.value || 
                   (book.type === 'pdf' ? 'A4' : 'capa comum');
    
    let personalization = '';
    if (format === 'capa personalizada') {
        personalization = document.getElementById('childName')?.value.trim() || '';
        if (!personalization) {
            showNotification('Por favor, insira o nome da criança para personalização da capa.', 'error');
            return;
        }
    }
    
    const quantity = book.type === 'pdf' ? 1 : parseInt(document.getElementById('quantitySelect')?.value || '1');
    
    // Verificar compatibilidade
    const hasPDFInCart = cart.some(item => item.type === 'pdf');
    const hasPhysicalInCart = cart.some(item => item.type === 'fisico');
    
    if (book.type === 'pdf' && hasPhysicalInCart) {
        showNotification('PDFs não podem ser comprados juntamente com livros físicos. Faça pedidos separados.', 'error');
        return;
    }
    
    if (book.type === 'fisico' && hasPDFInCart) {
        showNotification('Livros físicos não podem ser comprados juntamente com PDFs. Faça pedidos separados.', 'error');
        return;
    }
    
    const cartItem = {
        id: bookId,
        title: book.title,
        type: book.type,
        format: format,
        personalization: personalization,
        quantity: quantity,
        price: book.price,
        author: book.author
    };
    
    // Verificar se já existe
    const existingIndex = cart.findIndex(item => 
        item.id === cartItem.id && 
        item.format === cartItem.format && 
        item.personalization === cartItem.personalization
    );
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += cartItem.quantity;
    } else {
        cart.push(cartItem);
    }
    
    registerSale(bookId, quantity);
    updateCart();
    saveCartToStorage();
    closeBookOptions();
    showNotification('Livro adicionado ao carrinho!', 'success');
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

// ========== FUNÇÕES DE CARRINHO ==========
function updateCart() {
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    updateCartCount();
    renderCartItems();
    updateCartSummary();
    updateDeliverySection();
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'flex' : 'none';
    }
}

function updateWishlistCount() {
    const wishlistCountElements = document.querySelectorAll('.wishlist-count');
    wishlistCountElements.forEach(element => {
        element.textContent = wishlist.length;
        element.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });
}

function renderCartItems() {
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        checkoutOptions.style.display = 'none';
        deliverySection.style.display = 'none';
        return;
    }
    
    emptyCartMessage.style.display = 'none';
    cartSummary.style.display = 'block';
    checkoutOptions.style.display = 'block';
    deliverySection.style.display = 'block';
    
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.index = index;
        
        const itemTotal = item.price * item.quantity;
        
        itemElement.innerHTML = `
            <div class="cart-item-image ${item.type}">
                <i class="fas fa-${item.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-options">
                    ${item.type === 'pdf' ? 'PDF' : 'Livro Físico'} | 
                    ${item.format}
                    ${item.personalization ? ` | Nome: ${item.personalization}` : ''}
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" data-action="decrease" data-index="${index}" ${item.type === 'pdf' ? 'disabled' : ''}>
                            -
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-index="${index}" ${item.type === 'pdf' ? 'disabled' : ''}>
                            +
                        </button>
                    </div>
                    <div class="item-total">${itemTotal} MT</div>
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        cartItems.appendChild(itemElement);
    });
    
    // Eventos
    setTimeout(() => {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const action = this.dataset.action;
                const item = cart[index];
                
                if (item.type === 'pdf') return;
                
                if (action === 'decrease' && item.quantity > 1) {
                    cart[index].quantity--;
                } else if (action === 'increase') {
                    cart[index].quantity++;
                } else if (action === 'decrease' && item.quantity === 1) {
                    cart.splice(index, 1);
                }
                
                updateCart();
                saveCartToStorage();
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                cart.splice(index, 1);
                updateCart();
                saveCartToStorage();
            });
        });
    }, 100);
}

function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    let shipping = 0;
    const hasPDF = cart.some(item => item.type === 'pdf');
    const hasPhysical = cart.some(item => item.type === 'fisico');
    
    if (hasPDF && !hasPhysical) {
        shipping = 0;
    } else if (hasPhysical) {
        const address = deliveryAddress.value.toLowerCase();
        const hasFreeDelivery = freeDeliveryZones.some(zone => 
            address.toLowerCase().includes(zone.toLowerCase())
        );
        
        if (address && !hasFreeDelivery) {
            shipping = deliveryFee;
        }
    }
    
    const total = subtotal + shipping;
    
    if (subtotalElement) subtotalElement.textContent = `${subtotal} MT`;
    if (shippingElement) shippingElement.textContent = `${shipping} MT`;
    if (totalElement) totalElement.textContent = `${total} MT`;
}

function updateDeliverySection() {
    const hasPDF = cart.some(item => item.type === 'pdf');
    const hasPhysical = cart.some(item => item.type === 'fisico');
    const deliveryInfo = document.querySelector('.delivery-info');
    
    if (!deliveryInfo) return;
    
    if (hasPDF && !hasPhysical) {
        deliveryInfo.innerHTML = `
            <p><i class="fas fa-download no-delivery"></i> <strong>PDF:</strong> Download instantâneo após pagamento. Sem frete.</p>
        `;
        const locationInput = document.querySelector('.location-input');
        if (locationInput) locationInput.style.display = 'none';
    } else if (hasPhysical) {
        deliveryInfo.innerHTML = `
            <p><i class="fas fa-check-circle free-delivery"></i> <strong>Entrega Grátis:</strong> ${freeDeliveryZones.join(', ')}</p>
            <p><i class="fas fa-truck"></i> <strong>Outros locais:</strong> Frete de ${deliveryFee} MT</p>
        `;
        const locationInput = document.querySelector('.location-input');
        if (locationInput) locationInput.style.display = 'flex';
    }
}

// ========== FUNÇÕES DE VENDAS ==========
function registerSale(bookId, quantity) {
    if (!salesData[bookId]) {
        salesData[bookId] = {
            sales: 0,
            views: 0,
            rating: 4.0
        };
    }
    
    salesData[bookId].sales += quantity;
    salesData[bookId].rating = Math.min(5, salesData[bookId].rating + (Math.random() * 0.1));
    saveSalesData();
}

function registerView(bookId) {
    if (!salesData[bookId]) {
        salesData[bookId] = {
            sales: 0,
            views: 0,
            rating: 4.0
        };
    }
    
    salesData[bookId].views += 1;
    saveSalesData();
}

// ========== FUNÇÕES DE CHECKOUT ==========
function createOrderMessage() {
    const name = document.getElementById('customerName')?.value.trim() || '';
    const phone = document.getElementById('customerPhone')?.value.trim() || '';
    const email = document.getElementById('customerEmail')?.value.trim() || '';
    const address = deliveryAddress?.value.trim() || '';
    
    const hasPDF = cart.some(item => item.type === 'pdf');
    const hasPhysical = cart.some(item => item.type === 'fisico');
    
    // Validações
    if (hasPhysical) {
        if (!name || !phone || !address) {
            showNotification('Para livros físicos, preencha nome, telefone e endereço.', 'error');
            return null;
        }
    } else if (hasPDF) {
        if (!name || !phone) { // Email NÃO é obrigatório
            showNotification('Para PDFs, preencha pelo menos nome e telefone.', 'error');
            return null;
        }
    } else {
        showNotification('Carrinho vazio.', 'error');
        return null;
    }
    
    let message = `📚 *PEDIDO KLAIBOOKS*\n\n`;
    message += `Cliente: ${name}\n`;
    message += `Telefone: ${phone}\n`;
    if (email) message += `Email: ${email}\n`;
    if (address) message += `Endereço: ${address}\n\n`;
    
    message += `*ITENS DO PEDIDO:*\n`;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        message += `\n${index + 1}. ${item.title}\n`;
        message += `   Tipo: ${item.type === 'pdf' ? '📄 PDF' : '📖 Físico'}\n`;
        message += `   Formato: ${item.format}\n`;
        if (item.personalization) message += `   Personalização: ${item.personalization}\n`;
        message += `   Quantidade: ${item.quantity}\n`;
        message += `   Preço: ${item.price} MT\n`;
        message += `   Subtotal: ${itemTotal} MT\n`;
    });
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    let shipping = 0;
    
    if (hasPhysical && !hasPDF) {
        const hasFreeDelivery = freeDeliveryZones.some(zone => 
            address.toLowerCase().includes(zone.toLowerCase())
        );
        if (!hasFreeDelivery) shipping = deliveryFee;
    }
    
    const total = subtotal + shipping;
    
    message += `\n*RESUMO:*\n`;
    message += `Subtotal: ${subtotal} MT\n`;
    message += `Frete: ${shipping} MT\n`;
    message += `*TOTAL: ${total} MT*\n\n`;
    
    if (hasPDF) {
        message += `📥 PDFs serão enviados para o email informado ou por WhatsApp.\n`;
    }
    message += `⏰ Pedido feito em: ${new Date().toLocaleString('pt-PT')}`;
    
    return { message, total };
}

function finalizeOrderWhatsApp() {
    const order = createOrderMessage();
    if (!order) return;
    
    const phoneNumber = "258855227420";
    const encodedMessage = encodeURIComponent(order.message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    showNotification('Abrindo WhatsApp...', 'success');
    
    cart = [];
    updateCart();
    saveCartToStorage();
}

function finalizeOrderSMS() {
    const order = createOrderMessage();
    if (!order) return;
    
    const phoneNumber = "855227420";
    const smsURL = `sms:${phoneNumber}?body=${encodeURIComponent(order.message)}`;
    
    window.location.href = smsURL;
    showNotification('Preparando SMS...', 'success');
    
    cart = [];
    updateCart();
    saveCartToStorage();
}

function finalizeOrderEmail() {
    const order = createOrderMessage();
    if (!order) return;
    
    const subject = `Pedido Klaibooks - ${document.getElementById('customerName')?.value || 'Cliente'}`;
    const emailURL = `mailto:xwatche@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(order.message)}`;
    
    window.location.href = emailURL;
    showNotification('Abrindo cliente de email...', 'success');
    
    cart = [];
    updateCart();
    saveCartToStorage();
}

// ========== FUNÇÕES UTILITÁRIAS ==========
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#2A9D8F' : type === 'error' ? '#E63946' : '#4A6FA5'};
        color: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: fadeIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function saveCartToStorage() {
    localStorage.setItem('klaibooks_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('klaibooks_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

function getCurrentLocation() {
    const hasPhysical = cart.some(item => item.type === 'fisico');
    if (!hasPhysical) {
        showNotification('Localização apenas necessária para livros físicos.', 'info');
        return;
    }
    
    if (!navigator.geolocation) {
        alert('Geolocalização não suportada pelo seu navegador');
        return;
    }
    
    showNotification('Obtendo localização...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const simulatedAddress = "Mahotas, Maputo";
            deliveryAddress.value = simulatedAddress;
            updateCartSummary();
            showNotification('Localização obtida com sucesso!', 'success');
        },
        (error) => {
            console.error('Erro ao obter localização:', error);
            showNotification('Não foi possível obter sua localização.', 'error');
        }
    );
}

// ========== PESQUISA ==========
function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
        renderBooks(currentFilter, query);
    } else {
        renderBooks(currentFilter);
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Menu mobile
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Fechar menu ao clicar em link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Carrinho
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                cartOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Lista de desejos
    if (wishlistIcon) {
        wishlistIcon.addEventListener('click', () => {
            wishlistOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeWishlist) {
        closeWishlist.addEventListener('click', () => {
            wishlistOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    if (wishlistOverlay) {
        wishlistOverlay.addEventListener('click', (e) => {
            if (e.target === wishlistOverlay) {
                wishlistOverlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', clearWishlist);
    }
    
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            renderBooks(filter, searchInput.value);
        });
    });
    
    // Pesquisa
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                renderBooks(currentFilter);
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Localização
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    if (deliveryAddress) {
        deliveryAddress.addEventListener('input', updateCartSummary);
    }
    
    // Checkout
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', finalizeOrderWhatsApp);
    }
    
    if (smsBtn) {
        smsBtn.addEventListener('click', finalizeOrderSMS);
    }
    
    if (emailBtn) {
        emailBtn.addEventListener('click', finalizeOrderEmail);
    }
    
    // Campos de cliente
    ['customerName', 'customerPhone', 'customerEmail'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCartSummary);
        }
    });
    
    // Event delegation para livros dinâmicos
    document.addEventListener('click', function(e) {
        // Botão lista de desejos
        if (e.target.closest('.wishlist-btn')) {
            const btn = e.target.closest('.wishlist-btn');
            const bookId = parseInt(btn.dataset.id);
            const wasAdded = toggleWishlist(bookId);
            
            if (wasAdded) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        
        // Botão adicionar ao carrinho
        if (e.target.closest('.add-to-cart')) {
            const btn = e.target.closest('.add-to-cart');
            const bookId = parseInt(btn.dataset.id);
            showBookOptions(bookId);
        }
        
        // Botão visualização rápida
        if (e.target.closest('.quick-view-btn')) {
            const btn = e.target.closest('.quick-view-btn');
            const bookId = parseInt(btn.dataset.id);
            showQuickView(bookId);
        }
    });
}

// ========== VISUALIZAÇÃO RÁPIDA ==========
function showQuickView(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const bookSales = salesData[book.id]?.sales || 0;
    const bookRating = salesData[book.id]?.rating || 4.0;
    const inWishlist = isInWishlist(book.id);
    const bookImage = bookImages[book.id] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    
    const modalHTML = `
        <div class="quick-view-overlay" id="quickViewModal">
            <div class="quick-view-modal">
                <button class="modal-close" id="closeQuickView">&times;</button>
                <div class="quick-view-content">
                    <div class="quick-view-image">
                        <img src="${bookImage}" alt="${book.title}">
                    </div>
                    <div class="quick-view-details">
                        <h2>${book.title}</h2>
                        <p class="author">por ${book.author}</p>
                        
                        <div class="rating-section">
                            <div class="stars">
                                ${getStarRating(bookRating)}
                            </div>
                            <span>${bookSales} vendas • ${bookRating.toFixed(1)}/5.0</span>
                        </div>
                        
                        <p class="description">${book.description}</p>
                        
                        <div class="details-grid">
                            <div class="detail">
                                <i class="fas fa-file"></i>
                                <span>${book.pages} páginas</span>
                            </div>
                            <div class="detail">
                                <i class="fas fa-language"></i>
                                <span>${book.language}</span>
                            </div>
                            <div class="detail">
                                <i class="fas fa-tag"></i>
                                <span>${book.category}</span>
                            </div>
                            <div class="detail">
                                <i class="fas fa-${book.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
                                <span>${book.type === 'pdf' ? 'PDF Digital' : 'Livro Físico'}</span>
                            </div>
                        </div>
                        
                        <div class="price-section">
                            <span class="price">${book.price} MT</span>
                            ${book.type === 'pdf' ? 
                                `<span class="pdf-note"><i class="fas fa-download"></i> Download instantâneo</span>` 
                                : ''}
                        </div>
                        
                        <div class="quick-view-actions">
                            <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${bookId}">
                                <i class="fas fa-heart"></i> ${inWishlist ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                            </button>
                            <button class="cta-button primary-btn buy-now" data-id="${bookId}">
                                <i class="fas fa-cart-plus"></i> Comprar Agora
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('quickViewModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Eventos do modal
    document.getElementById('closeQuickView').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
    
    // Botões dentro do modal
    setTimeout(() => {
        modal.querySelector('.wishlist-btn').addEventListener('click', function() {
            const bookId = parseInt(this.dataset.id);
            const wasAdded = toggleWishlist(bookId);
            
            if (wasAdded) {
                this.classList.add('active');
                this.innerHTML = '<i class="fas fa-heart"></i> Remover dos Favoritos';
            } else {
                this.classList.remove('active');
                this.innerHTML = '<i class="fas fa-heart"></i> Adicionar aos Favoritos';
            }
        });
        
        modal.querySelector('.buy-now').addEventListener('click', function() {
            const bookId = parseInt(this.dataset.id);
            modal.remove();
            document.body.style.overflow = 'auto';
            showBookOptions(bookId);
        });
    }, 100);
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', initializeApp);