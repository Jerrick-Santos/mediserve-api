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

    router.get('/login', (req, res) => {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // Query the MD_user table to find the user
        const query = 'SELECT * FROM MD_user WHERE username = ?';
        db.query(query, [username], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database error.' });
            }

            // Check if user exists
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }

            const user = results[0];

            // Check if the password matches
            if (user.password !== password) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }

            // If the user is a pharmacist, retrieve the pharmacy_ID
            if (user.user_type === 'pharmacist') {
                const pharmacistQuery = 'SELECT pharmacy_ID FROM MD_pharmacist WHERE user_ID = ?';
                db.query(pharmacistQuery, [user.user_ID], (err, pharmacistResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Database error.' });
                    }

                    // Check if pharmacist data exists
                    if (pharmacistResults.length === 0) {
                        return res.status(404).json({ message: 'Pharmacist data not found.' });
                    }

                    const pharmacy_ID = pharmacistResults[0].pharmacy_ID;

                    // Return success message with pharmacy_ID
                    return res.status(200).json({
                        message: 'Login successful',
                        userId: user.user_ID,
                        userType: user.user_type,
                        pharmacy_ID: pharmacy_ID
                    });
                });
            } else {
                // If user is not a pharmacist, return a success response without pharmacy_ID
                return res.status(200).json({
                    message: 'Login successful',
                    userId: user.user_ID,
                    userType: user.user_type
                });
            }
        });
    });

module.exports = router;

    

    return router;
}