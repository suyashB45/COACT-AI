import { useEffect, useRef, useState } from "react";
import {
    Map,
    MapArc,
    MapMarker,
    MarkerContent,
    MarkerLabel,
} from "@/components/ui/map";
import * as MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/components/theme-provider";

const hub = { name: "Dubai", lng: 55.2708, lat: 25.2048 };

const destinations = [
    { name: "New York", lng: -74.006, lat: 40.7128 },
    { name: "São Paulo", lng: -46.6333, lat: -23.5505 },
    { name: "Cape Town", lng: 18.4241, lat: -33.9249 },
    { name: "London", lng: -0.1276, lat: 51.5074 },
    { name: "Chennai", lng: 80.2707, lat: 13.0827 },
    { name: "Singapore", lng: 103.8198, lat: 1.3521 },
    { name: "Tokyo", lng: 139.6917, lat: 35.6895 },
    { name: "Sydney", lng: 151.2093, lat: -33.8688 },
];

const arcs = destinations.map((dest) => ({
    id: dest.name,
    from: [hub.lng, hub.lat] as [number, number],
    to: [dest.lng, dest.lat] as [number, number],
}));

export default function AIVisualization() {
    const size = 320;
    const mapRef = useRef<MapLibreGL.Map>(null);
    const [spinEnabled, setSpinEnabled] = useState(true);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        let animationId: number;

        const spinGlobe = () => {
            if (spinEnabled && mapRef.current) {
                const map = mapRef.current;
                const zoom = map.getZoom();
                if (zoom < 4) {
                    const center = map.getCenter();
                    center.lng += 0.2; // spin speed
                    map.easeTo({ center, duration: 200, easing: (n) => n });
                }
            }
            animationId = requestAnimationFrame(spinGlobe);
        };

        spinGlobe();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [spinEnabled]);

    return (
        <div
            className="relative select-none"
            style={{ width: size, height: size }}
            onMouseEnter={() => setSpinEnabled(false)}
            onMouseLeave={() => setSpinEnabled(true)}
        >
            {/* Outer ambient glow */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: resolvedTheme === 'light'
                        ? 'radial-gradient(ellipse at center, rgba(139,92,246,0.1) 0%, rgba(96,165,250,0.05) 50%, transparent 70%)'
                        : 'radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, rgba(96,165,250,0.15) 50%, transparent 70%)',
                    filter: 'blur(24px)',
                }}
            />

            <div
                className="absolute inset-0 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.1)] dark:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                style={{ transform: 'scale(0.95)' }}
            >
                <Map
                    ref={mapRef}
                    center={[-40, 20]}
                    zoom={1.2}
                    // @ts-ignore
                    projection={{ type: 'globe' }}
                    interactive={false}
                    attributionControl={false}
                    theme={resolvedTheme === 'light' ? 'light' : 'dark'}
                >
                    <MapArc
                        data={arcs}
                        paint={{
                            "line-color": "#3b82f6",
                            "line-opacity": 0.5,
                            "line-width": 3,
                            "line-dasharray": [2, 2],
                        }}
                        interactive={false}
                    />

                    <MapMarker longitude={hub.lng} latitude={hub.lat}>
                        <MarkerContent>
                            <div className="size-3 rounded-full border-2 border-white dark:border-[#03050D] bg-blue-500" />
                            <MarkerLabel
                                position="top"
                                className="bg-white/80 dark:bg-[#03050D]/80 text-slate-900 dark:text-white rounded-sm px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur shadow-sm dark:shadow-none"
                            >
                                {hub.name}
                            </MarkerLabel>
                        </MarkerContent>
                    </MapMarker>

                    {destinations.map((dest) => (
                        <MapMarker key={dest.name} longitude={dest.lng} latitude={dest.lat}>
                            <MarkerContent>
                                <div className="size-2 rounded-full border-2 border-white dark:border-[#03050D] bg-blue-500" />
                                <MarkerLabel position="top" className="text-[10px] text-slate-700 dark:text-slate-300">{dest.name}</MarkerLabel>
                            </MarkerContent>
                        </MapMarker>
                    ))}
                </Map>

                {/* Hide MapLibre UI elements like logo and attribution */}
                <style>{`
                    .maplibregl-control-container,
                    .maplibregl-ctrl-bottom-right,
                    .maplibregl-ctrl-bottom-left {
                        display: none !important;
                    }
                `}</style>

                {/* Inner shadow for 3D effect */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        boxShadow: resolvedTheme === 'light'
                            ? 'inset 0 0 40px rgba(0,0,0,0.1), inset -20px -20px 40px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.8)'
                            : 'inset 0 0 40px rgba(0,0,0,0.8), inset -20px -20px 40px rgba(0,0,0,0.9), inset 10px 10px 20px rgba(255,255,255,0.1)'
                    }}
                />
            </div>
        </div>
    );
}
