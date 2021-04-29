import '@cloudware-casper/casper-icons/casper-icon.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';
import { CasperMoacSortTypes, CasperMoacSortDirections } from '../casper-moac-constants';

class CasperMoacToggleColumn extends GridColumnElement {

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
      /**
       * First header's title.
       *
       * @type {String}
       */
      header1: String,
      /**
       * Second header's title.
       *
       * @type {String}
       */
      header2: String,
      /**
       * First header's title class.
       */
      header1Class: {
        type: String,
        value: 'header-title header-toggle-title selected-header-toggle-title'
      },
      /**
       * Second header's title class.
       */
       header2Class: {
        type: String,
        value: 'header-title header-toggle-title'
      }
    }
  }

  static get template () {
    return html`
      <template class="header">
        <!-- <div
          tooltip$="[[tooltip]]"
          on-click="__toggleDirection"
          class="casper-moac-sort-column"
          style="[[__getHeaderContainerAlignment()]]">
          <span class="header-title">[[header]]</span>

          <div class="header-sort">
            <casper-icon icon="[[__getIcon(direction)]]" style="[[__getIconOpacity(direction)]]"></casper-icon>

            <template is="dom-if" if="[[sortOrder]]">
              <span class="header-sort-order">[[sortOrder]]</span>
            </template>
          </div>
        </div> -->

        <div tooltip$="[[tooltip]]" class="casper-moac-sort-column" style="[[__getHeaderContainerAlignment()]]">
          <div class="header-toggle-father">
            <span id="first-title" class$="[[header1Class]]" on-click="__toggleClass">[[header1]]</span>
            <span id="second-title" class$="[[header2Class]]" on-click="__toggleClass">[[header2]]</span>
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

  /**
   * This method 
   */
  __toggleClass (event) {
    let initialClass = 'header-title header-toggle-title';

    if (event && event.currentTarget && event.currentTarget.id === 'first-title') {
      this.header1Class = `${initialClass} selected-header-toggle-title`;
      this.header2Class = initialClass;
    } else if (event && event.currentTarget && event.currentTarget.id === 'second-title') {
      this.header2Class = `${initialClass} selected-header-toggle-title`;
      this.header1Class = initialClass;
    }
  }

}

window.customElements.define('casper-moac-toggle-column', CasperMoacToggleColumn);
