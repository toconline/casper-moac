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

import {LitElement, html} from 'lit-element';
import {render} from 'lit-html';
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

  ready () {
    super.ready();

    this.headerRenderer = (headerCell) => {
      render( html`
       <div .tooltip="${this.tooltip}" class="casper-moac-toggle-column" style=${this.__getHeaderContainerAlignment()}>
         <div class="toggle-buttons-container">
           <span id="first-button" class="toggle-button selected-toggle-button" @click=${this.__toggleButton.bind(this)}>${this.button1}</span>
           <span id="second-button" class="toggle-button" @click=${this.__toggleButton.bind(this)}>${this.button2}</span>
         </div>
       </div>
      `, headerCell);
    }
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
      let firstButton;
      let secondButton;

      if (this.parentElement.tagName === 'VAADIN-GRID') {
        firstButton = this.parentElement.querySelector('#first-button');
        secondButton = this.parentElement.querySelector('#second-button');
      } else {
        firstButton = this.parentElement.shadowRoot.getElementById('first-button');
        secondButton = this.parentElement.shadowRoot.getElementById('second-button');
      }

      if (targetId === 'first-button') {
        firstButton.classList.add('selected-toggle-button');
        secondButton.classList.remove('selected-toggle-button');
      } else if (targetId === 'second-button') {
        secondButton.classList.add('selected-toggle-button');
        firstButton.classList.remove('selected-toggle-button');
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
