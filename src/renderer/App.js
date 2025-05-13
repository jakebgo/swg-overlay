const React = require('react');
const { ipcRenderer } = require('electron');
const LoginModal = require('./components/LoginModal');

const App = () => {
  const [isClickThrough, setIsClickThrough] = React.useState(false);
  const [resources, setResources] = React.useState([]);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [cookieExpiry, setCookieExpiry] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedServer, setSelectedServer] = React.useState('118'); // Default to Finalizer
  const [filterText, setFilterText] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState('name');
  const [sortOrder, setSortOrder] = React.useState('asc');

  // Server options
  const servers = [
    { id: '118', name: 'Finalizer' },
    { id: '119', name: 'Sentinel\'s Republic' },
    { id: '120', name: 'Sunrunner II' },
    { id: '121', name: 'Ancient Empire [NGE]' },
    { id: '122', name: 'Attack of the Clones: Equinox' },
    { id: '123', name: 'Attack of the Clones: Malevolence' },
    { id: '124', name: 'EisleyEmu (Europe)' },
    { id: '125', name: 'Empire in Flames' },
    { id: '126', name: 'EU-Aurora' },
    { id: '127', name: 'FarStar-Reborn [NGE]' },
    { id: '128', name: 'Genesis' },
    { id: '129', name: 'Malachor-v [NGE]' },
    { id: '130', name: 'Renegades' },
    { id: '131', name: 'Restoration 3 [NGE]' },
    { id: '132', name: 'RogueOne' },
    { id: '133', name: 'SR Alderaan' },
    { id: '134', name: 'Stardust 2.1' },
    { id: '135', name: 'StarforgeDEV' },
    { id: '136', name: 'SWG Animus' },
    { id: '137', name: 'SWG Awakening' },
    { id: '138', name: 'SWG Beyond [NGE]' },
    { id: '139', name: 'SWG Flurry Classic' },
    { id: '140', name: 'SWG Hardcore' },
    { id: '141', name: 'SWG Infinity' },
    { id: '142', name: 'SWG Koltor' },
    { id: '143', name: 'SWG Legacy [NGE]' },
    { id: '144', name: 'SWG Legends [NGE]' },
    { id: '145', name: 'SWG Phoenix' },
    { id: '146', name: 'SWG Syndicate' },
    { id: '147', name: 'SWG The Hunted' },
    { id: '148', name: 'SWG Utopia [NGE]' },
    { id: '149', name: 'SWG: Resurgence | Apotheosis [NGE]' },
    { id: '150', name: 'SWGReckoning' },
    { id: '151', name: 'Tarkins Revenge' },
    { id: '152', name: 'Test Center: Infinity' },
    { id: '153', name: 'Test Center: Nova' }
  ];

  const handleServerChange = async (event) => {
    const serverId = event.target.value;
    try {
      await ipcRenderer.invoke('set-server', serverId);
      setSelectedServer(serverId);
      // Refresh resources after server change
      fetchResources();
    } catch (error) {
      console.error('Error changing server:', error);
      setError('Failed to change server');
    }
  };

  React.useEffect(() => {
    // Listen for click-through toggle events
    ipcRenderer.on('click-through-toggled', (_, isClickThrough) => {
      setIsClickThrough(isClickThrough);
    });

    // Listen for resource updates
    ipcRenderer.on('resources-updated', (_, { resources, timestamp }) => {
      setResources(resources);
      setLastUpdated(new Date(timestamp));
    });

    // Listen for login events
    ipcRenderer.on('login-success', (_, { expires }) => {
      setIsAuthenticated(true);
      setCookieExpiry(new Date(expires * 1000)); // Convert to milliseconds
      setIsLoginModalOpen(false);
    });

    ipcRenderer.on('login-cleared', () => {
      setIsAuthenticated(false);
      setCookieExpiry(null);
      setResources([]);
    });

    // Add resource error handling
    ipcRenderer.on('resource-error', (_, error) => {
      console.error('Resource error:', error);
      setError(error);
      setIsLoading(false);
    });

    // Fetch resources when authenticated
    if (isAuthenticated) {
      fetchResources();
    }

    return () => {
      ipcRenderer.removeAllListeners('click-through-toggled');
      ipcRenderer.removeAllListeners('resources-updated');
      ipcRenderer.removeAllListeners('login-success');
      ipcRenderer.removeAllListeners('login-cleared');
      ipcRenderer.removeAllListeners('resource-error');
    };
  }, [isAuthenticated]);

  const fetchResources = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await ipcRenderer.invoke('fetch-resources');
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatExpiryTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const days = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Session expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  // Deprecated debug function
  const handleDebugUrl = async () => {
    // Functionality removed
    return;
  };

  // Filter and sort resources before display
  const displayedResources = React.useMemo(() => {
    let filtered = resources.filter(r => {
      // Text filter
      const matchesText = 
        r.name.toLowerCase().includes(filterText.toLowerCase()) ||
        r.category.toLowerCase().includes(filterText.toLowerCase()) ||
        (r.planets && r.planets.some(p => p.toLowerCase().includes(filterText.toLowerCase())));
      
      return matchesText;
    });
    
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Handle special cases for sorting
      if (sortColumn === 'planets') {
        aVal = a.planets && a.planets.length > 0 ? a.planets.join(', ') : '';
        bVal = b.planets && b.planets.length > 0 ? b.planets.join(', ') : '';
      }
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      // For string comparison
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      // For numeric comparison
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return filtered;
  }, [resources, filterText, sortColumn, sortOrder]);

  // Add the missing renderSortIndicator function
  const renderSortIndicator = () => {
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
      
      // If sorting by server-side sortable columns, update server sort
      if (['name', 'category', 'timeUploaded'].includes(column)) {
        // Set the sort parameter on the server side
        ipcRenderer.invoke('set-sort', column)
          .then(result => {
            if (result.success) {
              // Refresh resources with the new sort
              fetchResources();
            }
          })
          .catch(err => {
            console.error('Error setting sort parameter:', err);
          });
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="gh-header bg-gray-800 bg-opacity-75 text-white">
        {/* Top Row */}
        <div className="header-row">
          <div>
            <span className="font-bold text-lg header-item">GH Overlay</span>
          </div>
          <div className="header-item">
            Click-through: {isClickThrough ? 'On' : 'Off'}
          </div>
          <div className="header-item">
            Last updated: {formatTimeAgo(lastUpdated)}
          </div>
        </div>
        
        {/* Server Selection Row */}
        <div className="header-row">
          <select
            value={selectedServer}
            onChange={handleServerChange}
            className="header-item bg-gray-700 text-white px-2 py-1 rounded w-full dropdown-large"
            style={{maxWidth: "300px", maxHeight: "400px"}}
          >
            {servers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Bottom Row */}
        <div className="header-row">
          {isAuthenticated ? (
            <>
              <div className="header-item flex items-center">
                <span className="text-sm text-green-400 mr-2">●</span>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  title="Click to manage login"
                >
                  Logged in
                </button>
              </div>
              
              <div className="header-item text-gray-300">
                {formatExpiryTime(cookieExpiry)}
              </div>
              
              <button
                onClick={fetchResources}
                disabled={isLoading}
                className={`text-blue-400 hover:text-blue-300 header-item ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh resources"
              >
                {isLoading ? '↻ Loading...' : '↻ Refresh'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-red-400 hover:text-red-300 header-item"
            >
              Not logged in
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 bg-opacity-75 text-white p-2 text-sm">
          Error: {error}
        </div>
      )}

      {/* Resource Table */}
      <div className="p-4">
        {/* Filter and Sort Controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter resources..."
            className="px-2 py-1 rounded bg-gray-700 text-white w-full sm:w-auto flex-grow"
          />
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={sortColumn}
              onChange={e => setSortColumn(e.target.value)}
              className="px-2 py-1 rounded bg-gray-700 text-white w-full sm:w-auto"
            >
              <option value="name">Resource Name</option>
              <option value="timeUploaded">Time Uploaded</option>
              <option value="uploadedBy">Uploaded By</option>
              <option value="category">Category</option>
              <option value="planets">Planets</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 rounded bg-gray-700 text-white w-full sm:w-auto"
            >
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Category</th>
                <th>Planets</th>
                <th>Stats</th>
                <th>Uploaded</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {!isAuthenticated ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400">
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Click here to log in to Galaxy Harvester
                    </button>
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400">
                    Loading resources...
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400">
                    No resources found
                  </td>
                </tr>
              ) : (
                displayedResources.map((resource, idx) => (
                  <tr key={resource.name + idx} className="bg-gray-800 hover:bg-gray-700">
                    <td data-label="Resource" className="font-medium text-white">
                      {resource.name}
                    </td>
                    <td data-label="Category" className="text-gray-300">
                      {resource.category}
                    </td>
                    <td data-label="Planets" className="text-gray-300">
                      {resource.planets && resource.planets.join(', ')}
                    </td>
                    <td data-label="Stats" className="text-gray-300">
                      {resource.stats && Object.entries(resource.stats).map(([stat, data]) => (
                        data && data.value ? 
                        <span key={stat} className="inline-block mr-2 mb-1 px-2 py-1 rounded bg-gray-700">
                          {stat}: {data.value} ({data.percentage}%)
                        </span> : null
                      ))}
                    </td>
                    <td data-label="Uploaded" className="text-gray-300">
                      {resource.timeUploaded}
                    </td>
                    <td data-label="By" className="text-gray-300">
                      {resource.uploadedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 bg-opacity-75 text-white p-2 text-sm flex flex-wrap justify-between">
        <div className="w-full sm:w-auto mb-1 sm:mb-0 text-center sm:text-left">
          Alt+V: Toggle Visibility | Alt+C: Toggle Click-through
        </div>
        <div className="w-full sm:w-auto text-center sm:text-right">
          {lastUpdated && `Data from ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

module.exports = App; 