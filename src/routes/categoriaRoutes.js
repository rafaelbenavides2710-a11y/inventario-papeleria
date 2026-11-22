const express = require('express');
const categoriaController = require('../controllers/categoriaController');

const router = express.Router();

router.get('/', categoriaController.list);
router.post('/', categoriaController.create);
router.get('/:id/editar', categoriaController.editForm);
router.post('/:id', categoriaController.update);
router.post('/:id/eliminar', categoriaController.destroy);

module.exports = router;
