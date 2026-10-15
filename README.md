# Snowboard Store Shopify Theme

## Project Overview

This project is a Shopify storefront theme developed for a snowboard store. It provides a product-focused shopping experience and uses Shopify's Liquid templating language, JSON templates, sections and theme settings.

## Features

- Snowboard store product presentation.
- Shopify theme sections and templates.
- Responsive storefront layout.
- Product imagery and descriptions.
- Theme preview for reviewing changes before publication.
- AJAX add-to-cart using Shopify's Cart API without reloading the page.
- Header cart count updates and shopper feedback after adding items.
- Error messages for failed add-to-cart requests.
- Free-shipping progress bar showing the remaining amount or a success message.
- Configurable free-shipping threshold through the Shopify theme editor, with a default of $60.
- Initial progress rendered with Liquid using `cart.total_price` and updated after cart changes.
- Accessible progress indicator with a labelled progress element and `aria-live` announcements.
- Cart API URLs built using `window.Shopify.routes.root` for locale-aware storefronts.

## Technologies

- Shopify Liquid
- HTML
- CSS
- JavaScript
- JSON
- Shopify CLI

## Development

1. Install Shopify CLI and authenticate with the development store.
2. Navigate to the theme directory.
3. Push the theme as an unpublished theme:

   ```bash
   shopify theme push --unpublished
   ```

4. Preview the theme and test its appearance and functionality before submitting.

## Publishing

This project is intended to be reviewed through an unpublished theme and preview link. Do not publish it to the live storefront as part of the development or review process.

## Testing Checklist

- Check the product page and product imagery.
- Verify that all storefront copy relates to snowboarding.
- Test the layout at desktop and mobile widths.
- Check navigation and product interactions.
- Verify AJAX add-to-cart, cart count updates and success/error feedback.
- Verify the free-shipping threshold and progress bar.
- Confirm the threshold can be changed in the theme editor.
- Confirm the progress bar updates without reloading the page.
- Confirm the theme remains unpublished.
