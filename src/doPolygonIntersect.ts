// Represents a 2D point
export class Point {
  x;
  y;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// Represents an edge between two points in a polygon
class Edge {
  start;
  end;
  constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
  }

  // Check if two edges intersect
  static doEdgesIntersect(edge1: Edge, edge2: Edge): boolean {
    const d1 =
      (edge2.start.x - edge2.end.x) * (edge1.start.y - edge2.start.y) +
      (edge2.start.y - edge2.end.y) * (edge2.start.x - edge1.start.x);
    const d2 =
      (edge2.start.x - edge2.end.x) * (edge1.end.y - edge2.start.y) +
      (edge2.start.y - edge2.end.y) * (edge2.start.x - edge1.end.x);
    const d3 =
      (edge1.start.x - edge1.end.x) * (edge2.start.y - edge1.start.y) +
      (edge1.start.y - edge1.end.y) * (edge1.start.x - edge2.start.x);
    const d4 =
      (edge1.start.x - edge1.end.x) * (edge2.end.y - edge1.start.y) +
      (edge1.start.y - edge1.end.y) * (edge1.start.x - edge2.end.x);

    return d1 * d2 < 0 && d3 * d4 < 0;
  }
}

export type Polygon = Point[];

// Check if a point is inside a polygon using ray-casting algorithm
function isPointInsidePolygon(point: Point, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if two non-convex polygons intersect
export function doPolygonsIntersect(
  polygon1: Polygon,
  polygon2: Polygon
): boolean {
  for (let i = 0; i < polygon1.length; i++) {
    const edge1 = new Edge(polygon1[i], polygon1[(i + 1) % polygon1.length]);
    for (let j = 0; j < polygon2.length; j++) {
      const edge2 = new Edge(polygon2[j], polygon2[(j + 1) % polygon2.length]);

      if (Edge.doEdgesIntersect(edge1, edge2)) {
        return true;
      }
    }
  }

  // Check if any point of one polygon is inside the other polygon
  for (const point of polygon1) {
    if (isPointInsidePolygon(point, polygon2)) {
      return true;
    }
  }

  for (const point of polygon2) {
    if (isPointInsidePolygon(point, polygon1)) {
      return true;
    }
  }

  return false;
}

const _transformCustomPolygonToPolygon = (
  custom_polygon: [number, number][]
): Polygon => {
  return custom_polygon.map((e) => new Point(e[0], e[1]));
};

export const doCustomPolygonsIntersect = (
  polygon1: [number, number][],
  polygon2: [number, number][]
): boolean => {
  return doPolygonsIntersect(
    _transformCustomPolygonToPolygon(polygon1),
    _transformCustomPolygonToPolygon(polygon2)
  );
};
