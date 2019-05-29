import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@casper2020/casper-icons/casper-icons.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

export class CasperMoacMenuItem extends PolymerElement {

  static get is () {
    return 'casper-moac-menu-item';
  }

  static get buttonRadius () {
    return 15;
  }

  static get buttonMargin () {
    return 20;
  }

  static get template () {
    return html`
      <style>
        :host {
          cursor: pointer;
        }

        #container {
          display: flex;
          align-items: center;
        }

        #button {
          padding: 0;
          color: white;
          margin-left: 0;
          min-width: unset;
          border-radius: 50%;
          margin-right: 10px;
          background-color: var(--primary-color);
        }

        #button:hover {
          filter: brightness(90%);
          transition: filter 200ms linear;
        }
      </style>
      <div id="container">
        <paper-button id="button">
          <iron-icon icon="[[icon]]"></iron-icon>
        </paper-button>
        [[text]]
      </div>
    `;
  }

  static get properties () {
    return {
      icon: String,
      text: String,
      onClick: Object
    };
  }

  ready () {
    super.ready();

    this.$.button.style.width = `${CasperMoacMenuItem.buttonRadius * 2}px`;
    this.$.button.style.height = `${CasperMoacMenuItem.buttonRadius * 2}px`;
    this.$.container.style.marginBottom = `${CasperMoacMenuItem.buttonMargin}px`;
  }
}

customElements.define(CasperMoacMenuItem.is, CasperMoacMenuItem);