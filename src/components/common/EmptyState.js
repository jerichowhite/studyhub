const EmptyState = ({
  icon: Icon = null,
  title = 'No data yet',
  message = 'Get started by adding something!',
  actionLabel = null,
  onAction = null,
}) => (
  <div className="flex flex-col items-center justify-center py-14 text-center px-4">
    {Icon && (
      <div className="mb-4">
        <Icon className="w-14 h-14 text-gray-300 dark:text-gray-600" />
      </div>
    )}
    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
