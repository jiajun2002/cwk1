const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../db'); // Your db connection file

const filePath = path.join(__dirname, '../data/arrival_logs.csv');

async function importLogs() {
    console.log("⏳ Starting import of 10,000 arrival logs...");
    
    // We use a pool client for faster execution if needed, 
    // but for 10k rows, standard queries in a stream work fine.
    const stream = fs.createReadStream(filePath).pipe(csv());

    let count = 0;

    for await (const row of stream) {
        const query = `
            INSERT INTO arrival_logs (stop_id, route_number, scheduled_time, actual_time, delay_minutes, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        // Handle empty values for cancelled buses
        const actualTime = row.actual_time === "" ? null : row.actual_time;
        const delay = row.delay_minutes === "" ? null : row.delay_minutes;

        const values = [
            row.stop_id,
            row.route_number,
            row.scheduled_time,
            actualTime,
            delay,
            row.status
        ];

        try {
            await db.query(query, values);
            count++;
            if (count % 1000 === 0) console.log(`Processed ${count} rows...`);
        } catch (err) {
            console.error(`❌ Error at row ${count}:`, err.message);
        }
    }

    console.log(`✅ Success! Imported ${count} arrival logs.`);
    process.exit();
}

importLogs();