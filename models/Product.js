const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value >= this.price;
      },
      message: 'Compare price should be greater than or equal to the selling price'
    }
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: {
      values: [
        'electronics',
        'clothing',
        'books',
        'home',
        'sports',
        'beauty',
        'toys',
        'automotive',
        'health',
        'food',
        'other'
      ],
      message: 'Please select a valid category'
    }
  },
  brand: {
    type: String,
    required: [true, 'Please provide a brand name'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Please provide a SKU'],
    unique: true,
    uppercase: true,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ sku: 1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= 5) return 'low-stock';
  return 'in-stock';
});

// Static method to get products with filters
productSchema.statics.getProductsWithFilters = function(filters = {}) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    featured,
    search,
    page = 1,
    limit = 10,
    sort = '-createdAt'
  } = filters;

  const query = { isActive: true };

  // Apply filters
  if (category) query.category = category;
  if (brand) query.brand = new RegExp(brand, 'i');
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }
  if (inStock) query.stock = { $gt: 0 };
  if (featured) query.isFeatured = true;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');
};

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      // Set first image as primary if no primary image is set
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Ensure only the first primary image remains primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === this.images.findIndex(i => i.isPrimary);
      });
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);