document.addEventListener('DOMContentLoaded', function() {
    // Инициализация слайдера новостей
    if (document.querySelector('.news-swiper')) {
        const newsSwiper = new Swiper('.news-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                },
                992: {
                    slidesPerView: 3,
                }
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
        });
    }
    
    // Анимация для социальных иконок
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
        icon.style.animationDelay = `${index * 0.1}s`;
        if (icon.classList) {
            icon.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
    
    // Инициализация табов для турниров
    const triggerTabList = [].slice.call(document.querySelectorAll('#tournamentsTab button'));
    if (triggerTabList.length > 0) {
        triggerTabList.forEach(function (triggerEl) {
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                
                // Находим активный таб
                const activeTab = document.querySelector('#tournamentsTab .active');
                if (activeTab) {
                    activeTab.classList.remove('active');
                    activeTab.setAttribute('aria-selected', 'false');
                }
                
                // Активируем новый таб
                triggerEl.classList.add('active');
                triggerEl.setAttribute('aria-selected', 'true');
                
                // Скрываем активную панель
                const activePane = document.querySelector('.tab-pane.show.active');
                if (activePane) {
                    activePane.classList.remove('show', 'active');
                }
                
                // Показываем новую панель
                const targetId = triggerEl.getAttribute('data-bs-target');
                const targetPane = document.querySelector(targetId);
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                }
            });
        });
    }
});