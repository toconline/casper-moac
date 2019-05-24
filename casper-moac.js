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

import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-input/paper-input.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

export class CasperMoac extends PolymerElement {

  static get is () {
    return 'casper-moac';
  }

  static get properties () {
    return {
      /**
       * The page that is currently displayed.
       * @type {Number}
       */
      page: {
        type: Number,
        value: 1
      },
      /**
       * Number of results that will be displayed per page.
       * @type {Number}
       */
      pageSize: {
        type: Number,
        value: 250
      },
      /**
       * The JSON API resource name that will be used to build the URL.
       * @type {String}
       */
      resourceName: String,
      /**
       * List of attributes that should be displayed on the iron-list.
       * @type {Array}
       */
      resourceListAttributes: Array,
      /**
       * List of attributes that should be displayed on the iron-list.
       * @type {Array}
       */
      resourceFilterAttributes: Array,
      /**
       * URL parameter that will contain the number of results per page.
       * @type {String}
       */
      resourcePageSizeParam: {
        type: String,
        value: 'page[size]'
      },
      /**
       * URL parameter that will contain the current page.
       * @type {String}
       */
      resourcePageParam: {
        type: String,
        value: 'page[number]'
      },
      /**
       * URL parameter to obtain the total number of results for the current query.
       * @type {String}
       */
      resourceTotalsMetaParam: {
        type: String,
        value: 'totals=1'
      },
      /**
       * URL parameter to sort the results by a specific attribute.
       * @type {String}
      */
      resourceSortParam: {
        type: String,
        value: 'sort'
      },
      /**
       * URL parameter to filter the results by matching a substring with a specific attribute.
       * @type {String}
      */
      resourceFilterParam: {
        type: String,
        value: 'filter'
      },
      /**
       * The JSON API resource timeout value in ms.
       * @type {Number}
       */
      resourceTimeoutMs: {
        type: Number,
        value: 5000
      },
      filterInputPlaceholder: {
        type: String,
        value: 'Filtrar Resultados'
      }
    };
  }

  static get template () {
    return html`
      <style>
        vaadin-split-layout {
          height: 100%;
        }

        .right-side-container {
          width: 65%;
        }

        .left-side-container {
          width: 35%;
          padding: 20px;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .left-side-container .menu-container {
          display: flex;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #B3B3B3;
        }

        .left-side-container .grid-container {
          flex-grow: 1;
        }

        .left-side-container .grid-container slot[name="grid"]::slotted(*) {
          height: 100%;
        }
      </style>
      <vaadin-split-layout>
        <div class="left-side-container">
          <div class="menu-container">
            <slot name="menu"></slot>
            <paper-input placeholder="[[filterInputPlaceholder]]" id="filterInput">
              <iron-icon slot="suffix" icon="casper-icons:search"></iron-icon>
            </paper-input>
          </div>
          <div class="grid-container">
            <slot name="grid"></slot>
          </div>
        </div>
        <div class="right-side-container">
          <casper-epaper app="[[app]]"></casper-epaper>
        </div>
      </vaadin-split-layout>
    `;
  }

  static get sortByAscending () { return 'asc'; }
  static get sortByDescending () { return 'desc'; }

  ready () {
    super.ready();

    this._vaadinGrid = this.shadowRoot
      .querySelector('slot[name="grid"]')
      .assignedElements()
      .shift();

    // Set the Vaadin Grid options.
    this._vaadinGrid.pageSize = this.pageSize;
    this._vaadinGrid.dataProvider = (parameters, callback) => this._fetchResourceItems(parameters, callback);
  }

  _fetchResourceItems (parameters, callback) {
    app.socket.getData(this._buildResourceUrl(parameters), this.resourceTimeoutMs, socketResponse => {
      if (socketResponse.errors) return;

      callback(
        socketResponse.data.map(item => ({ id: item.id, ...item.attributes })),
        parseInt(socketResponse.meta.total)
      );
    });
  }

  _buildResourceUrl (parameters) {
    let resourceUrlParams = [
      this.resourceTotalsMetaParam,                                           // totals=1
      `${this.resourcePageParam}=${parameters.page + 1}`,                     // page[number]=1
      `${this.resourcePageSizeParam}=${parameters.pageSize}`,                 // page[size]=1
      `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}` // fields[general_ledger]=child_count,description
    ];

    // Sort by ascending or descending.
    if (parameters.sortOrders.length > 0) {
      const sortSettings = parameters.sortOrders.shift(); 
      resourceUrlParams = sortSettings.direction === CasperMoac.sortByAscending
        ? [...resourceUrlParams, `${this.resourceSortParam}=${sortSettings.path}`]
        : [...resourceUrlParams, `${this.resourceSortParam}=-${sortSettings.path}`];
    }

    if (this.resourceFilterAttributes.length > 0 && this.$.filterInput.value) {
      const resourceFilters = parameters.filters.map(filter => {
        // Escape special characters that might break the ILIKE clause.
        let escapedValue = this.$.filterInput.value.replace(/[%\\]/g, '\\$&');
        escapedValue = escapedValue.replace(/[&]/g, '_');

        return `${filter.path}::TEXT ILIKE '%${escapedValue}%'`;
      });

      resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${resourceFilters.join(' AND ')}"`]
    }

    // Check if there is already existing filters in the resource name.
    return this.resourceName.indexOf('?') !== -1
      ? `${this.resourceName}&${resourceUrlParams.join('&')}`
      : `${this.resourceName}?${resourceUrlParams.join('&')}`;
  }
}

customElements.define(CasperMoac.is, CasperMoac);
