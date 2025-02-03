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
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';
import { CasperMoacSortTypes, CasperMoacSortDirections } from '../casper-moac-constants';

class CasperMoacSortColumn extends GridColumnElement {

  static get properties () {
    return {
      /**
       * This property specifies the column data type so that the component knows how to sort the items.
       *
       * @type {String}
       */
      dataType: {
        type: String,
        value: CasperMoacSortTypes.STRING
      },
      /**
       * This property when present overrides the path property when querying the database.
       *
       * @type {String}
       */
      databaseField: String,
      /**
       * This property states the direction in which the items are being sorted, either ascending
       * or deescending.
       *
       * @type {String}
       */
      direction: {
        type: String,
        notify: true,
        value: null
      },
      /**
       * If there are multiple sorters being applied, this states its order / priority.
       *
       * @type {Number}
       */
      sortOrder: Number,
      /**
       * The header's tooltip.
       *
       * @type {String}
       */
      tooltip: String,
    }
  }



  static get template () {
    return html`
      <template class="header">
        <div
          tooltip$="[[tooltip]]"
          on-click="__toggleDirection"
          class="casper-moac-sort-column"
          style="[[__getHeaderContainerAlignment()]]">
          <span class="header-title" inner-h-t-m-l="[[header]]"></span>

          <div class="header-sort">
            <casper-icon icon="[[__getIcon(direction)]]" style="[[__getIconOpacity(direction)]]"></casper-icon>

            <!--Only display the sort order when there is more than one sort-->
            <template is="dom-if" if="[[sortOrder]]">
              <span class="header-sort-order">[[sortOrder]]</span>
            </template>
          </div>
        </div>
      </template>
    `;
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the template and bind the dataHost.
   */
  _prepareHeaderTemplate () {
    const headerTemplate = this._prepareTemplatizer(this.shadowRoot.querySelector('template'));
    headerTemplate.templatizer.dataHost = this;

    return headerTemplate;
  }

  /**
   * This method is invoked when the user clicks on the sort column header which shall change its direction.
   *
   * @param {Object} event The event's object.
   */
  __toggleDirection (event) {
    const directions = [null, CasperMoacSortDirections.ASCENDING, CasperMoacSortDirections.DESCENDING];
    const currentDirection = directions.findIndex(direction => direction === this.direction);

    this.direction = currentDirection + 1 < directions.length
      ? directions[currentDirection + 1]
      : directions[0];

    // Manipulate the icon and opacity.
    this.__headerIcon = this.__headerIcon || event.target.closest('.casper-moac-sort-column').querySelector('casper-icon');
    this.__headerIcon.icon = this.__getIcon(this.direction);
    this.__headerIcon.style = this.__getIconOpacity(this.direction);
  }

  /**
   * This method returns the casper-icon depending on the current direction of the sorter.
   */
  __getIcon (direction) {
    switch (direction) {
      case CasperMoacSortDirections.ASCENDING:
        return 'fa-solid:sort-up';
      case CasperMoacSortDirections.DESCENDING:
        return 'fa-solid:sort-down';
      default:
        return 'fa-solid:sort';
    }
  }

  /**
   * This method returns the casper-icon's opacity depending on the current direction of the sorter.
   */
  __getIconOpacity (direction) {
    return `opacity: ${!direction ? '0.2' : '1'}`;
  }

  /**
   * This method returns the styling required to horizontally align the title.
   */
  __getHeaderContainerAlignment () {
    switch (this.textAlign) {
      case 'end': return 'justify-content: flex-end';
      case 'center': return 'justify-content: center';
      case 'start': return 'justify-content: flex-start';
    }
  }
}

window.customElements.define('casper-moac-sort-column', CasperMoacSortColumn);
