import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionAction extends PolymerElement {

  static get is () {
    return 'casper-moac-multi-selection-action';
  }

  static get properties () {
    return {
      icon: {
        type: String
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          height: 25px;
          margin-top: 10px;
        }

        paper-button {
          color: white;
          height: 25px;
          font-size: 10px;
          font-weight: bold;
          border-radius: 15px;
          padding: 0 7px 0 5px;
          background-color: var(--primary-color);
        }

        paper-button.only-icon {
          width: 25px;
          padding: 0;
          min-width: unset;
          border-radius: 50%;
        }

        paper-button iron-icon {
          width: 19px;
          height: 19px;
        }
      </style>

      <paper-button id="button">
        <template is="dom-if" if="[[icon]]">
          <iron-icon icon="[[icon]]"></iron-icon>
        </template>
        <slot></slot>
      </paper-button>
    `;
  }

  ready () {
    super.ready();

    if (this.shadowRoot.querySelector('slot').assignedNodes().length === 0) {
      this.$.button.classList.add('only-icon');
    }
  }
}

customElements.define(CasperMoacMultiSelectionAction.is, CasperMoacMultiSelectionAction);