import { Polyline } from 'react-leaflet';
import type { Position } from '../../types';

interface TrackLinesProps {
  positions: Position[];
}

export function TrackLines({ positions }: TrackLinesProps) {
  if (positions.length < 2) return null;

  const sortedPositions = [...positions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const coordinates = sortedPositions.map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <Polyline
      positions={coordinates}
      pathOptions={{
        color: '#3b82f6',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
      }}
    />
  );
}
