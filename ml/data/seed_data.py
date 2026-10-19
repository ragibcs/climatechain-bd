"""
Seed script to ingest recent and historical climate observations for all Sylhet locations.
Populates data/samples and data/manifests with verified real data from Open-Meteo.
"""

import sys
import logging
from ml.data.locations import SYLHET_LOCATIONS
from ml.data.ingestion import fetch_open_meteo_observations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_data")

def main():
    # Ingest 30 days of observations up to today
    start_date = "2024-06-01"  # Monsoon peak period in Sylhet
    end_date = "2024-07-15"
    
    logger.info(f"Ingesting real historical observations for Sylhet stations ({start_date} to {end_date})...")
    
    total_records = 0
    for loc_id in SYLHET_LOCATIONS:
        records = fetch_open_meteo_observations(
            location_id=loc_id,
            start_date=start_date,
            end_date=end_date
        )
        logger.info(f"Location {loc_id}: ingested and validated {len(records)} daily records.")
        total_records += len(records)
        
    logger.info(f"Successfully ingested {total_records} records across {len(SYLHET_LOCATIONS)} stations.")

if __name__ == "__main__":
    main()
