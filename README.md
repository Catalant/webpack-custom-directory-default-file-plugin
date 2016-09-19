# webpack-custom-directory-default-file-plugin

Teach webpack to use anything you want instead of index.ext file (ext being .js, but doesnt have to be)

This allows you to write:

`require('lib/ReallyImportantModule')`

in order to require:

`lib/ReallyImportantModule/whatever_you_want_goes_here.js`


This module is designed to be used as strategy for a `webpack.ResolverPlugin`.

It comes with a prebuilt resolver called 'regexp' that let you specify any index file with a regexp.

### DirectoryDefaultFilePlugin.resolver.regexp

This resolver can be used to make any filename that matches indexRegexp be the index file of that directory.
There can only ever be 0 or 1 such files per dir, if there is more than one, the build will fail (unless ignoreMultpleMatches is true)

includeDirRegexp can be used to limit the dirs where this behavior is used. 
The default value for this param will include everything under the current working dir except anything in node_modules.

Options object contains:
     @param indexRegexp
     @param includeDirRegexp
     @param ignoreMultipleMatches

Example use

```js
var CustomDefaultFilePlugin = require('webpack-custom-directory-default-file-plugin');

plugins: [
     new webpack.ResolverPlugin([
         // this will use any file ending in .index.js as the index file for that dir
         // unless there is an index.js file there already.
         new CustomDefaultFilePlugin(CustomDefaultFilePlugin.resolver.regexp(
             // 'index' file must match this
             /\.index.js$/,

             // directory where that file lives must match this (has sane default)
             new RegExp("^(" + process.cwd() + "/(?!node_modules)|" + process.cwd() + "/node_modules/my_other_module)"))
         )
     ]),

```

### Writing your own resolver

The plugin takes a fn with 3 args: resolver, req, done (the first 2 are webpack objects with useful stuff on them).

The  `done` callback must be called with undefined to fallback on default webpack behavior,
or full path to the file that will be the index file.

```js
var CustomDefaultFilePlugin = require('webpack-custom-directory-default-file-plugin');
var glob = require('glob');
var basename = require('path').basename;

var webpackConfig = {
  entry: ...,

  plugins: [
    new webpack.ResolverPlugin([
        new CustomDefaultFilePlugin(function(resolver, req, done){
            var directory = resolver.join(req.path, req.request);
            var files = glob.sync(directory+'/*.idx.js');
            if(files.length == 1){
                // important: remove ext from path!
                return done(basename(files[0], '.js'));
            }
        })
    ]),
    ...
  ]
};
```

The example above lets you `require('lib/ReallyImportantModule')` and it will load `lib/ReallyImportantModule/anything_goes_here.idx.js`

