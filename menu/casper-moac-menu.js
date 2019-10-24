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
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          z-index: 2;
        }

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
          z-index: 1;
          opacity: 0.95;
          position: absolute;
          border-radius: 50%;
          transform: translate(-35%, -35%);
          background-color: var(--casper-moac-menu-background-color);
        }
      </style>
      <paper-icon-button
        id="menuTrigger"
        disabled="[[disabled]]"
        icon="[[__menuIcon(__opened, openIcon, closeIcon)]]"
        data-menu-opened$="[[__opened]]">
      </paper-icon-button>
      <casper-moac-menu-items
        id="menuItems"
        opened="{{__opened}}"
        vertical-align="top"
        horizontal-align="left">
        <slot></slot>
      </casper-moac-menu-items>
      <div id="circleBackground"></div>
    `;
  }

  ready () {
    super.ready();

    afterNextRender(this, () => {
      this.__bindMouseEnterAndLeave();
      this.__boundCloseOnEscapePress = this.__closeOnEscapePress.bind(this);

      this.$.menuTrigger.addEventListener('click', () => { this.toggle(); });
      this.$.menuTrigger.addEventListener('mouseover', () => { this.open(); });

      this.$.menuItems.positionTarget = this.$.menuTrigger;
      this.$.menuItems.verticalOffset = this.$.menuTrigger.offsetHeight + 10;
      this.$.menuItems.horizontalOffset = this.$.menuTrigger.offsetWidth / 2 - 30;
      this.$.menuItems.addEventListener('iron-overlay-canceled', event => {
        // Prevent the default action which would close the overlay and then the below listener would re-open it.
        if (event.detail.path.includes(this.$.menuTrigger) || event.detail.path.includes(this.$.circleBackground)) {
          event.preventDefault();
        }
      });

      // Close the menu if there was a click on the circle background.
      this.$.circleBackground.addEventListener('click', () => this.close());
    });
  }

  /**
   * Bind the mouseenter / mouseleave events that will change the opacity
   * when the user is hovering in / out the casper-moac-menu.
   */
  __bindMouseEnterAndLeave () {
    this.shadowRoot.host.addEventListener('mouseleave', () => {
      if (this.$.menuItems.opened) {
        // Start a fading out transition by reducing the opacity.
        const fadingOutDuration = 250;
        this.shadowRoot.host.style.transition = `opacity ${fadingOutDuration}ms linear`;
        this.shadowRoot.host.style.opacity = 0;

        this.__fadeOutTimeout = setTimeout(() => {
          this.close();
          this.shadowRoot.host.style.transition = '';
          this.shadowRoot.host.style.opacity = 1;
        }, fadingOutDuration);
      }
    });

    this.shadowRoot.host.addEventListener('mouseenter', () => {
      this.shadowRoot.host.style.transition = '';
      this.shadowRoot.host.style.opacity = 1;
      clearTimeout(this.__fadeOutTimeout);
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
    if (disabled) this.close();
  }

  __closeOnEscapePress (event) {
    if (event.code === 'Escape') this.close();
  }

  /**
   * Public method to open the menu.
   */
  open () {
    document.addEventListener('keydown', this.__boundCloseOnEscapePress);

    if (!this.__circleDimensions) {
      // Open the menu invisibly to calculate its dimensions.
      this.$.menuItems.style.visibility = 'hidden';
      this.$.menuItems.open();

      afterNextRender(this, () => {
        const menuItemsDimensions = Math.max(this.$.menuItems.scrollHeight, this.$.menuItems.scrollWidth) * 2;
        this.__circleDimensions = Math.max(500, menuItemsDimensions);

        this.$.circleBackground.style.width = `${this.__circleDimensions}px`;
        this.$.circleBackground.style.height = `${this.__circleDimensions}px`;
        this.$.menuItems.style.visibility = 'visible';
      });
    } else {
      this.$.menuItems.open();
      this.$.circleBackground.style.width = `${this.__circleDimensions}px`;
      this.$.circleBackground.style.height = `${this.__circleDimensions}px`;
    }
  }

  /**
   * Public method to close the menu.
   */
  close () {
    this.$.menuItems.close();
    this.$.circleBackground.style.width = 0;
    this.$.circleBackground.style.height = 0;
    document.removeEventListener('keydown', this.__boundCloseOnEscapePress);
  }

  /**
   * Public method that opens / closes the menu depending on its current state.
   */
  toggle () {
    this.__opened ? this.close() : this.open();
  }
}

customElements.define(CasperMoacMenu.is, CasperMoacMenu);