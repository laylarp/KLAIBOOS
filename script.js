// ========== CONFIGURAÇÕES GLOBAIS ==========
let cart = [];
let cartCount = 0;
let salesData = {};
let currentSort = 'popularidade';
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
const sortBtns = document.querySelectorAll('.sort-btn');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const getLocationBtn = document.getElementById('getLocationBtn');
const deliveryAddress = document.getElementById('deliveryAddress');

// ========== FUNÇÕES DE INICIALIZAÇÃO ==========
function initializeApp() {
    loadSalesData();
    loadWishlist();
    loadCartFromStorage();
    renderBooks('all', 'popularidade');
    renderBestsellers('mais-vendidos');
    setupEventListeners();
    updateCartCount();
    updateStats();
}

// ========== FUNÇÕES DE DADOS ==========
function loadSalesData() {
    const savedSalesData = localStorage.getItem('klaibooks_sales_data');
    if (savedSalesData) {
        salesData = JSON.parse(savedSalesData);
    } else {
        // Dados iniciais
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
}

function isInWishlist(bookId) {
    return wishlist.includes(bookId);
}

function toggleWishlist(bookId) {
    const index = wishlist.indexOf(bookId);
    if (index === -1) {
        wishlist.push(bookId);
        saveWishlist();
        return true;
    } else {
        wishlist.splice(index, 1);
        saveWishlist();
        return false;
    }
}

// ========== FUNÇÕES DE RENDERIZAÇÃO ==========
function renderBooks(filter, sortBy = 'popularidade') {
    if (!booksGrid) return;
    
    booksGrid.innerHTML = '';
    currentSort = sortBy;
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
    
    // Aplicar ordenação
    filteredBooks.sort((a, b) => {
        const salesA = salesData[a.id]?.sales || 0;
        const salesB = salesData[b.id]?.sales || 0;
        const ratingA = salesData[a.id]?.rating || 4.0;
        const ratingB = salesData[b.id]?.rating || 4.0;
        
        switch(sortBy) {
            case 'popularidade':
                const scoreA = salesA * 10 + ratingA * 100;
                const scoreB = salesB * 10 + ratingB * 100;
                return scoreB - scoreA;
            case 'preco-crescente':
                return a.price - b.price;
            case 'preco-decrescente':
                return b.price - a.price;
            case 'mais-vendidos':
                return salesB - salesA;
            default:
                return 0;
        }
    });
    
    // Renderizar livros
    filteredBooks.forEach(book => {
        const bookCard = createBookCard(book, false);
        booksGrid.appendChild(bookCard);
        registerView(book.id);
    });
    
    updateSectionTitle(filter);
}

function renderBestsellers(sortBy = 'mais-vendidos') {
    if (!bestsellersGrid) return;
    
    bestsellersGrid.innerHTML = '';
    
    let bestsellers = [...books];
    
    // Aplicar ordenação
    bestsellers.sort((a, b) => {
        const salesA = salesData[a.id]?.sales || 0;
        const salesB = salesData[b.id]?.sales || 0;
        
        switch(sortBy) {
            case 'mais-vendidos':
                return salesB - salesA;
            case 'popularidade':
                return (salesB * 10) - (salesA * 10);
            case 'preco-crescente':
                return a.price - b.price;
            case 'preco-decrescente':
                return b.price - a.price;
            default:
                return salesB - salesA;
        }
    });
    
    // Pegar apenas os top 4
    bestsellers = bestsellers.slice(0, 4);
    
    // Renderizar mais vendidos
    bestsellers.forEach((book, index) => {
        const bookCard = createBookCard(book, true, index + 1);
        bestsellersGrid.appendChild(bookCard);
    });
}

function createBookCard(book, isBestseller = false, rank = null) {
    const bookSales = salesData[book.id]?.sales || 0;
    const bookRating = salesData[book.id]?.rating || 4.0;
    const inWishlist = isInWishlist(book.id);
    const bookImage = bookImages[book.id] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    const isBestsellerBook = bookSales > 30;
    
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.id = book.id;
    
    // Badges dinâmicos
    let badgesHTML = `
        <div class="book-badges">
            <div class="book-badge badge-${book.type}">
                <i class="fas fa-${book.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
                ${book.type === 'pdf' ? 'PDF' : 'Físico'}
            </div>
    `;
    
    if (isBestsellerBook) {
        badgesHTML += `
            <div class="book-badge badge-bestseller">
                <i class="fas fa-crown"></i> Mais Vendido
            </div>
        `;
    }
    
    if (book.promotion) {
        badgesHTML += `
            <div class="book-badge badge-promo">
                <i class="fas fa-tag"></i> Promoção
            </div>
        `;
    }
    
    if (book.popular && !isBestsellerBook) {
        badgesHTML += `
            <div class="book-badge badge-new">
                <i class="fas fa-star"></i> Popular
            </div>
        `;
    }
    
    if (isBestseller && rank) {
        badgesHTML += `
            <div class="book-badge badge-rank">
                <i class="fas fa-trophy"></i> Top ${rank}
            </div>
        `;
    }
    
    badgesHTML += `</div>`;
    
    bookCard.innerHTML = `
        <div class="book-image-container">
            <img src="${bookImage}" alt="${book.title}" class="book-image" loading="lazy">
            ${badgesHTML}
            <div class="book-overlay">
                <button class="quick-view-btn" data-id="${book.id}">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
            </div>
        </div>
        
        <div class="book-content">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">
                <i class="fas fa-user-edit"></i> ${book.author}
            </p>
            
            <p class="book-description">${book.description}</p>
            
            <div class="book-meta">
                <span><i class="fas fa-file-alt"></i> ${book.pages} págs</span>
                <span><i class="fas fa-globe"></i> ${book.language}</span>
                <span><i class="fas fa-tag"></i> ${book.category}</span>
            </div>
            
            <div class="book-rating">
                <div class="stars">
                    ${getStarRating(bookRating)}
                </div>
                <span class="rating-count">(${bookSales} vendas)</span>
            </div>
            
            <div class="book-price-section">
                <div class="book-price">${book.price} <span>MT</span></div>
                <div class="book-actions">
                    <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${book.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="add-to-cart" data-id="${book.id}">
                        <i class="fas fa-cart-plus"></i> Comprar
                    </button>
                </div>
            </div>
            
            ${book.type === 'pdf' ? 
                `<p class="pdf-note"><i class="fas fa-download"></i> Download instantâneo - Sem frete</p>` 
                : ''}
        </div>
    `;
    
    return bookCard;
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// ========== FUNÇÕES DE CARRINHO ==========
function addToCart(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    // Verificar se já existe PDF no carrinho (não pode misturar com físico)
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
        quantity: 1,
        price: book.price,
        author: book.author,
        color: book.color,
        format: book.type === 'pdf' ? 'A4' : 'capa comum',
        personalization: ''
    };
    
    // Verificar se já existe no carrinho
    const existingIndex = cart.findIndex(item => 
        item.id === cartItem.id && 
        item.format === cartItem.format && 
        item.personalization === cartItem.personalization
    );
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }
    
    // Registrar venda
    registerSale(bookId, 1);
    
    // Atualizar carrinho
    updateCart();
    saveCartToStorage();
    
    // Feedback visual
    showNotification('Livro adicionado ao carrinho!', 'success');
}

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
            <div class="cart-item-image ${item.type}" style="background: ${item.color}">
                <i class="fas fa-book"></i>
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
    
    // Adicionar eventos
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
}

function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    let shipping = 0;
    
    // PDFs não pagam frete
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

// ========== FUNÇÕES DE VENDAS E ESTATÍSTICAS ==========
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
    updateStats();
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

function updateStats() {
    const totalBooksSold = Object.values(salesData).reduce((total, data) => total + data.sales, 0);
    const totalViews = Object.values(salesData).reduce((total, data) => total + data.views, 0);
    const happyCustomers = Math.floor(totalBooksSold * 0.9);
    
    // Animar números
    animateCounter('booksSold', totalBooksSold);
    animateCounter('totalViews', totalViews);
    animateCounter('happyCustomers', happyCustomers);
}

function animateCounter(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = finalValue / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= finalValue) {
            current = finalValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 30);
}

function updateSectionTitle(filter) {
    const sectionTitle = document.querySelector('.section-title');
    if (!sectionTitle) return;
    
    const titles = {
        'all': 'Nossa Coleção Encantadora',
        'pdf': 'Livros em PDF para Imprimir',
        'fisico': 'Livros Físicos Personalizados',
        'populares': 'Livros Mais Populares',
        'promocao': 'Livros em Promoção'
    };
    
    sectionTitle.textContent = titles[filter] || titles['all'];
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
        if (!name || !email) {
            showNotification('Para PDFs, preencha pelo menos nome e email.', 'error');
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
        message += `   Quantidade: ${item.quantity}\n`;
        message += `   Preço unitário: ${item.price} MT\n`;
        message += `   Subtotal: ${itemTotal} MT\n`;
        if (item.personalization) {
            message += `   Personalização: ${item.personalization}\n`;
        }
    });
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    let shipping = 0;
    if (hasPhysical && !hasPDF) {
        const hasFreeDelivery = freeDeliveryZones.some(zone => 
            address.toLowerCase().includes(zone.toLowerCase())
        );
        
        if (!hasFreeDelivery) {
            shipping = deliveryFee;
        }
    }
    
    const total = subtotal + shipping;
    
    message += `\n*RESUMO DO PEDIDO:*\n`;
    message += `Subtotal: ${subtotal} MT\n`;
    message += `Frete: ${shipping} MT\n`;
    message += `*TOTAL: ${total} MT*\n\n`;
    
    if (hasPDF) {
        message += `📥 Os PDFs serão enviados para: ${email}\n`;
    }
    
    message += `⏰ *Horário do pedido:* ${new Date().toLocaleString('pt-PT')}`;
    
    return {
        message: message,
        total: total
    };
}

function finalizeOrderWhatsApp() {
    const order = createOrderMessage();
    if (!order) return;
    
    const phoneNumber = "258855227420";
    const encodedMessage = encodeURIComponent(order.message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    showNotification('Abrindo WhatsApp...', 'success');
    
    // Limpar carrinho após finalização
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

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
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
    
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            renderBooks(filter, currentSort);
        });
    });
    
    // Botões de ordenação
    sortBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            sortBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const sortBy = this.dataset.sort;
            renderBestsellers(sortBy);
        });
    });
    
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
    
    // Localização
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    if (deliveryAddress) {
        deliveryAddress.addEventListener('input', updateCartSummary);
    }
    
    // Campos de cliente
    ['customerName', 'customerPhone', 'customerEmail'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCartSummary);
        }
    });
    
    // Finalizar compra
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', finalizeOrderWhatsApp);
    }
    
    if (smsBtn) {
        smsBtn.addEventListener('click', finalizeOrderSMS);
    }
    
    if (emailBtn) {
        emailBtn.addEventListener('click', finalizeOrderEmail);
    }
    
    // Event delegation para livros dinâmicos
    document.addEventListener('click', function(e) {
        // Botão adicionar ao carrinho
        if (e.target.closest('.add-to-cart')) {
            const btn = e.target.closest('.add-to-cart');
            if (!btn.classList.contains('confirm-add')) {
                const bookId = parseInt(btn.dataset.id);
                addToCart(bookId);
            }
        }
        
        // Botão lista de desejos
        if (e.target.closest('.wishlist-btn')) {
            const btn = e.target.closest('.wishlist-btn');
            const bookId = parseInt(btn.dataset.id);
            const wasAdded = toggleWishlist(bookId);
            
            if (wasAdded) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Livro adicionado à lista de desejos!', 'success');
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Livro removido da lista de desejos', 'info');
            }
        }
        
        // Botão visualização rápida
        if (e.target.closest('.quick-view-btn')) {
            const btn = e.target.closest('.quick-view-btn');
            const bookId = parseInt(btn.dataset.id);
            showQuickView(bookId);
        }
    });
}

function showQuickView(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const bookSales = salesData[bookId]?.sales || 0;
    const bookRating = salesData[bookId]?.rating || 4.0;
    const inWishlist = isInWishlist(bookId);
    const bookImage = bookImages[bookId] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    
    const modalHTML = `
        <div class="book-modal-overlay" id="quickViewModal">
            <div class="book-modal">
                <button class="modal-close" id="closeModal">&times;</button>
                <div class="modal-content">
                    <div class="modal-image-container">
                        <img src="${bookImage}" alt="${book.title}" class="modal-image">
                        <div class="book-badges">
                            <div class="book-badge badge-${book.type}">
                                <i class="fas fa-${book.type === 'pdf' ? 'file-pdf' : 'book'}"></i>
                                ${book.type === 'pdf' ? 'PDF' : 'Livro Físico'}
                            </div>
                            ${bookSales > 30 ? `
                                <div class="book-badge badge-bestseller">
                                    <i class="fas fa-crown"></i> Mais Vendido
                                </div>
                            ` : ''}
                            ${book.promotion ? `
                                <div class="book-badge badge-promo">
                                    <i class="fas fa-tag"></i> Promoção
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="modal-details">
                        <h2 class="modal-title">${book.title}</h2>
                        <p class="modal-author">por ${book.author}</p>
                        
                        <div class="book-rating" style="margin-bottom: 20px;">
                            <div class="stars">
                                ${getStarRating(bookRating)}
                            </div>
                            <span class="rating-count">${bookSales} vendas • ${bookRating.toFixed(1)}/5.0</span>
                        </div>
                        
                        <p class="modal-description">${book.description}</p>
                        
                        <div class="modal-meta-grid">
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Páginas</span>
                                <span class="modal-meta-value">${book.pages} páginas</span>
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Idioma</span>
                                <span class="modal-meta-value">${book.language}</span>
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Categoria</span>
                                <span class="modal-meta-value">${book.category}</span>
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Formato</span>
                                <span class="modal-meta-value">${book.type === 'pdf' ? 'Digital (PDF)' : 'Físico'}</span>
                            </div>
                        </div>
                        
                        <div class="modal-price">${book.price} MT</div>
                        
                        ${book.type === 'pdf' ? 
                            `<p class="pdf-note" style="margin-bottom: 20px;">
                                <i class="fas fa-download"></i> Download instantâneo - Sem frete
                            </p>` 
                            : ''}
                        
                        <div class="modal-actions">
                            <button class="modal-add-to-cart" data-id="${bookId}">
                                <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
                            </button>
                            <button class="modal-wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${bookId}">
                                <i class="fas fa-heart"></i> ${inWishlist ? 'Na Lista' : 'Lista de Desejos'}
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
    
    const closeBtn = document.getElementById('closeModal');
    closeBtn.addEventListener('click', closeQuickView);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeQuickView();
        }
    });
    
    const wishlistBtn = document.querySelector('.modal-wishlist-btn');
    wishlistBtn.addEventListener('click', function() {
        const bookId = parseInt(this.dataset.id);
        const wasAdded = toggleWishlist(bookId);
        
        if (wasAdded) {
            this.classList.add('active');
            this.innerHTML = '<i class="fas fa-heart"></i> Na Lista';
            showNotification('Adicionado à lista de desejos!', 'success');
        } else {
            this.classList.remove('active');
            this.innerHTML = '<i class="fas fa-heart"></i> Lista de Desejos';
            showNotification('Removido da lista de desejos', 'info');
        }
    });
    
    const addToCartBtn = document.querySelector('.modal-add-to-cart');
    addToCartBtn.addEventListener('click', function() {
        const bookId = parseInt(this.dataset.id);
        closeQuickView();
        addToCart(bookId);
    });
}

function closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
        modal.style.animation = 'modalOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', initializeApp);

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    
    @keyframes modalOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
    
    .badge-rank {
        background: linear-gradient(45deg, #FFD700, #FFA500);
    }
`;
document.head.appendChild(style);