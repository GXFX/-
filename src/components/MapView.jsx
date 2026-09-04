import { useEffect, useRef } from "react";
import L from "leaflet";

// Настоящий контур города Мытищи (OSM relation 376977, основное кольцо)
const MYTISHCHI_ZONE_POLYGON = [
  { lat: 55.8952, lng: 37.68512 },
  { lat: 55.8964, lng: 37.6858 },
  { lat: 55.89646, lng: 37.68596 },
  { lat: 55.89658, lng: 37.68636 },
  { lat: 55.89685, lng: 37.68656 },
  { lat: 55.89791, lng: 37.68562 },
  { lat: 55.89916, lng: 37.6862 },
  { lat: 55.90001, lng: 37.68707 },
  { lat: 55.9049, lng: 37.69387 },
  { lat: 55.91286, lng: 37.7002 },
  { lat: 55.91681, lng: 37.70333 },
  { lat: 55.92221, lng: 37.70563 },
  { lat: 55.92232, lng: 37.70601 },
  { lat: 55.92244, lng: 37.70641 },
  { lat: 55.92256, lng: 37.70673 },
  { lat: 55.9227, lng: 37.707 },
  { lat: 55.92302, lng: 37.70766 },
  { lat: 55.92342, lng: 37.70852 },
  { lat: 55.92383, lng: 37.70939 },
  { lat: 55.92501, lng: 37.71188 },
  { lat: 55.92556, lng: 37.71306 },
  { lat: 55.92638, lng: 37.71478 },
  { lat: 55.92666, lng: 37.71535 },
  { lat: 55.92721, lng: 37.71649 },
  { lat: 55.92812, lng: 37.71839 },
  { lat: 55.92858, lng: 37.71936 },
  { lat: 55.92869, lng: 37.71957 },
  { lat: 55.92871, lng: 37.7194 },
  { lat: 55.92903, lng: 37.7201 },
  { lat: 55.92986, lng: 37.72131 },
  { lat: 55.93333, lng: 37.72533 },
  { lat: 55.93391, lng: 37.72898 },
  { lat: 55.93456, lng: 37.73566 },
  { lat: 55.93471, lng: 37.73724 },
  { lat: 55.93502, lng: 37.74008 },
  { lat: 55.93517, lng: 37.74092 },
  { lat: 55.93547, lng: 37.74179 },
  { lat: 55.9359, lng: 37.74291 },
  { lat: 55.93619, lng: 37.74344 },
  { lat: 55.93682, lng: 37.74459 },
  { lat: 55.93701, lng: 37.74493 },
  { lat: 55.9375, lng: 37.74572 },
  { lat: 55.93943, lng: 37.74877 },
  { lat: 55.94009, lng: 37.7498 },
  { lat: 55.94047, lng: 37.75041 },
  { lat: 55.94086, lng: 37.75103 },
  { lat: 55.9413, lng: 37.75172 },
  { lat: 55.94159, lng: 37.75222 },
  { lat: 55.94195, lng: 37.75218 },
  { lat: 55.94231, lng: 37.75183 },
  { lat: 55.94709, lng: 37.75152 },
  { lat: 55.95371, lng: 37.75033 },
  { lat: 55.95508, lng: 37.75037 },
  { lat: 55.95618, lng: 37.74941 },
  { lat: 55.95644, lng: 37.74953 },
  { lat: 55.95892, lng: 37.75196 },
  { lat: 55.96017, lng: 37.75237 },
  { lat: 55.96014, lng: 37.75374 },
  { lat: 55.96008, lng: 37.75405 },
  { lat: 55.96092, lng: 37.75512 },
  { lat: 55.96058, lng: 37.75733 },
  { lat: 55.96168, lng: 37.75844 },
  { lat: 55.9615, lng: 37.7637 },
  { lat: 55.96234, lng: 37.7643 },
  { lat: 55.9625, lng: 37.76347 },
  { lat: 55.96352, lng: 37.76359 },
  { lat: 55.96412, lng: 37.76419 },
  { lat: 55.96481, lng: 37.76414 },
  { lat: 55.96489, lng: 37.7654 },
  { lat: 55.96546, lng: 37.76521 },
  { lat: 55.96602, lng: 37.7644 },
  { lat: 55.96668, lng: 37.76374 },
  { lat: 55.96839, lng: 37.76389 },
  { lat: 55.96843, lng: 37.76494 },
  { lat: 55.96788, lng: 37.7675 },
  { lat: 55.96796, lng: 37.76976 },
  { lat: 55.96728, lng: 37.77049 },
  { lat: 55.96639, lng: 37.77166 },
  { lat: 55.96465, lng: 37.774 },
  { lat: 55.96325, lng: 37.77589 },
  { lat: 55.96236, lng: 37.77874 },
  { lat: 55.96035, lng: 37.78523 },
  { lat: 55.95985, lng: 37.78609 },
  { lat: 55.95901, lng: 37.78874 },
  { lat: 55.95824, lng: 37.7899 },
  { lat: 55.95706, lng: 37.79165 },
  { lat: 55.95606, lng: 37.79306 },
  { lat: 55.95528, lng: 37.79421 },
  { lat: 55.95202, lng: 37.79906 },
  { lat: 55.95107, lng: 37.80039 },
  { lat: 55.95069, lng: 37.80102 },
  { lat: 55.95052, lng: 37.80136 },
  { lat: 55.95041, lng: 37.80157 },
  { lat: 55.95038, lng: 37.80164 },
  { lat: 55.95037, lng: 37.80168 },
  { lat: 55.95027, lng: 37.80207 },
  { lat: 55.95025, lng: 37.8021 },
  { lat: 55.94987, lng: 37.80287 },
  { lat: 55.9497, lng: 37.80312 },
  { lat: 55.9496, lng: 37.80329 },
  { lat: 55.9492, lng: 37.80388 },
  { lat: 55.94873, lng: 37.80458 },
  { lat: 55.94828, lng: 37.80527 },
  { lat: 55.94765, lng: 37.80623 },
  { lat: 55.94729, lng: 37.8067 },
  { lat: 55.94694, lng: 37.80723 },
  { lat: 55.9459, lng: 37.80872 },
  { lat: 55.94522, lng: 37.80973 },
  { lat: 55.94474, lng: 37.81043 },
  { lat: 55.94415, lng: 37.81124 },
  { lat: 55.94368, lng: 37.81191 },
  { lat: 55.94335, lng: 37.81236 },
  { lat: 55.94321, lng: 37.81258 },
  { lat: 55.94268, lng: 37.81309 },
  { lat: 55.94149, lng: 37.81279 },
  { lat: 55.94109, lng: 37.81288 },
  { lat: 55.94037, lng: 37.81279 },
  { lat: 55.93966, lng: 37.81262 },
  { lat: 55.93863, lng: 37.81221 },
  { lat: 55.93819, lng: 37.81207 },
  { lat: 55.93741, lng: 37.8117 },
  { lat: 55.93662, lng: 37.81113 },
  { lat: 55.9357, lng: 37.81015 },
  { lat: 55.93435, lng: 37.80847 },
  { lat: 55.93431, lng: 37.80841 },
  { lat: 55.93292, lng: 37.80668 },
  { lat: 55.93208, lng: 37.80565 },
  { lat: 55.93122, lng: 37.80457 },
  { lat: 55.93206, lng: 37.80221 },
  { lat: 55.93145, lng: 37.80182 },
  { lat: 55.93081, lng: 37.80138 },
  { lat: 55.93037, lng: 37.80109 },
  { lat: 55.93029, lng: 37.80122 },
  { lat: 55.92778, lng: 37.79814 },
  { lat: 55.92528, lng: 37.79503 },
  { lat: 55.92532, lng: 37.79946 },
  { lat: 55.92532, lng: 37.79954 },
  { lat: 55.92507, lng: 37.79937 },
  { lat: 55.9233, lng: 37.798 },
  { lat: 55.92152, lng: 37.79663 },
  { lat: 55.92042, lng: 37.79591 },
  { lat: 55.91932, lng: 37.79519 },
  { lat: 55.91825, lng: 37.79442 },
  { lat: 55.91729, lng: 37.79355 },
  { lat: 55.91706, lng: 37.79327 },
  { lat: 55.91657, lng: 37.79262 },
  { lat: 55.91575, lng: 37.79136 },
  { lat: 55.91429, lng: 37.78789 },
  { lat: 55.91425, lng: 37.78951 },
  { lat: 55.91219, lng: 37.78894 },
  { lat: 55.91105, lng: 37.78856 },
  { lat: 55.91063, lng: 37.78849 },
  { lat: 55.91028, lng: 37.78842 },
  { lat: 55.90839, lng: 37.78852 },
  { lat: 55.90773, lng: 37.78861 },
  { lat: 55.90708, lng: 37.78869 },
  { lat: 55.90643, lng: 37.78892 },
  { lat: 55.90583, lng: 37.78915 },
  { lat: 55.90478, lng: 37.78971 },
  { lat: 55.90485, lng: 37.78862 },
  { lat: 55.90496, lng: 37.78688 },
  { lat: 55.90463, lng: 37.78432 },
  { lat: 55.90486, lng: 37.78039 },
  { lat: 55.90788, lng: 37.77052 },
  { lat: 55.90798, lng: 37.7697 },
  { lat: 55.90739, lng: 37.76798 },
  { lat: 55.90162, lng: 37.76638 },
  { lat: 55.89046, lng: 37.77078 },
  { lat: 55.88896, lng: 37.77092 },
  { lat: 55.88602, lng: 37.77202 },
  { lat: 55.88231, lng: 37.77428 },
  { lat: 55.8822, lng: 37.77158 },
  { lat: 55.88214, lng: 37.77159 },
  { lat: 55.88213, lng: 37.77159 },
  { lat: 55.88213, lng: 37.7716 },
  { lat: 55.88211, lng: 37.7716 },
  { lat: 55.88203, lng: 37.77161 },
  { lat: 55.88203, lng: 37.77158 },
  { lat: 55.88201, lng: 37.77117 },
  { lat: 55.88182, lng: 37.76623 },
  { lat: 55.88179, lng: 37.7662 },
  { lat: 55.88177, lng: 37.76585 },
  { lat: 55.88175, lng: 37.76557 },
  { lat: 55.88177, lng: 37.7655 },
  { lat: 55.88145, lng: 37.75799 },
  { lat: 55.88131, lng: 37.75533 },
  { lat: 55.88128, lng: 37.75462 },
  { lat: 55.88123, lng: 37.75366 },
  { lat: 55.88122, lng: 37.7535 },
  { lat: 55.88113, lng: 37.75134 },
  { lat: 55.88109, lng: 37.75009 },
  { lat: 55.881, lng: 37.74802 },
  { lat: 55.88086, lng: 37.74427 },
  { lat: 55.8807, lng: 37.74057 },
  { lat: 55.88051, lng: 37.73858 },
  { lat: 55.87954, lng: 37.73619 },
  { lat: 55.87841, lng: 37.73478 },
  { lat: 55.87952, lng: 37.73237 },
  { lat: 55.88061, lng: 37.73038 },
  { lat: 55.88106, lng: 37.7297 },
  { lat: 55.88157, lng: 37.72945 },
  { lat: 55.88205, lng: 37.72929 },
  { lat: 55.88262, lng: 37.72945 },
  { lat: 55.8829, lng: 37.72956 },
  { lat: 55.88309, lng: 37.72966 },
  { lat: 55.88356, lng: 37.73 },
  { lat: 55.88378, lng: 37.73019 },
  { lat: 55.88401, lng: 37.73038 },
  { lat: 55.8844, lng: 37.73088 },
  { lat: 55.88477, lng: 37.73126 },
  { lat: 55.88532, lng: 37.7321 },
  { lat: 55.88562, lng: 37.73156 },
  { lat: 55.88502, lng: 37.73007 },
  { lat: 55.88395, lng: 37.72752 },
  { lat: 55.8838, lng: 37.72436 },
  { lat: 55.88504, lng: 37.72148 },
  { lat: 55.88566, lng: 37.72021 },
  { lat: 55.88591, lng: 37.71971 },
  { lat: 55.88596, lng: 37.7196 },
  { lat: 55.88613, lng: 37.71927 },
  { lat: 55.89015, lng: 37.71121 },
  { lat: 55.89177, lng: 37.70758 },
  { lat: 55.89215, lng: 37.70759 },
  { lat: 55.89226, lng: 37.70734 },
  { lat: 55.89233, lng: 37.70719 },
  { lat: 55.89226, lng: 37.70643 },
  { lat: 55.89341, lng: 37.70305 },
  { lat: 55.89434, lng: 37.69872 },
  { lat: 55.89487, lng: 37.69429 },
  { lat: 55.89509, lng: 37.68891 },
  { lat: 55.8952, lng: 37.68512 },
];

// Точка внутри полигона: алгоритм ray casting
function isInZone(lat, lng) {
  let inside = false;
  const pts = MYTISHCHI_ZONE_POLYGON;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].lng,
      yi = pts[i].lat;
    const xj = pts[j].lng,
      yj = pts[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const CATEGORY_COLORS = {
  bar: "#FF5D7A",
  party: "#8B5CF6",
  walk: "#5DD8FF",
  restaurant: "#FFB454",
  coffee: "#C4A374",
  gaming: "#C4FF3D",
  sports: "#5DD8FF",
  cinema: "#FF5D7A",
  music: "#8B5CF6",
  hangout: "#C4FF3D",
  other: "#8C8C97",
};

function pinIcon(color, pulse = false) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:26px;height:26px;">
        ${pulse ? `<div style="position:absolute;inset:-4px;border-radius:50%;background:${color}33;animation:pulseRing 1.6s infinite;"></div>` : ""}
        <div style="width:26px;height:26px;border-radius:50%;background:${color};border:3px solid #0A0A0C;box-shadow:0 2px 10px ${color}88;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function MapView({
  center,
  meetups,
  droppedPoint,
  placing,
  onMapClick,
  onMeetupClick,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const droppedMarkerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    const zonePolygon = L.polygon(
      MYTISHCHI_ZONE_POLYGON.map((p) => [p.lat, p.lng]),
      {
        color: "#C4FF3D",
        weight: 1.5,
        fillColor: "#C4FF3D",
        fillOpacity: 0.04,
        dashArray: "6 6",
      },
    ).addTo(map);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulseRing {
        0% { transform: scale(0.6); opacity: 0.8; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      .leaflet-container { background: #0A0A0C !important; font-family: 'Inter', sans-serif; }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    meetups.forEach((m) => {
      if (m.latitude == null || m.longitude == null) return;
      const color = CATEGORY_COLORS[m.activity_type] || "#8C8C97";
      const marker = L.marker([m.latitude, m.longitude], {
        icon: pinIcon(color, true),
      })
        .addTo(mapRef.current)
        .on("click", () => onMeetupClick(m));
      markersRef.current.push(marker);
    });
  }, [meetups]);

  useEffect(() => {
    if (!mapRef.current) return;
    const handleClick = (e) => {
      if (!placing) return;
      if (!isInZone(e.latlng.lat, e.latlng.lng)) {
        onMapClick(null, null, true); // true = вне зоны
        return;
      }
      onMapClick(e.latlng.lat, e.latlng.lng, false);
    };
    mapRef.current.on("click", handleClick);
    return () => mapRef.current?.off("click", handleClick);
  }, [placing, onMapClick]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (droppedMarkerRef.current) {
      droppedMarkerRef.current.remove();
      droppedMarkerRef.current = null;
    }
    if (droppedPoint) {
      droppedMarkerRef.current = L.marker(
        [droppedPoint.lat, droppedPoint.lng],
        {
          icon: pinIcon("#8B5CF6", true),
        },
      ).addTo(mapRef.current);
    }
  }, [droppedPoint]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
