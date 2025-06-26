import React, { useState, useEffect } from 'react';
import SyncFastLogViewer from './SyncFastLogViewer';
import simpleLogger from '../../../utils/simpleLogger';
import simpleSyncGuard from '../../../utils/simpleSyncGuard';

const LogViewerButton = () => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [hasNewErrors, setHasNewErrors] = useState(false);
  const [hasRetryItems, setHasRetryItems] = useState(false);

  useEffect(() => {
    const updateCounts = async () => {
      try {
        const logStats = simpleLogger.getStats();
        const simpleSyncStats = simpleSyncGuard.getStats();
        
        const newErrorCount = logStats.errors;
        const newRetryCount = simpleSyncStats.total;
        
        // Check for new errors
        if (newErrorCount > errorCount) {
          setHasNewErrors(true);
          setTimeout(() => setHasNewErrors(false), 5000);
        }
        
        // Check for pending sync orders
        setHasRetryItems(newRetryCount > 0);
        
        setErrorCount(newErrorCount);
        setRetryCount(newRetryCount);
      } catch (error) {
        console.warn('Error updating counts:', error);
      }
    };

    // Check every 5 seconds for more responsive updates
    const interval = setInterval(updateCounts, 5000);
    
    // Initial check
    updateCounts();

    return () => {
      clearInterval(interval);
    };
  }, [errorCount, retryCount]);

  const handleOpenLogViewer = () => {
    setIsLogViewerOpen(true);
    setHasNewErrors(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        className={`log-viewer-fab ${hasNewErrors ? 'has-errors' : ''} ${hasRetryItems ? 'has-retries' : ''}`}
        onClick={handleOpenLogViewer}
        title={`SyncFast Logs - Errors: ${errorCount}, Pending Sync: ${retryCount}`}
      >
        <span className="fab-icon">📊</span>
        
        {/* Error Badge */}
        {errorCount > 0 && (
          <span className="error-badge">{errorCount}</span>
        )}
        
        {/* Retry Queue Badge */}
        {retryCount > 0 && (
          <span className="retry-badge">{retryCount}</span>
        )}
      </div>

      {/* Log Viewer Modal */}
      <SyncFastLogViewer 
        isOpen={isLogViewerOpen}
        onClose={() => setIsLogViewerOpen(false)}
      />

      <style jsx>{`
        .log-viewer-fab {
          position: fixed;
          top: 15px;
          right: 220px;
          width: 24px;
          height: 24px;
          background-color: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          z-index: 999;
          transition: all 0.3s ease;
          user-select: none;
        }

        .log-viewer-fab:hover {
          background-color: #0056b3;
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
        }

        .log-viewer-fab.has-errors {
          background-color: #dc3545;
          animation: pulse 2s infinite;
        }

        .log-viewer-fab.has-errors:hover {
          background-color: #c82333;
        }

        .log-viewer-fab.has-retries {
          background-color: #ffc107;
        }

        .log-viewer-fab.has-retries:hover {
          background-color: #e0a800;
        }

        .log-viewer-fab.has-errors.has-retries {
          background: linear-gradient(45deg, #dc3545 50%, #ffc107 50%);
        }

        .fab-icon {
          font-size: 12px;
          color: white;
        }

        .error-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #fff;
          color: #dc3545;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: bold;
          border: 2px solid #dc3545;
          z-index: 2;
        }

        .retry-badge {
          position: absolute;
          top: -8px;
          left: -8px;
          background-color: #fff;
          color: #ffc107;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: bold;
          border: 2px solid #ffc107;
          z-index: 2;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
          }
        }

        @media (max-width: 768px) {
          .log-viewer-fab {
            bottom: 15px;
            right: 15px;
            width: 48px;
            height: 48px;
          }
          
          .fab-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default LogViewerButton; 