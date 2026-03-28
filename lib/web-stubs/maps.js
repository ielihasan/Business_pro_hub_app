// Web stub for react-native-maps — not supported on web
const React = require('react');
const { View, Text } = require('react-native');

const MapView = ({ style, children }) =>
  React.createElement(View, { style: [{ backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }, style] },
    React.createElement(Text, { style: { color: '#666', fontSize: 16 } }, 'Map not available on web'),
    children
  );

MapView.Animated = MapView;

const Marker = () => null;
const Circle = () => null;
const Callout = () => null;
const Polyline = () => null;
const Polygon = () => null;
const Overlay = () => null;

const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = null;

module.exports = {
  default: MapView,
  MapView,
  Marker,
  Circle,
  Callout,
  Polyline,
  Polygon,
  Overlay,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
};
