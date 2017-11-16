import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import EnhancerTimeline from './components/timeline';
import { Icon, Timeline }  from 'antd';
import './index.less';

Enhancer.registerWidget( {
  construct: function( prof, zContext ) {
    const self = this;
    this.state = {
    };

    console.log(prof);
    this.getSourceData(prof.dataSourceId, {}, function (data) {
      self.state.data = data;
      self.render();
    });
  },




  render() {
    const self = this;
    const container = this.getContainer();
    const node = container[0];

    render(<EnhancerTimeline {...this.state} />, 
        node, () => {
        self.trig('complete');
    })
  },

  isValid: function() {
    return true;
  },

  getData() {
  },

  affected: function( zContext ) {
  },

  destroy: function() {
  },

  getInput: function( name ) {
  },
});
