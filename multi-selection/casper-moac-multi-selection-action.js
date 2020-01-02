import '@casper2020/casper-icons/casper-icon.js';
import '@casper2020/casper-icons/casper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionAction extends PolymerElement {

  static get properties () {
    return {
      /**
       * Icon that will be used in the paper-button.
       *
       * @type {String}
       */
      icon: {
        type: String
      },
      /**
       * Flag that enables / disables the multi selection action.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
      /**
       * Flag that enables / disables the reverse styling for the buttons where the primary color becomes the text color instead
       * of the background.
       *
       * @type {Boolean}
       */
      reverse: {
        type: Boolean,
        value: false
      }
    };
  }

  static get template () {
    return html`
      <style>
        casper-icon-button {
          width: 25px;
          height: 25px;
          padding: 5px;
          font-size: 12px;
          margin: 10px 2px 0;
        }
      </style>

      <casper-icon-button icon="[[icon]]" disabled="[[disabled]]" reverse="[[reverse]]">
        <slot></slot>
      </casper-icon-button>
    `;
  }
}

customElements.define('casper-moac-multi-selection-action', CasperMoacMultiSelectionAction);