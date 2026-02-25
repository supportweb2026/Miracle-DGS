const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false,
      },
  message: String,
  type: String, 
  user: String, 
  relatedId: mongoose.Schema.Types.ObjectId, 
  relatedType: String, 
  notified: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }, 
});
notificationSchema.index(
    { relatedId: 1, user: 1, relatedType: 1 },
    { unique: true }
  );
//const Notification = mongoose.model('Notification', notificationSchema);
module.exports = mongoose.model('Notification', notificationSchema);

//module.exports = Notification;
