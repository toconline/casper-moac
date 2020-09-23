import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacColumn extends GridColumnElement {

  static get properties () {
    return {
      /**
       * The header's tooltip.
       *
       * @type {String}
       */
      tooltip: String,
    }
  }

  static get template () {
    return html`
      <template>
        <div class="casper-moac-column" tooltip$="[[tooltip]]">[[header]]</div>
      </template>
    `;
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the template and bind the dataHost.
   */
  _prepareHeaderTemplate () {
    const headerTemplate = this._prepareTemplatizer(this.shadowRoot.querySelector('template'));
    headerTemplate.templatizer.dataHost = this;

    return headerTemplate;
  }
}

window.customElements.define('casper-moac-column', CasperMoacColumn);