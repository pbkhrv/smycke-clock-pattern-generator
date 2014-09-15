### Why?

I bought [this clock](http://www.ikea.com/us/en/catalog/products/80232223/) from IKEA the other day, and had to come up with a pattern to put it together. I wanted it to look pleasing yet random. Naturally, this called for an algorithm.

### How does it work?

1. Take a hexagonal grid data structure and seed it with the 7 initial tiles in the center.
2. Go through each of the remaining 28 tiles and find a spot for each one. All tiles must be connected in order for the clock to stay in one piece. This means that we can't pick grid coordinates completely at random. Instead, on each iteration of the algorithm we find all of the empty spots along the edge of the structure and pick one of those. In order to achieve the slightly-less-than-random looks of the pattern (like the "color clusters" one), the "pick one" step sometimes considers neighboring colors. So far I came up with 4 different strategies for placing tiles. Search for "SmyckeGridGenerator.prototype.nextSpot" in smyckr.js if you want to know how those work (or want to make a different one).
3. Draw tiles, their shadows and clock arms in a loop until "Make a new pattern" button is pressed.

### What were the fun bits?

- Hexagonal grids are cool and slighly mind-bending. It would take my much longer to do this if it wasn't for this tremendous guide by Red Blob Games: http://www.redblobgames.com/grids/hexagons
- Finding a way to encode grid pattern as URL fragment was an interesting challenge. The method that I ended up with isn't the most straightforward, but it works.
- Processing.js is fun
- Lo-Dash is awesome

This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
