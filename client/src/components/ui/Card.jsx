const Card = ({ hover = false, glass = false, className = "", children, ...props }) => (
  <div
    className={`surface-card ${hover ? "surface-card-hover" : ""} ${
      glass ? "surface-glass" : ""
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
