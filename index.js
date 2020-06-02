'use strict';
var path = require('path');
var Funnel = require('broccoli-funnel');
var merge = require('broccoli-merge-trees');

module.exports = {
  name: require('./package').name,
  included: function(app) {
    this._super.included.apply(this, arguments);
    app.import('node_modules/markdown-it/dist/markdown-it.js', {
      using: [{ transformation: 'cjs', as: 'markdown-it' }]
    });
  },

  treeForAddon: function(tree) {
    let trees = [];
    if (tree)
      trees.push(tree)
    var libRoot = require.resolve('mobiledoc-dom-renderer/lib');
    var libPath = path.dirname(libRoot);

    var rendererTree = new Funnel(libPath, {
      include: ['**/*.js'],
      destDir: '/mobiledoc-dom-renderer'
    });
    trees.push(rendererTree)
    var mergedTree = new merge(trees);
    return this._super.treeForAddon.call(this, mergedTree);
  }
};
