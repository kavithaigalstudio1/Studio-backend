// simple_pages.js

function About() {
    return el('div', { className: 'page-container' },
        el('div', { className: 'portfolio-header-area', style: { position: 'absolute', top: '20px', left: '20px' } },
            el('a', { href: '#home', className: 'back-btn' }, el('i', { className: 'fa-solid fa-arrow-left' }), ' Back')
        ),
        el(Reveal, { animation: 'fade-up' }, el('h1', null, 'About Us')),
        el(Reveal, { animation: 'fade-up', delay: 200 }, el('p', null, 'About us coming soon...'))
    );
}


function Reservation() {
    return el('div', { className: 'page-container' },
        el('div', { className: 'portfolio-header-area', style: { position: 'absolute', top: '20px', left: '20px' } },
            el('a', { href: '#home', className: 'back-btn' }, el('i', { className: 'fa-solid fa-arrow-left' }), ' Back')
        ),
        el(Reveal, { animation: 'fade-up' }, el('h1', null, 'Reservation System')),
        el(Reveal, { animation: 'fade-up', delay: 200 }, el('p', null, 'Reservation system coming soon...'))
    );
}

function Contact() {
    return el('div', { className: 'page-container' },
        el('div', { className: 'portfolio-header-area', style: { position: 'absolute', top: '20px', left: '20px' } },
            el('a', { href: '#home', className: 'back-btn' }, el('i', { className: 'fa-solid fa-arrow-left' }), ' Back')
        ),
        el(Reveal, { animation: 'fade-up' }, el('h1', null, 'Contact')),
        el(Reveal, { animation: 'fade-up', delay: 200 }, el('p', null, 'Contact details coming soon...'))
    );
}
