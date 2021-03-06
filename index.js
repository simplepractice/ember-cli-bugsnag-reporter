/* eslint-env node */
'use strict';
const Funnel = require('broccoli-funnel');
const rename = require('broccoli-stew').rename;
const map = require('broccoli-stew').map;

module.exports = {
  name: 'ember-cli-bugsnag-reporter',

  __checkApiKeyPresence(options) {
    if (options.apiKey === undefined || options.apiKey === null || options.apiKey.trim() === "") {
      throw new Error("ember-cli-bugsnag-reporter requires a value for ENV['bugsnag-reporter']['apiKey']");
    }
  },

  config: function(environment, appConfig) {
    const options = appConfig['bugsnag-reporter'] || {};

    options.notifyReleaseStages = options.notifyReleaseStages || [];
    options.releaseStage = options.releaseStage || environment;

    this.useDummyService = options.notifyReleaseStages.indexOf(environment) === -1;

    if (this.useDummyService === false) {
      this.__checkApiKeyPresence(options);
    }

    appConfig['bugsnag-reporter'] = options;


    return appConfig;
  },

  included: function() {
    // Remove bugsnag-js from the build
    if (this.useDummyService === true) {
      this.options.autoImport = {
        exclude: ['bugsnag-js']
      }
    }

    this._super.included.apply(this, arguments);
  },
  // Rename the service 'bugsnag-dummy' in 'bugsnag' if needed
  treeFor: function(name) {
    if (name === 'addon' || name === 'app') {
      return map(this._super.treeFor.apply(this, arguments), (content) => {
        return content.replace('/bugsnag-dummy', '/bugsnag');
      });
    }
    return this._super.treeFor.apply(this, arguments);
  },
  // remove unwanted service depending on the value of `useDummyService`
  treeForAddon: function() {
    // see: https://github.com/ember-cli/ember-cli/issues/4463
    let tree = this._super.treeForAddon.apply(this, arguments);

    if (this.useDummyService === true) {
      tree = new Funnel(tree, {
        exclude: ['ember-cli-bugsnag-reporter/services/bugsnag.js']
      });
      tree = rename(tree, 'ember-cli-bugsnag-reporter/services/bugsnag-dummy.js', 'ember-cli-bugsnag-reporter/services/bugsnag.js');
    } else {
      tree = new Funnel(tree, {
        exclude: ['ember-cli-bugsnag-reporter/services/bugsnag-dummy.js']
      });
    }
    // var loggedApp = log(tree, { output: 'tree', label: 'my-app-name tree' });
    return tree;
  }
};
