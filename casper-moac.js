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

import '@polymer/iron-list/iron-list.js';
import '@polymer/iron-icon/iron-icon.js';
import '@casper2020/casper-icons/casper-icons.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class CasperMoac extends PolymerElement {

  static get is() {
    return 'casper-moac';
  }

  static get properties() {
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
      resultsPerPage: {
        type: Number,
        value: 50
      },
      /**
       * Attribute that will be used to order the JSON API results.
       * @type {Array}
       */
      sortBy: String,
      /**
       * Sort the results in a ascending/descending manner
       * @type {Array}
       */
      sortByOrder: {
        type: String,
        value: CasperMoac.sortByAscending
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
       * URL parameter that will contain the number of results per page.
       * @type {String}
       */
      resourceResultsPerPageParam: {
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
       * The JSON API resource timeout value in ms.
       * @type {Number}
       */
      resourceTimeoutMs: {
        type: Number,
        value: 5000
      },
    };
  }

  static get template () {
    return html`
      <!--Previous Page-->
      <button id="previousPage" disabled$="[[_previousPageDisabled(page)]]">
        <iron-icon icon="casper-icons:arrow-left"></iron-icon>
      </button>

      <dom-repeat items="[[_pagingItems(page, _totalNumberPages)]]" on-dom-change="_bindPagingItemsEvents">
        <template>
          <button data-page$="[[item.page]]">
            [[item.label]]
          </button>
        </template>
      </dom-repeat>

      <!--Next Page-->
      <button id="nextPage" disabled$="[[_nextPageDisabled(page)]]">
        <iron-icon icon="casper-icons:arrow-right"></iron-icon>
      </button>

      Página [[page]] de [[_totalNumberPages]] ([[_totalNumberResults]] resultados)

      <iron-list items="[[_items]]">
        <slot></slot>
      </iron-list>
    `;
  }

  static get sortByAscending () { return 'ASC'; }
  static get sortByDescending () { return 'DESC'; }

  ready () {
    super.ready();
    this._fetchResourceItems();

    this.$.nextPage.addEventListener('click', () => { this._goToNextPage(); });
    this.$.previousPage.addEventListener('click', () => { this._goToPreviousPage(); });
  }

  _bindPagingItemsEvents () {
    this.shadowRoot.querySelectorAll('[data-page]').forEach(pagingButton => {
      pagingButton.addEventListener('click', event => {
        this._goToPage(parseInt(event.target.dataset.page));
      })
    });
  }

  _pagingItems (page, totalNumberPages) {
    if (totalNumberPages > 4) {
      return [
        { page: 1, label: 1 },
        { page: 2, label: 2 },
        { page: null, label: '...' },
        { page: totalNumberPages - 1, label: totalNumberPages - 1 },
        { page: totalNumberPages, label: totalNumberPages }
      ];
    } else {
      return Array.from({ length: totalNumberPages }, (value, key) => ({
        page: key + 1,
        label: key + 1
      }));
    }
  }

  _goToPage (page) {
    this.page = page;
    this._fetchResourceItems();
  }

  _goToPreviousPage () {
    this.page--;
    this._fetchResourceItems();
  }

  _goToNextPage () {
    this.page++;
    this._fetchResourceItems();
  }

  _previousPageDisabled () {
    return this.page === 1;
  }

  _nextPageDisabled () {
    return this.page === this._totalNumberPages;
  }

  _fetchResourceItems () {
    app.socket.getData(this._buildResourceUrl(), this.resourceTimeoutMs, socketResponse => {
      if (socketResponse.errors) return;

      this._items = socketResponse.data.map(item => ({ id: item.id, ...item.attributes }));

      this._totalNumberResults = parseInt(socketResponse.meta.total);
      this._totalNumberPages = Math.ceil(this._totalNumberResults / this.resultsPerPage);
    });
  }

  _buildResourceUrl () {
    let resourceUrlParams = [
      this.resourceTotalsMetaParam,                                             // totals=1
      `${this.resourcePageParam}=${this.page}`,                                 // page[number]=1
      `${this.resourceResultsPerPageParam}=${this.resultsPerPage}`,             // page[size]=1
      `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}`   // fields[general_ledger]=child_count,description
    ];

    // Sort by ascending or descending.
    resourceUrlParams = this.sortByOrder === CasperMoac.sortByAscending
      ? [...resourceUrlParams, `${this.resourceSortParam}=${this.sortBy}`]
      : [...resourceUrlParams, `${this.resourceSortParam}=-${this.sortBy}`];

    // Check if there is already existing filters in the resource name.
    return this.resourceName.indexOf('?') !== -1
      ? `${this.resourceName}&${resourceUrlParams.join('&')}`
      : `${this.resourceName}?${resourceUrlParams.join('&')}`;
  }
}

window.customElements.define(CasperMoac.is, CasperMoac);
