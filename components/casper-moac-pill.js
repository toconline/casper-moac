import '@cloudware-casper/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element';

class CasperMoacPill extends PolymerElement {

  static get properties () {
    return {
      /**
       * The pills's unique identifier.
       *
       * @type {String}
       */
      id: {
        type: String
      },
      /**
       * The function that will be invoked when the user clicks on the pill.
       *
       * @type {Function}
       */
      onClickCallback: {
        type: Function
      },
      /**
       * Flag that inverts the color scheme of the component.
       *
       * @type {Boolean}
       */
      reverse: {
        type: Boolean,
        reflectToAttribute: true
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          height: 25px;
          margin: 0 5px;
          padding: 0 10px;
          cursor: pointer;
          border-radius: 15px;
          white-space: nowrap;
          box-sizing: border-box;
          color: var(--on-primary-color);
          background-color: var(--primary-color);
          border: 1px solid var(--primary-color);
        }

        :host([reverse]) {
          color: var(--primary-color);
          background-color: var(--on-primary-color);
        }

        :host(:hover) {
          color: var(--primary-color);
          background-color: var(--on-primary-color);
        }

        :host([reverse]:hover) {
          color: var(--on-primary-color);
          background-color: var(--primary-color);
        }

        :host casper-icon {
          width: 15px;
          height: 15px;
          cursor: pointer;
          margin-left: 5px;
          color: var(--on-primary-color);
        }

        :host([reverse]) casper-icon {
          color: var(--primary-color);
        }

        :host(:hover) casper-icon {
          color: var(--primary-color);
        }

        :host([reverse]:hover) casper-icon {
          color: var(--on-primary-color);
        }
      </style>

      <slot></slot>
      <casper-icon icon="fa-light:times"></casper-icon>
    `;
  }

  ready () {
    super.ready();

    this.addEventListener('click', () => {
      if (this.onClickCallback) this.onClickCallback(this.id);
    });
  }
}

window.customElements.define('casper-moac-pill', CasperMoacPill);