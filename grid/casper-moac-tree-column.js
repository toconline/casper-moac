/* 
 * Copyright (C) 2021 Cloudware S.A. All rights reserved.
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

import '@cloudware-casper/casper-icons/casper-icon.js';
import { LitElement, html } from 'lit-element';
import { render } from 'lit-html';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacTreeColumn extends GridColumnElement {
  static get properties () {
    return {
      valueClass: {
        type: String
      },
      valueTooltip: {
        type: String
      },
      valueClick: {
        type: Function
      },
      customValue: {
        type: Function
      },
      parentColumn: {
        type: String,
        value: 'parent_id'
      }
    }
  }

  ready () {
    super.ready();

    // This vaadin grid property sets the width automatically
    this.autoWidth = true;

    this.headerRenderer = (headerContent) => {
      render( html`
        <div .tooltip="${this.tooltip}" style=${this._getHeaderContainerAlignment()}>
          <span>${this.header}</span>
        </div>
      `, headerContent);
    }

    this.renderer = (cellContent, gridColumn, itemData) => {
      const item = itemData.item;
      let cellHtml;
      if (item.not_tree) {
        cellHtml = html`
          <div class="acc-crumb">
            ${this._getParentIds(item).map((parentId, index) => html`
              <div style="opacity: ${this._getOpacity(index, item.parent_ids)}" class="acc-crumb-circle" .dataParent=${parentId} .dataItem=${item} @click=${this._expandMultiple}></div>
              <div style="opacity: ${this._getOpacity(index, item.parent_ids)}" class="acc-crumb-line"></div>
            `)}
            ${item.parent_ids ? html `<div class="acc-crumb-circle acc-crumb-circle-selected" .dataParent=${item.id} .dataItem=${item} @click=${this._expandMultiple}></div>` : html ``}
            <span class="value-container">
              ${this.customValue ? this.customValue(item) :
                html`<span class="${this.valueClass}" @click=${this.valueClick} .tooltip="${this._getTooltipText(item)}">${this._getPathProp(item,this.path)}</span>`}
            </span>
          </div>
        `;
      } else {
        cellHtml = html`
          <div style="${this.getStyleForColumn(item.level, true)}" ?hidden=${!item.has_children}>
            <casper-icon
              ?hidden=${item.expanded}
              icon="fa-solid:caret-right"
              .dataItem=${item}
              class="expand-icon"
              @click=${this._expand.bind(this)}>
            </casper-icon>
            <casper-icon
              ?hidden=${!item.expanded}
              icon="fa-solid:caret-down"
              .dataItem=${item}
              class="expand-icon"
              @click=${this._collapse.bind(this)}>
            </casper-icon>
            <span class="value-container">
              ${this.customValue ? this.customValue(item) :
                html`<span class="${this.valueClass}" @click=${this.valueClick} .tooltip="${this._getTooltipText(item)}">${this._getPathProp(item,this.path)}</span>`}
            </span>
          </div>
          <div style="${this.getStyleForColumn(item.level, false)}" ?hidden=${item.has_children}>
            <span class="value-container">
              ${this.customValue ? this.customValue(item) :
                html`<span class="${this.valueClass}" @click=${this.valueClick} .tooltip="${this._getTooltipText(item)}">${this._getPathProp(item,this.path)}</span>`}
            </span>
          </div>
        `;
      }

      render( html`
       <style>
          .expand-icon {
            width: 15px;
            height: 15px;
            color: darkgrey;
            margin-right: -2px;
            margin-top: -2px;
            vertical-align: middle;
            transition: all 200ms linear;
          }
          .expand-icon:hover {
            cursor: pointer;
            color: var(--primary-color);
          }
          .tree-column {
            display: flex;
            align-items: center;
            margin-left: -10px;
          }
          .acc-crumb {
            display: inline-flex;
            align-items: center;
            margin-left: 5px;
          }
          .acc-crumb-circle {
            width: 6px;
            height: 6px;
            border: solid 2px rgb(12, 84, 96);
            border-radius: 100%;
          }
          .acc-crumb-circle:hover {
            cursor: pointer;
            background-color: rgb(12, 84, 96);
          }
          .acc-crumb-line {
            background-color: rgb(12, 84, 96);
            width: 13px;
            height: 1px;
          }
          .acc-crumb-circle-selected {
            opacity: 1;
          }
          .value-container {
            padding: 0 8px;
            font-weight: 800;
          }
        </style>
        <div class="tree-column">
          ${cellHtml}
        </div>
      `, cellContent);
    }
  }

  // Dispatch an event to inform the casper-moac element that user has expanded a node.
  _expand (event) {
    if (event && event.target && event.target.dataItem) {
      event.stopImmediatePropagation();

      this.dispatchEvent(new CustomEvent('casper-moac-tree-column-expand', {
        bubbles: true,
        composed: true,
        detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem[this.parentColumn] }
      }));
    }
  }

  // Dispatch an event to inform the casper-moac element that user has expanded multiple nodes.
  _expandMultiple (event) {
    if (event && event.target && event.target.dataItem && event.target.dataParent) {
      event.stopImmediatePropagation();

      this.dispatchEvent(new CustomEvent('casper-moac-tree-column-expand-multiple', {
        bubbles: true,
        composed: true,
        detail: { ids: event.target.dataItem.parent_ids, idx: event.target.dataItem.parent_ids.indexOf(event.target.dataParent) }
      }));
    }
  }

  // Dispatch an event to inform the casper-moac element that user has collapsed a node.
  _collapse (event) {
    if (event && event.target && event.target.dataItem) {
      event.stopImmediatePropagation();

      this.dispatchEvent(new CustomEvent('casper-moac-tree-column-collapse', {
        bubbles: true,
        composed: true,
        detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem[this.parentColumn] }
      }));
    }
  }

  getStyleForColumn (level, expandable) {
    let value = 0;
    if (expandable) {
      value = ((level-1)*11) + 10;
    } else {
      value = ((11 * (level-1)) + 17) + 10;
    }

    return `margin-left: ${value}px;`;
  }

  _getScaleBetween (unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
  }

  _getParentIds (item) {
    if (item.parent_ids) {
      return item.parent_ids.filter(e => e != item.id);
    } else {
      return [];
    }
  }

  _getOpacity (index, array) {
    return this._getScaleBetween((index)/array.length, 0.4, 1, 0, 1);
  }

  _getHeaderContainerAlignment () {
    switch (this.textAlign) {
      case 'end': return 'justify-content: flex-end';
      case 'center': return 'justify-content: center';
      case 'start': return 'justify-content: flex-start';
    }
  }

  _getPathProp (item, value) {
    if (item) return item[value];
  }

  _getTooltipText (item) {
    if (item) return item[this.valueTooltip];
  }
}

window.customElements.define('casper-moac-tree-column', CasperMoacTreeColumn);
