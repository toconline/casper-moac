/* 
 * Copyright (C) 2019 Cloudware S.A. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import '@cloudware-casper/casper-icons/casper-icon.js';
import '@polymer/paper-ripple/paper-ripple.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebarItem extends PolymerElement {

  static get properties () {
    return {
      /**
       * Flag that states if the sidebar is currently opened. If it is, the title will be displayed.
       */
      sidebarOpened: {
        type: Boolean,
        observer: '__openedChanged'
      },
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
      /**
       * Flag that states if the user can use the component's public methods to toggle the component's state.
       *
       * @type {Boolean}
       */
      disableToggle: {
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
        notify: true,
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
          border-bottom: 1px solid #C5C5C5;
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
          color: #3C3C3C;
          margin-right: 15px;
          transition: transform 200ms linear;
          flex-shrink: 0;
        }

        .sidebar-item-header #header-dropdown-icon[rotate] {
          transform: rotate(180deg);
        }

        .sidebar-item-header:hover casper-icon {
          color: #3E3E3E;
        }

        .sidebar-item-header .sidebar-item-header-title {
          display: flex;
          color: #3C3C3C;
          align-items: center;
        }

        .sidebar-item-header .sidebar-item-header-title.sidebar-item-header-title--collapsed span {
          display: none;
        }

        .sidebar-item-outer-body {
          max-height: 0;
          overflow: hidden;
          background-color: white;
          transition: max-height 150ms ease-in;
        }

        .sidebar-item-outer-body .sidebar-item-inner-body {
          height: fit-content;
        }

        .sidebar-item-outer-body .sidebar-item-inner-body .sidebar-item-content {
          padding: 15px;
        }
      </style>
      <div class="sidebar-item-header" id="header">
        <paper-ripple></paper-ripple>
        <div class="sidebar-item-header-title" id="title">
          <casper-icon icon="[[icon]]"></casper-icon>
          <span>[[title]]</span>
        </div>

        <template is="dom-if" if="[[!disableToggle]]">
          <casper-icon icon="fa-regular:angle-down" id="header-dropdown-icon"></casper-icon>
        </template>
      </div>
      <div class="sidebar-item-outer-body" id="outerBody">
        <div class="sidebar-item-inner-body" id="innerBody">
          <div class="sidebar-item-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  ready () {
    super.ready();

    const resizeObserver = new ResizeObserver(() => {
      if (!this.opened) return;

      this.$.outerBody.style.maxHeight = `${this.$.innerBody.clientHeight}px`;
    });

    resizeObserver.observe(this.$.innerBody);
  }

  /**
   * Toggle the current opened state of the sidebar item.
   */
  toggle () {
    if (this.disableToggle) return;

    this.opened = !this.opened;
  }

  /**
   * Open the sidebar item.
   */
  open () {
    if (this.disableToggle) return;

    this.opened = true;
  }

  /**
   * Close the sidebar item.
   */
  close () {
    if (this.disableToggle) return;

    this.opened = false;
  }

  /**
   * Observer that gets fired when the opened property changes and triggers the sidebar item opening / close animation.
   */
  __openedChanged () {
    afterNextRender(this, () => {
      const dropdownIcon = this.shadowRoot.querySelector('#header-dropdown-icon');

      if (this.opened && this.sidebarOpened) {
        this.$.outerBody.style.maxHeight = `${this.$.innerBody.scrollHeight}px`;
        if (dropdownIcon) dropdownIcon.setAttribute('rotate', true);
      } else {
        this.$.outerBody.style.maxHeight = 0;
        if (dropdownIcon) dropdownIcon.removeAttribute('rotate');
      }
    });
  }
}

window.customElements.define('casper-moac-sidebar-item', CasperMoacSidebarItem);
