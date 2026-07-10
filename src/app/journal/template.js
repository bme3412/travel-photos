// Remounts on every navigation within this segment, fading the incoming view
// in so switching trip views feels like a soft cut, not a flash.
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
