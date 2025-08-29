const mongoose = require('mongoose');

const MovementLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Por favor ingrese una cantidad'],
    min: [1, 'La cantidad debe ser al menos 1']
  },
  lot: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  unitCost: {
    type: Number,
    min: [0, 'El costo unitario no puede ser negativo']
  },
  note: {
    type: String
  }
});

// Transformación toJSON para subdocumentos
MovementLineSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

const MovementSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['ingreso', 'egreso']
  },
  date: {
    type: Date,
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  warehouseName: {
    type: String,
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String
  },
  requestedBy: {
    type: String
  },
  lines: [MovementLineSchema],
  totalItems: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  cancellationReason: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date
  }
});

// Transformación toJSON para MovementSchema
MovementSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;

    // Aplica transformaciones a las líneas (subdocumentos)
    if (ret.lines && ret.lines.length) {
      ret.lines = ret.lines.map(line => {
        line.id = line._id;
        delete line._id;
        return line;
      });
    }
  }
});

module.exports = mongoose.model('Movement', MovementSchema);
