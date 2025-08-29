const mongoose = require('mongoose');

const KardexSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  movementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movement',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ingreso', 'egreso']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    required: true
  },
  lot: {
    type: String
  },
  unitCost: {
    type: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Transformación toJSON para KardexSchema
KardexSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Kardex', KardexSchema);
