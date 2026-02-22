const express = require("express");
const sql = require("mssql");
const getSecrets = require("./config");
const bodyParser = require("body-parser");
const cors = require("cors");
//require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔐 conexión a SQL Server
async function connectDB() {
    const secrets = await getSecrets();

    const config = {
        user: secrets.user,
        password: secrets.password,
        server: secrets.server,
        database: secrets.database,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    await sql.connect(config);
    console.log("🔥 Conectado a SQL con Key Vault");
}

connectDB();

/*const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,   // ⚠️ luego lo moveremos a KeyVault
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};*/

// conectar pool

/*sql.connect(config)
    .then(() => console.log("✅ Conectado a SQL Server"))
    .catch(err => console.error("❌ Error conexión:", err));*/


// 🟢 ROOT
app.get("/", (req, res) => {
    res.send("API Node.js + SQL funcionando 🚀");
});


// 🔹 GET USERS
app.get("/users", async (req, res) => {
    try {
        const result = await sql.query`SELECT UserID, Name, Email FROM Users`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🔹 GET USER BY ID
app.get("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await sql.query`SELECT UserID, Name, Email FROM Users WHERE UserID=${id}`;
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🔹 CREATE USER
app.post("/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        await sql.query`
            INSERT INTO Users (Name, Email, PasswordHash)
            VALUES (${name}, ${email}, ${password})
        `;

        res.send("Usuario creado");
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🔹 DELETE USER
app.delete("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await sql.query`
            DELETE FROM Users WHERE UserID=${id}
        `;

        res.send("Usuario eliminado");
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// 🚀 levantar servidor
app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor corriendo en puerto 3000");
});
