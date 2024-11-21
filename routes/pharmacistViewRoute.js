const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/prodcatalogue', (req, res) => {
        const { pharmacyID } = req.query;
        const dbquery = `SELECT CONCAT("PRDCT", t1.product_ID) AS id, t2.name AS brandName, t5.name AS genericName, t4.name AS manufacturer, CONCAT(t1.dosage, " ", t3.name) AS dosage
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
                res.status(200).json(results);
            }
        });
    });


    router.get('/inventory', (req, res) => {
        const { pharmacyID } = req.query;
        const dbquery = `SELECT CONCAT("PRDCT", agg_tb2.id) AS product_id, mtble.stock_ID AS stock_id, agg_tb2.brandName, agg_tb2.genericName, agg_tb2.manufacturer, agg_tb2.dosage, mtble.current_amt AS qty
            FROM mobdeve_schema.TD_stocks mtble
            JOIN (
            SELECT t1.product_ID AS id, t2.name AS brandName, t5.name AS genericName, t4.name AS manufacturer, CONCAT(t1.dosage, " ", t3.name) AS dosage
            FROM mobdeve_schema.CMD_product_catalogue t1
            JOIN CMD_brand t2 ON t1.brand_ID = t2.brand_ID
            JOIN REF_unit t3 ON t1.unit_ID = t3.unit_ID
            JOIN REF_manufacturer t4 ON t2.manufacturer_ID = t4.manufacturer_ID
            JOIN REF_generic_name t5 ON t2.generic_ID = t5.generic_ID
            ) AS agg_tb2 ON agg_tb2.id = mtble.product_ID
            WHERE pharmacy_ID = ?;`
        db.query(dbquery, [pharmacyID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Inventory Not Found.");
                res.status(404).json({ message: "Inventory Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.get('/transactions', (req, res) => {
        const { pharmacyID } = req.query;
        const dbquery = `SELECT CONCAT("TRANSAC", t1.transac_id) AS transac_id, t3.name AS product_name, t1.change_type, t1.qty
        FROM mobdeve_schema.TD_stock_transactions t1
        JOIN mobdeve_schema.TD_stocks t2 ON t1.stock_ID = t2.stock_ID
        JOIN mobdeve_schema.CMD_brand t3 ON t3.brand_ID = t2.stock_ID
        WHERE t2.pharmacy_ID = ?;`
        db.query(dbquery, [pharmacyID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Transactions Not Found.");
                res.status(404).json({ message: "Transactions Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.post('/newstock', (req, res) => {
        const { pharmacyID, productID, currentAmt } = req.body;

        if (!pharmacyID || !productID || !currentAmt) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const dbquery = `
            INSERT INTO mobdeve_schema.TD_stocks 
            (stock_ID, pharmacy_ID, product_ID, current_amt) 
            VALUES (?, ?, ?, ?)
        `;

        db.query(dbquery, [500 + productID, pharmacyID, productID, currentAmt], (err, results) => {
            if (err) {
                console.error("Database insertion error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.status(201).json({ 
                    message: "Reminder added successfully", 
                    inventory_id: results.insertId 
                });
            }
        });
    });


    router.patch('/editstock', (req, res) => {
        const {stockID, changeType, amt } = req.body;
        
        // GET current_amt 

        const dbquery_get = `SELECT current_amt FROM mobdeve_schema.TD_stocks WHERE stock_ID = ?;`

        // UPDATE current_amt 

        const dbquery_update = `UPDATE mobdeve_schema.TD_stocks SET current_amt = ? WHERE stock_ID = ?`;

        // POST new Transaction
        const dbquery_post = `INSERT INTO mobdeve_schema.TD_stock_transactions (stock_ID, date, change_type, qty) VALUES (?, NOW(), ?, ?)`;


        db.query(dbquery_get, [stockID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Stock AMT Not Found.");
                res.status(404).json({ message: "Stock AMT Not Found" });
            } else {

                const current_amt = results[0].current_amt
                
                var new_amt = null

                if (changeType === "add") {
                    new_amt = current_amt + amt
                }
                else{
                    new_amt = current_amt - amt
                }

                db.query(dbquery_update, [new_amt, stockID], (err, results) => {
                    if (err) {
                        console.error("Database UPDATE error:", err);
                        res.status(500).json({ error: "Internal Server Error" });
                    } else {
                        db.query(dbquery_post, [stockID, changeType, amt], (err, results) => {
                            if (err) {
                                console.error("Database INSERTION error:", err);
                                res.status(500).json({ error: "Internal Server Error" });
                            } else {
                                res.status(201).json({ 
                                    message: "Inventory edited and added to transactions list successfully"
                                });
                            }
                        });
                    }
                });
            }
        });
        

    });


    router.get('/viewcart', (req, res) => {
        const { pharmacyID } = req.query;
        const dbquery = `SELECT t3.name AS brandName,t1.cart_ID AS cartID,t1.qty
        FROM mobdeve_schema.TD_pharmacy_cart t1
        JOIN TD_stocks t2 ON t1.stock_ID = t2.stock_ID
        JOIN CMD_brand t3 ON t2.product_ID = t3.brand_ID
        WHERE t1.pharmacy_ID = ?;`
        db.query(dbquery, [pharmacyID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.length === 0) {
                console.log("Cart Not Found.");
                res.status(404).json({ message: "Cart Not Found" });
            } else {
                res.status(200).json(results);
            }
        });
    });

    router.post('/addcart', (req, res) => {
        const { pharmacyID, stockID, qty } = req.body;

        if (!pharmacyID || !stockID || !qty) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const dbquery = `
        INSERT INTO mobdeve_schema.TD_pharmacy_cart (pharmacy_ID, stock_ID, qty) VALUES (?, ?, ?);
        `;

        db.query(dbquery, [pharmacyID, stockID, qty], (err, results) => {
            if (err) {
                console.error("Database insertion error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.status(201).json({ 
                    message: "Cart Item added successfully", 
                    inventory_id: results.insertId 
                });
            }
        });
    });


    router.post('/scantocart', (req, res) => {
        const { prescID, pharmacyID } = req.body;
    
        const dbquery = `
            INSERT INTO mobdeve_schema.TD_pharmacy_cart (pharmacy_ID, stock_ID, qty)
            SELECT ?, t1.stock_ID, t2.amt_needed
            FROM mobdeve_schema.TD_stocks t1
            JOIN mobdeve_schema.TD_prescription_items t2 ON t1.product_ID = t2.product_ID
            JOIN mobdeve_schema.CMD_brand t3 ON t2.product_ID = t3.brand_ID
            WHERE t2.presc_ID = ? AND t1.pharmacy_ID = ? AND t1.current_amt >= t2.amt_needed;
        `;
    
        db.query(dbquery, [pharmacyID, prescID, pharmacyID], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                res.status(500).json({ error: "Internal Server Error" });
            } else if (results.affectedRows === 0) {
                console.log("No stocks found or inserted.");
                res.status(404).json({ message: "No stocks are applicable for the prescription" });
            } else {
                res.status(201).json({ 
                    message: "Cart items added successfully",
                    rowsInserted: results.affectedRows
                });
            }
        });
    });
    

    return router;
}