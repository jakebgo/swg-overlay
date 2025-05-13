const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function fetchAndAnalyzeHtml() {
  try {
    // Based on how the app is currently fetching data
    const fetchUrl = 'https://galaxyharvester.net/getResourceList.py';
    const { URLSearchParams } = require('url');
    const form = new URLSearchParams({
      galaxy: '118', // Finalizer
      unavailableDays: '0',
      planetSel: 'any',
      resGroup: 'any',
      resType: 'any',
      favorite: '',
      sort: 'quality' // Try to sort by quality to see if that parameter works
    });

    console.log('Fetching HTML from:', fetchUrl);
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const html = await response.text();
    console.log('Received HTML length:', html.length);
    
    // Save the HTML to a file for easier inspection
    const debugDir = path.join(__dirname, 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    const htmlFilePath = path.join(debugDir, 'gh_response.html');
    fs.writeFileSync(htmlFilePath, html);
    console.log('Saved HTML to:', htmlFilePath);

    // Load HTML with cheerio
    const $ = cheerio.load(html);
    
    // Look at the table structure to understand resource data
    const tableStructure = [];
    $('table.resourceStats tr').each((i, row) => {
      const rowEl = $(row);
      const rowData = {
        index: i,
        cells: rowEl.find('td').length,
        hasResourceBox: rowEl.find('div.resourceBox').length > 0,
        text: rowEl.text().substring(0, 100) + '...',
        html: rowEl.html().substring(0, 100) + '...'
      };
      tableStructure.push(rowData);
    });
    
    console.log('Table structure:', JSON.stringify(tableStructure, null, 2));
    
    // Extract specifically just the quality values if they exist
    console.log('\n--- Checking for Quality Values ---');
    const qualityValues = [];
    
    // Look for specific patterns in the HTML
    $('table.resourceStats').each((i, table) => {
      const tableEl = $(table);
      const resources = tableEl.find('div.resourceBox');
      
      resources.each((j, box) => {
        const boxEl = $(box);
        const resourceName = boxEl.find('a.nameLink').first().text().trim();
        
        // Look for elements with text or titles containing "quality" or numbers
        const qualityElement = boxEl.find('*').filter(function() {
          const text = $(this).text().trim();
          const title = $(this).attr('title') || '';
          return (
            text.toLowerCase().includes('quality') ||
            title.toLowerCase().includes('quality') ||
            /Quality: \d+/.test(text) ||
            /Quality: \d+/.test(title)
          );
        });
        
        if (qualityElement.length) {
          qualityValues.push({
            resourceName,
            qualityText: qualityElement.first().text().trim(),
            qualityTitle: qualityElement.first().attr('title') || '',
            elementType: qualityElement.first().prop('tagName')
          });
        }
        
        // Also check links that might contain quality info
        const qualityLinks = boxEl.find('a').filter(function() {
          const href = $(this).attr('href') || '';
          return href.includes('quality') || href.includes('Quality');
        });
        
        if (qualityLinks.length) {
          qualityValues.push({
            resourceName,
            linkText: qualityLinks.first().text().trim(),
            linkHref: qualityLinks.first().attr('href') || ''
          });
        }
      });
    });
    
    console.log('Quality values found:', qualityValues.length);
    console.log('Quality data:', JSON.stringify(qualityValues, null, 2));
    
    // Look for "quality" in sorted column headers
    const sortOptions = [];
    $('select[name="sort"] option').each((i, option) => {
      const optionEl = $(option);
      sortOptions.push({
        value: optionEl.attr('value'),
        text: optionEl.text().trim(),
        isSelected: optionEl.attr('selected') !== undefined
      });
    });
    
    console.log('\nSort options:', JSON.stringify(sortOptions, null, 2));
    
    // Try to find the quality value by looking at spans
    console.log('\n--- Looking for specific quality spans ---');
    const spans = $('span');
    spans.each((i, span) => {
      const spanEl = $(span);
      const text = spanEl.text().trim();
      const title = spanEl.attr('title') || '';
      
      if (text.includes('quality') || text.includes('Quality') ||
          title.includes('quality') || title.includes('Quality') || 
          /\b\d+\/\d+\b/.test(text)) {
        console.log(`Span ${i}:`, {
          text,
          title,
          html: spanEl.html(),
          parentHtml: spanEl.parent().html().substring(0, 100) + '...'
        });
      }
    });

  } catch (error) {
    console.error('Error fetching and analyzing HTML:', error);
  }
}

// Run the function
fetchAndAnalyzeHtml(); 