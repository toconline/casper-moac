export const CasperMoacProperties = superClass => {
  return class extends superClass {
    static get properties () {
      return {
        /**
         * The item that is currently active in the vaadin-grid.
         *
         * @type {Object}
         */
        activeItem: {
          type: Object,
          notify: true,
          observer: '__activeItemChanged'
        },
        /**
         * The active item debouncer timeout to not trigger too many changes.
         *
         * @type {Number}
         */
        activeItemDebounce: {
          type: Number
        },
        /**
         * Since the page load process will change there might be sometimes where this property is not
         * defined so we initialize it this way to enure that nothing breaks.
         *
         * @type {Object}
         */
        app: {
          type: Object,
          value: window.app
        },
        /**
         * The filters's local property where this component will save if his event listeners were already attached or not.
         *
         * @type {String}
         */
        attachedEventListenersInternalProperty: {
          type: String,
          value: '__attachedEventListeners'
        },
        /**
         * The function that is going to be called before the JSON API request.
         *
         * @type {Function}
         */
        beforeJsonApiRequest: {
          type: Function,
        },
        /**
         * The external property where the items' children are stored.
         *
         * @type {String}
         */
        childrenExternalProperty: {
          type: String,
        },
        /**
         * Boolean that states if we should or shouldn't display the epaper's blank page when there is no active item.
         *
         * @type {Boolean}
         */
        disableResetEpaper: {
          type: Boolean,
          value: false,
        },
        /**
         * This property disables the odd / even row styling.
         *
         * @type {Boolean}
         */
        disableRowStripes: {
          type: Boolean,
          value: false
        },
        /**
         * Boolean that states if the vaadin-grid should have the selection column or not.
         *
         * @type {Boolean}
         */
        disableSelection: {
          type: Boolean,
          value: false,
        },
        /**
         * Boolean that states if the vaadin-grid should have the select all checkbox or not.
         *
         * @type {Boolean}
         */
        disableAllSelection: {
          type: Boolean,
          observer: '__disableAllSelectionChanged'
        },
        /**
         * This property disables the possibility of one item to be selected.
         *
         * @type {Boolean}
         */
        disableSelectionInternalProperty: {
          type: String,
          value: '__disableSelection'
        },
        /**
         * The items that are being currently displayed with all the applied filters.
         *
         * @type {Array}
         */
        displayedItems: {
          type: Array,
          value: () => [],
          notify: true
        },
        /**
         * A reference to the epaper object so that the page using casper-moac can
         * use its methods.
         *
         * @type {Object}
         */
        epaper: {
          type: Object,
          notify: true
        },
        /**
         * The atatchment that is being currently displayed in the epaper component.
         *
         * @type {Object}
         */
        epaperCurrentAttachment: {
          type: Object,
          notify: true
        },
        /**
         * Flag that is passed to the casper-epaper component which disables the sticky
         * mouseenter / mouseleave animation.
         *
         * @type {Boolean}
         */
        epaperDisableStickyAnimation: {
          type: Boolean,
          value: false
        },
        /**
         * Property that is passed to the casper-epaper component which states the maximum height in pixels
         * the sticky can have.
         *
         * @type {Number}
         */
        epaperStickyMaximumHeight: {
          type: Number
        },
        /**
         * Property that is passed to the casper-epaper component which sets its initial zoom.
         */
        epaperZoom: {
          type: Number,
        },
        /**
         * This property states if one specific item is expanded or not.
         *
         * @type {Boolean}
         */
        expandedInternalProperty: {
          type: Boolean,
          value: '__expanded'
        },
        /**
         * The items that are currently expanded in the vaadin-grid.
         *
         * @type {Array}
         */
        expandedItems: {
          type: Array,
          notify: true,
          value: () => []
        },
        /**
         * Array that contains the filter components since the developer might want to access them.
         *
         * @type {Array}
         */
        filterComponents: {
          type: Array,
          value: () => []
        },
        /**
         * The placeholder used in the input where the user can filter the results.
         *
         * @type {String}
         */
        filterInputPlaceholder: {
          type: String,
          value: 'Filtrar resultados'
        },
        /**
         * The array of filters that are available to filter the results presents on the page.
         *
         * @type {Array}
         */
        filters: {
          type: Object,
          notify: true,
          observer: '__filtersChanged',
          value: {}
        },
        /**
         * Boolean that when set to true, forces one item to be active all the time.
         *
         * @type {Boolean}
         */
        forceActiveItem: {
          type: Boolean,
          value: false
        },
        /**
         * The name of the GET parameter that will hold the free filter's value.
         *
         * @type {String}
         */
        freeFilterUrlParameterName: {
          type: String,
          value: 'query'
        },
        /**
         * The value that is currently in the free filter input which will be used to filter the items.
         *
         * @type {String}
         */
        freeFilterValue: {
          type: String,
          notify: true
        },
        /**
         * Boolean that when set to true freezes the selection column inserted automatically by the casper-moac component.
         *
         * @type {Boolean}
         */
        freezeSelectionColumn: {
          type: Boolean,
          value: false
        },
        /**
         * A reference to the vaadin-grid so that the page using casper-moac can
         * use its methods.
         *
         * @type {Object}
         */
        grid: {
          type: Object,
          notify: true
        },
        /**
         * A reference to the vaadin-grid's scroller so that developers can attach event listeners to it.
         *
         * @type {Object}
         */
        gridScroller: {
          type: Object,
          notify: true
        },
        /**
         * This property when set to true, displays the casper-epaper component.
         *
         * @type {Boolean}
         */
        hasEpaper: {
          type: Boolean,
          value: false
        },
        /**
         * This property when set to true, toggles the flipping casper-epaper behavior.
         *
         * @type {Boolean}
         */
        hasFlippingEpaper: {
          type: Boolean,
          value: false
        },
        /**
         * This property changes the header background color.
         *
         * @type {String}
         */
        headerBackgroundColor: {
          type: String,
          observer: '__headerBackgroundColorChanged'
        },
        /**
         * Whether to display or not the number of results on the top-right corner of the filters.
         *
         * @type {Boolean}
         */
        hideNumberResults: {
          type: Boolean,
          value: false
        },
        /**
         * The external identifier property that will be used when painting the active row.
         *
         * @type {String}
         */
        idExternalProperty: {
          type: String,
          value: 'id'
        },
        /**
         * The internal identifier property that will be used when painting the active row.
         *
         * @type {String}
         */
        idInternalProperty: {
          type: String,
          value: '__identifier'
        },
        /**
         * The list of items to be displayed.
         *
         * @type {Array}
         */
        items: {
          type: Array,
          observer: '__itemsChanged'
        },
        /**
         * Flag used to activate the casper-moac's lazy load mode.
         *
         * @type {Boolean}
         */
        lazyLoad: {
          type: Boolean,
          value: false
        },
        /**
         * The initial percentual width of the left-side container.
         *
         * @type {Number}
         */
        leftSideInitialWidth: {
          type: Number,
          value: 40
        },
        /**
         * The maximum percentual width of the left-side container.
         *
         * @type {Number}
         */
        leftSideMaximumWidth: Number,
        /**
         * The minimum percentual width of the left-side container.
         *
         * @type {Number}
         */
        leftSideMinimumWidth: {
          type: Number,
          value: 25
        },
        /**
         * Boolean that toggles the paper-spinner when the grid is loading items. This was required since the vaadin-grid one
         * is readoOnly.
         *
         * @type {Boolean}
         */
        loading: {
          type: Boolean,
          value: false
        },
        /**
         * Label that will be used on the header when multiple items are selected in
         * the vaadin-grid.
         *
         * @type {String}
         */
        multiSelectionLabel: {
          type: String,
          value: 'resultado(s)'
        },
        /**
         * Icon that will be used when the vaadin-grid has no items to display.
         *
         * @type {String}
         */
        noItemsIcon: {
          type: String,
          value: 'fa-light:clipboard'
        },
        /**
         * Text that will be used when the vaadin-grid has no items to display.
         *
         * @type {String}
         */
        noItemsText: {
          type: String,
          value: 'Não existem quaisquer resultados para mostrar.'
        },
        /**
         * The page that is currently using the casper-moac component.
         *
         * @type {Object}
         */
        page: Object,
        /**
         * The external property where the items' parents are stored.
         *
         * @type {String}
         */
        parentExternalProperty: {
          type: String
        },
        /**
         * The children's local property where this component will save their parent identifier
         * to easily remove them later.
         *
         * @type {String}
         */
        parentInternalProperty: {
          type: String,
          value: '__parent'
        },
        /**
         * When this property contains a value, all the URL params will be prefixed to avoid collision with other
         * components which may be present.
         *
         * @type {String}
         */
        prefixUrlParams: String,
        /**
         * List of attributes that should be used to filter.
         *
         * @type {Array}
         */
        resourceFilterAttributes: Array,
        /**
         * Internal property that an item can define which changes its row background color.
         *
         * @type {String}
         */
        rowBackgroundColorInternalProperty: {
          type: String,
          value: '__rowBackgroundColor'
        },
        /**
         * The items that are currently selected in the vaadin-grid.
         *
         * @type {Array}
         */
        selectedItems: {
          type: Array,
          notify: true,
          value: () => [],
          observer: '__selectedItemsChanged'
        },
         /**
         * Flag used to activate the casper-moac's tree grid mode.
         *
         * @type {Boolean}
         */
        treeGrid: {
          type: Boolean,
          value: false
        },
        /**
         * This property is used to mark the range's start and end fields as not required.
         *
         * @type {Boolean}
         */
        __dateRangeFieldsNotRequired: {
          type: Boolean,
          value: false
        },
        /**
         * Whether to display or not all the filters components (casper-select / paper-input / casper-date-picker).
         *
         * @type {Boolean}
         */
        __displayAllFilters: {
          type: Boolean,
          value: false,
          observer: '__displayAllFiltersChanged'
        },
        /**
         * Flag that states if the pill which resets the filters, is visible or not.
         *
         * @type {Boolean}
         */
        __displayResetFiltersButton: {
          type: Boolean,
          value: false
        },
        /**
         * Array that contains the filters which will be mapped and read from the URL.
         *
         * @type {Array}
         */
        __historyStateFilters: {
          type: Array,
          value: []
        },
        /**
         * This object contains the filter keys and values that should not be used to fetch new items since those filters
         * were already applied beforehand.
         *
         * @type {Object}
         */
        __ignoreFiltersValues: {
          type: Object,
          value: () => ({})
        },
        /**
         * This object contains initial filter values so that the user can reset to them if he wants.
         *
         * @type {Object}
         */
        __initialFiltersValues: {
          type: Object,
          value: () => ({})
        },
        /**
         * Array that contains the filters which will be mapped and read from the URL.
         *
         * @type {Array}
         */
        __historyStateFilters: {
          type: Array,
          value: []
        },
        /**
         * Array that contains the filters which will be mapped and read from the local storage.
         *
         * @type {Array}
         */
        __localStorageFilters: {
          type: Array,
          value: []
        }
      };
    }
  }
}