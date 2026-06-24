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

    /* wire cart-btn on every page */
    document.getElementById('cart-btn')?.addEventListener('click', openDrawer);
  });

})();
