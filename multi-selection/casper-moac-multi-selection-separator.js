import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionSeparator extends PolymerElement {

  static get is () {
    return 'casper-moac-multi-selection-separator';
  }

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

customElements.define(CasperMoacMultiSelectionSeparator.is, CasperMoacMultiSelectionSeparator);