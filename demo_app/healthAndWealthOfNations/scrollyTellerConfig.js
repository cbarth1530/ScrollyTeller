/* globals PR */
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { extent } from 'd3-array';
import WealthAndHealthOfNations from './components/wealthAndHealthOfNations';
import snippets from './components/codeSnippets';
import './scss/wealthAndHealth.scss';

/**
 * Called when a narration block is activated
 * @param {object} [params] - object containing parameters
 * @param {number} [params.index] - index of the active narration object
 * @param {number} [params.progress] - 0-1 (sort of) value indicating progress through the active narration block
 * @param {HTMLElement} [params.element] - the narration block DOM element that is currently active
 * @param {string} [params.trigger] - the trigger attribute for narration block that is currently active
 * @param {string} [params.direction] - the direction the event happened in (up or down)
 * @param {string} [params.graphId] - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
 * @param {object} [params.sectionConfig] - the configuration object passed to ScrollyTeller
 * @param {string} [params.sectionConfig.sectionIdentifier] - the identifier for this section
 * @param {object} [params.sectionConfig.graph] - the chart instance, or a reference containing the result of the buildChart() function above
 * @param {object} [params.sectionConfig.data] - the data that was passed in or resolved by the promise and processed by reshapeDataFunction()
 * @param {object} [params.sectionConfig.scroller] - the scrollama object that handles activation of narration, etc
 * @param {object} [params.sectionConfig.cssNames] - the CSSNames object containing some useful functions for getting the css identifiers of narrations, graph, and the section
 * @returns {void}
 */

/** section configuration object with identifier, narration, and data (for the graph)  */
export default {
  /** identifier used to delineate different sections.  Should be unique from other sections
   * identifiers */
  sectionIdentifier: 'healthAndWealth',

  /** narration can be either of the following 3 options:
   *  1) a string representing an absolute file path to a file of the following types:
   *      'csv', 'tsv', 'json', 'html', 'txt', 'xml', which will be parsed by d3.promise
   *  2) array of narration objects,
   *  3) a promise to return an array of narration objects in the appropriate form
   * See README for the specfication of the narration objects */
  narration: 'demo_app/healthAndWealthOfNations/data/narration.csv',

  /** data can be either of the following 4 options:
   *  1) a string representing an absolute file path to a file of the following types:
   *      'csv', 'tsv', 'json', 'html', 'txt', 'xml', which will be parsed by d3-fetch
   *  2) array of data objects
   *  3) a promise to return an array of narration objects in the appropriate form
   *  4) undefined
   */
  /** data from path example */
  data: 'demo_app/healthAndWealthOfNations/data/wealthAndHealthData.json',

  convertTriggerToObject: true,

  /**
   * Optional method to reshape the data passed into ScrollyTeller, or resolved by the data promise
   * @param {object} results - data passed into ScrollyTeller or the result of resolving the data promise (see below).
   * @returns {object|array} -  an object or array of data of user-defined shape
   */
  reshapeDataFunction: function processData(results) {
    /** compute data domains for population (radius), income (x), life expectancy (y), and years
     * These functions compute the data domains [min, max] over a range of years from
     * 1950 - 2008 so the graph axes don't change as we update */
    const rDomain = extent(results.reduce((acc, d) => (acc.concat(...extent(d.population))), []));
    const xDomain = extent(results.reduce((acc, d) => (acc.concat(...extent(d.income))), []));
    const yDomain = extent(results.reduce((acc, d) =>
      (acc.concat(...extent(d.lifeExpectancy))), []));
    const yearDomain = extent(results.reduce((acc, d) => (acc.concat(...extent(d.years))), []));

    /** Legend items are regions, so get unique region names */
    const legendArray = results.reduce((acc, d) =>
      (acc.includes(d.region) ? acc : acc.concat(d.region)), []);

    /** Create a scale to convert progress from [0,1] -> year between [1950 - 2008] */
    const yearProgressScale = scaleLinear()
      .domain([0, 1])
      .range(yearDomain);

    /** return the raw data, domains, and scales, which will be assigned
     * to sectionConfig.data. The sectionConfig object is received by all scrollyteller
     * functions such as buildGraphFunction(), onActivateNarrationFunction(), onScrollFunction() */
    return {
      dataArray: results,
      legendArray,
      rDomain,
      xDomain,
      yDomain,
      yearDomain,
      yearProgressScale,
    };
  },

  /**
   * Called AFTER data is fetched, and reshapeDataFunction is called.  This method should
   * build the graph and return an instance of that graph, which will passed as arguments
   * to the onScrollFunction and onActivateNarration functions.
   *
   * This function is called as follows:
   * buildGraphFunction(graphId, sectionConfig)
   * @param {string} graphId - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
   * @param {object} sectionConfig - the configuration object passed to ScrollyTeller
   * @param {object} [sectionConfig] - the configuration object passed to ScrollyTeller
   * @param {string} [sectionConfig.sectionIdentifier] - the identifier for this section
   * @param {object} [sectionConfig.graph] - the chart instance, or a reference containing the result of the buildChart() function above
   * @param {object} [sectionConfig.data] - the data that was passed in or resolved by the promise and processed by reshapeDataFunction()
   * @param {object} [sectionConfig.scroller] - the scrollama object that handles activation of narration, etc
   * @param {object} [sectionConfig.cssNames] - the CSSNames object containing some useful functions for getting the css identifiers of narrations, graph, and the section
   * @param {object} [params.sectionConfig.elementResizeDetector] - the element-resize-detector object: see https://github.com/wnr/element-resize-detector for usage
   * @returns {object} - chart instance
   */
  buildGraphFunction: function buildGraph(graphId, sectionConfig) {
    const {
      /** destructure the dataArray and domains computed by reshapeDataFunction() from the sectionConfig */
      data: {
        dataArray,
        legendArray,
        rDomain,
        xDomain,
        yDomain,
        yearDomain,
      },
    } = sectionConfig;

    /** create a div to render code snippets */
    select(`#${graphId}`)
      .append('div')
      .attr('id', 'codeSnippet');

    /** build the graph */
    const graph = new WealthAndHealthOfNations({
      container: `#${graphId}`,
      /** data */
      data: dataArray,
      /** data domains */
      rDomain,
      xDomain,
      yDomain,
      yearDomain,
      /** legend values */
      legendArray,
      /** dimensions */
      height: select(`#${graphId}`).node().offsetHeight * 0.9,
      width: select(`#${graphId}`).node().offsetWidth * 0.9,
    });

    /** REMEMBER TO RETURN THE GRAPH! (could also return as an object with multiple graphs, etc)
     * The graph object is assigned to sectionConfig.graph, which is returned to all scrollyteller
     * functions such as buildGraphFunction(), onActivateNarrationFunction(), onScrollFunction()  */
    return graph;
  },

  /**
   * Called upon scrolling of the section. See argument list below, this function is called as:
   * onScrollFunction({ index, progress, element, trigger, graphId, sectionConfig })
   * @param {object} [params] - object containing parameters
   * @param {number} [params.index] - index of the active narration object
   * @param {number} [params.progress] - 0-1 (sort of) value indicating progress through the active narration block
   * @param {HTMLElement} [params.element] - the narration block DOM element that is currently active
   * @param {string} [params.trigger] - the trigger attribute for narration block that is currently active
   * @param {string} [params.graphContainerId] - id of the graph container in this section. const graphContainer = d3.select(`#${graphContainerId}`);
   * @param {string} [params.graphId] - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
   * @param {object} [params.sectionConfig] - the configuration object passed to ScrollyTeller
   * @param {string} [params.sectionConfig.sectionIdentifier] - the identifier for this section
   * @param {object} [params.sectionConfig.graph] - the chart instance, or a reference containing the result of the buildChart() function above
   * @param {object} [params.sectionConfig.data] - the data that was passed in or resolved by the promise and processed by reshapeDataFunction()
   * @param {object} [params.sectionConfig.scroller] - the scrollama object that handles activation of narration, etc
   * @param {object} [params.sectionConfig.cssNames] - the CSSNames object containing some useful functions for getting the css identifiers of narrations, graph, and the section
   * @param {object} [params.sectionConfig.elementResizeDetector] - the element-resize-detector object: see https://github.com/wnr/element-resize-detector for usage
   * @returns {void}
   */
  onScrollFunction: function onScroll({
    state: { yearProgress }, /** destructure year progress variable set from the narration.csv file */
    sectionConfig: {
      graph, /** destructure graph from section config */
      data: {
        /** destructure yearProgressScale (computed by reshapeDataFunction and stored on sectonConfig.data)
         to convert [0,1] progress -> a year in the range [1950,2008] */
        yearProgressScale,
      },
    },
  }) {
    if (yearProgress) {
      graph.render({
        year: Math.floor(yearProgressScale(yearProgress)),
        duration: 100,
      });
    }
  },

  /**
   * Called when a narration block is activated.
   * See argument list below, this function is called as:
   * onActivateNarration({ index, progress, element, trigger, graphId, sectionConfig })
   * @param {object} [params] - object containing parameters
   * @param {number} [params.index] - index of the active narration object
   * @param {number} [params.progress] - 0-1 (sort of) value indicating progress through the active narration block
   * @param {HTMLElement} [params.element] - the narration block DOM element that is currently active
   * @param {string} [params.trigger] - the trigger attribute for narration block that is currently active
   * @param {string} [params.direction] - the direction the event happened in (up or down)
   * @param {string} [params.graphContainerId] - id of the graph container in this section. const graphContainer = d3.select(`#${graphContainerId}`);
   * @param {string} [params.graphId] - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
   * @param {object} [params.sectionConfig] - the configuration object passed to ScrollyTeller
   * @param {string} [params.sectionConfig.sectionIdentifier] - the identifier for this section
   * @param {object} [params.sectionConfig.graph] - the chart instance, or a reference containing the result of the buildChart() function above
   * @param {object} [params.sectionConfig.data] - the data that was passed in or resolved by the promise and processed by reshapeDataFunction()
   * @param {object} [params.sectionConfig.scroller] - the scrollama object that handles activation of narration, etc
   * @param {object} [params.sectionConfig.cssNames] - the CSSNames object containing some useful functions for getting the css identifiers of narrations, graph, and the section
   * @param {object} [params.sectionConfig.elementResizeDetector] - the element-resize-detector object: see https://github.com/wnr/element-resize-detector for usage
   * @returns {void}
   */
  onActivateNarrationFunction: function onActivateNarration({
    graphId,
    state: {
      year,
      snippet,
    }, /** destructure "year" variable from state */
    sectionConfig: { graph }, /** destructure "graph" variable from sectionConfig */
  }) {
    /** DISPLAY CODE SNIPPETS */
    const code = snippet ? `<pre class="prettyprint lang-js">${snippets[snippet]}</pre>` : '';
    select(`#${graphId} #codeSnippet`)
      .html(code);
    PR.prettyPrint();

    /** HIDE GRAPH WHEN CODE SNIPPETS ARE DISPLAYED */
    select(`#${graphId} svg`)
      .attr('opacity', snippet ? 0 : 1);

    /** render a year (year = undefined defaults to min year in component) */
    graph.render({
      year: Number(year),
      duration: 1000,
    });
  },

  /**
   * Called upon resize of the graph container
   * @param {object} [params] - object containing parameters
   * @param {HTMLElement} [params.graphElement] - the narration block DOM element that is currently active
   * @param {string} [params.graphId] - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
   * @param {object} [params.sectionConfig] - the configuration object passed to ScrollyTeller
   * @param {string} [params.graphContainerId] - id of the graph container in this section. const graphContainer = d3.select(`#${graphContainerId}`);
   * @param {string} [params.graphId] - id of the graph in this section. const myGraph = d3.select(`#${graphId}`);
   * @param {string} [params.sectionConfig.sectionIdentifier] - the identifier for this section
   * @param {object} [params.sectionConfig.graph] - the chart instance, or a reference containing the result of the buildChart() function above
   * @param {object} [params.sectionConfig.data] - the data that was passed in or resolved by the promise and processed by reshapeDataFunction()
   * @param {object} [params.sectionConfig.scroller] - the scrollama object that handles activation of narration, etc
   * @param {object} [params.sectionConfig.cssNames] - the CSSNames object containing some useful functions for getting the css identifiers of narrations, graph, and the section
   * @param {object} [params.sectionConfig.elementResizeDetector] - the element-resize-detector object: see https://github.com/wnr/element-resize-detector for usage
   * @returns {void}
   */
  onResizeFunction: function onResize({
    graphElement,
    sectionConfig: { graph },
  }) {
    graph.resize({
      width: graphElement.offsetWidth * 0.9,
      height: graphElement.offsetHeight * 0.9,
    });
  },
};
