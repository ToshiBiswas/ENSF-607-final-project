const express = require('express');
const router = express.Router();
const userPreferenceController = require('../controllers/preference.controller');

router.post('/', userPreferenceController.create);
router.get('/', userPreferenceController.getAll);
router.get('/:userId', userPreferenceController.getByUserId);
router.put('/:userId', userPreferenceController.update);
router.delete('/:userId', userPreferenceController.delete);

module.exports = router;
