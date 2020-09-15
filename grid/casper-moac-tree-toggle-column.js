import './casper-moac-tree-toggle.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacTreeToggleColumn extends GridColumnElement {

  static get properties () {
    return {
      path: String
    }
  }

  static get template () {
    return html`
      <template class="header"></template>
      <template class="body">
        <casper-moac-tree-toggle
          expanded="{{item.__expanded}}"
          children-count="[[__getChildrenCount(item)]]">
        </casper-moac-tree-toggle>
      </template>
    `;
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the header's template and bind the dataHost.
   */
  _prepareHeaderTemplate () {
    return this.__prepareTemplate(this.shadowRoot.querySelector('template.header'));
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the body's template and bind the dataHost.
   */
  _prepareBodyTemplate () {
    return this.__prepareTemplate(this.shadowRoot.querySelector('template.body'));
  }

  /**
   * This method is invoked by both _prepareHeaderTemplate and _prepareBodyTemplate which are vaadin-grid
   * protected methods to setup both templates.
   *
   * @param {Element} template The template element.
   */
  __prepareTemplate (template) {
    const bodyTemplate = this._prepareTemplatizer(template);
    bodyTemplate.templatizer.dataHost = this;

    return bodyTemplate;
  }

  /**
   * This method is invoked by the UI to get the number of children of a specific element.
   *
   * @param {Object} item The item whose children will be counted.
   */
  __getChildrenCount (item) {
    return item[this.path] && item[this.path].constructor.name === 'Array' ? item[this.path].length : 0;
  }
}

window.customElements.define('casper-moac-tree-toggle-column', CasperMoacTreeToggleColumn);
