const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

// Åbn eller opret databasen
let db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users database.');
});

// Kør SQL-scriptet for at oprette tabellen
const sqlScript = fs.readFileSync('./setup.sql', 'utf-8');
db.exec(sqlScript, (err) => {
    if (err) {
        console.error('Error running SQL script', err.message);
    } else {
        console.log('User table has been created or already exists.');
    }
});

// Funktion til at indsætte en ny bruger med hashed adgangskode
async function insertUser(email, plainPassword) {
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;

        db.run(sql, [email, hashedPassword], function (err) {
            if (err) {
                return console.error('Insert error:', err.message);
            }
            console.log(`User added with ID: ${this.lastID}`);
        });
    } catch (err) {
        console.error('Hashing error:', err.message);
    }
}

// Indsæt en testbruger
insertUser('test@example.com', 'myPassword123');

// Luk forbindelsen til databasen, efter at alt er udført
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Closed the database connection.');
});
