import { Circle, Popup } from 'react-leaflet';
import type { Event, Severity } from '../../types';

interface EventCirclesProps {
  events: Event[];
}

const SEVERITY_COLORS: Record<Severity, string> = {
  info: '#3b82f6',
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function EventCircles({ events }: EventCirclesProps) {
  const geoEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null
  );

  return (
    <>
      {geoEvents.map((event) => {
        const color = SEVERITY_COLORS[event.severity];
        const radius = event.radius ?? 50000;

        return (
          <Circle
            key={event.id}
            center={[event.latitude!, event.longitude!]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.15,
              weight: 2,
            }}
          >
            <Popup>
              <div className="event-popup">
                <div className="popup-header">
                  <span className={`severity-badge ${event.severity}`}>
                    {event.severity}
                  </span>
                  <strong>{event.type}</strong>
                </div>
                <div className="popup-title">{event.title}</div>
                <div className="popup-description">{event.description}</div>
                <div className="popup-time">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}
