// Remounts on every navigation within /trips, fading the incoming view in so
// switching between trip views (and trips) feels like a soft cut, not a flash.
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
