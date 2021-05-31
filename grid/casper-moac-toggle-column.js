import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacToggleColumn extends GridColumnElement {

  static get properties () {
    return {
      /**
       * The header's tooltip.
       *
       * @type {String}
       */
      tooltip: String,
      /**
       * First button's text.
       *
       * @type {String}
       */
      button1: String,
      /**
       * Second button's text.
       *
       * @type {String}
       */
      button2: String,
      /**
       * First button's class.
       * 
       * @type {String}
       */
      firstButtonClass: {
        type: String,
        value: 'toggle-button selected-toggle-button'
      },
      /**
       * Second button's class.
       * 
       * @type {String}
       */
       secondButtonClass: {
        type: String,
        value: 'toggle-button'
      },
      /**
       * Selected button.
       * 
       * @type {String}
       */
       selectedButton: {
        type: String,
        value: 'first-button'
       }
    }
  }

  static get template () {
    return html`
      <template class="header">
        <div tooltip$="[[tooltip]]" class="casper-moac-toggle-column" style="[[__getHeaderContainerAlignment()]]">
          <div class="toggle-buttons-container">
            <span id="first-button" class$="[[firstButtonClass]]" on-click="__toggleButton">[[button1]]</span>
            <span id="second-button" class$="[[secondButtonClass]]" on-click="__toggleButton">[[button2]]</span>
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
   * This method is called when the user clicks on a toggle button. 
   * It sets the correct classes and dispatches a new event that can be listened to elsewhere.
   */
  __toggleButton (event) {
    if (event && event.currentTarget && event.currentTarget.id) {
      const targetId = event.currentTarget.id;
      const initialClass = 'toggle-button';

      if (targetId === 'first-button') {
        this.firstButtonClass = `${initialClass} selected-toggle-button`;
        this.secondButtonClass = initialClass;
      } else if (targetId === 'second-button') {
        this.secondButtonClass = `${initialClass} selected-toggle-button`;
        this.firstButtonClass = initialClass;
      }

      this.selectedButton = targetId;

      event.stopImmediatePropagation();
  
      this.dispatchEvent(new CustomEvent('casper-moac-toggle-column-toggle', {
        bubbles: true,
        composed: true,
        detail: { target_id: targetId }
      }));
    }
  }
}

window.customElements.define('casper-moac-toggle-column', CasperMoacToggleColumn);
