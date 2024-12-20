const express = require('express');
const router = express.Router();

module.exports = (db) => {
    
    router.get('/allpatientsByDoctor', (req, res) => {
        const { doctor_id } = req.query
        const query =  `SELECT DISTINCT p.patient_ID as id,
		                CONCAT(u.last_name, ", ", u.first_name)as name,
                        p.birthdate, p.gender, p.height, p.weight,
                        p.bp, p.bmi, p.other_info, p.contact_num, p.email
                        FROM MD_patient p
                        JOIN MD_user u ON p.user_ID = u.user_ID
                        JOIN TD_prescription pr ON pr.patient_ID = p.patient_ID
                        WHERE pr.doctor_ID = ?`
        db.query(query, doctor_id, (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("No patients found.");
                res.status(404).json({ message: "No patients found" });
            } else {
                res.status(200).json({ message: "Patients fetched successfully", data: results });
            }
        })
    })


    router.get('/getPrescriptionByPatient', (req, res) => {
        const { patient_id } = req.query
        const query =   `SELECT 
                            p.presc_ID AS id, 
                            p.date_created, 
                            COUNT(pi.presc_item_ID) AS item_count
                        FROM 
                            mobdeve_schema.TD_prescription p
                        LEFT JOIN 
                            TD_prescription_items pi ON pi.presc_ID = p.presc_ID
                        WHERE
                            p.patient_id = ?
                        GROUP BY 
                            p.presc_ID
                        ORDER BY 
                            p.date_created DESC`
        const query2 =  `SELECT pi.presc_item_ID as id, g.name as genericName, b.name as brandName, m.name as manufacturer, pc.dosage, pi.amt_needed, pi.take_morning, pi.take_noon, pi.take_night
                        FROM TD_prescription_items pi
                        JOIN CMD_product_catalogue pc ON pi.product_ID = pc.product_ID
                        JOIN CMD_brand b ON pc.brand_ID = b.brand_ID
                        JOIN REF_manufacturer m ON m.manufacturer_ID = b.manufacturer_ID
                        JOIN REF_generic_name g ON g.generic_ID = b.generic_ID
                        WHERE presc_id = ?`

        // if (patient_id == null) {
        //     res.status(500).json({ error: "No input inserted" });
        // }

        db.query(query, patient_id, async (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("No prescription found.");
                res.status(404).json({ message: "No prescription found" });
            } else {
                console.log(results)
                try {
                    // Fetch prescription items for each prescription asynchronously
                    const prescriptions = await Promise.all(
                        results.map((prescription) => {
                            return new Promise((resolve, reject) => {
                                const presc_id = prescription.id;
            
                                // Fetch items for the current prescription
                                db.query(query2, [presc_id], (err, items) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        // Resolve the prescription with its items
                                        resolve({
                                            ...prescription,
                                            itemList: items, // All rows from results2 are included here
                                        });
                                    }
                                });
                            });
                        })
                    );
                    // Send the final response
                    res.status(200).json({ message: "Prescription fetched successfully", data: prescriptions });
                } catch (error) {
                    console.error("Error fetching prescription items:", error);
                    res.status(500).json({ error: "Internal Server Error" });
                }
            }
        })
    })

    router.get('/getPatientDetails', (req, res) => {
        const { patient_id } = req.query
        const query = `SELECT DISTINCT p.patient_ID as id,
		                CONCAT(u.last_name, ", ", u.first_name)as name,
                        p.birthdate, p.gender, p.height, p.weight,
                        p.bp, p.bmi, p.other_info, p.contact_num, p.email
                        FROM MD_patient p
                        JOIN MD_user u ON p.user_ID = u.user_ID
                        LEFT JOIN TD_prescription pr ON pr.patient_ID = p.patient_ID
                        WHERE p.patient_ID = ?`
        db.query(query, patient_id, (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("No patients found.");
                res.status(404).json({ message: "No patient found" });
            } else {
                res.status(200).json({ message: "Patient fetched successfully", data: results });
            }
        })

    })

    router.post('/postNewPrescription', (req, res) => {
        const { doctor_id, patient_id, items } = req.body;

        const prescriptionQuery = 'INSERT INTO TD_prescription (doctor_ID, patient_ID, date_created, isRead) VALUES (?, ?, CURDATE(), 0)'
        const prescriptionItemQuery = 'INSERT INTO TD_prescription_items (presc_ID, product_ID, amt_needed, take_morning, take_noon, take_night) VALUES ?'

        db.query(prescriptionQuery, [doctor_id, patient_id], (err, results) => {
            if (err) {
                console.error("Database insertion error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                const prescription_id = results.insertId
                const values = items.map(item => [
                    prescription_id,
                    item.product_id,
                    item.amt_needed,
                    item.take_morning,
                    item.take_noon,
                    item.take_night
                ]);

                db.query(prescriptionItemQuery, [values], (err, results) => {
                    if (err) {
                        console.error("Database insertion error:", err);
                        res.status(500).json({ error: "Internal Server Error" });
                    } else {
                        res.status(201).json({ message: "Success" });
                    }
                })
            }
        })
    })

    return router;
}