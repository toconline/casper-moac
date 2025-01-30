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

import '@polymer/paper-button/paper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

export class CasperMoacMenuItem extends PolymerElement {

  static get template () {
    return html`
      <style>
        :host([disabled]) {
          pointer-events: none;
        }

        #container {
          display: flex;
          color: #212121;
          font-size: 15px;
          user-select: none;
          align-items: center;
          width: fit-content;
          padding-top: 8px;
          padding-bottom: 8px;
          padding-left: 12.5px;
        }

        #container ::slotted(a) {
          height: 100%;
          color: #212121;
          text-decoration: none;
        }

        :host([disabled]) #container,
        :host([disabled]) #container ::slotted(a) {
          pointer-events: none;
          color: var(--disabled-text-color);
        }

        #container:hover,
        #container:hover ::slotted(a) {
          color: var(--primary-color);
          cursor: pointer;
          text-decoration: none;
          transition: background-color 100ms linear;
        }

        #container:hover casper-icon-button {
          background-color: var(--light-primary-color);
          color: var(--primary-color);
        }

        #container casper-icon-button {
          flex: 0 0 30px;
          height: 30px;
          padding: 7px;
          margin-right: 10px;
          box-sizing: border-box;
        }
      </style>
      <div id="container">
        <casper-icon-button with-border disabled="[[disabled]]" icon="[[icon]]"></casper-icon-button>
        <slot></slot>
      </div>
    `;
  }

  static get properties () {
    return {
      /**
       * Icon that will be used in the paper-icon-button.
       * @type {String}
       */
      icon: {
        type: String,
      },
      /**
       * Flag that enables / disables the menu item.
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      }
    };
  }

  ready () {
    super.ready();

    this.shadowRoot.addEventListener('click', event => {
      if (event.composedPath().some(element => element.nodeName && element.nodeName.toLowerCase() === 'a')) return;

      const slotAssignedElements = this.shadowRoot.querySelector('slot').assignedElements();

      // Trigger the click manually when there is an anchor.
      if (slotAssignedElements.length > 0 && slotAssignedElements[0].nodeName.toLowerCase() === 'a') {
        slotAssignedElements[0].click();
      }
    });
  }
}

window.customElements.define('casper-moac-menu-item', CasperMoacMenuItem);
