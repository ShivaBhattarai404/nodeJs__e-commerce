const btn = Array.from(document.querySelectorAll('button[type="button"]'))

btn.forEach(btn => {
    let csrfToken = btn.parentElement.querySelector('input[name="_csrf"]').value
    btn.addEventListener('click', ()=> {
        fetch('/admin/delete-product/' +btn.value, {
            method: 'DELETE',
            headers: {
                'csrf-token': csrfToken
            }
        })
        .then((result) => {
            return result.json()
        })
        .then(data => {
            const parentElement = btn.closest('article')
            parentElement.parentElement.removeChild(parentElement)
            console.log(data);
        })
        .catch(console.log);
    })
});