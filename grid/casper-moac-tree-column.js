import '@cloudware-casper/casper-icons/casper-icon.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacTreeColumn extends GridColumnElement {
  static get properties () {
    return {
      valueClass: {
        type: String
      },
      valueTooltip: {
        type: String
      }
    }
  }

  static get template () {
    return html`
      <template class="header"><span>[[header]]</span></template>
      <template class="body">
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
            /* background-color: var(--status-gray); */
            width: 6px;
            height: 6px;
            border: solid 2px rgb(12, 84, 96);
            border-radius: 100%;
          }

          .acc-crumb-circle:hover {
            cursor: pointer;
            /* opacity: 0.8 !important; */
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

        </style>
        <div class="tree-column">
          <template is="dom-if" if="[[!item.not_tree]]">
            <div style="[[_getStyleForColumn(item.level,'true')]]" hidden$=[[!item.has_children]]>
              <casper-icon
                hidden$=[[item.expanded]]
                icon="fa-solid:caret-right"
                data-item=[[item]]
                class="expand-icon"
                on-click="_expand">
              </casper-icon>
              <casper-icon
                hidden$=[[!item.expanded]]
                icon="fa-solid:caret-down"
                data-item=[[item]]
                class="expand-icon"
                on-click="_collapse">
              </casper-icon>
              <span class$="[[valueClass]]" tooltip="[[_getTooltipText(item)]]">[[_getPathProp(item,path)]]</span>
            </div>
            <div style="[[_getStyleForColumn(item.level,'false')]]" hidden$=[[item.has_children]]>
              <span class$="[[valueClass]]" tooltip="[[_getTooltipText(item)]]">[[_getPathProp(item,path)]]</span>
            </div>
          </template>

          <template is="dom-if" if="[[item.not_tree]]">
            <div class="acc-crumb">
              <template is="dom-repeat" items=[[_getParentIds(item)]] as="parentId">
                <div style="opacity: [[_getOpacity(index, item.parent_ids)]]" class="acc-crumb-circle" data-parent="[[parentId]]" data-item="[[item]]" on-click="_expandMultiple"></div>
                <div style="opacity: [[_getOpacity(index, item.parent_ids)]]" class="acc-crumb-line"></div>
              </template>
              <div class="acc-crumb-circle acc-crumb-circle-selected" data-parent="[[item.id]]" data-item="[[item]]" on-click="_expandMultiple"></div>
              <span class$="[[valueClass]]" tooltip="[[_getTooltipText(item)]]">[[_getPathProp(item,path)]]</span>
            </div>
          </template>

        </div>
      </template>
    `;
  }

  _scaleBetween (unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
  }

  _getParentIds (item) {
    return item.parent_ids.filter(e => e != item.id);
  }

  _getOpacity (index, array) {
    return this._scaleBetween((index)/array.length, 0.4, 1, 0, 1);
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the header's template and bind the dataHost.
   */
   _prepareHeaderTemplate () {
    return this._prepareTemplate(this.shadowRoot.querySelector('template.header'));
  }

  /**
   * Method invoked from the vaadin grid itself to stamp the body's template and bind the dataHost.
   */
  _prepareBodyTemplate () {
    return this._prepareTemplate(this.shadowRoot.querySelector('template.body'));
  }

  /**
   * This method is invoked by both _prepareHeaderTemplate and _prepareBodyTemplate which are vaadin-grid
   * protected methods to setup both templates.
   *
   * @param {Element} template The template element.
   */
  _prepareTemplate (template) {
    const bodyTemplate = this._prepareTemplatizer(template);
    bodyTemplate.templatizer.dataHost = this;

    return bodyTemplate;
  }

  // Dispatch an event to inform the casper-moac element that user has expanded a node.
  _expand (event) {
    if (event && event.target && event.target.dataItem) {
      event.stopImmediatePropagation();

      this.dispatchEvent(new CustomEvent('casper-moac-tree-column-expand', {
        bubbles: true,
        composed: true,
        detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem.parent_id }
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
        detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem.parent_id }
      }));
    }
  }

  _getStyleForColumn (level, expandable) {
    let value = 0;
    if (expandable === 'true') {
      value = ((level-1)*11) + 10;
    } else {
      value = ((11 * (level-1)) + 17) + 10;
    }

    return `margin-left: ${value}px;`;
  }

  _getPathProp (item, value) {
    if (item) return item[value];
  }

  _getTooltipText (item) {
    if (item) return item[this.valueTooltip];
  }
}

window.customElements.define('casper-moac-tree-column', CasperMoacTreeColumn);
