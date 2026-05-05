import { useEffect, useState } from 'react';
import { Loading } from '../components/common/Loading';
import { EventTimelineChart } from '../components/charts/EventTimelineChart';
import * as api from '../api/client';
import type { Event, Severity } from '../types';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const eventsData = await api.getEvents({ limit: 100 });
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading message="Loading events..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredEvents =
    filterSeverity === 'all'
      ? events
      : events.filter((e) => e.severity === filterSeverity);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="events-page">
      <div className="page-header">
        <h2>Events</h2>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            All ({events.length})
          </button>
          {SEVERITIES.map((severity) => {
            const count = events.filter((e) => e.severity === severity).length;
            if (count === 0) return null;
            return (
              <button
                key={severity}
                className={`filter-tab severity-${severity} ${filterSeverity === severity ? 'active' : ''}`}
                onClick={() => setFilterSeverity(severity)}
              >
                {severity} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <EventTimelineChart events={filteredEvents} />
      </div>

      <div className="events-layout">
        <div className="events-list">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className={`event-card ${selectedEvent?.id === event.id ? 'selected' : ''}`}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="event-card-header">
                <span className={`severity-badge ${event.severity}`}>
                  {event.severity}
                </span>
                <span className="event-type">{event.type}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="event-card-title">{event.title}</div>
              <div className="event-card-description">{event.description}</div>
              {event.latitude != null && event.longitude != null && (
                <div className="event-card-location">
                  {event.latitude.toFixed(2)}, {event.longitude.toFixed(2)}
                  {event.radius && ` (${(event.radius / 1000).toFixed(0)} km radius)`}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedEvent && (
          <div className="event-detail-panel">
            <div className="panel-header">
              <span className={`severity-badge ${selectedEvent.severity}`}>
                {selectedEvent.severity}
              </span>
              <h3>{selectedEvent.type}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedEvent(null)}
              >
                x
              </button>
            </div>

            <div className="detail-section">
              <h4>{selectedEvent.title}</h4>
              <p>{selectedEvent.description}</p>
            </div>

            <div className="detail-section">
              <h4>Details</h4>
              <div className="detail-row">
                <span className="label">Time:</span>
                <span>{new Date(selectedEvent.timestamp).toLocaleString()}</span>
              </div>
              {selectedEvent.latitude != null && selectedEvent.longitude != null && (
                <>
                  <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="mono">
                      {selectedEvent.latitude.toFixed(4)},{' '}
                      {selectedEvent.longitude.toFixed(4)}
                    </span>
                  </div>
                  {selectedEvent.radius && (
                    <div className="detail-row">
                      <span className="label">Radius:</span>
                      <span>{(selectedEvent.radius / 1000).toFixed(0)} km</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedEvent.entityIds.length > 0 && (
              <div className="detail-section">
                <h4>Related Entities</h4>
                <div className="related-entities">
                  {selectedEvent.entityIds.map((id) => (
                    <span key={id} className="entity-id mono">
                      {id.slice(0, 8)}...
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
