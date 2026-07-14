const Category = require('../models/Category');

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ parent: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, parent, icon, image } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const category = new Category({
      name: name.trim(),
      parent: parent ? parent.trim() : null,
      icon: icon || 'FaShoppingBag',
      image: image || '',
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, parent, icon, image } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
      const oldName = category.name;
      
      category.name = name !== undefined ? name.trim() : category.name;
      category.parent = parent !== undefined ? (parent ? parent.trim() : null) : category.parent;
      category.icon = icon !== undefined ? icon : category.icon;
      category.image = image !== undefined ? image : category.image;

      const updatedCategory = await category.save();

      // Cascade rename: if parent name changed, update all child subcategories that refer to oldName
      if (name && oldName !== name.trim()) {
        await Category.updateMany({ parent: oldName }, { parent: name.trim() });
      }

      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      const catName = category.name;
      await Category.findByIdAndDelete(req.params.id);

      // Cascade reset: if a parent category is deleted, update all its child subcategories to have parent: null
      await Category.updateMany({ parent: catName }, { parent: null });

      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
