const { session } = require('electron');
const cheerio = require('cheerio');

class ResourceService {
  constructor() {
    this.baseUrl = 'https://galaxyharvester.net';
    this.resources = [];
    this.lastUpdate = null;
    this.currentServer = '118'; // Default to Finalizer (118)
    this.sortBy = 'timeEntered'; // Default sort by time entered
  }

  setServer(serverId) {
    this.currentServer = serverId;
    console.log('Server set to:', serverId);
  }

  setSortBy(sortBy) {
    // Validate sort options
    const validSortOptions = ['timeEntered', 'resName', 'resType'];
    
    // Convert our app sort column names to Galaxy Harvester sort parameters
    const sortMapping = {
      'name': 'resName',
      'category': 'resType',
      'timeUploaded': 'timeEntered'
    };
    
    const ghSortParam = sortMapping[sortBy] || sortBy;
    
    if (validSortOptions.includes(ghSortParam)) {
      this.sortBy = ghSortParam;
      console.log('Sort set to:', this.sortBy);
      return true;
    } else {
      console.warn('Invalid sort option:', sortBy);
      return false;
    }
  }

  async debugUrlStructure() {
    try {
      console.log('Starting URL structure debug...');
      
      // Create a visible window for debugging
      const { BrowserWindow } = require('electron');
      const debugWindow = new BrowserWindow({
        show: true,
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      try {
        // First visit the home page
        console.log('Visiting home page...');
        await debugWindow.loadURL(`${this.baseUrl}/ghHome.py`);
        
        // Wait for the home page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the current URL after any redirects
        const currentUrl = debugWindow.webContents.getURL();
        console.log('Current URL after home page:', currentUrl);
        
        // Get all links on the page
        const links = await debugWindow.webContents.executeJavaScript(`
          Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }))
        `);
        
        console.log('Found links:', links);
        
        // Look for resource-related links
        const resourceLinks = links.filter(link => 
          link.href.includes('Resource') || 
          link.href.includes('resource') ||
          link.text.includes('Resource') ||
          link.text.includes('resource')
        );
        
        console.log('Resource-related links:', resourceLinks);
        
        // If we found any resource links, click the first one
        if (resourceLinks.length > 0) {
          console.log('Clicking resource link:', resourceLinks[0]);
          await debugWindow.loadURL(resourceLinks[0].href);
          
          // Wait for the page to load
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Get the final URL
          const finalUrl = debugWindow.webContents.getURL();
          console.log('Final URL after clicking resource link:', finalUrl);
          
          // Get the page content
          const html = await debugWindow.webContents.executeJavaScript('document.documentElement.outerHTML');
          console.log('Page content length:', html.length);
          console.log('Page content preview:', html.substring(0, 500));
        }
        
        return {
          homeUrl: currentUrl,
          resourceLinks,
          finalUrl: resourceLinks.length > 0 ? debugWindow.webContents.getURL() : null
        };
      } finally {
        // Keep the window open for manual inspection
        console.log('Debug window is open for manual inspection');
      }
    } catch (error) {
      console.error('Error in URL structure debug:', error);
      throw error;
    }
  }

  async fetchResources() {
    try {
      console.log('Starting resource fetch...');
      
      // Get all cookies from the session
      const cookies = await session.defaultSession.cookies.get({});
      console.log('Found cookies:', cookies.map(c => ({ name: c.name, domain: c.domain })));
      
      // Find the gh_sid cookie
      const ghCookie = cookies.find(cookie => 
        cookie.domain === 'galaxyharvester.net' && 
        cookie.name === 'gh_sid'
      );

      if (!ghCookie) {
        console.log('No gh_sid cookie found');
        throw new Error('Not authenticated');
      }

      console.log('Found gh_sid cookie, proceeding with request');

      // Direct HTTP POST fetch bypassing BrowserWindow and AJAX timing issues
      const fetch = require('node-fetch');
      const { URLSearchParams } = require('url');
      const form = new URLSearchParams({
        galaxy: this.currentServer,
        unavailableDays: '0',
        planetSel: 'any',
        resGroup: 'any',
        resType: 'any',
        favorite: '',
        sort: this.sortBy // Use the configurable sort parameter
      });
      const fetchUrl = `${this.baseUrl}/getResourceList.py`;
      console.log('Posting to getResourceList.py with form data:', form.toString());
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: `gh_sid=${ghCookie.value}` },
        body: form
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const snippet = await response.text();
      console.log('HTTP snippet preview:', snippet.substring(0, 500));
      const resources = this.parseResourceData(snippet);
      console.log('Parsed resources via direct HTTP:', resources.length);
      this.resources = resources;
      this.lastUpdate = new Date();
      return { resources, timestamp: this.lastUpdate };
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  parseResourceData(html) {
    console.log('Starting HTML parsing...');
    const $ = cheerio.load(html);
    const resources = [];
    
    // Look for sort options to verify available sorting methods
    console.log('Available sort options:');
    $('select[name="sort"] option').each((i, option) => {
      console.log($(option).attr('value'), '-', $(option).text().trim());
    });
    
    // Iterate each resourceBox div in the stats table
    $('table.resourceStats div.resourceBox').each((i, box) => {
      const boxEl = $(box);
      
      // Debug first resourceBox
      if (i === 0) {
        const inlineBlocks = boxEl.find('div.inlineBlock');
        const blockTexts = inlineBlocks.map((idx, b) => $(b).text().trim()).get();
        console.log('InlineBlock texts for first resourceBox:', blockTexts);
        // Log spawn row HTML for debugging planets and stats counts
        const boxRow = boxEl.closest('tr');
        const spawnRow = boxRow.next();
        console.log('Spawn row HTML for first resourceBox:', spawnRow.html());
      }
      
      // Resource name
      const name = boxEl.find('a.nameLink').first().text().trim();
      
      // Full category text 
      const typeLinkEl = boxEl.find('a.nameLink').eq(1);
      const category = typeLinkEl.text().trim();
      
      // Extract available planets from the planetBar
      const planets = [];
      const planetCodes = {
        'C': 'Corellia', 'D': 'Dantooine', 'D': 'Dathomir', 'E': 'Endor',
        'L': 'Lok', 'N': 'Naboo', 'R': 'Rori', 'T': 'Talus', 
        'T': 'Tatooine', 'Y': 'Yavin 4'
      };
      
      boxEl.find('ul.planetBar li.planetBarBox').each((j, planet) => {
        const planetEl = $(planet);
        if (!planetEl.hasClass('planetUnavailable')) {
          // Extract planet from title attribute which contains "X - marked available by Y"
          const title = planetEl.attr('title') || '';
          const planetName = title.split(' - ')[0];
          if (planetName) planets.push(planetName);
        }
      });
      
      // If no planets found from planetBar, try to get from slug
      if (planets.length === 0) {
        const href = typeLinkEl.attr('href') || '';
        const parts = href.split('_');
        if (parts.length > 1) {
          const slug = parts[parts.length - 1];
          // Check if slug is a planet name
          if (/^(corellia|dantooine|dathomir|endor|lok|naboo|rori|talus|tatooine|yavin)/.test(slug)) {
            const planetName = slug.charAt(0).toUpperCase() + slug.slice(1);
            planets.push(planetName);
          }
        }
      }
      
      // Extract stats with values and percentages
      const statsData = {};
      const statTable = boxEl.find('table.resAttr');
      const statHeaders = statTable.find('td.header span').map((j, el) => $(el).text()).get();
      
      statTable.find('tr').eq(1).find('td').each((j, cell) => {
        if (j < statHeaders.length) {
          const cellEl = $(cell);
          const valueText = cellEl.find('span').text();
          if (valueText) {
            const matches = valueText.match(/(\d+)\s*\((\d+)%\)/);
            if (matches) {
              statsData[statHeaders[j]] = {
                value: parseInt(matches[1], 10),
                percentage: parseInt(matches[2], 10)
              };
            }
          }
        }
      });
      
      // Gather inlineBlock texts for time and uploader
      const blocks = boxEl.find('div.inlineBlock');
      const blockTexts = blocks.map((idx, b) => $(b).text().trim()).get();
      
      // Extract time uploaded and uploader
      const timeBlock = blockTexts.find(text => /ago by/.test(text)) || '';
      const [timeUploaded, uploadedBy] = timeBlock.includes(' by ')
        ? timeBlock.split(' by ') : [null, null];
      
      // Create resource object with all the extracted data
      const resource = { 
        name, 
        timeUploaded, 
        uploadedBy, 
        category, 
        stats: statsData, 
        planets, 
        amount: null
      };
      
      console.log('Found resource:', resource);
      resources.push(resource);
    });
    
    console.log('Finished parsing, found', resources.length, 'resources');
    return resources;
  }

  getLastUpdate() {
    return this.lastUpdate;
  }
}

module.exports = new ResourceService(); 