#!/bin/bash

# Run from project root.

cd lib

curl https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.js -o "jquery.js"
curl https://raw.github.com/amdjs/underscore/master/underscore.js -o "underscore.js"
curl https://raw.github.com/jrburke/requirejs/master/require.js -o "require.js"
curl https://raw.github.com/necolas/normalize.css/master/normalize.css -o "normalize.css"

cd -
