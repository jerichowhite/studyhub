import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import UserStatusIndicator from './UserStatusIndicator';
import { useAuth } from '../../context/AuthContext';

const UserSearchModal = ({ onClose, onSelectUser }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const usersList = [];
        snapshot.forEach((doc) => {
          if (doc.id !== currentUser.uid) { // Exclude self
            usersList.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        // Optionally sort by online status then alphabetically
        usersList.sort((a, b) => {
          if (a.online === b.online) {
            return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
          }
          return a.online ? -1 : 1;
        });

        setAvailableUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const filtered = availableUsers.filter((u) => {
    const searchName = u.displayName || u.name || '';
    return searchName.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h3 className="font-bold text-gray-800">New Message</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-50 shrink-0">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name…"
              className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {loadingUsers ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No users found</p>
            ) : (
              filtered.map((u) => {
                const displayName = u.displayName || u.name || 'User';
                return (
                  <button
                    key={u.id}
                    onClick={() => { onSelectUser(u); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors focus:bg-blue-50 focus:outline-none text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm overflow-hidden">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <UserStatusIndicator online={u.online} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {u.department} {u.level ? `· Level ${u.level}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSearchModal;
