const express = require('express');
const path = require('path');
const { check, body } = require('express-validator')

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth')

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product',[
  body('title', 'Title should be 3 character long').isString().isLength({ min: 3 }).trim(),
  body('price', 'Price should have decimal value').isFloat(),
  body('description', 'Length of description must be between 5-400 character').isLength({ min: 5, max: 400 }).trim()
],
   isAuth, adminController.postAddProduct);

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)

router.post('/edit-product',[
  body('title', 'Title should be 3 character long').isString().isLength({ min: 3 }).trim(),
  body('price', 'Price should have decimal value').isFloat(),
  body('description', 'Length of description must be between 5-400 character').isLength({ min: 5, max: 400 }).trim()
],
 isAuth, adminController.postEditProduct)

router.delete('/delete-product/:productId', isAuth, adminController.deleteProduct)

module.exports = router;
