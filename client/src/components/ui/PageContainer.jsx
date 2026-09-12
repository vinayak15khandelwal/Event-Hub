const PageContainer = ({ className = "", children }) => (
  <div className={`page-container py-8 sm:py-10 ${className}`}>{children}</div>
);

export default PageContainer;
