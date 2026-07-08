/**
 * Amora Noir — Cart System
 * localStorage-backed cart with slide-in drawer, badge counter, qty controls.
 */
'use strict';

(function () {

  /* ─── STORAGE ─────────────────────────────────────────────── */
  const CART_KEY = 'amora_cart';



  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addItem(product) {
    const cart = loadCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    saveCart(cart);
    return cart;
  }

  function removeItem(id) {
    const cart = loadCart().filter(i => i.id !== id);
    saveCart(cart);
    return cart;
  }

  function updateQty(id, delta) {
    const cart = loadCart();
    const item = cart.find(i => i.id === id);
    if (!item) return cart;
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
    return cart;
  }

  function totalCount(cart) {
    return cart.reduce((s, i) => s + i.qty, 0);
  }

  function totalPrice(cart) {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }

  /* ─── INJECT DRAWER HTML ──────────────────────────────────── */
  function injectDrawer() {
    if (document.getElementById('cart-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Shopping Cart');
    drawer.innerHTML = `
      <div id="cart-drawer-backdrop"></div>
      <div id="cart-drawer-panel">
        <div id="cart-drawer-header">
          <span id="cart-drawer-title">Your Cart</span>
          <button id="cart-drawer-close" aria-label="Close cart">✕</button>
        </div>
        <div id="cart-drawer-body">
          <div id="cart-drawer-empty">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p>Your cart is empty</p>
            <a href="shop.html" class="cart-empty-cta">Browse Collection</a>
          </div>
          <ul id="cart-drawer-list" aria-label="Cart items"></ul>
        </div>
        <div id="cart-drawer-footer">
          <div id="cart-drawer-subtotal">
            <span>Subtotal</span>
            <span id="cart-drawer-total">AED 0</span>
          </div>
          <p id="cart-drawer-shipping-note">Free UAE shipping on orders over AED 300</p>
          <a href="#" id="cart-checkout-btn">Proceed to Checkout</a>
        </div>
      </div>`;
    document.body.appendChild(drawer);

    /* close events */
    document.getElementById('cart-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('cart-drawer-backdrop').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    /* checkout events */
    document.getElementById('cart-checkout-btn')?.addEventListener('click', handleCheckout);
  }

  /* ─── DRAWER RENDER ───────────────────────────────────────── */
  function renderDrawer() {
    const cart = loadCart();
    const list = document.getElementById('cart-drawer-list');
    const empty = document.getElementById('cart-drawer-empty');
    const footer = document.getElementById('cart-drawer-footer');
    const totalEl = document.getElementById('cart-drawer-total');

    list.innerHTML = '';

    if (cart.length === 0) {
      empty.style.display = 'flex';
      footer.style.display = 'none';
    } else {
      empty.style.display = 'none';
      footer.style.display = 'flex';
      totalEl.textContent = 'AED ' + totalPrice(cart).toLocaleString();

      cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <img src="${item.img}" alt="${item.name}" class="cart-item-img" />
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">AED ${item.price.toLocaleString()}</div>
            <div class="cart-item-controls">
              <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
              <span class="cart-item-qty">${item.qty}</span>
              <button class="cart-qty-btn" data-id="${item.id}" data-delta="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="cart-remove-btn" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>`;
        list.appendChild(li);
      });

      /* qty / remove events */
      list.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          updateQty(btn.dataset.id, parseInt(btn.dataset.delta, 10));
          refreshAll();
        });
      });
      list.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          removeItem(btn.dataset.id);
          refreshAll();
        });
      });
    }
  }

  /* ─── BADGE ───────────────────────────────────────────────── */
  function updateBadge() {
    const count = totalCount(loadCart());
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /* ─── OPEN / CLOSE ────────────────────────────────────────── */
  function openDrawer() {
    renderDrawer();
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('cart-drawer-close').focus();
  }

  function closeDrawer() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ─── REFRESH EVERYTHING ──────────────────────────────────── */
  function refreshAll() {
    updateBadge();
    if (document.getElementById('cart-drawer').classList.contains('open')) {
      renderDrawer();
    }
  }

  function handleCheckout(e) {
    e.preventDefault();
    const cart = loadCart();
    if (cart.length === 0) return;

    // Save pending order details locally before redirecting
    const pendingOrder = {
      items: cart.map(i => `${i.name} (${i.qty})`).join(', '),
      total: totalPrice(cart),
      cartDetails: cart
    };
    localStorage.setItem('amora_pending_order', JSON.stringify(pendingOrder));

    const checkoutBtn = document.getElementById('cart-checkout-btn');
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Redirecting to secure checkout...';
    checkoutBtn.style.pointerEvents = 'none';
    checkoutBtn.style.opacity = '0.7';

    fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: cart })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.error || 'Server error'); });
      }
      return res.json();
    })
    .then(session => {
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned from server.');
      }
    })
    .catch(err => {
      console.error('Checkout error:', err);
      // For local testing/simulating if server checkout fails or isn't running:
      const simulate = confirm('Stripe checkout server could not be reached. Would you like to simulate a successful payment locally for testing?');
      if (simulate) {
        window.location.href = window.location.pathname + '?checkout=success';
      } else {
        localStorage.removeItem('amora_pending_order');
        checkoutBtn.textContent = originalText;
        checkoutBtn.style.pointerEvents = '';
        checkoutBtn.style.opacity = '';
      }
    });
  }

  async function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('checkout')) {
      const status = urlParams.get('checkout');
      if (status === 'success') {
        try {
          const pending = JSON.parse(localStorage.getItem('amora_pending_order'));
          if (pending) {
            // Deduct stock and update sales counters in Supabase
            if (window.db && window.db.getProduct && window.db.upsertProduct) {
              for (const item of pending.cartDetails) {
                const prod = await window.db.getProduct(item.id);
                if (prod) {
                  prod.stock = Math.max(0, prod.stock - item.qty);
                  prod.sales = (prod.sales || 0) + item.qty;
                  await window.db.upsertProduct(prod);
                }
              }
            } else {
              // Fallback
              const products = JSON.parse(localStorage.getItem('amora_products')) || [];
              pending.cartDetails.forEach(item => {
                const prod = products.find(p => p.id === item.id);
                if (prod) {
                  prod.stock = Math.max(0, prod.stock - item.qty);
                  prod.sales = (prod.sales || 0) + item.qty;
                }
              });
              localStorage.setItem('amora_products', JSON.stringify(products));
            }

            // Generate customer details
            const names = ["Zayed Al-Nahyan", "Amira El-Sayed", "Sarah Connor", "Mariam Al-Mansoori", "Omar Farooq"];
            const emails = ["zayed@domain.ae", "amira@domain.com", "sarah@domain.com", "mariam.m@outlook.com", "omar.f@domain.ae"];
            const randomIdx = Math.floor(Math.random() * names.length);
            
            const newOrder = {
              id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
              customer: names[randomIdx],
              email: emails[randomIdx],
              date: new Date().toISOString(),
              total: pending.total,
              status: 'Pending',
              items: pending.items
            };
            
            if (window.db && window.db.createOrder) {
              await window.db.createOrder(newOrder);
            } else {
              // Fallback
              const orders = JSON.parse(localStorage.getItem('amora_orders')) || [];
              orders.push(newOrder);
              localStorage.setItem('amora_orders', JSON.stringify(orders));
            }
            localStorage.removeItem('amora_pending_order');
          }
        } catch (err) {
          console.error('Error saving simulated order:', err);
        }

        localStorage.removeItem(CART_KEY);
        updateBadge();
        showCheckoutFeedback(true);
      } else if (status === 'cancel') {
        localStorage.removeItem('amora_pending_order');
        showCheckoutFeedback(false);
      }

      // Clean parameters from URL
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }

  function showCheckoutFeedback(isSuccess) {
    const feedback = document.createElement('div');
    feedback.id = 'checkout-feedback-modal';
    feedback.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      background: ${isSuccess ? 'rgba(15, 15, 15, 0.96)' : 'rgba(35, 15, 15, 0.96)'};
      border: 1px solid ${isSuccess ? 'var(--gold-primary, #C9A24D)' : '#ff4d4d'};
      border-radius: 4px;
      padding: 20px;
      max-width: 380px;
      color: #fff;
      font-family: var(--font-sans, sans-serif);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      transform: translateY(-20px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    feedback.innerHTML = isSuccess ? `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="#C9A24D" stroke-width="2" fill="none" style="margin-top:2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>
          <h4 style="margin:0 0 6px 0; color:var(--gold-primary, #C9A24D); font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.15em;">Order Confirmed</h4>
          <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.7); line-height:1.6;">Thank you for your purchase. We are preparing your luxury packaging.</p>
        </div>
      </div>
    ` : `
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="#ff4d4d" stroke-width="2" fill="none" style="margin-top:2px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <div>
          <h4 style="margin:0 0 6px 0; color:#ff4d4d; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.15em;">Checkout Cancelled</h4>
          <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.7); line-height:1.6;">The checkout process was cancelled. Your selected items are saved in your cart.</p>
        </div>
      </div>
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.transform = 'translateY(0)';
      feedback.style.opacity = '1';
    }, 50);

    setTimeout(() => {
      feedback.style.transform = 'translateY(-20px)';
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 400);
    }, 6000);
  }

  /* ─── PUBLIC API ──────────────────────────────────────────── */
  window.AmoraCart = {
    add(product) {
      addItem(product);
      refreshAll();
      openDrawer();
    },
    open: openDrawer,
    close: closeDrawer,
  };

  /* ─── INIT ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    injectDrawer();
    updateBadge();
    handleUrlParams();

    /* wire cart-btn on every page */
    document.getElementById('cart-btn')?.addEventListener('click', openDrawer);
  });

})();
