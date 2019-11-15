import '@casper2020/casper-icons/casper-icon.js';
import '@polymer/paper-ripple/paper-ripple.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebarItem extends PolymerElement {

  static get is () {
    return 'casper-moac-sidebar-item';
  }

  static get properties () {
    return {
      /**
       * The icon that will be used on the sidebar item's header.
       *
       * @type {String}
       */
      icon: {
        type: String
      },
      /**
       * The sidebar item's title.
       *
       * @type {String}
       */
      title: {
        type: String
      },
      disableExpansionCollapse: {
        type: Boolean,
        value: false
      },
      /**
       * Boolean that states if the current sidebar item is opened or not.
       *
       * @type {Boolean}
       */
      opened: {
        type: Boolean,
        value: false,
        observer: '__openedChanged'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }

        .sidebar-item-header {
          position: relative;
          display: flex;
          user-select: none;
          justify-content: space-between;
          padding: 15px;
          background-color: #E2E2E2;
          border-bottom: 1px solid #CCCCCC;
          transition: background-color 100ms linear;
        }

        .sidebar-item-header:hover {
          cursor: pointer;
          background-color: darkgray;
        }

        .sidebar-item-header paper-ripple {
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .sidebar-item-header casper-icon {
          --casper-icon-fill-color: #3C3C3C;
          margin-right: 10px;
          transition: transform 200ms linear;
        }

        .sidebar-item-header #header-dropdown-icon[rotate] {
          transform: rotate(180deg);
        }

        .sidebar-item-header:hover casper-icon {
          --casper-icon-fill-color: #3E3E3E;
        }

        .sidebar-item-header .sidebar-item-header-title {
          display: flex;
          color: #3C3C3C;
          align-items: center;
        }

        .sidebar-item-body {
          height: auto;
          max-height: 0;
          overflow: hidden;
          transition: max-height 150ms ease-in;
        }

        .sidebar-item-body .sidebar-item-content {
          padding: 15px;
        }
      </style>
      <div class="sidebar-item-header" id="header">
        <paper-ripple></paper-ripple>
        <div class="sidebar-item-header-title">
          <casper-icon icon="[[icon]]"></casper-icon>
          [[title]]
        </div>

        <template is="dom-if" if="[[!disableExpansionCollapse]]">
          <casper-icon icon="fa-regular:angle-down" id="header-dropdown-icon"></casper-icon>
        </template>
      </div>
      <div class="sidebar-item-body" id="body">
        <div class="sidebar-item-content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.$.header.addEventListener('click', () => this.toggle());
  }

  /**
   * Toggle the current opened state of the sidebar item.
   */
  toggle () {
    if (this.disableExpansionCollapse) return;

    this.opened = !this.opened;
  }

  /**
   * Open the sidebar item.
   */
  open () {
    if (this.disableExpansionCollapse) return;

    this.opened = true;
  }

  /**
   * Close the sidebar item.
   */
  close () {
    if (this.disableExpansionCollapse) return;

    this.opened = false;
  }

  /**
   * Observer that gets fired when the opened property changes and triggers the sidebar item opening / close animation.
   *
   * @param {Boolean} opened The current opened state of the sidebar item.
   */
  __openedChanged (opened) {
    if (this.disableExpansionCollapse) return;

    afterNextRender(this, () => {
      if (opened) {
        this.$.body.style.maxHeight = `${this.$.body.scrollHeight}px`;
        this.shadowRoot.querySelector('#header-dropdown-icon').setAttribute('rotate', true);
      } else {
        this.$.body.style.maxHeight = 0;
        this.shadowRoot.querySelector('#header-dropdown-icon').removeAttribute('rotate');
      }
    });
  }
}

customElements.define(CasperMoacSidebarItem.is, CasperMoacSidebarItem);
