const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/reminders/:id', (req, res) => {
        const patientID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT     r.reminder_id,
                                    r.start_date,
                                    r.end_date,
                                    r.time,
                                    pc.product_name
                          FROM      mobdeve_schema.TD_reminders r
                          JOIN      mobdeve_schema.TD_prescription_items pi ON pi.presc_item_id = r.presc_item_id
                          JOIN      mobdeve_schema.TD_prescription p ON p.presc_ID = pi.presc_ID
                          JOIN      mobdeve_schema.MD_patient pt ON pt.patient_id = p.patient_id
                          JOIN      mobdeve_schema.CMD_product_catalogue pc ON pc.product_id = pi.product_id
                          WHERE     pt.patient_id = ?`;
                          
        db.query(dbquery, [patientID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Reminders Not Found.");
                res.status(404).json({ message: "Reminders Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.get('/patientprescriptionitems/:id', (req, res) => {
        const patientID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT 	DISTINCT pc.product_ID,
                                    pc.product_name
                            FROM 	mobdeve_schema.TD_prescription p
                            JOIN 	mobdeve_schema.TD_prescription_items pi 	ON pi.presc_id = p.presc_id
                            JOIN 	mobdeve_schema.MD_patient	pt				ON pt.patient_id = p.patient_id
                            JOIN	mobdeve_schema.CMD_product_catalogue pc	    ON pc.product_id = pi.product_id
                            WHERE	pt.patient_id = ?`;
                          
        db.query(dbquery, [patientID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Reminders Not Found.");
                res.status(404).json({ message: "Reminders Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.get('/profile/:id', (req, res) => {
        const patientID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT     height, weight, bp, bmi, other_info, user_ID
                            FROM    mobdeve_schema.MD_patient
                            WHERE   patient_ID = ?`;

        db.query(dbquery, [patientID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Patient Profile Not Found.");
                res.status(404).json({ message: "Patient Profile Not Found" });
            } else {
                res.status(200).json(results);
            }
        })
    })

    return router;
}
