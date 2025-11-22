const Notification = require('../models/notification.model');

exports.createNotification = async (req, res) => {
  try {
    const { user_id, event_id, title, message } = req.body;
    const notif = await Notification.create({ user_id, event_id, title, message });
    res.status(201).json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const notifs = await Notification.getByUser(user_id);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.update(id, req.body);
    res.json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.delete(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
