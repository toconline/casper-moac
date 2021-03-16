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
         * Array of objects that contain all of the ids with their parent
         *
         * @type {Array}
         */
         _allIdsArray: {
          type: Array,
          value: []
        },
        /**
         * Array that contains all the ids that the user requested
         *
         * @type {Array}
         */
         _userArray: {
          type: Array,
          value: []
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
        }
      }
    }

    // Public method to reload the items in the tree grid
    async refreshTreeItems () {
      try {
        this.loading = true;

        const apiResponse = await this.app.broker.get(`${this.treeResource}?fields[${this.treeResource}]=parent_id`, 300000);

        // Get all the items ids and parents
        this._allIdsArray = apiResponse.data;



        // Get orphans
        this._userArray = this._allIdsArray.filter(item => item.parent_id === null).map(item => { return {id: item.id} });

        await this._renderItems();

      } catch (exception) {
        this.loading = false;

        let errorMessage = 'Ocorreu um erro a carregar os dados.';

        if (exception.errors && exception.errors.constructor === Array && exception.errors.length >= 1) {
          if (exception.errors[0].code === 'FORBIDDEN_BY_GATEKEEPER') {
            errorMessage = 'Não tem permissão para executar esta operação';
          } else {
            errorMessage = exception.errors[0].detail;
          }
        }

        this.app.openToast({ text: errorMessage, backgroundColor: 'red' });
      }
    }

    // Public methods that expands a node given an event (for the on click) or given the id of the parent node
    expand (event, parentId = undefined) {
      if (!parentId) parentId = event.detail.parent_id;

      this._newActiveItemId = parentId;

      const children = this._allIdsArray.filter(item => (item.parent_id == parentId)).map(a => {return {id: a.id}});

      // Careful with duplicates
      const parentIdx = this._findWithAttr(this._userArray, 'id', parentId);
      this._userArray.splice(parentIdx+1, 0, ...children);
      this._userArray = [...new Set(this._userArray)];
      this._userArray[parentIdx].expanded = true;

      this._renderItems();
    }

    // Public method that collapses the nodes given an event (for the on click) or given the id of the parent node
    collapse (event, parentId = undefined) {
      console.time('collapse');

      if (!parentId) parentId = event.detail.parent_id;

      this._newActiveItemId = parentId;

      const children = this._allIdsArray.filter(item => (item.parent_id == parentId)).map(a => a.id);

      this._deleteItems(children);

      const parentIdx = this._findWithAttr(this._userArray, 'id', parentId);
      this._userArray[parentIdx].expanded = false;

      console.timeEnd('collapse');
      this._renderItems();
    }

    _initializeTreeGrid () {
      this.addEventListener('casper-moac-tree-column-expand', this.expand.bind(this));
      this.addEventListener('casper-moac-tree-column-collapse', this.collapse.bind(this));

      const treeColumns = [
        ...this.shadowRoot.querySelector('slot[name="grid-before"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-tree-column')
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
        if ((gridScrollerHeight - gridScrollerPosition <= 1 || this.gridScroller.scrollTop === 0) && this._userArray.length > this._maxNrOfItems) {
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

      if (this._userArray.length <= this._maxNrOfItems) {
        this._renderedArray = this._userArray.map(item => item.id);
      } else {

        let activeItemIndex = 0;
        if (this._newActiveItemId) {
          activeItemIndex = this._findWithAttr(this._userArray, 'id', this._newActiveItemId);
        } else if (this.activeItem) {
          activeItemIndex = this._findWithAttr(this._userArray, 'id', this.activeItem.id);
        }

        let firstIdx;
        let lastIdx;
        if (direction === 'up') {
          // Going up so render more items up top
          firstIdx = Math.max(Math.min(activeItemIndex - Math.round(this._maxNrOfItems * 0.75), this._userArray.length-this._maxNrOfItems), 0);
          lastIdx = Math.min(Math.max(activeItemIndex + Math.round(this._maxNrOfItems * 0.25),this._maxNrOfItems), this._userArray.length);
        } else if (direction === 'down') {
          // Going down so render more items down low
          firstIdx = Math.max(Math.min(activeItemIndex - Math.round(this._maxNrOfItems * 0.25), this._userArray.length-this._maxNrOfItems), 0);
          lastIdx = Math.min(Math.max(activeItemIndex + Math.round(this._maxNrOfItems * 0.75), this._maxNrOfItems), this._userArray.length);
        } else {
          firstIdx = Math.max(Math.min(activeItemIndex - Math.round(this._maxNrOfItems * 0.5), this._userArray.length-this._maxNrOfItems), 0);
          lastIdx = Math.min(Math.max(activeItemIndex + Math.round(this._maxNrOfItems * 0.5),this._maxNrOfItems), this._userArray.length);
        }
        this._renderedArray = this._userArray.slice(firstIdx, lastIdx).map(item => item.id);
      }

      try {
        const response = await this.app.broker.get(`${this.treeResource}?filter="id IN (${String(this._renderedArray)})"`, 30000);

        if (response.data[0].child_count === undefined || response.data[0].level === undefined) {
          throw('Each item given to the grid MUST have the following properties: child_count and level');
        }

        response.data.forEach( item => {
                                          item.expanded = this._userArray.filter(e => e.id === item.id)[0].expanded;
                                          item.child_count > 0 ? item.has_children = true : item.has_children = false;
                                        });

        let maxLevel = 1;
        for (const item of response.data) {
          if (item.level > maxLevel) maxLevel = item.level;
        }
        const newColumnWidth = (80+(maxLevel*20))+'px';
        this._treeColumn.width = newColumnWidth;

        if (this._newActiveItemId) {
          this.setItems(response.data, this._newActiveItemId);
        } else {
          this.setItems(response.data);
        }
      } catch (exception) {
        console.error(exception);
        this.app.openToast({ text: 'Ocorreu um erro a carregar os dados.', backgroundColor: 'red' });
      }

      this.loading = false;
      console.timeEnd('renderItems');
    }

    _scrollAndRenderTop () {
      this._renderedArray.sort((a,b) => a.localeCompare(b));
      if (this._userArray[0].id != this._renderedArray[0]) {
        this._newActiveItemId = this._renderedArray[0];
        this._renderItems('up');
      }
    }

    _scrollAndRenderBot () {
      this._renderedArray.sort((a,b) => a.localeCompare(b));
      if (this._userArray[this._userArray.length-1].id != this._renderedArray[this._renderedArray.length-1]) {

        // Trying to eyeball item to select -- this could be better (38 is the height of each row)
        this._newActiveItemId = this._renderedArray[this._renderedArray.length-Math.round(this.gridScroller.clientHeight/38)];
        this._renderItems('down');
      }
    }

    // Deletes items recursively from the user array (used for collapsing)
    _deleteItems (ids) {
      if (ids.length === 1) {
        const index = this._findWithAttr(this._userArray, 'id', ids[0]);

        if (index > -1) {
          if (this._userArray[index].expanded) {
            const children = this._allIdsArray.filter(item => (item.parent_id == ids[0] && this._findWithAttr(this._userArray, 'id', item.id) > -1)).map(a => a.id);
            if (children.length > 0) {
              this._deleteItems(children);
            }
          }
          this._userArray.splice(index, 1);
        }
      } else {
        ids.forEach(id => this._deleteItems([id]));
      }
    }

    // Finds the index of an element inside an array of objects given the atribute and value
    _findWithAttr (array, attr, value) {
      for (let i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
          return i;
        }
      }
      return -1;
    }
  }
}