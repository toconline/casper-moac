import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';
import { CasperMoacSortTypes, CasperMoacSortDirections } from './casper-moac-constants';

class CasperMoacSortColumn extends GridColumnElement {

  static get is () {
    return 'casper-moac-sort-column';
  }

  static get properties () {
    return {
      sortOrder: Number,
      dataType: {
        type: String,
        value: CasperMoacSortTypes.STRING
      },
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
          }

          #header-container #header-sort iron-icon {
            width: 15px;
            height: 15px;
            --iron-icon-fill-color: white;
          }

          #header-container #header-sort #header-sort-order {
            width: 10px;
            font-size: 10px;
          }
        </style>

        <div id="header-container" on-click="__toggleDirection" style="[[__getHeaderContainerAlignment()]]">
          <span id="header-title">[[header]]</span>

          <div id="header-sort">
            <iron-icon icon="[[__getIcon()]]" style="[[__getIconOpacity()]]"></iron-icon>
            <span id="header-sort-order">[[sortOrder]]</span>
          </div>
        </div>
      </template>
    `;
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the template and bind the dataHost.
   */
  _prepareHeaderTemplate() {
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
    this.__headerIcon = this.__headerIcon || event.target.closest('#header-container').querySelector('iron-icon');
    this.__headerIcon.icon = this.__getIcon();
    this.__headerIcon.style = this.__getIconOpacity();
  }

  /**
   * This method returns the casper-icon depending on the current direction of the sorter.
   */
  __getIcon () {
    switch (this.direction) {
      case CasperMoacSortDirections.ASCENDING:
        return 'casper-icons:sort-up';
      case CasperMoacSortDirections.DESCENDING:
        return 'casper-icons:sort-down';
      default:
        return 'casper-icons:sort';
    }
  }

  /**
   * This method returns the casper-icon's opacity depending on the current direction of the sorter.
   */
  __getIconOpacity () {
    return `opacity: ${!this.direction ? '0.2' : '1'}`;
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

customElements.define(CasperMoacSortColumn.is, CasperMoacSortColumn);