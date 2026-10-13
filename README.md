# Northfold Product Page

A product page that fetches a live product (Men's Crewneck) from the mock.shop GraphQL API and renders title, description, price, gallery and variants with vanilla JS (one `script.js`, `type="module"`).
Features: variant picker (price and image), keyboard-accessible thumbnails, add to cart with a drawer and subtotal, cart persisted in `localStorage`, loading and error states, `Intl.NumberFormat` prices, and `?handle=` support.
Decision: thumbnails are real `<button>` elements, so mouse, Enter and Space work without custom key handling.
Next: quantity controls and item removal in the cart, and wiring checkout to Shopify's Cart API.
Run locally: serve the folder (`python3 -m http.server`) and open it; modules need http, not file://.
