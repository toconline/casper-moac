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
import '@toconline/casper-icons/casper-icon-button.js';
import '@polymer/paper-button/paper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionAction extends PolymerElement {

  static get properties () {
    return {
      /**
       * Icon that will be used in the paper-button.
       *
       * @type {String}
       */
      icon: {
        type: String
      },
      /**
       * Flag that enables / disables the multi selection action.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
      /**
       * Flag that enables / disables the reverse styling for the buttons where the primary color becomes the text color instead
       * of the background.
       *
       * @type {Boolean}
       */
      reverse: {
        type: Boolean,
        value: false
      },
      /**
       * The casper-icon-button's text.
       *
       * @type {String}
       */
      text: {
        type: String
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host([disabled]) {
          pointer-events: none;
        }

        casper-icon-button {
          width: 25px;
          height: 25px;
          padding: 4px;
          font-size: 12px;
          margin: 10px 2px 0;
        }

        casper-icon-button[with-text] {
          padding: 4px 8px;
        }
      </style>

      <casper-icon-button icon="[[icon]]" disabled="[[disabled]]" reverse="[[reverse]]" text="[[text]]"></casper-icon-button>
    `;
  }
}

window.customElements.define('casper-moac-multi-selection-action', CasperMoacMultiSelectionAction);
