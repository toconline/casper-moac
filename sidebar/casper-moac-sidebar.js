import '@casper2020/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebar extends PolymerElement {

  static get is () {
    return 'casper-moac-sidebar';
  }

  static get properties () {
    return {
      opened: {
        type: Boolean,
        value: true,
        reflectToAttribute: true
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
          overflow: auto;
          max-height: 100%;
          box-sizing: border-box;
          background-color: #E2E2E2;
          border-left: 1px solid #C5C5C5;
        }

        :host([opened]) #sidebar-items-container {
          width: var(--casper-moac-sidebar-width, 250px);
        }

        :host #sidebar-items-container ::slotted(casper-moac-sidebar-item:last-of-type) {
          box-shadow: 0 10px 20px 0 rgba(110, 110, 110, 0.65);
        }
      </style>

      <div id="sidebar-items-container" opened$="[[opened]]">
        <casper-moac-sidebar-item
          disable-expansion-collapse
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
      this.__sidebarItems = this.shadowRoot.querySelector('slot').assignedElements().shift().assignedElements();
      this.__sidebarItems.forEach((sidebarItem, sidebarItemIndex) => {
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
            this.__openSidebar();
          }
        });
      });
    });

    this.shadowRoot.querySelector('casper-moac-sidebar-item').addEventListener('click', () => {
      this.opened
        ? this.__closeSidebar()
        : this.__openSidebar();
    });
  }

  /**
   * This method returns the icon that should be displayed in the first casper-moac-sidebar-item
   * which is responsible for opening / closing the sidebar.
   *
   * @param {Boolean} opened The current opened state of the sidebar.
   */
  __getIcon (opened) {
    return opened ? 'fa-regular:angle-right' : 'fa-regular:angle-left';
  }

  /**
   * This method returns the text that should be displayed in the first casper-moac-sidebar-item
   * which is responsible for opening / closing the sidebar.
   *
   * @param {Boolean} opened The current opened state of the sidebar.
   */
  __getTitle (opened) {
    return opened ? 'Fechar menu' : '';
  }

  /**
   * This method opens the sidebar as well as the casper-moac-sidebar-item that were previously open.
   */
  __openSidebar () {
    this.opened = true;
    this.__openedSidebarItems.forEach(sidebarItem => sidebarItem.opened = true);
  }

  /**
   * This method closes the sidebar as well as all the casper-moac-sidebar-item.
   */
  __closeSidebar () {
    this.opened = false;
    this.__openedSidebarItems = [];
    this.__sidebarItems.forEach(sidebarItem => {
      if (sidebarItem.opened) {
        this.__openedSidebarItems.push(sidebarItem);
      }
      sidebarItem.opened = false;
    });
  }
}

customElements.define(CasperMoacSidebar.is, CasperMoacSidebar);
