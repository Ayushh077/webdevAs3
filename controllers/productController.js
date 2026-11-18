const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    let queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    if (req.query.search) {
      queryObj.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    let query = Product.find(queryObj);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments(queryObj);
    query = query.skip(skip).limit(limit);

    const products = await query;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ total, page, totalPages, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted', id: product._id });
  } catch (error) {
    next(error);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    });
    res.status(200).json({ count: lowStockItems.length, lowStockItems });
  } catch (error) {
    next(error);
  }
};

exports.getInventorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);
    res.status(200).json({ categories: summary.length, summary });
  } catch (error) {
    next(error);
  }
};

exports.updateStockLevel = async (req, res, next) => {
  try {
    const { change } = req.body;
    if (typeof change !== 'number') {
      return res.status(400).json({ message: 'Change value must be a number' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const newQuantity = product.quantity + change;
    if (newQuantity < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({ message: 'Stock updated', product });
  } catch (error) {
    next(error);
  }
};