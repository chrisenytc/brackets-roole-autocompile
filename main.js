/*
 * brackets-roole-autocompile
 * https://github.com/chrisenytc/brackets-roole-autocompile
 *
 * Copyright (c) 2013 Christopher EnyTC
 * Licensed under the MIT license.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        DocumentManager = brackets.getModule("document/DocumentManager");

    // connect to the node server
    function connect(callback) {
        var connection = new NodeConnection();
        var promise = connection.connect(true);
        promise.fail(function (err) {
            callback("Could not connect to node server: " + err);
        });
        promise.done(function () {
            callback(null, connection);
        });
    }

    function loadNodeModule(moduleName, callback) {
        connect(function (err, connection) {
            if (err) {
                callback(err);
                return;
            }

            var path = ExtensionUtils.getModulePath(module, "node/" + moduleName);
            var promise = connection.loadDomains([path], true);
            promise.fail(function (err) {
                callback("Could not load node module " + moduleName + ": " + err);
            });
            promise.done(function () {
                callback(null, connection.domains[moduleName]);
            });
        });
    }

    // a document was saved
    function onDocumentSaved(event, document) {

        // check if the document was truly saved
        if (document.file.isDirty) {
            return;
        }

        // check if it was a .less document
        var path = document.file.fullPath;
        if (path.substr(path.length - 4, 4) === ".roo") {

            // connect to the node server
            loadNodeModule("RooleCompiler", function (err, compiler) {
                if (err) {
                    console.error(err);
                    return;
                }
                compiler.compile(path, path.substr(0, path.length - 4) + ".css");
            });

        }
    }

    AppInit.appReady(function () {
        $(DocumentManager).on("documentSaved", onDocumentSaved);
    });


    // Helper function that chains a series of promise-returning
    // functions together via their done callbacks.
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }

});