import '@cloudware-casper/casper-icons/casper-icon.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GridColumnElement } from '@vaadin/vaadin-grid/src/vaadin-grid-column.js';

class CasperMoacTreeColumn extends GridColumnElement {
  static get properties () {
    return {
      valueClass: {
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

        </style>
        <div class="tree-column">
          <div style="margin-left: calc(([[item.level]]-1)*11px);" hidden$=[[!item.has_children]]>
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
            <span class$="[[valueClass]]">[[_getPathProp(item,path)]]</span>
          </div>
          <div style="margin-left: calc((11px * ([[item.level]]-1)) + 17px);" hidden$=[[item.has_children]]>
            <span class$="[[valueClass]]">[[_getPathProp(item,path)]]</span>
          </div>
        </div>
      </template>
    `;
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
    event.stopImmediatePropagation();

    this.dispatchEvent(new CustomEvent('casper-moac-tree-column-expand', {
      bubbles: true,
      composed: true,
      detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem.parent_id }
    }));
  }

  // Dispatch an event to inform the casper-moac element that user has collapsed a node.
  _collapse (event) {
    event.stopImmediatePropagation();

    this.dispatchEvent(new CustomEvent('casper-moac-tree-column-collapse', {
      bubbles: true,
      composed: true,
      detail: { id: event.target.dataItem.id, parent_id: event.target.dataItem.parent_id }
    }));
  }

  _getPathProp (item, value) {
    if (item) return item[value];
  }
}

window.customElements.define('casper-moac-tree-column', CasperMoacTreeColumn);
