const express = require('express');
const productoController = require('../controllers/productoController');

const router = express.Router();

router.get('/', productoController.list);
router.get('/nuevo', productoController.newForm);
router.post('/', productoController.create);
router.get('/:id', productoController.detail);
router.get('/:id/editar', productoController.editForm);
router.post('/:id', productoController.update);
router.post('/:id/eliminar', productoController.destroy);

module.exports = router;
