# webpack-custom-directory-default-file-plugin

Teach webpack to use anything you want instead of index.ext file (ext being .js, but doesnt have to be)

This allows you to write:

`require('lib/ReallyImportantModule')`

in order to require:

`lib/ReallyImportantModule/whatever_you_want_goes_here.js`


This module is designed to be used as strategy for a `webpack.ResolverPlugin` like so:

```js
var CustomDefaultFilePlugin = require('webpack-custom-directory-default-file-plugin');
var glob = require('glob');

var webpackConfig = {
  entry: ...,

  plugins: [
    new webpack.ResolverPlugin([
        new CustomDefaultFilePlugin(function(resolver, req){
            var directory = resolver.join(req.path, req.request);
            var files = glob.sync(directory+'/*.idx.js');
            if(files.length > 2){
                throw "multiple index files in dir:"+directory+" files:"+files+" -- this is bad. you should only have one or none!";
            }
            if(files.length == 1){
                // important: remove ext from path!
                return files[0].replace(/\.\w+$/, '');
            }
        })
    ]),
    ...
  ]
};
```

The example above lets you `require('lib/ReallyImportantModule')` and it will load `lib/ReallyImportantModule/anything_goes_here.idx.js`