const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const db = mysql.createConnection({
    host: 'bm6c4hi77lolsow1xqkv-mysql.services.clever-cloud.com',
    user: 'ujdr04hloket5rpm',
    password: 'mM7LNuJBkyp4IldjbdhQ',
    database: 'bm6c4hi77lolsow1xqkv',
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos de Clever Cloud.');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/editar_curso', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editar_curso.html'));
});

app.get('/grafico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'grafico.html'));
});

app.get('/centros', (req, res) => {
    const sql = `
        SELECT 
            centros.id AS centro_id, 
            centros.nombre AS centro_nombre, 
            centros.direccion, 
            centros.ciudad,
            cursos.id AS curso_id,
            cursos.nombre AS curso_nombre
        FROM centros
        LEFT JOIN cursos_centros ON centros.id = cursos_centros.centro_id
        LEFT JOIN cursos ON cursos_centros.curso_id = cursos.id
        ORDER BY centros.id;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los centros:', err);
            return res.status(500).send('Error al obtener los centros');
        }

        const centros = {};
        results.forEach(row => {
            if (!centros[row.centro_id]) {
                centros[row.centro_id] = {
                    id: row.centro_id,
                    nombre: row.centro_nombre,
                    direccion: row.direccion,
                    ciudad: row.ciudad,
                    cursos: []
                };
            }
            if (row.curso_id) {
                centros[row.centro_id].cursos.push({
                    id: row.curso_id,
                    nombre: row.curso_nombre
                });
            }
        });

        res.json(Object.values(centros));
    });
});

app.get('/cursos/:id/alumnos', (req, res) => {
    const cursoId = req.params.id;
    const sql = `
        SELECT alumnos.id, alumnos.nombre, alumnos.email, alumnos.estado 
        FROM alumnos 
        WHERE curso_id = ?;
    `;

    db.query(sql, [cursoId], (err, results) => {
        if (err) {
            console.error('Error al obtener los alumnos:', err);
            return res.status(500).send('Error al obtener los alumnos');
        }
        res.json(results);
    });
});

app.delete('/alumnos/:id', (req, res) => {
    const alumnoId = req.params.id;
    const sql = 'DELETE FROM alumnos WHERE id = ?';

    db.query(sql, [alumnoId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el alumno:', err);
            return res.status(500).send('Error al eliminar el alumno');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Alumno no encontrado');
        }
        res.send('Alumno eliminado correctamente');
    });
});

app.get('/cursos/ratios', (req, res) => {
    const sql = `
        SELECT 
            cursos.id AS curso_id,
            cursos.nombre AS curso_nombre,
            COUNT(alumnos.id) AS total_matriculados,
            SUM(CASE WHEN alumnos.estado = 'Aprobado' THEN 1 ELSE 0 END) AS total_aprobados
        FROM cursos
        LEFT JOIN alumnos ON cursos.id = alumnos.curso_id
        GROUP BY cursos.id, cursos.nombre
        ORDER BY cursos.id;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los ratios:', err);
            return res.status(500).send('Error al obtener los ratios');
        }
        res.json(results);
    });
});

app.get('/cursos/:id', (req, res) => {
    const cursoId = req.params.id;
    const sql = 'SELECT * FROM cursos WHERE id = ?';

    db.query(sql, [cursoId], (err, result) => {
        if (err) {
            console.error('Error al obtener el curso:', err);
            return res.status(500).send('Error al obtener el curso');
        }
        if (result.length === 0) {
            return res.status(404).send('Curso no encontrado');
        }
        res.json(result[0]);
    });
});

app.put('/cursos/:id', (req, res) => {
    const cursoId = req.params.id;
    const { nombre, descripcion, nivel, lugar, fecha_importacion } = req.body;

    const sql = `
        UPDATE cursos 
        SET nombre = ?, descripcion = ?, nivel = ?, lugar = ?, fecha_importacion = ?
        WHERE id = ?
    `;

    db.query(sql, [nombre, descripcion, nivel, lugar, fecha_importacion, cursoId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el curso:', err);
            return res.status(500).send('Error al actualizar el curso');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Curso no encontrado');
        }
        res.send('Curso actualizado correctamente');
    });
});


app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
