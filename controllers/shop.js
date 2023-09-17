const fs = require('fs')
const path = require('path')
const PdfMaker = require('pdfkit')

const Product = require('../models/product')
const Order = require('../models/order')
const User = require('../models/user')

exports.getProducts = (req, res, next) => {
  const ITEMS_PER_PAGE = 3
  let totalCount;
  const page = (req.query.page)?+req.query.page:1
  Product.find().countDocuments()
  .then(totalProduct => {
    totalCount = totalProduct
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  })
  .then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      page: {
        previousPage: page - 1,
        currentPage: page,
        nextPage: page + 1,
        hasNextPage: page*ITEMS_PER_PAGE < totalCount,
        hasPreviousPage: page > 1,
        lastPage: Math.ceil(totalCount/ITEMS_PER_PAGE)
      }
    });
  })
  .catch(err => next(err))
}

exports.getProduct = (req, res, next) => {
  let prodId = req.params.productId
  Product.findById(prodId)
    .then(product => {
      res.render('../views/shop/product-detail.ejs', { product: product, pageTitle: product.title, path: '/products', isAuthenticated : req.session.isAuthenticated })
    })
    .catch(err => next(err))
}


exports.getIndex = (req, res, next) => {
  const ITEMS_PER_PAGE = 3
  let totalCount;
  const page = (req.query.page)?+req.query.page:1
  Product.find().countDocuments()
  .then(totalProduct => {
    totalCount = totalProduct
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  })
  .then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      page: {
        previousPage: page - 1,
        currentPage: page,
        nextPage: page + 1,
        hasNextPage: page*ITEMS_PER_PAGE < totalCount,
        hasPreviousPage: page > 1,
        lastPage: Math.ceil(totalCount/ITEMS_PER_PAGE)
      }
    });
  })
  .catch(err => next(err))
};



exports.getCart = async (req, res, next) => {
  try {
    let cartProducts = await req.user.populate('cart.items.productId')
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: cartProducts.cart.items
    })
  } catch (error) {
    next(error);
  }
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId
  req.user.addToCart(productId)
    .then(result => {
      res.redirect('/cart')
    })
    .catch(err => next(err))
}



exports.deleteCartItem = (req, res, next) => {
  const productId = req.body.productId
  req.user.deleteCartById(productId)
    .then(result => {
      res.redirect('./cart')
    })
    .catch(err => next(err))
}



exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user})
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders
    });
  })
  .catch(err => next(err))
};

exports.postOrders = async (req, res, next) => {
  const reqUser = await req.user.populate('cart.items.productId')
  const products = reqUser.cart.items.map(p => {
    return { qty: p.qty, product: p.productId}
  })
  const order = new Order({
    products: products,
    user: {
      email: req.user.email,
      userId: req.user._id
    }
  })
  order.save()
  .then(result => {
    return User.findById(req.user.id)
  })
  .then(user => {
    user.cart.items = []
    return user.save()
  })
  .then(result => {
    res.redirect('/orders')
  })
  .catch(err => next(err))
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  Order.findById(orderId)
  .then(order => {
    if(!order){
      return next(new Error('Order not Found'))
    }
    else if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Not Authorized User'))
    }
    else{
      const fileName = 'invoice-' +orderId+ '.pdf'
      const filePath = path.join('data', 'invoices', fileName)
      // fs.readFile(filePath, (err, file)=>{
        // if(err)return next(err)
        // res.setHeader('Content-Type', 'applicaton/pdf')
        // res.setHeader('Content-Disposition', `inline; filename=${fileName}`)
      //   res.send(file)
      // })
      // ---------------------------------OR---------------------------------
      // const file = fs.createReadStream(filePath)
      // res.setHeader('Content-Type', 'applicaton/pdf')
      // res.setHeader('Content-Disposition', `inline; filename=${fileName}`)
      // file.pipe(res)
      // ---------------------------------OR---------------------------------
      const pdfDoc = new PdfMaker()

      res.setHeader('Content-Type', 'applicaton/pdf')
      res.setHeader('Content-Disposition', `inline; filename=${fileName}`)

      pdfDoc.pipe(fs.createWriteStream(filePath))
      pdfDoc.pipe(res)

      pdfDoc.fontSize(26).text('INVOICE', {underline: true}).text('---------------------------')
      let totalPrice = 0
      order.products.forEach(prod => {
        totalPrice += prod.qty * prod.product.price
        pdfDoc.text(`${prod.product.title} - ${prod.qty} * $${prod.product.price}`)
      })
      pdfDoc.fontSize(20).text(`-----------------\nTotalPrice: $${totalPrice}`)
      pdfDoc.end()
    }
  }).catch(err => next(err))
}
