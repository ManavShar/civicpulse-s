import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ZoneData {
  name: string;
  type: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "PARK";
  boundary: number[][][];
  population: number;
  metadata: {
    description: string;
    characteristics: string[];
  };
}

// Generate GeoJSON polygons for 10 demo city zones
// Using San Francisco-like coordinates for realistic visualization
const zones: ZoneData[] = [
  {
    name: "Downtown Financial District",
    type: "COMMERCIAL",
    boundary: [
      [
        [-122.42, 37.78],
        [-122.4, 37.78],
        [-122.4, 37.8],
        [-122.42, 37.8],
        [-122.42, 37.78],
      ],
    ],
    population: 15000,
    metadata: {
      description:
        "High-density commercial area with office buildings and retail",
      characteristics: [
        "High traffic",
        "Dense infrastructure",
        "Business hours activity",
      ],
    },
  },
  {
    name: "Riverside Residential",
    type: "RESIDENTIAL",
    boundary: [
      [
        [-122.4, 37.78],
        [-122.38, 37.78],
        [-122.38, 37.8],
        [-122.4, 37.8],
        [-122.4, 37.78],
      ],
    ],
    population: 25000,
    metadata: {
      description: "Mixed residential area with apartments and townhouses",
      characteristics: [
        "Family-friendly",
        "Schools nearby",
        "Parks and recreation",
      ],
    },
  },
  {
    name: "Industrial Park",
    type: "INDUSTRIAL",
    boundary: [
      [
        [-122.42, 37.76],
        [-122.4, 37.76],
        [-122.4, 37.78],
        [-122.42, 37.78],
        [-122.42, 37.76],
      ],
    ],
    population: 5000,
    metadata: {
      description: "Manufacturing and warehouse district",
      characteristics: [
        "Heavy machinery",
        "Freight traffic",
        "Industrial operations",
      ],
    },
  },
  {
    name: "Central Park",
    type: "PARK",
    boundary: [
      [
        [-122.4, 37.76],
        [-122.38, 37.76],
        [-122.38, 37.78],
        [-122.4, 37.78],
        [-122.4, 37.76],
      ],
    ],
    population: 0,
    metadata: {
      description:
        "Large urban park with trails, playgrounds, and green spaces",
      characteristics: ["Recreation", "Natural environment", "Public events"],
    },
  },
  {
    name: "Tech District",
    type: "COMMERCIAL",
    boundary: [
      [
        [-122.38, 37.78],
        [-122.36, 37.78],
        [-122.36, 37.8],
        [-122.38, 37.8],
        [-122.38, 37.78],
      ],
    ],
    population: 12000,
    metadata: {
      description: "Technology companies and startup hub",
      characteristics: [
        "Innovation center",
        "Young professionals",
        "Modern infrastructure",
      ],
    },
  },
  {
    name: "Suburban Heights",
    type: "RESIDENTIAL",
    boundary: [
      [
        [-122.38, 37.76],
        [-122.36, 37.76],
        [-122.36, 37.78],
        [-122.38, 37.78],
        [-122.38, 37.76],
      ],
    ],
    population: 30000,
    metadata: {
      description: "Suburban residential area with single-family homes",
      characteristics: [
        "Low density",
        "Quiet neighborhoods",
        "Community-oriented",
      ],
    },
  },
  {
    name: "Harbor District",
    type: "COMMERCIAL",
    boundary: [
      [
        [-122.42, 37.74],
        [-122.4, 37.74],
        [-122.4, 37.76],
        [-122.42, 37.76],
        [-122.42, 37.74],
      ],
    ],
    population: 8000,
    metadata: {
      description: "Waterfront commercial and entertainment district",
      characteristics: ["Tourism", "Restaurants", "Maritime activities"],
    },
  },
  {
    name: "University Quarter",
    type: "RESIDENTIAL",
    boundary: [
      [
        [-122.4, 37.74],
        [-122.38, 37.74],
        [-122.38, 37.76],
        [-122.4, 37.76],
        [-122.4, 37.74],
      ],
    ],
    population: 18000,
    metadata: {
      description: "Student housing and campus area",
      characteristics: [
        "Educational institutions",
        "Young population",
        "Cultural activities",
      ],
    },
  },
  {
    name: "Green Valley Park",
    type: "PARK",
    boundary: [
      [
        [-122.38, 37.74],
        [-122.36, 37.74],
        [-122.36, 37.76],
        [-122.38, 37.76],
        [-122.38, 37.74],
      ],
    ],
    population: 0,
    metadata: {
      description: "Nature preserve with hiking trails and wildlife",
      characteristics: [
        "Conservation area",
        "Outdoor recreation",
        "Environmental education",
      ],
    },
  },
  {
    name: "Innovation Campus",
    type: "INDUSTRIAL",
    boundary: [
      [
        [-122.36, 37.76],
        [-122.34, 37.76],
        [-122.34, 37.78],
        [-122.36, 37.78],
        [-122.36, 37.76],
      ],
    ],
    population: 7000,
    metadata: {
      description: "Research and development facilities",
      characteristics: [
        "Clean industry",
        "Technology research",
        "Innovation labs",
      ],
    },
  },
];

export async function seedZones(): Promise<string[]> {
  const client = await pool.connect();
  const zoneIds: string[] = [];

  try {
    console.log("Seeding zones...");

    for (const zone of zones) {
      // Convert boundary coordinates to WKT format for PostGIS
      const boundaryWKT = `POLYGON((${zone.boundary[0]
        .map((coord) => `${coord[0]} ${coord[1]}`)
        .join(", ")}))`;

      const result = await client.query(
        `INSERT INTO zones (name, type, boundary, population, metadata)
         VALUES ($1, $2, ST_GeogFromText($3), $4, $5)
         RETURNING id`,
        [
          zone.name,
          zone.type,
          boundaryWKT,
          zone.population,
          JSON.stringify(zone.metadata),
        ]
      );

      zoneIds.push(result.rows[0].id);
      console.log(
        `  ✓ Created zone: ${zone.name} (${zone.type}, population: ${zone.population})`
      );
    }

    console.log(`\n✅ Successfully seeded ${zones.length} zones`);
    return zoneIds;
  } catch (error) {
    console.error("Error seeding zones:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedZones()
    .then(() => {
      console.log("\nZone seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Zone seeding failed:", error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}
