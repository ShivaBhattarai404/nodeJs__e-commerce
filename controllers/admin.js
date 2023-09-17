const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const fs = require('fs')

const Product = require('../models/product')
const errorHandlerFunc = require('../controllers/error').errHandler

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
  // .select('title price -_id')
  // .populate('userId', 'name')
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  })
  .catch(err => next(err))
}


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationError: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = Number.parseFloat(req.body.price);
  const description = req.body.description;
  const error = validationResult(req)
  if(!error.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: error.array()[0].msg,
      validationError: error.array()
    });
  }
  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: "Uploaded file is not an image, Please upload .jpeg/.jpg/.png file",
      validationError: []
    });
  }
  const product = new Product({
    title: title,
    imageUrl: '\\' + image.path,
    price: price,
    description: description,
    userId: req.user
  })
  product.save()
  .then((result) => {
    res.redirect("/admin/products")
  })
  .catch(err => next(err))
}


exports.getEditProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findOne({_id: prodId, userId: req.user._id})
    .then(productData => {
      if (!productData) return res.redirect('/')
      res.render('admin/edit-product', {
        product: productData,
        pageTitle: 'Edit Product',
        path: '',
        editing: true,
        errorMessage: '',
        validationError: []
      })
    })
    .catch(err => next(err))
}

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId
  const updatedTitle = req.body.title
  const image = req.file
  const updatedDesc = req.body.description
  const updatedPrice = req.body.price

  const error = validationResult(req)
  if(!error.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: productId
      },
      errorMessage: error.array()[0].msg,
      validationError: error.array()
    });
  }
  Product.findById(productId)
    .then(product => {
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/admin/products')
      }
      product.title = updatedTitle
      product.description = updatedDesc
      product.price = updatedPrice
      if(image){
        fs.unlink(product.imageUrl.replace(/\\/, ''), err=>{
          if(err)next(err)
        })
        product.imageUrl = '\\'+image.path
        product.save()
        .then(result => {
          return res.redirect('/admin/products')
        })
      }
    })
    .catch(err => next(err))
}

exports.deleteProduct = (req, res, next) => {
  const deleteProductId = req.params.productId
  Product.findById(deleteProductId)
  .then(product => {
    fs.unlink(product.imageUrl.replace(/\\/, ''), err=>{
      if(err)next(err)
    })
    return Product.deleteOne({_id: deleteProductId, userId: req.user._id})
  })
  .then((result) => {
    res.status(200).json({message: 'Deletion Successful'})
  })
  .catch(err => res.status(500).json({message: 'Error Occured! Unable to delete'}))
}

