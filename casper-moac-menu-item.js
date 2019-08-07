import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@casper2020/casper-icons/casper-icons.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

export class CasperMoacMenuItem extends PolymerElement {

  static get is () {
    return 'casper-moac-menu-item';
  }

  static get template () {
    return html`
      <style>
        #container {
          display: flex;
          color: #212121;
          font-size: 15px;
          user-select: none;
          border-radius: 5px;
          align-items: center;
          padding: 8px 25px 8px 15px;
        }

        #container[disabled] {
          color: #A8A8A8;
        }

        #container:not([disabled]):hover {
          color: white;
          cursor: pointer;
          background-color: var(--primary-color);
          transition: background-color 100ms linear;
        }

        /* Paper-icon-button */
        #container paper-icon-button {
          width: 30px;
          height: 30px;
          padding: 5px;
          margin-left: 0;
          border-radius: 50%;
          margin-right: 10px;
          background-color: var(--primary-color);
        }

        #container:not([disabled]) paper-icon-button {
          color: white;
        }

        #container:not([disabled]):hover paper-icon-button {
          background-color: white;
          color: var(--primary-color);
        }

        #container[disabled] paper-icon-button {
          color: #A8A8A8;
          background-color: transparent;
        }
      </style>
      <div id="container" disabled$="[[disabled]]">
        <paper-icon-button icon="[[icon]]"></paper-icon-button>
        <slot></slot>
      </div>
    `;
  }

  static get properties () {
    return {
      /**
       * Icon that will be used in the paper-icon-button.
       * @type {String}
       */
      icon: {
        type: String,
      },
      /**
       * Flag that enables / disables the menu item.
       */
      disabled: {
        type: Boolean,
        value: false,
        observer: '__disabledChanged'
      }
    };
  }

  __disabledChanged () {
    this.shadowRoot.host.style.pointerEvents = this.disabled ? 'none' : '';
  }
}

customElements.define(CasperMoacMenuItem.is, CasperMoacMenuItem);