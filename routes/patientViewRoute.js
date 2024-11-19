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

    router.post('/reminders', (req, res) => {
        const { start_date, end_date, time, presc_item_id } = req.body;

        if (!start_date || !end_date || !time || !presc_item_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const dbquery = `
            INSERT INTO mobdeve_schema.TD_reminders 
            (start_date, end_date, time, presc_item_id) 
            VALUES (?, ?, ?, ?)
        `;

        db.query(dbquery, [start_date, end_date, time, presc_item_id], (err, results) => {
            if (err) {
                console.error("Database insertion error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.status(201).json({ 
                    message: "Reminder added successfully", 
                    reminder_id: results.insertId 
                });
            }
        });
    });

    router.delete('/reminders/:reminderId', (req, res) => {
        const reminderId = req.params.reminderId; // Access the reminder ID from the URL parameter

        if (!reminderId) {
            return res.status(400).json({ error: "Missing reminder ID" });
        }

        const dbquery = `DELETE FROM mobdeve_schema.TD_reminders WHERE reminder_id = ?`;

        db.query(dbquery, [reminderId], (err, results) => {
            if (err) {
                console.error("Database deletion error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.affectedRows === 0) {
                res.status(404).json({ message: "Reminder not found" });
            } else {
                res.status(200).json({ message: "Reminder deleted successfully" });
            }
        });
    });

    router.post('/patients', (req, res) => {
        const { first_name, last_name, username, password, height, weight, bp, bmi, other_info } = req.body;

        if (!first_name || !last_name || !username || !password || !height || !weight || !bp || !bmi) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const userQuery = `
            INSERT INTO mobdeve_schema.MD_user (first_name, last_name, username, password, type) 
            VALUES (?, ?, ?, ?, 'patient')
        `;

        db.query(userQuery, [first_name, last_name, username, password], (err, userResult) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            const userId = userResult.insertId;

            const patientQuery = `
                INSERT INTO mobdeve_schema.MD_patient (height, weight, bp, bmi, other_info, user_ID)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(patientQuery, [height, weight, bp, bmi, other_info, userId], (err, patientResult) => {
                if (err) {
                    console.error("Error inserting patient:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                res.status(201).json({ 
                    message: "Patient and user added successfully", 
                    patient_id: patientResult.insertId,
                    user_id: userId
                });
            });
        });
    });

    return router;
}
