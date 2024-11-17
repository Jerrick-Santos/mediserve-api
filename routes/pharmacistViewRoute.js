const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/prodcatalogue', (req, res) => {
        const { pharmacyID } = req.query;
        const dbquery = `SELECT t1.product_ID AS id, t2.name AS brandName, t5.name AS genericName, t4.name AS manufacturer, CONCAT(t1.dosage, " ", t3.name) AS dosage
                FROM mobdeve_schema.CMD_product_catalogue t1
                JOIN CMD_brand t2 ON t1.brand_ID = t2.brand_ID
                JOIN REF_unit t3 ON t1.unit_ID = t3.unit_ID
                JOIN REF_manufacturer t4 ON t2.manufacturer_ID = t4.manufacturer_ID
                JOIN REF_generic_name t5 ON t2.generic_ID = t5.generic_ID
                WHERE t1.product_ID NOT IN (SELECT product_ID FROM mobdeve_schema.TD_stocks WHERE pharmacy_ID = ?)
                ORDER BY brandName;`
        db.query(dbquery, [pharmacyID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Catalogue Not Found.");
                res.status(404).json({ message: "Catalogue Not Found" });
            } else {
                res.status(200).json({ results });
            }
        });
    });

    return router;
}