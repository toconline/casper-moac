import './casper-moac-menu-item';
import '@cloudware-casper/casper-icons/casper-icon.js';
import '@cloudware-casper/casper-icons/casper-icon-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacMenu extends PolymerElement {

  static get properties () {
    return {
      /**
       * Flag that states if the menu is opened or not.
       *
       * @type {Boolean}
       */
      opened: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        observer: '__openedChanged'
      },
      /**
       * Flag that states if the menu is currently disabled or not.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false,
        observer: '__disabledChanged'
      },
      /**
       * Icon that will appear when the casper-moac-menu is closed.
       *
       * @type {String}
       */
      openIcon: {
        type: String,
        value: 'fa-light:plus'
      },
      /**
       * Icon that will appear when the casper-moac-menu is opened.
       *
       * @type {String}
       */
      closeIcon: {
        type: String,
        value: 'fa-light:times'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host #menu-trigger {
          z-index: 3;
          width: 55px;
          height: 55px;
          padding: 10px;
          cursor: pointer;
        }

        :host([opened]) #menu-trigger {
          box-shadow: 5px 5px 5px 0px rgba(0, 0, 0, 0.25);
        }

        :host #menu-items {
          opacity: 0;
          display: flex;
          position: absolute;
          visibility: hidden;
          flex-direction: column;
          transition: opacity 200ms linear;
        }

        :host([opened]) #menu-items {
          z-index: 3;
          opacity: 1;
          visibility: visible;
        }

        :host #circle-background {
          z-index: 2;
          opacity: 0;
          position: absolute;
          border-radius: 50%;
          transform: translate(-35%, -35%);
          background-color: var(--casper-moac-menu-background-color);
          transition: width 200ms linear,
                      height 200ms linear,
                      opacity 200ms linear;
        }

        :host([opened]) #circle-background {
          opacity: 0.95;
        }

        ::slotted(casper-moac-menu-item:first-of-type) {
          padding-top: 8px;
        }
      </style>
      <casper-icon-button
        with-border
        id="menu-trigger"
        disabled="[[disabled]]"
        icon="[[__menuIcon(__opened, openIcon, closeIcon)]]">
      </casper-icon-button>

      <div id="circle-background"></div>
      <div id="menu-items">
        <slot></slot>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.__bindMouseEnterAndLeave();
    this.__boundCloseOnEscapePress = this.__closeOnEscapePress.bind(this);

    this.$['menu-items'].addEventListener('click', () => this.close());
    this.$['circle-background'].addEventListener('click', () => this.close());
    this.$['menu-trigger'].addEventListener('click', () => { this.opened = !this.opened; });

    afterNextRender(this, () => {
      this.__menuBackgroundDimensions = Math.max(500, Math.max(this.$['menu-items'].scrollHeight, this.$['menu-items'].scrollWidth) * 2);
    });
  }

  /**
   * Bind the mouseenter / mouseleave events that will change the opacity when the user is hovering in / out the casper-moac-menu.
   */
  __bindMouseEnterAndLeave () {
    this.shadowRoot.host.addEventListener('mouseenter', () => {
      clearTimeout(this.__closeDelayTimeout);
      this.$['menu-items'].style.opacity = '';
      this.$['circle-background'].style.opacity = '';
    });

    this.shadowRoot.host.addEventListener('mouseleave', () => {
      if (this.opened) {
        // Start a fading out transition by reducing the opacity.
        this.$['menu-items'].style.opacity = 0;
        this.$['circle-background'].style.opacity = 0;

        this.__closeDelayTimeout = setTimeout(() => {
          this.close();
          this.$['menu-items'].style.opacity = '';
          this.$['circle-background'].style.opacity = '';
        }, 200);
      }
    });
  }

  /**
   * Method that changes the menu's icon when it opens / closes.
   *
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

  /**
   * Close the casper-moac-menu when the user presses the key Escape.
   */
  __closeOnEscapePress (event) {
    if (event.code === 'Escape') this.close();
  }

  __openedChanged (opened) {
    // If the user presses the menu trigger too fast the background dimensions might not exist yet.
    if (!this.__menuBackgroundDimensions) return afterNextRender(this, () => this.__openedChanged(opened));

    if (!opened) {
      this.$['menu-trigger'].icon = this.openIcon;
      this.$['circle-background'].style.width = 0;
      this.$['circle-background'].style.height = 0;

      document.removeEventListener('keydown', this.__boundCloseOnEscapePress);
    } else {
      this.__menuBackgroundDimensions = Math.max(500, Math.max(this.$['menu-items'].scrollHeight, this.$['menu-items'].scrollWidth) * 2);
      this.$['menu-trigger'].icon = this.closeIcon;
      this.$['circle-background'].style.width = `${this.__menuBackgroundDimensions}px`;
      this.$['circle-background'].style.height = `${this.__menuBackgroundDimensions}px`;


      document.addEventListener('keydown', this.__boundCloseOnEscapePress);
    }
  }

  /**
   * Public method to open the menu.
   */
  open () {
    this.opened = true;
  }

  /**
   * Public method to close the menu.
   */
  close () {
    this.opened = false;
  }

  /**
   * Public method that opens / closes the menu depending on its current state.
   */
  toggle () {
    this.opened
      ? this.close()
      : this.open();
  }
}

window.customElements.define('casper-moac-menu', CasperMoacMenu);