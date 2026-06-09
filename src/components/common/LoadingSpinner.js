const LoadingSpinner = ({ message = 'Loading…', size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-6 w-6 border-2' : 'h-10 w-10 border-[3px]';
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`${sizeClass} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
