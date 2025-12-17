const mongoose = require('mongoose');

const FavoriteSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locationId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// 创建复合索引，确保同一用户对同一地点只能收藏一次
FavoriteSchema.index({ userId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);

