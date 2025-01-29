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

import './casper-moac-tree-toggle.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacTreeToggleColumn extends GridColumnElement {

  static get properties () {
    return {
      path: String
    }
  }

  static get template () {
    return html`
      <template class="header"></template>
      <template class="body">
        <casper-moac-tree-toggle
          expanded="{{item.__expanded}}"
          children-count="[[__getChildrenCount(item)]]">
        </casper-moac-tree-toggle>
      </template>
    `;
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the header's template and bind the dataHost.
   */
  _prepareHeaderTemplate () {
    return this.__prepareTemplate(this.shadowRoot.querySelector('template.header'));
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the body's template and bind the dataHost.
   */
  _prepareBodyTemplate () {
    return this.__prepareTemplate(this.shadowRoot.querySelector('template.body'));
  }

  /**
   * This method is invoked by both _prepareHeaderTemplate and _prepareBodyTemplate which are vaadin-grid
   * protected methods to setup both templates.
   *
   * @param {Element} template The template element.
   */
  __prepareTemplate (template) {
    const bodyTemplate = this._prepareTemplatizer(template);
    bodyTemplate.templatizer.dataHost = this;

    return bodyTemplate;
  }

  /**
   * This method is invoked by the UI to get the number of children of a specific element.
   *
   * @param {Object} item The item whose children will be counted.
   */
  __getChildrenCount (item) {
    return item[this.path] && item[this.path].constructor.name === 'Array' ? item[this.path].length : 0;
  }
}

window.customElements.define('casper-moac-tree-toggle-column', CasperMoacTreeToggleColumn);
