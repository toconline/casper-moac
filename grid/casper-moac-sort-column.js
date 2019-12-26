import '@casper2020/casper-icons/casper-icon.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';
import { CasperMoacSortTypes, CasperMoacSortDirections } from '../casper-moac-constants';

class CasperMoacSortColumn extends GridColumnElement {

  static get properties () {
    return {
      /**
       * If there are multiple sorters being applied, this states its order / priority.
       *
       * @type {Number}
       */
      sortOrder: Number,
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
       * This property states the direction in which the items are being sorted, either ascending
       * or deescending.
       *
       * @type {String}
       */
      direction: {
        type: String,
        notify: true
      }
    }
  }

  static get template () {
    return html`
      <template class="header">
        <style>
          #header-container {
            width: 100%;
            display: inline-flex;
            user-select: none;
          }

          #header-container:hover {
            cursor: pointer;
          }

          #header-container #header-title {
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          #header-container #header-sort {
            flex-shrink: 0;
            margin-left: 5px;
            display: flex;
            align-items: center;
          }

          #header-container #header-sort casper-icon {
            width: 15px;
            height: 15px;
            color: white;
          }

          #header-container #header-sort #header-sort-order {
            width: 10px;
            font-size: 10px;
          }
        </style>

        <div id="header-container" on-click="__toggleDirection" style="[[__getHeaderContainerAlignment()]]">
          <span id="header-title">[[header]]</span>

          <div id="header-sort">
            <casper-icon icon="[[__getIcon(direction)]]" style="[[__getIconOpacity(direction)]]"></casper-icon>

            <!--Only display the sort order when there is more than one sort-->
            <template is="dom-if" if="[[sortOrder]]">
              <span id="header-sort-order">[[sortOrder]]</span>
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
    const directions = [undefined, CasperMoacSortDirections.ASCENDING, CasperMoacSortDirections.DESCENDING];
    const currentDirection = directions.findIndex(direction => direction === this.direction);

    this.direction = currentDirection + 1 < directions.length
      ? directions[currentDirection + 1]
      : directions[0];

    // Manipulate the icon and opacity.
    this.__headerIcon = this.__headerIcon || event.target.closest('#header-container').querySelector('casper-icon');
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
      case 'center':
        return 'justify-content: center';
      case 'end':
        return 'justify-content: flex-end';
      case 'start':
        return 'justify-content: flex-start';
    }
  }
}

customElements.define('casper-moac-sort-column', CasperMoacSortColumn);
