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

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMultiSelectionSeparator extends PolymerElement {

  static get template () {
    return html`
      <style>
        #separator {
          width: 1px;
          height: 25px;
          margin: 10px 5px 0 5px;
          background-color: var(--primary-color);
        }
      </style>
      <div id="separator"></div>
    `;
  }
}

window.customElements.define('casper-moac-multi-selection-separator', CasperMoacMultiSelectionSeparator);
