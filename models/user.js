const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                qty: { type: Number, required: true }
            }
        ]
    }
})

userSchema.methods.addToCart = function (productId) {
    // this.cart = (this.cart)?this.cart:{items: []}
    const cartProductIndex = this.cart.items.findIndex(cp => cp.productId.toString() === productId.toString())
    const newCart = this.cart.items
    
    if (cartProductIndex >= 0) {
        newCart[cartProductIndex].qty += 1
    }
    else {
        const newCartItem = { productId: productId, qty: 1 }
        newCart.push(newCartItem)
    }
    this.cart.items = newCart
    return this.save()
}

userSchema.methods.deleteCartById = function(productId){
    this.cart.items = this.cart.items.filter(p=>{
        return p.productId.toString() !== productId.toString()
    })
    return this.save()
}

module.exports = mongoose.model('User', userSchema)
