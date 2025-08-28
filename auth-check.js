if (!sessionStorage.getItem('authenticated') && !window.location.pathname.includes('auth.html')) {
    window.location.href = 'auth.html';
}
