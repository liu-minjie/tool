import React, { Component } from 'react';
import { render } from "react-dom";
import Container from './container';
import './index.less';

Enhancer.registerWidgetConfigurator({
  constructor() {
  },

  setProfile( profile ) {
    const self = this;
    console.log(profile);
    this.instance = render(<Container dataSourceId={profile.dataSourceId} />, 
      document.body, 
      function (configurator) {
        // self.configurator = this.refs.child;
      }
    );
  },

  getProfile() {
    console.log(this.instance.state);
    return this.instance.state;
  },

  getSupportedVariableList: function() {
    return [{
        // Variable name [required]
        name: 'exampleVar',
        // Variable type [optional default string]
        type: 'string',
        // Variable description
        des: 'example Variable description.'
    }];
  },

  getDependentVariableList: function() {
  },

  getSupportedEventList: function() {
    return [{
        // Event Id [required]
        id: "exampleEvent",
        // Event Name [required] Maybe you can set it as the same as the id.
        name: "Example Event",
        // Event Description [optional]
        // Maybe a i18n is needed to describe the event in variables languages.
        des: "Example Event description" 
    }];
  },

  getWidth: function() {
  },

  getHeight: function() {
  }
});
