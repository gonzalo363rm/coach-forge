/**
 * Backend API para Coach Forge
 */

import express from 'express';
import cors from 'cors';
import { CanvasState } from '@coach-forge/shared';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (en producción usarías una base de datos)
const canvasStorage = new Map<string, CanvasState>();

// GET: Obtener canvas por ID
app.get('/api/canvas/:id', (req, res) => {
  const { id } = req.params;
  const canvas = canvasStorage.get(id);
  
  if (!canvas) {
    return res.status(404).json({ error: 'Canvas no encontrado' });
  }
  
  res.json(canvas);
});

// POST: Guardar canvas
app.post('/api/canvas', (req, res) => {
  const canvas: CanvasState = req.body;
  
  // Validación básica
  if (!canvas.elements || !Array.isArray(canvas.elements)) {
    return res.status(400).json({ error: 'Formato de canvas inválido' });
  }
  
  // Generar ID si no existe
  const id = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  canvasStorage.set(id, canvas);
  
  res.json({ id, ...canvas });
});

// PUT: Actualizar canvas existente
app.put('/api/canvas/:id', (req, res) => {
  const { id } = req.params;
  const canvas: CanvasState = req.body;
  
  if (!canvasStorage.has(id)) {
    return res.status(404).json({ error: 'Canvas no encontrado' });
  }
  
  canvasStorage.set(id, canvas);
  res.json({ id, ...canvas });
});

// DELETE: Eliminar canvas
app.delete('/api/canvas/:id', (req, res) => {
  const { id } = req.params;
  
  if (!canvasStorage.has(id)) {
    return res.status(404).json({ error: 'Canvas no encontrado' });
  }
  
  canvasStorage.delete(id);
  res.json({ message: 'Canvas eliminado' });
});

// GET: Listar todos los canvas
app.get('/api/canvas', (req, res) => {
  const canvases = Array.from(canvasStorage.entries()).map(([id, canvas]) => ({
    id,
    ...canvas,
  }));
  
  res.json(canvases);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});

