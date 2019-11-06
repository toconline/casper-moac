import '@casper2020/casper-icons/casper-icon.js';
import '@casper2020/casper-icons/casper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionAction extends PolymerElement {

  static get is () {
    return 'casper-moac-multi-selection-action';
  }

  static get properties () {
    return {
      /**
       * Icon that will be used in the paper-button.
       * @type {String}
       */
      icon: {
        type: String
      },
      /**
       * Flag that enables / disables the multi selection action.
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          height: 25px;
          margin-top: 10px;
          margin-left: 2px;
          margin-right: 2px;
        }

        :host([disabled]) {
          cursor: not-allowed;
          pointer-events: none;
        }

        casper-icon-button {
          width: 25px;
          height: 25px;
          padding: 5px;
        }

        #button {
          height: 25px;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 15px;
          color: var(--on-primary-color);
          background-color: var(--primary-color);
        }

        #button:hover {
          color: var(--primary-color);
          background-color: var(--on-primary-color);
        }

        #button[disabled] {
          pointer-events: none;
          color: var(--disabled-text-color);
          background-color: var(--disabled-background-color);
        }

        #button casper-icon {
          width: 15px;
          height: 15px;
          margin-right: 5px;
        }

        #button[disabled] casper-icon {
          --casper-icon-fill-color: var(--disabled-text-color);
        }

        #button:not([disabled]) casper-icon {
          --casper-icon-fill-color: var(--on-primary-color);
        }

        #button:hover casper-icon {
          --casper-icon-fill-color: var(--primary-color);
        }
      </style>

      <template is="dom-if" if="[[!__onlyIcon]]">
        <paper-button id="button" disabled="[[disabled]]">
          <casper-icon icon="[[icon]]"></casper-icon>
          <slot></slot>
        </paper-button>
      </template>

      <template is="dom-if" if="[[__onlyIcon]]">
        <casper-icon-button icon="[[icon]]" disabled="[[disabled]]"></casper-icon-button>
      </template>
    `;
  }

  ready () {
    super.ready();

    this.__onlyIcon = this.childNodes.length === 0;
  }
}

customElements.define(CasperMoacMultiSelectionAction.is, CasperMoacMultiSelectionAction);
