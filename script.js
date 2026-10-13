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
  el.items.replaceChildren(...cart.map((i) => {
    const li = document.createElement('li');
    li.textContent = `${i.title} (${i.variantTitle}) × ${i.quantity} — ${money(i.amount * i.quantity, i.currency)}`;
    return li;
  }));
  const currency = cart[0]?.currency || 'USD';
  el.subtotal.textContent = money(cart.reduce((s, i) => s + i.amount * i.quantity, 0), currency);
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

$('cart-link').addEventListener('click', () => { el.drawer.hidden = !el.drawer.hidden; });
$('cart-close').addEventListener('click', () => { el.drawer.hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') el.drawer.hidden = true; });

renderCart();
try {
  product = await fetchProduct();
  el.status.textContent = '';
  render();
} catch (err) {
  el.status.classList.add('error');
  el.status.textContent = `Sorry, we couldn't load this product. ${err.message} Please try again later.`;
}
