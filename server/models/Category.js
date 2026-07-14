const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    parent: {
      type: String,
      default: null,
      trim: true,
    },
    icon: {
      type: String,
      default: 'FaShoppingBag',
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug automatically from name
categorySchema.pre('save', function () {
  if (!this.isModified('name')) {
    return;
  }
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
});

module.exports = mongoose.model('Category', categorySchema);
