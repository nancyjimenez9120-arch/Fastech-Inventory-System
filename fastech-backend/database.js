const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'fastech_user',      
    password: 'nancy123',
    database: 'fastech_db'
});

db.connect(err => {
    if (err) console.error("❌ Error conectando a MySQL:", err.message);
    else console.log("✅ Conectado a la base de datos fastech_db");
});

// 2. RUTA: Obtener todos los productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 3. RUTA: Agregar un nuevo producto
app.post('/productos', (req, res) => {
    const { nombre, precio, stock } = req.body;
    const query = 'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)';
    db.query(query, [nombre, precio, stock], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, nombre, precio, stock });
    });
});

// 4. RUTA: Actualizar stock Y registrar en el historial de ventas
app.put('/productos/:id', (req, res) => {
    const { id } = req.params;
    const { stock, nombre, precio, esCompra } = req.body; 

    // Primero actualizamos el stock del producto
    const queryUpdate = 'UPDATE productos SET stock = ? WHERE id = ?';
    db.query(queryUpdate, [stock, id], (err, result) => {
        if (err) return res.status(500).send(err);

        // Si la petición viene de una compra, guardamos el registro en la tabla 'ventas'
        if (esCompra) {
            const queryVenta = 'INSERT INTO ventas (producto_nombre, precio) VALUES (?, ?)';
            db.query(queryVenta, [nombre, precio], (errVenta) => {
                if (errVenta) console.error("❌ Error al registrar historial:", errVenta);
                else console.log(`🛒 Venta registrada: ${nombre} por $${precio}`);
            });
        }

        console.log(`✅ Stock actualizado para ID ${id}. Nuevo valor: ${stock}`);
        res.json({ message: "Stock actualizado correctamente" });
    });
});

// 5. RUTA: Obtener el historial de compras (NUEVA)
app.get('/ventas', (req, res) => {
    db.query('SELECT * FROM ventas ORDER BY fecha DESC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 6. RUTA: Eliminar un producto
app.delete('/productos/:id', (req, res) => {
    const idEliminar = req.params.id;
    db.query('DELETE FROM productos WHERE id = ?', [idEliminar], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Eliminado correctamente" });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));