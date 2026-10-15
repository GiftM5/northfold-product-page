const API = 'https://mock.shop/api';
const CART_KEY = 'northfold-cart';
const handle = new URLSearchParams(location.search).get('handle') || 'men-crewneck';

const QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      title
      description
      images(first: 6) { nodes { url altText } }
      variants(first: 20) {
        nodes { id title price { amount currencyCode } image { url altText } }
      }
    }
  }`;

const $ = (id) => document.getElementById(id);
const el = {
  status: $('status'), gallery: $('gallery'), details: $('details'),
  main: $('main-image'), thumbs: $('thumbs'), title: $('title'), price: $('price'),
  description: $('description'), variants: $('variants'), form: $('product-form'),
  qty: $('quantity'), added: $('added'), count: $('cart-count'),
  drawer: $('cart-drawer'), items: $('cart-items'), subtotal: $('cart-subtotal'),
};

let product = null;
let selected = null;
let cart = loadCart();

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const money = (amount, currency) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));

async function fetchProduct() {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { handle } }),
  });
  if (!res.ok) throw new Error(`The store responded with status ${res.status}.`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  if (!data?.product) throw new Error(`No product found for "${handle}".`);
  return data.product;
}

function showImage(url, alt) {
  el.main.src = url;
  el.main.alt = alt || product.title;
  el.thumbs.querySelectorAll('button').forEach((b) =>
    b.setAttribute('aria-current', String(b.dataset.url === url)));
}

function renderGallery(images) {
  el.thumbs.replaceChildren(...images.map((img, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button'); // buttons give keyboard support for free
    btn.type = 'button';
    btn.dataset.url = img.url;
    btn.setAttribute('aria-label', `Show image ${i + 1} of ${images.length}`);
    const t = document.createElement('img');
    t.src = img.url;
    t.alt = '';
    btn.append(t);
    btn.addEventListener('click', () => showImage(img.url, img.altText));
    li.append(btn);
    return li;
  }));
}

function selectVariant(v) {
  selected = v;
  el.price.textContent = money(v.price.amount, v.price.currencyCode);
  $('variant-name').textContent = v.title;
  if (v.image) showImage(v.image.url, v.image.altText);
}

function renderVariants(variants) {
  el.variants.replaceChildren(...variants.map((v, i) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'variant';
    input.value = v.id;
    input.checked = i === 0;
    input.addEventListener('change', () => selectVariant(v));
    const text = document.createElement('span');
    text.textContent = v.title;
    label.append(input, text);
    return label;
  }));
}

function render() {
  document.title = `${product.title} | Northfold`;
  el.title.textContent = product.title;
  el.description.textContent = product.description;
  const images = product.images.nodes;
  renderGallery(images);
  const first = images[0];
  if (first) showImage(first.url, first.altText);
  renderVariants(product.variants.nodes);
  selectVariant(product.variants.nodes[0]);
  el.gallery.hidden = false;
  el.details.hidden = false;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  el.count.textContent = cart.reduce((n, i) => n + i.quantity, 0);
  if (!cart.length) {
    const li = document.createElement('li');
    li.className = 'empty-cart-msg';
    li.textContent = 'Your cart is empty.';
    el.items.replaceChildren(li);
  } else {
    el.items.replaceChildren(...cart.map((i) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      const info = document.createElement('div');
      const t = document.createElement('p');
      t.className = 'cart-item-title';
      t.textContent = i.title;
      const v = document.createElement('p');
      v.className = 'cart-item-variant';
      v.textContent = i.variantTitle;
      const qty = document.createElement('div');
      qty.className = 'qty-stepper';
      const mk = (label, text, delta) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.setAttribute('aria-label', `${label} ${i.title}`);
        b.addEventListener('click', () => changeQty(i.variantId, delta));
        return b;
      };
      const n = document.createElement('span');
      n.textContent = i.quantity;
      qty.append(mk('Decrease quantity of', '−', -1), n, mk('Increase quantity of', '+', 1));
      info.append(t, v, qty);
      const side = document.createElement('div');
      side.className = 'cart-item-side';
      const p = document.createElement('p');
      p.className = 'cart-item-price';
      p.textContent = money(i.amount * i.quantity, i.currency);
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-remove';
      rm.textContent = 'Remove';
      rm.setAttribute('aria-label', `Remove ${i.title} (${i.variantTitle}) from cart`);
      rm.addEventListener('click', () => removeItem(i.variantId));
      side.append(p, rm);
      li.append(info, side);
      return li;
    }));
  }
  const currency = cart[0]?.currency || 'USD';
  el.subtotal.textContent = money(cart.reduce((s, i) => s + i.amount * i.quantity, 0), currency);
}

function removeItem(id) {
  cart = cart.filter((i) => i.variantId !== id);
  saveCart();
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.variantId === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) cart = cart.filter((i) => i !== item);
  saveCart();
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const quantity = Math.max(1, parseInt(el.qty.value, 10) || 1);
  const existing = cart.find((i) => i.variantId === selected.id);
  if (existing) existing.quantity += quantity;
  else cart.push({
    variantId: selected.id, title: product.title, variantTitle: selected.title,
    amount: Number(selected.price.amount), currency: selected.price.currencyCode, quantity,
  });
  saveCart();
  el.added.textContent = `Added ${quantity} × ${selected.title} to cart.`;
});

const overlay = $('cart-overlay');
const setDrawer = (open) => { el.drawer.hidden = !open; overlay.hidden = !open; };
$('cart-link').addEventListener('click', () => setDrawer(el.drawer.hidden));
$('cart-close').addEventListener('click', () => setDrawer(false));
overlay.addEventListener('click', () => setDrawer(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

renderCart();
try {
  product = await fetchProduct();
  el.status.textContent = '';
  render();
} catch (err) {
  el.status.classList.add('error');
  el.status.textContent = `Sorry, we couldn't load this product. ${err.message} Please try again later.`;
}
