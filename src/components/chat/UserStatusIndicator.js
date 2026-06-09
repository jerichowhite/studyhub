// Small green/gray dot indicating online/offline status.
// Props:
//   online  – boolean
//   size    – 'sm' | 'md' (default 'sm')
//   className – extra classes for positioning

const UserStatusIndicator = ({ online, size = 'sm', className = '' }) => {
  const dim = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  return (
    <span
      className={`block rounded-full border-2 border-white ${dim} ${
        online ? 'bg-green-500' : 'bg-gray-300'
      } ${className}`}
      title={online ? 'Online' : 'Offline'}
    />
  );
};

export default UserStatusIndicator;
