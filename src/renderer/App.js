const React = require('react');
const { ipcRenderer } = require('electron');

const App = () => {
  const [isClickThrough, setIsClickThrough] = React.useState(false);
  const [resources, setResources] = React.useState([]);
  const [lastUpdated, setLastUpdated] = React.useState(null);

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

    return () => {
      ipcRenderer.removeAllListeners('click-through-toggled');
      ipcRenderer.removeAllListeners('resources-updated');
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="gh-header bg-gray-800 bg-opacity-75 text-white p-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold">GH Overlay</span>
          <span className="text-sm click-through-status">
            Click-through: {isClickThrough ? 'On' : 'Off'}
          </span>
        </div>
        <div className="text-sm">
          Last updated: {formatTimeAgo(lastUpdated)}
        </div>
      </div>

      {/* Resource Table */}
      <div className="p-4">
        <table className="w-full bg-gray-900 bg-opacity-75 text-white rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 text-left">Resource</th>
              <th className="p-2 text-left">Planet</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Quality</th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-400">
                  No resources found. Please log in to Galaxy Harvester.
                </td>
              </tr>
            ) : (
              resources.map((resource, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="p-2">{resource.name}</td>
                  <td className="p-2">{resource.planet}</td>
                  <td className="p-2">{resource.amount}</td>
                  <td className="p-2">{resource.quality}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 text-white p-2 text-sm flex justify-between">
        <div>
          Alt+V: Toggle Visibility | Alt+C: Toggle Click-through
        </div>
        <div>
          {lastUpdated && `Data from ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>
    </div>
  );
};

module.exports = App; 