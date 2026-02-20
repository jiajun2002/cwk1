const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../db'); // Ensure this points to your db connection file

const filePath = path.join(__dirname, '../data/450Stops.csv');

async function importLeedsStops() {
    console.log("🚀 Starting import of Leeds stops...");
    let count = 0;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
            // FILTER: Only import if ParentLocalityName is 'Leeds'
            if (row.ParentLocalityName === 'Leeds') {
                const query = `
                    INSERT INTO stops (atco_code, stop_name, street, indicator, latitude, longitude, locality)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (atco_code) DO NOTHING;
                `;
                
                const values = [
                    row.ATCOCode,
                    row.CommonName,
                    row.Street,
                    row.Indicator,
                    row.Latitude,
                    row.Longitude,
                    row.LocalityName
                ];

                try {
                    await db.query(query, values);
                    count++;
                } catch (err) {
                    console.error(`❌ Error inserting ${row.CommonName}:`, err.message);
                }
            }
        })
        .on('end', () => {
            // Note: because db.query is async, this log might fire before the last row finishes
            console.log('✅ Import script finished reading the CSV.');
            console.log('💡 Check your database with: SELECT COUNT(*) FROM stops;');
        });
}

importLeedsStops();