# Northfold Theme: Recently viewed

**What I built:** a Recently viewed feature for the Northfold Shopify theme. Each product page saves the product in the shopper's browser (`localStorage`). A section then shows up to four earlier products with image, title, current price and link. It leaves out the current product and hides itself when there is nothing to show.
It sits above "Made for everyday moments" on the product page. The heading and a show/hide checkbox are set in the theme editor, and a standalone section can be added to other pages.

**One decision:** I store only product handles and fetch the title, image and price when the section renders. This keeps prices current, storage tiny, and skips deleted products. The cost is a few small extra requests.

**Next:** test on a real store at 360, 768 and 1280px with the keyboard, match the shop's custom money format, add translations, and add a "clear history" option.
