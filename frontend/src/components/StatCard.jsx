const StatCard = ({ label, value, icon, image, color }) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-content">
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
      {image ? (
        <img src={image} alt={label} className="stat-card-image" />
      ) : (
        <div className="icon-circle">{icon}</div>
      )}
    </div>
  );
};

export default StatCard;
