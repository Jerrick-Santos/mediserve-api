const express = require('express');
const router = express.Router();

module.exports = (db) => {

    router.get('/barangays', (req, res) => {
        db.query(`SELECT * FROM mobdeve_schema.MD_barangays;`, (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("No barangays found.");
                res.status(404).json({ message: "No barangays found" });
            } else {
                res.status(200).json({ message: "Barangays fetched successfully", data: results });
            }
        });
    });
    

    return router;
}