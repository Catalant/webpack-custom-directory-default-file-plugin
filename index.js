var path = require('path');
var fs = require('fs');

function DirectoryDefaultFilePlugin(resolverFn) {
    this.resolverFn = resolverFn || function(){
        throw new Error("DirectoryDefaultFilePlugin: resolverFn expected");
    };
}

DirectoryDefaultFilePlugin.prototype.apply = function (resolver) {
    var resolverFn = this.resolverFn;
    resolver.plugin('directory', function (req, done) {
        var directory = resolver.join(req.path, req.request);

        resolver.fileSystem.stat(directory, function (err, stat) {
            if (err || !stat) return done();
            if (!stat.isDirectory()) return done();

            resolverFn(resolver, req, function(filename) {
                if(filename && filename.substring(0, directory.length) != directory) {
                    filename = path.join(directory, filename);
                }
                resolver.doResolve('file', {
                    path: req.path,
                    query: req.query,
                    request: filename
                }, function (err, result) {
                    return done(undefined, result || undefined);
                });
            });
        });

    });
};

DirectoryDefaultFilePlugin.resolver = {
    /**
     * This resolver can be used to make any filename that matches indexRegexp be the index file of that directory.
     * There can only ever be 0 or 1 such files per dir, if there is more than one, the build will fail (unless ignoreMultipleMatches is true)
     *
     * includeDirRegexp can be used to limit the dirs where this behavior is used.
     * The default value for this param will include everything under the current working dir except anything in node_modules.
     *
     * Example use
     *
     * plugins: [
         new webpack.ResolverPlugin([
             new CustomDefaultFilePlugin(CustomDefaultFilePlugin.resolver.regexp(
                 /\.index.js$/,
                 new RegExp("^(" + process.cwd() + "/(?!node_modules)|" + process.cwd() + "/node_modules/my_other_module)"))
             )
         ]),
     *
     * this will use any file ending in .index.js as the index file for that dir, unless there is an index.js file there already.
     *
     * Options object contains:
     *      @param indexRegexp - thing used as index's filename matches this
     *      @param includeDirRegexp - dir where the file is in matches this
     *      @param ignoreMultipleMatches - if there are multiple files that match regexp in dir, dont throw error, ignore them all.
     * @returns {Function}
     */
    regexp: function(options){
        var indexRegexp = options.indexRegexp;
        var includeDirRegexp = options.includeDirRegexp || new RegExp("^" + process.cwd() + "/(?!node_modules)");
        var ignoreMultipleMatches = options.ignoreMultipleMatches || false;
        return function(resolver, req, done) {
            var directory = resolver.join(req.path, req.request);
            if (directory.match(includeDirRegexp)) {
                fs.readdir(directory, function (err, files) {
                    var indexFiles = files.filter(function (f) {
                        // if we have an index.js in the dir, fallback to regular behavior
                        return f == "index.js";
                    });
                    if (indexFiles.length == 0) {
                        indexFiles = files.filter(function (f) {
                            // now lets see if any left over files match our regexp
                            return f.match(indexRegexp);
                        });
                        if (!ignoreMultipleMatches && indexFiles.length > 1) {
                            throw new Error("CustomDefaultFilePlugin: Multiple index files in dir: " +
                            directory + "\nFiles: [" + indexFiles + "]\nMatching regexp: " +
                            indexRegexp.source + "\n(should have at most one such file!!!!)\n\n");
                        } else if (indexFiles.length == 1) {
                            //must chop off extension!! this is what webpack expects.
                            return done(indexFiles[0].replace(/\.[^.]+$/, ''));
                        }
                    }
                    return done();
                });
            } else {
                done();
            }
        }
    }
};

module.exports = DirectoryDefaultFilePlugin;
