const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');

router.post('/', notificationsController.createNotification);
router.get('/:user_id', notificationsController.getNotifications);
router.put('/:id', notificationsController.updateNotification);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
