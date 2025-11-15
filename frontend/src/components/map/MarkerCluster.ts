import mapboxgl from "mapbox-gl";
import { createClusterMarker } from "./markers";

interface ClusterPoint {
  marker: mapboxgl.Marker;
  coordinates: [number, number];
}

export class MarkerCluster {
  private map: mapboxgl.Map;
  private clusterMarkers: mapboxgl.Marker[] = [];
  private clusterDistance = 60; // pixels
  private minZoomForClustering = 12;

  constructor(map: mapboxgl.Map) {
    this.map = map;

    // Update clusters on zoom
    this.map.on("zoom", () => {
      this.updateClusters([]);
    });
  }

  updateClusters(markers: mapboxgl.Marker[]) {
    const zoom = this.map.getZoom();

    // Don't cluster at high zoom levels
    if (zoom >= this.minZoomForClustering) {
      // Clear cluster markers
      this.clusterMarkers.forEach((marker) => marker.remove());
      this.clusterMarkers = [];

      // Show all individual markers
      markers.forEach((marker) => {
        const element = marker.getElement();
        if (element) {
          element.style.display = "block";
        }
      });
      return;
    }

    // Clear existing cluster markers
    this.clusterMarkers.forEach((marker) => marker.remove());
    this.clusterMarkers = [];

    // Convert markers to points
    const points: ClusterPoint[] = markers.map((marker) => ({
      marker,
      coordinates: marker.getLngLat().toArray() as [number, number],
    }));

    // Simple clustering algorithm
    const clusters: ClusterPoint[][] = [];
    const processed = new Set<number>();

    points.forEach((point, i) => {
      if (processed.has(i)) return;

      const cluster: ClusterPoint[] = [point];
      processed.add(i);

      // Find nearby points
      points.forEach((otherPoint, j) => {
        if (i === j || processed.has(j)) return;

        const distance = this.getPixelDistance(
          point.coordinates,
          otherPoint.coordinates
        );

        if (distance < this.clusterDistance) {
          cluster.push(otherPoint);
          processed.add(j);
        }
      });

      clusters.push(cluster);
    });

    // Create cluster markers
    clusters.forEach((cluster) => {
      if (cluster.length === 1) {
        // Show individual marker
        const element = cluster[0].marker.getElement();
        if (element) {
          element.style.display = "block";
        }
      } else {
        // Hide individual markers
        cluster.forEach((point) => {
          const element = point.marker.getElement();
          if (element) {
            element.style.display = "none";
          }
        });

        // Create cluster marker at centroid
        const centroid = this.calculateCentroid(
          cluster.map((p) => p.coordinates)
        );

        const clusterElement = createClusterMarker(cluster.length);

        // Zoom in on cluster click
        clusterElement.addEventListener("click", () => {
          this.map.flyTo({
            center: centroid,
            zoom: this.map.getZoom() + 2,
            duration: 1000,
          });
        });

        const clusterMarker = new mapboxgl.Marker({ element: clusterElement })
          .setLngLat(centroid)
          .addTo(this.map);

        this.clusterMarkers.push(clusterMarker);
      }
    });
  }

  private getPixelDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const point1 = this.map.project(coord1);
    const point2 = this.map.project(coord2);

    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCentroid(coordinates: [number, number][]): [number, number] {
    const sum = coordinates.reduce(
      (acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]];
      },
      [0, 0]
    );

    return [sum[0] / coordinates.length, sum[1] / coordinates.length];
  }

  destroy() {
    this.clusterMarkers.forEach((marker) => marker.remove());
    this.clusterMarkers = [];
  }
}
