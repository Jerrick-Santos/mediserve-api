const express = require('express');
const app = express(); 
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const mysql = require("mysql");


// Route Imports
const commonRoutes = require('./routes/commonRoute')
const doctorViewRoutes = require('./routes/doctorViewRoute')
const pharamacistViewRoutes = require('./routes/pharmacistViewRoute')
const patientViewRoutes = require('./routes/patientViewRoute')

dotenv.config(); 

let dbPool;

function createDBPool() {
    dbPool = mysql.createPool({
        connectionLimit: 10, 
        host: process.env.HOST,
        port: process.env.PORT, 
        user: 'admin',
        password: 'dJkHZ3NS',
        database: 'mobdeve_schema'
    });
}


function handleDisconnect() {
    createDBPool();

    dbPool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('SQL DB is now Connected!');
            connection.release();
        }
    });

    dbPool.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

app.listen(4000, () => {
    console.log("Server is RUNNING ON PORT 4000");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', commonRoutes(dbPool));
app.use('/api', doctorViewRoutes(dbPool));
app.use('/api', pharamacistViewRoutes(dbPool));
app.use('/api', patientViewRoutes(dbPool));