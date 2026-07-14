const Product = require('../models/Product');
const Category = require('../models/Category');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseMultiParam = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .flatMap(item => String(item).split(','))
      .map(item => item.trim())
      .filter(item => item && item.toLowerCase() !== 'all');
  }
  return String(val)
    .split(',')
    .map(item => item.trim())
    .filter(item => item && item.toLowerCase() !== 'all');
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      categories,
      brand,
      brands,
      minPrice,
      maxPrice,
      rating,
      stock,
      discount,
      sort,
      featured,
      trending,
      bestSeller,
      newArrival,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // 1. Search / Keyword Match (Name, Brand, Description, Category)
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // 2. Multi-Select Category Filter ($in)
    const rawCategories = parseMultiParam(categories || category);
    if (rawCategories.length > 0) {
      const dbCategories = await Category.find({});
      const searchCategories = [];

      rawCategories.forEach((catItem) => {
        const matchedDbCat = dbCategories.find(
          (c) =>
            c.name.toLowerCase() === catItem.toLowerCase() ||
            (c.slug && c.slug.toLowerCase() === catItem.toLowerCase())
        );

        if (matchedDbCat) {
          searchCategories.push(matchedDbCat.name);
          const subCats = dbCategories.filter((c) => c.parent === matchedDbCat.name);
          subCats.forEach((sub) => searchCategories.push(sub.name));
        } else {
          searchCategories.push(catItem);
        }
      });

      const uniqueCategoryNames = [...new Set(searchCategories)];
      query.category = {
        $in: uniqueCategoryNames.map((name) => new RegExp(`^${escapeRegex(name)}$`, 'i')),
      };
    }

    // 2b. Boolean Flag Filters
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }
    if (trending === 'true' || trending === true) {
      query.trending = true;
    }
    if (bestSeller === 'true' || bestSeller === true) {
      query.bestSeller = true;
    }
    if (newArrival === 'true' || newArrival === true) {
      query.newArrival = true;
    }

    // 3. Multi-Select Brand Filter ($in)
    const rawBrands = parseMultiParam(brands || brand);
    if (rawBrands.length > 0) {
      const uniqueBrands = [...new Set(rawBrands)];
      query.brand = {
        $in: uniqueBrands.map((bName) => new RegExp(`^${escapeRegex(bName)}$`, 'i')),
      };
    }

    // 4. Price Range Filter ($gte and $lte)
    const minP = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : undefined;
    const maxP = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : undefined;
    if ((minP !== undefined && !isNaN(minP)) || (maxP !== undefined && !isNaN(maxP))) {
      query.price = {};
      if (minP !== undefined && !isNaN(minP)) query.price.$gte = minP;
      if (maxP !== undefined && !isNaN(maxP)) query.price.$lte = maxP;
    }

    // 5. Rating Filter ($gte)
    if (rating !== undefined && rating !== '' && !isNaN(Number(rating)) && Number(rating) > 0) {
      query.rating = { $gte: Number(rating) };
    }

    // 6. Stock Filter
    if (stock) {
      if (stock === 'inStock') {
        query.stock = { $gt: 0 };
      } else if (stock === 'outOfStock') {
        query.stock = 0;
      }
    }

    // 6b. Discount Filter
    if (discount === 'true' || discount === true) {
      query.discountPercentage = { $gt: 0 };
    }

    // 7. Sort Options
    let sortQuery = {};
    if (sort) {
      if (sort === 'priceAsc' || sort === 'price-low-high') {
        sortQuery.price = 1;
      } else if (sort === 'priceDesc' || sort === 'price-high-low') {
        sortQuery.price = -1;
      } else if (sort === 'ratingDesc' || sort === 'highest-rated') {
        sortQuery.rating = -1;
      } else if (sort === 'newest') {
        sortQuery.createdAt = -1;
      } else if (sort === 'bestSelling' || sort === 'best-selling') {
        sortQuery.numReviews = -1;
      } else {
        sortQuery.createdAt = -1;
      }
    } else {
      sortQuery.createdAt = -1; // Default: newest
    }

    // 8. Pagination Calculations
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skipNum = (pageNum - 1) * limitNum;

    // Count total matched documents
    const totalCount = await Product.countDocuments(query);
    
    // Execute query with sort, skip, limit
    const products = await Product.find(query)
      .sort(sortQuery)
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      totalProducts: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      image,
      stock,
      rating,
      numReviews,
      tag,
      featured,
      trending,
      bestSeller,
      newArrival,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      brand,
      image,
      stock,
      rating: rating || 0,
      numReviews: numReviews || 0,
      tag: tag || '',
      featured: featured || false,
      trending: trending || false,
      bestSeller: bestSeller || false,
      newArrival: newArrival || false,
    });

    const createdProduct = await product.save();
    
    // Notify admin dashboard
    const { createAdminNotification } = require('./adminController');
    await createAdminNotification(
      req,
      'Product Created',
      `New product "${createdProduct.name}" added to inventory.`,
      'success',
      '/admin/products',
      createdProduct._id
    );

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      image,
      stock,
      rating,
      numReviews,
      tag,
      featured,
      trending,
      bestSeller,
      newArrival,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name !== undefined ? name : product.name;
      product.description = description !== undefined ? description : product.description;
      product.price = price !== undefined ? price : product.price;
      product.category = category !== undefined ? category : product.category;
      product.brand = brand !== undefined ? brand : product.brand;
      product.image = image !== undefined ? image : product.image;
      product.stock = stock !== undefined ? stock : product.stock;
      product.rating = rating !== undefined ? rating : product.rating;
      product.numReviews = numReviews !== undefined ? numReviews : product.numReviews;
      product.tag = tag !== undefined ? tag : product.tag;
      product.featured = featured !== undefined ? featured : product.featured;
      product.trending = trending !== undefined ? trending : product.trending;
      product.bestSeller = bestSeller !== undefined ? bestSeller : product.bestSeller;
      product.newArrival = newArrival !== undefined ? newArrival : product.newArrival;

      const updatedProduct = await product.save();
      
      // Notify admin dashboard
      const { createAdminNotification } = require('./adminController');
      
      // If stock dropped to zero
      if (stock === 0 || stock === '0') {
        await createAdminNotification(
          req,
          'Out of Stock',
          `"${updatedProduct.name}" is now out of stock.`,
          'danger',
          '/admin/inventory',
          updatedProduct._id
        );
      } else if (req.app.get('io')) {
        // Just emit dashboard update without a persistent notification for a simple edit
        req.app.get('io').emit('dashboard-update');
      }

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ trending: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNewArrivalsProducts = async (req, res) => {
  try {
    const products = await Product.find({ newArrival: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBestSellersProducts = async (req, res) => {
  try {
    const products = await Product.find({ bestSeller: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getTrendingProducts,
  getNewArrivalsProducts,
  getBestSellersProducts,
  getFeaturedProducts,
};
