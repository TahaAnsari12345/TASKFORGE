import { getAvatarBg, getInitials } from "../utils/helpers";

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 44,
};

function Avatar({ name = "User", size = "md" }) {
  const avatarSize = sizeMap[size] || sizeMap.md;
  const { bg, color } = getAvatarBg(name);
  
  return (
    <span
      className="avatar-circle"
      style={{
        width: avatarSize,
        height: avatarSize,
        backgroundColor: bg,
        color: color,
        fontSize: size === 'sm' ? '10px' : '12px'
      }}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
