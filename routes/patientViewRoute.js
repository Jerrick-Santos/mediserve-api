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
        const dbquery = `SELECT 	DISTINCT pc.product_name,
                                    pi.presc_item_id AS product_ID
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
        const dbquery = `SELECT     	u.first_name, u.last_name, p.birthdate, p.gender, p.address, p.height, p.weight, p.bp, p.bmi, p.other_info, p.contact_num, p.email
                            FROM    	mobdeve_schema.MD_patient p
                            JOIN		mobdeve_schema.MD_user u ON u.user_ID = p.user_ID
                            WHERE  	 	patient_ID = ?`;

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

    router.patch('/editprofile/:id', async (req, res) => {
        const patientId = req.params.id;
        const {
          first_name,
          last_name,
          height,
          weight,
          bmi,
          email,
          address,
          gender,
          contact_num,
          birthdate,
          bp,
        } = req.body;
    
        try {
          // Update MD_user table
           const updateUserQuery = `
             UPDATE mobdeve_schema.MD_user
             SET first_name = IFNULL(?, first_name),
                 last_name = IFNULL(?, last_name)
             WHERE user_ID = (SELECT user_ID FROM mobdeve_schema.MD_patient WHERE patient_ID = ?)
           `;
    
          const updatePatientQuery = `
            UPDATE mobdeve_schema.MD_patient
            SET height = IFNULL(?, height),
                weight = IFNULL(?, weight),
                bmi = IFNULL(?, bmi),
                email = IFNULL(?, email),
                address = IFNULL(?, address),
                gender = IFNULL(?, gender),
                contact_num = IFNULL(?, contact_num),
                birthdate = IFNULL(?, birthdate),
                bp = IFNULL(?, bp)
            WHERE patient_ID = ?
          `;
    
          // Execute queries
          await db.query(updateUserQuery, [first_name, last_name, patientId]);
          await db.query(updatePatientQuery, [
            height,
            weight,
            bmi,
            email,
            address,
            gender,
            contact_num,
            birthdate,
            bp,
            patientId,
          ]);
    
          res.status(200).json({ message: 'Profile updated successfully' });
        } catch (error) {
          console.error('Error updating profile:', error);
          res.status(500).json({ error: 'Failed to update profile' });
        }
    });
    

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
        const { first_name, last_name, username, password, height, weight, bp, bmi, other_info, email, contact_num, birthdate, gender, address } = req.body;

        if (!first_name || !last_name || !username || !password || !height || !weight || !bp || !bmi || !email || !contact_num || !birthdate || !gender || !address) {
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
                INSERT INTO mobdeve_schema.MD_patient (birthdate, gender, address, height, weight, bp, bmi, other_info, contact_num, email, user_ID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(patientQuery, [birthdate, gender, address, height, weight, bp, bmi, other_info, contact_num, email, userId], (err, patientResult) => {
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

    router.post('/patientlogin', (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const query = `
            SELECT u.user_ID, p.patient_ID, u.password
            FROM mobdeve_schema.MD_user u
            JOIN mobdeve_schema.MD_patient p ON u.user_ID = p.user_ID
            WHERE u.username = ? AND u.type = 'patient'
        `;

        db.query(query, [username], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Invalid username or password" });
            }

            const user = results[0];

            // Direct comparison of passwords (if stored in plain text)
            if (password === user.password) {
                res.status(200).json({ patient_id: user.patient_ID });
            } else {
                res.status(401).json({ message: "Invalid username or password" });
            }
        });
    });

    router.get('/prescriptions/:id', (req, res) => {
        const patientID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT 	p.presc_ID AS presc_ID , 
                                    u.last_name AS doctor_last_name, 
                                    u.first_name AS doctor_first_name, 
                                    p.date_created AS prescription_date_created
                            FROM	TD_prescription p
                            JOIN	MD_doctor d ON p.doctor_ID = d.doctor_ID
                            JOIN	MD_user u ON d.user_ID = u.user_ID
                            WHERE 	patient_ID = ?`;

        db.query(dbquery, [patientID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Prescriptions Not Found.");
                res.status(404).json({ message: "Prescriptions Not Found" });
            } else {
                res.status(200).json(results);
            }
        })
    })

    router.get('/medications/:id', (req, res) => {
        const prescID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT	    pi.presc_item_ID AS presc_item_ID,
                                    pcat.product_name AS product_name,
                                    b.name AS brand_name,
                                    m.name AS manufacturer_name,
                                    g.name AS generic_name,
                                    pcat.dosage AS dosage,
                                    u.name AS unit_name,
                                    pi.amt_needed AS amt_needed,
                                    pi.take_morning AS take_morning,
                                    pi.take_noon AS take_noon,
                                    pi.take_night AS take_night
                            FROM	TD_prescription_items pi
                            JOIN	CMD_product_catalogue pcat ON pi.product_ID = pcat.product_ID
                            JOIN 	CMD_brand b ON pcat.brand_ID = b.brand_ID
                            JOIN	REF_manufacturer m ON b.manufacturer_ID = m.manufacturer_ID
                            JOIN	REF_generic_name g ON b.generic_ID = g.generic_ID
                            JOIN	REF_unit u ON pcat.unit_ID = u.unit_ID
                            JOIN	TD_prescription p ON pi.presc_ID = p.presc_ID
                            JOIN	MD_doctor d ON p.doctor_ID = d.doctor_ID
                            JOIN	MD_user usr ON d.user_ID = usr.user_ID
                            WHERE	pi.presc_ID = ?`;

        db.query(dbquery, [prescID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Prescriptions Not Found.");
                res.status(404).json({ message: "Prescriptions Not Found" });
            } else {
                res.status(200).json(results);
            }
        })
    })

    router.get('/notifications/:id', (req, res) => {
        const patientID = req.params.id; // Access the patientID from the URL parameter
        const dbquery = `SELECT CONCAT("You have a new prescription from Dr. ", u.first_name, " ", u.last_name) AS message,
                                DATE_FORMAT(p.date_created, '%b %d %Y') AS formatted_date,
                                p.presc_id AS notif_id
                        FROM   mobdeve_schema.TD_prescription p
                        JOIN   mobdeve_schema.MD_doctor d ON p.doctor_ID = d.doctor_ID
                        JOIN   mobdeve_schema.MD_user u ON d.user_ID = u.user_ID
                        WHERE  patient_id = ? AND isRead = 0;
                        `;
                          
        db.query(dbquery, [patientID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Notifications Not Found.");
                res.status(404).json({ message: "Notifications Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.patch('/markread/:id', (req, res) => {
        const prescID = req.params.id; // Access the presc_id from the URL parameter
    
        const dbquery = `UPDATE mobdeve_schema.TD_prescription 
                         SET isRead = 1 
                         WHERE presc_id = ?`;
    
        db.query(dbquery, [prescID], (err, results) => {
            if (err) {
                console.error("Database update error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.affectedRows === 0) {
                res.status(404).json({ message: "Prescription not found or already updated" });
            } else {
                res.status(200).json({ message: "Prescription marked as read successfully" });
            }
        });
    });
    


    return router;
}
