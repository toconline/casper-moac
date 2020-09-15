import '@cloudware-casper/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebar extends PolymerElement {

  static get properties () {
    return {
      /**
       * This property sets the current sidebar's opened state.
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
       * This property saves the opened sidebar items before closing so that they're re-opened
       * when the sidebar is re-opened as well.
       *
       * @type {Array}
       */
      __openedSidebarItems: {
        type: Array,
        value: []
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          display: flex;
        }

        :host #sidebar-items-container {
          width: 50px;
          flex-grow: 0;
          flex-shrink: 0;
          overflow-y: auto;
          overflow-x: hidden;
          max-height: 100%;
          box-sizing: border-box;
          background-color: white;
          border-left: 1px solid #C5C5C5;
        }

        :host([opened]) #sidebar-items-container {
          width: var(--casper-moac-sidebar-width, 250px);
        }

        :host #sidebar-items-container ::slotted(casper-moac-sidebar-item:last-of-type) {
          box-shadow: 0 5px 10px 0 rgba(110, 110, 110, 0.25);
        }
      </style>

      <div id="sidebar-items-container" opened$="[[opened]]">
        <casper-moac-sidebar-item
          disable-toggle
          icon="[[__getIcon(opened)]]"
          title="[[__getTitle(opened)]]">
        </casper-moac-sidebar-item>
        <slot></slot>
      </div>
    `;
  }

  ready () {
    super.ready();

    afterNextRender(this, () => {
      this.shadowRoot.querySelector('slot').assignedElements().forEach(sidebarItem => {
        sidebarItem.addEventListener('click', event => {
          // Ignore click events that do not happen in the header element.
          if (!event.composedPath().some(element => element.classList && element.classList.contains('sidebar-item-header'))) return;

          this.opened
            ? sidebarItem.toggle()
            : sidebarItem.open();
        });

        // Open the sidebar if it's closed and one of the items is opened in the meantime.
        sidebarItem.addEventListener('opened-changed', () => {
          if (sidebarItem.opened && !this.opened) {
            this.opened = true;
          }
        });
      });
    });

    this.shadowRoot
      .querySelector('casper-moac-sidebar-item')
      .addEventListener('click', () => { this.opened = !this.opened; });
  }

  /**
   * This method returns the icon that should be displayed in the first casper-moac-sidebar-item
   * which is responsible for opening / closing the sidebar.
   *
   * @param {Boolean} opened The current opened state of the sidebar.
   */
  __getIcon (opened) {
    return opened
      ? 'fa-regular:angle-right'
      : 'fa-regular:angle-left';
  }

  /**
   * This method returns the text that should be displayed in the first casper-moac-sidebar-item
   * which is responsible for opening / closing the sidebar.
   *
   * @param {Boolean} opened The current opened state of the sidebar.
   */
  __getTitle (opened) {
    return opened ? 'Fechar' : '';
  }

  /**
   * This observer gets fired when the sidebar opens and closes.
   */
  __openedChanged () {
    afterNextRender(this, () => {
      if (this.opened) {
        this.__openedSidebarItems.forEach(sidebarItem => { sidebarItem.opened = true; });
        this.shadowRoot.querySelector('slot').assignedElements().forEach(sidebarItem => { sidebarItem.sidebarOpened = true; });
      } else {
        this.__openedSidebarItems = [];
        this.shadowRoot.querySelector('slot').assignedElements().forEach(sidebarItem => {
          if (sidebarItem.opened) {
            this.__openedSidebarItems.push(sidebarItem);
          }

          sidebarItem.opened = false;
          sidebarItem.sidebarOpened = false;
        });
      }
    });
  }
}

window.customElements.define('casper-moac-sidebar', CasperMoacSidebar);
