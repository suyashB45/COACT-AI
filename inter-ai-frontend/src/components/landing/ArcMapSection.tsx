import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Map,
  MapArc,
  MapMarker,
  MapPopup,
  MarkerContent,
  MarkerLabel,
  type MapArcDatum,
} from "@/components/ui/map";
import "maplibre-gl/dist/maplibre-gl.css";

interface Lane extends MapArcDatum {
  origin: string;
  destination: string;
  color: string;
}

const lanes: Lane[] = [
  {
    id: "dxb-shg",
    origin: "Dubai",
    destination: "Shanghai",
    from: [55.2708, 25.2048],
    to: [121.4737, 31.2304],
    color: "#a78bfa",
  },
  {
    id: "dxb-lax",
    origin: "Dubai",
    destination: "Los Angeles",
    from: [55.2708, 25.2048],
    to: [-118.2437, 34.0522],
    color: "#60a5fa",
  },
  {
    id: "dxb-sin",
    origin: "Dubai",
    destination: "Singapore",
    from: [55.2708, 25.2048],
    to: [103.8198, 1.3521],
    color: "#34d399",
  },
  {
    id: "dxb-rtm",
    origin: "Dubai",
    destination: "Rotterdam",
    from: [55.2708, 25.2048],
    to: [4.4777, 51.9244],
    color: "#fbbf24",
  },
  {
    id: "dxb-ssz",
    origin: "Dubai",
    destination: "Santos",
    from: [55.2708, 25.2048],
    to: [-46.3322, -23.9608],
    color: "#f472b6",
  },
  {
    id: "dxb-cpt",
    origin: "Dubai",
    destination: "Cape Town",
    from: [55.2708, 25.2048],
    to: [18.4241, -33.9249],
    color: "#2dd4bf",
  },
  {
    id: "dxb-syd",
    origin: "Dubai",
    destination: "Sydney",
    from: [55.2708, 25.2048],
    to: [151.2093, -33.8688],
    color: "#818cf8",
  },
  {
    id: "dxb-tyo",
    origin: "Dubai",
    destination: "Tokyo",
    from: [55.2708, 25.2048],
    to: [139.6917, 35.6895],
    color: "#38bdf8",
  },
  {
    id: "dxb-jfk",
    origin: "Dubai",
    destination: "New York",
    from: [55.2708, 25.2048],
    to: [-74.006, 40.7128],
    color: "#fb7185",
  },
  {
    id: "dxb-maa",
    origin: "Dubai",
    destination: "Chennai",
    from: [55.2708, 25.2048],
    to: [80.2707, 13.0827],
    color: "#a3e635",
  },
];

interface SelectedLane {
  lane: Lane;
  popupLngLat: { longitude: number; latitude: number };
}

function InteractiveArcMap() {
  const [selected, setSelected] = useState<SelectedLane | null>(null);

  const endpoints = useMemo(() => {
    const points: { name: string; coords: [number, number] }[] = [];
    const seen = new Set<string>();
    for (const lane of lanes) {
      if (!seen.has(lane.origin)) {
        seen.add(lane.origin);
        points.push({ name: lane.origin, coords: lane.from });
      }
      if (!seen.has(lane.destination)) {
        seen.add(lane.destination);
        points.push({ name: lane.destination, coords: lane.to });
      }
    }
    return points;
  }, []);

  return (
    <div className="relative h-[420px] w-full">
      <Map center={[20, 20]} zoom={0.6}>
        <MapArc<Lane>
          data={lanes}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 1.5,
          }}
          hoverPaint={{
            "line-width": 3,
            "line-opacity": 1,
          }}
          onHover={(event) =>
            setSelected(
              event
                ? {
                    lane: event.arc,
                    popupLngLat: {
                      longitude: event.longitude,
                      latitude: event.latitude,
                    },
                  }
                : null,
            )
          }
        />

        {endpoints.map((point) => (
          <MapMarker
            key={point.name}
            longitude={point.coords[0]}
            latitude={point.coords[1]}
          >
            <MarkerContent>
              <div className="bg-foreground/80 size-2 rounded-full shadow-sm" />
              <MarkerLabel
                position="top"
                className="text-foreground/80 tracking-tight"
              >
                {point.name}
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>
        ))}

        {selected && (
          <MapPopup
            longitude={selected.popupLngLat.longitude}
            latitude={selected.popupLngLat.latitude}
            offset={12}
            closeOnClick={false}
            className="p-0"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
              <span
                className="size-1.5 rounded-full"
                style={{ background: selected.lane.color }}
              />
              <span className="font-medium">
                {selected.lane.origin} → {selected.lane.destination}
              </span>
              <span className="text-muted-foreground border-l pl-2">
                Live
              </span>
            </div>
          </MapPopup>
        )}
      </Map>

      <div className="bg-background/80 absolute bottom-3 left-3 flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] shadow-sm backdrop-blur">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        Live network
      </div>
    </div>
  );
}

export default function ArcMapSection() {
  return (
    <section className="ds-section py-20 md:py-28 border-b border-slate-200 dark:border-white/[0.05] overflow-hidden">
      <div className="ds-grid" />
      <div className="ds-shimmer-top" />

      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        <motion.div
          className="max-w-2xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="ds-badge mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Global Network
          </div>
          <h2
            className="text-4xl md:text-5xl font-black text-foreground dark:text-white tracking-tight leading-[1.08]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Connect your team.{" "}
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
              Anywhere on Earth.
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            A living view of your network — hover any connection to see who's
            linked, no matter where they are.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="ds-card overflow-hidden rounded-2xl"
        >
          <InteractiveArcMap />
        </motion.div>
      </div>

      <div className="ds-shimmer-bottom" />
    </section>
  );
}
