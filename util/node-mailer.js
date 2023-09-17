const Sib = require('sib-api-v3-sdk')
Sib.ApiClient.instance.authentications['api-key'].apiKey = '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'

new Sib.TransactionalEmailsApi().sendTransacEmail({
    sender: {email: 'shivabhattarai150@gmail.com', name: 'Shiva'},
    to: [{email: 'srjyadav8010@gmail.com'}],
    subject: 'SignUp success',
    htmlContent: '<h1>Thank you for creating account with us</h1>'
})