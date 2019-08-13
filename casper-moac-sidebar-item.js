import '@casper2020/casper-icons/casper-icons.js';
import '@polymer/iron-icon/iron-icon.js';
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
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background-color: #E2E2E2;
          transition: background-color 100ms linear;
        }

        .sidebar-item-header:hover {
          cursor: pointer;
          background-color: darkgray;
        }

        .sidebar-item-header iron-icon {
          color: #676767;
          transition: transform 200ms linear;
        }

        .sidebar-item-header #headerDropDownIcon[rotate] {
          transform: rotate(180deg);
        }

        .sidebar-item-header:hover iron-icon {
          color: #3E3E3E;
        }

        .sidebar-item-body {
          height: 0;
          overflow: hidden;
          transition: height 150ms ease-in;
        }
        
        .sidebar-item-body .sidebar-item-content {
          padding: 15px;
        }
      </style>
      <div class="sidebar-item-header" id="header">
        <iron-icon icon="[[icon]]"></iron-icon>
        <iron-icon icon="casper-icons:arrow-drop-down" id="headerDropDownIcon"></iron-icon>
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

  toggle () {
    this.opened = !this.opened;
  }

  open () {
    this.opened = true;
  }

  close () {
    this.opened = false;
  }

  __openedChanged (opened) {
    afterNextRender(this, () => {
      if (opened) {
        this.$.body.style.height = `${this.$.body.scrollHeight}px`;
        this.$.headerDropDownIcon.setAttribute('rotate', true);
      } else {
        this.$.body.style.height = 0;
        this.$.headerDropDownIcon.removeAttribute('rotate');
      }
    });
  }
}

customElements.define(CasperMoacSidebarItem.is, CasperMoacSidebarItem);