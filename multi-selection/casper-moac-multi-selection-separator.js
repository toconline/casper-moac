import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionSeparator extends PolymerElement {

  static get template () {
    return html`
      <style>
        #separator {
          width: 1px;
          height: 25px;
          margin: 10px 5px 0 5px;
          background-color: var(--primary-color);
        }
      </style>
      <div id="separator"></div>
    `;
  }
}

customElements.define('casper-moac-multi-selection-separator', CasperMoacMultiSelectionSeparator);