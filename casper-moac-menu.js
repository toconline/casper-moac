import './casper-moac-menu-items';
import { CasperMoacMenuItem } from './casper-moac-menu-item';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@casper2020/casper-icons/casper-icons.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacMenu extends PolymerElement {

  static get is () {
    return 'casper-moac-menu';
  }

  static get template () {
    return html`
      <style>
        #menuTrigger {
          margin: 0;
          padding: 0;
          z-index: 2;
          width: 55px;
          height: 55px;
          min-width: unset;
          border-radius: 50%;
          background-color: var(--primary-color);
        }

        #menuTrigger:hover {
          filter: brightness(90%);
          transition: filter 200ms linear;
        }

        #menuTrigger[data-menu-opened] {
          background-color: white;
          box-shadow: 5px 5px 5px 0px rgba(0, 0, 0, 0.25);
        }

        #menuTrigger iron-icon {
          width: 100%;
          height: 100%;
          color: white;
        }

        #menuTrigger[data-menu-opened] iron-icon {
          color: var(--primary-color);
        }

        #circleBackground {
          width: 0;
          height: 0;
          z-index: 1;
          opacity: 0.9;
          position: absolute;
          border-radius: 50%;
          filter: brightness(200%);
          transform: translate(-40%, -40%);
          background-color: var(--primary-color);
          transition: width 200ms ease-in,
                      height 200ms ease-in;
        }

        #circleBackground[data-menu-opened] {
          width: 500px;
          height: 500px;
        }
      </style>
      <paper-button id="menuTrigger" data-menu-opened$="[[_opened]]">
        <iron-icon icon="[[_menuIcon(_opened)]]"></iron-icon>
      </paper-button>
      </div>
      <casper-moac-menu-items
        id="menuItems"
        opened="{{_opened}}"
        vertical-align="top"
        horizontal-align="left"
        no-cancel-on-outside-click>
        <slot></slot>
      </casper-moac-menu-items>
      <div id="circleBackground" data-menu-opened$="[[_opened]]"></div>
    `;
  }

  ready () {
    super.ready();

    afterNextRender(this, () => {
      const menuTriggerDimensions = this.$.menuTrigger.getBoundingClientRect();

      this.$.menuItems.positionTarget = this.$.menuTrigger;
      this.$.menuItems.verticalOffset = menuTriggerDimensions.height + CasperMoacMenuItem.buttonMargin;
      this.$.menuItems.horizontalOffset = menuTriggerDimensions.width / 2 - CasperMoacMenuItem.buttonRadius;

      this.$.menuTrigger.addEventListener('click', () => {
        this.$.menuItems.toggle();
      });
    });
  }

  _menuIcon (opened) {
    return opened ? 'casper-icons:clear' : 'casper-icons:plus';
  }
}

customElements.define(CasperMoacMenu.is, CasperMoacMenu);