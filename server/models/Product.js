const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
    },
    subcategory: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
    },
    image: {
      type: String,
      required: [true, 'Please add an image URL'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock count'],
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    tag: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function () {
  // Sync flags to tag
  if (this.featured) {
    this.tag = 'featured';
  } else if (this.trending) {
    this.tag = 'trending';
  } else if (this.bestSeller) {
    this.tag = 'best-seller';
  } else if (this.newArrival) {
    this.tag = 'new-arrival';
  } else if (['featured', 'trending', 'best-seller', 'new-arrival'].includes(this.tag)) {
    this.tag = '';
  }

  // Sync tag to flags
  if (this.tag === 'featured') this.featured = true;
  if (this.tag === 'trending') this.trending = true;
  if (this.tag === 'best-seller') this.bestSeller = true;
  if (this.tag === 'new-arrival') this.newArrival = true;
});

module.exports = mongoose.model('Product', productSchema);
