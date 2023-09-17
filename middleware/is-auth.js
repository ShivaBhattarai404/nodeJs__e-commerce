module.exports = (req, res, next) => {
    if(!req.session.isAuthenticated){
        return res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404', isAuthenticated: false });
    }
    next()
}