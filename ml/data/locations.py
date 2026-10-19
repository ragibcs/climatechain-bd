"""
Locations and hydrologic stations in the Sylhet / Surma River Basin, Bangladesh.
"""

from typing import Dict, Any, List

SYLHET_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "sylhet-sadar": {
        "id": "sylhet-sadar",
        "name": "Sylhet Sadar",
        "division": "Sylhet",
        "district": "Sylhet",
        "latitude": 24.8949,
        "longitude": 91.8687,
        "elevation_m": 20.0,
        "river": "Surma River",
        "bwdb_station_id": "SW267",
        "danger_level_m": 10.80,
        "description": "Sylhet Metropolitan area and urban drainage basin along the Surma River."
    },
    "sunamganj": {
        "id": "sunamganj",
        "name": "Sunamganj Sadar",
        "division": "Sylhet",
        "district": "Sunamganj",
        "latitude": 25.0667,
        "longitude": 91.4000,
        "elevation_m": 11.0,
        "river": "Surma River (Haor Basin)",
        "bwdb_station_id": "SW268",
        "danger_level_m": 7.80,
        "description": "Critical low-lying haor wetland basin vulnerable to deep early monsoon flash floods."
    },
    "kanaighat": {
        "id": "kanaighat",
        "name": "Kanaighat",
        "division": "Sylhet",
        "district": "Sylhet",
        "latitude": 25.0000,
        "longitude": 92.2667,
        "elevation_m": 23.0,
        "river": "Upper Surma River",
        "bwdb_station_id": "SW266",
        "danger_level_m": 12.75,
        "description": "Upstream Surma entry corridor receiving rapid transboundary runoff from Meghalaya hills."
    },
    "zakiganj": {
        "id": "zakiganj",
        "name": "Zakiganj",
        "division": "Sylhet",
        "district": "Sylhet",
        "latitude": 24.8833,
        "longitude": 92.3667,
        "elevation_m": 21.0,
        "river": "Kushiyara River (Sheola)",
        "bwdb_station_id": "SW172",
        "danger_level_m": 12.50,
        "description": "Barak river bifurcation into Surma and Kushiyara rivers at the India-Bangladesh border."
    }
}

def get_location_by_id(location_id: str) -> Dict[str, Any]:
    if location_id not in SYLHET_LOCATIONS:
        raise KeyError(f"Unknown location ID: {location_id}. Supported locations: {list(SYLHET_LOCATIONS.keys())}")
    return SYLHET_LOCATIONS[location_id]

def list_locations() -> List[Dict[str, Any]]:
    return list(SYLHET_LOCATIONS.values())
