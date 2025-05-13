const React = require('react');
const { ipcRenderer } = require('electron');

const LoginModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await ipcRenderer.invoke('open-gh-login');
    } catch (err) {
      setError('Failed to open login window. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await ipcRenderer.invoke('clear-gh-cookie');
    } catch (err) {
      setError('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-white mb-4">Galaxy Harvester Login</h2>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-300">
            You need to log in to Galaxy Harvester to access resource data.
          </p>

          <div className="flex space-x-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Log In'}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Log Out
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

module.exports = LoginModal; 