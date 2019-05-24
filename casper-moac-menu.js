/*
  - Copyright (c) 2014-2016 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-moac.
  -
  - casper-moac is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-moac is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-moac.  If not, see <http://www.gnu.org/licenses/>.
  -
 */

import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@casper2020/casper-icons/casper-icons.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacMenu extends PolymerElement {

  static get is () {
    return 'casper-moac-menu';
  }

  static get template () {
    return html`
      <style>
        paper-button {
          padding: 0;
          width: 55px;
          height: 55px;
          display: flex;
          min-width: unset;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: var(--primary-color);
        }

        paper-button iron-icon {
          width: 100%;
          height: 100%;
          color: white;
        }
      </style>
      <paper-button>
        <iron-icon icon="casper-icons:plus"></iron-icon>
      </paper-button>
    `;
  }
}

customElements.define(CasperMoacMenu.is, CasperMoacMenu);