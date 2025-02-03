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

import '@toconline/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacTreeToggle extends PolymerElement {

  static get properties () {
    return {
      /**
       * This boolean property states if the tree is currently expanded or not.
       *
       * @typee {Boolean}
       */
      expanded: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true
      },
      /**
       * Number of children of the current item.
       *
       * @type {Number}
       */
      childrenCount: Number,
      /**
       * Flag that states if the contraction / expansion of the component is enabled.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host #tree-toggle-container {
          display: flex;
          color: darkgrey;
          user-select: none;
          align-items: center;
          transition: color 200ms linear;
        }

        :host #tree-toggle-container:hover {
          cursor: pointer;
          color: var(--primary-color);
          color: var(--primary-color);
        }

        :host([expanded]) #tree-toggle-container {
          color: var(--primary-color);
        }

        :host #tree-toggle-container:hover casper-icon,
        :host([expanded]) #tree-toggle-container casper-icon {
          color: var(--primary-color);
        }

        :host #tree-toggle-container casper-icon {
          width: 15px;
          height: 15px;
          color: darkgrey;
        }

        :host([expanded]) #tree-toggle-container casper-icon {
          transform: rotate(90deg);
        }
      </style>

      <template is="dom-if" if="[[__hasChildren(childrenCount)]]">
        <div id="tree-toggle-container">
          <casper-icon icon="fa-solid:caret-right"></casper-icon>
          [[childrenCount]]
        </div>
      </template>
    `;
  }

  ready () {
    super.ready();

    this.addEventListener('click', event => {
      // This is used to avoid activating / de-activating the items.
      event.stopImmediatePropagation();

      if (this.disabled) return;

      this.expanded = !this.expanded;

      // Dispatch an event to inform the casper-moac element that a toggle was changed.
      this.dispatchEvent(new CustomEvent('casper-moac-tree-toggle-expanded-changed', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded }
      }));
    });
  }

  /**
   * This method returns a boolean stating if the item has children or not which will display / hide
   * the toggle component.
   *
   * @param {Number} childrenCount The number of children.
   */
  __hasChildren (childrenCount) {
    return childrenCount > 0;
  }
}

window.customElements.define('casper-moac-tree-toggle', CasperMoacTreeToggle);
