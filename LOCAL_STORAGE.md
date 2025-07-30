# Local Storage Implementation

## Overview

The Job Application Tracker now includes comprehensive local storage functionality with automatic synchronization between the frontend and backend. This ensures data persistence and offline capability.

## Features

### 🔄 **Automatic Synchronization**
- Real-time sync between local storage and backend API
- Conflict resolution (backend takes precedence)
- Automatic sync when coming back online
- Manual sync button for immediate synchronization

### 📱 **Offline Support**
- Full functionality when offline
- Changes are queued and synced when connection is restored
- Temporary IDs for offline-created applications
- Pending changes counter

### 💾 **Data Persistence**
- All job applications stored in browser localStorage
- Automatic loading on app startup
- Error handling for storage failures
- Data validation and sanitization

## Architecture

### Hooks

#### `useLocalStorage`
- Manages job applications in browser localStorage
- Provides CRUD operations (Create, Read, Update, Delete)
- Handles loading states and error management
- Automatic persistence on data changes

#### `useSyncManager`
- Manages synchronization between local storage and backend
- Handles online/offline status detection
- Provides sync status information
- Implements conflict resolution logic

### Components

#### `SyncStatus`
- Displays current sync status
- Shows online/offline indicator
- Displays pending changes count
- Provides manual sync button
- Shows last sync time

## Usage

### Basic Local Storage Operations

```typescript
import { useLocalStorage } from './hooks/useLocalStorage';

const {
  applications,
  addApplication,
  updateApplication,
  deleteApplication,
  isLoading,
  error
} = useLocalStorage();
```

### Synchronization

```typescript
import { useSyncManager } from './hooks/useSyncManager';

const {
  syncStatus,
  addApplicationWithSync,
  updateApplicationWithSync,
  deleteApplicationWithSync,
  forceSync
} = useSyncManager();
```

## Data Flow

1. **Application Start**
   - Load data from localStorage
   - Attempt to sync with backend
   - Display cached data immediately

2. **Adding Applications**
   - If online: Save to backend first, then localStorage
   - If offline: Save to localStorage with temporary ID
   - Queue for sync when online

3. **Updating Applications**
   - If online: Update backend first, then localStorage
   - If offline: Update localStorage, queue for sync

4. **Deleting Applications**
   - If online: Delete from backend first, then localStorage
   - If offline: Delete from localStorage, queue for sync

5. **Synchronization**
   - Fetch latest data from backend
   - Merge with local changes
   - Resolve conflicts (backend wins)
   - Update localStorage with merged data

## Storage Keys

- `jobApplications`: Main job applications data
- `pendingChanges`: Count of unsynchronized changes
- `lastSync`: Timestamp of last successful sync

## Error Handling

- **Storage Errors**: Graceful fallback with user notification
- **Network Errors**: Offline mode with queued changes
- **Sync Errors**: Retry mechanism with exponential backoff
- **Data Corruption**: Validation and recovery procedures

## Performance Considerations

- **Lazy Loading**: Data loaded only when needed
- **Debounced Updates**: Batch localStorage writes
- **Efficient Merging**: Smart conflict resolution
- **Memory Management**: Cleanup of old data

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Storage Limits**: ~5-10MB per domain
- **Private Browsing**: Limited functionality (data cleared on close)

## Testing

Run the test suite to verify local storage functionality:

```bash
npm test useLocalStorage
```

## Future Enhancements

- **IndexedDB**: For larger datasets
- **Service Worker**: For better offline experience
- **Real-time Sync**: WebSocket integration
- **Data Export**: Backup and restore functionality
- **Multi-device Sync**: User authentication and cloud sync 