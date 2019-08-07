import './casper-moac-menu-item';
import './casper-moac-menu-items';
import '@casper2020/casper-icons/casper-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacMenu extends PolymerElement {

  static get is () {
    return 'casper-moac-menu';
  }

  static get properties () {
    return {
      /**
       * Flag that states if the menu is currently disabled or not.
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false,
        observer: '__disabledChanged'
       },
       /**
        * Icon that will appear when the casper-moac-menu
        * is closed.
        * @type {String}
        */
       openIcon: {
         type: String,
         value: 'casper-icons:plus'
       },
       /**
        * Icon that will appear when the casper-moac-menu
        * is opened.
        * @type {String}
        */
       closeIcon: {
        type: String,
        value: 'casper-icons:clear'
      },
    };
  }

  static get template () {
    return html`
      <style>
        #menuTrigger {
          padding: 0;
          z-index: 2;
          width: 55px;
          height: 55px;
          color: white;
          border-radius: 50%;
          background-color: var(--primary-color);
        }

        #menuTrigger[disabled] {
          color: #A8A8A8;
          background-color: #EAEAEA;
        }

        #menuTrigger:not(disabled):hover {
          filter: brightness(90%);
          transition: filter 200ms linear;
        }

        #menuTrigger[data-menu-opened] {
          background-color: white;
          color: var(--primary-color);
          box-shadow: 5px 5px 5px 0px rgba(0, 0, 0, 0.25);
        }

        #circleBackground {
          width: 0;
          height: 0;
          z-index: 1;
          opacity: 0.95;
          position: absolute;
          border-radius: 50%;
          filter: brightness(200%);
          transform: translate(-40%, -40%);
          background-color: var(--primary-color);
          transition: width 200ms ease-in, height 200ms ease-in;
        }

        #circleBackground[data-menu-opened] {
          width: 500px;
          height: 500px;
        }
      </style>
      <paper-icon-button
        id="menuTrigger"
        disabled="[[disabled]]"
        icon="[[__menuIcon(__opened)]]"
        data-menu-opened$="[[__opened]]">
      </paper-icon-button>
      <casper-moac-menu-items
        id="menuItems"
        opened="{{__opened}}"
        vertical-align="top"
        horizontal-align="left">
        <slot></slot>
      </casper-moac-menu-items>
      <div id="circleBackground" data-menu-opened$="[[__opened]]"></div>
    `;
  }

  ready () {
    super.ready();

    afterNextRender(this, () => {
      const menuTriggerDimensions = this.$.menuTrigger.getBoundingClientRect();
      this.$.menuTrigger.addEventListener('click', () => { this.$.menuItems.toggle(); });
      this.$.menuTrigger.addEventListener('mouseover', () => { this.$.menuItems.open(); });

      this.$.menuItems.positionTarget = this.$.menuTrigger;
      this.$.menuItems.verticalOffset = menuTriggerDimensions.height + 10;
      this.$.menuItems.horizontalOffset = menuTriggerDimensions.width / 2 - 30;
      this.$.menuItems.addEventListener('iron-overlay-canceled', event => {
        // Prevent the default action which would close the overlay and then the below listener would re-open it.
        if (event.detail.path.includes(this.$.menuTrigger) || event.detail.path.includes(this.$.circleBackground)) {
          event.preventDefault();
        }
      });

      // Close the menu if there was a click on one of the items.
      this.$.menuItems.addEventListener('click', event => {
        if (event.composedPath().some(element => element.tagName && element.tagName.toLowerCase() === 'casper-moac-menu-item')) {
          this.$.menuItems.close();
        }
      });
    });
  }

  /**
   * Method that changes the menu's icon when it opens / closes.
   * @param {Boolean} opened Boolean that states if the menu is open or not.
   */
  __menuIcon (opened) {
    return opened ? this.closeIcon : this.openIcon;
  }

  /**
   * Observer that fires when the menu is enabled / disabled and react accordingly.
   */
  __disabledChanged (disabled) {
    if (disabled) this.$.menuItems.close();
  }

  /**
   * Public method to open the menu.
   */
  open () {
    this.$.menuItems.open();
  }

  /**
   * Public method to close the menu.
   */
  close () {
    this.$.menuItems.close();
  }

  /**
   * Public method that opens / closes the menu depending on its current state.
   */
  toggle () {
    this.$.menuItems.toggle();
  }
}

customElements.define(CasperMoacMenu.is, CasperMoacMenu);