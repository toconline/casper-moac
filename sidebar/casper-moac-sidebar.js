import '@casper2020/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebar extends PolymerElement {

  static get is () {
    return 'casper-moac-sidebar';
  }

  static get properties () {
    return {
      open: {
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
          width: 0;
          flex-grow: 0;
          flex-shrink: 0;
          overflow: auto;
          max-height: 100%;
          box-sizing: border-box;
          transition: width 100ms linear;
        }

        :host([open]) #sidebar-items-container {
          border-left: 1px solid #E2E2E2;
          width: var(--casper-moac-sidebar-width, 250px);
        }

        :host #sidebar-shortcut {
          width: 50px;
          display: flex;
          flex-direction: column;
          background-color: white;
          border-left: 1px solid #E2E2E2;
          transition: width 100ms linear;
        }

        :host([open]) #sidebar-shortcut {
          width: 0;
        }

        :host #sidebar-shortcut casper-icon {
          width: 50px;
          height: 50px;
          padding: 13px;
          box-sizing: border-box;
          border-bottom: 1px solid #CCCCCC;
          --casper-icon-fill-color: #3C3C3C;
        }

        :host #sidebar-shortcut casper-icon:hover {
          cursor: pointer;
          background-color: #E2E2E2;
        }
      </style>

      <div id="sidebar-items-container" open$="[[open]]">
        <casper-moac-sidebar-item
          disable-expansion-collapse
          title="[[__getTitle(open)]]"
          icon="fa-regular:angle-right">
        </casper-moac-sidebar-item>
        <slot></slot>
      </div>

      <div id="sidebar-shortcut">
        <casper-icon icon="fa-regular:angle-left" on-click="__openSidebar"></casper-icon>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.shadowRoot.querySelector('casper-moac-sidebar-item').addEventListener('click', () => {
      this.open = !this.open;
    });

    afterNextRender(this, () => {
      this.shadowRoot.querySelector('slot').assignedElements().shift().assignedElements().forEach(sidebarItem => {
        const casperIcon = document.createElement('casper-icon');
        casperIcon.icon = sidebarItem.icon;
        casperIcon.addEventListener('click', () => {
          this.open = true;
        });

        this.$['sidebar-shortcut'].appendChild(casperIcon);
      });
    });
  }

  __getIcon (open) {
    return open ? 'fa-regular:angle-right' : 'fa-regular:angle-left';
  }

  __getTitle (open) {
    return open ? 'Fechar' : 'Abrir';
  }

  __openSidebar () {
    this.open = true;
  }
}

customElements.define(CasperMoacSidebar.is, CasperMoacSidebar);
