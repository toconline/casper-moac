import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacActiveFilter extends PolymerElement {

  static get properties () {
    return {
      /**
       * The filter's unique identifier.
       *
       * @type {String}
       */
      key: {
        type: String
      },
      /**
       * The label that should appear on the active filters list.
       *
       * @type {String}
       */
      label: {
        type: String
      },
      /**
       * The active filter's value.
       *
       * @type {String}
       */
      value: {
        type: String
      },
      /**
       * Flag that states if the filter can be removed or not.
       *
       * @type {Boolean}
       */
      required: {
        type: Boolean,
        value: false
      },
      /**
       * The function that will be invoked when the user clicks on the active filter's value.
       *
       * @type {Function}
       */
      onClickCallback: {
        type: Function
      },
      /**
       * The function that will be invoked when the user tries to remove the current active filter.
       *
       * @type {Function}
       */
      onRemoveCallback: {
        type: Function
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          margin-right: 5px;
        }

        #value {
          cursor: pointer;
          display: inline;
          font-weight: bold;
          color: var(--primary-color);
          transition: color 100ms linear;
        }

        #value:hover {
          color: var(--dark-primary-color);
        }

        #icon-container {
          display: inline-block;
          vertical-align: middle;
        }

        #icon-container casper-icon-button {
          padding: 0;
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          display: inline-block;
        }
      </style>
      [[label]]:
      <div id="value" on-click="__onValueClick">[[value]]</div>

      <template is="dom-if" if="[[!required]]">
        <div id="icon-container">
          <casper-icon-button
            reverse
            with-border
            icon="fa-light:times"
            on-click="__onRemoveIconClick">
          </casper-icon-button>
        </div>
      </template>
    `;
  }

  /**
   * This method is invoked when the user clicks on the active filter's value.
   */
  __onValueClick () {
    this.onClickCallback(this.key);
  }

  /**
   * This method is invoked when the user tries to remove the current active filter.
   */
  __onRemoveIconClick () {
    this.onRemoveCallback(this.key);
  }
}

customElements.define('casper-moac-active-filter', CasperMoacActiveFilter);