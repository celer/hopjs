mkdir gh-pages 
(cd gh-pages && git clone git@github.com:celer/hopjs -b gh-pages)
mkdir -p gh-pages/hopjs/doc
yuidoc lib/ -o gh-pages/hopjs/doc 
(cd gh-pages/hopjs && git add doc)
(cd gh-pages/hopjs && git commit . -m "Updated docs") 
(cd gh-pages/hopjs && git push origin gh-pages)
rm -rf gh-pages
