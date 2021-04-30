import {
  CasperMoacOperators,
  CasperMoacFilterTypes,
  CasperMoacSortDirections,
} from '../casper-moac-constants.js';

import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export const CasperMoacTreeMixin = superClass => {
  return class extends superClass {

    static get properties () {
      return {
        /**
         * Max number of items to be rendered at the same time
         *
         * @type {Number}
         */
         _maxNrOfItems: {
          type: Number,
          value: 100
        },
        /**
         * Number of all the items in the resource
         *
         * @type {Number}
         */
         _sizeAllIds: {
          type: Number,
          value: 0
        },
        /**
         * Number of items in the user array
         *
         * @type {Number}
         */
         _sizeUserIds: {
          type: Number,
          value: 0
        },
        /**
         * Id of the first item in the user array
         *
         * @type {Number}
         */
         _userFirstId: {
          type: Number
        },
        /**
         * Id of the last item in the user array
         *
         * @type {Number}
         */
         _userLastId: {
          type: Number
        },
        /**
         * Array that contains all the items that are rendered in the grid (length <= _maxNrOFItems)
         *
         * @type {Array}
         */
         _renderedArray: {
          type: Array,
          value: []
        },
        /**
         * casper-moac-tree-column
         *
         * @type {Object}
         */
        _treeColumn: {
          type: Object,
          value: {}
        },
        /**
         * Array that contains all the items that were expanded by the user
         *
         * @type {Array}
         */
         expandedItems: {
          type: Array,
          value: []
        },
        /**
         * Flag to control the grid view
         *
         * @type {Boolean}
         */
        treeView: {
          type: Boolean,
          value: true
        }
      }
    }

    // Public method to reload the items in the tree grid
    refreshSocketItems () {
      this._debounceFetchSocketItems();
    }


    // Public methods that expands a node given an event (for the on click) or given the id and parent_id
    async expand (event, id = undefined, parentId = undefined) {
      if (!id) id = +event.detail.id;
      this._newActiveItemId = id;
      if (!parentId) parentId = +event.detail.parent_id;

      if (!id) return;

      for (const item of this.expandedItems)
        if (item.id === id) return;

      try {
        console.time('expand');
        this.expandedItems.push({id: this._newActiveItemId, parentId: parentId});
        const expandResponse = await this.app.socket2.expandLazyload(this.treeResource, this._newActiveItemId, 3000);
        this._sizeUserIds = expandResponse.user_ids_size;
        this._userFirstId = expandResponse.user_first_id;
        this._userLastId  = expandResponse.user_last_id;

        console.timeEnd('expand');
        this._renderItems();
      } catch (error) {
        console.timeEnd('expand');
        this._handleErrors(error);
      }
    }

    // Public method that collapses the nodes given an event (for the on click) or given the id and parent_id
    async collapse (event, id = undefined, parentId = undefined) {
      if (!id) id = +event.detail.id;
      this._newActiveItemId = id;
      if (!parentId) parentId = +event.detail.parent_id;

      if (!id) return;

      let expandedId = false;
      for (const item of this.expandedItems) {
        if (item.id === id) {
          expandedId = true;
          break;
        }
      }
      if (!expandedId) return;

      try {
        console.time('collapse');
        this._deleteExpandedIds(this._newActiveItemId)
        const collapseResponse = await this.app.socket2.collapseLazyload(this.treeResource, this._newActiveItemId, 3000);
        this._sizeUserIds = collapseResponse.user_ids_size;
        this._userFirstId = collapseResponse.user_first_id;
        this._userLastId  = collapseResponse.user_last_id;

        console.timeEnd('collapse');
        this._renderItems();
      } catch (error) {
        console.timeEnd('collapse');
        this._handleErrors(error);
      }
    }

    // Public method that changes back to tree view
    async showTreeView () {
      if (!this.treeView) {
        this.treeView = true;
        let resetedVals = {};
        Object.keys(this.filters).forEach((key) => resetedVals[key] = '');
        this.setFiltersValue(resetedVals, false, true);
        this.__clearFilterInput();
        this._debounceFetchSocketItems();
      }
    }

    _expandMultiple (event) {
      if (event.detail && event.detail.ids.length > 0 && event.detail.idx > -1) {
        this._newActiveItemId = +event.detail.ids[event.detail.idx];
        event.detail.ids = event.detail.ids.slice(0, event.detail.idx + 1);

        // TODO: check for dups or clean already expanded items
        for (let i = 0; i < event.detail.ids.length; i++) {
          this.expandedItems.push({id: +event.detail.ids[i], parentId: +(i > 0 ? event.detail.ids[i-1] : 0) });
        }
        this.treeView = false;
        this.showTreeView();
      } else {
        return;
      }
    }


    async _fetchTreeItems () {
      try {
        this.loading = true;
        // this._newActiveItemId = undefined;
        this.treeResource = this.resourceName;

        let subscribeResponse;
        if (this.treeView) {
          console.time('subscribe');
          subscribeResponse = await this.app.socket2.subscribeTreeLazyload(this.treeResource, 'id', 'parent_id', 'subentity', 'general_ledger', 15000);
          console.timeEnd('subscribe');

          // subscribeLazyload isnt flagged as jsonapi so we have to check for errors ourselves
          if (subscribeResponse.errors || !subscribeResponse.ok || Object.keys(subscribeResponse).length === 0) {
            throw(subscribeResponse.errors);
          }
          this._sizeAllIds  = subscribeResponse.all_ids_size;
          this._sizeUserIds = subscribeResponse.user_ids_size;
          this._userFirstId = subscribeResponse.user_first_id;
          this._userLastId  = subscribeResponse.user_last_id;

          if (this.expandedItems.length > 0) {
            for (const item of this.expandedItems) {
              const expandResponse = await this.app.socket2.expandLazyload(this.treeResource, item.id, 3000);
              this._sizeUserIds = expandResponse.user_ids_size;
              this._userFirstId = expandResponse.user_first_id;
              this._userLastId  = expandResponse.user_last_id;
            }
          }
        } else {
          try {
            const url = this.resourceName.includes('?')
            ? `${this.resourceName}&${this.buildResourceUrl()}`
            : `${this.resourceName}?${this.buildResourceUrl()}`;
            this.treeResource = decodeURIComponent(url);
          } catch (error) {
            this.treeResource = this.resourceName;
          }

          if (this.treeResource.length - this.resourceName.length === 1) this.treeResource = this.resourceName;

          // TODO: we have to fix the uri manually
          this.treeResource = this.treeResource.replace(/%/g, "%25");
          this.treeResource = this.treeResource.replace(/'/g, "%27");
          console.time('subscribe');
          subscribeResponse = await this.app.socket2.subscribeLazyload(this.treeResource, 'id', 'parent_id', 15000);
          console.timeEnd('subscribe');

          // subscribeLazyload isnt flagged as jsonapi so we have to check for errors ourselves
          if (subscribeResponse.errors || Object.keys(subscribeResponse).length === 0) {
            throw(subscribeResponse.errors);
          }
          this._sizeAllIds  = subscribeResponse.all_ids_size;
          this._sizeUserIds = subscribeResponse.user_ids_size;
          this._userFirstId = subscribeResponse.user_first_id;
          this._userLastId  = subscribeResponse.user_last_id;
        }

        this._renderItems();
      } catch (error) {
        console.timeEnd('subscribe');
        this.loading = false;
        console.error(error);
        this.app.openToast({ text: 'Ocorreu um erro a carregar os dados.', backgroundColor: 'red' });
      }
    }

    _debounceFetchSocketItems () {
      this.__debounce('__fetchTreeItemsDebouncer', () => {
        // Make sure every casper-select is already rendered and have selected items before proceeding.
        const missingComponent = Object.entries(this.filters).some(([filterKey, filterOptions]) => {
          const filterComponent = this.__getFilterComponent(filterKey);

          return !filterComponent || (
            filterOptions.type === CasperMoacFilterTypes.CASPER_SELECT &&
            Object.keys(filterComponent.selectedItems).length === 0 &&
            this.__valueIsNotEmpty(filterOptions.value)
          );
        });

        if (missingComponent) return afterNextRender(this, () => { this._debounceFetchSocketItems(); });

        this._fetchTreeItems();
      });
    }

    _filterSocketItems () {
      afterNextRender(this, ()  => {
        if (this.buildResourceUrl() !== "") {
          this.treeView = false;
          this._debounceFetchSocketItems();
        } else if (!this.treeView) {
          this.treeView = true;
          this._debounceFetchSocketItems();
        }
      });
    }


    _initializeSocketLazyLoad () {
      this.addEventListener('casper-moac-tree-column-expand', this.expand.bind(this));
      this.addEventListener('casper-moac-tree-column-expand-multiple', this._expandMultiple.bind(this));
      this.addEventListener('casper-moac-tree-column-collapse', this.collapse.bind(this));

      const treeColumns = [
        ...this.shadowRoot.querySelector('slot[name="grid"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-tree-column')
      ];
      this._treeColumn = treeColumns[0];

      this.gridScroller.addEventListener('scroll', (event) => {
        let goingDown;

        const gridScrollerHeight = this.gridScroller.scrollHeight;
        const gridScrollerPosition = this.gridScroller.scrollTop + this.gridScroller.clientHeight;

        if (this._lastScrollTop && this._lastScrollTop >= this.gridScroller.scrollTop) {
          goingDown = false;
        } else if (this._lastScrollTop && this._lastScrollTop < this.gridScroller.scrollTop) {
          goingDown = true;
        }

        this._lastScrollTop = this.gridScroller.scrollTop;

        // Re-fetch new items when the users scrolls past the 500px threshold.
        if ((gridScrollerHeight - gridScrollerPosition <= 1 || this.gridScroller.scrollTop === 0) && this._sizeUserIds > this._maxNrOfItems) {
          this._lastScrollTop = undefined;
          if (goingDown === true) {
            this.__debounce('treeDebouncer', this._scrollAndRenderBot.bind(this));
          } else if (goingDown === false) {
            this.__debounce('treeDebouncer', this._scrollAndRenderTop.bind(this));
          }
        }
      });
    }

    async _renderItems (direction = undefined) {
      console.time('renderItems');
      this.loading = true;

      try {
        let activeItemId = 0;
        if (this._newActiveItemId) activeItemId = this._newActiveItemId;
        console.time('getll');
        const response = await this.app.socket2.getLazyload(this.treeResource, {active_id: activeItemId, direction: direction}, 3000);
        console.timeEnd('getll');

        let maxLevel = 1;
        if (this.treeView) {
          if (response.data[0].child_count === undefined || response.data[0].level === undefined) {
            throw('Each item given to the tree grid MUST have the following properties: child_count and level');
          }
          response.data.forEach( item => {
                                            item.child_count > 0 ? item.has_children = true : item.has_children = false;
                                            if (item.level > maxLevel) maxLevel = item.level;
                                            if (this.expandedItems.filter(obj => obj.id == item.id).length > 0) item.expanded = true;
                                            if (this.resourceFormatter) this.resourceFormatter.call(this.page || {}, item);
                                          });
          if (this._treeColumn) this._treeColumn.width = (50+(maxLevel*20))+'px';
        } else {
          response.data.forEach( item => {  if (item.level && item.level > maxLevel) maxLevel = item.level;
                                            item.not_tree = true;
                                            if (this.resourceFormatter) this.resourceFormatter.call(this.page || {}, item);
                                         });
          if (this._treeColumn) this._treeColumn.width = (50+(maxLevel*28))+'px';
        }



        this._renderedArray = response.data;
        if (this._newActiveItemId) {
          this.setItems(this._renderedArray, this._newActiveItemId);
        } else {
          this.setItems(this._renderedArray);
        }
      } catch (error) {
        console.timeEnd('getll');
        this._handleErrors(error);
      }

      this.loading = false;
      console.timeEnd('renderItems');
    }

    _scrollAndRenderTop () {
      if (this._userFirstId && this._userFirstId != this._renderedArray[0].id) {
        this._newActiveItemId = +this._renderedArray[0].id;
        this._renderItems('up');
      }
    }

    _scrollAndRenderBot () {
      if (this._userLastId && this._userLastId != this._renderedArray[this._renderedArray.length -1].id) {
        this._newActiveItemId = +this._renderedArray[this._renderedArray.length-Math.round(this.gridScroller.clientHeight/38)].id;
        this._renderItems('down');
      }
    }

    _deleteExpandedIds (id) {
      for (let idx = 0; idx < this.expandedItems.length; idx++) {
        if (id === this.expandedItems[idx].parentId){
          this._deleteExpandedIds(this.expandedItems[idx].id);
          idx--;
        }
      }

      for (const idx in this.expandedItems) {
        if (this.expandedItems[idx].id === id) {
          this.expandedItems.splice(idx, 1);
          return;
        }
      }
    }

    _handleErrors (error) {
      if (error && error.payload_errors && error.payload_errors[0].internal.why === 'urn not subscribed!') {
        console.log('Session died, resubscribing...');
        this._debounceFetchSocketItems();
      } else {
        let errorMessage = 'Ocorreu um erro a carregar os dados.';
        if (error && error.constructor === Array && error.length >= 1) {
          if (error[0].code === 'FORBIDDEN_BY_GATEKEEPER') {
            errorMessage = 'Não tem permissão para executar esta operação';
          } else {
            errorMessage = error[0].detail;
          }
        } else {
          console.error(error);
        }

        this.app.openToast({text: errorMessage, backgroundColor: 'red' });
      }
    }
  }
}